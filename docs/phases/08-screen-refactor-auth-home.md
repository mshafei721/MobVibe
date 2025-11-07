# 08-screen-refactor-auth-home.md
---
phase_id: 08
title: Screen Refactoring (Auth & Home)
duration_estimate: "1.5 days"
incremental_value: First production screens using new primitive system
owners: [Frontend Engineer]
dependencies: [07]
linked_phases_forward: [09]
docs_referenced: [Design System, Features and Journeys]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
ui_requirements:
  framework_plan: ./../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md
  design_system: ./../.docs/design-system.md
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["React Native authentication screen UX 2025", "mobile onboarding best practices"]
    outputs: ["/docs/research/08/screen-patterns.md"]
  - name: ContextCurator
    tool: context7
    scope: ["features-and-journeys.md user flows", "Phase 04-07 primitives"]
    outputs: ["/docs/context/08-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for refactoring screens without breaking functionality"
    outputs: ["/docs/sequencing/08-refactor-plan.md"]
acceptance_criteria:
  - Login screen refactored using primitives only
  - Welcome/Home screen refactored using primitives only
  - Zero direct vendor imports (verified)
  - All existing functionality preserved
  - Visual regression tests pass
  - Accessibility audit passes
---

## Objectives

1. **Apply Primitive System** - Refactor 2 critical screens using new components
2. **Validate Architecture** - Prove primitives sufficient for real screens
3. **Establish Migration Pattern** - Create template for Phase 09

## Scope

### In
- Login screen (`app/(auth)/login.tsx`)
- Welcome/Home screen (`app/index.tsx`)
- Visual regression testing
- Accessibility validation
- Migration notes for Phase 09

### Out
- Code/Preview/Integrations tabs (Phase 09)
- Deep feature changes (maintain existing functionality)
- New screen features (focus on migration only)

## Tasks

- [ ] **Use context7** to compile refactoring context:
  - Include: features-and-journeys.md user flows
  - Include: Current screen implementations
  - Include: Phase 04-07 primitive API
  - Output: `/docs/context/08-context-bundle.md`

- [ ] **Use websearch** for screen patterns:
  - Query: "React Native authentication screen UX best practices 2025"
  - Query: "mobile app onboarding flow patterns"
  - Output: `/docs/research/08/screen-patterns.md`

- [ ] **Use sequentialthinking** to plan refactoring:
  - Strategy: Parallel component replacement
  - Identify: All vendor/old component usage
  - Define: Testing checkpoints
  - Output: `/docs/sequencing/08-refactor-plan.md`

- [ ] **Capture Pre-Refactor Baseline**:
  - Screenshot: Login screen (light + dark)
  - Screenshot: Home screen (light + dark)
  - Save: `reports/ui/phase-08-before-screenshots/`
  - Test: Run existing screen tests
  - Save: `reports/ui/phase-08-before-tests.json`

- [ ] **Refactor Login Screen**:
  - Replace components with primitives:
    - Old button → `<Button variant="primary" />`
    - Old input → `<Input type="email" />`
    - Old text → `<Text variant="h1" />`
    - Old card → `<Card elevation={2} />`
  - Import: Only from `@/ui/primitives`
  - Verify: OAuth buttons work
  - Verify: Magic link flow works
  - Verify: Error states display correctly
  - Test: All interactions functional

- [ ] **Refactor Welcome/Home Screen**:
  - Replace components:
    - Project cards → `<Card>` + `<ListItem>`
    - Action buttons → `<Button>`
    - Empty state → `<Animation>` (Lottie)
  - Import: Only from `@/ui/primitives`
  - Verify: Project navigation works
  - Verify: "New Project" flow works

- [ ] **Run Import Audit**:
  ```bash
  npm run ui:audit-imports -- app/(auth)/login.tsx
  npm run ui:audit-imports -- app/index.tsx
  # Expected: Zero direct vendor imports
  ```

- [ ] **Visual Regression Testing**:
  - Screenshot: Login screen after refactor
  - Screenshot: Home screen after refactor
  - Compare: Before vs. after
  - Document: Any intentional visual changes
  - Save: `reports/ui/phase-08-after-screenshots/`
  - Save: `reports/ui/phase-08-visual-diff.md`

- [ ] **Accessibility Testing**:
  - Run: `npm run test:a11y -- app/(auth)/login.tsx`
  - Run: `npm run test:a11y -- app/index.tsx`
  - Verify: No regressions from baseline (Phase 01)
  - Save: `reports/ui/phase-08-a11y.json`

- [ ] **Performance Check**:
  - Measure: Screen TTI (Time to Interactive)
  - Measure: Screen FPS during interactions
  - Compare: Against Phase 01 baseline
  - Target: Within ±10% of baseline
  - Save: `reports/ui/phase-08-performance.json`

- [ ] **Document Migration Pattern**:
  - Create: `docs/ui/MIGRATION_GUIDE.md` (partial)
  - Include: Step-by-step refactoring checklist
  - Include: Component mapping table
  - Include: Common pitfalls and solutions
  - Include: Testing verification steps

- [ ] **Update links-map** and handover to Phase 09

## Artifacts & Paths

**Code:**
- `app/(auth)/login.tsx` (refactored)
- `app/index.tsx` (refactored)

**Docs:**
- `/docs/ui/MIGRATION_GUIDE.md` (started)
- `/docs/research/08/screen-patterns.md`
- `/docs/sequencing/08-refactor-plan.md`

**Reports:**
- `reports/ui/phase-08-before-screenshots/`
- `reports/ui/phase-08-after-screenshots/`
- `reports/ui/phase-08-visual-diff.md`
- `reports/ui/phase-08-a11y.json`
- `reports/ui/phase-08-performance.json`

## Testing

### Phase-Only Tests
- Refactored screens render without errors
- All user flows functional (login, OAuth, project navigation)
- Import audit passes (zero vendor leakage)
- Visual regression within acceptable threshold
- Accessibility audit passes

### Cross-Phase Compatibility
- Screens work with Phase 01-07 infrastructure
- Phase 09 will follow same migration pattern

### Test Commands
```bash
# Test screens
npm test -- app/(auth)/login.test.tsx
npm test -- app/index.test.tsx

# Import audit
npm run ui:audit-imports -- app/(auth)/ app/index.tsx

# Accessibility
npm run test:a11y

# Visual regression
npm run test:visual-regression

# Performance
npm run test:performance -- app/(auth)/login.tsx app/index.tsx
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Refactor breaks existing functionality | High | Test each screen after refactor; maintain old components temporarily |
| Visual changes upset stakeholders | Medium | Get approval on visual diffs before finalizing |
| Performance regression | Medium | Measure continuously; rollback if >10% degradation |
| Accessibility regression | High | Run a11y tests after each component replacement |

## References

- [Features and Journeys](./../../.docs/features-and-journeys.md) - User flows to preserve
- [Design System](./../../.docs/design-system.md) - Visual standards
- [Phase 04-07](./04-primitives-part1.md) - Primitive components

## Handover

**Next Phase:** [09-screen-refactor-code-preview.md](./09-screen-refactor-code-preview.md) - Refactor Code & Preview tabs

**Required Inputs Provided to Phase 09:**
- Migration pattern documented
- Component mapping table
- Refactoring checklist
- Visual regression test setup

---

**Status:** Ready after Phase 07
**Estimated Time:** 1.5 days
**Blocking Issues:** Requires Phase 07 complete primitive library
