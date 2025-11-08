# 03-token-system-design.md
---
phase_id: 03
title: Token System Design
duration_estimate: "1 day"
incremental_value: Unified design token system as single source of truth
owners: [Frontend Engineer, Designer]
dependencies: [02]
linked_phases_forward: [04]
docs_referenced: [Design System, UI Framework Plan]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
ui_requirements:
  framework_plan: ./../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md
  design_system: ./../.docs/design-system.md
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["design token system best practices 2025", "Figma tokens to code workflow", "mobile app design tokens structure"]
    outputs: ["/docs/research/03/token-best-practices.md"]
  - name: ContextCurator
    tool: context7
    scope: ["design-system.md", "Phase 02 chosen library config"]
    outputs: ["/docs/context/03-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for migrating current tokens to unified system"
    outputs: ["/docs/sequencing/03-token-migration.md"]
acceptance_criteria:
  - Single token file src/ui/tokens.ts + JSON export
  - Zero token conflicts (verified by audit script)
  - All tokens mapped to chosen UI library config
  - Dark mode tokens defined and working
  - Test app demonstrates all tokens
---

## Objectives

1. **Consolidate Tokens** - Merge `constants/colors.ts`, `constants/typography.ts`, `constants/spacing.ts` into single system
2. **Map to Framework** - Integrate tokens with chosen UI library (Tamagui OR gluestack)
3. **Single Source of Truth** - Eliminate duplicate/conflicting token definitions

## Scope

### In
- Create unified token system: colors, typography, spacing, motion, elevation
- Map tokens to chosen UI library configuration
- Define light + dark mode tokens
- Export tokens as TypeScript + JSON
- Build token demo app for validation
- Migrate existing `constants/` to new system

### Out
- Component migration (happens in Phase 04-05)
- Screen refactoring (Phase 08-09)
- Icon/asset token integration (later)

## Tasks

- [ ] **Use context7** to compile token design context:
  - Include: Current design-system.md tokens
  - Include: Phase 02 chosen library's token structure
  - Output: `/docs/context/03-context-bundle.md`

- [ ] **Use websearch** to research token best practices:
  - Query: "design token system best practices 2025"
  - Query: "Figma tokens to code React Native"
  - Query: "mobile app semantic color tokens"
  - Output: `/docs/research/03/token-best-practices.md`

- [ ] **Use sequentialthinking** to plan token migration:
  - Map: Current constants/ files → new structure
  - Define: Token naming convention
  - Identify: Conflicts and resolution strategy
  - Output: `/docs/sequencing/03-token-migration.md`

- [ ] **Define Token Structure**:
  ```typescript
  // src/ui/tokens.ts
  export const tokens = {
    colors: {
      brand: {
        primary: '#2196F3',
        secondary: '#9C27B0',
        // ...
      },
      semantic: {
        success: '#4CAF50',
        error: '#F44336',
        // ...
      },
      neutral: {
        // 10 shades
      },
    },
    typography: {
      fontFamily: {
        ios: 'SF Pro',
        android: 'Roboto',
        // ...
      },
      fontSize: {
        xs: 12,
        sm: 14,
        // ...
      },
      lineHeight: {
        // ...
      },
    },
    spacing: {
      0: 0,
      1: 4,
      2: 8,
      // ... (8px base)
    },
    radius: {
      sm: 4,
      base: 8,
      // ...
    },
    motion: {
      duration: {
        fast: 200,
        normal: 300,
        // ...
      },
      easing: {
        // ...
      },
    },
    elevation: {
      // iOS shadows, Android elevation
    },
  }
  ```

- [ ] **Create Token Files**:
  - Create: `src/ui/tokens.ts` (TypeScript source)
  - Create: `src/ui/tokens.json` (JSON export for tooling)
  - Define: Light mode as default
  - Define: Dark mode tokens in separate object

- [ ] **Map to Chosen UI Library**:
  - Update: `tamagui.config.ts` OR `gluestack.config.ts`
  - Import: `import { tokens } from './src/ui/tokens'`
  - Map: MobVibe tokens → library's token structure
  - Example (Tamagui):
    ```typescript
    import { tokens } from './src/ui/tokens'
    export default createTamagui({
      tokens: {
        color: tokens.colors,
        space: tokens.spacing,
        // ...
      },
    })
    ```

- [ ] **Build Token Demo App**:
  - Create: `src/ui/__demo__/TokenDemo.tsx`
  - Display: All colors in grid
  - Display: Typography scale
  - Display: Spacing scale
  - Display: Motion/elevation examples
  - Support: Light/dark mode toggle
  - Save screenshot: `reports/ui/token-demo.png`

- [ ] **Create Token Audit Script**:
  - Script: `scripts/ui-audit-tokens.sh`
  - Check: No hardcoded colors outside tokens
  - Check: No duplicate token definitions
  - Check: All tokens used in at least one component
  - Output: `reports/ui/token-audit-results.md`

- [ ] **Migrate Existing Constants**:
  - Map: `constants/colors.ts` → `src/ui/tokens.ts`
  - Map: `constants/typography.ts` → `src/ui/tokens.ts`
  - Map: `constants/spacing.ts` → `src/ui/tokens.ts`
  - Update: All imports in existing components (if any)
  - Remove: Old `constants/` files (after verification)

- [ ] **Update links-map** with token artifacts and Phase 04 dependency

- [ ] **Create ADR** for token system structure and naming conventions

## Artifacts & Paths

**Code:**
- `src/ui/tokens.ts` ⭐ - Unified token system (TypeScript)
- `src/ui/tokens.json` - JSON export for tooling
- `src/ui/__demo__/TokenDemo.tsx` - Visual token validation app
- `tamagui.config.ts` OR `gluestack.config.ts` - Updated with token mapping

**Docs:**
- `/docs/context/03-context-bundle.md` - Token design context
- `/docs/research/03/token-best-practices.md` - Industry best practices
- `/docs/sequencing/03-token-migration.md` - Migration plan
- `/docs/ui/THEMING.md` (start) - Token usage guide

**Scripts:**
- `scripts/ui-audit-tokens.sh` - Token conflict detection

**Reports:**
- `reports/ui/token-demo.png` - Visual token showcase
- `reports/ui/token-audit-results.md` - Audit findings

## Testing

### Phase-Only Tests
- Token demo app runs without errors
- Light/dark mode toggle works
- Audit script passes (zero conflicts)
- All existing components still work (if any updated)
- TypeScript types resolve correctly

### Cross-Phase Compatibility
- Phase 02 library config successfully uses tokens
- Phase 04 components will consume these tokens

### Test Commands
```bash
# Run token audit
npm run ui:audit-tokens

# Expected output: "✅ Zero token conflicts"
# Expected output: "✅ Zero hardcoded colors outside tokens"

# Verify token files exist
test -f src/ui/tokens.ts
test -f src/ui/tokens.json

# Verify demo app runs
npm run demo:tokens  # Should open demo app

# Verify TypeScript compilation
npx tsc --noEmit src/ui/tokens.ts
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token naming conflicts with library | Integration breaks | Use namespaced tokens: `mobvibe.colors.primary` |
| Dark mode tokens incomplete | Visual issues | Start with light mode; add dark mode incrementally |
| Migration breaks existing components | Medium | Keep old constants/ temporarily; migrate gradually |
| Too many token variants (design bikeshedding) | Timeline | Limit to essential tokens; expand later |

## References

- [Design System](./../../.docs/design-system.md) - Current token definitions
- [UI Framework Plan](./../../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md) - Token system requirements
- [Phase 02](./02-foundation-decision.md) - Chosen library configuration

## Handover

**Next Phase:** [04-primitives-part1.md](./04-primitives-part1.md) - Build core primitives (Button, Text, Input)

**Required Inputs Provided to Phase 04:**
- `src/ui/tokens.ts` - Single source of truth for design tokens
- Token audit script passing
- Working token demo app for reference

**Phase 04 Depends On:**
- Unified token system for component styling
- Library config updated with tokens

---

**Status:** Ready for execution after Phase 02
**Estimated Time:** 1 working day (8 hours)
**Blocking Issues:** Requires Phase 02 library selection
