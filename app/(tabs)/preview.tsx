import React, { useRef } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Text } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';
import { useSessionStore } from '@/store/sessionStore';
import { usePreviewUrl } from '@/hooks/usePreviewUrl';
import {
  PreviewLoading,
  PreviewError,
  WebViewPreview,
  PreviewToolbar,
} from '@/components/preview';
import { logger } from '@/utils/logger';

/**
 * Preview Tab Screen
 *
 * Displays live app preview in WebView for the current coding session.
 *
 * Features:
 * - Real-time preview URL fetching and updates
 * - Loading states during preview initialization
 * - Error handling with retry capability
 * - Empty state when no session is active
 * - Toolbar with reload and URL display
 *
 * State Flow:
 * 1. No session → Empty state with instructions
 * 2. Session exists but no preview → "Preview will appear..." message
 * 3. status === 'starting' → Loading spinner
 * 4. status === 'failed' || error → Error view with retry
 * 5. status === 'ready' && url → WebView with preview
 */
export default function PreviewScreen() {
  const webViewRef = useRef<WebView>(null);
  const { currentSession } = useSessionStore();

  // Fetch preview URL and subscribe to real-time updates
  const { url, status, loading, error, retry } = usePreviewUrl(currentSession?.id);

  // No active session
  if (!currentSession) {
    return (
      <SafeAreaView
        style={styles.container}
        accessibilityLabel="Preview screen"
        accessibilityHint="No active coding session"
      >
        <View
          style={styles.emptyState}
          accessible={true}
          accessibilityRole="none"
        >
          <Text
            variant="h1"
            style={styles.emptyIcon}
            accessibilityLabel="Mobile phone icon"
          >
            📱
          </Text>
          <Text
            variant="h3"
            color={tokens.colors.text.primary}
            style={styles.emptyTitle}
            accessibilityRole="header"
          >
            No Active Session
          </Text>
          <Text
            variant="body"
            color={tokens.colors.text.secondary}
            style={styles.emptyMessage}
          >
            Start a coding session to see your app come to life here
          </Text>
          <View style={styles.hintContainer}>
            <Text
              variant="caption"
              color={tokens.colors.text.tertiary}
              accessibilityLabel="Tip: The preview updates automatically as Claude writes code"
            >
              💡 Tip: The preview updates automatically as Claude writes code
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Loading or starting preview
  if (loading || status === 'pending' || status === 'starting') {
    return (
      <SafeAreaView style={styles.container}>
        <PreviewLoading status={status} />
      </SafeAreaView>
    );
  }

  // Error or failed preview
  if (error || status === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <PreviewError
          error={error || 'Preview generation failed'}
          onRetry={retry}
        />
      </SafeAreaView>
    );
  }

  // No URL yet (code generation in progress)
  if (!url) {
    return (
      <SafeAreaView
        style={styles.container}
        accessibilityLabel="Preview screen"
        accessibilityHint="Waiting for code generation to complete"
      >
        <View
          style={styles.emptyState}
          accessible={true}
          accessibilityRole="none"
        >
          <Text
            variant="h1"
            style={styles.emptyIcon}
            accessibilityLabel="Hourglass icon"
          >
            ⏳
          </Text>
          <Text
            variant="h3"
            color={tokens.colors.text.primary}
            style={styles.emptyTitle}
            accessibilityRole="header"
          >
            Preview Coming Soon
          </Text>
          <Text
            variant="body"
            color={tokens.colors.text.secondary}
            style={styles.emptyMessage}
          >
            Preview will appear after code generation completes
          </Text>
          <View style={styles.hintContainer}>
            <Text
              variant="caption"
              color={tokens.colors.text.tertiary}
              accessibilityLabel="Claude is working on your code"
            >
              Claude is working on your code...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Ready state with preview URL
  return (
    <SafeAreaView
      style={styles.container}
      accessibilityLabel="App preview screen"
      accessibilityHint="Displays live preview of your app"
    >
      <View
        style={styles.previewContainer}
        accessible={false}
      >
        {/* Toolbar with reload and URL display */}
        <PreviewToolbar url={url} webViewRef={webViewRef} />

        {/* WebView Preview */}
        <WebViewPreview
          ref={webViewRef}
          url={url}
          onError={(errorMessage) => {
            logger.error('[PreviewScreen] WebView error:', new Error(errorMessage));
          }}
          onLoadEnd={() => {
            logger.info('[PreviewScreen] Preview loaded successfully');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.base,
  },
  previewContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[6],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: tokens.spacing[4],
    textAlign: 'center',
  },
  emptyTitle: {
    marginBottom: tokens.spacing[3],
    textAlign: 'center',
  },
  emptyMessage: {
    marginBottom: tokens.spacing[6],
    textAlign: 'center',
    maxWidth: 400,
  },
  hintContainer: {
    marginTop: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    backgroundColor: tokens.colors.surface[1],
    borderRadius: tokens.spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.primary,
  },
});
