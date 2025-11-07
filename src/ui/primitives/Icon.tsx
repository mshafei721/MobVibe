import React from 'react';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { tokens } from '../tokens';

export interface IconProps {
  family: 'ionicons' | 'material' | 'feather';
  name: string;
  size?: 'sm' | 'md' | 'lg' | number;
  color?: string;
  accessibilityLabel?: string;
}

const iconSizes: Record<'sm' | 'md' | 'lg', number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

export const Icon: React.FC<IconProps> = ({
  family,
  name,
  size = 'md',
  color,
  accessibilityLabel,
}) => {
  const sizeValue = typeof size === 'number' ? size : iconSizes[size];
  const colorValue = color || tokens.colors.neutral[900];

  const iconProps = {
    name: name as any,
    size: sizeValue,
    color: colorValue,
    ...(accessibilityLabel
      ? { accessibilityLabel }
      : { accessibilityElementsHidden: true, importantForAccessibility: 'no' as const }),
  };

  switch (family) {
    case 'ionicons':
      return <Ionicons {...iconProps} />;
    case 'material':
      return <MaterialIcons {...iconProps} />;
    case 'feather':
      return <Feather {...iconProps} />;
    default:
      return <Ionicons {...iconProps} />;
  }
};
