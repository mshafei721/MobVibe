# Job Queue Patterns Research - Phase 13

## Supabase Realtime Subscriptions Patterns 2025

### Core Best Practices

**Choosing the Right Approach:**
- **Broadcast over Postgres Changes** - Supabase recommends using Broadcast for most use cases
- Postgres Changes have limitations as applications scale
- Broadcast provides better performance for high-throughput scenarios

**Performance Optimization:**
- Enable Realtime on specific tables only (not all tables)
- Use selective event triggers (INSERT, UPDATE, DELETE)
- Apply filters to subscriptions to reduce unnecessary updates
- Avoid subscriptions without filters (can overload connections)

### Subscription Management Patterns

**Initial Data Loading Pattern:**
```typescript
// Best practice: Query first, then subscribe
const initialData = await supabase.from('jobs').select('*')

// Then subscribe to changes
const subscription = supabase
  .channel('jobs-channel')
  .on('postgres_changes', {...}, callback)
  .subscribe()
```

This avoids missing updates between load and subscription.

**Connection Management:**
- One connection per browser tab
- All channels share that connection
- Efficient multiplexing of subscriptions

**Lifecycle Management:**
- Initialize subscriptions on component/service mount
- **Always unsubscribe on unmount** - prevents memory leaks
- Clean up channels properly

### Security

- Realtime subscriptions respect Row-Level Security (RLS) policies
- Users only receive data they're authorized to see
- Database changes listening disabled by default for new projects
- Enable via Realtime replication management

### Filters and Performance

```typescript
// Good: Filtered subscription
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'coding_jobs',
  filter: 'status=eq.pending'
}, callback)

// Bad: Unfiltered subscription (avoid)
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'coding_jobs'
}, callback)
```

## PostgreSQL Job Queue Design

### Core Pattern: SELECT FOR UPDATE SKIP LOCKED

**Best Practice for Concurrent Queues:**
```sql
SELECT * FROM jobs
WHERE status = 'pending'
ORDER BY priority DESC, created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

**Key Benefits:**
- `FOR UPDATE` - Locks row for transaction
- `SKIP LOCKED` - Skips already-locked rows (no waiting)
- Multiple workers can claim jobs concurrently without conflicts
- Most important job assigned at all times

### Priority Queue Implementation

**Table Structure:**
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  job_data JSONB NOT NULL,
  priority INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3
);

-- Critical index for performance
CREATE INDEX jobs_queue_idx ON jobs(status, priority DESC, created_at ASC);
```

**Why This Index:**
- Filters by `status = 'pending'` first
- Orders by `priority DESC` (highest first)
- Then by `created_at ASC` (oldest first, FIFO within priority)
- Index-only scan possible for optimal performance

### Performance Considerations

**Challenge: Dynamic Priorities**
- Naive implementations with JOIN + ORDER BY can be very slow (>1 second)
- Solution: Denormalize priority data or use materialized views

**Table Bloat:**
- High-turnover queues cause table bloat
- Monitor and tune autovacuum settings
- Consider partitioning by date for historical jobs

**Throughput:**
- PostgreSQL can serve 10,000+ jobs/second with proper indexing
- Connection pooling essential for high throughput
- Use PgBouncer or similar for connection management

### Advanced Patterns

**Dual-Table Design:**
```
QUEUE table → Scheduler → WORK_QUEUE table → Workers
```

- QUEUE: Push work items
- Scheduler: Moves items to WORK_QUEUE based on priority/schedule
- WORK_QUEUE: Workers claim from here

**Resilient Job Handling with visible_at:**
```sql
CREATE TABLE jobs (
  ...
  visible_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claim job with timeout
UPDATE jobs
SET
  visible_at = NOW() + INTERVAL '60 seconds',
  status = 'processing'
WHERE id = (
  SELECT id FROM jobs
  WHERE visible_at <= NOW() AND status = 'pending'
  ORDER BY priority DESC
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)
RETURNING *;
```

**How It Works:**
- Worker sets `visible_at` to NOW + 60 seconds
- If worker crashes, job becomes visible again after timeout
- Another worker can claim it automatically
- No manual cleanup needed

### Job Lifecycle States

```
pending → processing → completed
                   ↓
                 failed (with retries)
                   ↓
              dead_letter (max retries exceeded)
```

## Exponential Backoff Retry Logic

### What is Exponential Backoff?

Retry strategy where wait time increases exponentially after each failure:
- 1st retry: 1 second
- 2nd retry: 2 seconds
- 3rd retry: 4 seconds
- 4th retry: 8 seconds
- etc.

### Why Use It?

**Transient Failures:**
- Momentary network glitches
- Overwhelmed servers
- Temporary resource unavailability

**Problems with Aggressive Retries:**
- Can overload network bandwidth
- Cause contention and make problems worse
- Amplify load on already-struggling systems

**Benefits:**
- Improves user experience
- Application resilience
- Respects rate limits
- Handles transient failures gracefully

### Implementation Formula

```
wait_time = base_delay * (2 ^ retry_count)
```

**Example:**
```typescript
const baseDelay = 1000 // 1 second
const maxRetries = 5
const retryCount = 2

const waitTime = baseDelay * Math.pow(2, retryCount)
// = 1000 * 4 = 4000ms (4 seconds)
```

### Adding Jitter

**Problem:** All clients retry at same time → thundering herd
**Solution:** Add randomness to break synchronization

```typescript
const jitter = Math.random() * 1000 // 0-1000ms
const waitTime = (baseDelay * Math.pow(2, retryCount)) + jitter
```

**Full Jitter (AWS recommended):**
```typescript
const maxWait = baseDelay * Math.pow(2, retryCount)
const waitTime = Math.random() * maxWait
```

### Capped Backoff

**Problem:** Exponential functions grow quickly → very long waits
**Solution:** Cap maximum wait time

```typescript
const MAX_WAIT = 60000 // 60 seconds
const waitTime = Math.min(
  baseDelay * Math.pow(2, retryCount),
  MAX_WAIT
)
```

### Error Classification

**Retryable Errors (Transient):**
- Network timeouts
- 5xx HTTP status codes (server errors)
- Connection refused
- Rate limit exceeded (429)

**Non-Retryable Errors (Permanent):**
- 4xx HTTP status codes (client errors)
- 400 Bad Request
- 401 Unauthorized
- 404 Not Found

**Best Practice:**
```typescript
function isRetryable(error: Error): boolean {
  if (error.statusCode >= 500) return true
  if (error.statusCode === 429) return true
  if (error.code === 'ETIMEDOUT') return true
  return false
}
```

### Advanced Patterns

**Queue-Based Exponential Backoff:**
```
Failed Job → Delay Queue → Wait (exponential time) → Retry Queue
```

**Benefits:**
- Durability: Jobs survive worker crashes
- Scalability: Multiple workers can process retries
- Observability: Track retry metrics centrally

**Implementation:**
```sql
UPDATE jobs
SET
  status = 'pending',
  retry_count = retry_count + 1,
  visible_at = NOW() + (retry_count * retry_count * INTERVAL '1 second')
WHERE id = job_id;
```

**Circuit Breaker Integration:**
- Temporarily suspend all requests when service appears down
- Prevents wasting resources on doomed requests
- Complements exponential backoff

**States:**
- Closed: Normal operation
- Open: Circuit tripped, fast-fail all requests
- Half-Open: Test if service recovered

### Idempotency

**Critical:** Operations must be idempotent when retrying
- Same request multiple times = same result
- Prevents partial updates corrupting state

**Strategies:**
- Idempotency keys (unique per request)
- Check-then-set patterns
- Atomic operations

### Implementation Example

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (!isRetryable(error) || attempt === maxRetries) {
        throw error
      }

      const jitter = Math.random() * 1000
      const waitTime = Math.min(
        baseDelay * Math.pow(2, attempt) + jitter,
        60000 // Max 60 seconds
      )

      console.log(`Retry ${attempt + 1}/${maxRetries} after ${waitTime}ms`)
      await sleep(waitTime)
    }
  }

  throw lastError
}
```

## Job Queue Best Practices

### Design Principles

1. **Atomicity** - Job claim and status update in single transaction
2. **Idempotency** - Safe to retry jobs without side effects
3. **Observability** - Log all state transitions
4. **Resilience** - Handle worker crashes gracefully
5. **Scalability** - Support multiple concurrent workers

### Monitoring Metrics

**Queue Health:**
- Pending job count
- Processing job count
- Completed job count
- Failed job count
- Oldest pending job age
- Average processing time

**Worker Health:**
- Active workers
- Jobs processed per minute
- Error rate
- Retry rate

**Alerts:**
- Queue depth exceeds threshold
- Oldest pending job > X minutes
- Error rate > Y%
- No workers active

### Performance Tuning

**Database:**
- Proper indexes on (status, priority, created_at)
- Connection pooling (PgBouncer)
- Tune autovacuum for high turnover
- Consider partitioning for large queues

**Application:**
- Batch job claims when possible
- Use prepared statements
- Connection pooling client-side
- Monitor memory usage

**Scaling:**
- Horizontal: Add more workers
- Vertical: Increase worker concurrency
- Database: Read replicas for metrics/monitoring

### Dead Letter Queue (DLQ)

**Purpose:**
- Capture permanently failed jobs
- Prevent infinite retry loops
- Enable manual investigation and retry

**Implementation:**
```sql
-- Move to DLQ after max retries
UPDATE jobs
SET
  status = 'failed',
  completed_at = NOW()
WHERE retry_count >= max_retries;
```

**DLQ Management:**
- Alert on DLQ items
- Manual review process
- Fix root cause
- Replay if needed

## Key Takeaways

### Supabase Realtime
1. Use Broadcast over Postgres Changes for scale
2. Always filter subscriptions
3. Unsubscribe to prevent memory leaks
4. RLS policies apply to subscriptions

### PostgreSQL Queue
1. Use SELECT FOR UPDATE SKIP LOCKED
2. Index on (status, priority, created_at)
3. Monitor table bloat
4. Can achieve 10k+ jobs/second

### Exponential Backoff
1. Add jitter to prevent thundering herd
2. Cap maximum wait time
3. Classify errors (retryable vs not)
4. Ensure operations are idempotent
5. Integrate with circuit breakers

### Job Queue Architecture
1. Atomic claim operations
2. Handle worker crashes with timeouts
3. Dead letter queue for failed jobs
4. Comprehensive monitoring
5. Horizontal scaling with multiple workers

## References

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [AWS Builders Library - Timeouts, Retries, and Backoff with Jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
- [Concurrent Job Queue in Postgres - Cargo Pants Programming](https://cargopantsprogramming.com/post/queues-in-postgres/)
- [Task Queue Design with Postgres (Medium)](https://medium.com/@huimin.hacker/task-queue-design-with-postgres-b57146d741dc)
