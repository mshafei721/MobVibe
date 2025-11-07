import React from 'react';
import { render } from '@testing-library/react-native';
import { Spinner } from '../Spinner';
import { tokens } from '../../tokens';

describe('Spinner Component', () => {
  it('renders with default size (md)', () => {
    const { getByAccessibilityLabel } = render(
      <Spinner accessibilityLabel="Loading" />
    );

    expect(getByAccessibilityLabel('Loading')).toBeTruthy();
  });

  it('renders small size variant', () => {
    const { getByAccessibilityLabel } = render(
      <Spinner size="sm" accessibilityLabel="Loading" />
    );

    expect(getByAccessibilityLabel('Loading')).toBeTruthy();
  });

  it('renders medium size variant', () => {
    const { getByAccessibilityLabel } = render(
      <Spinner size="md" accessibilityLabel="Loading" />
    );

    expect(getByAccessibilityLabel('Loading')).toBeTruthy();
  });

  it('renders large size variant', () => {
    const { getByAccessibilityLabel } = render(
      <Spinner size="lg" accessibilityLabel="Loading" />
    );

    expect(getByAccessibilityLabel('Loading')).toBeTruthy();
  });

  it('uses custom color', () => {
    const customColor = '#FF0000';
    const { UNSAFE_getByType } = render(
      <Spinner color={customColor} accessibilityLabel="Loading" />
    );
    const activityIndicator = UNSAFE_getByType(require('react-native').ActivityIndicator);

    expect(activityIndicator.props.color).toBe(customColor);
  });

  it('uses token color by default', () => {
    const { UNSAFE_getByType } = render(<Spinner accessibilityLabel="Loading" />);
    const activityIndicator = UNSAFE_getByType(require('react-native').ActivityIndicator);

    expect(activityIndicator.props.color).toBe(tokens.colors.primary[500]);
  });

  it('has accessibilityLiveRegion="polite"', () => {
    const { getByAccessibilityLabel } = render(
      <Spinner accessibilityLabel="Loading" />
    );
    const container = getByAccessibilityLabel('Loading');

    expect(container.props.accessibilityLiveRegion).toBe('polite');
  });

  it('has accessibilityState.busy=true', () => {
    const { getByAccessibilityLabel } = render(
      <Spinner accessibilityLabel="Loading" />
    );
    const container = getByAccessibilityLabel('Loading');

    expect(container.props.accessibilityState.busy).toBe(true);
  });
});
