import { Redirect, Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../../lib/auth';

// Simple icon components (can be replaced with @expo/vector-icons later)
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    panels: '⚡',
    settings: '⚙️',
  };

  return (
    <Text style={[styles.icon, focused && styles.iconFocused]}>
      {icons[name] || '•'}
    </Text>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Wait for auth to initialize
  if (isLoading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="panels"
        options={{
          title: 'Panels',
          headerTitle: 'My Panels',
          tabBarIcon: ({ focused }) => <TabIcon name="panels" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    height: 60,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  headerTitle: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '600',
  },
  icon: {
    fontSize: 24,
  },
  iconFocused: {
    transform: [{ scale: 1.1 }],
  },
});
