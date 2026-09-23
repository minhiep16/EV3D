import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  HandoverCheckpoint,
  InspectionCondition,
  VehicleInspectionItem,
  INSPECTION_CONDITION_CONFIG,
} from '../../../types/handover';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface HandoverHotspot3DProps {
  checkpoint: HandoverCheckpoint;
  inspection?: VehicleInspectionItem;
  isSelected: boolean;
  onSelect: (code: string) => void;
  canInteract: boolean;
}

export const HandoverHotspot3D: React.FC<HandoverHotspot3DProps> = ({
  checkpoint,
  inspection,
  isSelected,
  onSelect,
  canInteract,
}) => {
  const [hovered, setHovered] = useState(false);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const condition: InspectionCondition | 'PENDING' = inspection?.conditionStatus || 'PENDING';

  // Color mapping based on condition
  const color = React.useMemo(() => {
    if (condition === 'GOOD') return '#10b981';
    if (condition === 'WARNING') return '#f59e0b';
    if (condition === 'DAMAGED') return '#ef4444';
    return '#38bdf8'; // PENDING cyan-blue
  }, [condition]);

  // Pulse & rotation animation in useFrame
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.5;
      const ringScale = 1 + Math.sin(time * 3) * 0.12;
      ringRef.current.scale.set(ringScale, ringScale, 1);
    }

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z -= delta * 0.8;
      const outerScale = 1 + Math.cos(time * 2.5) * 0.18;
      outerRingRef.current.scale.set(outerScale, outerScale, 1);
    }

    if (coreRef.current) {
      const corePulse = 1 + Math.sin(time * 4) * 0.08;
      coreRef.current.scale.set(corePulse, corePulse, corePulse);
    }

    if (groupRef.current) {
      const targetScale = isSelected ? 1.25 : hovered ? 1.15 : 1.0;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 10
      );
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(checkpoint.code);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    if (canInteract) {
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const conditionLabel = React.useMemo(() => {
    if (condition === 'GOOD') return 'Tốt';
    if (condition === 'WARNING') return 'Cảnh báo';
    if (condition === 'DAMAGED') return 'Hư hỏng';
    return 'Chưa kiểm tra';
  }, [condition]);

  const StatusIcon = React.useMemo(() => {
    if (condition === 'GOOD') return CheckCircle2;
    if (condition === 'WARNING') return AlertTriangle;
    if (condition === 'DAMAGED') return XCircle;
    return HelpCircle;
  }, [condition]);

  return (
    <group
      ref={groupRef}
      position={checkpoint.localPosition}
      renderOrder={10}
    >
      {/* 0. Dedicated Invisible 3D Hitbox Sphere for reliable raycasting from all angles */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 1. Core Sphere (Visual only) */}
      <mesh ref={coreRef} raycast={() => null}>
        <sphereGeometry args={[0.075, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 3.0 : hovered ? 2.2 : 1.2}
          roughness={0.2}
        />
      </mesh>

      {/* 2. Inner Rotating Pulsing Ring (Visual only) */}
      <mesh ref={ringRef} raycast={() => null}>
        <ringGeometry args={[0.11, 0.13, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.95 : hovered ? 0.85 : 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Outer Counter-Rotating Ring (Visual only) */}
      <mesh ref={outerRingRef} raycast={() => null}>
        <ringGeometry args={[0.16, 0.175, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.7 : hovered ? 0.5 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. Spatial Label with Hotspot Status (Clickable label forwarding to onSelect) */}
      <Html
        position={[0, 0.22, 0]}
        center
        distanceFactor={7.5}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect(checkpoint.code);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            if (canInteract) {
              document.body.style.cursor = 'pointer';
            }
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
          style={{
            pointerEvents: 'auto',
            cursor: canInteract ? 'pointer' : 'default',
            background: isSelected
              ? 'rgba(8, 12, 22, 0.96)'
              : hovered
              ? 'rgba(15, 23, 42, 0.92)'
              : 'rgba(10, 15, 29, 0.82)',
            backdropFilter: 'blur(12px)',
            border: `1.5px solid ${isSelected ? '#ffffff' : color}`,
            boxShadow: isSelected
              ? `0 0 20px ${color}, 0 4px 16px rgba(0, 0, 0, 0.9)`
              : `0 0 10px ${color}66, 0 4px 12px rgba(0, 0, 0, 0.8)`,
            borderRadius: '9999px',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            transition: 'all 0.18s ease',
            transform: isSelected ? 'scale(1.06)' : hovered ? 'scale(1.04)' : 'none',
          }}
        >
          <StatusIcon size={12} color={color} />
          <span
            style={{
              color: '#ffffff',
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {checkpoint.nameVi}
          </span>
          <span
            style={{
              fontSize: '9.5px',
              fontWeight: 700,
              color: color,
              padding: '1px 5px',
              borderRadius: '4px',
              background: `${color}22`,
            }}
          >
            {conditionLabel}
          </span>
        </div>
      </Html>
    </group>
  );
};
