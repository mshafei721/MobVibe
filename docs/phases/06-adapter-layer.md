# 06-adapter-layer.md
---
phase_id: 06
title: Adapter Layer Implementation
duration_estimate: "1 day"
incremental_value: Vendor lock-in prevention via adapter pattern
owners: [Senior Frontend Engineer]
dependencies: [05]
linked_phases_forward: [07]
docs_referenced: [UI Framework Plan]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
ui_requirements:
  framework_plan: ./../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["adapter pattern React Native", "dependency inversion UI frameworks", "vendor lock-in prevention patterns"]
    outputs: ["/docs/research/06/adapter-patterns.md"]
  - name: ContextCurator
    tool: context7
    scope: ["UI-FRAMEWORK-INTEGRATION-PLAN.md adapter section", "Phase 02-05 code"]
    outputs: ["/docs/context/06-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for creating adapter layer without breaking existing code"
    outputs: ["/docs/sequencing/06-adapter-implementation.md"]
acceptance_criteria:
  - Adapter layer created in src/ui/adapters/
  - Zero direct vendor imports outside adapters (verified by script)
  - Primitives refactored to use adapters
  - Adapter swap test passes (mock different vendor)
  - Documentation explains adapter pattern usage
---

## Objectives

1. **Prevent Vendor Lock-In** - Isolate vendor library imports to adapter layer
2. **Enable Future Migration** - Swap UI library by updating adapters only
3. **Validate Architecture** - Ensure primitives depend on abstractions, not implementations

## Scope

### In
- Create adapter interfaces/types
- Create adapter implementations for chosen library (Tamagui OR gluestack)
- Refactor primitives to use adapters instead of direct imports
- Create adapter audit script
- Document adapter pattern usage

### Out
- Alternative adapter implementations (only if time permits)
- Complex adapter features beyond basic primitives
- Performance optimization (Phase 10)

## Tasks

- [ ] **Use context7** to compile adapter design context:
  - Include: UI Framework Plan adapter requirements
  - Include: Phase 02-05 component implementations
  - Output: `/docs/context/06-context-bundle.md`

- [ ] **Use websearch** to research adapter patterns:
  - Query: "adapter pattern React Native best practices"
  - Query: "dependency inversion UI libraries"
  - Query: "preventing vendor lock-in mobile frameworks"
  - Output: `/docs/research/06/adapter-patterns.md`

- [ ] **Use sequentialthinking** to plan refactoring:
  - Identify: All direct vendor imports in primitives
  - Define: Adapter interfaces
  - Define: Refactoring steps (gradual, testable)
  - Output: `/docs/sequencing/06-adapter-implementation.md`

- [ ] **Create Adapter Interfaces**:
  ```typescript
  // src/ui/adapters/types.ts
  export interface UIAdapter {
    Box: React.ComponentType<BoxProps>
    Pressable: React.ComponentType<PressableProps>
    TextInput: React.ComponentType<TextInputProps>
    // ... core primitives needed
  }

  export interface ThemeAdapter {
    useTheme: () => Theme
    ThemeProvider: React.ComponentType<{ children: React.ReactNode }>
  }
  ```

- [ ] **Create Adapter Implementation for Chosen Library**:
  ```typescript
  // src/ui/adapters/tamagui/index.ts (if Tamagui chosen)
  // OR
  // src/ui/adapters/gluestack/index.ts (if gluestack chosen)

  import { Box as TamaguiBox, ... } from 'tamagui'
  // OR
  import { Box as GluestackBox, ... } from '@gluestack-ui/themed'

  export const uiAdapter: UIAdapter = {
    Box: TamaguiBox,  // Wrap if needed
    Pressable: /* ... */,
    // ...
  }
  ```

- [ ] **Create Adapter Facade**:
  ```typescript
  // src/ui/adapters/index.ts
  // Single import point for all adapter usage

  export { uiAdapter, themeAdapter } from './tamagui'
  // OR
  export { uiAdapter, themeAdapter } from './gluestack'

  // Usage in primitives:
  // import { uiAdapter } from '@/ui/adapters'
  // const { Box, Pressable } = uiAdapter
  ```

- [ ] **Refactor Primitives to Use Adapters**:
  - Refactor: Button.tsx → use `uiAdapter.Pressable`
  - Refactor: Card.tsx → use `uiAdapter.Box`
  - Refactor: All other primitives
  - Ensure: Zero direct vendor imports
  - Test: All primitive tests still pass

- [ ] **Create Adapter Audit Script**:
  ```bash
  # scripts/ui-audit-imports.sh
  # Check for direct vendor imports outside adapters/

  VIOLATIONS=$(grep -r "from 'tamagui'" src/ | grep -v "src/ui/adapters")
  # OR
  VIOLATIONS=$(grep -r "from '@gluestack-ui/themed'" src/ | grep -v "src/ui/adapters")

  if [ -n "$VIOLATIONS" ]; then
    echo "❌ Vendor imports found outside adapters:"
    echo "$VIOLATIONS"
    exit 1
  else
    echo "✅ Zero vendor leakage"
  fi
  ```

- [ ] **Create Adapter Swap Test** (prove pattern works):
  - Create: Mock adapter implementation
  - Test: Replace real adapter with mock
  - Verify: Primitives still render (with mock components)
  - Purpose: Prove adapter swap is possible

- [ ] **Document Adapter Pattern**:
  - Create: `docs/ui/ADAPTERS.md`
  - Explain: Why adapters are used
  - Explain: How to add new primitives
  - Explain: How to swap UI library
  - Include: Architecture diagram

- [ ] **Update links-map** and handover to Phase 07

## Artifacts & Paths

**Code:**
- `src/ui/adapters/types.ts` - Adapter interfaces
- `src/ui/adapters/tamagui/index.ts` OR `src/ui/adapters/gluestack/index.ts`
- `src/ui/adapters/index.ts` - Facade
- `src/ui/adapters/__tests__/mock-adapter.ts` - Test implementation
- Updated primitives (Button, Card, etc.)

**Scripts:**
- `scripts/ui-audit-imports.sh` - Import audit

**Docs:**
- `/docs/ui/ADAPTERS.md` ⭐ - Adapter pattern guide
- `/docs/research/06/adapter-patterns.md`
- `/docs/sequencing/06-adapter-implementation.md`

**Tests:**
- `src/ui/adapters/__tests__/adapter-swap.test.tsx`

## Testing

### Phase-Only Tests
- Adapter audit script passes (zero vendor leakage)
- All primitive tests still pass after refactoring
- Adapter swap test demonstrates swappability
- TypeScript compilation successful

### Cross-Phase Compatibility
- Phase 07 libraries will integrate via adapters
- Phase 08-09 screens use primitives (unaware of adapters)

### Test Commands
```bash
# Run adapter audit
npm run ui:audit-imports
# Expected: "✅ Zero vendor leakage"

# Run adapter swap test
npm test -- adapters/adapter-swap.test.tsx

# Verify primitives still work
npm test -- primitives/
npm run demo:gallery
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Adapter abstraction too leaky | Pattern fails | Keep adapters thin; accept some vendor-specific features |
| Performance overhead from wrapping | Medium | Measure in Phase 10; optimize if needed |
| TypeScript complexity increases | DX | Use type inference; minimize explicit types |
| Refactoring breaks primitives | High | Refactor incrementally; test after each component |

## References

- [UI Framework Plan](./../../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md) - Adapter requirements (Step 4)
- [Phase 05](./05-primitives-part2.md) - Primitives to refactor

## Handover

**Next Phase:** [07-library-integration.md](./07-library-integration.md) - Integrate Paper, Gifted Chat, Lottie

**Required Inputs Provided to Phase 07:**
- Working adapter layer
- Adapter audit script
- Pattern for integrating new libraries via adapters

---

**Status:** Ready after Phase 05
**Estimated Time:** 1 day
**Blocking Issues:** Requires Phase 05 primitives complete
