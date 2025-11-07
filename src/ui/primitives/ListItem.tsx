import React from 'react';
import { Platform } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Box, Pressable } from '../adapters';
import { Text } from './Text';
import { Icon } from './Icon';
import { tokens } from '../tokens';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: {
    family: 'ionicons' | 'material' | 'feather';
    name: string;
  };
  rightIcon?: 'chevron' | 'none';
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon = 'none',
  onPress,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const handlePress = () => {
    if (onPress) {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
      onPress();
    }
  };

  const combinedLabel = accessibilityLabel || `${title}${subtitle ? `, ${subtitle}` : ''}`;

  return (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: Platform.OS === 'ios' ? 44 : 48,
        paddingHorizontal: tokens.spacing[4],
        paddingVertical: tokens.spacing[2],
        gap: tokens.spacing[3],
      }}
      onPress={handlePress}
      disabled={!onPress}
      accessible={true}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={combinedLabel}
      accessibilityHint={accessibilityHint}
      activeOpacity={0.8}
    >
      {leftIcon && (
        <Icon
          family={leftIcon.family}
          name={leftIcon.name}
          size="md"
          color={tokens.colors.neutral[600]}
        />
      )}

      <Box style={{ flex: 1 }}>
        <Text variant="body" weight="medium">
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" color={tokens.colors.neutral[600]}>
            {subtitle}
          </Text>
        )}
      </Box>

      {rightIcon === 'chevron' && (
        <Icon
          family="ionicons"
          name="chevron-forward"
          size="sm"
          color={tokens.colors.neutral[400]}
        />
      )}
    </Pressable>
  );
};
