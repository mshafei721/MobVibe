-- Add icon_url column to projects table
-- Phase 25: Icon Generation

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS icon_url TEXT,
  ADD COLUMN IF NOT EXISTS icon_updated_at TIMESTAMPTZ;

-- Add index for icon URL queries
CREATE INDEX IF NOT EXISTS idx_projects_icon_url
  ON projects(icon_url)
  WHERE icon_url IS NOT NULL;

-- Add comments
COMMENT ON COLUMN projects.icon_url IS 'URL to the generated app icon stored in Supabase Storage';
COMMENT ON COLUMN projects.icon_updated_at IS 'Timestamp when icon was last generated or updated';

-- Create project-icons storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-icons', 'project-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for project-icons bucket
-- Users can read all icons (public bucket)
CREATE POLICY "Public can view icons"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-icons');

-- Users can upload icons to their own folder
CREATE POLICY "Users can upload own icons"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own icons
CREATE POLICY "Users can update own icons"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own icons
CREATE POLICY "Users can delete own icons"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
