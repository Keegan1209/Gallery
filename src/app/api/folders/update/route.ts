import { NextRequest, NextResponse } from 'next/server'
import { findFolderByGoogleId, updateFolder, createFolder } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const { folderId, displayName, coverImage, description, entryDate } = await request.json()
    
    if (!folderId) {
      return NextResponse.json(
        { success: false, error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Updating folder: ${folderId}`, {
      displayName,
      coverImage,
      description
    })

    try {
      // Check if folder exists
      const existingFolder = await findFolderByGoogleId(folderId)

      if (existingFolder) {
        // Update existing folder
        const updateData: any = {}
        if (displayName) updateData.name = displayName
        if (description !== undefined) updateData.description = description
        if (coverImage !== undefined) updateData.cover_image = coverImage
        if (entryDate !== undefined) updateData.entry_date = entryDate
        
        await updateFolder(folderId, updateData)
        console.log(`✅ Updated existing category for folder: ${folderId}`)
      } else {
        // Create new folder if it doesn't exist
        await createFolder({
          google_folder_id: folderId,
          name: displayName || 'Untitled Folder',
          description: description || null,
          cover_image: coverImage || null
        })
        console.log(`✅ Created new category for folder: ${folderId}`)
      }

      return NextResponse.json({
        success: true,
        message: 'Folder updated successfully'
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database error occurred',
        message: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error updating folder:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update folder',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}