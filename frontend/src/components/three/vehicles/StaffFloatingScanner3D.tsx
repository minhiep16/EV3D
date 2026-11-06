import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Scan } from 'lucide-react';

interface StaffFloatingScanner3DProps {
  position: [number, number, number];
  onSelectModule: () => void;
  isActive: boolean;
}

/**
 * StaffFloatingScanner3D
 * Minimalist, compact 3D diagnostic scanner (~40% smaller).
 * Clean hovering pod with zero vertical light columns and no large conical sweep beams.
 * Label "KIỂM TRA 3D" revealed strictly on hover/focus/active.
 */
export const StaffFloatingScanner3D: React.FC<StaffFloatingScanner3DProps> = ({
  position,
  onSelectModule,
  isActive,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const scanRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  }, []);

  useFrame((state) => {
    if (prefersReducedMotion || !groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Gentle floating bob
    groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + 2.0) * 0.025;

    // Continuous rotation of outer scan ring
    if (scanRingRef.current) {
      scanRingRef.current.rotation.z = t * 1.3;
    }

    // Counter-rotation of inner reticle
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -t * 1.8;
    }

    // Smooth hover scale transition
    const targetScale = hovered || isActive ? 1.08 : 1.0;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
  });

  const accentColor = isActive ? '#c084fc' : hovered ? '#00f2fe' : '#38bdf8';
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
      {/* 1. Single Ultra-Thin Subtle Floor Ring (No redundant outer rings, no vertical light beams) */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.165, 32]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={isActive ? 0.5 : hovered ? 0.35 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Floating Interactive Holographic 3D Scanner Device (~40% smaller) */}
      <group
        ref={groupRef}
        position={[0, position[1], 0]}
        rotation={[0.15, 0, 0]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* Main Diagnostic Scanner Body (Metallic Obsidian Pod) */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.07, 32]} />
          <meshPhysicalMaterial
            color="#071426"
            metalness={0.9}
            roughness={0.2}
            clearcoat={1.0}
            clearcoatRoughness={0.08}
            reflectivity={0.85}
          />
        </mesh>

        {/* Top Polished Alloy Bevel Rim */}
        <mesh position={[0, 0.036, 0]}>
          <cylinderGeometry args={[0.092, 0.092, 0.006, 32]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
        </mesh>

        {/* Central Glowing Optical Sensor Emitter (Convex Glass Dome) */}
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.062, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={isActive ? 1.5 : hovered ? 1.2 : 0.75}
            transparent
            opacity={0.88}
            roughness={0.15}
            metalness={0.3}
          />
        </mesh>

        {/* Outer Rotating Luminous Scan Ring */}
        <mesh ref={scanRingRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.14, 0.007, 14, 36]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={isActive ? 1.4 : hovered ? 1.1 : 0.65}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Inner Counter-Rotating Reticle Ring */}
        <mesh ref={innerRingRef} position={[0, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.038, 0.048, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>

        {/* Tooltip Pill: Strictly revealed on Hover / Focus / Selection */}
        {showTooltip && (
          <Billboard position={[0, -0.22, 0]} follow={true}>
            <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <div
                style={{
                  background: isActive
                    ? 'rgba(168, 85, 247, 0.22)'
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
                    ? '0 0 14px rgba(168, 85, 247, 0.45)'
                    : '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 8px rgba(0, 242, 254, 0.2)',
                  whiteSpace: 'nowrap',
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                <Scan size={11} color={accentColor} />
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: '#e2e8f0',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  KIỂM TRA 3D
                </span>
              </div>
            </Html>
          </Billboard>
        )}
      </group>
    </group>
  );
};
