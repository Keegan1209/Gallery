# Multi-User Diary Migration Instructions

## 🎯 What This Does

**BEFORE:** Each folder had ONE diary entry that only one person could edit
**AFTER:** Each folder can have MULTIPLE diary entries from different users

Each folder keeps its own diary entries - they're isolated per folder. But now multiple users can contribute to each folder's diary!

## ✅ Your Current Database Status

Based on your schema:
- ✅ `entry_date` column already exists in `categories` table
- ✅ `folder_diaries` table exists (old single-user system)
- ❌ `diary_entries` table does NOT exist yet (new multi-user system)

## 📋 Step 1: Run Database Migration in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste this SQL:

```sql
-- Create diary_entries table for multi-user diary support
-- This allows MULTIPLE entries per folder (one per user per entry)
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diary_entries_folder_id ON diary_entries(folder_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_created_at ON diary_entries(created_at DESC);

-- OPTIONAL: Migrate existing diary entries from folder_diaries to diary_entries
-- This preserves your existing diary content
-- Skip this if you don't have any existing diary entries
INSERT INTO diary_entries (folder_id, user_email, content, created_at, updated_at)
SELECT 
  "folderId" as folder_id,
  'admin@example.com' as user_email,  -- Change this to your actual email if you want
  content,
  "createdAt" as created_at,
  "updatedAt" as updated_at
FROM folder_diaries
WHERE content IS NOT NULL AND content != ''
ON CONFLICT DO NOTHING;
```

6. Click **Run** (or press Ctrl+Enter)

## 📝 Step 2: Configure User Display Names

Open `src/config/users.ts` and add your users:

```typescript
export const USER_NAMES: Record<string, string> = {
  'lillyluest@icloud.com': 'Lilly',
  'keeganlfrank@gmail.com': 'Keegan',
}
```

**Replace with your actual login email addresses and desired display names!**

If you don't configure this, the app will just show the part before @ in the email (e.g., "lilly" from "lilly@example.com")

## 🧪 Step 3: Test the Feature

1. **Login as User 1** (e.g., Lilly)
2. Go to any folder
3. Add a diary entry (e.g., "Beautiful sunset photos")
4. **Logout**
5. **Login as User 2** (e.g., Keegan)
6. Go to the same folder
7. Add another diary entry (e.g., "I love these memories")
8. You should see BOTH entries with different user names on the left!

## ✨ New Features

- ✅ **Multiple entries per folder** - Each user can add multiple entries
- ✅ **User names displayed** - Shows who wrote each entry on the left
- ✅ **Scrollable diary section** - Scrolls if there are many entries
- ✅ **Edit/Delete buttons** - Users can manage their entries
- ✅ **Timestamps** - Each entry shows when it was created
- ✅ **Chronological order** - Entries shown oldest first
- ✅ **Per-folder isolation** - Each folder has its own diary entries

## 🔍 Verify in Supabase

After running the migration:

1. Go to **Table Editor** in Supabase
2. You should see a new `diary_entries` table
3. Click on it to see the columns: id, folder_id, user_email, content, created_at, updated_at
4. If you had existing diary entries, they should be migrated here

## ⚠️ Important Notes

- The old `folder_diaries` table will still exist but won't be used anymore
- You can delete it later if you want, but keep it for now as a backup
- Each folder's diary entries are isolated - Folder A's entries are separate from Folder B's entries
- The `folder_id` column links entries to specific folders (just like before, but now with multiple entries)
