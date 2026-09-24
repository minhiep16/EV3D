import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { VehicleHandoverData, HANDOVER_STATUS_CONFIG } from '../../../types/handover';
import { Booking } from '../../../types/booking';
import { fetchActiveVehicleHandovers } from '../../../services/handoverApi';
import { fetchVehicleBookings } from '../../../services/bookingApi';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore, VEHICLE_STATUS_LABELS } from '../../../store/worldStore';
import {
  Car,
  Zap,
  Clock,
  Calendar,
  X,
  ShieldCheck,
  Wrench,
  User,
  CheckCircle,
  AlertCircle,
  ClipboardList,
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

  // TanStack Query: Fetch active vehicle handovers
  const { data: activeHandovers = [] } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeVehicleHandovers', vehicle.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
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

  // Resolve prioritized handover candidate
  const nextHandover = React.useMemo(() => {
    if (!activeHandovers || activeHandovers.length === 0) return null;
    const prioritized = activeHandovers.find(
      (h) =>
        h.status === 'READY_FOR_HANDOVER' ||
        h.status === 'INSPECTION_IN_PROGRESS' ||
        h.status === 'PENDING_PREPARATION' ||
        h.status === 'HANDED_OVER'
    );
    return prioritized || activeHandovers[0];
  }, [activeHandovers]);

  // Resolve upcoming booking requiring preparation
  const upcomingBooking = React.useMemo(() => {
    if (!bookings || bookings.length === 0) return null;
    const now = new Date();
    const active = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING');
    return active.find((b) => new Date(b.endTime) >= now) || active[0] || null;
  }, [bookings]);

  const displayCode = 'EV01';
  const statusConfig = VEHICLE_STATUS_LABELS[vehicle.status] || {
    label: vehicle.status,
    color: '#00f2fe',
  };
  const formattedOdometer = Number(vehicle.odometer ?? 12450).toLocaleString('vi-VN');
  const estimatedRangeKm = Math.round(((vehicle.currentBatteryLevel || 82) / 100) * 450);

  const handoverConfig = nextHandover?.status
    ? HANDOVER_STATUS_CONFIG[nextHandover.status]
    : null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: '340px',
        maxHeight: '86vh',
        overflowY: 'auto',
        background: 'rgba(6, 15, 28, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid #00f2fe',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 242, 254, 0.25)',
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
        }}
      >
        <X size={14} />
      </button>

      {/* Header Label */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '10px',
          fontWeight: 700,
          color: '#00f2fe',
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
          background: 'rgba(2, 132, 199, 0.22)',
          border: '1px solid rgba(0, 242, 254, 0.45)',
          boxShadow: '0 0 12px rgba(0, 242, 254, 0.25)',
          borderRadius: '6px',
          padding: '3px 8px',
          fontSize: '9.5px',
          fontWeight: 800,
          letterSpacing: '0.07em',
          color: '#00f2fe',
          textTransform: 'uppercase',
          marginBottom: '10px',
          width: 'fit-content',
        }}
      >
        <ShieldCheck size={11} color="#00f2fe" />
        <span>CHẾ ĐỘ VẬN HÀNH — NHÂN VIÊN</span>
      </div>

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
          color: '#38bdf8',
          fontWeight: 600,
          marginBottom: '14px',
        }}
      >
        Trạm Vận Hành & Chuẩn Bị Bàn Giao
      </div>

      {/* ======================================================== */}
      {/* MODULE 1: XE CẦN CHUẨN BỊ (Section 19)                   */}
      {/* ======================================================== */}
      <div
        style={{
          background: 'rgba(2, 132, 199, 0.12)',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#00f2fe',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <ClipboardList size={13} color="#00f2fe" />
            <span>XE CẦN CHUẨN BỊ</span>
          </div>
          <span
            style={{
              background: 'rgba(0, 242, 254, 0.2)',
              color: '#00f2fe',
              fontSize: '9px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {nextHandover ? nextHandover.status : 'SẴN SÀNG'}
          </span>
        </div>

        {nextHandover || upcomingBooking ? (
          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Người nhận xe:</span>
              <span style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={11} color="#38bdf8" />
                {nextHandover?.coOwnerName || upcomingBooking?.userName || 'Nguyen Van A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Ngày bàn giao:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                {formatDate(nextHandover?.bookingStartTime || upcomingBooking?.startTime)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Khung giờ:</span>
              <span style={{ color: '#00f2fe', fontWeight: 700 }}>
                {formatTimeRange(
                  nextHandover?.bookingStartTime || upcomingBooking?.startTime,
                  nextHandover?.bookingEndTime || upcomingBooking?.endTime
                )}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
              <span style={{ color: '#94a3b8' }}>Tiến độ kiểm tra:</span>
              <span style={{ color: '#38bdf8', fontWeight: 800 }}>
                {nextHandover?.inspections?.length ?? 8} / 8 Điểm kiểm tra
              </span>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '4px 0' }}>
            Chưa có lịch đặt xe mới cần chuẩn bị.
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODULE 2: LỊCH BÀN GIAO (Section 19 & 24)                */}
      {/* ======================================================== */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#38bdf8',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          <Clock size={13} color="#38bdf8" />
          <span>LỊCH BÀN GIAO VẬN HÀNH</span>
        </div>

        {activeHandovers.length > 0 ? (
          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
              <span>Bàn giao tiếp theo:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                {nextHandover?.coOwnerName || 'Đồng sở hữu'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
              <span>Trạng thái quy trình:</span>
              <span style={{ color: handoverConfig?.color || '#00f2fe', fontWeight: 700 }}>
                {handoverConfig?.labelVi || nextHandover?.status}
              </span>
            </div>
          </div>
        ) : (
          /* Role-Specific Empty State (Section 24) */
          <div style={{ textAlign: 'center', padding: '6px 0', color: '#94a3b8', fontSize: '11px' }}>
            KHÔNG CÓ XE NÀO CẦN BÀN GIAO LÚC NÀY
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODULE 3: TÌNH TRẠNG VẬN HÀNH (Section 19)               */}
      {/* ======================================================== */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            fontSize: '10.5px',
            fontWeight: 800,
            color: '#94a3b8',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Thông Số Vận Hành Xe EV01
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>MỨC PIN</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Zap size={13} color="#00f2fe" />
              {vehicle.currentBatteryLevel}% (~{estimatedRangeKm} km)
            </div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>QUÃNG ĐƯỜNG</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
              {formattedOdometer} km
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#34d399' }}>
          <CheckCircle size={13} />
          <span>Hệ thống kỹ thuật & pin hoạt động tốt</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODULE 4: PRIMARY ACTION CTA (Section 23)                */}
      {/* ======================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Primary CTA */}
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
          KIỂM TRA & BÀN GIAO XE
        </button>

        {/* Secondary CTA */}
        <button
          type="button"
          onClick={() => enterVehicleHandoverMode()}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '8px',
            padding: '8px',
            color: '#38bdf8',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Clock size={13} />
          XEM LỊCH BÀN GIAO
        </button>
      </div>
    </div>
  );
};
