// Performance Monitoring and Tracking
// DEFERRED: Will be used when mobile app is implemented and Sentry is integrated

/**
 * Mock Sentry interface for type safety
 * Replace with actual @sentry/react-native when integrated
 */
interface SentryMock {
  startTransaction(context: { name: string; op: string }): SentryTransaction;
  metrics: {
    distribution(name: string, value: number, options?: {unit?: string; tags?: Record<string, string>}): void;
  };
  addBreadcrumb(breadcrumb: {
    category: string;
    message: string;
    level?: string;
    data?: Record<string, any>;
  }): void;
}

interface SentryTransaction {
  setStatus(status: string): void;
  finish(): void;
}

// TODO: Replace with actual Sentry import when integrated
// import * as Sentry from '@sentry/react-native';
const Sentry: SentryMock = {
  startTransaction: (context) => ({
    setStatus: (status) => console.log(`[Sentry] Transaction ${context.name}: ${status}`),
    finish: () => console.log(`[Sentry] Transaction ${context.name} finished`),
  }),
  metrics: {
    distribution: (name, value, options) =>
      console.log(`[Sentry] Metric ${name}: ${value}${options?.unit || ''}`),
  },
  addBreadcrumb: (breadcrumb) => console.log('[Sentry] Breadcrumb:', breadcrumb),
};

/**
 * Performance tracking utilities for Sentry integration
 */
export const trackPerformance = {
  /**
   * Start a performance transaction
   * @param name - Transaction name
   * @param op - Operation type
   * @returns Transaction object
   */
  startTransaction(name: string, op: string = 'operation') {
    return Sentry.startTransaction({ name, op });
  },

  /**
   * Measure an async operation with automatic transaction management
   * @param name - Measurement name
   * @param operation - Async function to measure
   * @returns Result of the operation
   */
  async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const transaction = this.startTransaction(name, 'operation');

    try {
      const result = await operation();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      transaction.finish();
    }
  },

  /**
   * Record a performance metric
   * @param name - Metric name
   * @param value - Metric value
   * @param unit - Metric unit (default: 'ms')
   * @param tags - Optional tags for filtering
   */
  recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    tags?: Record<string, string>
  ): void {
    Sentry.metrics.distribution(name, value, {
      unit,
      tags: {
        environment: __DEV__ ? 'development' : 'production',
        ...tags,
      },
    });

    if (__DEV__) {
      console.log(`[Metric] ${name}: ${value}${unit}`, tags);
    }
  },

  /**
   * Add a performance breadcrumb for debugging
   * @param message - Breadcrumb message
   * @param data - Additional data
   */
  addBreadcrumb(message: string, data?: Record<string, any>): void {
    Sentry.addBreadcrumb({
      category: 'performance',
      message,
      level: 'info',
      data,
    });
  },
};

/**
 * Predefined performance operations
 */
export const PerformanceOperations = {
  /**
   * Track app cold start
   */
  async trackColdStart(startTime: number): Promise<void> {
    const duration = Date.now() - startTime;
    trackPerformance.recordMetric('app.cold_start', duration, 'ms', {
      type: 'cold_start',
    });

    if (duration > 5000) {
      console.warn(`[Performance] Cold start exceeded target: ${duration}ms > 5000ms`);
    }
  },

  /**
   * Track session load time
   */
  async trackSessionLoad(sessionId: string, loadFn: () => Promise<any>): Promise<any> {
    const startTime = Date.now();

    try {
      const result = await loadFn();
      const duration = Date.now() - startTime;

      trackPerformance.recordMetric('session.load_time', duration, 'ms', {
        session_id: sessionId,
      });

      if (duration > 3000) {
        console.warn(`[Performance] Session load exceeded target: ${duration}ms > 3000ms`);
      }

      return result;
    } catch (error) {
      trackPerformance.addBreadcrumb('Session load failed', {
        session_id: sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Track code generation time
   */
  async trackCodeGeneration(prompt: string, generateFn: () => Promise<any>): Promise<any> {
    const startTime = Date.now();

    try {
      const result = await generateFn();
      const duration = Date.now() - startTime;

      trackPerformance.recordMetric('code.generation_time', duration, 'ms', {
        prompt_length: String(prompt.length),
      });

      if (duration > 8000) {
        console.warn(`[Performance] Code generation exceeded target: ${duration}ms > 8000ms`);
      }

      return result;
    } catch (error) {
      trackPerformance.addBreadcrumb('Code generation failed', {
        prompt_length: prompt.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Track preview launch time
   */
  async trackPreviewLaunch(sessionId: string, launchFn: () => Promise<any>): Promise<any> {
    const startTime = Date.now();

    try {
      const result = await launchFn();
      const duration = Date.now() - startTime;

      trackPerformance.recordMetric('preview.launch_time', duration, 'ms', {
        session_id: sessionId,
      });

      if (duration > 10000) {
        console.warn(`[Performance] Preview launch exceeded target: ${duration}ms > 10000ms`);
      }

      return result;
    } catch (error) {
      trackPerformance.addBreadcrumb('Preview launch failed', {
        session_id: sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Track UI interaction response time
   */
  trackInteraction(interactionName: string, duration: number): void {
    trackPerformance.recordMetric('ui.interaction_time', duration, 'ms', {
      interaction: interactionName,
    });

    if (duration > 500) {
      console.warn(
        `[Performance] Interaction exceeded target: ${interactionName} ${duration}ms > 500ms`
      );
    }
  },

  /**
   * Track API request time
   */
  async trackApiRequest<T>(
    endpoint: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await requestFn();
      const duration = Date.now() - startTime;

      trackPerformance.recordMetric('api.request_time', duration, 'ms', {
        endpoint,
        status: 'success',
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      trackPerformance.recordMetric('api.request_time', duration, 'ms', {
        endpoint,
        status: 'error',
      });

      throw error;
    }
  },
};

/**
 * Example usage:
 *
 * // Track cold start
 * const appStartTime = Date.now();
 * // ... app initialization ...
 * await PerformanceOperations.trackColdStart(appStartTime);
 *
 * // Track session load
 * const session = await PerformanceOperations.trackSessionLoad(
 *   sessionId,
 *   async () => {
 *     return await sessionService.loadSession(sessionId);
 *   }
 * );
 *
 * // Track code generation
 * const code = await PerformanceOperations.trackCodeGeneration(
 *   prompt,
 *   async () => {
 *     return await claudeService.generateCode(prompt);
 *   }
 * );
 *
 * // Track UI interaction
 * function handleButtonPress() {
 *   const startTime = Date.now();
 *   performAction();
 *   PerformanceOperations.trackInteraction('button-press', Date.now() - startTime);
 * }
 *
 * // Track API request
 * const data = await PerformanceOperations.trackApiRequest('/sessions', async () => {
 *   return await apiClient.get('/sessions');
 * });
 */
