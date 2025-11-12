/**
 * Sentry Integration Test Script
 * Tests that Sentry is properly configured and captures errors
 *
 * Usage:
 *   npx ts-node scripts/test-sentry.ts
 *
 * Or add a test button in the app:
 *   import { testSentryIntegration } from '@/scripts/test-sentry';
 *   <Button onPress={testSentryIntegration}>Test Sentry</Button>
 */

import * as Sentry from '@sentry/react-native';
import { logger } from '../utils/logger';

/**
 * Test 1: Direct Sentry Capture
 */
export function testDirectCapture() {
  console.log('Test 1: Direct Sentry Capture');

  try {
    Sentry.captureMessage('Test message from MobVibe', 'info');
    console.log('✓ Direct capture successful');
  } catch (error) {
    console.error('✗ Direct capture failed:', error);
  }
}

/**
 * Test 2: Exception Capture with Context
 */
export function testExceptionCapture() {
  console.log('Test 2: Exception Capture with Context');

  try {
    const testError = new Error('Test exception from MobVibe');
    Sentry.captureException(testError, {
      tags: {
        test: 'true',
        feature: 'sentry-integration',
      },
      extra: {
        testId: 'test-001',
        timestamp: new Date().toISOString(),
      },
      level: 'error',
    });
    console.log('✓ Exception capture successful');
  } catch (error) {
    console.error('✗ Exception capture failed:', error);
  }
}

/**
 * Test 3: Logger Integration
 */
export function testLoggerIntegration() {
  console.log('Test 3: Logger Integration');

  try {
    logger.error(
      'Test logger integration',
      new Error('Test error from logger'),
      {
        component: 'sentry-test',
        action: 'test-logger',
      }
    );
    console.log('✓ Logger integration successful');
  } catch (error) {
    console.error('✗ Logger integration failed:', error);
  }
}

/**
 * Test 4: Breadcrumb
 */
export function testBreadcrumb() {
  console.log('Test 4: Breadcrumb');

  try {
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'Test breadcrumb from MobVibe',
      level: 'info',
      data: {
        testId: 'breadcrumb-001',
      },
    });
    console.log('✓ Breadcrumb successful');
  } catch (error) {
    console.error('✗ Breadcrumb failed:', error);
  }
}

/**
 * Test 5: Error Boundary Simulation
 */
export function testErrorBoundary() {
  console.log('Test 5: Error Boundary Simulation');

  try {
    // Simulate an error that would be caught by ErrorBoundary
    const simulatedError = new Error('Simulated React error');
    Sentry.captureException(simulatedError, {
      contexts: {
        react: {
          componentStack: 'at TestComponent\n  at ErrorBoundary\n  at App',
        },
      },
      tags: {
        errorBoundary: 'root',
      },
    });
    console.log('✓ Error boundary simulation successful');
  } catch (error) {
    console.error('✗ Error boundary simulation failed:', error);
  }
}

/**
 * Run all tests
 */
export function testSentryIntegration() {
  console.log('=== Starting Sentry Integration Tests ===\n');

  // Check if Sentry is initialized
  const client = Sentry.getCurrentHub().getClient();
  if (!client) {
    console.error('✗ Sentry is not initialized!');
    console.log('Make sure EXPO_PUBLIC_SENTRY_DSN is set in your .env file');
    return;
  }

  console.log('✓ Sentry client is initialized\n');

  // Run tests
  testDirectCapture();
  testExceptionCapture();
  testLoggerIntegration();
  testBreadcrumb();
  testErrorBoundary();

  console.log('\n=== Sentry Integration Tests Complete ===');
  console.log('Check your Sentry dashboard for test events:');
  console.log('https://sentry.io/organizations/your-org/issues/\n');
}

// Run tests if executed directly
if (require.main === module) {
  testSentryIntegration();
}
