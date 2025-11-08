-- Migration 015: Session Persistence
-- Created: 2025-11-08
-- Purpose: Add session state persistence for resume functionality

-- Add new columns for session persistence
ALTER TABLE coding_sessions
  ADD COLUMN IF NOT EXISTS resumable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS state_snapshot JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS state_version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS compressed_state BYTEA,
  ADD COLUMN IF NOT EXISTS state_size_bytes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resume_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_resumed_at TIMESTAMPTZ;

-- Add index for finding resumable sessions
CREATE INDEX IF NOT EXISTS idx_sessions_resumable
  ON coding_sessions(user_id, resumable, last_activity DESC)
  WHERE resumable = true;

-- Add index for session history queries
CREATE INDEX IF NOT EXISTS idx_sessions_history
  ON coding_sessions(user_id, created_at DESC);

-- Add index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_sessions_cleanup
  ON coding_sessions(status, last_activity)
  WHERE status IN ('completed', 'failed', 'expired');

-- Add comments for new columns
COMMENT ON COLUMN coding_sessions.resumable IS 'Whether session can be resumed';
COMMENT ON COLUMN coding_sessions.last_activity IS 'Timestamp of last user or agent activity';
COMMENT ON COLUMN coding_sessions.state_snapshot IS 'JSON snapshot of session state (agent context, files, outputs)';
COMMENT ON COLUMN coding_sessions.state_version IS 'Version of state schema for migrations';
COMMENT ON COLUMN coding_sessions.compressed_state IS 'GZIP compressed state for large sessions';
COMMENT ON COLUMN coding_sessions.state_size_bytes IS 'Size of state data in bytes';
COMMENT ON COLUMN coding_sessions.resume_count IS 'Number of times session has been resumed';
COMMENT ON COLUMN coding_sessions.last_resumed_at IS 'Timestamp when session was last resumed';

-- Function to update last_activity on any session update
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace existing trigger with new one that updates last_activity
DROP TRIGGER IF EXISTS coding_sessions_updated_at ON coding_sessions;

CREATE TRIGGER coding_sessions_update_activity
  BEFORE UPDATE ON coding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- Function to automatically mark active sessions as resumable when paused
CREATE OR REPLACE FUNCTION mark_paused_sessions_resumable()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paused' AND OLD.status = 'active' THEN
    NEW.resumable = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_auto_resumable
  BEFORE UPDATE ON coding_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'paused' AND OLD.status = 'active')
  EXECUTE FUNCTION mark_paused_sessions_resumable();

-- Function to clean up old completed sessions (run manually or via cron)
CREATE OR REPLACE FUNCTION cleanup_old_sessions(days_old INTEGER DEFAULT 30)
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  cutoff_date TIMESTAMPTZ;
  count_deleted BIGINT;
BEGIN
  cutoff_date := NOW() - (days_old || ' days')::INTERVAL;

  DELETE FROM coding_sessions
  WHERE status IN ('completed', 'failed', 'expired')
    AND last_activity < cutoff_date
    AND resumable = false;

  GET DIAGNOSTICS count_deleted = ROW_COUNT;

  RETURN QUERY SELECT count_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_sessions IS 'Delete old completed/failed/expired sessions older than specified days';

-- Function to calculate total storage usage per user
CREATE OR REPLACE FUNCTION get_user_session_storage(p_user_id UUID)
RETURNS TABLE(
  total_sessions BIGINT,
  active_sessions BIGINT,
  resumable_sessions BIGINT,
  total_storage_bytes BIGINT,
  average_session_size_bytes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_sessions,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_sessions,
    COUNT(*) FILTER (WHERE resumable = true)::BIGINT as resumable_sessions,
    COALESCE(SUM(state_size_bytes), 0)::BIGINT as total_storage_bytes,
    COALESCE(AVG(state_size_bytes), 0)::NUMERIC as average_session_size_bytes
  FROM coding_sessions
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_session_storage IS 'Calculate storage usage statistics for a user';
