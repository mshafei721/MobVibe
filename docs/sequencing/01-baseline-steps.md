# Phase 01: Baseline Measurement Micro-Plan

**Generated:** 2025-11-06
**Phase:** 01 - Discovery & Baseline Measurement
**Purpose:** Step-by-step execution plan for capturing baseline metrics

---

## Execution Overview

**Total Duration:** 6-8 hours (1 working day)
**Parallelizable Tasks:** Bundle analysis, accessibility audit, component inventory
**Blocking Tasks:** App verification must complete first
**Output Artifacts:** 5 files (3 JSON, 1 MD, 10 screenshots)

---

## Step 1: Environment Setup & Verification (30 min)

### Objectives
- Verify app runs without errors
- Identify all screens that need measurement
- Document any missing screens or issues

### Commands
```bash
# Check dependencies
cat package.json | grep -E "(expo|react-native|react)"

# Install dependencies if needed
npm install

# Start dev server
npm start

# Open in iOS Simulator
npm run ios

# Open in Android Emulator (if available)
npm run android
```

### Validation Checklist
- [ ] Dev server starts without errors
- [ ] App loads on iOS Simulator
- [ ] Can navigate to all 5 screens:
  - [ ] Login/Auth screen
  - [ ] Home/Welcome screen
  - [ ] Code tab
  - [ ] Preview tab
  - [ ] Integrations tab
- [ ] Light/dark mode toggle works
- [ ] No console errors or warnings

### Output
Document any issues in: `docs/sequencing/01-app-verification-notes.md`

---

## Step 2: Visual Baseline Capture (1 hour)

### Objectives
- Capture 10 screenshots (5 screens × 2 modes)
- Establish visual reference for Phase 10 comparison

### Process

**For each screen:**
1. Navigate to the screen
2. Capture in light mode
3. Toggle to dark mode
4. Capture in dark mode
5. Save with naming convention

### Screenshot List

**Light Mode:**
- [ ] `login-light.png` - Login/Auth screen
- [ ] `home-light.png` - Home/Welcome screen
- [ ] `code-light.png` - Code tab
- [ ] `preview-light.png` - Preview tab
- [ ] `integrations-light.png` - Integrations tab

**Dark Mode:**
- [ ] `login-dark.png` - Login/Auth screen
- [ ] `home-dark.png` - Home/Welcome screen
- [ ] `code-dark.png` - Code tab
- [ ] `preview-dark.png` - Preview tab
- [ ] `integrations-dark.png` - Integrations tab

### Commands
```bash
# Create directory
mkdir -p reports/ui/baseline-screenshots

# iOS Simulator: Cmd+S to save screenshot
# Or use CLI:
xcrun simctl io booted screenshot reports/ui/baseline-screenshots/login-light.png

# Android Emulator: Use built-in screenshot tool
# Or adb:
adb exec-out screencap -p > reports/ui/baseline-screenshots/login-light.png
```

### Validation
```bash
# Verify 10 screenshots exist
ls reports/ui/baseline-screenshots/*.png | wc -l
# Expected output: 10
```

### Output
- `reports/ui/baseline-screenshots/` - 10 PNG files

---

## Step 3: Performance Baseline Measurement (2 hours)

### Objectives
- Measure TTI (Time to Interactive)
- Measure FPS during scrolling
- Measure bundle size
- Measure memory usage

### 3.1: TTI Measurement

**Method 1: React Native Performance Monitor**
```bash
# Start app in production mode
npm run start -- --no-dev --minify

# In app: Shake device → Show Perf Monitor
# Record TTI from launch to interactive
```

**Method 2: Manual measurement**
- Use stopwatch from app icon tap → can interact
- Average over 3 cold starts
- Average over 3 warm starts

**Target metrics:**
- Cold start TTI: ___ ms
- Warm start TTI: ___ ms
- Baseline for Phase 10 comparison

### 3.2: FPS Measurement

```bash
# Enable FPS counter in Performance Monitor
# Navigate to Code tab → scroll file tree
# Navigate to Preview tab → scroll if applicable
# Record FPS values
```

**Screens to test:**
- Code tab scrolling: ___ FPS
- Preview tab scrolling: ___ FPS
- File tree navigation: ___ FPS

**Target:** ≥ 55 FPS on low-end devices

### 3.3: Bundle Size Measurement

```bash
# Export production bundle
npx expo export --platform all

# Measure iOS bundle
du -sh dist/ios
# Or on Windows:
# dir dist\ios /s

# Measure Android bundle
du -sh dist/android

# Total size
du -sh dist/
```

**Metrics to capture:**
- iOS bundle size: ___ MB
- Android bundle size: ___ MB
- Total bundle size: ___ MB

### 3.4: Memory Usage Measurement

**iOS Simulator:**
```bash
# Open Instruments
open -a Instruments

# Choose "Allocations" template
# Run app and navigate through all screens
# Record peak memory usage
```

**Android Emulator:**
```bash
# Use Android Studio Profiler
# Memory tab → Record session
# Navigate through all screens
# Note peak memory usage
```

**Metrics:**
- iOS peak memory: ___ MB
- Android peak memory: ___ MB
- Memory leaks detected: Yes/No

### Output: baseline-performance.json

```json
{
  "date": "2025-11-06",
  "platform": {
    "expo_sdk": "52",
    "react_native": "0.76",
    "node": "20.x"
  },
  "tti": {
    "cold_start_ms": 0,
    "warm_start_ms": 0,
    "notes": ""
  },
  "fps": {
    "code_tab_scroll": 0,
    "preview_tab_scroll": 0,
    "file_tree_nav": 0,
    "notes": ""
  },
  "bundle_size": {
    "ios_mb": 0,
    "android_mb": 0,
    "total_mb": 0,
    "notes": ""
  },
  "memory": {
    "ios_peak_mb": 0,
    "android_peak_mb": 0,
    "leaks_detected": false,
    "notes": ""
  }
}
```

---

## Step 4: Bundle Analysis (1 hour) [PARALLEL]

### Objectives
- Identify largest dependencies
- Find unused modules
- Establish bundle optimization baseline

### Commands

```bash
# Install bundle visualizer
npm install --save-dev react-native-bundle-visualizer

# Export bundle
npx expo export --platform all

# Analyze bundle (generates HTML report)
npx react-native-bundle-visualizer

# Or use Metro bundler output
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios-bundle.js \
  --sourcemap-output ios-bundle.map
```

### Analysis Checklist
- [ ] Identify top 10 largest dependencies
- [ ] Check for duplicate dependencies
- [ ] Identify unused modules (tree-shaking opportunities)
- [ ] Note platform-specific differences (iOS vs Android)

### Output: baseline-bundle-analysis.json

```json
{
  "date": "2025-11-06",
  "total_size_mb": 0,
  "largest_dependencies": [
    {"name": "react-native", "size_kb": 0},
    {"name": "expo", "size_kb": 0}
  ],
  "unused_modules": [],
  "platform_specific": {
    "ios_only": [],
    "android_only": []
  },
  "optimization_opportunities": []
}
```

---

## Step 5: Accessibility Audit (1.5 hours) [PARALLEL]

### Objectives
- Verify WCAG AA compliance
- Check screen reader support
- Validate touch target sizes
- Test dynamic type support

### 5.1: Install Tooling

```bash
# Install axe-core for React Native
npm install --save-dev @axe-core/react-native

# Or use manual testing
```

### 5.2: Automated Testing

```bash
# Run axe-core on all screens
# (Requires integration in test files)

# Check for:
# - Missing accessibility labels
# - Insufficient contrast ratios
# - Small touch targets
# - Missing keyboard support
```

### 5.3: Manual Testing

**Screen Reader Testing (iOS):**
1. Enable VoiceOver: Settings → Accessibility → VoiceOver
2. Navigate through each screen
3. Verify all interactive elements have labels
4. Check reading order is logical

**Screen Reader Testing (Android):**
1. Enable TalkBack: Settings → Accessibility → TalkBack
2. Navigate through each screen
3. Verify all interactive elements have labels

**Touch Target Testing:**
- Measure all interactive elements
- iOS minimum: 44pt × 44pt
- Android minimum: 48dp × 48dp

**Contrast Testing:**
- Use contrast checker tool
- Text: 4.5:1 minimum (WCAG AA)
- UI components: 3:1 minimum

**Dynamic Type Testing:**
- iOS: Settings → Display & Brightness → Text Size
- Android: Settings → Display → Font size
- Verify all text scales properly

### Output: baseline-a11y.json

```json
{
  "date": "2025-11-06",
  "screens_tested": 5,
  "wcag_level": "AA",
  "issues": [
    {
      "screen": "login",
      "severity": "high",
      "type": "missing_label",
      "element": "email_input",
      "description": "Email input missing accessibility label"
    }
  ],
  "summary": {
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "total": 0
  },
  "compliance": {
    "screen_reader": "partial",
    "touch_targets": "pass",
    "contrast": "pass",
    "dynamic_type": "pass"
  }
}
```

---

## Step 6: Component Inventory Documentation (1 hour) [PARALLEL]

### Objectives
- List all components in components/ui/
- Document design tokens in constants/
- Identify duplicated patterns
- Note missing components

### Commands

```bash
# List all UI components
find components/ui -type f -name "*.tsx" -o -name "*.ts"

# List all constants
find constants -type f -name "*.ts" -o -name "*.tsx"

# Check for duplicated styles
grep -r "backgroundColor.*#" components/ constants/
grep -r "fontSize.*:" components/ constants/
```

### Inventory Template

**For each component:**
- Name
- File path
- Styling approach (inline, StyleSheet, NativeWind)
- Dependencies
- Notes (duplicates? missing props?)

### Output: component-inventory.md

```markdown
# Component Inventory - Baseline

**Date:** 2025-11-06
**Total Components:** ___

## UI Components

| Name | Path | Styling | Dependencies | Notes |
|------|------|---------|--------------|-------|
| Button | components/ui/Button.tsx | NativeWind | - | Primary button |
| ... | ... | ... | ... | ... |

## Design Tokens

| Token | File | Value | Usage |
|-------|------|-------|-------|
| primary | constants/colors.ts | #2196F3 | Brand color |
| ... | ... | ... | ... |

## Duplicated Patterns

- Inline color values in X files
- Multiple button variants without shared base
- Inconsistent spacing values

## Missing Components

Based on UI Framework Integration Plan:
- [ ] Card component
- [ ] Sheet/Modal component
- [ ] ListItem component
- ...

## Recommendations

- Consolidate color tokens
- Create shared Button base
- Standardize spacing system
```

---

## Step 7: Validation & Documentation (30 min)

### Validation Checklist

```bash
# Verify all reports exist
test -f reports/ui/baseline-performance.json && echo "✅ Performance"
test -f reports/ui/baseline-a11y.json && echo "✅ Accessibility"
test -f reports/ui/baseline-bundle-analysis.json && echo "✅ Bundle"
test -f reports/ui/component-inventory.md && echo "✅ Components"
test -d reports/ui/baseline-screenshots && echo "✅ Screenshots"

# Verify screenshot count
ls reports/ui/baseline-screenshots/*.png | wc -l
# Expected: 10

# Validate JSON files
node -e "JSON.parse(require('fs').readFileSync('reports/ui/baseline-performance.json'))"
node -e "JSON.parse(require('fs').readFileSync('reports/ui/baseline-a11y.json'))"
node -e "JSON.parse(require('fs').readFileSync('reports/ui/baseline-bundle-analysis.json'))"
```

### Update Links Map

Edit `docs/links-map.md`:
- Mark Phase 01 artifacts as created
- Confirm Phase 02 dependencies are ready

---

## Execution Timeline

**Sequential (cannot parallelize):**
1. Step 1: Environment verification (30 min) - **MUST BE FIRST**
2. Step 2: Visual baseline (1 hour) - depends on Step 1

**Parallel (can run together):**
3. Step 3: Performance measurement (2 hours)
4. Step 4: Bundle analysis (1 hour)
5. Step 5: Accessibility audit (1.5 hours)
6. Step 6: Component inventory (1 hour)

**Final:**
7. Step 7: Validation (30 min)

**Total Time:** 6-8 hours (1 working day)

---

## Success Criteria

**All must be TRUE to complete Phase 01:**
- ✅ App runs without critical errors
- ✅ All 10 screenshots captured
- ✅ baseline-performance.json created with all metrics
- ✅ baseline-a11y.json created with audit results
- ✅ baseline-bundle-analysis.json created
- ✅ component-inventory.md created
- ✅ Research notes completed
- ✅ All JSON files valid (parseable)
- ✅ links-map.md updated

---

## Risk Mitigation

**If app won't run:**
- Document issues
- Capture what's available
- Mark Phase 01 as "partial completion"
- Proceed to Phase 02 with caveats

**If tools fail on Windows:**
- Use manual measurement as fallback
- Document methodology
- Note limitations in reports

**If screens are incomplete:**
- Document missing screens
- Capture available screens only
- Note in baseline reports

---

**Status:** Micro-plan complete | Ready for execution
**Next:** Execute steps sequentially with validation
