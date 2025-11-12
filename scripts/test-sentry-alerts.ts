/**
 * Sentry Alert Testing Script
 * Tests all configured alert rules to ensure proper notification delivery
 *
 * Prerequisites:
 * - Sentry DSN configured in .env.production
 * - Alert rules created in Sentry dashboard (see .sentry/alert-rules.yaml)
 * - Slack integration connected
 * - Email notifications configured
 *
 * Usage:
 *   # Run all tests
 *   npx ts-node scripts/test-sentry-alerts.ts
 *
 *   # Or import individual tests in your app
 *   import { testCriticalAlert } from '@/scripts/test-sentry-alerts';
 *   <Button onPress={testCriticalAlert}>Test Critical Alert</Button>
 *
 * Expected Results:
 * - Critical Alert: Slack notification + Email within 5 minutes
 * - Error Spike: Slack notification within 5 minutes
 * - New Error Type: Slack notification immediately
 *
 * Cleanup:
 * After testing, filter Sentry issues by tag:test and mark as "Ignored"
 */

import * as Sentry from '@sentry/react-native';

// =============================================================================
// CONFIGURATION
// =============================================================================

const TEST_CONFIG = {
  // Set to true to actually trigger alerts (will notify Slack/Email)
  // Set to false for dry-run (logs only, no alerts)
  ENABLE_ALERTS: true,

  // Delay between tests to prevent alert fatigue
  TEST_DELAY_MS: 2000,

  // Number of errors for spike test
  SPIKE_ERROR_COUNT: 20,
};

// =============================================================================
// TEST 1: CRITICAL ERROR ALERT
// =============================================================================

/**
 * Test critical error alert configuration
 * Tests: Alert Rule #1 - "Critical Errors - Production"
 *
 * Expected:
 * - Slack notification in #mobvibe-alerts with @here mention
 * - Email to oncall@example.com
 * - Alert marked as P0 in Sentry dashboard
 */
export async function testCriticalAlert(): Promise<void> {
  console.log('\n🧪 Test 1: Critical Error Alert');
  console.log('─'.repeat(50));

  if (!TEST_CONFIG.ENABLE_ALERTS) {
    console.log('⚠️  Dry run mode - no alerts will be sent');
    return;
  }

  try {
    const error = new Error('TEST: Critical error alert');

    Sentry.captureException(error, {
      level: 'error',
      tags: {
        severity: 'critical',
        test: 'true',
        alert_test: 'critical_error',
      },
      extra: {
        testId: 'critical-001',
        timestamp: new Date().toISOString(),
        description: 'Testing critical error alert rule',
      },
      contexts: {
        test: {
          name: 'Critical Error Alert Test',
          type: 'automated',
        },
      },
    });

    console.log('✅ Critical error sent to Sentry');
    console.log('📱 Expected: Slack notification in #mobvibe-alerts (@here)');
    console.log('📧 Expected: Email to oncall@example.com');
    console.log('⏱️  ETA: Within 5 minutes');
    console.log('\n💡 Tip: Check Sentry dashboard for event with tag test:true');
  } catch (error) {
    console.error('❌ Critical alert test failed:', error);
  }
}

// =============================================================================
// TEST 2: ERROR RATE SPIKE ALERT
// =============================================================================

/**
 * Test error rate spike detection
 * Tests: Alert Rule #3 - "Error Rate Spike"
 *
 * Expected:
 * - Slack notification in #mobvibe-alerts
 * - Alert shows "X errors in 5 minutes"
 * - Triggered when > 10% increase in error rate
 */
export async function testErrorSpike(): Promise<void> {
  console.log('\n🧪 Test 2: Error Rate Spike Alert');
  console.log('─'.repeat(50));

  if (!TEST_CONFIG.ENABLE_ALERTS) {
    console.log('⚠️  Dry run mode - no alerts will be sent');
    return;
  }

  try {
    console.log(`Generating ${TEST_CONFIG.SPIKE_ERROR_COUNT} errors rapidly...`);

    // Generate multiple errors quickly to trigger spike detection
    for (let i = 0; i < TEST_CONFIG.SPIKE_ERROR_COUNT; i++) {
      const error = new Error(`TEST: Spike error ${i + 1}/${TEST_CONFIG.SPIKE_ERROR_COUNT}`);

      Sentry.captureException(error, {
        level: 'error',
        tags: {
          test: 'true',
          alert_test: 'error_spike',
        },
        extra: {
          testId: `spike-${String(i).padStart(3, '0')}`,
          timestamp: new Date().toISOString(),
          sequenceNumber: i + 1,
          totalErrors: TEST_CONFIG.SPIKE_ERROR_COUNT,
        },
      });

      // Small delay to spread errors over ~1 minute
      if (i > 0 && i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ ${TEST_CONFIG.SPIKE_ERROR_COUNT} errors sent to Sentry`);
    console.log('📱 Expected: Slack notification in #mobvibe-alerts');
    console.log('📊 Message: "Error rate spike detected"');
    console.log('⏱️  ETA: Within 5 minutes');
    console.log(`\n💡 Tip: Threshold is ${TEST_CONFIG.SPIKE_ERROR_COUNT} errors in 5 minutes`);
  } catch (error) {
    console.error('❌ Error spike test failed:', error);
  }
}

// =============================================================================
// TEST 3: NEW ERROR TYPE ALERT
// =============================================================================

/**
 * Test new error type detection
 * Tests: Alert Rule #6 - "New Error Type"
 *
 * Expected:
 * - Slack notification in #mobvibe-alerts
 * - Alert shows "New error type detected"
 * - Links to new issue in Sentry
 */
export async function testNewErrorType(): Promise<void> {
  console.log('\n🧪 Test 3: New Error Type Alert');
  console.log('─'.repeat(50));

  if (!TEST_CONFIG.ENABLE_ALERTS) {
    console.log('⚠️  Dry run mode - no alerts will be sent');
    return;
  }

  try {
    // Create unique error with timestamp to ensure it's "new"
    const uniqueTimestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(7);
    const error = new Error(`TEST: Unique error type - ${uniqueTimestamp}-${uniqueId}`);

    Sentry.captureException(error, {
      level: 'error',
      tags: {
        test: 'true',
        alert_test: 'new_error_type',
        unique_id: uniqueId,
      },
      extra: {
        testId: `new-error-${uniqueId}`,
        timestamp: new Date().toISOString(),
        description: 'Testing new error type detection',
        uniqueTimestamp,
      },
      fingerprint: [`test-new-error-${uniqueTimestamp}-${uniqueId}`],
    });

    console.log('✅ Unique error sent to Sentry');
    console.log(`🆔 Error ID: ${uniqueId}`);
    console.log('📱 Expected: Slack notification in #mobvibe-alerts');
    console.log('📊 Message: "New error type detected"');
    console.log('⏱️  ETA: Immediate (first seen)');
    console.log('\n💡 Tip: Each run creates a unique error fingerprint');
  } catch (error) {
    console.error('❌ New error type test failed:', error);
  }
}

// =============================================================================
// TEST 4: USER IMPACT ALERT
// =============================================================================

/**
 * Test high user impact alert
 * Tests: Alert Rule #2 - "High User Impact - Production"
 *
 * Note: This test simulates user impact but won't actually trigger the alert
 * because we can't simulate multiple real users in a test script.
 *
 * To properly test this alert:
 * 1. Monitor production for actual multi-user errors
 * 2. Or manually trigger errors from multiple test accounts
 */
export async function testUserImpactAlert(): Promise<void> {
  console.log('\n🧪 Test 4: User Impact Alert (Simulation Only)');
  console.log('─'.repeat(50));

  if (!TEST_CONFIG.ENABLE_ALERTS) {
    console.log('⚠️  Dry run mode - no alerts will be sent');
    return;
  }

  try {
    // Simulate errors with different user IDs
    const testUsers = Array.from({ length: 12 }, (_, i) => `test-user-${i + 1}`);

    console.log(`Simulating errors for ${testUsers.length} users...`);

    for (const userId of testUsers) {
      const error = new Error('TEST: User impact simulation');

      // Set user context for each error
      Sentry.setUser({ id: userId, username: userId });

      Sentry.captureException(error, {
        level: 'error',
        tags: {
          test: 'true',
          alert_test: 'user_impact',
        },
        extra: {
          testId: `user-impact-${userId}`,
          timestamp: new Date().toISOString(),
        },
      });

      // Small delay between users
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Clear user context
    Sentry.setUser(null);

    console.log('✅ User impact errors sent to Sentry');
    console.log('⚠️  Note: Alert may not trigger in test environment');
    console.log('📱 Expected (if triggered): Slack notification with user count');
    console.log('💡 To properly test: Trigger errors from multiple real user accounts');
  } catch (error) {
    console.error('❌ User impact test failed:', error);
  }
}

// =============================================================================
// TEST 5: AUTHENTICATION ERROR ALERT
// =============================================================================

/**
 * Test authentication error spike alert
 * Tests: Alert Rule #7 - "Authentication Error Spike"
 *
 * Expected:
 * - Slack notification in #mobvibe-security
 * - Email to security@example.com
 * - Triggered when > 5 auth errors in 1 minute
 */
export async function testAuthErrorAlert(): Promise<void> {
  console.log('\n🧪 Test 5: Authentication Error Alert');
  console.log('─'.repeat(50));

  if (!TEST_CONFIG.ENABLE_ALERTS) {
    console.log('⚠️  Dry run mode - no alerts will be sent');
    return;
  }

  try {
    console.log('Generating 6 authentication errors...');

    for (let i = 0; i < 6; i++) {
      const error = new Error('TEST: Authentication failed - invalid credentials');

      Sentry.captureException(error, {
        level: 'error',
        tags: {
          test: 'true',
          alert_test: 'auth_error',
          feature: 'authentication',
        },
        extra: {
          testId: `auth-error-${String(i).padStart(2, '0')}`,
          timestamp: new Date().toISOString(),
          attempt: i + 1,
        },
        contexts: {
          auth: {
            type: 'login',
            reason: 'invalid_credentials',
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Authentication errors sent to Sentry');
    console.log('📱 Expected: Slack notification in #mobvibe-security');
    console.log('📧 Expected: Email to security@example.com');
    console.log('⏱️  ETA: Within 5 minutes');
    console.log('💡 Threshold: > 5 auth errors in 1 minute');
  } catch (error) {
    console.error('❌ Auth error test failed:', error);
  }
}

// =============================================================================
// TEST 6: PERFORMANCE DEGRADATION ALERT
// =============================================================================

/**
 * Test slow transaction performance alert
 * Tests: Alert Rule #11 - "Slow Transactions"
 *
 * Note: This test logs a breadcrumb but won't trigger transaction alerts
 * because we're not using real transaction instrumentation.
 */
export async function testPerformanceAlert(): Promise<void> {
  console.log('\n🧪 Test 6: Performance Alert (Breadcrumb Only)');
  console.log('─'.repeat(50));

  if (!TEST_CONFIG.ENABLE_ALERTS) {
    console.log('⚠️  Dry run mode - no alerts will be sent');
    return;
  }

  try {
    // Add breadcrumb about slow performance
    Sentry.addBreadcrumb({
      category: 'performance',
      message: 'TEST: Slow transaction detected',
      level: 'warning',
      data: {
        duration: 3500, // ms (exceeds 3000ms threshold)
        operation: 'asset.generation',
        test: true,
      },
    });

    console.log('✅ Performance breadcrumb added');
    console.log('⚠️  Note: Performance alerts require transaction instrumentation');
    console.log('💡 To test: Enable tracing and monitor actual slow operations');
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
}

// =============================================================================
// RUN ALL TESTS
// =============================================================================

/**
 * Execute all alert tests in sequence
 *
 * Order:
 * 1. Critical Error (highest priority)
 * 2. Error Rate Spike (medium volume)
 * 3. New Error Type (unique fingerprint)
 * 4. User Impact (multi-user simulation)
 * 5. Authentication Error (security)
 * 6. Performance (breadcrumb only)
 */
export async function runAllTests(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('🧪 Sentry Alert Testing Suite');
  console.log('═══════════════════════════════════════════════════');

  // Check if Sentry is initialized
  const client = Sentry.getCurrentHub().getClient();
  if (!client) {
    console.error('\n❌ ERROR: Sentry is not initialized!');
    console.log('\n📝 Setup Instructions:');
    console.log('1. Add EXPO_PUBLIC_SENTRY_DSN to .env.production');
    console.log('2. Ensure app/_layout.tsx initializes Sentry');
    console.log('3. Restart the app');
    return;
  }

  console.log('✅ Sentry client initialized');

  // Check environment
  const isDev = __DEV__;
  console.log(`📍 Environment: ${isDev ? 'development' : 'production'}`);

  if (isDev) {
    console.log('\n⚠️  WARNING: Running in development mode');
    console.log('   Alerts may not trigger (production filters active)');
    console.log('   For full testing: Build production app and test there');
  }

  console.log(`\n⚙️  Configuration:`);
  console.log(`   - Enable Alerts: ${TEST_CONFIG.ENABLE_ALERTS}`);
  console.log(`   - Test Delay: ${TEST_CONFIG.TEST_DELAY_MS}ms`);
  console.log(`   - Spike Count: ${TEST_CONFIG.SPIKE_ERROR_COUNT} errors`);

  console.log('\n🎬 Starting tests...\n');

  // Test 1: Critical Error Alert
  await testCriticalAlert();
  await sleep(TEST_CONFIG.TEST_DELAY_MS);

  // Test 2: Error Rate Spike
  await testErrorSpike();
  await sleep(TEST_CONFIG.TEST_DELAY_MS);

  // Test 3: New Error Type
  await testNewErrorType();
  await sleep(TEST_CONFIG.TEST_DELAY_MS);

  // Test 4: User Impact
  await testUserImpactAlert();
  await sleep(TEST_CONFIG.TEST_DELAY_MS);

  // Test 5: Authentication Error
  await testAuthErrorAlert();
  await sleep(TEST_CONFIG.TEST_DELAY_MS);

  // Test 6: Performance
  await testPerformanceAlert();

  // Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ All Alert Tests Complete!');
  console.log('═══════════════════════════════════════════════════');

  console.log('\n📋 Next Steps:');
  console.log('1. Check #mobvibe-alerts in Slack (allow 5 minutes)');
  console.log('2. Check email inbox for alert emails');
  console.log('3. Verify events in Sentry dashboard (filter by test:true)');
  console.log('4. Clean up test events:');
  console.log('   - Sentry → Issues → Filter: tag:test');
  console.log('   - Select all → Mark as "Ignored"');

  console.log('\n🔗 Useful Links:');
  console.log('   Sentry Issues: https://sentry.io/organizations/YOUR_ORG/issues/');
  console.log('   Slack Channel: #mobvibe-alerts');
  console.log('   Documentation: docs/SENTRY_ALERTS_SETUP.md');

  console.log('\n📊 Expected Notifications:');
  console.log('   - Critical Error: Slack (@here) + Email');
  console.log('   - Error Spike: Slack');
  console.log('   - New Error: Slack');
  console.log('   - User Impact: Slack (may not trigger in test)');
  console.log('   - Auth Error: Slack (#mobvibe-security) + Email');
  console.log('   - Performance: No alert (breadcrumb only)');

  console.log('\n');
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Sleep utility for delays between tests
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check Sentry configuration
 */
export function checkSentryConfig(): void {
  console.log('\n🔍 Sentry Configuration Check');
  console.log('─'.repeat(50));

  const client = Sentry.getCurrentHub().getClient();
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  console.log(`Client: ${client ? '✅ Initialized' : '❌ Not initialized'}`);
  console.log(`DSN: ${dsn ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'unknown'}`);

  if (dsn) {
    // Don't log full DSN (security), just confirm it exists
    console.log(`DSN Format: ${dsn.substring(0, 20)}...`);
  }

  if (!client) {
    console.log('\n❌ Sentry is not properly configured');
    console.log('See docs/SENTRY_SETUP.md for setup instructions');
  } else {
    console.log('\n✅ Sentry is ready for testing');
  }
}

// =============================================================================
// CLI EXECUTION
// =============================================================================

/**
 * Run tests when executed directly from command line
 */
if (require.main === module) {
  // Check configuration first
  checkSentryConfig();

  // Prompt for confirmation in production
  if (!__DEV__) {
    console.log('\n⚠️  You are about to trigger production alerts!');
    console.log('This will send notifications to:');
    console.log('  - Slack: #mobvibe-alerts');
    console.log('  - Email: oncall@example.com, team@example.com');
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');

    setTimeout(() => {
      runAllTests().catch(error => {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
      });
    }, 5000);
  } else {
    // Run immediately in development
    runAllTests().catch(error => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
  }
}

// Export all test functions for individual use
export default {
  runAllTests,
  testCriticalAlert,
  testErrorSpike,
  testNewErrorType,
  testUserImpactAlert,
  testAuthErrorAlert,
  testPerformanceAlert,
  checkSentryConfig,
};
