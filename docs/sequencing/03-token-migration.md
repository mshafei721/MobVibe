# Token Migration Plan: constants/ → src/ui/tokens/

**Date:** 2025-11-06
**Phase:** 03 - Token System Design
**Strategy:** Create comprehensive token system with backward compatibility

---

## Executive Summary

**Goal:** Migrate from basic `constants/` files to a comprehensive, production-grade token system in `src/ui/tokens/` while maintaining backward compatibility.

**Approach:**
- Create new token system in parallel (non-breaking)
- Keep `constants/` files working during Phase 03
- Component migration happens in Phase 04-05
- Deprecation and cleanup after full migration

---

## Current State Analysis

### Existing Token Files

**constants/colors.ts:**
- ❌ Only single shade colors (primary.500, secondary.500)
- ❌ No 50-900 color scales
- ❌ Limited semantic colors (success, error, status only)
- ❌ No warning, info colors
- ❌ Hard-coded text colors (#000, #666, #999)
- ❌ No dark mode support

**constants/typography.ts:**
- ✅ Good platform-specific fonts (iOS System, Android Roboto)
- ✅ Comprehensive font sizes (xs-4xl)
- ✅ Font weights (normal-bold)
- ✅ Line heights (tight, normal, relaxed)
- ❌ Missing letter spacing
- ❌ Missing larger heading sizes (5xl, 6xl)

**constants/spacing.ts:**
- ✅ Good spacing scale (0-20, 8px base)
- ✅ Border radius variants (none-full)
- ⚠️ Could extend to larger sizes

**constants/config.ts:**
- ✅ Keep as-is (app config, not design tokens)

### Missing Token Categories

1. **Motion/Animation** - No duration or easing tokens
2. **Elevation/Shadows** - No iOS shadow or Android elevation tokens
3. **Dark Mode** - No dark mode color variants
4. **Semantic Tokens** - Limited semantic meaning (success, error only)

---

## Target State: Comprehensive Token System

### File Structure

```
src/ui/
├── tokens/
│   ├── colors.ts          # Full color scales + semantic + dark mode
│   ├── typography.ts      # Enhanced typography + letter spacing
│   ├── spacing.ts         # Extended spacing + border radius
│   ├── motion.ts          # NEW: Animation durations + easing
│   ├── elevation.ts       # NEW: iOS shadows + Android elevation
│   └── index.ts           # Re-export all tokens
├── tokens.ts              # Main export
├── tokens.json            # JSON export for tooling
└── __demo__/
    └── TokenDemo.tsx      # Visual token validation
```

---

## Token Specifications

### 1. Colors (colors.ts)

#### Color Scales (Material Design Algorithm)

**Primary Scale (Base: #2196F3 blue):**
```typescript
primary: {
  50: '#E3F2FD',   // Lightest (95% white tint)
  100: '#BBDEFB',  // Very light
  200: '#90CAF9',  // Light
  300: '#64B5F6',  // Medium light
  400: '#42A5F5',  // Medium
  500: '#2196F3',  // Base (current primary.500)
  600: '#1E88E5',  // Medium dark
  700: '#1976D2',  // Dark
  800: '#1565C0',  // Very dark
  900: '#0D47A1',  // Darkest (black shade)
}
```

**Secondary Scale (Base: #9C27B0 purple):**
```typescript
secondary: {
  50: '#F3E5F5',
  100: '#E1BEE7',
  200: '#CE93D8',
  300: '#BA68C8',
  400: '#AB47BC',
  500: '#9C27B0',  // Base (current secondary.500)
  600: '#8E24AA',
  700: '#7B1FA2',
  800: '#6A1B9A',
  900: '#4A148C',
}
```

**Success Scale (Base: #4CAF50 green):**
```typescript
success: {
  50: '#E8F5E9',
  100: '#C8E6C9',
  200: '#A5D6A7',
  300: '#81C784',
  400: '#66BB6A',
  500: '#4CAF50',  // Base (current success)
  600: '#43A047',
  700: '#388E3C',
  800: '#2E7D32',
  900: '#1B5E20',
}
```

**Error Scale (Base: #F44336 red):**
```typescript
error: {
  50: '#FFEBEE',
  100: '#FFCDD2',
  200: '#EF9A9A',
  300: '#E57373',
  400: '#EF5350',
  500: '#F44336',  // Base (current error)
  600: '#E53935',
  700: '#D32F2F',
  800: '#C62828',
  900: '#B71C1C',
}
```

**Warning Scale (NEW - Base: #FF9800 orange):**
```typescript
warning: {
  50: '#FFF3E0',
  100: '#FFE0B2',
  200: '#FFCC80',
  300: '#FFB74D',
  400: '#FFA726',
  500: '#FF9800',  // Base
  600: '#FB8C00',
  700: '#F57C00',
  800: '#EF6C00',
  900: '#E65100',
}
```

**Info Scale (NEW - Base: #03A9F4 cyan):**
```typescript
info: {
  50: '#E1F5FE',
  100: '#B3E5FC',
  200: '#81D4FA',
  300: '#4FC3F7',
  400: '#29B6F6',
  500: '#03A9F4',  // Base
  600: '#039BE5',
  700: '#0288D1',
  800: '#0277BD',
  900: '#01579B',
}
```

**Neutral Scale (NEW - Gray scale):**
```typescript
neutral: {
  50: '#FAFAFA',   // Near white
  100: '#F5F5F5',
  200: '#EEEEEE',
  300: '#E0E0E0',
  400: '#BDBDBD',
  500: '#9E9E9E',  // Mid gray
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',  // Near black
  950: '#121212',  // Darkest (for dark mode backgrounds)
}
```

#### Semantic Color Tokens (Light Mode)

```typescript
export const colorsLight = {
  // Base scales
  primary: { /* 50-900 */ },
  secondary: { /* 50-900 */ },
  success: { /* 50-900 */ },
  error: { /* 50-900 */ },
  warning: { /* 50-900 */ },
  info: { /* 50-900 */ },
  neutral: { /* 50-950 */ },

  // Text colors
  text: {
    primary: neutral[900],      // High contrast (black-ish)
    secondary: neutral[700],    // Medium contrast
    tertiary: neutral[500],     // Low contrast
    disabled: neutral[400],     // Very low contrast
    inverse: neutral[50],       // For dark backgrounds
  },

  // Background colors
  background: {
    base: '#FFFFFF',            // Main background
    subtle: neutral[50],        // Subtle contrast
  },

  // Surface colors (elevation)
  surface: {
    0: '#FFFFFF',               // Base level
    1: neutral[50],             // Elevated 1 level
    2: neutral[100],            // Elevated 2 levels
    3: neutral[200],            // Elevated 3 levels
  },

  // Border colors
  border: {
    subtle: neutral[200],       // Very light dividers
    base: neutral[300],         // Standard borders
    strong: neutral[400],       // Emphasized borders
    primary: primary[500],      // Focus/active states
    success: success[500],      // Success borders
    error: error[500],          // Error/validation
    warning: warning[500],      // Warning borders
  },

  // Code colors (preserve existing)
  code: {
    background: '#1E1E1E',
    text: '#D4D4D4',
  },
};
```

#### Semantic Color Tokens (Dark Mode)

```typescript
export const colorsDark = {
  // Base scales (same as light mode)
  primary: { /* 50-900 */ },
  secondary: { /* 50-900 */ },
  success: { /* 50-900 */ },
  error: { /* 50-900 */ },
  warning: { /* 50-900 */ },
  info: { /* 50-900 */ },
  neutral: { /* 50-950 */ },

  // Text colors (inverted)
  text: {
    primary: neutral[50],       // High contrast (white-ish)
    secondary: neutral[300],    // Medium contrast
    tertiary: neutral[500],     // Low contrast
    disabled: neutral[600],     // Very low contrast
    inverse: neutral[900],      // For light backgrounds
  },

  // Background colors
  background: {
    base: neutral[950],         // Very dark main background
    subtle: neutral[900],       // Subtle contrast
  },

  // Surface colors (elevation - lighter as they elevate)
  surface: {
    0: neutral[900],            // Base level
    1: neutral[800],            // Elevated 1 level
    2: neutral[700],            // Elevated 2 levels
    3: neutral[600],            // Elevated 3 levels
  },

  // Border colors
  border: {
    subtle: neutral[800],       // Very dark dividers
    base: neutral[700],         // Standard borders
    strong: neutral[600],       // Emphasized borders
    primary: primary[400],      // Lighter in dark mode
    success: success[400],
    error: error[400],
    warning: warning[400],
  },

  // Code colors
  code: {
    background: '#0D0D0D',      // Darker in dark mode
    text: '#D4D4D4',
  },
};

// Default export (light mode)
export const colors = colorsLight;
```

### 2. Typography (typography.ts)

**Enhanced Typography Tokens:**

```typescript
import { Platform } from 'react-native';

export const typography = {
  // Font families (preserve + enhance)
  fontFamily: {
    sans: Platform.OS === 'ios' ? 'System' : 'Roboto',
    mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    // Future: Add custom fonts here
  },

  // Font sizes (extend existing)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,     // Body text default
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,    // Enhanced
    '4xl': 36,    // Enhanced (was 48)
    '5xl': 48,    // NEW
    '6xl': 60,    // NEW (large headings)
  },

  // Font weights (preserve)
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights (preserve)
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing (NEW)
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
};
```

### 3. Spacing (spacing.ts)

**Enhanced Spacing Tokens:**

```typescript
export const spacing = {
  // Spacing scale (preserve + extend)
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
  20: 80,
  24: 96,   // NEW
  32: 128,  // NEW
};

export const borderRadius = {
  // Border radius (preserve)
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
```

### 4. Motion (motion.ts) - NEW

**Animation Tokens:**

```typescript
export const motion = {
  // Duration (milliseconds)
  duration: {
    instant: 0,     // No animation
    fast: 150,      // Micro-interactions, tooltips
    base: 200,      // Standard transitions
    medium: 300,    // Modals, drawers
    slow: 500,      // Page transitions
    slower: 700,    // Complex animations
  },

  // Easing functions
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',       // Starts slow, ends fast
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',      // Starts fast, ends slow (most common)
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',  // Slow-fast-slow
    // spring: Platform-specific spring config
  },
};
```

### 5. Elevation (elevation.ts) - NEW

**Shadow & Elevation Tokens:**

```typescript
export const elevation = {
  // iOS shadows
  shadow: {
    none: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.44,
      shadowRadius: 10.32,
    },
  },

  // Android elevation
  android: {
    none: 0,
    sm: 2,
    base: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};
```

---

## Migration Execution Plan

### Phase A: Create New Token System (Phase 03 - Non-Breaking)

**Tasks:**
1. ✅ Research token best practices
2. ✅ Plan migration strategy (this document)
3. [ ] Create `src/ui/tokens/` directory structure
4. [ ] Build `colors.ts` with full scales + light/dark modes
5. [ ] Build `typography.ts` with enhancements
6. [ ] Build `spacing.ts` with extensions
7. [ ] Build `motion.ts` (new)
8. [ ] Build `elevation.ts` (new)
9. [ ] Create `tokens/index.ts` re-export
10. [ ] Create `src/ui/tokens.ts` main export
11. [ ] Generate `src/ui/tokens.json` for tooling
12. [ ] Configure `tailwind.config.js` with new tokens
13. [ ] Initialize `gluestack-ui.config.ts` with token mapping
14. [ ] Build token demo app for validation
15. [ ] **Keep `constants/` files untouched** (still working)

**Result:** Both systems work in parallel, no breaking changes.

### Phase B: Gradual Migration (Phase 04-05 - Parallel Systems)

**Tasks:**
1. Update new components to use `src/ui/tokens`
2. Gradually update existing components one at a time
3. Track migration progress with audit script
4. Both `constants/` and `src/ui/tokens/` work in parallel
5. No breaking changes during this phase

**Result:** Progressive migration with safety.

### Phase C: Deprecation and Cleanup (Phase 06+ - Breaking)

**Tasks:**
1. When 100% of components use new tokens:
2. Add deprecation warnings to `constants/` exports
3. Create migration guide for external consumers
4. After 1 sprint, remove:
   - `constants/colors.ts`
   - `constants/typography.ts`
   - `constants/spacing.ts`
5. **Keep `constants/config.ts`** (app config, not design tokens)

**Result:** Clean codebase with single source of truth.

---

## Tailwind CSS Integration

**tailwind.config.js mapping:**

```javascript
const { tokens } = require('./src/ui/tokens');

module.exports = {
  darkMode: 'class',  // Use class-based dark mode
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tokens.colors,
      spacing: tokens.spacing,
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.fontSize,
      fontWeight: tokens.typography.fontWeight,
      lineHeight: tokens.typography.lineHeight,
      letterSpacing: tokens.typography.letterSpacing,
      borderRadius: tokens.spacing.borderRadius,
      transitionDuration: tokens.motion.duration,
      transitionTimingFunction: tokens.motion.easing,
    },
  },
  plugins: [],
};
```

---

## gluestack UI Integration

**gluestack-ui.config.ts mapping:**

```typescript
import { tokens } from './src/ui/tokens';

export default {
  tokens: {
    colors: tokens.colors,
    space: tokens.spacing,
    fontSizes: tokens.typography.fontSize,
    fonts: tokens.typography.fontFamily,
    fontWeights: tokens.typography.fontWeight,
    lineHeights: tokens.typography.lineHeight,
    letterSpacings: tokens.typography.letterSpacing,
    radii: tokens.spacing.borderRadius,
  },
};
```

---

## Validation Strategy

### Token Demo App

**src/ui/__demo__/TokenDemo.tsx** will display:
1. All color scales (7 colors × 10 shades = 70 swatches)
2. Light/dark mode toggle
3. Typography scale (font sizes, weights, line heights)
4. Spacing scale visualization
5. Motion examples (duration + easing)
6. Elevation examples (shadows on cards)

### Audit Script

**scripts/ui-audit-tokens.sh** will check:
1. No hardcoded colors outside `src/ui/tokens/`
2. No duplicate token definitions
3. All tokens used in at least one component
4. Migration progress tracking

---

## Success Criteria

- [ ] All 5 token categories created (colors, typography, spacing, motion, elevation)
- [ ] Full color scales (50-900) for all 7 color types
- [ ] Dark mode tokens defined for all semantic colors
- [ ] `tailwind.config.js` configured with all tokens
- [ ] `gluestack-ui.config.ts` initialized with token mapping
- [ ] Token demo app runs and displays all tokens
- [ ] Light/dark mode toggle works in demo app
- [ ] `src/ui/tokens.json` generated for tooling
- [ ] Zero token conflicts (verified by audit script)
- [ ] `constants/` files still work (backward compatible)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing components | High | Keep `constants/` working, migrate gradually in Phase 04-05 |
| Color scale inconsistency | Medium | Use Material Design algorithm for consistent scales |
| Dark mode tokens incomplete | Medium | Start with light mode, add dark mode incrementally, validate with demo app |
| Too many token variants | Low | Limit to essential tokens, document usage clearly |
| Migration complexity | Medium | Clear 3-phase plan, track progress with audit script |

---

## Next Steps (Immediate - Phase 03)

1. Create `src/ui/tokens/colors.ts` with full color scales
2. Create `src/ui/tokens/typography.ts` with enhancements
3. Create `src/ui/tokens/spacing.ts` with extensions
4. Create `src/ui/tokens/motion.ts` (new)
5. Create `src/ui/tokens/elevation.ts` (new)
6. Create `src/ui/tokens/index.ts` and `src/ui/tokens.ts`
7. Generate `src/ui/tokens.json`
8. Configure `tailwind.config.js`
9. Initialize `gluestack-ui.config.ts`
10. Build token demo app
11. Run audit script to verify zero conflicts

---

**Status:** Migration plan complete | Ready for implementation
**Phase:** 03 - Token System Design
**Backward Compatibility:** ✅ Guaranteed (`constants/` untouched)
