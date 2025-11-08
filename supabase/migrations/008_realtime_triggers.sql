-- Realtime Triggers for Job Queue
-- Phase 13: Job Queue Implementation

-- Enable Realtime on coding_jobs table
ALTER PUBLICATION supabase_realtime ADD TABLE coding_jobs;

-- Function to notify on new job creation
CREATE OR REPLACE FUNCTION notify_new_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Use pg_notify for immediate notification
  PERFORM pg_notify(
    'new_job',
    json_build_object(
      'job_id', NEW.id,
      'session_id', NEW.session_id,
      'priority', NEW.priority,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT to coding_jobs
CREATE TRIGGER on_job_created
  AFTER INSERT ON coding_jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_job();

COMMENT ON FUNCTION notify_new_job() IS 'Notifies workers of new jobs via pg_notify';

-- Function to notify on job status change
CREATE OR REPLACE FUNCTION notify_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM pg_notify(
      'job_status_changed',
      json_build_object(
        'job_id', NEW.id,
        'session_id', NEW.session_id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'updated_at', NEW.updated_at
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on UPDATE to coding_jobs
CREATE TRIGGER on_job_status_changed
  AFTER UPDATE ON coding_jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_job_status_change();

COMMENT ON FUNCTION notify_job_status_change() IS 'Notifies on job status changes via pg_notify';
