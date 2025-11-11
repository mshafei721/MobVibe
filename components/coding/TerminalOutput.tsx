import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Text } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';
import { TerminalLine as TerminalLineComponent } from './TerminalLine';
import { TerminalLine } from '@/src/hooks/useTerminalOutput';

interface TerminalOutputProps {
  lines: TerminalLine[];
  isExecuting?: boolean;
  showTimestamps?: boolean;
  showLineNumbers?: boolean;
  maxHeight?: number;
}

export function TerminalOutput({
  lines,
  isExecuting = false,
  showTimestamps = false,
  showLineNumbers = false,
  maxHeight,
}: TerminalOutputProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollButtonOpacity = useRef(new Animated.Value(0)).current;

  // Auto-scroll to bottom when new lines arrive (if user hasn't scrolled up)
  useEffect(() => {
    if (!userScrolled && lines.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [lines, userScrolled]);

  // Show/hide scroll-to-bottom button
  useEffect(() => {
    if (userScrolled) {
      setShowScrollButton(true);
      Animated.timing(scrollButtonOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scrollButtonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowScrollButton(false));
    }
  }, [userScrolled, scrollButtonOpacity]);

  // Detect user scroll
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y >= contentSize.height - layoutMeasurement.height - 50;
    setUserScrolled(!isAtBottom);
  }, []);

  // Scroll to bottom button handler
  const scrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
    setUserScrolled(false);
  }, []);

  return (
    <View style={[styles.container, maxHeight && { maxHeight }]}>
      {/* Execution indicator */}
      {isExecuting && (
        <View style={styles.executionBar}>
          <View style={styles.executionDot} />
          <Text style={styles.executionText}>Executing...</Text>
        </View>
      )}

      {/* Terminal output */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
      >
        {lines.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No terminal output yet</Text>
            <Text style={styles.emptySubtext}>Command output will appear here</Text>
          </View>
        ) : (
          lines.map((line, index) => (
            <TerminalLineComponent
              key={line.id}
              line={line}
              showTimestamp={showTimestamps}
              lineNumber={showLineNumbers ? index + 1 : undefined}
            />
          ))
        )}
      </ScrollView>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Animated.View
          style={[
            styles.scrollButton,
            { opacity: scrollButtonOpacity },
          ]}
        >
          <TouchableOpacity
            style={styles.scrollButtonInner}
            onPress={scrollToBottom}
            activeOpacity={0.7}
          >
            <Text style={styles.scrollButtonText}>↓</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    position: 'relative',
  },
  executionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#252525',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  executionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#50fa7b',
    marginRight: 8,
  },
  executionText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 11,
    color: '#50fa7b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 14,
    color: '#6272a4',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 12,
    color: '#44475a',
  },
  scrollButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  scrollButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#50fa7b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollButtonText: {
    fontSize: 20,
    color: '#1e1e1e',
    fontWeight: '600',
  },
});
