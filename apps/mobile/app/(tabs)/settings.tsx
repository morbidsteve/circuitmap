import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../lib/auth';

function SettingsItem({
  title,
  subtitle,
  onPress,
  danger,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, danger && styles.itemTitleDanger]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierBadgeText}>
                  {user?.subscriptionTier?.toUpperCase() || 'FREE'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <SettingsItem
            title="Notifications"
            subtitle="Manage push notifications"
            onPress={() => {
              // TODO: Implement
            }}
          />
          <View style={styles.divider} />
          <SettingsItem
            title="Appearance"
            subtitle="Light / Dark / System"
            onPress={() => {
              // TODO: Implement
            }}
          />
        </View>
      </View>

      {/* Subscription Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.card}>
          <SettingsItem
            title="Manage Subscription"
            subtitle={`Current plan: ${user?.subscriptionTier || 'Free'}`}
            onPress={() => {
              // TODO: Open billing portal
            }}
          />
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
          <SettingsItem
            title="Help Center"
            onPress={() => {
              // TODO: Implement
            }}
          />
          <View style={styles.divider} />
          <SettingsItem
            title="Send Feedback"
            onPress={() => {
              // TODO: Implement
            }}
          />
          <View style={styles.divider} />
          <SettingsItem
            title="About CircuitMap"
            subtitle="Version 1.0.0"
            onPress={() => {
              // TODO: Implement
            }}
          />
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <View style={styles.card}>
          <SettingsItem title="Sign Out" onPress={handleLogout} danger />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>CircuitMap v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profile: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  tierBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: '#1F2937',
  },
  itemTitleDanger: {
    color: '#EF4444',
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
