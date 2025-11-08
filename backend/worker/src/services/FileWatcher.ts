import fs from 'fs/promises'
import { FSWatcher, watch } from 'fs'
import path from 'path'
import { FileEvent, FileEventType, Diff, DiffChunk } from '../types/file-operations'
import { logger } from '../utils/logger'

export class FileWatcher {
  private watchers = new Map<string, FSWatcher>()
  private fileContents = new Map<string, string>()

  async watch(dirPath: string, callback: (event: FileEvent) => void): Promise<void> {
    if (this.watchers.has(dirPath)) {
      logger.warn({ dirPath }, 'Directory already being watched')
      return
    }

    try {
      await fs.access(dirPath)
    } catch (error) {
      logger.error({ dirPath, error }, 'Directory not accessible for watching')
      throw new Error(`Cannot watch directory: ${dirPath}`)
    }

    const watcher = watch(dirPath, { recursive: true }, async (eventType, filename) => {
      if (!filename) return

      const filePath = path.join(dirPath, filename)

      try {
        const stats = await fs.stat(filePath)

        if (stats.isFile()) {
          const event = await this.createFileEvent(filePath, eventType)
          if (event) {
            callback(event)
          }
        }
      } catch (error) {
        const event: FileEvent = {
          type: FileEventType.DELETED,
          path: filePath,
          timestamp: new Date(),
        }
        callback(event)
      }
    })

    this.watchers.set(dirPath, watcher)
    logger.info({ dirPath }, 'Started watching directory')
  }

  unwatch(dirPath: string): void {
    const watcher = this.watchers.get(dirPath)

    if (watcher) {
      watcher.close()
      this.watchers.delete(dirPath)
      logger.info({ dirPath }, 'Stopped watching directory')
    }
  }

  unwatchAll(): void {
    for (const [dirPath, watcher] of this.watchers) {
      watcher.close()
      logger.debug({ dirPath }, 'Stopped watching directory')
    }
    this.watchers.clear()
    this.fileContents.clear()
  }

  async generateDiff(filePath: string, oldContent: string, newContent: string): Promise<Diff> {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    const chunks: DiffChunk[] = []

    let additions = 0
    let deletions = 0

    for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]

      if (oldLine !== newLine) {
        if (oldLine !== undefined && newLine === undefined) {
          chunks.push({
            type: 'remove',
            lineStart: i + 1,
            lineEnd: i + 1,
            content: oldLine,
          })
          deletions++
        } else if (oldLine === undefined && newLine !== undefined) {
          chunks.push({
            type: 'add',
            lineStart: i + 1,
            lineEnd: i + 1,
            content: newLine,
          })
          additions++
        } else if (oldLine !== newLine) {
          chunks.push({
            type: 'remove',
            lineStart: i + 1,
            lineEnd: i + 1,
            content: oldLine,
          })
          chunks.push({
            type: 'add',
            lineStart: i + 1,
            lineEnd: i + 1,
            content: newLine,
          })
          deletions++
          additions++
        }
      }
    }

    return {
      path: filePath,
      oldContent,
      newContent,
      additions,
      deletions,
      chunks,
    }
  }

  private async createFileEvent(filePath: string, eventType: string): Promise<FileEvent | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const oldContent = this.fileContents.get(filePath)

      let type: FileEventType

      if (!oldContent) {
        type = FileEventType.CREATED
      } else if (oldContent !== content) {
        type = FileEventType.MODIFIED
      } else {
        return null
      }

      this.fileContents.set(filePath, content)

      return {
        type,
        path: filePath,
        timestamp: new Date(),
      }
    } catch (error) {
      logger.error({ filePath, error }, 'Error creating file event')
      return null
    }
  }
}
