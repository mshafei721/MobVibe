/**
 * Animation Hooks
 *
 * React hooks for common animation patterns using Reanimated 3
 */

import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { AnimationConfig, AnimationPresets } from './config';

/**
 * Hook for press animation (button, card)
 * Returns animated style and handlers
 */
export const usePressAnimation = (config?: {
  scale?: number;
  duration?: number;
}) => {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    pressed.value = true;
    scale.value = withSpring(
      config?.scale ?? AnimationConfig.scale.press,
      AnimationConfig.easing.spring
    );
  };

  const handlePressOut = () => {
    pressed.value = false;
    scale.value = withSpring(1, AnimationConfig.easing.spring);
  };

  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
    pressed,
  };
};

/**
 * Hook for fade animation
 * Automatically animates on mount
 */
export const useFadeIn = (config?: {
  duration?: number;
  delay?: number;
  from?: number;
  to?: number;
}) => {
  const opacity = useSharedValue(config?.from ?? AnimationPresets.fadeIn.from);

  useEffect(() => {
    opacity.value = withTiming(
      config?.to ?? AnimationPresets.fadeIn.to,
      {
        duration: config?.duration ?? AnimationPresets.fadeIn.duration,
        easing: Easing.out(Easing.ease),
      }
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { animatedStyle, opacity };
};

/**
 * Hook for slide animation
 * Slide in from bottom, top, left, or right
 */
export const useSlideAnimation = (config: {
  direction?: 'bottom' | 'top' | 'left' | 'right';
  distance?: number;
  duration?: number;
  delay?: number;
}) => {
  const { direction = 'bottom', distance = AnimationConfig.transform.slideDistanceLarge } = config;

  const translateX = useSharedValue(direction === 'left' ? -distance : direction === 'right' ? distance : 0);
  const translateY = useSharedValue(direction === 'top' ? -distance : direction === 'bottom' ? distance : 0);

  useEffect(() => {
    translateX.value = withTiming(0, {
      duration: config.duration ?? AnimationConfig.duration.normal,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: config.duration ?? AnimationConfig.duration.normal,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return { animatedStyle, translateX, translateY };
};

/**
 * Hook for scale animation
 * Zoom in/out effect
 */
export const useScaleAnimation = (config?: {
  from?: number;
  to?: number;
  duration?: number;
  delay?: number;
}) => {
  const scale = useSharedValue(config?.from ?? 0.8);

  useEffect(() => {
    scale.value = withSpring(
      config?.to ?? 1,
      AnimationConfig.easing.springGentle
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, scale };
};

/**
 * Hook for rotation animation
 * Continuous rotation for loading indicators
 */
export const useRotationAnimation = (config?: {
  duration?: number;
  continuous?: boolean;
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (config?.continuous ?? true) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: config?.duration ?? 1000,
          easing: Easing.linear,
        }),
        -1, // Infinite repeat
        false
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return { animatedStyle, rotation };
};

/**
 * Hook for skeleton/shimmer loading animation
 * Pulsing opacity effect
 */
export const useSkeletonAnimation = () => {
  const opacity = useSharedValue(AnimationPresets.skeletonPulse.from);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(AnimationPresets.skeletonPulse.to, {
        duration: AnimationPresets.skeletonPulse.duration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Infinite repeat
      true // Reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { animatedStyle, opacity };
};

/**
 * Hook for shake animation
 * Error feedback animation
 */
export const useShakeAnimation = () => {
  const translateX = useSharedValue(0);

  const shake = () => {
    translateX.value = withRepeat(
      withTiming(10, {
        duration: 50,
        easing: Easing.linear,
      }),
      6, // Shake 6 times
      true // Reverse
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { animatedStyle, shake };
};

/**
 * Hook for bounce animation
 * Attention-grabbing effect
 */
export const useBounceAnimation = (config?: {
  delay?: number;
  continuous?: boolean;
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (config?.continuous) {
      scale.value = withRepeat(
        withSpring(1.1, AnimationConfig.easing.springBouncy),
        -1, // Infinite
        true // Reverse
      );
    }
  }, []);

  const bounce = () => {
    scale.value = withSpring(1.1, AnimationConfig.easing.springBouncy);
    setTimeout(() => {
      scale.value = withSpring(1, AnimationConfig.easing.springBouncy);
    }, 200);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, bounce };
};

/**
 * Hook for toast notification animation
 * Slide in from top with fade
 */
export const useToastAnimation = (visible: boolean) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Slide in
      translateY.value = withSpring(0, AnimationConfig.easing.spring);
      opacity.value = withTiming(1, {
        duration: AnimationConfig.duration.fast,
      });
    } else {
      // Slide out
      translateY.value = withTiming(-100, {
        duration: AnimationConfig.duration.fast,
      });
      opacity.value = withTiming(0, {
        duration: AnimationConfig.duration.fast,
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return { animatedStyle };
};

/**
 * Hook for progress bar animation
 * Smooth progress indicator
 */
export const useProgressAnimation = (progress: number) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress, {
      duration: AnimationConfig.duration.normal,
      easing: Easing.out(Easing.ease),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return { animatedStyle, width };
};
