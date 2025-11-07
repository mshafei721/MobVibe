/**
 * UI Adapter Facade
 *
 * Single import point for all UI adapters.
 *
 * Current implementations:
 * - Phase 06: gluestack-ui (hybrid approach for core primitives)
 * - Phase 07: react-native-paper (Material Design components for Android)
 * - Phase 07: lottie-react-native (vector animations)
 * - Phase 07: react-native-gifted-chat (chat UI)
 *
 * All primitives and components import from this file, not from implementations directly.
 * This enables library swapping without modifying component code.
 */

// Phase 06: Core adapters (Box, Pressable, Text, TextInput, ActivityIndicator, Modal)
export * from './gluestack';

// Phase 07: Specialized libraries
export * from './paper';         // FAB, Chip, Badge, ProgressBar, Snackbar (Android-specific)
export * from './lottie';         // Animation component
export * from './gifted-chat';    // Chat component

// Type exports
export type * from './types';
