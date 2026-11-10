import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { TripData } from '../../../types/trip';
import { fetchActiveTripForVehicle, requestTripReturnApi } from '../../../services/tripApi';
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

  // Authoritative real active trip query
  const {
    data: activeTrip,
    isLoading,
    isError,
    refetch,
  } = useQuery<TripData | null>({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    enabled: !!vehicle.id,
    refetchInterval: 3000,
  });

  const displayName = resolveVehicleDisplayName(vehicle);
  const displayCode = resolveVehicleCode(vehicle);

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
  const bookingTimeRange = useMemo(() => {
    if (!activeTrip?.bookingStartTime || !activeTrip?.bookingEndTime) return '--:-- - --:--';
    return `${formatClockTime(activeTrip.bookingStartTime)} - ${formatClockTime(activeTrip.bookingEndTime)}`;
  }, [activeTrip?.bookingStartTime, activeTrip?.bookingEndTime]);

  // Verified distance: Never fabricate live while active; show authoritative value once verified
  const distanceDisplay = useMemo(() => {
    if (!activeTrip) return '-- km';
    if (activeTrip.distanceTraveled != null && activeTrip.distanceTraveled > 0) {
      return `${activeTrip.distanceTraveled} km`;
    }
    if (activeTrip.distanceKm != null && activeTrip.distanceKm > 0) {
      return `${activeTrip.distanceKm} km`;
    }
    if (activeTrip.status === 'COMPLETED' && activeTrip.endOdometer != null && activeTrip.startOdometer != null) {
      const diff = Number(activeTrip.endOdometer) - Number(activeTrip.startOdometer);
      return `${Math.max(0, diff).toFixed(1)} km`;
    }
    return '-- km (Chờ nhân viên chốt ODO)';
  }, [activeTrip]);

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
        right: '24px',
        width: '420px',
        maxWidth: 'calc(100vw - 48px)',
        maxHeight: 'calc(100vh - 96px)',
        overflowY: 'auto',
        background: 'rgba(7, 20, 38, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 242, 254, 0.40)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 25px rgba(0, 242, 254, 0.20)',
        borderRadius: '24px',
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
            CHI TIẾT CHUYẾN ĐI
          </h2>

          {activeTrip && (
            <span
              style={{
                background: isReturnRequested
                  ? 'rgba(245, 158, 11, 0.2)'
                  : activeTrip.status === 'COMPLETED'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(0, 242, 254, 0.2)',
                border: `1px solid ${
                  isReturnRequested
                    ? '#f59e0b'
                    : activeTrip.status === 'COMPLETED'
                    ? '#10b981'
                    : '#00f2fe'
                }`,
                borderRadius: '9999px',
                padding: '2px 8px',
                fontSize: '9.5px',
                fontWeight: 800,
                color: isReturnRequested
                  ? '#fbbf24'
                  : activeTrip.status === 'COMPLETED'
                  ? '#34d399'
                  : '#00f2fe',
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
              {isReturnRequested
                ? 'ĐANG CHỜ TIẾP NHẬN XE'
                : activeTrip.status === 'COMPLETED'
                ? 'HOÀN TẤT'
                : 'ĐANG DIỄN RA'}
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
      {isLoading && (
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

      {/* 3. ERROR OR NO ACTIVE TRIP STATE */}
      {!isLoading && (isError || !activeTrip) && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1.2px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#f87171' }}>
            <AlertTriangle size={18} />
            <strong style={{ fontSize: '13px' }}>
              {isError ? 'KHÔNG THỂ KẾT NỐI MÁY CHỦ' : 'KHÔNG CÓ CHUYẾN ĐI ĐANG DIỄN RA'}
            </strong>
          </div>
          <p style={{ fontSize: '11.5px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
            {isError
              ? 'Không thể tải thông tin chuyến đi. Vui lòng thử lại.'
              : `Xe ${displayName} (${vehicle.licensePlate || displayCode}) hiện không có chuyến đi nào đang hoạt động.`}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            {isError && (
              <button
                type="button"
                onClick={() => refetch()}
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
                }}
              >
                THỬ LẠI
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

      {/* 4. ACTIVE TRIP CONTENT */}
      {!isLoading && activeTrip && (
        <>
          {/* 4.1 LIVE ELAPSED TIMER TICKER */}
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

          {/* 4.2 BOOKING INFORMATION CARD */}
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

          {/* 4.3 ODOMETER & BATTERY SNAPSHOTS (READ-ONLY) */}
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

          {/* 4.4 DISTANCE STATUS CARD */}
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

          {/* 4.5 RETURN REQUEST ACTION OR STATUS */}
          {activeTrip.status === 'COMPLETED' ? (
            /* COMPLETED TRIP & SETTLEMENT SUMMARY */
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.22) 100%)',
                border: '1.2px solid rgba(16, 185, 129, 0.5)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '13px', fontWeight: 900 }}>
                <CheckCircle2 size={18} color="#34d399" />
                <span>TRẢ XE HOÀN TẤT & ĐỐI SOÁT CHI PHÍ</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div style={{ background: 'rgba(7, 20, 38, 0.65)', padding: '8px 10px', borderRadius: '8px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '10px' }}>ODO khi nhận lại:</div>
                  <strong style={{ color: '#38bdf8', fontSize: '13px' }}>
                    {activeTrip.endOdometer != null ? `${Number(activeTrip.endOdometer).toLocaleString('vi-VN')} km` : '-- km'}
                  </strong>
                </div>
                <div style={{ background: 'rgba(7, 20, 38, 0.65)', padding: '8px 10px', borderRadius: '8px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '10px' }}>Mức pin kết thúc:</div>
                  <strong style={{ color: '#34d399', fontSize: '13px' }}>
                    {activeTrip.endBatteryLevel != null ? `${activeTrip.endBatteryLevel}%` : (activeTrip.endSocPercent != null ? `${activeTrip.endSocPercent}%` : '--%')}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', background: 'rgba(7, 20, 38, 0.5)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Điện năng tiêu thụ:</span>
                  <strong style={{ color: '#00f2fe' }}>
                    {activeTrip.energyConsumedKwh != null
                      ? `${activeTrip.energyConsumedKwh.toFixed(1)} kWh`
                      : activeTrip.startBatteryLevel != null && activeTrip.endBatteryLevel != null
                      ? `${Math.max(0, (activeTrip.startBatteryLevel - activeTrip.endBatteryLevel) * 0.65).toFixed(1)} kWh`
                      : '-- kWh'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Chi phí điện phát sinh:</span>
                  <strong style={{ color: '#fbbf24' }}>
                    {activeTrip.verifiedExpenseAmount != null
                      ? `${Number(activeTrip.verifiedExpenseAmount).toLocaleString('vi-VN')} VND`
                      : activeTrip.energyConsumedKwh != null
                      ? `${Math.round(activeTrip.energyConsumedKwh * 3000).toLocaleString('vi-VN')} VND`
                      : '-- VND'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Phân bổ chi phí:</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>100% người lái (Chờ thanh toán)</span>
                </div>
                {activeTrip.returnVerifiedByUserName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '2px' }}>
                    <span>Xác nhận bởi nhân viên:</span>
                    <span style={{ color: '#cbd5e1' }}>{activeTrip.returnVerifiedByUserName}</span>
                  </div>
                )}
              </div>
            </div>
          ) : showReturnConfirm ? (
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

          {/* 4.6 SECONDARY ACTION: QUAY LẠI XE */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '10px 16px',
              color: '#cbd5e1',
              fontSize: '12px',
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
            <ArrowLeft size={14} />
            <span>QUAY LẠI XE</span>
          </button>
        </>
      )}
    </aside>
  );
};

