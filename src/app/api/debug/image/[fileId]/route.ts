import { NextRequest, NextResponse } from 'next/server'
import { drive } from '@/lib/google-drive'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params
  
  try {
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 })
    }

    // Get file metadata
    const metadata = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, createdTime, parents'
    })

    // Check permissions
    const permissions = await drive.permissions.list({
      fileId: fileId,
      fields: 'permissions(id, type, role, emailAddress)'
    })

    return NextResponse.json({
      success: true,
      file: metadata.data,
      permissions: permissions.data.permissions,
      thumbnailUrl: `/api/google-drive/image/${fileId}?size=thumbnail`,
      fullUrl: `/api/google-drive/image/${fileId}`,
      directUrl: `https://drive.google.com/uc?id=${fileId}&export=view`
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fileId
    }, { status: 500 })
  }
}