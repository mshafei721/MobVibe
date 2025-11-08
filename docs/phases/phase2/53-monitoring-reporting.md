# 53-monitoring-reporting.md
---
phase_id: 53
title: Performance Monitoring & Error Reporting
duration_estimate: "2 days"
incremental_value: Real-time performance metrics and error tracking for production stability
owners: [Backend Engineer, DevOps, Frontend Engineer]
dependencies: [52]
linked_phases_forward: [54]
docs_referenced: [Architecture, Implementation]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["Sentry React Native setup", "Performance monitoring tools 2025", "Error tracking best practices"]
    outputs: ["/docs/research/phase2/53/monitoring-tools.md"]
  - name: ContextCurator
    tool: context7
    scope: ["Sentry documentation", "React Native performance monitoring"]
    outputs: ["/docs/context/phase2/53-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for implementing comprehensive monitoring and error tracking"
    outputs: ["/docs/sequencing/phase2/53-monitoring-steps.md"]
acceptance_criteria:
  - Sentry integrated for error tracking
  - Performance metrics dashboard shows key metrics
  - Real-time alerting for critical errors
  - Error tracking captures context (user, session, device)
  - Performance data tracked (startup, API latency, render times)
  - Source maps uploaded for stack traces
  - Error grouping and deduplication works
---

## Objectives

1. **Error Tracking** - Capture and report all errors with context
2. **Performance Monitoring** - Track key metrics (startup, API, render)
3. **Real-Time Alerts** - Notify team of critical issues

## Scope

### In
- Sentry integration (errors + performance)
- Error context capture (user, device, session)
- Performance metrics tracking
- Source map upload automation
- Real-time alerting setup
- Error grouping and deduplication
- Custom performance metrics
- Backend error monitoring

### Out
- Custom analytics platform (use existing)
- APM for backend services (later phase)
- Custom crash reporting
- Session replay (Sentry paid feature)

## Tasks

- [ ] **Use websearch** to research monitoring tools
- [ ] **Use context7** to compile Sentry documentation
- [ ] **Use sequentialthinking** to plan implementation

- [ ] **Create Sentry Account**:
  - Sign up at sentry.io
  - Create project: "MobVibe Mobile"
  - Create project: "MobVibe Backend"
  - Note DSN keys for both

- [ ] **Install Sentry SDK** (Mobile):
  ```bash
  cd app
  npx expo install @sentry/react-native
  ```

- [ ] **Configure Sentry** (`app/sentry.config.ts`):
  ```typescript
  import * as Sentry from '@sentry/react-native'
  import Constants from 'expo-constants'

  export function initializeSentry() {
    Sentry.init({
      dsn: Constants.expoConfig?.extra?.sentryDsn,
      environment: __DEV__ ? 'development' : 'production',
      enabled: !__DEV__, // Only in production

      // Performance Monitoring
      tracesSampleRate: 1.0, // 100% in dev, reduce in prod
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,

      // Error Handling
      attachStacktrace: true,
      enableNative: true,
      enableNativeCrashHandling: true,

      // Context
      beforeSend(event, hint) {
        // Filter out development errors
        if (__DEV__) return null

        // Add custom context
        event.tags = {
          ...event.tags,
          app_version: Constants.expoConfig?.version,
          platform: Constants.platform?.ios ? 'ios' : 'android',
        }

        return event
      },

      // Performance
      integrations: [
        new Sentry.ReactNativeTracing({
          tracingOrigins: ['localhost', /^\//],
          routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        }),
      ],
    })
  }
  ```

- [ ] **Initialize Sentry** (`app/_layout.tsx`):
  ```typescript
  import { initializeSentry } from './sentry.config'
  import * as Sentry from '@sentry/react-native'

  // Initialize Sentry before React renders
  initializeSentry()

  function RootLayout() {
    // ... existing layout
  }

  export default Sentry.wrap(RootLayout)
  ```

- [ ] **Add Sentry DSN to app.config.js**:
  ```javascript
  export default {
    // ... existing config
    extra: {
      sentryDsn: process.env.SENTRY_DSN_MOBILE,
      // ... other config
    },
  }
  ```

- [ ] **Create Error Boundary** (`app/components/ErrorBoundary.tsx`):
  ```typescript
  import React from 'react'
  import { View, Text, TouchableOpacity } from 'react-native'
  import * as Sentry from '@sentry/react-native'

  interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
  }

  export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
  > {
    state: ErrorBoundaryState = {
      hasError: false,
      error: null,
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
      return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }

    handleReset = () => {
      this.setState({ hasError: false, error: null })
    }

    render() {
      if (this.state.hasError) {
        return (
          <View className="flex-1 justify-center items-center p-6 bg-white dark:bg-gray-900">
            <Text className="text-2xl font-bold mb-4 dark:text-white">
              Oops! Something went wrong
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              We've been notified and are looking into it.
            </Text>
            <TouchableOpacity
              onPress={this.handleReset}
              className="bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        )
      }

      return this.props.children
    }
  }
  ```

- [ ] **Create Performance Monitoring Service** (`app/lib/monitoring/PerformanceMonitor.ts`):
  ```typescript
  import * as Sentry from '@sentry/react-native'

  class PerformanceMonitor {
    private transactions = new Map<string, any>()

    // Track app startup
    trackAppStartup() {
      const transaction = Sentry.startTransaction({
        name: 'App Startup',
        op: 'app.startup',
      })

      this.transactions.set('startup', transaction)
    }

    finishAppStartup() {
      const transaction = this.transactions.get('startup')
      if (transaction) {
        transaction.finish()
        this.transactions.delete('startup')
      }
    }

    // Track screen load
    trackScreenLoad(screenName: string) {
      const transaction = Sentry.startTransaction({
        name: `Screen: ${screenName}`,
        op: 'navigation',
      })

      this.transactions.set(`screen:${screenName}`, transaction)
    }

    finishScreenLoad(screenName: string) {
      const transaction = this.transactions.get(`screen:${screenName}`)
      if (transaction) {
        transaction.finish()
        this.transactions.delete(`screen:${screenName}`)
      }
    }

    // Track API calls
    trackApiCall(endpoint: string) {
      const span = Sentry.getCurrentHub()
        .getScope()
        ?.getTransaction()
        ?.startChild({
          op: 'http.client',
          description: `API: ${endpoint}`,
        })

      return {
        finish: (statusCode?: number) => {
          if (span) {
            span.setHttpStatus(statusCode || 200)
            span.finish()
          }
        },
      }
    }

    // Track custom operations
    trackOperation(name: string, operation: string = 'custom') {
      const transaction = Sentry.startTransaction({
        name,
        op: operation,
      })

      return {
        finish: () => transaction.finish(),
        setTag: (key: string, value: string) => transaction.setTag(key, value),
        setData: (key: string, value: any) => transaction.setData(key, value),
      }
    }

    // Custom metrics
    recordMetric(name: string, value: number, unit: string = 'ms') {
      Sentry.addBreadcrumb({
        category: 'metric',
        message: `${name}: ${value}${unit}`,
        level: 'info',
        data: { name, value, unit },
      })
    }
  }

  export const performanceMonitor = new PerformanceMonitor()
  ```

- [ ] **Integrate Performance Tracking** (`app/_layout.tsx`):
  ```typescript
  import { performanceMonitor } from '@/lib/monitoring/PerformanceMonitor'

  export default function RootLayout() {
    useEffect(() => {
      performanceMonitor.trackAppStartup()

      // Finish after initial render
      setTimeout(() => {
        performanceMonitor.finishAppStartup()
      }, 100)
    }, [])

    return (
      <ErrorBoundary>
        {/* ... app content */}
      </ErrorBoundary>
    )
  }
  ```

- [ ] **Track Screen Navigation** (`app/lib/navigation/useScreenTracking.ts`):
  ```typescript
  import { useEffect } from 'react'
  import { usePathname } from 'expo-router'
  import { performanceMonitor } from '@/lib/monitoring/PerformanceMonitor'
  import * as Sentry from '@sentry/react-native'

  export function useScreenTracking() {
    const pathname = usePathname()

    useEffect(() => {
      // Set Sentry context
      Sentry.setContext('navigation', {
        screen: pathname,
        timestamp: new Date().toISOString(),
      })

      // Track performance
      performanceMonitor.trackScreenLoad(pathname)

      return () => {
        performanceMonitor.finishScreenLoad(pathname)
      }
    }, [pathname])
  }
  ```

- [ ] **Track API Calls** (`app/lib/api/client.ts`):
  ```typescript
  import { performanceMonitor } from '@/lib/monitoring/PerformanceMonitor'
  import * as Sentry from '@sentry/react-native'

  export async function apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const span = performanceMonitor.trackApiCall(endpoint)

    try {
      const response = await fetch(endpoint, options)

      span.finish(response.status)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      // Log error to Sentry
      Sentry.captureException(error, {
        tags: {
          endpoint,
          method: options.method || 'GET',
        },
      })

      span.finish(500)
      throw error
    }
  }
  ```

- [ ] **Add User Context** (`app/lib/auth/useAuth.ts`):
  ```typescript
  import * as Sentry from '@sentry/react-native'

  export function useAuth() {
    useEffect(() => {
      if (user) {
        // Set user context for error tracking
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username,
        })
      } else {
        Sentry.setUser(null)
      }
    }, [user])

    // ... rest of auth logic
  }
  ```

- [ ] **Backend Error Monitoring** (`backend/supabase/functions/_shared/sentry.ts`):
  ```typescript
  import * as Sentry from '@sentry/node'

  export function initializeSentry() {
    Sentry.init({
      dsn: Deno.env.get('SENTRY_DSN_BACKEND'),
      environment: Deno.env.get('ENVIRONMENT') || 'production',
      tracesSampleRate: 1.0,
    })
  }

  export function captureError(error: Error, context?: any) {
    Sentry.captureException(error, {
      extra: context,
    })
  }

  export function wrapHandler(handler: Function) {
    return async (req: Request) => {
      try {
        return await handler(req)
      } catch (error) {
        captureError(error as Error, {
          url: req.url,
          method: req.method,
        })
        throw error
      }
    }
  }
  ```

- [ ] **Update Edge Functions** - Wrap all handlers with Sentry

- [ ] **Source Map Upload** (`app/package.json`):
  ```json
  {
    "scripts": {
      "build:ios": "expo build:ios && npm run sentry:upload",
      "build:android": "expo build:android && npm run sentry:upload",
      "sentry:upload": "sentry-cli releases files $npm_package_version upload-sourcemaps ./dist"
    }
  }
  ```

- [ ] **Configure Sentry CLI** (`.sentryclirc`):
  ```ini
  [defaults]
  org=your-org
  project=mobvibe-mobile

  [auth]
  token=your-auth-token
  ```

- [ ] **Setup Alerts** (Sentry Dashboard):
  - Alert: Error rate > 1% → Email + Slack
  - Alert: New issue (critical severity) → Immediate notification
  - Alert: Performance degradation (>2s startup) → Email
  - Alert: High memory usage → Slack

- [ ] **Create Performance Dashboard** (`app/screens/admin/PerformanceMonitor.tsx`):
  ```typescript
  import React, { useEffect, useState } from 'react'
  import { View, Text, ScrollView } from 'react-native'

  interface PerformanceMetrics {
    appStartupTime: number
    averageScreenLoad: number
    apiLatencyP95: number
    errorRate: number
    crashFreeRate: number
  }

  export function PerformanceMonitorScreen() {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

    useEffect(() => {
      // Fetch from Sentry API or custom analytics
      fetchMetrics()
    }, [])

    return (
      <ScrollView className="p-4">
        <Text className="text-2xl font-bold mb-4 dark:text-white">
          Performance Metrics
        </Text>

        {metrics && (
          <View className="space-y-4">
            <MetricCard
              title="App Startup Time"
              value={`${metrics.appStartupTime}ms`}
              status={metrics.appStartupTime < 2000 ? 'good' : 'bad'}
            />
            <MetricCard
              title="Avg Screen Load"
              value={`${metrics.averageScreenLoad}ms`}
              status={metrics.averageScreenLoad < 500 ? 'good' : 'bad'}
            />
            <MetricCard
              title="API Latency (P95)"
              value={`${metrics.apiLatencyP95}ms`}
              status={metrics.apiLatencyP95 < 1000 ? 'good' : 'bad'}
            />
            <MetricCard
              title="Error Rate"
              value={`${(metrics.errorRate * 100).toFixed(2)}%`}
              status={metrics.errorRate < 0.01 ? 'good' : 'bad'}
            />
            <MetricCard
              title="Crash-Free Rate"
              value={`${(metrics.crashFreeRate * 100).toFixed(2)}%`}
              status={metrics.crashFreeRate > 0.99 ? 'good' : 'bad'}
            />
          </View>
        )}
      </ScrollView>
    )
  }
  ```

- [ ] **Create Integration Tests**:
  ```typescript
  // tests/backend/monitoring.test.ts
  describe('Monitoring & Error Reporting', () => {
    it('captures errors with context', async () => {
      const error = new Error('Test error')

      Sentry.captureException(error, {
        tags: { test: 'true' },
      })

      // Verify error sent to Sentry
      await waitFor(() => {
        expect(mockSentryClient.captureException).toHaveBeenCalledWith(
          error,
          expect.objectContaining({ tags: { test: 'true' } })
        )
      })
    })

    it('tracks performance metrics', async () => {
      performanceMonitor.trackAppStartup()
      await sleep(100)
      performanceMonitor.finishAppStartup()

      expect(Sentry.startTransaction).toHaveBeenCalledWith({
        name: 'App Startup',
        op: 'app.startup',
      })
    })

    it('sets user context on login', async () => {
      await signIn('test@example.com', 'password')

      expect(Sentry.setUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' })
      )
    })
  })
  ```

- [ ] **Test Error Tracking**:
  ```bash
  # Trigger test error
  # Add button in dev menu: "Test Sentry"
  throw new Error('Test Sentry Integration')

  # Verify in Sentry dashboard:
  # - Error appears
  # - Stack trace readable
  # - User context present
  # - Device info captured
  ```

- [ ] **Document Monitoring System** (`docs/backend/MONITORING.md`)

- [ ] **Update links-map**

## Artifacts & Paths

**Monitoring Infrastructure:**
- `app/sentry.config.ts`
- `app/lib/monitoring/PerformanceMonitor.ts`
- `app/lib/navigation/useScreenTracking.ts`
- `app/components/ErrorBoundary.tsx`
- `backend/supabase/functions/_shared/sentry.ts`

**Dashboard:**
- `app/screens/admin/PerformanceMonitor.tsx`

**Tests:**
- `tests/backend/monitoring.test.ts`

**Docs:**
- `docs/backend/MONITORING.md` ⭐

## Testing

### Phase-Only Tests
- Sentry captures errors with context
- Performance metrics tracked accurately
- Source maps uploaded correctly
- Alerts trigger on thresholds
- Error grouping works

### Cross-Phase Compatibility
- Analytics dashboard (Phase 54) uses metrics
- Works with all previous phases

### Test Commands
```bash
# Run monitoring tests
npm test -- tests/backend/monitoring.test.ts

# Manual testing
# 1. Trigger error → Check Sentry dashboard
# 2. Navigate screens → Check performance metrics
# 3. Call API → Check trace in Sentry
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| Performance overhead from monitoring | Medium | Sample rates, async logging, minimal instrumentation |
| Sensitive data in error logs | High | Filter PII, review beforeSend hook, test thoroughly |
| Alert fatigue from too many notifications | Medium | Tune thresholds, group similar errors, rate limit alerts |
| Source map upload failures | Medium | Automate in CI/CD, verify after build, fallback to minified |

## References

- [Architecture](./../../../../.docs/architecture.md) - Monitoring architecture
- [Implementation](./../../../../.docs/implementation.md) - Tech stack
- [Phase 52](./52-onboarding-tips.md) - Tutorial analytics integration

## Handover

**Next Phase:** [54-analytics-dashboard.md](./54-analytics-dashboard.md) - Build analytics dashboard with insights

**Required Inputs Provided to Phase 54:**
- Performance metrics data available
- Error tracking data accessible
- Sentry API integration ready

---

**Status:** Ready after Phase 52
**Estimated Time:** 2 days
**Blocking Issues:** Requires Phase 52 onboarding complete
