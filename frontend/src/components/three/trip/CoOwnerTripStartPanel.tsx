import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { TripData } from '../../../types/trip';
import { fetchActiveTripForVehicle, startTripApi } from '../../../services/tripApi';
import { useCoOwnerTripPrerequisites } from '../../../hooks/useCoOwnerTripPrerequisites';
import { useWorldStore } from '../../../store/worldStore';
import { resolveVehicleDisplayName, resolveVehicleCode } from '../vehicles/vehicleModelConfig';
import {
  Car,
  Clock,
  ShieldCheck,
  Battery,
  Gauge,
  Play,
  RotateCcw,
  Loader2,
  AlertTriangle,
  User,
  CheckCircle2,
  X,
  FileCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export interface CoOwnerTripStartPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

export const CoOwnerTripStartPanel: React.FC<CoOwnerTripStartPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const qc = useQueryClient();
  const enterVehicleTripVisualizationMode = useWorldStore((state) => state.enterVehicleTripVisualizationMode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch active trip for vehicle to detect ongoing trip or recent start
  const { data: activeTrip = null, isLoading: isTripLoading } = useQuery<TripData | null>({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    refetchInterval: 3000,
  });

  const isTripActive = Boolean(activeTrip && activeTrip.status === 'ACTIVE');

  // 2. Fetch authoritative CO_OWNER trip prerequisites
  const {
    candidateBooking,
    completedHandover,
    bookingHandover,
    tripEligibility,
    isLoading: isPrereqLoading,
    refetchEligibility,
  } = useCoOwnerTripPrerequisites(vehicle.id, isTripActive);

  // 3. Resolve stable bookingId
  const bookingId = completedHandover?.bookingId || candidateBooking?.id || activeTrip?.bookingId;

  // 4. Start Trip Mutation
  const startTripMutation = useMutation({
    mutationFn: async () => {
      if (!isTripActive && !completedHandover) {
        throw new Error('Chưa hoàn tất bàn giao xe từ nhân viên. Vui lòng liên hệ nhân viên garage.');
      }
      if (!bookingId) {
        throw new Error('Không tìm thấy lịch đặt xe hợp lệ.');
      }
      return await startTripApi(bookingId);
    },
    onSuccess: () => {
      setErrorMessage(null);
      qc.invalidateQueries({ queryKey: ['activeTrip', vehicle.id] });
      qc.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] });
      qc.invalidateQueries({ queryKey: ['vehicle', vehicle.id] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['vehicleBookings', vehicle.id] });
      qc.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] });
      if (bookingId) {
        qc.invalidateQueries({ queryKey: ['tripEligibility', bookingId] });
        qc.invalidateQueries({ queryKey: ['trip-start-eligibility', bookingId] });
        qc.invalidateQueries({ queryKey: ['bookingHandover', bookingId] });
        qc.invalidateQueries({ queryKey: ['booking-handover', bookingId] });
      }
      qc.invalidateQueries({ queryKey: ['bookingHandover'] });
      qc.invalidateQueries({ queryKey: ['booking-handover'] });
      qc.invalidateQueries({ queryKey: ['tripEligibility'] });
      qc.invalidateQueries({ queryKey: ['trip-start-eligibility'] });
      qc.invalidateQueries({ queryKey: ['bookingTrip'] });
      qc.invalidateQueries({ queryKey: ['booking-trip'] });
      qc.invalidateQueries({ queryKey: ['vehicle-handover-history', vehicle.id] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Không thể bắt đầu chuyến đi lúc này. Vui lòng kiểm tra lại điều kiện bàn giao.');
    },
  });

  const handleStartTrip = async () => {
    try {
      await startTripMutation.mutateAsync();
    } catch {
      // Error handled by mutation onError
    }
  };

  // Formatted date and time strings
  const timeRangeStr = useMemo(() => {
    const startStr = completedHandover?.bookingStartTime || candidateBooking?.startTime;
    const endStr = completedHandover?.bookingEndTime || candidateBooking?.endTime;
    if (!startStr || !endStr) return '--:-- - --:--';
    try {
      const s = new Date(startStr);
      const e = new Date(endStr);
      return `${s.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${e.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '--:-- - --:--';
    }
  }, [completedHandover, candidateBooking]);

  const bookingDateStr = useMemo(() => {
    const startStr = completedHandover?.bookingStartTime || candidateBooking?.startTime;
    if (!startStr) return 'Hôm nay';
    try {
      return new Date(startStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Hôm nay';
    }
  }, [completedHandover, candidateBooking]);

  const startedAtStr = useMemo(() => {
    if (!activeTrip?.startedAt) return '';
    try {
      const d = new Date(activeTrip.startedAt);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' (' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ')';
    } catch {
      return activeTrip.startedAt;
    }
  }, [activeTrip]);

  const displayName = resolveVehicleDisplayName(vehicle);
  const displayCode = resolveVehicleCode(vehicle);

  // Authorized start time (grace period of 30 mins before reserved start time)
  const authorizedStartTimeStr = useMemo(() => {
    const startStr = completedHandover?.bookingStartTime || candidateBooking?.startTime;
    if (!startStr) return null;
    try {
      const start = new Date(startStr);
      const earlyStart = new Date(start.getTime() - 30 * 60 * 1000);
      return earlyStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  }, [completedHandover, candidateBooking]);

  const isTooEarly = useMemo(() => {
    if (isTripActive) return false;
    if (tripEligibility?.reason === 'TOO_EARLY') return true;
    const startStr = completedHandover?.bookingStartTime || candidateBooking?.startTime;
    if (!startStr) return false;
    try {
      const start = new Date(startStr).getTime();
      const earliestAllowed = start - 30 * 60 * 1000;
      return Date.now() < earliestAllowed;
    } catch {
      return false;
    }
  }, [isTripActive, tripEligibility, completedHandover, candidateBooking]);

  const isEligible = Boolean(tripEligibility?.eligible) || isTripActive;
  const isPending = startTripMutation.isPending;

  // Snapshot values (never default to zero)
  const displayOdometer = useMemo(() => {
    if (isTripActive && activeTrip?.startOdometer != null) {
      return Number(activeTrip.startOdometer).toLocaleString();
    }
    if (tripEligibility?.currentOdometer != null) {
      return Number(tripEligibility.currentOdometer).toLocaleString();
    }
    if (vehicle.odometer != null) {
      return Number(vehicle.odometer).toLocaleString();
    }
    return '--';
  }, [isTripActive, activeTrip, tripEligibility, vehicle]);

  const displayBattery = useMemo(() => {
    if (isTripActive && activeTrip?.startBatteryLevel != null) {
      return `${activeTrip.startBatteryLevel}%`;
    }
    if (tripEligibility?.currentBatteryLevel != null) {
      return `${tripEligibility.currentBatteryLevel}%`;
    }
    if (vehicle.currentBatteryLevel != null) {
      return `${vehicle.currentBatteryLevel}%`;
    }
    return '--%';
  }, [isTripActive, activeTrip, tripEligibility, vehicle]);

  const isLoading = (isPrereqLoading || isTripLoading) && !activeTrip && !completedHandover;

  return (
    <aside
      role="complementary"
      aria-label="CoOwner Trip Start Panel"
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
        border: isTripActive
          ? '1.5px solid rgba(16, 185, 129, 0.55)'
          : '1.5px solid rgba(0, 242, 254, 0.40)',
        boxShadow: isTripActive
          ? '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 25px rgba(16, 185, 129, 0.22)'
          : '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 25px rgba(0, 242, 254, 0.20)',
        borderRadius: '24px',
        padding: '20px 22px',
        color: '#ffffff',
        fontFamily: 'var(--font-family, system-ui, sans-serif)',
        zIndex: 40,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Close Button (X) */}
      <button
        type="button"
        onClick={onClose}
        title="Quay lại xe"
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

      {/* 1. Header Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: isTripActive ? '#34d399' : '#00f2fe',
              textTransform: 'uppercase',
            }}
          >
            {isTripActive ? 'CHUYẾN ĐI ĐANG DIỄN RA' : 'BẮT ĐẦU CHUYẾN ĐI'}
          </span>
          <span
            style={{
              background: isTripActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 242, 254, 0.2)',
              border: isTripActive ? '1px solid #10b981' : '1px solid #00f2fe',
              color: isTripActive ? '#34d399' : '#00f2fe',
              borderRadius: '9999px',
              padding: '2px 8px',
              fontSize: '9.5px',
              fontWeight: 700,
            }}
          >
            {isTripActive ? 'ĐANG SỬ DỤNG' : 'SẴN SÀNG'}
          </span>
        </div>

        <div style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
          {displayName}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
          <span style={{ color: '#00e0c7', fontWeight: 800 }}>{displayCode}</span>
          <span>•</span>
          <span>{vehicle.licensePlate || 'Biển số đang cập nhật'}</span>
          {candidateBooking?.id && (
            <>
              <span>•</span>
              <span style={{ color: '#64748b' }}>Mã đặt: #{String(candidateBooking.id).slice(0, 8)}</span>
            </>
          )}
        </div>
      </div>

      {isLoading && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px dashed rgba(0, 242, 254, 0.35)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#38bdf8',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          <Loader2 size={16} className="animate-spin" color="#00f2fe" />
          <span>ĐANG KIỂM TRA ĐIỀU KIỆN KHỞI HÀNH...</span>
        </div>
      )}

      {/* 2. User & Booking Schedule Information */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} color="#38bdf8" />
            Người nhận xe:
          </span>
          <span style={{ fontWeight: 700, color: '#f1f5f9' }}>
            {completedHandover?.coOwnerName || candidateBooking?.user?.fullName || 'Đồng sở hữu'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} color="#38bdf8" />
            Lịch đặt xe:
          </span>
          <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{bookingDateStr}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>Khung giờ đăng ký:</span>
          <span style={{ fontWeight: 700, color: '#00f2fe' }}>{timeRangeStr}</span>
        </div>

        {candidateBooking?.purpose && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: '#94a3b8' }}>Mục đích:</span>
            <span style={{ fontWeight: 500, color: '#cbd5e1' }}>{candidateBooking.purpose}</span>
          </div>
        )}
      </div>

      {/* 3. Pre-Trip Staff Handover & Inspection Status */}
      <div
        style={{
          background: completedHandover
            ? 'rgba(16, 185, 129, 0.10)'
            : 'rgba(234, 179, 8, 0.10)',
          border: completedHandover
            ? '1px solid rgba(16, 185, 129, 0.35)'
            : '1px solid rgba(234, 179, 8, 0.35)',
          borderRadius: '16px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: completedHandover ? '#34d399' : '#facc15',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {completedHandover ? <CheckCircle2 size={14} /> : <Clock size={14} />}
            {completedHandover ? 'XE ĐÃ ĐƯỢC BÀN GIAO' : 'CHỜ NHÂN VIÊN BÀN GIAO'}
          </span>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: completedHandover ? '#10b981' : '#facc15',
            }}
          >
            {completedHandover?.status || 'PENDING'}
          </span>
        </div>

        <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
          {completedHandover
            ? `Nhân viên đã kiểm tra kỹ thuật và xác nhận xe sẵn sàng bàn giao.`
            : `Hồ sơ bàn giao đang chờ nhân viên kiểm tra xác nhận.`}
        </div>

        {completedHandover?.inspection && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10.5px',
              color: '#34d399',
              marginTop: '2px',
              paddingTop: '6px',
              borderTop: '1px dashed rgba(16, 185, 129, 0.25)',
            }}
          >
            <FileCheck size={13} />
            <span>Biên bản kiểm tra hợp lệ: SẴN SÀNG (8/8 bộ phận ĐẠT)</span>
          </div>
        )}
      </div>

      {/* 4. Vehicle Starting Telemetry Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '16px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
            <Battery size={14} color="#00f2fe" />
            <span>{isTripActive ? 'Pin lúc bắt đầu' : 'Mức pin khởi hành'}</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#00f2fe' }}>
            {displayBattery}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(168, 85, 247, 0.30)',
            borderRadius: '16px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
            <Gauge size={14} color="#c084fc" />
            <span>{isTripActive ? 'Odo lúc bắt đầu' : 'Odometer khởi hành'}</span>
          </div>
          <div style={{ fontSize: '17px', fontWeight: 900, color: '#c084fc' }}>
            {displayOdometer} km
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: '10px',
          color: '#64748b',
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        * Chỉ số Odometer và Mức pin được chốt làm căn cứ đối soát quãng đường và chia sẻ chi phí vận hành.
      </div>

      {/* 5A. Handover Done but Before Trip Start Window (Section 5) */}
      {!isTripActive && completedHandover && isTooEarly && (
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1.5px solid rgba(56, 189, 248, 0.45)',
            borderRadius: '16px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '11.5px', fontWeight: 800 }}>
            <Clock size={15} />
            <span>CHƯA ĐẾN GIỜ BẮT ĐẦU CHUYẾN ĐI</span>
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
            Xe đã được nhân viên hoàn tất bàn giao. Thời gian bắt đầu chuyến đi được phép từ{' '}
            <strong style={{ color: '#00f2fe' }}>{authorizedStartTimeStr || 'khung giờ đặt'}</strong>. Nút khởi hành sẽ tự động sẵn sàng khi đến giờ.
          </div>
        </div>
      )}

      {/* 5B. Other Ineligibility or Error Warning */}
      {!isTripActive && !isEligible && !isTooEarly && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            color: '#f87171',
            fontSize: '11.5px',
            lineHeight: '1.4',
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Chưa đủ điều kiện khởi hành</div>
            <div>{tripEligibility?.message || 'Chưa hoàn tất bàn giao xe từ nhân viên hoặc chưa đến giờ nhận xe.'}</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.20)',
            border: '1px solid rgba(239, 68, 68, 0.50)',
            borderRadius: '14px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fca5a5',
            fontSize: '11.5px',
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 6. Active Trip Ongoing Summary */}
      {isTripActive && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1.5px solid rgba(16, 185, 129, 0.45)',
            borderRadius: '16px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '12px', fontWeight: 800 }}>
            <CheckCircle2 size={16} />
            <span>CHUYẾN ĐI ĐANG DIỄN RA</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
            Thời điểm bắt đầu: <strong style={{ color: '#ffffff' }}>{startedAtStr}</strong>
          </div>
          <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
            Phương tiện đã được cấp quyền vận hành. Chúc bạn một lộ trình an toàn và thuận lợi!
          </div>

          <button
            type="button"
            onClick={() => enterVehicleTripVisualizationMode()}
            style={{
              marginTop: '4px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            <span>XEM TIẾN TRÌNH & TRẢ XE</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 7. Action Button Footer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        {!isTripActive && (
          <button
            type="button"
            disabled={isPending || !isEligible}
            onClick={handleStartTrip}
            style={{
              width: '100%',
              background: !isEligible
                ? 'rgba(75, 85, 99, 0.4)'
                : 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '13px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              cursor: isPending || !isEligible ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: !isEligible
                ? 'none'
                : '0 6px 20px rgba(6, 182, 212, 0.40)',
              opacity: isPending || !isEligible ? 0.6 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>ĐANG XỬ LÝ KHỞI HÀNH...</span>
              </>
            ) : isTooEarly ? (
              <>
                <Clock size={16} />
                <span>CHƯA ĐẾN GIỜ KHỞI HÀNH (TỪ {authorizedStartTimeStr || '--:--'})</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>BẮT ĐẦU CHUYẾN ĐI</span>
              </>
            )}
          </button>
        )}

        {/* Secondary Back Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            background: 'rgba(30, 41, 59, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '10px',
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.background = 'rgba(51, 65, 85, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'rgba(30, 41, 59, 0.65)';
          }}
        >
          <RotateCcw size={13} />
          <span>QUAY LẠI XE</span>
        </button>
      </div>
    </aside>
  );
};

