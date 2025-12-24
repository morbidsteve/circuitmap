'use client';

import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { Device, Room, Breaker } from '@/types/panel';

// Device type colors
const DEVICE_COLORS: Record<string, string> = {
  outlet: '#4ade80', // green
  switch: '#60a5fa', // blue
  light: '#fbbf24', // yellow
  appliance: '#f97316', // orange
  hvac: '#8b5cf6', // purple
  other: '#6b7280', // gray
};

// Get color based on breaker circuit type or device type
function getDeviceColor(device: Device, breaker?: Breaker): string {
  if (breaker) {
    // Use circuit type colors if breaker is assigned
    const circuitColors: Record<string, string> = {
      lighting: '#fbbf24',
      outlets: '#4ade80',
      dedicated: '#f97316',
      hvac: '#8b5cf6',
      kitchen: '#ef4444',
      bathroom: '#06b6d4',
    };
    return circuitColors[breaker.circuitType] || DEVICE_COLORS[device.type] || DEVICE_COLORS.other;
  }
  return DEVICE_COLORS[device.type] || DEVICE_COLORS.other;
}

interface Device3DProps {
  device: Device;
  room: Room;
  breaker?: Breaker;
  isHighlighted?: boolean;
}

export function Device3D({ device, room, breaker, isHighlighted = false }: Device3DProps) {
  const roomX = room.positionX || 0;
  const roomZ = room.positionY || 0;

  // Device position relative to room
  const deviceX = device.positionX || 0;
  const deviceZ = device.positionY || 0;

  // Height from floor (convert inches to feet)
  const heightInFeet = (device.heightFromFloor || 48) / 12;

  // Absolute position in scene
  const position: [number, number, number] = [
    roomX + deviceX,
    heightInFeet,
    roomZ + deviceZ,
  ];

  const color = getDeviceColor(device, breaker);

  // Device shape based on type
  const deviceGeometry = useMemo(() => {
    switch (device.type) {
      case 'outlet':
        return { type: 'box', args: [0.3, 0.4, 0.1] as [number, number, number] };
      case 'switch':
        return { type: 'box', args: [0.25, 0.5, 0.1] as [number, number, number] };
      case 'light':
        return { type: 'sphere', args: [0.3] as [number] };
      case 'appliance':
        return { type: 'box', args: [0.5, 0.5, 0.5] as [number, number, number] };
      default:
        return { type: 'sphere', args: [0.2] as [number] };
    }
  }, [device.type]);

  return (
    <group position={position}>
      {/* Device marker */}
      {deviceGeometry.type === 'sphere' ? (
        <mesh castShadow>
          <sphereGeometry args={deviceGeometry.args as [number]} />
          <meshStandardMaterial
            color={color}
            emissive={isHighlighted ? color : '#000000'}
            emissiveIntensity={isHighlighted ? 0.5 : 0}
          />
        </mesh>
      ) : (
        <mesh castShadow>
          <boxGeometry args={deviceGeometry.args as [number, number, number]} />
          <meshStandardMaterial
            color={color}
            emissive={isHighlighted ? color : '#000000'}
            emissiveIntensity={isHighlighted ? 0.5 : 0}
          />
        </mesh>
      )}

      {/* Height indicator line (for wall-mounted devices) */}
      {device.placement === 'wall' && heightInFeet > 0.5 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([0, 0, 0, 0, -heightInFeet + 0.1, 0])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#999999" opacity={0.5} transparent />
        </line>
      )}

      {/* Label (using Html for crisp text) */}
      <Html
        position={[0, 0.5, 0]}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div
          className={`
            px-1.5 py-0.5 rounded text-xs whitespace-nowrap
            ${isHighlighted ? 'bg-blue-500 text-white' : 'bg-white/90 text-gray-700'}
            shadow-sm border border-gray-200
          `}
        >
          {device.description || device.type}
          {breaker && (
            <span className="ml-1 text-gray-500">
              ({breaker.label || `${breaker.amperage}A`})
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}
