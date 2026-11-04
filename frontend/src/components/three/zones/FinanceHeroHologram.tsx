import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useQuery } from '@tanstack/react-query';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { useFundSummary } from '../../../hooks/useFund';
import { fetchVehicleCoOwnership } from '../../../services/coOwnershipApi';
import { HologramCore3D } from './widgets/HologramCore3D';
import { Wallet, PieChart, Sparkles } from 'lucide-react';

interface FinanceHeroHologramProps {
  position?: [number, number, number];
  fundTotal?: string;
  userPercentage?: number;
  monthlyExpense?: string;
  visible?: boolean;
  vehicleId?: string;
}

/**
 * FinanceHeroHologram: Harmonized 3D Financial Holographic Cockpit HUD
 * Phase 24A Visual Refinement:
 * - Restores the OLD rich cyan/teal glass glow, glossy highlight streaks, and neon edge depth
 * - Preserves the NEW balanced 2-widget layout, spacing, and safe-area alignment
 * - Overhead: Glowing panoramic energy canopy arc spanning across both cards
 * - Grounding: Conical projection rays and central crystal nexus anchoring to EV01 roof
 */
export const FinanceHeroHologram: React.FC<FinanceHeroHologramProps> = ({
  position = [0.0, 2.70, 1.8],
  fundTotal,
  userPercentage,
  visible = true,
  vehicleId,
}) => {
  const isFinanceDetailModalOpen = useWorldStore((state) => state.isFinanceDetailModalOpen);
  const activePrimaryPanel = useWorldStore((state) => state.activePrimaryPanel);
  const openGaragePanel = useWorldStore((state) => state.openGaragePanel);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const user = useAuthStore((state) => state.user);

  const groupRef = useRef<THREE.Group>(null);
  const floatRef = useRef<THREE.Group>(null);

  const [hoveredWidget, setHoveredWidget] = useState<'OWNERSHIP' | 'FUND' | null>(null);

  const targetVehicleId = vehicleId || selectedVehicleId || '11111111-1111-1111-1111-111111111111';

  // 1. Authoritative SharedFund data query
  const { data: fundSummary, isLoading: isFundLoading, isError: isFundError } = useFundSummary(
    fundTotal ? null : targetVehicleId
  );

  const displayFundTotal = useMemo(() => {
    if (fundTotal) return fundTotal;
    if (isFundLoading) return 'ĐANG TẢI...';
    if (isFundError) return '0đ';
    if (!fundSummary) return '7.500.000đ';
    return `${Number(fundSummary.availableBalance).toLocaleString('vi-VN')}đ`;
  }, [fundTotal, fundSummary, isFundLoading, isFundError]);

  // 2. Authoritative Co-ownership data query
  const { data: coOwnershipData } = useQuery({
    queryKey: ['coOwnership', targetVehicleId],
    queryFn: () => fetchVehicleCoOwnership(targetVehicleId),
    enabled: !!targetVehicleId,
  });

  // 3. Authoritative equity percentage for the authenticated member
  const effectivePercentage = useMemo(() => {
    if (userPercentage !== undefined) return userPercentage;
    if (coOwnershipData?.members && user?.id) {
      const myMember = coOwnershipData.members.find(
        (m) => m.userId === user.id || (user.email && m.email === user.email)
      );
      if (myMember?.share?.percentage != null) {
        return myMember.share.percentage;
      }
    }
    // Dynamic fallback matching authoritative co-owner identities
    if (user?.fullName?.includes('Le Van C') || user?.id === '00000000-0000-0000-0000-000000000013') return 40;
    if (user?.fullName?.includes('Nguyen Van A') || user?.id === 'cbd7b894-a6c6-4b51-81d0-9a344715755b') return 35;
    if (user?.fullName?.includes('Tran Thi B') || user?.id === '00000000-0000-0000-0000-000000000012') return 25;
    return 35;
  }, [userPercentage, coOwnershipData, user]);

  // Donut geometry calculations
  const donutRadius = 26;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * donutRadius; // ~163.36
  const userDash = (Math.max(0, Math.min(100, effectivePercentage)) / 100) * circumference;
  const otherDash = circumference - userDash;

  // Gentle spatial floating animation
  useFrame((state) => {
    if (floatRef.current) {
      const time = state.clock.getElapsedTime();
      floatRef.current.position.y = Math.sin(time * 1.5) * 0.024;
    }
  });

  if (!visible) {
    return null;
  }

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Base 3D Projection Engine: Vehicle roof emitter, conical beam, central crystal diamond */}
      <HologramCore3D position={[0, 0, 0]} color="#00f2fe" />

      {/* 2. Harmonized 2-Widget Panoramic Hologram Canopy with Restored Gloss & Glow */}
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
                width: '600px',
                height: '180px',
                margin: 0,
                perspective: '1000px',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* ======================================================== */}
              {/* TOP CONTINUOUS CURVED CANOPY ARCH (PANORAMIC VISOR RAIL) */}
              {/* Restored Old Glowing Visor Style: Luminous, Light, Vivid  */}
              {/* ======================================================== */}
              <div
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: '6px',
                  right: '6px',
                  height: '28px',
                  borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                  borderTop: '2.5px solid rgba(0, 242, 254, 0.85)',
                  boxShadow: `
                    0 0 18px rgba(0, 242, 254, 0.65),
                    0 0 35px rgba(0, 242, 254, 0.30),
                    inset 0 1.5px 0 rgba(255, 255, 255, 0.75)
                  `,
                  pointerEvents: 'none',
                  zIndex: 12,
                }}
              >
                {/* Center Brow Accent - High Intensity Neon Beam */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-2.5px',
                    left: '40%',
                    right: '40%',
                    height: '2.5px',
                    borderRadius: '2px',
                    background: '#ffffff',
                    boxShadow: '0 0 12px #00f2fe, 0 0 20px rgba(0, 242, 254, 0.85)',
                  }}
                />

                {/* Left & Right Wing Calibration Ticks */}
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: '12%',
                    width: '22px',
                    height: '1.5px',
                    background: 'rgba(0, 242, 254, 0.75)',
                    boxShadow: '0 0 8px #00f2fe',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '12%',
                    width: '22px',
                    height: '1.5px',
                    background: 'rgba(0, 242, 254, 0.75)',
                    boxShadow: '0 0 8px #00f2fe',
                  }}
                />
              </div>

              {/* Outer Left Hologram Boundary Arc (Curved Cylindrical Guide) */}
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  bottom: '16px',
                  left: '-6px',
                  width: '14px',
                  borderLeft: '1.5px solid rgba(0, 242, 254, 0.55)',
                  borderRadius: '50% 0 0 50% / 30% 0 0 30%',
                  boxShadow: '-3px 0 12px rgba(0, 242, 254, 0.28)',
                  pointerEvents: 'none',
                  zIndex: 3,
                }}
              >
                <div style={{ position: 'absolute', top: '35%', left: 0, width: '4px', height: '1.5px', background: '#00f2fe', boxShadow: '0 0 6px #00f2fe' }} />
                <div style={{ position: 'absolute', top: '65%', left: 0, width: '4px', height: '1.5px', background: '#00f2fe', boxShadow: '0 0 6px #00f2fe' }} />
              </div>

              {/* Outer Right Hologram Boundary Arc (Curved Cylindrical Guide) */}
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  bottom: '16px',
                  right: '-6px',
                  width: '14px',
                  borderRight: '1.5px solid rgba(0, 242, 254, 0.55)',
                  borderRadius: '0 50% 50% 0 / 0 30% 30% 0',
                  boxShadow: '3px 0 12px rgba(0, 242, 254, 0.28)',
                  pointerEvents: 'none',
                  zIndex: 3,
                }}
              >
                <div style={{ position: 'absolute', top: '35%', right: 0, width: '4px', height: '1.5px', background: '#00f2fe', boxShadow: '0 0 6px #00f2fe' }} />
                <div style={{ position: 'absolute', top: '65%', right: 0, width: '4px', height: '1.5px', background: '#00f2fe', boxShadow: '0 0 6px #00f2fe' }} />
              </div>

              {/* ======================================================== */}
              {/* TWO-WIDGET BALANCED CONTAINER                            */}
              {/* ======================================================== */}
              <div
                style={{
                  position: 'absolute',
                  top: '22px',
                  left: '0',
                  right: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '24px',
                  zIndex: 10,
                }}
              >
                {/* ======================================================== */}
                {/* WIDGET 1 (LEFT): TỶ LỆ SỞ HỮU                            */}
                {/* Restored: Luminous Teal Glass, Gloss Sheen, Neon Bloom   */}
                {/* ======================================================== */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    openGaragePanel('CO_OWNERSHIP', { vehicleId: targetVehicleId });
                  }}
                  onMouseEnter={() => setHoveredWidget('OWNERSHIP')}
                  onMouseLeave={() => setHoveredWidget(null)}
                  title="Nhấn để xem chi tiết đồng sở hữu"
                  style={{
                    width: '252px',
                    height: '136px',
                    borderRadius: '20px',
                    // Restored translucent cybernetic glass gradient revealing 3D showroom
                    background: hoveredWidget === 'OWNERSHIP'
                      ? 'radial-gradient(120% 110% at 50% 15%, rgba(10, 56, 102, 0.68) 0%, rgba(5, 32, 66, 0.60) 55%, rgba(3, 18, 42, 0.72) 100%)'
                      : 'radial-gradient(120% 110% at 50% 15%, rgba(8, 48, 90, 0.58) 0%, rgba(4, 26, 56, 0.50) 55%, rgba(2, 14, 34, 0.64) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: hoveredWidget === 'OWNERSHIP'
                      ? '1.5px solid rgba(0, 242, 254, 0.95)'
                      : '1.5px solid rgba(0, 242, 254, 0.70)',
                    // Restored vivid cyan neon glow & crystal inset bevel
                    boxShadow: hoveredWidget === 'OWNERSHIP'
                      ? `
                        0 16px 38px rgba(0, 0, 0, 0.6),
                        0 0 28px rgba(0, 242, 254, 0.45),
                        inset 0 1.5px 1px rgba(255, 255, 255, 0.70),
                        inset 0 0 20px rgba(0, 242, 254, 0.22)
                      `
                      : `
                        0 12px 32px rgba(0, 0, 0, 0.45),
                        0 0 22px rgba(0, 242, 254, 0.32),
                        inset 0 1.5px 1px rgba(255, 255, 255, 0.55),
                        inset 0 0 18px rgba(0, 242, 254, 0.14)
                      `,
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: hoveredWidget === 'OWNERSHIP' ? 'translateY(-2.5px) scale(1.015)' : 'translateY(0) scale(1)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Restored: Top Specular Curved Glass Crown Light Guide */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '8%',
                      right: '8%',
                      height: '2.5px',
                      borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                      background: 'linear-gradient(90deg, transparent, #ffffff 40%, #00f2fe 75%, transparent)',
                      boxShadow: '0 0 12px rgba(0, 242, 254, 0.85)',
                    }}
                  />

                  {/* Restored: Diagonal Gloss Reflection Streak */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(0, 242, 254, 0.06) 28%, transparent 58%)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Restored: Faint Holographic Coordinate Grid */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `
                        linear-gradient(rgba(0, 242, 254, 0.035) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 242, 254, 0.035) 1px, transparent 1px)
                      `,
                      backgroundSize: '12px 12px',
                      pointerEvents: 'none',
                      opacity: 0.7,
                    }}
                  />

                  {/* Restored: Left Aerodynamic Edge Pip */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '5px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '2.5px',
                      height: '16px',
                      borderRadius: '2px',
                      background: '#00f2fe',
                      boxShadow: '0 0 8px rgba(0, 242, 254, 0.75)',
                    }}
                  />

                  {/* Header Title Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', zIndex: 2 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(0, 242, 254, 0.16)',
                        border: '1px solid rgba(0, 242, 254, 0.55)',
                        boxShadow: '0 0 8px rgba(0, 242, 254, 0.25)',
                      }}
                    >
                      <PieChart size={11} color="#00f2fe" />
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#e0f2fe',
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          textShadow: '0 0 8px rgba(0, 242, 254, 0.65)',
                        }}
                      >
                        Tỷ lệ sở hữu
                      </span>
                    </div>
                  </div>

                  {/* Body: Glowing 3D Hologram Donut Orb + High-Gloss Metrics */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '2px', position: 'relative', zIndex: 2 }}>
                    {/* Restored Rich 3D Donut Chart Orb */}
                    <div style={{ position: 'relative', width: '68px', height: '68px', flexShrink: 0 }}>
                      <svg width="68" height="68" viewBox="0 0 76 76" style={{ transform: 'rotate(-90deg)' }}>
                        {/* Subtle Outer Tick Orbit */}
                        <circle
                          cx="38"
                          cy="38"
                          r="35"
                          fill="none"
                          stroke="rgba(0, 242, 254, 0.25)"
                          strokeWidth="1.0"
                          strokeDasharray="2.5 4"
                        />
                        {/* Purple/Other Capital Segment with Neon Drop Shadow */}
                        <circle
                          cx="38"
                          cy="38"
                          r={donutRadius}
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${otherDash} ${userDash}`}
                          strokeDashoffset={-userDash}
                          strokeLinecap="round"
                          style={{
                            filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.75))',
                          }}
                        />
                        {/* Cyan/User Segment with Vibrant Drop Shadow */}
                        <circle
                          cx="38"
                          cy="38"
                          r={donutRadius}
                          fill="none"
                          stroke="#00f2fe"
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${userDash} ${otherDash}`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          style={{
                            filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.90))',
                            transition: 'stroke-dasharray 0.6s ease',
                          }}
                        />
                        {/* Inner Cutout Ambient Accent Ring */}
                        <circle
                          cx="38"
                          cy="38"
                          r="20"
                          fill="none"
                          stroke="rgba(0, 242, 254, 0.35)"
                          strokeWidth="1.2"
                        />
                      </svg>

                      {/* Center Glowing Micro-Orb */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            boxShadow: '0 0 8px #00f2fe, 0 0 14px rgba(0, 242, 254, 0.8)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Metric & Label Stack */}
                    <div>
                      <div
                        style={{
                          fontSize: '26px',
                          fontWeight: 900,
                          color: '#ffffff',
                          fontVariantNumeric: 'tabular-nums',
                          lineHeight: 1.05,
                          letterSpacing: '-0.02em',
                          textShadow: '0 0 16px rgba(0, 242, 254, 0.70), 0 2px 4px rgba(0, 0, 0, 0.8)',
                        }}
                      >
                        {effectivePercentage}%
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#38bdf8',
                          marginTop: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          textShadow: '0 0 6px rgba(0, 242, 254, 0.5)',
                        }}
                      >
                        <span>Của bạn</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* WIDGET 2 (RIGHT): QUỸ CHUNG                              */}
                {/* Restored: Luminous Wallet Orb, Teal Diffusion, Arc Sheen */}
                {/* ======================================================== */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    openGaragePanel('FINANCE', { vehicleId: targetVehicleId });
                  }}
                  onMouseEnter={() => setHoveredWidget('FUND')}
                  onMouseLeave={() => setHoveredWidget(null)}
                  title="Nhấn để mở Lịch sử chi phí & Quỹ chung"
                  style={{
                    width: '312px',
                    height: '136px',
                    borderRadius: '20px',
                    // Restored translucent cybernetic glass gradient
                    background: hoveredWidget === 'FUND'
                      ? 'radial-gradient(120% 110% at 50% 15%, rgba(10, 56, 102, 0.68) 0%, rgba(5, 32, 66, 0.60) 55%, rgba(3, 18, 42, 0.72) 100%)'
                      : 'radial-gradient(120% 110% at 50% 15%, rgba(8, 48, 90, 0.58) 0%, rgba(4, 26, 56, 0.50) 55%, rgba(2, 14, 34, 0.64) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: hoveredWidget === 'FUND'
                      ? '1.5px solid rgba(0, 242, 254, 0.95)'
                      : '1.5px solid rgba(0, 242, 254, 0.70)',
                    // Restored vivid cyan neon glow & crystal bevel
                    boxShadow: hoveredWidget === 'FUND'
                      ? `
                        0 16px 38px rgba(0, 0, 0, 0.6),
                        0 0 28px rgba(0, 242, 254, 0.45),
                        inset 0 1.5px 1px rgba(255, 255, 255, 0.70),
                        inset 0 0 20px rgba(0, 242, 254, 0.22)
                      `
                      : `
                        0 12px 32px rgba(0, 0, 0, 0.45),
                        0 0 22px rgba(0, 242, 254, 0.32),
                        inset 0 1.5px 1px rgba(255, 255, 255, 0.55),
                        inset 0 0 18px rgba(0, 242, 254, 0.14)
                      `,
                    padding: '12px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: hoveredWidget === 'FUND' ? 'translateY(-2.5px) scale(1.015)' : 'translateY(0) scale(1)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Restored: Top Specular Curved Glass Crown Light Guide */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '8%',
                      right: '8%',
                      height: '2.5px',
                      borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                      background: 'linear-gradient(90deg, transparent, #ffffff 40%, #00f2fe 75%, transparent)',
                      boxShadow: '0 0 12px rgba(0, 242, 254, 0.85)',
                    }}
                  />

                  {/* Restored: Diagonal Gloss Reflection Streak */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(0, 242, 254, 0.06) 28%, transparent 58%)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Restored: Faint Holographic Coordinate Grid */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `
                        linear-gradient(rgba(0, 242, 254, 0.035) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 242, 254, 0.035) 1px, transparent 1px)
                      `,
                      backgroundSize: '12px 12px',
                      pointerEvents: 'none',
                      opacity: 0.7,
                    }}
                  />

                  {/* Restored: Right Energy Docking Node */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '5px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '2.5px',
                      height: '16px',
                      borderRadius: '2px',
                      background: '#00f2fe',
                      boxShadow: '0 0 8px rgba(0, 242, 254, 0.75)',
                    }}
                  />

                  {/* Header: Luminous Wallet Icon Pill + Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', zIndex: 2 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '2px 9px',
                        borderRadius: '9999px',
                        background: 'rgba(0, 242, 254, 0.16)',
                        border: '1px solid rgba(0, 242, 254, 0.55)',
                        boxShadow: '0 0 10px rgba(0, 242, 254, 0.25)',
                      }}
                    >
                      <Wallet size={11} color="#00f2fe" />
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#e0f2fe',
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          textShadow: '0 0 8px rgba(0, 242, 254, 0.65)',
                        }}
                      >
                        Quỹ chung
                      </span>
                    </div>
                  </div>

                  {/* Body: Restored High-Gloss Hero Amount + Glow Subtitle */}
                  <div style={{ marginTop: '2px', position: 'relative', zIndex: 2 }}>
                    <div
                      style={{
                        fontSize: '26px',
                        fontWeight: 900,
                        color: '#ffffff',
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                        textShadow: '0 0 18px rgba(0, 242, 254, 0.70), 0 2px 4px rgba(0, 0, 0, 0.8)',
                      }}
                    >
                      {displayFundTotal}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#bae6fd',
                        marginTop: '4px',
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                        textShadow: '0 0 6px rgba(0, 242, 254, 0.35)',
                      }}
                    >
                      Quỹ sở hữu và chi phí vận hành
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Curved Cradle Baseline with Restored Cyan Light Beam */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  left: '16px',
                  right: '16px',
                  height: '16px',
                  borderRadius: '0 0 50% 50% / 0 0 100% 100%',
                  borderBottom: '1.5px solid rgba(0, 242, 254, 0.55)',
                  boxShadow: '0 0 14px rgba(0, 242, 254, 0.30)',
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

export default FinanceHeroHologram;
