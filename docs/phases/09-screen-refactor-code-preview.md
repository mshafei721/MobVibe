# 09-screen-refactor-code-preview.md
---
phase_id: 09
title: Screen Refactoring (Code & Preview Tabs)
duration_estimate: "1.5 days"
incremental_value: Complete screen migration to primitive system
owners: [Frontend Engineer]
dependencies: [08]
linked_phases_forward: [10]
docs_referenced: [Design System, Features and Journeys]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
ui_requirements:
  framework_plan: ./../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md
  design_system: ./../.docs/design-system.md
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["React Native code editor component", "mobile WebView best practices"]
    outputs: ["/docs/research/09/complex-screens.md"]
  - name: ContextCurator
    tool: context7
    scope: ["Phase 08 migration pattern", "features-and-journeys.md tab flows"]
    outputs: ["/docs/context/09-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for refactoring complex tab screens"
    outputs: ["/docs/sequencing/09-refactor-plan.md"]
acceptance_criteria:
  - Code tab refactored using primitives
  - Preview tab refactored using primitives
  - Integrations tab refactored (if exists)
  - Icon Gen tab refactored (if exists)
  - All tab screens pass import audit
  - Full accessibility audit passes
  - Complete migration to primitives verified
---

## Objectives

1. **Complete Screen Migration** - Refactor remaining 3-4 tab screens
2. **Validate System Completeness** - Ensure primitives cover all use cases
3. **Prepare for Phase 10** - All screens ready for final audit

## Scope

### In
- Code tab (`app/(tabs)/code.tsx`)
- Preview tab (`app/(tabs)/preview.tsx`)
- Integrations tab (`app/(tabs)/integrations.tsx`)
- Icon Gen tab (`app/(tabs)/icons.tsx`)
- Tab navigation layout (`app/(tabs)/_layout.tsx`)

### Out
- Tab functionality changes (preserve existing)
- Deep feature work (focus on UI migration only)

## Tasks

- [ ] **Use context7** to compile context:
  - Include: Phase 08 migration pattern
  - Include: Tab screen specifications from features-and-journeys.md
  - Output: `/docs/context/09-context-bundle.md`

- [ ] **Use websearch** for complex patterns:
  - Query: "React Native code editor syntax highlighting"
  - Query: "React Native WebView optimization"
  - Query: "mobile file tree component patterns"
  - Output: `/docs/research/09/complex-screens.md`

- [ ] **Use sequentialthinking** to plan:
  - Apply: Phase 08 pattern to each tab
  - Identify: Complex components needing special attention
  - Define: Testing checkpoints per tab
  - Output: `/docs/sequencing/09-refactor-plan.md`

- [ ] **Capture Pre-Refactor Baseline**:
  - Screenshot: All tab screens (light + dark)
  - Save: `reports/ui/phase-09-before-screenshots/`
  - Test: Run existing tests
  - Save: `reports/ui/phase-09-before-tests.json`

- [ ] **Refactor Code Tab** (`app/(tabs)/code.tsx`):
  - Components:
    - File tree → `<ListItem>` hierarchy
    - Code viewer → `<Card>` + syntax highlighting
    - Terminal output → `<Text variant="code">` + `<ScrollView>`
    - Action buttons → `<Button>` variants
  - Import: Only from `@/ui/primitives`
  - Verify: File navigation works
  - Verify: Terminal scrolling works
  - Test: Code viewer rendering

- [ ] **Refactor Preview Tab** (`app/(tabs)/preview.tsx`):
  - Components:
    - WebView container → `<Card>`
    - Control buttons → `<Button>`
    - Loading state → `<Spinner>` + `<Animation>`
    - Empty state → `<Card>` + `<Text>` + `<Button>`
  - Import: Only from `@/ui/primitives`
  - Verify: WebView loads correctly
  - Verify: Reload/screenshot controls work

- [ ] **Refactor Integrations Tab** (if exists):
  - Components:
    - Integration cards → `<Card>` + `<ListItem>`
    - Toggle switches → `<Button variant="toggle">` or native
    - Status indicators → `<Icon>` + `<Text>`
  - Import: Only from `@/ui/primitives`

- [ ] **Refactor Icon Gen Tab** (if exists):
  - Components:
    - Icon grid → `<Card>` grid
    - Generation button → `<Button variant="primary">`
    - Icon preview → `<Image>` in `<Card>`
    - Loading state → `<Animation source={loading} />`
  - Import: Only from `@/ui/primitives`

- [ ] **Refactor Tab Layout** (`app/(tabs)/_layout.tsx`):
  - Replace: Tab bar icons with `<Icon>` from primitives
  - Apply: Token colors for active/inactive states
  - Verify: Navigation works
  - Verify: Tab switching animations smooth

- [ ] **Run Import Audit on All Tabs**:
  ```bash
  npm run ui:audit-imports -- app/(tabs)/
  # Expected: Zero direct vendor imports
  ```

- [ ] **Visual Regression Testing**:
  - Screenshot: All tabs after refactor
  - Compare: Before vs. after
  - Document: Any intentional changes
  - Save: `reports/ui/phase-09-after-screenshots/`
  - Save: `reports/ui/phase-09-visual-diff.md`

- [ ] **Accessibility Testing**:
  - Run: `npm run test:a11y -- app/(tabs)/`
  - Verify: Screen reader navigation logical
  - Verify: Tab focus order correct
  - Save: `reports/ui/phase-09-a11y.json`

- [ ] **Performance Testing**:
  - Measure: Tab switching speed
  - Measure: Code tab rendering (large files)
  - Measure: Preview tab WebView performance
  - Compare: Against Phase 01 baseline
  - Save: `reports/ui/phase-09-performance.json`

- [ ] **Complete MIGRATION_GUIDE.md**:
  - Add: Complex screen patterns
  - Add: File tree implementation
  - Add: Code viewer implementation
  - Add: WebView integration
  - Add: Final checklist for future migrations

- [ ] **Verify System Completeness**:
  - Check: All screens use primitives only
  - Check: Zero vendor imports outside adapters
  - Check: All common patterns covered
  - Document: Any missing primitives for future

- [ ] **Update links-map** and handover to Phase 10

## Artifacts & Paths

**Code:**
- `app/(tabs)/code.tsx` (refactored)
- `app/(tabs)/preview.tsx` (refactored)
- `app/(tabs)/integrations.tsx` (refactored, if exists)
- `app/(tabs)/icons.tsx` (refactored, if exists)
- `app/(tabs)/_layout.tsx` (refactored)

**Docs:**
- `/docs/ui/MIGRATION_GUIDE.md` (complete) ⭐
- `/docs/research/09/complex-screens.md`
- `/docs/sequencing/09-refactor-plan.md`

**Reports:**
- `reports/ui/phase-09-before-screenshots/`
- `reports/ui/phase-09-after-screenshots/`
- `reports/ui/phase-09-visual-diff.md`
- `reports/ui/phase-09-a11y.json`
- `reports/ui/phase-09-performance.json`

## Testing

### Phase-Only Tests
- All tab screens functional
- Import audit passes (all screens)
- Visual regression acceptable
- Accessibility audit passes
- Performance within budget

### Cross-Phase Compatibility
- All Phase 01-08 infrastructure working
- Phase 10 can perform final comprehensive audit

### Test Commands
```bash
# Test all tabs
npm test -- app/(tabs)/

# Import audit
npm run ui:audit-imports -- app/

# Accessibility
npm run test:a11y

# Visual regression
npm run test:visual-regression

# Performance
npm run test:performance
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex components missing primitives | Block migration | Build missing primitives on-demand; document for future |
| Tab performance regression | UX | Optimize rendering; consider virtualization for large lists |
| WebView integration issues | High | Test thoroughly on iOS + Android; maintain fallbacks |
| Migration fatigue | Timeline | Focus on essential refactoring; accept some compromise |

## References

- [Phase 08](./08-screen-refactor-auth-home.md) - Migration pattern
- [Features and Journeys](./../../.docs/features-and-journeys.md) - Tab specifications

## Handover

**Next Phase:** [10-performance-audit-documentation.md](./10-performance-audit-documentation.md) - Final QA and documentation

**Required Inputs Provided to Phase 10:**
- All screens migrated to primitives
- Complete migration guide
- Full test suite passing
- Visual regression baselines

---

**Status:** Ready after Phase 08
**Estimated Time:** 1.5 days
**Blocking Issues:** Requires Phase 08 pattern and primitives
