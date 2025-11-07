# Phase 07: Library Integration Research

**Date:** 2025-11-06
**Phase:** 07 - Selective Library Integration
**Libraries:** React Native Paper, Gifted Chat, Lottie

---

## Research Summary

This document compiles research findings from web searches and official documentation for integrating React Native Paper, Gifted Chat, and Lottie React Native into MobVibe Phase 07.

---

## React Native Paper

**Library:** `/callstack/react-native-paper`
**Latest Version:** Material Design 3 (MD3)
**Trust Score:** 10/10
**Code Snippets Available:** 848

### Key Findings

**1. Theming System**
- MD3 (Material You) is default theme when no theme prop provided to PaperProvider
- Custom theming via extending `MD3LightTheme` or `MD3DarkTheme`
- Theme object supports custom properties and nested color overrides
- Built-in `useTheme()` hook for accessing theme in components
- `withTheme` HOC available for class components

**2. Token Integration Strategy**
```typescript
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { tokens } from '@/ui/tokens';

const paperTheme = {
  ...MD3LightTheme,
  roundness: tokens.borderRadius.md,
  colors: {
    ...MD3LightTheme.colors,
    primary: tokens.colors.brand.primary,
    secondary: tokens.colors.brand.secondary,
    // Map all token colors to Paper theme
  },
};

// Wrap app with provider
<PaperProvider theme={paperTheme}>
  <App />
</PaperProvider>
```

**3. TypeScript Support**
- TypeScript support limited to MD3 theme only
- Global augmentation pattern for custom theme properties:
```typescript
declare global {
  namespace ReactNativePaper {
    interface ThemeColors {
      myOwnColor: string;
    }
    interface Theme {
      myOwnProperty: boolean;
    }
  }
}
```

**4. Component Theming**
- Components can override global theme with local theme prop
- Font customization via `fonts` property in theme
- Letter spacing control via `typescale` property

**5. React Navigation Integration**
- `adaptNavigationTheme` utility for merging Paper + Navigation themes
- Use `deepmerge` library for combining themes
```typescript
import { adaptNavigationTheme } from 'react-native-paper';
import merge from 'deepmerge';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedTheme = merge(MD3LightTheme, LightTheme);
```

**6. Selective Component Usage**
- Cherry-pick only needed components (FAB, Chip, Badge, ProgressBar)
- Tree-shakable exports reduce bundle size
- Avoid duplicating existing primitives (use Paper only for Material-specific features)

**7. Installation**
```bash
npm install react-native-paper
```

---

## React Native Gifted Chat

**Library:** `/faridsafi/react-native-gifted-chat`
**Latest Stable:** v2.6.5
**Trust Score:** 9.6/10
**Code Snippets Available:** 16

### Key Findings

**1. Customization Capabilities**
- Fully customizable components: chat bubbles, backgrounds, input
- Custom parse patterns for linking message content
- Customizable input toolbar, message bubbles, system messages
- Support for text, images, videos, audio messages
- Quick replies (radio/checkbox types)

**2. Dependencies**
```bash
npm install react-native-gifted-chat react-native-reanimated react-native-keyboard-controller
# Or with Expo
npx expo install react-native-gifted-chat react-native-reanimated react-native-keyboard-controller
```

**3. Message Object Structure**
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

**4. Theming Integration**
```typescript
import { GiftedChat } from 'react-native-gifted-chat';
import { tokens } from '@/ui/tokens';

<GiftedChat
  theme={{
    colors: {
      primary: tokens.colors.brand.primary,
      background: tokens.colors.neutral[50],
      inputBackground: tokens.colors.neutral[100],
      // Map tokens to chat theme
    },
  }}
/>
```

**5. Performance Considerations**
- v2.6.5 most stable version
- Work in progress for performance improvements
- Keyboard handling requires configuration:
  - Android: `windowSoftInputMode="adjustResize"` in AndroidManifest.xml
  - Alternative: `KeyboardAvoidingView` wrapper for Android

**6. Custom Parse Patterns**
```typescript
<GiftedChat
  parsePatterns={(linkStyle) => [
    { type: 'phone', style: linkStyle, onPress: onPressPhoneNumber },
    { pattern: /#(\w+)/, style: { ...linkStyle, ...styles.hashtag }, onPress: onPressHashtag },
  ]}
/>
```

**7. Redux Integration**
- Control input text externally via `text` and `onInputTextChanged` props
- Enables state management integration

**8. Quick Replies**
```typescript
interface QuickReplies {
  type: 'radio' | 'checkbox';
  values: Reply[];
  keepIt?: boolean;
}
```

---

## Lottie React Native

**Library:** `/lottie-react-native/lottie-react-native`
**Trust Score:** 5.7/10
**Code Snippets Available:** 49

### Key Findings

**1. Basic Usage**
```tsx
import LottieView from 'lottie-react-native';

<LottieView
  source={require('./path/to/animation.json')}
  autoPlay
  loop
  style={{ width: 200, height: 200 }}
/>
```

**2. Performance Best Practices (2025)**
- **Rendering Modes:** CPU vs GPU
  - Use `renderMode="GPU"` for better performance
- **File Size Optimization:**
  - Keep animations small and focused
  - Use tools like Bodymovin to optimize/compress JSON
  - Reduce frame count for lower memory usage
  - NEW: `.lottie` format (compressed) instead of `.json`
- **Multiple Instances:** FPS drops when displaying many Lottie animations simultaneously
- **Version 6 Updates:** Check migration guide for breaking changes

**3. Reduced Motion Support**
```tsx
import { AccessibilityInfo } from 'react-native';

const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
    setPrefersReducedMotion(enabled);
  });
}, []);

<LottieView
  source={require('./animation.json')}
  autoPlay={!prefersReducedMotion}
  loop={!prefersReducedMotion}
/>
```

**4. Programmatic Control**
```tsx
import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

const animationProgress = useRef(new Animated.Value(0));

useEffect(() => {
  Animated.timing(animationProgress.current, {
    toValue: 1,
    duration: 5000,
    easing: Easing.linear,
    useNativeDriver: false, // Lottie doesn't support native driver
  }).start();
}, []);

<AnimatedLottieView
  source={require('./animation.json')}
  progress={animationProgress.current}
/>
```

**5. Color Filters (Dynamic Theming)**
```tsx
<LottieView
  source={require('./animation.json')}
  colorFilters={[
    {
      keypath: 'button',
      color: '#FF0000',
    },
    {
      keypath: 'Sending Loader',
      color: tokens.colors.brand.primary,
    },
  ]}
  autoPlay
  loop
/>
```

**6. Asset Management**
- **iOS:** Add images to Xcode Resources folder
- **Android:** Create subfolder in `android/app/src/main/assets/`
  - Use `imageAssetsFolder` prop: `imageAssetsFolder={'lottie/animation_1'}`
- Ensure consistency between JSON asset IDs and file names

**7. Layout Considerations (v6)**
```tsx
// Set explicit dimensions
<LottieView
  source={...}
  style={{ width: '100%', aspectRatio: 16/9 }}
/>
```

**8. Installation**
```bash
npm install lottie-react-native
```

---

## Integration Strategy

### Adapter Pattern Application

**1. React Native Paper Adapter**
- Create `src/ui/adapters/paper/` directory
- Wrap selective components (FAB, Chip, Badge, ProgressBar)
- Export via `src/ui/adapters/paper/index.ts`
- Add to main adapter facade

**2. Gifted Chat Adapter**
- Create `src/ui/components/Chat.tsx` wrapper
- Apply token theming in wrapper
- Create `src/ui/adapters/gifted-chat/index.ts`
- Export themed Chat component

**3. Lottie Adapter**
- Create `src/ui/components/Animation.tsx` centralized component
- Implement reduced motion support
- Apply color filters for dynamic theming
- Create `src/ui/adapters/lottie/index.ts`

### Bundle Size Control

**Targets:**
- ≤ 10% increase from Phase 06 baseline
- Tree-shake unused Paper components
- Use `.lottie` format for animations (smaller than JSON)
- Lazy load Gifted Chat (only when chat screen accessed)

### Duplicate Prevention

**Audit Strategy:**
- Compare Paper components with existing primitives
- Use Paper only for Material-specific features (Android-forward screens)
- Create `ui:audit-duplicates` script
- Document which Paper components are safe to use

---

## Implementation Order

1. **Paper Integration** (highest priority - needed for Android screens)
2. **Lottie Integration** (medium priority - loading/success states)
3. **Gifted Chat Integration** (lower priority - future feature)

---

## Testing Requirements

**Paper:**
- Theme mapping correct (tokens → Paper theme)
- Components render with custom theme
- No conflicts with existing primitives

**Gifted Chat:**
- Theme colors match token system
- Message rendering performance
- Keyboard handling on Android

**Lottie:**
- Reduced motion respected
- Color filters apply correctly
- Animation performance (60 FPS target)
- Multiple instances performance

---

## References

- [React Native Paper Docs](https://callstack.github.io/react-native-paper/)
- [Gifted Chat GitHub](https://github.com/FaridSafi/react-native-gifted-chat)
- [Lottie React Native GitHub](https://github.com/lottie-react-native/lottie-react-native)
- [Phase 06 Adapter Pattern](../phases/06-COMPLETE.md)
- [UI Framework Integration Plan](../../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md)

---

**Status:** Research Complete
**Next:** Create sequential thinking implementation plan
