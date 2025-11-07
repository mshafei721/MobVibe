# Screen Migration Guide: React Native → Primitives

**Version:** 1.0
**Last Updated:** 2025-01-06
**Phase:** 08 - Screen Refactor
**Status:** In Progress

---

## Purpose

This guide documents the process of migrating screens from direct React Native component usage to MobVibe's primitive system. Following this pattern ensures:
- Zero vendor leakage (all UI via adapters)
- Consistent design token usage
- Proper accessibility implementation
- Enhanced UX with haptic feedback
- Maintainable, refactorable codebase

---

## Component Mapping Table

### Core Components

| React Native | Primitive/Adapter | Import From | Notes |
|--------------|-------------------|-------------|-------|
| `View` | `Box` | `@/ui/adapters` | Layout container, supports flex props |
| `Text` | `Text` | `@/ui/primitives` | Typography with variants (h1, h2, body, etc.) |
| `TextInput` | `Input` | `@/ui/primitives` | Form input with type, error, validation |
| `TouchableOpacity` | `Button` | `@/ui/primitives` | Buttons with variants (primary, secondary, tertiary) |
| `StyleSheet` | `tokens` | `@/ui/tokens` | Use design tokens instead of StyleSheet.create |
| `ActivityIndicator` | `Spinner` | `@/ui/primitives` | Loading states |
| `Modal` | `Sheet` | `@/ui/primitives` | Bottom sheets and modals |
| Divider (custom) | `Divider` | `@/ui/primitives` | Horizontal/vertical dividers with labels |

### Allowed Utilities

These are NOT components, they are utility functions and can be imported from `react-native`:
- `Alert` - Native alert dialogs
- `Platform` - Platform detection
- `AccessibilityInfo` - Accessibility queries
- Type imports: `ViewStyle`, `TextStyle`, etc.

### Forbidden Imports

**NEVER import these in screens:**
```typescript
// ❌ DON'T
import { View, Text, TextInput, TouchableOpacity, Button, FlatList, Image } from 'react-native';
import { Button, Card, List } from 'react-native-paper';
import LottieView from 'lottie-react-native';
```

**ALWAYS use primitives/adapters:**
```typescript
// ✅ DO
import { Box, Pressable } from '@/ui/adapters';
import { Button, Text, Input, Card, ListItem } from '@/ui/primitives';
import { Animation } from '@/ui/adapters';
import { tokens } from '@/ui/tokens';
```

---

## Migration Checklist

### Pre-Migration

- [ ] Read the screen code thoroughly
- [ ] Identify all React Native component usage
- [ ] Note any custom styling (StyleSheet.create blocks)
- [ ] Identify user interactions (taps, inputs, navigation)
- [ ] Capture baseline screenshots (if possible)
- [ ] Run existing tests (if they exist)
- [ ] Git commit current state

### During Migration

- [ ] Update imports (remove RN, add primitives/adapters)
- [ ] Replace `View` → `Box` with token-based props
- [ ] Replace `Text` → `Text` with variants
- [ ] Replace `TextInput` → `Input` with types
- [ ] Replace `TouchableOpacity`/`Button` → `Button` with variants
- [ ] Replace custom dividers → `Divider` primitive
- [ ] Remove entire `StyleSheet.create` block
- [ ] Add accessibility labels to all interactive elements
- [ ] Add haptic feedback to button presses
- [ ] Use design tokens for all spacing, colors, typography
- [ ] Test functionality after each major section

### Post-Migration

- [ ] Run import audit: `npm run ui:audit-imports`
- [ ] Verify zero vendor leakage
- [ ] Test all user flows
- [ ] Verify loading states
- [ ] Verify error states
- [ ] Check accessibility with screen reader
- [ ] Capture new screenshots for comparison
- [ ] Git commit with descriptive message
- [ ] Update documentation if needed

---

## Migration Patterns

### Pattern 1: Container Replacement

**Before:**
```tsx
<View style={styles.container}>
  {/* content */}
</View>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
});
```

**After:**
```tsx
<Box
  flex={1}
  justifyContent="center"
  padding={tokens.spacing.lg}
  backgroundColor={tokens.colors.background.base}
>
  {/* content */}
</Box>
```

**Key Changes:**
- `View` → `Box`
- Inline props instead of styles object
- `padding: 24` → `padding={tokens.spacing.lg}` (24px = lg token)
- `'#fff'` → `tokens.colors.background.base`
- Remove styles definition

---

### Pattern 2: Typography Replacement

**Before:**
```tsx
<Text style={styles.title}>Welcome to MobVibe</Text>
<Text style={styles.subtitle}>AI-Powered App Builder</Text>

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
```

**After:**
```tsx
<Text
  variant="h1"
  align="center"
  color="primary"
>
  Welcome to MobVibe
</Text>
<Text
  variant="body"
  align="center"
  color="secondary"
>
  AI-Powered App Builder
</Text>
```

**Key Changes:**
- Use `variant` prop (h1, h2, h3, body, caption, label)
- Use `color` prop with semantic names (primary, secondary, tertiary, error)
- Use `align` prop (left, center, right)
- Font size, weight handled by variant automatically
- Remove styles definition

---

### Pattern 3: Form Input Replacement

**Before:**
```tsx
<TextInput
  style={styles.input}
  placeholder="Email address"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  autoCapitalize="none"
  editable={!isLoading}
/>

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
```

**After:**
```tsx
<Input
  type="email"
  placeholder="Email address"
  value={email}
  onChangeText={setEmail}
  disabled={isLoading}
  autoFocus
  error={emailError}
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email for magic link"
/>
```

**Key Changes:**
- `TextInput` → `Input`
- Use `type` prop (automatically sets keyboardType, autoCapitalize)
- `editable={!isLoading}` → `disabled={isLoading}`
- Add `error` prop for validation messages
- Add `autoFocus` for UX
- Add accessibility labels
- All styling handled by primitive

**Supported Input Types:**
- `email` - Email input (email keyboard, no autocapitalize)
- `password` - Password input (secure text entry)
- `text` - General text input
- `number` - Numeric input
- `tel` - Phone number input

---

### Pattern 4: Button Replacement

**Before:**
```tsx
<TouchableOpacity
  style={[styles.button, styles.primaryButton]}
  onPress={handleSubmit}
  disabled={isLoading}
>
  <Text style={styles.buttonText}>
    {isLoading ? 'Loading...' : 'Submit'}
  </Text>
</TouchableOpacity>

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**After:**
```tsx
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const handleSubmitWithHaptics = () => {
  ReactNativeHapticFeedback.trigger('impactMedium');
  handleSubmit();
};

<Button
  variant="primary"
  fullWidth
  onPress={handleSubmitWithHaptics}
  disabled={isLoading}
  loading={isLoading}
  accessibilityLabel="Submit form"
>
  Submit
</Button>
```

**Key Changes:**
- `TouchableOpacity` → `Button`
- Use `variant` prop (primary, secondary, tertiary)
- `loading` prop handles "Loading..." text automatically
- Add haptic feedback wrapper
- Add accessibility label
- All styling handled by primitive

**Button Variants:**
- `primary` - Main call-to-action (filled, primary color)
- `secondary` - Secondary actions (outlined, primary color)
- `tertiary` - Tertiary actions (text only, no border)

**Button Props:**
- `fullWidth` - Stretch to container width
- `loading` - Show loading spinner, change text
- `disabled` - Disable interaction
- `icon` - Add icon to button
- `size` - sm | md | lg

---

### Pattern 5: Custom Divider → Primitive

**Before:**
```tsx
<View style={styles.divider}>
  <View style={styles.dividerLine} />
  <Text style={styles.dividerText}>OR</Text>
  <View style={styles.dividerLine} />
</View>

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
});
```

**After:**
```tsx
<Divider label="OR" />
```

**Key Changes:**
- Entire custom implementation → Single primitive component
- ~15 lines of code → 1 line
- ~15 lines of styles → 0 lines
- Automatic layout, styling, spacing

---

### Pattern 6: Spacing and Layout

**Before:**
```tsx
<View style={styles.form}>
  <TextInput />
  <TouchableOpacity />
  <TouchableOpacity />
</View>

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
});
```

**After:**
```tsx
<Box style={{ gap: tokens.spacing.md }}>
  <Input />
  <Button />
  <Button />
</Box>
```

**Key Changes:**
- `gap: 16` → `gap: tokens.spacing.md` (16px = md token)
- Use tokens for all spacing values

**Spacing Tokens:**
```typescript
tokens.spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48
}
```

---

## Accessibility Enhancements

### Required Accessibility Props

All interactive elements MUST have:
- `accessibilityLabel` - What the element is
- `accessibilityHint` - What happens when you interact (optional but recommended)

**Examples:**

**Buttons:**
```tsx
<Button
  onPress={handleLogin}
  accessibilityLabel="Sign in with email"
  accessibilityHint="Sends a magic link to your email address"
>
  Continue with Email
</Button>
```

**Inputs:**
```tsx
<Input
  type="email"
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email for authentication"
/>
```

**Text (Headers):**
```tsx
<Text
  variant="h1"
  accessibilityRole="header"
>
  Welcome
</Text>
```

---

## Haptic Feedback Integration

### When to Use Haptics

**Light Impact:**
- Secondary button presses
- Navigation actions
- Non-critical interactions

**Medium Impact:**
- Primary button presses
- Form submissions
- Important actions

**Success Notification:**
- Successful form submission
- Successful API call
- Positive feedback

**Error Notification:**
- Form validation errors
- API errors
- Negative feedback

### Implementation Pattern

```typescript
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Light impact for navigation
const handleNavigate = () => {
  ReactNativeHapticFeedback.trigger('impactLight');
  router.push('/next-screen');
};

// Medium impact for important actions
const handleSubmit = async () => {
  ReactNativeHapticFeedback.trigger('impactMedium');
  const result = await submitForm();

  if (result.success) {
    ReactNativeHapticFeedback.trigger('notificationSuccess');
  } else {
    ReactNativeHapticFeedback.trigger('notificationError');
  }
};
```

---

## Form Validation Pattern

### Enhanced Error Handling

**Before:**
```tsx
const handleSubmit = async () => {
  if (!email) {
    Alert.alert('Error', 'Please enter email');
    return;
  }
  // submit
};
```

**After:**
```tsx
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');

const handleSubmit = async () => {
  setEmailError('');

  if (!email) {
    setEmailError('Email address is required');
    ReactNativeHapticFeedback.trigger('notificationError');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setEmailError('Please enter a valid email address');
    ReactNativeHapticFeedback.trigger('notificationError');
    return;
  }

  // submit
};

<Input
  value={email}
  onChangeText={(text) => {
    setEmail(text);
    if (emailError) setEmailError(''); // Clear error on type
  }}
  error={emailError}
/>
```

**Benefits:**
- Inline error display (better UX than Alert)
- Real-time error clearing
- Haptic feedback for errors
- Proper validation before submission

---

## Common Pitfalls

### ❌ Pitfall 1: Mixing Imports

**DON'T:**
```tsx
import { View } from 'react-native';
import { Box } from '@/ui/adapters';

<View>  {/* ❌ Bad */}
  <Box>  {/* ✓ Good */}
  </Box>
</View>
```

**DO:**
```tsx
import { Box } from '@/ui/adapters';

<Box>
  <Box>
  </Box>
</Box>
```

### ❌ Pitfall 2: Hardcoded Values

**DON'T:**
```tsx
<Box padding={24} backgroundColor="#fff">  {/* ❌ */}
```

**DO:**
```tsx
<Box
  padding={tokens.spacing.lg}  {/* ✓ */}
  backgroundColor={tokens.colors.background.base}  {/* ✓ */}
>
```

### ❌ Pitfall 3: Missing Accessibility

**DON'T:**
```tsx
<Button onPress={handleSubmit}>  {/* ❌ No label */}
  Submit
</Button>
```

**DO:**
```tsx
<Button
  onPress={handleSubmit}
  accessibilityLabel="Submit form"  {/* ✓ */}
>
  Submit
</Button>
```

### ❌ Pitfall 4: StyleSheet for Primitives

**DON'T:**
```tsx
const styles = StyleSheet.create({
  button: { /* ... */ }  {/* ❌ Primitives handle styling */}
});

<Button style={styles.button}>  {/* ❌ Don't override */}
```

**DO:**
```tsx
<Button variant="primary">  {/* ✓ Use variant prop */}
  Submit
</Button>
```

---

## Testing After Migration

### Manual Testing Checklist

- [ ] All screens render without errors
- [ ] All interactions work (buttons, inputs, navigation)
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Success states display correctly
- [ ] Haptic feedback works on interactions
- [ ] Screen reader announces elements correctly
- [ ] Keyboard navigation works (external keyboard)
- [ ] All text is readable (contrast, size)
- [ ] No console errors or warnings

### Automated Testing

**Import Audit:**
```bash
npm run ui:audit-imports -- path/to/screen.tsx
```

Expected: ✅ Zero vendor leakage

**Accessibility Audit:**
```bash
npm run test:a11y -- path/to/screen.tsx
```

Expected: ✅ WCAG AA compliance

---

## Phase 08 Examples

### Example 1: Welcome Screen

**Before (43 lines):**
```tsx
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MobVibe</Text>
      <Text style={styles.subtitle}>AI-Powered Mobile App Builder</Text>
      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkText}>Get Started</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 48, fontWeight: 'bold', color: '#2196F3', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#666', marginBottom: 32 },
  link: { marginTop: 16 },
  linkText: { fontSize: 16, color: '#2196F3', fontWeight: '600' },
});
```

**After (47 lines):**
```tsx
import { useRouter } from 'expo-router';
import { Box } from '@/ui/adapters';
import { Text, Button } from '@/ui/primitives';
import { tokens } from '@/ui/tokens';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    router.push('/(auth)/login');
  };

  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor={tokens.colors.background.base}
    >
      <Text variant="h1" color="primary" accessibilityRole="header">
        MobVibe
      </Text>
      <Text
        variant="body"
        color="secondary"
        style={{ marginBottom: tokens.spacing.xl }}
      >
        AI-Powered Mobile App Builder
      </Text>
      <Button
        variant="primary"
        onPress={handleGetStarted}
        accessibilityLabel="Get started with MobVibe"
      >
        Get Started
      </Button>
    </Box>
  );
}
```

**Changes:**
- ✅ Zero React Native component imports
- ✅ StyleSheet removed (5 style definitions → 0)
- ✅ Design tokens used throughout
- ✅ Haptic feedback added
- ✅ Accessibility labels added
- ✅ Primitives used for all UI

---

### Example 2: Login Screen

See `app/(auth)/login.tsx` for full example.

**Key Improvements:**
- 172 lines → 153 lines
- Removed 70 lines of StyleSheet definitions
- Added inline email validation
- Added haptic feedback to all buttons
- Added accessibility labels to all interactive elements
- Enhanced error handling with inline display

---

## Phase 09 Examples (Tab Screens)

### Example 3: Code Tab Screen

See `app/(tabs)/code.tsx` for full example.

**Before (29 lines with StyleSheet):**
```tsx
import { View, Text, StyleSheet } from 'react-native';

export default function CodeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Code Viewer</Text>
      <Text style={styles.subtitle}>File tree and code viewer coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});
```

**After (31 lines with primitives, zero StyleSheet):**
```tsx
import { Box } from '@/ui/adapters';
import { Text } from '@/ui/primitives';
import { tokens } from '@/ui/tokens';

export default function CodeScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor={tokens.colors.background.base}
    >
      <Text
        variant="h1"
        align="center"
        color="primary"
        accessibilityRole="header"
      >
        Code Viewer
      </Text>
      <Text
        variant="body"
        align="center"
        color="secondary"
        style={{ marginTop: tokens.spacing.xs }}
      >
        File tree and code viewer coming soon...
      </Text>
    </Box>
  );
}
```

**Changes:**
- ✅ Zero React Native component imports
- ✅ StyleSheet removed (3 style definitions → 0)
- ✅ Design tokens used for colors and spacing
- ✅ Accessibility role added for header
- ✅ Primitives used for all UI

**Key Pattern:** Simple placeholder screens follow the same pattern as complex screens - just with less logic.

---

### Example 4: Tab Layout with Tokens

See `app/(tabs)/_layout.tsx` for full example.

**Before (hardcoded colors):**
```tsx
<Tabs
  screenOptions={{
    tabBarActiveTintColor: '#2196F3',
    tabBarInactiveTintColor: '#666',
    headerShown: false,
  }}
>
```

**After (design tokens):**
```tsx
import { tokens } from '@/ui/tokens';

<Tabs
  screenOptions={{
    tabBarActiveTintColor: tokens.colors.primary[500],
    tabBarInactiveTintColor: tokens.colors.text.secondary,
    headerShown: false,
  }}
>
```

**Note:** `@expo/vector-icons` is allowed (vendor-agnostic icon library). `Tabs` from `expo-router` is navigation infrastructure, not UI component.

---

## Summary

**Phases 08-09 Complete:**
- ✅ 6 screens refactored (2 auth + 4 tabs)
- ✅ Zero vendor leakage verified
- ✅ All screens pass import audit
- ✅ Accessibility labels added throughout
- ✅ Design tokens used consistently
- ✅ StyleSheet eliminated (140+ lines removed)

**Ready for Phase 10:** Performance audit and final documentation

---

**Status:** Migration guide v2.0 complete ✅
