import { create } from 'zustand'
import { Room, Device } from '@/types/panel'
import type {
  Point,
  FloorPlanTool,
  WallDrawingState,
  HighlightMode,
  Wall,
  Opening,
  ViewMode,
  CameraPreset,
  ThreeDSettings,
} from '@/types/floorplan'

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

interface WallUpdate {
  startX?: number
  startY?: number
  endX?: number
  endY?: number
  thickness?: number
  isExterior?: boolean
}

interface PendingWall {
  floorId: string
  startX: number
  startY: number
  endX: number
  endY: number
  thickness: number
  isExterior: boolean
}

interface FloorPlanState {
  // View state
  selectedFloorId: string | null
  zoom: number
  panOffset: { x: number; y: number }
  snapToGrid: boolean
  snapToWall: boolean
  gridSize: number
  showWires: boolean
  showDimensions: boolean
  showBackgroundImage: boolean

  // 3D View state
  viewMode: ViewMode
  threeDSettings: ThreeDSettings

  // Selection state
  selectedRoomId: string | null
  selectedDeviceId: string | null
  selectedWallId: string | null
  selectedOpeningId: string | null

  // Circuit tracing / highlighting state
  highlightMode: HighlightMode
  highlightedBreakerId: string | null
  highlightedDeviceId: string | null
  highlightedCircuitDeviceIds: string[]

  // Tool state
  activeTool: FloorPlanTool

  // Wall drawing state
  wallDrawingState: WallDrawingState

  // Pending changes (for optimistic updates before save)
  pendingRoomUpdates: Record<string, RoomUpdate>
  pendingDeviceUpdates: Record<string, DeviceUpdate>
  pendingWallUpdates: Record<string, WallUpdate>
  pendingWallCreations: PendingWall[]
  pendingWallDeletions: string[]
  hasUnsavedChanges: boolean

  // Actions - View
  setSelectedFloorId: (id: string | null) => void
  setZoom: (zoom: number) => void
  setPanOffset: (offset: { x: number; y: number }) => void
  setSnapToGrid: (snap: boolean) => void
  setSnapToWall: (snap: boolean) => void
  setShowWires: (show: boolean) => void
  setShowDimensions: (show: boolean) => void
  setShowBackgroundImage: (show: boolean) => void
  setActiveTool: (tool: FloorPlanTool) => void

  // Actions - 3D View
  setViewMode: (mode: ViewMode) => void
  setThreeDSettings: (settings: Partial<ThreeDSettings>) => void
  setCameraPreset: (preset: CameraPreset) => void

  // Actions - Selection
  selectRoom: (id: string | null) => void
  selectDevice: (id: string | null) => void
  selectWall: (id: string | null) => void
  selectOpening: (id: string | null) => void
  clearSelection: () => void

  // Actions - Circuit Tracing
  highlightBreaker: (breakerId: string | null) => void
  highlightDevice: (deviceId: string | null, siblingDeviceIds?: string[], breakerId?: string | null) => void
  highlightCircuit: (breakerId: string, deviceIds: string[]) => void
  clearHighlight: () => void
  setHighlightedBreaker: (id: string | null) => void // Legacy compatibility

  // Actions - Wall Drawing
  startWallDrawing: (point: Point) => void
  updateWallPreview: (point: Point) => void
  finishWallSegment: () => void
  cancelWallDrawing: () => void
  addPendingWall: (wall: PendingWall) => void

  // Actions - Wall Updates
  updateWallEndpoint: (id: string, endpoint: 'start' | 'end', point: Point) => void
  updateWallThickness: (id: string, thickness: number) => void
  markWallForDeletion: (id: string) => void

  // Actions - Updates (existing)
  updateRoomPosition: (id: string, x: number, y: number) => void
  updateRoomSize: (id: string, width: number, height: number) => void
  updateDevicePosition: (id: string, x: number, y: number, roomId?: string) => void

  // Actions - Save/Discard
  markSaved: () => void
  discardChanges: () => void

  // Computed helpers
  getRoomWithUpdates: (room: Room) => Room
  getDeviceWithUpdates: (device: Device) => Device
  getWallWithUpdates: (wall: Wall) => Wall
  isWallDeleted: (wallId: string) => boolean
}

export const useFloorPlanStore = create<FloorPlanState>((set, get) => ({
  // Initial state - View
  selectedFloorId: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  snapToGrid: true,
  snapToWall: true,
  gridSize: 1, // 1 foot grid
  showWires: true,
  showDimensions: true,
  showBackgroundImage: true,

  // Initial state - 3D View
  viewMode: '2d',
  threeDSettings: {
    showAllFloors: false,
    floorSpacing: 3,
    cameraPreset: 'isometric',
    showWireRouting: true,
    animateWires: false,
    ceilingHeight: 8,
  },

  // Initial state - Selection
  selectedRoomId: null,
  selectedDeviceId: null,
  selectedWallId: null,
  selectedOpeningId: null,

  // Initial state - Circuit tracing
  highlightMode: 'none',
  highlightedBreakerId: null,
  highlightedDeviceId: null,
  highlightedCircuitDeviceIds: [],

  // Initial state - Tool
  activeTool: 'select',

  // Initial state - Wall drawing
  wallDrawingState: {
    isDrawing: false,
    startPoint: null,
    previewPoint: null,
    chainPoints: [],
  },

  // Initial state - Pending changes
  pendingRoomUpdates: {},
  pendingDeviceUpdates: {},
  pendingWallUpdates: {},
  pendingWallCreations: [],
  pendingWallDeletions: [],
  hasUnsavedChanges: false,

  // View actions
  setSelectedFloorId: (id) => set({
    selectedFloorId: id,
    selectedRoomId: null,
    selectedDeviceId: null,
    selectedWallId: null,
    selectedOpeningId: null,
    wallDrawingState: {
      isDrawing: false,
      startPoint: null,
      previewPoint: null,
      chainPoints: [],
    },
  }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  setSnapToWall: (snap) => set({ snapToWall: snap }),
  setShowWires: (show) => set({ showWires: show }),
  setShowDimensions: (show) => set({ showDimensions: show }),
  setShowBackgroundImage: (show) => set({ showBackgroundImage: show }),
  setActiveTool: (tool) => {
    // Cancel wall drawing when switching tools
    if (tool !== 'wall') {
      set({
        activeTool: tool,
        wallDrawingState: {
          isDrawing: false,
          startPoint: null,
          previewPoint: null,
          chainPoints: [],
        },
      })
    } else {
      set({ activeTool: tool })
    }
  },

  // 3D View actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setThreeDSettings: (settings) => set((state) => ({
    threeDSettings: { ...state.threeDSettings, ...settings },
  })),
  setCameraPreset: (preset) => set((state) => ({
    threeDSettings: { ...state.threeDSettings, cameraPreset: preset },
  })),

  // Selection actions
  selectRoom: (id) => set({
    selectedRoomId: id,
    selectedDeviceId: null,
    selectedWallId: null,
    selectedOpeningId: null,
  }),
  selectDevice: (id) => set({
    selectedDeviceId: id,
    selectedRoomId: null,
    selectedWallId: null,
    selectedOpeningId: null,
  }),
  selectWall: (id) => set({
    selectedWallId: id,
    selectedRoomId: null,
    selectedDeviceId: null,
    selectedOpeningId: null,
  }),
  selectOpening: (id) => set({
    selectedOpeningId: id,
    selectedWallId: null,
    selectedRoomId: null,
    selectedDeviceId: null,
  }),
  clearSelection: () => set({
    selectedRoomId: null,
    selectedDeviceId: null,
    selectedWallId: null,
    selectedOpeningId: null,
  }),

  // Circuit tracing actions
  highlightBreaker: (breakerId) => set({
    highlightMode: breakerId ? 'breaker' : 'none',
    highlightedBreakerId: breakerId,
    highlightedDeviceId: null,
    highlightedCircuitDeviceIds: [],
  }),
  highlightDevice: (deviceId, siblingDeviceIds = [], breakerId = null) => set({
    highlightMode: deviceId ? 'device' : 'none',
    highlightedDeviceId: deviceId,
    highlightedBreakerId: breakerId,
    highlightedCircuitDeviceIds: siblingDeviceIds,
  }),
  highlightCircuit: (breakerId, deviceIds) => set({
    highlightMode: 'circuit',
    highlightedBreakerId: breakerId,
    highlightedDeviceId: null,
    highlightedCircuitDeviceIds: deviceIds,
  }),
  clearHighlight: () => set({
    highlightMode: 'none',
    highlightedBreakerId: null,
    highlightedDeviceId: null,
    highlightedCircuitDeviceIds: [],
  }),
  setHighlightedBreaker: (id) => set({
    highlightMode: id ? 'breaker' : 'none',
    highlightedBreakerId: id,
  }),

  // Wall drawing actions
  startWallDrawing: (point) => {
    const { snapToGrid, gridSize } = get()
    const snappedPoint = snapToGrid
      ? { x: Math.round(point.x / gridSize) * gridSize, y: Math.round(point.y / gridSize) * gridSize }
      : point

    set((state) => ({
      wallDrawingState: {
        ...state.wallDrawingState,
        isDrawing: true,
        startPoint: snappedPoint,
        previewPoint: snappedPoint,
        chainPoints: [...state.wallDrawingState.chainPoints, snappedPoint],
      },
    }))
  },

  updateWallPreview: (point) => {
    const { snapToGrid, gridSize } = get()
    const snappedPoint = snapToGrid
      ? { x: Math.round(point.x / gridSize) * gridSize, y: Math.round(point.y / gridSize) * gridSize }
      : point

    set((state) => ({
      wallDrawingState: {
        ...state.wallDrawingState,
        previewPoint: snappedPoint,
      },
    }))
  },

  finishWallSegment: () => {
    const state = get()
    const { wallDrawingState, selectedFloorId, snapToGrid, gridSize } = state

    if (!wallDrawingState.isDrawing || !wallDrawingState.startPoint || !wallDrawingState.previewPoint || !selectedFloorId) {
      return
    }

    const endPoint = snapToGrid
      ? {
          x: Math.round(wallDrawingState.previewPoint.x / gridSize) * gridSize,
          y: Math.round(wallDrawingState.previewPoint.y / gridSize) * gridSize,
        }
      : wallDrawingState.previewPoint

    // Don't create zero-length walls
    if (endPoint.x === wallDrawingState.startPoint.x && endPoint.y === wallDrawingState.startPoint.y) {
      return
    }

    const newWall: PendingWall = {
      floorId: selectedFloorId,
      startX: wallDrawingState.startPoint.x,
      startY: wallDrawingState.startPoint.y,
      endX: endPoint.x,
      endY: endPoint.y,
      thickness: 0.5,
      isExterior: false,
    }

    set((prevState) => ({
      pendingWallCreations: [...prevState.pendingWallCreations, newWall],
      wallDrawingState: {
        ...prevState.wallDrawingState,
        startPoint: endPoint,
        chainPoints: [...prevState.wallDrawingState.chainPoints, endPoint],
      },
      hasUnsavedChanges: true,
    }))
  },

  cancelWallDrawing: () => set({
    wallDrawingState: {
      isDrawing: false,
      startPoint: null,
      previewPoint: null,
      chainPoints: [],
    },
  }),

  addPendingWall: (wall) => set((state) => ({
    pendingWallCreations: [...state.pendingWallCreations, wall],
    hasUnsavedChanges: true,
  })),

  // Wall update actions
  updateWallEndpoint: (id, endpoint, point) => {
    const { snapToGrid, gridSize } = get()
    const snappedPoint = snapToGrid
      ? { x: Math.round(point.x / gridSize) * gridSize, y: Math.round(point.y / gridSize) * gridSize }
      : point

    set((state) => ({
      pendingWallUpdates: {
        ...state.pendingWallUpdates,
        [id]: {
          ...state.pendingWallUpdates[id],
          ...(endpoint === 'start'
            ? { startX: snappedPoint.x, startY: snappedPoint.y }
            : { endX: snappedPoint.x, endY: snappedPoint.y }),
        },
      },
      hasUnsavedChanges: true,
    }))
  },

  updateWallThickness: (id, thickness) => set((state) => ({
    pendingWallUpdates: {
      ...state.pendingWallUpdates,
      [id]: {
        ...state.pendingWallUpdates[id],
        thickness,
      },
    },
    hasUnsavedChanges: true,
  })),

  markWallForDeletion: (id) => set((state) => ({
    pendingWallDeletions: [...state.pendingWallDeletions, id],
    selectedWallId: state.selectedWallId === id ? null : state.selectedWallId,
    hasUnsavedChanges: true,
  })),

  // Room/Device update actions
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
    pendingWallUpdates: {},
    pendingWallCreations: [],
    pendingWallDeletions: [],
    wallDrawingState: {
      isDrawing: false,
      startPoint: null,
      previewPoint: null,
      chainPoints: [],
    },
    hasUnsavedChanges: false,
  }),

  discardChanges: () => set({
    pendingRoomUpdates: {},
    pendingDeviceUpdates: {},
    pendingWallUpdates: {},
    pendingWallCreations: [],
    pendingWallDeletions: [],
    wallDrawingState: {
      isDrawing: false,
      startPoint: null,
      previewPoint: null,
      chainPoints: [],
    },
    hasUnsavedChanges: false,
  }),

  // Helpers to get entities with pending updates applied
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

  getWallWithUpdates: (wall) => {
    const updates = get().pendingWallUpdates[wall.id]
    if (!updates) return wall
    return {
      ...wall,
      startX: updates.startX ?? wall.startX,
      startY: updates.startY ?? wall.startY,
      endX: updates.endX ?? wall.endX,
      endY: updates.endY ?? wall.endY,
      thickness: updates.thickness ?? wall.thickness,
      isExterior: updates.isExterior ?? wall.isExterior,
    }
  },

  isWallDeleted: (wallId) => get().pendingWallDeletions.includes(wallId),
}))
