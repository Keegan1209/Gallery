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
    
    console.log(`🔄 Fetching photos from folder: ${folderId}`)
    
    // Get all files from the folder
    const files = await GoogleDriveService.listFilesInFolder(folderId)
    
    // Filter for images and videos only
    const mediaFiles = files.filter(file => {
      const isMedia = file.mimeType?.startsWith('image/') || file.mimeType?.startsWith('video/')
      if (!isMedia) {
        console.log(`🚫 Skipping non-media file: ${file.name} (${file.mimeType})`)
      }
      return isMedia
    })
    
    console.log(`📊 Found ${files.length} total files, ${mediaFiles.length} media files`)
    
    // Transform to photo objects with proxied URLs
    const photos = mediaFiles.map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      thumbnailUrl: GoogleDriveService.getProxiedImageUrl(file.id!, 'thumbnail'),
      fullUrl: GoogleDriveService.getProxiedImageUrl(file.id!, 'full'),
      isVideo: file.mimeType?.startsWith('video/') || false,
      isImage: file.mimeType?.startsWith('image/') || false
    }))
    
    // Sort by creation date (newest first)
    photos.sort((a, b) => new Date(b.createdTime || '').getTime() - new Date(a.createdTime || '').getTime())
    
    console.log(`✅ Found ${photos.length} photos/videos in folder`)
    
    const response = NextResponse.json({
      success: true,
      photos,
      totalCount: photos.length,
      imageCount: photos.filter(p => p.isImage).length,
      videoCount: photos.filter(p => p.isVideo).length
    })
    
    // Add cache headers - cache for 10 minutes (photos don't change often)
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')
    
    return response
  } catch (error) {
    console.error('❌ Error fetching photos:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch photos from folder',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}