import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export const WorldLoader: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 1.5;
      meshRef.current.rotation.y += delta * 2;
    }
  });

  return (
    <group position={[0, 1.5, 0]}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#00f2fe"
          emissiveIntensity={1.5}
          wireframe
        />
      </mesh>
      <Html center distanceFactor={8} position={[0, -1.8, 0]}>
        <div
          style={{
            color: '#38bdf8',
            fontFamily: 'var(--font-family)',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background: 'rgba(8, 12, 22, 0.8)',
            padding: '6px 14px',
            borderRadius: '9999px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          Đang tải không gian 3D...
        </div>
      </Html>
    </group>
  );
};
