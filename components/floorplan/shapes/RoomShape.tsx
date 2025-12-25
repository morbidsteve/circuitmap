'use client'

import { useRef, useEffect, useState, memo } from 'react'
import { Rect, Text, Group, Transformer } from 'react-konva'
import Konva from 'konva'
import { RoomWithDevices, Breaker, Device } from '@/types/panel'
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
  children?: React.ReactNode
}

// Use memo to prevent re-renders when parent re-renders due to device position changes
export const RoomShape = memo(function RoomShape({
  room,
  scale,
  layoutX,
  layoutY,
  layoutW,
  layoutH,
  isSelected,
  onSelect,
  children,
}: RoomShapeProps) {
  const groupRef = useRef<Konva.Group>(null)
  const rectRef = useRef<Konva.Rect>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Use selectors to prevent re-renders when unrelated store state changes
  const updateRoomPosition = useFloorPlanStore((state) => state.updateRoomPosition)
  const updateRoomSize = useFloorPlanStore((state) => state.updateRoomSize)
  const activeTool = useFloorPlanStore((state) => state.activeTool)

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  // Reset drag offset when layout changes (e.g., after save)
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 })
  }, [layoutX, layoutY])

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Track offset during drag so children can follow
    const node = e.target
    setDragOffset({
      x: node.x() - layoutX,
      y: node.y() - layoutY,
    })
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    // Convert pixel position back to feet (subtracting 100px padding offset)
    const PADDING = 100
    const newX = Math.max(0, (node.x() - PADDING) / scale)
    const newY = Math.max(0, (node.y() - PADDING) / scale)
    updateRoomPosition(room.id, newX, newY)
    // Don't reset dragOffset here - let the useEffect handle it when layoutX/layoutY update
    // This prevents the room from snapping back before the store update triggers a re-render
  }

  const handleTransformEnd = () => {
    const node = rectRef.current
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

  // Current position including any drag offset
  const currentX = layoutX + dragOffset.x
  const currentY = layoutY + dragOffset.y

  // Only allow dragging with select tool
  const isDraggable = activeTool === 'select'

  return (
    <>
      <Group
        ref={groupRef}
        x={currentX}
        y={currentY}
        draggable={isDraggable}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {/* Room rectangle */}
        <Rect
          ref={rectRef}
          x={0}
          y={0}
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
          onClick={onSelect}
          onTap={onSelect}
          onTransformEnd={handleTransformEnd}
        />

        {/* Room name */}
        <Text
          x={12}
          y={12}
          text={room.name}
          fontSize={16}
          fontStyle="bold"
          fill="#1E293B"
          listening={false}
        />

        {/* Room dimensions */}
        <Text
          x={12}
          y={32}
          text={`${widthFeet}' × ${heightFeet}'`}
          fontSize={12}
          fill="#64748B"
          listening={false}
        />

        {/* Device count indicator */}
        {room.devices && room.devices.length > 0 && (
          <Group x={layoutW - 30} y={10}>
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

        {/* Render devices inside the room group so they move together */}
        {children}
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
})
