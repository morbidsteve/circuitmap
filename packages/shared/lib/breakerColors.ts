import type { Breaker } from '../types/panel';

export interface BreakerColorSet {
  fill: string;
  stroke: string;
  text: string;
}

export const CIRCUIT_TYPE_COLORS: Record<string, BreakerColorSet> = {
  general: { fill: '#3B82F6', stroke: '#1D4ED8', text: '#FFFFFF' },
  lighting: { fill: '#EAB308', stroke: '#A16207', text: '#1F2937' },
  kitchen: { fill: '#F97316', stroke: '#C2410C', text: '#FFFFFF' },
  bathroom: { fill: '#06B6D4', stroke: '#0E7490', text: '#FFFFFF' },
  appliance: { fill: '#EF4444', stroke: '#B91C1C', text: '#FFFFFF' },
  hvac: { fill: '#8B5CF6', stroke: '#6D28D9', text: '#FFFFFF' },
  outdoor: { fill: '#22C55E', stroke: '#15803D', text: '#FFFFFF' },
  garage: { fill: '#64748B', stroke: '#475569', text: '#FFFFFF' },
  dryer: { fill: '#DC2626', stroke: '#991B1B', text: '#FFFFFF' },
  range: { fill: '#B91C1C', stroke: '#7F1D1D', text: '#FFFFFF' },
  water_heater: { fill: '#F59E0B', stroke: '#D97706', text: '#1F2937' },
  ev_charger: { fill: '#10B981', stroke: '#047857', text: '#FFFFFF' },
  pool: { fill: '#0EA5E9', stroke: '#0284C7', text: '#FFFFFF' },
  subpanel: { fill: '#A855F7', stroke: '#7E22CE', text: '#FFFFFF' },
  other: { fill: '#6B7280', stroke: '#4B5563', text: '#FFFFFF' },
};

export const UNASSIGNED_COLOR: BreakerColorSet = {
  fill: '#9CA3AF',
  stroke: '#6B7280',
  text: '#FFFFFF',
};

export function getBreakerColors(
  breakerId: string | null | undefined,
  breakers: Breaker[]
): BreakerColorSet {
  if (!breakerId) {
    return UNASSIGNED_COLOR;
  }

  const breaker = breakers.find((b) => b.id === breakerId);
  if (!breaker) {
    return UNASSIGNED_COLOR;
  }

  return CIRCUIT_TYPE_COLORS[breaker.circuitType] ?? CIRCUIT_TYPE_COLORS.other;
}

export function getCircuitTypeColor(circuitType: string): BreakerColorSet {
  return CIRCUIT_TYPE_COLORS[circuitType] ?? CIRCUIT_TYPE_COLORS.other;
}

// Generate a distinct color for each breaker based on its position in the list
// Useful when you want each breaker to have a unique color regardless of circuit type
export function getBreakerUniqueColor(breakerIndex: number): string {
  const colors = [
    '#3B82F6',
    '#EF4444',
    '#22C55E',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#F97316',
    '#84CC16',
    '#6366F1',
    '#14B8A6',
    '#F43F5E',
    '#A855F7',
    '#0EA5E9',
    '#10B981',
  ];
  return colors[breakerIndex % colors.length];
}
