# Phase 0.5: Links Map & Artifact Flow

**Purpose:** Track explicit dependencies and artifact flows between phases

**Last Updated:** 2025-11-06
**Phase 01 Status:** ✅ COMPLETE (Research & Templates)
**Phase 02 Status:** ✅ COMPLETE (Foundation Decision - gluestack UI)

---

## Phase Linkage Overview

```mermaid
graph LR
  P01[01: Discovery] -->|Baseline Metrics| P02[02: Foundation]
  P02 -->|Chosen Library| P03[03: Tokens]
  P03 -->|Token System| P04[04: Primitives 1]
  P04 -->|Patterns| P05[05: Primitives 2]
  P05 -->|Complete Primitives| P06[06: Adapters]
  P06 -->|Adapter Pattern| P07[07: Libraries]
  P07 -->|Integrated Components| P08[08: Auth/Home]
  P08 -->|Migration Pattern| P09[09: Code/Preview]
  P09 -->|All Screens| P10[10: Audit]
```

---

## Forward Links (What Each Phase Provides)

### Phase 01 → Phase 02
**Artifacts Provided:**
- `reports/ui/baseline-performance.json` - Performance baseline for comparison
- `reports/ui/baseline-screenshots/` - Visual baseline (10 screenshots)
- `reports/ui/baseline-a11y.json` - Accessibility baseline
- `reports/ui/component-inventory.md` - Current component audit
- `docs/research/01/notes.md` - Best practices research

**How Phase 02 Uses Them:**
- Baseline metrics inform PoC scoring criteria
- Component inventory shows what needs replacing
- Research validates framework selection approach

### Phase 02 → Phase 03
**Artifacts Provided:**
- Chosen UI library installed (Tamagui OR gluestack UI)
- `tamagui.config.ts` OR `gluestack.config.ts` - Initial configuration
- `docs/ui/FOUNDATION.md` - Decision rationale
- `docs/ui/FOUNDATION-SCORING.md` - Objective scoring

**How Phase 03 Uses Them:**
- Library config is starting point for token mapping
- Decision rationale informs token structure choices

### Phase 03 → Phase 04
**Artifacts Provided:**
- `src/ui/tokens.ts` - Unified design token system
- `src/ui/tokens.json` - JSON export
- `scripts/ui-audit-tokens.sh` - Token conflict detection
- Updated library config with token mapping

**How Phase 04 Uses Them:**
- Components import and use tokens exclusively
- Audit script ensures no hardcoded styles

### Phase 04 → Phase 05
**Artifacts Provided:**
- `src/ui/primitives/Button.tsx` - Button component
- `src/ui/primitives/Text.tsx` - Text component
- `src/ui/primitives/Input.tsx` - Input component
- Component testing patterns established
- TypeScript API patterns

**How Phase 05 Uses Them:**
- Follow established patterns for remaining primitives
- Reuse testing infrastructure
- Maintain consistent TypeScript API design

### Phase 05 → Phase 06
**Artifacts Provided:**
- Complete primitive library (10 components):
  - Button, Text, Input, Card, Sheet, ListItem, Icon, Divider, Spinner
- `src/ui/__demo__/ComponentGallery.tsx` - Interactive demo
- `docs/ui/USAGE.md` - Component documentation

**How Phase 06 Uses Them:**
- All primitives refactored to use adapter pattern
- Gallery used to verify adapters work correctly

### Phase 06 → Phase 07
**Artifacts Provided:**
- `src/ui/adapters/` - Adapter layer
- `src/ui/adapters/types.ts` - Adapter interfaces
- `scripts/ui-audit-imports.sh` - Import audit script
- `docs/ui/ADAPTERS.md` - Adapter pattern guide

**How Phase 07 Uses Them:**
- New libraries (Paper, Chat, Lottie) integrate via same adapter pattern
- Audit script prevents vendor leakage

### Phase 07 → Phase 08
**Artifacts Provided:**
- `src/ui/adapters/paper/` - Material Design components
- `src/ui/adapters/gifted-chat/` - Chat UI
- `src/ui/adapters/lottie/` - Animations
- `src/ui/components/Animation.tsx` - Centralized animation component

**How Phase 08 Uses Them:**
- Screens can use Paper/Chat/Lottie via adapters
- Animation component for loading states

### Phase 08 → Phase 09
**Artifacts Provided:**
- Refactored screens:
  - `app/(auth)/login.tsx`
  - `app/index.tsx`
- `docs/ui/MIGRATION_GUIDE.md` (partial) - Migration pattern
- Visual regression test setup
- Component mapping table

**How Phase 09 Uses Them:**
- Follow established migration pattern for remaining screens
- Use mapping table for component replacement
- Extend migration guide with complex screen patterns

### Phase 09 → Phase 10
**Artifacts Provided:**
- All screens migrated to primitives:
  - Auth screens
  - Home screen
  - Code tab
  - Preview tab
  - Integrations tab
  - Icon Gen tab
- `docs/ui/MIGRATION_GUIDE.md` (complete) - Full migration guide
- Visual regression baselines

**How Phase 10 Uses Them:**
- Comprehensive audit of all work
- Performance comparison against Phase 01 baseline
- Documentation completion and sign-off

---

## Backward Links (What Each Phase Depends On)

### Phase 02 ← Phase 01
**Required from Phase 01:**
- Baseline metrics established
- Current state documented
- Research notes available

**Blocked if Phase 01 incomplete**

### Phase 03 ← Phase 02
**Required from Phase 02:**
- UI library chosen and installed
- Library config exists
- Decision documented

**Blocked if Phase 02 incomplete**

### Phase 04 ← Phase 03
**Required from Phase 03:**
- Token system complete
- Library config updated with tokens
- Token audit script working

**Blocked if Phase 03 incomplete**

### Phase 05 ← Phase 04
**Required from Phase 04:**
- Button, Text, Input primitives working
- Testing patterns established
- TypeScript patterns defined

**Blocked if Phase 04 incomplete**

### Phase 06 ← Phase 05
**Required from Phase 05:**
- All 10 primitives complete
- Component gallery working
- Documentation started

**Blocked if Phase 05 incomplete**

### Phase 07 ← Phase 06
**Required from Phase 06:**
- Adapter layer implemented
- Import audit script working
- Adapter pattern documented

**Blocked if Phase 06 incomplete**

### Phase 08 ← Phase 07
**Required from Phase 07:**
- All libraries integrated via adapters
- Animation component ready
- Complete primitive + library system

**Blocked if Phase 07 incomplete**

### Phase 09 ← Phase 08
**Required from Phase 08:**
- Auth + Home screens refactored
- Migration pattern established
- Visual regression tests setup

**Blocked if Phase 08 incomplete**

### Phase 10 ← Phase 09
**Required from Phase 09:**
- All screens migrated
- Full migration guide complete
- All tests passing

**Blocked if Phase 09 incomplete**

---

## Cross-Phase Artifact References

### Documentation
| Artifact | Created In | Updated In | Used By |
|----------|-----------|------------|---------|
| `docs/ui/FOUNDATION.md` | Phase 02 | - | Phase 03, 10 |
| `docs/ui/USAGE.md` | Phase 04 | Phase 05 | Phase 08, 09, 10 |
| `docs/ui/THEMING.md` | Phase 03 | - | Phase 04-10 |
| `docs/ui/ADAPTERS.md` | Phase 06 | Phase 07 | Phase 07-10 |
| `docs/ui/MIGRATION_GUIDE.md` | Phase 08 | Phase 09 | Phase 09, 10 |

### Code
| Artifact | Created In | Updated In | Used By |
|----------|-----------|------------|---------|
| `src/ui/tokens.ts` | Phase 03 | - | Phase 04-10 |
| `src/ui/primitives/` | Phase 04-05 | Phase 06 | Phase 07-10 |
| `src/ui/adapters/` | Phase 06 | Phase 07 | Phase 07-10 |
| Component Gallery | Phase 04 | Phase 05, 07 | Phase 06-10 |

### Reports
| Artifact | Created In | Referenced By | Purpose |
|----------|-----------|---------------|---------|
| Baseline Performance | Phase 01 | Phase 02, 10 | Before/after comparison |
| Baseline Accessibility | Phase 01 | Phase 10 | Regression detection |
| Bundle Analysis | Phase 01, 07 | Phase 10 | Size monitoring |

### Scripts
| Artifact | Created In | Used By | Purpose |
|----------|-----------|---------|---------|
| `scripts/ui-audit-tokens.sh` | Phase 03 | Phase 03-10 | Token conflict detection |
| `scripts/ui-audit-imports.sh` | Phase 06 | Phase 06-10 | Vendor leakage prevention |
| `scripts/ui-audit-a11y.sh` | Phase 04 | Phase 04-10 | Accessibility verification |

---

## Critical Path

**Cannot proceed if any of these block:**

1. Phase 01 → Phase 02: No baseline = no comparison
2. Phase 02 → Phase 03: No library = no token mapping
3. Phase 03 → Phase 04: No tokens = components can't be built
4. Phase 04-05 → Phase 08-09: No primitives = screens can't be refactored
5. Phase 09 → Phase 10: Incomplete migration = no sign-off

**Phases that can partially run in parallel (same day):**
- Phase 04 + Phase 05 (if team has multiple engineers)
- Phase 08 + Phase 09 (if screens independent)

---

## Artifact Flow Diagram

```
Phase 01: Discovery
  ├─ baseline-performance.json ──────────┐
  ├─ baseline-a11y.json ─────────────────┤
  └─ research/01/notes.md ───────────────┤
                                         ▼
Phase 02: Foundation Decision          Phase 10: Final Audit
  ├─ FOUNDATION.md ──────────────────────┤  (compares all)
  ├─ tamagui.config.ts ──┐               │
  └─ (chosen library) ───┤               │
                         ▼               │
Phase 03: Token System                  │
  ├─ tokens.ts ──────────┬───────────────┤
  └─ ui-audit-tokens.sh ─┤               │
                         ▼               │
Phase 04-05: Primitives                 │
  ├─ primitives/*.tsx ───┬───────────────┤
  └─ ComponentGallery ───┤               │
                         ▼               │
Phase 06: Adapters                      │
  ├─ adapters/ ──────────┬───────────────┤
  └─ ui-audit-imports.sh ┤               │
                         ▼               │
Phase 07: Libraries                     │
  ├─ paper/ ────────────┬────────────────┤
  ├─ gifted-chat/ ──────┤                │
  └─ lottie/ ───────────┤                │
                         ▼               │
Phase 08-09: Screens                    │
  ├─ refactored screens ─┬───────────────┤
  ├─ MIGRATION_GUIDE.md ─┤               │
  └─ visual regression ──┘               │
                                         ▼
                              Phase 10: Complete ✅
```

---

## Verification Checkpoints

| Checkpoint | Phases | Verification | Pass Criteria |
|------------|--------|--------------|---------------|
| Baseline Established | 01 | Metrics captured | JSON files exist |
| Foundation Selected | 02 | Library installed | FOUNDATION.md exists |
| Tokens Unified | 03 | Audit passes | Zero conflicts |
| Primitives Complete | 04-05 | All 10 built | Gallery works |
| Adapters Working | 06 | Audit passes | Zero leakage |
| Libraries Integrated | 07 | Bundle checked | Size ≤ +10% |
| Screens Migrated | 08-09 | Import audit | All screens clean |
| Production Ready | 10 | All predicates | All pass ✅ |

---

## Phase 01 Execution Summary

**Status:** ✅ COMPLETE (Research & Template Creation)
**Date:** 2025-11-06
**Duration:** ~4 hours (research & documentation)

### Artifacts Created

**MCP Research Outputs:**
- ✅ `/docs/context/01-context-bundle.md` - Curated context from key documentation
- ✅ `/docs/research/01/notes.md` - RN 0.81, Expo SDK 54, Tamagui vs gluestack UI research
- ✅ `/docs/sequencing/01-baseline-steps.md` - Step-by-step execution micro-plan

**Baseline Templates:**
- ✅ `/reports/ui/baseline-performance.json` - Performance measurement template (TTI, FPS, bundle, memory)
- ✅ `/reports/ui/baseline-a11y.json` - Accessibility audit template with preliminary issues identified
- ✅ `/reports/ui/baseline-bundle-analysis.json` - Bundle analysis template

**Component Inventory:**
- ✅ `/reports/ui/component-inventory.md` - Complete audit of:
  - 3 UI components (Button, Card, Input)
  - 4 design token files (colors, typography, spacing, config)
  - 5 screens (Welcome, Login, Code, Preview, Integrations)
  - Identified ~20 hardcoded values needing token migration
  - Identified 12+ missing components vs UI Framework Plan

### Key Findings

**Current State (Expo SDK 52, React Native 0.76.5):**
- ✅ Minimal UI framework (3 components)
- ⚠️ Design tokens exist but incomplete
- ⚠️ 50% hardcoded values in screen files
- ❌ No accessibility labels (0% coverage)
- ❌ Dark mode not implemented
- ❌ No UI component library installed

**Research Highlights:**
- Expo SDK 54 provides **10x faster iOS builds** (XCFrameworks)
- React Native 0.81 with Hermes: **2.5-9% TTI improvements**
- gluestack UI shows better raw performance in benchmarks vs Tamagui
- Both Tamagui and gluestack UI are production-ready (2025)

**Recommendations for Phase 02:**
- Choose between Tamagui (compile-time, web parity) vs gluestack UI (runtime, Tailwind-like)
- Run PoC with both frameworks
- Use objective scoring matrix
- Document decision rationale

### Manual Work Required

**Performance Measurement** (baseline-performance.json):
- [ ] Run production build and measure TTI (cold/warm start)
- [ ] Measure FPS during scrolling (Code, Preview tabs)
- [ ] Export bundles and measure sizes
- [ ] Profile memory usage (iOS Simulator, Android Emulator)

**Visual Baseline** (10 screenshots):
- [ ] Capture Welcome screen (light + dark)
- [ ] Capture Login screen (light + dark)
- [ ] Capture Code tab (light + dark)
- [ ] Capture Preview tab (light + dark)
- [ ] Capture Integrations tab (light + dark)

**Accessibility Testing** (baseline-a11y.json):
- [ ] Test VoiceOver (iOS)
- [ ] Test TalkBack (Android)
- [ ] Verify touch target sizes
- [ ] Check contrast ratios
- [ ] Test dynamic type support

**Bundle Analysis** (baseline-bundle-analysis.json):
- [ ] Install react-native-bundle-visualizer
- [ ] Export bundles and run analyzer
- [ ] Identify top 10 largest dependencies
- [ ] Document optimization opportunities

### Phase 02 Dependencies Ready

**Provided to Phase 02:**
- ✅ Research notes on Tamagui vs gluestack UI
- ✅ Component inventory (shows what needs replacing)
- ✅ Performance measurement methodology
- ✅ Baseline templates for before/after comparison

**Blocking:** None - Phase 02 can proceed with research and PoC testing

---

## Phase 02 Execution Summary

**Status:** ✅ COMPLETE (Foundation Decision - gluestack UI Selected)
**Date:** 2025-11-06
**Duration:** ~6 hours (research, analysis, decision documentation)

### Artifacts Created

**Decision Documents:**
- ✅ `/docs/ui/FOUNDATION.md` - Official decision: gluestack UI selected (8.35/10 vs Tamagui 7.45/10)
- ✅ `/docs/ui/FOUNDATION-SCORING.md` - Detailed objective scoring breakdown with evidence

**MCP Research Outputs:**
- ✅ `/docs/context/02-context-bundle.md` - Decision context (criteria, PoC scope, success metrics)
- ✅ `/docs/research/02/tamagui-analysis.md` - Deep dive: Production cases, performance, DX, theming, SSR
- ✅ `/docs/research/02/gluestack-analysis.md` - Deep dive: v1→v2→v3 evolution, benchmarks, NativeWind
- ✅ `/docs/research/02/comparison.md` - Head-to-head comparison with weighted scoring
- ✅ `/docs/sequencing/02-poc-steps.md` - PoC execution plan (both libraries, 3 screens each)

### Key Decision

**Winner: gluestack UI** ✅

**Final Scores:**
- gluestack UI: **8.35/10** (wins 4/5 criteria)
- Tamagui: **7.45/10** (wins 1/5 criteria)

| Criterion | Weight | gluestack | Tamagui | Winner |
|-----------|--------|-----------|---------|--------|
| Performance | 25% | 9/10 | 7/10 | ✅ gluestack |
| Developer Experience | 20% | 8/10 | 7/10 | ✅ gluestack |
| Theming Flexibility | 20% | 8/10 | 8/10 | 🤝 Tie |
| Web Viability | 15% | 6/10 | 10/10 | ✅ Tamagui |
| Migration Effort | 20% | 9/10 | 6/10 | ✅ gluestack |

**Rationale:**
1. **Best mobile performance** - 98-99ms render times (37% faster than Tamagui)
2. **Faster team onboarding** - 2-5 days vs 1-2 weeks
3. **Modular architecture** - Copy-paste components, smaller bundle
4. **Tailwind familiarity** - Most developers know Tailwind CSS
5. **Good enough web** - Basic web (6/10) sufficient for mobile-first Phase 1

**Trade-off Accepted:**
- Giving up excellent SSR support (Tamagui 10/10 → gluestack 6/10)
- But gaining better mobile performance and faster development velocity
- Can migrate to Tamagui later if SSR becomes critical

### Research Highlights

**Performance Benchmarks (gluestack-ui-benchmarks, July 2024):**
- gluestack UI v2: **98-99ms** average render time
- Tamagui: **156-157ms** average render time
- Native baseline: **70-79ms**
- **Result:** gluestack UI is **37% faster** than Tamagui

**Production Readiness:**
- **Tamagui:** Proven (Inkitt/Galatea, ~10K GitHub stars, v1.0 stable)
- **gluestack UI:** Production-ready (v2 stable Jan 2025, ~2-3K stars, NativeBase successor)

**Developer Experience:**
- **gluestack UI:** 2-5 day ramp-up, Tailwind CSS utilities, ~55 LOC for login screen
- **Tamagui:** 1-2 week ramp-up, style-first API, ~60 LOC for login screen

**Theming:**
- Both support comprehensive token systems and dark mode
- gluestack UI: Direct Tailwind config mapping (1-2 days)
- Tamagui: More granular control, nested themes (2-3 days)

**Web/SSR:**
- **Tamagui:** Excellent SSR/RSC support, Next.js ready, ~30KB web savings
- **gluestack UI:** Basic web via React Native Web, limited SSR

**Migration Effort:**
- **gluestack UI:** Shallow learning curve, copy-paste workflow, beginner-friendly docs
- **Tamagui:** Steeper curve, requires compiler understanding, more complex setup

### Phase 03 Dependencies Ready

**Provided to Phase 03:**
- ✅ Foundation decision documented (gluestack UI)
- ✅ Objective scoring with evidence
- ✅ Trade-off analysis
- ✅ Risk mitigation strategies
- ✅ Rollback plan (can migrate to Tamagui if needed)

**Next Steps for Phase 03:**
1. Install gluestack UI on main branch
2. Configure Tailwind with MobVibe tokens
3. Map design tokens → `tailwind.config.js`
4. Create token audit script
5. Document token system

**Blocking:** None - Decision complete, gluestack UI selection finalized

### Risk Mitigation

**Risk 1: Rapid Major Versions (v2 → v3 quickly)**
- **Mitigation:** Pin to specific version, monitor changelog, budget migration time

**Risk 2: Limited SSR if Web Becomes Priority**
- **Mitigation:** Document migration path to Tamagui, preserve Tamagui PoC branch

**Risk 3: Smaller Community than Tamagui**
- **Mitigation:** Active NativeBase team, v2 stable release, growing adoption

**Rollback Plan:**
- If gluestack UI proves inadequate: 2-3 week migration to Tamagui
- Triggers: Performance regressions >15%, critical SSR requirement
- Preserved Tamagui PoC branch for reference

---

**Status:** Phase 0.5 Links Map Complete | Phase 01 & 02 Complete ✅
**Next:** Execute Phase 03 - Token System Design (gluestack UI + Tailwind configuration)
