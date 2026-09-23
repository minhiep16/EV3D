import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HolographicPanelFrame3DProps {
  width?: number;
  height?: number;
  color?: string;
  depth?: number;
}

export const HolographicPanelFrame3D: React.FC<HolographicPanelFrame3DProps> = ({
  width = 2.4,
  height = 2.9,
  color = '#00f2fe',
  depth = -0.05,
}) => {
  const frameRef = useRef<THREE.Group>(null);
  const glowMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const hw = width / 2;
  const hh = height / 2;
  const bracketLen = 0.22;
  const bracketThick = 0.014;

  useFrame((state) => {
    if (glowMatRef.current) {
      // Gentle holographic flicker & pulse
      const pulse = 1.4 + Math.sin(state.clock.elapsedTime * 2.5) * 0.35;
      glowMatRef.current.emissiveIntensity = pulse;
    }
  });

  return (
    <group ref={frameRef} position={[0, 0, depth]}>
      {/* 1. Translucent Hologram Projection Plane */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          color="#031122"
          transparent
          opacity={0.32}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Emissive Corner Brackets */}
      {/* Top-Left Bracket */}
      <group position={[-hw, hh, 0.01]}>
        {/* Horizontal */}
        <mesh position={[bracketLen / 2, 0, 0]}>
          <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
          <meshStandardMaterial
            ref={glowMatRef}
            color={color}
            emissive={color}
            emissiveIntensity={1.8}
          />
        </mesh>
        {/* Vertical */}
        <mesh position={[0, -bracketLen / 2, 0]}>
          <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.8}
          />
        </mesh>
        {/* Corner Node */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[bracketThick * 2.2, bracketThick * 2.2, bracketThick * 2.2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Top-Right Bracket */}
      <group position={[hw, hh, 0.01]}>
        <mesh position={[-bracketLen / 2, 0, 0]}>
          <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.8}
          />
        </mesh>
        <mesh position={[0, -bracketLen / 2, 0]}>
          <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.8}
          />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[bracketThick * 2.2, bracketThick * 2.2, bracketThick * 2.2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Bottom-Left Bracket */}
      <group position={[-hw, -hh, 0.01]}>
        <mesh position={[bracketLen / 2, 0, 0]}>
          <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.8}
          />
        </mesh>
        <mesh position={[0, bracketLen / 2, 0]}>
          <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.8}
          />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[bracketThick * 2.2, bracketThick * 2.2, bracketThick * 2.2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Bottom-Right Bracket */}
      <group position={[hw, -hh, 0.01]}>
        <mesh position={[-bracketLen / 2, 0, 0]}>
          <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.8}
          />
        </mesh>
        <mesh position={[0, bracketLen / 2, 0]}>
          <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.8}
          />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[bracketThick * 2.2, bracketThick * 2.2, bracketThick * 2.2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* 3. Subtle Top Antenna / Status Bead */}
      <mesh position={[0, hh + 0.04, 0.01]}>
        <cylinderGeometry args={[0.015, 0.015, 0.06, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.2}
        />
      </mesh>

      {/* 4. Bottom Emitter Node Lens */}
      <group position={[0, -hh - 0.06, 0.01]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.04, 0.08, 16]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.8}
            roughness={0.2}
            emissive={color}
            emissiveIntensity={0.6}
          />
        </mesh>
        {/* Glow emitter light ring */}
        <mesh position={[0, 0.04, 0]}>
          <torusGeometry args={[0.05, 0.01, 8, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
    </group>
  );
};
