import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { EVShareWorld } from '../components/three/EVShareWorld';
import { useAuthStore } from '../store/authStore';
import { useWorldStore } from '../store/worldStore';
import { logoutApi } from '../services/authApi';
import { fetchVehicles } from '../services/vehicleApi';
import { VehicleResponse } from '../types/vehicle';
import {
  resolveVehicleCode,
  resolveVehicleDisplayName,
  sortStaffFleetVehicles,
  resolveAuthoritativeHeroVehicle,
} from '../components/three/vehicles/vehicleModelConfig';
import {
  LogOut,
  Warehouse,
  Sparkles,
  RotateCcw,
  Car,
  Bell,
  ArrowLeft,
  Shield,
  ShieldCheck,
  Eye,
  Zap,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { StaffGarageFleetSidebar } from '../components/fleet/StaffGarageFleetSidebar';
import { PanelErrorBoundary } from '../components/common/PanelErrorBoundary';
import { EVCarLoader } from '../components/common/EVCarLoader';
import { NotificationBell } from '../components/common/NotificationBell';
import { StandardToastContainer } from '../components/common/StandardToast';
import { FleetHeroNavigator } from '../components/fleet/FleetHeroNavigator';
import { CoOwnerOperationalCarousel } from '../components/coowner/CoOwnerOperationalCarousel';
import { LobbyOwnershipSummaryBoard } from '../components/three/ownership/LobbyOwnershipSummaryBoard';
import { AdminCommandCenterPanels } from '../components/admin/AdminCommandCenterPanels';
import { AdminVehicleSelectionGallery } from '../components/admin/AdminVehicleSelectionGallery';
import { StaffOperationalCarousel } from '../components/staff/StaffOperationalCarousel';

// Code-split heavy business panels (loaded on-demand when active panel opens)
const StaffVehicleDetailPanel = React.lazy(() =>
  import('../components/fleet/StaffVehicleDetailPanel').then((m) => ({ default: m.StaffVehicleDetailPanel }))
);
const StaffRegistrationReviewModal = React.lazy(() =>
  import('../components/fleet/StaffRegistrationReviewModal').then((m) => ({ default: m.StaffRegistrationReviewModal }))
);
const StaffPaymentVerificationModal = React.lazy(() =>
  import('../components/fleet/StaffPaymentVerificationModal').then((m) => ({ default: m.StaffPaymentVerificationModal }))
);
const StaffMaintenancePanel = React.lazy(() =>
  import('../components/three/maintenance/StaffMaintenancePanel').then((m) => ({ default: m.StaffMaintenancePanel }))
);
const DamageHistoryPanel = React.lazy(() =>
  import('../components/three/damage/DamageHistoryPanel').then((m) => ({ default: m.DamageHistoryPanel }))
);
const DamageDetailModal = React.lazy(() =>
  import('../components/three/damage/DamageDetailModal').then((m) => ({ default: m.DamageDetailModal }))
);
const BatteryHealthPanel = React.lazy(() =>
  import('../components/three/battery/BatteryHealthPanel').then((m) => ({ default: m.BatteryHealthPanel }))
);
const ChargingPanel = React.lazy(() =>
  import('../components/three/charging/ChargingPanel').then((m) => ({ default: m.ChargingPanel }))
);
const CoOwnerVehiclePartPanel = React.lazy(() =>
  import('../components/three/vehicles/CoOwnerVehiclePartPanel').then((m) => ({ default: m.CoOwnerVehiclePartPanel }))
);
const CoOwnerBookingPanel = React.lazy(() =>
  import('../components/three/booking/CoOwnerBookingPanel').then((m) => ({ default: m.CoOwnerBookingPanel }))
);
const CoOwnerMaintenancePanel = React.lazy(() =>
  import('../components/three/maintenance/CoOwnerMaintenancePanel').then((m) => ({ default: m.CoOwnerMaintenancePanel }))
);
const CoOwnerVotingPanel = React.lazy(() =>
  import('../components/three/voting/CoOwnerVotingPanel').then((m) => ({ default: m.CoOwnerVotingPanel }))
);
const CoOwnerVehiclePanel = React.lazy(() =>
  import('../components/three/vehicles/CoOwnerVehiclePanel').then((m) => ({ default: m.CoOwnerVehiclePanel }))
);
const CoOwnerVehicleInfoPanel = React.lazy(() =>
  import('../components/three/vehicles/CoOwnerVehicleInfoPanel').then((m) => ({ default: m.CoOwnerVehicleInfoPanel }))
);
const MyBookingsPanel = React.lazy(() =>
  import('../components/three/vehicles/MyBookingsPanel').then((m) => ({ default: m.MyBookingsPanel }))
);
const CoOwnerOwnershipPanel = React.lazy(() =>
  import('../components/three/ownership/CoOwnerOwnershipPanel').then((m) => ({ default: m.CoOwnerOwnershipPanel }))
);
const CoOwnerContractPanel = React.lazy(() =>
  import('../components/three/contracts/CoOwnerContractPanel').then((m) => ({ default: m.CoOwnerContractPanel }))
);
const ZoneInfoPanel = React.lazy(() =>
  import('../components/zones/ZoneInfoPanel').then((m) => ({ default: m.ZoneInfoPanel }))
);
const FinanceZonePanel = React.lazy(() =>
  import('../components/zones/FinanceZonePanel').then((m) => ({ default: m.FinanceZonePanel }))
);
const ActiveTripDetailPanel = React.lazy(() =>
  import('../components/three/trip/ActiveTripDetailPanel').then((m) => ({ default: m.ActiveTripDetailPanel }))
);
const CoOwnerHandoverReviewPanel = React.lazy(() =>
  import('../components/three/handover/CoOwnerHandoverReviewPanel').then((m) => ({ default: m.CoOwnerHandoverReviewPanel }))
);
const CoOwnerTripStartPanel = React.lazy(() =>
  import('../components/three/trip/CoOwnerTripStartPanel').then((m) => ({ default: m.CoOwnerTripStartPanel }))
);
const AnalyticsPanel = React.lazy(() =>
  import('../components/three/analytics/AnalyticsPanel').then((m) => ({ default: m.AnalyticsPanel }))
);
const CoOwnerDisputePanel = React.lazy(() =>
  import('../components/three/dispute/CoOwnerDisputePanel').then((m) => ({ default: m.CoOwnerDisputePanel }))
);
const StaffDisputeDashboardModal = React.lazy(() =>
  import('../components/three/dispute/StaffDisputeDashboardModal').then((m) => ({ default: m.StaffDisputeDashboardModal }))
);
const AiZonePanel = React.lazy(() =>
  import('../components/zones/AiZonePanel').then((m) => ({ default: m.AiZonePanel }))
);
const TripExtensionNegotiationModal = React.lazy(() =>
  import('../components/three/trip/TripExtensionNegotiationModal').then((m) => ({ default: m.TripExtensionNegotiationModal }))
);
const AdminManagementModal = React.lazy(() =>
  import('../components/admin/AdminManagementModal').then((m) => ({ default: m.AdminManagementModal }))
);

const PanelLoadingFallback: React.FC<{ title?: string }> = ({ title = 'ĐANG TẢI DỮ LIỆU...' }) => (
  <aside
    role="complementary"
    aria-label="Panel Loading"
    style={{
      position: 'fixed',
      top: '76px',
      right: '20px',
      bottom: '20px',
      width: 'clamp(440px, 28vw, 495px)',
      maxWidth: 'min(495px, calc(100vw - 32px))',
      maxHeight: 'calc(100vh - 96px)',
      background: 'rgba(7, 20, 38, 0.94)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1.5px solid rgba(0, 242, 254, 0.3)',
      borderRadius: '20px',
      zIndex: 45,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(0, 242, 254, 0.16)',
    }}
  >
    <EVCarLoader variant="panel" message={title} />
  </aside>
);

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
  const exitStaffInspection = useWorldStore((state) => state.exitStaffInspection);
  const selectedZone = useWorldStore((state) => state.selectedZone);
  const activeFeature = useWorldStore((state) => state.activeFeature);
  const selectZone = useWorldStore((state) => state.selectZone);
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const returnToGarageOverview = useWorldStore((state) => state.returnToGarageOverview);
  const selectVehicle = useWorldStore((state) => state.selectVehicle);
  const setVisibleVehicleLabelId = useWorldStore((state) => state.setVisibleVehicleLabelId);
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
  const isExplorationMode = useWorldStore((state) => state.isExplorationMode);
  const exitCoOwnerExplorationMode = useWorldStore((state) => state.exitCoOwnerExplorationMode);
  const isDamageDetailModalOpen = useWorldStore((state) => state.isDamageDetailModalOpen);
  const activePrimaryPanel = useWorldStore((state) => state.activePrimaryPanel);
  const closeGaragePanel = useWorldStore((state) => state.closeGaragePanel);
  const vehicleBatteryXrayMode = useWorldStore((state) => state.vehicleBatteryXrayMode);
  const vehicleChargingMode = useWorldStore((state) => state.vehicleChargingMode);
  const exitChargingMode = useWorldStore((state) => state.exitChargingMode);
  const vehicleVotingMode = useWorldStore((state) => state.vehicleVotingMode);
  const exitVehicleVotingMode = useWorldStore((state) => state.exitVehicleVotingMode);
  const closeVotingPanel = useWorldStore((state) => state.closeVotingPanel);
  const selectedVehiclePartId = useWorldStore((state) => state.selectedVehiclePartId);
  const selectedVehiclePartCode = useWorldStore((state) => state.selectedVehiclePartCode);
  const clearVehiclePartSelection = useWorldStore((state) => state.clearVehiclePartSelection);
  const isRegistrationReviewModalOpen = useWorldStore((state) => state.isRegistrationReviewModalOpen);
  const setRegistrationReviewModalOpen = useWorldStore((state) => state.setRegistrationReviewModalOpen);
  const isPaymentVerificationModalOpen = useWorldStore((state) => state.isPaymentVerificationModalOpen);
  const setPaymentVerificationModalOpen = useWorldStore((state) => state.setPaymentVerificationModalOpen);
  const isStaffDisputeDashboardOpen = useWorldStore((state) => state.isStaffDisputeDashboardOpen);
  const setStaffDisputeDashboardOpen = useWorldStore((state) => state.setStaffDisputeDashboardOpen);
  const closeDisputePanel = useWorldStore((state) => state.closeDisputePanel);
  const pendingExtensionRequestId = useWorldStore((state) => state.pendingExtensionRequestId);
  const closeExtensionNegotiationModal = useWorldStore((state) => state.closeExtensionNegotiationModal);
  const isAdminManagementModalOpen = useWorldStore((state) => state.isAdminManagementModalOpen);
  const setAdminManagementModalOpen = useWorldStore((state) => state.setAdminManagementModalOpen);
  const adminActiveModule = useWorldStore((state) => state.adminActiveModule);
  const setAdminActiveModule = useWorldStore((state) => state.setAdminActiveModule);
  const isAdminVehicleGalleryOpen = useWorldStore((state) => state.isAdminVehicleGalleryOpen);
  const activeStaffOperationModule = useWorldStore((state) => state.activeStaffOperationModule);
  const isStaffOperationsCarouselOpen = useWorldStore((state) => state.isStaffOperationsCarouselOpen);
  const isCoOwnerOperationsCarouselOpen = useWorldStore((state) => state.isCoOwnerOperationsCarouselOpen);
  const closeStaffOperations = useWorldStore((state) => state.closeStaffOperations);
  const closeCoOwnerOperations = useWorldStore((state) => state.closeCoOwnerOperations);

  // Authoritative TanStack Query for vehicles (scoped per role and user)
  const {
    data: vehicles = [],
    isLoading,
    isFetching,
    isError: isVehiclesError,
    refetch: refetchVehicles,
    error: vehiclesError,
  } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
    enabled: authReady,
    staleTime: 4000,
    refetchInterval: 4000,
    refetchOnWindowFocus: true,
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
  // Phase 25: Multi-vehicle support enabled for co-owners
  const currentCoOwnerVehicle = useMemo(() => {
    if (isOperationsRole || !vehicles || vehicles.length === 0) return null;
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

  // Phase 25: Onboarding auto-routing if co-owner user has no active vehicle groups
  // CRITICAL: Guard with !isVehiclesError to prevent false redirection when backend is starting or connection fails
  useEffect(() => {
    if (!isLoading && !isFetching && !isVehiclesError && authReady && isCoOwner && vehicles.length === 0) {
      navigate('/onboarding', { replace: true });
    }
  }, [isLoading, isFetching, isVehiclesError, authReady, isCoOwner, vehicles.length, navigate]);

  // Stale selectedVehicleId Validation & Purge for CO_OWNER:
  // - If no active vehicle: clear selectedVehicleId / ownership context
  // - If selectedVehicleId is set but no longer matches any vehicle: clearSelection()
  // NOTE: When selectedVehicleId is null, CO_OWNER is in Garage Overview mode.
  // Do NOT force-select vehicles[0], which would trigger VEHICLE_WITH_RIGHT_PANEL zoom.
  useEffect(() => {
    if (!isOperationsRole) {
      if (vehicles.length === 0) {
        if (selectedVehicleId) {
          clearSelection();
        }
      } else if (selectedVehicleId) {
        const hasMatch = vehicles.some(
          (v) => v.id === selectedVehicleId || resolveVehicleCode(v) === selectedVehicleId
        );
        if (!hasMatch) {
          clearSelection();
        }
      }
    }
  }, [isOperationsRole, vehicles, selectedVehicleId, clearSelection]);

  // Ensure stale selected part state does not survive when no vehicle is selected
  useEffect(() => {
    if (!selectedVehicleId && !vehicleInspectionMode && !vehicleDamageMappingMode && !vehicleDamageHistoryMode) {
      if (selectedVehiclePartId || selectedVehiclePartCode) {
        clearVehiclePartSelection();
      }
    }
  }, [selectedVehicleId, vehicleInspectionMode, vehicleDamageMappingMode, vehicleDamageHistoryMode, selectedVehiclePartId, selectedVehiclePartCode, clearVehiclePartSelection]);

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
            className="garage-top-header"
            style={{
              position: 'absolute',
              top: '16px',
              left: '20px',
              right: '20px',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
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
                flexShrink: 0,
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
                className="garage-brand-divider"
                style={{
                  width: '1px',
                  height: '24px',
                  background: 'rgba(56, 189, 248, 0.4)',
                }}
              />

              {/* Garage Management Titles */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  className="garage-brand-title"
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
                  className="garage-brand-subtitle"
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
                flexShrink: 0,
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
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
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <ArrowLeft size={12} color="#c084fc" />
                  <span>{vehicleInspectionMode ? 'QUAY LẠI TRUNG TÂM' : 'QUAY LẠI XE'}</span>
                </button>
              )}

              {/* Show Back to Garage Overview button when vehicle or zone is selected (Co-Owner view only; removed for Staff per Section 1) */}
              {showBackToGarageOverview && !isOperationsRole && (
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
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
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
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
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
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                <Warehouse size={13} color="#38bdf8" />
                <span className="garage-user-name">{user?.fullName || 'EVShare Staff'}</span>
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

              {/* Notification Bell */}
              <NotificationBell />

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

          {/* Dedicated Phase 3: Immersive 3D Admin Command Center Panels */}
          {isAdmin && <AdminCommandCenterPanels selectedVehicle={heroVehicle} />}

          {/* Dedicated Phase 3: Bottom Floating Vehicle Selection Carousel (Shared by Admin & Staff) */}
          {(isAdmin || user?.role === 'STAFF') && (
            <AdminVehicleSelectionGallery
              vehicles={sortedFleetVehicles}
              selectedVehicle={heroVehicle}
            />
          )}

          {/* Dedicated Phase 3: Bottom Floating 8-Function Operational Carousel for STAFF (Contextual) */}
          {user?.role === 'STAFF' &&
            !isAdminVehicleGalleryOpen &&
            (isStaffOperationsCarouselOpen || activeStaffOperationModule) && (
              <StaffOperationalCarousel />
            )}

          {/* D. Right Selected Vehicle Operational Panel (Authoritative Screen-Space Shell for Staff) */}
          <PanelErrorBoundary key={heroVehicle ? `${heroVehicle.id}-detail` : 'panel'}>
            {heroVehicle && !isAdmin && activePrimaryPanel !== 'NOTIFICATIONS' && (
              // For STAFF, only open when an actual operational module is actively selected or in inspection/handover mode
              (user?.role === 'STAFF' ? Boolean(activeStaffOperationModule || vehicleInspectionMode || vehicleDamageMappingMode || vehicleHandoverMode) : isVehicleDetailOpen)
            ) && !vehicleDamageHistoryMode && !vehicleMaintenanceMode && !vehicleBatteryXrayMode && !vehicleChargingMode && (
                <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI THÔNG TIN VẬN HÀNH..." />}>
                  <StaffVehicleDetailPanel
                    vehicle={heroVehicle}
                    onClose={() => {
                      exitStaffInspection();
                      closeVehicleDetail();
                      useWorldStore.getState().setActiveStaffOperationModule(null);
                      useWorldStore.getState().setStaffOperationsCarouselOpen(true);
                    }}
                  />
                </React.Suspense>
              )}
          </PanelErrorBoundary>

          {/* Dedicated Phase 14 Screen-Space Damage History Panel */}
          {heroVehicle && !isAdmin && vehicleDamageHistoryMode && (
            <PanelErrorBoundary key={`${heroVehicle.id}-damage-history`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI HỒ SƠ HƯ HỎNG..." />}>
                <DamageHistoryPanel
                  vehicle={heroVehicle}
                  onClose={returnToVehicleOverview}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 15 Screen-Space Maintenance Management Panel */}
          {heroVehicle && !isAdmin && vehicleMaintenanceMode && (
            <PanelErrorBoundary key={`${heroVehicle.id}-maintenance-mgmt`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI QUẢN LÝ BẢO DƯỠNG..." />}>
                <StaffMaintenancePanel
                  vehicle={heroVehicle}
                  onClose={returnToVehicleOverview}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 16 Screen-Space Battery Health / X-Ray Panel */}
          {heroVehicle && !isAdmin && vehicleBatteryXrayMode && (
            <PanelErrorBoundary key={`${heroVehicle.id}-battery-xray`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI CHỈ SỐ PIN 3D..." />}>
                <BatteryHealthPanel
                  vehicle={heroVehicle}
                  onClose={returnToVehicleOverview}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 17 Screen-Space Charging Panel */}
          {(heroVehicle || vehicles[0]) && !isAdmin && (vehicleChargingMode || activePrimaryPanel === 'CHARGING' || selectedZone === 'CHARGING') && (
            <PanelErrorBoundary key={`${(heroVehicle || vehicles[0]).id}-charging`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI QUẢN LÝ SẠC..." />}>
                <ChargingPanel
                  vehicle={heroVehicle || vehicles[0]}
                  onClose={() => {
                    closeGaragePanel('CHARGING');
                    exitChargingMode();
                  }}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Authoritative Staff Vehicle Registration Review Modal Layer (outside Canvas and sidebars) */}
          <React.Suspense fallback={null}>
            <StaffRegistrationReviewModal
              isOpen={isRegistrationReviewModalOpen}
              onClose={() => setRegistrationReviewModalOpen(false)}
              onReviewed={() => {
                queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                queryClient.invalidateQueries({ queryKey: ['staffPendingApplications'] });
              }}
            />
          </React.Suspense>

          {/* Authoritative Staff Payment Verification Modal Layer (Fallback only for non-staff; STAFF uses unified right operational panel) */}
          {user?.role !== 'STAFF' && (
            <React.Suspense fallback={null}>
              <StaffPaymentVerificationModal
                isOpen={isPaymentVerificationModalOpen}
                onClose={() => setPaymentVerificationModalOpen(false)}
                initialVehicleId={heroVehicle?.id}
              />
            </React.Suspense>
          )}

          {/* Authoritative Admin Management Modal Layer (ADMIN only) */}
          {isAdmin && (
            <React.Suspense fallback={null}>
              <AdminManagementModal
                isOpen={isAdminManagementModalOpen}
                onClose={() => setAdminManagementModalOpen(false)}
              />
            </React.Suspense>
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
            className="garage-top-header"
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
                className="garage-brand-subtitle"
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

              {/* Multi-Vehicle Selector for CO_OWNER */}
              {isCoOwner && vehicles.length > 1 && (
                <div style={{ position: 'relative' }}>
                  <select
                    value={currentCoOwnerVehicle?.id || vehicles[0]?.id}
                    onChange={(e) => {
                      selectVehicle(e.target.value, user?.role);
                    }}
                    style={{
                      background: 'rgba(7, 20, 38, 0.90)',
                      backdropFilter: 'blur(16px)',
                      border: '1.5px solid rgba(0, 242, 254, 0.6)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 16px rgba(0, 242, 254, 0.25)',
                      borderRadius: '9999px',
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#00f2fe',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id} style={{ background: '#0a1628', color: '#fff' }}>
                        🚗 {resolveVehicleDisplayName(v)} ({v.licensePlate || resolveVehicleCode(v)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Onboarding / Add Vehicle link - only shown when user has no active vehicle groups */}
              {isCoOwner && vehicles.length === 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/onboarding')}
                  title="Thêm xe mới hoặc khám phá nhóm khác"
                  style={{
                    background: 'rgba(7, 20, 38, 0.90)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(34, 230, 255, 0.4)',
                    borderRadius: '9999px',
                    padding: '6px 14px',
                    color: '#38bdf8',
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
                  <span>+ THÊM XE / TÌM NHÓM</span>
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
                <span className="garage-user-name">{user?.fullName || 'Nguyen Van A'}</span>
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

              {/* Notification Bell */}
              <NotificationBell />

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

          {/* Connection / Backend Error State for Fleet Vehicles */}
          {isVehiclesError && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 15,
                background: 'rgba(13, 27, 42, 0.94)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '16px',
                padding: '24px 32px',
                textAlign: 'center',
                color: '#94a3b8',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.65), 0 0 20px rgba(239, 68, 68, 0.2)',
                maxWidth: '420px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: '#ef4444',
                }}
              >
                <AlertTriangle size={26} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
                Không thể kết nối máy chủ. Vui lòng thử lại.
              </h3>
              <p style={{ fontSize: '12.5px', lineHeight: '1.5', margin: '0 0 16px', color: '#cbd5e1' }}>
                {vehiclesError instanceof Error && vehiclesError.message
                  ? vehiclesError.message
                  : 'Không thể kết nối đến máy chủ backend để tải danh sách xe. Vui lòng kiểm tra dịch vụ máy chủ.'}
              </p>
              <button
                type="button"
                onClick={() => refetchVehicles()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 20px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, rgba(34, 230, 255, 0.2), rgba(0, 114, 255, 0.25))',
                  border: '1.2px solid #22e6ff',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 0 14px rgba(34, 230, 255, 0.25)',
                }}
              >
                <RefreshCw size={14} className={isLoading || isFetching ? 'animate-spin' : ''} />
                <span>Thử lại</span>
              </button>
            </div>
          )}

          {/* Genuine Empty Ownership State for CO_OWNER (only when request succeeded with 0 vehicles) */}
          {!isOperationsRole && !isLoading && !isVehiclesError && vehicles.length === 0 && (
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
          {!isOperationsRole && isCoOwner && vehicleInspectionMode && !isDamageDetailModalOpen && activePrimaryPanel === 'NONE' && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-part-inspection`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI KHẢO SÁT BỘ PHẬN..." />}>
                <CoOwnerVehiclePartPanel />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 14 Screen-Space Damage History Panel for CO_OWNER */}
          {activePrimaryPanel === 'DAMAGE' && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-damage-history`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI HỒ SƠ HƯ HỎNG..." />}>
                <DamageHistoryPanel
                  vehicle={currentCoOwnerVehicle || vehicles[0]}
                  onClose={() => closeGaragePanel('DAMAGE')}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 15 Screen-Space Maintenance History Panel for CO_OWNER */}
          {activePrimaryPanel === 'MAINTENANCE' && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-maintenance`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI QUẢN LÝ BẢO DƯỠNG..." />}>
                <CoOwnerMaintenancePanel
                  vehicle={currentCoOwnerVehicle || vehicles[0]}
                  onClose={() => closeGaragePanel('MAINTENANCE')}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Screen-Space Fixed CO_OWNER Booking Detail Panel */}
          {activePrimaryPanel === 'BOOKING' && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-booking`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI ĐẶT LỊCH SỬ DỤNG XE..." />}>
                <CoOwnerBookingPanel
                  vehicle={currentCoOwnerVehicle || vehicles[0]}
                  onClose={() => closeGaragePanel('BOOKING')}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 16 Screen-Space Battery Health / X-Ray Panel for CO_OWNER */}
          {activePrimaryPanel === 'BATTERY_XRAY' && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-battery-xray`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI CHỈ SỐ PIN 3D..." />}>
                <BatteryHealthPanel
                  vehicle={currentCoOwnerVehicle || vehicles[0]}
                  onClose={() => closeGaragePanel('BATTERY_XRAY')}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 17 Screen-Space Charging Panel for CO_OWNER */}
          {(activePrimaryPanel === 'CHARGING' || selectedZone === 'CHARGING' || vehicleChargingMode) && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-charging`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI QUẢN LÝ SẠC..." />}>
                <ChargingPanel
                  vehicle={currentCoOwnerVehicle || vehicles[0]}
                  onClose={() => {
                    closeGaragePanel('CHARGING');
                    clearSelection();
                  }}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 21 Screen-Space Voting Panel for CO_OWNER */}
          {activePrimaryPanel === 'VOTING' && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-voting`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI BIỂU QUYẾT NHÓM..." />}>
                <CoOwnerVotingPanel
                  vehicle={currentCoOwnerVehicle || vehicles[0]}
                  onClose={() => {
                    closeVotingPanel();
                    closeGaragePanel('VOTING');
                  }}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Authoritative Redesigned Showroom Zone Info Panel (e.g. Finance) for CO_OWNER */}
          {isCoOwner && selectedZone && selectedZone !== 'VEHICLE' && selectedZone !== 'FINANCE' && selectedZone !== 'CHARGING' && selectedZone !== 'ANALYTICS' && !showBackToVehicle && (
            <PanelErrorBoundary key={`zone-info-${selectedZone}`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI THÔNG TIN KHU VỰC..." />}>
                <ZoneInfoPanel onClose={() => clearSelection()} />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 24 Premium Redesigned Finance Dashboard for CO_OWNER */}
          {activePrimaryPanel === 'FINANCE' && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0]).id}-finance-dashboard`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI TÀI CHÍNH & QUỸ CHUNG..." />}>
                <FinanceZonePanel
                  vehicle={currentCoOwnerVehicle || vehicles[0]}
                  onClose={() => {
                    closeGaragePanel('FINANCE');
                    clearSelection();
                  }}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Screen-Space Analytics Panel */}
          {(activePrimaryPanel === 'ANALYTICS' || selectedZone === 'ANALYTICS' || activeFeature === 'ANALYTICS') && (
            <PanelErrorBoundary key={`${(isOperationsRole ? (heroVehicle || vehicles[0]) : (currentCoOwnerVehicle || vehicles[0]))?.id || 'ev'}-analytics`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI PHÂN TÍCH VẬN HÀNH..." />}>
                <AnalyticsPanel
                  vehicle={isOperationsRole ? (heroVehicle || vehicles[0]) : (currentCoOwnerVehicle || vehicles[0])}
                  onClose={() => {
                    closeGaragePanel('ANALYTICS');
                    if (selectedZone === 'ANALYTICS') {
                      selectZone(null);
                    }
                  }}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Unified Screen-Space Co-Ownership Panel for CO_OWNER */}
          {activePrimaryPanel === 'CO_OWNERSHIP' && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary
              key={`${(currentCoOwnerVehicle || vehicles[0]).id}-co-ownership-detail`}
              onReset={() => {
                queryClient.invalidateQueries({ queryKey: ['coOwnership'] });
                queryClient.invalidateQueries({ queryKey: ['groupTransfers'] });
                queryClient.invalidateQueries({ queryKey: ['incomingTransfers'] });
                queryClient.invalidateQueries({ queryKey: ['ownershipHistory'] });
                queryClient.invalidateQueries({ queryKey: ['transferPreview'] });
              }}
            >
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI QUẢN LÝ ĐỒNG SỞ HỮU..." />}>
                <CoOwnerOwnershipPanel
                  vehicle={currentCoOwnerVehicle || vehicles[0]}
                  onClose={() => closeGaragePanel('CO_OWNERSHIP')}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 22 Screen-Space Co-Ownership Contract Panel */}
          {activePrimaryPanel === 'CONTRACT' && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary
              key={`${(currentCoOwnerVehicle || vehicles[0]).id}-contract-detail`}
              onReset={() => {
                queryClient.invalidateQueries({ queryKey: ['co-ownership-contract'] });
                queryClient.invalidateQueries({ queryKey: ['co-ownership-contract-versions'] });
                queryClient.invalidateQueries({ queryKey: ['coOwnershipContract'] });
                queryClient.invalidateQueries({ queryKey: ['contractSummary'] });
              }}
            >
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI HỢP ĐỒNG ĐIỆN TỬ..." />}>
                <CoOwnerContractPanel
                  vehicle={currentCoOwnerVehicle || vehicles[0]}
                  onClose={() => closeGaragePanel('CONTRACT')}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 5.5 Dispute & Mediation Panel for CO_OWNER */}
          {activePrimaryPanel === 'DISPUTE' && (currentCoOwnerVehicle || vehicles[0]) && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0])?.id || 'ev'}-dispute`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI KHIẾU NẠI & TRANH CHẤP..." />}>
                <CoOwnerDisputePanel
                  vehicle={currentCoOwnerVehicle || vehicles[0]}
                  onClose={() => {
                    closeDisputePanel();
                    closeGaragePanel('DISPUTE');
                  }}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Screen-Space Fixed CO_OWNER Technical Specs Modal */}
          {currentCoOwnerVehicle && activePrimaryPanel === 'VEHICLE_INFO' && (
            <PanelErrorBoundary key={`${currentCoOwnerVehicle.id}-tech-info`}>
              <div
                style={{
                  position: 'fixed',
                  top: '76px',
                  right: '20px',
                  zIndex: 40,
                  pointerEvents: 'auto',
                }}
              >
                <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI THÔNG SỐ XE..." />}>
                  <CoOwnerVehicleInfoPanel
                    vehicle={currentCoOwnerVehicle}
                    onClose={() => closeGaragePanel('VEHICLE_INFO')}
                  />
                </React.Suspense>
              </div>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Screen-Space Fixed CO_OWNER My Bookings Panel */}
          {currentCoOwnerVehicle && activePrimaryPanel === 'MY_BOOKINGS' && (
            <PanelErrorBoundary key={`${currentCoOwnerVehicle.id}-my-bookings`}>
              <div
                style={{
                  position: 'fixed',
                  top: '76px',
                  right: '20px',
                  zIndex: 40,
                  pointerEvents: 'auto',
                }}
              >
                <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI LỊCH ĐẶT XE..." />}>
                  <MyBookingsPanel
                    vehicle={currentCoOwnerVehicle}
                    onClose={() => closeGaragePanel('MY_BOOKINGS')}
                  />
                </React.Suspense>
              </div>
            </PanelErrorBoundary>
          )}

          {/* Authoritative Screen-Space Fixed CO_OWNER Active Trip Details Panel */}
          {(currentCoOwnerVehicle || vehicles[0]) && vehicleTripVisualizationMode && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0]).id}-active-trip-detail`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI CHI TIẾT CHUYẾN ĐI..." />}>
                <ActiveTripDetailPanel
                  vehicle={currentCoOwnerVehicle || vehicles[0]}
                  onClose={() => returnToVehicleOverview()}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Authoritative Screen-Space Fixed CO_OWNER Vehicle Handover & Inspection Review Panel */}
          {(currentCoOwnerVehicle || vehicles[0]) && vehicleReceiptReviewMode && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0]).id}-handover-review`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI THÔNG TIN BÀN GIAO..." />}>
                <CoOwnerHandoverReviewPanel
                  vehicle={currentCoOwnerVehicle || vehicles[0]}
                  onClose={() => returnToVehicleOverview()}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Authoritative Screen-Space Fixed CO_OWNER Trip Start Panel */}
          {(currentCoOwnerVehicle || vehicles[0]) && vehicleTripStartMode && (
            <PanelErrorBoundary key={`${(currentCoOwnerVehicle || vehicles[0]).id}-trip-start`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI BẮT ĐẦU CHUYẾN ĐI..." />}>
                <CoOwnerTripStartPanel
                  vehicle={currentCoOwnerVehicle || vehicles[0]}
                  onClose={() => returnToVehicleOverview()}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Authoritative Screen-Space CO_OWNER Right Vehicle Information Panel */}
          {currentCoOwnerVehicle && activePrimaryPanel === 'VEHICLE_DETAIL' && isVehicleDetailOpen && !showBackToVehicle && (!selectedZone || selectedZone === 'VEHICLE') && (
            <PanelErrorBoundary key={`${currentCoOwnerVehicle.id}-co-owner-overview`}>
              <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI THÔNG TIN XE..." />}>
                <CoOwnerVehiclePanel
                  vehicle={currentCoOwnerVehicle}
                  onClose={() => {
                    if (isExplorationMode) {
                      exitCoOwnerExplorationMode();
                    } else {
                      closeCoOwnerOperations();
                    }
                  }}
                />
              </React.Suspense>
            </PanelErrorBoundary>
          )}

          {/* Dedicated Phase 3: Bottom Floating 8-Function Holographic Operational Carousel for CO_OWNER (Contextual) */}
          {isCoOwner && currentCoOwnerVehicle && !showBackToVehicle && isCoOwnerOperationsCarouselOpen && (
            <CoOwnerOperationalCarousel
              vehicle={currentCoOwnerVehicle}
            />
          )}

          {/* Authoritative Screen-Space CO_OWNER Multi-Vehicle Navigator (when co-owner has > 1 vehicles) */}
          {isCoOwner && currentCoOwnerVehicle && vehicles.length > 1 && (
            <FleetHeroNavigator
              vehicles={vehicles}
              selectedVehicle={currentCoOwnerVehicle}
              onSelectVehicle={(v) => selectVehicle(v.id, user?.role)}
              visible={!showBackToVehicle && !isExplorationMode}
              role={user?.role}
            />
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* AUTHORITATIVE GLOBAL DAMAGE DETAILS PANEL (ALL ROLES)    */}
      {/* Placed at root level to ensure independent stacking      */}
      {/* context above all 3D Annotations (z-index: 500)          */}
      {/* ======================================================== */}
      {(isOperationsRole ? heroVehicle : (currentCoOwnerVehicle || vehicles[0])) && (
        <PanelErrorBoundary key={`${(isOperationsRole ? heroVehicle : (currentCoOwnerVehicle || vehicles[0]))?.id || 'ev'}-damage-detail-panel`}>
          <React.Suspense fallback={null}>
            <DamageDetailModal
              vehicle={(isOperationsRole ? heroVehicle : (currentCoOwnerVehicle || vehicles[0]))!}
            />
          </React.Suspense>
        </PanelErrorBoundary>
      )}

      {/* Authoritative Screen-Space Staff Dispute Mediation Dashboard (Fallback only for non-staff; STAFF uses unified right operational panel) */}
      {isStaffDisputeDashboardOpen && user?.role !== 'STAFF' && (
        <PanelErrorBoundary key="staff-dispute-dashboard">
          <React.Suspense fallback={<PanelLoadingFallback title="ĐANG TẢI TRUNG TÂM HÒA GIẢI..." />}>
            <StaffDisputeDashboardModal
              onClose={() => setStaffDisputeDashboardOpen(false)}
            />
          </React.Suspense>
        </PanelErrorBoundary>
      )}

      {/* Authoritative Global AI Assistant Panel (Root Level - Independent Containing Block for ALL ROLES) */}
      {(activePrimaryPanel === 'AI_ASSISTANT' || selectedZone === 'AI' || activeFeature === 'AI_ASSISTANT') && (
        <PanelErrorBoundary key="ai-assistant-panel">
          <React.Suspense fallback={<PanelLoadingFallback title="ĐANG KẾT NỐI TRỢ LÝ AI..." />}>
            <AiZonePanel
              vehicle={isOperationsRole ? (heroVehicle || vehicles[0]) : (currentCoOwnerVehicle || vehicles[0])}
              onClose={() => {
                closeGaragePanel('AI_ASSISTANT');
                if (selectedZone === 'AI') {
                  selectZone(null);
                }
              }}
            />
          </React.Suspense>
        </PanelErrorBoundary>
      )}
      {/* Authoritative Co-Owner Yield/Booking Negotiation Modal */}
      {pendingExtensionRequestId && (
        <PanelErrorBoundary key="extension-negotiation-modal">
          <React.Suspense fallback={null}>
            <TripExtensionNegotiationModal
              requestId={pendingExtensionRequestId}
              onClose={() => closeExtensionNegotiationModal()}
            />
          </React.Suspense>
        </PanelErrorBoundary>
      )}

      {/* Global Unified Non-Intrusive Toast Presentation Container */}
      <StandardToastContainer />
    </div>
  );
};

export default GarageScene;
