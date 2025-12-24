'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva'
import Konva from 'konva'
import { FloorWithRooms, Breaker, RoomWithDevices, Device } from '@/types/panel'
import { useFloorPlanStore } from '@/stores/floorPlanStore'
import { RoomShape } from './shapes/RoomShape'
import { DeviceMarker } from './shapes/DeviceMarker'
import { WireConnection } from './shapes/WireConnection'

interface FloorPlanCanvasProps {
  floor: FloorWithRooms
  breakers: Breaker[]
  width: number
  height: number
}

// 1 foot = 20 pixels (reasonable scale for viewing)
const SCALE = 20
const GRID_SIZE_FEET = 5 // Grid every 5 feet
const PADDING = 100 // Padding around content

export function FloorPlanCanvas({ floor, breakers, width, height }: FloorPlanCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  // Ensure minimum canvas size
  const [stageSize, setStageSize] = useState({
    width: Math.max(width, 400),
    height: Math.max(height, 400)
  })

  const {
    zoom,
    panOffset,
    setZoom,
    setPanOffset,
    snapToGrid,
    showWires,
    selectedRoomId,
    selectedDeviceId,
    highlightedBreakerId,
    selectRoom,
    selectDevice,
    activeTool,
    getRoomWithUpdates,
  } = useFloorPlanStore()

  // Update stage size when container resizes
  useEffect(() => {
    setStageSize({
      width: Math.max(width, 400),
      height: Math.max(height, 400)
    })
  }, [width, height])

  // Auto-layout rooms that don't have positions
  const roomsWithLayout = useMemo(() => {
    const layoutRooms: (RoomWithDevices & { layoutX: number; layoutY: number; layoutW: number; layoutH: number })[] = []

    // Defensive: ensure rooms is an array
    const rooms = floor.rooms || []
    if (rooms.length === 0) return layoutRooms

    let currentX = PADDING
    let currentY = PADDING
    let rowHeight = 0
    const maxRowWidth = Math.max(800, stageSize.width - PADDING * 2)

    rooms.forEach((room) => {
      const updatedRoom = getRoomWithUpdates(room)
      // Default room size: 12x10 feet if not specified
      const roomWidth = (updatedRoom.width ?? 12) * SCALE
      const roomHeight = (updatedRoom.height ?? 10) * SCALE

      // Check if room has explicit position
      const hasPosition = updatedRoom.positionX !== undefined && updatedRoom.positionX !== null &&
                          updatedRoom.positionY !== undefined && updatedRoom.positionY !== null

      if (hasPosition) {
        // Add padding offset so rooms with position (0,0) aren't at canvas edge
        layoutRooms.push({
          ...room,
          layoutX: PADDING + (updatedRoom.positionX!) * SCALE,
          layoutY: PADDING + (updatedRoom.positionY!) * SCALE,
          layoutW: roomWidth,
          layoutH: roomHeight,
        })
      } else {
        // Auto-layout: place in rows
        if (currentX + roomWidth > maxRowWidth && currentX > PADDING) {
          currentX = PADDING
          currentY += rowHeight + 40 // Gap between rows
          rowHeight = 0
        }

        layoutRooms.push({
          ...room,
          layoutX: currentX,
          layoutY: currentY,
          layoutW: roomWidth,
          layoutH: roomHeight,
        })

        currentX += roomWidth + 40 // Gap between rooms
        rowHeight = Math.max(rowHeight, roomHeight)
      }
    })

    return layoutRooms
  }, [floor.rooms, getRoomWithUpdates, stageSize.width])

  // Calculate canvas bounds based on room layout
  const canvasBounds = useMemo(() => {
    if (roomsWithLayout.length === 0) {
      return { width: 800, height: 600 }
    }

    let maxX = 0
    let maxY = 0
    roomsWithLayout.forEach((room) => {
      maxX = Math.max(maxX, room.layoutX + room.layoutW)
      maxY = Math.max(maxY, room.layoutY + room.layoutH)
    })

    return {
      width: maxX + PADDING,
      height: maxY + PADDING,
    }
  }, [roomsWithLayout])

  // Panel icon position (top-left, offset from rooms)
  const panelIconX = 50
  const panelIconY = 50

  // Collect all devices from all rooms
  const allDevices = useMemo(() => {
    const devices: { device: Device; room: RoomWithDevices; layoutX: number; layoutY: number }[] = []
    roomsWithLayout.forEach((room) => {
      // Defensive: ensure devices is an array
      const roomDevices = room.devices || []
      roomDevices.forEach((device) => {
        devices.push({
          device,
          room,
          layoutX: room.layoutX,
          layoutY: room.layoutY,
        })
      })
    })
    return devices
  }, [roomsWithLayout])

  // Handle wheel for zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()

    const stage = stageRef.current
    if (!stage) return

    const oldScale = zoom
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - panOffset.x) / oldScale,
      y: (pointer.y - panOffset.y) / oldScale,
    }

    const scaleBy = 1.1
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy

    setZoom(newScale)

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }

    setPanOffset(newPos)
  }

  // Handle stage click to deselect
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      selectRoom(null)
      selectDevice(null)
    }
  }

  // Determine if a device should be highlighted
  const shouldHighlightDevice = (device: Device) => {
    if (!highlightedBreakerId) return true
    return device.breakerId === highlightedBreakerId
  }

  // Grid dimensions
  const gridWidth = Math.max(canvasBounds.width, stageSize.width / zoom)
  const gridHeight = Math.max(canvasBounds.height, stageSize.height / zoom)

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      scaleX={zoom}
      scaleY={zoom}
      x={panOffset.x}
      y={panOffset.y}
      draggable={activeTool === 'pan'}
      onWheel={handleWheel}
      onClick={handleStageClick}
      onTap={handleStageClick}
      onDragEnd={(e) => {
        if (e.target === stageRef.current) {
          setPanOffset({ x: e.target.x(), y: e.target.y() })
        }
      }}
    >
      {/* Background layer with grid */}
      <Layer>
        {/* Background */}
        <Rect
          x={0}
          y={0}
          width={gridWidth}
          height={gridHeight}
          fill="#F8FAFC"
        />

        {/* Grid lines */}
        {snapToGrid && (
          <>
            {/* Vertical grid lines */}
            {Array.from({ length: Math.ceil(gridWidth / (GRID_SIZE_FEET * SCALE)) + 1 }).map((_, i) => (
              <Line
                key={`v-${i}`}
                points={[i * GRID_SIZE_FEET * SCALE, 0, i * GRID_SIZE_FEET * SCALE, gridHeight]}
                stroke="#E2E8F0"
                strokeWidth={1}
              />
            ))}
            {/* Horizontal grid lines */}
            {Array.from({ length: Math.ceil(gridHeight / (GRID_SIZE_FEET * SCALE)) + 1 }).map((_, i) => (
              <Line
                key={`h-${i}`}
                points={[0, i * GRID_SIZE_FEET * SCALE, gridWidth, i * GRID_SIZE_FEET * SCALE]}
                stroke="#E2E8F0"
                strokeWidth={1}
              />
            ))}
            {/* Scale indicator */}
            <Group x={20} y={gridHeight - 40}>
              <Line points={[0, 0, 5 * SCALE, 0]} stroke="#64748B" strokeWidth={2} />
              <Line points={[0, -5, 0, 5]} stroke="#64748B" strokeWidth={2} />
              <Line points={[5 * SCALE, -5, 5 * SCALE, 5]} stroke="#64748B" strokeWidth={2} />
              <Text x={5 * SCALE / 2 - 15} y={8} text="5 feet" fontSize={12} fill="#64748B" />
            </Group>
          </>
        )}
      </Layer>

      {/* Wire layer (below rooms and devices) */}
      {showWires && (
        <Layer>
          {allDevices.map(({ device, room, layoutX, layoutY }) => (
            <WireConnection
              key={`wire-${device.id}`}
              device={device}
              room={room}
              breakers={breakers}
              scale={SCALE}
              panelIconX={panelIconX}
              panelIconY={panelIconY}
              roomOffsetX={layoutX}
              roomOffsetY={layoutY}
              isHighlighted={shouldHighlightDevice(device)}
            />
          ))}
        </Layer>
      )}

      {/* Rooms layer */}
      <Layer>
        {roomsWithLayout.map((room) => (
          <RoomShape
            key={room.id}
            room={room}
            scale={SCALE}
            layoutX={room.layoutX}
            layoutY={room.layoutY}
            layoutW={room.layoutW}
            layoutH={room.layoutH}
            isSelected={selectedRoomId === room.id}
            onSelect={() => selectRoom(room.id)}
          />
        ))}
      </Layer>

      {/* Devices layer */}
      <Layer>
        {allDevices.map(({ device, room, layoutX, layoutY }) => (
          <DeviceMarker
            key={device.id}
            device={device}
            room={room}
            breakers={breakers}
            scale={SCALE}
            roomOffsetX={layoutX}
            roomOffsetY={layoutY}
            isSelected={selectedDeviceId === device.id}
            isHighlighted={shouldHighlightDevice(device)}
            onSelect={() => selectDevice(device.id)}
          />
        ))}
      </Layer>

      {/* Panel icon layer */}
      <Layer>
        <Group x={panelIconX} y={panelIconY}>
          {/* Panel box */}
          <Rect
            x={-30}
            y={-40}
            width={60}
            height={80}
            fill="#1F2937"
            cornerRadius={4}
            stroke="#111827"
            strokeWidth={2}
            shadowColor="black"
            shadowBlur={10}
            shadowOpacity={0.3}
            shadowOffsetY={4}
          />
          {/* Panel face */}
          <Rect
            x={-25}
            y={-35}
            width={50}
            height={60}
            fill="#374151"
            cornerRadius={2}
          />
          {/* Breaker slots */}
          {[0, 1, 2, 3, 4].map((row) => (
            <Group key={row}>
              <Rect x={-20} y={-28 + row * 11} width={16} height={8} fill="#6B7280" cornerRadius={1} />
              <Rect x={4} y={-28 + row * 11} width={16} height={8} fill="#6B7280" cornerRadius={1} />
            </Group>
          ))}
          {/* Panel label */}
          <Text
            x={-25}
            y={30}
            width={50}
            text="PANEL"
            fontSize={10}
            fill="#9CA3AF"
            fontStyle="bold"
            align="center"
          />
        </Group>
      </Layer>

      {/* Instructions overlay for empty state */}
      {roomsWithLayout.length === 0 && (
        <Layer>
          <Text
            x={stageSize.width / 2 / zoom - 150}
            y={stageSize.height / 2 / zoom - 20}
            width={300}
            text="Add rooms in the Locations tab, then arrange them here"
            fontSize={16}
            fill="#64748B"
            align="center"
          />
        </Layer>
      )}
    </Stage>
  )
}
