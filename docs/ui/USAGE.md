# Component Usage Guide

**Status:** Phase 04-05 Complete (All 10 Primitives)
**Last Updated:** 2025-11-06

---

## Overview

MobVibe's primitive components provide accessible, cross-platform building blocks for the application. All components:
- ✅ Use tokens exclusively (zero hardcoded values)
- ✅ Meet WCAG AA accessibility standards
- ✅ Support light/dark modes
- ✅ Enforce minimum touch targets (44pt iOS / 48dp Android)
- ✅ Include full TypeScript types

**Component Library:**
- **Phase 04 (Part 1):** Button, Text, Input
- **Phase 05 (Part 2):** Divider, Spinner, Icon, Card, ListItem, Sheet

---

## Installation

```typescript
// Import all components
import {
  Button, Text, Input,
  Divider, Spinner, Icon, Card, ListItem, Sheet,
  tokens
} from '@/ui/primitives';

// Import specific types
import type {
  ButtonProps, TextProps, InputProps,
  DividerProps, SpinnerProps, IconProps,
  CardProps, ListItemProps, SheetProps
} from '@/ui/primitives';
```

---

## Button Component

### Basic Usage

```typescript
import { Button } from '@/ui/primitives';

<Button
  variant="primary"
  size="md"
  onPress={() => console.log('Pressed')}
  accessibilityLabel="Submit form"
>
  Submit
</Button>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disable button interaction |
| `onPress` | `() => void` | Required | Press handler |
| `accessibilityLabel` | `string` | Required | Screen reader label |
| `accessibilityHint` | `string` | Optional | Additional context for screen readers |
| `fullWidth` | `boolean` | `false` | Expand button to full container width |
| `children` | `React.ReactNode` | Required | Button text/content |

### Variants

**Primary** - High emphasis, filled background
```typescript
<Button variant="primary" onPress={handleSubmit} accessibilityLabel="Submit">
  Submit
</Button>
```

**Secondary** - Medium emphasis, filled background
```typescript
<Button variant="secondary" onPress={handleCancel} accessibilityLabel="Cancel">
  Cancel
</Button>
```

**Outline** - Low emphasis, bordered
```typescript
<Button variant="outline" onPress={handleSecondary} accessibilityLabel="Learn more">
  Learn More
</Button>
```

**Ghost** - Minimal emphasis, text only
```typescript
<Button variant="ghost" onPress={handleTertiary} accessibilityLabel="Skip">
  Skip
</Button>
```

### Sizes

```typescript
// Small - 32pt (iOS) / 36dp (Android)
<Button size="sm" onPress={handlePress} accessibilityLabel="Small">Small</Button>

// Medium - 44pt (iOS) / 48dp (Android) - Default, meets touch target minimum
<Button size="md" onPress={handlePress} accessibilityLabel="Medium">Medium</Button>

// Large - 56pt (iOS) / 60dp (Android)
<Button size="lg" onPress={handlePress} accessibilityLabel="Large">Large</Button>
```

### States

```typescript
// Disabled
<Button disabled onPress={handlePress} accessibilityLabel="Disabled">
  Disabled
</Button>

// Full width
<Button fullWidth onPress={handlePress} accessibilityLabel="Full width">
  Full Width Button
</Button>
```

### Features

- **Haptic Feedback:** Triggers light haptic on press (iOS + Android)
- **Platform Text Transform:** Capitalize on iOS, UPPERCASE on Android
- **Touch Targets:** Enforces minimum 44pt/48dp for md and lg sizes
- **Accessibility:** Full WCAG AA compliance with labels, hints, and state announcements

---

## Text Component

### Basic Usage

```typescript
import { Text } from '@/ui/primitives';

<Text variant="body">This is body text</Text>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'h1' \| 'h2' \| 'h3' \| 'body' \| 'caption' \| 'code'` | `'body'` | Text style variant |
| `color` | `string` | Auto | Text color (token key or hex) |
| `weight` | `'normal' \| 'medium' \| 'semibold' \| 'bold'` | Variant default | Font weight |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Text alignment |
| `numberOfLines` | `number` | Unlimited | Maximum lines before truncation |
| `children` | `React.ReactNode` | Required | Text content |

### Variants

```typescript
// Headings
<Text variant="h1">Heading 1 - 36px Bold</Text>
<Text variant="h2">Heading 2 - 30px Bold</Text>
<Text variant="h3">Heading 3 - 24px Semibold</Text>

// Body and Utility
<Text variant="body">Body text - 16px Normal (default)</Text>
<Text variant="caption">Caption - 14px Normal, Secondary color</Text>
<Text variant="code">const code = 'monospace';</Text>
```

### Customization

```typescript
// Custom color
<Text color={tokens.colors.primary[500]}>Colored text</Text>

// Custom weight
<Text weight="bold">Bold text</Text>

// Alignment
<Text align="center">Centered text</Text>

// Truncation
<Text numberOfLines={2}>
  Long text that will be truncated after two lines...
</Text>
```

### Features

- **Platform Fonts:** SF Pro (iOS), Roboto (Android)
- **Dynamic Type:** Scales with user font size preferences (iOS)
- **Accessibility Roles:** Headings use `header` role, body uses `text` role
- **Max Font Scale:** Limited to 2× to prevent extreme scaling

---

## Input Component

### Basic Usage

```typescript
import { Input } from '@/ui/primitives';
import { useState } from 'react';

const [value, setValue] = useState('');

<Input
  label="Email"
  value={value}
  onChangeText={setValue}
  accessibilityLabel="Email input"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | Required | Floating label text |
| `placeholder` | `string` | Optional | Placeholder text |
| `value` | `string` | Required | Input value |
| `onChangeText` | `(text: string) => void` | Required | Change handler |
| `type` | `'text' \| 'email' \| 'password'` | `'text'` | Input type |
| `error` | `string` | Optional | Error message |
| `disabled` | `boolean` | `false` | Disable input |
| `accessibilityLabel` | `string` | Required | Screen reader label |
| `accessibilityHint` | `string` | Optional | Additional context |
| `autoFocus` | `boolean` | `false` | Auto-focus on mount |
| `onFocus` | `() => void` | Optional | Focus handler |
| `onBlur` | `() => void` | Optional | Blur handler |

### Input Types

**Text Input**
```typescript
<Input
  label="Name"
  value={name}
  onChangeText={setName}
  accessibilityLabel="Name input"
/>
```

**Email Input** - Email keyboard, no autocorrect
```typescript
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  value={email}
  onChangeText={setEmail}
  accessibilityLabel="Email input"
/>
```

**Password Input** - Secure entry with show/hide toggle
```typescript
<Input
  label="Password"
  type="password"
  placeholder="••••••••"
  value={password}
  onChangeText={setPassword}
  accessibilityLabel="Password input"
/>
```

### Error State

```typescript
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  error="Please enter a valid email address"
  accessibilityLabel="Email input"
/>
```

### Disabled State

```typescript
<Input
  label="Username"
  value="john_doe"
  onChangeText={() => {}}
  disabled
  accessibilityLabel="Username input"
/>
```

### Features

- **Floating Label:** Animates above input on focus or when value exists
- **Password Toggle:** Show/hide password with 👁️/🔒 icon and text
- **Clear Button:** X icon appears for non-password inputs with value
- **Error Handling:** Red border, error icon, and message below input
- **Keyboard Types:** Auto-selects appropriate keyboard (email, default)
- **Accessibility:** Links error messages to input via `accessibilityDescribedBy`

---

## Divider Component

Horizontal or vertical separator line for visual content separation.

### Basic Usage

```typescript
import { Divider } from '@/ui/primitives';

// Horizontal (default)
<Divider />

// Vertical
<Divider orientation="vertical" />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Divider orientation |
| `spacing` | `number` | `2` | Margin spacing (token key) |
| `color` | `string` | `tokens.colors.neutral[200]` | Divider color |

### Features

- Completely hidden from screen readers (decorative only)
- Uses 1px height/width for minimal visual weight
- Token-based spacing and colors

---

## Spinner Component

Loading indicator with accessibility announcements.

### Basic Usage

```typescript
import { Spinner } from '@/ui/primitives';

<Spinner accessibilityLabel="Loading user profile" />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Spinner size (16/32/48px) |
| `color` | `string` | `tokens.colors.primary[500]` | Spinner color |
| `accessibilityLabel` | `string` | Required | Descriptive loading message |

### Features

- Live region announcements for screen readers
- `progressbar` role with `busy` state
- Uses native ActivityIndicator component

---

## Icon Component

Vector icons from @expo/vector-icons (Ionicons, Material, Feather).

### Basic Usage

```typescript
import { Icon } from '@/ui/primitives';

<Icon family="ionicons" name="home" size="md" />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `family` | `'ionicons' \| 'material' \| 'feather'` | Required | Icon family |
| `name` | `string` | Required | Icon name |
| `size` | `'sm' \| 'md' \| 'lg' \| number` | `'md'` | Icon size (16/24/32px) |
| `color` | `string` | `tokens.colors.neutral[900]` | Icon color |
| `accessibilityLabel` | `string` | Optional | Label if meaningful |

### Examples

```typescript
// Decorative icon (hidden from screen readers)
<Icon family="ionicons" name="star" />

// Meaningful icon (announced by screen readers)
<Icon family="material" name="search" accessibilityLabel="Search" />
```

---

## Card Component

Container component with platform-specific elevation/shadows.

### Basic Usage

```typescript
import { Card } from '@/ui/primitives';

<Card variant="raised">
  <Text>Card content</Text>
</Card>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'flat' \| 'raised' \| 'floating'` | `'raised'` | Elevation level |
| `padding` | `number` | `4` | Inner padding (token key) |
| `onPress` | `() => void` | Optional | Makes card touchable |
| `accessibilityLabel` | `string` | Required if `onPress` | Button label |
| `children` | `React.ReactNode` | Required | Card content |

### Variants

```typescript
// Flat - No elevation
<Card variant="flat">Content</Card>

// Raised - Medium elevation (4dp)
<Card variant="raised">Content</Card>

// Floating - High elevation (8dp)
<Card variant="floating">Content</Card>

// Touchable
<Card
  variant="raised"
  onPress={handlePress}
  accessibilityLabel="Open settings"
>
  Content
</Card>
```

---

## ListItem Component

Touchable list row with optional icons and navigation indicator.

### Basic Usage

```typescript
import { ListItem } from '@/ui/primitives';

<ListItem
  title="Settings"
  subtitle="Manage your account"
  rightIcon="chevron"
  onPress={handleNavigate}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | Required | Primary text |
| `subtitle` | `string` | Optional | Secondary text |
| `leftIcon` | `{ family, name }` | Optional | Left side icon |
| `rightIcon` | `'chevron' \| 'none'` | `'none'` | Right navigation indicator |
| `onPress` | `() => void` | Optional | Press handler |
| `accessibilityLabel` | `string` | Auto | Custom label (auto: title + subtitle) |
| `accessibilityHint` | `string` | Optional | Navigation hint |

### Examples

```typescript
// Basic
<ListItem title="Profile" />

// With subtitle
<ListItem title="John Doe" subtitle="Software Engineer" />

// With left icon
<ListItem
  title="Notifications"
  leftIcon={{ family: 'ionicons', name: 'notifications' }}
/>

// Navigable
<ListItem
  title="Settings"
  subtitle="Manage account"
  rightIcon="chevron"
  onPress={() => navigate('/settings')}
  accessibilityHint="Double tap to view settings"
/>
```

---

## Sheet Component

Bottom modal sheet with backdrop dismissal and focus trap.

### Basic Usage

```typescript
import { Sheet } from '@/ui/primitives';
import { useState } from 'react';

const [visible, setVisible] = useState(false);

<Sheet
  visible={visible}
  onClose={() => setVisible(false)}
  accessibilityLabel="Filter options"
>
  <Text>Sheet content</Text>
</Sheet>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | Required | Show/hide sheet |
| `onClose` | `() => void` | Required | Close handler |
| `accessibilityLabel` | `string` | Required | Sheet content description |
| `children` | `React.ReactNode` | Required | Sheet content |

### Features

- Transparent backdrop with tap-to-close
- Slide-up animation (respects reduce motion)
- Focus trap via `accessibilityViewIsModal`
- Rounded top corners
- Max height: 80% of screen

---

## Accessibility Guidelines

### WCAG AA Compliance

All components meet WCAG AA standards:
- **Color Contrast:** 4.5:1 for normal text, 3:1 for large text
- **Touch Targets:** 44pt (iOS) / 48dp (Android) minimum
- **Screen Readers:** Full VoiceOver (iOS) and TalkBack (Android) support
- **Keyboard Navigation:** Logical focus order, visible focus indicators

### Best Practices

**Always provide accessibility labels:**
```typescript
// ✅ Good
<Button onPress={handleSubmit} accessibilityLabel="Submit form">Submit</Button>

// ❌ Bad
<Button onPress={handleSubmit}>Submit</Button>
```

**Use hints for additional context:**
```typescript
<Button
  onPress={handleDelete}
  accessibilityLabel="Delete item"
  accessibilityHint="Permanently removes this item from your collection"
>
  Delete
</Button>
```

**Link errors to inputs:**
```typescript
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  error="Invalid email format"
  accessibilityLabel="Email input"
  // Error automatically linked via accessibilityDescribedBy
/>
```

---

## Testing

### Running Tests

```bash
# Run all primitive tests
npm test -- primitives/

# Run specific test file
npm test -- Button.test.tsx

# Run with coverage
npm run test:coverage

# Run accessibility tests
npm test -- a11y.test.tsx
```

### Manual Accessibility Testing

**iOS VoiceOver:**
1. Settings > Accessibility > VoiceOver > Enable
2. Test all interactive elements
3. Verify labels and hints are announced
4. Check state changes (disabled, error)

**Android TalkBack:**
1. Settings > Accessibility > TalkBack > Enable
2. Test all interactive elements
3. Verify labels and hints are announced
4. Check state changes (disabled, error)

**Touch Targets:**
1. Use Layout Inspector (Xcode/Android Studio)
2. Verify buttons ≥ 44pt/48dp
3. Verify input height = 48dp
4. Verify toggle/clear buttons ≥ 44×44

---

## Component Gallery

View all components with live examples:

```typescript
import { ComponentGallery } from '@/ui/__demo__/ComponentGallery';

<ComponentGallery />
```

Features:
- All component variants and sizes
- Light/dark mode toggle
- Interactive inputs
- Live state demonstrations

---

## Related Documentation

- [Theming Guide](./THEMING.md) - Token system and theming
- [Component Patterns Research](../research/04/component-patterns.md) - Best practices
- [Phase 04 Plan](../phases/04-primitives-part1.md) - Implementation details

---

**Last Updated:** 2025-11-06
**Phase:** 04-05 Complete (All 10 Primitives)
**Next:** Phase 06 - Adapter Layer
