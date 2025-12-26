import { Redirect, Slot } from 'expo-router';
import { useAuthStore } from '../../lib/auth';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  // If user is already authenticated, redirect to main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/panels" />;
  }

  // Use Slot instead of Stack to avoid react-native-screens native bridge issues
  return <Slot />;
}
