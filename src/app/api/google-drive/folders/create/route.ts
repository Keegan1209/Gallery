import { NextRequest, NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/google-drive'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, parentFolderId } = body
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Folder name is required' },
        { status: 400 }
      )
    }
    
    console.log(`🔄 Creating folder: ${name}`)
    
    const folder = await GoogleDriveService.createFolder(name, parentFolderId)
    
    console.log(`✅ Created folder: ${folder.name} (ID: ${folder.id})`)
    
    return NextResponse.json({
      success: true,
      folder: {
        id: folder.id,
        name: folder.name,
        createdTime: folder.createdTime
      },
      message: `Folder "${name}" created successfully`
    })
  } catch (error) {
    console.error('❌ Error creating folder:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create folder',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}