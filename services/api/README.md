# API Services

Complete API client and WebSocket integration for MobVibe backend.

## Overview

This module provides:
- **API Client**: HTTP client with authentication and retry logic
- **Event Stream**: Supabase Realtime integration for session events
- **Session Service**: High-level orchestration for coding sessions
- **Error Handling**: Comprehensive error classes and retry mechanisms
- **Type Safety**: Full TypeScript types for all API interactions

## Quick Start

```typescript
import { sessionService } from '@/services/api';

// Create a new session
const { session, job_id } = await sessionService.createSession(
  'project-id',
  'Build a todo app'
);

// Listen to events
const unsubscribe = sessionService.onThinking((data) => {
  console.log('AI is thinking:', data.message);
});

// Pause session
await sessionService.pauseSession(session.id);

// Resume session
await sessionService.resumeSession(session.id);

// Stop session and cleanup
await sessionService.stopSession(session.id);
unsubscribe();
```

## Core Services

### Session Service

High-level API for managing coding sessions.

```typescript
import { sessionService } from '@/services/api';

// Create session
const response = await sessionService.createSession(projectId, prompt);

// Get session details
const session = await sessionService.getSession(sessionId);

// Session control
await sessionService.pauseSession(sessionId);
await sessionService.resumeSession(sessionId);
await sessionService.stopSession(sessionId);

// Reconnect to existing session (after app restart)
sessionService.reconnectToSession(sessionId);

// Disconnect without stopping
sessionService.disconnect();
```

### Event Listeners

Listen to real-time session events:

```typescript
// Thinking events (AI processing)
sessionService.onThinking((data) => {
  console.log(data.message);
  console.log(data.progress); // 0-100
});

// Terminal output
sessionService.onTerminalOutput((data) => {
  console.log(data.output);
  console.log(data.command);
});

// File changes
sessionService.onFileChange((data) => {
  console.log(data.path);
  console.log(data.action); // 'created' | 'updated' | 'deleted'
  console.log(data.content);
});

// Preview ready
sessionService.onPreviewReady((data) => {
  console.log(data.url);
  console.log(data.preview_url);
});

// Completion
sessionService.onCompletion((data) => {
  console.log(data.message);
  console.log(data.summary);
});

// Errors
sessionService.onError((data) => {
  console.error(data.message);
  console.error(data.code);
});

// All events
sessionService.onAnyEvent((event) => {
  console.log(event.event_type, event.data);
});
```

### API Client

Low-level HTTP client (use Session Service instead when possible).

```typescript
import { apiClient } from '@/services/api';

// Sessions
const response = await apiClient.createSession(projectId, prompt);
const session = await apiClient.getSession(sessionId);
const sessions = await apiClient.listSessions(projectId);
await apiClient.pauseSession(sessionId);
await apiClient.resumeSession(sessionId);
await apiClient.stopSession(sessionId);

// Usage
const usage = await apiClient.getUsage();

// Health check
const health = await apiClient.healthCheck();
```

### Event Stream

Low-level event streaming (use Session Service instead when possible).

```typescript
import { eventStream } from '@/services/api';

// Subscribe to session
eventStream.subscribeToSession(sessionId);

// Listen to events
const unsubscribe = eventStream.onThinking((data) => {
  console.log(data.message);
});

// Unsubscribe
unsubscribe();
eventStream.unsubscribe();
```

## Error Handling

All API calls can throw the following errors:

```typescript
import { APIError, NetworkError, TimeoutError } from '@/services/api';

try {
  await sessionService.createSession(projectId, prompt);
} catch (error) {
  if (error instanceof APIError) {
    console.error('API Error:', error.statusCode, error.message);
    console.error('User message:', error.getUserMessage());
    console.error('Is retryable:', error.isRetryable());
  } else if (error instanceof NetworkError) {
    console.error('Network Error:', error.message);
  } else if (error instanceof TimeoutError) {
    console.error('Timeout Error:', error.message);
  }
}
```

### Retry Logic

API calls automatically retry on transient failures:

```typescript
import { withRetry } from '@/services/api';

// Retry a custom operation
const result = await withRetry(
  async () => {
    return await someOperation();
  },
  3, // max retries
  1000 // base delay in ms
);
```

**Retry behavior:**
- Auth errors (401, 403): No retry
- Validation errors (400, 422): No retry
- Rate limits (429): Retry with backoff
- Server errors (500+): Retry with backoff
- Network errors: Retry with backoff

**Backoff strategy:** Exponential backoff with jitter
- Attempt 1: 1-2s delay
- Attempt 2: 2-4s delay
- Attempt 3: 4-8s delay

## Connection Status

Track network connectivity:

```typescript
import { useConnectionStore, initializeNetworkListener } from '@/store/connectionStore';

// Initialize (call once at app startup)
const unsubscribe = initializeNetworkListener();

// Use in components
function MyComponent() {
  const isOnline = useConnectionStore(state => state.isOnline);
  const lastSync = useConnectionStore(state => state.lastSync);

  return (
    <View>
      {!isOnline && <Text>Offline</Text>}
      {lastSync && <Text>Last sync: {lastSync.toLocaleString()}</Text>}
    </View>
  );
}
```

## Types

All API types are fully typed:

```typescript
import type {
  Session,
  SessionEvent,
  SessionEventType,
  ThinkingEventData,
  TerminalEventData,
  FileChangeEventData,
  PreviewReadyEventData,
  CompletionEventData,
  ErrorEventData,
  UsageStats,
} from '@/services/api';
```

## Testing

Run the test suite:

```bash
npm test services/api/__tests__/apiClient.test.ts
```

Test coverage includes:
- API client authentication
- Error handling (401, 404, 429, 500, network)
- Session CRUD operations
- Usage statistics
- Retry logic

## Environment Variables

Required environment variables (already set in `.env.production`):

```bash
EXPO_PUBLIC_API_URL=https://mobvibe-api-divine-silence-9977.fly.dev
EXPO_PUBLIC_SUPABASE_URL=https://vdmvgxuieblknmvxesop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## Architecture

```
SessionService (high-level orchestration)
    ↓
APIClient (HTTP requests) + EventStream (WebSocket/Realtime)
    ↓
Backend API (Fly.io) + Supabase Realtime
```

## Best Practices

1. **Use Session Service**: Prefer `sessionService` over direct `apiClient` or `eventStream` usage
2. **Clean up listeners**: Always unsubscribe from events when component unmounts
3. **Handle errors**: Wrap API calls in try-catch and show user-friendly messages
4. **Check connectivity**: Use `useConnectionStore` to show offline state
5. **Reconnect on resume**: Call `sessionService.reconnectToSession()` after app resumes

## Examples

### React Native Component

```typescript
import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { sessionService } from '@/services/api';
import { useConnectionStore } from '@/store/connectionStore';

export function SessionScreen({ projectId }) {
  const [session, setSession] = useState(null);
  const [thinking, setThinking] = useState('');
  const isOnline = useConnectionStore(state => state.isOnline);

  const startSession = async () => {
    try {
      const response = await sessionService.createSession(
        projectId,
        'Build a todo app'
      );
      setSession(response.session);
    } catch (error) {
      alert(error.getUserMessage());
    }
  };

  useEffect(() => {
    // Listen to thinking events
    const unsubscribe = sessionService.onThinking((data) => {
      setThinking(data.message);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <View>
      {!isOnline && <Text>Offline</Text>}
      <Button onPress={startSession} title="Start Session" />
      {thinking && <Text>{thinking}</Text>}
    </View>
  );
}
```

## Troubleshooting

### Events not received

1. Check Supabase Realtime is enabled on `session_events` table
2. Verify RLS policies allow reading events
3. Check network connectivity
4. Ensure session ID is correct

### Authentication errors

1. Check if user is logged in: `supabase.auth.getSession()`
2. Verify token hasn't expired
3. Check RLS policies on backend tables

### Network errors

1. Verify `EXPO_PUBLIC_API_URL` is set correctly
2. Check internet connectivity
3. Verify backend is healthy: `curl https://mobvibe-api-divine-silence-9977.fly.dev/health`

## Support

For issues or questions, check:
- Backend API docs: `backend/worker/README.md`
- Database schema: `supabase/migrations/`
- Backend logs: `fly logs -a mobvibe-api-divine-silence-9977`
