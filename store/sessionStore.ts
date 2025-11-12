/**
 * Session Store
 * Comprehensive session state management with persistence
 * Coordinates between API calls, real-time events, and UI state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionService } from '../services/api';
import type { Session } from '../services/api/types';
import { logger } from '../utils/logger';

// Message types for chat interface
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type: 'text' | 'code' | 'thinking' | 'error';
  metadata?: Record<string, any>;
}

// Extended session interface with job tracking
export interface ExtendedSession extends Session {
  job_id?: string;
}

interface SessionState {
  // Current session state
  currentSession: ExtendedSession | null;
  messages: Message[];

  // Session history
  recentSessions: Session[];

  // UI state
  loading: boolean;
  error: string | null;
  isThinking: boolean;

  // Session lifecycle actions
  startSession: (projectId: string, prompt: string) => Promise<Session>;
  resumeSession: (sessionId: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  sendMessage: (sessionId: string, message: string) => Promise<void>;

  // Message management
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setThinking: (thinking: boolean) => void;

  // Session history
  fetchRecentSessions: (projectId: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;

  // Cleanup and error handling
  clearCurrentSession: () => void;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      messages: [],
      recentSessions: [],
      loading: false,
      error: null,
      isThinking: false,

      // Start a new session
      startSession: async (projectId: string, prompt: string) => {
        set({ loading: true, error: null, messages: [] });

        try {
          logger.info('[SessionStore] Starting new session', { projectId });

          // Create session via API
          const { session, job_id } = await sessionService.createSession(
            projectId,
            prompt
          );

          // Add user's prompt as first message
          const userMessage: Message = {
            id: `${Date.now()}-user`,
            role: 'user',
            content: prompt,
            timestamp: new Date(),
            type: 'text'
          };

          set({
            currentSession: { ...session, job_id },
            messages: [userMessage],
            loading: false,
            isThinking: true
          });

          logger.info('[SessionStore] Session started successfully', {
            sessionId: session.id,
            jobId: job_id
          });

          return session;
        } catch (error: any) {
          logger.error('[SessionStore] Failed to start session', error);
          set({
            error: error.message || 'Failed to start session',
            loading: false
          });
          throw error;
        }
      },

      // Resume a paused session
      resumeSession: async (sessionId: string) => {
        set({ loading: true, error: null });

        try {
          logger.info('[SessionStore] Resuming session', { sessionId });

          const session = await sessionService.resumeSession(sessionId);

          // Load message history (messages already in state from persistence)
          const currentMessages = get().messages;

          set({
            currentSession: session,
            loading: false,
            isThinking: session.status === 'active'
          });

          logger.info('[SessionStore] Session resumed', {
            sessionId,
            messageCount: currentMessages.length
          });
        } catch (error: any) {
          logger.error('[SessionStore] Failed to resume session:', error);
          set({
            error: error.message || 'Failed to resume session',
            loading: false
          });
          throw error;
        }
      },

      // Pause the current session
      pauseSession: async () => {
        const { currentSession } = get();
        if (!currentSession) {
          logger.warn('[SessionStore] No active session to pause');
          return;
        }

        set({ loading: true, error: null });

        try {
          logger.info('[SessionStore] Pausing session', {
            sessionId: currentSession.id
          });

          await sessionService.pauseSession(currentSession.id);

          set(state => ({
            currentSession: state.currentSession
              ? { ...state.currentSession, status: 'paused' }
              : null,
            loading: false,
            isThinking: false
          }));

          logger.info('[SessionStore] Session paused');
        } catch (error: any) {
          logger.error('[SessionStore] Failed to pause session:', error);
          set({
            error: error.message || 'Failed to pause session',
            loading: false
          });
          throw error;
        }
      },

      // Stop the current session
      stopSession: async () => {
        const { currentSession } = get();
        if (!currentSession) {
          logger.warn('[SessionStore] No active session to stop');
          return;
        }

        set({ loading: true, error: null });

        try {
          logger.info('[SessionStore] Stopping session', {
            sessionId: currentSession.id
          });

          await sessionService.stopSession(currentSession.id);

          set({
            currentSession: null,
            loading: false,
            isThinking: false
          });

          logger.info('[SessionStore] Session stopped');
        } catch (error: any) {
          logger.error('[SessionStore] Failed to stop session:', error);
          set({
            error: error.message || 'Failed to stop session',
            loading: false
          });
          throw error;
        }
      },

      // Send a message in the current session
      sendMessage: async (sessionId: string, message: string) => {
        logger.info('[SessionStore] Sending message', {
          sessionId,
          messageLength: message.length
        });

        // Add user message immediately (optimistic update)
        const userMessage: Message = {
          id: `${Date.now()}-user`,
          role: 'user',
          content: message,
          timestamp: new Date(),
          type: 'text'
        };

        set(state => ({
          messages: [...state.messages, userMessage],
          isThinking: true,
          error: null
        }));

        try {
          // TODO: Implement sendMessage endpoint when backend supports it
          // For now, this is a placeholder for future message sending
          logger.info('[SessionStore] Message added to UI (API endpoint pending)');
        } catch (error: any) {
          logger.error('[SessionStore] Failed to send message:', error);

          // Remove optimistic message on failure
          set(state => ({
            messages: state.messages.filter(m => m.id !== userMessage.id),
            error: error.message || 'Failed to send message',
            isThinking: false
          }));
          throw error;
        }
      },

      // Add a message to the chat history
      addMessage: (message: Message) => {
        set(state => {
          // Prevent duplicate messages
          const isDuplicate = state.messages.some(m => m.id === message.id);
          if (isDuplicate) {
            logger.warn('[SessionStore] Duplicate message detected', {
              messageId: message.id
            });
            return state;
          }

          return {
            messages: [...state.messages, message]
          };
        });
      },

      // Clear all messages
      clearMessages: () => {
        logger.info('[SessionStore] Clearing messages');
        set({ messages: [] });
      },

      // Set thinking state
      setThinking: (thinking: boolean) => {
        set({ isThinking: thinking });
      },

      // Fetch recent sessions for a project
      fetchRecentSessions: async (projectId: string) => {
        set({ loading: true, error: null });

        try {
          logger.info('[SessionStore] Fetching recent sessions', { projectId });

          const sessions = await sessionService.getSessionHistory(projectId);

          set({
            recentSessions: sessions,
            loading: false
          });

          logger.info('[SessionStore] Fetched sessions', {
            count: sessions.length
          });
        } catch (error: any) {
          logger.error('[SessionStore] Failed to fetch sessions:', error);
          set({
            error: error.message || 'Failed to fetch sessions',
            loading: false
          });
        }
      },

      // Load a specific session
      loadSession: async (sessionId: string) => {
        set({ loading: true, error: null });

        try {
          logger.info('[SessionStore] Loading session', { sessionId });

          // Get session details from backend
          const session = await sessionService.getSession(sessionId);

          // Reconnect to event stream
          sessionService.reconnectToSession(sessionId);

          // Messages will be restored from persistence or loaded via realtime hooks

          set({
            currentSession: session,
            loading: false,
            isThinking: session.status === 'active'
          });

          logger.info('[SessionStore] Session loaded', {
            sessionId,
            status: session.status
          });
        } catch (error: any) {
          logger.error('[SessionStore] Failed to load session:', error);
          set({
            error: error.message || 'Failed to load session',
            loading: false
          });
        }
      },

      // Clear current session
      clearCurrentSession: () => {
        logger.info('[SessionStore] Clearing current session');
        sessionService.cleanup(); // Unsubscribe from events
        set({
          currentSession: null,
          messages: [],
          isThinking: false,
          error: null
        });
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'mobvibe-session-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain fields to avoid bloat
      partialize: (state) => ({
        currentSession: state.currentSession,
        // Keep last 100 messages to prevent storage overflow
        messages: state.messages.slice(-100),
        recentSessions: state.recentSessions.slice(0, 20) // Keep 20 most recent
      }),
      // Handle rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          logger.info('[SessionStore] State rehydrated from storage', {
            hasSession: !!state.currentSession,
            messageCount: state.messages.length,
            recentSessionsCount: state.recentSessions.length
          });
        }
      }
    }
  )
);
