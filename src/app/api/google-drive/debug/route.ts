import { NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/google-drive'

export async function GET() {
  try {
    console.log('🔍 Debugging Google Drive connection...')
    
    // Test 1: Basic connection
    const connectionTest = await GoogleDriveService.testConnection()
    console.log('Connection test:', connectionTest)
    
    // Test 2: List all accessible folders
    const allFolders = await GoogleDriveService.listFolders()
    console.log('All accessible folders:', allFolders.length)
    
    // Test 3: Try to access the specific folder
    const specificFolderId = "1MfuUIxwfzQoTzyYPG7FihAsj6fC7AELx"
    let specificFolderResult = null
    
    try {
      const { drive } = await import('@/lib/google-drive')
      const response = await drive.files.get({
        fileId: specificFolderId,
        fields: 'id, name, createdTime, parents, permissions'
      })
      specificFolderResult = response.data
      console.log('Specific folder access:', specificFolderResult)
    } catch (error) {
      console.error('Cannot access specific folder:', error)
      specificFolderResult = { error: error instanceof Error ? error.message : 'Unknown error' }
    }
    
    // Test 4: Check selected folders function
    let selectedFoldersResult = null
    try {
      selectedFoldersResult = await GoogleDriveService.getSelectedFolders()
      console.log('Selected folders result:', selectedFoldersResult)
    } catch (error) {
      console.error('Selected folders error:', error)
      selectedFoldersResult = { error: error instanceof Error ? error.message : 'Unknown error' }
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        connectionTest,
        allFoldersCount: allFolders.length,
        allFolders: allFolders.slice(0, 5), // First 5 folders
        specificFolder: specificFolderResult,
        selectedFolders: selectedFoldersResult,
        serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL
      }
    })
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}