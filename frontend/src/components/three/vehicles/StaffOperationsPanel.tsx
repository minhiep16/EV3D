import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import {
  VehicleHandoverData,
  VehicleHandoverEligibilityResponse,
  HANDOVER_ELIGIBILITY_CONFIG,
  HandoverEligibilityReason,
} from '../../../types/handover';
import { Booking } from '../../../types/booking';
import { TripData } from '../../../types/trip';
import { fetchActiveVehicleHandovers, fetchHandoverEligibility } from '../../../services/handoverApi';
import { fetchVehicleBookings } from '../../../services/bookingApi';
import { fetchActiveTripForVehicle, confirmTripReturnApi } from '../../../services/tripApi';
import { useQueryClient } from '@tanstack/react-query';
import { fetchVehicleDamages } from '../../../services/damageApi';
import { DamageRecordResponse } from '../../../types/damage';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';
import {
  Car,
  Zap,
  Clock,
  Calendar,
  X,
  ShieldCheck,
  Wrench,
  User,
  Mail,
  AlertTriangle,
  ClipboardList,
  AlertCircle,
  Gauge,
} from 'lucide-react';

function formatDate(isoString?: string): string {
  if (!isoString) return '--/--/----';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--/--/----';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '--/--/----';
  }
}

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '--:-- --/--/----';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:-- --/--/----';
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${time} ${day}/${month}/${year}`;
  } catch {
    return '--:-- --/--/----';
  }
}

function formatTimeRange(startIso?: string, endIso?: string): string {
  if (!startIso || !endIso) return '--:-- - --:--';
  try {
    const dStart = new Date(startIso);
    const dEnd = new Date(endIso);
    const sh = String(dStart.getHours()).padStart(2, '0');
    const sm = String(dStart.getMinutes()).padStart(2, '0');
    const eh = String(dEnd.getHours()).padStart(2, '0');
    const em = String(dEnd.getMinutes()).padStart(2, '0');
    return `${sh}:${sm} - ${eh}:${em}`;
  } catch {
    return '--:-- - --:--';
  }
}

function isTripOverdue(bookingEndTime?: string | null): boolean {
  if (!bookingEndTime) return false;
  try {
    const end = new Date(bookingEndTime).getTime();
    return !isNaN(end) && end < Date.now();
  } catch {
    return false;
  }
}

interface StaffOperationsPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

export const StaffOperationsPanel: React.FC<StaffOperationsPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = isAuthenticated && !!accessToken;

  const enterVehicleHandoverMode = useWorldStore((state) => state.enterVehicleHandoverMode);
  const enterVehicleDamageMappingMode = useWorldStore((state) => state.enterVehicleDamageMappingMode);
  const enterVehicleDamageHistoryMode = useWorldStore((state) => state.enterVehicleDamageHistoryMode);
  const queryClient = useQueryClient();

  const [isConfirmingReturn, setIsConfirmingReturn] = React.useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = React.useState<string | null>(null);
  const [returnErrorMsg, setReturnErrorMsg] = React.useState<string | null>(null);

  const handleConfirmReturn = async () => {
    if (!activeTrip?.id || isConfirmingReturn) return;
    setIsConfirmingReturn(true);
    setReturnErrorMsg(null);
    setReturnSuccessMsg(null);
    try {
      await confirmTripReturnApi(activeTrip.id, {
        endBatteryLevel: vehicle.currentBatteryLevel,
        endOdometer: Number(vehicle.odometer) || undefined,
        conditionNote: 'Nhân viên đã tiếp nhận phương tiện và kiểm tra tình trạng.',
      });
      setReturnSuccessMsg('Xác nhận trả xe thành công! Chi phí điện đã được ghi nhận tự động.');
      queryClient.invalidateQueries({ queryKey: ['activeTrip', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenseShares'] });
      queryClient.invalidateQueries({ queryKey: ['costSharingSummary'] });
      queryClient.invalidateQueries({ queryKey: ['handoverHistory'] });
    } catch (err: any) {
      setReturnErrorMsg(err.message || 'Không thể xác nhận trả xe. Vui lòng thử lại.');
    } finally {
      setIsConfirmingReturn(false);
    }
  };

  // TanStack Query: Fetch active vehicle handovers
  const { data: activeHandovers = [] } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeVehicleHandovers', vehicle.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 4000,
  });

  // TanStack Query: Fetch handover eligibility (source of truth)
  const { data: eligibility } = useQuery<VehicleHandoverEligibilityResponse>({
    queryKey: ['handoverEligibility', vehicle.id],
    queryFn: () => fetchHandoverEligibility(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 4000,
  });

  // TanStack Query: Fetch bookings for preparation queue
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['vehicleBookings', vehicle.id],
    queryFn: () => fetchVehicleBookings(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 8000,
  });

  // TanStack Query: Fetch authoritative active trip for vehicle
  const { data: activeTrip } = useQuery<TripData | null>({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 3000,
  });

  // TanStack Query: Fetch recorded damages for vehicle (Phase 13)
  const { data: damages = [] } = useQuery<DamageRecordResponse[]>({
    queryKey: ['vehicleDamages', vehicle.id],
    queryFn: () => fetchVehicleDamages(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 6000,
  });

  // Authoritative condition check
  const isVehicleInUse = vehicle.status === 'IN_USE';
  const isTripActive = !!activeTrip && activeTrip.status === 'ACTIVE';
  const isInconsistentInUseState = isVehicleInUse && !isTripActive;
  const isOverdue = isTripActive && isTripOverdue(activeTrip.bookingEndTime);

  // Helper to check if a handover is expired
  const isHandoverExpired = (h?: VehicleHandoverData | null) => {
    if (!h) return false;
    return Boolean(
      h.isExpired ||
      h.expired ||
      h.bookingStatus === 'EXPIRED' ||
      (h.bookingEndTime && new Date(h.bookingEndTime).getTime() < Date.now())
    );
  };

  // Helper to check if a booking is expired
  const isBookingExpired = (b?: Booking | null) => {
    if (!b) return false;
    return Boolean(
      b.isExpired ||
      b.expired ||
      b.status === 'EXPIRED' ||
      (b.endTime && new Date(b.endTime).getTime() < Date.now())
    );
  };

  // Resolve prioritized handover candidate: prioritize non-expired candidates first
  const nextHandover = React.useMemo(() => {
    if (!activeHandovers || activeHandovers.length === 0) return null;
    const nonExpired = activeHandovers.filter((h) => !isHandoverExpired(h));
    const targetPool = nonExpired.length > 0 ? nonExpired : activeHandovers;
    const prioritized = targetPool.find(
      (h) =>
        h.status === 'READY_FOR_HANDOVER' ||
        h.status === 'INSPECTION_IN_PROGRESS' ||
        h.status === 'PENDING_PREPARATION' ||
        h.status === 'HANDED_OVER'
    );
    return prioritized || targetPool[0];
  }, [activeHandovers]);

  // Resolve upcoming booking requiring preparation: prioritize non-expired
  const upcomingBooking = React.useMemo(() => {
    if (!bookings || bookings.length === 0) return null;
    const active = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING');
    const futureActive = active.filter((b) => !isBookingExpired(b));
    return futureActive[0] || active[0] || bookings[0] || null;
  }, [bookings]);

  const formattedOdometer = Number(vehicle.odometer ?? 12450).toLocaleString('vi-VN');
  const estimatedRangeKm = Math.round(((vehicle.currentBatteryLevel || 82) / 100) * 450);

  const eligibilityReason: HandoverEligibilityReason =
    eligibility?.reason ||
    (nextHandover?.eligibilityReason ?? (activeHandovers.length === 0 ? 'NO_BOOKING' : 'READY_FOR_PREPARATION'));
  const eligibilityConfig =
    HANDOVER_ELIGIBILITY_CONFIG[eligibilityReason] || HANDOVER_ELIGIBILITY_CONFIG.NO_BOOKING;

  // Resolve single source of recipient data for normal handover mode
  const recipientName =
    eligibility?.recipientName ||
    nextHandover?.coOwnerName ||
    upcomingBooking?.userName ||
    (activeHandovers.length > 0 ? 'Đồng sở hữu' : 'Chưa có yêu cầu');

  const recipientEmail =
    eligibility?.recipientEmail ||
    nextHandover?.coOwnerEmail ||
    upcomingBooking?.userEmail ||
    null;

  const handoverDate = formatDate(
    eligibility?.bookingStartTime ||
    nextHandover?.bookingStartTime ||
    upcomingBooking?.startTime
  );

  const handoverTimeRange = formatTimeRange(
    eligibility?.bookingStartTime || nextHandover?.bookingStartTime || upcomingBooking?.startTime,
    eligibility?.bookingEndTime || nextHandover?.bookingEndTime || upcomingBooking?.endTime
  );

  const inspectedCount =
    nextHandover?.inspections?.length ??
    (eligibilityReason === 'READY_FOR_PREPARATION' || eligibilityReason === 'TOO_EARLY' ? 0 : (nextHandover ? 8 : 0));

  const handoverStatusLabel =
    nextHandover?.status === 'INSPECTION_IN_PROGRESS'
    ? 'ĐANG KIỂM TRA'
    : nextHandover?.status === 'READY_FOR_HANDOVER'
    ? 'SẴN SÀNG BÀN GIAO'
    : eligibilityConfig?.labelVi || 'SẴN SÀNG';

  const handoverStatusColor =
    nextHandover?.status === 'INSPECTION_IN_PROGRESS'
    ? '#38bdf8'
    : nextHandover?.status === 'READY_FOR_HANDOVER'
    ? '#34d399'
    : eligibilityConfig?.color || '#00f2fe';

  return (
    <div
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        pointerEvents: 'auto',
        width: '330px',
        maxHeight: '84vh',
        overflowY: 'auto',
        background: 'rgba(6, 15, 28, 0.95)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${isInconsistentInUseState ? '#ef4444' : isTripActive ? (isOverdue ? '#f59e0b' : '#00f2fe') : '#00f2fe'}`,
        boxShadow: isInconsistentInUseState
          ? '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(239, 68, 68, 0.25)'
          : isOverdue
          ? '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(245, 158, 11, 0.25)'
          : '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 242, 254, 0.25)',
        borderRadius: '16px',
        padding: '18px 20px',
        color: '#ffffff',
        fontFamily: 'var(--font-family)',
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        title="Đóng bảng vận hành"
        style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          cursor: 'pointer',
          zIndex: 30,
          pointerEvents: 'auto',
        }}
      >
        <X size={14} />
      </button>

      {/* Mode Identity Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: isInconsistentInUseState
            ? 'rgba(239, 68, 68, 0.2)'
            : 'rgba(2, 132, 199, 0.22)',
          border: `1px solid ${isInconsistentInUseState ? 'rgba(239, 68, 68, 0.45)' : 'rgba(0, 242, 254, 0.45)'}`,
          boxShadow: '0 0 10px rgba(0, 242, 254, 0.2)',
          borderRadius: '6px',
          padding: '3px 8px',
          fontSize: '9.5px',
          fontWeight: 800,
          letterSpacing: '0.06em',
          color: isInconsistentInUseState ? '#f87171' : '#00f2fe',
          textTransform: 'uppercase',
          marginBottom: '8px',
          width: 'fit-content',
        }}
      >
        <ShieldCheck size={11} color={isInconsistentInUseState ? '#f87171' : '#00f2fe'} />
        <span>CHẾ ĐỘ VẬN HÀNH — NHÂN VIÊN</span>
      </div>

      {/* Main Title */}
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 800,
          letterSpacing: '-0.01em',
          margin: '0 0 2px 0',
          color: '#ffffff',
        }}
      >
        {isTripActive
          ? 'XE ĐANG ĐƯỢC SỬ DỤNG'
          : isInconsistentInUseState
          ? 'CẢNH BÁO TRẠNG THÁI XE'
          : 'VẬN HÀNH / BÀN GIAO'}
      </h3>

      {/* Subtitle: EV01 Identity */}
      <div
        style={{
          fontSize: '12px',
          color: isInconsistentInUseState ? '#f87171' : '#38bdf8',
          fontWeight: 600,
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Car size={13} color={isInconsistentInUseState ? '#f87171' : '#38bdf8'} />
        <span>EV01 &bull; {vehicle.name || 'VinFast VF e34'}</span>
      </div>

      {/* ======================================================== */}
      {/* CASE 1: AUTHORITATIVE ACTIVE TRIP OPERATIONAL CARD      */}
      {/* ======================================================== */}
      {isTripActive && activeTrip ? (
        <>
          <div
            style={{
              background: 'rgba(2, 132, 199, 0.14)',
              border: `1px solid ${isOverdue ? 'rgba(245, 158, 11, 0.5)' : 'rgba(0, 242, 254, 0.4)'}`,
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '12px',
            }}
          >
            {/* Header with Status Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: isOverdue ? '#fbbf24' : '#00f2fe',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <ClipboardList size={13} color={isOverdue ? '#fbbf24' : '#00f2fe'} />
                <span>CHUYẾN ĐI ĐANG HOẠT ĐỘNG</span>
              </div>
              <span
                style={{
                  background: isOverdue ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 242, 254, 0.2)',
                  color: isOverdue ? '#f87171' : '#00f2fe',
                  border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.45)' : 'rgba(0, 242, 254, 0.4)'}`,
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                }}
              >
                {isOverdue ? 'CHUYẾN ĐI ĐANG QUÁ GIỜ' : 'ACTIVE'}
              </span>
            </div>

            {/* Operational Trip Details */}
            <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Người sử dụng:</span>
                <span style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={11} color="#38bdf8" />
                  {activeTrip.userName}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Tài khoản:</span>
                <span style={{ color: '#94a3b8', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={11} color="#64748b" />
                  {activeTrip.userEmail || 'Chưa cung cấp'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Bắt đầu:</span>
                <span style={{ color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} color="#38bdf8" />
                  {formatDateTime(activeTrip.startedAt)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Khung giờ đặt:</span>
                <span style={{ color: '#00f2fe', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={11} color="#00f2fe" />
                  {formatTimeRange(activeTrip.bookingStartTime, activeTrip.bookingEndTime)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Pin khi bắt đầu:</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{activeTrip.startBatteryLevel}%</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Odometer khi bắt đầu:</span>
                <span style={{ color: '#c084fc', fontWeight: 700 }}>
                  {Number(activeTrip.startOdometer).toLocaleString()} km
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Dự kiến khả dụng:</span>
                <span style={{ color: isOverdue ? '#f87171' : '#34d399', fontWeight: 700 }}>
                  {activeTrip.bookingEndTime ? formatDateTime(activeTrip.bookingEndTime) : 'SAU KHI NGƯỜI DÙNG TRẢ XE'}
                </span>
              </div>

              {/* Overdue Warning Alert */}
              {isOverdue && (
                <div
                  style={{
                    marginTop: '4px',
                    background: 'rgba(239, 68, 68, 0.16)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#f87171',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  <AlertTriangle size={13} color="#f87171" />
                  <span>CHUYẾN ĐI ĐANG QUÁ GIỜ — ĐANG CHỜ NGƯỜI DÙNG TRẢ XE</span>
                </div>
              )}
            </div>
          </div>

          {/* Current Authoritative Vehicle Telemetry */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '10px',
              padding: '8px 12px',
              marginBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>PIN HIỆN TẠI (XE)</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={12} color="#00f2fe" />
                <span>{vehicle.currentBatteryLevel}%</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>(~{estimatedRangeKm} km)</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>ODOMETER HIỆN TẠI</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                {formattedOdometer} km
              </div>
            </div>
          </div>

          {/* STAFF RETURN VERIFICATION & CHARGING COST SETTLEMENT */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                color: '#00f2fe',
                fontSize: '11px',
                fontWeight: 750,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              <ShieldCheck size={14} color="#00f2fe" />
              <span>TIẾP NHẬN & XÁC NHẬN TRẢ XE</span>
            </div>

            <p style={{ margin: 0, fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.4 }}>
              Nhân viên kiểm tra tình trạng thực tế và xác nhận trả xe để hệ thống tự động tính chi phí điện tiêu thụ của chuyến đi.
            </p>

            {returnErrorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.40)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: '#f87171',
                  fontSize: '10.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertTriangle size={12} color="#f87171" />
                <span>{returnErrorMsg}</span>
              </div>
            )}

            {returnSuccessMsg && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.40)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: '#34d399',
                  fontSize: '10.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ShieldCheck size={12} color="#34d399" />
                <span>{returnSuccessMsg}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isConfirmingReturn}
              onClick={handleConfirmReturn}
              style={{
                width: '100%',
                background: isConfirmingReturn
                  ? 'rgba(0, 242, 254, 0.3)'
                  : 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                color: '#070b14',
                fontSize: '11.5px',
                fontWeight: 800,
                letterSpacing: '0.03em',
                cursor: isConfirmingReturn ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 242, 254, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              <Zap size={14} color="#070b14" />
              <span>
                {isConfirmingReturn
                  ? 'ĐANG XÁC NHẬN TRẢ XE...'
                  : 'XÁC NHẬN TRẢ XE & TÍNH CHI PHÍ ĐIỆN'}
              </span>
            </button>
          </div>
        </>
      ) : isInconsistentInUseState ? (
        /* ======================================================== */
        /* CASE 2: INCONSISTENT STATE (IN_USE WITHOUT ACTIVE TRIP)  */
        /* ======================================================== */
        <>
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#f87171',
                fontWeight: 800,
                fontSize: '11.5px',
                marginBottom: '6px',
              }}
            >
              <AlertTriangle size={15} color="#f87171" />
              <span>CẢNH BÁO TRẠNG THÁI XE</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#fca5a5', lineHeight: 1.4 }}>
              Xe đang được đánh dấu IN_USE nhưng không tìm thấy chuyến đi đang hoạt động.
            </p>
            <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.3 }}>
              Hệ thống không tự suy đoán thông tin chuyến đi. Vui lòng kiểm tra lại nhật ký vận hành hoặc đợi đồng bộ dữ liệu.
            </div>
          </div>

          {/* Current Vehicle Telemetry */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '10px',
              padding: '8px 12px',
              marginBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>PIN HIỆN TẠI</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={12} color="#f87171" />
                <span>{vehicle.currentBatteryLevel}%</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>ODOMETER</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                {formattedOdometer} km
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(30, 41, 59, 0.75)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '10px',
              padding: '10px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '11px',
            }}
          >
            Không thể thực hiện bàn giao khi trạng thái xe chưa được xác thực.
          </div>
        </>
      ) : (
        /* ======================================================== */
        /* CASE 3: NORMAL AVAILABLE / PREPARATION HANDOVER PANEL    */
        /* ======================================================== */
        <>
          <div
            style={{
              background: 'rgba(2, 132, 199, 0.12)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '12px',
            }}
          >
            {/* Card Header with Status Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#00f2fe',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <ClipboardList size={13} color="#00f2fe" />
                <span>TIẾN ĐỘ BÀN GIAO</span>
              </div>
              <span
                style={{
                  background: eligibilityConfig?.badgeBg || 'rgba(0, 242, 254, 0.2)',
                  color: handoverStatusColor,
                  border: `1px solid ${eligibilityConfig?.border || 'rgba(0, 242, 254, 0.4)'}`,
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                }}
              >
                {handoverStatusLabel}
              </span>
            </div>

            {/* Business Data Fields */}
            <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Người nhận xe:</span>
                <span style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={11} color="#38bdf8" />
                  {recipientName}
                </span>
              </div>

              {recipientEmail && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Tài khoản:</span>
                  <span style={{ color: '#94a3b8', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={11} color="#64748b" />
                    {recipientEmail}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Ngày bàn giao:</span>
                <span style={{ color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={11} color="#38bdf8" />
                  {handoverDate}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Khung giờ:</span>
                <span style={{ color: '#00f2fe', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} color="#00f2fe" />
                  {handoverTimeRange}
                </span>
              </div>

              {/* Inspection Progress Bar */}
              <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Tiến độ kiểm tra:</span>
                  <span style={{ color: inspectedCount === 8 ? '#34d399' : '#38bdf8', fontWeight: 800 }}>
                    {inspectedCount} / 8 Điểm kiểm tra
                  </span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, (inspectedCount / 8) * 100)}%`,
                      height: '100%',
                      background: inspectedCount === 8 ? '#34d399' : 'linear-gradient(90deg, #0284c7, #00f2fe)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Vehicle Telemetry Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '10px',
              padding: '8px 12px',
              marginBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>PIN KHẢ DỤNG</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={12} color="#00f2fe" />
                <span>{vehicle.currentBatteryLevel}%</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>(~{estimatedRangeKm} km)</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>ODOMETER</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                {formattedOdometer} km
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <div>
            <button
              type="button"
              onClick={() => enterVehicleHandoverMode()}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '11px',
                color: '#070b14',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(0, 242, 254, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <Wrench size={15} color="#070b14" />
              <span>{inspectedCount === 0 ? 'BẮT ĐẦU KIỂM TRA XE' : inspectedCount < 8 ? `TIẾP TỤC KIỂM TRA (${inspectedCount}/8)` : 'XÁC NHẬN BÀN GIAO XE'}</span>
            </button>

            {/* Phase 13: 3D Damage Recording Button */}
            <button
              type="button"
              onClick={() => enterVehicleDamageMappingMode()}
              style={{
                width: '100%',
                marginTop: '8px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '10px',
                padding: '10px',
                color: '#fbbf24',
                fontSize: '11.5px',
                fontWeight: 700,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <AlertTriangle size={14} color="#f59e0b" />
              <span>GHI NHẬN HƯ HỎNG 3D ({damages.length})</span>
            </button>

            {/* Phase 14: Lịch sử hư hỏng 3D */}
            <button
              type="button"
              onClick={() => enterVehicleDamageHistoryMode()}
              style={{
                width: '100%',
                marginTop: '8px',
                background: 'rgba(0, 242, 254, 0.12)',
                border: '1px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '10px',
                padding: '10px',
                color: '#00f2fe',
                fontSize: '11.5px',
                fontWeight: 700,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <AlertTriangle size={14} color="#00f2fe" />
              <span>LỊCH SỬ HƯ HỎNG ({damages.length})</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
