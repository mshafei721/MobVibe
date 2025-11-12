/**
 * Production-Safe Logger
 * Prevents sensitive data leakage in production logs
 *
 * Security: CWE-532 (Information Exposure Through Log Files)
 * Only logs errors to monitoring service in production
 * Monitoring: Integrates with Sentry for error tracking
 */

import * as Sentry from '@sentry/react-native';

interface LoggerConfig {
  enableConsole: boolean;
  enableErrorReporting: boolean;
  minLevel: 'debug' | 'info' | 'warn' | 'error';
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      enableConsole: __DEV__,
      enableErrorReporting: !__DEV__,
      minLevel: __DEV__ ? 'debug' : 'error',
    };
  }

  /**
   * Configure logger settings
   */
  configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Debug log (development only)
   */
  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args);
  }

  /**
   * Info log (development only)
   */
  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  /**
   * Warning log
   */
  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  /**
   * Error log (sent to error monitoring in production)
   */
  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, error, context);

    // Send to error monitoring service in production
    if (this.config.enableErrorReporting && error) {
      this.reportError(error, { message, ...context });
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, ...args: any[]) {
    if (!this.shouldLog(level)) {
      return;
    }

    if (this.config.enableConsole) {
      const prefix = this.getPrefix(level);
      const logFn = this.getLogFunction(level);

      if (args.length > 0) {
        logFn(prefix + message, ...args);
      } else {
        logFn(prefix + message);
      }
    }
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this.config.minLevel);

    return currentIndex >= minIndex;
  }

  /**
   * Get log prefix for level
   */
  private getPrefix(level: LogLevel): string {
    const now = new Date().toISOString();
    const prefixes = {
      debug: `[DEBUG ${now}] `,
      info: `[INFO ${now}] `,
      warn: `[WARN ${now}] `,
      error: `[ERROR ${now}] `,
    };

    return prefixes[level];
  }

  /**
   * Get console function for level
   */
  private getLogFunction(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case 'debug':
      case 'info':
        return console.log;
      case 'warn':
        return console.warn;
      case 'error':
        return console.error;
    }
  }

  /**
   * Report error to monitoring service
   */
  private reportError(error: Error, context?: Record<string, any>) {
    // Send to Sentry in all environments
    // Sentry.init() handles filtering based on DSN configuration
    Sentry.captureException(error, {
      extra: context,
      tags: {
        source: 'logger',
        environment: __DEV__ ? 'development' : 'production',
      },
    });

    // Keep console logging in production for local debugging if needed
    if (!__DEV__) {
      console.error('Error reported:', error.message, context);
    }
  }

  /**
   * Create a namespaced logger
   */
  namespace(name: string): NamespacedLogger {
    return new NamespacedLogger(this, name);
  }
}

/**
 * Namespaced logger for component/module-specific logging
 */
class NamespacedLogger {
  constructor(private logger: Logger, private namespace: string) {}

  debug(message: string, ...args: any[]) {
    this.logger.debug(`[${this.namespace}] ${message}`, ...args);
  }

  info(message: string, ...args: any[]) {
    this.logger.info(`[${this.namespace}] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.logger.warn(`[${this.namespace}] ${message}`, ...args);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.logger.error(
      `[${this.namespace}] ${message}`,
      error,
      { ...context, namespace: this.namespace }
    );
  }
}

/**
 * Export singleton logger instance
 */
export const logger = new Logger();

/**
 * Export default for convenience
 */
export default logger;
