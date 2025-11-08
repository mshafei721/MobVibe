# Phase 15 Context Bundle: Sandbox Orchestration

## Current State (Phase 14 Complete)

### Worker Service Infrastructure

**Existing Components** (`backend/worker/src/`):
```
backend/worker/src/
├── index.ts              # Main entry with health server integration
├── JobProcessor.ts       # Job processing loop with graceful shutdown
├── HealthServer.ts       # HTTP health check on port 8080
├── config/
│   └── index.ts          # Type-safe configuration with validation
├── utils/
│   └── logger.ts         # Pino structured logging
├── queue/
│   └── JobQueue.ts       # Supabase queue interface
├── monitoring/
│   └── QueueMonitor.ts   # Stats logging every 30s
└── types/
    └── index.ts          # TypeScript interfaces
```

**Current Job Processing Flow**:
1. JobProcessor claims job from queue
2. `simulateProcessing()` runs for 2 seconds (placeholder)
3. Job marked as completed
4. No actual code execution yet

**Configuration Available**:
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (database)
- POLL_INTERVAL_MS (10s), SHUTDOWN_TIMEOUT_MS (30s)
- LOG_LEVEL (info), HEALTH_CHECK_PORT (8080)

**Graceful Shutdown**:
- Stops polling, Realtime subscriptions
- Waits for current job (with timeout)
- Clean resource cleanup

## Phase 15 Requirements

### Sandbox Lifecycle

**Create → Execute → Destroy**:
1. Job claimed by worker
2. Create Fly.io Machine for session
3. Execute commands in sandbox
4. Sync files to Supabase Storage
5. Destroy sandbox on completion/timeout

### Fly.io Integration

**Machines API**:
- Base URL: `https://api.machines.dev/v1`
- Authentication: `Authorization: Bearer $FLY_API_TOKEN`
- Endpoints:
  - POST `/apps/{app}/machines` - Create machine
  - DELETE `/apps/{app}/machines/{id}` - Destroy machine
  - GET `/apps/{app}/machines/{id}` - Get machine status
  - POST `/apps/{app}/machines/{id}/exec` - Execute command

**Machine Configuration**:
```json
{
  "name": "session-{session_id}",
  "region": "sjc",
  "config": {
    "image": "registry.fly.io/mobvibe-sandbox:latest",
    "guest": {
      "cpu_kind": "shared",
      "cpus": 1,
      "memory_mb": 512
    },
    "env": {
      "SESSION_ID": "{session_id}"
    },
    "auto_destroy": true
  }
}
```

**Performance**:
- Boot time: ~300ms
- Start time: <1 second (stopped machines)
- API calls: Best-effort, require retry logic

### Security Requirements

**Isolation Layers**:
1. **Fly.io VM**: Hardware-level isolation
2. **Docker Container**: Namespace + cgroup limits
3. **Non-root User**: Run as `appuser`
4. **Resource Limits**: 512MB RAM, 1 CPU
5. **Timeout**: 30-minute maximum

**Hardened Configuration**:
- Read-only filesystem where possible
- No privilege escalation
- Dropped capabilities
- Network isolation (Fly.io provides)

### Docker Image Requirements

**Base**: `node:20-alpine` (~50MB)

**Installed Tools**:
- Node.js 20 LTS
- Expo CLI (for React Native)
- EAS CLI (Expo Application Services)
- Git (version control)
- Bash (shell operations)

**Security**:
- Non-root user (`appuser`)
- Minimal packages
- No persistent storage needed

## Implementation Architecture

### File Structure After Phase 15

```
backend/worker/
├── src/
│   ├── index.ts                        # (existing)
│   ├── JobProcessor.ts                 # ⚡ Update with sandbox integration
│   ├── HealthServer.ts                 # (existing)
│   ├── config/
│   │   └── index.ts                    # ⚡ Add Fly.io config
│   ├── utils/
│   │   └── logger.ts                   # (existing)
│   ├── queue/
│   │   └── JobQueue.ts                 # (existing)
│   ├── monitoring/
│   │   └── QueueMonitor.ts             # (existing)
│   ├── sandbox/                        # 🆕 Sandbox management
│   │   ├── SandboxManager.ts           # Fly.io API client
│   │   └── SandboxLifecycle.ts         # Session lifecycle
│   └── types/
│       └── index.ts                    # ⚡ Add sandbox types
├── sandbox/                            # 🆕 Sandbox Docker image
│   └── Dockerfile                      # Alpine + Node + Expo
├── package.json                        # ⚡ Add axios dependency
└── .env.example                        # ⚡ Add Fly.io vars
```

### Component Responsibilities

**SandboxManager**:
- Direct Fly.io API integration
- CRUD operations: create, destroy, get
- Command execution: exec
- Error handling and retries

**SandboxLifecycle**:
- Session-based lifecycle management
- Track active sandboxes (Map<sessionId, sandbox>)
- Timeout and cleanup (30 minutes)
- Batch shutdown on worker stop
- Database updates (sandbox_id field)

**JobProcessor Integration**:
- Create sandbox for job session
- Execute commands in sandbox
- Handle errors gracefully
- Ensure cleanup in finally block

## Implementation Guidelines

### Configuration Updates

**New Environment Variables**:
```bash
# Fly.io Configuration
FLY_API_TOKEN=your-fly-api-token-here
FLY_APP_NAME=mobvibe-sandboxes
FLY_REGION=sjc
SANDBOX_TIMEOUT_MS=1800000  # 30 minutes
SANDBOX_MEMORY_MB=512
SANDBOX_CPUS=1
```

**Config Type**:
```typescript
interface Config {
  // ... existing config ...
  flyio: {
    apiToken: string
    appName: string
    region: string
  }
  sandbox: {
    timeoutMs: number
    memoryMb: number
    cpus: number
  }
}
```

### Error Handling Patterns

**Creation Failures**:
```typescript
try {
  const sandbox = await manager.createSandbox(config)
} catch (error) {
  if (isCapacityError(error)) {
    // Try different region or fail gracefully
    logger.warn({ error }, 'Capacity full, retrying')
  } else {
    // Fail job, will retry
    throw error
  }
}
```

**Execution Failures**:
```typescript
try {
  const result = await manager.execCommand(sandboxId, command)
  if (result.exit_code !== 0) {
    logger.error({ stderr: result.stderr }, 'Command failed')
    // Handle non-zero exit
  }
} catch (error) {
  logger.error({ error }, 'Exec API failed')
  throw error
}
```

**Cleanup Failures**:
```typescript
try {
  await manager.destroySandbox(sandboxId)
} catch (error) {
  // Log but don't fail - periodic cleanup will catch it
  logger.error({ error, sandboxId }, 'Failed to destroy sandbox')
}
```

### Logging Standards

**Sandbox Lifecycle**:
```typescript
logger.info({ sessionId, machineId }, 'Creating sandbox')
logger.info({ sessionId, machineId, ip }, 'Sandbox created')
logger.debug({ sessionId, command }, 'Executing command')
logger.info({ sessionId, duration }, 'Sandbox destroyed')
```

**Performance Tracking**:
```typescript
const startTime = Date.now()
const sandbox = await manager.createSandbox(config)
const createDuration = Date.now() - startTime
logger.info({ sessionId, createDuration }, 'Sandbox creation time')
```

### Retry Logic

**API Calls**:
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  backoff: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(backoff * Math.pow(2, i))
    }
  }
  throw new Error('Retry exhausted')
}
```

### Timeout Management

**Periodic Cleanup** (every minute):
```typescript
const now = new Date()
const maxAge = config.sandbox.timeoutMs

for (const [sessionId, sandbox] of activeSandboxes) {
  const age = now.getTime() - sandbox.createdAt.getTime()
  if (age > maxAge) {
    logger.info({ sessionId, age }, 'Cleaning up stale sandbox')
    await stopSandbox(sessionId)
  }
}
```

## Database Integration

### Schema Addition

**coding_sessions table**:
```sql
-- Add sandbox_id column
ALTER TABLE coding_sessions
ADD COLUMN IF NOT EXISTS sandbox_id TEXT;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_sessions_sandbox
ON coding_sessions(sandbox_id)
WHERE sandbox_id IS NOT NULL;
```

### Update Pattern

```typescript
async function updateSessionSandbox(
  sessionId: string,
  sandboxId: string | null
) {
  await supabase
    .from('coding_sessions')
    .update({ sandbox_id: sandboxId })
    .eq('id', sessionId)
}
```

## Testing Strategy

### Unit Tests

**SandboxManager**:
- Mock axios calls
- Test retry logic
- Validate request payloads

**SandboxLifecycle**:
- Test timeout cleanup
- Verify tracking map
- Check shutdown behavior

### Integration Tests

**With Fly.io** (requires API token):
- Create real machine
- Execute test command
- Verify output
- Destroy successfully
- Check orphan cleanup

**Test Isolation**:
- Use test-specific app name
- Clean up after each test
- Handle API failures gracefully

### Manual Testing

```bash
# 1. Set Fly.io token
export FLY_API_TOKEN=your-token

# 2. Run worker
npm run dev

# 3. Create job via Edge Function
curl -X POST http://localhost:54321/functions/v1/start-coding-session \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"projectId": "uuid", "prompt": "Test sandbox"}'

# 4. Watch logs - should see:
# - "Creating sandbox"
# - "Sandbox created"
# - "Executing command in sandbox"
# - "Sandbox destroyed"

# 5. Verify in Fly.io
flyctl machines list --app mobvibe-sandboxes
# Should see 0 machines (auto-destroyed)
```

## Performance Targets

**Sandbox Operations**:
- Create: <500ms (p50), <1s (p95)
- Exec: <200ms overhead + command time
- Destroy: <300ms

**Worker Throughput**:
- With sandboxes: ~10-20 jobs/minute (single worker)
- Bottleneck shifts from database to Fly.io API
- Horizontal scaling still effective

## Cost Estimation

**Fly.io Pricing**:
- ~$0.02 per hour for shared-cpu-1x, 512MB
- Average session: 5 minutes
- Cost per session: ~$0.0017
- 1000 sessions: ~$1.70

**Optimization**:
- Auto-destroy reduces idle costs
- 30-minute timeout prevents runaway
- Single region for MVP

## Security Considerations

**API Token**:
- Store in environment variable
- Never commit to repository
- Rotate regularly
- Use Fly.io's token management

**Sandbox Isolation**:
- Each session gets own VM
- No shared state between sandboxes
- Network isolated by Fly.io
- Resource limits prevent abuse

**Code Execution**:
- Phase 16 will add Claude Agent
- Phase 17 will add actual code generation
- Phase 15 just infrastructure

## Migration from Phase 14

**JobProcessor Changes**:
```typescript
// Before (Phase 14):
private async simulateProcessing(job: Job) {
  await new Promise(resolve => setTimeout(resolve, 2000))
  logger.debug({ jobId: job.job_id }, 'Simulated processing')
}

// After (Phase 15):
private async processJob(job: Job) {
  const sandbox = await this.sandboxes.startSandbox(job.session_id)

  try {
    // Test command execution
    const result = await this.sandboxes.execInSandbox(
      job.session_id,
      ['echo', 'Hello from sandbox']
    )

    logger.info({ result }, 'Sandbox test command')

    // Phase 16 will add actual Claude Agent here

  } finally {
    // Cleanup handled by lifecycle manager
  }
}
```

## Dependencies

**New npm Packages**:
- `axios`: HTTP client for Fly.io API
- `axios-retry` (optional): Automatic retry logic

**Fly.io Account Requirements**:
- Active Fly.io account
- API token with Machines access
- App created: `mobvibe-sandboxes`
- Docker image pushed to registry

## Success Criteria

**Phase 15 Complete When**:
- [ ] Sandbox Docker image built and pushed
- [ ] SandboxManager creates/destroys machines
- [ ] SandboxLifecycle tracks sessions
- [ ] Commands execute in sandboxes
- [ ] Timeout cleanup working
- [ ] Integration tests pass
- [ ] Documentation complete

## Next Phase Preview (Phase 16)

**Claude Agent Integration**:
- Install Anthropic SDK in sandbox
- Execute Claude Agent operations
- Stream responses to session events
- Handle tool execution (bash, file ops)

**What Phase 15 Provides**:
- Working sandbox infrastructure
- Command execution capability
- Session-based lifecycle
- Ready for actual code generation

---

**Context Bundle Created**: 2025-01-07
**Phase**: 15 - Sandbox Orchestration
**Status**: Ready for Sequential Planning
