import { SessionLifecycleManager } from '../services/SessionLifecycleManager'
import { SessionEventType } from '../types/session-lifecycle'
import { logger } from '../utils/logger'

export interface TerminalOutput {
  command: string
  output: string
  stream: 'stdout' | 'stderr'
  isFinal: boolean
  timestamp: Date
}

export class OutputStreamer {
  private lifecycle: SessionLifecycleManager
  private buffer: Map<string, string> = new Map()
  private bufferSize = 1024
  private flushInterval = 100

  constructor(lifecycle: SessionLifecycleManager) {
    this.lifecycle = lifecycle
  }

  async streamOutput(
    sessionId: string,
    command: string,
    stream: NodeJS.ReadableStream,
    streamType: 'stdout' | 'stderr' = 'stdout'
  ): Promise<string> {
    let fullOutput = ''
    const bufferKey = `${sessionId}:${command}:${streamType}`

    const flushTimer = setInterval(() => {
      this.flush(sessionId, command, streamType, bufferKey, false)
    }, this.flushInterval)

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        const data = chunk.toString()
        fullOutput += data

        const currentBuffer = this.buffer.get(bufferKey) || ''
        this.buffer.set(bufferKey, currentBuffer + data)

        if ((this.buffer.get(bufferKey)?.length || 0) >= this.bufferSize) {
          this.flush(sessionId, command, streamType, bufferKey, false)
        }
      })

      stream.on('end', () => {
        clearInterval(flushTimer)
        this.flush(sessionId, command, streamType, bufferKey, true)
        resolve(fullOutput)
      })

      stream.on('error', (error) => {
        clearInterval(flushTimer)
        logger.error({ error, sessionId, command }, 'Stream error')
        reject(error)
      })
    })
  }

  private flush(
    sessionId: string,
    command: string,
    streamType: 'stdout' | 'stderr',
    bufferKey: string,
    isFinal: boolean
  ): void {
    const bufferContent = this.buffer.get(bufferKey)
    if (!bufferContent || bufferContent.length === 0) return

    logger.debug(
      { sessionId, bufferSize: bufferContent.length, isFinal, streamType },
      'Flushing terminal output'
    )

    this.lifecycle
      .emitEvent(sessionId, SessionEventType.TERMINAL, {
        command,
        output: bufferContent,
        stream: streamType,
        isFinal,
        timestamp: new Date(),
      })
      .catch((err) => {
        logger.error({ err, sessionId }, 'Failed to emit terminal event')
      })

    this.buffer.set(bufferKey, '')
  }

  cleanup(sessionId: string): void {
    const keysToDelete: string[] = []
    for (const key of this.buffer.keys()) {
      if (key.startsWith(`${sessionId}:`)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach((key) => this.buffer.delete(key))
  }
}
