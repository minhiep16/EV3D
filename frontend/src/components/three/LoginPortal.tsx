import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LoginPortalProps {
  activated: boolean;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ activated }) => {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const midRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    const speedMultiplier = activated ? 8 : 1;

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.4 * speedMultiplier;
    }
    if (midRingRef.current) {
      midRingRef.current.rotation.z -= delta * 0.6 * speedMultiplier;
      midRingRef.current.rotation.y += delta * 0.2 * speedMultiplier;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z += delta * 1.0 * speedMultiplier;
    }
    if (coreRef.current) {
      const scale = activated ? 1.8 + Math.sin(Date.now() * 0.01) * 0.2 : 1 + Math.sin(Date.now() * 0.003) * 0.1;
      coreRef.current.scale.set(scale, scale, scale);
    }
    if (lightRef.current) {
      lightRef.current.intensity = activated
        ? THREE.MathUtils.lerp(lightRef.current.intensity, 15, delta * 3)
        : 3 + Math.sin(Date.now() * 0.004) * 1.5;
    }
  });

  return (
    <group position={[0, 1.5, -4]}>
      {/* Central energy glow light */}
      <pointLight
        ref={lightRef}
        color={activated ? '#00f2fe' : '#38bdf8'}
        intensity={3}
        distance={15}
      />

      {/* Outer Torus Ring */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[3.2, 0.05, 16, 64]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#00f2fe"
          emissiveIntensity={activated ? 4 : 1.2}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Mid Segmented Ring */}
      <mesh ref={midRingRef}>
        <torusGeometry args={[2.5, 0.08, 16, 32]} />
        <meshStandardMaterial
          color="#1e293b"
          emissive="#38bdf8"
          emissiveIntensity={activated ? 5 : 0.8}
          wireframe
        />
      </mesh>

      {/* Inner Fast Ring */}
      <mesh ref={innerRingRef}>
        <torusGeometry args={[1.8, 0.04, 16, 48]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#67e8f9"
          emissiveIntensity={activated ? 6 : 1.5}
          roughness={0.1}
          metalness={1}
        />
      </mesh>

      {/* Portal Event Horizon / Core */}
      <mesh ref={coreRef}>
        <circleGeometry args={[1.6, 32]} />
        <meshBasicMaterial
          color={activated ? '#ffffff' : '#0369a1'}
          transparent
          opacity={activated ? 0.9 : 0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ambient Floor Glow Disc */}
      <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4, 32]} />
        <meshBasicMaterial
          color="#0284c7"
          transparent
          opacity={activated ? 0.4 : 0.15}
        />
      </mesh>
    </group>
  );
};
