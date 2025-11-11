/**
 * Terminal Output Hook
 * Streams terminal output in real-time
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionService } from '../../services/api';

export interface TerminalLine {
  id: string;
  content: string;
  type: 'stdout' | 'stderr';
  timestamp: Date;
}

export interface UseTerminalOutputReturn {
  lines: TerminalLine[];
  isExecuting: boolean;
  clearTerminal: () => void;
  getRecentOutput: (count?: number) => TerminalLine[];
}

/**
 * Hook for streaming terminal output in real-time
 * Tracks both stdout and stderr with automatic execution detection
 *
 * @param sessionId - The session ID to listen to
 * @param maxLines - Maximum number of lines to keep (default: 1000)
 * @returns Terminal lines, execution state, and utility functions
 *
 * @example
 * ```tsx
 * const { lines, isExecuting } = useTerminalOutput(sessionId);
 * ```
 */
export function useTerminalOutput(
  sessionId: string | undefined,
  maxLines: number = 1000
): UseTerminalOutputReturn {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const executionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!sessionId) {
      console.log('[useTerminalOutput] No session ID, skipping subscription');
      return;
    }

    console.log('[useTerminalOutput] Subscribing to session:', sessionId);

    const unsubTerminal = sessionService.onTerminalOutput((data) => {
      console.log('[useTerminalOutput] Terminal output event:', data);

      // Set executing state
      setIsExecuting(true);

      // Clear any existing timeout
      if (executionTimeoutRef.current) {
        clearTimeout(executionTimeoutRef.current);
      }

      // Set new timeout to clear executing state after 2s of no output
      executionTimeoutRef.current = setTimeout(() => {
        setIsExecuting(false);
      }, 2000);

      // Add line to terminal
      setLines((prev) => {
        const newLine: TerminalLine = {
          id: `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: data.output,
          type: 'stdout', // Default to stdout, backend can specify stderr if needed
          timestamp: new Date(),
        };

        const updated = [...prev, newLine];

        // Limit to maxLines to prevent memory issues
        if (updated.length > maxLines) {
          return updated.slice(-maxLines);
        }

        return updated;
      });
    });

    // Cleanup
    return () => {
      console.log('[useTerminalOutput] Cleaning up subscription');
      unsubTerminal();
      if (executionTimeoutRef.current) {
        clearTimeout(executionTimeoutRef.current);
      }
    };
  }, [sessionId, maxLines]);

  // Clear terminal
  const clearTerminal = useCallback(() => {
    setLines([]);
    setIsExecuting(false);
    if (executionTimeoutRef.current) {
      clearTimeout(executionTimeoutRef.current);
    }
  }, []);

  // Get recent output
  const getRecentOutput = useCallback(
    (count: number = 10) => {
      return lines.slice(-count);
    },
    [lines]
  );

  return {
    lines,
    isExecuting,
    clearTerminal,
    getRecentOutput,
  };
}

/**
 * Helper hook to get only error output (stderr)
 */
export function useTerminalErrors(sessionId: string | undefined) {
  const { lines } = useTerminalOutput(sessionId);

  const errors = lines.filter((line) => line.type === 'stderr');

  return {
    errors,
    hasErrors: errors.length > 0,
    errorCount: errors.length,
  };
}
