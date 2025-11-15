import { NextRequest, NextResponse } from 'next/server'
import { drive } from '@/lib/google-drive'
import sharp from 'sharp'
import heicConvert from 'heic-convert'

/**
 * Image Proxy API Route with Compression and HEIC Conversion
 * 
 * This API serves as a proxy for Google Drive images to solve CORS issues.
 * Google Drive images can't be loaded directly in <img> tags due to CORS restrictions,
 * so this endpoint fetches the image server-side, converts HEIC to JPEG, compresses it, 
 * and streams it to the client.
 * 
 * Route: /api/google-drive/image/[fileId]
 * Method: GET
 * Query Params: 
 *   - size: 'thumbnail' or 'full'
 *   - w: width for resizing (optional)
 *   - q: quality 1-100 (optional, default 90)
 * Returns: Compressed image binary data with proper headers
 * 
 * Supported formats: JPEG, PNG, WebP, HEIC/HEIF (auto-converted to JPEG)
 */

/**
 * Helper function to convert HEIC/HEIF to JPEG
 */
async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  try {
    console.log('🔄 Converting HEIC to JPEG...')
    const outputBuffer = await heicConvert({
      buffer: buffer as any,
      format: 'JPEG',
      quality: 1 // Max quality for conversion, we'll compress later
    })
    console.log('✅ HEIC conversion successful')
    return Buffer.from(outputBuffer)
  } catch (error) {
    console.error('❌ HEIC conversion failed:', error)
    throw error
  }
}

/**
 * Helper function to detect if file is HEIC/HEIF
 */
function isHeicFormat(mimeType: string | null | undefined, fileName: string | null | undefined): boolean {
  const heicMimeTypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']
  const heicExtensions = ['.heic', '.heif']
  
  const isMimeHeic = mimeType ? heicMimeTypes.includes(mimeType.toLowerCase()) : false
  const isExtensionHeic = fileName ? heicExtensions.some(ext => fileName.toLowerCase().endsWith(ext)) : false
  
  return isMimeHeic || isExtensionHeic
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
): Promise<NextResponse> {
  try {
    const { fileId } = await params
    const { searchParams } = new URL(request.url)
    const size = searchParams.get('size') // 'thumbnail' or 'full'
    const width = searchParams.get('w') ? parseInt(searchParams.get('w')!) : null
    const quality = searchParams.get('q') ? parseInt(searchParams.get('q')!) : 90
    
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
          
          thumbnailResponse.data.on('end', async () => {
            try {
              let buffer = Buffer.concat(chunks)
              
              // Get file metadata to check for HEIC
              const fileMetadata = await drive.files.get({
                fileId: fileId,
                fields: 'mimeType, name'
              })
              
              // Convert HEIC to JPEG if needed
              if (isHeicFormat(fileMetadata.data.mimeType, fileMetadata.data.name)) {
                console.log('🔄 Detected HEIC format in thumbnail, converting to JPEG...')
                buffer = await convertHeicToJpeg(buffer) as any
              }
              
              // Compress thumbnail with sharp
              let processedImage = sharp(buffer)
              
              if (width) {
                processedImage = processedImage.resize(width, null, {
                  fit: 'inside',
                  withoutEnlargement: true
                })
              }
              
              const compressedBuffer = await processedImage
                .jpeg({ quality, mozjpeg: true })
                .toBuffer()
              
              console.log(`✅ Thumbnail processed: ${compressedBuffer.length} bytes (quality: ${quality})`)
              
              resolve(new NextResponse(new Uint8Array(compressedBuffer), {
                headers: {
                  'Content-Type': 'image/jpeg',
                  'Cache-Control': 'public, max-age=2592000, immutable', // Cache thumbnails for 30 days
                  'Access-Control-Allow-Origin': '*',
                  'Content-Length': compressedBuffer.length.toString(),
                },
              }))
            } catch (compressionError) {
              console.error('Error compressing thumbnail:', compressionError)
              // Fallback to original buffer if compression fails
              const buffer = Buffer.concat(chunks)
              resolve(new NextResponse(buffer, {
                headers: {
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=2592000',
                  'Access-Control-Allow-Origin': '*',
                },
              }))
            }
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
    let fileName: string | null | undefined
    let fileMimeType: string | null | undefined
    
    try {
      const metadata = await drive.files.get({
        fileId: fileId,
        fields: 'mimeType, name, size'
      })
      
      fileName = metadata.data.name
      fileMimeType = metadata.data.mimeType
      
      console.log(`📄 File metadata:`, {
        name: fileName,
        mimeType: fileMimeType,
        size: metadata.data.size
      })
      
      // Check if it's actually an image (including HEIC)
      const isImage = fileMimeType?.startsWith('image/') || isHeicFormat(fileMimeType, fileName)
      
      if (!isImage) {
        console.log(`❌ File ${fileId} is not an image: ${fileMimeType}`)
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
      
      response.data.on('end', async () => {
        try {
          let buffer = Buffer.concat(chunks)
          
          // Convert HEIC to JPEG if needed
          if (isHeicFormat(fileMimeType, fileName)) {
            console.log('🔄 Detected HEIC format, converting to JPEG...')
            buffer = await convertHeicToJpeg(buffer) as any
          }
          
          // Compress image with sharp
          let processedImage = sharp(buffer)
          
          // Resize if width is specified
          if (width) {
            processedImage = processedImage.resize(width, null, {
              fit: 'inside',
              withoutEnlargement: true
            })
          }
          
          // Compress based on format
          const compressedBuffer = await processedImage
            .jpeg({ quality, mozjpeg: true })
            .toBuffer()
          
          const cacheMaxAge = size === 'thumbnail' ? 2592000 : 31536000
          
          console.log(`✅ Image processed: ${compressedBuffer.length} bytes (quality: ${quality})`)
          
          resolve(new NextResponse(new Uint8Array(compressedBuffer), {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': `public, max-age=${cacheMaxAge}, immutable`,
              'Access-Control-Allow-Origin': '*',
              'Content-Length': compressedBuffer.length.toString(),
              'Vary': 'Accept-Encoding',
            },
          }))
        } catch (compressionError) {
          console.error('Error compressing image:', compressionError)
          // Fallback to original buffer if compression fails
          const buffer = Buffer.concat(chunks)
          const cacheMaxAge = size === 'thumbnail' ? 2592000 : 31536000
          resolve(new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': `public, max-age=${cacheMaxAge}`,
              'Access-Control-Allow-Origin': '*',
            },
          }))
        }
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