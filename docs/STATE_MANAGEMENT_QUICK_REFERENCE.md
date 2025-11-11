# State Management Quick Reference

Quick reference for MobVibe state management system.

## Import Paths

```typescript
// Store
import { useSessionStore } from '@/store/sessionStore';
import type { Message, ExtendedSession } from '@/store/sessionStore';

// Services
import { MessageHistory, sessionSync, optimisticUpdates } from '@/services/state';

// Hooks
import { useAutoSessionRecovery, useSessionRecovery } from '@/hooks/useSessionRecovery';
```

## Common Patterns

### Start a Session

```typescript
const { startSession } = useSessionStore();

await startSession(projectId, 'Build a todo app');
```

### Send a Message

```typescript
const { currentSession, sendMessage } = useSessionStore();

await sendMessage(currentSession.id, 'Add dark mode');
```

### Display Messages

```typescript
const { messages, isThinking } = useSessionStore();

return (
  <>
    <FlatList
      data={messages}
      renderItem={({ item }) => <MessageBubble message={item} />}
      keyExtractor={(item) => item.id}
    />
    {isThinking && <TypingIndicator />}
  </>
);
```

### Session Controls

```typescript
const { pauseSession, resumeSession, stopSession } = useSessionStore();

// Pause
await pauseSession();

// Resume
await resumeSession(sessionId);

// Stop
await stopSession();
```

### Session Recovery

```typescript
// In App.tsx or root component
import { useAutoSessionRecovery } from '@/hooks/useSessionRecovery';

function App() {
  useAutoSessionRecovery();
  return <YourApp />;
}
```

### Enable Sync

```typescript
import { sessionSync } from '@/services/state';

useEffect(() => {
  if (currentSession?.status === 'active') {
    sessionSync.startSync(currentSession.id);
  }
  return () => sessionSync.stopSync();
}, [currentSession?.id]);
```

### Real-time Message Updates

```typescript
import { useSessionStore } from '@/store/sessionStore';
import { sessionService } from '@/services/api';

// Subscribe to events
useEffect(() => {
  const unsubscribe = sessionService.onThinking((data) => {
    useSessionStore.getState().addMessage({
      id: `${Date.now()}-thinking`,
      role: 'assistant',
      content: data.message,
      timestamp: new Date(),
      type: 'thinking'
    });
  });

  return unsubscribe;
}, []);
```

### Handle Errors

```typescript
const { error, clearError } = useSessionStore();

{error && (
  <ErrorBanner
    message={error}
    onDismiss={clearError}
  />
)}
```

### Recent Sessions

```typescript
const { recentSessions, fetchRecentSessions, loadSession } = useSessionStore();

// Fetch
useEffect(() => {
  fetchRecentSessions(projectId);
}, [projectId]);

// Load
await loadSession(sessionId);
```

### Message Search

```typescript
import { MessageHistory } from '@/services/state';

const results = await MessageHistory.searchMessages(
  sessionId,
  'search query'
);
```

### Storage Management

```typescript
import { MessageHistory } from '@/services/state';

// Get info
const info = await MessageHistory.getStorageInfo();

// Clear specific session
await MessageHistory.clear(sessionId);

// Clear all
await MessageHistory.clearAll();
```

### Optimistic Updates

```typescript
import { optimisticUpdates } from '@/services/state';

const opId = optimisticUpdates.add({
  type: 'send_message',
  data: { sessionId, message }
});

try {
  await apiCall();
  optimisticUpdates.complete(opId);
} catch (error) {
  optimisticUpdates.fail(opId, error);
}
```

## State Structure

```typescript
interface SessionState {
  // Current session
  currentSession: ExtendedSession | null;
  messages: Message[];

  // History
  recentSessions: Session[];

  // UI state
  loading: boolean;
  error: string | null;
  isThinking: boolean;

  // Actions
  startSession: (projectId, prompt) => Promise<Session>;
  resumeSession: (sessionId) => Promise<void>;
  pauseSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  sendMessage: (sessionId, message) => Promise<void>;
  addMessage: (message) => void;
  clearMessages: () => void;
  setThinking: (thinking) => void;
  fetchRecentSessions: (projectId) => Promise<void>;
  loadSession: (sessionId) => Promise<void>;
  clearCurrentSession: () => void;
  clearError: () => void;
}
```

## Message Types

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type: 'text' | 'code' | 'thinking' | 'error';
  metadata?: Record<string, any>;
}
```

## Session Status

- `pending` - Created but not started
- `active` - Currently running
- `paused` - Temporarily paused
- `completed` - Successfully finished
- `failed` - Error occurred
- `expired` - Timed out

## Storage Limits

```typescript
const LIMITS = {
  messagesInStore: 100,        // Persisted in store
  messagesPerSession: 500,     // In AsyncStorage
  recentSessions: 20           // Tracked sessions
};
```

## Sync Configuration

```typescript
// Default: 30 seconds
sessionSync.startSync(sessionId);

// Custom interval
sessionSync.startSync(sessionId, 60000); // 60 seconds

// Force sync
await sessionSync.forceSync();
```

## Troubleshooting

### Session not recovering?
1. Check `useAutoSessionRecovery()` is called
2. Verify AsyncStorage permissions
3. Check console logs

### Messages not persisting?
1. Verify Zustand persistence configured
2. Check message array limits
3. Look for serialization errors

### High memory usage?
1. Reduce message limits
2. Clear old history: `MessageHistory.clearAll()`
3. Use pagination

## Performance Tips

```typescript
// ✅ Good: Use selectors
const loading = useSessionStore(state => state.loading);

// ❌ Bad: Subscribe to entire store
const store = useSessionStore();

// ✅ Good: Clear messages when done
clearCurrentSession();

// ❌ Bad: Let messages accumulate

// ✅ Good: Debounce rapid updates
const debouncedAddMessage = debounce(addMessage, 100);

// ❌ Bad: Add message on every keystroke
```

## File Locations

```
store/sessionStore.ts              - Main store
services/state/messageHistory.ts   - Message persistence
services/state/optimisticUpdates.ts - Update tracking
services/state/sessionSync.ts      - Backend sync
hooks/useSessionRecovery.ts        - Recovery hook
```

## Related Documentation

- [Full Documentation](./STATE_MANAGEMENT.md)
- [Integration Examples](../examples/state-management-integration.tsx)
- [Completion Summary](../STREAM_2_COMPLETION_SUMMARY.md)
