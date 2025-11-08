import http from 'http'
import { logger } from './utils/logger'
import { config } from './config'

export class HealthServer {
  private server?: http.Server
  private port = config.health.port

  start(): void {
    this.server = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        }))
        logger.trace('Health check requested')
      } else {
        res.writeHead(404)
        res.end()
      }
    })

    this.server.listen(this.port, () => {
      logger.info({ port: this.port }, 'Health check server started')
    })
  }

  stop(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('Health check server stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}
