// Custom Detox Matchers
// Additional matchers for MobVibe-specific assertions

export const customMatchers = {
  toHaveLoadedCode: async (element: any) => {
    const attributes = await element.getAttributes();
    const hasText = attributes.text && attributes.text.length > 0;
    return {
      pass: hasText,
      message: hasText
        ? 'Code editor has content'
        : 'Code editor is empty',
    };
  },

  toShowError: async (element: any) => {
    const attributes = await element.getAttributes();
    const isVisible = attributes.visible === true;
    return {
      pass: isVisible,
      message: isVisible
        ? 'Error message is visible'
        : 'Error message is not visible',
    };
  },

  toBeInSession: async (element: any) => {
    const attributes = await element.getAttributes();
    const hasSessionId = attributes.label && attributes.label.includes('session-');
    return {
      pass: hasSessionId,
      message: hasSessionId
        ? 'User is in a session'
        : 'User is not in a session',
    };
  },

  toHavePreviewLoaded: async (element: any) => {
    const attributes = await element.getAttributes();
    const isLoaded = attributes.visible && attributes.label !== 'loading';
    return {
      pass: isLoaded,
      message: isLoaded
        ? 'Preview is loaded'
        : 'Preview is still loading or failed',
    };
  },

  toMatchSessionCount: async (element: any, expectedCount: number) => {
    const attributes = await element.getAttributes();
    const text = attributes.text || '';
    const actualCount = parseInt(text.match(/\d+/)?.[0] || '0', 10);
    return {
      pass: actualCount === expectedCount,
      message:
        actualCount === expectedCount
          ? `Session count matches: ${expectedCount}`
          : `Expected ${expectedCount} sessions, got ${actualCount}`,
    };
  },
};

export default customMatchers;
