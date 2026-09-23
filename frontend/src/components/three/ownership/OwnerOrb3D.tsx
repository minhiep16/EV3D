import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { GroupMemberResponse } from '../../../types/coOwnership';
import { useWorldStore } from '../../../store/worldStore';
import { User, CheckCircle } from 'lucide-react';

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

  const isSelected = selectedOwnerId === member.id;
  const isHovered = isLocalHovered || hoveredOwnerId === member.id;

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
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      glowMeshRef.current.scale.set(pulse, pulse, pulse);
    }

    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.z += delta * (isSelected ? 0.8 : 0.3);
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsLocalHovered(true);
    hoverOwner(member.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e?: ThreeEvent<PointerEvent>) => {
    if (e) e.stopPropagation();
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
        <cylinderGeometry args={[0.008, 0.008, position[1], 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, -position[1] + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.28, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* 2. Invisible Raycast Hit Volume Sphere (radius 0.65 ensures reliable click on orb or ring) */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.65, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 3. Interactive Physical 3D Orb */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 2.8 : isHovered ? 2.0 : 1.0}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>

      {/* 4. Glowing Emissive Halo Aura */}
      <mesh
        ref={glowMeshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.31, 24, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.45 : isHovered ? 0.35 : 0.18}
          wireframe
        />
      </mesh>

      {/* 5. Billboard Orientation for 3D Percentage Ring & Always-Visible Spatial Label */}
      <Billboard follow={true}>
        {/* Dim Full Track Ring */}
        <mesh
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <ringGeometry args={[0.38, 0.44, 48]} />
          <meshBasicMaterial
            color="rgba(255, 255, 255, 0.12)"
            side={THREE.DoubleSide}
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* 3D Ownership Percentage Arc Ring */}
        <mesh
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <ringGeometry
            args={[0.36, 0.46, 64, 1, -Math.PI / 2, arcLength]}
          />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isSelected ? 3.2 : isHovered ? 2.4 : 1.5}
            side={THREE.DoubleSide}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Selected Highlight Ring */}
        {isSelected && (
          <group ref={ringGroupRef}>
            <mesh>
              <ringGeometry args={[0.52, 0.55, 32]} />
              <meshBasicMaterial
                color="#ffffff"
                side={THREE.DoubleSide}
                transparent
                opacity={0.9}
              />
            </mesh>
          </group>
        )}

        {/* 6. ALWAYS-VISIBLE SPATIAL OWNER LABEL */}
        <Html
          position={[0, 0.65, 0]}
          center
          distanceFactor={8.5}
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            onClick={handleClick}
            onMouseEnter={() => {
              setIsLocalHovered(true);
              hoverOwner(member.id);
            }}
            onMouseLeave={() => {
              setIsLocalHovered(false);
              hoverOwner(null);
            }}
            style={{
              background: isSelected
                ? 'rgba(15, 23, 42, 0.96)'
                : isHovered
                ? 'rgba(15, 23, 42, 0.92)'
                : 'rgba(8, 12, 22, 0.88)',
              backdropFilter: 'blur(16px)',
              border: isSelected
                ? '2px solid #ffffff'
                : isHovered
                ? `1.5px solid ${color}`
                : `1px solid ${color}88`,
              borderRadius: '12px',
              padding: isSelected ? '7px 14px' : '6px 12px',
              color: '#ffffff',
              fontFamily: 'var(--font-family)',
              textAlign: 'center',
              boxShadow: isSelected
                ? `0 10px 28px rgba(0, 0, 0, 0.9), 0 0 24px ${color}`
                : isHovered
                ? `0 8px 24px rgba(0, 0, 0, 0.8), 0 0 16px ${color}80`
                : `0 4px 16px rgba(0, 0, 0, 0.6), 0 0 10px ${color}35`,
              whiteSpace: 'nowrap',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.2s ease',
              transform: isSelected ? 'scale(1.08)' : isHovered ? 'scale(1.04)' : 'scale(1.0)',
            }}
          >
            {/* Owner Full Name */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 700,
                color: isSelected ? '#ffffff' : '#f8fafc',
                letterSpacing: '0.02em',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 6px ${color}`,
                  display: 'inline-block',
                }}
              />
              <span>{member.fullName}</span>
            </div>

            {/* Ownership Percentage */}
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: color,
                letterSpacing: '0.04em',
                lineHeight: 1.1,
              }}
            >
              {percentage}%
            </div>

            {/* Selected Tag */}
            {isSelected && (
              <div
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '6px',
                  padding: '1px 6px',
                  marginTop: '2px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                ĐÃ CHỌN
              </div>
            )}
          </div>
        </Html>
      </Billboard>

      {/* Point Light for physical ambient emission */}
      <pointLight
        color={color}
        intensity={isSelected ? 2.8 : isHovered ? 2.0 : 1.0}
        distance={2.8}
      />
    </group>
  );
};
