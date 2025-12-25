/**
 * PDF Styling Constants for CircuitMap Panel Reports
 */

// Page dimensions (Letter size in points: 612 x 792)
export const PAGE = {
  WIDTH: 612,
  HEIGHT: 792,
  MARGIN: 50,
  CONTENT_WIDTH: 512, // 612 - 50*2
} as const;

// Helper to convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Colors as hex strings (more compatible with PDFKit)
export const COLORS = {
  primary: '#3B82F6',      // Blue-500
  secondary: '#64748B',    // Slate-500
  success: '#22C55E',      // Green-500
  warning: '#EAB308',      // Yellow-500
  danger: '#EF4444',       // Red-500
  muted: '#94A3B8',        // Slate-400
  dark: '#1E293B',         // Slate-800
  light: '#F1F5F9',        // Slate-100
  white: '#FFFFFF',
  black: '#000000',

  // Circuit type colors
  circuit: {
    general: '#3B82F6',    // Blue
    lighting: '#EAB308',   // Yellow
    kitchen: '#F97316',    // Orange
    bathroom: '#06B6D4',   // Cyan
    appliance: '#EF4444',  // Red
    hvac: '#A855F7',       // Purple
    outdoor: '#22C55E',    // Green
    garage: '#64748B',     // Slate
    dryer: '#DC2626',      // Red-600
    range: '#B91C1C',      // Red-700
    ev_charger: '#10B981', // Emerald
    other: '#6B7280',      // Gray
  },
} as const;

// Font sizes
export const FONTS = {
  title: 24,
  heading1: 18,
  heading2: 14,
  heading3: 12,
  body: 10,
  small: 9,
  tiny: 8,
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Table styling
export const TABLE = {
  headerHeight: 24,
  rowHeight: 20,
  cellPadding: 6,
  borderWidth: 0.5,
} as const;

// Get circuit type color
export function getCircuitColor(circuitType: string): string {
  const type = circuitType?.toLowerCase() || 'other';
  return COLORS.circuit[type as keyof typeof COLORS.circuit] || COLORS.circuit.other;
}

// Protection type labels
export const PROTECTION_LABELS: Record<string, string> = {
  standard: '',
  gfci: 'GFCI',
  afci: 'AFCI',
  dual: 'GFCI/AFCI',
  dual_function: 'GFCI/AFCI',
};

// Circuit type labels
export const CIRCUIT_TYPE_LABELS: Record<string, string> = {
  general: 'General',
  lighting: 'Lighting',
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  appliance: 'Appliance',
  hvac: 'HVAC',
  outdoor: 'Outdoor',
  garage: 'Garage',
  dryer: 'Dryer',
  range: 'Range',
  ev_charger: 'EV Charger',
  other: 'Other',
};

// Device type labels
export const DEVICE_TYPE_LABELS: Record<string, string> = {
  outlet: 'Outlet',
  light: 'Light',
  switch: 'Switch',
  appliance: 'Appliance',
  fan: 'Fan',
  hvac: 'HVAC',
  water_heater: 'Water Heater',
  dryer: 'Dryer',
  range: 'Range',
  ev_charger: 'EV Charger',
  pool: 'Pool',
  smoke_detector: 'Smoke Detector',
  other: 'Other',
};

// Placement labels
export const PLACEMENT_LABELS: Record<string, string> = {
  floor: 'Floor',
  wall: 'Wall',
  ceiling: 'Ceiling',
};
