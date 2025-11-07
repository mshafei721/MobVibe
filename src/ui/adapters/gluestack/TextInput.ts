/**
 * TextInput Adapter - React Native Direct Wrapper
 *
 * Uses React Native TextInput directly as gluestack Input is too opinionated
 * and doesn't support our custom floating label pattern.
 *
 * Note: This is intentionally NOT using gluestack - our custom Input primitive
 * requires direct access to React Native TextInput for full control.
 */

import { TextInput as RNTextInput } from 'react-native';
import type { AdapterTextInputProps } from '../types';

export const TextInput = RNTextInput as React.ComponentType<AdapterTextInputProps>;
