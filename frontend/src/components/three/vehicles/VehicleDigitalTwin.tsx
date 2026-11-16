import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../../services/queryClient';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore, VEHICLE_STATUS_LABELS, GarageZone } from '../../../store/worldStore';
import { fetchVehicles } from '../../../services/vehicleApi';
import { VehicleResponse, VehicleStatus } from '../../../types/vehicle';
import { TripData } from '../../../types/trip';
import { fetchActiveTripForVehicle } from '../../../services/tripApi';
import { isValidUuid } from '../../../utils/formatUtils';
import { VehicleModel } from './VehicleModel';
import { VehicleInteractionHitboxes } from './VehicleInteractionHitboxes';
import {
  getVehicleModelUrl,
  resolveVehicleCode,
  sortStaffFleetVehicles,
  resolveAuthoritativeHeroVehicle,
  isMatchingVehicle,
  resolveVehicleDisplayName,
  resolveAuthoritativeVehicleColor,
  VEHICLE_MODEL_CONFIGS,
} from './vehicleModelConfig';
import { StaffVehicleControlLayer } from './StaffVehicleControlLayer';
import { resolveVehicleSlot, GarageSlotDef, DEFAULT_GARAGE_SLOT } from '../../../config/garageSlotConfig';
import { STAFF_GARAGE_LAYOUT } from '../../../config/staffGarageLayout';
import { FleetPreviewRow3D } from '../../fleet/FleetPreviewRow3D';
import { VehicleStatusLabel } from './VehicleStatusLabel';
import { VehicleSelectionEffect } from './VehicleSelectionEffect';
import { VehicleInspectionGuide } from './VehicleInspectionGuide';
import { VehicleHotspotLayer, CoOwnerVehicleExploration3D } from './VehicleHotspotLayer';
import { StaffVehicleInspectionHotspotLayer } from './StaffVehicleInspectionHotspotLayer';
import { SpatialDataLink } from '../SpatialDataLink';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';
import { VehicleCoOwnershipWorld } from '../ownership/VehicleCoOwnershipWorld';
import { VehicleBookingWorld } from '../booking/VehicleBookingWorld';
import { VehicleHandoverWorld } from '../handover/VehicleHandoverWorld';
import { CoOwnerReceiptWorld } from '../handover/CoOwnerReceiptWorld';
import { TripStartWorld } from '../trip/TripStartWorld';
import { TripVisualizationWorld } from '../trip/TripVisualizationWorld';
import { VehicleDamageWorld } from '../damage/VehicleDamageWorld';
import { VehicleDamageHistoryWorld } from '../damage/VehicleDamageHistoryWorld';
import { fetchVehicleDamages } from '../../../services/damageApi';
import { fetchActiveInspection } from '../../../services/inspectionApi';
import { BatteryPack3D } from '../battery/BatteryPack3D';
import { ChargingPortVisual3D } from '../charging/ChargingPortVisual3D';
import { fetchVehicleBatteryHealth } from '../../../services/batteryApi';
import { BatteryHealthResponse } from '../../../types/battery';
import { getPartById } from '../../../data/vehicleParts';
import { CoOwnerVehiclePanel } from './CoOwnerVehiclePanel';
import { StaffOperationsPanel } from './StaffOperationsPanel';
import { AdminVehicleMonitorPanel } from './AdminVehicleMonitorPanel';
import { shouldShowVehicleStatusLabel } from '../../../config/garageZoneVisibility';
import {
  Car,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Zap,
  Gauge,
  ShieldCheck,
} from 'lucide-react';
import { VEHICLE_INTERACTION_CONFIG } from '../../../config/interactionConfig';
import {
  globalInteractionState,
  notifyVehiclePointerDown,
  notifyVehiclePointerUp,
  notifyVehicleDragStart,
  notifyVehicleDragEnd,
  isRecentDragInteraction,
} from '../globalInteractionState';

export interface VehicleDigitalTwinProps {
  renderPanel?: (vehicle: VehicleResponse, onClose: () => void) => React.ReactNode;
}

/**
 * Dedicated Architectural Display Platform for Vehicle Bays (Non-Hero Slots)
 * Provides individual luxury pad geometry with zone-specific accent styling.
 */
const VehicleBayPlatformPad: React.FC<{
  vehicleSlot?: GarageSlotDef;
  slot?: GarageSlotDef;
  isSelected: boolean;
  isHovered: boolean;
}> = React.memo(({ vehicleSlot: propVehicleSlot, slot: propSlot, isSelected, isHovered }) => {
  const activeSlot = propVehicleSlot || propSlot || DEFAULT_GARAGE_SLOT;
  const accent = isSelected ? '#f59e0b' : activeSlot.accentColor || '#38bdf8';
  return (
    <group position={[0, -0.14, 0]}>
      {/* Base Stepped Turntable Pad */}
      <mesh position={[0, 0.035, 0]} receiveShadow raycast={() => null}>
        <cylinderGeometry args={[2.15, 2.22, 0.07, 48]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.25} />
      </mesh>

      {/* Outer Polished Aluminum Bevel Rim */}
      <mesh position={[0, 0.072, 0]} raycast={() => null}>
        <cylinderGeometry args={[2.12, 2.18, 0.015, 48]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Outer Recessed Thin Emissive Neon Ring */}
      <mesh position={[0, 0.076, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[2.02, 2.12, 48]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.65}
        />
      </mesh>

      {/* Middle Elevated Stepped Tier */}
      <mesh position={[0, 0.09, 0]} receiveShadow raycast={() => null}>
        <cylinderGeometry args={[1.92, 2.02, 0.035, 48]} />
        <meshStandardMaterial color="#eef2f6" roughness={0.22} metalness={0.25} />
      </mesh>

      {/* Inner Recessed Thin Emissive LED Ring */}
      <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[1.72, 1.80, 48]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Top Glossy Vehicle Turntable Surface */}
      <mesh position={[0, 0.114, 0]} receiveShadow raycast={() => null}>
        <cylinderGeometry args={[1.72, 1.72, 0.012, 48]} />
        <meshStandardMaterial color="#ffffff" roughness={0.16} metalness={0.22} />
      </mesh>
    </group>
  );
});

interface VehicleBayProps {
  vehicle: VehicleResponse;
  vehicleCode: string;
  vehicleSlot?: GarageSlotDef;
  slot?: GarageSlotDef;
  position?: [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
  isAnyVehicleSelected?: boolean;
  isCoOwner: boolean;
  role: string;
  isBusinessModeActive: boolean;
  selectedZone: GarageZone | null;
  selectedVehicleId: string | null;
  isVehicleSelected: boolean;
  vehicleBookingMode: boolean;
  vehicleCoOwnershipMode: boolean;
  vehicleHandoverMode: boolean;
  vehicleReceiptReviewMode: boolean;
  vehicleTripStartMode: boolean;
  vehicleTripVisualizationMode: boolean;
  vehicleDamageMappingMode: boolean;
  vehicleDamageHistoryMode?: boolean;
  vehicleMaintenanceMode?: boolean;
  vehicleInspectionMode: boolean;
  selectedVehiclePartId: string | null;
  renderPanel?: (vehicle: VehicleResponse, onClose: () => void) => React.ReactNode;
  onSelect: (vehicle: VehicleResponse) => void;
  onHover: (code: string | null) => void;
  onClearSelection: () => void;
}

const VehicleBayComponent: React.FC<VehicleBayProps> = ({
  vehicle,
  vehicleCode,
  vehicleSlot: propVehicleSlot,
  slot: propSlot,
  position: propPosition,
  isSelected,
  isHovered,
  isAnyVehicleSelected: propIsAnyVehicleSelected,
  isCoOwner,
  role,
  isBusinessModeActive,
  selectedZone,
  selectedVehicleId,
  isVehicleSelected,
  vehicleBookingMode,
  vehicleCoOwnershipMode,
  vehicleHandoverMode,
  vehicleReceiptReviewMode,
  vehicleTripStartMode,
  vehicleTripVisualizationMode,
  vehicleDamageMappingMode,
  vehicleDamageHistoryMode,
  vehicleMaintenanceMode,
  vehicleInspectionMode,
  selectedVehiclePartId,
  renderPanel,
  onSelect,
  onHover,
  onClearSelection,
}) => {
  const [isLocalHovered, setIsLocalHovered] = React.useState(false);
  const effectiveHovered = isLocalHovered || isHovered;
  // Authoritative derivation of fleet-wide selection state
  const isAnyVehicleSelected =
    propIsAnyVehicleSelected ?? Boolean(selectedVehicleId);

  const isDeEmphasized = isAnyVehicleSelected && !isSelected;

  // Authoritative slot resolver with deterministic fallback
  const vehicleSlot = useMemo(() => {
    const candidateSlot = propVehicleSlot || propSlot;
    if (candidateSlot) return candidateSlot;
    try {
      const resolved = resolveVehicleSlot(vehicle, role);
      if (resolved) return resolved;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn(`[VehicleBay] Failed to resolve slot for vehicle ${vehicle?.id || vehicleCode}:`, err);
      }
    }
    return DEFAULT_GARAGE_SLOT;
  }, [propVehicleSlot, propSlot, vehicle, role, vehicleCode]);

  const effectivePosition: [number, number, number] = propPosition || vehicleSlot.position;

  const vehicleMode = useWorldStore((state) => state.vehicleMode);
  const vehicleBatteryXrayMode = useWorldStore((state) => state.vehicleBatteryXrayMode);
  const vehicleYaw = useWorldStore((state) => state.vehicleYaw);
  const setVehicleYaw = useWorldStore((state) => state.setVehicleYaw);
  const visibleVehicleLabelId = useWorldStore((state) => state.visibleVehicleLabelId);
  const isRegistrationReviewModalOpen = useWorldStore((state) => state.isRegistrationReviewModalOpen);
  const isExplorationMode = useWorldStore((state) => state.isExplorationMode);
  const activePrimaryPanel = useWorldStore((state) => state.activePrimaryPanel);
  const isStaffDisputeDashboardOpen = useWorldStore((state) => state.isStaffDisputeDashboardOpen);
  const isStaff = role === 'STAFF';
  const isAdmin = role === 'ADMIN';

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = isAuthenticated && !!accessToken;

  const isApplicationPreview = Boolean((vehicle as any)?.isApplicationPreview);
  const isValidVehicleUuid = vehicle?.id ? isValidUuid(vehicle.id) : false;
  const canQueryVehicleTelemetry = Boolean(authReady && isValidVehicleUuid && !isApplicationPreview);

  // Authoritative query for active trip to ensure floating 3D banner is synchronized with backend operational state
  const { data: activeTrip } = useQuery<TripData | null>({
    queryKey: ['activeTrip', vehicle?.id],
    queryFn: () => (vehicle?.id && isValidVehicleUuid ? fetchActiveTripForVehicle(vehicle.id) : Promise.resolve(null)),
    enabled: Boolean(canQueryVehicleTelemetry && vehicle?.id),
    staleTime: 4000,
    refetchInterval: 4000,
  });

  const isTripActive = Boolean(activeTrip && activeTrip.status === 'ACTIVE');
  const effectiveStatus: VehicleStatus = isTripActive ? 'IN_USE' : vehicle.status;

  const vehicleStatusConfig = useMemo(() => {
    if (isApplicationPreview) {
      return {
        label: 'Hồ sơ chờ duyệt',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.2)',
        border: '#f59e0b',
      };
    }
    if (isTripActive) {
      if (activeTrip?.returnRequestedAt) {
        return {
          label: 'Chờ tiếp nhận',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.16)',
          border: '#f59e0b',
        };
      }
      return {
        label: 'Đang sử dụng',
        color: '#00f2fe',
        bg: 'rgba(0, 242, 254, 0.16)',
        border: '#00f2fe',
      };
    }
    return (
      VEHICLE_STATUS_LABELS[effectiveStatus] || {
        label: 'Sẵn sàng',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.16)',
        border: '#10b981',
      }
    );
  }, [isTripActive, activeTrip?.returnRequestedAt, effectiveStatus, isApplicationPreview]);

  // Authoritative TanStack Query for technical battery health in X-Ray mode
  const { data: batteryHealth } = useQuery<BatteryHealthResponse | null>({
    queryKey: ['vehicleBatteryHealth', vehicle?.id],
    queryFn: () => (vehicle?.id && isValidVehicleUuid ? fetchVehicleBatteryHealth(vehicle.id) : Promise.resolve(null)),
    enabled: Boolean(canQueryVehicleTelemetry && vehicle?.id && isSelected && vehicleBatteryXrayMode),
  });

  // Authoritative query for vehicle damages to display actual technical condition on floating plaque
  const { data: vehicleDamages = [] } = useQuery<any[]>({
    queryKey: ['vehicleDamages', vehicle?.id],
    queryFn: () => (vehicle?.id && isValidVehicleUuid ? fetchVehicleDamages(vehicle.id) : Promise.resolve([])),
    enabled: Boolean(canQueryVehicleTelemetry && isSelected && vehicle?.id),
    staleTime: 10000,
  });

  // Authoritative query for active inspection to observe preliminary findings
  const { data: activeInspection } = useQuery<any>({
    queryKey: ['activeInspection', vehicle?.id],
    queryFn: () => (vehicle?.id && isValidVehicleUuid ? fetchActiveInspection(vehicle.id) : Promise.resolve(null)),
    enabled: Boolean(canQueryVehicleTelemetry && isSelected && vehicle?.id),
    staleTime: 4000,
    refetchInterval: 5000,
  });

  const unresolvedDamagesCount = useMemo(
    () => vehicleDamages.filter((d: any) => d.status !== 'RESOLVED' && d.status !== 'REPAIRED').length,
    [vehicleDamages]
  );

  const preliminaryFindingsCount = useMemo(() => {
    if (!activeInspection?.items || !Array.isArray(activeInspection.items)) return 0;
    return activeInspection.items.filter(
      (item: any) => item.conditionStatus && item.conditionStatus !== 'GOOD'
    ).length;
  }, [activeInspection]);

  const socLevel = vehicle?.currentBatteryLevel != null ? Number(vehicle.currentBatteryLevel) : null;
  const odometerVal = vehicle?.odometer != null ? Number(vehicle.odometer) : null;

  const defaultYaw = isCoOwner
    ? VEHICLE_INTERACTION_CONFIG.defaultCoOwnerYaw
    : VEHICLE_INTERACTION_CONFIG.defaultOperationsYaw;

  const resolvedInitialYaw = vehicleYaw ?? defaultYaw;

  const modelDef = VEHICLE_MODEL_CONFIGS[vehicleCode] || VEHICLE_MODEL_CONFIGS.EV01;
  const proxySize: [number, number, number] = useMemo(
    () => [
      modelDef.dimensions.width * 1.05,
      modelDef.dimensions.height,
      modelDef.dimensions.length,
    ],
    [modelDef]
  );
  const proxyPosition: [number, number, number] = useMemo(
    () => [
      modelDef.offset[0],
      modelDef.dimensions.height / 2,
      modelDef.offset[2],
    ],
    [modelDef]
  );

  const turntableRef = useRef<THREE.Group>(null);
  const targetYaw = useRef(resolvedInitialYaw);
  const currentYaw = useRef(resolvedInitialYaw);
  const isVehicleDraggingRef = useRef(false);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const lastPointerX = useRef(0);

  // Synchronize target yaw when worldStore resets yaw and this vehicle is selected
  useEffect(() => {
    if (isSelected && vehicleYaw !== undefined) {
      targetYaw.current = vehicleYaw;
    }
  }, [isSelected, vehicleYaw]);

  // Smooth 60fps damped turntable rotation around vertical Y axis
  useFrame((_, delta) => {
    if (!turntableRef.current) return;
    currentYaw.current = THREE.MathUtils.damp(
      currentYaw.current,
      targetYaw.current,
      VEHICLE_INTERACTION_CONFIG.rotationDamping,
      delta
    );
    turntableRef.current.rotation.y = currentYaw.current;
  });

  const handleTurntablePointerDown = (e: ThreeEvent<PointerEvent>) => {
    // Only primary left button rotates the vehicle
    if (e.button !== 0) return;
    e.stopPropagation();

    // Immediately pause OrbitControls so camera does not orbit during vehicle drag
    notifyVehiclePointerDown();

    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    lastPointerX.current = e.clientX;
    isVehicleDraggingRef.current = false;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!pointerDownPos.current) return;
      const dx = moveEvent.clientX - pointerDownPos.current.x;
      const dy = moveEvent.clientY - pointerDownPos.current.y;
      const dist = Math.hypot(dx, dy);

      if (dist > VEHICLE_INTERACTION_CONFIG.clickDragThresholdPx) {
        if (!isVehicleDraggingRef.current) {
          isVehicleDraggingRef.current = true;
          notifyVehicleDragStart();
          document.body.style.cursor = 'grabbing';
        }
        const deltaX = moveEvent.clientX - lastPointerX.current;
        targetYaw.current += deltaX * VEHICLE_INTERACTION_CONFIG.rotationSensitivity;
        lastPointerX.current = moveEvent.clientX;
      }
    };

    const handlePointerUp = () => {
      if (isVehicleDraggingRef.current) {
        notifyVehicleDragEnd();
        if (isSelected) {
          setVehicleYaw(targetYaw.current);
        }
      }
      notifyVehiclePointerUp();
      pointerDownPos.current = null;
      document.body.style.cursor = 'auto';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // Prevent accidental selection during camera orbit/drag or vehicle turntable drag
    if (isRecentDragInteraction(e.delta) || isVehicleDraggingRef.current) return;
    if (isBusinessModeActive) return;
    // When a dedicated showroom zone like FINANCE is active, zone presentation owns the screen
    if (selectedZone && selectedZone !== 'VEHICLE') return;
    if ((vehicle as any)?.isApplicationPreview) return;
    e.stopPropagation();
    onSelect(vehicle);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (isBusinessModeActive || (selectedZone && selectedZone !== 'VEHICLE')) return;
    e.stopPropagation();
    setIsLocalHovered(true);
    document.body.style.cursor = 'grab';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (isBusinessModeActive) return;
    e.stopPropagation();
    setIsLocalHovered(false);
    if (!isVehicleDraggingRef.current) {
      document.body.style.cursor = 'auto';
    }
  };

  const selectedPart = getPartById(selectedVehiclePartId);

  const shouldRenderCoOwnerPanel =
    role === 'CO_OWNER' &&
    selectedVehicleId != null &&
    (vehicleMode === 'CO_OWNER_VEHICLE_OVERVIEW' ||
      vehicleMode === 'CO_OWNER_VEHICLE_INFO' ||
      vehicleMode === 'CO_OWNER_MY_BOOKINGS');

  const shouldRenderStaffPanel =
    role === 'STAFF' &&
    selectedVehicleId != null &&
    vehicleMode === 'STAFF_VEHICLE_OVERVIEW';

  const shouldRenderAdminPanel =
    role === 'ADMIN' &&
    selectedVehicleId != null &&
    vehicleMode === 'ADMIN_VEHICLE_OVERVIEW' &&
    !isApplicationPreview;

  const shouldRenderVehicleOverview =
    (shouldRenderCoOwnerPanel ||
      shouldRenderStaffPanel ||
      shouldRenderAdminPanel) &&
    !isBusinessModeActive &&
    !isExplorationMode &&
    !isRegistrationReviewModalOpen &&
    !isStaffDisputeDashboardOpen &&
    activePrimaryPanel !== 'DISPUTE';

  const displayName = resolveVehicleDisplayName(vehicle, vehicleCode);

  return (
    <group position={effectivePosition} name={`${vehicleCode}Bay`}>
      {/* Platform Pad for non-hero slots (EV01 is seated on hero turntable) */}
      {vehicleSlot.id !== 'BAY_READY_01' && (
        <VehicleBayPlatformPad vehicleSlot={vehicleSlot} slot={vehicleSlot} isSelected={isSelected} isHovered={effectiveHovered} />
      )}

      {/* 360-Degree Interactive Vehicle Turntable Group */}
      <group
        ref={turntableRef}
        name={`${vehicleCode}Turntable`}
        rotation={[0, currentYaw.current, 0]}
      >
        {/* Simplified Hitbox Proxy:
            Catches pointer down, drag-rotation, click-selection, and hover effects in O(1) time
            without raycasting through heavy GLTF car meshes.
            Uses vehicle-specific model dimensions and an invisible material with transparent/depthWrite=false. */}
        {!vehicleInspectionMode && !vehicleDamageMappingMode && (
          <mesh
            name={`${vehicleCode}InteractionProxy`}
            position={proxyPosition}
            onPointerDown={handleTurntablePointerDown}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={proxySize} />
            <meshBasicMaterial
              transparent
              opacity={0}
              depthWrite={false}
              colorWrite={false}
            />
          </mesh>
        )}

        {/* Selection & Hover Halo */}
        <VehicleSelectionEffect isSelected={isSelected} isHovered={effectiveHovered} />

        {/* 3D GLB Model (Visual Only) */}
        <Suspense fallback={null}>
          <VehicleModel
            isSelected={isSelected}
            isHovered={effectiveHovered}
            isDeEmphasized={isDeEmphasized}
            isBatteryXray={isSelected && vehicleBatteryXrayMode}
            modelUrl={getVehicleModelUrl(vehicle.model3dUrl, vehicle)}
            exteriorColor={resolveAuthoritativeVehicleColor(vehicle)}
            onSelectVehicle={() => onSelect(vehicle)}
            onPointerDown={handleTurntablePointerDown}
          />
        </Suspense>

        {/* Phase 16: Dedicated 3D X-Ray Battery Pack & High-Voltage System */}
        {isSelected && vehicleBatteryXrayMode && (
          <BatteryPack3D
            vehicleCode={vehicleCode}
            batteryHealth={batteryHealth}
            selected={selectedVehiclePartId === 'BATTERY'}
            xrayEnabled={vehicleBatteryXrayMode}
          />
        )}

        {/* Phase 17: Charging Port Socket & Status LED Ring */}
        <ChargingPortVisual3D
          vehicleCode={vehicleCode}
          isCharging={vehicle.status === 'CHARGING'}
        />

        {/* Semantic Interaction Hitboxes (rotates with car) - Active ONLY during damage mapping or handover */}
        {(vehicleDamageMappingMode || vehicleHandoverMode || vehicleReceiptReviewMode) && (
          <VehicleInteractionHitboxes
            vehicleCode={vehicleCode}
            onSelectVehicle={() => onSelect(vehicle)}
            onPointerDown={handleTurntablePointerDown}
          />
        )}

        {/* CO-OWNER & ADMIN: Direct Interactive 3D Educational Exploration Layer (rotates with car) */}
        {isSelected && (isCoOwner || (isAdmin && !vehicleInspectionMode && !isApplicationPreview)) && !isBusinessModeActive && (
          <CoOwnerVehicleExploration3D
            vehicle={vehicle}
            vehicleCode={vehicleCode as any}
          />
        )}

        {/* STAFF / ADMIN ONLY: Operational 3D Vehicle Component Inspection Points (rotates with car) */}
        {isSelected && !isCoOwner && vehicleInspectionMode && (
          <StaffVehicleInspectionHotspotLayer
            vehicle={vehicle}
            vehicleCode={vehicleCode as any}
          />
        )}
      </group>

      {/* Floating 3D Status Pill Indicator (shown in overview mode for operations, hidden for clean co-owner hero overview) */}
      {!isCoOwner &&
        !isSelected &&
        !vehicleInspectionMode &&
        !vehicleCoOwnershipMode &&
        !(vehicle as any)?.isApplicationPreview &&
        shouldShowVehicleStatusLabel({
          selectedZone,
          selectedVehicleId,
          isVehicleSelected,
          vehicleBookingMode,
          vehicleCoOwnershipMode,
          vehicleHandoverMode,
          vehicleReceiptReviewMode,
          vehicleTripStartMode,
          vehicleTripVisualizationMode,
          vehicleDamageMappingMode,
          vehicleInspectionMode,
          selectedVehiclePartId,
        }) && (
          <VehicleStatusLabel
            id={vehicleCode}
            name={displayName}
            status={effectiveStatus}
            batteryLevel={vehicle.currentBatteryLevel}
            isSelected={isSelected}
            isHovered={isHovered}
          />
        )}

      {/* World-Space Floating Vehicle Identity Plaque (Matches Style 4 Reference Image) */}
      {isCoOwner && isSelected && shouldRenderVehicleOverview && (
        <group position={[-0.45, 2.18, 0.3]}>
          <Billboard follow={true}>
            <Html
              center
              distanceFactor={9.5}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {/* Identity Card */}
                <div
                  style={{
                    background: 'rgba(7, 20, 38, 0.92)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1.5px solid rgba(34, 230, 255, 0.35)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(34, 230, 255, 0.2)',
                    borderRadius: '16px',
                    padding: '8px 14px',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {/* Left Circular Teal Badge */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(0, 224, 199, 0.16)',
                      border: '1.5px solid #00e0c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(0, 224, 199, 0.35)',
                      flexShrink: 0,
                    }}
                  >
                    <Car size={16} color="#00e0c7" />
                  </div>

                  {/* Right Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {/* Primary Heading: Authoritative Vehicle Model / Name */}
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em', lineHeight: 1.2 }}>
                      {displayName}
                    </div>

                    {/* Secondary Line: Vehicle Code | License Plate */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#00e0c7', letterSpacing: '0.04em' }}>
                        {vehicleCode}
                      </span>
                      <span style={{ fontSize: '9px', color: '#64748b' }}>|</span>
                      <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 600 }}>
                        {vehicle.licensePlate || 'Chưa cập nhật biển số'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: vehicleStatusConfig.color,
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: vehicleStatusConfig.color,
                            boxShadow: `0 0 6px ${vehicleStatusConfig.color}`,
                          }}
                        />
                        <span>{vehicleStatusConfig.label}</span>
                      </div>

                      {vehicle.currentBatteryLevel != null && (
                        <>
                          <div style={{ width: '1px', height: '12px', background: 'rgba(34, 230, 255, 0.25)' }} />

                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 800, color: '#22e6ff' }}>
                            <Zap size={11} color="#22e6ff" />
                            <span>{vehicle.currentBatteryLevel}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Downward Pointer Notch */}
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: '7px solid rgba(7, 20, 38, 0.92)',
                    margin: '0 auto',
                    filter: 'drop-shadow(0 2px 2px rgba(34, 230, 255, 0.25))',
                  }}
                />
              </div>
            </Html>
          </Billboard>
        </group>
      )}

      {/* STAFF MODE ONLY: Top-Anchored Consolidated Floating Vehicle Information Panel */}
      {isStaff && isSelected && !vehicleInspectionMode && (
        <group position={[0, 2.95, 0]}>
          <Billboard follow={true}>
            <Html
              center
              distanceFactor={9.8}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              <div
                style={{
                  background: 'rgba(7, 20, 38, 0.94)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(0, 217, 255, 0.5)',
                  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.65), 0 0 25px rgba(0, 217, 255, 0.28)',
                  borderRadius: '16px',
                  padding: '10px 18px',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  minWidth: '340px',
                }}
              >
                {/* Top Row: Icon + Vehicle Identity + Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(0, 217, 255, 0.16)',
                        border: '1.5px solid #00D9FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 10px rgba(0, 217, 255, 0.35)',
                        flexShrink: 0,
                      }}
                    >
                      <Car size={16} color="#00D9FF" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em', lineHeight: 1.2 }}>
                        {displayName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#00D9FF', letterSpacing: '0.04em' }}>
                          {vehicleCode}
                        </span>
                        <span style={{ fontSize: '9px', color: '#64748b' }}>•</span>
                        <span style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 600 }}>
                          {vehicle.licensePlate || '30A-999.83'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: vehicleStatusConfig.color,
                      background: vehicleStatusConfig.bg,
                      padding: '3px 9px',
                      borderRadius: '9999px',
                      border: `1px solid ${vehicleStatusConfig.border}`,
                      letterSpacing: '0.03em',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: vehicleStatusConfig.color,
                        boxShadow: `0 0 6px ${vehicleStatusConfig.color}`,
                      }}
                    />
                    <span>{vehicleStatusConfig.label}</span>
                  </div>
                </div>

                {/* Subtle Divider */}
                <div style={{ height: '1px', background: 'rgba(0, 217, 255, 0.2)', width: '100%' }} />

                {/* Metrics Row: Battery SOC + Odometer + Technical Condition */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.1fr 1fr 1fr',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  {/* 1. Battery SOC & Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontSize: '9.5px', fontWeight: 700 }}>
                        <Zap size={10} color="#00f2fe" />
                        <span>PIN (SOC)</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#00f2fe' }}>
                        {socLevel != null ? `${socLevel}%` : 'Chưa có'}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '3px' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, socLevel ?? 0))}%`,
                          height: '100%',
                          background: (socLevel ?? 0) > 20 ? 'linear-gradient(90deg, #00f2fe, #38bdf8)' : '#ef4444',
                          boxShadow: '0 0 6px #00f2fe',
                        }}
                      />
                    </div>
                  </div>

                  {/* 2. Odometer */}
                  <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.12)', paddingLeft: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '9.5px', fontWeight: 700 }}>
                      <Gauge size={10} color="#38bdf8" />
                      <span>ODOMETER</span>
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                      {odometerVal != null ? (
                        <>
                          {odometerVal.toLocaleString()} <span style={{ fontSize: '9px', color: '#94a3b8' }}>km</span>
                        </>
                      ) : (
                        <span style={{ fontSize: '9.5px', color: '#64748b' }}>Chưa ghi nhận</span>
                      )}
                    </div>
                  </div>

                  {/* 3. Technical Condition */}
                  <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.12)', paddingLeft: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '9.5px', fontWeight: 700 }}>
                      <ShieldCheck size={10} color={unresolvedDamagesCount > 0 ? '#ef4444' : preliminaryFindingsCount > 0 ? '#f59e0b' : '#10b981'} />
                      <span>TÌNH TRẠNG</span>
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: unresolvedDamagesCount > 0 ? '#f87171' : preliminaryFindingsCount > 0 ? '#fbbf24' : '#34d399',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {unresolvedDamagesCount > 0
                        ? `${unresolvedDamagesCount} lỗi hỏng`
                        : preliminaryFindingsCount > 0
                        ? `${preliminaryFindingsCount} lưu ý sơ bộ`
                        : 'Đạt chuẩn (PASS)'}
                    </div>
                  </div>
                </div>
              </div>
            </Html>
          </Billboard>
        </group>
      )}

      {/* Sub-Worlds rendered ONLY for the selected vehicle (Spatial HTML cards only for CO_OWNER) */}
      {isSelected && isCoOwner && (!isBusinessModeActive || vehicleInspectionMode) && (
        <VehicleInspectionGuide vehicle={vehicle} vehicleCode={vehicleCode} />
      )}

      {isSelected && vehicleCoOwnershipMode && (
        <VehicleCoOwnershipWorld vehicle={vehicle} />
      )}

      {isSelected && vehicleBookingMode && (
        <VehicleBookingWorld vehicle={vehicle} />
      )}

      {isSelected && vehicleReceiptReviewMode && (
        <CoOwnerReceiptWorld vehicle={vehicle} />
      )}

      {isSelected && vehicleHandoverMode && (
        <VehicleHandoverWorld vehicle={vehicle} />
      )}

      {isSelected && vehicleTripStartMode && (
        <TripStartWorld vehicle={vehicle} />
      )}

      {isSelected && vehicleTripVisualizationMode && (
        <TripVisualizationWorld vehicle={vehicle} />
      )}

      {isSelected && (vehicleDamageMappingMode || vehicleInspectionMode) && (
        <VehicleDamageWorld vehicle={vehicle} />
      )}

      {isSelected && (vehicleDamageHistoryMode || vehicleMaintenanceMode) && (
        <VehicleDamageHistoryWorld vehicle={vehicle} />
      )}

      {/* Subtle 3D Maintenance Status Badge on Turntable Platform (Co-Owner Garage Only) */}
      {isSelected && isCoOwner && vehicle.status === 'MAINTENANCE' && (
        <group position={[0, 0.28, 2.35]}>
          <Billboard follow={true}>
            <Html center distanceFactor={10} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.22)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(245, 158, 11, 0.65)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    boxShadow: '0 0 8px #f59e0b',
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#fbbf24',
                    letterSpacing: '0.05em',
                  }}
                >
                  ĐANG BẢO DƯỠNG
                </span>
              </div>
            </Html>
          </Billboard>
        </group>
      )}
    </group>
  );
};

const VehicleBay = React.memo(VehicleBayComponent);

export const VehicleDigitalTwin: React.FC<VehicleDigitalTwinProps> = ({ renderPanel }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const authReady = isAuthenticated && (!!accessToken || !!refreshToken);

  const selectedZone = useWorldStore((state) => state.selectedZone);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const vehicleCoOwnershipMode = useWorldStore((state) => state.vehicleCoOwnershipMode);
  const isRegistrationReviewModalOpen = useWorldStore((state) => state.isRegistrationReviewModalOpen);
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'CO_OWNER';
  const isStaff = user?.role === 'STAFF';
  const isAdmin = user?.role === 'ADMIN';
  const isOperationsRole = isStaff || isAdmin;
  const isCoOwner = !user?.role || user?.role === 'CO_OWNER';

  const defaultVehiclePosition: [number, number, number] = isCoOwner
    ? [0.0, 0.14, 1.8]
    : [0.0, 0.14, 0.5];

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
  const selectedVehiclePartId = useWorldStore((state) => state.selectedVehiclePartId);
  const selectVehicle = useWorldStore((state) => state.selectVehicle);
  const setVisibleVehicleLabelId = useWorldStore((state) => state.setVisibleVehicleLabelId);
  const openVehicleDetail = useWorldStore((state) => state.openVehicleDetail);
  const hoverVehicle = useWorldStore((state) => state.hoverVehicle);
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const isVehicleSelected = useWorldStore((state) => state.isVehicleSelected);
  const vehicleVotingMode = useWorldStore((state) => state.vehicleVotingMode);
  const activePrimaryPanel = useWorldStore((state) => state.activePrimaryPanel);
  const isStaffDisputeDashboardOpen = useWorldStore((state) => state.isStaffDisputeDashboardOpen);
  const adminActiveModule = useWorldStore((state) => state.adminActiveModule);
  const adminApplicationPreviewVehicle = useWorldStore((state) => state.adminApplicationPreviewVehicle);

  // TanStack Query: Fetch vehicles from Spring Boot API / MySQL (scoped per role and user)
  const { data: vehicles = [], isLoading, isError, error, refetch } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
    enabled: authReady,
    staleTime: 4000,
    refetchInterval: 4000,
  });

  // Fixed Showroom Capacity: Exactly FOUR maximum showroom slots (Slot 1, 2, 3, 4)
  const MAX_SHOWROOM_DISPLAY_SLOTS = 4;

  // Showroom Display Data (Separated from Fleet Inventory per Section 10):
  // 1. In CO_OWNER mode: exactly ONE vehicle is rendered in 3D space.
  // 2. In operations mode (STAFF/ADMIN): exactly at most FOUR eligible showroom vehicles in stable deterministic order.
  // 3. In ADMIN Application Review mode: preview the exact application vehicle in isolated preview mode.
  const showroomDisplayVehicles = useMemo(() => {
    if (isAdmin && adminActiveModule === 'APPLICATION_REVIEW' && adminApplicationPreviewVehicle) {
      return [adminApplicationPreviewVehicle as VehicleResponse];
    }

    if (!vehicles || vehicles.length === 0) return [];

    if (!isOperationsRole) {
      if (selectedVehicleId) {
        const matched = vehicles.find((v) => isMatchingVehicle(v, selectedVehicleId));
        if (matched) return [matched];
      }
      return [vehicles[0]];
    }

    const sorted = sortStaffFleetVehicles(vehicles);
    return sorted.slice(0, MAX_SHOWROOM_DISPLAY_SLOTS);
  }, [vehicles, isOperationsRole, selectedVehicleId, isAdmin, adminActiveModule, adminApplicationPreviewVehicle]);

  // Synchronize selection: If selected vehicle is not in authorized backend vehicles, reset selection
  useEffect(() => {
    if (selectedVehicleId && vehicles.length > 0) {
      const isStillAvailable = vehicles.some((v) => isMatchingVehicle(v, selectedVehicleId));
      if (!isStillAvailable) {
        clearSelection();
      }
    }
  }, [selectedVehicleId, vehicles, clearSelection]);

  const isBusinessModeActive =
    vehicleInspectionMode ||
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
    vehicleVotingMode ||
    activePrimaryPanel === 'DISPUTE' ||
    isStaffDisputeDashboardOpen;

  const handleVehicleSelect = (selectedVehicle: VehicleResponse) => {
    if (isAdmin) {
      if (adminActiveModule === 'APPLICATION_REVIEW' || (selectedVehicle as any)?.isApplicationPreview) return;
      useWorldStore.getState().setAdminVehicleGalleryOpen(true);
      return;
    }
    if (role === 'STAFF') {
      selectVehicle(selectedVehicle.id, role, false);
      useWorldStore.getState().setAdminVehicleGalleryOpen(false);
      useWorldStore.getState().setStaffOperationsCarouselOpen(true);
      return;
    }
    // For CO_OWNER, clicking the central vehicle activates VEHICLE_OVERVIEW state:
    // Displays both the eight-function carousel and the right-side overview panel (TỔNG QUAN)
    selectVehicle(selectedVehicle.id, role, true);
    openVehicleDetail();
    useWorldStore.getState().setCoOwnerOperationsCarouselOpen(true);
  };

  const handleDirectVehicleClick = (selectedVehicle: VehicleResponse) => {
    if (isAdmin) {
      if (adminActiveModule === 'APPLICATION_REVIEW' || (selectedVehicle as any)?.isApplicationPreview) return;
      useWorldStore.getState().setAdminVehicleGalleryOpen(true);
      return;
    }
    selectVehicle(selectedVehicle.id, role, false);
    // For STAFF, clicking the central vehicle reveals the 8-function operational hologram carousel
    // without opening the redundant old vehicle overview panel.
    if (role === 'STAFF') {
      useWorldStore.getState().setAdminVehicleGalleryOpen(false);
      useWorldStore.getState().setStaffOperationsCarouselOpen(true);
      return;
    }
    if (isCoOwner) {
      selectVehicle(selectedVehicle.id, role, true);
      openVehicleDetail();
      useWorldStore.getState().setCoOwnerOperationsCarouselOpen(true);
      return;
    }
    if (isOperationsRole) {
      openVehicleDetail();
    }
  };

  // For operations role, derive the foreground hero vehicle using the Single Source of Truth
  // All hooks must execute unconditionally BEFORE any early returns
  const heroVehicle = useMemo(() => {
    if (isAdmin && adminActiveModule === 'APPLICATION_REVIEW' && adminApplicationPreviewVehicle) {
      return adminApplicationPreviewVehicle as VehicleResponse;
    }
    if (!vehicles || vehicles.length === 0) return null;
    return resolveAuthoritativeHeroVehicle(vehicles, selectedVehicleId);
  }, [vehicles, selectedVehicleId, isAdmin, adminActiveModule, adminApplicationPreviewVehicle]);

  // Loading State in 3D Space (all hooks have now been called unconditionally)
  if (!authReady || isLoading) {
    return (
      <group position={defaultVehiclePosition}>
        <Html position={[0, 1.8, 0]} center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div
            style={{
              background: 'rgba(8, 12, 22, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '9999px',
              padding: '8px 18px',
              color: '#38bdf8',
              fontFamily: 'var(--font-family)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles size={14} color="#00f2fe" />
            <span>ĐANG TẢI DỮ LIỆU XE...</span>
          </div>
        </Html>
      </group>
    );
  }

  // Error State in 3D Space
  if (isError) {
    return (
      <group position={defaultVehiclePosition}>
        <Html position={[0, 1.8, 0]} center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div
            style={{
              pointerEvents: 'auto',
              width: '280px',
              background: 'rgba(15, 10, 20, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '14px',
              padding: '16px',
              color: '#f8fafc',
              fontFamily: 'var(--font-family)',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(239, 68, 68, 0.25)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '6px',
              }}
            >
              <AlertTriangle size={15} />
              <span>KHÔNG THỂ TẢI DỮ LIỆU XE</span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px 0' }}>
              Không thể kết nối đến máy chủ. Vui lòng thử lại sau.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 16px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={12} />
              THỬ LẠI
            </button>
          </div>
        </Html>
      </group>
    );
  }

  // Empty State: CO_OWNER without active group memberships or no vehicles available
  if (showroomDisplayVehicles.length === 0) {
    return (
      <group position={defaultVehiclePosition}>
        <Html position={[0, 1.8, 0]} center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div
            style={{
              background: 'rgba(8, 12, 22, 0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '9999px',
              padding: '8px 18px',
              color: '#94a3b8',
              fontFamily: 'var(--font-family)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            <Car size={14} />
            <span>
              {isCoOwner
                ? 'BẠN CHƯA THAM GIA NHÓM ĐỒNG SỞ HỮU XE NÀO'
                : 'CHƯA CÓ XE TRONG HỆ THỐNG'}
            </span>
          </div>
        </Html>
      </group>
    );
  }

  // Operations Role Layout: Horizontal Preview Row in background + Large Hero Vehicle in center-foreground
  if (isOperationsRole && heroVehicle) {
    const heroCode = resolveVehicleCode(heroVehicle);

    return (
      <group name="StaffFleetHeroAndPreviewContainer">
        {/* Large Foreground Hero Vehicle (Interactive Turntable, Full Detail) */}
        <VehicleBay
          key={heroVehicle.id || heroCode}
          vehicle={heroVehicle}
          vehicleCode={heroCode}
          position={STAFF_GARAGE_LAYOUT.heroAnchor}
          isSelected={true}
          isHovered={false}
          isAnyVehicleSelected={true}
          isCoOwner={false}
          role={role}
          isBusinessModeActive={isBusinessModeActive}
          selectedZone={selectedZone}
          selectedVehicleId={selectedVehicleId || heroVehicle.id}
          isVehicleSelected={true}
          vehicleBookingMode={vehicleBookingMode}
          vehicleCoOwnershipMode={vehicleCoOwnershipMode}
          vehicleHandoverMode={vehicleHandoverMode}
          vehicleReceiptReviewMode={vehicleReceiptReviewMode}
          vehicleTripStartMode={vehicleTripStartMode}
          vehicleTripVisualizationMode={vehicleTripVisualizationMode}
          vehicleDamageMappingMode={vehicleDamageMappingMode}
          vehicleDamageHistoryMode={vehicleDamageHistoryMode}
          vehicleMaintenanceMode={vehicleMaintenanceMode}
          vehicleInspectionMode={vehicleInspectionMode}
          selectedVehiclePartId={selectedVehiclePartId}
          renderPanel={renderPanel}
          onSelect={handleDirectVehicleClick}
          onHover={hoverVehicle}
          onClearSelection={clearSelection}
        />
      </group>
    );
  }

  const isAnyVehicleSelected = Boolean(selectedVehicleId);

  return (
    <group name="VehicleFleetTwinContainer">
      {showroomDisplayVehicles.map((vehicle) => {
        const vehicleCode = resolveVehicleCode(vehicle);
        let vehicleSlot: GarageSlotDef;
        try {
          vehicleSlot = resolveVehicleSlot(vehicle, role, showroomDisplayVehicles);
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn(`[VehicleFleetTwinContainer] Failed resolving slot for ${vehicleCode}:`, err);
          }
          vehicleSlot = DEFAULT_GARAGE_SLOT;
        }

        const isSelected = Boolean(
          selectedVehicleId && isMatchingVehicle(vehicle, selectedVehicleId)
        );

        return (
          <VehicleBay
            key={vehicle.id || vehicleCode}
            vehicle={vehicle}
            vehicleCode={vehicleCode}
            vehicleSlot={vehicleSlot}
            slot={vehicleSlot}
            position={vehicleSlot.position}
            isSelected={isSelected}
            isHovered={false}
            isAnyVehicleSelected={isAnyVehicleSelected}
            isCoOwner={isCoOwner}
            role={role}
            isBusinessModeActive={isBusinessModeActive}
            selectedZone={selectedZone}
            selectedVehicleId={selectedVehicleId}
            isVehicleSelected={isVehicleSelected}
            vehicleBookingMode={vehicleBookingMode}
            vehicleCoOwnershipMode={vehicleCoOwnershipMode}
            vehicleHandoverMode={vehicleHandoverMode}
            vehicleReceiptReviewMode={vehicleReceiptReviewMode}
            vehicleTripStartMode={vehicleTripStartMode}
            vehicleTripVisualizationMode={vehicleTripVisualizationMode}
            vehicleDamageMappingMode={vehicleDamageMappingMode}
            vehicleDamageHistoryMode={vehicleDamageHistoryMode}
            vehicleMaintenanceMode={vehicleMaintenanceMode}
            vehicleInspectionMode={vehicleInspectionMode}
            selectedVehiclePartId={selectedVehiclePartId}
            renderPanel={renderPanel}
            onSelect={isOperationsRole ? handleDirectVehicleClick : handleVehicleSelect}
            onHover={hoverVehicle}
            onClearSelection={clearSelection}
          />
        );
      })}
    </group>
  );
};
