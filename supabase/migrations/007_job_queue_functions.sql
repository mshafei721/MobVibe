-- Job Queue Functions
-- Phase 13: Job Queue Implementation

-- Function to claim next job atomically
CREATE OR REPLACE FUNCTION claim_next_job()
RETURNS TABLE (
  job_id UUID,
  session_id UUID,
  prompt TEXT,
  priority INTEGER
) AS $$
DECLARE
  claimed_job_id UUID;
BEGIN
  -- Find highest priority pending job and lock it
  SELECT id INTO claimed_job_id
  FROM coding_jobs
  WHERE status = 'pending'
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- Update status to processing if job found
  IF claimed_job_id IS NOT NULL THEN
    UPDATE coding_jobs
    SET
      status = 'processing',
      started_at = NOW(),
      updated_at = NOW()
    WHERE id = claimed_job_id;

    -- Return job details
    RETURN QUERY
    SELECT
      cj.id as job_id,
      cj.session_id,
      cj.prompt,
      cj.priority
    FROM coding_jobs cj
    WHERE cj.id = claimed_job_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION claim_next_job() IS 'Atomically claims the next highest priority pending job';

-- Function to mark job as completed
CREATE OR REPLACE FUNCTION complete_job(job_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE coding_jobs
  SET
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = job_id_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION complete_job(UUID) IS 'Marks a job as completed';

-- Function to handle job failure with retry logic
CREATE OR REPLACE FUNCTION fail_job(
  job_id_param UUID,
  error_msg TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_retry_count INT;
  max_retry_count INT;
  job_session_id UUID;
BEGIN
  -- Get retry counts and session_id
  SELECT retry_count, max_retries, session_id
  INTO current_retry_count, max_retry_count, job_session_id
  FROM coding_jobs
  WHERE id = job_id_param;

  -- Increment retry count
  current_retry_count := current_retry_count + 1;

  -- Check if we should retry
  IF current_retry_count < max_retry_count THEN
    -- Reset to pending for retry
    UPDATE coding_jobs
    SET
      status = 'pending',
      retry_count = current_retry_count,
      error_message = error_msg,
      updated_at = NOW()
    WHERE id = job_id_param;

    RETURN TRUE; -- Will retry
  ELSE
    -- Move to failed (dead letter queue)
    UPDATE coding_jobs
    SET
      status = 'failed',
      retry_count = current_retry_count,
      error_message = error_msg,
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = job_id_param;

    -- Also mark session as failed
    UPDATE coding_sessions
    SET
      status = 'failed',
      error_message = error_msg,
      updated_at = NOW()
    WHERE id = job_session_id;

    RETURN FALSE; -- Failed permanently (DLQ)
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fail_job(UUID, TEXT) IS 'Handles job failure with retry logic or moves to DLQ';

-- Function to get queue statistics
CREATE OR REPLACE FUNCTION get_queue_stats()
RETURNS TABLE (
  pending_count BIGINT,
  processing_count BIGINT,
  completed_count BIGINT,
  failed_count BIGINT,
  oldest_pending_age INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    MAX(NOW() - created_at) FILTER (WHERE status = 'pending') as oldest_pending_age
  FROM coding_jobs;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_queue_stats() IS 'Returns job queue statistics for monitoring';
