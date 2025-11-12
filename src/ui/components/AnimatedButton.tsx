/**
 * AnimatedButton Component
 *
 * Button with smooth press animations and haptic feedback
 * Provides delightful micro-interactions for user actions
 */

import React from 'react';
import { Pressable, PressableProps, StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '../primitives';
import { tokens } from '../tokens';
import { usePressAnimation, triggerHaptic, HapticType } from '@/src/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AnimatedButtonProps extends Omit<PressableProps, 'style'> {
  /**
   * Button text content
   */
  children: React.ReactNode;

  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Full width button
   */
  fullWidth?: boolean;

  /**
   * Enable haptic feedback on press
   */
  hapticFeedback?: boolean;

  /**
   * Haptic feedback type
   */
  hapticType?: HapticType;

  /**
   * Custom scale on press
   */
  pressScale?: number;

  /**
   * Additional style
   */
  style?: ViewStyle;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Icon component (left side)
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon component (right side)
   */
  rightIcon?: React.ReactNode;
}

/**
 * AnimatedButton component with press animations and haptic feedback
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  hapticFeedback = true,
  hapticType = HapticType.ImpactLight,
  pressScale,
  style,
  loading = false,
  leftIcon,
  rightIcon,
  onPress,
  onPressIn,
  onPressOut,
  ...pressableProps
}) => {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressAnimation({
    scale: pressScale,
  });

  // Combine press handlers with haptic feedback
  const handlePress = (event: any) => {
    if (hapticFeedback && !disabled && !loading) {
      triggerHaptic(hapticType);
    }
    onPress?.(event);
  };

  const handlePressInInternal = (event: any) => {
    handlePressIn();
    onPressIn?.(event);
  };

  const handlePressOutInternal = (event: any) => {
    handlePressOut();
    onPressOut?.(event);
  };

  // Variant styles
  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: disabled ? tokens.colors.surface[2] : tokens.colors.primary,
    },
    secondary: {
      backgroundColor: disabled ? tokens.colors.surface[2] : tokens.colors.secondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: disabled ? tokens.colors.border.primary : tokens.colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: disabled ? tokens.colors.surface[2] : tokens.colors.error,
    },
  };

  // Size styles
  const sizeStyles: Record<string, ViewStyle> = {
    small: {
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      minHeight: 36,
    },
    medium: {
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      minHeight: 44,
    },
    large: {
      paddingHorizontal: tokens.spacing[6],
      paddingVertical: tokens.spacing[4],
      minHeight: 52,
    },
  };

  // Text color based on variant
  const getTextColor = () => {
    if (disabled) return tokens.colors.text.tertiary;
    if (variant === 'outline' || variant === 'ghost') return tokens.colors.primary;
    return tokens.colors.background.base;
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressInInternal}
      onPressOut={handlePressOutInternal}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      {...pressableProps}
    >
      {leftIcon && <Animated.View style={styles.leftIcon}>{leftIcon}</Animated.View>}

      {typeof children === 'string' ? (
        <Text
          variant="body"
          weight="semibold"
          color={getTextColor()}
          style={styles.buttonText}
        >
          {loading ? 'Loading...' : children}
        </Text>
      ) : (
        children
      )}

      {rightIcon && <Animated.View style={styles.rightIcon}>{rightIcon}</Animated.View>}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.spacing.borderRadius.md,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  buttonText: {
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: tokens.spacing[2],
  },
  rightIcon: {
    marginLeft: tokens.spacing[2],
  },
});

export default AnimatedButton;
