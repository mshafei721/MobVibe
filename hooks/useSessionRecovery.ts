/**
 * Session Recovery Hook
 * Handles app restarts, background/foreground transitions, and session reconnection
 * Ensures sessions maintain connectivity across app lifecycle events
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSessionStore } from '../store/sessionStore';
import { sessionService } from '../services/api';
import NetInfo from '@react-native-community/netinfo';

interface UseSessionRecoveryOptions {
  /**
   * Enable automatic reconnection on app foreground
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * Enable network monitoring and reconnection
   * @default true
   */
  monitorNetwork?: boolean;

  /**
   * Callback when recovery completes
   */
  onRecoveryComplete?: (sessionId: string) => void;

  /**
   * Callback when recovery fails
   */
  onRecoveryError?: (error: Error) => void;
}

export function useSessionRecovery(options: UseSessionRecoveryOptions = {}) {
  const {
    autoReconnect = true,
    monitorNetwork = true,
    onRecoveryComplete,
    onRecoveryError
  } = options;

  const { currentSession, loadSession } = useSessionStore();
  const appStateRef = useRef(AppState.currentState);
  const reconnectingRef = useRef(false);

  /**
   * Attempt to recover/reconnect to a session
   */
  const recoverSession = async (sessionId: string) => {
    if (reconnectingRef.current) {
      console.log('[useSessionRecovery] Already reconnecting, skipping');
      return;
    }

    reconnectingRef.current = true;

    try {
      console.log('[useSessionRecovery] Attempting session recovery', {
        sessionId
      });

      // Reconnect to event stream
      sessionService.reconnectToSession(sessionId);

      // Optionally refresh session state from backend
      await loadSession(sessionId);

      console.log('[useSessionRecovery] Session recovered successfully', {
        sessionId
      });

      onRecoveryComplete?.(sessionId);
    } catch (error) {
      console.error('[useSessionRecovery] Session recovery failed:', error);
      onRecoveryError?.(error as Error);
    } finally {
      reconnectingRef.current = false;
    }
  };

  /**
   * Handle app startup recovery
   */
  useEffect(() => {
    if (!autoReconnect || !currentSession) {
      return;
    }

    // On mount, check if there's an active session that needs recovery
    if (
      currentSession.status === 'active' &&
      !sessionService.isConnected()
    ) {
      console.log('[useSessionRecovery] Recovering session on app startup', {
        sessionId: currentSession.id
      });

      recoverSession(currentSession.id);
    }
  }, []); // Run only on mount

  /**
   * Handle app state changes (background/foreground)
   */
  useEffect(() => {
    if (!autoReconnect) {
      return;
    }

    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        const wasBackground = appStateRef.current === 'background';
        const isActive = nextAppState === 'active';

        console.log('[useSessionRecovery] AppState changed', {
          from: appStateRef.current,
          to: nextAppState
        });

        // App came to foreground from background
        if (wasBackground && isActive && currentSession) {
          // Check if we need to reconnect
          if (
            currentSession.status === 'active' &&
            !sessionService.isConnected()
          ) {
            console.log(
              '[useSessionRecovery] App foregrounded, recovering session',
              { sessionId: currentSession.id }
            );

            recoverSession(currentSession.id);
          }
        }

        // App went to background
        if (nextAppState === 'background') {
          console.log('[useSessionRecovery] App backgrounded', {
            hasSession: !!currentSession,
            isConnected: sessionService.isConnected()
          });

          // Keep connection alive but reduce polling if needed
          // For now, we maintain the connection
        }

        appStateRef.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [currentSession, autoReconnect]);

  /**
   * Monitor network connectivity
   */
  useEffect(() => {
    if (!monitorNetwork || !currentSession) {
      return;
    }

    const unsubscribe = NetInfo.addEventListener(state => {
      const wasConnected = state.isConnected;

      console.log('[useSessionRecovery] Network state changed', {
        isConnected: state.isConnected,
        type: state.type
      });

      // Network came back online
      if (wasConnected && currentSession) {
        if (
          currentSession.status === 'active' &&
          !sessionService.isConnected()
        ) {
          console.log(
            '[useSessionRecovery] Network restored, recovering session',
            { sessionId: currentSession.id }
          );

          recoverSession(currentSession.id);
        }
      }

      // Network went offline
      if (!wasConnected) {
        console.log('[useSessionRecovery] Network offline', {
          sessionId: currentSession?.id
        });
        // Event stream will handle reconnection automatically when network returns
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentSession, monitorNetwork]);

  return {
    isRecovering: reconnectingRef.current,
    recoverSession
  };
}

/**
 * Simplified version that just handles automatic recovery
 * without exposing manual controls
 */
export function useAutoSessionRecovery() {
  useSessionRecovery({
    autoReconnect: true,
    monitorNetwork: true
  });
}
