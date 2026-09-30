import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VEHICLE_CHARGE_PORT_ANCHORS } from '../../../config/chargingVisualConfig';

export interface ChargingPortVisual3DProps {
  vehicleCode?: string;
  isCharging?: boolean;
}

export const ChargingPortVisual3D: React.FC<ChargingPortVisual3DProps> = ({
  vehicleCode = 'EV01',
  isCharging = false,
}) => {
  const ledRingRef = useRef<THREE.MeshStandardMaterial>(null);

  const portPosition = VEHICLE_CHARGE_PORT_ANCHORS[vehicleCode] || VEHICLE_CHARGE_PORT_ANCHORS.EV01;

  useFrame((state) => {
    if (!ledRingRef.current) return;
    if (isCharging) {
      const t = state.clock.getElapsedTime();
      const intensity = 0.9 + Math.sin(t * 4.0) * 0.5;
      ledRingRef.current.emissiveIntensity = intensity;
    } else {
      ledRingRef.current.emissiveIntensity = 0.3;
    }
  });

  return (
    <group position={portPosition} name="VehicleChargePortVisual">
      {/* 1. Recessed Charge Port Socket Housing */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.048, 0.052, 0.04, 16]} />
        <meshStandardMaterial color="#0b1320" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 2. LED Status Ring Around Port Rim */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[0.048, 0.058, 24]} />
        <meshStandardMaterial
          ref={ledRingRef}
          color={isCharging ? '#00f2fe' : '#38bdf8'}
          emissive={isCharging ? '#00f2fe' : '#0284c7'}
          emissiveIntensity={isCharging ? 1.2 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
