import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

describe('Button Component', () => {
  it('renders correctly with children', () => {
    const { getByText } = render(
      <Button onPress={() => {}} accessibilityLabel="Test button">
        Click Me
      </Button>
    );
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Button onPress={mockOnPress} accessibilityLabel="Test button">
        Press Me
      </Button>
    );

    fireEvent.press(getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Button onPress={mockOnPress} disabled accessibilityLabel="Test button">
        Disabled
      </Button>
    );

    fireEvent.press(getByRole('button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('renders all variants correctly', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost'] as const;

    variants.forEach((variant) => {
      const { getByText } = render(
        <Button variant={variant} onPress={() => {}} accessibilityLabel={`${variant} button`}>
          {variant}
        </Button>
      );
      expect(getByText(variant)).toBeTruthy();
    });
  });

  it('renders all sizes correctly', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach((size) => {
      const { getByText } = render(
        <Button size={size} onPress={() => {}} accessibilityLabel={`${size} button`}>
          {size}
        </Button>
      );
      expect(getByText(size)).toBeTruthy();
    });
  });

  it('has proper accessibility props', () => {
    const { getByRole } = render(
      <Button
        onPress={() => {}}
        accessibilityLabel="Submit form"
        accessibilityHint="Saves your changes"
      >
        Submit
      </Button>
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Submit form');
    expect(button.props.accessibilityHint).toBe('Saves your changes');
  });

  it('sets disabled state correctly', () => {
    const { getByRole } = render(
      <Button onPress={() => {}} disabled accessibilityLabel="Disabled button">
        Disabled
      </Button>
    );

    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(button.props.disabled).toBe(true);
  });

  it('applies fullWidth style', () => {
    const { getByRole } = render(
      <Button onPress={() => {}} fullWidth accessibilityLabel="Full width button">
        Full Width
      </Button>
    );

    const button = getByRole('button');
    expect(button.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ width: '100%' })
    ]));
  });
});
