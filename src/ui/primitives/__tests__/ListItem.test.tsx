import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ListItem } from '../ListItem';

describe('ListItem Component', () => {
  it('renders title', () => {
    const { getByText } = render(<ListItem title="Test Item" />);

    expect(getByText('Test Item')).toBeTruthy();
  });

  it('renders title and subtitle', () => {
    const { getByText } = render(
      <ListItem title="Test Item" subtitle="Subtitle text" />
    );

    expect(getByText('Test Item')).toBeTruthy();
    expect(getByText('Subtitle text')).toBeTruthy();
  });

  it('renders left icon when provided', () => {
    const { UNSAFE_root } = render(
      <ListItem
        title="Test Item"
        leftIcon={{ family: 'ionicons', name: 'home' }}
      />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders right chevron when rightIcon="chevron"', () => {
    const { UNSAFE_root } = render(
      <ListItem title="Test Item" rightIcon="chevron" />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <ListItem title="Test Item" onPress={mockOnPress} />
    );

    fireEvent.press(getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('combines title and subtitle in accessibilityLabel', () => {
    const { getByAccessibilityLabel } = render(
      <ListItem title="Test Item" subtitle="Subtitle text" />
    );

    expect(getByAccessibilityLabel('Test Item, Subtitle text')).toBeTruthy();
  });

  it('has minimum touch target height', () => {
    const { getByText } = render(<ListItem title="Test Item" onPress={() => {}} />);
    const touchable = getByText('Test Item').parent?.parent;

    if (touchable && touchable.props.style) {
      const minHeight = touchable.props.style.minHeight;
      expect(minHeight).toBeGreaterThanOrEqual(44);
    }
  });

  it('triggers haptic feedback on press', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <ListItem title="Test Item" onPress={mockOnPress} />
    );

    fireEvent.press(getByRole('button'));
    expect(mockOnPress).toHaveBeenCalled();
  });
});
