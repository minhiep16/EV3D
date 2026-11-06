import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { VehicleResponse } from '../../../types/vehicle';
import { VehiclePartId } from '../../../types/vehiclePart';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';

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
  { id: 'HEADLIGHT', label: 'Cụm đèn pha LED', position: [0.66, 0.74, 1.88] },
  { id: 'WINDSHIELD', label: 'Kính chắn gió', position: [0.0, 1.22, 0.62] },
  { id: 'BATTERY', label: 'Bộ pin cao áp', position: [0.0, 0.22, -0.1] },
  { id: 'CHARGING_PORT', label: 'Cổng sạc điện', position: [-0.88, 0.86, -1.42] },
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
  { id: 'HEADLIGHT', label: 'Cụm đèn pha LED', position: [0.0, 0.68, 2.38] },
  { id: 'WINDSHIELD', label: 'Kính chắn gió', position: [0.0, 1.05, 0.55] },
  { id: 'BATTERY', label: 'Bộ pin cao áp', position: [0.0, 0.18, 0.0] },
  { id: 'CHARGING_PORT', label: 'Cổng sạc điện', position: [0.86, 0.80, -1.65] },
];

interface StaffInspectionNodeProps {
  part: StaffInspectionPartDef;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (part: StaffInspectionPartDef) => void;
  onHover: (id: VehiclePartId | null) => void;
}

const StaffInspectionNode: React.FC<StaffInspectionNodeProps> = ({
  part,
  index,
  isSelected,
  isHovered,
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

  const accentColor = isSelected ? '#00f2fe' : isHovered ? '#38bdf8' : '#0284c7';
  const visibleRingSize = isSelected ? '18px' : isHovered ? '16px' : '14px';
  const coreDotSize = isSelected ? '7px' : isHovered ? '6px' : '5px';

  return (
    <group position={part.position}>
      <group ref={floatGroupRef}>
        {/* Subtle 3D Glowing Core Sphere attached to vehicle surface */}
        <mesh raycast={() => null}>
          <sphereGeometry args={[isSelected ? 0.026 : 0.018, 14, 14]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={isSelected ? 2.6 : isHovered ? 1.8 : 1.1}
          />
        </mesh>

        {/* Subtle 3D Pulsing Halo Sphere */}
        <mesh ref={pulseRingRef} raycast={() => null}>
          <sphereGeometry args={[0.038, 14, 14]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={isSelected ? 0.32 : isHovered ? 0.2 : 0.1}
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
                  background: isSelected ? 'rgba(0, 242, 254, 0.95)' : 'rgba(8, 20, 38, 0.92)',
                  color: isSelected ? '#041325' : '#ffffff',
                  border: `1px solid ${isSelected ? '#ffffff' : 'rgba(0, 242, 254, 0.7)'}`,
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6), 0 0 10px rgba(0, 242, 254, 0.35)',
                  pointerEvents: 'none',
                }}
              >
                {part.label}
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
                  width: visibleRingSize,
                  height: visibleRingSize,
                  borderRadius: '50%',
                  background: isSelected
                    ? 'radial-gradient(circle, rgba(0, 242, 254, 0.38) 0%, rgba(6, 18, 36, 0.88) 78%)'
                    : isHovered
                    ? 'radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, rgba(6, 18, 36, 0.82) 78%)'
                    : 'radial-gradient(circle, rgba(2, 132, 199, 0.22) 0%, rgba(6, 18, 36, 0.72) 80%)',
                  border: isSelected
                    ? '1.75px solid #00f2fe'
                    : isHovered
                    ? '1.5px solid #38bdf8'
                    : '1.25px solid rgba(2, 132, 199, 0.75)',
                  boxShadow: isSelected
                    ? '0 0 0 4px rgba(0, 242, 254, 0.22), 0 0 16px rgba(0, 242, 254, 0.85)'
                    : isHovered
                    ? '0 0 0 3px rgba(56, 189, 248, 0.16), 0 0 12px rgba(56, 189, 248, 0.6)'
                    : '0 0 8px rgba(2, 132, 199, 0.35)',
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
                    boxShadow: `0 0 8px ${accentColor}`,
                  }}
                />
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
 * - Clicking a marker atomically updates selectedVehiclePartId in worldStore.
 * - Synchronizes with the right-panel Component Assessment Form.
 * - STRICTLY NO educational floating cards, NO typewriter animation, NO 2s timers.
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

  const [localHoveredId, setLocalHoveredId] = useState<VehiclePartId | null>(null);

  const isEv02 = vehicleCode === 'EV02' || vehicle?.model?.includes('EV02');
  const parts = isEv02 ? STAFF_INSPECTION_PARTS_EV02 : STAFF_INSPECTION_PARTS;

  const handleSelectPart = (part: StaffInspectionPartDef) => {
    if (selectedVehiclePartId === part.id) {
      clearVehiclePartSelection();
      selectVehiclePartCode(null);
    } else {
      selectVehiclePart(part.id);
      selectVehiclePartCode(part.id);
    }
  };

  const handleHoverPart = (id: VehiclePartId | null) => {
    setLocalHoveredId(id);
    hoverVehiclePart(id);
  };

  return (
    <group name="StaffVehicleInspectionHotspotLayer3D">
      {parts.map((part, idx) => (
        <StaffInspectionNode
          key={part.id}
          part={part}
          index={idx}
          isSelected={selectedVehiclePartId === part.id}
          isHovered={localHoveredId === part.id || hoveredVehiclePartId === part.id}
          onSelect={handleSelectPart}
          onHover={handleHoverPart}
        />
      ))}
    </group>
  );
};

