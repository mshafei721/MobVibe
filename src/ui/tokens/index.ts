import { colors, colorsLight, colorsDark } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';
import { motion } from './motion';
import { elevation } from './elevation';

export const tokens = {
  colors,
  typography,
  spacing: { ...spacing, borderRadius },
  motion,
  elevation,
};

export {
  colors,
  colorsLight,
  colorsDark,
  typography,
  spacing,
  borderRadius,
  motion,
  elevation,
};
