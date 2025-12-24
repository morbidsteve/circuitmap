'use client'

import { useRef, useEffect } from 'react'
import { Rect, Text, Group, Transformer } from 'react-konva'
import Konva from 'konva'
import { RoomWithDevices } from '@/types/panel'
import { useFloorPlanStore } from '@/stores/floorPlanStore'

interface RoomShapeProps {
  room: RoomWithDevices
  scale: number
  layoutX: number
  layoutY: number
  layoutW: number
  layoutH: number
  isSelected: boolean
  onSelect: () => void
}

export function RoomShape({
  room,
  scale,
  layoutX,
  layoutY,
  layoutW,
  layoutH,
  isSelected,
  onSelect,
}: RoomShapeProps) {
  const shapeRef = useRef<Konva.Rect>(null)
  const trRef = useRef<Konva.Transformer>(null)

  const { updateRoomPosition, updateRoomSize } = useFloorPlanStore()

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    // Convert pixel position back to feet (subtracting 100px padding offset)
    const PADDING = 100
    const newX = Math.max(0, (node.x() - PADDING) / scale)
    const newY = Math.max(0, (node.y() - PADDING) / scale)
    updateRoomPosition(room.id, newX, newY)
  }

  const handleTransformEnd = () => {
    const node = shapeRef.current
    if (!node) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scale and apply to width/height
    node.scaleX(1)
    node.scaleY(1)

    // Convert pixels back to feet
    const newWidth = Math.max(4, (node.width() * scaleX) / scale)
    const newHeight = Math.max(4, (node.height() * scaleY) / scale)

    updateRoomSize(room.id, newWidth, newHeight)
  }

  // Room dimensions in feet for display
  const widthFeet = Math.round(layoutW / scale)
  const heightFeet = Math.round(layoutH / scale)

  return (
    <>
      <Group>
        {/* Room rectangle */}
        <Rect
          ref={shapeRef}
          x={layoutX}
          y={layoutY}
          width={layoutW}
          height={layoutH}
          fill="#FFFFFF"
          stroke={isSelected ? '#3B82F6' : '#94A3B8'}
          strokeWidth={isSelected ? 3 : 2}
          cornerRadius={4}
          shadowColor="black"
          shadowBlur={isSelected ? 12 : 6}
          shadowOpacity={isSelected ? 0.2 : 0.1}
          shadowOffsetY={2}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        />

        {/* Room name */}
        <Text
          x={layoutX + 12}
          y={layoutY + 12}
          text={room.name}
          fontSize={16}
          fontStyle="bold"
          fill="#1E293B"
          listening={false}
        />

        {/* Room dimensions */}
        <Text
          x={layoutX + 12}
          y={layoutY + 32}
          text={`${widthFeet}' × ${heightFeet}'`}
          fontSize={12}
          fill="#64748B"
          listening={false}
        />

        {/* Device count indicator */}
        {room.devices && room.devices.length > 0 && (
          <Group x={layoutX + layoutW - 30} y={layoutY + 10}>
            <Rect
              x={0}
              y={0}
              width={24}
              height={20}
              fill="#E2E8F0"
              cornerRadius={4}
            />
            <Text
              x={0}
              y={3}
              width={24}
              text={String(room.devices.length)}
              fontSize={12}
              fill="#475569"
              align="center"
              fontStyle="bold"
              listening={false}
            />
          </Group>
        )}
      </Group>

      {/* Resize handles when selected */}
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          borderStroke="#3B82F6"
          borderStrokeWidth={2}
          anchorFill="#FFFFFF"
          anchorStroke="#3B82F6"
          anchorSize={10}
          anchorCornerRadius={2}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size: 4 feet
            const minSize = 4 * scale
            if (newBox.width < minSize || newBox.height < minSize) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
    </>
  )
}
