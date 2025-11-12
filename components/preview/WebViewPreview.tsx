import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewErrorEvent } from 'react-native-webview';
import { tokens } from '@/src/ui/tokens';
import { PreviewLoading } from './PreviewLoading';
import { PreviewError } from './PreviewError';
import { logger } from '@/utils/logger';

export interface WebViewPreviewProps {
  url: string;
  onError?: (error: string) => void;
  onLoadEnd?: () => void;
  /**
   * Enable performance optimizations
   * @default true
   */
  optimizePerformance?: boolean;
  /**
   * Cache size in MB
   * @default 100
   */
  cacheSize?: number;
}

/**
 * WebViewPreview Component
 *
 * Main WebView component for displaying live app previews.
 * Handles loading states, errors, and auto-refresh on URL changes.
 *
 * Features:
 * - Auto-refresh when URL changes
 * - Loading overlay during initial load
 * - Error handling with retry capability
 * - JavaScript and DOM storage enabled
 * - Platform-specific optimizations
 *
 * @param url - Preview URL to load (from backend)
 * @param onError - Optional callback for error handling
 * @param onLoadEnd - Optional callback when loading completes
 *
 * @example
 * ```tsx
 * const webViewRef = useRef<WebView>(null);
 *
 * <WebViewPreview
 *   url={previewUrl}
 *   onError={(error) => logger.error('Preview error', new Error(error))}
 *   onLoadEnd={() => logger.info('Preview loaded')}
 * />
 *
 * // Imperative reload
 * webViewRef.current?.reload();
 * ```
 */
export const WebViewPreview = React.forwardRef<WebView, WebViewPreviewProps>(
  ({ url, onError, onLoadEnd, optimizePerformance = true, cacheSize = 100 }, ref) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const internalRef = useRef<WebView>(null);
    const loadTimeRef = useRef<number>(0);

    // Use forwarded ref or internal ref
    const webViewRef = (ref as React.RefObject<WebView>) || internalRef;

    // Auto-refresh when URL changes
    useEffect(() => {
      if (url && webViewRef.current) {
        logger.info('[WebViewPreview] URL changed, reloading:', url);
        setLoading(true);
        setError(null);
        webViewRef.current.reload();
      }
    }, [url]);

    const handleLoadStart = useCallback(() => {
      loadTimeRef.current = Date.now();
      logger.info('[WebViewPreview] Load started');
      setLoading(true);
      setError(null);
    }, []);

    const handleLoadEnd = useCallback(() => {
      const loadTime = Date.now() - loadTimeRef.current;
      logger.info(`[WebViewPreview] Load completed in ${loadTime}ms`);
      setLoading(false);
      onLoadEnd?.();
    }, [onLoadEnd]);

    const handleError = useCallback((event: WebViewErrorEvent) => {
      const errorMessage = event.nativeEvent.description || 'Failed to load preview';
      logger.error('[WebViewPreview] Error:', new Error(errorMessage));
      setError(errorMessage);
      setLoading(false);
      onError?.(errorMessage);
    }, [onError]);

    const handleHttpError = useCallback((event: any) => {
      const statusCode = event.nativeEvent.statusCode;
      const errorMessage = `HTTP Error ${statusCode}: Failed to load preview`;
      logger.error('[WebViewPreview] HTTP Error:', new Error(errorMessage), { statusCode });
      setError(errorMessage);
      setLoading(false);
      onError?.(errorMessage);
    }, [onError]);

    const handleMessage = useCallback((event: WebViewMessageEvent) => {
      // Handle messages from WebView (e.g., console logs, errors)
      try {
        const message = JSON.parse(event.nativeEvent.data);
        logger.info('[WebViewPreview] Message from WebView:', message);
      } catch (err) {
        logger.info('[WebViewPreview] Raw message:', event.nativeEvent.data);
      }
    }, []);

    const handleRetry = useCallback(() => {
      logger.info('[WebViewPreview] Retrying preview load');
      setError(null);
      setLoading(true);
      webViewRef.current?.reload();
    }, []);

    // Inject performance optimization script
    const injectedJavaScript = useMemo(() => {
      if (!optimizePerformance) return undefined;

      return `
        // Performance monitoring
        if (window.performance && window.performance.timing) {
          const perfData = window.performance.timing;
          const loadTime = perfData.loadEventEnd - perfData.navigationStart;
          console.log('[WebView Performance] Page load time:', loadTime + 'ms');
        }

        // Disable animations if needed
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          document.documentElement.style.setProperty('--animation-duration', '0ms');
        }

        // Memory optimization
        let imageObserver;
        if ('IntersectionObserver' in window) {
          imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  imageObserver.unobserve(img);
                }
              }
            });
          });

          document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
          });
        }

        true; // Required for injectedJavaScript
      `;
    }, [optimizePerformance]);

    // Show error state
    if (error) {
      return <PreviewError error={error} onRetry={handleRetry} />;
    }

    return (
      <View style={styles.container}>
        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          // JavaScript Configuration
          javaScriptEnabled={true}
          domStorageEnabled={true}
          injectedJavaScript={injectedJavaScript}
          // Loading & Error Handlers
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onHttpError={handleHttpError}
          onMessage={handleMessage}
          // Performance & Security
          cacheEnabled={true}
          cacheMode="LOAD_DEFAULT"
          mixedContentMode="compatibility"
          allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
          startInLoadingState={true}
          incognito={false}
          // Memory optimization
          androidLayerType={optimizePerformance ? 'hardware' : 'none'}
          // Accessibility
          accessible={true}
          accessibilityLabel="App preview"
          accessibilityRole="none"
          // Platform-specific optimizations
          {...(Platform.OS === 'android' && {
            setSupportMultipleWindows: false,
            allowFileAccess: false,
            scalesPageToFit: true,
            nestedScrollEnabled: true,
          })}
          {...(Platform.OS === 'ios' && {
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
            bounces: true,
            scrollEnabled: true,
          })}
        />

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <PreviewLoading status="starting" message="Loading preview..." />
          </View>
        )}
      </View>
    );
  }
);

WebViewPreview.displayName = 'WebViewPreview';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.base,
  },
  webview: {
    flex: 1,
    backgroundColor: tokens.colors.background.base,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: tokens.colors.background.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
