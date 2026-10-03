import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HologramCrystal3DProps {
  position?: [number, number, number];
  color?: string;
  emissiveColor?: string;
  size?: number;
}

export const HologramCrystal3D: React.FC<HologramCrystal3DProps> = ({
  position = [0, 0, 0],
  color = '#38bdf8',
  emissiveColor = '#00f2fe',
  size = 0.28,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const wireMeshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle sinusoidal bobbing
      const time = state.clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(time * 2.2) * 0.04;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.9;
      meshRef.current.rotation.z += delta * 0.3;
    }
    if (wireMeshRef.current) {
      wireMeshRef.current.rotation.y -= delta * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Outer Faceted Glowing Cyan Octahedron */}
      <mesh ref={meshRef} castShadow>
        <octahedronGeometry args={[size, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={1.8}
          roughness={0.08}
          metalness={0.85}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Futuristic Wireframe Inner Cage */}
      <mesh ref={wireMeshRef}>
        <octahedronGeometry args={[size * 1.05, 0]} />
        <meshBasicMaterial
          color="#ffffff"
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Point Light to cast subtle cyan glow onto surrounding scene */}
      <pointLight color={emissiveColor} intensity={2.5} distance={3.5} decay={2} />
    </group>
  );
};
