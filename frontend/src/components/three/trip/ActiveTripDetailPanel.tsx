import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { TripData, TripExtensionCheckData, TripExtensionRequestData } from '../../../types/trip';
import {
  fetchActiveTripForVehicle,
  fetchLatestCompletedTripForVehicle,
  fetchVehicleTrips,
  requestTripReturnApi,
  acknowledgeTripViewedApi,
  extendTripApi,
  checkTripExtensionAvailabilityApi,
  createNegotiationRequestApi,
  fetchActiveTripExtensionRequestApi,
  cancelExtensionRequestApi,
} from '../../../services/tripApi';
import { useAuthStore } from '../../../store/authStore';
import { resolveVehicleDisplayName, resolveVehicleCode } from '../vehicles/vehicleModelConfig';
import {
  Car,
  Clock,
  Battery,
  Gauge,
  User,
  ArrowLeft,
  X,
  Zap,
  AlertTriangle,
  Loader2,
  Send,
  Calendar,
  FileText,
  CheckCircle2,
  History,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export interface ActiveTripDetailPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

function formatClockTime(isoString?: string | null): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '--:--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--:--';
    const time = d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const date = d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return `${time} (${date})`;
  } catch {
    return String(isoString);
  }
}

export const ActiveTripDetailPanel: React.FC<ActiveTripDetailPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [showExtensionControls, setShowExtensionControls] = useState(false);
  const [selectedExtraMinutes, setSelectedExtraMinutes] = useState<number>(30);
  const [extensionReason, setExtensionReason] = useState<string>('');
  const [isExtending, setIsExtending] = useState(false);
  const [isSubmittingNegotiation, setIsSubmittingNegotiation] = useState(false);
  const [isCancellingNegotiation, setIsCancellingNegotiation] = useState(false);
  const [extensionError, setExtensionError] = useState<string | null>(null);
  const [extensionSuccess, setExtensionSuccess] = useState<string | null>(null);

  // Authoritative real active trip query
  const {
    data: activeTrip,
    isLoading: isActiveLoading,
    isError: isActiveError,
    refetch: refetchActive,
  } = useQuery<TripData | null>({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    enabled: !!vehicle.id,
    refetchInterval: 3000,
  });

  // Query latest completed trip when no active trip is running
  const isTripActive = !!activeTrip && activeTrip.status === 'ACTIVE';

  const {
    data: latestCompletedTrip,
    isLoading: isLatestLoading,
    isError: isLatestError,
    refetch: refetchLatest,
  } = useQuery<TripData | null>({
    queryKey: ['latestCompletedTrip', vehicle.id, user?.id],
    queryFn: () => fetchLatestCompletedTripForVehicle(vehicle.id),
    enabled: !!vehicle.id && !isTripActive,
    refetchInterval: 4000,
  });

  // Historical trips list query for full history browsing
  const {
    data: vehicleTrips = [],
    isLoading: isTripsLoading,
    refetch: refetchTrips,
  } = useQuery<TripData[]>({
    queryKey: ['vehicleTrips', vehicle.id],
    queryFn: () => fetchVehicleTrips(vehicle.id),
    enabled: !!vehicle.id && showHistoryView,
    refetchInterval: 6000,
  });

  // Query active pending negotiation request for this trip (Section 8)
  const {
    data: activeNegotiation,
    refetch: refetchActiveNegotiation,
  } = useQuery<TripExtensionRequestData | null>({
    queryKey: ['activeTripNegotiation', activeTrip?.id],
    queryFn: () => (activeTrip?.id ? fetchActiveTripExtensionRequestApi(activeTrip.id) : Promise.resolve(null)),
    enabled: !!activeTrip?.id && isTripActive,
    refetchInterval: 3000,
  });

  // Query availability check for selected duration
  const {
    data: availabilityData,
    isLoading: isCheckingAvailability,
    refetch: refetchAvailability,
  } = useQuery<TripExtensionCheckData | null>({
    queryKey: ['tripExtensionCheck', activeTrip?.id, selectedExtraMinutes],
    queryFn: () => (activeTrip?.id ? checkTripExtensionAvailabilityApi(activeTrip.id, selectedExtraMinutes) : Promise.resolve(null)),
    enabled: !!activeTrip?.id && isTripActive && showExtensionControls && !activeNegotiation,
    staleTime: 4000,
  });

  const displayName = resolveVehicleDisplayName(vehicle);
  const displayCode = resolveVehicleCode(vehicle);

  // Resolve completed trip: prefer latestCompletedTrip, fallback to activeTrip if COMPLETED, or vehicleTrips
  const effectiveCompletedTrip: TripData | null = useMemo(() => {
    if (activeTrip && activeTrip.status === 'COMPLETED') {
      return activeTrip;
    }
    if (latestCompletedTrip) {
      return latestCompletedTrip;
    }
    if (vehicleTrips && vehicleTrips.length > 0) {
      const match = vehicleTrips.find(
        (t) =>
          t.status === 'COMPLETED' &&
          (!user?.id || t.userId === user.id || t.userEmail === user.email)
      );
      if (match) return match;
      return vehicleTrips.find((t) => t.status === 'COMPLETED') || null;
    }
    return null;
  }, [activeTrip, latestCompletedTrip, vehicleTrips, user?.id, user?.email]);

  // Acknowledge viewing completed trip to dismiss summary card from main overview (Section 4)
  const acknowledgedTripIdRef = useRef<string | null>(null);
  const acknowledgeMutation = useMutation({
    mutationFn: (tripId: string) => acknowledgeTripViewedApi(tripId),
    onSuccess: () => {
      if (vehicle?.id) {
        queryClient.setQueryData(['latestCompletedTrip', vehicle.id, user?.id], (old: TripData | null) => {
          if (!old) return old;
          return { ...old, isAcknowledged: true, acknowledged: true };
        });
      }
      try {
        const key = `evshare_dismissed_trips_${user?.id || 'guest'}`;
        const stored = localStorage.getItem(key);
        const set = stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
        if (effectiveCompletedTrip?.id) {
          set.add(effectiveCompletedTrip.id);
          localStorage.setItem(key, JSON.stringify(Array.from(set)));
        }
      } catch {
        // Fallback
      }
      queryClient.invalidateQueries({ queryKey: ['latestCompletedTrip', vehicle.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onError: () => {
      acknowledgedTripIdRef.current = null;
    },
  });

  useEffect(() => {
    if (
      !isTripActive &&
      effectiveCompletedTrip &&
      effectiveCompletedTrip.status === 'COMPLETED' &&
      !effectiveCompletedTrip.isAcknowledged &&
      acknowledgedTripIdRef.current !== effectiveCompletedTrip.id
    ) {
      acknowledgedTripIdRef.current = effectiveCompletedTrip.id;
      acknowledgeMutation.mutate(effectiveCompletedTrip.id);
    }
  }, [
    isTripActive,
    effectiveCompletedTrip?.id,
    effectiveCompletedTrip?.status,
    effectiveCompletedTrip?.isAcknowledged,
  ]);

  // Client-side elapsed ticker derived from persisted start time (runs outside 3D Canvas)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (!activeTrip?.startedAt) return 0;
    try {
      const started = new Date(activeTrip.startedAt).getTime();
      return Math.max(0, Math.floor((Date.now() - started) / 1000));
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (!activeTrip?.startedAt || activeTrip?.status === 'COMPLETED') return;

    const updateElapsed = () => {
      try {
        const started = new Date(activeTrip.startedAt).getTime();
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));
      } catch {
        setElapsedSeconds(0);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeTrip?.startedAt, activeTrip?.status]);

  const formattedElapsedTime = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [elapsedSeconds]);

  // Booking time range
  const currentTripContext = isTripActive ? activeTrip : effectiveCompletedTrip;
  const bookingTimeRange = useMemo(() => {
    if (!currentTripContext?.bookingStartTime || !currentTripContext?.bookingEndTime) {
      return '--:-- - --:--';
    }
    return `${formatClockTime(currentTripContext.bookingStartTime)} - ${formatClockTime(currentTripContext.bookingEndTime)}`;
  }, [currentTripContext?.bookingStartTime, currentTripContext?.bookingEndTime]);

  // Verified distance for active or completed trips
  const distanceDisplay = useMemo(() => {
    if (!currentTripContext) return '-- km';
    if (currentTripContext.distanceTraveled != null && currentTripContext.distanceTraveled > 0) {
      return `${currentTripContext.distanceTraveled.toFixed(1)} km`;
    }
    if (currentTripContext.distanceKm != null && currentTripContext.distanceKm > 0) {
      return `${currentTripContext.distanceKm.toFixed(1)} km`;
    }
    if (
      currentTripContext.endOdometer != null &&
      currentTripContext.startOdometer != null
    ) {
      const diff = Number(currentTripContext.endOdometer) - Number(currentTripContext.startOdometer);
      return `${Math.max(0, diff).toFixed(1)} km`;
    }
    if (isTripActive) {
      return '-- km (Chờ nhân viên chốt ODO)';
    }
    return '-- km';
  }, [currentTripContext, isTripActive]);

  // Request Return Handler
  const handleRequestReturn = useCallback(async () => {
    if (!activeTrip?.id || isSubmittingReturn) return;
    setIsSubmittingReturn(true);
    setReturnError(null);

    try {
      await requestTripReturnApi(activeTrip.id);
      setShowReturnConfirm(false);

      // Invalidate target caches to update UI across views
      queryClient.invalidateQueries({ queryKey: ['activeTrip', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['latestCompletedTrip', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicleTrips', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicleBookings', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['handoverHistory', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-handover-history', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['tripEligibility'] });
      queryClient.invalidateQueries({ queryKey: ['bookingTrip'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReturnTrips'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err: any) {
      setReturnError(err.message || 'Không thể gửi yêu cầu trả xe. Vui lòng thử lại.');
    } finally {
      setIsSubmittingReturn(false);
    }
  }, [activeTrip?.id, isSubmittingReturn, queryClient, vehicle.id]);

  const handleConfirmDirectExtend = useCallback(async () => {
    if (!activeTrip) return;
    try {
      setIsExtending(true);
      setExtensionError(null);
      setExtensionSuccess(null);
      await extendTripApi(activeTrip.id, {
        additionalMinutes: selectedExtraMinutes,
        reason: extensionReason || `Gia hạn chuyến đi thêm ${selectedExtraMinutes} phút`,
      });
      setExtensionSuccess(`GIA HẠN THÀNH CÔNG (+${selectedExtraMinutes} PHÚT)`);
      queryClient.invalidateQueries({ queryKey: ['activeTrip', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicleBookings', vehicle.id] });
      refetchActive();
      refetchAvailability();
      setTimeout(() => setExtensionSuccess(null), 5000);
    } catch (err: any) {
      setExtensionError(err.message || 'Không thể gia hạn chuyến đi.');
    } finally {
      setIsExtending(false);
    }
  }, [activeTrip, selectedExtraMinutes, extensionReason, queryClient, refetchActive, refetchAvailability, vehicle.id]);

  const handleSendNegotiationRequest = useCallback(async () => {
    if (!activeTrip) return;
    try {
      setIsSubmittingNegotiation(true);
      setExtensionError(null);
      await createNegotiationRequestApi(
        activeTrip.id,
        selectedExtraMinutes,
        extensionReason || `Gia hạn chuyến đi thêm ${selectedExtraMinutes} phút`
      );
      setExtensionSuccess('Đã gửi yêu cầu nhường lịch thành công!');
      queryClient.invalidateQueries({ queryKey: ['activeTripNegotiation', activeTrip.id] });
      refetchActiveNegotiation();
      setTimeout(() => setExtensionSuccess(null), 4000);
    } catch (err: any) {
      setExtensionError(err.message || 'Không thể gửi yêu cầu nhường lịch.');
    } finally {
      setIsSubmittingNegotiation(false);
    }
  }, [activeTrip, selectedExtraMinutes, extensionReason, queryClient, refetchActiveNegotiation]);

  const handleCancelNegotiationRequest = useCallback(async () => {
    if (!activeNegotiation?.id) return;
    try {
      setIsCancellingNegotiation(true);
      setExtensionError(null);
      await cancelExtensionRequestApi(activeNegotiation.id);
      queryClient.invalidateQueries({ queryKey: ['activeTripNegotiation', activeTrip?.id] });
      refetchActiveNegotiation();
      refetchAvailability();
    } catch (err: any) {
      setExtensionError(err.message || 'Không thể hủy yêu cầu.');
    } finally {
      setIsCancellingNegotiation(false);
    }
  }, [activeNegotiation?.id, activeTrip?.id, queryClient, refetchActiveNegotiation, refetchAvailability]);

  const handleExtendTrip = useCallback(async (extraMinutes: number) => {
    setSelectedExtraMinutes(extraMinutes);
    if (!activeTrip) return;
    try {
      setIsExtending(true);
      setExtensionError(null);
      setExtensionSuccess(null);
      await extendTripApi(activeTrip.id, {
        additionalMinutes: extraMinutes,
        reason: `Gia hạn chuyến đi thêm ${extraMinutes} phút`,
      });
      setExtensionSuccess(`GIA HẠN THÀNH CÔNG (+${extraMinutes} PHÚT)`);
      queryClient.invalidateQueries({ queryKey: ['activeTrip', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicleBookings', vehicle.id] });
      refetchActive();
      refetchAvailability();
      setTimeout(() => setExtensionSuccess(null), 4000);
    } catch (err: any) {
      setExtensionError(err.message || 'Không thể gia hạn chuyến đi.');
    } finally {
      setIsExtending(false);
    }
  }, [activeTrip, queryClient, refetchActive, refetchAvailability, vehicle.id]);

  // Dedicated wheel isolation: prevent mouse-wheel in right panel from triggering 3D camera zoom
  const panelRef = React.useRef<HTMLElement>(null);
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const isReturnRequested = !!activeTrip?.returnRequestedAt;
  const isOverallLoading = isActiveLoading || (!isTripActive && isLatestLoading);
  const isOverallError = isActiveError && (!effectiveCompletedTrip && isLatestError);

  // Status Badge Metadata
  const badgeConfig = useMemo(() => {
    if (isTripActive) {
      if (isReturnRequested) {
        return {
          label: 'ĐANG CHỜ TIẾP NHẬN XE',
          bg: 'rgba(245, 158, 11, 0.2)',
          border: '#f59e0b',
          color: '#fbbf24',
        };
      }
      return {
        label: 'ĐANG DIỄN RA',
        bg: 'rgba(0, 242, 254, 0.2)',
        border: '#00f2fe',
        color: '#00f2fe',
      };
    }
    if (effectiveCompletedTrip) {
      return {
        label: 'HOÀN TẤT',
        bg: 'rgba(16, 185, 129, 0.2)',
        border: '#10b981',
        color: '#34d399',
      };
    }
    return null;
  }, [isTripActive, isReturnRequested, effectiveCompletedTrip]);

  return (
    <aside
      ref={panelRef}
      role="complementary"
      aria-label="Chi tiết chuyến đi"
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '76px',
        right: '20px',
        bottom: '20px',
        width: 'clamp(440px, 28vw, 495px)',
        maxWidth: 'min(495px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 96px)',
        overflowY: 'auto',
        background: 'rgba(7, 20, 38, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 242, 254, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(0, 242, 254, 0.16)',
        borderRadius: '20px',
        padding: '18px 20px',
        color: '#ffffff',
        fontFamily: 'var(--font-family, system-ui, sans-serif)',
        zIndex: 40,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top-Right Close Button */}
      <button
        type="button"
        onClick={onClose}
        title="Quay lại xe điện"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          cursor: 'pointer',
          zIndex: 30,
          transition: 'all 0.18s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          e.currentTarget.style.color = '#ff6b6b';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        <X size={15} />
      </button>

      {/* 1. HEADER: CHI TIẾT CHUYẾN ĐI & VEHICLE IDENTITY */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.35), rgba(8, 20, 36, 0.95))',
              border: '1.2px solid #00f2fe',
              boxShadow: '0 0 10px rgba(0, 242, 254, 0.35)',
              borderRadius: '7px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 900,
              color: '#00f2fe',
              letterSpacing: '0.04em',
            }}
          >
            {displayCode}
          </div>

          <h2
            style={{
              fontSize: '17px',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {showHistoryView ? 'LỊCH SỬ CHUYẾN ĐI' : 'CHI TIẾT CHUYẾN ĐI'}
          </h2>

          {!showHistoryView && badgeConfig && (
            <span
              style={{
                background: badgeConfig.bg,
                border: `1px solid ${badgeConfig.border}`,
                borderRadius: '9999px',
                padding: '2px 8px',
                fontSize: '9.5px',
                fontWeight: 800,
                color: badgeConfig.color,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'currentColor',
                  boxShadow: '0 0 6px currentColor',
                }}
              />
              {badgeConfig.label}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
          <span style={{ color: '#ffffff', fontWeight: 700 }}>{displayName}</span>
          <span>•</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{vehicle.licensePlate || '51K-888.88'}</span>
        </div>
      </div>

      {/* 2. LOADING STATE */}
      {isOverallLoading && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '14px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#38bdf8',
          }}
        >
          <Loader2 size={24} className="animate-spin" color="#00f2fe" />
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em' }}>
            ĐANG TẢI DỮ LIỆU CHUYẾN ĐI...
          </span>
        </div>
      )}

      {/* 3. ERROR OR GENUINE EMPTY STATE */}
      {!isOverallLoading && !isTripActive && !effectiveCompletedTrip && (
        <div
          style={{
            background: isOverallError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
            border: isOverallError
              ? '1.2px solid rgba(239, 68, 68, 0.4)'
              : '1.2px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '14px',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: isOverallError ? '#f87171' : '#38bdf8',
            }}
          >
            {isOverallError ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            <strong style={{ fontSize: '13px' }}>
              {isOverallError
                ? 'KHÔNG THỂ KẾT NỐI MÁY CHỦ'
                : 'CHƯA CÓ LỊCH SỬ CHUYẾN ĐI'}
            </strong>
          </div>
          <p style={{ fontSize: '11.5px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
            {isOverallError
              ? 'Không thể tải thông tin chuyến đi từ máy chủ. Vui lòng thử lại.'
              : `Xe ${displayName} (${vehicle.licensePlate || displayCode}) hiện không có chuyến đi đang diễn ra hoặc hồ sơ hoàn tất nào của bạn.`}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            {isOverallError && (
              <button
                type="button"
                onClick={() => {
                  refetchActive();
                  refetchLatest();
                }}
                style={{
                  flex: 1,
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                  padding: '8px',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <RefreshCw size={12} />
                <span>THỬ LẠI</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={13} />
              <span>QUAY LẠI XE</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. HISTORICAL TRIPS LIST SUBVIEW */}
      {!isOverallLoading && showHistoryView && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#94a3b8',
              paddingBottom: '4px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <span>Tổng cộng <strong style={{ color: '#00f2fe' }}>{vehicleTrips.length}</strong> chuyến đi</span>
            <button
              type="button"
              onClick={() => setShowHistoryView(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '4px 8px',
                color: '#38bdf8',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowLeft size={12} />
              <span>QUAY LẠI TỔNG KẾT</span>
            </button>
          </div>

          {isTripsLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#38bdf8', fontSize: '11px' }}>
              <Loader2 size={16} className="animate-spin" style={{ margin: '0 auto 6px' }} />
              <span>Đang tải danh sách lịch sử...</span>
            </div>
          ) : vehicleTrips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '11px' }}>
              Chưa có dữ liệu lịch sử chuyến đi cho xe này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {vehicleTrips.map((t) => {
                const isComp = t.status === 'COMPLETED';
                const dist =
                  t.distanceTraveled ??
                  (t.endOdometer != null && t.startOdometer != null
                    ? Math.max(0, Number(t.endOdometer) - Number(t.startOdometer))
                    : 0);

                return (
                  <div
                    key={t.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={12} color="#00f2fe" />
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                          {formatDateTime(t.startedAt)}
                        </span>
                      </div>
                      <span
                        style={{
                          background: isComp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 242, 254, 0.2)',
                          color: isComp ? '#34d399' : '#00f2fe',
                          padding: '1px 6px',
                          borderRadius: '999px',
                          fontSize: '9.5px',
                          fontWeight: 800,
                        }}
                      >
                        {isComp ? 'HOÀN TẤT' : t.status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: '#cbd5e1' }}>
                      <div>Quãng đường: <strong style={{ color: '#ffffff' }}>{dist > 0 ? `${dist.toFixed(1)} km` : '--'}</strong></div>
                      <div>Tiêu thụ: <strong style={{ color: '#00f2fe' }}>{t.energyConsumedKwh != null ? `${t.energyConsumedKwh.toFixed(1)} kWh` : '--'}</strong></div>
                    </div>

                    {t.verifiedExpenseAmount != null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', marginTop: '2px' }}>
                        <span>Chi phí điện:</span>
                        <strong style={{ color: '#fbbf24' }}>
                          {Number(t.verifiedExpenseAmount).toLocaleString('vi-VN')} VND
                        </strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. VIEW A: LIVE ACTIVE TRIP VIEW */}
      {!isOverallLoading && !showHistoryView && isTripActive && activeTrip && (
        <>
          {/* 5.1 LIVE ELAPSED TIMER TICKER */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(2, 132, 199, 0.22) 100%)',
              border: '1.2px solid rgba(0, 242, 254, 0.45)',
              boxShadow: '0 0 16px rgba(0, 242, 254, 0.18)',
              borderRadius: '14px',
              padding: '12px 14px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              <Clock size={12} color="#00f2fe" />
              <span>THỜI GIAN ĐÃ SỬ DỤNG</span>
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 900,
                color: '#00f2fe',
                letterSpacing: '0.06em',
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 0 14px rgba(0, 242, 254, 0.65)',
                lineHeight: 1.15,
                margin: '2px 0',
              }}
            >
              {formattedElapsedTime}
            </div>
            <div style={{ fontSize: '9.5px', color: '#67e8f9' }}>
              Bắt đầu lúc: {formatDateTime(activeTrip.startedAt)}
            </div>
          </div>

          {/* 5.2 BOOKING INFORMATION CARD */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '11px 13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Người sử dụng:</span>
              <span
                style={{
                  color: '#ffffff',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <User size={12} color="#38bdf8" />
                {activeTrip.userName || user?.fullName || 'Đồng sở hữu'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Khung giờ đặt:</span>
              <strong style={{ color: '#00f2fe' }}>{bookingTimeRange}</strong>
            </div>
            {activeTrip.bookingId && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Mã lịch đặt (Ref):</span>
                <span style={{ color: '#cbd5e1', fontFamily: 'monospace', fontWeight: 600 }}>
                  {activeTrip.bookingId.slice(0, 8).toUpperCase()}...
                </span>
              </div>
            )}
          </div>

          {/* 5.3 ODOMETER & BATTERY SNAPSHOTS (READ-ONLY) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            {/* Odometer Start */}
            <div
              style={{
                background: 'rgba(10, 24, 44, 0.8)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                borderRadius: '10px',
                padding: '9px 11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#94a3b8' }}>
                <Gauge size={12} color="#00f2fe" />
                <span>Odo xuất phát</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
                {activeTrip.startOdometer != null
                  ? `${Number(activeTrip.startOdometer).toLocaleString('vi-VN')} km`
                  : '-- km'}
              </div>
            </div>

            {/* Battery Start */}
            <div
              style={{
                background: 'rgba(10, 24, 44, 0.8)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '10px',
                padding: '9px 11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#94a3b8' }}>
                <Battery size={12} color="#34d399" />
                <span>Pin xuất phát</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399' }}>
                {activeTrip.startBatteryLevel != null ? `${activeTrip.startBatteryLevel}%` : '--%'}
              </div>
            </div>
          </div>

          {/* 5.4 DISTANCE STATUS CARD */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              borderRadius: '10px',
              padding: '9px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
              Quãng đường chuyến đi:
            </span>
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#00f2fe' }}>
              {distanceDisplay}
            </span>
          </div>

          {/* 5.4.5 SMART TRIP EXTENSION & BOOKING NEGOTIATION SECTION (Section 14) */}
          {!isReturnRequested && (
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(8, 22, 44, 0.85) 0%, rgba(5, 14, 28, 0.95) 100%)',
                border: '1.2px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} color="#00f2fe" />
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                    GIA HẠN CHUYẾN ĐI
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowExtensionControls((prev) => !prev);
                    setExtensionError(null);
                    setExtensionSuccess(null);
                  }}
                  style={{
                    background: showExtensionControls ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    borderRadius: '6px',
                    color: '#00f2fe',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    cursor: 'pointer',
                  }}
                >
                  {showExtensionControls ? 'THU GỌN' : '+ GIA HẠN THÊM'}
                </button>
              </div>

              {/* State 1: Active Negotiation Request is PENDING */}
              {activeNegotiation && activeNegotiation.status === 'PENDING' ? (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fbbf24', fontWeight: 800, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> ĐANG CHỜ PHẢN HỒI
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '10px' }}>
                      +{activeNegotiation.additionalMinutes} phút
                    </span>
                  </div>

                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '10.5px' }}>
                    Đã gửi yêu cầu nhường lịch tới <strong>{activeNegotiation.affectedOwnerName || 'đồng sở hữu tiếp theo'}</strong>.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94a3b8' }}>
                    <span>Hạn phản hồi: {formatClockTime(activeNegotiation.responseDeadline)}</span>
                    <button
                      type="button"
                      disabled={isCancellingNegotiation}
                      onClick={handleCancelNegotiationRequest}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        borderRadius: '6px',
                        color: '#f87171',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: isCancellingNegotiation ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isCancellingNegotiation ? 'Đang hủy...' : 'HỦY YÊU CẦU'}
                    </button>
                  </div>
                </div>
              ) : (
                /* State 2: Normal Extension Selection & Availability Evaluation */
                showExtensionControls && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Time Comparison Rows */}
                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        fontSize: '11px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Giờ trả xe hiện tại:</span>
                        <strong style={{ color: '#cbd5e1' }}>{formatClockTime(activeTrip.bookingEndTime)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Giờ trả xe đề xuất:</span>
                        <strong style={{ color: '#00f2fe' }}>
                          {formatClockTime(
                            new Date(
                              new Date(activeTrip.bookingEndTime || new Date().toISOString()).getTime() +
                                selectedExtraMinutes * 60000
                            ).toISOString()
                          )}
                        </strong>
                      </div>
                    </div>

                    {/* Duration Buttons: +15 PHÚT, +30 PHÚT, +60 PHÚT */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[15, 30, 60].map((mins) => {
                        const isSelected = selectedExtraMinutes === mins;
                        return (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => {
                              setSelectedExtraMinutes(mins);
                              setExtensionError(null);
                            }}
                            style={{
                              flex: 1,
                              background: isSelected
                                ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(0, 242, 254, 0.3) 100%)'
                                : 'rgba(15, 23, 42, 0.6)',
                              border: isSelected
                                ? '1.5px solid #00f2fe'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              padding: '7px 4px',
                              color: isSelected ? '#00f2fe' : '#94a3b8',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 0 10px rgba(0, 242, 254, 0.25)' : 'none',
                            }}
                          >
                            +{mins} PHÚT
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback Messages */}
                    {extensionSuccess && (
                      <div
                        style={{
                          color: '#34d399',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>{extensionSuccess}</span>
                      </div>
                    )}

                    {extensionError && (
                      <div
                        style={{
                          color: '#f87171',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <AlertTriangle size={13} />
                        <span>{extensionError}</span>
                      </div>
                    )}

                    {/* Loading Availability Check */}
                    {isCheckingAvailability ? (
                      <div style={{ textAlign: 'center', padding: '6px 0', color: '#00f2fe', fontSize: '10.5px' }}>
                        <Loader2 size={12} className="animate-spin" style={{ display: 'inline', marginRight: '5px' }} />
                        Đang kiểm tra tình trạng lịch xe...
                      </div>
                    ) : availabilityData?.canDirectExtend ? (
                      /* DIRECT EXTENSION AVAILABLE */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div
                          style={{
                            fontSize: '10.5px',
                            color: '#34d399',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={12} />
                          <span>Khung giờ gia hạn còn trống.</span>
                        </div>
                        <button
                          type="button"
                          disabled={isExtending}
                          onClick={handleConfirmDirectExtend}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '9px',
                            color: '#050c18',
                            fontSize: '11px',
                            fontWeight: 900,
                            letterSpacing: '0.04em',
                            cursor: isExtending ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 14px rgba(0, 242, 254, 0.3)',
                          }}
                        >
                          {isExtending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          <span>XÁC NHẬN GIA HẠN</span>
                        </button>
                      </div>
                    ) : availabilityData?.hasConflict && availabilityData?.canNegotiate ? (
                      /* CONFLICT DETECTED -> DIRECT NEGOTIATION WORKFLOW */
                      <div
                        style={{
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          fontSize: '10.5px',
                        }}
                      >
                        <div style={{ color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <AlertTriangle size={12} />
                          <span>Khung giờ gia hạn trùng với lịch đặt của thành viên khác.</span>
                        </div>
                        <div style={{ color: '#cbd5e1' }}>
                          Thành viên: <strong style={{ color: '#ffffff' }}>{availabilityData.affectedOwnerName}</strong> (Lịch:{' '}
                          {formatClockTime(availabilityData.affectedOriginalStartTime)} -{' '}
                          {formatClockTime(availabilityData.affectedOriginalEndTime)})
                        </div>
                        <div style={{ color: '#38bdf8' }}>
                          Đề xuất sau nhường: {formatClockTime(availabilityData.proposedAffectedStartTime)} -{' '}
                          {formatClockTime(availabilityData.affectedOriginalEndTime)}
                        </div>
                        <input
                          type="text"
                          placeholder="Lý do xin gia hạn (không bắt buộc)..."
                          value={extensionReason}
                          onChange={(e) => setExtensionReason(e.target.value)}
                          style={{
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            color: '#ffffff',
                            fontSize: '10.5px',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          disabled={isSubmittingNegotiation}
                          onClick={handleSendNegotiationRequest}
                          style={{
                            background: 'linear-gradient(135deg, #d97706 0%, #0284c7 100%)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.03em',
                            cursor: isSubmittingNegotiation ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                          }}
                        >
                          {isSubmittingNegotiation ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Send size={12} />
                          )}
                          <span>GỬI YÊU CẦU NHƯỜNG LỊCH</span>
                        </button>
                      </div>
                    ) : availabilityData && !availabilityData.eligible ? (
                      /* NOT ELIGIBLE */
                      <div
                        style={{
                          color: '#f87171',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          background: 'rgba(239, 68, 68, 0.12)',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <AlertTriangle size={12} />
                        <span>{availabilityData.message || 'Không thể gia hạn trong khung giờ này.'}</span>
                      </div>
                    ) : null}
                  </div>
                )
              )}
            </div>
          )}

          {/* 5.5 RETURN REQUEST ACTION OR STATUS */}
          {showReturnConfirm ? (
            /* SUBVIEW: RETURN CONFIRMATION */
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1.2px solid rgba(245, 158, 11, 0.5)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '11.5px', fontWeight: 800 }}>
                <AlertTriangle size={15} color="#fbbf24" />
                <span>XÁC NHẬN YÊU CẦU TRẢ XE</span>
              </div>

              <div style={{ fontSize: '10.5px', display: 'flex', flexDirection: 'column', gap: '4px', color: '#cbd5e1' }}>
                <div>Phương tiện: <strong style={{ color: '#ffffff' }}>{displayName} ({vehicle.licensePlate || displayCode})</strong></div>
                <div>Thời điểm bắt đầu: <strong style={{ color: '#ffffff' }}>{formatDateTime(activeTrip.startedAt)}</strong></div>
                <div>Odo xuất phát: <strong style={{ color: '#00f2fe' }}>{activeTrip.startOdometer != null ? `${Number(activeTrip.startOdometer).toLocaleString('vi-VN')} km` : '--'}</strong></div>
              </div>

              <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>
                Sau khi gửi yêu cầu, vui lòng đưa xe đến trạm để nhân viên tiếp nhận và ghi nhận chỉ số ODO kết thúc.
              </div>

              {returnError && (
                <div style={{ color: '#f87171', fontSize: '10.5px', fontWeight: 600 }}>
                  {returnError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  disabled={isSubmittingReturn}
                  onClick={handleRequestReturn}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: isSubmittingReturn ? 'not-allowed' : 'pointer',
                    opacity: isSubmittingReturn ? 0.6 : 1,
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  {isSubmittingReturn ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU TRẢ XE'}
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReturn}
                  onClick={() => setShowReturnConfirm(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  HỦY BỎ
                </button>
              </div>
            </div>
          ) : isReturnRequested ? (
            /* INFO NOTICE: WAITING FOR STAFF RECEPTION */
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1.2px solid rgba(245, 158, 11, 0.5)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '11.5px', fontWeight: 800 }}>
                <Clock size={14} color="#fbbf24" />
                <span>ĐANG CHỜ NHÂN VIÊN TIẾP NHẬN XE</span>
              </div>
              <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.4 }}>
                Yêu cầu trả xe đã được gửi đến nhân viên trạm. Nhân viên sẽ tiến hành kiểm tra xe và chốt số km trên đồng hồ ODO để hoàn tất biên bản.
              </div>
              <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                Thời gian gửi: {formatDateTime(activeTrip.returnRequestedAt)}
              </div>
            </div>
          ) : (
            /* PRIMARY ACTION: REQUEST VEHICLE RETURN */
            <button
              type="button"
              onClick={() => {
                setReturnError(null);
                setShowReturnConfirm(true);
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '11px 16px',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 22px rgba(245, 158, 11, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(245, 158, 11, 0.35)';
              }}
            >
              <Send size={15} color="#ffffff" />
              <span>YÊU CẦU TRẢ XE</span>
            </button>
          )}

          {/* 5.6 SECONDARY ACTIONS */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
            <button
              type="button"
              onClick={() => setShowHistoryView(true)}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              <History size={13} />
              <span>LỊCH SỬ CHUYẾN ĐI</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: '#cbd5e1',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              <ArrowLeft size={13} />
              <span>QUAY LẠI XE</span>
            </button>
          </div>
        </>
      )}

      {/* 6. VIEW B: COMPLETED TRIP SUMMARY VIEW */}
      {!isOverallLoading && !showHistoryView && !isTripActive && effectiveCompletedTrip && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 6.1 SUCCESS BANNER */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.28) 100%)',
              border: '1.2px solid rgba(16, 185, 129, 0.55)',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.20)',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.25)',
                border: '1px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={20} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#34d399', letterSpacing: '-0.01em' }}>
                CHUYẾN ĐI ĐÃ HOÀN TẤT
              </div>
              <div style={{ fontSize: '10.5px', color: '#a7f3d0' }}>
                Xe đã được nhân viên trạm tiếp nhận và chốt số liệu vận hành.
              </div>
            </div>
          </div>

          {/* 6.2 TIME & BOOKING SUMMARY */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '11px 13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Người sử dụng:</span>
              <span style={{ color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} color="#38bdf8" />
                {effectiveCompletedTrip.userName || user?.fullName || 'Đồng sở hữu'}
              </span>
            </div>
            {effectiveCompletedTrip.bookingId && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Mã đặt chỗ (Ref):</span>
                <span style={{ color: '#cbd5e1', fontFamily: 'monospace', fontWeight: 700 }}>
                  {effectiveCompletedTrip.bookingId.slice(0, 8).toUpperCase()}...
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Thời gian xuất phát:</span>
              <span style={{ color: '#cbd5e1' }}>{formatDateTime(effectiveCompletedTrip.startedAt)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Thời điểm hoàn tất trả xe:</span>
              <strong style={{ color: '#34d399' }}>
                {formatDateTime(effectiveCompletedTrip.endedAt || effectiveCompletedTrip.returnVerifiedAt)}
              </strong>
            </div>
          </div>

          {/* 6.3 ODOMETER & DISTANCE VERIFICATION CARD */}
          <div
            style={{
              background: 'rgba(10, 24, 44, 0.8)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
              <Gauge size={14} color="#00f2fe" />
              <span>ĐỒNG HỒ ODOMETER & QUÃNG ĐƯỜNG XÁC MINH</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
              <div style={{ background: 'rgba(7, 20, 38, 0.65)', padding: '7px 9px', borderRadius: '8px' }}>
                <div style={{ color: '#94a3b8', fontSize: '10px' }}>ODO xuất phát:</div>
                <strong style={{ color: '#ffffff', fontSize: '12.5px' }}>
                  {effectiveCompletedTrip.startOdometer != null
                    ? `${Number(effectiveCompletedTrip.startOdometer).toLocaleString('vi-VN')} km`
                    : '-- km'}
                </strong>
              </div>
              <div style={{ background: 'rgba(7, 20, 38, 0.65)', padding: '7px 9px', borderRadius: '8px' }}>
                <div style={{ color: '#94a3b8', fontSize: '10px' }}>ODO khi hoàn tất:</div>
                <strong style={{ color: '#38bdf8', fontSize: '12.5px' }}>
                  {effectiveCompletedTrip.endOdometer != null
                    ? `${Number(effectiveCompletedTrip.endOdometer).toLocaleString('vi-VN')} km`
                    : '-- km'}
                </strong>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(0, 242, 254, 0.08)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                borderRadius: '8px',
                padding: '8px 10px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                Quãng đường thực tế đã đi:
              </span>
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#00f2fe' }}>
                {distanceDisplay}
              </span>
            </div>
          </div>

          {/* 6.4 BATTERY & ENERGY CONSUMPTION CARD */}
          <div
            style={{
              background: 'rgba(10, 24, 44, 0.8)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#34d399' }}>
              <Battery size={14} color="#34d399" />
              <span>TIÊU THỤ PIN & NĂNG LƯỢNG ĐIỆN</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
              <div style={{ background: 'rgba(7, 20, 38, 0.65)', padding: '7px 9px', borderRadius: '8px' }}>
                <div style={{ color: '#94a3b8', fontSize: '10px' }}>Pin lúc bắt đầu:</div>
                <strong style={{ color: '#ffffff', fontSize: '12.5px' }}>
                  {effectiveCompletedTrip.startBatteryLevel != null ? `${effectiveCompletedTrip.startBatteryLevel}%` : '--%'}
                </strong>
              </div>
              <div style={{ background: 'rgba(7, 20, 38, 0.65)', padding: '7px 9px', borderRadius: '8px' }}>
                <div style={{ color: '#94a3b8', fontSize: '10px' }}>Pin lúc nhận lại:</div>
                <strong style={{ color: '#34d399', fontSize: '12.5px' }}>
                  {effectiveCompletedTrip.endBatteryLevel != null
                    ? `${effectiveCompletedTrip.endBatteryLevel}%`
                    : effectiveCompletedTrip.endSocPercent != null
                    ? `${effectiveCompletedTrip.endSocPercent}%`
                    : '--%'}
                </strong>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '8px 10px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                Điện năng tiêu thụ (ước tính):
              </span>
              <strong style={{ fontSize: '13.5px', color: '#00f2fe' }}>
                {effectiveCompletedTrip.energyConsumedKwh != null
                  ? `${effectiveCompletedTrip.energyConsumedKwh.toFixed(1)} kWh`
                  : effectiveCompletedTrip.startBatteryLevel != null && effectiveCompletedTrip.endBatteryLevel != null
                  ? `${Math.max(0, (effectiveCompletedTrip.startBatteryLevel - effectiveCompletedTrip.endBatteryLevel) * 0.65).toFixed(1)} kWh`
                  : '-- kWh'}
              </strong>
            </div>
          </div>

          {/* 6.5 FINANCIAL SETTLEMENT & RECEPTION VERIFICATION */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.16) 100%)',
              border: '1.2px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>
              <DollarSign size={14} color="#fbbf24" />
              <span>ĐỐI SOÁT CHI PHÍ & XÁC NHẬN TIẾP NHẬN</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
              <span style={{ color: '#94a3b8' }}>Chi phí sạc / sử dụng:</span>
              <strong style={{ color: '#fbbf24', fontSize: '13px' }}>
                {effectiveCompletedTrip.verifiedExpenseAmount != null
                  ? `${Number(effectiveCompletedTrip.verifiedExpenseAmount).toLocaleString('vi-VN')} VND`
                  : effectiveCompletedTrip.energyConsumedKwh != null
                  ? `${Math.round(effectiveCompletedTrip.energyConsumedKwh * 3000).toLocaleString('vi-VN')} VND`
                  : '-- VND'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Trạng thái thanh toán:</span>
              <span
                style={{
                  background:
                    effectiveCompletedTrip.expenseStatus === 'SETTLED' ||
                    effectiveCompletedTrip.expenseStatus === 'PAID'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(245, 158, 11, 0.2)',
                  border: `1px solid ${
                    effectiveCompletedTrip.expenseStatus === 'SETTLED' ||
                    effectiveCompletedTrip.expenseStatus === 'PAID'
                      ? '#10b981'
                      : '#f59e0b'
                  }`,
                  color:
                    effectiveCompletedTrip.expenseStatus === 'SETTLED' ||
                    effectiveCompletedTrip.expenseStatus === 'PAID'
                      ? '#34d399'
                      : '#fbbf24',
                  borderRadius: '6px',
                  padding: '2px 7px',
                  fontSize: '10px',
                  fontWeight: 800,
                }}
              >
                {effectiveCompletedTrip.expenseStatus === 'SETTLED' ||
                effectiveCompletedTrip.expenseStatus === 'PAID'
                  ? 'ĐÃ ĐỐI SOÁT & THANH TOÁN'
                  : effectiveCompletedTrip.expenseStatus === 'PENDING'
                  ? 'CHỜ ĐỐI SOÁT VÀ THANH TOÁN'
                  : '100% người lái (Chờ đối soát)'}
              </span>
            </div>

            {effectiveCompletedTrip.returnVerifiedByUserName && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10.5px',
                  color: '#94a3b8',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  paddingTop: '6px',
                  marginTop: '2px',
                }}
              >
                <span>Nhân viên tiếp nhận:</span>
                <strong style={{ color: '#cbd5e1' }}>
                  {effectiveCompletedTrip.returnVerifiedByUserName}
                </strong>
              </div>
            )}

            {effectiveCompletedTrip.returnNote && (
              <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                Ghi chú tiếp nhận: "{effectiveCompletedTrip.returnNote}"
              </div>
            )}
          </div>

          {/* 6.6 ACTION BUTTONS: VIEW HISTORY & BACK TO CAR */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setShowHistoryView(true)}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(2, 132, 199, 0.35) 100%)',
                border: '1px solid rgba(0, 242, 254, 0.45)',
                borderRadius: '12px',
                padding: '11px 12px',
                color: '#00f2fe',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(0, 242, 254, 0.2)',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 242, 254, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 242, 254, 0.2)';
              }}
            >
              <History size={14} color="#00f2fe" />
              <span>XEM LỊCH SỬ CHUYẾN ĐI</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '11px 12px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <ArrowLeft size={14} />
              <span>QUAY LẠI XE</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
