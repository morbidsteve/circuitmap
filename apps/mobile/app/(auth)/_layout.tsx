import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../lib/auth';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  // If user is already authenticated, redirect to main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/panels" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
