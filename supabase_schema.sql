-- ============================================================
-- Toi & Ban Wall — Production Schema + RLS (v3)
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query
-- IMPORTANT: Replace admin email in policy before running.
-- ============================================================

-- 1) Create table (or keep existing) with latest columns
CREATE TABLE IF NOT EXISTS public.toi_va_ban_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL CHECK (char_length(content) <= 400),
  author VARCHAR(100) DEFAULT 'Ẩn danh',
  email VARCHAR(255) NOT NULL,
  theme VARCHAR(20) NOT NULL DEFAULT 'white'
    CHECK (theme IN ('white', 'light-blue', 'dark-blue', 'mint-green', 'lavender', 'soft-pink', 'sun-peach')),
  x_percent FLOAT NOT NULL CHECK (x_percent BETWEEN 0 AND 100),
  y_percent FLOAT NOT NULL CHECK (y_percent BETWEEN 0 AND 100),
  rotation FLOAT NOT NULL CHECK (rotation BETWEEN -15 AND 15),
  likes INTEGER NOT NULL DEFAULT 0,
  admin_reply TEXT CHECK (char_length(admin_reply) <= 500),
  replied_at TIMESTAMPTZ,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Device rate-limit logs (server-side daily limit)
CREATE TABLE IF NOT EXISTS public.toi_va_ban_note_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  fingerprint_hash TEXT NOT NULL,
  note_id UUID REFERENCES public.toi_va_ban_notes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Safe migrations for existing tables
ALTER TABLE public.toi_va_ban_notes ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.toi_va_ban_notes ADD COLUMN IF NOT EXISTS likes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.toi_va_ban_notes ADD COLUMN IF NOT EXISTS admin_reply TEXT;
ALTER TABLE public.toi_va_ban_notes ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;
ALTER TABLE public.toi_va_ban_notes ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false;

-- Update content limit from 150 to 400
ALTER TABLE public.toi_va_ban_notes DROP CONSTRAINT IF EXISTS toi_va_ban_notes_content_check;
ALTER TABLE public.toi_va_ban_notes
  ADD CONSTRAINT toi_va_ban_notes_content_check CHECK (char_length(content) <= 400);

ALTER TABLE public.toi_va_ban_notes DROP CONSTRAINT IF EXISTS toi_va_ban_notes_admin_reply_check;
ALTER TABLE public.toi_va_ban_notes
  ADD CONSTRAINT toi_va_ban_notes_admin_reply_check CHECK (char_length(admin_reply) <= 500);

ALTER TABLE public.toi_va_ban_notes DROP CONSTRAINT IF EXISTS toi_va_ban_notes_theme_check;
ALTER TABLE public.toi_va_ban_notes
  ADD CONSTRAINT toi_va_ban_notes_theme_check
  CHECK (theme IN ('white', 'light-blue', 'dark-blue', 'mint-green', 'lavender', 'soft-pink', 'sun-peach'));

-- 3) Realtime (idempotent: avoid duplicate table in publication)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c ON c.oid = pr.prrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_publication p ON p.oid = pr.prpubid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'toi_va_ban_notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.toi_va_ban_notes;
  END IF;
END
$$;

-- 4) Enable RLS
ALTER TABLE public.toi_va_ban_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toi_va_ban_note_rate_limits ENABLE ROW LEVEL SECURITY;

-- 5) Remove old permissive policies (if present)
DROP POLICY IF EXISTS "Anyone can read notes" ON public.toi_va_ban_notes;
DROP POLICY IF EXISTS "Anyone can insert notes" ON public.toi_va_ban_notes;
DROP POLICY IF EXISTS "Anyone can update likes" ON public.toi_va_ban_notes;
DROP POLICY IF EXISTS "Anyone can delete notes" ON public.toi_va_ban_notes;

DROP POLICY IF EXISTS "Public read notes" ON public.toi_va_ban_notes;
DROP POLICY IF EXISTS "Public insert notes" ON public.toi_va_ban_notes;
DROP POLICY IF EXISTS "Public update likes only" ON public.toi_va_ban_notes;
DROP POLICY IF EXISTS "Admin can update reply" ON public.toi_va_ban_notes;
DROP POLICY IF EXISTS "Admin can delete notes" ON public.toi_va_ban_notes;

-- 6) Public policies
-- Public can only see non-hidden notes
CREATE POLICY "Public read notes"
  ON public.toi_va_ban_notes
  FOR SELECT
  USING (hidden = false);

CREATE POLICY "Public insert notes"
  ON public.toi_va_ban_notes
  FOR INSERT
  WITH CHECK (true);

-- Public can only update likes.
-- admin_reply/replied_at must stay unchanged in this policy.
CREATE POLICY "Public update likes only"
  ON public.toi_va_ban_notes
  FOR UPDATE
  USING (true)
  WITH CHECK (
    admin_reply IS NOT DISTINCT FROM (SELECT n.admin_reply FROM public.toi_va_ban_notes n WHERE n.id = toi_va_ban_notes.id)
    AND replied_at IS NOT DISTINCT FROM (SELECT n.replied_at FROM public.toi_va_ban_notes n WHERE n.id = toi_va_ban_notes.id)
  );

-- 7) Admin-only policies
-- Replace this email with your real admin account.
-- Example: admin@toivaban.vn
CREATE POLICY "Admin can update reply"
  ON public.toi_va_ban_notes
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@yourdomain.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@yourdomain.com');

CREATE POLICY "Admin can delete notes"
  ON public.toi_va_ban_notes
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@yourdomain.com');

-- 8) Useful indexes
CREATE INDEX IF NOT EXISTS idx_toi_va_ban_notes_created_at ON public.toi_va_ban_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_toi_va_ban_notes_likes ON public.toi_va_ban_notes(likes DESC);
CREATE INDEX IF NOT EXISTS idx_toi_va_ban_notes_hidden ON public.toi_va_ban_notes(hidden) WHERE hidden = false;
CREATE INDEX IF NOT EXISTS idx_toi_va_ban_rate_fingerprint_created_at ON public.toi_va_ban_note_rate_limits(fingerprint_hash, created_at DESC);

-- 9) Optional: migrate old data from ysof_notes (run once if needed)
-- INSERT INTO public.toi_va_ban_notes (
--   id, content, author, theme, x_percent, y_percent, rotation, likes, admin_reply, replied_at, created_at
-- )
-- SELECT
--   id, content, author, theme, x_percent, y_percent, rotation, likes, admin_reply, replied_at, created_at
-- FROM public.ysof_notes
-- ON CONFLICT (id) DO NOTHING;
