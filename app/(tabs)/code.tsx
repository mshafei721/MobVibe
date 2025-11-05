import { View, Text, StyleSheet } from 'react-native';

export default function CodeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Code Viewer</Text>
      <Text style={styles.subtitle}>File tree and code viewer coming soon...</Text>
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
