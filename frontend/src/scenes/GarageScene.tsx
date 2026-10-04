import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { EVShareWorld } from '../components/three/EVShareWorld';
import { useAuthStore } from '../store/authStore';
import { useWorldStore } from '../store/worldStore';
import { logoutApi } from '../services/authApi';
import { fetchVehicles } from '../services/vehicleApi';
import { VehicleResponse } from '../types/vehicle';
import { resolveVehicleCode, sortStaffFleetVehicles, resolveAuthoritativeHeroVehicle } from '../components/three/vehicles/vehicleModelConfig';
import {
  LogOut,
  Warehouse,
  Sparkles,
  RotateCcw,
  Car,
  Bell,
  ArrowLeft,
  ShieldCheck,
  Eye,
  Zap,
} from 'lucide-react';
import { StaffGarageFleetSidebar } from '../components/fleet/StaffGarageFleetSidebar';
import { StaffVehicleDetailPanel } from '../components/fleet/StaffVehicleDetailPanel';
import { PanelErrorBoundary } from '../components/common/PanelErrorBoundary';
import { FleetHeroNavigator } from '../components/fleet/FleetHeroNavigator';
import { CoOwnerVehiclePartPanel } from '../components/three/vehicles/CoOwnerVehiclePartPanel';
import { DamageHistoryPanel } from '../components/three/damage/DamageHistoryPanel';
import { CoOwnerBookingPanel } from '../components/three/booking/CoOwnerBookingPanel';
import { StaffMaintenancePanel } from '../components/three/maintenance/StaffMaintenancePanel';
import { CoOwnerMaintenancePanel } from '../components/three/maintenance/CoOwnerMaintenancePanel';
import { BatteryHealthPanel } from '../components/three/battery/BatteryHealthPanel';
import { ChargingPanel } from '../components/three/charging/ChargingPanel';
import { CoOwnerVehiclePanel } from '../components/three/vehicles/CoOwnerVehiclePanel';
import { CoOwnerQuickActionDock } from '../components/three/vehicles/CoOwnerQuickActionDock';
import { CoOwnerVehicleInfoPanel } from '../components/three/vehicles/CoOwnerVehicleInfoPanel';
import { MyBookingsPanel } from '../components/three/vehicles/MyBookingsPanel';
import { LobbyOwnershipSummaryBoard } from '../components/three/ownership/LobbyOwnershipSummaryBoard';
import { CoOwnerOwnershipPanel } from '../components/three/ownership/CoOwnerOwnershipPanel';
import { ZoneInfoPanel } from '../components/zones/ZoneInfoPanel';

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
  const vehicleMode = useWorldStore((state) => state.vehicleMode);
  const isVehicleSelected = useWorldStore((state) => state.isVehicleSelected);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const isVehicleDetailOpen = useWorldStore((state) => state.isVehicleDetailOpen);
  const closeVehicleDetail = useWorldStore((state) => state.closeVehicleDetail);
  const selectedZone = useWorldStore((state) => state.selectedZone);
  const activeFeature = useWorldStore((state) => state.activeFeature);
  const selectZone = useWorldStore((state) => state.selectZone);
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

  // Canonical sorted staff fleet for operations (Single Source of Truth)
  const sortedFleetVehicles = useMemo(() => {
    return isOperationsRole ? sortStaffFleetVehicles(vehicles) : vehicles;
  }, [vehicles, isOperationsRole]);

  // For operations role, derive authoritative foreground hero vehicle (Single Source of Truth)
  const heroVehicle = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return null;
    return resolveAuthoritativeHeroVehicle(vehicles, selectedVehicleId);
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
    if (selectedVehicleId) {
      const match = vehicles.find(
        (v) => v.id === selectedVehicleId || resolveVehicleCode(v) === selectedVehicleId
      );
      if (match) return match;
    }
    return vehicles[0];
  }, [vehicles, isOperationsRole, selectedVehicleId]);

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
  // For STAFF / ADMIN, auto-select hero vehicle on initial load using Single Source of Truth
  useEffect(() => {
    if (isOperationsRole && !initialOperationsSelectDone.current && vehicles.length > 0) {
      initialOperationsSelectDone.current = true;
      if (!selectedVehicleId) {
        const defaultVehicle = resolveAuthoritativeHeroVehicle(vehicles, null);
        if (defaultVehicle) {
          selectVehicle(defaultVehicle.id, user?.role);
        }
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
              vehicles={sortedFleetVehicles}
              selectedVehicle={heroVehicle}
              onSelectVehicle={(v) => selectVehicle(v.id, user?.role)}
              visible={!showBackToVehicle}
            />
          )}

          {/* D. Right Selected Vehicle Operational Panel (Authoritative Screen-Space Shell) */}
          <PanelErrorBoundary key={heroVehicle ? `${heroVehicle.id}-detail` : 'panel'}>
            {heroVehicle && (isVehicleDetailOpen || vehicleInspectionMode || vehicleDamageMappingMode || vehicleHandoverMode) && !vehicleDamageHistoryMode && !vehicleMaintenanceMode && !vehicleBatteryXrayMode && !vehicleChargingMode && (
              <StaffVehicleDetailPanel
                vehicle={heroVehicle}
                onClose={() => closeVehicleDetail()}
              />
            )}
          </PanelErrorBoundary>

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
        <div
          id="co-owner-hud-overlay-root"
          className="co-owner-hud-overlay-root"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 20,
            transform: 'scale(var(--ui-scale, 1))',
            transformOrigin: 'top left',
            width: 'calc(100% / var(--ui-scale, 1))',
            height: 'calc(100% / var(--ui-scale, 1))',
          }}
        >
          {/* A. Unified Top Header: Branding on Left, Return Navigation Controls, User Profile & Logout on Right */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '24px',
              right: '24px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 30,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {/* Left: EVShare Brand Block */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                fontFamily: 'var(--font-family, sans-serif)',
                pointerEvents: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '24px',
                  fontWeight: 950,
                  lineHeight: '1.1',
                }}
              >
                <span
                  style={{
                    color: '#22e6ff',
                    textShadow: '0 0 16px rgba(34, 230, 255, 0.8)',
                  }}
                >
                  EV
                </span>
                <span
                  style={{
                    color: '#ffffff',
                    textShadow: '0 2px 14px rgba(0, 0, 0, 0.6), 0 0 20px rgba(34, 230, 255, 0.2)',
                  }}
                >
                  EVShare
                </span>
              </div>
              <div
                style={{
                  fontSize: '8.5px',
                  fontWeight: 800,
                  letterSpacing: '0.24em',
                  color: '#9bb3c9',
                  textTransform: 'uppercase',
                  marginTop: '3px',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
                }}
              >
                DRIVE A CLEANER TOMORROW
              </div>
            </div>

            {/* Right: Return Navigation & User Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                pointerEvents: 'auto',
              }}
            >
              {/* Back to Vehicle button (when inside a business submode) */}
              {showBackToVehicle && (
                <button
                  type="button"
                  onClick={handleBackToVehicle}
                  title="Quay lại xe điện"
                  style={{
                    background: 'rgba(13, 27, 42, 0.90)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(168, 85, 247, 0.6)',
                    borderRadius: '9999px',
                    padding: '7px 16px',
                    color: '#f3e8ff',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 14px rgba(168, 85, 247, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ArrowLeft size={13} color="#c084fc" />
                  <span>QUAY LẠI XE</span>
                </button>
              )}

              {/* Back to Garage Overview button (shown for operations roles) */}
              {!isCoOwner && showBackToGarageOverview && (
                <button
                  type="button"
                  onClick={() => returnToGarageOverview()}
                  title="Quay lại toàn cảnh garage"
                  style={{
                    background: 'rgba(7, 20, 38, 0.90)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(34, 230, 255, 0.5)',
                    borderRadius: '9999px',
                    padding: '7px 16px',
                    color: '#22e6ff',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 14px rgba(34, 230, 255, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <RotateCcw size={13} color="#22e6ff" />
                  <span>QUAY LẠI TOÀN CẢNH GARAGE</span>
                </button>
              )}

              {/* Compact Ownership Summary Strip for CO_OWNER */}
              {isCoOwner && (
                <PanelErrorBoundary key="topbar-ownership-summary">
                  <LobbyOwnershipSummaryBoard
                    vehicle={currentCoOwnerVehicle || vehicles[0] || null}
                  />
                </PanelErrorBoundary>
              )}

              {/* Role Mode Identity Badge (Glowing Teal) */}
              <div
                style={{
                  background: 'rgba(7, 20, 38, 0.90)',
                  backdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(0, 224, 199, 0.55)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 16px rgba(0, 224, 199, 0.25)',
                  borderRadius: '9999px',
                  padding: '6px 15px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: '#00e0c7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textTransform: 'uppercase',
                }}
              >
                <Sparkles size={13} color="#00e0c7" />
                <span>CHẾ ĐỘ ĐỒNG SỞ HỮU</span>
              </div>

              {/* User Profile Badge */}
              <div
                style={{
                  background: 'rgba(7, 20, 38, 0.85)',
                  backdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(34, 230, 255, 0.3)',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                }}
              >
                <Warehouse size={13} color="#22e6ff" />
                <span>{user?.fullName || 'Nguyen Van A'}</span>
                <span
                  style={{
                    background: 'rgba(0, 224, 199, 0.2)',
                    color: '#00e0c7',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    letterSpacing: '0.04em',
                  }}
                >
                  ĐỒNG SỞ HỮU
                </span>
              </div>

              {/* Notification Bell Icon */}
              <div
                title="Thông báo"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(7, 20, 38, 0.85)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(34, 230, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                }}
              >
                <Bell size={14} color="#9bb3c9" />
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Đăng xuất khỏi Garage 3D"
                style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1.5px solid rgba(239, 68, 68, 0.45)',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  color: '#ff5e6c',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.32)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                }}
              >
                <LogOut size={13} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

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



          {/* Screen-Space Fixed CO_OWNER Part Inspection Panel */}
          {vehicleInspectionMode && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-part-inspection`}>
              <CoOwnerVehiclePartPanel />
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 14 Screen-Space Damage History Panel for CO_OWNER */}
          {vehicleDamageHistoryMode && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-damage-history`}>
              <DamageHistoryPanel
                vehicle={currentCoOwnerVehicle || vehicles[0]}
                onClose={returnToVehicleOverview}
              />
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 15 Screen-Space Maintenance History Panel for CO_OWNER */}
          {vehicleMaintenanceMode && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-maintenance`}>
              <CoOwnerMaintenancePanel
                vehicle={currentCoOwnerVehicle || vehicles[0]}
                onClose={returnToVehicleOverview}
              />
            </PanelErrorBoundary>
          )}

          {/* Dedicated Screen-Space Fixed CO_OWNER Booking Detail Panel */}
          {vehicleBookingMode && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-booking`}>
              <CoOwnerBookingPanel
                vehicle={currentCoOwnerVehicle || vehicles[0]}
                onClose={returnToVehicleOverview}
              />
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 16 Screen-Space Battery Health / X-Ray Panel for CO_OWNER */}
          {vehicleBatteryXrayMode && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-battery-xray`}>
              <BatteryHealthPanel
                vehicle={currentCoOwnerVehicle || vehicles[0]}
                onClose={returnToVehicleOverview}
              />
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 17 Screen-Space Charging Panel for CO_OWNER (only during vehicle-focused charging, never during showroom zone modes) */}
          {!selectedZone && activeFeature === 'NONE' && vehicleChargingMode && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-charging`}>
              <ChargingPanel
                vehicle={currentCoOwnerVehicle || vehicles[0]}
                onClose={returnToVehicleOverview}
              />
            </PanelErrorBoundary>
          )}

          {/* Authoritative Redesigned Showroom Zone Info Panel (e.g. Finance) for CO_OWNER */}
          {isCoOwner && selectedZone && selectedZone !== 'VEHICLE' && !showBackToVehicle && (
            <PanelErrorBoundary key={`zone-info-${selectedZone}`}>
              <ZoneInfoPanel onClose={() => clearSelection()} />
            </PanelErrorBoundary>
          )}

          {/* Dedicated Unified Screen-Space Co-Ownership Panel for CO_OWNER */}
          {vehicleCoOwnershipMode && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0]).id}-co-ownership-detail`}>
              <CoOwnerOwnershipPanel
                vehicle={currentCoOwnerVehicle || vehicles[0]}
                onClose={returnToVehicleOverview}
              />
            </PanelErrorBoundary>
          )}

          {/* Dedicated Screen-Space Fixed CO_OWNER Technical Specs Modal */}
          {currentCoOwnerVehicle && vehicleFeatureMode === 'CO_OWNER_VEHICLE_INFO' && (
            <PanelErrorBoundary key={`${currentCoOwnerVehicle.id}-tech-info`}>
              <div
                style={{
                  position: 'fixed',
                  top: '76px',
                  right: '24px',
                  zIndex: 40,
                  pointerEvents: 'auto',
                }}
              >
                <CoOwnerVehicleInfoPanel
                  vehicle={currentCoOwnerVehicle}
                  onClose={returnToVehicleOverview}
                />
              </div>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Screen-Space Fixed CO_OWNER My Bookings Panel */}
          {currentCoOwnerVehicle && vehicleFeatureMode === 'CO_OWNER_MY_BOOKINGS' && (
            <PanelErrorBoundary key={`${currentCoOwnerVehicle.id}-my-bookings`}>
              <div
                style={{
                  position: 'fixed',
                  top: '76px',
                  right: '24px',
                  zIndex: 40,
                  pointerEvents: 'auto',
                }}
              >
                <MyBookingsPanel
                  vehicle={currentCoOwnerVehicle}
                  onClose={returnToVehicleOverview}
                />
              </div>
            </PanelErrorBoundary>
          )}

          {/* Authoritative Screen-Space CO_OWNER Right Vehicle Information Panel */}
          {currentCoOwnerVehicle && isVehicleDetailOpen && !showBackToVehicle && (!selectedZone || selectedZone === 'VEHICLE') && (
            <PanelErrorBoundary key={`${currentCoOwnerVehicle.id}-co-owner-overview`}>
              <CoOwnerVehiclePanel
                vehicle={currentCoOwnerVehicle}
                onClose={() => returnToGarageOverview()}
              />
            </PanelErrorBoundary>
          )}

          {/* Authoritative Screen-Space CO_OWNER Bottom Quick Action Dock */}
          {currentCoOwnerVehicle && isVehicleDetailOpen && !showBackToVehicle && (!selectedZone || selectedZone === 'VEHICLE') && (
            <CoOwnerQuickActionDock
              vehicle={currentCoOwnerVehicle}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default GarageScene;
