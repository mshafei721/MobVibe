# 52-onboarding-tips.md
---
phase_id: 52
title: Onboarding Tutorial & Tips
duration_estimate: "2 days"
incremental_value: Interactive tutorial and contextual tips for new users
owners: [Frontend Engineer, UX Designer]
dependencies: [51]
linked_phases_forward: [53]
docs_referenced: [Features & Journeys]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: ContextCurator
    tool: context7
    scope: ["React Native onboarding patterns", "tutorial UI libraries"]
    outputs: ["/docs/context/phase2/52-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for onboarding tutorial with progress tracking"
    outputs: ["/docs/sequencing/phase2/52-onboarding-steps.md"]
acceptance_criteria:
  - Interactive tutorial completes in under 60 seconds
  - Contextual in-app tips appear at relevant moments
  - Tutorial progress tracked and resumable
  - Users can skip tutorial
  - Users can replay tutorial from settings
  - Tips dismissible and never show again option
  - Tutorial completion rate over 80%
---

## Objectives

1. **Quick Interactive Tutorial** - Under 60s walkthrough of core features
2. **Contextual Tips** - Smart tips appear when relevant
3. **Progress Tracking** - Resume tutorial, track completion

## Scope

### In
- Interactive tutorial flow (5-7 steps)
- Spotlight/overlay tutorial UI
- Contextual in-app tips
- Tutorial progress tracking
- Skip & resume functionality
- Replay from settings
- Tutorial completion analytics
- Haptic feedback integration

### Out
- Video tutorials
- External documentation links
- Advanced tooltips library
- Multi-language support (later phase)

## Tasks

- [ ] **Use context7** to research onboarding patterns
- [ ] **Use sequentialthinking** to plan tutorial flow

- [ ] **Create Tutorial Types** (`app/lib/onboarding/types.ts`):
  ```typescript
  export type TutorialStep =
    | 'welcome'           // Welcome screen
    | 'create_project'    // Create your first project
    | 'voice_input'       // Try voice input
    | 'preview'           // Preview your app
    | 'pinch_to_build'    // Pinch to modify elements
    | 'complete'          // Tutorial complete

  export interface TutorialState {
    completed: boolean
    currentStep: TutorialStep | null
    skipped: boolean
    lastShownAt: number
  }

  export type TipType =
    | 'first_project'     // First project creation tip
    | 'voice_hint'        // Voice input suggestion
    | 'preview_hint'      // Preview interaction tip
    | 'history_hint'      // Session history tip
    | 'settings_hint'     // Settings location tip

  export interface TipState {
    [key: string]: {
      shown: boolean
      dismissed: boolean
      showCount: number
    }
  }
  ```

- [ ] **Create Tutorial Service** (`app/lib/onboarding/TutorialService.ts`):
  ```typescript
  import AsyncStorage from '@react-native-async-storage/async-storage'
  import { TutorialState, TutorialStep, TipState, TipType } from './types'

  const TUTORIAL_KEY = '@mobvibe_tutorial_state'
  const TIPS_KEY = '@mobvibe_tips_state'

  class TutorialService {
    private tutorialState: TutorialState = {
      completed: false,
      currentStep: null,
      skipped: false,
      lastShownAt: 0,
    }

    private tipsState: TipState = {}

    async initialize() {
      try {
        const [tutorial, tips] = await Promise.all([
          AsyncStorage.getItem(TUTORIAL_KEY),
          AsyncStorage.getItem(TIPS_KEY),
        ])

        if (tutorial) {
          this.tutorialState = JSON.parse(tutorial)
        }
        if (tips) {
          this.tipsState = JSON.parse(tips)
        }
      } catch (error) {
        console.error('Failed to load tutorial state:', error)
      }
    }

    shouldShowTutorial(): boolean {
      return !this.tutorialState.completed && !this.tutorialState.skipped
    }

    async startTutorial() {
      this.tutorialState.currentStep = 'welcome'
      this.tutorialState.lastShownAt = Date.now()
      await this.saveTutorialState()
    }

    async advanceStep(step: TutorialStep) {
      this.tutorialState.currentStep = step
      if (step === 'complete') {
        this.tutorialState.completed = true
      }
      await this.saveTutorialState()
    }

    async skipTutorial() {
      this.tutorialState.skipped = true
      this.tutorialState.currentStep = null
      await this.saveTutorialState()
    }

    async resetTutorial() {
      this.tutorialState = {
        completed: false,
        currentStep: null,
        skipped: false,
        lastShownAt: 0,
      }
      await this.saveTutorialState()
    }

    getTutorialState(): TutorialState {
      return { ...this.tutorialState }
    }

    // Tips Management
    shouldShowTip(type: TipType): boolean {
      const tip = this.tipsState[type]
      if (!tip) return true // First time

      if (tip.dismissed) return false

      // Show max 3 times
      return tip.showCount < 3
    }

    async recordTipShown(type: TipType) {
      if (!this.tipsState[type]) {
        this.tipsState[type] = { shown: true, dismissed: false, showCount: 1 }
      } else {
        this.tipsState[type].shown = true
        this.tipsState[type].showCount++
      }
      await this.saveTipsState()
    }

    async dismissTip(type: TipType, forever: boolean = false) {
      if (!this.tipsState[type]) {
        this.tipsState[type] = { shown: true, dismissed: false, showCount: 0 }
      }

      if (forever) {
        this.tipsState[type].dismissed = true
      }
      await this.saveTipsState()
    }

    private async saveTutorialState() {
      try {
        await AsyncStorage.setItem(TUTORIAL_KEY, JSON.stringify(this.tutorialState))
      } catch (error) {
        console.error('Failed to save tutorial state:', error)
      }
    }

    private async saveTipsState() {
      try {
        await AsyncStorage.setItem(TIPS_KEY, JSON.stringify(this.tipsState))
      } catch (error) {
        console.error('Failed to save tips state:', error)
      }
    }
  }

  export const tutorialService = new TutorialService()
  ```

- [ ] **Create Tutorial Overlay Component** (`app/components/onboarding/TutorialOverlay.tsx`):
  ```typescript
  import React, { useState } from 'react'
  import { View, Text, TouchableOpacity, Modal } from 'react-native'
  import { BlurView } from 'expo-blur'
  import { useHaptics } from '@/lib/haptics/useHaptics'
  import { tutorialService } from '@/lib/onboarding/TutorialService'
  import { TutorialStep } from '@/lib/onboarding/types'

  interface TutorialOverlayProps {
    visible: boolean
    currentStep: TutorialStep
    onNext: () => void
    onSkip: () => void
  }

  const TUTORIAL_CONTENT: Record<TutorialStep, {
    title: string
    description: string
    actionText: string
  }> = {
    welcome: {
      title: 'Welcome to MobVibe!',
      description: 'Build mobile apps with AI in seconds. Let\'s take a quick tour.',
      actionText: 'Get Started',
    },
    create_project: {
      title: 'Create Your First App',
      description: 'Tap the + button to start. Describe what you want to build.',
      actionText: 'Next',
    },
    voice_input: {
      title: 'Use Your Voice',
      description: 'Press and hold the mic to describe your app. It\'s faster than typing!',
      actionText: 'Next',
    },
    preview: {
      title: 'Live Preview',
      description: 'See your app update in real-time as Claude builds it.',
      actionText: 'Next',
    },
    pinch_to_build: {
      title: 'Pinch to Modify',
      description: 'Pinch any element in the preview to ask Claude to change it.',
      actionText: 'Next',
    },
    complete: {
      title: 'You\'re All Set!',
      description: 'Start building amazing apps. Have fun!',
      actionText: 'Start Building',
    },
  }

  export function TutorialOverlay({
    visible,
    currentStep,
    onNext,
    onSkip,
  }: TutorialOverlayProps) {
    const { trigger } = useHaptics()
    const content = TUTORIAL_CONTENT[currentStep]

    const handleNext = () => {
      trigger('select')
      onNext()
    }

    const handleSkip = () => {
      trigger('tap')
      onSkip()
    }

    if (!visible || !content) return null

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
      >
        <BlurView intensity={80} className="flex-1">
          <View className="flex-1 justify-center items-center p-6">
            {/* Tutorial Card */}
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-lg">
              <Text className="text-2xl font-bold mb-4 dark:text-white">
                {content.title}
              </Text>
              <Text className="text-base text-gray-600 dark:text-gray-300 mb-6">
                {content.description}
              </Text>

              {/* Progress Dots */}
              <View className="flex-row justify-center mb-6 gap-2">
                {Object.keys(TUTORIAL_CONTENT).map((step, index) => (
                  <View
                    key={step}
                    className={`w-2 h-2 rounded-full ${
                      step === currentStep
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </View>

              {/* Actions */}
              <View className="flex-row gap-3">
                {currentStep !== 'complete' && (
                  <TouchableOpacity
                    onPress={handleSkip}
                    className="flex-1 py-3 rounded-lg bg-gray-200 dark:bg-gray-700"
                  >
                    <Text className="text-center font-semibold dark:text-white">
                      Skip
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleNext}
                  className={`py-3 rounded-lg bg-blue-500 ${
                    currentStep === 'complete' ? 'flex-1' : 'flex-1'
                  }`}
                >
                  <Text className="text-center font-semibold text-white">
                    {content.actionText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
    )
  }
  ```

- [ ] **Create Contextual Tip Component** (`app/components/onboarding/ContextualTip.tsx`):
  ```typescript
  import React, { useEffect } from 'react'
  import { View, Text, TouchableOpacity, Animated } from 'react-native'
  import { tutorialService } from '@/lib/onboarding/TutorialService'
  import { TipType } from '@/lib/onboarding/types'
  import { useHaptics } from '@/lib/haptics/useHaptics'

  interface ContextualTipProps {
    type: TipType
    title: string
    message: string
    position?: 'top' | 'bottom'
  }

  export function ContextualTip({
    type,
    title,
    message,
    position = 'bottom',
  }: ContextualTipProps) {
    const { trigger } = useHaptics()
    const [visible, setVisible] = React.useState(false)
    const slideAnim = React.useRef(new Animated.Value(0)).current

    useEffect(() => {
      const shouldShow = tutorialService.shouldShowTip(type)
      if (shouldShow) {
        setVisible(true)
        tutorialService.recordTipShown(type)

        // Slide in animation
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start()

        trigger('select')
      }
    }, [type])

    const handleDismiss = async (forever: boolean) => {
      await tutorialService.dismissTip(type, forever)

      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setVisible(false))

      trigger('tap')
    }

    if (!visible) return null

    const translateY = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: position === 'bottom' ? [100, 0] : [-100, 0],
    })

    return (
      <Animated.View
        style={{ transform: [{ translateY }] }}
        className={`absolute left-4 right-4 ${
          position === 'bottom' ? 'bottom-20' : 'top-20'
        } bg-blue-500 rounded-lg p-4 shadow-lg`}
      >
        <Text className="text-white font-semibold text-base mb-1">
          {title}
        </Text>
        <Text className="text-white text-sm mb-3">
          {message}
        </Text>
        <View className="flex-row justify-end gap-3">
          <TouchableOpacity onPress={() => handleDismiss(true)}>
            <Text className="text-white font-semibold">Don't show again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDismiss(false)}>
            <Text className="text-white font-semibold">Got it</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    )
  }
  ```

- [ ] **Create Tutorial Hook** (`app/lib/onboarding/useTutorial.ts`):
  ```typescript
  import { useState, useEffect } from 'react'
  import { tutorialService } from './TutorialService'
  import { TutorialStep } from './types'

  export function useTutorial() {
    const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null)
    const [showTutorial, setShowTutorial] = useState(false)

    useEffect(() => {
      checkTutorial()
    }, [])

    const checkTutorial = async () => {
      const shouldShow = tutorialService.shouldShowTutorial()
      if (shouldShow) {
        await tutorialService.startTutorial()
        const state = tutorialService.getTutorialState()
        setCurrentStep(state.currentStep)
        setShowTutorial(true)
      }
    }

    const nextStep = async () => {
      const steps: TutorialStep[] = [
        'welcome',
        'create_project',
        'voice_input',
        'preview',
        'pinch_to_build',
        'complete',
      ]

      const currentIndex = currentStep ? steps.indexOf(currentStep) : -1
      const nextIndex = currentIndex + 1

      if (nextIndex < steps.length) {
        const next = steps[nextIndex]
        await tutorialService.advanceStep(next)
        setCurrentStep(next)

        if (next === 'complete') {
          setTimeout(() => {
            setShowTutorial(false)
          }, 2000)
        }
      }
    }

    const skipTutorial = async () => {
      await tutorialService.skipTutorial()
      setShowTutorial(false)
      setCurrentStep(null)
    }

    const replayTutorial = async () => {
      await tutorialService.resetTutorial()
      await checkTutorial()
    }

    return {
      showTutorial,
      currentStep,
      nextStep,
      skipTutorial,
      replayTutorial,
    }
  }
  ```

- [ ] **Integrate Tutorial in App** (`app/_layout.tsx`):
  ```typescript
  import { tutorialService } from '@/lib/onboarding/TutorialService'
  import { TutorialOverlay } from '@/components/onboarding/TutorialOverlay'
  import { useTutorial } from '@/lib/onboarding/useTutorial'

  export default function RootLayout() {
    const { showTutorial, currentStep, nextStep, skipTutorial } = useTutorial()

    useEffect(() => {
      tutorialService.initialize()
    }, [])

    return (
      <>
        <Stack />
        {showTutorial && currentStep && (
          <TutorialOverlay
            visible={showTutorial}
            currentStep={currentStep}
            onNext={nextStep}
            onSkip={skipTutorial}
          />
        )}
      </>
    )
  }
  ```

- [ ] **Add Contextual Tips to Screens**:
  ```typescript
  // app/screens/Home.tsx
  import { ContextualTip } from '@/components/onboarding/ContextualTip'

  export function HomeScreen() {
    return (
      <View>
        {/* ... rest of screen */}
        <ContextualTip
          type="first_project"
          title="Create Your First App"
          message="Tap the + button to start building with AI"
        />
      </View>
    )
  }

  // app/components/VoiceInput.tsx
  <ContextualTip
    type="voice_hint"
    title="Try Voice Input"
    message="Press and hold to describe what you want to build"
    position="top"
  />

  // app/screens/CodingSession.tsx
  <ContextualTip
    type="preview_hint"
    title="Live Preview"
    message="Your app updates in real-time as Claude builds it"
  />
  ```

- [ ] **Add Tutorial Replay to Settings** (`app/screens/Settings.tsx`):
  ```typescript
  import { useTutorial } from '@/lib/onboarding/useTutorial'

  export function SettingsScreen() {
    const { replayTutorial } = useTutorial()

    return (
      <View className="p-4">
        {/* ... other settings */}
        <TouchableOpacity
          onPress={replayTutorial}
          className="py-4 border-b border-gray-200 dark:border-gray-700"
        >
          <Text className="text-base dark:text-white">Replay Tutorial</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            See the app walkthrough again
          </Text>
        </TouchableOpacity>
      </View>
    )
  }
  ```

- [ ] **Track Tutorial Analytics** (`app/lib/analytics/events.ts`):
  ```typescript
  export function trackTutorial(event: 'started' | 'completed' | 'skipped' | 'step', step?: string) {
    analytics.track('tutorial', { event, step, timestamp: Date.now() })
  }

  // Usage in tutorial flow
  tutorialService.startTutorial().then(() => trackTutorial('started'))
  tutorialService.skipTutorial().then(() => trackTutorial('skipped'))
  tutorialService.advanceStep(step).then(() => trackTutorial('step', step))
  ```

- [ ] **Create Integration Tests**:
  ```typescript
  // tests/frontend/onboarding.test.ts
  describe('Onboarding Tutorial', () => {
    it('shows tutorial on first launch', async () => {
      const { getByText } = render(<App />)

      await waitFor(() => {
        expect(getByText('Welcome to MobVibe!')).toBeTruthy()
      })
    })

    it('advances through all steps', async () => {
      const { getByText } = render(<TutorialOverlay {...props} />)

      fireEvent.press(getByText('Get Started'))
      await waitFor(() => {
        expect(getByText('Create Your First App')).toBeTruthy()
      })
    })

    it('skips tutorial', async () => {
      const onSkip = jest.fn()
      const { getByText } = render(<TutorialOverlay {...props} onSkip={onSkip} />)

      fireEvent.press(getByText('Skip'))
      expect(onSkip).toHaveBeenCalled()
    })

    it('does not show tutorial after completion', async () => {
      await tutorialService.advanceStep('complete')

      const shouldShow = tutorialService.shouldShowTutorial()
      expect(shouldShow).toBe(false)
    })
  })
  ```

- [ ] **Document Tutorial System** (`docs/frontend/ONBOARDING.md`)

- [ ] **Update links-map**

## Artifacts & Paths

**Onboarding System:**
- `app/lib/onboarding/types.ts`
- `app/lib/onboarding/TutorialService.ts`
- `app/lib/onboarding/useTutorial.ts`
- `app/components/onboarding/TutorialOverlay.tsx`
- `app/components/onboarding/ContextualTip.tsx`

**Tests:**
- `tests/frontend/onboarding.test.ts`

**Docs:**
- `docs/frontend/ONBOARDING.md` ⭐

## Testing

### Phase-Only Tests
- Tutorial shows on first launch
- All steps advance correctly
- Skip functionality works
- Tutorial completion persists
- Contextual tips appear at right time
- Tips dismissible and respect settings

### Cross-Phase Compatibility
- Integrates with haptics (Phase 51)
- Works with dark mode (Phase 50)
- Analytics tracking (Phase 54)

### Test Commands
```bash
# Run onboarding tests
npm test -- tests/frontend/onboarding.test.ts

# Manual testing
# Reset tutorial: Delete app and reinstall
# Skip: Verify tutorial never shows again
# Replay: Settings → Replay Tutorial
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| Tutorial too long, users skip | High | Keep under 60s, allow skip, make engaging |
| Tips annoy experienced users | Medium | Show max 3 times, easy dismiss, forever option |
| Tutorial blocks critical functionality | High | Non-blocking overlay, always skippable |
| Low completion rate | Medium | Track analytics, optimize based on data |

## References

- [Features & Journeys](./../../../../.docs/features-and-journeys.md) - UX specifications
- [Phase 51](./51-haptic-refinement.md) - Haptic integration

## Handover

**Next Phase:** [53-monitoring-reporting.md](./53-monitoring-reporting.md) - Add performance monitoring

**Required Inputs Provided to Phase 53:**
- Tutorial completion analytics ready
- Event tracking infrastructure in place

---

**Status:** Ready after Phase 51
**Estimated Time:** 2 days
**Blocking Issues:** Requires Phase 51 haptic feedback complete
