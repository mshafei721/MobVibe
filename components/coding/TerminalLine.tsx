import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';
import { parseAnsi, TextSegment } from '@/utils/ansiParser';
import { TerminalLine as TerminalLineType } from '@/src/hooks/useTerminalOutput';

interface TerminalLineProps {
  line: TerminalLineType;
  showTimestamp?: boolean;
  lineNumber?: number;
}

export function TerminalLine({
  line,
  showTimestamp = false,
  lineNumber
}: TerminalLineProps) {
  const parsed = useMemo(() => parseAnsi(line.content), [line.content]);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <View style={styles.container}>
      {lineNumber !== undefined && (
        <Text style={styles.lineNumber}>{lineNumber.toString().padStart(4, ' ')}</Text>
      )}

      {showTimestamp && (
        <Text style={styles.timestamp}>{formatTime(line.timestamp)}</Text>
      )}

      <View style={styles.content}>
        {parsed.segments.map((segment: TextSegment, idx: number) => (
          <Text
            key={idx}
            style={[
              styles.text,
              {
                color: segment.color || (line.type === 'stderr' ? tokens.colors.error[500] : '#f8f8f2'),
                backgroundColor: segment.backgroundColor,
                fontWeight: segment.bold ? '700' : '400',
                fontStyle: segment.italic ? 'italic' : 'normal',
                textDecorationLine: segment.underline ? 'underline' : 'none',
                opacity: segment.dim ? 0.6 : 1,
              },
            ]}
          >
            {segment.text}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  lineNumber: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 11,
    color: '#6272a4',
    marginRight: 12,
    minWidth: 40,
    textAlign: 'right',
  },
  timestamp: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 11,
    color: '#6272a4',
    marginRight: 12,
    minWidth: 70,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
});
