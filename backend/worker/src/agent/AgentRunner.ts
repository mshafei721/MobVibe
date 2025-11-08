import Anthropic from '@anthropic-ai/sdk'
import { ClaudeClient, MessageParams } from './ClaudeClient'
import { agentTools } from './tools'
import { SandboxLifecycle } from '../sandbox/SandboxLifecycle'
import { SessionLifecycleManager } from '../services/SessionLifecycleManager'
import { FileSyncService } from '../services/FileSyncService'
import { OutputStreamer } from '../sandbox/OutputStreamer'
import { PreviewManager } from '../preview/PreviewManager'
import { SessionEventType } from '../types/session-lifecycle'
import { RetryManager } from '../errors/RetryManager'
import { ErrorHandler } from '../errors/ErrorHandler'
import { ErrorCatalog } from '../errors/catalog'
import { logger } from '../utils/logger'
import { config } from '../config'

export interface SessionStats {
  iterations: number
  inputTokens: number
  outputTokens: number
  toolCalls: number
}

export class AgentRunner {
  private claude: ClaudeClient
  private sandboxes: SandboxLifecycle
  private lifecycle: SessionLifecycleManager
  private fileSync: FileSyncService
  private streamer: OutputStreamer
  private previewManager: PreviewManager
  private retry: RetryManager
  private errorHandler: ErrorHandler
  private maxIterations = 25

  constructor(sandboxes: SandboxLifecycle, lifecycle: SessionLifecycleManager) {
    this.claude = new ClaudeClient()
    this.sandboxes = sandboxes
    this.lifecycle = lifecycle
    this.fileSync = new FileSyncService()
    this.streamer = new OutputStreamer(lifecycle)
    this.previewManager = new PreviewManager(sandboxes, lifecycle)
    this.retry = new RetryManager()
    this.errorHandler = new ErrorHandler(lifecycle)
  }

  async runSession(sessionId: string, prompt: string): Promise<SessionStats> {
    logger.info({ sessionId, promptLength: prompt.length }, 'Starting agent session')

    try {
      const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }]

      const systemPrompt = `You are an expert React Native developer using Expo.
Your job is to build mobile apps based on user requirements.
You have access to a sandbox environment where you can execute bash commands and manage files.

Available tools:
- bash: Execute shell commands (npm, expo, etc.)
- read_file: Read file contents
- write_file: Create or update files

Build the app step by step, testing as you go. When finished, respond with a summary of what was created.`

      const stats: SessionStats = {
        iterations: 0,
        inputTokens: 0,
        outputTokens: 0,
        toolCalls: 0,
      }

      while (stats.iterations < this.maxIterations) {
        stats.iterations++
        logger.debug({ iteration: stats.iterations }, 'Agent iteration')

        const response = await this.retry.withRetry(
          async () => {
            try {
              return await this.claude.createMessage({
                system: systemPrompt,
                messages,
                tools: agentTools,
                maxTokens: 8192,
              })
            } catch (error: any) {
              if (error.status === 429) {
                throw ErrorCatalog.CLAUDE_API_RATE_LIMIT()
              }
              if (error.status === 401) {
                throw ErrorCatalog.CLAUDE_API_AUTH_FAILED()
              }
              throw error
            }
          },
          { maxAttempts: 3 }
        )

        stats.inputTokens += response.usage.input_tokens
        stats.outputTokens += response.usage.output_tokens

        messages.push({
          role: 'assistant',
          content: response.content,
        })

        const toolCalls = response.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        )

        if (toolCalls.length === 0) {
          logger.info({ stats }, 'Agent completed')
          await this.lifecycle.emitEvent(sessionId, SessionEventType.COMPLETION, {
            message: this.extractTextResponse(response.content),
            stats,
          })

          try {
            logger.info({ sessionId }, 'Generating preview URL')
            const previewUrl = await this.previewManager.generatePreviewUrl(sessionId)
            logger.info({ sessionId, previewUrl }, 'Preview URL generated')
          } catch (error) {
            logger.warn({ sessionId, error }, 'Failed to generate preview URL, continuing anyway')
          }

          break
        }

        stats.toolCalls += toolCalls.length

        const toolResults = await this.executeTools(sessionId, toolCalls)

        messages.push({
          role: 'user',
          content: toolResults,
        })

        this.lifecycle.recordActivity(sessionId)

        await this.lifecycle.emitEvent(sessionId, SessionEventType.THINKING, {
          iteration: stats.iterations,
          toolsUsed: toolCalls.map((t) => t.name),
        })
      }

      if (stats.iterations >= this.maxIterations) {
        logger.warn({ sessionId, stats }, 'Agent reached max iterations')
        throw new Error('Max iterations reached')
      }

      return stats
    } catch (error) {
      await this.errorHandler.handleError(sessionId, error as Error)
      throw error
    }
  }

  private async executeTools(
    sessionId: string,
    toolCalls: Anthropic.ToolUseBlock[]
  ): Promise<Anthropic.ToolResultBlockParam[]> {
    const results: Anthropic.ToolResultBlockParam[] = []

    for (const toolCall of toolCalls) {
      logger.debug({ tool: toolCall.name, input: toolCall.input }, 'Executing tool')

      let result: any

      try {
        switch (toolCall.name) {
          case 'bash':
            result = await this.executeBash(sessionId, (toolCall.input as any).command)
            break

          case 'read_file':
            result = await this.readFile(sessionId, (toolCall.input as any).path)
            break

          case 'write_file':
            result = await this.writeFile(
              sessionId,
              (toolCall.input as any).path,
              (toolCall.input as any).content
            )
            await this.lifecycle.emitEvent(sessionId, SessionEventType.FILE_CHANGE, {
              path: (toolCall.input as any).path,
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
      } catch (error) {
        logger.error({ error, tool: toolCall.name }, 'Tool execution failed')
        results.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
          is_error: true,
        })
      }
    }

    return results
  }

  private async executeBash(sessionId: string, command: string) {
    const activeSandbox = this.sandboxes.getActiveSandbox(sessionId)
    if (!activeSandbox) {
      throw new Error('No active sandbox for session')
    }

    const result = await this.sandboxes.manager.execCommandWithStreaming(
      activeSandbox.sandbox.id,
      ['bash', '-c', command],
      sessionId,
      this.streamer
    )

    return {
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    }
  }

  private async readFile(sessionId: string, path: string) {
    const result = await this.sandboxes.execInSandbox(sessionId, ['cat', path])

    if (result.exitCode !== 0) {
      throw new Error(`Failed to read file: ${result.stderr}`)
    }

    return { content: result.stdout }
  }

  private async writeFile(sessionId: string, path: string, content: string) {
    const tempPath = `/tmp/mobvibe-${Date.now()}`

    const writeResult = await this.sandboxes.execInSandbox(sessionId, [
      'bash',
      '-c',
      `mkdir -p $(dirname ${path}) && echo ${this.escapeShellArg(content)} > ${tempPath} && mv ${tempPath} ${path}`,
    ])

    if (writeResult.exitCode !== 0) {
      throw new Error(`Failed to write file: ${writeResult.stderr}`)
    }

    await this.retry.withRetry(
      async () => {
        try {
          await this.fileSync.uploadFile(sessionId, path, Buffer.from(content))
          logger.debug({ sessionId, path }, 'File synced to storage')
        } catch (error) {
          throw ErrorCatalog.FILE_SYNC_FAILED()
        }
      },
      { maxAttempts: 3, initialDelay: 500 }
    ).catch((error) => {
      logger.warn({ sessionId, path, error }, 'File sync to storage failed after retries')
    })

    return { success: true, path }
  }

  private escapeShellArg(arg: string): string {
    return `'${arg.replace(/'/g, "'\\''")}'`
  }

  private extractTextResponse(content: Anthropic.ContentBlock[]): string {
    const textBlocks = content.filter((block): block is Anthropic.TextBlock =>
      block.type === 'text'
    )
    return textBlocks.map(block => block.text).join('\n')
  }
}
