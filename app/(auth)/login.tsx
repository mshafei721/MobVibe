import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '@/services/auth/authService';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser, setSession } = useAuthStore();

  const handleEmailLogin = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setIsLoading(true);
    const { error } = await authService.signInWithEmail(email);
    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Success', 'Check your email for the magic link!');
  };

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'apple') => {
    setIsLoading(true);
    const { error } = await authService.signInWithOAuth(provider);
    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MobVibe</Text>
      <Text style={styles.subtitle}>AI-Powered Mobile App Builder</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleEmailLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Sending...' : 'Continue with Email'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.oauthButton]}
          onPress={() => handleOAuthLogin('google')}
          disabled={isLoading}
        >
          <Text style={styles.oauthButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.oauthButton]}
          onPress={() => handleOAuthLogin('apple')}
          disabled={isLoading}
        >
          <Text style={styles.oauthButtonText}>Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.oauthButton]}
          onPress={() => handleOAuthLogin('github')}
          disabled={isLoading}
        >
          <Text style={styles.oauthButtonText}>Continue with GitHub</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  oauthButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  oauthButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
