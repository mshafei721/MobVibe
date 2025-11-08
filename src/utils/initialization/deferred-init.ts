// Deferred Initialization for Cold Start Optimization
// DEFERRED: Will be used when mobile app is implemented

/**
 * Task priority levels
 */
export enum InitPriority {
  CRITICAL = 0, // Must complete before app is interactive
  HIGH = 1, // Should complete soon after launch
  MEDIUM = 2, // Can wait until app is idle
  LOW = 3, // Can be delayed significantly
}

/**
 * Initialization task
 */
interface InitTask {
  name: string;
  priority: InitPriority;
  task: () => Promise<void>;
  timeout?: number;
}

/**
 * Initialization result
 */
interface InitResult {
  name: string;
  success: boolean;
  duration: number;
  error?: Error;
}

/**
 * Deferred initialization manager.
 * Allows registering non-critical initialization tasks to run after
 * the app is interactive, improving cold start time.
 */
class DeferredInitializationManager {
  private tasks: InitTask[] = [];
  private results: InitResult[] = [];
  private isRunning = false;

  /**
   * Register a task to run during initialization
   * @param name - Task name for logging
   * @param task - Async function to execute
   * @param priority - Task priority (default: MEDIUM)
   * @param timeout - Optional timeout in ms
   */
  register(
    name: string,
    task: () => Promise<void>,
    priority: InitPriority = InitPriority.MEDIUM,
    timeout?: number
  ): void {
    this.tasks.push({ name, priority, task, timeout });
    console.log(`[Init] Registered task: ${name} (priority: ${InitPriority[priority]})`);
  }

  /**
   * Run all registered tasks in priority order
   * @returns Array of task results
   */
  async runAll(): Promise<InitResult[]> {
    if (this.isRunning) {
      console.warn('[Init] Initialization already running');
      return this.results;
    }

    this.isRunning = true;
    console.log(`[Init] Starting deferred initialization (${this.tasks.length} tasks)`);

    // Sort tasks by priority
    const sortedTasks = [...this.tasks].sort((a, b) => a.priority - b.priority);

    // Run tasks
    for (const { name, task, timeout } of sortedTasks) {
      const result = await this.runTask(name, task, timeout);
      this.results.push(result);
    }

    this.isRunning = false;
    this.logSummary();

    return this.results;
  }

  /**
   * Run tasks for a specific priority level
   * @param priority - Priority level to run
   * @returns Array of task results
   */
  async runPriority(priority: InitPriority): Promise<InitResult[]> {
    const priorityTasks = this.tasks.filter((t) => t.priority === priority);

    console.log(`[Init] Running ${priorityTasks.length} ${InitPriority[priority]} priority tasks`);

    const results: InitResult[] = [];

    for (const { name, task, timeout } of priorityTasks) {
      const result = await this.runTask(name, task, timeout);
      results.push(result);
    }

    return results;
  }

  /**
   * Clear all registered tasks and results
   */
  clear(): void {
    this.tasks = [];
    this.results = [];
    this.isRunning = false;
  }

  /**
   * Get initialization results
   * @returns Array of task results
   */
  getResults(): InitResult[] {
    return this.results;
  }

  /**
   * Run a single task with timeout
   */
  private async runTask(
    name: string,
    task: () => Promise<void>,
    timeout?: number
  ): Promise<InitResult> {
    const startTime = Date.now();

    try {
      if (timeout) {
        await this.withTimeout(task(), timeout, name);
      } else {
        await task();
      }

      const duration = Date.now() - startTime;
      console.log(`[Init] ✓ ${name} (${duration}ms)`);

      return { name, success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Init] ✗ ${name} failed (${duration}ms):`, error);

      return {
        name,
        success: false,
        duration,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Add timeout to a promise
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    taskName: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Task "${taskName}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Log initialization summary
   */
  private logSummary(): void {
    const successful = this.results.filter((r) => r.success).length;
    const failed = this.results.filter((r) => !r.success).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('[Init] Initialization complete:');
    console.log(`  - Successful: ${successful}`);
    console.log(`  - Failed: ${failed}`);
    console.log(`  - Total duration: ${totalDuration}ms`);

    if (failed > 0) {
      console.warn('[Init] Failed tasks:', this.results.filter((r) => !r.success));
    }
  }
}

/**
 * Global deferred initialization manager
 */
export const deferredInitialization = new DeferredInitializationManager();

/**
 * Common initialization tasks
 */
export const initTasks = {
  /**
   * Initialize error tracking (Sentry)
   */
  errorTracking: () => {
    return deferredInitialization.register(
      'error-tracking',
      async () => {
        // TODO: Initialize Sentry
        // await Sentry.init({ ... });
        console.log('[Init] Error tracking initialized');
      },
      InitPriority.HIGH,
      5000
    );
  },

  /**
   * Initialize analytics
   */
  analytics: () => {
    return deferredInitialization.register(
      'analytics',
      async () => {
        // TODO: Initialize analytics
        // await analytics.init();
        console.log('[Init] Analytics initialized');
      },
      InitPriority.MEDIUM,
      3000
    );
  },

  /**
   * Preload assets
   */
  preloadAssets: () => {
    return deferredInitialization.register(
      'preload-assets',
      async () => {
        // TODO: Preload images/fonts
        console.log('[Init] Assets preloaded');
      },
      InitPriority.LOW
    );
  },

  /**
   * Warm up API connection
   */
  warmupApi: () => {
    return deferredInitialization.register(
      'warmup-api',
      async () => {
        // TODO: Make warmup request
        // await apiClient.warmup();
        console.log('[Init] API connection warmed up');
      },
      InitPriority.MEDIUM,
      5000
    );
  },

  /**
   * Load remote config
   */
  remoteConfig: () => {
    return deferredInitialization.register(
      'remote-config',
      async () => {
        // TODO: Load remote config
        console.log('[Init] Remote config loaded');
      },
      InitPriority.LOW,
      10000
    );
  },

  /**
   * Initialize push notifications
   */
  pushNotifications: () => {
    return deferredInitialization.register(
      'push-notifications',
      async () => {
        // TODO: Register for push notifications
        console.log('[Init] Push notifications initialized');
      },
      InitPriority.LOW,
      5000
    );
  },
};

/**
 * Example usage:
 *
 * // In app initialization (critical path)
 * async function initializeApp() {
 *   // Critical tasks only
 *   await loadAuthState();
 *   await loadUserPreferences();
 *
 *   // Register deferred tasks
 *   initTasks.errorTracking();
 *   initTasks.analytics();
 *   initTasks.preloadAssets();
 *   initTasks.warmupApi();
 *   initTasks.remoteConfig();
 *
 *   // Run deferred tasks after app is interactive
 *   setTimeout(() => {
 *     deferredInitialization.runAll();
 *   }, 100);
 * }
 *
 * // Or run tasks by priority
 * async function initializeByPriority() {
 *   // Run HIGH priority tasks first
 *   await deferredInitialization.runPriority(InitPriority.HIGH);
 *
 *   // Run MEDIUM priority after delay
 *   setTimeout(() => {
 *     deferredInitialization.runPriority(InitPriority.MEDIUM);
 *   }, 1000);
 *
 *   // Run LOW priority when idle
 *   setTimeout(() => {
 *     deferredInitialization.runPriority(InitPriority.LOW);
 *   }, 5000);
 * }
 */
