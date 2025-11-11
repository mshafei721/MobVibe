/**
 * Notification Manager
 * Centralized service for handling in-app notifications and haptic feedback
 */

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Alert, Platform } from 'react-native';

export type HapticType =
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError'
  | 'selection';

/**
 * Notification Manager
 * Provides haptic feedback and alerts for various session events
 */
export class NotificationManager {
  /**
   * File created notification
   * Light haptic feedback for file creation
   */
  static fileCreated(fileName: string): void {
    console.log('[NotificationManager] File created:', fileName);
    this.triggerHaptic('impactLight');
    // Could show toast notification here
    // Toast.show(`Created: ${fileName}`, { type: 'success' });
  }

  /**
   * File updated notification
   * Light haptic feedback for file updates
   */
  static fileUpdated(fileName: string): void {
    console.log('[NotificationManager] File updated:', fileName);
    this.triggerHaptic('impactLight');
    // Could show toast notification here
    // Toast.show(`Updated: ${fileName}`, { type: 'info' });
  }

  /**
   * File deleted notification
   * Medium haptic feedback for file deletion
   */
  static fileDeleted(fileName: string): void {
    console.log('[NotificationManager] File deleted:', fileName);
    this.triggerHaptic('impactMedium');
    // Could show toast notification here
    // Toast.show(`Deleted: ${fileName}`, { type: 'warning' });
  }

  /**
   * Terminal error notification
   * Error haptic feedback for terminal errors
   */
  static terminalError(message: string): void {
    console.log('[NotificationManager] Terminal error:', message);
    this.triggerHaptic('notificationError');
    // Could show error toast here
    // Toast.show('Terminal error occurred', { type: 'error' });
  }

  /**
   * Terminal success notification
   * Success haptic feedback for successful terminal execution
   */
  static terminalSuccess(): void {
    console.log('[NotificationManager] Terminal success');
    this.triggerHaptic('notificationSuccess');
    // Could show success toast here
    // Toast.show('Command executed successfully', { type: 'success' });
  }

  /**
   * Session completed notification
   * Success haptic feedback and alert dialog
   */
  static sessionCompleted(message?: string): void {
    console.log('[NotificationManager] Session completed');
    this.triggerHaptic('notificationSuccess');
    Alert.alert(
      'Session Complete',
      message || 'Your app is ready! Check the preview tab.',
      [{ text: 'OK', style: 'default' }]
    );
  }

  /**
   * Session error notification
   * Error haptic feedback and alert dialog
   */
  static sessionError(message: string): void {
    console.log('[NotificationManager] Session error:', message);
    this.triggerHaptic('notificationError');
    Alert.alert('Session Error', message, [{ text: 'OK', style: 'cancel' }]);
  }

  /**
   * Preview ready notification
   * Success haptic feedback
   */
  static previewReady(): void {
    console.log('[NotificationManager] Preview ready');
    this.triggerHaptic('notificationSuccess');
    // Could show toast notification here
    // Toast.show('Preview is ready!', { type: 'success' });
  }

  /**
   * Thinking started notification
   * Light selection haptic
   */
  static thinkingStarted(): void {
    console.log('[NotificationManager] Thinking started');
    this.triggerHaptic('selection');
  }

  /**
   * Generic success notification
   */
  static success(message?: string): void {
    console.log('[NotificationManager] Success:', message);
    this.triggerHaptic('notificationSuccess');
    if (message) {
      // Toast.show(message, { type: 'success' });
    }
  }

  /**
   * Generic warning notification
   */
  static warning(message?: string): void {
    console.log('[NotificationManager] Warning:', message);
    this.triggerHaptic('notificationWarning');
    if (message) {
      // Toast.show(message, { type: 'warning' });
    }
  }

  /**
   * Generic error notification
   */
  static error(message?: string): void {
    console.log('[NotificationManager] Error:', message);
    this.triggerHaptic('notificationError');
    if (message) {
      // Toast.show(message, { type: 'error' });
    }
  }

  /**
   * Generic info notification
   */
  static info(message?: string): void {
    console.log('[NotificationManager] Info:', message);
    this.triggerHaptic('selection');
    if (message) {
      // Toast.show(message, { type: 'info' });
    }
  }

  /**
   * Trigger haptic feedback
   * @private
   */
  private static triggerHaptic(type: HapticType): void {
    // Only trigger haptics on mobile platforms
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      ReactNativeHapticFeedback.trigger(type, {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }
  }

  /**
   * Show a confirmation dialog
   */
  static confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.triggerHaptic('impactMedium');
    Alert.alert(title, message, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'OK',
        style: 'default',
        onPress: onConfirm,
      },
    ]);
  }

  /**
   * Show a destructive confirmation dialog
   */
  static confirmDestructive(
    title: string,
    message: string,
    confirmText: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.triggerHaptic('notificationWarning');
    Alert.alert(title, message, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: confirmText,
        style: 'destructive',
        onPress: onConfirm,
      },
    ]);
  }
}
