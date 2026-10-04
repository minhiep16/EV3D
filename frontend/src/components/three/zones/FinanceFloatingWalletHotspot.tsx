import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Wallet, Sparkles, ArrowRight } from 'lucide-react';
import { ZoneConfig } from '../../../config/garageZoneConfigs';
import { useWorldStore } from '../../../store/worldStore';

interface FinanceFloatingWalletHotspotProps {
  zone: ZoneConfig;
  isActive?: boolean;
  isHovered?: boolean;
  isOtherZoneActive?: boolean;
  onSelect?: () => void;
}

/**
 * FinanceFloatingWalletHotspot:
 * High-End Left-Front Finance 3D Interaction Desk + Option 2 Floating Wallet Hologram.
 * Repositioned to align with car front in the left-front showroom area at [-4.2, 0, 3.2].
 *
 * Structure:
 * 1. Concentric Floor Projection Base: Rotating cyan floor rings & ambient halo
 * 2. Futuristic Finance Interaction Desk: Pearl-white kiosk body, dark tempered glass countertop,
 *    and glowing cyan perimeter LED rim angled toward the camera/user.
 * 3. Integrated Screen Console: Ergonomically angled display showing balance & interaction hint.
 * 4. Option 2 Floating Holographic Wallet: Translucent cyan glass body, glowing wireframe,
 *    card slot, security clasp, and ascending holographic light ray.
 * 5. World-Space Billboard Label: "TÀI CHÍNH" / "Quỹ chung & chi phí" at comfortable height.
 * 6. Unified Hitbox: Clear, forgiving click area covering desk, screen, and wallet.
 */
export const FinanceFloatingWalletHotspot: React.FC<FinanceFloatingWalletHotspotProps> = ({
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
  const isFinanceActive = activeFeature === 'FINANCE';

  // Positive allow-list condition: show ONLY in Garage Overview or when Finance is Active
  const showFinanceLabel = isGarageOverview || isFinanceActive;

  const [internalHover, setInternalHover] = useState(false);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const walletGroupRef = useRef<THREE.Group>(null);
  const claspMeshRef = useRef<THREE.MeshStandardMaterial>(null);

  const effectiveHovered = isHovered || internalHover;

  // Smooth floating bob and ring rotations in useFrame
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Gentle floating bob & subtle orientation drift for wallet
    if (walletGroupRef.current) {
      walletGroupRef.current.position.y = 1.16 + Math.sin(t * 1.5) * 0.022;
      walletGroupRef.current.rotation.y = Math.sin(t * 0.8) * 0.06;
    }

    // Floor projection ring rotations
    if (outerRingRef.current) {
      const outerSpeed = isActive ? 0.45 : effectiveHovered ? 0.28 : 0.12;
      outerRingRef.current.rotation.z += delta * outerSpeed;
    }
    if (innerRingRef.current) {
      const innerSpeed = isActive ? -0.65 : effectiveHovered ? -0.38 : -0.15;
      innerRingRef.current.rotation.z += delta * innerSpeed;
    }

    // Clasp pulse when active or hovered
    if (claspMeshRef.current) {
      if (isActive) {
        claspMeshRef.current.emissiveIntensity = 1.8 + Math.sin(t * 2.8) * 0.5;
      } else if (effectiveHovered) {
        claspMeshRef.current.emissiveIntensity = 1.2;
      } else {
        claspMeshRef.current.emissiveIntensity = 0.6;
      }
    }
  });

  // Dynamic visual intensities
  const baseRingOpacity = isActive ? 0.85 : effectiveHovered ? 0.65 : isOtherZoneActive ? 0.24 : 0.40;
  const rayOpacity = isActive ? 0.26 : effectiveHovered ? 0.18 : isOtherZoneActive ? 0.06 : 0.10;
  const walletOpacity = isActive ? 0.90 : effectiveHovered ? 0.78 : isOtherZoneActive ? 0.50 : 0.68;
  const wireframeOpacity = isActive ? 0.92 : effectiveHovered ? 0.70 : isOtherZoneActive ? 0.30 : 0.44;
  const deskLedIntensity = isActive ? 1.6 : effectiveHovered ? 1.25 : 0.75;

  const handleClick = (e?: ThreeEvent<MouseEvent> | React.MouseEvent) => {
    if (e && 'stopPropagation' in e) {
      e.stopPropagation();
    }
    if (onSelect) {
      onSelect();
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setInternalHover(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setInternalHover(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group
      position={[0, 0, 0]}
      rotation={[0, 0.42, 0]} // Ergonomically angled toward the user/camera from the left-front corner
      name="FinanceInteractionDeskAndHotspot"
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* =========================================================================
          1. FLOOR PROJECTION BASE (Concentric rings under desk, no oversized platform)
          ========================================================================= */}
      {/* Soft Ambient Floor Glow Halo Pool */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.90, 1.05, 48]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={isActive ? 0.35 : effectiveHovered ? 0.22 : 0.10}
        />
      </mesh>

      {/* Outer Rotating Floor Projection Ring */}
      <mesh
        ref={outerRingRef}
        position={[0, 0.007, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.74, 0.78, 48]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={baseRingOpacity}
        />
      </mesh>

      {/* Inner Counter-Rotating Floor Projection Ring */}
      <mesh
        ref={innerRingRef}
        position={[0, 0.008, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.52, 0.55, 48]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={baseRingOpacity * 0.85}
        />
      </mesh>

      {/* =========================================================================
          2. FUTURISTIC FINANCE INTERACTION DESK / KIOSK
          Inspired by a luxury EV showroom handover / digital service counter.
          ========================================================================= */}
      <group position={[0, 0, 0]}>
        {/* Recessed Dark Plinth Footing */}
        <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.82, 0.05, 0.40]} />
          <meshStandardMaterial
            color="#081424"
            roughness={0.4}
            metalness={0.8}
          />
        </mesh>

        {/* Main Desk Body: Pearl-White Futuristic Monolith */}
        <mesh position={[0, 0.40, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.88, 0.70, 0.44]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.22}
            metalness={0.15}
          />
        </mesh>

        {/* Front Sculpted Recessed Inset Panel */}
        <mesh position={[0, 0.38, 0.222]}>
          <planeGeometry args={[0.78, 0.56]} />
          <meshStandardMaterial
            color="#e2e8f0"
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>

        {/* Vertical Decorative Cyan Status Accent Seams */}
        {[-0.34, 0.34].map((px, idx) => (
          <mesh key={`v-accent-${idx}`} position={[px, 0.38, 0.223]}>
            <planeGeometry args={[0.008, 0.52]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={effectiveHovered || isActive ? 0.85 : 0.4}
            />
          </mesh>
        ))}

        {/* Glowing Perimeter Cyan LED Light Strip beneath Countertop */}
        <mesh position={[0, 0.748, 0]}>
          <boxGeometry args={[0.90, 0.014, 0.455]} />
          <meshStandardMaterial
            color="#00f2fe"
            emissive="#00f2fe"
            emissiveIntensity={deskLedIntensity}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Dark Tempered Glass Countertop Slab */}
        <mesh position={[0, 0.762, 0]} receiveShadow>
          <boxGeometry args={[0.90, 0.016, 0.45]} />
          <meshStandardMaterial
            color="#041426"
            roughness={0.08}
            metalness={0.88}
            transparent
            opacity={0.92}
          />
        </mesh>

        {/* Holographic Projection Aperture Collar on Countertop */}
        <mesh position={[0, 0.771, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.13, 0.16, 32]} />
          <meshBasicMaterial
            color="#00f2fe"
            transparent
            opacity={effectiveHovered || isActive ? 0.95 : 0.6}
          />
        </mesh>
        <mesh position={[0, 0.770, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.13, 32]} />
          <meshBasicMaterial
            color="#0284c7"
            transparent
            opacity={effectiveHovered || isActive ? 0.45 : 0.25}
          />
        </mesh>
      </group>

      {/* =========================================================================
          3. INTEGRATED DISPLAY SCREEN CONSOLE (Upper-Front Angled Face)
          ========================================================================= */}
      <group position={[0, 0.66, 0.23]} rotation={[-0.48, 0, 0]}>
        {/* Screen Bezel Chassis */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.54, 0.28, 0.02]} />
          <meshStandardMaterial
            color="#051222"
            roughness={0.15}
            metalness={0.85}
          />
        </mesh>

        {/* Cyan Glowing Frame Rim */}
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.544, 0.284]} />
          <meshBasicMaterial
            color="#00f2fe"
            wireframe
            transparent
            opacity={isActive ? 0.95 : effectiveHovered ? 0.75 : 0.45}
          />
        </mesh>

        {/* Screen Active Display Surface */}
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.52, 0.26]} />
          <meshBasicMaterial
            color={isActive ? '#07243e' : '#041528'}
          />
        </mesh>

        {/* Crisp World-Space Screen UI Content via Drei Html */}
        {showFinanceLabel && (
          <Html
            transform
            distanceFactor={3.2}
            position={[0, 0, 0.015]}
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
              width: '260px',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                fontFamily: "var(--font-family, 'Outfit', sans-serif)",
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {/* Top Bar: Icon + Zone Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={12} color={isActive ? '#00f2fe' : effectiveHovered ? '#38bdf8' : '#64748b'} />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: isActive ? '#ffffff' : effectiveHovered ? '#e2e8f0' : '#94a3b8',
                    textTransform: 'uppercase',
                  }}
                >
                  TÀI CHÍNH
                </span>
              </div>

              {/* Subtitle / Live Metric - ONLY display live financial value when active */}
              {isActive ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', margin: '2px 0' }}>
                  <span style={{ fontSize: '8.5px', color: '#7dd3fc', fontWeight: 500 }}>
                    Quỹ chung nhóm EV01
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.02em' }}>
                    25.000.000 ₫
                  </span>
                </div>
              ) : (
                <span
                  style={{
                    fontSize: '9.5px',
                    color: effectiveHovered ? '#94a3b8' : '#64748b',
                    fontWeight: 500,
                    margin: '3px 0 1px 0',
                  }}
                >
                  Quỹ chung & chi phí
                </span>
              )}

              {/* Micro Action Hint */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '8.5px',
                  color: isActive ? '#38bdf8' : effectiveHovered ? '#7dd3fc' : '#64748b',
                  fontWeight: 600,
                  transition: 'color 0.2s ease',
                }}
              >
                <span>{isActive ? 'ĐANG HIỂN THỊ' : 'NHẤN ĐỂ MỞ'}</span>
                <ArrowRight size={10} color={isActive ? '#38bdf8' : effectiveHovered ? '#7dd3fc' : '#64748b'} />
              </div>
            </div>
          </Html>
        )}
      </group>

      {/* =========================================================================
          4. VERTICAL PROJECTION CONE (Light ray rising from desk aperture to wallet)
          ========================================================================= */}
      <mesh position={[0, 0.96, -0.05]}>
        <cylinderGeometry args={[0.16, 0.24, 0.38, 32, 1, true]} />
        <meshBasicMaterial
          color="#00f2fe"
          transparent
          opacity={rayOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* =========================================================================
          5. OPTION 2 FLOATING WALLET HOLOGRAM (Floating above the desk)
          ========================================================================= */}
      <group ref={walletGroupRef} position={[0, 1.16, -0.05]}>
        {/* Holographic Rounded Glass Container Aura */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.54, 0.42]} />
          <meshBasicMaterial
            color="#00f2fe"
            transparent
            opacity={isActive ? 0.22 : effectiveHovered ? 0.16 : 0.08}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Wallet Main Body (Translucent cyan glass block) */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.28, 0.08]} />
          <meshStandardMaterial
            color={isActive ? '#00c6ff' : '#0284c7'}
            roughness={0.12}
            metalness={0.78}
            transparent
            opacity={walletOpacity}
          />
        </mesh>

        {/* Emissive Outer Glowing Edge Wireframe */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.428, 0.288, 0.086]} />
          <meshBasicMaterial
            color="#00f2fe"
            wireframe
            transparent
            opacity={wireframeOpacity}
          />
        </mesh>

        {/* Wallet Front Pocket Flap */}
        <mesh position={[0, -0.048, 0.042]}>
          <boxGeometry args={[0.40, 0.14, 0.012]} />
          <meshStandardMaterial
            color="#031b34"
            roughness={0.20}
            metalness={0.80}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* Glowing Credit Card / Fund Token peeking out of top slot */}
        <mesh position={[0, 0.10, -0.008]}>
          <boxGeometry args={[0.34, 0.075, 0.01]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#00f2fe"
            emissiveIntensity={isActive ? 1.6 : effectiveHovered ? 1.15 : 0.7}
          />
        </mesh>

        {/* Center Golden/Cyan Security Clasp Latch */}
        <mesh position={[0, 0.016, 0.048]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.014, 16]} />
          <meshStandardMaterial
            ref={claspMeshRef}
            color="#00f2fe"
            emissive="#00f2fe"
            emissiveIntensity={isActive ? 1.8 : effectiveHovered ? 1.2 : 0.6}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Floating Apex Fund Glyph Spark */}
        <mesh position={[0, 0.20, 0]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshBasicMaterial
            color="#00f2fe"
            transparent
            opacity={isActive ? 0.95 : effectiveHovered ? 0.75 : 0.45}
          />
        </mesh>
      </group>

      {/* =========================================================================
          6. WORLD-SPACE BILLBOARD LABEL "TÀI CHÍNH" ABOVE WALLET
          Positioned at y = 1.55m: Clearly visible, comfortable clearance below AI hint
          ========================================================================= */}
      {showFinanceLabel && (
        <Billboard position={[0, 1.55, -0.05]} follow lockX={false} lockY={false} lockZ={false}>
          <Html
            transform
            distanceFactor={4.5}
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
                padding: '7px 16px',
                background: isActive
                  ? 'linear-gradient(180deg, rgba(4, 24, 46, 0.92) 0%, rgba(2, 12, 26, 0.98) 100%)'
                  : effectiveHovered
                    ? 'linear-gradient(180deg, rgba(4, 20, 38, 0.82) 0%, rgba(2, 10, 20, 0.90) 100%)'
                    : 'linear-gradient(180deg, rgba(4, 16, 30, 0.68) 0%, rgba(2, 8, 16, 0.80) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isActive
                  ? '1.5px solid rgba(0, 242, 254, 0.95)'
                  : effectiveHovered
                    ? '1.2px solid rgba(0, 242, 254, 0.75)'
                    : '1px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '12px',
                boxShadow: isActive
                  ? '0 0 28px rgba(0, 242, 254, 0.60), 0 8px 24px rgba(0, 0, 0, 0.65), inset 0 0 14px rgba(0, 242, 254, 0.22)'
                  : effectiveHovered
                    ? '0 0 18px rgba(0, 242, 254, 0.42), 0 6px 18px rgba(0, 0, 0, 0.50)'
                    : '0 0 12px rgba(0, 242, 254, 0.20), 0 4px 14px rgba(0, 0, 0, 0.45)',
                color: '#ffffff',
                fontFamily: "var(--font-family, 'Outfit', sans-serif)",
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {/* Header: Icon + Primary Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
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
                  <Wallet size={12} color="#00f2fe" />
                </div>
                <span
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    textShadow: isActive
                      ? '0 0 14px rgba(0, 242, 254, 0.95), 0 0 28px rgba(0, 242, 254, 0.65)'
                      : effectiveHovered
                        ? '0 0 12px rgba(0, 242, 254, 0.75)'
                        : '0 0 8px rgba(0, 242, 254, 0.45)',
                  }}
                >
                  TÀI CHÍNH
                </span>
              </div>

              {/* Subtitle */}
              <span
                style={{
                  fontSize: '9.5px',
                  color: isActive ? '#7dd3fc' : '#94a3b8',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  lineHeight: '1.2',
                  opacity: isActive ? 1.0 : 0.85,
                }}
              >
                Quỹ chung & chi phí
              </span>
            </div>
          </Html>
        </Billboard>
      )}

      {/* =========================================================================
          7. INVISIBLE ENLARGED HITBOX COLLIDER (Seamless click & hover target)
          Spans the desk, screen, and floating wallet for comfortable clicking.
          ========================================================================= */}
      <mesh position={[0, 0.80, 0]} visible={false}>
        <boxGeometry args={[1.05, 1.62, 0.65]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};
