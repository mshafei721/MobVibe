-- Update coding_jobs table with retry fields
-- Phase 13: Job Queue Implementation

-- Add retry fields if they don't exist
ALTER TABLE coding_jobs
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

ALTER TABLE coding_jobs
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;

-- Add started_at timestamp if not exists
ALTER TABLE coding_jobs
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN coding_jobs.retry_count IS 'Number of times this job has been retried';
COMMENT ON COLUMN coding_jobs.max_retries IS 'Maximum number of retries before moving to DLQ';
COMMENT ON COLUMN coding_jobs.started_at IS 'When job processing started';
