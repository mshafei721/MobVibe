# Component Build Plan - Phase 04

**Date:** 2025-11-06
**Phase:** 04 - Core Primitives Part 1
**Planning Method:** Sequential Thinking (15 steps)
**Estimated Time:** 8 hours (1 working day)

---

## Implementation Strategy

### Chosen Approach: gluestack UI Base with Token Customization

**Decision:** Use gluestack UI components as foundation and customize with MobVibe tokens

**Rationale:**
- Phase 02 selected gluestack UI as framework
- Pre-built accessibility features (saves development time)
- Tested components reduce testing burden
- Can customize via gluestack-ui.config.ts + wrapper components
- Faster development (1.5 day budget)

**Alternative Considered:** Build from scratch using React Native primitives
- Rejected: More work, need to handle all edge cases, more testing required

---

## Component APIs

### 1. Text Component

**Props Interface:**
```typescript
export interface TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'code';
  color?: string; // Token color key
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  accessibilityRole?: 'header' | 'text';
  children: React.ReactNode;
}
```

**Variant Styling (using tokens):**
- `h1`: fontSize='4xl' (36px), fontWeight=bold, lineHeight=tight, role=header
- `h2`: fontSize='3xl' (30px), fontWeight=bold, lineHeight=tight, role=header
- `h3`: fontSize='2xl' (24px), fontWeight=semibold, lineHeight=tight, role=header
- `body`: fontSize=base (16px), fontWeight=normal, lineHeight=normal, role=text (default)
- `caption`: fontSize=sm (14px), fontWeight=normal, lineHeight=normal, color=text.secondary
- `code`: fontSize=sm (14px), fontFamily=mono, bg=surface[1], padding=spacing[1]

**Platform Fonts:**
```typescript
fontFamily: Platform.select({
  ios: tokens.typography.fontFamily.sans,  // 'System' (SF Pro)
  android: tokens.typography.fontFamily.sans  // 'Roboto'
})
```

**Dynamic Type Support:**
- `allowFontScaling`: true (default, respect user preferences)
- `maxFontSizeMultiplier`: 2 (prevent extreme scaling)

---

### 2. Button Component

**Props Interface:**
```typescript
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean; // Future enhancement
}
```

**Variant Styling:**
- `primary`: bg=primary.500, text=white, border=none
- `secondary`: bg=secondary.500, text=white, border=none
- `outline`: bg=transparent, text=primary.500, border=primary.500 (1px)
- `ghost`: bg=transparent, text=primary.500, border=none

**Size Styling:**
- `sm`: height=32pt/36dp, padding-x=spacing[3], fontSize=sm
- `md`: height=44pt/48dp, padding-x=spacing[4], fontSize=base (default, ensures touch target)
- `lg`: height=56pt/60dp, padding-x=spacing[6], fontSize=lg

**States:**
- Pressed: opacity=0.8
- Disabled: opacity=0.5, cursor=not-allowed
- Focused: outline with primary color (keyboard navigation)

**Platform-Specific:**
```typescript
textTransform: Platform.select({
  ios: 'capitalize',    // "Submit Form"
  android: 'uppercase'  // "SUBMIT FORM"
})
```

**Haptic Feedback:**
```typescript
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const handlePress = () => {
  ReactNativeHapticFeedback.trigger('impactLight');
  onPress();
};
```

---

### 3. Input Component

**Props Interface:**
```typescript
export interface InputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  type?: 'text' | 'email' | 'password';
  error?: string;
  disabled?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}
```

**Features:**

1. **Floating Label Animation:**
   - Label starts inside input (placeholder position)
   - On focus or when value exists: label floats above input
   - Animate with Animated API (transform: translateY, scale)

2. **Password Show/Hide Toggle:**
   - Icon: Eye (show) / Eye-slash (hide)
   - Text: "Show" / "Hide"
   - Position: Right side of input (inside field)
   - Accessibility: aria-live="polite", aria-label="Show password"
   - State: secureTextEntry based on toggle

3. **Error State:**
   - Border color: tokens.colors.error[500]
   - Error message: Below input, color=error[500], fontSize=sm
   - Icon: Alert circle before error message
   - Accessibility: aria-describedby linking input to error

4. **Clear Button:**
   - Show X icon when value exists and not password type
   - Position: Right side (before password toggle if password type)
   - Accessibility: aria-label="Clear input"

5. **Keyboard Types:**
   - `text`: keyboardType="default"
   - `email`: keyboardType="email-address", autoCapitalize="none", autoCorrect=false
   - `password`: secureTextEntry=true (toggleable)

**Styling (using tokens):**
- Container: marginBottom=spacing[4]
- Input: height=48dp, padding=spacing[3], borderRadius=borderRadius.md
- Border: 1px, color=border.base (default), border.primary (focused), border.error (error)
- Label: fontSize=sm, color=text.secondary (default), text.primary (focused)
- Error text: fontSize=xs, color=error[500]

---

## Implementation Order

### Phase 1 - Setup (30 minutes)
1. Install dependencies
2. Create directory structure
3. Verify gluestack UI configuration

### Phase 2 - Text Component (1 hour)
- Simplest component, no complex state
- Establishes pattern for using tokens
- Can be used by other components
- Good starting point for testing patterns

### Phase 3 - Button Component (1.5 hours)
- Uses Text component for children
- Introduces haptic feedback
- Platform-specific styling
- Establishes interactive component pattern

### Phase 4 - Input Component (2 hours)
- Most complex: password toggle, floating label, error state
- Uses Text component for label/error
- Introduces animation (Animated API)
- Leverages testing patterns from Button

### Phase 5 - Testing (2 hours)
- Write unit tests for all 3 components
- Write accessibility tests
- Run coverage report (target >80%)
- Fix any issues found

### Phase 6 - Documentation & Demo (1 hour)
- Create ComponentGallery with all components
- Write USAGE.md with examples
- Update exports in index.ts
- Take screenshots (light + dark modes)

### Phase 7 - Finalization (30 minutes)
- Update links-map.md
- Create 04-COMPLETE.md
- Verify all acceptance criteria met

**Total Estimated Time:** 8 hours (1 working day, within 1.5 day budget)

---

## Testing Strategy

### Unit Tests (Jest + @testing-library/react-native)

**Button Tests:**
- Renders correctly with all variants (snapshot tests)
- onPress callback fires when pressed
- Disabled state prevents onPress
- Shows correct text transform per platform
- Haptic feedback triggers on press
- Proper accessibility props are set
- Touch target size is enforced

**Text Tests:**
- Renders all variants with correct styles
- Applies custom color/weight/align props
- numberOfLines truncation works
- Platform-specific fonts load
- Dynamic type scaling works
- Accessibility role is set correctly

**Input Tests:**
- Value updates on text change
- Shows/hides password correctly
- Toggle button announces state changes
- Error message displays when error prop exists
- Clear button appears/disappears based on value
- Keyboard type changes based on input type
- Floating label animates on focus/blur
- Disabled state prevents editing

**Coverage Target:** >80% per component

### Accessibility Tests

**Test Checklist:**
- All components have `accessible={true}`
- `accessibilityLabel` is present and descriptive
- `accessibilityRole` is appropriate
- Touch targets meet minimum size (use measure API)
- Color contrast meets WCAG AA (manual check + documentation)
- Screen reader announcements are correct (test with VoiceOver/TalkBack)

**Test Files:**
```
src/ui/primitives/__tests__/
  Button.test.tsx
  Text.test.tsx
  Input.test.tsx
  a11y.test.tsx (shared accessibility tests)
```

---

## Accessibility Requirements (WCAG AA)

### Color Contrast
- Normal text (<18pt or <14pt bold): **4.5:1** minimum
- Large text (≥18pt or ≥14pt bold): **3:1** minimum
- Tool: Use contrast checker during token selection

### Touch Targets
- Button: Enforce minHeight **44pt (iOS) / 48dp (Android)**
- Input: Enforce minHeight **48dp**
- Password toggle: Ensure **44×44pt** minimum hit area
- Clear button: Ensure **44×44pt** minimum hit area
- Verify with Layout Inspector on simulator/emulator

### Screen Reader Support
- All interactive elements must have `accessibilityLabel`
- Headings must use `accessibilityRole="header"`
- Inputs must link to errors via `accessibilityDescribedBy`
- Password toggle must announce state changes (aria-live="polite")
- Test with VoiceOver (iOS) and TalkBack (Android)

### Keyboard Navigation (Web/Tablet)
- Focus order must be logical (top to bottom, left to right)
- Focus indicators must be visible (outline with primary color)
- Enter/Space must activate buttons
- Tab must navigate between inputs
- Test on web build or with keyboard connected

### Dynamic Type (iOS)
- Text must scale with user font size preferences
- `allowFontScaling=true` by default
- `maxFontSizeMultiplier=2` to prevent extreme scaling
- Test in iOS Settings > Accessibility > Display & Text Size

---

## Token Usage Verification

### Button Component
- Colors: `tokens.colors.primary[500]`, `secondary[500]`, etc.
- Spacing: `tokens.spacing[3]`, `spacing[4]`, `spacing[6]`
- Font sizes: `tokens.typography.fontSize.sm`, `base`, `lg`
- Font weights: `tokens.typography.fontWeight.normal`, `semibold`, `bold`
- Border radius: `tokens.spacing.borderRadius.md`

### Text Component
- Font sizes: `tokens.typography.fontSize['4xl']`, `'3xl'`, `'2xl'`, `base`, `sm`
- Font families: `tokens.typography.fontFamily.sans`, `mono`
- Font weights: `tokens.typography.fontWeight.*`
- Line heights: `tokens.typography.lineHeight.tight`, `normal`, `relaxed`
- Colors: `tokens.colors.text.primary`, `secondary`, `tertiary`
- Background (for code): `tokens.colors.surface[1]`
- Padding (for code): `tokens.spacing[1]`

### Input Component
- Heights: 48dp minimum (`tokens.spacing[12]`)
- Padding: `tokens.spacing[3]`
- Border radius: `tokens.spacing.borderRadius.md`
- Border colors: `tokens.colors.border.base`, `primary`, `error`
- Text colors: `tokens.colors.text.primary`, `secondary`
- Error color: `tokens.colors.error[500]`
- Font sizes: `tokens.typography.fontSize.base`, `sm`, `xs`
- Margin: `tokens.spacing[4]`

### Verification
- Run token audit script: `bash scripts/ui-audit-tokens.sh`
- Should find **0 hardcoded values** in `src/ui/primitives/`
- All colors, spacing, typography must come from tokens

---

## TypeScript Type Safety

### Component Props
- Export all prop interfaces (`ButtonProps`, `TextProps`, `InputProps`)
- Use strict typing for variant props (string literals, not just `string`)
- Make required props non-optional (e.g., `onPress`, `label`, `accessibilityLabel`)
- Use `React.FC<PropsType>` for component typing

### Barrel Exports (src/ui/primitives/index.ts)
```typescript
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Text } from './Text';
export type { TextProps } from './Text';

export { Input } from './Input';
export type { InputProps } from './Input';

// Re-export tokens for convenience
export { tokens } from '../tokens';
```

**Usage Example:**
```typescript
import { Button, Text, Input, tokens } from '@/ui/primitives';
import type { ButtonProps, TextProps } from '@/ui/primitives';
```

### Type Checking
- Run `npx tsc --noEmit` to verify no type errors
- Ensure `tsconfig.json` includes `src/ui/` in paths
- Verify IntelliSense works in VS Code

---

## Component Gallery Design

**File:** `src/ui/__demo__/ComponentGallery.tsx`

**Purpose:**
- Visual showcase of all components
- Interactive testing during development
- Light/dark mode toggle to verify token switching
- Serve as living documentation

**Structure:**
```tsx
export const ComponentGallery = () => {
  const [isDark, setIsDark] = useState(false);
  const colorScheme = isDark ? colorsDark : colorsLight;

  return (
    <ScrollView style={{ backgroundColor: colorScheme.background.base }}>
      {/* Theme Toggle */}
      <Button onPress={() => setIsDark(!isDark)}>
        {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </Button>

      {/* Button Section */}
      <Section title="Buttons">
        {/* All 4 variants × 3 sizes = 12 buttons */}
        <Button variant="primary" size="sm">Small Primary</Button>
        <Button variant="primary" size="md">Medium Primary</Button>
        <Button variant="primary" size="lg">Large Primary</Button>
        {/* Repeat for secondary, outline, ghost */}
        <Button variant="primary" disabled>Disabled</Button>
      </Section>

      {/* Text Section */}
      <Section title="Typography">
        <Text variant="h1">Heading 1</Text>
        <Text variant="h2">Heading 2</Text>
        <Text variant="h3">Heading 3</Text>
        <Text variant="body">Body text - default variant</Text>
        <Text variant="caption">Caption text - secondary color</Text>
        <Text variant="code">const code = 'monospace';</Text>
      </Section>

      {/* Input Section */}
      <Section title="Inputs">
        <Input label="Text Input" placeholder="Enter text" />
        <Input label="Email" type="email" placeholder="you@example.com" />
        <Input label="Password" type="password" placeholder="••••••••" />
        <Input label="With Error" error="This field is required" />
        <Input label="Disabled" disabled value="Cannot edit" />
      </Section>
    </ScrollView>
  );
};
```

**Screenshots:**
- Save to `reports/ui/component-gallery-part1-light.png`
- Save to `reports/ui/component-gallery-part1-dark.png`

---

## Dependencies

### Required
- `@gluestack-ui/themed` - ✅ Already installed (Phase 03)
- `@gluestack-style/react` - ✅ Already installed (Phase 03)
- `react-native-haptic-feedback` - ❌ Need to install
- `@testing-library/react-native` - ❌ Need to install
- `@testing-library/jest-native` - ❌ Need to install

### Installation Commands
```bash
npm install react-native-haptic-feedback
npm install -D @testing-library/react-native @testing-library/jest-native
cd ios && pod install  # iOS native linking for haptic feedback
```

---

## File Structure

```
src/ui/primitives/
  Text.tsx              # Text component (build first)
  Button.tsx            # Button component (build second)
  Input.tsx             # Input component (build third)
  index.ts              # Barrel exports
  __tests__/
    Text.test.tsx
    Button.test.tsx
    Input.test.tsx
    a11y.test.tsx

src/ui/__demo__/
  ComponentGallery.tsx  # Component showcase

docs/sequencing/
  04-component-build.md # This planning document

docs/ui/
  USAGE.md              # Component usage guide (new)

reports/ui/
  component-gallery-part1-light.png
  component-gallery-part1-dark.png
  component-test-coverage.json
```

---

## Acceptance Criteria Checklist

From Phase 04 requirements:

- [ ] Button, Text, Input components built and tested
  - Verify: All 3 components exist in `src/ui/primitives/`
  - Verify: Tests pass with >80% coverage

- [ ] All components pass accessibility audit (WCAG AA)
  - Verify: `accessibilityLabel` on all interactive elements
  - Verify: Touch targets ≥ 44pt/48dp
  - Verify: Color contrast ≥ 4.5:1 (normal text), 3:1 (large text)
  - Verify: Screen reader announcements are correct

- [ ] Components use tokens exclusively (zero hardcoded styles)
  - Verify: Run `bash scripts/ui-audit-tokens.sh`
  - Verify: 0 errors reported in `src/ui/primitives/`
  - Check: No #RRGGBB, rgb(), hardcoded px values

- [ ] TypeScript types complete with IntelliSense
  - Verify: `npx tsc --noEmit` passes
  - Verify: VS Code autocompletes component props
  - Verify: Variant string literals show suggestions

- [ ] Component demos in Storybook or demo app
  - Verify: ComponentGallery.tsx shows all variants
  - Verify: Light/dark mode toggle works
  - Verify: Screenshots saved to `reports/ui/`

- [ ] Touch targets ≥ 44pt (iOS) / 48dp (Android)
  - Verify: Button md/lg sizes enforce minimum
  - Verify: Input height is 48dp
  - Verify: Password toggle and clear buttons have 44×44 hit areas
  - Test: Use Layout Inspector on simulator/emulator

---

## Key Decisions Summary

1. **Framework:** gluestack UI components as base (from Phase 02 decision)
2. **Token System:** Exclusive use of Phase 03 tokens (zero hardcoded values)
3. **Accessibility:** WCAG AA minimum, aim for AAA where feasible
4. **Touch Targets:** 44pt (iOS) / 48dp (Android) enforced via sizing
5. **Platform Design:** Adaptive (iOS vs Android text casing, fonts)
6. **Testing:** >80% coverage, unit + accessibility tests
7. **Build Order:** Text → Button → Input (simplest to most complex)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Haptic feedback not working on Android | Test on real devices, fallback to no haptics |
| gluestack UI customization limitations | Document workarounds, consider wrapping with RN primitives |
| Testing setup complexity | Start with basic tests, expand incrementally |
| Accessibility testing challenges | Manual VoiceOver/TalkBack testing + automated checks |
| Token audit finds hardcoded values | Fix immediately before proceeding to next component |

---

## References

- [Component Patterns Research](../research/04/component-patterns.md)
- [Phase 03 Token System](../ui/THEMING.md)
- [Phase 04 Requirements](../phases/04-primitives-part1.md)
- [gluestack UI Docs](https://ui.gluestack.io/)

---

**Status:** Planning complete ✅
**Next:** Install dependencies and begin implementation (Text → Button → Input)
**Estimated Completion:** 8 hours (1 working day)
