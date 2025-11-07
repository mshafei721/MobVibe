import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

describe('Input Component', () => {
  it('renders label and value correctly', () => {
    const { getByDisplayValue, getByText } = render(
      <Input
        label="Email"
        value="test@example.com"
        onChangeText={() => {}}
        accessibilityLabel="Email input"
      />
    );
    expect(getByDisplayValue('test@example.com')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const mockOnChange = jest.fn();
    const { getByAccessibilityLabel } = render(
      <Input
        label="Name"
        value=""
        onChangeText={mockOnChange}
        accessibilityLabel="Name input"
      />
    );

    const input = getByAccessibilityLabel('Name input');
    fireEvent.changeText(input, 'John Doe');
    expect(mockOnChange).toHaveBeenCalledWith('John Doe');
  });

  it('shows error message when error prop is provided', () => {
    const { getByText } = render(
      <Input
        label="Email"
        value=""
        onChangeText={() => {}}
        error="This field is required"
        accessibilityLabel="Email input"
      />
    );
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('toggles password visibility', () => {
    const { getByAccessibilityLabel, getByDisplayValue } = render(
      <Input
        label="Password"
        type="password"
        value="secret123"
        onChangeText={() => {}}
        accessibilityLabel="Password input"
      />
    );

    const input = getByDisplayValue('secret123');
    const toggle = getByAccessibilityLabel('Show password');

    expect(input.props.secureTextEntry).toBe(true);

    fireEvent.press(toggle);
    expect(input.props.secureTextEntry).toBe(false);
  });

  it('shows clear button for non-password inputs with value', () => {
    const mockOnChange = jest.fn();
    const { getByAccessibilityLabel, queryByAccessibilityLabel } = render(
      <Input
        label="Name"
        value="John"
        onChangeText={mockOnChange}
        accessibilityLabel="Name input"
      />
    );

    const clearButton = getByAccessibilityLabel('Clear input');
    expect(clearButton).toBeTruthy();

    fireEvent.press(clearButton);
    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('does not show clear button for password inputs', () => {
    const { queryByAccessibilityLabel } = render(
      <Input
        label="Password"
        type="password"
        value="secret"
        onChangeText={() => {}}
        accessibilityLabel="Password input"
      />
    );

    expect(queryByAccessibilityLabel('Clear input')).toBeNull();
  });

  it('sets correct keyboard type for email', () => {
    const { getByAccessibilityLabel } = render(
      <Input
        label="Email"
        type="email"
        value=""
        onChangeText={() => {}}
        accessibilityLabel="Email input"
      />
    );

    const input = getByAccessibilityLabel('Email input');
    expect(input.props.keyboardType).toBe('email-address');
    expect(input.props.autoCapitalize).toBe('none');
    expect(input.props.autoCorrect).toBe(false);
  });

  it('disables input when disabled prop is true', () => {
    const { getByAccessibilityLabel } = render(
      <Input
        label="Name"
        value="John"
        onChangeText={() => {}}
        disabled
        accessibilityLabel="Name input"
      />
    );

    const input = getByAccessibilityLabel('Name input');
    expect(input.props.editable).toBe(false);
    expect(input.props.accessibilityState.disabled).toBe(true);
  });

  it('links error message with input via accessibilityDescribedBy', () => {
    const { getByAccessibilityLabel } = render(
      <Input
        label="Email"
        value=""
        onChangeText={() => {}}
        error="Invalid email"
        accessibilityLabel="Email input"
      />
    );

    const input = getByAccessibilityLabel('Email input');
    expect(input.props.accessibilityDescribedBy).toBe('Email input-error');
  });
});
