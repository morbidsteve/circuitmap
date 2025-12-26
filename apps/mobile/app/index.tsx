import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../lib/auth';

export default function Index() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth on app start
    initialize();
  }, []);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>CircuitMap</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
      </View>
    );
  }

  // If authenticated, show "Go to Panels" button
  // If not authenticated, show "Get Started" button
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CircuitMap</Text>
      <Text style={styles.subtitle}>Map your electrical circuits</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (isAuthenticated) {
            router.replace('/(tabs)/panels');
          } else {
            router.push('/(auth)/login');
          }
        }}
      >
        <Text style={styles.buttonText}>
          {isAuthenticated ? 'Go to My Panels' : 'Get Started'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.9,
  },
  loader: {
    marginTop: 32,
  },
  button: {
    marginTop: 48,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '600',
  },
});
