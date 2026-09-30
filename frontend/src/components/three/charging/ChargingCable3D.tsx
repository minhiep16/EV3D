import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createChargingCableCurve } from '../../../config/chargingVisualConfig';

export interface ChargingCable3DProps {
  startWorld: [number, number, number];
  endWorld: [number, number, number];
  isActive?: boolean;
}

export const ChargingCable3D: React.FC<ChargingCable3DProps> = ({
  startWorld,
  endWorld,
  isActive = true,
}) => {
  const pulseMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const plugGlowRef = useRef<THREE.MeshStandardMaterial>(null);

  const startVec = useMemo(() => new THREE.Vector3(...startWorld), [startWorld]);
  const endVec = useMemo(() => new THREE.Vector3(...endWorld), [endWorld]);

  const curve = useMemo(() => {
    return createChargingCableCurve(startVec, endVec);
  }, [startVec, endVec]);

  // Animated energy flow along the charging cable
  useFrame((state) => {
    if (!isActive) return;
    const t = state.clock.getElapsedTime();
    const pulseFactor = 0.75 + Math.sin(t * 4.5) * 0.25;

    if (pulseMaterialRef.current) {
      pulseMaterialRef.current.opacity = Math.min(1.0, 0.7 * pulseFactor);
    }
    if (plugGlowRef.current) {
      plugGlowRef.current.emissiveIntensity = 1.0 + Math.sin(t * 3.5) * 0.4;
    }
  });

  return (
    <group name="ChargingCableGroup">
      {/* 1. Outer Heavy-Duty Rubber Cable Tube */}
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[curve, 54, 0.022, 10, false]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.65}
          metalness={0.2}
        />
      </mesh>

      {/* 2. Concentric Luminous Energy Stream Tube */}
      {isActive && (
        <mesh>
          <tubeGeometry args={[curve, 54, 0.012, 8, false]} />
          <meshBasicMaterial
            ref={pulseMaterialRef}
            color="#00f2fe"
            transparent
            opacity={0.65}
          />
        </mesh>
      )}

      {/* 3. Station Socket Plug Collar */}
      <mesh position={startWorld}>
        <cylinderGeometry args={[0.038, 0.045, 0.16, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 4. Vehicle Charge Port Heavy Plug Handle */}
      <group position={endWorld}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.036, 0.042, 0.18, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Glowing Contact Ring */}
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[0.045, 0.008, 12, 24]} />
          <meshStandardMaterial
            ref={plugGlowRef}
            color="#0284c7"
            emissive="#00f2fe"
            emissiveIntensity={1.2}
          />
        </mesh>
      </group>
    </group>
  );
};
