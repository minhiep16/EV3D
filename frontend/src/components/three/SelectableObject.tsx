import React, { useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../../store/worldStore';
import { CheckCircle2 } from 'lucide-react';

export interface SelectableObjectProps {
  id: string;
  name: string;
  type: 'cube' | 'sphere' | 'cylinder';
  position: [number, number, number];
  baseColor: string;
}

export const SelectableObject: React.FC<SelectableObjectProps> = ({
  id,
  name,
  type,
  position,
  baseColor,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const selectedObjectId = useWorldStore((state) => state.selectedObjectId);
  const hoveredObjectId = useWorldStore((state) => state.hoveredObjectId);
  const selectObject = useWorldStore((state) => state.selectObject);
  const hoverObject = useWorldStore((state) => state.hoverObject);

  const isSelected = selectedObjectId === id;
  const isHovered = hoveredObjectId === id;

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Idle rotation
    meshRef.current.rotation.y += delta * 0.5;

    // Target scale based on state
    const targetScale = isSelected ? 1.12 : isHovered ? 1.06 : 1.0;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 10
    );

    // Selected ground halo animation
    if (ringRef.current && isSelected) {
      ringRef.current.rotation.z += delta * 1.5;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectObject(id, position);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoverObject(id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (hoveredObjectId === id) {
      hoverObject(null);
    }
    document.body.style.cursor = 'auto';
  };

  // Determine emissive color and intensity
  const emissiveColor = isSelected ? '#00f2fe' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 1.8 : isHovered ? 0.7 : 0;

  return (
    <group position={position}>
      {/* 3D Primitive Object */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {type === 'cube' && <boxGeometry args={[1.5, 1.5, 1.5]} />}
        {type === 'sphere' && <sphereGeometry args={[0.9, 32, 32]} />}
        {type === 'cylinder' && <cylinderGeometry args={[0.7, 0.7, 1.6, 32]} />}

        <meshStandardMaterial
          color={baseColor}
          roughness={0.25}
          metalness={0.7}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Selected Indicator Halo beneath the object */}
      {isSelected && (
        <mesh
          ref={ringRef}
          position={[0, -0.65, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[1.2, 1.35, 32]} />
          <meshBasicMaterial
            color="#00f2fe"
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* World-space spatial label displayed only when selected */}
      {isSelected && (
        <Html
          position={[0, 1.6, 0]}
          center
          distanceFactor={9}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            style={{
              background: 'rgba(10, 15, 29, 0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 242, 254, 0.4)',
              borderRadius: '12px',
              padding: '10px 16px',
              color: '#ffffff',
              fontFamily: 'var(--font-family)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: '#ffffff',
                textTransform: 'uppercase',
              }}
            >
              {name}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '0.04em',
              }}
            >
              <CheckCircle2 size={12} color="#00f2fe" />
              Selected
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
