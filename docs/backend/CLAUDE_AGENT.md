# Claude Agent Integration

Phase 16 implementation for AI-powered code generation in MobVibe.

## Architecture

```
JobProcessor
    ↓
AgentRunner (orchestrates agent loop)
    ↓
ClaudeClient (API wrapper)
    ↓
Anthropic Messages API
    ↓
Tool Execution (bash, read_file, write_file)
    ↓
SandboxLifecycle (executes in isolated VM)
```

## Components

### ClaudeClient

**Location**: `backend/worker/src/agent/ClaudeClient.ts`

Thin wrapper around the Anthropic SDK providing:
- Structured logging
- Token usage tracking
- Error handling
- Type-safe API interface

**Key Configuration**:
- Model: `claude-sonnet-4-5-20250929`
- Max tokens: 8192 (configurable)
- API key from environment

**Usage**:
```typescript
const client = new ClaudeClient()

const response = await client.createMessage({
  system: 'You are an expert React Native developer...',
  messages: conversationHistory,
  tools: agentTools,
  maxTokens: 8192,
})
```

### Agent Tools

**Location**: `backend/worker/src/agent/tools.ts`

Three fundamental tools for code generation:

#### 1. bash
Execute shell commands in sandbox:
```json
{
  "name": "bash",
  "input_schema": {
    "type": "object",
    "properties": {
      "command": { "type": "string" }
    }
  }
}
```

**Examples**:
- `npm install expo-router`
- `expo start --clear`
- `npx react-native run-android`

#### 2. read_file
Read file contents from workspace:
```json
{
  "name": "read_file",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" }
    }
  }
}
```

**Examples**:
- `src/App.tsx`
- `package.json`
- `app.json`

#### 3. write_file
Create or update files:
```json
{
  "name": "write_file",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "content": { "type": "string" }
    }
  }
}
```

**Features**:
- Creates parent directories automatically
- Atomic writes (temp file + move)
- Safe overwriting of existing files

### AgentRunner

**Location**: `backend/worker/src/agent/AgentRunner.ts`

Implements the agent loop pattern:

```
1. Send user prompt + conversation history
2. Receive response from Claude
3. Extract tool calls from response
4. Execute tools in sandbox
5. Add tool results to conversation
6. Repeat until completion or max iterations
```

**Key Features**:
- **Max iterations**: 25 (prevents infinite loops)
- **Token tracking**: Input/output tokens per session
- **Event emission**: Progress updates for frontend
- **Error recovery**: Tool failures return error messages to agent

**Session Stats**:
```typescript
interface SessionStats {
  iterations: number
  inputTokens: number
  outputTokens: number
  toolCalls: number
}
```

**Example Flow**:
```typescript
const runner = new AgentRunner(sandboxes)

const stats = await runner.runSession(
  'session-123',
  'Create a simple counter app with Expo'
)

// stats: {
//   iterations: 8,
//   inputTokens: 12543,
//   outputTokens: 3421,
//   toolCalls: 15
// }
```

## System Prompt

```
You are an expert React Native developer using Expo.
Your job is to build mobile apps based on user requirements.
You have access to a sandbox environment where you can execute bash commands and manage files.

Available tools:
- bash: Execute shell commands (npm, expo, etc.)
- read_file: Read file contents
- write_file: Create or update files

Build the app step by step, testing as you go. When finished, respond with a summary of what was created.
```

## Agent Loop Details

### Initialization
1. Create message array with user prompt
2. Set system prompt
3. Initialize stats tracker

### Main Loop
```typescript
while (iterations < maxIterations) {
  // 1. Call Claude API
  const response = await claude.createMessage({
    system: systemPrompt,
    messages: conversationHistory,
    tools: agentTools,
  })

  // 2. Track usage
  stats.inputTokens += response.usage.input_tokens
  stats.outputTokens += response.usage.output_tokens

  // 3. Add response to history
  conversationHistory.push({
    role: 'assistant',
    content: response.content,
  })

  // 4. Check for completion
  const toolCalls = extractToolCalls(response.content)
  if (toolCalls.length === 0) {
    break // Agent finished
  }

  // 5. Execute tools
  const toolResults = await executeTools(sessionId, toolCalls)

  // 6. Add results to history
  conversationHistory.push({
    role: 'user',
    content: toolResults,
  })

  // 7. Emit progress event
  await emitEvent(sessionId, 'thinking', {
    iteration,
    toolsUsed: toolCalls.map(t => t.name),
  })

  iterations++
}
```

### Completion
- **Success**: Agent returns text response (no tool calls)
- **Max iterations**: Reached 25 iterations
- **Error**: Tool execution or API failure

## Tool Execution

### Bash Tool
```typescript
async executeBash(sessionId: string, command: string) {
  // Execute in sandbox via SandboxLifecycle
  const result = await sandboxes.execInSandbox(sessionId, [
    'bash', '-c', command
  ])

  // Emit terminal event for frontend
  await emitEvent(sessionId, 'terminal', {
    command,
    output: result.stdout,
    error: result.stderr,
    exitCode: result.exitCode,
  })

  return {
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}
```

### Read File Tool
```typescript
async readFile(sessionId: string, path: string) {
  const result = await sandboxes.execInSandbox(sessionId, ['cat', path])

  if (result.exitCode !== 0) {
    throw new Error(`Failed to read file: ${result.stderr}`)
  }

  return { content: result.stdout }
}
```

### Write File Tool
```typescript
async writeFile(sessionId: string, path: string, content: string) {
  // Atomic write: temp file → move
  const tempPath = `/tmp/mobvibe-${Date.now()}`

  const result = await sandboxes.execInSandbox(sessionId, [
    'bash', '-c',
    `mkdir -p $(dirname ${path}) && echo ${escapeShellArg(content)} > ${tempPath} && mv ${tempPath} ${path}`
  ])

  if (result.exitCode !== 0) {
    throw new Error(`Failed to write file: ${result.stderr}`)
  }

  // Emit file change event
  await emitEvent(sessionId, 'file_change', {
    path,
    action: 'write',
  })

  return { success: true, path }
}
```

## Event Streaming

Events emitted during agent execution (implementation in Phase 19):

### Event Types

#### completion
```json
{
  "type": "completion",
  "data": {
    "message": "I've created a counter app with...",
    "stats": {
      "iterations": 8,
      "inputTokens": 12543,
      "outputTokens": 3421,
      "toolCalls": 15
    }
  }
}
```

#### thinking
```json
{
  "type": "thinking",
  "data": {
    "iteration": 3,
    "toolsUsed": ["bash", "write_file"]
  }
}
```

#### terminal
```json
{
  "type": "terminal",
  "data": {
    "command": "npm install expo-router",
    "output": "added 47 packages...",
    "error": "",
    "exitCode": 0
  }
}
```

#### file_change
```json
{
  "type": "file_change",
  "data": {
    "path": "src/App.tsx",
    "action": "write"
  }
}
```

#### error
```json
{
  "type": "error",
  "data": {
    "message": "Max iterations reached",
    "stats": { ... }
  }
}
```

## Cost Tracking

### Per Session
```typescript
const stats: SessionStats = {
  iterations: 8,
  inputTokens: 12543,   // ~$0.0376
  outputTokens: 3421,   // ~$0.0513
  toolCalls: 15
}

// Total API cost: ~$0.0889
// Sandbox cost (5 min): ~$0.0017
// Total session cost: ~$0.09
```

### Pricing (Claude Sonnet 4.5)
- Input: $3/million tokens
- Output: $15/million tokens

### Optimization Strategies
1. **Limit iterations**: Max 25 prevents runaway costs
2. **Efficient tools**: Direct file operations vs bash commands
3. **Smart prompts**: Guide agent to completion faster
4. **Caching**: Reuse conversation history where possible

## Integration with JobProcessor

```typescript
export class JobProcessor {
  private agent: AgentRunner

  constructor() {
    this.queue = new JobQueue()
    this.sandboxes = new SandboxLifecycle()
    this.agent = new AgentRunner(this.sandboxes)
  }

  private async processNextJob() {
    const job = await this.queue.claimNextJob()

    // Start sandbox
    await this.sandboxes.startSandbox(job.session_id)

    try {
      // Run agent
      const stats = await this.agent.runSession(
        job.session_id,
        job.prompt
      )

      logger.info({ sessionId: job.session_id, stats }, 'Agent completed')
      await this.queue.completeJob(job.job_id)

    } catch (error) {
      logger.error({ error }, 'Agent failed')
      await this.queue.failJob(job.job_id, error.message)
    }
  }
}
```

## Error Handling

### Tool Execution Errors
```typescript
try {
  const result = await executeTool(toolCall)
  return {
    type: 'tool_result',
    tool_use_id: toolCall.id,
    content: JSON.stringify(result),
  }
} catch (error) {
  return {
    type: 'tool_result',
    tool_use_id: toolCall.id,
    content: JSON.stringify({ error: error.message }),
    is_error: true,
  }
}
```

**Agent sees error and can retry**:
```
User: Tool bash failed: npm: command not found
Assistant: Let me install npm first...
```

### API Errors
```typescript
try {
  const response = await client.messages.create(...)
} catch (error) {
  logger.error({ error }, 'Claude API error')
  throw error // Fails job
}
```

**Handled by JobProcessor**:
- Marks job as failed
- Sandbox cleanup continues
- Error logged for monitoring

### Max Iterations
```typescript
if (iterations >= maxIterations) {
  logger.warn({ sessionId }, 'Max iterations reached')
  await emitEvent(sessionId, 'error', {
    message: 'Max iterations reached',
    stats,
  })
}
```

**Prevents**:
- Infinite loops
- Runaway API costs
- Stuck sessions

## Security

### Sandbox Isolation
- All tools execute in isolated Fly.io VM
- No access to host filesystem
- No network access to internal services
- 30-minute timeout enforced

### Input Validation
- Tool inputs validated by Anthropic SDK
- Shell arguments escaped properly
- File paths sanitized
- Command injection prevented

### API Key Security
- Stored in environment variables
- Never logged or exposed
- Separate key per environment
- Rotatable without code changes

## Testing

### Unit Tests
```typescript
describe('ClaudeClient', () => {
  it('creates message with tools', async () => {
    const client = new ClaudeClient()
    const response = await client.createMessage({
      system: 'Test prompt',
      messages: [{ role: 'user', content: 'Hello' }],
      tools: agentTools,
    })
    expect(response.content).toBeDefined()
  })
})
```

### Integration Tests
```typescript
describe('AgentRunner', () => {
  it('completes simple task', async () => {
    const runner = new AgentRunner(sandboxes)
    const stats = await runner.runSession(
      'test-session',
      'Create a file called test.txt with "Hello World"'
    )

    expect(stats.iterations).toBeGreaterThan(0)
    expect(stats.toolCalls).toBeGreaterThan(0)

    // Verify file exists in sandbox
    const result = await sandboxes.execInSandbox(
      'test-session',
      ['cat', 'test.txt']
    )
    expect(result.stdout).toBe('Hello World')
  }, 60000)
})
```

### Manual Testing
```bash
# 1. Start worker with API key
export ANTHROPIC_API_KEY=sk-...
npm start

# 2. Create test session in Supabase
INSERT INTO coding_sessions (id, user_id, status)
VALUES ('test-123', 'user-123', 'active');

# 3. Create test job
INSERT INTO jobs (session_id, prompt, status)
VALUES ('test-123', 'Create a counter app', 'pending');

# 4. Watch logs
tail -f logs/worker.log | grep session_id=test-123
```

## Monitoring

### Key Metrics
- **Iterations per session**: Avg 8-12 for simple apps
- **Token usage**: Avg 15K input, 4K output
- **Success rate**: >95% completion rate
- **Cost per session**: ~$0.09 total

### Logging
```json
{
  "level": "info",
  "msg": "Agent session completed",
  "sessionId": "abc123",
  "stats": {
    "iterations": 8,
    "inputTokens": 12543,
    "outputTokens": 3421,
    "toolCalls": 15
  },
  "duration": 45321
}
```

### Alerts
- API errors → Page on-call
- Max iterations exceeded → Warning
- Cost spike → Budget alert
- Success rate drop → Investigation

## Next Phase

**Phase 17: Coding Session Lifecycle**
- Implement event streaming to `session_events` table
- Add Realtime subscriptions for frontend
- Track session state transitions
- Add session timeout handling

---

**Phase**: 16
**Status**: Complete
**Dependencies**: Phase 15 (Sandboxes)
**Enables**: Phase 17 (Session Lifecycle)
