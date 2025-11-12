/**
 * Animation Utilities
 *
 * Helper functions for animations, haptic feedback, and gesture handling
 */

import { Platform, AccessibilityInfo } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { runOnJS } from 'react-native-reanimated';

/**
 * Haptic feedback types
 */
export enum HapticType {
  Selection = 'selection',
  ImpactLight = 'impactLight',
  ImpactMedium = 'impactMedium',
  ImpactHeavy = 'impactHeavy',
  NotificationSuccess = 'notificationSuccess',
  NotificationWarning = 'notificationWarning',
  NotificationError = 'notificationError',
}

/**
 * Trigger haptic feedback
 * Platform-specific implementation
 */
export const triggerHaptic = (type: HapticType = HapticType.Selection) => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    };

    ReactNativeHapticFeedback.trigger(type, options);
  }
};

/**
 * Trigger haptic feedback from Reanimated worklet
 * Use this for gestures and animations
 */
export const triggerHapticWorklet = (type: HapticType = HapticType.Selection) => {
  'worklet';
  runOnJS(triggerHaptic)(type);
};

/**
 * Check if user has reduced motion preference
 * Returns boolean for accessibility
 */
export const isReducedMotionEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
};

/**
 * Get animation duration based on reduced motion preference
 * Returns 0 if reduced motion is enabled
 */
export const getAccessibleDuration = async (defaultDuration: number): Promise<number> => {
  const reducedMotion = await isReducedMotionEnabled();
  return reducedMotion ? 0 : defaultDuration;
};

/**
 * Clamp value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

/**
 * Interpolate value from input range to output range
 */
export const interpolate = (
  value: number,
  inputRange: [number, number],
  outputRange: [number, number],
  extrapolate?: 'clamp' | 'extend'
): number => {
  'worklet';
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;

  const ratio = (value - inputMin) / (inputMax - inputMin);
  let result = outputMin + ratio * (outputMax - outputMin);

  if (extrapolate === 'clamp') {
    result = clamp(result, Math.min(outputMin, outputMax), Math.max(outputMin, outputMax));
  }

  return result;
};

/**
 * Calculate velocity for gesture animations
 */
export const calculateVelocity = (
  distance: number,
  duration: number
): number => {
  'worklet';
  return distance / duration;
};

/**
 * Determine if gesture should trigger action based on velocity
 */
export const shouldTriggerAction = (
  velocity: number,
  threshold: number
): boolean => {
  'worklet';
  return Math.abs(velocity) > threshold;
};

/**
 * Get spring animation config based on gesture velocity
 * Higher velocity = bouncier spring
 */
export const getSpringConfig = (velocity: number) => {
  'worklet';
  const normalizedVelocity = Math.abs(velocity) / 1000;

  return {
    damping: 15 - normalizedVelocity * 5,
    stiffness: 150 + normalizedVelocity * 50,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  };
};

/**
 * Easing functions for custom animations
 */
export const EasingFunctions = {
  /**
   * Ease out quad
   */
  easeOutQuad: (t: number): number => {
    'worklet';
    return t * (2 - t);
  },

  /**
   * Ease in quad
   */
  easeInQuad: (t: number): number => {
    'worklet';
    return t * t;
  },

  /**
   * Ease in out quad
   */
  easeInOutQuad: (t: number): number => {
    'worklet';
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },

  /**
   * Ease out cubic
   */
  easeOutCubic: (t: number): number => {
    'worklet';
    return --t * t * t + 1;
  },

  /**
   * Elastic ease out (bounce effect)
   */
  easeOutElastic: (t: number): number => {
    'worklet';
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
  },

  /**
   * Bounce ease out
   */
  easeOutBounce: (t: number): number => {
    'worklet';
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
};

/**
 * Stagger animation delay calculator
 * Creates cascading animation effect
 */
export const getStaggerDelay = (index: number, baseDelay: number = 50): number => {
  return index * baseDelay;
};

/**
 * Calculate parallax offset for scroll animations
 */
export const calculateParallax = (
  scrollY: number,
  speed: number = 0.5
): number => {
  'worklet';
  return scrollY * speed;
};

/**
 * Format animation duration for display
 */
export const formatDuration = (ms: number): string => {
  return `${ms}ms`;
};

/**
 * Check if animation is complete based on threshold
 */
export const isAnimationComplete = (
  currentValue: number,
  targetValue: number,
  threshold: number = 0.01
): boolean => {
  'worklet';
  return Math.abs(currentValue - targetValue) < threshold;
};

/**
 * Debounce animation trigger
 * Prevents rapid animation triggers
 */
export const debounceAnimation = (() => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (callback: () => void, delay: number = 300) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(callback, delay);
  };
})();

/**
 * Throttle animation trigger
 * Limits animation frequency
 */
export const throttleAnimation = (() => {
  let lastCall = 0;

  return (callback: () => void, limit: number = 100) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      callback();
    }
  };
})();

/**
 * Create smooth scroll animation config
 */
export const getSmoothScrollConfig = (duration: number = 300) => ({
  animated: true,
  duration,
});

/**
 * Platform-specific animation adjustments
 */
export const getPlatformAnimationConfig = (config: {
  ios?: any;
  android?: any;
  default: any;
}) => {
  if (Platform.OS === 'ios' && config.ios) {
    return { ...config.default, ...config.ios };
  }
  if (Platform.OS === 'android' && config.android) {
    return { ...config.default, ...config.android };
  }
  return config.default;
};
