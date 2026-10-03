import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HeroHologramFrameProps {
  position?: [number, number, number];
  color?: string;
}

/**
 * HeroHologramFrame: 3D Holographic Curved Ribbon Arch connecting the left wing,
 * center card, and right wing into a unified spatial canopy.
 */
export const HeroHologramFrame: React.FC<HeroHologramFrameProps> = ({
  position = [0, 0, 0],
  color = '#00e5ff',
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 1.2 + Math.sin(time * 2.0) * 0.3;
      }
    }
  });

  return (
    <group position={position}>
      {/* Curved Arched Ribbon Band */}
      <mesh ref={meshRef} position={[0, 0.98, -0.1]} rotation={[0, 0, 0]}>
        <torusGeometry args={[2.55, 0.012, 16, 64, Math.PI * 0.62]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Soft Glow Halo Arch */}
      <mesh position={[0, 0.98, -0.12]}>
        <torusGeometry args={[2.55, 0.035, 16, 64, Math.PI * 0.62]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
