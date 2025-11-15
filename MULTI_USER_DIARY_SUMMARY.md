# Multi-User Diary Feature - Implementation Summary

## ✅ What Was Implemented

### 1. Database Changes
- Created new `diary_entries` table to support multiple entries per folder
- Each entry has: id, folder_id, user_email, content, created_at, updated_at
- Replaced single-text `folder_diaries` with multi-entry system

### 2. User Configuration
- Created `src/config/users.ts` - **THIS IS WHERE YOU CONFIGURE USER NAMES**
- Map email addresses to display names
- Example:
  ```typescript
  export const USER_NAMES: Record<string, string> = {
    'lilly@example.com': 'Lilly',
    'keegan@example.com': 'Keegan',
  }
  ```

### 3. API Changes
- Updated `/api/folders/[folderId]/diary` to support:
  - GET: Fetch all entries for a folder
  - POST: Create new entry or update existing
  - DELETE: Remove an entry
- Entries are tied to logged-in user's email

### 4. UI Changes
- **Left Column**: User name and date
- **Right Column**: Entry content with edit/delete buttons
- **Scrollable**: Diary section scrolls if there are many entries
- **New Entry Form**: At the bottom to add new memories
- **No Auto-save**: Manual save per entry

## 📍 WHERE TO CONFIGURE USER NAMES

**File**: `src/config/users.ts`

```typescript
export const USER_NAMES: Record<string, string> = {
  'your-email@example.com': 'Your Display Name',
  'partner-email@example.com': 'Partner Display Name',
}
```

Replace the email addresses with the actual login emails and set the display names you want to show.

## 🗄️ Database Migration Required

Run this SQL in Supabase before testing:

```sql
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diary_entries_folder_id ON diary_entries(folder_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_created_at ON diary_entries(created_at DESC);
```

## ✨ Features

1. **Multi-User Support**: Each user can add their own entries
2. **User Names**: Display names shown on the left (configured in `src/config/users.ts`)
3. **Scrollable**: Diary section scrolls when there are many entries
4. **Edit/Delete**: Users can edit or delete their entries
5. **Chronological**: Entries shown oldest first
6. **Timestamps**: Each entry shows when it was created

## 🧪 Testing

1. Run the database migration in Supabase
2. Configure user names in `src/config/users.ts`
3. Login as first user, add an entry
4. Logout, login as second user, add another entry
5. Both entries should appear with different user names

## 📝 Notes

- The diary section is scrollable (max-height set to 40vh)
- User names are extracted from the email if not configured in `users.ts`
- Entries are stored per folder, not globally
- Each user can only edit/delete their own entries (frontend only - add backend validation if needed)
