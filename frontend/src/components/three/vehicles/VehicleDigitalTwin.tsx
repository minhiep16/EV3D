import React, { Suspense } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore, VEHICLE_STATUS_LABELS } from '../../../store/worldStore';
import { fetchVehicles } from '../../../services/vehicleApi';
import { VehicleResponse } from '../../../types/vehicle';
import { VehicleModel } from './VehicleModel';
import { VehicleStatusLabel } from './VehicleStatusLabel';
import { VehicleSelectionEffect } from './VehicleSelectionEffect';
import { VehicleInspectionGuide } from './VehicleInspectionGuide';
import { SpatialVehiclePartPanel } from './SpatialVehiclePartPanel';
import { SpatialDataLink } from '../SpatialDataLink';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';
import { VehicleCoOwnershipWorld } from '../ownership/VehicleCoOwnershipWorld';
import { VehicleBookingWorld } from '../booking/VehicleBookingWorld';
import { VehicleHandoverWorld } from '../handover/VehicleHandoverWorld';
import { getPartById } from '../../../data/vehicleParts';
import {
  Car,
  Zap,
  Battery,
  Gauge,
  Wrench,
  Users,
  Calendar,
  X,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Hash,
  ShieldCheck,
  Key,
  Eye,
} from 'lucide-react';

export const VehicleDigitalTwin: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const authReady = isAuthenticated && (!!accessToken || !!refreshToken);

  const selectedZone = useWorldStore((state) => state.selectedZone);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const hoveredVehicleId = useWorldStore((state) => state.hoveredVehicleId);
  const vehicleInspectionMode = useWorldStore(
    (state) => state.vehicleInspectionMode
  );
  const vehicleCoOwnershipMode = useWorldStore(
    (state) => state.vehicleCoOwnershipMode
  );
  const user = useAuthStore((state) => state.user);
  const vehicleBookingMode = useWorldStore((state) => state.vehicleBookingMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);
  const selectedVehiclePartId = useWorldStore(
    (state) => state.selectedVehiclePartId
  );
  const selectVehicle = useWorldStore((state) => state.selectVehicle);
  const hoverVehicle = useWorldStore((state) => state.hoverVehicle);
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const enterVehicleInspectionMode = useWorldStore(
    (state) => state.enterVehicleInspectionMode
  );
  const enterVehicleCoOwnershipMode = useWorldStore(
    (state) => state.enterVehicleCoOwnershipMode
  );
  const enterVehicleBookingMode = useWorldStore(
    (state) => state.enterVehicleBookingMode
  );
  const enterVehicleHandoverMode = useWorldStore(
    (state) => state.enterVehicleHandoverMode
  );

  // TanStack Query: Fetch vehicles from Spring Boot API / MySQL
  // Enabled ONLY when authentication state is ready and token exists
  const { data: vehicles, isLoading, isError, error, refetch } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
    enabled: authReady,
    refetchInterval: authReady ? 6000 : false,
  });

  // 1. Loading State in 3D Space (also shown while auth is initializing)
  if (!authReady || isLoading) {
    return (
      <group position={[-8, 0.14, 4]}>
        <Html position={[0, 1.8, 0]} center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div
            style={{
              background: 'rgba(8, 12, 22, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '9999px',
              padding: '8px 18px',
              color: '#38bdf8',
              fontFamily: 'var(--font-family)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles size={14} color="#00f2fe" />
            <span>ĐANG TẢI DỮ LIỆU XE...</span>
          </div>
        </Html>
      </group>
    );
  }

  // 2. Error State in 3D Space
  if (isError) {
    return (
      <group position={[-8, 0.14, 4]}>
        <Html position={[0, 1.8, 0]} center distanceFactor={8.5} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
          <div
            style={{
              width: '280px',
              background: 'rgba(15, 10, 20, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '14px',
              padding: '16px',
              color: '#f8fafc',
              fontFamily: 'var(--font-family)',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(239, 68, 68, 0.25)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '6px',
              }}
            >
              <AlertTriangle size={15} />
              <span>KHÔNG THỂ TẢI DỮ LIỆU XE</span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px 0' }}>
              {(() => {
                const rawMsg = (error as Error)?.message || '';
                if (
                  rawMsg.includes('Authentication token') ||
                  rawMsg.includes('Unauthorized') ||
                  rawMsg.includes('token is missing') ||
                  rawMsg.includes('Phiên đăng nhập')
                ) {
                  return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                }
                if (rawMsg.includes('quyền truy cập') || rawMsg.includes('Forbidden')) {
                  return 'Bạn không có quyền truy cập dữ liệu xe.';
                }
                if (
                  rawMsg.includes('CORS') ||
                  rawMsg.includes('Unexpected token') ||
                  rawMsg.includes('JSON') ||
                  rawMsg.includes('Network') ||
                  rawMsg.includes('Failed to fetch') ||
                  rawMsg.includes('kết nối')
                ) {
                  return 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
                }
                return 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
              })()}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 16px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={12} />
              THỬ LẠI
            </button>
          </div>
        </Html>
      </group>
    );
  }

  // 3. Empty State in 3D Space (No vehicles found in database)
  if (!vehicles || vehicles.length === 0) {
    return (
      <group position={[-8, 0.14, 4]}>
        <Html position={[0, 1.8, 0]} center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div
            style={{
              background: 'rgba(8, 12, 22, 0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '9999px',
              padding: '8px 18px',
              color: '#94a3b8',
              fontFamily: 'var(--font-family)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            <Car size={14} />
            <span>CHƯA CÓ XE TRONG HỆ THỐNG</span>
          </div>
        </Html>
      </group>
    );
  }

  // Connected State: Use the primary vehicle from API
  const vehicle = vehicles[0];
  const displayCode = 'EV01';
  const isSelected = selectedZone === 'VEHICLE' || selectedVehicleId === vehicle.id || selectedVehicleId === displayCode;
  const isHovered = hoveredVehicleId === vehicle.id || hoveredVehicleId === displayCode;

  const statusConfig = VEHICLE_STATUS_LABELS[vehicle.status] || VEHICLE_STATUS_LABELS.AVAILABLE;
  const formattedOdometer = Number(vehicle.odometer).toLocaleString('vi-VN');
  const estimatedRangeKm = Math.round((vehicle.currentBatteryLevel / 100) * (Number(vehicle.batteryCapacity) * 5.15));

  const selectedPart = getPartById(selectedVehiclePartId);

  const isBusinessModeActive =
    vehicleInspectionMode ||
    vehicleCoOwnershipMode ||
    vehicleBookingMode ||
    vehicleHandoverMode;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (isBusinessModeActive) return;
    e.stopPropagation();
    selectVehicle(vehicle.id);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (isBusinessModeActive) return;
    e.stopPropagation();
    hoverVehicle(vehicle.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (isBusinessModeActive) return;
    e.stopPropagation();
    if (hoveredVehicleId === vehicle.id || hoveredVehicleId === displayCode) {
      hoverVehicle(null);
    }
    document.body.style.cursor = 'auto';
  };

  return (
    // Situated on the Vehicle Zone parking pad (center: x=-8, y=0.14, z=4)
    <group
      position={[-8, 0.14, 4]}
      rotation={[0, 0, 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* 1. Selection & Hover Underglow Halo */}
      <VehicleSelectionEffect isSelected={isSelected} isHovered={isHovered} />

      {/* 2. Real EV 3D GLB Model (dynamic path from backend) */}
      <Suspense fallback={null}>
        <VehicleModel
          isSelected={isSelected}
          isHovered={isHovered}
          modelUrl={vehicle.model3dUrl || '/models/ev-car.glb'}
        />
      </Suspense>

      {/* 3. Floating 3D Status Pill Indicator (shown only before vehicle is selected) */}
      {!isSelected && !vehicleInspectionMode && !vehicleCoOwnershipMode && (
        <VehicleStatusLabel
          id={displayCode}
          name={vehicle.name}
          status={vehicle.status}
          batteryLevel={vehicle.currentBatteryLevel}
          isSelected={isSelected}
          isHovered={isHovered}
        />
      )}

      {/* 4. World-Space Spatial Vehicle Information Card with 3D Holographic Frame & Connector */}
      {isSelected && !vehicleInspectionMode && !vehicleCoOwnershipMode && !vehicleBookingMode && !vehicleHandoverMode && (
        <>
          {/* Visible 3D Laser Connector linking EV01 to detailed panel */}
          <SpatialDataLink
            start={[0, 0.7, 0]}
            end={[2.6 - 0.45, 1.35, 0]}
            color="#00f2fe"
          />

          <group position={[2.6, 1.35, 0]}>
            <Billboard follow={true}>
              <HolographicPanelFrame3D width={2.45} height={3.2} color="#00f2fe" />
              <Html
                center
                distanceFactor={8.8}
                style={{ pointerEvents: 'auto', userSelect: 'none' }}
              >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '330px',
              background: 'rgba(8, 12, 22, 0.94)',
              backdropFilter: 'blur(20px)',
              border: '1px solid #00f2fe',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 242, 254, 0.25)',
              borderRadius: '16px',
              padding: '22px',
              color: '#ffffff',
              fontFamily: 'var(--font-family)',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => clearSelection()}
              title="Đóng thông tin xe"
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>

            {/* Header Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10px',
                fontWeight: 700,
                color: '#00f2fe',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              <Car size={13} />
              Bản Sao Số Xe Điện
            </div>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                margin: '0 0 2px 0',
                color: '#ffffff',
              }}
            >
              {displayCode}
            </h3>

            <div
              style={{
                fontSize: '12px',
                color: '#38bdf8',
                fontWeight: 600,
                marginBottom: '14px',
              }}
            >
              {vehicle.name}
            </div>

            {/* Status & Battery Level Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '10px',
              }}
            >
              {/* Status Block */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                  Trạng thái
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: statusConfig.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: statusConfig.color,
                      boxShadow: `0 0 6px ${statusConfig.color}`,
                    }}
                  />
                  {statusConfig.label}
                </div>
              </div>

              {/* Battery Block */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                  Mức pin
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#00f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Zap size={14} color="#00f2fe" />
                  {vehicle.currentBatteryLevel}%
                </div>
              </div>
            </div>

            {/* Battery Level Progress Bar */}
            <div style={{ marginBottom: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  color: '#94a3b8',
                  marginBottom: '4px',
                }}
              >
                <span>Dung lượng khả dụng</span>
                <span style={{ color: '#cbd5e1' }}>Ước tính ~{estimatedRangeKm} km</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${vehicle.currentBatteryLevel}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0284c7, #00f2fe)',
                    borderRadius: '9999px',
                    boxShadow: '0 0 10px rgba(0, 242, 254, 0.8)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Technical Specifications Grid (Real MySQL Data) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Hãng xe</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>{vehicle.brand}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Mẫu xe</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>{vehicle.model}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Biển số</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>{vehicle.licensePlate}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Quãng đường</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>{formattedOdometer} km</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Dung lượng pin</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>{vehicle.batteryCapacity} kWh</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Năm sản xuất</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>{vehicle.year}</div>
              </div>
            </div>

            {/* Action Buttons: Booking, Co-ownership & Inspection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => enterVehicleBookingMode()}
                style={{
                  width: '100%',
                  padding: '11px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(0, 242, 254, 0.35)',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 242, 254, 0.55)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 242, 254, 0.35)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <Calendar size={14} />
                ĐẶT LỊCH SỬ DỤNG
              </button>

              <button
                type="button"
                onClick={() => enterVehicleCoOwnershipMode()}
                style={{
                  width: '100%',
                  padding: '11px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(168, 85, 247, 0.35)',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.55)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 85, 247, 0.35)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <Users size={14} />
                ĐỒNG SỞ HỮU
              </button>

              {/* Role-Aware Handover & Check-in Action (Phase 09) */}
              {user?.role === 'STAFF' ? (
                <button
                  type="button"
                  onClick={() => enterVehicleHandoverMode()}
                  style={{
                    width: '100%',
                    padding: '11px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#080c16',
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(0, 242, 254, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 22px rgba(0, 242, 254, 0.65)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 242, 254, 0.4)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <ShieldCheck size={14} />
                  KIỂM TRA & BÀN GIAO XE
                </button>
              ) : user?.role === 'ADMIN' ? (
                <button
                  type="button"
                  onClick={() => enterVehicleHandoverMode()}
                  style={{
                    width: '100%',
                    padding: '11px',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 22px rgba(168, 85, 247, 0.65)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 85, 247, 0.4)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <Eye size={14} />
                  THEO DÕI BÀN GIAO
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => enterVehicleHandoverMode()}
                  style={{
                    width: '100%',
                    padding: '11px',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#052e16',
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 22px rgba(16, 185, 129, 0.65)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <Key size={14} />
                  NHẬN XE
                </button>
              )}

              <button
                type="button"
                onClick={() => enterVehicleInspectionMode()}
                style={{
                  width: '100%',
                  padding: '9px',
                  background: 'rgba(2, 132, 199, 0.2)',
                  border: '1px solid rgba(0, 242, 254, 0.4)',
                  borderRadius: '10px',
                  color: '#38bdf8',
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0, 242, 254, 0.15)',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 242, 254, 0.35)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 242, 254, 0.15)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <Wrench size={13} />
                KIỂM TRA BỘ PHẬN
              </button>
            </div>
          </div>
        </Html>
      </Billboard>
    </group>
  </>
)}

      {/* 5. Vehicle Inspection Mode: Floating Instruction Guide */}
      {vehicleInspectionMode && !selectedVehiclePartId && (
        <VehicleInspectionGuide />
      )}

      {/* 6. Vehicle Inspection Mode: Detailed Spatial Vehicle Part Panel */}
      {vehicleInspectionMode && selectedPart && (
        <SpatialVehiclePartPanel part={selectedPart} />
      )}

      {/* 7. Phase 07: Vehicle 3D Co-Ownership View */}
      {vehicleCoOwnershipMode && (
        <VehicleCoOwnershipWorld vehicle={vehicle} />
      )}

      {/* 8. Phase 08: Pure 3D Vehicle Booking View */}
      {vehicleBookingMode && (
        <VehicleBookingWorld vehicle={vehicle} />
      )}

      {/* 9. Phase 09: 3D Vehicle Handover & Check-in View */}
      {vehicleHandoverMode && (
        <VehicleHandoverWorld vehicle={vehicle} />
      )}
    </group>
  );
};
