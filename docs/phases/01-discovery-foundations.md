# 01-discovery-foundations.md
---
phase_id: 01
title: Discovery & Baseline Measurement
duration_estimate: "1 day"
incremental_value: Establish quantified current state for comparison
owners: [Frontend Engineer, QA Engineer]
dependencies: []
linked_phases_forward: [02]
docs_referenced: [SUMMARY, Design System, UI Framework Plan, Implementation]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
ui_requirements:
  framework_plan: ./../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md
  design_system: ./../.docs/design-system.md
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["React Native 0.81 performance benchmarks 2025", "Expo SDK 54 best practices", "UI framework selection criteria"]
    outputs: ["/docs/research/01/performance-benchmarks.md", "/docs/research/01/best-practices.md"]
  - name: ContextCurator
    tool: context7
    scope: ["SUMMARY.md", "design-system.md", "UI-FRAMEWORK-INTEGRATION-PLAN.md"]
    outputs: ["/docs/context/01-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for baseline measurement and metric capture"
    outputs: ["/docs/sequencing/01-baseline-steps.md"]
acceptance_criteria:
  - Baseline performance metrics captured (TTI, FPS, bundle size, memory)
  - Screenshots of all 5 screens (light + dark mode)
  - Accessibility audit completed with axe-core
  - Current component inventory documented
  - Research notes include 3+ competitive benchmarks
---

## Objectives

1. **Quantify Current State** - Measure performance, accessibility, and UX metrics
2. **Establish Baseline** - Create comparison reference for Phase 10
3. **Research Foundation** - Validate UI framework selection criteria

## Scope

### In
- Performance measurement (TTI, FPS, bundle size, memory usage)
- Accessibility audit (screen reader, dynamic type, contrast)
- Visual documentation (screenshots, component inventory)
- Research on RN 0.81 + Expo SDK 54 best practices
- Current design token analysis

### Out
- Any code changes or refactoring
- Framework installation
- New component creation

## Tasks

- [ ] **Use context7** to compile focused bundle from SUMMARY.md, design-system.md, UI-FRAMEWORK-INTEGRATION-PLAN.md
  - Include: current design tokens, existing components, target aesthetic
  - Output: `/docs/context/01-context-bundle.md`

- [ ] **Use websearch** to research current best practices:
  - Query 1: "React Native 0.81 performance benchmarks 2025"
  - Query 2: "Expo SDK 54 production best practices"
  - Query 3: "UI framework selection mobile app 2025"
  - Output: `/docs/research/01/notes.md` with citations

- [ ] **Use sequentialthinking** to generate measurement micro-plan:
  - Define: exact metrics to capture
  - Define: tools and commands to run
  - Define: success criteria for baseline
  - Output: `/docs/sequencing/01-steps.md`

- [ ] **Measure Performance Baseline**:
  - Run: `npm run start -- --no-dev --minify`
  - Measure: TTI (Time to Interactive) using React Native Performance Monitor
  - Measure: FPS during scrolling (Code tab, Preview tab)
  - Measure: Bundle size (`npx expo export --platform all && du -sh dist/`)
  - Measure: Memory usage on iOS Simulator & Android Emulator
  - Save: `reports/ui/baseline-performance.json`

- [ ] **Capture Visual Baseline**:
  - Screenshot: Login screen (light + dark)
  - Screenshot: Home/Welcome screen (light + dark)
  - Screenshot: Code tab (light + dark)
  - Screenshot: Preview tab (light + dark)
  - Screenshot: Integrations tab (light + dark)
  - Save: `reports/ui/baseline-screenshots/` with naming: `{screen}-{mode}.png`

- [ ] **Run Accessibility Audit**:
  - Install: `npm install --save-dev @axe-core/react-native`
  - Run: axe-core audit on all 5 screens
  - Check: Screen reader labels on interactive elements
  - Check: Touch target sizes (44pt iOS / 48dp Android)
  - Check: Contrast ratios (WCAG AA: 4.5:1 text, 3:1 UI)
  - Check: Dynamic type support
  - Save: `reports/ui/baseline-a11y.json`

- [ ] **Document Current Component Inventory**:
  - List: All components in `components/ui/` directory
  - Document: Current design tokens in `constants/`
  - Identify: Duplicated styling patterns
  - Identify: Missing components vs. UI Framework Plan
  - Save: `reports/ui/component-inventory.md`

- [ ] **Run Bundle Analysis**:
  - Run: `npx expo export --platform all`
  - Run: `npx react-native-bundle-visualizer`
  - Identify: Largest dependencies
  - Identify: Unused modules
  - Save: `reports/ui/baseline-bundle-analysis.json`

- [ ] **Update links-map** with baseline artifacts and Phase 02 dependency

- [ ] **Create ADR** (Architecture Decision Record) for baseline methodology if significant decisions made

## Artifacts & Paths

**Code:** No code changes in this phase

**Docs:**
- `/docs/context/01-context-bundle.md` - Curated context from key docs
- `/docs/research/01/notes.md` - Performance benchmarks and best practices
- `/docs/research/01/performance-benchmarks.md` - RN 0.81 benchmarks
- `/docs/research/01/best-practices.md` - Expo SDK 54 best practices
- `/docs/sequencing/01-steps.md` - Step-by-step measurement plan

**Reports:**
- `/reports/ui/baseline-performance.json` - TTI, FPS, bundle, memory metrics
- `/reports/ui/baseline-screenshots/` - Visual baseline (10 screenshots)
- `/reports/ui/baseline-a11y.json` - Accessibility audit results
- `/reports/ui/component-inventory.md` - Current component audit
- `/reports/ui/baseline-bundle-analysis.json` - Dependency analysis

## Testing

### Phase-Only Tests
- Verify all measurement tools run successfully
- Validate JSON outputs parse correctly
- Confirm screenshots captured correctly (10 files)
- Check accessibility audit produces valid report
- Lint/format all docs and reports

### Cross-Phase Compatibility
- N/A (first phase, no dependencies)

### Test Commands
```bash
# Verify reports exist
test -f reports/ui/baseline-performance.json
test -d reports/ui/baseline-screenshots
test -f reports/ui/baseline-a11y.json
test -f reports/ui/component-inventory.md

# Validate JSON
node -e "JSON.parse(require('fs').readFileSync('reports/ui/baseline-performance.json'))"
node -e "JSON.parse(require('fs').readFileSync('reports/ui/baseline-a11y.json'))"

# Count screenshots (should be 10: 5 screens × 2 modes)
ls reports/ui/baseline-screenshots/*.png | wc -l  # expect: 10
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance tools fail on Windows | Block measurement | Use cross-platform tools; manual measurement as fallback |
| Missing screens (e.g., Integrations tab incomplete) | Incomplete baseline | Document as "partial" and note in report |
| Accessibility audit reveals critical issues | High | Document all issues; do not block phase; address in Phase 10 |
| Bundle analysis tools incompatible with Expo SDK 52 | Block analysis | Use alternative: Metro bundler output analysis |

## References

- [SUMMARY.md](./../../.docs/SUMMARY.md) - Complete documentation index
- [UI Framework Plan](./../../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md) - Phase 0.5 specification
- [Design System](./../../.docs/design-system.md) - Current design tokens
- [Implementation](./../../.docs/implementation.md) - Tech stack details

## Handover

**Next Phase:** [02-foundation-decision.md](./02-foundation-decision.md) - Choose primary UI library (Tamagui vs gluestack UI)

**Required Inputs Provided to Phase 02:**
- Baseline performance metrics (for comparison)
- Current component inventory (to inform PoC scope)
- Research notes (to inform scoring criteria)
- Screenshot baseline (for visual comparison)

**Phase 02 Depends On:**
- `/reports/ui/baseline-performance.json` - For before/after comparison
- `/docs/research/01/notes.md` - Best practices inform decision criteria

---

**Status:** Ready for execution
**Estimated Time:** 1 working day (8 hours)
**Blocking Issues:** None
