# Design Token Best Practices Research

**Date:** 2025-11-06
**Phase:** 03 - Token System Design
**Sources:** Web research on design token systems 2025

---

## Executive Summary

Design token systems in 2025 emphasize:
- **Cross-platform consistency** between web and mobile
- **Automated workflows** from design tools to code
- **Tight integration** between design tools (Figma) and implementation
- **Semantic naming** for clarity and maintainability
- **Dark mode first-class support** with conditional tokens

---

## Key Findings

### 1. Design Token Fundamentals

**Definition:**
> A design token is a named value that represents a core piece of the design language, such as declaring a token like `brand.primary` and then mapping it to a color.

**Why Tailwind CSS is Ideal:**
- Tailwind's theme configuration already acts as a centralized source of truth
- Entire application uses tokens through utility classes
- Perfect system for design tokens via `tailwind.config.js`

### 2. React Native Integration (NativeWind)

**NativeWind Benefits:**
- React Native apps can use Tailwind-style utilities via NativeWind
- Developers consume tokens through theming (e.g., Emotion's ThemeProvider or context)
- Theme switching = changing token values only

**Design System Value:**
- Shared language between designers and developers
- Scalable, maintainable, consistent mobile applications
- Essential for building production-grade React Native apps

### 3. Naming Conventions

**Recommended Format:**
```
{category}-{component}-{variant}
```

**Examples:**
- `color-primary-500`
- `spacing-component-lg`
- `typography-heading-2xl`
- `shadow-elevation-md`

**Hierarchy:**
1. **Category**: color, spacing, typography, shadow, etc.
2. **Component**: primary, secondary, neutral, heading, body, etc.
3. **Variant**: 50-900 (colors), xs-4xl (sizes), light-dark (mode)

### 4. Tailwind Configuration Best Practices

**Modern Tailwind Apps (2025):**
- Use design tokens + CSS variables to build themeable UIs
- Create tokens in `tailwind.config.js` for centralization
- Make tokens accessible to all Tailwind CSS classes

**Keep Config Modular:**
- Extract theme logic into separate files
- Reuse across projects
- Document the design system for scalability

**Example Structure:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: require('./tokens/colors'),
      spacing: require('./tokens/spacing'),
      typography: require('./tokens/typography'),
    },
  },
}
```

### 5. Migration Strategy

**Effective Approach:**
1. Identify **global patterns** (used everywhere)
2. Replace those patterns with tokens **first**
3. Enforce with **lint rules** that block non-token classes
4. Gradually migrate less common patterns

**Priority:**
```
Global (colors, spacing) → Components (buttons, inputs) → Pages (screens)
```

### 6. Semantic Color Tokens

**Common Categories:**

**Brand Colors:**
- Primary, Secondary, Tertiary
- Used for branding and key actions

**Semantic/Alert Colors:**
- Success: Positive feedback, confirmations
- Error: Failures, validation errors
- Warning: Cautions, non-critical issues
- Info: Informational messages, tips

**Neutral Colors:**
- 50-900 scale for grays
- Used for text, backgrounds, borders

**Text Colors:**
- Primary: Main content (high contrast)
- Secondary: Supporting text (medium contrast)
- Disabled: Inactive states (low contrast)
- Inverse: Text on dark backgrounds

**Background/Surface:**
- Light mode: white, off-white, gray-50
- Dark mode: gray-900, gray-800, gray-700
- Elevated: Surfaces with depth (cards, modals)

**Border:**
- Light: Subtle dividers
- Medium: Standard borders
- Dark: Emphasized borders

### 7. Dark Mode Implementation

**Semantic Token Approach:**
```javascript
// Chakra UI example (adaptable to Tailwind)
{
  primary: {
    default: 'red.500',  // Light mode
    _dark: 'red.400',    // Dark mode
  },
  secondary: {
    default: 'red.800',
    _dark: 'red.700',
  },
}
```

**Tailwind CSS Approach:**
```javascript
// tailwind.config.js
{
  colors: {
    primary: {
      light: '#2196F3',  // Light mode
      dark: '#64B5F6',   // Dark mode (lighter variant)
      DEFAULT: '#2196F3',
    },
  },
}
```

**Usage:**
```jsx
<Text className="text-primary dark:text-primary-dark">
  Adapts to theme
</Text>
```

### 8. Figma-to-Code Workflow (Future)

**AI-Powered Tools (2025):**
- **Codia AI**: Extracts design tokens from Figma, integrates into React Native
- **Builder.io Visual Copilot**: One-click Figma → React Native conversion
- **FigNative**: Open-source plugin with automatic design token extraction

**Figma Dev Mode:**
- Live connection between design assets and development
- Design-to-code workflows with real-time collaboration
- Reduces frontend development time by up to 30%

**Design Token Management:**
- Import Figma Styles: Color, Text, Effect, Grid
- Batch edit Figma properties using design tokens
- Single source of truth for designers and developers

**Automation Trend:**
- Beyond syncing tokens → automate component code generation
- TypeScript typing + React Native styling conventions
- Design system = single source of truth

### 9. Performance Optimization

**Tailwind CSS (2025):**
- **Purge unused styles** in production
- **Leverage JIT compiler** for faster builds
- **Minimize CSS bloat** via tree-shaking
- **Use CSS variables** for runtime theme switching

**Bundle Size:**
- Modular token files reduce initial bundle
- Import only needed tokens per component
- Tree-shaking eliminates unused tokens

---

## Recommendations for MobVibe

### Token Structure

**File Organization:**
```
src/ui/
├── tokens.ts          # Main export (TypeScript)
├── tokens.json        # JSON export for tooling
├── tokens/
│   ├── colors.ts      # Color scales + semantic colors
│   ├── typography.ts  # Font families, sizes, weights
│   ├── spacing.ts     # Spacing scale, border radius
│   ├── motion.ts      # Animation durations, easing
│   ├── elevation.ts   # Shadows, iOS/Android elevation
│   └── index.ts       # Re-export all tokens
```

### Naming Convention

Use **semantic + scale** approach:
```typescript
colors: {
  primary: { 50: '#E3F2FD', ..., 500: '#2196F3', ..., 900: '#0D47A1' },
  secondary: { 50: '#F3E5F5', ..., 500: '#9C27B0', ..., 900: '#4A148C' },
  success: { 50: '#E8F5E9', ..., 500: '#4CAF50', ..., 900: '#1B5E20' },
  error: { 50: '#FFEBEE', ..., 500: '#F44336', ..., 900: '#B71C1C' },
  warning: { 50: '#FFF3E0', ..., 500: '#FF9800', ..., 900: '#E65100' },
  info: { 50: '#E1F5FE', ..., 500: '#03A9F4', ..., 900: '#01579B' },
  neutral: { 50: '#FAFAFA', ..., 500: '#9E9E9E', ..., 900: '#212121' },
}
```

### Tailwind Config Integration

**Map MobVibe tokens → Tailwind:**
```javascript
// tailwind.config.js
const { tokens } = require('./src/ui/tokens');

module.exports = {
  theme: {
    extend: {
      colors: tokens.colors,
      spacing: tokens.spacing,
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.fontSize,
      borderRadius: tokens.spacing.radius,
    },
  },
}
```

### gluestack UI Integration

**Map tokens to gluestack UI theme:**
```javascript
// gluestack-ui.config.ts
import { tokens } from './src/ui/tokens';

export default {
  tokens: {
    colors: tokens.colors,
    space: tokens.spacing,
    fontSizes: tokens.typography.fontSize,
    fonts: tokens.typography.fontFamily,
    // ...
  },
}
```

### Migration Priority

1. **Colors** (highest impact, used everywhere)
2. **Spacing** (layout consistency)
3. **Typography** (text hierarchy)
4. **Motion** (animation consistency)
5. **Elevation** (depth/shadows)

### Dark Mode Strategy

**Define both modes upfront:**
```typescript
export const tokensLight = { /* light mode tokens */ };
export const tokensDark = { /* dark mode tokens */ };

// Default export uses light mode
export const tokens = tokensLight;
```

**Tailwind dark mode:**
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2196F3',  // Light mode
          dark: '#64B5F6',     // Dark mode
        },
      },
    },
  },
}
```

### Lint Rules (Future)

**Enforce token usage:**
```json
// .eslintrc.js
{
  "rules": {
    "no-hardcoded-colors": "error",  // Custom rule
    "use-design-tokens": "warn",     // Custom rule
  }
}
```

---

## Next Steps for Phase 03

1. ✅ Research completed (this document)
2. [ ] Use `sequentialthinking` to plan comprehensive token migration
3. [ ] Create `src/ui/tokens.ts` with full token system
4. [ ] Export `src/ui/tokens.json` for tooling
5. [ ] Configure `tailwind.config.js` with MobVibe tokens
6. [ ] Initialize `gluestack-ui.config.ts` with token mapping
7. [ ] Define dark mode tokens
8. [ ] Build token demo app for validation
9. [ ] Create token audit script

---

## References

- [Modern Tailwind CSS in 2025](https://medium.com/@habiburrahman_62774/modern-tailwind-css-in-2025-a-utility-first-revolution-refined-2cd3dfe58104)
- [Design Systems in React.js (2025)](https://the-expert-developer.medium.com/design-systems-in-react-js-2025-token-driven-themed-and-cross-platform-25622a418f14)
- [Build a Design Token System for Tailwind That Scales Forever](https://hexshift.medium.com/how-to-build-a-design-token-system-for-tailwind-that-scales-forever-84c4c0873e6d)
- [Integrating Design Tokens With Tailwind](https://www.michaelmang.dev/blog/integrating-design-tokens-with-tailwind/)
- [Semantic Colors and Tokens](https://medium.com/@kaarsenmaker/semantic-colors-and-the-language-of-tokens-at-workiva-fc1e7bad15bf)
- [Color Tokens: Guide to Light and Dark Modes](https://medium.com/design-bootcamp/color-tokens-guide-to-light-and-dark-modes-in-design-systems-146ab33023ac)
- [Figma to React Native Workflows](https://www.codia.ai/blog/figma-to-react-native)
- [Chakra UI Semantic Tokens](https://v2.chakra-ui.com/docs/styled-system/semantic-tokens)

---

**Status:** Research complete | Ready for token migration planning
