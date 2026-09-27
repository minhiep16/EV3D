import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { DamageSeverity, DamageType, DAMAGE_SEVERITY_CONFIG, DAMAGE_TYPE_LABELS } from '../../../types/damage';
import { INTERACTION_CONFIG } from '../../../config/interactionConfig';

interface DamageMarker3DProps {
  id?: string;
  position: [number, number, number];
  partCode: string;
  damageType?: DamageType;
  severity?: DamageSeverity;
  note?: string;
  isDraft?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export const DamageMarker3D: React.FC<DamageMarker3DProps> = ({
  position,
  partCode,
  damageType,
  severity = 'MINOR',
  isDraft = false,
  isSelected = false,
  onClick,
}) => {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Authoritative severity color mapping
  const severityConfig = DAMAGE_SEVERITY_CONFIG[severity] || DAMAGE_SEVERITY_CONFIG.MINOR;
  const markerColor = isDraft ? '#00f2fe' : severityConfig.color;

  // Pulse animation using refs without per-frame React state updates
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (outerRingRef.current) {
      const pulseSpeed = isDraft ? 5.0 : 3.0;
      const baseScale = isSelected ? 1.4 : isHovered ? 1.25 : 1.0;
      const scale = baseScale + Math.sin(t * pulseSpeed) * 0.18;
      outerRingRef.current.scale.set(scale, scale, scale);
    }
    if (coreRef.current && isDraft) {
      coreRef.current.position.y = 0.04 + Math.sin(t * 6.0) * 0.015;
    }
  });

  const handleClick = (e?: any) => {
    if (e && 'delta' in e && e.delta > INTERACTION_CONFIG.clickDragThresholdPx) return; // Ignore camera orbit drag
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (onClick) onClick();
  };

  const typeLabel = damageType ? DAMAGE_TYPE_LABELS[damageType] : (isDraft ? 'ĐIỂM MỚI' : 'HƯ HỎNG');
  const severityLabel = severityConfig.labelVi;

  return (
    <group position={position}>
      {/* 1. Base Pin Stem / Contact Point */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.006, 0.002, 0.04, 8]} />
        <meshBasicMaterial color={markerColor} />
      </mesh>

      {/* 2. Outer Pulsing Holographic Ring */}
      <mesh
        ref={outerRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.035, 0]}
      >
        <ringGeometry args={[0.045, 0.065, 24]} />
        <meshBasicMaterial
          color={markerColor}
          side={THREE.DoubleSide}
          transparent
          opacity={isDraft ? 0.85 : 0.75}
        />
      </mesh>

      {/* 3. Glowing Center Core Sphere */}
      <mesh
        ref={coreRef}
        position={[0, 0.04, 0]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial
          color={markerColor}
          emissive={markerColor}
          emissiveIntensity={isSelected ? 2.0 : isHovered ? 1.5 : 1.0}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* 4. Clickable Raycast Hit Target (generous sphere for easy 3D clicking) */}
      <mesh
        position={[0, 0.05, 0]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>

      {/* 5. Spatial Label Tag (Interactive 3D HTML Badge) */}
      <Html
        position={[0, 0.14, 0]}
        center
        distanceFactor={6.5}
        style={{
          pointerEvents: 'auto',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s ease',
          transform: isHovered || isSelected ? 'scale(1.12)' : 'scale(1.0)',
          cursor: 'pointer',
        }}
      >
        <div
          onClick={handleClick}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseEnter={() => {
            setIsHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            document.body.style.cursor = 'auto';
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 9px',
            borderRadius: '9999px',
            background: isDraft
              ? 'rgba(6, 182, 212, 0.95)'
              : isSelected
              ? 'rgba(15, 23, 42, 0.98)'
              : 'rgba(15, 23, 42, 0.92)',
            border: isSelected
              ? `1.5px solid #ffffff`
              : `1px solid ${markerColor}`,
            boxShadow: isSelected
              ? `0 0 16px ${markerColor}, 0 0 6px #ffffff`
              : `0 0 12px ${markerColor}66`,
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            fontFamily: 'var(--font-family)',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isSelected ? '#ffffff' : markerColor,
              display: 'inline-block',
              boxShadow: `0 0 6px ${markerColor}`,
            }}
          />
          {isDraft ? (
            <span>ĐIỂM ĐANG CHỌN</span>
          ) : (
            <span>
              {typeLabel} • {severityLabel}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
};
