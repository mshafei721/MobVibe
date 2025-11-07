import { Box } from '@/ui/adapters';
import { Text } from '@/ui/primitives';
import { tokens } from '@/ui/tokens';

export default function IconGenScreen() {
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
        Icon Generator
      </Text>
      <Text
        variant="body"
        align="center"
        color="secondary"
        style={{ marginTop: tokens.spacing.xs }}
      >
        2D icons & 3D logos coming soon...
      </Text>
    </Box>
  );
}
