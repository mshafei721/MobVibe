# 19-realtime-event-streaming.md
---
phase_id: 19
title: Real-time Event Streaming
duration_estimate: "2.5 days"
incremental_value: Live updates to mobile client during coding sessions
owners: [Backend Engineer, Mobile Engineer]
dependencies: [18]
linked_phases_forward: [20]
docs_referenced: [Architecture, Real-time Communication]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["Supabase Realtime best practices", "WebSocket connection management", "React Native WebSocket reconnection"]
    outputs: ["/docs/research/phase1/19/realtime-patterns.md"]
  - name: ContextCurator
    tool: context7
    scope: ["architecture.md realtime", "data-flow.md event streaming"]
    outputs: ["/docs/context/phase1/19-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate plan for implementing real-time event streaming with reconnection logic"
    outputs: ["/docs/sequencing/phase1/19-realtime-steps.md"]
acceptance_criteria:
  - Events stream from worker to mobile <500ms latency
  - WebSocket connections auto-reconnect on disconnect
  - Mobile client receives thinking, file_change, preview_ready events
  - Supabase Realtime subscriptions working
  - Connection state visible to user
  - Event history persisted in database
---

## Objectives

1. **Setup Event Broadcasting** - Worker emits events to Supabase Realtime
2. **Implement Mobile Subscriptions** - Mobile client subscribes to session events
3. **Handle Reconnection** - Automatic reconnection with backoff strategy

## Scope

### In
- Supabase Realtime channel setup
- Event types: thinking, file_change, terminal, preview_ready, error, completion
- Mobile WebSocket subscription
- Reconnection logic with exponential backoff
- Connection state management
- Event persistence in session_events table

### Out
- Complex event replay (simple history fetch sufficient)
- Multi-device synchronization (single device for MVP)
- Event filtering/search (Phase 22+)

## Tasks

- [ ] **Use context7**, **websearch**, **sequentialthinking** per template

- [ ] **Define Event Types** (`backend/worker/src/events/types.ts`):
  ```typescript
  export type SessionEvent =
    | { type: 'thinking'; data: { iteration: number; toolsUsed: string[] } }
    | { type: 'file_change'; data: { path: string; action: 'write' | 'delete' } }
    | { type: 'terminal'; data: { command: string; output: string; error?: string } }
    | { type: 'preview_ready'; data: { url: string; qrCode: string } }
    | { type: 'error'; data: { message: string; code?: string } }
    | { type: 'completion'; data: { message: string } }

  export interface SessionEventRecord {
    id: string
    session_id: string
    event_type: string
    payload: any
    created_at: string
  }
  ```

- [ ] **Create Event Emitter** (`backend/worker/src/events/EventEmitter.ts`):
  ```typescript
  import { createClient } from '@supabase/supabase-js'
  import { logger } from '../utils/logger'
  import type { SessionEvent } from './types'

  export class EventEmitter {
    private supabase: any

    constructor() {
      this.supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    }

    async emit(sessionId: string, event: SessionEvent) {
      logger.debug({ sessionId, eventType: event.type }, 'Emitting event')

      try {
        // Insert into database
        const { data, error } = await this.supabase
          .from('session_events')
          .insert({
            session_id: sessionId,
            event_type: event.type,
            payload: event.data,
          })
          .select()
          .single()

        if (error) {
          logger.error({ error, sessionId }, 'Failed to insert event')
          throw error
        }

        // Supabase Realtime will automatically broadcast this insert
        // to subscribed clients via the channel

        return data
      } catch (error) {
        logger.error({ error, sessionId, event }, 'Event emission failed')
        throw error
      }
    }

    async getHistory(sessionId: string, limit = 100) {
      const { data, error } = await this.supabase
        .from('session_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        logger.error({ error, sessionId }, 'Failed to fetch event history')
        throw error
      }

      return data.reverse() // Return chronological order
    }
  }
  ```

- [ ] **Update AgentRunner to Use EventEmitter**:
  ```typescript
  // src/agent/AgentRunner.ts (updated)
  import { EventEmitter } from '../events/EventEmitter'

  export class AgentRunner {
    private events: EventEmitter

    constructor(sandboxes: SandboxLifecycle) {
      this.claude = new ClaudeClient()
      this.sandboxes = sandboxes
      this.events = new EventEmitter()
    }

    private async emitEvent(sessionId: string, eventType: string, data: any) {
      await this.events.emit(sessionId, { type: eventType, data })
    }
  }
  ```

- [ ] **Enable Supabase Realtime for session_events Table**:
  ```sql
  -- Run in Supabase SQL Editor
  ALTER TABLE session_events REPLICA IDENTITY FULL;

  -- Enable realtime
  ALTER PUBLICATION supabase_realtime ADD TABLE session_events;
  ```

- [ ] **Create Mobile Event Subscription** (`mobile/src/services/RealtimeService.ts`):
  ```typescript
  import { supabase } from './supabase'
  import { RealtimeChannel } from '@supabase/supabase-js'
  import type { SessionEvent } from './types'

  type EventHandler = (event: SessionEvent) => void

  export class RealtimeService {
    private channel?: RealtimeChannel
    private handlers: EventHandler[] = []
    private sessionId?: string
    private reconnectAttempts = 0
    private maxReconnectAttempts = 10
    private reconnectDelay = 1000 // Start at 1 second

    subscribe(sessionId: string, handler: EventHandler) {
      this.sessionId = sessionId
      this.handlers.push(handler)

      // Create channel for this session
      this.channel = supabase
        .channel(`session:${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'session_events',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            console.log('[Realtime] Event received:', payload.new)

            const event: SessionEvent = {
              type: payload.new.event_type,
              data: payload.new.payload,
            }

            // Notify all handlers
            this.handlers.forEach(h => h(event))
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Subscription status:', status)

          if (status === 'SUBSCRIBED') {
            this.reconnectAttempts = 0
            this.reconnectDelay = 1000
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.handleReconnect()
          }
        })

      return () => this.unsubscribe()
    }

    private handleReconnect() {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[Realtime] Max reconnection attempts reached')
        return
      }

      this.reconnectAttempts++

      console.log(
        `[Realtime] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`
      )

      setTimeout(() => {
        if (this.sessionId) {
          this.unsubscribe()
          // Resubscribe using existing handlers
          const handler = this.handlers[0]
          if (handler) {
            this.subscribe(this.sessionId, handler)
          }
        }
      }, this.reconnectDelay)

      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000) // Max 30s
    }

    unsubscribe() {
      if (this.channel) {
        supabase.removeChannel(this.channel)
        this.channel = undefined
      }
      this.handlers = []
      this.sessionId = undefined
    }

    getConnectionState() {
      return this.channel?.state || 'closed'
    }
  }

  export const realtimeService = new RealtimeService()
  ```

- [ ] **Create Connection Indicator Component** (`mobile/src/components/ConnectionIndicator.tsx`):
  ```typescript
  import { View, Text } from 'react-native'
  import { useEffect, useState } from 'react'
  import { realtimeService } from '../services/RealtimeService'

  export function ConnectionIndicator() {
    const [state, setState] = useState<string>('closed')

    useEffect(() => {
      const interval = setInterval(() => {
        setState(realtimeService.getConnectionState())
      }, 1000)

      return () => clearInterval(interval)
    }, [])

    if (state === 'joined') return null // Hide when connected

    const colors = {
      closed: 'bg-red-500',
      joining: 'bg-yellow-500',
      joined: 'bg-green-500',
    }

    return (
      <View className={`absolute top-12 right-4 px-3 py-1 rounded-full ${colors[state] || 'bg-gray-500'}`}>
        <Text className="text-white text-xs font-medium">
          {state === 'joining' ? 'Connecting...' : 'Disconnected'}
        </Text>
      </View>
    )
  }
  ```

- [ ] **Update SessionScreen to Use Realtime** (`mobile/src/screens/SessionScreen.tsx`):
  ```typescript
  import { useEffect, useState } from 'react'
  import { realtimeService } from '../services/RealtimeService'
  import { ConnectionIndicator } from '../components/ConnectionIndicator'
  import type { SessionEvent } from '../services/types'

  export default function SessionScreen({ route }) {
    const { sessionId } = route.params
    const [events, setEvents] = useState<SessionEvent[]>([])

    useEffect(() => {
      // Subscribe to events
      const unsubscribe = realtimeService.subscribe(sessionId, (event) => {
        console.log('Event received:', event)

        setEvents(prev => [...prev, event])

        // Handle specific event types
        if (event.type === 'preview_ready') {
          // Show preview ready notification
        } else if (event.type === 'error') {
          // Show error alert
        } else if (event.type === 'completion') {
          // Show completion notification
        }
      })

      return unsubscribe
    }, [sessionId])

    return (
      <View className="flex-1">
        <ConnectionIndicator />

        {/* Render events */}
        <ScrollView>
          {events.map((event, idx) => (
            <EventItem key={idx} event={event} />
          ))}
        </ScrollView>
      </View>
    )
  }
  ```

- [ ] **Add Connection State to Context**:
  ```typescript
  // mobile/src/contexts/SessionContext.tsx
  interface SessionContextType {
    isConnected: boolean
    connectionState: string
  }

  export function SessionProvider({ children }) {
    const [connectionState, setConnectionState] = useState('closed')

    useEffect(() => {
      const interval = setInterval(() => {
        setConnectionState(realtimeService.getConnectionState())
      }, 1000)

      return () => clearInterval(interval)
    }, [])

    const isConnected = connectionState === 'joined'

    return (
      <SessionContext.Provider value={{ isConnected, connectionState }}>
        {children}
      </SessionContext.Provider>
    )
  }
  ```

- [ ] **Test Realtime Events**:
  ```typescript
  // tests/backend/realtime.test.ts
  describe('Realtime Events', () => {
    it('emits events to database', async () => {
      const emitter = new EventEmitter()

      await emitter.emit('test-session', {
        type: 'thinking',
        data: { iteration: 1, toolsUsed: ['bash'] },
      })

      const history = await emitter.getHistory('test-session')
      expect(history).toHaveLength(1)
      expect(history[0].event_type).toBe('thinking')
    })
  })
  ```

- [ ] **Test Mobile Subscription** (Manual):
  ```bash
  # 1. Start backend worker
  # 2. Create a coding session via mobile
  # 3. Observe events appearing in real-time
  # 4. Disconnect WiFi, reconnect, verify reconnection works
  ```

- [ ] **Document Realtime System**: Create `docs/backend/REALTIME.md`

- [ ] **Update links-map**

## Artifacts & Paths

**Backend:**
- `backend/worker/src/events/types.ts`
- `backend/worker/src/events/EventEmitter.ts`

**Mobile:**
- `mobile/src/services/RealtimeService.ts`
- `mobile/src/components/ConnectionIndicator.tsx`

**Tests:**
- `tests/backend/realtime.test.ts`

**Docs:**
- `docs/backend/REALTIME.md` ⭐

## Testing

### Phase-Only Tests
- Events inserted into session_events table
- Supabase Realtime broadcasts inserts
- Mobile receives events <500ms after emission
- Reconnection works after disconnect
- Connection indicator shows correct state

### Cross-Phase Compatibility
- Phase 20 will use same event system for terminal output
- Phase 21 will use events for error notifications

### Test Commands
```bash
# Backend tests
npm test -- tests/backend/realtime.test.ts

# Manual mobile test
npm run expo:start
# Navigate to session, observe real-time events
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| WebSocket disconnections | UX | Automatic reconnection with exponential backoff |
| Event latency >500ms | UX | Monitor Supabase Realtime performance, optimize if needed |
| Event order issues | Data integrity | Rely on created_at timestamps, client-side ordering |
| Supabase Realtime rate limits | Reliability | Batch events if necessary, monitor usage |

## References

- [Architecture](./../../../../.docs/architecture.md) - Real-time architecture
- [Phase 18](./18-coding-session-lifecycle.md) - Session lifecycle

## Handover

**Next Phase:** [20-terminal-output-streaming.md](./20-terminal-output-streaming.md) - Stream terminal output to mobile

**Required Inputs Provided to Phase 20:**
- EventEmitter class working
- Mobile RealtimeService subscriptions working
- terminal event type defined

---

**Status:** Ready after Phase 18
**Estimated Time:** 2.5 days
**Blocking Issues:** Requires Supabase Realtime enabled
