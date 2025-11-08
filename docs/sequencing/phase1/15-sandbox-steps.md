# Phase 15 Sequential Implementation Plan

## Overview

Implement Fly.io sandbox orchestration for isolated code execution environments. This phase builds on Phase 14's worker service to add ephemeral containers managed via Fly.io Machines API.

**Total Estimated Time**: 16 hours (2 days with buffer)

## Prerequisites

**Required**:
- Fly.io account created
- Fly.io CLI installed (`flyctl`)
- API token obtained
- Phase 14 worker service running

**Verification**:
```bash
flyctl version  # Should show version
flyctl auth whoami  # Should show your email
flyctl auth token  # Should show token
```

## Step-by-Step Implementation

### Step 1: Setup Fly.io Infrastructure (1 hour)

**Goal**: Create Fly.io app and obtain credentials

**Actions**:
```bash
# 1. Login to Fly.io
flyctl auth login

# 2. Create organization (if needed)
flyctl orgs create mobvibe

# 3. Create app for sandboxes
flyctl apps create mobvibe-sandboxes --org mobvibe

# 4. Get API token
flyctl auth token > fly-token.txt

# 5. Verify app created
flyctl apps list | grep mobvibe-sandboxes
```

**Store token**:
- Add `FLY_API_TOKEN` to `.env` file
- Never commit token to repository
- Consider using secret management for production

**Verification**:
- App appears in `flyctl apps list`
- Token works: `curl -H "Authorization: Bearer $FLY_API_TOKEN" https://api.machines.dev/v1/apps/mobvibe-sandboxes`

**Risks**: Account creation issues, billing setup
**Mitigation**: Follow Fly.io documentation, verify credit card added

---

### Step 2: Create Sandbox Docker Image (1.5 hours)

**Goal**: Build minimal Docker image with Node + Expo CLI

**Files**:
- `backend/worker/sandbox/Dockerfile` (new)

**Implementation**:
```dockerfile
# backend/worker/sandbox/Dockerfile
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    bash \
    curl \
    ca-certificates

# Install Expo CLI and EAS CLI globally
RUN npm install -g expo-cli@latest eas-cli@latest

# Create workspace directory
WORKDIR /workspace

# Create non-root user for security
RUN addgroup -S appuser && adduser -S -G appuser appuser

# Set ownership
RUN chown -R appuser:appuser /workspace

# Switch to non-root user
USER appuser

# Keep container running (will be managed by Fly.io)
CMD ["tail", "-f", "/dev/null"]
```

**Verification**:
- Build locally: `docker build -t mobvibe-sandbox:latest backend/worker/sandbox/`
- Test run: `docker run --rm -it mobvibe-sandbox:latest node --version`
- Check image size: Should be ~150-200MB

**Risks**: Large image size, slow builds
**Mitigation**: Use Alpine base, minimize layers, cache dependencies

---

### Step 3: Push Image to Fly.io Registry (30 min)

**Goal**: Make image available to Fly.io Machines

**Actions**:
```bash
# 1. Navigate to sandbox directory
cd backend/worker/sandbox

# 2. Build image
docker build -t mobvibe-sandbox:latest .

# 3. Tag for Fly.io registry
docker tag mobvibe-sandbox:latest registry.fly.io/mobvibe-sandbox:latest

# 4. Authenticate with Fly.io registry
flyctl auth docker

# 5. Push image
docker push registry.fly.io/mobvibe-sandbox:latest

# 6. Verify push
flyctl image show --app mobvibe-sandboxes
```

**Verification**:
- Image appears in Fly.io registry
- Can pull image: `docker pull registry.fly.io/mobvibe-sandbox:latest`

**Risks**: Push failures, authentication issues
**Mitigation**: Retry with `flyctl auth docker`, check network

---

### Step 4: Add Dependencies (15 min)

**Goal**: Install axios for HTTP client

**Actions**:
```bash
cd backend/worker
npm install axios@^1.6.0
```

**Update package.json** scripts if needed:
```json
{
  "scripts": {
    "docker:push-sandbox": "cd sandbox && docker build -t mobvibe-sandbox . && docker tag mobvibe-sandbox registry.fly.io/mobvibe-sandbox:latest && docker push registry.fly.io/mobvibe-sandbox:latest"
  }
}
```

**Verification**:
- `npm ls axios` shows version
- No peer dependency warnings

**Risks**: Dependency conflicts
**Mitigation**: Use exact version tested in research

---

### Step 5: Update Configuration (30 min)

**Goal**: Add Fly.io configuration

**Files**:
- `backend/worker/src/config/index.ts` (update)
- `backend/worker/.env.example` (update)

**Configuration Changes**:
```typescript
// src/config/index.ts
export const config: Config = {
  // ... existing config ...
  flyio: {
    apiToken: required('FLY_API_TOKEN'),
    appName: optional('FLY_APP_NAME', 'mobvibe-sandboxes'),
    region: optional('FLY_REGION', 'sjc'),
  },
  sandbox: {
    timeoutMs: optional('SANDBOX_TIMEOUT_MS', 1800000), // 30 minutes
    memoryMb: optional('SANDBOX_MEMORY_MB', 512),
    cpus: optional('SANDBOX_CPUS', 1),
    image: optional('SANDBOX_IMAGE', 'registry.fly.io/mobvibe-sandbox:latest'),
  },
}
```

**.env.example update**:
```bash
# Fly.io Configuration
FLY_API_TOKEN=your-fly-api-token-here
FLY_APP_NAME=mobvibe-sandboxes
FLY_REGION=sjc

# Sandbox Configuration
SANDBOX_TIMEOUT_MS=1800000
SANDBOX_MEMORY_MB=512
SANDBOX_CPUS=1
SANDBOX_IMAGE=registry.fly.io/mobvibe-sandbox:latest
```

**Verification**:
- Config loads without errors
- Missing FLY_API_TOKEN throws error
- Default values work

**Risks**: Type errors, environment parsing
**Mitigation**: Add TypeScript types, validate at startup

---

### Step 6: Create Sandbox Types (15 min)

**Goal**: Add TypeScript interfaces

**Files**:
- `backend/worker/src/types/index.ts` (update)

**Types to Add**:
```typescript
export interface SandboxConfig {
  sessionId: string
  region?: string
  cpuKind?: string
  memory?: number
}

export interface Sandbox {
  id: string
  name: string
  ip: string
  region: string
}

export interface ExecResult {
  stdout: string
  stderr: string
  exit_code: number
}
```

**Verification**:
- Types compile without errors
- Can import in other files

---

### Step 7: Implement SandboxManager (2 hours)

**Goal**: Fly.io API client for CRUD operations

**Files**:
- `backend/worker/src/sandbox/SandboxManager.ts` (new)

**Implementation**:
```typescript
import axios, { AxiosError } from 'axios'
import { logger } from '../utils/logger'
import { config } from '../config'
import { SandboxConfig, Sandbox, ExecResult } from '../types'

export class SandboxManager {
  private baseURL = 'https://api.machines.dev/v1'
  private appName = config.flyio.appName

  private get headers() {
    return {
      'Authorization': `Bearer ${config.flyio.apiToken}`,
      'Content-Type': 'application/json',
    }
  }

  async createSandbox(sandboxConfig: SandboxConfig): Promise<Sandbox> {
    const machineId = `session-${sandboxConfig.sessionId}`

    logger.info({ sessionId: sandboxConfig.sessionId, machineId }, 'Creating sandbox')

    try {
      const response = await axios.post(
        `${this.baseURL}/apps/${this.appName}/machines`,
        {
          name: machineId,
          region: sandboxConfig.region || config.flyio.region,
          config: {
            image: config.sandbox.image,
            guest: {
              cpu_kind: sandboxConfig.cpuKind || 'shared',
              cpus: config.sandbox.cpus,
              memory_mb: config.sandbox.memoryMb,
            },
            env: {
              SESSION_ID: sandboxConfig.sessionId,
            },
            auto_destroy: true,
          },
        },
        { headers: this.headers }
      )

      const machine = response.data

      logger.info({
        sessionId: sandboxConfig.sessionId,
        machineId: machine.id,
        ip: machine.private_ip,
      }, 'Sandbox created')

      return {
        id: machine.id,
        name: machine.name,
        ip: machine.private_ip,
        region: machine.region,
      }
    } catch (error) {
      logger.error({
        error: this.formatError(error),
        sessionId: sandboxConfig.sessionId,
      }, 'Failed to create sandbox')
      throw error
    }
  }

  async destroySandbox(sandboxId: string): Promise<void> {
    logger.info({ sandboxId }, 'Destroying sandbox')

    try {
      await axios.delete(
        `${this.baseURL}/apps/${this.appName}/machines/${sandboxId}`,
        { headers: this.headers }
      )

      logger.info({ sandboxId }, 'Sandbox destroyed')
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.warn({ sandboxId }, 'Sandbox not found (already destroyed)')
        return
      }

      logger.error({
        error: this.formatError(error),
        sandboxId,
      }, 'Failed to destroy sandbox')
      throw error
    }
  }

  async getSandbox(sandboxId: string): Promise<Sandbox | null> {
    try {
      const response = await axios.get(
        `${this.baseURL}/apps/${this.appName}/machines/${sandboxId}`,
        { headers: this.headers }
      )

      return {
        id: response.data.id,
        name: response.data.name,
        ip: response.data.private_ip,
        region: response.data.region,
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  async execCommand(sandboxId: string, command: string[]): Promise<ExecResult> {
    logger.debug({ sandboxId, command }, 'Executing command in sandbox')

    try {
      const response = await axios.post(
        `${this.baseURL}/apps/${this.appName}/machines/${sandboxId}/exec`,
        {
          command,
          timeout: 300, // 5 minutes
        },
        { headers: this.headers }
      )

      return {
        stdout: response.data.stdout || '',
        stderr: response.data.stderr || '',
        exit_code: response.data.exit_code || 0,
      }
    } catch (error) {
      logger.error({
        error: this.formatError(error),
        sandboxId,
        command,
      }, 'Command execution failed')
      throw error
    }
  }

  private formatError(error: unknown): any {
    if (axios.isAxiosError(error)) {
      return {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      }
    }
    return error
  }
}
```

**Verification**:
- TypeScript compiles without errors
- Can instantiate SandboxManager
- Errors are properly typed

**Risks**: API changes, authentication failures
**Mitigation**: Error handling, retry logic, logging

---

### Step 8: Implement SandboxLifecycle (2 hours)

**Goal**: Session-based lifecycle management

**Files**:
- `backend/worker/src/sandbox/SandboxLifecycle.ts` (new)

**Implementation**:
```typescript
import { SandboxManager } from './SandboxManager'
import { logger } from '../utils/logger'
import { config } from '../config'
import { Sandbox, ExecResult } from '../types'
import { createClient } from '@supabase/supabase-js'

interface ActiveSandbox {
  sandbox: Sandbox
  createdAt: Date
}

export class SandboxLifecycle {
  private manager: SandboxManager
  private activeSandboxes = new Map<string, ActiveSandbox>()
  private cleanupInterval?: NodeJS.Timeout
  private supabase

  constructor() {
    this.manager = new SandboxManager()
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey
    )
  }

  async startSandbox(sessionId: string): Promise<Sandbox> {
    logger.info({ sessionId }, 'Starting sandbox for session')

    // Check if sandbox already exists
    if (this.activeSandboxes.has(sessionId)) {
      logger.warn({ sessionId }, 'Sandbox already exists for session')
      return this.activeSandboxes.get(sessionId)!.sandbox
    }

    const sandbox = await this.manager.createSandbox({ sessionId })

    // Track active sandbox
    this.activeSandboxes.set(sessionId, {
      sandbox,
      createdAt: new Date(),
    })

    // Store sandbox ID in database
    await this.updateSessionSandbox(sessionId, sandbox.id)

    return sandbox
  }

  async stopSandbox(sessionId: string): Promise<void> {
    const active = this.activeSandboxes.get(sessionId)

    if (!active) {
      logger.warn({ sessionId }, 'No active sandbox for session')
      return
    }

    logger.info({ sessionId, sandboxId: active.sandbox.id }, 'Stopping sandbox')

    try {
      await this.manager.destroySandbox(active.sandbox.id)
    } catch (error) {
      logger.error({ error, sessionId }, 'Failed to destroy sandbox')
      // Continue to remove from tracking
    }

    this.activeSandboxes.delete(sessionId)
    await this.updateSessionSandbox(sessionId, null)
  }

  async execInSandbox(sessionId: string, command: string[]): Promise<ExecResult> {
    const active = this.activeSandboxes.get(sessionId)

    if (!active) {
      throw new Error(`No active sandbox for session ${sessionId}`)
    }

    return this.manager.execCommand(active.sandbox.id, command)
  }

  getSandbox(sessionId: string): Sandbox | null {
    const active = this.activeSandboxes.get(sessionId)
    return active ? active.sandbox : null
  }

  startCleanup(): void {
    const cleanupIntervalMs = 60000 // 1 minute

    logger.info({ intervalMs: cleanupIntervalMs }, 'Starting sandbox cleanup')

    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleSandboxes()
    }, cleanupIntervalMs)
  }

  private async cleanupStaleSandboxes(): Promise<void> {
    const now = new Date()
    const maxAge = config.sandbox.timeoutMs

    for (const [sessionId, active] of this.activeSandboxes.entries()) {
      const age = now.getTime() - active.createdAt.getTime()

      if (age > maxAge) {
        logger.info({ sessionId, age, maxAge }, 'Cleaning up stale sandbox')
        await this.stopSandbox(sessionId).catch(err =>
          logger.error({ err, sessionId }, 'Cleanup failed')
        )
      }
    }
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
      logger.info('Sandbox cleanup stopped')
    }
  }

  async shutdown(): Promise<void> {
    logger.info({ count: this.activeSandboxes.size }, 'Shutting down all sandboxes')

    this.stopCleanup()

    // Stop all active sandboxes
    const promises = Array.from(this.activeSandboxes.keys()).map(sessionId =>
      this.stopSandbox(sessionId).catch(err =>
        logger.error({ err, sessionId }, 'Shutdown failed for sandbox')
      )
    )

    await Promise.allSettled(promises)

    logger.info('All sandboxes shut down')
  }

  private async updateSessionSandbox(
    sessionId: string,
    sandboxId: string | null
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('coding_sessions')
        .update({ sandbox_id: sandboxId })
        .eq('id', sessionId)

      if (error) {
        logger.error({ error, sessionId, sandboxId }, 'Failed to update session sandbox_id')
      }
    } catch (error) {
      logger.error({ error, sessionId, sandboxId }, 'Exception updating session sandbox_id')
    }
  }
}
```

**Verification**:
- TypeScript compiles
- Can create SandboxLifecycle instance
- Map tracking works

**Risks**: Memory leaks, missed cleanups
**Mitigation**: Periodic cleanup, shutdown handling

---

### Step 9: Add Database Migration (15 min)

**Goal**: Add sandbox_id column to coding_sessions

**Files**:
- `supabase/migrations/009_add_sandbox_id.sql` (new)

**Migration**:
```sql
-- Add sandbox_id column to coding_sessions
ALTER TABLE coding_sessions
ADD COLUMN IF NOT EXISTS sandbox_id TEXT;

-- Add index for sandbox cleanup queries
CREATE INDEX IF NOT EXISTS idx_sessions_sandbox_id
ON coding_sessions(sandbox_id)
WHERE sandbox_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN coding_sessions.sandbox_id IS 'Fly.io machine ID for this session';
```

**Apply Migration**:
```bash
supabase db reset  # Local
# Or for production:
supabase db push
```

**Verification**:
- Migration applies without errors
- Column exists: `SELECT sandbox_id FROM coding_sessions LIMIT 1;`

---

### Step 10: Integrate with JobProcessor (1 hour)

**Goal**: Use sandboxes in job processing

**Files**:
- `backend/worker/src/JobProcessor.ts` (update)

**Changes**:
```typescript
import { SandboxLifecycle } from './sandbox/SandboxLifecycle'

export class JobProcessor {
  private queue: JobQueue
  private sandboxes: SandboxLifecycle
  // ... other properties ...

  constructor() {
    this.queue = new JobQueue()
    this.sandboxes = new SandboxLifecycle()
  }

  async start(): Promise<void> {
    // ... existing code ...

    // Start sandbox cleanup
    this.sandboxes.startCleanup()

    logger.info('Job processor ready')
  }

  private async processNextJob(): Promise<void> {
    // ... existing code up to job processing ...

    try {
      const job = await this.queue.claimNextJob()
      if (!job) {
        this.isProcessing = false
        return
      }

      const startTime = Date.now()
      logger.info({
        jobId: job.job_id,
        sessionId: job.session_id,
        priority: job.priority || 0,
      }, 'Processing job')

      // Create sandbox for session
      const sandbox = await this.sandboxes.startSandbox(job.session_id)
      logger.info({ sessionId: job.session_id, sandboxId: sandbox.id }, 'Sandbox ready')

      try {
        // Test command execution
        const result = await this.sandboxes.execInSandbox(
          job.session_id,
          ['echo', 'Hello from MobVibe sandbox']
        )

        logger.info({
          sessionId: job.session_id,
          stdout: result.stdout,
          exitCode: result.exit_code,
        }, 'Sandbox command executed')

        // Phase 16 will add actual Claude Agent here

        await this.queue.completeJob(job.job_id)

        const duration = Date.now() - startTime
        logger.info({ jobId: job.job_id, duration }, 'Job completed')

      } catch (error) {
        logger.error({ error, jobId: job.job_id }, 'Job processing failed')
        await this.queue.failJob(job.job_id, error.message)
      } finally {
        // Sandbox cleanup handled by lifecycle timeout
        // Will be destroyed when session ends or times out
      }

    } catch (error) {
      logger.error({ error }, 'Job processing error')
    } finally {
      this.isProcessing = false

      if (this.isRunning) {
        setTimeout(() => this.processNextJob(), 100)
      }
    }
  }

  async stop(): Promise<void> {
    // ... existing code ...

    // Shutdown all sandboxes
    await this.sandboxes.shutdown()

    logger.info('Job processor stopped')
  }

  // Remove simulateProcessing method
}
```

**Verification**:
- Worker starts successfully
- No TypeScript errors
- Sandbox methods accessible

---

### Step 11: Test Sandbox Creation (1 hour)

**Goal**: Manual verification

**Test Script**:
```bash
# 1. Ensure .env has FLY_API_TOKEN
cat backend/worker/.env | grep FLY_API_TOKEN

# 2. Start worker
cd backend/worker
npm run dev

# 3. In another terminal, create test job
curl -X POST http://localhost:54321/functions/v1/start-coding-session \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-uuid",
    "prompt": "Test sandbox execution"
  }'

# 4. Watch worker logs - should see:
# - "Starting sandbox for session"
# - "Sandbox created"
# - "Sandbox ready"
# - "Executing command in sandbox"
# - "Sandbox command executed"
# - "Job completed"

# 5. Verify in Fly.io
flyctl machines list --app mobvibe-sandboxes

# Should see machine (or 0 if auto-destroyed quickly)

# 6. Check database
supabase db query "
  SELECT id, status, sandbox_id
  FROM coding_sessions
  ORDER BY created_at DESC
  LIMIT 5
"
```

**Expected Results**:
- Sandbox creates successfully
- Command executes and returns output
- Machine auto-destroys
- Database updated with sandbox_id

**Risks**: Fly.io API errors, network issues
**Mitigation**: Check Fly.io status, verify token

---

### Step 12: Create Unit Tests (1.5 hours)

**Goal**: Test sandbox components

**Files**:
- `tests/backend/sandbox.test.ts` (new)

**Test Cases**:
```typescript
import { SandboxManager } from '../../backend/worker/src/sandbox/SandboxManager'
import { SandboxLifecycle } from '../../backend/worker/src/sandbox/SandboxLifecycle'

describe('SandboxManager', () => {
  let manager: SandboxManager

  beforeAll(() => {
    if (!process.env.FLY_API_TOKEN) {
      console.warn('Skipping sandbox tests - FLY_API_TOKEN not set')
      return
    }
    manager = new SandboxManager()
  })

  it('creates sandbox', async () => {
    if (!process.env.FLY_API_TOKEN) return

    const sandbox = await manager.createSandbox({
      sessionId: `test-${Date.now()}`,
    })

    expect(sandbox).toHaveProperty('id')
    expect(sandbox).toHaveProperty('ip')
    expect(sandbox).toHaveProperty('region')

    // Cleanup
    await manager.destroySandbox(sandbox.id)
  }, 30000)

  it('executes command in sandbox', async () => {
    if (!process.env.FLY_API_TOKEN) return

    const sandbox = await manager.createSandbox({
      sessionId: `test-${Date.now()}`,
    })

    const result = await manager.execCommand(sandbox.id, ['echo', 'test'])

    expect(result.stdout).toContain('test')
    expect(result.exit_code).toBe(0)

    await manager.destroySandbox(sandbox.id)
  }, 30000)

  it('handles non-existent sandbox', async () => {
    if (!process.env.FLY_API_TOKEN) return

    const result = await manager.getSandbox('non-existent-id')
    expect(result).toBeNull()
  })
})

describe('SandboxLifecycle', () => {
  let lifecycle: SandboxLifecycle

  beforeAll(() => {
    if (!process.env.FLY_API_TOKEN) return
    lifecycle = new SandboxLifecycle()
  })

  afterAll(async () => {
    if (lifecycle) {
      await lifecycle.shutdown()
    }
  })

  it('starts and stops sandbox', async () => {
    if (!process.env.FLY_API_TOKEN) return

    const sessionId = `test-${Date.now()}`

    const sandbox = await lifecycle.startSandbox(sessionId)
    expect(sandbox).toHaveProperty('id')

    const retrieved = lifecycle.getSandbox(sessionId)
    expect(retrieved).toBe(sandbox)

    await lifecycle.stopSandbox(sessionId)

    const afterStop = lifecycle.getSandbox(sessionId)
    expect(afterStop).toBeNull()
  }, 30000)
})
```

**Run Tests**:
```bash
npm test -- tests/backend/sandbox.test.ts
```

**Verification**:
- Tests pass with real Fly.io API
- Tests skip if no token (CI)

---

### Step 13: Create Documentation (2 hours)

**Goal**: Comprehensive sandbox guide

**Files**:
- `docs/backend/SANDBOXES.md` (new)

**Content Sections**:
1. Overview & Architecture
2. Fly.io Setup Guide
3. Docker Image Details
4. API Reference (SandboxManager, SandboxLifecycle)
5. Configuration
6. Security Considerations
7. Cost Optimization
8. Troubleshooting
9. Testing Guide
10. Production Deployment

**Key Topics**:
- Ephemeral vs persistent sandboxes
- Auto-destroy strategy
- Timeout management
- Error handling
- Monitoring and alerts

---

### Step 14: Update Environment Template (15 min)

**Goal**: Document new variables

**Files**:
- `backend/worker/.env.example` (already done in Step 5)

**Verify completeness**:
```bash
# All Fly.io variables
FLY_API_TOKEN
FLY_APP_NAME
FLY_REGION

# All sandbox variables
SANDBOX_TIMEOUT_MS
SANDBOX_MEMORY_MB
SANDBOX_CPUS
SANDBOX_IMAGE
```

---

### Step 15: Update links-map (15 min)

**Goal**: Add Phase 15 documentation links

**Files**:
- `docs/phases/phase1/links-map.md` (update)

**Additions**:
- Research: sandbox-patterns.md
- Context: 15-context-bundle.md
- Sequencing: 15-sandbox-steps.md
- Documentation: SANDBOXES.md ⭐

---

### Step 16: Performance Testing (1 hour)

**Goal**: Measure sandbox operations

**Test Script**:
```typescript
// tests/backend/sandbox-performance.test.ts
describe('Sandbox Performance', () => {
  it('measures creation time', async () => {
    const start = Date.now()
    const sandbox = await manager.createSandbox({ sessionId: 'perf-test' })
    const duration = Date.now() - start

    console.log(`Sandbox creation: ${duration}ms`)
    expect(duration).toBeLessThan(2000) // < 2 seconds

    await manager.destroySandbox(sandbox.id)
  })

  it('measures command execution', async () => {
    const sandbox = await manager.createSandbox({ sessionId: 'exec-test' })

    const start = Date.now()
    await manager.execCommand(sandbox.id, ['echo', 'test'])
    const duration = Date.now() - start

    console.log(`Command execution: ${duration}ms`)
    expect(duration).toBeLessThan(500) // < 500ms

    await manager.destroySandbox(sandbox.id)
  })
})
```

**Target Metrics**:
- Create: <1s (p50), <2s (p95)
- Exec: <300ms overhead
- Destroy: <500ms

---

### Step 17: Security Audit (30 min)

**Goal**: Verify security hardening

**Checklist**:
- [ ] Non-root user in Dockerfile
- [ ] No secrets in image
- [ ] Resource limits configured
- [ ] Auto-destroy enabled
- [ ] Timeout enforced (30 min)
- [ ] API token in environment only
- [ ] Database updates use service role
- [ ] Error messages don't leak sensitive info

**Test**:
```bash
# Verify non-root
docker run --rm mobvibe-sandbox:latest whoami
# Should output: appuser

# Verify no shells in image
docker run --rm mobvibe-sandbox:latest cat /etc/passwd
# Should have minimal users
```

---

### Step 18: Cost Analysis (30 min)

**Goal**: Estimate and optimize costs

**Calculation**:
```
Machine: shared-cpu-1x, 512MB
Cost: ~$0.02/hour
Average session: 5 minutes = $0.0017
1000 sessions/day: ~$1.70/day = ~$50/month
```

**Optimization Checklist**:
- [ ] Auto-destroy enabled (no idle charges)
- [ ] 30-minute timeout (prevent runaway)
- [ ] Cleanup job removes orphans
- [ ] Single region (no replication)
- [ ] Monitoring alerts set up

---

### Step 19: Integration Verification (1 hour)

**Goal**: End-to-end test

**Test Flow**:
1. Mobile app creates session
2. Edge Function creates job
3. Worker claims job
4. Sandbox created
5. Command executed
6. Results logged
7. Sandbox destroyed
8. Session updated

**Verification**:
```bash
# 1. Start all services
supabase start
cd backend/worker && npm run dev

# 2. Create session via Edge Function
curl -X POST http://localhost:54321/functions/v1/start-coding-session \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"projectId": "uuid", "prompt": "Test"}'

# 3. Watch logs end-to-end
# 4. Verify database state
# 5. Check Fly.io machines cleaned up
```

---

### Step 20: Final Review and Commit (30 min)

**Goal**: Clean commit of Phase 15

**Review Checklist**:
- [ ] All tests passing
- [ ] Documentation complete
- [ ] No debug code
- [ ] .env.example updated
- [ ] links-map updated
- [ ] Git status clean

**Commit Message**:
```
feat: Complete Phase 15 Sandbox Orchestration

Fly.io ephemeral sandbox infrastructure for isolated code execution:
- Sandbox Docker image with Node 20 + Expo CLI (~150MB)
- SandboxManager for Fly.io Machines API integration
- SandboxLifecycle for session-based management
- 30-minute timeout with automatic cleanup
- Integration with JobProcessor
- Comprehensive testing and documentation

New files:
- backend/worker/sandbox/Dockerfile - Sandbox container image
- backend/worker/src/sandbox/SandboxManager.ts - Fly.io API client
- backend/worker/src/sandbox/SandboxLifecycle.ts - Lifecycle management
- supabase/migrations/009_add_sandbox_id.sql - Database support
- tests/backend/sandbox.test.ts - Unit tests
- docs/backend/SANDBOXES.md - Comprehensive guide

Modified files:
- backend/worker/src/JobProcessor.ts - Sandbox integration
- backend/worker/src/config/index.ts - Fly.io configuration
- backend/worker/src/types/index.ts - Sandbox types
- backend/worker/package.json - Added axios dependency

Phase 15 complete. Ready for Phase 16 (Claude Agent Integration).

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Risk Management

### Critical Risks

| Risk | Impact | Mitigation | Step |
|------|--------|------------|------|
| Fly.io API changes | High | Use stable API, version pinning | 7 |
| Sandbox leaks (not destroyed) | Cost | Auto-destroy, cleanup job, monitoring | 8 |
| Creation failures | UX | Retry logic, fallback regions | 7 |
| Security breach | Critical | Non-root, resource limits, timeout | 2, 17 |
| Cost overruns | Business | Alerts, auto-destroy, limits | 18 |

### Mitigation Strategies

1. **API Reliability**: Retry with exponential backoff
2. **Cleanup**: Multiple layers (auto-destroy, timeout, periodic)
3. **Security**: Defense in depth (VM + container + hardening)
4. **Cost**: Monitoring alerts, aggressive cleanup
5. **Testing**: Real Fly.io tests, performance benchmarks

## Success Metrics

- **Functionality**: All acceptance criteria met
- **Performance**: <2s sandbox creation, <500ms exec
- **Reliability**: >99% success rate
- **Security**: Security audit passes
- **Cost**: <$100/month for 1000 sessions

## Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Setup & Docker | 3 hours | 3h |
| Implementation | 6 hours | 9h |
| Testing | 2.5 hours | 11.5h |
| Documentation | 2 hours | 13.5h |
| Verification | 2.5 hours | 16h |

**Buffer**: 2 hours for unexpected issues
**Total with Buffer**: ~18 hours (2.25 days)

---

**Plan Created**: 2025-01-07
**Phase**: 15 - Sandbox Orchestration
**Status**: Ready for Execution
