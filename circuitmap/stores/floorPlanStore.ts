import { create } from 'zustand'
import { Room, Device } from '@/types/panel'

interface RoomUpdate {
  positionX?: number
  positionY?: number
  width?: number
  height?: number
}

interface DeviceUpdate {
  positionX?: number
  positionY?: number
  roomId?: string
}

interface FloorPlanState {
  // View state
  selectedFloorId: string | null
  zoom: number
  panOffset: { x: number; y: number }
  snapToGrid: boolean
  gridSize: number
  showWires: boolean

  // Selection state
  selectedRoomId: string | null
  selectedDeviceId: string | null
  highlightedBreakerId: string | null

  // Tool state
  activeTool: 'select' | 'pan' | 'addRoom' | 'addDevice'

  // Pending changes (for optimistic updates before save)
  pendingRoomUpdates: Record<string, RoomUpdate>
  pendingDeviceUpdates: Record<string, DeviceUpdate>
  hasUnsavedChanges: boolean

  // Actions - View
  setSelectedFloorId: (id: string | null) => void
  setZoom: (zoom: number) => void
  setPanOffset: (offset: { x: number; y: number }) => void
  setSnapToGrid: (snap: boolean) => void
  setShowWires: (show: boolean) => void
  setActiveTool: (tool: 'select' | 'pan' | 'addRoom' | 'addDevice') => void

  // Actions - Selection
  selectRoom: (id: string | null) => void
  selectDevice: (id: string | null) => void
  setHighlightedBreaker: (id: string | null) => void

  // Actions - Updates
  updateRoomPosition: (id: string, x: number, y: number) => void
  updateRoomSize: (id: string, width: number, height: number) => void
  updateDevicePosition: (id: string, x: number, y: number, roomId?: string) => void

  // Actions - Save/Discard
  markSaved: () => void
  discardChanges: () => void

  // Computed helpers
  getRoomWithUpdates: (room: Room) => Room
  getDeviceWithUpdates: (device: Device) => Device
}

export const useFloorPlanStore = create<FloorPlanState>((set, get) => ({
  // Initial state
  selectedFloorId: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  snapToGrid: true,
  gridSize: 1, // 1 foot grid
  showWires: true, // Show wire connections by default

  selectedRoomId: null,
  selectedDeviceId: null,
  highlightedBreakerId: null,

  activeTool: 'select',

  pendingRoomUpdates: {},
  pendingDeviceUpdates: {},
  hasUnsavedChanges: false,

  // View actions
  setSelectedFloorId: (id) => set({ selectedFloorId: id, selectedRoomId: null, selectedDeviceId: null }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  setShowWires: (show) => set({ showWires: show }),
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Selection actions
  selectRoom: (id) => set({ selectedRoomId: id, selectedDeviceId: null }),
  selectDevice: (id) => set({ selectedDeviceId: id, selectedRoomId: null }),
  setHighlightedBreaker: (id) => set({ highlightedBreakerId: id }),

  // Update actions
  updateRoomPosition: (id, x, y) => {
    const { snapToGrid, gridSize } = get()
    const snappedX = snapToGrid ? Math.round(x / gridSize) * gridSize : x
    const snappedY = snapToGrid ? Math.round(y / gridSize) * gridSize : y

    set((state) => ({
      pendingRoomUpdates: {
        ...state.pendingRoomUpdates,
        [id]: {
          ...state.pendingRoomUpdates[id],
          positionX: snappedX,
          positionY: snappedY,
        },
      },
      hasUnsavedChanges: true,
    }))
  },

  updateRoomSize: (id, width, height) => {
    const { snapToGrid, gridSize } = get()
    const snappedWidth = snapToGrid ? Math.round(width / gridSize) * gridSize : width
    const snappedHeight = snapToGrid ? Math.round(height / gridSize) * gridSize : height

    set((state) => ({
      pendingRoomUpdates: {
        ...state.pendingRoomUpdates,
        [id]: {
          ...state.pendingRoomUpdates[id],
          width: Math.max(2, snappedWidth),
          height: Math.max(2, snappedHeight),
        },
      },
      hasUnsavedChanges: true,
    }))
  },

  updateDevicePosition: (id, x, y, roomId) => {
    set((state) => ({
      pendingDeviceUpdates: {
        ...state.pendingDeviceUpdates,
        [id]: {
          positionX: x,
          positionY: y,
          ...(roomId && { roomId }),
        },
      },
      hasUnsavedChanges: true,
    }))
  },

  // Save/discard
  markSaved: () => set({
    pendingRoomUpdates: {},
    pendingDeviceUpdates: {},
    hasUnsavedChanges: false,
  }),

  discardChanges: () => set({
    pendingRoomUpdates: {},
    pendingDeviceUpdates: {},
    hasUnsavedChanges: false,
  }),

  // Helpers to get room/device with pending updates applied
  getRoomWithUpdates: (room) => {
    const updates = get().pendingRoomUpdates[room.id]
    if (!updates) return room
    return {
      ...room,
      positionX: updates.positionX ?? room.positionX,
      positionY: updates.positionY ?? room.positionY,
      width: updates.width ?? room.width,
      height: updates.height ?? room.height,
    }
  },

  getDeviceWithUpdates: (device) => {
    const updates = get().pendingDeviceUpdates[device.id]
    if (!updates) return device
    return {
      ...device,
      positionX: updates.positionX ?? device.positionX,
      positionY: updates.positionY ?? device.positionY,
    }
  },
}))
