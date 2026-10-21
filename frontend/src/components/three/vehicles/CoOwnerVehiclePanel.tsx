import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { fetchActiveTripForVehicle, requestTripReturnApi } from '../../../services/tripApi';
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
  Flag,
  Loader2,
  RotateCcw,
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
  const enterVehicleTripStartMode = useWorldStore((state) => state.enterVehicleTripStartMode);
  const enterVehicleDamageHistoryMode = useWorldStore((state) => state.enterVehicleDamageHistoryMode);
  const enterVehicleMaintenanceMode = useWorldStore((state) => state.enterVehicleMaintenanceMode);
  const enterBatteryXrayMode = useWorldStore((state) => state.enterBatteryXrayMode);
  const enterChargingMode = useWorldStore((state) => state.enterChargingMode);

  const queryClient = useQueryClient();
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  const handleRequestReturn = async () => {
    if (!activeTrip?.id || isSubmittingReturn) return;
    setIsSubmittingReturn(true);
    setReturnError(null);
    try {
      await requestTripReturnApi(activeTrip.id);
      setShowReturnConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['activeTrip', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicleBookings', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['bookingHandover'] });
    } catch (err: any) {
      setReturnError(err.message || 'Không thể gửi yêu cầu trả xe. Vui lòng thử lại.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

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
    bookingHandover,
    completedHandover,
    bookingTrip,
    tripEligibility,
    isEligibleToStart,
    isInspectionOnlyCompleted,
    isWaitingForStaff,
    isLoading: isPrereqLoading,
    isEligibilityError,
    eligibilityErrorMessage,
    refetchEligibility,
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
      {/* SECTION 4: THÔNG TIN VẬN HÀNH / CHUYẾN ĐI / LỊCH ĐẶT */}
      {/* =================================================== */}
      {isMyActiveTrip && activeTrip ? (
        /* CASE A: CO_OWNER ACTIVE TRIP CARD (Section 4 & 5) */
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.22) 0%, rgba(8, 20, 36, 0.95) 100%)',
            border: `1.5px solid ${activeTrip.returnRequestedAt ? '#f59e0b' : '#00f2fe'}`,
            boxShadow: `0 0 20px ${activeTrip.returnRequestedAt ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 242, 254, 0.25)'}`,
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
                CHUYẾN ĐI CỦA TÔI
              </span>
              <span
                style={{
                  background: activeTrip.returnRequestedAt ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 242, 254, 0.2)',
                  border: `1px solid ${activeTrip.returnRequestedAt ? '#f59e0b' : '#00f2fe'}`,
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: activeTrip.returnRequestedAt ? '#fbbf24' : '#00f2fe',
                }}
              >
                {activeTrip.returnRequestedAt ? 'CHỜ TRẢ XE' : 'ĐANG SỬ DỤNG'}
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              {activeTrip.vehicleCode || displayCode}
            </span>
          </div>

          {showReturnConfirm ? (
            /* SUBVIEW: RETURN REQUEST CONFIRMATION (Section 7) */
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '11px', fontWeight: 800 }}>
                <AlertTriangle size={14} color="#fbbf24" />
                <span>XÁC NHẬN YÊU CẦU TRẢ XE</span>
              </div>

              <div style={{ fontSize: '10.5px', display: 'flex', flexDirection: 'column', gap: '4px', color: '#cbd5e1' }}>
                <div>Phương tiện: <strong style={{ color: '#ffffff' }}>{displayCode} ({vehicle.licensePlate || '51K-888.88'})</strong></div>
                <div>Bắt đầu lúc: <strong style={{ color: '#ffffff' }}>{formatDateTime(activeTrip.startedAt)}</strong></div>
                <div>Thời gian gửi yêu cầu: <strong style={{ color: '#00f2fe' }}>{formatDateTime(new Date().toISOString())}</strong></div>
                <div>Trạng thái hiện tại: <strong style={{ color: '#34d399' }}>ĐANG SỬ DỤNG</strong></div>
              </div>

              {returnError && (
                <div style={{ color: '#f87171', fontSize: '10px', fontWeight: 600 }}>
                  {returnError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  disabled={isSubmittingReturn}
                  onClick={handleRequestReturn}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: isSubmittingReturn ? 'not-allowed' : 'pointer',
                    opacity: isSubmittingReturn ? 0.6 : 1,
                  }}
                >
                  {isSubmittingReturn ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU TRẢ XE'}
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReturn}
                  onClick={() => setShowReturnConfirm(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  TIẾP TỤC CHUYẾN ĐI
                </button>
              </div>
            </div>
          ) : (
            /* SUBVIEW: PERSISTED ACTIVE TRIP DETAILS (Section 5) */
            <>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  fontSize: '10.5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Biển số xe:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{vehicle.licensePlate || activeTrip.licensePlate || 'Chưa có dữ liệu cập nhật'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Mã lịch đặt:</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{activeTrip.bookingId ? activeTrip.bookingId.substring(0, 8).toUpperCase() : 'Chưa có dữ liệu cập nhật'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Thời gian bắt đầu:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{formatDateTime(activeTrip.startedAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Dự kiến kết thúc:</span>
                  <span style={{ color: '#00f2fe', fontWeight: 600 }}>{activeTrip.bookingEndTime ? formatDateTime(activeTrip.bookingEndTime) : 'Chưa có dữ liệu cập nhật'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Pin bắt đầu (SOC):</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>{activeTrip.startBatteryLevel != null ? `${activeTrip.startBatteryLevel}%` : 'Chưa có dữ liệu cập nhật'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Pin mới nhất (SOC):</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>{vehicle.currentBatteryLevel != null ? `${vehicle.currentBatteryLevel}%` : 'Chưa có dữ liệu cập nhật'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Odometer bắt đầu:</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{activeTrip.startOdometer != null ? `${Number(activeTrip.startOdometer).toLocaleString('vi-VN')} km` : 'Chưa có dữ liệu cập nhật'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Odometer mới nhất:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{vehicle.odometer != null ? `${Number(vehicle.odometer).toLocaleString('vi-VN')} km` : 'Chưa có dữ liệu cập nhật'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Quãng đường đã đi:</span>
                  <span style={{ color: '#00f2fe', fontWeight: 700 }}>
                    {activeTrip.distanceTraveled != null
                      ? `${activeTrip.distanceTraveled} km`
                      : (vehicle.odometer != null && activeTrip.startOdometer != null && Number(vehicle.odometer) >= Number(activeTrip.startOdometer))
                      ? `${(Number(vehicle.odometer) - Number(activeTrip.startOdometer)).toFixed(1)} km`
                      : 'Chưa có dữ liệu cập nhật'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Phiên sạc trong chuyến:</span>
                  <span style={{ color: '#cbd5e1' }}>Không phát sinh phiên sạc</span>
                </div>
              </div>

              {activeTrip.returnRequestedAt && (
                /* Information Notice: Waiting for Staff (Section 8) */
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '10.5px', fontWeight: 800 }}>
                    <Clock size={12} color="#fbbf24" />
                    <span>ĐANG CHỜ NHÂN VIÊN NHẬN XE</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#e2e8f0', lineHeight: 1.4 }}>
                    Nhân viên sẽ kiểm tra tình trạng xe, pin và số km trước khi hoàn tất trả xe.
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                    Yêu cầu gửi lúc: {formatDateTime(activeTrip.returnRequestedAt)}
                  </div>
                </div>
              )}

              {/* Actions (Section 4) */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={() => enterVehicleTripVisualizationMode()}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#041325',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                >
                  <Compass size={13} color="#041325" />
                  <span>CHI TIẾT CHUYẾN ĐI</span>
                </button>

                {!activeTrip.returnRequestedAt ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReturnError(null);
                      setShowReturnConfirm(true);
                    }}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
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
                    <Flag size={13} />
                    <span>YÊU CẦU TRẢ XE</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '8px',
                      color: '#94a3b8',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    <CheckCircle2 size={12} color="#34d399" />
                    <span>ĐÃ GỬI YÊU CẦU</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : !candidateBooking ? (
        /* STATE A: NO CURRENT BOOKING */
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
              <span>ĐẶT LỊCH</span>
            </button>
          </div>
        </div>
      ) : isPrereqLoading ? (
        /* LOADING STATE */
        <div
          style={{
            background: 'rgba(2, 132, 199, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#38bdf8',
            fontSize: '11.5px',
            fontWeight: 700,
          }}
        >
          <Loader2 size={16} className="animate-spin" color="#00f2fe" />
          <span>ĐANG KIỂM TRA TRẠNG THÁI BÀN GIAO...</span>
        </div>
      ) : isEligibilityError ? (
        /* ERROR STATE (SAFE RETRY) */
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '11px', fontWeight: 800 }}>
            <AlertTriangle size={14} />
            <span>KHÔNG THỂ KIỂM TRA TRẠNG THÁI BÀN GIAO</span>
          </div>
          <p style={{ margin: 0, fontSize: '10.5px', color: '#cbd5e1' }}>
            {eligibilityErrorMessage || 'Đã xảy ra lỗi khi xác minh điều kiện bàn giao. Vui lòng thử lại.'}
          </p>
          <button
            type="button"
            onClick={() => refetchEligibility()}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#ffffff',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={12} />
            <span>THỬ LẠI</span>
          </button>
        </div>
      ) : bookingTrip?.status === 'COMPLETED' ? (
        /* STATE G: TRIP COMPLETED */
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} color="#34d399" />
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399' }}>
                CHUYẾN ĐI ĐÃ HOÀN TẤT
              </span>
            </div>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '9.5px',
                fontWeight: 800,
              }}
            >
              KẾT THÚC
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Lịch: {formatDate(candidateBooking.startTime)} ({formatTimeRange(candidateBooking.startTime, candidateBooking.endTime)})
          </div>
          <button
            type="button"
            onClick={() => setVehicleFeatureMode('BOOKING')}
            style={{
              width: '100%',
              marginTop: '4px',
              background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
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
            <Calendar size={13} />
            <span>ĐẶT LỊCH CHUYẾN ĐI MỚI</span>
          </button>
        </div>
      ) : completedHandover ? (
        /* STATE D: STAFF HANDOVER CONFIRMED */
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(8, 20, 36, 0.95) 100%)',
            border: '1.5px solid #10b981',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399', letterSpacing: '0.03em' }}>
                XE ĐÃ BÀN GIAO THÀNH CÔNG
              </span>
            </div>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '9.5px',
                fontWeight: 800,
              }}
            >
              SẴN SÀNG
            </span>
          </div>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '10.5px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Lịch đặt:</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>
                {formatDate(candidateBooking.startTime)} ({formatTimeRange(candidateBooking.startTime, candidateBooking.endTime)})
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Bàn giao lúc:</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>
                {formatDateTime(completedHandover.staffHandedOverAt || completedHandover.updatedAt)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
              <span style={{ color: '#00f2fe', fontWeight: 700 }}>
                {vehicle.name} ({vehicle.licensePlate})
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Người nhận xe:</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>
                {completedHandover.coOwnerName || user?.fullName || 'Đồng sở hữu'}
              </span>
            </div>
          </div>

          {tripEligibility && !tripEligibility.eligible && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '8px',
                padding: '6px 8px',
                color: '#fbbf24',
                fontSize: '10px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <AlertTriangle size={12} />
              <span>{eligibilityErrorMessage || tripEligibility.message || 'CHƯA ĐẾN THỜI GIAN SỬ DỤNG XE'}</span>
            </div>
          )}

          <button
            type="button"
            disabled={tripEligibility ? !tripEligibility.eligible : false}
            onClick={() => enterVehicleTripStartMode()}
            style={{
              width: '100%',
              marginTop: '4px',
              background:
                tripEligibility && !tripEligibility.eligible
                  ? 'rgba(75, 85, 99, 0.4)'
                  : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              cursor: tripEligibility && !tripEligibility.eligible ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              boxShadow:
                tripEligibility && !tripEligibility.eligible
                  ? 'none'
                  : '0 4px 14px rgba(16, 185, 129, 0.4)',
              opacity: tripEligibility && !tripEligibility.eligible ? 0.6 : 1,
            }}
          >
            <Play size={14} fill="#ffffff" />
            <span>BẮT ĐẦU CHUYẾN ĐI</span>
          </button>
        </div>
      ) : isInspectionOnlyCompleted ? (
        /* STATE C: PRE_HANDOVER INSPECTION COMPLETED, HANDOVER STILL PENDING */
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(8, 20, 36, 0.95) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.55)',
            boxShadow: '0 0 16px rgba(245, 158, 11, 0.2)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.03em' }}>
                XE ĐÃ KIỂM TRA — CHỜ BÀN GIAO
              </span>
            </div>
            <span
              style={{
                background: 'rgba(245, 158, 11, 0.25)',
                color: '#fbbf24',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '9.5px',
                fontWeight: 800,
              }}
            >
              ĐÃ KIỂM TRA 8/8
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
            Xe đã hoàn tất kiểm tra kỹ thuật đạt chuẩn. Đang chờ nhân viên kỹ thuật xác nhận bàn giao xe cho bạn.
          </p>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '10.5px',
              color: '#94a3b8',
            }}
          >
            Lịch đặt: <strong style={{ color: '#ffffff' }}>{formatDate(candidateBooking.startTime)} ({formatTimeRange(candidateBooking.startTime, candidateBooking.endTime)})</strong>
          </div>
        </div>
      ) : (
        /* STATE B: BOOKING CONFIRMED, HANDOVER NOT COMPLETED */
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12) 0%, rgba(8, 20, 36, 0.95) 100%)',
            border: '1.5px solid rgba(2, 132, 199, 0.45)',
            boxShadow: '0 0 16px rgba(2, 132, 199, 0.18)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#38bdf8" />
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.03em' }}>
                ĐANG CHỜ BÀN GIAO XE
              </span>
            </div>
            <span
              style={{
                background: 'rgba(2, 132, 199, 0.25)',
                color: '#38bdf8',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '9.5px',
                fontWeight: 800,
              }}
            >
              CHỜ BÀN GIAO
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
            Nhân viên chưa xác nhận hoàn tất bàn giao cho lịch đặt này.
          </p>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              fontSize: '10.5px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Lịch đặt:</span>
              <strong style={{ color: '#ffffff' }}>
                {formatDate(candidateBooking.startTime)} ({formatTimeRange(candidateBooking.startTime, candidateBooking.endTime)})
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
              <strong style={{ color: '#00f2fe' }}>{vehicle.name}</strong>
            </div>
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* SECTION 5: NOTICES (Bảo dưỡng chờ duyệt, v.v.)       */}
      {/* =================================================== */}
      {pendingApprovalMaintenance && (
        <PendingApprovalMaintenanceNotice
          maintenance={pendingApprovalMaintenance}
          onOpenMaintenance={() => enterVehicleMaintenanceMode()}
        />
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
