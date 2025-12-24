'use client'

import { useRef } from 'react'
import { Group, Line, Rect, Text, Circle } from 'react-konva'
import Konva from 'konva'
import type { WallWithOpenings } from '@/types/floorplan'
import { getWallLength, getWallAngle, getPointAlongWall } from '@/types/floorplan'
import { useFloorPlanStore } from '@/stores/floorPlanStore'

interface WallShapeProps {
  wall: WallWithOpenings
  scale: number // pixels per foot
  isSelected: boolean
  onSelect: () => void
  onDragStartPoint?: (wallId: string) => void
  onDragEndPoint?: (wallId: string) => void
}

// Wall thickness in feet
const DEFAULT_THICKNESS = 0.5

// Opening rendering
function renderOpening(
  wall: WallWithOpenings,
  openingIndex: number,
  scale: number,
  wallLength: number,
  wallAngle: number
) {
  const opening = wall.openings[openingIndex]
  const openingWidth = opening.width * scale
  const openingStart = opening.position * wallLength * scale

  // Calculate position along wall for the opening center
  const centerPos = getPointAlongWall(wall, opening.position)

  // Different rendering based on opening type
  const thickness = (wall.thickness || DEFAULT_THICKNESS) * scale

  if (opening.type === 'door') {
    // Door: gap in wall with arc showing swing direction
    return (
      <Group key={opening.id}>
        {/* Door swing arc */}
        <Line
          points={[
            centerPos.x * scale - openingWidth / 2,
            centerPos.y * scale,
            centerPos.x * scale - openingWidth / 2 + openingWidth * 0.7,
            centerPos.y * scale - openingWidth * 0.7,
          ]}
          stroke="#9CA3AF"
          strokeWidth={1}
          dash={[4, 4]}
        />
      </Group>
    )
  } else if (opening.type === 'window') {
    // Window: gap with small rectangles on sides
    return (
      <Group key={opening.id}>
        <Line
          points={[
            centerPos.x * scale - openingWidth / 2,
            centerPos.y * scale - thickness / 4,
            centerPos.x * scale + openingWidth / 2,
            centerPos.y * scale - thickness / 4,
          ]}
          stroke="#60A5FA"
          strokeWidth={2}
        />
        <Line
          points={[
            centerPos.x * scale - openingWidth / 2,
            centerPos.y * scale + thickness / 4,
            centerPos.x * scale + openingWidth / 2,
            centerPos.y * scale + thickness / 4,
          ]}
          stroke="#60A5FA"
          strokeWidth={2}
        />
      </Group>
    )
  }

  return null
}

export function WallShape({
  wall,
  scale,
  isSelected,
  onSelect,
}: WallShapeProps) {
  const groupRef = useRef<Konva.Group>(null)
  const {
    getWallWithUpdates,
    isWallDeleted,
    showDimensions,
    updateWallEndpoint,
    selectWall,
  } = useFloorPlanStore()

  // Don't render deleted walls
  if (isWallDeleted(wall.id)) {
    return null
  }

  // Get wall with any pending updates applied
  const updatedWall = getWallWithUpdates(wall)

  const wallLength = getWallLength(updatedWall)
  const wallAngle = getWallAngle(updatedWall)
  const thickness = (updatedWall.thickness || DEFAULT_THICKNESS) * scale

  // Convert to pixel coordinates
  const startX = updatedWall.startX * scale
  const startY = updatedWall.startY * scale
  const endX = updatedWall.endX * scale
  const endY = updatedWall.endY * scale

  // Calculate perpendicular offset for wall thickness
  const perpAngle = wallAngle + Math.PI / 2
  const offsetX = Math.cos(perpAngle) * thickness / 2
  const offsetY = Math.sin(perpAngle) * thickness / 2

  // Wall polygon points (rectangle representing the wall)
  const wallPoints = [
    startX + offsetX, startY + offsetY,
    endX + offsetX, endY + offsetY,
    endX - offsetX, endY - offsetY,
    startX - offsetX, startY - offsetY,
  ]

  // Handle endpoint drag
  const handleStartDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
    const pos = e.target.position()
    updateWallEndpoint(wall.id, 'start', {
      x: pos.x / scale,
      y: pos.y / scale,
    })
  }

  const handleEndDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
    const pos = e.target.position()
    updateWallEndpoint(wall.id, 'end', {
      x: pos.x / scale,
      y: pos.y / scale,
    })
  }

  return (
    <Group ref={groupRef}>
      {/* Wall body */}
      <Line
        points={wallPoints}
        closed
        fill={updatedWall.isExterior ? '#374151' : '#6B7280'}
        stroke={isSelected ? '#3B82F6' : '#1F2937'}
        strokeWidth={isSelected ? 2 : 1}
        onClick={onSelect}
        onTap={onSelect}
        shadowColor={isSelected ? '#3B82F6' : undefined}
        shadowBlur={isSelected ? 8 : 0}
        shadowOpacity={0.5}
      />

      {/* Dimension label (shows wall length in feet) */}
      {showDimensions && wallLength >= 1 && (
        <Group>
          {/* Background for text */}
          <Rect
            x={(startX + endX) / 2 - 20}
            y={(startY + endY) / 2 - 18}
            width={40}
            height={16}
            fill="white"
            cornerRadius={2}
            opacity={0.9}
          />
          <Text
            x={(startX + endX) / 2 - 20}
            y={(startY + endY) / 2 - 16}
            width={40}
            text={`${wallLength.toFixed(1)}'`}
            fontSize={10}
            fill="#374151"
            align="center"
          />
        </Group>
      )}

      {/* Endpoint handles (only when selected) */}
      {isSelected && (
        <>
          {/* Start point handle */}
          <Circle
            x={startX}
            y={startY}
            radius={6}
            fill="#3B82F6"
            stroke="#1E40AF"
            strokeWidth={2}
            draggable
            onDragEnd={handleStartDrag}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = 'move'
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = 'default'
            }}
          />
          {/* End point handle */}
          <Circle
            x={endX}
            y={endY}
            radius={6}
            fill="#3B82F6"
            stroke="#1E40AF"
            strokeWidth={2}
            draggable
            onDragEnd={handleEndDrag}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = 'move'
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = 'default'
            }}
          />
        </>
      )}

      {/* Render openings */}
      {(wall.openings || []).map((opening, index) =>
        renderOpening(wall, index, scale, wallLength, wallAngle)
      )}
    </Group>
  )
}
