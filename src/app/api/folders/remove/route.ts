import { NextRequest, NextResponse } from 'next/server'
import { findFolderByGoogleId, deleteFolder } from '@/lib/db'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { folderId } = body
    
    if (!folderId) {
      return NextResponse.json(
        { success: false, error: 'Folder ID is required' },
        { status: 400 }
      )
    }
    
    console.log(`🔄 Removing folder from gallery: ${folderId}`)
    
    try {
      // Find the folder in database
      const folder = await findFolderByGoogleId(folderId)
      
      if (folder) {
        // Remove from database (this only removes it from your gallery, not from Google Drive)
        await deleteFolder(folderId)
        
        console.log(`✅ Removed database folder from gallery: ${folder.name}`)
        
        return NextResponse.json({
          success: true,
          message: `Folder "${folder.name}" removed from gallery`
        })
      } else {
        // This might be a config folder - we can't delete those from the API
        // They need to be removed from the config file
        console.log(`⚠️ Folder ${folderId} not found in database - might be a config folder`)
        
        return NextResponse.json({
          success: false,
          error: 'This folder is configured in the system and cannot be deleted via the interface. Remove it from the configuration file instead.',
          isConfigFolder: true
        })
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database error occurred while trying to remove folder',
        message: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Error removing folder:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove folder',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}