import { NextRequest, NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/google-drive'
import { findFolderByGoogleId, createFolder } from '@/lib/db'

function extractFolderIdFromUrl(url: string): string | null {
  const patterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /folders\/([a-zA-Z0-9-_]+)/
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, name, description } = body
    if (!url) {
      return NextResponse.json({ success: false, error: 'Google Drive URL is required' }, { status: 400 })
    }
    const folderId = extractFolderIdFromUrl(url)
    if (!folderId) {
      return NextResponse.json({ success: false, error: 'Invalid Google Drive URL' }, { status: 400 })
    }
    console.log('Adding folder:', folderId)
    const existingFolder = await findFolderByGoogleId(folderId)
    if (existingFolder) {
      return NextResponse.json({ success: false, error: 'This folder is already added' }, { status: 409 })
    }
    try {
      const folderInfo = await GoogleDriveService.listFilesInFolder(folderId)
      console.log('Accessed folder with', folderInfo.length, 'files')
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Cannot access folder' }, { status: 403 })
    }
    let folderName = name
    let folderCreatedTime = new Date().toISOString()
    try {
      const { drive } = await import('@/lib/google-drive')
      const folderMetadata = await drive.files.get({ fileId: folderId, fields: 'id, name, createdTime' })
      if (!folderName) folderName = folderMetadata.data.name || 'Untitled Folder'
      folderCreatedTime = folderMetadata.data.createdTime || folderCreatedTime
    } catch (error) {
      if (!folderName) folderName = 'Untitled Folder'
    }
    const dbFolder = await createFolder({ google_folder_id: folderId, name: folderName, description: description || 'Photo collection: ' + folderName })
    console.log('Added folder to database:', dbFolder.id)
    return NextResponse.json({ success: true, folder: { id: folderId, name: folderName, description, createdTime: folderCreatedTime, dbId: dbFolder.id }, message: 'Folder added successfully' })
  } catch (error) {
    console.error('Error adding folder:', error)
    return NextResponse.json({ success: false, error: 'Failed to add folder', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
