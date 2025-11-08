export enum SessionState {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum SessionEventType {
  STATE_CHANGED = 'state_changed',
  THINKING = 'thinking',
  TERMINAL = 'terminal',
  FILE_CHANGE = 'file_change',
  COMPLETION = 'completion',
  ERROR = 'error',
}

export interface SessionMetadata {
  sessionId: string
  state: SessionState
  startedAt: Date
  lastActivityAt: Date
  completedAt?: Date
  duration?: number
  iterations?: number
  inputTokens?: number
  outputTokens?: number
  toolCalls?: number
  errorMessage?: string
}

export interface SessionEvent {
  sessionId: string
  eventType: SessionEventType
  data: any
  timestamp: Date
}

export interface StateTransition {
  from: SessionState
  to: SessionState
  timestamp: Date
  reason?: string
}

// Valid state transitions
export const VALID_TRANSITIONS: Record<SessionState, SessionState[]> = {
  [SessionState.PENDING]: [SessionState.ACTIVE, SessionState.EXPIRED],
  [SessionState.ACTIVE]: [
    SessionState.PAUSED,
    SessionState.COMPLETED,
    SessionState.FAILED,
    SessionState.EXPIRED,
  ],
  [SessionState.PAUSED]: [
    SessionState.ACTIVE,
    SessionState.EXPIRED,
    SessionState.FAILED,
  ],
  [SessionState.COMPLETED]: [],
  [SessionState.FAILED]: [],
  [SessionState.EXPIRED]: [],
}

export interface SessionSnapshot {
  sessionId: string
  state: SessionState
  metadata: SessionMetadata
  conversationHistory?: any[]
  sandboxId?: string
  timestamp: Date
}
