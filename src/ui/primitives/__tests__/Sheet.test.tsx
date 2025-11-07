import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Sheet } from '../Sheet';

describe('Sheet Component', () => {
  it('shows when visible=true', () => {
    const { getByAccessibilityLabel } = render(
      <Sheet visible={true} onClose={() => {}} accessibilityLabel="Test Sheet">
        <Text>Sheet Content</Text>
      </Sheet>
    );

    expect(getByAccessibilityLabel('Test Sheet')).toBeTruthy();
  });

  it('hides when visible=false', () => {
    const { queryByAccessibilityLabel } = render(
      <Sheet visible={false} onClose={() => {}} accessibilityLabel="Test Sheet">
        <Text>Sheet Content</Text>
      </Sheet>
    );

    expect(queryByAccessibilityLabel('Test Sheet')).toBeNull();
  });

  it('calls onClose when backdrop pressed', () => {
    const mockOnClose = jest.fn();
    const { getByAccessibilityLabel } = render(
      <Sheet visible={true} onClose={mockOnClose} accessibilityLabel="Test Sheet">
        <Text>Sheet Content</Text>
      </Sheet>
    );

    const backdrop = getByAccessibilityLabel('Close sheet');
    fireEvent.press(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <Sheet visible={true} onClose={() => {}} accessibilityLabel="Test Sheet">
        <Text>Sheet Content</Text>
      </Sheet>
    );

    expect(getByText('Sheet Content')).toBeTruthy();
  });

  it('has backdrop with button role', () => {
    const { getByRole } = render(
      <Sheet visible={true} onClose={() => {}} accessibilityLabel="Test Sheet">
        <Text>Sheet Content</Text>
      </Sheet>
    );

    expect(getByRole('button')).toBeTruthy();
  });

  it('backdrop has close label', () => {
    const { getByAccessibilityLabel } = render(
      <Sheet visible={true} onClose={() => {}} accessibilityLabel="Test Sheet">
        <Text>Sheet Content</Text>
      </Sheet>
    );

    expect(getByAccessibilityLabel('Close sheet')).toBeTruthy();
  });

  it('content has provided accessibilityLabel', () => {
    const { getByAccessibilityLabel } = render(
      <Sheet visible={true} onClose={() => {}} accessibilityLabel="Filter Options">
        <Text>Sheet Content</Text>
      </Sheet>
    );

    expect(getByAccessibilityLabel('Filter Options')).toBeTruthy();
  });

  it('uses Modal component', () => {
    const { UNSAFE_getByType } = render(
      <Sheet visible={true} onClose={() => {}} accessibilityLabel="Test Sheet">
        <Text>Sheet Content</Text>
      </Sheet>
    );

    const modal = UNSAFE_getByType(require('react-native').Modal);
    expect(modal).toBeTruthy();
  });
});
