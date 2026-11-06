import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Wrench } from 'lucide-react';

interface StaffFloatingWrench3DProps {
  position: [number, number, number];
  onSelectModule: () => void;
  isActive: boolean;
  damagesCount?: number;
}

/**
 * StaffFloatingWrench3D
 * Minimalist, compact metallic 3D wrench (~40% smaller).
 * Clean floating tool with zero vertical light columns and no redundant wireframe halos.
 * Label "BẢO DƯỠNG" revealed strictly on hover/focus/active.
 */
export const StaffFloatingWrench3D: React.FC<StaffFloatingWrench3DProps> = ({
  position,
  onSelectModule,
  isActive,
  damagesCount = 0,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  }, []);

  // Controlled floating & subtle yaw rotation
  useFrame((state) => {
    if (prefersReducedMotion || !groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Gentle bob
    groupRef.current.position.y = position[1] + Math.sin(t * 1.3 + 1.0) * 0.035;
    // Gentle back-and-forth rotation around Y
    groupRef.current.rotation.y = -0.35 + Math.sin(t * 1.0) * 0.16;
    // Slight pitch tilt
    groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.05;

    // Smooth hover scale transition
    const targetScale = hovered || isActive ? 1.08 : 1.0;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
  });

  const accentColor = isActive ? '#f59e0b' : hovered ? '#00f2fe' : '#38bdf8';
  const glowOpacity = isActive ? 0.9 : hovered ? 0.75 : 0.45;

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

  const showTooltip = hovered || isActive;

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* 1. Single Ultra-Thin Subtle Floor Ring (No redundant outer rings, no vertical light columns) */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.21, 32]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={isActive ? 0.5 : hovered ? 0.35 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Floating Interactive Compact Stylized Wrench Tool */}
      <group
        ref={groupRef}
        position={[0, position[1], 0]}
        rotation={[0, -0.35, 0]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* --- Compact Wrench 3D Geometry (~40% smaller) --- */}
        {/* Central Handle Shaft */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.042, 0.28, 0.015]} />
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.92}
            roughness={0.18}
            envMapIntensity={0.8}
          />
        </mesh>

        {/* Handle Cyan Accent Channel Inset */}
        <mesh position={[0, 0, 0.008]}>
          <boxGeometry args={[0.02, 0.22, 0.002]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={isActive ? 0.9 : hovered ? 0.6 : 0.2}
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>

        {/* Top Open-End Wrench Head */}
        <group position={[0, 0.15, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.018, 24]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
          </mesh>
          {/* Jaw Cutout */}
          <mesh position={[0, 0.028, 0]}>
            <boxGeometry args={[0.04, 0.055, 0.02]} />
            <meshBasicMaterial color="#071426" />
          </mesh>
          {/* Left jaw prong */}
          <mesh position={[-0.03, 0.03, 0]}>
            <boxGeometry args={[0.018, 0.05, 0.018]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
          </mesh>
          {/* Right jaw prong */}
          <mesh position={[0.03, 0.03, 0]}>
            <boxGeometry args={[0.018, 0.05, 0.018]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
          </mesh>
        </group>

        {/* Bottom Ring / Closed-End Wrench Head */}
        <group position={[0, -0.15, 0]}>
          <mesh castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.045, 0.014, 16, 24]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
          </mesh>
          {/* Interior Star teeth ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.03, 0.044, 12]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.55} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Unobtrusive Micro-Pip for Recorded Damages (Only if damagesCount > 0) */}
        {damagesCount > 0 && (
          <mesh position={[0, 0.06, 0.01]}>
            <sphereGeometry args={[0.009, 12, 12]} />
            <meshBasicMaterial color="#f87171" />
          </mesh>
        )}

        {/* Tooltip Pill: Strictly revealed on Hover / Focus / Selection */}
        {showTooltip && (
          <Billboard position={[0, -0.24, 0]} follow={true}>
            <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <div
                style={{
                  background: isActive
                    ? 'rgba(245, 158, 11, 0.22)'
                    : 'rgba(7, 20, 38, 0.92)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: `1px solid ${accentColor}`,
                  borderRadius: '8px',
                  padding: '3px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: isActive
                    ? '0 0 14px rgba(245, 158, 11, 0.45)'
                    : '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 8px rgba(245, 158, 11, 0.2)',
                  whiteSpace: 'nowrap',
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                <Wrench size={11} color={accentColor} />
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: '#e2e8f0',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  BẢO DƯỠNG
                </span>
                {damagesCount > 0 && (
                  <span style={{ fontSize: '10.5px', fontWeight: 900, color: '#f87171', lineHeight: 1 }}>
                    ({damagesCount})
                  </span>
                )}
              </div>
            </Html>
          </Billboard>
        )}
      </group>
    </group>
  );
};
