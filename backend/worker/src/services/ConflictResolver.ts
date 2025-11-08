import { Conflict, ConflictStrategy } from '../types/file-operations'
import { logger } from '../utils/logger'

export class ConflictResolver {
  private defaultStrategy: ConflictStrategy

  constructor(defaultStrategy: ConflictStrategy = ConflictStrategy.LAST_WRITE_WINS) {
    this.defaultStrategy = defaultStrategy
  }

  resolve(conflict: Conflict): 'local' | 'remote' | 'user_intervention' {
    const strategy = conflict.strategy || this.defaultStrategy

    logger.info({
      path: conflict.path,
      strategy,
      localModifiedAt: conflict.localModifiedAt,
      remoteModifiedAt: conflict.remoteModifiedAt,
    }, 'Resolving file conflict')

    switch (strategy) {
      case ConflictStrategy.LAST_WRITE_WINS:
        return this.lastWriteWins(conflict)
      case ConflictStrategy.USER_INTERVENTION:
        return 'user_intervention'
      case ConflictStrategy.AUTO_MERGE:
        return this.autoMerge(conflict)
      default:
        logger.warn({ strategy }, 'Unknown conflict strategy, defaulting to last_write_wins')
        return this.lastWriteWins(conflict)
    }
  }

  private lastWriteWins(conflict: Conflict): 'local' | 'remote' {
    if (conflict.localModifiedAt > conflict.remoteModifiedAt) {
      logger.debug({ path: conflict.path }, 'Conflict resolved: local wins')
      return 'local'
    } else {
      logger.debug({ path: conflict.path }, 'Conflict resolved: remote wins')
      return 'remote'
    }
  }

  private autoMerge(conflict: Conflict): 'local' | 'remote' | 'user_intervention' {
    logger.warn({
      path: conflict.path,
    }, 'Auto-merge not yet implemented, falling back to last_write_wins')

    return this.lastWriteWins(conflict)
  }

  markResolved(conflict: Conflict, resolution: 'local' | 'remote' | 'merge'): Conflict {
    return {
      ...conflict,
      resolved: true,
      resolution,
    }
  }

  detectConflict(
    localHash: string,
    remoteHash: string,
    localModifiedAt: Date,
    remoteModifiedAt: Date,
    path: string
  ): Conflict | null {
    if (localHash !== remoteHash) {
      logger.info({ path, localHash, remoteHash }, 'File conflict detected')

      return {
        path,
        localHash,
        remoteHash,
        localModifiedAt,
        remoteModifiedAt,
        strategy: this.defaultStrategy,
        resolved: false,
      }
    }

    return null
  }
}
