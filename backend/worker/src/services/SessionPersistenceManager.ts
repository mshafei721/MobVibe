import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createGzip, gunzip } from 'zlib'
import { promisify } from 'util'
import config from '../config'
import logger from '../utils/logger'

const gunzipAsync = promisify(gunzip)

/**
 * Session state snapshot structure
 */
export interface SessionStateSnapshot {
  version: number
  timestamp: string
  agentContext: {
    conversationHistory: Array<{
      role: 'user' | 'assistant'
      content: string
      timestamp: string
    }>
    currentTask?: string
    completedTasks: string[]
    suggestions: string[]
  }
  files: {
    path: string
    content: string
    hash: string
    lastModified: string
  }[]
  outputs: {
    type: 'stdout' | 'stderr' | 'command'
    content: string
    timestamp: string
  }[]
  metadata: {
    duration: number
    tokenUsage: number
    toolCalls: number
    errorCount: number
  }
}

/**
 * Resumable session info
 */
export interface ResumableSession {
  id: string
  projectId: string
  projectName: string
  initialPrompt: string
  lastActivity: string
  status: string
  resumeCount: number
  stateSizeBytes: number
  preview: {
    lastTask?: string
    filesCount: number
    outputsCount: number
  }
}

/**
 * Session storage statistics
 */
export interface SessionStorageStats {
  totalSessions: number
  activeSessions: number
  resumableSessions: number
  totalStorageBytes: number
  averageSessionSizeBytes: number
}

/**
 * Manages session state persistence, resume functionality, and cleanup.
 * Handles automatic saving, compression, and restoration of session state.
 */
export class SessionPersistenceManager {
  private supabase: SupabaseClient
  private readonly STATE_VERSION = 1
  private readonly COMPRESSION_THRESHOLD_BYTES = 10 * 1024 // 10 KB
  private readonly MAX_STATE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  /**
   * Save session state snapshot to database
   */
  async saveSessionState(
    sessionId: string,
    state: SessionStateSnapshot
  ): Promise<void> {
    try {
      logger.info({ sessionId }, 'Saving session state snapshot')

      // Add version and timestamp
      const stateWithMetadata: SessionStateSnapshot = {
        ...state,
        version: this.STATE_VERSION,
        timestamp: new Date().toISOString(),
      }

      // Serialize state
      const stateJson = JSON.stringify(stateWithMetadata)
      const stateSizeBytes = Buffer.byteLength(stateJson, 'utf8')

      // Check size limit
      if (stateSizeBytes > this.MAX_STATE_SIZE_BYTES) {
        logger.warn(
          { sessionId, stateSizeBytes, maxSize: this.MAX_STATE_SIZE_BYTES },
          'Session state exceeds maximum size, truncating'
        )
        // TODO: Implement state truncation strategy
        throw new Error('Session state too large')
      }

      // Determine if compression is needed
      const shouldCompress = stateSizeBytes > this.COMPRESSION_THRESHOLD_BYTES

      let updateData: any = {
        state_snapshot: shouldCompress ? null : stateWithMetadata,
        state_version: this.STATE_VERSION,
        state_size_bytes: stateSizeBytes,
        last_activity: new Date().toISOString(),
      }

      // Compress large states
      if (shouldCompress) {
        const compressed = await this.compressState(stateJson)
        updateData.compressed_state = compressed
        updateData.state_snapshot = null

        logger.info(
          {
            sessionId,
            originalSize: stateSizeBytes,
            compressedSize: compressed.length,
            ratio: (compressed.length / stateSizeBytes).toFixed(2),
          },
          'State compressed'
        )
      }

      // Update database
      const { error } = await this.supabase
        .from('coding_sessions')
        .update(updateData)
        .eq('id', sessionId)

      if (error) {
        throw error
      }

      logger.info(
        { sessionId, stateSizeBytes, compressed: shouldCompress },
        'Session state saved'
      )
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to save session state')
      throw error
    }
  }

  /**
   * Load session state snapshot from database
   */
  async loadSessionState(sessionId: string): Promise<SessionStateSnapshot | null> {
    try {
      logger.info({ sessionId }, 'Loading session state snapshot')

      const { data, error } = await this.supabase
        .from('coding_sessions')
        .select('state_snapshot, compressed_state, state_version')
        .eq('id', sessionId)
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        logger.warn({ sessionId }, 'Session not found')
        return null
      }

      // Check if compressed
      if (data.compressed_state) {
        const decompressed = await this.decompressState(data.compressed_state)
        const state = JSON.parse(decompressed)

        logger.info({ sessionId, version: state.version }, 'Session state loaded (compressed)')
        return state
      }

      // Return uncompressed state
      if (data.state_snapshot) {
        logger.info(
          { sessionId, version: data.state_snapshot.version },
          'Session state loaded'
        )
        return data.state_snapshot as SessionStateSnapshot
      }

      logger.warn({ sessionId }, 'No state snapshot found')
      return null
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to load session state')
      throw error
    }
  }

  /**
   * Mark session as resumable
   */
  async markResumable(sessionId: string, resumable: boolean = true): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('coding_sessions')
        .update({ resumable })
        .eq('id', sessionId)

      if (error) {
        throw error
      }

      logger.info({ sessionId, resumable }, 'Session resumable status updated')
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to update resumable status')
      throw error
    }
  }

  /**
   * Get resumable sessions for a user
   */
  async getResumableSessions(userId: string): Promise<ResumableSession[]> {
    try {
      logger.info({ userId }, 'Fetching resumable sessions')

      const { data, error } = await this.supabase
        .from('coding_sessions')
        .select(
          `
          id,
          project_id,
          initial_prompt,
          last_activity,
          status,
          resume_count,
          state_size_bytes,
          state_snapshot,
          projects (name)
        `
        )
        .eq('user_id', userId)
        .eq('resumable', true)
        .order('last_activity', { ascending: false })
        .limit(10)

      if (error) {
        throw error
      }

      const sessions: ResumableSession[] = (data || []).map((session: any) => ({
        id: session.id,
        projectId: session.project_id,
        projectName: session.projects?.name || 'Unnamed Project',
        initialPrompt: session.initial_prompt,
        lastActivity: session.last_activity,
        status: session.status,
        resumeCount: session.resume_count || 0,
        stateSizeBytes: session.state_size_bytes || 0,
        preview: {
          lastTask: session.state_snapshot?.agentContext?.currentTask,
          filesCount: session.state_snapshot?.files?.length || 0,
          outputsCount: session.state_snapshot?.outputs?.length || 0,
        },
      }))

      logger.info({ userId, count: sessions.length }, 'Resumable sessions fetched')
      return sessions
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch resumable sessions')
      throw error
    }
  }

  /**
   * Resume a session by incrementing resume count
   */
  async resumeSession(sessionId: string): Promise<void> {
    try {
      logger.info({ sessionId }, 'Resuming session')

      const { error } = await this.supabase.rpc('increment', {
        row_id: sessionId,
        x: 1,
      })

      // Fallback if RPC doesn't exist
      if (error?.code === '42883') {
        const { data } = await this.supabase
          .from('coding_sessions')
          .select('resume_count')
          .eq('id', sessionId)
          .single()

        const currentCount = data?.resume_count || 0

        await this.supabase
          .from('coding_sessions')
          .update({
            resume_count: currentCount + 1,
            last_resumed_at: new Date().toISOString(),
            resumable: false, // No longer resumable once resumed
          })
          .eq('id', sessionId)
      } else if (error) {
        throw error
      } else {
        // Update last_resumed_at
        await this.supabase
          .from('coding_sessions')
          .update({
            last_resumed_at: new Date().toISOString(),
            resumable: false,
          })
          .eq('id', sessionId)
      }

      logger.info({ sessionId }, 'Session resumed')
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to resume session')
      throw error
    }
  }

  /**
   * Get session history for a user
   */
  async getSessionHistory(
    userId: string,
    limit: number = 30,
    offset: number = 0
  ): Promise<any[]> {
    try {
      logger.info({ userId, limit, offset }, 'Fetching session history')

      const { data, error } = await this.supabase
        .from('coding_sessions')
        .select(
          `
          id,
          project_id,
          initial_prompt,
          status,
          created_at,
          completed_at,
          last_activity,
          resumable,
          resume_count,
          projects (name)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      logger.info({ userId, count: data?.length || 0 }, 'Session history fetched')
      return data || []
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch session history')
      throw error
    }
  }

  /**
   * Get storage statistics for a user
   */
  async getStorageStats(userId: string): Promise<SessionStorageStats> {
    try {
      logger.info({ userId }, 'Fetching storage statistics')

      const { data, error } = await this.supabase.rpc('get_user_session_storage', {
        p_user_id: userId,
      })

      if (error) {
        throw error
      }

      const stats = data?.[0] || {
        total_sessions: 0,
        active_sessions: 0,
        resumable_sessions: 0,
        total_storage_bytes: 0,
        average_session_size_bytes: 0,
      }

      logger.info({ userId, stats }, 'Storage statistics fetched')

      return {
        totalSessions: Number(stats.total_sessions),
        activeSessions: Number(stats.active_sessions),
        resumableSessions: Number(stats.resumable_sessions),
        totalStorageBytes: Number(stats.total_storage_bytes),
        averageSessionSizeBytes: Number(stats.average_session_size_bytes),
      }
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch storage statistics')
      throw error
    }
  }

  /**
   * Clean up old completed sessions
   */
  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    try {
      logger.info({ daysOld }, 'Cleaning up old sessions')

      const { data, error } = await this.supabase.rpc('cleanup_old_sessions', {
        days_old: daysOld,
      })

      if (error) {
        throw error
      }

      const deletedCount = data?.[0]?.deleted_count || 0

      logger.info({ deletedCount, daysOld }, 'Old sessions cleaned up')
      return deletedCount
    } catch (error) {
      logger.error({ daysOld, error }, 'Failed to clean up old sessions')
      throw error
    }
  }

  /**
   * Compress state using gzip
   */
  private async compressState(stateJson: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const gzip = createGzip()
      const chunks: Buffer[] = []

      gzip.on('data', (chunk) => chunks.push(chunk))
      gzip.on('end', () => resolve(Buffer.concat(chunks)))
      gzip.on('error', reject)

      gzip.write(stateJson)
      gzip.end()
    })
  }

  /**
   * Decompress state using gunzip
   */
  private async decompressState(compressed: Buffer): Promise<string> {
    const decompressed = await gunzipAsync(compressed)
    return decompressed.toString('utf8')
  }
}
