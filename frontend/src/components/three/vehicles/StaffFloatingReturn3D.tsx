import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw } from 'lucide-react';

interface StaffFloatingReturn3DProps {
  position: [number, number, number];
  onSelectModule: () => void;
  isActive: boolean;
  hasReturnRequest?: boolean;
}

export const StaffFloatingReturn3D: React.FC<StaffFloatingReturn3DProps> = ({
  position,
  onSelectModule,
  isActive,
  hasReturnRequest = false,
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
    groupRef.current.position.y = position[1] + Math.sin(t * 1.35 + 1.2) * 0.04;
    groupRef.current.rotation.y = -0.45 + Math.sin(t * 1.05) * 0.15;
  });

  const accentColor = hasReturnRequest
    ? '#00f2fe'
    : isActive
    ? '#38bdf8'
    : hovered
    ? '#00f2fe'
    : '#38bdf8';
  const glowOpacity = hasReturnRequest ? 1.0 : isActive ? 0.95 : hovered ? 0.85 : 0.6;

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

      {/* Floating 3D Return Loop Symbol */}
      <group
        ref={groupRef}
        position={[0, position[1], 0]}
        rotation={[0.15, -0.45, -0.1]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* Torus Arc */}
        <mesh castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.16, 0.035, 16, 32, Math.PI * 1.55]} />
          <meshPhysicalMaterial
            color="#e2e8f0"
            metalness={0.85}
            roughness={0.25}
            clearcoat={0.9}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Arrow Head on end of loop */}
        <mesh position={[0.16, 0, 0.03]} rotation={[0, -Math.PI / 2, Math.PI / 4]}>
          <coneGeometry args={[0.07, 0.12, 16]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={hasReturnRequest ? 1.4 : 0.6}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Central Glowing Energy Core */}
        <mesh>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.8} />
        </mesh>

        {/* Holographic Label Billboard */}
        <Billboard position={[0, -0.32, 0]} follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div
              style={{
                background: hasReturnRequest
                  ? 'rgba(0, 242, 254, 0.3)'
                  : isActive
                  ? 'rgba(56, 189, 248, 0.25)'
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
                boxShadow: hasReturnRequest
                  ? '0 0 16px rgba(0, 242, 254, 0.6)'
                  : '0 4px 14px rgba(0, 0, 0, 0.4)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <RotateCcw size={12} color={accentColor} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#e2e8f0', letterSpacing: '0.04em' }}>
                  TRẢ XE
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    color: hasReturnRequest ? '#00f2fe' : '#94a3b8',
                  }}
                >
                  {hasReturnRequest ? 'YÊU CẦU (!)' : 'Sẵn sàng'}
                </span>
              </div>
            </div>
          </Html>
        </Billboard>
      </group>
    </group>
  );
};

