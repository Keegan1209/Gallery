import { NextRequest, NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/google-drive'
import { prisma } from '@/lib/prisma'

// Function to extract folder ID from Google Drive URL
function extractFolderIdFromUrl(url: string): string | null {
  // Handle different Google Drive URL formats:
  // https://drive.google.com/drive/folders/1ABC123XYZ
  // https://drive.google.com/drive/folders/1ABC123XYZ?usp=sharing
  // https://drive.google.com/drive/u/0/folders/1ABC123XYZ
  
  const patterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /folders\/([a-zA-Z0-9-_]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, name, description } = body
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Google Drive URL is required' },
        { status: 400 }
      )
    }
    
    // Extract folder ID from URL
    const folderId = extractFolderIdFromUrl(url)
    
    if (!folderId) {
      return NextResponse.json(
        { success: false, error: 'Invalid Google Drive URL. Please use a folder URL like: https://drive.google.com/drive/folders/...' },
        { status: 400 }
      )
    }
    
    console.log(`🔄 Adding folder: ${folderId}`)
    
    // Check if folder already exists in database
    const existingFolder = await prisma.category.findFirst({
      where: { google_folder_id: folderId }
    })
    
    if (existingFolder) {
      return NextResponse.json(
        { success: false, error: 'This folder is already added to your gallery' },
        { status: 409 }
      )
    }
    
    // Try to access the folder to verify it's shared with Service Account
    try {
      const folderInfo = await GoogleDriveService.listFilesInFolder(folderId)
      console.log(`✅ Successfully accessed folder with ${folderInfo.length} files`)
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot access this folder. Make sure it\'s shared with: keegan-driveapi@mythical-sweep-476412-u5.iam.gserviceaccount.com' 
        },
        { status: 403 }
      )
    }
    
    // Get folder metadata from Google Drive
    let folderName = name
    let folderCreatedTime = new Date().toISOString()
    
    try {
      const { drive } = await import('@/lib/google-drive')
      const folderMetadata = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, createdTime'
      })
      
      if (!folderName) {
        folderName = folderMetadata.data.name || 'Untitled Folder'
      }
      folderCreatedTime = folderMetadata.data.createdTime || folderCreatedTime
    } catch (error) {
      console.warn('Could not get folder metadata:', error)
      if (!folderName) {
        folderName = 'Untitled Folder'
      }
    }
    
    // Save folder to database
    const dbFolder = await prisma.category.create({
      data: {
        name: folderName,
        description: description || `Photo collection: ${folderName}`,
        google_folder_id: folderId,
        folder_path: folderName,
        is_active: true
      }
    })
    
    console.log(`✅ Added folder to database: ${dbFolder.id}`)
    
    return NextResponse.json({
      success: true,
      folder: {
        id: folderId,
        name: folderName,
        description: description,
        createdTime: folderCreatedTime,
        dbId: dbFolder.id
      },
      message: `Folder "${folderName}" added successfully`
    })
  } catch (error) {
    console.error('❌ Error adding folder:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add folder',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}