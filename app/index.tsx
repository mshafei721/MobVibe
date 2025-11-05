import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MobVibe</Text>
      <Text style={styles.subtitle}>AI-Powered Mobile App Builder</Text>
      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkText}>Get Started</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 32,
  },
  link: {
    marginTop: 16,
  },
  linkText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
});
