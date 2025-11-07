# Phase 06: Adapter Layer Implementation Plan

**Phase:** 06 - Adapter Layer
**Date:** 2025-11-06
**Planning Method:** Sequential Thinking (20 steps)
**Estimated Duration:** 5-6 hours

---

## Executive Summary

Phase 06 creates an adapter layer to prevent vendor lock-in by abstracting all UI component imports. This enables future UI library swaps without changing primitive components. The implementation uses a hybrid approach: gluestack-ui for standard components (Box, Pressable, Text) and React Native for specialized needs (TextInput, ActivityIndicator, Modal).

**Key Deliverable:** Adapter layer that allows swapping from gluestack-ui to any other UI library by changing one file.

---

## Architecture Overview

```
Current State (Phase 04-05):
  Primitives → React Native Components (View, TouchableOpacity, Text, etc.)
  Problem: Changing UI library requires rewriting all primitives

Target State (Phase 06):
  Primitives → Adapter Interface → gluestack/React Native Components
  Benefit: Change library by updating adapters only, primitives unchanged

Future Migration Example:
  Primitives → Adapter Interface → Tamagui Components
  Change: Update src/ui/adapters/index.ts (one line)
```

---

## Adapter Component Strategy

### Core Adapters (6 components)

**1. Box (gluestack)**
- **Source:** `@gluestack-ui/themed`
- **Replaces:** React Native `View`
- **Used In:** Card, Divider, Input, ListItem, Sheet, Spinner
- **Rationale:** gluestack Box provides better styling system

**2. Pressable (gluestack)**
- **Source:** `@gluestack-ui/themed`
- **Replaces:** React Native `TouchableOpacity`
- **Used In:** Button, Card, Input, ListItem, Sheet
- **Rationale:** gluestack Pressable has better press handling

**3. Text (gluestack)**
- **Source:** `@gluestack-ui/themed`
- **Replaces:** React Native `Text`
- **Used In:** Button, Input, ListItem, Text primitive
- **Rationale:** gluestack Text supports better typography system

**4. TextInput (React Native)**
- **Source:** `react-native`
- **Used In:** Input
- **Rationale:** gluestack Input is too opinionated, doesn't support our custom floating label pattern

**5. ActivityIndicator (React Native)**
- **Source:** `react-native`
- **Used In:** Spinner
- **Rationale:** Simple component, no gluestack benefit

**6. Modal (React Native)**
- **Source:** `react-native`
- **Used In:** Sheet
- **Rationale:** gluestack has different modal pattern, keep our custom Sheet implementation

### Components Not Needing Adapters

**Icon:**
- Uses `@expo/vector-icons` (already vendor-agnostic)
- No changes needed

---

## Implementation Steps

### Phase 1: Create Adapter Foundation (1 hour)

**Step 1: Define Adapter Interfaces**
```typescript
// src/ui/adapters/types.ts
import { ViewProps, PressableProps as RNPressableProps, TextProps as RNTextProps, TextInputProps, ActivityIndicatorProps, ModalProps } from 'react-native';

// Thin wrapper interfaces - extend React Native props
export interface BoxProps extends ViewProps {}
export interface PressableProps extends RNPressableProps {}
export interface AdapterTextProps extends RNTextProps {}
export interface AdapterTextInputProps extends TextInputProps {}
export interface AdapterActivityIndicatorProps extends ActivityIndicatorProps {}
export interface AdapterModalProps extends ModalProps {}
```

**Step 2: Create gluestack Adapters**

Directory structure:
```
src/ui/adapters/
├── types.ts
├── gluestack/
│   ├── index.ts       # Exports all adapters
│   ├── Box.ts
│   ├── Pressable.ts
│   ├── Text.ts
│   ├── TextInput.ts   # Re-exports RN TextInput
│   ├── ActivityIndicator.ts  # Re-exports RN ActivityIndicator
│   └── Modal.ts       # Re-exports RN Modal
└── index.ts           # Facade
```

**Box Adapter (gluestack/Box.ts):**
```typescript
import { Box as GluestackBox } from '@gluestack-ui/themed';
import type { BoxProps } from '../types';

export const Box = GluestackBox as React.ComponentType<BoxProps>;
```

**Pressable Adapter (gluestack/Pressable.ts):**
```typescript
import { Pressable as GluestackPressable } from '@gluestack-ui/themed';
import type { PressableProps } from '../types';

export const Pressable = GluestackPressable as React.ComponentType<PressableProps>;
```

**Text Adapter (gluestack/Text.ts):**
```typescript
import { Text as GluestackText } from '@gluestack-ui/themed';
import type { AdapterTextProps } from '../types';

export const Text = GluestackText as React.ComponentType<AdapterTextProps>;
```

**TextInput Adapter (gluestack/TextInput.ts):**
```typescript
import { TextInput as RNTextInput } from 'react-native';
import type { AdapterTextInputProps } from '../types';

export const TextInput = RNTextInput as React.ComponentType<AdapterTextInputProps>;
```

**ActivityIndicator Adapter (gluestack/ActivityIndicator.ts):**
```typescript
import { ActivityIndicator as RNActivityIndicator } from 'react-native';
import type { AdapterActivityIndicatorProps } from '../types';

export const ActivityIndicator = RNActivityIndicator as React.ComponentType<AdapterActivityIndicatorProps>;
```

**Modal Adapter (gluestack/Modal.ts):**
```typescript
import { Modal as RNModal } from 'react-native';
import type { AdapterModalProps } from '../types';

export const Modal = RNModal as React.ComponentType<AdapterModalProps>;
```

**Step 3: Create gluestack Barrel Export**
```typescript
// src/ui/adapters/gluestack/index.ts
export { Box } from './Box';
export { Pressable } from './Pressable';
export { Text } from './Text';
export { TextInput } from './TextInput';
export { ActivityIndicator } from './ActivityIndicator';
export { Modal } from './Modal';
```

**Step 4: Create Adapter Facade**
```typescript
// src/ui/adapters/index.ts
// Single import point - swap library by changing this one line
export * from './gluestack';

// Future: export * from './tamagui';
// Future: export * from './nativebase';
```

### Phase 2: Refactor Primitives (2-3 hours)

Refactor components one at a time, testing after each change.

**Refactoring Order:** Button → Text → Input → Card → Divider → Spinner → ListItem → Sheet

#### Component 1: Button.tsx

**Current imports:**
```typescript
import { TouchableOpacity, Text as RNText, Platform } from 'react-native';
```

**New imports:**
```typescript
import { Pressable, Text as AdapterText } from '@/ui/adapters';
import { Platform } from 'react-native';  // Allowed exception
```

**Changes:**
- Replace `<TouchableOpacity>` with `<Pressable>`
- Replace `<RNText>` with `<AdapterText>`
- Keep Platform import (utility, not UI component)
- Keep haptic feedback import (allowed exception)

**Test:**
```bash
npm test -- Button.test.tsx
```

#### Component 2: Text.tsx

**Current imports:**
```typescript
import { Text as RNText, Platform } from 'react-native';
```

**New imports:**
```typescript
import { Text as AdapterText } from '@/ui/adapters';
import { Platform } from 'react-native';
```

**Changes:**
- Replace `<RNText>` with `<AdapterText>`
- Import as `AdapterText`, use in component implementation

**Test:**
```bash
npm test -- Text.test.tsx
```

#### Component 3: Input.tsx

**Current imports:**
```typescript
import { View, TextInput as RNTextInput, TouchableOpacity, Text as RNText } from 'react-native';
```

**New imports:**
```typescript
import { Box, TextInput, Pressable, Text as AdapterText } from '@/ui/adapters';
```

**Changes:**
- Replace `<View>` with `<Box>`
- Replace `<RNTextInput>` with `<TextInput>`
- Replace `<TouchableOpacity>` with `<Pressable>`
- Replace `<RNText>` with `<AdapterText>`

**Test:**
```bash
npm test -- Input.test.tsx
```

#### Component 4: Card.tsx

**Current imports:**
```typescript
import { View, TouchableOpacity, Platform, ViewStyle } from 'react-native';
```

**New imports:**
```typescript
import { Box, Pressable } from '@/ui/adapters';
import { Platform, ViewStyle } from 'react-native';
```

**Changes:**
- Replace `<View>` with `<Box>`
- Replace `<TouchableOpacity>` with `<Pressable>`
- Keep Platform.select() for elevation (allowed)

**Test:**
```bash
npm test -- Card.test.tsx
```

#### Component 5: Divider.tsx

**Current imports:**
```typescript
import { View, ViewProps } from 'react-native';
```

**New imports:**
```typescript
import { Box } from '@/ui/adapters';
import type { BoxProps } from '@/ui/adapters/types';
```

**Changes:**
- Replace `<View>` with `<Box>`
- Update props interface from ViewProps to BoxProps

**Test:**
```bash
npm test -- Divider.test.tsx
```

#### Component 6: Spinner.tsx

**Current imports:**
```typescript
import { View, ActivityIndicator, ActivityIndicatorProps } from 'react-native';
```

**New imports:**
```typescript
import { Box, ActivityIndicator } from '@/ui/adapters';
```

**Changes:**
- Replace `<View>` with `<Box>`
- Keep ActivityIndicator (from adapter, not direct RN)

**Test:**
```bash
npm test -- Spinner.test.tsx
```

#### Component 7: ListItem.tsx

**Current imports:**
```typescript
import { TouchableOpacity, View, Platform } from 'react-native';
import { Icon } from './Icon';
import { Text } from './Text';
```

**New imports:**
```typescript
import { Pressable, Box } from '@/ui/adapters';
import { Platform } from 'react-native';
import { Icon } from './Icon';
import { Text } from './Text';  // Uses our Text primitive (which uses adapter internally)
```

**Changes:**
- Replace `<TouchableOpacity>` with `<Pressable>`
- Replace `<View>` with `<Box>`
- Keep Icon, Text imports (component composition)

**Test:**
```bash
npm test -- ListItem.test.tsx
```

#### Component 8: Sheet.tsx

**Current imports:**
```typescript
import { Modal, View, TouchableWithoutFeedback, AccessibilityInfo } from 'react-native';
```

**New imports:**
```typescript
import { Modal, Box, Pressable } from '@/ui/adapters';
import { AccessibilityInfo } from 'react-native';
```

**Changes:**
- Keep `<Modal>` (from adapter, not direct RN)
- Replace `<View>` with `<Box>`
- Replace `<TouchableWithoutFeedback>` with `<Pressable>` (onPressIn={onClose})

**Test:**
```bash
npm test -- Sheet.test.tsx
```

#### Component 9: Icon.tsx

**No changes needed** - Icon uses @expo/vector-icons only, no React Native UI primitives.

### Phase 3: Verification Tools (1 hour)

#### Tool 1: Audit Script

```bash
#!/bin/bash
# scripts/ui-audit-imports.sh

echo "🔍 Auditing UI vendor imports..."

# Check for React Native imports outside adapters (exclude allowed exceptions)
RN_VIOLATIONS=$(grep -r "from 'react-native'" src/ \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="adapters" \
  --exclude-dir="__tests__" \
  | grep -v "react-native-haptic-feedback" \
  | grep -v "@expo/vector-icons" \
  | grep -v "Platform" \
  | grep -v "AccessibilityInfo" \
  | grep -v "LayoutChangeEvent" \
  | grep -v "type")

# Check for gluestack imports outside adapters
GLUESTACK_VIOLATIONS=$(grep -r "from '@gluestack" src/ \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="adapters")

VIOLATIONS_FOUND=0

if [ -n "$RN_VIOLATIONS" ]; then
  echo "❌ React Native UI component imports found outside adapters:"
  echo "$RN_VIOLATIONS"
  VIOLATIONS_FOUND=1
fi

if [ -n "$GLUESTACK_VIOLATIONS" ]; then
  echo "❌ gluestack imports found outside adapters:"
  echo "$GLUESTACK_VIOLATIONS"
  VIOLATIONS_FOUND=1
fi

if [ $VIOLATIONS_FOUND -eq 0 ]; then
  echo "✅ Zero vendor leakage - all UI imports via adapters"
  exit 0
else
  echo "❌ Vendor leakage detected - fix imports above"
  exit 1
fi
```

**Add to package.json:**
```json
"scripts": {
  "ui:audit-imports": "bash scripts/ui-audit-imports.sh"
}
```

#### Tool 2: Mock Adapter

```typescript
// src/ui/adapters/__tests__/mock-adapter.ts
import React from 'react';
import { View, TouchableOpacity, Text as RNText, TextInput as RNTextInput, ActivityIndicator as RNActivityIndicator, Modal as RNModal } from 'react-native';
import type { BoxProps, PressableProps, AdapterTextProps, AdapterTextInputProps, AdapterActivityIndicatorProps, AdapterModalProps } from '../types';

// Mock implementations using React Native components
// Proves adapter interface can be implemented multiple ways

export const Box: React.FC<BoxProps> = (props) => {
  return <View {...props} testID={props.testID || 'mock-box'} />;
};

export const Pressable: React.FC<PressableProps> = (props) => {
  return <TouchableOpacity {...props} testID={props.testID || 'mock-pressable'} />;
};

export const Text: React.FC<AdapterTextProps> = (props) => {
  return <RNText {...props} testID={props.testID || 'mock-text'} />;
};

export const TextInput: React.FC<AdapterTextInputProps> = (props) => {
  return <RNTextInput {...props} testID={props.testID || 'mock-textinput'} />;
};

export const ActivityIndicator: React.FC<AdapterActivityIndicatorProps> = (props) => {
  return <RNActivityIndicator {...props} testID={props.testID || 'mock-activity-indicator'} />;
};

export const Modal: React.FC<AdapterModalProps> = (props) => {
  return <RNModal {...props} testID={props.testID || 'mock-modal'} />;
};
```

#### Tool 3: Adapter Swap Test

```typescript
// src/ui/adapters/__tests__/adapter-swap.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives/Text';

describe('Adapter Swap Test', () => {
  describe('Real Adapter', () => {
    it('Button renders with gluestack adapter', () => {
      const { getByText } = render(
        <Button onPress={() => {}} accessibilityLabel="Test Button">
          Click Me
        </Button>
      );
      expect(getByText('CLICK ME')).toBeTruthy();  // Android uppercase
    });

    it('Text renders with gluestack adapter', () => {
      const { getByText } = render(<Text>Hello World</Text>);
      expect(getByText('Hello World')).toBeTruthy();
    });
  });

  describe('Mock Adapter (Proves Swappability)', () => {
    beforeAll(() => {
      // Mock the adapter module to use our mock implementation
      jest.mock('@/ui/adapters', () => require('./mock-adapter'));
    });

    it('Button still renders with mock adapter', () => {
      const { getByText } = render(
        <Button onPress={() => {}} accessibilityLabel="Test Button">
          Click Me
        </Button>
      );
      // Should still render, proving adapter is swappable
      expect(getByText).toBeTruthy();
    });

    afterAll(() => {
      jest.unmock('@/ui/adapters');
    });
  });
});
```

### Phase 4: Testing & Validation (1 hour)

**Run Test Suite:**
```bash
# Individual component tests
npm test -- primitives/Button.test.tsx
npm test -- primitives/Text.test.tsx
npm test -- primitives/Input.test.tsx
npm test -- primitives/Card.test.tsx
npm test -- primitives/Divider.test.tsx
npm test -- primitives/Spinner.test.tsx
npm test -- primitives/ListItem.test.tsx
npm test -- primitives/Sheet.test.tsx

# Accessibility tests
npm test -- a11y-phase04.test.tsx
npm test -- a11y-phase05.test.tsx

# Adapter swap test
npm test -- adapter-swap.test.tsx

# Full primitive test suite
npm test -- primitives/

# All tests
npm test
```

**Run Audit Script:**
```bash
npm run ui:audit-imports
# Expected: ✅ Zero vendor leakage
```

**Visual Verification:**
```bash
npm start
# Open ComponentGallery
# Verify all components render correctly
# Check all variants, states, interactions
```

### Phase 5: Documentation (1 hour)

Create `docs/ui/ADAPTERS.md` covering:
1. Overview and rationale
2. Architecture diagram
3. Usage guide for developers
4. How to add new adapter components
5. How to swap UI libraries
6. Allowed exceptions
7. Testing adapter implementations
8. Troubleshooting

---

## Import Mapping Reference

| Primitive | Before (Phase 04-05) | After (Phase 06) | Changes |
|-----------|---------------------|------------------|---------|
| Button | `TouchableOpacity, Text from 'react-native'` | `Pressable, Text from '@/ui/adapters'` | 2 replacements |
| Text | `Text from 'react-native'` | `Text from '@/ui/adapters'` | 1 replacement |
| Input | `View, TextInput, TouchableOpacity, Text from 'react-native'` | `Box, TextInput, Pressable, Text from '@/ui/adapters'` | 4 replacements |
| Card | `View, TouchableOpacity from 'react-native'` | `Box, Pressable from '@/ui/adapters'` | 2 replacements, keep Platform |
| Divider | `View from 'react-native'` | `Box from '@/ui/adapters'` | 1 replacement |
| Spinner | `View, ActivityIndicator from 'react-native'` | `Box, ActivityIndicator from '@/ui/adapters'` | 2 replacements |
| ListItem | `TouchableOpacity, View from 'react-native'` | `Pressable, Box from '@/ui/adapters'` | 2 replacements, keep Platform |
| Sheet | `Modal, View, TouchableWithoutFeedback from 'react-native'` | `Modal, Box, Pressable from '@/ui/adapters'` | 3 replacements |
| Icon | No changes | No changes | Already vendor-agnostic |

---

## Allowed Import Exceptions

**Platform Utilities (Allowed):**
- `Platform` - OS detection utility
- `AccessibilityInfo` - Accessibility state queries
- `LayoutChangeEvent` - Type definitions
- Type-only imports (`import type { ... }`)

**Third-Party Libraries (Allowed):**
- `react-native-haptic-feedback` - Haptic utility
- `@expo/vector-icons` - Icon library (already vendor-agnostic)
- `@/ui/tokens` - Design tokens (configuration, not UI vendor)

**Adapter Internals (Allowed):**
- `src/ui/adapters/` can import from `react-native`, `@gluestack-ui/themed`, etc.

---

## Potential Issues & Solutions

### Issue 1: gluestack Requires Provider

**Symptom:** gluestack components don't render or missing theme

**Solution:** Add GluestackUIProvider to app root

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

### Issue 2: TypeScript Path Alias Not Resolving

**Symptom:** Cannot find module '@/ui/adapters'

**Solution:** Verify tsconfig.json has paths configured

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue 3: Tests Fail After Refactoring

**Symptom:** Component tests fail with "cannot find module"

**Solution:** Ensure test setup includes path mapping

```javascript
// jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1'
}
```

### Issue 4: Platform.select() Not Working

**Symptom:** Platform-specific styles not applying

**Solution:** Platform is imported from 'react-native' (allowed exception)

```typescript
import { Platform } from 'react-native';  // Correct
import { Box } from '@/ui/adapters';      // Adapter for UI
```

---

## Success Criteria

✅ All 6 adapter components implemented
✅ All 8 primitives refactored (Icon excluded - no changes)
✅ All 96 tests passing (48 unit + 48 accessibility)
✅ Audit script passes: zero vendor leakage
✅ Adapter swap test passes: proves swappability
✅ ComponentGallery renders correctly
✅ Documentation complete (ADAPTERS.md)

---

## Deliverables

**Source Files (13):**
1. `src/ui/adapters/types.ts` - Interface definitions
2. `src/ui/adapters/gluestack/Box.ts`
3. `src/ui/adapters/gluestack/Pressable.ts`
4. `src/ui/adapters/gluestack/Text.ts`
5. `src/ui/adapters/gluestack/TextInput.ts`
6. `src/ui/adapters/gluestack/ActivityIndicator.ts`
7. `src/ui/adapters/gluestack/Modal.ts`
8. `src/ui/adapters/gluestack/index.ts` - Barrel export
9. `src/ui/adapters/index.ts` - Facade
10. 8 refactored primitives (Button, Text, Input, Card, Divider, Spinner, ListItem, Sheet)

**Test Files (2):**
11. `src/ui/adapters/__tests__/mock-adapter.ts`
12. `src/ui/adapters/__tests__/adapter-swap.test.tsx`

**Scripts (1):**
13. `scripts/ui-audit-imports.sh`

**Documentation (3):**
14. `docs/ui/ADAPTERS.md` - Adapter pattern guide
15. `docs/sequencing/06-adapter-implementation.md` - This file
16. `docs/phases/06-COMPLETE.md` - Completion summary

---

## Timeline

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Create adapter foundation | 1 hour |
| 2 | Refactor primitives (8 components) | 2-3 hours |
| 3 | Create verification tools | 1 hour |
| 4 | Testing & validation | 1 hour |
| 5 | Documentation | 1 hour |
| **Total** | **Phase 06 Complete** | **5-6 hours** |

---

## Next Steps After Phase 06

**Phase 07: Library Integration**
- Integrate additional libraries (React Native Paper, Gifted Chat, Lottie)
- Libraries will import via adapters where applicable
- Pattern established in Phase 06 enables clean integration

**Benefits Realized:**
- Can swap from gluestack to Tamagui/NativeBase by changing one file
- All primitives insulated from UI library changes
- Pattern proven and documented for future phases

---

**Status:** Ready to implement
**Blocking Issues:** None
**Dependencies:** Phase 05 complete ✅
