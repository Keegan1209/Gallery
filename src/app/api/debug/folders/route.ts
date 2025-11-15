import { NextResponse } from 'next/server'
import { getActiveFolders } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 Debug: Checking all folders in database...')
    
    // Get all categories from database
    const allCategories = await getActiveFolders()
    
    console.log(`📊 Found ${allCategories.length} categories in database`)
    
    return NextResponse.json({
      success: true,
      totalCategories: allCategories.length,
      activeCategories: allCategories.filter(c => c.is_active).length,
      inactiveCategories: allCategories.filter(c => !c.is_active).length,
      categories: allCategories.map(c => ({
        id: c.id,
        name: c.name,
        google_folder_id: c.google_folder_id,
        is_active: c.is_active,
        cover_image: c.cover_image ? 'HAS_COVER' : 'NO_COVER',
        created_at: c.created_at
      }))
    })
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}