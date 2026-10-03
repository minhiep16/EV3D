import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { VehicleHandoverData } from '../../../types/handover';
import { Booking } from '../../../types/booking';
import { TripData } from '../../../types/trip';
import { DamageRecordData } from '../../../types/damage';
import {
  MaintenanceResponse,
  MaintenanceApprovalResponse,
  MAINTENANCE_TYPE_CONFIG,
  MAINTENANCE_PRIORITY_CONFIG,
} from '../../../types/maintenance';
import { resolveVehicleCode } from './vehicleModelConfig';
import { fetchActiveVehicleHandovers } from '../../../services/handoverApi';
import { fetchVehicleBookings } from '../../../services/bookingApi';
import { fetchActiveTripForVehicle } from '../../../services/tripApi';
import { fetchVehicleMaintenance, fetchMaintenanceApproval } from '../../../services/maintenanceApi';
import { fetchVehicleDamages } from '../../../services/damageApi';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore, VEHICLE_STATUS_LABELS } from '../../../store/worldStore';
import { useCoOwnerTripPrerequisites } from '../../../hooks/useCoOwnerTripPrerequisites';
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
  Play,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Wrench,
  BatteryCharging,
  ShieldCheck,
  ChevronRight,
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

function isTripOverdue(bookingEndTime?: string | null): boolean {
  if (!bookingEndTime) return false;
  try {
    const end = new Date(bookingEndTime).getTime();
    return !isNaN(end) && end < Date.now();
  } catch {
    return false;
  }
}

interface PendingApprovalMaintenanceNoticeProps {
  maintenance: MaintenanceResponse;
  onOpenMaintenance: () => void;
}

const PendingApprovalMaintenanceNotice: React.FC<PendingApprovalMaintenanceNoticeProps> = ({
  maintenance,
  onOpenMaintenance,
}) => {
  const { data: approvalData } = useQuery<MaintenanceApprovalResponse>({
    queryKey: ['maintenanceApproval', maintenance.id],
    queryFn: () => fetchMaintenanceApproval(maintenance.id),
    refetchInterval: 4000,
  });

  const typeCfg = MAINTENANCE_TYPE_CONFIG[maintenance.maintenanceType];
  const prioCfg = MAINTENANCE_PRIORITY_CONFIG[maintenance.priority];
  const approveWeight = approvalData?.approveWeight ?? 0;
  const threshold = approvalData?.requiredThreshold ?? 50.0;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(180, 83, 9, 0.15) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.55)',
        boxShadow: '0 0 16px rgba(245, 158, 11, 0.2)',
        borderRadius: '14px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#f59e0b',
              boxShadow: '0 0 10px #f59e0b',
            }}
          />
          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em' }}>
            YÊU CẦU BẢO DƯỠNG ĐANG CHỜ DUYỆT
          </span>
        </div>
      </div>

      <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
        {maintenance.title}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', fontSize: '9.5px' }}>
        <span
          style={{
            background: typeCfg?.bg || 'rgba(255, 255, 255, 0.1)',
            border: `1px solid ${typeCfg?.color || '#94a3b8'}`,
            color: typeCfg?.color || '#ffffff',
            padding: '1px 6px',
            borderRadius: '4px',
            fontWeight: 700,
          }}
        >
          {typeCfg?.labelVi || maintenance.maintenanceType}
        </span>
        <span
          style={{
            background: prioCfg?.bg || 'rgba(255, 255, 255, 0.1)',
            color: prioCfg?.color || '#ffffff',
            padding: '1px 6px',
            borderRadius: '4px',
            fontWeight: 700,
          }}
        >
          {prioCfg?.labelVi || maintenance.priority}
        </span>
      </div>

      {maintenance.description && (
        <div style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: '1.4' }}>
          <span style={{ color: '#94a3b8' }}>Lý do: </span>
          {maintenance.description}
        </div>
      )}

      {/* Approval progress */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: '8px',
          padding: '6px 8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>
            PHÊ DUYỆT: {approveWeight}%
          </span>
          <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>
            cần &gt; {threshold}%
          </span>
        </div>
        <div
          style={{
            height: '5px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, approveWeight)}%`,
              background: approveWeight > threshold ? '#10b981' : '#f59e0b',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenMaintenance}
        style={{
          width: '100%',
          marginTop: '2px',
          background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
          border: 'none',
          borderRadius: '8px',
          padding: '7px 10px',
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
        <Wrench size={13} />
        <span>XEM & BIỂU QUYẾT BẢO DƯỠNG</span>
      </button>
    </div>
  );
};

export interface CoOwnerVehiclePanelProps {
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
  const enterVehicleDamageHistoryMode = useWorldStore((state) => state.enterVehicleDamageHistoryMode);
  const enterVehicleMaintenanceMode = useWorldStore((state) => state.enterVehicleMaintenanceMode);
  const enterBatteryXrayMode = useWorldStore((state) => state.enterBatteryXrayMode);
  const enterChargingMode = useWorldStore((state) => state.enterChargingMode);

  // TanStack Queries (authoritative server state)
  const { data: activeHandovers = [] } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeVehicleHandovers', vehicle.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 4000,
  });

  const { data: allBookings = [] } = useQuery<Booking[]>({
    queryKey: ['vehicleBookings', vehicle.id],
    queryFn: () => fetchVehicleBookings(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 8000,
  });

  const { data: activeTrip } = useQuery<TripData | null>({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 3000,
  });

  const { data: vehicleMaintenanceList = [] } = useQuery<MaintenanceResponse[]>({
    queryKey: ['vehicleMaintenance', vehicle.id],
    queryFn: () => fetchVehicleMaintenance(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 5000,
  });

  const { data: damages = [] } = useQuery<DamageRecordData[]>({
    queryKey: ['vehicleDamages', vehicle.id],
    queryFn: () => (vehicle?.id ? fetchVehicleDamages(vehicle.id) : Promise.resolve([])),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 6000,
  });

  const pendingApprovalMaintenance = useMemo(() => {
    return vehicleMaintenanceList.find((m) => m.status === 'PENDING_APPROVAL') || null;
  }, [vehicleMaintenanceList]);

  const isVehicleInUse = vehicle.status === 'IN_USE';
  const isTripActive = !!activeTrip && activeTrip.status === 'ACTIVE';
  const isInconsistentInUseState = isVehicleInUse && !isTripActive;
  const isMyActiveTrip = isTripActive && !!activeTrip && (
    (!!user?.id && activeTrip.userId === user.id) ||
    (!!user?.email && activeTrip.userEmail === user.email)
  );
  const isOtherUserActiveTrip = isTripActive && !isMyActiveTrip;
  const isOverdue = isTripActive && isTripOverdue(activeTrip.bookingEndTime);

  // Resolve upcoming booking
  const upcomingBooking = useMemo(() => {
    const list = Array.isArray(allBookings) ? allBookings : [];
    if (list.length === 0) return null;
    const now = new Date();
    const myBookings = list.filter(
      (b) => b && b.status !== 'CANCELLED' && (!user?.id || b.userId === user?.id)
    );
    if (myBookings.length > 0) {
      return myBookings.find((b) => b.endTime && new Date(b.endTime) >= now) || myBookings[0];
    }
    const active = list.filter((b) => b && b.status === 'CONFIRMED');
    return active.find((b) => b.endTime && new Date(b.endTime) >= now) || active[0] || null;
  }, [allBookings, user?.id]);

  // Handover check-in eligibility
  const isEligibleForCheckIn = useMemo(() => {
    if (isTripActive || isVehicleInUse) return false;
    const list = Array.isArray(activeHandovers) ? activeHandovers : [];
    if (list.length === 0) return false;
    return list.some(
      (h) =>
        h &&
        h.status === 'HANDED_OVER' &&
        (!user?.id || h.coOwnerId === user?.id || h.coOwnerEmail === user?.email)
    );
  }, [activeHandovers, user, isTripActive, isVehicleInUse]);

  const isWaitingForStaffHandover = useMemo(() => {
    if (isTripActive || isVehicleInUse) return false;
    const list = Array.isArray(activeHandovers) ? activeHandovers : [];
    if (list.length === 0) return false;
    return list.some(
      (h) =>
        h &&
        h.status === 'READY_FOR_HANDOVER' &&
        (!user?.id || h.coOwnerId === user?.id || h.coOwnerEmail === user?.email)
    );
  }, [activeHandovers, user, isTripActive, isVehicleInUse]);

  const {
    candidateBooking,
    completedHandover,
    tripEligibility,
    isEligibilityError,
    eligibilityErrorMessage,
  } = useCoOwnerTripPrerequisites(vehicle.id, isTripActive);

  const displayCode = resolveVehicleCode(vehicle) || 'EV01';
  const statusConfig = isTripActive
    ? { label: 'Đang sử dụng', color: '#00f2fe' }
    : VEHICLE_STATUS_LABELS[vehicle.status] || {
        label: 'Sẵn sàng',
        color: '#10b981',
      };
  const estimatedRangeKm = Math.round(((vehicle.currentBatteryLevel || 82) / 100) * 450);

  return (
    <div
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '76px',
        right: '24px',
        width: '380px',
        maxHeight: 'calc(100vh - 96px)',
        overflowY: 'auto',
        background: 'rgba(7, 20, 38, 0.90)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(34, 230, 255, 0.35)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 25px rgba(34, 230, 255, 0.18)',
        borderRadius: '24px',
        padding: '20px',
        color: '#ffffff',
        fontFamily: 'var(--font-family, sans-serif)',
        zIndex: 40,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Close button: Top-Right */}
      <button
        type="button"
        onClick={onClose}
        title="Quay lại toàn cảnh garage"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
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
          zIndex: 30,
          transition: 'all 0.18s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 242, 254, 0.2)';
          e.currentTarget.style.color = '#00f2fe';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        <X size={15} />
      </button>

      {/* =================================================== */}
      {/* SECTION 1: THÔNG TIN XE                             */}
      {/* =================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Cyan Badge */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.35), rgba(8, 20, 36, 0.95))',
              border: '1.5px solid #00f2fe',
              boxShadow: '0 0 12px rgba(0, 242, 254, 0.4)',
              borderRadius: '8px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 900,
              color: '#00f2fe',
              letterSpacing: '0.04em',
            }}
          >
            {displayCode}
          </div>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '9999px',
              padding: '2px 8px',
              fontSize: '9.5px',
              fontWeight: 800,
              color: '#34d399',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              textTransform: 'uppercase',
            }}
          >
            <Sparkles size={10} color="#34d399" />
            <span>ĐỒNG SỞ HỮU</span>
          </div>
        </div>

        <h3
          style={{
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            margin: '4px 0 0 0',
            color: '#ffffff',
          }}
        >
          {vehicle.name || 'VinFast VF8 / EVShare Hero'}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
          <span style={{ color: '#00f2fe', fontWeight: 700 }}>
            {vehicle.licensePlate || '51K-888.88'}
          </span>
          <span>•</span>
          <span>{vehicle.brand || 'VinFast'} {vehicle.model || 'VF8'}</span>
          <span>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: statusConfig.color, fontWeight: 700 }}>
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
      </div>

      {/* =================================================== */}
      {/* SECTION 2: PIN & TẦM HOẠT ĐỘNG                     */}
      {/* =================================================== */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(0, 242, 254, 0.22)',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
            <Zap size={14} color="#00f2fe" />
            <span>PIN & TẦM HOẠT ĐỘNG</span>
          </div>

          <button
            type="button"
            onClick={() => enterBatteryXrayMode(vehicle.id)}
            title="Xem X-Ray Pin 3D"
            style={{
              background: 'none',
              border: 'none',
              color: '#00f2fe',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: 0,
            }}
          >
            <span>X-Ray 3D</span>
            <ChevronRight size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {vehicle.currentBatteryLevel}%
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Dung lượng khả dụng</span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
            ~{estimatedRangeKm} km
          </div>
        </div>

        {/* Gradient Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${vehicle.currentBatteryLevel}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #06b6d4 0%, #00f2fe 100%)',
              borderRadius: '9999px',
              boxShadow: '0 0 10px rgba(0, 242, 254, 0.7)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
          <span>Tình trạng pin: <strong style={{ color: '#34d399' }}>Tối ưu</strong></span>
          <span>Dung lượng: <strong style={{ color: '#f8fafc' }}>{vehicle.batteryCapacity || 87.7} kWh</strong></span>
        </div>
      </div>

      {/* =================================================== */}
      {/* SECTION 3: TRẠNG THÁI TỔNG QUAN                     */}
      {/* =================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          TRẠNG THÁI TỔNG QUAN
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {/* Card 1: Khả dụng */}
          <div style={statusCardStyle()}>
            <span style={statusCardLabelStyle()}>Vận hành</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 800, color: statusConfig.color }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: statusConfig.color,
                }}
              />
              <span>{statusConfig.label}</span>
            </div>
          </div>

          {/* Card 2: Bảo dưỡng */}
          <div style={statusCardStyle()}>
            <span style={statusCardLabelStyle()}>Bảo dưỡng</span>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: pendingApprovalMaintenance ? '#fbbf24' : vehicle.status === 'MAINTENANCE' ? '#f59e0b' : '#34d399' }}>
              {pendingApprovalMaintenance ? 'Chờ phê duyệt' : vehicle.status === 'MAINTENANCE' ? 'Đang bảo dưỡng' : 'Định kỳ ổn định'}
            </span>
          </div>

          {/* Card 3: Hư hỏng */}
          <div style={statusCardStyle()}>
            <span style={statusCardLabelStyle()}>Ghi nhận hư hỏng</span>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: damages.length > 0 ? '#fbbf24' : '#34d399' }}>
              {damages.length > 0 ? `${damages.length} điểm ghi nhận` : 'Không có hư hỏng'}
            </span>
          </div>

          {/* Card 4: Sạc xe */}
          <div style={statusCardStyle()}>
            <span style={statusCardLabelStyle()}>Cổng sạc</span>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: vehicle.status === 'CHARGING' ? '#00f2fe' : '#38bdf8' }}>
              {vehicle.status === 'CHARGING' ? 'Đang sạc' : 'Sẵn sàng kết nối'}
            </span>
          </div>
        </div>
      </div>

      {/* =================================================== */}
      {/* SECTION 4: LỊCH GẦN NHẤT                           */}
      {/* =================================================== */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(0, 242, 254, 0.22)',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
            <Clock size={13} color="#00f2fe" />
            <span>LỊCH SỬ DỤNG GẦN NHẤT</span>
          </div>
          <button
            type="button"
            onClick={() => setVehicleFeatureMode('CO_OWNER_MY_BOOKINGS')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Lịch của tôi
          </button>
        </div>

        {candidateBooking || upcomingBooking ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
              {formatDate((candidateBooking || upcomingBooking)!.startTime)}
            </div>
            <div style={{ fontSize: '11.5px', color: '#00f2fe', fontWeight: 700 }}>
              {formatTimeRange((candidateBooking || upcomingBooking)!.startTime, (candidateBooking || upcomingBooking)!.endTime)}
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
              Trạng thái: <strong style={{ color: '#34d399' }}>Đã xác nhận</strong>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              Chưa có lịch sử dụng sắp tới.
            </span>
            <button
              type="button"
              disabled={vehicle.status === 'MAINTENANCE'}
              onClick={() => {
                if (vehicle.status !== 'MAINTENANCE') setVehicleFeatureMode('BOOKING');
              }}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 12px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                cursor: vehicle.status === 'MAINTENANCE' ? 'not-allowed' : 'pointer',
                opacity: vehicle.status === 'MAINTENANCE' ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Calendar size={13} />
              <span>ĐẶT LỊCH NGAY</span>
            </button>
          </div>
        )}
      </div>

      {/* =================================================== */}
      {/* SECTION 5: NOTICES (Bảo dưỡng chờ duyệt, Trip, v.v.)*/}
      {/* =================================================== */}
      {pendingApprovalMaintenance && (
        <PendingApprovalMaintenanceNotice
          maintenance={pendingApprovalMaintenance}
          onOpenMaintenance={() => enterVehicleMaintenanceMode()}
        />
      )}

      {/* Active Trip Notice */}
      {isMyActiveTrip && activeTrip && (
        <div
          style={{
            background: 'rgba(2, 132, 199, 0.16)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            borderRadius: '14px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>CHUYẾN ĐI ĐANG DIỄN RA</span>
            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>{displayCode}</span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
            Khung giờ: <strong style={{ color: '#00f2fe' }}>{formatTimeRange(activeTrip.bookingStartTime, activeTrip.bookingEndTime)}</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => enterVehicleTripVisualizationMode()}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              XEM CHUYẾN ĐI
            </button>
            <button
              type="button"
              onClick={() => enterVehicleTripVisualizationMode()}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #e11d48 0%, #ef4444 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              KẾT THÚC
            </button>
          </div>
        </div>
      )}

      {/* Other Co-Owner Active Trip */}
      {isOtherUserActiveTrip && activeTrip && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '14px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '11px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, color: '#fbbf24' }}>XE ĐANG ĐƯỢC SỬ DỤNG</span>
            {isOverdue && (
              <span style={{ fontSize: '9px', fontWeight: 800, background: 'rgba(239, 68, 68, 0.25)', color: '#f87171', padding: '1px 6px', borderRadius: '4px' }}>
                QUÁ GIỜ
              </span>
            )}
          </div>
          <div style={{ color: '#cbd5e1' }}>Người dùng: <strong style={{ color: '#ffffff' }}>{activeTrip.userName || 'Thành viên nhóm'}</strong></div>
          <div style={{ color: '#94a3b8' }}>Dự kiến trả: <strong style={{ color: '#38bdf8' }}>{activeTrip.bookingEndTime ? formatDateTime(activeTrip.bookingEndTime) : 'Sau chuyến đi'}</strong></div>
        </div>
      )}

      {/* Ready for Check-in / Receipt */}
      {isEligibleForCheckIn && (
        <button
          type="button"
          onClick={() => enterVehicleReceiptReviewMode()}
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            border: '1px solid #10b981',
            borderRadius: '10px',
            padding: '9px 14px',
            color: '#ffffff',
            fontSize: '11.5px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
          }}
        >
          <Key size={14} />
          <span>NHẬN XE ĐỒNG SỞ HỮU</span>
        </button>
      )}

      {/* Waiting for Staff Handover */}
      {isWaitingForStaffHandover && !isEligibleForCheckIn && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            color: '#38bdf8',
            fontSize: '10.5px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Clock size={13} />
          <span>XE ĐÃ SẴN SÀNG — CHỜ NHÂN VIÊN GIAO XE</span>
        </div>
      )}

      {/* =================================================== */}
      {/* SECTION 6: CÁC TÍNH NĂNG PHỤ TRỢ (QUICK CHIPS)      */}
      {/* =================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          TÍNH NĂNG NHANH
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setVehicleFeatureMode('CO_OWNERSHIP')}
            style={secondaryChipButtonStyle()}
          >
            <Users size={13} color="#34d399" />
            <span>Đồng sở hữu</span>
          </button>
          <button
            type="button"
            onClick={() => enterChargingMode(vehicle.id)}
            style={secondaryChipButtonStyle()}
          >
            <BatteryCharging size={13} color="#00f2fe" />
            <span>Sạc xe</span>
          </button>
          <button
            type="button"
            onClick={() => setVehicleFeatureMode('VEHICLE_EXPLORE')}
            style={secondaryChipButtonStyle()}
          >
            <Search size={13} color="#38bdf8" />
            <span>Khám phá 3D</span>
          </button>
          <button
            type="button"
            onClick={() => enterVehicleMaintenanceMode()}
            style={secondaryChipButtonStyle()}
          >
            <Wrench size={13} color="#fbbf24" />
            <span>Lịch sử bảo dưỡng</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function statusCardStyle(): React.CSSProperties {
  return {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  };
}

function statusCardLabelStyle(): React.CSSProperties {
  return {
    fontSize: '9.5px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.03em',
  };
}

function secondaryChipButtonStyle(): React.CSSProperties {
  return {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '7px 10px',
    color: '#f1f5f9',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  };
}
