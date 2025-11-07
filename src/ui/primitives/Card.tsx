import React from 'react';
import { ViewStyle, Platform } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Box, Pressable } from '../adapters';
import { tokens } from '../tokens';

export interface CardProps {
  variant?: 'flat' | 'raised' | 'floating';
  padding?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  children: React.ReactNode;
}

const getElevationStyle = (variant: 'flat' | 'raised' | 'floating'): ViewStyle => {
  const elevations = {
    flat: 0,
    raised: 4,
    floating: 8,
  };

  const elevation = elevations[variant];

  if (elevation === 0) {
    return Platform.select({
      ios: {},
      android: { elevation: 0 },
      default: {},
    }) as ViewStyle;
  }

  return Platform.select({
    ios: {
      shadowColor: tokens.colors.neutral[900],
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: 0.1 + elevation / 100,
      shadowRadius: elevation,
    },
    android: {
      elevation,
    },
    default: {},
  }) as ViewStyle;
};

export const Card: React.FC<CardProps> = ({
  variant = 'raised',
  padding = 4,
  onPress,
  accessibilityLabel,
  children,
}) => {
  const baseStyles: ViewStyle = {
    backgroundColor: tokens.colors.background.base,
    borderRadius: tokens.spacing.borderRadius.lg,
    padding: tokens.spacing[padding as keyof typeof tokens.spacing] || tokens.spacing[4],
    ...getElevationStyle(variant),
  };

  const handlePress = () => {
    if (onPress) {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
      onPress();
    }
  };

  if (onPress) {
    return (
      <Pressable
        style={baseStyles}
        onPress={handlePress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        activeOpacity={0.8}
      >
        {children}
      </Pressable>
    );
  }

  return <Box style={baseStyles}>{children}</Box>;
};
