import axios, { AxiosInstance } from 'axios'
import { config } from '../config/index.js'
import { logger } from '../utils/logger.js'
import type { SandboxConfig, Sandbox, ExecResult } from '../types/index.js'

export class SandboxManager {
  private client: AxiosInstance
  private baseURL = 'https://api.machines.dev/v1'
  private appName = config.flyio.appName

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${config.flyio.apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  async createSandbox(sandboxConfig: SandboxConfig): Promise<Sandbox> {
    const machineName = `session-${sandboxConfig.sessionId}`

    logger.info({ sessionId: sandboxConfig.sessionId }, 'Creating sandbox')

    const payload = {
      name: machineName,
      region: sandboxConfig.region,
      config: {
        image: sandboxConfig.image,
        guest: {
          cpu_kind: 'shared',
          cpus: sandboxConfig.cpus,
          memory_mb: sandboxConfig.memoryMb,
        },
        env: {
          SESSION_ID: sandboxConfig.sessionId,
          ...(sandboxConfig.env || {}),
        },
        auto_destroy: true,
      },
    }

    try {
      const startTime = Date.now()
      const response = await this.withRetry(() =>
        this.client.post(`/apps/${this.appName}/machines`, payload)
      )

      const duration = Date.now() - startTime
      const machine = response.data

      const sandbox: Sandbox = {
        id: machine.id,
        name: machine.name,
        state: machine.state,
        region: machine.region,
        privateIp: machine.private_ip,
        createdAt: new Date(machine.created_at),
      }

      logger.info(
        {
          sessionId: sandboxConfig.sessionId,
          machineId: sandbox.id,
          duration,
          ip: sandbox.privateIp,
        },
        'Sandbox created'
      )

      return sandbox
    } catch (error) {
      logger.error(
        {
          error,
          sessionId: sandboxConfig.sessionId,
        },
        'Failed to create sandbox'
      )
      throw error
    }
  }

  async destroySandbox(sandboxId: string): Promise<void> {
    logger.info({ sandboxId }, 'Destroying sandbox')

    try {
      await this.withRetry(() =>
        this.client.delete(`/apps/${this.appName}/machines/${sandboxId}`, {
          params: { force: true },
        })
      )

      logger.info({ sandboxId }, 'Sandbox destroyed')
    } catch (error) {
      logger.error({ error, sandboxId }, 'Failed to destroy sandbox')
      throw error
    }
  }

  async getSandbox(sandboxId: string): Promise<Sandbox | null> {
    try {
      const response = await this.client.get(
        `/apps/${this.appName}/machines/${sandboxId}`
      )

      const machine = response.data

      return {
        id: machine.id,
        name: machine.name,
        state: machine.state,
        region: machine.region,
        privateIp: machine.private_ip,
        createdAt: new Date(machine.created_at),
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      logger.error({ error, sandboxId }, 'Failed to get sandbox')
      throw error
    }
  }

  async execCommand(
    sandboxId: string,
    command: string[]
  ): Promise<ExecResult> {
    logger.debug({ sandboxId, command }, 'Executing command')

    try {
      const response = await this.withRetry(() =>
        this.client.post(`/apps/${this.appName}/machines/${sandboxId}/exec`, {
          cmd: command,
        })
      )

      const result = response.data

      return {
        exitCode: result.exit_code || 0,
        stdout: result.stdout || '',
        stderr: result.stderr || '',
      }
    } catch (error) {
      logger.error({ error, sandboxId, command }, 'Command execution failed')
      throw error
    }
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    backoff: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error: any) {
        const isLastAttempt = i === maxRetries - 1

        if (isLastAttempt) {
          throw error
        }

        const isRetryable =
          error.response?.status >= 500 ||
          error.code === 'ECONNABORTED' ||
          error.code === 'ETIMEDOUT'

        if (!isRetryable) {
          throw error
        }

        const delay = backoff * Math.pow(2, i)
        logger.warn(
          {
            attempt: i + 1,
            maxRetries,
            delay,
            error: error.message,
          },
          'Retrying request'
        )

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw new Error('Retry exhausted')
  }
}
