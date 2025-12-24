'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import type { Room } from '@/types/panel';

interface Room3DProps {
  room: Room;
  ceilingHeight: number;
  opacity?: number;
  isSelected?: boolean;
}

export function Room3D({ room, ceilingHeight, opacity = 1, isSelected = false }: Room3DProps) {
  const x = room.positionX || 0;
  const z = room.positionY || 0;
  const width = room.width || 10;
  const depth = room.height || 10;

  // Wall thickness in feet
  const wallThickness = 0.5;

  // Colors
  const wallColor = isSelected ? '#60a5fa' : '#d4d4d8';
  const floorColor = '#f5f5f4';

  // Create wall geometry using extrusion
  const wallGeometry = useMemo(() => {
    // Create outer shape
    const outerShape = new THREE.Shape();
    outerShape.moveTo(0, 0);
    outerShape.lineTo(width, 0);
    outerShape.lineTo(width, depth);
    outerShape.lineTo(0, depth);
    outerShape.closePath();

    // Create inner hole (room interior)
    const innerHole = new THREE.Path();
    innerHole.moveTo(wallThickness, wallThickness);
    innerHole.lineTo(width - wallThickness, wallThickness);
    innerHole.lineTo(width - wallThickness, depth - wallThickness);
    innerHole.lineTo(wallThickness, depth - wallThickness);
    innerHole.closePath();

    outerShape.holes.push(innerHole);

    // Extrude to create walls
    const extrudeSettings = {
      depth: ceilingHeight,
      bevelEnabled: false,
    };

    return new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
  }, [width, depth, ceilingHeight, wallThickness]);

  return (
    <group position={[x, 0, z]}>
      {/* Floor */}
      <mesh
        position={[width / 2, 0.01, depth / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width - wallThickness * 2, depth - wallThickness * 2]} />
        <meshStandardMaterial
          color={floorColor}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Walls */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={wallGeometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={wallColor}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Room label */}
      <Text
        position={[width / 2, ceilingHeight + 0.5, depth / 2]}
        fontSize={0.8}
        color={isSelected ? '#3b82f6' : '#374151'}
        anchorX="center"
        anchorY="bottom"
        maxWidth={width - 1}
      >
        {room.name}
      </Text>

      {/* Dimension labels */}
      <Text
        position={[width / 2, 0.1, -0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.4}
        color="#666666"
        anchorX="center"
        anchorY="top"
      >
        {`${width.toFixed(1)} ft`}
      </Text>
      <Text
        position={[-0.5, 0.1, depth / 2]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        fontSize={0.4}
        color="#666666"
        anchorX="center"
        anchorY="top"
      >
        {`${depth.toFixed(1)} ft`}
      </Text>
    </group>
  );
}
