import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { folderId, imageUrl } = await request.json()
    
    console.log(`🧪 Testing cover URL for folder: ${folderId}`)
    console.log(`🔗 Image URL: ${imageUrl}`)
    
    // Update the folder with the cover image URL
    const result = await prisma.category.updateMany({
      where: { google_folder_id: folderId },
      data: { 
        cover_image: imageUrl,
        updated_at: new Date()
      }
    })
    
    console.log(`✅ Updated ${result.count} records`)
    
    return NextResponse.json({
      success: true,
      message: `Cover image URL saved for folder ${folderId}`,
      updatedCount: result.count
    })
  } catch (error) {
    console.error('❌ Test cover URL error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}