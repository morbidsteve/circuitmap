import type { WallWithOpenings, FloorPlanImage } from './floorplan';

export interface Panel {
  id: string;
  userId: string;
  name: string;
  address?: string;
  brand: string;
  mainAmperage: number;
  totalSlots: number;
  columns: number;
  notes?: string;
  coverPhotoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Breaker {
  id: string;
  panelId: string;
  position: string;
  amperage: number;
  poles: number;
  label: string;
  circuitType: string;
  protectionType: string;
  isOn: boolean;
  notes?: string;
  sortOrder?: number;
  createdAt: Date;
}

export interface Floor {
  id: string;
  panelId: string;
  name: string;
  level: number;
  floorPlanData?: any;
  createdAt: Date;
}

export interface Room {
  id: string;
  floorId: string;
  name: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  createdAt: Date;
}

export type DevicePlacement = 'floor' | 'wall' | 'ceiling';

export interface Device {
  id: string;
  roomId: string;
  breakerId?: string;
  type: string;
  subtype?: string;
  description: string;
  positionX?: number;
  positionY?: number;
  placement: DevicePlacement;
  heightFromFloor?: number; // Height in inches from floor
  estimatedWattage?: number;
  isGfciProtected: boolean;
  notes?: string;
  photoUrl?: string;
  createdAt: Date;
}

export interface RoomWithDevices extends Room {
  devices: Device[];
}

export interface FloorWithRooms extends Floor {
  rooms: RoomWithDevices[];
  walls?: WallWithOpenings[];
  floorPlanImage?: FloorPlanImage | null;
}

export interface PanelWithRelations extends Panel {
  breakers: Breaker[];
  floors: FloorWithRooms[];
}
