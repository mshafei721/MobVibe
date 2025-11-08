// Performance Benchmarking Utilities
// DEFERRED: Will be used when mobile app is implemented

/**
 * Performance benchmarking class for tracking app performance metrics.
 * Integrates with Sentry for production monitoring.
 */
export class PerformanceBenchmark {
  private marks = new Map<string, number>();
  private measures = new Map<string, number>();
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled && !__DEV__;
  }

  /**
   * Mark a specific point in time for performance measurement.
   * @param name - Unique name for this mark
   */
  mark(name: string): void {
    if (!this.enabled) return;

    this.marks.set(name, performance.now());
  }

  /**
   * Measure the duration between two marks.
   * @param name - Name for this measurement
   * @param startMark - Name of the start mark
   * @param endMark - Optional name of the end mark (defaults to now)
   * @returns Duration in milliseconds
   */
  measure(name: string, startMark: string, endMark?: string): number | undefined {
    if (!this.enabled) return undefined;

    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (!start) {
      console.warn(`[Performance] Start mark "${startMark}" not found`);
      return undefined;
    }

    const duration = (end || performance.now()) - start;
    this.measures.set(name, duration);

    // Log to console in development
    if (__DEV__) {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    // TODO: Send to Sentry when integrated
    // Sentry.addBreadcrumb({
    //   category: 'performance',
    //   message: `${name}: ${duration.toFixed(2)}ms`,
    //   level: 'info',
    //   data: { duration, startMark, endMark },
    // });

    return duration;
  }

  /**
   * Measure an async operation.
   * @param name - Name for this measurement
   * @param operation - Async function to measure
   * @returns Result of the operation
   */
  async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return operation();
    }

    const startMark = `${name}-start`;
    this.mark(startMark);

    try {
      const result = await operation();
      this.measure(name, startMark);
      return result;
    } catch (error) {
      this.measure(`${name}-error`, startMark);
      throw error;
    }
  }

  /**
   * Get all performance metrics.
   * @returns Object containing all marks and measures
   */
  getMetrics(): { marks: Record<string, number>; measures: Record<string, number> } {
    return {
      marks: Object.fromEntries(this.marks),
      measures: Object.fromEntries(this.measures),
    };
  }

  /**
   * Get a specific measurement.
   * @param name - Name of the measurement
   * @returns Duration in milliseconds or undefined
   */
  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  /**
   * Clear all marks and measures.
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }

  /**
   * Clear a specific mark.
   * @param name - Name of the mark to clear
   */
  clearMark(name: string): void {
    this.marks.delete(name);
  }

  /**
   * Export metrics as JSON for reporting.
   * @returns JSON string of all metrics
   */
  exportMetrics(): string {
    const metrics = this.getMetrics();
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        ...metrics,
      },
      null,
      2
    );
  }
}

// Global benchmark instance
export const benchmark = new PerformanceBenchmark();

/**
 * Decorator for automatic performance tracking of class methods.
 * @param target - Target class
 * @param propertyKey - Method name
 * @param descriptor - Method descriptor
 */
export function measurePerformance(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const methodName = `${target.constructor.name}.${propertyKey}`;
    return benchmark.measureAsync(methodName, () => originalMethod.apply(this, args));
  };

  return descriptor;
}

/**
 * Performance targets for validation.
 */
export const PERFORMANCE_TARGETS = {
  COLD_START: 5000, // 5 seconds
  SESSION_START: 3000, // 3 seconds
  CODE_GENERATION: 8000, // 8 seconds
  PREVIEW_LAUNCH: 10000, // 10 seconds
  EVENT_RESPONSE: 500, // 500ms
  MEMORY_BASELINE: 150 * 1024 * 1024, // 150MB
  MEMORY_PEAK: 300 * 1024 * 1024, // 300MB
  FPS_TARGET: 55, // 55fps
} as const;

/**
 * Validate a performance metric against targets.
 * @param metricName - Name of the metric
 * @param value - Measured value
 * @returns Whether the metric meets the target
 */
export function validatePerformanceTarget(
  metricName: keyof typeof PERFORMANCE_TARGETS,
  value: number
): boolean {
  const target = PERFORMANCE_TARGETS[metricName];
  const passes = value <= target;

  if (!passes && __DEV__) {
    console.warn(
      `[Performance] ${metricName} exceeded target: ${value.toFixed(2)} > ${target}`
    );
  }

  return passes;
}

/**
 * Example usage:
 *
 * // Mark start of operation
 * benchmark.mark('session-load-start');
 *
 * // ... perform operation ...
 *
 * // Measure duration
 * const duration = benchmark.measure('session-load', 'session-load-start');
 *
 * // Validate against target
 * validatePerformanceTarget('SESSION_START', duration);
 *
 * // Or measure async operation directly
 * const result = await benchmark.measureAsync('load-user-data', async () => {
 *   return await fetchUserData();
 * });
 */
