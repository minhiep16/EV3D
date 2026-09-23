import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Html, Billboard } from '@react-three/drei';
import { VehicleResponse } from '../../../types/vehicle';
import {
  HANDOVER_CHECKPOINTS,
  InspectionCondition,
  VehicleHandoverData,
  HANDOVER_STATUS_CONFIG,
  getCheckpointByCode,
} from '../../../types/handover';
import {
  fetchActiveVehicleHandover,
  fetchActiveVehicleHandovers,
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
  ShieldAlert,
  Loader2,
  CalendarX,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from 'lucide-react';

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

  // TanStack Query: Poll active handovers for vehicle every 3 seconds for seamless cross-role sync
  const {
    data: activeHandovers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeVehicleHandovers', vehicle.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    refetchInterval: 3000,
  });

  // Resolve current handover:
  // If user selected a specific bookingId, find it; otherwise resolve the most actionable candidate (HANDED_OVER > READY_FOR_HANDOVER > INSPECTION_IN_PROGRESS)
  const handover = React.useMemo(() => {
    if (!activeHandovers || activeHandovers.length === 0) return null;
    if (selectedBookingId) {
      const match = activeHandovers.find((h) => h.bookingId === selectedBookingId);
      if (match) return match;
    }
    const handedOver = activeHandovers.find((h) => h.status === 'HANDED_OVER');
    if (handedOver) return handedOver;
    const ready = activeHandovers.find((h) => h.status === 'READY_FOR_HANDOVER');
    if (ready) return ready;
    const inProgress = activeHandovers.find((h) => h.status === 'INSPECTION_IN_PROGRESS');
    if (inProgress) return inProgress;
    return activeHandovers[0];
  }, [activeHandovers, selectedBookingId]);

  // Selected checkpoint object
  const currentCheckpointObj = React.useMemo(() => {
    if (!selectedHandoverCheckpoint) return null;
    return getCheckpointByCode(selectedHandoverCheckpoint) || null;
  }, [selectedHandoverCheckpoint]);

  // STAFF Action: Start Inspection
  const handleStartInspection = async () => {
    if (!handover) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await startHandoverApi(handover.bookingId);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] });
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
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await submitInspectionApi(handover.id, {
        vehiclePartCode: code,
        conditionStatus: condition,
        note,
      });
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] });
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
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await markHandoverReadyApi(handover.id);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] });
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể xác nhận xe sẵn sàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STAFF Action: Confirm Handover
  const handleConfirmHandover = async () => {
    if (!handover) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await confirmHandoverApi(handover.id);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] });
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể xác nhận giao xe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Session Isolation: Clear selected checkpoint whenever user role or handover changes
  React.useEffect(() => {
    clearHandoverCheckpointSelection();
  }, [user?.role, handover?.id, clearHandoverCheckpointSelection]);

  // CO_OWNER Action: Acknowledge Condition
  const handleAcknowledgeCondition = async () => {
    if (!handover) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await acknowledgeConditionApi(handover.id);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] });
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
      // Immediately complete handover to finalize check-in
      await completeHandoverApi(handover.id);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] });
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể xác nhận nhận xe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading State (Section 28: ĐANG TẢI DỮ LIỆU BÀN GIAO...)
  if (isLoading) {
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

  // 2. No eligible booking / No active handover (Section 28: KHÔNG CÓ LỊCH ĐẶT HỢP LỆ ĐỂ BÀN GIAO XE)
  if (!handover) {
    return (
      <group position={[0, 1.4, 0]}>
        <Billboard follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                borderRadius: '16px',
                padding: '16px 24px',
                color: '#ffffff',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(245, 158, 11, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <CalendarX size={26} color="#fbbf24" />
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#fbbf24',
                  letterSpacing: '0.04em',
                }}
              >
                KHÔNG CÓ LỊCH ĐẶT HỢP LỆ ĐỂ BÀN GIAO XE
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Xe hiện không có lịch đặt xe nào ở trạng thái đã xác nhận cần bàn giao.
              </div>
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  // Determine user role and capabilities
  const userRole = user?.role || 'CO_OWNER';
  const isStaff = userRole === 'STAFF';
  const isCoOwner = userRole === 'CO_OWNER';
  const isAdmin = userRole === 'ADMIN';

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
