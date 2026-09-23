import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useWorldStore, ZONE_CAMERA_PRESETS } from '../../store/worldStore';
import { getPartById } from '../../data/vehicleParts';
import {
  notifyCameraOrbitStart,
  notifyCameraOrbitEnd,
} from './GlobalInteractionManager';

export const GarageCamera: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const selectedZone = useWorldStore((state) => state.selectedZone);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const selectedVehiclePartId = useWorldStore(
    (state) => state.selectedVehiclePartId
  );
  const vehicleCoOwnershipMode = useWorldStore(
    (state) => state.vehicleCoOwnershipMode
  );

  const targetLookAt = useRef(
    new THREE.Vector3(...ZONE_CAMERA_PRESETS.OVERVIEW.target)
  );
  const targetCamPos = useRef<THREE.Vector3 | null>(null);
  const isTransitioning = useRef(false);

  useEffect(() => {
    let preset = ZONE_CAMERA_PRESETS.OVERVIEW;

    if (vehicleCoOwnershipMode) {
      preset = ZONE_CAMERA_PRESETS.VEHICLE_CO_OWNERSHIP;
    } else if (selectedVehiclePartId) {
      const partConfig = getPartById(selectedVehiclePartId);
      if (partConfig) {
        preset = partConfig.cameraPreset;
      } else {
        preset = ZONE_CAMERA_PRESETS.VEHICLE_FOCUS;
      }
    } else if (selectedVehicleId) {
      preset = ZONE_CAMERA_PRESETS.VEHICLE_FOCUS;
    } else if (selectedZone) {
      preset = ZONE_CAMERA_PRESETS[selectedZone];
    }

    targetLookAt.current.set(...preset.target);
    targetCamPos.current = new THREE.Vector3(...preset.position);
    isTransitioning.current = true;
  }, [selectedZone, selectedVehicleId, selectedVehiclePartId, vehicleCoOwnershipMode]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isTransitioning.current && targetCamPos.current) {
      // Smoothly glide controls target
      controlsRef.current.target.lerp(targetLookAt.current, delta * 3.5);

      // Smoothly glide camera position towards preset
      camera.position.lerp(targetCamPos.current, delta * 3.0);

      // When close enough, end transition to yield full orbit control to user
      if (camera.position.distanceTo(targetCamPos.current) < 0.2) {
        isTransitioning.current = false;
        targetCamPos.current = null;
      }
    }

    controlsRef.current.update();
  });

  return (
    <DreiOrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={2.5}
      maxDistance={28}
      // Strictly prevent camera from passing below the garage floor
      maxPolarAngle={Math.PI / 2 - 0.05}
      minPolarAngle={0.1}
      onStart={notifyCameraOrbitStart}
      onEnd={notifyCameraOrbitEnd}
    />
  );
};
