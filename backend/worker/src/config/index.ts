import dotenv from 'dotenv'
dotenv.config()

interface Config {
  supabase: {
    url: string
    serviceRoleKey: string
  }
  worker: {
    pollIntervalMs: number
    maxConcurrentJobs: number
    shutdownTimeoutMs: number
  }
  health: {
    port: number
  }
  logging: {
    level: string
  }
  anthropic: {
    apiKey: string
  }
  flyio: {
    apiToken: string
    appName: string
    region: string
  }
  sandbox: {
    timeoutMs: number
    memoryMb: number
    cpus: number
  }
  storage: {
    quotaLimitBytes: number
  }
  env: string
}

function required(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function optional<T>(key: string, defaultValue: T): T {
  const value = process.env[key]
  if (!value) return defaultValue

  if (typeof defaultValue === 'number') {
    return parseInt(value) as T
  }
  return value as T
}

export const config: Config = {
  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  },
  worker: {
    pollIntervalMs: optional('POLL_INTERVAL_MS', 10000),
    maxConcurrentJobs: optional('MAX_CONCURRENT_JOBS', 1),
    shutdownTimeoutMs: optional('SHUTDOWN_TIMEOUT_MS', 30000),
  },
  health: {
    port: optional('HEALTH_CHECK_PORT', 8080),
  },
  logging: {
    level: optional('LOG_LEVEL', 'info'),
  },
  anthropic: {
    apiKey: required('ANTHROPIC_API_KEY'),
  },
  flyio: {
    apiToken: required('FLY_API_TOKEN'),
    appName: optional('FLY_APP_NAME', 'mobvibe-sandboxes'),
    region: optional('FLY_REGION', 'sjc'),
  },
  sandbox: {
    timeoutMs: optional('SANDBOX_TIMEOUT_MS', 1800000),
    memoryMb: optional('SANDBOX_MEMORY_MB', 512),
    cpus: optional('SANDBOX_CPUS', 1),
  },
  storage: {
    quotaLimitBytes: optional('STORAGE_QUOTA_LIMIT_BYTES', 100 * 1024 * 1024),
  },
  env: process.env.NODE_ENV || 'development',
}
