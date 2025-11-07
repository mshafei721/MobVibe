# 13-job-queue.md
---
phase_id: 13
title: Job Queue Implementation
duration_estimate: "2 days"
incremental_value: Priority-based task queue with Realtime subscriptions
owners: [Backend Engineer]
dependencies: [12]
linked_phases_forward: [14]
docs_referenced: [Architecture, Data Flow]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["Supabase Realtime subscriptions patterns", "Job queue design PostgreSQL", "Priority queue implementation"]
    outputs: ["/docs/research/phase1/13/job-queue-patterns.md"]
  - name: ContextCurator
    tool: context7
    scope: ["architecture.md job queue", "data-flow.md worker patterns", "Phase 12 Edge Functions"]
    outputs: ["/docs/context/phase1/13-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for implementing job queue with Realtime"
    outputs: ["/docs/sequencing/phase1/13-queue-steps.md"]
acceptance_criteria:
  - Worker can poll for pending jobs ordered by priority
  - Realtime notifications work for new jobs
  - Job status updates trigger Realtime events
  - Failed jobs retry with exponential backoff
  - Dead letter queue for permanently failed jobs
  - Queue statistics available (pending, processing, failed counts)
---

## Objectives

1. **Implement Job Queue** - Priority-based processing with Realtime
2. **Enable Worker Polling** - Workers can fetch and claim jobs
3. **Handle Failures** - Retry logic and dead letter queue

## Scope

### In
- Job polling by priority
- Realtime subscriptions for new jobs
- Job claiming and status updates
- Retry logic with exponential backoff
- Dead letter queue
- Queue statistics/monitoring

### Out
- Complex scheduling (cron jobs - later)
- Multiple queue types (single queue for MVP)
- Distributed locking (Postgres transactions sufficient)

## Tasks

- [ ] **Use context7** to compile queue context
- [ ] **Use websearch** for queue patterns
- [ ] **Use sequentialthinking** to plan implementation

- [ ] **Create Job Queue Helper Functions**:
  ```sql
  -- supabase/migrations/007_job_queue_functions.sql

  -- Function to claim next job
  CREATE OR REPLACE FUNCTION claim_next_job()
  RETURNS TABLE (
    job_id UUID,
    session_id UUID,
    prompt TEXT
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

    -- Update status to processing
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
        cj.prompt
      FROM coding_jobs cj
      WHERE cj.id = claimed_job_id;
    END IF;
  END;
  $$ LANGUAGE plpgsql;

  -- Function to complete job
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

  -- Function to fail job
  CREATE OR REPLACE FUNCTION fail_job(
    job_id_param UUID,
    error_msg TEXT
  )
  RETURNS BOOLEAN AS $$
  DECLARE
    current_retry_count INT;
    max_retry_count INT;
  BEGIN
    -- Get retry counts
    SELECT retry_count, max_retries
    INTO current_retry_count, max_retry_count
    FROM coding_jobs
    WHERE id = job_id_param;

    -- Increment retry count
    current_retry_count := current_retry_count + 1;

    -- Check if we should retry
    IF current_retry_count < max_retry_count THEN
      -- Reset to pending for retry with exponential backoff
      UPDATE coding_jobs
      SET
        status = 'pending',
        retry_count = current_retry_count,
        error_message = error_msg,
        updated_at = NOW()
      WHERE id = job_id_param;

      RETURN TRUE; -- Will retry
    ELSE
      -- Move to failed (dead letter)
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
      WHERE id = (SELECT session_id FROM coding_jobs WHERE id = job_id_param);

      RETURN FALSE; -- Failed permanently
    END IF;
  END;
  $$ LANGUAGE plpgsql;

  -- Function to get queue stats
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
  ```

- [ ] **Create Realtime Triggers**:
  ```sql
  -- supabase/migrations/008_realtime_triggers.sql

  -- Enable Realtime on coding_jobs table
  ALTER PUBLICATION supabase_realtime ADD TABLE coding_jobs;

  -- Trigger to notify on new job
  CREATE OR REPLACE FUNCTION notify_new_job()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Realtime will automatically broadcast INSERT
    -- We can also use pg_notify for custom channels if needed
    PERFORM pg_notify(
      'new_job',
      json_build_object(
        'job_id', NEW.id,
        'session_id', NEW.session_id,
        'priority', NEW.priority
      )::text
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER on_job_created
    AFTER INSERT ON coding_jobs
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_job();

  -- Trigger to notify on job status change
  CREATE OR REPLACE FUNCTION notify_job_status_change()
  RETURNS TRIGGER AS $$
  BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM pg_notify(
        'job_status_changed',
        json_build_object(
          'job_id', NEW.id,
          'session_id', NEW.session_id,
          'old_status', OLD.status,
          'new_status', NEW.status
        )::text
      );
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER on_job_status_changed
    AFTER UPDATE ON coding_jobs
    FOR EACH ROW
    EXECUTE FUNCTION notify_job_status_change();
  ```

- [ ] **Create Job Queue Client** (for worker):
  ```typescript
  // backend/worker/src/queue/JobQueue.ts
  import { createClient } from '@supabase/supabase-js'

  export class JobQueue {
    private supabase

    constructor() {
      this.supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role
      )
    }

    // Poll for next job
    async claimNextJob() {
      const { data, error } = await this.supabase
        .rpc('claim_next_job')

      if (error) throw error
      return data?.[0] || null
    }

    // Mark job as complete
    async completeJob(jobId: string) {
      const { error } = await this.supabase
        .rpc('complete_job', { job_id_param: jobId })

      if (error) throw error
    }

    // Mark job as failed
    async failJob(jobId: string, errorMessage: string) {
      const { data, error } = await this.supabase
        .rpc('fail_job', {
          job_id_param: jobId,
          error_msg: errorMessage
        })

      if (error) throw error
      return data // true if will retry, false if failed permanently
    }

    // Subscribe to new jobs (Realtime)
    subscribeToNewJobs(callback: (job: any) => void) {
      const channel = this.supabase
        .channel('new_jobs')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'coding_jobs',
            filter: 'status=eq.pending'
          },
          (payload) => {
            callback(payload.new)
          }
        )
        .subscribe()

      return () => channel.unsubscribe()
    }

    // Get queue statistics
    async getQueueStats() {
      const { data, error } = await this.supabase
        .rpc('get_queue_stats')

      if (error) throw error
      return data?.[0] || null
    }
  }
  ```

- [ ] **Create Job Processor Skeleton**:
  ```typescript
  // backend/worker/src/JobProcessor.ts
  import { JobQueue } from './queue/JobQueue'

  export class JobProcessor {
    private queue: JobQueue
    private isProcessing = false

    constructor() {
      this.queue = new JobQueue()
    }

    async start() {
      console.log('Job processor starting...')

      // Subscribe to new jobs
      this.queue.subscribeToNewJobs((job) => {
        console.log('New job notification:', job.id)
        this.processNextJob() // Trigger processing
      })

      // Initial poll
      this.processNextJob()

      // Periodic polling (backup if Realtime misses events)
      setInterval(() => {
        if (!this.isProcessing) {
          this.processNextJob()
        }
      }, 10000) // Every 10 seconds
    }

    private async processNextJob() {
      if (this.isProcessing) return

      this.isProcessing = true

      try {
        const job = await this.queue.claimNextJob()

        if (!job) {
          this.isProcessing = false
          return
        }

        console.log(`Processing job ${job.job_id}`)

        // TODO: Actual job processing (Phase 16-17)
        // For now, just simulate success
        await new Promise(resolve => setTimeout(resolve, 1000))

        await this.queue.completeJob(job.job_id)
        console.log(`Job ${job.job_id} completed`)

      } catch (error) {
        console.error('Job processing error:', error)
      } finally {
        this.isProcessing = false

        // Check for next job
        setTimeout(() => this.processNextJob(), 100)
      }
    }
  }

  // backend/worker/src/index.ts
  import { JobProcessor } from './JobProcessor'

  const processor = new JobProcessor()
  processor.start()

  console.log('Worker service started')
  ```

- [ ] **Test Queue Operations**:
  ```typescript
  // tests/backend/job-queue.test.ts
  describe('Job Queue', () => {
    let queue: JobQueue

    beforeAll(() => {
      queue = new JobQueue()
    })

    it('claims jobs by priority', async () => {
      // Create high priority job
      const { data: highPriorityJob } = await supabase
        .from('coding_jobs')
        .insert({ session_id: sessionId, prompt: 'Test', priority: 10 })
        .select()
        .single()

      // Create low priority job
      const { data: lowPriorityJob } = await supabase
        .from('coding_jobs')
        .insert({ session_id: sessionId, prompt: 'Test', priority: 0 })
        .select()
        .single()

      // Claim next job - should be high priority
      const claimed = await queue.claimNextJob()
      expect(claimed.job_id).toBe(highPriorityJob.id)
    })

    it('retries failed jobs', async () => {
      const job = await createTestJob()

      // Fail job first time
      const willRetry = await queue.failJob(job.id, 'Test error')
      expect(willRetry).toBe(true)

      // Check job status
      const { data: retriedJob } = await supabase
        .from('coding_jobs')
        .select('status, retry_count')
        .eq('id', job.id)
        .single()

      expect(retriedJob.status).toBe('pending')
      expect(retriedJob.retry_count).toBe(1)
    })

    it('moves to dead letter after max retries', async () => {
      const job = await createTestJob({ max_retries: 2 })

      // Fail twice
      await queue.failJob(job.id, 'Error 1')
      await queue.claimNextJob() // Re-claim
      const willRetry = await queue.failJob(job.id, 'Error 2')

      expect(willRetry).toBe(false)

      // Check status
      const { data: failedJob } = await supabase
        .from('coding_jobs')
        .select('status')
        .eq('id', job.id)
        .single()

      expect(failedJob.status).toBe('failed')
    })

    it('provides queue statistics', async () => {
      const stats = await queue.getQueueStats()

      expect(stats).toHaveProperty('pending_count')
      expect(stats).toHaveProperty('processing_count')
      expect(stats).toHaveProperty('failed_count')
    })
  })
  ```

- [ ] **Create Monitoring Dashboard** (simple):
  ```typescript
  // backend/worker/src/monitoring/QueueMonitor.ts
  import { JobQueue } from '../queue/JobQueue'

  export class QueueMonitor {
    private queue: JobQueue

    constructor() {
      this.queue = new JobQueue()
    }

    async printStats() {
      const stats = await this.queue.getQueueStats()

      console.log('📊 Queue Statistics:')
      console.log(`  Pending: ${stats.pending_count}`)
      console.log(`  Processing: ${stats.processing_count}`)
      console.log(`  Completed: ${stats.completed_count}`)
      console.log(`  Failed: ${stats.failed_count}`)
      if (stats.oldest_pending_age) {
        console.log(`  Oldest pending: ${stats.oldest_pending_age}`)
      }
    }

    startMonitoring(intervalMs = 30000) {
      setInterval(() => this.printStats(), intervalMs)
      this.printStats() // Print immediately
    }
  }
  ```

- [ ] **Document Queue System**:
  - Create: `docs/backend/JOB_QUEUE.md`
  - Include: Queue architecture diagram
  - Include: Job lifecycle flowchart
  - Include: Retry policy explanation
  - Include: Monitoring guide

- [ ] **Update links-map** with queue artifacts

## Artifacts & Paths

**Migrations:**
- `supabase/migrations/007_job_queue_functions.sql`
- `supabase/migrations/008_realtime_triggers.sql`

**Worker Code:**
- `backend/worker/src/queue/JobQueue.ts`
- `backend/worker/src/JobProcessor.ts`
- `backend/worker/src/monitoring/QueueMonitor.ts`

**Tests:**
- `tests/backend/job-queue.test.ts`

**Docs:**
- `docs/backend/JOB_QUEUE.md` ⭐

## Testing

### Phase-Only Tests
- Jobs claimed by priority
- Realtime notifications work
- Retry logic functions correctly
- Dead letter queue captures failures
- Queue stats accurate

### Cross-Phase Compatibility
- Phase 14 Worker Service will use JobQueue class
- Phase 16-17 will implement actual job processing

### Test Commands
```bash
# Run queue tests
npm test -- tests/backend/job-queue.test.ts

# Monitor queue
node backend/worker/dist/monitoring/monitor.js
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| Realtime subscription drops | Jobs missed | Implement polling backup |
| Job claimed but worker crashes | Job stuck | Add timeout, reclaim stale jobs |
| High job volume overwhelms queue | Performance | Monitor queue depth, add more workers |
| Exponential backoff too aggressive | Delays | Tune retry timing based on failure patterns |

## References

- [Architecture](./../../../../.docs/architecture.md) - Job queue architecture
- [Phase 12](./12-edge-functions.md) - Edge Functions creating jobs

## Handover

**Next Phase:** [14-worker-service.md](./14-worker-service.md) - Build worker service foundation

**Required Inputs Provided to Phase 14:**
- JobQueue class for job claiming
- Queue functions tested and working

---

**Status:** Ready after Phase 12
**Estimated Time:** 2 days
**Blocking Issues:** Requires Phase 12 Edge Functions
