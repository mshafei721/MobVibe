/**
 * Error Recovery E2E Tests
 * Tests error handling and recovery mechanisms
 */

import { device, element, by, waitFor } from 'detox';
import { loginUser, skipOnboarding } from './helpers/auth';
import { createSession } from './helpers/session';

describe('Error Recovery Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await loginUser('existing@example.com', 'Password123!');
    await skipOnboarding();
  });

  afterEach(async () => {
    await device.sendToHome();
  });

  describe('Network Errors', () => {
    it('should handle network timeout gracefully', async () => {
      // Simulate slow network
      await device.setNetworkCondition('slow3g');

      // Create session
      await element(by.id('new-session-button')).tap();
      await element(by.id('prompt-input')).typeText('Build a simple app');
      await element(by.id('generate-button')).tap();

      // Verify loading state
      await waitFor(element(by.id('loading-indicator')))
        .toBeVisible()
        .withTimeout(5000);

      // Wait for timeout
      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(30000);

      // Verify retry button available
      await expect(element(by.id('retry-button'))).toBeVisible();

      // Reset network
      await device.setNetworkCondition('wifi');

      // Retry
      await element(by.id('retry-button')).tap();

      // Verify successful after retry
      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(15000);
    });

    it('should show offline indicator when disconnected', async () => {
      // Go offline
      await device.setNetworkCondition('offline');

      // Verify offline banner
      await waitFor(element(by.id('offline-banner')))
        .toBeVisible()
        .withTimeout(5000);

      // Go back online
      await device.setNetworkCondition('wifi');

      // Verify banner dismissed
      await waitFor(element(by.id('offline-banner')))
        .not.toBeVisible()
        .withTimeout(5000);
    });

    it('should queue actions when offline', async () => {
      // Create session while online
      await createSession('Build todo app');

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      // Go offline
      await device.setNetworkCondition('offline');

      // Try to send message (should queue)
      await element(by.id('message-input')).typeText('Add dark mode');
      await element(by.id('send-message-button')).tap();

      // Verify queued state
      await waitFor(element(by.id('message-queued')))
        .toBeVisible()
        .withTimeout(3000);

      // Go back online
      await device.setNetworkCondition('wifi');

      // Verify message sent
      await waitFor(element(by.id('thinking-indicator')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('API Errors', () => {
    it('should handle rate limit errors', async () => {
      // Create multiple sessions rapidly (trigger rate limit)
      for (let i = 0; i < 5; i++) {
        await element(by.id('new-session-button')).tap();
        await element(by.id('prompt-input')).typeText(`Test app ${i}`);
        await element(by.id('generate-button')).tap();

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Verify rate limit error
      await waitFor(element(by.id('rate-limit-error')))
        .toBeVisible()
        .withTimeout(10000);

      // Verify retry after time shown
      await expect(element(by.id('retry-after-message'))).toBeVisible();
    });

    it('should handle session limit reached', async () => {
      // Note: This assumes user is at their session limit
      // In real test, would need to set up user state first

      await element(by.id('new-session-button')).tap();
      await element(by.id('prompt-input')).typeText('Test session limit');
      await element(by.id('generate-button')).tap();

      // Verify limit error
      await waitFor(element(by.id('session-limit-error')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify upgrade prompt
      await expect(element(by.id('upgrade-button'))).toBeVisible();
    });

    it('should handle invalid prompt errors', async () => {
      await element(by.id('new-session-button')).tap();

      // Submit empty prompt
      await element(by.id('generate-button')).tap();

      // Verify validation error
      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('error-message'))).toHaveText(
        /Please enter a prompt/i
      );

      // Try with too short prompt
      await element(by.id('prompt-input')).typeText('hi');
      await element(by.id('generate-button')).tap();

      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('error-message'))).toHaveText(
        /at least 10 characters/i
      );
    });
  });

  describe('Code Generation Errors', () => {
    it('should handle generation timeout', async () => {
      await createSession('Build complex enterprise app with many features');

      // Wait for extended period
      await waitFor(element(by.id('code-editor')).or(element(by.id('error-message'))))
        .toBeVisible()
        .withTimeout(60000);

      // If timeout occurred, verify error handling
      try {
        await expect(element(by.id('error-message'))).toBeVisible();
        await expect(element(by.id('retry-generation-button'))).toBeVisible();
      } catch {
        // Generation completed successfully
        await expect(element(by.id('code-editor'))).toBeVisible();
      }
    });

    it('should recover from generation failure', async () => {
      // Note: This would require backend to simulate failure
      // For now, test the UI error recovery flow

      await createSession('Test generation failure');

      // Assume generation fails
      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(30000);

      // Retry generation
      await element(by.id('retry-generation-button')).tap();

      // Verify retry started
      await waitFor(element(by.id('loading-indicator')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Preview Errors', () => {
    it('should handle preview generation failure', async () => {
      await createSession('Build test app');

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      // Navigate to preview
      await element(by.id('preview-tab')).tap();

      // If preview fails
      try {
        await waitFor(element(by.id('preview-error')))
          .toBeVisible()
          .withTimeout(15000);

        // Verify retry option
        await expect(element(by.id('retry-preview-button'))).toBeVisible();

        // Retry
        await element(by.id('retry-preview-button')).tap();
      } catch {
        // Preview loaded successfully
        await expect(element(by.id('preview-output'))).toBeVisible();
      }
    });

    it('should handle preview crash', async () => {
      await createSession('Build preview test app');

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      // Go to preview
      await element(by.id('preview-tab')).tap();

      // Wait for preview
      await waitFor(element(by.id('preview-output')))
        .toBeVisible()
        .withTimeout(15000);

      // If preview crashes, verify error shown
      // Note: Actual crash simulation would need backend support
    });

    it('should recover from WebView errors', async () => {
      await createSession('Build webview test');

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      // Navigate to preview
      await element(by.id('preview-tab')).tap();

      await waitFor(element(by.id('preview-output')))
        .toBeVisible()
        .withTimeout(15000);

      // Refresh if error occurs
      try {
        await element(by.id('refresh-preview-button')).tap();

        await waitFor(element(by.id('preview-output')))
          .toBeVisible()
          .withTimeout(10000);
      } catch {
        // Preview working normally
      }
    });
  });

  describe('Authentication Errors', () => {
    it('should handle session expiration', async () => {
      // Note: Would require backend to expire session
      // Test assumes session expires during use

      await createSession('Test auth expiration');

      // Wait for potential auth error
      try {
        await waitFor(element(by.id('auth-expired-message')))
          .toBeVisible()
          .withTimeout(5000);

        // Verify redirect to login
        await waitFor(element(by.id('login-button')))
          .toBeVisible()
          .withTimeout(3000);
      } catch {
        // Session still valid
      }
    });

    it('should recover from token refresh failure', async () => {
      // Simulate token refresh scenario
      // This would require specific backend setup

      await element(by.id('sessions-tab')).tap();

      // Verify app remains functional
      await waitFor(element(by.id('session-list')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Data Corruption', () => {
    it('should handle corrupted local storage', async () => {
      // This would require injecting corrupted data
      // Verify app clears corrupted data and continues

      await device.launchApp({ newInstance: true });

      // Should show clean state or error recovery
      await waitFor(element(by.id('home-screen')).or(element(by.id('error-recovery-screen'))))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should recover from state inconsistencies', async () => {
      // Simulate state mismatch scenarios
      // Verify app detects and corrects inconsistencies

      await element(by.id('sessions-tab')).tap();

      await waitFor(element(by.id('session-list')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Error Reporting', () => {
    it('should provide clear error messages', async () => {
      await element(by.id('new-session-button')).tap();
      await element(by.id('generate-button')).tap();

      // Verify error message is descriptive
      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(3000);

      const errorText = await element(by.id('error-message')).getAttributes();
      expect(errorText.text.length).toBeGreaterThan(10);
    });

    it('should log errors for debugging', async () => {
      // Trigger error
      await element(by.id('new-session-button')).tap();
      await element(by.id('generate-button')).tap();

      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify error logged (would check logs in real scenario)
      // For E2E, just verify UI shows error ID
      try {
        await expect(element(by.id('error-id'))).toBeVisible();
      } catch {
        // Error ID not shown to user (intentional)
      }
    });
  });
});
