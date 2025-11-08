import { createClient, SupabaseClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { config } from '../config'
import { logger } from '../utils/logger'
import { FileHasher } from '../utils/file-hash'
import { ConflictResolver } from './ConflictResolver'
import {
  FileMetadata,
  SyncResult,
  SyncError,
  Conflict,
  ConflictStrategy,
  StorageQuota,
} from '../types/file-operations'

export class FileSyncService {
  private supabase: SupabaseClient
  private resolver: ConflictResolver
  private bucketName = 'session-files'

  constructor(conflictStrategy: ConflictStrategy = ConflictStrategy.LAST_WRITE_WINS) {
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    this.resolver = new ConflictResolver(conflictStrategy)
  }

  async uploadFile(sessionId: string, filePath: string, content: Buffer): Promise<void> {
    const storagePath = this.getStoragePath(sessionId, filePath)
    const hash = FileHasher.hash(content)

    logger.debug({ sessionId, filePath, storagePath, hash }, 'Uploading file')

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(storagePath, content, {
        contentType: this.getContentType(filePath),
        upsert: true,
      })

    if (error) {
      logger.error({ sessionId, filePath, error }, 'File upload failed')
      throw error
    }

    await this.saveMetadata({
      path: filePath,
      size: content.length,
      hash,
      modifiedAt: new Date(),
      sessionId,
      storagePath,
    })

    logger.info({ sessionId, filePath, size: content.length }, 'File uploaded successfully')
  }

  async downloadFile(sessionId: string, filePath: string): Promise<Buffer> {
    const storagePath = this.getStoragePath(sessionId, filePath)

    logger.debug({ sessionId, filePath, storagePath }, 'Downloading file')

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .download(storagePath)

    if (error) {
      logger.error({ sessionId, filePath, error }, 'File download failed')
      throw error
    }

    const buffer = Buffer.from(await data.arrayBuffer())

    logger.info({ sessionId, filePath, size: buffer.length }, 'File downloaded successfully')

    return buffer
  }

  async syncDirectory(sessionId: string, dirPath: string): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      sessionId,
      uploaded: [],
      downloaded: [],
      conflicts: [],
      errors: [],
      duration: 0,
    }

    try {
      const localFiles = await this.listLocalFiles(dirPath)
      const remoteFiles = await this.listRemoteFiles(sessionId)

      for (const localFile of localFiles) {
        try {
          const localPath = path.join(dirPath, localFile)
          const content = await fs.readFile(localPath)
          const localHash = FileHasher.hash(content)
          const stats = await fs.stat(localPath)

          const remoteMetadata = await this.getMetadata(sessionId, localFile)

          if (remoteMetadata) {
            const conflict = this.resolver.detectConflict(
              localHash,
              remoteMetadata.hash,
              stats.mtime,
              remoteMetadata.modifiedAt,
              localFile
            )

            if (conflict) {
              const resolution = this.resolver.resolve(conflict)

              if (resolution === 'local') {
                await this.uploadFile(sessionId, localFile, content)
                result.uploaded.push(localFile)
                result.conflicts.push(this.resolver.markResolved(conflict, 'local'))
              } else if (resolution === 'remote') {
                const remoteContent = await this.downloadFile(sessionId, localFile)
                await fs.writeFile(localPath, remoteContent)
                result.downloaded.push(localFile)
                result.conflicts.push(this.resolver.markResolved(conflict, 'remote'))
              } else {
                result.conflicts.push(conflict)
              }
            }
          } else {
            await this.uploadFile(sessionId, localFile, content)
            result.uploaded.push(localFile)
          }
        } catch (error) {
          result.errors.push({
            path: localFile,
            operation: 'upload',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      for (const remoteFile of remoteFiles) {
        if (!localFiles.includes(remoteFile)) {
          try {
            const content = await this.downloadFile(sessionId, remoteFile)
            const localPath = path.join(dirPath, remoteFile)
            await fs.mkdir(path.dirname(localPath), { recursive: true })
            await fs.writeFile(localPath, content)
            result.downloaded.push(remoteFile)
          } catch (error) {
            result.errors.push({
              path: remoteFile,
              operation: 'download',
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }
      }
    } catch (error) {
      logger.error({ sessionId, dirPath, error }, 'Directory sync failed')
      throw error
    }

    result.duration = Date.now() - startTime

    logger.info({
      sessionId,
      uploaded: result.uploaded.length,
      downloaded: result.downloaded.length,
      conflicts: result.conflicts.length,
      errors: result.errors.length,
      duration: result.duration,
    }, 'Directory sync completed')

    return result
  }

  async getStorageQuota(sessionId: string): Promise<StorageQuota> {
    const files = await this.listRemoteFiles(sessionId)
    let totalSize = 0

    for (const file of files) {
      const metadata = await this.getMetadata(sessionId, file)
      if (metadata) {
        totalSize += metadata.size
      }
    }

    return {
      sessionId,
      usedBytes: totalSize,
      limitBytes: config.storage.quotaLimitBytes,
      fileCount: files.length,
    }
  }

  async deleteFile(sessionId: string, filePath: string): Promise<void> {
    const storagePath = this.getStoragePath(sessionId, filePath)

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([storagePath])

    if (error) {
      logger.error({ sessionId, filePath, error }, 'File deletion failed')
      throw error
    }

    logger.info({ sessionId, filePath }, 'File deleted successfully')
  }

  private async listLocalFiles(dirPath: string): Promise<string[]> {
    const files: string[] = []

    async function walk(dir: string, base: string = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const relativePath = path.join(base, entry.name)

        if (entry.isDirectory()) {
          await walk(path.join(dir, entry.name), relativePath)
        } else if (entry.isFile()) {
          files.push(relativePath)
        }
      }
    }

    await walk(dirPath)
    return files
  }

  private async listRemoteFiles(sessionId: string): Promise<string[]> {
    const prefix = `${sessionId}/`

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .list(sessionId, { limit: 1000 })

    if (error) {
      logger.error({ sessionId, error }, 'Failed to list remote files')
      return []
    }

    return data.map(file => file.name)
  }

  private getStoragePath(sessionId: string, filePath: string): string {
    return `${sessionId}/${filePath.replace(/\\/g, '/')}`
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    const types: Record<string, string> = {
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.jsx': 'text/javascript',
      '.tsx': 'text/typescript',
      '.json': 'application/json',
      '.html': 'text/html',
      '.css': 'text/css',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
    }
    return types[ext] || 'application/octet-stream'
  }

  private async saveMetadata(metadata: FileMetadata): Promise<void> {
    const { error } = await this.supabase
      .from('file_metadata')
      .upsert({
        session_id: metadata.sessionId,
        path: metadata.path,
        size: metadata.size,
        hash: metadata.hash,
        modified_at: metadata.modifiedAt.toISOString(),
        storage_path: metadata.storagePath,
      })

    if (error) {
      logger.warn({ metadata, error }, 'Failed to save file metadata')
    }
  }

  private async getMetadata(sessionId: string, filePath: string): Promise<FileMetadata | null> {
    const { data, error } = await this.supabase
      .from('file_metadata')
      .select('*')
      .eq('session_id', sessionId)
      .eq('path', filePath)
      .single()

    if (error || !data) {
      return null
    }

    return {
      path: data.path,
      size: data.size,
      hash: data.hash,
      modifiedAt: new Date(data.modified_at),
      sessionId: data.session_id,
      storagePath: data.storage_path,
    }
  }
}
