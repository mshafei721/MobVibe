import { logger } from '../utils/logger'
import { MobVibeError } from './types'

interface RetryConfig {
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
}

export class RetryManager {
  async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    let lastError: Error

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        logger.debug({ attempt, maxAttempts: finalConfig.maxAttempts }, 'Attempting operation')
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (error instanceof MobVibeError && !error.retryable) {
          logger.warn({ error: error.toJSON() }, 'Non-retryable error, aborting')
          throw error
        }

        if (attempt === finalConfig.maxAttempts) {
          logger.error({ error, attempt }, 'All retry attempts failed')
          break
        }

        const delay = Math.min(
          finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
          finalConfig.maxDelay
        )

        logger.warn(
          { error: error instanceof Error ? error.message : error, attempt, nextDelay: delay },
          'Operation failed, retrying'
        )

        await this.sleep(delay)
      }
    }

    throw lastError!
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
