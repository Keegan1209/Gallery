-- Create folder_diaries table for storing diary entries
-- This can be run directly in Supabase SQL editor if needed

CREATE TABLE IF NOT EXISTS "folder_diaries" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "folderId" TEXT NOT NULL UNIQUE,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create folder_covers table for storing uploaded cover images
CREATE TABLE IF NOT EXISTS "folder_covers" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "folderId" TEXT NOT NULL UNIQUE,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "folder_diaries_folderId_idx" ON "folder_diaries"("folderId");
CREATE INDEX IF NOT EXISTS "folder_covers_folderId_idx" ON "folder_covers"("folderId");

-- Add sort_order column to categories table if it doesn't exist
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER DEFAULT 0;

-- Add cover_image column to categories table if it doesn't exist
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "cover_image" TEXT;

-- Create indexes for faster ordering and lookups
CREATE INDEX IF NOT EXISTS "categories_sort_order_idx" ON "categories"("sort_order");
CREATE INDEX IF NOT EXISTS "categories_cover_image_idx" ON "categories"("cover_image");

-- Create trigger to automatically update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_folder_diaries_updated_at 
    BEFORE UPDATE ON "folder_diaries" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();