# 14-worker-service.md
---
phase_id: 14
title: Worker Service Foundation
duration_estimate: "2 days"
incremental_value: Long-running Node.js service for job processing
owners: [Backend Engineer, DevOps]
dependencies: [13]
linked_phases_forward: [15]
docs_referenced: [Architecture, Implementation]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["Node.js worker service patterns", "Process management PM2", "Docker Node.js best practices"]
    outputs: ["/docs/research/phase1/14/worker-patterns.md"]
  - name: ContextCurator
    tool: context7
    scope: ["architecture.md worker service", "Phase 13 JobQueue"]
    outputs: ["/docs/context/phase1/14-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for building worker service with job processing loop"
    outputs: ["/docs/sequencing/phase1/14-worker-steps.md"]
acceptance_criteria:
  - Worker service starts and connects to job queue
  - Health check endpoint responds
  - Graceful shutdown handles in-progress jobs
  - Environment variables configured
  - Docker container builds and runs
  - Logs structured and searchable
  - Process monitoring with PM2 or Docker
---

## Objectives

1. **Create Worker Service** - Long-running Node.js process
2. **Job Processing Loop** - Continuously poll and process jobs
3. **Production Ready** - Logging, monitoring, graceful shutdown

## Scope

### In
- Node.js/TypeScript worker service
- Job processing loop integration
- Health check endpoint
- Structured logging
- Graceful shutdown
- Docker containerization
- Environment configuration

### Out
- Actual Claude Agent integration (Phase 16)
- Sandbox management (Phase 15)
- Complex orchestration (later)

## Tasks

- [ ] **Use context7** to compile worker context
- [ ] **Use websearch** for worker patterns
- [ ] **Use sequentialthinking** to plan implementation

- [ ] **Initialize Worker Project**:
  ```bash
  mkdir -p backend/worker
  cd backend/worker
  npm init -y
  npm install typescript @types/node tsx
  npm install @supabase/supabase-js
  npm install pino pino-pretty  # Structured logging
  npm install dotenv

  npx tsc --init
  ```

- [ ] **Configure TypeScript** (`tsconfig.json`):
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "commonjs",
      "lib": ["ES2022"],
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules"]
  }
  ```

- [ ] **Create Logger** (`src/utils/logger.ts`):
  ```typescript
  import pino from 'pino'

  export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  })
  ```

- [ ] **Create Configuration** (`src/config/index.ts`):
  ```typescript
  import dotenv from 'dotenv'
  dotenv.config()

  export const config = {
    supabase: {
      url: process.env.SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    worker: {
      pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '10000'),
      maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '1'),
      shutdownTimeoutMs: parseInt(process.env.SHUTDOWN_TIMEOUT_MS || '30000'),
    },
    env: process.env.NODE_ENV || 'development',
  }

  // Validate required env vars
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  required.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  })
  ```

- [ ] **Create Job Processor** (`src/JobProcessor.ts`):
  ```typescript
  import { JobQueue } from './queue/JobQueue'
  import { logger } from './utils/logger'
  import { config } from './config'

  export class JobProcessor {
    private queue: JobQueue
    private isRunning = false
    private isProcessing = false
    private pollTimer?: NodeJS.Timeout
    private shutdownPromise?: Promise<void>

    constructor() {
      this.queue = new JobQueue()
    }

    async start() {
      if (this.isRunning) {
        logger.warn('Job processor already running')
        return
      }

      this.isRunning = true
      logger.info('Job processor starting...')

      // Subscribe to new jobs (Realtime)
      this.queue.subscribeToNewJobs((job) => {
        logger.info({ jobId: job.id }, 'New job notification received')
        this.processNextJob()
      })

      // Start polling loop
      this.startPolling()

      logger.info('Job processor started')
    }

    private startPolling() {
      this.pollTimer = setInterval(() => {
        if (!this.isProcessing && this.isRunning) {
          this.processNextJob()
        }
      }, config.worker.pollIntervalMs)

      // Initial poll
      this.processNextJob()
    }

    private async processNextJob() {
      if (this.isProcessing || !this.isRunning) return

      this.isProcessing = true

      try {
        const job = await this.queue.claimNextJob()

        if (!job) {
          this.isProcessing = false
          return
        }

        logger.info({ jobId: job.job_id, sessionId: job.session_id }, 'Processing job')

        // TODO: Actual processing in Phase 16-17
        // For now, simulate work
        await this.simulateWork(job)

        await this.queue.completeJob(job.job_id)
        logger.info({ jobId: job.job_id }, 'Job completed')

      } catch (error) {
        logger.error({ error }, 'Job processing error')
      } finally {
        this.isProcessing = false

        // Check for next job
        if (this.isRunning) {
          setTimeout(() => this.processNextJob(), 100)
        }
      }
    }

    private async simulateWork(job: any) {
      // Placeholder for Phase 16-17
      await new Promise(resolve => setTimeout(resolve, 2000))
      logger.debug({ jobId: job.job_id, prompt: job.prompt }, 'Simulated work')
    }

    async shutdown() {
      logger.info('Shutting down job processor...')
      this.isRunning = false

      // Stop polling
      if (this.pollTimer) {
        clearInterval(this.pollTimer)
      }

      // Wait for current job to finish (with timeout)
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

      logger.info('Job processor shut down')
    }
  }
  ```

- [ ] **Create Health Check Server** (`src/HealthServer.ts`):
  ```typescript
  import http from 'http'
  import { logger } from './utils/logger'

  export class HealthServer {
    private server?: http.Server
    private port = parseInt(process.env.HEALTH_CHECK_PORT || '8080')

    start() {
      this.server = http.createServer((req, res) => {
        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
          }))
        } else {
          res.writeHead(404)
          res.end()
        }
      })

      this.server.listen(this.port, () => {
        logger.info({ port: this.port }, 'Health check server started')
      })
    }

    stop() {
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

- [ ] **Create Main Entry Point** (`src/index.ts`):
  ```typescript
  import { JobProcessor } from './JobProcessor'
  import { HealthServer } from './HealthServer'
  import { logger } from './utils/logger'
  import { config } from './config'

  async function main() {
    logger.info({ env: config.env }, 'Worker service starting')

    const processor = new JobProcessor()
    const healthServer = new HealthServer()

    // Start services
    await processor.start()
    healthServer.start()

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal')

      await processor.shutdown()
      await healthServer.stop()

      logger.info('Worker service stopped')
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

- [ ] **Create Dockerfile**:
  ```dockerfile
  # backend/worker/Dockerfile
  FROM node:20-alpine

  WORKDIR /app

  # Copy package files
  COPY package*.json ./
  RUN npm ci --only=production

  # Copy source
  COPY . .

  # Build TypeScript
  RUN npm run build

  # Health check
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

  # Run
  CMD ["node", "dist/index.js"]
  ```

- [ ] **Create docker-compose.yml** (for local dev):
  ```yaml
  # backend/worker/docker-compose.yml
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
      ports:
        - "8080:8080"
      restart: unless-stopped
  ```

- [ ] **Add Scripts to package.json**:
  ```json
  {
    "scripts": {
      "dev": "tsx watch src/index.ts",
      "build": "tsc",
      "start": "node dist/index.js",
      "docker:build": "docker build -t mobvibe-worker .",
      "docker:run": "docker-compose up"
    }
  }
  ```

- [ ] **Create .env.example**:
  ```bash
  # backend/worker/.env.example
  NODE_ENV=development
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

  # Worker configuration
  POLL_INTERVAL_MS=10000
  MAX_CONCURRENT_JOBS=1
  SHUTDOWN_TIMEOUT_MS=30000
  HEALTH_CHECK_PORT=8080

  # Logging
  LOG_LEVEL=info
  ```

- [ ] **Test Worker Locally**:
  ```bash
  # Setup environment
  cp .env.example .env
  # Edit .env with real Supabase credentials

  # Run in dev mode
  npm run dev

  # Test health check
  curl http://localhost:8080/health

  # Create test job via Edge Function
  curl -X POST http://localhost:54321/functions/v1/start-coding-session \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"projectId": "uuid", "prompt": "Test"}'

  # Watch logs - should process job
  ```

- [ ] **Test Docker Build**:
  ```bash
  # Build image
  npm run docker:build

  # Run container
  npm run docker:run

  # Check health
  curl http://localhost:8080/health

  # View logs
  docker-compose logs -f worker
  ```

- [ ] **Create Integration Tests**:
  ```typescript
  // tests/backend/worker-service.test.ts
  describe('Worker Service', () => {
    it('processes jobs from queue', async () => {
      // Create job
      const { data: job } = await supabase
        .from('coding_jobs')
        .insert({ session_id: sessionId, prompt: 'Test job' })
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
      // Start worker
      const worker = spawn('node', ['dist/index.js'])

      // Wait for startup
      await sleep(2000)

      // Send SIGTERM
      worker.kill('SIGTERM')

      // Wait for shutdown
      await new Promise(resolve => worker.on('exit', resolve))

      // Verify clean exit
      expect(worker.exitCode).toBe(0)
    })
  })
  ```

- [ ] **Document Worker Service**:
  - Create: `docs/backend/WORKER_SERVICE.md`
  - Include: Architecture diagram
  - Include: Environment variables
  - Include: Deployment guide
  - Include: Monitoring and troubleshooting

- [ ] **Update links-map**

## Artifacts & Paths

**Worker Service:**
- `backend/worker/src/index.ts`
- `backend/worker/src/JobProcessor.ts`
- `backend/worker/src/HealthServer.ts`
- `backend/worker/src/config/index.ts`
- `backend/worker/src/utils/logger.ts`
- `backend/worker/Dockerfile`
- `backend/worker/docker-compose.yml`

**Tests:**
- `tests/backend/worker-service.test.ts`

**Docs:**
- `docs/backend/WORKER_SERVICE.md` ⭐

## Testing

### Phase-Only Tests
- Worker starts and polls queue
- Health check responds
- Graceful shutdown works
- Docker container runs
- Logs are structured

### Cross-Phase Compatibility
- Phase 15 will add sandbox management
- Phase 16-17 will add actual job processing

### Test Commands
```bash
# Local dev
npm run dev

# Docker
npm run docker:build
npm run docker:run

# Integration tests
npm test -- tests/backend/worker-service.test.ts
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| Worker crashes and jobs lost | High | Implement job heartbeat, reclaim stale jobs |
| Memory leaks from long running process | Medium | Monitor memory, restart periodically |
| No visibility into worker health | High | Implement comprehensive logging and health checks |
| Deployment complexity | Medium | Use Docker, document deployment steps |

## References

- [Architecture](./../../../../.docs/architecture.md) - Worker service architecture
- [Phase 13](./13-job-queue.md) - Job queue integration

## Handover

**Next Phase:** [15-sandbox-orchestration.md](./15-sandbox-orchestration.md) - Add Fly.io sandbox management

**Required Inputs Provided to Phase 15:**
- Worker service running and processing jobs
- Job processing loop framework ready

---

**Status:** Ready after Phase 13
**Estimated Time:** 2 days
**Blocking Issues:** Requires Phase 13 job queue
