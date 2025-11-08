# 54-analytics-dashboard.md
---
phase_id: 54
title: Analytics Dashboard
duration_estimate: "2 days"
incremental_value: User insights, trends, and admin analytics dashboard
owners: [Frontend Engineer, Backend Engineer, Product Manager]
dependencies: [53]
linked_phases_forward: []
docs_referenced: [Features & Journeys, Architecture]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: ContextCurator
    tool: context7
    scope: ["analytics visualization libraries", "React Native charts"]
    outputs: ["/docs/context/phase2/54-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for analytics dashboard with user insights"
    outputs: ["/docs/sequencing/phase2/54-analytics-steps.md"]
acceptance_criteria:
  - Analytics dashboard shows key metrics
  - User insights display usage trends
  - Feature adoption metrics tracked
  - Admin analytics view accessible
  - Charts and visualizations render smoothly
  - Data refreshes automatically
  - Export analytics data to CSV
  - Privacy-compliant analytics tracking
---

## Objectives

1. **User Insights** - Understand how users interact with MobVibe
2. **Usage Statistics** - Track key metrics (projects, sessions, features)
3. **Admin Dashboard** - Visualize trends and adoption

## Scope

### In
- Analytics dashboard UI
- Key metrics tracking (DAU, projects created, sessions)
- Feature adoption metrics
- User retention cohorts
- Usage trends visualization
- Admin analytics view
- Data export (CSV)
- Privacy-compliant tracking

### Out
- Advanced ML-based predictions
- A/B testing framework
- Custom funnel analysis (later phase)
- Real-time websocket updates
- Third-party analytics integration (already in Phase 53)

## Tasks

- [ ] **Use context7** to research analytics visualization
- [ ] **Use sequentialthinking** to plan implementation

- [ ] **Install Chart Library**:
  ```bash
  cd app
  npm install react-native-chart-kit
  npm install react-native-svg
  npx expo install react-native-svg
  ```

- [ ] **Create Analytics Types** (`app/lib/analytics/types.ts`):
  ```typescript
  export interface AnalyticsMetrics {
    // User Metrics
    totalUsers: number
    activeUsers: {
      daily: number
      weekly: number
      monthly: number
    }
    newUsers: {
      today: number
      week: number
      month: number
    }

    // Project Metrics
    totalProjects: number
    projectsCreated: {
      today: number
      week: number
      month: number
    }
    averageProjectsPerUser: number

    // Session Metrics
    totalSessions: number
    sessionsToday: number
    averageSessionDuration: number
    averageSessionsPerUser: number

    // Feature Adoption
    featureUsage: {
      voiceInput: number
      pinchToBuild: number
      iconGeneration: number
      soundGeneration: number
      templateFork: number
      projectShare: number
    }

    // Retention
    retention: {
      day1: number
      day7: number
      day30: number
    }

    // Performance (from Phase 53)
    performance: {
      averageStartupTime: number
      averageScreenLoad: number
      errorRate: number
      crashFreeRate: number
    }
  }

  export interface TimeSeriesData {
    date: string
    value: number
  }

  export interface AnalyticsEvent {
    eventName: string
    userId: string
    timestamp: number
    properties?: Record<string, any>
  }
  ```

- [ ] **Create Analytics Service** (`app/lib/analytics/AnalyticsService.ts`):
  ```typescript
  import AsyncStorage from '@react-native-async-storage/async-storage'
  import { AnalyticsEvent } from './types'
  import { supabase } from '@/lib/supabase'

  const EVENTS_KEY = '@mobvibe_analytics_events'
  const BATCH_SIZE = 50
  const FLUSH_INTERVAL = 60000 // 1 minute

  class AnalyticsService {
    private events: AnalyticsEvent[] = []
    private flushTimer?: NodeJS.Timeout
    private userId?: string

    async initialize(userId?: string) {
      this.userId = userId

      // Load pending events
      await this.loadPendingEvents()

      // Start flush timer
      this.startFlushTimer()
    }

    setUser(userId: string | null) {
      this.userId = userId || undefined
    }

    track(eventName: string, properties?: Record<string, any>) {
      if (!this.userId) return // Don't track anonymous events

      const event: AnalyticsEvent = {
        eventName,
        userId: this.userId,
        timestamp: Date.now(),
        properties,
      }

      this.events.push(event)

      // Flush if batch size reached
      if (this.events.length >= BATCH_SIZE) {
        this.flush()
      }
    }

    // Convenience methods
    trackScreen(screenName: string) {
      this.track('screen_view', { screen: screenName })
    }

    trackAction(action: string, details?: Record<string, any>) {
      this.track('user_action', { action, ...details })
    }

    trackFeature(feature: string, details?: Record<string, any>) {
      this.track('feature_usage', { feature, ...details })
    }

    async flush() {
      if (this.events.length === 0) return

      const eventsToSend = [...this.events]
      this.events = []

      try {
        // Send to Supabase
        const { error } = await supabase
          .from('analytics_events')
          .insert(eventsToSend)

        if (error) throw error

        // Clear from storage
        await AsyncStorage.removeItem(EVENTS_KEY)
      } catch (error) {
        console.error('Failed to flush analytics:', error)
        // Restore events for retry
        this.events = [...eventsToSend, ...this.events]
        await this.savePendingEvents()
      }
    }

    private async loadPendingEvents() {
      try {
        const stored = await AsyncStorage.getItem(EVENTS_KEY)
        if (stored) {
          this.events = JSON.parse(stored)
        }
      } catch (error) {
        console.error('Failed to load pending events:', error)
      }
    }

    private async savePendingEvents() {
      try {
        await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(this.events))
      } catch (error) {
        console.error('Failed to save pending events:', error)
      }
    }

    private startFlushTimer() {
      this.flushTimer = setInterval(() => {
        this.flush()
      }, FLUSH_INTERVAL)
    }

    async shutdown() {
      if (this.flushTimer) {
        clearInterval(this.flushTimer)
      }
      await this.flush()
    }
  }

  export const analyticsService = new AnalyticsService()
  ```

- [ ] **Create Database Table** (`supabase/migrations/054_analytics_events.sql`):
  ```sql
  -- Analytics events table
  CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp BIGINT NOT NULL,
    properties JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
  CREATE INDEX idx_analytics_event_name ON analytics_events(event_name);
  CREATE INDEX idx_analytics_timestamp ON analytics_events(timestamp);
  CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);

  -- Enable RLS
  ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

  -- Users can insert their own events
  CREATE POLICY "Users can insert their own analytics"
    ON analytics_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  -- Only admins can read analytics
  CREATE POLICY "Admins can read all analytics"
    ON analytics_events FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
  ```

- [ ] **Create Analytics API** (`backend/supabase/functions/analytics/index.ts`):
  ```typescript
  import { createClient } from '@supabase/supabase-js'

  interface AnalyticsQuery {
    startDate: string
    endDate: string
    metric?: string
  }

  Deno.serve(async (req) => {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return new Response('Forbidden', { status: 403 })
    }

    const { startDate, endDate, metric }: AnalyticsQuery = await req.json()

    // Query analytics
    const metrics = await calculateMetrics(supabase, startDate, endDate)

    return new Response(JSON.stringify(metrics), {
      headers: { 'Content-Type': 'application/json' },
    })
  })

  async function calculateMetrics(supabase: any, startDate: string, endDate: string) {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()

    // Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Active users (DAU, WAU, MAU)
    const { data: activeToday } = await supabase
      .from('analytics_events')
      .select('user_id')
      .gte('timestamp', Date.now() - 24 * 60 * 60 * 1000)
      .neq('user_id', null)

    const dau = new Set(activeToday?.map(e => e.user_id)).size

    // Projects created
    const { count: totalProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })

    const { count: projectsToday } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Sessions
    const { count: totalSessions } = await supabase
      .from('coding_sessions')
      .select('*', { count: 'exact', head: true })

    const { count: sessionsToday } = await supabase
      .from('coding_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Feature usage
    const { data: featureEvents } = await supabase
      .from('analytics_events')
      .select('event_name, properties')
      .eq('event_name', 'feature_usage')
      .gte('timestamp', start)
      .lte('timestamp', end)

    const featureUsage = featureEvents?.reduce((acc, event) => {
      const feature = event.properties?.feature
      if (feature) {
        acc[feature] = (acc[feature] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    return {
      totalUsers,
      activeUsers: { daily: dau },
      totalProjects,
      projectsCreated: { today: projectsToday },
      totalSessions,
      sessionsToday,
      featureUsage,
    }
  }
  ```

- [ ] **Create Analytics Dashboard UI** (`app/screens/admin/AnalyticsDashboard.tsx`):
  ```typescript
  import React, { useEffect, useState } from 'react'
  import { View, Text, ScrollView, Dimensions } from 'react-native'
  import { LineChart, BarChart, PieChart } from 'react-native-chart-kit'
  import { AnalyticsMetrics } from '@/lib/analytics/types'
  import { supabase } from '@/lib/supabase'

  export function AnalyticsDashboardScreen() {
    const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      fetchMetrics()
    }, [])

    const fetchMetrics = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.functions.invoke('analytics', {
          body: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
          },
        })

        if (error) throw error
        setMetrics(data)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (loading || !metrics) {
      return (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">Loading analytics...</Text>
        </View>
      )
    }

    return (
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="p-4">
          {/* Header */}
          <Text className="text-3xl font-bold mb-6 dark:text-white">
            Analytics Dashboard
          </Text>

          {/* Key Metrics Cards */}
          <View className="flex-row flex-wrap gap-4 mb-6">
            <MetricCard
              title="Total Users"
              value={metrics.totalUsers.toLocaleString()}
              icon="👥"
            />
            <MetricCard
              title="Daily Active"
              value={metrics.activeUsers.daily.toLocaleString()}
              icon="📊"
            />
            <MetricCard
              title="Total Projects"
              value={metrics.totalProjects.toLocaleString()}
              icon="🚀"
            />
            <MetricCard
              title="Sessions Today"
              value={metrics.sessionsToday.toLocaleString()}
              icon="💬"
            />
          </View>

          {/* Feature Usage Chart */}
          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold mb-4 dark:text-white">
              Feature Adoption
            </Text>
            <BarChart
              data={{
                labels: Object.keys(metrics.featureUsage).map(k =>
                  k.replace(/([A-Z])/g, ' $1').trim()
                ),
                datasets: [{
                  data: Object.values(metrics.featureUsage),
                }],
              }}
              width={Dimensions.get('window').width - 48}
              height={220}
              yAxisLabel=""
              chartConfig={{
                backgroundColor: '#1e40af',
                backgroundGradientFrom: '#3b82f6',
                backgroundGradientTo: '#1e40af',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: { borderRadius: 16 },
              }}
              style={{ borderRadius: 16 }}
            />
          </View>

          {/* Retention Chart */}
          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold mb-4 dark:text-white">
              User Retention
            </Text>
            <LineChart
              data={{
                labels: ['Day 1', 'Day 7', 'Day 30'],
                datasets: [{
                  data: [
                    metrics.retention.day1 * 100,
                    metrics.retention.day7 * 100,
                    metrics.retention.day30 * 100,
                  ],
                }],
              }}
              width={Dimensions.get('window').width - 48}
              height={220}
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: '#059669',
                backgroundGradientFrom: '#10b981',
                backgroundGradientTo: '#059669',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: { borderRadius: 16 },
              }}
              style={{ borderRadius: 16 }}
            />
          </View>

          {/* Performance Metrics */}
          <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold mb-4 dark:text-white">
              Performance
            </Text>
            <PerformanceMetrics metrics={metrics.performance} />
          </View>
        </View>
      </ScrollView>
    )
  }

  function MetricCard({ title, value, icon }: {
    title: string
    value: string
    icon: string
  }) {
    return (
      <View className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-1 min-w-[150px]">
        <Text className="text-3xl mb-2">{icon}</Text>
        <Text className="text-2xl font-bold dark:text-white">{value}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">{title}</Text>
      </View>
    )
  }
  ```

- [ ] **Track Key Events** (`app/lib/analytics/events.ts`):
  ```typescript
  import { analyticsService } from './AnalyticsService'

  export const AnalyticsEvents = {
    // User Events
    userSignedUp: () => analyticsService.track('user_signed_up'),
    userSignedIn: () => analyticsService.track('user_signed_in'),

    // Project Events
    projectCreated: (projectId: string) =>
      analyticsService.trackAction('project_created', { projectId }),
    projectDeleted: (projectId: string) =>
      analyticsService.trackAction('project_deleted', { projectId }),

    // Session Events
    sessionStarted: (sessionId: string, inputMethod: 'text' | 'voice') =>
      analyticsService.trackAction('session_started', { sessionId, inputMethod }),
    sessionCompleted: (sessionId: string, duration: number) =>
      analyticsService.trackAction('session_completed', { sessionId, duration }),

    // Feature Usage
    voiceInputUsed: () => analyticsService.trackFeature('voiceInput'),
    pinchToBuildUsed: () => analyticsService.trackFeature('pinchToBuild'),
    iconGenerated: () => analyticsService.trackFeature('iconGeneration'),
    soundGenerated: () => analyticsService.trackFeature('soundGeneration'),
    templateForked: (templateId: string) =>
      analyticsService.trackFeature('templateFork', { templateId }),
    projectShared: (projectId: string) =>
      analyticsService.trackFeature('projectShare', { projectId }),
  }
  ```

- [ ] **Integrate Analytics Tracking** - Add event tracking throughout app

- [ ] **Add Export Functionality** (`app/lib/analytics/export.ts`):
  ```typescript
  import * as FileSystem from 'expo-file-system'
  import * as Sharing from 'expo-sharing'

  export async function exportAnalyticsToCSV(data: AnalyticsMetrics) {
    const csv = [
      'Metric,Value',
      `Total Users,${data.totalUsers}`,
      `Daily Active Users,${data.activeUsers.daily}`,
      `Total Projects,${data.totalProjects}`,
      `Sessions Today,${data.sessionsToday}`,
      // ... more metrics
    ].join('\n')

    const filename = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    const fileUri = FileSystem.documentDirectory + filename

    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    })

    await Sharing.shareAsync(fileUri)
  }
  ```

- [ ] **Initialize Analytics** (`app/_layout.tsx`):
  ```typescript
  import { analyticsService } from '@/lib/analytics/AnalyticsService'

  export default function RootLayout() {
    const { user } = useAuth()

    useEffect(() => {
      analyticsService.initialize(user?.id)
    }, [user])

    useEffect(() => {
      return () => {
        analyticsService.shutdown()
      }
    }, [])

    // ... rest of layout
  }
  ```

- [ ] **Privacy Controls** (`app/components/settings/PrivacySettings.tsx`):
  ```typescript
  export function PrivacySettings() {
    const [analyticsEnabled, setAnalyticsEnabled] = useState(true)

    const handleToggle = async (enabled: boolean) => {
      setAnalyticsEnabled(enabled)
      await AsyncStorage.setItem('@analytics_enabled', JSON.stringify(enabled))

      if (!enabled) {
        // Clear pending events
        await analyticsService.shutdown()
      }
    }

    return (
      <View>
        <Text className="font-semibold mb-2">Analytics & Data</Text>
        <Switch
          value={analyticsEnabled}
          onValueChange={handleToggle}
        />
        <Text className="text-sm text-gray-500 mt-1">
          Help us improve MobVibe by sharing anonymous usage data
        </Text>
      </View>
    )
  }
  ```

- [ ] **Create Integration Tests**:
  ```typescript
  // tests/backend/analytics.test.ts
  describe('Analytics Dashboard', () => {
    it('tracks events correctly', async () => {
      analyticsService.initialize(testUserId)
      analyticsService.track('test_event', { foo: 'bar' })

      await analyticsService.flush()

      const { data } = await supabase
        .from('analytics_events')
        .select()
        .eq('event_name', 'test_event')
        .single()

      expect(data.properties.foo).toBe('bar')
    })

    it('calculates metrics accurately', async () => {
      const metrics = await fetchAnalytics(startDate, endDate)

      expect(metrics.totalUsers).toBeGreaterThan(0)
      expect(metrics.activeUsers.daily).toBeDefined()
    })

    it('respects privacy settings', async () => {
      await AsyncStorage.setItem('@analytics_enabled', JSON.stringify(false))
      analyticsService.track('test_event')

      expect(analyticsService['events']).toHaveLength(0)
    })
  })
  ```

- [ ] **Document Analytics System** (`docs/backend/ANALYTICS.md`)

- [ ] **Update links-map**

## Artifacts & Paths

**Analytics System:**
- `app/lib/analytics/types.ts`
- `app/lib/analytics/AnalyticsService.ts`
- `app/lib/analytics/events.ts`
- `app/lib/analytics/export.ts`
- `backend/supabase/functions/analytics/index.ts`
- `supabase/migrations/054_analytics_events.sql`

**Dashboard:**
- `app/screens/admin/AnalyticsDashboard.tsx`
- `app/components/settings/PrivacySettings.tsx`

**Tests:**
- `tests/backend/analytics.test.ts`

**Docs:**
- `docs/backend/ANALYTICS.md` ⭐

## Testing

### Phase-Only Tests
- Events tracked and stored correctly
- Analytics dashboard displays metrics
- Charts render without errors
- Export to CSV works
- Privacy controls function
- Admin-only access enforced

### Cross-Phase Compatibility
- Integrates with monitoring (Phase 53)
- Works with all previous phases

### Test Commands
```bash
# Run analytics tests
npm test -- tests/backend/analytics.test.ts

# Manual testing
# 1. Navigate app → Check events in DB
# 2. View dashboard → Verify metrics
# 3. Export CSV → Verify data format
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| Privacy concerns with tracking | High | Clear privacy controls, anonymous data, user consent |
| Performance impact from event tracking | Medium | Batch events, async flush, minimal overhead |
| Data storage costs | Medium | Retention policy, aggregated metrics, archive old data |
| Analytics API rate limits | Low | Cache results, pagination, rate limiting |

## References

- [Features & Journeys](./../../../../.docs/features-and-journeys.md) - Analytics requirements
- [Architecture](./../../../../.docs/architecture.md) - Analytics architecture
- [Phase 53](./53-monitoring-reporting.md) - Performance metrics integration

## Handover

**Phase 2 Complete!**

**What's Next:**
- Phase 3 planning (Publishing & Scale features)
- Gather user feedback from Phase 2 enhancements
- Analyze analytics data to prioritize Phase 3 features

---

**Status:** Ready after Phase 53
**Estimated Time:** 2 days
**Blocking Issues:** Requires Phase 53 monitoring complete
