import { Chip as PaperChip } from 'react-native-paper';

/**
 * Chip Adapter
 *
 * Wraps React Native Paper's Chip component.
 * Material Design chips for compact elements like tags or filters.
 *
 * @example
 * import { Chip } from '@/ui/adapters';
 *
 * <Chip mode="outlined" onPress={handlePress}>Label</Chip>
 */

export const Chip = PaperChip;
export type ChipProps = React.ComponentProps<typeof PaperChip>;
