/**
 * Session Progress Hook
 * Tracks session status and progress
 */

import { useState, useEffect } from 'react';
import { sessionService } from '../../services/api';

export type SessionStatus =
  | 'active'
  | 'thinking'
  | 'executing'
  | 'paused'
  | 'completed'
  | 'error';

export interface ProgressUpdate {
  status: SessionStatus;
  progress?: number; // 0-100
  currentTask?: string;
  estimatedTimeRemaining?: number; // in seconds
}

export interface UseSessionProgressReturn extends ProgressUpdate {
  isActive: boolean;
  isCompleted: boolean;
  hasError: boolean;
}

/**
 * Hook for tracking session progress and status
 * Infers status from various event types
 *
 * @param sessionId - The session ID to track
 * @returns Progress update with status, progress percentage, and flags
 *
 * @example
 * ```tsx
 * const { status, progress, isActive } = useSessionProgress(sessionId);
 * ```
 */
export function useSessionProgress(
  sessionId: string | undefined
): UseSessionProgressReturn {
  const [progress, setProgress] = useState<ProgressUpdate>({
    status: 'active',
  });

  useEffect(() => {
    if (!sessionId) {
      console.log('[useSessionProgress] No session ID, skipping subscription');
      return;
    }

    console.log('[useSessionProgress] Subscribing to session:', sessionId);

    // Listen to thinking events
    const unsubThinking = sessionService.onThinking((data) => {
      console.log('[useSessionProgress] Status: thinking');
      setProgress((prev) => ({
        ...prev,
        status: 'thinking',
        currentTask: data.message || 'Thinking...',
        progress: data.progress,
      }));
    });

    // Listen to terminal events (executing)
    const unsubTerminal = sessionService.onTerminalOutput((data) => {
      console.log('[useSessionProgress] Status: executing');
      setProgress((prev) => ({
        ...prev,
        status: 'executing',
        currentTask: data.command || 'Executing command...',
      }));
    });

    // Listen to file change events (back to active)
    const unsubFileChange = sessionService.onFileChange((data) => {
      console.log('[useSessionProgress] Status: active (file change)');
      setProgress((prev) => ({
        ...prev,
        status: 'active',
        currentTask: `${data.action === 'created' ? 'Created' : data.action === 'updated' ? 'Updated' : 'Deleted'} ${data.path}`,
      }));
    });

    // Listen to completion events
    const unsubComplete = sessionService.onCompletion((data) => {
      console.log('[useSessionProgress] Status: completed');
      setProgress({
        status: 'completed',
        progress: 100,
        currentTask: data.message || 'Session completed!',
      });
    });

    // Listen to error events
    const unsubError = sessionService.onError((data) => {
      console.log('[useSessionProgress] Status: error');
      setProgress((prev) => ({
        ...prev,
        status: 'error',
        currentTask: data.message || 'An error occurred',
      }));
    });

    return () => {
      console.log('[useSessionProgress] Cleaning up subscriptions');
      unsubThinking();
      unsubTerminal();
      unsubFileChange();
      unsubComplete();
      unsubError();
    };
  }, [sessionId]);

  return {
    ...progress,
    isActive: progress.status === 'active' || progress.status === 'thinking' || progress.status === 'executing',
    isCompleted: progress.status === 'completed',
    hasError: progress.status === 'error',
  };
}

/**
 * Helper hook for simple loading state
 * Returns true if session is active, thinking, or executing
 */
export function useSessionLoading(sessionId: string | undefined): boolean {
  const { isActive } = useSessionProgress(sessionId);
  return isActive;
}

/**
 * Helper hook to get a human-readable status message
 */
export function useSessionStatusMessage(
  sessionId: string | undefined
): string {
  const progress = useSessionProgress(sessionId);

  switch (progress.status) {
    case 'thinking':
      return progress.currentTask || 'Thinking...';
    case 'executing':
      return progress.currentTask || 'Executing...';
    case 'active':
      return progress.currentTask || 'Working...';
    case 'completed':
      return progress.currentTask || 'Completed';
    case 'error':
      return progress.currentTask || 'Error occurred';
    case 'paused':
      return 'Paused';
    default:
      return 'Active';
  }
}
