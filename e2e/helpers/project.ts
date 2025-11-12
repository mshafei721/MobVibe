/**
 * Project Helper Functions for E2E Tests
 * Reusable utilities for project management flows
 */

import { element, by, waitFor } from 'detox';

const testConfig = {
  defaultTimeout: 5000,
  longTimeout: 10000,
};

/**
 * Create a new project
 */
export const createProject = async (name: string, description?: string) => {
  console.log('[Project Helper] Creating project:', name);

  // Navigate to projects tab
  await element(by.id('projects-tab')).tap();

  // Tap new project button
  await element(by.id('new-project-button')).tap();

  // Wait for project form
  await waitFor(element(by.id('project-name-input')))
    .toBeVisible()
    .withTimeout(testConfig.defaultTimeout);

  // Enter project details
  await element(by.id('project-name-input')).typeText(name);

  if (description) {
    await element(by.id('project-description-input')).typeText(description);
  }

  // Submit
  await element(by.id('create-project-button')).tap();

  // Wait for project list to update
  await waitFor(element(by.id('project-list')))
    .toBeVisible()
    .withTimeout(testConfig.defaultTimeout);

  console.log('[Project Helper] Project created successfully');
};

/**
 * Select a project
 */
export const selectProject = async (index: number = 0) => {
  console.log('[Project Helper] Selecting project at index:', index);

  // Wait for project list
  await waitFor(element(by.id('project-list')))
    .toBeVisible()
    .withTimeout(testConfig.defaultTimeout);

  // Tap project
  await element(by.id(`project-item-${index}`)).tap();

  console.log('[Project Helper] Project selected');
};

/**
 * Delete a project
 */
export const deleteProject = async (index: number = 0) => {
  console.log('[Project Helper] Deleting project at index:', index);

  // Long press project item
  await element(by.id(`project-item-${index}`)).longPress();

  // Tap delete option
  await waitFor(element(by.id('delete-project-option')))
    .toBeVisible()
    .withTimeout(testConfig.defaultTimeout);
  await element(by.id('delete-project-option')).tap();

  // Confirm deletion
  await waitFor(element(by.id('confirm-delete-project')))
    .toBeVisible()
    .withTimeout(testConfig.defaultTimeout);
  await element(by.id('confirm-delete-project')).tap();

  console.log('[Project Helper] Project deleted successfully');
};

/**
 * Update project details
 */
export const updateProject = async (index: number, newName: string) => {
  console.log('[Project Helper] Updating project at index:', index);

  // Long press project item
  await element(by.id(`project-item-${index}`)).longPress();

  // Tap edit option
  await element(by.id('edit-project-option')).tap();

  // Wait for edit form
  await waitFor(element(by.id('project-name-input')))
    .toBeVisible()
    .withTimeout(testConfig.defaultTimeout);

  // Clear and enter new name
  await element(by.id('project-name-input')).clearText();
  await element(by.id('project-name-input')).typeText(newName);

  // Submit
  await element(by.id('save-project-button')).tap();

  console.log('[Project Helper] Project updated successfully');
};

/**
 * Search projects
 */
export const searchProjects = async (query: string) => {
  console.log('[Project Helper] Searching projects:', query);

  await element(by.id('search-projects-input')).typeText(query);

  // Wait for filtered results
  await waitFor(element(by.id('project-item-0')))
    .toBeVisible()
    .withTimeout(testConfig.defaultTimeout);

  console.log('[Project Helper] Search completed');
};
