# Phase 02 Context Bundle: Foundation Decision

**Generated:** 2025-11-06
**Phase:** 02 - Foundation Decision (Tamagui vs gluestack UI)
**Purpose:** Decision context for selecting primary UI library

---

## Decision Overview

**Goal:** Select ONE primary UI library foundation from:
- **Tamagui** - Compile-time optimization, web parity, SSR support
- **gluestack UI** - Runtime styling, Tailwind-like API, better benchmarks

**Method:** Build PoCs with both, score objectively across 5 weighted criteria, document decision

---

## Phase 01 Baseline Context

### Current State (from component-inventory.md)

**Existing Components:**
- Button.tsx (3 variants, uses tokens)
- Card.tsx (shadow support, uses tokens)
- Input.tsx (error state, uses tokens)

**Missing Components (12+):**
- Text, Sheet/Modal, ListItem, Icon, Divider, Spinner
- Badge, Avatar, Checkbox, Radio, Switch, Slider
- Container, Stack, Grid, Spacer
- Tab Bar, Header, Back Button
- Alert, Toast, Progress Bar, Skeleton

**Design Tokens (Current):**
```typescript
colors: {
  primary: { 500: '#2196F3' },  // Only 1 variant (need 50-900)
  secondary: { 500: '#9C27B0' }, // Only 1 variant
  success: '#4CAF50',
  error: '#F44336',
  text: { primary, secondary, disabled },
  background: { light, dark },
  border: { light, medium }
}
```

**Issues:**
- Only 1 color variant (need 50-900 scale)
- No semantic colors (warning, info)
- No state colors (hover, pressed, disabled variants)
- ~20 hardcoded values in screens
- 0% accessibility coverage
- No dark mode implementation

### Performance Budget (from baseline templates)

**Targets for Phase 10:**
- TTI: ≤ baseline + 10%
- FPS: ≥ 55 fps (optimal: 60 fps)
- Bundle size: ≤ baseline + 10%
- Memory: No leaks

---

## UI Framework Plan Decision Criteria

### Candidate Libraries Comparison

**Tamagui:**
- **Strengths:** High-performance, compile-time styling, web parity, SSR support
- **Best For:** Apps needing web version, maximum performance, complex animations
- **Approach:** Style-first with optimizing compiler
- **Trade-offs:** Steep learning curve, more complex setup

**gluestack UI:**
- **Strengths:** Tailwind-like API, fast theming, composable tokens, strong DX
- **Best For:** Rapid development, flexible theming, Tailwind familiarity
- **Approach:** Runtime styling with NativeWind integration
- **Trade-offs:** Less mature than Tamagui, fewer production case studies

### From Phase 01 Research (docs/research/01/notes.md)

**Performance Benchmarks (gluestack-ui-benchmarks, July 2024):**
- gluestack-ui v2: 98-100 (certain metrics)
- Tamagui: 156-157 (same metrics)
- Native baseline: 70-79
- **Lower numbers = better performance**
- **gluestack UI shows better raw performance**

**Production Readiness:**
- Tamagui: Proven in production, many case studies
- gluestack UI: Production-ready as of 2025 (v2)
- Both appear in "top React Native UI libraries 2025" lists

---

## Design System Requirements

### Token System Needs

**Colors:**
- Full scale (50-900) for primary/secondary
- Semantic colors (success, warning, error, info)
- State variants (default, hover, pressed, disabled, focus)
- Transparent variants for overlays
- Dark mode equivalents

**Typography:**
- Font families (iOS: SF, Android: Roboto, Code: Menlo/Mono)
- Font sizes (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl)
- Font weights (normal, medium, semibold, bold)
- Line heights
- Letter spacing

**Spacing:**
- Spacing scale (0, 0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64)
- Padding, margin, gap utilities

**Motion/Animation:**
- Duration tokens (fast, base, slow)
- Easing functions (ease-in, ease-out, ease-in-out, spring)
- Transition properties

**Elevation/Shadows:**
- Shadow scales (0-5)
- Platform-specific (iOS vs Android elevation)

**Border Radius:**
- Radius scale (none, sm, base, md, lg, xl, 2xl, full)

### Platform Requirements

**Native Feel:**
- iOS/Android platform-specific patterns
- Native gestures (swipe, long-press, pinch)
- Haptic feedback integration
- Platform-appropriate modals (iOS: bottom sheet, Android: full screen)

**Accessibility:**
- Screen reader support (VoiceOver, TalkBack)
- Touch targets (44pt iOS / 48dp Android)
- WCAG AA contrast (4.5:1 text, 3:1 UI)
- Dynamic type support
- RTL layout support

**Performance:**
- 60fps animations (120fps on ProMotion)
- Efficient re-renders
- Tree-shaking support
- Code splitting capability

---

## Decision Criteria & Weights

### Criterion 1: Performance (25%)

**What to Measure:**
- TTI (Time to Interactive) - cold start, warm start
- FPS during scrolling/animations
- Bundle size impact (vs baseline)
- Memory usage
- Re-render efficiency

**Scoring (1-10):**
- 10: Better than baseline
- 8-9: Within 5% of baseline
- 6-7: Within 10% of baseline (target)
- 4-5: 10-15% over baseline
- 1-3: >15% over baseline

**Weight:** 25% (critical for mobile UX)

### Criterion 2: Developer Experience (20%)

**What to Evaluate:**
- Code clarity and readability
- TypeScript support quality
- Auto-complete effectiveness
- Lines of code for equivalent component
- Error messages quality
- Debugging experience

**Scoring (1-10):**
- 10: Excellent DX, intuitive API, great TypeScript
- 8-9: Good DX, clear patterns
- 6-7: Acceptable, some learning curve
- 4-5: Confusing API, poor docs
- 1-3: Difficult to use, many gotchas

**Weight:** 20% (affects development velocity)

### Criterion 3: Theming Flexibility (20%)

**What to Evaluate:**
- Token system depth (colors, typography, spacing, etc.)
- Dark mode implementation ease
- Custom theme creation
- Ease of mapping MobVibe tokens → library tokens
- Theme switching performance

**Scoring (1-10):**
- 10: Perfect token alignment, trivial mapping
- 8-9: Good token system, straightforward mapping
- 6-7: Adequate theming, some manual work
- 4-5: Limited theming, significant adaptation needed
- 1-3: Poor theming, major refactor required

**Weight:** 20% (design system consistency critical)

### Criterion 4: Web Viability (15%)

**What to Evaluate:**
- SSR (Server-Side Rendering) support
- Web performance vs native
- Cross-platform consistency (mobile ↔ web)
- Web-specific features (responsive, media queries)

**Scoring (1-10):**
- 10: Excellent web support, SSR ready
- 8-9: Good web support, minor differences
- 6-7: Basic web support, some gaps
- 4-5: Limited web support, significant differences
- 1-3: Poor or no web support

**Weight:** 15% (future-proofing for web version)

### Criterion 5: Migration Effort (20%)

**What to Evaluate:**
- Learning curve for team
- Documentation quality and completeness
- Community support (GitHub stars, Discord, Stack Overflow)
- Production case studies
- Breaking changes frequency
- Estimated team ramp-up time

**Scoring (1-10):**
- 10: Minimal learning curve, excellent docs, large community
- 8-9: Moderate curve, good docs, active community
- 6-7: Steeper curve, adequate docs, growing community
- 4-5: Difficult curve, poor docs, small community
- 1-3: Very difficult, sparse docs, minimal support

**Weight:** 20% (team velocity and long-term maintenance)

---

## PoC Scope

### Screens to Build (3 screens, both libraries)

**1. Login Screen**
- Email TextInput with label
- Primary button ("Continue with Email")
- Divider with "OR" text
- 3 OAuth buttons (Google, Apple, GitHub)
- Loading states
- Error states
- Dark mode variant

**2. Home/Welcome Screen**
- Hero text (large, bold)
- Subtitle (smaller, secondary color)
- 3 project cards:
  - Card with title, description, timestamp
  - Card with icon, status badge
  - Card with actions (Edit, Delete buttons)
- Empty state (no projects)
- Dark mode variant

**3. Code Tab (Simplified)**
- File tree list (3-5 items):
  - Folder icon
  - File icon
  - Nested items (indentation)
- Terminal output area (read-only)
- Syntax-highlighted code block
- ScrollView with good performance
- Dark mode variant

### Metrics to Capture

**Performance:**
- TTI (stopwatch from app launch to interactive)
- FPS (Performance Monitor during scrolling)
- Bundle size (npx expo export, measure dist/)
- Memory (iOS Instruments / Android Profiler)

**Code Quality:**
- Lines of code for Login screen
- TypeScript errors/warnings
- Build time
- Hot reload speed

**User Experience:**
- Visual consistency with design system
- Platform-native feel (iOS vs Android)
- Dark mode transition smoothness
- Accessibility (screen reader test)

---

## Success Criteria

**Phase 02 Complete When:**
- ✅ Both Tamagui AND gluestack UI PoCs built (3 screens each)
- ✅ Performance metrics captured for both
- ✅ Objective scoring completed (5 criteria)
- ✅ Decision documented in `docs/ui/FOUNDATION.md`
- ✅ Scoring table in `docs/ui/FOUNDATION-SCORING.md`
- ✅ Chosen library installed on main branch
- ✅ Initial config file created with MobVibe tokens

**Decision Must Include:**
- Winner announcement (Tamagui OR gluestack UI)
- Full scoring table with rationale per criterion
- Trade-offs and considerations
- Migration plan from PoC to production
- Rollback plan if decision proves wrong

---

## Risk Mitigation

**If scores are very close (within 5%):**
- Use tiebreaker: Team familiarity, community momentum, future roadmap
- Consider hybrid: Use winner as base, cherry-pick from loser

**If performance overhead too high (both >15% over baseline):**
- Document as blocker
- Consider staying with NativeWind only
- Escalate to stakeholders

**If learning curve too steep:**
- Allocate extra ramp-up time in Phase 04-05
- Plan for pair programming sessions
- Create internal training materials

---

## References from Phase 01

**Research Notes:**
- `/docs/research/01/notes.md` - Tamagui vs gluestack UI comparison
- gluestack UI: Better raw performance (98-100 vs 156-157)
- Tamagui: Compile-time optimization, web parity
- Both production-ready (2025)

**Component Inventory:**
- `/reports/ui/component-inventory.md`
- 3 existing components
- 12+ missing components
- ~20 hardcoded values to migrate

**Baseline Templates:**
- `/reports/ui/baseline-performance.json` (TTI, FPS, bundle, memory)
- `/reports/ui/baseline-a11y.json` (WCAG AA checklist)
- `/reports/ui/baseline-bundle-analysis.json` (dependencies, tree-shaking)

---

## Next Phase Dependencies

**Phase 03 Needs from Phase 02:**
- Selected library installed (`tamagui.config.ts` OR `gluestack.config.ts`)
- Decision rationale (informs token mapping approach)
- Performance baseline with chosen library

**Handover Artifacts:**
- `docs/ui/FOUNDATION.md` - Decision document
- `docs/ui/FOUNDATION-SCORING.md` - Objective scores
- Initial config file on main branch
- Performance measurements for chosen library

---

**Status:** Context bundle complete | Ready for PoC implementation
**Key Decision:** Tamagui (compile-time, web) vs gluestack UI (runtime, performance)
**Method:** Build both, measure objectively, document transparently
