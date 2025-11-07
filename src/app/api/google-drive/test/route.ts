import { NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/google-drive'

export async function GET() {
  try {
    console.log('🔄 Testing Google Drive connection...')
    
    // Test basic connection
    const result = await GoogleDriveService.testConnection()
    
    if (result.success) {
      console.log(`✅ Connected! Found ${result.folderCount} folders`)
      
      return NextResponse.json({
        success: true,
        message: `Successfully connected to Google Drive`,
        folderCount: result.folderCount,
        folders: (result.folders || []).slice(0, 5).map(folder => ({
          id: folder.id,
          name: folder.name,
          createdTime: folder.createdTime
        }))
      })
    } else {
      console.error('❌ Connection failed:', result.error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to connect to Google Drive',
          message: result.error
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Google Drive test failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test Google Drive connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}