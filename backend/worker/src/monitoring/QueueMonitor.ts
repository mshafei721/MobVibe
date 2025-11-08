import { JobQueue } from '../queue/JobQueue'
import { logger } from '../utils/logger'
import { config } from '../config'

export class QueueMonitor {
  private queue: JobQueue
  private monitorInterval: NodeJS.Timeout | null = null

  constructor() {
    this.queue = new JobQueue()
  }

  /**
   * Print queue statistics with structured logging
   */
  async printStats(): Promise<void> {
    try {
      const stats = await this.queue.getQueueStats()

      if (!stats) {
        logger.info('Queue statistics: No data available')
        return
      }

      // Calculate derived metrics
      const total = stats.completed_count + stats.failed_count
      const successRate = total > 0
        ? ((stats.completed_count / total) * 100).toFixed(1)
        : 0

      logger.info({
        pending: stats.pending_count,
        processing: stats.processing_count,
        completed: stats.completed_count,
        failed: stats.failed_count,
        oldestPending: stats.oldest_pending_age,
        successRate: successRate,
      }, 'Queue statistics')
    } catch (error) {
      logger.error({ error }, 'Error getting queue stats')
    }
  }

  /**
   * Start monitoring at regular intervals
   */
  startMonitoring(intervalMs = 30000): void {
    const monitorIntervalMs = parseInt(process.env.MONITOR_INTERVAL_MS || intervalMs.toString())

    // Print stats immediately
    this.printStats()

    // Setup interval
    this.monitorInterval = setInterval(() => {
      this.printStats()
    }, monitorIntervalMs)

    logger.info({ intervalMs: monitorIntervalMs }, 'Queue monitoring started')
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
      logger.info('Queue monitoring stopped')
    }
  }
}
