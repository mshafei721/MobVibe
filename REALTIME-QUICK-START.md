# Real-time Hooks - Quick Start Guide

## Installation

All hooks are ready to use - no installation needed!

## Import

```typescript
import {
  useRealtimeMessages,
  useFileChanges,
  useTerminalOutput,
  useSessionProgress,
  usePreviewReady,
} from '@/hooks';

import { NotificationManager } from '@/services/realtime';
```

## Basic Usage

### 1. Chat Messages

```typescript
function ChatScreen({ sessionId }: Props) {
  const { messages, isThinking, addUserMessage } = useRealtimeMessages(sessionId);

  return (
    <FlatList
      data={messages}
      renderItem={({ item }) => <MessageBubble message={item} />}
    />
  );
}
```

### 2. File Explorer

```typescript
function FileExplorer({ sessionId }: Props) {
  const { fileTree, fileChanges } = useFileChanges(sessionId);

  return (
    <FlatList
      data={Object.keys(fileTree)}
      renderItem={({ item }) => <FileItem path={item} content={fileTree[item]} />}
    />
  );
}
```

### 3. Terminal Output

```typescript
function Terminal({ sessionId }: Props) {
  const { lines, isExecuting, clearTerminal } = useTerminalOutput(sessionId);

  return (
    <>
      {isExecuting && <Badge>Executing...</Badge>}
      <FlatList
        data={lines}
        renderItem={({ item }) => <TerminalLine line={item} />}
      />
      <Button onPress={clearTerminal}>Clear</Button>
    </>
  );
}
```

### 4. Session Status

```typescript
function StatusBar({ sessionId }: Props) {
  const { status, currentTask, isActive } = useSessionProgress(sessionId);

  return (
    <HStack>
      <Badge status={status} />
      {isActive && <ActivityIndicator />}
      <Text>{currentTask}</Text>
    </HStack>
  );
}
```

### 5. Preview

```typescript
function Preview({ sessionId }: Props) {
  const { previewUrl, isReady } = usePreviewReady(sessionId);

  if (!isReady) return <Text>Preparing preview...</Text>;
  return <WebView source={{ uri: previewUrl }} />;
}
```

## Helper Hooks

```typescript
// Simple loading state
const isLoading = useSessionLoading(sessionId);

// Human-readable status
const statusMessage = useSessionStatusMessage(sessionId);

// File history
const { history } = useFileHistory(sessionId, 'app.tsx');

// Terminal errors only
const { errors, hasErrors } = useTerminalErrors(sessionId);

// One-time preview notification
const hasNotified = usePreviewReadyOnce(sessionId);
```

## Notifications

```typescript
// File operations
NotificationManager.fileCreated('app.tsx');
NotificationManager.fileUpdated('app.tsx');
NotificationManager.fileDeleted('app.tsx');

// Session events
NotificationManager.sessionCompleted('Your app is ready!');
NotificationManager.sessionError('Build failed');

// Preview
NotificationManager.previewReady();

// Generic
NotificationManager.success('Done!');
NotificationManager.error('Something went wrong');

// Confirmation
NotificationManager.confirm(
  'Delete File',
  'Are you sure?',
  () => deleteFile()
);
```

## Type Definitions

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type: 'text' | 'code' | 'thinking' | 'error';
  metadata?: {
    language?: string;
    fileName?: string;
    eventType?: string;
  };
}

interface FileChange {
  id: string;
  type: 'created' | 'updated' | 'deleted';
  path: string;
  content?: string;
  timestamp: Date;
}

interface TerminalLine {
  id: string;
  content: string;
  type: 'stdout' | 'stderr';
  timestamp: Date;
}

type SessionStatus =
  | 'active'
  | 'thinking'
  | 'executing'
  | 'paused'
  | 'completed'
  | 'error';
```

## Best Practices

### ✅ DO

```typescript
// Use functional updates
setMessages(prev => [...prev, newMessage]);

// Check for undefined sessionId
const { messages } = useRealtimeMessages(sessionId); // Safe even if undefined

// Use virtual lists for performance
<FlashList data={messages} renderItem={...} />

// Memoize components
const MessageBubble = React.memo(({ message }) => ...);
```

### ❌ DON'T

```typescript
// Don't use non-functional updates
setMessages([...messages, newMessage]); // Bad

// Don't forget cleanup (hooks do it automatically)
// No need to manually unsubscribe

// Don't use regular FlatList for 1000+ items
<FlatList data={longList} /> // Use FlashList instead
```

## Troubleshooting

### Events not received?
1. Check session ID is valid
2. Verify Supabase connection
3. Check console logs for subscription status

### Memory issues?
1. Hooks auto-limit history (100 files, 1000 terminal lines)
2. Use virtual lists for long lists
3. Check for infinite loops

### Performance issues?
1. Use React.memo for components
2. Use FlashList/FlatList for lists
3. Debounce rapid updates if needed

## Full Example

```typescript
import { useRealtimeMessages, useSessionProgress, usePreviewReady } from '@/hooks';

function CodingSession({ sessionId }: Props) {
  const { messages, isThinking } = useRealtimeMessages(sessionId);
  const { status, currentTask } = useSessionProgress(sessionId);
  const { isReady, previewUrl } = usePreviewReady(sessionId);

  return (
    <View>
      {/* Status Bar */}
      <StatusBar status={status} task={currentTask} />

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />

      {/* Thinking Indicator */}
      {isThinking && <ThinkingIndicator />}

      {/* Preview Button */}
      {isReady && (
        <Button onPress={() => openPreview(previewUrl)}>
          View Preview
        </Button>
      )}
    </View>
  );
}
```

## Documentation

- **Detailed docs:** `src/hooks/README.md`
- **Architecture:** `REALTIME-IMPLEMENTATION.md`
- **Test screen:** `src/screens/TestRealtimeScreen.tsx`

## Support

Check console logs for debugging:
```typescript
[useRealtimeMessages] Subscribing to session: xxx
[useRealtimeMessages] Thinking event: { message: "..." }
[useRealtimeMessages] Cleaning up subscriptions
```

---

**Ready to build!** All hooks are tested and production-ready. 🚀
