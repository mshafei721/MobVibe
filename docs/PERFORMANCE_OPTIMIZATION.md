# Performance Optimization Guide

Complete guide to performance optimization strategies implemented in MobVibe.

## Table of Contents

1. [Animation Performance](#animation-performance)
2. [WebView Optimization](#webview-optimization)
3. [Bundle Size Optimization](#bundle-size-optimization)
4. [Memory Management](#memory-management)
5. [Runtime Performance](#runtime-performance)
6. [Network Optimization](#network-optimization)
7. [Monitoring & Debugging](#monitoring--debugging)

---

## Animation Performance

### Configuration

All animations use **Reanimated 3** with native driver for 60fps performance:

```typescript
import { usePressAnimation, triggerHaptic, HapticType } from '@/src/animations';

// Press animation with haptic feedback
const { animatedStyle, handlePressIn, handlePressOut } = usePressAnimation({
  scale: 0.96,
});
```

### Best Practices

1. **Always use native driver**: Set `useNativeDriver: true`
2. **Keep animations under 300ms**: Optimal user perception
3. **Use spring animations**: More natural feel than timing
4. **Respect reduced motion**: Check `AccessibilityInfo.isReduceMotionEnabled()`

### Animation Utilities

Located in `src/animations/`:
- `config.ts` - Animation timing, easing, presets
- `hooks.ts` - React hooks for common animations
- `utils.ts` - Helper functions, haptic feedback

### Performance Targets

- **Frame rate**: 60fps (16.67ms per frame)
- **Animation duration**: 100-500ms
- **Touch response**: <100ms
- **Haptic feedback**: Synchronized with visual feedback

---

## WebView Optimization

### Optimizations Implemented

**1. Performance Monitoring**
```typescript
const loadTimeRef = useRef<number>(0);

const handleLoadStart = useCallback(() => {
  loadTimeRef.current = Date.now();
}, []);

const handleLoadEnd = useCallback(() => {
  const loadTime = Date.now() - loadTimeRef.current;
  console.log(`Load completed in ${loadTime}ms`);
}, []);
```

**2. Injected JavaScript Optimization**
- Performance timing API monitoring
- Lazy image loading with IntersectionObserver
- Reduced motion detection
- Memory-efficient image handling

**3. Platform-Specific Optimizations**

**Android:**
```typescript
androidLayerType="hardware"      // GPU acceleration
scalesPageToFit={true}            // Responsive scaling
nestedScrollEnabled={true}        // Smooth scrolling
```

**iOS:**
```typescript
allowsInlineMediaPlayback={true}  // Video optimization
bounces={true}                    // Native scroll feel
```

**4. Caching Strategy**
```typescript
cacheEnabled={true}
cacheMode="LOAD_DEFAULT"
```

### Performance Targets

- **Initial load**: <3s
- **Subsequent loads**: <1s (cached)
- **Memory usage**: <50MB per WebView
- **Crash rate**: <0.1%

---

## Bundle Size Optimization

### Analysis Script

Run bundle analysis:
```bash
node scripts/analyze-bundle.js
```

### Current Bundle Metrics

- **Target size**: <20MB
- **Warning threshold**: 15MB
- **Current dependencies**: ~48 production

### Optimization Strategies

**1. Dependency Audit**
```bash
npm list --depth=0                 # List top-level deps
npm dedupe                         # Remove duplicates
npm prune                          # Remove unused deps
```

**2. Code Splitting**
```typescript
// Lazy load heavy screens
const HeavyScreen = React.lazy(() => import('./screens/HeavyScreen'));
```

**3. Image Optimization**
- Use WebP format (30% smaller than PNG)
- Multiple resolutions (@1x, @2x, @3x)
- Compress with tools like ImageOptim

**4. Tree Shaking**
```typescript
// ❌ Bad: Imports entire library
import _ from 'lodash';

// ✅ Good: Import specific functions
import debounce from 'lodash/debounce';
```

### Hermes Engine

Enable Hermes for better performance:

**Android**: `android/app/build.gradle`
```gradle
project.ext.react = [
    enableHermes: true
]
```

**iOS**: `ios/Podfile`
```ruby
use_react_native!(
  :hermes_enabled => true
)
```

---

## Memory Management

### Memory Monitoring

```typescript
import { performanceLogger } from '@/src/utils/performance';

// Measure memory impact
const end = performanceLogger.start('ComponentName');
// ... component logic
end();
```

### Optimization Techniques

**1. Cleanup Side Effects**
```typescript
useEffect(() => {
  const subscription = createSubscription();

  return () => {
    subscription.unsubscribe(); // Prevent memory leaks
  };
}, []);
```

**2. Optimize Large Lists**
```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={100}
  // Much faster than FlatList
/>
```

**3. Image Memory Management**
```typescript
// Use appropriate image sizes
<Image
  source={{ uri: imageUrl }}
  resizeMode="cover"
  resizeMethod="resize"  // Resize before rendering
/>
```

**4. Debounce Expensive Operations**
```typescript
import { debounce } from '@/src/utils/performance';

const debouncedSearch = debounce(handleSearch, 300);
```

### Memory Targets

- **App startup**: <150MB
- **Normal usage**: <200MB
- **Peak usage**: <300MB
- **WebView overhead**: <50MB per instance

---

## Runtime Performance

### React Performance

**1. Memoization**
```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize components
export const ExpensiveComponent = memo(({ data }) => {
  // Component logic
});

// Memoize values
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handlePress = useCallback(() => {
  doSomething(id);
}, [id]);
```

**2. Virtualization**
```typescript
// For long lists, always virtualize
<FlashList
  data={largeDataset}
  renderItem={renderItem}
  estimatedItemSize={80}
/>
```

**3. Avoid Inline Functions**
```typescript
// ❌ Bad: Creates new function on every render
<Button onPress={() => handlePress(id)} />

// ✅ Good: Stable function reference
const handleButtonPress = useCallback(() => {
  handlePress(id);
}, [id]);

<Button onPress={handleButtonPress} />
```

### Performance Monitoring Hooks

```typescript
import { usePerformanceMetrics } from '@/src/utils/performance';

function MyComponent() {
  const { renderCount, renderTime } = usePerformanceMetrics('MyComponent');

  // Logs render performance in dev mode
}
```

---

## Network Optimization

### API Request Optimization

**1. Request Caching**
```typescript
// Cache API responses
const cache = new Map();

async function fetchWithCache(url: string) {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const response = await fetch(url);
  const data = await response.json();
  cache.set(url, data);

  return data;
}
```

**2. Request Batching**
```typescript
import { BatchUpdater } from '@/src/utils/performance';

const batcher = new BatchUpdater();

// Batch multiple updates
batcher.add(() => updateUI1());
batcher.add(() => updateUI2());
// Flushes automatically at 60fps
```

**3. Optimistic Updates**
```typescript
function updateItem(id: string, data: any) {
  // Update UI immediately
  setItems(prev => updateItemInList(prev, id, data));

  // Send to server
  api.updateItem(id, data).catch(error => {
    // Rollback on error
    setItems(prev => revertItemInList(prev, id));
  });
}
```

---

## Monitoring & Debugging

### Performance Logger

```typescript
import { performanceLogger } from '@/src/utils/performance';

// Enable in production if needed
performanceLogger.setEnabled(true);

// Measure operation
const end = performanceLogger.start('OperationName');
await performOperation();
end();

// Get metrics
const metrics = performanceLogger.getMetrics('OperationName');
const average = performanceLogger.getAverageMetrics('OperationName');

// Generate report
console.log(performanceLogger.generateReport());
```

### React DevTools Profiler

1. Open React DevTools
2. Go to Profiler tab
3. Record interaction
4. Analyze flame graph
5. Identify slow renders

### Flipper Integration

Monitor performance with Flipper:
- Network inspector
- Layout inspector
- React DevTools
- Hermes debugger

### Performance Budget

Set performance budgets in CI/CD:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.perf.test.js'],
  // Performance thresholds
  globals: {
    PERFORMANCE_BUDGET: {
      componentRender: 50,      // ms
      apiResponse: 500,          // ms
      bundleSize: 20 * 1024 * 1024, // 20MB
    },
  },
};
```

---

## Performance Checklist

### Before Release

- [ ] Run bundle analysis (`node scripts/analyze-bundle.js`)
- [ ] Check for memory leaks (Instruments/Profiler)
- [ ] Test on low-end devices
- [ ] Verify 60fps animations
- [ ] Measure app startup time (<3s)
- [ ] Test with slow network (3G simulation)
- [ ] Profile with React DevTools
- [ ] Review Sentry performance metrics
- [ ] Optimize images (WebP, proper sizing)
- [ ] Enable Hermes engine
- [ ] Remove console.logs
- [ ] Audit dependencies for bloat

### Performance Targets Summary

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Bundle Size | <15MB | 15-20MB | >20MB |
| App Startup | <2s | 2-3s | >3s |
| Memory Usage | <150MB | 150-200MB | >200MB |
| Frame Rate | 60fps | 50-60fps | <50fps |
| API Response | <300ms | 300-500ms | >500ms |
| WebView Load | <2s | 2-3s | >3s |

---

## Tools & Resources

### Performance Tools

- **React DevTools Profiler**: Component render analysis
- **Flipper**: Network, layout, React inspection
- **Metro Bundler**: Bundle analysis
- **Xcode Instruments**: iOS profiling
- **Android Studio Profiler**: Android profiling
- **Sentry Performance**: Production monitoring

### Scripts

- `scripts/analyze-bundle.js` - Bundle size analysis
- `src/utils/performance.ts` - Performance utilities
- `src/animations/` - Optimized animations

### Further Reading

- [React Native Performance Guide](https://reactnative.dev/docs/performance)
- [Reanimated 3 Documentation](https://docs.swmansion.com/react-native-reanimated/)
- [Hermes Engine](https://hermesengine.dev/)
- [Metro Bundler Configuration](https://facebook.github.io/metro/)
