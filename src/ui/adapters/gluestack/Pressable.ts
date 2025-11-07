/**
 * Pressable Adapter - gluestack Implementation
 *
 * Wraps gluestack-ui Pressable component to provide vendor-agnostic interface.
 * gluestack Pressable extends React Native Pressable/TouchableOpacity with better press handling.
 */

import { Pressable as GluestackPressable } from '@gluestack-ui/themed';
import type { PressableProps } from '../types';

export const Pressable = GluestackPressable as React.ComponentType<PressableProps>;
