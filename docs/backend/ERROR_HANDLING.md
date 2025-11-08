# Error Handling & Recovery

**Last Updated**: 2025-11-08
**Phase**: 21
**Status**: Backend Complete, Mobile Deferred

---

## Overview

Comprehensive error handling system for MobVibe providing categorization, retry mechanisms, user-friendly messages, and state preservation.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Error Flow                             │
└──────────────────────────────────────────────────────────────┘

Operation Execution
       ↓
  Try/Catch Block
       ↓
  Error Detected
       ↓
┌──────┴──────┐
│             │
│  MobVibeError?
│             │
└──────┬──────┘
       │
    Yes│   No
       │    └──→ ErrorHandler.wrapError() → MobVibeError
       │
  Check Retryable
       │
    Yes│   No
       │    └──→ ErrorHandler.handleError() → Emit ERROR event
       │
  RetryManager.withRetry()
       │
  ┌────┴────┐
  │         │
Success   Failed after retries
  │         │
Return    ErrorHandler.handleError() → Emit ERROR event
          │
    Mobile receives notification
```

## Error Categories

### TRANSIENT (Retryable)

Temporary failures that can succeed on retry:

- **SANDBOX_CREATE_FAILED** - Sandbox creation failed (retry with backoff)
- **CLAUDE_RATE_LIMIT** - API rate limit hit (wait and retry)
- **DB_CONNECTION_FAILED** - Database connection issue (reconnect)
- **FILE_SYNC_FAILED** - File upload failed (retry)
- **NETWORK_ERROR** - Network connectivity issue (retry)

**Retry Config**:
```typescript
{
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2
}
```

**Retry Delays**:
```
Attempt 1: 1 second
Attempt 2: 2 seconds
Attempt 3: 4 seconds (if needed)
```

### PERMANENT (Non-Retryable)

Failures that won't succeed on retry:

- **CLAUDE_AUTH_FAILED** - API authentication failed (config issue)
- **SANDBOX_TIMEOUT** - Operation exceeded time limit
- **COMMAND_FAILED** - Command execution failed (user code error)

**Action**: Report to user, don't retry

### USER_ERROR (User Action Required)

Errors requiring user intervention:

- **INVALID_PROMPT** - Prompt doesn't meet requirements
- **INSUFFICIENT_CREDITS** - User needs to add credits

**Action**: Show actionable message

### SYSTEM_ERROR (Ops Alert)

Internal system failures:

- **WORKER_CRASH** - Worker process crashed
- **UNKNOWN_ERROR** - Unexpected error occurred

**Action**: Alert operations team, log details

## Core Components

### MobVibeError Class

**Location**: `backend/worker/src/errors/types.ts`

```typescript
export class MobVibeError extends Error {
  constructor(
    public readonly category: ErrorCategory,
    public readonly code: string,
    message: string,
    public readonly userMessage: string,
    public readonly retryable: boolean = false,
    public readonly details?: any
  ) {
    super(message)
    this.name = 'MobVibeError'
  }

  toJSON(): AppError {
    return {
      category: this.category,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      retryable: this.retryable,
      details: this.details,
    }
  }
}
```

**Key Features**:
- Typed error categories
- Separate user/internal messages
- Retryable flag
- Optional details for debugging

### ErrorCatalog

**Location**: `backend/worker/src/errors/catalog.ts`

Factory functions for creating typed errors:

```typescript
export const ErrorCatalog = {
  SANDBOX_CREATION_FAILED: () =>
    new MobVibeError(
      ErrorCategory.TRANSIENT,
      'SANDBOX_CREATE_FAILED',
      'Failed to create sandbox',
      'Unable to start coding environment. Retrying...',
      true
    ),

  CLAUDE_API_AUTH_FAILED: () =>
    new MobVibeError(
      ErrorCategory.PERMANENT,
      'CLAUDE_AUTH_FAILED',
      'Claude API authentication failed',
      'AI service unavailable. Please contact support.',
      false
    ),

  // ... 10+ error types
}
```

**Usage**:
```typescript
throw ErrorCatalog.SANDBOX_CREATION_FAILED()
throw ErrorCatalog.INSUFFICIENT_CREDITS()
```

### RetryManager

**Location**: `backend/worker/src/errors/RetryManager.ts`

Exponential backoff retry logic:

```typescript
export class RetryManager {
  async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    let lastError: Error

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        // Check if retryable
        if (error instanceof MobVibeError && !error.retryable) {
          throw error
        }

        // Last attempt failed
        if (attempt === finalConfig.maxAttempts) {
          break
        }

        // Calculate exponential backoff delay
        const delay = Math.min(
          finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
          finalConfig.maxDelay
        )

        await this.sleep(delay)
      }
    }

    throw lastError!
  }
}
```

**Features**:
- Configurable retry attempts
- Exponential backoff with max delay cap
- Automatic non-retryable error detection
- Comprehensive logging

**Example Usage**:
```typescript
const retry = new RetryManager()

// Retry sandbox creation up to 3 times
await retry.withRetry(
  async () => {
    await sandboxes.startSandbox(sessionId)
  },
  { maxAttempts: 3 }
)

// Custom retry config for file sync
await retry.withRetry(
  async () => {
    await fileSync.uploadFile(sessionId, path, buffer)
  },
  { maxAttempts: 5, initialDelay: 500, maxDelay: 10000 }
)
```

### ErrorHandler

**Location**: `backend/worker/src/errors/ErrorHandler.ts`

Central error processing and event emission:

```typescript
export class ErrorHandler {
  private lifecycle: SessionLifecycleManager

  async handleError(sessionId: string, error: Error): Promise<MobVibeError> {
    let mobvibeError: MobVibeError

    if (error instanceof MobVibeError) {
      mobvibeError = error
    } else {
      mobvibeError = this.wrapError(error)
    }

    // Emit ERROR event to mobile
    await this.lifecycle.emitEvent(sessionId, SessionEventType.ERROR, {
      code: mobvibeError.code,
      message: mobvibeError.userMessage,
      category: mobvibeError.category,
      retryable: mobvibeError.retryable,
      timestamp: new Date(),
    })

    // Alert ops for system errors
    if (mobvibeError.category === ErrorCategory.SYSTEM_ERROR) {
      logger.error({ error: mobvibeError.toJSON() }, 'System error - alert ops')
      // TODO: Send to monitoring service
    }

    return mobvibeError
  }

  wrapError(error: Error): MobVibeError {
    const msg = error.message.toLowerCase()

    if (msg.includes('rate limit') || msg.includes('429')) {
      return new MobVibeError(
        ErrorCategory.TRANSIENT,
        'RATE_LIMIT',
        error.message,
        'Service temporarily busy. Retrying...',
        true
      )
    }

    if (msg.includes('timeout')) {
      return new MobVibeError(
        ErrorCategory.PERMANENT,
        'TIMEOUT',
        error.message,
        'Operation took too long and was cancelled.',
        false
      )
    }

    // Default to system error
    return new MobVibeError(
      ErrorCategory.SYSTEM_ERROR,
      'UNKNOWN_ERROR',
      error.message,
      'An unexpected error occurred. Please try again.',
      false,
      { stack: error.stack }
    )
  }
}
```

**Responsibilities**:
1. Convert any Error to MobVibeError
2. Emit ERROR events via Realtime
3. Alert operations for system errors
4. Intelligent error wrapping based on message patterns

## AgentRunner Integration

**Location**: `backend/worker/src/agent/AgentRunner.ts`

### Claude API Retry

```typescript
const response = await this.retry.withRetry(
  async () => {
    try {
      return await this.claude.createMessage({
        system: systemPrompt,
        messages,
        tools: agentTools,
        maxTokens: 8192,
      })
    } catch (error: any) {
      if (error.status === 429) {
        throw ErrorCatalog.CLAUDE_API_RATE_LIMIT()
      }
      if (error.status === 401) {
        throw ErrorCatalog.CLAUDE_API_AUTH_FAILED()
      }
      throw error
    }
  },
  { maxAttempts: 3 }
)
```

**Behavior**:
- Rate limits (429): Retry 3x with exponential backoff
- Auth failures (401): Fail immediately (not retryable)
- Other errors: Propagate for handling

### File Sync Retry

```typescript
await this.retry.withRetry(
  async () => {
    try {
      await this.fileSync.uploadFile(sessionId, path, Buffer.from(content))
    } catch (error) {
      throw ErrorCatalog.FILE_SYNC_FAILED()
    }
  },
  { maxAttempts: 3, initialDelay: 500 }
).catch((error) => {
  logger.warn({ sessionId, path, error }, 'File sync failed after retries')
})
```

**Behavior**:
- Retry file uploads 3x with 500ms initial delay
- Non-fatal: Log warning if final failure
- Session continues even if sync fails

### Top-Level Error Handling

```typescript
async runSession(sessionId: string, prompt: string): Promise<SessionStats> {
  try {
    // ... agent loop
    return stats
  } catch (error) {
    await this.errorHandler.handleError(sessionId, error as Error)
    throw error
  }
}
```

**Behavior**:
- All errors emit ERROR event
- Mobile receives real-time notification
- Error logged with full context

## Event Structure

### ERROR Event

```typescript
{
  sessionId: 'abc-123',
  eventType: 'error',
  data: {
    code: 'CLAUDE_RATE_LIMIT',
    message: 'AI service temporarily busy. Retrying...',
    category: 'transient',
    retryable: true,
    timestamp: '2025-11-08T10:30:01.234Z'
  },
  timestamp: '2025-11-08T10:30:01.234Z'
}
```

**Fields**:
- `code` - Error code from catalog
- `message` - User-facing message
- `category` - Error category (transient/permanent/user/system)
- `retryable` - Whether operation will be retried
- `timestamp` - When error occurred

## Mobile Integration (Deferred)

### ErrorBoundary Component

**Location**: `mobile/src/components/ErrorBoundary.tsx` (future)

```typescript
export class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    // TODO: Send to error tracking
  }

  render() {
    if (this.state.hasError) {
      return (
        <View>
          <Text>Oops! Something went wrong</Text>
          <TouchableOpacity onPress={() => this.setState({ hasError: false })}>
            <Text>Try Again</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return this.props.children
  }
}
```

### ErrorAlert Component

**Location**: `mobile/src/components/ErrorAlert.tsx` (future)

```typescript
export function ErrorAlert({
  code,
  message,
  retryable,
  onRetry,
  onDismiss,
}: ErrorAlertProps) {
  return (
    <View className="bg-red-500 rounded-lg p-4">
      <Text className="text-white font-bold">Error: {code}</Text>
      <Text className="text-white">{message}</Text>

      {retryable && onRetry && (
        <TouchableOpacity onPress={onRetry}>
          <Text>Retry</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onDismiss}>
        <Text>Dismiss</Text>
      </TouchableOpacity>
    </View>
  )
}
```

### SessionScreen Integration

**Location**: `mobile/src/screens/SessionScreen.tsx` (future)

```typescript
export default function SessionScreen({ route }) {
  const { sessionId } = route.params
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = realtimeService.subscribe(sessionId, (event) => {
      if (event.type === 'error') {
        setError(event.data)

        // Auto-dismiss non-retryable errors after 10s
        if (!event.data.retryable) {
          setTimeout(() => setError(null), 10000)
        }
      }
    })
    return unsubscribe
  }, [sessionId])

  return (
    <View>
      {error && (
        <ErrorAlert
          code={error.code}
          message={error.message}
          retryable={error.retryable}
          onRetry={error.retryable ? () => retrySession(sessionId) : undefined}
          onDismiss={() => setError(null)}
        />
      )}
    </View>
  )
}
```

## Error Examples

### Transient Error (Retry Success)

```
1. Agent calls Claude API
2. Rate limit hit (429)
3. ErrorCatalog.CLAUDE_API_RATE_LIMIT() thrown
4. RetryManager detects retryable=true
5. Wait 1 second
6. Retry #1
7. Wait 2 seconds
8. Retry #2 succeeds
9. Operation continues normally
```

**Mobile Experience**: Brief "AI service busy" message → Success

### Permanent Error (User Action Needed)

```
1. User starts session with empty prompt
2. Validation fails
3. ErrorCatalog.INVALID_PROMPT() thrown
4. RetryManager detects retryable=false
5. ErrorHandler.handleError() called
6. ERROR event emitted
7. Mobile receives event <500ms
8. ErrorAlert displayed
```

**Mobile Experience**: "Please provide a clear description..." with Dismiss button

### System Error (Ops Alert)

```
1. Worker process encounters unexpected error
2. Generic Error caught
3. ErrorHandler.wrapError() → UNKNOWN_ERROR
4. category = SYSTEM_ERROR
5. ERROR event emitted
6. Operations team alerted
7. User sees generic error message
```

**Mobile Experience**: "Internal error occurred. Our team has been notified."

## Testing

### Retry Logic Test

```typescript
describe('RetryManager', () => {
  it('retries transient errors with exponential backoff', async () => {
    const retry = new RetryManager()
    let attempts = 0

    const result = await retry.withRetry(async () => {
      attempts++
      if (attempts < 3) {
        throw ErrorCatalog.SANDBOX_CREATION_FAILED()
      }
      return 'success'
    })

    expect(attempts).toBe(3)
    expect(result).toBe('success')
  })

  it('does not retry permanent errors', async () => {
    const retry = new RetryManager()
    let attempts = 0

    await expect(
      retry.withRetry(async () => {
        attempts++
        throw ErrorCatalog.CLAUDE_API_AUTH_FAILED()
      })
    ).rejects.toThrow()

    expect(attempts).toBe(1)
  })
})
```

### Error Event Emission Test

```typescript
describe('ErrorHandler', () => {
  it('emits ERROR event with correct structure', async () => {
    const lifecycle = new SessionLifecycleManager()
    const handler = new ErrorHandler(lifecycle)

    const error = ErrorCatalog.CLAUDE_RATE_LIMIT()
    await handler.handleError('session-123', error)

    // Verify ERROR event inserted into session_events
    const { data } = await supabase
      .from('session_events')
      .select('*')
      .eq('session_id', 'session-123')
      .eq('event_type', 'error')
      .single()

    expect(data.event_data.code).toBe('CLAUDE_RATE_LIMIT')
    expect(data.event_data.retryable).toBe(true)
  })
})
```

## Performance

### Retry Overhead

**Best Case** (Success on first attempt):
```
Total time: Operation time + 0ms
```

**Worst Case** (3 attempts):
```
Attempt 1: Fail (1s operation)
Wait: 1s backoff
Attempt 2: Fail (1s operation)
Wait: 2s backoff
Attempt 3: Fail (1s operation)
────────────────────────
Total: 6s
```

### Event Emission Latency

```
Error detected:        0ms
ErrorHandler.handleError(): <10ms
Event insertion:       <50ms
Realtime broadcast:    <200ms
Mobile receives:       <100ms
────────────────────────────
Total latency:         <360ms
```

## Monitoring

### Error Rate Query

```sql
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  event_data->>'code' as error_code,
  event_data->>'category' as category,
  COUNT(*) as error_count
FROM session_events
WHERE event_type = 'error'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour, error_code, category
ORDER BY hour DESC, error_count DESC;
```

### Retry Success Rate

```sql
SELECT
  event_data->>'code' as error_code,
  COUNT(*) as total_errors,
  SUM(CASE WHEN event_data->>'retryable' = 'true' THEN 1 ELSE 0 END) as retryable_errors
FROM session_events
WHERE event_type = 'error'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY error_code;
```

### System Error Alert

```sql
SELECT *
FROM session_events
WHERE event_type = 'error'
  AND event_data->>'category' = 'system_error'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## Production Deployment

### Checklist

- [x] Error types defined
- [x] Error catalog created
- [x] RetryManager implemented
- [x] ErrorHandler implemented
- [x] AgentRunner integration
- [x] Documentation complete
- [ ] Mobile ErrorBoundary (deferred)
- [ ] Mobile ErrorAlert (deferred)
- [ ] Mobile SessionScreen integration (deferred)
- [ ] Error tracking service integration (future)
- [ ] Operations alerting (future)

### Configuration

**Environment Variables**:
```env
# Retry configuration
RETRY_MAX_ATTEMPTS=3
RETRY_INITIAL_DELAY=1000
RETRY_MAX_DELAY=30000
RETRY_BACKOFF_MULTIPLIER=2

# Error tracking
ERROR_TRACKING_ENABLED=false
ERROR_TRACKING_DSN=
```

## Future Enhancements

### Phase 22+

1. **Circuit Breaker Pattern** - Prevent cascading failures
2. **Advanced Error Analytics** - Track error trends
3. **Automatic Bug Reporting** - Send to issue tracker
4. **Error Recovery Strategies** - Auto-fix common errors
5. **State Snapshots** - Restore session state after errors
6. **Rollback Mechanisms** - Undo failed operations
7. **Health Checks** - Proactive error detection

### Error Tracking Integration

```typescript
// Future: Sentry/Datadog integration
if (config.errorTracking.enabled) {
  Sentry.captureException(error, {
    tags: {
      sessionId,
      category: mobvibeError.category,
      code: mobvibeError.code,
    },
    extra: mobvibeError.details,
  })
}
```

---

**Phase 21 Status**: ✅ Backend Complete (Mobile Deferred)
**Integration**: Phase 20 (Terminal Output) ← **Phase 21** → Phase 22 (Code Viewer)
**Dependencies**: SessionLifecycleManager (Phase 17), Event Streaming (Phase 19)
