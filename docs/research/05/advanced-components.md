# Advanced Component Patterns Research

**Phase:** 05 - Core Primitives Part 2
**Date:** 2025-11-06
**Research Focus:** Bottom Sheet, Card Elevation, Spinner Accessibility

---

## Overview

Research findings for advanced primitive components: Sheet (bottom sheet modal), Card (container with elevation), and Spinner (loading indicator). Focus on cross-platform implementation, accessibility compliance, and modern best practices.

---

## 1. Bottom Sheet Modal

### Key Findings

**Popular Library:**
- `@gorhom/react-native-bottom-sheet` - Most widely recommended (performant, accessible)
- Built on `react-native-reanimated` and `react-native-gesture-handler`
- React Native AMA provides accessibility-focused implementation

**Accessibility Requirements (WCAG AA):**

1. **Focus Management:**
   - Trap focus within modal when open
   - Return focus to trigger element on close
   - First focusable element gets initial focus

2. **Screen Reader Support:**
   - Overlay announced as "button" for dismissal
   - closeActionAccessibilityLabel required for close button
   - Modal content changes announced via aria-live

3. **Gesture Dismissal:**
   - Swipe down to close (native mobile pattern)
   - Tap on overlay/backdrop to close
   - Programmatic close (X button)

4. **Animation & Motion:**
   - Respect `prefers-reduced-motion` system setting
   - Use slide-in/slide-out only if reduce motion enabled
   - Otherwise instant show/hide

5. **Testing:**
   - Test with VoiceOver (iOS)
   - Test with TalkBack (Android)
   - Verify focus trap works correctly

### Implementation Recommendations

**Approach 1: Simplified Custom (Recommended for Phase 05)**
- Use React Native Modal component
- Implement gesture handler for swipe dismissal
- Add backdrop with onPress close
- Keep simple, avoid complex snap points initially

**Approach 2: Third-Party Library (Future)**
- `@gorhom/react-native-bottom-sheet` if complex features needed
- Adds ~100KB to bundle
- Handles gestures, snap points, dynamic height

**Key Props:**
```typescript
interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
  snapPoints?: string[];  // Future enhancement
}
```

**Accessibility Implementation:**
```typescript
<Modal
  visible={visible}
  transparent
  animationType={reducedMotion ? 'none' : 'slide'}
  onRequestClose={onClose}
  accessibilityViewIsModal={true}
>
  <TouchableWithoutFeedback onPress={onClose}>
    <View style={styles.backdrop} accessibilityRole="button" accessibilityLabel="Close sheet" />
  </TouchableWithoutFeedback>
  <View style={styles.sheet} accessibilityLabel={accessibilityLabel}>
    {children}
  </View>
</Modal>
```

---

## 2. Card Component with Elevation

### Key Findings

**Cross-Platform Shadow Implementation:**

**2025 Update - New Architecture:**
- `boxShadow` style prop now available (cross-platform)
- Simplifies implementation significantly
- Works on new React Native architecture

**Traditional Approach (Current):**
- iOS: `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`
- Android: `elevation` (single numeric value)
- Use `Platform.select()` to conditionally apply

**Important Constraints:**
- **iOS:** Do NOT use `overflow: 'hidden'` - shadows disappear
- **Android:** Elevation requires API 21+ (supported by Expo)
- **iOS:** `shadowColor` must be set for other shadow props to work

### Implementation Recommendations

**Elevation Levels (Material Design):**
```typescript
const elevations = {
  none: 0,
  sm: 2,   // 2dp elevation
  md: 4,   // 4dp elevation (default card)
  lg: 8,   // 8dp elevation (raised card)
  xl: 16,  // 16dp elevation (floating card)
};
```

**Cross-Platform Function:**
```typescript
const getElevationStyle = (elevation: number) => {
  return Platform.select({
    ios: {
      shadowColor: tokens.colors.neutral[900],
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: 0.1 + (elevation / 100),
      shadowRadius: elevation,
    },
    android: {
      elevation,
    },
  });
};
```

**Card Variants:**
- `flat` - No elevation (border only)
- `raised` - Medium elevation (default)
- `floating` - High elevation

**Accessibility:**
- Card as container: No special role required
- Touchable card: `accessibilityRole="button"`
- Group related content with accessibility labels

---

## 3. Loading Spinner Accessibility

### Key Findings

**WCAG Guideline:**
- WCAG 4.1.3 Status Messages (Level AA)
- Ensures screen reader users know when page is loading/busy
- Visual indication must have non-visual equivalent

**Screen Reader Announcements:**

1. **ARIA Live Regions:**
   - `aria-live="polite"` - Announce when user is idle
   - `aria-live="assertive"` - Interrupt immediately (use sparingly)
   - React Native equivalent: `accessibilityLiveRegion="polite"`

2. **Role & State:**
   - `role="status"` - Announces content changes
   - `aria-busy="true"` - Indicates loading state
   - React Native: `accessibilityState={{ busy: true }}`

3. **Descriptive Labels:**
   - Avoid generic "Loading..."
   - Use specific: "Loading user profile", "Saving changes"
   - React Native: `accessibilityLabel="Loading user profile"`

**Motion Sensitivity:**
- Respect `prefers-reduced-motion` system setting
- Provide static alternative (e.g., pulsing dots instead of spinning)
- React Native: Check `AccessibilityInfo.isReduceMotionEnabled()`

### Implementation Recommendations

**Built-in vs Custom:**
- Use `ActivityIndicator` (built-in) for simple cases
- Custom SVG/Lottie animations for branded loading

**Accessibility Props:**
```typescript
<View
  accessibilityLiveRegion="polite"
  accessibilityLabel="Loading content"
  accessibilityRole="progressbar"
  accessibilityState={{ busy: true }}
>
  <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
</View>
```

**Size Variants:**
```typescript
const spinnerSizes = {
  sm: 16,   // Inline loading
  md: 32,   // Default
  lg: 48,   // Page loading
};
```

**Best Practices:**
1. Always provide descriptive label
2. Announce when loading starts
3. Announce when loading completes
4. Show spinner only if operation > 1 second
5. Provide cancel option for long operations

---

## 4. Icon Component

### Key Findings

**Library Recommendation:**
- `@expo/vector-icons` (built into Expo)
- 10+ icon families (Ionicons, MaterialIcons, Feather, etc.)
- Tree-shakeable (unused icons not bundled)

**Accessibility Considerations:**

1. **Decorative vs. Meaningful:**
   - Decorative: `accessibilityElementsHidden={true}` (iOS) or `importantForAccessibility="no-hide-descendants"` (Android)
   - Meaningful: Provide `accessibilityLabel`

2. **Icon-Only Buttons:**
   - Always provide `accessibilityLabel`
   - Example: Search icon → "Search"

3. **Icon + Text:**
   - Icon can be decorative
   - Text provides the label

**Icon Families:**
- **Ionicons** - iOS-style, good for cross-platform
- **MaterialIcons** - Material Design
- **Feather** - Minimalist, clean
- **FontAwesome** - Comprehensive set

### Implementation Recommendations

**Props:**
```typescript
interface IconProps {
  name: string;
  family?: 'ionicons' | 'material' | 'feather';
  size?: 'sm' | 'md' | 'lg' | number;
  color?: string;
  accessibilityLabel?: string;  // Required if meaningful
}
```

**Size Mapping:**
```typescript
const iconSizes = {
  sm: 16,
  md: 24,  // Default, matches text
  lg: 32,
};
```

**Common Icons:**
- Navigation: chevron-right, arrow-back
- Actions: close, add, delete, edit
- Indicators: checkmark, alert-circle, info
- Media: play, pause, volume

---

## 5. ListItem Component

### Key Findings

**Common Patterns:**
- Title + optional subtitle
- Left icon/avatar
- Right icon (disclosure chevron) or action
- Touchable for navigation
- Haptic feedback on press

**Accessibility:**

1. **Combined Labels:**
   - Merge title + subtitle into single label
   - Example: "John Doe, Software Engineer"

2. **Action Hints:**
   - "Double tap to view details"
   - "Double tap to navigate to user profile"

3. **List Semantics:**
   - Wrap in FlatList with proper roles
   - Each item gets proper navigation hints

### Implementation Recommendations

**Props:**
```typescript
interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: { name: string; family: string };
  rightIcon?: 'chevron' | 'none';
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}
```

**Variants:**
- Default: Title only
- TwoLine: Title + subtitle
- WithIcon: Left icon + title
- Navigable: Right chevron indicator

**Touch Targets:**
- Minimum 48dp height (Android) / 44pt (iOS)
- Full-width touchable area

---

## 6. Divider Component

### Key Findings

**Purpose:**
- Visual separation between content
- Horizontal (most common) or vertical
- Purely decorative (ignored by screen readers)

**Accessibility:**
- `accessibilityElementsHidden={true}` (iOS)
- `importantForAccessibility="no"` (Android)
- No screen reader announcement needed

### Implementation Recommendations

**Props:**
```typescript
interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: number;  // Margin above/below or left/right
  color?: string;
}
```

**Styling:**
```typescript
const styles = {
  horizontal: {
    height: 1,
    backgroundColor: tokens.colors.neutral[200],
    marginVertical: tokens.spacing[2],
  },
  vertical: {
    width: 1,
    backgroundColor: tokens.colors.neutral[200],
    marginHorizontal: tokens.spacing[2],
  },
};
```

---

## Summary & Recommendations

### Phase 05 Decisions

1. **Sheet Component:**
   - Build simplified custom version
   - Use React Native Modal + gesture handlers
   - Focus on accessibility first
   - Defer complex snap points to later phase

2. **Card Component:**
   - Use Platform.select() for shadow/elevation
   - Support 3 elevation levels (flat, raised, floating)
   - Optional touchable variant
   - Ensure overflow: 'visible' on iOS

3. **Spinner Component:**
   - Wrap ActivityIndicator with accessibility
   - Respect reduce motion preference
   - Descriptive labels required
   - Size variants (sm, md, lg)

4. **Icon Component:**
   - Thin wrapper around @expo/vector-icons
   - Support 3 families (Ionicons, Material, Feather)
   - Size and color from tokens
   - Decorative vs. meaningful handling

5. **ListItem Component:**
   - Build on Button, Text, Icon primitives
   - Combined accessibility labels
   - Haptic feedback on press
   - Disclosure chevron for navigation

6. **Divider Component:**
   - Simplest component
   - Horizontal/vertical orientations
   - Hidden from accessibility tree

### Testing Checklist

- [ ] All components render correctly on iOS and Android
- [ ] VoiceOver announces content properly
- [ ] TalkBack announces content properly
- [ ] Touch targets meet minimum sizes
- [ ] Reduce motion respected
- [ ] Token system used exclusively
- [ ] TypeScript types complete
- [ ] Unit tests pass
- [ ] Accessibility tests pass

---

**References:**
- [React Native Bottom Sheet](https://gorhom.dev/react-native-bottom-sheet/)
- [React Native Shadow Props](https://reactnative.dev/docs/shadow-props)
- [WCAG 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html)
- [@expo/vector-icons](https://docs.expo.dev/guides/icons/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)

---

**Status:** Complete
**Next:** Sequential thinking for implementation plan
