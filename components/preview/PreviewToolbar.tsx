import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Share, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Text, Icon } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';
import { logger } from '@/utils/logger';

export interface PreviewToolbarProps {
  url: string;
  webViewRef?: React.RefObject<WebView>;
  onReload?: () => void;
}

/**
 * PreviewToolbar Component
 *
 * Toolbar for preview controls including reload, URL display, and share functionality.
 * Positioned at the top of the preview screen with horizontal layout.
 *
 * Features:
 * - Reload button (triggers webViewRef.reload() or custom callback)
 * - URL display with ellipsis for long URLs
 * - Share button (uses React Native Share API)
 * - Platform-specific styling (iOS/Android)
 *
 * @param url - Current preview URL to display
 * @param webViewRef - Reference to WebView for reload action
 * @param onReload - Optional custom reload callback
 *
 * @example
 * ```tsx
 * const webViewRef = useRef<WebView>(null);
 *
 * <PreviewToolbar
 *   url={previewUrl}
 *   webViewRef={webViewRef}
 * />
 * ```
 */
export function PreviewToolbar({ url, webViewRef, onReload }: PreviewToolbarProps) {
  const handleReload = () => {
    logger.info('[PreviewToolbar] Reloading preview');

    // Use custom callback if provided, otherwise use webViewRef
    if (onReload) {
      onReload();
    } else if (webViewRef?.current) {
      webViewRef.current.reload();
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share(
        {
          message: `Check out my app preview: ${url}`,
          url: Platform.OS === 'ios' ? url : undefined,
          title: 'App Preview',
        },
        {
          dialogTitle: 'Share Preview URL',
          subject: 'App Preview',
        }
      );

      if (result.action === Share.sharedAction) {
        logger.info('[PreviewToolbar] Preview URL shared successfully');
      } else if (result.action === Share.dismissedAction) {
        logger.info('[PreviewToolbar] Share dismissed');
      }
    } catch (error) {
      logger.error('[PreviewToolbar] Error sharing', error as Error);
      Alert.alert('Share Failed', 'Unable to share preview URL');
    }
  };

  const handleCopyUrl = () => {
    // For a simple demo, show alert
    // In production, you'd use Clipboard API
    Alert.alert('URL', url, [{ text: 'OK' }]);
  };

  // Truncate URL for display
  const getTruncatedUrl = (fullUrl: string, maxLength: number = 40): string => {
    if (fullUrl.length <= maxLength) return fullUrl;

    // Show start and end of URL
    const start = fullUrl.substring(0, maxLength / 2);
    const end = fullUrl.substring(fullUrl.length - maxLength / 2);
    return `${start}...${end}`;
  };

  return (
    <View style={styles.container}>
      {/* Left Section: Reload Button */}
      <TouchableOpacity
        onPress={handleReload}
        style={styles.iconButton}
        accessibilityLabel="Reload preview"
        accessibilityHint="Reloads the current preview"
        accessibilityRole="button"
      >
        <Icon
          family="ionicons"
          name="reload-outline"
          size="md"
          color={tokens.colors.primary[500]}
        />
      </TouchableOpacity>

      {/* Center Section: URL Display */}
      <TouchableOpacity
        onPress={handleCopyUrl}
        style={styles.urlContainer}
        accessibilityLabel={`Preview URL: ${url}`}
        accessibilityHint="Tap to view full URL"
        accessibilityRole="button"
      >
        <Icon
          family="ionicons"
          name="link-outline"
          size="sm"
          color={tokens.colors.text.tertiary}
        />
        <Text
          variant="caption"
          color={tokens.colors.text.secondary}
          style={styles.urlText}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {getTruncatedUrl(url)}
        </Text>
      </TouchableOpacity>

      {/* Right Section: Share Button */}
      <TouchableOpacity
        onPress={handleShare}
        style={styles.iconButton}
        accessibilityLabel="Share preview"
        accessibilityHint="Opens share menu to share preview URL"
        accessibilityRole="button"
      >
        <Icon
          family="ionicons"
          name={Platform.OS === 'ios' ? 'share-outline' : 'share-social-outline'}
          size="md"
          color={tokens.colors.primary[500]}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    backgroundColor: tokens.colors.background.base,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.subtle,
    // Platform-specific shadow
    ...Platform.select({
      ios: {
        shadowColor: tokens.colors.neutral[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: tokens.spacing.borderRadius.md,
    backgroundColor: tokens.colors.surface[1],
  },
  urlContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    marginHorizontal: tokens.spacing[2],
    backgroundColor: tokens.colors.surface[1],
    borderRadius: tokens.spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  urlText: {
    flex: 1,
  },
});
