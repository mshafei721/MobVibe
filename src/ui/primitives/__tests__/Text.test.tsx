import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from '../Text';

describe('Text Component', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<Text>Hello World</Text>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('renders all variants correctly', () => {
    const variants = ['h1', 'h2', 'h3', 'body', 'caption', 'code'] as const;

    variants.forEach((variant) => {
      const { getByText } = render(
        <Text variant={variant}>{variant} text</Text>
      );
      expect(getByText(`${variant} text`)).toBeTruthy();
    });
  });

  it('applies custom color', () => {
    const { getByText } = render(
      <Text color="#FF0000">Colored text</Text>
    );
    const textElement = getByText('Colored text');
    expect(textElement.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ color: '#FF0000' })
    ]));
  });

  it('applies font weight', () => {
    const weights = ['normal', 'medium', 'semibold', 'bold'] as const;

    weights.forEach((weight) => {
      const { getByText } = render(
        <Text weight={weight}>{weight} text</Text>
      );
      expect(getByText(`${weight} text`)).toBeTruthy();
    });
  });

  it('applies text alignment', () => {
    const alignments = ['left', 'center', 'right'] as const;

    alignments.forEach((align) => {
      const { getByText } = render(
        <Text align={align}>{align} text</Text>
      );
      const textElement = getByText(`${align} text`);
      expect(textElement.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ textAlign: align })
      ]));
    });
  });

  it('limits number of lines', () => {
    const { getByText } = render(
      <Text numberOfLines={2}>Long text that should be truncated</Text>
    );
    const textElement = getByText('Long text that should be truncated');
    expect(textElement.props.numberOfLines).toBe(2);
  });

  it('sets header role for h1-h3 variants', () => {
    const { getByText } = render(<Text variant="h1">Heading</Text>);
    const textElement = getByText('Heading');
    expect(textElement.props.accessibilityRole).toBe('header');
  });

  it('sets text role for body variants', () => {
    const { getByText } = render(<Text variant="body">Body text</Text>);
    const textElement = getByText('Body text');
    expect(textElement.props.accessibilityRole).toBe('text');
  });

  it('enables font scaling by default', () => {
    const { getByText } = render(<Text>Scalable text</Text>);
    const textElement = getByText('Scalable text');
    expect(textElement.props.allowFontScaling).toBe(true);
    expect(textElement.props.maxFontSizeMultiplier).toBe(2);
  });
});
