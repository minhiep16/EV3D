import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Html, Billboard } from '@react-three/drei';
import { VehicleResponse } from '../../../types/vehicle';
import {
  HANDOVER_CHECKPOINTS,
  VehicleHandoverData,
  getCheckpointByCode,
} from '../../../types/handover';
import {
  fetchActiveVehicleHandovers,
  acknowledgeConditionApi,
  confirmOwnerReceiptApi,
  completeHandoverApi,
} from '../../../services/handoverApi';
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

  // TanStack Query: Fetch active vehicle handovers with stable query key
  // staleTime: 30000 prevents unnecessary aggressive refetching during review
  // Background refetches do NOT flicker or unmount UI
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

  // Resolve current CO_OWNER handover strictly from server state
  const handover = useMemo(() => {
    const list = Array.isArray(activeHandovers) ? activeHandovers : [];
    if (list.length === 0) return null;
    const myHandover = list.find(
      (h) =>
        h && (!user?.id || h.coOwnerId === user.id || h.coOwnerEmail === user.email)
    );
    return myHandover || list[0] || null;
  }, [activeHandovers, user?.id, user?.email]);

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
      await acknowledgeConditionApi(handover.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
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
      await confirmOwnerReceiptApi(handover.id);
      await completeHandoverApi(handover.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['tripEligibility'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể xác nhận nhận xe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initial Loading only when data has not yet loaded.
  // Never unmount the scene during background refetch!
  if (isHandoversLoading && activeHandovers.length === 0) {
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

  // Backend state drives the view:
  // Status before HANDED_OVER -> Waiting state
  const isWaitingForStaff =
    !handover ||
    (handover.status !== 'HANDED_OVER' &&
      handover.status !== 'OWNER_CONFIRMED' &&
      handover.status !== 'COMPLETED');

  if (isWaitingForStaff) {
    return (
      <group position={[0, 1.4, 0]}>
        <Billboard follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(8, 14, 26, 0.96)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(56, 189, 248, 0.5)',
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
                  color: '#38bdf8',
                }}
              >
                <Clock size={24} />
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  BÀN GIAO & NHẬN XE
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em', marginBottom: '6px' }}>
                  ĐANG CHUẨN BỊ BÀN GIAO XE
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.5 }}>
                  Đang chờ nhân viên vận hành hoàn tất kiểm tra và bàn giao xe.
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
                    <span style={{ fontWeight: 800, color: '#fbbf24' }}>EV01</span>
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
