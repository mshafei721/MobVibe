# Phase 13 Context Bundle - Job Queue Implementation

## Project Context

**Project:** MobVibe - Mobile coding platform powered by Claude Code
**Phase:** 13 - Job Queue Implementation
**Goal:** Implement priority-based job queue with Realtime subscriptions for worker service

## Phase 13 Scope

### Objectives
1. Create PostgreSQL functions for job claiming and management
2. Implement Realtime triggers for job notifications
3. Build JobQueue class for worker service
4. Implement retry logic with exponential backoff
5. Create dead letter queue for failed jobs
6. Add queue monitoring and statistics

### Key Components
- Job queue SQL functions (`claim_next_job`, `complete_job`, `fail_job`)
- Realtime triggers for job lifecycle events
- JobQueue TypeScript class
- JobProcessor skeleton (actual processing in Phase 14+)
- QueueMonitor for observability

## Database Schema Context (From Phase 11)

### Coding Jobs Table

```sql
CREATE TABLE coding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Critical index for queue performance
CREATE INDEX coding_jobs_status_priority_idx ON coding_jobs(status, priority DESC, created_at ASC);
```

**Queue Fields:**
- `priority` - Higher number = higher priority (Pro:10, Starter:5, Free:0)
- `retry_count` - Current retry attempt
- `max_retries` - Maximum retries before moving to DLQ (default 3)
- `status` - Job lifecycle state

**RLS Policy:**
- Users can view jobs for their own sessions (subquery check)
- Service role bypasses RLS for worker service

**Index Strategy:**
- Composite index on (status, priority DESC, created_at ASC)
- Enables efficient queue queries: filter by status, order by priority, then FIFO

## Edge Functions Integration (From Phase 12)

### How Jobs Are Created

**start-coding-session:**
```typescript
// Creates initial job with tier-based priority
const { data: job } = await supabase
  .from('coding_jobs')
  .insert({
    session_id: session.id,
    prompt: prompt,
    status: 'pending',
    priority: tierPriority[profile.tier] // 10, 5, or 0
  })
```

**continue-coding:**
```typescript
// Adds follow-up job to existing session
const { data: job } = await supabase
  .from('coding_jobs')
  .insert({
    session_id: sessionId,
    prompt: prompt,
    status: 'pending',
    priority: tierPriority[profile?.tier]
  })
```

**Job Creation Flow:**
```
Mobile App → Edge Function → coding_jobs INSERT
                                   ↓
                            Realtime Trigger
                                   ↓
                            Worker Notification
                                   ↓
                            Worker Claims Job
```

## Job Queue Architecture

### Job Lifecycle States

```
[pending] ←─────────────┐
   ↓                     │
   ├─→ [processing]      │
   │         ↓           │
   │    [completed]      │
   │         ↓           │
   │      (done)         │
   │                     │
   └─→ [failed] ─────────┘
         ↓ (retry_count < max_retries)
      [pending] (retry)
         ↓ (retry_count >= max_retries)
      [failed] (DLQ)
```

### Job Claiming Strategy

**SELECT FOR UPDATE SKIP LOCKED Pattern:**
```sql
SELECT id FROM coding_jobs
WHERE status = 'pending'
ORDER BY priority DESC, created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

**Why This Works:**
- `FOR UPDATE` - Locks row within transaction
- `SKIP LOCKED` - Skips rows already locked by other workers
- Multiple workers can claim jobs concurrently
- No conflicts, no waiting

**Transaction Flow:**
```
BEGIN;
  -- Find and lock highest priority pending job
  SELECT id FROM coding_jobs WHERE ... FOR UPDATE SKIP LOCKED;

  -- Update status to processing
  UPDATE coding_jobs SET status = 'processing', started_at = NOW() WHERE id = ...;

  -- Return job details
  SELECT * FROM coding_jobs WHERE id = ...;
COMMIT;
```

### Priority-Based Processing

**Tier Priorities:**
- Enterprise: 10
- Pro: 10
- Starter: 5
- Free: 0

**Processing Order:**
1. Priority 10 jobs (Pro/Enterprise)
2. Priority 5 jobs (Starter)
3. Priority 0 jobs (Free)

Within same priority: FIFO (oldest first)

**Why Priority Matters:**
- Pro users get faster response times
- Incentivizes upgrades
- Free users still get processed (not starved)

## Retry Logic & Exponential Backoff

### Retry Strategy

**Default Configuration:**
- `max_retries: 3`
- Base delay: 1 second
- Exponential backoff with jitter

**Backoff Formula:**
```
wait_time = base_delay * (2 ^ retry_count) + random_jitter

Retry 1: ~1-2 seconds
Retry 2: ~2-4 seconds
Retry 3: ~4-8 seconds
```

**Implementation in SQL:**
```sql
-- Set visible_at for delayed retry
UPDATE coding_jobs
SET
  status = 'pending',
  retry_count = retry_count + 1,
  error_message = error_msg,
  updated_at = NOW()
WHERE id = job_id;
```

**Note:** Exponential backoff timing not enforced at DB level in MVP
- Worker service handles retry timing
- Future: Use `visible_at` field for DB-level delayed retry

### Dead Letter Queue (DLQ)

**When Job Moves to DLQ:**
- `retry_count >= max_retries`
- Job permanently failed

**DLQ Actions:**
```sql
-- Mark job as failed (DLQ)
UPDATE coding_jobs
SET
  status = 'failed',
  completed_at = NOW()
WHERE id = job_id AND retry_count >= max_retries;

-- Mark session as failed
UPDATE coding_sessions
SET status = 'failed', error_message = error_msg
WHERE id = session_id;
```

**DLQ Management:**
- Alert when jobs enter DLQ
- Manual investigation
- Fix root cause
- Optionally replay job

## Realtime Integration

### Realtime Notifications

**Purpose:**
- Notify workers of new jobs immediately
- Avoid polling delay
- Enable reactive processing

**pg_notify Pattern:**
```sql
-- Trigger on INSERT
CREATE TRIGGER on_job_created
  AFTER INSERT ON coding_jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_job();

-- Notification function
CREATE FUNCTION notify_new_job()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_job',
    json_build_object(
      'job_id', NEW.id,
      'priority', NEW.priority
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Supabase Realtime Subscription:**
```typescript
supabase
  .channel('new_jobs')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'coding_jobs',
    filter: 'status=eq.pending'
  }, callback)
  .subscribe()
```

### Fallback Polling

**Why Needed:**
- Realtime subscriptions can drop
- Network interruptions
- Ensures no jobs are missed

**Strategy:**
- Primary: Realtime subscription
- Fallback: Poll every 10 seconds when idle
- Check for pending jobs periodically

## Worker Service Architecture

### Components

```
JobProcessor (main orchestrator)
   ↓
JobQueue (database interface)
   ↓
Supabase (with service role key)
```

**JobProcessor:**
- Subscribes to Realtime notifications
- Polls for jobs (fallback)
- Claims jobs via JobQueue
- Processes jobs (Phase 14+)
- Handles completion/failure

**JobQueue:**
- `claimNextJob()` - Get next priority job
- `completeJob(id)` - Mark job completed
- `failJob(id, error)` - Handle job failure with retry
- `getQueueStats()` - Monitoring metrics

### Service Role Key Usage

**Important:** Worker service uses service role key, not anon key

**Why:**
- Bypass RLS policies
- Full access to all jobs
- Can update job status
- No user context required

**Security:**
- Service key only in backend
- Never exposed to client
- Secure environment variables

## Queue Statistics & Monitoring

### Metrics to Track

**Queue Health:**
```typescript
interface QueueStats {
  pending_count: number
  processing_count: number
  completed_count: number
  failed_count: number
  oldest_pending_age: Interval
}
```

**Derived Metrics:**
- Average processing time
- Jobs per minute throughput
- Error rate (failed / total)
- Retry rate

**Alerts:**
- Queue depth > threshold (backlog building)
- Oldest pending > X minutes (starvation)
- Error rate > Y% (systemic issues)
- No workers active (service down)

### Implementation

**SQL Function:**
```sql
CREATE FUNCTION get_queue_stats()
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'processing'),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    MAX(NOW() - created_at) FILTER (WHERE status = 'pending')
  FROM coding_jobs;
END;
$$ LANGUAGE plpgsql;
```

**Monitoring Service:**
```typescript
class QueueMonitor {
  async printStats() {
    const stats = await queue.getQueueStats()
    console.log('📊 Queue Statistics:')
    console.log(`  Pending: ${stats.pending_count}`)
    console.log(`  Processing: ${stats.processing_count}`)
    console.log(`  Failed: ${stats.failed_count}`)
  }

  startMonitoring(intervalMs = 30000) {
    setInterval(() => this.printStats(), intervalMs)
  }
}
```

## Error Handling Strategy

### Error Classification

**Retryable Errors (Transient):**
- Network timeouts
- Rate limits (429)
- Service unavailable (503)
- Database connection issues

**Non-Retryable Errors (Permanent):**
- Invalid input (400)
- Authentication failed (401)
- Not found (404)
- Business logic errors

**Implementation:**
```typescript
function isRetryable(error: Error): boolean {
  if (error.statusCode >= 500) return true
  if (error.statusCode === 429) return true
  if (error.code === 'ETIMEDOUT') return true
  return false
}
```

### Failure Scenarios

**Worker Crashes During Processing:**
- Job stuck in 'processing' state
- Solution: Add job timeout (Phase 14)
- After timeout, reclaim stale jobs

**Database Connection Lost:**
- Transaction rolled back automatically
- Job remains in 'pending' state
- Worker reconnects and retries

**Supabase Rate Limit Hit:**
- Retryable error
- Exponential backoff
- Job will retry after delay

## Performance Considerations

### Database Performance

**Index Usage:**
- Query uses `coding_jobs_status_priority_idx`
- Index-only scan possible
- Very fast even with millions of jobs

**Connection Pooling:**
- Use service role client with connection pooling
- PgBouncer if needed for high scale
- Monitor connection count

**Table Bloat:**
- High turnover can cause bloat
- Monitor with `pg_stat_user_tables`
- Tune autovacuum if needed
- Consider archiving old completed jobs

### Application Performance

**Concurrency:**
- Single worker: Process one job at a time
- Multiple workers: Parallel processing
- `SKIP LOCKED` prevents conflicts

**Memory:**
- Monitor JobProcessor memory usage
- Avoid loading large job results in memory
- Stream large payloads when possible

**Throughput:**
- Target: 1-10 jobs per second per worker
- Scalability: Add more workers horizontally
- Database can handle 10k+ jobs/second

## Integration Points

### Phase 11 (Database)
- Uses `coding_jobs` table with proper indexes
- RLS policies for user access
- Service role bypasses RLS for workers

### Phase 12 (Edge Functions)
- Edge Functions create jobs in `coding_jobs`
- Tier-based priorities set on creation
- Jobs immediately available for claiming

### Phase 14 (Worker Service) - Next
- Will use JobQueue class created in Phase 13
- Implement actual job processing logic
- E2B sandbox integration

### Phase 17 (Session Lifecycle)
- Session status updated based on job results
- Session marked failed if job in DLQ
- Events emitted to `session_events`

## Testing Strategy

### Unit Tests

**JobQueue Class:**
- Test claim returns highest priority job
- Test retry increments retry_count
- Test DLQ after max retries
- Test queue stats calculation

**SQL Functions:**
- Test `claim_next_job()` atomicity
- Test concurrent claims don't conflict
- Test `fail_job()` retry logic

### Integration Tests

**End-to-End Scenarios:**
1. Create job → Worker claims → Complete
2. Create job → Worker claims → Fail → Retry
3. Create job → Fail max times → Move to DLQ
4. Multiple workers claim different jobs

**Realtime Tests:**
- Verify trigger fires on INSERT
- Verify subscription receives notification
- Test reconnection after drop

### Load Tests (Future)

**Scenarios:**
- 100 jobs/second creation rate
- 10 concurrent workers
- Mix of priorities
- Measure: Throughput, latency, errors

## Security Considerations

### Service Role Key

**Usage:**
- Only in worker service backend
- Never in client code
- Secure environment variables

**Access:**
- Full database access
- Bypasses RLS
- Use carefully

### Job Data

**Sensitive Data:**
- Don't store secrets in job data
- Don't log sensitive information
- Use encrypted fields if needed

**Injection Prevention:**
- Parameterized queries (RPC functions)
- Validate job IDs before processing
- Sanitize error messages before logging

## Key Takeaways

1. **Atomic Job Claiming** - SELECT FOR UPDATE SKIP LOCKED ensures no conflicts
2. **Priority-Based** - Pro users get faster processing
3. **Resilient Retries** - Exponential backoff with jitter
4. **Dead Letter Queue** - Capture permanently failed jobs
5. **Realtime + Polling** - Fast notification with fallback
6. **Service Role Key** - Worker service bypasses RLS
7. **Comprehensive Monitoring** - Track queue health metrics
8. **Horizontal Scaling** - Add more workers as needed

## References

- Phase 11: Database Schema
- Phase 12: Edge Functions (Job Creation)
- Phase 14: Worker Service (Next - Job Processing)
- Research: Job Queue Patterns (docs/research/phase1/13/)
