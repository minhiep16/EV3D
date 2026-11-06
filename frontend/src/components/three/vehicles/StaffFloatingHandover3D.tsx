import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Key } from 'lucide-react';

interface StaffFloatingHandover3DProps {
  position: [number, number, number];
  onSelectModule: () => void;
  isActive: boolean;
  isEligible?: boolean;
}

export const StaffFloatingHandover3D: React.FC<StaffFloatingHandover3DProps> = ({
  position,
  onSelectModule,
  isActive,
  isEligible = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  }, []);

  useFrame((state) => {
    if (prefersReducedMotion || !groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.3 + 0.5) * 0.04;
    groupRef.current.rotation.y = 0.45 + Math.sin(t * 1.0) * 0.15;
  });

  const accentColor = isActive ? '#10b981' : hovered ? '#00f2fe' : '#34d399';
  const glowOpacity = isActive ? 0.95 : hovered ? 0.85 : 0.6;

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelectModule();
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Floor Hologram Ring on Ground */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.38, 32]} />
        <meshBasicMaterial color={accentColor} transparent opacity={glowOpacity * 0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Vertical Soft Light Beam */}
      <mesh position={[0, (position[1] + 0.2) / 2, 0]}>
        <cylinderGeometry args={[0.14, 0.26, position[1] + 0.2, 20, 1, true]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={isActive ? 0.12 : hovered ? 0.08 : 0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Floating 3D Electronic Keycard */}
      <group
        ref={groupRef}
        position={[0, position[1], 0]}
        rotation={[0.15, 0.45, 0.1]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* Keycard Body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.52, 0.02]} />
          <meshPhysicalMaterial
            color="#071426"
            metalness={0.8}
            roughness={0.25}
            clearcoat={0.9}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Luminous Neon Edge Frame */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(0.34, 0.52, 0.02)]} />
          <lineBasicMaterial color={accentColor} transparent opacity={glowOpacity} />
        </lineSegments>

        {/* Holographic Chip on Card */}
        <mesh position={[0, 0.08, 0.012]}>
          <boxGeometry args={[0.09, 0.09, 0.005]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* RFID Waves Symbol */}
        <mesh position={[0, -0.09, 0.012]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.04, 0.055, 24, 1, 0, Math.PI]} />
          <meshBasicMaterial color={accentColor} side={THREE.DoubleSide} />
        </mesh>

        {/* Interactive Label Billboard */}
        <Billboard position={[0, -0.32, 0]} follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div
              style={{
                background: isActive
                  ? 'rgba(16, 185, 129, 0.25)'
                  : hovered
                  ? 'rgba(11, 28, 54, 0.95)'
                  : 'rgba(7, 20, 38, 0.88)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `1.2px solid ${accentColor}`,
                borderRadius: '10px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isActive
                  ? '0 0 16px rgba(16, 185, 129, 0.5)'
                  : '0 4px 14px rgba(0, 0, 0, 0.4)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Key size={12} color={accentColor} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#e2e8f0', letterSpacing: '0.04em' }}>
                  BÀN GIAO XE
                </span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: isEligible ? '#34d399' : '#94a3b8' }}>
                  {isEligible ? 'Đủ điều kiện' : 'Chưa có lịch'}
                </span>
              </div>
            </div>
          </Html>
        </Billboard>
      </group>
    </group>
  );
};

