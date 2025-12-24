'use client'

import { useRef, useEffect } from 'react'
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
  isPulsingHighlight?: boolean // New: for animated highlighting
  onSelect: () => void
  onDeviceClick?: (deviceId: string, breakerId: string | undefined) => void
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

// Placement indicator symbols
const PLACEMENT_INDICATORS: Record<string, { symbol: string; color: string }> = {
  wall: { symbol: '║', color: '#6366F1' },    // Purple/indigo for wall
  ceiling: { symbol: '△', color: '#F59E0B' }, // Amber for ceiling
  floor: { symbol: '▬', color: '#10B981' },   // Green for floor
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
  isPulsingHighlight = false,
  onSelect,
  onDeviceClick,
}: DeviceMarkerProps) {
  const groupRef = useRef<Konva.Group>(null)
  const pulseRef = useRef<Konva.Circle>(null)
  const { getDeviceWithUpdates, updateDevicePosition, highlightDevice } = useFloorPlanStore()

  const displayDevice = getDeviceWithUpdates(device)

  // Pulsing animation for highlighted devices
  useEffect(() => {
    if (!isPulsingHighlight || !pulseRef.current) return undefined

    const anim = new Konva.Animation((frame) => {
      if (!frame || !pulseRef.current) return
      const scale = 1 + Math.sin(frame.time / 200) * 0.15
      const opacity = 0.6 + Math.sin(frame.time / 200) * 0.3
      pulseRef.current.scale({ x: scale, y: scale })
      pulseRef.current.opacity(opacity)
    }, pulseRef.current.getLayer())

    anim.start()
    return () => { anim.stop() }
  }, [isPulsingHighlight])

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

  // Handle click to highlight circuit
  const handleClick = () => {
    onSelect()
    if (onDeviceClick) {
      onDeviceClick(device.id, device.breakerId)
    }
  }

  return (
    <Group
      ref={groupRef}
      x={deviceX}
      y={deviceY}
      opacity={opacity}
      onClick={handleClick}
      onTap={handleClick}
      draggable
      onDragEnd={handleDragEnd}
    >
      {/* Pulsing highlight ring for circuit tracing */}
      {isPulsingHighlight && (
        <Circle
          ref={pulseRef}
          radius={radius + 10}
          stroke={colors.fill}
          strokeWidth={3}
          fill="transparent"
          opacity={0.6}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <Circle
          radius={radius + 6}
          stroke="#3B82F6"
          strokeWidth={3}
          fill="transparent"
        />
      )}

      {/* Glow effect for highlighted devices */}
      {isHighlighted && !isSelected && (
        <Circle
          radius={radius + 4}
          fill="transparent"
          shadowColor={colors.fill}
          shadowBlur={12}
          shadowOpacity={0.8}
        />
      )}

      {/* Main circle */}
      <Circle
        radius={radius}
        fill={colors.fill}
        stroke={isUnassigned ? '#9CA3AF' : colors.stroke}
        strokeWidth={isHighlighted ? 3 : 2}
        dash={isUnassigned ? [4, 4] : undefined}
        shadowColor="black"
        shadowBlur={isHighlighted ? 8 : 4}
        shadowOpacity={isHighlighted ? 0.4 : 0.2}
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

      {/* Placement indicator badge (top-right corner) */}
      {displayDevice.placement && PLACEMENT_INDICATORS[displayDevice.placement] && (
        <Group x={radius - 4} y={-radius - 4}>
          <Circle
            radius={8}
            fill={PLACEMENT_INDICATORS[displayDevice.placement].color}
            stroke="#FFFFFF"
            strokeWidth={1.5}
            shadowColor="black"
            shadowBlur={2}
            shadowOpacity={0.3}
          />
          <Text
            x={-4}
            y={-5}
            text={PLACEMENT_INDICATORS[displayDevice.placement].symbol}
            fontSize={9}
            fill="#FFFFFF"
            fontStyle="bold"
            listening={false}
          />
        </Group>
      )}

      {/* Height indicator (shown when selected) */}
      {isSelected && displayDevice.heightFromFloor && (
        <Text
          x={-40}
          y={-radius - 18}
          width={80}
          text={`${displayDevice.heightFromFloor}" from floor`}
          fontSize={9}
          fill="#64748B"
          align="center"
          listening={false}
        />
      )}
    </Group>
  )
}
