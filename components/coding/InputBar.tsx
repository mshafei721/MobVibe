import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_CHARS = 2000;
const MAX_LINES = 5;
const LINE_HEIGHT = 20;
const MIN_HEIGHT = 50;

export function InputBar({ onSend, disabled = false, placeholder = 'Type your message...' }: InputBarProps) {
  const [text, setText] = useState('');
  const [height, setHeight] = useState(MIN_HEIGHT);
  const inputRef = useRef<TextInput>(null);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSend = text.trim().length > 0 && !disabled && !isOverLimit;

  const handleSend = async () => {
    if (!canSend) return;

    // Haptic feedback
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onSend(text.trim());
    setText('');
    setHeight(MIN_HEIGHT);
  };

  const handleContentSizeChange = (event: any) => {
    const contentHeight = event.nativeEvent.contentSize.height;
    const maxHeight = LINE_HEIGHT * MAX_LINES + 20; // 20px for padding
    const newHeight = Math.min(Math.max(MIN_HEIGHT, contentHeight + 20), maxHeight);
    setHeight(newHeight);
  };

  return (
    <View style={styles.container}>
      {/* Character counter - only show when approaching limit */}
      {charCount > MAX_CHARS * 0.8 && (
        <View style={styles.counterContainer}>
          <Text
            variant="caption"
            color={isOverLimit ? tokens.colors.error[500] : tokens.colors.text.tertiary}
          >
            {charCount}/{MAX_CHARS}
          </Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { height: Math.max(MIN_HEIGHT, height) },
            disabled && styles.inputDisabled,
          ]}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.text.tertiary}
          multiline
          maxLength={MAX_CHARS}
          editable={!disabled}
          onContentSizeChange={handleContentSizeChange}
          textAlignVertical="top"
          returnKeyType="default"
          blurOnSubmit={false}
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={[
            styles.sendButton,
            canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
          ]}
        >
          <Text
            variant="body"
            color={canSend ? tokens.colors.text.inverse : tokens.colors.text.disabled}
            weight="semibold"
          >
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background.base,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.subtle,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
  },
  counterContainer: {
    alignItems: 'flex-end',
    marginBottom: tokens.spacing[1],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: tokens.spacing[2],
  },
  input: {
    flex: 1,
    backgroundColor: tokens.colors.surface[1],
    borderRadius: tokens.spacing.borderRadius.md,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[3],
    fontSize: tokens.typography.fontSize.base,
    fontFamily: tokens.typography.fontFamily.sans,
    color: tokens.colors.text.primary,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
    lineHeight: LINE_HEIGHT,
  },
  inputDisabled: {
    backgroundColor: tokens.colors.surface[0],
    opacity: 0.5,
  },
  sendButton: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderRadius: tokens.spacing.borderRadius.md,
    minHeight: MIN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: tokens.colors.primary[500],
  },
  sendButtonDisabled: {
    backgroundColor: tokens.colors.surface[2],
  },
});
