import { NextRequest, NextResponse } from 'next/server'
import { getFolderDiary, upsertFolderDiary } from '@/lib/db'

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
      const diaryEntry = await getFolderDiary(folderId)

      return NextResponse.json({
        success: true,
        content: diaryEntry?.content || ''
      })
    } catch (dbError) {
      console.log('Database error, returning empty content')
      return NextResponse.json({
        success: true,
        content: ''
      })
    }
  } catch (error) {
    console.error('Error fetching diary entry:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch diary entry',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params
    const { content } = await request.json()
    
    if (!folderId) {
      return NextResponse.json(
        { success: false, error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    try {
      const diaryEntry = await upsertFolderDiary(folderId, content)

      return NextResponse.json({
        success: true,
        diaryEntry: {
          id: diaryEntry.id,
          folderId: diaryEntry.folderid,
          content: diaryEntry.content,
          updatedAt: diaryEntry.updatedat
        }
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        {
          success: false,
          error: 'Database error occurred',
          message: dbError instanceof Error ? dbError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error saving diary entry:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save diary entry',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}