import { Box } from '@/ui/adapters';
import { Text } from '@/ui/primitives';
import { tokens } from '@/ui/tokens';

export default function PreviewScreen() {
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
        App Preview
      </Text>
      <Text
        variant="body"
        align="center"
        color="secondary"
        style={{ marginTop: tokens.spacing.xs }}
      >
        WebView preview coming soon...
      </Text>
    </Box>
  );
}
