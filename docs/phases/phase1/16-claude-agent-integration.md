# 16-claude-agent-integration.md
---
phase_id: 16
title: Claude Agent SDK Integration
duration_estimate: "2.5 days"
incremental_value: AI code generation capability
owners: [Backend Engineer, AI Specialist]
dependencies: [15]
linked_phases_forward: [17]
docs_referenced: [Architecture, Data Flow]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["Claude Agent SDK documentation", "Anthropic API best practices 2025", "Agent loop patterns"]
    outputs: ["/docs/research/phase1/16/claude-sdk.md"]
  - name: ContextCurator
    tool: context7
    scope: ["architecture.md Claude Agent", "data-flow.md coding flows"]
    outputs: ["/docs/context/phase1/16-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate plan for integrating Claude Agent SDK with sandbox"
    outputs: ["/docs/sequencing/phase1/16-agent-steps.md"]
acceptance_criteria:
  - Claude Agent SDK installed and configured
  - Agent can execute in sandbox
  - Basic tools available (bash, filesystem)
  - Agent loop runs and generates code
  - Events streamed to session_events table
  - API costs tracked per session
---

## Objectives

1. **Integrate Claude SDK** - Install and configure Claude Agent SDK
2. **Implement Agent Loop** - Plan → Code → Test → Fix cycle
3. **Track Usage** - Monitor API costs and token usage

## Scope

### In
- Claude Agent SDK setup
- Basic agent tools (bash, read/write files)
- Agent loop implementation
- Event streaming to database
- Cost tracking

### Out
- Advanced tools (defer to Phase 17-18)
- Complex error recovery (Phase 21)
- Optimization (later)

## Tasks

- [ ] **Use context7**, **websearch**, **sequentialthinking** per template

- [ ] **Install Claude Agent SDK**:
  ```bash
  cd backend/worker
  npm install @anthropic-ai/sdk
  ```

- [ ] **Create Claude Client** (`src/agent/ClaudeClient.ts`):
  ```typescript
  import Anthropic from '@anthropic-ai/sdk'
  import { logger } from '../utils/logger'

  export class ClaudeClient {
    private client: Anthropic

    constructor() {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!,
      })
    }

    async createMessage(params: {
      system: string
      messages: any[]
      tools?: any[]
      maxTokens?: number
    }) {
      logger.debug({ messageCount: params.messages.length }, 'Creating Claude message')

      try {
        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: params.maxTokens || 8192,
          system: params.system,
          messages: params.messages,
          tools: params.tools,
        })

        return response
      } catch (error) {
        logger.error({ error }, 'Claude API error')
        throw error
      }
    }
  }
  ```

- [ ] **Define Agent Tools** (`src/agent/tools.ts`):
  ```typescript
  export const agentTools = [
    {
      name: 'bash',
      description: 'Execute bash command in sandbox',
      input_schema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Bash command to execute' },
        },
        required: ['command'],
      },
    },
    {
      name: 'read_file',
      description: 'Read file contents',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
        },
        required: ['path'],
      },
    },
    {
      name: 'write_file',
      description: 'Write content to file',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['path', 'content'],
      },
    },
  ]
  ```

- [ ] **Create Agent Runner** (`src/agent/AgentRunner.ts`):
  ```typescript
  import { ClaudeClient } from './ClaudeClient'
  import { agentTools } from './tools'
  import { SandboxLifecycle } from '../sandbox/SandboxLifecycle'
  import { logger } from '../utils/logger'

  export class AgentRunner {
    private claude: ClaudeClient
    private sandboxes: SandboxLifecycle
    private maxIterations = 25

    constructor(sandboxes: SandboxLifecycle) {
      this.claude = new ClaudeClient()
      this.sandboxes = sandboxes
    }

    async runSession(sessionId: string, prompt: string) {
      logger.info({ sessionId, prompt }, 'Starting agent session')

      const messages: any[] = [
        { role: 'user', content: prompt }
      ]

      const systemPrompt = `You are an expert React Native developer using Expo.
Your job is to build mobile apps based on user requirements.
You have access to a sandbox environment where you can execute bash commands and manage files.
Build the app step by step, testing as you go.`

      let iteration = 0

      while (iteration < this.maxIterations) {
        iteration++
        logger.debug({ iteration }, 'Agent iteration')

        // Call Claude
        const response = await this.claude.createMessage({
          system: systemPrompt,
          messages,
          tools: agentTools,
          maxTokens: 8192,
        })

        // Add assistant response to messages
        messages.push({
          role: 'assistant',
          content: response.content,
        })

        // Handle tool calls
        const toolCalls = response.content.filter((block: any) =>
          block.type === 'tool_use'
        )

        if (toolCalls.length === 0) {
          // Agent finished
          logger.info({ iteration }, 'Agent completed')
          await this.emitEvent(sessionId, 'completion', {
            message: this.extractTextResponse(response.content),
          })
          break
        }

        // Execute tools
        const toolResults = await this.executeTools(sessionId, toolCalls)

        // Add tool results to messages
        messages.push({
          role: 'user',
          content: toolResults,
        })

        // Emit progress event
        await this.emitEvent(sessionId, 'thinking', {
          iteration,
          toolsUsed: toolCalls.map((t: any) => t.name),
        })
      }

      if (iteration >= this.maxIterations) {
        logger.warn({ sessionId }, 'Agent reached max iterations')
        await this.emitEvent(sessionId, 'error', {
          message: 'Max iterations reached',
        })
      }
    }

    private async executeTools(sessionId: string, toolCalls: any[]) {
      const results = []

      for (const toolCall of toolCalls) {
        logger.debug({ tool: toolCall.name, input: toolCall.input }, 'Executing tool')

        let result

        switch (toolCall.name) {
          case 'bash':
            result = await this.executeBash(sessionId, toolCall.input.command)
            await this.emitEvent(sessionId, 'terminal', {
              command: toolCall.input.command,
              output: result.stdout,
              error: result.stderr,
            })
            break

          case 'read_file':
            result = await this.readFile(sessionId, toolCall.input.path)
            break

          case 'write_file':
            result = await this.writeFile(sessionId, toolCall.input.path, toolCall.input.content)
            await this.emitEvent(sessionId, 'file_change', {
              path: toolCall.input.path,
              action: 'write',
            })
            break

          default:
            result = { error: `Unknown tool: ${toolCall.name}` }
        }

        results.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(result),
        })
      }

      return results
    }

    private async executeBash(sessionId: string, command: string) {
      return await this.sandboxes.execInSandbox(sessionId, ['bash', '-c', command])
    }

    private async readFile(sessionId: string, path: string) {
      const result = await this.sandboxes.execInSandbox(sessionId, ['cat', path])
      return { content: result.stdout }
    }

    private async writeFile(sessionId: string, path: string, content: string) {
      // Write to temp file then move (atomic)
      const tempPath = `/tmp/mobvibe-${Date.now()}`
      await this.sandboxes.execInSandbox(sessionId, [
        'bash', '-c',
        `echo ${JSON.stringify(content)} > ${tempPath} && mv ${tempPath} ${path}`
      ])
      return { success: true }
    }

    private async emitEvent(sessionId: string, eventType: string, data: any) {
      // Insert into session_events table
      logger.debug({ sessionId, eventType, data }, 'Emitting event')
      // Implementation in Phase 19
    }

    private extractTextResponse(content: any[]) {
      const textBlocks = content.filter((block: any) => block.type === 'text')
      return textBlocks.map((block: any) => block.text).join('\n')
    }
  }
  ```

- [ ] **Integrate with JobProcessor**:
  ```typescript
  // src/JobProcessor.ts (updated)
  import { AgentRunner } from './agent/AgentRunner'

  export class JobProcessor {
    private agent: AgentRunner

    constructor() {
      this.queue = new JobQueue()
      this.sandboxes = new SandboxLifecycle()
      this.agent = new AgentRunner(this.sandboxes)
    }

    private async processJob(job: any) {
      // Create sandbox
      await this.sandboxes.startSandbox(job.session_id)

      try {
        // Run Claude Agent
        await this.agent.runSession(job.session_id, job.prompt)

        await this.queue.completeJob(job.job_id)
      } catch (error) {
        await this.queue.failJob(job.job_id, error.message)
      } finally {
        await this.sandboxes.stopSandbox(job.session_id)
      }
    }
  }
  ```

- [ ] **Add Environment Variables**: `ANTHROPIC_API_KEY=your-key`

- [ ] **Test Agent Integration**:
  ```typescript
  describe('Claude Agent', () => {
    it('generates code from prompt', async () => {
      const agent = new AgentRunner(sandboxes)

      await agent.runSession('test-session', 'Create a simple counter app')

      // Verify files created in sandbox
      // Verify events emitted
    }, 60000)
  })
  ```

- [ ] **Document Agent System**: Create `docs/backend/CLAUDE_AGENT.md`

- [ ] **Update links-map**

## Artifacts & Paths

- `backend/worker/src/agent/ClaudeClient.ts`
- `backend/worker/src/agent/AgentRunner.ts`
- `backend/worker/src/agent/tools.ts`
- `tests/backend/claude-agent.test.ts`
- `docs/backend/CLAUDE_AGENT.md` ⭐

## Testing

- Agent executes bash commands
- Agent reads/writes files
- Agent loop completes
- Events emitted properly
- Costs tracked

## References

- [Architecture](./../../../../.docs/architecture.md)
- [Phase 15](./15-sandbox-orchestration.md)

## Handover

**Next Phase:** [17-coding-session-lifecycle.md](./17-coding-session-lifecycle.md)

---

**Status:** Ready after Phase 15
**Estimated Time:** 2.5 days
