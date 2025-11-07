import React from 'react';
import { Platform } from 'react-native';
import { Box } from '../adapters';
import type { BoxProps } from '../adapters/types';
import { tokens } from '../tokens';

export interface DividerProps extends Omit<BoxProps, 'style'> {
  orientation?: 'horizontal' | 'vertical';
  spacing?: number;
  color?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  spacing = 2,
  color,
  ...rest
}) => {
  const isHorizontal = orientation === 'horizontal';

  const dividerStyle = {
    ...(isHorizontal
      ? {
          height: 1,
          width: '100%' as const,
          marginVertical: tokens.spacing[spacing as keyof typeof tokens.spacing] || tokens.spacing[2],
        }
      : {
          width: 1,
          height: '100%' as const,
          marginHorizontal: tokens.spacing[spacing as keyof typeof tokens.spacing] || tokens.spacing[2],
        }),
    backgroundColor: color || tokens.colors.neutral[200],
  };

  return (
    <Box
      style={dividerStyle}
      accessibilityElementsHidden={true}
      importantForAccessibility="no"
      {...rest}
    />
  );
};
