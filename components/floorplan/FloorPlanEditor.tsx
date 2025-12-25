'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { FloorWithRooms, Breaker } from '@/types/panel'
import { useFloorPlanStore } from '@/stores/floorPlanStore'
import { FloorPlanToolbar } from './FloorPlanToolbar'
import { BreakerSidebar } from './BreakerSidebar'
import { useUpdateRoom } from '@/hooks/useRooms'
import { useUpdateDevice } from '@/hooks/useDevices'
import { useWalls, useCreateManyWalls, useUpdateWall, useDeleteWall } from '@/hooks/useWalls'
import { Home, MapPin, Construction } from 'lucide-react'

// Dynamic import for Konva (SSR incompatible)
const FloorPlanCanvas = dynamic(
  () => import('./FloorPlanCanvas').then((mod) => mod.FloorPlanCanvas),
  { ssr: false, loading: () => <FloorPlanLoading /> }
)

// Dynamic import for Three.js (SSR incompatible)
const ThreeCanvas = dynamic(
  () => import('./3d/ThreeCanvas').then((mod) => mod.ThreeCanvas),
  { ssr: false, loading: () => <ThreeCanvasLoading /> }
)

function FloorPlanLoading() {
  return (
    <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-lg">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading floor plan...</p>
      </div>
    </div>
  )
}

function ThreeCanvasLoading() {
  return (
    <div className="flex items-center justify-center h-[500px] bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading 3D view...</p>
      </div>
    </div>
  )
}

function ElevationViewPlaceholder() {
  return (
    <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-lg">
      <div className="text-center">
        <Construction className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">Elevation View Coming Soon</h3>
        <p className="text-muted-foreground max-w-md">
          The elevation view will show a side profile of your electrical devices on walls,
          displaying their heights and positions.
        </p>
      </div>
    </div>
  )
}

interface FloorPlanEditorProps {
  floors: FloorWithRooms[]
  breakers: Breaker[]
  panelId: string
  panelName?: string
  mainAmperage?: number
}

export function FloorPlanEditor({ floors, breakers, panelId, panelName, mainAmperage }: FloorPlanEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 })
  const [isSaving, setIsSaving] = useState(false)
  // Auto-collapse sidebar on mobile (< 768px)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )

  // Handle responsive sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const updateRoom = useUpdateRoom()
  const updateDevice = useUpdateDevice()
  const createManyWalls = useCreateManyWalls()
  const updateWall = useUpdateWall()
  const deleteWall = useDeleteWall()

  const {
    selectedFloorId,
    setSelectedFloorId,
    pendingRoomUpdates,
    pendingDeviceUpdates,
    pendingWallCreations,
    pendingWallUpdates,
    pendingWallDeletions,
    markSaved,
    viewMode,
  } = useFloorPlanStore()

  // Fetch walls for selected floor
  const { data: walls = [] } = useWalls(selectedFloorId ?? undefined)

  // Set initial floor
  useEffect(() => {
    if (floors.length > 0 && !selectedFloorId) {
      setSelectedFloorId(floors[0].id)
    }
  }, [floors, selectedFloorId, setSelectedFloorId])

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        // Use container width, fallback to reasonable defaults
        const width = rect.width > 100 ? rect.width : 800
        const height = rect.height > 100 ? rect.height : 500
        setCanvasSize({
          width,
          height: Math.max(500, height),
        })
      }
    }

    // Initial size on mount
    updateSize()
    // Also update after a short delay to catch CSS layout completion
    const timeoutId = setTimeout(updateSize, 100)

    window.addEventListener('resize', updateSize)
    return () => {
      window.removeEventListener('resize', updateSize)
      clearTimeout(timeoutId)
    }
  }, [])

  // Get selected floor
  const selectedFloor = floors.find((f) => f.id === selectedFloorId)

  // Save handler
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save room updates
      const roomUpdatePromises = Object.entries(pendingRoomUpdates).map(([roomId, updates]) =>
        updateRoom.mutateAsync({
          id: roomId,
          panelId,
          data: updates,
        })
      )

      // Save device updates
      const deviceUpdatePromises = Object.entries(pendingDeviceUpdates).map(([deviceId, updates]) =>
        updateDevice.mutateAsync({
          id: deviceId,
          panelId,
          data: updates,
        })
      )

      // Save new walls (batch create)
      let wallCreatePromise: Promise<unknown> = Promise.resolve()
      if (pendingWallCreations.length > 0) {
        wallCreatePromise = createManyWalls.mutateAsync({
          walls: pendingWallCreations.map((w) => ({
            floorId: w.floorId,
            startX: w.startX,
            startY: w.startY,
            endX: w.endX,
            endY: w.endY,
            thickness: w.thickness,
            isExterior: w.isExterior,
          })),
          panelId,
        })
      }

      // Save wall updates
      const wallUpdatePromises = Object.entries(pendingWallUpdates).map(([wallId, updates]) => {
        const wall = walls.find((w) => w.id === wallId)
        if (!wall) return Promise.resolve()
        return updateWall.mutateAsync({
          id: wallId,
          floorId: wall.floorId,
          panelId,
          data: updates,
        })
      })

      // Delete walls
      const wallDeletePromises = pendingWallDeletions.map((wallId) => {
        const wall = walls.find((w) => w.id === wallId)
        if (!wall) return Promise.resolve()
        return deleteWall.mutateAsync({
          id: wallId,
          floorId: wall.floorId,
          panelId,
        })
      })

      await Promise.all([
        ...roomUpdatePromises,
        ...deviceUpdatePromises,
        wallCreatePromise,
        ...wallUpdatePromises,
        ...wallDeletePromises,
      ])
      markSaved()
    } catch (error) {
      console.error('Failed to save floor plan:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Empty state - no floors
  if (floors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No floors yet</h3>
          <p className="text-muted-foreground mb-4">
            Add floors and rooms in the Locations tab to start building your floor plan.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Empty state - floor selected but no rooms
  if (selectedFloor && selectedFloor.rooms.length === 0) {
    return (
      <div className="space-y-4">
        <FloorPlanToolbar
          floors={floors}
          breakers={breakers}
          onSave={handleSave}
          isSaving={isSaving}
        />
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No rooms on this floor</h3>
            <p className="text-muted-foreground mb-4">
              Add rooms in the Locations tab, then come back here to arrange them.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FloorPlanToolbar
        floors={floors}
        breakers={breakers}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex min-h-[500px] h-[600px] overflow-hidden rounded-lg">
            {/* Breaker Sidebar */}
            <BreakerSidebar
              breakers={breakers}
              floors={floors}
              panelName={panelName}
              mainAmperage={mainAmperage}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Canvas Area */}
            <div ref={containerRef} className="relative flex-1 bg-white overflow-hidden">
              {viewMode === '2d' && selectedFloor && (
                <FloorPlanCanvas
                  floor={selectedFloor}
                  breakers={breakers}
                  walls={walls}
                  width={canvasSize.width}
                  height={canvasSize.height}
                />
              )}
              {viewMode === '3d' && (
                <ThreeCanvas
                  floors={floors}
                  breakers={breakers}
                  selectedFloorId={selectedFloorId}
                />
              )}
              {viewMode === 'elevation' && (
                <ElevationViewPlaceholder />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium text-muted-foreground">Device Colors by Circuit:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>General</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Lighting</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Kitchen</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span>Bathroom</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>HVAC</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Appliance</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-400 border border-dashed border-gray-500" />
              <span>Unassigned</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
