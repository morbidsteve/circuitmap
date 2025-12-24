'use client'

import { Line, Group, Text, Rect } from 'react-konva'
import { Device, Breaker, RoomWithDevices } from '@/types/panel'
import { getBreakerColors } from '@/lib/breakerColors'
import { useFloorPlanStore } from '@/stores/floorPlanStore'

interface WireConnectionProps {
  device: Device
  room: RoomWithDevices
  breakers: Breaker[]
  scale: number
  panelIconX: number
  panelIconY: number
  roomOffsetX: number
  roomOffsetY: number
  isHighlighted: boolean
}

export function WireConnection({
  device,
  room,
  breakers,
  scale,
  panelIconX,
  panelIconY,
  roomOffsetX,
  roomOffsetY,
  isHighlighted,
}: WireConnectionProps) {
  const { getDeviceWithUpdates } = useFloorPlanStore()

  if (!device.breakerId) return null

  const displayDevice = getDeviceWithUpdates(device)

  // Calculate device position (same logic as DeviceMarker)
  const roomDevices = room.devices
  const deviceIndex = roomDevices.findIndex((d) => d.id === device.id)
  const defaultSpacing = 40
  const defaultX = 30 + (deviceIndex % 4) * defaultSpacing
  const defaultY = 60 + Math.floor(deviceIndex / 4) * defaultSpacing

  const deviceX = roomOffsetX + (displayDevice.positionX !== undefined && displayDevice.positionX !== null
    ? displayDevice.positionX * scale
    : defaultX)
  const deviceY = roomOffsetY + (displayDevice.positionY !== undefined && displayDevice.positionY !== null
    ? displayDevice.positionY * scale
    : defaultY)

  const colors = getBreakerColors(device.breakerId, breakers)
  const breaker = breakers.find((b) => b.id === device.breakerId)

  // Calculate midpoint for label
  const midX = (deviceX + panelIconX) / 2
  const midY = (deviceY + panelIconY) / 2

  return (
    <Group opacity={isHighlighted ? 0.8 : 0.15}>
      {/* Wire line - curved path */}
      <Line
        points={[deviceX, deviceY, panelIconX, panelIconY]}
        stroke={colors.fill}
        strokeWidth={isHighlighted ? 3 : 1}
        lineCap="round"
        lineJoin="round"
        dash={[10, 5]}
      />

      {/* Breaker label at midpoint (only when highlighted) */}
      {isHighlighted && breaker && (
        <Group x={midX} y={midY}>
          <Rect
            x={-25}
            y={-10}
            width={50}
            height={20}
            fill="white"
            cornerRadius={4}
            stroke={colors.fill}
            strokeWidth={1}
          />
          <Text
            x={-25}
            y={-6}
            width={50}
            text={`#${breaker.position}`}
            fontSize={11}
            fill={colors.fill}
            fontStyle="bold"
            align="center"
            listening={false}
          />
        </Group>
      )}
    </Group>
  )
}
