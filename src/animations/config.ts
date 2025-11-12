/**
 * Animation Configuration
 *
 * Centralized animation settings for consistent timing, easing, and durations
 * across the MobVibe application. All animations use native driver for 60fps performance.
 */

export const AnimationConfig = {
  /**
   * Animation durations in milliseconds
   */
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 800,
  },

  /**
   * Animation easing functions
   */
  easing: {
    // Spring animations (preferred for interactive elements)
    spring: {
      damping: 15,
      mass: 1,
      stiffness: 150,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    },
    springGentle: {
      damping: 20,
      mass: 1,
      stiffness: 120,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    },
    springBouncy: {
      damping: 12,
      mass: 1,
      stiffness: 180,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    },
  },

  /**
   * Scale values for press animations
   */
  scale: {
    press: 0.96,
    pressSmall: 0.98,
    pressLarge: 0.94,
    hover: 1.02,
  },

  /**
   * Opacity values for fade animations
   */
  opacity: {
    visible: 1,
    hidden: 0,
    subtle: 0.6,
    disabled: 0.4,
  },

  /**
   * Transform values
   */
  transform: {
    slideDistance: 20,
    slideDistanceLarge: 40,
  },

  /**
   * Gesture thresholds
   */
  gesture: {
    swipeVelocity: 500,
    swipeDistance: 50,
    longPressDelay: 500,
  },
} as const;

/**
 * Animation presets for common scenarios
 */
export const AnimationPresets = {
  /**
   * Button press animation
   * Scales down with haptic feedback
   */
  buttonPress: {
    duration: AnimationConfig.duration.fast,
    scale: AnimationConfig.scale.press,
    useNativeDriver: true,
  },

  /**
   * Card press animation
   * Gentle scale with shadow
   */
  cardPress: {
    duration: AnimationConfig.duration.normal,
    scale: AnimationConfig.scale.pressSmall,
    useNativeDriver: true,
  },

  /**
   * Fade in animation
   * Smooth opacity transition
   */
  fadeIn: {
    duration: AnimationConfig.duration.normal,
    from: AnimationConfig.opacity.hidden,
    to: AnimationConfig.opacity.visible,
    useNativeDriver: true,
  },

  /**
   * Fade out animation
   */
  fadeOut: {
    duration: AnimationConfig.duration.fast,
    from: AnimationConfig.opacity.visible,
    to: AnimationConfig.opacity.hidden,
    useNativeDriver: true,
  },

  /**
   * Slide in from bottom
   * Common for modals and sheets
   */
  slideInBottom: {
    duration: AnimationConfig.duration.normal,
    distance: AnimationConfig.transform.slideDistanceLarge,
    useNativeDriver: true,
  },

  /**
   * Slide out to bottom
   */
  slideOutBottom: {
    duration: AnimationConfig.duration.fast,
    distance: AnimationConfig.transform.slideDistanceLarge,
    useNativeDriver: true,
  },

  /**
   * Scale in animation
   * Zoom effect for appearing elements
   */
  scaleIn: {
    duration: AnimationConfig.duration.normal,
    from: 0.8,
    to: 1,
    useNativeDriver: true,
  },

  /**
   * Scale out animation
   */
  scaleOut: {
    duration: AnimationConfig.duration.fast,
    from: 1,
    to: 0.8,
    useNativeDriver: true,
  },

  /**
   * Toast notification animation
   * Slide in from top with fade
   */
  toast: {
    duration: AnimationConfig.duration.normal,
    slideDistance: AnimationConfig.transform.slideDistance,
    useNativeDriver: true,
  },

  /**
   * Loading skeleton pulse
   * Continuous opacity animation
   */
  skeletonPulse: {
    duration: 1200,
    from: AnimationConfig.opacity.subtle,
    to: 1,
    useNativeDriver: true,
  },
} as const;

/**
 * Platform-specific animation configurations
 */
export const PlatformAnimationConfig = {
  /**
   * iOS-specific timing (follows iOS design guidelines)
   */
  ios: {
    modalPresentation: {
      duration: 350,
      useNativeDriver: true,
    },
    navigationTransition: {
      duration: 350,
      useNativeDriver: true,
    },
  },

  /**
   * Android-specific timing (Material Design)
   */
  android: {
    modalPresentation: {
      duration: 300,
      useNativeDriver: true,
    },
    navigationTransition: {
      duration: 300,
      useNativeDriver: true,
    },
  },
} as const;

/**
 * Accessibility-aware animation configuration
 * Respects user's motion preferences
 */
export const getAccessibleAnimationConfig = (reducedMotion: boolean) => {
  if (reducedMotion) {
    return {
      duration: 0,
      useNativeDriver: true,
    };
  }
  return AnimationConfig;
};
