'use client';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface CameraControls3DProps {
  target?: [number, number, number];
  onCameraChange?: (position: THREE.Vector3, target: THREE.Vector3) => void;
}

// Keys currently pressed
const keysPressed = new Set<string>();

export function CameraControls3D({ target = [0, 4, 0], onCameraChange }: CameraControls3DProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // Movement speed
  const moveSpeed = 0.5;
  const rotateSpeed = 0.02;

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      keysPressed.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysPressed.clear();
    };
  }, []);

  // Update camera position each frame based on keys pressed
  useFrame(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;
    let moved = false;

    // Get camera direction vectors
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    camera.getWorldDirection(forward);
    forward.y = 0; // Keep movement horizontal
    forward.normalize();
    right.crossVectors(forward, up).normalize();

    // WASD for horizontal movement
    if (keysPressed.has('w')) {
      camera.position.addScaledVector(forward, moveSpeed);
      controls.target.addScaledVector(forward, moveSpeed);
      moved = true;
    }
    if (keysPressed.has('s')) {
      camera.position.addScaledVector(forward, -moveSpeed);
      controls.target.addScaledVector(forward, -moveSpeed);
      moved = true;
    }
    if (keysPressed.has('a')) {
      camera.position.addScaledVector(right, -moveSpeed);
      controls.target.addScaledVector(right, -moveSpeed);
      moved = true;
    }
    if (keysPressed.has('d')) {
      camera.position.addScaledVector(right, moveSpeed);
      controls.target.addScaledVector(right, moveSpeed);
      moved = true;
    }

    // Q/E for vertical movement
    if (keysPressed.has('q')) {
      camera.position.y -= moveSpeed;
      controls.target.y -= moveSpeed;
      moved = true;
    }
    if (keysPressed.has('e')) {
      camera.position.y += moveSpeed;
      controls.target.y += moveSpeed;
      moved = true;
    }

    // Arrow keys for rotation
    if (keysPressed.has('arrowleft')) {
      const angle = rotateSpeed;
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      offset.applyAxisAngle(up, angle);
      camera.position.copy(controls.target).add(offset);
      moved = true;
    }
    if (keysPressed.has('arrowright')) {
      const angle = -rotateSpeed;
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      offset.applyAxisAngle(up, angle);
      camera.position.copy(controls.target).add(offset);
      moved = true;
    }

    // Report camera changes
    if (moved && onCameraChange) {
      onCameraChange(camera.position.clone(), controls.target.clone());
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      minDistance={3}
      maxDistance={200}
      maxPolarAngle={Math.PI / 2 - 0.02}
      target={target}
      panSpeed={1.5}
      rotateSpeed={0.8}
      zoomSpeed={1.2}
    />
  );
}

export default CameraControls3D;
