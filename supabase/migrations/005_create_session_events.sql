-- Migration 005: Session Events Table
-- Created: 2025-11-07
-- Purpose: Real-time event streaming

-- Create session_events table
CREATE TABLE session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('thinking', 'terminal', 'file_change', 'preview_ready', 'completion', 'error')),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy (read-only for users via sessions)
CREATE POLICY "Users can view own session events"
  ON session_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coding_sessions
      WHERE coding_sessions.id = session_events.session_id
      AND coding_sessions.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX session_events_session_id_idx ON session_events(session_id);
CREATE INDEX session_events_created_at_idx ON session_events(created_at DESC);
CREATE INDEX session_events_event_type_idx ON session_events(event_type);
