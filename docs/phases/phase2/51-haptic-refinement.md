# 51-haptic-refinement.md
---
phase_id: 51
title: Haptic Feedback Refinement
duration_estimate: "2 days"
incremental_value: Context-aware haptic patterns for enhanced user experience
owners: [Frontend Engineer, UX Designer]
dependencies: [50]
linked_phases_forward: [52]
docs_referenced: [Features & Journeys, Implementation]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: ContextCurator
    tool: context7
    scope: ["expo-haptics documentation", "React Native haptics patterns"]
    outputs: ["/docs/context/phase2/51-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for context-aware haptic feedback system"
    outputs: ["/docs/sequencing/phase2/51-haptic-steps.md"]
acceptance_criteria:
  - Context-aware haptic patterns for different interactions
  - Custom vibration patterns for success/error/warning
  - Haptic feedback on all touch interactions
  - iOS & Android pattern mapping works
  - User can disable haptics in settings
  - Haptic intensity levels (light/medium/strong)
  - No duplicate/overlapping vibrations
---

## Objectives

1. **Context-Aware Patterns** - Different haptics for different actions
2. **Platform Consistency** - iOS & Android native feel
3. **User Control** - Settings for intensity & enable/disable

## Scope

### In
- Context-aware haptic patterns (tap, success, error, warning)
- Custom vibration sequences
- Haptic feedback on all interactions
- iOS & Android pattern mapping
- Haptic settings (enable/disable, intensity)
- Debouncing to prevent overlap
- Accessibility considerations

### Out
- Advanced haptic engine features (iOS only)
- Third-party haptic libraries
- Game-style haptic effects
- Haptic pattern designer UI

## Tasks

- [ ] **Use context7** to compile haptics documentation
- [ ] **Use sequentialthinking** to plan implementation

- [ ] **Install Expo Haptics**:
  ```bash
  cd app
  npx expo install expo-haptics
  ```

- [ ] **Create Haptic Types** (`app/lib/haptics/types.ts`):
  ```typescript
  export type HapticPattern =
    | 'tap'           // Light tap
    | 'select'        // Item selected
    | 'success'       // Action completed
    | 'warning'       // Warning/alert
    | 'error'         // Error occurred
    | 'toggle_on'     // Toggle switched on
    | 'toggle_off'    // Toggle switched off
    | 'swipe'         // Swipe gesture
    | 'long_press'    // Long press detected
    | 'build_start'   // Claude starts building
    | 'build_complete'// Build finished
    | 'voice_start'   // Voice recording started
    | 'voice_stop'    // Voice recording stopped

  export type HapticIntensity = 'light' | 'medium' | 'strong'

  export interface HapticConfig {
    enabled: boolean
    intensity: HapticIntensity
    respectSystemSettings: boolean
  }
  ```

- [ ] **Create Haptic Service** (`app/lib/haptics/HapticService.ts`):
  ```typescript
  import * as Haptics from 'expo-haptics'
  import { Platform } from 'react-native'
  import { HapticPattern, HapticIntensity, HapticConfig } from './types'
  import AsyncStorage from '@react-native-async-storage/async-storage'

  const HAPTIC_CONFIG_KEY = '@mobvibe_haptic_config'

  class HapticService {
    private config: HapticConfig = {
      enabled: true,
      intensity: 'medium',
      respectSystemSettings: true,
    }
    private lastHapticTime = 0
    private debounceMs = 50 // Prevent rapid-fire haptics

    async initialize() {
      try {
        const stored = await AsyncStorage.getItem(HAPTIC_CONFIG_KEY)
        if (stored) {
          this.config = { ...this.config, ...JSON.parse(stored) }
        }
      } catch (error) {
        console.error('Failed to load haptic config:', error)
      }
    }

    async updateConfig(config: Partial<HapticConfig>) {
      this.config = { ...this.config, ...config }
      try {
        await AsyncStorage.setItem(HAPTIC_CONFIG_KEY, JSON.stringify(this.config))
      } catch (error) {
        console.error('Failed to save haptic config:', error)
      }
    }

    getConfig(): HapticConfig {
      return { ...this.config }
    }

    async trigger(pattern: HapticPattern) {
      if (!this.config.enabled) return

      // Debounce
      const now = Date.now()
      if (now - this.lastHapticTime < this.debounceMs) return
      this.lastHapticTime = now

      try {
        await this.executePattern(pattern)
      } catch (error) {
        console.error('Haptic feedback error:', error)
      }
    }

    private async executePattern(pattern: HapticPattern) {
      const { intensity } = this.config

      switch (pattern) {
        case 'tap':
          await Haptics.impactAsync(
            intensity === 'light'
              ? Haptics.ImpactFeedbackStyle.Light
              : intensity === 'strong'
              ? Haptics.ImpactFeedbackStyle.Heavy
              : Haptics.ImpactFeedbackStyle.Medium
          )
          break

        case 'select':
          await Haptics.selectionAsync()
          break

        case 'success':
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          )
          break

        case 'warning':
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          )
          break

        case 'error':
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          )
          break

        case 'toggle_on':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break

        case 'toggle_off':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break

        case 'swipe':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break

        case 'long_press':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          break

        case 'build_start':
          // Custom pattern: medium impact + light impact
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          await this.sleep(100)
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break

        case 'build_complete':
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          )
          break

        case 'voice_start':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break

        case 'voice_stop':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break

        default:
          console.warn(`Unknown haptic pattern: ${pattern}`)
      }
    }

    private sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }
  }

  export const hapticService = new HapticService()
  ```

- [ ] **Create Haptic Hook** (`app/lib/haptics/useHaptics.ts`):
  ```typescript
  import { useCallback } from 'react'
  import { hapticService } from './HapticService'
  import { HapticPattern } from './types'

  export function useHaptics() {
    const trigger = useCallback((pattern: HapticPattern) => {
      hapticService.trigger(pattern)
    }, [])

    return { trigger }
  }
  ```

- [ ] **Add Haptic Settings UI** (`app/components/settings/HapticSettings.tsx`):
  ```typescript
  import React, { useState, useEffect } from 'react'
  import { View, Text, Switch } from 'react-native'
  import { hapticService } from '@/lib/haptics/HapticService'
  import { HapticIntensity } from '@/lib/haptics/types'

  export function HapticSettings() {
    const [config, setConfig] = useState(hapticService.getConfig())

    useEffect(() => {
      setConfig(hapticService.getConfig())
    }, [])

    const handleToggle = async (enabled: boolean) => {
      await hapticService.updateConfig({ enabled })
      setConfig(hapticService.getConfig())
      if (enabled) hapticService.trigger('toggle_on')
    }

    const handleIntensityChange = async (intensity: HapticIntensity) => {
      await hapticService.updateConfig({ intensity })
      setConfig(hapticService.getConfig())
      hapticService.trigger('select')
    }

    return (
      <View className="p-4 bg-white dark:bg-gray-900 rounded-lg">
        <Text className="text-lg font-semibold mb-4 dark:text-white">
          Haptic Feedback
        </Text>

        {/* Enable/Disable */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="dark:text-gray-300">Enable Haptics</Text>
          <Switch
            value={config.enabled}
            onValueChange={handleToggle}
          />
        </View>

        {/* Intensity Selector */}
        {config.enabled && (
          <View className="mb-4">
            <Text className="mb-2 dark:text-gray-300">Intensity</Text>
            <View className="flex-row gap-2">
              {(['light', 'medium', 'strong'] as HapticIntensity[]).map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => handleIntensityChange(level)}
                  className={`flex-1 py-3 rounded-lg ${
                    config.intensity === level
                      ? 'bg-blue-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <Text
                    className={`text-center capitalize ${
                      config.intensity === level
                        ? 'text-white font-semibold'
                        : 'dark:text-gray-300'
                    }`}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    )
  }
  ```

- [ ] **Add Haptics to Button Component** (`app/components/ui/Button.tsx`):
  ```typescript
  import { useHaptics } from '@/lib/haptics/useHaptics'

  export function Button({ onPress, children, ...props }: ButtonProps) {
    const { trigger } = useHaptics()

    const handlePress = () => {
      trigger('tap')
      onPress?.()
    }

    return (
      <TouchableOpacity onPress={handlePress} {...props}>
        {children}
      </TouchableOpacity>
    )
  }
  ```

- [ ] **Add Haptics to Coding Session** (`app/screens/CodingSession.tsx`):
  ```typescript
  const { trigger } = useHaptics()

  // On build start
  const handleBuildStart = () => {
    trigger('build_start')
    startCodingSession(prompt)
  }

  // On build complete
  useEffect(() => {
    if (session?.status === 'completed') {
      trigger('build_complete')
    } else if (session?.status === 'error') {
      trigger('error')
    }
  }, [session?.status])
  ```

- [ ] **Add Haptics to Voice Input** (`app/components/VoiceInput.tsx`):
  ```typescript
  const handleVoiceStart = async () => {
    trigger('voice_start')
    await startRecording()
  }

  const handleVoiceStop = async () => {
    trigger('voice_stop')
    await stopRecording()
  }
  ```

- [ ] **Add Haptics to Preview Interactions** (`app/components/Preview.tsx`):
  ```typescript
  // On element select (pinch to build)
  const handleElementSelect = (element: string) => {
    trigger('select')
    setSelectedElement(element)
  }

  // On successful code update
  const handleCodeUpdate = () => {
    trigger('success')
  }
  ```

- [ ] **Initialize on App Load** (`app/_layout.tsx`):
  ```typescript
  import { hapticService } from '@/lib/haptics/HapticService'

  export default function RootLayout() {
    useEffect(() => {
      hapticService.initialize()
    }, [])

    // ... rest of layout
  }
  ```

- [ ] **Add Haptics to Settings Screen** - Add `<HapticSettings />` component

- [ ] **Test Haptic Patterns**:
  ```bash
  # Create test screen
  # app/screens/HapticTest.tsx

  export function HapticTestScreen() {
    const { trigger } = useHaptics()

    return (
      <ScrollView className="p-4">
        {(['tap', 'select', 'success', 'warning', 'error',
           'toggle_on', 'toggle_off', 'swipe', 'long_press',
           'build_start', 'build_complete', 'voice_start',
           'voice_stop'] as HapticPattern[]).map((pattern) => (
          <Button
            key={pattern}
            onPress={() => trigger(pattern)}
            className="mb-2 bg-blue-500 p-4 rounded"
          >
            <Text className="text-white">{pattern}</Text>
          </Button>
        ))}
      </ScrollView>
    )
  }
  ```

- [ ] **Create Integration Tests**:
  ```typescript
  // tests/frontend/haptics.test.ts
  describe('Haptic Feedback', () => {
    it('triggers correct pattern on button press', async () => {
      const { getByText } = render(<Button onPress={() => {}}>Test</Button>)
      fireEvent.press(getByText('Test'))

      // Verify haptic triggered
      expect(Haptics.impactAsync).toHaveBeenCalled()
    })

    it('respects disabled setting', async () => {
      await hapticService.updateConfig({ enabled: false })
      await hapticService.trigger('tap')

      expect(Haptics.impactAsync).not.toHaveBeenCalled()
    })

    it('maps custom patterns correctly', async () => {
      await hapticService.trigger('build_complete')

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      )
    })
  })
  ```

- [ ] **Test on Both Platforms**:
  - iOS: Verify Taptic Engine patterns feel native
  - Android: Verify vibration patterns are appropriate
  - Test with system haptics disabled
  - Test all intensity levels

- [ ] **Document Haptic Patterns** (`docs/frontend/HAPTICS.md`)

- [ ] **Update links-map**

## Artifacts & Paths

**Haptic System:**
- `app/lib/haptics/types.ts`
- `app/lib/haptics/HapticService.ts`
- `app/lib/haptics/useHaptics.ts`
- `app/components/settings/HapticSettings.tsx`

**Tests:**
- `tests/frontend/haptics.test.ts`
- `app/screens/HapticTest.tsx` (dev only)

**Docs:**
- `docs/frontend/HAPTICS.md` ⭐

## Testing

### Phase-Only Tests
- All haptic patterns trigger correctly
- Settings persist across app restarts
- Intensity levels work on both platforms
- Debouncing prevents rapid-fire haptics
- Disabled state respected

### Cross-Phase Compatibility
- Phase 52: Onboarding uses haptics for guidance
- Works with dark mode (Phase 50)

### Test Commands
```bash
# Run haptic tests
npm test -- tests/frontend/haptics.test.ts

# Manual testing
# Add HapticTestScreen to dev menu
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| Platform differences in haptic feel | Medium | Test extensively on both platforms, adjust patterns |
| Excessive haptics annoy users | High | Debouncing, user settings, conservative defaults |
| Performance impact on older devices | Low | Async execution, minimal overhead |
| System haptics disabled | Low | Respect system settings, graceful fallback |

## References

- [Features & Journeys](./../../../../.docs/features-and-journeys.md) - UX specifications
- [Phase 50](./50-dark-mode.md) - Dark mode integration

## Handover

**Next Phase:** [52-onboarding-tips.md](./52-onboarding-tips.md) - Add onboarding tutorial with haptic guidance

**Required Inputs Provided to Phase 52:**
- Haptic system ready for onboarding feedback
- Settings UI for haptic preferences

---

**Status:** Ready after Phase 50
**Estimated Time:** 2 days
**Blocking Issues:** Requires Phase 50 dark mode complete
