# Database Migration: Add Entry Date Column

## Instructions

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run the following SQL:

```sql
-- Add entry_date column to categories table
-- This allows users to set their own dates for folders (optional)
-- created_at is kept for ordering purposes
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS entry_date DATE;
```

5. Click "Run" to execute the migration

## What this does

- Adds an optional `entry_date` column to the `categories` table
- `created_at` remains unchanged (used for ordering)
- Users can optionally set a display date for each folder
- If no entry_date is set, no date is shown on the folder card

## After Migration

- Push the code changes to Vercel
- The edit modal will now have an optional date picker
- File counts are removed from the folder cards
- Dates only display if the user sets an entry_date
