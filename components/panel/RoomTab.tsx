'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PanelWithRelations, Device, RoomWithDevices, Breaker, FloorWithRooms } from '@/types/panel'
import { getBreakerColors } from '@/lib/breakerColors'
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Zap,
  MapPin,
  Ruler,
  Plug,
  Home,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Dynamic import for RoomCanvas (uses Konva)
const RoomCanvas = dynamic(
  () => import('@/components/floorplan/RoomCanvas').then((mod) => mod.RoomCanvas),
  { ssr: false, loading: () => <RoomCanvasLoading /> }
)

function RoomCanvasLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px] bg-muted/30 rounded-lg">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading room view...</p>
      </div>
    </div>
  )
}

interface RoomTabProps {
  panel: PanelWithRelations
  initialRoomId?: string | null
  onEditDevice: (device: Device, roomId: string) => void
  onDeleteDevice: (device: Device) => void
  onAddDevice: (roomId: string) => void
  onEditRoom: (room: RoomWithDevices, floorId: string) => void
}

type SortMode = 'type' | 'breaker' | 'name'
type FilterMode = 'all' | 'unassigned'

// Device type labels
const DEVICE_LABELS: Record<string, string> = {
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
}

// Placement labels
const PLACEMENT_LABELS: Record<string, string> = {
  floor: 'Floor',
  wall: 'Wall',
  ceiling: 'Ceiling',
}

export function RoomTab({
  panel,
  initialRoomId,
  onEditDevice,
  onDeleteDevice,
  onAddDevice,
  onEditRoom,
}: RoomTabProps) {
  // Build flat list of all rooms grouped by floor
  const allRooms = useMemo(() => {
    const rooms: Array<{ room: RoomWithDevices; floor: FloorWithRooms }> = []
    panel.floors
      .sort((a, b) => b.level - a.level)
      .forEach((floor) => {
        floor.rooms.forEach((room) => {
          rooms.push({ room, floor })
        })
      })
    return rooms
  }, [panel.floors])

  // Selected room state - use initialRoomId if provided, otherwise first room
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    initialRoomId ?? (allRooms.length > 0 ? allRooms[0].room.id : null)
  )

  // Update selected room when initialRoomId changes externally
  useEffect(() => {
    if (initialRoomId && allRooms.some((r) => r.room.id === initialRoomId)) {
      setSelectedRoomId(initialRoomId)
    }
  }, [initialRoomId, allRooms])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('type')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  // Find selected room and its floor
  const selectedRoomData = allRooms.find((r) => r.room.id === selectedRoomId)
  const selectedRoom = selectedRoomData?.room
  const selectedFloor = selectedRoomData?.floor

  // Filter and sort devices
  const sortedDevices = useMemo(() => {
    if (!selectedRoom) return []

    // Apply filter first
    let devices = [...selectedRoom.devices]
    if (filterMode === 'unassigned') {
      devices = devices.filter((d) => !d.breakerId)
    }

    // Then sort
    switch (sortMode) {
      case 'type':
        return devices.sort((a, b) => a.type.localeCompare(b.type))
      case 'breaker':
        return devices.sort((a, b) => {
          if (!a.breakerId && !b.breakerId) return 0
          if (!a.breakerId) return 1
          if (!b.breakerId) return -1
          const breakerA = panel.breakers.find((br) => br.id === a.breakerId)
          const breakerB = panel.breakers.find((br) => br.id === b.breakerId)
          return (breakerA?.position || '').localeCompare(breakerB?.position || '')
        })
      case 'name':
        return devices.sort((a, b) => (a.description || '').localeCompare(b.description || ''))
      default:
        return devices
    }
  }, [selectedRoom, sortMode, filterMode, panel.breakers])

  // Calculate room stats
  const roomStats = useMemo(() => {
    if (!selectedRoom) return { deviceCount: 0, totalWattage: 0, unassignedCount: 0 }
    const deviceCount = selectedRoom.devices.length
    const totalWattage = selectedRoom.devices.reduce((sum, d) => sum + (d.estimatedWattage || 0), 0)
    const unassignedCount = selectedRoom.devices.filter((d) => !d.breakerId).length
    return { deviceCount, totalWattage, unassignedCount }
  }, [selectedRoom])

  // Handle device selection from canvas
  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId === selectedDeviceId ? null : deviceId)
  }

  // Handle device position change from canvas drag
  const handleDeviceMove = (deviceId: string, x: number, y: number) => {
    // This will be handled by the floorPlanStore
    console.log('Device moved:', deviceId, x, y)
  }

  // No rooms state
  if (allRooms.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No rooms yet</h3>
          <p className="text-muted-foreground mb-4">
            Add floors and rooms in the Locations tab to start managing devices by room.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Room Selector and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedRoomId || ''} onValueChange={setSelectedRoomId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {panel.floors
                .sort((a, b) => b.level - a.level)
                .map((floor) => (
                  <div key={floor.id}>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
                      {floor.name}
                    </div>
                    {floor.rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        <div className="flex items-center gap-2">
                          <span>{room.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {room.devices.length}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
            </SelectContent>
          </Select>

          {selectedRoom && selectedFloor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditRoom(selectedRoom, selectedFloor.id)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Room
            </Button>
          )}
        </div>

        <Button onClick={() => selectedRoomId && onAddDevice(selectedRoomId)} disabled={!selectedRoomId}>
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Room Info Header */}
      {selectedRoom && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Plug className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-lg font-bold">{roomStats.deviceCount}</div>
                <div className="text-xs text-muted-foreground">Devices</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-lg font-bold">{roomStats.totalWattage.toLocaleString()}W</div>
                <div className="text-xs text-muted-foreground">Est. Load</div>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-lg font-bold">
                  {selectedRoom.width || 12}&apos; x {selectedRoom.height || 10}&apos;
                </div>
                <div className="text-xs text-muted-foreground">Dimensions</div>
              </div>
            </div>
          </Card>
          {roomStats.unassignedCount > 0 && (
            <Card
              className={cn(
                'p-3 border-orange-200 bg-orange-50 cursor-pointer transition-all hover:border-orange-400',
                filterMode === 'unassigned' && 'ring-2 ring-orange-500 border-orange-500'
              )}
              onClick={() => setFilterMode(filterMode === 'unassigned' ? 'all' : 'unassigned')}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="text-lg font-bold text-orange-600">{roomStats.unassignedCount}</div>
                  <div className="text-xs text-orange-600">
                    {filterMode === 'unassigned' ? 'Showing Unassigned' : 'Unassigned'}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Main Content - Canvas + Device List */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Room Canvas */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0 h-[500px]">
            {selectedRoom ? (
              <RoomCanvas
                room={selectedRoom}
                breakers={panel.breakers}
                selectedDeviceId={selectedDeviceId}
                onDeviceSelect={handleDeviceSelect}
                onDeviceMove={handleDeviceMove}
                width={500}
                height={500}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a room to view
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Devices</CardTitle>
              <div className="flex items-center gap-2">
                {filterMode === 'unassigned' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    onClick={() => setFilterMode('all')}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Unassigned
                    <span className="ml-1 text-xs">✕</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const modes: SortMode[] = ['type', 'breaker', 'name']
                    const currentIndex = modes.indexOf(sortMode)
                    setSortMode(modes[(currentIndex + 1) % modes.length])
                  }}
                >
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  {sortMode === 'type' ? 'Type' : sortMode === 'breaker' ? 'Breaker' : 'Name'}
                </Button>
              </div>
            </div>
            <CardDescription>
              {filterMode === 'unassigned'
                ? `${sortedDevices.length} unassigned device${sortedDevices.length !== 1 ? 's' : ''}`
                : `${sortedDevices.length} device${sortedDevices.length !== 1 ? 's' : ''} in this room`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[420px]">
              {sortedDevices.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Plug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No devices in this room yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => selectedRoomId && onAddDevice(selectedRoomId)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Device
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {sortedDevices.map((device) => {
                    const breaker = panel.breakers.find((b) => b.id === device.breakerId)
                    const colors = getBreakerColors(device.breakerId, panel.breakers)
                    const isSelected = device.id === selectedDeviceId

                    return (
                      <div
                        key={device.id}
                        className={cn(
                          'p-3 hover:bg-muted/50 cursor-pointer transition-colors',
                          isSelected && 'bg-blue-50 border-l-4 border-l-blue-500'
                        )}
                        onClick={() => handleDeviceSelect(device.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Color indicator */}
                            <div
                              className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                              style={{ backgroundColor: colors.fill }}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {device.description || DEVICE_LABELS[device.type] || device.type}
                              </div>

                              <div className="flex flex-wrap gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {DEVICE_LABELS[device.type] || device.type}
                                </Badge>
                                {device.subtype && (
                                  <Badge variant="outline" className="text-xs">
                                    {device.subtype}
                                  </Badge>
                                )}
                                {device.placement && (
                                  <Badge variant="outline" className="text-xs">
                                    {PLACEMENT_LABELS[device.placement] || device.placement}
                                  </Badge>
                                )}
                                {device.isGfciProtected && (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    GFCI
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                {breaker ? (
                                  <span className="flex items-center gap-1">
                                    <Zap className="h-3 w-3" />
                                    #{breaker.position} ({breaker.amperage}A)
                                  </span>
                                ) : (
                                  <span className="text-orange-500">Not assigned</span>
                                )}

                                {device.heightFromFloor && (
                                  <span>{device.heightFromFloor}&quot; from floor</span>
                                )}

                                {device.estimatedWattage && (
                                  <span>{device.estimatedWattage}W</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  selectedRoomId && onEditDevice(device, selectedRoomId)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteDevice(device)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
