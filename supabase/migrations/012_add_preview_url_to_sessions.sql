-- Add preview_url column to coding_sessions table
-- Phase 23: WebView Preview

ALTER TABLE coding_sessions
  ADD COLUMN IF NOT EXISTS preview_url TEXT,
  ADD COLUMN IF NOT EXISTS preview_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS preview_port INTEGER DEFAULT 19006,
  ADD COLUMN IF NOT EXISTS preview_updated_at TIMESTAMPTZ;

-- Add index for preview status queries
CREATE INDEX IF NOT EXISTS idx_coding_sessions_preview_status
  ON coding_sessions(preview_status)
  WHERE preview_status != 'ready';

-- Add comment
COMMENT ON COLUMN coding_sessions.preview_url IS 'URL to preview the generated app in WebView';
COMMENT ON COLUMN coding_sessions.preview_status IS 'Status of preview: pending, starting, ready, failed';
COMMENT ON COLUMN coding_sessions.preview_port IS 'Port number for Expo dev server';
COMMENT ON COLUMN coding_sessions.preview_updated_at IS 'Timestamp when preview URL was last updated';

-- Update existing sessions to have pending status
UPDATE coding_sessions
  SET preview_status = 'pending'
  WHERE preview_status IS NULL;
