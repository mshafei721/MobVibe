# Phase 02: PoC Execution Plan

**Generated:** 2025-11-06
**Phase:** 02 - Foundation Decision
**Purpose:** Step-by-step plan for building and evaluating both PoCs

---

## Execution Overview

**Goal:** Build functional PoCs with both Tamagui and gluestack UI, measure objectively, make data-driven decision

**Total Duration:** 1.5 days (12 hours)
- Tamagui PoC: 5 hours
- gluestack PoC: 5 hours
- Measurement & Scoring: 2 hours

**Parallelizable:** Both PoCs can be built in parallel by different team members

---

## Part 1: Tamagui PoC

### Step 1.1: Branch Setup (15 min)

```bash
# Create Tamagui PoC branch from main
git checkout main
git pull origin main
git checkout -b poc/tamagui

# Verify clean state
git status
```

### Step 1.2: Installation (15 min)

```bash
# Install Tamagui and dependencies
npm install tamagui @tamagui/config @tamagui/themes

# Install required peer dependencies
npm install react-native-reanimated react-native-gesture-handler

# Verify installation
npm list tamagui
```

### Step 1.3: Configuration (30 min)

Create `tamagui.config.ts`:

```typescript
import { config } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'

// Map MobVibe design tokens to Tamagui
export default createTamagui({
  ...config,
  tokens: {
    ...config.tokens,
    color: {
      // Primary scale (MobVibe #2196F3)
      primary50: '#E3F2FD',
      primary100: '#BBDEFB',
      primary200: '#90CAF9',
      primary300: '#64B5F6',
      primary400: '#42A5F5',
      primary500: '#2196F3', // MobVibe primary
      primary600: '#1E88E5',
      primary700: '#1976D2',
      primary800: '#1565C0',
      primary900: '#0D47A1',

      // Secondary scale (MobVibe #9C27B0)
      secondary50: '#F3E5F5',
      secondary500: '#9C27B0',
      secondary900: '#4A148C',

      // Semantic colors
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FFA726',

      // Text colors
      textPrimary: '#000',
      textSecondary: '#666',
      textDisabled: '#999',

      // Background
      bgLight: '#fff',
      bgDark: '#1E1E1E',

      // Border
      borderLight: '#ddd',
      borderMedium: '#ccc',
    },
    space: {
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      8: 32,
      10: 40,
      12: 48,
      16: 64,
    },
    size: {
      // Button heights
      buttonSm: 36,
      buttonBase: 48,
      buttonLg: 56,
    },
  },
  themes: {
    light: {
      background: '#fff',
      backgroundHover: '#f5f5f5',
      backgroundPress: '#eeeeee',
      backgroundFocus: '#e3f2fd',
      color: '#000',
      colorHover: '#333',
      colorPress: '#666',
      borderColor: '#ddd',
      borderColorHover: '#ccc',
      borderColorFocus: '#2196F3',
    },
    dark: {
      background: '#1E1E1E',
      backgroundHover: '#2a2a2a',
      backgroundPress: '#333',
      backgroundFocus: '#1565C0',
      color: '#fff',
      colorHover: '#e0e0e0',
      colorPress: '#bbb',
      borderColor: '#444',
      borderColorHover: '#555',
      borderColorFocus: '#42A5F5',
    },
  },
})
```

Update `app/_layout.tsx` to include Tamagui provider:

```typescript
import { TamaguiProvider } from 'tamagui'
import config from '../tamagui.config'

export default function RootLayout() {
  return (
    <TamaguiProvider config={config}>
      {/* ... existing layout */}
    </TamaguiProvider>
  )
}
```

### Step 1.4: Build Screen 1 - Login (1.5 hours)

Create `app/(auth)/login-tamagui.tsx`:

```typescript
import { useState } from 'react'
import { YStack, XStack, Input, Button, Text, Separator } from 'tamagui'
import { useRouter } from 'expo-router'

export default function LoginTamaguiScreen() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  return (
    <YStack flex={1} padding="$6" backgroundColor="$background" justifyContent="center">
      {/* Title */}
      <Text fontSize={32} fontWeight="bold" color="$primary500" textAlign="center" marginBottom="$2">
        Welcome to MobVibe
      </Text>

      {/* Subtitle */}
      <Text fontSize={16} color="$textSecondary" textAlign="center" marginBottom="$12">
        AI-Powered Mobile App Builder
      </Text>

      {/* Email Input */}
      <Input
        size="$buttonBase"
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        borderWidth={1}
        borderColor="$borderLight"
        marginBottom="$4"
      />

      {/* Primary Button */}
      <Button
        size="$buttonBase"
        theme="blue"
        pressStyle={{ scale: 0.97 }}
        onPress={() => console.log('Email login')}
        disabled={isLoading}
      >
        <Text color="$color">
          {isLoading ? 'Sending...' : 'Continue with Email'}
        </Text>
      </Button>

      {/* Divider */}
      <XStack alignItems="center" marginVertical="$4">
        <Separator flex={1} />
        <Text paddingHorizontal="$4" color="$textSecondary" fontSize={14}>
          OR
        </Text>
        <Separator flex={1} />
      </XStack>

      {/* OAuth Buttons */}
      <YStack gap="$4">
        <Button
          size="$buttonBase"
          backgroundColor="$background"
          borderWidth={1}
          borderColor="$borderLight"
          pressStyle={{ backgroundColor: '$backgroundPress' }}
        >
          <Text color="$textPrimary">Continue with Google</Text>
        </Button>

        <Button
          size="$buttonBase"
          backgroundColor="$background"
          borderWidth={1}
          borderColor="$borderLight"
        >
          <Text color="$textPrimary">Continue with Apple</Text>
        </Button>

        <Button
          size="$buttonBase"
          backgroundColor="$background"
          borderWidth={1}
          borderColor="$borderLight"
        >
          <Text color="$textPrimary">Continue with GitHub</Text>
        </Button>
      </YStack>
    </YStack>
  )
}
```

**Lines of Code:** ~60 lines

### Step 1.5: Build Screen 2 - Home (1.5 hours)

Create simplified home screen with project cards

**Lines of Code:** ~80 lines (estimated)

### Step 1.6: Build Screen 3 - Code Tab (1 hour)

Create simplified code tab with file tree

**Lines of Code:** ~60 lines (estimated)

### Step 1.7: Performance Measurement (1 hour)

```bash
# Build production bundle
npm run start -- --no-dev --minify

# Measure TTI (manual stopwatch)
# - Cold start: From app icon tap to interactive
# - Warm start: From background to interactive
# - Average 3 runs each

# Measure FPS (Performance Monitor)
# - Enable in dev menu
# - Scroll Login screen
# - Record FPS values

# Measure bundle size
npx expo export --platform all
du -sh dist/  # Windows: dir dist /s

# Measure memory
# iOS: Xcode Instruments → Allocations
# Android: Android Studio Profiler
```

Save metrics to `reports/ui/tamagui-poc-performance.json`:

```json
{
  "library": "Tamagui",
  "date": "2025-11-06",
  "tti": {
    "cold_start_ms": null,
    "warm_start_ms": null
  },
  "fps": {
    "login_scroll": null,
    "home_scroll": null
  },
  "bundle_size_mb": null,
  "memory_peak_mb": null,
  "loc": {
    "login": 60,
    "home": 80,
    "code": 60,
    "total": 200
  }
}
```

### Step 1.8: Screenshots (15 min)

```bash
mkdir -p reports/ui/tamagui-poc-screenshots

# Capture:
# - login-light.png
# - login-dark.png
# - home-light.png
# - code-light.png
```

---

## Part 2: gluestack UI PoC

### Step 2.1: Branch Setup (15 min)

```bash
# Create gluestack PoC branch from main
git checkout main
git pull origin main
git checkout -b poc/gluestack

# Verify clean state
git status
```

### Step 2.2: Installation (15 min)

```bash
# Install gluestack UI v2
npm install @gluestack-ui/themed @gluestack-style/react

# Install NativeWind (if not already installed)
npm install nativewind tailwindcss

# Configure NativeWind
npx tailwindcss init

# Verify installation
npm list @gluestack-ui/themed
```

### Step 2.3: Configuration (30 min)

Update `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3', // MobVibe primary
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
        },
        secondary: {
          50: '#F3E5F5',
          500: '#9C27B0',
          900: '#4A148C',
        },
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FFA726',
      },
      spacing: {
        0: '0',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },
    },
  },
  plugins: [],
}
```

Create `gluestack.config.ts`:

```typescript
import { createConfig } from '@gluestack-style/react'

export const config = createConfig({
  // Map to Tailwind tokens
  tokens: {
    colors: {
      primary500: '#2196F3',
      // ... etc
    },
  },
})
```

Update `app/_layout.tsx`:

```typescript
import { GluestackUIProvider } from '@gluestack-ui/themed'
import { config } from '../gluestack.config'

export default function RootLayout() {
  return (
    <GluestackUIProvider config={config}>
      {/* ... existing layout */}
    </GluestackUIProvider>
  )
}
```

### Step 2.4: Build Screen 1 - Login (1.5 hours)

Create `app/(auth)/login-gluestack.tsx`:

```typescript
import { useState } from 'react'
import { VStack, HStack, Input, InputField, Button, ButtonText, Text, Divider } from '@gluestack-ui/themed'
import { useRouter } from 'expo-router'

export default function LoginGluestackScreen() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  return (
    <VStack className="flex-1 p-6 bg-white justify-center">
      {/* Title */}
      <Text className="text-3xl font-bold text-primary-500 text-center mb-2">
        Welcome to MobVibe
      </Text>

      {/* Subtitle */}
      <Text className="text-base text-gray-600 text-center mb-12">
        AI-Powered Mobile App Builder
      </Text>

      {/* Email Input */}
      <Input className="h-12 border border-gray-300 rounded-lg mb-4">
        <InputField
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </Input>

      {/* Primary Button */}
      <Button
        className="h-12 bg-primary-500 rounded-lg"
        onPress={() => console.log('Email login')}
        isDisabled={isLoading}
      >
        <ButtonText className="text-white font-semibold">
          {isLoading ? 'Sending...' : 'Continue with Email'}
        </ButtonText>
      </Button>

      {/* Divider */}
      <HStack className="items-center my-4">
        <Divider className="flex-1" />
        <Text className="px-4 text-gray-600 text-sm">OR</Text>
        <Divider className="flex-1" />
      </HStack>

      {/* OAuth Buttons */}
      <VStack className="gap-4">
        <Button
          variant="outline"
          className="h-12 border border-gray-300 rounded-lg"
        >
          <ButtonText className="text-gray-800">Continue with Google</ButtonText>
        </Button>

        <Button variant="outline" className="h-12">
          <ButtonText>Continue with Apple</ButtonText>
        </Button>

        <Button variant="outline" className="h-12">
          <ButtonText>Continue with GitHub</ButtonText>
        </Button>
      </VStack>
    </VStack>
  )
}
```

**Lines of Code:** ~55 lines

### Step 2.5: Build Screen 2 - Home (1.5 hours)

Build home screen with project cards

**Lines of Code:** ~75 lines (estimated)

### Step 2.6: Build Screen 3 - Code Tab (1 hour)

Build code tab with file tree

**Lines of Code:** ~55 lines (estimated)

### Step 2.7: Performance Measurement (1 hour)

Same process as Tamagui - measure TTI, FPS, bundle, memory

Save to `reports/ui/gluestack-poc-performance.json`

### Step 2.8: Screenshots (15 min)

Capture same 4 screenshots in `reports/ui/gluestack-poc-screenshots/`

---

## Part 3: Scoring & Decision

### Step 3.1: Compile Performance Data (30 min)

Create `reports/ui/foundation-comparison.md` with side-by-side metrics

### Step 3.2: Score Criterion 1 - Performance (25%)

**Metrics:**
- TTI delta vs baseline
- FPS during scrolling
- Bundle size increase
- Memory usage

**Scoring (1-10):**
- Compare both against baseline
- Lower TTI/bundle = higher score
- Higher FPS = higher score

### Step 3.3: Score Criterion 2 - Developer Experience (20%)

**Evaluation:**
- Code clarity (subjective)
- TypeScript quality (errors, autocomplete)
- Lines of code for Login screen
- Debugging ease

**Scoring (1-10):**
- Fewer LOC = higher score (if clarity maintained)
- Better TypeScript = higher score

### Step 3.4: Score Criterion 3 - Theming Flexibility (20%)

**Evaluation:**
- Ease of mapping MobVibe tokens
- Dark mode implementation
- Token system depth
- Theme switching

**Scoring (1-10):**
- Easier mapping = higher score
- More flexible = higher score

### Step 3.5: Score Criterion 4 - Web Viability (15%)

**Evaluation:**
- SSR support (from research)
- Web performance (from research)
- Cross-platform consistency

**Scoring (1-10):**
- Tamagui: Likely 9-10 (excellent SSR)
- gluestack: Likely 6-7 (basic web)

### Step 3.6: Score Criterion 5 - Migration Effort (20%)

**Evaluation:**
- Learning curve (from PoC experience)
- Documentation quality
- Community support (from research)
- Team ramp-up estimate

**Scoring (1-10):**
- gluestack: Likely 8-9 (easier)
- Tamagui: Likely 6-7 (steeper)

### Step 3.7: Calculate Weighted Scores

```
Total Score = (Performance × 0.25) + (DX × 0.20) + (Theming × 0.20) + (Web × 0.15) + (Migration × 0.20)
```

**Example:**
- Tamagui: (7×0.25) + (7×0.20) + (8×0.20) + (10×0.15) + (6×0.20) = **7.45**
- gluestack: (9×0.25) + (8×0.20) + (8×0.20) + (6×0.15) + (9×0.20) = **8.35**

### Step 3.8: Document Decision (1 hour)

Create `docs/ui/FOUNDATION.md`:
- Winner announcement
- Scoring table with rationale
- Trade-offs considered
- Migration plan
- Rollback strategy

Create `docs/ui/FOUNDATION-SCORING.md`:
- Detailed scoring table
- Evidence for each score
- Calculations shown

### Step 3.9: Install Winner on Main Branch (30 min)

```bash
# Checkout main
git checkout main

# Install chosen library (example: gluestack)
npm install @gluestack-ui/themed @gluestack-style/react nativewind

# Create initial config
# Copy from PoC branch

# Commit
git add .
git commit -m "chore: install gluestack UI as primary UI foundation"
git tag phase-0.5-02-foundation-selected

# Push
git push origin main --tags
```

---

## Success Criteria

**Phase 02 Complete When:**
- ✅ Both PoC branches exist and build successfully
- ✅ All 3 screens functional in both PoCs
- ✅ Performance metrics captured for both
- ✅ Objective scoring completed with evidence
- ✅ FOUNDATION.md and FOUNDATION-SCORING.md created
- ✅ Chosen library installed on main branch
- ✅ Initial config file created

---

## Timeline Summary

**Total:** 12 hours (1.5 days)

| Task | Duration |
|------|----------|
| Tamagui PoC (setup → screens → measurement) | 5 hours |
| gluestack PoC (setup → screens → measurement) | 5 hours |
| Scoring & decision documentation | 1.5 hours |
| Installation on main branch | 0.5 hours |

**Parallelization:**
- If 2 engineers: 5 hours total (both PoCs in parallel)
- If 1 engineer: 10 hours sequential

---

**Status:** Execution plan complete | Ready for PoC implementation
**Next:** Execute Part 1 (Tamagui PoC) or Part 2 (gluestack PoC)
