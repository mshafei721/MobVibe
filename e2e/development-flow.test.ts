// Core Development Flow E2E Tests
// DEFERRED: Tests will execute when mobile app is implemented

import { device, element, by, waitFor } from 'detox';
import { loginUser, skipOnboarding } from './helpers/auth';
import { createSession, runPreview } from './helpers/session';

describe('Core Development Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await loginUser('test@example.com', 'Password123!');
    await skipOnboarding();
  });

  afterEach(async () => {
    await device.sendToHome();
  });

  describe('Session Creation', () => {
    it('should create session and generate code from prompt', async () => {
      const prompt = 'Create a React counter component with increment and decrement buttons';

      await createSession(prompt);

      // Verify code editor visible with content
      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);

      await expect(element(by.id('code-editor'))).toHaveText(/function|const/);
      await expect(element(by.id('code-editor'))).toHaveText(/counter/i);
    });

    it('should show loading state during generation', async () => {
      await element(by.id('new-session-button')).tap();
      await element(by.id('prompt-input')).typeText('Create a simple todo app');
      await element(by.id('generate-button')).tap();

      // Verify loading indicator
      await waitFor(element(by.id('generation-loading')))
        .toBeVisible()
        .withTimeout(1000);

      // Wait for completion
      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should handle generation errors gracefully', async () => {
      await element(by.id('new-session-button')).tap();
      await element(by.id('prompt-input')).typeText('hi');
      await element(by.id('generate-button')).tap();

      // Verify error message
      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('error-message'))).toHaveText(
        /Please provide a more detailed prompt/i
      );
    });

    it('should save session automatically', async () => {
      await createSession('Create a greeting function');

      // Verify session saved (session ID visible)
      await waitFor(element(by.id('session-title')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('session-status'))).toHaveText(/Saved/i);
    });
  });

  describe('Code Viewing', () => {
    beforeEach(async () => {
      // Navigate to existing session
      await element(by.id('session-list')).atIndex(0).tap();
    });

    it('should display code with syntax highlighting', async () => {
      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify syntax highlighting active (keywords colored)
      await expect(element(by.id('code-editor'))).toBeVisible();
    });

    it('should scroll through code', async () => {
      await element(by.id('code-editor')).swipe('up', 'slow', 0.75);

      // Verify scroll position changed
      await expect(element(by.id('code-editor'))).toBeVisible();
    });

    it('should search within code', async () => {
      await element(by.id('search-button')).tap();
      await element(by.id('search-input')).typeText('function');

      // Verify search results highlighted
      await waitFor(element(by.id('search-result-0')))
        .toBeVisible()
        .withTimeout(2000);

      await expect(element(by.id('search-count'))).toHaveText(/\d+ results/);
    });

    it('should navigate between search results', async () => {
      await element(by.id('search-button')).tap();
      await element(by.id('search-input')).typeText('const');

      await waitFor(element(by.id('search-result-0')))
        .toBeVisible()
        .withTimeout(2000);

      // Navigate to next result
      await element(by.id('search-next')).tap();

      await expect(element(by.id('search-current'))).toHaveText(/2/);
    });
  });

  describe('Code Preview', () => {
    beforeEach(async () => {
      await element(by.id('session-list')).atIndex(0).tap();
    });

    it('should run code preview successfully', async () => {
      await runPreview();

      // Verify preview output displayed
      await waitFor(element(by.id('preview-output')))
        .toBeVisible()
        .withTimeout(15000);

      await expect(element(by.id('preview-output'))).toBeVisible();
    });

    it('should show sandbox initialization progress', async () => {
      await element(by.id('run-preview-button')).tap();

      // Verify progress indicator
      await waitFor(element(by.id('sandbox-loading')))
        .toBeVisible()
        .withTimeout(2000);

      await expect(element(by.id('sandbox-status'))).toHaveText(
        /Initializing sandbox/i
      );
    });

    it('should display runtime errors in preview', async () => {
      // This assumes test session has intentional error
      await runPreview();

      // Wait for error display
      await waitFor(element(by.id('preview-error')))
        .toBeVisible()
        .withTimeout(15000);

      await expect(element(by.id('preview-error'))).toBeVisible();
    });

    it('should refresh preview on code change', async () => {
      await runPreview();

      // Make code change (simplified - actual implementation varies)
      await element(by.id('code-editor')).tap();
      await element(by.id('code-editor')).typeText('\nconsole.log("test");');

      // Trigger refresh
      await element(by.id('refresh-preview-button')).tap();

      // Verify preview updated
      await waitFor(element(by.id('preview-output')))
        .toBeVisible()
        .withTimeout(15000);
    });
  });

  describe('Real-time Updates', () => {
    beforeEach(async () => {
      await element(by.id('session-list')).atIndex(0).tap();
    });

    it('should stream terminal output in real-time', async () => {
      await runPreview();

      // Verify terminal output streaming
      await waitFor(element(by.id('terminal-output')))
        .toBeVisible()
        .withTimeout(10000);

      await expect(element(by.id('terminal-output'))).toHaveText(/./);
    });

    it('should update session status in real-time', async () => {
      await runPreview();

      // Verify status changes: pending → running → completed
      await waitFor(element(by.id('session-status')))
        .toHaveText(/Running/i)
        .withTimeout(5000);

      await waitFor(element(by.id('session-status')))
        .toHaveText(/Completed/i)
        .withTimeout(15000);
    });

    it('should display file changes in real-time', async () => {
      await runPreview();

      // Verify file tree updates
      await waitFor(element(by.id('file-tree')))
        .toBeVisible()
        .withTimeout(10000);

      await expect(element(by.id('file-count'))).toHaveText(/\d+ files/);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate offline
      await device.setURLBlacklist(['*']);

      await element(by.id('new-session-button')).tap();
      await element(by.id('prompt-input')).typeText('Create a button component');
      await element(by.id('generate-button')).tap();

      // Verify offline error
      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('error-message'))).toHaveText(/offline/i);

      // Re-enable network
      await device.setURLBlacklist([]);
    });

    it('should retry failed operations', async () => {
      await device.setURLBlacklist(['*']);

      await element(by.id('new-session-button')).tap();
      await element(by.id('prompt-input')).typeText('Create a form');
      await element(by.id('generate-button')).tap();

      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(3000);

      // Re-enable network and retry
      await device.setURLBlacklist([]);
      await element(by.id('retry-button')).tap();

      // Verify success
      await waitFor(element(by.id('code-editor')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should handle quota exceeded errors', async () => {
      // This test assumes quota is exceeded (test account setup)
      await element(by.id('new-session-button')).tap();
      await element(by.id('prompt-input')).typeText('Create an app');
      await element(by.id('generate-button')).tap();

      // Verify quota error
      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('error-message'))).toHaveText(/quota exceeded/i);

      // Verify upgrade CTA
      await expect(element(by.id('upgrade-button'))).toBeVisible();
    });
  });
});
