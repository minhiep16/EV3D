import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { HologramCore3D } from './widgets/HologramCore3D';
import { HologramDonutWidget } from './widgets/HologramDonutWidget';
import { HologramMetricsWidget } from './widgets/HologramMetricsWidget';
import { HologramBarChartWidget } from './widgets/HologramBarChartWidget';

interface FinanceHeroHologramProps {
  position?: [number, number, number];
  fundTotal?: string;
  userPercentage?: number;
  monthlyExpense?: string;
  visible?: boolean;
}

/**
 * FinanceHeroHologram: Authoritative Panoramic Curved 3D Financial Holographic HUD
 * Perfectly staged above the vehicle roof and showroom podium to match reference design.
 * 
 * 2-Tier Cockpit Composition:
 * - Upper Center: Dominant curved "QUỸ CHUNG 25.000.000đ" visor banner (Apex)
 * - Lower Left: "của bạn" Donut chart panel (Wing 1, tilted inward)
 * - Lower Right: "Phân bổ chi phí" Telemetry bar chart panel (Wing 2, tilted inward)
 * - Central Nexus: Dedicated open window housing the 3D glowing crystal core & concentric rings
 * - Vehicle Integration: Downward vertical projection rays & cone grounding projection to car roof
 */
export const FinanceHeroHologram: React.FC<FinanceHeroHologramProps> = ({
  position = [0.0, 2.70, 1.8],
  fundTotal = '25.000.000đ',
  userPercentage,
  visible = true,
}) => {
  const isFinanceDetailModalOpen = useWorldStore((state) => state.isFinanceDetailModalOpen);
  const user = useAuthStore((state) => state.user);
  const groupRef = useRef<THREE.Group>(null);
  const floatRef = useRef<THREE.Group>(null);

  // Authoritative fallback percentage based on authenticated user identity
  const effectivePercentage = userPercentage !== undefined
    ? userPercentage
    : (user?.id === '00000000-0000-0000-0000-000000000012' || user?.fullName?.includes('Tran Thi B') ? 30
      : user?.id === '00000000-0000-0000-0000-000000000013' || user?.fullName?.includes('Le Van C') ? 30
      : user?.id === 'cbd7b894-a6c6-4b51-81d0-9a344715755b' || user?.fullName?.includes('Nguyen Van A') ? 40 : 30);

  useFrame((state) => {
    if (floatRef.current) {
      const time = state.clock.getElapsedTime();
      // Gentle spatial breathing floating effect
      floatRef.current.position.y = Math.sin(time * 1.5) * 0.025;
    }
  });

  if (!visible || isFinanceDetailModalOpen) {
    return null;
  }

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Base 3D Projection Engine: Vehicle roof emitter, vertical projection rays,
             conical beam, central crystal diamond core at y = -0.10, and horizontal rings at y = -0.26 */}
      <HologramCore3D position={[0, 0, 0]} color="#00f2fe" />

      {/* 2. Panoramic Curved Hologram Canopy (Face-Camera Billboard with true 3D spatial depth) */}
      <Billboard follow={true}>
        <group ref={floatRef}>
          <Html
            center
            distanceFactor={8.4}
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
              animation: 'hologramEntrance 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '680px',
                height: '210px',
                margin: 0,
                perspective: '1000px',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* ======================================================== */}
              {/* TOP CONTINUOUS CURVED CANOPY ARCH (PANORAMIC VISOR RAIL) */}
              {/* ======================================================== */}
              <div
                style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '12px',
                  right: '12px',
                  height: '28px',
                  borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                  borderTop: '2.5px solid rgba(0, 242, 254, 0.85)',
                  boxShadow: `
                    0 0 18px rgba(0, 242, 254, 0.55),
                    0 0 32px rgba(0, 242, 254, 0.25),
                    inset 0 1px 0 rgba(255, 255, 255, 0.70)
                  `,
                  pointerEvents: 'none',
                  zIndex: 12,
                }}
              >
                {/* Center High-Glow Brow Accent */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '42%',
                    right: '42%',
                    height: '2.5px',
                    borderRadius: '2px',
                    background: '#ffffff',
                    boxShadow: '0 0 10px #00f2fe, 0 0 16px rgba(0, 242, 254, 0.6)',
                  }}
                />

                {/* Left & Right Wing Calibration Ticks */}
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: '14%',
                    width: '24px',
                    height: '1.5px',
                    background: 'rgba(0, 242, 254, 0.5)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '14%',
                    width: '24px',
                    height: '1.5px',
                    background: 'rgba(0, 242, 254, 0.5)',
                  }}
                />
              </div>

              {/* Outer Left Hologram Boundary Arc (Curved Cylindrical Guide) */}
              <div
                style={{
                  position: 'absolute',
                  top: '24px',
                  bottom: '16px',
                  left: '-6px',
                  width: '16px',
                  borderLeft: '1.5px solid rgba(0, 242, 254, 0.40)',
                  borderRadius: '50% 0 0 50% / 30% 0 0 30%',
                  boxShadow: '-3px 0 10px rgba(0, 242, 254, 0.18)',
                  pointerEvents: 'none',
                  zIndex: 3,
                }}
              >
                <div style={{ position: 'absolute', top: '30%', left: 0, width: '4px', height: '1.5px', background: 'rgba(0, 242, 254, 0.5)' }} />
                <div style={{ position: 'absolute', top: '70%', left: 0, width: '4px', height: '1.5px', background: 'rgba(0, 242, 254, 0.5)' }} />
              </div>

              {/* Outer Right Hologram Boundary Arc (Curved Cylindrical Guide) */}
              <div
                style={{
                  position: 'absolute',
                  top: '24px',
                  bottom: '16px',
                  right: '-6px',
                  width: '16px',
                  borderRight: '1.5px solid rgba(0, 242, 254, 0.40)',
                  borderRadius: '0 50% 50% 0 / 0 30% 30% 0',
                  boxShadow: '3px 0 10px rgba(0, 242, 254, 0.18)',
                  pointerEvents: 'none',
                  zIndex: 3,
                }}
              >
                <div style={{ position: 'absolute', top: '30%', right: 0, width: '4px', height: '1.5px', background: 'rgba(0, 242, 254, 0.5)' }} />
                <div style={{ position: 'absolute', top: '70%', right: 0, width: '4px', height: '1.5px', background: 'rgba(0, 242, 254, 0.5)' }} />
              </div>

              {/* ======================================================== */}
              {/* FAINT CYLINDRICAL HOLOGRAPHIC GRID BACKDROP              */}
              {/* ======================================================== */}
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '50px',
                  right: '50px',
                  bottom: '8px',
                  borderRadius: '50% 50% 40% 40% / 30% 30% 20% 20%',
                  border: '1px dashed rgba(0, 242, 254, 0.12)',
                  boxShadow: 'inset 0 0 20px rgba(0, 242, 254, 0.05)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />

              {/* ======================================================== */}
              {/* TIER 1 (UPPER CENTER): MAIN "QUỸ CHUNG" CURVED BANNER    */}
              {/* ======================================================== */}
              <div
                style={{
                  position: 'absolute',
                  top: '0px',
                  left: '50%',
                  transform: 'translateX(-50%) perspective(900px) translateZ(14px) rotateX(2deg)',
                  zIndex: 10,
                  width: '295px',
                  display: 'flex',
                  justifyContent: 'center',
                  transformStyle: 'preserve-3d',
                }}
              >
                <HologramMetricsWidget
                  title="QUỸ CHUNG"
                  amount={fundTotal}
                  subtitle="Tổng quỹ sở hữu & chi phí vận hành"
                  accentColor="#00f2fe"
                />
              </div>

              {/* ======================================================== */}
              {/* TIER 2 (LOWER LEFT WING): HOLOGRAPHIC DONUT CHART PANEL  */}
              {/* Curved inward along semi-cylindrical panoramic arc        */}
              {/* ======================================================== */}
              <div
                style={{
                  position: 'absolute',
                  top: '56px',
                  left: '6px',
                  width: '195px',
                  transform: 'perspective(900px) rotateY(13deg) rotateZ(-1.2deg) translateZ(0px) rotateX(1deg)',
                  transformOrigin: 'right center',
                  zIndex: 6,
                  transformStyle: 'preserve-3d',
                }}
              >
                <HologramDonutWidget
                  userPercentage={effectivePercentage}
                  userLabel="của bạn"
                  accentCyan="#00f2fe"
                  accentPurple="#a855f7"
                />
              </div>

              {/* ======================================================== */}
              {/* TIER 2 (LOWER RIGHT WING): TELEMETRY BAR CHART PANEL     */}
              {/* Curved inward along semi-cylindrical panoramic arc        */}
              {/* ======================================================== */}
              <div
                style={{
                  position: 'absolute',
                  top: '56px',
                  right: '6px',
                  width: '195px',
                  transform: 'perspective(900px) rotateY(-13deg) rotateZ(1.2deg) translateZ(0px) rotateX(1deg)',
                  transformOrigin: 'left center',
                  zIndex: 6,
                  transformStyle: 'preserve-3d',
                }}
              >
                <HologramBarChartWidget
                  title="Phân bổ chi phí"
                  subtitle="Minh bạch · Tự động · Theo thời gian thực"
                  accentColor="#00f2fe"
                />
              </div>

              {/* ======================================================== */}
              {/* HOLOGRAPHIC ENERGY CONDUIT CONNECTORS                    */}
              {/* Curved bridges linking wings into crystal core nexus     */}
              {/* ======================================================== */}
              {/* Left Conduit to Hub */}
              <div
                style={{
                  position: 'absolute',
                  top: '98px',
                  left: '194px',
                  width: '38px',
                  height: '6px',
                  borderBottom: '2px solid rgba(0, 242, 254, 0.70)',
                  borderRadius: '0 0 50% 50% / 0 0 100% 100%',
                  boxShadow: '0 2px 8px rgba(0, 242, 254, 0.45)',
                  transform: 'rotate(-4deg)',
                  zIndex: 4,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: '-3px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 0 8px #00f2fe',
                  }}
                />
              </div>

              {/* Right Conduit to Hub */}
              <div
                style={{
                  position: 'absolute',
                  top: '98px',
                  right: '194px',
                  width: '38px',
                  height: '6px',
                  borderBottom: '2px solid rgba(0, 242, 254, 0.70)',
                  borderRadius: '0 0 50% 50% / 0 0 100% 100%',
                  boxShadow: '0 2px 8px rgba(0, 242, 254, 0.45)',
                  transform: 'rotate(4deg)',
                  zIndex: 4,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: '-3px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 0 8px #00f2fe',
                  }}
                />
              </div>

              {/* Bottom Subtle Curved Cradle Under Wings */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '12px',
                  right: '12px',
                  height: '20px',
                  borderRadius: '0 0 50% 50% / 0 0 100% 100%',
                  borderBottom: '1.5px solid rgba(0, 242, 254, 0.35)',
                  boxShadow: '0 0 12px rgba(0, 242, 254, 0.18)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            </div>
          </Html>
        </group>
      </Billboard>
    </group>
  );
};


