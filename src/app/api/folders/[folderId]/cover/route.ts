import { NextRequest, NextResponse } from 'next/server'
import { findFolderByGoogleId, updateFolder, createFolder, sql } from '@/lib/db'

export async function POST(
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

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { success: false, error: 'File must be an image' },
                { status: 400 }
            )
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'File size must be less than 5MB' },
                { status: 400 }
            )
        }

        console.log(`📸 Uploading cover image for folder: ${folderId}`)
        console.log(`📄 File details:`, {
            name: file.name,
            size: file.size,
            type: file.type
        })

        // Log file size in MB for easier debugging
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
        console.log(`📏 File size: ${sizeMB}MB`)

        // For now, we'll store the image as base64 in the database
        // In production, you'd want to use Supabase Storage or similar
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString('base64')
        const dataUrl = `data:${file.type};base64,${base64}`

        try {
            // Store in database
            console.log(`✅ Cover image processed for folder: ${folderId}`)
            console.log(`🔗 Generated data URL length: ${dataUrl.length} characters`)

            // Save to database
            try {
                const existingFolder = await findFolderByGoogleId(folderId)
                
                if (existingFolder) {
                    await updateFolder(folderId, { cover_image: dataUrl })
                } else {
                    await createFolder({
                        google_folder_id: folderId,
                        name: 'Untitled Folder',
                        cover_image: dataUrl
                    })
                }
                console.log(`💾 Cover image saved to database for folder: ${folderId}`)
            } catch (dbError) {
                console.error('Database save error:', dbError)
                // Continue anyway - the image will still work in the session
            }

            return NextResponse.json({
                success: true,
                coverUrl: dataUrl,
                fileName: file.name,
                fileSize: file.size,
                message: 'Cover image uploaded successfully'
            })
        } catch (dbError) {
            console.error('Database error:', dbError)

            // Fallback: return the data URL even if database fails
            return NextResponse.json({
                success: true,
                coverUrl: dataUrl,
                message: 'Cover image processed (database not available)'
            })
        }
    } catch (error) {
        console.error('Error uploading cover image:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to upload cover image',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

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

        try {
            // Try to get cover image from database
            const category = await findFolderByGoogleId(folderId)

            if (category && category.cover_image) {
                return NextResponse.json({
                    success: true,
                    coverUrl: category.cover_image,
                    fileName: 'cover-image',
                    fileSize: 0
                })
            } else {
                return NextResponse.json({
                    success: true,
                    coverUrl: null
                })
            }
        } catch (dbError) {
            console.error('Database error:', dbError)
            return NextResponse.json({
                success: true,
                coverUrl: null
            })
        }
    } catch (error) {
        console.error('Error fetching cover image:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch cover image',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

export async function DELETE(
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

        try {
            // Remove cover image from database
            await updateFolder(folderId, { cover_image: null })

            console.log(`🗑️ Cover image deleted for folder: ${folderId}`)

            return NextResponse.json({
                success: true,
                message: 'Cover image deleted successfully'
            })
        } catch (dbError) {
            console.error('Database error:', dbError)
            return NextResponse.json({
                success: false,
                error: 'Failed to delete cover image',
                message: dbError instanceof Error ? dbError.message : 'Unknown error'
            }, { status: 500 })
        }
    } catch (error) {
        console.error('Error deleting cover image:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete cover image',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}