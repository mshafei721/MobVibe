# 15-sandbox-orchestration.md
---
phase_id: 15
title: Sandbox Orchestration (Fly.io Setup)
duration_estimate: "2 days"
incremental_value: Isolated execution environments for Claude Agent
owners: [Backend Engineer, DevOps]
dependencies: [14]
linked_phases_forward: [16]
docs_referenced: [Architecture, Implementation]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["Fly.io Machines API best practices", "Docker container orchestration", "Sandbox security isolation"]
    outputs: ["/docs/research/phase1/15/sandbox-patterns.md"]
  - name: ContextCurator
    tool: context7
    scope: ["architecture.md sandboxes", "implementation.md infrastructure"]
    outputs: ["/docs/context/phase1/15-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for Fly.io sandbox creation and lifecycle management"
    outputs: ["/docs/sequencing/phase1/15-sandbox-steps.md"]
acceptance_criteria:
  - Sandboxes can be created via Fly.io API
  - Sandboxes isolated (network, filesystem)
  - Sandbox lifecycle managed (create, start, stop, destroy)
  - Worker can execute commands in sandbox
  - Sandbox timeout and cleanup working
  - File sync between sandbox and Supabase Storage
---

## Objectives

1. **Setup Fly.io Account** - Configure Fly.io for sandboxes
2. **Create Sandbox Manager** - Lifecycle management for containers
3. **Implement Isolation** - Security and resource limits

## Scope

### In
- Fly.io Machines API integration
- Sandbox lifecycle (create, destroy, timeout)
- Docker image for sandbox (Node + Expo CLI)
- Basic command execution
- File system isolation
- Network isolation
- Resource limits (CPU, memory)

### Out
- Complex networking (Phase 19 will add WebSocket)
- File sync optimization (basic sync sufficient for MVP)
- Multi-region deployment (single region for MVP)

## Tasks

- [ ] **Use context7**, **websearch**, **sequentialthinking** per template

- [ ] **Setup Fly.io Account**:
  ```bash
  # Install flyctl
  curl -L https://fly.io/install.sh | sh

  # Login
  flyctl auth login

  # Create organization (if needed)
  flyctl orgs create mobvibe

  # Create app for sandboxes
  flyctl apps create mobvibe-sandboxes

  # Get API token
  flyctl auth token
  ```

- [ ] **Create Sandbox Docker Image**:
  ```dockerfile
  # backend/worker/sandbox/Dockerfile
  FROM node:20-alpine

  # Install system dependencies
  RUN apk add --no-cache git bash curl

  # Install Expo CLI and EAS CLI
  RUN npm install -g expo-cli eas-cli

  # Create workspace
  WORKDIR /workspace

  # Set up non-root user for security
  RUN addgroup -S appuser && adduser -S -G appuser appuser
  RUN chown -R appuser:appuser /workspace

  USER appuser

  # Keep container running
  CMD ["tail", "-f", "/dev/null"]
  ```

- [ ] **Build and Push Sandbox Image**:
  ```bash
  # Build
  cd backend/worker/sandbox
  docker build -t mobvibe-sandbox:latest .

  # Tag for Fly.io registry
  docker tag mobvibe-sandbox:latest registry.fly.io/mobvibe-sandbox:latest

  # Push to Fly.io
  flyctl auth docker
  docker push registry.fly.io/mobvibe-sandbox:latest
  ```

- [ ] **Create Sandbox Manager** (`src/sandbox/SandboxManager.ts`):
  ```typescript
  import axios from 'axios'
  import { logger } from '../utils/logger'

  interface SandboxConfig {
    sessionId: string
    region?: string
    cpuKind?: string
    memory?: number
  }

  export class SandboxManager {
    private flyToken: string
    private appName: string = 'mobvibe-sandboxes'

    constructor() {
      this.flyToken = process.env.FLY_API_TOKEN!
      if (!this.flyToken) {
        throw new Error('FLY_API_TOKEN not set')
      }
    }

    async createSandbox(config: SandboxConfig) {
      const machineId = `session-${config.sessionId}`

      logger.info({ machineId }, 'Creating sandbox')

      try {
        const response = await axios.post(
          `https://api.machines.dev/v1/apps/${this.appName}/machines`,
          {
            name: machineId,
            region: config.region || 'sjc', // San Jose
            config: {
              image: 'registry.fly.io/mobvibe-sandbox:latest',
              guest: {
                cpu_kind: config.cpuKind || 'shared',
                cpus: 1,
                memory_mb: config.memory || 512,
              },
              env: {
                SESSION_ID: config.sessionId,
              },
              auto_destroy: true, // Auto-destroy when stopped
            },
          },
          {
            headers: {
              'Authorization': `Bearer ${this.flyToken}`,
              'Content-Type': 'application/json',
            },
          }
        )

        const machine = response.data

        logger.info({ machineId, ip: machine.private_ip }, 'Sandbox created')

        return {
          id: machine.id,
          name: machine.name,
          ip: machine.private_ip,
          region: machine.region,
        }
      } catch (error) {
        logger.error({ error, machineId }, 'Failed to create sandbox')
        throw error
      }
    }

    async destroySandbox(sandboxId: string) {
      logger.info({ sandboxId }, 'Destroying sandbox')

      try {
        await axios.delete(
          `https://api.machines.dev/v1/apps/${this.appName}/machines/${sandboxId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.flyToken}`,
            },
          }
        )

        logger.info({ sandboxId }, 'Sandbox destroyed')
      } catch (error) {
        logger.error({ error, sandboxId }, 'Failed to destroy sandbox')
        throw error
      }
    }

    async getSandbox(sandboxId: string) {
      try {
        const response = await axios.get(
          `https://api.machines.dev/v1/apps/${this.appName}/machines/${sandboxId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.flyToken}`,
            },
          }
        )

        return response.data
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null
        }
        throw error
      }
    }

    async execCommand(sandboxId: string, command: string[]) {
      logger.debug({ sandboxId, command }, 'Executing command in sandbox')

      try {
        const response = await axios.post(
          `https://api.machines.dev/v1/apps/${this.appName}/machines/${sandboxId}/exec`,
          {
            command,
            timeout: 300, // 5 minutes
          },
          {
            headers: {
              'Authorization': `Bearer ${this.flyToken}`,
              'Content-Type': 'application/json',
            },
          }
        )

        return {
          stdout: response.data.stdout,
          stderr: response.data.stderr,
          exit_code: response.data.exit_code,
        }
      } catch (error) {
        logger.error({ error, sandboxId, command }, 'Command execution failed')
        throw error
      }
    }
  }
  ```

- [ ] **Create Sandbox Lifecycle Manager** (`src/sandbox/SandboxLifecycle.ts`):
  ```typescript
  import { SandboxManager } from './SandboxManager'
  import { logger } from '../utils/logger'

  export class SandboxLifecycle {
    private manager: SandboxManager
    private activeSandboxes = new Map<string, { id: string; createdAt: Date }>()
    private cleanupInterval?: NodeJS.Timeout

    constructor() {
      this.manager = new SandboxManager()
    }

    async startSandbox(sessionId: string) {
      logger.info({ sessionId }, 'Starting sandbox for session')

      const sandbox = await this.manager.createSandbox({ sessionId })

      // Track active sandbox
      this.activeSandboxes.set(sessionId, {
        id: sandbox.id,
        createdAt: new Date(),
      })

      // Store sandbox ID in database
      await this.updateSessionSandbox(sessionId, sandbox.id)

      return sandbox
    }

    async stopSandbox(sessionId: string) {
      const sandbox = this.activeSandboxes.get(sessionId)

      if (!sandbox) {
        logger.warn({ sessionId }, 'No active sandbox for session')
        return
      }

      logger.info({ sessionId, sandboxId: sandbox.id }, 'Stopping sandbox')

      await this.manager.destroySandbox(sandbox.id)
      this.activeSandboxes.delete(sessionId)

      await this.updateSessionSandbox(sessionId, null)
    }

    async execInSandbox(sessionId: string, command: string[]) {
      const sandbox = this.activeSandboxes.get(sessionId)

      if (!sandbox) {
        throw new Error(`No active sandbox for session ${sessionId}`)
      }

      return this.manager.execCommand(sandbox.id, command)
    }

    startCleanup() {
      // Clean up sandboxes older than 30 minutes
      this.cleanupInterval = setInterval(() => {
        const now = new Date()
        const maxAge = 30 * 60 * 1000 // 30 minutes

        for (const [sessionId, sandbox] of this.activeSandboxes.entries()) {
          const age = now.getTime() - sandbox.createdAt.getTime()

          if (age > maxAge) {
            logger.info({ sessionId, age }, 'Cleaning up stale sandbox')
            this.stopSandbox(sessionId).catch(err =>
              logger.error({ err, sessionId }, 'Cleanup failed')
            )
          }
        }
      }, 60000) // Check every minute
    }

    stopCleanup() {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval)
      }
    }

    async shutdown() {
      logger.info('Shutting down all sandboxes')

      // Stop all active sandboxes
      const promises = Array.from(this.activeSandboxes.keys()).map(sessionId =>
        this.stopSandbox(sessionId)
      )

      await Promise.allSettled(promises)
      this.stopCleanup()
    }

    private async updateSessionSandbox(sessionId: string, sandboxId: string | null) {
      // Update coding_sessions table with sandbox_id
      // Implementation depends on Supabase client setup
    }
  }
  ```

- [ ] **Integrate with JobProcessor**:
  ```typescript
  // src/JobProcessor.ts (updated)
  import { SandboxLifecycle } from './sandbox/SandboxLifecycle'

  export class JobProcessor {
    private sandboxes: SandboxLifecycle

    constructor() {
      this.queue = new JobQueue()
      this.sandboxes = new SandboxLifecycle()
    }

    async start() {
      // ... existing code ...
      this.sandboxes.startCleanup()
    }

    async shutdown() {
      // ... existing code ...
      await this.sandboxes.shutdown()
    }

    private async simulateWork(job: any) {
      // Create sandbox for session
      const sandbox = await this.sandboxes.startSandbox(job.session_id)

      try {
        // Execute test command
        const result = await this.sandboxes.execInSandbox(
          job.session_id,
          ['echo', 'Hello from sandbox']
        )

        logger.info({ result }, 'Sandbox command result')

      } finally {
        // Cleanup sandbox (will be done automatically on session end)
      }
    }
  }
  ```

- [ ] **Add Environment Variables**:
  ```bash
  # .env
  FLY_API_TOKEN=your-fly-api-token
  FLY_APP_NAME=mobvibe-sandboxes
  FLY_REGION=sjc
  ```

- [ ] **Test Sandbox Lifecycle**:
  ```typescript
  // tests/backend/sandbox.test.ts
  describe('Sandbox Manager', () => {
    let manager: SandboxManager

    beforeAll(() => {
      manager = new SandboxManager()
    })

    it('creates sandbox', async () => {
      const sandbox = await manager.createSandbox({
        sessionId: 'test-session-1'
      })

      expect(sandbox).toHaveProperty('id')
      expect(sandbox).toHaveProperty('ip')
    }, 30000)

    it('executes commands in sandbox', async () => {
      const sandbox = await manager.createSandbox({
        sessionId: 'test-session-2'
      })

      const result = await manager.execCommand(sandbox.id, ['echo', 'test'])

      expect(result.stdout).toContain('test')
      expect(result.exit_code).toBe(0)

      await manager.destroySandbox(sandbox.id)
    }, 30000)

    it('cleans up stale sandboxes', async () => {
      const lifecycle = new SandboxLifecycle()

      const sandbox = await lifecycle.startSandbox('test-session-3')

      // Manually trigger cleanup
      await lifecycle.stopSandbox('test-session-3')

      const exists = await manager.getSandbox(sandbox.id)
      expect(exists).toBeNull()
    }, 30000)
  })
  ```

- [ ] **Document Sandbox System**:
  - Create: `docs/backend/SANDBOXES.md`
  - Include: Fly.io setup guide
  - Include: Sandbox architecture
  - Include: Security considerations
  - Include: Cost optimization tips

- [ ] **Update links-map**

## Artifacts & Paths

**Sandbox:**
- `backend/worker/sandbox/Dockerfile`
- `backend/worker/src/sandbox/SandboxManager.ts`
- `backend/worker/src/sandbox/SandboxLifecycle.ts`

**Tests:**
- `tests/backend/sandbox.test.ts`

**Docs:**
- `docs/backend/SANDBOXES.md` ⭐

## Testing

### Phase-Only Tests
- Sandbox creates successfully
- Commands execute in sandbox
- Sandboxes destroy cleanly
- Cleanup removes stale sandboxes
- Resource limits enforced

### Cross-Phase Compatibility
- Phase 16-17 will use sandboxes for Claude Agent execution
- Phase 18 will add file sync to sandboxes

### Test Commands
```bash
# Test locally (requires Fly.io token)
npm test -- tests/backend/sandbox.test.ts

# Manual test
flyctl machines list --app mobvibe-sandboxes
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| Fly.io costs escalate | High | Monitor usage, set resource limits, cleanup aggressively |
| Sandbox creation slow | UX | Pre-warm sandboxes, optimize Docker image size |
| Sandboxes leak (not destroyed) | Cost | Implement robust cleanup, monitoring, auto-destroy |
| Security breach in sandbox | Critical | Use minimal Docker image, network isolation, no secrets |

## References

- [Architecture](./../../../../.docs/architecture.md) - Sandbox architecture
- [Phase 14](./14-worker-service.md) - Worker service

## Handover

**Next Phase:** [16-claude-agent-integration.md](./16-claude-agent-integration.md) - Integrate Claude Agent SDK

**Required Inputs Provided to Phase 16:**
- Sandbox lifecycle management working
- Worker can execute commands in sandboxes

---

**Status:** Ready after Phase 14
**Estimated Time:** 2 days
**Blocking Issues:** Requires Phase 14 worker service, Fly.io account
