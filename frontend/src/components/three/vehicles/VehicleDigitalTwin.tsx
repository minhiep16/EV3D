import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../../services/queryClient';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';
import { fetchVehicles } from '../../../services/vehicleApi';
import { VehicleResponse } from '../../../types/vehicle';
import { VehicleModel } from './VehicleModel';
import { VehicleInteractionHitboxes } from './VehicleInteractionHitboxes';
import { getVehicleModelUrl, resolveVehicleCode } from './vehicleModelConfig';
import { resolveVehicleSlot, GarageSlotDef, DEFAULT_GARAGE_SLOT } from '../../../config/garageSlotConfig';
import { STAFF_GARAGE_LAYOUT } from '../../../config/staffGarageLayout';
import { FleetPreviewRow3D } from '../../fleet/FleetPreviewRow3D';
import { VehicleStatusLabel } from './VehicleStatusLabel';
import { VehicleSelectionEffect } from './VehicleSelectionEffect';
import { VehicleInspectionGuide } from './VehicleInspectionGuide';
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
import { BatteryPack3D } from '../battery/BatteryPack3D';
import { ChargingPortVisual3D } from '../charging/ChargingPortVisual3D';
import { fetchVehicleBatteryHealth } from '../../../services/batteryApi';
import { BatteryHealthResponse } from '../../../types/battery';
import { getPartById } from '../../../data/vehicleParts';
import { CoOwnerVehiclePanel } from './CoOwnerVehiclePanel';
import { StaffOperationsPanel } from './StaffOperationsPanel';
import { AdminVehicleMonitorPanel } from './AdminVehicleMonitorPanel';
import { shouldShowVehicleStatusLabel } from '../../../config/garageZoneVisibility';
import { GarageZone } from '../../../store/worldStore';
import {
  Car,
  Sparkles,
  AlertTriangle,
  RefreshCw,
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
}> = ({ vehicleSlot: propVehicleSlot, slot: propSlot, isSelected, isHovered }) => {
  const activeSlot = propVehicleSlot || propSlot || DEFAULT_GARAGE_SLOT;
  const accent = isSelected ? '#f59e0b' : activeSlot.accentColor || '#38bdf8';
  return (
    <group position={[0, -0.14, 0]}>
      {/* Base Stepped Turntable Pad */}
      <mesh position={[0, 0.035, 0]} receiveShadow>
        <cylinderGeometry args={[2.15, 2.22, 0.07, 48]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.25} />
      </mesh>

      {/* Outer Polished Aluminum Bevel Rim */}
      <mesh position={[0, 0.072, 0]}>
        <cylinderGeometry args={[2.12, 2.18, 0.015, 48]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Outer Recessed Thin Emissive Neon Ring */}
      <mesh position={[0, 0.076, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.02, 2.12, 48]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.65}
        />
      </mesh>

      {/* Middle Elevated Stepped Tier */}
      <mesh position={[0, 0.09, 0]} receiveShadow>
        <cylinderGeometry args={[1.92, 2.02, 0.035, 48]} />
        <meshStandardMaterial color="#eef2f6" roughness={0.22} metalness={0.25} />
      </mesh>

      {/* Inner Recessed Thin Emissive LED Ring */}
      <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.72, 1.80, 48]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Top Glossy Vehicle Turntable Surface */}
      <mesh position={[0, 0.114, 0]} receiveShadow>
        <cylinderGeometry args={[1.72, 1.72, 0.012, 48]} />
        <meshStandardMaterial color="#ffffff" roughness={0.16} metalness={0.22} />
      </mesh>
    </group>
  );
};

interface VehicleBayProps {
  vehicle: VehicleResponse;
  vehicleCode: 'EV01' | 'EV02';
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

const VehicleBay: React.FC<VehicleBayProps> = ({
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
      if (process.env.NODE_ENV !== 'production') {
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

  // Authoritative TanStack Query for technical battery health in X-Ray mode
  const { data: batteryHealth } = useQuery<BatteryHealthResponse | null>({
    queryKey: ['vehicleBatteryHealth', vehicle?.id],
    queryFn: () => (vehicle?.id ? fetchVehicleBatteryHealth(vehicle.id) : Promise.resolve(null)),
    enabled: Boolean(vehicle?.id && isSelected && vehicleBatteryXrayMode),
  });

  const defaultYaw = isCoOwner
    ? VEHICLE_INTERACTION_CONFIG.defaultCoOwnerYaw
    : VEHICLE_INTERACTION_CONFIG.defaultOperationsYaw;

  const turntableRef = useRef<THREE.Group>(null);
  const targetYaw = useRef(vehicleYaw ?? defaultYaw);
  const currentYaw = useRef(vehicleYaw ?? defaultYaw);
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
    e.stopPropagation();
    onSelect(vehicle);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (isBusinessModeActive) return;
    e.stopPropagation();
    onHover(vehicleCode);
    document.body.style.cursor = 'grab';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (isBusinessModeActive) return;
    e.stopPropagation();
    onHover(null);
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
    vehicleMode === 'ADMIN_VEHICLE_OVERVIEW';

  const shouldRenderVehicleOverview =
    (shouldRenderCoOwnerPanel ||
      shouldRenderStaffPanel ||
      shouldRenderAdminPanel) &&
    !isBusinessModeActive;

  const displayName = vehicleCode === 'EV01' ? 'Xe điện thực tế' : 'Xe thử nghiệm tương tác';

  return (
    <group position={effectivePosition} name={`${vehicleCode}Bay`}>
      {/* Platform Pad for non-hero slots (EV01 is seated on hero turntable) */}
      {vehicleSlot.id !== 'BAY_READY_01' && (
        <VehicleBayPlatformPad vehicleSlot={vehicleSlot} slot={vehicleSlot} isSelected={isSelected} isHovered={isHovered} />
      )}

      {/* 360-Degree Interactive Vehicle Turntable Group */}
      <group
        ref={turntableRef}
        name={`${vehicleCode}Turntable`}
        rotation={[0, currentYaw.current, 0]}
        onPointerDown={handleTurntablePointerDown}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* Selection & Hover Halo */}
        <VehicleSelectionEffect isSelected={isSelected} isHovered={isHovered} />

        {/* 3D GLB Model (Visual Only) */}
        <Suspense fallback={null}>
          <VehicleModel
            isSelected={isSelected}
            isHovered={isHovered}
            isDeEmphasized={isDeEmphasized}
            isBatteryXray={isSelected && vehicleBatteryXrayMode}
            modelUrl={getVehicleModelUrl(vehicle.model3dUrl, vehicle)}
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

        {/* Semantic Interaction Hitboxes (rotates with car) - Active ONLY during explore/inspection, damage mapping, or handover */}
        {(vehicleInspectionMode || vehicleDamageMappingMode || vehicleHandoverMode || vehicleReceiptReviewMode) && (
          <VehicleInteractionHitboxes
            vehicleCode={vehicleCode}
            onSelectVehicle={() => onSelect(vehicle)}
            onPointerDown={handleTurntablePointerDown}
          />
        )}
      </group>

      {/* Floating 3D Status Pill Indicator (shown in overview mode when not focused) */}
      {!isSelected &&
        !vehicleInspectionMode &&
        !vehicleCoOwnershipMode &&
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
            status={vehicle.status}
            batteryLevel={vehicle.currentBatteryLevel}
            isSelected={isSelected}
            isHovered={isHovered}
          />
        )}

      {/* World-Space Spatial Vehicle Information Card with 3D Holographic Frame & Connector */}
      {isCoOwner && isSelected && shouldRenderVehicleOverview && (
        <>
          <SpatialDataLink
            start={[0, 0.7, 0]}
            end={[2.6 - 0.45, 1.35, 0]}
            color={role === 'ADMIN' ? '#a855f7' : role === 'CO_OWNER' ? '#10b981' : '#00f2fe'}
          />

          <group position={[2.6, 1.35, 0]}>
            <Billboard follow={true}>
              <HolographicPanelFrame3D
                width={2.55}
                height={3.4}
                color={role === 'ADMIN' ? '#a855f7' : role === 'CO_OWNER' ? '#10b981' : '#00f2fe'}
              />
              <Html
                center
                distanceFactor={8.8}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                <QueryClientProvider client={queryClient}>
                  {renderPanel ? (
                    renderPanel(vehicle, onClearSelection)
                  ) : role === 'ADMIN' ? (
                    <AdminVehicleMonitorPanel
                      vehicle={vehicle}
                      onClose={onClearSelection}
                    />
                  ) : role === 'STAFF' ? (
                    <StaffOperationsPanel
                      vehicle={vehicle}
                      onClose={onClearSelection}
                    />
                  ) : (
                    <CoOwnerVehiclePanel
                      vehicle={vehicle}
                      onClose={onClearSelection}
                    />
                  )}
                </QueryClientProvider>
              </Html>
            </Billboard>
          </group>
        </>
      )}

      {/* Sub-Worlds rendered ONLY for the selected vehicle (Spatial HTML cards only for CO_OWNER) */}
      {isSelected && vehicleInspectionMode && !selectedVehiclePartId && isCoOwner && (
        <VehicleInspectionGuide />
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

      {isSelected && vehicleDamageMappingMode && (
        <VehicleDamageWorld vehicle={vehicle} />
      )}

      {isSelected && (vehicleDamageHistoryMode || vehicleMaintenanceMode) && (
        <VehicleDamageHistoryWorld vehicle={vehicle} />
      )}

      {/* Subtle 3D Maintenance Status Badge on Turntable Platform (Requirement 15) */}
      {isSelected && vehicle.status === 'MAINTENANCE' && (
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

export const VehicleDigitalTwin: React.FC<VehicleDigitalTwinProps> = ({ renderPanel }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const authReady = isAuthenticated && (!!accessToken || !!refreshToken);

  const selectedZone = useWorldStore((state) => state.selectedZone);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const hoveredVehicleId = useWorldStore((state) => state.hoveredVehicleId);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const vehicleCoOwnershipMode = useWorldStore((state) => state.vehicleCoOwnershipMode);
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
  const hoverVehicle = useWorldStore((state) => state.hoverVehicle);
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const isVehicleSelected = useWorldStore((state) => state.isVehicleSelected);

  // TanStack Query: Fetch vehicles from Spring Boot API / MySQL (scoped per role and user)
  const { data: vehicles = [], isLoading, isError, error, refetch } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
    enabled: authReady,
    refetchInterval: authReady ? 6000 : false,
  });

  // Maximum number of vehicles to simultaneously instantiate in 3D showroom bays
  const MAX_CONCURRENT_3D_BAYS = 8;

  // Scalable Fleet 3D Projection:
  // 1. In CO_OWNER mode: exactly ONE vehicle is rendered in 3D space (authoritative single ownership context)
  // 2. In operations mode (STAFF/ADMIN): prioritize EV01/EV02, support fleet preview row & up to 8 bays
  const effectiveVehicles = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];

    if (!isOperationsRole) {
      if (vehicles.length > 1) {
        console.error(
          `[Domain Invariant Violation] CO_OWNER has ${vehicles.length} active vehicles. Expected at most 1:`,
          vehicles.map((v) => v.id)
        );
      }
      return [vehicles[0]];
    }

    const sorted = [...vehicles].sort((a, b) => {
      const codeA = resolveVehicleCode(a);
      const codeB = resolveVehicleCode(b);
      if (codeA === 'EV01' && codeB !== 'EV01') return -1;
      if (codeA !== 'EV01' && codeB === 'EV01') return 1;
      return 0;
    });

    if (sorted.length <= MAX_CONCURRENT_3D_BAYS) {
      return sorted;
    }

    const baySubset = sorted.slice(0, MAX_CONCURRENT_3D_BAYS);

    if (selectedVehicleId) {
      const isAlreadyMounted = baySubset.some((v) => {
        const code = resolveVehicleCode(v);
        return v.id === selectedVehicleId || code === selectedVehicleId;
      });

      if (!isAlreadyMounted) {
        const targetVehicle = sorted.find((v) => {
          const code = resolveVehicleCode(v);
          return v.id === selectedVehicleId || code === selectedVehicleId;
        });

        if (targetVehicle) {
          // Mount the selected vehicle into the active 3D set so it renders seamlessly
          return [...baySubset.slice(0, MAX_CONCURRENT_3D_BAYS - 1), targetVehicle];
        }
      }
    }

    return baySubset;
  }, [vehicles, selectedVehicleId, isOperationsRole]);

  // Synchronize selection: If selected vehicle is not in authorized backend vehicles, reset selection
  useEffect(() => {
    if (selectedVehicleId && vehicles.length > 0) {
      const isStillAvailable = vehicles.some((v) => {
        const code = resolveVehicleCode(v);
        return v.id === selectedVehicleId || code === selectedVehicleId;
      });
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
    vehicleChargingMode;

  const handleVehicleSelect = (selectedVehicle: VehicleResponse) => {
    selectVehicle(selectedVehicle.id, role);
  };

  // For operations role, derive the foreground hero vehicle (selected vehicle or first vehicle)
  // All hooks must execute unconditionally BEFORE any early returns
  const heroVehicle = useMemo(() => {
    if (!effectiveVehicles || effectiveVehicles.length === 0) return null;
    if (selectedVehicleId) {
      const match = effectiveVehicles.find((v) => {
        const code = resolveVehicleCode(v);
        return v.id === selectedVehicleId || code === selectedVehicleId;
      });
      if (match) return match;
    }
    return effectiveVehicles[0];
  }, [effectiveVehicles, selectedVehicleId]);

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
  if (effectiveVehicles.length === 0) {
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
        {/* Horizontal Secondary Fleet Preview Row (Background Lineup) */}
        <FleetPreviewRow3D
          vehicles={effectiveVehicles}
          selectedVehicleId={heroVehicle.id}
          onSelectVehicle={handleVehicleSelect}
          visible={!isBusinessModeActive}
        />

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
          onSelect={handleVehicleSelect}
          onHover={hoverVehicle}
          onClearSelection={clearSelection}
        />
      </group>
    );
  }

  const isAnyVehicleSelected = Boolean(selectedVehicleId);

  return (
    <group name="VehicleFleetTwinContainer">
      {effectiveVehicles.map((vehicle) => {
        const vehicleCode = resolveVehicleCode(vehicle);
        let vehicleSlot: GarageSlotDef;
        try {
          vehicleSlot = resolveVehicleSlot(vehicle, role, effectiveVehicles);
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`[VehicleFleetTwinContainer] Failed resolving slot for ${vehicleCode}:`, err);
          }
          vehicleSlot = DEFAULT_GARAGE_SLOT;
        }

        const isSelected = Boolean(
          selectedVehicleId &&
            (selectedVehicleId === vehicle.id || selectedVehicleId === vehicleCode)
        );

        const isHovered =
          hoveredVehicleId === vehicle.id ||
          hoveredVehicleId === vehicleCode;

        return (
          <VehicleBay
            key={vehicle.id || vehicleCode}
            vehicle={vehicle}
            vehicleCode={vehicleCode}
            vehicleSlot={vehicleSlot}
            slot={vehicleSlot}
            position={vehicleSlot.position}
            isSelected={isSelected}
            isHovered={isHovered}
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
            onSelect={handleVehicleSelect}
            onHover={hoverVehicle}
            onClearSelection={clearSelection}
          />
        );
      })}
    </group>
  );
};
