/**
 * gluestack Adapter Implementation - Barrel Export
 *
 * This file exports all gluestack adapter implementations.
 *
 * Adapter Strategy:
 * - Box, Pressable, Text: Use gluestack components (better styling, press handling, typography)
 * - TextInput, ActivityIndicator, Modal: Use React Native directly (gluestack adds no value)
 *
 * This hybrid approach balances using gluestack where beneficial while maintaining
 * flexibility for custom implementations where needed.
 */

export { Box } from './Box';
export { Pressable } from './Pressable';
export { Text } from './Text';
export { TextInput } from './TextInput';
export { ActivityIndicator } from './ActivityIndicator';
export { Modal } from './Modal';
