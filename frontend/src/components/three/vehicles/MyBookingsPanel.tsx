import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { Booking } from '../../../types/booking';
import { fetchVehicleBookings } from '../../../services/bookingApi';
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

  // TanStack Query: Fetch all bookings for EV01
  const { data: allBookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['vehicleBookings', vehicle.id],
    queryFn: () => fetchVehicleBookings(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 5000,
  });

  // Filter for bookings by this user
  const userBookings = React.useMemo(() => {
    if (!allBookings) return [];
    return allBookings.filter(
      (b) => !user?.id || b.userId === user?.id
    );
  }, [allBookings, user?.id]);

  const now = new Date();
  const upcomingBookings = userBookings.filter(
    (b) => new Date(b.endTime) >= now && b.status !== 'CANCELLED'
  );
  const previousBookings = userBookings.filter(
    (b) => new Date(b.endTime) < now || b.status === 'CANCELLED'
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
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

      {/* SẮP TỚI SECTION */}
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
          <span>SẮP TỚI</span>
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
          /* Role-Specific Empty State (Section 24) */
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

      {/* LỊCH SỬ ĐÃ ĐẶT (Previous Bookings) */}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {previousBookings.slice(0, 3).map((b) => (
              <div
                key={b.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '10.5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ color: '#cbd5e1', fontWeight: 600 }}>{formatDate(b.startTime)}</div>
                  <div style={{ color: '#64748b' }}>{formatTimeRange(b.startTime, b.endTime)}</div>
                </div>
                <span
                  style={{
                    color: b.status === 'CANCELLED' ? '#f87171' : '#94a3b8',
                    fontSize: '9.5px',
                    fontWeight: 700,
                  }}
                >
                  {b.status === 'CANCELLED' ? 'ĐÃ HỦY' : 'HOÀN THÀNH'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
        <button
          type="button"
          onClick={() => setVehicleFeatureMode('BOOKING')}
          style={{
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
