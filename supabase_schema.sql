-- ============================================================
-- YSOF Future Wall — Database Schema (v2)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the notes table (if not exists)
CREATE TABLE IF NOT EXISTS ysof_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL CHECK (char_length(content) <= 150),
  author VARCHAR(100) DEFAULT 'Ẩn danh',
  theme VARCHAR(20) NOT NULL DEFAULT 'white' CHECK (theme IN ('white', 'light-blue', 'dark-blue', 'mint-green', 'lavender', 'soft-pink', 'sun-peach')),
  x_percent FLOAT NOT NULL CHECK (x_percent BETWEEN 0 AND 100),
  y_percent FLOAT NOT NULL CHECK (y_percent BETWEEN 0 AND 100),
  rotation FLOAT NOT NULL CHECK (rotation BETWEEN -15 AND 15),
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE ysof_notes;

-- 3. Enable Row Level Security
ALTER TABLE ysof_notes ENABLE ROW LEVEL SECURITY;

-- 4. Allow anyone to read notes
CREATE POLICY "Anyone can read notes"
  ON ysof_notes
  FOR SELECT
  USING (true);

-- 5. Allow anyone to insert notes
CREATE POLICY "Anyone can insert notes"
  ON ysof_notes
  FOR INSERT
  WITH CHECK (true);

-- 6. Allow anyone to update likes (for the heart/like feature)
CREATE POLICY "Anyone can update likes"
  ON ysof_notes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 7. Allow delete (for admin panel)
CREATE POLICY "Anyone can delete notes"
  ON ysof_notes
  FOR DELETE
  USING (true);

-- ============================================================
-- MIGRATION: If table already exists, run these ALTER commands:
-- ============================================================
-- ALTER TABLE ysof_notes ADD COLUMN IF NOT EXISTS likes INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE ysof_notes DROP CONSTRAINT IF EXISTS ysof_notes_theme_check;
-- ALTER TABLE ysof_notes ADD CONSTRAINT ysof_notes_theme_check CHECK (theme IN ('white', 'light-blue', 'dark-blue', 'mint-green', 'lavender', 'soft-pink', 'sun-peach'));
