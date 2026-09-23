import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { PieChart } from 'lucide-react';

interface CentralOwnershipTotal3DProps {
  totalPercentage: number;
  availablePercentage: number;
  position?: [number, number, number];
}

export const CentralOwnershipTotal3D: React.FC<CentralOwnershipTotal3DProps> = ({
  totalPercentage,
  availablePercentage,
  position = [0, 2.35, 0],
}) => {
  const ringRef = useRef<THREE.Group>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.25;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 0.4;
    }
  });

  const isFull = totalPercentage >= 100;
  const mainColor = isFull ? '#00f2fe' : '#a855f7';
  const arcLength = Math.max(0.01, (totalPercentage / 100) * 2 * Math.PI);

  return (
    <group position={position}>
      {/* 1. Physical 3D Holographic Radial Gauge Rings floating in space */}
      <group ref={ringRef}>
        {/* Horizontal Outer Base Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.35, 0.015, 16, 64]} />
          <meshStandardMaterial
            color={mainColor}
            emissive={mainColor}
            emissiveIntensity={1.4}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Horizontal Percentage Arc Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.22, 1.34, 64, 1, -Math.PI / 2, arcLength]} />
          <meshStandardMaterial
            color={mainColor}
            emissive={mainColor}
            emissiveIntensity={2.2}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Dim Background Track */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.22, 1.34, 64]} />
          <meshBasicMaterial
            color="#0f172a"
            side={THREE.DoubleSide}
            transparent
            opacity={0.4}
          />
        </mesh>
      </group>

      {/* 2. Floating Spatial HUD Billboard for Total Ownership Status */}
      <Billboard follow={true} position={[0, 0.35, 0]}>
        <Html
          center
          distanceFactor={9.0}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            style={{
              background: 'rgba(8, 12, 22, 0.92)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${mainColor}`,
              borderRadius: '14px',
              padding: '10px 18px',
              color: '#ffffff',
              fontFamily: 'var(--font-family)',
              textAlign: 'center',
              boxShadow: `0 10px 30px rgba(0, 0, 0, 0.7), 0 0 25px ${mainColor}40`,
              whiteSpace: 'nowrap',
            }}
          >
            {/* Header Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10px',
                fontWeight: 700,
                color: mainColor,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              <PieChart size={12} color={mainColor} />
              TỔNG TỶ LỆ SỞ HỮU
            </div>

            {/* Percentage Display */}
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                textShadow: `0 0 12px ${mainColor}`,
                lineHeight: 1.1,
              }}
            >
              {totalPercentage}%
            </div>

            {/* Allocation Status */}
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: isFull ? '#34d399' : '#fbbf24',
                marginTop: '4px',
                letterSpacing: '0.04em',
              }}
            >
              {isFull ? '● ĐÃ PHÂN BỔ HOÀN TOÀN' : `● CÒN LẠI ${availablePercentage}%`}
            </div>
          </div>
        </Html>
      </Billboard>
    </group>
  );
};
