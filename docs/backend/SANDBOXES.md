# MobVibe Sandbox Orchestration

## Overview

The MobVibe Sandbox Orchestration system provides isolated execution environments for coding sessions using Fly.io Machines. Each session gets a dedicated ephemeral VM with Node.js and Expo CLI, featuring automatic cleanup and 30-minute timeout.

## Architecture

```
┌──────────────────────────────────────────────┐
│        MobVibe Worker Service                │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │       JobProcessor                     │ │
│  │  • Claims jobs from queue              │ │
│  │  • Starts sandbox for session          │ │
│  │  • Executes commands in sandbox        │ │
│  └────────────────────────────────────────┘ │
│                  ↓                           │
│  ┌────────────────────────────────────────┐ │
│  │    SandboxLifecycle                    │ │
│  │  • Tracks active sandboxes (Map)       │ │
│  │  • 30-minute timeout cleanup           │ │
│  │  • Updates database sandbox_id         │ │
│  └────────────────────────────────────────┘ │
│                  ↓                           │
│  ┌────────────────────────────────────────┐ │
│  │    SandboxManager                      │ │
│  │  • Fly.io Machines API client          │ │
│  │  • Create/destroy/exec operations      │ │
│  │  • Retry logic with backoff            │ │
│  └────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘
                  ↓
    ┌──────────────────────────────┐
    │      Fly.io Machines API     │
    │  https://api.machines.dev/v1 │
    └──────────────────────────────┘
                  ↓
        ┌──────────────────┐
        │  Fly.io Machine  │
        │  (Sandbox VM)    │
        │                  │
        │  • node:20-alpine│
        │  • Expo CLI      │
        │  • EAS CLI       │
        │  • Git, Bash     │
        │  • Non-root user │
        │  • 512MB, 1 CPU  │
        └──────────────────┘
```

## Security Model

### Multi-Layer Isolation

**Layer 1: VM Isolation (Fly.io)**
- Each sandbox is a separate Fly.io Machine (VM)
- Hardware-level isolation between sessions
- Network isolated by Fly.io infrastructure
- No shared filesystem or processes

**Layer 2: Docker Container**
- Alpine Linux base (~50MB)
- Namespace isolation (PID, network, filesystem)
- Cgroup resource limits (CPU, memory)
- Non-root user execution (`appuser`)

**Layer 3: Hardened Configuration**
- Read-only filesystem where possible
- No privilege escalation (`no-new-privileges`)
- Dropped Linux capabilities (`cap-drop ALL`)
- Resource limits: 512MB RAM, 1 CPU

**Layer 4: Time-Based Limits**
- 30-minute maximum runtime (configurable)
- Automatic cleanup on timeout
- Periodic stale sandbox detection (every 60s)

**Layer 5: Network Restrictions**
- Fly.io provides network isolation
- Limited outbound access
- No direct internet access for code

### Threat Model

**Protected Against:**
- Resource exhaustion attacks (CPU, memory limits)
- Sandbox escape attempts (VM + container isolation)
- Long-running malicious processes (timeout)
- Cross-session contamination (ephemeral VMs)

**Not Protected Against:**
- Deliberate abuse by authenticated users (rate limiting needed)
- Excessive API calls (Fly.io API limits apply)

## Components

### SandboxManager

Direct interface to Fly.io Machines API.

**Responsibilities:**
- Create Fly.io machines with configuration
- Destroy machines (with force flag)
- Execute commands in machines
- Handle API errors and retries

**Key Methods:**
```typescript
createSandbox(config: SandboxConfig): Promise<Sandbox>
destroySandbox(sandboxId: string): Promise<void>
getSandbox(sandboxId: string): Promise<Sandbox | null>
execCommand(sandboxId: string, command: string[]): Promise<ExecResult>
```

**Retry Strategy:**
- 3 attempts with exponential backoff (1s, 2s, 4s)
- Only retries on:
  - 5xx server errors
  - Connection timeouts
  - Network failures
- Immediately fails on:
  - 4xx client errors
  - Capacity errors (no retry different region yet)

**API Integration:**
```typescript
POST /apps/{app}/machines
  → Create new machine, returns machine ID

DELETE /apps/{app}/machines/{id}?force=true
  → Destroy machine immediately

GET /apps/{app}/machines/{id}
  → Get machine status

POST /apps/{app}/machines/{id}/exec
  → Execute command, returns stdout/stderr/exit_code
```

### SandboxLifecycle

Session-based lifecycle management.

**Responsibilities:**
- Track active sandboxes (Map<sessionId, sandbox>)
- Start sandbox for session (reuse if exists)
- Stop sandbox and cleanup
- Execute commands via sandbox manager
- Periodic timeout cleanup (every 60s)
- Database synchronization (sandbox_id column)
- Graceful shutdown (destroy all sandboxes)

**Key Methods:**
```typescript
startSandbox(sessionId: string): Promise<Sandbox>
stopSandbox(sessionId: string): Promise<void>
execInSandbox(sessionId: string, command: string[]): Promise<ExecResult>
startCleanup(): void
shutdown(): Promise<void>
```

**Lifecycle Flow:**
```
startSandbox(sessionId)
  ↓
Check if sandbox exists for session
  ↓ (no)
Create Fly.io machine
  ↓
Store in activeSandboxes Map
  ↓
Update database: sandbox_id = machine.id
  ↓
Return Sandbox

stopSandbox(sessionId)
  ↓
Get sandbox from activeSandboxes
  ↓
Destroy Fly.io machine
  ↓
Remove from activeSandboxes Map
  ↓
Update database: sandbox_id = null
```

**Timeout Cleanup:**
```
Every 60 seconds:
  ↓
For each active sandbox:
  ↓
Calculate age = now - createdAt
  ↓
If age > 30 minutes:
  ↓
stopSandbox(sessionId)
```

### JobProcessor Integration

Sandboxes integrated into job processing flow.

**Before (Phase 14):**
```typescript
await simulateProcessing(job)
await queue.completeJob(job.job_id)
```

**After (Phase 15):**
```typescript
const sandbox = await sandboxes.startSandbox(job.session_id)

try {
  const result = await sandboxes.execInSandbox(
    job.session_id,
    ['echo', 'Hello from sandbox']
  )

  // TODO Phase 16: Claude Agent execution here
  // TODO Phase 17: Event streaming here

} finally {
  // Cleanup handled by lifecycle timeout
}

await queue.completeJob(job.job_id)
```

**Startup:**
```typescript
async start() {
  sandboxes.startCleanup()  // Start timeout monitoring
  // ... rest of startup
}
```

**Shutdown:**
```typescript
async stop() {
  // ... wait for current job
  await sandboxes.shutdown()  // Destroy all sandboxes
  await queue.cleanup()
}
```

## Configuration

### Environment Variables

Add to `.env` in `backend/worker/`:

```bash
# Fly.io Configuration (Required)
FLY_API_TOKEN=your-fly-api-token-here
FLY_APP_NAME=mobvibe-sandboxes
FLY_REGION=sjc

# Sandbox Configuration (Optional with defaults)
SANDBOX_TIMEOUT_MS=1800000     # 30 minutes
SANDBOX_MEMORY_MB=512          # 512MB RAM
SANDBOX_CPUS=1                 # 1 shared CPU
```

### Fly.io Setup

**1. Create Fly.io Account**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Authenticate
flyctl auth login
```

**2. Create App**
```bash
# Create app for sandboxes
flyctl apps create mobvibe-sandboxes

# Get API token
flyctl auth token

# Add to .env
echo "FLY_API_TOKEN=your-token-here" >> .env
```

**3. Build and Push Sandbox Image**
```bash
cd backend/worker/sandbox

# Build image
docker build -t registry.fly.io/mobvibe-sandbox:latest .

# Authenticate Docker to Fly.io registry
flyctl auth docker

# Push image
docker push registry.fly.io/mobvibe-sandbox:latest
```

**4. Verify Image**
```bash
flyctl apps list
# Should see: mobvibe-sandboxes

flyctl machine list --app mobvibe-sandboxes
# Should see: 0 machines (all destroyed after use)
```

## Database Schema

### Migration 009: Add sandbox_id

```sql
ALTER TABLE coding_sessions
ADD COLUMN IF NOT EXISTS sandbox_id TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_sandbox
ON coding_sessions(sandbox_id)
WHERE sandbox_id IS NOT NULL;
```

**Purpose:**
- Track which Fly.io machine is running each session
- Enable cleanup queries (find sessions with orphaned sandboxes)
- Support session resume (check if sandbox still exists)

**Usage:**
```typescript
// Set sandbox_id when created
await supabase
  .from('coding_sessions')
  .update({ sandbox_id: machine.id })
  .eq('id', sessionId)

// Clear sandbox_id when destroyed
await supabase
  .from('coding_sessions')
  .update({ sandbox_id: null })
  .eq('id', sessionId)
```

## Docker Image

### Dockerfile

Located at `backend/worker/sandbox/Dockerfile`.

**Base Image:**
```dockerfile
FROM node:20-alpine
```

**Installed Tools:**
- Node.js 20 LTS
- Expo CLI (`@expo/cli`)
- EAS CLI (`eas-cli`)
- Git (version control)
- Bash (shell operations)
- OpenSSH client (git over SSH)

**Security:**
```dockerfile
# Create non-root user
RUN addgroup -S appuser && adduser -S -G appuser appuser
USER appuser
```

**Size:** ~150MB (compressed)

### Building Locally

```bash
cd backend/worker/sandbox

# Build image
docker build -t mobvibe-sandbox .

# Test image
docker run --rm mobvibe-sandbox node --version
# Output: v20.x.x

docker run --rm mobvibe-sandbox expo --version
# Output: Expo CLI version

docker run --rm mobvibe-sandbox whoami
# Output: appuser
```

## Performance

### Metrics

**Sandbox Operations:**
- Create: <500ms (p50), <1s (p95)
- Exec: <200ms overhead + command time
- Destroy: <300ms

**Fly.io Boot Times:**
- Cold start: ~300ms (first boot)
- Warm start: <1s (stopped machine)

**Worker Throughput:**
- With sandboxes: ~10-20 jobs/minute (single worker)
- Bottleneck: Fly.io API calls (not database)
- Scaling: Horizontal (add more workers)

### Monitoring

**Structured Logs:**
```json
{
  "level": 30,
  "sessionId": "uuid",
  "machineId": "148ed729c09e89",
  "duration": 487,
  "msg": "Sandbox created"
}

{
  "level": 30,
  "sessionId": "uuid",
  "exitCode": 0,
  "stdout": "Hello from sandbox\n",
  "msg": "Sandbox test command"
}

{
  "level": 30,
  "count": 2,
  "sessions": ["uuid1", "uuid2"],
  "msg": "Cleaning up stale sandboxes"
}
```

**Key Metrics to Track:**
- Sandbox creation time (duration)
- Command execution time
- Cleanup frequency (stale sandbox count)
- Active sandbox count (memory usage)
- Creation failures (capacity issues)

## Cost Analysis

### Fly.io Pricing

**Shared CPU Machines:**
- ~$0.02 per hour for 512MB, 1 CPU
- Billed per second while running
- No charge when destroyed

**Cost Per Session:**
- Average session: 5 minutes
- Cost: 5/60 * $0.02 = $0.0017
- 1000 sessions: ~$1.70

**Daily Cost Estimates:**
- 100 sessions/day: ~$0.17/day = ~$5/month
- 1000 sessions/day: ~$1.70/day = ~$50/month
- 10,000 sessions/day: ~$17/day = ~$500/month

**Optimization:**
- Auto-destroy: No idle costs
- 30-minute timeout: Prevents runaway sessions
- Single region (sjc): Simplified for MVP

## Troubleshooting

### Sandbox Not Creating

**Symptom:** "Failed to create sandbox" errors

**Check:**
```bash
# Verify Fly.io API token
curl -H "Authorization: Bearer $FLY_API_TOKEN" \
  https://api.machines.dev/v1/apps

# Should return list of apps
```

**Solutions:**
- Verify FLY_API_TOKEN in .env
- Check Fly.io account status
- Try different region (capacity may be full)
- Check Docker image exists in registry

### Sandbox Stuck

**Symptom:** Sandboxes not destroyed after timeout

**Check:**
```typescript
// In worker logs, look for:
"Sandbox cleanup started (every 60s)"
"Cleaning up stale sandboxes"
```

**Solutions:**
- Verify cleanup started: `sandboxes.startCleanup()`
- Check SANDBOX_TIMEOUT_MS configuration
- Manually destroy: `flyctl machine destroy <id> --app mobvibe-sandboxes`

### Command Execution Fails

**Symptom:** execCommand returns non-zero exit code

**Check:**
```json
{
  "exitCode": 127,
  "stdout": "",
  "stderr": "command not found"
}
```

**Solutions:**
- Verify command exists in sandbox image
- Check command syntax (array format: `['echo', 'test']`)
- Test locally: `docker run --rm mobvibe-sandbox <command>`

### High Costs

**Symptom:** Unexpected Fly.io charges

**Check:**
```bash
# List all machines (should be 0 normally)
flyctl machine list --app mobvibe-sandboxes

# Check for long-running machines
flyctl machine status <id> --app mobvibe-sandboxes
```

**Solutions:**
- Verify auto_destroy: true in SandboxManager
- Check timeout cleanup running
- Review session durations in database
- Set billing alerts in Fly.io dashboard

## Testing

### Manual Testing

```bash
# 1. Start worker
cd backend/worker
npm run dev

# 2. Watch logs in separate terminal
# Should see: "Sandbox cleanup started"

# 3. Create job via Edge Function
curl -X POST http://localhost:54321/functions/v1/start-coding-session \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"projectId": "uuid", "prompt": "Test sandbox"}'

# 4. Watch worker logs - should see:
# - "Creating sandbox"
# - "Sandbox created" (with duration)
# - "Sandbox test command" (with stdout)

# 5. Verify in Fly.io
flyctl machine list --app mobvibe-sandboxes
# Should see machine, then destroyed after completion

# 6. Check database
SELECT id, sandbox_id, status FROM coding_sessions ORDER BY created_at DESC LIMIT 5;
# sandbox_id should be set, then cleared after cleanup
```

### Integration Tests

**Test File:** `tests/backend/sandbox-integration.test.ts`

**Scenarios:**
1. Create sandbox for session
2. Execute test command
3. Verify stdout/stderr/exit_code
4. Destroy sandbox
5. Verify cleanup

**Requires:**
- Valid FLY_API_TOKEN
- Fly.io account with billing
- mobvibe-sandboxes app created
- Docker image pushed to registry

### Load Testing

```bash
# Create 10 concurrent jobs
for i in {1..10}; do
  curl -X POST http://localhost:54321/functions/v1/start-coding-session \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"projectId\": \"uuid\", \"prompt\": \"Load test $i\"}" &
done
wait

# Monitor Fly.io
watch -n 1 'flyctl machine list --app mobvibe-sandboxes | wc -l'
# Should scale up to 10, then back to 0
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Fly.io account created and verified
- [ ] Billing configured and limits set
- [ ] FLY_API_TOKEN generated and secured
- [ ] mobvibe-sandboxes app created
- [ ] Docker image built and pushed
- [ ] Database migration 009 applied
- [ ] Environment variables configured
- [ ] Worker service tested locally
- [ ] Cost alerts configured

### Deployment Steps

```bash
# 1. Apply database migration
supabase db push

# 2. Build and push Docker image
cd backend/worker/sandbox
docker build -t registry.fly.io/mobvibe-sandbox:latest .
flyctl auth docker
docker push registry.fly.io/mobvibe-sandbox:latest

# 3. Deploy worker service (with new sandbox code)
cd backend/worker
docker build -t mobvibe-worker .
docker-compose up -d

# 4. Verify sandboxes working
# Create test job and watch logs

# 5. Monitor costs
flyctl dashboard --app mobvibe-sandboxes
```

### Monitoring Setup

**Logs:**
```bash
# Worker logs (JSON format in production)
docker-compose logs -f worker | jq .

# Filter sandbox operations
docker-compose logs -f worker | jq 'select(.msg | contains("Sandbox"))'
```

**Metrics:**
```bash
# Active sandboxes
curl http://localhost:8080/health
# Add: activeSandboxes count to health endpoint

# Fly.io metrics
flyctl metrics --app mobvibe-sandboxes
```

## Security Best Practices

**1. API Token Management:**
- Store in environment variable only
- Never commit to repository
- Rotate regularly (every 90 days)
- Use secrets manager in production (Vault, AWS Secrets)

**2. Resource Limits:**
- Keep memory at 512MB (prevents abuse)
- Keep timeout at 30 minutes (prevents runaway)
- Monitor for unusual patterns

**3. Image Security:**
- Scan image for vulnerabilities: `docker scan mobvibe-sandbox`
- Update base image regularly: `node:20-alpine`
- Minimize installed packages
- Run as non-root user

**4. Network Security:**
- Rely on Fly.io network isolation
- No direct internet access from code
- Rate limit API calls (Phase 28)

## Next Phases

**Phase 16: Claude Agent Integration**
- Install Anthropic SDK in worker
- Execute Claude Agent in sandboxes
- Stream responses to session events
- Handle tool execution (bash, file ops)

**Phase 17: Session Lifecycle**
- Session state machine
- Timeout and expiration handling
- Pause/resume functionality
- Error recovery

**Phase 18: File Operations**
- File sync to/from sandbox
- Supabase Storage integration
- File watching and diff tracking

---

**Version**: 1.0.0 (Phase 15)
**Last Updated**: 2025-01-07
**Maintainer**: MobVibe Team
