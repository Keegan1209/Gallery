import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
                const updateData: any = {
                    cover_image: dataUrl,
                    updated_at: new Date()
                }

                const createData: any = {
                    google_folder_id: folderId,
                    name: 'Untitled Folder',
                    cover_image: dataUrl,
                    is_active: true
                }

                await prisma.category.upsert({
                    where: { google_folder_id: folderId },
                    update: updateData,
                    create: createData
                })
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
            const category = await prisma.category.findFirst({
                where: { google_folder_id: folderId }
            })

            if (category && (category as any).cover_image) {
                return NextResponse.json({
                    success: true,
                    coverUrl: (category as any).cover_image,
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
            const updateData: any = {
                cover_image: null,
                updated_at: new Date()
            }

            await prisma.category.updateMany({
                where: { google_folder_id: folderId },
                data: updateData
            })

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