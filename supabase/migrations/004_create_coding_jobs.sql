-- Migration 004: Coding Jobs Table
-- Created: 2025-11-07
-- Purpose: Job queue for worker processing

-- Create coding_jobs table
CREATE TABLE coding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE coding_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy (read-only for users via sessions)
CREATE POLICY "Users can view own jobs"
  ON coding_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coding_sessions
      WHERE coding_sessions.id = coding_jobs.session_id
      AND coding_sessions.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX coding_jobs_session_id_idx ON coding_jobs(session_id);
CREATE INDEX coding_jobs_status_priority_idx ON coding_jobs(status, priority DESC, created_at ASC);

-- Trigger for updated_at
CREATE TRIGGER coding_jobs_updated_at
  BEFORE UPDATE ON coding_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
