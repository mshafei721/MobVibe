# UI Adapter Layer Documentation

**Purpose:** Prevent vendor lock-in by abstracting UI library imports
**Benefit:** Swap UI libraries without modifying primitive components
**Status:** Phase 06 Complete

---

## Overview

The adapter layer provides a vendor-agnostic interface for UI components. All primitives import from `@/ui/adapters` instead of directly from `react-native` or `@gluestack-ui/themed`. This enables future UI library swaps by changing a single file.

**Architecture:**
```
Primitives → Adapter Interfaces → gluestack/React Native Components

Future Migration Example:
Primitives → Adapter Interfaces → Tamagui Components (change 1 line)
```

---

## Why Adapters?

### Problem: Vendor Lock-In
Without adapters, changing UI libraries requires rewriting every primitive:
```typescript
// Every primitive imports directly
import { View, TouchableOpacity, Text } from 'react-native';

// To switch to gluestack, must modify every file
import { Box, Pressable, Text } from '@gluestack-ui/themed';
```

### Solution: Adapter Pattern
With adapters, changing UI libraries requires updating one file:
```typescript
// Primitives import from adapter (never changes)
import { Box, Pressable, Text } from '@/ui/adapters';

// To switch libraries, update src/ui/adapters/index.ts only
export * from './tamagui';  // Change this one line
```

---

## Adapter Components

### Core Adapters (6 total)

**1. Box** - Container component (replaces View)
- **Current:** gluestack Box
- **Used In:** Card, Divider, Input, ListItem, Sheet, Spinner

**2. Pressable** - Touchable component (replaces TouchableOpacity)
- **Current:** gluestack Pressable
- **Used In:** Button, Card, Input, ListItem, Sheet

**3. Text** - Text component
- **Current:** gluestack Text
- **Used In:** Button, Input, ListItem, Text primitive

**4. TextInput** - Text input component
- **Current:** React Native TextInput (gluestack Input too opinionated)
- **Used In:** Input

**5. ActivityIndicator** - Loading indicator
- **Current:** React Native ActivityIndicator (simple, no gluestack benefit)
- **Used In:** Spinner

**6. Modal** - Modal/overlay component
- **Current:** React Native Modal (custom Sheet implementation needs direct control)
- **Used In:** Sheet

### Hybrid Approach

We use gluestack where it provides value (Box, Pressable, Text) and React Native where it doesn't (TextInput, ActivityIndicator, Modal). This pragmatic approach balances benefits with simplicity.

---

## Usage

### Creating New Primitives

```typescript
// ✅ Good - Import from adapter
import { Box, Pressable, Text } from '@/ui/adapters';
import { Platform } from 'react-native';  // Utilities allowed
import { tokens } from '@/ui/tokens';

export const MyComponent = () => {
  return (
    <Box>
      <Pressable onPress={() => {}}>
        <Text>Hello</Text>
      </Pressable>
    </Box>
  );
};
```

```typescript
// ❌ Bad - Direct vendor imports
import { View, TouchableOpacity, Text } from 'react-native';
import { Box } from '@gluestack-ui/themed';

// This creates vendor lock-in!
```

### Allowed Import Exceptions

**Platform Utilities (OK to import directly):**
- `Platform` - OS detection
- `AccessibilityInfo` - Accessibility queries
- `ViewStyle`, `TextStyle` - TypeScript types
- `Animated` - Animation API
- `KeyboardTypeOptions`, `LayoutChangeEvent` - Type definitions

**Third-Party Libraries (OK):**
- `react-native-haptic-feedback` - Utility library
- `@expo/vector-icons` - Already vendor-agnostic
- `@/ui/tokens` - Design tokens (configuration)

**Rule of Thumb:** If it's a UI component (Box, Pressable, Text, View, TouchableOpacity), import from adapters. If it's a utility or type, direct import is OK.

---

## How to Swap UI Libraries

**Scenario:** You want to migrate from gluestack to Tamagui.

**Step 1:** Create Tamagui adapter implementation
```
src/ui/adapters/
├── gluestack/           # Existing
└── tamagui/             # New
    ├── index.ts
    ├── Box.ts           # import { Box } from 'tamagui'
    ├── Pressable.ts     # import { Pressable } from 'tamagui'
    ├── Text.ts          # import { Text } from 'tamagui'
    ├── TextInput.ts
    ├── ActivityIndicator.ts
    └── Modal.ts
```

**Step 2:** Implement adapter interfaces
```typescript
// src/ui/adapters/tamagui/Box.ts
import { View as TamaguiView } from 'tamagui';
import type { BoxProps } from '../types';

export const Box = TamaguiView as React.ComponentType<BoxProps>;
```

**Step 3:** Update facade to export Tamagui
```typescript
// src/ui/adapters/index.ts
export * from './tamagui';  // Changed from './gluestack'
export type * from './types';
```

**Step 4:** Test
```bash
npm test -- primitives/
npm start  # Verify ComponentGallery
```

**Result:** All primitives now use Tamagui. Zero changes to primitive components!

---

## Adding New Adapter Components

**When:** You need a new UI primitive (e.g., Switch, Slider)

**Steps:**

1. **Add interface to types.ts:**
```typescript
// src/ui/adapters/types.ts
export interface SwitchProps extends RNSwitchProps {}
```

2. **Implement in gluestack adapter:**
```typescript
// src/ui/adapters/gluestack/Switch.ts
import { Switch as GluestackSwitch } from '@gluestack-ui/themed';
import type { SwitchProps } from '../types';

export const Switch = GluestackSwitch as React.ComponentType<SwitchProps>;
```

3. **Export from barrel:**
```typescript
// src/ui/adapters/gluestack/index.ts
export { Switch } from './Switch';
```

4. **Use in primitive:**
```typescript
// src/ui/primitives/MySwitch.tsx
import { Switch } from '../adapters';
```

---

## Testing

### Audit Script (Verify Zero Vendor Leakage)

```bash
npm run ui:audit-imports
```

**What it checks:**
- No `from 'react-native'` imports of UI components outside adapters
- No `from '@gluestack-ui/themed'` imports outside adapters
- Exceptions allowed (Platform, tokens, haptic feedback, etc.)

**Expected output:**
```
✅ Zero vendor leakage - all UI imports via adapters
```

### Adapter Swap Test

```bash
npm test -- adapter-swap.test.tsx
```

**What it proves:**
- Primitives work with real adapter (gluestack)
- Mock adapter implements same interfaces
- Adapter is swappable (concept proven)

**Manual swap test:**
1. Change `src/ui/adapters/index.ts` to `export * from './__tests__/mock-adapter';`
2. Run `npm start` - ComponentGallery still works!
3. Change back to `export * from './gluestack';`

### Primitive Tests

```bash
# Test all primitives still work after refactoring
npm test -- primitives/

# Test specific component
npm test -- Button.test.tsx
```

All 96 tests (48 unit + 48 accessibility) should pass.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│ Primitive Components (src/ui/primitives/)          │
│                                                     │
│ Button.tsx   Text.tsx   Input.tsx   Card.tsx      │
│ Divider.tsx  Spinner.tsx  ListItem.tsx  Sheet.tsx │
│                                                     │
│ All import from: '@/ui/adapters'                   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  Adapter Facade        │
         │  (src/ui/adapters/     │
         │   index.ts)            │
         │                        │
         │  export * from         │
         │    './gluestack'       │  ◄── Change this to swap libraries
         └────────┬───────────────┘
                  │
                  ▼
    ┌─────────────────────────────────────┐
    │ Adapter Interfaces                  │
    │ (src/ui/adapters/types.ts)          │
    │                                     │
    │ BoxProps, PressableProps,           │
    │ AdapterTextProps, etc.              │
    └─────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│ Adapter Implementation                          │
│ (src/ui/adapters/gluestack/)                   │
│                                                 │
│ Box → gluestack Box                            │
│ Pressable → gluestack Pressable                │
│ Text → gluestack Text                          │
│ TextInput → React Native TextInput             │
│ ActivityIndicator → React Native ActivityIndicator │
│ Modal → React Native Modal                      │
└─────────────────────────────────────────────────┘
```

---

## File Organization

```
src/ui/
├── adapters/
│   ├── types.ts                          # Adapter interfaces
│   ├── gluestack/                        # Current implementation
│   │   ├── index.ts                      # Barrel export
│   │   ├── Box.ts                        # gluestack Box wrapper
│   │   ├── Pressable.ts                  # gluestack Pressable wrapper
│   │   ├── Text.ts                       # gluestack Text wrapper
│   │   ├── TextInput.ts                  # RN TextInput wrapper
│   │   ├── ActivityIndicator.ts          # RN ActivityIndicator wrapper
│   │   └── Modal.ts                      # RN Modal wrapper
│   ├── __tests__/
│   │   ├── mock-adapter.ts               # Mock implementation
│   │   └── adapter-swap.test.tsx         # Swappability test
│   └── index.ts                          # Facade (single import point)
│
├── primitives/                            # Use adapters
│   ├── Button.tsx
│   ├── Text.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Divider.tsx
│   ├── Spinner.tsx
│   ├── ListItem.tsx
│   ├── Sheet.tsx
│   └── Icon.tsx                          # No adapter needed
│
└── tokens/                                # Design tokens
```

---

## Common Issues

### Issue: TypeScript Errors After Refactoring

**Symptom:** `Cannot find module '@/ui/adapters'`

**Solution:** Verify `tsconfig.json` has path mapping:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: gluestack Components Not Rendering

**Symptom:** Components render blank or with errors

**Solution:** Add GluestackUIProvider to app root:
```typescript
// app/_layout.tsx
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '../gluestack-ui.config';

export default function RootLayout() {
  return (
    <GluestackUIProvider config={config}>
      {/* app content */}
    </GluestackUIProvider>
  );
}
```

### Issue: Audit Script Fails

**Symptom:** `❌ React Native imports found outside adapters`

**Solution:** Check the reported file and replace direct imports:
```typescript
// Before
import { View } from 'react-native';

// After
import { Box } from '@/ui/adapters';
```

---

## Trade-offs

### Pros
- ✅ Prevents vendor lock-in
- ✅ Future library swaps require changing one file
- ✅ Primitives isolated from vendor changes
- ✅ Can test with mock implementations
- ✅ Clear separation of concerns

### Cons
- ⚠️ Additional abstraction layer (minimal overhead)
- ⚠️ Some library-specific features may "leak" through interface
- ⚠️ Requires discipline to use adapters consistently

**Conclusion:** The benefits of vendor independence outweigh the minimal cost of the adapter layer.

---

## Best Practices

1. **Always import from adapters** - Never bypass the adapter layer
2. **Run audit script** - Verify zero vendor leakage before committing
3. **Keep adapters thin** - Minimal wrapping, delegate to libraries
4. **Accept some leakage** - Don't over-abstract for perfect isolation
5. **Document exceptions** - Clearly list allowed direct imports
6. **Test swappability** - Verify mock adapter works periodically

---

## Phase 07: Library Integrations

### Overview

Phase 07 extends the adapter pattern to integrate specialized UI libraries for features not provided by core primitives:
- **React Native Paper** - Material Design components for Android
- **Lottie React Native** - Vector animations
- **React Native Gifted Chat** - Complete chat UI

All integrations follow the adapter pattern established in Phase 06.

---

### React Native Paper

**Purpose:** Material Design components for Android-forward screens

**Installation:**
```bash
npm install react-native-paper --legacy-peer-deps
```

**Theme Configuration:**
```typescript
// src/ui/themes/paper.ts
import { MD3LightTheme } from 'react-native-paper';
import { colorsLight, borderRadius } from '../tokens';

export const paperLightTheme = {
  ...MD3LightTheme,
  roundness: borderRadius.md,
  colors: {
    ...MD3LightTheme.colors,
    primary: colorsLight.primary[500],
    secondary: colorsLight.secondary[500],
    error: colorsLight.error[500],
    // ... full token mapping
  },
};
```

**Selective Components (Approved - No Duplicates):**
- ✅ **FAB** - Floating Action Button (unique)
- ✅ **Chip** - Material chips for tags/filters (unique)
- ✅ **Badge** - Notification badges (unique)
- ✅ **ProgressBar** - Linear progress (unique - different from Spinner)
- ✅ **Snackbar** - Android-style toasts (unique)

**Why Selective:**
- ❌ No Paper Button - We have Button primitive
- ❌ No Paper Text - We have Text primitive
- ❌ No Paper TextInput - We have Input primitive
- ❌ No Paper Card - We have Card primitive

**Usage:**
```typescript
import { FAB, Chip, Badge, ProgressBar, Snackbar } from '@/ui/adapters';
import { tokens } from '@/ui/tokens';

// Floating Action Button
<FAB icon="plus" onPress={handleCreate} />

// Material Chip
<Chip mode="outlined" onPress={handleFilter}>
  Active
</Chip>

// Badge indicator
<Badge size={24}>3</Badge>

// Linear progress
<ProgressBar progress={0.7} color={tokens.colors.primary[500]} />

// Snackbar toast
<Snackbar
  visible={visible}
  onDismiss={onDismiss}
  duration={3000}
>
  Item saved successfully!
</Snackbar>
```

**Adapter Structure:**
```
src/ui/adapters/paper/
├── index.ts              # Barrel export
├── FAB.ts                # export { FAB } from 'react-native-paper'
├── Chip.ts
├── Badge.ts
├── ProgressBar.ts
└── Snackbar.ts
```

---

### Lottie Animations

**Purpose:** Vector animations for loading/success states with accessibility support

**Installation:**
```bash
npm install lottie-react-native --legacy-peer-deps
```

**Features:**
- ✅ Reduced motion support (automatically respects user preference)
- ✅ Dynamic color theming via color filters
- ✅ Aspect ratio control
- ✅ Auto-play and loop control

**Usage:**
```typescript
import { Animation } from '@/ui/adapters';
import { tokens } from '@/ui/tokens';

// Loading animation with dynamic color
<Animation
  source={require('@/assets/animations/loading.json')}
  autoPlay
  loop
  colorFilters={[
    { keypath: 'loader', color: tokens.colors.primary[500] }
  ]}
  accessibilityLabel="Loading animation"
/>

// Success animation (one-time)
<Animation
  source={require('@/assets/animations/success.json')}
  autoPlay
  loop={false}
  onAnimationFinish={handleComplete}
/>
```

**Reduced Motion Support:**
```typescript
// Animation component automatically:
// 1. Checks AccessibilityInfo.isReduceMotionEnabled()
// 2. Disables autoPlay if reduced motion is enabled
// 3. Disables loop if reduced motion is enabled
// 4. Shows first frame only (static image)

// No additional code needed - it's built-in!
```

**Color Filters for Theming:**
```typescript
// Use color filters to match brand colors dynamically
<Animation
  source={require('@/assets/animations/loading.json')}
  colorFilters={[
    { keypath: 'layer1', color: tokens.colors.primary[500] },
    { keypath: 'layer2', color: tokens.colors.secondary[500] },
  ]}
/>
```

**Best Practices:**
- Keep animation files small (< 50 KB)
- Use `.lottie` format for smaller size (vs `.json`)
- Test on low-end devices
- Always provide `accessibilityLabel`
- Limit number of simultaneous animations

**Adapter Structure:**
```
src/ui/components/
└── Animation.tsx        # Wrapper with reduced motion + theming

src/ui/adapters/lottie/
└── index.ts             # Re-exports Animation component
```

---

### Gifted Chat

**Purpose:** Complete chat UI for messaging features

**Installation:**
```bash
npm install react-native-gifted-chat react-native-reanimated react-native-keyboard-controller --legacy-peer-deps
```

**Configuration Required:**

1. **Android Manifest** (`android/app/src/main/AndroidManifest.xml`):
```xml
<activity
  android:windowSoftInputMode="adjustResize"
/>
```

2. **Babel Plugin** (`babel.config.js`):
```javascript
module.exports = {
  plugins: [
    'react-native-reanimated/plugin', // MUST be last
  ],
};
```

**Usage:**
```typescript
import { Chat, IMessage, User } from '@/ui/adapters';
import { useState } from 'react';

const ChatScreen = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);

  const handleSend = (newMessages: IMessage[]) => {
    setMessages(prev => GiftedChat.append(prev, newMessages));
  };

  return (
    <Chat
      messages={messages}
      onSend={handleSend}
      user={{ _id: 1, name: 'User' }}
      placeholder="Type a message..."
    />
  );
};
```

**Token Theming (Applied Automatically):**
```typescript
// Chat component automatically applies:
// - tokens.colors.primary[500] → chat bubbles
// - tokens.colors.neutral[*] → backgrounds
// - tokens.typography.fontFamily → message text
// - tokens.colors.text.* → text colors
```

**Message Structure:**
```typescript
interface IMessage {
  _id: string | number;
  text: string;
  createdAt: Date | number;
  user: User;
  image?: string;
  video?: string;
  audio?: string;
  system?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
  quickReplies?: QuickReplies;
}
```

**Adapter Structure:**
```
src/ui/components/
└── Chat.tsx             # Wrapper with token theming

src/ui/adapters/gifted-chat/
└── index.ts             # Re-exports Chat component
```

---

### Updated Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│ Application Code                                     │
│ (Primitives, Components, Screens)                   │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ UI Adapter Facade (src/ui/adapters/index.ts)       │
└──────────┬────────────────────────────────────────┘
           │
           ├──── Phase 06: Core Adapters
           │     ├── gluestack (Box, Pressable, Text)
           │     └── react-native (TextInput, ActivityIndicator, Modal)
           │
           └──── Phase 07: Specialized Libraries
                 ├── paper (FAB, Chip, Badge, ProgressBar, Snackbar)
                 ├── lottie (Animation)
                 └── gifted-chat (Chat)
```

---

### Audit Scripts

**Import Audit** - Verifies zero vendor leakage:
```bash
npm run ui:audit-imports
```

**Duplicate Audit** - Verifies no Paper components duplicate primitives:
```bash
npm run ui:audit-duplicates
```

**Expected Output:**
```
✅ Zero vendor leakage - all UI imports via adapters
✅ No duplicate primitives - all Paper components unique
```

---

### Tree-Shaking Strategies

**Paper:**
```typescript
// ✅ Good - Import only what you need
import { FAB } from 'react-native-paper';

// ❌ Bad - Imports entire library
import * as Paper from 'react-native-paper';
```

**Lottie:**
- Optimize animation files (reduce frames, compress JSON)
- Use `.lottie` format instead of `.json` (smaller)
- Lazy load animations only when needed

**Gifted Chat:**
- Lazy load chat component (only when chat screen accessed)
- Use code splitting for chat screens

---

## References

- [Research: Adapter Patterns](../research/06/adapter-patterns.md)
- [Research: Library Integration](../research/07/library-integration.md)
- [Implementation Plan Phase 06](../sequencing/06-adapter-implementation.md)
- [Implementation Plan Phase 07](../sequencing/07-integration-steps.md)
- [Phase 06 Plan](../phases/06-adapter-layer.md)
- [Phase 06 Complete](../phases/06-COMPLETE.md)
- [Phase 07 Plan](../phases/07-library-integration.md)

---

**Last Updated:** 2025-11-06
**Phase:** 07 Complete
**Next:** Phase 08 - Screen Refactor (Auth + Home screens can now use all adapters)
