import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { fetchVehicles } from '../../../services/vehicleApi';
import { VehicleResponse } from '../../../types/vehicle';
import { Car } from 'lucide-react';

const ARC_COUNT = 3;
const SEGMENTS_PER_ARC = 8;
const PARTICLE_COUNT = 36;

/**
 * Open Holographic Miniature 3D Electric Vehicle Model
 * Pure floating vehicle hologram without any glass box or crystal enclosure.
 * Crafted with recognizable aerodynamic EV body, sloping glass cockpit/windshield,
 * high-tech neon cyber lightbars (front/rear), and 4 alloy wheels with glowing cyan rims.
 * Uses translucent cyan holographic materials with illuminated contours and edge wireframe accents.
 */
const OpenHolographicVehicle: React.FC<{
  isHovered: boolean;
}> = ({ isHovered }) => {
  const vehicleBodyGeometry = useMemo(() => new THREE.BoxGeometry(0.68, 0.16, 1.42), []);
  const bodyEdgesGeometry = useMemo(() => new THREE.EdgesGeometry(vehicleBodyGeometry), [vehicleBodyGeometry]);

  const cabinGeometry = useMemo(() => new THREE.BoxGeometry(0.52, 0.18, 0.76), []);
  const cabinEdgesGeometry = useMemo(() => new THREE.EdgesGeometry(cabinGeometry), [cabinGeometry]);

  const wheelGeometry = useMemo(() => new THREE.CylinderGeometry(0.095, 0.095, 0.07, 16), []);
  const rimRingGeometry = useMemo(() => new THREE.RingGeometry(0.05, 0.088, 16), []);

  return (
    <group name="OpenHolographicVehicleGroup">
      {/* 1. Main Aerodynamic Chassis Body */}
      <mesh geometry={vehicleBodyGeometry} position={[0, 0.11, 0]}>
        <meshPhysicalMaterial
          color="#00D9FF"
          emissive="#00D9FF"
          emissiveIntensity={isHovered ? 0.45 : 0.28}
          roughness={0.15}
          metalness={0.35}
          transmission={0.65}
          thickness={0.4}
          ior={1.4}
          transparent
          opacity={0.82}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Illuminated Chassis Contours / Edge Wireframe */}
      <lineSegments geometry={bodyEdgesGeometry} position={[0, 0.11, 0]}>
        <lineBasicMaterial
          color="#38BDF8"
          transparent
          opacity={isHovered ? 0.95 : 0.70}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* 2. Sloping Cabin Canopy & Glass Windshield */}
      <mesh geometry={cabinGeometry} position={[0, 0.26, -0.06]}>
        <meshPhysicalMaterial
          color="#38BDF8"
          emissive="#00D9FF"
          emissiveIntensity={isHovered ? 0.60 : 0.40}
          roughness={0.08}
          metalness={0.2}
          transmission={0.78}
          thickness={0.5}
          ior={1.45}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Illuminated Windshield Contours */}
      <lineSegments geometry={cabinEdgesGeometry} position={[0, 0.26, -0.06]}>
        <lineBasicMaterial
          color="#00D9FF"
          transparent
          opacity={isHovered ? 1.0 : 0.8}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* 3. High-Tech Cyber Neon Front Lightbar (Cyan) */}
      <mesh position={[0, 0.13, 0.715]}>
        <boxGeometry args={[0.58, 0.035, 0.02]} />
        <meshBasicMaterial color="#00F2FE" />
      </mesh>

      {/* 4. High-Tech Cyber Neon Rear Lightbar (Teal/Cyan) */}
      <mesh position={[0, 0.16, -0.715]}>
        <boxGeometry args={[0.56, 0.035, 0.02]} />
        <meshBasicMaterial color="#38BDF8" />
      </mesh>

      {/* 5. 4 Alloy Wheels with Illuminated Rims */}
      {/* Front Left */}
      <group position={[-0.355, 0.085, 0.42]} rotation={[0, 0, Math.PI / 2]}>
        <mesh geometry={wheelGeometry}>
          <meshStandardMaterial color="#06182c" roughness={0.3} metalness={0.8} emissive="#00D9FF" emissiveIntensity={0.15} />
        </mesh>
        <mesh geometry={rimRingGeometry} position={[0, 0.038, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#00D9FF" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Front Right */}
      <group position={[0.355, 0.085, 0.42]} rotation={[0, 0, Math.PI / 2]}>
        <mesh geometry={wheelGeometry}>
          <meshStandardMaterial color="#06182c" roughness={0.3} metalness={0.8} emissive="#00D9FF" emissiveIntensity={0.15} />
        </mesh>
        <mesh geometry={rimRingGeometry} position={[0, 0.038, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#00D9FF" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Rear Left */}
      <group position={[-0.355, 0.085, -0.42]} rotation={[0, 0, Math.PI / 2]}>
        <mesh geometry={wheelGeometry}>
          <meshStandardMaterial color="#06182c" roughness={0.3} metalness={0.8} emissive="#00D9FF" emissiveIntensity={0.15} />
        </mesh>
        <mesh geometry={rimRingGeometry} position={[0, 0.038, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#00D9FF" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Rear Right */}
      <group position={[0.355, 0.085, -0.42]} rotation={[0, 0, Math.PI / 2]}>
        <mesh geometry={wheelGeometry}>
          <meshStandardMaterial color="#06182c" roughness={0.3} metalness={0.8} emissive="#00D9FF" emissiveIntensity={0.15} />
        </mesh>
        <mesh geometry={rimRingGeometry} position={[0, 0.038, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#00D9FF" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * Compact Luminous Energy Projection & Orbital Rings
 * Thin circular orbital energy rings, compact luminous projection base,
 * upward electric arcs and ascending photon particles.
 */
const FleetHologramProjection: React.FC<{
  isHovered: boolean;
}> = ({ isHovered }) => {
  const arcGeometryRef = useRef<THREE.BufferGeometry>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const orbitRing1Ref = useRef<THREE.Group>(null);
  const orbitRing2Ref = useRef<THREE.Group>(null);

  const arcPositions = useMemo(() => {
    return new Float32Array(ARC_COUNT * SEGMENTS_PER_ARC * 2 * 3);
  }, []);

  const particlesData = useMemo(() => {
    const data = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 0.20 + Math.random() * 0.45;
      const angle = Math.random() * Math.PI * 2;
      const y = -0.56 + Math.random() * 0.95;
      const speed = 0.35 + Math.random() * 0.45;
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

    // 1. Orbital Ring continuous rotational drift
    if (orbitRing1Ref.current) {
      orbitRing1Ref.current.rotation.y = t * 0.45;
      orbitRing1Ref.current.rotation.x = 0.22 + Math.sin(t * 0.8) * 0.08;
    }
    if (orbitRing2Ref.current) {
      orbitRing2Ref.current.rotation.y = -t * 0.35;
      orbitRing2Ref.current.rotation.z = -0.18 + Math.cos(t * 0.7) * 0.06;
    }

    // 2. Procedural electric arcs from projection base upward to vehicle
    if (arcGeometryRef.current) {
      let ptr = 0;
      const floorY = -0.56;
      const topY = 0.15;
      const totalH = topY - floorY;

      for (let a = 0; a < ARC_COUNT; a++) {
        const baseAngle = (a / ARC_COUNT) * Math.PI * 2 + t * 0.4;
        const seed = a * 13.37;

        let prevX = Math.cos(baseAngle) * 0.48;
        let prevY = floorY;
        let prevZ = Math.sin(baseAngle) * 0.48;

        for (let s = 1; s <= SEGMENTS_PER_ARC; s++) {
          const frac = s / SEGMENTS_PER_ARC;
          const currY = floorY + frac * totalH;
          const r = THREE.MathUtils.lerp(0.48, 0.32, frac);

          const jitter = Math.sin(t * 16 + seed + s * 4) * 0.04 * (1 - Math.abs(frac - 0.5) * 1.2);
          const currAngle = baseAngle + Math.sin(t * 8 + s * 2.5 + seed) * 0.18;
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

    // 3. Ascending photon energy particles
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particlesData[i];
        p.y += p.speed * delta;
        p.angle += delta * 0.65;

        if (p.y > 0.38) {
          p.y = -0.56;
          p.radius = 0.20 + Math.random() * 0.45;
          p.angle = Math.random() * Math.PI * 2;
        }

        posArray[i * 3] = Math.cos(p.angle) * p.radius;
        posArray[i * 3 + 1] = p.y;
        posArray[i * 3 + 2] = Math.sin(p.angle) * p.radius;
      }

      posAttr.needsUpdate = true;
    }
  });

  return (
    <group name="FleetHologramProjection">
      {/* 1. Compact Luminous Floor Projection Base (Anchored at Floor Y = -0.56 relative to root Y = 0.70) */}
      <group position={[0, -0.56, 0]}>
        {/* Outer glowing projector ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 0.72, 48]} />
          <meshBasicMaterial
            color="#00D9FF"
            transparent
            opacity={isHovered ? 0.95 : 0.70}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Inner high-energy ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.26, 0.36, 36]} />
          <meshBasicMaterial
            color="#38BDF8"
            transparent
            opacity={isHovered ? 0.90 : 0.65}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Soft ground projection illumination disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.72, 36]} />
          <meshBasicMaterial
            color="#00D9FF"
            transparent
            opacity={isHovered ? 0.12 : 0.06}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 2. Thin Circular Orbital Energy Rings Hovering Around the Miniature Vehicle */}
      {/* Orbital Ring 1: Primary Cyan Inclined Ring */}
      <group ref={orbitRing1Ref} position={[0, 0.18, 0]}>
        <mesh>
          <torusGeometry args={[0.92, 0.009, 12, 64]} />
          <meshBasicMaterial
            color="#00D9FF"
            transparent
            opacity={isHovered ? 0.90 : 0.65}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Orbital Ring 2: Secondary Light Cyan Counter-Tilted Ring */}
      <group ref={orbitRing2Ref} position={[0, 0.20, 0]}>
        <mesh>
          <torusGeometry args={[0.82, 0.007, 12, 64]} />
          <meshBasicMaterial
            color="#38BDF8"
            transparent
            opacity={isHovered ? 0.85 : 0.50}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* 3. Upward Branching Electric Arcs */}
      <lineSegments>
        <bufferGeometry ref={arcGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[arcPositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#38BDF8"
          transparent
          opacity={isHovered ? 0.90 : 0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* 4. Ascending Photon Energy Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00D9FF"
          size={0.038}
          transparent
          opacity={isHovered ? 0.95 : 0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

/**
 * StaffFleetHologram3D
 * Open Floating 3D Electric Vehicle Hologram on the Left Side of Central Vehicle.
 * Coordinates: [-3.8, 0.70, 0.5] — Lowered downward for harmonious horizontal balance
 * with central vehicle [0, 0.14, 0.5] and charging stations [3.6, 0.14, 0.5] / [4.8, 0.14, 0.5].
 *
 * Key features:
 * - NO crystal box or cube enclosure; completely open holographic presentation
 * - Recognizable floating miniature 3D electric vehicle with cyan translucent body,
 *   illuminated contours, glowing glass canopy, cyber neon lightbars, and alloy wheels
 * - Thin circular orbital energy rings & compact floor luminous projection base
 * - Subtle upward electric arcs and ascending photon particles
 * - Top-anchored compact information label "ĐỘI XE" with live vehicle count
 * - Double-click / Click interaction reliably opens shared AdminVehicleSelectionGallery
 */
export const StaffFleetHologram3D: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const setAdminVehicleGalleryOpen = useWorldStore((state) => state.setAdminVehicleGalleryOpen);
  const closeVehicleDetail = useWorldStore((state) => state.closeVehicleDetail);
  const user = useAuthStore((state) => state.user);

  const vehicleFloatGroupRef = useRef<THREE.Group>(null);
  const rootRef = useRef<THREE.Group>(null);

  // Authoritative query for real-time fleet vehicle count
  const { data: vehicles = [] } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
    staleTime: 10000,
  });

  const fleetCount = vehicles.length || 4;

  useFrame(({ clock }, delta) => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const t = clock.getElapsedTime();

    // Gentle floating elevation and subtle yaw rotation
    if (vehicleFloatGroupRef.current) {
      vehicleFloatGroupRef.current.position.y = Math.sin(t * 1.6) * 0.035;
      vehicleFloatGroupRef.current.rotation.y = Math.sin(t * 0.6) * 0.18;
    }

    // Smooth hover scale reaction (zero object allocation)
    if (rootRef.current) {
      const targetScale = isHovered ? 1.05 : 1.0;
      const currentScale = rootRef.current.scale.x;
      const nextScale = THREE.MathUtils.damp(currentScale, targetScale, 8, delta);
      rootRef.current.scale.set(nextScale, nextScale, nextScale);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    closeVehicleDetail();
    setAdminVehicleGalleryOpen(true);
  };

  return (
    <group
      ref={rootRef}
      position={[-3.8, 0.70, 0.5]}
      name="StaffFleetHologram3D"
    >
      {/* 1. Dedicated Interaction Hitbox (Covers the hologram volume stably) */}
      <mesh
        position={[0, 0.25, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setIsHovered(false);
          document.body.style.cursor = 'default';
        }}
        onClick={handleClick}
      >
        <cylinderGeometry args={[1.25, 1.25, 1.6, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* 2. Compact Luminous Energy Projection, Upward Particles & Orbital Rings */}
      <FleetHologramProjection isHovered={isHovered} />

      {/* 3. Open Floating Miniature 3D Electric Vehicle */}
      <group ref={vehicleFloatGroupRef} position={[0, 0.15, 0]}>
        <OpenHolographicVehicle isHovered={isHovered} />
      </group>

      {/* 4. Top-Anchored Compact "ĐỘI XE" Information Label */}
      <Html
        position={[0, 0.88, 0.1]}
        center
        zIndexRange={[10, 0]}
        style={{
          pointerEvents: 'auto',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            background: 'rgba(8, 24, 44, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: isHovered ? '1.5px solid #00D9FF' : '1.2px solid rgba(0, 217, 255, 0.55)',
            boxShadow: isHovered
              ? '0 0 24px rgba(0, 217, 255, 0.55), 0 8px 24px rgba(0, 0, 0, 0.6)'
              : '0 0 16px rgba(0, 217, 255, 0.35), 0 6px 18px rgba(0, 0, 0, 0.5)',
            borderRadius: '9999px',
            padding: '5px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isHovered ? 'scale(1.05)' : 'scale(1.0)',
          }}
        >
          {/* Cyan Glow Car Icon */}
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(0, 217, 255, 0.18)',
              border: '1px solid #00D9FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(0, 217, 255, 0.4)',
            }}
          >
            <Car size={13} color="#00D9FF" />
          </div>

          {/* Label Title */}
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 900,
              color: '#F1F5F9',
              letterSpacing: '0.05em',
            }}
          >
            ĐỘI XE
          </span>

          {/* Vehicle Count Pill */}
          <span
            style={{
              background: 'rgba(0, 217, 255, 0.22)',
              color: '#00D9FF',
              fontSize: '10px',
              fontWeight: 800,
              padding: '1.5px 7px',
              borderRadius: '9999px',
              border: '1px solid rgba(0, 217, 255, 0.5)',
              letterSpacing: '0.02em',
            }}
          >
            {fleetCount} XE
          </span>
        </div>
      </Html>
    </group>
  );
};
