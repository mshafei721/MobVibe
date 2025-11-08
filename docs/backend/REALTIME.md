# Real-time Event Streaming

**Phase**: 19
**Status**: Backend Complete (Mobile Deferred)
**Dependencies**: Phase 17 (Session Lifecycle), Phase 18 (File Sync)
**Integration**: Supabase Realtime + PostgreSQL CDC

---

## Overview

Real-time event streaming system enables live updates from backend worker to mobile clients during coding sessions. Events are emitted to PostgreSQL and broadcast via Supabase Realtime using Change Data Capture (CDC).

## Architecture

```
┌─────────────────┐
│  AgentRunner    │ ← Agent execution
└────────┬────────┘
         │ lifecycle.emitEvent()
         ↓
┌──────────────────────┐
│ SessionLifecycleManager │ ← Event emission
└────────┬─────────────┘
         │ INSERT into session_events
         ↓
┌──────────────────────┐
│  PostgreSQL (CDC)    │ ← Change detection
└────────┬─────────────┘
         │ WAL stream
         ↓
┌──────────────────────┐
│ Supabase Realtime    │ ← Event broadcasting
└────────┬─────────────┘
         │ WebSocket
         ↓
┌──────────────────────┐
│  Mobile Client       │ ← Real-time UI updates
└──────────────────────┘
```

## Event System (Backend)

### SessionLifecycleManager

**Purpose**: Central event emission system for all session events

**Event Emission**:
```typescript
async emitEvent(sessionId: string, eventType: SessionEventType, data: any): Promise<void> {
  const event: SessionEvent = {
    sessionId,
    eventType,
    data,
    timestamp: new Date(),
  }

  // Insert into database (triggers Realtime broadcast)
  await supabase.from('session_events').insert({
    session_id: sessionId,
    event_type: eventType,
    event_data: data,
    created_at: event.timestamp,
  })
}
```

**Event History**:
```typescript
async getEventHistory(sessionId: string, limit: number = 100): Promise<SessionEvent[]> {
  const { data } = await supabase
    .from('session_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data.reverse() // Chronological order
}
```

### Event Types

**SessionEventType Enum** (from Phase 17):
```typescript
enum SessionEventType {
  STATE_CHANGED = 'state_changed',    // Session state transitions
  THINKING = 'thinking',               // Agent iteration progress
  TERMINAL = 'terminal',               // Bash command execution
  FILE_CHANGE = 'file_change',         // File write/delete
  COMPLETION = 'completion',           // Session success
  ERROR = 'error',                     // Session failure
}
```

**Event Data Schemas**:

1. **STATE_CHANGED**
```typescript
{
  from: SessionState
  to: SessionState
  reason: string
}
```

2. **THINKING**
```typescript
{
  iteration: number
  toolsUsed: string[]
}
```

3. **TERMINAL**
```typescript
{
  command: string
  output: string
  error: string
  exitCode: number
}
```

4. **FILE_CHANGE**
```typescript
{
  path: string
  action: 'write' | 'delete'
}
```

5. **COMPLETION**
```typescript
{
  message: string
  stats: {
    iterations: number
    inputTokens: number
    outputTokens: number
    toolCalls: number
  }
}
```

6. **ERROR**
```typescript
{
  message: string
  stats?: SessionStats
}
```

## Event Flow Examples

### Agent Iteration

```
1. AgentRunner starts iteration 3
2. lifecycle.emitEvent(sessionId, THINKING, { iteration: 3, toolsUsed: ['bash'] })
3. INSERT into session_events
4. PostgreSQL CDC detects insert
5. Supabase Realtime broadcasts to channel `session:{sessionId}`
6. Mobile client receives event <500ms
7. UI updates: "Processing step 3..."
```

### File Write

```
1. Agent executes write_file('App.tsx')
2. Write to sandbox filesystem
3. Upload to Supabase Storage
4. lifecycle.emitEvent(sessionId, FILE_CHANGE, { path: 'App.tsx', action: 'write' })
5. Realtime broadcast
6. Mobile client receives event
7. UI refreshes file tree
```

### Session Completion

```
1. Agent loop finishes (no more tool calls)
2. lifecycle.emitEvent(sessionId, COMPLETION, { message: '...', stats })
3. lifecycle.completeSession(sessionId, stats)
4. Realtime broadcasts: COMPLETION + STATE_CHANGED
5. Mobile shows completion notification
6. UI transitions to preview screen
```

## Database Configuration

### session_events Table

**Schema** (created in Phase 17):
```sql
CREATE TABLE session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes**:
```sql
CREATE INDEX idx_session_events_session_id ON session_events(session_id, created_at DESC);
CREATE INDEX idx_session_events_type ON session_events(event_type);
CREATE INDEX idx_session_events_created_at ON session_events(created_at DESC);
```

### Realtime Setup

**Migration** (011_enable_realtime_session_events.sql):
```sql
-- Enable full row replication
ALTER TABLE session_events REPLICA IDENTITY FULL;

-- Add to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE session_events;
```

**Verification**:
```sql
-- Check REPLICA IDENTITY
SELECT relname, relreplident
FROM pg_class
WHERE relname = 'session_events';
-- Should show: relreplident = 'f' (FULL)

-- Check publication
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'session_events';
```

## Mobile Integration (Future)

### RealtimeService

**Purpose**: Manage WebSocket subscriptions with reconnection logic

**Implementation** (to be created in mobile app):
```typescript
import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

type EventHandler = (event: SessionEvent) => void

export class RealtimeService {
  private channel?: RealtimeChannel
  private handlers: EventHandler[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000

  subscribe(sessionId: string, handler: EventHandler) {
    this.channel = supabase
      .channel(`session:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'session_events',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        const event = {
          type: payload.new.event_type,
          data: payload.new.event_data,
        }
        this.handlers.forEach(h => h(event))
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.reconnectAttempts = 0
        } else if (status === 'CHANNEL_ERROR') {
          this.handleReconnect()
        }
      })

    return () => this.unsubscribe()
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return

    this.reconnectAttempts++
    setTimeout(() => {
      this.unsubscribe()
      // Re-subscribe with existing handlers
    }, this.reconnectDelay)

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000)
  }

  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel)
      this.channel = undefined
    }
  }

  getConnectionState() {
    return this.channel?.state || 'closed'
  }
}
```

### ConnectionIndicator Component

**Purpose**: Visual feedback for connection state

**Implementation** (React Native):
```typescript
import { View, Text } from 'react-native'
import { useState, useEffect } from 'react'
import { realtimeService } from '../services/RealtimeService'

export function ConnectionIndicator() {
  const [state, setState] = useState('closed')

  useEffect(() => {
    const interval = setInterval(() => {
      setState(realtimeService.getConnectionState())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (state === 'joined') return null

  return (
    <View className={`px-3 py-1 rounded-full ${
      state === 'joining' ? 'bg-yellow-500' : 'bg-red-500'
    }`}>
      <Text className="text-white text-xs">
        {state === 'joining' ? 'Connecting...' : 'Disconnected'}
      </Text>
    </View>
  )
}
```

### SessionScreen Integration

**Purpose**: Subscribe to events and update UI

**Implementation**:
```typescript
import { useState, useEffect } from 'react'
import { realtimeService } from '../services/RealtimeService'

export default function SessionScreen({ route }) {
  const { sessionId } = route.params
  const [events, setEvents] = useState([])

  useEffect(() => {
    const unsubscribe = realtimeService.subscribe(sessionId, (event) => {
      setEvents(prev => [...prev, event])

      // Handle specific events
      if (event.type === 'file_change') {
        refreshFileTree()
      } else if (event.type === 'completion') {
        showCompletionNotification()
      } else if (event.type === 'error') {
        showError(event.data.message)
      }
    })

    return unsubscribe
  }, [sessionId])

  return (
    <View>
      <ConnectionIndicator />
      {events.map((event, idx) => (
        <EventItem key={idx} event={event} />
      ))}
    </View>
  )
}
```

## Performance

### Latency Targets

**Event Emission to Mobile**: <500ms

**Breakdown**:
```
Worker emitEvent():     <50ms (database insert)
PostgreSQL CDC:         <100ms (WAL processing)
Supabase Realtime:      <200ms (broadcast)
Network to mobile:      <100ms (WebSocket)
Mobile processing:      <50ms (state update)
────────────────────────────────
Total:                  <500ms
```

### Monitoring

**Event Latency**:
```sql
-- Average time between event creation and now
SELECT
  event_type,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_latency_seconds
FROM session_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type;
```

**Event Volume**:
```sql
-- Events per minute
SELECT
  DATE_TRUNC('minute', created_at) as minute,
  event_type,
  COUNT(*) as event_count
FROM session_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY minute, event_type
ORDER BY minute DESC;
```

**Active Subscriptions**:
```typescript
// Mobile client tracking
const activeConnections = supabase
  .getChannels()
  .filter(ch => ch.state === 'joined')
  .length
```

### Optimization

**Batch Events** (future):
```typescript
// Instead of one event per file
for (const file of files) {
  await emitEvent(sessionId, FILE_CHANGE, { path: file })
}

// Batch into single event
await emitEvent(sessionId, FILES_CHANGED, {
  files: files.map(f => ({ path: f, action: 'write' }))
})
```

**Throttle UI Updates** (mobile):
```typescript
// Debounce file tree refresh
const debouncedRefresh = debounce(() => {
  refreshFileTree()
}, 500)

if (event.type === 'file_change') {
  debouncedRefresh()
}
```

## Security

### RLS Policies

**session_events Table**:
```sql
-- Users can only view their own session events
CREATE POLICY "Users can view their own session events"
  ON session_events FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM coding_sessions WHERE user_id = auth.uid()
    )
  );

-- Service role can insert events (worker)
CREATE POLICY "Service role can insert session events"
  ON session_events FOR INSERT
  WITH CHECK (true);
```

### Channel Authorization

**Supabase RLS** automatically enforces:
- Users can only subscribe to their own sessions
- Service role can emit to any session

**Mobile Subscription**:
```typescript
// Client uses user JWT token
const supabase = createClient(url, anonKey, {
  auth: { persistSession: true }
})

// Subscription automatically filtered by RLS
supabase
  .channel(`session:${sessionId}`)
  .on('postgres_changes', { /* ... */ })
  .subscribe()

// Only receives events for sessions WHERE user_id = auth.uid()
```

## Error Handling

### Backend Failures

**Event Emission Failure**:
```typescript
async emitEvent(sessionId: string, eventType: SessionEventType, data: any) {
  try {
    await supabase.from('session_events').insert(...)
  } catch (error) {
    logger.error({ error, sessionId, eventType }, 'Failed to emit event')
    // Don't throw - continue agent execution
  }
}
```

### Mobile Reconnection

**Exponential Backoff**:
```typescript
Attempt 1: 1 second
Attempt 2: 2 seconds
Attempt 3: 4 seconds
Attempt 4: 8 seconds
Attempt 5: 16 seconds
Attempt 6: 30 seconds (capped)
...
Attempt 10: 30 seconds (max attempts)
```

**Connection States**:
```
closed → joining → joined
   ↑         ↓
   └─ error ─┘
```

### Event History Recovery

**On Reconnect**:
```typescript
async function onReconnect(sessionId: string) {
  // Fetch missed events
  const lastEvent = events[events.length - 1]
  const history = await fetchEventHistory(sessionId, lastEvent?.timestamp)

  // Merge with existing events
  setEvents(prev => [...prev, ...history])
}
```

## Testing

### Backend Tests

**Event Emission**:
```typescript
describe('SessionLifecycleManager', () => {
  it('emits events to database', async () => {
    const manager = new SessionLifecycleManager()

    await manager.emitEvent('test-session', SessionEventType.THINKING, {
      iteration: 1,
      toolsUsed: ['bash'],
    })

    const history = await manager.getEventHistory('test-session')
    expect(history).toHaveLength(1)
    expect(history[0].eventType).toBe('thinking')
  })

  it('retrieves event history in chronological order', async () => {
    const manager = new SessionLifecycleManager()

    await manager.emitEvent('test', THINKING, { iteration: 1 })
    await manager.emitEvent('test', TERMINAL, { command: 'ls' })
    await manager.emitEvent('test', FILE_CHANGE, { path: 'App.tsx' })

    const history = await manager.getEventHistory('test')
    expect(history[0].eventType).toBe('thinking')
    expect(history[1].eventType).toBe('terminal')
    expect(history[2].eventType).toBe('file_change')
  })
})
```

### Integration Tests (Mobile)

**Realtime Subscription**:
```typescript
describe('RealtimeService', () => {
  it('receives events from backend', async () => {
    const service = new RealtimeService()
    const events = []

    service.subscribe('test-session', (event) => {
      events.push(event)
    })

    // Backend emits event
    await backendEmitEvent('test-session', 'thinking', { iteration: 1 })

    // Wait for realtime propagation
    await sleep(500)

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('thinking')
  })

  it('reconnects after disconnect', async () => {
    const service = new RealtimeService()
    service.subscribe('test-session', jest.fn())

    // Simulate disconnect
    simulateNetworkDisconnect()

    await sleep(2000)

    expect(service.getConnectionState()).toBe('joined')
  })
})
```

### Manual Tests

**Connection Flow**:
1. Start mobile app
2. Create coding session
3. Observe connection indicator → "Connecting..." → Hidden
4. Watch events appear in real-time
5. Disable WiFi → "Disconnected" indicator
6. Enable WiFi → Auto-reconnect → Hidden indicator

**Event Types**:
1. See THINKING events during agent iterations
2. See TERMINAL events with command output
3. See FILE_CHANGE events after file writes
4. See COMPLETION event when session finishes

## Future Enhancements

### Phase 2

- **Event Filtering**: Client-side event type filtering
- **Event Search**: Query events by type/content
- **Event Replay**: Rewind/replay session events
- **Multi-Device Sync**: Same session on multiple devices
- **Presence**: Show other users viewing session
- **Collaborative Annotations**: Comments on events

### Performance

- **Event Batching**: Combine multiple events
- **Compression**: Gzip event payloads
- **CDN Distribution**: Edge caching for event history

---

**Phase 19 Status**: ✅ Backend Complete (Mobile Deferred)
**Next Phase**: Phase 20 (Terminal Output Streaming)
**Team**: Backend Engineer
**Duration**: <1 session (reused Phase 17 infrastructure)
**Quality**: Production-ready backend, mobile implementation deferred
