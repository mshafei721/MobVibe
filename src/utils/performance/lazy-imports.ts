// Lazy Import Utilities for Code Splitting
// DEFERRED: Will be used when mobile app components are implemented

import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Lazy load a component with retry logic for network failures.
 * @param importFn - Dynamic import function
 * @param retries - Number of retry attempts (default: 3)
 * @returns Lazy-loaded component
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries: number = 3
): LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (attemptsLeft: number) => {
        importFn()
          .then(resolve)
          .catch((error) => {
            if (attemptsLeft === 1) {
              reject(error);
              return;
            }

            console.warn(`Import failed, retrying... (${attemptsLeft - 1} attempts left)`);

            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, retries - attemptsLeft) * 1000;

            setTimeout(() => {
              attemptImport(attemptsLeft - 1);
            }, delay);
          });
      };

      attemptImport(retries);
    });
  });
}

/**
 * Lazy load a component with preload capability.
 * @param importFn - Dynamic import function
 * @returns Object with lazy component and preload function
 */
export function lazyWithPreload<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): {
  Component: LazyExoticComponent<T>;
  preload: () => Promise<void>;
} {
  let componentPromise: Promise<{ default: T }> | null = null;

  const Component = lazy(() => {
    if (!componentPromise) {
      componentPromise = importFn();
    }
    return componentPromise;
  });

  const preload = async (): Promise<void> => {
    if (!componentPromise) {
      componentPromise = importFn();
    }
    await componentPromise;
  };

  return { Component, preload };
}

// ==================================================
// HEAVY COMPONENTS - Loaded on demand
// ==================================================

/**
 * Code editor component (syntax highlighting, large library)
 * Load when user opens a session with code
 */
export const CodeEditor = lazyWithRetry(
  () => import('@/components/CodeEditor/CodeEditor')
);

/**
 * Preview sandbox component (WebView, resource-intensive)
 * Load when user runs preview
 */
export const PreviewSandbox = lazyWithRetry(
  () => import('@/components/PreviewSandbox/PreviewSandbox')
);

/**
 * Settings screen (rarely used, many components)
 * Load when user navigates to settings
 */
export const SettingsScreen = lazyWithRetry(
  () => import('@/screens/SettingsScreen/SettingsScreen')
);

/**
 * Profile screen (user management, form components)
 * Load when user navigates to profile
 */
export const ProfileScreen = lazyWithRetry(
  () => import('@/screens/ProfileScreen/ProfileScreen')
);

/**
 * Onboarding flow (one-time use, large)
 * Load for new users only
 */
export const OnboardingFlow = lazyWithRetry(
  () => import('@/components/Onboarding/OnboardingFlow')
);

// ==================================================
// HEAVY LIBRARIES - Loaded conditionally
// ==================================================

/**
 * Syntax highlighter library (large, only needed for code display)
 * @returns Prism syntax highlighter
 */
export const loadSyntaxHighlighter = () => {
  return import('react-syntax-highlighter').then((mod) => mod.Prism);
};

/**
 * Chart library (only needed for analytics/stats)
 * @returns LineChart component
 */
export const loadChartLibrary = () => {
  return import('react-native-chart-kit').then((mod) => mod.LineChart);
};

/**
 * Markdown renderer (only needed for help/docs)
 * @returns Markdown component
 */
export const loadMarkdownRenderer = () => {
  return import('react-native-markdown-display').then((mod) => mod.default);
};

/**
 * Date picker library (only needed for filtering/scheduling)
 * @returns DatePicker component
 */
export const loadDatePicker = () => {
  return import('react-native-date-picker').then((mod) => mod.default);
};

/**
 * Image picker library (only needed for profile/icon upload)
 * @returns ImagePicker module
 */
export const loadImagePicker = () => {
  return import('expo-image-picker').then((mod) => mod);
};

// ==================================================
// PRELOAD UTILITIES
// ==================================================

/**
 * Preload components likely to be needed soon.
 * Call this during idle time or based on user behavior.
 */
export const preloadComponents = {
  /**
   * Preload components for authenticated users
   */
  async authenticatedUser() {
    // User likely to view code soon
    const { preload: preloadEditor } = lazyWithPreload(
      () => import('@/components/CodeEditor/CodeEditor')
    );
    await preloadEditor();
  },

  /**
   * Preload components for session viewing
   */
  async sessionView() {
    // User likely to run preview
    const { preload: preloadPreview } = lazyWithPreload(
      () => import('@/components/PreviewSandbox/PreviewSandbox')
    );
    await preloadPreview();
  },

  /**
   * Preload components for new users
   */
  async newUser() {
    // New user will see onboarding
    const { preload: preloadOnboarding } = lazyWithPreload(
      () => import('@/components/Onboarding/OnboardingFlow')
    );
    await preloadOnboarding();
  },
};

/**
 * Register component preloading based on navigation.
 * @param screenName - Name of the screen being navigated to
 */
export function preloadForScreen(screenName: string): void {
  switch (screenName) {
    case 'Session':
      preloadComponents.sessionView();
      break;
    case 'Settings':
      lazyWithPreload(() => import('@/screens/SettingsScreen/SettingsScreen')).preload();
      break;
    case 'Profile':
      lazyWithPreload(() => import('@/screens/ProfileScreen/ProfileScreen')).preload();
      break;
    default:
      // No preloading needed
      break;
  }
}

/**
 * Example usage:
 *
 * // In a component
 * const CodeEditor = lazyWithRetry(() => import('@/components/CodeEditor'));
 *
 * // With preloading
 * const { Component: SettingsScreen, preload } = lazyWithPreload(
 *   () => import('@/screens/SettingsScreen')
 * );
 *
 * // Preload when user hovers settings button
 * <Pressable onPressIn={() => preload()}>
 *   <Text>Settings</Text>
 * </Pressable>
 *
 * // Render when needed
 * <Suspense fallback={<LoadingSpinner />}>
 *   <SettingsScreen />
 * </Suspense>
 */
