'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';

// Axis helper component - shows RGB axis lines
export function AxisHelper({ size = 5 }: { size?: number }) {
  return (
    <group>
      {/* X axis - Red */}
      <Line
        points={[[0, 0, 0], [size, 0, 0]]}
        color="#ef4444"
        lineWidth={2}
      />
      <Text
        position={[size + 0.5, 0, 0]}
        fontSize={0.5}
        color="#ef4444"
      >
        X
      </Text>

      {/* Y axis - Green */}
      <Line
        points={[[0, 0, 0], [0, size, 0]]}
        color="#22c55e"
        lineWidth={2}
      />
      <Text
        position={[0, size + 0.5, 0]}
        fontSize={0.5}
        color="#22c55e"
      >
        Y
      </Text>

      {/* Z axis - Blue */}
      <Line
        points={[[0, 0, 0], [0, 0, size]]}
        color="#3b82f6"
        lineWidth={2}
      />
      <Text
        position={[0, 0, size + 0.5]}
        fontSize={0.5}
        color="#3b82f6"
      >
        Z
      </Text>
    </group>
  );
}

// Scale reference - shows measurements
export function ScaleReference({ position = [0, 0, 0] as [number, number, number] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* 5-foot marker post */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 5, 8]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      {/* 1-foot tick marks */}
      {[1, 2, 3, 4, 5].map((ft) => (
        <group key={ft} position={[0, ft, 0]}>
          <mesh position={[0.2, 0, 0]}>
            <boxGeometry args={[0.3, 0.05, 0.05]} />
            <meshStandardMaterial color="#888888" />
          </mesh>
          <Text
            position={[0.5, 0, 0]}
            fontSize={0.25}
            color="#666666"
            anchorX="left"
          >
            {ft}'
          </Text>
        </group>
      ))}

      {/* Human figure silhouette for scale (5'6" / 1.68m) */}
      <group position={[1, 0, 0]}>
        {/* Body */}
        <mesh position={[0, 1.5, 0]}>
          <capsuleGeometry args={[0.25, 1.5, 4, 8]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.7} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 2.65, 0]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.7} />
        </mesh>
        <Text
          position={[0, 3.2, 0]}
          fontSize={0.2}
          color="#64748b"
          anchorX="center"
        >
          5'6"
        </Text>
      </group>
    </group>
  );
}

// Grid with distance labels
export function LabeledGrid({ size = 50, divisions = 10 }: { size?: number; divisions?: number }) {
  const step = size / divisions;

  return (
    <group position={[0, 0.01, 0]}>
      {/* Distance labels along X axis */}
      {Array.from({ length: divisions + 1 }, (_, i) => {
        const x = -size / 2 + i * step;
        return (
          <Text
            key={`x-${i}`}
            position={[x, 0, -size / 2 - 1]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.8}
            color="#666666"
            anchorX="center"
          >
            {x.toFixed(0)}'
          </Text>
        );
      })}

      {/* Distance labels along Z axis */}
      {Array.from({ length: divisions + 1 }, (_, i) => {
        const z = -size / 2 + i * step;
        return (
          <Text
            key={`z-${i}`}
            position={[-size / 2 - 1, 0, z]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
            fontSize={0.8}
            color="#666666"
            anchorX="center"
          >
            {z.toFixed(0)}'
          </Text>
        );
      })}
    </group>
  );
}

// Mini compass that always faces camera
export function CompassIndicator() {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (ref.current) {
      // Position compass in top-right of viewport
      const distance = 30;
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);

      ref.current.position.copy(camera.position).add(direction.multiplyScalar(10));
      ref.current.position.y = camera.position.y + 5;

      // Make it face the camera
      ref.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={ref}>
      {/* North pointer */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 0.5, 4]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.3}
        color="#ef4444"
      >
        N
      </Text>
    </group>
  );
}

// Floor level indicator
interface FloorIndicatorProps {
  floors: { id: string; name: string; level: number }[];
  selectedFloorId: string | null;
  ceilingHeight: number;
  floorSpacing: number;
}

export function FloorIndicator({ floors, selectedFloorId, ceilingHeight, floorSpacing }: FloorIndicatorProps) {
  const sortedFloors = [...floors].sort((a, b) => b.level - a.level);

  return (
    <group position={[-15, 0, 0]}>
      {/* Vertical pole */}
      <mesh position={[0, sortedFloors.length * (ceilingHeight + floorSpacing) / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, sortedFloors.length * (ceilingHeight + floorSpacing) + 2, 8]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* Floor markers */}
      {sortedFloors.map((floor) => {
        const y = floor.level * (ceilingHeight + floorSpacing);
        const isSelected = floor.id === selectedFloorId;

        return (
          <group key={floor.id} position={[0, y, 0]}>
            {/* Marker */}
            <mesh>
              <sphereGeometry args={[isSelected ? 0.3 : 0.2, 16, 16]} />
              <meshStandardMaterial color={isSelected ? '#3b82f6' : '#94a3b8'} />
            </mesh>
            {/* Label */}
            <Text
              position={[-1, 0, 0]}
              fontSize={0.4}
              color={isSelected ? '#3b82f6' : '#64748b'}
              anchorX="right"
            >
              {floor.name}
            </Text>
            {/* Level height */}
            <Text
              position={[-1, -0.4, 0]}
              fontSize={0.25}
              color="#94a3b8"
              anchorX="right"
            >
              {y.toFixed(0)}' from ground
            </Text>
          </group>
        );
      })}
    </group>
  );
}

export default { AxisHelper, ScaleReference, LabeledGrid, CompassIndicator, FloorIndicator };
