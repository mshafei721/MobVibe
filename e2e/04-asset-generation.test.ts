/**
 * Asset Generation E2E Tests
 * Tests icon and sound generation workflows
 */

import { device, element, by, waitFor } from 'detox';
import { loginUser, skipOnboarding } from './helpers/auth';

describe('Asset Generation Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await loginUser('existing@example.com', 'Password123!');
    await skipOnboarding();
  });

  afterEach(async () => {
    await device.sendToHome();
  });

  describe('Icon Generation', () => {
    it('should generate icon from prompt', async () => {
      // Navigate to assets tab
      await element(by.id('assets-tab')).tap();

      // Tap generate icon button
      await element(by.id('generate-icon-button')).tap();

      // Enter icon prompt
      await waitFor(element(by.id('icon-prompt-input')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('icon-prompt-input')).typeText('A blue rocket icon');

      // Submit
      await element(by.id('generate-icon-submit')).tap();

      // Wait for generation
      await waitFor(element(by.id('icon-gallery')))
        .toBeVisible()
        .withTimeout(15000);

      // Verify variants generated
      await expect(element(by.id('icon-variant-0'))).toBeVisible();
      await expect(element(by.id('icon-variant-1'))).toBeVisible();
      await expect(element(by.id('icon-variant-2'))).toBeVisible();
    });

    it('should select and apply icon variant', async () => {
      await element(by.id('assets-tab')).tap();
      await element(by.id('generate-icon-button')).tap();

      // Generate icon
      await element(by.id('icon-prompt-input')).typeText('A green tree icon');
      await element(by.id('generate-icon-submit')).tap();

      // Wait for gallery
      await waitFor(element(by.id('icon-gallery')))
        .toBeVisible()
        .withTimeout(15000);

      // Select variant
      await element(by.id('icon-variant-1')).tap();

      // Apply to project
      await element(by.id('apply-icon-button')).tap();

      // Verify success message
      await waitFor(element(by.id('icon-applied-message')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should show error for invalid icon prompt', async () => {
      await element(by.id('assets-tab')).tap();
      await element(by.id('generate-icon-button')).tap();

      // Enter invalid prompt (too short)
      await element(by.id('icon-prompt-input')).typeText('x');
      await element(by.id('generate-icon-submit')).tap();

      // Verify error message
      await waitFor(element(by.id('error-message')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.id('error-message'))).toHaveText(
        /Please provide a more detailed description/i
      );
    });

    it('should regenerate icon with different prompt', async () => {
      await element(by.id('assets-tab')).tap();
      await element(by.id('generate-icon-button')).tap();

      // First generation
      await element(by.id('icon-prompt-input')).typeText('A red circle');
      await element(by.id('generate-icon-submit')).tap();

      await waitFor(element(by.id('icon-gallery')))
        .toBeVisible()
        .withTimeout(15000);

      // Regenerate with new prompt
      await element(by.id('regenerate-icon-button')).tap();
      await element(by.id('icon-prompt-input')).clearText();
      await element(by.id('icon-prompt-input')).typeText('A blue square');
      await element(by.id('generate-icon-submit')).tap();

      // Verify new gallery loaded
      await waitFor(element(by.id('icon-gallery')))
        .toBeVisible()
        .withTimeout(15000);
    });
  });

  describe('Sound Generation', () => {
    it('should generate sound from description', async () => {
      await element(by.id('assets-tab')).tap();

      // Navigate to sounds tab
      await element(by.id('sounds-subtab')).tap();

      // Tap generate sound button
      await element(by.id('generate-sound-button')).tap();

      // Enter sound description
      await waitFor(element(by.id('sound-prompt-input')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('sound-prompt-input')).typeText(
        'A happy notification sound'
      );

      // Submit
      await element(by.id('generate-sound-submit')).tap();

      // Wait for generation
      await waitFor(element(by.id('sound-player')))
        .toBeVisible()
        .withTimeout(15000);

      // Verify sound player visible
      await expect(element(by.id('play-sound-button'))).toBeVisible();
    });

    it('should play generated sound', async () => {
      await element(by.id('assets-tab')).tap();
      await element(by.id('sounds-subtab')).tap();
      await element(by.id('generate-sound-button')).tap();

      // Generate sound
      await element(by.id('sound-prompt-input')).typeText('A bell chime');
      await element(by.id('generate-sound-submit')).tap();

      // Wait for player
      await waitFor(element(by.id('sound-player')))
        .toBeVisible()
        .withTimeout(15000);

      // Play sound
      await element(by.id('play-sound-button')).tap();

      // Verify playing state
      await waitFor(element(by.id('pause-sound-button')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should download generated sound', async () => {
      await element(by.id('assets-tab')).tap();
      await element(by.id('sounds-subtab')).tap();
      await element(by.id('generate-sound-button')).tap();

      // Generate sound
      await element(by.id('sound-prompt-input')).typeText('A drumbeat');
      await element(by.id('generate-sound-submit')).tap();

      // Wait for player
      await waitFor(element(by.id('sound-player')))
        .toBeVisible()
        .withTimeout(15000);

      // Download sound
      await element(by.id('download-sound-button')).tap();

      // Verify download confirmation
      await waitFor(element(by.id('sound-downloaded-message')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Asset Library', () => {
    it('should display generated assets in library', async () => {
      await element(by.id('assets-tab')).tap();

      // Wait for asset library
      await waitFor(element(by.id('asset-library')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify library contains items
      await expect(element(by.id('asset-item-0'))).toBeVisible();
    });

    it('should filter assets by type', async () => {
      await element(by.id('assets-tab')).tap();

      // Filter by icons
      await element(by.id('filter-icons')).tap();

      // Verify only icons shown
      await waitFor(element(by.id('icon-item-0')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should delete asset from library', async () => {
      await element(by.id('assets-tab')).tap();

      // Long press asset
      await element(by.id('asset-item-0')).longPress();

      // Delete
      await element(by.id('delete-asset-option')).tap();

      // Confirm
      await waitFor(element(by.id('confirm-delete-asset')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('confirm-delete-asset')).tap();

      // Verify asset removed
      await waitFor(element(by.id('asset-item-0')))
        .not.toBeVisible()
        .withTimeout(3000);
    });
  });
});
