import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  TrendingUp,
  Zap,
  Gauge,
  Calendar,
  ChevronRight,
  FileSpreadsheet,
  Activity,
  Award,
  X,
} from 'lucide-react';
import { useWorldStore } from '../../../store/worldStore';
import { HologramProjectionBase3D } from './common/HologramProjectionBase3D';

interface AnalyticsControlHologram3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  onClose?: () => void;
  visible?: boolean;
}

const WEEKLY_DATA = [
  { day: 'T2', val: 14.2, cost: 72 },
  { day: 'T3', val: 15.1, cost: 85 },
  { day: 'T4', val: 13.8, cost: 68 },
  { day: 'T5', val: 14.5, cost: 76 },
  { day: 'T6', val: 16.2, cost: 98 },
  { day: 'T7', val: 17.5, cost: 120 },
  { day: 'CN', val: 14.0, cost: 70 },
];

/**
 * AnalyticsControlHologram3D:
 * Canonical 3D World-Space Holographic Interactive Control Console for CO_OWNER Analytics Zone.
 * Built with clean R3F / Drei HTML boundary:
 * - Three.js Backing Layers: multi-tiered glass backing, emissive brackets, technical grids
 * - Three.js Floor Anchor: HologramProjectionBase3D floor plinth beneath console
 * - Drei HTML Interaction Surface: strictly encapsulates all DOM elements
 * - Dedicated mouse-wheel isolation preventing 3D scene / camera zoom during detail scroll
 * - Scaled and positioned in the authoritative right-side slot matching the AI Assistant console
 */
export const AnalyticsControlHologram3D: React.FC<AnalyticsControlHologram3DProps> = ({
  position = [6.5, 1.5, 2.80],
  rotation = [0, -0.1745, 0],
  onClose,
  visible = true,
}) => {
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const consoleFloatRef = useRef<THREE.Group>(null);
  const frameGlowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);

  // Scaled dimensions matching AI Assistant benchmark (~98% width, 100% height)
  const panelW = 3.65;
  const panelH = 5.60;
  const hw = panelW / 2;
  const hh = panelH / 2;
  const bracketLen = 0.36;
  const bracketThick = 0.022;

  // Gentle hovering float & emissive glow animation synchronized with showroom tempo
  useFrame((state) => {
    if (!visible) return;
    const t = state.clock.getElapsedTime();
    if (consoleFloatRef.current) {
      consoleFloatRef.current.position.y = Math.sin(t * 1.5) * 0.025;
    }
    if (frameGlowMatRef.current) {
      frameGlowMatRef.current.emissiveIntensity = 1.6 + Math.sin(t * 2.2) * 0.35;
    }
  });

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      clearSelection();
    }
  };

  // Keyboard accessibility: ESC cleanly closes the panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Strict native wheel isolation: Prevent mouse-wheel inside detail scroll from controlling camera/scene
  useEffect(() => {
    const el = detailScrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  if (!visible) return null;

  return (
    <group
      position={position}
      rotation={rotation}
      visible={visible}
      name="AnalyticsControlHologramRoot"
    >
      {/* =========================================================================
          1. TRUE THREE.JS PROJECTION BASE (FLOOR ANCHOR)
          Centered on showroom floor directly beneath the Analytics hologram console
          ========================================================================= */}
      <HologramProjectionBase3D
        position={[0, -position[1] + 0.005, 0]}
        color="#00f2fe"
        visible={visible}
      />

      {/* =========================================================================
          2. FLOATING CONSOLE GROUP WITH THREE.JS GLASS BACKING & DREI HTML SURFACE
          ========================================================================= */}
      <group ref={consoleFloatRef}>
        {/* -------------------------------------------------------------
            LAYER 1: REAR DARK NAVY TINTED GLASS BACKING
            ------------------------------------------------------------- */}
        <mesh position={[0, 0, -0.045]} raycast={() => null}>
          <planeGeometry args={[panelW, panelH]} />
          <meshStandardMaterial
            color="#040c1c"
            roughness={0.12}
            metalness={0.88}
            transparent
            opacity={0.72}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* -------------------------------------------------------------
            LAYER 2: LOW-OPACITY TECHNICAL WIREFRAME & VIOLET HIGHLIGHT
            ------------------------------------------------------------- */}
        <mesh position={[0, 0, -0.04]} raycast={() => null}>
          <planeGeometry args={[panelW - 0.08, panelH - 0.08]} />
          <meshBasicMaterial
            color="#00f2fe"
            wireframe
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh position={[0, 0, -0.042]} raycast={() => null}>
          <ringGeometry args={[1.30, 1.34, 32]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* -------------------------------------------------------------
            LAYER 3: EMISSIVE PERIMETER FRAME & 4 CORNER BRACKETS
            ------------------------------------------------------------- */}
        <group position={[0, 0, -0.02]}>
          {/* Top-Left Bracket */}
          <group position={[-hw, hh, 0.005]}>
            <mesh position={[bracketLen / 2, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
              <meshStandardMaterial
                ref={frameGlowMatRef}
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, -bracketLen / 2, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick * 2.0, bracketThick * 2.0, bracketThick * 2.0]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Top-Right Bracket */}
          <group position={[hw, hh, 0.005]}>
            <mesh position={[-bracketLen / 2, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, -bracketLen / 2, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick * 2.0, bracketThick * 2.0, bracketThick * 2.0]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Bottom-Left Bracket */}
          <group position={[-hw, -hh, 0.005]}>
            <mesh position={[bracketLen / 2, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, bracketLen / 2, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick * 2.0, bracketThick * 2.0, bracketThick * 2.0]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Bottom-Right Bracket */}
          <group position={[hw, -hh, 0.005]}>
            <mesh position={[-bracketLen / 2, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketLen, bracketThick, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, bracketLen / 2, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick, bracketLen, bracketThick]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
              />
            </mesh>
            <mesh position={[0, 0, 0]} raycast={() => null}>
              <boxGeometry args={[bracketThick * 2.0, bracketThick * 2.0, bracketThick * 2.0]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Top Center Sensor / Telemetry Bead */}
          <mesh position={[0, hh + 0.045, 0.005]} raycast={() => null}>
            <cylinderGeometry args={[0.02, 0.02, 0.065, 12]} />
            <meshStandardMaterial
              color="#00f2fe"
              emissive="#00f2fe"
              emissiveIntensity={2.2}
            />
          </mesh>

          {/* Bottom Projection Connector Node Lens */}
          <group position={[0, -hh - 0.045, 0.005]}>
            <mesh raycast={() => null}>
              <cylinderGeometry args={[0.09, 0.05, 0.08, 16]} />
              <meshStandardMaterial
                color="#091628"
                metalness={0.8}
                roughness={0.2}
                emissive="#00f2fe"
                emissiveIntensity={0.5}
              />
            </mesh>
            <mesh position={[0, 0.025, 0]} raycast={() => null}>
              <torusGeometry args={[0.065, 0.012, 8, 16]} />
              <meshBasicMaterial color="#00f2fe" />
            </mesh>
          </group>
        </group>

        {/* -------------------------------------------------------------
            LAYER 4: MAIN FRONT INTERACTIVE GLASS CONSOLE (DREI HTML TRANSFORM)
            All DOM buttons, metrics, charts, and scroll area live strictly here!
            ------------------------------------------------------------- */}
        <Html
          transform
          distanceFactor={3.25}
          position={[0, 0, 0.03]}
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Scoped Custom Scrollbar Style */}
          <style>{`
            .analytics-detail-scroll::-webkit-scrollbar {
              width: 5px;
            }
            .analytics-detail-scroll::-webkit-scrollbar-track {
              background: transparent;
              border-radius: 9999px;
              margin: 4px 0;
            }
            .analytics-detail-scroll::-webkit-scrollbar-thumb {
              background: rgba(0, 242, 254, 0.32);
              border-radius: 9999px;
              border: 1px solid rgba(0, 242, 254, 0.15);
              transition: background 0.2s ease;
            }
            .analytics-detail-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(0, 242, 254, 0.65);
              box-shadow: 0 0 8px rgba(0, 242, 254, 0.5);
            }
            .analytics-detail-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(0, 242, 254, 0.35) transparent;
            }
          `}</style>

          <div
            data-testid="analytics-3d-control-panel"
            data-ui-interactive="true"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            style={{
              width: '420px',
              height: '560px',
              background:
                'linear-gradient(180deg, rgba(8, 22, 42, 0.92) 0%, rgba(4, 12, 26, 0.98) 100%)',
              backdropFilter: 'blur(26px)',
              WebkitBackdropFilter: 'blur(26px)',
              border: '2px solid rgba(0, 242, 254, 0.75)',
              borderRadius: '28px',
              boxShadow:
                '0 28px 70px rgba(0, 0, 0, 0.85), 0 0 40px rgba(0, 242, 254, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 0 24px rgba(0, 242, 254, 0.15)',
              padding: '22px 24px',
              color: '#ffffff',
              fontFamily: "var(--font-family, 'Outfit', sans-serif)",
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {/* 1. FIXED HEADER */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '15px',
                    background: 'rgba(0, 242, 254, 0.16)',
                    border: '1.8px solid #00f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 18px rgba(0, 242, 254, 0.45)',
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={24} color="#00f2fe" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        letterSpacing: '-0.01em',
                        color: '#ffffff',
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      PHÂN TÍCH
                    </h2>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: '#00f2fe',
                        background: 'rgba(0, 242, 254, 0.15)',
                        border: '1px solid rgba(0, 242, 254, 0.4)',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      <Activity size={10} color="#00f2fe" />
                      <span>Thời gian thực</span>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      margin: '2px 0 0 0',
                      fontWeight: 500,
                    }}
                  >
                    Hiệu suất & chi phí vận hành EV01
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                title="Đóng bảng điều khiển"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.20)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                  e.currentTarget.style.color = '#ff6b6b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.20)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <X size={17} />
              </button>
            </div>

            {/* 2. FIXED KEY SUMMARY HERO CARD */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(6, 26, 52, 0.65) 100%)',
                border: '1.2px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '16px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '10.5px',
                    color: '#94a3b8',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Hiệu suất tổng thể
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#00f2fe',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '6px',
                  }}
                >
                  94.2%
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#10b981',
                      fontWeight: 600,
                    }}
                  >
                    Tối ưu Xuất sắc
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Tiết kiệm năng lượng</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                  -65% so với xe xăng
                </div>
              </div>
            </div>

            {/* 3. SCROLLABLE DETAIL AREA (Telemetry Metrics, Chart, Utilization) */}
            <div
              ref={detailScrollRef}
              className="analytics-detail-scroll"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '11px',
                paddingRight: '4px',
              }}
            >
              {/* 3.1 Telemetry Metric Cards (2x2 Grid) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}
              >
                {/* Metric 1: Tiêu thụ TB */}
                <div
                  style={{
                    background: 'rgba(10, 30, 56, 0.8)',
                    border: '1.2px solid rgba(0, 242, 254, 0.3)',
                    borderRadius: '16px',
                    padding: '11px 13px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={13} color="#00f2fe" />
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                      Tiêu thụ TB
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#ffffff',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    14.8{' '}
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#94a3b8' }}>
                      kWh/100km
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                    ↓ 8.5% tối ưu phân khúc
                  </div>
                </div>

                {/* Metric 2: Quãng đường */}
                <div
                  style={{
                    background: 'rgba(10, 30, 56, 0.8)',
                    border: '1.2px solid rgba(0, 242, 254, 0.3)',
                    borderRadius: '16px',
                    padding: '11px 13px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Gauge size={13} color="#38bdf8" />
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                      Quãng đường
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#ffffff',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    1.240{' '}
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#94a3b8' }}>
                      km
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700 }}>
                    ↑ 18% so với tháng trước
                  </div>
                </div>

                {/* Metric 3: Chi phí / km */}
                <div
                  style={{
                    background: 'rgba(10, 30, 56, 0.8)',
                    border: '1.2px solid rgba(0, 242, 254, 0.3)',
                    borderRadius: '16px',
                    padding: '11px 13px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={13} color="#f59e0b" />
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                      Chi phí / km
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#ffffff',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    620{' '}
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#94a3b8' }}>
                      ₫/km
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                    Tiết kiệm 65% xe xăng
                  </div>
                </div>

                {/* Metric 4: Tỷ lệ sử dụng */}
                <div
                  style={{
                    background: 'rgba(10, 30, 56, 0.8)',
                    border: '1.2px solid rgba(0, 242, 254, 0.3)',
                    borderRadius: '16px',
                    padding: '11px 13px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} color="#a855f7" />
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                      Tỷ lệ sử dụng
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#ffffff',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    74%{' '}
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#94a3b8' }}>
                      hiệu dụng
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#a855f7', fontWeight: 700 }}>
                    22 / 30 ngày lăn bánh
                  </div>
                </div>
              </div>

              {/* 3.2 Weekly Consumption Bar Chart */}
              <div
                style={{
                  background: 'rgba(6, 20, 40, 0.75)',
                  border: '1.2px solid rgba(0, 242, 254, 0.25)',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0' }}>
                    Tiêu thụ điện 7 ngày gần nhất
                  </span>
                  <span style={{ fontSize: '10px', color: '#00f2fe', fontWeight: 600 }}>
                    kWh/ngày
                  </span>
                </div>

                {/* Bars Container */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    height: '68px',
                    paddingTop: '6px',
                    borderBottom: '1px dashed rgba(0, 242, 254, 0.3)',
                  }}
                >
                  {WEEKLY_DATA.map((item, idx) => {
                    const heightPercent = ((item.val - 12) / (18 - 12)) * 100;
                    const isPeak = item.day === 'T7';
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          flex: 1,
                        }}
                      >
                        <div
                          title={`${item.day}: ${item.val} kWh (${item.cost}.000₫)`}
                          style={{
                            width: '18px',
                            height: `${Math.max(15, heightPercent)}%`,
                            background: isPeak
                              ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)'
                              : 'linear-gradient(180deg, #00f2fe 0%, #0369a1 100%)',
                            borderRadius: '4px 4px 0 0',
                            boxShadow: isPeak ? '0 0 10px rgba(56, 189, 248, 0.6)' : 'none',
                            transition: 'all 0.3s ease',
                          }}
                        />
                        <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600 }}>
                          {item.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3.3 Co-Ownership Usage Share Breakdown */}
              <div
                style={{
                  background: 'rgba(6, 20, 40, 0.75)',
                  border: '1.2px solid rgba(0, 242, 254, 0.25)',
                  borderRadius: '16px',
                  padding: '11px 13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0' }}>
                    Phân bổ sử dụng thành viên
                  </span>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
                    SOH Pin: 97.2%
                  </span>
                </div>

                {/* Multi-segment progress bar */}
                <div
                  style={{
                    height: '7px',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ width: '40%', background: '#00f2fe' }} title="Bạn: 40%" />
                  <div style={{ width: '35%', background: '#38bdf8' }} title="Cổ đông B: 35%" />
                  <div style={{ width: '25%', background: '#a855f7' }} title="Cổ đông C: 25%" />
                </div>

                {/* Legend */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#94a3b8',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#00f2fe',
                      }}
                    />
                    Bạn (40% - 496km)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#38bdf8',
                      }}
                    />
                    Cổ đông B (35%)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#a855f7',
                      }}
                    />
                    Cổ đông C (25%)
                  </span>
                </div>
              </div>
            </div>

            {/* 4. FIXED ACTION FOOTER */}
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              <button
                type="button"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '12px 18px',
                  color: '#041628',
                  fontSize: '14px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(0, 242, 254, 0.4)',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 26px rgba(0, 242, 254, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 242, 254, 0.4)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={17} color="#041628" />
                  <span>Xuất báo cáo phân tích chi tiết</span>
                </div>
                <ChevronRight size={17} color="#041628" />
              </button>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
};
