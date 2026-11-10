import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useQuery } from '@tanstack/react-query';
import { useWorldStore, getZoneCameraPreset } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { getPartById, resolveDamagePosition } from '../../data/vehicleParts';
import {
  resolveActiveCameraPresetKey,
  getVehicleCameraPreset,
  getVehiclePartInspectionPreset,
  VehicleCameraPreset,
} from '../../config/vehicleCameraPresets';
import { getGarageZoneCameraPreset } from '../../config/garageCameraConfig';
import { fetchVehicles } from '../../services/vehicleApi';
import { fetchVehicleDamages } from '../../services/damageApi';
import { resolveVehicleCode } from './vehicles/vehicleModelConfig';
import { DamageRecordResponse } from '../../types/damage';
import { VehicleResponse } from '../../types/vehicle';
import {
  notifyCameraOrbitStart,
  notifyCameraOrbitEnd,
  globalInteractionState,
} from './globalInteractionState';

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
  const selectedVehiclePartCode = useWorldStore(
    (state) => state.selectedVehiclePartCode
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
  const vehicleDamageHistoryMode = useWorldStore((state) => state.vehicleDamageHistoryMode);
  const vehicleMaintenanceMode = useWorldStore((state) => state.vehicleMaintenanceMode);
  const vehicleBatteryXrayMode = useWorldStore((state) => state.vehicleBatteryXrayMode);
  const vehicleChargingMode = useWorldStore((state) => state.vehicleChargingMode);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const isExplorationMode = useWorldStore((state) => state.isExplorationMode);
  const selectedHandoverCheckpoint = useWorldStore((state) => state.selectedHandoverCheckpoint);
  const draftDamage = useWorldStore((state) => state.draftDamage);
  const selectedDamageId = useWorldStore((state) => state.selectedDamageId);
  const isDamageDetailModalOpen = useWorldStore((state) => state.isDamageDetailModalOpen);
  const isVehicleDetailOpen = useWorldStore((state) => state.isVehicleDetailOpen);
  // Only subscribe to dynamic turntable yaw updates when inspecting a specific vehicle part or checkpoint
  const vehicleYaw = useWorldStore((state) =>
    state.selectedVehiclePartCode || state.selectedVehiclePartId || state.selectedHandoverCheckpoint
      ? state.vehicleYaw
      : 0
  );

  // TanStack Query: Read cached vehicles and damages to resolve vehicle code and damage coordinates
  const { data: vehicles = [] } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
  });
  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const resolvedVehicleCode = resolveVehicleCode(currentVehicle || selectedVehicleId);

  const isDamageRelatedMode =
    vehicleDamageMappingMode ||
    vehicleDamageHistoryMode ||
    vehicleMaintenanceMode ||
    vehicleInspectionMode ||
    isDamageDetailModalOpen ||
    selectedDamageId != null;

  const { data: damages = [] } = useQuery<DamageRecordResponse[]>({
    queryKey: ['vehicleDamages', selectedVehicleId],
    queryFn: () => (selectedVehicleId ? fetchVehicleDamages(selectedVehicleId) : Promise.resolve([])),
    enabled: !!selectedVehicleId && isDamageRelatedMode,
  });

  const selectedDamageRecord = React.useMemo(() => {
    if (!selectedDamageId) return null;
    return damages.find((d) => d.id === selectedDamageId) || null;
  }, [damages, selectedDamageId]);

  const activeDamagePoint = React.useMemo((): [number, number, number] | null => {
    if (draftDamage?.localPosition) {
      return draftDamage.localPosition;
    }
    if (selectedDamageRecord) {
      return resolveDamagePosition(
        selectedDamageRecord,
        resolvedVehicleCode === 'EV02' ? 'EV02' : 'EV01'
      );
    }
    return null;
  }, [
    draftDamage?.localPosition,
    selectedDamageRecord,
    resolvedVehicleCode,
  ]);

  const clearVehiclePartSelection = useWorldStore((state) => state.clearVehiclePartSelection);

  const activePartCode =
    isExplorationMode ||
    vehicleDamageMappingMode ||
    vehicleDamageHistoryMode ||
    isDamageDetailModalOpen ||
    selectedDamageId != null ||
    vehicleMaintenanceMode ||
    vehicleInspectionMode
      ? selectedVehiclePartCode ||
        selectedVehiclePartId ||
        draftDamage?.partCode ||
        selectedDamageRecord?.vehiclePartCode ||
        (activeDamagePoint ? 'BODY' : null)
      : null;

  // Initialize with OVERVIEW camera preset
  const initialPreset = getVehicleCameraPreset('OVERVIEW', role, size.width);
  const targetLookAt = useRef(new THREE.Vector3(...initialPreset.target));
  const targetCamPos = useRef<THREE.Vector3 | null>(null);
  const isTransitioning = useRef(false);
  const lastPresetSignatureRef = useRef<string>('');
  const activeModeKeyRef = useRef<string>('');
  const isInitializedRef = useRef(false);

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

  // Synchronous mount-time camera initialization to guarantee canonical overview before first render
  useLayoutEffect(() => {
    camera.position.set(...initialPreset.position);
    camera.lookAt(...initialPreset.target);
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const pCam = camera as THREE.PerspectiveCamera;
      pCam.fov = initialPreset.fov ?? 40;
      pCam.updateProjectionMatrix();
    }

    if (controlsRef.current) {
      controlsRef.current.target.set(...initialPreset.target);
      controlsRef.current.update();
    }

    targetLookAt.current.set(...initialPreset.target);
    targetCamPos.current = null;
    isTransitioning.current = false;
    lastPresetSignatureRef.current = `${initialPreset.target.join(',')}|${initialPreset.position.join(',')}|${initialPreset.fov ?? 40}`;
    activeModeKeyRef.current = `${role || 'CO_OWNER'}_OVERVIEW`;
    isInitializedRef.current = true;
  }, []);

  useEffect(() => {
    const isVehicleMode =
      selectedVehicleId != null ||
      selectedZone === 'VEHICLE' ||
      activePartCode != null ||
      activeDamagePoint != null ||
      isDamageDetailModalOpen ||
      selectedDamageId != null ||
      vehicleCoOwnershipMode ||
      vehicleBookingMode ||
      vehicleHandoverMode ||
      vehicleReceiptReviewMode ||
      vehicleTripStartMode ||
      vehicleTripVisualizationMode ||
      vehicleDamageMappingMode ||
      vehicleDamageHistoryMode ||
      vehicleMaintenanceMode ||
      vehicleBatteryXrayMode ||
      vehicleChargingMode ||
      vehicleInspectionMode ||
      isExplorationMode;

    let preset: VehicleCameraPreset;
    const isOperations = role === 'STAFF' || role === 'ADMIN';

    let activePresetKey = 'OVERVIEW';

    if (!isOperations && selectedZone && selectedZone !== 'VEHICLE' && !isVehicleMode) {
      // Non-vehicle showroom zone (e.g. Charging, Finance, Maintenance, AI) for CO_OWNER only
      activePresetKey = `ZONE_${selectedZone}`;
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
        selectedVehiclePartId: activePartCode,
        selectedVehiclePartCode: activePartCode,
        selectedDamageId,
        isDamageDetailModalOpen,
        vehicleCoOwnershipMode,
        vehicleBookingMode,
        vehicleHandoverMode,
        vehicleReceiptReviewMode,
        vehicleTripStartMode,
        vehicleTripVisualizationMode,
        vehicleDamageMappingMode,
        vehicleDamageHistoryMode,
        vehicleMaintenanceMode,
        vehicleBatteryXrayMode,
        vehicleChargingMode,
        vehicleInspectionMode,
        isExplorationMode,
        isVehicleDetailOpen,
      });
      activePresetKey = presetKey;

      if (
        (presetKey === 'VEHICLE_PART_INSPECTION' ||
          isExplorationMode ||
          vehicleDamageMappingMode ||
          vehicleDamageHistoryMode ||
          vehicleMaintenanceMode ||
          vehicleInspectionMode ||
          isDamageDetailModalOpen ||
          selectedDamageId != null ||
          activeDamagePoint != null) &&
        activePartCode
      ) {
        preset = getVehiclePartInspectionPreset(
          activePartCode,
          role,
          size.width,
          activeDamagePoint,
          vehicleYaw,
          resolvedVehicleCode
        );
      } else if (isExplorationMode) {
        // Co-Owner Exploration Overview: centered hero view without lateral panel offset
        preset = getVehicleCameraPreset('VEHICLE_FOCUS', role, size.width, resolvedVehicleCode);
      } else if (
        (vehicleHandoverMode || vehicleReceiptReviewMode) &&
        selectedHandoverCheckpoint
      ) {
        preset = getVehiclePartInspectionPreset(
          selectedHandoverCheckpoint,
          role,
          size.width,
          null,
          vehicleYaw,
          resolvedVehicleCode
        );
      } else {
        preset = getVehicleCameraPreset(presetKey, role, size.width, resolvedVehicleCode);
      }
    } else {
      // Default Garage Overview
      preset = getVehicleCameraPreset('OVERVIEW', role, size.width);
    }

    const currentModeKey = `${role || 'CO_OWNER'}_${activePresetKey}_${selectedVehicleId || ''}_${activePartCode || ''}_${selectedHandoverCheckpoint || ''}_${isVehicleDetailOpen}`;
    const modeChanged = activeModeKeyRef.current !== currentModeKey;
    const nextSignature = `${preset.target.join(',')}|${preset.position.join(',')}|${preset.fov ?? 40}`;

    // Only initiate animated camera transition when the logical mode or target changes
    if (modeChanged && lastPresetSignatureRef.current !== nextSignature) {
      activeModeKeyRef.current = currentModeKey;
      lastPresetSignatureRef.current = nextSignature;
      targetLookAt.current.set(...preset.target);
      targetCamPos.current = new THREE.Vector3(...preset.position);
      isTransitioning.current = true;

      // Synchronize FOV if preset specifies custom FOV
      if (preset.fov && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const pCam = camera as THREE.PerspectiveCamera;
        if (pCam.fov !== preset.fov) {
          pCam.fov = preset.fov;
          pCam.updateProjectionMatrix();
        }
      }
    } else if (!modeChanged) {
      // Viewport resize or DevTools dock: update FOV and projection without triggering camera glide
      if (preset.fov && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const pCam = camera as THREE.PerspectiveCamera;
        if (pCam.fov !== preset.fov) {
          pCam.fov = preset.fov;
          pCam.updateProjectionMatrix();
        }
      }
    }

    // Synchronize control constraints (guarded to avoid re-rendering OrbitControls when limits are unchanged)
    setControlsLimits((prev) => {
      if (
        prev.minDistance === preset.minDistance &&
        prev.maxDistance === preset.maxDistance &&
        prev.minPolarAngle === preset.minPolarAngle &&
        prev.maxPolarAngle === preset.maxPolarAngle &&
        prev.enableRotate === preset.enableRotate &&
        prev.enableZoom === preset.enableZoom &&
        prev.enablePan === preset.enablePan
      ) {
        return prev;
      }
      return {
        minDistance: preset.minDistance,
        maxDistance: preset.maxDistance,
        minPolarAngle: preset.minPolarAngle,
        maxPolarAngle: preset.maxPolarAngle,
        enableRotate: preset.enableRotate,
        enableZoom: preset.enableZoom,
        enablePan: preset.enablePan,
      };
    });

    if (controlsRef.current) {
      controlsRef.current.minDistance = preset.minDistance;
      controlsRef.current.maxDistance = preset.maxDistance;
      controlsRef.current.minPolarAngle = Math.max(0.35, preset.minPolarAngle);
      controlsRef.current.maxPolarAngle = Math.min(1.42, preset.maxPolarAngle);
      controlsRef.current.enableRotate = preset.enableRotate;
      controlsRef.current.enableZoom = preset.enableZoom;
      controlsRef.current.enablePan = preset.enablePan;
    }
  }, [
    selectedZone,
    selectedVehicleId,
    resolvedVehicleCode,
    activePartCode,
    activeDamagePoint,
    selectedDamageId,
    isDamageDetailModalOpen,
    isVehicleDetailOpen,
    selectedHandoverCheckpoint,
    vehicleCoOwnershipMode,
    vehicleBookingMode,
    vehicleHandoverMode,
    vehicleReceiptReviewMode,
    vehicleTripStartMode,
    vehicleTripVisualizationMode,
    vehicleDamageMappingMode,
    vehicleDamageHistoryMode,
    vehicleMaintenanceMode,
    vehicleBatteryXrayMode,
    vehicleChargingMode,
    vehicleInspectionMode,
    isExplorationMode,
    vehicleYaw,
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

    // Guard against NaN/Infinity in camera position or controls target
    if (
      isNaN(camera.position.x) ||
      isNaN(camera.position.y) ||
      isNaN(camera.position.z) ||
      isNaN(controlsRef.current.target.x) ||
      isNaN(controlsRef.current.target.y) ||
      isNaN(controlsRef.current.target.z)
    ) {
      const fallbackPreset = getVehicleCameraPreset('OVERVIEW', role, size.width);
      camera.position.set(...fallbackPreset.position);
      controlsRef.current.target.set(...fallbackPreset.target);
      controlsRef.current.update();
      isTransitioning.current = false;
      targetCamPos.current = null;
      return;
    }

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

      // Floor clearance clamp during transition: never allow camera to dip below floor level
      camera.position.y = Math.max(0.45, camera.position.y);
      controlsRef.current.target.y = Math.max(0.15, controlsRef.current.target.y);

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

    // Enforce floor clearance after OrbitControls update as well
    if (camera.position.y < 0.45) {
      camera.position.y = 0.45;
    }
    if (controlsRef.current.target.y < 0.15) {
      controlsRef.current.target.y = 0.15;
    }
  });

  return (
    <DreiOrbitControls
      ref={controlsRef}
      target={initialPreset.target}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={controlsLimits.minDistance}
      maxDistance={controlsLimits.maxDistance}
      minPolarAngle={Math.max(0.35, controlsLimits.minPolarAngle)}
      maxPolarAngle={Math.min(1.42, controlsLimits.maxPolarAngle)}
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
