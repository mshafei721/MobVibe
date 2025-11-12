import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';

interface EmptyPreviewStateProps {
  message: string;
  description?: string;
}

/**
 * Empty state component for when there's no active session or preview
 * Provides clear messaging about the current state
 */
export function EmptyPreviewState({
  message,
  description = 'Start a coding session to see your app come to life here'
}: EmptyPreviewStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Empty State Icon */}
        <Text variant="h1" align="center" style={styles.icon}>
          📱
        </Text>

        {/* Message */}
        <Text
          variant="h3"
          align="center"
          color={tokens.colors.text.primary}
          style={styles.message}
        >
          {message}
        </Text>

        {/* Description */}
        <Text
          variant="body"
          align="center"
          color={tokens.colors.text.secondary}
          style={styles.description}
        >
          {description}
        </Text>

        {/* Hint */}
        <View style={styles.hintContainer}>
          <Text
            variant="caption"
            align="center"
            color={tokens.colors.text.tertiary}
          >
            💡 Tip: The preview updates automatically as Claude writes code
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.background.base,
    paddingHorizontal: tokens.spacing[6],
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    fontSize: 64,
    marginBottom: tokens.spacing[4],
  },
  message: {
    marginBottom: tokens.spacing[3],
  },
  description: {
    marginBottom: tokens.spacing[6],
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
