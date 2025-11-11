# Coding Session Components

Chat-style coding interface components for MobVibe. These components enable users to interact with Claude AI to build their apps.

## Components

### MessageBubble
**File:** `MessageBubble.tsx`

Displays individual chat messages with different styles for user/AI messages.

**Features:**
- User messages: right-aligned, blue background
- AI messages: left-aligned, gray background
- Thinking messages: animated dots with message text
- Code messages: delegated to CodeBlock component
- Timestamp display with relative time (e.g., "2m ago")

**Props:**
```typescript
interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'thinking';
  language?: string;
  fileName?: string;
}
```

### CodeBlock
**File:** `CodeBlock.tsx`

Syntax-highlighted code display with copy functionality.

**Features:**
- Syntax highlighting for TypeScript, JavaScript, CSS, JSON, Markdown, etc.
- Copy to clipboard button
- Language badge
- File name header (optional)
- Horizontal scrolling for long lines
- Line numbers
- Dark theme styling

**Props:**
```typescript
interface CodeBlockProps {
  code: string;
  language: string;
  fileName?: string;
}
```

### InputBar
**File:** `InputBar.tsx`

Multi-line message input with character counter and send button.

**Features:**
- Multi-line input (grows with content, max 5 lines)
- Send button enabled only when text is not empty
- Character counter (shown when approaching 2000 char limit)
- Input clears after send
- Haptic feedback on send (iOS)
- Disabled state during AI processing

**Props:**
```typescript
interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

### SessionControls
**File:** `SessionControls.tsx`

Session status display and control buttons.

**Features:**
- Status badge with color-coded indicators:
  - Active: green
  - Paused: yellow
  - Pending: blue
  - Completed: gray
  - Failed: red
- Pause/Resume button (when session active/paused)
- Stop button with confirmation dialog
- Contextual button visibility based on session status

**Props:**
```typescript
interface SessionControlsProps {
  sessionId: string;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'failed' | 'expired';
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}
```

### EmptySessionState
**File:** `EmptySessionState.tsx`

Empty state shown when no session is active.

**Features:**
- Project name and template icon display
- Suggested example prompts based on template type
- Prompt chips as clickable buttons
- "Start coding" call-to-action
- Template-specific suggestions

**Props:**
```typescript
interface EmptySessionStateProps {
  projectId: string;
  projectName?: string;
  templateId?: string;
  onStartSession: (prompt: string) => void;
}
```

## Main Screen

### CodeScreen
**File:** `app/(tabs)/code.tsx`

Main chat-style coding interface.

**Layout:**
```
┌─────────────────────────────┐
│ Header: Project Name        │
├─────────────────────────────┤
│ Session Controls (if active)│
├─────────────────────────────┤
│                             │
│   Chat Messages Area        │
│   (ScrollView)              │
│   - User prompts            │
│   - AI responses            │
│   - Thinking indicators     │
│   - Code snippets           │
│                             │
├─────────────────────────────┤
│ Input Bar                   │
│ [Text Input] [Send Button]  │
└─────────────────────────────┘
```

**Features:**
- Auto-scroll to latest message
- Pull-to-refresh to reload session
- Keyboard-aware layout (doesn't cover input)
- Session status integration
- Real-time event stream integration
- Project context from navigation params

## Integration

### Services Used
- `sessionService` from `@/services/api` - Session management and event streaming
- `useProjectStore` - Current project context
- `useSessionStore` - Session state management

### Event Handling
The CodeScreen sets up listeners for:
- `thinking` - AI processing status
- `terminal` - Terminal output
- `file_change` - File modifications
- `completion` - Task completion
- `error` - Error messages

## Usage Example

```typescript
// Navigate to code screen with project
router.push({
  pathname: '/(tabs)/code',
  params: { projectId: 'project-123' }
});

// Or use current project from store
const { currentProject } = useProjectStore();
// Code screen will automatically use currentProject if no projectId param
```

## Dependencies

Required packages:
- `expo-clipboard` - For copy to clipboard functionality
- `expo-haptics` - For haptic feedback on interactions

Design system:
- `@/src/ui/primitives` - Text component
- `@/src/ui/tokens` - Design tokens (colors, spacing, typography)

State management:
- `zustand` - For project and session stores

## Future Enhancements

1. **Syntax Highlighting**: Currently uses basic monospace font. Could integrate `react-native-syntax-highlighter` for full syntax highlighting.

2. **Code Editing**: Add inline code editing capabilities within chat messages.

3. **File Attachments**: Support uploading files or screenshots in chat.

4. **Multi-turn Conversations**: Backend support for sending additional prompts to existing sessions.

5. **Voice Input**: Add speech-to-text for voice prompts.

6. **Message Actions**: Add actions like "Regenerate", "Edit", "Copy" to messages.

7. **Search**: Search through message history.

8. **Export**: Export conversation as Markdown or text file.

## Testing

To test in Expo:
```bash
npm start
# Then press 'i' for iOS or 'a' for Android
```

Navigate to the Code tab and:
1. Select or create a project
2. Type a prompt and send
3. Observe message bubbles appearing
4. Test session controls (pause/resume/stop)
5. Test pull-to-refresh
6. Test keyboard behavior

## Notes

- Session state persists across component re-renders
- Messages are stored in local component state
- Event stream automatically reconnects on session resume
- Thinking animation currently static (CSS animation)
- Code blocks support horizontal scrolling for long lines
