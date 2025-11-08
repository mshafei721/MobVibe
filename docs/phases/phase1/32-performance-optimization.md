# Phase 32: Performance Optimization

**Duration:** 2 days
**Dependencies:** [31]
**Status:** Pending

## Objective

Benchmark and optimize application performance to meet target metrics: session start <5s, event responses <500ms, minimal memory footprint.

## Scope

### In Scope
- Performance benchmarking & profiling
- Bundle size optimization
- Memory leak detection & fixes
- Network request optimization
- Rendering performance improvements
- Cold start optimization

### Out of Scope
- Infrastructure scaling (covered in deployment)
- Backend performance tuning
- CDN configuration
- Database query optimization (Phase 28)

## Technical Architecture

### Performance Targets
```yaml
Cold Start: <5s (app launch → home screen)
Session Start: <3s (tap session → code visible)
Code Generation: <8s (prompt → first token)
Preview Launch: <10s (run → sandbox ready)
Event Response: <500ms (user interaction → UI update)
Memory: <150MB baseline, <300MB peak
Bundle Size: <15MB (iOS), <20MB (Android)
FPS: >55fps during interactions
```

### Monitoring Stack
```yaml
Performance Monitoring: Sentry Performance
Bundle Analysis: React Native Bundle Visualizer
Memory Profiling: Xcode Instruments, Android Profiler
Network: Flipper Network Plugin
Rendering: React DevTools Profiler
```

## Implementation Plan

### 1. Benchmarking Setup (3 hours)
```typescript
// src/utils/performance/benchmark.ts
import { PerformanceObserver } from 'react-native-performance';

export class PerformanceBenchmark {
  private marks = new Map<string, number>();
  private measures = new Map<string, number>();

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return;
    }

    const duration = (end || performance.now()) - start;
    this.measures.set(name, duration);

    // Log to Sentry
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${name}: ${duration.toFixed(2)}ms`,
      level: 'info',
      data: { duration, startMark, endMark }
    });

    return duration;
  }

  getMetrics() {
    return {
      marks: Object.fromEntries(this.marks),
      measures: Object.fromEntries(this.measures)
    };
  }

  clear() {
    this.marks.clear();
    this.measures.clear();
  }
}

export const benchmark = new PerformanceBenchmark();

// Usage in components
// benchmark.mark('session-start');
// ... async operation ...
// benchmark.measure('session-load-time', 'session-start');
```

### 2. Bundle Size Optimization (4 hours)
```javascript
// metro.config.js - Enhanced configuration
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  return {
    ...config,
    transformer: {
      ...config.transformer,
      minifierConfig: {
        compress: {
          drop_console: true, // Remove console.* in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        },
        mangle: {
          toplevel: true,
          keep_fnames: false
        },
        output: {
          comments: false,
          ascii_only: true
        }
      }
    },
    resolver: {
      ...config.resolver,
      sourceExts: [...config.resolver.sourceExts, 'mjs'],
      // Exclude heavy dependencies from bundle
      blockList: [
        /node_modules\/.*\/test\/.*/,
        /node_modules\/.*\/__tests__\/.*/
      ]
    }
  };
})();
```

```typescript
// src/utils/lazy-imports.ts - Code splitting strategy
import { lazy } from 'react';

// Heavy components loaded on-demand
export const CodeEditor = lazy(() => import('@/components/CodeEditor'));
export const PreviewSandbox = lazy(() => import('@/components/PreviewSandbox'));
export const SettingsScreen = lazy(() => import('@/screens/SettingsScreen'));

// Heavy libraries loaded conditionally
export const loadSyntaxHighlighter = () =>
  import('react-syntax-highlighter').then(mod => mod.Prism);

export const loadChartLibrary = () =>
  import('react-native-chart-kit').then(mod => mod.LineChart);
```

```json
// package.json - Production dependencies optimization
{
  "resolutions": {
    "@babel/runtime": "^7.24.0",
    "react": "18.2.0",
    "react-native": "0.73.4"
  },
  "scripts": {
    "analyze-bundle": "npx react-native-bundle-visualizer",
    "size-limit": "size-limit"
  },
  "size-limit": [
    {
      "name": "iOS Bundle",
      "path": "ios/build/main.jsbundle",
      "limit": "15 MB"
    },
    {
      "name": "Android Bundle",
      "path": "android/app/build/generated/assets/react/release/index.android.bundle",
      "limit": "20 MB"
    }
  ]
}
```

### 3. Memory Optimization (5 hours)
```typescript
// src/hooks/useMemoryManager.ts
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export const useMemoryManager = () => {
  const subscriptions = useRef<Array<() => void>>([]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background') {
        // Clean up heavy resources when app backgrounds
        cleanupResources();
      }
    });

    return () => {
      subscription.remove();
      cleanupResources();
    };
  }, []);

  const cleanupResources = () => {
    // Clear image cache
    FastImage.clearMemoryCache();

    // Clear unused session data
    sessionManager.pruneInactiveSessions();

    // Cancel pending requests
    apiClient.cancelPendingRequests();

    // Run garbage collection hints
    subscriptions.current.forEach(cleanup => cleanup());
    subscriptions.current = [];
  };

  return {
    registerCleanup: (cleanup: () => void) => {
      subscriptions.current.push(cleanup);
    }
  };
};
```

```typescript
// src/utils/cache/memory-cache.ts
export class MemoryCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 50, ttl = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: string, data: T) {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }

  prune() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
```

```typescript
// src/components/VirtualizedSessionList.tsx - Optimized list rendering
import { FlashList } from '@shopify/flash-list';

export const VirtualizedSessionList = ({ sessions }: Props) => {
  const renderItem = useCallback(({ item }: { item: Session }) => (
    <SessionCard session={item} />
  ), []);

  const getItemType = (item: Session) => {
    // Recycle views by type for better performance
    return item.hasCode ? 'with-code' : 'empty';
  };

  return (
    <FlashList
      data={sessions}
      renderItem={renderItem}
      getItemType={getItemType}
      estimatedItemSize={120}
      // Reduce overdraw
      drawDistance={400}
      // Memory optimization
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={5}
      // Performance optimization
      keyExtractor={item => item.id}
    />
  );
};
```

### 4. Network Optimization (4 hours)
```typescript
// src/services/api/optimized-client.ts
import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';

const baseClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// HTTP caching for GET requests
const cachedClient = setupCache(baseClient, {
  ttl: 5 * 60 * 1000, // 5 minutes
  methods: ['get'],
  interpretHeader: true,
  etag: true,
  modifiedSince: true
});

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

export const optimizedApiClient = {
  async get<T>(url: string, config?: any): Promise<T> {
    const cacheKey = `${url}:${JSON.stringify(config)}`;

    // Return pending request if exists
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    const request = cachedClient.get<T>(url, config)
      .then(response => response.data)
      .finally(() => pendingRequests.delete(cacheKey));

    pendingRequests.set(cacheKey, request);
    return request;
  },

  // Batch multiple requests
  async batchGet<T>(urls: string[]): Promise<T[]> {
    return Promise.all(urls.map(url => this.get<T>(url)));
  },

  // Prefetch for predictive loading
  prefetch(url: string) {
    this.get(url).catch(() => {
      // Silent fail for prefetch
    });
  }
};
```

```typescript
// src/hooks/usePrefetch.ts - Predictive loading
export const usePrefetch = () => {
  const prefetchSession = useCallback((sessionId: string) => {
    // Prefetch session details when hovering/viewing in list
    optimizedApiClient.prefetch(`/sessions/${sessionId}`);
    optimizedApiClient.prefetch(`/sessions/${sessionId}/code`);
  }, []);

  const prefetchRecentSessions = useCallback(() => {
    // Prefetch likely next page
    optimizedApiClient.prefetch('/sessions?page=2');
  }, []);

  return { prefetchSession, prefetchRecentSessions };
};
```

### 5. Rendering Performance (4 hours)
```typescript
// src/hooks/useThrottledCallback.ts
import { useRef, useCallback, useEffect } from 'react';

export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= delay) {
      callback(...args);
      lastRun.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRun.current = Date.now();
      }, delay - timeSinceLastRun);
    }
  }, [callback, delay]) as T;
};
```

```typescript
// src/components/OptimizedCodeEditor.tsx
import { memo } from 'react';

export const OptimizedCodeEditor = memo(({ code, language }: Props) => {
  // Debounce syntax highlighting
  const highlightedCode = useMemo(() => {
    return highlightSyntax(code, language);
  }, [code, language]);

  // Throttle scroll events
  const handleScroll = useThrottledCallback((event) => {
    updateScrollPosition(event.nativeEvent.contentOffset.y);
  }, 16); // ~60fps

  return (
    <ScrollView onScroll={handleScroll} scrollEventThrottle={16}>
      <Text>{highlightedCode}</Text>
    </ScrollView>
  );
}, (prev, next) => {
  // Custom comparison for memo
  return prev.code === next.code && prev.language === next.language;
});
```

### 6. Cold Start Optimization (4 hours)
```typescript
// src/app/_layout.tsx - Optimized initialization
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Critical path only - defer non-critical
        await Promise.all([
          loadAuthState(),      // Critical: know if logged in
          loadUserPreferences() // Critical: theme, locale
        ]);

        // Defer non-critical initialization
        setTimeout(() => {
          initializeAnalytics();
          preloadAssets();
          warmupApiConnection();
        }, 100);

        setAppReady(true);
      } catch (error) {
        console.error('App initialization failed', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appReady) {
    return null;
  }

  return <Navigation />;
}
```

```typescript
// src/utils/initialization/deferred-init.ts
export const deferredInitialization = {
  tasks: [] as Array<() => Promise<void>>,

  register(task: () => Promise<void>) {
    this.tasks.push(task);
  },

  async runAll() {
    // Run non-critical tasks after app is interactive
    for (const task of this.tasks) {
      try {
        await task();
      } catch (error) {
        console.warn('Deferred initialization task failed', error);
      }
    }
  }
};

// Usage
deferredInitialization.register(async () => {
  await initializeErrorTracking();
});

deferredInitialization.register(async () => {
  await loadRemoteConfig();
});
```

## Performance Monitoring

### Sentry Performance Integration
```typescript
// src/utils/monitoring/performance-tracking.ts
import * as Sentry from '@sentry/react-native';

export const trackPerformance = {
  startTransaction(name: string, op: string) {
    return Sentry.startTransaction({ name, op });
  },

  measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const transaction = this.startTransaction(name, 'operation');

    return operation()
      .then(result => {
        transaction.finish();
        return result;
      })
      .catch(error => {
        transaction.setStatus('internal_error');
        transaction.finish();
        throw error;
      });
  },

  recordMetric(name: string, value: number, unit: string = 'ms') {
    Sentry.metrics.distribution(name, value, {
      unit,
      tags: { environment: __DEV__ ? 'development' : 'production' }
    });
  }
};

// Usage
await trackPerformance.measureAsync('session-load', async () => {
  return await sessionService.loadSession(id);
});
```

## Testing & Validation

### Performance Tests
```typescript
// __tests__/performance/cold-start.test.ts
describe('Cold Start Performance', () => {
  it('should launch app in under 5 seconds', async () => {
    const startTime = Date.now();

    await device.launchApp({
      newInstance: true,
      launchArgs: { detoxEnableSynchronization: 0 }
    });

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000);
  });
});

// __tests__/performance/memory-leak.test.ts
describe('Memory Leak Detection', () => {
  it('should not leak memory on session navigation', async () => {
    const initialMemory = await getMemoryUsage();

    // Navigate through 10 sessions
    for (let i = 0; i < 10; i++) {
      await element(by.id(`session-${i}`)).tap();
      await element(by.id('back-button')).tap();
    }

    const finalMemory = await getMemoryUsage();
    const memoryGrowth = finalMemory - initialMemory;

    // Should not grow more than 50MB
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
  });
});
```

## Acceptance Criteria

- [ ] Cold start time <5s (measured across devices)
- [ ] Session start time <3s
- [ ] Event response time <500ms (UI interactions)
- [ ] Memory baseline <150MB, peak <300MB
- [ ] Bundle size: iOS <15MB, Android <20MB
- [ ] No memory leaks detected (10+ session navigations)
- [ ] FPS >55 during scrolling/interactions
- [ ] Network requests deduplicated & cached
- [ ] Performance metrics tracked in Sentry
- [ ] Bundle analysis report generated

## Risk Management

### Technical Risks
```yaml
Platform Differences:
  Impact: MEDIUM
  Mitigation: Test on both iOS & Android, adjust per platform

Memory Constraints:
  Impact: HIGH
  Mitigation: Aggressive caching strategy, resource cleanup

Bundle Size Growth:
  Impact: MEDIUM
  Mitigation: Code splitting, tree shaking, size monitoring
```

## Dependencies

### External
- Sentry Performance (monitoring)
- React Native Bundle Visualizer
- Xcode Instruments / Android Profiler
- FlashList (optimized lists)

### Internal
- Phase 31 (E2E tests) for performance testing
- All core features implemented for profiling

## Success Metrics

```yaml
Cold Start: <5s (95th percentile)
Session Load: <3s (95th percentile)
Event Response: <500ms (99th percentile)
Memory: <150MB baseline, <300MB peak
Bundle: iOS <15MB, Android <20MB
Crash-Free Rate: >99.5%
```

## Documentation Deliverables

- Performance optimization guide
- Profiling & debugging guide
- Bundle size analysis report
- Memory profiling report
- Performance monitoring dashboard setup

## Next Steps

→ **Phase 33:** Security Audit & Penetration Testing
