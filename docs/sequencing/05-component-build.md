# Phase 05 Implementation Plan - Component Build

**Generated:** 2025-11-06
**Method:** Sequential Thinking (20 steps)
**Components:** Divider, Spinner, Icon, Card, ListItem, Sheet

---

## Implementation Order

**Rationale:** Build from simplest to most complex, ensuring dependencies are available.

1. **Divider** (0.5 hours) - Simplest, no dependencies
2. **Spinner** (0.75 hours) - Simple wrapper, no dependencies
3. **Icon** (1 hour) - Needed by ListItem, requires @expo/vector-icons
4. **Card** (1.5 hours) - Container component, platform-specific shadows
5. **ListItem** (1.5 hours) - Uses Icon, Text, Button components
6. **Sheet** (2 hours) - Most complex, modal with gestures and focus management

**Total Component Development:** 7.25 hours

---

## Component Specifications

### 1. Divider Component

**File:** `src/ui/primitives/Divider.tsx`

**API:**
```typescript
interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: number;  // tokens.spacing key (default: 2)
  color?: string;    // token color or hex (default: tokens.colors.neutral[200])
}
```

**Implementation:**
- Simple View with 1px height (horizontal) or width (vertical)
- Background color from tokens.colors.neutral[200] by default
- Margin from tokens.spacing (vertical for horizontal, horizontal for vertical)

**Accessibility:**
- Completely hidden from screen readers
- `accessibilityElementsHidden={true}` (iOS)
- `importantForAccessibility="no"` (Android)

**Styling:**
```typescript
const styles = {
  horizontal: {
    height: 1,
    width: '100%',
    backgroundColor: color || tokens.colors.neutral[200],
    marginVertical: tokens.spacing[spacing || 2],
  },
  vertical: {
    width: 1,
    height: '100%',
    backgroundColor: color || tokens.colors.neutral[200],
    marginHorizontal: tokens.spacing[spacing || 2],
  },
};
```

**Time Estimate:** 30 minutes

---

### 2. Spinner Component

**File:** `src/ui/primitives/Spinner.tsx`

**API:**
```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;  // Default: tokens.colors.primary[500]
  accessibilityLabel: string;  // REQUIRED (e.g., "Loading user profile")
}
```

**Implementation:**
- Wrapper around React Native ActivityIndicator
- Size mapping: sm=16, md=32, lg=48
- Container View with accessibility props

**Accessibility:**
```typescript
<View
  accessibilityLiveRegion="polite"
  accessibilityLabel={accessibilityLabel}
  accessibilityRole="progressbar"
  accessibilityState={{ busy: true }}
>
  <ActivityIndicator size={sizeValue} color={color || tokens.colors.primary[500]} />
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

**Time Estimate:** 45 minutes

---

### 3. Icon Component

**File:** `src/ui/primitives/Icon.tsx`

**API:**
```typescript
interface IconProps {
  family: 'ionicons' | 'material' | 'feather';
  name: string;
  size?: 'sm' | 'md' | 'lg' | number;
  color?: string;  // Default: tokens.colors.neutral[900]
  accessibilityLabel?: string;  // Required if icon is meaningful
}
```

**Implementation:**
- Import Ionicons, MaterialIcons, Feather from @expo/vector-icons
- Conditional rendering based on family prop
- Size mapping: sm=16, md=24, lg=32
- If accessibilityLabel provided: accessible, otherwise hidden

**Icon Families:**
```typescript
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

const IconComponent = {
  ionicons: Ionicons,
  material: MaterialIcons,
  feather: Feather,
}[family];

return (
  <IconComponent
    name={name}
    size={typeof size === 'number' ? size : iconSizes[size || 'md']}
    color={color || tokens.colors.neutral[900]}
    accessibilityLabel={accessibilityLabel}
    {...(accessibilityLabel ? {} : { accessibilityElementsHidden: true })}
  />
);
```

**Common Icons:**
- Navigation: chevron-right, arrow-back, menu
- Actions: close, add, delete, edit, search
- Indicators: checkmark, alert-circle, information-circle
- Media: play, pause, volume-high

**Time Estimate:** 1 hour (includes @expo/vector-icons verification)

---

### 4. Card Component

**File:** `src/ui/primitives/Card.tsx`

**API:**
```typescript
interface CardProps {
  variant?: 'flat' | 'raised' | 'floating';
  padding?: number;  // tokens.spacing key (default: 4)
  onPress?: () => void;  // Makes card touchable
  accessibilityLabel?: string;  // Required if onPress provided
  children: React.ReactNode;
}
```

**Implementation:**
- View container with border radius from tokens
- Platform.select() for iOS shadows vs Android elevation
- If onPress: wrap in TouchableOpacity with haptic feedback
- IMPORTANT: Do NOT use overflow: 'hidden' on iOS (shadows disappear)

**Elevation Styles:**
```typescript
const getElevationStyle = (variant: 'flat' | 'raised' | 'floating') => {
  const elevations = {
    flat: 0,
    raised: 4,
    floating: 8,
  };

  const elevation = elevations[variant];

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

**Base Styles:**
```typescript
const baseStyles = {
  backgroundColor: tokens.colors.background.base,
  borderRadius: tokens.spacing.borderRadius.lg,
  padding: tokens.spacing[padding || 4],
};
```

**Accessibility:**
- If touchable: `accessibilityRole="button"`, `accessibilityLabel` required
- If container only: No special accessibility role

**Time Estimate:** 1.5 hours

---

### 5. ListItem Component

**File:** `src/ui/primitives/ListItem.tsx`

**API:**
```typescript
interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: {
    family: 'ionicons' | 'material' | 'feather';
    name: string;
  };
  rightIcon?: 'chevron' | 'none';  // 'chevron' shows disclosure indicator
  onPress?: () => void;
  accessibilityLabel?: string;  // Auto-generated from title+subtitle if not provided
  accessibilityHint?: string;  // e.g., "Double tap to view details"
}
```

**Implementation:**
- TouchableOpacity container (even if no onPress, for visual feedback)
- Horizontal flexbox layout
- Left icon (24px) + spacing + content area + right chevron
- Haptic feedback on press using react-native-haptic-feedback
- Minimum height: 48dp (Android) / 44pt (iOS)

**Layout:**
```typescript
<TouchableOpacity
  style={styles.container}
  onPress={handlePress}
  accessible={true}
  accessibilityRole={onPress ? 'button' : 'none'}
  accessibilityLabel={accessibilityLabel || `${title}${subtitle ? `, ${subtitle}` : ''}`}
  accessibilityHint={accessibilityHint}
  disabled={!onPress}
>
  {leftIcon && (
    <Icon
      family={leftIcon.family}
      name={leftIcon.name}
      size="md"
      color={tokens.colors.neutral[600]}
    />
  )}

  <View style={styles.content}>
    <Text variant="body" weight="medium">{title}</Text>
    {subtitle && (
      <Text variant="caption" color={tokens.colors.neutral[600]}>
        {subtitle}
      </Text>
    )}
  </View>

  {rightIcon === 'chevron' && (
    <Icon
      family="ionicons"
      name="chevron-forward"
      size="sm"
      color={tokens.colors.neutral[400]}
    />
  )}
</TouchableOpacity>
```

**Styles:**
```typescript
const styles = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Platform.OS === 'ios' ? 44 : 48,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    gap: tokens.spacing[3],
  },
  content: {
    flex: 1,
  },
};
```

**Time Estimate:** 1.5 hours

---

### 6. Sheet Component

**File:** `src/ui/primitives/Sheet.tsx`

**API:**
```typescript
interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;  // REQUIRED (e.g., "Filter options")
}
```

**Implementation:**
- Use React Native Modal component
- Transparent backdrop with TouchableWithoutFeedback for tap-to-close
- Animated slide-up/down (respect reduce motion)
- Focus trap via accessibilityViewIsModal
- Optional: PanGestureHandler for swipe-down dismissal (future enhancement)

**Structure:**
```typescript
<Modal
  visible={visible}
  transparent
  animationType="slide"  // Or 'none' if reduce motion enabled
  onRequestClose={onClose}
  accessibilityViewIsModal={true}
>
  {/* Backdrop */}
  <TouchableWithoutFeedback onPress={onClose}>
    <View
      style={styles.backdrop}
      accessibilityRole="button"
      accessibilityLabel="Close sheet"
    />
  </TouchableWithoutFeedback>

  {/* Sheet Content */}
  <View style={styles.sheet} accessibilityLabel={accessibilityLabel}>
    {children}
  </View>
</Modal>
```

**Styles:**
```typescript
const styles = {
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: tokens.colors.background.base,
    borderTopLeftRadius: tokens.spacing.borderRadius.xl,
    borderTopRightRadius: tokens.spacing.borderRadius.xl,
    paddingTop: tokens.spacing[6],
    paddingHorizontal: tokens.spacing[4],
    paddingBottom: tokens.spacing[8],
    maxHeight: '80%',
  },
};
```

**Accessibility:**
- `accessibilityViewIsModal` traps focus
- Backdrop announced as "button" with "Close sheet" label
- Sheet content gets provided accessibilityLabel
- Screen reader announces when modal opens

**Reduce Motion:**
```typescript
import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
}, []);

<Modal animationType={reduceMotion ? 'none' : 'slide'} />
```

**Time Estimate:** 2 hours

---

## Testing Strategy

### Unit Tests

**Total:** 6 test files, ~48 tests, 2.5 hours

#### Divider.test.tsx (8 tests)
- Renders horizontal divider by default
- Renders vertical divider when orientation="vertical"
- Applies custom color
- Applies custom spacing
- Hidden from accessibility tree (iOS)
- Hidden from accessibility tree (Android)
- Uses token colors by default
- Uses token spacing by default

#### Spinner.test.tsx (8 tests)
- Renders with default size (md)
- Renders all size variants (sm, md, lg)
- Uses custom color
- Uses token color by default
- Has required accessibilityLabel
- Has accessibilityLiveRegion="polite"
- Has accessibilityRole="progressbar"
- Has accessibilityState.busy=true

#### Icon.test.tsx (8 tests)
- Renders Ionicons family
- Renders MaterialIcons family
- Renders Feather family
- Applies size variants (sm, md, lg)
- Applies custom numeric size
- Applies custom color
- Hides decorative icons from accessibility
- Shows meaningful icons with accessibilityLabel

#### Card.test.tsx (8 tests)
- Renders children correctly
- Applies flat variant (no elevation)
- Applies raised variant (medium elevation)
- Applies floating variant (high elevation)
- Applies custom padding
- Becomes touchable when onPress provided
- Calls onPress when pressed
- Has accessibilityRole="button" when touchable

#### ListItem.test.tsx (8 tests)
- Renders title
- Renders title and subtitle
- Renders left icon when provided
- Renders right chevron when rightIcon="chevron"
- Calls onPress when pressed
- Combines title+subtitle in accessibilityLabel
- Has minimum touch target height
- Triggers haptic feedback on press

#### Sheet.test.tsx (8 tests)
- Shows when visible=true
- Hides when visible=false
- Calls onClose when backdrop pressed
- Calls onClose on Android back button (onRequestClose)
- Has accessibilityViewIsModal=true
- Backdrop has button role and close label
- Content has provided accessibilityLabel
- Uses 'none' animation when reduce motion enabled

### Accessibility Tests

**File:** `a11y-phase05.test.tsx`
**Time:** 1.5 hours

**Coverage:**
- Spinner live region announcements
- Icon decorative vs meaningful handling
- Card touchable accessibility
- ListItem combined labels and touch targets
- Sheet modal focus trap and close action
- Divider hidden from screen readers
- Platform-specific requirements (iOS/Android)

**Manual Testing Checklist:**
- [ ] VoiceOver (iOS) announces all components correctly
- [ ] TalkBack (Android) announces all components correctly
- [ ] Touch targets meet minimums (44pt/48dp)
- [ ] Reduce motion settings respected (Sheet animations)
- [ ] Haptic feedback works on ListItem press
- [ ] Sheet backdrop tap-to-close works
- [ ] Icons load from all 3 families

---

## Documentation Updates

### ComponentGallery.tsx Updates (1.5 hours)

Add 6 new sections after existing primitives:

1. **Divider Section:**
   - Horizontal dividers with spacing variants
   - Vertical divider in horizontal flexbox
   - Custom color examples

2. **Spinner Section:**
   - All 3 sizes (sm, md, lg)
   - Custom colors
   - With descriptive labels

3. **Icon Section:**
   - Grid of common icons
   - All 3 families showcased
   - Size variants

4. **Card Section:**
   - All variants (flat, raised, floating)
   - Touchable card example
   - Card with content

5. **ListItem Section:**
   - Basic (title only)
   - With subtitle
   - With left icon
   - With chevron
   - All combined

6. **Sheet Section:**
   - Button to open sheet
   - Example sheet content
   - Close button inside sheet

Maintain light/dark theme toggle from Phase 04.

### USAGE.md Updates (1.5 hours)

Document all 10 primitives (4 from Phase 04 + 6 from Phase 05):

**Structure per component:**
- Component name and description
- Props table with types and defaults
- Usage examples (3-4 variants)
- Accessibility guidelines
- Common patterns

**New Components:**
1. Divider - Horizontal/vertical separator
2. Spinner - Loading indicator with accessibility
3. Icon - Vector icons from @expo/vector-icons
4. Card - Container with elevation
5. ListItem - Navigation list row
6. Sheet - Bottom modal sheet

**Common Patterns Section:**
- Form with Input + Button
- List with ListItem + Divider
- Loading state with Spinner
- Modal with Sheet + Card

---

## TypeScript Exports

**File:** `src/ui/primitives/index.ts`
**Time:** 15 minutes

Update barrel exports:

```typescript
// Phase 04 components
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Text } from './Text';
export type { TextProps } from './Text';

export { Input } from './Input';
export type { InputProps } from './Input';

// Phase 05 components
export { Divider } from './Divider';
export type { DividerProps } from './Divider';

export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

export { Icon } from './Icon';
export type { IconProps } from './Icon';

export { Card } from './Card';
export type { CardProps } from './Card';

export { ListItem } from './ListItem';
export type { ListItemProps } from './ListItem';

export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';

// Tokens
export { tokens } from '../tokens';
```

---

## Dependencies

**Required:**
1. `@expo/vector-icons` - Should be included with Expo by default
2. `react-native-haptic-feedback` - Already installed in Phase 04
3. `react-native-gesture-handler` - Check if installed (for Sheet gestures - optional)

**Verification:**
```bash
npm list @expo/vector-icons
npm list react-native-haptic-feedback
```

**If needed:**
```bash
npm install @expo/vector-icons
```

---

## Platform-Specific Considerations

### iOS vs Android

1. **Card Shadows:**
   - iOS: shadowColor, shadowOffset, shadowOpacity, shadowRadius
   - Android: elevation (single numeric value)
   - Use Platform.select() for conditional styling

2. **Touch Targets:**
   - iOS: 44pt minimum
   - Android: 48dp minimum
   - Apply to ListItem and touchable Card

3. **Haptic Feedback:**
   - Already configured in Phase 04
   - Use 'impactLight' for ListItem press

4. **Reduce Motion:**
   - Check AccessibilityInfo.isReduceMotionEnabled()
   - Apply to Sheet animations

5. **Icon Sizing:**
   - Use numeric values (16, 24, 32)
   - Avoid string values for cross-platform consistency

---

## Risk Mitigation

### Risk 1: Sheet Complexity
**Impact:** May exceed time estimate
**Mitigation:** Start with Modal + backdrop tap only. Defer swipe-down gestures to future iteration if time is tight. Core functionality (show/hide, backdrop dismiss, accessibility) takes priority.

### Risk 2: Icon Bundle Size
**Impact:** May increase app bundle size
**Mitigation:** @expo/vector-icons is tree-shakeable - only used icons are bundled. No action needed.

### Risk 3: Platform Shadow Differences
**Impact:** Cards may look inconsistent across platforms
**Mitigation:** Test on both iOS and Android. Adjust shadow opacity/radius values to match visual weight of Android elevation.

### Risk 4: Test Coverage <80%
**Impact:** Fails acceptance criteria
**Mitigation:** Prioritize unit tests for complex components (Sheet, ListItem, Card). Simple components (Divider, Spinner) need fewer tests but still counted toward coverage.

---

## Token Usage Verification

**All components must use tokens exclusively:**

✓ Colors: `tokens.colors.*`
✓ Spacing: `tokens.spacing[1-8]`, `tokens.spacing.borderRadius.*`
✓ Typography: `tokens.typography.*`
✓ Motion: `tokens.motion.duration.*`

**Verification method:**
- Manual review during implementation
- Token audit script (if available)
- No hardcoded hex colors, spacing values, or font sizes allowed

---

## Time Breakdown

| Task | Time | Cumulative |
|------|------|------------|
| Divider component | 0.5h | 0.5h |
| Spinner component | 0.75h | 1.25h |
| Icon component | 1h | 2.25h |
| Card component | 1.5h | 3.75h |
| ListItem component | 1.5h | 5.25h |
| Sheet component | 2h | 7.25h |
| Unit tests (6 files) | 2.5h | 9.75h |
| Accessibility tests | 1.5h | 11.25h |
| ComponentGallery updates | 1.5h | 12.75h |
| USAGE.md updates | 1.5h | 14.25h |
| TypeScript exports | 0.25h | 14.5h |

**Total:** ~14.5 hours ≈ 1.8 working days (within 1.5-2 day estimate)

---

## Acceptance Criteria Verification

From Phase 05 plan:

1. ✅ **Card, Sheet, ListItem, Icon, Divider, Spinner components complete**
   - All 6 components planned and specified

2. ✅ **All components pass accessibility audit**
   - Dedicated a11y test file
   - VoiceOver/TalkBack manual testing checklist
   - WCAG AA compliance built into each component

3. ✅ **Component gallery updated with new primitives**
   - 6 new sections planned with examples
   - Light/dark theme maintained

4. ✅ **Full test coverage (>80%)**
   - 48 unit tests planned
   - Comprehensive accessibility tests
   - Coverage target achievable

5. ✅ **Documentation complete for all 10 primitives**
   - USAGE.md includes all Phase 04 + Phase 05 components
   - Props tables, examples, accessibility guidelines

**All acceptance criteria will be met.**

---

## Next Steps

1. ✅ Planning complete (this document)
2. ⏭️ Install/verify @expo/vector-icons
3. ⏭️ Build components in order
4. ⏭️ Write tests
5. ⏭️ Update gallery and documentation
6. ⏭️ Create Phase 05 completion summary

---

**Status:** Planning Complete
**Ready to Implement:** Yes
**Estimated Duration:** 1.8 working days
**Dependencies:** None blocking
