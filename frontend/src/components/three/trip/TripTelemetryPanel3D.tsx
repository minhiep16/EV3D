import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Billboard, Html } from '@react-three/drei';
import { useQueryClient } from '@tanstack/react-query';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';
import { TripData } from '../../../types/trip';
import { VehicleResponse } from '../../../types/vehicle';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { completeTripApi } from '../../../services/tripApi';
import {
  Car,
  Clock,
  Battery,
  Gauge,
  User,
  ArrowLeft,
  Activity,
  Navigation,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Flag,
  RotateCcw,
} from 'lucide-react';

export type CheckoutStep = 'TELEMETRY' | 'PREPARE_CHECKOUT' | 'CONFIRM_CHECKOUT' | 'CHECKOUT_COMPLETED';

interface TripTelemetryPanel3DProps {
  vehicle: VehicleResponse;
  trip: TripData;
  onBack: () => void;
  onTripCompleted?: (completedTrip: TripData) => void;
  initialStep?: CheckoutStep;
  panelPosition?: [number, number, number];
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

function formatDurationHms(totalSeconds?: number | null): string {
  if (totalSeconds == null || isNaN(totalSeconds) || totalSeconds < 0) return '--:--';
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const TripTelemetryPanel3D: React.FC<TripTelemetryPanel3DProps> = ({
  vehicle,
  trip: initialTrip,
  onBack,
  onTripCompleted,
  initialStep = 'TELEMETRY',
  panelPosition = [2.7, 1.45, 0],
}) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const selectedTripRouteNode = useWorldStore((state) => state.selectedTripRouteNode);

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(initialStep);
  const [activeTripState, setActiveTripState] = useState<TripData>(initialTrip);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if initialTrip changes (e.g. from outer query)
  useEffect(() => {
    setActiveTripState(initialTrip);
    if (initialTrip.status === 'COMPLETED' && checkoutStep !== 'CHECKOUT_COMPLETED') {
      setCheckoutStep('CHECKOUT_COMPLETED');
    }
  }, [initialTrip]);

  // Ownership verification: CO_OWNER must own the trip
  const isOwner = useMemo(() => {
    if (!user) return false;
    return (
      (!!user.id && activeTripState.userId === user.id) ||
      (!!user.email && activeTripState.userEmail === user.email)
    );
  }, [user, activeTripState.userId, activeTripState.userEmail]);

  // Client-side elapsed time calculation for live ticker
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (!activeTripState.startedAt) return 0;
    try {
      const started = new Date(activeTripState.startedAt).getTime();
      return Math.max(0, Math.floor((Date.now() - started) / 1000));
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (!activeTripState.startedAt || activeTripState.status === 'COMPLETED') return;
    const interval = setInterval(() => {
      try {
        const started = new Date(activeTripState.startedAt).getTime();
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));
      } catch {
        // Fallback
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTripState.startedAt, activeTripState.status]);

  const formattedElapsedTime = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [elapsedSeconds]);

  const startedAtFormatted = useMemo(() => {
    if (!activeTripState.startedAt) return '--:--:--';
    try {
      const d = new Date(activeTripState.startedAt);
      return (
        d.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) +
        ' (' +
        d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) +
        ')'
      );
    } catch {
      return activeTripState.startedAt;
    }
  }, [activeTripState.startedAt]);

  const bookingTimeRange = useMemo(() => {
    if (!activeTripState.bookingStartTime || !activeTripState.bookingEndTime) return '--:-- - --:--';
    try {
      const s = new Date(activeTripState.bookingStartTime).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const e = new Date(activeTripState.bookingEndTime).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${s} - ${e}`;
    } catch {
      return '--:-- - --:--';
    }
  }, [activeTripState.bookingStartTime, activeTripState.bookingEndTime]);

  // Execute End Trip / Check-out Mutation
  const handleConfirmCheckout = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const completed = await completeTripApi(activeTripState.id);
      setActiveTripState(completed);
      setCheckoutStep('CHECKOUT_COMPLETED');
      if (onTripCompleted) {
        onTripCompleted(completed);
      }

      // Targeted TanStack Query invalidation
      queryClient.invalidateQueries({ queryKey: ['activeTrip', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicleBookings', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicleRelevantBooking', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['handoverHistory', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['bookingHandover'] });
      queryClient.invalidateQueries({ queryKey: ['handoverByBooking'] });
      queryClient.invalidateQueries({ queryKey: ['tripEligibility'] });
      queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] });
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể hoàn tất trả xe. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, activeTripState.id, vehicle.id, queryClient, onTripCompleted]);

  // Frame theme color depending on checkout step
  const frameColor = useMemo(() => {
    switch (checkoutStep) {
      case 'PREPARE_CHECKOUT':
        return '#f59e0b';
      case 'CONFIRM_CHECKOUT':
        return '#ef4444';
      case 'CHECKOUT_COMPLETED':
        return '#10b981';
      default:
        return '#00f2fe';
    }
  }, [checkoutStep]);

  return (
    <group position={panelPosition}>
      <Billboard follow={true}>
        {/* Holographic Glowing Frame */}
        <HolographicPanelFrame3D width={2.85} height={4.6} color={frameColor} />

        <Html
          center
          distanceFactor={8.8}
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '330px',
              background: 'rgba(5, 14, 26, 0.95)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${frameColor}`,
              borderRadius: '16px',
              padding: '18px 20px',
              color: '#ffffff',
              boxShadow: `0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px ${frameColor}33`,
              boxSizing: 'border-box',
            }}
          >
            {/* VIEW 1: NORMAL TRIP TELEMETRY VIEW */}
            {checkoutStep === 'TELEMETRY' && (
              <>
                {/* Top Subtitle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  <Activity size={12} color="#00f2fe" />
                  <span>TRỰC QUAN HÓA CHUYẾN ĐI 3D</span>
                </div>

                {/* Header: Title & Vehicle Code */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '17px',
                      fontWeight: 800,
                      color: '#ffffff',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    CHUYẾN ĐI ĐANG DIỄN RA
                  </h3>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#00f2fe',
                      background: 'rgba(0, 242, 254, 0.15)',
                      border: '1px solid rgba(0, 242, 254, 0.35)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {activeTripState.vehicleCode || vehicle.model || vehicle.name || 'EV01'}
                  </span>
                </div>

                {/* User & Start Time Section */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
                      {activeTripState.userName || 'Thành viên nhóm'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Bắt đầu lúc:</span>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                      {startedAtFormatted}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Khung giờ đặt:</span>
                    <span style={{ color: '#00f2fe', fontWeight: 700 }}>
                      {bookingTimeRange}
                    </span>
                  </div>
                </div>

                {/* Elapsed Time Ticker */}
                <div
                  style={{
                    background: 'rgba(2, 132, 199, 0.18)',
                    border: '1px solid rgba(0, 242, 254, 0.45)',
                    boxShadow: '0 0 16px rgba(0, 242, 254, 0.15)',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    <Clock size={12} color="#00f2fe" />
                    <span>THỜI GIAN ĐÃ ĐI</span>
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 900,
                      color: '#00f2fe',
                      letterSpacing: '0.08em',
                      fontVariantNumeric: 'tabular-nums',
                      textShadow: '0 0 12px rgba(0, 242, 254, 0.6)',
                    }}
                  >
                    {formattedElapsedTime}
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#67e8f9', marginTop: '2px' }}>
                    Tính toán thời gian thực tại trình duyệt
                  </div>
                </div>

                {/* Initial Snapshot Telemetry */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  {/* Start Battery */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '10px',
                      padding: '9px 10px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '9.5px',
                        color: '#94a3b8',
                        marginBottom: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Battery size={11} color="#34d399" />
                      <span>PIN BẮT ĐẦU</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                      {activeTripState.startBatteryLevel}%
                    </div>
                  </div>

                  {/* Start Odometer */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '10px',
                      padding: '9px 10px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '9.5px',
                        color: '#94a3b8',
                        marginBottom: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Gauge size={11} color="#38bdf8" />
                      <span>ODO BẮT ĐẦU</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                      {Number(activeTripState.startOdometer).toLocaleString()} km
                    </div>
                  </div>
                </div>

                {/* Route Progress Status Node Info */}
                <div
                  style={{
                    background: 'rgba(8, 20, 36, 0.85)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '9.5px',
                      color: '#38bdf8',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    <Navigation size={11} color="#38bdf8" />
                    <span>ĐIỂM KIỂM SOÁT LỘ TRÌNH</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600 }}>
                    {selectedTripRouteNode === 'START'
                      ? 'Điểm bắt đầu — Trạm đỗ EVShare'
                      : selectedTripRouteNode === 'DESTINATION'
                      ? 'Điểm dự kiến — Điểm đến hành trình'
                      : 'Tiến trình hiện tại — Đang di chuyển'}
                  </div>
                </div>

                {/* Actions: KẾT THÚC CHUYẾN ĐI (Only for Trip Owner) & QUAY LẠI XE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('PREPARE_CHECKOUT')}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #e11d48 0%, #ef4444 100%)',
                        border: '1px solid #f43f5e',
                        boxShadow: '0 0 16px rgba(244, 63, 94, 0.4)',
                        borderRadius: '10px',
                        padding: '11px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 22px rgba(244, 63, 94, 0.7)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 16px rgba(244, 63, 94, 0.4)';
                      }}
                    >
                      <Flag size={14} />
                      <span>KẾT THÚC CHUYẾN ĐI</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onBack}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      padding: '11px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                      e.currentTarget.style.borderColor = '#00f2fe';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    <ArrowLeft size={14} />
                    <span>QUAY LẠI XE</span>
                  </button>
                </div>
              </>
            )}

            {/* VIEW 2: PREPARE CHECKOUT (Deliberate Step 1) */}
            {checkoutStep === 'PREPARE_CHECKOUT' && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: '#f59e0b',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  <Clock size={12} color="#f59e0b" />
                  <span>TRẢ XE • BƯỚC 1/2</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '17px',
                      fontWeight: 800,
                      color: '#ffffff',
                    }}
                  >
                    KẾT THÚC CHUYẾN ĐI
                  </h3>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#f59e0b',
                      background: 'rgba(245, 158, 11, 0.18)',
                      border: '1px solid rgba(245, 158, 11, 0.45)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {activeTripState.vehicleCode || vehicle.model || vehicle.name || 'EV01'}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    lineHeight: 1.45,
                    margin: '0 0 14px 0',
                  }}
                >
                  Bạn đang chuẩn bị trả xe <strong style={{ color: '#ffffff' }}>{activeTripState.vehicleCode || vehicle.name || 'EV01'}</strong>.
                </p>

                {/* Summary Parameters Box */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '11.5px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Bắt đầu:</span>
                    <strong style={{ color: '#ffffff' }}>
                      {formatClockTime(activeTripState.startedAt)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Thời gian đã sử dụng:</span>
                    <strong style={{ color: '#00f2fe', fontVariantNumeric: 'tabular-nums' }}>
                      {formattedElapsedTime}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Pin lúc bắt đầu:</span>
                    <strong style={{ color: '#34d399' }}>
                      {activeTripState.startBatteryLevel}%
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Odometer lúc bắt đầu:</span>
                    <strong style={{ color: '#f8fafc' }}>
                      {Number(activeTripState.startOdometer).toLocaleString()} km
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '10px',
                    padding: '9px 11px',
                    marginBottom: '14px',
                    fontSize: '10.5px',
                    color: '#fbbf24',
                    lineHeight: 1.4,
                  }}
                >
                  Vui lòng đỗ xe đúng vị trí quy định và kiểm tra tư trang cá nhân trước khi xác nhận trả xe.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('CONFIRM_CHECKOUT')}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                      border: '1px solid #f59e0b',
                      boxShadow: '0 0 16px rgba(245, 158, 11, 0.35)',
                      borderRadius: '10px',
                      padding: '11px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>TIẾP TỤC TRẢ XE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutStep('TELEMETRY')}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      padding: '10px',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <ArrowLeft size={13} />
                    <span>QUAY LẠI</span>
                  </button>
                </div>
              </>
            )}

            {/* VIEW 3: CONFIRM CHECKOUT (Deliberate Step 2 with Idempotency Protection) */}
            {checkoutStep === 'CONFIRM_CHECKOUT' && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: '#ef4444',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  <AlertTriangle size={12} color="#ef4444" />
                  <span>XÁC NHẬN TRẢ XE • BƯỚC 2/2</span>
                </div>

                <h3
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1.3,
                  }}
                >
                  XÁC NHẬN KẾT THÚC CHUYẾN ĐI?
                </h3>

                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '14px',
                    fontSize: '11.5px',
                    color: '#fca5a5',
                    lineHeight: 1.5,
                  }}
                >
                  Sau khi xác nhận, chuyến đi hiện tại sẽ được kết thúc. Hệ thống sẽ chốt thông số pin và số km từ cảm biến xe {activeTripState.vehicleCode || vehicle.name || 'EV01'}.
                </div>

                {errorMessage && (
                  <div
                    style={{
                      background: 'rgba(153, 27, 27, 0.5)',
                      border: '1px solid #ef4444',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      marginBottom: '14px',
                      fontSize: '11px',
                      color: '#fecaca',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertTriangle size={15} color="#ef4444" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmCheckout}
                    style={{
                      width: '100%',
                      background: isSubmitting
                        ? 'rgba(239, 68, 68, 0.4)'
                        : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      border: '1px solid #ef4444',
                      boxShadow: isSubmitting ? 'none' : '0 0 18px rgba(239, 68, 68, 0.5)',
                      borderRadius: '10px',
                      padding: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>ĐANG HOÀN TẤT TRẢ XE...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>XÁC NHẬN TRẢ XE</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setErrorMessage(null);
                      setCheckoutStep('PREPARE_CHECKOUT');
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      padding: '10px',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      opacity: isSubmitting ? 0.5 : 1,
                    }}
                  >
                    <ArrowLeft size={13} />
                    <span>QUAY LẠI</span>
                  </button>
                </div>
              </>
            )}

            {/* VIEW 4: CHECKOUT COMPLETED SUMMARY (Pure 3D Snapshot) */}
            {checkoutStep === 'CHECKOUT_COMPLETED' && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: '#34d399',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  <Sparkles size={12} color="#10b981" />
                  <span>KẾT THÚC THÀNH CÔNG</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '17px',
                      fontWeight: 800,
                      color: '#ffffff',
                    }}
                  >
                    TRẢ XE HOÀN TẤT
                  </h3>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {activeTripState.vehicleCode || vehicle.model || vehicle.name || 'EV01'}
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#a7f3d0' }}>Chuyến đi:</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <CheckCircle2 size={13} color="#34d399" />
                    HOÀN THÀNH
                  </span>
                </div>

                {/* Detailed Authoritative Snapshot Grid */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '7px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Bắt đầu:</span>
                    <strong style={{ color: '#ffffff' }}>
                      {formatClockTime(activeTripState.startedAt)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Kết thúc:</span>
                    <strong style={{ color: '#ffffff' }}>
                      {formatClockTime(activeTripState.endedAt)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Thời gian:</span>
                    <strong style={{ color: '#00f2fe' }}>
                      {formatDurationHms(activeTripState.durationSeconds ?? elapsedSeconds)}
                    </strong>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: '6px',
                      marginTop: '2px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ color: '#94a3b8' }}>Pin bắt đầu (SOC):</span>
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                      {activeTripState.startBatteryLevel}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Pin kết thúc (SOC):</span>
                    <strong style={{ color: '#34d399' }}>
                      {activeTripState.endSocPercent != null
                        ? `${activeTripState.endSocPercent}%`
                        : activeTripState.endBatteryLevel != null
                        ? `${activeTripState.endBatteryLevel}%`
                        : `${activeTripState.startBatteryLevel}%`}
                    </strong>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: '6px',
                      marginTop: '2px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ color: '#94a3b8' }}>Odometer bắt đầu:</span>
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                      {Number(activeTripState.startOdometer).toLocaleString()} km
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Odometer kết thúc:</span>
                    <strong style={{ color: '#f8fafc' }}>
                      {activeTripState.endOdometer != null
                        ? `${Number(activeTripState.endOdometer).toLocaleString()} km`
                        : `${Number(activeTripState.startOdometer).toLocaleString()} km`}
                    </strong>
                  </div>

                  {activeTripState.distanceTraveled != null && (
                    <div
                      style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingTop: '6px',
                        marginTop: '2px',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ color: '#94a3b8' }}>Quãng đường:</span>
                      <strong style={{ color: '#38bdf8' }}>
                        {activeTripState.distanceTraveled} km
                      </strong>
                    </div>
                  )}

                  {activeTripState.socConsumedPercent != null ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Pin tiêu thụ (SOC):</span>
                      <strong style={{ color: '#f59e0b' }}>
                        {activeTripState.socConsumedPercent}%
                      </strong>
                    </div>
                  ) : activeTripState.batteryUsed != null ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Pin tiêu thụ:</span>
                      <strong style={{ color: '#f59e0b' }}>
                        {activeTripState.batteryUsed}%
                      </strong>
                    </div>
                  ) : null}

                  {activeTripState.energyConsumedKwh != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Năng lượng tiêu thụ:</span>
                      <strong style={{ color: '#10b981' }}>
                        {activeTripState.energyConsumedKwh} kWh
                      </strong>
                    </div>
                  )}

                  {activeTripState.energyConsumptionKwhPer100Km != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Định mức tiêu thụ:</span>
                      <span style={{ color: '#67e8f9', fontWeight: 600 }}>
                        {activeTripState.energyConsumptionKwhPer100Km} kWh/100km
                      </span>
                    </div>
                  )}

                  {activeTripState.usableBatteryCapacityKwh != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Dung lượng pin khả dụng:</span>
                      <span style={{ color: '#a7f3d0', fontWeight: 600 }}>
                        {activeTripState.usableBatteryCapacityKwh} kWh
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onBack}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    border: '1px solid #10b981',
                    boxShadow: '0 0 16px rgba(16, 185, 129, 0.35)',
                    borderRadius: '10px',
                    padding: '11px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>QUAY LẠI XE</span>
                </button>
              </>
            )}
          </div>
        </Html>
      </Billboard>
    </group>
  );
};
