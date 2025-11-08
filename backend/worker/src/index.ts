import { JobProcessor } from './JobProcessor'
import { QueueMonitor } from './monitoring/QueueMonitor'
import { HealthServer } from './HealthServer'
import { logger } from './utils/logger'
import { config } from './config'

async function main() {
  logger.info({
    env: config.env,
    supabaseUrl: config.supabase.url,
    timestamp: new Date().toISOString()
  }, 'Worker service starting')

  try {
    // Initialize services
    const processor = new JobProcessor()
    const monitor = new QueueMonitor()
    const healthServer = new HealthServer()

    // Start all services
    await processor.start()
    monitor.startMonitoring(30000)
    healthServer.start()

    // Graceful shutdown handler
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal')

      // Stop all services in order
      monitor.stopMonitoring()
      await processor.stop()
      await healthServer.stop()

      logger.info('Worker service stopped cleanly')
      process.exit(0)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

    logger.info('Worker service ready')
  } catch (error) {
    logger.fatal({ error }, 'Fatal error starting worker service')
    process.exit(1)
  }
}

// Start the worker
main().catch((error) => {
  logger.fatal({ error }, 'Unhandled error')
  process.exit(1)
})
