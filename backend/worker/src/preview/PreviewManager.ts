import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SandboxLifecycle } from '../sandbox/SandboxLifecycle'
import { SessionLifecycleManager } from '../services/SessionLifecycleManager'
import { SessionEventType } from '../types/session-lifecycle'
import { logger } from '../utils/logger'
import { config } from '../config'
import { RetryManager } from '../errors/RetryManager'
import { ErrorCatalog } from '../errors/catalog'

export interface PreviewConfig {
  port: number
  protocol: 'http' | 'https'
  timeout: number
}

const DEFAULT_CONFIG: PreviewConfig = {
  port: 19006,
  protocol: 'http',
  timeout: 60000,
}

export class PreviewManager {
  private supabase: SupabaseClient
  private sandboxes: SandboxLifecycle
  private lifecycle: SessionLifecycleManager
  private retry: RetryManager

  constructor(sandboxes: SandboxLifecycle, lifecycle: SessionLifecycleManager) {
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    this.sandboxes = sandboxes
    this.lifecycle = lifecycle
    this.retry = new RetryManager()
  }

  async generatePreviewUrl(
    sessionId: string,
    config: Partial<PreviewConfig> = {}
  ): Promise<string> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }

    logger.info({ sessionId, config: finalConfig }, 'Generating preview URL')

    try {
      await this.updatePreviewStatus(sessionId, 'starting')

      await this.lifecycle.emitEvent(sessionId, SessionEventType.STATE_CHANGED, {
        preview_status: 'starting',
        message: 'Starting Expo dev server...',
      })

      const activeSandbox = this.sandboxes.getActiveSandbox(sessionId)
      if (!activeSandbox) {
        throw new Error('No active sandbox for session')
      }

      const sandboxInfo = activeSandbox.sandbox

      await this.retry.withRetry(
        async () => {
          await this.startExpoServer(sessionId, finalConfig.port)
        },
        { maxAttempts: 3, initialDelay: 2000 }
      )

      const previewUrl = this.buildPreviewUrl(sandboxInfo.id, finalConfig)

      await this.updateSessionPreviewUrl(sessionId, previewUrl, finalConfig.port)

      await this.lifecycle.emitEvent(sessionId, SessionEventType.COMPLETION, {
        preview_url: previewUrl,
        message: 'Preview ready!',
      })

      logger.info({ sessionId, previewUrl }, 'Preview URL generated successfully')

      return previewUrl
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to generate preview URL')

      await this.updatePreviewStatus(sessionId, 'failed')

      await this.lifecycle.emitEvent(sessionId, SessionEventType.ERROR, {
        message: 'Failed to start preview',
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      throw error
    }
  }

  private async startExpoServer(sessionId: string, port: number): Promise<void> {
    logger.debug({ sessionId, port }, 'Starting Expo dev server')

    const packageJsonCheck = await this.sandboxes.execInSandbox(sessionId, [
      'test',
      '-f',
      'package.json',
    ])

    if (packageJsonCheck.exitCode !== 0) {
      throw new Error('package.json not found in sandbox')
    }

    const result = await this.sandboxes.execInSandbox(sessionId, [
      'bash',
      '-c',
      `npx expo start --web --port ${port} --non-interactive > /tmp/expo.log 2>&1 &`,
    ])

    if (result.exitCode !== 0) {
      throw new Error(`Failed to start Expo server: ${result.stderr}`)
    }

    await this.waitForServerReady(sessionId, port)
  }

  private async waitForServerReady(sessionId: string, port: number): Promise<void> {
    const maxAttempts = 30
    const delayMs = 2000

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      logger.debug({ sessionId, attempt }, 'Checking if Expo server is ready')

      const result = await this.sandboxes.execInSandbox(sessionId, [
        'bash',
        '-c',
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}`,
      ])

      if (result.stdout.trim() === '200') {
        logger.info({ sessionId, attempts: attempt }, 'Expo server is ready')
        return
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    throw new Error('Expo server failed to start within timeout period')
  }

  private buildPreviewUrl(sandboxId: string, config: PreviewConfig): string {
    const host = process.env.SANDBOX_HOST_DOMAIN || `${sandboxId}.fly.dev`
    return `${config.protocol}://${host}:${config.port}`
  }

  private async updateSessionPreviewUrl(
    sessionId: string,
    url: string,
    port: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('coding_sessions')
      .update({
        preview_url: url,
        preview_status: 'ready',
        preview_port: port,
        preview_updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) {
      throw new Error(`Failed to update preview URL: ${error.message}`)
    }

    logger.debug({ sessionId, url }, 'Updated session preview URL')
  }

  private async updatePreviewStatus(
    sessionId: string,
    status: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('coding_sessions')
      .update({
        preview_status: status,
        preview_updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) {
      logger.error({ error, sessionId, status }, 'Failed to update preview status')
    }
  }

  async refreshPreview(sessionId: string): Promise<string> {
    logger.info({ sessionId }, 'Refreshing preview')

    const { data: session } = await this.supabase
      .from('coding_sessions')
      .select('preview_url, preview_port')
      .eq('id', sessionId)
      .single()

    if (!session?.preview_url) {
      return this.generatePreviewUrl(sessionId)
    }

    await this.lifecycle.emitEvent(sessionId, SessionEventType.STATE_CHANGED, {
      preview_status: 'refreshing',
      message: 'Refreshing preview...',
    })

    return session.preview_url
  }

  async stopPreview(sessionId: string): Promise<void> {
    logger.info({ sessionId }, 'Stopping preview')

    try {
      await this.sandboxes.execInSandbox(sessionId, [
        'bash',
        '-c',
        'pkill -f "expo start"',
      ])

      await this.updatePreviewStatus(sessionId, 'stopped')

      await this.lifecycle.emitEvent(sessionId, SessionEventType.STATE_CHANGED, {
        preview_status: 'stopped',
        message: 'Preview stopped',
      })
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to stop preview')
    }
  }
}
