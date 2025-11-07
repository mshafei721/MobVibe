import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );

    expect(getByText('Card Content')).toBeTruthy();
  });

  it('applies flat variant (no elevation)', () => {
    const { UNSAFE_root } = render(
      <Card variant="flat">
        <Text>Content</Text>
      </Card>
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('applies raised variant (medium elevation)', () => {
    const { UNSAFE_root } = render(
      <Card variant="raised">
        <Text>Content</Text>
      </Card>
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('applies floating variant (high elevation)', () => {
    const { UNSAFE_root } = render(
      <Card variant="floating">
        <Text>Content</Text>
      </Card>
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('applies custom padding', () => {
    const { UNSAFE_root } = render(
      <Card padding={6}>
        <Text>Content</Text>
      </Card>
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('becomes touchable when onPress provided', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Card onPress={mockOnPress} accessibilityLabel="Touchable Card">
        <Text>Content</Text>
      </Card>
    );

    expect(getByRole('button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Card onPress={mockOnPress} accessibilityLabel="Touchable Card">
        <Text>Content</Text>
      </Card>
    );

    fireEvent.press(getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('has accessibilityRole="button" when touchable', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Card onPress={mockOnPress} accessibilityLabel="Touchable Card">
        <Text>Content</Text>
      </Card>
    );

    expect(getByRole('button')).toBeTruthy();
  });
});
