import { useRouter } from 'expo-router';
import { Box } from '@/ui/adapters';
import { Text, Button } from '@/ui/primitives';
import { tokens } from '@/ui/tokens';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    router.push('/(auth)/login');
  };

  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor={tokens.colors.background.base}
    >
      <Text
        variant="h1"
        color="primary"
        accessibilityRole="header"
      >
        MobVibe
      </Text>
      <Text
        variant="body"
        color="secondary"
        style={{ marginBottom: tokens.spacing.xl }}
      >
        AI-Powered Mobile App Builder
      </Text>
      <Button
        variant="primary"
        onPress={handleGetStarted}
        accessibilityLabel="Get started with MobVibe"
        accessibilityHint="Navigate to login screen"
      >
        Get Started
      </Button>
    </Box>
  );
}
