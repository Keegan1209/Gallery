-- Create diary_entries table for multi-user diary support
-- This replaces the single-text folder_diaries table

CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_diary_entries_folder_id ON diary_entries(folder_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_created_at ON diary_entries(created_at DESC);

-- Migrate existing data from folder_diaries to diary_entries
-- (This will create entries with a default user email - update manually if needed)
INSERT INTO diary_entries (folder_id, user_email, content, created_at, updated_at)
SELECT 
  "folderId" as folder_id,
  'admin@example.com' as user_email,
  content,
  "createdAt" as created_at,
  "updatedAt" as updated_at
FROM folder_diaries
WHERE content IS NOT NULL AND content != ''
ON CONFLICT DO NOTHING;
