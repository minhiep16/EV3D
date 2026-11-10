import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VehicleSelectionEffectProps {
  isSelected: boolean;
  isHovered: boolean;
}

export const VehicleSelectionEffect: React.FC<VehicleSelectionEffectProps> = ({
  isSelected,
  isHovered,
}) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current && isSelected) {
      ringRef.current.rotation.z += delta * 0.8;
    }
    if (outerRingRef.current && isSelected) {
      outerRingRef.current.rotation.z -= delta * 0.4;
    }
  });

  if (!isSelected && !isHovered) return null;

  return (
    <group position={[0, 0.01, 0]}>
      {/* Concentric Fine Showroom Rings (Active when selected or hovered, perfectly matching circular platform) */}
      {(isSelected || isHovered) && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} raycast={() => null}>
          <ringGeometry args={[2.55, 2.65, 48]} />
          <meshBasicMaterial
            color="#00f2fe"
            transparent
            opacity={isSelected ? 0.65 : 0.28}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {isSelected && (
        <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} raycast={() => null}>
          <ringGeometry args={[2.85, 2.92, 48]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};
