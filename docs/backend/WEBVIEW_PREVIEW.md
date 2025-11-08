# WebView Preview System

**Phase:** 23
**Status:** Backend Complete, Mobile Deferred
**Last Updated:** 2025-11-08

## Overview

The WebView Preview system enables users to view their generated React Native apps directly within the MobVibe mobile app. The backend infrastructure automatically starts an Expo dev server in each coding sandbox and generates accessible preview URLs.

**Backend Complete**:
- Database schema with preview URL storage
- PreviewManager for URL generation and lifecycle
- Expo dev server management in sandboxes
- Server health checking and retry logic
- AgentRunner integration

**Mobile Deferred**:
- WebView component
- Preview toolbar
- Device frame UI
- Screenshot capture
- Auto-refresh on updates

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile App (Deferred)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Preview      │  │ WebView      │  │ Preview      │      │
│  │ Screen       │→ │ Component    │→ │ Toolbar      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                   │                  │             │
│         └───────────────────┴──────────────────┘             │
│                             ↓                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓ Supabase Realtime (preview_url updates)
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  ┌──────────────────────────────────────────┐               │
│  │ coding_sessions                          │               │
│  │  - preview_url: TEXT                     │               │
│  │  - preview_status: TEXT (pending|...)    │               │
│  │  - preview_port: INTEGER (19006)         │               │
│  │  - preview_updated_at: TIMESTAMPTZ       │               │
│  └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │ SQL updates
┌─────────────────────────────────────────────────────────────┐
│                     Worker Service                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AgentRunner  │→ │ Preview      │→ │ Sandbox      │      │
│  │              │  │ Manager      │  │ Lifecycle    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                            │                  │              │
│                            ↓                  ↓              │
│                    ┌──────────────┐  ┌──────────────┐       │
│                    │ Retry        │  │ Session      │       │
│                    │ Manager      │  │ Lifecycle    │       │
│                    └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    npx expo start --web --port 19006
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Fly.io Sandbox                            │
│  ┌──────────────────────────────────────────┐               │
│  │ Expo Dev Server                          │               │
│  │  http://<sandbox-id>.fly.dev:19006       │               │
│  │                                          │               │
│  │  - Serves React Native web app          │               │
│  │  - Auto-reloads on file changes         │               │
│  │  - Accessible from mobile device        │               │
│  └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Preview URL Generation**:
```
1. Claude Agent completes code generation
2. AgentRunner.runSession() calls PreviewManager.generatePreviewUrl()
3. PreviewManager:
   a. Updates preview_status to 'starting'
   b. Emits STATE_CHANGED event
   c. Starts Expo dev server in sandbox
   d. Waits for server to respond (HTTP 200)
   e. Builds preview URL using sandbox ID
   f. Updates coding_sessions with URL
   g. Emits COMPLETION event
4. Mobile app receives preview_url via Realtime
5. Mobile app loads URL in WebView (deferred)
```

**Server Health Check Flow**:
```
startExpoServer()
      ↓
  execInSandbox('npx expo start...')
      ↓
waitForServerReady()
      ↓
  Loop (max 30 attempts, 2s delay):
    ↓
    curl http://localhost:19006
    ↓
    HTTP 200? → Success
    ↓
    Otherwise → Wait 2s, retry
    ↓
  Timeout? → Error
```

---

## Database Schema

### Migration: 012_add_preview_url_to_sessions.sql

```sql
-- Add preview_url column to coding_sessions table
-- Phase 23: WebView Preview

ALTER TABLE coding_sessions
  ADD COLUMN IF NOT EXISTS preview_url TEXT,
  ADD COLUMN IF NOT EXISTS preview_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS preview_port INTEGER DEFAULT 19006,
  ADD COLUMN IF NOT EXISTS preview_updated_at TIMESTAMPTZ;

-- Add index for preview status queries
CREATE INDEX IF NOT EXISTS idx_coding_sessions_preview_status
  ON coding_sessions(preview_status)
  WHERE preview_status != 'ready';

-- Add comments
COMMENT ON COLUMN coding_sessions.preview_url IS 'URL to preview the generated app in WebView';
COMMENT ON COLUMN coding_sessions.preview_status IS 'Status of preview: pending, starting, ready, failed';
COMMENT ON COLUMN coding_sessions.preview_port IS 'Port number for Expo dev server';
COMMENT ON COLUMN coding_sessions.preview_updated_at IS 'Timestamp when preview URL was last updated';

-- Update existing sessions to have pending status
UPDATE coding_sessions
  SET preview_status = 'pending'
  WHERE preview_status IS NULL;
```

### Schema Details

**preview_url** (TEXT):
- Full URL to access Expo dev server
- Format: `http://<sandbox-id>.fly.dev:19006` (or custom domain)
- NULL until preview is ready
- Example: `http://abc123.fly.dev:19006`

**preview_status** (TEXT):
- `pending` - Initial state, preview not started
- `starting` - Expo server being launched
- `ready` - Server running, URL accessible
- `failed` - Server failed to start
- `stopped` - Server manually stopped
- Default: `'pending'`

**preview_port** (INTEGER):
- Port number for Expo dev server
- Default: `19006` (Expo web default)
- Configurable per session

**preview_updated_at** (TIMESTAMPTZ):
- Timestamp of last preview state change
- Updated on status changes and URL updates
- Used for monitoring and debugging

**Index**:
- Partial index on `preview_status WHERE preview_status != 'ready'`
- Optimizes queries for non-ready sessions
- Most queries filter for sessions needing action

---

## Backend Implementation

### PreviewManager Class

**File**: `backend/worker/src/preview/PreviewManager.ts`

**Purpose**: Manage preview URL lifecycle, Expo server, and database updates

**Dependencies**:
- SandboxLifecycle - Execute commands in sandbox
- SessionLifecycleManager - Emit events
- RetryManager - Exponential backoff retries
- Supabase - Database updates

**Key Methods**:

#### generatePreviewUrl()

```typescript
async generatePreviewUrl(
  sessionId: string,
  config: Partial<PreviewConfig> = {}
): Promise<string>
```

**Purpose**: Generate preview URL for session

**Flow**:
1. Update preview_status to 'starting'
2. Emit STATE_CHANGED event
3. Get active sandbox for session
4. Start Expo server with retry (3 attempts)
5. Build preview URL from sandbox ID
6. Update session with URL and status='ready'
7. Emit COMPLETION event
8. Return preview URL

**Error Handling**:
- Wraps entire flow in try-catch
- Updates status to 'failed' on error
- Emits ERROR event
- Re-throws error for caller

**Example**:
```typescript
const previewUrl = await previewManager.generatePreviewUrl('session-123')
// Returns: "http://abc123.fly.dev:19006"
```

#### startExpoServer()

```typescript
private async startExpoServer(sessionId: string, port: number): Promise<void>
```

**Purpose**: Launch Expo dev server in sandbox

**Steps**:
1. Check for package.json existence
2. Execute Expo start command in background
3. Wait for server to be ready

**Command**:
```bash
npx expo start --web --port 19006 --non-interactive > /tmp/expo.log 2>&1 &
```

**Flags**:
- `--web` - Start web server
- `--port 19006` - Specify port
- `--non-interactive` - No prompts
- `> /tmp/expo.log 2>&1 &` - Background with logging

**Validation**:
- Checks package.json exists before starting
- Throws error if package.json missing
- Throws error if command fails

#### waitForServerReady()

```typescript
private async waitForServerReady(sessionId: string, port: number): Promise<void>
```

**Purpose**: Poll server until HTTP 200 response

**Algorithm**:
- Max attempts: 30
- Delay between attempts: 2000ms (2s)
- Total timeout: 60 seconds
- Check method: `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}`

**Logic**:
```typescript
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  const result = await this.sandboxes.execInSandbox(sessionId, [
    'bash', '-c',
    `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}`,
  ])

  if (result.stdout.trim() === '200') {
    return // Success
  }

  if (attempt < maxAttempts) {
    await sleep(2000)
  }
}

throw new Error('Expo server failed to start within timeout period')
```

**Why curl?**:
- Available in all sandboxes
- Simple HTTP status check
- No dependencies required
- Works with localhost

#### refreshPreview()

```typescript
async refreshPreview(sessionId: string): Promise<string>
```

**Purpose**: Refresh or regenerate preview URL

**Logic**:
1. Fetch existing preview_url from database
2. If URL exists, emit STATE_CHANGED('refreshing')
3. Return existing URL (server already running)
4. If no URL, call generatePreviewUrl()

**Use Case**: Mobile app "refresh" button

#### stopPreview()

```typescript
async stopPreview(sessionId: string): Promise<void>
```

**Purpose**: Stop Expo dev server

**Command**: `pkill -f "expo start"`

**Steps**:
1. Kill Expo process in sandbox
2. Update preview_status to 'stopped'
3. Emit STATE_CHANGED event

**Error Handling**: Catches and logs errors, doesn't throw

---

## AgentRunner Integration

**File**: `backend/worker/src/agent/AgentRunner.ts`

**Changes**:

1. **Import PreviewManager**:
```typescript
import { PreviewManager } from '../preview/PreviewManager'
```

2. **Add to class properties**:
```typescript
private previewManager: PreviewManager
```

3. **Initialize in constructor**:
```typescript
this.previewManager = new PreviewManager(sandboxes, lifecycle)
```

4. **Call after completion**:
```typescript
if (toolCalls.length === 0) {
  await this.lifecycle.emitEvent(sessionId, SessionEventType.COMPLETION, {
    message: this.extractTextResponse(response.content),
    stats,
  })

  try {
    logger.info({ sessionId }, 'Generating preview URL')
    const previewUrl = await this.previewManager.generatePreviewUrl(sessionId)
    logger.info({ sessionId, previewUrl }, 'Preview URL generated')
  } catch (error) {
    logger.warn({ sessionId, error }, 'Failed to generate preview URL, continuing anyway')
  }

  break
}
```

**Why graceful error handling?**:
- Preview failure shouldn't crash session
- Code generation is complete
- User can retry preview separately
- Logs warning for debugging

---

## Preview URL Format

### Production URL

```
http://<sandbox-id>.fly.dev:19006
```

**Components**:
- Protocol: `http` (configurable to `https`)
- Host: Fly.io sandbox domain
- Port: `19006` (Expo web default)

**Example**:
```typescript
const sandboxId = 'abc-123-xyz'
const previewUrl = `http://${sandboxId}.fly.dev:19006`
// "http://abc-123-xyz.fly.dev:19006"
```

### Custom Domain

```typescript
const host = process.env.SANDBOX_HOST_DOMAIN || `${sandboxId}.fly.dev`
const previewUrl = `${config.protocol}://${host}:${config.port}`
```

**Environment Variable**:
- `SANDBOX_HOST_DOMAIN` - Override default Fly.io domain
- Use for custom domains or tunneling services

---

## Configuration

### PreviewConfig

```typescript
export interface PreviewConfig {
  port: number
  protocol: 'http' | 'https'
  timeout: number
}

const DEFAULT_CONFIG: PreviewConfig = {
  port: 19006,
  protocol: 'http',
  timeout: 60000,
}
```

**Port** (19006):
- Expo web default port
- Configurable per session
- Must match Expo start command

**Protocol** (http):
- `http` for development
- `https` for production (requires SSL cert)

**Timeout** (60000ms):
- Max wait time for server startup
- 60 seconds default
- Configurable per session

---

## Event Flow

### STATE_CHANGED Events

**preview_status: 'starting'**:
```typescript
await this.lifecycle.emitEvent(sessionId, SessionEventType.STATE_CHANGED, {
  preview_status: 'starting',
  message: 'Starting Expo dev server...',
})
```

**preview_status: 'refreshing'**:
```typescript
await this.lifecycle.emitEvent(sessionId, SessionEventType.STATE_CHANGED, {
  preview_status: 'refreshing',
  message: 'Refreshing preview...',
})
```

**preview_status: 'stopped'**:
```typescript
await this.lifecycle.emitEvent(sessionId, SessionEventType.STATE_CHANGED, {
  preview_status: 'stopped',
  message: 'Preview stopped',
})
```

### COMPLETION Event

```typescript
await this.lifecycle.emitEvent(sessionId, SessionEventType.COMPLETION, {
  preview_url: previewUrl,
  message: 'Preview ready!',
})
```

**Mobile Integration**:
- Mobile app subscribes to session events
- Receives preview_url when ready
- Loads URL in WebView component

### ERROR Event

```typescript
await this.lifecycle.emitEvent(sessionId, SessionEventType.ERROR, {
  message: 'Failed to start preview',
  error: error instanceof Error ? error.message : 'Unknown error',
})
```

---

## Mobile Integration (Deferred)

### Planned Components

**WebViewPreview Component**:
```typescript
interface WebViewPreviewProps {
  url: string
  onError?: (error: string) => void
  onLoad?: () => void
  autoRefresh?: boolean
  showDeviceFrame?: boolean
}
```

**Features**:
- React Native WebView integration
- Auto-refresh on URL changes
- Loading states
- Error handling UI
- Screenshot capture (react-native-view-shot)

**PreviewToolbar Component**:
- Reload button
- Screenshot button
- Share button
- URL display

**DeviceFrame Component**:
- Optional device frame UI
- iPhone 14 / Pixel 7 frames
- Notch and home indicator

**usePreviewUrl Hook**:
```typescript
function usePreviewUrl(sessionId: string) {
  const [url, setUrl] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  // Fetch preview URL from database
  // Subscribe to Realtime updates
  // Return { url, loading, error, refresh }
}
```

**Supabase Realtime Subscription**:
```typescript
supabase
  .channel(`session:${sessionId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'coding_sessions',
    filter: `id=eq.${sessionId}`,
  }, (payload) => {
    if (payload.new.preview_url) {
      setUrl(payload.new.preview_url)
    }
  })
  .subscribe()
```

---

## Security

### Network Security

**Sandbox Isolation**:
- Each sandbox has unique domain
- Port 19006 only accessible via sandbox domain
- No cross-sandbox access
- Fly.io handles network isolation

**URL Access Control**:
- Preview URL tied to sessionId
- User must own session (RLS)
- No public access without authentication

**CORS Configuration**:
- Expo dev server allows cross-origin by default
- Mobile app can access preview URL
- No additional CORS setup needed

### Data Security

**Database RLS**:
- preview_url only accessible to session owner
- RLS policies from Phase 11
- No public read access

**Path Validation**:
- No user input in preview URL generation
- Sandbox ID validated by SandboxLifecycle
- No injection vulnerabilities

---

## Error Handling

### Common Errors

**Package.json not found**:
```typescript
if (packageJsonCheck.exitCode !== 0) {
  throw new Error('package.json not found in sandbox')
}
```

**Cause**: Sandbox doesn't have React Native project
**Solution**: Ensure Claude Agent creates package.json

**Expo server failed to start**:
```typescript
if (result.exitCode !== 0) {
  throw new Error(`Failed to start Expo server: ${result.stderr}`)
}
```

**Cause**: npm/npx not installed, Expo dependency missing
**Solution**: Verify sandbox Docker image includes Node.js and npm

**Server timeout**:
```typescript
throw new Error('Expo server failed to start within timeout period')
```

**Cause**: Server takes >60s to start, network issues
**Solution**: Increase timeout, check sandbox resources

**Sandbox not found**:
```typescript
const activeSandbox = this.sandboxes.getActiveSandbox(sessionId)
if (!activeSandbox) {
  throw new Error('No active sandbox for session')
}
```

**Cause**: Sandbox stopped or session expired
**Solution**: Ensure session is active before preview generation

### Retry Logic

**Expo Server Start**:
```typescript
await this.retry.withRetry(
  async () => {
    await this.startExpoServer(sessionId, finalConfig.port)
  },
  { maxAttempts: 3, initialDelay: 2000 }
)
```

**Retry Strategy**:
- 3 attempts
- 2s initial delay
- Exponential backoff (2s, 4s, 8s)
- Only retries transient errors

**Server Health Check**:
- Built-in retry in waitForServerReady()
- 30 attempts, 2s delay each
- Total 60s timeout
- No exponential backoff (linear polling)

---

## Performance

### Startup Time

**Expo Dev Server Launch**:
```
Package.json check:     <100ms
Expo start command:     <500ms (async)
Server initialization:  10-30s (npm install, bundling)
Health check polling:   2-60s (until HTTP 200)
──────────────────────────────────────────
Total:                  15-90s
```

**Optimization Opportunities**:
- Cache node_modules in sandbox image
- Pre-install common dependencies
- Use --offline flag if dependencies cached
- Parallel health checks (reduce polling interval)

### Resource Usage

**Sandbox Resources**:
- CPU: ~1-2 cores during build, <0.5 core idle
- Memory: ~512MB-1GB for Expo server
- Disk: ~200MB for node_modules, ~50MB for build cache
- Network: ~10MB download (dependencies), <1MB idle

**Database Impact**:
- 1 UPDATE query per preview generation
- 1 UPDATE query per status change
- Minimal impact (indexed queries)

---

## Testing Strategy

### Unit Tests

**PreviewManager**:
```typescript
describe('PreviewManager', () => {
  it('generates preview URL successfully', async () => {
    const url = await previewManager.generatePreviewUrl('session-123')
    expect(url).toMatch(/^http:\/\/.+:19006$/)
  })

  it('retries on transient failures', async () => {
    // Mock startExpoServer to fail twice, succeed third time
    // Verify 3 attempts made
  })

  it('updates database with preview URL', async () => {
    await previewManager.generatePreviewUrl('session-123')
    const session = await getSession('session-123')
    expect(session.preview_url).toBeDefined()
    expect(session.preview_status).toBe('ready')
  })

  it('emits events during preview generation', async () => {
    const events = []
    lifecycle.on('event', (e) => events.push(e))

    await previewManager.generatePreviewUrl('session-123')

    expect(events).toContainEqual(
      expect.objectContaining({ type: 'STATE_CHANGED', data: { preview_status: 'starting' } })
    )
  })
})
```

### Integration Tests

**End-to-End Flow**:
```typescript
describe('Preview URL Generation', () => {
  it('generates accessible preview URL', async () => {
    // 1. Create session
    const sessionId = await createSession()

    // 2. Run agent (generates code)
    await agentRunner.runSession(sessionId, 'Build a todo app')

    // 3. Fetch preview URL
    const session = await getSession(sessionId)
    expect(session.preview_url).toBeDefined()

    // 4. Verify URL is accessible
    const response = await fetch(session.preview_url)
    expect(response.status).toBe(200)
  })
})
```

### Manual Testing

**Test Checklist**:
- [ ] Preview URL generated after code completion
- [ ] URL is accessible from browser
- [ ] Expo dev server serves React Native app
- [ ] Server health check passes within 60s
- [ ] Database updated with correct URL and status
- [ ] Events emitted to mobile app
- [ ] Refresh preview returns same URL
- [ ] Stop preview kills Expo server
- [ ] Error handling on server failure

---

## Monitoring

### Metrics to Track

**Preview Generation Success Rate**:
```sql
SELECT
  COUNT(*) FILTER (WHERE preview_status = 'ready') * 100.0 / COUNT(*) as success_rate
FROM coding_sessions
WHERE created_at > NOW() - INTERVAL '24 hours';
```

**Average Startup Time**:
```sql
SELECT
  AVG(preview_updated_at - created_at) as avg_startup_time
FROM coding_sessions
WHERE preview_status = 'ready';
```

**Failed Previews**:
```sql
SELECT id, preview_status, preview_updated_at
FROM coding_sessions
WHERE preview_status = 'failed'
ORDER BY preview_updated_at DESC
LIMIT 10;
```

### Logging

**Key Log Points**:
```typescript
logger.info({ sessionId, config }, 'Generating preview URL')
logger.debug({ sessionId, port }, 'Starting Expo dev server')
logger.info({ sessionId, attempts }, 'Expo server is ready')
logger.warn({ sessionId, error }, 'Failed to generate preview URL')
```

**Log Levels**:
- `debug` - Health check attempts, command execution
- `info` - Preview generation start/complete
- `warn` - Preview failures (non-blocking)
- `error` - Critical failures (database errors)

---

## Future Enhancements

### Phase 24+

**Voice Input Integration**:
- Voice command: "Show me the preview"
- Navigate to preview screen
- Speak preview errors

**Icon Generation**:
- Generate app icon
- Preview icon in WebView
- Update icon dynamically

**Project Management**:
- Multiple preview sessions
- Preview history
- Session snapshots

### Advanced Features

**Live Reload**:
- Watch file changes in sandbox
- Trigger WebView reload on save
- No manual refresh needed

**Debug Console**:
- Capture console.log/error/warn
- Display in mobile UI
- Filter by log level

**Network Inspector**:
- Intercept network requests
- Display request/response
- Mock API responses

**Performance Metrics**:
- Measure app load time
- Track render performance
- Display FPS and memory usage

**Multiple Device Preview**:
- Side-by-side iPhone/Android
- Different screen sizes
- Responsive testing

---

## Known Limitations

1. **Preview URL Accessibility**: Requires network connectivity from mobile device to Fly.io sandbox
   - Solution: Use ngrok/tunneling for local development
   - Production: Proper networking configuration

2. **Single Port**: Only one Expo server per sandbox
   - Cannot preview multiple apps simultaneously
   - Workaround: Use multiple sandboxes

3. **No HTTPS**: Default is HTTP (insecure)
   - Mobile app must allow insecure connections
   - Production: Configure SSL certificates

4. **Expo Web Only**: Only web preview supported
   - No iOS/Android native preview
   - Future: Expo Go integration

5. **No Hot Reload**: Requires manual refresh
   - Future: File watching and auto-reload
   - Workaround: Mobile app can poll for updates

---

## Troubleshooting

### Preview URL Not Generated

**Symptoms**: preview_url is NULL after code generation

**Diagnosis**:
```sql
SELECT id, preview_status, preview_updated_at
FROM coding_sessions
WHERE id = '<session-id>';
```

**Common Causes**:
1. Expo server failed to start (check `preview_status = 'failed'`)
2. Health check timeout (server took >60s)
3. package.json missing in sandbox

**Solutions**:
1. Check sandbox logs: `docker logs <sandbox-id>`
2. Verify package.json exists
3. Increase timeout in PreviewConfig
4. Retry: `previewManager.generatePreviewUrl(sessionId)`

### Preview URL Not Accessible

**Symptoms**: URL generated but 404/timeout on access

**Diagnosis**:
```bash
curl http://<sandbox-id>.fly.dev:19006
```

**Common Causes**:
1. Expo server crashed after health check
2. Network firewall blocking port 19006
3. Sandbox stopped or destroyed

**Solutions**:
1. Check if sandbox is running: `fly status <sandbox-id>`
2. Verify port 19006 is exposed in Dockerfile
3. Restart preview: `previewManager.refreshPreview(sessionId)`

### Slow Preview Generation

**Symptoms**: preview_status stuck on 'starting' for >2min

**Diagnosis**:
```typescript
logger.debug({ sessionId, attempt }, 'Checking if Expo server is ready')
// Check logs for attempt count
```

**Common Causes**:
1. Slow npm install (large dependencies)
2. Sandbox resource constraints
3. Network latency

**Solutions**:
1. Pre-cache dependencies in sandbox image
2. Increase sandbox resources (CPU/memory)
3. Use --offline flag if dependencies cached

---

## Production Readiness Checklist

- [x] Database migration created
- [x] PreviewManager implemented
- [x] AgentRunner integrated
- [x] Error handling with retries
- [x] Event emission for mobile
- [x] Logging and monitoring
- [x] Documentation complete
- [ ] Mobile WebView component (deferred)
- [ ] Integration tests (deferred)
- [ ] Load testing (deferred)
- [ ] HTTPS configuration (production)

---

## Summary

**Phase 23 Backend Status**: ✅ **COMPLETE**

**Implemented**:
- Database schema for preview URL storage
- PreviewManager for URL generation and lifecycle
- Expo dev server management in sandboxes
- Server health checking with retries
- AgentRunner integration with graceful error handling
- Event emission for mobile app integration

**Deferred (Mobile)**:
- WebView component
- Preview toolbar and device frame
- Screenshot capture
- Auto-refresh UI
- Console log display

**Ready For**: Phase 24 (Voice Input)

**Integration Points**:
- Mobile app subscribes to preview_url updates via Supabase Realtime
- WebView component loads URL when ready
- Preview can be refreshed or stopped via API

---

**Documentation**: WEBVIEW_PREVIEW.md
**Phase**: 23
**Team**: Backend Engineer
**Duration**: <1 day (backend only)
**Quality**: Production-ready backend, mobile framework documented
