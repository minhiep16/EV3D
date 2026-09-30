import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { EVShareWorld } from '../components/three/EVShareWorld';
import { useAuthStore } from '../store/authStore';
import { useWorldStore } from '../store/worldStore';
import { logoutApi } from '../services/authApi';
import { fetchVehicles } from '../services/vehicleApi';
import { VehicleResponse } from '../types/vehicle';
import { resolveVehicleCode } from '../components/three/vehicles/vehicleModelConfig';
import {
  LogOut,
  Warehouse,
  ArrowLeft,
  ShieldCheck,
  Eye,
  Sparkles,
  RotateCcw,
  Zap,
  Car,
} from 'lucide-react';
import { StaffGarageFleetSidebar } from '../components/fleet/StaffGarageFleetSidebar';
import { StaffVehicleDetailPanel } from '../components/fleet/StaffVehicleDetailPanel';
import { FleetHeroNavigator } from '../components/fleet/FleetHeroNavigator';
import { CoOwnerVehiclePartPanel } from '../components/three/vehicles/CoOwnerVehiclePartPanel';
import { DamageHistoryPanel } from '../components/three/damage/DamageHistoryPanel';
import { CoOwnerBookingPanel } from '../components/three/booking/CoOwnerBookingPanel';
import { StaffMaintenancePanel } from '../components/three/maintenance/StaffMaintenancePanel';
import { CoOwnerMaintenancePanel } from '../components/three/maintenance/CoOwnerMaintenancePanel';
import { BatteryHealthPanel } from '../components/three/battery/BatteryHealthPanel';
import { ChargingPanel } from '../components/three/charging/ChargingPanel';

export const GarageScene: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = isAuthenticated && !!accessToken;

  const isStaff = user?.role === 'STAFF';
  const isAdmin = user?.role === 'ADMIN';
  const isOperationsRole = isStaff || isAdmin;
  const isCoOwner = !user?.role || user?.role === 'CO_OWNER';

  const resetExperienceState = useWorldStore((state) => state.resetExperienceState);
  const vehicleFeatureMode = useWorldStore((state) => state.vehicleFeatureMode);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const selectedZone = useWorldStore((state) => state.selectedZone);
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const returnToGarageOverview = useWorldStore((state) => state.returnToGarageOverview);
  const selectVehicle = useWorldStore((state) => state.selectVehicle);
  const returnToVehicleOverview = useWorldStore((state) => state.returnToVehicleOverview);
  const vehicleCoOwnershipMode = useWorldStore((state) => state.vehicleCoOwnershipMode);
  const vehicleBookingMode = useWorldStore((state) => state.vehicleBookingMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);
  const vehicleReceiptReviewMode = useWorldStore((state) => state.vehicleReceiptReviewMode);
  const vehicleTripStartMode = useWorldStore((state) => state.vehicleTripStartMode);
  const vehicleTripVisualizationMode = useWorldStore((state) => state.vehicleTripVisualizationMode);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const vehicleDamageHistoryMode = useWorldStore((state) => state.vehicleDamageHistoryMode);
  const vehicleMaintenanceMode = useWorldStore((state) => state.vehicleMaintenanceMode);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const vehicleBatteryXrayMode = useWorldStore((state) => state.vehicleBatteryXrayMode);
  const vehicleChargingMode = useWorldStore((state) => state.vehicleChargingMode);
  const selectedVehiclePartId = useWorldStore((state) => state.selectedVehiclePartId);
  const selectedVehiclePartCode = useWorldStore((state) => state.selectedVehiclePartCode);
  const clearVehiclePartSelection = useWorldStore((state) => state.clearVehiclePartSelection);

  // Authoritative TanStack Query for vehicles (scoped per role and user)
  const { data: vehicles = [], isLoading } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
    enabled: authReady,
    staleTime: 6000,
  });

  // For operations role, derive authoritative foreground hero vehicle
  const heroVehicle = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return null;
    if (selectedVehicleId) {
      const match = vehicles.find((v) => {
        const code = resolveVehicleCode(v);
        return v.id === selectedVehicleId || code === selectedVehicleId;
      });
      if (match) return match;
    }
    return vehicles[0];
  }, [vehicles, selectedVehicleId]);

  // For CO_OWNER role, derive authoritative active co-owned vehicle
  // Invariant: CO_OWNER has maximum 1 active vehicle contract
  const currentCoOwnerVehicle = useMemo(() => {
    if (isOperationsRole || !vehicles || vehicles.length === 0) return null;
    if (vehicles.length > 1) {
      console.error(
        `[Domain Invariant Violation] CO_OWNER user is associated with ${vehicles.length} active vehicles. Expected maximum 1.`,
        vehicles.map((v) => v.id)
      );
    }
    return vehicles[0];
  }, [vehicles, isOperationsRole]);

  // Session Isolation: Whenever authenticated user changes, reset all transient experience states
  useEffect(() => {
    resetExperienceState();
  }, [user?.id, user?.role, resetExperienceState]);

  // Stale selectedVehicleId Validation & Purge for CO_OWNER:
  // Invariant: CO_OWNER has maximum ONE active vehicle contract
  // - If no active vehicle: clear selectedVehicleId / ownership context
  // - If exactly 1 vehicle: automatically resolve ownership context to that vehicle (overview, without deep detail mode)
  // - If > 1 vehicles: log invariant violation and clear stale selection
  useEffect(() => {
    if (!isOperationsRole) {
      if (vehicles.length === 0) {
        if (selectedVehicleId) {
          clearSelection();
        }
      } else if (vehicles.length === 1) {
        const onlyVehicle = vehicles[0];
        const code = resolveVehicleCode(onlyVehicle);
        if (
          selectedVehicleId &&
          selectedVehicleId !== onlyVehicle.id &&
          selectedVehicleId !== code
        ) {
          clearSelection();
        }
      } else if (vehicles.length > 1) {
        console.error(
          `[Domain Invariant Error] CO_OWNER user has multiple active vehicles:`,
          vehicles.map((v) => v.id)
        );
        clearSelection();
      }
    }
  }, [isOperationsRole, vehicles, selectedVehicleId, clearSelection]);

  // Ensure stale selected part state does not survive in normal vehicle overview
  useEffect(() => {
    if (!vehicleInspectionMode && !vehicleDamageMappingMode && !vehicleDamageHistoryMode) {
      if (selectedVehiclePartId || selectedVehiclePartCode) {
        clearVehiclePartSelection();
      }
    }
  }, [vehicleInspectionMode, vehicleDamageMappingMode, vehicleDamageHistoryMode, selectedVehiclePartId, selectedVehiclePartCode, clearVehiclePartSelection]);

  const initialOperationsSelectDone = useRef(false);
  // For STAFF / ADMIN, auto-select EV01 or first vehicle on initial load to match reference composition
  useEffect(() => {
    if (isOperationsRole && !initialOperationsSelectDone.current && vehicles.length > 0) {
      initialOperationsSelectDone.current = true;
      if (!selectedVehicleId) {
        const defaultVehicle = vehicles.find((v) => resolveVehicleCode(v) === 'EV01') || vehicles[0];
        selectVehicle(defaultVehicle.id, user?.role);
      }
    }
  }, [isOperationsRole, selectedVehicleId, vehicles, selectVehicle, user?.role]);

  // For CO_OWNER, auto-select vehicle only when explicitly entering booking mode without a selection
  useEffect(() => {
    if (!isOperationsRole && vehicles.length > 0) {
      const targetVehicle = currentCoOwnerVehicle || vehicles[0];
      if (vehicleBookingMode) {
        if (targetVehicle && selectedVehicleId !== targetVehicle.id) {
          selectVehicle(targetVehicle.id, user?.role);
        }
      }
    }
  }, [isOperationsRole, vehicleBookingMode, vehicles, currentCoOwnerVehicle, selectedVehicleId, selectVehicle, user?.role]);

  const showBackToVehicle =
    vehicleCoOwnershipMode ||
    vehicleBookingMode ||
    vehicleHandoverMode ||
    vehicleReceiptReviewMode ||
    vehicleTripStartMode ||
    vehicleTripVisualizationMode ||
    vehicleDamageMappingMode ||
    vehicleDamageHistoryMode ||
    vehicleMaintenanceMode ||
    vehicleInspectionMode ||
    vehicleBatteryXrayMode ||
    vehicleChargingMode ||
    vehicleFeatureMode === 'CO_OWNER_VEHICLE_INFO' ||
    vehicleFeatureMode === 'CO_OWNER_MY_BOOKINGS';

  const showBackToGarageOverview =
    (!!selectedVehicleId || !!selectedZone) && !showBackToVehicle;

  const handleBackToVehicle = () => {
    returnToVehicleOverview();
  };

  const handleLogout = async () => {
    resetExperienceState();
    queryClient.clear();
    await logoutApi();
    navigate('/login', { replace: true });
  };

  const modeBadge = useMemo(() => {
    if (user?.role === 'STAFF') {
      return {
        label: 'CHẾ ĐỘ VẬN HÀNH — NHÂN VIÊN',
        icon: <ShieldCheck size={13} color="#00f2fe" />,
        bg: 'rgba(13, 27, 42, 0.88)',
        border: '1.5px solid rgba(0, 242, 254, 0.6)',
        color: '#00f2fe',
        shadow: '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 16px rgba(0, 242, 254, 0.3)',
      };
    }
    if (user?.role === 'ADMIN') {
      return {
        label: 'CHẾ ĐỘ QUẢN TRỊ — ADMIN',
        icon: <Eye size={13} color="#c084fc" />,
        bg: 'rgba(13, 27, 42, 0.88)',
        border: '1.5px solid rgba(168, 85, 247, 0.6)',
        color: '#c084fc',
        shadow: '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 16px rgba(168, 85, 247, 0.3)',
      };
    }
    return {
      label: 'CHẾ ĐỘ ĐỒNG SỞ HỮU',
      icon: <Sparkles size={13} color="#10b981" />,
      bg: 'rgba(13, 27, 42, 0.88)',
      border: '1.5px solid rgba(16, 185, 129, 0.6)',
      color: '#34d399',
      shadow: '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 16px rgba(16, 185, 129, 0.3)',
    };
  }, [user?.role]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Pure 3D Virtual Garage World */}
      <EVShareWorld />

      {/* ======================================================== */}
      {/* STAFF & ADMIN OPERATIONS EXPERIENCE (REFERENCE-MATCHING) */}
      {/* ======================================================== */}
      {isOperationsRole ? (
        <>
          {/* A. Top Header: Branding on Left, Controls & Profile on Right */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '20px',
              right: '20px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 15,
              pointerEvents: 'none',
            }}
          >
            {/* Left: EVShare Brand & Operational System Title */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                pointerEvents: 'auto',
              }}
            >
              {/* Circular Cyan Logo */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.4), rgba(8, 16, 28, 0.95))',
                  border: '1.5px solid #00f2fe',
                  boxShadow: '0 0 16px rgba(0, 242, 254, 0.5), inset 0 0 8px rgba(0, 242, 254, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={20} color="#00f2fe" fill="#00f2fe" />
              </div>

              {/* Brand Typography */}
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  textShadow: '0 0 14px rgba(0, 242, 254, 0.4)',
                }}
              >
                EVShare
              </div>

              {/* Cyan Divider */}
              <div
                style={{
                  width: '1px',
                  height: '24px',
                  background: 'rgba(56, 189, 248, 0.4)',
                }}
              />

              {/* Garage Management Titles */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    color: '#f8fafc',
                    textTransform: 'uppercase',
                    lineHeight: '1.2',
                  }}
                >
                  HỆ THỐNG QUẢN LÝ GARAGE
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    lineHeight: '1.2',
                  }}
                >
                  VẬN HÀNH THÔNG MINH • DI CHUYỂN BỀN VỮNG
                </span>
              </div>
            </div>

            {/* Right: Operational Controls & User Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                pointerEvents: 'auto',
              }}
            >
              {/* Back to Vehicle in inspection/handover/sub-modes */}
              {showBackToVehicle && (
                <button
                  type="button"
                  onClick={handleBackToVehicle}
                  title="Quay lại xe điện"
                  style={{
                    background: 'rgba(13, 27, 42, 0.88)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(168, 85, 247, 0.6)',
                    borderRadius: '9999px',
                    padding: '6px 14px',
                    color: '#f3e8ff',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  <ArrowLeft size={12} color="#c084fc" />
                  <span>QUAY LẠI XE</span>
                </button>
              )}

              {/* Show Back to Garage Overview button when vehicle or zone is selected */}
              {showBackToGarageOverview && (
                <button
                  type="button"
                  onClick={() => clearSelection()}
                  title="Quay lại toàn cảnh garage"
                  style={{
                    background: 'rgba(13, 27, 42, 0.88)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(0, 242, 254, 0.5)',
                    borderRadius: '9999px',
                    padding: '6px 14px',
                    color: '#00f2fe',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  <RotateCcw size={12} color="#00f2fe" />
                  <span>TOÀN CẢNH</span>
                </button>
              )}

              {/* Role Mode Identity Badge */}
              <div
                style={{
                  background: modeBadge.bg,
                  backdropFilter: 'blur(16px)',
                  border: modeBadge.border,
                  boxShadow: modeBadge.shadow,
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: modeBadge.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textTransform: 'uppercase',
                }}
              >
                {modeBadge.icon}
                <span>{modeBadge.label}</span>
              </div>

              {/* User Pill */}
              <div
                style={{
                  background: 'rgba(13, 27, 42, 0.85)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Warehouse size={13} color="#38bdf8" />
                <span>{user?.fullName || 'EVShare Staff'}</span>
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.18)',
                    color: '#38bdf8',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {user?.role === 'STAFF'
                    ? 'NHÂN VIÊN'
                    : user?.role === 'ADMIN'
                    ? 'ADMIN'
                    : user?.role}
                </span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Đăng xuất khỏi Garage 3D"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '9999px',
                  padding: '6px 12px',
                  color: '#f87171',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                }}
              >
                <LogOut size={12} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

          {/* B. Left Fleet Sidebar */}
          <StaffGarageFleetSidebar />

          {/* C. Center Hero Vehicle Navigator (Chevrons & Status Pill) */}
          {heroVehicle && (
            <FleetHeroNavigator
              vehicles={vehicles}
              selectedVehicle={heroVehicle}
              onSelectVehicle={(v) => selectVehicle(v.id, user?.role)}
              visible={!showBackToVehicle}
            />
          )}

          {/* D. Right Selected Vehicle Operational Panel (Authoritative Screen-Space Shell) */}
          {heroVehicle && !vehicleDamageHistoryMode && !vehicleMaintenanceMode && !vehicleBatteryXrayMode && !vehicleChargingMode && (
            <StaffVehicleDetailPanel
              vehicle={heroVehicle}
              onClose={() => clearSelection()}
            />
          )}

          {/* Dedicated Phase 14 Screen-Space Damage History Panel */}
          {heroVehicle && vehicleDamageHistoryMode && (
            <DamageHistoryPanel
              vehicle={heroVehicle}
              onClose={returnToVehicleOverview}
            />
          )}

          {/* Dedicated Phase 15 Screen-Space Maintenance Management Panel */}
          {heroVehicle && vehicleMaintenanceMode && (
            <StaffMaintenancePanel
              vehicle={heroVehicle}
              onClose={returnToVehicleOverview}
            />
          )}

          {/* Dedicated Phase 16 Screen-Space Battery Health / X-Ray Panel */}
          {heroVehicle && vehicleBatteryXrayMode && (
            <BatteryHealthPanel
              vehicle={heroVehicle}
              onClose={returnToVehicleOverview}
            />
          )}

          {/* Dedicated Phase 17 Screen-Space Charging Panel */}
          {heroVehicle && vehicleChargingMode && (
            <ChargingPanel
              vehicle={heroVehicle}
              onClose={returnToVehicleOverview}
            />
          )}
        </>
      ) : (
        /* ======================================================== */
        /* CO_OWNER DEDICATED EXPERIENCE (COMPLETELY PRESERVED)     */
        /* ======================================================== */
        <>
          {/* Screen-space Utility Control: Top-Left [ ← QUAY LẠI XE ] in Co-ownership or Booking Mode */}
          {showBackToVehicle && (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '24px',
                zIndex: 30,
                pointerEvents: 'auto',
              }}
            >
              <button
                type="button"
                onClick={handleBackToVehicle}
                title="Quay lại xe điện"
                style={{
                  background: 'rgba(13, 27, 42, 0.88)',
                  backdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(168, 85, 247, 0.6)',
                  borderRadius: '9999px',
                  padding: '8px 18px',
                  color: '#f3e8ff',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 14px rgba(168, 85, 247, 0.25)',
                  transition: 'all 0.2s ease',
                }}
              >
                <ArrowLeft size={14} color="#c084fc" />
                <span>QUAY LẠI XE</span>
              </button>
            </div>
          )}

          {/* Screen-space Utility Control: Top-Left [ QUAY LẠI TOÀN CẢNH GARAGE ] */}
          {showBackToGarageOverview && (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '24px',
                zIndex: 30,
                pointerEvents: 'auto',
              }}
            >
              <button
                type="button"
                onClick={() => returnToGarageOverview()}
                title="Quay lại toàn cảnh garage"
                style={{
                  background: 'rgba(13, 27, 42, 0.88)',
                  backdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(0, 242, 254, 0.6)',
                  borderRadius: '9999px',
                  padding: '8px 18px',
                  color: '#00f2fe',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 14px rgba(0, 242, 254, 0.25)',
                  transition: 'all 0.2s ease',
                }}
              >
                <RotateCcw size={13} color="#00f2fe" />
                <span>QUAY LẠI TOÀN CẢNH GARAGE</span>
              </button>
            </div>
          )}

          {/* Empty Ownership State for CO_OWNER */}
          {!isOperationsRole && !isLoading && vehicles.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 15,
                background: 'rgba(13, 27, 42, 0.92)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                borderRadius: '16px',
                padding: '24px 32px',
                textAlign: 'center',
                color: '#94a3b8',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 242, 254, 0.2)',
                maxWidth: '420px',
              }}
            >
              <Car size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                CHƯA CÓ HỢP ĐỒNG ĐỒNG SỞ HỮU
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                Bạn chưa có hợp đồng đồng sở hữu đang hoạt động. Vui lòng liên hệ quản trị viên để tham gia nhóm xe.
              </p>
            </div>
          )}

          {/* Centered CO_OWNER Header Brand Block */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-family, sans-serif)',
              zIndex: 10,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {/* Glowing EV Logo + EVShare Title */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '26px',
                fontWeight: 900,
                letterSpacing: '0.03em',
                lineHeight: '1.1',
              }}
            >
              {/* Cyan Geometric EV Monogram */}
              <span
                style={{
                  color: '#00f2fe',
                  fontSize: '28px',
                  fontWeight: 950,
                  textShadow: '0 0 16px rgba(0, 242, 254, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                EV
              </span>
              <span
                style={{
                  color: '#ffffff',
                  textShadow: '0 2px 14px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 242, 254, 0.3)',
                }}
              >
                EVShare
              </span>
            </div>

            {/* Slogan Subtitle */}
            <div
              style={{
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.28em',
                color: '#94a3b8',
                textTransform: 'uppercase',
                marginTop: '4px',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
              }}
            >
              DRIVE A CLEANER TOMORROW
            </div>
          </div>

          {/* Co-Owner Screen-space User / Profile / Logout Utility Control */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 10,
              pointerEvents: 'auto',
            }}
          >
            {/* Role Mode Identity Badge */}
            <div
              style={{
                background: modeBadge.bg,
                backdropFilter: 'blur(16px)',
                border: modeBadge.border,
                boxShadow: modeBadge.shadow,
                borderRadius: '9999px',
                padding: '7px 16px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: modeBadge.color,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textTransform: 'uppercase',
              }}
            >
              {modeBadge.icon}
              <span>{modeBadge.label}</span>
            </div>

            <div
              style={{
                background: 'rgba(13, 27, 42, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '9999px',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Warehouse size={14} color="#38bdf8" />
              <span>{user?.fullName || 'Đồng sở hữu'}</span>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                ĐỒNG SỞ HỮU
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất khỏi Garage 3D"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '9999px',
                padding: '7px 14px',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              }}
            >
              <LogOut size={13} />
              Đăng xuất
            </button>
          </div>

          {/* Screen-Space Fixed CO_OWNER Part Inspection Panel */}
          {vehicleInspectionMode && <CoOwnerVehiclePartPanel />}

          {/* Dedicated Phase 14 Screen-Space Damage History Panel for CO_OWNER */}
          {vehicleDamageHistoryMode && currentCoOwnerVehicle && (
            <DamageHistoryPanel
              vehicle={currentCoOwnerVehicle}
              onClose={returnToVehicleOverview}
            />
          )}

          {/* Dedicated Phase 15 Screen-Space Maintenance History Panel for CO_OWNER */}
          {vehicleMaintenanceMode && currentCoOwnerVehicle && (
            <CoOwnerMaintenancePanel
              vehicle={currentCoOwnerVehicle}
              onClose={returnToVehicleOverview}
            />
          )}

          {/* Dedicated Screen-Space Fixed CO_OWNER Booking Detail Panel */}
          {vehicleBookingMode && (currentCoOwnerVehicle || vehicles[0]) && (
            <CoOwnerBookingPanel
              vehicle={currentCoOwnerVehicle || vehicles[0]}
              onClose={returnToVehicleOverview}
            />
          )}

          {/* Dedicated Phase 16 Screen-Space Battery Health / X-Ray Panel for CO_OWNER */}
          {vehicleBatteryXrayMode && (currentCoOwnerVehicle || vehicles[0]) && (
            <BatteryHealthPanel
              vehicle={currentCoOwnerVehicle || vehicles[0]}
              onClose={returnToVehicleOverview}
            />
          )}

          {/* Dedicated Phase 17 Screen-Space Charging Panel for CO_OWNER */}
          {vehicleChargingMode && (currentCoOwnerVehicle || vehicles[0]) && (
            <ChargingPanel
              vehicle={currentCoOwnerVehicle || vehicles[0]}
              onClose={returnToVehicleOverview}
            />
          )}
        </>
      )}
    </div>
  );
};

export default GarageScene;
