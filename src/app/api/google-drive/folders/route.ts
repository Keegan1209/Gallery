import { NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/google-drive'

export async function GET() {
  try {
    console.log('🔄 Fetching selected Google Drive folders...')
    
    const folders = await GoogleDriveService.getSelectedFolders()
    
    // Get folder details with file counts
    const foldersWithDetails = await Promise.all(
      folders.map(async (folder) => {
        try {
          const files = await GoogleDriveService.listFilesInFolder(folder.id!)
          return {
            id: folder.id,
            name: folder.displayName || folder.name,
            originalName: folder.name,
            description: folder.description,
            createdTime: folder.createdTime,
            fileCount: files.length,
            hasImages: files.some(file => file.mimeType?.startsWith('image/')),
            hasVideos: files.some(file => file.mimeType?.startsWith('video/'))
          }
        } catch (error) {
          console.warn(`Could not get files for folder ${folder.name}:`, error)
          return {
            id: folder.id,
            name: folder.displayName || folder.name,
            originalName: folder.name,
            description: folder.description,
            createdTime: folder.createdTime,
            fileCount: 0,
            hasImages: false,
            hasVideos: false
          }
        }
      })
    )
    
    console.log(`✅ Found ${folders.length} selected folders with details`)
    
    return NextResponse.json({
      success: true,
      folders: foldersWithDetails
    })
  } catch (error) {
    console.error('❌ Error fetching selected folders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch selected Google Drive folders',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}