import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { tokens, colorsLight, colorsDark } from '../tokens';

const { width } = Dimensions.get('window');

export const TokenDemo = () => {
  const [isDark, setIsDark] = useState(false);
  const colorScheme = isDark ? colorsDark : colorsLight;

  const toggleTheme = () => setIsDark(!isDark);

  const ColorSwatch = ({ label, color }: { label: string; color: string }) => (
    <View style={styles.swatch}>
      <View style={[styles.swatchColor, { backgroundColor: color }]} />
      <Text style={[styles.swatchLabel, { color: colorScheme.text.primary }]}>
        {label}
      </Text>
      <Text style={[styles.swatchHex, { color: colorScheme.text.secondary }]}>
        {color}
      </Text>
    </View>
  );

  const ColorScale = ({ name, scale }: { name: string; scale: any }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colorScheme.text.primary }]}>
        {name}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Object.entries(scale).map(([shade, color]) => (
          <ColorSwatch key={shade} label={shade} color={color as string} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme.background.base },
      ]}
    >
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colorScheme.text.primary }]}>
            MobVibe Design Tokens
          </Text>
          <TouchableOpacity
            style={[
              styles.themeToggle,
              { backgroundColor: isDark ? colorScheme.primary[400] : colorScheme.primary[500] },
            ]}
            onPress={toggleTheme}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Color Scales */}
        <View style={[styles.card, { backgroundColor: colorScheme.surface[0] }]}>
          <Text style={[styles.cardTitle, { color: colorScheme.text.primary }]}>
            Color Scales
          </Text>
          <ColorScale name="Primary" scale={colorScheme.primary} />
          <ColorScale name="Secondary" scale={colorScheme.secondary} />
          <ColorScale name="Success" scale={colorScheme.success} />
          <ColorScale name="Error" scale={colorScheme.error} />
          <ColorScale name="Warning" scale={colorScheme.warning} />
          <ColorScale name="Info" scale={colorScheme.info} />
          <ColorScale name="Neutral" scale={colorScheme.neutral} />
        </View>

        {/* Semantic Colors */}
        <View style={[styles.card, { backgroundColor: colorScheme.surface[0] }]}>
          <Text style={[styles.cardTitle, { color: colorScheme.text.primary }]}>
            Semantic Colors
          </Text>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colorScheme.text.primary }]}>
              Text
            </Text>
            <View style={styles.row}>
              <ColorSwatch label="primary" color={colorScheme.text.primary} />
              <ColorSwatch label="secondary" color={colorScheme.text.secondary} />
              <ColorSwatch label="tertiary" color={colorScheme.text.tertiary} />
              <ColorSwatch label="disabled" color={colorScheme.text.disabled} />
              <ColorSwatch label="inverse" color={colorScheme.text.inverse} />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colorScheme.text.primary }]}>
              Background
            </Text>
            <View style={styles.row}>
              <ColorSwatch label="base" color={colorScheme.background.base} />
              <ColorSwatch label="subtle" color={colorScheme.background.subtle} />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colorScheme.text.primary }]}>
              Surface
            </Text>
            <View style={styles.row}>
              <ColorSwatch label="0" color={colorScheme.surface[0]} />
              <ColorSwatch label="1" color={colorScheme.surface[1]} />
              <ColorSwatch label="2" color={colorScheme.surface[2]} />
              <ColorSwatch label="3" color={colorScheme.surface[3]} />
            </View>
          </View>
        </View>

        {/* Typography */}
        <View style={[styles.card, { backgroundColor: colorScheme.surface[0] }]}>
          <Text style={[styles.cardTitle, { color: colorScheme.text.primary }]}>
            Typography
          </Text>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colorScheme.text.primary }]}>
              Font Sizes
            </Text>
            {Object.entries(tokens.typography.fontSize).map(([name, size]) => (
              <Text
                key={name}
                style={{
                  fontSize: size,
                  color: colorScheme.text.primary,
                  marginBottom: 8,
                }}
              >
                {name}: {size}px - The quick brown fox jumps over the lazy dog
              </Text>
            ))}
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colorScheme.text.primary }]}>
              Font Weights
            </Text>
            {Object.entries(tokens.typography.fontWeight).map(([name, weight]) => (
              <Text
                key={name}
                style={{
                  fontWeight: weight,
                  fontSize: 16,
                  color: colorScheme.text.primary,
                  marginBottom: 8,
                }}
              >
                {name}: {weight} - The quick brown fox
              </Text>
            ))}
          </View>
        </View>

        {/* Spacing */}
        <View style={[styles.card, { backgroundColor: colorScheme.surface[0] }]}>
          <Text style={[styles.cardTitle, { color: colorScheme.text.primary }]}>
            Spacing Scale
          </Text>
          <View style={styles.section}>
            {Object.entries(tokens.spacing).filter(([k]) => k !== 'borderRadius').map(([name, value]) => (
              <View key={name} style={styles.spacingRow}>
                <Text style={[styles.spacingLabel, { color: colorScheme.text.primary }]}>
                  {name}: {value}px
                </Text>
                <View
                  style={{
                    width: Number(value),
                    height: 24,
                    backgroundColor: colorScheme.primary[500],
                  }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Border Radius */}
        <View style={[styles.card, { backgroundColor: colorScheme.surface[0] }]}>
          <Text style={[styles.cardTitle, { color: colorScheme.text.primary }]}>
            Border Radius
          </Text>
          <View style={styles.row}>
            {Object.entries(tokens.spacing.borderRadius).map(([name, value]) => (
              <View key={name} style={styles.radiusContainer}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    backgroundColor: colorScheme.primary[500],
                    borderRadius: value === 9999 ? 32 : Number(value),
                    marginBottom: 8,
                  }}
                />
                <Text style={[styles.radiusLabel, { color: colorScheme.text.primary }]}>
                  {name}
                </Text>
                <Text style={[styles.radiusValue, { color: colorScheme.text.secondary }]}>
                  {value}px
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Motion */}
        <View style={[styles.card, { backgroundColor: colorScheme.surface[0] }]}>
          <Text style={[styles.cardTitle, { color: colorScheme.text.primary }]}>
            Motion / Animation
          </Text>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colorScheme.text.primary }]}>
              Durations
            </Text>
            {Object.entries(tokens.motion.duration).map(([name, duration]) => (
              <View key={name} style={styles.motionRow}>
                <Text style={[styles.motionLabel, { color: colorScheme.text.primary }]}>
                  {name}: {duration}ms
                </Text>
                <View
                  style={{
                    width: Math.max(50, Number(duration) / 2),
                    height: 8,
                    backgroundColor: colorScheme.success[500],
                    borderRadius: 4,
                  }}
                />
              </View>
            ))}
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colorScheme.text.primary }]}>
              Easing Functions
            </Text>
            {Object.entries(tokens.motion.easing).map(([name, easing]) => (
              <Text
                key={name}
                style={{
                  fontSize: 14,
                  color: colorScheme.text.primary,
                  marginBottom: 4,
                }}
              >
                {name}: {easing}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  themeToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  card: {
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatch: {
    alignItems: 'center',
    marginRight: 8,
  },
  swatchColor: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginBottom: 4,
  },
  swatchLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  swatchHex: {
    fontSize: 10,
  },
  spacingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  spacingLabel: {
    fontSize: 14,
    width: 100,
  },
  radiusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  radiusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  radiusValue: {
    fontSize: 10,
  },
  motionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  motionLabel: {
    fontSize: 14,
    width: 120,
  },
});

export default TokenDemo;
