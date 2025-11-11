import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';
import { CodeBlock } from './CodeBlock';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'thinking';
  language?: string;
  fileName?: string;
}

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isThinking = message.type === 'thinking';
  const isCode = message.type === 'code';

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (isThinking) {
    return (
      <View style={[styles.container, styles.assistantContainer]}>
        <View style={[styles.bubble, styles.assistantBubble, styles.thinkingBubble]}>
          <ThinkingIndicator />
          <Text variant="body" color={tokens.colors.text.secondary}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  if (isCode && message.language) {
    return (
      <View style={[styles.container, styles.assistantContainer]}>
        <CodeBlock
          code={message.content}
          language={message.language}
          fileName={message.fileName}
        />
        <Text variant="caption" color={tokens.colors.text.tertiary} style={styles.timestamp}>
          {formatTimestamp(message.timestamp)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text
          variant="body"
          color={isUser ? tokens.colors.text.inverse : tokens.colors.text.primary}
        >
          {message.content}
        </Text>
      </View>
      <Text variant="caption" color={tokens.colors.text.tertiary} style={styles.timestamp}>
        {formatTimestamp(message.timestamp)}
      </Text>
    </View>
  );
}

function ThinkingIndicator() {
  return (
    <View style={styles.thinkingContainer}>
      <View style={[styles.thinkingDot, styles.thinkingDot1]} />
      <View style={[styles.thinkingDot, styles.thinkingDot2]} />
      <View style={[styles.thinkingDot, styles.thinkingDot3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    width: '100%',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderRadius: tokens.spacing.borderRadius.lg,
  },
  userBubble: {
    backgroundColor: tokens.colors.primary[500],
    borderBottomRightRadius: tokens.spacing.borderRadius.sm,
  },
  assistantBubble: {
    backgroundColor: tokens.colors.surface[1],
    borderBottomLeftRadius: tokens.spacing.borderRadius.sm,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  timestamp: {
    marginTop: tokens.spacing[1],
    fontSize: tokens.typography.fontSize.xs,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.primary[500],
  },
  thinkingDot1: {
    opacity: 0.4,
  },
  thinkingDot2: {
    opacity: 0.7,
  },
  thinkingDot3: {
    opacity: 1,
  },
});
