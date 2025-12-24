'use client';

import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import type { FloorWithRooms, Breaker } from '@/types/panel';
import { Room3D } from './Room3D';
import { Device3D } from './Device3D';

interface FloorPlan3DProps {
  floors: FloorWithRooms[];
  breakers: Breaker[];
  selectedFloorId: string | null;
  showAllFloors: boolean;
  floorSpacing: number;
  ceilingHeight: number;
}

export function FloorPlan3D({
  floors,
  breakers,
  selectedFloorId,
  showAllFloors,
  floorSpacing,
  ceilingHeight,
}: FloorPlan3DProps) {
  // Sort floors by level
  const sortedFloors = useMemo(
    () => [...floors].sort((a, b) => a.level - b.level),
    [floors]
  );

  // Create a breaker lookup map
  const breakerMap = useMemo(() => {
    const map = new Map<string, Breaker>();
    breakers.forEach((b) => map.set(b.id, b));
    return map;
  }, [breakers]);

  // Calculate Y offset for each floor
  const getFloorYOffset = (floor: FloorWithRooms) => {
    // Each floor is (ceiling height + spacing) above the previous
    return floor.level * (ceilingHeight + floorSpacing);
  };

  // Find center point of all rooms to center the view
  const sceneCenter = useMemo(() => {
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    sortedFloors.forEach((floor) => {
      floor.rooms.forEach((room) => {
        const x = room.positionX || 0;
        const z = room.positionY || 0;
        const w = room.width || 10;
        const h = room.height || 10;

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x + w);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z + h);
      });
    });

    if (!isFinite(minX)) return { x: 0, z: 0 };

    return {
      x: (minX + maxX) / 2,
      z: (minZ + maxZ) / 2,
    };
  }, [sortedFloors]);

  return (
    <group position={[-sceneCenter.x, 0, -sceneCenter.z]}>
      {sortedFloors.map((floor) => {
        // Skip non-selected floors if not showing all
        const isSelected = floor.id === selectedFloorId;
        const shouldShow = showAllFloors || isSelected;

        if (!shouldShow) return null;

        const yOffset = getFloorYOffset(floor);
        const opacity = showAllFloors && !isSelected ? 0.4 : 1;

        return (
          <group key={floor.id} position={[0, yOffset, 0]}>
            {/* Floor label */}
            <Text
              position={[-5, ceilingHeight / 2, 0]}
              rotation={[0, Math.PI / 2, 0]}
              fontSize={1}
              color={isSelected ? '#3b82f6' : '#666666'}
              anchorX="right"
              anchorY="middle"
            >
              {floor.name}
            </Text>

            {/* Render rooms */}
            {floor.rooms.map((room) => (
              <group key={room.id}>
                <Room3D
                  room={room}
                  ceilingHeight={ceilingHeight}
                  opacity={opacity}
                  isSelected={false} // TODO: Add room selection in 3D
                />

                {/* Render devices in this room */}
                {room.devices.map((device) => {
                  const breaker = device.breakerId
                    ? breakerMap.get(device.breakerId)
                    : undefined;

                  return (
                    <Device3D
                      key={device.id}
                      device={device}
                      room={room}
                      breaker={breaker}
                      isHighlighted={false} // TODO: Add device highlighting
                    />
                  );
                })}
              </group>
            ))}

            {/* Floor plane at this level */}
            <mesh
              position={[sceneCenter.x, 0, sceneCenter.z]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial
                color="#f5f5f5"
                transparent
                opacity={0.5 * opacity}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
