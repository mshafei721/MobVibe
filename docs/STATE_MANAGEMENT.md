# State Management System

Complete documentation for MobVibe's robust session state management system (Stream 2).

## Overview

The state management system provides:
- **Persistent sessions** across app restarts
- **Automatic recovery** from background/foreground transitions
- **Optimistic updates** for better UX
- **Backend synchronization** to prevent state drift
- **Message history** with efficient storage

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Session Store                         │
│  (Zustand + AsyncStorage persistence)                   │
│  - Current session state                                 │
│  - Message history                                       │
│  - Loading/error states                                  │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Message    │  │  Optimistic  │  │   Session    │
│   History    │  │   Updates    │  │     Sync     │
│              │  │              │  │              │
│ AsyncStorage │  │  In-memory   │  │  Periodic    │
│ persistence  │  │  tracking    │  │  polling     │
└──────────────┘  └──────────────┘  └──────────────┘

                ┌──────────────────┐
                │ Session Recovery │
                │      Hook        │
                │                  │
                │ App lifecycle    │
                │ monitoring       │
                └──────────────────┘
```

## Components

### 1. Session Store

**File:** `store/sessionStore.ts`

Central state management with Zustand and persistence.

**Key Features:**
- Persists to AsyncStorage automatically
- Keeps last 100 messages and 20 recent sessions
- Handles session lifecycle (start, pause, resume, stop)
- Manages message history
- Error handling and loading states

**Usage Example:**

```typescript
import { useSessionStore } from '@/store/sessionStore';

function ChatScreen() {
  const {
    currentSession,
    messages,
    loading,
    error,
    isThinking,
    startSession,
    pauseSession,
    sendMessage,
    addMessage
  } = useSessionStore();

  const handleStartSession = async () => {
    try {
      await startSession('project-id', 'Build a todo app');
    } catch (error) {
      console.error('Failed to start:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!currentSession) return;

    try {
      await sendMessage(currentSession.id, 'Add dark mode');
    } catch (error) {
      console.error('Failed to send:', error);
    }
  };

  return (
    <View>
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} />}

      <MessageList messages={messages} />

      {isThinking && <TypingIndicator />}

      <ChatInput onSend={handleSendMessage} />
    </View>
  );
}
```

### 2. Message History

**File:** `services/state/messageHistory.ts`

Efficient message persistence per session.

**Key Features:**
- Save/load message history
- Append operations for efficiency
- Batch operations
- Search functionality
- Storage management

**Usage Example:**

```typescript
import { MessageHistory } from '@/services/state';

// Save messages
await MessageHistory.save(sessionId, messages);

// Load messages
const messages = await MessageHistory.load(sessionId);

// Append single message
await MessageHistory.append(sessionId, newMessage);

// Append batch
await MessageHistory.appendBatch(sessionId, newMessages);

// Clear session history
await MessageHistory.clear(sessionId);

// Get storage info
const info = await MessageHistory.getStorageInfo();
console.log(`${info.totalMessages} messages across ${info.totalSessions} sessions`);
```

### 3. Session Recovery Hook

**File:** `hooks/useSessionRecovery.ts`

Handles app lifecycle and session reconnection.

**Key Features:**
- Auto-reconnect on app startup
- Handle background/foreground transitions
- Network connectivity monitoring
- Configurable recovery behavior

**Usage Example:**

```typescript
import { useSessionRecovery, useAutoSessionRecovery } from '@/hooks/useSessionRecovery';

// Simple auto-recovery (recommended)
function App() {
  useAutoSessionRecovery();

  return <YourApp />;
}

// Advanced usage with callbacks
function App() {
  const { isRecovering, recoverSession } = useSessionRecovery({
    autoReconnect: true,
    monitorNetwork: true,
    onRecoveryComplete: (sessionId) => {
      console.log('Recovered session:', sessionId);
    },
    onRecoveryError: (error) => {
      console.error('Recovery failed:', error);
    }
  });

  return (
    <View>
      {isRecovering && <LoadingOverlay />}
      <YourApp />
    </View>
  );
}
```

### 4. Optimistic Updates

**File:** `services/state/optimisticUpdates.ts`

Tracks pending operations with rollback capability.

**Key Features:**
- Track pending operations
- Automatic retry logic
- Stale operation cleanup
- Statistics and monitoring

**Usage Example:**

```typescript
import { optimisticUpdates } from '@/services/state';

// Add optimistic operation
const opId = optimisticUpdates.add({
  type: 'send_message',
  data: { sessionId, message }
});

try {
  // Perform actual operation
  await apiClient.sendMessage(sessionId, message);

  // Mark as complete
  optimisticUpdates.complete(opId);
} catch (error) {
  // Handle failure (will auto-retry if configured)
  const operation = optimisticUpdates.fail(opId, error);

  if (operation && operation.retryCount < maxRetries) {
    // Retry logic
  }
}

// Check pending operations
const pending = optimisticUpdates.getPending();
const hasPending = optimisticUpdates.hasPending();

// Get statistics
const stats = optimisticUpdates.getStats();
console.log(`${stats.total} pending operations, avg age: ${stats.averageAge}ms`);
```

### 5. Session Sync

**File:** `services/state/sessionSync.ts`

Periodic synchronization with backend.

**Key Features:**
- Configurable sync interval (default 30s)
- Status change detection
- Auto-stop on completion/failure
- Force sync capability

**Usage Example:**

```typescript
import { sessionSync } from '@/services/state';

// Start syncing
sessionSync.startSync(sessionId);

// Start with custom interval
sessionSync.startSync(sessionId, 60000); // 60 seconds

// Stop syncing
sessionSync.stopSync();

// Force immediate sync
await sessionSync.forceSync();

// Check sync status
const isActive = sessionSync.isSyncActive();
const currentId = sessionSync.getCurrentSessionId();

// Update interval
sessionSync.setInterval(45000); // 45 seconds

// Custom sync instance with callbacks
import { SessionSync } from '@/services/state';

const customSync = new SessionSync({
  intervalMs: 20000,
  onStatusChange: (oldStatus, newStatus) => {
    console.log(`Status changed: ${oldStatus} -> ${newStatus}`);
  },
  onSyncError: (error) => {
    console.error('Sync error:', error);
  }
});
```

## Integration Examples

### Complete Chat Screen

```typescript
import React, { useEffect } from 'react';
import { View, FlatList } from 'react-native';
import { useSessionStore } from '@/store/sessionStore';
import { useAutoSessionRecovery } from '@/hooks/useSessionRecovery';
import { sessionSync } from '@/services/state';
import { ChatInput, MessageBubble, TypingIndicator } from '@/components';

function ChatScreen({ projectId }: { projectId: string }) {
  // Auto-recovery on mount
  useAutoSessionRecovery();

  // State from store
  const {
    currentSession,
    messages,
    loading,
    error,
    isThinking,
    startSession,
    pauseSession,
    stopSession,
    sendMessage,
    clearError
  } = useSessionStore();

  // Start sync when session becomes active
  useEffect(() => {
    if (currentSession?.status === 'active') {
      sessionSync.startSync(currentSession.id);
    }

    return () => {
      sessionSync.stopSync();
    };
  }, [currentSession?.id, currentSession?.status]);

  const handleStart = async (prompt: string) => {
    try {
      await startSession(projectId, prompt);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleSend = async (message: string) => {
    if (!currentSession) return;

    try {
      await sendMessage(currentSession.id, message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {error && (
        <ErrorBanner message={error} onDismiss={clearError} />
      )}

      <FlatList
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={(item) => item.id}
      />

      {isThinking && <TypingIndicator />}

      <ChatInput
        onSend={handleSend}
        disabled={loading || !currentSession}
      />

      {!currentSession && (
        <StartButton onStart={handleStart} />
      )}

      {currentSession && (
        <SessionControls
          onPause={pauseSession}
          onStop={stopSession}
          loading={loading}
        />
      )}
    </View>
  );
}
```

### Session History Screen

```typescript
import React, { useEffect } from 'react';
import { View, FlatList } from 'react-native';
import { useSessionStore } from '@/store/sessionStore';
import { SessionCard } from '@/components';

function SessionHistoryScreen({ projectId }: { projectId: string }) {
  const {
    recentSessions,
    loading,
    fetchRecentSessions,
    loadSession
  } = useSessionStore();

  useEffect(() => {
    fetchRecentSessions(projectId);
  }, [projectId]);

  const handleSelectSession = async (sessionId: string) => {
    try {
      await loadSession(sessionId);
      // Navigate to chat screen
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  return (
    <View>
      {loading && <LoadingSpinner />}

      <FlatList
        data={recentSessions}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            onSelect={() => handleSelectSession(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}
```

## Best Practices

### 1. Session Lifecycle

```typescript
// ✅ Good: Clear session on unmount
useEffect(() => {
  return () => {
    if (isNavigatingAway) {
      clearCurrentSession();
    }
  };
}, []);

// ❌ Bad: Leave session active when not needed
```

### 2. Message Management

```typescript
// ✅ Good: Use addMessage for real-time events
eventStream.onThinking((data) => {
  addMessage({
    id: Date.now().toString(),
    role: 'assistant',
    content: data.message,
    timestamp: new Date(),
    type: 'thinking'
  });
});

// ❌ Bad: Manually push to messages array
```

### 3. Error Handling

```typescript
// ✅ Good: Clear errors after handling
const handleRetry = async () => {
  clearError();
  await startSession(projectId, prompt);
};

// ❌ Bad: Leave error in store indefinitely
```

### 4. Performance

```typescript
// ✅ Good: Use selectors for specific state
const loading = useSessionStore(state => state.loading);

// ❌ Bad: Subscribe to entire store
const store = useSessionStore();
```

## Testing

### Session Store Tests

```typescript
import { useSessionStore } from '@/store/sessionStore';

describe('SessionStore', () => {
  beforeEach(() => {
    // Reset store
    useSessionStore.setState({
      currentSession: null,
      messages: [],
      loading: false,
      error: null,
      isThinking: false
    });
  });

  it('should start a session', async () => {
    const { startSession } = useSessionStore.getState();

    await startSession('project-id', 'Build an app');

    const { currentSession, messages } = useSessionStore.getState();
    expect(currentSession).toBeTruthy();
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Build an app');
  });

  it('should handle errors gracefully', async () => {
    // Mock API failure
    const { startSession } = useSessionStore.getState();

    await expect(startSession('invalid', 'test')).rejects.toThrow();

    const { error, currentSession } = useSessionStore.getState();
    expect(error).toBeTruthy();
    expect(currentSession).toBeNull();
  });
});
```

## Performance Optimization

### Storage Limits

```typescript
// Store limits (configured in sessionStore.ts)
const MAX_MESSAGES = 100;      // Last 100 messages persisted
const MAX_RECENT_SESSIONS = 20; // Last 20 sessions kept

// Message history limits (configured in messageHistory.ts)
const MAX_MESSAGES_PER_SESSION = 500; // Per-session limit
```

### Sync Configuration

```typescript
// Adjust sync frequency based on session activity
if (session.status === 'active') {
  sessionSync.setInterval(15000); // 15s for active sessions
} else {
  sessionSync.setInterval(60000); // 60s for paused sessions
}
```

## Troubleshooting

### Session Not Recovering

**Problem:** Session doesn't reconnect after app restart.

**Solution:**
1. Check if `useAutoSessionRecovery()` is called in root component
2. Verify AsyncStorage permissions
3. Check network connectivity
4. Review console logs for errors

### Messages Not Persisting

**Problem:** Messages disappear after app restart.

**Solution:**
1. Verify Zustand persistence is configured
2. Check AsyncStorage write permissions
3. Ensure messages array isn't exceeding limits
4. Check for serialization errors (Date objects)

### High Memory Usage

**Problem:** App using too much memory.

**Solution:**
1. Reduce `MAX_MESSAGES` in store config
2. Clear old message history: `MessageHistory.clearAll()`
3. Limit session history display
4. Use pagination for message lists

## Migration Guide

### From Old Store

```typescript
// Old (basic store)
const { currentSession, setCurrentSession } = useSessionStore();

// New (enhanced store)
const { currentSession, startSession, pauseSession } = useSessionStore();

// Old: Manual session management
setCurrentSession(session);

// New: Automatic lifecycle management
await startSession(projectId, prompt);
```

## Future Enhancements

Planned improvements:
- Message streaming support
- Offline queue for messages
- Session templates
- Advanced search and filtering
- Export/import session history
- Multi-session support (tabs)
- Voice message support
- Rich media message types

## Related Documentation

- [API Client Documentation](./API_CLIENT.md)
- [Event Stream Documentation](./EVENT_STREAM.md)
- [Session Service Documentation](./SESSION_SERVICE.md)
- [Real-time Hooks Documentation](./REALTIME_HOOKS.md)
