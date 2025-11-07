/**
 * Box Adapter - gluestack Implementation
 *
 * Wraps gluestack-ui Box component to provide vendor-agnostic interface.
 * gluestack Box extends React Native View with enhanced styling capabilities.
 */

import { Box as GluestackBox } from '@gluestack-ui/themed';
import type { BoxProps } from '../types';

export const Box = GluestackBox as React.ComponentType<BoxProps>;
