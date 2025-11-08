-- Migration 017: Onboarding State & Progress Tracking
-- Created: 2025-11-08
-- Purpose: Track user onboarding progress, completed steps, milestones, and preferences

-- Table: onboarding_state
-- Track onboarding progress per user
CREATE TABLE IF NOT EXISTS onboarding_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 4,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: onboarding_steps
-- Track individual step completion
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('welcome', 'features', 'tiers', 'first_session', 'walkthrough', 'tip')),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, step_id)
);

-- Table: onboarding_milestones
-- Track learning achievements
CREATE TABLE IF NOT EXISTS onboarding_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id TEXT NOT NULL,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('first_session', 'first_execution', 'first_agent_interaction', 'first_session_completed', 'three_sessions', 'first_week')),
  achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, milestone_id)
);

-- Table: onboarding_preferences
-- User onboarding settings
CREATE TABLE IF NOT EXISTS onboarding_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  show_tips BOOLEAN DEFAULT TRUE,
  show_walkthrough BOOLEAN DEFAULT TRUE,
  tour_completed BOOLEAN DEFAULT FALSE,
  tips_dismissed INTEGER DEFAULT 0,
  preferred_language TEXT DEFAULT 'en',
  reduced_motion BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_state_user
  ON onboarding_state(user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_state_status
  ON onboarding_state(status);

CREATE INDEX IF NOT EXISTS idx_onboarding_steps_user
  ON onboarding_steps(user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_steps_type
  ON onboarding_steps(step_type, completed);

CREATE INDEX IF NOT EXISTS idx_onboarding_milestones_user
  ON onboarding_milestones(user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_milestones_type
  ON onboarding_milestones(milestone_type, achieved);

CREATE INDEX IF NOT EXISTS idx_onboarding_preferences_user
  ON onboarding_preferences(user_id);

-- Function: initialize_onboarding
-- Create onboarding state and preferences for new user
CREATE OR REPLACE FUNCTION initialize_onboarding(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Create onboarding state
  INSERT INTO onboarding_state (user_id, status, current_step, total_steps)
  VALUES (p_user_id, 'not_started', 0, 4)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create preferences
  INSERT INTO onboarding_preferences (user_id, show_tips, show_walkthrough, tour_completed)
  VALUES (p_user_id, TRUE, TRUE, FALSE)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create milestone tracking
  INSERT INTO onboarding_milestones (user_id, milestone_id, milestone_type, achieved)
  VALUES
    (p_user_id, 'first_session', 'first_session', FALSE),
    (p_user_id, 'first_execution', 'first_execution', FALSE),
    (p_user_id, 'first_agent_interaction', 'first_agent_interaction', FALSE),
    (p_user_id, 'first_session_completed', 'first_session_completed', FALSE),
    (p_user_id, 'three_sessions', 'three_sessions', FALSE),
    (p_user_id, 'first_week', 'first_week', FALSE)
  ON CONFLICT (user_id, milestone_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function: start_onboarding
-- Mark onboarding as started
CREATE OR REPLACE FUNCTION start_onboarding(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE onboarding_state
  SET
    status = 'in_progress',
    started_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND status = 'not_started';
END;
$$ LANGUAGE plpgsql;

-- Function: complete_onboarding_step
-- Mark a step as completed and advance progress
CREATE OR REPLACE FUNCTION complete_onboarding_step(
  p_user_id UUID,
  p_step_id TEXT,
  p_step_type TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
  v_current_step INTEGER;
  v_total_steps INTEGER;
BEGIN
  -- Insert or update step
  INSERT INTO onboarding_steps (user_id, step_id, step_type, completed, completed_at, data)
  VALUES (p_user_id, p_step_id, p_step_type, TRUE, NOW(), p_data)
  ON CONFLICT (user_id, step_id)
  DO UPDATE SET
    completed = TRUE,
    completed_at = NOW(),
    data = p_data;

  -- Get current progress
  SELECT current_step, total_steps
  INTO v_current_step, v_total_steps
  FROM onboarding_state
  WHERE user_id = p_user_id;

  -- Advance step if not completed
  IF v_current_step < v_total_steps THEN
    UPDATE onboarding_state
    SET
      current_step = v_current_step + 1,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Check if all steps completed
  IF v_current_step + 1 >= v_total_steps THEN
    UPDATE onboarding_state
    SET
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND status = 'in_progress';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: skip_onboarding
-- Mark onboarding as skipped
CREATE OR REPLACE FUNCTION skip_onboarding(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE onboarding_state
  SET
    status = 'skipped',
    skipped_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND status IN ('not_started', 'in_progress');

  -- Update preferences
  UPDATE onboarding_preferences
  SET
    show_tips = FALSE,
    show_walkthrough = FALSE,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: achieve_milestone
-- Mark a milestone as achieved
CREATE OR REPLACE FUNCTION achieve_milestone(
  p_user_id UUID,
  p_milestone_id TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  UPDATE onboarding_milestones
  SET
    achieved = TRUE,
    achieved_at = NOW(),
    metadata = p_metadata
  WHERE user_id = p_user_id
    AND milestone_id = p_milestone_id
    AND achieved = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function: get_onboarding_progress
-- Get user's onboarding progress
CREATE OR REPLACE FUNCTION get_onboarding_progress(p_user_id UUID)
RETURNS TABLE(
  status TEXT,
  current_step INTEGER,
  total_steps INTEGER,
  progress_percentage INTEGER,
  completed_steps JSONB,
  milestones JSONB,
  preferences JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    os.status,
    os.current_step,
    os.total_steps,
    CASE
      WHEN os.total_steps > 0 THEN ROUND((os.current_step::NUMERIC / os.total_steps::NUMERIC) * 100)::INTEGER
      ELSE 0
    END AS progress_percentage,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'step_id', step_id,
        'step_type', step_type,
        'completed', completed,
        'completed_at', completed_at
      )), '[]'::jsonb)
      FROM onboarding_steps
      WHERE user_id = p_user_id
    ) AS completed_steps,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'milestone_id', milestone_id,
        'milestone_type', milestone_type,
        'achieved', achieved,
        'achieved_at', achieved_at
      )), '[]'::jsonb)
      FROM onboarding_milestones
      WHERE user_id = p_user_id
    ) AS milestones,
    (
      SELECT jsonb_build_object(
        'show_tips', show_tips,
        'show_walkthrough', show_walkthrough,
        'tour_completed', tour_completed,
        'tips_dismissed', tips_dismissed,
        'reduced_motion', reduced_motion
      )
      FROM onboarding_preferences
      WHERE user_id = p_user_id
    ) AS preferences
  FROM onboarding_state os
  WHERE os.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: should_show_tip
-- Determine if contextual tip should be shown
CREATE OR REPLACE FUNCTION should_show_tip(
  p_user_id UUID,
  p_session_count INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_show_tips BOOLEAN;
  v_tips_dismissed INTEGER;
BEGIN
  SELECT show_tips, tips_dismissed
  INTO v_show_tips, v_tips_dismissed
  FROM onboarding_preferences
  WHERE user_id = p_user_id;

  -- Don't show if tips disabled
  IF NOT v_show_tips THEN
    RETURN FALSE;
  END IF;

  -- Don't show if dismissed too many times
  IF v_tips_dismissed > 5 THEN
    RETURN FALSE;
  END IF;

  -- Show tips for first 3 sessions
  RETURN p_session_count <= 3;
END;
$$ LANGUAGE plpgsql;

-- Function: dismiss_tip
-- Increment dismissed tips counter
CREATE OR REPLACE FUNCTION dismiss_tip(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE onboarding_preferences
  SET
    tips_dismissed = tips_dismissed + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: update_onboarding_preferences
-- Update user's onboarding preferences
CREATE OR REPLACE FUNCTION update_onboarding_preferences(
  p_user_id UUID,
  p_show_tips BOOLEAN DEFAULT NULL,
  p_show_walkthrough BOOLEAN DEFAULT NULL,
  p_reduced_motion BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE onboarding_preferences
  SET
    show_tips = COALESCE(p_show_tips, show_tips),
    show_walkthrough = COALESCE(p_show_walkthrough, show_walkthrough),
    reduced_motion = COALESCE(p_reduced_motion, reduced_motion),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: auto_initialize_onboarding
-- Automatically initialize onboarding for new users
CREATE OR REPLACE FUNCTION auto_initialize_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialize onboarding state for new profile
  PERFORM initialize_onboarding(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_auto_initialize_onboarding
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_initialize_onboarding();

-- Trigger function: auto_track_milestones
-- Automatically track milestones from session events
CREATE OR REPLACE FUNCTION auto_track_milestones()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_session_count INTEGER;
BEGIN
  -- Get user_id from session
  SELECT user_id INTO v_user_id
  FROM coding_sessions
  WHERE id = NEW.session_id;

  -- Track first_session milestone
  IF NOT EXISTS (
    SELECT 1 FROM onboarding_milestones
    WHERE user_id = v_user_id
      AND milestone_id = 'first_session'
      AND achieved = TRUE
  ) THEN
    PERFORM achieve_milestone(v_user_id, 'first_session', jsonb_build_object('session_id', NEW.session_id));
  END IF;

  -- Track first_execution on first output event
  IF NEW.event_type = 'output' AND NOT EXISTS (
    SELECT 1 FROM onboarding_milestones
    WHERE user_id = v_user_id
      AND milestone_id = 'first_execution'
      AND achieved = TRUE
  ) THEN
    PERFORM achieve_milestone(v_user_id, 'first_execution', jsonb_build_object('session_id', NEW.session_id));
  END IF;

  -- Track first_agent_interaction on first agent event
  IF NEW.event_type = 'agent' AND NOT EXISTS (
    SELECT 1 FROM onboarding_milestones
    WHERE user_id = v_user_id
      AND milestone_id = 'first_agent_interaction'
      AND achieved = TRUE
  ) THEN
    PERFORM achieve_milestone(v_user_id, 'first_agent_interaction', jsonb_build_object('session_id', NEW.session_id));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_events_auto_track_milestones
  AFTER INSERT ON session_events
  FOR EACH ROW
  EXECUTE FUNCTION auto_track_milestones();

-- Trigger function: track_session_completion_milestone
-- Track first_session_completed and three_sessions milestones
CREATE OR REPLACE FUNCTION track_session_completion_milestone()
RETURNS TRIGGER AS $$
DECLARE
  v_completed_count INTEGER;
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'active' THEN
    -- Track first_session_completed
    IF NOT EXISTS (
      SELECT 1 FROM onboarding_milestones
      WHERE user_id = NEW.user_id
        AND milestone_id = 'first_session_completed'
        AND achieved = TRUE
    ) THEN
      PERFORM achieve_milestone(NEW.user_id, 'first_session_completed', jsonb_build_object('session_id', NEW.id));
    END IF;

    -- Count completed sessions
    SELECT COUNT(*) INTO v_completed_count
    FROM coding_sessions
    WHERE user_id = NEW.user_id
      AND status = 'completed';

    -- Track three_sessions milestone
    IF v_completed_count >= 3 AND NOT EXISTS (
      SELECT 1 FROM onboarding_milestones
      WHERE user_id = NEW.user_id
        AND milestone_id = 'three_sessions'
        AND achieved = TRUE
    ) THEN
      PERFORM achieve_milestone(NEW.user_id, 'three_sessions', jsonb_build_object('session_count', v_completed_count));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coding_sessions_track_completion_milestone
  AFTER UPDATE ON coding_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status = 'active')
  EXECUTE FUNCTION track_session_completion_milestone();

-- RLS Policies
ALTER TABLE onboarding_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding state"
  ON onboarding_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding state"
  ON onboarding_state FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own onboarding steps"
  ON onboarding_steps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding steps"
  ON onboarding_steps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own milestones"
  ON onboarding_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own preferences"
  ON onboarding_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON onboarding_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE onboarding_state IS 'User onboarding progress tracking';
COMMENT ON TABLE onboarding_steps IS 'Individual onboarding step completion';
COMMENT ON TABLE onboarding_milestones IS 'Learning achievement milestones';
COMMENT ON TABLE onboarding_preferences IS 'User onboarding settings and preferences';

COMMENT ON FUNCTION initialize_onboarding IS 'Initialize onboarding for new user';
COMMENT ON FUNCTION start_onboarding IS 'Mark onboarding as started';
COMMENT ON FUNCTION complete_onboarding_step IS 'Complete an onboarding step and advance progress';
COMMENT ON FUNCTION skip_onboarding IS 'Mark onboarding as skipped and disable tips';
COMMENT ON FUNCTION achieve_milestone IS 'Mark a learning milestone as achieved';
COMMENT ON FUNCTION get_onboarding_progress IS 'Get user onboarding progress with steps and milestones';
COMMENT ON FUNCTION should_show_tip IS 'Determine if contextual tip should be shown';
COMMENT ON FUNCTION dismiss_tip IS 'Increment dismissed tips counter';
COMMENT ON FUNCTION update_onboarding_preferences IS 'Update user onboarding preferences';
