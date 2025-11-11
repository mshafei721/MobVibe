import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';

interface EmptySessionStateProps {
  projectId: string;
  projectName?: string;
  templateId?: string;
  onStartSession: (prompt: string) => void;
}

const EXAMPLE_PROMPTS: Record<string, string[]> = {
  'blank': [
    'Create a simple todo list app',
    'Build a weather widget',
    'Design a user profile screen',
  ],
  'social-feed': [
    'Add dark mode support',
    'Implement pull-to-refresh',
    'Add infinite scroll loading',
  ],
  'ecommerce': [
    'Create a product search feature',
    'Add shopping cart functionality',
    'Implement payment integration',
  ],
  'default': [
    'Help me get started with this project',
    'Show me the project structure',
    'Add a new feature',
  ],
};

export function EmptySessionState({
  projectId,
  projectName,
  templateId,
  onStartSession,
}: EmptySessionStateProps) {
  const prompts = EXAMPLE_PROMPTS[templateId || 'default'] || EXAMPLE_PROMPTS.default;

  const getTemplateIcon = (template?: string) => {
    switch (template) {
      case 'blank':
        return '📄';
      case 'social-feed':
        return '📱';
      case 'ecommerce':
        return '🛍️';
      default:
        return '⚡';
    }
  };

  const getTemplateName = (template?: string) => {
    switch (template) {
      case 'blank':
        return 'Blank Project';
      case 'social-feed':
        return 'Social Feed';
      case 'ecommerce':
        return 'E-Commerce';
      default:
        return 'Project';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text variant="h1" align="center" style={styles.icon}>
          {getTemplateIcon(templateId)}
        </Text>
        <Text variant="h2" align="center" color={tokens.colors.text.primary}>
          {projectName || 'Your Project'}
        </Text>
        <Text variant="body" align="center" color={tokens.colors.text.secondary} style={styles.subtitle}>
          {getTemplateName(templateId)} • No active session
        </Text>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text variant="h3" align="center" color={tokens.colors.text.primary}>
          Ready to start coding?
        </Text>
        <Text variant="body" align="center" color={tokens.colors.text.secondary} style={styles.ctaDescription}>
          Start a new coding session by typing a prompt or select one of these suggestions:
        </Text>
      </View>

      {/* Example Prompts */}
      <View style={styles.promptsContainer}>
        {prompts.map((prompt, index) => (
          <TouchableOpacity
            key={index}
            style={styles.promptChip}
            onPress={() => onStartSession(prompt)}
          >
            <Text variant="body" color={tokens.colors.primary[500]}>
              {prompt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info Text */}
      <View style={styles.infoContainer}>
        <Text variant="caption" align="center" color={tokens.colors.text.tertiary}>
          Claude will help you build features, fix bugs, and improve your app.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[8],
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing[8],
  },
  icon: {
    fontSize: 64,
    marginBottom: tokens.spacing[4],
  },
  subtitle: {
    marginTop: tokens.spacing[2],
  },
  ctaSection: {
    alignItems: 'center',
    marginBottom: tokens.spacing[6],
  },
  ctaDescription: {
    marginTop: tokens.spacing[2],
    maxWidth: 300,
  },
  promptsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: tokens.spacing[3],
    marginBottom: tokens.spacing[8],
  },
  promptChip: {
    backgroundColor: tokens.colors.surface[1],
    borderWidth: 1,
    borderColor: tokens.colors.border.primary,
    borderRadius: tokens.spacing.borderRadius.md,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    alignItems: 'center',
  },
  infoContainer: {
    paddingHorizontal: tokens.spacing[4],
  },
});
