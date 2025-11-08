# 02-foundation-decision.md
---
phase_id: 02
title: Foundation Decision (Tamagui vs gluestack UI)
duration_estimate: "1.5 days"
incremental_value: Select and validate primary UI library with objective scoring
owners: [Senior Frontend Engineer, Tech Lead]
dependencies: [01]
linked_phases_forward: [03]
docs_referenced: [UI Framework Plan, Design System, Implementation]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
ui_requirements:
  framework_plan: ./../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md
  design_system: ./../.docs/design-system.md
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["Tamagui vs gluestack UI comparison 2025", "Tamagui production performance benchmarks", "gluestack UI real-world usage reviews", "React Native UI framework performance 2025"]
    outputs: ["/docs/research/02/tamagui-analysis.md", "/docs/research/02/gluestack-analysis.md", "/docs/research/02/comparison.md"]
  - name: ContextCurator
    tool: context7
    scope: ["UI-FRAMEWORK-INTEGRATION-PLAN.md", "design-system.md", "baseline metrics from Phase 01"]
    outputs: ["/docs/context/02-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for building PoCs with both libraries and scoring them objectively"
    outputs: ["/docs/sequencing/02-poc-steps.md"]
acceptance_criteria:
  - Both Tamagui AND gluestack UI PoCs built and tested
  - Objective scoring completed across 5 criteria (performance, DX, theming, web viability, migration effort)
  - Decision documented in docs/ui/FOUNDATION.md with rationale
  - Performance comparison measured (TTI, bundle size, FPS)
  - Selected library installed in main codebase
---

## Objectives

1. **Build Proof-of-Concepts** - Create working examples with both Tamagui and gluestack UI
2. **Objective Scoring** - Evaluate both against 5 quantified criteria
3. **Make Informed Decision** - Select primary UI library with documented rationale

## Scope

### In
- Create separate PoC branches for Tamagui and gluestack UI
- Build 3 representative screens (Login, Home, Code Tab) with each library
- Measure performance metrics for each PoC
- Score both libraries objectively
- Document decision with full rationale
- Install chosen library in main branch

### Out
- Full app refactoring (happens in later phases)
- Integration of add-on libraries (Paper, Gifted Chat - Phase 07)
- Production-ready components (Phase 04-05)

## Tasks

- [ ] **Use context7** to compile decision context:
  - Include: UI Framework Plan decision criteria
  - Include: Design system requirements
  - Include: Baseline performance from Phase 01
  - Output: `/docs/context/02-context-bundle.md`

- [ ] **Use websearch** to research both libraries:
  - Query: "Tamagui vs gluestack UI comparison 2025"
  - Query: "Tamagui production performance benchmarks"
  - Query: "gluestack UI real-world usage developer experience"
  - Query: "React Native UI framework performance 2025"
  - Output: `/docs/research/02/tamagui-analysis.md`
  - Output: `/docs/research/02/gluestack-analysis.md`
  - Output: `/docs/research/02/comparison.md`

- [ ] **Use sequentialthinking** to plan PoC execution:
  - Define: Exact screens to build in each PoC
  - Define: Metrics to measure for comparison
  - Define: Scoring rubric with weights
  - Output: `/docs/sequencing/02-poc-steps.md`

- [ ] **Create Tamagui PoC Branch**:
  - Branch: `git checkout -b poc/tamagui`
  - Install: `npm install tamagui @tamagui/config`
  - Configure: `tamagui.config.ts` with MobVibe design tokens
  - Build: Login screen with email input + OAuth buttons
  - Build: Home screen with project cards
  - Build: Code tab with file tree + terminal
  - Measure: Performance (TTI, FPS, bundle size)
  - Save: `reports/ui/tamagui-poc-performance.json`

- [ ] **Create gluestack UI PoC Branch**:
  - Branch: `git checkout -b poc/gluestack`
  - Install: `npm install @gluestack-ui/themed @gluestack-style/react`
  - Configure: `gluestack.config.ts` with MobVibe design tokens
  - Build: Login screen with email input + OAuth buttons
  - Build: Home screen with project cards
  - Build: Code tab with file tree + terminal
  - Measure: Performance (TTI, FPS, bundle size)
  - Save: `reports/ui/gluestack-poc-performance.json`

- [ ] **Score Both Libraries Objectively**:
  - **Criterion 1: Performance** (Weight: 25%)
    - Tamagui: TTI, FPS, bundle size
    - gluestack: TTI, FPS, bundle size
    - Score: 1-10 (lower TTI/bundle = higher score)

  - **Criterion 2: Developer Experience** (Weight: 20%)
    - Code clarity, TypeScript support, auto-complete
    - Lines of code for same component
    - Score: 1-10

  - **Criterion 3: Theming Flexibility** (Weight: 20%)
    - Token system depth, dark mode, custom themes
    - Ease of mapping MobVibe design tokens
    - Score: 1-10

  - **Criterion 4: Web Viability** (Weight: 15%)
    - SSR support, web performance, cross-platform consistency
    - Score: 1-10

  - **Criterion 5: Migration Effort** (Weight: 20%)
    - Learning curve, docs quality, community support
    - Estimated team ramp-up time
    - Score: 1-10

  - Calculate: Weighted total score for each
  - Save: `docs/ui/FOUNDATION-SCORING.md`

- [ ] **Document Decision**:
  - Create: `docs/ui/FOUNDATION.md`
  - Include: Decision summary (Tamagui OR gluestack UI)
  - Include: Full scoring table with rationale
  - Include: Trade-offs and considerations
  - Include: Migration plan from PoC to production
  - Include: Rollback plan if decision proves wrong

- [ ] **Install Chosen Library in Main Branch**:
  - Checkout: `git checkout main`
  - Install: Selected library + dependencies
  - Configure: Initial config file with MobVibe tokens
  - Commit: `git commit -m "chore: install {selected-library} as primary UI foundation"`
  - Tag: `git tag phase-0.5-02-foundation-selected`

- [ ] **Update links-map** with PoC artifacts and Phase 03 dependency

- [ ] **Create ADR** for foundation selection with full decision context

## Artifacts & Paths

**Code:**
- `poc/tamagui` branch (temporary) - Tamagui PoC
- `poc/gluestack` branch (temporary) - gluestack UI PoC
- `main` branch - Chosen library installed and configured
- `tamagui.config.ts` OR `gluestack.config.ts` - Initial configuration

**Docs:**
- `/docs/context/02-context-bundle.md` - Decision context
- `/docs/research/02/tamagui-analysis.md` - Tamagui research
- `/docs/research/02/gluestack-analysis.md` - gluestack research
- `/docs/research/02/comparison.md` - Head-to-head comparison
- `/docs/sequencing/02-poc-steps.md` - PoC execution plan
- `/docs/ui/FOUNDATION.md` ⭐ - Final decision with rationale
- `/docs/ui/FOUNDATION-SCORING.md` - Objective scoring table

**Reports:**
- `/reports/ui/tamagui-poc-performance.json` - Tamagui metrics
- `/reports/ui/gluestack-poc-performance.json` - gluestack metrics
- `/reports/ui/foundation-comparison.md` - Side-by-side comparison

**Screenshots:**
- `/reports/ui/tamagui-poc-screenshots/` - Tamagui PoC visuals
- `/reports/ui/gluestack-poc-screenshots/` - gluestack PoC visuals

## Testing

### Phase-Only Tests
- Both PoC branches build without errors
- All 3 screens functional in each PoC (Login, Home, Code)
- Performance measurements complete and valid
- Foundation decision document peer-reviewed
- Chosen library installs cleanly on main branch

### Cross-Phase Compatibility
- Phase 01 baseline metrics used for comparison
- Phase 03 will use chosen library's config as starting point

### Test Commands
```bash
# Verify PoC branches exist and build
git checkout poc/tamagui && npm install && npm run ios
git checkout poc/gluestack && npm install && npm run ios

# Verify performance reports
test -f reports/ui/tamagui-poc-performance.json
test -f reports/ui/gluestack-poc-performance.json

# Verify decision documented
test -f docs/ui/FOUNDATION.md
test -f docs/ui/FOUNDATION-SCORING.md

# Verify chosen library installed on main
git checkout main
npm list @tamagui/config || npm list @gluestack-ui/themed  # One should pass
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Both libraries score similarly | Decision paralysis | Use tiebreaker: team familiarity, community momentum |
| Chosen library has breaking bug | High | Keep PoC branches; enable quick rollback to other option |
| Performance overhead too high | Block adoption | Document as blocker; consider staying with NativeWind only |
| Learning curve steeper than expected | Timeline risk | Allocate extra time in Phase 04-05 for ramp-up |

## References

- [UI Framework Plan](./../../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md) - Foundation decision criteria (Step 2)
- [Design System](./../../.docs/design-system.md) - Token requirements
- [Phase 01 Baseline](./01-discovery-foundations.md) - Baseline metrics for comparison

## Handover

**Next Phase:** [03-token-system-design.md](./03-token-system-design.md) - Create unified design token system

**Required Inputs Provided to Phase 03:**
- Chosen UI library installed and configured
- Initial config file (`tamagui.config.ts` OR `gluestack.config.ts`)
- Decision rationale (informs token mapping strategy)

**Phase 03 Depends On:**
- Selected library configuration
- `docs/ui/FOUNDATION.md` - Decision rationale informs token approach

---

**Status:** Ready for execution after Phase 01
**Estimated Time:** 1.5 working days (12 hours)
**Blocking Issues:** Requires Phase 01 baseline metrics
