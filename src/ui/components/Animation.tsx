import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';
import type { AnimationObject } from 'lottie-react-native';

/**
 * Animation Component
 *
 * Centralized wrapper for Lottie animations with built-in accessibility support,
 * dynamic theming via color filters, and consistent styling.
 *
 * Features:
 * - Respects user's reduced motion preference
 * - Color filters for dynamic theming
 * - Aspect ratio control
 * - Auto-play and loop control
 *
 * @example
 * import { Animation } from '@/ui/adapters';
 * import { tokens } from '@/ui/tokens';
 *
 * <Animation
 *   source={require('@/assets/animations/loading.json')}
 *   autoPlay
 *   loop
 *   colorFilters={[
 *     { keypath: 'loader', color: tokens.colors.primary[500] }
 *   ]}
 * />
 */

export interface AnimationColorFilter {
  keypath: string;
  color: string;
}

export interface AnimationProps {
  /** Animation source (JSON object or require path) */
  source: AnimationObject | string | number;
  /** Auto-play animation when mounted (respects reduced motion) */
  autoPlay?: boolean;
  /** Loop animation indefinitely (respects reduced motion) */
  loop?: boolean;
  /** Custom style for container */
  style?: ViewStyle;
  /** Color filters for dynamic theming */
  colorFilters?: AnimationColorFilter[];
  /** Callback when animation completes */
  onAnimationFinish?: () => void;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Animation speed (1 = normal, 2 = 2x speed, etc.) */
  speed?: number;
}

export const Animation: React.FC<AnimationProps> = ({
  source,
  autoPlay = true,
  loop = false,
  style,
  colorFilters,
  onAnimationFinish,
  accessibilityLabel,
  speed = 1,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check user's reduced motion preference
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setPrefersReducedMotion(enabled);
    });

    // Listen for changes to reduced motion preference
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setPrefersReducedMotion(enabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // When reduced motion is enabled:
  // - Don't auto-play
  // - Don't loop
  // - Show first frame only
  const shouldAutoPlay = !prefersReducedMotion && autoPlay;
  const shouldLoop = !prefersReducedMotion && loop;

  return (
    <LottieView
      source={source}
      autoPlay={shouldAutoPlay}
      loop={shouldLoop}
      style={[styles.animation, style]}
      colorFilters={colorFilters}
      onAnimationFinish={onAnimationFinish}
      speed={speed}
      // Accessibility
      accessible
      accessibilityLabel={
        accessibilityLabel ||
        (prefersReducedMotion ? 'Static animation image' : 'Animated image')
      }
      accessibilityRole="image"
    />
  );
};

const styles = StyleSheet.create({
  animation: {
    width: 100,
    height: 100,
  },
});
