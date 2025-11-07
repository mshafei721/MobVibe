/**
 * Adapter Type Definitions
 *
 * These interfaces define the contracts for UI component adapters.
 * They extend React Native prop types to maintain full compatibility
 * while allowing for library-specific implementations.
 *
 * Thin wrapper approach: Minimal abstraction, accept some library leakage
 * for pragmatic development speed and full feature access.
 */

import type {
  ViewProps,
  PressableProps as RNPressableProps,
  TextProps as RNTextProps,
  TextInputProps,
  ActivityIndicatorProps,
  ModalProps,
} from 'react-native';

/**
 * Box Adapter
 * Replaces: React Native View
 * Used in: Card, Divider, Input, ListItem, Sheet, Spinner
 */
export interface BoxProps extends ViewProps {}

/**
 * Pressable Adapter
 * Replaces: React Native TouchableOpacity
 * Used in: Button, Card, Input, ListItem, Sheet
 */
export interface PressableProps extends RNPressableProps {}

/**
 * Text Adapter
 * Replaces: React Native Text
 * Used in: Button, Input, ListItem, Text primitive
 *
 * Note: Named "AdapterTextProps" to avoid naming conflict with React Native TextProps
 */
export interface AdapterTextProps extends RNTextProps {}

/**
 * TextInput Adapter
 * Replaces: React Native TextInput (direct wrapper)
 * Used in: Input
 *
 * Note: Uses React Native TextInput directly as gluestack Input is too opinionated
 */
export interface AdapterTextInputProps extends TextInputProps {}

/**
 * ActivityIndicator Adapter
 * Replaces: React Native ActivityIndicator (direct wrapper)
 * Used in: Spinner
 *
 * Note: Uses React Native ActivityIndicator directly as it's simple and sufficient
 */
export interface AdapterActivityIndicatorProps extends ActivityIndicatorProps {}

/**
 * Modal Adapter
 * Replaces: React Native Modal (direct wrapper)
 * Used in: Sheet
 *
 * Note: Uses React Native Modal directly to maintain custom Sheet implementation
 */
export interface AdapterModalProps extends ModalProps {}
