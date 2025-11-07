/**
 * Text Adapter - gluestack Implementation
 *
 * Wraps gluestack-ui Text component to provide vendor-agnostic interface.
 * gluestack Text extends React Native Text with enhanced typography support.
 */

import { Text as GluestackText } from '@gluestack-ui/themed';
import type { AdapterTextProps } from '../types';

export const Text = GluestackText as React.ComponentType<AdapterTextProps>;
