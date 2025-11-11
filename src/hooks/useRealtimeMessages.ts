/**
 * Real-time Messages Hook
 * Listens to backend events and converts them to chat messages
 */

import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../../services/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type: 'text' | 'code' | 'thinking' | 'error';
  metadata?: {
    language?: string;
    fileName?: string;
    eventType?: string;
  };
}

export interface UseRealtimeMessagesReturn {
  messages: Message[];
  isThinking: boolean;
  addUserMessage: (content: string) => void;
  clearMessages: () => void;
}

/**
 * Hook for managing real-time messages in the chat interface
 * Automatically subscribes to session events and converts them to messages
 *
 * @param sessionId - The session ID to listen to
 * @returns Messages array, thinking state, and utility functions
 *
 * @example
 * ```tsx
 * const { messages, isThinking } = useRealtimeMessages(sessionId);
 * ```
 */
export function useRealtimeMessages(
  sessionId: string | undefined
): UseRealtimeMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessageId, setThinkingMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      console.log('[useRealtimeMessages] No session ID, skipping subscription');
      return;
    }

    console.log('[useRealtimeMessages] Subscribing to session:', sessionId);

    // Listen to thinking events
    const unsubThinking = sessionService.onThinking((data) => {
      console.log('[useRealtimeMessages] Thinking event:', data);
      setIsThinking(true);

      // Add or update thinking message
      const messageId = 'thinking-' + Date.now();
      setThinkingMessageId(messageId);

      setMessages((prev) => {
        // Remove any previous thinking messages
        const filtered = prev.filter((m) => m.type !== 'thinking');
        return [
          ...filtered,
          {
            id: messageId,
            role: 'assistant',
            content: data.message || 'Thinking...',
            timestamp: new Date(),
            type: 'thinking',
            metadata: {
              eventType: 'thinking',
            },
          },
        ];
      });
    });

    // Listen to file change events (code generation)
    const unsubFileChange = sessionService.onFileChange((data) => {
      console.log('[useRealtimeMessages] File change event:', data);
      setIsThinking(false);

      setMessages((prev) => {
        // Remove thinking message if it exists
        const filtered = prev.filter((m) => m.type !== 'thinking');

        // Only add message if there's actual code content
        if (data.content && data.action !== 'deleted') {
          return [
            ...filtered,
            {
              id: data.path + '-' + Date.now(),
              role: 'assistant',
              content: data.content,
              timestamp: new Date(),
              type: 'code',
              metadata: {
                fileName: data.path,
                language: inferLanguage(data.path),
                eventType: 'file_change',
              },
            },
          ];
        }

        return filtered;
      });
    });

    // Listen to terminal output events
    const unsubTerminal = sessionService.onTerminalOutput((data) => {
      console.log('[useRealtimeMessages] Terminal output event:', data);

      // Don't show every terminal line as a message, just log it
      // Terminal output is better shown in a dedicated terminal viewer
      // But we can add it to messages if needed for debugging
      if (process.env.NODE_ENV === 'development') {
        setMessages((prev) => [
          ...prev,
          {
            id: 'terminal-' + Date.now(),
            role: 'system',
            content: data.output,
            timestamp: new Date(),
            type: 'text',
            metadata: {
              eventType: 'terminal',
            },
          },
        ]);
      }
    });

    // Listen to completion events
    const unsubComplete = sessionService.onCompletion((data) => {
      console.log('[useRealtimeMessages] Completion event:', data);
      setIsThinking(false);

      setMessages((prev) => {
        // Remove thinking message
        const filtered = prev.filter((m) => m.type !== 'thinking');
        return [
          ...filtered,
          {
            id: 'completion-' + Date.now(),
            role: 'system',
            content: data.message || 'Session completed successfully!',
            timestamp: new Date(),
            type: 'text',
            metadata: {
              eventType: 'completion',
            },
          },
        ];
      });
    });

    // Listen to error events
    const unsubError = sessionService.onError((data) => {
      console.log('[useRealtimeMessages] Error event:', data);
      setIsThinking(false);

      setMessages((prev) => {
        // Remove thinking message
        const filtered = prev.filter((m) => m.type !== 'thinking');
        return [
          ...filtered,
          {
            id: 'error-' + Date.now(),
            role: 'system',
            content: data.message || 'An error occurred',
            timestamp: new Date(),
            type: 'error',
            metadata: {
              eventType: 'error',
              code: data.code,
            },
          },
        ];
      });
    });

    // Cleanup on unmount or session change
    return () => {
      console.log('[useRealtimeMessages] Cleaning up subscriptions');
      unsubThinking();
      unsubFileChange();
      unsubTerminal();
      unsubComplete();
      unsubError();
    };
  }, [sessionId]);

  // Add user message (called when user sends a message)
  const addUserMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: 'user-' + Date.now(),
        role: 'user',
        content,
        timestamp: new Date(),
        type: 'text',
      },
    ]);
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setIsThinking(false);
    setThinkingMessageId(null);
  }, []);

  return {
    messages,
    isThinking,
    addUserMessage,
    clearMessages,
  };
}

/**
 * Infer programming language from file path
 */
function inferLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    swift: 'swift',
    kt: 'kotlin',
    php: 'php',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
  };

  return languageMap[ext || ''] || 'text';
}
