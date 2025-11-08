# MobVibe Job Queue System

## Overview

The MobVibe job queue is a priority-based, distributed task processing system built on PostgreSQL and Supabase Realtime. It manages coding job execution with retry logic, dead letter queuing, and comprehensive monitoring.

## Architecture

```
Mobile App → Edge Functions → coding_jobs INSERT
                                     ↓
                              Realtime Trigger
                                     ↓
                              Worker Notification
                                     ↓
                              Worker Claims Job (FOR UPDATE SKIP LOCKED)
                                     ↓
                              Process Job
                                     ↓
                          Complete / Fail (with retry)
```

### Components

1. **PostgreSQL Functions** - Atomic job claiming and management
2. **Realtime Triggers** - Immediate worker notification
3. **Worker Service** - Claims and processes jobs
4. **Queue Monitor** - Health metrics and statistics

## Job Lifecycle

```
[pending] ←─────────────┐
   ↓                     │
   ├─→ [processing]      │ (retry_count < max_retries)
   │         ↓           │
   │    [completed]      │
   │                     │
   └─→ [failed] ─────────┘
         ↓ (retry_count >= max_retries)
      [failed] (DLQ)
```

## Database Schema

```sql
CREATE TABLE coding_jobs (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES coding_sessions(id),
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  result JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Critical index for queue performance
CREATE INDEX coding_jobs_status_priority_idx
ON coding_jobs(status, priority DESC, created_at ASC);
```

## Queue Functions

### claim_next_job()

Atomically claims the highest priority pending job.

**Returns:** `{ job_id, session_id, prompt, priority }`

**Algorithm:**
1. SELECT FOR UPDATE SKIP LOCKED on highest priority job
2. Update status to 'processing'
3. Return job details

**Usage:**
```sql
SELECT * FROM claim_next_job();
```

### complete_job(job_id)

Marks a job as completed.

**Usage:**
```sql
SELECT complete_job('job-uuid');
```

### fail_job(job_id, error_msg)

Handles job failure with retry logic.

**Returns:** `boolean` (true = will retry, false = DLQ)

**Logic:**
- If `retry_count < max_retries`: Reset to 'pending', increment retry_count
- If `retry_count >= max_retries`: Move to 'failed', mark session as failed

**Usage:**
```sql
SELECT fail_job('job-uuid', 'Error message');
```

### get_queue_stats()

Returns queue statistics.

**Returns:**
```typescript
{
  pending_count: number
  processing_count: number
  completed_count: number
  failed_count: number
  oldest_pending_age: interval
}
```

## Priority System

Jobs are processed by priority (highest first), then FIFO within same priority.

| Tier | Priority | Processing Order |
|------|----------|------------------|
| Enterprise | 10 | 1st |
| Pro | 10 | 1st |
| Starter | 5 | 2nd |
| Free | 0 | 3rd |

**Example:**
- Job A: Priority 10, Created 10:00
- Job B: Priority 10, Created 10:01
- Job C: Priority 5, Created 09:59

**Processing Order:** A → B → C

## Retry Policy

### Configuration

- **Default max_retries:** 3
- **Retry strategy:** Reset to 'pending' with incremented retry_count
- **Exponential backoff:** Implemented in worker service (not DB level in MVP)

### Backoff Formula

```
wait_time = base_delay * (2 ^ retry_count) + jitter

Retry 1: ~1-2 seconds
Retry 2: ~2-4 seconds
Retry 3: ~4-8 seconds
```

### Example Flow

1. Job fails → `retry_count = 1`, status = 'pending'
2. Worker re-claims → Job fails again → `retry_count = 2`
3. Worker re-claims → Job fails again → `retry_count = 3` → status = 'failed' (DLQ)

## Dead Letter Queue (DLQ)

### Purpose

Capture permanently failed jobs after max retries exceeded.

### Behavior

When job moves to DLQ:
- Job status = 'failed'
- `completed_at` timestamp set
- Associated session marked as 'failed'
- Session `error_message` populated

### Management

**View DLQ:**
```sql
SELECT * FROM coding_jobs WHERE status = 'failed';
```

**Replay Job:**
```sql
UPDATE coding_jobs
SET status = 'pending', retry_count = 0
WHERE id = 'job-uuid';
```

## Realtime Integration

### Triggers

1. **on_job_created** - Fires on INSERT
2. **on_job_status_changed** - Fires on status UPDATE

### Notifications

**pg_notify Channels:**
- `new_job` - New pending job created
- `job_status_changed` - Job status updated

**Payload Example:**
```json
{
  "job_id": "uuid",
  "session_id": "uuid",
  "priority": 10,
  "created_at": "2025-01-01T10:00:00Z"
}
```

### Worker Subscription

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

## Worker Service

### JobQueue Class

```typescript
// Claim next job
const job = await queue.claimNextJob()

// Complete job
await queue.completeJob(jobId)

// Fail job
const willRetry = await queue.failJob(jobId, 'Error')

// Get stats
const stats = await queue.getQueueStats()

// Subscribe to new jobs
const unsubscribe = queue.subscribeToNewJobs(callback)
```

### JobProcessor Class

**Features:**
- Realtime subscription for immediate notification
- Polling fallback (10s interval)
- Prevents concurrent processing
- Automatic retry on next job after completion

**Flow:**
1. Subscribe to Realtime
2. On notification or poll → Claim next job
3. Process job (Phase 14 will add actual logic)
4. Complete or fail job
5. Check for next job

### Configuration

```bash
# .env
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your-key
POLL_INTERVAL_MS=10000
MONITOR_INTERVAL_MS=30000
```

### Running

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

## Monitoring

### Queue Statistics

```
📊 Queue Statistics
==================================================
  ⏳ Pending:     5
  ⚡ Processing:  2
  ✅ Completed:   143
  ❌ Failed:      1
  🕐 Oldest pending: 00:00:15
  📈 Success rate: 99.3%
==================================================
```

### Metrics to Track

**Queue Health:**
- Pending count (backlog)
- Processing count (active workers)
- Oldest pending age (starvation)
- Success rate (completed / total)

**Worker Health:**
- Jobs per minute
- Average processing time
- Error rate

**Alerts:**
- Queue depth > threshold
- Oldest pending > X minutes
- Error rate > Y%
- No workers active

## Performance

### Baseline (Phase 13)

- **Throughput:** ~5 jobs/second (single worker)
- **Claim Latency:** ~50ms
- **Memory:** ~50MB
- **Connections:** 1 persistent

### Optimization

**Database:**
- Index on (status, priority, created_at) - Essential
- Connection pooling (PgBouncer for high scale)
- Monitor table bloat, tune autovacuum

**Worker:**
- Horizontal scaling: Add more workers
- Vertical scaling: Phase 14 will add concurrency
- Target: 10+ jobs/second per worker

### Scaling

**Concurrent Workers:**
- `SKIP LOCKED` prevents conflicts
- Each worker maintains own connection
- Linear scaling with worker count

**High Volume:**
- 10 workers = 50-100 jobs/second
- PostgreSQL can handle 10k+ jobs/second

## Troubleshooting

### No Jobs Being Claimed

**Symptoms:** Worker running but no jobs processed

**Check:**
```sql
-- Are there pending jobs?
SELECT COUNT(*) FROM coding_jobs WHERE status = 'pending';

-- Are migrations applied?
SELECT * FROM claim_next_job();

-- Is worker using service role key?
```

### Jobs Stuck in 'processing'

**Symptoms:** Jobs never complete, stuck status

**Cause:** Worker crashed while processing

**Solution (Phase 14):** Job timeout and reclaim logic

**Manual Fix:**
```sql
-- Reset stuck jobs (>5 minutes old)
UPDATE coding_jobs
SET status = 'pending', started_at = NULL
WHERE status = 'processing'
AND started_at < NOW() - INTERVAL '5 minutes';
```

### Realtime Not Working

**Symptoms:** Jobs created but worker not notified

**Check:**
```sql
-- Is Realtime enabled?
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'coding_jobs';

-- Are triggers created?
SELECT * FROM pg_trigger
WHERE tgname IN ('on_job_created', 'on_job_status_changed');
```

**Fallback:** Polling continues every 10s

### High Retry Rate

**Symptoms:** Many jobs retrying multiple times

**Investigate:**
```sql
-- View jobs with retries
SELECT id, prompt, retry_count, error_message
FROM coding_jobs
WHERE retry_count > 0
ORDER BY retry_count DESC;
```

**Common Causes:**
- Transient network issues
- External API rate limits
- Resource constraints
- Code bugs

## Security

### Service Role Key

**Usage:** Worker service only, never in client

**Permissions:** Full database access, bypasses RLS

**Storage:** Environment variables, secret management

### Data Security

- Don't log sensitive data
- Sanitize error messages
- Validate job IDs

## Testing

### Unit Tests

```bash
npm test -- tests/backend/job-queue.test.ts
```

**Coverage:**
- Priority-based claiming
- Retry logic
- DLQ movement
- Queue statistics
- Concurrent worker conflicts

### Integration Tests

```bash
supabase start
npm test -- tests/backend/job-lifecycle.test.ts
```

**Scenarios:**
- Create → Claim → Complete
- Create → Claim → Fail → Retry
- Fail max times → DLQ
- Realtime notification

### Manual Testing

1. Start services
2. Create job via Edge Function
3. Observe worker logs
4. Verify queue stats

## API Reference

See `backend/worker/README.md` for detailed API documentation.

## Next Steps

**Phase 14:** Worker Service Foundation
- Implement actual job processing
- E2B sandbox integration
- Claude API integration
- Job timeout and reclaim logic
- Event streaming to session_events

---

**Version:** 1.0.0 (Phase 13)
**Last Updated:** 2025-01-01
