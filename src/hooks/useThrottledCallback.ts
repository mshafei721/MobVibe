// Throttled Callback Hook for Performance Optimization
// DEFERRED: Will be used when mobile app is implemented

import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook that throttles a callback function to improve performance.
 * Useful for high-frequency events like scrolling, resizing, or input changes.
 *
 * @param callback - Function to throttle
 * @param delay - Minimum delay between calls (ms)
 * @returns Throttled version of the callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      // If enough time has passed, execute immediately
      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        // Otherwise, schedule for later
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            callback(...args);
            lastRun.current = Date.now();
          },
          delay - timeSinceLastRun
        );
      }
    },
    [callback, delay]
  ) as T;
}

/**
 * Hook that debounces a callback function.
 * Different from throttle: delays execution until after calls have stopped.
 *
 * @param callback - Function to debounce
 * @param delay - Delay before execution (ms)
 * @returns Debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;
}

/**
 * Hook that limits the rate of callback execution using requestAnimationFrame.
 * Ensures callback runs at most once per animation frame (~60fps).
 *
 * @param callback - Function to rate-limit
 * @returns Rate-limited version of the callback
 */
export function useAnimationFrameCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const rafRef = useRef<number | null>(null);
  const latestArgs = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      latestArgs.current = args;

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          if (latestArgs.current) {
            callback(...latestArgs.current);
          }
          rafRef.current = null;
          latestArgs.current = null;
        });
      }
    },
    [callback]
  ) as T;
}

/**
 * Example usage:
 *
 * function SearchComponent() {
 *   // Throttle search API calls to max once per 500ms
 *   const throttledSearch = useThrottledCallback((query: string) => {
 *     apiClient.search(query);
 *   }, 500);
 *
 *   // Debounce input to wait until user stops typing
 *   const debouncedSearch = useDebouncedCallback((query: string) => {
 *     apiClient.search(query);
 *   }, 300);
 *
 *   // Limit scroll handler to animation frame rate
 *   const handleScroll = useAnimationFrameCallback((event) => {
 *     updateScrollPosition(event.nativeEvent.contentOffset.y);
 *   });
 *
 *   return (
 *     <View>
 *       <TextInput onChangeText={debouncedSearch} />
 *       <ScrollView onScroll={handleScroll} scrollEventThrottle={16}>
 *         {children}
 *       </ScrollView>
 *     </View>
 *   );
 * }
 */
