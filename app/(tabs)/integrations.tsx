import { View, Text, StyleSheet } from 'react-native';

export default function IntegrationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Integrations</Text>
      <Text style={styles.subtitle}>Supabase, Stripe, GitHub, Sounds, Haptics...</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});
