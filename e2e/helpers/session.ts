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
