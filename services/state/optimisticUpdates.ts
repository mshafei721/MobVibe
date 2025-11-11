/**
 * Optimistic Update Manager
 * Handles optimistic UI updates with rollback capability
 * Tracks pending operations and manages success/failure states
 */

export type OperationType =
  | 'send_message'
  | 'create_session'
  | 'pause_session'
  | 'resume_session'
  | 'stop_session';

export interface PendingOperation {
  id: string;
  type: OperationType;
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface OptimisticUpdateOptions {
  /**
   * Maximum time (ms) before considering an operation stale
   * @default 30000 (30 seconds)
   */
  staleTimeout?: number;

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Callback when operation completes successfully
   */
  onComplete?: (operation: PendingOperation) => void;

  /**
   * Callback when operation fails
   */
  onFailure?: (operation: PendingOperation, error: Error) => void;
}

export class OptimisticUpdateManager {
  private pending: Map<string, PendingOperation> = new Map();
  private options: Required<OptimisticUpdateOptions>;

  constructor(options: OptimisticUpdateOptions = {}) {
    this.options = {
      staleTimeout: options.staleTimeout ?? 30000,
      maxRetries: options.maxRetries ?? 3,
      onComplete: options.onComplete ?? (() => {}),
      onFailure: options.onFailure ?? (() => {})
    };
  }

  /**
   * Add a new pending operation
   */
  add(
    operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>
  ): string {
    const id = this.generateId();

    const op: PendingOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.pending.set(id, op);

    console.log('[OptimisticUpdates] Added pending operation', {
      id,
      type: op.type,
      pendingCount: this.pending.size
    });

    // Auto-cleanup stale operations
    this.cleanupStaleOperations();

    return id;
  }

  /**
   * Mark an operation as complete
   */
  complete(id: string): void {
    const operation = this.pending.get(id);

    if (!operation) {
      console.warn('[OptimisticUpdates] Operation not found', { id });
      return;
    }

    console.log('[OptimisticUpdates] Operation completed', {
      id,
      type: operation.type,
      duration: Date.now() - operation.timestamp
    });

    this.pending.delete(id);
    this.options.onComplete(operation);
  }

  /**
   * Mark an operation as failed and trigger rollback
   */
  fail(id: string, error: Error): PendingOperation | null {
    const operation = this.pending.get(id);

    if (!operation) {
      console.warn('[OptimisticUpdates] Operation not found', { id });
      return null;
    }

    console.error('[OptimisticUpdates] Operation failed', {
      id,
      type: operation.type,
      error: error.message,
      retryCount: operation.retryCount
    });

    // Check if we should retry
    if (operation.retryCount < this.options.maxRetries) {
      operation.retryCount++;
      operation.timestamp = Date.now(); // Reset timestamp for retry

      console.log('[OptimisticUpdates] Scheduling retry', {
        id,
        retryCount: operation.retryCount,
        maxRetries: this.options.maxRetries
      });

      return operation;
    }

    // Max retries reached, remove and trigger failure callback
    this.pending.delete(id);
    this.options.onFailure(operation, error);

    return operation;
  }

  /**
   * Get a pending operation by ID
   */
  get(id: string): PendingOperation | undefined {
    return this.pending.get(id);
  }

  /**
   * Get all pending operations
   */
  getPending(): PendingOperation[] {
    return Array.from(this.pending.values());
  }

  /**
   * Get pending operations by type
   */
  getPendingByType(type: OperationType): PendingOperation[] {
    return this.getPending().filter(op => op.type === type);
  }

  /**
   * Check if there are any pending operations
   */
  hasPending(): boolean {
    return this.pending.size > 0;
  }

  /**
   * Check if there are pending operations of a specific type
   */
  hasPendingType(type: OperationType): boolean {
    return this.getPendingByType(type).length > 0;
  }

  /**
   * Clear a specific operation without triggering callbacks
   */
  remove(id: string): boolean {
    const existed = this.pending.has(id);

    if (existed) {
      this.pending.delete(id);
      console.log('[OptimisticUpdates] Removed operation', { id });
    }

    return existed;
  }

  /**
   * Clear all pending operations
   */
  clear(): void {
    const count = this.pending.size;

    this.pending.clear();

    console.log('[OptimisticUpdates] Cleared all operations', { count });
  }

  /**
   * Clear operations by type
   */
  clearByType(type: OperationType): number {
    const operations = this.getPendingByType(type);

    operations.forEach(op => {
      this.pending.delete(op.id);
    });

    console.log('[OptimisticUpdates] Cleared operations by type', {
      type,
      count: operations.length
    });

    return operations.length;
  }

  /**
   * Clean up stale operations (older than staleTimeout)
   */
  private cleanupStaleOperations(): void {
    const now = Date.now();
    const staleThreshold = now - this.options.staleTimeout;

    let staleCount = 0;

    // Convert to array to avoid iteration issues
    const entries = Array.from(this.pending.entries());

    for (const [id, operation] of entries) {
      if (operation.timestamp < staleThreshold) {
        console.warn('[OptimisticUpdates] Removing stale operation', {
          id,
          type: operation.type,
          age: now - operation.timestamp
        });

        this.pending.delete(id);
        staleCount++;
      }
    }

    if (staleCount > 0) {
      console.log('[OptimisticUpdates] Cleaned up stale operations', {
        count: staleCount
      });
    }
  }

  /**
   * Generate unique operation ID
   */
  private generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics about pending operations
   */
  getStats(): {
    total: number;
    byType: Record<OperationType, number>;
    oldestOperation: PendingOperation | null;
    averageAge: number;
  } {
    const operations = this.getPending();

    const byType = operations.reduce(
      (acc, op) => {
        acc[op.type] = (acc[op.type] || 0) + 1;
        return acc;
      },
      {} as Record<OperationType, number>
    );

    const now = Date.now();
    const oldestOperation =
      operations.length > 0
        ? operations.reduce((oldest, op) =>
            op.timestamp < oldest.timestamp ? op : oldest
          )
        : null;

    const averageAge =
      operations.length > 0
        ? operations.reduce((sum, op) => sum + (now - op.timestamp), 0) /
          operations.length
        : 0;

    return {
      total: operations.length,
      byType,
      oldestOperation,
      averageAge
    };
  }
}

// Export singleton instance for global use
export const optimisticUpdates = new OptimisticUpdateManager({
  staleTimeout: 30000, // 30 seconds
  maxRetries: 3,
  onComplete: (operation) => {
    console.log('[OptimisticUpdates] Global: Operation completed', {
      id: operation.id,
      type: operation.type
    });
  },
  onFailure: (operation, error) => {
    console.error('[OptimisticUpdates] Global: Operation failed', {
      id: operation.id,
      type: operation.type,
      error: error.message
    });
  }
});
