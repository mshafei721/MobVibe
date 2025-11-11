#!/usr/bin/env node

/**
 * Credential Validation Script
 * Tests all required credentials before deployment
 */

const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
};

// Load environment variables
require('dotenv').config();

const credentials = {
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  flyio: {
    apiToken: process.env.FLY_API_TOKEN,
    appName: process.env.FLY_APP_NAME || 'mobvibe-api',
  },
  sentry: {
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  },
};

// Validation results
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

/**
 * Make HTTPS request
 */
function httpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Test Supabase connection
 */
async function testSupabase() {
  log.info('Testing Supabase connection...');

  // Check URL format
  if (!credentials.supabase.url) {
    results.failed.push('Supabase URL is missing');
    return false;
  }

  if (!credentials.supabase.url.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/)) {
    results.warnings.push('Supabase URL has unexpected format');
  }

  // Check anon key format (should be JWT)
  if (!credentials.supabase.anonKey) {
    results.failed.push('Supabase anon key is missing');
    return false;
  }

  if (!credentials.supabase.anonKey.match(/^eyJ[a-zA-Z0-9_-]+\./)) {
    results.failed.push('Supabase anon key does not appear to be a valid JWT');
    return false;
  }

  // Check service role key
  if (!credentials.supabase.serviceRoleKey) {
    results.failed.push('Supabase service role key is missing');
    return false;
  }

  // Test API connection
  try {
    const url = new URL('/rest/v1/', credentials.supabase.url);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        apikey: credentials.supabase.anonKey,
        Authorization: `Bearer ${credentials.supabase.anonKey}`,
      },
    };

    const response = await httpsRequest(options);

    if (response.statusCode === 200) {
      results.passed.push('Supabase connection successful');
      return true;
    } else {
      results.failed.push(`Supabase returned status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    results.failed.push(`Supabase connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Test Anthropic API key
 */
async function testAnthropic() {
  log.info('Testing Anthropic API key...');

  if (!credentials.anthropic.apiKey) {
    results.failed.push('Anthropic API key is missing');
    return false;
  }

  if (!credentials.anthropic.apiKey.startsWith('sk-ant-')) {
    results.warnings.push('Anthropic API key has unexpected format');
  }

  try {
    const postData = JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Test' }],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': credentials.anthropic.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'Content-Length': postData.length,
      },
    };

    const response = await httpsRequest(options, postData);

    if (response.statusCode === 200) {
      results.passed.push('Anthropic API key is valid');
      return true;
    } else if (response.statusCode === 401) {
      results.failed.push('Anthropic API key is invalid');
      return false;
    } else {
      results.warnings.push(`Anthropic returned status ${response.statusCode}`);
      return true;
    }
  } catch (error) {
    results.failed.push(`Anthropic API test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test Fly.io CLI
 */
async function testFlyio() {
  log.info('Testing Fly.io CLI...');

  if (!credentials.flyio.apiToken) {
    results.failed.push('Fly.io API token is missing');
    return false;
  }

  if (!credentials.flyio.apiToken.startsWith('fo1_')) {
    results.warnings.push('Fly.io API token has unexpected format');
  }

  try {
    // Test flyctl command
    const { stdout } = await execAsync('flyctl version');
    results.passed.push(`Fly.io CLI installed: ${stdout.trim()}`);

    // Test authentication
    try {
      await execAsync('flyctl auth whoami');
      results.passed.push('Fly.io authentication successful');
      return true;
    } catch {
      results.failed.push('Fly.io not authenticated. Run: flyctl auth login');
      return false;
    }
  } catch (error) {
    results.failed.push('Fly.io CLI not installed. Install: curl -L https://fly.io/install.sh | sh');
    return false;
  }
}

/**
 * Test Sentry/GlitchTip DSN
 */
async function testSentry() {
  log.info('Testing Sentry/GlitchTip DSN...');

  if (!credentials.sentry.dsn) {
    results.warnings.push('Sentry/GlitchTip DSN is missing (optional but recommended)');
    return true; // Not required
  }

  // Validate DSN format
  if (!credentials.sentry.dsn.match(/^https:\/\/[a-f0-9]+@[a-z0-9.-]+\/[0-9]+$/)) {
    results.warnings.push('Sentry/GlitchTip DSN has unexpected format');
  }

  try {
    const url = new URL(credentials.sentry.dsn);
    const options = {
      hostname: url.hostname,
      path: '/api/0/envelope/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
    };

    // Send test envelope
    const envelope = JSON.stringify({ message: 'Test from credential validation' });
    await httpsRequest(options, envelope);

    results.passed.push('Sentry/GlitchTip DSN appears valid');
    return true;
  } catch (error) {
    results.warnings.push(`Sentry/GlitchTip test failed: ${error.message}`);
    return true; // Not critical
  }
}

/**
 * Test EAS CLI
 */
async function testEAS() {
  log.info('Testing EAS CLI...');

  try {
    const { stdout } = await execAsync('eas whoami');
    results.passed.push(`EAS CLI authenticated as: ${stdout.trim()}`);
    return true;
  } catch {
    results.failed.push('EAS CLI not authenticated. Run: eas login');
    return false;
  }
}

/**
 * Print results
 */
function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('CREDENTIAL VALIDATION RESULTS');
  console.log('='.repeat(60) + '\n');

  if (results.passed.length > 0) {
    log.success(`\nPASSED (${results.passed.length}):`);
    results.passed.forEach((msg) => console.log(`  ✓ ${msg}`));
  }

  if (results.warnings.length > 0) {
    log.warn(`\nWARNINGS (${results.warnings.length}):`);
    results.warnings.forEach((msg) => console.log(`  ⚠ ${msg}`));
  }

  if (results.failed.length > 0) {
    log.error(`\nFAILED (${results.failed.length}):`);
    results.failed.forEach((msg) => console.log(`  ✗ ${msg}`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log(`  Passed: ${results.passed.length}`);
  console.log(`  Warnings: ${results.warnings.length}`);
  console.log(`  Failed: ${results.failed.length}`);
  console.log('='.repeat(60) + '\n');

  if (results.failed.length > 0) {
    log.error('❌ Credential validation failed!');
    log.info('Please fix the issues above before deploying.\n');
    log.info('See docs/CREDENTIALS_CHECKLIST.md for detailed setup instructions.');
    process.exit(1);
  } else if (results.warnings.length > 0) {
    log.warn('⚠️  Credential validation passed with warnings.');
    log.info('Consider addressing the warnings above.\n');
    log.success('✓ Ready to deploy!\n');
    process.exit(0);
  } else {
    log.success('✅ All credentials validated successfully!');
    log.success('✓ Ready to deploy!\n');
    process.exit(0);
  }
}

/**
 * Main validation function
 */
async function main() {
  console.log(`${colors.blue}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  MobVibe Credential Validation                 ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════╝${colors.reset}\n`);

  log.info('Starting credential validation...\n');

  // Run all tests
  await testSupabase();
  await testAnthropic();
  await testFlyio();
  await testSentry();
  await testEAS();

  // Print results
  printResults();
}

// Run validation
main().catch((error) => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
