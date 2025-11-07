import { FAB as PaperFAB } from 'react-native-paper';

/**
 * FAB (Floating Action Button) Adapter
 *
 * Wraps React Native Paper's FAB component.
 * Material Design floating action button for primary actions.
 *
 * @example
 * import { FAB } from '@/ui/adapters';
 *
 * <FAB icon="plus" onPress={handlePress} />
 */

export const FAB = PaperFAB;
export type FABProps = React.ComponentProps<typeof PaperFAB>;
