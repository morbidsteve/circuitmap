'use client'

import { Line, Circle, Group, Text, Rect } from 'react-konva'
import { useFloorPlanStore } from '@/stores/floorPlanStore'
import { getWallLength } from '@/types/floorplan'

interface WallDrawingLayerProps {
  scale: number // pixels per foot
}

export function WallDrawingLayer({ scale }: WallDrawingLayerProps) {
  const {
    activeTool,
    wallDrawingState,
    pendingWallCreations,
    showDimensions,
  } = useFloorPlanStore()

  const { isDrawing, startPoint, previewPoint, chainPoints } = wallDrawingState

  // Calculate wall length for preview
  const previewLength = startPoint && previewPoint
    ? getWallLength({
        startX: startPoint.x,
        startY: startPoint.y,
        endX: previewPoint.x,
        endY: previewPoint.y,
      })
    : 0

  // Default wall thickness
  const thickness = 0.5 * scale

  return (
    <Group>
      {/* Render pending walls (not yet saved to server) */}
      {pendingWallCreations.map((wall, index) => {
        const startX = wall.startX * scale
        const startY = wall.startY * scale
        const endX = wall.endX * scale
        const endY = wall.endY * scale
        const wallLength = getWallLength(wall)

        // Calculate perpendicular offset for wall thickness
        const angle = Math.atan2(endY - startY, endX - startX)
        const perpAngle = angle + Math.PI / 2
        const offsetX = Math.cos(perpAngle) * thickness / 2
        const offsetY = Math.sin(perpAngle) * thickness / 2

        // Wall polygon points
        const wallPoints = [
          startX + offsetX, startY + offsetY,
          endX + offsetX, endY + offsetY,
          endX - offsetX, endY - offsetY,
          startX - offsetX, startY - offsetY,
        ]

        return (
          <Group key={`pending-${index}`}>
            {/* Wall body */}
            <Line
              points={wallPoints}
              closed
              fill="#6B7280"
              stroke="#374151"
              strokeWidth={1}
              opacity={0.8}
              dash={[4, 4]}
            />
            {/* Dimension label */}
            {showDimensions && wallLength >= 1 && (
              <Group>
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
          </Group>
        )
      })}

      {/* Chain points (showing connected wall path) */}
      {chainPoints.length > 1 && (
        <Line
          points={chainPoints.flatMap((p) => [p.x * scale, p.y * scale])}
          stroke="#3B82F6"
          strokeWidth={2}
          opacity={0.5}
        />
      )}

      {/* Preview line while drawing */}
      {activeTool === 'wall' && isDrawing && startPoint && previewPoint && (
        <Group>
          {/* Preview wall line */}
          <Line
            points={[
              startPoint.x * scale,
              startPoint.y * scale,
              previewPoint.x * scale,
              previewPoint.y * scale,
            ]}
            stroke="#3B82F6"
            strokeWidth={thickness}
            lineCap="round"
            dash={[8, 4]}
          />

          {/* Start point indicator */}
          <Circle
            x={startPoint.x * scale}
            y={startPoint.y * scale}
            radius={5}
            fill="#3B82F6"
            stroke="#1E40AF"
            strokeWidth={2}
          />

          {/* End point indicator (follows mouse) */}
          <Circle
            x={previewPoint.x * scale}
            y={previewPoint.y * scale}
            radius={5}
            fill="#10B981"
            stroke="#059669"
            strokeWidth={2}
          />

          {/* Length indicator */}
          {previewLength >= 0.5 && (
            <Group>
              <Rect
                x={(startPoint.x + previewPoint.x) / 2 * scale - 25}
                y={(startPoint.y + previewPoint.y) / 2 * scale - 25}
                width={50}
                height={20}
                fill="#1F2937"
                cornerRadius={4}
                opacity={0.9}
              />
              <Text
                x={(startPoint.x + previewPoint.x) / 2 * scale - 25}
                y={(startPoint.y + previewPoint.y) / 2 * scale - 22}
                width={50}
                text={`${previewLength.toFixed(1)}'`}
                fontSize={12}
                fill="white"
                align="center"
              />
            </Group>
          )}
        </Group>
      )}

      {/* Crosshair cursor indicator when wall tool is active but not drawing */}
      {activeTool === 'wall' && !isDrawing && (
        <Group listening={false}>
          {/* This would show at cursor position - handled by parent */}
        </Group>
      )}
    </Group>
  )
}
