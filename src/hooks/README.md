# Real-time Event Hooks

Real-time React hooks for MobVibe that connect to backend events via Supabase Realtime.

## Overview

These hooks provide a simple way to subscribe to session events and update the UI in real-time. They handle subscription lifecycle, cleanup, and state management automatically.

## Available Hooks

### useRealtimeMessages

Converts backend events into chat messages for the UI.

```tsx
import { useRealtimeMessages } from '@/hooks';

function ChatScreen({ sessionId }: { sessionId: string }) {
  const { messages, isThinking, addUserMessage } = useRealtimeMessages(sessionId);

  return (
    <ChatInterface
      messages={messages}
      isThinking={isThinking}
      onSendMessage={addUserMessage}
    />
  );
}
```

**Features:**
- Automatically subscribes to session events
- Converts events to typed messages
- Manages thinking indicator
- Cleans up on unmount
- Filters out duplicate thinking messages

### useFileChanges

Tracks file operations (create, update, delete) in real-time.

```tsx
import { useFileChanges } from '@/hooks';

function FileExplorer({ sessionId }: { sessionId: string }) {
  const { fileChanges, fileTree, getFile } = useFileChanges(sessionId);

  return (
    <View>
      {Object.keys(fileTree).map(path => (
        <FileItem key={path} path={path} content={getFile(path)} />
      ))}
    </View>
  );
}
```

**Features:**
- Tracks all file changes
- Maintains current file tree
- Get file content by path
- History of changes (last 100)

### useTerminalOutput

Streams terminal output in real-time.

```tsx
import { useTerminalOutput } from '@/hooks';

function Terminal({ sessionId }: { sessionId: string }) {
  const { lines, isExecuting, clearTerminal } = useTerminalOutput(sessionId);

  return (
    <TerminalView
      lines={lines}
      isExecuting={isExecuting}
      onClear={clearTerminal}
    />
  );
}
```

**Features:**
- Real-time terminal output
- Auto-detects execution state
- Limits lines (default 1000)
- Clear terminal function
- Get recent output

### useSessionProgress

Tracks session status and progress.

```tsx
import { useSessionProgress } from '@/hooks';

function SessionStatus({ sessionId }: { sessionId: string }) {
  const { status, progress, currentTask, isActive } = useSessionProgress(sessionId);

  return (
    <View>
      <Badge status={status} />
      {progress && <ProgressBar value={progress} />}
      <Text>{currentTask}</Text>
    </View>
  );
}
```

**Features:**
- Infers status from events
- Progress percentage (when available)
- Current task description
- Convenience flags (isActive, isCompleted, hasError)

### usePreviewReady

Detects when preview is ready.

```tsx
import { usePreviewReady } from '@/hooks';

function PreviewTab({ sessionId }: { sessionId: string }) {
  const { previewUrl, isReady } = usePreviewReady(sessionId);

  if (!isReady) {
    return <Text>Preparing preview...</Text>;
  }

  return <WebView source={{ uri: previewUrl }} />;
}
```

**Features:**
- Automatic haptic feedback
- Preview URL
- Ready state
- Reset function

## Helper Hooks

### useFileHistory

Get changes for a specific file:

```tsx
const { history, latestChange } = useFileHistory(sessionId, 'app.tsx');
```

### useTerminalErrors

Get only stderr output:

```tsx
const { errors, hasErrors, errorCount } = useTerminalErrors(sessionId);
```

### useSessionLoading

Simple loading state:

```tsx
const isLoading = useSessionLoading(sessionId);
```

### useSessionStatusMessage

Human-readable status message:

```tsx
const statusMessage = useSessionStatusMessage(sessionId);
```

### usePreviewReadyOnce

One-time notification:

```tsx
const hasNotified = usePreviewReadyOnce(sessionId);
```

## Notification Manager

Centralized service for haptic feedback and notifications.

```tsx
import { NotificationManager } from '@/services/realtime';

// File operations
NotificationManager.fileCreated('app.tsx');
NotificationManager.fileUpdated('app.tsx');
NotificationManager.fileDeleted('app.tsx');

// Terminal
NotificationManager.terminalSuccess();
NotificationManager.terminalError('Build failed');

// Session
NotificationManager.sessionCompleted('Your app is ready!');
NotificationManager.sessionError('Session failed');

// Preview
NotificationManager.previewReady();

// Generic
NotificationManager.success('Operation complete');
NotificationManager.error('Something went wrong');
NotificationManager.warning('Be careful');
NotificationManager.info('FYI');

// Confirmations
NotificationManager.confirm(
  'Delete File',
  'Are you sure?',
  () => deleteFile(),
  () => console.log('Cancelled')
);

NotificationManager.confirmDestructive(
  'Stop Session',
  'This will terminate the session',
  'Stop',
  () => stopSession()
);
```

## Best Practices

### 1. Always Clean Up

Hooks automatically clean up subscriptions on unmount, but if you manually subscribe, always unsubscribe:

```tsx
useEffect(() => {
  const unsubscribe = sessionService.onThinking((data) => {
    // Handle event
  });

  return () => unsubscribe();
}, [sessionId]);
```

### 2. Use Functional Updates

Always use functional updates when updating arrays:

```tsx
// Good
setMessages(prev => [...prev, newMessage]);

// Bad
setMessages([...messages, newMessage]);
```

### 3. Limit History

Hooks automatically limit history to prevent memory issues:
- Messages: unlimited (but thinking messages are removed)
- File changes: 100 most recent
- Terminal output: 1000 lines (configurable)

### 4. Check Session ID

All hooks check for undefined sessionId and skip subscription:

```tsx
const { messages } = useRealtimeMessages(sessionId); // Safe even if undefined
```

### 5. Use Helper Hooks

Don't recreate logic, use the helper hooks:

```tsx
// Good
const isLoading = useSessionLoading(sessionId);

// Bad
const { status } = useSessionProgress(sessionId);
const isLoading = status === 'active' || status === 'thinking';
```

## Performance

### Virtual Lists

Use virtual lists for long message/terminal output:

```tsx
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={messages}
  renderItem={({ item }) => <MessageBubble message={item} />}
  estimatedItemSize={100}
/>
```

### React.memo

Memoize message components:

```tsx
const MessageBubble = React.memo(({ message }) => {
  // Render message
});
```

### Debounce

Debounce rapid events if needed:

```tsx
import { useThrottledCallback } from '@/hooks';

const handleTerminalOutput = useThrottledCallback((data) => {
  // Handle output
}, 100);
```

## Testing

### Test Hook in Isolation

```tsx
import { renderHook } from '@testing-library/react-hooks';
import { useRealtimeMessages } from '@/hooks';

test('subscribes to session events', () => {
  const { result } = renderHook(() =>
    useRealtimeMessages('test-session-id')
  );

  expect(result.current.messages).toEqual([]);
  expect(result.current.isThinking).toBe(false);
});
```

### Test in Component

```tsx
export function TestRealtimeScreen({ sessionId }: { sessionId: string }) {
  const { messages, isThinking } = useRealtimeMessages(sessionId);

  return (
    <ScrollView>
      {isThinking && <Text>Thinking...</Text>}
      {messages.map(m => (
        <Text key={m.id}>{m.content}</Text>
      ))}
    </ScrollView>
  );
}
```

## Troubleshooting

### Events Not Received

1. Check session ID is valid
2. Verify Supabase connection
3. Check session_events table permissions
4. Review console logs for subscription status

### Memory Leaks

1. Ensure hooks are properly cleaned up
2. Check for infinite loops in useEffect
3. Verify functional updates are used
4. Monitor component unmounting

### Performance Issues

1. Use virtual lists for long lists
2. Memoize components
3. Debounce rapid events
4. Check for unnecessary re-renders

## Integration with Other Agents

### UI Agent (Stream 2)

Will use these hooks in chat interface:

```tsx
const { messages, isThinking } = useRealtimeMessages(sessionId);
const { status } = useSessionProgress(sessionId);
```

### STATE Agent (Stream 2)

Will coordinate with hooks for persistence:

```tsx
// STATE saves to async storage
// Hooks provide real-time updates
```

### File Explorer (Stream 3)

Will use file hooks:

```tsx
const { fileTree, fileChanges } = useFileChanges(sessionId);
```

### Terminal Viewer (Stream 3)

Will use terminal hooks:

```tsx
const { lines, isExecuting } = useTerminalOutput(sessionId);
```

### Preview Tab (Stream 4)

Will use preview hooks:

```tsx
const { previewUrl, isReady } = usePreviewReady(sessionId);
```
