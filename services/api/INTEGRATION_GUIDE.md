# API Integration Guide

Step-by-step guide for integrating the API services into your app.

## Step 1: Initialize Network Monitoring

In your app's root component (e.g., `app/_layout.tsx`):

```typescript
import { useEffect } from 'react';
import { initializeNetworkListener } from '@/store/connectionStore';

export default function RootLayout() {
  useEffect(() => {
    // Initialize network status monitoring
    const unsubscribe = initializeNetworkListener();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    // Your app layout
  );
}
```

## Step 2: Create a Session Screen

Example screen that creates and monitors a coding session:

```typescript
// app/session/[id].tsx
import { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { sessionService } from '@/services/api';
import { useConnectionStore } from '@/store/connectionStore';
import type { Session, ThinkingEventData, TerminalEventData } from '@/services/api';

export default function SessionScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [thinking, setThinking] = useState('');
  const [terminal, setTerminal] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOnline = useConnectionStore(state => state.isOnline);

  // Create session
  const startSession = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await sessionService.createSession(
        projectId,
        'Build a todo app with React Native'
      );

      setSession(response.session);
      console.log('Session created:', response.session.id);
      console.log('Job ID:', response.job_id);
    } catch (err: any) {
      console.error('Failed to create session:', err);
      setError(err.getUserMessage?.() || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Pause session
  const pauseSession = async () => {
    if (!session) return;

    try {
      const updated = await sessionService.pauseSession(session.id);
      setSession(updated);
    } catch (err: any) {
      setError(err.getUserMessage?.() || err.message);
    }
  };

  // Resume session
  const resumeSession = async () => {
    if (!session) return;

    try {
      const updated = await sessionService.resumeSession(session.id);
      setSession(updated);
    } catch (err: any) {
      setError(err.getUserMessage?.() || err.message);
    }
  };

  // Stop session
  const stopSession = async () => {
    if (!session) return;

    try {
      await sessionService.stopSession(session.id);
      router.back();
    } catch (err: any) {
      setError(err.getUserMessage?.() || err.message);
    }
  };

  // Set up event listeners
  useEffect(() => {
    const unsubscribers = [
      // Thinking events
      sessionService.onThinking((data: ThinkingEventData) => {
        setThinking(data.message);
      }),

      // Terminal output
      sessionService.onTerminalOutput((data: TerminalEventData) => {
        setTerminal(prev => [...prev, data.output]);
      }),

      // File changes
      sessionService.onFileChange((data) => {
        console.log('File changed:', data.path, data.action);
      }),

      // Preview ready
      sessionService.onPreviewReady((data) => {
        console.log('Preview ready:', data.url);
      }),

      // Completion
      sessionService.onCompletion((data) => {
        console.log('Session completed:', data.message);
        setThinking('');
      }),

      // Errors
      sessionService.onError((data) => {
        setError(data.message);
      }),
    ];

    return () => {
      // Clean up all listeners
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionService.disconnect();
    };
  }, []);

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {/* Offline indicator */}
      {!isOnline && (
        <View style={{ padding: 12, backgroundColor: '#fef3c7', borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ color: '#92400e' }}>You're offline. Reconnecting...</Text>
        </View>
      )}

      {/* Error message */}
      {error && (
        <View style={{ padding: 12, backgroundColor: '#fee2e2', borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ color: '#991b1b' }}>{error}</Text>
        </View>
      )}

      {/* Session controls */}
      {!session ? (
        <Button
          title="Start Session"
          onPress={startSession}
          disabled={loading || !isOnline}
        />
      ) : (
        <View style={{ gap: 8 }}>
          <Text>Session: {session.id}</Text>
          <Text>Status: {session.status}</Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {session.status === 'active' && (
              <Button title="Pause" onPress={pauseSession} />
            )}
            {session.status === 'paused' && (
              <Button title="Resume" onPress={resumeSession} />
            )}
            <Button title="Stop" onPress={stopSession} color="red" />
          </View>
        </View>
      )}

      {/* Loading indicator */}
      {loading && <ActivityIndicator size="large" style={{ marginTop: 16 }} />}

      {/* Thinking status */}
      {thinking && (
        <View style={{ marginTop: 16, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
          <Text style={{ fontWeight: '600', marginBottom: 4 }}>AI is thinking...</Text>
          <Text>{thinking}</Text>
        </View>
      )}

      {/* Terminal output */}
      {terminal.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>Terminal Output:</Text>
          <View style={{ padding: 12, backgroundColor: '#1f2937', borderRadius: 8 }}>
            {terminal.map((line, i) => (
              <Text key={i} style={{ color: '#f9fafb', fontFamily: 'monospace', fontSize: 12 }}>
                {line}
              </Text>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
```

## Step 3: List Sessions

Example screen that lists all sessions for a project:

```typescript
// app/sessions/list.tsx
import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@/services/api';
import type { Session } from '@/services/api';

export default function SessionsListScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await apiClient.listSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderSession = ({ item }: { item: Session }) => (
    <TouchableOpacity
      style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}
      onPress={() => router.push(`/session/${item.id}`)}
    >
      <Text style={{ fontWeight: '600' }}>{item.initial_prompt}</Text>
      <Text style={{ color: '#6b7280', marginTop: 4 }}>
        Status: {item.status} • {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading sessions...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sessions}
      renderItem={renderSession}
      keyExtractor={item => item.id}
      ListEmptyComponent={
        <View style={{ padding: 32, alignItems: 'center' }}>
          <Text style={{ color: '#6b7280' }}>No sessions yet</Text>
        </View>
      }
    />
  );
}
```

## Step 4: Show Usage Stats

Example component that displays usage statistics:

```typescript
// components/UsageStats.tsx
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { apiClient } from '@/services/api';
import type { UsageStats } from '@/services/api';

export function UsageStats() {
  const [usage, setUsage] = useState<UsageStats | null>(null);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const data = await apiClient.getUsage();
      setUsage(data);
    } catch (err) {
      console.error('Failed to load usage:', err);
    }
  };

  if (!usage) return null;

  const sessionsPercent = (usage.sessions_used / usage.sessions_limit) * 100;

  return (
    <View style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
      <Text style={{ fontWeight: '600', marginBottom: 8 }}>
        Usage ({usage.tier})
      </Text>

      <View style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
          Sessions: {usage.sessions_used} / {usage.sessions_limit}
        </Text>
        <View style={{ height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 }}>
          <View
            style={{
              width: `${sessionsPercent}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              borderRadius: 2,
            }}
          />
        </View>
      </View>

      <Text style={{ fontSize: 12, color: '#6b7280' }}>
        Resets: {new Date(usage.reset_at).toLocaleDateString()}
      </Text>
    </View>
  );
}
```

## Step 5: Reconnect on App Resume

Handle session reconnection when app comes back from background:

```typescript
// app/_layout.tsx
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { sessionService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_SESSION_KEY = '@active_session_id';

export default function RootLayout() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Restore active session on app start
    restoreActiveSession();

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      // App came to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        restoreActiveSession();
      }

      // App went to background
      if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // Disconnect (but don't stop) the session
        sessionService.disconnect();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      sessionService.cleanup();
    };
  }, []);

  const restoreActiveSession = async () => {
    try {
      const sessionId = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
      if (sessionId) {
        console.log('Reconnecting to session:', sessionId);
        sessionService.reconnectToSession(sessionId);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    }
  };

  return (
    // Your app layout
  );
}

// Helper: Save active session ID
export async function saveActiveSession(sessionId: string) {
  await AsyncStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
}

// Helper: Clear active session ID
export async function clearActiveSession() {
  await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
}
```

## Testing

### Manual Testing

1. Start the app
2. Create a session
3. Watch for real-time events in the console
4. Test pause/resume/stop functionality
5. Put app in background and bring back to test reconnection

### Verify Backend Connection

```bash
# Test backend health
curl https://mobvibe-api-divine-silence-9977.fly.dev/health

# Expected response:
# {"status":"healthy","timestamp":"2025-11-11T..."}
```

### Verify Supabase Realtime

```typescript
// Add to your session screen for debugging
useEffect(() => {
  const unsubscribe = sessionService.onAnyEvent((event) => {
    console.log('Event received:', {
      type: event.event_type,
      sessionId: event.session_id,
      data: event.data,
    });
  });

  return unsubscribe;
}, []);
```

## Common Issues

### Events not received

**Problem:** Session created but no events coming through

**Solutions:**
1. Check Supabase Realtime is enabled on `session_events` table
2. Verify session ID is correct
3. Check network connectivity
4. Look for connection errors in console

### Session creation fails

**Problem:** `createSession()` throws error

**Solutions:**
1. Check if user is authenticated: `supabase.auth.getSession()`
2. Verify `EXPO_PUBLIC_API_URL` is set in `.env`
3. Check backend is running: `fly status -a mobvibe-api-divine-silence-9977`
4. Look at backend logs: `fly logs -a mobvibe-api-divine-silence-9977`

### Authentication errors (401)

**Problem:** API returns 401 Unauthorized

**Solutions:**
1. User needs to log in again
2. Check Supabase session is valid
3. Verify JWT token hasn't expired

## Next Steps

1. **Add offline queue** (optional): Implement `offlineQueue.ts` for queuing operations when offline
2. **Add optimistic updates**: Update UI immediately before API call completes
3. **Add session persistence**: Save session state to AsyncStorage for recovery
4. **Add analytics**: Track session events for analytics
5. **Add error reporting**: Integrate Sentry for error tracking

## Resources

- API Service Documentation: `services/api/README.md`
- Backend API Documentation: `backend/worker/README.md`
- Database Schema: `supabase/migrations/`
- Type Definitions: `services/api/types.ts`
