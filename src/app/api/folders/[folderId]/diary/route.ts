import { NextRequest, NextResponse } from 'next/server'
import { getFolderDiaryEntries, createDiaryEntry, updateDiaryEntry, deleteDiaryEntry } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// Get user email from session
async function getUserEmail(request: NextRequest): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    
    if (!token) return null
    
    const decoded = jwt.verify(token, process.env.SESSION_SECRET!) as { email: string }
    return decoded.email
  } catch {
    return null
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
      const entries = await getFolderDiaryEntries(folderId)

      return NextResponse.json({
        success: true,
        entries: entries
      })
    } catch (dbError) {
      console.log('Database error, returning empty entries')
      return NextResponse.json({
        success: true,
        entries: []
      })
    }
  } catch (error) {
    console.error('Error fetching diary entries:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch diary entries',
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
    const { content, entryId } = await request.json()
    
    if (!folderId) {
      return NextResponse.json(
        { success: false, error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    const userEmail = await getUserEmail(request)
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    try {
      let entry
      
      if (entryId) {
        // Update existing entry
        entry = await updateDiaryEntry(entryId, content)
      } else {
        // Create new entry
        entry = await createDiaryEntry(folderId, userEmail, content)
      }

      return NextResponse.json({
        success: true,
        entry: entry
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params
    const { entryId } = await request.json()
    
    if (!folderId || !entryId) {
      return NextResponse.json(
        { success: false, error: 'Folder ID and Entry ID are required' },
        { status: 400 }
      )
    }

    try {
      await deleteDiaryEntry(entryId)

      return NextResponse.json({
        success: true,
        message: 'Entry deleted successfully'
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
    console.error('Error deleting diary entry:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete diary entry',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}