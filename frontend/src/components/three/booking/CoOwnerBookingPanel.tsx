import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { Booking } from '../../../types/booking';
import { createVehicleBooking, cancelBooking, fetchVehicleBookings } from '../../../services/bookingApi';
import { fetchBookingHandover } from '../../../services/handoverApi';
import { fetchIncidentForBooking } from '../../../services/disputeApi';
import { VehicleHandoverData } from '../../../types/handover';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import {
  resolveVehicleCode,
  resolveVehicleDisplayName,
} from '../vehicles/vehicleModelConfig';
import { EVCarLoader } from '../../common/EVCarLoader';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  History,
  Trash2,
  User,
  Scale,
  Moon,
  Plus,
  Minus,
} from 'lucide-react';
import { MyBookingsPanel } from '../vehicles/MyBookingsPanel';

export type BookingPanelState = 'SELECTING' | 'SUBMITTING' | 'SUCCESS' | 'ERROR';

export interface CoOwnerBookingPanelProps {
  vehicle: VehicleResponse;
  onClose?: () => void;
  initialTab?: 'BOOKING' | 'HISTORY';
}

export const CoOwnerBookingPanel: React.FC<CoOwnerBookingPanelProps> = ({
  vehicle,
  onClose,
  initialTab = 'BOOKING',
}) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<'BOOKING' | 'HISTORY'>(initialTab);

  // Single Source of Truth: Read active selection directly from 3D calendar store
  const selectedDate = useWorldStore((state) => state.bookingSelectedDate);
  const startHour = useWorldStore((state) => state.bookingStartHour);
  const endHour = useWorldStore((state) => state.bookingEndHour);
  const setBookingSlot = useWorldStore((state) => state.setBookingSlot);
  const clearBookingSelection = useWorldStore((state) => state.clearBookingSelection);
  const inspectedBooking = useWorldStore((state) => state.bookingInspectedBooking);
  const setBookingInspectedBooking = useWorldStore((state) => state.setBookingInspectedBooking);
  const returnToVehicleOverview = useWorldStore((state) => state.returnToVehicleOverview);
  const exitVehicleBookingMode = useWorldStore((state) => state.exitVehicleBookingMode);
  const openDisputePanelWithPrefill = useWorldStore((state) => state.openDisputePanelWithPrefill);

  const [panelState, setPanelState] = useState<BookingPanelState>('SELECTING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // TanStack Query: Fetch all bookings for conflict check and duration adjustments
  const { data: vehicleBookings = [] } = useQuery<Booking[]>({
    queryKey: ['bookings', vehicle.id],
    queryFn: () => fetchVehicleBookings(vehicle.id),
    enabled: Boolean(vehicle?.id),
    staleTime: 5000,
  });

  const hasSelection = startHour !== null && endHour !== null;
  const durationHours = hasSelection && startHour !== null && endHour !== null ? Math.max(1, endHour - startHour) : 0;
  const isOvernight = hasSelection && endHour !== null && endHour >= 24;

  const isInspectedUserBooking = useMemo(() => {
    if (!inspectedBooking || !user) return false;
    return Boolean(
      (inspectedBooking.userId && inspectedBooking.userId === user.id) ||
      (user.email && inspectedBooking.userEmail && inspectedBooking.userEmail === user.email)
    );
  }, [inspectedBooking, user]);

  const bookerName = useMemo(() => {
    if (!inspectedBooking) return '';
    if (isInspectedUserBooking) {
      return user?.fullName || inspectedBooking.userName || user?.email || 'Bạn';
    }
    return inspectedBooking.userName || 'Thành viên đồng sở hữu';
  }, [inspectedBooking, isInspectedUserBooking, user]);

  // Check for auto-detected delay incident on inspected booking
  const { data: bookingIncident } = useQuery({
    queryKey: ['bookingIncident', inspectedBooking?.id],
    queryFn: () => (inspectedBooking?.id ? fetchIncidentForBooking(inspectedBooking.id) : null),
    enabled: Boolean(inspectedBooking?.id && isInspectedUserBooking),
    refetchInterval: 15000,
  });

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
      const isNextDay =
        e.getDate() !== s.getDate() ||
        e.getMonth() !== s.getMonth() ||
        e.getFullYear() !== s.getFullYear();
      return isNextDay ? `${sStr} – ${eStr} (+1 ngày)` : `${sStr} – ${eStr}`;
    } catch {
      return '';
    }
  }, [inspectedBooking]);

  // Fetch handover status for inspected booking strictly scoped by booking ID
  const { data: inspectedHandover } = useQuery<VehicleHandoverData | null>({
    queryKey: ['booking-handover', inspectedBooking?.id],
    queryFn: () => (inspectedBooking?.id ? fetchBookingHandover(inspectedBooking.id) : Promise.resolve(null)),
    enabled: Boolean(inspectedBooking?.id),
    staleTime: 5000,
  });

  const inspectedHandoverStatus = useMemo(() => {
    if (!inspectedBooking?.startTime) return { label: 'Chờ xử lý', color: '#94a3b8' };
    const start = new Date(inspectedBooking.startTime).getTime();
    const isFutureBeforeWindow = !isNaN(start) && Date.now() < start - 120 * 60 * 1000;
    if (isFutureBeforeWindow) {
      return {
        label: 'Chưa đến khung giờ bàn giao',
        color: '#38bdf8',
      };
    }
    if (
      inspectedBooking?.status === 'COMPLETED' ||
      inspectedHandover?.status === 'COMPLETED'
    ) {
      const isEarlyReturn = Boolean(
        inspectedBooking?.originalEndTime &&
        new Date(inspectedBooking.originalEndTime).getTime() > new Date(inspectedBooking.endTime).getTime()
      );
      return {
        label: isEarlyReturn ? 'Đã trả xe sớm (Đã giải phóng khung giờ còn lại)' : 'Chuyến đi đã hoàn tất',
        color: '#10b981',
      };
    }
    if (
      inspectedHandover?.status === 'HANDED_OVER' ||
      inspectedHandover?.status === 'OWNER_CONFIRMED'
    ) {
      return {
        label: 'Xe đã được bàn giao',
        color: '#10b981',
      };
    }
    if (inspectedHandover?.status === 'READY_FOR_HANDOVER') {
      return {
        label: 'Sẵn sàng bàn giao',
        color: '#fbbf24',
      };
    }
    return {
      label: 'Chờ nhân viên chuẩn bị xe',
      color: '#f59e0b',
    };
  }, [inspectedBooking, inspectedHandover]);

  const canCancelBooking = useMemo(() => {
    if (!isInspectedUserBooking || !inspectedBooking) return false;
    if (inspectedBooking.status && inspectedBooking.status !== 'CONFIRMED') return false;
    if (
      inspectedHandover?.status === 'HANDED_OVER' ||
      inspectedHandover?.status === 'OWNER_CONFIRMED' ||
      inspectedHandover?.status === 'COMPLETED'
    ) {
      return false;
    }
    return true;
  }, [isInspectedUserBooking, inspectedBooking, inspectedHandover]);

  const vehicleCode = resolveVehicleCode(vehicle);
  const vehicleName = resolveVehicleDisplayName(vehicle, vehicleCode);
  const licensePlate = vehicle.licensePlate || '30A-999.83';

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

  const startTimeStr = hasSelection && startHour !== null
    ? `${String(startHour).padStart(2, '0')}:00`
    : '--:--';

  const endTimeStr = useMemo(() => {
    if (!hasSelection || endHour === null) return '--:--';
    if (endHour === 24) return '00:00 (+1 ngày)';
    if (endHour > 24) {
      const nextHour = endHour % 24;
      const days = Math.floor(endHour / 24);
      return `${String(nextHour).padStart(2, '0')}:00 (+${days} ngày)`;
    }
    return `${String(endHour).padStart(2, '0')}:00`;
  }, [hasSelection, endHour]);

  const endFormattedDate = useMemo(() => {
    if (!hasSelection || endHour === null) return null;
    const d = new Date(baseDate);
    d.setHours(endHour, 0, 0, 0);
    return formatVietnameseDate(d);
  }, [hasSelection, endHour, baseDate]);

  const canExtendDuration = useMemo(() => {
    if (startHour === null || endHour === null) return false;
    const nextEnd = endHour + 1;
    if (nextEnd - startHour > 24) return false;

    const startTime = new Date(baseDate);
    startTime.setHours(startHour, 0, 0, 0);
    const endTime = new Date(baseDate);
    endTime.setHours(nextEnd, 0, 0, 0);

    const sTs = startTime.getTime();
    const eTs = endTime.getTime();

    return !vehicleBookings.some((b) => {
      if (b.status === 'CANCELLED' || b.status === 'EXPIRED') return false;
      if (b.status === 'COMPLETED') {
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();
        const effectiveEnd = Math.min(bEnd, Date.now());
        return bStart < eTs && effectiveEnd > sTs;
      }
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return bStart < eTs && bEnd > sTs;
    });
  }, [startHour, endHour, baseDate, vehicleBookings]);

  const canDecreaseDuration = useMemo(() => {
    if (startHour === null || endHour === null) return false;
    return endHour - startHour > 1;
  }, [startHour, endHour]);

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

      if (endTime.getTime() <= startTime.getTime()) {
        throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu.');
      }

      const hasConflict = vehicleBookings.some((b) => {
        if (b.status === 'CANCELLED' || b.status === 'EXPIRED') return false;
        if (b.status === 'COMPLETED') {
          const bStart = new Date(b.startTime).getTime();
          const bEnd = new Date(b.endTime).getTime();
          const effectiveEnd = Math.min(bEnd, Date.now());
          return bStart < endTime.getTime() && effectiveEnd > startTime.getTime();
        }
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();
        return bStart < endTime.getTime() && bEnd > startTime.getTime();
      });

      if (hasConflict) {
        throw new Error('Khoảng thời gian này đã bị trùng với lịch đặt khác của xe.');
      }

      const created = await createVehicleBooking(vehicle.id, {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        purpose: 'Đặt lịch sử dụng xe điện ' + vehicleName + (isOvernight ? ' (Qua đêm)' : ''),
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

  const handleCancelBooking = async () => {
    if (!inspectedBooking?.id || isCancelling) return;
    setIsCancelling(true);
    setErrorMessage(null);
    try {
      await cancelBooking(inspectedBooking.id);
      setCancelSuccessMsg('Lịch đặt đã được hủy thành công.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleBookings'] }),
        queryClient.invalidateQueries({ queryKey: ['myBookings'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers'] }),
        queryClient.invalidateQueries({ queryKey: ['booking-handover'] }),
      ]);
      setTimeout(() => {
        setBookingInspectedBooking(null);
        setShowCancelConfirm(false);
        setCancelSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể hủy lịch đặt. Vui lòng thử lại sau.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <aside
      aria-label="Đặt lịch sử dụng xe"
      data-ui-interactive="true"
      className="evshare-standard-panel"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '76px',
        right: '20px',
        width: 'clamp(400px, 26vw, 460px)',
        maxWidth: 'min(460px, calc(100vw - 32px))',
        height: 'auto',
        maxHeight: 'min(78vh, calc(100vh - 128px))',
        background: 'rgba(7, 20, 38, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 242, 254, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(0, 242, 254, 0.16)',
        borderRadius: '20px',
        padding: '16px 18px',
        color: '#ffffff',
        fontFamily: 'var(--font-family, sans-serif)',
        zIndex: 40,
        pointerEvents: 'auto',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        gap: '12px',
        scrollbarWidth: 'thin',
      }}
    >
      {/* 1. Header with Compact Vehicle Context */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 800,
              margin: 0,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Calendar size={18} color="#c084fc" />
            <span>{activeTab === 'BOOKING' ? 'ĐẶT LỊCH SỬ DỤNG XE' : 'LỊCH SỬ ĐẶT LỊCH'}</span>
          </h2>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{vehicleName}</span>
            <span>•</span>
            <span
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              {vehicleCode}
            </span>
            <span>•</span>
            <span style={{ color: '#94a3b8' }}>{licensePlate}</span>
          </div>
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
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
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

      {/* Tab Switcher: Tab 1 "Đặt lịch" & Tab 2 "Lịch sử đặt lịch" */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('BOOKING')}
          style={{
            padding: '7px 12px',
            borderRadius: '8px',
            border: activeTab === 'BOOKING' ? '1px solid rgba(192, 132, 252, 0.5)' : '1px solid transparent',
            background: activeTab === 'BOOKING' ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(147, 51, 234, 0.15))' : 'transparent',
            color: activeTab === 'BOOKING' ? '#e9d5ff' : '#94a3b8',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Calendar size={14} color={activeTab === 'BOOKING' ? '#c084fc' : '#94a3b8'} />
          <span>Đặt lịch</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          style={{
            padding: '7px 12px',
            borderRadius: '8px',
            border: activeTab === 'HISTORY' ? '1px solid rgba(0, 242, 254, 0.5)' : '1px solid transparent',
            background: activeTab === 'HISTORY' ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(6, 182, 212, 0.1))' : 'transparent',
            color: activeTab === 'HISTORY' ? '#00f2fe' : '#94a3b8',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <History size={14} color={activeTab === 'HISTORY' ? '#00f2fe' : '#94a3b8'} />
          <span>Lịch sử đặt lịch</span>
        </button>
      </div>

      {activeTab === 'HISTORY' ? (
        <MyBookingsPanel
          vehicle={vehicle}
          embedded={true}
          onSwitchToBookingTab={() => setActiveTab('BOOKING')}
        />
      ) : (
        <>
          {inspectedBooking ? (
            /* State A: Occupied slot selected (My booking or Other member's booking) */
            <div
              style={{
                background: isInspectedUserBooking
                  ? 'rgba(88, 28, 135, 0.22)'
                  : 'rgba(92, 29, 29, 0.22)',
                border: isInspectedUserBooking
                  ? '1.5px solid rgba(192, 132, 252, 0.5)'
                  : '1.5px solid rgba(239, 68, 68, 0.45)',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: isInspectedUserBooking
                  ? '0 0 20px rgba(168, 85, 247, 0.18)'
                  : '0 0 20px rgba(239, 68, 68, 0.15)',
              }}
            >
              {/* Top Booker Row: Full Name & Ownership Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isInspectedUserBooking ? 'rgba(192, 132, 252, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      border: isInspectedUserBooking ? '1px solid rgba(192, 132, 252, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <User size={15} color={isInspectedUserBooking ? '#c084fc' : '#f87171'} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Người đặt
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: isInspectedUserBooking ? '#e9d5ff' : '#fecaca',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={bookerName}
                    >
                      {bookerName}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    background: isInspectedUserBooking ? 'rgba(168, 85, 247, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                    border: isInspectedUserBooking ? '1px solid rgba(192, 132, 252, 0.5)' : '1px solid rgba(248, 113, 113, 0.5)',
                    color: isInspectedUserBooking ? '#f3e8ff' : '#fca5a5',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {isInspectedUserBooking ? 'LỊCH CỦA BẠN' : 'LỊCH THÀNH VIÊN KHÁC'}
                </span>
              </div>

              {/* Booking Details Compact Table */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '7px',
                  fontSize: '11.5px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                {/* Schedule row: Date and Time in one row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Thời gian:</span>
                  <strong style={{ color: '#ffffff', fontWeight: 700 }}>
                    {inspectedBookingDateStr || formatVietnameseDate(baseDate)} • {inspectedBookingTimeRangeStr || '—'}
                  </strong>
                </div>

                {/* Vehicle row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                  <strong style={{ color: '#f8fafc', fontWeight: 600 }}>
                    {vehicleCode} • {licensePlate}
                  </strong>
                </div>

                {/* Booking Code */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Mã đặt lịch:</span>
                  <strong style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>
                    {inspectedBooking.id ? `#${inspectedBooking.id.slice(0, 8).toUpperCase()}` : '—'}
                  </strong>
                </div>

                {/* Booking Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Trạng thái:</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      padding: '1px 7px',
                      borderRadius: '9999px',
                      fontSize: '10px',
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
                    {inspectedBooking.status === 'CONFIRMED' || !inspectedBooking.status ? 'ĐÃ XÁC NHẬN' : inspectedBooking.status}
                  </span>
                </div>

                {/* Handover Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Bàn giao:</span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: inspectedHandoverStatus.color,
                      textAlign: 'right',
                      maxWidth: '220px',
                    }}
                  >
                    {inspectedHandoverStatus.label}
                  </span>
                </div>
              </div>

              {/* Confirmed Handover Delay Incident Alert */}
              {isInspectedUserBooking && bookingIncident && bookingIncident.state === 'CONFIRMED_IMPACT' && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1.5px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '8px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} color="#f87171" />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#f87171' }}>
                      CHẬM TRỄ BÀN GIAO XE ĐÃ XÁC NHẬN
                    </span>
                  </div>
                  <p style={{ fontSize: '10.5px', color: '#fed7aa', margin: 0, lineHeight: 1.4 }}>
                    Chuyến đi trước đã chậm trễ thực tế, ảnh hưởng trực tiếp đến giờ nhận xe của bạn. Bạn có thể gửi yêu cầu giải quyết tranh chấp.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingInspectedBooking(null);
                      exitVehicleBookingMode();
                      openDisputePanelWithPrefill(vehicle.id, bookingIncident.prefilledDispute);
                    }}
                    style={{
                      marginTop: '2px',
                      padding: '7px 10px',
                      background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(225, 29, 72, 0.35)',
                    }}
                  >
                    <Scale size={13} />
                    <span>YÊU CẦU GIẢI QUYẾT TRANH CHẤP</span>
                  </button>
                </div>
              )}

              {/* Potential Handover Risk Notice (Advisory Only) */}
              {isInspectedUserBooking && bookingIncident && (bookingIncident.state === 'POTENTIAL_CONFLICT' || bookingIncident.state === 'AWAITING_CONFIRMATION') && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={14} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '10.5px', color: '#fde68a', lineHeight: 1.4 }}>
                    <strong style={{ color: '#fbbf24' }}>Lưu ý:</strong> Chuyến đi trước có thể ảnh hưởng đến khung giờ này. Hệ thống đang theo dõi và sẽ cập nhật trạng thái khi xe về bãi.
                  </div>
                </div>
              )}

              {/* Cancellation feedback */}
              {cancelSuccessMsg && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#34d399',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle size={14} />
                  <span>{cancelSuccessMsg}</span>
                </div>
              )}

              {/* Contextual Actions */}
              {isInspectedUserBooking ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                  {showCancelConfirm ? (
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 700 }}>
                        Bạn có chắc chắn muốn hủy lịch đặt này?
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          disabled={isCancelling}
                          onClick={handleCancelBooking}
                          style={{
                            flex: 1,
                            padding: '7px 10px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: isCancelling ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          {isCancelling ? <EVCarLoader variant="inline" message="Đang hủy..." /> : (
                            <>
                              <Trash2 size={12} />
                              <span>XÁC NHẬN HỦY</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isCancelling}
                          onClick={() => setShowCancelConfirm(false)}
                          style={{
                            padding: '7px 10px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            color: '#cbd5e1',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          ĐÓNG
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingInspectedBooking(null);
                          setActiveTab('HISTORY');
                        }}
                        style={{
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
                        <FileText size={13} />
                        <span>XEM LỊCH ĐẶT CỦA TÔI</span>
                      </button>

                      {canCancelBooking && (
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(true)}
                          style={{
                            width: '100%',
                            padding: '7px 12px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            borderRadius: '8px',
                            color: '#fca5a5',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Trash2 size={12} />
                          <span>HỦY LỊCH ĐẶT</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setBookingInspectedBooking(null)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#94a3b8',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        BỎ CHỌN KHUNG GIỜ
                      </button>
                    </>
                  )}
                </div>
              ) : (
                /* Another member's booking: Read-only details + 1 button */
                <div style={{ marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setBookingInspectedBooking(null)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '8px',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>BỎ CHỌN KHUNG GIỜ</span>
                  </button>
                </div>
              )}
            </div>
          ) : hasSelection ? (
            /* State B: Available slot selected */
            <div
              style={{
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1.5px solid rgba(168, 85, 247, 0.45)',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="#c084fc" />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#c084fc',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    KHUNG GIỜ KHẢ DỤNG
                  </span>
                </div>
                <span
                  style={{
                    background: isOvernight ? 'rgba(99, 102, 241, 0.35)' : 'rgba(168, 85, 247, 0.25)',
                    border: isOvernight ? '1px solid rgba(129, 140, 248, 0.6)' : '1px solid rgba(192, 132, 252, 0.5)',
                    color: isOvernight ? '#e0e7ff' : '#f3e8ff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  {durationHours} giờ{isOvernight ? ' • Qua đêm' : ''}
                </span>
              </div>

              {/* Duration adjustments: Stepper and quick overnight options */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Thời lượng thuê xe:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={!canDecreaseDuration}
                    onClick={() => startHour !== null && endHour !== null && setBookingSlot(startHour, endHour - 1)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: canDecreaseDuration ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: canDecreaseDuration ? '#ffffff' : '#64748b',
                      cursor: canDecreaseDuration ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 800,
                    }}
                    title="Giảm 1 giờ"
                  >
                    <Minus size={13} />
                  </button>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#f3e8ff', minWidth: '42px', textAlign: 'center' }}>
                    {durationHours}h
                  </span>
                  <button
                    type="button"
                    disabled={!canExtendDuration}
                    onClick={() => startHour !== null && endHour !== null && setBookingSlot(startHour, endHour + 1)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: canExtendDuration ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                      border: canExtendDuration ? '1px solid rgba(192, 132, 252, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: canExtendDuration ? '#f3e8ff' : '#64748b',
                      cursor: canExtendDuration ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 800,
                    }}
                    title="Tăng 1 giờ"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Quick overnight chip for evening starts */}
              {startHour !== null && startHour >= 18 && !isOvernight && (
                <button
                  type="button"
                  onClick={() => {
                    const targetEnd = 30; // 06:00 next day
                    let safeEnd = targetEnd;
                    while (safeEnd > (endHour || startHour + 1)) {
                      const startTime = new Date(baseDate);
                      startTime.setHours(startHour, 0, 0, 0);
                      const endTime = new Date(baseDate);
                      endTime.setHours(safeEnd, 0, 0, 0);
                      const conflict = vehicleBookings.some((b) => {
                        if (b.status === 'CANCELLED' || b.status === 'EXPIRED') return false;
                        const bStart = new Date(b.startTime).getTime();
                        const bEnd = new Date(b.endTime).getTime();
                        return bStart < endTime.getTime() && bEnd > startTime.getTime();
                      });
                      if (!conflict) break;
                      safeEnd--;
                    }
                    if (safeEnd > startHour) {
                      setBookingSlot(startHour, safeEnd);
                    }
                  }}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(129, 140, 248, 0.4)',
                    borderRadius: '8px',
                    color: '#a5b4fc',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Moon size={12} />
                  <span>Chọn nhanh qua đêm (đến 06:00 sáng mai)</span>
                </button>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '7px',
                  fontSize: '11.5px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Ngày bắt đầu:</span>
                  <strong style={{ color: '#f8fafc', fontWeight: 700 }}>
                    {isTodayDate ? `Hôm nay (${formatVietnameseDate(baseDate)})` : `${getWeekdayName(baseDate)}, ${formatVietnameseDate(baseDate)}`}
                  </strong>
                </div>

                {isOvernight && endFormattedDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>Ngày trả xe:</span>
                    <strong style={{ color: '#818cf8', fontWeight: 700 }}>
                      {endFormattedDate} ({endTimeStr})
                    </strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Khung giờ:</span>
                  <strong style={{ color: '#c084fc', fontSize: '13px', fontWeight: 800 }}>
                    {startTimeStr} – {endTimeStr}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                  <strong style={{ color: '#f8fafc', fontWeight: 600 }}>
                    {vehicleCode} • {licensePlate}
                  </strong>
                </div>

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

              {/* Action buttons for available slot */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <button
                  type="button"
                  disabled={panelState === 'SUBMITTING'}
                  onClick={handleConfirm}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    background: panelState === 'SUBMITTING'
                      ? 'rgba(168, 85, 247, 0.4)'
                      : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                    border: '1px solid #c084fc',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    cursor: panelState === 'SUBMITTING' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 18px rgba(168, 85, 247, 0.4)',
                  }}
                >
                  {panelState === 'SUBMITTING' ? (
                    <EVCarLoader variant="button" message="ĐANG XÁC NHẬN..." />
                  ) : (
                    <>
                      <CheckCircle size={15} />
                      <span>XÁC NHẬN ĐẶT LỊCH</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={panelState === 'SUBMITTING'}
                  onClick={clearBookingSelection}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  BỎ CHỌN
                </button>
              </div>
            </div>
          ) : (
            /* State C: Empty selection guidance */
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 16px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px dashed rgba(56, 189, 248, 0.35)',
                borderRadius: '12px',
                color: '#38bdf8',
                fontSize: '11.5px',
                lineHeight: 1.5,
              }}
            >
              <Clock size={20} color="#00f2fe" style={{ flexShrink: 0 }} />
              <span>Chọn ngày và khung giờ trên lịch 3D hoặc bấm vào lượt đặt có sẵn để xem chi tiết.</span>
            </div>
          )}

          {/* Error Banner */}
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
                <span>KHÔNG THỂ ĐẶT XE</span>
              </div>
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Success State */}
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
                  <div style={{ fontSize: '10.5px', color: '#cbd5e1' }}>Mã đặt lịch: #{createdBooking.id.substring(0, 8).toUpperCase()}</div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.5, background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '8px' }}>
                <div>Phương tiện: <strong>{vehicleName} ({licensePlate})</strong></div>
                <div>Thời gian: <strong>{formatVietnameseDate(new Date(createdBooking.startTime))} ({new Date(createdBooking.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(createdBooking.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})</strong></div>
                <div>Trạng thái: <strong style={{ color: '#34d399' }}>ĐÃ XÁC NHẬN</strong></div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setPanelState('SELECTING');
                    setCreatedBooking(null);
                    setActiveTab('HISTORY');
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
        </>
      )}
    </aside>
  );
};
