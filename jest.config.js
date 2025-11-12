/**
 * Jest Configuration
 * Comprehensive test setup for unit, integration, and component tests
 */

module.exports = {
  preset: 'react-native',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@store/(.*)$': '<rootDir>/store/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    // Mock assets
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(mp3|wav)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/tests/**/*.(test|spec).(ts|tsx|js)',
    '!**/e2e/**',
    '!**/node_modules/**',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'store/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/*.d.ts',
  ],

  // Coverage thresholds (80% minimum)
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Critical paths require higher coverage
    './app/**/*.{ts,tsx}': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './services/**/*.{ts,tsx}': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Coverage reporters
  coverageReporters: ['json', 'lcov', 'text', 'html', 'text-summary'],

  // Test environment
  testEnvironment: 'node',

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Timeout
  testTimeout: 10000,

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/.expo/',
    '/dist/',
    '/coverage/',
  ],

  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,
};
