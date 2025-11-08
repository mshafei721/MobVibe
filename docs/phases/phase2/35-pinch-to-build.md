---
phase: 35
title: "Pinch to Build Gesture"
duration: 2 days
depends_on: [Phase 34]
subagents:
  websearch: true
  context7: true
  sequentialthinking: true
---

# Phase 35: Pinch to Build Gesture

**Duration:** 2 days
**Prerequisites:** Phase 34 complete
**Value Delivered:** Enable users to select UI elements via pinch gesture for instant AI modification

---

## Objectives

1. Implement multi-touch gesture recognition for element selection on mobile devices
2. Create seamless gesture-to-prompt workflow that captures element context
3. Resolve conflicts between custom gestures and native mobile scrolling/zooming

---

## Scope

### In Scope
- Two-finger pinch gesture detection on rendered UI elements
- Visual feedback during gesture (highlight/overlay on target element)
- Element metadata extraction (component type, props, styling)
- Auto-populate prompt with "Modify this [button/card/etc]..."
- iOS and Android gesture handling
- Gesture conflict resolution with native scroll/zoom

### Out of Scope
- Three-finger or complex multi-touch gestures
- Desktop hover/click-to-build (future enhancement)
- Gesture customization settings

---

## Tasks

### Day 1: Gesture Recognition & Element Selection
1. **Implement Gesture Detection**
   - Add `react-native-gesture-handler` for pinch detection
   - Configure gesture recognizer with sensitivity thresholds
   - Implement gesture state machine (began → changed → ended)
   - Add haptic feedback on successful element selection

2. **Element Selection System**
   - Create element registry for trackable UI components
   - Implement coordinate-to-component mapping
   - Build visual selection overlay with highlight animation
   - Extract component metadata (type, props, parent hierarchy)

### Day 2: Workflow Integration & Testing
3. **Gesture-to-Prompt Flow**
   - Auto-open prompt input on gesture completion
   - Pre-fill prompt with element context: "Modify this {type}..."
   - Attach element snapshot and code reference
   - Implement gesture cancellation (swipe away overlay)

4. **Testing & Validation**
   - Gesture conflict resolution (prevent zoom during pinch-to-build)
   - Test on iOS simulator and Android emulator
   - Verify gesture works in scrollable containers
   - Edge case testing (overlapping elements, nested components)

---

## Artifacts

**Code:**
- `app/gestures/PinchToSelectGesture.tsx` - Gesture handler component
- `app/gestures/ElementRegistry.ts` - Component tracking system
- `app/gestures/SelectionOverlay.tsx` - Visual selection feedback UI
- `app/hooks/usePinchToSelect.ts` - Hook for gesture detection
- `app/utils/elementExtractor.ts` - Metadata extraction utilities

**Documentation:**
- `docs/features/pinch-to-build.md` - User guide and technical spec

**Reports:**
- `docs/research/phase2/35/gesture-libraries.md` - Gesture library comparison
- `docs/context/phase2/35-bundle.md` - RN gesture handler specs
- `docs/sequencing/phase2/35-steps.md` - Implementation sequence

---

## Testing Requirements

### Phase-Isolated Tests
- ✅ **Gesture Recognition**: Pinch detected within 100ms, <5% false positives
- ✅ **Element Selection**: Correct component identified 95%+ accuracy
- ✅ **Visual Feedback**: Overlay renders within 16ms (60fps)
- ✅ **Metadata Extraction**: Complete component props captured

### Cross-Phase Integration Tests
- ✅ Integration with Phase 24 (Voice Input) - gesture + voice combined
- ✅ Integration with Phase 23 (WebView Preview) - gesture on preview elements
- ✅ No regression in native scrolling performance

### Acceptance Criteria
- [ ] Pinch gesture selects UI element with visual confirmation
- [ ] Prompt auto-opens with element context pre-filled
- [ ] Works on both iOS and Android without conflicts
- [ ] Native scroll/zoom gestures remain functional
- [ ] Gesture can be cancelled without triggering selection

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Gesture conflicts with native scrolling | High | High | Implement gesture priority system, require 300ms hold before activation |
| Performance degradation from coordinate tracking | Medium | Medium | Use virtualization, only track visible elements |
| Inconsistent behavior across iOS/Android | Medium | High | Platform-specific gesture thresholds, extensive cross-platform testing |
| False positives on unintended gestures | Medium | Medium | Add minimum pinch distance threshold, require deliberate gesture |

---

## References

**Documentation:**
- [Architecture](../../../.docs/architecture.md)
- [Implementation](../../../.docs/implementation.md)
- [Features & Journeys](../../../.docs/features-and-journeys.md)

**MCP Research:**
- `/docs/research/phase2/35/gesture-libraries.md` - react-native-gesture-handler vs alternatives
- `/docs/context/phase2/35-bundle.md` - Gesture handler API specs
- `/docs/sequencing/phase2/35-steps.md` - Step-by-step implementation plan

**Related Phases:**
- Phase 24: Voice Input (gesture + voice combination)
- Phase 23: WebView Preview (gesture on preview elements)
- Phase 36: Voice Input Improvements (multimodal interaction)

---

## Handover

**To Next Phase (36):**
- Gesture system ready for multimodal input (gesture + continuous voice)
- Element selection API available for other interaction methods
- Visual feedback system reusable for voice-triggered selections

**Open Items:**
- Desktop/web gesture alternative (click-to-select) - Phase 3
- Custom gesture configuration settings - Phase 3

---

**Phase Status:** Ready for execution
**Last Updated:** 2025-11-08
