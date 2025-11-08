export enum ErrorCategory {
  TRANSIENT = 'transient',
  PERMANENT = 'permanent',
  USER_ERROR = 'user_error',
  SYSTEM_ERROR = 'system_error',
}

export interface AppError {
  category: ErrorCategory
  code: string
  message: string
  userMessage: string
  retryable: boolean
  details?: any
}

export class MobVibeError extends Error {
  constructor(
    public readonly category: ErrorCategory,
    public readonly code: string,
    message: string,
    public readonly userMessage: string,
    public readonly retryable: boolean = false,
    public readonly details?: any
  ) {
    super(message)
    this.name = 'MobVibeError'
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON(): AppError {
    return {
      category: this.category,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      retryable: this.retryable,
      details: this.details,
    }
  }
}
