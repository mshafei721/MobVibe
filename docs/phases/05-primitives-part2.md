# 05-primitives-part2.md
---
phase_id: 05
title: Core Primitives - Part 2 (Card, Sheet, ListItem, Icon, Divider, Spinner)
duration_estimate: "1.5 days"
incremental_value: Complete primitive component library
owners: [Frontend Engineer]
dependencies: [04]
linked_phases_forward: [06]
docs_referenced: [Design System, UI Framework Plan, Native UI Guidelines]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
ui_requirements:
  framework_plan: ./../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md
  design_system: ./../.docs/design-system.md
  native_ui: ./../.docs/vibecode/native_ui.md
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["React Native modal best practices", "mobile list item design patterns", "loading spinner accessibility"]
    outputs: ["/docs/research/05/advanced-components.md"]
  - name: ContextCurator
    tool: context7
    scope: ["Phase 04 components", "design-system.md", "native_ui.md"]
    outputs: ["/docs/context/05-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for remaining primitives following Phase 04 patterns"
    outputs: ["/docs/sequencing/05-component-build.md"]
acceptance_criteria:
  - Card, Sheet, ListItem, Icon, Divider, Spinner components complete
  - All components pass accessibility audit
  - Component gallery updated with new primitives
  - Full test coverage (>80%)
  - Documentation complete for all 10 primitives
---

## Objectives

1. **Complete Primitive Library** - Add 6 remaining core components
2. **Maintain Consistency** - Follow patterns from Phase 04
3. **Validate Completeness** - Ensure sufficient primitives for screen building (Phase 08-09)

## Scope

### In
- Card (container with elevation/shadow)
- Sheet (modal bottom sheet)
- ListItem (touchable list row)
- Icon (vector icons with @expo/vector-icons)
- Divider (horizontal/vertical separator)
- Spinner (loading indicator)

### Out
- Complex components (DataTable, Calendar - later)
- Form components (Checkbox, Radio - later if needed)
- Navigation components (Tab, Drawer - use Expo Router)

## Tasks

- [ ] **Use context7** to compile component context:
  - Include: Phase 04 component patterns
  - Include: design-system.md remaining specs
  - Output: `/docs/context/05-context-bundle.md`

- [ ] **Use websearch** for advanced patterns:
  - Query: "React Native bottom sheet accessibility"
  - Query: "mobile card component elevation best practices"
  - Query: "loading spinner WCAG accessibility"
  - Output: `/docs/research/05/advanced-components.md`

- [ ] **Use sequentialthinking** to plan implementation:
  - Reuse: Phase 04 testing/documentation patterns
  - Define: Component-specific requirements
  - Output: `/docs/sequencing/05-component-build.md`

- [ ] **Create Card Component** (`src/ui/primitives/Card.tsx`):
  - Props: variant, padding, elevation
  - Features: iOS shadow, Android elevation
  - Features: Touchable variant for interactive cards
  - Accessibility: Proper container semantics

- [ ] **Create Sheet Component** (`src/ui/primitives/Sheet.tsx`):
  - Props: visible, onClose, snapPoints
  - Features: Bottom sheet modal with gesture dismissal
  - Features: Backdrop with tap-to-close
  - Features: Animated appearance/dismissal
  - Accessibility: Focus trap, screen reader announcement

- [ ] **Create ListItem Component** (`src/ui/primitives/ListItem.tsx`):
  - Props: title, subtitle, leftIcon, rightIcon, onPress
  - Features: Touchable with haptic feedback
  - Features: Disclosure indicator (chevron) for navigable items
  - Accessibility: Proper list semantics, combined labels

- [ ] **Create Icon Component** (`src/ui/primitives/Icon.tsx`):
  - Wrapper for @expo/vector-icons
  - Props: name, size, color (from tokens)
  - Features: Support Ionicons, MaterialIcons, Feather
  - Accessibility: Decorative vs. meaningful icons

- [ ] **Create Divider Component** (`src/ui/primitives/Divider.tsx`):
  - Props: orientation (horizontal/vertical), spacing
  - Features: Uses token colors and spacing
  - Accessibility: Purely decorative (ignored by screen readers)

- [ ] **Create Spinner Component** (`src/ui/primitives/Spinner.tsx`):
  - Props: size, color, accessibilityLabel
  - Features: Platform-specific (ActivityIndicator)
  - Accessibility: Proper loading announcements

- [ ] **Write Tests** for all 6 components:
  - Unit tests (rendering, props, interactions)
  - Accessibility tests (WCAG AA compliance)
  - Coverage target: >80%

- [ ] **Update Component Gallery**:
  - Add: Card examples (variants, elevations)
  - Add: Sheet demo (open/close button)
  - Add: ListItem examples (with/without icons)
  - Add: Icon showcase (common icons)
  - Add: Divider examples
  - Add: Spinner examples (sizes)
  - Screenshot: `reports/ui/component-gallery-complete.png`

- [ ] **Complete USAGE.md**:
  - Document all 10 primitives
  - Include code examples
  - Include accessibility guidelines
  - Include common patterns

- [ ] **Update links-map** and handover to Phase 06

## Artifacts & Paths

**Code:**
- `src/ui/primitives/Card.tsx`
- `src/ui/primitives/Sheet.tsx`
- `src/ui/primitives/ListItem.tsx`
- `src/ui/primitives/Icon.tsx`
- `src/ui/primitives/Divider.tsx`
- `src/ui/primitives/Spinner.tsx`
- Updated `src/ui/primitives/index.ts`

**Tests:** 6 new test files in `__tests__/`

**Docs:**
- `/docs/ui/USAGE.md` (complete)
- `/docs/research/05/advanced-components.md`
- `/docs/sequencing/05-component-build.md`

**Reports:**
- `reports/ui/component-gallery-complete.png`

## Testing

### Phase-Only Tests
- All new component tests pass
- Component gallery runs without errors
- Full accessibility audit passes

### Cross-Phase Compatibility
- Phase 06 adapter layer will wrap these primitives
- Phase 08-09 screens will use these components

### Test Commands
```bash
npm test -- primitives/
npm run test:a11y
npm run test:coverage  # >80%
npm run demo:gallery
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sheet component complex (gestures) | Timeline | Use library: @gorhom/bottom-sheet or simplified version |
| Icon library large (bundle size) | Performance | Tree-shake unused icons |
| Too many primitive variants | Scope creep | Stick to essential variants only |

## References

- [Phase 04](./04-primitives-part1.md) - Component patterns
- [Design System](./../../.docs/design-system.md) - Specifications
- [Native UI Guidelines](./../../.docs/vibecode/native_ui.md) - Platform patterns

## Handover

**Next Phase:** [06-adapter-layer.md](./06-adapter-layer.md) - Implement adapter pattern

**Required Inputs Provided to Phase 06:**
- Complete primitive library (10 components)
- Testing and documentation patterns
- Component gallery for reference

---

**Status:** Ready after Phase 04
**Estimated Time:** 1.5 days
**Blocking Issues:** Requires Phase 04 patterns
