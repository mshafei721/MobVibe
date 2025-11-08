import { SessionLifecycleManager } from '../services/SessionLifecycleManager'
import { SessionEventType } from '../types/session-lifecycle'
import { logger } from '../utils/logger'
import { MobVibeError, ErrorCategory } from './types'

export class ErrorHandler {
  private lifecycle: SessionLifecycleManager

  constructor(lifecycle: SessionLifecycleManager) {
    this.lifecycle = lifecycle
  }

  async handleError(sessionId: string, error: Error): Promise<MobVibeError> {
    logger.error({ sessionId, error: error.message, stack: error.stack }, 'Handling error')

    let mobvibeError: MobVibeError

    if (error instanceof MobVibeError) {
      mobvibeError = error
    } else {
      mobvibeError = new MobVibeError(
        ErrorCategory.SYSTEM_ERROR,
        'UNKNOWN_ERROR',
        error.message,
        'An unexpected error occurred. Please try again.',
        false,
        { stack: error.stack }
      )
    }

    await this.lifecycle
      .emitEvent(sessionId, SessionEventType.ERROR, {
        code: mobvibeError.code,
        message: mobvibeError.userMessage,
        category: mobvibeError.category,
        retryable: mobvibeError.retryable,
        timestamp: new Date(),
      })
      .catch((err) => {
        logger.error({ err, sessionId }, 'Failed to emit error event')
      })

    if (mobvibeError.category === ErrorCategory.SYSTEM_ERROR) {
      logger.error(
        { error: mobvibeError.toJSON(), sessionId },
        'System error detected - alert operations'
      )
    }

    return mobvibeError
  }

  wrapError(error: Error, sessionId?: string): MobVibeError {
    if (error instanceof MobVibeError) {
      return error
    }

    const errorMessage = error.message.toLowerCase()

    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return new MobVibeError(
        ErrorCategory.TRANSIENT,
        'RATE_LIMIT',
        error.message,
        'Service temporarily busy. Retrying...',
        true
      )
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return new MobVibeError(
        ErrorCategory.PERMANENT,
        'TIMEOUT',
        error.message,
        'Operation took too long and was cancelled.',
        false
      )
    }

    if (errorMessage.includes('network') || errorMessage.includes('econnrefused')) {
      return new MobVibeError(
        ErrorCategory.TRANSIENT,
        'NETWORK_ERROR',
        error.message,
        'Network issue. Retrying...',
        true
      )
    }

    if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
      return new MobVibeError(
        ErrorCategory.PERMANENT,
        'AUTH_FAILED',
        error.message,
        'Authentication failed. Please contact support.',
        false
      )
    }

    return new MobVibeError(
      ErrorCategory.SYSTEM_ERROR,
      'UNKNOWN_ERROR',
      error.message,
      'An unexpected error occurred. Please try again.',
      false,
      { stack: error.stack }
    )
  }
}
