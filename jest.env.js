/**
 * Jest Environment Setup
 * Loads test environment variables before tests run
 */

const path = require('path');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '.env.test'),
});

// Verify critical environment variables are loaded
if (process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  NODE_ENV is not set to "test" - setting it now');
  process.env.NODE_ENV = 'test';
}

// Debug: Log loaded env vars (only in verbose mode)
if (process.env.JEST_VERBOSE) {
  console.log('✓ Test environment variables loaded from .env.test');
  console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
}
