import React, { useRef, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GroupMemberResponse } from '../../../types/coOwnership';
import { useWorldStore } from '../../../store/worldStore';
import { INTERACTION_CONFIG } from '../../../config/interactionConfig';

export interface CoOwnerRepresentative3DProps {
  member: GroupMemberResponse;
  position: [number, number, number];
  color?: string;
  onSelect?: (memberId: string) => void;
}

export const CoOwnerRepresentative3D: React.FC<CoOwnerRepresentative3DProps> = ({
  member,
  position,
  color = '#00f2fe',
  onSelect,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringGroupRef = useRef<THREE.Group>(null);
  const glowMeshRef = useRef<THREE.Mesh>(null);
  const avatarGroupRef = useRef<THREE.Group>(null);

  const [isLocalHovered, setIsLocalHovered] = useState(false);
  const [avatarTexture, setAvatarTexture] = useState<THREE.Texture | null>(null);

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

  // Safe texture loading for optional member avatar without React Suspense crash
  useEffect(() => {
    if (!member.avatarUrl) {
      setAvatarTexture(null);
      return;
    }

    let isMounted = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      member.avatarUrl,
      (tex) => {
        if (isMounted) {
          tex.colorSpace = THREE.SRGBColorSpace;
          setAvatarTexture(tex);
        }
      },
      undefined,
      () => {
        if (isMounted) {
          setAvatarTexture(null);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [member.avatarUrl]);

  const hasAvatar = Boolean(avatarTexture);

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

    if (avatarGroupRef.current) {
      const targetScale = isSelected ? 1.2 : isHovered ? 1.12 : 1.0;
      avatarGroupRef.current.scale.lerp(
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
    if ('delta' in e && e.delta > INTERACTION_CONFIG.clickDragThresholdPx) return;
    e.stopPropagation();
    if (onSelect) {
      onSelect(member.id);
    } else {
      selectOwner(isSelected ? null : member.id);
    }
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

      {/* 3. VISUAL REPRESENTATION: AVATAR PORTRAIT vs COLOR ORB FALLBACK */}
      {hasAvatar && avatarTexture ? (
        /* Holographic Portrait Marker (Future Avatar Architecture) */
        <Billboard follow={true}>
          <group ref={avatarGroupRef} position={[0, 0.04, 0]}>
            {/* Circular Avatar Portrait Disc */}
            <mesh
              ref={meshRef}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <circleGeometry args={[0.22, 32]} />
              <meshBasicMaterial
                map={avatarTexture}
                side={THREE.DoubleSide}
                transparent={isDimmed}
                opacity={isDimmed ? 0.45 : 1.0}
              />
            </mesh>

            {/* Subtle Member-Color Holographic Ring */}
            <mesh
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <ringGeometry args={[0.22, 0.25, 48]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isSelected ? 3.0 : isHovered ? 2.2 : 1.2}
                side={THREE.DoubleSide}
                transparent
                opacity={isDimmed ? 0.35 : 0.95}
              />
            </mesh>

            {/* Outer Glow Halo */}
            <mesh>
              <ringGeometry args={[0.25, 0.29, 32]} />
              <meshBasicMaterial
                color={color}
                side={THREE.DoubleSide}
                transparent
                opacity={isSelected ? 0.45 : isHovered ? 0.3 : 0.15}
              />
            </mesh>
          </group>
        </Billboard>
      ) : (
        /* Physical 3D Orb Fallback */
        <>
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

          {/* Glowing Emissive Halo Aura */}
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
        </>
      )}

      {/* 4. Billboard Orientation for 3D Percentage Ring & Spatial Label */}
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

        {/* Subtle Spatial Member Indicator (Name + Percentage, Zero HTML pointer blockage) */}
        <Html
          position={[0.44, 0, 0]}
          center={false}
          distanceFactor={7.5}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: isSelected
                ? 'rgba(7, 20, 38, 0.90)'
                : isHovered
                ? 'rgba(7, 20, 38, 0.80)'
                : 'rgba(7, 20, 38, 0.65)',
              border: `1px solid ${isSelected ? color : 'rgba(255, 255, 255, 0.12)'}`,
              backdropFilter: 'blur(8px)',
              boxShadow: isSelected ? `0 0 12px ${color}40` : '0 2px 8px rgba(0,0,0,0.5)',
              transition: 'all 0.2s ease',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isSelected ? '#ffffff' : '#e2e8f0',
                letterSpacing: '0.01em',
              }}
            >
              {member.fullName}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: color,
                fontFamily: 'monospace',
              }}
            >
              {percentage}%
            </span>
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

export const OwnerOrb3D = CoOwnerRepresentative3D;
