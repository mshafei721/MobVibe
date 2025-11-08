import { MobVibeError, ErrorCategory } from './types'

export const ErrorCatalog = {
  SANDBOX_CREATION_FAILED: () =>
    new MobVibeError(
      ErrorCategory.TRANSIENT,
      'SANDBOX_CREATE_FAILED',
      'Failed to create sandbox',
      'Unable to start coding environment. Retrying...',
      true
    ),

  CLAUDE_API_RATE_LIMIT: () =>
    new MobVibeError(
      ErrorCategory.TRANSIENT,
      'CLAUDE_RATE_LIMIT',
      'Claude API rate limit hit',
      'AI service temporarily busy. Retrying...',
      true
    ),

  SUPABASE_CONNECTION_FAILED: () =>
    new MobVibeError(
      ErrorCategory.TRANSIENT,
      'DB_CONNECTION_FAILED',
      'Database connection failed',
      'Connection issue. Retrying...',
      true
    ),

  CLAUDE_API_AUTH_FAILED: () =>
    new MobVibeError(
      ErrorCategory.PERMANENT,
      'CLAUDE_AUTH_FAILED',
      'Claude API authentication failed',
      'AI service unavailable. Please contact support.',
      false
    ),

  SANDBOX_TIMEOUT: () =>
    new MobVibeError(
      ErrorCategory.PERMANENT,
      'SANDBOX_TIMEOUT',
      'Sandbox execution timeout',
      'Operation took too long and was cancelled.',
      false
    ),

  INVALID_PROMPT: () =>
    new MobVibeError(
      ErrorCategory.USER_ERROR,
      'INVALID_PROMPT',
      'Invalid prompt provided',
      'Please provide a clear description of what you want to build.',
      false
    ),

  INSUFFICIENT_CREDITS: () =>
    new MobVibeError(
      ErrorCategory.USER_ERROR,
      'INSUFFICIENT_CREDITS',
      'User has insufficient credits',
      'Not enough credits. Please add more to continue.',
      false
    ),

  WORKER_CRASH: () =>
    new MobVibeError(
      ErrorCategory.SYSTEM_ERROR,
      'WORKER_CRASH',
      'Worker process crashed',
      'Internal error occurred. Our team has been notified.',
      false
    ),

  FILE_SYNC_FAILED: () =>
    new MobVibeError(
      ErrorCategory.TRANSIENT,
      'FILE_SYNC_FAILED',
      'File synchronization failed',
      'File upload failed. Retrying...',
      true
    ),

  COMMAND_EXECUTION_FAILED: (details?: any) =>
    new MobVibeError(
      ErrorCategory.PERMANENT,
      'COMMAND_FAILED',
      'Command execution failed',
      'Command failed to execute. Check your code and try again.',
      false,
      details
    ),

  NETWORK_ERROR: () =>
    new MobVibeError(
      ErrorCategory.TRANSIENT,
      'NETWORK_ERROR',
      'Network error occurred',
      'Network issue. Retrying...',
      true
    ),
}
