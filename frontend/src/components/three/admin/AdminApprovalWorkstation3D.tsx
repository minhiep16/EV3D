import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../../../store/worldStore';
import { useQuery } from '@tanstack/react-query';
import { onboardingApi } from '../../../services/onboardingApi';
import { FileCheck2, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { DESIGN_TOKENS } from '../../../styles/designTokens';
import { ADMIN_GARAGE_LAYOUT } from '../../../config/adminGarageLayout';

interface AdminApprovalWorkstation3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * AdminApprovalWorkstation3D
 *
 * Slim, physical futuristic kiosk-style workstation for reviewing onboarding applications.
 * Placed in the lower-left foreground of the ADMIN Garage outside the turntable pad, angled towards camera & vehicle.
 * Refactored to use centralized spatial layout configuration from `ADMIN_GARAGE_LAYOUT.approvalWorkstation`.
 *
 * Features:
 * - White & metallic silver pedestal column
 * - Angled dark glass touchscreen display
 * - Cyan illuminated edge accents and ground glow
 * - Subtle floating 3D holographic document/clipboard icon
 * - Interactive compact floating UI badge with live pending count
 */
export const AdminApprovalWorkstation3D: React.FC<AdminApprovalWorkstation3DProps> = ({
  position = ADMIN_GARAGE_LAYOUT.approvalWorkstation.position,
  rotation = ADMIN_GARAGE_LAYOUT.approvalWorkstation.rotation,
}) => {
  const adminActiveModule = useWorldStore((state) => state.adminActiveModule);
  const setAdminActiveModule = useWorldStore((state) => state.setAdminActiveModule);

  const isSelected = adminActiveModule === 'APPLICATION_REVIEW';
  const [hovered, setHovered] = useState(false);

  // TanStack Query for authoritative pending applications count
  const { data: pendingApps = [] } = useQuery({
    queryKey: ['staffApplications', 'PENDING'],
    queryFn: () => onboardingApi.getStaffApplications('PENDING'),
    staleTime: 10000,
    refetchInterval: 15000,
  });
  const pendingCount = pendingApps.length;

  // Refs for gentle animations
  const holoIconRef = useRef<THREE.Group>(null);
  const groundRingRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const t = state.clock.getElapsedTime();

    if (holoIconRef.current) {
      // Gentle floating hover & subtle rotation
      holoIconRef.current.position.y = 1.34 + Math.sin(t * 2.2) * 0.025;
      holoIconRef.current.rotation.y = Math.sin(t * 0.8) * 0.18;
    }

    if (groundRingRef.current) {
      const mat = groundRingRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        const pulseBase = isSelected ? 0.65 : hovered ? 0.45 : 0.25;
        mat.opacity = pulseBase + Math.sin(t * 3.0) * 0.12;
      }
    }
  });

  const handleClick = (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setAdminActiveModule(isSelected ? 'NONE' : 'APPLICATION_REVIEW');
  };

  // Color constants
  const cyanColor = DESIGN_TOKENS.cyan; // #00D9FF
  const activeColor = isSelected ? '#10E6A3' : hovered ? '#00E5FF' : cyanColor;
  const amberColor = '#F59E0B';

  return (
    <group
      name="AdminApprovalWorkstation3D"
      position={position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 1. Ground Ambient Light Projection Ring */}
      <mesh
        ref={groundRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.015, 0]}
      >
        <ringGeometry args={[0.42, 0.54, 32]} />
        <meshBasicMaterial
          color={pendingCount > 0 ? amberColor : cyanColor}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Workstation Base Plate */}
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.38, 0.42, 0.07, 32]} />
        <meshStandardMaterial
          color="#1E293B"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>
      {/* Base Cyan Glowing Accent Bezel */}
      <mesh position={[0, 0.065, 0]}>
        <cylinderGeometry args={[0.382, 0.382, 0.012, 32]} />
        <meshBasicMaterial color={activeColor} />
      </mesh>

      {/* 3. Sleek Pedestal Vertical Column (Tapered upward, angled posture) */}
      <group position={[0, 0.52, -0.02]} rotation={[-0.14, 0, 0]}>
        {/* Main Column Core - Pearlescent White / Brushed Metal */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.18, 0.88, 0.12]} />
          <meshStandardMaterial
            color="#E2E8F0"
            metalness={0.65}
            roughness={0.2}
          />
        </mesh>

        {/* Dark Contrast Spine on Back */}
        <mesh position={[0, 0, -0.062]}>
          <boxGeometry args={[0.14, 0.86, 0.015]} />
          <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.3} />
        </mesh>

        {/* Left Glowing LED Groove */}
        <mesh position={[-0.092, 0, 0]}>
          <boxGeometry args={[0.008, 0.84, 0.04]} />
          <meshBasicMaterial color={activeColor} />
        </mesh>

        {/* Right Glowing LED Groove */}
        <mesh position={[0.092, 0, 0]}>
          <boxGeometry args={[0.008, 0.84, 0.04]} />
          <meshBasicMaterial color={activeColor} />
        </mesh>
      </group>

      {/* 4. Console Head Bracket & Angled Touchscreen Display */}
      {/* Positioned at ergonomic standing height (~1.0m to 1.15m), angled 38° for ideal line of sight */}
      <group position={[0, 0.98, 0.08]} rotation={[-Math.PI / 5.2, 0, 0]}>
        {/* Back Housing Bracket */}
        <mesh position={[0, 0, -0.025]}>
          <boxGeometry args={[0.56, 0.38, 0.04]} />
          <meshStandardMaterial
            color="#0F172A"
            metalness={0.88}
            roughness={0.25}
          />
        </mesh>

        {/* Chrome Chamfer Edge Trim */}
        <mesh position={[0, 0, -0.005]}>
          <boxGeometry args={[0.57, 0.39, 0.008]} />
          <meshStandardMaterial
            color="#CBD5E1"
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>

        {/* Dark Screen Surface with Internal Emission */}
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[0.52, 0.34]} />
          <meshPhysicalMaterial
            color="#041220"
            emissive="#003554"
            emissiveIntensity={isSelected ? 0.7 : 0.4}
            roughness={0.1}
            metalness={0.3}
            clearcoat={1.0}
            clearcoatRoughness={0.08}
          />
        </mesh>

        {/* Screen Bottom Illuminated Trim Line */}
        <mesh position={[0, -0.165, 0.008]}>
          <planeGeometry args={[0.48, 0.006]} />
          <meshBasicMaterial color={activeColor} />
        </mesh>

        {/* Local Screen Glow Light */}
        <pointLight
          color={activeColor}
          intensity={isSelected ? 1.0 : hovered ? 0.75 : 0.45}
          distance={1.6}
          decay={2}
          position={[0, 0, 0.12]}
        />
      </group>

      {/* 5. Floating 3D Holographic Document Icon */}
      <group ref={holoIconRef} position={[0, 1.34, 0.04]}>
        {/* Holographic Document Sheet */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.16, 0.22, 0.006]} />
          <meshPhysicalMaterial
            color={activeColor}
            emissive={activeColor}
            emissiveIntensity={0.65}
            transparent
            opacity={0.45}
            roughness={0.1}
            transmission={0.6}
            thickness={0.05}
          />
        </mesh>

        {/* Document Clip Top */}
        <mesh position={[0, 0.105, 0.006]}>
          <boxGeometry args={[0.07, 0.024, 0.012]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive={activeColor}
            emissiveIntensity={0.8}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Futuristic Laser Text Lines on Document */}
        <mesh position={[0, 0.035, 0.005]}>
          <planeGeometry args={[0.11, 0.01]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 0.005, 0.005]}>
          <planeGeometry args={[0.11, 0.01]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.7} />
        </mesh>
        <mesh position={[-0.018, -0.025, 0.005]}>
          <planeGeometry args={[0.075, 0.01]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.6} />
        </mesh>

        {/* Subtle holographic checkmark accent */}
        <mesh position={[0.035, -0.055, 0.006]}>
          <ringGeometry args={[0.016, 0.022, 16]} />
          <meshBasicMaterial color={pendingCount > 0 ? amberColor : '#10E6A3'} />
        </mesh>
      </group>

      {/* 6. Compact Floating UI Label */}
      <Html
        position={[0, ADMIN_GARAGE_LAYOUT.approvalWorkstation.labelOffsetY, 0]}
        center
        distanceFactor={ADMIN_GARAGE_LAYOUT.approvalWorkstation.distanceFactor}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: 'auto', userSelect: 'none' }}
      >
        <div
          onClick={handleClick}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 14px',
            borderRadius: '24px',
            background: isSelected
              ? 'linear-gradient(135deg, rgba(8, 28, 48, 0.98), rgba(16, 42, 67, 0.98))'
              : hovered
              ? 'linear-gradient(135deg, rgba(8, 28, 48, 0.95), rgba(14, 38, 62, 0.95))'
              : 'rgba(8, 28, 48, 0.88)',
            border: isSelected
              ? `1.8px solid ${pendingCount > 0 ? amberColor : cyanColor}`
              : hovered
              ? '1.5px solid #00D9FF'
              : '1.2px solid rgba(0, 217, 255, 0.45)',
            boxShadow: isSelected
              ? `0 0 24px ${pendingCount > 0 ? 'rgba(245, 158, 11, 0.6)' : 'rgba(0, 217, 255, 0.6)'}, 0 8px 20px rgba(0,0,0,0.8)`
              : hovered
              ? '0 0 16px rgba(0, 217, 255, 0.45), 0 6px 16px rgba(0,0,0,0.7)'
              : '0 4px 14px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            whiteSpace: 'nowrap',
          }}
        >
          {/* Workstation Icon */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: pendingCount > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 217, 255, 0.2)',
              border: `1.2px solid ${pendingCount > 0 ? amberColor : cyanColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: pendingCount > 0 ? amberColor : cyanColor,
              flexShrink: 0,
            }}
          >
            <FileCheck2 size={15} />
          </div>

          {/* Texts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 900,
                  letterSpacing: '0.03em',
                  color: isSelected ? '#FFFFFF' : '#F1F5F9',
                  textTransform: 'uppercase',
                }}
              >
                XÉT DUYỆT HỒ SƠ
              </span>
              {pendingCount > 0 && (
                <span
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#000000',
                    fontSize: '9px',
                    fontWeight: 900,
                    borderRadius: '10px',
                    padding: '1px 6px',
                    boxShadow: '0 0 8px rgba(245, 158, 11, 0.7)',
                    lineHeight: 1.2,
                  }}
                >
                  {pendingCount} chờ duyệt
                </span>
              )}
            </div>
            <div style={{ fontSize: '9.5px', fontWeight: 600, color: '#94A3B8' }}>
              {pendingCount > 0 ? 'Hồ sơ phương tiện mới gửi' : 'Hệ thống thẩm định hồ sơ'}
            </div>
          </div>

          {/* Chevron indicator */}
          <div style={{ color: pendingCount > 0 ? amberColor : cyanColor, opacity: 0.8, display: 'flex' }}>
            <ChevronRight size={14} />
          </div>
        </div>
      </Html>
    </group>
  );
};
