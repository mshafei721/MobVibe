# Phase 01 Context Bundle

**Generated:** 2025-11-06
**Phase:** 01 - Discovery & Baseline Measurement
**Purpose:** Focused context for baseline measurement and framework evaluation

---

## Project Overview

**MobVibe** is an AI-powered mobile app builder enabling users to create full apps using natural language prompts. Claude Agent SDK generates all code while users maintain ownership.

**Core Innovation:** In-app development workflow (no desktop needed) with real-time WebView preview

---

## Current Tech Stack

### Mobile
- **Framework:** React Native 0.76 → **Upgrading to 0.81**
- **Platform:** Expo SDK 52 → **Upgrading to SDK 54**
- **Language:** TypeScript 5.3+
- **Routing:** Expo Router (file-based)
- **Styling:** NativeWind (Tailwind for RN)
- **State:** Zustand 4.5+

### Expo SDK 54 Benefits
- React Native 0.81 integration
- React 19.1 support (better performance)
- Precompiled XCFrameworks for iOS (faster builds)
- Modern architecture with improved stability

---

## Design System Context

### Current State
- **Minimal UI framework** (basic components only)
- **Custom design tokens** in `constants/colors.ts`
- **Platform-specific patterns** but no unified system

### Target State (Phase 0.5)
- **Single UI foundation:** Tamagui OR gluestack UI
- **Unified token system:** colors, typography, spacing, motion
- **Adapter layer:** prevent vendor lock-in
- **Native-first interactions:** gestures, haptics, 60fps

### Design Philosophy
1. **Native First** - Feel native to iOS/Android
2. **Consistency** - Unified design language
3. **Performance** - 60fps animations, instant feedback
4. **Accessible** - WCAG 2.1 AA compliance

### Color System (Current)
```typescript
primary: {
  500: '#2196F3' // Main brand color
}
secondary: {
  500: '#9C27B0' // Accent
}
success: '#4CAF50'
error: '#F44336'
status: '#FFA726' // Pending, Active
```

### Typography (Current)
- **iOS:** San Francisco
- **Android:** Roboto
- **Code:** Menlo (iOS) / Monospace (Android)

---

## UI Framework Integration Plan Context

### Phase 0.5 Goals
1. **Quantify Current State** - Measure performance, accessibility, UX
2. **Establish Baseline** - Create comparison reference for Phase 10
3. **Research Foundation** - Validate framework selection criteria

### Candidate Libraries

**Primary Foundation (Choose ONE):**
- **Tamagui:** High-performance, compile-time styling, web parity
- **gluestack UI:** Tailwind-like API, fast theming, composable tokens

**Selective Add-Ons:**
- React Native Paper (Material Design)
- UI Kitten (Eva Design)
- React Native Elements (lightweight toolkit)
- Gifted Chat (chat UI)
- Lottie (vector animations)

**Core Dependencies:**
- react-native-gesture-handler
- react-native-reanimated
- react-native-haptic-feedback

### Performance Budget
- 🎯 TTI (Time to Interactive): ≤ baseline + 10%
- 🎯 FPS: ≥ 55fps on low-end devices
- 🎯 Bundle size: ≤ baseline + 10%
- 🎯 Memory: No leaks, efficient re-renders

### Accessibility Requirements
- ✅ Screen reader labels on all interactive elements
- ✅ 44pt touch targets (iOS) / 48dp (Android)
- ✅ Dynamic type support (text scaling)
- ✅ RTL layout support
- ✅ Dark mode with proper contrast
- ✅ Reduced motion respect

---

## Navigation Structure (Current)

**Bottom Tab Navigation** (4 tabs):
1. 💾 **Code Tab** - File tree, terminal, code viewer
2. 📱 **Preview Tab** - WebView with live app
3. 🔗 **Integrations Tab** - Backend, payments, services
4. 🎨 **Icon Gen Tab** - 2D icons & 3D logos

**Hamburger Menu** (☰):
- Settings
- Profile
- Usage & Billing
- Logout

---

## Component Inventory Baseline

### Known Components (to audit)
- Located in `components/ui/` directory
- Design tokens in `constants/`
- Need to identify:
  - Duplicated styling patterns
  - Missing components vs. UI Framework Plan
  - Current accessibility compliance

---

## Screens to Baseline

**Required Screenshots (10 total: 5 screens × 2 modes):**

1. **Login/Auth Screen** (light + dark)
2. **Home/Welcome Screen** (light + dark)
3. **Code Tab** (light + dark) - with file tree, terminal
4. **Preview Tab** (light + dark) - with WebView
5. **Integrations Tab** (light + dark) - backend services

---

## Baseline Measurement Requirements

### Performance Metrics
```bash
# Run production build
npm run start -- --no-dev --minify

# Measure:
- TTI (Time to Interactive) using React Native Performance Monitor
- FPS during scrolling (Code tab, Preview tab)
- Bundle size (npx expo export --platform all && du -sh dist/)
- Memory usage on iOS Simulator & Android Emulator
```

### Accessibility Audit
```bash
# Install tooling
npm install --save-dev @axe-core/react-native

# Check:
- Screen reader labels on interactive elements
- Touch target sizes (44pt iOS / 48dp Android)
- Contrast ratios (WCAG AA: 4.5:1 text, 3:1 UI)
- Dynamic type support
```

### Visual Documentation
- Capture all 5 screens in light + dark mode
- Save to `reports/ui/baseline-screenshots/`
- Naming: `{screen}-{mode}.png`

### Bundle Analysis
```bash
npx expo export --platform all
npx react-native-bundle-visualizer

# Identify:
- Largest dependencies
- Unused modules
```

---

## Success Criteria for Phase 01

**All must be captured:**
- ✅ Baseline performance metrics (TTI, FPS, bundle, memory)
- ✅ Screenshots of all 5 screens (light + dark mode)
- ✅ Accessibility audit completed with axe-core
- ✅ Current component inventory documented
- ✅ Research notes include 3+ competitive benchmarks

**Output Artifacts:**
- `/reports/ui/baseline-performance.json`
- `/reports/ui/baseline-screenshots/` (10 files)
- `/reports/ui/baseline-a11y.json`
- `/reports/ui/component-inventory.md`
- `/reports/ui/baseline-bundle-analysis.json`
- `/docs/research/01/notes.md`

---

## Research Focus Areas

### Required Research Topics
1. **React Native 0.81 performance benchmarks 2025**
   - TTI benchmarks for RN 0.81
   - Known performance improvements
   - Best practices for 0.81

2. **Expo SDK 54 production best practices**
   - SDK 54 optimization techniques
   - React 19.1 integration patterns
   - XCFrameworks benefits

3. **UI framework selection mobile app 2025**
   - Tamagui vs gluestack UI comparison
   - Performance benchmarks
   - Production case studies

---

## Phase 01 → Phase 02 Handover

**Phase 02 Needs:**
- Baseline metrics for before/after comparison
- Current component inventory to inform PoC scope
- Research notes to inform scoring criteria
- Screenshot baseline for visual comparison

**Critical Artifacts:**
- `baseline-performance.json` → Performance comparison
- `component-inventory.md` → Shows what needs replacing
- `research/01/notes.md` → Validates framework selection

---

## Key Constraints

### What Phase 01 Does NOT Do
- ❌ No code changes or refactoring
- ❌ No framework installation
- ❌ No new component creation
- ❌ No architectural decisions

### What Phase 01 DOES Do
- ✅ Measure and document current state
- ✅ Research best practices
- ✅ Establish comparison baseline
- ✅ Provide data for Phase 02 decisions

---

## Timeline

**Duration:** 1 working day (8 hours)

**Blocking Issues:** None (first phase, no dependencies)

**Next Phase:** Phase 02 - Foundation Decision (Tamagui vs gluestack UI)

---

**Status:** Context bundle complete | Ready for baseline measurement
