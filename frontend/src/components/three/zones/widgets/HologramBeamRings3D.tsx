import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HologramBeamRings3DProps {
  position?: [number, number, number];
  color?: string;
}

export const HologramBeamRings3D: React.FC<HologramBeamRings3DProps> = ({
  position = [0, 0, 0],
  color = '#22e6ff',
}) => {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const midRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.45;
    }
    if (midRingRef.current) {
      midRingRef.current.rotation.z -= delta * 0.65;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z += delta * 0.85;
    }
    if (beamRef.current) {
      const time = state.clock.getElapsedTime();
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.12 + Math.sin(time * 3.0) * 0.04;
      }
    }
  });

  return (
    <group position={position}>
      {/* 1. Concentric Holographic Base Rings */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Outer Fine Ring */}
        <mesh ref={outerRingRef} position={[0, 0, 0]}>
          <ringGeometry args={[1.52, 1.55, 64]} />
          <meshBasicMaterial
            color={color}
            side={THREE.DoubleSide}
            transparent
            opacity={0.65}
          />
        </mesh>

        {/* Outer Glow Halo Ring */}
        <mesh position={[0, 0, -0.002]}>
          <ringGeometry args={[1.45, 1.62, 64]} />
          <meshBasicMaterial
            color={color}
            side={THREE.DoubleSide}
            transparent
            opacity={0.18}
          />
        </mesh>

        {/* Middle Segmented Ring with Ticks */}
        <mesh ref={midRingRef} position={[0, 0, 0.01]}>
          <ringGeometry args={[1.05, 1.12, 48, 1, 0, Math.PI * 1.65]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.2}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Inner Fast Ring */}
        <mesh ref={innerRingRef} position={[0, 0, 0.02]}>
          <ringGeometry args={[0.62, 0.66, 36]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.6}
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Subtle Crosshair Lines */}
        {[-0.8, 0, 0.8].map((offset, i) => (
          <mesh key={i} position={[offset, 0, 0.005]}>
            <planeGeometry args={[0.02, 2.2]} />
            <meshBasicMaterial color={color} transparent opacity={0.12} />
          </mesh>
        ))}
      </group>

      {/* 2. Upward Light Beam Projection (Soft Conical Gradient) */}
      <mesh ref={beamRef} position={[0, 0.42, 0]}>
        <cylinderGeometry args={[1.65, 0.85, 0.85, 48, 1, true]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
