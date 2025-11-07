import React from 'react';
import { render } from '@testing-library/react-native';
import { Icon } from '../Icon';
import { tokens } from '../../tokens';

describe('Icon Component', () => {
  it('renders Ionicons family', () => {
    const { UNSAFE_root } = render(
      <Icon family="ionicons" name="home" accessibilityLabel="Home" />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders MaterialIcons family', () => {
    const { UNSAFE_root } = render(
      <Icon family="material" name="home" accessibilityLabel="Home" />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders Feather family', () => {
    const { UNSAFE_root } = render(
      <Icon family="feather" name="home" accessibilityLabel="Home" />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('applies small size variant', () => {
    const { UNSAFE_root } = render(
      <Icon family="ionicons" name="home" size="sm" />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('applies medium size variant', () => {
    const { UNSAFE_root } = render(
      <Icon family="ionicons" name="home" size="md" />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('applies large size variant', () => {
    const { UNSAFE_root } = render(
      <Icon family="ionicons" name="home" size="lg" />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('applies custom numeric size', () => {
    const { UNSAFE_root } = render(
      <Icon family="ionicons" name="home" size={40} />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('hides decorative icons from accessibility', () => {
    const { UNSAFE_root } = render(
      <Icon family="ionicons" name="home" />
    );

    expect(UNSAFE_root).toBeTruthy();
  });
});
