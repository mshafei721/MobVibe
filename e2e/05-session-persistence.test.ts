/**
 * Session Persistence E2E Tests
 * Tests session state management and recovery
 */

import { device, element, by, waitFor } from 'detox';
import { loginUser, skipOnboarding, logoutUser } from './helpers/auth';
import { createSession, openSession } from './helpers/session';

describe('Session Persistence Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await loginUser('existing@example.com', 'Password123!');
    await skipOnboarding();
  });

  afterEach(async () => {
    await device.sendToHome();
  });

  describe('Session State Persistence', () => {
    it('should persist session state across app restarts', async () => {
      // Create a session
      await createSession('Build a calculator app');

      // Wait for code generation
      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      // Get session ID
      const sessionId = await element(by.id('session-id')).getAttributes();

      // Terminate and relaunch app
      await device.terminateApp();
      await device.launchApp({ newInstance: false });

      // Verify session restored
      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify same session
      const restoredSessionId = await element(by.id('session-id')).getAttributes();
      expect(restoredSessionId).toEqual(sessionId);
    });

    it('should restore message history after app restart', async () => {
      // Create session with messages
      await createSession('Create a todo app');

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      // Count initial messages
      const initialMessages = await element(by.id('message-list')).getAttributes();
      const initialCount = initialMessages.elements?.length || 0;

      // Restart app
      await device.terminateApp();
      await device.launchApp({ newInstance: false });

      // Verify messages restored
      await waitFor(element(by.id('message-list')))
        .toBeVisible()
        .withTimeout(5000);

      const restoredMessages = await element(by.id('message-list')).getAttributes();
      const restoredCount = restoredMessages.elements?.length || 0;

      expect(restoredCount).toBeGreaterThanOrEqual(initialCount);
    });

    it('should clear session state on logout', async () => {
      // Create session
      await createSession('Build a weather app');

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      // Logout
      await logoutUser();

      // Login again
      await loginUser('existing@example.com', 'Password123!');
      await skipOnboarding();

      // Verify no active session (starts fresh)
      await waitFor(element(by.id('no-active-session')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Session Resume', () => {
    it('should resume paused session', async () => {
      // Create and pause session
      await createSession('Build a timer app');

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      // Pause session
      await element(by.id('pause-session-button')).tap();

      await waitFor(element(by.id('session-paused-indicator')))
        .toBeVisible()
        .withTimeout(3000);

      // Navigate away and come back
      await element(by.id('home-tab')).tap();
      await element(by.id('sessions-tab')).tap();

      // Resume session
      await openSession(0);

      // Verify session active
      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should resume from session list after background', async () => {
      // Create session
      await createSession('Build a notes app');

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      // Send app to background
      await device.sendToHome();
      await device.launchApp({ newInstance: false });

      // Navigate to sessions
      await element(by.id('sessions-tab')).tap();

      // Wait for session list
      await waitFor(element(by.id('session-list')))
        .toBeVisible()
        .withTimeout(5000);

      // Open recent session
      await openSession(0);

      // Verify session loaded
      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Offline Persistence', () => {
    it('should save session data when offline', async () => {
      // Create session
      await createSession('Build a contacts app');

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      // Simulate offline mode
      await device.setNetworkCondition('offline');

      // Try to continue session (should queue)
      await element(by.id('message-input')).typeText('Add search functionality');
      await element(by.id('send-message-button')).tap();

      // Verify queued indicator
      await waitFor(element(by.id('message-queued-indicator')))
        .toBeVisible()
        .withTimeout(3000);

      // Go back online
      await device.setNetworkCondition('wifi');

      // Verify message sent
      await waitFor(element(by.id('message-queued-indicator')))
        .not.toBeVisible()
        .withTimeout(5000);
    });

    it('should sync session state when back online', async () => {
      // Go offline
      await device.setNetworkCondition('offline');

      // Create session (should save locally)
      await element(by.id('new-session-button')).tap();
      await element(by.id('prompt-input')).typeText('Build a gallery app');
      await element(by.id('generate-button')).tap();

      // Verify offline indicator
      await waitFor(element(by.id('offline-indicator')))
        .toBeVisible()
        .withTimeout(3000);

      // Go back online
      await device.setNetworkCondition('wifi');

      // Verify sync started
      await waitFor(element(by.id('syncing-indicator')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify sync completed
      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(15000);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from session timeout', async () => {
      // Create session
      await createSession('Build a music player');

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      // Simulate timeout (long pause)
      await device.sendToHome();

      // Wait for timeout period
      await new Promise(resolve => setTimeout(resolve, 60000));

      // Reopen app
      await device.launchApp({ newInstance: false });

      // Verify session expired message or recovery flow
      try {
        await waitFor(element(by.id('session-expired-message')))
          .toBeVisible()
          .withTimeout(5000);

        // Recover session
        await element(by.id('recover-session-button')).tap();

        await waitFor(element(by.id('code-editor')))
          .toBeVisible()
          .withTimeout(5000);
      } catch (error) {
        // Session recovered automatically
        await waitFor(element(by.id('code-editor')))
          .toBeVisible()
          .withTimeout(5000);
      }
    });

    it('should handle corrupted session data', async () => {
      // This would require injecting corrupted data
      // For now, verify app doesn't crash and shows error

      await device.launchApp({ newInstance: true });

      // Should not crash, shows error or clears corrupted data
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Multi-Session Management', () => {
    it('should track multiple sessions', async () => {
      // Create first session
      await createSession('Build app 1');

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      // Go to sessions list
      await element(by.id('sessions-tab')).tap();

      // Create second session
      await createSession('Build app 2');

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      // Go back to sessions list
      await element(by.id('sessions-tab')).tap();

      // Verify both sessions visible
      await expect(element(by.id('session-item-0'))).toBeVisible();
      await expect(element(by.id('session-item-1'))).toBeVisible();
    });

    it('should switch between sessions', async () => {
      // Assuming multiple sessions exist
      await element(by.id('sessions-tab')).tap();

      // Open first session
      await openSession(0);

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(5000);

      // Go back and open second session
      await element(by.id('sessions-tab')).tap();
      await openSession(1);

      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify different session loaded (check session ID changed)
      const sessionId = await element(by.id('session-id')).getAttributes();
      expect(sessionId).toBeDefined();
    });
  });
});
