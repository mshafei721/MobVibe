/**
 * Performance Monitoring Utilities
 *
 * Tools for measuring and optimizing app performance
 */

import { InteractionManager, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  componentRenderTime: number;
  interactionCompleteTime: number;
  memoryUsage?: number;
  timestamp: number;
}

/**
 * Performance logger class
 */
export class PerformanceLogger {
  private static instance: PerformanceLogger;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private enabled: boolean = __DEV__;

  private constructor() {}

  static getInstance(): PerformanceLogger {
    if (!PerformanceLogger.instance) {
      PerformanceLogger.instance = new PerformanceLogger();
    }
    return PerformanceLogger.instance;
  }

  /**
   * Enable or disable performance logging
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Start measuring performance
   */
  start(label: string): () => void {
    if (!this.enabled) return () => {};

    const startTime = Date.now();
    const startMemory = this.getMemoryUsage();

    return () => {
      const endTime = Date.now();
      const endMemory = this.getMemoryUsage();

      const metric: PerformanceMetrics = {
        componentRenderTime: endTime - startTime,
        interactionCompleteTime: 0,
        memoryUsage: endMemory - startMemory,
        timestamp: Date.now(),
      };

      this.recordMetric(label, metric);

      if (__DEV__) {
        console.log(`[Performance] ${label}: ${metric.componentRenderTime}ms`, {
          memory: metric.memoryUsage ? `${(metric.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A',
        });
      }
    };
  }

  /**
   * Measure async operation performance
   */
  async measureAsync<T>(label: string, operation: () => Promise<T>): Promise<T> {
    const end = this.start(label);
    try {
      const result = await operation();
      end();
      return result;
    } catch (error) {
      end();
      throw error;
    }
  }

  /**
   * Record a metric
   */
  private recordMetric(label: string, metric: PerformanceMetrics) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(metric);

    // Keep only last 50 metrics per label
    const metrics = this.metrics.get(label)!;
    if (metrics.length > 50) {
      metrics.shift();
    }
  }

  /**
   * Get metrics for a label
   */
  getMetrics(label: string): PerformanceMetrics[] {
    return this.metrics.get(label) || [];
  }

  /**
   * Get average metrics for a label
   */
  getAverageMetrics(label: string): Partial<PerformanceMetrics> | null {
    const metrics = this.getMetrics(label);
    if (metrics.length === 0) return null;

    const sum = metrics.reduce(
      (acc, m) => ({
        componentRenderTime: acc.componentRenderTime + m.componentRenderTime,
        interactionCompleteTime: acc.interactionCompleteTime + m.interactionCompleteTime,
        memoryUsage: (acc.memoryUsage || 0) + (m.memoryUsage || 0),
      }),
      { componentRenderTime: 0, interactionCompleteTime: 0, memoryUsage: 0 }
    );

    return {
      componentRenderTime: sum.componentRenderTime / metrics.length,
      interactionCompleteTime: sum.interactionCompleteTime / metrics.length,
      memoryUsage: sum.memoryUsage / metrics.length,
    };
  }

  /**
   * Get memory usage (platform-specific)
   */
  private getMemoryUsage(): number {
    if (Platform.OS === 'web' && performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    // Native platforms don't expose memory API directly
    return 0;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const report: string[] = ['Performance Report', '=================', ''];

    this.metrics.forEach((metrics, label) => {
      const avg = this.getAverageMetrics(label);
      if (avg) {
        report.push(`${label}:`);
        report.push(`  Average Render: ${avg.componentRenderTime?.toFixed(2)}ms`);
        if (avg.memoryUsage) {
          report.push(`  Average Memory: ${(avg.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
        }
        report.push(`  Samples: ${metrics.length}`);
        report.push('');
      }
    });

    return report.join('\n');
  }
}

/**
 * Hook to measure component render performance
 */
export const usePerformanceMetrics = (componentName: string) => {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    renderCountRef.current += 1;
    const renderEndTime = Date.now();
    const renderDuration = renderEndTime - mountTimeRef.current;

    setRenderTime(renderDuration);

    if (__DEV__ && renderCountRef.current === 1) {
      console.log(`[Performance] ${componentName} initial render: ${renderDuration}ms`);
    }
  });

  useEffect(() => {
    return () => {
      if (__DEV__) {
        console.log(`[Performance] ${componentName} total renders: ${renderCountRef.current}`);
      }
    };
  }, [componentName]);

  return {
    renderCount: renderCountRef.current,
    renderTime,
  };
};

/**
 * Hook to measure interaction performance
 */
export const useInteractionMetrics = (label: string) => {
  const [interactionComplete, setInteractionComplete] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      const endTime = Date.now();
      const duration = endTime - startTimeRef.current;

      if (__DEV__) {
        console.log(`[Performance] ${label} interaction complete: ${duration}ms`);
      }

      setInteractionComplete(true);
    });

    return () => handle.cancel();
  }, [label]);

  return interactionComplete;
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Memoization helper for expensive computations
 */
export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);

    // Limit cache size to 100 entries
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
};

/**
 * Check if app is running in low memory mode
 */
export const isLowMemoryMode = (): boolean => {
  if (Platform.OS === 'web' && performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    return usageRatio > 0.8; // 80% threshold
  }
  return false;
};

/**
 * Request idle callback for non-critical work
 */
export const scheduleIdleWork = (callback: () => void, timeout: number = 1000) => {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(callback, { timeout });
  } else {
    // Fallback for environments without requestIdleCallback
    setTimeout(callback, timeout);
  }
};

/**
 * Batch updates to reduce re-renders
 */
export class BatchUpdater {
  private queue: Array<() => void> = [];
  private timeout: NodeJS.Timeout | null = null;

  add(update: () => void) {
    this.queue.push(update);

    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.flush();
      }, 16); // ~60fps
    }
  }

  flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const updates = this.queue.splice(0);
    updates.forEach(update => update());
  }
}

/**
 * Export singleton instances
 */
export const performanceLogger = PerformanceLogger.getInstance();
export const batchUpdater = new BatchUpdater();
