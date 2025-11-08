import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config'
import { logger } from '../utils/logger'

export interface MessageParams {
  system: string
  messages: Anthropic.MessageParam[]
  tools?: Anthropic.Tool[]
  maxTokens?: number
}

export class ClaudeClient {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    })
  }

  async createMessage(params: MessageParams): Promise<Anthropic.Message> {
    logger.debug({ messageCount: params.messages.length }, 'Creating Claude message')

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: params.maxTokens || 8192,
        system: params.system,
        messages: params.messages,
        tools: params.tools,
      })

      logger.info({
        id: response.id,
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      }, 'Claude response received')

      return response
    } catch (error) {
      logger.error({ error }, 'Claude API error')
      throw error
    }
  }
}
