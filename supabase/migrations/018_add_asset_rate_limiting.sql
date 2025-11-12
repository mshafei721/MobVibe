-- Migration 018: Asset Generation Rate Limiting
-- Created: 2025-11-12
-- Purpose: Prevent API cost explosion from unlimited asset generation

-- Function: check_generation_limit
-- Check if user can generate assets based on hourly rate limits
CREATE OR REPLACE FUNCTION check_generation_limit(
  p_project_id UUID,
  p_asset_type TEXT
)
RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_count INTEGER;
  v_hourly_limit INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  -- Set hourly limits by asset type
  v_hourly_limit := CASE
    WHEN p_asset_type = 'icon' THEN 10
    WHEN p_asset_type = 'sound' THEN 5
    ELSE 5
  END;

  -- Calculate reset time (next hour)
  v_reset_at := DATE_TRUNC('hour', NOW()) + INTERVAL '1 hour';

  -- Count generations in current hour
  SELECT COUNT(*) INTO v_count
  FROM assets
  WHERE project_id = p_project_id
    AND type = p_asset_type
    AND created_at >= DATE_TRUNC('hour', NOW());

  -- Check if limit exceeded
  IF v_count >= v_hourly_limit THEN
    RETURN QUERY SELECT
      false AS allowed,
      FORMAT('Rate limit exceeded: max %s %s generations per hour', v_hourly_limit, p_asset_type) AS reason,
      0 AS remaining,
      v_reset_at AS reset_at;
  ELSE
    RETURN QUERY SELECT
      true AS allowed,
      NULL::TEXT AS reason,
      (v_hourly_limit - v_count) AS remaining,
      v_reset_at AS reset_at;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_generation_limit TO authenticated;

-- Comment
COMMENT ON FUNCTION check_generation_limit IS
  'Check if user can generate assets based on hourly rate limits. ' ||
  'Prevents API cost explosion from unlimited generations.';

-- Index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_assets_rate_limiting
  ON assets(project_id, type, created_at DESC)
  WHERE created_at >= NOW() - INTERVAL '1 hour';
