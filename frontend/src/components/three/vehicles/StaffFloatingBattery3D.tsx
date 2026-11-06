import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Zap } from 'lucide-react';
import { VehicleResponse } from '../../../types/vehicle';

interface StaffFloatingBattery3DProps {
  vehicle: VehicleResponse;
  position: [number, number, number];
  onSelectModule: () => void;
  isActive: boolean;
}

/**
 * StaffFloatingBattery3D
 * Minimalist, compact 3D battery module (~40% smaller).
 * Clean floating geometry with zero vertical holographic light columns and no redundant rings.
 * Label "PIN & SẠC" revealed strictly on hover/focus/active.
 */
export const StaffFloatingBattery3D: React.FC<StaffFloatingBattery3DProps> = ({
  vehicle,
  position,
  onSelectModule,
  isActive,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const soc = vehicle.currentBatteryLevel ?? 0;
  const clampedSoc = Math.min(100, Math.max(0, soc));
  const fillFraction = clampedSoc / 100;

  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  }, []);

  // Compact dimensions (~40% smaller than previous 0.44 x 0.72 x 0.22)
  const casingW = 0.26;
  const casingH = 0.42;
  const casingD = 0.13;

  const maxFillH = casingH - 0.05;
  const fillH = Math.max(0.02, maxFillH * fillFraction);
  const fillY = -casingH / 2 + 0.025 + fillH / 2;

  // Smooth floating animation
  useFrame((state) => {
    if (prefersReducedMotion || !groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Gentle floating bob
    groupRef.current.position.y = position[1] + Math.sin(t * 1.4) * 0.035;
    // Very subtle idle yaw sway
    groupRef.current.rotation.y = 0.35 + Math.sin(t * 0.7) * 0.05;

    // Smooth hover scale transition
    const targetScale = hovered || isActive ? 1.08 : 1.0;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
  });

  const accentColor = isActive ? '#22e6ff' : hovered ? '#00f2fe' : '#38bdf8';
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
      {/* 1. Single Ultra-Thin Subtle Floor Hologram Ring (No redundant outer rings, no vertical light beams) */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.21, 32]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={isActive ? 0.5 : hovered ? 0.35 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Floating Interactive Compact Battery Unit */}
      <group
        ref={groupRef}
        position={[0, position[1], 0]}
        rotation={[0, 0.35, 0]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* Semi-Transparent Outer Glass Casing */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[casingW, casingH, casingD]} />
          <meshPhysicalMaterial
            color="#081e3d"
            transparent
            opacity={0.38}
            roughness={0.15}
            metalness={0.2}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            reflectivity={0.7}
            transmission={0.6}
            ior={1.4}
          />
        </mesh>

        {/* Luminous Edge Wireframe */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(casingW, casingH, casingD)]} />
          <lineBasicMaterial color={accentColor} transparent opacity={glowOpacity} linewidth={1} />
        </lineSegments>

        {/* Battery Anode & Cathode Terminals on Top */}
        <group position={[0, casingH / 2 + 0.018, 0]}>
          {/* Positive terminal (+) */}
          <mesh position={[-0.065, 0, 0]}>
            <cylinderGeometry args={[0.026, 0.026, 0.035, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-0.065, 0.02, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.012, 16]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>

          {/* Negative terminal (-) */}
          <mesh position={[0.065, 0, 0]}>
            <cylinderGeometry args={[0.026, 0.026, 0.035, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0.065, 0.02, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.012, 16]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>

        {/* Internal Luminous Energy Fill Column (Real Backend SOC %) */}
        <mesh position={[0, fillY, 0]}>
          <boxGeometry args={[casingW - 0.045, fillH, casingD - 0.045]} />
          <meshStandardMaterial
            color={clampedSoc > 20 ? '#00f2fe' : '#ef4444'}
            emissive={clampedSoc > 20 ? '#00f2fe' : '#ef4444'}
            emissiveIntensity={isActive ? 1.4 : hovered ? 1.1 : 0.75}
            transparent
            opacity={0.78}
            roughness={0.25}
            metalness={0.2}
          />
        </mesh>

        {/* Energy Division Lines (25%, 50%, 75%) */}
        {[0.25, 0.5, 0.75].map((tier) => {
          const tierY = -casingH / 2 + 0.025 + maxFillH * tier;
          return (
            <mesh key={tier} position={[0, tierY, 0]}>
              <boxGeometry args={[casingW - 0.035, 0.004, casingD - 0.035]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.25} />
            </mesh>
          );
        })}

        {/* Tooltip Pill: Strictly revealed on Hover / Focus / Selection */}
        {showTooltip && (
          <Billboard position={[0, -casingH / 2 - 0.16, 0]} follow={true}>
            <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <div
                style={{
                  background: isActive
                    ? 'rgba(0, 242, 254, 0.22)'
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
                    ? '0 0 14px rgba(0, 242, 254, 0.45)'
                    : '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 8px rgba(0, 242, 254, 0.2)',
                  whiteSpace: 'nowrap',
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                <Zap size={11} color={accentColor} />
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: '#e2e8f0',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  PIN & SẠC
                </span>
                <span style={{ fontSize: '11px', fontWeight: 900, color: accentColor, lineHeight: 1 }}>
                  {clampedSoc}%
                </span>
              </div>
            </Html>
          </Billboard>
        )}
      </group>
    </group>
  );
};
