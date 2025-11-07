# 04-primitives-part1.md
---
phase_id: 04
title: Core Primitives - Part 1 (Button, Text, Input)
duration_estimate: "1.5 days"
incremental_value: Foundation components with accessibility and theming built-in
owners: [Frontend Engineer]
dependencies: [03]
linked_phases_forward: [05]
docs_referenced: [Design System, UI Framework Plan, Native UI Guidelines]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
ui_requirements:
  framework_plan: ./../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md
  design_system: ./../.docs/design-system.md
  native_ui: ./../.docs/vibecode/native_ui.md
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["React Native Button accessibility best practices", "mobile input component patterns", "cross-platform button design"]
    outputs: ["/docs/research/04/component-patterns.md"]
  - name: ContextCurator
    tool: context7
    scope: ["design-system.md", "native_ui.md", "tokens.ts from Phase 03"]
    outputs: ["/docs/context/04-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for building accessible Button, Text, Input components"
    outputs: ["/docs/sequencing/04-component-build.md"]
acceptance_criteria:
  - Button, Text, Input components built and tested
  - All components pass accessibility audit (WCAG AA)
  - Components use tokens exclusively (zero hardcoded styles)
  - TypeScript types complete with IntelliSense
  - Component demos in Storybook or demo app
  - Touch targets ≥ 44pt (iOS) / 48dp (Android)
---

## Objectives

1. **Build Foundation Components** - Button, Text, Input with full accessibility
2. **Establish Patterns** - Component structure, typing, testing patterns for Phase 05
3. **Validate Token System** - Ensure tokens work in real components

## Scope

### In
- Button component (variants: primary, secondary, outline, ghost)
- Text component (variants: heading, body, caption, code)
- Input component (text, email, password with show/hide)
- Accessibility: labels, hints, touch targets, screen readers
- TypeScript: full type coverage
- Tests: unit + accessibility
- Demo app with component gallery

### Out
- Form validation logic (later)
- Advanced input types (date, select - Phase 05)
- Button loading states (later enhancement)
- Complex animations (Phase 07)

## Tasks

- [ ] **Use context7** to compile component design context:
  - Include: design-system.md component specs
  - Include: native_ui.md platform patterns
  - Include: Phase 03 token system
  - Output: `/docs/context/04-context-bundle.md`

- [ ] **Use websearch** to research component best practices:
  - Query: "React Native Button accessibility WCAG AA"
  - Query: "mobile input component UX patterns 2025"
  - Query: "cross-platform button design iOS Android"
  - Output: `/docs/research/04/component-patterns.md`

- [ ] **Use sequentialthinking** to plan component implementation:
  - Define: Component API (props, variants, states)
  - Define: Accessibility requirements per component
  - Define: Testing strategy
  - Output: `/docs/sequencing/04-component-build.md`

- [ ] **Create Button Component**:
  ```typescript
  // src/ui/primitives/Button.tsx
  import { tokens } from '../tokens'

  export interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    onPress: () => void
    accessibilityLabel: string
    accessibilityHint?: string
    children: React.ReactNode
  }

  export const Button: React.FC<ButtonProps> = ({ ... }) => {
    // Implementation using chosen UI library + tokens
    // Minimum touch target: 44pt (iOS) / 48dp (Android)
    // Haptic feedback on press
    // Disabled state with reduced opacity
  }
  ```
  - Variants: primary (filled), secondary, outline, ghost
  - Sizes: sm, md, lg
  - States: default, pressed, disabled, focused
  - Accessibility: proper labels, hints, roles
  - Haptics: use `react-native-haptic-feedback`

- [ ] **Create Text Component**:
  ```typescript
  // src/ui/primitives/Text.tsx
  import { tokens } from '../tokens'

  export interface TextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'code'
    color?: keyof typeof tokens.colors.semantic
    weight?: 'normal' | 'medium' | 'semibold' | 'bold'
    align?: 'left' | 'center' | 'right'
    numberOfLines?: number
    accessibilityRole?: 'header' | 'text'
    children: React.ReactNode
  }

  export const Text: React.FC<TextProps> = ({ ... }) => {
    // Platform-specific fonts (SF Pro / Roboto)
    // Dynamic type support (iOS)
    // Proper line heights from tokens
  }
  ```

- [ ] **Create Input Component**:
  ```typescript
  // src/ui/primitives/Input.tsx
  import { tokens } from '../tokens'

  export interface InputProps {
    label: string
    placeholder?: string
    value: string
    onChangeText: (text: string) => void
    type?: 'text' | 'email' | 'password'
    error?: string
    disabled?: boolean
    accessibilityLabel: string
    accessibilityHint?: string
  }

  export const Input: React.FC<InputProps> = ({ ... }) => {
    // Floating label animation
    // Error state with message
    // Password show/hide toggle
    // Auto-focus management
    // Keyboard type based on type prop
  }
  ```

- [ ] **Write Unit Tests**:
  - Test: Button renders variants correctly
  - Test: Button onPress fires
  - Test: Button disabled state blocks press
  - Test: Text renders with correct styles
  - Test: Input value updates on change
  - Test: Input shows/hides password
  - Coverage target: >80% per component

- [ ] **Write Accessibility Tests**:
  - Test: All components have accessibility labels
  - Test: Button touch target ≥ 44pt/48dp
  - Test: Screen reader announces correctly
  - Test: Focus order is logical
  - Test: Dynamic type scales properly (iOS)
  - Use: `@testing-library/react-native` + `axe-core`

- [ ] **Create Component Gallery**:
  - Create: `src/ui/__demo__/ComponentGallery.tsx`
  - Show: All Button variants
  - Show: All Text variants
  - Show: Input with error/success states
  - Support: Light/dark mode toggle
  - Support: Interactive controls
  - Screenshot: `reports/ui/component-gallery-part1.png`

- [ ] **Update TypeScript Exports**:
  - Create: `src/ui/primitives/index.ts`
  - Export: Button, Text, Input with types
  - Verify: IntelliSense works in VS Code

- [ ] **Update links-map** with component artifacts and Phase 05 dependency

- [ ] **Add to USAGE.md** (start documentation):
  - Usage examples for each component
  - API reference
  - Accessibility guidelines

## Artifacts & Paths

**Code:**
- `src/ui/primitives/Button.tsx` ⭐ - Button component
- `src/ui/primitives/Text.tsx` ⭐ - Text component
- `src/ui/primitives/Input.tsx` ⭐ - Input component
- `src/ui/primitives/index.ts` - Barrel export
- `src/ui/__demo__/ComponentGallery.tsx` - Interactive demo

**Tests:**
- `src/ui/primitives/__tests__/Button.test.tsx`
- `src/ui/primitives/__tests__/Text.test.tsx`
- `src/ui/primitives/__tests__/Input.test.tsx`
- `src/ui/primitives/__tests__/a11y.test.tsx` - Accessibility suite

**Docs:**
- `/docs/context/04-context-bundle.md` - Component design context
- `/docs/research/04/component-patterns.md` - Best practices research
- `/docs/sequencing/04-component-build.md` - Implementation plan
- `/docs/ui/USAGE.md` (partial) - Component usage guide

**Reports:**
- `reports/ui/component-gallery-part1.png` - Visual showcase
- `reports/ui/component-test-coverage.json` - Coverage report

## Testing

### Phase-Only Tests
- All component unit tests pass
- Accessibility tests pass (WCAG AA)
- TypeScript compilation successful
- Component gallery runs without errors
- Touch targets verified on iOS simulator + Android emulator

### Cross-Phase Compatibility
- Components use Phase 03 tokens exclusively
- No hardcoded styles
- Phase 05 will extend these patterns

### Test Commands
```bash
# Run unit tests
npm test -- primitives/

# Run accessibility tests
npm run test:a11y

# Verify test coverage (target: >80%)
npm run test:coverage

# Verify touch targets
npm run test:touch-targets

# Verify TypeScript
npx tsc --noEmit src/ui/primitives/**/*.tsx

# Run component gallery
npm run demo:gallery
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Accessibility requirements slow development | Timeline | Start with basics; iterate to full WCAG AA compliance |
| Components don't feel native | UX | User-test on iOS + Android; iterate gestures/haptics |
| TypeScript types too complex | DX | Keep API simple; use discriminated unions for variants |
| Testing setup takes too long | Timeline | Use existing RN testing setup; add minimal config |

## References

- [Design System](./../../.docs/design-system.md) - Component specifications
- [Native UI Guidelines](./../../.docs/vibecode/native_ui.md) - Platform patterns
- [Phase 03](./03-token-system-design.md) - Token system
- [UI Framework Plan](./../../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md) - Primitives requirements

## Handover

**Next Phase:** [05-primitives-part2.md](./05-primitives-part2.md) - Build Card, Sheet, ListItem, Icon, Divider, Spinner

**Required Inputs Provided to Phase 05:**
- Button, Text, Input components as pattern reference
- Component testing patterns established
- Component gallery structure
- TypeScript patterns for component APIs

**Phase 05 Depends On:**
- Primitive component patterns from Phase 04
- Testing infrastructure set up

---

**Status:** Ready for execution after Phase 03
**Estimated Time:** 1.5 working days (12 hours)
**Blocking Issues:** Requires Phase 03 token system
