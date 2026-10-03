import React, { Suspense, useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import { VehicleResponse } from '../../types/vehicle';
import { resolveVehicleCode, getVehicleModelUrl, isMatchingVehicle } from '../three/vehicles/vehicleModelConfig';
import { VehicleModel } from '../three/vehicles/VehicleModel';
import { STAFF_GARAGE_LAYOUT } from '../../config/staffGarageLayout';

interface FleetPreviewRow3DProps {
  vehicles: VehicleResponse[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicle: VehicleResponse) => void;
  visible?: boolean;
}

export const FleetPreviewRow3D: React.FC<FleetPreviewRow3DProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  visible = true,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const {
    previewRowY,
    previewRowZ,
    previewSpacingX,
    previewScale,
    maxPreviewVehicles,
    heroAnchor,
  } = STAFF_GARAGE_LAYOUT;

  // Find index of currently selected vehicle (or default to 0)
  const selectedIndex = useMemo(() => {
    if (!selectedVehicleId || vehicles.length === 0) return 0;
    const idx = vehicles.findIndex((v) => isMatchingVehicle(v, selectedVehicleId));
    return idx >= 0 ? idx : 0;
  }, [vehicles, selectedVehicleId]);

  // Compute sliding window of visible preview vehicles
  const previewItems = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];

    const total = vehicles.length;
    if (total <= maxPreviewVehicles) {
      // All vehicles fit in the row; center them around heroAnchor[0]
      const startX = heroAnchor[0] - ((total - 1) * previewSpacingX) / 2;
      return vehicles.map((v, i) => ({
        vehicle: v,
        posX: startX + i * previewSpacingX,
      }));
    }

    // Sliding window centered on selectedIndex
    const half = Math.floor(maxPreviewVehicles / 2);
    let startIdx = selectedIndex - half;
    if (startIdx < 0) startIdx = 0;
    if (startIdx + maxPreviewVehicles > total) {
      startIdx = Math.max(0, total - maxPreviewVehicles);
    }

    const windowSlice = vehicles.slice(startIdx, startIdx + maxPreviewVehicles);
    const startX = heroAnchor[0] - ((windowSlice.length - 1) * previewSpacingX) / 2;

    return windowSlice.map((v, i) => ({
      vehicle: v,
      posX: startX + i * previewSpacingX,
    }));
  }, [vehicles, selectedIndex, maxPreviewVehicles, previewSpacingX, heroAnchor]);

  if (!visible || previewItems.length === 0) return null;

  return (
    <group name="FleetPreviewRow3D" position={[0, previewRowY, previewRowZ]}>
      {/* Elevated Horizontal Backdrop Stage Rail (subtle architectural platform) */}
      <mesh position={[heroAnchor[0], -0.12, 0]} receiveShadow>
        <boxGeometry args={[Math.max(10, previewItems.length * previewSpacingX + 2.5), 0.1, 3.2]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.2} metalness={0.25} />
      </mesh>
      {/* Thin Emissive Blue Edge Line on stage */}
      <mesh position={[heroAnchor[0], -0.065, 1.55]}>
        <boxGeometry args={[Math.max(10, previewItems.length * previewSpacingX + 2.5), 0.015, 0.04]} />
        <meshBasicMaterial color="#00f2fe" transparent opacity={0.65} />
      </mesh>

      {/* Render each secondary preview vehicle */}
      {previewItems.map(({ vehicle, posX }) => {
        const code = resolveVehicleCode(vehicle);
        const isSelected = isMatchingVehicle(vehicle, selectedVehicleId);

        const isHovered = hoveredId === (vehicle.id || code);
        const accent = isSelected ? '#00f2fe' : isHovered ? '#38bdf8' : '#64748b';

        return (
          <group
            key={`preview-${vehicle.id || code}`}
            position={[posX, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectVehicle(vehicle);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredId(vehicle.id || code);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredId(null);
              document.body.style.cursor = 'auto';
            }}
          >
            {/* Circular Mini Display Pedestal */}
            <mesh position={[0, -0.04, 0]} receiveShadow>
              <cylinderGeometry args={[1.35, 1.42, 0.06, 32]} />
              <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.2} />
            </mesh>
            {/* Glowing Neon Ring around pedestal */}
            <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.28, 1.36, 32]} />
              <meshBasicMaterial
                color={accent}
                transparent
                opacity={isSelected ? 0.95 : isHovered ? 0.75 : 0.35}
              />
            </mesh>

            {/* Floating Pill Above Preview Vehicle: [ • EV01 ] */}
            <Html position={[0, 1.6, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
              <div
                style={{
                  background: isSelected
                    ? 'rgba(0, 242, 254, 0.95)'
                    : isHovered
                    ? 'rgba(15, 23, 42, 0.92)'
                    : 'rgba(13, 27, 42, 0.82)',
                  backdropFilter: 'blur(12px)',
                  border: isSelected
                    ? '1.5px solid #ffffff'
                    : `1px solid ${isHovered ? '#38bdf8' : 'rgba(56, 189, 248, 0.35)'}`,
                  boxShadow: isSelected
                    ? '0 0 16px rgba(0, 242, 254, 0.65)'
                    : '0 4px 12px rgba(0, 0, 0, 0.25)',
                  borderRadius: '9999px',
                  padding: '3px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: isSelected ? '#08101c' : '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                  transform: isSelected || isHovered ? 'scale(1.08)' : 'scale(1.0)',
                  transition: 'all 0.18s ease',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVehicle(vehicle);
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor:
                      vehicle.status === 'AVAILABLE'
                        ? isSelected
                          ? '#064e3b'
                          : '#10b981'
                        : vehicle.status === 'CHARGING'
                        ? '#00f2fe'
                        : vehicle.status === 'MAINTENANCE'
                        ? '#ef4444'
                        : '#f59e0b',
                  }}
                />
                <span>{code}</span>
              </div>
            </Html>

            {/* Scaled Visual Model (Lightweight, No Semantic Hitboxes) */}
            <group scale={[previewScale, previewScale, previewScale]}>
              <Suspense fallback={null}>
                <VehicleModel
                  isSelected={isSelected}
                  isHovered={isHovered}
                  isDeEmphasized={!isSelected}
                  modelUrl={getVehicleModelUrl(vehicle.model3dUrl, vehicle)}
                  onSelectVehicle={() => onSelectVehicle(vehicle)}
                />
              </Suspense>
            </group>
          </group>
        );
      })}
    </group>
  );
};
