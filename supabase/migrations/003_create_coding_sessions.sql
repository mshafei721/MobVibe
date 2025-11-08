-- Migration 003: Coding Sessions Table
-- Created: 2025-11-07
-- Purpose: Active coding session management

-- Create coding_sessions table
CREATE TABLE coding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sandbox_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'failed', 'expired')),
  initial_prompt TEXT NOT NULL,
  eas_update_url TEXT,
  webview_url TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE coding_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sessions"
  ON coding_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create sessions"
  ON coding_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON coding_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX coding_sessions_user_id_idx ON coding_sessions(user_id);
CREATE INDEX coding_sessions_project_id_idx ON coding_sessions(project_id);
CREATE INDEX coding_sessions_status_idx ON coding_sessions(status);
CREATE INDEX coding_sessions_expires_at_idx ON coding_sessions(expires_at);

-- Trigger for updated_at
CREATE TRIGGER coding_sessions_updated_at
  BEFORE UPDATE ON coding_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
