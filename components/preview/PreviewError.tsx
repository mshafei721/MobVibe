import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Icon } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';

export interface PreviewErrorProps {
  error: string;
  onRetry?: () => void;
}

/**
 * PreviewError Component
 *
 * Displays error state for failed preview generation with retry action.
 * Shows user-friendly error messages and provides recovery options.
 *
 * @param error - Error message to display
 * @param onRetry - Optional callback to retry preview generation
 *
 * @example
 * ```tsx
 * <PreviewError
 *   error="Failed to start preview server"
 *   onRetry={() => retryPreview()}
 * />
 * ```
 */
export function PreviewError({ error, onRetry }: PreviewErrorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <Icon
            family="ionicons"
            name="alert-circle-outline"
            size={64}
            color={tokens.colors.error[500]}
            accessibilityLabel="Error icon"
          />
        </View>

        {/* Error Title */}
        <Text
          variant="h3"
          color={tokens.colors.text.primary}
          style={styles.title}
        >
          Preview Unavailable
        </Text>

        {/* Error Message */}
        <Text
          variant="body"
          color={tokens.colors.text.secondary}
          style={styles.message}
        >
          {error}
        </Text>

        {/* Retry Button */}
        {onRetry && (
          <Button
            variant="primary"
            size="md"
            onPress={onRetry}
            accessibilityLabel="Retry preview generation"
            accessibilityHint="Attempts to regenerate the preview"
          >
            Try Again
          </Button>
        )}

        {/* Help Text */}
        <Text
          variant="caption"
          color={tokens.colors.text.tertiary}
          style={styles.helpText}
        >
          If the problem persists, try restarting the coding session
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
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: tokens.spacing[2],
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: tokens.spacing[2],
  },
  helpText: {
    textAlign: 'center',
    marginTop: tokens.spacing[2],
  },
});
