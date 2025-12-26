import { useQuery } from '@tanstack/react-query';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { api } from '../../lib/api';
import type { PanelWithRelations } from '@circuitmap/shared';

function PanelCard({ panel }: { panel: PanelWithRelations }) {
  const breakerCount = panel.breakers?.length || 0;
  const deviceCount =
    panel.floors?.reduce(
      (acc, floor) =>
        acc + floor.rooms.reduce((roomAcc, room) => roomAcc + (room.devices?.length || 0), 0),
      0
    ) || 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/panel/${panel.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{panel.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{panel.mainAmperage}A</Text>
        </View>
      </View>

      {panel.address && <Text style={styles.address}>{panel.address}</Text>}

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{breakerCount}</Text>
          <Text style={styles.statLabel}>Breakers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{panel.floors?.length || 0}</Text>
          <Text style={styles.statLabel}>Floors</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{deviceCount}</Text>
          <Text style={styles.statLabel}>Devices</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.brand}>{panel.brand?.toUpperCase()}</Text>
        <Text style={styles.slots}>{panel.totalSlots} slots</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PanelsScreen() {
  const {
    data: panels,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['panels'],
    queryFn: api.getPanels,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading panels...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load panels</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!panels?.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>⚡</Text>
        <Text style={styles.emptyTitle}>No panels yet</Text>
        <Text style={styles.emptyText}>
          Add your first electrical panel to get started
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // TODO: Navigate to add panel screen
          }}
        >
          <Text style={styles.addButtonText}>Add Panel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={panels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PanelCard panel={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          // TODO: Navigate to add panel screen
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  badge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  slots: {
    fontSize: 12,
    color: '#94A3B8',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
  },
});
