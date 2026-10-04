import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Wallet,
  BarChart3,
  Zap,
  ExternalLink,
  FileText,
  ChevronRight,
  X,
  Calendar,
  CheckCircle2,
  Receipt,
  Sparkles,
  Wrench,
  Car,
  AlertTriangle,
  ShieldCheck,
  Plus,
  PlusCircle,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { fetchVehicles } from '../../../services/vehicleApi';
import { fetchVehicleCoOwnership } from '../../../services/coOwnershipApi';
import { useExpenses, useExpenseSummary } from '../../../hooks/useExpenses';
import { EXPENSE_CATEGORY_METADATA } from '../../../types/expense';
import { AddExpenseModal } from '../../zones/AddExpenseModal';
import { VehicleResponse } from '../../../types/vehicle';

export type FinanceView = 'MAIN' | 'EXPENSE_HISTORY' | 'FUND_DETAIL';

// Authoritative Finance Console Dimensions (Single-Slot Standardized Hierarchy)
export const FINANCE_MAIN_WIDTH = 360;
export const FINANCE_MAIN_HEIGHT = 520;

export const FINANCE_DETAIL_WIDTH = 450;
export const FINANCE_DETAIL_HEIGHT = 650;

interface FinanceControlHologram3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  onClose?: () => void;
  monthlyExpense?: string;
  fundStatus?: string;
}

/**
 * FinanceControlHologram3D:
 * Authoritative 3D World-Space Holographic Control Console for CO_OWNER Finance Mode.
 *
 * Single-Slot View Architecture:
 * - Position: world coordinates [6.5, 1.5, 2.80] (right side of vehicle, approved placement)
 * - Rotation: inward Y-rotation of -10.0° (-0.1745 rad) facing vehicle and user
 * - Single authoritative state: financeView ('MAIN' | 'EXPENSE_HISTORY' | 'FUND_DETAIL')
 * - Single physical slot: same 3D backing glass, projection base, and coordinates reused across all views
 * - Internal scroll container with strict mouse-wheel isolation
 * - Seamless drill-down and cross-navigation with smooth holographic fade-in
 */
export const FinanceControlHologram3D: React.FC<FinanceControlHologram3DProps> = ({
  position = [6.5, 1.5, 2.80],
  rotation = [0, -0.1745, 0],
  onClose,
  monthlyExpense: initialMonthlyExpense,
  fundStatus = 'Sẵn sàng hoạt động',
}) => {
  const user = useAuthStore((state) => state.user);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const clearSelection = useWorldStore((state) => (state as any).clearSelection || state.returnToGarageOverview);
  const selectZone = useWorldStore((state) => state.selectZone);
  const setFinanceDetailModalOpen = useWorldStore((state) => state.setFinanceDetailModalOpen);

  // Authoritative Single-Slot Finance View State
  const [financeView, setFinanceView] = useState<FinanceView>('MAIN');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('ALL');

  // Animation & DOM references
  const floorRingRef = useRef<THREE.MeshBasicMaterial>(null);
  const floorGlowPoolRef = useRef<THREE.MeshBasicMaterial>(null);
  const frameGlowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightColumnRef = useRef<THREE.MeshBasicMaterial>(null);
  const consoleFloatRef = useRef<THREE.Group>(null);
  const historyListScrollRef = useRef<HTMLDivElement>(null);

  // Authoritative vehicle resolution for CO_OWNER
  const { data: vehicles = [] } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
  });

  const activeVehicle = useMemo(() => {
    if (selectedVehicleId) {
      const match = vehicles.find((v) => v.id === selectedVehicleId || v.vin === selectedVehicleId);
      if (match) return match;
    }
    return vehicles[0] || null;
  }, [vehicles, selectedVehicleId]);

  const activeVehicleId = activeVehicle?.id;

  // Authoritative co-ownership group members for payer selection
  const { data: coOwnership } = useQuery({
    queryKey: ['co-ownership', activeVehicleId],
    queryFn: () => fetchVehicleCoOwnership(activeVehicleId!),
    enabled: !!activeVehicleId,
  });
  const coOwners = coOwnership?.members || [];

  // Authoritative expense summary & history
  const { data: summary, isLoading: isSummaryLoading } = useExpenseSummary(activeVehicleId);
  const { data: expenses = [], isLoading: isExpensesLoading } = useExpenses(activeVehicleId);

  const formattedMonthlyExpense = useMemo(() => {
    if (isSummaryLoading) return 'Đang tải...';
    if (!summary || summary.totalExpense == null) return initialMonthlyExpense || '0đ';
    return `${Number(summary.totalExpense).toLocaleString('vi-VN')}đ`;
  }, [summary, isSummaryLoading, initialMonthlyExpense]);

  // Synchronize Add Expense modal open state with worldStore
  useEffect(() => {
    setFinanceDetailModalOpen(showAddExpenseModal);
    return () => {
      setFinanceDetailModalOpen(false);
    };
  }, [showAddExpenseModal, setFinanceDetailModalOpen]);

  const handleClose = () => {
    setFinanceView('MAIN');
    if (onClose) {
      onClose();
    } else if (clearSelection) {
      clearSelection();
    } else {
      selectZone(null);
    }
  };

  // Keyboard accessibility: ESC cleanly navigates sub-view back to MAIN, or closes modal/zone
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddExpenseModal) {
          setShowAddExpenseModal(false);
        } else if (financeView !== 'MAIN') {
          setFinanceView('MAIN');
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddExpenseModal, financeView]);

  // Strict native wheel isolation for the internal expense history scroll container
  useEffect(() => {
    const el = historyListScrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [financeView]);

  // Frame animation loop: subtle holographic breathing & floor emitter pulsation
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Subtle spatial floating breathing
    if (consoleFloatRef.current) {
      consoleFloatRef.current.position.y = Math.sin(t * 1.5) * 0.015;
    }

    // Floor projection pulse
    if (floorRingRef.current) {
      floorRingRef.current.opacity = 0.50 + Math.sin(t * 2.0) * 0.15;
    }
    if (floorGlowPoolRef.current) {
      floorGlowPoolRef.current.opacity = 0.06 + Math.sin(t * 1.6) * 0.02;
    }
    if (frameGlowMatRef.current) {
      frameGlowMatRef.current.emissiveIntensity = 1.6 + Math.sin(t * 2.2) * 0.35;
    }
    if (lightColumnRef.current) {
      lightColumnRef.current.opacity = 0.035 + Math.sin(t * 1.8) * 0.012;
    }
  });

  // Safe Drei Html wrapper for AddExpenseModal (reconciled by ReactDOM in document.body)
  const renderModalPortal = (content: React.ReactNode) => {
    return (
      <Html fullscreen style={{ pointerEvents: 'none', zIndex: 10000 }}>
        {content}
      </Html>
    );
  };

  // Dimensions of 3D layered structure (scaled proportionally to frame Drei Html console)
  const isDetailView = financeView !== 'MAIN';
  const panelWidthPx = isDetailView ? FINANCE_DETAIL_WIDTH : FINANCE_MAIN_WIDTH;
  const panelHeightPx = isDetailView ? FINANCE_DETAIL_HEIGHT : FINANCE_MAIN_HEIGHT;

  // Proportional 3D world backing dimensions
  const panelW = isDetailView ? 3.85 : 3.10;
  const panelH = isDetailView ? 5.85 : 4.80;
  const hw = panelW / 2;
  const hh = panelH / 2;
  const bracketLen = isDetailView ? 0.38 : 0.34;
  const bracketThick = isDetailView ? 0.022 : 0.020;

  // Floor emitter Y coordinate
  const floorY = 0.005;

  return (
    <>
      {/* =========================================================================
          1. HOLOGRAPHIC PROJECTION BASE (FLOOR ANCHOR)
          Sits on showroom floor directly beneath the control panel
          ========================================================================= */}
      <group position={[position[0], floorY, position[2]]}>
        {/* Low-profile dark alloy floor emitter plinth disc */}
        <mesh position={[0, 0.007, 0]} receiveShadow raycast={() => null}>
          <cylinderGeometry args={[0.62, 0.70, 0.016, 32]} />
          <meshStandardMaterial color="#071324" roughness={0.25} metalness={0.88} />
        </mesh>

        {/* Soft radial ambient floor glow pool */}
        <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[0, 1.65, 48]} />
          <meshBasicMaterial
            ref={floorGlowPoolRef}
            color="#00f2fe"
            transparent
            opacity={0.06}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Outer subtle concentric projection ring */}
        <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[1.35, 1.38, 64]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Main precision cyan floor emitter ring */}
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[1.05, 1.09, 64]} />
          <meshBasicMaterial
            ref={floorRingRef}
            color="#00f2fe"
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Inner recessed LED ring on plinth surface */}
        <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[0.42, 0.47, 32]} />
          <meshBasicMaterial
            color="#00f2fe"
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* 4 Floor calibration tick marks */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <mesh
            key={`base-tick-${idx}`}
            position={[Math.cos(angle) * 1.15, 0.004, Math.sin(angle) * 1.15]}
            rotation={[-Math.PI / 2, 0, angle]}
            raycast={() => null}
          >
            <planeGeometry args={[0.08, 0.010]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* Subtle vertical projection guide cone rising to panel base */}
        <mesh position={[0, 0.05, 0]} raycast={() => null}>
          <cylinderGeometry args={[0.35, 0.15, 0.10, 24, 1, true]} />
          <meshBasicMaterial
            ref={lightColumnRef}
            color="#00f2fe"
            transparent
            opacity={0.035}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* 4 Ascending photonic guide rays */}
        {[-0.24, 0.24].map((rx, i) =>
          [-0.24, 0.24].map((rz, j) => (
            <mesh key={`ray-${i}-${j}`} position={[rx * 0.8, 0.05, rz * 0.8]} raycast={() => null}>
              <cylinderGeometry args={[0.0022, 0.0022, 0.10, 8]} />
              <meshBasicMaterial color="#00f2fe" transparent opacity={0.28} depthWrite={false} />
            </mesh>
          ))
        )}
      </group>

      {/* =========================================================================
          2. AUTHORITATIVE SINGLE-SLOT 3D WORLD-SPACE HOLOGRAPHIC CONSOLE
          Reused by: MAIN, EXPENSE_HISTORY, FUND_DETAIL
          ========================================================================= */}
      <group position={position} rotation={rotation} name="FinanceControlHologramRoot">
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
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Technical Interior Grid */}
          <mesh position={[0, 0, -0.035]} raycast={() => null}>
            <planeGeometry args={[panelW - 0.12, panelH - 0.12]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={0.03}
              wireframe
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* -------------------------------------------------------------
              LAYER 2: EMISSIVE NEON CYAN OUTLINE FRAME
              ------------------------------------------------------------- */}
          <group position={[0, 0, -0.005]}>
            {/* Top Frame Bar */}
            <mesh position={[0, hh, 0]} raycast={() => null}>
              <boxGeometry args={[panelW, 0.022, 0.012]} />
              <meshStandardMaterial
                ref={frameGlowMatRef}
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
                roughness={0.2}
              />
            </mesh>
            {/* Bottom Frame Bar */}
            <mesh position={[0, -hh, 0]} raycast={() => null}>
              <boxGeometry args={[panelW, 0.022, 0.012]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
                roughness={0.2}
              />
            </mesh>
            {/* Left Frame Bar */}
            <mesh position={[-hw, 0, 0]} raycast={() => null}>
              <boxGeometry args={[0.022, panelH, 0.012]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
                roughness={0.2}
              />
            </mesh>
            {/* Right Frame Bar */}
            <mesh position={[hw, 0, 0]} raycast={() => null}>
              <boxGeometry args={[0.022, panelH, 0.012]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={1.8}
                roughness={0.2}
              />
            </mesh>
          </group>

          {/* -------------------------------------------------------------
              LAYER 3: CORNER HOLOGRAPHIC BRACKETS & HARDWARE ACCENTS
              ------------------------------------------------------------- */}
          <group>
            {/* Top-Left Bracket */}
            <group position={[-hw, hh, 0.005]}>
              <mesh position={[bracketLen / 2, 0, 0]} raycast={() => null}>
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
              <cylinderGeometry args={[0.018, 0.018, 0.06, 12]} />
              <meshStandardMaterial
                color="#00f2fe"
                emissive="#00f2fe"
                emissiveIntensity={2.2}
              />
            </mesh>

            {/* Bottom Projection Connector Node Lens */}
            <group position={[0, -hh - 0.045, 0.005]}>
              <mesh raycast={() => null}>
                <cylinderGeometry args={[0.08, 0.045, 0.08, 16]} />
                <meshStandardMaterial
                  color="#091628"
                  metalness={0.8}
                  roughness={0.2}
                  emissive="#00f2fe"
                  emissiveIntensity={0.5}
                />
              </mesh>
              <mesh position={[0, 0.025, 0]} raycast={() => null}>
                <torusGeometry args={[0.055, 0.010, 8, 16]} />
                <meshBasicMaterial color="#00f2fe" />
              </mesh>
            </group>
          </group>

          {/* -------------------------------------------------------------
              LAYER 4: MAIN FRONT INTERACTIVE GLASS CONSOLE (DREI HTML TRANSFORM)
              Single Authority Slot for: MAIN, EXPENSE_HISTORY, FUND_DETAIL
              ------------------------------------------------------------- */}
          <Html
            transform
            distanceFactor={3.25}
            position={[0, 0, 0.015]}
            style={{
              pointerEvents: 'auto',
              userSelect: 'none',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Scoped Custom Scrollbar & Subtle Sub-View Transitions */}
            <style>{`
              .finance-detail-scroll::-webkit-scrollbar {
                width: 5px;
              }
              .finance-detail-scroll::-webkit-scrollbar-track {
                background: transparent;
                border-radius: 9999px;
                margin: 4px 0;
              }
              .finance-detail-scroll::-webkit-scrollbar-thumb {
                background: rgba(0, 242, 254, 0.32);
                border-radius: 9999px;
                border: 1px solid rgba(0, 242, 254, 0.15);
                transition: background 0.2s ease;
              }
              .finance-detail-scroll::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 242, 254, 0.65);
                box-shadow: 0 0 8px rgba(0, 242, 254, 0.5);
              }
              .finance-detail-scroll {
                scrollbar-width: thin;
                scrollbar-color: rgba(0, 242, 254, 0.35) transparent;
              }
              @keyframes financeViewFadeIn {
                from {
                  opacity: 0;
                  transform: translateX(8px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
              .finance-view-fade-in {
                animation: financeViewFadeIn 0.20s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            `}</style>

            <div
              data-testid="finance-3d-control-panel"
              data-ui-interactive="true"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              style={{
                width: `${panelWidthPx}px`,
                height: `${panelHeightPx}px`,
                background: 'linear-gradient(180deg, rgba(8, 22, 42, 0.90) 0%, rgba(4, 12, 26, 0.97) 100%)',
                backdropFilter: 'blur(26px)',
                WebkitBackdropFilter: 'blur(26px)',
                border: '2px solid rgba(0, 242, 254, 0.75)',
                borderRadius: '28px',
                boxShadow:
                  '0 28px 70px rgba(0, 0, 0, 0.88), 0 0 40px rgba(0, 242, 254, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 0 24px rgba(0, 242, 254, 0.14)',
                padding: isDetailView ? '24px 26px' : '22px 24px',
                color: '#ffffff',
                fontFamily: "var(--font-family, 'Outfit', sans-serif)",
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                overflow: 'hidden',
                transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), height 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* ========================================================
                  VIEW 1: MAIN FINANCE OVERVIEW
                  ======================================================== */}
              {financeView === 'MAIN' && (
                <div
                  key="finance-main-view"
                  className="finance-view-fade-in"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Header with Icon, Title, and Close Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '16px',
                          background: 'rgba(0, 242, 254, 0.16)',
                          border: '2px solid #00f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 20px rgba(0, 242, 254, 0.45)',
                          flexShrink: 0,
                        }}
                      >
                        <Wallet size={26} color="#00f2fe" />
                      </div>
                      <div>
                        <h2
                          style={{
                            fontSize: '24px',
                            fontWeight: 800,
                            letterSpacing: '-0.01em',
                            color: '#ffffff',
                            margin: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          Tài chính
                        </h2>
                        <p
                          style={{
                            fontSize: '12.5px',
                            color: '#94a3b8',
                            margin: '2px 0 0 0',
                            fontWeight: 500,
                          }}
                        >
                          Quản lý quỹ chung & chi phí
                        </p>
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      type="button"
                      onClick={handleClose}
                      title="Đóng bảng tài chính"
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

                  {/* Item 1: Chi tháng này */}
                  <div
                    onClick={() => setFinanceView('EXPENSE_HISTORY')}
                    style={{
                      background: 'rgba(10, 30, 56, 0.78)',
                      border: '1.4px solid rgba(0, 242, 254, 0.35)',
                      borderRadius: '20px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.28)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00f2fe';
                      e.currentTarget.style.background = 'rgba(14, 38, 70, 0.90)';
                      e.currentTarget.style.transform = 'translateX(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 242, 254, 0.32)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                      e.currentTarget.style.background = 'rgba(10, 30, 56, 0.78)';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.28)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: 'rgba(0, 242, 254, 0.16)',
                          border: '1.4px solid rgba(0, 242, 254, 0.50)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <BarChart3 size={20} color="#00f2fe" />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                          Chi tháng này
                        </div>
                        <div
                          style={{
                            fontSize: '22px',
                            fontWeight: 800,
                            color: '#ffffff',
                            letterSpacing: '-0.01em',
                            marginTop: '2px',
                          }}
                        >
                          {formattedMonthlyExpense}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={19} color="#38bdf8" />
                  </div>

                  {/* Item 2: Trạng thái */}
                  <div
                    style={{
                      background: 'rgba(10, 30, 56, 0.78)',
                      border: '1.4px solid rgba(0, 242, 254, 0.35)',
                      borderRadius: '20px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.28)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: 'rgba(16, 185, 129, 0.18)',
                          border: '1.4px solid rgba(16, 185, 129, 0.55)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Zap size={20} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                          Trạng thái
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#10b981',
                            marginTop: '2px',
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#10b981',
                              boxShadow: '0 0 10px #10b981',
                            }}
                          />
                          <span>{fundStatus}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={19} color="#38bdf8" />
                  </div>

                  {/* Primary Action Button: Mở bảng quỹ */}
                  <button
                    type="button"
                    onClick={() => setFinanceView('FUND_DETAIL')}
                    style={{
                      background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                      border: 'none',
                      borderRadius: '18px',
                      padding: '16px 22px',
                      color: '#041628',
                      fontSize: '16px',
                      fontWeight: 800,
                      letterSpacing: '0.01em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: '0 8px 26px rgba(0, 242, 254, 0.50)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 34px rgba(0, 242, 254, 0.72)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 26px rgba(0, 242, 254, 0.50)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ExternalLink size={20} color="#041628" />
                      <span>Mở bảng quỹ</span>
                    </div>
                    <ChevronRight size={20} color="#041628" />
                  </button>

                  {/* Secondary Action Button: Lịch sử chi phí */}
                  <button
                    type="button"
                    onClick={() => setFinanceView('EXPENSE_HISTORY')}
                    style={{
                      background: 'rgba(10, 30, 56, 0.78)',
                      border: '1.4px solid rgba(0, 242, 254, 0.35)',
                      borderRadius: '18px',
                      padding: '15px 22px',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 650,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00f2fe';
                      e.currentTarget.style.background = 'rgba(14, 38, 70, 0.90)';
                      e.currentTarget.style.transform = 'translateX(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 242, 254, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                      e.currentTarget.style.background = 'rgba(10, 30, 56, 0.78)';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={19} color="#00f2fe" />
                      <span>Lịch sử chi phí</span>
                    </div>
                    <ChevronRight size={19} color="#00f2fe" />
                  </button>
                </div>
              )}

              {/* ========================================================
                  VIEW 2: EXPENSE HISTORY SUB-VIEW (SAME 3D SLOT)
                  ======================================================== */}
              {financeView === 'EXPENSE_HISTORY' && (
                <div
                  key="finance-history-view"
                  className="finance-view-fade-in"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    gap: '12px',
                    overflow: 'hidden',
                  }}
                >
                  {/* A. Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '16px',
                          background: 'rgba(0, 242, 254, 0.16)',
                          border: '2px solid #00f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 18px rgba(0, 242, 254, 0.45)',
                          flexShrink: 0,
                        }}
                      >
                        <Receipt size={24} color="#00f2fe" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h2
                            style={{
                              fontSize: '21px',
                              fontWeight: 850,
                              margin: 0,
                              letterSpacing: '-0.01em',
                              color: '#ffffff',
                              lineHeight: 1.2,
                              textTransform: 'uppercase',
                            }}
                          >
                            Lịch sử chi phí
                          </h2>
                          <span
                            style={{
                              background: 'rgba(0, 242, 254, 0.12)',
                              border: '1.2px solid rgba(0, 242, 254, 0.35)',
                              color: '#00f2fe',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {summary?.month
                              ? `Tháng ${summary.month.slice(5)} / ${summary.month.slice(0, 4)}`
                              : 'Tháng 10 / 2026'}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: '12.5px',
                            color: '#94a3b8',
                            margin: '2px 0 0 0',
                            fontWeight: 500,
                          }}
                        >
                          {activeVehicle?.name || 'EV01'} · {expenses.length} khoản chi thực tế
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFinanceView('MAIN')}
                      title="Quay lại bảng tài chính"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.20)',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.50)';
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

                  {/* B. Summary section (Enlarged and Spacious) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      flexShrink: 0,
                    }}
                  >
                    {/* Tổng chi */}
                    <div
                      style={{
                        background: 'rgba(10, 30, 56, 0.70)',
                        borderRadius: '14px',
                        padding: '9px 11px',
                        border: '1.2px solid rgba(251, 113, 133, 0.30)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Tổng chi
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#fb7185', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {expenses
                          .reduce((sum, e) => sum + Number(e.amount || 0), 0)
                          .toLocaleString('vi-VN')}đ
                      </div>
                    </div>

                    {/* Chi tháng này */}
                    <div
                      style={{
                        background: 'rgba(10, 30, 56, 0.70)',
                        borderRadius: '14px',
                        padding: '9px 11px',
                        border: '1.2px solid rgba(0, 242, 254, 0.30)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Tháng này
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#00f2fe', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formattedMonthlyExpense}
                      </div>
                    </div>

                    {/* Số khoản */}
                    <div
                      style={{
                        background: 'rgba(10, 30, 56, 0.70)',
                        borderRadius: '14px',
                        padding: '9px 11px',
                        border: '1.2px solid rgba(255, 255, 255, 0.14)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Số khoản
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                        {expenses.length}
                      </div>
                    </div>

                    {/* Xe */}
                    <div
                      style={{
                        background: 'rgba(10, 30, 56, 0.70)',
                        borderRadius: '14px',
                        padding: '9px 11px',
                        border: '1.2px solid rgba(56, 189, 248, 0.30)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Xe
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activeVehicle?.name || 'EV01'}
                      </div>
                    </div>
                  </div>

                  {/* C. Category filter pills */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(6, 18, 36, 0.60)',
                      padding: '5px 7px',
                      borderRadius: '14px',
                      border: '1.2px solid rgba(0, 242, 254, 0.16)',
                      flexWrap: 'wrap',
                      flexShrink: 0,
                    }}
                  >
                    {[
                      { id: 'ALL', label: 'Tất cả' },
                      { id: 'CHARGING', label: 'Sạc xe' },
                      { id: 'MAINTENANCE', label: 'Bảo dưỡng' },
                      { id: 'CLEANING', label: 'Vệ sinh' },
                      { id: 'PARKING', label: 'Đỗ xe' },
                      { id: 'TOLL', label: 'Cầu đường' },
                      { id: 'INSURANCE', label: 'Bảo hiểm' },
                      { id: 'OTHER', label: 'Khác' },
                    ].map((tab) => {
                      const isTabActive = historyCategoryFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setHistoryCategoryFilter(tab.id)}
                          style={{
                            background: isTabActive
                              ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.35) 0%, rgba(14, 165, 233, 0.45) 100%)'
                              : 'rgba(255, 255, 255, 0.05)',
                            border: isTabActive ? '1.4px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.10)',
                            borderRadius: '9999px',
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            fontWeight: isTabActive ? 750 : 600,
                            color: isTabActive ? '#ffffff' : '#94a3b8',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isTabActive ? '0 0 10px rgba(0, 242, 254, 0.35)' : 'none',
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* D. Scrollable expense list with native wheel isolation */}
                  <div
                    ref={historyListScrollRef}
                    className="finance-detail-scroll"
                    style={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      paddingRight: '4px',
                    }}
                  >
                    {isExpensesLoading ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '36px',
                          gap: '10px',
                          color: '#94a3b8',
                        }}
                      >
                        <Loader2 size={20} className="animate-spin" color="#00f2fe" />
                        <span style={{ fontSize: '13px' }}>Đang tải lịch sử chi phí...</span>
                      </div>
                    ) : expenses.filter(
                        (e) => historyCategoryFilter === 'ALL' || e.category === historyCategoryFilter
                      ).length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '32px 16px',
                          background: 'rgba(10, 30, 56, 0.40)',
                          borderRadius: '16px',
                          border: '1.2px dashed rgba(0, 242, 254, 0.20)',
                        }}
                      >
                        <FileText size={26} color="#64748b" style={{ margin: '0 auto 8px', display: 'block' }} />
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                          Chưa có chi phí trong danh mục này.
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddExpenseModal(true)}
                          style={{
                            background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '8px 15px',
                            color: '#041628',
                            fontSize: '12px',
                            fontWeight: 750,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(0, 242, 254, 0.35)',
                            marginTop: '10px',
                          }}
                        >
                          <PlusCircle size={15} />
                          <span>Thêm chi phí</span>
                        </button>
                      </div>
                    ) : (
                      expenses
                        .filter((e) => historyCategoryFilter === 'ALL' || e.category === historyCategoryFilter)
                        .map((exp) => {
                          const meta =
                            EXPENSE_CATEGORY_METADATA[exp.category] || EXPENSE_CATEGORY_METADATA.OTHER;
                          let CategoryIcon = FileText;
                          if (exp.category === 'CHARGING') CategoryIcon = Zap;
                          else if (exp.category === 'MAINTENANCE') CategoryIcon = Wrench;
                          else if (exp.category === 'CLEANING') CategoryIcon = Sparkles;
                          else if (exp.category === 'PARKING') CategoryIcon = Car;
                          else if (exp.category === 'TOLL') CategoryIcon = Receipt;
                          else if (exp.category === 'REPAIR') CategoryIcon = AlertTriangle;
                          else if (exp.category === 'INSURANCE') CategoryIcon = ShieldCheck;

                          let dateDisplay = exp.occurredAt;
                          try {
                            const d = new Date(exp.occurredAt);
                            const now = new Date();
                            const isToday =
                              d.getDate() === now.getDate() &&
                              d.getMonth() === now.getMonth() &&
                              d.getFullYear() === now.getFullYear();
                            const hours = String(d.getHours()).padStart(2, '0');
                            const minutes = String(d.getMinutes()).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = d.getFullYear();
                            dateDisplay = isToday ? `Hôm nay, ${hours}:${minutes}` : `${day}/${month}/${year}`;
                          } catch {
                            dateDisplay = exp.occurredAt;
                          }

                          return (
                            <div
                              key={exp.id}
                              style={{
                                background: 'rgba(10, 30, 56, 0.65)',
                                borderRadius: '15px',
                                padding: '11px 14px',
                                minHeight: '56px',
                                border: '1.2px solid rgba(0, 242, 254, 0.16)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.20)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(14, 38, 70, 0.85)';
                                e.currentTarget.style.borderColor = '#00f2fe';
                                e.currentTarget.style.transform = 'translateX(-2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(10, 30, 56, 0.65)';
                                e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.16)';
                                e.currentTarget.style.transform = 'translateX(0)';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                                <div
                                  style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '50%',
                                    background: meta.chipBg,
                                    border: `1.4px solid ${meta.chipBorder}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <CategoryIcon size={16} color={meta.accentColor} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span
                                      style={{
                                        fontSize: '13.5px',
                                        fontWeight: 750,
                                        color: '#f8fafc',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {exp.description}
                                    </span>
                                    <span
                                      style={{
                                        background: meta.chipBg,
                                        border: `1px solid ${meta.chipBorder}`,
                                        color: meta.accentColor,
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        padding: '2px 6px',
                                        borderRadius: '9999px',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {exp.categoryLabel || meta.label}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: 500 }}>
                                    {dateDisplay} · {exp.paidByUserName || 'Thành viên'}
                                  </div>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
                                <div
                                  style={{
                                    fontSize: '14.5px',
                                    fontWeight: 800,
                                    color: '#fb7185',
                                    letterSpacing: '-0.01em',
                                  }}
                                >
                                  -{Number(exp.amount).toLocaleString('vi-VN')}đ
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* E. Footer actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.10)',
                      flexShrink: 0,
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setShowAddExpenseModal(true)}
                        style={{
                          background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                          border: 'none',
                          borderRadius: '14px',
                          padding: '9px 15px',
                          color: '#041628',
                          fontSize: '12.5px',
                          fontWeight: 750,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 0 16px rgba(0, 242, 254, 0.40)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Plus size={15} color="#041628" />
                        <span>Thêm chi phí</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFinanceView('FUND_DETAIL')}
                        style={{
                          background: 'rgba(0, 242, 254, 0.10)',
                          border: '1.2px solid rgba(0, 242, 254, 0.35)',
                          borderRadius: '14px',
                          padding: '9px 14px',
                          color: '#00f2fe',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <FileText size={14} color="#00f2fe" />
                        <span>Xem quỹ chung</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFinanceView('MAIN')}
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.30) 0%, rgba(6, 26, 52, 0.95) 100%)',
                        border: '1.2px solid #00f2fe',
                        borderRadius: '14px',
                        padding: '9px 20px',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 10px rgba(0, 242, 254, 0.25)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================
                  VIEW 3: SHARED FUND DETAIL SUB-VIEW (SAME 3D SLOT)
                  ======================================================== */}
              {financeView === 'FUND_DETAIL' && (
                <div
                  key="finance-fund-view"
                  className="finance-view-fade-in"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  {/* A. Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '16px',
                          background: 'rgba(0, 242, 254, 0.16)',
                          border: '2px solid #00f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 18px rgba(0, 242, 254, 0.45)',
                          flexShrink: 0,
                        }}
                      >
                        <Wallet size={24} color="#00f2fe" />
                      </div>
                      <div>
                        <h2
                          style={{
                            fontSize: '22px',
                            fontWeight: 850,
                            margin: 0,
                            letterSpacing: '-0.01em',
                            color: '#ffffff',
                            lineHeight: 1.2,
                            textTransform: 'uppercase',
                          }}
                        >
                          Quỹ chung
                        </h2>
                        <p
                          style={{
                            fontSize: '13px',
                            color: '#94a3b8',
                            margin: '2px 0 0 0',
                            fontWeight: 500,
                          }}
                        >
                          {activeVehicle?.name || 'EV01'} · Nhóm đồng sở hữu xe
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFinanceView('MAIN')}
                      title="Quay lại bảng tài chính"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.20)',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.50)';
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

                  {/* B. Hero summary block */}
                  <div
                    style={{
                      background: 'rgba(10, 30, 56, 0.78)',
                      border: '1.4px solid rgba(0, 242, 254, 0.35)',
                      borderRadius: '18px',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.28)',
                      flexShrink: 0,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 650, letterSpacing: '0.04em' }}>
                        Tổng quỹ hiện tại
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 850, color: '#00f2fe', marginTop: '2px', letterSpacing: '-0.01em' }}>
                        25.000.000đ
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 650, letterSpacing: '0.04em' }}>
                        Phần của bạn (40%)
                      </div>
                      <div style={{ fontSize: '19px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                        10.000.000đ
                      </div>
                    </div>
                  </div>

                  {/* C. Recurring cost blocks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 750, color: '#a5f3fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Khoản chi định kỳ
                    </div>
                    {[
                      { label: 'Sạc điện công cộng', cost: '1.250.000đ', share: '500.000đ', icon: Zap },
                      { label: 'Bảo dưỡng định kỳ', cost: '1.800.000đ', share: '720.000đ', icon: CheckCircle2 },
                      { label: 'Vệ sinh & bãi đỗ', cost: '400.000đ', share: '160.000đ', icon: Calendar },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(10, 30, 56, 0.65)',
                          borderRadius: '15px',
                          padding: '11px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1.2px solid rgba(0, 242, 254, 0.16)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              background: 'rgba(0, 242, 254, 0.12)',
                              border: '1.2px solid rgba(0, 242, 254, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <item.icon size={16} color="#00f2fe" />
                          </div>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
                            {item.label}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                            {item.cost}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginTop: '1px' }}>
                            Bạn: <span style={{ color: '#38bdf8', fontWeight: 650 }}>{item.share}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* D. Mini insight section */}
                  <div
                    style={{
                      background: 'rgba(6, 18, 36, 0.60)',
                      border: '1.2px solid rgba(0, 242, 254, 0.16)',
                      borderRadius: '16px',
                      padding: '12px 16px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      flexShrink: 0,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 650 }}>
                        Tỷ lệ sở hữu
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', marginTop: '3px' }}>
                        40% (Bạn)
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 650 }}>
                        Chi tháng này
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#00f2fe', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formattedMonthlyExpense}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 650 }}>
                        Khoản gần nhất
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', marginTop: '3px' }}>
                        1.250.000đ
                      </div>
                    </div>
                  </div>

                  {/* E. Footer actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.10)',
                      flexShrink: 0,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setFinanceView('EXPENSE_HISTORY')}
                      style={{
                        background: 'rgba(0, 242, 254, 0.10)',
                        border: '1.2px solid rgba(0, 242, 254, 0.35)',
                        borderRadius: '14px',
                        padding: '9px 18px',
                        color: '#00f2fe',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <FileText size={15} color="#00f2fe" />
                      <span>Xem lịch sử chi phí</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFinanceView('MAIN')}
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.30) 0%, rgba(6, 26, 52, 0.95) 100%)',
                        border: '1.2px solid #00f2fe',
                        borderRadius: '14px',
                        padding: '9px 24px',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 10px rgba(0, 242, 254, 0.25)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Html>
        </group>
      </group>

      {/* Modal: Thêm chi phí mới (Safe DOM overlay portaled to document.body) */}
      {showAddExpenseModal &&
        renderModalPortal(
          <AddExpenseModal
            isOpen={showAddExpenseModal}
            onClose={() => setShowAddExpenseModal(false)}
            vehicleId={activeVehicleId || ''}
            currentUser={user}
            coOwners={coOwners}
          />
        )}
    </>
  );
};
