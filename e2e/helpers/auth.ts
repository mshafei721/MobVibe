/**
 * Authentication Helper Functions for E2E Tests
 * Reusable utilities for auth flows
 */

import { device, element, by, waitFor } from 'detox';

// Default test config
const testConfig = {
  defaultTimeout: 5000,
  longTimeout: 10000,
  testUsers: {
    existing: {
      email: 'existing@example.com',
      password: 'Password123!',
    },
  },
};

/**
 * Log in an existing user
 */
export const loginUser = async (
  email: string = testConfig.testUsers.existing.email,
  password: string = testConfig.testUsers.existing.password
) => {
  console.log('[Auth Helper] Logging in user:', email);

  await element(by.id('login-button')).tap();
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  await element(by.id('login-submit')).tap();

  // Wait for home screen
  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(testConfig.longTimeout);
};

/**
 * Sign up a new user
 */
export const signupUser = async (
  email: string,
  password: string,
  confirmPassword?: string
) => {
  console.log('[Auth Helper] Signing up user:', email);

  await element(by.id('signup-button')).tap();
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  await element(by.id('confirm-password-input')).typeText(
    confirmPassword || password
  );
  await element(by.id('signup-submit')).tap();

  // Wait for verification screen
  await waitFor(element(by.id('verify-email-screen')))
    .toBeVisible()
    .withTimeout(testConfig.defaultTimeout);
};

/**
 * Log out the current user
 */
export const logoutUser = async () => {
  console.log('[Auth Helper] Logging out user');

  // Navigate to profile tab
  await element(by.id('profile-tab')).tap();

  // Wait for profile screen
  await waitFor(element(by.id('logout-button')))
    .toBeVisible()
    .withTimeout(testConfig.defaultTimeout);

  // Tap logout
  await element(by.id('logout-button')).tap();

  // Confirm logout if dialog appears
  try {
    const confirmButton = element(by.id('confirm-logout'));
    await waitFor(confirmButton).toBeVisible().withTimeout(2000);
    await confirmButton.tap();
  } catch (error) {
    // No confirmation dialog, continue
  }

  // Wait for auth screen
  await waitFor(element(by.id('auth-screen')))
    .toBeVisible()
    .withTimeout(testConfig.defaultTimeout);
};

/**
 * Skip onboarding screens
 */
export const skipOnboarding = async () => {
  console.log('[Auth Helper] Checking for onboarding');

  try {
    const skipButton = element(by.id('skip-onboarding-button'));
    await waitFor(skipButton).toBeVisible().withTimeout(2000);
    await skipButton.tap();
    console.log('[Auth Helper] Onboarding skipped');
  } catch (error) {
    // No onboarding shown
    console.log('[Auth Helper] No onboarding to skip');
  }
};

/**
 * Complete onboarding flow
 */
export const completeOnboarding = async () => {
  console.log('[Auth Helper] Completing onboarding');

  for (let i = 0; i < 4; i++) {
    try {
      const nextButton = element(by.id('onboarding-next-button'));
      await waitFor(nextButton).toBeVisible().withTimeout(2000);
      await nextButton.tap();
    } catch (error) {
      break;
    }
  }
  console.log('[Auth Helper] Onboarding completed');
};

/**
 * Navigate to specific tab
 */
export const navigateToTab = async (tabId: string) => {
  console.log('[Auth Helper] Navigating to tab:', tabId);
  await element(by.id(`${tabId}-tab`)).tap();
  await waitFor(element(by.id(`${tabId}-screen`)))
    .toBeVisible()
    .withTimeout(testConfig.defaultTimeout);
};

/**
 * Clear app data and restart
 */
export const clearAppData = async () => {
  console.log('[Auth Helper] Clearing app data');
  await device.launchApp({ delete: true });
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string) => {
  console.log('[Auth Helper] Requesting password reset for:', email);

  await element(by.id('login-button')).tap();
  await element(by.id('forgot-password-link')).tap();
  await element(by.id('reset-email-input')).typeText(email);
  await element(by.id('reset-submit')).tap();

  // Wait for confirmation
  await waitFor(element(by.id('reset-confirmation')))
    .toBeVisible()
    .withTimeout(testConfig.defaultTimeout);
};
