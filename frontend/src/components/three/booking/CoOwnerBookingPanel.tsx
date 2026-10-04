import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { Booking } from '../../../types/booking';
import { fetchVehicleBookings, createVehicleBooking } from '../../../services/bookingApi';
import { useWorldStore } from '../../../store/worldStore';
import {
  Calendar,
  Clock,
  Car,
  CheckCircle,
  AlertTriangle,
  X,
  Sparkles,
  Loader2,
  Info,
} from 'lucide-react';

export interface CoOwnerBookingPanelProps {
  vehicle: VehicleResponse;
  onClose?: () => void;
}

export const CoOwnerBookingPanel: React.FC<CoOwnerBookingPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const queryClient = useQueryClient();

  const selectedDate = useWorldStore((state) => state.bookingSelectedDate);
  const startHour = useWorldStore((state) => state.bookingStartHour);
  const endHour = useWorldStore((state) => state.bookingEndHour);
  const clearBookingSelection = useWorldStore((state) => state.clearBookingSelection);
  const returnToVehicleOverview = useWorldStore((state) => state.returnToVehicleOverview);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasSelection = startHour !== null && endHour !== null;
  const durationHours = hasSelection ? Math.max(1, endHour - startHour) : 0;

  const vehicleName = vehicle.name || 'EV01 - VinFast VF e34';

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['bookings', vehicle.id],
    queryFn: () => fetchVehicleBookings(vehicle.id),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 45,
  });

  const formatVietnameseDate = (date: Date | string | null | undefined) => {
    try {
      const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date(date || Date.now());
      if (isNaN(d.getTime())) return '--/--/----';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '--/--/----';
    }
  };

  const startTimeStr = hasSelection ? `${String(startHour).padStart(2, '0')}:00` : '--:--';
  const endTimeStr = hasSelection ? `${String(endHour).padStart(2, '0')}:00` : '--:--';

  const handleClose = () => {
    clearBookingSelection();
    if (onClose) {
      onClose();
    } else {
      returnToVehicleOverview();
    }
  };

  const handleCancel = () => {
    clearBookingSelection();
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleConfirm = async () => {
    if (startHour === null || endHour === null) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const baseDate = selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date(selectedDate || Date.now());
      const startTime = new Date(baseDate);
      startTime.setHours(startHour, 0, 0, 0);

      const endTime = new Date(baseDate);
      endTime.setHours(endHour, 0, 0, 0);

      await createVehicleBooking(vehicle.id, {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        purpose: 'Đặt lịch sử dụng xe điện ' + vehicleName,
      });

      setSuccessMessage('ĐẶT XE THÀNH CÔNG');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleBookings', vehicle.id] }),
      ]);

      setTimeout(() => {
        clearBookingSelection();
        setSuccessMessage(null);
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Khung giờ này đã được đặt. Vui lòng chọn thời gian khác.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '88px',
        right: '24px',
        width: 'clamp(340px, 24vw, 420px)',
        maxHeight: 'calc(100vh - 120px)',
        background: 'rgba(8, 12, 22, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(168, 85, 247, 0.55)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.25)',
        borderRadius: '16px',
        padding: '22px',
        color: '#ffffff',
        fontFamily: 'var(--font-family, sans-serif)',
        zIndex: 40,
        pointerEvents: 'auto',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Close Button */}
      <button
        type="button"
        onClick={handleClose}
        title="Đóng bảng đặt xe"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: 'none',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        <X size={15} />
      </button>

      {/* Header Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#c084fc',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}
      >
        <Sparkles size={14} />
        {hasSelection ? 'ĐẶT LỊCH XE' : 'HỆ THỐNG ĐẶT XE'}
      </div>

      <h3
        style={{
          fontSize: '19px',
          fontWeight: 800,
          margin: '0 0 16px 0',
          color: '#ffffff',
          letterSpacing: '-0.01em',
          lineHeight: '1.2',
        }}
      >
        {hasSelection ? 'Thông Tin Lịch Đặt' : 'Đặt Lịch Sử Dụng Xe'}
      </h3>

      {/* Vehicle & Date Info Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {/* Vehicle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
            <Car size={15} color="#38bdf8" />
            <span>Xe điện</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
            {vehicleName}
          </span>
        </div>

        {/* Date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
            <Calendar size={15} color="#c084fc" />
            <span>Ngày sử dụng</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
            {formatVietnameseDate(selectedDate)}
          </span>
        </div>

        {hasSelection && (
          <>
            {/* Time Range */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#c084fc' }}>
                <Clock size={15} />
                <span>Khung giờ</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#f3e8ff' }}>
                {startTimeStr} - {endTimeStr}
              </span>
            </div>

            {/* Duration */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Thời lượng</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                {durationHours} giờ
              </span>
            </div>
          </>
        )}
      </div>

      {/* Dynamic Section: Active Selection vs. Empty Guide */}
      {hasSelection ? (
        <>
          {/* Spatial Conflict Error Banner */}
          {errorMessage && (
            <div
              style={{
                marginBottom: '14px',
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '10px',
                color: '#f87171',
                fontSize: '11px',
                lineHeight: '1.4',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                <AlertTriangle size={14} />
                <span>{errorMessage.includes('đã được đặt') ? 'KHUNG GIỜ NÀY ĐÃ ĐƯỢC ĐẶT' : 'KHÔNG THỂ ĐẶT XE'}</span>
              </div>
              <div>Vui lòng chọn thời gian khác hoặc kiểm tra lại khung giờ khả dụng.</div>
            </div>
          )}

          {/* Success Notification Banner */}
          {successMessage && (
            <div
              style={{
                marginBottom: '14px',
                padding: '12px 14px',
                background: 'rgba(16, 185, 129, 0.18)',
                border: '1px solid rgba(16, 185, 129, 0.55)',
                borderRadius: '10px',
                color: '#34d399',
                fontSize: '11px',
                lineHeight: '1.4',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                <CheckCircle size={14} />
                <span>{successMessage}</span>
              </div>
              <div>Lịch đặt đã được đồng bộ vào hệ thống.</div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              style={{
                width: '100%',
                padding: '13px 16px',
                background: isSubmitting
                  ? 'rgba(168, 85, 247, 0.3)'
                  : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                border: '1px solid #c084fc',
                borderRadius: '10px',
                color: '#ffffff',
                fontFamily: 'inherit',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(168, 85, 247, 0.4)',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(168, 85, 247, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 18px rgba(168, 85, 247, 0.4)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="spin-animate" />
                  <span>ĐANG XÁC NHẬN...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>XÁC NHẬN ĐẶT XE</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCancel}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '10px',
                color: '#cbd5e1',
                fontFamily: 'inherit',
                fontSize: '11px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              HỦY LỰA CHỌN
            </button>
          </div>
        </>
      ) : (
        /* Empty / Guidance State when no slot is selected */
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Guide Info Box */}
          <div
            style={{
              padding: '14px',
              background: 'rgba(0, 242, 254, 0.06)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              borderRadius: '10px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              <Info size={15} />
              <span>CHỌN KHUNG GIỜ</span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
              Nhấp vào ô giờ trống trên thanh thời gian 3D để chọn khoảng thời gian bạn muốn sử dụng xe.
            </p>
          </div>

          {/* Steps List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#cbd5e1' }}>
              <span style={{ background: 'rgba(168, 85, 247, 0.3)', color: '#c084fc', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, flexShrink: 0 }}>
                1
              </span>
              <span>Chọn ngày trên thanh điều hướng ngày phía trên xe</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#cbd5e1' }}>
              <span style={{ background: 'rgba(168, 85, 247, 0.3)', color: '#c084fc', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, flexShrink: 0 }}>
                2
              </span>
              <span>Nhấp vào ô giờ bắt đầu, sau đó ô giờ kết thúc mong muốn</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#cbd5e1' }}>
              <span style={{ background: 'rgba(168, 85, 247, 0.3)', color: '#c084fc', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, flexShrink: 0 }}>
                3
              </span>
              <span>Kiểm tra lại thông tin và xác nhận đặt xe tại đây</span>
            </div>
          </div>

          {/* Color Legend */}
          <div
            style={{
              marginTop: 'auto',
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '10px',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Chú thích trạng thái
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span>Có thể đặt</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c084fc' }} />
                <span>Đang chọn</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                <span>Đã có lịch</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748b' }} />
                <span>Đã qua</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
