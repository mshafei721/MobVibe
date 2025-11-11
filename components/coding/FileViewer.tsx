/**
 * FileViewer Component
 * Displays file contents with syntax highlighting and line numbers
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { tokens } from '@/src/ui/tokens';
import { detectLanguage } from '@/utils/fileTree';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

export interface FileViewerProps {
  filePath: string;
  content: string;
  language?: string;
}

export function FileViewer({ filePath, content, language }: FileViewerProps) {
  const [copied, setCopied] = useState(false);

  // Auto-detect language if not provided
  const detectedLanguage = language || detectLanguage(filePath);
  const fileName = filePath.split('/').pop() || filePath;

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  // Split content into lines for line numbers
  const lines = content.split('\n');
  const lineNumberWidth = String(lines.length).length * 10 + 20;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* File Info */}
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <View style={styles.languageBadge}>
            <Text style={styles.languageText}>{detectedLanguage}</Text>
          </View>
        </View>

        {/* Copy Button */}
        <TouchableOpacity
          style={[styles.copyButton, copied && styles.copyButtonSuccess]}
          onPress={handleCopy}
          activeOpacity={0.7}
        >
          <Text style={styles.copyButtonText}>{copied ? '✓ Copied' : 'Copy'}</Text>
        </TouchableOpacity>
      </View>

      {/* Code Content */}
      <ScrollView
        style={styles.codeContainer}
        horizontal
        showsHorizontalScrollIndicator={true}
      >
        <ScrollView
          style={styles.codeScrollView}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.codeContent}>
            {/* Line Numbers */}
            <View style={[styles.lineNumbers, { width: lineNumberWidth }]}>
              {lines.map((_, idx) => (
                <Text key={idx} style={styles.lineNumber}>
                  {idx + 1}
                </Text>
              ))}
            </View>

            {/* Code with Syntax Highlighting */}
            <View style={styles.codeWrapper}>
              <SyntaxHighlighter
                language={detectedLanguage}
                style={atomOneDark}
                customStyle={styles.syntaxHighlighter}
                highlighter="hljs"
              >
                {content}
              </SyntaxHighlighter>
            </View>
          </View>
        </ScrollView>
      </ScrollView>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {lines.length} lines · {content.length} characters
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.code.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing[3],
    backgroundColor: tokens.colors.neutral[800],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.neutral[700],
  },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: tokens.spacing[2],
  },
  fileName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold as any,
    color: tokens.colors.code.text,
    marginRight: tokens.spacing[2],
    flex: 1,
  },
  languageBadge: {
    backgroundColor: tokens.colors.primary[500],
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  languageText: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.semibold as any,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  copyButton: {
    backgroundColor: tokens.colors.neutral[700],
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyButtonSuccess: {
    backgroundColor: tokens.colors.success[600],
  },
  copyButtonText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium as any,
    color: '#FFFFFF',
  },
  codeContainer: {
    flex: 1,
  },
  codeScrollView: {
    flex: 1,
  },
  codeContent: {
    flexDirection: 'row',
  },
  lineNumbers: {
    backgroundColor: tokens.colors.neutral[900],
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[2],
    borderRightWidth: 1,
    borderRightColor: tokens.colors.neutral[700],
  },
  lineNumber: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: tokens.colors.neutral[500],
    textAlign: 'right',
    lineHeight: 18,
  },
  codeWrapper: {
    flex: 1,
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[3],
  },
  syntaxHighlighter: {
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  footer: {
    padding: tokens.spacing[2],
    backgroundColor: tokens.colors.neutral[800],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.neutral[700],
  },
  footerText: {
    fontSize: 10,
    color: tokens.colors.neutral[500],
    textAlign: 'center',
  },
});
