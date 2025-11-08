-- Migration 016: Rate Limiting & Usage Tracking
-- Created: 2025-11-08
-- Purpose: Add tier-based rate limiting and usage tracking for subscription management

-- Table: tier_limits
-- Store subscription tier configurations and limits
CREATE TABLE IF NOT EXISTS tier_limits (
  tier TEXT PRIMARY KEY CHECK (tier IN ('free', 'pro', 'unlimited')),
  sessions_per_month INTEGER NOT NULL,
  tokens_per_session INTEGER,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tier configurations
INSERT INTO tier_limits (tier, sessions_per_month, tokens_per_session, price_monthly) VALUES
  ('free', 3, 10000, 0),
  ('pro', 50, 100000, 9.99),
  ('unlimited', -1, -1, 29.99) -- -1 means unlimited
ON CONFLICT (tier) DO NOTHING;

-- Table: usage_periods
-- Track usage per user per period (monthly)
CREATE TABLE IF NOT EXISTS usage_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sessions_used INTEGER DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- Table: session_usage
-- Track individual session usage (for detailed analytics)
CREATE TABLE IF NOT EXISTS session_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES usage_periods(id) ON DELETE CASCADE,
  tokens_used INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add tier column to profiles table if not exists
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free'
    CHECK (tier IN ('free', 'pro', 'unlimited'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_periods_user_period
  ON usage_periods(user_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_session_usage_user
  ON session_usage(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_usage_period
  ON session_usage(period_id);

CREATE INDEX IF NOT EXISTS idx_profiles_tier
  ON profiles(tier);

-- Function: get_or_create_current_period
-- Returns the current period for a user, creating if needed
CREATE OR REPLACE FUNCTION get_or_create_current_period(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_period_id UUID;
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  -- Calculate current period boundaries (first day to last day of month)
  v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- Try to find existing period
  SELECT id INTO v_period_id
  FROM usage_periods
  WHERE user_id = p_user_id
    AND period_start = v_period_start;

  -- Create if not exists
  IF v_period_id IS NULL THEN
    INSERT INTO usage_periods (user_id, period_start, period_end)
    VALUES (p_user_id, v_period_start, v_period_end)
    RETURNING id INTO v_period_id;
  END IF;

  RETURN v_period_id;
END;
$$ LANGUAGE plpgsql;

-- Function: can_start_session
-- Check if user can start a new session based on tier limits
CREATE OR REPLACE FUNCTION can_start_session(p_user_id UUID)
RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  sessions_remaining INTEGER,
  sessions_used INTEGER,
  sessions_limit INTEGER,
  tier TEXT
) AS $$
DECLARE
  v_tier TEXT;
  v_period_id UUID;
  v_sessions_used INTEGER;
  v_sessions_limit INTEGER;
BEGIN
  -- Get user tier
  SELECT profiles.tier INTO v_tier
  FROM profiles
  WHERE id = p_user_id;

  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;

  -- Get tier limit
  SELECT sessions_per_month INTO v_sessions_limit
  FROM tier_limits
  WHERE tier_limits.tier = v_tier;

  -- Unlimited tier
  IF v_sessions_limit = -1 THEN
    RETURN QUERY SELECT
      true AS allowed,
      NULL::TEXT AS reason,
      -1 AS sessions_remaining,
      0 AS sessions_used,
      -1 AS sessions_limit,
      v_tier AS tier;
    RETURN;
  END IF;

  -- Get or create current period
  v_period_id := get_or_create_current_period(p_user_id);

  -- Get current usage
  SELECT up.sessions_used INTO v_sessions_used
  FROM usage_periods up
  WHERE id = v_period_id;

  -- Check limit
  IF v_sessions_used >= v_sessions_limit THEN
    RETURN QUERY SELECT
      false AS allowed,
      'Session limit reached for this month' AS reason,
      0 AS sessions_remaining,
      v_sessions_used AS sessions_used,
      v_sessions_limit AS sessions_limit,
      v_tier AS tier;
  ELSE
    RETURN QUERY SELECT
      true AS allowed,
      NULL::TEXT AS reason,
      (v_sessions_limit - v_sessions_used) AS sessions_remaining,
      v_sessions_used AS sessions_used,
      v_sessions_limit AS sessions_limit,
      v_tier AS tier;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: record_session_usage
-- Record session usage and update period totals
CREATE OR REPLACE FUNCTION record_session_usage(
  p_session_id UUID,
  p_tokens_used INTEGER DEFAULT 0,
  p_duration_seconds INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_period_id UUID;
BEGIN
  -- Get user_id from session
  SELECT user_id INTO v_user_id
  FROM coding_sessions
  WHERE id = p_session_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  -- Get or create current period
  v_period_id := get_or_create_current_period(v_user_id);

  -- Insert session usage record
  INSERT INTO session_usage (session_id, user_id, period_id, tokens_used, duration_seconds)
  VALUES (p_session_id, v_user_id, v_period_id, p_tokens_used, p_duration_seconds);

  -- Update period totals
  UPDATE usage_periods
  SET
    sessions_used = sessions_used + 1,
    tokens_used = tokens_used + p_tokens_used,
    updated_at = NOW()
  WHERE id = v_period_id;
END;
$$ LANGUAGE plpgsql;

-- Function: get_usage_stats
-- Get usage statistics for a user
CREATE OR REPLACE FUNCTION get_usage_stats(p_user_id UUID)
RETURNS TABLE(
  tier TEXT,
  period_start DATE,
  period_end DATE,
  sessions_used INTEGER,
  sessions_limit INTEGER,
  tokens_used BIGINT,
  tokens_limit INTEGER,
  usage_percentage NUMERIC
) AS $$
DECLARE
  v_tier TEXT;
  v_period_id UUID;
  v_sessions_limit INTEGER;
  v_tokens_limit INTEGER;
BEGIN
  -- Get user tier
  SELECT profiles.tier INTO v_tier
  FROM profiles
  WHERE id = p_user_id;

  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;

  -- Get tier limits
  SELECT tier_limits.sessions_per_month, tier_limits.tokens_per_session
  INTO v_sessions_limit, v_tokens_limit
  FROM tier_limits
  WHERE tier_limits.tier = v_tier;

  -- Get or create current period
  v_period_id := get_or_create_current_period(p_user_id);

  -- Return stats
  RETURN QUERY
  SELECT
    v_tier AS tier,
    up.period_start,
    up.period_end,
    up.sessions_used,
    v_sessions_limit AS sessions_limit,
    up.tokens_used,
    v_tokens_limit AS tokens_limit,
    CASE
      WHEN v_sessions_limit = -1 THEN 0::NUMERIC
      ELSE ROUND((up.sessions_used::NUMERIC / v_sessions_limit::NUMERIC) * 100, 2)
    END AS usage_percentage
  FROM usage_periods up
  WHERE up.id = v_period_id;
END;
$$ LANGUAGE plpgsql;

-- Function: get_usage_history
-- Get usage history for last N months
CREATE OR REPLACE FUNCTION get_usage_history(p_user_id UUID, p_months INTEGER DEFAULT 6)
RETURNS TABLE(
  period TEXT,
  sessions INTEGER,
  tokens BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(period_start, 'YYYY-MM') AS period,
    sessions_used AS sessions,
    tokens_used AS tokens
  FROM usage_periods
  WHERE user_id = p_user_id
    AND period_start >= (DATE_TRUNC('month', CURRENT_DATE) - (p_months || ' months')::INTERVAL)
  ORDER BY period_start DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: auto_record_session_usage
-- Automatically record session usage when session completes
CREATE OR REPLACE FUNCTION auto_record_session_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed', 'expired') AND OLD.status = 'active' THEN
    -- Record usage when session ends
    -- Token usage comes from session metadata
    PERFORM record_session_usage(
      NEW.id,
      COALESCE((NEW.state_snapshot->'metadata'->>'tokenUsage')::INTEGER, 0),
      EXTRACT(EPOCH FROM (COALESCE(NEW.completed_at, NOW()) - NEW.created_at))::INTEGER
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_auto_record_usage
  AFTER UPDATE ON coding_sessions
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'failed', 'expired') AND OLD.status = 'active')
  EXECUTE FUNCTION auto_record_session_usage();

-- RLS Policies
ALTER TABLE usage_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage periods"
  ON usage_periods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own session usage"
  ON session_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE tier_limits IS 'Subscription tier configurations and limits';
COMMENT ON TABLE usage_periods IS 'Monthly usage tracking per user';
COMMENT ON TABLE session_usage IS 'Individual session usage details';
COMMENT ON COLUMN profiles.tier IS 'User subscription tier (free, pro, unlimited)';

COMMENT ON FUNCTION get_or_create_current_period IS 'Get or create current month usage period for a user';
COMMENT ON FUNCTION can_start_session IS 'Check if user can start a new session based on tier limits';
COMMENT ON FUNCTION record_session_usage IS 'Record session usage and update period totals';
COMMENT ON FUNCTION get_usage_stats IS 'Get current usage statistics for a user';
COMMENT ON FUNCTION get_usage_history IS 'Get usage history for last N months';
