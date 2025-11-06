import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
      const diaryEntry = await prisma.folderDiary.findUnique({
        where: {
          folderId: folderId
        }
      })

      return NextResponse.json({
        success: true,
        content: diaryEntry?.content || ''
      })
    } catch (dbError) {
      console.log('Database table may not exist yet, returning empty content')
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
      const diaryEntry = await prisma.folderDiary.upsert({
        where: {
          folderId: folderId
        },
        update: {
          content: content,
          updatedAt: new Date()
        },
        create: {
          folderId: folderId,
          content: content
        }
      })

      return NextResponse.json({
        success: true,
        diaryEntry: {
          id: diaryEntry.id,
          folderId: diaryEntry.folderId,
          content: diaryEntry.content,
          updatedAt: diaryEntry.updatedAt
        }
      })
    } catch (dbError) {
      console.error('Database error, table may not exist:', dbError)
      return NextResponse.json(
        {
          success: false,
          error: 'Database table not ready. Please run database migration first.',
          message: 'Run: npx prisma db push'
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