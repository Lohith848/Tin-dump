-- ============================================
-- CRATE — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. tin_catalog — global list of all known tins
CREATE TABLE IF NOT EXISTS tin_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. user_tins — each user's placed tins on their board
CREATE TABLE IF NOT EXISTS user_tins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_tin_id UUID NOT NULL REFERENCES tin_catalog(id) ON DELETE CASCADE,
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_user_tins_user_id ON user_tins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tins_catalog_tin_id ON user_tins(catalog_tin_id);
CREATE INDEX IF NOT EXISTS idx_tin_catalog_name ON tin_catalog(name);

-- 5. RLS — tin_catalog
ALTER TABLE tin_catalog ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated (including anonymous) can read the catalog
CREATE POLICY "Catalog is readable by all authenticated users"
  ON tin_catalog FOR SELECT
  TO authenticated
  USING (true);

-- Anyone authenticated can insert new tins into the catalog
CREATE POLICY "Authenticated users can add to catalog"
  ON tin_catalog FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. RLS — user_tins
ALTER TABLE user_tins ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tins
CREATE POLICY "Users can view their own tins"
  ON user_tins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only insert their own tins
CREATE POLICY "Users can insert their own tins"
  ON user_tins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own tins
CREATE POLICY "Users can update their own tins"
  ON user_tins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own tins
CREATE POLICY "Users can delete their own tins"
  ON user_tins FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. Storage bucket for tin photos
-- Run this separately or via Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tin-photos', 'tin-photos', true);

-- Storage policies (run after creating bucket)
-- Allow authenticated users to upload
-- CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tin-photos');
-- Allow public reads
-- CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'tin-photos');
