// Authentication Helper Functions
// Reusable auth flows for E2E tests

import { element, by, waitFor } from 'detox';

export const loginUser = async (email: string, password: string) => {
  await element(by.id('login-button')).tap();
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  await element(by.id('login-submit')).tap();

  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(5000);
};

export const signupUser = async (
  email: string,
  password: string,
  confirmPassword?: string
) => {
  await element(by.id('signup-button')).tap();
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  await element(by.id('confirm-password-input')).typeText(
    confirmPassword || password
  );
  await element(by.id('signup-submit')).tap();

  await waitFor(element(by.id('verify-email-screen')))
    .toBeVisible()
    .withTimeout(5000);
};

export const logoutUser = async () => {
  await element(by.id('profile-tab')).tap();
  await element(by.id('logout-button')).tap();

  await waitFor(element(by.id('auth-screen')))
    .toBeVisible()
    .withTimeout(3000);
};

export const skipOnboarding = async () => {
  try {
    const skipButton = element(by.id('skip-onboarding-button'));
    await waitFor(skipButton).toBeVisible().withTimeout(2000);
    await skipButton.tap();
  } catch (error) {
    // Onboarding already completed or not shown
  }
};

export const completeOnboarding = async () => {
  for (let i = 0; i < 4; i++) {
    try {
      const nextButton = element(by.id('onboarding-next-button'));
      await waitFor(nextButton).toBeVisible().withTimeout(2000);
      await nextButton.tap();
    } catch (error) {
      break;
    }
  }
};
