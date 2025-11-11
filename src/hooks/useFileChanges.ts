/**
 * File Changes Hook
 * Tracks real-time file operations (create, update, delete)
 */

import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../../services/api';

export interface FileChange {
  id: string;
  type: 'created' | 'updated' | 'deleted';
  path: string;
  content?: string;
  timestamp: Date;
}

export interface FileTree {
  [path: string]: string; // path -> content
}

export interface UseFileChangesReturn {
  fileChanges: FileChange[];
  fileTree: FileTree;
  getFile: (path: string) => string | undefined;
  clearFileChanges: () => void;
}

/**
 * Hook for tracking file changes in real-time
 * Maintains both a change log and a current file tree
 *
 * @param sessionId - The session ID to listen to
 * @returns File changes, file tree, and utility functions
 *
 * @example
 * ```tsx
 * const { fileChanges, fileTree } = useFileChanges(sessionId);
 * ```
 */
export function useFileChanges(
  sessionId: string | undefined
): UseFileChangesReturn {
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [fileTree, setFileTree] = useState<FileTree>({});

  useEffect(() => {
    if (!sessionId) {
      console.log('[useFileChanges] No session ID, skipping subscription');
      return;
    }

    console.log('[useFileChanges] Subscribing to session:', sessionId);

    const unsubFileChange = sessionService.onFileChange((data) => {
      console.log('[useFileChanges] File change event:', data);

      const change: FileChange = {
        id: `${data.path}-${Date.now()}`,
        type: data.action,
        path: data.path,
        content: data.content,
        timestamp: new Date(),
      };

      // Add to change log
      setFileChanges((prev) => {
        // Keep only last 100 changes to prevent memory issues
        const updated = [...prev, change];
        if (updated.length > 100) {
          return updated.slice(-100);
        }
        return updated;
      });

      // Update file tree
      if (data.action === 'created' || data.action === 'updated') {
        if (data.content !== undefined) {
          setFileTree((prev) => ({
            ...prev,
            [data.path]: data.content || '',
          }));
        }
      } else if (data.action === 'deleted') {
        setFileTree((prev) => {
          const { [data.path]: deleted, ...rest } = prev;
          return rest;
        });
      }
    });

    return () => {
      console.log('[useFileChanges] Cleaning up subscription');
      unsubFileChange();
    };
  }, [sessionId]);

  // Get file content by path
  const getFile = useCallback(
    (path: string) => {
      return fileTree[path];
    },
    [fileTree]
  );

  // Clear file changes log (keeps file tree)
  const clearFileChanges = useCallback(() => {
    setFileChanges([]);
  }, []);

  return {
    fileChanges,
    fileTree,
    getFile,
    clearFileChanges,
  };
}

/**
 * Helper hook to get specific file changes for a single file
 */
export function useFileHistory(
  sessionId: string | undefined,
  filePath: string | undefined
) {
  const { fileChanges } = useFileChanges(sessionId);

  const history = filePath
    ? fileChanges.filter((change) => change.path === filePath)
    : [];

  return {
    history,
    latestChange: history[history.length - 1],
    changeCount: history.length,
  };
}
