// Session Management Helper Functions
// Reusable session flows for E2E tests

import { element, by, waitFor } from 'detox';

export const createSession = async (prompt: string) => {
  await element(by.id('new-session-button')).tap();
  await element(by.id('prompt-input')).typeText(prompt);
  await element(by.id('generate-button')).tap();

  await waitFor(element(by.id('code-editor')))
    .toBeVisible()
    .withTimeout(10000);
};

export const openSession = async (sessionIndex: number = 0) => {
  await element(by.id('session-list')).atIndex(sessionIndex).tap();

  await waitFor(element(by.id('code-editor')))
    .toBeVisible()
    .withTimeout(3000);
};

export const deleteSession = async (sessionIndex: number = 0) => {
  await element(by.id('session-item-' + sessionIndex)).longPress();
  await element(by.id('delete-option')).tap();
  await element(by.id('confirm-delete')).tap();

  await waitFor(element(by.id('session-item-' + sessionIndex)))
    .not.toBeVisible()
    .withTimeout(2000);
};

export const runPreview = async () => {
  await element(by.id('run-preview-button')).tap();

  await waitFor(element(by.id('preview-output')))
    .toBeVisible()
    .withTimeout(15000);
};

export const searchSessions = async (query: string) => {
  await element(by.id('search-sessions-input')).typeText(query);

  await waitFor(element(by.id('session-item-0')))
    .toBeVisible()
    .withTimeout(2000);
};

export const filterSessions = async (filter: 'all' | 'active' | 'completed') => {
  await element(by.id('filter-sessions-button')).tap();
  await element(by.id(`filter-${filter}`)).tap();

  await waitFor(element(by.id('session-list')))
    .toBeVisible()
    .withTimeout(2000);
};

export const scrollToSession = async (sessionIndex: number) => {
  await element(by.id('session-list')).scrollTo('bottom');

  await waitFor(element(by.id('session-item-' + sessionIndex)))
    .toBeVisible()
    .withTimeout(3000);
};

export const pauseSession = async () => {
  await element(by.id('pause-session-button')).tap();

  await waitFor(element(by.id('session-paused-indicator')))
    .toBeVisible()
    .withTimeout(2000);
};

export const resumeSession = async () => {
  await element(by.id('resume-session-button')).tap();

  await waitFor(element(by.id('code-editor')))
    .toBeVisible()
    .withTimeout(5000);
};

/**
 * Continue coding in current session
 */
export const continueSession = async (prompt: string) => {
  console.log('[Session Helper] Continuing session with prompt:', prompt);

  // Scroll to bottom to show input
  await element(by.id('chat-scroll-view')).scrollTo('bottom');

  // Enter new prompt
  await element(by.id('message-input')).typeText(prompt);
  await element(by.id('send-message-button')).tap();

  // Wait for thinking indicator
  await waitFor(element(by.id('thinking-indicator')))
    .toBeVisible()
    .withTimeout(5000);

  console.log('[Session Helper] Continuation request sent');
};

/**
 * Refresh preview
 */
export const refreshPreview = async () => {
  console.log('[Session Helper] Refreshing preview');

  await element(by.id('refresh-preview-button')).tap();

  // Wait for refresh to complete
  await waitFor(element(by.id('preview-output')))
    .toBeVisible()
    .withTimeout(10000);

  console.log('[Session Helper] Preview refreshed');
};

/**
 * Stop current session
 */
export const stopSession = async () => {
  console.log('[Session Helper] Stopping session');

  await element(by.id('stop-session-button')).tap();

  // Confirm stop
  await waitFor(element(by.id('confirm-stop')))
    .toBeVisible()
    .withTimeout(5000);
  await element(by.id('confirm-stop')).tap();

  console.log('[Session Helper] Session stopped');
};

/**
 * Wait for session completion
 */
export const waitForSessionComplete = async () => {
  console.log('[Session Helper] Waiting for session completion');
  await waitFor(element(by.id('session-complete-indicator')))
    .toBeVisible()
    .withTimeout(30000);
  console.log('[Session Helper] Session completed');
};
