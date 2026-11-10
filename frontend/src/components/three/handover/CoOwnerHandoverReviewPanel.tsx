import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import {
  HANDOVER_CHECKPOINTS,
  VehicleHandoverData,
  VehicleHandoverEligibilityResponse,
  HANDOVER_STATUS_CONFIG,
  INSPECTION_CONDITION_CONFIG,
  getCheckpointByCode,
} from '../../../types/handover';
import { Booking } from '../../../types/booking';
import {
  fetchActiveVehicleHandovers,
  fetchBookingHandover,
  fetchHandoverEligibility,
  acknowledgeConditionApi,
  confirmOwnerReceiptApi,
  completeHandoverApi,
} from '../../../services/handoverApi';
import { fetchVehicleBookings } from '../../../services/bookingApi';
import { fetchActiveTripForVehicle } from '../../../services/tripApi';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';
import { resolveVehicleDisplayName, resolveVehicleCode } from '../vehicles/vehicleModelConfig';
import {
  Car,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Key,
  Check,
  Sparkles,
  X,
  FileText,
  Gauge,
  Battery,
  Loader2,
  ChevronRight,
  Info,
} from 'lucide-react';

export interface CoOwnerHandoverReviewPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

export const CoOwnerHandoverReviewPanel: React.FC<CoOwnerHandoverReviewPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const selectedHandoverCheckpoint = useWorldStore(
    (state) => state.selectedHandoverCheckpoint
  );
  const selectHandoverCheckpoint = useWorldStore(
    (state) => state.selectHandoverCheckpoint
  );
  const clearHandoverCheckpointSelection = useWorldStore(
    (state) => state.clearHandoverCheckpointSelection
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfirmedHandover, setLastConfirmedHandover] = useState<VehicleHandoverData | null>(null);

  // TanStack Query: Handover Eligibility for vehicle
  const {
    data: eligibility,
    isLoading: isEligibilityLoading,
  } = useQuery<VehicleHandoverEligibilityResponse>({
    queryKey: ['handoverEligibility', vehicle.id],
    queryFn: () => fetchHandoverEligibility(vehicle.id),
    staleTime: 5000,
  });

  // TanStack Query: Bookings for vehicle to resolve authoritative bookingId
  const { data: allBookings = [], isLoading: isBookingsLoading } = useQuery<Booking[]>({
    queryKey: ['vehicleBookings', vehicle.id],
    queryFn: () => fetchVehicleBookings(vehicle.id),
    staleTime: 10000,
  });

  // Resolve target booking ID authoritatively
  const targetBookingId = useMemo(() => {
    const now = new Date();
    const myBookings = allBookings.filter(
      (b) => b && b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && b.status !== 'EXPIRED' && (!user?.id || b.userId === user?.id)
    );
    if (myBookings.length > 0) {
      const activeOrUpcoming = myBookings.find((b) => b.endTime && new Date(b.endTime) >= now);
      if (activeOrUpcoming) return activeOrUpcoming.id;
    }
    if (eligibility?.bookingId) return eligibility.bookingId;
    return null;
  }, [eligibility?.bookingId, allBookings, user?.id]);

  // TanStack Query: Handover by booking (authoritative source of truth)
  const {
    data: bookingHandover,
    isLoading: isBookingHandoverLoading,
  } = useQuery<VehicleHandoverData | null>({
    queryKey: ['handoverByBooking', targetBookingId],
    queryFn: () => (targetBookingId ? fetchBookingHandover(targetBookingId) : null),
    enabled: !!targetBookingId,
    staleTime: 0,
  });

  // TanStack Query: Fetch active vehicle handovers
  const {
    data: activeHandovers = [],
    isLoading: isHandoversLoading,
  } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeVehicleHandovers', vehicle.id, user?.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    staleTime: 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.length === 0) return 8000;
      const my = data.find(
        (h) => h && (!user?.id || h.coOwnerId === user?.id || h.coOwnerEmail === user?.email)
      );
      if (!my) return 8000;
      if (my.status === 'HANDED_OVER' || my.status === 'OWNER_CONFIRMED' || my.status === 'COMPLETED') {
        return false;
      }
      return 8000;
    },
  });

  // Check if an active trip exists for this vehicle
  const { data: activeTrip } = useQuery({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    staleTime: 5000,
  });

  // Resolve current CO_OWNER handover strictly from server state matching current booking
  const handover = useMemo(() => {
    if (lastConfirmedHandover) return lastConfirmedHandover;
    if (!targetBookingId) return null;
    if (bookingHandover && bookingHandover.bookingId === targetBookingId) {
      return bookingHandover;
    }
    const list = Array.isArray(activeHandovers) ? activeHandovers : [];
    if (list.length > 0) {
      const myHandover = list.find(
        (h) =>
          h && h.bookingId === targetBookingId && (!user?.id || h.coOwnerId === user.id || h.coOwnerEmail === user.email)
      );
      if (myHandover) return myHandover;
    }
    if (eligibility?.handover && eligibility.bookingId === targetBookingId) {
      return eligibility.handover;
    }
    return null;
  }, [lastConfirmedHandover, bookingHandover, activeHandovers, eligibility, targetBookingId, user?.id, user?.email]);

  // Selected checkpoint object
  const currentCheckpointObj = useMemo(() => {
    if (!selectedHandoverCheckpoint) return null;
    return getCheckpointByCode(selectedHandoverCheckpoint) || null;
  }, [selectedHandoverCheckpoint]);

  // Read-only inspection details for currently selected checkpoint
  const currentInspection = useMemo(() => {
    if (!selectedHandoverCheckpoint || !handover?.inspections) return undefined;
    return handover.inspections.find(
      (i) => i.vehiclePartCode === selectedHandoverCheckpoint
    );
  }, [handover?.inspections, selectedHandoverCheckpoint]);

  // Overall condition statistics & unique inspected components
  const inspectionMetrics = useMemo(() => {
    let good = 0;
    let warning = 0;
    let damaged = 0;
    const list = handover?.inspections || [];
    const uniquePartCodes = new Set<string>();

    list.forEach((i) => {
      if (i.vehiclePartCode) uniquePartCodes.add(i.vehiclePartCode);
      if (i.conditionStatus === 'GOOD') good++;
      else if (i.conditionStatus === 'WARNING') warning++;
      else if (i.conditionStatus === 'DAMAGED') damaged++;
    });

    const uniqueCount = uniquePartCodes.size;
    const totalRecords = list.length;
    const requiredCount = handover?.requiredCheckpointsCount || HANDOVER_CHECKPOINTS.length;

    return {
      good,
      warning,
      damaged,
      totalAttention: warning + damaged,
      uniqueCount,
      totalRecords,
      requiredCount,
    };
  }, [handover?.inspections, handover?.requiredCheckpointsCount]);

  // Checkpoints that have warnings or damages
  const attentionItems = useMemo(() => {
    return (handover?.inspections || []).filter(
      (i) => i.conditionStatus === 'WARNING' || i.conditionStatus === 'DAMAGED'
    );
  }, [handover?.inspections]);

  // Date and Time formatters
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '--/--/----';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '--/--/----';
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return String(isoString);
    }
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '--:--';
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return String(isoString);
    }
  };

  // Telemetry snapshot: ODO & Battery SOC at handover
  const handoverSnapshot = useMemo(() => {
    const startOdo =
      activeTrip?.startOdometer != null
        ? Number(activeTrip.startOdometer)
        : (handover as any)?.startOdometer != null
        ? Number((handover as any).startOdometer)
        : vehicle.odometer != null
        ? Number(vehicle.odometer)
        : 0;

    const startBattery =
      activeTrip?.startBatteryLevel != null
        ? activeTrip.startBatteryLevel
        : (handover as any)?.startBatteryLevel != null
        ? (handover as any).startBatteryLevel
        : vehicle.currentBatteryLevel != null
        ? vehicle.currentBatteryLevel
        : 100;

    const snapshotTimestamp =
      handover?.staffHandedOverAt ||
      handover?.staffPreparedAt ||
      activeTrip?.startedAt ||
      handover?.createdAt;

    return {
      odometer: startOdo,
      batteryLevel: startBattery,
      timestamp: snapshotTimestamp,
    };
  }, [activeTrip, handover, vehicle]);

  // CO_OWNER Action: Acknowledge Condition
  const handleAcknowledgeCondition = async () => {
    if (!handover) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const acked = await acknowledgeConditionApi(handover.id);
      if (acked) {
        setLastConfirmedHandover(acked);
      }
      const bId = targetBookingId || handover.bookingId || eligibility?.bookingId;
      await Promise.all([
        bId ? queryClient.invalidateQueries({ queryKey: ['handoverByBooking', bId] }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', handover.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['tripEligibility'] }),
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể xác nhận đã xem tình trạng xe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CO_OWNER Action: Confirm Receipt & Complete Check-in
  const handleConfirmReceipt = async () => {
    if (!handover) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (!handover.conditionAcknowledged && !handover.ownerConditionAcknowledgedAt) {
        await acknowledgeConditionApi(handover.id);
      }
      const confirmed = await confirmOwnerReceiptApi(handover.id);
      let finalHandover = confirmed;
      try {
        finalHandover = await completeHandoverApi(handover.id);
      } catch {
        // Handover completion may already be done or auto-finalized
      }
      setLastConfirmedHandover(finalHandover || { ...handover, status: 'COMPLETED' });

      const bId = targetBookingId || handover.bookingId || eligibility?.bookingId;
      await Promise.all([
        bId ? queryClient.invalidateQueries({ queryKey: ['handoverByBooking', bId] }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', handover.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleBookings', vehicle.id] }),
        bId ? queryClient.invalidateQueries({ queryKey: ['booking', bId] }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['tripEligibility'] }),
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể xác nhận nhận xe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isConditionAcknowledged =
    Boolean(handover?.conditionAcknowledged) ||
    Boolean(handover?.ownerConditionAcknowledgedAt);

  const isHandedOver = handover?.status === 'HANDED_OVER';
  const isCompleted =
    handover?.status === 'OWNER_CONFIRMED' || handover?.status === 'COMPLETED';

  const statusConfig = handover?.status
    ? HANDOVER_STATUS_CONFIG[handover.status]
    : {
        labelVi: 'Đang chuẩn bị',
        color: '#38bdf8',
        badgeBg: 'rgba(56, 189, 248, 0.15)',
        border: 'rgba(56, 189, 248, 0.4)',
      };

  const displayName = resolveVehicleDisplayName(vehicle);
  const vehicleCode = resolveVehicleCode(vehicle);

  const isLoadingInitial =
    !handover &&
    (isHandoversLoading || (!!targetBookingId && isBookingHandoverLoading) || isEligibilityLoading);

  return (
    <aside
      ref={panelRef}
      role="complementary"
      aria-label="Bàn giao và nhận xe điện"
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '76px',
        right: '24px',
        width: '420px',
        maxWidth: 'calc(100vw - 48px)',
        maxHeight: 'calc(100vh - 96px)',
        overflowY: 'auto',
        background: 'rgba(7, 20, 38, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 242, 254, 0.40)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 25px rgba(0, 242, 254, 0.20)',
        borderRadius: '24px',
        padding: '18px 20px',
        color: '#ffffff',
        fontFamily: 'var(--font-family, system-ui, sans-serif)',
        zIndex: 40,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top-Right Prominent Close Button */}
      <button
        type="button"
        onClick={onClose}
        title="Quay lại xe điện"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
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
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          e.currentTarget.style.color = '#ff6b6b';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        <X size={15} />
      </button>

      {/* 1. HEADER: BRANDING & VEHICLE IDENTITY */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.3), rgba(8, 16, 28, 0.9))',
              border: '1px solid #00f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(0, 242, 254, 0.4)',
            }}
          >
            <Key size={15} color="#00f2fe" />
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#38bdf8',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            BÀN GIAO & NHẬN XE
          </span>
        </div>

        <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.01em' }}>
          {displayName}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
          <span style={{ fontWeight: 800, color: '#00e0c7', letterSpacing: '0.04em' }}>
            {vehicleCode}
          </span>
          <span style={{ color: '#64748b' }}>•</span>
          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
            {vehicle.licensePlate || 'Chưa cập nhật biển số'}
          </span>
          {handover?.bookingId && (
            <>
              <span style={{ color: '#64748b' }}>•</span>
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>
                Lịch #{handover.bookingId.slice(0, 8)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* LOADING STATE */}
      {isLoadingInitial && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '14px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#38bdf8',
          }}
        >
          <Loader2 size={24} className="animate-spin" color="#00f2fe" />
          <span style={{ fontSize: '12px', fontWeight: 700 }}>Đang tải dữ liệu bàn giao xe...</span>
        </div>
      )}

      {/* ERROR MESSAGE IF ANY */}
      {errorMessage && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '10px',
            padding: '8px 12px',
            color: '#f87171',
            fontSize: '11.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. AUTHORITATIVE STATUS BADGE */}
      {handover && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: `1.5px solid ${statusConfig.border}`,
            borderRadius: '14px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: `0 4px 16px ${statusConfig.border}22`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Trạng thái quy trình
            </span>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 800,
                color: statusConfig.color,
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: statusConfig.color,
                  boxShadow: `0 0 8px ${statusConfig.color}`,
                }}
              />
              <span>{statusConfig.labelVi}</span>
            </div>
          </div>

          {/* Unambiguous inspection summary: unique components vs total records */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Kiểm tra đạt chuẩn
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 900, color: '#34d399' }}>
              {inspectionMetrics.uniqueCount} / {inspectionMetrics.requiredCount} bộ phận
            </span>
          </div>
        </div>
      )}

      {/* 3. TELEMETRY SNAPSHOT: ODO & PIN LÚC BÀN GIAO */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            fontSize: '10.5px',
            fontWeight: 800,
            color: '#38bdf8',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
            paddingBottom: '6px',
          }}
        >
          <Gauge size={13} />
          <span>ODO & PIN LÚC BÀN GIAO</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {/* Starting Odometer */}
          <div
            style={{
              background: 'rgba(8, 12, 22, 0.65)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '10px',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Công-tơ-mét (ODO)</span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: '#38bdf8' }}>
              {handoverSnapshot.odometer.toLocaleString('vi-VN')} km
            </span>
          </div>

          {/* Starting Battery SOC */}
          <div
            style={{
              background: 'rgba(8, 12, 22, 0.65)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '10px',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Dung lượng pin (SOC)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Battery size={14} color="#10b981" />
              <span style={{ fontSize: '14px', fontWeight: 900, color: '#10b981' }}>
                {handoverSnapshot.batteryLevel}%
              </span>
            </div>
          </div>
        </div>

        {handoverSnapshot.timestamp && (
          <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'right' }}>
            Thời điểm ghi nhận: {formatTime(handoverSnapshot.timestamp)} ({formatDate(handoverSnapshot.timestamp)})
          </div>
        )}
      </div>

      {/* 4. OVERALL INSPECTION RESULT & RECORD METRICS */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileText size={13} color="#38bdf8" />
            <span>KẾT QUẢ KIỂM TRA BỘ PHẬN</span>
          </div>

          {/* Distinction between unique parts and total recorded history entries */}
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
            Tổng {inspectionMetrics.totalRecords} bản ghi đánh giá
          </div>
        </div>

        {/* 3 Status summary badges */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '8px',
              padding: '6px 8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '9.5px', color: '#34d399', fontWeight: 700 }}>TỐT</div>
            <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 900 }}>
              {inspectionMetrics.good}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '8px',
              padding: '6px 8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '9.5px', color: '#fbbf24', fontWeight: 700 }}>CẢNH BÁO</div>
            <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 900 }}>
              {inspectionMetrics.warning}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '6px 8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '9.5px', color: '#f87171', fontWeight: 700 }}>HƯ HỎNG</div>
            <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 900 }}>
              {inspectionMetrics.damaged}
            </div>
          </div>
        </div>

        {/* Attention Banner if Warnings or Damage Exist */}
        {inspectionMetrics.totalAttention > 0 && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#fbbf24',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              <AlertTriangle size={13} />
              <span>CÓ {inspectionMetrics.totalAttention} ĐIỂM CẦN LƯU Ý KHI NHẬN XE:</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {attentionItems.map((item) => {
                const cp = getCheckpointByCode(item.vehiclePartCode);
                const isDamaged = item.conditionStatus === 'DAMAGED';
                return (
                  <div
                    key={item.id}
                    onClick={() => selectHandoverCheckpoint(item.vehiclePartCode)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '10.5px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>
                      {cp?.nameVi || item.vehiclePartCode}
                    </span>
                    <span
                      style={{
                        color: isDamaged ? '#f87171' : '#fbbf24',
                        fontWeight: 700,
                        fontSize: '9.5px',
                        background: isDamaged ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        padding: '1px 6px',
                        borderRadius: '3px',
                      }}
                    >
                      {isDamaged ? 'Hư hỏng' : 'Cảnh báo'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. READ-ONLY 3D COMPONENT INSPECTION CARD (Synchronized with 3D selection) */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: selectedHandoverCheckpoint
            ? '1.5px solid rgba(56, 189, 248, 0.6)'
            : '1px dashed rgba(56, 189, 248, 0.25)',
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#38bdf8',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            CHI TIẾT ĐIỂM KIỂM TRA (3D)
          </span>

          {selectedHandoverCheckpoint && (
            <button
              type="button"
              onClick={clearHandoverCheckpointSelection}
              title="Đóng chi tiết bộ phận"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {selectedHandoverCheckpoint && currentCheckpointObj ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
              {currentCheckpointObj.nameVi}{' '}
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                ({currentCheckpointObj.categoryVi})
              </span>
            </div>

            {currentInspection ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Đánh giá nhân viên:</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 800,
                      fontSize: '11px',
                      color: INSPECTION_CONDITION_CONFIG[currentInspection.conditionStatus].color,
                      background: INSPECTION_CONDITION_CONFIG[currentInspection.conditionStatus].bg,
                      border: `1px solid ${INSPECTION_CONDITION_CONFIG[currentInspection.conditionStatus].border}`,
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {currentInspection.conditionStatus === 'GOOD' && <CheckCircle2 size={12} />}
                    {currentInspection.conditionStatus === 'WARNING' && <AlertTriangle size={12} />}
                    {currentInspection.conditionStatus === 'DAMAGED' && <XCircle size={12} />}
                    {INSPECTION_CONDITION_CONFIG[currentInspection.conditionStatus].labelVi}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: '#94a3b8' }}>Ghi chú từ KTV:</span>
                  <div
                    style={{
                      background: 'rgba(8, 12, 22, 0.7)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: currentInspection.note ? '#ffffff' : '#94a3b8',
                      fontStyle: currentInspection.note ? 'normal' : 'italic',
                      fontSize: '11px',
                    }}
                  >
                    {currentInspection.note || 'Không có ghi chú thêm từ nhân viên kiểm tra.'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Người kiểm tra:</span>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                    {currentInspection.inspectedByName || handover?.staffName || 'KTV EVShare'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Thời gian:</span>
                  <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                    {formatTime(currentInspection.inspectedAt)} ({formatDate(currentInspection.inspectedAt)})
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic', padding: '4px 0' }}>
                Chưa có kết quả kiểm tra cho bộ phận này từ nhân viên kỹ thuật.
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '11px',
              padding: '6px 8px',
              lineHeight: 1.5,
            }}
          >
            Nhấp vào các điểm tròn 3D trên xe để xem chi tiết tình trạng đánh giá của từng bộ phận.
          </div>
        )}
      </div>

      {/* 6. BOOKING & HANDOVER INFORMATION */}
      {handover && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '11.5px',
          }}
        >
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#38bdf8',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
              paddingBottom: '4px',
              marginBottom: '2px',
            }}
          >
            THÔNG TIN LỊCH BÀN GIAO
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8' }}>Người nhận:</span>
            <span style={{ fontWeight: 800, color: '#ffffff' }}>
              {handover.coOwnerName || user?.fullName || 'Đồng sở hữu'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8' }}>Ngày nhận:</span>
            <span style={{ fontWeight: 600, color: '#ffffff' }}>
              {formatDate(handover.bookingStartTime)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8' }}>Khung giờ đặt:</span>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>
              {formatTime(handover.bookingStartTime)} - {formatTime(handover.bookingEndTime)}
            </span>
          </div>

          {handover.bookingPurpose && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Mục đích:</span>
              <span style={{ fontWeight: 500, color: '#cbd5e1' }}>
                {handover.bookingPurpose}
              </span>
            </div>
          )}

          {handover.staffName && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Nhân viên phụ trách:</span>
              <span style={{ fontWeight: 600, color: '#cbd5e1' }}>
                {handover.staffName}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 7. CONFIRMATION & ACTION SECTION */}
      {handover && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {isHandedOver ? (
            <>
              {/* Step A: Acknowledge Condition button */}
              {!isConditionAcknowledged ? (
                <div>
                  <button
                    type="button"
                    onClick={handleAcknowledgeCondition}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '11px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#080c16',
                      fontWeight: 800,
                      fontSize: '11.5px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 15px rgba(56, 189, 248, 0.35)',
                      transition: 'all 0.2s ease',
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    <ShieldCheck size={15} />
                    <span>{isSubmitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐÃ XEM TÌNH TRẠNG XE'}</span>
                  </button>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', marginTop: '4px' }}>
                    * Vui lòng xem kỹ kết quả kiểm tra 8 bộ phận trước khi xác nhận nhận xe
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    textAlign: 'center',
                    color: '#34d399',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Check size={14} />
                  <span>
                    ĐÃ XÁC NHẬN TÌNH TRẠNG XE ({formatTime(handover.ownerConditionAcknowledgedAt)})
                  </span>
                </div>
              )}

              {/* Step B: Final Confirm Receipt button */}
              <button
                type="button"
                onClick={handleConfirmReceipt}
                disabled={!isConditionAcknowledged || isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: isConditionAcknowledged
                    ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                    : 'rgba(30, 41, 59, 0.5)',
                  border: isConditionAcknowledged ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  color: isConditionAcknowledged ? '#052e16' : '#64748b',
                  fontWeight: 900,
                  fontSize: '12.5px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: isConditionAcknowledged && !isSubmitting ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isConditionAcknowledged ? '0 4px 20px rgba(16, 185, 129, 0.45)' : 'none',
                  transition: 'all 0.2s ease',
                  opacity: isConditionAcknowledged ? (isSubmitting ? 0.7 : 1) : 0.6,
                }}
              >
                <CheckCircle2 size={16} />
                <span>{isSubmitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN NHẬN XE & TÌNH TRẠNG'}</span>
              </button>
            </>
          ) : isCompleted ? (
            /* COMPACT SUCCESS BADGE (Section 5 requirement: no oversized banners) */
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1.5px solid rgba(16, 185, 129, 0.6)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  color: '#34d399',
                  fontSize: '12.5px',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} />
                <span>BÀN GIAO HOÀN TẤT</span>
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '11px', fontWeight: 600 }}>
                Bạn đã hoàn tất xác nhận nhận xe và tình trạng kiểm tra.
              </div>

              {/* Show trip status separately if trip exists */}
              {activeTrip && (
                <div
                  style={{
                    marginTop: '6px',
                    padding: '4px 8px',
                    background: 'rgba(8, 12, 22, 0.6)',
                    borderRadius: '6px',
                    fontSize: '10.5px',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Car size={12} />
                  <span>Chuyến đi đang hoạt động ({activeTrip.status})</span>
                </div>
              )}
            </div>
          ) : handover.status === 'READY_FOR_HANDOVER' ? (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#34d399', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>
                XE ĐÃ SẴN SÀNG BÀN GIAO
              </div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                Nhân viên đã kiểm tra xe đạt chuẩn. Đang chờ nhân viên thực hiện thủ tục giao xe trực tiếp.
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>
                ĐANG CHUẨN BỊ BÀN GIAO XE
              </div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                Đang chờ nhân viên vận hành hoàn tất kiểm tra và bàn giao xe cho bạn.
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

