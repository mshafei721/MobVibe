/**
 * Mock Adapter Implementation
 *
 * This mock adapter implements the same interfaces as the gluestack adapter
 * but uses React Native components directly. This proves the adapter pattern
 * allows for library swapping without changing primitive components.
 *
 * Purpose: Test adapter swappability in adapter-swap.test.tsx
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  Text as RNText,
  TextInput as RNTextInput,
  ActivityIndicator as RNActivityIndicator,
  Modal as RNModal,
} from 'react-native';
import type {
  BoxProps,
  PressableProps,
  AdapterTextProps,
  AdapterTextInputProps,
  AdapterActivityIndicatorProps,
  AdapterModalProps,
} from '../types';

/**
 * Mock Box - Uses React Native View
 */
export const Box: React.FC<BoxProps> = (props) => {
  return <View {...props} testID={props.testID || 'mock-box'} />;
};

/**
 * Mock Pressable - Uses React Native TouchableOpacity
 */
export const Pressable: React.FC<PressableProps> = (props) => {
  return <TouchableOpacity {...props} testID={props.testID || 'mock-pressable'} />;
};

/**
 * Mock Text - Uses React Native Text
 */
export const Text: React.FC<AdapterTextProps> = (props) => {
  return <RNText {...props} testID={props.testID || 'mock-text'} />;
};

/**
 * Mock TextInput - Uses React Native TextInput
 */
export const TextInput: React.FC<AdapterTextInputProps> = (props) => {
  return <RNTextInput {...props} testID={props.testID || 'mock-textinput'} />;
};

/**
 * Mock ActivityIndicator - Uses React Native ActivityIndicator
 */
export const ActivityIndicator: React.FC<AdapterActivityIndicatorProps> = (props) => {
  return <RNActivityIndicator {...props} testID={props.testID || 'mock-activity-indicator'} />;
};

/**
 * Mock Modal - Uses React Native Modal
 */
export const Modal: React.FC<AdapterModalProps> = (props) => {
  return <RNModal {...props} testID={props.testID || 'mock-modal'} />;
};
