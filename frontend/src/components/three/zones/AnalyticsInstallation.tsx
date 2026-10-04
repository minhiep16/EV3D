import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { TrendingUp } from 'lucide-react';
import { ZoneConfig } from '../../../config/garageZoneConfigs';
import { useWorldStore } from '../../../store/worldStore';

interface AnalyticsInstallationProps {
  zone: ZoneConfig;
  isActive?: boolean;
  isHovered?: boolean;
  isOtherZoneActive?: boolean;
  onSelect?: () => void;
}

// Canonical bar column proportions scaled up ~1.36x height and ~1.32x horizontal spread
const BAR_COLUMNS = [
  { pos: [-0.42, 0.13], h: 0.48 },
  { pos: [-0.20, 0.08], h: 0.75 },
  { pos: [0.04, 0.00], h: 1.12 },
  { pos: [0.29, -0.07], h: 1.45 },
  { pos: [0.52, -0.13], h: 0.98 },
  { pos: [0.16, 0.28], h: 0.65 },
];

/**
 * AnalyticsInstallation:
 * Enhanced High-Presence 3D World Holographic Analytics Zone Installation for EVShare Garage Showroom.
 * Persistent in the dedicated original right-rear zone position [3.2, 0, -3.8].
 *
 * Includes:
 * - Scaled overall ~1.33x in footprint and ~1.38x in vertical height
 * - Solid two-tier architectural pedestal grounded firmly on the floor (+0.18m elevation)
 * - Taller, thicker holographic translucent glass bar columns (0.19m cross-section, up to 1.74m apex)
 * - Dual floating orbit telemetry rings (mid-height and upper apex)
 * - Floating holographic title "PHÂN TÍCH" with subtle subtitle "Hiệu suất & chi phí vận hành"
 * - Visual state modulation: calm ambient presence when inactive, vibrant cyan glow when active
 */
export const AnalyticsInstallation: React.FC<AnalyticsInstallationProps> = ({
  zone,
  isActive = false,
  isHovered = false,
  isOtherZoneActive = false,
  onSelect,
}) => {
  const activeFeature = useWorldStore((state) => state.activeFeature);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const isVehicleSelected = useWorldStore((state) => state.isVehicleSelected);
  const selectedZone = useWorldStore((state) => state.selectedZone);

  // Authoritative garage focus state:
  const isVehicleFocused = Boolean(selectedVehicleId) || isVehicleSelected || selectedZone === 'VEHICLE';
  const isGarageOverview = activeFeature === 'NONE' && !isVehicleFocused;
  const isAnalyticsActive = activeFeature === 'ANALYTICS';

  // Positive allow-list condition: show ONLY in Garage Overview or when Analytics is Active
  const showAnalyticsLabel = isGarageOverview || isAnalyticsActive;
  const midOrbitRingRef = useRef<THREE.Mesh>(null);
  const upperOrbitRingRef = useRef<THREE.Mesh>(null);
  const capsMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Synchronized telemetry orbit animation: dynamic tempo when active, calm drift when ambient
  useFrame((_, delta) => {
    if (midOrbitRingRef.current) {
      const speed = isActive ? 0.55 : isHovered ? 0.28 : 0.08;
      midOrbitRingRef.current.rotation.z += delta * speed;
    }
    if (upperOrbitRingRef.current) {
      const speed = isActive ? -0.42 : isHovered ? -0.20 : -0.06;
      upperOrbitRingRef.current.rotation.z += delta * speed;
    }
    if (capsMaterialRef.current && isActive) {
      const t = performance.now() * 0.002;
      capsMaterialRef.current.emissiveIntensity = 1.4 + Math.sin(t) * 0.4;
    }
  });

  // Contextual opacity & illumination intensities
  const baseRingOpacity = isActive ? 0.80 : isHovered ? 0.52 : isOtherZoneActive ? 0.22 : 0.35;
  const orbitRingOpacity = isActive ? 0.55 : isHovered ? 0.35 : isOtherZoneActive ? 0.14 : 0.22;
  const columnOpacity = isActive ? 0.82 : isHovered ? 0.64 : isOtherZoneActive ? 0.42 : 0.54;
  const capEmissiveIntensity = isActive ? 1.65 : isHovered ? 0.95 : 0.48;

  return (
    <group position={[0, 0, 0]} name="AnalyticsPersistentInstallation">
      {/* =========================================================================
          1. FLOOR GROUNDING & BASE PROJECTION RINGS (Strictly on showroom floor)
          ========================================================================= */}
      {/* Primary Inner Projection Ring */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 0.98, 48]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={baseRingOpacity}
        />
      </mesh>

      {/* Secondary Ambient Halo Projection Ring */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.16, 1.22, 48]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={isActive ? 0.35 : isHovered ? 0.22 : 0.12}
        />
      </mesh>

      {/* =========================================================================
          2. SOLID TWO-TIER ARCHITECTURAL PEDESTAL (Elevates installation by +0.18m)
          ========================================================================= */}
      {/* Lower Tier Plinth Foundation (Grounded firmly on the floor) */}
      <mesh position={[0, 0.045, 0]} receiveShadow>
        <cylinderGeometry args={[1.05, 1.14, 0.09, 48]} />
        <meshStandardMaterial
          color="#040e1e"
          roughness={0.22}
          metalness={0.82}
        />
      </mesh>

      {/* Recessed Cyan LED Accent Band */}
      <mesh position={[0, 0.095, 0]}>
        <cylinderGeometry args={[1.03, 1.03, 0.014, 48, 1, true]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={isActive ? 0.85 : isHovered ? 0.55 : 0.38}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Upper Tier Riser Platform */}
      <mesh position={[0, 0.155, 0]} receiveShadow>
        <cylinderGeometry args={[0.96, 1.02, 0.11, 48]} />
        <meshStandardMaterial
          color="#06182c"
          roughness={0.18}
          metalness={0.75}
        />
      </mesh>

      {/* Satin Platform Top Surface Rim */}
      <mesh position={[0, 0.212, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.90, 0.95, 48]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={isActive ? 0.75 : isHovered ? 0.45 : 0.28}
        />
      </mesh>

      {/* =========================================================================
          3. ELEVATED FLOATING TELEMETRY ORBIT RINGS
          ========================================================================= */}
      {/* Mid-Height Orbit Ring (Around mid bar cluster) */}
      <mesh
        ref={midOrbitRingRef}
        position={[0, 0.95, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.62, 0.65, 48]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={orbitRingOpacity}
        />
      </mesh>

      {/* Upper Counter-Rotating Apex Orbit Halo */}
      <mesh
        ref={upperOrbitRingRef}
        position={[0, 1.55, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.38, 0.40, 36]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={isActive ? 0.42 : isHovered ? 0.25 : 0.12}
        />
      </mesh>

      {/* =========================================================================
          4. ENLARGED HOLOGRAPHIC 3D BAR-CHART SCULPTURE (Mounted atop raised platform)
          ========================================================================= */}
      <group position={[0, 0.215, 0]}>
        {BAR_COLUMNS.map((col, idx) => (
          <group key={idx} position={[col.pos[0], 0, col.pos[1]]}>
            {/* Column Body: Substantial Translucent Cyan Glass Block (0.19m wide) */}
            <mesh position={[0, col.h / 2, 0]} castShadow>
              <boxGeometry args={[0.19, col.h, 0.19]} />
              <meshStandardMaterial
                color={isActive ? '#00c6ff' : '#0284c7'}
                roughness={isActive ? 0.08 : 0.18}
                metalness={isActive ? 0.78 : 0.55}
                transparent
                opacity={columnOpacity}
              />
            </mesh>

            {/* Glowing Emissive Top Cap */}
            <mesh position={[0, col.h + 0.01, 0]}>
              <boxGeometry args={[0.195, 0.02, 0.195]} />
              <meshStandardMaterial
                ref={idx === 3 ? capsMaterialRef : undefined}
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={capEmissiveIntensity}
              />
            </mesh>
          </group>
        ))}

        {/* 5. Holographic Upward Data Vector (Connecting key bar summits) */}
        <mesh position={[0.06, 0.95, 0.02]} rotation={[0, 0, 0.40]}>
          <planeGeometry args={[0.92, 0.016]} />
          <meshBasicMaterial
            color="#00f2fe"
            transparent
            opacity={isActive ? 0.70 : isHovered ? 0.45 : 0.25}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 6. Peak Telemetry Beacon Node (Crown apex of column 3 at h = 1.45m) */}
        <mesh position={[0.29, 1.45 + 0.065, -0.07]}>
          <sphereGeometry args={[0.026, 16, 16]} />
          <meshBasicMaterial
            color="#00f2fe"
            transparent
            opacity={isActive ? 0.95 : isHovered ? 0.70 : 0.40}
          />
        </mesh>

        {/* Halo beacon ring around apex node */}
        <mesh position={[0.29, 1.45 + 0.065, -0.07]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.05, 0.065, 24]} />
          <meshBasicMaterial
            color="#00f2fe"
            transparent
            opacity={isActive ? 0.65 : isHovered ? 0.35 : 0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* =========================================================================
          5. HOLOGRAPHIC ZONE TITLE "PHÂN TÍCH" FLOATING ABOVE INSTALLATION
          Positioned at y = 2.14m: Centered, elevated above highest bar (h = 1.74m)
          Always mounted in both active and inactive states with contextual glow
          ========================================================================= */}
      {/* Subtle Vertical Data Link Tether beneath Title */}
      <mesh position={[0, 1.94, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.22, 8]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={isActive ? 0.65 : 0.25}
        />
      </mesh>

      <mesh position={[0, 2.05, 0]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={isActive ? 0.85 : 0.40}
        />
      </mesh>

      {/* World-Space Holographic Badge Billboard */}
      {showAnalyticsLabel && (
        <Billboard position={[0, 2.15, 0]} follow lockX={false} lockY={false} lockZ={false}>
          <Html
            transform
            distanceFactor={4.2}
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '8px 18px',
                background: isActive
                  ? 'linear-gradient(180deg, rgba(4, 22, 42, 0.90) 0%, rgba(2, 10, 24, 0.96) 100%)'
                  : isHovered
                    ? 'linear-gradient(180deg, rgba(4, 18, 34, 0.75) 0%, rgba(2, 8, 18, 0.85) 100%)'
                    : 'linear-gradient(180deg, rgba(4, 16, 30, 0.65) 0%, rgba(2, 8, 16, 0.78) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isActive
                  ? '1.5px solid rgba(0, 242, 254, 0.95)'
                  : isHovered
                    ? '1.2px solid rgba(0, 242, 254, 0.65)'
                    : '1px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '12px',
                boxShadow: isActive
                  ? '0 0 28px rgba(0, 242, 254, 0.60), 0 8px 26px rgba(0, 0, 0, 0.65), inset 0 0 16px rgba(0, 242, 254, 0.22)'
                  : isHovered
                    ? '0 0 16px rgba(0, 242, 254, 0.38), 0 6px 18px rgba(0, 0, 0, 0.50)'
                    : '0 0 12px rgba(0, 242, 254, 0.20), 0 4px 16px rgba(0, 0, 0, 0.45)',
                color: '#ffffff',
                fontFamily: "var(--font-family, 'Outfit', sans-serif)",
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {/* Header: Icon + Primary Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    background: isActive ? 'rgba(0, 242, 254, 0.25)' : 'rgba(0, 242, 254, 0.14)',
                    border: '1px solid rgba(0, 242, 254, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive ? '0 0 10px rgba(0, 242, 254, 0.6)' : 'none',
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={12} color="#00f2fe" />
                </div>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    textShadow: isActive
                      ? '0 0 14px rgba(0, 242, 254, 0.95), 0 0 28px rgba(0, 242, 254, 0.65)'
                      : isHovered
                        ? '0 0 10px rgba(0, 242, 254, 0.70)'
                        : '0 0 8px rgba(0, 242, 254, 0.45)',
                  }}
                >
                  PHÂN TÍCH
                </span>
              </div>
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
};
