import { NextRequest, NextResponse } from 'next/server'
import { drive } from '@/lib/google-drive'

/**
 * Image Proxy API Route
 * 
 * This API serves as a proxy for Google Drive images to solve CORS issues.
 * Google Drive images can't be loaded directly in <img> tags due to CORS restrictions,
 * so this endpoint fetches the image server-side and streams it to the client.
 * 
 * Route: /api/google-drive/image/[fileId]
 * Method: GET
 * Returns: Image binary data with proper headers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
): Promise<NextResponse> {
  try {
    const { fileId } = await params
    const { searchParams } = new URL(request.url)
    const size = searchParams.get('size') // 'thumbnail' or 'full'
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // For thumbnails, try to get Google Drive's built-in thumbnail first
    if (size === 'thumbnail') {
      try {
        console.log(`🖼️ Fetching thumbnail for file: ${fileId}`)
        const thumbnailResponse = await drive.files.get({
          fileId: fileId,
          alt: 'media'
        }, {
          responseType: 'stream'
        })

        // Get file metadata for content type
        const metadata = await drive.files.get({
          fileId: fileId,
          fields: 'mimeType'
        })

        const contentType = metadata.data.mimeType || 'image/jpeg'
        const chunks: Buffer[] = []
        
        return new Promise<NextResponse>((resolve, reject) => {
          thumbnailResponse.data.on('data', (chunk: Buffer) => {
            chunks.push(chunk)
          })
          
          thumbnailResponse.data.on('end', () => {
            const buffer = Buffer.concat(chunks)
            
            resolve(new NextResponse(buffer, {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=2592000', // Cache thumbnails for 30 days
                'Access-Control-Allow-Origin': '*',
              },
            }))
          })
          
          thumbnailResponse.data.on('error', (error: Error) => {
            console.error('Error streaming thumbnail:', error)
            reject(new NextResponse('Error loading thumbnail', { status: 500 }))
          })
        })
      } catch (thumbnailError) {
        console.log(`❌ Thumbnail failed for ${fileId}:`, thumbnailError)
        // Fall through to full image logic
      }
    }

    // Fetch the actual image file from Google Drive
    console.log(`🖼️ Fetching ${size || 'full'} image for file: ${fileId}`)
    
    // First check if file exists and is accessible
    try {
      const metadata = await drive.files.get({
        fileId: fileId,
        fields: 'mimeType, name, size'
      })
      
      console.log(`📄 File metadata:`, {
        name: metadata.data.name,
        mimeType: metadata.data.mimeType,
        size: metadata.data.size
      })
      
      // Check if it's actually an image
      if (!metadata.data.mimeType?.startsWith('image/')) {
        console.log(`❌ File ${fileId} is not an image: ${metadata.data.mimeType}`)
        return NextResponse.json(
          { error: 'File is not an image' },
          { status: 400 }
        )
      }
    } catch (metadataError) {
      console.error(`❌ Cannot access file ${fileId}:`, metadataError)
      return NextResponse.json(
        { error: 'File not accessible or does not exist' },
        { status: 404 }
      )
    }

    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media' // Get file content, not metadata
    }, {
      responseType: 'stream'
    })

    // Get file metadata to determine the correct content type
    const metadata = await drive.files.get({
      fileId: fileId,
      fields: 'mimeType'
    })

    const contentType = metadata.data.mimeType || 'image/jpeg'

    // Stream the image data and convert to buffer
    const chunks: Buffer[] = []
    
    return new Promise<NextResponse>((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })
      
      response.data.on('end', () => {
        const buffer = Buffer.concat(chunks)
        
        resolve(new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': size === 'thumbnail' ? 'public, max-age=2592000' : 'public, max-age=31536000', // Cache thumbnails for 30 days, full images for 1 year
            'Access-Control-Allow-Origin': '*',
          },
        }))
      })
      
      response.data.on('error', (error: Error) => {
        console.error('Error streaming file:', error)
        reject(new NextResponse('Error loading image', { status: 500 }))
      })
    })

  } catch (error) {
    console.error('Error fetching image:', error)
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    )
  }
}