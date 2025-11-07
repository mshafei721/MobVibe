# Phase 08: Screen Refactor Sequential Plan

**Generated:** 2025-01-06
**Estimated Time:** 2-3 hours
**Risk Level:** Medium
**Screens:** `app/(auth)/login.tsx`, `app/index.tsx`

---

## Table of Contents

1. [Execution Strategy](#execution-strategy)
2. [Welcome Screen Refactoring](#welcome-screen-refactoring)
3. [Login Screen Refactoring](#login-screen-refactoring)
4. [Testing Checkpoints](#testing-checkpoints)
5. [Rollback Plan](#rollback-plan)

---

## Execution Strategy

### Order of Execution (Risk-Minimized)

1. **Pre-Refactor Baseline** (15 min)
2. **Welcome Screen** (30 min) - Simpler, less critical
3. **Login Screen** (1-1.5 hours) - More complex, more critical
4. **Post-Refactor Verification** (30 min)

### Why This Order?

- Welcome screen is simpler → validates the refactoring pattern with lower risk
- Login screen is more complex → benefits from lessons learned on welcome screen
- Both screens tested independently before combined testing
- Git commits after each screen allow easy rollback

---

## Pre-Refactor Baseline

### Checklist

- [ ] Capture screenshot: Welcome screen (light mode)
- [ ] Capture screenshot: Login screen (light mode)
- [ ] Save screenshots to: `reports/ui/phase-08-before-screenshots/`
- [ ] Test: Navigate from welcome → login works
- [ ] Test: Email magic link flow works
- [ ] Test: Google OAuth works (or verify it's configured)
- [ ] Test: Apple OAuth works (or verify it's configured)
- [ ] Test: GitHub OAuth works (or verify it's configured)
- [ ] Run existing tests: `npm test` (if tests exist)
- [ ] Git commit: "Phase 08: Pre-refactor baseline"
- [ ] Note: Current bundle size, TTI

---

## Welcome Screen Refactoring

**File:** `app/index.tsx`
**Current Lines:** 43
**Target Lines:** ~60 (with enhancements)
**Complexity:** LOW

### Step 1: Update Imports

**Remove:**
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
```

**Add:**
```typescript
import { useRouter } from 'expo-router';
import { Box } from '@/ui/adapters';
import { Text, Button } from '@/ui/primitives';
import { tokens } from '@/ui/tokens';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
```

### Step 2: Replace Container

**Before:**
```jsx
<View style={styles.container}>
```

**After:**
```jsx
<Box
  flex={1}
  justifyContent="center"
  alignItems="center"
  backgroundColor={tokens.colors.background.base}
>
```

### Step 3: Replace Title

**Before:**
```jsx
<Text style={styles.title}>MobVibe</Text>
```

**After:**
```jsx
<Text
  variant="h1"
  color="primary"
  accessibilityRole="header"
>
  MobVibe
</Text>
```

### Step 4: Replace Subtitle

**Before:**
```jsx
<Text style={styles.subtitle}>AI-Powered Mobile App Builder</Text>
```

**After:**
```jsx
<Text
  variant="body"
  color="secondary"
  style={{ marginBottom: tokens.spacing.xl }}
>
  AI-Powered Mobile App Builder
</Text>
```

### Step 5: Replace Link with Button

**Before:**
```jsx
<Link href="/(auth)/login" style={styles.link}>
  <Text style={styles.linkText}>Get Started</Text>
</Link>
```

**After:**
```jsx
const router = useRouter();

const handleGetStarted = () => {
  ReactNativeHapticFeedback.trigger('impactLight');
  router.push('/(auth)/login');
};

<Button
  variant="primary"
  onPress={handleGetStarted}
  accessibilityLabel="Get started with MobVibe"
  accessibilityHint="Navigate to login screen"
>
  Get Started
</Button>
```

### Step 6: Remove StyleSheet

**Delete entire block:**
```jsx
const styles = StyleSheet.create({
  // ... all styles
});
```

### Step 7: Testing Checkpoint

- [ ] Screen renders without errors
- [ ] Title displays correctly with primary color
- [ ] Subtitle displays correctly
- [ ] Button displays correctly
- [ ] Button press triggers haptic feedback
- [ ] Button navigates to login screen
- [ ] No console errors
- [ ] Git commit: "Phase 08: Refactor welcome screen with primitives"

---

## Login Screen Refactoring

**File:** `app/(auth)/login.tsx`
**Current Lines:** 172
**Target Lines:** ~150 (simpler due to primitives)
**Complexity:** MEDIUM-HIGH

### Step 1: Update Imports

**Remove:**
```typescript
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
```

**Keep Alert** (utility function, not component)

**Add:**
```typescript
import { Box } from '@/ui/adapters';
import { Text, Input, Button, Divider } from '@/ui/primitives';
import { tokens } from '@/ui/tokens';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
// Keep: useRouter, authService, useAuthStore, useState
```

### Step 2: Add Email Validation State

**Add to component:**
```typescript
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');
const [isLoading, setIsLoading] = useState(false);
```

### Step 3: Replace Container

**Before:**
```jsx
<View style={styles.container}>
```

**After:**
```jsx
<Box
  flex={1}
  justifyContent="center"
  padding={tokens.spacing.lg}
  backgroundColor={tokens.colors.background.base}
>
```

### Step 4: Replace Title and Subtitle

**Before:**
```jsx
<Text style={styles.title}>Welcome to MobVibe</Text>
<Text style={styles.subtitle}>AI-Powered Mobile App Builder</Text>
```

**After:**
```jsx
<Text
  variant="h1"
  align="center"
  color="primary"
  style={{ marginBottom: tokens.spacing.xs }}
>
  Welcome to MobVibe
</Text>
<Text
  variant="body"
  align="center"
  color="secondary"
  style={{ marginBottom: tokens.spacing['2xl'] }}
>
  AI-Powered Mobile App Builder
</Text>
```

### Step 5: Replace Form Container

**Before:**
```jsx
<View style={styles.form}>
```

**After:**
```jsx
<Box style={{ gap: tokens.spacing.md }}>
```

### Step 6: Replace Email Input

**Before:**
```jsx
<TextInput
  style={styles.input}
  placeholder="Email address"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  autoCapitalize="none"
  editable={!isLoading}
/>
```

**After:**
```jsx
<Input
  type="email"
  placeholder="Email address"
  value={email}
  onChangeText={(text) => {
    setEmail(text);
    if (emailError) setEmailError(''); // Clear error on type
  }}
  error={emailError}
  disabled={isLoading}
  autoFocus
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email for magic link authentication"
/>
```

### Step 7: Enhance Email Handler with Validation

**Replace handleEmailLogin:**
```typescript
const handleEmailLogin = async () => {
  // Clear previous errors
  setEmailError('');

  // Validation
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

  ReactNativeHapticFeedback.trigger('impactMedium');
  setIsLoading(true);

  const { error } = await authService.signInWithEmail(email);
  setIsLoading(false);

  if (error) {
    setEmailError(error.message);
    ReactNativeHapticFeedback.trigger('notificationError');
    return;
  }

  ReactNativeHapticFeedback.trigger('notificationSuccess');
  Alert.alert('Success', 'Check your email for the magic link!');
};
```

### Step 8: Replace Email Button

**Before:**
```jsx
<TouchableOpacity
  style={[styles.button, styles.primaryButton]}
  onPress={handleEmailLogin}
  disabled={isLoading}
>
  <Text style={styles.buttonText}>
    {isLoading ? 'Sending...' : 'Continue with Email'}
  </Text>
</TouchableOpacity>
```

**After:**
```jsx
<Button
  variant="primary"
  fullWidth
  onPress={handleEmailLogin}
  disabled={isLoading}
  loading={isLoading}
  accessibilityLabel="Continue with email"
  accessibilityHint="Sends a magic link to your email address"
>
  Continue with Email
</Button>
```

### Step 9: Replace Divider

**Before (complex custom implementation):**
```jsx
<View style={styles.divider}>
  <View style={styles.dividerLine} />
  <Text style={styles.dividerText}>OR</Text>
  <View style={styles.dividerLine} />
</View>
```

**After (single primitive):**
```jsx
<Divider label="OR" />
```

### Step 10: Create OAuth Handler Helper

**Add before JSX:**
```typescript
const handleOAuthLogin = async (provider: 'google' | 'github' | 'apple') => {
  ReactNativeHapticFeedback.trigger('impactLight');
  setIsLoading(true);

  const { error } = await authService.signInWithOAuth(provider);
  setIsLoading(false);

  if (error) {
    ReactNativeHapticFeedback.trigger('notificationError');
    Alert.alert('Error', error.message);
  } else {
    ReactNativeHapticFeedback.trigger('notificationSuccess');
  }
};
```

### Step 11: Replace OAuth Buttons (3x)

**Before (repeated 3 times):**
```jsx
<TouchableOpacity
  style={[styles.button, styles.oauthButton]}
  onPress={() => handleOAuthLogin('google')}
  disabled={isLoading}
>
  <Text style={styles.oauthButtonText}>Continue with Google</Text>
</TouchableOpacity>
```

**After:**
```jsx
<Button
  variant="secondary"
  fullWidth
  onPress={() => handleOAuthLogin('google')}
  disabled={isLoading}
  accessibilityLabel="Sign in with Google"
>
  Continue with Google
</Button>

<Button
  variant="secondary"
  fullWidth
  onPress={() => handleOAuthLogin('apple')}
  disabled={isLoading}
  accessibilityLabel="Sign in with Apple"
>
  Continue with Apple
</Button>

<Button
  variant="secondary"
  fullWidth
  onPress={() => handleOAuthLogin('github')}
  disabled={isLoading}
  accessibilityLabel="Sign in with GitHub"
>
  Continue with GitHub
</Button>
```

### Step 12: Remove StyleSheet

**Delete entire block (~70 lines):**
```jsx
const styles = StyleSheet.create({
  // ... all style definitions
});
```

### Step 13: Testing Checkpoint

- [ ] Screen renders without errors
- [ ] Title and subtitle display correctly
- [ ] Email input accepts text
- [ ] Email validation shows inline errors
- [ ] Empty email shows "Email address is required"
- [ ] Invalid email shows "Please enter a valid email address"
- [ ] Email button disabled when loading
- [ ] Email button shows loading state
- [ ] Haptic feedback on button presses
- [ ] Divider displays with "OR" label
- [ ] All OAuth buttons display correctly
- [ ] OAuth buttons disabled when loading
- [ ] Magic link flow works end-to-end
- [ ] No console errors
- [ ] Git commit: "Phase 08: Refactor login screen with primitives"

---

## Post-Refactor Verification

### Import Audit

```bash
npm run ui:audit-imports -- app/(auth)/ app/index.tsx
```

**Expected Result:**
```
✅ Zero vendor leakage - all UI imports via adapters
```

If violations found, fix before proceeding.

### Screenshot Comparison

- [ ] Capture new screenshots of both screens
- [ ] Save to: `reports/ui/phase-08-after-screenshots/`
- [ ] Compare before/after visually
- [ ] Document any visual differences in `reports/ui/phase-08-visual-diff.md`
- [ ] Acceptable threshold: <5% visual difference

### Functional Testing

**Welcome Screen:**
- [ ] Renders correctly
- [ ] Button navigates to login
- [ ] Haptic feedback works
- [ ] No errors in console

**Login Screen:**
- [ ] Email input works
- [ ] Email validation works (empty, invalid, valid)
- [ ] Email button sends magic link
- [ ] Loading state displays correctly
- [ ] Google OAuth initiates (or shows "not configured" gracefully)
- [ ] Apple OAuth initiates (or shows "not configured" gracefully)
- [ ] GitHub OAuth initiates (or shows "not configured" gracefully)
- [ ] Error states display correctly
- [ ] Success messages display
- [ ] Haptic feedback on all interactions
- [ ] No errors in console

### Accessibility Audit

```bash
npm run test:a11y -- app/(auth)/login.tsx app/index.tsx
```

**Verify:**
- [ ] All interactive elements have accessibilityLabel
- [ ] Buttons have accessibilityHint where appropriate
- [ ] Input fields announce their purpose
- [ ] Error states announced to screen readers
- [ ] Focus order logical
- [ ] No WCAG AA violations

### Performance Check

```bash
npm run test:performance -- app/(auth)/login.tsx app/index.tsx
```

**Measure:**
- [ ] Time to Interactive (TTI)
- [ ] FPS during interactions
- [ ] Memory usage
- [ ] Bundle size impact

**Acceptable Range:** ±10% of baseline

---

## Testing Checkpoints

### Checkpoint 1: After Welcome Screen

**Test:**
1. Navigate from welcome → login
2. Verify all functionality
3. No errors

**If fails:** Rollback to previous commit, debug, retry

### Checkpoint 2: After Login Screen Container

**Test:**
1. Screen renders
2. Title/subtitle display
3. No errors

**If fails:** Check Box props, token usage

### Checkpoint 3: After Email Input

**Test:**
1. Type in email input
2. Validation works
3. Error display works

**If fails:** Check Input primitive API

### Checkpoint 4: After Email Button

**Test:**
1. Magic link flow works
2. Loading state correct
3. Haptics work

**If fails:** Check Button props, loading state

### Checkpoint 5: After Divider

**Test:**
1. Divider displays correctly
2. "OR" label shows

**If fails:** Check Divider primitive API

### Checkpoint 6: After OAuth Buttons

**Test:**
1. All OAuth flows initiate
2. Loading states work
3. Error handling works

**If fails:** Check Button variant, handler logic

### Checkpoint 7: Final Verification

**Test:**
1. All flows end-to-end
2. Import audit passes
3. Visual regression acceptable
4. Accessibility passes
5. Performance acceptable

**If fails:** Review failures, fix, retest

---

## Rollback Plan

### If Welcome Screen Fails

```bash
git reset --hard HEAD~1  # Revert last commit
```

Investigate issue, fix, retry.

### If Login Screen Fails

```bash
git reset --hard HEAD~1  # Revert login screen changes
```

Welcome screen changes preserved. Debug login screen refactoring.

### If Post-Refactor Tests Fail

**Import Audit Failure:**
- Review audit output
- Find violating imports
- Replace with primitives/adapters
- Rerun audit

**Visual Regression Failure (>5%):**
- Review screenshots side-by-side
- Identify differences
- Adjust token usage or primitive props
- May need to check primitive implementations

**Accessibility Failure:**
- Review accessibility report
- Add missing labels/hints
- Fix focus order
- Rerun audit

**Performance Failure (>10% degradation):**
- Profile the screens
- Identify bottlenecks
- Optimize as needed
- May indicate primitive performance issue

---

## Success Criteria

- [ ] Zero direct React Native component imports
- [ ] All functionality preserved (email, OAuth flows work)
- [ ] Inline email validation implemented
- [ ] Accessibility labels on all interactive elements
- [ ] Haptic feedback on all button presses
- [ ] Visual regression <5% threshold
- [ ] Import audit passes with 0 violations
- [ ] Accessibility audit passes (WCAG AA)
- [ ] Performance within ±10% of baseline
- [ ] No console errors or warnings
- [ ] Git history clean with descriptive commits
- [ ] Documentation updated (migration guide started)

---

## Time Estimates

| Task | Estimated Time | Cumulative |
|------|---------------|------------|
| Pre-refactor baseline | 15 min | 15 min |
| Welcome screen refactor | 30 min | 45 min |
| Welcome screen testing | 10 min | 55 min |
| Login screen refactor | 1.5 hours | 2h 25min |
| Login screen testing | 15 min | 2h 40min |
| Post-refactor verification | 30 min | 3h 10min |
| **Total** | **~3 hours** | |

---

**Status:** Execution plan complete - Ready for implementation ✅
