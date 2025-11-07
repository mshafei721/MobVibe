import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { colorsLight, colorsDark, borderRadius } from '../tokens';

/**
 * React Native Paper Theme Configuration
 *
 * Maps MobVibe design tokens to Paper's Material Design 3 (MD3) theme structure.
 * This ensures visual consistency between custom primitives and Paper components.
 */

export const paperLightTheme = {
  ...MD3LightTheme,
  roundness: borderRadius.md,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors
    primary: colorsLight.primary[500],
    primaryContainer: colorsLight.primary[100],
    onPrimary: '#FFFFFF',
    onPrimaryContainer: colorsLight.primary[900],

    // Secondary colors
    secondary: colorsLight.secondary[500],
    secondaryContainer: colorsLight.secondary[100],
    onSecondary: '#FFFFFF',
    onSecondaryContainer: colorsLight.secondary[900],

    // Tertiary colors (using info for tertiary)
    tertiary: colorsLight.info[500],
    tertiaryContainer: colorsLight.info[100],
    onTertiary: '#FFFFFF',
    onTertiaryContainer: colorsLight.info[900],

    // Error colors
    error: colorsLight.error[500],
    errorContainer: colorsLight.error[100],
    onError: '#FFFFFF',
    onErrorContainer: colorsLight.error[900],

    // Background colors
    background: colorsLight.background.base,
    onBackground: colorsLight.text.primary,

    // Surface colors
    surface: colorsLight.surface[0],
    surfaceVariant: colorsLight.surface[2],
    onSurface: colorsLight.text.primary,
    onSurfaceVariant: colorsLight.text.secondary,

    // Outline colors
    outline: colorsLight.border.base,
    outlineVariant: colorsLight.border.subtle,

    // Inverse colors
    inverseSurface: colorsDark.surface[0],
    inverseOnSurface: colorsDark.text.primary,
    inversePrimary: colorsLight.primary[200],

    // Shadow
    shadow: colorsLight.neutral[900],
    scrim: colorsLight.neutral[900],

    // Backdrop
    backdrop: 'rgba(0, 0, 0, 0.4)',

    // Elevation colors (Material You)
    elevation: {
      level0: 'transparent',
      level1: colorsLight.surface[1],
      level2: colorsLight.surface[2],
      level3: colorsLight.surface[3],
      level4: colorsLight.neutral[300],
      level5: colorsLight.neutral[400],
    },

    // Surface disabled
    surfaceDisabled: `rgba(${colorsLight.text.primary}, 0.12)`,
    onSurfaceDisabled: colorsLight.text.disabled,
  },
};

export const paperDarkTheme = {
  ...MD3DarkTheme,
  roundness: borderRadius.md,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors
    primary: colorsDark.primary[300],
    primaryContainer: colorsDark.primary[700],
    onPrimary: colorsDark.primary[900],
    onPrimaryContainer: colorsDark.primary[100],

    // Secondary colors
    secondary: colorsDark.secondary[300],
    secondaryContainer: colorsDark.secondary[700],
    onSecondary: colorsDark.secondary[900],
    onSecondaryContainer: colorsDark.secondary[100],

    // Tertiary colors (using info for tertiary)
    tertiary: colorsDark.info[300],
    tertiaryContainer: colorsDark.info[700],
    onTertiary: colorsDark.info[900],
    onTertiaryContainer: colorsDark.info[100],

    // Error colors
    error: colorsDark.error[400],
    errorContainer: colorsDark.error[800],
    onError: colorsDark.error[900],
    onErrorContainer: colorsDark.error[100],

    // Background colors
    background: colorsDark.background.base,
    onBackground: colorsDark.text.primary,

    // Surface colors
    surface: colorsDark.surface[0],
    surfaceVariant: colorsDark.surface[2],
    onSurface: colorsDark.text.primary,
    onSurfaceVariant: colorsDark.text.secondary,

    // Outline colors
    outline: colorsDark.border.base,
    outlineVariant: colorsDark.border.subtle,

    // Inverse colors
    inverseSurface: colorsLight.surface[0],
    inverseOnSurface: colorsLight.text.primary,
    inversePrimary: colorsDark.primary[700],

    // Shadow
    shadow: colorsDark.neutral[950],
    scrim: colorsDark.neutral[950],

    // Backdrop
    backdrop: 'rgba(0, 0, 0, 0.6)',

    // Elevation colors (Material You)
    elevation: {
      level0: 'transparent',
      level1: colorsDark.surface[1],
      level2: colorsDark.surface[2],
      level3: colorsDark.surface[3],
      level4: colorsDark.neutral[600],
      level5: colorsDark.neutral[500],
    },

    // Surface disabled
    surfaceDisabled: `rgba(${colorsDark.text.primary}, 0.12)`,
    onSurfaceDisabled: colorsDark.text.disabled,
  },
};
