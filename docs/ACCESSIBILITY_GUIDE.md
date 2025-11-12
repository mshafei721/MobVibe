# Accessibility Guide (WCAG 2.1 AA Compliance)

Complete accessibility implementation guide for MobVibe.

## Table of Contents

1. [Overview](#overview)
2. [Screen Reader Support](#screen-reader-support)
3. [Visual Accessibility](#visual-accessibility)
4. [Keyboard Navigation](#keyboard-navigation)
5. [Motion & Animations](#motion--animations)
6. [Testing](#testing)
7. [Compliance Checklist](#compliance-checklist)

---

## Overview

MobVibe targets **WCAG 2.1 Level AA** compliance to ensure the app is usable by people with disabilities.

### Accessibility Features

- ✅ Screen reader support (TalkBack, VoiceOver)
- ✅ Color contrast compliance (4.5:1 minimum)
- ✅ Scalable text (up to 200%)
- ✅ Touch target sizes (44x44pt minimum)
- ✅ Reduced motion support
- ✅ Focus indicators
- ✅ Alternative text for images
- ✅ Semantic HTML/components

---

## Screen Reader Support

### Implementation

**1. Accessibility Labels**
```typescript
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Create new project"
  accessibilityHint="Opens project creation dialog"
  onPress={handleCreate}
>
  <Text>New Project</Text>
</Pressable>
```

**2. Accessibility States**
```typescript
<AnimatedButton
  accessibilityRole="button"
  accessibilityLabel="Submit form"
  accessibilityState={{
    disabled: isSubmitting,
    busy: isSubmitting,
  }}
  disabled={isSubmitting}
>
  Submit
</AnimatedButton>
```

**3. Accessibility Values**
```typescript
<Slider
  accessibilityRole="adjustable"
  accessibilityLabel="Font size"
  accessibilityValue={{
    min: 12,
    max: 24,
    now: fontSize,
    text: `${fontSize} pixels`,
  }}
/>
```

**4. Live Regions**
```typescript
<View
  accessible={true}
  accessibilityRole="alert"
  accessibilityLiveRegion="polite"
>
  <Text>{statusMessage}</Text>
</View>
```

### Best Practices

**DO:**
- ✅ Provide meaningful labels
- ✅ Include hints for complex actions
- ✅ Update state dynamically
- ✅ Group related elements
- ✅ Announce important changes

**DON'T:**
- ❌ Use generic labels ("button", "click here")
- ❌ Repeat visible text in labels
- ❌ Over-explain obvious actions
- ❌ Break semantic structure
- ❌ Ignore disabled states

### Component Examples

**Button with Icon:**
```typescript
<AnimatedButton
  accessibilityRole="button"
  accessibilityLabel="Delete project"
  accessibilityHint="Removes this project permanently"
  leftIcon={<TrashIcon />}
>
  Delete
</AnimatedButton>
```

**Custom Component:**
```typescript
<View
  accessible={true}
  accessibilityRole="header"
  accessibilityLabel={`${projectName}, created ${createdDate}`}
>
  <Text variant="h2">{projectName}</Text>
  <Text variant="caption">{createdDate}</Text>
</View>
```

---

## Visual Accessibility

### Color Contrast

All text must meet **WCAG AA** contrast ratios:

| Text Size | Minimum Ratio |
|-----------|---------------|
| Normal text (<18pt) | 4.5:1 |
| Large text (≥18pt) | 3:1 |
| UI components | 3:1 |

**Verify Contrast:**
```typescript
import { tokens } from '@/src/ui/tokens';

// Primary text on background (4.5:1 minimum)
const primaryTextColor = tokens.colors.text.primary;  // #1F2937
const backgroundColor = tokens.colors.background.base; // #FFFFFF

// Secondary text on background (4.5:1 minimum)
const secondaryTextColor = tokens.colors.text.secondary; // #6B7280
```

**Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Stark Plugin](https://www.getstark.co/)

### Scalable Text

The Text component supports font scaling:

```typescript
<Text
  variant="body"
  allowFontScaling={true}        // Enable system font scaling
  maxFontSizeMultiplier={2}      // Maximum 200% scaling
>
  Scalable text content
</Text>
```

**Test Font Scaling:**
- iOS: Settings → Display & Brightness → Text Size
- Android: Settings → Display → Font Size

### Touch Targets

Minimum touch target size: **44x44pt** (iOS HIG, Android Material Design)

```typescript
const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
  },
});
```

**Exception**: Small inline buttons must have adequate spacing (8pt minimum).

### Focus Indicators

All interactive elements show focus state:

```typescript
<Pressable
  style={({ pressed, focused }) => [
    styles.button,
    focused && styles.focused,  // Visual focus indicator
  ]}
>
  <Text>Interactive Element</Text>
</Pressable>

const styles = StyleSheet.create({
  focused: {
    borderWidth: 2,
    borderColor: tokens.colors.primary,
    shadowOpacity: 0.3,
  },
});
```

---

## Keyboard Navigation

### Tab Order

Ensure logical tab order:

```typescript
// Use tabIndex for custom components (web)
<View tabIndex={0} accessible={true}>
  <Text>First focusable element</Text>
</View>

<View tabIndex={1} accessible={true}>
  <Text>Second focusable element</Text>
</View>
```

### Keyboard Shortcuts

Common shortcuts should be documented:

| Shortcut | Action |
|----------|--------|
| Tab | Next element |
| Shift+Tab | Previous element |
| Enter/Space | Activate |
| Escape | Close modal |
| Arrow keys | Navigate lists |

---

## Motion & Animations

### Reduced Motion Support

Respect user's motion preferences:

```typescript
import { AccessibilityInfo } from 'react-native';
import { getAccessibleAnimationConfig } from '@/src/animations';

const [reducedMotion, setReducedMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
    setReducedMotion(enabled);
  });

  const subscription = AccessibilityInfo.addEventListener(
    'reduceMotionChanged',
    setReducedMotion
  );

  return () => subscription.remove();
}, []);

// Use accessible animation config
const animationConfig = getAccessibleAnimationConfig(reducedMotion);
```

**Animation Guidelines:**
- ✅ Provide option to disable animations
- ✅ Reduce animation duration when reduced motion is enabled
- ✅ Keep essential animations (loading, progress)
- ✅ Test with accessibility settings enabled

---

## Testing

### Manual Testing

**iOS (VoiceOver):**
1. Settings → Accessibility → VoiceOver → Enable
2. Swipe right/left to navigate
3. Double-tap to activate
4. Three-finger swipe to scroll

**Android (TalkBack):**
1. Settings → Accessibility → TalkBack → Enable
2. Swipe right/left to navigate
3. Double-tap to activate
4. Two-finger swipe to scroll

### Automated Testing

```typescript
import { render } from '@testing-library/react-native';

describe('Accessibility', () => {
  it('has proper accessibility labels', () => {
    const { getByLabelText } = render(<MyComponent />);

    expect(getByLabelText('Create project')).toBeTruthy();
  });

  it('has proper accessibility roles', () => {
    const { getByRole } = render(<MyComponent />);

    expect(getByRole('button')).toBeTruthy();
  });

  it('announces state changes', () => {
    const { getByA11yState } = render(<MyComponent />);

    expect(getByA11yState({ disabled: false })).toBeTruthy();
  });
});
```

### Accessibility Audit Tools

- **React Native Accessibility Inspector**: Built-in iOS/Android tool
- **Axe DevTools**: Automated accessibility testing
- **Lighthouse**: Web accessibility audit

---

## Compliance Checklist

### WCAG 2.1 Level AA Requirements

#### Perceivable

- [ ] **1.1.1** All images have alternative text
- [ ] **1.3.1** Semantic structure (headers, lists, etc.)
- [ ] **1.3.2** Meaningful sequence for screen readers
- [ ] **1.4.3** Color contrast minimum 4.5:1
- [ ] **1.4.4** Text can be resized up to 200%
- [ ] **1.4.10** No horizontal scrolling at 320px width
- [ ] **1.4.11** UI component contrast minimum 3:1

#### Operable

- [ ] **2.1.1** All functionality available via keyboard
- [ ] **2.1.2** No keyboard traps
- [ ] **2.2.1** Timing adjustable for time limits
- [ ] **2.2.2** Pause, stop, hide for moving content
- [ ] **2.3.1** No content flashes more than 3x per second
- [ ] **2.4.2** Pages have descriptive titles
- [ ] **2.4.3** Logical focus order
- [ ] **2.4.4** Link purpose clear from context
- [ ] **2.4.7** Visible focus indicator
- [ ] **2.5.1** Complex gestures have alternatives
- [ ] **2.5.2** Touch cancellation supported
- [ ] **2.5.3** Labels match accessible names
- [ ] **2.5.4** Motion actuation has alternatives

#### Understandable

- [ ] **3.1.1** Language of page identified
- [ ] **3.2.1** Focus doesn't trigger unexpected changes
- [ ] **3.2.2** Input doesn't trigger unexpected changes
- [ ] **3.2.3** Consistent navigation across app
- [ ] **3.2.4** Consistent component identification
- [ ] **3.3.1** Error messages clearly identified
- [ ] **3.3.2** Labels provided for user input
- [ ] **3.3.3** Error suggestions provided
- [ ] **3.3.4** Error prevention for legal/financial data

#### Robust

- [ ] **4.1.2** Name, role, value available for all UI components
- [ ] **4.1.3** Status messages announced to screen readers

---

## Implementation Examples

### Accessible Form

```typescript
<View accessibilityRole="form">
  <Text
    accessibilityRole="header"
    variant="h2"
  >
    Create New Project
  </Text>

  <View style={styles.fieldContainer}>
    <Text accessibilityRole="text">Project Name</Text>
    <TextInput
      accessibilityLabel="Project name"
      accessibilityHint="Enter a name for your project"
      accessibilityRequired={true}
      value={projectName}
      onChangeText={setProjectName}
      style={styles.input}
    />
  </View>

  <AnimatedButton
    accessibilityRole="button"
    accessibilityLabel="Create project"
    accessibilityState={{ disabled: !projectName }}
    disabled={!projectName}
    onPress={handleCreate}
  >
    Create
  </AnimatedButton>
</View>
```

### Accessible List

```typescript
<FlashList
  accessibilityRole="list"
  accessibilityLabel="Project list"
  data={projects}
  renderItem={({ item, index }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, created ${item.createdAt}`}
      accessibilityHint="Double tap to open project"
      accessibilityState={{ selected: item.id === selectedId }}
      onPress={() => handleSelectProject(item.id)}
    >
      <Text variant="h3">{item.name}</Text>
      <Text variant="caption">{item.createdAt}</Text>
    </Pressable>
  )}
  estimatedItemSize={80}
/>
```

### Accessible Modal

```typescript
<Modal
  visible={modalVisible}
  transparent={true}
  accessibilityViewIsModal={true}
  onRequestClose={handleClose}
>
  <View
    accessibilityRole="dialog"
    accessibilityLabel="Confirmation dialog"
    accessibilityLiveRegion="polite"
  >
    <Text
      accessibilityRole="header"
      variant="h2"
    >
      Confirm Deletion
    </Text>

    <Text>Are you sure you want to delete this project?</Text>

    <View style={styles.buttonRow}>
      <AnimatedButton
        variant="outline"
        accessibilityLabel="Cancel deletion"
        onPress={handleClose}
      >
        Cancel
      </AnimatedButton>

      <AnimatedButton
        variant="danger"
        accessibilityLabel="Confirm deletion"
        accessibilityHint="This action cannot be undone"
        onPress={handleConfirm}
      >
        Delete
      </AnimatedButton>
    </View>
  </View>
</Modal>
```

---

## Resources

### Documentation

- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Accessibility](https://developer.apple.com/accessibility/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)

### Testing Tools

- [Accessibility Inspector](https://reactnative.dev/docs/accessibility#accessibility-inspector) (iOS/Android)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

### Best Practices

- Test with real users with disabilities
- Use screen readers during development
- Perform accessibility audits regularly
- Document accessibility features
- Train team on accessibility standards

---

**Last Updated**: 2025-11-11
**Compliance Target**: WCAG 2.1 Level AA
**Review Cycle**: Quarterly
