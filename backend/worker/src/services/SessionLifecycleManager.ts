import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from '../config'
import { logger } from '../utils/logger'
import {
  SessionState,
  SessionMetadata,
  SessionEvent,
  SessionEventType,
  StateTransition,
  VALID_TRANSITIONS,
} from '../types/session-lifecycle'

export class SessionLifecycleManager {
  private supabase: SupabaseClient
  private sessionMetadata = new Map<string, SessionMetadata>()
  private cleanupInterval: NodeJS.Timeout | null = null
  private readonly sessionTimeoutMs = 1800000 // 30 minutes

  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  async transitionState(
    sessionId: string,
    newState: SessionState,
    reason?: string
  ): Promise<void> {
    const currentState = await this.getCurrentState(sessionId)

    if (!this.isValidTransition(currentState, newState)) {
      throw new Error(
        `Invalid state transition: ${currentState} → ${newState} for session ${sessionId}`
      )
    }

    logger.info({ sessionId, from: currentState, to: newState, reason }, 'Session state transition')

    const { error } = await this.supabase
      .from('coding_sessions')
      .update({
        status: newState,
        updated_at: new Date().toISOString(),
        ...(newState === SessionState.COMPLETED || newState === SessionState.FAILED
          ? { completed_at: new Date().toISOString() }
          : {}),
      })
      .eq('id', sessionId)

    if (error) {
      logger.error({ error, sessionId }, 'Failed to update session state')
      throw error
    }

    await this.emitEvent(sessionId, SessionEventType.STATE_CHANGED, {
      from: currentState,
      to: newState,
      reason,
    })

    this.updateMetadata(sessionId, { state: newState })
  }

  async startSession(sessionId: string): Promise<void> {
    await this.transitionState(sessionId, SessionState.ACTIVE, 'Session started')

    this.sessionMetadata.set(sessionId, {
      sessionId,
      state: SessionState.ACTIVE,
      startedAt: new Date(),
      lastActivityAt: new Date(),
    })

    logger.info({ sessionId }, 'Session started')
  }

  async completeSession(
    sessionId: string,
    stats: { iterations: number; inputTokens: number; outputTokens: number; toolCalls: number }
  ): Promise<void> {
    const metadata = this.sessionMetadata.get(sessionId)
    const duration = metadata ? Date.now() - metadata.startedAt.getTime() : 0

    await this.transitionState(sessionId, SessionState.COMPLETED, 'Agent completed successfully')

    this.updateMetadata(sessionId, {
      completedAt: new Date(),
      duration,
      ...stats,
    })

    logger.info({ sessionId, duration, stats }, 'Session completed')
  }

  async failSession(sessionId: string, errorMessage: string): Promise<void> {
    const metadata = this.sessionMetadata.get(sessionId)
    const duration = metadata ? Date.now() - metadata.startedAt.getTime() : 0

    await this.transitionState(sessionId, SessionState.FAILED, errorMessage)

    this.updateMetadata(sessionId, {
      completedAt: new Date(),
      duration,
      errorMessage,
    })

    logger.error({ sessionId, errorMessage, duration }, 'Session failed')
  }

  async pauseSession(sessionId: string): Promise<void> {
    await this.transitionState(sessionId, SessionState.PAUSED, 'Session paused by user')
    this.updateMetadata(sessionId, { lastActivityAt: new Date() })

    logger.info({ sessionId }, 'Session paused')
  }

  async resumeSession(sessionId: string): Promise<void> {
    await this.transitionState(sessionId, SessionState.ACTIVE, 'Session resumed by user')
    this.updateMetadata(sessionId, { lastActivityAt: new Date() })

    logger.info({ sessionId }, 'Session resumed')
  }

  recordActivity(sessionId: string): void {
    this.updateMetadata(sessionId, { lastActivityAt: new Date() })
  }

  async emitEvent(sessionId: string, eventType: SessionEventType, data: any): Promise<void> {
    const event: SessionEvent = {
      sessionId,
      eventType,
      data,
      timestamp: new Date(),
    }

    logger.debug({ sessionId, eventType }, 'Emitting session event')

    const { error } = await this.supabase.from('session_events').insert({
      session_id: sessionId,
      event_type: eventType,
      event_data: data,
      created_at: event.timestamp.toISOString(),
    })

    if (error) {
      logger.error({ error, sessionId, eventType }, 'Failed to insert session event')
    }
  }

  startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.checkExpiredSessions().catch((error) => {
        logger.error({ error }, 'Session cleanup cycle failed')
      })
    }, 60000) // Every 60 seconds
  }

  async checkExpiredSessions(): Promise<string[]> {
    const now = new Date()
    const expiredSessionIds: string[] = []

    for (const [sessionId, metadata] of this.sessionMetadata) {
      if (metadata.state === SessionState.ACTIVE || metadata.state === SessionState.PAUSED) {
        const age = now.getTime() - metadata.lastActivityAt.getTime()

        if (age > this.sessionTimeoutMs) {
          expiredSessionIds.push(sessionId)
          await this.expireSession(sessionId)
        }
      }
    }

    if (expiredSessionIds.length > 0) {
      logger.info({ count: expiredSessionIds.length, sessionIds: expiredSessionIds }, 'Expired sessions cleaned up')
    }

    return expiredSessionIds
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    const activeSessions = Array.from(this.sessionMetadata.entries())
      .filter(([_, metadata]) => metadata.state === SessionState.ACTIVE)
      .map(([sessionId]) => sessionId)

    for (const sessionId of activeSessions) {
      await this.pauseSession(sessionId)
    }

    logger.info({ activeSessionsPaused: activeSessions.length }, 'Session lifecycle manager shut down')
  }

  async getEventHistory(sessionId: string, limit: number = 100): Promise<SessionEvent[]> {
    const { data, error } = await this.supabase
      .from('session_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error({ error, sessionId }, 'Failed to fetch event history')
      throw error
    }

    return data.reverse().map(row => ({
      sessionId: row.session_id,
      eventType: row.event_type as SessionEventType,
      data: row.event_data,
      timestamp: new Date(row.created_at),
    }))
  }

  private async getCurrentState(sessionId: string): Promise<SessionState> {
    const cached = this.sessionMetadata.get(sessionId)
    if (cached) return cached.state

    const { data, error } = await this.supabase
      .from('coding_sessions')
      .select('status')
      .eq('id', sessionId)
      .single()

    if (error || !data) {
      return SessionState.PENDING
    }

    return data.status as SessionState
  }

  private isValidTransition(from: SessionState, to: SessionState): boolean {
    const validNext = VALID_TRANSITIONS[from]
    return validNext.includes(to)
  }

  private updateMetadata(sessionId: string, updates: Partial<SessionMetadata>): void {
    const existing = this.sessionMetadata.get(sessionId) || {
      sessionId,
      state: SessionState.PENDING,
      startedAt: new Date(),
      lastActivityAt: new Date(),
    }

    this.sessionMetadata.set(sessionId, {
      ...existing,
      ...updates,
    })
  }

  private async expireSession(sessionId: string): Promise<void> {
    const metadata = this.sessionMetadata.get(sessionId)
    const duration = metadata ? Date.now() - metadata.startedAt.getTime() : 0

    await this.transitionState(sessionId, SessionState.EXPIRED, 'Session timeout')

    this.updateMetadata(sessionId, {
      completedAt: new Date(),
      duration,
    })

    this.sessionMetadata.delete(sessionId)

    logger.warn({ sessionId, duration }, 'Session expired due to timeout')
  }
}
