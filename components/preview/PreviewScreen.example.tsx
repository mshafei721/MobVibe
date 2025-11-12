/**
 * PreviewScreen Example
 *
 * Example implementation showing how to integrate all preview components
 * with the usePreviewUrl hook. This demonstrates the complete preview flow.
 *
 * DO NOT USE THIS FILE DIRECTLY - it's a reference example.
 * Copy this pattern into your actual screen files (e.g., app/(app)/session/[id]/preview.tsx)
 */

import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { usePreviewUrl } from '@/hooks/usePreviewUrl';
import { tokens } from '@/src/ui/tokens';
import {
  PreviewLoading,
  PreviewError,
  WebViewPreview,
  PreviewToolbar,
} from '@/components/preview';
import { logger } from '@/utils/logger';

interface PreviewScreenExampleProps {
  sessionId: string;
}

/**
 * Complete Preview Screen Example
 *
 * Features:
 * - Automatic preview URL fetching and real-time updates
 * - Loading states with status messages
 * - Error handling with retry capability
 * - WebView with auto-refresh on URL changes
 * - Toolbar with reload, URL display, and share
 * - Responsive to preview lifecycle (pending → starting → ready)
 */
export function PreviewScreenExample({ sessionId }: PreviewScreenExampleProps) {
  const webViewRef = useRef<WebView>(null);

  // Fetch preview URL and subscribe to updates
  const { url, status, loading, error, retry } = usePreviewUrl(sessionId);

  // Handle loading states
  if (loading || status === 'pending' || status === 'starting') {
    return <PreviewLoading status={status} />;
  }

  // Handle error states
  if (error || status === 'failed') {
    return (
      <PreviewError
        error={error || 'Preview generation failed'}
        onRetry={retry}
      />
    );
  }

  // Handle missing URL (shouldn't happen if status is ready)
  if (!url) {
    return (
      <PreviewError
        error="Preview URL not available"
        onRetry={retry}
      />
    );
  }

  // Render preview with toolbar
  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <PreviewToolbar
        url={url}
        webViewRef={webViewRef}
      />

      {/* WebView Preview */}
      <WebViewPreview
        ref={webViewRef}
        url={url}
        onError={(errorMessage) => {
          logger.error('[PreviewScreen] WebView error:', errorMessage);
          // Optionally show error UI or toast
        }}
        onLoadEnd={() => {
          logger.info('[PreviewScreen] Preview loaded successfully');
        }}
      />
    </View>
  );
}

/**
 * Alternative: Minimal Implementation
 *
 * Simplest possible preview screen without toolbar.
 * Good for embedded previews or modal views.
 */
export function MinimalPreviewExample({ sessionId }: PreviewScreenExampleProps) {
  const { url, status, loading, error, retry } = usePreviewUrl(sessionId);

  if (loading || status === 'pending' || status === 'starting') {
    return <PreviewLoading status={status} />;
  }

  if (error || status === 'failed' || !url) {
    return (
      <PreviewError
        error={error || 'Preview unavailable'}
        onRetry={retry}
      />
    );
  }

  return <WebViewPreview url={url} />;
}

/**
 * Alternative: Custom Toolbar Implementation
 *
 * Shows how to use WebViewPreview with custom controls.
 */
export function CustomToolbarPreviewExample({ sessionId }: PreviewScreenExampleProps) {
  const webViewRef = useRef<WebView>(null);
  const { url, status, loading, error, retry } = usePreviewUrl(sessionId);

  const handleCustomReload = () => {
    logger.info('[CustomPreview] Custom reload logic');
    webViewRef.current?.reload();
    // Add custom logic here (e.g., analytics, haptics, etc.)
  };

  if (loading || status === 'pending' || status === 'starting') {
    return <PreviewLoading status={status} />;
  }

  if (error || status === 'failed' || !url) {
    return (
      <PreviewError
        error={error || 'Preview unavailable'}
        onRetry={retry}
      />
    );
  }

  return (
    <View style={styles.container}>
      <PreviewToolbar
        url={url}
        webViewRef={webViewRef}
        onReload={handleCustomReload} // Custom reload callback
      />
      <WebViewPreview
        ref={webViewRef}
        url={url}
        onLoadEnd={() => logger.info('Custom load end handler')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.base,
  },
});
