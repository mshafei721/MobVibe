# Phase 50: Dark Mode

## Overview
Implement comprehensive dark theme with system preference detection, manual toggle, and consistent styling across all screens.

**Duration:** 2 days
**Dependencies:** [49]
**Owners:** Frontend Engineer, UI/UX Designer
**MCP Tools:** websearch: true, context7: true, sequentialthinking: true

## Objectives
- Dark theme implementation
- System preference detection
- Manual toggle in settings
- Consistent across all screens

## Technical Approach

### Theme System Design
```typescript
// types/theme.ts
export type ColorScheme = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };

  // Surface colors (cards, modals)
  surface: {
    primary: string;
    secondary: string;
    elevated: string;
  };

  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
  };

  // Border colors
  border: {
    primary: string;
    secondary: string;
    focus: string;
  };

  // Brand colors (consistent across themes)
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };

  // Semantic colors
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  // Shadows (for elevation)
  shadow: string;
}

export interface Theme {
  id: ColorScheme;
  colors: ThemeColors;
}
```

### Implementation Steps

#### 1. Theme Configuration (3h)
```typescript
// config/themes.ts
export const lightTheme: Theme = {
  id: 'light',
  colors: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#F3F4F6',
    },
    surface: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      elevated: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      disabled: '#D1D5DB',
      inverse: '#FFFFFF',
    },
    border: {
      primary: '#E5E7EB',
      secondary: '#D1D5DB',
      focus: '#8B5CF6',
    },
    brand: {
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      accent: '#A78BFA',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
};

export const darkTheme: Theme = {
  id: 'dark',
  colors: {
    background: {
      primary: '#111827',
      secondary: '#1F2937',
      tertiary: '#374151',
    },
    surface: {
      primary: '#1F2937',
      secondary: '#374151',
      elevated: '#4B5563',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      tertiary: '#9CA3AF',
      disabled: '#6B7280',
      inverse: '#111827',
    },
    border: {
      primary: '#374151',
      secondary: '#4B5563',
      focus: '#A78BFA',
    },
    brand: {
      primary: '#A78BFA',
      secondary: '#8B5CF6',
      accent: '#C4B5FD',
    },
    semantic: {
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};
```

#### 2. Theme Context & Hook (3h)
```typescript
// contexts/ThemeContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextValue {
  theme: Theme;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('auto');
  const [loaded, setLoaded] = useState(false);

  // Load saved preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme_preference');
      if (saved) {
        setColorSchemeState(saved as ColorScheme);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setLoaded(true);
    }
  };

  // Save preference when changed
  const setColorScheme = async (scheme: ColorScheme) => {
    try {
      await AsyncStorage.setItem('theme_preference', scheme);
      setColorSchemeState(scheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Determine effective theme
  const effectiveScheme = colorScheme === 'auto'
    ? systemColorScheme || 'light'
    : colorScheme;

  const isDark = effectiveScheme === 'dark';
  const theme = isDark ? themes.dark : themes.light;

  if (!loaded) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorScheme,
        setColorScheme,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Convenience hook for colors
export function useColors() {
  const { theme } = useTheme();
  return theme.colors;
}
```

#### 3. Themed Components & Utilities (4h)
```typescript
// components/themed/ThemedView.tsx
import { View, ViewProps } from 'react-native';
import { useColors } from '../../contexts/ThemeContext';

interface ThemedViewProps extends ViewProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'surface';
}

export function ThemedView({ variant = 'primary', style, ...props }: ThemedViewProps) {
  const colors = useColors();

  const backgroundColor = {
    primary: colors.background.primary,
    secondary: colors.background.secondary,
    tertiary: colors.background.tertiary,
    surface: colors.surface.primary,
  }[variant];

  return <View style={[{ backgroundColor }, style]} {...props} />;
}

// components/themed/ThemedText.tsx
import { Text, TextProps } from 'react-native';
import { useColors } from '../../contexts/ThemeContext';

interface ThemedTextProps extends TextProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'inverse';
}

export function ThemedText({ variant = 'primary', style, ...props }: ThemedTextProps) {
  const colors = useColors();

  const color = {
    primary: colors.text.primary,
    secondary: colors.text.secondary,
    tertiary: colors.text.tertiary,
    inverse: colors.text.inverse,
  }[variant];

  return <Text style={[{ color }, style]} {...props} />;
}

// components/themed/ThemedCard.tsx
export function ThemedCard({ children, style, ...props }: ViewProps) {
  const colors = useColors();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface.primary,
          borderColor: colors.border.primary,
          borderWidth: 1,
          borderRadius: 12,
          padding: 16,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// utils/themedStyles.ts
export function createThemedStyles<T extends Record<string, any>>(
  styles: (colors: ThemeColors) => T
) {
  return () => {
    const colors = useColors();
    return styles(colors);
  };
}

// Example usage:
const useStyles = createThemedStyles((colors) => ({
  container: {
    backgroundColor: colors.background.primary,
    padding: 16,
  },
  title: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
}));
```

#### 4. NativeWind Dark Mode Integration (3h)
```typescript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media' for system preference only
  content: [
    './App.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom brand colors
        brand: {
          primary: '#8B5CF6',
          secondary: '#7C3AED',
          accent: '#A78BFA',
        },
      },
    },
  },
  plugins: [],
};

// App.tsx - Root wrapper
import { useColorScheme } from 'nativewind';

function AppWrapper() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { colorScheme: themeScheme } = useTheme();

  // Sync NativeWind with theme context
  useEffect(() => {
    const effectiveScheme = themeScheme === 'auto'
      ? Appearance.getColorScheme()
      : themeScheme;

    setColorScheme(effectiveScheme === 'dark' ? 'dark' : 'light');
  }, [themeScheme]);

  return <App />;
}

// Example component using NativeWind with dark mode
export function ExampleScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <Text className="text-gray-900 dark:text-white text-2xl font-bold">
        Hello Dark Mode
      </Text>

      <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <Text className="text-gray-700 dark:text-gray-300">
          This card adapts to dark mode
        </Text>
      </View>
    </View>
  );
}
```

#### 5. Settings Screen Integration (3h)
```typescript
// screens/SettingsScreen.tsx
export function SettingsScreen() {
  const { colorScheme, setColorScheme, isDark } = useTheme();

  const themeOptions: Array<{ label: string; value: ColorScheme }> = [
    { label: 'Auto (System)', value: 'auto' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];

  return (
    <ThemedView variant="primary" className="flex-1">
      <ThemedView variant="surface" className="p-4 mb-4">
        <ThemedText variant="primary" className="text-lg font-bold mb-4">
          Appearance
        </ThemedText>

        {/* Theme Selection */}
        <View className="space-y-2">
          {themeOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setColorScheme(option.value)}
              className={`flex-row items-center p-4 rounded-lg border ${
                colorScheme === option.value
                  ? 'border-brand-primary bg-brand-primary/10'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            >
              <View className="flex-1">
                <Text className={`font-medium ${
                  colorScheme === option.value
                    ? 'text-brand-primary'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {option.label}
                </Text>

                {option.value === 'auto' && (
                  <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Currently: {isDark ? 'Dark' : 'Light'}
                  </Text>
                )}
              </View>

              {/* Checkmark */}
              {colorScheme === option.value && (
                <CheckIcon size={20} color="#8B5CF6" />
              )}
            </Pressable>
          ))}
        </View>

        {/* Preview */}
        <View className="mt-6">
          <ThemedText variant="secondary" className="text-sm mb-2">
            Preview
          </ThemedText>

          <ThemedCard>
            <ThemedText variant="primary" className="font-bold mb-2">
              Sample Card
            </ThemedText>
            <ThemedText variant="secondary">
              This is how your app will look with the selected theme.
            </ThemedText>
          </ThemedCard>
        </View>
      </ThemedView>
    </ThemedView>
  );
}
```

#### 6. Update All Screens (4h)
```typescript
// Migration checklist for existing screens:

// 1. Replace hardcoded colors with theme-aware alternatives
// Before:
<View style={{ backgroundColor: '#FFFFFF' }}>
  <Text style={{ color: '#111827' }}>Hello</Text>
</View>

// After (using themed components):
<ThemedView variant="primary">
  <ThemedText variant="primary">Hello</ThemedText>
</ThemedView>

// After (using NativeWind):
<View className="bg-white dark:bg-gray-900">
  <Text className="text-gray-900 dark:text-white">Hello</Text>
</View>

// 2. Update status bar
import { StatusBar } from 'expo-status-bar';

export function Screen() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Screen content */}
    </>
  );
}

// 3. Update navigation theme
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';

export function Navigation() {
  const { isDark } = useTheme();

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      {/* Navigators */}
    </NavigationContainer>
  );
}

// 4. Update WebView backgrounds
<WebView
  source={{ uri: previewUrl }}
  style={{ backgroundColor: isDark ? '#111827' : '#FFFFFF' }}
/>

// 5. Update modal overlays
<Modal transparent>
  <View className="flex-1 bg-black/50 dark:bg-black/70">
    {/* Modal content */}
  </View>
</Modal>
```

## Key Tasks

### Theme System
- [ ] Define light theme colors
- [ ] Define dark theme colors
- [ ] Create ThemeContext
- [ ] Build useTheme hook
- [ ] System preference detection
- [ ] Persist user preference

### Themed Components
- [ ] ThemedView component
- [ ] ThemedText component
- [ ] ThemedCard component
- [ ] ThemedButton component
- [ ] Update all primitives

### NativeWind Integration
- [ ] Configure Tailwind dark mode
- [ ] Update tailwind.config.js
- [ ] Sync with theme context
- [ ] Test dark: variants

### Screen Updates
- [ ] Update HomeScreen
- [ ] Update CodingScreen
- [ ] Update PreviewScreen
- [ ] Update ProjectListScreen
- [ ] Update SettingsScreen
- [ ] Update all modals
- [ ] Update navigation theme
- [ ] Update status bar

### Testing
- [ ] Visual regression tests
- [ ] System preference changes
- [ ] Manual toggle works
- [ ] Persistence works
- [ ] All screens consistent

## Acceptance Criteria
- [ ] System dark mode detected
- [ ] Manual toggle in settings
- [ ] Preference persists across sessions
- [ ] All screens support dark mode
- [ ] No hardcoded colors remain
- [ ] Smooth theme transitions
- [ ] Status bar updates correctly
- [ ] Navigation theme updates
- [ ] Modals/overlays themed
- [ ] WebView backgrounds match

## Testing Strategy

### Visual Regression Tests
```typescript
describe('Dark Mode', () => {
  it('renders light theme correctly', async () => {
    const { getByText } = render(
      <ThemeProvider initialScheme="light">
        <HomeScreen />
      </ThemeProvider>
    );

    const screenshot = await takeScreenshot();
    expect(screenshot).toMatchImageSnapshot();
  });

  it('renders dark theme correctly', async () => {
    const { getByText } = render(
      <ThemeProvider initialScheme="dark">
        <HomeScreen />
      </ThemeProvider>
    );

    const screenshot = await takeScreenshot();
    expect(screenshot).toMatchImageSnapshot();
  });

  it('switches themes dynamically', async () => {
    const { getByText, rerender } = render(
      <ThemeProvider initialScheme="light">
        <SettingsScreen />
      </ThemeProvider>
    );

    fireEvent.press(getByText('Dark'));

    await waitFor(() => {
      expect(getByTestId('theme-preview')).toHaveStyle({
        backgroundColor: '#1F2937',
      });
    });
  });
});
```

### Integration Tests
- System preference change → Theme updates
- Manual toggle → Saves preference
- App restart → Loads saved theme
- Screen navigation → Theme persists

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missed hardcoded colors | Medium | Comprehensive audit, linting rules |
| System detection fails | Low | Fallback to light theme |
| Performance issues | Low | Memoization, efficient context |
| Inconsistent theming | High | Centralized theme config, tests |

## Success Metrics
- Theme consistency score: 100%
- Zero hardcoded colors
- Theme switch latency: <100ms
- User adoption of dark mode: >60%
- Accessibility contrast: WCAG AA compliant

## Future Enhancements
- Multiple theme variants (e.g., AMOLED black)
- Custom accent color picker
- Scheduled theme switching (e.g., sunset/sunrise)
- Per-app theming
- High contrast mode
- Accessibility presets
