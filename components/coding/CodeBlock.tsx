import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Text } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';

interface CodeBlockProps {
  code: string;
  language: string;
  fileName?: string;
}

export function CodeBlock({ code, language, fileName }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code');
    }
  };

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      tsx: 'TSX',
      jsx: 'JSX',
      json: 'JSON',
      css: 'CSS',
      html: 'HTML',
      markdown: 'Markdown',
      python: 'Python',
      bash: 'Bash',
    };
    return labels[lang.toLowerCase()] || lang.toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.languageBadge}>
            <Text variant="caption" color={tokens.colors.text.inverse} weight="medium">
              {getLanguageLabel(language)}
            </Text>
          </View>
          {fileName && (
            <Text variant="caption" color={tokens.colors.text.secondary}>
              {fileName}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
          <Text variant="caption" color={tokens.colors.primary[500]} weight="medium">
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Code Content */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.codeScrollView}
      >
        <View style={styles.codeContainer}>
          {code.split('\n').map((line, index) => (
            <View key={index} style={styles.codeLine}>
              <Text
                variant="caption"
                color={tokens.colors.neutral[500]}
                style={styles.lineNumber}
              >
                {(index + 1).toString().padStart(2, ' ')}
              </Text>
              <Text
                variant="caption"
                color={tokens.colors.code.text}
                style={styles.codeText}
              >
                {line || ' '}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.code.background,
    borderRadius: tokens.spacing.borderRadius.md,
    overflow: 'hidden',
    marginVertical: tokens.spacing[2],
    maxWidth: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    flex: 1,
  },
  languageBadge: {
    backgroundColor: tokens.colors.primary[500],
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1] / 2,
    borderRadius: tokens.spacing.borderRadius.sm,
  },
  copyButton: {
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
  },
  codeScrollView: {
    maxHeight: 400,
  },
  codeContainer: {
    padding: tokens.spacing[3],
  },
  codeLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 20,
  },
  lineNumber: {
    fontFamily: tokens.typography.fontFamily.mono,
    marginRight: tokens.spacing[3],
    userSelect: 'none',
    minWidth: 24,
    textAlign: 'right',
  },
  codeText: {
    fontFamily: tokens.typography.fontFamily.mono,
    flex: 1,
  },
});
