'use client';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid } from '@react-three/drei';
import { useFloorPlanStore } from '@/stores/floorPlanStore';
import type { FloorWithRooms, Breaker } from '@/types/panel';
import { FloorPlan3D } from './FloorPlan3D';

// Camera preset positions
const CAMERA_PRESETS = {
  isometric: { position: [40, 30, 40] as [number, number, number], fov: 50 },
  top: { position: [0, 60, 0] as [number, number, number], fov: 45 },
  front: { position: [0, 15, 50] as [number, number, number], fov: 50 },
  side: { position: [50, 15, 0] as [number, number, number], fov: 50 },
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

export function ThreeCanvas({ floors, breakers, selectedFloorId }: ThreeCanvasProps) {
  const { threeDSettings } = useFloorPlanStore();
  const controlsRef = useRef(null);

  const cameraConfig = CAMERA_PRESETS[threeDSettings.cameraPreset];

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={cameraConfig.position}
          fov={cameraConfig.fov}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[20, 40, 20]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={100}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        <directionalLight position={[-10, 20, -10]} intensity={0.3} />

        {/* Environment for reflections */}
        <Environment preset="apartment" />

        {/* Grid helper on ground */}
        <Grid
          position={[0, -0.01, 0]}
          args={[100, 100]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6e6e6e"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#9d4b4b"
          fadeDistance={80}
          fadeStrength={1}
          infiniteGrid
        />

        {/* Ground plane for shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <shadowMaterial opacity={0.15} />
        </mesh>

        {/* Camera controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan
          enableZoom
          enableRotate
          minDistance={5}
          maxDistance={150}
          maxPolarAngle={Math.PI / 2 - 0.05} // Prevent going below ground
          target={[0, 4, 0]}
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
    </div>
  );
}

export default ThreeCanvas;
