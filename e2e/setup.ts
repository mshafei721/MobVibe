// E2E Test Setup
// Runs before all tests

import { device } from 'detox';

beforeAll(async () => {
  // Setup global test environment
  console.log('🧪 E2E Test Suite Starting...');
});

afterAll(async () => {
  // Cleanup after all tests
  console.log('✅ E2E Test Suite Complete');
});

beforeEach(async () => {
  // Reset app state before each test
  await device.reloadReactNative();
});

// Custom matchers
expect.extend({
  async toHaveLoadedCode(element: any) {
    const attributes = await element.getAttributes();
    const hasText = attributes.text && attributes.text.length > 0;
    return {
      pass: hasText,
      message: () =>
        hasText ? 'Code editor has content' : 'Code editor is empty',
    };
  },
  async toShowError(element: any) {
    const attributes = await element.getAttributes();
    const isVisible = attributes.visible === true;
    return {
      pass: isVisible,
      message: () =>
        isVisible ? 'Error message is visible' : 'Error message is not visible',
    };
  },
});

// Increase timeout for slow operations
jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
