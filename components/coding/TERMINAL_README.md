# Terminal Viewer Component

A professional terminal output viewer with real-time streaming, ANSI color support, and interactive controls.

## Components

### 1. TerminalSheet (Main Component)
The primary interface - a modal bottom sheet that displays terminal output.

```tsx
import { TerminalSheet } from '@/components/coding/TerminalSheet';

<TerminalSheet
  sessionId={currentSession?.id}
  isVisible={showTerminal}
  onClose={() => setShowTerminal(false)}
/>
```

**Features:**
- Modal overlay with adjustable height (40% and 80% snap points)
- Drag handle for height adjustment
- Integrated controls and output viewer
- Auto-closes on backdrop tap
- Dark terminal theme (Dracula-inspired)

### 2. TerminalOutput
Displays terminal lines with auto-scroll and formatting.

```tsx
import { TerminalOutput } from '@/components/coding/TerminalOutput';

<TerminalOutput
  lines={terminalLines}
  isExecuting={isRunning}
  showTimestamps={true}
  showLineNumbers={false}
/>
```

**Props:**
- `lines: TerminalLine[]` - Array of terminal output lines
- `isExecuting?: boolean` - Shows execution indicator
- `showTimestamps?: boolean` - Display timestamps for each line
- `showLineNumbers?: boolean` - Display line numbers
- `maxHeight?: number` - Maximum height in pixels

**Features:**
- Auto-scroll to bottom when new lines arrive
- Manual scroll with "scroll to bottom" button
- Empty state when no output
- Execution indicator (pulsing green dot)
- Smooth animations

### 3. TerminalControls
Control buttons for terminal operations.

```tsx
import { TerminalControls } from '@/components/coding/TerminalControls';

<TerminalControls
  onClear={clearTerminal}
  onCopy={copyOutput}
  showTimestamps={showTimestamps}
  onToggleTimestamps={() => setShowTimestamps(!showTimestamps)}
  isExecuting={isRunning}
  lineCount={lines.length}
  errorCount={errorLines.length}
  showErrorsOnly={filterErrors}
  onToggleErrorsOnly={() => setFilterErrors(!filterErrors)}
/>
```

**Features:**
- Status indicator (Running/Idle)
- Line count and error count display
- Toggle timestamps
- Toggle error-only filter
- Copy all output to clipboard
- Clear terminal (with confirmation)

### 4. TerminalLine
Renders individual terminal line with ANSI formatting.

```tsx
import { TerminalLine } from '@/components/coding/TerminalLine';

<TerminalLine
  line={terminalLine}
  showTimestamp={true}
  lineNumber={42}
/>
```

**Features:**
- ANSI color code parsing
- Text formatting (bold, italic, underline, dim)
- Stdout vs stderr differentiation
- Monospace font (Menlo, Courier)
- Optional timestamps and line numbers

## ANSI Parser Utility

Parse ANSI escape codes for terminal output rendering.

```tsx
import {
  parseAnsi,
  stripAnsi,
  isErrorLine,
  isSuccessLine,
  isWarningLine,
  autoColorize,
  ANSI_COLORS,
  TERMINAL_COLORS
} from '@/utils/ansiParser';

// Parse ANSI codes
const parsed = parseAnsi('\x1b[32mSuccess\x1b[0m');
// Returns: { segments: [{ text: 'Success', color: '#50fa7b' }] }

// Strip ANSI codes
const plain = stripAnsi('\x1b[32mSuccess\x1b[0m');
// Returns: 'Success'

// Detect patterns
isErrorLine('Error: Failed'); // true
isSuccessLine('✓ Done'); // true
isWarningLine('Warning: Check'); // true

// Auto-colorize based on content
const colored = autoColorize('Error: Failed');
// Returns: '\x1b[31mError: Failed\x1b[0m'
```

## Integration with useTerminalOutput Hook

The terminal components integrate with the `useTerminalOutput` hook:

```tsx
import { useTerminalOutput } from '@/src/hooks/useTerminalOutput';

function MyComponent({ sessionId }: { sessionId: string }) {
  const { lines, isExecuting, clearTerminal, getRecentOutput } = useTerminalOutput(sessionId);

  return (
    <TerminalOutput
      lines={lines}
      isExecuting={isExecuting}
    />
  );
}
```

## Theme Colors (Dracula)

```typescript
const TERMINAL_THEME = {
  background: '#1e1e1e',
  text: '#f8f8f2',
  success: '#50fa7b',
  error: '#ff5555',
  warning: '#f1fa8c',
  info: '#8be9fd',
  dim: '#6272a4',
  selection: '#44475a',
};
```

## Example: Full Terminal Integration

```tsx
import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { TerminalSheet } from '@/components/coding/TerminalSheet';
import { useTerminalOutput } from '@/src/hooks/useTerminalOutput';

export default function CodeScreen() {
  const [showTerminal, setShowTerminal] = useState(false);
  const sessionId = 'current-session-id';

  return (
    <View>
      {/* Terminal button */}
      <TouchableOpacity onPress={() => setShowTerminal(true)}>
        <Text>⚡ Terminal</Text>
      </TouchableOpacity>

      {/* Terminal sheet */}
      <TerminalSheet
        sessionId={sessionId}
        isVisible={showTerminal}
        onClose={() => setShowTerminal(false)}
      />
    </View>
  );
}
```

## ANSI Color Codes Supported

### Foreground Colors
- `\x1b[30m` - Black
- `\x1b[31m` - Red (#ff5555)
- `\x1b[32m` - Green (#50fa7b)
- `\x1b[33m` - Yellow (#f1fa8c)
- `\x1b[34m` - Blue (#bd93f9)
- `\x1b[35m` - Magenta (#ff79c6)
- `\x1b[36m` - Cyan (#8be9fd)
- `\x1b[37m` - White (#f8f8f2)
- `\x1b[90-97m` - Bright variants

### Text Formatting
- `\x1b[1m` - Bold
- `\x1b[2m` - Dim
- `\x1b[3m` - Italic
- `\x1b[4m` - Underline
- `\x1b[0m` - Reset all

## Performance Considerations

- Terminal history limited to 1000 lines (configurable)
- Virtual scrolling for large outputs (recommended for >500 lines)
- Debounced rapid line additions
- Memoized ANSI parsing
- Auto-clear old lines when limit reached

## Testing

Run tests with:
```bash
npm test -- components/coding/__tests__/TerminalOutput.test.tsx
npm test -- utils/__tests__/ansiParser.test.ts
```

## Troubleshooting

### Terminal not updating
- Verify `sessionId` is provided
- Check `useTerminalOutput` hook is connected
- Verify WebSocket connection is active

### ANSI colors not showing
- Ensure ANSI escape codes are in the correct format
- Check backend is sending proper ANSI sequences
- Verify `parseAnsi` function is being used

### Auto-scroll not working
- Check if user has manually scrolled up
- Verify `userScrolled` state management
- Ensure ScrollView ref is correctly set

## Future Enhancements

- [ ] Command input (send commands to backend)
- [ ] Search within terminal output
- [ ] Export terminal history to file
- [ ] Syntax highlighting for code blocks
- [ ] Terminal tabs (multiple sessions)
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements (screen reader support)
