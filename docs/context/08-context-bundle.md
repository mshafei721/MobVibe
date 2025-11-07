# Phase 08 Context Bundle: Screen Refactoring

**Bundle Date:** 2025-01-06
**Phase:** 08 - Screen Refactor (Auth & Home)
**Target Screens:** `app/(auth)/login.tsx`, `app/index.tsx`

---

## Table of Contents

1. [User Flows from Features & Journeys](#user-flows)
2. [Available Primitives (Phase 04-05)](#available-primitives)
3. [Available Adapters (Phase 06-07)](#available-adapters)
4. [Design Tokens](#design-tokens)
5. [Current Screen Implementations](#current-implementations)
6. [Component Mapping Table](#component-mapping-table)
7. [Architecture Rules](#architecture-rules)

---

## User Flows

### Journey 1: Authentication Flow (From features-and-journeys.md)

**Sign Up (30 seconds)**
```
Screen: Welcome
    ├─ "Sign in with Google" (tap)
    ├─ "Sign in with Apple" (tap)
    └─ "Continue with Email" (tap)
        ↓
    Enter email address
        ↓
    "Check your email for magic link"
        ↓
    (Open email, click link)
        ↓
    Redirect to app → Authenticated ✓
```

**Key Requirements:**
- Magic link email authentication
- OAuth providers: Google, Apple, GitHub
- Clear loading states
- Error handling with user-friendly messages
- Auto-focus on email input
- Keyboard type: email-address
- Auto-capitalize: none

**User Actions:**
- Tap OAuth button → OAuth flow
- Enter email → Magic link sent
- See loading state during auth
- See error state if auth fails
- Navigate back if needed

### Journey 2: First-Time User Experience

**Welcome Screen → Login Screen → App**
```
User opens MobVibe (first time)
    ↓
Screen: Welcome (app/index.tsx)
    ├─ See app name and tagline
    ├─ Visual appeal (could use animation)
    └─ Tap "Get Started"
        ↓
    Navigate to Login (app/(auth)/login.tsx)
        ↓
    Choose auth method
        ↓
    Authenticate
        ↓
    Enter app (Projects Dashboard)
```

**Key Requirements:**
- Simple, welcoming first impression
- Clear call-to-action
- Fast load time
- Visual interest (Lottie animation opportunity)
- Professional appearance

---

## Available Primitives

### From Phase 04

**Button** (`@/ui/primitives`)
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  children: string;
  icon?: string;
  fullWidth?: boolean;
}
```

**Text** (`@/ui/primitives`)
```typescript
interface TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success';
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}
```

**Input** (`@/ui/primitives`)
```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
}
```

### From Phase 05

**Divider** (`@/ui/primitives`)
```typescript
interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  label?: string;
}
```

**Spinner** (`@/ui/primitives`)
```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}
```

**Icon** (`@/ui/primitives`)
```typescript
interface IconProps {
  name: string;
  size?: number;
  color?: string;
}
```

**Card** (`@/ui/primitives`)
```typescript
interface CardProps {
  elevation?: 0 | 1 | 2 | 3 | 4;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

**ListItem** (`@/ui/primitives`)
```typescript
interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}
```

**Sheet** (`@/ui/primitives`)
```typescript
interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'bottom' | 'top';
}
```

---

## Available Adapters

### From Phase 06 (Core Adapters via gluestack)

**Box** (`@/ui/adapters`)
- Layout container
- Replaces React Native `View`
- Supports flex, padding, margin via props

**Pressable** (`@/ui/adapters`)
- Touchable element
- Replaces React Native `TouchableOpacity`
- Supports onPress, disabled, etc.

**Text** (`@/ui/adapters`)
- Text display
- Replaces React Native `Text`
- Part of primitives, accessible via adapters too

**TextInput** (`@/ui/adapters`)
- Text input field
- Replaces React Native `TextInput`
- Used by Input primitive

**ActivityIndicator** (`@/ui/adapters`)
- Loading spinner
- Replaces React Native `ActivityIndicator`
- Used by Spinner primitive

**Modal** (`@/ui/adapters`)
- Modal overlay
- Replaces React Native `Modal`
- Used by Sheet primitive

### From Phase 07 (Specialized Components)

**Paper Components** (`@/ui/adapters`)
- FAB - Floating Action Button
- Chip - Tags/filters
- Badge - Notification indicators
- ProgressBar - Linear progress
- Snackbar - Android-style toasts

**Lottie** (`@/ui/adapters`)
- Animation - Vector animations with reduced motion support

**Gifted Chat** (`@/ui/adapters`)
- Chat - Complete chat UI with token theming

---

## Design Tokens

### Typography
```typescript
typography: {
  fontFamily: {
    heading: 'System',
    body: 'System',
    mono: 'Courier'
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75
  }
}
```

### Colors
```typescript
colors: {
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    // ... up to 900
    500: '#2196F3',  // Main brand color
    900: '#0D47A1'
  },
  secondary: { /* ... */ },
  error: { /* ... */ },
  success: { /* ... */ },
  warning: { /* ... */ },
  text: {
    primary: '#000000',
    secondary: '#666666',
    tertiary: '#999999',
    inverse: '#FFFFFF'
  },
  background: {
    base: '#FFFFFF',
    elevated: '#F5F5F5',
    overlay: 'rgba(0, 0, 0, 0.5)'
  },
  border: {
    base: '#DDDDDD',
    focus: '#2196F3',
    error: '#F44336'
  }
}
```

### Spacing
```typescript
spacing: {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48
}
```

### Border Radius
```typescript
borderRadius: {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999
}
```

---

## Current Implementations

### Login Screen (`app/(auth)/login.tsx`)

**Current Dependencies:**
```typescript
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '@/services/auth/authService';
import { useAuthStore } from '@/store/authStore';
```

**Component Structure:**
- Title: "Welcome to MobVibe"
- Subtitle: "AI-Powered Mobile App Builder"
- Email input field
- Primary button: "Continue with Email"
- Divider with "OR" text
- OAuth buttons (Google, Apple, GitHub)
- Loading states
- Error handling via Alert

**Current Issues:**
- Direct React Native imports (View, Text, TextInput, TouchableOpacity, StyleSheet)
- Hardcoded styles (no tokens)
- No accessibility labels
- No haptic feedback
- Alert for errors (not design system)
- Inline styles object

### Welcome Screen (`app/index.tsx`)

**Current Dependencies:**
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
```

**Component Structure:**
- Title: "MobVibe"
- Subtitle: "AI-Powered Mobile App Builder"
- Link to login: "Get Started"

**Current Issues:**
- Direct React Native imports (View, Text, StyleSheet)
- Hardcoded styles (no tokens)
- Very basic (no animations)
- No value proposition showcase
- Missing Lottie opportunity

---

## Component Mapping Table

### Login Screen Refactoring

| Current Component | New Component | Import From | Props |
|------------------|---------------|-------------|-------|
| `View` (container) | `Box` | `@/ui/adapters` | `flex={1}`, `padding="lg"`, `backgroundColor={tokens.colors.background.base}` |
| `Text` (title) | `Text` | `@/ui/primitives` | `variant="h1"`, `align="center"`, `color="primary"` |
| `Text` (subtitle) | `Text` | `@/ui/primitives` | `variant="body"`, `align="center"`, `color="secondary"` |
| `TextInput` (email) | `Input` | `@/ui/primitives` | `type="email"`, `placeholder`, `autoFocus` |
| `TouchableOpacity` (primary) | `Button` | `@/ui/primitives` | `variant="primary"`, `fullWidth`, `loading` |
| `View` (divider container) | `Box` | `@/ui/adapters` | `flexDirection="row"`, `alignItems="center"` |
| Divider lines | `Divider` | `@/ui/primitives` | `label="OR"` |
| `Text` (divider text) | N/A | N/A | Handled by Divider |
| `TouchableOpacity` (OAuth) | `Button` | `@/ui/primitives` | `variant="secondary"`, `fullWidth` |
| `StyleSheet` | N/A | N/A | Use inline token references |
| `Alert` | `Snackbar` | `@/ui/adapters` | For error messages |
| Loading state | `Spinner` | `@/ui/primitives` | Or `Button loading` prop |

### Welcome Screen Refactoring

| Current Component | New Component | Import From | Props |
|------------------|---------------|-------------|-------|
| `View` (container) | `Box` | `@/ui/adapters` | `flex={1}`, `justifyContent="center"`, `alignItems="center"` |
| `Text` (title) | `Text` | `@/ui/primitives` | `variant="h1"`, `color="primary"` |
| `Text` (subtitle) | `Text` | `@/ui/primitives` | `variant="body"`, `color="secondary"` |
| `Link` + `Text` | `Button` + Router | `@/ui/primitives` + `expo-router` | `onPress={() => router.push('/(auth)/login')}` |
| None | `Animation` | `@/ui/adapters` | Lottie animation (optional enhancement) |
| `StyleSheet` | N/A | N/A | Use inline token references |

---

## Architecture Rules

### Zero Vendor Leakage

**Forbidden Imports in Screens:**
```typescript
// ❌ NEVER import these directly in screens
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Button, Card } from 'react-native-paper';
import LottieView from 'lottie-react-native';
```

**Allowed Imports:**
```typescript
// ✅ ONLY import from these paths
import { Box, Pressable } from '@/ui/adapters';
import { Button, Text, Input, Divider, Spinner } from '@/ui/primitives';
import { Animation } from '@/ui/adapters';
import { tokens } from '@/ui/tokens';

// ✅ Utilities and types are OK
import { Platform, AccessibilityInfo } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
```

### Token Usage

**Always use tokens, never hardcoded values:**
```typescript
// ❌ BAD
<Box style={{ padding: 24, backgroundColor: '#fff' }}>

// ✅ GOOD
<Box padding={tokens.spacing.lg} backgroundColor={tokens.colors.background.base}>
```

### Accessibility Requirements

**All interactive elements need labels:**
```typescript
<Button
  onPress={handleLogin}
  accessibilityLabel="Sign in with email"
  accessibilityHint="Sends a magic link to your email"
>
  Continue with Email
</Button>
```

### Haptic Feedback

**Use on key actions:**
```typescript
import * as Haptics from 'expo-haptics';

const handleSuccess = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

const handleError = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};
```

---

## Testing Checklist

### Pre-Refactor Baseline
- [ ] Capture screenshots (light mode)
- [ ] Capture screenshots (dark mode if applicable)
- [ ] Run existing tests
- [ ] Document current performance metrics

### Post-Refactor Verification
- [ ] All functionality preserved
- [ ] Zero direct vendor imports (audit passes)
- [ ] Visual regression within 5% threshold
- [ ] Accessibility audit passes (WCAG AA)
- [ ] Performance within ±10% of baseline
- [ ] All tests passing
- [ ] No console errors/warnings

---

**Status:** Context bundle complete - Ready for sequential planning ✅
