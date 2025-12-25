'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { Stage, Layer, Rect, Text, Group, Line, Circle } from 'react-konva'
import Konva from 'konva'
import { RoomWithDevices, Breaker, Device } from '@/types/panel'
import { getBreakerColors } from '@/lib/breakerColors'
import { useFloorPlanStore } from '@/stores/floorPlanStore'
import { inferWall, STANDARD_HEIGHTS } from '@/lib/wallInference'

interface RoomCanvasProps {
  room: RoomWithDevices
  breakers: Breaker[]
  selectedDeviceId: string | null
  onDeviceSelect: (deviceId: string) => void
  onDeviceMove: (deviceId: string, x: number, y: number) => void
  width: number
  height: number
}

const PADDING = 40
const GRID_SIZE = 1 // 1 foot grid

// Device type icons (simplified)
const DEVICE_ICONS: Record<string, string> = {
  outlet: 'O',
  light: 'L',
  switch: 'S',
  fan: 'F',
  hvac: 'H',
  appliance: 'A',
  water_heater: 'W',
  dryer: 'D',
  range: 'R',
  ev_charger: 'E',
  pool: 'P',
  smoke_detector: 'K',
  other: '?',
}

// Placement indicator colors
const PLACEMENT_COLORS: Record<string, string> = {
  wall: '#6366F1',
  ceiling: '#F59E0B',
  floor: '#10B981',
}

export function RoomCanvas({
  room,
  breakers,
  selectedDeviceId,
  onDeviceSelect,
  onDeviceMove,
  width,
  height,
}: RoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width, height })
  const { getDeviceWithUpdates, updateDevicePosition } = useFloorPlanStore()

  // Calculate scale to fit room in canvas
  const roomWidth = room.width || 12
  const roomHeight = room.height || 10

  const scale = useMemo(() => {
    const availableWidth = canvasSize.width - PADDING * 2
    const availableHeight = canvasSize.height - PADDING * 2
    const scaleX = availableWidth / roomWidth
    const scaleY = availableHeight / roomHeight
    return Math.min(scaleX, scaleY, 50) // Cap at 50px per foot
  }, [canvasSize, roomWidth, roomHeight])

  // Room dimensions in pixels
  const roomWidthPx = roomWidth * scale
  const roomHeightPx = roomHeight * scale
  const roomX = (canvasSize.width - roomWidthPx) / 2
  const roomY = (canvasSize.height - roomHeightPx) / 2

  // Handle resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setCanvasSize({
          width: rect.width || width,
          height: rect.height || height,
        })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [width, height])

  // Handle device drag end
  const handleDeviceDragEnd = (device: Device, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    // Calculate position in feet relative to room
    const newX = (node.x() - roomX) / scale
    const newY = (node.y() - roomY) / scale

    // Clamp to room bounds
    const clampedX = Math.max(0, Math.min(roomWidth, newX))
    const clampedY = Math.max(0, Math.min(roomHeight, newY))

    updateDevicePosition(device.id, clampedX, clampedY)
    onDeviceMove(device.id, clampedX, clampedY)
  }

  // Generate grid lines
  const gridLines = useMemo(() => {
    const lines: Array<{ points: number[]; opacity: number }> = []

    // Vertical lines
    for (let x = 0; x <= roomWidth; x += GRID_SIZE) {
      const px = roomX + x * scale
      lines.push({
        points: [px, roomY, px, roomY + roomHeightPx],
        opacity: x % 5 === 0 ? 0.3 : 0.1,
      })
    }

    // Horizontal lines
    for (let y = 0; y <= roomHeight; y += GRID_SIZE) {
      const py = roomY + y * scale
      lines.push({
        points: [roomX, py, roomX + roomWidthPx, py],
        opacity: y % 5 === 0 ? 0.3 : 0.1,
      })
    }

    return lines
  }, [roomX, roomY, roomWidth, roomHeight, roomWidthPx, roomHeightPx, scale])

  return (
    <div ref={containerRef} className="w-full h-full">
      <Stage width={canvasSize.width} height={canvasSize.height}>
        <Layer>
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            fill="#FAFAFA"
          />

          {/* Grid */}
          {gridLines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="#D4D4D4"
              strokeWidth={1}
              opacity={line.opacity}
            />
          ))}

          {/* Room floor */}
          <Rect
            x={roomX}
            y={roomY}
            width={roomWidthPx}
            height={roomHeightPx}
            fill="#FFFFFF"
            stroke="#78716C"
            strokeWidth={3}
            shadowColor="black"
            shadowBlur={10}
            shadowOpacity={0.1}
            shadowOffsetY={4}
          />

          {/* Room name label */}
          <Group x={roomX} y={roomY - 30}>
            <Text
              text={room.name}
              fontSize={16}
              fontStyle="bold"
              fill="#44403C"
            />
            <Text
              x={0}
              y={18}
              text={`${roomWidth}' x ${roomHeight}'`}
              fontSize={12}
              fill="#78716C"
            />
          </Group>

          {/* Dimension labels on edges */}
          <Text
            x={roomX + roomWidthPx / 2 - 15}
            y={roomY + roomHeightPx + 8}
            text={`${roomWidth}'`}
            fontSize={11}
            fill="#78716C"
          />
          <Text
            x={roomX - 25}
            y={roomY + roomHeightPx / 2 - 6}
            text={`${roomHeight}'`}
            fontSize={11}
            fill="#78716C"
          />

          {/* Wall labels */}
          <Text
            x={roomX + roomWidthPx / 2 - 15}
            y={roomY + 8}
            text="North"
            fontSize={10}
            fill="#A8A29E"
          />
          <Text
            x={roomX + roomWidthPx / 2 - 15}
            y={roomY + roomHeightPx - 18}
            text="South"
            fontSize={10}
            fill="#A8A29E"
          />
          <Text
            x={roomX + 8}
            y={roomY + roomHeightPx / 2 - 6}
            text="W"
            fontSize={10}
            fill="#A8A29E"
          />
          <Text
            x={roomX + roomWidthPx - 15}
            y={roomY + roomHeightPx / 2 - 6}
            text="E"
            fontSize={10}
            fill="#A8A29E"
          />

          {/* Devices */}
          {room.devices.map((device) => {
            const displayDevice = getDeviceWithUpdates(device)
            const colors = getBreakerColors(device.breakerId, breakers)
            const breaker = breakers.find((b) => b.id === device.breakerId)
            const isSelected = device.id === selectedDeviceId
            const isUnassigned = !device.breakerId

            // Device position (distribute if no position set)
            const deviceIndex = room.devices.findIndex((d) => d.id === device.id)
            const defaultSpacing = 2 // feet
            const defaultX = 2 + (deviceIndex % 4) * defaultSpacing
            const defaultY = 2 + Math.floor(deviceIndex / 4) * defaultSpacing

            const posX = displayDevice.positionX ?? defaultX
            const posY = displayDevice.positionY ?? defaultY

            const deviceX = roomX + posX * scale
            const deviceY = roomY + posY * scale

            // Infer wall position for display
            const wallInfo = inferWall(device, roomWidth, roomHeight)

            const radius = 18

            return (
              <Group
                key={device.id}
                x={deviceX}
                y={deviceY}
                draggable
                onDragEnd={(e) => handleDeviceDragEnd(device, e)}
                onClick={() => onDeviceSelect(device.id)}
                onTap={() => onDeviceSelect(device.id)}
              >
                {/* Selection ring */}
                {isSelected && (
                  <Circle
                    radius={radius + 6}
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fill="transparent"
                  />
                )}

                {/* Unassigned indicator */}
                {isUnassigned && (
                  <Circle
                    radius={radius}
                    fill="#F3F4F6"
                    stroke="#9CA3AF"
                    strokeWidth={2}
                    dash={[4, 4]}
                  />
                )}

                {/* Device circle */}
                <Circle
                  radius={isUnassigned ? radius - 2 : radius}
                  fill={colors.fill}
                  stroke={isSelected ? '#3B82F6' : colors.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                  shadowColor="black"
                  shadowBlur={isSelected ? 8 : 4}
                  shadowOpacity={0.3}
                  shadowOffsetY={2}
                />

                {/* Device icon */}
                <Text
                  x={-6}
                  y={-7}
                  text={DEVICE_ICONS[device.type] || '?'}
                  fontSize={14}
                  fill={colors.text}
                  fontStyle="bold"
                />

                {/* Placement indicator badge */}
                {displayDevice.placement && (
                  <Group x={radius - 4} y={-radius - 4}>
                    <Circle
                      radius={8}
                      fill={PLACEMENT_COLORS[displayDevice.placement] || '#6B7280'}
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />
                    <Text
                      x={-4}
                      y={-5}
                      text={displayDevice.placement.charAt(0).toUpperCase()}
                      fontSize={9}
                      fill="#FFFFFF"
                      fontStyle="bold"
                    />
                  </Group>
                )}

                {/* Device label */}
                <Text
                  x={-45}
                  y={radius + 6}
                  width={90}
                  text={device.description || device.type}
                  fontSize={10}
                  fill="#475569"
                  align="center"
                />

                {/* Breaker info when selected */}
                {isSelected && breaker && (
                  <Group y={radius + 22}>
                    <Rect
                      x={-50}
                      y={0}
                      width={100}
                      height={24}
                      fill={colors.fill}
                      cornerRadius={4}
                      opacity={0.9}
                    />
                    <Text
                      x={-50}
                      y={5}
                      width={100}
                      text={`#${breaker.position}: ${breaker.amperage}A`}
                      fontSize={10}
                      fill={colors.text}
                      align="center"
                    />
                  </Group>
                )}

                {/* Height from floor when selected */}
                {isSelected && displayDevice.heightFromFloor && (
                  <Text
                    x={-45}
                    y={-radius - 18}
                    width={90}
                    text={`${displayDevice.heightFromFloor}" from floor`}
                    fontSize={9}
                    fill="#64748B"
                    align="center"
                  />
                )}

                {/* Wall indicator when selected */}
                {isSelected && (
                  <Text
                    x={-45}
                    y={-radius - (displayDevice.heightFromFloor ? 30 : 18)}
                    width={90}
                    text={`${wallInfo.wall} wall`}
                    fontSize={9}
                    fill="#A8A29E"
                    align="center"
                  />
                )}
              </Group>
            )
          })}

          {/* Empty state */}
          {room.devices.length === 0 && (
            <Group x={canvasSize.width / 2} y={canvasSize.height / 2}>
              <Text
                x={-80}
                y={-20}
                width={160}
                text="No devices in this room"
                fontSize={14}
                fill="#A8A29E"
                align="center"
              />
              <Text
                x={-100}
                y={5}
                width={200}
                text="Add devices using the button above"
                fontSize={12}
                fill="#D4D4D4"
                align="center"
              />
            </Group>
          )}

          {/* Legend */}
          <Group x={10} y={canvasSize.height - 50}>
            <Text
              text="Placement:"
              fontSize={10}
              fill="#78716C"
            />
            <Group x={60}>
              <Circle radius={5} fill={PLACEMENT_COLORS.wall} />
              <Text x={8} y={-5} text="Wall" fontSize={9} fill="#78716C" />
            </Group>
            <Group x={110}>
              <Circle radius={5} fill={PLACEMENT_COLORS.ceiling} />
              <Text x={8} y={-5} text="Ceiling" fontSize={9} fill="#78716C" />
            </Group>
            <Group x={165}>
              <Circle radius={5} fill={PLACEMENT_COLORS.floor} />
              <Text x={8} y={-5} text="Floor" fontSize={9} fill="#78716C" />
            </Group>
          </Group>

          {/* Instructions */}
          <Text
            x={10}
            y={10}
            text="Drag devices to reposition. Click to select."
            fontSize={11}
            fill="#A8A29E"
          />
        </Layer>
      </Stage>
    </div>
  )
}
