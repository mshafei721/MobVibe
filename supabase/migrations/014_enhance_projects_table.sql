-- Migration 014: Enhance Projects Table for Phase 26
-- Created: 2025-11-08
-- Purpose: Add columns and indexes for project management features

-- Add new columns for enhanced project management
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS framework TEXT DEFAULT 'react-native'
    CHECK (framework IN ('react-native', 'flutter', 'ionic')),
  ADD COLUMN IF NOT EXISTS template TEXT,
  ADD COLUMN IF NOT EXISTS last_modified TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{
    "screens_count": 0,
    "code_size_kb": 0
  }'::jsonb;

-- Update status constraint to include 'draft'
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('draft', 'active', 'archived', 'deleted'));

-- Populate last_modified from updated_at for existing records
UPDATE projects
SET last_modified = updated_at
WHERE last_modified IS NULL;

-- Create full-text search index on name and description
CREATE INDEX IF NOT EXISTS idx_projects_search
  ON projects
  USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

-- Add index for last_modified (performance optimization)
CREATE INDEX IF NOT EXISTS idx_projects_last_modified
  ON projects(last_modified DESC);

-- Add comments for new columns
COMMENT ON COLUMN projects.framework IS 'Mobile framework used for the project';
COMMENT ON COLUMN projects.template IS 'Template identifier used to create the project';
COMMENT ON COLUMN projects.last_modified IS 'Timestamp of last modification (used for sorting)';
COMMENT ON COLUMN projects.metadata IS 'Project metadata (screens_count, code_size_kb, last_build, etc.)';

-- Update trigger to also update last_modified
CREATE OR REPLACE FUNCTION update_project_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_modified = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;

CREATE TRIGGER projects_update_timestamps
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_project_timestamps();
