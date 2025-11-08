-- Seed Data for Development
-- Created: 2025-11-07
-- Purpose: Test data for local development and testing
-- Note: Create test user via Supabase Auth dashboard first (profile will auto-create via trigger)

-- Sample project
-- Replace <user_id> with actual user ID from profiles table
INSERT INTO projects (id, user_id, name, description, status)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles LIMIT 1),
  'Test Todo App',
  'A sample todo application for testing the coding workflow',
  'active'
) ON CONFLICT DO NOTHING;

-- Sample coding session
INSERT INTO coding_sessions (
  id,
  user_id,
  project_id,
  initial_prompt,
  status,
  expires_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles LIMIT 1),
  (SELECT id FROM projects WHERE name = 'Test Todo App' LIMIT 1),
  'Build a todo app with React that allows users to add, complete, and delete tasks',
  'pending',
  NOW() + INTERVAL '1 hour'
) ON CONFLICT DO NOTHING;

-- Sample coding job
INSERT INTO coding_jobs (
  id,
  session_id,
  prompt,
  status,
  priority
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM coding_sessions WHERE initial_prompt LIKE '%todo app%' LIMIT 1),
  'Build a todo app with React that allows users to add, complete, and delete tasks',
  'pending',
  1
) ON CONFLICT DO NOTHING;

-- Sample session events
INSERT INTO session_events (session_id, event_type, data)
VALUES
  (
    (SELECT id FROM coding_sessions WHERE initial_prompt LIKE '%todo app%' LIMIT 1),
    'thinking',
    '{"message": "Analyzing the requirements for the todo app...", "timestamp": "2025-11-07T10:00:00Z"}'::jsonb
  ),
  (
    (SELECT id FROM coding_sessions WHERE initial_prompt LIKE '%todo app%' LIMIT 1),
    'terminal',
    '{"command": "npm create expo-app@latest", "output": "Creating a new Expo app...", "timestamp": "2025-11-07T10:00:05Z"}'::jsonb
  ),
  (
    (SELECT id FROM coding_sessions WHERE initial_prompt LIKE '%todo app%' LIMIT 1),
    'file_change',
    '{"file": "App.tsx", "operation": "created", "lines_added": 50, "timestamp": "2025-11-07T10:00:10Z"}'::jsonb
  ),
  (
    (SELECT id FROM coding_sessions WHERE initial_prompt LIKE '%todo app%' LIMIT 1),
    'preview_ready',
    '{"url": "https://exp.host/@user/todo-app", "message": "Preview is ready!", "timestamp": "2025-11-07T10:05:00Z"}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Query to verify seed data
-- Run these after seeding:
-- SELECT * FROM profiles;
-- SELECT * FROM projects;
-- SELECT * FROM coding_sessions;
-- SELECT * FROM coding_jobs;
-- SELECT * FROM session_events ORDER BY created_at;
