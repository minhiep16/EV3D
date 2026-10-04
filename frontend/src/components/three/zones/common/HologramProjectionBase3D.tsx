import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HologramProjectionBase3DProps {
  position?: [number, number, number];
  color?: string;
  outerRadius?: number;
  visible?: boolean;
}

/**
 * HologramProjectionBase3D:
 * Standardized 3D Floor Projection Emitter Anchor for Showroom Hologram Panels.
 * Matches the canonical Finance 3D projection base with concentric rings,
 * alloy plinth disc, ambient glow pool, and ascending photonic guide rays.
 */
export const HologramProjectionBase3D: React.FC<HologramProjectionBase3DProps> = ({
  position = [6.5, 0.005, 2.80],
  color = '#00f2fe',
  outerRadius = 1.65,
  visible = true,
}) => {
  const floorRingRef = useRef<THREE.MeshBasicMaterial>(null);
  const floorGlowPoolRef = useRef<THREE.MeshBasicMaterial>(null);
  const lightColumnRef = useRef<THREE.MeshBasicMaterial>(null);

  // Subtle cyclic breathing pulse synchronized with showroom tempo
  useFrame((state) => {
    if (!visible) return;
    const t = state.clock.getElapsedTime();
    if (floorRingRef.current) {
      floorRingRef.current.opacity = 0.5 + Math.sin(t * 2.0) * 0.15;
    }
    if (floorGlowPoolRef.current) {
      floorGlowPoolRef.current.opacity = 0.06 + Math.sin(t * 1.6) * 0.02;
    }
    if (lightColumnRef.current) {
      lightColumnRef.current.opacity = 0.035 + Math.sin(t * 1.8) * 0.012;
    }
  });

  if (!visible) return null;

  return (
    <group position={position} name="HologramProjectionBaseGroup">
      {/* Low-profile dark alloy floor emitter plinth disc */}
      <mesh position={[0, 0.007, 0]} receiveShadow raycast={() => null}>
        <cylinderGeometry args={[0.62, 0.70, 0.016, 32]} />
        <meshStandardMaterial color="#071324" roughness={0.25} metalness={0.88} />
      </mesh>

      {/* Soft radial ambient floor glow pool */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0, outerRadius, 48]} />
        <meshBasicMaterial
          ref={floorGlowPoolRef}
          color={color}
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer subtle concentric projection ring */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[1.35, 1.38, 64]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Main precision cyan floor emitter ring */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[1.05, 1.09, 64]} />
        <meshBasicMaterial
          ref={floorRingRef}
          color={color}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner recessed LED ring on plinth surface */}
      <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0.42, 0.47, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 4 Floor calibration tick marks */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
        <mesh
          key={`base-tick-${idx}`}
          position={[Math.cos(angle) * 1.15, 0.004, Math.sin(angle) * 1.15]}
          rotation={[-Math.PI / 2, 0, angle]}
          raycast={() => null}
        >
          <planeGeometry args={[0.08, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Subtle vertical projection guide cone rising to panel base */}
      <mesh position={[0, 0.05, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.35, 0.15, 0.1, 24, 1, true]} />
        <meshBasicMaterial
          ref={lightColumnRef}
          color={color}
          transparent
          opacity={0.035}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 4 Ascending photonic guide rays */}
      {[-0.24, 0.24].map((rx, i) =>
        [-0.24, 0.24].map((rz, j) => (
          <mesh key={`ray-${i}-${j}`} position={[rx * 0.8, 0.05, rz * 0.8]} raycast={() => null}>
            <cylinderGeometry args={[0.0022, 0.0022, 0.1, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} />
          </mesh>
        ))
      )}
    </group>
  );
};
