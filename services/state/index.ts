/**
 * State Management Services
 * Centralized exports for all state-related services
 */

export { MessageHistory } from './messageHistory';
export {
  OptimisticUpdateManager,
  optimisticUpdates,
  type PendingOperation,
  type OperationType,
  type OptimisticUpdateOptions
} from './optimisticUpdates';
export {
  SessionSync,
  sessionSync,
  type SessionSyncOptions
} from './sessionSync';
