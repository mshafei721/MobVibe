import React from 'react';
import { render } from '@testing-library/react-native';
import { Divider } from '../Divider';
import { tokens } from '../../tokens';

describe('Divider Component', () => {
  it('renders horizontal divider by default', () => {
    const { getByTestId } = render(<Divider testID="divider" />);
    const divider = getByTestId('divider');

    expect(divider.props.style).toMatchObject({
      height: 1,
      width: '100%',
    });
  });

  it('renders vertical divider when orientation is vertical', () => {
    const { getByTestId } = render(
      <Divider orientation="vertical" testID="divider" />
    );
    const divider = getByTestId('divider');

    expect(divider.props.style).toMatchObject({
      width: 1,
      height: '100%',
    });
  });

  it('applies custom color', () => {
    const customColor = '#FF0000';
    const { getByTestId } = render(
      <Divider color={customColor} testID="divider" />
    );
    const divider = getByTestId('divider');

    expect(divider.props.style.backgroundColor).toBe(customColor);
  });

  it('applies custom spacing', () => {
    const { getByTestId } = render(<Divider spacing={4} testID="divider" />);
    const divider = getByTestId('divider');

    expect(divider.props.style.marginVertical).toBe(tokens.spacing[4]);
  });

  it('is hidden from accessibility tree on iOS', () => {
    const { getByTestId } = render(<Divider testID="divider" />);
    const divider = getByTestId('divider');

    expect(divider.props.accessibilityElementsHidden).toBe(true);
  });

  it('is hidden from accessibility tree on Android', () => {
    const { getByTestId } = render(<Divider testID="divider" />);
    const divider = getByTestId('divider');

    expect(divider.props.importantForAccessibility).toBe('no');
  });

  it('uses token color by default', () => {
    const { getByTestId } = render(<Divider testID="divider" />);
    const divider = getByTestId('divider');

    expect(divider.props.style.backgroundColor).toBe(tokens.colors.neutral[200]);
  });

  it('uses token spacing by default', () => {
    const { getByTestId } = render(<Divider testID="divider" />);
    const divider = getByTestId('divider');

    expect(divider.props.style.marginVertical).toBe(tokens.spacing[2]);
  });
});
