/**
 * Error Messages & Empty State Catalog
 *
 * Centralized user-facing error messages and empty state configurations.
 * Maps error codes from Phase 21 ErrorCatalog to friendly, actionable messages.
 *
 * Usage:
 * - Backend: Convert MobVibeError to user-facing message
 * - Mobile: Display error states with actions
 *
 * Design Principles:
 * - Explain what happened and why
 * - Offer actionable next steps
 * - No technical jargon
 * - Helpful, not blaming tone
 * - Context-appropriate severity
 */

/**
 * Error severity levels for visual presentation
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

/**
 * Error action types
 */
export type ErrorActionType =
  | 'retry'          // Retry the failed operation
  | 'dismiss'        // Close error message
  | 'viewCached'     // View cached/offline data
  | 'viewHistory'    // Navigate to session history
  | 'upgrade'        // Navigate to upgrade/pricing
  | 'learnMore'      // View documentation/help
  | 'wait'           // Wait and retry later
  | 'viewCode'       // Navigate to code viewer
  | 'getTips'        // Show optimization tips
  | 'checkStatus'    // Check service status page
  | 'continueWithoutAgent' // Continue without AI
  | 'viewLogs'       // View execution logs
  | 'getHelp'        // Contact support
  | 'optimize'       // Show optimization guide
  | 'contactSupport' // Contact support
  | 'startNewSession' // Create new session
  | 'viewUsage'      // View usage dashboard
  | 'optimizePrompts' // Show prompt optimization tips
  | 'clearFilters'   // Clear search filters
  | 'viewAll'        // View all sessions

/**
 * Error action configuration
 */
export interface ErrorAction {
  type: ErrorActionType
  label: string
  style: 'primary' | 'secondary' | 'destructive'
}

/**
 * Error message configuration
 */
export interface ErrorMessage {
  code: string
  title: string
  message: string
  severity: ErrorSeverity
  illustration?: string
  actions: ErrorAction[]
  helpLink?: string
}

/**
 * Empty state configuration
 */
export interface EmptyState {
  key: string
  illustration: string
  title: string
  description: string
  primaryAction?: {
    label: string
    action: string
  }
  secondaryActions?: Array<{
    label: string
    action: string
  }>
}

/**
 * Network & Connectivity Errors
 */
export const NETWORK_ERRORS: Record<string, ErrorMessage> = {
  OFFLINE: {
    code: 'NETWORK_OFFLINE',
    title: "You're offline",
    message: "Check your connection and try again. Your work is saved locally.",
    severity: 'warning',
    illustration: 'offline',
    actions: [
      { type: 'retry', label: 'Try Again', style: 'primary' },
      { type: 'viewCached', label: 'View Saved Work', style: 'secondary' },
    ],
  },
  TIMEOUT: {
    code: 'NETWORK_TIMEOUT',
    title: 'Request took too long',
    message: "The server didn't respond in time. Check your connection and try again.",
    severity: 'warning',
    illustration: 'timeout',
    actions: [
      { type: 'retry', label: 'Try Again', style: 'primary' },
      { type: 'checkStatus', label: 'Check Status', style: 'secondary' },
    ],
  },
  SERVER_DOWN: {
    code: 'NETWORK_ERROR',
    title: 'Service unavailable',
    message: "We're having trouble connecting. This is usually temporary.",
    severity: 'error',
    illustration: 'server-down',
    actions: [
      { type: 'retry', label: 'Try Again', style: 'primary' },
      { type: 'checkStatus', label: 'Check Status', style: 'secondary' },
    ],
  },
}

/**
 * API & Rate Limiting Errors
 */
export const API_ERRORS: Record<string, ErrorMessage> = {
  RATE_LIMIT: {
    code: 'API_RATE_LIMIT',
    title: 'Slow down a bit',
    message: "You've made too many requests. Wait a moment and try again.",
    severity: 'warning',
    illustration: 'rate-limit',
    actions: [
      { type: 'wait', label: 'Wait & Retry', style: 'primary' },
      { type: 'learnMore', label: 'Learn More', style: 'secondary' },
    ],
    helpLink: '/docs/rate-limits',
  },
  AUTH_FAILED: {
    code: 'API_AUTH_FAILED',
    title: 'Authentication failed',
    message: 'Your session expired. Please sign in again.',
    severity: 'error',
    illustration: 'auth-failed',
    actions: [
      { type: 'retry', label: 'Sign In', style: 'primary' },
      { type: 'getHelp', label: 'Get Help', style: 'secondary' },
    ],
  },
  INVALID_REQUEST: {
    code: 'API_INVALID_REQUEST',
    title: 'Invalid request',
    message: 'Something went wrong with your request. Please try again.',
    severity: 'error',
    illustration: 'invalid-request',
    actions: [
      { type: 'retry', label: 'Try Again', style: 'primary' },
      { type: 'contactSupport', label: 'Contact Support', style: 'secondary' },
    ],
  },
}

/**
 * Execution & Sandbox Errors
 */
export const EXECUTION_ERRORS: Record<string, ErrorMessage> = {
  SANDBOX_CRASH: {
    code: 'SANDBOX_CRASH',
    title: 'Code execution failed',
    message: 'This might be a memory or syntax issue. Check your code and try again.',
    severity: 'error',
    illustration: 'crash',
    actions: [
      { type: 'retry', label: 'Try Again', style: 'primary' },
      { type: 'viewCode', label: 'View Code', style: 'secondary' },
      { type: 'viewLogs', label: 'View Logs', style: 'secondary' },
    ],
  },
  TIMEOUT: {
    code: 'EXECUTION_TIMEOUT',
    title: 'Code took too long',
    message: 'Execution stopped after 30 seconds. Try optimizing your code or breaking it into smaller parts.',
    severity: 'warning',
    illustration: 'timeout',
    actions: [
      { type: 'retry', label: 'Try Again', style: 'primary' },
      { type: 'viewCode', label: 'View Code', style: 'secondary' },
      { type: 'getTips', label: 'Optimization Tips', style: 'secondary' },
    ],
    helpLink: '/docs/optimization',
  },
  MEMORY_LIMIT: {
    code: 'EXECUTION_MEMORY_LIMIT',
    title: 'Memory limit exceeded',
    message: 'Your code used too much memory. Try processing smaller datasets or optimizing memory usage.',
    severity: 'error',
    illustration: 'memory',
    actions: [
      { type: 'retry', label: 'Try Again', style: 'primary' },
      { type: 'getTips', label: 'Memory Tips', style: 'secondary' },
    ],
    helpLink: '/docs/memory-limits',
  },
  COMMAND_FAILED: {
    code: 'COMMAND_FAILED',
    title: 'Command execution failed',
    message: 'The command encountered an error. Check the logs for details.',
    severity: 'error',
    illustration: 'command-failed',
    actions: [
      { type: 'retry', label: 'Try Again', style: 'primary' },
      { type: 'viewLogs', label: 'View Logs', style: 'secondary' },
    ],
  },
}

/**
 * Usage Limit & Quota Errors
 */
export const QUOTA_ERRORS: Record<string, ErrorMessage> = {
  SESSION_LIMIT: {
    code: 'QUOTA_EXCEEDED',
    title: 'Monthly limit reached',
    message: "You've used all your sessions this month. Upgrade for 50 sessions per month.",
    severity: 'warning',
    illustration: 'quota',
    actions: [
      { type: 'upgrade', label: 'Upgrade Now', style: 'primary' },
      { type: 'viewHistory', label: 'View History', style: 'secondary' },
    ],
  },
  TOKEN_LIMIT: {
    code: 'TOKEN_LIMIT_EXCEEDED',
    title: 'Session token limit reached',
    message: 'This session used too many tokens. Try shorter conversations or upgrade your plan.',
    severity: 'warning',
    illustration: 'tokens',
    actions: [
      { type: 'startNewSession', label: 'New Session', style: 'primary' },
      { type: 'viewUsage', label: 'View Usage', style: 'secondary' },
      { type: 'optimizePrompts', label: 'Optimize Prompts', style: 'secondary' },
    ],
    helpLink: '/docs/token-limits',
  },
  APPROACHING_LIMIT: {
    code: 'QUOTA_WARNING',
    title: 'Approaching monthly limit',
    message: 'You have {remaining} session{plural} remaining this month.',
    severity: 'info',
    illustration: 'warning',
    actions: [
      { type: 'viewUsage', label: 'View Usage', style: 'primary' },
      { type: 'upgrade', label: 'Upgrade', style: 'secondary' },
    ],
  },
}

/**
 * Claude Agent Errors
 */
export const AGENT_ERRORS: Record<string, ErrorMessage> = {
  UNAVAILABLE: {
    code: 'AGENT_UNAVAILABLE',
    title: 'Claude is temporarily unavailable',
    message: "Our AI service is down. You can still run code and view history.",
    severity: 'error',
    illustration: 'agent-down',
    actions: [
      { type: 'continueWithoutAgent', label: 'Continue', style: 'primary' },
      { type: 'checkStatus', label: 'Check Status', style: 'secondary' },
    ],
  },
  RATE_LIMIT: {
    code: 'CLAUDE_RATE_LIMIT',
    title: 'AI service busy',
    message: "We're retrying automatically. This usually resolves quickly.",
    severity: 'info',
    illustration: 'busy',
    actions: [
      { type: 'wait', label: 'Wait', style: 'primary' },
    ],
  },
  AUTH_FAILED: {
    code: 'CLAUDE_AUTH_FAILED',
    title: 'AI service authentication failed',
    message: "We're having trouble connecting to our AI service. Our team has been notified.",
    severity: 'critical',
    illustration: 'critical',
    actions: [
      { type: 'contactSupport', label: 'Contact Support', style: 'primary' },
      { type: 'checkStatus', label: 'Check Status', style: 'secondary' },
    ],
  },
}

/**
 * Data & Validation Errors
 */
export const DATA_ERRORS: Record<string, ErrorMessage> = {
  CORRUPTED_STATE: {
    code: 'DATA_CORRUPTED',
    title: 'Session data corrupted',
    message: "We couldn't restore your session. Starting fresh won't lose your code.",
    severity: 'error',
    illustration: 'corrupted',
    actions: [
      { type: 'startNewSession', label: 'Start Fresh', style: 'primary' },
      { type: 'contactSupport', label: 'Contact Support', style: 'secondary' },
    ],
  },
  INVALID_PROMPT: {
    code: 'INVALID_PROMPT',
    title: 'Invalid prompt',
    message: 'Please provide a clear description of what you want to build.',
    severity: 'warning',
    illustration: 'invalid-input',
    actions: [
      { type: 'retry', label: 'Try Again', style: 'primary' },
      { type: 'getTips', label: 'Prompt Tips', style: 'secondary' },
    ],
    helpLink: '/docs/writing-prompts',
  },
  FILE_SYNC_FAILED: {
    code: 'FILE_SYNC_FAILED',
    title: 'File sync failed',
    message: "We couldn't save your files. Check your connection and try again.",
    severity: 'warning',
    illustration: 'sync-failed',
    actions: [
      { type: 'retry', label: 'Retry Sync', style: 'primary' },
      { type: 'viewLogs', label: 'View Logs', style: 'secondary' },
    ],
  },
}

/**
 * System Errors
 */
export const SYSTEM_ERRORS: Record<string, ErrorMessage> = {
  WORKER_CRASH: {
    code: 'WORKER_CRASH',
    title: 'Something went wrong',
    message: 'Internal error occurred. Our team has been notified.',
    severity: 'critical',
    illustration: 'critical',
    actions: [
      { type: 'retry', label: 'Try Again', style: 'primary' },
      { type: 'contactSupport', label: 'Contact Support', style: 'secondary' },
    ],
  },
  DB_CONNECTION_FAILED: {
    code: 'DB_CONNECTION_FAILED',
    title: 'Database connection failed',
    message: "We're having trouble saving data. Retrying automatically.",
    severity: 'error',
    illustration: 'database',
    actions: [
      { type: 'wait', label: 'Wait & Retry', style: 'primary' },
      { type: 'checkStatus', label: 'Check Status', style: 'secondary' },
    ],
  },
  UNKNOWN: {
    code: 'UNKNOWN_ERROR',
    title: 'Unexpected error',
    message: 'Something unexpected happened. Please try again.',
    severity: 'error',
    illustration: 'unknown',
    actions: [
      { type: 'retry', label: 'Try Again', style: 'primary' },
      { type: 'contactSupport', label: 'Contact Support', style: 'secondary' },
    ],
  },
}

/**
 * All error messages combined
 */
export const ERROR_MESSAGES = {
  ...NETWORK_ERRORS,
  ...API_ERRORS,
  ...EXECUTION_ERRORS,
  ...QUOTA_ERRORS,
  ...AGENT_ERRORS,
  ...DATA_ERRORS,
  ...SYSTEM_ERRORS,
} as const

/**
 * Empty state configurations
 */
export const EMPTY_STATES: Record<string, EmptyState> = {
  NEW_USER: {
    key: 'new_user',
    illustration: 'welcome-robot',
    title: 'Welcome to MobVibe!',
    description: 'Create your first coding session with AI assistance. Build mobile apps using natural language.',
    primaryAction: {
      label: 'Start First Session',
      action: 'create_session',
    },
    secondaryActions: [
      { label: 'Take Tour', action: 'start_tour' },
      { label: 'View Examples', action: 'view_examples' },
    ],
  },
  NO_SESSIONS: {
    key: 'no_sessions',
    illustration: 'empty-folder',
    title: 'No sessions yet',
    description: 'Your completed sessions will appear here. Start a new session to begin coding.',
    primaryAction: {
      label: 'Start New Session',
      action: 'create_session',
    },
  },
  NO_HISTORY: {
    key: 'no_history',
    illustration: 'empty-history',
    title: 'No session history',
    description: 'Your past sessions will be saved here for easy access.',
    primaryAction: {
      label: 'Start Your First Session',
      action: 'create_session',
    },
  },
  NO_OUTPUT: {
    key: 'no_output',
    illustration: 'waiting',
    title: 'No output yet',
    description: 'Run your code to see results here. Tap the play button when ready.',
  },
  NO_SUGGESTIONS: {
    key: 'no_suggestions',
    illustration: 'thinking-robot',
    title: 'No suggestions available',
    description: 'Start coding and the AI assistant will provide helpful tips and improvements.',
  },
  NO_FILES: {
    key: 'no_files',
    illustration: 'empty-files',
    title: 'No files created yet',
    description: 'Files will appear here as your AI agent generates code.',
  },
  NO_SEARCH_RESULTS: {
    key: 'no_search_results',
    illustration: 'magnifying-glass',
    title: 'No results found',
    description: 'Try different keywords or clear your filters to see more sessions.',
    primaryAction: {
      label: 'Clear Filters',
      action: 'clear_filters',
    },
    secondaryActions: [
      { label: 'View All Sessions', action: 'view_all' },
    ],
  },
  NO_NOTIFICATIONS: {
    key: 'no_notifications',
    illustration: 'bell',
    title: 'No notifications',
    description: "You're all caught up! We'll notify you about important updates.",
  },
  OFFLINE_MODE: {
    key: 'offline_mode',
    illustration: 'offline',
    title: "You're offline",
    description: 'You can still view your saved sessions and code. Some features require connection.',
    primaryAction: {
      label: 'View Saved Sessions',
      action: 'view_cached',
    },
  },
}

/**
 * Helper function to get error message by code
 */
export function getErrorMessage(code: string): ErrorMessage | undefined {
  return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES]
}

/**
 * Helper function to get empty state by key
 */
export function getEmptyState(key: string): EmptyState | undefined {
  return EMPTY_STATES[key as keyof typeof EMPTY_STATES]
}

/**
 * Helper function to format error message with dynamic values
 */
export function formatErrorMessage(
  message: string,
  values: Record<string, string | number>
): string {
  let formatted = message
  Object.entries(values).forEach(([key, value]) => {
    formatted = formatted.replace(`{${key}}`, String(value))
  })
  return formatted
}
