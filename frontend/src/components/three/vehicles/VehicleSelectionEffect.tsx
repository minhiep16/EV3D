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
      {/* 1. Primary Underglow Projection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[2.8, 5.0]} />
        <meshBasicMaterial
          color={isSelected ? '#00f2fe' : '#38bdf8'}
          transparent
          opacity={isSelected ? 0.35 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Concentric Orbiting Selection Ring (Active when selected) */}
      {isSelected && (
        <>
          <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[2.5, 2.65, 48]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>

          <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[2.85, 2.92, 48]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
    </group>
  );
};
