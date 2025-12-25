'use client';

import { Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useFloorPlanStore } from '@/stores/floorPlanStore';
import type { FloorWithRooms, Breaker } from '@/types/panel';
import { FloorPlan3D } from './FloorPlan3D';
import { CameraControls3D } from './CameraControls3D';
import { Controls3DOverlay } from './Controls3DOverlay';
import { AxisHelper, ScaleReference, LabeledGrid, FloorIndicator } from './SceneHelpers';

// Camera preset positions
const CAMERA_PRESETS = {
  isometric: { position: [40, 30, 40] as [number, number, number], fov: 50 },
  top: { position: [0, 80, 0.1] as [number, number, number], fov: 45 },
  front: { position: [0, 15, 60] as [number, number, number], fov: 50 },
  side: { position: [60, 15, 0] as [number, number, number], fov: 50 },
  free: { position: [30, 25, 30] as [number, number, number], fov: 50 },
};

interface ThreeCanvasProps {
  floors: FloorWithRooms[];
  breakers: Breaker[];
  selectedFloorId: string | null;
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#888" />
    </mesh>
  );
}

// Camera controller component that lives inside Canvas
function CameraController({
  preset,
  onPositionChange,
  moveCommand,
  zoomCommand,
  resetTrigger,
}: {
  preset: keyof typeof CAMERA_PRESETS;
  onPositionChange?: (pos: { x: number; y: number; z: number }) => void;
  moveCommand?: { direction: string; timestamp: number } | null;
  zoomCommand?: { direction: string; timestamp: number } | null;
  resetTrigger?: number;
}) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const lastMoveRef = useRef(0);
  const lastZoomRef = useRef(0);
  const lastResetRef = useRef(0);

  // Apply camera preset
  useEffect(() => {
    const config = CAMERA_PRESETS[preset];
    camera.position.set(...config.position);
    if ((camera as THREE.PerspectiveCamera).fov !== config.fov) {
      (camera as THREE.PerspectiveCamera).fov = config.fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 4, 0);
      controlsRef.current.update();
    }
  }, [preset, camera]);

  // Handle move commands
  useEffect(() => {
    if (!moveCommand || moveCommand.timestamp === lastMoveRef.current) return;
    lastMoveRef.current = moveCommand.timestamp;

    if (!controlsRef.current) return;

    const moveAmount = 3;
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, up).normalize();

    switch (moveCommand.direction) {
      case 'forward':
        camera.position.addScaledVector(forward, moveAmount);
        controlsRef.current.target.addScaledVector(forward, moveAmount);
        break;
      case 'back':
        camera.position.addScaledVector(forward, -moveAmount);
        controlsRef.current.target.addScaledVector(forward, -moveAmount);
        break;
      case 'left':
        camera.position.addScaledVector(right, -moveAmount);
        controlsRef.current.target.addScaledVector(right, -moveAmount);
        break;
      case 'right':
        camera.position.addScaledVector(right, moveAmount);
        controlsRef.current.target.addScaledVector(right, moveAmount);
        break;
      case 'up':
        camera.position.y += moveAmount;
        controlsRef.current.target.y += moveAmount;
        break;
      case 'down':
        camera.position.y = Math.max(1, camera.position.y - moveAmount);
        controlsRef.current.target.y = Math.max(0, controlsRef.current.target.y - moveAmount);
        break;
    }
    controlsRef.current.update();
  }, [moveCommand, camera]);

  // Handle zoom commands
  useEffect(() => {
    if (!zoomCommand || zoomCommand.timestamp === lastZoomRef.current) return;
    lastZoomRef.current = zoomCommand.timestamp;

    const zoomAmount = 5;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    if (zoomCommand.direction === 'in') {
      camera.position.addScaledVector(direction, zoomAmount);
    } else {
      camera.position.addScaledVector(direction, -zoomAmount);
    }
  }, [zoomCommand, camera]);

  // Handle reset
  useEffect(() => {
    if (!resetTrigger || resetTrigger === lastResetRef.current) return;
    lastResetRef.current = resetTrigger;

    const config = CAMERA_PRESETS.isometric;
    camera.position.set(...config.position);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 4, 0);
      controlsRef.current.update();
    }
  }, [resetTrigger, camera]);

  // Report position changes
  useFrame(() => {
    if (onPositionChange) {
      onPositionChange({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      });
    }
  });

  return (
    <CameraControls3D
      target={[0, 4, 0]}
      // @ts-ignore - ref forwarding
      ref={controlsRef}
    />
  );
}

export function ThreeCanvas({ floors, breakers, selectedFloorId }: ThreeCanvasProps) {
  const { threeDSettings } = useFloorPlanStore();
  const [cameraPosition, setCameraPosition] = useState({ x: 40, y: 30, z: 40 });
  const [moveCommand, setMoveCommand] = useState<{ direction: string; timestamp: number } | null>(null);
  const [zoomCommand, setZoomCommand] = useState<{ direction: string; timestamp: number } | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleMoveCamera = useCallback((direction: 'forward' | 'back' | 'left' | 'right' | 'up' | 'down') => {
    setMoveCommand({ direction, timestamp: Date.now() });
  }, []);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setZoomCommand({ direction, timestamp: Date.now() });
  }, []);

  const handleResetView = useCallback(() => {
    setResetTrigger(Date.now());
  }, []);

  const handleCameraChange = useCallback((pos: { x: number; y: number; z: number }) => {
    setCameraPosition(pos);
  }, []);

  const cameraConfig = CAMERA_PRESETS[threeDSettings.cameraPreset];

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={cameraConfig.position}
          fov={cameraConfig.fov}
        />

        {/* Camera controls with keyboard support */}
        <CameraController
          preset={threeDSettings.cameraPreset}
          onPositionChange={handleCameraChange}
          moveCommand={moveCommand}
          zoomCommand={zoomCommand}
          resetTrigger={resetTrigger}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[30, 50, 30]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={150}
          shadow-camera-left={-60}
          shadow-camera-right={60}
          shadow-camera-top={60}
          shadow-camera-bottom={-60}
        />
        <directionalLight position={[-20, 30, -20]} intensity={0.4} />
        <hemisphereLight intensity={0.3} color="#87ceeb" groundColor="#362907" />

        {/* Environment for reflections */}
        <Environment preset="apartment" />

        {/* Improved grid with labels */}
        <Grid
          position={[0, -0.01, 0]}
          args={[100, 100]}
          cellSize={1}
          cellThickness={0.6}
          cellColor="#888888"
          sectionSize={5}
          sectionThickness={1.5}
          sectionColor="#3b82f6"
          fadeDistance={100}
          fadeStrength={1}
          infiniteGrid
        />
        <LabeledGrid size={50} divisions={10} />

        {/* Ground plane for shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <shadowMaterial opacity={0.2} />
        </mesh>

        {/* Axis helper at origin */}
        <AxisHelper size={5} />

        {/* Scale reference with human figure */}
        <ScaleReference position={[-10, 0, -10]} />

        {/* Floor level indicator */}
        <FloorIndicator
          floors={floors.map(f => ({ id: f.id, name: f.name, level: f.level }))}
          selectedFloorId={selectedFloorId}
          ceilingHeight={threeDSettings.ceilingHeight}
          floorSpacing={threeDSettings.floorSpacing}
        />

        {/* 3D Floor Plan */}
        <Suspense fallback={<LoadingFallback />}>
          <FloorPlan3D
            floors={floors}
            breakers={breakers}
            selectedFloorId={selectedFloorId}
            showAllFloors={threeDSettings.showAllFloors}
            floorSpacing={threeDSettings.floorSpacing}
            ceilingHeight={threeDSettings.ceilingHeight}
          />
        </Suspense>
      </Canvas>

      {/* Overlay controls */}
      <Controls3DOverlay
        onResetView={handleResetView}
        onMoveCamera={handleMoveCamera}
        onZoom={handleZoom}
        cameraPosition={cameraPosition}
      />
    </div>
  );
}

export default ThreeCanvas;
