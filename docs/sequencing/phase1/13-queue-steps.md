# Phase 13 Sequential Implementation Plan

## Overview
**Phase:** 13 - Job Queue Implementation
**Duration:** 2 days (16 hours)
**Complexity:** Medium-High

## Implementation Steps

### Step 1: Update coding_jobs Table Schema
**Duration:** 15 minutes
**Risk:** Low

**Purpose:** Add retry_count and max_retries columns if not already present

**Migration:** `supabase/migrations/006_update_coding_jobs.sql`

```sql
-- Add retry fields to coding_jobs if not exist
ALTER TABLE coding_jobs
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

ALTER TABLE coding_jobs
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;

-- Add started_at if not exist
ALTER TABLE coding_jobs
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
```

**Validation:**
- Columns exist on coding_jobs table
- Default values correct
- No data lost

---

### Step 2: Create Job Queue Functions
**Duration:** 1 hour
**Risk:** Medium (critical for queue operation)

**Migration:** `supabase/migrations/007_job_queue_functions.sql`

**Functions to Create:**

1. **claim_next_job()**
   - Finds highest priority pending job
   - Uses FOR UPDATE SKIP LOCKED
   - Atomically updates status to 'processing'
   - Returns job details

2. **complete_job(job_id)**
   - Updates status to 'completed'
   - Sets completed_at timestamp
   - Simple success handler

3. **fail_job(job_id, error_msg)**
   - Increments retry_count
   - If retry_count < max_retries: Reset to 'pending'
   - If retry_count >= max_retries: Move to 'failed' (DLQ)
   - Returns boolean (will_retry)

4. **get_queue_stats()**
   - Returns counts by status
   - Returns oldest pending job age
   - For monitoring dashboards

**Validation:**
- All 4 functions created without errors
- Functions callable via RPC
- Atomic transactions work correctly

---

### Step 3: Test Queue Functions in SQL
**Duration:** 30 minutes
**Risk:** Low

**Manual SQL Tests:**

```sql
-- Create test session and job
INSERT INTO coding_sessions (...) VALUES (...);
INSERT INTO coding_jobs (session_id, prompt, priority)
VALUES ('<session-id>', 'Test prompt', 10);

-- Test claim
SELECT * FROM claim_next_job();

-- Verify status changed to 'processing'
SELECT status FROM coding_jobs WHERE id = '<job-id>';

-- Test complete
SELECT complete_job('<job-id>');

-- Test fail with retries
INSERT INTO coding_jobs (...) VALUES (...); -- Create new job
SELECT * FROM claim_next_job();
SELECT fail_job('<job-id>', 'Test error'); -- Should return true (will retry)
SELECT status, retry_count FROM coding_jobs WHERE id = '<job-id>'; -- pending, 1

-- Test DLQ (fail max times)
UPDATE coding_jobs SET retry_count = 2 WHERE id = '<job-id>';
SELECT fail_job('<job-id>', 'Final error'); -- Should return false (DLQ)
SELECT status FROM coding_jobs WHERE id = '<job-id>'; -- failed

-- Test stats
SELECT * FROM get_queue_stats();
```

---

### Step 4: Create Realtime Triggers
**Duration:** 30 minutes
**Risk:** Low-Medium

**Migration:** `supabase/migrations/008_realtime_triggers.sql`

**Triggers to Create:**

1. **Enable Realtime on coding_jobs**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE coding_jobs;
   ```

2. **notify_new_job() trigger**
   - Fires on INSERT
   - Uses pg_notify for immediate notification
   - Passes job_id and priority

3. **notify_job_status_change() trigger**
   - Fires on UPDATE
   - Only when status changes
   - Notifies with old and new status

**Validation:**
- Realtime enabled on table
- Triggers created without errors
- pg_notify channels work

---

### Step 5: Test Realtime Notifications
**Duration:** 20 minutes
**Risk:** Low

**Test with psql:**

```sql
-- Terminal 1: Listen for notifications
LISTEN new_job;
LISTEN job_status_changed;

-- Terminal 2: Create job
INSERT INTO coding_jobs (session_id, prompt) VALUES (...);

-- Terminal 1 should receive notification

-- Terminal 2: Update status
UPDATE coding_jobs SET status = 'completed' WHERE id = '<job-id>';

-- Terminal 1 should receive status change notification
```

---

### Step 6: Setup Worker Service Project Structure
**Duration:** 30 minutes
**Risk:** Low

**Create Structure:**

```bash
mkdir -p backend/worker/src/queue
mkdir -p backend/worker/src/monitoring
mkdir -p backend/worker/src/types

# Create package.json
cd backend/worker
npm init -y
npm install @supabase/supabase-js typescript @types/node
npm install --save-dev ts-node nodemon

# Create tsconfig.json
```

**Files to Create:**
- `backend/worker/package.json`
- `backend/worker/tsconfig.json`
- `backend/worker/.env.example`
- `backend/worker/README.md`

---

### Step 7: Create TypeScript Types
**Duration:** 15 minutes
**Risk:** Low

**File:** `backend/worker/src/types/index.ts`

```typescript
export interface Job {
  job_id: string
  session_id: string
  prompt: string
  priority?: number
}

export interface QueueStats {
  pending_count: number
  processing_count: number
  completed_count: number
  failed_count: number
  oldest_pending_age: string | null
}
```

---

### Step 8: Implement JobQueue Class
**Duration:** 1.5 hours
**Risk:** Medium

**File:** `backend/worker/src/queue/JobQueue.ts`

**Methods:**
- `constructor()` - Initialize Supabase client with service role key
- `claimNextJob()` - Call claim_next_job() RPC
- `completeJob(jobId)` - Call complete_job() RPC
- `failJob(jobId, errorMessage)` - Call fail_job() RPC
- `subscribeToNewJobs(callback)` - Subscribe to Realtime INSERT events
- `getQueueStats()` - Call get_queue_stats() RPC

**Key Implementation Details:**
- Use `process.env.SUPABASE_SERVICE_ROLE_KEY`
- Error handling for all methods
- Proper typing for RPC calls
- Unsubscribe cleanup

---

### Step 9: Implement JobProcessor Skeleton
**Duration:** 1 hour
**Risk:** Low-Medium

**File:** `backend/worker/src/JobProcessor.ts`

**Responsibilities:**
- Subscribe to new job notifications
- Poll for jobs (fallback mechanism)
- Claim jobs via JobQueue
- Process jobs (placeholder for Phase 14)
- Handle completion/failure

**Key Features:**
- `isProcessing` flag prevents concurrent processing
- Realtime subscription for immediate notification
- Polling fallback every 10 seconds
- Automatic job claiming
- Graceful error handling

**Not Implemented Yet:**
- Actual job processing logic (Phase 14-17)
- E2B sandbox integration (Phase 15)
- Claude API integration (Phase 16)

---

### Step 10: Implement QueueMonitor
**Duration:** 30 minutes
**Risk:** Low

**File:** `backend/worker/src/monitoring/QueueMonitor.ts`

**Features:**
- `printStats()` - Print queue statistics to console
- `startMonitoring(intervalMs)` - Periodic stats printing
- Formatted output with emojis

**Usage:**
```typescript
const monitor = new QueueMonitor()
monitor.startMonitoring(30000) // Every 30 seconds
```

---

### Step 11: Create Worker Entry Point
**Duration:** 15 minutes
**Risk:** Low

**File:** `backend/worker/src/index.ts`

```typescript
import { JobProcessor } from './JobProcessor'
import { QueueMonitor } from './monitoring/QueueMonitor'

async function main() {
  console.log('🚀 Worker service starting...')

  // Start queue monitoring
  const monitor = new QueueMonitor()
  monitor.startMonitoring(30000)

  // Start job processor
  const processor = new JobProcessor()
  await processor.start()

  console.log('✅ Worker service ready')
}

main().catch(console.error)
```

**Scripts in package.json:**
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

### Step 12: Create Environment Configuration
**Duration:** 10 minutes
**Risk:** Low

**File:** `backend/worker/.env.example`

```bash
# Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Worker Configuration
POLL_INTERVAL_MS=10000
MONITOR_INTERVAL_MS=30000
```

**File:** `backend/worker/README.md`

```markdown
# MobVibe Worker Service

Job queue processor for MobVibe coding sessions.

## Setup

1. Copy .env.example to .env
2. Add Supabase service role key
3. Run `npm install`

## Development

npm run dev

## Production

npm run build
npm start
```

---

### Step 13: Create Unit Tests for JobQueue
**Duration:** 1 hour
**Risk:** Low

**File:** `tests/backend/job-queue.test.ts`

**Test Cases:**
1. Claims jobs by priority (highest first)
2. Retries failed jobs (increments retry_count)
3. Moves to DLQ after max retries
4. Provides accurate queue statistics
5. Handles concurrent claims without conflicts
6. Completes jobs successfully

**Setup:**
- Create test Supabase client
- Create test session and project
- Clean up after each test

---

### Step 14: Integration Tests for Job Lifecycle
**Duration:** 1 hour
**Risk:** Medium

**File:** `tests/backend/job-lifecycle.test.ts`

**Test Scenarios:**

1. **Happy Path:**
   - Create job → Claim → Complete
   - Verify status transitions

2. **Retry Flow:**
   - Create job → Claim → Fail (retry 1)
   - Claim again → Fail (retry 2)
   - Verify retry_count incremented

3. **DLQ Flow:**
   - Create job with max_retries=2
   - Fail twice
   - Verify moved to DLQ
   - Verify session marked failed

4. **Realtime Notification:**
   - Subscribe to new jobs
   - Create job via Edge Function
   - Verify notification received

5. **Concurrent Workers:**
   - Start 3 workers
   - Create 10 jobs
   - Verify no conflicts
   - Verify all jobs processed

---

### Step 15: Manual End-to-End Testing
**Duration:** 30 minutes
**Risk:** Low

**Test Flow:**

1. **Start Services:**
   ```bash
   # Terminal 1: Supabase
   supabase start

   # Terminal 2: Worker
   cd backend/worker
   npm run dev

   # Terminal 3: Edge Functions (optional)
   supabase functions serve
   ```

2. **Create Job via Edge Function:**
   ```bash
   curl -X POST http://localhost:54321/functions/v1/start-coding-session \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"projectId":"<uuid>","prompt":"Test job"}'
   ```

3. **Observe Worker Logs:**
   - Should see "New job notification"
   - Should see "Processing job <id>"
   - Should see "Job <id> completed"

4. **Check Queue Stats:**
   - Monitor output shows stats every 30s
   - Verify pending count decreases
   - Verify completed count increases

---

### Step 16: Create Job Queue Documentation
**Duration:** 2 hours
**Risk:** Low

**File:** `docs/backend/JOB_QUEUE.md`

**Sections:**
1. Overview & Architecture
2. Job Lifecycle Diagram
3. Queue Functions Reference
4. Realtime Integration
5. Retry Policy & Exponential Backoff
6. Dead Letter Queue
7. Monitoring & Statistics
8. Worker Service Setup
9. Troubleshooting Guide
10. Performance Tuning

---

### Step 17: Update Database Documentation
**Duration:** 15 minutes
**Risk:** Low

**Update:** `docs/backend/DATABASE.md`

**Add Sections:**
- Job Queue Functions
- Realtime Triggers
- Queue Performance Considerations

---

### Step 18: Create Worker Service Dockerfile (Optional)
**Duration:** 30 minutes
**Risk:** Low

**File:** `backend/worker/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

**File:** `backend/worker/.dockerignore`

```
node_modules
dist
.env
*.test.ts
```

---

### Step 19: Verification & Testing
**Duration:** 1 hour
**Risk:** Low

**Checklist:**
- [ ] All SQL functions created and working
- [ ] Realtime triggers fire correctly
- [ ] JobQueue class claims jobs by priority
- [ ] Retry logic increments retry_count
- [ ] DLQ captures failed jobs after max retries
- [ ] Queue stats accurate
- [ ] Worker subscribes to Realtime successfully
- [ ] Polling fallback works
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual E2E test successful
- [ ] Documentation complete

**Run All Tests:**
```bash
# Unit tests
npm test -- tests/backend/job-queue.test.ts

# Integration tests
npm test -- tests/backend/job-lifecycle.test.ts

# Check TypeScript compilation
cd backend/worker && npm run build
```

---

### Step 20: Performance Baseline
**Duration:** 30 minutes
**Risk:** Low

**Measure:**
- Job claim latency (should be <100ms)
- Throughput (jobs per second)
- Memory usage
- Database connection count

**Tools:**
- `console.time()` / `console.timeEnd()`
- Process memory monitoring
- Supabase dashboard metrics

**Document Baseline:**
```
Performance Baseline (Phase 13):
- Job claim: ~50ms average
- Throughput: ~5 jobs/second (single worker)
- Memory: ~50MB
- Connections: 1 persistent

Target for Phase 14:
- Throughput: 10+ jobs/second
- Support 10 concurrent workers
```

---

## Total Duration Summary

| Step | Task | Duration |
|------|------|----------|
| 1 | Update schema | 15 min |
| 2 | Create queue functions | 1 hour |
| 3 | Test SQL functions | 30 min |
| 4 | Create Realtime triggers | 30 min |
| 5 | Test Realtime | 20 min |
| 6 | Setup worker project | 30 min |
| 7 | Create types | 15 min |
| 8 | Implement JobQueue | 1.5 hours |
| 9 | Implement JobProcessor | 1 hour |
| 10 | Implement QueueMonitor | 30 min |
| 11 | Create entry point | 15 min |
| 12 | Environment config | 10 min |
| 13 | Unit tests | 1 hour |
| 14 | Integration tests | 1 hour |
| 15 | Manual E2E test | 30 min |
| 16 | Documentation | 2 hours |
| 17 | Update DB docs | 15 min |
| 18 | Dockerfile (optional) | 30 min |
| 19 | Verification | 1 hour |
| 20 | Performance baseline | 30 min |
| **Total** | | **~14 hours** |

**With Buffer (2 days):** Accounts for debugging, environment issues, breaks

---

## Dependencies

**Required Before Starting:**
- Phase 11: Database schema with coding_jobs table
- Phase 12: Edge Functions creating jobs
- Supabase local development environment
- Node.js 18+ installed

**Outputs to Phase 14:**
- JobQueue class ready to use
- JobProcessor skeleton ready for actual processing
- Queue functions tested and working
- Monitoring in place

---

## Risk Mitigation

### SQL Function Errors
- **Risk:** Functions don't compile or have logic errors
- **Mitigation:** Test each function independently with SQL first

### Realtime Subscription Issues
- **Risk:** Realtime doesn't fire or connection drops
- **Mitigation:** Implement polling fallback, test reconnection logic

### Concurrent Claim Conflicts
- **Risk:** Multiple workers claim same job
- **Mitigation:** Use FOR UPDATE SKIP LOCKED, test with multiple clients

### Worker Crashes
- **Risk:** Worker crashes while processing, job stuck
- **Mitigation:** Phase 14 will add job timeout and reclaim logic

### Environment Variables
- **Risk:** Missing or incorrect service role key
- **Mitigation:** Validate environment on startup, fail fast with clear errors

---

## Testing Strategy

### Unit Tests (Jest + Supabase)
- Test JobQueue methods in isolation
- Mock Supabase client responses when needed
- Fast feedback loop

### Integration Tests (Jest + Real DB)
- Test full job lifecycle
- Use local Supabase instance
- Verify Realtime notifications
- Test concurrent workers

### Manual Tests
- Create jobs via Edge Functions
- Watch worker logs
- Verify queue stats
- Check database directly

### Load Tests (Future - Phase 14)
- 100+ jobs/second
- 10 concurrent workers
- Measure throughput and latency

---

## Success Criteria

1. ✅ All SQL functions created and working
2. ✅ Realtime triggers fire on job INSERT/UPDATE
3. ✅ JobQueue class claims jobs by priority
4. ✅ Retry logic increments retry_count correctly
5. ✅ Jobs move to DLQ after max retries
6. ✅ Queue statistics accurate
7. ✅ Worker service starts without errors
8. ✅ Realtime subscription receives notifications
9. ✅ Polling fallback works if Realtime fails
10. ✅ Unit tests pass
11. ✅ Integration tests pass
12. ✅ Documentation complete
13. ✅ Manual E2E test successful

---

## Next Phase Handoff

**Phase 14: Worker Service Foundation**

**Inputs Provided:**
- JobQueue class with all CRUD operations
- Job claiming with priority support
- Retry logic with exponential backoff
- Dead letter queue implementation
- Monitoring and statistics

**Phase 14 Will Add:**
- Actual job processing logic
- E2B sandbox management
- Claude API integration
- Event streaming to session_events
- Job timeout and reclaim logic
