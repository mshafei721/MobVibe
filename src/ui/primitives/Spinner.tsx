import React from 'react';
import { ActivityIndicatorProps } from 'react-native';
import { Box, ActivityIndicator } from '../adapters';
import { tokens } from '../tokens';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  accessibilityLabel: string;
}

const spinnerSizes: Record<'sm' | 'md' | 'lg', number> = {
  sm: 16,
  md: 32,
  lg: 48,
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color,
  accessibilityLabel,
}) => {
  const sizeValue = spinnerSizes[size];

  return (
    <Box
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
    >
      <ActivityIndicator
        size={sizeValue as ActivityIndicatorProps['size']}
        color={color || tokens.colors.primary[500]}
      />
    </Box>
  );
};
