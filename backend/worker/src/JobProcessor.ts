import { JobQueue } from './queue/JobQueue'
import { Job } from './types'
import { logger } from './utils/logger'
import { config } from './config'
import { SandboxLifecycle } from './sandbox/SandboxLifecycle'
import { SessionLifecycleManager } from './services/SessionLifecycleManager'
import { AgentRunner } from './agent/AgentRunner'

export class JobProcessor {
  private queue: JobQueue
  private sandboxes: SandboxLifecycle
  private lifecycle: SessionLifecycleManager
  private agent: AgentRunner
  private isProcessing = false
  private isRunning = false
  private unsubscribe: (() => void) | null = null
  private pollInterval: NodeJS.Timeout | null = null

  constructor() {
    this.queue = new JobQueue()
    this.sandboxes = new SandboxLifecycle()
    this.lifecycle = new SessionLifecycleManager()
    this.agent = new AgentRunner(this.sandboxes, this.lifecycle)
  }

  /**
   * Start the job processor
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Job processor already running')
      return
    }

    this.isRunning = true
    logger.info('Job processor starting...')

    // Start sandbox cleanup
    this.sandboxes.startCleanup()

    // Start session lifecycle cleanup
    this.lifecycle.startCleanup()

    // Subscribe to Realtime notifications
    this.unsubscribe = this.queue.subscribeToNewJobs((job) => {
      logger.debug({ jobId: job.id }, 'New job notification received')
      // Trigger processing when new job arrives
      this.processNextJob()
    })

    // Initial poll to catch any existing jobs
    this.processNextJob()

    // Setup polling fallback
    this.pollInterval = setInterval(() => {
      if (!this.isProcessing && this.isRunning) {
        logger.trace('Polling for jobs (fallback)')
        this.processNextJob()
      }
    }, config.worker.pollIntervalMs)

    logger.info({ pollIntervalMs: config.worker.pollIntervalMs }, 'Job processor ready')
  }

  /**
   * Process the next available job
   */
  private async processNextJob(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing || !this.isRunning) {
      return
    }

    this.isProcessing = true

    try {
      // Claim next job
      const job = await this.queue.claimNextJob()

      if (!job) {
        // No jobs available
        this.isProcessing = false
        return
      }

      const startTime = Date.now()
      logger.info({
        jobId: job.job_id,
        sessionId: job.session_id,
        priority: job.priority || 0,
        prompt: job.prompt.substring(0, 100) + (job.prompt.length > 100 ? '...' : '')
      }, 'Processing job')

      // Phase 17: Start session lifecycle
      await this.lifecycle.startSession(job.session_id)

      // Phase 15: Sandbox orchestration
      const sandbox = await this.sandboxes.startSandbox(job.session_id)

      try {
        // Phase 16: Execute Claude Agent
        const stats = await this.agent.runSession(job.session_id, job.prompt)

        logger.info({
          sessionId: job.session_id,
          stats,
        }, 'Agent session completed')

        // Phase 17: Complete session lifecycle
        await this.lifecycle.completeSession(job.session_id, stats)

        await this.queue.completeJob(job.job_id)
      } catch (error) {
        logger.error({
          sessionId: job.session_id,
          jobId: job.job_id,
          error,
        }, 'Agent session failed')

        // Phase 17: Fail session lifecycle
        await this.lifecycle.failSession(
          job.session_id,
          error instanceof Error ? error.message : 'Unknown error'
        )

        await this.queue.failJob(job.job_id, error instanceof Error ? error.message : 'Unknown error')
      } finally {
        // Cleanup handled by lifecycle manager timeout
        // Session sandboxes destroyed after 30 minutes or manual stop
      }

      const duration = Date.now() - startTime
      logger.info({ jobId: job.job_id, duration }, 'Job processing completed')

    } catch (error) {
      logger.error({ error }, 'Job processor error')
    } finally {
      this.isProcessing = false

      // Check for next job after a short delay
      if (this.isRunning) {
        setTimeout(() => this.processNextJob(), 100)
      }
    }
  }

  /**
   * Stop the job processor with graceful shutdown
   */
  async stop(): Promise<void> {
    logger.info('Stopping job processor...')
    this.isRunning = false

    // Clear polling interval
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }

    // Unsubscribe from Realtime
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }

    // Wait for current job with timeout
    const timeout = new Promise(resolve =>
      setTimeout(resolve, config.worker.shutdownTimeoutMs)
    )

    const waitForJob = new Promise<void>(resolve => {
      const check = setInterval(() => {
        if (!this.isProcessing) {
          clearInterval(check)
          resolve()
        }
      }, 100)
    })

    await Promise.race([waitForJob, timeout])

    if (this.isProcessing) {
      logger.warn({ timeoutMs: config.worker.shutdownTimeoutMs }, 'Shutdown timeout - job may be incomplete')
    }

    // Shutdown session lifecycle
    await this.lifecycle.shutdown()

    // Shutdown sandboxes
    await this.sandboxes.shutdown()

    // Cleanup queue
    await this.queue.cleanup()

    logger.info('Job processor stopped')
  }
}
