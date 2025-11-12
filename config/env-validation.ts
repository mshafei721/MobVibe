/**
 * Environment Variable Validation
 * Ensures required environment variables are present and valid
 *
 * Security: CWE-15 (External Control of System Configuration)
 * Prevents runtime failures and security issues from missing/invalid env vars
 */

interface EnvConfig {
  required?: string[];
  serverOnly?: string[];
  optional?: string[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate environment variables at app startup
 */
export function validateEnvVars(config: EnvConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required client-side variables
  if (config.required) {
    for (const envVar of config.required) {
      const value = process.env[envVar];

      if (!value) {
        errors.push(`Missing required environment variable: ${envVar}`);
      } else if (value.includes('your-') || value.includes('example')) {
        errors.push(`Environment variable ${envVar} contains placeholder value`);
      }
    }
  }

  // Warn about server-only variables in client bundle
  if (config.serverOnly) {
    for (const envVar of config.serverOnly) {
      // Check if accidentally exposed (starts with EXPO_PUBLIC_)
      if (envVar.startsWith('EXPO_PUBLIC_')) {
        errors.push(
          `Security risk: Server-only variable ${envVar} should not start with EXPO_PUBLIC_`
        );
      }

      // Warn if present in client environment
      if (typeof window !== 'undefined' && process.env[envVar]) {
        errors.push(
          `Security risk: Server-only variable ${envVar} is exposed to client`
        );
      }
    }
  }

  // Check optional but recommended variables
  if (config.optional) {
    for (const envVar of config.optional) {
      if (!process.env[envVar]) {
        warnings.push(`Optional environment variable not set: ${envVar}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Supabase configuration
 */
export function validateSupabaseConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // Check URL format
  if (url && !url.startsWith('https://')) {
    errors.push('EXPO_PUBLIC_SUPABASE_URL must use HTTPS');
  }

  if (url && !url.includes('.supabase.co')) {
    warnings.push('EXPO_PUBLIC_SUPABASE_URL should be a Supabase domain');
  }

  // Check anon key format
  if (anonKey && anonKey.length < 100) {
    errors.push('EXPO_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Get safe environment variable (throws if missing)
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  if (value.includes('your-') || value.includes('example')) {
    throw new Error(
      `Environment variable ${name} contains placeholder value. Please update .env file.`
    );
  }

  return value;
}

/**
 * Get optional environment variable with default
 */
export function getOptionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Validate all app environment variables
 */
export function validateAppEnv(): void {
  const clientResult = validateEnvVars({
    required: [
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
      'EXPO_PUBLIC_APP_NAME',
      'EXPO_PUBLIC_APP_SCHEME',
    ],
    serverOnly: [
      'SUPABASE_SERVICE_ROLE_KEY',
      'IMAGE_GENERATION_API_KEY',
      'ELEVENLABS_API_KEY',
    ],
    optional: [
      'SENTRY_DSN',
    ],
  });

  const supabaseResult = validateSupabaseConfig();

  const allErrors = [...clientResult.errors, ...supabaseResult.errors];
  const allWarnings = [...clientResult.warnings, ...supabaseResult.warnings];

  // Log warnings
  if (allWarnings.length > 0 && __DEV__) {
    console.warn('⚠️ Environment Configuration Warnings:');
    allWarnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Throw on errors
  if (allErrors.length > 0) {
    const errorMessage = [
      '❌ Environment Configuration Errors:',
      ...allErrors.map(error => `  - ${error}`),
      '',
      'Please check your .env file and ensure all required variables are set.',
      'See .env.example for reference.',
    ].join('\n');

    throw new Error(errorMessage);
  }

  if (__DEV__) {
    console.log('✅ Environment configuration validated successfully');
  }
}
