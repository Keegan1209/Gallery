import { NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/google-drive'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔄 Fetching all folders...')

    // 1. Get folders from backend config
    const configFolders = await GoogleDriveService.getSelectedFolders()
    console.log(`📁 Config folders found: ${configFolders.length}`)

    // 2. Get folders from database (user-created)
    let dbFolders: any[] = []
    try {
      dbFolders = await prisma.category.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'desc' }
      })
      console.log(`🗄️ Database folders found: ${dbFolders.length}`)
      console.log(`📋 Database folder IDs:`, dbFolders.map(f => f.google_folder_id))
    } catch (dbError) {
      console.error('❌ Database error:', dbError)
      dbFolders = [] // Fallback to empty array
    }

    // 3. Combine and get details for all folders
    const allFolderIds = [
      ...configFolders.map(f => ({ id: f.id || '', source: 'config', data: f })),
      ...dbFolders.map(f => ({ id: f.google_folder_id || '', source: 'database', data: f }))
    ]

    // Remove duplicates (in case a folder is in both config and database)
    const uniqueFolders = allFolderIds.filter((folder, index, self) =>
      folder.id && index === self.findIndex(f => f.id === folder.id)
    )

    // 4. Get folder details with file counts
    const foldersWithDetails = await Promise.all(
      uniqueFolders.map(async (folderInfo) => {
        try {
          const files = await GoogleDriveService.listFilesInFolder(folderInfo.id)

          if (folderInfo.source === 'config') {
            const configData = folderInfo.data as any

            // Try to get cover image from database (will work after schema update)
            let coverImage = configData.coverImage || null

            return {
              id: folderInfo.id,
              name: configData.displayName || configData.name,
              description: configData.description,
              createdTime: configData.createdTime,
              fileCount: files.length,
              hasImages: files.some(file => file.mimeType?.startsWith('image/')),
              hasVideos: files.some(file => file.mimeType?.startsWith('video/')),
              coverImage: coverImage,
              source: 'config'
            }
          } else {
            const dbData = folderInfo.data as any
            
            // Get cover image using raw query since Prisma client has issues
            let coverImage = null
            try {
              const coverResult = await prisma.$queryRaw`
                SELECT cover_image FROM categories 
                WHERE google_folder_id = ${folderInfo.id}
              ` as any[]
              
              if (coverResult.length > 0 && coverResult[0].cover_image) {
                coverImage = coverResult[0].cover_image
                console.log(`🖼️ Found cover image for ${dbData.name}: ${coverImage.substring(0, 50)}...`)
              }
            } catch (error) {
              console.log(`⚠️ Could not get cover image for ${dbData.name}:`, error)
            }

            return {
              id: folderInfo.id,
              name: dbData.name,
              description: dbData.description,
              createdTime: dbData.created_at,
              fileCount: files.length,
              hasImages: files.some(file => file.mimeType?.startsWith('image/')),
              hasVideos: files.some(file => file.mimeType?.startsWith('video/')),
              coverImage: coverImage,
              source: 'database'
            }
          }
        } catch (error) {
          console.warn(`Could not get files for folder ${folderInfo.id}:`, error)
          return null
        }
      })
    )

    // Filter out failed folders
    const validFolders = foldersWithDetails.filter(folder => folder !== null)

    console.log(`✅ Found ${validFolders.length} total folders`)

    return NextResponse.json({
      success: true,
      folders: validFolders
    })
  } catch (error) {
    console.error('❌ Error fetching folders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch folders',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}