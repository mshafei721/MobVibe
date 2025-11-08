export enum FileEventType {
  CREATED = 'created',
  MODIFIED = 'modified',
  DELETED = 'deleted',
  RENAMED = 'renamed',
}

export enum ConflictStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  USER_INTERVENTION = 'user_intervention',
  AUTO_MERGE = 'auto_merge',
}

export interface FileMetadata {
  path: string
  size: number
  hash: string
  modifiedAt: Date
  sessionId: string
  storagePath: string
}

export interface FileEvent {
  type: FileEventType
  path: string
  oldPath?: string
  timestamp: Date
}

export interface Conflict {
  path: string
  localHash: string
  remoteHash: string
  localModifiedAt: Date
  remoteModifiedAt: Date
  strategy: ConflictStrategy
  resolved: boolean
  resolution?: 'local' | 'remote' | 'merge'
}

export interface SyncResult {
  sessionId: string
  uploaded: string[]
  downloaded: string[]
  conflicts: Conflict[]
  errors: SyncError[]
  duration: number
}

export interface SyncError {
  path: string
  operation: 'upload' | 'download' | 'delete'
  error: string
}

export interface Diff {
  path: string
  oldContent: string
  newContent: string
  additions: number
  deletions: number
  chunks: DiffChunk[]
}

export interface DiffChunk {
  type: 'add' | 'remove' | 'context'
  lineStart: number
  lineEnd: number
  content: string
}

export interface StorageQuota {
  sessionId: string
  usedBytes: number
  limitBytes: number
  fileCount: number
}
