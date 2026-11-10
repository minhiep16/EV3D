import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { Booking } from '../../../types/booking';
import { createVehicleBooking } from '../../../services/bookingApi';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import {
  resolveVehicleCode,
  resolveVehicleDisplayName,
} from '../vehicles/vehicleModelConfig';
import {
  Calendar,
  Clock,
  Car,
  CheckCircle,
  AlertTriangle,
  X,
  Sparkles,
  Loader2,
  FileText,
  ArrowLeft,
  Zap,
} from 'lucide-react';

export type BookingPanelState = 'SELECTING' | 'SUBMITTING' | 'SUCCESS' | 'ERROR';

export interface CoOwnerBookingPanelProps {
  vehicle: VehicleResponse;
  onClose?: () => void;
}

export const CoOwnerBookingPanel: React.FC<CoOwnerBookingPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // Single Source of Truth: Read active selection directly from 3D calendar store
  const selectedDate = useWorldStore((state) => state.bookingSelectedDate);
  const startHour = useWorldStore((state) => state.bookingStartHour);
  const endHour = useWorldStore((state) => state.bookingEndHour);
  const clearBookingSelection = useWorldStore((state) => state.clearBookingSelection);
  const inspectedBooking = useWorldStore((state) => state.bookingInspectedBooking);
  const setBookingInspectedBooking = useWorldStore((state) => state.setBookingInspectedBooking);
  const returnToVehicleOverview = useWorldStore((state) => state.returnToVehicleOverview);
  const exitVehicleBookingMode = useWorldStore((state) => state.exitVehicleBookingMode);
  const openGaragePanel = useWorldStore((state) => state.openGaragePanel);

  const [panelState, setPanelState] = useState<BookingPanelState>('SELECTING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  const hasSelection = startHour !== null && endHour !== null;
  const durationHours = hasSelection ? Math.max(1, endHour - startHour) : 0;

  const isInspectedUserBooking = useMemo(() => {
    if (!inspectedBooking || !user) return false;
    return Boolean(
      (inspectedBooking.userId && inspectedBooking.userId === user.id) ||
      (user.email && inspectedBooking.userEmail && inspectedBooking.userEmail === user.email)
    );
  }, [inspectedBooking, user]);

  const inspectedBookingDateStr = useMemo(() => {
    if (!inspectedBooking?.startTime) return '';
    try {
      const d = new Date(inspectedBooking.startTime);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return '';
    }
  }, [inspectedBooking]);

  const inspectedBookingTimeRangeStr = useMemo(() => {
    if (!inspectedBooking?.startTime || !inspectedBooking?.endTime) return '';
    try {
      const s = new Date(inspectedBooking.startTime);
      const e = new Date(inspectedBooking.endTime);
      const sStr = `${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`;
      const eStr = `${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}`;
      return `${sStr} – ${eStr}`;
    } catch {
      return '';
    }
  }, [inspectedBooking]);

  const vehicleCode = resolveVehicleCode(vehicle);
  const vehicleName = resolveVehicleDisplayName(vehicle, vehicleCode);
  const licensePlate = vehicle.licensePlate || '30A-999.83';
  const batteryLevel = vehicle.currentBatteryLevel ?? 85;
  const estimatedRangeKm = Math.round((batteryLevel / 100) * 450);

  const isVehicleMaintenance = vehicle.status === 'MAINTENANCE';
  const isVehicleInUse = vehicle.status === 'IN_USE';

  const operationalStatus = useMemo(() => {
    if (isVehicleMaintenance) {
      return { label: 'BẢO DƯỠNG KỸ THUẬT', color: '#f59e0b', dotColor: '#fbbf24' };
    }
    if (isVehicleInUse) {
      return { label: 'ĐANG SỬ DỤNG', color: '#00f2fe', dotColor: '#38bdf8' };
    }
    return { label: 'SẴN SÀNG', color: '#10b981', dotColor: '#34d399' };
  }, [isVehicleMaintenance, isVehicleInUse]);

  const baseDate = useMemo(() => {
    return selectedDate instanceof Date && !isNaN(selectedDate.getTime())
      ? selectedDate
      : new Date(selectedDate || Date.now());
  }, [selectedDate]);

  const isTodayDate = useMemo(() => {
    const today = new Date();
    return (
      baseDate.getDate() === today.getDate() &&
      baseDate.getMonth() === today.getMonth() &&
      baseDate.getFullYear() === today.getFullYear()
    );
  }, [baseDate]);

  const formatVietnameseDate = (date: Date) => {
    try {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '--/--/----';
    }
  };

  const getWeekdayName = (date: Date) => {
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return dayNames[date.getDay()];
  };

  const startTimeStr = hasSelection ? `${String(startHour).padStart(2, '0')}:00` : '--:--';
  const endTimeStr = hasSelection ? `${String(endHour).padStart(2, '0')}:00` : '--:--';

  const handleClose = () => {
    clearBookingSelection();
    setBookingInspectedBooking(null);
    exitVehicleBookingMode();
    setPanelState('SELECTING');
    setCreatedBooking(null);
    if (onClose) {
      onClose();
    } else {
      returnToVehicleOverview();
    }
  };

  const handleConfirm = async () => {
    if (startHour === null || endHour === null) return;
    if (panelState === 'SUBMITTING' || panelState === 'SUCCESS') return;

    setPanelState('SUBMITTING');
    setErrorMessage(null);

    try {
      const startTime = new Date(baseDate);
      startTime.setHours(startHour, 0, 0, 0);

      const endTime = new Date(baseDate);
      endTime.setHours(endHour, 0, 0, 0);

      const created = await createVehicleBooking(vehicle.id, {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        purpose: 'Đặt lịch sử dụng xe điện ' + vehicleName,
      });

      setCreatedBooking(created);
      setPanelState('SUCCESS');

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleBookings', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleBookings'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers'] }),
        queryClient.invalidateQueries({ queryKey: ['bookingHandover'] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers'] }),
        queryClient.invalidateQueries({ queryKey: ['tripEligibility'] }),
        queryClient.invalidateQueries({ queryKey: ['bookingTrip'] }),
      ]);
    } catch (err: any) {
      setPanelState('ERROR');
      setErrorMessage(err.message || 'Khung giờ này đã được đặt. Vui lòng chọn thời gian khác.');
    }
  };

  return (
    <aside
      aria-label="Đặt lịch sử dụng xe"
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '76px',
        right: '24px',
        width: 'clamp(340px, 24vw, 400px)',
        maxHeight: 'calc(100vh - 96px)',
        background: 'rgba(7, 20, 38, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(168, 85, 247, 0.45)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(168, 85, 247, 0.2)',
        borderRadius: '18px',
        padding: '20px',
        color: '#ffffff',
        fontFamily: 'var(--font-family, sans-serif)',
        zIndex: 40,
        pointerEvents: 'auto',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        gap: '14px',
      }}
    >
      {/* 1. Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#c084fc',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            <Sparkles size={13} />
            <span>LỊCH ĐẶT TRƯỚC CHO ĐỒNG SỞ HỮU</span>
          </div>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 800,
              margin: 0,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            ĐẶT LỊCH SỬ DỤNG XE
          </h2>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          title="Đóng bảng đặt xe"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            flexShrink: 0,
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
      </div>

      {/* 2. Vehicle Information Card */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Car size={16} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                {vehicleName}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Biển số: <strong style={{ color: '#cbd5e1' }}>{licensePlate}</strong></span>
                <span>•</span>
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {vehicleCode}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${operationalStatus.color}40`,
              padding: '3px 8px',
              borderRadius: '9999px',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: operationalStatus.dotColor,
                boxShadow: `0 0 6px ${operationalStatus.dotColor}`,
              }}
            />
            <span style={{ fontSize: '10px', fontWeight: 800, color: operationalStatus.color }}>
              {operationalStatus.label}
            </span>
          </div>
        </div>

        {/* Battery & Range Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '6px',
            fontSize: '11px',
            color: '#94a3b8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Zap size={13} color="#22e6ff" />
            <span>Pin hiện tại: <strong style={{ color: '#22e6ff' }}>{batteryLevel}%</strong></span>
          </div>
          <div>
            <span>Tầm hoạt động: <strong style={{ color: '#f8fafc' }}>~{estimatedRangeKm} km</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Booking Summary Card (Single Source of Truth from 3D Calendar) */}
      <div
        style={{
          background: inspectedBooking
            ? 'rgba(239, 68, 68, 0.10)'
            : hasSelection
            ? 'rgba(168, 85, 247, 0.12)'
            : 'rgba(255, 255, 255, 0.03)',
          border: inspectedBooking
            ? '1.5px solid rgba(239, 68, 68, 0.45)'
            : hasSelection
            ? '1.5px solid rgba(168, 85, 247, 0.45)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: inspectedBooking
            ? '0 0 20px rgba(239, 68, 68, 0.15)'
            : hasSelection
            ? '0 0 20px rgba(168, 85, 247, 0.15)'
            : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color={inspectedBooking ? '#f87171' : hasSelection ? '#c084fc' : '#94a3b8'} />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: inspectedBooking ? '#fca5a5' : hasSelection ? '#c084fc' : '#94a3b8',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {inspectedBooking ? 'CHI TIẾT LỊCH ĐÃ ĐẶT' : 'TỔNG HỢP LỊCH ĐẶT XE'}
            </span>
          </div>

          {inspectedBooking ? (
            <span
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(248, 113, 113, 0.5)',
                color: '#fca5a5',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 800,
              }}
            >
              ĐÃ CÓ LỊCH
            </span>
          ) : hasSelection && (
            <span
              style={{
                background: 'rgba(168, 85, 247, 0.25)',
                border: '1px solid rgba(192, 132, 252, 0.5)',
                color: '#f3e8ff',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              {durationHours} giờ
            </span>
          )}
        </div>

        {inspectedBooking ? (
          /* State 2: Occupied slot selected */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            {/* Vehicle info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
              <strong style={{ color: '#f8fafc', fontWeight: 700 }}>
                {vehicleName} ({licensePlate})
              </strong>
            </div>

            {/* Selected Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Ngày sử dụng:</span>
              <strong style={{ color: '#f8fafc', fontWeight: 700 }}>
                {inspectedBookingDateStr || formatVietnameseDate(baseDate)}
              </strong>
            </div>

            {/* Selected Time Interval */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Khung giờ:</span>
              <strong style={{ color: '#fca5a5', fontSize: '13px', fontWeight: 800 }}>
                {inspectedBookingTimeRangeStr || '13:00 – 15:00'}
              </strong>
            </div>

            {/* Booking Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Trạng thái:</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#34d399',
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#34d399',
                    boxShadow: '0 0 6px #34d399',
                  }}
                />
                ĐÃ XÁC NHẬN
              </span>
            </div>

            {/* Ownership & Context details */}
            <div
              style={{
                marginTop: '4px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {isInspectedUserBooking ? (
                <>
                  <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '11.5px' }}>
                    👤 Người đặt: Bạn ({user?.fullName || inspectedBooking.userName || 'Bạn'})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingInspectedBooking(null);
                      exitVehicleBookingMode();
                      openGaragePanel('MY_BOOKINGS', { vehicleId: vehicle.id });
                    }}
                    style={{
                      marginTop: '4px',
                      width: '100%',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>XEM LỊCH ĐẶT CỦA TÔI</span>
                    <span>→</span>
                  </button>
                </>
              ) : (
                <>
                  <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '11.5px' }}>
                    👤 Người đặt: Thành viên đồng sở hữu
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                    Thông tin liên hệ được ẩn để bảo mật quyền riêng tư.
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#f87171', fontWeight: 600 }}>
                    Khung giờ này không còn khả dụng để đặt lịch.
                  </div>
                </>
              )}

              {/* Button to clear inspected slot */}
              <button
                type="button"
                onClick={() => setBookingInspectedBooking(null)}
                style={{
                  marginTop: '4px',
                  width: '100%',
                  padding: '6px 10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <span>BỎ CHỌN KHUNG GIỜ NÀY</span>
              </button>
            </div>
          </div>
        ) : hasSelection ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            {/* Selected Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Ngày sử dụng:</span>
              <strong style={{ color: '#f8fafc', fontWeight: 700 }}>
                {isTodayDate ? `Hôm nay (${formatVietnameseDate(baseDate)})` : `${getWeekdayName(baseDate)}, ${formatVietnameseDate(baseDate)}`}
              </strong>
            </div>

            {/* Selected Time Interval */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Thời gian:</span>
              <strong style={{ color: '#c084fc', fontSize: '13px', fontWeight: 800 }}>
                {startTimeStr} – {endTimeStr}
              </strong>
            </div>

            {/* Duration */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Thời lượng:</span>
              <strong style={{ color: '#38bdf8', fontWeight: 700 }}>
                {durationHours} giờ
              </strong>
            </div>

            {/* Booking Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Trạng thái:</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#34d399',
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#34d399',
                    boxShadow: '0 0 6px #34d399',
                  }}
                />
                Sẵn sàng xác nhận
              </span>
            </div>
          </div>
        ) : (
          /* Empty selection guidance per Section 4 */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px dashed rgba(56, 189, 248, 0.35)',
              borderRadius: '10px',
              color: '#38bdf8',
              fontSize: '11.5px',
              lineHeight: 1.5,
            }}
          >
            <Clock size={18} color="#00f2fe" style={{ flexShrink: 0 }} />
            <span>Chọn ngày và khung giờ trực tiếp trên lịch 3D để đặt xe.</span>
          </div>
        )}
      </div>

      {/* 4. Error Banner */}
      {panelState === 'ERROR' && errorMessage && (
        <div
          style={{
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '10px',
            color: '#f87171',
            fontSize: '11px',
            lineHeight: 1.4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, marginBottom: '2px' }}>
            <AlertTriangle size={14} />
            <span>{errorMessage.includes('đã được đặt') ? 'KHUNG GIỜ NÀY ĐÃ ĐƯỢC ĐẶT' : 'KHÔNG THỂ ĐẶT XE'}</span>
          </div>
          <div>{errorMessage}</div>
        </div>
      )}

      {/* 5. Success State */}
      {panelState === 'SUCCESS' && createdBooking && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1.5px solid rgba(16, 185, 129, 0.5)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
            <CheckCircle size={18} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 900 }}>ĐẶT LỊCH THÀNH CÔNG!</div>
              <div style={{ fontSize: '10.5px', color: '#cbd5e1' }}>Mã đặt lịch: {createdBooking.id.substring(0, 8).toUpperCase()}</div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.5, background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '8px' }}>
            <div>Phương tiện: <strong>{vehicleName}</strong></div>
            <div>Thời gian: <strong>{formatVietnameseDate(new Date(createdBooking.startTime))} ({new Date(createdBooking.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(createdBooking.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})</strong></div>
            <div>Trạng thái: <strong style={{ color: '#34d399' }}>ĐÃ XÁC NHẬN</strong></div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => {
                exitVehicleBookingMode();
                openGaragePanel('MY_BOOKINGS', { vehicleId: vehicle.id });
              }}
              style={{
                flex: 1,
                padding: '9px 12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              <FileText size={13} />
              <span>XEM LỊCH CỦA TÔI</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPanelState('SELECTING');
                clearBookingSelection();
                setCreatedBooking(null);
              }}
              style={{
                flex: 1,
                padding: '9px 12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ĐẶT LỊCH KHÁC
            </button>
          </div>
        </div>
      )}

      {/* 6. Action Buttons */}
      {panelState !== 'SUCCESS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
          {/* Primary Action Button: XÁC NHẬN ĐẶT LỊCH (Disabled when inspecting an already booked slot) */}
          <button
            type="button"
            disabled={!hasSelection || Boolean(inspectedBooking) || panelState === 'SUBMITTING'}
            onClick={handleConfirm}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: !hasSelection || Boolean(inspectedBooking)
                ? 'rgba(75, 85, 99, 0.35)'
                : panelState === 'SUBMITTING'
                ? 'rgba(168, 85, 247, 0.4)'
                : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
              border: !hasSelection || Boolean(inspectedBooking) ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #c084fc',
              borderRadius: '10px',
              color: !hasSelection || Boolean(inspectedBooking) ? '#64748b' : '#ffffff',
              fontFamily: 'inherit',
              fontSize: '12.5px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: !hasSelection || Boolean(inspectedBooking) || panelState === 'SUBMITTING' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: hasSelection && !inspectedBooking ? '0 4px 18px rgba(168, 85, 247, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {panelState === 'SUBMITTING' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>ĐANG XÁC NHẬN...</span>
              </>
            ) : inspectedBooking ? (
              <>
                <AlertTriangle size={16} />
                <span>KHUNG GIỜ ĐÃ ĐƯỢC ĐẶT</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>XÁC NHẬN ĐẶT LỊCH</span>
              </>
            )}
          </button>

          {/* Secondary Action: If an occupied slot is inspected, offer quick unselect / choose another slot */}
          {inspectedBooking && (
            <button
              type="button"
              onClick={() => setBookingInspectedBooking(null)}
              style={{
                width: '100%',
                padding: '9px 16px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '10px',
                color: '#fca5a5',
                fontFamily: 'inherit',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>CHỌN KHUNG GIỜ KHÁC</span>
            </button>
          )}

          {/* Navigation Action Button: QUAY LẠI XE */}
          <button
            type="button"
            disabled={panelState === 'SUBMITTING'}
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '10px',
              color: '#cbd5e1',
              fontFamily: 'inherit',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: panelState === 'SUBMITTING' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              if (panelState !== 'SUBMITTING') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <ArrowLeft size={14} />
            <span>QUAY LẠI XE</span>
          </button>
        </div>
      )}
    </aside>
  );
};
