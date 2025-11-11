# API Services Quick Reference

One-page reference for the API integration.

## Imports

```typescript
// Main services
import { sessionService, apiClient, eventStream } from '@/services/api';

// Error classes
import { APIError, NetworkError, TimeoutError } from '@/services/api';

// Types
import type { Session, SessionEvent, UsageStats } from '@/services/api';

// Connection store
import { useConnectionStore, initializeNetworkListener } from '@/store/connectionStore';
```

## Session Service (High-Level API)

```typescript
// Create session
const { session, job_id } = await sessionService.createSession(projectId, prompt);

// Get session
const session = await sessionService.getSession(sessionId);

// List sessions
const sessions = await sessionService.getAllSessions();
const projectSessions = await sessionService.getSessionHistory(projectId);

// Control session
await sessionService.pauseSession(sessionId);
await sessionService.resumeSession(sessionId);
await sessionService.stopSession(sessionId);

// Reconnect (after app restart)
sessionService.reconnectToSession(sessionId);

// Disconnect (don't stop session)
sessionService.disconnect();

// Cleanup
sessionService.cleanup();
```

## Event Listeners

```typescript
// All return unsubscribe function: () => void

// Thinking events
const unsubscribe = sessionService.onThinking((data) => {
  console.log(data.message);    // string
  console.log(data.progress);   // 0-100 (optional)
});

// Terminal output
sessionService.onTerminalOutput((data) => {
  console.log(data.output);     // string
  console.log(data.command);    // string (optional)
});

// File changes
sessionService.onFileChange((data) => {
  console.log(data.path);       // string
  console.log(data.action);     // 'created' | 'updated' | 'deleted'
  console.log(data.content);    // string (optional)
});

// Preview ready
sessionService.onPreviewReady((data) => {
  console.log(data.url);        // string
  console.log(data.preview_url); // string (optional)
});

// Completion
sessionService.onCompletion((data) => {
  console.log(data.message);    // string
  console.log(data.summary);    // string (optional)
});

// Errors
sessionService.onError((data) => {
  console.log(data.message);    // string
  console.log(data.code);       // string (optional)
  console.log(data.stack);      // string (optional)
});

// All events
sessionService.onAnyEvent((event) => {
  console.log(event.event_type);
  console.log(event.data);
});

// Clean up
unsubscribe();
```

## API Client (Low-Level HTTP)

```typescript
// Sessions
const response = await apiClient.createSession(projectId, prompt);
const session = await apiClient.getSession(sessionId);
const sessions = await apiClient.listSessions(projectId);
await apiClient.pauseSession(sessionId);
await apiClient.resumeSession(sessionId);
await apiClient.stopSession(sessionId);

// Usage
const usage = await apiClient.getUsage();

// Health
const health = await apiClient.healthCheck();
```

## Error Handling

```typescript
try {
  await sessionService.createSession(projectId, prompt);
} catch (error) {
  if (error instanceof APIError) {
    console.error('Status:', error.statusCode);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    alert(error.getUserMessage());        // User-friendly message
    console.log('Retryable?', error.isRetryable());
  } else if (error instanceof NetworkError) {
    alert(error.getUserMessage());
  } else if (error instanceof TimeoutError) {
    alert(error.getUserMessage());
  }
}
```

## Connection Store

```typescript
// Initialize (once at app startup)
const unsubscribe = initializeNetworkListener();

// Use in components
const isOnline = useConnectionStore(state => state.isOnline);
const connectionType = useConnectionStore(state => state.connectionType);
const lastSync = useConnectionStore(state => state.lastSync);
const lastError = useConnectionStore(state => state.lastError);

// Actions
useConnectionStore.getState().updateLastSync();
useConnectionStore.getState().setLastError(error);

// Check status
const isOnline = await checkNetworkStatus();
```

## Complete Component Example

```typescript
import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { sessionService } from '@/services/api';
import { useConnectionStore } from '@/store/connectionStore';
import type { Session } from '@/services/api';

export default function SessionScreen({ projectId }) {
  const [session, setSession] = useState<Session | null>(null);
  const [thinking, setThinking] = useState('');
  const [loading, setLoading] = useState(false);
  const isOnline = useConnectionStore(state => state.isOnline);

  const startSession = async () => {
    setLoading(true);
    try {
      const response = await sessionService.createSession(
        projectId,
        'Build a todo app'
      );
      setSession(response.session);
    } catch (error: any) {
      alert(error.getUserMessage?.() || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen to events
    const unsubscribes = [
      sessionService.onThinking((data) => setThinking(data.message)),
      sessionService.onCompletion((data) => setThinking('')),
    ];

    return () => {
      unsubscribes.forEach(fn => fn());
      sessionService.cleanup();
    };
  }, []);

  return (
    <View>
      {!isOnline && <Text>Offline</Text>}
      <Button onPress={startSession} disabled={loading || !isOnline} />
      {thinking && <Text>{thinking}</Text>}
    </View>
  );
}
```

## Common Patterns

### Create and Monitor Session

```typescript
// Create
const { session } = await sessionService.createSession(projectId, prompt);

// Listen
const unsubscribe = sessionService.onAnyEvent((event) => {
  console.log(event.event_type, event.data);
});

// Cleanup
unsubscribe();
sessionService.cleanup();
```

### Handle App State Changes

```typescript
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      sessionService.reconnectToSession(activeSessionId);
    } else if (state === 'background') {
      sessionService.disconnect();
    }
  });

  return () => subscription.remove();
}, []);
```

### Show Loading States

```typescript
const [loading, setLoading] = useState(false);

const doAction = async () => {
  setLoading(true);
  try {
    await sessionService.createSession(projectId, prompt);
  } catch (error: any) {
    alert(error.getUserMessage());
  } finally {
    setLoading(false);
  }
};
```

### Retry Failed Requests

```typescript
import { withRetry } from '@/services/api';

const result = await withRetry(
  async () => await someOperation(),
  3,    // max retries
  1000  // base delay
);
```

## Types

```typescript
// Session
interface Session {
  id: string;
  user_id: string;
  project_id: string;
  sandbox_id: string | null;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'failed' | 'expired';
  initial_prompt: string;
  webview_url: string | null;
  expires_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// Session Event
interface SessionEvent {
  id: string;
  session_id: string;
  event_type: SessionEventType;
  data: any;
  created_at: string;
}

type SessionEventType =
  | 'thinking'
  | 'terminal'
  | 'file_change'
  | 'preview_ready'
  | 'completion'
  | 'error';

// Usage Stats
interface UsageStats {
  user_id: string;
  tier: 'free' | 'starter' | 'pro';
  sessions_used: number;
  sessions_limit: number;
  api_calls_used: number;
  api_calls_limit: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  reset_at: string;
}
```

## Environment Variables

```bash
EXPO_PUBLIC_API_URL=https://mobvibe-api-divine-silence-9977.fly.dev
EXPO_PUBLIC_SUPABASE_URL=https://vdmvgxuieblknmvxesop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-key>
```

## Error Status Codes

- **401** - Unauthorized (auth required)
- **403** - Forbidden (no permission)
- **404** - Not found
- **429** - Rate limited (auto-retry)
- **500+** - Server error (auto-retry)

## Retry Behavior

- Auth errors (401, 403): **No retry**
- Validation errors (400, 422): **No retry**
- Rate limits (429): **Retry with backoff**
- Server errors (500+): **Retry with backoff**
- Network errors: **Retry with backoff**

Backoff: 1s → 2s → 4s (with jitter)

## Best Practices

1. Always unsubscribe from events
2. Show offline indicator when not online
3. Disable actions when offline
4. Show user-friendly error messages
5. Handle loading states
6. Clean up on component unmount
7. Reconnect to sessions on app resume

## Troubleshooting

### Events not received?
- Check Supabase Realtime enabled on `session_events`
- Verify correct session ID
- Check network connectivity

### 401 errors?
- User needs to log in again
- Check `supabase.auth.getSession()`

### Network errors?
- Check `EXPO_PUBLIC_API_URL` is set
- Verify backend is running: `curl <API_URL>/health`

## Documentation

- Full docs: `services/api/README.md`
- Integration guide: `services/api/INTEGRATION_GUIDE.md`
- Architecture: `services/api/ARCHITECTURE.md`
- Backend: `backend/worker/README.md`
