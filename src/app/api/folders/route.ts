import { NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/google-drive'
import { getActiveFolders } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔄 Fetching all folders...')

    // 1. Get folders from backend config
    const configFolders = await GoogleDriveService.getSelectedFolders()
    console.log(`📁 Config folders found: ${configFolders.length}`)

    // 2. Get folders from database (user-created)
    let dbFolders: any[] = []
    try {
      dbFolders = await getActiveFolders()
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

    // 4. Get folder details WITHOUT file counts for fast loading
    // File counts will be loaded on-demand by the frontend
    const foldersWithDetails = uniqueFolders.map((folderInfo) => {
      try {
        if (folderInfo.source === 'config') {
          const configData = folderInfo.data as any

          return {
            id: folderInfo.id,
            name: configData.displayName || configData.name,
            description: configData.description,
            createdTime: configData.createdTime,
            fileCount: 0, // Will be loaded separately
            hasImages: false,
            hasVideos: false,
            coverImage: configData.coverImage || null,
            source: 'config'
          }
        } else {
          const dbData = folderInfo.data as any
          
          return {
            id: folderInfo.id,
            name: dbData.name,
            description: dbData.description,
            createdTime: dbData.created_at,
            entryDate: dbData.entry_date || null,
            fileCount: 0, // Will be loaded separately
            hasImages: false,
            hasVideos: false,
            coverImage: dbData.cover_image || null,
            source: 'database'
          }
        }
      } catch (error) {
        console.warn(`Could not process folder ${folderInfo.id}:`, error)
        return null
      }
    })

    // Filter out failed folders
    const validFolders = foldersWithDetails.filter(folder => folder !== null)

    console.log(`✅ Found ${validFolders.length} total folders`)

    const response = NextResponse.json({
      success: true,
      folders: validFolders
    })
    
    // No cache - always fetch fresh data
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    
    return response
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