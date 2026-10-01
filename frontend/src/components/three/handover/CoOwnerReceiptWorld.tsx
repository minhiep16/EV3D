import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Html, Billboard } from '@react-three/drei';
import { VehicleResponse } from '../../../types/vehicle';
import {
  HANDOVER_CHECKPOINTS,
  VehicleHandoverData,
  VehicleHandoverEligibilityResponse,
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
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';
import { HandoverHotspot3D } from './HandoverHotspot3D';
import { HandoverProgressVisualizer3D } from './HandoverProgressVisualizer3D';
import { CoOwnerReceiptPanel3D } from './CoOwnerReceiptPanel3D';
import {
  Loader2,
  Clock,
  RotateCcw,
  Sparkles,
  Key,
} from 'lucide-react';

interface CoOwnerReceiptWorldProps {
  vehicle: VehicleResponse;
}

export const CoOwnerReceiptWorld: React.FC<CoOwnerReceiptWorldProps> = ({ vehicle }) => {
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
  const returnToVehicleOverview = useWorldStore(
    (state) => state.returnToVehicleOverview
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
  const { data: allBookings = [] } = useQuery<Booking[]>({
    queryKey: ['vehicleBookings', vehicle.id],
    queryFn: () => fetchVehicleBookings(vehicle.id),
    staleTime: 10000,
  });

  // Resolve target booking ID authoritatively
  const targetBookingId = useMemo(() => {
    if (eligibility?.bookingId) return eligibility.bookingId;
    const now = new Date();
    const myBookings = allBookings.filter(
      (b) => b && b.status !== 'CANCELLED' && (!user?.id || b.userId === user?.id)
    );
    if (myBookings.length > 0) {
      const activeOrUpcoming = myBookings.find((b) => b.endTime && new Date(b.endTime) >= now);
      return activeOrUpcoming ? activeOrUpcoming.id : myBookings[0].id;
    }
    const confirmed = allBookings.find((b) => b && (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS'));
    return confirmed ? confirmed.id : null;
  }, [eligibility?.bookingId, allBookings, user?.id]);

  // TanStack Query: Handover by booking (authoritative source of truth)
  const {
    data: bookingHandover,
    isLoading: isBookingHandoverLoading,
  } = useQuery<VehicleHandoverData | null>({
    queryKey: ['handoverByBooking', targetBookingId],
    queryFn: () => (targetBookingId ? fetchBookingHandover(targetBookingId) : null),
    enabled: !!targetBookingId,
    staleTime: 5000,
  });

  // TanStack Query: Fetch active vehicle handovers with stable query key
  // staleTime: 30000 prevents unnecessary aggressive refetching during review
  const {
    data: activeHandovers = [],
    isLoading: isHandoversLoading,
  } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeVehicleHandovers', vehicle.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    staleTime: 30000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.length === 0) return 8000;
      const my = data.find(
        (h) => h && (!user?.id || h.coOwnerId === user?.id || h.coOwnerEmail === user?.email)
      );
      if (!my) return 8000;
      // Do not poll when already handed over or completed
      if (my.status === 'HANDED_OVER' || my.status === 'OWNER_CONFIRMED' || my.status === 'COMPLETED') {
        return false;
      }
      return 8000;
    },
  });

  // Resolve current CO_OWNER handover strictly from server state + fallback cache to prevent rollback
  const handover = useMemo(() => {
    if (bookingHandover) return bookingHandover;
    const list = Array.isArray(activeHandovers) ? activeHandovers : [];
    if (list.length > 0) {
      const myHandover = list.find(
        (h) =>
          h && (!user?.id || h.coOwnerId === user.id || h.coOwnerEmail === user.email)
      );
      if (myHandover) return myHandover;
    }
    if (eligibility?.handover) return eligibility.handover;
    if (lastConfirmedHandover) return lastConfirmedHandover;
    return list[0] || null;
  }, [bookingHandover, activeHandovers, eligibility?.handover, lastConfirmedHandover, user?.id, user?.email]);

  // Selected checkpoint object
  const currentCheckpointObj = useMemo(() => {
    if (!selectedHandoverCheckpoint) return null;
    return getCheckpointByCode(selectedHandoverCheckpoint) || null;
  }, [selectedHandoverCheckpoint]);

  // Session Isolation: Clear selected checkpoint on unmount
  useEffect(() => {
    return () => {
      clearHandoverCheckpointSelection();
    };
  }, [clearHandoverCheckpointSelection]);

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
      // Store immediately in state to prevent UI rollback to preparation
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

  // Rule 9: If query temporarily loading and no cached handover, show loading state, not preparation state!
  const isAnyInitialLoading =
    !handover &&
    (isHandoversLoading || (!!targetBookingId && isBookingHandoverLoading) || isEligibilityLoading);

  if (isAnyInitialLoading) {
    return (
      <group position={[0, 1.4, 0]}>
        <Billboard follow={true}>
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
        </Billboard>
      </group>
    );
  }

  // Explicit status config for modal derived from current backend status (Rule 8)
  const getHandoverModalConfig = (status?: string | null) => {
    switch (status) {
      case 'READY_FOR_HANDOVER':
        return {
          badge: 'SẴN SÀNG BÀN GIAO',
          title: 'Xe đã sẵn sàng bàn giao',
          message: 'Nhân viên đã kiểm tra xe đạt chuẩn. Vui lòng chờ nhân viên thực hiện thủ tục giao xe trực tiếp.',
          iconColor: '#34d399',
          borderColor: 'rgba(52, 211, 153, 0.5)',
        };
      case 'HANDED_OVER':
        return {
          badge: 'ĐÃ BÀN GIAO',
          title: 'Xe đã được nhân viên bàn giao',
          message: 'Nhân viên đã bàn giao xe. Vui lòng kiểm tra tình trạng xe và xác nhận nhận xe.',
          iconColor: '#38bdf8',
          borderColor: 'rgba(56, 189, 248, 0.5)',
        };
      case 'OWNER_CONFIRMED':
        return {
          badge: 'ĐÃ XÁC NHẬN NHẬN XE',
          title: 'Bạn đã xác nhận nhận xe',
          message: 'Bạn đã xác nhận nhận xe thành công. Chúc bạn có một hành trình an toàn và thuận lợi!',
          iconColor: '#10b981',
          borderColor: 'rgba(16, 185, 129, 0.5)',
        };
      case 'COMPLETED':
        return {
          badge: 'BÀN GIAO HOÀN TẤT',
          title: 'Bàn giao hoàn tất',
          message: 'Quy trình bàn giao đã hoàn tất. Xe đã sẵn sàng bắt đầu hành trình.',
          iconColor: '#10b981',
          borderColor: 'rgba(16, 185, 129, 0.5)',
        };
      case 'PENDING_PREPARATION':
      default:
        return {
          badge: 'BÀN GIAO & NHẬN XE',
          title: 'Đang chuẩn bị bàn giao xe',
          message: 'Đang chờ nhân viên vận hành hoàn tất kiểm tra và bàn giao xe.',
          iconColor: '#38bdf8',
          borderColor: 'rgba(56, 189, 248, 0.5)',
        };
    }
  };

  // Backend state drives the view:
  // If no handover or status before HANDED_OVER -> Waiting state modal
  const isWaitingForStaff =
    !handover ||
    (handover.status !== 'HANDED_OVER' &&
      handover.status !== 'OWNER_CONFIRMED' &&
      handover.status !== 'COMPLETED');

  if (isWaitingForStaff) {
    const modalConfig = getHandoverModalConfig(handover?.status);

    return (
      <group position={[0, 1.4, 0]}>
        <Billboard follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(8, 14, 26, 0.96)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${modalConfig.borderColor}`,
                borderRadius: '16px',
                padding: '24px',
                width: '380px',
                color: '#ffffff',
                fontFamily: 'var(--font-family)',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
              }}
            >
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
                  color: modalConfig.iconColor,
                }}
              >
                <Clock size={24} />
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: modalConfig.iconColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {modalConfig.badge}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em', marginBottom: '6px' }}>
                  {modalConfig.title}
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.5 }}>
                  {modalConfig.message}
                </div>
              </div>

              {handover && (
                <div
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontSize: '11.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                    <span style={{ fontWeight: 800, color: '#fbbf24' }}>{vehicle.name || vehicle.licensePlate || 'EV01'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Người nhận:</span>
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{handover.coOwnerName || user?.fullName || 'Đồng sở hữu'}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={returnToVehicleOverview}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <RotateCcw size={14} />
                <span>QUAY LẠI XE</span>
              </button>
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  // Active or Completed Handover State
  return (
    <group>
      {/* 1. 3D Inspection Hotspots on EV01 (Read-Only for CO_OWNER) */}
      {HANDOVER_CHECKPOINTS.map((checkpoint) => {
        const inspection = (handover?.inspections || []).find(
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
            canInteract={true}
          />
        );
      })}

      {/* 2. 3D Radial Inspection Progress Visualizer */}
      <HandoverProgressVisualizer3D
        inspections={handover.inspections}
        position={[0, 1.85, 0.2]}
      />

      {/* 3. CO_OWNER Dedicated Receipt Review Panel */}
      <CoOwnerReceiptPanel3D
        key={handover.id}
        handover={handover}
        selectedCheckpoint={currentCheckpointObj}
        onCloseCheckpoint={clearHandoverCheckpointSelection}
        onAcknowledgeCondition={handleAcknowledgeCondition}
        onConfirmReceipt={handleConfirmReceipt}
        isSubmitting={isSubmitting}
      />
    </group>
  );
};
