-- Create session_events table for tracking all session lifecycle events
CREATE TABLE IF NOT EXISTS session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_session_events_session_id ON session_events(session_id, created_at DESC);
CREATE INDEX idx_session_events_type ON session_events(event_type);
CREATE INDEX idx_session_events_created_at ON session_events(created_at DESC);

-- Add RLS policies for session_events
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own session events
CREATE POLICY "Users can view their own session events"
  ON session_events
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM coding_sessions WHERE user_id = auth.uid()
    )
  );

-- Service role can insert events (for worker)
CREATE POLICY "Service role can insert session events"
  ON session_events
  FOR INSERT
  WITH CHECK (true);

-- Service role can update/delete events
CREATE POLICY "Service role can manage session events"
  ON session_events
  FOR ALL
  USING (true);

-- Add comments
COMMENT ON TABLE session_events IS 'Stores all events during a coding session (state changes, terminal output, file changes, etc.)';
COMMENT ON COLUMN session_events.session_id IS 'Reference to the coding session';
COMMENT ON COLUMN session_events.event_type IS 'Type of event: state_changed, thinking, terminal, file_change, completion, error';
COMMENT ON COLUMN session_events.event_data IS 'Event-specific data in JSON format';
COMMENT ON COLUMN session_events.created_at IS 'Timestamp when the event occurred';
