-- Create assets table for storing generated icons, sounds, and images
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('icon', 'sound', 'image')),
  url TEXT NOT NULL,
  prompt TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON public.assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assets table
-- Users can view their own assets
CREATE POLICY "Users can view own assets"
  ON public.assets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own assets
CREATE POLICY "Users can insert own assets"
  ON public.assets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own assets
CREATE POLICY "Users can update own assets"
  ON public.assets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own assets
CREATE POLICY "Users can delete own assets"
  ON public.assets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Storage buckets for assets
-- Note: These need to be created manually in Supabase dashboard or via API
-- Bucket names: 'project-icons', 'project-sounds'

-- Storage policies for project-icons bucket
-- Users can upload to their own folder
CREATE POLICY "Users can upload own icons"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'project-icons' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own icons
CREATE POLICY "Users can view own icons"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'project-icons' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own icons
CREATE POLICY "Users can delete own icons"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'project-icons' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for project-sounds bucket
-- Users can upload to their own folder
CREATE POLICY "Users can upload own sounds"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'project-sounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own sounds
CREATE POLICY "Users can view own sounds"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'project-sounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own sounds
CREATE POLICY "Users can delete own sounds"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'project-sounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add icon_url column to projects table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'icon_url'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN icon_url TEXT;
  END IF;
END $$;

-- Comment on table and columns
COMMENT ON TABLE public.assets IS 'Stores AI-generated assets (icons, sounds, images) for projects';
COMMENT ON COLUMN public.assets.type IS 'Asset type: icon, sound, or image';
COMMENT ON COLUMN public.assets.url IS 'Public URL to the asset in Supabase Storage';
COMMENT ON COLUMN public.assets.prompt IS 'Original prompt used to generate the asset';
COMMENT ON COLUMN public.assets.metadata IS 'Additional metadata like generation settings, applied status, etc.';
