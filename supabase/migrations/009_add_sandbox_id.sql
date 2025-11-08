-- Migration: Add sandbox_id column to coding_sessions
-- Purpose: Track Fly.io sandbox machine ID for each coding session
-- Phase: 15 - Sandbox Orchestration
-- Date: 2025-01-07

-- Add sandbox_id column
ALTER TABLE coding_sessions
ADD COLUMN IF NOT EXISTS sandbox_id TEXT;

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_sessions_sandbox
ON coding_sessions(sandbox_id)
WHERE sandbox_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN coding_sessions.sandbox_id IS 'Fly.io Machine ID for the sandbox running this session';
