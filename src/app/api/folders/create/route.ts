import { NextRequest, NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/google-drive'
import { createFolder } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Folder name is required' },
        { status: 400 }
      )
    }
    
    console.log(`🔄 Creating folder: ${name}`)
    
    // 1. Create folder in Google Drive
    const googleFolder = await GoogleDriveService.createFolder(name)
    
    if (!googleFolder.id) {
      throw new Error('Failed to get folder ID from Google Drive')
    }
    
    console.log(`✅ Created Google Drive folder: ${googleFolder.id}`)
    
    // 2. Store folder info in database
    const dbFolder = await createFolder({
      name: name,
      description: description || `Photo collection: ${name}`,
      googleFolderId: googleFolder.id,
      folderPath: name
    })
    
    console.log(`✅ Saved folder to database: ${dbFolder.id}`)
    
    return NextResponse.json({
      success: true,
      folder: {
        id: googleFolder.id,
        name: googleFolder.name || name,
        description: description,
        createdTime: googleFolder.createdTime,
        dbId: dbFolder.id
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