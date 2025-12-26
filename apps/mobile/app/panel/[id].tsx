import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import type { Breaker } from '@circuitmap/shared';

// Breaker colors based on circuit type
const breakerColors: Record<string, string> = {
  lighting: '#FCD34D',
  outlets: '#60A5FA',
  appliance: '#F87171',
  hvac: '#34D399',
  kitchen: '#FB923C',
  bathroom: '#A78BFA',
  outdoor: '#4ADE80',
  garage: '#94A3B8',
  default: '#E5E7EB',
};

function getBreakerColor(breaker: Breaker): string {
  if (!breaker.isOn) return '#374151';
  return breakerColors[breaker.circuitType || 'default'] || breakerColors.default;
}

function BreakerSlot({ breaker, position }: { breaker: Breaker | null; position: string }) {
  if (!breaker) {
    return (
      <View style={[styles.breakerSlot, styles.emptySlot]}>
        <Text style={styles.emptySlotText}>{position}</Text>
      </View>
    );
  }

  const bgColor = getBreakerColor(breaker);
  const isPole2 = breaker.poles === 2;

  return (
    <View
      style={[
        styles.breakerSlot,
        { backgroundColor: bgColor },
        isPole2 && styles.doublePole,
      ]}
    >
      <View style={styles.breakerContent}>
        <Text style={styles.breakerAmp}>{breaker.amperage}A</Text>
        <Text style={styles.breakerLabel} numberOfLines={2}>
          {breaker.label || 'Unlabeled'}
        </Text>
      </View>
      {!breaker.isOn && (
        <View style={styles.offIndicator}>
          <Text style={styles.offText}>OFF</Text>
        </View>
      )}
    </View>
  );
}

export default function PanelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: panel, isLoading, error } = useQuery({
    queryKey: ['panel', id],
    queryFn: () => api.getPanel(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !panel) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load panel</Text>
          <Text style={styles.errorDetail}>{errorMessage}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Organize breakers by position (left/right columns)
  const leftBreakers: (Breaker | null)[] = [];
  const rightBreakers: (Breaker | null)[] = [];
  const totalSlots = panel.totalSlots || 40;
  const slotsPerSide = totalSlots / 2;

  // Initialize empty slots
  for (let i = 0; i < slotsPerSide; i++) {
    leftBreakers.push(null);
    rightBreakers.push(null);
  }

  // Place breakers in their positions
  panel.breakers?.forEach((breaker) => {
    const pos = breaker.position;
    if (pos) {
      // Parse position like "L1", "R5", etc.
      const side = pos.charAt(0).toUpperCase();
      const slotNum = parseInt(pos.slice(1), 10) - 1;

      if (side === 'L' && slotNum >= 0 && slotNum < slotsPerSide) {
        leftBreakers[slotNum] = breaker;
        // Handle double pole
        if (breaker.poles === 2 && slotNum + 1 < slotsPerSide) {
          leftBreakers[slotNum + 1] = { ...breaker, _isSecondPole: true } as any;
        }
      } else if (side === 'R' && slotNum >= 0 && slotNum < slotsPerSide) {
        rightBreakers[slotNum] = breaker;
        if (breaker.poles === 2 && slotNum + 1 < slotsPerSide) {
          rightBreakers[slotNum + 1] = { ...breaker, _isSecondPole: true } as any;
        }
      }
    }
  });

  const breakerCount = panel.breakers?.length || 0;
  const deviceCount = panel.floors?.reduce(
    (acc, floor) =>
      acc + floor.rooms.reduce((roomAcc, room) => roomAcc + (room.devices?.length || 0), 0),
    0
  ) || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{panel.name}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Panel Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Main Breaker</Text>
            <Text style={styles.infoValue}>{panel.mainAmperage}A</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Brand</Text>
            <Text style={styles.infoValue}>{panel.brand || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Slots</Text>
            <Text style={styles.infoValue}>{totalSlots}</Text>
          </View>
          <View style={styles.statsRow}>
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
        </View>

        {/* Panel Visualization */}
        <View style={styles.panelContainer}>
          <View style={styles.panelBox}>
            {/* Main Breaker */}
            <View style={styles.mainBreaker}>
              <Text style={styles.mainBreakerText}>MAIN</Text>
              <Text style={styles.mainBreakerAmp}>{panel.mainAmperage}A</Text>
            </View>

            {/* Breaker Grid */}
            <View style={styles.breakerGrid}>
              <View style={styles.breakerColumn}>
                {leftBreakers
                  .map((breaker, idx) => ({ breaker, idx }))
                  .filter(({ breaker }) => !(breaker as any)?._isSecondPole)
                  .map(({ breaker, idx }) => (
                    <BreakerSlot
                      key={`L${idx + 1}`}
                      breaker={breaker}
                      position={`L${idx + 1}`}
                    />
                  ))}
              </View>
              <View style={styles.centerBar} />
              <View style={styles.breakerColumn}>
                {rightBreakers
                  .map((breaker, idx) => ({ breaker, idx }))
                  .filter(({ breaker }) => !(breaker as any)?._isSecondPole)
                  .map(({ breaker, idx }) => (
                    <BreakerSlot
                      key={`R${idx + 1}`}
                      breaker={breaker}
                      position={`R${idx + 1}`}
                    />
                  ))}
              </View>
            </View>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Circuit Types</Text>
          <View style={styles.legendGrid}>
            {Object.entries(breakerColors).slice(0, -1).map(([type, color]) => (
              <View key={type} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: color }]} />
                <Text style={styles.legendText}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 8,
  },
  errorDetail: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  infoValue: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    marginTop: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  panelContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  panelBox: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    borderWidth: 3,
    borderColor: '#374151',
  },
  mainBreaker: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  mainBreakerText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  mainBreakerAmp: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  breakerGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  breakerColumn: {
    flex: 1,
  },
  centerBar: {
    width: 8,
    backgroundColor: '#374151',
    marginHorizontal: 4,
    borderRadius: 4,
    alignSelf: 'stretch',
  },
  breakerSlot: {
    height: 44,
    marginVertical: 2,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  emptySlot: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderStyle: 'dashed',
  },
  emptySlotText: {
    color: '#6B7280',
    fontSize: 10,
    textAlign: 'center',
  },
  doublePole: {
    height: 92,
  },
  breakerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakerAmp: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700',
  },
  breakerLabel: {
    color: '#1F2937',
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  offIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  offText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  legend: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
});
