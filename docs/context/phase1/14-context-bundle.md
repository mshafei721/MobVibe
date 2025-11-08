# Phase 14 Context Bundle: Worker Service Foundation

## Current State (Phase 13 Complete)

### Existing Implementation

**Worker Service Structure** (`backend/worker/`):
```
backend/worker/
├── src/
│   ├── index.ts              # Basic entry point with startup/shutdown
│   ├── JobProcessor.ts       # Job processing loop (basic)
│   ├── queue/
│   │   └── JobQueue.ts       # Queue interface (claim, complete, fail)
│   ├── monitoring/
│   │   └── QueueMonitor.ts   # Console stats printing
│   └── types/
│       └── index.ts          # TypeScript interfaces
├── package.json              # Basic dependencies
└── tsconfig.json             # TypeScript config
```

**Current Capabilities**:
- ✅ JobQueue class with Supabase service role
- ✅ JobProcessor with Realtime subscription + polling fallback
- ✅ QueueMonitor prints stats every 30s
- ✅ Basic graceful shutdown (SIGTERM/SIGINT)
- ✅ Simulated job processing (1s delay)
- ✅ Console.log based logging

**Dependencies**:
- @supabase/supabase-js: ^2.39.0
- TypeScript: ^5.3.3
- ts-node, nodemon (dev)

### Job Queue Integration (Phase 13)

**Database Functions**:
- `claim_next_job()`: Atomic claiming with FOR UPDATE SKIP LOCKED
- `complete_job(job_id)`: Mark job completed
- `fail_job(job_id, error_msg)`: Retry logic or DLQ
- `get_queue_stats()`: Queue metrics

**Job Lifecycle**:
1. pending → processing (claimed)
2. processing → completed (success)
3. processing → pending (retry if count < max)
4. processing → failed (DLQ if count >= max)

**Priority System**:
- Pro/Enterprise: priority 10
- Starter: priority 5
- Free: priority 0

**Realtime Notifications**:
- INSERT trigger on coding_jobs → Realtime channel
- Fallback polling every 10s

## Phase 14 Requirements

### Production-Ready Enhancements

1. **Structured Logging** (pino)
   - Replace console.log with pino logger
   - JSON output for production
   - Pretty printing for development
   - Log levels: trace, debug, info, warn, error, fatal
   - Correlation IDs for tracing

2. **Configuration Management**
   - Environment variable validation
   - Type-safe config object
   - Fail-fast on missing required vars
   - Defaults for optional vars

3. **Health Check Server**
   - HTTP server on port 8080
   - GET /health endpoint
   - Returns: status, uptime, timestamp
   - Docker HEALTHCHECK compatible

4. **Enhanced Graceful Shutdown**
   - Configurable timeout (30s default)
   - Wait for current job with timeout
   - Clean resource cleanup
   - Exit code 0 on success

5. **Docker Support**
   - Dockerfile with multi-stage build
   - node:20-alpine base image
   - Health check with wget
   - docker-compose.yml for local dev
   - Production-optimized (NODE_ENV, npm ci)

### File Structure After Phase 14

```
backend/worker/
├── src/
│   ├── index.ts                    # ⚡ Enhanced with health server
│   ├── JobProcessor.ts             # ⚡ Enhanced with pino logging
│   ├── HealthServer.ts             # 🆕 HTTP health check server
│   ├── config/
│   │   └── index.ts                # 🆕 Configuration with validation
│   ├── utils/
│   │   └── logger.ts               # 🆕 Pino logger setup
│   ├── queue/
│   │   └── JobQueue.ts             # ⚡ Enhanced with pino
│   ├── monitoring/
│   │   └── QueueMonitor.ts         # ⚡ Enhanced with pino
│   └── types/
│       └── index.ts                # ⚡ Add config types
├── Dockerfile                      # 🆕 Production container
├── docker-compose.yml              # 🆕 Local development
├── .env.example                    # 🆕 Environment template
├── .dockerignore                   # 🆕 Docker ignore
├── package.json                    # ⚡ Add pino, dotenv
└── tsconfig.json                   # (existing)
```

## Implementation Guidelines

### Logging Standards

**Log Structure**:
```typescript
// Before (Phase 13)
console.log('Job completed:', jobId)

// After (Phase 14)
logger.info({ jobId, sessionId, duration }, 'Job completed')
```

**Log Levels**:
- `fatal`: Unrecoverable errors (exit process)
- `error`: Errors that need attention
- `warn`: Warning conditions
- `info`: Informational messages (default)
- `debug`: Detailed debug info
- `trace`: Very detailed tracing

### Configuration Pattern

```typescript
// config/index.ts
export const config = {
  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  },
  worker: {
    pollIntervalMs: optional('POLL_INTERVAL_MS', 10000),
    maxConcurrentJobs: optional('MAX_CONCURRENT_JOBS', 1),
    shutdownTimeoutMs: optional('SHUTDOWN_TIMEOUT_MS', 30000),
  },
  health: {
    port: optional('HEALTH_CHECK_PORT', 8080),
  },
  logging: {
    level: optional('LOG_LEVEL', 'info'),
  },
  env: process.env.NODE_ENV || 'development',
}
```

### Health Check Pattern

```typescript
// HealthServer.ts
GET /health → {
  status: 'healthy',
  uptime: process.uptime(),
  timestamp: new Date().toISOString()
}
```

**Response Codes**:
- 200: Healthy (default)
- 503: Unhealthy (if needed in future phases)

### Graceful Shutdown Flow

```
1. Receive SIGTERM/SIGINT
2. Log shutdown signal
3. Stop polling timer
4. Stop accepting new jobs (isRunning = false)
5. Wait for current job (with timeout)
6. Close health server
7. Log shutdown complete
8. Exit(0)
```

**Timeout Handling**:
- If job doesn't finish in shutdownTimeoutMs, log warning
- Exit anyway (orchestrator will restart if needed)
- Job will be reclaimed by another worker (future enhancement)

### Docker Best Practices

**Dockerfile Structure**:
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider http://localhost:8080/health || exit 1
CMD ["node", "dist/index.js"]
```

**Optimizations**:
- Multi-stage build (smaller final image)
- npm ci (deterministic installs)
- Alpine base (100MB+ smaller)
- Health check with wget (included in Alpine)
- NODE_ENV=production (30% memory savings)

## Testing Strategy

### Unit Tests (Existing from Phase 13)
- tests/backend/job-queue.test.ts ✅

### Integration Tests (Phase 14)
- tests/backend/worker-service.test.ts 🆕
  - Worker starts and processes jobs
  - Health check responds correctly
  - Graceful shutdown completes
  - Logs are structured JSON

### Manual Testing
```bash
# 1. Start Supabase locally
supabase start

# 2. Run worker in dev mode
cd backend/worker
npm run dev

# 3. Check health
curl http://localhost:8080/health

# 4. Create test job (via Edge Function)
curl -X POST http://localhost:54321/functions/v1/start-coding-session \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"projectId": "uuid", "prompt": "Test job"}'

# 5. Watch logs (should see pino formatted output)

# 6. Test graceful shutdown (Ctrl+C)
# Should see: shutdown signal → stopping services → clean exit

# 7. Test Docker build
npm run docker:build

# 8. Test Docker run
npm run docker:run

# 9. Check health in Docker
curl http://localhost:8080/health
```

## Dependencies to Add

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",  // existing
    "pino": "^8.16.0",                   // 🆕 structured logging
    "pino-pretty": "^10.2.0",            // 🆕 pretty dev logs
    "dotenv": "^16.3.1"                  // 🆕 env loading
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"                      // 🆕 faster ts execution
  }
}
```

## Success Criteria (Phase 14)

- [ ] Structured logging with pino (JSON in production)
- [ ] Configuration with environment validation
- [ ] Health check endpoint responds with 200
- [ ] Graceful shutdown completes within timeout
- [ ] Docker image builds successfully
- [ ] Docker health check passes
- [ ] Integration tests pass
- [ ] Documentation complete (WORKER_SERVICE.md)

## Next Phase (Phase 15)

**Out of Scope for Phase 14**:
- E2B sandbox integration (Phase 15)
- Claude Agent API calls (Phase 16)
- Event streaming (Phase 17)
- Job timeout/reclaim logic (Phase 18)

**Phase 15 Will Add**:
- Fly.io sandbox management
- Sandbox lifecycle (create, delete)
- File system operations
- Terminal execution

## References

- Phase 13 Implementation: Job queue with Realtime
- Phase 14 Requirements: 14-worker-service.md
- Research: worker-patterns.md
- Job Queue Docs: JOB_QUEUE.md

---

**Context Bundle Created**: 2025-01-07
**Phase**: 14 - Worker Service Foundation
**Status**: Ready for Implementation
