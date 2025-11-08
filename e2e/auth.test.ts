// Authentication Flow E2E Tests
// DEFERRED: Tests will execute when mobile app is implemented

import { device, element, by, waitFor } from 'detox';
import { loginUser, signupUser, logoutUser, skipOnboarding } from './helpers/auth';

describe('Authentication Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterEach(async () => {
    await device.sendToHome();
  });

  describe('Signup Flow', () => {
    it('should complete signup with valid credentials', async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'Password123!';

      await signupUser(testEmail, testPassword);

      // Verify email verification screen displayed
      await waitFor(element(by.id('verify-email-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.id('verification-message'))).toHaveText(
        /Check your email/i
      );
    });

    it('should show error for invalid email', async () => {
      await element(by.id('signup-button')).tap();
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.id('password-input')).typeText('Password123!');
      await element(by.id('confirm-password-input')).typeText('Password123!');
      await element(by.id('signup-submit')).tap();

      // Verify error message
      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(2000);

      await expect(element(by.id('error-message'))).toHaveText(
        /Please enter a valid email/i
      );
    });

    it('should show error for weak password', async () => {
      await element(by.id('signup-button')).tap();
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('weak');
      await element(by.id('confirm-password-input')).typeText('weak');
      await element(by.id('signup-submit')).tap();

      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(2000);

      await expect(element(by.id('error-message'))).toHaveText(
        /Password must be at least 8 characters/i
      );
    });

    it('should show error for mismatched passwords', async () => {
      await element(by.id('signup-button')).tap();
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('Password123!');
      await element(by.id('confirm-password-input')).typeText('Different123!');
      await element(by.id('signup-submit')).tap();

      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(2000);

      await expect(element(by.id('error-message'))).toHaveText(
        /Passwords do not match/i
      );
    });
  });

  describe('Login Flow', () => {
    it('should login with valid credentials', async () => {
      const testEmail = 'existing@example.com';
      const testPassword = 'Password123!';

      await loginUser(testEmail, testPassword);

      // Verify home screen displayed
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Skip onboarding if shown
      await skipOnboarding();

      // Verify sessions loaded
      await waitFor(element(by.id('session-list')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should show error for invalid credentials', async () => {
      await element(by.id('login-button')).tap();
      await element(by.id('email-input')).typeText('wrong@example.com');
      await element(by.id('password-input')).typeText('WrongPassword123!');
      await element(by.id('login-submit')).tap();

      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('error-message'))).toHaveText(
        /Invalid email or password/i
      );
    });

    it('should restore session after login', async () => {
      await loginUser('existing@example.com', 'Password123!');
      await skipOnboarding();

      // Verify user data loaded
      await waitFor(element(by.id('user-profile-name')))
        .toBeVisible()
        .withTimeout(3000);

      await waitFor(element(by.id('session-list')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Logout Flow', () => {
    beforeEach(async () => {
      await loginUser('existing@example.com', 'Password123!');
      await skipOnboarding();
    });

    it('should logout and redirect to auth screen', async () => {
      await logoutUser();

      // Verify redirected to auth screen
      await waitFor(element(by.id('auth-screen')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('login-button'))).toBeVisible();
      await expect(element(by.id('signup-button'))).toBeVisible();
    });

    it('should clear session data after logout', async () => {
      await logoutUser();

      // Login again
      await loginUser('existing@example.com', 'Password123!');
      await skipOnboarding();

      // Verify session restored (not cached from previous session)
      await waitFor(element(by.id('session-list')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Password Reset Flow', () => {
    it('should request password reset', async () => {
      await element(by.id('login-button')).tap();
      await element(by.id('forgot-password-link')).tap();

      await element(by.id('reset-email-input')).typeText('test@example.com');
      await element(by.id('reset-submit')).tap();

      // Verify confirmation message
      await waitFor(element(by.id('reset-confirmation')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('reset-confirmation'))).toHaveText(
        /Check your email for reset instructions/i
      );
    });
  });
});
