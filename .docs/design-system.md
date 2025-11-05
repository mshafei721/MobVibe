<!--
Status: stable
Owner: MobVibe Core Team
Last updated: 2025-11-05
Related: features-and-journeys.md, UX-CHANGES.md, vibecode/native_ui.md
-->

# MobVibe Design System

> Native iOS & Android design system with platform-specific patterns

> See [SUMMARY.md](../SUMMARY.md) for complete documentation index.

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Design Tokens](#design-tokens)
3. [Typography](#typography)
4. [Component Library](#component-library)
5. [Platform-Specific Patterns](#platform-specific-patterns)
6. [Navigation Patterns](#navigation-patterns)
7. [Interaction Patterns](#interaction-patterns)
8. [Accessibility](#accessibility)

---

## Design Philosophy

### Core Principles

**1. Native First**
- Feel native to each platform (iOS/Android)
- Respect platform guidelines (HIG/Material Design)
- Use platform-specific components when appropriate

**2. Consistency with Flexibility**
- Unified design language across platforms
- Platform-appropriate adaptations
- Consistent user experience, native implementation

**3. Performance Optimized**
- Smooth 60fps animations
- Instant feedback to user actions
- Optimized for mobile devices

**4. Accessible by Default**
- WCAG 2.1 AA compliance
- Screen reader support
- High contrast modes

---

## Design Tokens

### Color System

```typescript
// Base Colors
export const colors = {
  // Primary (Brand)
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Main brand color
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  // Secondary (Accent)
  secondary: {
    50: '#F3E5F5',
    100: '#E1BEE7',
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#9C27B0', // Accent color
    600: '#8E24AA',
    700: '#7B1FA2',
    800: '#6A1B9A',
    900: '#4A148C',
  },

  // Success
  success: {
    light: '#81C784',
    main: '#4CAF50',
    dark: '#388E3C',
  },

  // Error
  error: {
    light: '#E57373',
    main: '#F44336',
    dark: '#D32F2F',
  },

  // Warning
  warning: {
    light: '#FFB74D',
    main: '#FF9800',
    dark: '#F57C00',
  },

  // Info
  info: {
    light: '#64B5F6',
    main: '#2196F3',
    dark: '#1976D2',
  },

  // Neutrals
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Semantic Colors
  background: {
    light: '#FFFFFF',
    dark: '#121212',
  },
  surface: {
    light: '#FFFFFF',
    dark: '#1E1E1E',
  },
  text: {
    primary: {
      light: 'rgba(0, 0, 0, 0.87)',
      dark: 'rgba(255, 255, 255, 0.87)',
    },
    secondary: {
      light: 'rgba(0, 0, 0, 0.60)',
      dark: 'rgba(255, 255, 255, 0.60)',
    },
    disabled: {
      light: 'rgba(0, 0, 0, 0.38)',
      dark: 'rgba(255, 255, 255, 0.38)',
    },
  },

  // Coding Session Specific
  code: {
    background: '#1E1E1E',
    text: '#D4D4D4',
    comment: '#6A9955',
    keyword: '#569CD6',
    string: '#CE9178',
    function: '#DCDCAA',
  },

  // Status Colors
  status: {
    pending: '#FFA726',
    active: '#66BB6A',
    completed: '#42A5F5',
    failed: '#EF5350',
  },
};
```

### Spacing System

```typescript
// 8px base unit system
export const spacing = {
  0: 0,
  1: 4,    // 0.25rem
  2: 8,    // 0.5rem
  3: 12,   // 0.75rem
  4: 16,   // 1rem
  5: 20,   // 1.25rem
  6: 24,   // 1.5rem
  8: 32,   // 2rem
  10: 40,  // 2.5rem
  12: 48,  // 3rem
  16: 64,  // 4rem
  20: 80,  // 5rem
  24: 96,  // 6rem
};
```

### Border Radius

```typescript
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};
```

### Shadows

```typescript
export const shadows = {
  // iOS-style shadows
  ios: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },

  // Material Design shadows
  material: {
    1: { elevation: 1 },
    2: { elevation: 2 },
    3: { elevation: 3 },
    4: { elevation: 4 },
    6: { elevation: 6 },
    8: { elevation: 8 },
    12: { elevation: 12 },
    16: { elevation: 16 },
    24: { elevation: 24 },
  },
};
```

---

## Typography

### Font System

```typescript
export const typography = {
  // iOS: San Francisco / Android: Roboto
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
    }),
    mono: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
    }),
  },

  // Type Scale
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### Text Styles

```typescript
export const textStyles = {
  // Display
  display1: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize['5xl'] * 1.2,
    letterSpacing: -0.5,
  },

  // Headlines
  h1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize['4xl'] * 1.25,
  },
  h2: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize['3xl'] * 1.3,
  },
  h3: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize['2xl'] * 1.35,
  },
  h4: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.xl * 1.4,
  },

  // Body
  body1: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.base * 1.5,
  },
  body2: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * 1.5,
  },

  // Captions
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.xs * 1.4,
  },

  // Buttons
  button: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    textTransform: Platform.select({
      ios: 'none',
      android: 'uppercase',
    }),
  },

  // Code
  code: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.6,
  },
};
```

---

## Component Library

### Buttons

**Primary Button**
```typescript
<TouchableOpacity
  style={{
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.lg,
    ...shadows.ios.md,
  }}
  activeOpacity={0.7}
>
  <Text style={{
    ...textStyles.button,
    color: colors.background.light,
    textAlign: 'center',
  }}>
    Start Building
  </Text>
</TouchableOpacity>
```

**Secondary Button**
```typescript
<TouchableOpacity
  style={{
    backgroundColor: 'transparent',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary[500],
  }}
  activeOpacity={0.7}
>
  <Text style={{
    ...textStyles.button,
    color: colors.primary[500],
    textAlign: 'center',
  }}>
    View Code
  </Text>
</TouchableOpacity>
```

**Icon Button**
```typescript
<TouchableOpacity
  style={{
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  }}
  activeOpacity={0.7}
>
  <Icon name="microphone" size={20} color={colors.gray[700]} />
</TouchableOpacity>
```

**Floating Action Button (Preview Tab)**
```typescript
<TouchableOpacity
  style={{
    position: 'absolute',
    bottom: spacing[6],
    right: spacing[6],
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.ios.lg,
    zIndex: 1000,
  }}
  activeOpacity={0.8}
  onPress={openCodeViewer}
>
  <Icon name="code-document" size={24} color={colors.background.light} />
</TouchableOpacity>
```

**States:**
- **Default:** Primary color, visible shadow
- **Pressed:** Slightly scaled down (0.95), reduced opacity
- **Dismissed:** Fade out animation when code viewer opens
- **Reappear:** Fade in when code viewer closes

**Positioning:**
- Fixed position within WebView container
- Bottom-right corner (16-24px from edges)
- Above all preview content
- Below dismiss gestures area

### Input Fields

**Text Input**
```typescript
<View style={{
  backgroundColor: colors.gray[100],
  borderRadius: borderRadius.lg,
  paddingHorizontal: spacing[4],
  paddingVertical: spacing[3],
}}>
  <TextInput
    placeholder="Describe your app..."
    placeholderTextColor={colors.text.secondary.light}
    style={{
      ...textStyles.body1,
      color: colors.text.primary.light,
    }}
    multiline
  />
</View>
```

**Voice Input Button**
```typescript
<TouchableOpacity
  onPressIn={startRecording}
  onPressOut={stopRecording}
  style={{
    backgroundColor: colors.primary[500],
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.ios.lg,
  }}
>
  <Icon name="microphone" size={24} color={colors.background.light} />
  {isRecording && (
    <View style={{
      position: 'absolute',
      width: 72,
      height: 72,
      borderRadius: borderRadius.full,
      borderWidth: 2,
      borderColor: colors.primary[300],
      // Pulse animation
    }} />
  )}
</TouchableOpacity>
```

### Cards

**Project Card**
```typescript
<TouchableOpacity
  style={{
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    ...shadows.ios.md,
    marginBottom: spacing[3],
  }}
  activeOpacity={0.7}
>
  {/* Thumbnail */}
  <View style={{
    width: '100%',
    height: 120,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
  }} />

  {/* Title */}
  <Text style={{
    ...textStyles.h4,
    color: colors.text.primary.light,
    marginBottom: spacing[1],
  }}>
    Fitness Tracker
  </Text>

  {/* Subtitle */}
  <Text style={{
    ...textStyles.body2,
    color: colors.text.secondary.light,
  }}>
    Last edited: 2 days ago
  </Text>
</TouchableOpacity>
```

### Bottom Tabs
> See [vibecode/native_ui.md](vibecode/native_ui.md) for native bottom tab implementation with react-native-bottom-tabs

**Tab Bar (Platform-Specific)**
```typescript
// iOS Style
<View style={{
  flexDirection: 'row',
  backgroundColor: colors.background.light,
  paddingBottom: Platform.OS === 'ios' ? spacing[6] : spacing[2],
  paddingTop: spacing[2],
  borderTopWidth: 0.5,
  borderTopColor: colors.gray[300],
}}>
  {tabs.map((tab, index) => (
    <TouchableOpacity
      key={tab.name}
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing[2],
      }}
      activeOpacity={0.7}
    >
      <Icon
        name={tab.icon}
        size={24}
        color={activeTab === index ? colors.primary[500] : colors.gray[500]}
      />
      <Text style={{
        ...textStyles.caption,
        color: activeTab === index ? colors.primary[500] : colors.gray[500],
        marginTop: spacing[1],
      }}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  ))}
</View>

// Android Style (Material Design)
<View style={{
  flexDirection: 'row',
  backgroundColor: colors.primary[500],
  elevation: 8,
}}>
  {tabs.map((tab, index) => (
    <TouchableOpacity
      key={tab.name}
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing[3],
        borderBottomWidth: activeTab === index ? 2 : 0,
        borderBottomColor: colors.background.light,
      }}
      activeOpacity={0.7}
    >
      <Icon
        name={tab.icon}
        size={24}
        color={colors.background.light}
      />
    </TouchableOpacity>
  ))}
</View>
```

### Status Indicators

**Session Status Bar**
```typescript
<View style={{
  backgroundColor: colors.status.active,
  padding: spacing[3],
  borderRadius: borderRadius.lg,
  flexDirection: 'row',
  alignItems: 'center',
}}>
  <ActivityIndicator size="small" color={colors.background.light} />
  <Text style={{
    ...textStyles.body2,
    color: colors.background.light,
    marginLeft: spacing[2],
  }}>
    Thinking... (2:34)
  </Text>
</View>
```

**Progress Indicator**
```typescript
<View style={{
  height: 4,
  backgroundColor: colors.gray[200],
  borderRadius: borderRadius.full,
  overflow: 'hidden',
}}>
  <View style={{
    height: '100%',
    width: `${progress}%`,
    backgroundColor: colors.primary[500],
  }} />
</View>
```

### Lists

**File Tree Item**
```typescript
<TouchableOpacity
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    backgroundColor: isSelected ? colors.primary[50] : 'transparent',
  }}
  activeOpacity={0.7}
>
  <Icon name="file" size={16} color={colors.gray[600]} />
  <Text style={{
    ...textStyles.code,
    color: colors.text.primary.light,
    marginLeft: spacing[2],
    flex: 1,
  }}>
    app/index.tsx
  </Text>
  <Text style={{
    ...textStyles.caption,
    color: colors.text.secondary.light,
  }}>
    234 lines
  </Text>
</TouchableOpacity>
```

### Modals

**Code Viewer Overlay (From Floating Button)**
```typescript
<Modal
  animationType="slide"
  transparent={false}
  visible={isCodeViewerOpen}
  presentationStyle="pageSheet" // iOS: allows swipe-down dismiss
>
  <View style={{
    flex: 1,
    backgroundColor: colors.code.background,
  }}>
    {/* Header with dismiss options */}
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing[4],
      paddingTop: Platform.OS === 'ios' ? spacing[12] : spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[800],
    }}>
      <TouchableOpacity onPress={onClose}>
        <Icon name="chevron-down" size={24} color={colors.gray[300]} />
      </TouchableOpacity>
      <Text style={{
        ...textStyles.h4,
        color: colors.code.text,
      }}>
        Code Viewer
      </Text>
      <TouchableOpacity onPress={onClose}>
        <Icon name="close" size={24} color={colors.gray[300]} />
      </TouchableOpacity>
    </View>

    {/* Code content */}
    <ScrollView style={{ flex: 1 }}>
      <CodeViewer code={generatedCode} />
    </ScrollView>
  </View>
</Modal>
```

**Dismiss Gestures:**
- Swipe down from top → Dismiss (iOS native gesture)
- Tap X button → Close modal
- Tap back button → Close modal (Android)
- Optional: Tap outside → Dismiss

**Animation:**
- Enter: Slide up from bottom (300ms)
- Exit: Slide down to bottom (250ms)
- Floating button: Fade out on open, fade in on close

**Bottom Sheet (iOS) / Full Modal (Android)**
```typescript
// iOS: Bottom Sheet
<View style={{
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: colors.background.light,
  borderTopLeftRadius: borderRadius['2xl'],
  borderTopRightRadius: borderRadius['2xl'],
  padding: spacing[6],
  ...shadows.ios.lg,
}}>
  {/* Handle */}
  <View style={{
    width: 40,
    height: 4,
    backgroundColor: colors.gray[300],
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: spacing[4],
  }} />

  {/* Content */}
  {children}
</View>

// Android: Full Modal
<Modal
  animationType="slide"
  transparent={false}
  visible={visible}
>
  <View style={{
    flex: 1,
    backgroundColor: colors.background.light,
  }}>
    {/* Header */}
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[300],
    }}>
      <TouchableOpacity onPress={onClose}>
        <Icon name="close" size={24} />
      </TouchableOpacity>
      <Text style={{
        ...textStyles.h4,
        marginLeft: spacing[4],
      }}>
        {title}
      </Text>
    </View>

    {/* Content */}
    <ScrollView style={{ flex: 1 }}>
      {children}
    </ScrollView>
  </View>
</Modal>
```

---

## Platform-Specific Patterns

### Navigation

**iOS Navigation**
```typescript
// Back button: Left arrow with label
<TouchableOpacity
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  }}
>
  <Icon name="chevron-left" size={20} color={colors.primary[500]} />
  <Text style={{
    ...textStyles.body1,
    color: colors.primary[500],
    marginLeft: spacing[1],
  }}>
    Back
  </Text>
</TouchableOpacity>

// Navigation Bar
<View style={{
  backgroundColor: colors.background.light,
  paddingTop: Platform.OS === 'ios' ? 44 : 0, // Status bar height
  paddingBottom: spacing[3],
  borderBottomWidth: 0.5,
  borderBottomColor: colors.gray[300],
}}>
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  }}>
    <TouchableOpacity>{/* Left button */}</TouchableOpacity>
    <Text style={{ ...textStyles.h3, flex: 1, textAlign: 'center' }}>
      {title}
    </Text>
    <TouchableOpacity>{/* Right button */}</TouchableOpacity>
  </View>
</View>
```

**Android Navigation**
```typescript
// Back button: Left arrow only
<TouchableOpacity
  style={{
    padding: spacing[3],
  }}
>
  <Icon name="arrow-back" size={24} color={colors.background.light} />
</TouchableOpacity>

// App Bar (Material Design)
<View style={{
  backgroundColor: colors.primary[500],
  elevation: 4,
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
}}>
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
  }}>
    <TouchableOpacity>{/* Back button */}</TouchableOpacity>
    <Text style={{
      ...textStyles.h3,
      color: colors.background.light,
      marginLeft: spacing[4],
    }}>
      {title}
    </Text>
  </View>
</View>
```

### Action Sheets

**iOS Action Sheet**
```typescript
<ActionSheetIOS.showActionSheetWithOptions(
  {
    options: ['Cancel', 'Delete Project', 'Share Project'],
    destructiveButtonIndex: 1,
    cancelButtonIndex: 0,
  },
  (buttonIndex) => {
    // Handle selection
  }
);
```

**Android Menu**
```typescript
<Menu
  visible={visible}
  onDismiss={closeMenu}
  anchor={<IconButton icon="more-vert" onPress={openMenu} />}
>
  <Menu.Item onPress={() => {}} title="Share Project" />
  <Menu.Item onPress={() => {}} title="Delete Project" />
</Menu>
```

### Swipe Actions

**iOS Swipe Actions**
```typescript
<Swipeable
  renderRightActions={() => (
    <View style={{ flexDirection: 'row' }}>
      <TouchableOpacity
        style={{
          backgroundColor: colors.primary[500],
          justifyContent: 'center',
          alignItems: 'center',
          width: 80,
        }}
      >
        <Icon name="share" size={20} color={colors.background.light} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: colors.error.main,
          justifyContent: 'center',
          alignItems: 'center',
          width: 80,
        }}
      >
        <Icon name="delete" size={20} color={colors.background.light} />
      </TouchableOpacity>
    </View>
  )}
>
  {/* List item content */}
</Swipeable>
```

---

## Navigation Patterns

### Bottom Tab Navigation
> See [features-and-journeys.md](features-and-journeys.md#screen-3-coding-session-active---bottom-tab-navigation) for user journey through Bottom Tab Navigation

**Implementation**
```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: colors.primary[500],
    tabBarInactiveTintColor: colors.gray[500],
    tabBarStyle: {
      backgroundColor: colors.background.light,
      borderTopWidth: Platform.OS === 'ios' ? 0.5 : 0,
      borderTopColor: colors.gray[300],
      paddingBottom: Platform.OS === 'ios' ? spacing[4] : spacing[2],
      height: Platform.OS === 'ios' ? 84 : 56,
      elevation: Platform.OS === 'android' ? 8 : 0,
    },
    tabBarLabelStyle: textStyles.caption,
  }}
>
  <Tab.Screen
    name="Code"
    component={CodeTab}
    options={{
      tabBarIcon: ({ color, size }) => (
        <Icon name="code" size={size} color={color} />
      ),
    }}
  />
  {/* Other tabs */}
</Tab.Navigator>
```

### Hamburger Menu

**Drawer Navigator**
```typescript
import { createDrawerNavigator } from '@react-navigation/drawer';

const Drawer = createDrawerNavigator();

<Drawer.Navigator
  screenOptions={{
    drawerStyle: {
      backgroundColor: colors.background.light,
      width: 280,
    },
    drawerActiveTintColor: colors.primary[500],
    drawerInactiveTintColor: colors.text.secondary.light,
    drawerLabelStyle: textStyles.body1,
  }}
>
  <Drawer.Screen name="Home" component={HomeScreen} />
  <Drawer.Screen name="Settings" component={SettingsScreen} />
  <Drawer.Screen name="Profile" component={ProfileScreen} />
</Drawer.Navigator>
```

---

## Interaction Patterns

### Floating Button Interactions

**Preview Tab Floating Button:**
```typescript
// Floating button component with interaction handling
const FloatingCodeButton = () => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    openCodeViewer();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.floatingButton}
      >
        <Icon name="code-document" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};
```

**User Journey:**
1. User on Preview tab → Sees floating button
2. Taps button → Haptic feedback + scale animation
3. Code viewer slides up → Floating button fades out
4. User reviews code → Can scroll, zoom
5. Swipe down/tap X/tap back → Code viewer dismisses
6. Returns to preview → Floating button fades in

**Accessibility:**
```typescript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="View generated code"
  accessibilityHint="Opens code viewer overlay showing all generated files"
  accessibilityRole="button"
>
  {/* Button content */}
</TouchableOpacity>
```

### Haptic Feedback
> See [vibecode/native_ui.md](vibecode/native_ui.md) for native haptic implementation patterns

```typescript
import * as Haptics from 'expo-haptics';

// Light tap (button press, floating button tap)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium tap (important action, opening code viewer)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy tap (critical action)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Success notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Error notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Warning notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

// Selection change (picker, tab switch)
Haptics.selectionAsync();
```

### Animations

**Fade In**
```typescript
const fadeAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }).start();
}, []);

<Animated.View style={{ opacity: fadeAnim }}>
  {children}
</Animated.View>
```

**Slide Up**
```typescript
const slideAnim = useRef(new Animated.Value(100)).current;

useEffect(() => {
  Animated.spring(slideAnim, {
    toValue: 0,
    tension: 40,
    friction: 7,
    useNativeDriver: true,
  }).start();
}, []);

<Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
  {children}
</Animated.View>
```

**Scale**
```typescript
const scaleAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.spring(scaleAnim, {
    toValue: 1,
    tension: 50,
    friction: 3,
    useNativeDriver: true,
  }).start();
}, []);

<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  {children}
</Animated.View>
```

---

## Accessibility

### Screen Reader Support

```typescript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Start building your app"
  accessibilityHint="Double tap to create a new coding session"
  accessibilityRole="button"
>
  <Text>Start Building</Text>
</TouchableOpacity>
```

### Focus Management

```typescript
import { AccessibilityInfo } from 'react-native';

// Announce to screen reader
AccessibilityInfo.announceForAccessibility('Session complete! Your app is ready.');

// Set focus
const buttonRef = useRef<TouchableOpacity>(null);
AccessibilityInfo.setAccessibilityFocus(buttonRef.current);
```

### Minimum Touch Targets

```typescript
// Ensure minimum 44x44pt touch target (iOS HIG)
// Ensure minimum 48x48dp touch target (Material Design)
const MIN_TOUCH_TARGET = Platform.OS === 'ios' ? 44 : 48;

<TouchableOpacity
  style={{
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  }}
>
  <Icon name="microphone" size={20} />
</TouchableOpacity>
```

### Color Contrast

```typescript
// Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
// Use this utility to check contrast:
function getContrastRatio(color1: string, color2: string): number {
  // Calculate luminance and return ratio
}

// High contrast mode detection
const isHighContrast = useColorScheme() === 'dark';

<Text style={{
  color: isHighContrast ? colors.text.primary.dark : colors.text.primary.light,
}}>
  {text}
</Text>
```

### Dynamic Type Support

```typescript
import { useAccessibilityInfo } from '@react-native-community/hooks';

const { isScreenReaderEnabled } = useAccessibilityInfo();

<Text
  style={{
    fontSize: isScreenReaderEnabled
      ? typography.fontSize.lg
      : typography.fontSize.base,
  }}
  adjustsFontSizeToFit
  numberOfLines={2}
>
  {text}
</Text>
```

---

## Design System Implementation

### Theme Provider

```typescript
import { ThemeProvider } from './theme';

export function App() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider theme={colorScheme === 'dark' ? darkTheme : lightTheme}>
      {/* App content */}
    </ThemeProvider>
  );
}
```

### Using Design Tokens

```typescript
import { useTheme } from './theme';

function MyComponent() {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={{
      backgroundColor: colors.background,
      padding: spacing[4],
    }}>
      <Text style={{
        ...typography.h2,
        color: colors.text.primary,
      }}>
        Hello World
      </Text>
    </View>
  );
}
```

---

## Component Library Recommendations

### Primary: React Native Paper (Material Design)
```bash
npm install react-native-paper
```

**Best for:**
- Material Design compliance
- Android-first apps
- Comprehensive component set
- Theming support

### Secondary: React Native Elements
```bash
npm install react-native-elements
```

**Best for:**
- Cross-platform consistency
- Customizable components
- Balanced iOS/Android feel

### Tertiary: NativeBase
```bash
npm install native-base
```

**Best for:**
- Utility-first approach
- Responsive design
- Theme customization

---

## Platform Detection Utilities

```typescript
import { Platform } from 'react-native';

// Platform-specific values
const padding = Platform.select({
  ios: spacing[4],
  android: spacing[3],
});

// Platform-specific components
const StatusBar = Platform.OS === 'ios'
  ? <StatusBar barStyle="dark-content" />
  : <StatusBar backgroundColor={colors.primary[500]} />;

// Platform version check
if (Platform.Version >= 14) {
  // iOS 14+ specific code
}
```

---

**Status**: Comprehensive design system documented ✅ | iOS & Android patterns defined ✅ | Accessibility guidelines included ✅ | Native-first approach ✅
