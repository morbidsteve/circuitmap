// Point represents a 2D coordinate in feet
export interface Point {
  x: number;
  y: number;
}

// Wall represents a wall segment in the floor plan
export interface Wall {
  id: string;
  floorId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  isExterior: boolean;
  createdAt: Date;
}

// Wall with its openings
export interface WallWithOpenings extends Wall {
  openings: Opening[];
}

// Opening represents a door, window, or archway in a wall
export interface Opening {
  id: string;
  wallId: string;
  type: OpeningType;
  position: number; // 0-1 along wall
  width: number;
  height?: number;
}

export type OpeningType = 'door' | 'window' | 'archway';

// Background image for tracing floor plans
export interface FloorPlanImage {
  id: string;
  floorId: string;
  imageUrl: string;
  scale: number; // Pixels per foot
  offsetX: number;
  offsetY: number;
  rotation: number;
  opacity: number;
  isVisible: boolean;
  createdAt: Date;
}

// State for wall drawing interaction
export interface WallDrawingState {
  isDrawing: boolean;
  startPoint: Point | null;
  previewPoint: Point | null;
  chainPoints: Point[]; // For drawing connected wall chains
}

// Available floor plan tools
export type FloorPlanTool =
  | 'select'
  | 'pan'
  | 'wall'
  | 'door'
  | 'window'
  | 'room'
  | 'device'
  | 'eraser';

// Snap settings for drawing
export interface SnapSettings {
  snapToGrid: boolean;
  snapToWall: boolean;
  gridSize: number; // In feet
  snapDistance: number; // In feet (for wall endpoint snapping)
}

// Wall creation input (for API)
export interface CreateWallInput {
  floorId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness?: number;
  isExterior?: boolean;
}

// Wall update input (for API)
export interface UpdateWallInput {
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  thickness?: number;
  isExterior?: boolean;
}

// Opening creation input (for API)
export interface CreateOpeningInput {
  wallId: string;
  type: OpeningType;
  position: number;
  width: number;
  height?: number;
}

// Opening update input (for API)
export interface UpdateOpeningInput {
  type?: OpeningType;
  position?: number;
  width?: number;
  height?: number;
}

// Floor plan image creation input (for API)
export interface CreateFloorPlanImageInput {
  floorId: string;
  imageUrl: string;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
  opacity?: number;
  isVisible?: boolean;
}

// Floor plan image update input (for API)
export interface UpdateFloorPlanImageInput {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
  opacity?: number;
  isVisible?: boolean;
}

// Circuit tracing highlight modes
export type HighlightMode = 'none' | 'breaker' | 'device' | 'circuit';

// Helper to calculate wall length
export function getWallLength(wall: Wall | { startX: number; startY: number; endX: number; endY: number }): number {
  const dx = wall.endX - wall.startX;
  const dy = wall.endY - wall.startY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Helper to calculate wall angle in radians
export function getWallAngle(wall: Wall | { startX: number; startY: number; endX: number; endY: number }): number {
  return Math.atan2(wall.endY - wall.startY, wall.endX - wall.startX);
}

// Helper to get a point along the wall at a given percentage (0-1)
export function getPointAlongWall(
  wall: Wall | { startX: number; startY: number; endX: number; endY: number },
  percentage: number
): Point {
  return {
    x: wall.startX + (wall.endX - wall.startX) * percentage,
    y: wall.startY + (wall.endY - wall.startY) * percentage,
  };
}

// Helper to find distance from a point to a wall segment
export function distanceToWall(
  point: Point,
  wall: Wall | { startX: number; startY: number; endX: number; endY: number }
): number {
  const A = point.x - wall.startX;
  const B = point.y - wall.startY;
  const C = wall.endX - wall.startX;
  const D = wall.endY - wall.startY;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = wall.startX;
    yy = wall.startY;
  } else if (param > 1) {
    xx = wall.endX;
    yy = wall.endY;
  } else {
    xx = wall.startX + param * C;
    yy = wall.startY + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}
