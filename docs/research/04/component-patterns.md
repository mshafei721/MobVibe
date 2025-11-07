# Component Patterns Research - Phase 04

**Date:** 2025-11-06
**Phase:** 04 - Core Primitives Part 1
**Research Method:** WebSearch (3 queries)

---

## Research Overview

Comprehensive research on React Native component best practices for Button, Text, and Input components with focus on:
1. Accessibility (WCAG AA compliance)
2. Cross-platform design (iOS + Android)
3. Mobile UX patterns for 2025

---

## 1. Button Accessibility & Touch Targets

### Touch Target Size Requirements

**WCAG Standards:**
- **WCAG 2.5.8 (AA)**: Minimum 24×24px touch target
- **WCAG 2.5.5 (AAA)**: Recommended 44×44px touch target (best practice even if not required for AA)

**Platform-Specific Guidelines:**
- **iOS (Human Interface Guidelines)**: 44×44 points minimum
- **Android (Material Design)**: 48×48 pixels minimum

**Recommendation for MobVibe:**
- Use **44×44pt (iOS) / 48×48dp (Android)** as minimum
- Exceeds WCAG AA (24px) and aligns with platform guidelines
- Prevents VoiceOver/TalkBack activation issues on real devices

### React Native Accessibility Props

**Required Props:**
```typescript
{
  accessibilityRole: "button",        // Identifies element type
  accessibilityLabel: "Submit form",  // Descriptive label for screen readers
  accessibilityHint: "Saves your changes", // Additional context (optional)
  accessible: true                    // Enable accessibility features
}
```

**Best Practices:**
- Always provide `accessibilityLabel` (never rely on button text alone)
- Use `accessibilityHint` for non-obvious actions
- Set `accessibilityRole="button"` for proper identification
- Built-in Button component has accessibility features by default

### Color Contrast (WCAG 2.2 AA)

**Requirements:**
- **Normal text** (<18pt or <14pt bold): **4.5:1** contrast ratio
- **Large text** (≥18pt or ≥14pt bold): **3:1** contrast ratio

**Recommendation for MobVibe:**
- Use token system to ensure compliant color combinations
- Test all button variants (primary, secondary, outline, ghost) against backgrounds
- Validate with contrast checker tools

---

## 2. Password Input Show/Hide Patterns

### Accessibility Best Practices

**ARIA Attributes:**
```html
<!-- Password toggle should use: -->
aria-live="polite"           // Announce state changes
aria-describedby="password-requirements" // Link to requirements
aria-label="Show password" / "Hide password"
```

**Keyboard Accessibility:**
- Toggle button must be keyboard accessible (focusable + Enter/Space)
- Tab order: Input → Toggle → Next field

**Motor/Dexterity Considerations:**
- ❌ Avoid "touch and hold to reveal" (difficult for motor issues)
- ❌ Avoid "spring loaded" unmask (requires fine motor control)
- ✅ Use simple toggle button (tap to show/hide)

### UX Pattern Recommendations

**Show/Hide Toggle Benefits:**
- Prevents typing errors (especially on mobile keyboards)
- Reduces need for "Confirm Password" field
- Improves completion rates

**Default State:**
- Desktop: Masked by default
- Mobile: Some research suggests unmasked default (controversial)
- **MobVibe Recommendation**: Masked default with easy toggle (safer)

**Icon vs Text Debate:**
- **Icon only** (👁️): May be ambiguous, especially for non-technical users
- **Text only**: Clear but verbose, language-specific
- **Icon + Text**: Best of both worlds, recommended approach
  - Show: "Show" + 👁️ icon
  - Hide: "Hide" + 👁️-slash icon

**Position:**
- Place toggle **inside input field** (right side) for familiarity
- ⚠️ Warning: Password managers may block in-field toggles
- Alternative: Checkbox below input with "Show Password" label

### Additional UX Guidelines

1. **Allow paste** - Support password managers
2. **Show requirements** - Display before user types (prevent frustration)
3. **High contrast** - Clear focus states for visibility
4. **Indicate capslock** - Warn when caps lock is on (common mistake)

---

## 3. Cross-Platform Button Design

### iOS vs Android Design Patterns

**Button Styles:**
- **iOS (HIG)**: Flat buttons, minimal borders, subtle shadows
- **Android (Material Design)**: Raised buttons, FAB, clear elevation

**Text Styling:**
- **iOS**: Title case (e.g., "Submit Form")
- **Android**: Uppercase (e.g., "SUBMIT FORM")

**Platform-Specific Components:**
- **Floating Action Button (FAB)**: Android-specific, rarely on iOS
- **iOS Top Bar Actions**: Common in iOS, less so in Android

### Cross-Platform Approach for MobVibe

**Strategy: Adaptive Design**
```typescript
import { Platform } from 'react-native';

const buttonTextTransform = Platform.select({
  ios: 'capitalize',  // Title case
  android: 'uppercase' // Uppercase
});
```

**Design Principles:**
- Follow platform conventions where they differ significantly
- Use common patterns where platforms align
- Prioritize usability over strict adherence

**Resources:**
- iOS: [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- Android: [Material Design](https://material.io/design)

---

## 4. Implementation Recommendations

### Button Component

**Variants:**
- `primary`: Filled, high emphasis (primary.500 background)
- `secondary`: Filled, medium emphasis (secondary.500 background)
- `outline`: Bordered, low emphasis (transparent bg, primary.500 border)
- `ghost`: Text only, minimal emphasis (transparent, no border)

**Sizes:**
- `sm`: 32pt height (iOS) / 36dp (Android)
- `md`: 44pt height (iOS) / 48dp (Android) - **default**
- `lg`: 56pt height (iOS) / 60dp (Android)

**States:**
- Default, Pressed, Disabled, Focused
- Haptic feedback on press (use `react-native-haptic-feedback`)
- Reduced opacity for disabled state (0.4-0.6)

**Accessibility:**
```typescript
<Button
  variant="primary"
  size="md"
  accessibilityRole="button"
  accessibilityLabel="Create new project"
  accessibilityHint="Opens project creation form"
  onPress={handlePress}
>
  Create Project
</Button>
```

### Text Component

**Variants:**
- `h1`: 32-48pt, bold (headings.h1 token)
- `h2`: 24-32pt, bold
- `h3`: 20-24pt, semibold
- `body`: 16pt, normal (default)
- `caption`: 12-14pt, normal (secondary text)
- `code`: 14pt, monospace (inline code)

**Platform Fonts:**
```typescript
fontFamily: Platform.select({
  ios: 'System',  // SF Pro
  android: 'Roboto'
})
```

**Dynamic Type Support (iOS):**
- Respect user font size preferences
- Use `allowFontScaling` prop (default true)

### Input Component

**Types:**
- `text`: Standard text input
- `email`: Email keyboard, autocorrect off
- `password`: Secure entry with show/hide toggle

**Features:**
- Floating label animation (label moves on focus)
- Error state with message (red border + error text)
- Password show/hide toggle (icon + text)
- Auto-focus management
- Keyboard type based on input type
- Clear button (X icon) when input has value

**Accessibility:**
```typescript
<Input
  label="Email"
  type="email"
  value={email}
  onChangeText={setEmail}
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email to sign in"
  error={emailError}
/>
```

---

## Testing Checklist

### Accessibility Tests

- [ ] All components have `accessibilityLabel`
- [ ] Button touch targets ≥ 44pt (iOS) / 48dp (Android)
- [ ] Screen reader announces all elements correctly
- [ ] Focus order is logical (VoiceOver/TalkBack)
- [ ] Color contrast meets WCAG AA (4.5:1 normal, 3:1 large)
- [ ] Dynamic type scales properly (iOS)
- [ ] Keyboard navigation works (web/tablet)

### Cross-Platform Tests

- [ ] Button text casing follows platform conventions
- [ ] Components look native on both iOS and Android
- [ ] Haptic feedback works on both platforms
- [ ] Touch targets respect platform minimums
- [ ] Font families load correctly (SF Pro vs Roboto)

### UX Tests

- [ ] Password toggle shows/hides correctly
- [ ] Password toggle announces state to screen readers
- [ ] Input validation shows errors clearly
- [ ] Button disabled state is visually distinct
- [ ] All interactive elements have clear focus states

---

## Key Takeaways

1. **Accessibility is non-negotiable** - WCAG AA minimum, aim for AAA where feasible
2. **Touch targets matter** - 44pt/48dp minimum prevents user frustration
3. **Platform conventions enhance UX** - Follow iOS/Android guidelines where they differ
4. **Password toggles improve completion** - Simple icon+text button, no complex gestures
5. **Test with real devices** - Simulators don't catch all accessibility issues

---

## References

**Accessibility:**
- [React Native Accessibility Docs](https://reactnative.dev/docs/accessibility)
- [WCAG 2.5.5 Target Size](https://adrianroselli.com/2019/06/target-size-and-2-5-5.html)
- [MDN Mobile Accessibility Checklist](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Mobile_accessibility_checklist)

**Password UX:**
- [Password Field Design Guidelines](https://medium.com/uxdworld/password-field-design-guidelines-7bd86cfa1733)
- [Password Accessibility Best Practices](https://advancedbytez.com/password-accessibility/)
- [Show/Hide Password UX Patterns](https://uxpatterns.dev/en/patterns/forms/password)

**Cross-Platform:**
- [iOS vs Android UI Design Guide](https://www.learnui.design/blog/ios-vs-android-app-ui-design-complete-guide.html)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://material.io/design)

---

**Status:** Research complete ✅
**Next:** Read design-system.md and native_ui.md, then plan implementation
**Confidence:** High - comprehensive coverage of accessibility, UX, and cross-platform patterns
