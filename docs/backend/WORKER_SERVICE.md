# MobVibe Worker Service

## Overview

The MobVibe Worker Service is a production-ready Node.js service that processes coding jobs from the PostgreSQL queue. It features structured logging, health checks, graceful shutdown, and Docker support.

## Architecture

```
┌─────────────────────────────────────┐
│      MobVibe Worker Service         │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │      HealthServer (8080)     │  │
│  │    GET /health → JSON        │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │      JobProcessor            │  │
│  │  • Realtime subscription     │  │
│  │  • Polling fallback (10s)    │  │
│  │  • Job claiming & processing │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │      QueueMonitor            │  │
│  │  Stats logging every 30s     │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
           ↓
    ┌─────────────┐
    │  Supabase   │
    │  PostgreSQL │
    │  (Job Queue)│
    └─────────────┘
```

### Components

1. **HealthServer**: HTTP server for Docker health checks
2. **JobProcessor**: Claims and processes jobs with retry logic
3. **QueueMonitor**: Logs queue statistics periodically
4. **JobQueue**: Interfaces with PostgreSQL queue functions
5. **Logger**: Structured JSON logging with pino
6. **Config**: Type-safe environment configuration

## Configuration

### Environment Variables

Create `.env` file in `backend/worker/`:

```bash
# Supabase Configuration (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Worker Configuration (Optional with defaults)
POLL_INTERVAL_MS=10000              # Polling interval (10 seconds)
MAX_CONCURRENT_JOBS=1               # Future: concurrent processing
SHUTDOWN_TIMEOUT_MS=30000           # Graceful shutdown timeout

# Health Check (Optional)
HEALTH_CHECK_PORT=8080              # Health check HTTP port

# Logging (Optional)
LOG_LEVEL=info                      # trace|debug|info|warn|error|fatal
NODE_ENV=development                # development|production

# Monitoring (Optional)
MONITOR_INTERVAL_MS=30000           # Stats logging interval
```

### Configuration Validation

The service validates required environment variables on startup:
- **SUPABASE_URL**: Required, validates format
- **SUPABASE_SERVICE_ROLE_KEY**: Required, used for queue operations

Missing required variables cause immediate exit with error code 1.

## Development

### Local Setup

```bash
# 1. Navigate to worker directory
cd backend/worker

# 2. Install dependencies
npm install

# 3. Create .env file from example
cp .env.example .env

# 4. Edit .env with your Supabase credentials
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required

# 5. Start Supabase (if using local)
# From project root:
supabase start

# 6. Run in development mode (with hot reload)
npm run dev
```

### Development Mode Features

- **Hot Reload**: Uses `tsx watch` for instant updates
- **Pretty Logging**: Color-coded, human-readable logs
- **Detailed Tracing**: Set `LOG_LEVEL=debug` for verbose output

### Build & Production

```bash
# Build TypeScript to JavaScript
npm run build

# Run production build
npm start

# Production features:
# - JSON structured logging
# - Optimized performance
# - Minimal dependencies
```

## Docker

### Building the Image

```bash
# Build Docker image
npm run docker:build

# Or directly:
docker build -t mobvibe-worker .

# Multi-stage build:
# - Stage 1: Build TypeScript
# - Stage 2: Production runtime with node:20-alpine
# - Final size: ~120MB
```

### Running with Docker Compose

```bash
# Start worker service
npm run docker:run

# Or directly:
docker-compose up

# With logs:
docker-compose up -d
docker-compose logs -f worker

# Stop service:
npm run docker:stop
```

### Docker Health Checks

The container includes automatic health checks:

```yaml
HEALTHCHECK:
  interval: 30s      # Check every 30 seconds
  timeout: 5s        # Fail if no response in 5s
  start_period: 10s  # Grace period during startup
  retries: 3         # Mark unhealthy after 3 failures
```

**Check health status**:
```bash
# View container health
docker ps

# Manual health check
curl http://localhost:8080/health
```

**Health check response**:
```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2025-01-07T12:00:00.000Z"
}
```

### Docker Environment Variables

Set in `docker-compose.yml` or via `.env` file:

```yaml
environment:
  - SUPABASE_URL=${SUPABASE_URL}
  - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
  - LOG_LEVEL=debug
  - POLL_INTERVAL_MS=5000
```

## Monitoring

### Structured Logging

The service uses **pino** for high-performance structured logging.

**Log Levels**:
- `fatal`: Unrecoverable errors (exits process)
- `error`: Errors requiring attention
- `warn`: Warning conditions
- `info`: Informational messages (default)
- `debug`: Detailed debug information
- `trace`: Very detailed tracing

**Log Format**:
- **Development**: Pretty-printed, colorized
- **Production**: Single-line JSON

**Example logs**:
```json
{
  "level": 30,
  "time": 1704715200000,
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "sessionId": "789e4567-e89b-12d3-a456-426614174001",
  "duration": 2145,
  "msg": "Job completed"
}
```

### Queue Statistics

The QueueMonitor logs stats every 30 seconds (configurable):

```json
{
  "level": 30,
  "pending": 5,
  "processing": 2,
  "completed": 143,
  "failed": 1,
  "oldestPending": "00:00:15",
  "successRate": "99.3",
  "msg": "Queue statistics"
}
```

**Metrics to track**:
- **Pending**: Jobs waiting to be processed
- **Processing**: Currently active jobs
- **Completed**: Successfully finished jobs
- **Failed**: Jobs in dead letter queue
- **Oldest Pending**: Age of oldest waiting job
- **Success Rate**: completed / (completed + failed)

### Performance Metrics

**Baseline Performance** (Phase 14):
- Throughput: ~30-60 jobs/minute (single worker)
- Claim Latency: ~50ms
- Memory Usage: ~50-70MB
- CPU: <5% idle, 10-20% under load

**Scaling** (Future):
- Horizontal: Add more worker containers
- Target: 10 workers = 300-600 jobs/minute
- PostgreSQL can handle 10k+ jobs/second

### Log Aggregation

**Production Setup**:

1. **Docker Logs** → JSON output
2. **Log Shipper** (Filebeat, Fluentd)
3. **Aggregation** (Elasticsearch, Loki)
4. **Visualization** (Kibana, Grafana)

**Example log query** (Elasticsearch):
```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "msg": "Job completed" }},
        { "range": { "duration": { "gte": 5000 }}}
      ]
    }
  }
}
```

## Troubleshooting

### Worker Not Starting

**Symptom**: Service exits immediately

**Check**:
```bash
# View logs
docker-compose logs worker

# Common issues:
# - Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
# - Invalid Supabase credentials
# - Port 8080 already in use
```

**Solution**:
- Verify `.env` file exists and has correct values
- Test Supabase connection: `curl $SUPABASE_URL/rest/v1/`
- Change health check port: `HEALTH_CHECK_PORT=8081`

### No Jobs Being Processed

**Symptom**: Worker running but no job processing logs

**Check**:
```sql
-- Are there pending jobs?
SELECT COUNT(*) FROM coding_jobs WHERE status = 'pending';

-- Are queue functions working?
SELECT * FROM claim_next_job();
```

**Solution**:
- Ensure database migrations applied (Phase 13)
- Verify service role key has database access
- Check Realtime is enabled on `coding_jobs` table

### Jobs Stuck in Processing

**Symptom**: Jobs never complete, stuck status

**Cause**: Worker crashed while processing

**Solution** (Manual):
```sql
-- Reset stuck jobs (>5 minutes old)
UPDATE coding_jobs
SET status = 'pending', started_at = NULL
WHERE status = 'processing'
AND started_at < NOW() - INTERVAL '5 minutes';
```

**Prevention** (Phase 18):
- Job timeout and reclaim logic
- Worker heartbeat system

### Realtime Not Working

**Symptom**: Jobs created but worker not notified

**Check**:
```sql
-- Is Realtime enabled?
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'coding_jobs';

-- Are triggers created?
SELECT * FROM pg_trigger
WHERE tgname IN ('on_job_created', 'on_job_status_changed');
```

**Fallback**: Polling continues every 10s even without Realtime

### High Memory Usage

**Symptom**: Worker memory grows over time

**Check**:
```bash
# Monitor memory
docker stats mobvibe-worker

# Check for leaks
NODE_ENV=production node --inspect dist/index.js
```

**Solution**:
- Review job processing logic (Phase 15-17)
- Ensure proper cleanup in JobProcessor
- Consider memory limit in Docker: `mem_limit: 512m`

### Graceful Shutdown Timeout

**Symptom**: "Shutdown timeout - job may be incomplete"

**Cause**: Job taking longer than `SHUTDOWN_TIMEOUT_MS`

**Solution**:
- Increase timeout: `SHUTDOWN_TIMEOUT_MS=60000` (60s)
- Job will be reclaimed by another worker
- Optimize job processing time

## Production Deployment

### Deployment Strategies

**Option 1: Docker Compose** (Simple)
```bash
# On production server
git pull origin main
cd backend/worker
docker-compose up -d --build

# Zero downtime: start new, stop old
docker-compose up -d --scale worker=2
sleep 30
docker-compose up -d --scale worker=1
```

**Option 2: Docker Swarm** (Multi-host)
```bash
# Deploy service
docker stack deploy -c docker-compose.yml mobvibe

# Scale workers
docker service scale mobvibe_worker=5

# Update image
docker service update --image mobvibe-worker:latest mobvibe_worker
```

**Option 3: Kubernetes** (Enterprise)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mobvibe-worker
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: worker
        image: mobvibe-worker:latest
        env:
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: supabase-creds
              key: url
```

### Process Management with PM2

**Alternative to Docker** (Bare metal/VM):

```bash
# Install PM2
npm install -g pm2

# Start worker
pm2 start dist/index.js --name mobvibe-worker

# Cluster mode (multiple instances)
pm2 start dist/index.js -i max --name mobvibe-worker

# Startup script (auto-restart on reboot)
pm2 startup
pm2 save

# Monitor
pm2 monit

# Logs
pm2 logs mobvibe-worker
```

### Scaling Considerations

**Horizontal Scaling**:
- Each worker claims jobs independently (no conflicts)
- `SELECT FOR UPDATE SKIP LOCKED` prevents collisions
- Add workers until database becomes bottleneck
- Target: 10-50 workers depending on job complexity

**Database Optimization**:
- Index on `(status, priority DESC, created_at ASC)` (already exists)
- Connection pooling with PgBouncer (high scale)
- Monitor table bloat, tune autovacuum

**Resource Requirements** (per worker):
- CPU: 0.5-1.0 cores
- Memory: 100-200MB
- Network: Minimal (database calls only)

### Security Best Practices

1. **Service Role Key**: Never expose in client code
2. **Environment Variables**: Use secrets management (Vault, AWS Secrets Manager)
3. **Network**: Restrict database access to worker IPs only
4. **Logging**: Sanitize sensitive data before logging
5. **Updates**: Regular dependency updates (`npm audit fix`)

## Testing

### Manual Testing

```bash
# 1. Start worker
npm run dev

# 2. Create test job (separate terminal)
curl -X POST http://localhost:54321/functions/v1/start-coding-session \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "uuid-here",
    "prompt": "Test job for worker"
  }'

# 3. Watch worker logs - should see:
# - "New job notification received"
# - "Processing job"
# - "Job completed"

# 4. Check database
supabase db query "SELECT * FROM coding_jobs ORDER BY created_at DESC LIMIT 5"

# 5. Test health check
curl http://localhost:8080/health

# 6. Test graceful shutdown
# Press Ctrl+C - should see clean shutdown logs
```

### Integration Tests

**Run tests** (requires Supabase running):
```bash
npm test -- tests/backend/worker-service.test.ts
```

**Test scenarios**:
- Worker processes jobs from queue
- Health check endpoint responds
- Graceful shutdown completes
- Logs are structured JSON

## API Reference

See [`backend/worker/src/`](../../backend/worker/src/) for implementation details.

### JobQueue Class

```typescript
const queue = new JobQueue()

// Claim next job
const job = await queue.claimNextJob()
// Returns: { job_id, session_id, prompt, priority } | null

// Complete job
await queue.completeJob(jobId)

// Fail job (with retry)
const willRetry = await queue.failJob(jobId, 'Error message')
// Returns: true if retrying, false if moved to DLQ

// Get stats
const stats = await queue.getQueueStats()
// Returns: { pending_count, processing_count, ... }

// Subscribe to new jobs
const unsubscribe = queue.subscribeToNewJobs((job) => {
  console.log('New job:', job.id)
})
// Call unsubscribe() to stop
```

## Next Steps

**Phase 15**: Sandbox Orchestration
- Fly.io sandbox management
- Sandbox lifecycle (create, execute, delete)
- File system operations

**Phase 16**: Claude Agent Integration
- Claude API calls
- Streaming responses
- Agent coordination

**Phase 17**: Event Streaming
- Stream events to session_events table
- Real-time updates to mobile app
- Progress tracking

**Phase 18**: Error Recovery
- Job timeout and reclaim logic
- Worker health monitoring
- Automatic failover

---

**Version**: 1.0.0 (Phase 14)
**Last Updated**: 2025-01-07
**Maintainer**: MobVibe Team
