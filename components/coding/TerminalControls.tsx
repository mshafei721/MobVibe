import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';
import Clipboard from '@react-native-clipboard/clipboard';

interface TerminalControlsProps {
  onClear: () => void;
  onCopy?: () => void;
  showTimestamps: boolean;
  onToggleTimestamps: () => void;
  isExecuting: boolean;
  lineCount: number;
  errorCount?: number;
  showErrorsOnly?: boolean;
  onToggleErrorsOnly?: () => void;
}

export function TerminalControls({
  onClear,
  onCopy,
  showTimestamps,
  onToggleTimestamps,
  isExecuting,
  lineCount,
  errorCount = 0,
  showErrorsOnly = false,
  onToggleErrorsOnly,
}: TerminalControlsProps) {
  const handleClear = () => {
    Alert.alert(
      'Clear Terminal',
      'Are you sure you want to clear all terminal output?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: onClear,
        },
      ],
      { cancelable: true }
    );
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    }
  };

  return (
    <View style={styles.container}>
      {/* Status indicators */}
      <View style={styles.status}>
        <View style={[
          styles.statusDot,
          { backgroundColor: isExecuting ? '#50fa7b' : '#6272a4' }
        ]} />
        <Text style={styles.statusText}>
          {isExecuting ? 'Running' : 'Idle'}
        </Text>
        <Text style={styles.separator}>•</Text>
        <Text style={styles.lineCountText}>{lineCount} lines</Text>
        {errorCount > 0 && (
          <>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.errorCountText}>{errorCount} errors</Text>
          </>
        )}
      </View>

      {/* Control buttons */}
      <View style={styles.controls}>
        {/* Toggle timestamps */}
        <TouchableOpacity
          style={[styles.button, showTimestamps && styles.buttonActive]}
          onPress={onToggleTimestamps}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, showTimestamps && styles.buttonTextActive]}>
            🕐
          </Text>
        </TouchableOpacity>

        {/* Toggle errors only */}
        {onToggleErrorsOnly && errorCount > 0 && (
          <TouchableOpacity
            style={[styles.button, showErrorsOnly && styles.buttonActive]}
            onPress={onToggleErrorsOnly}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, showErrorsOnly && styles.buttonTextActive]}>
              ⚠
            </Text>
          </TouchableOpacity>
        )}

        {/* Copy button */}
        {onCopy && (
          <TouchableOpacity
            style={styles.button}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>📋</Text>
          </TouchableOpacity>
        )}

        {/* Clear button */}
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={handleClear}
          activeOpacity={0.7}
          disabled={lineCount === 0}
        >
          <Text style={[styles.buttonText, lineCount === 0 && styles.buttonTextDisabled]}>
            🗑
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#252525',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 11,
    color: '#f8f8f2',
  },
  separator: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 11,
    color: '#6272a4',
    marginHorizontal: 8,
  },
  lineCountText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 11,
    color: '#8be9fd',
  },
  errorCountText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 11,
    color: '#ff5555',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#44475a',
  },
  buttonActive: {
    backgroundColor: '#44475a',
    borderColor: '#50fa7b',
  },
  clearButton: {
    borderColor: '#ff5555',
  },
  buttonText: {
    fontSize: 14,
  },
  buttonTextActive: {
    opacity: 1,
  },
  buttonTextDisabled: {
    opacity: 0.3,
  },
});
