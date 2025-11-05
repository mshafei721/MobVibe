<!--
Status: planned
Owner: MobVibe Engineering Team
Last updated: 2025-11-05
Phase: 0.5 (Pre-Phase 1)
Related: design-system.md, implementation.md, roadmap.md
-->

# UI Framework Integration Plan

**Phase 0.5: Foundation Selection & Token System**

> **Goal:** Introduce a curated set of UI frameworks and libraries—used systematically and intelligently—while preserving a native iOS/Android feel and top-tier performance.

---

## Table of Contents

- [Background & Context](#background--context)
- [Target Aesthetic](#target-aesthetic)
- [Candidate Libraries](#candidate-libraries)
- [Constraints & Principles](#constraints--principles)
- [Implementation Steps](#implementation-steps)
- [Foundation Decision (Tamagui vs gluestack)](#foundation-decision-tamagui-vs-gluestack)
- [Integration Plan](#integration-plan)
- [Deliverables](#deliverables)
- [Acceptance Criteria](#acceptance-criteria)
- [Verification Loop](#verification-loop)
- [Tools & Commands](#tools--commands)

---

## Background & Context

**Role:** Senior React Native engineer working in Expo/React Native codebase
**Mission:** Systematically integrate UI frameworks while maintaining native feel and performance

**Current State:**
- Expo SDK 52 → Upgrading to SDK 54
- React Native 0.76 → Upgrading to 0.81
- Minimal UI framework (basic components only)
- Custom design tokens in `constants/colors.ts`

**Target State:**
- Single UI foundation (Tamagui OR gluestack UI)
- Unified token system (colors, typography, spacing, motion)
- Adapter layer (no direct vendor imports)
- Native-first interactions (gestures, haptics, 60fps)

---

## Target Aesthetic

**Native-First Principles:**
- ✅ Native interactions: gestures, haptics, inertia physics
- ✅ Platform-appropriate components (iOS/Android patterns)
- ✅ WCAG AA compliant contrast (4.5:1 text, 3:1 UI)
- ✅ Smooth 60fps animations (prefer 120fps on ProMotion)
- ❌ No "webby" UI patterns
- ✅ Prefer platform defaults for improved ergonomics

**Cross-references:**
- [Design System](../design-system.md) - Current design tokens and components
- [Implementation Guide](../implementation.md) - Technical architecture

---

## Candidate Libraries

### Primary Foundation (Choose ONE)

| Library | Strengths | Best For |
|---------|-----------|----------|
| **Tamagui** | High-performance, compile-time styling, web parity, SSR support | Apps needing web version, maximum performance, complex animations |
| **gluestack UI** | Tailwind-like API, fast theming, composable tokens, strong DX | Rapid development, flexible theming, Tailwind familiarity |

### Selective Add-Ons (Cherry-pick only what's needed)

| Library | Purpose | Integration Strategy |
|---------|---------|---------------------|
| **React Native Paper** | Material Design components | Android-forward screens only; theme bridge from tokens |
| **UI Kitten** | Eva Design System widgets | Cherry-pick missing components; no duplicate primitives |
| **React Native Elements** | Lightweight toolkit | Single components via adapters; tree-shake unused |
| **React Native Gifted Chat** | Rich chat UI | Chat screens only; theme via tokens; custom hooks |
| **Lottie for React Native** | Vector animations | Centralized `<Animation/>` component; respect reduced motion |

**Core Dependencies (Always Install):**
- `react-native-gesture-handler` - Native gesture system
- `react-native-reanimated` - 60fps animations on UI thread
- `react-native-haptic-feedback` - Tactile feedback

---

## Constraints & Principles

### 1. Single Source of Truth
- ✅ One primary design system foundation
- ✅ All other libraries plug in via adapters
- ❌ No redundant component kits
- ❌ No style conflicts (one token system)

### 2. Performance Budget
- 🎯 TTI (Time to Interactive): ≤ baseline + 10%
- 🎯 FPS: ≥ 55fps on low-end devices during interactions
- 🎯 Bundle size: ≤ baseline + 10%
- 🎯 Memory: No leaks, efficient re-renders

### 3. Accessibility
- ✅ Screen reader labels on all interactive elements
- ✅ Minimum 44pt touch targets (iOS) / 48dp (Android)
- ✅ Dynamic type support (text scaling)
- ✅ RTL (Right-to-Left) layout support
- ✅ Dark mode with proper contrast
- ✅ Reduced motion respect

### 4. Developer Experience
- ✅ TypeScript strict mode with full type coverage
- ✅ Auto-complete for tokens and components
- ✅ Tree-shaking and lazy loading
- ✅ Clear migration path from old components

---

## Implementation Steps

### **Step 1: Baseline & Goals** (1-2 days)

**Detect Current State:**
```bash
# Check versions
cat package.json | grep -E "(expo|react-native|react)"

# Measure baseline performance
expo start --no-dev --minify
# Record: TTI, app size, memory usage, FPS during scrolling
```

**Capture Metrics:**
- Screenshots of key screens (light/dark mode)
- Accessibility audit snapshot (screen reader, dynamic type)
- Performance report (TTI, FPS, memory)
- Bundle analysis (size, unused modules)

**Save Reports:**
```
reports/ui/
  ├── baseline-performance.json
  ├── baseline-a11y.json
  ├── baseline-screenshots/
  └── baseline-bundle-analysis.json
```

---

### **Step 2: Foundation Decision** (2-3 days)

**Decision Matrix:**

| Criteria | Weight | Tamagui | gluestack UI |
|----------|--------|---------|--------------|
| Performance | 25% | ⭐⭐⭐⭐⭐ Compile-time CSS | ⭐⭐⭐⭐ Runtime styling |
| Web Parity | 20% | ⭐⭐⭐⭐⭐ Full SSR/SSG | ⭐⭐⭐ Basic web support |
| DX (Developer Experience) | 20% | ⭐⭐⭐⭐ Steep learning | ⭐⭐⭐⭐⭐ Tailwind-like |
| Theming Depth | 15% | ⭐⭐⭐⭐ Theme system | ⭐⭐⭐⭐⭐ Token-based |
| Existing Styles | 10% | ⚠️ May require refactor | ✅ Easy migration |
| Community & Docs | 10% | ⭐⭐⭐⭐ Growing | ⭐⭐⭐⭐ Good docs |

**Choose ONE:**

#### Option A: Tamagui (Recommended if...)
- ✅ Need web version (Next.js, Vite)
- ✅ Maximum performance is critical
- ✅ Complex animations and interactions
- ✅ SSR/SSG requirements
- ⚠️ Team comfortable with new paradigm

```bash
npx tamagui@latest init
# Configure tamagui.config.ts with brand tokens
# Enable compiler in babel.config.js
```

#### Option B: gluestack UI (Recommended if...)
- ✅ Rapid development priority
- ✅ Team knows Tailwind CSS
- ✅ Flexible theming requirements
- ✅ Mobile-only (no web parity needed)
- ⚠️ Slightly lower performance ceiling

```bash
npm i @gluestack-ui/themed @gluestack-style/react
# Wrap app in GluestackUIProvider
# Map tokens → config.theme
```

**Document Decision:**
Create `docs/ui/FOUNDATION.md` with:
- Chosen library and rationale
- Score breakdown from decision matrix
- Migration plan from current components
- Performance expectations

---

### **Step 3: Unified Tokens & Theme** (2-3 days)

**Token Categories:**

```typescript
// src/ui/tokens.ts
export const tokens = {
  colors: {
    // Brand (from MobVibe design system)
    primary: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      500: '#2196F3', // Primary navy-blue
      900: '#0D47A1',
    },
    surface: {
      light: '#FFFFFF',
      dark: '#121212',
    },
    accent: {
      orange: '#FF6B35', // Accent orange
      green: '#4CAF50',
      red: '#F44336',
    },
    // Semantic tokens
    text: {
      primary: '#000000E6', // 90% opacity
      secondary: '#00000099', // 60% opacity
      disabled: '#0000003D', // 24% opacity
    },
    // WCAG AA compliant
    contrast: {
      min: 4.5, // Text contrast
      minUI: 3.0, // UI element contrast
    }
  },
  typography: {
    fonts: {
      sans: 'System', // -apple-system on iOS, Roboto on Android
      mono: 'SF Mono', // iOS native monospace
    },
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    }
  },
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },
  radii: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  elevation: {
    // iOS shadow system
    sm: { shadowRadius: 2, shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 } },
    base: { shadowRadius: 4, shadowOpacity: 0.15, shadowOffset: { width: 0, height: 2 } },
    lg: { shadowRadius: 8, shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 } },
    // Android elevation
    android: {
      sm: 2,
      base: 4,
      lg: 8,
    }
  },
  motion: {
    durations: {
      fast: 150,
      base: 250,
      slow: 350,
    },
    easings: {
      default: [0.4, 0.0, 0.2, 1], // Material Design standard
      enter: [0.0, 0.0, 0.2, 1], // Deceleration
      exit: [0.4, 0.0, 1, 1], // Acceleration
    }
  },
  breakpoints: {
    sm: 380,
    md: 768,
    lg: 1024,
  }
} as const;

export type Tokens = typeof tokens;
```

**Export Formats:**
- `src/ui/tokens.ts` - TypeScript (code usage)
- `src/ui/tokens.json` - JSON (Figma, Zeplin, tooling)
- `src/ui/style.d.ts` - TypeScript types for autocomplete

**Theme Files:**
```typescript
// src/ui/theme.ts
import { tokens } from './tokens';

export const lightTheme = {
  ...tokens,
  colors: {
    ...tokens.colors,
    background: tokens.colors.surface.light,
    foreground: tokens.colors.text.primary,
  }
};

export const darkTheme = {
  ...tokens,
  colors: {
    ...tokens.colors,
    background: tokens.colors.surface.dark,
    foreground: '#FFFFFFE6', // 90% white
  }
};
```

**Ensure WCAG AA Contrast:**
```bash
npm i --save-dev polished
# Use polished's readableColor() to validate all text/background combos
```

---

### **Step 4: Primitives & Adapter Layer** (5-7 days)

**Adapter Pattern:**
```
src/ui/
  ├── primitives/      # App components (use these everywhere)
  │   ├── Button.tsx
  │   ├── Text.tsx
  │   ├── Input.tsx
  │   └── ...
  ├── adapters/        # Vendor wrappers (internal only)
  │   ├── tamagui/     # OR gluestack/
  │   ├── paper/
  │   └── elements/
  └── platform/        # iOS/Android specific
      ├── ActionSheet.tsx
      └── Haptics.tsx
```

**Core Primitives:**

```typescript
// src/ui/primitives/Button.tsx
import { Pressable, Text, StyleSheet } from 'react-native';
import { tokens } from '../tokens';
import { haptics } from '../platform/Haptics';

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'base' | 'lg';
  onPress: () => void;
  children: string;
  disabled?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'base',
  onPress,
  children,
  disabled = false
}: ButtonProps) {
  const handlePress = () => {
    haptics.impact('medium'); // Tactile feedback
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={styles.text}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radii.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // iOS minimum touch target
  },
  primary: {
    backgroundColor: tokens.colors.primary[500],
  },
  secondary: {
    backgroundColor: tokens.colors.surface.light,
    borderWidth: 1,
    borderColor: tokens.colors.primary[500],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  sm: { paddingHorizontal: tokens.spacing[3], paddingVertical: tokens.spacing[2] },
  base: { paddingHorizontal: tokens.spacing[4], paddingVertical: tokens.spacing[3] },
  lg: { paddingHorizontal: tokens.spacing[6], paddingVertical: tokens.spacing[4] },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  text: { color: '#FFFFFF', fontSize: tokens.typography.sizes.base },
});
```

**Required Primitives:**
- ✅ `Button` - Primary, secondary, ghost variants
- ✅ `Text` - Heading, body, caption with dynamic type
- ✅ `Heading` - H1, H2, H3 with semantic HTML on web
- ✅ `Input` - Text input with validation states
- ✅ `Card` - Surface container with elevation
- ✅ `Sheet` / `Modal` - Bottom sheet (Android) / Modal (iOS)
- ✅ `ListItem` - FlatList row component
- ✅ `Icon` - Vector icons with size/color props
- ✅ `Divider` - Horizontal/vertical separator
- ✅ `Spinner` - Loading indicator
- ✅ `Badge` - Notification badge
- ✅ `Chip` - Filter/tag component

**Platform Adapters:**
```typescript
// src/ui/platform/ActionSheet.tsx
import { Platform, ActionSheetIOS } from 'react-native';
import { BottomSheet } from '../primitives/BottomSheet'; // Android

export function showActionSheet(options: ActionSheetOptions) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(options, callback);
  } else {
    // Show BottomSheet component on Android
    BottomSheet.show(options);
  }
}
```

---

### **Step 5: Selective Library Integration** (3-5 days)

**Integration Strategy:**

#### React Native Paper (Material Design)
```bash
npm i react-native-paper
```

**Use Cases:**
- ✅ Android-specific screens (Material Design expected)
- ✅ Snackbar notifications (Material pattern)
- ✅ FAB (Floating Action Button) on Android
- ❌ Never use on iOS (breaks platform conventions)

**Theme Bridge:**
```typescript
// src/ui/adapters/paper/theme.ts
import { MD3LightTheme } from 'react-native-paper';
import { tokens } from '../../tokens';

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: tokens.colors.primary[500],
    accent: tokens.colors.accent.orange,
    surface: tokens.colors.surface.light,
  },
};
```

#### UI Kitten / React Native Elements
```bash
npm i @react-native-elements/base
# Install ONLY if missing specific components
```

**Cherry-Pick Strategy:**
- ✅ Import single components via adapters
- ✅ Wrap in `src/ui/adapters/elements/ComponentName.tsx`
- ❌ Never duplicate primitives (no second Button component)
- ✅ Tree-shake unused components

#### React Native Gifted Chat
```bash
npm i react-native-gifted-chat
```

**Use Cases:**
- ✅ Chat screens only (isolated feature)
- ✅ Theme via tokens (customize message bubbles)
- ✅ Add custom hooks for send/receive

```typescript
// src/features/chat/ChatScreen.tsx
import { GiftedChat } from 'react-native-gifted-chat';
import { tokens } from '@/ui/tokens';

<GiftedChat
  theme={{
    colors: {
      primary: tokens.colors.primary[500],
      background: tokens.colors.surface.light,
    }
  }}
/>
```

#### Lottie (Vector Animations)
```bash
expo install lottie-react-native
```

**Centralized Component:**
```typescript
// src/ui/primitives/Animation.tsx
import LottieView from 'lottie-react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { tokens } from '../tokens';

export function Animation({ source, loop = true }: AnimationProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    // Show static first frame
    return <LottieView source={source} progress={0} />;
  }

  return (
    <LottieView
      source={source}
      autoPlay
      loop={loop}
      speed={1.0}
      duration={tokens.motion.durations.base}
    />
  );
}
```

**Best Practices:**
- ✅ Preload JSON files (bundle with app)
- ✅ Respect `prefers-reduced-motion`
- ✅ Use motion tokens for duration
- ❌ Don't overuse (performance cost)

---

### **Step 6: Native Feel Enhancements** (2-3 days)

**Gestures (react-native-gesture-handler + reanimated):**
```typescript
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';

function SwipeableCard() {
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .onChange((event) => {
      translateX.value = event.translationX;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
    });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={{ transform: [{ translateX }] }}>
        {/* Card content */}
      </Animated.View>
    </GestureDetector>
  );
}
```

**Platform Navigation Patterns:**
```typescript
// iOS: Swipe-from-left to go back (automatic with stack navigator)
// Android: Hardware back button (automatic)

// src/navigation/NativeStack.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

// Platform-appropriate animations (slide on iOS, fade on Android)
```

**Haptics Feedback:**
```typescript
// src/ui/platform/Haptics.ts
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const haptics = {
  impact: (style: 'light' | 'medium' | 'heavy') => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle[style]);
    } else {
      // Android vibration patterns
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  selection: () => Haptics.selectionAsync(),
  notification: (type: 'success' | 'warning' | 'error') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType[type]);
  }
};
```

**Native Pickers/Sheets:**
```typescript
// iOS: ActionSheetIOS, DatePickerIOS
// Android: BottomSheet, DatePicker (Material)

import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // Use native iOS picker
} else {
  // Use Material Android picker
}
```

**Typography Metrics:**
```typescript
// Respect platform default fonts
const systemFont = Platform.select({
  ios: '-apple-system',
  android: 'Roboto',
  default: 'System',
});

// Minimum touch targets
const MIN_TOUCH_TARGET = Platform.select({
  ios: 44, // 44pt (Apple HIG)
  android: 48, // 48dp (Material Design)
  default: 44,
});
```

---

### **Step 7: Refactor Key Screens** (5-7 days)

**Migration Strategy:**

1. **Select 3-5 representative screens:**
   - Home screen (lists, cards, navigation)
   - Profile screen (forms, inputs, images)
   - Settings screen (switches, pickers, sections)
   - Chat screen (messages, input, real-time)
   - Code editor screen (syntax highlight, toolbar)

2. **Refactor Process:**
```typescript
// BEFORE: Direct vendor import
import { Button } from 'react-native-paper';

// AFTER: Use primitive
import { Button } from '@/ui/primitives/Button';
```

3. **Remove Direct Vendor Imports:**
```bash
# Find all vendor imports
grep -r "from 'react-native-paper'" src/
grep -r "from '@gluestack" src/

# Should only exist in src/ui/adapters/*
```

4. **Verify Accessibility:**
```typescript
// Add accessibility props to all interactive elements
<Button
  accessibilityLabel="Submit form"
  accessibilityHint="Double tap to submit your response"
  accessibilityRole="button"
/>

// Support dynamic type
<Text style={{ fontSize: scaleFontSize(16) }}>
  {content}
</Text>

// RTL layout support
<View style={{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}>
```

5. **Test Checklist per Screen:**
- [ ] Light mode renders correctly
- [ ] Dark mode renders correctly
- [ ] Dynamic type (small → XXXL) works
- [ ] Screen reader reads all elements
- [ ] RTL layout (Arabic, Hebrew) works
- [ ] Gestures feel native (swipes, long-press)
- [ ] Haptics fire on interactions
- [ ] 60fps scrolling and animations
- [ ] No console warnings

---

### **Step 8: Performance & Stability** (3-5 days)

**Enable Compiler (if using Tamagui):**
```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      '@tamagui/babel-plugin',
      {
        components: ['tamagui'],
        config: './tamagui.config.ts',
        logTimings: true,
      }
    ]
  ]
};
```

**Measure Performance:**
```bash
# Production build
expo build:android --release
expo build:ios --release

# Measure TTI
npx react-native-performance-monitor

# Measure FPS
# Use Xcode Instruments (iOS) or Android Profiler

# Measure memory
# Use React DevTools Profiler
```

**Optimization Checklist:**
- [ ] Enable Hermes (JavaScript engine)
- [ ] Memoize expensive components (`React.memo`)
- [ ] Use `useMemo` for computed values
- [ ] Use `useCallback` for event handlers
- [ ] Implement `getItemLayout` for FlatList
- [ ] Lazy load images with `expo-image`
- [ ] Code split large screens with `React.lazy`

**Audit Styles for Re-renders:**
```typescript
// BAD: Creates new object on every render
<View style={{ padding: 16 }} />

// GOOD: Static StyleSheet
const styles = StyleSheet.create({
  container: { padding: 16 }
});
<View style={styles.container} />
```

**Performance Targets:**
- ✅ TTI ≤ baseline + 10%
- ✅ FPS ≥ 55 during scrolling (low-end device)
- ✅ Memory usage stable (no leaks)
- ✅ Bundle size ≤ baseline + 10%

---

### **Step 9: Testing & Theming QA** (3-5 days)

**Snapshot Tests (Jest):**
```typescript
// src/ui/primitives/__tests__/Button.test.tsx
import { render } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders primary variant', () => {
    const { toJSON } = render(
      <Button variant="primary" onPress={() => {}}>
        Submit
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders in dark mode', () => {
    const { toJSON } = render(
      <ThemeProvider theme={darkTheme}>
        <Button variant="primary" onPress={() => {}}>Submit</Button>
      </ThemeProvider>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
```

**RTL Tests:**
```typescript
import { I18nManager } from 'react-native';

beforeEach(() => {
  I18nManager.forceRTL(true);
});

it('renders correctly in RTL', () => {
  const { getByText } = render(<Card title="عنوان" />);
  expect(getByText('عنوان')).toBeTruthy();
});
```

**Interaction Tests:**
```typescript
import { fireEvent } from '@testing-library/react-native';

it('calls onPress when tapped', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <Button onPress={onPress}>Tap Me</Button>
  );

  fireEvent.press(getByText('Tap Me'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

**Visual Regression Tests:**
```bash
# Use Chromatic or Percy for visual diffs
npm i --save-dev @storybook/react-native chromatic

# Create stories for each primitive
# Upload to Chromatic for review
```

**E2E Critical Flows (Detox/Maestro):**
```yaml
# maestro/login-flow.yaml
appId: com.mobvibe.app
---
- launchApp
- tapOn: "Log In"
- inputText: "user@example.com"
- tapOn: "Continue"
- assertVisible: "Welcome back"
```

**Test Reports Location:**
```
reports/ui-tests/
  ├── snapshots/
  ├── rtl-tests/
  ├── a11y-tests/
  └── visual-diffs/
```

---

### **Step 10: Documentation, Migrations, PRs** (3-5 days)

**Documentation Files:**

1. **`docs/ui/USAGE.md`** - How to use primitives
```markdown
# UI Component Usage

## Button

import { Button } from '@/ui/primitives/Button';

<Button variant="primary" size="lg" onPress={handleSubmit}>
  Submit
</Button>

### Props
- variant: 'primary' | 'secondary' | 'ghost'
- size: 'sm' | 'base' | 'lg'
- onPress: () => void
- disabled?: boolean
```

2. **`docs/ui/THEMING.md`** - Theme system guide
```markdown
# Theming Guide

## Token System
All design tokens live in `src/ui/tokens.ts`.

## Creating a New Theme
export const customTheme = {
  ...tokens,
  colors: {
    ...tokens.colors,
    primary: { 500: '#FF0000' }, // Custom primary color
  }
};

## Dark Mode
The app automatically switches themes based on system preference.
```

3. **`docs/ui/ADAPTERS.md`** - Adapter pattern docs
```markdown
# Adapter Pattern

## Why Adapters?
Prevents vendor lock-in. App code never imports vendor libraries directly.

## Structure
src/ui/
  ├── primitives/   ← Use these in app code
  └── adapters/     ← Internal vendor wrappers

## Adding a New Adapter
1. Create adapter file in `src/ui/adapters/vendor/Component.tsx`
2. Import vendor component
3. Map props to vendor API
4. Export from primitives with generic name
```

4. **`docs/ui/MIGRATION_GUIDE.md`** - Step-by-step migration
```markdown
# Migration Guide: Old Components → New Primitives

## Step 1: Install Dependencies
npm install (see package.json for new deps)

## Step 2: Update Imports
# Find all old imports
grep -r "from 'react-native-paper'" src/

# Replace with primitives
- import { Button } from 'react-native-paper';
+ import { Button } from '@/ui/primitives/Button';

## Step 3: Update Props
Old Paper API → New Primitive API
- <Button mode="contained"> → <Button variant="primary">
- <Button mode="outlined"> → <Button variant="secondary">

## Step 4: Test & Verify
- npm test
- npm run lint
- Manual QA (light/dark mode, a11y)
```

**Pull Request Strategy:**

1. **PR #1: Foundation Setup**
   - Install dependencies
   - Configure Tamagui/gluestack
   - Add tokens.ts and theme.ts
   - Update babel.config.js

2. **PR #2: Primitives & Adapters**
   - Create all primitive components
   - Add platform adapters
   - Add tests and stories

3. **PR #3: Screen Refactors (per feature)**
   - Refactor Home screen
   - Refactor Profile screen
   - Refactor Settings screen
   - (Separate PR per screen for easier review)

4. **PR #4: QA & Performance**
   - Add E2E tests
   - Performance benchmarks
   - A11y audit fixes
   - Visual regression tests

5. **PR #5: Documentation**
   - All docs/ui/* files
   - Migration guide
   - Updated README

**PR Template:**
```markdown
## Summary
Refactor Home screen to use new UI primitives

## Changes
- Replace Paper Button with primitive Button
- Replace Paper Card with primitive Card
- Add haptics to interactions
- Fix accessibility labels

## Testing
- [ ] Light mode ✅
- [ ] Dark mode ✅
- [ ] Screen reader ✅
- [ ] RTL layout ✅
- [ ] FPS ≥ 55 ✅

## Screenshots
[Before/After screenshots]

## Performance
- TTI: 1.2s → 1.1s (8% improvement)
- Bundle: +45KB (within 10% budget)
```

---

## Integration Plan

### Option A: Tamagui (High Performance)

**Installation:**
```bash
npx tamagui@latest init
npm install @tamagui/config @tamagui/core
```

**Configuration:**
```typescript
// tamagui.config.ts
import { config } from '@tamagui/config/v3';
import { tokens } from './src/ui/tokens';

export default createTamagui({
  ...config,
  tokens: {
    color: tokens.colors,
    space: tokens.spacing,
    size: tokens.spacing,
    radius: tokens.radii,
  },
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  media: {
    sm: { maxWidth: tokens.breakpoints.sm },
    md: { maxWidth: tokens.breakpoints.md },
    lg: { maxWidth: tokens.breakpoints.lg },
  },
});
```

**Enable Compiler:**
```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      '@tamagui/babel-plugin',
      {
        components: ['tamagui'],
        config: './tamagui.config.ts',
        logTimings: true,
        disableExtraction: process.env.NODE_ENV === 'development',
      }
    ]
  ]
};
```

**Usage:**
```typescript
import { Button, Text, YStack } from 'tamagui';

export function Screen() {
  return (
    <YStack padding="$4" gap="$2">
      <Text fontSize="$6" fontWeight="bold">
        Welcome
      </Text>
      <Button
        backgroundColor="$primary500"
        pressStyle={{ opacity: 0.7 }}
        onPress={handlePress}
      >
        Get Started
      </Button>
    </YStack>
  );
}
```

**Performance Notes:**
- ✅ Compile-time CSS extraction
- ✅ 50-70% faster than runtime styling
- ✅ Smaller bundle (no runtime style computation)
- ⚠️ Longer build times during development

---

### Option B: gluestack UI (Fast Theming)

**Installation:**
```bash
npm install @gluestack-ui/themed @gluestack-style/react
```

**Configuration:**
```typescript
// app/_layout.tsx
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@/gluestack-ui.config';

export default function RootLayout() {
  return (
    <GluestackUIProvider config={config}>
      <Stack />
    </GluestackUIProvider>
  );
}
```

**Theme Config:**
```typescript
// gluestack-ui.config.ts
import { createConfig } from '@gluestack-style/react';
import { tokens } from './src/ui/tokens';

export const config = createConfig({
  tokens: {
    colors: tokens.colors,
    space: tokens.spacing,
    radii: tokens.radii,
    fontSizes: tokens.typography.sizes,
  },
  themes: {
    light: {
      colors: {
        primary: tokens.colors.primary[500],
        background: tokens.colors.surface.light,
      }
    },
    dark: {
      colors: {
        primary: tokens.colors.primary[500],
        background: tokens.colors.surface.dark,
      }
    }
  }
});
```

**Usage:**
```typescript
import { Button, Text, VStack } from '@gluestack-ui/themed';

export function Screen() {
  return (
    <VStack space="md" padding="$4">
      <Text fontSize="$2xl" fontWeight="$bold">
        Welcome
      </Text>
      <Button
        bg="$primary"
        _pressed={{ opacity: 0.7 }}
        onPress={handlePress}
      >
        <Text color="$white">Get Started</Text>
      </Button>
    </VStack>
  );
}
```

**Performance Notes:**
- ✅ Fast theming and token switching
- ✅ Tailwind-like developer experience
- ✅ Smaller learning curve
- ⚠️ Runtime styling (slightly slower than Tamagui)

---

## Deliverables

### Code Artifacts

```
src/ui/
  ├── tokens.ts             # Design tokens (colors, spacing, typography, motion)
  ├── tokens.json           # JSON export for design tools
  ├── style.d.ts            # TypeScript definitions
  ├── theme.ts              # Light/dark themes
  ├── primitives/           # App components (Button, Text, Card, etc.)
  │   ├── Button.tsx
  │   ├── Text.tsx
  │   ├── Heading.tsx
  │   ├── Input.tsx
  │   ├── Card.tsx
  │   ├── Sheet.tsx
  │   ├── Modal.tsx
  │   ├── ListItem.tsx
  │   ├── Icon.tsx
  │   ├── Divider.tsx
  │   ├── Spinner.tsx
  │   ├── Badge.tsx
  │   └── Chip.tsx
  ├── adapters/             # Vendor wrappers (internal only)
  │   ├── tamagui/          # OR gluestack/
  │   ├── paper/
  │   └── elements/
  └── platform/             # Platform-specific utilities
      ├── ActionSheet.tsx
      ├── Haptics.tsx
      └── Picker.tsx
```

### Documentation

```
docs/ui/
  ├── FOUNDATION.md         # Decision rationale (Tamagui vs gluestack)
  ├── USAGE.md              # How to use primitives
  ├── THEMING.md            # Theme system and tokens
  ├── ADAPTERS.md           # Adapter pattern explanation
  └── MIGRATION_GUIDE.md    # Step-by-step migration from old components
```

### Reports

```
reports/ui/
  ├── baseline-performance.json
  ├── final-performance.json
  ├── baseline-a11y.json
  ├── final-a11y.json
  ├── baseline-bundle-analysis.json
  ├── final-bundle-analysis.json
  ├── AUDIT.md              # Verification results
  └── screenshots/
      ├── before/
      └── after/
```

### Refactored Screens

- ✅ Home screen (lists, cards, navigation)
- ✅ Profile screen (forms, inputs, images)
- ✅ Settings screen (switches, pickers, sections)
- ✅ Chat screen (messages, input, real-time)
- ✅ Code editor screen (syntax highlight, toolbar)

### Pull Requests

1. **PR #1:** Foundation setup (dependencies, config, tokens)
2. **PR #2:** Primitives & adapters (all components + tests)
3. **PR #3-7:** Screen refactors (one PR per screen)
4. **PR #8:** QA & performance (E2E tests, benchmarks)
5. **PR #9:** Documentation (all docs/ui/* files)

---

## Acceptance Criteria

### 1. Single Source of Truth ✅
- [ ] All tokens defined in `src/ui/tokens.ts`
- [ ] Zero token conflicts across libraries
- [ ] No direct vendor imports outside `src/ui/adapters/*`
- [ ] All components use primitives from `src/ui/primitives/*`

### 2. Native Feel ✅
- [ ] Platform-appropriate components (iOS/Android patterns)
- [ ] Gestures feel native (swipes, long-press, inertia)
- [ ] Haptics fire on interactions
- [ ] Touch targets ≥ 44pt (iOS) / 48dp (Android)
- [ ] Platform fonts (San Francisco on iOS, Roboto on Android)

### 3. Accessibility ✅
- [ ] All interactive elements have accessibility labels
- [ ] Screen reader reads all content correctly
- [ ] Dynamic type support (text scales with system settings)
- [ ] RTL layout works (Arabic, Hebrew)
- [ ] WCAG AA contrast (4.5:1 text, 3:1 UI)
- [ ] Dark mode with proper contrast
- [ ] Reduced motion respected

### 4. Performance ✅
- [ ] TTI ≤ baseline + 10%
- [ ] FPS ≥ 55 during scrolling (low-end device)
- [ ] No memory leaks
- [ ] Bundle size ≤ baseline + 10%
- [ ] Smooth animations (60fps minimum)

### 5. Code Quality ✅
- [ ] Zero duplicate components across libraries
- [ ] TypeScript strict mode passes
- [ ] All tests pass (unit, snapshot, E2E)
- [ ] No console warnings
- [ ] Linter passes

### 6. Documentation ✅
- [ ] `FOUNDATION.md` explains decision
- [ ] `USAGE.md` shows how to use primitives
- [ ] `THEMING.md` explains token system
- [ ] `ADAPTERS.md` explains pattern
- [ ] `MIGRATION_GUIDE.md` enables team to migrate screens

---

## Verification Loop

**Predicates (Must all pass):**

```typescript
type VerificationPredicates = {
  foundation_locked: boolean;           // One foundation chosen, configured
  tokens_single_source: boolean;        // Zero token conflicts
  no_vendor_leakage: boolean;           // Zero direct vendor imports in app code
  native_feel: boolean;                 // Zero a11y issues, zero gesture glitches
  perf_ok: boolean;                     // TTI ≤ +10%, FPS ≥ 55
  docs_ready: boolean;                  // All docs written
};

const predicates: VerificationPredicates = {
  foundation_locked: foundationSelected === true,
  tokens_single_source: tokenConflicts === 0,
  no_vendor_leakage: directVendorImports === 0,
  native_feel: a11yIssues === 0 && gestureGlitches === 0,
  perf_ok: ttiDelta <= 0.10 && avgFps >= 55,
  docs_ready: docsMissing === 0,
};
```

**Verification Loop:**

```
1. Run automated checks:
   - Scan for direct vendor imports: grep -r "from 'react-native-paper'" src/
   - Run a11y audit: npx axe-core/react-native
   - Measure performance: expo-performance-monitor
   - Check bundle size: npx react-native-bundle-visualizer

2. Review failures:
   - Vendor leakage detected? → Move to adapter
   - A11y contrast failure? → Adjust token colors
   - FPS < 55? → Profile and optimize
   - TTI too high? → Enable compiler/lazy loading

3. Apply minimal fix:
   - Fix one issue at a time
   - Re-run targeted checks
   - Update reports/ui/AUDIT.md

4. Repeat until all predicates pass
```

**Automated Audit Script:**

```bash
#!/bin/bash
# scripts/ui-audit.sh

echo "🔍 UI Framework Audit"
echo "===================="

# Check 1: Foundation locked
if [ -f "tamagui.config.ts" ] || [ -f "gluestack-ui.config.ts" ]; then
  echo "✅ Foundation: Locked"
else
  echo "❌ Foundation: Not configured"
fi

# Check 2: Token conflicts
TOKEN_CONFLICTS=$(grep -r "color:" src/ | grep -v "tokens.colors" | wc -l)
if [ "$TOKEN_CONFLICTS" -eq 0 ]; then
  echo "✅ Tokens: Single source"
else
  echo "⚠️  Tokens: $TOKEN_CONFLICTS hardcoded colors found"
fi

# Check 3: Vendor leakage
VENDOR_IMPORTS=$(grep -r "from 'react-native-paper'" src/ | grep -v "src/ui/adapters" | wc -l)
if [ "$VENDOR_IMPORTS" -eq 0 ]; then
  echo "✅ Vendor: No leakage"
else
  echo "❌ Vendor: $VENDOR_IMPORTS direct imports outside adapters"
fi

# Check 4: Accessibility
A11Y_ISSUES=$(npx axe-core/react-native | grep "violations" | wc -l)
if [ "$A11Y_ISSUES" -eq 0 ]; then
  echo "✅ A11y: No issues"
else
  echo "❌ A11y: $A11Y_ISSUES violations found"
fi

# Check 5: Performance
expo-performance-monitor --output reports/ui/perf.json
TTI=$(jq '.tti' reports/ui/perf.json)
FPS=$(jq '.avgFps' reports/ui/perf.json)

if [ "$FPS" -ge 55 ]; then
  echo "✅ Performance: FPS $FPS"
else
  echo "❌ Performance: FPS $FPS (target: ≥55)"
fi

# Check 6: Documentation
DOCS_MISSING=0
for doc in FOUNDATION.md USAGE.md THEMING.md ADAPTERS.md MIGRATION_GUIDE.md; do
  if [ ! -f "docs/ui/$doc" ]; then
    echo "❌ Docs: Missing $doc"
    DOCS_MISSING=$((DOCS_MISSING + 1))
  fi
done

if [ "$DOCS_MISSING" -eq 0 ]; then
  echo "✅ Docs: Complete"
fi

echo "===================="
echo "Audit complete. See reports/ui/AUDIT.md for details."
```

---

## Tools & Commands

### Installation Commands

```bash
# Core dependencies (always install)
expo install react-native-gesture-handler react-native-reanimated
expo install lottie-react-native
expo install expo-haptics

# Primary foundation (choose ONE)
npx tamagui@latest init                                    # Option A: Tamagui
npm i @gluestack-ui/themed @gluestack-style/react         # Option B: gluestack UI

# Selective add-ons (install only if needed)
npm i react-native-paper                                   # Material Design
npm i @react-native-elements/base                          # Lightweight toolkit
npm i @ui-kitten/components @ui-kitten/eva-icons          # Eva Design
npm i react-native-gifted-chat                             # Chat UI
```

### Analysis Commands

```bash
# Bundle analysis
expo export --platform ios
npx react-native-bundle-visualizer

# Dependency check
npx depcheck

# Find unused dependencies
npm prune
```

### Testing Commands

```bash
# Unit tests
npm test

# Snapshot tests
npm test -- -u

# E2E tests
npx maestro test maestro/
# OR
npx detox test
```

### Performance Commands

```bash
# Measure TTI and FPS
npx expo-performance-monitor

# Profile with Xcode Instruments (iOS)
open -a Instruments

# Profile with Android Studio (Android)
adb shell am profile start <package>
```

### Accessibility Commands

```bash
# A11y audit
npx axe-core/react-native

# Manual checks
# iOS: Enable VoiceOver in Accessibility settings
# Android: Enable TalkBack in Accessibility settings
```

### Audit Commands

```bash
# Run full UI audit
./scripts/ui-audit.sh

# Check vendor leakage
grep -r "from 'react-native-paper'" src/ | grep -v adapters

# Check hardcoded colors
grep -r "color:" src/ | grep -v "tokens.colors"

# Check a11y labels
grep -r "accessibilityLabel" src/ -c
```

---

## Timeline Estimate

**Total Duration:** 3-4 weeks (15-20 working days)

| Step | Task | Duration | Dependencies |
|------|------|----------|--------------|
| 1 | Baseline & Goals | 1-2 days | None |
| 2 | Foundation Decision | 2-3 days | Step 1 |
| 3 | Unified Tokens & Theme | 2-3 days | Step 2 |
| 4 | Primitives & Adapters | 5-7 days | Step 3 |
| 5 | Selective Library Integration | 3-5 days | Step 4 |
| 6 | Native Feel Enhancements | 2-3 days | Step 4 |
| 7 | Refactor Key Screens | 5-7 days | Steps 4-6 |
| 8 | Performance & Stability | 3-5 days | Step 7 |
| 9 | Testing & Theming QA | 3-5 days | Step 7 |
| 10 | Docs, Migrations, PRs | 3-5 days | Steps 7-9 |

**Critical Path:**
```
Baseline → Foundation Decision → Tokens → Primitives → Screen Refactors → QA → Docs
```

**Parallelizable Work:**
- Steps 5 & 6 can overlap (library integration + native enhancements)
- Steps 8 & 9 can overlap (performance + testing)

---

## Risk Mitigation

### Risk 1: Foundation Choice Regret
**Mitigation:**
- Build proof-of-concept with both Tamagui and gluestack
- Test on real device with complex screen
- Measure performance before committing

### Risk 2: Performance Regression
**Mitigation:**
- Establish baseline metrics before starting
- Measure after each major step
- Use performance budgets (TTI, FPS, bundle size)
- Enable compiler/optimizations early

### Risk 3: Accessibility Gaps
**Mitigation:**
- Test with screen reader from day 1
- Use automated a11y audits
- Test with real users (if possible)
- Document all a11y patterns

### Risk 4: Scope Creep
**Mitigation:**
- Only refactor 3-5 representative screens
- Leave remaining screens for follow-up work
- Focus on foundation quality over quantity

### Risk 5: Team Adoption
**Mitigation:**
- Comprehensive documentation (USAGE.md, THEMING.md)
- Live demo sessions
- Migration guide with examples
- Pair programming for first screens

---

## Success Metrics

**Quantitative:**
- ✅ TTI ≤ baseline + 10%
- ✅ FPS ≥ 55 on low-end device
- ✅ Bundle size ≤ baseline + 10%
- ✅ Zero a11y violations
- ✅ 100% type coverage (TypeScript strict)
- ✅ 80%+ test coverage

**Qualitative:**
- ✅ Native feel (matches platform conventions)
- ✅ Consistent design (all screens use primitives)
- ✅ Developer velocity (faster to build new screens)
- ✅ Maintainability (easy to update tokens/theme)

---

## References

- [Tamagui Documentation](https://tamagui.dev/)
- [gluestack UI Documentation](https://gluestack.io/)
- [React Native Paper](https://reactnativepaper.com/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design 3](https://m3.material.io/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Cross-references:**
- [Design System](../design-system.md) - Current design tokens
- [Implementation Guide](../implementation.md) - Technical stack
- [Roadmap](../roadmap.md) - Phase 1 Foundation Upgrade

---

**Document Status:** Planned (Pre-Phase 1)
**Last Updated:** 2025-11-05
**Owner:** MobVibe Engineering Team
