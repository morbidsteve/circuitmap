'use client'

import { useState, useMemo } from 'react'
import { Stage, Layer, Rect, Line, Text, Group, Circle } from 'react-konva'
import { FloorWithRooms, Breaker, Device, RoomWithDevices } from '@/types/panel'
import { useFloorPlanStore } from '@/stores/floorPlanStore'
import { getBreakerColors } from '@/lib/breakerColors'
import { inferWall, getDevicesForElevation, STANDARD_HEIGHTS, WallDirection } from '@/lib/wallInference'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface ElevationViewProps {
  floor: FloorWithRooms
  breakers: Breaker[]
  ceilingHeight?: number // in feet, default 8
}

const SCALE = 30 // pixels per foot for elevation view
const PADDING = 60
const HEIGHT_MARKERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // feet

// Standard height reference lines with labels
const HEIGHT_REFERENCES = [
  { height: 12, label: "Floor outlet (12\")", color: '#10B981' },
  { height: 18, label: "Standard outlet (18\")", color: '#3B82F6' },
  { height: 48, label: "Counter height (48\")", color: '#F59E0B' },
  { height: 52, label: "Switch height (52\")", color: '#8B5CF6' },
]

export function ElevationView({ floor, breakers, ceilingHeight = 8 }: ElevationViewProps) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(
    floor.rooms.length > 0 ? floor.rooms[0].id : null
  )
  const [selectedWall, setSelectedWall] = useState<WallDirection>('north')
  const [showReferences, setShowReferences] = useState(true)

  const {
    highlightedBreakerId,
    highlightedDeviceId,
    highlightedCircuitDeviceIds,
    highlightMode,
    highlightDevice,
    selectDevice,
  } = useFloorPlanStore()

  const room = floor.rooms.find((r) => r.id === selectedRoom)

  // Get devices for the selected wall
  const wallDevices = useMemo(() => {
    if (!room) return []
    const roomWidth = room.width ?? 12
    const roomHeight = room.height ?? 10
    return getDevicesForElevation(room.devices, selectedWall, roomWidth, roomHeight)
  }, [room, selectedWall])

  // Calculate wall length based on direction
  const wallLength = useMemo(() => {
    if (!room) return 12
    const roomWidth = room.width ?? 12
    const roomHeight = room.height ?? 10
    return selectedWall === 'north' || selectedWall === 'south' ? roomWidth : roomHeight
  }, [room, selectedWall])

  const canvasWidth = Math.max(wallLength * SCALE + PADDING * 2, 600)
  const canvasHeight = ceilingHeight * SCALE + PADDING * 2

  // Check if device should be highlighted
  const isDeviceHighlighted = (device: Device) => {
    if (highlightMode === 'none') return true
    if (highlightMode === 'breaker' && highlightedBreakerId) {
      return device.breakerId === highlightedBreakerId
    }
    if (highlightMode === 'device' || highlightMode === 'circuit') {
      return device.id === highlightedDeviceId || highlightedCircuitDeviceIds.includes(device.id)
    }
    return true
  }

  const handleDeviceClick = (device: Device) => {
    selectDevice(device.id)
    if (device.breakerId) {
      const siblingIds = (room?.devices || [])
        .filter((d) => d.breakerId === device.breakerId && d.id !== device.id)
        .map((d) => d.id)
      highlightDevice(device.id, siblingIds, device.breakerId)
    }
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">Select a room to view elevation</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Room:</span>
          <Select value={selectedRoom || ''} onValueChange={setSelectedRoom}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select room" />
            </SelectTrigger>
            <SelectContent>
              {floor.rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name} ({r.devices.length} devices)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">Wall:</span>
          {(['north', 'south', 'east', 'west'] as WallDirection[]).map((wall) => {
            const deviceCount = room.devices.filter((d) => {
              if (d.placement === 'ceiling') return true
              const info = inferWall(d, room.width ?? 12, room.height ?? 10)
              return info.wall === wall
            }).length
            return (
              <Button
                key={wall}
                variant={selectedWall === wall ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedWall(wall)}
                className="relative"
              >
                {wall.charAt(0).toUpperCase()}
                {deviceCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {deviceCount}
                  </span>
                )}
              </Button>
            )
          })}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showReferences}
            onChange={(e) => setShowReferences(e.target.checked)}
            className="rounded"
          />
          Show height references
        </label>
      </div>

      {/* Elevation Canvas */}
      <div className="border rounded-lg bg-white overflow-auto">
        <Stage width={canvasWidth} height={canvasHeight}>
          <Layer>
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              fill="#FAFAFA"
            />

            {/* Wall surface */}
            <Rect
              x={PADDING}
              y={PADDING}
              width={wallLength * SCALE}
              height={ceilingHeight * SCALE}
              fill="#F5F5F4"
              stroke="#D4D4D4"
              strokeWidth={2}
            />

            {/* Floor line */}
            <Line
              points={[PADDING - 10, canvasHeight - PADDING, PADDING + wallLength * SCALE + 10, canvasHeight - PADDING]}
              stroke="#78716C"
              strokeWidth={4}
            />

            {/* Ceiling line */}
            <Line
              points={[PADDING - 10, PADDING, PADDING + wallLength * SCALE + 10, PADDING]}
              stroke="#78716C"
              strokeWidth={2}
              dash={[8, 4]}
            />

            {/* Height markers (left side) */}
            {HEIGHT_MARKERS.filter((h) => h <= ceilingHeight).map((heightFt) => {
              const y = canvasHeight - PADDING - heightFt * SCALE
              return (
                <Group key={heightFt}>
                  <Line
                    points={[PADDING - 20, y, PADDING, y]}
                    stroke="#A8A29E"
                    strokeWidth={1}
                  />
                  <Text
                    x={5}
                    y={y - 6}
                    text={`${heightFt}'`}
                    fontSize={11}
                    fill="#78716C"
                  />
                </Group>
              )
            })}

            {/* Width markers (bottom) */}
            {Array.from({ length: Math.ceil(wallLength) + 1 }, (_, i) => i).map((widthFt) => {
              const x = PADDING + widthFt * SCALE
              return (
                <Group key={widthFt}>
                  <Line
                    points={[x, canvasHeight - PADDING, x, canvasHeight - PADDING + 10]}
                    stroke="#A8A29E"
                    strokeWidth={1}
                  />
                  <Text
                    x={x - 8}
                    y={canvasHeight - PADDING + 14}
                    text={`${widthFt}'`}
                    fontSize={10}
                    fill="#78716C"
                  />
                </Group>
              )
            })}

            {/* Height reference lines */}
            {showReferences && HEIGHT_REFERENCES.filter((r) => r.height < ceilingHeight * 12).map((ref) => {
              const y = canvasHeight - PADDING - (ref.height / 12) * SCALE
              return (
                <Group key={ref.height}>
                  <Line
                    points={[PADDING, y, PADDING + wallLength * SCALE, y]}
                    stroke={ref.color}
                    strokeWidth={1}
                    dash={[4, 4]}
                    opacity={0.5}
                  />
                  <Rect
                    x={PADDING + wallLength * SCALE + 5}
                    y={y - 8}
                    width={ref.label.length * 6 + 10}
                    height={16}
                    fill="white"
                    cornerRadius={3}
                  />
                  <Text
                    x={PADDING + wallLength * SCALE + 10}
                    y={y - 5}
                    text={ref.label}
                    fontSize={10}
                    fill={ref.color}
                  />
                </Group>
              )
            })}

            {/* Wall label */}
            <Text
              x={PADDING}
              y={20}
              text={`${room.name} - ${selectedWall.charAt(0).toUpperCase() + selectedWall.slice(1)} Wall (${wallLength}' wide)`}
              fontSize={14}
              fontStyle="bold"
              fill="#44403C"
            />

            {/* Devices on this wall */}
            {wallDevices.map(({ device, wallInfo, isCeiling }) => {
              const colors = getBreakerColors(device.breakerId, breakers)
              const isHighlighted = isDeviceHighlighted(device)
              const heightInches = device.heightFromFloor ?? (isCeiling ? ceilingHeight * 12 - 6 : 48)

              const x = PADDING + wallInfo.positionAlongWall * wallLength * SCALE
              const y = canvasHeight - PADDING - (heightInches / 12) * SCALE

              const breaker = breakers.find((b) => b.id === device.breakerId)

              return (
                <Group
                  key={device.id}
                  x={x}
                  y={y}
                  opacity={isHighlighted ? 1 : 0.3}
                  onClick={() => handleDeviceClick(device)}
                  onTap={() => handleDeviceClick(device)}
                >
                  {/* Device marker */}
                  <Circle
                    radius={14}
                    fill={colors.fill}
                    stroke={device.id === highlightedDeviceId ? '#3B82F6' : colors.stroke}
                    strokeWidth={device.id === highlightedDeviceId ? 3 : 2}
                    shadowColor="black"
                    shadowBlur={isHighlighted ? 6 : 3}
                    shadowOpacity={0.3}
                  />

                  {/* Device type letter */}
                  <Text
                    x={-5}
                    y={-6}
                    text={device.type.charAt(0).toUpperCase()}
                    fontSize={12}
                    fill={colors.text}
                    fontStyle="bold"
                  />

                  {/* Height indicator line to floor */}
                  {!isCeiling && (
                    <Line
                      points={[0, 0, 0, (heightInches / 12) * SCALE]}
                      stroke={colors.fill}
                      strokeWidth={1}
                      dash={[3, 3]}
                      opacity={0.5}
                    />
                  )}

                  {/* Device label */}
                  <Text
                    x={-40}
                    y={-30}
                    width={80}
                    text={device.description || device.type}
                    fontSize={10}
                    fill="#44403C"
                    align="center"
                  />

                  {/* Height label */}
                  <Rect
                    x={16}
                    y={-10}
                    width={35}
                    height={20}
                    fill="white"
                    stroke="#E5E5E5"
                    strokeWidth={1}
                    cornerRadius={3}
                  />
                  <Text
                    x={18}
                    y={-6}
                    text={`${heightInches}"`}
                    fontSize={11}
                    fill="#78716C"
                  />

                  {/* Breaker info */}
                  {breaker && (
                    <Text
                      x={-40}
                      y={18}
                      width={80}
                      text={`#${breaker.position}`}
                      fontSize={9}
                      fill={colors.fill}
                      fontStyle="bold"
                      align="center"
                    />
                  )}

                  {/* Ceiling indicator */}
                  {isCeiling && (
                    <Group y={-20}>
                      <Line points={[-8, 0, 8, 0]} stroke="#F59E0B" strokeWidth={2} />
                      <Line points={[-8, 0, 0, -8]} stroke="#F59E0B" strokeWidth={2} />
                      <Line points={[8, 0, 0, -8]} stroke="#F59E0B" strokeWidth={2} />
                    </Group>
                  )}
                </Group>
              )
            })}

            {/* No devices message */}
            {wallDevices.length === 0 && (
              <Text
                x={canvasWidth / 2 - 80}
                y={canvasHeight / 2}
                text="No devices on this wall"
                fontSize={14}
                fill="#A8A29E"
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium">Heights:</span>
        {HEIGHT_REFERENCES.map((ref) => (
          <div key={ref.height} className="flex items-center gap-1">
            <div className="w-3 h-0.5" style={{ backgroundColor: ref.color }} />
            <span>{ref.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
