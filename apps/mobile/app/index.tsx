import { Redirect } from 'expo-router';
import { useAuthStore } from '../lib/auth';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return null; // Or splash screen
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/panels" />;
  }

  return <Redirect href="/(auth)/login" />;
}
