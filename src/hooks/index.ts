/**
 * Hooks - Centralized exports
 * Custom React hooks for MobVibe
 */

// Real-time event hooks
export {
  useRealtimeMessages,
  type Message,
  type UseRealtimeMessagesReturn,
} from './useRealtimeMessages';

export {
  useFileChanges,
  useFileHistory,
  type FileChange,
  type FileTree,
  type UseFileChangesReturn,
} from './useFileChanges';

export {
  useTerminalOutput,
  useTerminalErrors,
  type TerminalLine,
  type UseTerminalOutputReturn,
} from './useTerminalOutput';

export {
  useSessionProgress,
  useSessionLoading,
  useSessionStatusMessage,
  type SessionStatus,
  type ProgressUpdate,
  type UseSessionProgressReturn,
} from './useSessionProgress';

export {
  usePreviewReady,
  usePreviewReadyOnce,
  type UsePreviewReadyReturn,
} from './usePreviewReady';

// Existing hooks
export { useMemoryManager } from './useMemoryManager';
export { usePrefetch } from './usePrefetch';
export { useThrottledCallback } from './useThrottledCallback';
