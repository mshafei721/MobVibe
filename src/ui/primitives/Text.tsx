import React from 'react';
import { Platform, TextProps as RNTextProps } from 'react-native';
import { Text as AdapterText } from '../adapters';
import { tokens } from '../tokens';

export interface TextProps extends Omit<RNTextProps, 'style'> {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'code';
  color?: string;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color,
  weight,
  align,
  numberOfLines,
  accessibilityRole,
  children,
  ...rest
}) => {
  const variantStyles = {
    h1: {
      fontSize: tokens.typography.fontSize['4xl'],
      fontWeight: tokens.typography.fontWeight.bold as RNTextProps['fontWeight'],
      lineHeight: tokens.typography.fontSize['4xl'] * tokens.typography.lineHeight.tight,
    },
    h2: {
      fontSize: tokens.typography.fontSize['3xl'],
      fontWeight: tokens.typography.fontWeight.bold as RNTextProps['fontWeight'],
      lineHeight: tokens.typography.fontSize['3xl'] * tokens.typography.lineHeight.tight,
    },
    h3: {
      fontSize: tokens.typography.fontSize['2xl'],
      fontWeight: tokens.typography.fontWeight.semibold as RNTextProps['fontWeight'],
      lineHeight: tokens.typography.fontSize['2xl'] * tokens.typography.lineHeight.tight,
    },
    body: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.normal as RNTextProps['fontWeight'],
      lineHeight: tokens.typography.fontSize.base * tokens.typography.lineHeight.normal,
    },
    caption: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.normal as RNTextProps['fontWeight'],
      lineHeight: tokens.typography.fontSize.sm * tokens.typography.lineHeight.normal,
    },
    code: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.normal as RNTextProps['fontWeight'],
      lineHeight: tokens.typography.fontSize.sm * tokens.typography.lineHeight.normal,
      fontFamily: tokens.typography.fontFamily.mono,
      backgroundColor: tokens.colors.surface[1],
      paddingHorizontal: tokens.spacing[1],
      paddingVertical: tokens.spacing[1] / 2,
    },
  };

  const fontWeightStyles = weight
    ? { fontWeight: tokens.typography.fontWeight[weight] as RNTextProps['fontWeight'] }
    : {};

  const colorStyle = color || (variant === 'caption' ? tokens.colors.text.secondary : tokens.colors.text.primary);

  const alignStyle = align ? { textAlign: align as RNTextProps['textAlign'] } : {};

  const role = variant.startsWith('h') ? 'header' : 'text';

  return (
    <AdapterText
      style={[
        {
          fontFamily: tokens.typography.fontFamily.sans,
          ...variantStyles[variant],
          ...fontWeightStyles,
          ...alignStyle,
          color: colorStyle,
        },
      ]}
      numberOfLines={numberOfLines}
      accessibilityRole={accessibilityRole || (role as RNTextProps['accessibilityRole'])}
      allowFontScaling={true}
      maxFontSizeMultiplier={2}
      {...rest}
    >
      {children}
    </AdapterText>
  );
};

export default Text;
