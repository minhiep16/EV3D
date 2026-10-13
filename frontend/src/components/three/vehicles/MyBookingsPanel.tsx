import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { Booking } from '../../../types/booking';
import { TripData } from '../../../types/trip';
import { fetchVehicleBookings } from '../../../services/bookingApi';
import { fetchActiveTripForVehicle, fetchBookingTrip } from '../../../services/tripApi';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';
import {
  Calendar,
  Clock,
  Car,
  X,
  ArrowLeft,
  CheckCircle2,
  CalendarPlus,
  History,
  Navigation,
  Eye,
  ShieldCheck,
  Zap,
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

interface MyBookingsPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

export const MyBookingsPanel: React.FC<MyBookingsPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = isAuthenticated && !!accessToken;

  const returnToVehicleOverview = useWorldStore((state) => state.returnToVehicleOverview);
  const setVehicleFeatureMode = useWorldStore((state) => state.setVehicleFeatureMode);
  const enterVehicleTripVisualizationMode = useWorldStore((state) => state.enterVehicleTripVisualizationMode);

  const [selectedSummaryBookingId, setSelectedSummaryBookingId] = React.useState<string | null>(null);

  // TanStack Query: Fetch all bookings for EV01
  const { data: allBookings = [] } = useQuery<Booking[]>({
    queryKey: ['vehicleBookings', vehicle.id],
    queryFn: () => fetchVehicleBookings(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 5000,
  });

  // TanStack Query: Fetch active trip for vehicle
  const { data: activeTrip } = useQuery<TripData | null>({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 3000,
  });

  // TanStack Query: Fetch trip summary for selected past booking
  const { data: summaryTrip, isLoading: isLoadingSummary } = useQuery<TripData | null>({
    queryKey: ['bookingTrip', selectedSummaryBookingId],
    queryFn: () => fetchBookingTrip(selectedSummaryBookingId!),
    enabled: !!selectedSummaryBookingId,
  });

  // Filter for bookings by this user
  const userBookings = React.useMemo(() => {
    if (!allBookings) return [];
    return allBookings.filter(
      (b) => !user?.id || b.userId === user?.id
    );
  }, [allBookings, user?.id]);

  // Ownership verification for active trip: must belong to logged-in CO_OWNER
  const isUserActiveTrip = React.useMemo(() => {
    if (!activeTrip || activeTrip.status !== 'ACTIVE') return false;
    if (!user) return false;
    return (
      (!!user.id && activeTrip.userId === user.id) ||
      (!!user.email && activeTrip.userEmail === user.email)
    );
  }, [activeTrip, user]);

  const now = new Date();

  // Upcoming bookings: exclude the active trip booking, only show upcoming confirmed/pending
  const upcomingBookings = React.useMemo(() => {
    return userBookings.filter((b) => {
      if (isUserActiveTrip && activeTrip?.bookingId === b.id) return false;
      return (
        b.status !== 'CANCELLED' &&
        b.status !== 'COMPLETED' &&
        new Date(b.endTime) >= now
      );
    });
  }, [userBookings, isUserActiveTrip, activeTrip?.bookingId, now]);

  // Previous completed bookings: completed or ended in the past, excluding active trip
  const previousBookings = React.useMemo(() => {
    return userBookings.filter((b) => {
      if (isUserActiveTrip && activeTrip?.bookingId === b.id) return false;
      return (
        b.status === 'COMPLETED' ||
        b.status === 'CANCELLED' ||
        new Date(b.endTime) < now
      );
    });
  }, [userBookings, isUserActiveTrip, activeTrip?.bookingId, now]);

  return (
    <div
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        pointerEvents: 'auto',
        width: '340px',
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
        zIndex: 40,
      }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        title="Đóng lịch đặt xe"
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
        <Calendar size={13} />
        LỊCH ĐẶT CÁ NHÂN
      </div>

      <h3
        style={{
          fontSize: '19px',
          fontWeight: 800,
          letterSpacing: '-0.01em',
          margin: '0 0 2px 0',
          color: '#ffffff',
        }}
      >
        LỊCH SỬ DỤNG CỦA TÔI
      </h3>

      <div
        style={{
          fontSize: '12px',
          color: '#34d399',
          fontWeight: 600,
          marginBottom: '16px',
        }}
      >
        Xe Điện EV01 — {user?.fullName || 'Đồng sở hữu'}
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: CHUYẾN ĐI HIỆN TẠI (ACTIVE TRIP)             */}
      {/* ======================================================== */}
      {isUserActiveTrip && activeTrip && (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#00f2fe',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Navigation size={13} color="#00f2fe" />
            <span>CHUYẾN ĐI HIỆN TẠI</span>
          </div>

          <div
            style={{
              background: 'rgba(2, 132, 199, 0.16)',
              border: '1px solid rgba(0, 242, 254, 0.45)',
              boxShadow: '0 0 16px rgba(0, 242, 254, 0.15)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                {formatDate(activeTrip.startedAt)}
              </span>
              <span
                style={{
                  background: activeTrip.returnRequestedAt ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 242, 254, 0.25)',
                  color: activeTrip.returnRequestedAt ? '#fbbf24' : '#00f2fe',
                  border: `1px solid ${activeTrip.returnRequestedAt ? 'rgba(245, 158, 11, 0.45)' : 'rgba(0, 242, 254, 0.4)'}`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: activeTrip.returnRequestedAt ? '#fbbf24' : '#00f2fe',
                  }}
                />
                {activeTrip.returnRequestedAt ? 'ĐANG CHỜ NHẬN XE' : 'ĐANG SỬ DỤNG'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#94a3b8' }}>Khung giờ:</span>
              <span style={{ fontWeight: 700, color: '#00f2fe' }}>
                {formatTimeRange(activeTrip.bookingStartTime, activeTrip.bookingEndTime)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#94a3b8' }}>Pin khi bắt đầu:</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>
                {activeTrip.startBatteryLevel}%
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#94a3b8' }}>Odometer bắt đầu:</span>
              <span style={{ color: '#f8fafc', fontWeight: 700 }}>
                {Number(activeTrip.startOdometer).toLocaleString()} km
              </span>
            </div>

            {activeTrip.returnRequestedAt && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  fontSize: '10px',
                  color: '#fbbf24',
                  lineHeight: 1.3,
                }}
              >
                Đã gửi yêu cầu trả xe lúc {new Date(activeTrip.returnRequestedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}. Đang chờ nhân viên tiếp nhận.
              </div>
            )}

            <button
              type="button"
              onClick={() => enterVehicleTripVisualizationMode()}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                color: '#070b14',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 3px 12px rgba(0, 242, 254, 0.35)',
                marginTop: '4px',
              }}
            >
              <Eye size={13} color="#070b14" />
              <span>XEM CHUYẾN ĐI</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: SẮP TỚI (UPCOMING BOOKINGS)                   */}
      {/* ======================================================== */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#94a3b8',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Clock size={13} color="#34d399" />
          <span>SẮP TỚI ({upcomingBookings.length})</span>
        </div>

        {upcomingBookings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingBookings.map((b) => (
              <div
                key={b.id}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                    {formatDate(b.startTime)}
                  </span>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.25)',
                      color: '#34d399',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 800,
                    }}
                  >
                    {b.status === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : b.status}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#94a3b8' }}>Khung giờ:</span>
                  <span style={{ fontWeight: 700, color: '#34d399' }}>
                    {formatTimeRange(b.startTime, b.endTime)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#94a3b8' }}>Xe:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>EV01</span>
                </div>

                {b.purpose && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#94a3b8' }}>Mục đích:</span>
                    <span style={{ color: '#cbd5e1' }}>{b.purpose}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Role-Specific Empty State */
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px 0' }}>
              BẠN CHƯA CÓ LỊCH ĐẶT SẮP TỚI
            </p>
            <button
              type="button"
              onClick={() => setVehicleFeatureMode('BOOKING')}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 16px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 3px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <CalendarPlus size={13} />
              ĐẶT LỊCH SỬ DỤNG
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECTION 3: LỊCH SỬ ĐÃ QUA (PREVIOUS BOOKINGS)           */}
      {/* ======================================================== */}
      {previousBookings.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#64748b',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <History size={12} />
            <span>LỊCH SỬ ĐÃ QUA ({previousBookings.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {previousBookings.slice(0, 5).map((b) => (
              <div
                key={b.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '11.5px' }}>{formatDate(b.startTime)}</div>
                    <div style={{ color: '#64748b', fontSize: '10.5px' }}>{formatTimeRange(b.startTime, b.endTime)}</div>
                  </div>
                  <span
                    style={{
                      background: b.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: b.status === 'CANCELLED' ? '#f87171' : '#34d399',
                      border: `1px solid ${b.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '4px',
                    }}
                  >
                    {b.status === 'CANCELLED' ? 'ĐÃ HỦY' : 'HOÀN THÀNH'}
                  </span>
                </div>

                {b.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => setSelectedSummaryBookingId(b.id)}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'rgba(0, 242, 254, 0.1)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: '#00f2fe',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '2px',
                    }}
                  >
                    <Eye size={11} color="#00f2fe" />
                    <span>XEM TỔNG KẾT CHUYẾN ĐI</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* POPUP MODAL: TỔNG KẾT CHUYẾN ĐI (PERSISTED BACKEND DATA) */}
      {/* ======================================================== */}
      {selectedSummaryBookingId && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 12, 24, 0.96)',
            backdropFilter: 'blur(15px)',
            borderRadius: '16px',
            padding: '18px',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                <CheckCircle2 size={14} color="#10b981" />
                <span>TỔNG KẾT CHUYẾN ĐI</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSummaryBookingId(null)}
                style={{
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
            </div>

            {isLoadingSummary ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                Đang tải thông tin chuyến đi từ máy chủ...
              </div>
            ) : summaryTrip ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Bắt đầu:</span>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                      {formatDate(summaryTrip.startedAt)} {summaryTrip.startedAt ? new Date(summaryTrip.startedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Kết thúc:</span>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                      {summaryTrip.endedAt ? new Date(summaryTrip.endedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Quãng đường di chuyển:</span>
                    <strong style={{ color: '#38bdf8' }}>
                      {summaryTrip.distanceTraveled != null ? `${summaryTrip.distanceTraveled} km` : 'Chưa có dữ liệu'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Mức pin (SOC):</span>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>
                      {summaryTrip.startBatteryLevel}% → {summaryTrip.endSocPercent != null ? `${summaryTrip.endSocPercent}%` : summaryTrip.endBatteryLevel != null ? `${summaryTrip.endBatteryLevel}%` : 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Odometer:</span>
                    <span style={{ color: '#cbd5e1' }}>
                      {Number(summaryTrip.startOdometer).toLocaleString()} km → {summaryTrip.endOdometer != null ? `${Number(summaryTrip.endOdometer).toLocaleString()} km` : '--'}
                    </span>
                  </div>
                  {summaryTrip.energyConsumedKwh != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Năng lượng tiêu thụ:</span>
                      <strong style={{ color: '#10b981' }}>{summaryTrip.energyConsumedKwh} kWh</strong>
                    </div>
                  )}
                  {summaryTrip.verifiedExpenseAmount != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px', marginTop: '2px' }}>
                      <span style={{ color: '#94a3b8' }}>Chi phí điện xác nhận:</span>
                      <strong style={{ color: '#34d399' }}>
                        {Number(summaryTrip.verifiedExpenseAmount).toLocaleString('vi-VN')} đ (100%)
                      </strong>
                    </div>
                  )}
                  {summaryTrip.returnNote && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px', marginTop: '2px' }}>
                      <span style={{ color: '#94a3b8' }}>Kiểm tra trả xe:</span>
                      <span style={{ color: '#cbd5e1' }}>{summaryTrip.returnNote}</span>
                    </div>
                  )}
                  {summaryTrip.damageObserved && (
                    <div style={{ color: '#fbbf24', fontSize: '10px' }}>
                      * Đã ghi nhận hư hỏng mới trong quá trình kiểm tra.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                Không tìm thấy dữ liệu chuyến đi hoàn tất cho lịch đặt này.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSelectedSummaryBookingId(null)}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '9px',
              color: '#cbd5e1',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '12px',
            }}
          >
            ĐÓNG TỔNG KẾT
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
        <button
          type="button"
          onClick={() => setVehicleFeatureMode('BOOKING')}
          style={{
            pointerEvents: 'auto',
            width: '100%',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
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
            gap: '7px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
          }}
        >
          <CalendarPlus size={14} />
          ĐẶT THÊM LỊCH SỬ DỤNG
        </button>

        <button
          type="button"
          onClick={() => returnToVehicleOverview()}
          style={{
            pointerEvents: 'auto',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '9px',
            color: '#cbd5e1',
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
          QUAY LẠI TỔNG QUAN XE
        </button>
      </div>
    </div>
  );
};
