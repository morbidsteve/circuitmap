'use client'

import { Circle, Group, Text, Rect } from 'react-konva'
import Konva from 'konva'
import { Device, Breaker, RoomWithDevices } from '@/types/panel'
import { getBreakerColors } from '@/lib/breakerColors'
import { useFloorPlanStore } from '@/stores/floorPlanStore'

interface DeviceMarkerProps {
  device: Device
  room: RoomWithDevices
  breakers: Breaker[]
  scale: number
  roomOffsetX: number
  roomOffsetY: number
  isSelected: boolean
  isHighlighted: boolean
  onSelect: () => void
}

const DEVICE_LABELS: Record<string, string> = {
  outlet: 'Outlet',
  light: 'Light',
  switch: 'Switch',
  appliance: 'Appliance',
  fan: 'Fan',
  hvac: 'HVAC',
  water_heater: 'Water Htr',
  dryer: 'Dryer',
  range: 'Range',
  ev_charger: 'EV Charger',
  pool: 'Pool',
  smoke_detector: 'Smoke Det',
  other: 'Device',
}

const DEVICE_ICONS: Record<string, string> = {
  outlet: '⚡',
  light: '💡',
  switch: '🔘',
  appliance: '🔌',
  fan: '🌀',
  hvac: '❄️',
  water_heater: '🔥',
  dryer: '🌪️',
  range: '🍳',
  ev_charger: '🔋',
  pool: '🏊',
  smoke_detector: '🚨',
  other: '📍',
}

export function DeviceMarker({
  device,
  room,
  breakers,
  scale,
  roomOffsetX,
  roomOffsetY,
  isSelected,
  isHighlighted,
  onSelect,
}: DeviceMarkerProps) {
  const { getDeviceWithUpdates, updateDevicePosition } = useFloorPlanStore()

  const displayDevice = getDeviceWithUpdates(device)

  // Position device within room - distribute evenly if no position set
  const roomDevices = room.devices
  const deviceIndex = roomDevices.findIndex((d) => d.id === device.id)
  const defaultSpacing = 40

  // Default position: distribute devices in a grid within the room
  const defaultX = 30 + (deviceIndex % 4) * defaultSpacing
  const defaultY = 60 + Math.floor(deviceIndex / 4) * defaultSpacing

  const deviceX = roomOffsetX + (displayDevice.positionX !== undefined && displayDevice.positionX !== null
    ? displayDevice.positionX * scale
    : defaultX)
  const deviceY = roomOffsetY + (displayDevice.positionY !== undefined && displayDevice.positionY !== null
    ? displayDevice.positionY * scale
    : defaultY)

  const colors = getBreakerColors(device.breakerId, breakers)
  const isUnassigned = !device.breakerId
  const breaker = breakers.find((b) => b.id === device.breakerId)

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    // Calculate new position relative to room (in feet)
    const newRelX = (node.x() - roomOffsetX) / scale
    const newRelY = (node.y() - roomOffsetY) / scale

    updateDevicePosition(device.id, Math.max(0, newRelX), Math.max(0, newRelY))
  }

  // Determine opacity based on highlight state
  const opacity = isHighlighted ? 1 : 0.25

  const radius = 16
  const label = device.description || DEVICE_LABELS[device.type] || 'Device'

  return (
    <Group
      x={deviceX}
      y={deviceY}
      opacity={opacity}
      onClick={onSelect}
      onTap={onSelect}
      draggable
      onDragEnd={handleDragEnd}
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

      {/* Main circle */}
      <Circle
        radius={radius}
        fill={colors.fill}
        stroke={isUnassigned ? '#9CA3AF' : colors.stroke}
        strokeWidth={2}
        dash={isUnassigned ? [4, 4] : undefined}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.2}
        shadowOffsetY={2}
      />

      {/* Device icon/letter */}
      <Text
        x={-8}
        y={-8}
        text={device.type.charAt(0).toUpperCase()}
        fontSize={14}
        fill={colors.text}
        fontStyle="bold"
        listening={false}
      />

      {/* Device label (always visible, below marker) */}
      <Text
        x={-40}
        y={radius + 4}
        width={80}
        text={label.length > 12 ? label.substring(0, 10) + '...' : label}
        fontSize={10}
        fill="#475569"
        align="center"
        listening={false}
      />

      {/* Breaker info when selected */}
      {isSelected && breaker && (
        <Group y={radius + 20}>
          <Rect
            x={-45}
            y={0}
            width={90}
            height={22}
            fill={colors.fill}
            cornerRadius={4}
            opacity={0.9}
          />
          <Text
            x={-45}
            y={4}
            width={90}
            text={`#${breaker.position}: ${breaker.label}`}
            fontSize={10}
            fill={colors.text}
            align="center"
            listening={false}
          />
        </Group>
      )}

      {/* Unassigned indicator */}
      {isUnassigned && (
        <Text
          x={-25}
          y={radius + 16}
          width={50}
          text="(unassigned)"
          fontSize={8}
          fill="#EF4444"
          align="center"
          listening={false}
        />
      )}
    </Group>
  )
}
