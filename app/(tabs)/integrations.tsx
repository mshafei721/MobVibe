import { Box } from '@/ui/adapters';
import { Text } from '@/ui/primitives';
import { tokens } from '@/ui/tokens';

export default function IntegrationsScreen() {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor={tokens.colors.background.base}
    >
      <Text
        variant="h1"
        align="center"
        color="primary"
        accessibilityRole="header"
      >
        Integrations
      </Text>
      <Text
        variant="body"
        align="center"
        color="secondary"
        style={{ marginTop: tokens.spacing.xs }}
      >
        Supabase, Stripe, GitHub, Sounds, Haptics...
      </Text>
    </Box>
  );
}
