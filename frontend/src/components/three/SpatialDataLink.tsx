import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SpatialDataLinkProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  pulseSpeed?: number;
  thickness?: number;
}

export const SpatialDataLink: React.FC<SpatialDataLinkProps> = ({
  start,
  end,
  color = '#00f2fe',
  pulseSpeed = 1.4,
  thickness = 0.018,
}) => {
  const pulseNodeRef = useRef<THREE.Mesh>(null);

  const startVec = useMemo(
    () => new THREE.Vector3(...start),
    [start[0], start[1], start[2]]
  );
  const endVec = useMemo(
    () => new THREE.Vector3(...end),
    [end[0], end[1], end[2]]
  );

  const { length, midPoint, orientation } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(endVec, startVec);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);

    const normDir = len > 0.001 ? dir.clone().normalize() : new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      normDir
    );

    return { length: Math.max(len, 0.01), midPoint: mid, orientation: quat };
  }, [startVec, endVec]);

  useFrame((state) => {
    const t = (state.clock.elapsedTime * pulseSpeed) % 1;
    if (pulseNodeRef.current) {
      pulseNodeRef.current.position.lerpVectors(startVec, endVec, t);
    }
  });

  return (
    <group>
      {/* 1. Core Glowing Laser Beam */}
      <mesh position={midPoint} quaternion={orientation} raycast={() => null}>
        <cylinderGeometry args={[thickness, thickness, length, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.0}
          transparent
          opacity={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* 2. Outer Beam Halo */}
      <mesh position={midPoint} quaternion={orientation} raycast={() => null}>
        <cylinderGeometry args={[thickness * 2.4, thickness * 2.4, length, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Start Terminal Beacon Node */}
      <mesh position={startVec} raycast={() => null}>
        <sphereGeometry args={[thickness * 3.4, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.6}
        />
      </mesh>

      {/* 4. End Target Beacon Node */}
      <mesh position={endVec} raycast={() => null}>
        <sphereGeometry args={[thickness * 2.8, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.2}
        />
      </mesh>

      {/* 5. Animated Energy Pulse Node traveling along beam */}
      <mesh ref={pulseNodeRef} raycast={() => null}>
        <sphereGeometry args={[thickness * 3.0, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
      </mesh>
    </group>
  );
};
