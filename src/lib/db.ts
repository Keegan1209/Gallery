import postgres from 'postgres'

/**
 * Database client using postgres.js
 * Works perfectly with Vercel and Supabase
 * Recommended by Vercel for external Postgres databases
 */

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Database connection string not found')
}

export const sql = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20,
  connect_timeout: 10,
})

// Helper function to get all active folders
export async function getActiveFolders() {
  const result = await sql`
    SELECT * FROM categories 
    WHERE is_active = true 
    ORDER BY created_at DESC
  `
  return result // postgres.js returns array directly, not result.rows
}

// Helper function to find folder by Google Drive ID
export async function findFolderByGoogleId(googleFolderId: string) {
  const result = await sql`
    SELECT * FROM categories 
    WHERE google_folder_id = ${googleFolderId}
    LIMIT 1
  `
  return result[0] || null // postgres.js returns array directly
}

// Helper function to create a folder
export async function createFolder(data: {
  google_folder_id: string
  name: string
  description?: string
  cover_image?: string
}) {
  const result = await sql`
    INSERT INTO categories (
      id, google_folder_id, name, description, cover_image, is_active, sort_order, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), 
      ${data.google_folder_id}, 
      ${data.name}, 
      ${data.description || null}, 
      ${data.cover_image || null}, 
      true, 
      0, 
      NOW(), 
      NOW()
    )
    RETURNING *
  `
  return result[0] // postgres.js returns array directly
}

// Helper function to update a folder
export async function updateFolder(googleFolderId: string, data: {
  name?: string
  description?: string | null
  cover_image?: string | null
  entry_date?: string | null
}) {
  const result = await sql`
    UPDATE categories 
    SET 
      name = COALESCE(${data.name || null}, name),
      description = COALESCE(${data.description !== undefined ? data.description : null}, description),
      cover_image = COALESCE(${data.cover_image !== undefined ? data.cover_image : null}, cover_image),
      entry_date = COALESCE(${data.entry_date !== undefined ? data.entry_date : null}, entry_date),
      updated_at = NOW()
    WHERE google_folder_id = ${googleFolderId}
    RETURNING *
  `
  return result[0]
}

// Helper function to delete a folder
export async function deleteFolder(googleFolderId: string) {
  const result = await sql`
    DELETE FROM categories 
    WHERE google_folder_id = ${googleFolderId}
    RETURNING *
  `
  return result[0]
}

// Helper function to get all diary entries for a folder
export async function getFolderDiaryEntries(folderId: string) {
  const result = await sql`
    SELECT * FROM diary_entries 
    WHERE folder_id = ${folderId}
    ORDER BY created_at ASC
  `
  return result
}

// Helper function to create a new diary entry
export async function createDiaryEntry(folderId: string, userEmail: string, content: string) {
  const result = await sql`
    INSERT INTO diary_entries (id, folder_id, user_email, content, created_at, updated_at)
    VALUES (gen_random_uuid(), ${folderId}, ${userEmail}, ${content}, NOW(), NOW())
    RETURNING *
  `
  return result[0]
}

// Helper function to update a diary entry
export async function updateDiaryEntry(entryId: string, content: string) {
  const result = await sql`
    UPDATE diary_entries 
    SET content = ${content}, updated_at = NOW()
    WHERE id = ${entryId}
    RETURNING *
  `
  return result[0]
}

// Helper function to delete a diary entry
export async function deleteDiaryEntry(entryId: string) {
  const result = await sql`
    DELETE FROM diary_entries 
    WHERE id = ${entryId}
    RETURNING *
  `
  return result[0]
}
