import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminDashboardStats } from '../../../services/adminApi';
import { fetchVehicleCoOwnership } from '../../../services/coOwnershipApi';
import { fetchVehicles } from '../../../services/vehicleApi';
import { VehicleResponse } from '../../../types/vehicle';
import { resolveVehicleCode, resolveVehicleDisplayName, isMatchingVehicle } from '../vehicles/vehicleModelConfig';
import {
  Users,
  Car,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Crown,
  CreditCard,
} from 'lucide-react';
import { DESIGN_TOKENS, EV_MEMBER_PALETTE } from '../../../styles/designTokens';
import { AdminApprovalWorkstation3D } from './AdminApprovalWorkstation3D';

export const MEMBER_PALETTE = EV_MEMBER_PALETTE;

/**
 * Deterministically assigns a stable identity color to a member based on unique ID / key,
 * guaranteeing identical colors across 3D holograms, labels, donut charts, legends, and lists.
 */
export const getStableMemberColor = (
  member: { id?: string; userId?: string; fullName?: string },
  allMembers?: Array<{ id?: string; userId?: string; fullName?: string }>
): string => {
  const memberKey = member?.userId || member?.id || member?.fullName || '';
  if (!memberKey) return MEMBER_PALETTE[0];

  if (allMembers && allMembers.length > 0) {
    const sortedKeys = Array.from(
      new Set(allMembers.map((m) => m?.userId || m?.id || m?.fullName || '').filter(Boolean))
    ).sort();
    const idx = sortedKeys.indexOf(memberKey);
    if (idx !== -1) {
      return MEMBER_PALETTE[idx % MEMBER_PALETTE.length];
    }
  }

  let hash = 0;
  for (let i = 0; i < memberKey.length; i++) {
    hash = (hash << 5) - hash + memberKey.charCodeAt(i);
    hash |= 0;
  }
  return MEMBER_PALETTE[Math.abs(hash) % MEMBER_PALETTE.length];
};

/**
 * Standardized Shared Configuration for Admin Horizontal Station Row Layout
 * Positions all three stations in a shallow symmetrical arc behind the vehicle.
 * Flanking stations (Left & Right) are brought forward toward camera by 0.75m for natural depth.
 */
export const ADMIN_STATIONS_CONFIG = {
  rowZ: -3.6,
  arcDepthOffset: 0.75,
  leftZ: -2.85,
  centerZ: -3.6,
  rightZ: -2.85,
  elevationY: 1.25,
  spacingX: 4.5,
  crystal: {
    radius: 0.88,
    height: 1.15,
  },
  label: {
    width: '224px',
    height: '50px',
    offsetY: 2.05, // Top-anchored above crystal enclosure (crystal top at local y ~ 1.81)
    offsetZ: 0.15, // Forward offset for clear depth separation
  },
} as const;

interface StationPodiumProps {
  position: [number, number, number];
  color: string;
  glowColor: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isSelected: boolean;
  onSelect: () => void;
  labelWidth?: string;
  labelOffsetY?: number;
  labelOffsetZ?: number;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

const ARC_COUNT = 4;
const SEGMENTS_PER_ARC = 8;
const PARTICLE_COUNT = 40;

/**
 * Upward Procedural Electrical Energy Projection
 * Replaces all physical pedestals with animated electrical energy projected from the floor.
 * Includes luminous floor rings, ascending particle stream, branching electrical arcs, and vertical energy beam.
 */
const StationEnergyProjection: React.FC<{
  color: string;
  glowColor: string;
  isSelected: boolean;
  isHovered: boolean;
}> = ({ color, glowColor, isSelected, isHovered }) => {
  const arcGeometryRef = useRef<THREE.BufferGeometry>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const coreBeamRef = useRef<THREE.Mesh>(null);

  // Pre-allocate arc positions buffer: ARC_COUNT arcs * SEGMENTS_PER_ARC * 2 vertices * 3 coords
  const arcPositions = useMemo(() => {
    return new Float32Array(ARC_COUNT * SEGMENTS_PER_ARC * 2 * 3);
  }, []);

  // Pre-allocate particle initial states
  const particlesData = useMemo(() => {
    const data = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 0.25 + Math.random() * 0.45;
      const angle = Math.random() * Math.PI * 2;
      const y = -1.24 + Math.random() * 1.50;
      const speed = 0.45 + Math.random() * 0.55;
      data.push({ radius, angle, y, speed });
    }
    return data;
  }, []);

  const particlePositions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const { radius, angle, y } = particlesData[i];
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, [particlesData]);

  useFrame(({ clock }, delta) => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const t = clock.getElapsedTime();

    // 1. Update procedural electric arcs traveling upward
    if (arcGeometryRef.current) {
      let ptr = 0;
      const floorY = -1.24;
      const topY = 0.26;
      const totalH = topY - floorY;

      for (let a = 0; a < ARC_COUNT; a++) {
        const baseAngle = (a / ARC_COUNT) * Math.PI * 2 + t * 0.4;
        const seed = a * 13.37;

        let prevX = Math.cos(baseAngle) * 0.65;
        let prevY = floorY;
        let prevZ = Math.sin(baseAngle) * 0.65;

        for (let s = 1; s <= SEGMENTS_PER_ARC; s++) {
          const frac = s / SEGMENTS_PER_ARC;
          const currY = floorY + frac * totalH;
          const r = THREE.MathUtils.lerp(0.65, 0.55, frac);

          // Crackling jitter displacement
          const jitter = Math.sin(t * 14 + seed + s * 4) * 0.055 * (1 - Math.abs(frac - 0.5) * 1.2);
          const currAngle = baseAngle + Math.sin(t * 8 + s * 2 + seed) * 0.22;
          const currX = Math.cos(currAngle) * (r + jitter);
          const currZ = Math.sin(currAngle) * (r + jitter);

          arcPositions[ptr++] = prevX;
          arcPositions[ptr++] = prevY;
          arcPositions[ptr++] = prevZ;

          arcPositions[ptr++] = currX;
          arcPositions[ptr++] = currY;
          arcPositions[ptr++] = currZ;

          prevX = currX;
          prevY = currY;
          prevZ = currZ;
        }
      }

      arcGeometryRef.current.attributes.position.needsUpdate = true;
    }

    // 2. Update ascending energy particles
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particlesData[i];
        p.y += p.speed * delta;
        p.angle += delta * 0.75;

        if (p.y > 0.28) {
          p.y = -1.24;
          p.radius = 0.25 + Math.random() * 0.45;
          p.angle = Math.random() * Math.PI * 2;
        }

        posArray[i * 3] = Math.cos(p.angle) * p.radius;
        posArray[i * 3 + 1] = p.y;
        posArray[i * 3 + 2] = Math.sin(p.angle) * p.radius;
      }

      posAttr.needsUpdate = true;
    }

    // 3. Subtle rotation on energy beams
    if (beamRef.current) {
      beamRef.current.rotation.y = t * 0.15;
    }
    if (coreBeamRef.current) {
      coreBeamRef.current.rotation.y = -t * 0.25;
    }
  });

  return (
    <group name="StationEnergyProjection">
      {/* 1. Ground Energy Projection Rings (Anchored at Floor: y = -1.24) */}
      <group position={[0, -1.24, 0]}>
        {/* Outer glowing projector ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.72, 0.82, 48]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.65}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Inner high-energy emitter ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.42, 36]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isSelected ? 0.90 : 0.75}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Soft ground projection illumination disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.82, 36]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isSelected ? 0.10 : 0.05}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Upward ground light source */}
        <pointLight
          color={glowColor}
          intensity={isSelected ? 0.9 : 0.5}
          distance={1.8}
          decay={2}
          position={[0, 0.08, 0]}
        />
      </group>

      {/* 2. Vertical Upward Energy Beams (Connecting floor y = -1.24 to crystal base y = 0.26) */}
      <mesh ref={beamRef} position={[0, -0.49, 0]}>
        <cylinderGeometry args={[0.60, 0.76, 1.50, 32, 1, true]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={isSelected ? 0.16 : isHovered ? 0.12 : 0.08}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={coreBeamRef} position={[0, -0.49, 0]}>
        <cylinderGeometry args={[0.26, 0.36, 1.50, 24, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.20 : isHovered ? 0.14 : 0.09}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Branching Electrical Arcs Traveling Upward */}
      <lineSegments>
        <bufferGeometry ref={arcGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[arcPositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={glowColor}
          transparent
          opacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.70}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* 4. Ascending Energy Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={glowColor}
          size={0.045}
          transparent
          opacity={isSelected ? 0.95 : 0.80}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

/**
 * Reusable Floating Hologram Station Podium
 * Pure levitating holographic presentation with zero physical support pedestals or dark discs.
 * Holograms are suspended in midair and powered by procedural electrical energy projected from the floor.
 * Information labels and interaction hitboxes remain completely stable (zero shaking/jitter).
 */
const StationPodium: React.FC<StationPodiumProps> = ({
  position,
  color,
  glowColor,
  icon,
  title,
  subtitle,
  isSelected,
  onSelect,
  labelWidth = ADMIN_STATIONS_CONFIG.label.width,
  labelOffsetY = ADMIN_STATIONS_CONFIG.label.offsetY,
  labelOffsetZ = ADMIN_STATIONS_CONFIG.label.offsetZ,
  badge,
  children,
}) => {
  const [hovered, setHovered] = useState(false);
  const adminActiveModule = useWorldStore((state) => state.adminActiveModule);
  const isPanelOpen = adminActiveModule !== 'NONE';
  const groupRef = useRef<THREE.Group>(null);
  const visualGroupRef = useRef<THREE.Group>(null);
  const baseScale = isSelected ? 1.05 : hovered ? 1.025 : 1.0;

  useFrame(({ clock }, delta) => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const t = clock.getElapsedTime();
    // Synchronized restrained vertical floating movement (3.5cm amplitude)
    const floatY = Math.sin(t * 1.5) * 0.035;
    if (visualGroupRef.current) {
      visualGroupRef.current.position.y = floatY;
    }
    if (groupRef.current) {
      const currentScale = groupRef.current.scale.x;
      const nextScale = THREE.MathUtils.damp(currentScale, baseScale, 8, delta);
      groupRef.current.scale.set(nextScale, nextScale, nextScale);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Stable, Accurate Interaction Hitbox (Non-moving to guarantee 100% reliable clicks) */}
      <mesh
        position={[0, 1.1, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <cylinderGeometry args={[1.45, 1.45, 2.3, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* 2. Procedural Upward Electrical Energy Projection (Anchored from floor to crystal) */}
      <StationEnergyProjection
        color={color}
        glowColor={glowColor}
        isSelected={isSelected}
        isHovered={hovered}
      />

      {/* 3. Floating Visual Group: Suspended Crystal Enclosure & Energy Receiver */}
      <group ref={visualGroupRef}>
        {/* Upper Holographic Energy Receiver Ring (Receives upward electricity into crystal base) */}
        <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.66, 0.76, 48]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={isSelected ? 0.95 : hovered ? 0.85 : 0.75}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.50, 36]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Active Selection Pulse Ring */}
        {isSelected && (
          <mesh position={[0, 0.27, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.82, 0.92, 48]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Volumetric 3D Symbolic Installation */}
        {children}
      </group>

      {/* 3. Stable Horizontally Aligned Station Badge Pill (Does NOT shake or jump) */}
      {(!isPanelOpen || isSelected) && (
        <Html
          position={[0, labelOffsetY, labelOffsetZ]}
          center
          zIndexRange={[10, 0]}
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              position: 'relative',
              width: labelWidth,
              height: '50px',
              boxSizing: 'border-box',
              background: isSelected
                ? 'rgba(8, 28, 48, 0.98)'
                : hovered
                ? 'rgba(10, 32, 56, 0.94)'
                : 'rgba(8, 28, 48, 0.90)',
              backdropFilter: 'blur(16px)',
              border: isSelected
                ? `1.5px solid ${color}`
                : hovered
                ? `1.2px solid ${glowColor}`
                : '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '25px',
              padding: '5px 12px 5px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: isSelected
                ? `0 0 18px ${glowColor}66, 0 6px 18px rgba(0,0,0,0.7)`
                : hovered
                ? `0 0 12px ${glowColor}44, 0 4px 14px rgba(0,0,0,0.6)`
                : '0 4px 12px rgba(0,0,0,0.5)',
              cursor: 'pointer',
              transition: 'all 0.15s ease-out',
            }}
          >
            {/* Left circular icon badge */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: `${color}22`,
                border: `1.2px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color,
                flexShrink: 0,
                boxShadow: `0 0 8px ${color}44`,
              }}
            >
              {icon}
            </div>

            {/* Middle Title & Subtext */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, paddingLeft: '8px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    color: isSelected ? '#FFFFFF' : color,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {title}
                </div>
                {badge}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#94A3B8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {subtitle}
              </div>
            </div>

            {/* Right Chevron */}
            <div style={{ color: color, display: 'flex', alignItems: 'center', opacity: 0.8, flexShrink: 0 }}>
              <ChevronRight size={15} />
            </div>

            {/* Bottom anchor indicator caret pointing to crystal top */}
            <div
              style={{
                position: 'absolute',
                bottom: '-5px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '10px',
                height: '5px',
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                background: isSelected ? color : glowColor,
                opacity: 0.85,
              }}
            />
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * Standardized Volumetric Crystal Enclosure
 * 8-sided faceted prism with beveled chamfers and glowing edge geometry.
 * Stationary presentation oriented toward camera (no disorienting continuous spin).
 */
interface VolumetricCrystalEnclosureProps {
  color: string;
  glowColor: string;
  children: React.ReactNode;
}

const VolumetricCrystalEnclosure: React.FC<VolumetricCrystalEnclosureProps> = ({
  color,
  glowColor,
  children,
}) => {
  const facetedBodyGeometry = useMemo(() => new THREE.CylinderGeometry(0.88, 0.88, 1.15, 8), []);
  const topChamferGeometry = useMemo(() => new THREE.CylinderGeometry(0.74, 0.88, 0.18, 8), []);
  const bottomChamferGeometry = useMemo(() => new THREE.CylinderGeometry(0.88, 0.74, 0.18, 8), []);

  const bodyEdgesGeometry = useMemo(() => new THREE.EdgesGeometry(facetedBodyGeometry), [facetedBodyGeometry]);
  const topEdgesGeometry = useMemo(() => new THREE.EdgesGeometry(topChamferGeometry), [topChamferGeometry]);
  const bottomEdgesGeometry = useMemo(() => new THREE.EdgesGeometry(bottomChamferGeometry), [bottomChamferGeometry]);

  return (
    <group position={[0, 1.05, 0]}>
      {/* 1. Subtle Internal Illumination */}
      <pointLight color={glowColor} intensity={0.7} distance={2.5} decay={2} position={[0, 0.1, 0]} />

      {/* 2. Translucent Faceted Crystal Prism (Stationary for balanced visual calm) */}
      <group>
        <mesh geometry={facetedBodyGeometry}>
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.28}
            roughness={0.07}
            metalness={0.12}
            transmission={0.82}
            thickness={1.0}
            ior={1.46}
          />
        </mesh>
        <lineSegments geometry={bodyEdgesGeometry}>
          <lineBasicMaterial color={glowColor} transparent opacity={0.7} />
        </lineSegments>

        <mesh position={[0, 0.665, 0]} geometry={topChamferGeometry}>
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.30}
            roughness={0.07}
            metalness={0.12}
            transmission={0.82}
            thickness={1.0}
            ior={1.46}
          />
        </mesh>
        <lineSegments position={[0, 0.665, 0]} geometry={topEdgesGeometry}>
          <lineBasicMaterial color={glowColor} transparent opacity={0.7} />
        </lineSegments>

        <mesh position={[0, -0.665, 0]} geometry={bottomChamferGeometry}>
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.30}
            roughness={0.07}
            metalness={0.12}
            transmission={0.82}
            thickness={1.0}
            ior={1.46}
          />
        </mesh>
        <lineSegments position={[0, -0.665, 0]} geometry={bottomEdgesGeometry}>
          <lineBasicMaterial color={glowColor} transparent opacity={0.7} />
        </lineSegments>

        {/* Delicate Top and Bottom Metallic Edge Collars */}
        <mesh position={[0, 0.76, 0]}>
          <cylinderGeometry args={[0.74, 0.77, 0.025, 8]} />
          <meshStandardMaterial color="#0A1828" emissive={glowColor} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, -0.76, 0]}>
          <cylinderGeometry args={[0.74, 0.77, 0.025, 8]} />
          <meshStandardMaterial color="#0A1828" emissive={glowColor} emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* 3. Internal 3D Symbolic Installation */}
      {children}
    </group>
  );
};

/* ======================================================== */
/* STATION 1 (LEFT): CO-OWNERSHIP MONITORING (CYAN)         */
/* Position: [-4.5, 1.25, -2.85] (Shallow Symmetrical Arc)  */
/* ======================================================== */
const CoOwnershipStation3D: React.FC<{
  isSelected: boolean;
  onSelect: () => void;
  groupCount?: number;
  memberCount?: number;
}> = ({ isSelected, onSelect, groupCount = 4, memberCount = 12 }) => {
  const networkRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (networkRef.current) {
      networkRef.current.rotation.y -= delta * 0.45;
    }
  });

  const satelliteNodes: [number, number, number][] = useMemo(() => [
    [0.48, 0.14, 0.0],
    [-0.36, -0.14, 0.3],
    [0.18, -0.22, -0.38],
    [-0.30, 0.20, -0.24],
  ], []);

  const satelliteLinePoints = useMemo(() => {
    return satelliteNodes.map((pos) => [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(...pos),
    ]);
  }, [satelliteNodes]);

  return (
    <StationPodium
      position={[-ADMIN_STATIONS_CONFIG.spacingX, ADMIN_STATIONS_CONFIG.elevationY, ADMIN_STATIONS_CONFIG.leftZ]}
      color={DESIGN_TOKENS.cyan}
      glowColor="#38BDF8"
      icon={<Car size={16} />}
      title="QUẢN LÝ ĐỒNG SỞ HỮU"
      subtitle={`${memberCount} Thành viên • ${groupCount} Nhóm xe`}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <VolumetricCrystalEnclosure color={DESIGN_TOKENS.cyan} glowColor="#38BDF8">
        <group ref={networkRef} position={[0, -0.05, 0]}>
          {/* Central 3D Mini Electric Vehicle */}
          <group position={[0, 0, 0]} scale={[1.35, 1.35, 1.35]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.38, 0.09, 0.20]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive={DESIGN_TOKENS.cyan}
                emissiveIntensity={0.85}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[-0.03, 0.075, 0]}>
              <boxGeometry args={[0.20, 0.065, 0.16]} />
              <meshStandardMaterial
                color="#0284C7"
                emissive="#38BDF8"
                emissiveIntensity={0.65}
              />
            </mesh>
            <mesh position={[0.191, 0.01, 0]}>
              <boxGeometry args={[0.01, 0.02, 0.18]} />
              <meshBasicMaterial color="#00D9FF" />
            </mesh>
            <mesh position={[-0.191, 0.02, 0]}>
              <boxGeometry args={[0.01, 0.02, 0.16]} />
              <meshBasicMaterial color="#00B4D8" />
            </mesh>
            {[-0.12, 0.12].map((wx, wi) =>
              [-0.105, 0.105].map((wz, zi) => (
                <mesh key={`${wi}-${zi}`} position={[wx, -0.04, wz]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.042, 0.042, 0.03, 16]} />
                  <meshStandardMaterial color="#0F172A" emissive="#00D9FF" emissiveIntensity={0.5} />
                </mesh>
              ))
            )}
          </group>

          {/* Connected Human Hologram Nodes */}
          {satelliteNodes.map((pos, idx) => {
            const color = MEMBER_PALETTE[idx % MEMBER_PALETTE.length];
            return (
              <group key={idx}>
                <group position={pos} scale={[0.65, 0.65, 0.65]}>
                  <mesh position={[0, 0.10, 0]}>
                    <sphereGeometry args={[0.07, 16, 16]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
                  </mesh>
                  <mesh position={[0, -0.04, 0]}>
                    <cylinderGeometry args={[0.04, 0.10, 0.14, 16]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
                  </mesh>
                </group>
                <line>
                  <bufferGeometry
                    attach="geometry"
                    onUpdate={(geom) => {
                      if (satelliteLinePoints[idx]) {
                        geom.setFromPoints(satelliteLinePoints[idx]);
                      }
                    }}
                  />
                  <lineBasicMaterial attach="material" color={color} transparent opacity={0.75} />
                </line>
              </group>
            );
          })}

          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[0.62, 0.012, 16, 48]} />
            <meshBasicMaterial color={DESIGN_TOKENS.cyan} transparent opacity={0.6} />
          </mesh>
        </group>
      </VolumetricCrystalEnclosure>
    </StationPodium>
  );
};

/* ======================================================== */
/* STATION 2 (MIDDLE): USER MANAGEMENT (PURPLE)             */
/* Position: [0.0, 1.25, -3.6] — Aligned with Vehicle       */
/* ======================================================== */
const UserManagementStation3D: React.FC<{
  isSelected: boolean;
  onSelect: () => void;
  registeredUsers?: number;
  activeUsers?: number;
}> = ({ isSelected, onSelect, registeredUsers = 14, activeUsers = 14 }) => {
  return (
    <StationPodium
      position={[0.0, ADMIN_STATIONS_CONFIG.elevationY, ADMIN_STATIONS_CONFIG.centerZ]}
      color={DESIGN_TOKENS.purple}
      glowColor="#C084FC"
      icon={<Users size={16} />}
      title="QUẢN LÝ NGƯỜI DÙNG"
      subtitle={`${activeUsers}/${registeredUsers} Hoạt động`}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <VolumetricCrystalEnclosure color={DESIGN_TOKENS.purple} glowColor="#C084FC">
        <group position={[0, -0.05, 0]}>
          {/* Central Leader Silhouette */}
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0.34, 0]}>
              <sphereGeometry args={[0.12, 24, 24]} />
              <meshStandardMaterial
                color="#F3E8FF"
                emissive={DESIGN_TOKENS.purple}
                emissiveIntensity={0.9}
                roughness={0.18}
              />
            </mesh>
            <mesh position={[0, 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.13, 0.165, 32]} />
              <meshBasicMaterial color="#FFBF36" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <cylinderGeometry args={[0.045, 0.055, 0.08, 16]} />
              <meshStandardMaterial color="#9333EA" emissive="#7E22CE" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.08, 0.22, 0.26, 24]} />
              <meshPhysicalMaterial
                color={DESIGN_TOKENS.purple}
                emissive="#9333EA"
                emissiveIntensity={0.65}
                roughness={0.2}
                transmission={0.3}
              />
            </mesh>
            <mesh position={[-0.19, 0.12, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#9333EA" emissive="#7E22CE" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0.19, 0.12, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#9333EA" emissive="#7E22CE" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[0, -0.14, 0]}>
              <cylinderGeometry args={[0.15, 0.09, 0.14, 16]} />
              <meshStandardMaterial color="#3B0764" />
            </mesh>
          </group>

          {/* Flanking Members */}
          {[-0.38, 0.38].map((xOffset, i) => (
            <group key={i} position={[xOffset, -0.06, 0.06]} scale={[0.78, 0.78, 0.78]}>
              <mesh position={[0, 0.28, 0]}>
                <sphereGeometry args={[0.10, 20, 20]} />
                <meshStandardMaterial
                  color="#E9D5FF"
                  emissive={DESIGN_TOKENS.purple}
                  emissiveIntensity={0.7}
                />
              </mesh>
              <mesh position={[0, 0.06, 0]}>
                <cylinderGeometry args={[0.06, 0.17, 0.22, 16]} />
                <meshStandardMaterial
                  color="#9333EA"
                  emissive="#7E22CE"
                  emissiveIntensity={0.55}
                />
              </mesh>
              <mesh position={[-0.14, 0.10, 0]}>
                <sphereGeometry args={[0.065, 16, 16]} />
                <meshStandardMaterial color="#9333EA" emissive="#7E22CE" emissiveIntensity={0.5} />
              </mesh>
              <mesh position={[0.14, 0.10, 0]}>
                <sphereGeometry args={[0.065, 16, 16]} />
                <meshStandardMaterial color="#9333EA" emissive="#7E22CE" emissiveIntensity={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      </VolumetricCrystalEnclosure>
    </StationPodium>
  );
};

/* ======================================================== */
/* STATION 3 (RIGHT): OPERATIONS ANALYTICS (EMERALD)        */
/* Position: [4.5, 1.25, -2.85] (Shallow Symmetrical Arc)   */
/* ======================================================== */
const OperationsAnalyticsStation3D: React.FC<{
  isSelected: boolean;
  onSelect: () => void;
  activeTrips?: number;
  activeBookings?: number;
}> = ({ isSelected, onSelect, activeTrips = 0, activeBookings = 43 }) => {
  const barsRef = useRef<THREE.Group>(null);
  const trendRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (barsRef.current) {
      barsRef.current.children.forEach((child, i) => {
        const meshGroup = child as THREE.Group;
        const wave = Math.sin(t * 2 + i * 1.1) * 0.07;
        meshGroup.scale.y = 1 + wave;
      });
    }
    if (trendRef.current) {
      trendRef.current.position.y = -0.05 + Math.sin(t * 1.5) * 0.03;
    }
  });

  const columnsData = [
    { x: -0.38, z: -0.15, height: 0.38, color: '#10E6A3' },
    { x: -0.19, z: -0.15, height: 0.58, color: '#10B981' },
    { x: 0.0, z: -0.15, height: 0.82, color: '#059669' },
    { x: 0.19, z: -0.15, height: 1.06, color: '#34D399' },
    { x: 0.38, z: -0.15, height: 0.92, color: '#10E6A3' },
  ];

  return (
    <StationPodium
      position={[ADMIN_STATIONS_CONFIG.spacingX, ADMIN_STATIONS_CONFIG.elevationY, ADMIN_STATIONS_CONFIG.rightZ]}
      color={DESIGN_TOKENS.emerald}
      glowColor="#34D399"
      icon={<BarChart3 size={16} />}
      title="PHÂN TÍCH VẬN HÀNH"
      subtitle={`${activeTrips} Chuyến • ${activeBookings} Lịch đặt`}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <VolumetricCrystalEnclosure color={DESIGN_TOKENS.emerald} glowColor="#34D399">
        {/* Volumetric 3D Ascending Chart Columns */}
        <group ref={barsRef} position={[0, -0.55, 0]}>
          {columnsData.map((bar, i) => (
            <group key={i} position={[bar.x, 0, bar.z]}>
              <mesh position={[0, bar.height / 2, 0]}>
                <boxGeometry args={[0.13, bar.height, 0.13]} />
                <meshStandardMaterial
                  color={bar.color}
                  emissive={bar.color}
                  emissiveIntensity={0.7}
                  roughness={0.2}
                  metalness={0.7}
                />
              </mesh>
              <mesh position={[0, bar.height + 0.015, 0]}>
                <boxGeometry args={[0.15, 0.03, 0.15]} />
                <meshStandardMaterial color="#FFFFFF" emissive={bar.color} emissiveIntensity={0.9} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Floating 3D Trend Spline & Illuminated Data Nodes */}
        <group ref={trendRef} position={[0, -0.55, 0]}>
          {columnsData.map((bar, i) => (
            <mesh key={i} position={[bar.x, bar.height + 0.08, bar.z]}>
              <sphereGeometry args={[0.045, 16, 16]} />
              <meshStandardMaterial color="#FFFFFF" emissive="#10E6A3" emissiveIntensity={1.1} />
            </mesh>
          ))}
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={(geom) => {
                const pts = columnsData.map((b) => new THREE.Vector3(b.x, b.height + 0.08, b.z));
                geom.setFromPoints(pts);
              }}
            />
            <lineBasicMaterial attach="material" color="#10E6A3" linewidth={2} />
          </line>
        </group>
      </VolumetricCrystalEnclosure>
    </StationPodium>
  );
};

/* ======================================================== */
/* CENTRAL VEHICLE NAVIGATOR                                */
/* Positioned below the vehicle on the garage floor         */
/* - Normal overview: [0, 0.12, 3.20] (previously approved) */
/* - Co-Ownership active: [0, 0.16, 2.35] (clears members)  */
/* ======================================================== */
const CentralVehicleNavigator3D: React.FC<{
  vehicles: VehicleResponse[];
  selectedVehicle: VehicleResponse | null;
}> = ({ vehicles, selectedVehicle }) => {
  const selectVehicle = useWorldStore((state) => state.selectVehicle);
  const user = useAuthStore((state) => state.user);
  const adminActiveModule = useWorldStore((state) => state.adminActiveModule);
  const isAdminVehicleGalleryOpen = useWorldStore((state) => state.isAdminVehicleGalleryOpen);

  const isCoOwnershipActive = adminActiveModule === 'CO_OWNERSHIP';

  const currentIndex = useMemo(() => {
    if (!selectedVehicle || vehicles.length === 0) return 0;
    const idx = vehicles.findIndex((v) => isMatchingVehicle(v, selectedVehicle.id));
    return idx >= 0 ? idx : 0;
  }, [vehicles, selectedVehicle]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vehicles.length <= 1) return;
    const prevIdx = (currentIndex - 1 + vehicles.length) % vehicles.length;
    selectVehicle(vehicles[prevIdx].id, user?.role, false);
    useWorldStore.getState().triggerCameraReset();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vehicles.length <= 1) return;
    const nextIdx = (currentIndex + 1) % vehicles.length;
    selectVehicle(vehicles[nextIdx].id, user?.role, false);
    useWorldStore.getState().triggerCameraReset();
  };

  if (!selectedVehicle || isAdminVehicleGalleryOpen) return null;

  const isApplicationPreview = Boolean((selectedVehicle as any)?.isApplicationPreview);
  const vehicleCode = resolveVehicleCode(selectedVehicle);
  const displayName = resolveVehicleDisplayName(selectedVehicle, vehicleCode);
  const licensePlate = selectedVehicle.licensePlate || '51E-123.45';

  // Responsive spatial position below the central vehicle:
  // - In default overview: restored to previously approved position [0, 0.12, 3.20] on floor in front of vehicle
  // - When Ownership Management is active: adapted closer to vehicle [0, 0.16, 2.35] to prevent overlap with member holograms
  const bannerPosition: [number, number, number] = isCoOwnershipActive
    ? [0.0, 0.16, 2.35]
    : [0.0, 0.12, 3.20];

  const bannerWidth = isCoOwnershipActive ? '340px' : isApplicationPreview ? '360px' : '380px';
  const bannerHeight = isCoOwnershipActive ? '50px' : '58px';
  const titleSize = isCoOwnershipActive ? '13px' : '14px';
  const subtitleSize = isCoOwnershipActive ? '11px' : '12px';
  const btnSize = isCoOwnershipActive ? '30px' : '34px';
  const iconSize = isCoOwnershipActive ? 15 : 18;
  const badgeIconSize = isCoOwnershipActive ? 11 : 13;

  return (
    <Html
      position={bannerPosition}
      center
      zIndexRange={[15, 0]}
      style={{ pointerEvents: 'auto', userSelect: 'none' }}
    >
      <div
        style={{
          width: bannerWidth,
          height: bannerHeight,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isApplicationPreview ? 'rgba(20, 16, 8, 0.96)' : 'rgba(8, 28, 48, 0.95)',
          backdropFilter: 'blur(20px)',
          border: isApplicationPreview ? '1.8px solid #F59E0B' : '1.5px solid rgba(0, 217, 255, 0.55)',
          borderRadius: '30px',
          padding: isCoOwnershipActive ? '4px 12px' : '6px 14px',
          boxShadow: isApplicationPreview
            ? '0 0 24px rgba(245, 158, 11, 0.55), 0 8px 20px rgba(0, 0, 0, 0.75)'
            : '0 0 24px rgba(0, 217, 255, 0.4), 0 8px 20px rgba(0, 0, 0, 0.75)',
          transition: 'all 0.25s ease',
        }}
      >
        {!isApplicationPreview && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Xe trước"
            title="Xe trước"
            style={{
              background: 'rgba(0, 217, 255, 0.15)',
              border: '1.2px solid rgba(0, 217, 255, 0.5)',
              borderRadius: '50%',
              width: btnSize,
              height: btnSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00D9FF',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00D9FF';
              e.currentTarget.style.color = '#081C30';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 217, 255, 0.15)';
              e.currentTarget.style.color = '#00D9FF';
            }}
          >
            <ChevronLeft size={iconSize} />
          </button>
        )}

        <div
          onClick={(e) => {
            e.stopPropagation();
            if (!isApplicationPreview) {
              useWorldStore.getState().setAdminVehicleGalleryOpen(true);
            }
          }}
          style={{
            textAlign: 'center',
            flex: 1,
            padding: '0 8px',
            overflow: 'hidden',
            cursor: isApplicationPreview ? 'default' : 'pointer',
          }}
          title={isApplicationPreview ? 'Đang hiển thị phương tiện thuộc hồ sơ xét duyệt' : 'Nhấn để mở danh sách xe tiền cảnh'}
        >
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 900,
              color: isApplicationPreview ? '#F59E0B' : '#F1F5F9',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '0.02em',
            }}
          >
            {isApplicationPreview ? 'HỒ SƠ ĐANG XÉT DUYỆT' : `${vehicleCode} — ${displayName}`}
          </div>
          <div
            style={{
              fontSize: subtitleSize,
              fontWeight: 700,
              color: isApplicationPreview ? '#FDE68A' : '#00D9FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              marginTop: '1px',
            }}
          >
            <CreditCard size={badgeIconSize} />
            <span>
              {isApplicationPreview
                ? `${(selectedVehicle as any).model || displayName} • Biển số: ${licensePlate}`
                : `Biển số: ${licensePlate}`}
            </span>
          </div>
        </div>

        {!isApplicationPreview && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Xe kế tiếp"
            title="Xe kế tiếp"
            style={{
              background: 'rgba(0, 217, 255, 0.15)',
              border: '1.2px solid rgba(0, 217, 255, 0.5)',
              borderRadius: '50%',
              width: btnSize,
              height: btnSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00D9FF',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00D9FF';
              e.currentTarget.style.color = '#081C30';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 217, 255, 0.15)';
              e.currentTarget.style.color = '#00D9FF';
            }}
          >
            <ChevronRight size={iconSize} />
          </button>
        )}
      </div>
    </Html>
  );
};

/* ======================================================== */
/* FOREGROUND OWNERSHIP MEMBER HOLOGRAMS ([0, 0, 3.65])     */
/* Shown strictly when adminActiveModule === 'CO_OWNERSHIP' */
/* ======================================================== */
const ForegroundOwnershipHolograms3D: React.FC<{
  vehicle: VehicleResponse | null;
}> = ({ vehicle }) => {
  const adminActiveModule = useWorldStore((state) => state.adminActiveModule);
  const setSelectedAdminMemberId = useWorldStore((state) => state.setSelectedAdminMemberId);
  const setAdminActiveModule = useWorldStore((state) => state.setAdminActiveModule);
  const vehicleId = vehicle?.id;

  const isCoOwnershipActive = adminActiveModule === 'CO_OWNERSHIP';

  const { data: coOwnership } = useQuery({
    queryKey: ['coOwnership', vehicleId],
    queryFn: () => (vehicleId ? fetchVehicleCoOwnership(vehicleId) : null),
    enabled: !!vehicleId && isCoOwnershipActive,
    staleTime: 15000,
  });

  if (!isCoOwnershipActive) return null;

  const rawMembers = coOwnership?.members || [];
  if (!vehicle || rawMembers.length === 0) return null;

  const activeMembers = rawMembers.filter((m) => !m.status || m.status === 'ACTIVE');
  if (activeMembers.length === 0) return null;

  const totalCount = activeMembers.length;
  // Dynamic step spacing ensures member labels (width 136px) never collide regardless of group size
  const step = Math.min(1.05, Math.max(0.85, 3.8 / Math.max(1, totalCount - 1)));
  const totalWidth = (totalCount - 1) * step;

  return (
    <group position={[0.0, 0.0, 4.05]} name="ForegroundOwnershipHolograms">
      {/* Floor Guide Ring Arc matching foreground layout */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.75, 2.85, 48, 1, Math.PI * 0.28, Math.PI * 0.44]} />
        <meshBasicMaterial color={DESIGN_TOKENS.cyan} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {activeMembers.map((member, idx) => {
        const t = totalCount === 1 ? 0 : idx / (totalCount - 1) - 0.5;
        const x = t * totalWidth;
        const z = -(t * t) * 0.70;
        const color = getStableMemberColor(member, activeMembers);

        const rawPct =
          (member as any).ownershipPercentage ??
          member.share?.percentage ??
          (member as any).sharePercentage ??
          (member as any).percentage;
        const formattedPct =
          rawPct !== null && rawPct !== undefined && rawPct !== ''
            ? Number(rawPct).toFixed(1)
            : '0.0';

        const isLeader =
          member.memberRole === 'REPRESENTATIVE' ||
          (member as any).role === 'REPRESENTATIVE' ||
          Boolean(member.isRepresentative) ||
          Boolean((member as any).isLeader);

        const displayName =
          member.fullName ||
          (member as any).userName ||
          (member as any).displayName ||
          `Thành viên ${idx + 1}`;

        return (
          <group key={member.id || member.userId || idx} position={[x, 0, z]}>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.32, 0.36, 0.08, 24]} />
              <meshStandardMaterial color="#0A1828" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.24, 0.32, 24]} />
              <meshBasicMaterial color={color} transparent opacity={0.85} side={THREE.DoubleSide} />
            </mesh>

            <group
              position={[0, 0.12, 0]}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAdminMemberId(member.id);
                setAdminActiveModule('CO_OWNERSHIP');
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default';
              }}
            >
              <mesh position={[0, 0.32, 0]}>
                <sphereGeometry args={[0.07, 16, 16]} />
                <meshStandardMaterial
                  color="#F1F5F9"
                  emissive={color}
                  emissiveIntensity={0.85}
                  roughness={0.2}
                />
              </mesh>

              {isLeader && (
                <mesh position={[0, 0.40, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.08, 0.11, 24]} />
                  <meshBasicMaterial color="#FFBF36" side={THREE.DoubleSide} />
                </mesh>
              )}

              <mesh position={[0, 0.17, 0]}>
                <cylinderGeometry args={[0.04, 0.10, 0.20, 16]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={0.7}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[-0.08, 0.20, 0]}>
                <sphereGeometry args={[0.04, 12, 12]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
              </mesh>
              <mesh position={[0.08, 0.20, 0]}>
                <sphereGeometry args={[0.04, 12, 12]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
              </mesh>

              <mesh position={[0, 0.04, 0]}>
                <cylinderGeometry args={[0.09, 0.05, 0.10, 16]} />
                <meshStandardMaterial color="#0B1A2E" />
              </mesh>
            </group>

            <Html
              position={[0, 0.04, 0.35]}
              center
              zIndexRange={[10, 0]}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              <div
                style={{
                  width: '136px',
                  height: '44px',
                  boxSizing: 'border-box',
                  background: 'rgba(8, 28, 48, 0.94)',
                  backdropFilter: 'blur(10px)',
                  border: isLeader
                    ? '1.5px solid #FFBF36'
                    : `1px solid ${color}`,
                  borderRadius: '14px',
                  padding: '3px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1px',
                  boxShadow: isLeader
                    ? '0 0 14px rgba(255, 191, 54, 0.55), 0 4px 12px rgba(0, 0, 0, 0.75)'
                    : `0 0 10px ${color}44`,
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: isLeader ? '#FFBF36' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '122px',
                  }}
                >
                  {isLeader && <Crown size={12} color="#FFBF36" />}
                  <span>{displayName}</span>
                </div>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: color }}>
                  {formattedPct}% • {isLeader ? 'Trưởng nhóm' : 'Thành viên'}
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

/* ======================================================== */
/* MAIN EXPORT: SHALLOW SYMMETRICAL ARC COMMAND CENTER     */
/* (PURE ENERGY SUSPENSION - ZERO PHYSICAL PEDESTALS)       */
/* ======================================================== */
export const AdminCommandCenter3D: React.FC<{
  selectedVehicle?: VehicleResponse | null;
}> = ({ selectedVehicle }) => {
  const adminActiveModule = useWorldStore((state) => state.adminActiveModule);
  const setAdminActiveModule = useWorldStore((state) => state.setAdminActiveModule);
  const isAdminVehicleGalleryOpen = useWorldStore((state) => state.isAdminVehicleGalleryOpen);
  const user = useAuthStore((state) => state.user);

  // TanStack Query for authoritative fleet vehicles
  const { data: vehicles = [] } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
    staleTime: 10000,
  });

  // TanStack Query for authoritative ADMIN dashboard statistics
  const { data: stats } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: fetchAdminDashboardStats,
    staleTime: 10000,
    refetchInterval: 15000,
  });

  return (
    <group name="AdminCommandCenter3D">
      {/* 1. Left Station: Co-Ownership Monitoring (Cyan: [-4.5, 1.25, -2.85]) */}
      <CoOwnershipStation3D
        isSelected={adminActiveModule === 'CO_OWNERSHIP'}
        onSelect={() => setAdminActiveModule('CO_OWNERSHIP')}
        groupCount={stats?.ownershipGroupsCount || 4}
        memberCount={stats?.coOwnerUsersCount || 12}
      />

      {/* 2. Middle Station: User Management (Purple: [0.0, 1.25, -3.6] — Aligned with Hero Car) */}
      <UserManagementStation3D
        isSelected={adminActiveModule === 'USER_MANAGEMENT'}
        onSelect={() => setAdminActiveModule('USER_MANAGEMENT')}
        registeredUsers={stats?.registeredUsersCount || 14}
        activeUsers={stats?.activeUsersCount || 14}
      />

      {/* 3. Right Station: Operations Analytics (Emerald: [4.5, 1.25, -2.85]) */}
      <OperationsAnalyticsStation3D
        isSelected={adminActiveModule === 'VEHICLE_ANALYTICS'}
        onSelect={() => setAdminActiveModule('VEHICLE_ANALYTICS')}
        activeTrips={stats?.activeTripsCount || 0}
        activeBookings={stats?.activeBookingsCount || 43}
      />

      {/* 4. Independent Admin Approval Workstation (Physical Kiosk in lower-left floor zone: [-3.45, 0.0, 2.55]) */}
      <AdminApprovalWorkstation3D />

      {/* 5. Central Vehicle Navigator (Scaled Up +30%, Advanced Forward to: [0, 0.12, 3.20], temporarily hidden when gallery opens) */}
      {selectedVehicle && !isAdminVehicleGalleryOpen && (
        <CentralVehicleNavigator3D
          vehicles={vehicles}
          selectedVehicle={selectedVehicle}
        />
      )}

      {/* 6. Foreground Ownership Member Holograms (Front Arc: [0, 0, 3.65], active only in CO_OWNERSHIP mode) */}
      {selectedVehicle && adminActiveModule === 'CO_OWNERSHIP' && (
        <ForegroundOwnershipHolograms3D vehicle={selectedVehicle} />
      )}
    </group>
  );
};
