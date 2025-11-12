import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Spinner, Text } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';
import { PreviewStatus } from '@/hooks/usePreviewUrl';

export interface PreviewLoadingProps {
  status: PreviewStatus;
  message?: string;
}

/**
 * PreviewLoading Component
 *
 * Displays loading state for preview generation with status-based messaging.
 * Used during preview initialization and startup phases.
 *
 * @param status - Current preview status (pending, starting, refreshing)
 * @param message - Optional custom message to override default
 *
 * @example
 * ```tsx
 * <PreviewLoading status="starting" />
 * <PreviewLoading status="pending" message="Preparing environment..." />
 * ```
 */
export function PreviewLoading({ status, message }: PreviewLoadingProps) {
  const getStatusMessage = (): string => {
    if (message) return message;

    switch (status) {
      case 'pending':
        return 'Initializing preview...';
      case 'starting':
        return 'Starting preview server...';
      case 'refreshing':
        return 'Refreshing preview...';
      default:
        return 'Loading preview...';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Loading Spinner */}
        <Spinner
          size="lg"
          color={tokens.colors.primary[500]}
          accessibilityLabel="Loading preview"
        />

        {/* Status Message */}
        <Text
          variant="body"
          color={tokens.colors.text.secondary}
          style={styles.message}
        >
          {getStatusMessage()}
        </Text>

        {/* Subtle hint */}
        <Text
          variant="caption"
          color={tokens.colors.text.tertiary}
          style={styles.hint}
        >
          This may take a few moments
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[6],
  },
  message: {
    textAlign: 'center',
    marginTop: tokens.spacing[2],
  },
  hint: {
    textAlign: 'center',
    marginTop: tokens.spacing[1],
  },
});
