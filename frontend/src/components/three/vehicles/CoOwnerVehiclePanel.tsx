import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { VehicleHandoverData } from '../../../types/handover';
import { Booking } from '../../../types/booking';
import { TripData, TripStartEligibilityData } from '../../../types/trip';
import { fetchActiveVehicleHandovers } from '../../../services/handoverApi';
import { fetchVehicleBookings } from '../../../services/bookingApi';
import { fetchActiveTripForVehicle, fetchTripStartEligibility } from '../../../services/tripApi';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore, VEHICLE_STATUS_LABELS } from '../../../store/worldStore';
import {
  Car,
  Zap,
  Calendar,
  Users,
  Search,
  Key,
  X,
  Clock,
  Sparkles,
  Info,
  Play,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Compass,
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

interface CoOwnerVehiclePanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

export const CoOwnerVehiclePanel: React.FC<CoOwnerVehiclePanelProps> = ({
  vehicle,
  onClose,
}) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = isAuthenticated && !!accessToken;

  const setVehicleFeatureMode = useWorldStore((state) => state.setVehicleFeatureMode);
  const enterVehicleReceiptReviewMode = useWorldStore((state) => state.enterVehicleReceiptReviewMode);
  const enterVehicleTripVisualizationMode = useWorldStore((state) => state.enterVehicleTripVisualizationMode);

  // TanStack Query: Fetch active handovers to evaluate eligibility for check-in
  const { data: activeHandovers = [] } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeVehicleHandovers', vehicle.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 4000,
  });

  // TanStack Query: Fetch vehicle bookings to display "Lịch sắp tới"
  const { data: allBookings = [] } = useQuery<Booking[]>({
    queryKey: ['vehicleBookings', vehicle.id],
    queryFn: () => fetchVehicleBookings(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 8000,
  });

  // TanStack Query: Fetch active trip for vehicle
  const { data: activeTrip } = useQuery<TripData | null>({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 3000,
  });

  const isTripActive = !!activeTrip && activeTrip.status === 'ACTIVE';
  const isMyActiveTrip = isTripActive && !!activeTrip && (
    (!!user?.id && activeTrip.userId === user.id) ||
    (!!user?.email && activeTrip.userEmail === user.email)
  );
  const isOtherUserActiveTrip = isTripActive && !isMyActiveTrip;

  // Resolve upcoming booking for this vehicle / user
  const upcomingBooking = React.useMemo(() => {
    const list = Array.isArray(allBookings) ? allBookings : [];
    if (list.length === 0) return null;
    const now = new Date();
    const myBookings = list.filter(
      (b) => b && b.status !== 'CANCELLED' && (!user?.id || b.userId === user?.id)
    );
    if (myBookings.length > 0) {
      return myBookings.find((b) => b.endTime && new Date(b.endTime) >= now) || myBookings[0];
    }
    // Fallback to active confirmed booking on vehicle
    const active = list.filter((b) => b && b.status === 'CONFIRMED');
    return active.find((b) => b.endTime && new Date(b.endTime) >= now) || active[0] || null;
  }, [allBookings, user?.id]);

  // Check if CO_OWNER has an active handover ready for receipt / check-in (HANDED_OVER status)
  const isEligibleForCheckIn = React.useMemo(() => {
    if (isTripActive) return false;
    const list = Array.isArray(activeHandovers) ? activeHandovers : [];
    if (list.length === 0) return false;
    return list.some(
      (h) =>
        h &&
        (h.status === 'HANDED_OVER' || h.status === 'READY_FOR_HANDOVER') &&
        (!user?.id || h.coOwnerId === user?.id || h.coOwnerEmail === user?.email)
    );
  }, [activeHandovers, user, isTripActive]);

  // Resolve completed handover for current user (Phase 10 transition prerequisite)
  const completedHandover = React.useMemo(() => {
    const list = Array.isArray(activeHandovers) ? activeHandovers : [];
    if (list.length === 0) return null;
    return (
      list.find(
        (h) =>
          h &&
          (h.status === 'COMPLETED' || h.status === 'OWNER_CONFIRMED') &&
          (!user?.id || h.coOwnerId === user?.id || h.coOwnerEmail === user?.email)
      ) || null
    );
  }, [activeHandovers, user]);

  // If completed handover exists and trip is not active, check trip start eligibility
  const { data: tripEligibility } = useQuery<TripStartEligibilityData | null>({
    queryKey: ['tripEligibility', completedHandover?.bookingId],
    queryFn: () =>
      completedHandover?.bookingId
        ? fetchTripStartEligibility(completedHandover.bookingId)
        : Promise.resolve(null),
    enabled: authReady && !!completedHandover?.bookingId && (!activeTrip || activeTrip.status !== 'ACTIVE'),
    refetchInterval: 4000,
  });

  const displayCode = 'EV01';
  const statusConfig = isTripActive
    ? { label: 'Đang sử dụng', color: '#00f2fe' }
    : VEHICLE_STATUS_LABELS[vehicle.status] || {
        label: 'Sẵn sàng',
        color: '#10b981',
      };
  const estimatedRangeKm = Math.round(((vehicle.currentBatteryLevel || 82) / 100) * 450);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        width: '330px',
        maxHeight: '86vh',
        overflowY: 'auto',
        background: 'rgba(8, 14, 24, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid #10b981',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(16, 185, 129, 0.22)',
        borderRadius: '16px',
        padding: '20px',
        color: '#ffffff',
        fontFamily: 'var(--font-family)',
        position: 'relative',
      }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        title="Đóng thông tin xe"
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
        }}
      >
        <X size={14} />
      </button>

      {/* Header Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '10px',
          fontWeight: 700,
          color: '#34d399',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}
      >
        <Car size={13} />
        Bản Sao Số Xe Điện
      </div>

      {/* Mode Identity Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(5, 150, 105, 0.2)',
          border: '1px solid rgba(16, 185, 129, 0.5)',
          boxShadow: '0 0 12px rgba(16, 185, 129, 0.25)',
          borderRadius: '6px',
          padding: '3px 8px',
          fontSize: '9.5px',
          fontWeight: 800,
          letterSpacing: '0.07em',
          color: '#34d399',
          textTransform: 'uppercase',
          marginBottom: '10px',
          width: 'fit-content',
        }}
      >
        <Sparkles size={11} color="#34d399" />
        <span>CHẾ ĐỘ ĐỒNG SỞ HỮU</span>
      </div>

      {/* Vehicle Titles */}
      <h3
        style={{
          fontSize: '20px',
          fontWeight: 800,
          letterSpacing: '-0.01em',
          margin: '0 0 2px 0',
          color: '#ffffff',
        }}
      >
        {displayCode}
      </h3>

      <div
        style={{
          fontSize: '12px',
          color: '#34d399',
          fontWeight: 600,
          marginBottom: '14px',
        }}
      >
        {vehicle.name || 'EVShare Demo EV'}
      </div>

      {/* Status & Battery Level Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '10px',
          }}
        >
          <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
            Trạng thái
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: statusConfig.color,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: statusConfig.color,
                boxShadow: `0 0 6px ${statusConfig.color}`,
              }}
            />
            {statusConfig.label}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '10px',
          }}
        >
          <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
            Mức pin
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Zap size={14} color="#34d399" />
            {vehicle.currentBatteryLevel}%
          </div>
        </div>
      </div>

      {/* Battery Level Progress Bar */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#94a3b8',
            marginBottom: '4px',
          }}
        >
          <span>Khả dụng</span>
          <span style={{ color: '#cbd5e1' }}>Ước tính ~{estimatedRangeKm} km</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${vehicle.currentBatteryLevel}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #059669, #34d399)',
              borderRadius: '9999px',
              boxShadow: '0 0 10px rgba(52, 211, 153, 0.8)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Lịch gần nhất / Lịch của tôi Card */}
      <div
        style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '10px',
          padding: '10px 12px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            color: '#94a3b8',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Clock size={11} color="#34d399" />
          <span>LỊCH GẦN NHẤT / LỊCH CỦA TÔI</span>
        </div>

        {upcomingBooking ? (
          <div style={{ fontSize: '12px' }}>
            <div style={{ fontWeight: 700, color: '#ffffff' }}>
              {formatDate(upcomingBooking.startTime)}
            </div>
            <div style={{ color: '#34d399', fontWeight: 600, fontSize: '11.5px' }}>
              {formatTimeRange(upcomingBooking.startTime, upcomingBooking.endTime)}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
            24/09/2026 • 12:00 - 13:00 (Sẵn sàng đặt)
          </div>
        )}
      </div>

      {/* Phase 10: Active Trip Restoration Card (Section 18 & 19) */}
      {/* Phase 11: Active Trip State for My Trip vs Other Co-Owner (Section 5 & 17) */}
      {isMyActiveTrip && activeTrip && (
        <div
          style={{
            background: 'rgba(2, 132, 199, 0.18)',
            border: '1px solid rgba(56, 189, 248, 0.55)',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.2)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
              CHUYẾN ĐI ĐANG DIỄN RA
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                background: 'rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              {displayCode}
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#f1f5f9', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Bắt đầu:</span>
            <strong style={{ color: '#ffffff' }}>
              {new Date(activeTrip.startedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({formatDate(activeTrip.startedAt)})
            </strong>
          </div>

          <div style={{ fontSize: '11px', color: '#f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Khung giờ đặt:</span>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>
              {formatTimeRange(activeTrip.bookingStartTime, activeTrip.bookingEndTime)}
            </span>
          </div>

          <div style={{ fontSize: '10.5px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px', marginTop: '2px' }}>
            Mức pin: <strong style={{ color: '#34d399' }}>{activeTrip.startBatteryLevel}%</strong> • Odo: <strong style={{ color: '#f8fafc' }}>{Number(activeTrip.startOdometer).toLocaleString()} km</strong>
          </div>
        </div>
      )}

      {isOtherUserActiveTrip && activeTrip && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.14)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            boxShadow: '0 0 16px rgba(245, 158, 11, 0.15)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em' }}>
              XE ĐANG ĐƯỢC SỬ DỤNG
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                background: 'rgba(245, 158, 11, 0.25)',
                color: '#fbbf24',
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              {displayCode}
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#f1f5f9', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Người sử dụng:</span>
            <strong style={{ color: '#ffffff' }}>{activeTrip.userName || 'Thành viên nhóm'}</strong>
          </div>

          <div style={{ fontSize: '11px', color: '#f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Bắt đầu:</span>
            <span style={{ color: '#cbd5e1' }}>
              {new Date(activeTrip.startedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({formatDate(activeTrip.startedAt)})
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Khung giờ:</span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>
              {formatTimeRange(activeTrip.bookingStartTime, activeTrip.bookingEndTime)}
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Dự kiến khả dụng:</span>
            <span style={{ color: '#34d399', fontWeight: 700 }}>
              {activeTrip.bookingEndTime
                ? `${new Date(activeTrip.bookingEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} (${formatDate(activeTrip.bookingEndTime)})`
                : 'Sau khi trả xe'}
            </span>
          </div>

          <div style={{ fontSize: '10.5px', color: '#38bdf8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={12} color="#38bdf8" />
            <span>Bạn vẫn có thể đặt lịch tương lai (không trùng thời gian).</span>
          </div>
        </div>
      )}

      {/* Phase 10: Trip Start Eligibility Notice (Section 15) */}
      {!isTripActive && completedHandover && (
        <div style={{ marginBottom: '14px' }}>
          {tripEligibility?.eligible ? (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#34d399',
                fontSize: '11.5px',
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={16} />
              <span>XE SẴN SÀNG SỬ DỤNG</span>
            </div>
          ) : tripEligibility ? (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#fbbf24',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={15} />
              <span>XE ĐÃ NHẬN — {tripEligibility.message || 'CHƯA ĐẾN THỜI GIAN SỬ DỤNG XE'}</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Section 3: Exact Role Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Phase 11: Primary Trip Action - XEM CHUYẾN ĐI (Current Owner Only) */}
        {isMyActiveTrip ? (
          <button
            type="button"
            onClick={() => enterVehicleTripVisualizationMode()}
            style={highlightActionButtonStyle('linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)', '#00f2fe')}
          >
            <Compass size={15} />
            <span>XEM CHUYẾN ĐI</span>
          </button>
        ) : !isTripActive && completedHandover && tripEligibility?.eligible ? (
          <button
            type="button"
            onClick={() => setVehicleFeatureMode('TRIP_START')}
            style={highlightActionButtonStyle('linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', '#00f2fe')}
          >
            <Play size={14} fill="currentColor" />
            <span>BẮT ĐẦU CHUYẾN ĐI</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setVehicleFeatureMode('CO_OWNER_MY_BOOKINGS')}
          style={actionButtonStyle()}
        >
          <Clock size={14} color="#34d399" />
          <span>LỊCH CỦA TÔI</span>
        </button>

        <button
          type="button"
          onClick={() => setVehicleFeatureMode('BOOKING')}
          style={primaryActionButtonStyle('linear-gradient(135deg, #059669 0%, #10b981 100%)')}
        >
          <Calendar size={14} />
          <span>ĐẶT LỊCH SỬ DỤNG</span>
        </button>

        <button
          type="button"
          onClick={() => setVehicleFeatureMode('CO_OWNERSHIP')}
          style={actionButtonStyle()}
        >
          <Users size={14} color="#34d399" />
          <span>ĐỒNG SỞ HỮU</span>
        </button>

        <button
          type="button"
          onClick={() => setVehicleFeatureMode('VEHICLE_EXPLORE')}
          style={actionButtonStyle()}
        >
          <Search size={14} color="#34d399" />
          <span>KHÁM PHÁ XE</span>
        </button>

        {/* Conditional Action: NHẬN XE */}
        {isEligibleForCheckIn && (
          <button
            type="button"
            onClick={() => enterVehicleReceiptReviewMode()}
            style={highlightActionButtonStyle('linear-gradient(135deg, #059669 0%, #10b981 100%)', '#10b981')}
          >
            <Key size={14} />
            <span>NHẬN XE</span>
          </button>
        )}
      </div>
    </div>
  );
};

function actionButtonStyle(): React.CSSProperties {
  return {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '10px',
    padding: '9px 14px',
    color: '#f1f5f9',
    fontSize: '11.5px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.15s ease',
  };
}

function primaryActionButtonStyle(gradient: string): React.CSSProperties {
  return {
    width: '100%',
    background: gradient,
    border: 'none',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
    transition: 'all 0.15s ease',
  };
}

function highlightActionButtonStyle(gradient: string, glowColor: string): React.CSSProperties {
  return {
    width: '100%',
    background: gradient,
    border: `1px solid ${glowColor}`,
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: `0 0 16px ${glowColor}`,
    animation: 'pulse 2s infinite',
    transition: 'all 0.15s ease',
  };
}
