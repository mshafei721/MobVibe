# 07-library-integration.md
---
phase_id: 07
title: Selective Library Integration (Paper, Gifted Chat, Lottie)
duration_estimate: "1.5 days"
incremental_value: Cherry-picked specialized components via adapter pattern
owners: [Frontend Engineer]
dependencies: [06]
linked_phases_forward: [08]
docs_referenced: [UI Framework Plan]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
ui_requirements:
  framework_plan: ./../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["React Native Paper theming 2025", "Gifted Chat customization", "Lottie React Native performance"]
    outputs: ["/docs/research/07/library-integration.md"]
  - name: ContextCurator
    tool: context7
    scope: ["Phase 06 adapter pattern", "UI-FRAMEWORK-INTEGRATION-PLAN.md selective libraries"]
    outputs: ["/docs/context/07-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for integrating libraries via adapters without conflicts"
    outputs: ["/docs/sequencing/07-integration-steps.md"]
acceptance_criteria:
  - React Native Paper integrated (Android-forward screens only)
  - Gifted Chat integrated with token theming
  - Lottie integrated via centralized Animation component
  - All integrations use adapter pattern
  - No duplicate primitives (verified by audit)
  - Performance within budget (bundle size checked)
---

## Objectives

1. **Add Specialized Components** - Integrate Paper, Gifted Chat, Lottie for specific use cases
2. **Maintain Adapter Pattern** - All integrations via adapters, zero direct imports
3. **Control Bundle Size** - Cherry-pick only needed components, tree-shake unused

## Scope

### In
- React Native Paper (Material Design components for Android-forward screens)
- Gifted Chat (Chat UI for future features)
- Lottie (Vector animations for loading/success states)
- Adapter wrappers for each library
- Token theme mapping

### Out
- Other UI libraries (UI Kitten, Elements - only if critical gaps)
- Full Paper/Chat feature set (only essential components)
- Complex animations (simple Lottie only)

## Tasks

- [ ] **Use context7** to compile integration context:
  - Include: Phase 06 adapter patterns
  - Include: Selective library strategy from UI Framework Plan
  - Output: `/docs/context/07-context-bundle.md`

- [ ] **Use websearch** to research integrations:
  - Query: "React Native Paper theming with custom tokens 2025"
  - Query: "Gifted Chat customization and performance"
  - Query: "Lottie React Native best practices"
  - Output: `/docs/research/07/library-integration.md`

- [ ] **Use sequentialthinking** to plan integration:
  - Define: Which components from each library
  - Define: Adapter structure per library
  - Define: Theme mapping strategy
  - Output: `/docs/sequencing/07-integration-steps.md`

- [ ] **Integrate React Native Paper**:
  - Install: `npm install react-native-paper`
  - Create adapter: `src/ui/adapters/paper/index.ts`
  - Map tokens to Paper theme:
    ```typescript
    import { MD3LightTheme, configureFonts } from 'react-native-paper'
    import { tokens } from '../../tokens'

    export const paperTheme = {
      ...MD3LightTheme,
      colors: {
        primary: tokens.colors.brand.primary,
        // ... map tokens
      },
    }
    ```
  - Wrap selective components (FAB, Chip, Badge, ProgressBar)
  - Export via adapter: `src/ui/adapters/index.ts`

- [ ] **Integrate Gifted Chat**:
  - Install: `npm install react-native-gifted-chat`
  - Create wrapper: `src/ui/components/Chat.tsx` (wraps Gifted Chat)
  - Apply token theming:
    ```typescript
    <GiftedChat
      theme={{
        colors: {
          primary: tokens.colors.brand.primary,
          // ...
        },
      }}
    />
    ```
  - Adapter: `src/ui/adapters/gifted-chat/index.ts`

- [ ] **Integrate Lottie**:
  - Install: `npm install lottie-react-native`
  - Create centralized component: `src/ui/components/Animation.tsx`
    ```typescript
    export const Animation: React.FC<{
      source: AnimationObject
      autoPlay?: boolean
      loop?: boolean
      accessibilityLabel?: string
    }> = ({ ... }) => {
      // Respect reduced motion preference
      const prefersReducedMotion = useReducedMotion()

      return (
        <LottieView
          source={source}
          autoPlay={!prefersReducedMotion && autoPlay}
          loop={loop}
          // ...
        />
      )
    }
    ```
  - Add sample animations (loading, success, error)
  - Adapter: `src/ui/adapters/lottie/index.ts`

- [ ] **Prevent Duplicate Primitives**:
  - Audit: Ensure Paper components don't duplicate existing primitives
  - Strategy: Use Paper only where Material Design required (Android-specific)
  - Export: Only non-duplicate components from Paper adapter

- [ ] **Update Bundle Analysis**:
  - Run: `npx expo export && npx react-native-bundle-visualizer`
  - Check: Bundle size increase ≤ 10% from baseline
  - Identify: Unused modules to tree-shake
  - Save: `reports/ui/phase-07-bundle-analysis.json`

- [ ] **Create Integration Demo**:
  - Demo: Paper components (FAB, Chip, Badge)
  - Demo: Gifted Chat (simple conversation)
  - Demo: Lottie animations (loading, success)
  - Screenshot: `reports/ui/library-integration-demo.png`

- [ ] **Update ADAPTERS.md**:
  - Document: How to integrate new libraries
  - Include: Paper, Gifted Chat, Lottie examples
  - Include: Tree-shaking guidance

- [ ] **Update links-map** and handover to Phase 08

## Artifacts & Paths

**Code:**
- `src/ui/adapters/paper/index.ts` - Paper adapter
- `src/ui/adapters/gifted-chat/index.ts` - Chat adapter
- `src/ui/adapters/lottie/index.ts` - Lottie adapter
- `src/ui/components/Chat.tsx` - Chat wrapper
- `src/ui/components/Animation.tsx` - Lottie wrapper
- Updated `src/ui/adapters/index.ts`

**Assets:**
- `assets/animations/loading.json` - Loading animation
- `assets/animations/success.json` - Success animation
- `assets/animations/error.json` - Error animation

**Docs:**
- `/docs/ui/ADAPTERS.md` (updated)
- `/docs/research/07/library-integration.md`
- `/docs/sequencing/07-integration-steps.md`

**Reports:**
- `reports/ui/phase-07-bundle-analysis.json`
- `reports/ui/library-integration-demo.png`

## Testing

### Phase-Only Tests
- Adapter audit passes (zero vendor leakage)
- Bundle size within budget (≤ +10%)
- Integration demo runs without errors
- No duplicate primitive violations

### Cross-Phase Compatibility
- Phase 08-09 screens can use Paper/Chat/Lottie via adapters
- No conflicts with existing primitives

### Test Commands
```bash
npm run ui:audit-imports  # Zero leakage
npm run ui:audit-duplicates  # Zero duplicates
npm test -- adapters/
npm run bundle:analyze  # Check size
npm run demo:integrations
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Bundle size exceeds budget | Performance | Tree-shake aggressively; consider lazy loading |
| Paper conflicts with primitives | Complexity | Use Paper only for Android-specific screens |
| Gifted Chat customization limited | UX | Accept limitations; build custom chat if needed later |
| Lottie animations janky | UX | Test on low-end devices; simplify animations |

## References

- [UI Framework Plan](./../../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md) - Selective libraries (Step 5)
- [Phase 06](./06-adapter-layer.md) - Adapter pattern

## Handover

**Next Phase:** [08-screen-refactor-auth-home.md](./08-screen-refactor-auth-home.md) - Refactor Auth + Home screens

**Required Inputs Provided to Phase 08:**
- Complete library integrations via adapters
- Animation component for loading states
- Chat component (if needed for home screen features)

---

**Status:** Ready after Phase 06
**Estimated Time:** 1.5 days
**Blocking Issues:** Requires Phase 06 adapter layer
