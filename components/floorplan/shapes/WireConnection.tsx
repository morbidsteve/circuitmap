'use client'

import { useRef, useEffect, useMemo } from 'react'
import { Line, Group, Text, Rect, Circle, Shape } from 'react-konva'
import Konva from 'konva'
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
  isPulsing?: boolean
}

// Calculate bezier curve control points for a smooth wire path
function calculateBezierPoints(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { cp1x: number; cp1y: number; cp2x: number; cp2y: number } {
  const dx = endX - startX
  const dy = endY - startY
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Control point offset based on distance
  const offset = Math.min(distance * 0.3, 100)

  // Create a curved path that goes upward/outward from the device
  // and curves down toward the panel
  return {
    cp1x: startX,
    cp1y: startY - offset,
    cp2x: endX + offset * 0.5,
    cp2y: endY,
  }
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
  isPulsing = false,
}: WireConnectionProps) {
  const lineRef = useRef<Konva.Shape>(null)
  const getDeviceWithUpdates = useFloorPlanStore((state) => state.getDeviceWithUpdates)
  const pendingDeviceUpdates = useFloorPlanStore((state) => state.pendingDeviceUpdates)
  // Subscribe to this device's pending updates to re-render when position changes
  const deviceUpdates = pendingDeviceUpdates[device.id]

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

  // Calculate bezier control points
  const bezierPoints = useMemo(
    () => calculateBezierPoints(deviceX, deviceY, panelIconX, panelIconY),
    [deviceX, deviceY, panelIconX, panelIconY]
  )

  // Calculate midpoint on bezier curve for label
  const t = 0.5
  const midX = Math.pow(1-t,3)*deviceX + 3*Math.pow(1-t,2)*t*bezierPoints.cp1x + 3*(1-t)*t*t*bezierPoints.cp2x + t*t*t*panelIconX
  const midY = Math.pow(1-t,3)*deviceY + 3*Math.pow(1-t,2)*t*bezierPoints.cp1y + 3*(1-t)*t*t*bezierPoints.cp2y + t*t*t*panelIconY

  // Animated dash offset for highlighted wires
  useEffect(() => {
    if (!isHighlighted || !lineRef.current) return

    const anim = new Konva.Animation((frame) => {
      if (!frame || !lineRef.current) return
      lineRef.current.dashOffset(-frame.time / 50)
    }, lineRef.current.getLayer())

    anim.start()
    return () => { anim.stop() }
  }, [isHighlighted])

  // Early return after all hooks
  if (!device.breakerId) return null

  const baseOpacity = isHighlighted ? 0.85 : 0.12
  const strokeWidth = isHighlighted ? 2.5 : 1

  return (
    <Group opacity={baseOpacity}>
      {/* Glow effect for highlighted wires */}
      {isHighlighted && (
        <Shape
          sceneFunc={(context, shape) => {
            context.beginPath()
            context.moveTo(deviceX, deviceY)
            context.bezierCurveTo(
              bezierPoints.cp1x, bezierPoints.cp1y,
              bezierPoints.cp2x, bezierPoints.cp2y,
              panelIconX, panelIconY
            )
            context.fillStrokeShape(shape)
          }}
          stroke={colors.fill}
          strokeWidth={8}
          opacity={0.2}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      )}

      {/* Main bezier curve wire */}
      <Shape
        ref={lineRef}
        sceneFunc={(context, shape) => {
          context.beginPath()
          context.moveTo(deviceX, deviceY)
          context.bezierCurveTo(
            bezierPoints.cp1x, bezierPoints.cp1y,
            bezierPoints.cp2x, bezierPoints.cp2y,
            panelIconX, panelIconY
          )
          context.fillStrokeShape(shape)
        }}
        stroke={colors.fill}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        dash={isHighlighted ? [8, 4] : [6, 6]}
        listening={false}
      />

      {/* Connection dot at device end */}
      {isHighlighted && (
        <Circle
          x={deviceX}
          y={deviceY}
          radius={4}
          fill={colors.fill}
          stroke="white"
          strokeWidth={1.5}
          listening={false}
        />
      )}

      {/* Connection dot at panel end */}
      {isHighlighted && (
        <Circle
          x={panelIconX}
          y={panelIconY}
          radius={5}
          fill={colors.fill}
          stroke="white"
          strokeWidth={1.5}
          listening={false}
        />
      )}

      {/* Breaker label at midpoint (only when highlighted) */}
      {isHighlighted && breaker && (
        <Group x={midX} y={midY}>
          <Rect
            x={-30}
            y={-12}
            width={60}
            height={24}
            fill="white"
            cornerRadius={6}
            stroke={colors.fill}
            strokeWidth={2}
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={4}
            shadowOffsetY={2}
          />
          <Text
            x={-30}
            y={-7}
            width={60}
            text={`#${breaker.position}`}
            fontSize={12}
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
