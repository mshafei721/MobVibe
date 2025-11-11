/**
 * Preview Ready Hook
 * Notifies when preview is ready and provides preview URL
 */

import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../../services/api';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export interface UsePreviewReadyReturn {
  previewUrl: string | null;
  isReady: boolean;
  resetPreview: () => void;
}

/**
 * Hook for detecting when preview is ready
 * Provides haptic feedback on ready state
 *
 * @param sessionId - The session ID to listen to
 * @param enableHaptics - Whether to enable haptic feedback (default: true)
 * @returns Preview URL, ready state, and reset function
 *
 * @example
 * ```tsx
 * const { previewUrl, isReady } = usePreviewReady(sessionId);
 * ```
 */
export function usePreviewReady(
  sessionId: string | undefined,
  enableHaptics: boolean = true
): UsePreviewReadyReturn {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      console.log('[usePreviewReady] No session ID, skipping subscription');
      return;
    }

    console.log('[usePreviewReady] Subscribing to session:', sessionId);

    const unsubPreview = sessionService.onPreviewReady((data) => {
      console.log('[usePreviewReady] Preview ready event:', data);

      // Set preview URL (prefer preview_url, fallback to url)
      const url = data.preview_url || data.url;
      setPreviewUrl(url);
      setIsReady(true);

      // Trigger haptic feedback
      if (enableHaptics) {
        ReactNativeHapticFeedback.trigger('notificationSuccess', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      }

      console.log('[usePreviewReady] Preview is ready:', url);
    });

    return () => {
      console.log('[usePreviewReady] Cleaning up subscription');
      unsubPreview();
    };
  }, [sessionId, enableHaptics]);

  // Reset preview state
  const resetPreview = useCallback(() => {
    setPreviewUrl(null);
    setIsReady(false);
  }, []);

  return {
    previewUrl,
    isReady,
    resetPreview,
  };
}

/**
 * Helper hook that returns true once and only once when preview becomes ready
 * Useful for showing one-time notifications or animations
 */
export function usePreviewReadyOnce(sessionId: string | undefined): boolean {
  const [hasNotified, setHasNotified] = useState(false);
  const { isReady } = usePreviewReady(sessionId);

  useEffect(() => {
    if (isReady && !hasNotified) {
      setHasNotified(true);
    }
  }, [isReady, hasNotified]);

  return hasNotified;
}
