import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Html, Billboard } from '@react-three/drei';
import { VehicleResponse } from '../../../types/vehicle';
import {
  HANDOVER_CHECKPOINTS,
  InspectionCondition,
  VehicleHandoverData,
  VehicleHandoverEligibilityResponse,
  HandoverEligibilityReason,
  HANDOVER_STATUS_CONFIG,
  HANDOVER_ELIGIBILITY_CONFIG,
  getCheckpointByCode,
} from '../../../types/handover';
import {
  fetchActiveVehicleHandovers,
  fetchHandoverEligibility,
  startHandoverApi,
  submitInspectionApi,
  markHandoverReadyApi,
  confirmHandoverApi,
  confirmOwnerReceiptApi,
  completeHandoverApi,
  acknowledgeConditionApi,
} from '../../../services/handoverApi';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';
import { HandoverHotspot3D } from './HandoverHotspot3D';
import { HandoverProgressVisualizer3D } from './HandoverProgressVisualizer3D';
import { StaffInspectionPanel3D } from './StaffInspectionPanel3D';
import { CoOwnerReceiptPanel3D } from './CoOwnerReceiptPanel3D';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';
import {
  Loader2,
  CalendarX,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  Car,
  Lock,
  User,
  Calendar,
  Sparkles,
  Send,
} from 'lucide-react';

function formatBookingDate(isoString?: string): string {
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
    return '--/--/----';
  }
}

function formatBookingTime(isoString?: string): string {
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
    return '--:--';
  }
}

function formatCountdown(totalSecs: number | null): string {
  if (totalSecs == null) return '--:--:--';
  if (totalSecs <= 0) return 'Đang vào cửa sổ chuẩn bị xe...';
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `Còn ${days} ngày ${remHours} giờ`;
  }
  if (hours > 0) {
    return `Còn ${hours} giờ ${minutes} phút ${seconds} giây`;
  }
  return `Còn ${minutes} phút ${seconds} giây`;
}

interface VehicleHandoverWorldProps {
  vehicle: VehicleResponse;
}

export const VehicleHandoverWorld: React.FC<VehicleHandoverWorldProps> = ({ vehicle }) => {
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
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // TanStack Query: Backend Handover Eligibility (SINGLE SOURCE OF TRUTH)
  const {
    data: eligibility,
    isLoading: isEligibilityLoading,
    refetch: refetchEligibility,
  } = useQuery<VehicleHandoverEligibilityResponse>({
    queryKey: ['handoverEligibility', vehicle.id],
    queryFn: () => fetchHandoverEligibility(vehicle.id),
    refetchInterval: 3000,
  });

  // TanStack Query: Poll active handovers for vehicle every 3 seconds for seamless cross-role sync
  const {
    data: activeHandovers = [],
    isLoading: isHandoversLoading,
    refetch,
  } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeVehicleHandovers', vehicle.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    refetchInterval: 3000,
  });

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

  // Resolve current handover:
  // If user selected a specific bookingId, find it; otherwise resolve the most actionable non-expired candidate
  const handover = useMemo(() => {
    if (selectedBookingId && activeHandovers.length > 0) {
      const match = activeHandovers.find((h) => h.bookingId === selectedBookingId);
      if (match) return match;
    }
    if (activeHandovers && activeHandovers.length > 0) {
      const nonExpired = activeHandovers.filter((h) => !isHandoverExpired(h));
      const targetPool = nonExpired.length > 0 ? nonExpired : activeHandovers;

      const handedOver = targetPool.find((h) => h.status === 'HANDED_OVER');
      if (handedOver) return handedOver;
      const ready = targetPool.find((h) => h.status === 'READY_FOR_HANDOVER');
      if (ready) return ready;
      const inProgress = targetPool.find((h) => h.status === 'INSPECTION_IN_PROGRESS');
      if (inProgress) return inProgress;
      const pending = targetPool.find((h) => h.status === 'PENDING_PREPARATION');
      if (pending) return pending;
      return targetPool[0];
    }
    return eligibility?.handover || null;
  }, [activeHandovers, selectedBookingId, eligibility?.handover]);

  // Selected checkpoint object
  const currentCheckpointObj = useMemo(() => {
    if (!selectedHandoverCheckpoint) return null;
    return getCheckpointByCode(selectedHandoverCheckpoint) || null;
  }, [selectedHandoverCheckpoint]);

  // Role resolution
  const userRole = user?.role || 'CO_OWNER';
  const isStaff = userRole === 'STAFF';
  const isCoOwner = userRole === 'CO_OWNER';
  const isAdmin = userRole === 'ADMIN';

  // Authoritative Backend Eligibility Reason (source of truth)
  const reason: HandoverEligibilityReason =
    eligibility?.reason ||
    (handover?.eligibilityReason ?? (activeHandovers.length === 0 ? 'NO_BOOKING' : 'READY_FOR_PREPARATION'));

  // Local Countdown ticker for TOO_EARLY state
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (eligibility?.secondsUntilPreparation != null) {
      setCountdownSeconds(eligibility.secondsUntilPreparation);
    }
  }, [eligibility?.secondsUntilPreparation]);

  useEffect(() => {
    if (countdownSeconds == null || countdownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => (prev != null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdownSeconds]);

  // STAFF Action: Start Inspection
  const handleStartInspection = async (targetBookingId?: string) => {
    const bId = targetBookingId || handover?.bookingId || eligibility?.bookingId;
    if (!bId) {
      setErrorMessage('Không xác định được mã đặt xe để bắt đầu kiểm tra.');
      return;
    }
    if (reason === 'BOOKING_EXPIRED' || isHandoverExpired(handover)) {
      setErrorMessage('Lịch đặt xe đã hết thời gian (EXPIRED), không thể bắt đầu kiểm tra.');
      return;
    }
    if (reason === 'TOO_EARLY') {
      setErrorMessage('Chưa đến thời gian chuẩn bị xe (mở trước 2 tiếng).');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await startHandoverApi(bId);
      await Promise.all([
        refetch(),
        refetchEligibility(),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể bắt đầu kiểm tra xe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STAFF Action: Submit Inspection
  const handleSubmitInspection = async (
    code: string,
    condition: InspectionCondition,
    note?: string
  ) => {
    if (!handover) return;
    if (isHandoverExpired(handover) || reason === 'BOOKING_EXPIRED') {
      setErrorMessage('Lịch đặt xe đã hết thời gian (EXPIRED), không thể lưu kiểm tra xe.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await submitInspectionApi(handover.id, {
        vehiclePartCode: code,
        conditionStatus: condition,
        note,
      });
      await Promise.all([
        refetch(),
        refetchEligibility(),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể lưu kết quả kiểm tra.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // STAFF Action: Mark Ready
  const handleMarkReady = async () => {
    if (!handover) return;
    if (isHandoverExpired(handover) || reason === 'BOOKING_EXPIRED') {
      setErrorMessage('Lịch đặt xe đã hết thời gian (EXPIRED), không thể xác nhận xe sẵn sàng.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await markHandoverReadyApi(handover.id);
      await Promise.all([
        refetch(),
        refetchEligibility(),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể xác nhận xe sẵn sàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STAFF Action: Confirm Handover
  const handleConfirmHandover = async () => {
    if (!handover) return;
    if (isHandoverExpired(handover) || reason === 'BOOKING_EXPIRED') {
      setErrorMessage('Lịch đặt xe đã hết thời gian (EXPIRED), không thể bàn giao xe.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await confirmHandoverApi(handover.id);
      await Promise.all([
        refetch(),
        refetchEligibility(),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể xác nhận giao xe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Session Isolation: Clear selected checkpoint whenever user role or handover changes
  useEffect(() => {
    clearHandoverCheckpointSelection();
  }, [user?.role, handover?.id, clearHandoverCheckpointSelection]);

  // CO_OWNER Action: Acknowledge Condition
  const handleAcknowledgeCondition = async () => {
    if (!handover) return;
    if (isHandoverExpired(handover) || reason === 'BOOKING_EXPIRED') {
      setErrorMessage('Lịch đặt xe đã hết thời gian (EXPIRED), không thể xác nhận tình trạng xe.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await acknowledgeConditionApi(handover.id);
      await Promise.all([
        refetch(),
        refetchEligibility(),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
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
    if (isHandoverExpired(handover) || reason === 'BOOKING_EXPIRED') {
      setErrorMessage('Lịch đặt xe đã hết thời gian (EXPIRED), không thể xác nhận nhận xe.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await confirmOwnerReceiptApi(handover.id);
      await completeHandoverApi(handover.id);
      await Promise.all([
        refetch(),
        refetchEligibility(),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể xác nhận nhận xe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading State - Initial load only, keep existing data visible during background refetches
  if ((isHandoversLoading || isEligibilityLoading) && activeHandovers.length === 0 && !eligibility) {
    return (
      <group position={[0, 1.4, 0]}>
        <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div
            style={{
              background: 'rgba(8, 12, 22, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              borderRadius: '9999px',
              padding: '10px 22px',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 0 25px rgba(56, 189, 248, 0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            <Loader2 size={16} className="animate-spin" color="#00f2fe" />
            <span>ĐANG TẢI DỮ LIỆU BÀN GIAO...</span>
          </div>
        </Html>
      </group>
    );
  }

  // Recipient and booking values from authoritative eligibility response or handover
  const recipientName = eligibility?.recipientName || handover?.coOwnerName;
  const recipientEmail = eligibility?.recipientEmail || handover?.coOwnerEmail;
  const bookingStartTime = eligibility?.bookingStartTime || handover?.bookingStartTime;
  const bookingEndTime = eligibility?.bookingEndTime || handover?.bookingEndTime;
  const bookingPurpose = eligibility?.bookingPurpose || handover?.bookingPurpose;

  // Determine if we should render a dedicated 3D State Card
  // - NO_BOOKING, BOOKING_EXPIRED, TOO_EARLY, VEHICLE_IN_USE always render dedicated 3D card
  // - HANDED_OVER renders dedicated 3D card for STAFF (co-owner enters receipt mode)
  // - READY_FOR_PREPARATION renders dedicated card when inspection has not yet started (PENDING_PREPARATION)
  const isInspectionStarted =
    handover &&
    (handover.status === 'INSPECTION_IN_PROGRESS' ||
      handover.status === 'READY_FOR_HANDOVER' ||
      handover.status === 'HANDED_OVER' ||
      handover.status === 'OWNER_CONFIRMED' ||
      handover.status === 'COMPLETED');

  const shouldRenderStateCard =
    reason === 'NO_BOOKING' ||
    reason === 'BOOKING_EXPIRED' ||
    reason === 'TOO_EARLY' ||
    reason === 'VEHICLE_IN_USE' ||
    (reason === 'HANDED_OVER' && isStaff) ||
    (reason === 'READY_FOR_PREPARATION' && !isInspectionStarted) ||
    !handover;

  if (shouldRenderStateCard) {
    const config = HANDOVER_ELIGIBILITY_CONFIG[reason];

    return (
      <group position={[0, 1.4, 0]}>
        <Billboard follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(8, 14, 26, 0.96)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${config.border}`,
                borderRadius: '18px',
                padding: '22px 26px',
                color: '#ffffff',
                boxShadow: `0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px ${config.badgeBg}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                width: '380px',
                fontFamily: 'var(--font-family)',
                textAlign: 'center',
              }}
            >
              {/* STATE 1: NO_BOOKING -> KHÔNG CÓ LỊCH BÀN GIAO */}
              {reason === 'NO_BOOKING' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(148, 163, 184, 0.12)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CalendarX size={24} color="#94a3b8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#e2e8f0', letterSpacing: '0.04em' }}>
                      KHÔNG CÓ LỊCH BÀN GIAO
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
                      Xe hiện không có lịch đặt xe nào của nhóm đồng sở hữu cần bàn giao.
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 2: BOOKING_EXPIRED -> LỊCH ĐẶT ĐÃ HẾT HIỆU LỰC */}
              {reason === 'BOOKING_EXPIRED' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AlertTriangle size={24} color="#f87171" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#f87171', letterSpacing: '0.04em' }}>
                      LỊCH ĐẶT ĐÃ HẾT HIỆU LỰC
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '4px' }}>
                      Lịch đặt xe đã hết thời gian sử dụng (EXPIRED). Không thể bắt đầu kiểm tra hoặc bàn giao xe.
                    </div>
                  </div>

                  {(recipientName || bookingStartTime) && (
                    <div
                      style={{
                        width: '100%',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        textAlign: 'left',
                      }}
                    >
                      {recipientName && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Người đặt:</span>
                          <span style={{ color: '#ffffff', fontWeight: 700 }}>{recipientName}</span>
                        </div>
                      )}
                      {bookingStartTime && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Thời gian:</span>
                          <span style={{ color: '#f87171', fontWeight: 600 }}>
                            {formatBookingDate(bookingStartTime)} ({formatBookingTime(bookingStartTime)} - {formatBookingTime(bookingEndTime)})
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STATE 3: TOO_EARLY -> CHƯA ĐẾN THỜI GIAN CHUẨN BỊ XE */}
              {reason === 'TOO_EARLY' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Clock size={24} color="#38bdf8" />
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
                      CHƯA ĐẾN THỜI GIAN CHUẨN BỊ XE
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      Quy trình kiểm tra xe sẽ tự động mở trước giờ nhận xe 2 tiếng.
                    </div>
                  </div>

                  {/* Read-only: BÀN GIAO TIẾP THEO */}
                  <div
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      textAlign: 'left',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        color: '#38bdf8',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
                        paddingBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Calendar size={12} />
                      BÀN GIAO TIẾP THEO
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Người nhận xe:</span>
                        <span style={{ fontWeight: 700, color: '#ffffff' }}>
                          {recipientName || 'Đồng sở hữu'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Ngày nhận xe:</span>
                        <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {formatBookingDate(bookingStartTime)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Khung giờ:</span>
                        <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                          {formatBookingTime(bookingStartTime)} - {formatBookingTime(bookingEndTime)}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: '4px',
                          paddingTop: '6px',
                          borderTop: '1px solid rgba(56, 189, 248, 0.15)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ color: '#94a3b8' }}>Đếm ngược chuẩn bị:</span>
                        <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '11px' }}>
                          {formatCountdown(countdownSeconds)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Trạng thái:</span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                          }}
                        >
                          Sắp diễn ra (Chưa đến giờ)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inspection CTA is NOT enabled */}
                  <div
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(30, 41, 59, 0.65)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      borderRadius: '10px',
                      color: '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'not-allowed',
                    }}
                  >
                    <Lock size={13} color="#94a3b8" />
                    <span>CHƯA MỞ KIỂM TRA XE (READ-ONLY)</span>
                  </div>
                </div>
              )}

              {/* STATE 4: READY_FOR_PREPARATION -> show recipient + booking + BẮT ĐẦU KIỂM TRA XE */}
              {reason === 'READY_FOR_PREPARATION' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.18)',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={24} color="#34d399" />
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399', letterSpacing: '0.04em' }}>
                      SẴN SÀNG CHUẨN BỊ BÀN GIAO XE
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      Đã vào cửa sổ chuẩn bị. Nhân viên bắt đầu kiểm định xe để bàn giao.
                    </div>
                  </div>

                  {/* Recipient + Booking Card */}
                  <div
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        color: '#34d399',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                        paddingBottom: '4px',
                      }}
                    >
                      THÔNG TIN NHẬN XE
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Người nhận xe:</span>
                        <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '12.5px' }}>
                          {recipientName || handover?.coOwnerName || 'Đồng sở hữu'}
                        </span>
                      </div>

                      {(recipientEmail || handover?.coOwnerEmail) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#94a3b8' }}>Tài khoản:</span>
                          <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                            {recipientEmail || handover?.coOwnerEmail}
                          </span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Ngày nhận:</span>
                        <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {formatBookingDate(bookingStartTime || handover?.bookingStartTime)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Khung giờ:</span>
                        <span style={{ fontWeight: 700, color: '#00f2fe' }}>
                          {formatBookingTime(bookingStartTime || handover?.bookingStartTime)} - {formatBookingTime(bookingEndTime || handover?.bookingEndTime)}
                        </span>
                      </div>

                      {(bookingPurpose || handover?.bookingPurpose) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#94a3b8' }}>Mục đích:</span>
                          <span
                            style={{
                              color: '#cbd5e1',
                              fontWeight: 500,
                              maxWidth: '180px',
                              textAlign: 'right',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {bookingPurpose || handover?.bookingPurpose}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active CTA: BẮT ĐẦU KIỂM TRA XE */}
                  {isStaff ? (
                    <button
                      type="button"
                      onClick={() => handleStartInspection(eligibility?.bookingId || handover?.bookingId)}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#070b14',
                        fontWeight: 800,
                        fontSize: '12px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 18px rgba(0, 242, 254, 0.45)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Play size={15} color="#070b14" />
                      <span>{isSubmitting ? 'ĐANG KHỞI TẠO...' : 'BẮT ĐẦU KIỂM TRA XE'}</span>
                    </button>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        color: '#34d399',
                        fontSize: '11px',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      Đang chờ nhân viên vận hành bắt đầu kiểm tra xe.
                    </div>
                  )}
                </div>
              )}

              {/* STATE 5: HANDED_OVER -> XE ĐÃ ĐƯỢC BÀN GIAO */}
              {reason === 'HANDED_OVER' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(168, 85, 247, 0.18)',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={24} color="#c084fc" />
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#c084fc', letterSpacing: '0.04em' }}>
                      XE ĐÃ ĐƯỢC BÀN GIAO
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '4px' }}>
                      Nhân viên đã bàn giao xe. Đang chờ đồng sở hữu xác nhận nhận xe trên ứng dụng.
                    </div>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      background: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '11.5px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Người nhận:</span>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>
                        {recipientName || handover?.coOwnerName || 'Đồng sở hữu'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Trạng thái:</span>
                      <span style={{ fontWeight: 800, color: '#fbbf24' }}>
                        Chờ đồng sở hữu xác nhận nhận xe
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 6: VEHICLE_IN_USE -> XE ĐANG ĐƯỢC SỬ DỤNG */}
              {reason === 'VEHICLE_IN_USE' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(0, 242, 254, 0.15)',
                      border: '1px solid rgba(0, 242, 254, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Car size={24} color="#00f2fe" />
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.04em' }}>
                      XE ĐANG ĐƯỢC SỬ DỤNG
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
                      Xe hiện đang trong chuyến đi hoạt động hoặc đang được đồng sở hữu sử dụng. Không thể thực hiện quy trình bàn giao lúc này.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  if (!handover) {
    return null;
  }

  return (
    <group>
      {/* 3D Global Error Notification */}
      {errorMessage && (
        <group position={[0, 2.2, 0]}>
          <Billboard follow={true}>
            <Html center distanceFactor={8.5} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.95)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(254, 202, 202, 0.5)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)',
                  cursor: 'pointer',
                }}
                onClick={() => setErrorMessage(null)}
              >
                <AlertTriangle size={16} />
                <span>{errorMessage}</span>
                <span style={{ fontSize: '10px', opacity: 0.8, marginLeft: '8px' }}>✕</span>
              </div>
            </Html>
          </Billboard>
        </group>
      )}

      {/* 1. 3D Handover Inspection Checkpoint Hotspots (Section 13 & 14) */}
      {HANDOVER_CHECKPOINTS.map((checkpoint) => {
        const inspection = handover.inspections.find(
          (i) => i.vehiclePartCode === checkpoint.code
        );
        const isSelected = selectedHandoverCheckpoint === checkpoint.code;

        return (
          <HandoverHotspot3D
            key={checkpoint.code}
            checkpoint={checkpoint}
            inspection={inspection}
            isSelected={isSelected}
            onSelect={(code) => {
              if (selectedHandoverCheckpoint === code) {
                clearHandoverCheckpointSelection();
              } else {
                selectHandoverCheckpoint(code);
              }
            }}
            canInteract={
              isStaff ||
              handover.status === 'HANDED_OVER' ||
              handover.status === 'OWNER_CONFIRMED' ||
              handover.status === 'COMPLETED'
            }
          />
        );
      })}

      {/* 2. 3D Segmented Radial Progress Visualizer (Section 16) */}
      <HandoverProgressVisualizer3D
        inspections={handover.inspections}
        position={[0, 1.85, 0.2]}
      />

      {/* 3. Role-Based Right Holographic Panel (Section 11, 15, 19) */}
      {isStaff && (
        <StaffInspectionPanel3D
          handover={handover}
          activeHandovers={activeHandovers}
          onSelectBookingId={(id) => setSelectedBookingId(id)}
          selectedCheckpoint={currentCheckpointObj}
          onCloseCheckpoint={clearHandoverCheckpointSelection}
          onStartInspection={handleStartInspection}
          onSubmitInspection={handleSubmitInspection}
          onMarkReady={handleMarkReady}
          onConfirmHandover={handleConfirmHandover}
          isSubmitting={isSubmitting}
        />
      )}

      {isCoOwner && (
        <CoOwnerReceiptPanel3D
          handover={handover}
          selectedCheckpoint={currentCheckpointObj}
          onCloseCheckpoint={clearHandoverCheckpointSelection}
          onAcknowledgeCondition={handleAcknowledgeCondition}
          onConfirmReceipt={handleConfirmReceipt}
          isSubmitting={isSubmitting}
        />
      )}

      {isAdmin && (
        /* ADMIN Read-only Monitoring Panel (Section 11, 24) */
        <group position={[2.7, 1.35, 0]}>
          <Billboard follow={true}>
            <HolographicPanelFrame3D width={2.65} height={3.6} color="#a855f7" />
            <Html center distanceFactor={8.8} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  pointerEvents: 'auto',
                  width: '350px',
                  background: 'rgba(8, 12, 22, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(168, 85, 247, 0.5)',
                  boxShadow:
                    '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.25)',
                  borderRadius: '16px',
                  padding: '22px',
                  color: '#ffffff',
                  fontFamily: 'var(--font-family)',
                }}
              >
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
                    marginBottom: '10px',
                  }}
                >
                  <Eye size={14} />
                  THEO DÕI BÀN GIAO & CHECK-IN (ADMIN)
                </div>

                {/* Handover Status & Checkpoint Progress */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                      Trạng thái hiện tại
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: HANDOVER_STATUS_CONFIG[handover.status].color,
                        background: HANDOVER_STATUS_CONFIG[handover.status].badgeBg,
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {HANDOVER_STATUS_CONFIG[handover.status].labelVi}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                      Tiến độ kiểm tra
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#c084fc' }}>
                      {handover.totalInspectedCount} / {handover.requiredCheckpointsCount} điểm
                    </div>
                  </div>
                </div>

                {/* Handover Stakeholders */}
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '12px',
                    fontSize: '11.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Người nhận xe:</span>
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>
                      {handover.coOwnerName}
                    </span>
                  </div>
                  {handover.coOwnerEmail && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Tài khoản:</span>
                      <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                        {handover.coOwnerEmail}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Nhân viên bàn giao:</span>
                    <span style={{ fontWeight: 600, color: '#c084fc' }}>
                      {handover.staffName || 'Chưa phân công'}
                    </span>
                  </div>
                </div>

                {/* Inspection Checkpoints Summary List */}
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      fontWeight: 700,
                      marginBottom: '6px',
                    }}
                  >
                    DANH SÁCH 8 ĐIỂM KIỂM TRA:
                  </div>
                  <div
                    style={{
                      maxHeight: '140px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {HANDOVER_CHECKPOINTS.map((cp) => {
                      const item = handover.inspections.find(
                        (i) => i.vehiclePartCode === cp.code
                      );
                      const cond = item?.conditionStatus;
                      return (
                        <div
                          key={cp.code}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '11px',
                            background: 'rgba(15, 23, 42, 0.5)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          <span style={{ color: '#ffffff' }}>{cp.nameVi}</span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: cond === 'GOOD'
                                ? '#34d399'
                                : cond === 'WARNING'
                                ? '#fbbf24'
                                : cond === 'DAMAGED'
                                ? '#f87171'
                                : '#64748b',
                            }}
                          >
                            {cond === 'GOOD'
                              ? 'Tốt'
                              : cond === 'WARNING'
                              ? 'Cảnh báo'
                              : cond === 'DAMAGED'
                              ? 'Hư hỏng'
                              : 'Chưa kiểm tra'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center',
                    fontSize: '10.5px',
                    color: '#c084fc',
                  }}
                >
                  Chế độ giám sát hệ thống (Read-Only) — Không có thao tác bàn giao trực tiếp.
                </div>
              </div>
            </Html>
          </Billboard>
        </group>
      )}
    </group>
  );
};
