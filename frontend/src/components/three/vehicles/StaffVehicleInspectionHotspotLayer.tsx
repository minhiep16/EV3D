import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { VehiclePartId } from '../../../types/vehiclePart';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { fetchVehicleDamages } from '../../../services/damageApi';
import { fetchActiveInspection, fetchLatestCompletedInspection } from '../../../services/inspectionApi';
import { DamageRecordData } from '../../../types/damage';
import { VehicleInspectionResponse, resolveHotspotSemanticColor } from '../../../types/inspection';
import {
  normalizeComponentId,
  resolveVehicleComponentAnchor,
  resolveSeverityColor,
  getSeverityRank,
} from '../../../services/vehicleDamageMappingService';

export interface StaffInspectionPartDef {
  id: VehiclePartId;
  label: string;
  position: [number, number, number];
}

/**
 * 12 Standard Vehicle Component Inspection Hotspots
 * Exactly matching the Staff Component Assessment Form options in StaffVehicleDetailPanel.
 */
export const STAFF_INSPECTION_PARTS: StaffInspectionPartDef[] = [
  { id: 'WHEEL_FL', label: 'Bánh xe trước trái', position: [-0.86, 0.36, 1.34] },
  { id: 'WHEEL_FR', label: 'Bánh xe trước phải', position: [0.86, 0.36, 1.34] },
  { id: 'WHEEL_RL', label: 'Bánh xe sau trái', position: [-0.86, 0.36, -1.34] },
  { id: 'WHEEL_RR', label: 'Bánh xe sau phải', position: [0.86, 0.36, -1.34] },
  { id: 'DOOR_FL', label: 'Cửa trước trái', position: [-0.92, 0.86, 0.52] },
  { id: 'DOOR_FR', label: 'Cửa trước phải', position: [0.92, 0.86, 0.52] },
  { id: 'DOOR_RL', label: 'Cửa sau trái', position: [-0.92, 0.86, -0.42] },
  { id: 'DOOR_RR', label: 'Cửa sau phải', position: [0.92, 0.86, -0.42] },
  { id: 'HEADLIGHTS', label: 'Cụm đèn pha LED', position: [0.66, 0.74, 1.88] },
  { id: 'WINDSHIELD', label: 'Kính chắn gió', position: [0.0, 1.22, 0.62] },
  { id: 'BATTERY', label: 'Bộ pin cao áp', position: [0.0, 0.22, -0.1] },
  { id: 'CHARGING_PORT', label: 'Cổng sạc điện', position: [-0.88, 0.86, -1.42] },
  { id: 'HOOD', label: 'Nắp ca-pô', position: [0.0, 0.82, 1.25] },
  { id: 'ROOF', label: 'Nóc xe', position: [0.0, 1.45, -0.30] },
  { id: 'TAILLIGHTS', label: 'Cụm đèn hậu LED', position: [0.0, 0.95, -1.82] },
  { id: 'BODY', label: 'Thân vỏ & Khung gầm', position: [0.0, 0.65, 0.0] },
  { id: 'DIFFUSER', label: 'Cản sau & Khuếch tán', position: [0.0, 0.32, -1.80] },
];

export const STAFF_INSPECTION_PARTS_EV02: StaffInspectionPartDef[] = [
  { id: 'WHEEL_FL', label: 'Bánh xe trước trái', position: [0.77, 0.30, 1.37] },
  { id: 'WHEEL_FR', label: 'Bánh xe trước phải', position: [-0.77, 0.30, 1.37] },
  { id: 'WHEEL_RL', label: 'Bánh xe sau trái', position: [0.77, 0.30, -1.27] },
  { id: 'WHEEL_RR', label: 'Bánh xe sau phải', position: [-0.77, 0.30, -1.27] },
  { id: 'DOOR_FL', label: 'Cửa trước trái', position: [0.87, 0.76, 0.21] },
  { id: 'DOOR_FR', label: 'Cửa trước phải', position: [-0.87, 0.76, 0.21] },
  { id: 'DOOR_RL', label: 'Cửa sau trái', position: [0.79, 0.76, -0.69] },
  { id: 'DOOR_RR', label: 'Cửa sau phải', position: [-0.79, 0.76, -0.69] },
  { id: 'HEADLIGHTS', label: 'Cụm đèn pha LED', position: [0.0, 0.68, 2.38] },
  { id: 'WINDSHIELD', label: 'Kính chắn gió', position: [0.0, 1.05, 0.55] },
  { id: 'BATTERY', label: 'Bộ pin cao áp', position: [0.0, 0.18, 0.0] },
  { id: 'CHARGING_PORT', label: 'Cổng sạc điện', position: [0.86, 0.80, -1.65] },
  { id: 'HOOD', label: 'Nắp ca-pô', position: [0.0, 0.82, 1.25] },
  { id: 'ROOF', label: 'Nóc xe', position: [0.0, 1.45, -0.30] },
  { id: 'TAILLIGHTS', label: 'Cụm đèn hậu LED', position: [0.0, 0.95, -1.82] },
  { id: 'BODY', label: 'Thân vỏ & Khung gầm', position: [0.0, 0.65, 0.0] },
  { id: 'DIFFUSER', label: 'Cản sau & Khuếch tán', position: [0.0, 0.32, -1.80] },
];

interface StaffInspectionNodeProps {
  part: StaffInspectionPartDef;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  statusColor: string;
  damageCount: number;
  activeDefectCount?: number;
  assessmentLabel?: string | null;
  onSelect: (part: StaffInspectionPartDef) => void;
  onHover: (id: VehiclePartId | null) => void;
}

const StaffInspectionNode: React.FC<StaffInspectionNodeProps> = ({
  part,
  index,
  isSelected,
  isHovered,
  statusColor,
  damageCount,
  activeDefectCount = 0,
  assessmentLabel,
  onSelect,
  onHover,
}) => {
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const floatGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + index * 0.45;
    if (floatGroupRef.current) {
      floatGroupRef.current.position.y = Math.sin(t * 1.8) * 0.006;
    }
    if (pulseRingRef.current) {
      const pulse = 1 + Math.sin(t * 2.5) * 0.14;
      const scale = isSelected ? pulse * 1.25 : isHovered ? pulse * 1.1 : pulse;
      pulseRingRef.current.scale.set(scale, scale, scale);
    }
  });

  const accentColor = statusColor;
  const ringBorderColor = isSelected ? '#ffffff' : statusColor;
  const visibleRingSize = isSelected ? '18px' : isHovered ? '16px' : '14px';
  const coreDotSize = isSelected ? '7px' : isHovered ? '6px' : '5px';

  return (
    <group position={part.position}>
      <group ref={floatGroupRef}>
        {/* Subtle 3D Glowing Core Sphere attached to vehicle surface */}
        <mesh raycast={() => null}>
          <sphereGeometry args={[isSelected ? 0.026 : 0.018, 14, 14]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={isSelected ? 2.8 : isHovered ? 2.0 : 1.2}
          />
        </mesh>

        {/* Subtle 3D Pulsing Halo Sphere */}
        <mesh ref={pulseRingRef} raycast={() => null}>
          <sphereGeometry args={[0.038, 14, 14]} />
          <meshBasicMaterial
            color={statusColor}
            transparent
            opacity={isSelected ? 0.35 : isHovered ? 0.22 : 0.12}
            depthWrite={false}
          />
        </mesh>

        {/* Interactive 3D HTML Inspection Marker */}
        <Html
          center
          zIndexRange={isSelected ? [85, 0] : isHovered ? [75, 0] : [45, 0]}
          style={{ pointerEvents: 'auto', userSelect: 'none' }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Minimal Operational Part Label Pill on Hover / Active Selection */}
            {(isHovered || isSelected) && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '26px',
                  background: isSelected ? 'rgba(0, 242, 254, 0.95)' : 'rgba(8, 20, 38, 0.94)',
                  color: isSelected ? '#041325' : '#ffffff',
                  border: `1px solid ${isSelected ? '#ffffff' : statusColor}`,
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.6), 0 0 10px ${statusColor}55`,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{part.label}</span>
                {damageCount > 0 && (
                  <span style={{ color: isSelected ? '#b91c1c' : '#f87171', fontWeight: 900 }}>
                    ({damageCount} lỗi hồ sơ)
                  </span>
                )}
                {activeDefectCount > 0 && (
                  <span style={{ color: isSelected ? '#b91c1c' : '#ef4444', fontWeight: 900 }}>
                    (Phát hiện: {assessmentLabel})
                  </span>
                )}
                {assessmentLabel && activeDefectCount === 0 && (
                  <span style={{ color: isSelected ? '#041325' : statusColor, fontWeight: 900 }}>
                    ({assessmentLabel})
                  </span>
                )}
              </div>
            )}

            {/* 30x30px Hit Target */}
            <button
              type="button"
              data-ui-interactive="true"
              aria-label={`Kiểm tra bộ phận: ${part.label}`}
              aria-pressed={isSelected}
              tabIndex={0}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(part);
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                onHover(part.id);
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                onHover(null);
              }}
              onFocus={() => onHover(part.id)}
              onBlur={() => onHover(null)}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
              }}
            >
              <span
                style={{
                  position: 'relative',
                  width: visibleRingSize,
                  height: visibleRingSize,
                  borderRadius: '50%',
                  background: isSelected
                    ? `radial-gradient(circle, ${statusColor}55 0%, rgba(6, 18, 36, 0.9) 78%)`
                    : isHovered
                    ? `radial-gradient(circle, ${statusColor}33 0%, rgba(6, 18, 36, 0.85) 78%)`
                    : `radial-gradient(circle, ${statusColor}22 0%, rgba(6, 18, 36, 0.75) 80%)`,
                  border: `1.5px solid ${ringBorderColor}`,
                  boxShadow: isSelected
                    ? `0 0 0 4px ${statusColor}44, 0 0 16px ${statusColor}`
                    : isHovered
                    ? `0 0 0 3px ${statusColor}33, 0 0 12px ${statusColor}bb`
                    : `0 0 8px ${statusColor}66`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <span
                  style={{
                    width: coreDotSize,
                    height: coreDotSize,
                    borderRadius: '50%',
                    background: accentColor,
                    boxShadow: `0 0 8px ${statusColor}`,
                  }}
                />
                {/* Damage warning badge: active defect finding or confirmed unresolved damage */}
                {(damageCount > 0 || activeDefectCount > 0) && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      border: '1.2px solid #071426',
                      boxShadow: '0 0 6px #ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '7px',
                      fontWeight: 900,
                      color: '#ffffff',
                    }}
                  >
                    !
                  </span>
                )}
              </span>
            </button>
          </div>
        </Html>
      </group>
    </group>
  );
};

export interface StaffVehicleInspectionHotspotLayerProps {
  vehicle: VehicleResponse;
  vehicleCode: 'EV01' | 'EV02';
}

/**
 * StaffVehicleInspectionHotspotLayer
 * Dedicated 3D Inspection Points for Staff / Admin Operations Workflow.
 * - Renders 12 inspectable component markers on 3D vehicle.
 * - Synchronizes visual states with authoritative damages and active inspection items:
 *   - CYAN: Normal selectable inspection hotspot
 *   - AMBER: Component has an unresolved recorded damage issue
 *   - RED: Component has a severe unresolved damage issue
 *   - GREEN: Component assessed GOOD in active inspection (with zero unresolved damage)
 * - Clicking a marker atomically updates selectedVehiclePartId in worldStore.
 * - Synchronizes with the right-panel Component Assessment Form.
 */
export const StaffVehicleInspectionHotspotLayer: React.FC<StaffVehicleInspectionHotspotLayerProps> = ({
  vehicle,
  vehicleCode,
}) => {
  const user = useAuthStore((state) => state.user);
  const isOperationsRole = user?.role === 'STAFF' || user?.role === 'ADMIN';

  // Strict role guard: only staff and admin can render this layer
  if (!isOperationsRole) {
    return null;
  }

  const selectedVehiclePartId = useWorldStore((state) => state.selectedVehiclePartId);
  const selectVehiclePart = useWorldStore((state) => state.selectVehiclePart);
  const selectVehiclePartCode = useWorldStore((state) => state.selectVehiclePartCode);
  const clearVehiclePartSelection = useWorldStore((state) => state.clearVehiclePartSelection);
  const hoverVehiclePart = useWorldStore((state) => state.hoverVehiclePart);
  const hoveredVehiclePartId = useWorldStore((state) => state.hoveredVehiclePartId);

  // Authoritative damage query for the active vehicle
  const { data: damages = [] } = useQuery<DamageRecordData[]>({
    queryKey: ['vehicleDamages', vehicle.id],
    queryFn: () => fetchVehicleDamages(vehicle.id),
    enabled: Boolean(vehicle.id),
    staleTime: 6000,
  });

  // Authoritative active inspection query for the active vehicle
  const { data: activeInspection } = useQuery<VehicleInspectionResponse | null>({
    queryKey: ['activeInspection', vehicle.id],
    queryFn: () => fetchActiveInspection(vehicle.id),
    enabled: Boolean(vehicle.id),
    staleTime: 5000,
  });

  // Authoritative latest completed inspection query for the active vehicle (historical baseline)
  const { data: latestCompletedInspection } = useQuery<VehicleInspectionResponse | null>({
    queryKey: ['latestCompletedInspection', vehicle.id],
    queryFn: () => fetchLatestCompletedInspection(vehicle.id),
    enabled: Boolean(vehicle.id),
    staleTime: 10000,
  });

  const unresolvedDamages = damages.filter(
    (d: any) => d.status !== 'RESOLVED' && d.status !== 'REPAIRED'
  );

  const [localHoveredId, setLocalHoveredId] = useState<VehiclePartId | null>(null);

  const isEv02 = vehicleCode === 'EV02' || vehicle?.model?.includes('EV02');
  const parts = useMemo(() => {
    const baseList = isEv02 ? STAFF_INSPECTION_PARTS_EV02 : STAFF_INSPECTION_PARTS;
    return baseList.map((p) => {
      const anchor = resolveVehicleComponentAnchor(vehicle, p.id);
      return anchor ? { ...p, position: anchor } : p;
    });
  }, [vehicle, isEv02, vehicleCode, vehicle?.id, vehicle?.model]);

  const handleSelectPart = (part: StaffInspectionPartDef) => {
    const canonical = (normalizeComponentId(part.id) || part.id) as VehiclePartId;
    if (normalizeComponentId(selectedVehiclePartId) === canonical) {
      clearVehiclePartSelection();
      selectVehiclePartCode(null);
    } else {
      selectVehiclePart(canonical);
      selectVehiclePartCode(canonical);
    }
  };

  const handleHoverPart = (id: VehiclePartId | null) => {
    setLocalHoveredId(id);
    hoverVehiclePart(id);
  };

  const isSessionActive = Boolean(activeInspection && activeInspection.status === 'IN_PROGRESS');

  return (
    <group name="StaffVehicleInspectionHotspotLayer3D">
      {parts.map((part, idx) => {
        const canonicalId = normalizeComponentId(part.id);
        const isSelected = normalizeComponentId(selectedVehiclePartId) === canonicalId;
        const partDamages = unresolvedDamages.filter(
          (d) => normalizeComponentId(d.vehiclePartCode || (d as any).partCode) === canonicalId
        );
        const assessedDraftItem = activeInspection?.items?.find(
          (i) => normalizeComponentId(i.vehiclePartCode) === canonicalId
        );

        const resolvedForPart = damages.filter(
          (d: any) =>
            (d.status === 'RESOLVED' || d.status === 'REPAIRED') &&
            normalizeComponentId(d.vehiclePartCode || (d as any).partCode) === canonicalId
        );
        const hasOpenDamage = partDamages.length > 0;

        let statusColor = '#94a3b8'; // Default UNINSPECTED: Gray (#94a3b8)
        let assessmentLabel: string | null = null;

        if (isSessionActive) {
          // ========================================================
          // ACTIVE INSPECTION SESSION MODE:
          // Strictly authoritative on active session items.
          // Centralized semantic colors:
          // GOOD -> Cyan (#00f2fe), SCRATCH -> Yellow (#facc15),
          // DENT -> Orange (#f97316), CRACK -> Red (#ef4444)
          // Live session assessments are strictly respected.
          // ========================================================
          if (assessedDraftItem) {
            statusColor = resolveHotspotSemanticColor(assessedDraftItem.conditionStatus, true);
            if (assessedDraftItem.conditionStatus === 'GOOD') {
              assessmentLabel = 'TỐT';
            } else if (assessedDraftItem.conditionStatus === 'SCRATCH') {
              assessmentLabel = 'TRẦY';
            } else if (assessedDraftItem.conditionStatus === 'DENT') {
              assessmentLabel = 'MÓP';
            } else if (assessedDraftItem.conditionStatus === 'CRACK') {
              assessmentLabel = 'NỨT';
            } else {
              assessmentLabel = 'HƯ HỎNG';
            }
          } else {
            // Component has NOT been inspected in the active session
            statusColor = '#94a3b8'; // Gray (#94a3b8) - do not fake GOOD
            assessmentLabel = isSelected ? 'CHƯA KIỂM TRA (ĐANG CHỌN)' : 'CHƯA KIỂM TRA';
          }
        } else {
          // ========================================================
          // HISTORICAL / OVERVIEW MODE (No active session in progress)
          // ========================================================
          if (hasOpenDamage) {
            const primaryDmg = partDamages[0];
            statusColor = resolveHotspotSemanticColor(primaryDmg.damageType, true);
            assessmentLabel = primaryDmg.damageType || 'HƯ HỎNG';
          } else if (resolvedForPart.length > 0) {
            statusColor = '#00f2fe';
            assessmentLabel = 'TỐT (ĐÃ KHẮC PHỤC)';
          } else if (latestCompletedInspection?.items) {
            const histItem = latestCompletedInspection.items.find(
              (i) => normalizeComponentId(i.vehiclePartCode) === canonicalId
            );
            if (histItem) {
              statusColor = resolveHotspotSemanticColor(histItem.conditionStatus, true);
              if (histItem.conditionStatus === 'GOOD') {
                assessmentLabel = 'TỐT (LỊCH SỬ)';
              } else if (histItem.conditionStatus === 'SCRATCH') {
                assessmentLabel = 'TRẦY (LỊCH SỬ)';
              } else if (histItem.conditionStatus === 'DENT') {
                assessmentLabel = 'MÓP (LỊCH SỬ)';
              } else {
                assessmentLabel = 'HƯ HỎNG (LỊCH SỬ)';
              }
            } else {
              statusColor = '#94a3b8';
              assessmentLabel = 'CHƯA KIỂM ĐỊNH';
            }
          } else {
            statusColor = '#94a3b8';
            assessmentLabel = isSelected ? 'ĐANG CHỌN' : 'CHƯA KIỂM ĐỊNH';
          }
        }

        const hasActiveDefect = Boolean(
          assessedDraftItem && assessedDraftItem.conditionStatus && assessedDraftItem.conditionStatus !== 'GOOD'
        );

        return (
          <StaffInspectionNode
            key={part.id}
            part={part}
            index={idx}
            isSelected={isSelected}
            isHovered={localHoveredId === part.id || hoveredVehiclePartId === part.id}
            statusColor={statusColor}
            damageCount={partDamages.length}
            activeDefectCount={hasActiveDefect ? 1 : 0}
            assessmentLabel={assessmentLabel}
            onSelect={handleSelectPart}
            onHover={handleHoverPart}
          />
        );
      })}
    </group>
  );
};

