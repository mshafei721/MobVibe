import { Snackbar as PaperSnackbar } from 'react-native-paper';

/**
 * Snackbar Adapter
 *
 * Wraps React Native Paper's Snackbar component.
 * Material Design snackbar for brief messages and actions (Android-style toast).
 *
 * @example
 * import { Snackbar } from '@/ui/adapters';
 *
 * <Snackbar
 *   visible={visible}
 *   onDismiss={onDismiss}
 *   duration={3000}
 * >
 *   Message sent!
 * </Snackbar>
 */

export const Snackbar = PaperSnackbar;
export type SnackbarProps = React.ComponentProps<typeof PaperSnackbar>;
