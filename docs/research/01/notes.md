# Phase 01 Research Notes

**Date:** 2025-11-06
**Phase:** 01 - Discovery & Baseline Measurement
**Queries:** React Native 0.81, Expo SDK 54, Tamagui vs gluestack UI

---

## Research Topic 1: React Native 0.81 Performance Benchmarks 2025

### Key Findings

**Version Context:**
- React Native 0.81 is the **last version supporting Legacy Architecture**
- Includes warnings and performance improvements for migration to New Architecture
- RN 0.82+ requires New Architecture (available October 2025)

### Performance Improvements

**debugOptimized Build Type (Backported to 0.81):**
- Debug builds: ~20 FPS
- debugOptimized builds: **~60 FPS** for animations
- Dramatic improvement for development performance

**Hermes V1 Benchmarks (RN 0.82+):**
- Android (low-end device):
  - 7.6% faster Total TTI
  - 7.2% faster Content TTI
- iOS:
  - 2.5% faster Total TTI
  - 7.5% faster Content TTI
- Overall: **2.5–9% TTI improvements** across platforms

### TTI (Time to Interactive) Best Practices

**Definition:**
TTI measures time from app icon tap → user can interact without lag. Every millisecond during startup counts.

**2025 Best Practices:**
1. ✅ Utilize Hermes for:
   - Faster startup times
   - Efficient memory management
   - Smaller app sizes
   - Improved execution speed

2. ✅ Use modern list components:
   - FlashList (Shopify)
   - LegendList
   - NOT FlatList (legacy)

3. ✅ Update to React Native 0.80+
   - Audit dependencies for TurboModules compatibility
   - Audit dependencies for Fabric compatibility
   - Prepare for New Architecture migration

### Benchmark Targets

**Competitive Benchmarks (2025):**
- **Expensify app:**
  - Total TTI: 2.5% faster (iOS), 7.6% faster (Android)
  - Content TTI: 7.5% faster (iOS), 7.2% faster (Android)

**Our Targets:**
- Baseline measurement in Phase 01
- Post-implementation (Phase 10): ≤ baseline + 10%
- Aim for 60 FPS during animations/scrolling

---

## Research Topic 2: Expo SDK 54 Production Optimization

### Major Features

**XCFrameworks Benefits - Build Time Revolution:**
- React Native and dependencies **precompiled as XCFrameworks**
- **10x faster** clean build times on iOS
- RNTester example: 120 seconds → **10 seconds** (M4 Max)
- Real-world production: **35% reduction** in iOS build time
- **Cooler laptop, longer battery, cheaper CI bills**

**React 19.1 Integration:**
- Improved performance vs React 18
- Modern architecture
- Better rendering efficiency

**Production Optimization:**
- Optimized startup speed for iOS apps
- Reduced memory usage for lag-free navigation
- Faster builds = faster iteration

### System Requirements

**Minimum Versions (SDK 54):**
- Xcode: **16.1+**
- Node: **20.19.4+**
- React Native: **0.81**
- React: **19.1**

### Additional Features

**iOS 26 Support:**
- Liquid Glass UI
- New .icon format
- Enhanced visual effects

**Android 16 Support:**
- Wider device coverage
- Edge-to-edge display
- Predictive back gestures
- Faster build times

### EAS & Autolinking Improvements
- EAS Update improvements
- Better autolinking for native modules
- Simplified dependency management

---

## Research Topic 3: Tamagui vs gluestack UI Performance Comparison

### Performance Benchmarks (Official)

**gluestack-ui-benchmarks (July 2024):**
- gluestack-ui v2: 98-100 (certain metrics)
- Tamagui: 156-157 (same metrics)
- Native baseline: 70-79
- **Lower numbers = better performance**

**Additional metrics:**
- gluestack-ui: 144-145
- Tamagui: 187-189
- **gluestack-ui v2 shows better raw performance in benchmarks**

### Tamagui

**Strengths:**
- ✅ Automatically fast (partial evaluation, tree flattening, hoisting, dead-code elimination)
- ✅ Style-first approach with optimizing compiler
- ✅ Performance-focused and customizable
- ✅ Unique approach to performant, scalable React Native apps
- ✅ Excellent for apps needing web version (web parity)
- ✅ SSR support

**Challenges:**
- ⚠️ Steep learning curve for newcomers
- ⚠️ Utility-first patterns may be unfamiliar
- ⚠️ More complex setup vs alternatives

**Best For:**
- Apps needing web version
- Maximum performance requirements
- Complex animations
- Teams comfortable with compiler-based optimization

### gluestack UI

**Strengths:**
- ✅ NativeBase's modern successor
- ✅ 40+ pre-built components
- ✅ Copy-paste component patterns
- ✅ Tailwind CSS utility classes (v2)
- ✅ NativeWind's styling engine
- ✅ Better raw performance in benchmarks
- ✅ Easier learning curve

**Challenges:**
- ⚠️ Less mature than Tamagui (newer)
- ⚠️ Fewer production case studies

**Best For:**
- Enterprise teams
- Data-heavy dashboards
- Admin panels
- Apps requiring strict design systems
- Tailwind CSS familiarity

### Production Readiness (2025)

**Both are production-ready:**
- Tamagui: Proven in production, many case studies
- gluestack UI: Production-ready as of 2025 (v2)
- Both appear in "top React Native UI libraries 2025" lists

### Decision Criteria for Phase 02

**Choose Tamagui if:**
- Need web parity (React Native Web)
- Maximum performance optimization required
- Complex animation requirements
- Team has advanced React Native experience

**Choose gluestack UI if:**
- Team familiar with Tailwind CSS
- Rapid development priority
- Copy-paste component patterns preferred
- Enterprise design system requirements
- Raw performance benchmarks are critical

---

## Competitive Benchmarks Summary

### Performance Baselines (2025)

**TTI (Time to Interactive):**
- Modern RN apps with Hermes: 2.5-9% faster than legacy
- Target: ≤ baseline + 10% after UI framework integration

**FPS (Frames Per Second):**
- Target: ≥ 55 FPS on low-end devices
- Optimal: 60 FPS (120 FPS on ProMotion)
- Debug builds: ~20 FPS
- debugOptimized builds: ~60 FPS

**Bundle Size:**
- Monitor with: `npx expo export --platform all`
- Target: ≤ baseline + 10%
- Optimize: Tree-shaking, lazy loading, code splitting

**Build Times (iOS with SDK 54):**
- Clean build: 10-120 seconds (XCFrameworks)
- Production: 35% reduction in build time
- Incremental: Near-instant with caching

---

## Citations

### React Native 0.81
- [React Native 0.82 - A New Era](https://reactnative.dev/blog/2025/10/08/react-native-0.82)
- [Callstack RN Optimization Guide 2025](https://www.callstack.com/ebooks/the-ultimate-guide-to-react-native-optimization)
- [React Native Performance Strategies - Sentry](https://blog.sentry.io/react-native-performance-strategies-tools/)
- [Top Tips to Boost React Native Performance 2025 - Netguru](https://www.netguru.com/blog/react-native-performance)

### Expo SDK 54
- [Expo SDK 54 - Official Changelog](https://expo.dev/changelog/sdk-54)
- [Expo SDK 54 Beta Announcement](https://expo.dev/changelog/sdk-54-beta)
- [iOS Build Times 10x Faster - Medium](https://santoshbotre01.medium.com/expo-sdk-54-react-native-pre-compilation-slashed-ios-build-times-by-10x-74f92b1dd4d6)
- [Expo SDK 54: Better. Faster. Simpler. - Red Shift](https://shift.infinite.red/expo-sdk-54-better-faster-simpler-bf3c2a35269e)

### Tamagui vs gluestack UI
- [gluestack-ui-benchmarks - GitHub](https://github.com/gluestack/gluestack-ui-benchmarks)
- [Best Headless UI Libraries in React Native - LogRocket](https://blog.logrocket.com/best-headless-ui-libraries-react-native/)
- [Why Use Tamagui - Medium](https://medium.com/@andrew.chester/why-expo-react-native-developers-should-use-tamagui-for-building-fast-scalable-uis-adfe981825c5)
- [10 Best React Native UI Libraries 2025 - LogRocket](https://blog.logrocket.com/best-react-native-ui-component-libraries/)
- [Tamagui Benchmarks - Official](https://tamagui.dev/docs/intro/benchmarks)

---

## Recommendations for Phase 02

### Framework Selection Criteria

**Performance:**
- Use official benchmarks from gluestack-ui-benchmarks repo
- Run PoC for both Tamagui and gluestack UI
- Measure: TTI, FPS, bundle size, memory

**Developer Experience:**
- Evaluate learning curve for team
- Test copy-paste component workflow
- Assess TypeScript autocomplete quality

**Production Readiness:**
- Review case studies and production apps
- Check community support and documentation
- Evaluate maintenance and update frequency

### Phase 02 Success Metrics

**PoC Testing:**
1. Build sample screen with both frameworks
2. Measure performance metrics
3. Evaluate developer experience
4. Score objectively (0-10 scale)
5. Document decision rationale

**Critical Factors:**
- Raw performance benchmarks
- Build time impact
- Bundle size impact
- Team learning curve
- Long-term maintenance

---

**Research Status:** Complete ✅
**Next Phase:** Use research to inform Phase 02 foundation decision
**Confidence Level:** High (multiple authoritative sources, official benchmarks, recent data)
