/**
 * Animation System Export
 *
 * Centralized exports for the MobVibe animation system
 */

// Configuration
export { AnimationConfig, AnimationPresets, PlatformAnimationConfig, getAccessibleAnimationConfig } from './config';

// Hooks
export {
  usePressAnimation,
  useFadeIn,
  useSlideAnimation,
  useScaleAnimation,
  useRotationAnimation,
  useSkeletonAnimation,
  useShakeAnimation,
  useBounceAnimation,
  useToastAnimation,
  useProgressAnimation,
} from './hooks';

// Utilities
export {
  HapticType,
  triggerHaptic,
  triggerHapticWorklet,
  isReducedMotionEnabled,
  getAccessibleDuration,
  clamp,
  interpolate,
  calculateVelocity,
  shouldTriggerAction,
  getSpringConfig,
  EasingFunctions,
  getStaggerDelay,
  calculateParallax,
  formatDuration,
  isAnimationComplete,
  debounceAnimation,
  throttleAnimation,
  getSmoothScrollConfig,
  getPlatformAnimationConfig,
} from './utils';
