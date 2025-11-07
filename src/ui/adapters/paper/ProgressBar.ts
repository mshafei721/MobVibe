import { ProgressBar as PaperProgressBar } from 'react-native-paper';

/**
 * ProgressBar Adapter
 *
 * Wraps React Native Paper's ProgressBar component.
 * Material Design linear progress indicator.
 *
 * @example
 * import { ProgressBar } from '@/ui/adapters';
 *
 * <ProgressBar progress={0.7} />
 */

export const ProgressBar = PaperProgressBar;
export type ProgressBarProps = React.ComponentProps<typeof PaperProgressBar>;
