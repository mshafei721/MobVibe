import crypto from 'crypto'
import { logger } from './logger'

export class FileHasher {
  static hash(content: string | Buffer, algorithm: 'md5' | 'sha256' = 'sha256'): string {
    try {
      const hash = crypto.createHash(algorithm)
      hash.update(content)
      return hash.digest('hex')
    } catch (error) {
      logger.error({ error, algorithm }, 'File hashing failed')
      throw error
    }
  }

  static compareHash(content: string | Buffer, expectedHash: string, algorithm: 'md5' | 'sha256' = 'sha256'): boolean {
    const actualHash = this.hash(content, algorithm)
    return actualHash === expectedHash
  }

  static hashStream(stream: NodeJS.ReadableStream, algorithm: 'md5' | 'sha256' = 'sha256'): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm)

      stream.on('data', (chunk) => {
        hash.update(chunk)
      })

      stream.on('end', () => {
        resolve(hash.digest('hex'))
      })

      stream.on('error', (error) => {
        logger.error({ error, algorithm }, 'Stream hashing failed')
        reject(error)
      })
    })
  }
}
