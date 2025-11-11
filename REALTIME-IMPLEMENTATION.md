# Real-time Event System Implementation

## Overview

Complete implementation of the real-time event handling system for MobVibe. This system connects the backend event stream to the UI through a set of React hooks that automatically manage subscriptions and state.

## Architecture

```
Backend Events (Supabase Realtime)
        ↓
  EventStream Service
        ↓
  SessionService (Convenience Layer)
        ↓
  Real-time Hooks (React)
        ↓
    UI Components
```

## Implemented Components

### 1. Core Hooks

#### `useRealtimeMessages` (`src/hooks/useRealtimeMessages.ts`)
- Converts backend events to chat messages
- Manages thinking indicator
- Filters duplicate thinking messages
- Automatically cleans up subscriptions
- **Exports:** `Message`, `UseRealtimeMessagesReturn`

#### `useFileChanges` (`src/hooks/useFileChanges.ts`)
- Tracks file operations (create, update, delete)
- Maintains current file tree
- Provides file history
- Limits to 100 recent changes
- **Exports:** `FileChange`, `FileTree`, `UseFileChangesReturn`, `useFileHistory`

#### `useTerminalOutput` (`src/hooks/useTerminalOutput.ts`)
- Streams terminal output in real-time
- Auto-detects execution state (2s timeout)
- Configurable line limit (default 1000)
- Clear terminal function
- **Exports:** `TerminalLine`, `UseTerminalOutputReturn`, `useTerminalErrors`

#### `useSessionProgress` (`src/hooks/useSessionProgress.ts`)
- Tracks session status
- Infers progress from events
- Provides convenience flags (isActive, isCompleted, hasError)
- Current task description
- **Exports:** `SessionStatus`, `ProgressUpdate`, `UseSessionProgressReturn`, `useSessionLoading`, `useSessionStatusMessage`

#### `usePreviewReady` (`src/hooks/usePreviewReady.ts`)
- Detects when preview is ready
- Provides preview URL
- Automatic haptic feedback
- One-time notification helper
- **Exports:** `UsePreviewReadyReturn`, `usePreviewReadyOnce`

### 2. Notification Manager

#### `NotificationManager` (`services/realtime/notificationManager.ts`)
- Centralized haptic feedback system
- Alert dialogs for important events
- File operation notifications
- Terminal notifications
- Session status notifications
- Generic success/error/warning/info methods
- Confirmation dialogs (standard and destructive)
- **Exports:** `NotificationManager`, `HapticType`

### 3. Documentation & Examples

#### `src/hooks/README.md`
- Comprehensive documentation
- Usage examples for all hooks
- Best practices
- Performance tips
- Troubleshooting guide
- Integration patterns

#### `src/screens/TestRealtimeScreen.tsx`
- Example screen demonstrating all hooks
- Shows real-time updates
- Connect/disconnect functionality
- Clear functions for each hook
- Status indicators

## File Structure

```
src/
├── hooks/
│   ├── useRealtimeMessages.ts    # Chat message hook
│   ├── useFileChanges.ts          # File operations hook
│   ├── useTerminalOutput.ts       # Terminal streaming hook
│   ├── useSessionProgress.ts      # Session status hook
│   ├── usePreviewReady.ts         # Preview detection hook
│   ├── index.ts                   # Centralized exports
│   └── README.md                  # Documentation
├── screens/
│   └── TestRealtimeScreen.tsx     # Test/example screen
services/
└── realtime/
    ├── notificationManager.ts     # Haptic feedback service
    └── index.ts                   # Centralized exports
```

## Event Mapping

| Backend Event | Hook | UI Update |
|--------------|------|-----------|
| `thinking` | useRealtimeMessages | Shows thinking message |
| `terminal` | useTerminalOutput | Adds terminal line |
| `file_change` | useFileChanges | Updates file tree + adds to history |
| `preview_ready` | usePreviewReady | Sets preview URL + haptic feedback |
| `completion` | useSessionProgress | Sets status to completed |
| `error` | All hooks | Updates respective states |

## Usage Examples

### Chat Interface
```tsx
import { useRealtimeMessages } from '@/hooks';

function ChatScreen({ sessionId }: Props) {
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

### File Explorer
```tsx
import { useFileChanges } from '@/hooks';

function FileExplorer({ sessionId }: Props) {
  const { fileTree } = useFileChanges(sessionId);

  return (
    <FlatList
      data={Object.keys(fileTree)}
      renderItem={({ item }) => <FileItem path={item} />}
    />
  );
}
```

### Terminal Viewer
```tsx
import { useTerminalOutput } from '@/hooks';

function Terminal({ sessionId }: Props) {
  const { lines, isExecuting } = useTerminalOutput(sessionId);

  return (
    <FlashList
      data={lines}
      renderItem={({ item }) => <TerminalLine line={item} />}
    />
  );
}
```

### Status Badge
```tsx
import { useSessionProgress } from '@/hooks';

function StatusBadge({ sessionId }: Props) {
  const { status, currentTask } = useSessionProgress(sessionId);

  return <Badge status={status}>{currentTask}</Badge>;
}
```

### Preview Tab
```tsx
import { usePreviewReady } from '@/hooks';

function PreviewTab({ sessionId }: Props) {
  const { previewUrl, isReady } = usePreviewReady(sessionId);

  if (!isReady) return <Loading />;
  return <WebView source={{ uri: previewUrl }} />;
}
```

## Integration Points

### With UI Agent (Stream 2)
UI agent will use these hooks in:
- Chat interface component
- Message rendering
- Status indicators

### With STATE Agent (Stream 2)
STATE agent coordinates with hooks for:
- Message persistence
- Session state sync
- Offline queue management

### With File Explorer (Stream 3)
File explorer uses:
- `useFileChanges` for file tree
- File history for version tracking
- File content retrieval

### With Terminal Viewer (Stream 3)
Terminal viewer uses:
- `useTerminalOutput` for output streaming
- Execution state for indicators
- Clear terminal function

### With Preview Tab (Stream 4)
Preview tab uses:
- `usePreviewReady` for ready state
- Preview URL for WebView
- Haptic feedback on ready

## Performance Considerations

### Memory Management
- Messages: Unlimited (thinking messages auto-removed)
- File changes: Limited to 100 recent
- Terminal output: Limited to 1000 lines (configurable)

### Optimization Techniques
- Functional updates for arrays (prevents stale closures)
- Auto-cleanup on unmount
- Timeout-based execution detection
- Virtual lists for long lists (recommended)

### Best Practices
1. Use React.memo for message components
2. Use FlashList/FlatList for long lists
3. Debounce rapid events if needed
4. Check sessionId before subscribing

## Testing

### Manual Testing
Use `TestRealtimeScreen` to verify:
1. Events are received in real-time
2. State updates correctly
3. Cleanup works on unmount
4. No memory leaks

### Integration Testing
1. Start a session
2. Send events from backend
3. Verify UI updates
4. Check haptic feedback
5. Test disconnect/reconnect

### Performance Testing
1. Send 1000+ terminal lines
2. Create 100+ files
3. Verify no lag or memory issues
4. Check virtual list performance

## Success Criteria

All deliverables complete:
- ✅ useRealtimeMessages hook with message conversion
- ✅ useFileChanges hook with file tree tracking
- ✅ useTerminalOutput hook with streaming
- ✅ useSessionProgress hook with status tracking
- ✅ usePreviewReady hook with haptic feedback
- ✅ NotificationManager service for alerts
- ✅ Comprehensive documentation
- ✅ Example test screen
- ✅ TypeScript types exported
- ✅ No compilation errors

## Next Steps for Integration

1. **UI Agent** (Stream 2): Use hooks in chat interface
2. **STATE Agent** (Stream 2): Coordinate state persistence
3. **File Explorer** (Stream 3): Use file hooks for tree view
4. **Terminal Viewer** (Stream 3): Use terminal hook for output
5. **Preview Tab** (Stream 4): Use preview hook for WebView

## Troubleshooting

### Events Not Received
- Check session ID is valid
- Verify Supabase connection
- Review session_events table permissions
- Check console logs for subscription status

### Memory Issues
- Verify cleanup functions are called
- Check for infinite loops
- Use virtual lists for long lists
- Monitor component unmounting

### Performance Issues
- Use React.memo for components
- Debounce rapid events
- Check for unnecessary re-renders
- Use functional updates

## Dependencies

- React (hooks)
- Supabase (realtime)
- react-native-haptic-feedback (haptic feedback)
- Existing services (sessionService, eventStream)

## Notes

- All hooks automatically handle subscription lifecycle
- Hooks are safe to use with undefined sessionId
- All state updates use functional updates
- No external state management required (self-contained)
- TypeScript types fully exported
- Compatible with React Native and web
