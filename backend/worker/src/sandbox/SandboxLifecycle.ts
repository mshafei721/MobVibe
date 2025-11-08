import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SandboxManager } from './SandboxManager.js'
import { config } from '../config/index.js'
import { logger } from '../utils/logger.js'
import type {
  SandboxConfig,
  Sandbox,
  ActiveSandbox,
  ExecResult,
} from '../types/index.js'

export class SandboxLifecycle {
  public manager: SandboxManager
  private supabase: SupabaseClient
  private activeSandboxes = new Map<string, ActiveSandbox>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.manager = new SandboxManager()
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  async startSandbox(sessionId: string): Promise<Sandbox> {
    if (this.activeSandboxes.has(sessionId)) {
      const existing = this.activeSandboxes.get(sessionId)!
      logger.debug({ sessionId }, 'Reusing existing sandbox')
      return existing.sandbox
    }

    const sandboxConfig: SandboxConfig = {
      sessionId,
      image: 'registry.fly.io/mobvibe-sandbox:latest',
      memoryMb: config.sandbox.memoryMb,
      cpus: config.sandbox.cpus,
      region: config.flyio.region,
    }

    const sandbox = await this.manager.createSandbox(sandboxConfig)

    this.activeSandboxes.set(sessionId, {
      sandbox,
      createdAt: new Date(),
      sessionId,
    })

    await this.updateSessionSandbox(sessionId, sandbox.id)

    return sandbox
  }

  async stopSandbox(sessionId: string): Promise<void> {
    const activeSandbox = this.activeSandboxes.get(sessionId)

    if (!activeSandbox) {
      logger.debug({ sessionId }, 'No active sandbox to stop')
      return
    }

    const startTime = Date.now()

    try {
      await this.manager.destroySandbox(activeSandbox.sandbox.id)

      const duration = Date.now() - startTime

      logger.info(
        {
          sessionId,
          sandboxId: activeSandbox.sandbox.id,
          duration,
        },
        'Sandbox stopped'
      )
    } catch (error) {
      logger.error({ error, sessionId }, 'Failed to stop sandbox')
    } finally {
      this.activeSandboxes.delete(sessionId)
      await this.updateSessionSandbox(sessionId, null)
    }
  }

  async execInSandbox(
    sessionId: string,
    command: string[]
  ): Promise<ExecResult> {
    const activeSandbox = this.activeSandboxes.get(sessionId)

    if (!activeSandbox) {
      throw new Error(`No active sandbox for session ${sessionId}`)
    }

    return this.manager.execCommand(activeSandbox.sandbox.id, command)
  }

  startCleanup(): void {
    if (this.cleanupInterval) {
      logger.warn('Cleanup already running')
      return
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleSandboxes().catch((error) => {
        logger.error({ error }, 'Cleanup cycle failed')
      })
    }, 60000)

    logger.info('Sandbox cleanup started (every 60s)')
  }

  private async cleanupStaleSandboxes(): Promise<void> {
    const now = new Date()
    const maxAge = config.sandbox.timeoutMs
    const staleSessionIds: string[] = []

    for (const [sessionId, activeSandbox] of this.activeSandboxes) {
      const age = now.getTime() - activeSandbox.createdAt.getTime()

      if (age > maxAge) {
        staleSessionIds.push(sessionId)
      }
    }

    if (staleSessionIds.length > 0) {
      logger.info(
        {
          count: staleSessionIds.length,
          sessions: staleSessionIds,
        },
        'Cleaning up stale sandboxes'
      )

      for (const sessionId of staleSessionIds) {
        await this.stopSandbox(sessionId)
      }
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down sandbox lifecycle')

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    const sessionIds = Array.from(this.activeSandboxes.keys())

    if (sessionIds.length > 0) {
      logger.info(
        {
          count: sessionIds.length,
          sessions: sessionIds,
        },
        'Destroying active sandboxes'
      )

      await Promise.all(sessionIds.map((id) => this.stopSandbox(id)))
    }

    logger.info('Sandbox lifecycle shutdown complete')
  }

  private async updateSessionSandbox(
    sessionId: string,
    sandboxId: string | null
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('coding_sessions')
        .update({ sandbox_id: sandboxId })
        .eq('id', sessionId)

      if (error) {
        logger.error(
          { error, sessionId, sandboxId },
          'Failed to update session sandbox_id'
        )
      }
    } catch (error) {
      logger.error(
        { error, sessionId, sandboxId },
        'Database update failed'
      )
    }
  }

  getActiveSandbox(sessionId: string): ActiveSandbox | undefined {
    return this.activeSandboxes.get(sessionId)
  }

  getActiveSandboxCount(): number {
    return this.activeSandboxes.size
  }

  getActiveSessions(): string[] {
    return Array.from(this.activeSandboxes.keys())
  }
}
