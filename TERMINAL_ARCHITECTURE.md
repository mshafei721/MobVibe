# Terminal Viewer Architecture

## Component Hierarchy

```
CodeScreen (app/(tabs)/code.tsx)
│
├── Header
│   ├── Project Name
│   └── Action Buttons
│       ├── [⚡] Terminal Button ────────┐
│       └── [📁] Files Button            │
│                                         │
└── TerminalSheet (Modal) ←──────────────┘
    │
    ├── Handle Bar (drag to resize)
    │
    ├── Header
    │   ├── "Terminal" Title
    │   ├── Height Toggle [⬆/⬇]
    │   └── Close Button [✕]
    │
    ├── TerminalControls
    │   ├── Status Section
    │   │   ├── Execution Dot (● Running / ○ Idle)
    │   │   ├── Line Count (245 lines)
    │   │   └── Error Count (3 errors)
    │   │
    │   └── Control Buttons
    │       ├── [🕐] Toggle Timestamps
    │       ├── [⚠] Toggle Errors Only
    │       ├── [📋] Copy Output
    │       └── [🗑] Clear Terminal
    │
    └── TerminalOutput
        │
        ├── Execution Bar (when running)
        │   └── ● Executing...
        │
        ├── ScrollView
        │   └── TerminalLine[] (mapped)
        │       └── TerminalLine
        │           ├── Line Number (optional)
        │           ├── Timestamp (optional)
        │           └── Parsed Content
        │               └── TextSegment[]
        │                   ├── text
        │                   ├── color (ANSI parsed)
        │                   ├── bold
        │                   ├── italic
        │                   └── underline
        │
        └── Scroll-to-Bottom Button (when scrolled up)
            └── [↓]
```

## Data Flow

```
Backend WebSocket
       │
       │ terminal_output event
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 │
sessionService.onTerminalOutput         │
       │                                 │
       ▼                                 │
useTerminalOutput Hook                  │
       │                                 │
       ├─ lines: TerminalLine[]          │
       ├─ isExecuting: boolean           │
       ├─ clearTerminal: () => void      │
       └─ getRecentOutput: (n) => []     │
       │                                 │
       ▼                                 │
TerminalSheet (consumes hook)           │
       │                                 │
       ├─ Filter errors only?            │
       │  ├─ Yes: filter stderr          │
       │  └─ No: show all                │
       │                                 │
       ▼                                 │
TerminalOutput (display component)      │
       │                                 │
       ├─ Auto-scroll logic              │
       │  ├─ User scrolled up?           │
       │  │  ├─ Yes: pause auto-scroll   │
       │  │  └─ No: scroll to bottom     │
       │  └─ Show scroll button?         │
       │                                 │
       ▼                                 │
TerminalLine[] (map over lines)         │
       │                                 │
       ▼                                 │
TerminalLine (individual line)          │
       │                                 │
       ├─ parseAnsi(line.content)        │
       │        │                        │
       │        ▼                        │
       │  ANSI Parser ←──────────────────┘
       │        │
       │        ├─ Extract color codes
       │        ├─ Parse formatting
       │        ├─ Handle resets
       │        └─ Return segments[]
       │
       └─ Render TextSegment[]
              ├─ Apply colors
              ├─ Apply formatting
              └─ Display text
```

## State Management

```
TerminalSheet
├─ State
│  ├─ showTimestamps: boolean
│  ├─ showErrorsOnly: boolean
│  └─ height: number (SNAP_POINT_LOW | SNAP_POINT_HIGH)
│
└─ Hook (useTerminalOutput)
   ├─ lines: TerminalLine[]
   ├─ isExecuting: boolean
   └─ Methods
      ├─ clearTerminal()
      └─ getRecentOutput(count)

TerminalOutput
├─ State
│  ├─ userScrolled: boolean
│  └─ showScrollButton: boolean
│
└─ Refs
   ├─ scrollViewRef
   └─ scrollButtonOpacity (Animated.Value)

TerminalLine
└─ Memo
   └─ parsed = useMemo(() => parseAnsi(content))
```

## ANSI Parsing Flow

```
Raw Terminal Line
    "│1b[32m✓ Success│1b[0m and │1b[31m✗ Error│1b[0m"
       │
       ▼
parseAnsi(line)
       │
       ├─ Regex Match: /│1b│[([0-9;]*)m/g
       │
       ├─ Found: │1b[32m
       │  └─ Code: 32 → ANSI_COLORS[32] = '#50fa7b'
       │
       ├─ Text: "✓ Success"
       │  └─ Segment: { text: '✓ Success', color: '#50fa7b' }
       │
       ├─ Found: │1b[0m (reset)
       │  └─ Clear all styles
       │
       ├─ Text: " and "
       │  └─ Segment: { text: ' and ' }
       │
       ├─ Found: │1b[31m
       │  └─ Code: 31 → ANSI_COLORS[31] = '#ff5555'
       │
       └─ Text: "✗ Error"
          └─ Segment: { text: '✗ Error', color: '#ff5555' }
       │
       ▼
Return ParsedLine
    {
      segments: [
        { text: '✓ Success', color: '#50fa7b' },
        { text: ' and ' },
        { text: '✗ Error', color: '#ff5555' }
      ]
    }
```

## User Interactions

```
User Actions                    Component Response
─────────────────────────────────────────────────────────────
[⚡] Terminal Button          → Open TerminalSheet modal
                              → Load lines from hook
                              → Auto-scroll to bottom

Drag Handle ↕                 → Adjust height between snap points
                              → Animate smooth transition

[🕐] Toggle Timestamps        → Show/hide HH:MM:SS
                              → Re-render all lines

[⚠] Toggle Errors Only        → Filter stderr lines
                              → Update line count

[📋] Copy Output              → stripAnsi(all lines)
                              → Clipboard.setString()
                              → Show success toast (optional)

[🗑] Clear Terminal           → Alert confirmation
                              → clearTerminal() if confirmed
                              → Empty state shown

Scroll Up                     → userScrolled = true
                              → Pause auto-scroll
                              → Show [↓] button

[↓] Scroll to Bottom          → scrollToEnd()
                              → userScrolled = false
                              → Hide [↓] button
                              → Resume auto-scroll

Backdrop Tap                  → Close modal
                              → onClose() callback

[✕] Close Button              → Close modal
                              → onClose() callback

Height Toggle [⬆/⬇]           → Switch snap points
                              → Animate height change
```

## Performance Optimizations

```
Component Level
├─ TerminalLine
│  └─ useMemo(() => parseAnsi(content))
│     └─ Only re-parse when content changes
│
├─ TerminalOutput
│  ├─ scrollEventThrottle={16}
│  │  └─ Limit scroll events to ~60fps
│  │
│  └─ Animated.Value for scroll button
│     └─ Native driver for smooth animation
│
└─ TerminalSheet
   └─ useMemo for filtered lines
      └─ Only re-filter when lines or filter changes

Data Level
├─ useTerminalOutput Hook
│  ├─ Max 1000 lines (configurable)
│  ├─ Slice old lines: lines.slice(-maxLines)
│  └─ Debounce rapid updates (2s timeout)
│
└─ ANSI Parser
   └─ Efficient regex matching
      └─ Single pass through string
```

## Theme Configuration

```
Terminal Colors (Dracula)
├─ Background
│  ├─ Terminal: #1e1e1e
│  ├─ Controls Bar: #252525
│  └─ Handle Bar: #252525
│
├─ Text
│  ├─ Default: #f8f8f2
│  ├─ Success: #50fa7b
│  ├─ Error: #ff5555
│  ├─ Warning: #f1fa8c
│  ├─ Info: #8be9fd
│  └─ Dim: #6272a4
│
├─ UI Elements
│  ├─ Handle: #6272a4
│  ├─ Border: #333333
│  ├─ Button BG: #1e1e1e
│  ├─ Button Active: #44475a
│  └─ Scroll Button: #50fa7b
│
└─ Typography
   ├─ Font: Menlo (iOS), monospace (Android)
   ├─ Size: 12px (lines), 11px (controls)
   ├─ Line Height: 18px (1.5x)
   └─ Letter Spacing: 0.5px
```

## Integration Points

```
Stream 1 (Project Management)
       │
       └─ Provides: project context

Stream 2 (Chat & Realtime)
       │
       ├─ Provides: useTerminalOutput hook
       ├─ Provides: sessionService events
       └─ Provides: WebSocket connection

Stream 3 (Terminal) ← YOU ARE HERE
       │
       ├─ Uses: useTerminalOutput
       ├─ Displays: real-time output
       └─ Integrates: with CodeScreen

Stream 4 (File Explorer)
       │
       └─ Parallel: similar Modal approach
```

## Error Handling

```
No Session ID
    └─ TerminalSheet returns null
       └─ Button hidden when no session

Empty Terminal
    └─ Show empty state
       ├─ "No terminal output yet"
       └─ "Command output will appear here"

WebSocket Disconnected
    └─ Hook handles reconnection
       └─ Lines preserved in state

Large Output (>1000 lines)
    └─ Auto-trim oldest lines
       └─ Keep most recent 1000

ANSI Parse Error
    └─ Graceful fallback
       └─ Show plain text without colors

Copy Clipboard Error
    └─ Silent fail
       └─ Optional: show error toast
```

## File Dependencies

```
TerminalSheet.tsx
├─ React Native Core
│  ├─ Modal
│  ├─ View, TouchableOpacity
│  ├─ Animated, PanResponder
│  └─ Dimensions
│
├─ Internal Components
│  ├─ TerminalOutput
│  ├─ TerminalControls
│  └─ Text (from UI primitives)
│
├─ Hooks
│  └─ useTerminalOutput
│
├─ Utils
│  └─ stripAnsi (from ansiParser)
│
└─ External
   └─ @react-native-clipboard/clipboard

TerminalOutput.tsx
├─ React Native Core
│  ├─ ScrollView
│  ├─ Animated
│  └─ Platform
│
└─ Internal
   ├─ TerminalLine
   └─ UI tokens

TerminalControls.tsx
├─ React Native Core
│  ├─ TouchableOpacity
│  ├─ Alert
│  └─ Platform
│
└─ External
   └─ @react-native-clipboard/clipboard

TerminalLine.tsx
├─ React Native Core
│  ├─ View, Text
│  └─ Platform
│
└─ Utils
   └─ parseAnsi (from ansiParser)

ansiParser.ts
└─ No dependencies (pure functions)
```

## Testing Strategy

```
Unit Tests
├─ ansiParser.test.ts
│  ├─ parseAnsi()
│  ├─ stripAnsi()
│  ├─ isErrorLine()
│  ├─ isSuccessLine()
│  ├─ isWarningLine()
│  └─ autoColorize()
│
└─ TerminalOutput.test.tsx
   ├─ Rendering
   ├─ Empty state
   ├─ Execution indicator
   ├─ Timestamps
   └─ Line numbers

Integration Tests (Future)
├─ Terminal + Hook interaction
├─ WebSocket message handling
├─ Clear terminal flow
└─ Copy to clipboard

E2E Tests (Future)
├─ Open terminal
├─ View output
├─ Scroll behavior
├─ Filter errors
└─ Close terminal
```

This architecture provides a clean, maintainable, and performant terminal viewer that integrates seamlessly with the existing MobVibe codebase.
