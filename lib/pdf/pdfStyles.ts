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

// Colors (RGB values 0-255)
export const COLORS = {
  primary: [59, 130, 246] as [number, number, number],      // Blue-500
  secondary: [100, 116, 139] as [number, number, number],   // Slate-500
  success: [34, 197, 94] as [number, number, number],       // Green-500
  warning: [234, 179, 8] as [number, number, number],       // Yellow-500
  danger: [239, 68, 68] as [number, number, number],        // Red-500
  muted: [148, 163, 184] as [number, number, number],       // Slate-400
  dark: [30, 41, 59] as [number, number, number],           // Slate-800
  light: [241, 245, 249] as [number, number, number],       // Slate-100
  white: [255, 255, 255] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],

  // Circuit type colors
  circuit: {
    general: [59, 130, 246] as [number, number, number],    // Blue
    lighting: [234, 179, 8] as [number, number, number],    // Yellow
    kitchen: [249, 115, 22] as [number, number, number],    // Orange
    bathroom: [6, 182, 212] as [number, number, number],    // Cyan
    appliance: [239, 68, 68] as [number, number, number],   // Red
    hvac: [168, 85, 247] as [number, number, number],       // Purple
    outdoor: [34, 197, 94] as [number, number, number],     // Green
    garage: [100, 116, 139] as [number, number, number],    // Slate
    dryer: [220, 38, 38] as [number, number, number],       // Red-600
    range: [185, 28, 28] as [number, number, number],       // Red-700
    ev_charger: [16, 185, 129] as [number, number, number], // Emerald
    other: [107, 114, 128] as [number, number, number],     // Gray
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
export function getCircuitColor(circuitType: string): [number, number, number] {
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
