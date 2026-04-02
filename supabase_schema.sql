-- ============================================================
-- YSOF Future Wall — Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the notes table
CREATE TABLE ysof_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL CHECK (char_length(content) <= 150),
  author VARCHAR(100) DEFAULT 'Ẩn danh',
  theme VARCHAR(20) NOT NULL DEFAULT 'white' CHECK (theme IN ('white', 'light-blue', 'dark-blue')),
  x_percent FLOAT NOT NULL CHECK (x_percent BETWEEN 5 AND 95),
  y_percent FLOAT NOT NULL CHECK (y_percent BETWEEN 5 AND 95),
  rotation FLOAT NOT NULL CHECK (rotation BETWEEN -10 AND 10),
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
