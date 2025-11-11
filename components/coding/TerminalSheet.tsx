import React, { useState, useMemo } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import { Text } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';
import { useTerminalOutput } from '@/src/hooks/useTerminalOutput';
import { TerminalOutput } from './TerminalOutput';
import { TerminalControls } from './TerminalControls';
import { stripAnsi } from '@/utils/ansiParser';
import Clipboard from '@react-native-clipboard/clipboard';

interface TerminalSheetProps {
  sessionId?: string;
  isVisible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SNAP_POINT_LOW = SCREEN_HEIGHT * 0.4;
const SNAP_POINT_HIGH = SCREEN_HEIGHT * 0.8;

export function TerminalSheet({
  sessionId,
  isVisible,
  onClose,
}: TerminalSheetProps) {
  const { lines, isExecuting, clearTerminal } = useTerminalOutput(sessionId);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [height, setHeight] = useState(SNAP_POINT_LOW);

  const pan = React.useRef(new Animated.Value(0)).current;

  // Filter lines if showing errors only
  const displayLines = useMemo(() => {
    if (showErrorsOnly) {
      return lines.filter(line => line.type === 'stderr');
    }
    return lines;
  }, [lines, showErrorsOnly]);

  const errorCount = useMemo(() => {
    return lines.filter(line => line.type === 'stderr').length;
  }, [lines]);

  // Pan responder for height adjustment
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          const newHeight = height - gestureState.dy;
          if (newHeight >= SNAP_POINT_LOW && newHeight <= SNAP_POINT_HIGH) {
            pan.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const newHeight = height - gestureState.dy;

          // Snap to nearest point
          if (newHeight < (SNAP_POINT_LOW + SNAP_POINT_HIGH) / 2) {
            setHeight(SNAP_POINT_LOW);
          } else {
            setHeight(SNAP_POINT_HIGH);
          }

          pan.setValue(0);
        },
      }),
    [height, pan]
  );

  const handleCopy = () => {
    const text = displayLines.map(l => stripAnsi(l.content)).join('\n');
    Clipboard.setString(text);
    // TODO: Show toast notification
  };

  const handleToggleHeight = () => {
    setHeight(h => h === SNAP_POINT_LOW ? SNAP_POINT_HIGH : SNAP_POINT_LOW);
  };

  if (!sessionId) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              height,
              transform: [{ translateY: pan }],
            },
          ]}
        >
          {/* Handle bar for dragging */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.heightToggle}
              onPress={handleToggleHeight}
              activeOpacity={0.7}
            >
              <Text style={styles.headerTitle}>Terminal</Text>
              <Text style={styles.heightIcon}>
                {height === SNAP_POINT_LOW ? '⬆' : '⬇'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Controls */}
          <TerminalControls
            onClear={clearTerminal}
            onCopy={handleCopy}
            showTimestamps={showTimestamps}
            onToggleTimestamps={() => setShowTimestamps(!showTimestamps)}
            isExecuting={isExecuting}
            lineCount={displayLines.length}
            errorCount={errorCount}
            showErrorsOnly={showErrorsOnly}
            onToggleErrorsOnly={() => setShowErrorsOnly(!showErrorsOnly)}
          />

          {/* Terminal output */}
          <TerminalOutput
            lines={displayLines}
            isExecuting={isExecuting}
            showTimestamps={showTimestamps}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#252525',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6272a4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#252525',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  heightToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 16,
    fontWeight: '600',
    color: '#f8f8f2',
  },
  heightIcon: {
    fontSize: 14,
    color: '#8be9fd',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#44475a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#f8f8f2',
    fontWeight: '600',
  },
});
