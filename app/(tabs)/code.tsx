import { Box } from '@/ui/adapters';
import { Text } from '@/ui/primitives';
import { tokens } from '@/ui/tokens';

export default function CodeScreen() {
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
        Code Viewer
      </Text>
      <Text
        variant="body"
        align="center"
        color="secondary"
        style={{ marginTop: tokens.spacing.xs }}
      >
        File tree and code viewer coming soon...
      </Text>
    </Box>
  );
}
