# 21-error-handling-recovery.md
---
phase_id: 21
title: Error Handling & Recovery
duration_estimate: "2.5 days"
incremental_value: Robust error handling and session recovery
owners: [Backend Engineer, Mobile Engineer]
dependencies: [20]
linked_phases_forward: [22]
docs_referenced: [Architecture, Error Handling]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["Node.js error handling patterns", "React Native error boundaries", "Retry strategies with exponential backoff"]
    outputs: ["/docs/research/phase1/21/error-patterns.md"]
  - name: ContextCurator
    tool: context7
    scope: ["architecture.md error handling", "implementation.md resilience"]
    outputs: ["/docs/context/phase1/21-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate comprehensive error handling and recovery strategy"
    outputs: ["/docs/sequencing/phase1/21-error-steps.md"]
acceptance_criteria:
  - All error types categorized and handled appropriately
  - Retry logic with exponential backoff for transient errors
  - User-facing error messages clear and actionable
  - Session state preserved on recoverable errors
  - Rollback mechanisms for failed operations
  - Error events tracked in database
---

## Objectives

1. **Error Categorization** - Define error types and handling strategies
2. **Retry Mechanisms** - Implement exponential backoff for transient failures
3. **User Communication** - Provide clear, actionable error messages

## Scope

### In
- Error type definitions (transient, permanent, user, system)
- Retry strategies with exponential backoff
- Error boundaries in mobile app
- Rollback mechanisms for failed jobs
- User-facing error notifications
- Error event persistence and tracking

### Out
- Complex distributed transaction rollback (Phase 22+)
- Advanced error analytics/monitoring (Phase 22+)
- Automatic bug reporting (defer to production phase)

## Tasks

- [ ] **Use context7**, **websearch**, **sequentialthinking** per template

- [ ] **Define Error Types** (`backend/worker/src/errors/types.ts`):
  ```typescript
  export enum ErrorCategory {
    TRANSIENT = 'transient',     // Retry automatically
    PERMANENT = 'permanent',     // Don't retry, report to user
    USER_ERROR = 'user_error',   // User action needed
    SYSTEM_ERROR = 'system_error' // System issue, alert ops
  }

  export interface AppError {
    category: ErrorCategory
    code: string
    message: string
    userMessage: string
    retryable: boolean
    details?: any
  }

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

- [ ] **Create Error Catalog** (`backend/worker/src/errors/catalog.ts`):
  ```typescript
  import { MobVibeError, ErrorCategory } from './types'

  export const ErrorCatalog = {
    // Transient errors
    SANDBOX_CREATION_FAILED: () =>
      new MobVibeError(
        ErrorCategory.TRANSIENT,
        'SANDBOX_CREATE_FAILED',
        'Failed to create sandbox',
        'Unable to start coding environment. Retrying...',
        true
      ),

    CLAUDE_API_RATE_LIMIT: () =>
      new MobVibeError(
        ErrorCategory.TRANSIENT,
        'CLAUDE_RATE_LIMIT',
        'Claude API rate limit hit',
        'AI service temporarily busy. Retrying...',
        true
      ),

    SUPABASE_CONNECTION_FAILED: () =>
      new MobVibeError(
        ErrorCategory.TRANSIENT,
        'DB_CONNECTION_FAILED',
        'Database connection failed',
        'Connection issue. Retrying...',
        true
      ),

    // Permanent errors
    CLAUDE_API_AUTH_FAILED: () =>
      new MobVibeError(
        ErrorCategory.PERMANENT,
        'CLAUDE_AUTH_FAILED',
        'Claude API authentication failed',
        'AI service unavailable. Please contact support.',
        false
      ),

    SANDBOX_TIMEOUT: () =>
      new MobVibeError(
        ErrorCategory.PERMANENT,
        'SANDBOX_TIMEOUT',
        'Sandbox execution timeout',
        'Operation took too long and was cancelled.',
        false
      ),

    // User errors
    INVALID_PROMPT: () =>
      new MobVibeError(
        ErrorCategory.USER_ERROR,
        'INVALID_PROMPT',
        'Invalid prompt provided',
        'Please provide a clear description of what you want to build.',
        false
      ),

    INSUFFICIENT_CREDITS: () =>
      new MobVibeError(
        ErrorCategory.USER_ERROR,
        'INSUFFICIENT_CREDITS',
        'User has insufficient credits',
        'Not enough credits. Please add more to continue.',
        false
      ),

    // System errors
    WORKER_CRASH: () =>
      new MobVibeError(
        ErrorCategory.SYSTEM_ERROR,
        'WORKER_CRASH',
        'Worker process crashed',
        'Internal error occurred. Our team has been notified.',
        false
      ),
  }
  ```

- [ ] **Create Retry Manager** (`backend/worker/src/errors/RetryManager.ts`):
  ```typescript
  import { logger } from '../utils/logger'
  import { MobVibeError } from './types'

  interface RetryConfig {
    maxAttempts: number
    initialDelay: number
    maxDelay: number
    backoffMultiplier: number
  }

  const DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  }

  export class RetryManager {
    async withRetry<T>(
      operation: () => Promise<T>,
      config: Partial<RetryConfig> = {}
    ): Promise<T> {
      const finalConfig = { ...DEFAULT_CONFIG, ...config }
      let lastError: Error

      for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
        try {
          logger.debug({ attempt }, 'Attempting operation')
          return await operation()
        } catch (error) {
          lastError = error as Error

          // Check if error is retryable
          if (error instanceof MobVibeError && !error.retryable) {
            logger.warn({ error: error.toJSON() }, 'Non-retryable error, aborting')
            throw error
          }

          // Last attempt failed
          if (attempt === finalConfig.maxAttempts) {
            logger.error({ error, attempt }, 'All retry attempts failed')
            break
          }

          // Calculate delay with exponential backoff
          const delay = Math.min(
            finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
            finalConfig.maxDelay
          )

          logger.warn({ error, attempt, nextDelay: delay }, 'Operation failed, retrying')

          await this.sleep(delay)
        }
      }

      throw lastError!
    }

    private sleep(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms))
    }
  }
  ```

- [ ] **Create Error Handler** (`backend/worker/src/errors/ErrorHandler.ts`):
  ```typescript
  import { EventEmitter } from '../events/EventEmitter'
  import { logger } from '../utils/logger'
  import { MobVibeError, ErrorCategory } from './types'

  export class ErrorHandler {
    private events: EventEmitter

    constructor(events: EventEmitter) {
      this.events = events
    }

    async handleError(sessionId: string, error: Error) {
      logger.error({ sessionId, error }, 'Handling error')

      let mobvibeError: MobVibeError

      if (error instanceof MobVibeError) {
        mobvibeError = error
      } else {
        // Wrap unknown errors
        mobvibeError = new MobVibeError(
          ErrorCategory.SYSTEM_ERROR,
          'UNKNOWN_ERROR',
          error.message,
          'An unexpected error occurred. Please try again.',
          false,
          { stack: error.stack }
        )
      }

      // Emit error event to user
      await this.events.emit(sessionId, {
        type: 'error',
        data: {
          code: mobvibeError.code,
          message: mobvibeError.userMessage,
          retryable: mobvibeError.retryable,
        },
      })

      // Log to monitoring (future: send to error tracking service)
      if (mobvibeError.category === ErrorCategory.SYSTEM_ERROR) {
        logger.error({ error: mobvibeError.toJSON() }, 'System error detected')
        // TODO: Alert operations team
      }

      return mobvibeError
    }
  }
  ```

- [ ] **Update JobProcessor with Error Handling**:
  ```typescript
  // src/JobProcessor.ts (updated)
  import { RetryManager } from './errors/RetryManager'
  import { ErrorHandler } from './errors/ErrorHandler'
  import { ErrorCatalog } from './errors/catalog'

  export class JobProcessor {
    private retry: RetryManager
    private errorHandler: ErrorHandler

    constructor() {
      this.queue = new JobQueue()
      this.sandboxes = new SandboxLifecycle()
      this.agent = new AgentRunner(this.sandboxes)
      this.retry = new RetryManager()
      this.errorHandler = new ErrorHandler(this.agent.events)
    }

    private async processJob(job: any) {
      try {
        // Create sandbox with retry
        await this.retry.withRetry(
          async () => {
            try {
              await this.sandboxes.startSandbox(job.session_id)
            } catch (error) {
              throw ErrorCatalog.SANDBOX_CREATION_FAILED()
            }
          },
          { maxAttempts: 3 }
        )

        // Run agent with retry on transient failures
        await this.retry.withRetry(
          async () => {
            await this.agent.runSession(job.session_id, job.prompt)
          },
          { maxAttempts: 2 }
        )

        await this.queue.completeJob(job.job_id)
      } catch (error) {
        // Handle error gracefully
        const mobvibeError = await this.errorHandler.handleError(
          job.session_id,
          error as Error
        )

        await this.queue.failJob(job.job_id, mobvibeError.code)
      } finally {
        // Cleanup sandbox
        await this.sandboxes.stopSandbox(job.session_id).catch(err => {
          logger.error({ err, sessionId: job.session_id }, 'Sandbox cleanup failed')
        })
      }
    }
  }
  ```

- [ ] **Create Error Boundary** (`mobile/src/components/ErrorBoundary.tsx`):
  ```typescript
  import React from 'react'
  import { View, Text, TouchableOpacity } from 'react-native'

  interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
  }

  export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
  > {
    constructor(props: any) {
      super(props)
      this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('ErrorBoundary caught:', error, errorInfo)
      // TODO: Send to error tracking service
    }

    render() {
      if (this.state.hasError) {
        return (
          <View className="flex-1 items-center justify-center p-6 bg-gray-50">
            <Text className="text-2xl font-bold text-red-600 mb-4">
              Oops! Something went wrong
            </Text>

            <Text className="text-gray-600 text-center mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>

            <TouchableOpacity
              onPress={() => this.setState({ hasError: false })}
              className="bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-medium">Try Again</Text>
            </TouchableOpacity>
          </View>
        )
      }

      return this.props.children
    }
  }
  ```

- [ ] **Create Error Alert Component** (`mobile/src/components/ErrorAlert.tsx`):
  ```typescript
  import { View, Text, TouchableOpacity } from 'react-native'

  interface ErrorAlertProps {
    code: string
    message: string
    retryable: boolean
    onRetry?: () => void
    onDismiss: () => void
  }

  export function ErrorAlert({
    code,
    message,
    retryable,
    onRetry,
    onDismiss,
  }: ErrorAlertProps) {
    return (
      <View className="absolute top-20 left-4 right-4 bg-red-500 rounded-lg p-4 shadow-lg">
        <Text className="text-white font-bold mb-2">Error: {code}</Text>
        <Text className="text-white mb-4">{message}</Text>

        <View className="flex-row gap-2">
          {retryable && onRetry && (
            <TouchableOpacity
              onPress={onRetry}
              className="flex-1 bg-white rounded py-2"
            >
              <Text className="text-red-500 font-medium text-center">
                Retry
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onDismiss}
            className="flex-1 bg-red-700 rounded py-2"
          >
            <Text className="text-white font-medium text-center">
              Dismiss
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  ```

- [ ] **Update SessionScreen with Error Handling**:
  ```typescript
  // mobile/src/screens/SessionScreen.tsx (updated)
  import { ErrorAlert } from '../components/ErrorAlert'

  export default function SessionScreen({ route }) {
    const { sessionId } = route.params
    const [error, setError] = useState<any>(null)

    useEffect(() => {
      const unsubscribe = realtimeService.subscribe(sessionId, (event) => {
        if (event.type === 'error') {
          setError(event.data)

          // Auto-dismiss after 10 seconds if not retryable
          if (!event.data.retryable) {
            setTimeout(() => setError(null), 10000)
          }
        }
      })

      return unsubscribe
    }, [sessionId])

    const handleRetry = async () => {
      setError(null)
      // Trigger job retry via API
      await retrySession(sessionId)
    }

    return (
      <View className="flex-1">
        {error && (
          <ErrorAlert
            code={error.code}
            message={error.message}
            retryable={error.retryable}
            onRetry={error.retryable ? handleRetry : undefined}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Rest of UI */}
      </View>
    )
  }
  ```

- [ ] **Add Session State Preservation**:
  ```typescript
  // backend/worker/src/session/StateManager.ts
  export class SessionStateManager {
    async saveState(sessionId: string, state: any) {
      // Save session state to database
      await supabase
        .from('coding_sessions')
        .update({
          state_snapshot: state,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
    }

    async restoreState(sessionId: string) {
      const { data } = await supabase
        .from('coding_sessions')
        .select('state_snapshot')
        .eq('id', sessionId)
        .single()

      return data?.state_snapshot
    }
  }
  ```

- [ ] **Test Error Handling**:
  ```typescript
  // tests/backend/error-handling.test.ts
  describe('Error Handling', () => {
    it('retries transient errors', async () => {
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

- [ ] **Document Error System**: Create `docs/backend/ERROR_HANDLING.md`

- [ ] **Update links-map**

## Artifacts & Paths

**Backend:**
- `backend/worker/src/errors/types.ts`
- `backend/worker/src/errors/catalog.ts`
- `backend/worker/src/errors/RetryManager.ts`
- `backend/worker/src/errors/ErrorHandler.ts`
- `backend/worker/src/session/StateManager.ts`

**Mobile:**
- `mobile/src/components/ErrorBoundary.tsx`
- `mobile/src/components/ErrorAlert.tsx`

**Tests:**
- `tests/backend/error-handling.test.ts`

**Docs:**
- `docs/backend/ERROR_HANDLING.md` ⭐

## Testing

### Phase-Only Tests
- Transient errors retry with exponential backoff
- Permanent errors don't retry
- User errors show actionable messages
- Error events emit to mobile
- Error boundary catches React errors
- Session state preserved on recoverable errors

### Cross-Phase Compatibility
- All previous phases benefit from error handling
- Future phases will extend error catalog

### Test Commands
```bash
# Backend tests
npm test -- tests/backend/error-handling.test.ts

# Manual tests:
# 1. Simulate API rate limit
# 2. Kill sandbox mid-execution
# 3. Disconnect network during job
# 4. Verify retry logic and user notifications
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| Infinite retry loops | Resource exhaustion | Max attempts limit, exponential backoff with max delay |
| Error message leaks sensitive info | Security | Separate user messages from internal logs, sanitize errors |
| Cascading failures | System-wide outage | Circuit breaker pattern (Phase 22+), isolate services |
| State corruption | Data loss | Atomic operations, transaction rollback, state snapshots |

## References

- [Architecture](./../../../../.docs/architecture.md) - Error handling architecture
- [Phase 20](./20-terminal-output-streaming.md) - Terminal output

## Handover

**Next Phase:** Phase 22 (TBD) - Advanced features build on robust error foundation

**Required Inputs Provided to Future Phases:**
- Comprehensive error handling system
- Retry mechanisms for transient failures
- Error event streaming to mobile
- Session state preservation

---

**Status:** Ready after Phase 20
**Estimated Time:** 2.5 days
**Blocking Issues:** None
