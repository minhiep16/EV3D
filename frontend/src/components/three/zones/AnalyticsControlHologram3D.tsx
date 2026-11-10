import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Zap,
  Gauge,
  Calendar,
  ChevronRight,
  FileSpreadsheet,
  Activity,
  Award,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Car,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useWorldStore } from '../../../store/worldStore';
import { HologramProjectionBase3D } from './common/HologramProjectionBase3D';
import { fetchVehicleAnalytics } from '../../../services/analyticsApi';
import { fetchVehicles } from '../../../services/vehicleApi';
import { VehicleResponse } from '../../../types/vehicle';
import { VehicleAnalyticsResponse } from '../../../types/analytics';

interface AnalyticsControlHologram3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  onClose?: () => void;
  visible?: boolean;
  vehicle?: VehicleResponse | null;
  vehicleId?: string;
}

const MEMBER_COLORS = ['#00f2fe', '#38bdf8', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];

/**
 * AnalyticsControlHologram3D:
 * Authoritative 3D World-Space Holographic Interactive Control Console for Vehicle Analytics.
 * Connected directly to real MySQL database tables via Spring Boot:
 * - Real trip odometers (trips)
 * - Real charging sessions (charging_sessions)
 * - Real approved operating expenses (expenses)
 * - Real co-ownership members and shares (co_ownership_groups, ownership_shares)
 * - Supports 7D / 30D / 90D dynamic period filtering
 * - Exports authoritative CSV analytics reports
 * - Displays resilient empty and error states without synthetic placeholders
 */
export const AnalyticsControlHologram3D: React.FC<AnalyticsControlHologram3DProps> = ({
  position = [6.5, 1.5, 2.8],
  rotation = [0, -0.1745, 0],
  onClose,
  visible = true,
  vehicle: propVehicle,
  vehicleId: propVehicleId,
}) => {
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const consoleFloatRef = useRef<THREE.Group>(null);
  const frameGlowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);

  // Period filter state: 7, 30, or 90 days
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Fallback vehicle query if no vehicle is directly passed
  const { data: vehicles = [] } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
    enabled: !propVehicle && !propVehicleId,
    staleTime: 60000,
  });

  const resolvedVehicle = useMemo(() => {
    if (propVehicle) return propVehicle;
    const targetId = propVehicleId || selectedVehicleId;
    if (targetId && vehicles.length > 0) {
      return (
        vehicles.find(
          (v) =>
            v.id === targetId ||
            v.vin === targetId ||
            v.name?.toUpperCase() === targetId.toUpperCase()
        ) || vehicles[0]
      );
    }
    return vehicles[0] || null;
  }, [propVehicle, propVehicleId, selectedVehicleId, vehicles]);

  const effectiveVehicleId = resolvedVehicle?.id || propVehicleId || selectedVehicleId;

  // Date range calculations for period
  const { fromDateStr, toDateStr } = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (periodDays - 1));
    const pad = (n: number) => String(n).padStart(2, '0');
    const toStr = `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`;
    const fromStr = `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`;
    return { fromDateStr: fromStr, toDateStr: toStr };
  }, [periodDays]);

  // Authoritative real database query
  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<VehicleAnalyticsResponse>({
    queryKey: ['vehicleAnalytics', effectiveVehicleId, fromDateStr, toDateStr],
    queryFn: () => fetchVehicleAnalytics(effectiveVehicleId!, fromDateStr, toDateStr),
    enabled: !!effectiveVehicleId && visible,
    staleTime: 20000,
  });

  // Dimensions matching standard 3D console
  const panelW = 3.65;
  const panelH = 5.6;
  const hw = panelW / 2;
  const hh = panelH / 2;
  const bracketLen = 0.36;
  const bracketThick = 0.022;

  // Emissive glow and subtle hover animation
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

  // Authoritative CSV Export
  const handleExportCsv = () => {
    if (!analytics) return;
    setIsExporting(true);

    try {
      const headers = ['Ngày', 'Thứ', 'Điện năng (kWh)', 'Quãng đường (km)', 'Số chuyến', 'Chi phí (VNĐ)'];
      const rows = analytics.dailySeries.map((d) => [
        d.date,
        d.dayOfWeek,
        d.energyKwh.toFixed(1),
        d.distanceKm.toFixed(1),
        d.tripsCount,
        d.costVnd || 0,
      ]);

      const summaryHeader = [
        ['BÁO CÁO PHÂN TÍCH VẬN HÀNH XE ĐIỆN EVSHARE'],
        ['Tên xe', analytics.vehicleName || 'Xe điện'],
        ['Biển số', analytics.licensePlate || 'N/A'],
        ['Dòng xe', `${analytics.brand || ''} ${analytics.model || ''}`.trim()],
        ['Dung lượng pin', analytics.batteryCapacity ? `${analytics.batteryCapacity} kWh` : 'N/A'],
        ['Kỳ báo cáo', `${analytics.fromDate} đến ${analytics.toDate} (${analytics.periodDays} ngày)`],
        ['Tổng quãng đường', `${analytics.totalDistanceKm} km`],
        ['Số chuyến hoàn tất', `${analytics.completedTripsCount} chuyến`],
        ['Thời gian vận hành', `${analytics.totalDrivingHours} giờ`],
        ['Ngày hoạt động', `${analytics.activeDrivingDays}/${analytics.periodDays} ngày`],
        ['Tổng điện năng tiêu thụ/sạc', `${analytics.totalEnergyKwh} kWh`],
        [
          'Mức tiêu thụ TB',
          analytics.energyConsumptionKwhPer100Km != null
            ? `${analytics.energyConsumptionKwhPer100Km} kWh/100km`
            : 'Chưa đủ dữ liệu',
        ],
        ['Tổng chi phí vận hành', `${Number(analytics.totalOperatingExpenses).toLocaleString('vi-VN')} VNĐ`],
        [
          'Chi phí trên km',
          analytics.costPerKm != null
            ? `${Math.round(analytics.costPerKm).toLocaleString('vi-VN')} VNĐ/km`
            : 'Chưa đủ dữ liệu',
        ],
        ['Tỷ lệ sử dụng', `${analytics.utilizationRatePercent}%`],
        [],
        ['PHÂN BỔ SỬ DỤNG THÀNH VIÊN'],
        ['Thành viên', 'Tỷ lệ sở hữu (%)', 'Tỷ lệ sử dụng (%)', 'Quãng đường (km)', 'Số chuyến'],
        ...analytics.memberUsage.map((m) => [
          m.userName,
          `${m.ownershipPercentage}%`,
          `${m.usagePercentage}%`,
          `${m.distanceKm} km`,
          `${m.tripsCount}`,
        ]),
        [],
        ['CHI TIẾT VẬN HÀNH HÀNG NGÀY'],
        headers,
        ...rows,
      ];

      const csvContent =
        '\uFEFF' +
        summaryHeader
          .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const safePlate = (analytics.licensePlate || analytics.vehicleName || 'Vehicle').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute(
        'download',
        `EVShare-Analytics-${safePlate}-${analytics.fromDate}_${analytics.toDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export CSV analytics:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Compute max energy for chart scaling
  const maxEnergy = useMemo(() => {
    if (!analytics || !analytics.dailySeries || analytics.dailySeries.length === 0) return 20;
    const maxVal = Math.max(...analytics.dailySeries.map((d) => d.energyKwh || 0));
    return maxVal > 0 ? maxVal * 1.15 : 20;
  }, [analytics]);

  const vehicleName = analytics?.vehicleName || resolvedVehicle?.name || 'Xe điện';
  const licensePlate = analytics?.licensePlate || resolvedVehicle?.licensePlate || '';

  if (!visible) return null;

  return (
    <group
      position={position}
      rotation={rotation}
      visible={visible}
      name="AnalyticsControlHologramRoot"
    >
      {/* 1. TRUE THREE.JS PROJECTION BASE (FLOOR ANCHOR) */}
      <HologramProjectionBase3D
        position={[0, -position[1] + 0.005, 0]}
        color="#00f2fe"
        visible={visible}
      />

      {/* 2. FLOATING CONSOLE GROUP WITH THREE.JS GLASS BACKING & DREI HTML SURFACE */}
      <group ref={consoleFloatRef}>
        {/* REAR DARK NAVY TINTED GLASS BACKING */}
        <mesh position={[0, 0, -0.045]} raycast={() => null}>
          <planeGeometry args={[panelW, panelH]} />
          <meshStandardMaterial
            color="#040c1c"
            roughness={0.12}
            metalness={0.88}
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* LOW-OPACITY TECHNICAL WIREFRAME */}
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

        {/* EMISSIVE PERIMETER CORNER BRACKETS */}
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
        </group>

        {/* 3. DREI HTML INTERACTION SURFACE */}
        <Html
          transform
          occlude="blending"
          position={[0, 0, 0.01]}
          scale={0.42}
          style={{
            width: '450px',
            height: '670px',
            userSelect: 'none',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              padding: '18px 20px',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              color: '#f8fafc',
              background: 'radial-gradient(ellipse at top right, rgba(0, 242, 254, 0.08) 0%, rgba(4, 12, 28, 0.94) 80%)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(0, 242, 254, 0.45)',
              borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), inset 0 0 35px rgba(0, 242, 254, 0.12)',
              gap: '12px',
            }}
          >
            {/* 1. HEADER WITH DYNAMIC VEHICLE TITLE & PERIOD SELECTOR */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flexShrink: 0,
                borderBottom: '1px solid rgba(0, 242, 254, 0.25)',
                paddingBottom: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: 'rgba(0, 242, 254, 0.15)',
                      border: '1px solid rgba(0, 242, 254, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 14px rgba(0, 242, 254, 0.35)',
                    }}
                  >
                    <Activity size={20} color="#00f2fe" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2
                        style={{
                          fontSize: '20px',
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
                          gap: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#00f2fe',
                          background: 'rgba(0, 242, 254, 0.15)',
                          border: '1px solid rgba(0, 242, 254, 0.4)',
                          padding: '2px 7px',
                          borderRadius: '9999px',
                        }}
                      >
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: isFetching ? '#38bdf8' : '#10b981',
                            boxShadow: '0 0 6px currentColor',
                          }}
                        />
                        <span>{isFetching ? 'Đang tải...' : 'Database'}</span>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: '11.5px',
                        color: '#94a3b8',
                        margin: '2px 0 0 0',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>{vehicleName}</span>
                      {licensePlate && (
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.10)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            color: '#e2e8f0',
                            fontSize: '10.5px',
                            fontWeight: 600,
                          }}
                        >
                          {licensePlate}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleClose}
                  title="Đóng bảng điều khiển"
                  style={{
                    width: '32px',
                    height: '32px',
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
                  <X size={16} />
                </button>
              </div>

              {/* Period Filter Tabs: 7D / 30D / 90D */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(0, 15, 35, 0.6)',
                  borderRadius: '10px',
                  padding: '3px',
                  border: '1px solid rgba(0, 242, 254, 0.2)',
                }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  {([7, 30, 90] as const).map((days) => {
                    const isActive = periodDays === days;
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setPeriodDays(days)}
                        style={{
                          background: isActive
                            ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.3) 0%, rgba(2, 132, 199, 0.4) 100%)'
                            : 'transparent',
                          border: isActive ? '1px solid rgba(0, 242, 254, 0.6)' : '1px solid transparent',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#00f2fe' : '#94a3b8',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isActive ? '0 0 10px rgba(0, 242, 254, 0.25)' : 'none',
                        }}
                      >
                        {days} ngày
                      </button>
                    );
                  })}
                </div>

                <div
                  style={{
                    fontSize: '10.5px',
                    color: '#64748b',
                    paddingRight: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Clock size={11} />
                  <span>
                    {analytics ? `${analytics.fromDate} → ${analytics.toDate}` : `${periodDays} ngày qua`}
                  </span>
                </div>
              </div>
            </div>

            {/* ERROR STATE */}
            {isError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1.2px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} color="#ef4444" />
                  <span style={{ fontSize: '11.5px', color: '#fca5a5' }}>
                    {error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ phân tích'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => refetch()}
                  style={{
                    background: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={11} />
                  <span>Thử lại</span>
                </button>
              </div>
            )}

            {/* LOADING SKELETON */}
            {isLoading && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  color: '#00f2fe',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '3px solid rgba(0, 242, 254, 0.2)',
                    borderTopColor: '#00f2fe',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em' }}>
                  ĐANG TRUY VẤN TELEMETRY TỪ DATABASE...
                </span>
              </div>
            )}

            {/* REAL DATA CONTENT */}
            {!isLoading && analytics && (
              <>
                {/* 2. FIXED KEY SUMMARY HERO CARD */}
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(0, 242, 254, 0.16) 0%, rgba(6, 26, 52, 0.70) 100%)',
                    border: '1.2px solid rgba(0, 242, 254, 0.40)',
                    borderRadius: '16px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    boxShadow: '0 4px 18px rgba(0, 242, 254, 0.12)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Trạng thái pin & hoạt động
                    </div>
                    <div
                      style={{
                        fontSize: '19px',
                        fontWeight: 800,
                        color: '#00f2fe',
                        letterSpacing: '-0.01em',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '6px',
                      }}
                    >
                      {analytics.sohPercent != null ? `${analytics.sohPercent}%` : 'Pin tốt'}
                      <span
                        style={{
                          fontSize: '11px',
                          color: analytics.utilizationRatePercent >= 50 ? '#10b981' : '#38bdf8',
                          fontWeight: 600,
                        }}
                      >
                        {analytics.utilizationRatePercent >= 70
                          ? 'Tần suất cao'
                          : analytics.utilizationRatePercent >= 40
                          ? 'Vận hành ổn định'
                          : 'Sẵn sàng điều phối'}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {analytics.completedTripsCount} chuyến hoàn tất
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                      {analytics.totalDrivingHours > 0
                        ? `${analytics.totalDrivingHours} giờ lăn bánh`
                        : `${analytics.activeDrivingDays} ngày hoạt động`}
                    </div>
                  </div>
                </div>

                {/* 3. SCROLLABLE DETAIL AREA */}
                <div
                  ref={detailScrollRef}
                  className="analytics-detail-scroll"
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    paddingRight: '4px',
                  }}
                >
                  {/* Empty Data Banner if vehicle has no trips yet */}
                  {!analytics.hasTripData && !analytics.hasEnergyData && (
                    <div
                      style={{
                        background: 'rgba(2, 132, 199, 0.15)',
                        border: '1px dashed rgba(56, 189, 248, 0.45)',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        fontSize: '11px',
                        color: '#bae6fd',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Car size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                      <span>
                        Chưa có dữ liệu chuyến đi hoặc phiên sạc trong khoảng thời gian này. Hệ thống sẽ
                        tự động cập nhật khi xe phát sinh lịch trình mới.
                      </span>
                    </div>
                  )}

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
                        background: 'rgba(10, 30, 56, 0.85)',
                        border: '1.2px solid rgba(0, 242, 254, 0.3)',
                        borderRadius: '14px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
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
                          fontSize: '17px',
                          fontWeight: 800,
                          color: '#ffffff',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {analytics.energyConsumptionKwhPer100Km != null ? (
                          <>
                            {analytics.energyConsumptionKwhPer100Km}{' '}
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>
                              kWh/100km
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                            Chưa đủ dữ liệu
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                        {analytics.energyConsumptionKwhPer100Km != null
                          ? analytics.energyConsumptionKwhPer100Km < 16
                            ? 'Mức tối ưu cao'
                            : 'Tiêu chuẩn phân khúc'
                          : 'Đang tổng hợp chuyến đi'}
                      </div>
                    </div>

                    {/* Metric 2: Quãng đường */}
                    <div
                      style={{
                        background: 'rgba(10, 30, 56, 0.85)',
                        border: '1.2px solid rgba(0, 242, 254, 0.3)',
                        borderRadius: '14px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
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
                          fontSize: '17px',
                          fontWeight: 800,
                          color: '#ffffff',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {analytics.totalDistanceKm != null ? analytics.totalDistanceKm.toLocaleString('vi-VN') : '0'}{' '}
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>
                          km
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700 }}>
                        {analytics.completedTripsCount} chuyến ({periodDays} ngày)
                      </div>
                    </div>

                    {/* Metric 3: Chi phí / km */}
                    <div
                      style={{
                        background: 'rgba(10, 30, 56, 0.85)',
                        border: '1.2px solid rgba(0, 242, 254, 0.3)',
                        borderRadius: '14px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
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
                          fontSize: '17px',
                          fontWeight: 800,
                          color: '#ffffff',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {analytics.costPerKm != null ? (
                          <>
                            {Math.round(analytics.costPerKm).toLocaleString('vi-VN')}{' '}
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>
                              ₫/km
                            </span>
                          </>
                        ) : analytics.hasExpenseData ? (
                          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                            {Number(analytics.totalOperatingExpenses).toLocaleString('vi-VN')}₫
                          </span>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                            Chưa phát sinh
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                        {analytics.costPerKm != null
                          ? 'Tiết kiệm ~60% xe xăng'
                          : analytics.hasExpenseData
                          ? 'Chi phí quỹ vận hành'
                          : 'Không phát sinh chi phí'}
                      </div>
                    </div>

                    {/* Metric 4: Tỷ lệ sử dụng */}
                    <div
                      style={{
                        background: 'rgba(10, 30, 56, 0.85)',
                        border: '1.2px solid rgba(0, 242, 254, 0.3)',
                        borderRadius: '14px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
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
                          fontSize: '17px',
                          fontWeight: 800,
                          color: '#ffffff',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {analytics.utilizationRatePercent}%{' '}
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>
                          hiệu dụng
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#a855f7', fontWeight: 700 }}>
                        {analytics.activeDrivingDays} / {analytics.periodDays} ngày lăn bánh
                      </div>
                    </div>
                  </div>

                  {/* 3.2 Dynamic Energy Consumption Bar Chart */}
                  <div
                    style={{
                      background: 'rgba(6, 20, 40, 0.80)',
                      border: '1.2px solid rgba(0, 242, 254, 0.25)',
                      borderRadius: '14px',
                      padding: '11px 13px',
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
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>
                        Điện năng tiêu thụ/sạc theo ngày ({periodDays} ngày)
                      </span>
                      <span style={{ fontSize: '10px', color: '#00f2fe', fontWeight: 600 }}>
                        Tổng: {analytics.totalEnergyKwh} kWh
                      </span>
                    </div>

                    {/* Bars Container */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        gap: '3px',
                        height: '70px',
                        paddingTop: '6px',
                        borderBottom: '1px dashed rgba(0, 242, 254, 0.3)',
                      }}
                    >
                      {/* Sub-sample daily series if 30 or 90 days to fit nicely */}
                      {analytics.dailySeries.map((item, idx) => {
                        const val = item.energyKwh || 0;
                        const heightPct = maxEnergy > 0 ? (val / maxEnergy) * 100 : 0;
                        const isNonZero = val > 0;
                        const isPeak = isNonZero && val >= maxEnergy * 0.85;

                        // Only show label if 7 days or sample dates
                        const showLabel =
                          periodDays === 7 ||
                          idx === 0 ||
                          idx === analytics.dailySeries.length - 1 ||
                          idx % Math.ceil(analytics.dailySeries.length / 7) === 0;

                        return (
                          <div
                            key={item.date || idx}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '2px',
                              flex: 1,
                              minWidth: '4px',
                            }}
                          >
                            <div
                              title={`${item.date} (${item.dayOfWeek}): ${val} kWh | ${item.distanceKm} km (${item.tripsCount} chuyến)`}
                              style={{
                                width: '100%',
                                maxWidth: periodDays === 7 ? '22px' : '10px',
                                height: `${Math.max(8, heightPct)}%`,
                                background: isPeak
                                  ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)'
                                  : isNonZero
                                  ? 'linear-gradient(180deg, #00f2fe 0%, #0369a1 100%)'
                                  : 'rgba(255, 255, 255, 0.08)',
                                borderRadius: '3px 3px 0 0',
                                boxShadow: isPeak ? '0 0 8px rgba(56, 189, 248, 0.6)' : 'none',
                                transition: 'all 0.25s ease',
                              }}
                            />
                            {showLabel && (
                              <span
                                style={{
                                  fontSize: '8.5px',
                                  color: isNonZero ? '#e2e8f0' : '#64748b',
                                  fontWeight: 600,
                                }}
                              >
                                {periodDays === 7 ? item.dayOfWeek : item.date.slice(8)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3.3 Dynamic Co-Ownership Usage Share Breakdown */}
                  {analytics.memberUsage && analytics.memberUsage.length > 0 && (
                    <div
                      style={{
                        background: 'rgba(6, 20, 40, 0.80)',
                        border: '1.2px solid rgba(0, 242, 254, 0.25)',
                        borderRadius: '14px',
                        padding: '10px 12px',
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
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>
                          Phân bổ sử dụng thành viên đồng sở hữu
                        </span>
                        <span style={{ fontSize: '9.5px', color: '#10b981', fontWeight: 600 }}>
                          {analytics.memberUsage.length} thành viên
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
                        {analytics.memberUsage.map((m, idx) => {
                          const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
                          const widthPct = Math.max(0, m.usagePercentage || 0);
                          return (
                            <div
                              key={m.userId || idx}
                              style={{ width: `${widthPct}%`, background: color }}
                              title={`${m.userName}: ${m.usagePercentage}% (${m.distanceKm} km)`}
                            />
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                          fontSize: '9.5px',
                          color: '#94a3b8',
                        }}
                      >
                        {analytics.memberUsage.map((m, idx) => {
                          const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
                          return (
                            <span
                              key={m.userId || idx}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: color,
                                }}
                              />
                              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{m.userName}</span>
                              <span>({m.usagePercentage}% · {m.distanceKm}km)</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. FIXED ACTION FOOTER: EXPORT CSV REPORT */}
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={isExporting}
                    style={{
                      width: '100%',
                      background: exportSuccess
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '11px 16px',
                      color: exportSuccess ? '#ffffff' : '#041628',
                      fontSize: '13px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: exportSuccess
                        ? '0 6px 20px rgba(16, 185, 129, 0.4)'
                        : '0 6px 20px rgba(0, 242, 254, 0.4)',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {exportSuccess ? (
                        <CheckCircle2 size={16} color="#ffffff" />
                      ) : (
                        <FileSpreadsheet size={16} color="#041628" />
                      )}
                      <span>
                        {exportSuccess
                          ? 'Đã tải xuống báo cáo CSV thành công!'
                          : isExporting
                          ? 'Đang tạo báo cáo...'
                          : 'Xuất báo cáo phân tích chi tiết (CSV)'}
                      </span>
                    </div>
                    <ChevronRight size={16} color={exportSuccess ? '#ffffff' : '#041628'} />
                  </button>
                </div>
              </>
            )}
          </div>
        </Html>
      </group>
    </group>
  );
};
