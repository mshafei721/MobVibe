import React from 'react';
import { Platform, ViewStyle } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Pressable } from '../adapters';
import { tokens } from '../tokens';
import { Text } from './Text';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  children,
  fullWidth = false,
}) => {
  const variantStyles: Record<string, ViewStyle & { textColor: string }> = {
    primary: {
      backgroundColor: tokens.colors.primary[500],
      borderWidth: 0,
      borderColor: 'transparent',
      textColor: '#FFFFFF',
    },
    secondary: {
      backgroundColor: tokens.colors.secondary[500],
      borderWidth: 0,
      borderColor: 'transparent',
      textColor: '#FFFFFF',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: tokens.colors.primary[500],
      textColor: tokens.colors.primary[500],
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderColor: 'transparent',
      textColor: tokens.colors.primary[500],
    },
  };

  const sizeStyles: Record<string, ViewStyle & { fontSize: number }> = {
    sm: {
      minHeight: Platform.OS === 'ios' ? 32 : 36,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      fontSize: tokens.typography.fontSize.sm,
    },
    md: {
      minHeight: Platform.OS === 'ios' ? 44 : 48,
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      fontSize: tokens.typography.fontSize.base,
    },
    lg: {
      minHeight: Platform.OS === 'ios' ? 56 : 60,
      paddingHorizontal: tokens.spacing[6],
      paddingVertical: tokens.spacing[4],
      fontSize: tokens.typography.fontSize.lg,
    },
  };

  const handlePress = () => {
    if (!disabled) {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
      onPress();
    }
  };

  const textTransform = Platform.select({
    ios: 'capitalize' as const,
    android: 'uppercase' as const,
    default: 'none' as const,
  });

  return (
    <Pressable
      style={[
        {
          borderRadius: tokens.spacing.borderRadius.md,
          alignItems: 'center',
          justifyContent: 'center',
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...(fullWidth && { width: '100%' }),
          ...(disabled && { opacity: 0.5 }),
        },
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      activeOpacity={0.8}
    >
      <Text
        style={{
          color: variantStyles[variant].textColor,
          fontSize: sizeStyles[size].fontSize,
          fontWeight: tokens.typography.fontWeight.semibold as any,
          textTransform,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
};

export default Button;
