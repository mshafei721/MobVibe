import React, { useState, useRef } from 'react';
import {
  Animated,
  Platform,
  KeyboardTypeOptions,
} from 'react-native';
import { Box, TextInput, Pressable } from '../adapters';
import { tokens } from '../tokens';
import { Text } from './Text';

export interface InputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  type?: 'text' | 'email' | 'password';
  error?: string;
  disabled?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  type = 'text',
  error,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  autoFocus = false,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const labelPosition = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(labelPosition, {
      toValue: 1,
      duration: tokens.motion.duration.fast,
      useNativeDriver: false,
    }).start();
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(labelPosition, {
        toValue: 0,
        duration: tokens.motion.duration.fast,
        useNativeDriver: false,
      }).start();
    }
    onBlur?.();
  };

  const handleClear = () => {
    onChangeText('');
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getKeyboardType = (): KeyboardTypeOptions => {
    switch (type) {
      case 'email':
        return 'email-address';
      default:
        return 'default';
    }
  };

  const borderColor = error
    ? tokens.colors.error[500]
    : isFocused
    ? tokens.colors.primary[500]
    : tokens.colors.border.base;

  const labelTop = labelPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [16, -8],
  });

  const labelFontSize = labelPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [tokens.typography.fontSize.base, tokens.typography.fontSize.sm],
  });

  const showClearButton = value && type !== 'password' && !disabled;
  const showPasswordToggle = type === 'password';

  return (
    <Box style={{ marginBottom: tokens.spacing[4] }}>
      <Box
        style={{
          position: 'relative',
          borderWidth: 1,
          borderColor,
          borderRadius: tokens.spacing.borderRadius.md,
          backgroundColor: disabled
            ? tokens.colors.surface[1]
            : tokens.colors.background.base,
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left: tokens.spacing[3],
            top: labelTop,
            backgroundColor: tokens.colors.background.base,
            paddingHorizontal: tokens.spacing[1],
            zIndex: 1,
          }}
        >
          <Animated.Text
            style={{
              fontSize: labelFontSize,
              color: error
                ? tokens.colors.error[500]
                : isFocused
                ? tokens.colors.primary[500]
                : tokens.colors.text.secondary,
              fontWeight: tokens.typography.fontWeight.medium as any,
            }}
          >
            {label}
          </Animated.Text>
        </Animated.View>

        <TextInput
          style={{
            height: 48,
            paddingHorizontal: tokens.spacing[3],
            paddingTop: tokens.spacing[3],
            paddingBottom: tokens.spacing[2],
            paddingRight: showClearButton || showPasswordToggle ? tokens.spacing[12] : tokens.spacing[3],
            fontSize: tokens.typography.fontSize.base,
            fontFamily: tokens.typography.fontFamily.sans,
            color: tokens.colors.text.primary,
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.text.tertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          secureTextEntry={type === 'password' && !isPasswordVisible}
          keyboardType={getKeyboardType()}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoCorrect={type === 'email' ? false : true}
          autoFocus={autoFocus}
          accessible={true}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled }}
          {...(error && {
            accessibilityDescribedBy: `${accessibilityLabel}-error`,
          })}
        />

        {showClearButton && (
          <Pressable
            style={{
              position: 'absolute',
              right: tokens.spacing[3],
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              width: 44,
              height: 44,
              alignSelf: 'center',
            }}
            onPress={handleClear}
            accessible={true}
            accessibilityLabel="Clear input"
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 18, color: tokens.colors.text.secondary }}>✕</Text>
          </Pressable>
        )}

        {showPasswordToggle && (
          <Pressable
            style={{
              position: 'absolute',
              right: tokens.spacing[3],
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              width: 44,
              height: 44,
              alignSelf: 'center',
            }}
            onPress={togglePasswordVisibility}
            accessible={true}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            accessibilityLiveRegion="polite"
          >
            <Text style={{ fontSize: 18 }}>{isPasswordVisible ? '👁️' : '🔒'}</Text>
          </Pressable>
        )}
      </Box>

      {error && (
        <Box
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: tokens.spacing[1],
          }}
          nativeID={`${accessibilityLabel}-error`}
        >
          <Text style={{ fontSize: 14, marginRight: 4 }}>⚠️</Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: tokens.colors.error[500],
            }}
          >
            {error}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default Input;
