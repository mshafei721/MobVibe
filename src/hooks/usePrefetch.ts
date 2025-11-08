// Prefetch Hook for Predictive Loading
// DEFERRED: Will be used when mobile app is implemented

import { useCallback, useEffect, useRef } from 'react';
import { optimizedApiClient } from '@/services/api/optimized-client';

/**
 * Prefetch strategy configuration
 */
interface PrefetchConfig {
  /**
   * Delay before prefetching (ms)
   * Prevents prefetching on quick hovers/scrolls
   */
  delay?: number;

  /**
   * Whether to prefetch on mount
   */
  prefetchOnMount?: boolean;

  /**
   * Maximum number of concurrent prefetch requests
   */
  maxConcurrent?: number;
}

/**
 * Hook for prefetching data based on user behavior.
 * Implements predictive loading to improve perceived performance.
 *
 * @param config - Prefetch configuration
 * @returns Prefetch utility functions
 */
export function usePrefetch(config: PrefetchConfig = {}) {
  const {
    delay = 300,
    prefetchOnMount = false,
    maxConcurrent = 3,
  } = config;

  const prefetchQueue = useRef<string[]>([]);
  const activePrefetches = useRef(0);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Prefetch a session's details when user hovers or views in list
   * @param sessionId - Session ID to prefetch
   */
  const prefetchSession = useCallback(
    (sessionId: string) => {
      // Cancel previous timeout for this session
      const existingTimeout = timeoutRefs.current.get(sessionId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        if (activePrefetches.current >= maxConcurrent) {
          // Queue for later
          prefetchQueue.current.push(sessionId);
          return;
        }

        activePrefetches.current++;

        Promise.all([
          optimizedApiClient.prefetch(`/sessions/${sessionId}`),
          optimizedApiClient.prefetch(`/sessions/${sessionId}/code`),
          optimizedApiClient.prefetch(`/sessions/${sessionId}/events`),
        ])
          .then(() => {
            console.log(`[Prefetch] Session ${sessionId} prefetched`);
          })
          .finally(() => {
            activePrefetches.current--;

            // Process queue
            if (prefetchQueue.current.length > 0) {
              const nextSessionId = prefetchQueue.current.shift();
              if (nextSessionId) {
                prefetchSession(nextSessionId);
              }
            }
          });

        timeoutRefs.current.delete(sessionId);
      }, delay);

      timeoutRefs.current.set(sessionId, timeout);
    },
    [delay, maxConcurrent]
  );

  /**
   * Prefetch recent sessions (likely next page)
   */
  const prefetchRecentSessions = useCallback(() => {
    optimizedApiClient.prefetch('/sessions?page=2');
    optimizedApiClient.prefetch('/sessions?page=3');
  }, []);

  /**
   * Prefetch user profile data
   */
  const prefetchProfile = useCallback(() => {
    optimizedApiClient.prefetch('/profile');
    optimizedApiClient.prefetch('/profile/preferences');
    optimizedApiClient.prefetch('/profile/usage');
  }, []);

  /**
   * Prefetch onboarding content for new users
   */
  const prefetchOnboarding = useCallback(() => {
    optimizedApiClient.prefetch('/onboarding/progress');
    optimizedApiClient.prefetch('/onboarding/tips');
  }, []);

  /**
   * Prefetch code templates
   */
  const prefetchTemplates = useCallback(() => {
    optimizedApiClient.prefetch('/templates');
  }, []);

  /**
   * Cancel all pending prefetch operations
   */
  const cancelAllPrefetches = useCallback(() => {
    // Clear all timeouts
    for (const timeout of timeoutRefs.current.values()) {
      clearTimeout(timeout);
    }
    timeoutRefs.current.clear();

    // Clear queue
    prefetchQueue.current = [];
  }, []);

  /**
   * Prefetch based on navigation prediction
   * @param fromScreen - Current screen
   * @param toScreen - Predicted next screen
   */
  const prefetchForNavigation = useCallback(
    (fromScreen: string, toScreen?: string) => {
      switch (fromScreen) {
        case 'Home':
          // User likely to open a session
          prefetchRecentSessions();
          break;

        case 'SessionList':
          // User likely to view session details or profile
          if (toScreen === 'Profile') {
            prefetchProfile();
          }
          break;

        case 'NewSession':
          // User likely to use templates
          prefetchTemplates();
          break;

        default:
          break;
      }
    },
    [prefetchRecentSessions, prefetchProfile, prefetchTemplates]
  );

  /**
   * Prefetch on mount if configured
   */
  useEffect(() => {
    if (prefetchOnMount) {
      // Prefetch common data on app start
      setTimeout(() => {
        prefetchRecentSessions();
        prefetchProfile();
      }, 1000); // Delay to not block initial render
    }

    return () => {
      cancelAllPrefetches();
    };
  }, [prefetchOnMount, prefetchRecentSessions, prefetchProfile, cancelAllPrefetches]);

  return {
    prefetchSession,
    prefetchRecentSessions,
    prefetchProfile,
    prefetchOnboarding,
    prefetchTemplates,
    prefetchForNavigation,
    cancelAllPrefetches,
  };
}

/**
 * Example usage:
 *
 * function SessionListItem({ session }) {
 *   const { prefetchSession } = usePrefetch();
 *
 *   return (
 *     <Pressable
 *       onPressIn={() => prefetchSession(session.id)}
 *       onPress={() => navigateToSession(session.id)}
 *     >
 *       <Text>{session.title}</Text>
 *     </Pressable>
 *   );
 * }
 *
 * function App() {
 *   const {
 *     prefetchRecentSessions,
 *     prefetchProfile,
 *     prefetchForNavigation,
 *   } = usePrefetch({
 *     prefetchOnMount: true,
 *     delay: 200,
 *     maxConcurrent: 3,
 *   });
 *
 *   useEffect(() => {
 *     // Prefetch based on predicted navigation
 *     prefetchForNavigation('Home');
 *   }, []);
 *
 *   return <Navigation />;
 * }
 */
