-- Add entry_date column to categories table
-- This allows users to set their own dates for folders (optional)
-- created_at is kept for ordering purposes

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS entry_date DATE;
