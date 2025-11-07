/**
 * Modal Adapter - React Native Direct Wrapper
 *
 * Uses React Native Modal directly to maintain our custom Sheet implementation.
 * gluestack has different modal patterns (AlertDialog, Modal, etc.) that don't
 * match our custom Sheet component's requirements.
 *
 * Note: This is intentionally NOT using gluestack - our Sheet primitive has
 * specific UX requirements (reduce motion support, backdrop tap-to-close, etc.)
 * that are best implemented with direct React Native Modal access.
 */

import { Modal as RNModal } from 'react-native';
import type { AdapterModalProps } from '../types';

export const Modal = RNModal as React.ComponentType<AdapterModalProps>;
