-- Enable Supabase Realtime for session_events table

-- Set REPLICA IDENTITY to FULL for session_events
-- This ensures all columns are included in the replication stream
ALTER TABLE session_events REPLICA IDENTITY FULL;

-- Add session_events to the supabase_realtime publication
-- This enables real-time subscriptions on this table
ALTER PUBLICATION supabase_realtime ADD TABLE session_events;

-- Add comments
COMMENT ON TABLE session_events IS 'Stores all events during a coding session with Realtime enabled for live updates';
