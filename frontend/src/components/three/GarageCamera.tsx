import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useWorldStore, getZoneCameraPreset } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { getPartById } from '../../data/vehicleParts';
import {
  resolveActiveCameraPresetKey,
  getVehicleCameraPreset,
  VehicleCameraPreset,
} from '../../config/vehicleCameraPresets';
import { getGarageZoneCameraPreset } from '../../config/garageCameraConfig';
import {
  notifyCameraOrbitStart,
  notifyCameraOrbitEnd,
  globalInteractionState,
} from './GlobalInteractionManager';

export const GarageCamera: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();

  const user = useAuthStore((state) => state.user);
  const role = user?.role;

  const selectedZone = useWorldStore((state) => state.selectedZone);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const selectedVehiclePartId = useWorldStore(
    (state) => state.selectedVehiclePartId
  );
  const vehicleCoOwnershipMode = useWorldStore(
    (state) => state.vehicleCoOwnershipMode
  );
  const vehicleBookingMode = useWorldStore((state) => state.vehicleBookingMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);
  const vehicleReceiptReviewMode = useWorldStore((state) => state.vehicleReceiptReviewMode);
  const vehicleTripStartMode = useWorldStore((state) => state.vehicleTripStartMode);
  const vehicleTripVisualizationMode = useWorldStore((state) => state.vehicleTripVisualizationMode);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);

  // Initialize with OVERVIEW camera preset
  const initialPreset = getVehicleCameraPreset('OVERVIEW', role, size.width);
  const targetLookAt = useRef(new THREE.Vector3(...initialPreset.target));
  const targetCamPos = useRef<THREE.Vector3 | null>(null);
  const isTransitioning = useRef(false);

  // Dynamic OrbitControls constraints resolved from active camera preset
  const [controlsLimits, setControlsLimits] = useState<{
    minDistance: number;
    maxDistance: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    enableRotate: boolean;
    enableZoom: boolean;
    enablePan: boolean;
  }>({
    minDistance: initialPreset.minDistance,
    maxDistance: initialPreset.maxDistance,
    minPolarAngle: initialPreset.minPolarAngle,
    maxPolarAngle: initialPreset.maxPolarAngle,
    enableRotate: initialPreset.enableRotate,
    enableZoom: initialPreset.enableZoom,
    enablePan: initialPreset.enablePan,
  });

  useEffect(() => {
    const isVehicleMode =
      selectedVehicleId != null ||
      selectedZone === 'VEHICLE' ||
      selectedVehiclePartId != null ||
      vehicleCoOwnershipMode ||
      vehicleBookingMode ||
      vehicleHandoverMode ||
      vehicleReceiptReviewMode ||
      vehicleTripStartMode ||
      vehicleTripVisualizationMode ||
      vehicleDamageMappingMode ||
      vehicleInspectionMode;

    let preset: VehicleCameraPreset;

    if (selectedZone && selectedZone !== 'VEHICLE' && !isVehicleMode) {
      // Non-vehicle showroom zone (e.g. Charging, Finance, Maintenance, AI)
      const zoneConfig = getGarageZoneCameraPreset(selectedZone, role, size.width);
      preset = {
        target: zoneConfig.target,
        position: zoneConfig.position,
        minDistance: zoneConfig.minDistance,
        maxDistance: zoneConfig.maxDistance,
        minPolarAngle: zoneConfig.minPolarAngle,
        maxPolarAngle: zoneConfig.maxPolarAngle,
        enableRotate: zoneConfig.enableRotate,
        enableZoom: zoneConfig.enableZoom,
        enablePan: zoneConfig.enablePan,
        panelSide: zoneConfig.panelSide,
        panelOffsetX: zoneConfig.horizontalOffset,
        transitionDuration: zoneConfig.transitionDuration,
      };
    } else if (isVehicleMode) {
      // Resolve active vehicle mode preset key
      const presetKey = resolveActiveCameraPresetKey({
        selectedZone,
        selectedVehicleId,
        selectedVehiclePartId,
        vehicleCoOwnershipMode,
        vehicleBookingMode,
        vehicleHandoverMode,
        vehicleReceiptReviewMode,
        vehicleTripStartMode,
        vehicleTripVisualizationMode,
        vehicleDamageMappingMode,
        vehicleInspectionMode,
      });

      preset = getVehicleCameraPreset(presetKey, role, size.width);

      // Part inspection micro-calibration
      if (selectedVehiclePartId) {
        const partConfig = getPartById(selectedVehiclePartId);
        if (partConfig) {
          const isCoOwner = !role || role === 'CO_OWNER';
          const offset = isCoOwner ? [1.5, 0, 0.3] : [1.5, 0, -1.0];
          preset.target = [
            partConfig.cameraPreset.target[0] + offset[0],
            partConfig.cameraPreset.target[1],
            partConfig.cameraPreset.target[2] + offset[2],
          ];
          preset.position = [
            partConfig.cameraPreset.position[0] + offset[0],
            partConfig.cameraPreset.position[1],
            partConfig.cameraPreset.position[2] + offset[2],
          ];
        }
      }
    } else {
      // Default Garage Overview
      preset = getVehicleCameraPreset('OVERVIEW', role, size.width);
    }

    targetLookAt.current.set(...preset.target);
    targetCamPos.current = new THREE.Vector3(...preset.position);
    isTransitioning.current = true;

    // Synchronize control constraints
    setControlsLimits({
      minDistance: preset.minDistance,
      maxDistance: preset.maxDistance,
      minPolarAngle: preset.minPolarAngle,
      maxPolarAngle: preset.maxPolarAngle,
      enableRotate: preset.enableRotate,
      enableZoom: preset.enableZoom,
      enablePan: preset.enablePan,
    });

    if (controlsRef.current) {
      controlsRef.current.minDistance = preset.minDistance;
      controlsRef.current.maxDistance = preset.maxDistance;
      controlsRef.current.minPolarAngle = preset.minPolarAngle;
      controlsRef.current.maxPolarAngle = preset.maxPolarAngle;
      controlsRef.current.enableRotate = preset.enableRotate;
      controlsRef.current.enableZoom = preset.enableZoom;
      controlsRef.current.enablePan = preset.enablePan;
    }
  }, [
    selectedZone,
    selectedVehicleId,
    selectedVehiclePartId,
    vehicleCoOwnershipMode,
    vehicleBookingMode,
    vehicleHandoverMode,
    vehicleReceiptReviewMode,
    vehicleTripStartMode,
    vehicleTripVisualizationMode,
    vehicleDamageMappingMode,
    vehicleInspectionMode,
    role,
    size.width,
  ]);

  // Register orbitControls instance in globalInteractionState for zero-latency direct pausing
  useEffect(() => {
    globalInteractionState.orbitControls = controlsRef.current;
    return () => {
      globalInteractionState.orbitControls = null;
    };
  }, []);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    // Dynamically pause OrbitControls when pointer is interacting or dragging on EV01
    const shouldControlsBeEnabled =
      !globalInteractionState.isVehicleDragging &&
      !globalInteractionState.isVehicleInteracting;
    if (controlsRef.current.enabled !== shouldControlsBeEnabled) {
      controlsRef.current.enabled = shouldControlsBeEnabled;
    }

    if (isTransitioning.current && targetCamPos.current) {
      // Smoothly glide controls target towards vehicle preset target
      controlsRef.current.target.lerp(targetLookAt.current, delta * 3.8);

      // Smoothly glide camera position towards vehicle preset position
      camera.position.lerp(targetCamPos.current, delta * 3.4);

      // When close enough, end transition to yield full orbit control to user
      if (
        camera.position.distanceTo(targetCamPos.current) < 0.15 &&
        controlsRef.current.target.distanceTo(targetLookAt.current) < 0.1
      ) {
        controlsRef.current.target.copy(targetLookAt.current);
        camera.position.copy(targetCamPos.current);
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
      minDistance={controlsLimits.minDistance}
      maxDistance={controlsLimits.maxDistance}
      minPolarAngle={controlsLimits.minPolarAngle}
      maxPolarAngle={controlsLimits.maxPolarAngle}
      enableRotate={controlsLimits.enableRotate}
      enableZoom={controlsLimits.enableZoom}
      enablePan={controlsLimits.enablePan}
      // Full 360-degree horizontal rotation without clamp
      minAzimuthAngle={-Infinity}
      maxAzimuthAngle={Infinity}
      onStart={() => {
        // If vehicle direct rotation is active, ignore OrbitControls
        if (
          globalInteractionState.isVehicleInteracting ||
          globalInteractionState.isVehicleDragging
        ) {
          return;
        }
        // Yield active camera glide immediately so user has direct, responsive orbit control
        isTransitioning.current = false;
        targetCamPos.current = null;
        notifyCameraOrbitStart();
      }}
      onEnd={notifyCameraOrbitEnd}
    />
  );
};
