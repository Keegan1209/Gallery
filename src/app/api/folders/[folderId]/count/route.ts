import { NextRequest, NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/google-drive'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params

    if (!folderId) {
      return NextResponse.json(
        { success: false, error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    // Get files from Google Drive
    const files = await GoogleDriveService.listFilesInFolder(folderId)

    return NextResponse.json({
      success: true,
      fileCount: files.length,
      hasImages: files.some(file => file.mimeType?.startsWith('image/')),
      hasVideos: files.some(file => file.mimeType?.startsWith('video/'))
    })
  } catch (error) {
    console.error('Error fetching file count:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch file count',
        fileCount: 0
      },
      { status: 500 }
    )
  }
}
