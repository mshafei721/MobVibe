# Phase 14 Sequential Implementation Plan

## Overview

Transform the basic worker service from Phase 13 into a production-ready service with structured logging, health checks, configuration management, and Docker support.

**Total Estimated Time**: 12 hours (2 days with buffer)

## Step-by-Step Implementation

### Step 1: Install Dependencies (30 min)

**Goal**: Add pino, dotenv, and development tools

**Actions**:
```bash
cd backend/worker

# Add production dependencies
npm install pino@^8.16.0 pino-pretty@^10.2.0 dotenv@^16.3.1

# Add development dependencies
npm install --save-dev tsx@^4.7.0

# Update package.json scripts
```

**Verification**:
- `npm ls` shows all dependencies installed
- No peer dependency warnings

**Risks**: Dependency conflicts
**Mitigation**: Use exact versions tested in research

---

### Step 2: Create Logger Utility (30 min)

**Goal**: Set up pino structured logging

**Files**:
- `src/utils/logger.ts` (new)

**Implementation**:
```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'production'
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
})
```

**Verification**:
- Can import logger in other files
- Logs output in pretty format in dev
- Logs output as JSON when NODE_ENV=production

**Risks**: Transport configuration errors
**Mitigation**: Test both dev and production modes

---

### Step 3: Create Configuration Module (45 min)

**Goal**: Type-safe configuration with validation

**Files**:
- `src/config/index.ts` (new)
- `src/types/index.ts` (update)

**Implementation**:
```typescript
import dotenv from 'dotenv'
dotenv.config()

interface Config {
  supabase: {
    url: string
    serviceRoleKey: string
  }
  worker: {
    pollIntervalMs: number
    maxConcurrentJobs: number
    shutdownTimeoutMs: number
  }
  health: {
    port: number
  }
  logging: {
    level: string
  }
  env: string
}

function required(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function optional<T>(key: string, defaultValue: T): T {
  const value = process.env[key]
  if (!value) return defaultValue

  if (typeof defaultValue === 'number') {
    return parseInt(value) as T
  }
  return value as T
}

export const config: Config = {
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

**Verification**:
- Config loads without errors
- Missing SUPABASE_URL throws error
- Default values work correctly
- Type checking works

**Risks**: Type coercion errors, env var parsing
**Mitigation**: Add validation tests

---

### Step 4: Create Health Check Server (1 hour)

**Goal**: HTTP server for Docker health checks

**Files**:
- `src/HealthServer.ts` (new)

**Implementation**:
```typescript
import http from 'http'
import { logger } from './utils/logger'
import { config } from './config'

export class HealthServer {
  private server?: http.Server
  private port = config.health.port

  start(): void {
    this.server = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        }))
        logger.trace('Health check requested')
      } else {
        res.writeHead(404)
        res.end()
      }
    })

    this.server.listen(this.port, () => {
      logger.info({ port: this.port }, 'Health check server started')
    })
  }

  stop(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('Health check server stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}
```

**Verification**:
- Server starts on configured port
- GET /health returns 200 with JSON
- Other paths return 404
- Server stops cleanly

**Risks**: Port already in use
**Mitigation**: Make port configurable, error handling

---

### Step 5: Update JobQueue with Logging (45 min)

**Goal**: Replace console.log with pino logger

**Files**:
- `src/queue/JobQueue.ts` (update)

**Changes**:
```typescript
import { logger } from '../utils/logger'
import { config } from '../config'

// Replace all console.log/error with logger calls
logger.info('JobQueue initialized with service role')
logger.error({ error }, 'Error claiming job')
logger.debug({ jobId, sessionId }, 'Job claimed successfully')
```

**Verification**:
- No more console.log calls
- Logs include context (jobId, sessionId, etc.)
- Log levels appropriate (info, error, debug)

**Risks**: Missing context in logs
**Mitigation**: Review each log statement

---

### Step 6: Update JobProcessor with Logging (1 hour)

**Goal**: Replace console.log, add config usage

**Files**:
- `src/JobProcessor.ts` (update)

**Changes**:
```typescript
import { logger } from './utils/logger'
import { config } from './config'

// Use config.worker.pollIntervalMs
// Replace all console.log with logger
// Add job duration tracking
const startTime = Date.now()
const duration = Date.now() - startTime
logger.info({ jobId, duration }, 'Job completed')
```

**Verification**:
- Uses config instead of hardcoded values
- Structured logging throughout
- Job duration tracked

**Risks**: Breaking existing flow
**Mitigation**: Test job processing still works

---

### Step 7: Update QueueMonitor with Logging (30 min)

**Goal**: Structured stats output

**Files**:
- `src/monitoring/QueueMonitor.ts` (update)

**Changes**:
```typescript
import { logger } from '../utils/logger'

// Replace console.log with logger.info
logger.info({
  pending: stats.pending_count,
  processing: stats.processing_count,
  completed: stats.completed_count,
  failed: stats.failed_count,
  oldestPending: stats.oldest_pending_age,
  successRate: successRate,
}, 'Queue statistics')
```

**Verification**:
- Stats logged as structured JSON
- Readable in development (pino-pretty)

**Risks**: Stats format change
**Mitigation**: Keep human-readable in dev mode

---

### Step 8: Update Main Entry Point (1 hour)

**Goal**: Integrate health server and enhanced shutdown

**Files**:
- `src/index.ts` (update)

**Changes**:
```typescript
import { JobProcessor } from './JobProcessor'
import { QueueMonitor } from './monitoring/QueueMonitor'
import { HealthServer } from './HealthServer'
import { logger } from './utils/logger'
import { config } from './config'

async function main() {
  logger.info({ env: config.env }, 'Worker service starting')

  const processor = new JobProcessor()
  const monitor = new QueueMonitor()
  const healthServer = new HealthServer()

  // Start all services
  await processor.start()
  monitor.startMonitoring(30000)
  healthServer.start()

  // Enhanced graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal')

    // Stop all services in order
    monitor.stopMonitoring()
    await processor.stop()
    await healthServer.stop()

    logger.info('Worker service stopped cleanly')
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  logger.info('Worker service ready')
}

main().catch((error) => {
  logger.fatal({ error }, 'Fatal error starting worker service')
  process.exit(1)
})
```

**Verification**:
- All services start correctly
- Shutdown signal triggers clean stop
- Exit code 0 on success, 1 on error

**Risks**: Service start order matters
**Mitigation**: Test startup sequence

---

### Step 9: Enhanced JobProcessor Shutdown (1 hour)

**Goal**: Timeout-based graceful shutdown

**Files**:
- `src/JobProcessor.ts` (update)

**Changes**:
```typescript
async stop(): Promise<void> {
  logger.info('Stopping job processor...')
  this.isRunning = false

  // Stop polling
  if (this.pollInterval) {
    clearInterval(this.pollInterval)
  }

  // Unsubscribe from Realtime
  if (this.unsubscribe) {
    this.unsubscribe()
    this.unsubscribe = null
  }

  // Wait for current job with timeout
  const timeout = new Promise(resolve =>
    setTimeout(resolve, config.worker.shutdownTimeoutMs)
  )

  const waitForJob = new Promise<void>(resolve => {
    const check = setInterval(() => {
      if (!this.isProcessing) {
        clearInterval(check)
        resolve()
      }
    }, 100)
  })

  await Promise.race([waitForJob, timeout])

  if (this.isProcessing) {
    logger.warn('Shutdown timeout - job may be incomplete')
  }

  await this.queue.cleanup()
  logger.info('Job processor stopped')
}
```

**Verification**:
- Waits for job completion
- Times out after configured duration
- Logs warning if timeout exceeded

**Risks**: Stuck job blocks shutdown
**Mitigation**: Configurable timeout

---

### Step 10: Create .env.example (15 min)

**Goal**: Document environment variables

**Files**:
- `backend/worker/.env.example` (new)

**Content**:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Worker Configuration
POLL_INTERVAL_MS=10000
MAX_CONCURRENT_JOBS=1
SHUTDOWN_TIMEOUT_MS=30000

# Health Check
HEALTH_CHECK_PORT=8080

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

**Verification**:
- All config keys documented
- Example values provided
- Comments explain purpose

---

### Step 11: Create Dockerfile (1 hour)

**Goal**: Multi-stage production container

**Files**:
- `backend/worker/Dockerfile` (new)

**Content**:
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Environment
ENV NODE_ENV=production

# Health check using wget (included in Alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider http://localhost:8080/health || exit 1

# Run
CMD ["node", "dist/index.js"]
```

**Verification**:
- Build completes without errors
- Final image < 150MB
- Health check works

**Risks**: Missing dependencies, build failures
**Mitigation**: Test build locally first

---

### Step 12: Create .dockerignore (15 min)

**Goal**: Exclude unnecessary files from Docker context

**Files**:
- `backend/worker/.dockerignore` (new)

**Content**:
```
node_modules
dist
npm-debug.log
.env
.env.*
!.env.example
*.test.ts
coverage
.git
.gitignore
README.md
```

**Verification**:
- Build context smaller
- No sensitive files copied

---

### Step 13: Create docker-compose.yml (30 min)

**Goal**: Local development with Docker

**Files**:
- `backend/worker/docker-compose.yml` (new)

**Content**:
```yaml
version: '3.8'

services:
  worker:
    build: .
    environment:
      - NODE_ENV=development
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - POLL_INTERVAL_MS=5000
      - LOG_LEVEL=debug
      - HEALTH_CHECK_PORT=8080
    ports:
      - "8080:8080"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

**Verification**:
- `docker-compose up` starts worker
- Health check passes
- Logs visible in console

**Risks**: Missing env vars
**Mitigation**: Use .env file

---

### Step 14: Update package.json Scripts (15 min)

**Goal**: Add Docker and enhanced dev scripts

**Files**:
- `backend/worker/package.json` (update)

**Changes**:
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "docker:build": "docker build -t mobvibe-worker .",
    "docker:run": "docker-compose up",
    "docker:stop": "docker-compose down"
  }
}
```

**Verification**:
- All scripts work
- `npm run dev` uses tsx
- Docker scripts functional

---

### Step 15: Create Integration Tests (2 hours)

**Goal**: Test worker service functionality

**Files**:
- `tests/backend/worker-service.test.ts` (new)

**Test Cases**:
1. Worker starts and connects to queue
2. Health check endpoint responds
3. Worker processes jobs from queue
4. Graceful shutdown completes
5. Logs are structured JSON (in production mode)

**Implementation**:
```typescript
import { spawn } from 'child_process'
import { createClient } from '@supabase/supabase-js'

describe('Worker Service', () => {
  it('health check responds', async () => {
    const response = await fetch('http://localhost:8080/health')
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.status).toBe('healthy')
    expect(data.uptime).toBeGreaterThan(0)
  })

  it('processes jobs from queue', async () => {
    // Create test job
    const { data: job } = await supabase
      .from('coding_jobs')
      .insert({
        session_id: testSessionId,
        prompt: 'Test job',
        status: 'pending'
      })
      .select()
      .single()

    // Wait for processing
    await waitFor(async () => {
      const { data: processedJob } = await supabase
        .from('coding_jobs')
        .select('status')
        .eq('id', job.id)
        .single()

      return processedJob.status === 'completed'
    }, 10000)
  })

  it('handles graceful shutdown', async () => {
    const worker = spawn('node', ['dist/index.js'], {
      env: { ...process.env }
    })

    // Wait for startup
    await sleep(2000)

    // Send SIGTERM
    worker.kill('SIGTERM')

    // Wait for shutdown
    const exitCode = await new Promise<number | null>(resolve => {
      worker.on('exit', (code) => resolve(code))
    })

    expect(exitCode).toBe(0)
  })
})
```

**Verification**:
- Tests pass locally
- Tests pass in CI

**Risks**: Flaky tests, timing issues
**Mitigation**: Use waitFor helpers, proper timeouts

---

### Step 16: Test Manually (1 hour)

**Goal**: Verify all components work together

**Test Script**:
```bash
# 1. Start Supabase
supabase start

# 2. Setup environment
cd backend/worker
cp .env.example .env
# Edit .env with real credentials

# 3. Install dependencies
npm install

# 4. Run in dev mode
npm run dev

# Verify:
# - Logs are pretty printed
# - "Worker service ready" message
# - "Health check server started" message

# 5. Test health check (in another terminal)
curl http://localhost:8080/health
# Should return: {"status":"healthy","uptime":X,"timestamp":"..."}

# 6. Create test job
curl -X POST http://localhost:54321/functions/v1/start-coding-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "uuid-here", "prompt": "Test job processing"}'

# Verify in logs:
# - "New job notification" message
# - "Processing job" with job details
# - "Job completed" message

# 7. Test graceful shutdown
# Press Ctrl+C

# Verify:
# - "Received shutdown signal" message
# - "Queue monitoring stopped"
# - "Job processor stopped"
# - "Health check server stopped"
# - "Worker service stopped cleanly"
# - Process exits with code 0

# 8. Test Docker build
npm run docker:build

# Verify:
# - Build completes successfully
# - Image size reasonable (<150MB)

# 9. Test Docker run
npm run docker:run

# Verify:
# - Container starts
# - Logs visible
# - Health check passes (docker-compose ps shows "healthy")

# 10. Test Docker health
curl http://localhost:8080/health

# 11. Stop Docker
npm run docker:stop
```

**Verification Checklist**:
- [ ] Dev mode starts successfully
- [ ] Logs are pretty formatted
- [ ] Health check responds
- [ ] Jobs are processed
- [ ] Graceful shutdown works
- [ ] Docker builds successfully
- [ ] Docker container runs
- [ ] Docker health check passes

---

### Step 17: Create Documentation (2 hours)

**Goal**: Comprehensive worker service guide

**Files**:
- `docs/backend/WORKER_SERVICE.md` (new)

**Content Sections**:
1. **Overview**: Architecture, components
2. **Configuration**: Environment variables
3. **Development**: Local setup, running
4. **Docker**: Building, running, deployment
5. **Monitoring**: Logs, health checks, metrics
6. **Troubleshooting**: Common issues, solutions
7. **Production**: Deployment strategies, scaling
8. **Testing**: Running tests, manual testing

**Verification**:
- All commands are accurate
- Examples work
- Clear and comprehensive

---

### Step 18: Update links-map (15 min)

**Goal**: Add Phase 14 documentation links

**Files**:
- `docs/phases/phase1/links-map.md` (update)

**Additions**:
```markdown
## Phase 14: Worker Service Foundation

**Research**:
- [Worker Patterns](./../../research/phase1/14/worker-patterns.md)

**Context**:
- [Phase 14 Context Bundle](./../../context/phase1/14-context-bundle.md)

**Sequencing**:
- [Phase 14 Steps](./../../sequencing/phase1/14-worker-steps.md)

**Backend Documentation**:
- [Worker Service Guide](./../../backend/WORKER_SERVICE.md) ⭐
- [Job Queue System](./../../backend/JOB_QUEUE.md)

**Implementation**:
- Worker Service: `backend/worker/src/`
- Docker: `backend/worker/Dockerfile`, `docker-compose.yml`
- Tests: `tests/backend/worker-service.test.ts`
```

**Verification**:
- All links valid
- Documentation accessible

---

### Step 19: Verification Testing (1 hour)

**Goal**: Ensure all acceptance criteria met

**Acceptance Criteria Checklist**:
- [ ] Worker service starts and connects to job queue
- [ ] Health check endpoint responds with 200
- [ ] Graceful shutdown handles in-progress jobs
- [ ] Environment variables configured and validated
- [ ] Docker container builds and runs
- [ ] Logs structured and searchable (JSON in production)
- [ ] Process monitoring ready (health checks)
- [ ] Integration tests pass
- [ ] Documentation complete

**Test Commands**:
```bash
# Run all tests
npm test

# Run integration tests
npm test -- tests/backend/worker-service.test.ts

# Test dev mode
npm run dev

# Test production build
npm run build && npm start

# Test Docker
npm run docker:build && npm run docker:run
```

**Verification**:
- All acceptance criteria checked
- All tests passing
- Documentation complete

---

### Step 20: Final Review and Commit (30 min)

**Goal**: Clean commit of Phase 14

**Actions**:
1. Review all changes with git diff
2. Ensure no debug code left
3. Verify .env not committed (only .env.example)
4. Run final test suite
5. Create commit

**Commit Message**:
```
feat: Complete Phase 14 Worker Service Foundation

Production-ready worker service enhancements:
- Structured logging with pino (JSON in production, pretty in dev)
- Configuration management with validation
- Health check HTTP server on port 8080
- Enhanced graceful shutdown with timeout
- Docker support with multi-stage build and health checks
- Integration tests for worker service
- Comprehensive documentation

Modifications:
- backend/worker/src/index.ts - Integrated health server
- backend/worker/src/JobProcessor.ts - Pino logging, config usage
- backend/worker/src/queue/JobQueue.ts - Structured logging
- backend/worker/src/monitoring/QueueMonitor.ts - JSON stats output
- backend/worker/package.json - Added pino, dotenv, tsx

New files:
- backend/worker/src/config/index.ts - Configuration with validation
- backend/worker/src/utils/logger.ts - Pino logger setup
- backend/worker/src/HealthServer.ts - HTTP health check server
- backend/worker/Dockerfile - Multi-stage production build
- backend/worker/docker-compose.yml - Local dev orchestration
- backend/worker/.env.example - Environment template
- backend/worker/.dockerignore - Build context optimization
- tests/backend/worker-service.test.ts - Integration tests
- docs/backend/WORKER_SERVICE.md - Comprehensive guide

Phase 14 complete. Ready for Phase 15 (Sandbox Orchestration).

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Verification**:
- Git status clean except new files
- All tests passing
- Documentation links work
- Ready for Phase 15

---

## Risk Management

### Critical Risks

| Risk | Impact | Mitigation | Step |
|------|--------|------------|------|
| Missing dependencies break build | High | Test after each install, version pins | 1 |
| Config validation errors | High | Unit tests for config module | 3 |
| Port conflicts (8080) | Medium | Configurable port, error handling | 4 |
| Docker build failures | High | Test locally before CI | 11 |
| Integration tests flaky | Medium | Use waitFor helpers, timeouts | 15 |

### Mitigation Strategies

1. **Dependency Issues**: Pin exact versions, test install
2. **Breaking Changes**: Keep existing Phase 13 functionality intact
3. **Docker Problems**: Test build and run locally first
4. **Test Failures**: Use proper async handling, timeouts
5. **Configuration Errors**: Validate early, fail fast

## Success Metrics

- **Code Quality**: TypeScript strict mode, no console.log
- **Test Coverage**: Integration tests cover main flows
- **Documentation**: Complete guide with examples
- **Performance**: No degradation from Phase 13
- **Docker**: Image size < 150MB, health check works

## Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Dependencies & Logging | 2.5 hours | 2.5h |
| Configuration & Health Check | 2.75 hours | 5.25h |
| Worker Updates | 3.75 hours | 9h |
| Docker Setup | 2 hours | 11h |
| Testing & Documentation | 4 hours | 15h |
| Review & Verification | 1.5 hours | 16.5h |

**Buffer**: 3.5 hours for unexpected issues
**Total with Buffer**: ~20 hours (2.5 days)

---

**Plan Created**: 2025-01-07
**Phase**: 14 - Worker Service Foundation
**Status**: Ready for Execution
