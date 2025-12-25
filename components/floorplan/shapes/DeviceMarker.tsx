'use client'

import { useRef, useEffect } from 'react'
import { Circle, Group, Text, Rect, Line, RegularPolygon, Arc } from 'react-konva'
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
  isPulsingHighlight?: boolean
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

// Placement indicator symbols
const PLACEMENT_INDICATORS: Record<string, { symbol: string; color: string }> = {
  wall: { symbol: 'W', color: '#6366F1' },
  ceiling: { symbol: 'C', color: '#F59E0B' },
  floor: { symbol: 'F', color: '#10B981' },
}

// Device icon component that renders distinct shapes for each device type
function DeviceIcon({ type, color, size = 12 }: { type: string; color: string; size?: number }) {
  const s = size

  switch (type) {
    case 'outlet':
      // Outlet: Rectangle with two vertical slots
      return (
        <Group>
          <Rect x={-s*0.6} y={-s*0.8} width={s*1.2} height={s*1.6} fill={color} cornerRadius={2} />
          <Rect x={-s*0.3} y={-s*0.5} width={s*0.15} height={s*0.4} fill="white" />
          <Rect x={s*0.15} y={-s*0.5} width={s*0.15} height={s*0.4} fill="white" />
          <Rect x={-s*0.3} y={s*0.1} width={s*0.15} height={s*0.4} fill="white" />
          <Rect x={s*0.15} y={s*0.1} width={s*0.15} height={s*0.4} fill="white" />
        </Group>
      )

    case 'light':
      // Light: Bulb shape (circle with base)
      return (
        <Group>
          <Circle radius={s*0.7} fill={color} />
          <Rect x={-s*0.3} y={s*0.5} width={s*0.6} height={s*0.4} fill={color} />
          <Line points={[-s*0.4, -s*0.4, -s*0.7, -s*0.7]} stroke="white" strokeWidth={2} />
          <Line points={[s*0.4, -s*0.4, s*0.7, -s*0.7]} stroke="white" strokeWidth={2} />
          <Line points={[0, -s*0.6, 0, -s*0.9]} stroke="white" strokeWidth={2} />
        </Group>
      )

    case 'switch':
      // Switch: Rectangle with toggle circle
      return (
        <Group>
          <Rect x={-s*0.5} y={-s*0.9} width={s*1} height={s*1.8} fill={color} cornerRadius={s*0.2} />
          <Circle y={-s*0.3} radius={s*0.25} fill="white" />
          <Rect x={-s*0.08} y={-s*0.3} width={s*0.16} height={s*0.5} fill="white" />
        </Group>
      )

    case 'fan':
      // Fan: Circle with blades
      return (
        <Group>
          <Circle radius={s*0.8} fill={color} />
          <Circle radius={s*0.25} fill="white" />
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <Line
              key={i}
              points={[0, 0, s*0.6, 0]}
              stroke="white"
              strokeWidth={3}
              rotation={angle}
            />
          ))}
        </Group>
      )

    case 'hvac':
      // HVAC: Snowflake pattern
      return (
        <Group>
          <Circle radius={s*0.8} fill={color} />
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <Line
              key={i}
              points={[0, 0, s*0.5, 0]}
              stroke="white"
              strokeWidth={2}
              rotation={angle}
            />
          ))}
          <Circle radius={s*0.15} fill="white" />
        </Group>
      )

    case 'appliance':
    case 'range':
    case 'dryer':
      // Appliance: Box with plug symbol
      return (
        <Group>
          <Rect x={-s*0.7} y={-s*0.7} width={s*1.4} height={s*1.4} fill={color} cornerRadius={3} />
          <Circle radius={s*0.35} stroke="white" strokeWidth={2} fill="transparent" />
          <Line points={[0, -s*0.35, 0, s*0.35]} stroke="white" strokeWidth={2} />
        </Group>
      )

    case 'water_heater':
      // Water heater: Tank with flame
      return (
        <Group>
          <Rect x={-s*0.6} y={-s*0.8} width={s*1.2} height={s*1.6} fill={color} cornerRadius={s*0.3} />
          <RegularPolygon sides={3} radius={s*0.4} fill="#FFA500" y={s*0.2} rotation={180} />
        </Group>
      )

    case 'ev_charger':
      // EV Charger: Lightning bolt
      return (
        <Group>
          <Circle radius={s*0.8} fill={color} />
          <Line
            points={[s*0.1, -s*0.5, -s*0.2, 0, s*0.1, 0, -s*0.1, s*0.5]}
            stroke="white"
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
          />
        </Group>
      )

    case 'smoke_detector':
      // Smoke detector: Circle with dot
      return (
        <Group>
          <Circle radius={s*0.8} fill={color} />
          <Circle radius={s*0.4} stroke="white" strokeWidth={2} fill="transparent" />
          <Circle radius={s*0.15} fill="white" />
        </Group>
      )

    case 'pool':
      // Pool: Wavy lines
      return (
        <Group>
          <Circle radius={s*0.8} fill={color} />
          <Arc
            x={-s*0.3} y={-s*0.2}
            innerRadius={0} outerRadius={s*0.3}
            angle={180} rotation={-90}
            stroke="white" strokeWidth={2}
          />
          <Arc
            x={s*0.3} y={s*0.1}
            innerRadius={0} outerRadius={s*0.3}
            angle={180} rotation={90}
            stroke="white" strokeWidth={2}
          />
        </Group>
      )

    default:
      // Other: Circle with dot
      return (
        <Group>
          <Circle radius={s*0.8} fill={color} />
          <Circle radius={s*0.3} fill="white" />
        </Group>
      )
  }
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

      {/* Background circle for unassigned devices */}
      {isUnassigned && (
        <Circle
          radius={radius}
          fill="#F3F4F6"
          stroke="#9CA3AF"
          strokeWidth={2}
          dash={[4, 4]}
          shadowColor="black"
          shadowBlur={4}
          shadowOpacity={0.2}
          shadowOffsetY={2}
        />
      )}

      {/* Device icon - distinct shape for each type */}
      <Group shadowColor="black" shadowBlur={isHighlighted ? 6 : 3} shadowOpacity={0.3} shadowOffsetY={1}>
        <DeviceIcon type={device.type} color={colors.fill} size={radius * 0.9} />
      </Group>

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
