import { Badge as PaperBadge } from 'react-native-paper';

/**
 * Badge Adapter
 *
 * Wraps React Native Paper's Badge component.
 * Material Design badges for notification counts or status indicators.
 *
 * @example
 * import { Badge } from '@/ui/adapters';
 *
 * <Badge size={24}>3</Badge>
 */

export const Badge = PaperBadge;
export type BadgeProps = React.ComponentProps<typeof PaperBadge>;
