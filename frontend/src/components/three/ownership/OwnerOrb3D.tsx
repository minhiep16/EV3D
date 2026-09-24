import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { GroupMemberResponse } from '../../../types/coOwnership';
import { useWorldStore } from '../../../store/worldStore';

interface OwnerOrb3DProps {
  member: GroupMemberResponse;
  position: [number, number, number];
  color?: string;
}

export const OwnerOrb3D: React.FC<OwnerOrb3DProps> = ({
  member,
  position,
  color = '#00f2fe',
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringGroupRef = useRef<THREE.Group>(null);
  const glowMeshRef = useRef<THREE.Mesh>(null);

  const [isLocalHovered, setIsLocalHovered] = useState(false);

  const selectedOwnerId = useWorldStore((state) => state.selectedOwnerId);
  const hoveredOwnerId = useWorldStore((state) => state.hoveredOwnerId);
  const selectOwner = useWorldStore((state) => state.selectOwner);
  const hoverOwner = useWorldStore((state) => state.hoverOwner);

  const hasAnySelection = Boolean(selectedOwnerId);
  const isSelected = selectedOwnerId === member.id;
  const isHovered = isLocalHovered || hoveredOwnerId === member.id;
  const isDimmed = hasAnySelection && !isSelected;

  const percentage = member.share?.percentage ?? 0;
  const arcLength = Math.max(0.01, (percentage / 100) * 2 * Math.PI);

  useFrame((state, delta) => {
    // Gentle floating & rotation animation
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (isSelected ? 1.5 : 0.6);
      const targetScale = isSelected ? 1.25 : isHovered ? 1.15 : 1.0;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 6
      );
    }

    if (glowMeshRef.current) {
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 3) * (isSelected ? 0.2 : 0.12);
      glowMeshRef.current.scale.set(pulse, pulse, pulse);
    }

    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.z += delta * (isSelected ? 0.8 : 0.3);
    }
  });

  const handlePointerOver = (e?: ThreeEvent<PointerEvent> | React.MouseEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    setIsLocalHovered(true);
    hoverOwner(member.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e?: ThreeEvent<PointerEvent> | React.MouseEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    setIsLocalHovered(false);
    hoverOwner(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent> | React.MouseEvent) => {
    e.stopPropagation();
    selectOwner(isSelected ? null : member.id);
  };

  return (
    <group position={position}>
      {/* 1. Floor Anchor Beacon Pillar */}
      <mesh position={[0, -position[1] / 2, 0]}>
        <cylinderGeometry args={[0.006, 0.006, position[1], 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isDimmed ? 0.08 : isSelected ? 0.45 : 0.22}
        />
      </mesh>
      <mesh position={[0, -position[1] + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.22, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isDimmed ? 0.08 : isSelected ? 0.4 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Invisible Raycast Hit Volume Sphere (radius 0.55 ensures reliable clicking) */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 3. Interactive Physical 3D Orb */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 3.0 : isHovered ? 2.2 : isDimmed ? 0.35 : 1.1}
          roughness={0.2}
          metalness={0.7}
          transparent={isDimmed}
          opacity={isDimmed ? 0.45 : 1.0}
        />
      </mesh>

      {/* 4. Glowing Emissive Halo Aura */}
      <mesh
        ref={glowMeshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.27, 24, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.5 : isHovered ? 0.35 : isDimmed ? 0.06 : 0.16}
          wireframe
        />
      </mesh>

      {/* 5. Billboard Orientation for 3D Percentage Ring & Horizontal Member Row */}
      <Billboard follow={true}>
        {/* Dim Full Track Ring */}
        <mesh
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <ringGeometry args={[0.30, 0.35, 48]} />
          <meshBasicMaterial
            color="rgba(255, 255, 255, 0.12)"
            side={THREE.DoubleSide}
            transparent
            opacity={isDimmed ? 0.08 : 0.25}
          />
        </mesh>

        {/* 3D Ownership Percentage Arc Ring */}
        <mesh
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <ringGeometry
            args={[0.28, 0.37, 64, 1, -Math.PI / 2, arcLength]}
          />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isSelected ? 3.2 : isHovered ? 2.4 : isDimmed ? 0.4 : 1.5}
            side={THREE.DoubleSide}
            transparent
            opacity={isDimmed ? 0.3 : 0.95}
          />
        </mesh>

        {/* Selected Highlight Ring */}
        {isSelected && (
          <group ref={ringGroupRef}>
            <mesh>
              <ringGeometry args={[0.42, 0.45, 32]} />
              <meshBasicMaterial
                color="#ffffff"
                side={THREE.DoubleSide}
                transparent
                opacity={0.9}
              />
            </mesh>
          </group>
        )}

        {/* 6. HORIZONTAL SPATIAL MEMBER ROW: [Name Label] ● [Percentage] */}
        <Html
          position={[0, 0, 0]}
          center
          distanceFactor={9.0}
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            onClick={handleClick}
            onMouseEnter={handlePointerOver}
            onMouseLeave={handlePointerOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              opacity: isDimmed ? 0.38 : 1.0,
              transition: 'opacity 0.25s ease, transform 0.2s ease',
              transform: isSelected ? 'scale(1.06)' : isHovered ? 'scale(1.03)' : 'scale(1.0)',
            }}
          >
            {/* Owner Full Name Badge on the LEFT of the orb */}
            <div
              style={{
                background: isSelected
                  ? 'rgba(15, 23, 42, 0.96)'
                  : isHovered
                  ? 'rgba(15, 23, 42, 0.90)'
                  : 'rgba(8, 12, 22, 0.84)',
                backdropFilter: 'blur(14px)',
                border: isSelected
                  ? '1.5px solid #ffffff'
                  : isHovered
                  ? `1.5px solid ${color}`
                  : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: isSelected ? '#ffffff' : '#f1f5f9',
                fontFamily: 'var(--font-family)',
                fontSize: '12px',
                fontWeight: isSelected ? 800 : 700,
                boxShadow: isSelected
                  ? `0 0 18px ${color}80, 0 4px 14px rgba(0, 0, 0, 0.7)`
                  : '0 2px 8px rgba(0, 0, 0, 0.5)',
                whiteSpace: 'nowrap',
                textAlign: 'right',
                minWidth: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '6px',
              }}
            >
              <span>{member.fullName}</span>
              {isSelected && (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 0 6px #ffffff',
                    display: 'inline-block',
                  }}
                />
              )}
            </div>

            {/* Clear Center Spacer to reveal physical 3D Orb and Ring */}
            <div style={{ width: '48px', height: '48px', pointerEvents: 'none' }} />

            {/* Ownership Percentage Badge on the RIGHT of the orb */}
            <div
              style={{
                background: isSelected
                  ? `${color}25`
                  : isHovered
                  ? 'rgba(15, 23, 42, 0.90)'
                  : 'rgba(15, 23, 42, 0.84)',
                backdropFilter: 'blur(14px)',
                border: isSelected
                  ? `1.5px solid ${color}`
                  : `1px solid ${color}60`,
                borderRadius: '8px',
                padding: '6px 10px',
                color: color,
                fontFamily: 'var(--font-family)',
                fontSize: '13px',
                fontWeight: 900,
                boxShadow: isSelected ? `0 0 16px ${color}70` : 'none',
                whiteSpace: 'nowrap',
                minWidth: '46px',
                textAlign: 'center',
              }}
            >
              {percentage}%
            </div>
          </div>
        </Html>
      </Billboard>

      {/* Point Light for physical ambient emission */}
      <pointLight
        color={color}
        intensity={isSelected ? 2.8 : isHovered ? 1.8 : isDimmed ? 0.2 : 0.9}
        distance={2.5}
      />
    </group>
  );
};
