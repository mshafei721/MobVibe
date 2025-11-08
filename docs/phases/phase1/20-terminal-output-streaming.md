# 20-terminal-output-streaming.md
---
phase_id: 20
title: Terminal Output Streaming
duration_estimate: "2.5 days"
incremental_value: Live terminal output visible in mobile app
owners: [Backend Engineer, Mobile Engineer]
dependencies: [19]
linked_phases_forward: [21]
docs_referenced: [Architecture, Real-time Communication]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["Node.js stdout streaming", "ANSI color parsing React Native", "Terminal output buffering"]
    outputs: ["/docs/research/phase1/20/terminal-streaming.md"]
  - name: ContextCurator
    tool: context7
    scope: ["architecture.md terminal", "implementation.md sandbox execution"]
    outputs: ["/docs/context/phase1/20-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate plan for streaming terminal output with ANSI support"
    outputs: ["/docs/sequencing/phase1/20-terminal-steps.md"]
acceptance_criteria:
  - Terminal output streams to mobile in real-time
  - stdout and stderr captured separately
  - ANSI color codes preserved and rendered
  - Long-running commands (npm install) stream output
  - Output buffering prevents flooding
  - Terminal history persisted
---

## Objectives

1. **Capture Process Output** - Stream stdout/stderr from sandbox commands
2. **Buffer and Stream** - Efficiently send output chunks to mobile
3. **Render Terminal UI** - Display output with ANSI color support

## Scope

### In
- Process output capture (stdout/stderr)
- Output buffering and chunking
- Streaming via Realtime events
- ANSI color code parsing
- Terminal component in mobile
- Output history persistence

### Out
- Interactive terminal (no stdin support in MVP)
- Complex ANSI sequences (focus on colors only)
- Terminal emulation (VT100, etc.)

## Tasks

- [ ] **Use context7**, **websearch**, **sequentialthinking** per template

- [ ] **Create Output Streamer** (`backend/worker/src/sandbox/OutputStreamer.ts`):
  ```typescript
  import { EventEmitter } from '../events/EventEmitter'
  import { logger } from '../utils/logger'

  export class OutputStreamer {
    private events: EventEmitter
    private buffer: string = ''
    private bufferSize = 1024 // 1KB chunks
    private flushInterval = 100 // 100ms

    constructor(events: EventEmitter) {
      this.events = events
    }

    async streamOutput(sessionId: string, command: string, stream: NodeJS.ReadableStream) {
      let output = ''

      stream.on('data', (chunk) => {
        const data = chunk.toString()
        output += data
        this.buffer += data

        // Flush if buffer exceeds size
        if (this.buffer.length >= this.bufferSize) {
          this.flush(sessionId, command, false)
        }
      })

      // Periodic flush
      const flushTimer = setInterval(() => {
        if (this.buffer.length > 0) {
          this.flush(sessionId, command, false)
        }
      }, this.flushInterval)

      return new Promise<string>((resolve, reject) => {
        stream.on('end', () => {
          clearInterval(flushTimer)
          // Final flush
          if (this.buffer.length > 0) {
            this.flush(sessionId, command, true)
          }
          resolve(output)
        })

        stream.on('error', (error) => {
          clearInterval(flushTimer)
          reject(error)
        })
      })
    }

    private flush(sessionId: string, command: string, isFinal: boolean) {
      if (this.buffer.length === 0) return

      logger.debug({ sessionId, bufferSize: this.buffer.length, isFinal }, 'Flushing output')

      this.events.emit(sessionId, {
        type: 'terminal',
        data: {
          command,
          output: this.buffer,
          isFinal,
        },
      }).catch(err => {
        logger.error({ err }, 'Failed to emit terminal event')
      })

      this.buffer = ''
    }
  }
  ```

- [ ] **Update SandboxManager to Stream Output**:
  ```typescript
  // src/sandbox/SandboxManager.ts (updated)
  import { OutputStreamer } from './OutputStreamer'

  export class SandboxManager {
    async execCommandStreaming(
      sandboxId: string,
      command: string[],
      streamer: OutputStreamer,
      sessionId: string
    ) {
      logger.debug({ sandboxId, command }, 'Executing command with streaming')

      // Use Fly.io exec API with streaming
      // Implementation depends on Fly.io API capabilities
      // For reference, output streaming would capture stdout/stderr
      // and pipe through the OutputStreamer

      // This is a conceptual example - actual implementation
      // would use Fly.io Machines API streaming endpoints

      return {
        stdout: '',
        stderr: '',
        exit_code: 0,
      }
    }
  }
  ```

- [ ] **Update AgentRunner to Use Streaming**:
  ```typescript
  // src/agent/AgentRunner.ts (updated)
  import { OutputStreamer } from '../sandbox/OutputStreamer'

  export class AgentRunner {
    private streamer: OutputStreamer

    constructor(sandboxes: SandboxLifecycle) {
      this.claude = new ClaudeClient()
      this.sandboxes = sandboxes
      this.events = new EventEmitter()
      this.streamer = new OutputStreamer(this.events)
    }

    private async executeBash(sessionId: string, command: string) {
      const sandbox = this.sandboxes.getActiveSandbox(sessionId)
      if (!sandbox) {
        throw new Error('No active sandbox')
      }

      // Use streaming execution
      return await this.sandboxes.manager.execCommandStreaming(
        sandbox.id,
        ['bash', '-c', command],
        this.streamer,
        sessionId
      )
    }
  }
  ```

- [ ] **Create ANSI Parser** (`mobile/src/utils/ansiParser.ts`):
  ```typescript
  export interface AnsiSegment {
    text: string
    color?: string
    backgroundColor?: string
    bold?: boolean
  }

  const ANSI_COLORS = {
    30: '#000000', // Black
    31: '#ff0000', // Red
    32: '#00ff00', // Green
    33: '#ffff00', // Yellow
    34: '#0000ff', // Blue
    35: '#ff00ff', // Magenta
    36: '#00ffff', // Cyan
    37: '#ffffff', // White
    90: '#808080', // Bright Black (Gray)
    91: '#ff8080', // Bright Red
    92: '#80ff80', // Bright Green
    93: '#ffff80', // Bright Yellow
    94: '#8080ff', // Bright Blue
    95: '#ff80ff', // Bright Magenta
    96: '#80ffff', // Bright Cyan
    97: '#ffffff', // Bright White
  }

  export function parseAnsi(text: string): AnsiSegment[] {
    const segments: AnsiSegment[] = []
    const ansiRegex = /\x1b\[([0-9;]+)m/g

    let lastIndex = 0
    let currentColor: string | undefined
    let currentBgColor: string | undefined
    let currentBold = false

    let match
    while ((match = ansiRegex.exec(text)) !== null) {
      // Add text before ANSI code
      if (match.index > lastIndex) {
        segments.push({
          text: text.slice(lastIndex, match.index),
          color: currentColor,
          backgroundColor: currentBgColor,
          bold: currentBold,
        })
      }

      // Parse ANSI code
      const codes = match[1].split(';').map(Number)
      for (const code of codes) {
        if (code === 0) {
          // Reset
          currentColor = undefined
          currentBgColor = undefined
          currentBold = false
        } else if (code === 1) {
          currentBold = true
        } else if (code >= 30 && code <= 37) {
          currentColor = ANSI_COLORS[code]
        } else if (code >= 90 && code <= 97) {
          currentColor = ANSI_COLORS[code]
        } else if (code >= 40 && code <= 47) {
          currentBgColor = ANSI_COLORS[code - 10]
        }
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        text: text.slice(lastIndex),
        color: currentColor,
        backgroundColor: currentBgColor,
        bold: currentBold,
      })
    }

    return segments
  }
  ```

- [ ] **Create Terminal Component** (`mobile/src/components/Terminal.tsx`):
  ```typescript
  import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
  import { parseAnsi, AnsiSegment } from '../utils/ansiParser'

  interface TerminalLine {
    command?: string
    output: string
    timestamp: Date
  }

  interface TerminalProps {
    lines: TerminalLine[]
    onClear?: () => void
  }

  export function Terminal({ lines, onClear }: TerminalProps) {
    return (
      <View className="flex-1">
        {lines.length > 0 && onClear && (
          <TouchableOpacity
            onPress={onClear}
            className="absolute top-2 right-2 bg-gray-800 px-3 py-1 rounded z-10"
          >
            <Text className="text-white text-xs">Clear</Text>
          </TouchableOpacity>
        )}

        <ScrollView className="flex-1 bg-black p-4">
          {lines.map((line, idx) => (
            <View key={idx} className="mb-2">
              {line.command && (
                <Text className="text-green-400 font-mono text-sm mb-1">
                  $ {line.command}
                </Text>
              )}

              <TerminalOutput text={line.output} />
            </View>
          ))}
        </ScrollView>
      </View>
    )
  }

  function TerminalOutput({ text }: { text: string }) {
    const segments = parseAnsi(text)

    return (
      <View className="flex-row flex-wrap">
        {segments.map((segment, idx) => (
          <Text
            key={idx}
            className="font-mono text-sm"
            style={{
              color: segment.color || '#ffffff',
              backgroundColor: segment.backgroundColor,
              fontWeight: segment.bold ? 'bold' : 'normal',
            }}
          >
            {segment.text}
          </Text>
        ))}
      </View>
    )
  }
  ```

- [ ] **Update SessionScreen to Display Terminal**:
  ```typescript
  // mobile/src/screens/SessionScreen.tsx (updated)
  import { Terminal } from '../components/Terminal'

  export default function SessionScreen({ route }) {
    const { sessionId } = route.params
    const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])

    useEffect(() => {
      const unsubscribe = realtimeService.subscribe(sessionId, (event) => {
        if (event.type === 'terminal') {
          setTerminalLines(prev => {
            const lastLine = prev[prev.length - 1]

            // Append to last line if same command and not final
            if (
              lastLine &&
              lastLine.command === event.data.command &&
              !event.data.isFinal
            ) {
              return [
                ...prev.slice(0, -1),
                {
                  ...lastLine,
                  output: lastLine.output + event.data.output,
                },
              ]
            }

            // New line
            return [
              ...prev,
              {
                command: event.data.command,
                output: event.data.output,
                timestamp: new Date(),
              },
            ]
          })
        }
      })

      return unsubscribe
    }, [sessionId])

    const handleClearTerminal = () => {
      setTerminalLines([])
    }

    return (
      <View className="flex-1">
        <Terminal lines={terminalLines} onClear={handleClearTerminal} />
      </View>
    )
  }
  ```

- [ ] **Test Output Streaming**:
  ```typescript
  // tests/backend/output-streaming.test.ts
  import { Readable } from 'stream'
  import { OutputStreamer } from '../../backend/worker/src/sandbox/OutputStreamer'
  import { EventEmitter } from '../../backend/worker/src/events/EventEmitter'

  describe('Output Streaming', () => {
    it('streams command output in chunks', async () => {
      const events = new EventEmitter()
      const streamer = new OutputStreamer(events)

      // Mock stream
      const stream = new Readable()
      stream.push('Line 1\n')
      stream.push('Line 2\n')
      stream.push(null)

      const output = await streamer.streamOutput('test-session', 'echo', stream)

      expect(output).toBe('Line 1\nLine 2\n')
    })
  })
  ```

- [ ] **Test ANSI Parser**:
  ```typescript
  // tests/mobile/ansiParser.test.ts
  import { parseAnsi } from '../mobile/src/utils/ansiParser'

  describe('ANSI Parser', () => {
    it('parses color codes', () => {
      const text = '\x1b[31mRed\x1b[0m Normal'
      const segments = parseAnsi(text)

      expect(segments).toHaveLength(2)
      expect(segments[0].color).toBe('#ff0000')
      expect(segments[0].text).toBe('Red')
      expect(segments[1].text).toBe(' Normal')
    })

    it('handles bold text', () => {
      const text = '\x1b[1mBold\x1b[0m'
      const segments = parseAnsi(text)

      expect(segments[0].bold).toBe(true)
    })
  })
  ```

- [ ] **Document Terminal System**: Create `docs/mobile/TERMINAL.md`

- [ ] **Update links-map**

## Artifacts & Paths

**Backend:**
- `backend/worker/src/sandbox/OutputStreamer.ts`
- `backend/worker/src/sandbox/SandboxManager.ts` (updated)

**Mobile:**
- `mobile/src/utils/ansiParser.ts`
- `mobile/src/components/Terminal.tsx`

**Tests:**
- `tests/backend/output-streaming.test.ts`
- `tests/mobile/ansiParser.test.ts`

**Docs:**
- `docs/mobile/TERMINAL.md` ⭐

## Testing

### Phase-Only Tests
- Output streams in chunks <100ms apart
- ANSI colors render correctly
- Long commands (npm install) stream output
- Terminal clears properly
- stdout and stderr distinguishable

### Cross-Phase Compatibility
- Phase 21 will use terminal output for error diagnostics

### Test Commands
```bash
# Backend tests
npm test -- tests/backend/output-streaming.test.ts

# Mobile tests
npm test -- tests/mobile/ansiParser.test.ts

# Manual test: Run "npm install" and observe streaming
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| Output flooding | Performance | Buffer and throttle output, max line limit |
| ANSI parsing bugs | Display issues | Test with common tools (npm, git), fallback to plain text |
| Memory growth from history | Mobile crash | Limit terminal history to 500 lines, implement circular buffer |
| Buffering delays | UX | Tune buffer size and flush interval, prioritize responsiveness |

## References

- [Architecture](./../../../../.docs/architecture.md) - Terminal architecture
- [Phase 19](./19-realtime-event-streaming.md) - Realtime events

## Handover

**Next Phase:** [21-error-handling-recovery.md](./21-error-handling-recovery.md) - Comprehensive error handling

**Required Inputs Provided to Phase 21:**
- Terminal output available for error diagnostics
- Event streaming infrastructure working

---

**Status:** Ready after Phase 19
**Estimated Time:** 2.5 days
**Blocking Issues:** Requires Phase 19 event streaming
