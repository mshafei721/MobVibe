import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, Text, Input, Divider, Spinner, Icon, Card, ListItem, Sheet } from '../primitives';
import { tokens, colorsLight, colorsDark } from '../tokens';

export const ComponentGallery = () => {
  const [isDark, setIsDark] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [errorValue, setErrorValue] = useState('invalid input');
  const [sheetVisible, setSheetVisible] = useState(false);

  const colorScheme = isDark ? colorsDark : colorsLight;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text
        variant="h3"
        style={{ color: colorScheme.text.primary, marginBottom: tokens.spacing[4] }}
      >
        {title}
      </Text>
      {children}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.background.base }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Theme Toggle */}
        <View style={styles.header}>
          <Text
            variant="h1"
            style={{ color: colorScheme.text.primary }}
          >
            Component Gallery
          </Text>
          <Button
            variant="outline"
            size="sm"
            onPress={() => setIsDark(!isDark)}
            accessibilityLabel="Toggle theme"
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </Button>
        </View>

        {/* Typography Section */}
        <Section title="Typography">
          <Text variant="h1" style={{ color: colorScheme.text.primary }}>
            Heading 1 - 36px Bold
          </Text>
          <Text variant="h2" style={{ color: colorScheme.text.primary, marginTop: tokens.spacing[2] }}>
            Heading 2 - 30px Bold
          </Text>
          <Text variant="h3" style={{ color: colorScheme.text.primary, marginTop: tokens.spacing[2] }}>
            Heading 3 - 24px Semibold
          </Text>
          <Text variant="body" style={{ color: colorScheme.text.primary, marginTop: tokens.spacing[3] }}>
            Body text - 16px Normal. The quick brown fox jumps over the lazy dog.
          </Text>
          <Text variant="caption" style={{ marginTop: tokens.spacing[2] }}>
            Caption text - 14px Normal, Secondary color
          </Text>
          <Text variant="code" style={{ marginTop: tokens.spacing[2] }}>
            const code = 'monospace';
          </Text>
        </Section>

        {/* Buttons Section */}
        <Section title="Buttons">
          <Text variant="caption" style={{ marginBottom: tokens.spacing[2] }}>
            Primary Buttons
          </Text>
          <View style={styles.buttonRow}>
            <Button
              variant="primary"
              size="sm"
              onPress={() => console.log('Small pressed')}
              accessibilityLabel="Small primary button"
            >
              Small
            </Button>
            <Button
              variant="primary"
              size="md"
              onPress={() => console.log('Medium pressed')}
              accessibilityLabel="Medium primary button"
            >
              Medium
            </Button>
            <Button
              variant="primary"
              size="lg"
              onPress={() => console.log('Large pressed')}
              accessibilityLabel="Large primary button"
            >
              Large
            </Button>
          </View>

          <Text variant="caption" style={{ marginTop: tokens.spacing[4], marginBottom: tokens.spacing[2] }}>
            All Variants (Medium Size)
          </Text>
          <View style={styles.buttonColumn}>
            <Button
              variant="primary"
              onPress={() => console.log('Primary')}
              accessibilityLabel="Primary button"
            >
              Primary
            </Button>
            <Button
              variant="secondary"
              onPress={() => console.log('Secondary')}
              accessibilityLabel="Secondary button"
            >
              Secondary
            </Button>
            <Button
              variant="outline"
              onPress={() => console.log('Outline')}
              accessibilityLabel="Outline button"
            >
              Outline
            </Button>
            <Button
              variant="ghost"
              onPress={() => console.log('Ghost')}
              accessibilityLabel="Ghost button"
            >
              Ghost
            </Button>
            <Button
              variant="primary"
              disabled
              onPress={() => console.log('Disabled')}
              accessibilityLabel="Disabled button"
            >
              Disabled
            </Button>
            <Button
              variant="primary"
              fullWidth
              onPress={() => console.log('Full width')}
              accessibilityLabel="Full width button"
            >
              Full Width Button
            </Button>
          </View>
        </Section>

        {/* Inputs Section */}
        <Section title="Inputs">
          <Input
            label="Text Input"
            placeholder="Enter some text"
            value={textValue}
            onChangeText={setTextValue}
            accessibilityLabel="Text input field"
            accessibilityHint="Enter any text"
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={emailValue}
            onChangeText={setEmailValue}
            accessibilityLabel="Email input field"
            accessibilityHint="Enter your email address"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={passwordValue}
            onChangeText={setPasswordValue}
            accessibilityLabel="Password input field"
            accessibilityHint="Enter your password"
          />

          <Input
            label="Input with Error"
            placeholder="This has an error"
            value={errorValue}
            onChangeText={setErrorValue}
            error="This field is required"
            accessibilityLabel="Input with error"
          />

          <Input
            label="Disabled Input"
            placeholder="Cannot edit"
            value="Disabled value"
            onChangeText={() => {}}
            disabled
            accessibilityLabel="Disabled input field"
          />
        </Section>

        {/* Dividers Section */}
        <Section title="Dividers">
          <Text variant="body" style={{ color: colorScheme.text.primary }}>
            Horizontal Divider (default)
          </Text>
          <Divider />
          <Text variant="body" style={{ color: colorScheme.text.primary }}>
            Content after divider
          </Text>

          <Divider spacing={4} />

          <Text variant="caption" style={{ marginBottom: tokens.spacing[2] }}>
            Vertical Divider
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 40 }}>
            <Text variant="body" style={{ color: colorScheme.text.primary }}>
              Left
            </Text>
            <Divider orientation="vertical" />
            <Text variant="body" style={{ color: colorScheme.text.primary }}>
              Right
            </Text>
          </View>

          <Divider spacing={4} />

          <Text variant="caption" style={{ marginBottom: tokens.spacing[2] }}>
            Custom Color
          </Text>
          <Divider color={tokens.colors.primary[500]} />
        </Section>

        {/* Spinners Section */}
        <Section title="Spinners">
          <Text variant="caption" style={{ marginBottom: tokens.spacing[2] }}>
            Size Variants
          </Text>
          <View style={styles.buttonRow}>
            <View style={{ alignItems: 'center' }}>
              <Spinner size="sm" accessibilityLabel="Loading small" />
              <Text variant="caption" style={{ marginTop: tokens.spacing[1] }}>
                Small
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Spinner size="md" accessibilityLabel="Loading medium" />
              <Text variant="caption" style={{ marginTop: tokens.spacing[1] }}>
                Medium
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Spinner size="lg" accessibilityLabel="Loading large" />
              <Text variant="caption" style={{ marginTop: tokens.spacing[1] }}>
                Large
              </Text>
            </View>
          </View>

          <Divider spacing={4} />

          <Text variant="caption" style={{ marginBottom: tokens.spacing[2] }}>
            Custom Colors
          </Text>
          <View style={styles.buttonRow}>
            <Spinner color={tokens.colors.primary[500]} accessibilityLabel="Loading primary" />
            <Spinner color={tokens.colors.success[500]} accessibilityLabel="Loading success" />
            <Spinner color={tokens.colors.error[500]} accessibilityLabel="Loading error" />
          </View>
        </Section>

        {/* Icons Section */}
        <Section title="Icons">
          <Text variant="caption" style={{ marginBottom: tokens.spacing[2] }}>
            Ionicons
          </Text>
          <View style={styles.iconGrid}>
            <Icon family="ionicons" name="home" size="md" color={colorScheme.text.primary} />
            <Icon family="ionicons" name="search" size="md" color={colorScheme.text.primary} />
            <Icon family="ionicons" name="heart" size="md" color={colorScheme.text.primary} />
            <Icon family="ionicons" name="star" size="md" color={colorScheme.text.primary} />
            <Icon family="ionicons" name="settings" size="md" color={colorScheme.text.primary} />
            <Icon family="ionicons" name="person" size="md" color={colorScheme.text.primary} />
          </View>

          <Divider spacing={4} />

          <Text variant="caption" style={{ marginBottom: tokens.spacing[2] }}>
            Material Icons
          </Text>
          <View style={styles.iconGrid}>
            <Icon family="material" name="home" size="md" color={colorScheme.text.primary} />
            <Icon family="material" name="search" size="md" color={colorScheme.text.primary} />
            <Icon family="material" name="favorite" size="md" color={colorScheme.text.primary} />
            <Icon family="material" name="star" size="md" color={colorScheme.text.primary} />
            <Icon family="material" name="settings" size="md" color={colorScheme.text.primary} />
            <Icon family="material" name="person" size="md" color={colorScheme.text.primary} />
          </View>

          <Divider spacing={4} />

          <Text variant="caption" style={{ marginBottom: tokens.spacing[2] }}>
            Feather Icons
          </Text>
          <View style={styles.iconGrid}>
            <Icon family="feather" name="home" size="md" color={colorScheme.text.primary} />
            <Icon family="feather" name="search" size="md" color={colorScheme.text.primary} />
            <Icon family="feather" name="heart" size="md" color={colorScheme.text.primary} />
            <Icon family="feather" name="star" size="md" color={colorScheme.text.primary} />
            <Icon family="feather" name="settings" size="md" color={colorScheme.text.primary} />
            <Icon family="feather" name="user" size="md" color={colorScheme.text.primary} />
          </View>

          <Divider spacing={4} />

          <Text variant="caption" style={{ marginBottom: tokens.spacing[2] }}>
            Size Variants
          </Text>
          <View style={styles.buttonRow}>
            <View style={{ alignItems: 'center' }}>
              <Icon family="ionicons" name="heart" size="sm" color={tokens.colors.error[500]} />
              <Text variant="caption" style={{ marginTop: tokens.spacing[1] }}>
                Small
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Icon family="ionicons" name="heart" size="md" color={tokens.colors.error[500]} />
              <Text variant="caption" style={{ marginTop: tokens.spacing[1] }}>
                Medium
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Icon family="ionicons" name="heart" size="lg" color={tokens.colors.error[500]} />
              <Text variant="caption" style={{ marginTop: tokens.spacing[1] }}>
                Large
              </Text>
            </View>
          </View>
        </Section>

        {/* Cards Section */}
        <Section title="Cards">
          <Text variant="caption" style={{ marginBottom: tokens.spacing[2] }}>
            Flat Variant (no elevation)
          </Text>
          <Card variant="flat">
            <Text variant="body" weight="semibold" style={{ color: colorScheme.text.primary }}>
              Flat Card
            </Text>
            <Text variant="caption" style={{ color: colorScheme.text.secondary, marginTop: tokens.spacing[1] }}>
              No shadow or elevation
            </Text>
          </Card>

          <Divider spacing={4} />

          <Text variant="caption" style={{ marginBottom: tokens.spacing[2] }}>
            Raised Variant (default, medium elevation)
          </Text>
          <Card variant="raised">
            <Text variant="body" weight="semibold" style={{ color: colorScheme.text.primary }}>
              Raised Card
            </Text>
            <Text variant="caption" style={{ color: colorScheme.text.secondary, marginTop: tokens.spacing[1] }}>
              Medium elevation (4dp)
            </Text>
          </Card>

          <Divider spacing={4} />

          <Text variant="caption" style={{ marginBottom: tokens.spacing[2] }}>
            Floating Variant (high elevation)
          </Text>
          <Card variant="floating">
            <Text variant="body" weight="semibold" style={{ color: colorScheme.text.primary }}>
              Floating Card
            </Text>
            <Text variant="caption" style={{ color: colorScheme.text.secondary, marginTop: tokens.spacing[1] }}>
              High elevation (8dp)
            </Text>
          </Card>

          <Divider spacing={4} />

          <Text variant="caption" style={{ marginBottom: tokens.spacing[2] }}>
            Touchable Card
          </Text>
          <Card
            variant="raised"
            onPress={() => console.log('Card pressed')}
            accessibilityLabel="Touchable card"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2] }}>
              <Icon family="ionicons" name="settings" size="md" color={tokens.colors.primary[500]} />
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="semibold" style={{ color: colorScheme.text.primary }}>
                  Settings
                </Text>
                <Text variant="caption" style={{ color: colorScheme.text.secondary, marginTop: tokens.spacing[1] }}>
                  Tap to open settings
                </Text>
              </View>
              <Icon family="ionicons" name="chevron-forward" size="sm" color={colorScheme.text.tertiary} />
            </View>
          </Card>
        </Section>

        {/* ListItems Section */}
        <Section title="List Items">
          <Card variant="flat">
            <ListItem title="Basic List Item" />
            <Divider spacing={0} />
            <ListItem title="With Subtitle" subtitle="Additional information" />
            <Divider spacing={0} />
            <ListItem
              title="With Left Icon"
              subtitle="Icon on the left side"
              leftIcon={{ family: 'ionicons', name: 'person' }}
            />
            <Divider spacing={0} />
            <ListItem
              title="Navigable Item"
              subtitle="Tap to navigate"
              rightIcon="chevron"
              onPress={() => console.log('Navigate')}
            />
            <Divider spacing={0} />
            <ListItem
              title="Complete Example"
              subtitle="All features combined"
              leftIcon={{ family: 'material', name: 'notifications' }}
              rightIcon="chevron"
              onPress={() => console.log('Complete')}
              accessibilityHint="Double tap to view notifications"
            />
          </Card>
        </Section>

        {/* Sheet Section */}
        <Section title="Sheet (Bottom Modal)">
          <Button
            variant="primary"
            onPress={() => setSheetVisible(true)}
            accessibilityLabel="Open bottom sheet"
          >
            Open Sheet
          </Button>

          <Sheet
            visible={sheetVisible}
            onClose={() => setSheetVisible(false)}
            accessibilityLabel="Example sheet"
          >
            <Text variant="h3" style={{ color: colorScheme.text.primary, marginBottom: tokens.spacing[4] }}>
              Bottom Sheet
            </Text>
            <Text variant="body" style={{ color: colorScheme.text.primary, marginBottom: tokens.spacing[4] }}>
              This is a bottom sheet modal. Tap the backdrop or press the button below to close it.
            </Text>
            <Divider />
            <ListItem
              title="Option 1"
              leftIcon={{ family: 'ionicons', name: 'checkmark-circle' }}
              onPress={() => {
                console.log('Option 1');
                setSheetVisible(false);
              }}
            />
            <Divider spacing={0} />
            <ListItem
              title="Option 2"
              leftIcon={{ family: 'ionicons', name: 'close-circle' }}
              onPress={() => {
                console.log('Option 2');
                setSheetVisible(false);
              }}
            />
            <Divider />
            <Button
              variant="outline"
              onPress={() => setSheetVisible(false)}
              accessibilityLabel="Close sheet"
              fullWidth
            >
              Close
            </Button>
          </Sheet>
        </Section>

        {/* Component Info */}
        <View style={[styles.infoBox, { backgroundColor: colorScheme.surface[1] }]}>
          <Text variant="caption" style={{ color: colorScheme.text.secondary }}>
            Phase 04-05: Complete Primitive Library (10 Components)
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary, marginTop: tokens.spacing[2] }}>
            Phase 04 (Part 1):
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary, marginTop: tokens.spacing[1] }}>
            • Button (4 variants × 3 sizes)
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary }}>
            • Text (6 variants)
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary }}>
            • Input (text, email, password)
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary, marginTop: tokens.spacing[2] }}>
            Phase 05 (Part 2):
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary, marginTop: tokens.spacing[1] }}>
            • Divider (horizontal/vertical)
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary }}>
            • Spinner (3 sizes, loading states)
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary }}>
            • Icon (3 families: Ionicons, Material, Feather)
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary }}>
            • Card (3 elevation variants, touchable)
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary }}>
            • ListItem (navigation rows)
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary }}>
            • Sheet (bottom modal)
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary, marginTop: tokens.spacing[2] }}>
            ✓ All components use tokens exclusively
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary }}>
            ✓ WCAG AA accessibility compliance
          </Text>
          <Text variant="caption" style={{ color: colorScheme.text.tertiary }}>
            ✓ Full TypeScript support
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[6],
  },
  section: {
    marginBottom: tokens.spacing[6],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
    flexWrap: 'wrap',
  },
  buttonColumn: {
    gap: tokens.spacing[2],
  },
  iconGrid: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
    flexWrap: 'wrap',
  },
  infoBox: {
    padding: tokens.spacing[4],
    borderRadius: tokens.spacing.borderRadius.md,
    marginTop: tokens.spacing[4],
  },
});

export default ComponentGallery;
