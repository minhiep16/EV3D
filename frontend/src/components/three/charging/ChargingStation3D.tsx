import React, { useMemo, useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ChargingStationResponse } from '../../../types/charging';
import {
  CHARGING_STATION_THEMES,
  CHARGING_STATION_VISUALS,
} from '../../../config/chargingVisualConfig';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { shouldShowChargingStationLabel } from '../../../config/garageZoneVisibility';
import { Zap, Activity } from 'lucide-react';

export interface ChargingStation3DProps {
  station: ChargingStationResponse;
  isSelected?: boolean;
  isActiveSession?: boolean;
  onSelectStation?: (stationId: string) => void;
}

export const ChargingStation3D: React.FC<ChargingStation3DProps> = ({
  station,
  isSelected = false,
  isActiveSession = false,
  onSelectStation,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const statusLedRef = useRef<THREE.MeshBasicMaterial>(null);
  const touchScreenRef = useRef<THREE.MeshBasicMaterial>(null);

  const user = useAuthStore((state) => state.user);
  const isOperationsRole = user?.role === 'STAFF' || user?.role === 'ADMIN';

  // Authoritative garage focus state to govern world-space label visibility
  const selectedZone = useWorldStore((state) => state.selectedZone);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const isVehicleSelected = useWorldStore((state) => state.isVehicleSelected);
  const vehicleBookingMode = useWorldStore((state) => state.vehicleBookingMode);
  const vehicleCoOwnershipMode = useWorldStore((state) => state.vehicleCoOwnershipMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);
  const vehicleReceiptReviewMode = useWorldStore((state) => state.vehicleReceiptReviewMode);
  const vehicleTripStartMode = useWorldStore((state) => state.vehicleTripStartMode);
  const vehicleTripVisualizationMode = useWorldStore((state) => state.vehicleTripVisualizationMode);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const vehicleDamageHistoryMode = useWorldStore((state) => state.vehicleDamageHistoryMode);
  const vehicleMaintenanceMode = useWorldStore((state) => state.vehicleMaintenanceMode);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const vehicleBatteryXrayMode = useWorldStore((state) => state.vehicleBatteryXrayMode);
  const vehicleChargingMode = useWorldStore((state) => state.vehicleChargingMode);
  const selectedVehiclePartId = useWorldStore((state) => state.selectedVehiclePartId);
  const selectedVehiclePartCode = useWorldStore((state) => state.selectedVehiclePartCode);
  const selectedChargingStationId = useWorldStore((state) => state.selectedChargingStationId);
  const activeFeature = useWorldStore((state) => state.activeFeature);

  const showLabel = useMemo(() => {
    // Authoritative garage and vehicle focus state:
    const isVehicleFocused = Boolean(selectedVehicleId) || Boolean(isVehicleSelected) || selectedZone === 'VEHICLE';
    const isGarageOverview = activeFeature === 'NONE' && !isVehicleFocused;
    const isChargingActive = activeFeature === 'CHARGING' || Boolean(vehicleChargingMode);

    // Positive allow-list condition for co-owners: show compact info ONLY in Garage Overview or when Charging is Active
    if (!isOperationsRole) {
      if (!isGarageOverview && !isChargingActive) {
        return false;
      }
      if (isGarageOverview && !isSelected && !isHovered) {
        return false;
      }
    }
    return shouldShowChargingStationLabel(
      station.id,
      {
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
        vehicleBatteryXrayMode,
        vehicleChargingMode,
        selectedVehiclePartId,
        selectedVehiclePartCode,
        selectedChargingStationId,
      },
      { isSelected, isHovered }
    );
  }, [
    isOperationsRole,
    station.id,
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
    vehicleBatteryXrayMode,
    vehicleChargingMode,
    selectedVehiclePartId,
    selectedVehiclePartCode,
    selectedChargingStationId,
    isSelected,
    isHovered,
  ]);

  const visualConfig = useMemo(() => {
    return CHARGING_STATION_VISUALS[station.code] || {
      code: station.code,
      bayId: 'BAY_CHARGING_01',
      stationPosition: [
        station.posX ? Number(station.posX) : 6.5,
        station.posY ? Number(station.posY) : 0.14,
        station.posZ ? Number(station.posZ) : 0.5,
      ] as [number, number, number],
      kioskOffset: [1.35, 0, 0] as [number, number, number],
      socketOffset: [1.35 + 0.42, 0.95, 0.05] as [number, number, number],
    };
  }, [station]);

  const effectiveStatus = isActiveSession ? 'OCCUPIED' : station.status;
  const theme = CHARGING_STATION_THEMES[effectiveStatus] || CHARGING_STATION_THEMES.AVAILABLE;

  // Subtle pulse animation for active or hovered kiosk
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pulseFactor = effectiveStatus === 'OCCUPIED'
      ? 0.75 + Math.sin(t * 3.5) * 0.25
      : isHovered
      ? 0.85 + Math.sin(t * 4.0) * 0.15
      : 0.9;

    if (statusLedRef.current) {
      statusLedRef.current.color = new THREE.Color(theme.glow);
      statusLedRef.current.opacity = Math.min(1.0, pulseFactor);
    }
    if (touchScreenRef.current) {
      touchScreenRef.current.opacity = Math.min(1.0, 0.85 * pulseFactor);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onSelectStation) {
      onSelectStation(station.id);
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(false);
    document.body.style.cursor = 'auto';
  };

  const [baseX, baseY, baseZ] = visualConfig.stationPosition;
  const [offX, offY, offZ] = visualConfig.kioskOffset;

  return (
    <group
      position={[baseX + offX, baseY + offY, baseZ + offZ]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      name={`ChargingStation_${station.code}`}
    >
      {/* 1. Main White Tower Body */}
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.64, 1.88, 0.42]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.2}
          metalness={0.25}
        />
      </mesh>

      {/* 2. Side Brushed Alloy Trim Strips */}
      <mesh position={[-0.325, 0.95, 0]}>
        <boxGeometry args={[0.02, 1.9, 0.4]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.325, 0.95, 0]}>
        <boxGeometry args={[0.02, 1.9, 0.4]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 3. Front Black Beveled Glass Frame */}
      <mesh position={[0, 1.15, 0.215]}>
        <boxGeometry args={[0.48, 1.05, 0.02]} />
        <meshStandardMaterial color="#0b1320" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* 4. Active Touch Screen HUD */}
      <mesh position={[0, 1.2, 0.23]}>
        <planeGeometry args={[0.4, 0.8]} />
        <meshBasicMaterial
          ref={touchScreenRef}
          color={effectiveStatus === 'OCCUPIED' ? '#00f2fe' : '#10b981'}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 5. Lightning Bolt Indicator Plate */}
      <mesh position={[0, 1.25, 0.232]}>
        <planeGeometry args={[0.18, 0.32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
      </mesh>

      {/* 6. Top Status LED Arch */}
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[0.56, 0.04, 0.32]} />
        <meshBasicMaterial ref={statusLedRef} color={theme.glow} transparent opacity={0.9} />
      </mesh>

      {/* 7. Side CCS2 Charging Cable Holster & Plug Socket */}
      <mesh position={[0.42, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.9, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.42, 0.9, 0.05]} rotation={[Math.PI / 4, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.25, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.42, 0.98, 0.12]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color={effectiveStatus === 'OCCUPIED' ? '#0284c7' : '#059669'}
          emissive={theme.glow}
          emissiveIntensity={effectiveStatus === 'OCCUPIED' ? 1.2 : 0.7}
        />
      </mesh>

      {/* 8. Selection Aura Ring at Base */}
      {(isSelected || isHovered) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.52, 0.64, 32]} />
          <meshBasicMaterial
            color={theme.glow}
            transparent
            opacity={isSelected ? 0.8 : 0.45}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 9. Floating Holographic Station HUD Badge (Compact, close to kiosk) */}
      {showLabel && (
        <Billboard position={[0, 1.82, 0]} follow={true}>
          <Html
            center
            distanceFactor={10}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div
              style={{
                background: 'rgba(6, 18, 30, 0.85)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${isSelected ? '#00f2fe' : 'rgba(56, 189, 248, 0.3)'}`,
                borderRadius: '8px',
                padding: '4px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                transform: isHovered ? 'scale(1.05)' : 'scale(1.0)',
                transition: 'transform 0.18s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: theme.primary,
                    boxShadow: `0 0 6px ${theme.glow}`,
                  }}
                />
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '0.03em',
                  }}
                >
                  {station.code} · {station.maxPowerKw} kW
                </span>
              </div>
              <div style={{ fontSize: '8.5px', fontWeight: 600, color: theme.primary }}>
                {theme.labelVi}
              </div>
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
};
