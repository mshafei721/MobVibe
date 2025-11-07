import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Box } from '@/ui/adapters';
import { Text, Input, Button, Divider } from '@/ui/primitives';
import { tokens } from '@/ui/tokens';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { authService } from '@/services/auth/authService';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser, setSession } = useAuthStore();

  const handleEmailLogin = async () => {
    // Clear previous errors
    setEmailError('');

    // Validation
    if (!email) {
      setEmailError('Email address is required');
      ReactNativeHapticFeedback.trigger('notificationError');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      ReactNativeHapticFeedback.trigger('notificationError');
      return;
    }

    ReactNativeHapticFeedback.trigger('impactMedium');
    setIsLoading(true);

    const { error } = await authService.signInWithEmail(email);
    setIsLoading(false);

    if (error) {
      setEmailError(error.message);
      ReactNativeHapticFeedback.trigger('notificationError');
      return;
    }

    ReactNativeHapticFeedback.trigger('notificationSuccess');
    Alert.alert('Success', 'Check your email for the magic link!');
  };

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'apple') => {
    ReactNativeHapticFeedback.trigger('impactLight');
    setIsLoading(true);

    const { error } = await authService.signInWithOAuth(provider);
    setIsLoading(false);

    if (error) {
      ReactNativeHapticFeedback.trigger('notificationError');
      Alert.alert('Error', error.message);
    } else {
      ReactNativeHapticFeedback.trigger('notificationSuccess');
    }
  };

  return (
    <Box
      flex={1}
      justifyContent="center"
      padding={tokens.spacing.lg}
      backgroundColor={tokens.colors.background.base}
    >
      <Text
        variant="h1"
        align="center"
        color="primary"
        style={{ marginBottom: tokens.spacing.xs }}
      >
        Welcome to MobVibe
      </Text>
      <Text
        variant="body"
        align="center"
        color="secondary"
        style={{ marginBottom: tokens.spacing['2xl'] }}
      >
        AI-Powered Mobile App Builder
      </Text>

      <Box style={{ gap: tokens.spacing.md }}>
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError(''); // Clear error on type
          }}
          error={emailError}
          disabled={isLoading}
          autoFocus
          accessibilityLabel="Email address"
          accessibilityHint="Enter your email for magic link authentication"
        />

        <Button
          variant="primary"
          fullWidth
          onPress={handleEmailLogin}
          disabled={isLoading}
          loading={isLoading}
          accessibilityLabel="Continue with email"
          accessibilityHint="Sends a magic link to your email address"
        >
          Continue with Email
        </Button>

        <Divider label="OR" />

        <Button
          variant="secondary"
          fullWidth
          onPress={() => handleOAuthLogin('google')}
          disabled={isLoading}
          accessibilityLabel="Sign in with Google"
        >
          Continue with Google
        </Button>

        <Button
          variant="secondary"
          fullWidth
          onPress={() => handleOAuthLogin('apple')}
          disabled={isLoading}
          accessibilityLabel="Sign in with Apple"
        >
          Continue with Apple
        </Button>

        <Button
          variant="secondary"
          fullWidth
          onPress={() => handleOAuthLogin('github')}
          disabled={isLoading}
          accessibilityLabel="Sign in with GitHub"
        >
          Continue with GitHub
        </Button>
      </Box>
    </Box>
  );
}
