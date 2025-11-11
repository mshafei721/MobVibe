// Environment Variable Validation
// DEFERRED: Will be used when deploying to production

/**
 * Required environment variables for production
 */
const requiredEnvVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_SENTRY_DSN',
];

/**
 * Sensitive environment variables that should NEVER be public
 */
const sensitiveEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'FLY_API_TOKEN',
  'SENTRY_AUTH_TOKEN',
  'ANTHROPIC_API_KEY',
  'GOOGLE_CLOUD_API_KEY',
];

/**
 * Environment variables that should use HTTPS
 */
const urlEnvVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_API_URL',
];

interface ValidationError {
  severity: 'error' | 'warning';
  message: string;
}

/**
 * Validate environment variables are properly configured
 */
function validateEnvironment(): void {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  console.log('🔍 Validating environment variables...\n');

  // Check 1: Required variables exist
  console.log('Checking required variables...');
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      errors.push({
        severity: 'error',
        message: `Missing required environment variable: ${varName}`,
      });
    } else {
      console.log(`  ✓ ${varName}`);
    }
  }

  // Check 2: Sensitive variables not exposed as public
  console.log('\nChecking sensitive variables are not public...');
  for (const varName of sensitiveEnvVars) {
    if (varName.startsWith('EXPO_PUBLIC_')) {
      errors.push({
        severity: 'error',
        message: `Sensitive variable exposed as public: ${varName}`,
      });
    }

    // Check if sensitive var exists but warn if missing (might be optional)
    if (process.env[varName]) {
      console.log(`  ✓ ${varName} (private)`);
    } else {
      warnings.push({
        severity: 'warning',
        message: `Optional sensitive variable not set: ${varName}`,
      });
    }
  }

  // Check 3: URLs use HTTPS
  console.log('\nChecking URL formats...');
  for (const varName of urlEnvVars) {
    const value = process.env[varName];
    if (value) {
      if (!value.startsWith('https://')) {
        errors.push({
          severity: 'error',
          message: `${varName} must use HTTPS, got: ${value}`,
        });
      } else {
        console.log(`  ✓ ${varName} uses HTTPS`);
      }

      // Check for localhost in production
      if (process.env.NODE_ENV === 'production' && value.includes('localhost')) {
        errors.push({
          severity: 'error',
          message: `${varName} contains localhost in production: ${value}`,
        });
      }
    }
  }

  // Check 4: No placeholder values
  console.log('\nChecking for placeholder values...');
  const placeholderPatterns = ['YOUR_', 'PLACEHOLDER', 'EXAMPLE', 'TODO', 'FIXME'];

  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (value) {
      for (const pattern of placeholderPatterns) {
        if (value.includes(pattern)) {
          warnings.push({
            severity: 'warning',
            message: `${varName} appears to be a placeholder: ${value}`,
          });
        }
      }
    }
  }

  // Check 5: Validate specific formats
  console.log('\nValidating specific formats...');

  // Supabase URL format
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/)) {
    warnings.push({
      severity: 'warning',
      message: `EXPO_PUBLIC_SUPABASE_URL has unexpected format: ${supabaseUrl}`,
    });
  }

  // Supabase anon key format (JWT)
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey && !anonKey.match(/^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/)) {
    errors.push({
      severity: 'error',
      message: 'EXPO_PUBLIC_SUPABASE_ANON_KEY does not appear to be a valid JWT',
    });
  }

  // Sentry DSN format
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (sentryDsn && !sentryDsn.match(/^https:\/\/[a-f0-9]+@[a-z0-9.]+\/[0-9]+$/)) {
    warnings.push({
      severity: 'warning',
      message: `EXPO_PUBLIC_SENTRY_DSN has unexpected format: ${sentryDsn}`,
    });
  }

  // Check 6: Production-specific requirements
  if (process.env.NODE_ENV === 'production') {
    console.log('\nChecking production-specific requirements...');

    if (process.env.EXPO_PUBLIC_API_URL?.includes('localhost')) {
      errors.push({
        severity: 'error',
        message: 'API_URL cannot be localhost in production',
      });
    }

    if (!process.env.EXPO_PUBLIC_SENTRY_DSN) {
      warnings.push({
        severity: 'warning',
        message: 'Sentry DSN not configured for production monitoring',
      });
    }
  }

  // Check 7: Development-specific warnings
  if (process.env.NODE_ENV === 'development') {
    console.log('\nChecking development environment...');

    if (process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('.supabase.co')) {
      console.log('  ⚠️  Using production Supabase in development');
    }
  }

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION RESULTS');
  console.log('='.repeat(60) + '\n');

  if (errors.length > 0) {
    console.error('❌ ERRORS:\n');
    errors.forEach((err) => {
      console.error(`  ❌ ${err.message}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.warn('⚠️  WARNINGS:\n');
    warnings.forEach((warn) => {
      console.warn(`  ⚠️  ${warn.message}`);
    });
    console.log('');
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All environment variables validated successfully!\n');
  }

  // Summary
  console.log('SUMMARY:');
  console.log(`  Total variables checked: ${requiredEnvVars.length + sensitiveEnvVars.length}`);
  console.log(`  Errors: ${errors.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log('');

  // Exit with error code if validation failed
  if (errors.length > 0) {
    console.error('❌ Environment validation failed!');
    console.error('\nPlease fix the errors above before proceeding.\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment validation passed with warnings.');
    console.warn('Consider addressing the warnings above.\n');
  } else {
    console.log('✅ Environment validation passed!\n');
  }
}

/**
 * Generate example .env file
 */
function generateExampleEnv(): void {
  const exampleContent = `# MobVibe Environment Variables
# Copy this file to .env and fill in the values

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Backend Service (NEVER expose this in frontend!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# API URL
EXPO_PUBLIC_API_URL=https://api.mobvibe.app

# Sentry/GlitchTip Monitoring (Sentry-compatible DSN)
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-or-glitchtip-dsn-here

# Backend Worker Environment Variables
# Fly.io Configuration (Backend only)
FLY_API_TOKEN=your-fly-api-token-here
FLY_APP_NAME=mobvibe-sandboxes
FLY_REGION=sjc

# Claude AI API (Backend only)
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Optional: Google Cloud (for speech-to-text - Phase 2)
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key-here
`;

  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE .env FILE');
  console.log('='.repeat(60) + '\n');
  console.log(exampleContent);
}

// Run validation if called directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--example')) {
    generateExampleEnv();
  } else {
    validateEnvironment();
  }
}

export { validateEnvironment, generateExampleEnv };
