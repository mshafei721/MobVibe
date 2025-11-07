# MobVibe Theming System

**Status:** ✅ Complete (Phase 03)
**Last Updated:** 2025-11-06

---

## Overview

MobVibe uses a comprehensive design token system that provides a single source of truth for all design decisions. Tokens are mapped to both **Tailwind CSS** (via NativeWind) and **gluestack UI** for maximum flexibility.

**Token System Features:**
- 🎨 Full color scales (50-900) for 7 color types
- 📐 Comprehensive spacing system
- ✍️ Typography tokens (fonts, sizes, weights, line heights, letter spacing)
- ⚡ Animation/motion tokens
- 📦 Elevation/shadow tokens
- 🌓 Built-in dark mode support

---

## Token Categories

### 1. Colors (`tokens.colors`)

#### Color Scales (Material Design)

All color types have 10 shades (50-900) following Material Design color system:

```typescript
import { tokens } from '@/ui/tokens';

// Access color scales
const primaryBlue = tokens.colors.primary[500];  // #2196F3
const lightBlue = tokens.colors.primary[100];    // #BBDEFB
const darkBlue = tokens.colors.primary[900];     // #0D47A1
```

**Available Color Scales:**
- `primary`: Blue (#2196F3 base)
- `secondary`: Purple (#9C27B0 base)
- `success`: Green (#4CAF50 base)
- `error`: Red (#F44336 base)
- `warning`: Orange (#FF9800 base)
- `info`: Cyan (#03A9F4 base)
- `neutral`: Gray (#9E9E9E base)

#### Semantic Colors

**Text Colors:**
```typescript
tokens.colors.text.primary    // High contrast (neutral.900 light / neutral.50 dark)
tokens.colors.text.secondary  // Medium contrast (neutral.700 light / neutral.300 dark)
tokens.colors.text.tertiary   // Low contrast (neutral.500 both)
tokens.colors.text.disabled   // Very low contrast (neutral.400 light / neutral.600 dark)
tokens.colors.text.inverse    // For dark/light backgrounds
```

**Background Colors:**
```typescript
tokens.colors.background.base    // Main background (#FFF light / neutral.950 dark)
tokens.colors.background.subtle  // Subtle contrast (neutral.50 light / neutral.900 dark)
```

**Surface Colors (Elevation):**
```typescript
tokens.colors.surface[0]  // Base level
tokens.colors.surface[1]  // Elevated 1 level
tokens.colors.surface[2]  // Elevated 2 levels
tokens.colors.surface[3]  // Elevated 3 levels
```

**Border Colors:**
```typescript
tokens.colors.border.subtle    // Very light dividers
tokens.colors.border.base      // Standard borders
tokens.colors.border.strong    // Emphasized borders
tokens.colors.border.primary   // Focus/active states
tokens.colors.border.success   // Success borders
tokens.colors.border.error     // Error/validation borders
tokens.colors.border.warning   // Warning borders
```

### 2. Typography (`tokens.typography`)

#### Font Families

```typescript
tokens.typography.fontFamily.sans  // 'System' (iOS) or 'Roboto' (Android)
tokens.typography.fontFamily.mono  // 'Menlo' (iOS) or 'monospace' (Android)
```

#### Font Sizes

```typescript
tokens.typography.fontSize.xs      // 12px
tokens.typography.fontSize.sm      // 14px
tokens.typography.fontSize.base    // 16px (body text default)
tokens.typography.fontSize.lg      // 18px
tokens.typography.fontSize.xl      // 20px
tokens.typography.fontSize['2xl']  // 24px
tokens.typography.fontSize['3xl']  // 30px
tokens.typography.fontSize['4xl']  // 36px
tokens.typography.fontSize['5xl']  // 48px
tokens.typography.fontSize['6xl']  // 60px (large headings)
```

#### Font Weights

```typescript
tokens.typography.fontWeight.normal    // 400
tokens.typography.fontWeight.medium    // 500
tokens.typography.fontWeight.semibold  // 600
tokens.typography.fontWeight.bold      // 700
```

#### Line Heights & Letter Spacing

```typescript
// Line Heights
tokens.typography.lineHeight.tight     // 1.2
tokens.typography.lineHeight.normal    // 1.5
tokens.typography.lineHeight.relaxed   // 1.75

// Letter Spacing
tokens.typography.letterSpacing.tighter   // -0.05
tokens.typography.letterSpacing.tight     // -0.025
tokens.typography.letterSpacing.normal    // 0
tokens.typography.letterSpacing.wide      // 0.025
tokens.typography.letterSpacing.wider     // 0.05
tokens.typography.letterSpacing.widest    // 0.1
```

### 3. Spacing (`tokens.spacing`)

**Spacing Scale (8px base):**

```typescript
tokens.spacing[0]   // 0px
tokens.spacing[1]   // 4px
tokens.spacing[2]   // 8px
tokens.spacing[3]   // 12px
tokens.spacing[4]   // 16px
tokens.spacing[5]   // 20px
tokens.spacing[6]   // 24px
tokens.spacing[8]   // 32px
tokens.spacing[10]  // 40px
tokens.spacing[12]  // 48px
tokens.spacing[16]  // 64px
tokens.spacing[20]  // 80px
tokens.spacing[24]  // 96px
tokens.spacing[32]  // 128px
```

**Border Radius:**

```typescript
tokens.spacing.borderRadius.none  // 0px
tokens.spacing.borderRadius.sm    // 4px
tokens.spacing.borderRadius.base  // 8px
tokens.spacing.borderRadius.md    // 12px
tokens.spacing.borderRadius.lg    // 16px
tokens.spacing.borderRadius.xl    // 24px
tokens.spacing.borderRadius.full  // 9999px (circular)
```

### 4. Motion (`tokens.motion`)

**Animation Durations:**

```typescript
tokens.motion.duration.instant  // 0ms (no animation)
tokens.motion.duration.fast     // 150ms (micro-interactions, tooltips)
tokens.motion.duration.base     // 200ms (standard transitions)
tokens.motion.duration.medium   // 300ms (modals, drawers)
tokens.motion.duration.slow     // 500ms (page transitions)
tokens.motion.duration.slower   // 700ms (complex animations)
```

**Easing Functions:**

```typescript
tokens.motion.easing.linear     // 'linear'
tokens.motion.easing.easeIn     // 'cubic-bezier(0.4, 0, 1, 1)'
tokens.motion.easing.easeOut    // 'cubic-bezier(0, 0, 0.2, 1)' (most common)
tokens.motion.easing.easeInOut  // 'cubic-bezier(0.4, 0, 0.2, 1)'
```

### 5. Elevation (`tokens.elevation`)

**iOS Shadows:**

```typescript
import { Platform } from 'react-native';

const cardStyle = {
  ...Platform.select({
    ios: tokens.elevation.shadow.md,
    android: { elevation: tokens.elevation.android.md }
  })
};
```

**Android Elevation:**

```typescript
tokens.elevation.android.none  // 0
tokens.elevation.android.sm    // 2
tokens.elevation.android.base  // 4
tokens.elevation.android.md    // 8
tokens.elevation.android.lg    // 12
tokens.elevation.android.xl    // 16
```

---

## Usage Examples

### Using Tokens in React Native Components

#### Method 1: Direct Token Import

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '@/ui/tokens';

export const MyComponent = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Hello World</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing[4],              // 16px
    backgroundColor: tokens.colors.surface[0],
    borderRadius: tokens.spacing.borderRadius.md,  // 12px
  },
  title: {
    fontSize: tokens.typography.fontSize.xl,       // 20px
    fontWeight: tokens.typography.fontWeight.bold, // 700
    color: tokens.colors.text.primary,
  },
});
```

#### Method 2: Tailwind CSS Classes (NativeWind)

```typescript
import { View, Text } from 'react-native';

export const MyComponent = () => (
  <View className="p-4 bg-surface-0 rounded-md">
    <Text className="text-xl font-bold text-text-primary">
      Hello World
    </Text>
  </View>
);
```

#### Method 3: gluestack UI Components

```typescript
import { Box, Text } from '@gluestack-ui/themed';

export const MyComponent = () => (
  <Box p="$4" bg="$surface0" borderRadius="$md">
    <Text fontSize="$xl" fontWeight="$bold" color="$textPrimary">
      Hello World
    </Text>
  </Box>
);
```

### Dark Mode Implementation

#### Using Conditional Tokens

```typescript
import { useColorScheme } from 'react-native';
import { colorsLight, colorsDark } from '@/ui/tokens';

export const MyComponent = () => {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? colorsDark : colorsLight;

  return (
    <View style={{ backgroundColor: colors.background.base }}>
      <Text style={{ color: colors.text.primary }}>
        Adapts to theme
      </Text>
    </View>
  );
};
```

#### Using Tailwind Dark Mode Classes

```typescript
import { View, Text } from 'react-native';

export const MyComponent = () => (
  <View className="bg-background-base dark:bg-background-base-dark">
    <Text className="text-text-primary dark:text-text-primary-dark">
      Adapts to theme
    </Text>
  </View>
);
```

### Animation with Motion Tokens

```typescript
import { Animated } from 'react-native';
import { tokens } from '@/ui/tokens';

const fadeIn = () => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: tokens.motion.duration.base,  // 200ms
    easing: tokens.motion.easing.easeOut,   // cubic-bezier(0, 0, 0.2, 1)
    useNativeDriver: true,
  }).start();
};
```

---

## Best Practices

### DO ✅

1. **Always use tokens for colors**
   ```typescript
   // ✅ Good
   color: tokens.colors.primary[500]

   // ❌ Bad
   color: '#2196F3'
   ```

2. **Use semantic colors for meaning**
   ```typescript
   // ✅ Good
   backgroundColor: tokens.colors.success[500]  // Green for success

   // ❌ Bad
   backgroundColor: tokens.colors.primary[500]  // Blue for success (confusing)
   ```

3. **Use spacing scale for consistency**
   ```typescript
   // ✅ Good
   padding: tokens.spacing[4]  // 16px

   // ❌ Bad
   padding: 15  // Random value
   ```

4. **Prefer Tailwind classes for simple styling**
   ```typescript
   // ✅ Good (concise)
   <View className="p-4 bg-primary-500 rounded-md" />

   // ⚠️ Okay (but verbose)
   <View style={{
     padding: tokens.spacing[4],
     backgroundColor: tokens.colors.primary[500],
     borderRadius: tokens.spacing.borderRadius.md
   }} />
   ```

5. **Use motion tokens for animations**
   ```typescript
   // ✅ Good
   duration: tokens.motion.duration.base

   // ❌ Bad
   duration: 200  // Magic number
   ```

### DON'T ❌

1. **Don't hardcode color values**
   ```typescript
   // ❌ Bad
   color: '#2196F3'
   backgroundColor: 'red'
   ```

2. **Don't use random spacing values**
   ```typescript
   // ❌ Bad
   padding: 15
   margin: 23
   ```

3. **Don't skip semantic colors**
   ```typescript
   // ❌ Bad
   <Text style={{ color: tokens.colors.error[500] }}>Success!</Text>

   // ✅ Good
   <Text style={{ color: tokens.colors.success[500] }}>Success!</Text>
   ```

4. **Don't mix token systems inconsistently**
   ```typescript
   // ❌ Bad (mixing direct tokens with Tailwind randomly)
   <View className="p-4" style={{ backgroundColor: tokens.colors.primary[500] }} />

   // ✅ Good (pick one approach per component)
   <View className="p-4 bg-primary-500" />
   ```

---

## Token Naming Conventions

### Colors

**Pattern:** `{category}.{subcategory}.{variant}`

```
tokens.colors.primary[500]       // Color scale
tokens.colors.text.primary       // Semantic color
tokens.colors.border.subtle      // Semantic color
```

### Typography

**Pattern:** `{category}.{property}.{variant}`

```
tokens.typography.fontSize.xl
tokens.typography.fontWeight.bold
tokens.typography.lineHeight.normal
```

### Spacing

**Pattern:** `{category}[{value}]` or `{category}.{property}.{variant}`

```
tokens.spacing[4]                    // Spacing scale
tokens.spacing.borderRadius.md       // Border radius
```

### Motion

**Pattern:** `{category}.{property}.{variant}`

```
tokens.motion.duration.base
tokens.motion.easing.easeOut
```

---

## Migration from constants/

**Status:** constants/ files remain active during Phase 03-04 for backward compatibility.

**Migration Path:**
1. **Phase 03:** New token system created, both systems work in parallel
2. **Phase 04-05:** Components gradually migrated to use `src/ui/tokens`
3. **Phase 06+:** constants/ deprecated and removed

**How to Migrate:**

```typescript
// Before (constants/)
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';

// After (tokens/)
import { tokens } from '@/ui/tokens';

// Or specific imports
import { colors, typography, spacing } from '@/ui/tokens';
```

---

## Token Demo App

To visualize all tokens:

1. Import the demo component:
   ```typescript
   import { TokenDemo } from '@/ui/__demo__/TokenDemo';
   ```

2. Render in your app (development only):
   ```typescript
   <TokenDemo />
   ```

3. Toggle between light/dark mode to see all variants

**Demo Features:**
- All color scales visualization
- Typography samples
- Spacing/border radius preview
- Motion duration indicators
- Light/dark mode toggle

---

## Token Audit Script

Run the audit script to detect hardcoded values:

```bash
bash scripts/ui-audit-tokens.sh
```

**What it checks:**
- Hardcoded hex colors (#RRGGBB)
- Hardcoded rgb/rgba colors
- Hardcoded padding/margin values
- Duplicate token definitions
- Token usage compliance

**Report Location:** `reports/ui/token-audit-results.md`

---

## FAQ

**Q: Should I use tokens directly or Tailwind classes?**
A: Prefer Tailwind classes for simple styling (readability + performance). Use direct tokens for complex computed styles or React Native Animated API.

**Q: How do I add a new color?**
A: Create a full 50-900 scale in `src/ui/tokens/colors.ts`, update `tokens.json`, and add to `tailwind.config.js`.

**Q: Can I use custom fonts?**
A: Yes, add to `tokens.typography.fontFamily` and update both configs. Ensure fonts are loaded in your app.

**Q: What if I need a color shade not in the 50-900 scale?**
A: Use the closest shade or create a custom semantic color (e.g., `colors.brand.accent`). Avoid one-off hardcoded values.

**Q: How do I handle platform-specific tokens?**
A: Use `Platform.select()`:
   ```typescript
   import { Platform } from 'react-native';

   const fontFamily = Platform.select({
     ios: tokens.typography.fontFamily.sans,  // System
     android: tokens.typography.fontFamily.sans,  // Roboto
   });
   ```

**Q: Can I modify the constants/ files during migration?**
A: No, keep constants/ frozen. All new tokens go in `src/ui/tokens/`. This ensures safe migration.

---

## Related Documents

- [Token Migration Plan](/docs/sequencing/03-token-migration.md)
- [Foundation Decision](/docs/ui/FOUNDATION.md)
- [Phase 03 Completion](/docs/phases/03-COMPLETE.md)
- [Token Best Practices Research](/docs/research/03/token-best-practices.md)

---

**Last Updated:** 2025-11-06
**Phase:** 03 Complete
**Next:** Phase 04 - Component Library (primitives)
