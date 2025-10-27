import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Test connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('categories').select('count').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected)
      throw error
    }
    return true
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return false
  }
}