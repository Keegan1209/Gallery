import { createPool } from '@vercel/postgres'

/**
 * Database client using @vercel/postgres
 * Works seamlessly with Vercel deployments and Supabase Postgres
 */

const pool = createPool({
  connectionString: process.env.DATABASE_URL
})

export const sql = pool.sql

// Helper function to get all active folders
export async function getActiveFolders() {
  const result = await sql`
    SELECT * FROM categories 
    WHERE is_active = true 
    ORDER BY created_at DESC
  `
  return result.rows
}

// Helper function to find folder by Google Drive ID
export async function findFolderByGoogleId(googleFolderId: string) {
  const result = await sql`
    SELECT * FROM categories 
    WHERE google_folder_id = ${googleFolderId}
    LIMIT 1
  `
  return result.rows[0] || null
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
  return result.rows[0]
}

// Helper function to update a folder
export async function updateFolder(googleFolderId: string, data: {
  name?: string
  description?: string | null
  cover_image?: string | null
}) {
  // Build dynamic update based on provided fields
  if (data.name !== undefined && data.description !== undefined && data.cover_image !== undefined) {
    const result = await sql`
      UPDATE categories 
      SET name = ${data.name}, description = ${data.description}, cover_image = ${data.cover_image}, updated_at = NOW()
      WHERE google_folder_id = ${googleFolderId}
      RETURNING *
    `
    return result.rows[0]
  } else if (data.name !== undefined && data.description !== undefined) {
    const result = await sql`
      UPDATE categories 
      SET name = ${data.name}, description = ${data.description}, updated_at = NOW()
      WHERE google_folder_id = ${googleFolderId}
      RETURNING *
    `
    return result.rows[0]
  } else if (data.name !== undefined && data.cover_image !== undefined) {
    const result = await sql`
      UPDATE categories 
      SET name = ${data.name}, cover_image = ${data.cover_image}, updated_at = NOW()
      WHERE google_folder_id = ${googleFolderId}
      RETURNING *
    `
    return result.rows[0]
  } else if (data.description !== undefined && data.cover_image !== undefined) {
    const result = await sql`
      UPDATE categories 
      SET description = ${data.description}, cover_image = ${data.cover_image}, updated_at = NOW()
      WHERE google_folder_id = ${googleFolderId}
      RETURNING *
    `
    return result.rows[0]
  } else if (data.name !== undefined) {
    const result = await sql`
      UPDATE categories 
      SET name = ${data.name}, updated_at = NOW()
      WHERE google_folder_id = ${googleFolderId}
      RETURNING *
    `
    return result.rows[0]
  } else if (data.description !== undefined) {
    const result = await sql`
      UPDATE categories 
      SET description = ${data.description}, updated_at = NOW()
      WHERE google_folder_id = ${googleFolderId}
      RETURNING *
    `
    return result.rows[0]
  } else if (data.cover_image !== undefined) {
    const result = await sql`
      UPDATE categories 
      SET cover_image = ${data.cover_image}, updated_at = NOW()
      WHERE google_folder_id = ${googleFolderId}
      RETURNING *
    `
    return result.rows[0]
  }
  
  return null
}

// Helper function to delete a folder
export async function deleteFolder(googleFolderId: string) {
  const result = await sql`
    DELETE FROM categories 
    WHERE google_folder_id = ${googleFolderId}
    RETURNING *
  `
  return result.rows[0]
}

// Helper function to get folder diary
export async function getFolderDiary(folderId: string) {
  const result = await sql`
    SELECT * FROM folder_diaries 
    WHERE folderId = ${folderId}
    LIMIT 1
  `
  return result.rows[0] || null
}

// Helper function to upsert folder diary
export async function upsertFolderDiary(folderId: string, content: string) {
  const result = await sql`
    INSERT INTO folder_diaries (id, folderId, content, createdAt, updatedAt)
    VALUES (gen_random_uuid(), ${folderId}, ${content}, NOW(), NOW())
    ON CONFLICT (folderId) 
    DO UPDATE SET content = ${content}, updatedAt = NOW()
    RETURNING *
  `
  return result.rows[0]
}
