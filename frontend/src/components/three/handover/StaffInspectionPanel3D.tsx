import React, { useState, useEffect, useMemo } from 'react';
import { Billboard, Html } from '@react-three/drei';
import {
  VehicleHandoverData,
  HandoverCheckpoint,
  InspectionCondition,
  INSPECTION_CONDITION_CONFIG,
  HANDOVER_STATUS_CONFIG,
} from '../../../types/handover';
import { SpatialDataLink } from '../SpatialDataLink';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  Send,
  Check,
  Sparkles,
  Clock,
  Car,
  X,
  UserCheck,
  Play,
  FileText,
  User,
  CheckCheck,
} from 'lucide-react';

interface StaffInspectionPanel3DProps {
  handover: VehicleHandoverData;
  activeHandovers?: VehicleHandoverData[];
  onSelectBookingId?: (bookingId: string) => void;
  selectedCheckpoint: HandoverCheckpoint | null;
  onCloseCheckpoint: () => void;
  onStartInspection: () => Promise<void>;
  onSubmitInspection: (
    code: string,
    condition: InspectionCondition,
    note?: string
  ) => Promise<void>;
  onMarkReady: () => Promise<void>;
  onConfirmHandover: () => Promise<void>;
  isSubmitting: boolean;
  panelPosition?: [number, number, number];
}

export const StaffInspectionPanel3D: React.FC<StaffInspectionPanel3DProps> = ({
  handover,
  activeHandovers,
  onSelectBookingId,
  selectedCheckpoint,
  onCloseCheckpoint,
  onStartInspection,
  onSubmitInspection,
  onMarkReady,
  onConfirmHandover,
  isSubmitting,
  panelPosition = [2.7, 1.35, 0],
}) => {
  const formatBookingDate = (isoString?: string) => {
    if (!isoString) return '--/--/----';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatBookingTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '--:-- --/--/----';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    } catch {
      return isoString;
    }
  };

  // Checkpoint inspection snapshot
  const currentInspection = useMemo(() => {
    if (!selectedCheckpoint) return undefined;
    return handover.inspections.find(
      (i) => i.vehiclePartCode === selectedCheckpoint.code
    );
  }, [handover.inspections, selectedCheckpoint]);

  // Overall condition statistics
  const conditionStats = useMemo(() => {
    let good = 0;
    let warning = 0;
    let damaged = 0;
    handover.inspections.forEach((i) => {
      if (i.conditionStatus === 'GOOD') good++;
      else if (i.conditionStatus === 'WARNING') warning++;
      else if (i.conditionStatus === 'DAMAGED') damaged++;
    });
    return {
      good,
      warning,
      damaged,
      totalAttention: warning + damaged,
      totalInspected: handover.inspections.length,
    };
  }, [handover.inspections]);

  // Editable local state for active inspection
  const [selectedCondition, setSelectedCondition] = useState<InspectionCondition>('GOOD');
  const [note, setNote] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentInspection) {
      setSelectedCondition(currentInspection.conditionStatus);
      setNote(currentInspection.note || '');
    } else {
      setSelectedCondition('GOOD');
      setNote('');
    }
  }, [currentInspection, selectedCheckpoint]);

  const handleSaveInspection = async () => {
    if (!selectedCheckpoint || isSubmitting) return;
    try {
      await onSubmitInspection(
        selectedCheckpoint.code,
        selectedCondition,
        note.trim() ? note.trim() : undefined
      );
      setActionSuccessMsg(`Đã lưu kiểm tra: ${selectedCheckpoint.nameVi}`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      // Error handled by parent toast
    }
  };

  const isHandoverExpired = Boolean(
    handover.isExpired ||
    handover.expired ||
    handover.bookingStatus === 'EXPIRED' ||
    (handover.bookingEndTime && new Date(handover.bookingEndTime).getTime() < Date.now())
  );

  const statusConfig = HANDOVER_STATUS_CONFIG[handover.status];
  const allInspected = handover.totalInspectedCount >= handover.requiredCheckpointsCount;
  const isInspectionEditable = handover.status === 'INSPECTION_IN_PROGRESS' && !isHandoverExpired;

  return (
    <>
      {/* 1. Spatial Laser Link from selected checkpoint to panel */}
      {selectedCheckpoint && (
        <SpatialDataLink
          start={selectedCheckpoint.localPosition}
          end={[panelPosition[0] - 0.45, panelPosition[1], panelPosition[2]]}
          color="#00f2fe"
        />
      )}

      {/* 2. Right-Hand Holographic Panel */}
      <group position={panelPosition}>
        <Billboard follow={true}>
          <HolographicPanelFrame3D width={2.75} height={4.2} color="#00f2fe" />
          <Html center distanceFactor={8.8} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                pointerEvents: 'auto',
                width: '350px',
                background: 'rgba(8, 12, 22, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 242, 254, 0.5)',
                boxShadow:
                  '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 242, 254, 0.25)',
                borderRadius: '16px',
                padding: '22px',
                color: '#ffffff',
                fontFamily: 'var(--font-family)',
                position: 'relative',
              }}
            >
              {/* Header Badge */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: '#00f2fe',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  <ShieldCheck size={14} />
                  BÀN GIAO XE (STAFF)
                </div>

                {selectedCheckpoint && (
                  <button
                    type="button"
                    onClick={onCloseCheckpoint}
                    title="Đóng chi tiết điểm kiểm tra"
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
                )}
              </div>

              {/* Expired Read-Only Warning Banner */}
              {isHandoverExpired && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={16} color="#f87171" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ color: '#f87171', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase' }}>
                      LỊCH ĐẶT ĐÃ HẾT THỜI GIAN (EXPIRED) — CHẾ ĐỘ XEM CHỈ ĐỌC
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '9.5px', marginTop: '2px' }}>
                      Không thể bắt đầu kiểm tra, ready hoặc bàn giao xe cho lịch đặt này.
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Selection Switcher if multiple bookings exist */}
              {activeHandovers && activeHandovers.length > 1 && (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#00f2fe',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Clock size={12} />
                    CHỌN LỊCH ĐẶT BÀN GIAO ({activeHandovers.length})
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      maxHeight: '90px',
                      overflowY: 'auto',
                    }}
                  >
                    {activeHandovers.map((h) => {
                      const isCurrent = h.bookingId === handover.bookingId;
                      const isHExpired = Boolean(
                        h.isExpired ||
                        h.expired ||
                        h.bookingStatus === 'EXPIRED' ||
                        (h.bookingEndTime && new Date(h.bookingEndTime).getTime() < Date.now())
                      );
                      return (
                        <button
                          key={h.bookingId}
                          type="button"
                          onClick={() => onSelectBookingId?.(h.bookingId)}
                          style={{
                            background: isCurrent
                              ? isHExpired
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(0, 242, 254, 0.2)'
                              : 'rgba(30, 41, 59, 0.6)',
                            border: `1px solid ${
                              isCurrent
                                ? isHExpired
                                  ? '#f87171'
                                  : '#00f2fe'
                                : 'rgba(148, 163, 184, 0.2)'
                            }`,
                            borderRadius: '6px',
                            padding: '5px 8px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: '#ffffff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '10.5px',
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontWeight: isCurrent ? 800 : 600,
                                color: isCurrent ? (isHExpired ? '#f87171' : '#00f2fe') : '#ffffff',
                              }}
                            >
                              {h.coOwnerName}
                            </span>
                            <span style={{ color: '#94a3b8', marginLeft: '6px', fontSize: '9.5px' }}>
                              {formatBookingDate(h.bookingStartTime)} ({formatBookingTime(h.bookingStartTime)} - {formatBookingTime(h.bookingEndTime)})
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              color: isHExpired ? '#f87171' : HANDOVER_STATUS_CONFIG[h.status].color,
                            }}
                          >
                            {isHExpired ? 'EXPIRED' : HANDOVER_STATUS_CONFIG[h.status].labelVi}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status Badge & Progress Overview */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      fontWeight: 600,
                      marginBottom: '2px',
                    }}
                  >
                    Trạng thái hiện tại
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      color: isHandoverExpired ? '#f87171' : statusConfig.color,
                      background: isHandoverExpired ? 'rgba(239, 68, 68, 0.2)' : statusConfig.badgeBg,
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {isHandoverExpired ? 'HẾT THỜI GIAN (EXPIRED)' : statusConfig.labelVi}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      fontWeight: 600,
                      marginBottom: '2px',
                    }}
                  >
                    Tiến độ kiểm tra
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: allInspected ? '#34d399' : '#38bdf8',
                    }}
                  >
                    {handover.totalInspectedCount} / {handover.requiredCheckpointsCount} điểm
                  </div>
                </div>
              </div>

              {/* RECIPIENT CARD */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
                    paddingBottom: '6px',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#00f2fe',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <UserCheck size={14} />
                    THÔNG TIN NGƯỜI NHẬN XE
                  </div>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: isHandoverExpired ? '#f87171' : '#34d399',
                      background: isHandoverExpired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      border: isHandoverExpired ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {isHandoverExpired
                      ? 'Lịch đặt hết hạn (EXPIRED)'
                      : handover.bookingStatus
                      ? `Booking ${handover.bookingStatus}`
                      : 'Booking đã xác nhận'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>Người nhận:</span>
                    <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '12.5px' }}>
                      {handover.coOwnerName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>Tài khoản:</span>
                    <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                      {handover.coOwnerEmail || 'Chưa cập nhật'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>Lịch đặt:</span>
                    <span style={{ fontWeight: 600, color: '#ffffff' }}>
                      {formatBookingDate(handover.bookingStartTime)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>Khung giờ:</span>
                    <span style={{ fontWeight: 700, color: '#00f2fe' }}>
                      {formatBookingTime(handover.bookingStartTime)} - {formatBookingTime(handover.bookingEndTime)}
                    </span>
                  </div>

                  {handover.bookingPurpose && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8' }}>Mục đích:</span>
                      <span style={{ fontWeight: 500, color: '#cbd5e1', maxWidth: '180px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {handover.bookingPurpose}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>Xe:</span>
                    <span style={{ fontWeight: 700, color: '#fbbf24' }}>
                      {handover.vehicleCode || 'EV01'} ({handover.licensePlate})
                    </span>
                  </div>
                </div>
              </div>

              {/* Success Notification Alert */}
              {actionSuccessMsg && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    color: '#34d399',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Check size={14} />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}

              {/* INSPECTION SUMMARY (Always show when ready, handed over, or completed) */}
              {handover.status !== 'PENDING_PREPARATION' && (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#94a3b8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    TÓM TẮT TÌNH TRẠNG XE (8 BỘ PHẬN):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', padding: '4px' }}>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>Tốt</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>{conditionStats.good}</div>
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', padding: '4px' }}>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>Cảnh báo</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>{conditionStats.warning}</div>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '4px' }}>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>Hư hỏng</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171' }}>{conditionStats.damaged}</div>
                    </div>
                  </div>
                  {conditionStats.totalAttention > 0 && (
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: '#fbbf24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <AlertTriangle size={12} />
                      CÓ {conditionStats.totalAttention} ĐIỂM CẦN LƯU Ý
                    </div>
                  )}
                </div>
              )}

              {/* CHECKPOINT INSPECTION VIEW: EDITABLE (INSPECTION_IN_PROGRESS) VS READ-ONLY (OTHER STATES) */}
              {selectedCheckpoint && (
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#38bdf8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {selectedCheckpoint.categoryVi}
                    </span>
                    {!isInspectionEditable && currentInspection && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: INSPECTION_CONDITION_CONFIG[currentInspection.conditionStatus].color,
                          background: INSPECTION_CONDITION_CONFIG[currentInspection.conditionStatus].bg,
                          border: `1px solid ${INSPECTION_CONDITION_CONFIG[currentInspection.conditionStatus].border}`,
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {INSPECTION_CONDITION_CONFIG[currentInspection.conditionStatus].labelVi}
                      </span>
                    )}
                  </div>

                  <h4
                    style={{
                      margin: '0 0 10px 0',
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#ffffff',
                    }}
                  >
                    {selectedCheckpoint.nameVi}
                  </h4>

                  {isInspectionEditable ? (
                    /* EDITABLE INSPECTION FORM (Only in INSPECTION_IN_PROGRESS) */
                    <div>
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>
                          TÌNH TRẠNG BỘ PHẬN:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                          {(['GOOD', 'WARNING', 'DAMAGED'] as InspectionCondition[]).map((cond) => {
                            const cfg = INSPECTION_CONDITION_CONFIG[cond];
                            const isChosen = selectedCondition === cond;
                            return (
                              <button
                                key={cond}
                                type="button"
                                onClick={() => setSelectedCondition(cond)}
                                style={{
                                  background: isChosen ? cfg.bg : 'rgba(15, 23, 42, 0.6)',
                                  border: `1.5px solid ${isChosen ? cfg.border : 'rgba(148, 163, 184, 0.2)'}`,
                                  color: isChosen ? '#ffffff' : '#94a3b8',
                                  borderRadius: '8px',
                                  padding: '7px 4px',
                                  cursor: 'pointer',
                                  fontWeight: isChosen ? 800 : 600,
                                  fontSize: '10.5px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  transition: 'all 0.18s ease',
                                  boxShadow: isChosen ? `0 0 12px ${cfg.color}44` : 'none',
                                }}
                              >
                                {cond === 'GOOD' && <CheckCircle2 size={11} color={cfg.color} />}
                                {cond === 'WARNING' && <AlertTriangle size={11} color={cfg.color} />}
                                {cond === 'DAMAGED' && <XCircle size={11} color={cfg.color} />}
                                {cfg.labelVi}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                          GHI CHÚ KỸ THUẬT:
                        </div>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Nhập ghi chú kiểm tra (không bắt buộc)..."
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            background: 'rgba(10, 15, 29, 0.85)',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            borderRadius: '8px',
                            padding: '7px 10px',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                            fontSize: '11px',
                            outline: 'none',
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveInspection}
                        disabled={isSubmitting}
                        style={{
                          width: '100%',
                          padding: '9px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#080c16',
                          fontWeight: 800,
                          fontSize: '11px',
                          letterSpacing: '0.04em',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 15px rgba(0, 242, 254, 0.35)',
                          transition: 'all 0.2s ease',
                          opacity: isSubmitting ? 0.7 : 1,
                        }}
                      >
                        <Save size={13} />
                        {isSubmitting ? 'ĐANG LƯU...' : 'LƯU KIỂM TRA'}
                      </button>
                    </div>
                  ) : (
                    /* READ-ONLY INSPECTION DETAILS */
                    <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {currentInspection ? (
                        <>
                          <div style={{ color: '#cbd5e1', fontStyle: currentInspection.note ? 'normal' : 'italic' }}>
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Ghi chú: </span>
                            {currentInspection.note || 'Không có ghi chú thêm.'}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px', marginTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '4px' }}>
                            <span>Kiểm tra bởi: <strong style={{ color: '#ffffff' }}>{currentInspection.inspectedByName || 'Nhân viên'}</strong></span>
                            <span>{formatDateTime(currentInspection.inspectedAt)}</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
                          Chưa có dữ liệu kiểm tra cho bộ phận này.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CONTEXTUAL ACTION AREA — STRICTLY BY STATE (Section 7 & 9) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {isHandoverExpired ? (
                  /* EXPIRED STATE: NO START, NO READY, NO HANDOVER ALLOWED */
                  <div
                    style={{
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#f87171',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <AlertTriangle size={15} color="#f87171" />
                      LỊCH ĐẶT ĐÃ HẾT THỜI GIAN (EXPIRED)
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '10.5px', lineHeight: '1.4' }}>
                      Không thể bắt đầu kiểm tra, ready hoặc bàn giao xe. Lịch đặt đã hết hiệu lực.
                    </div>
                  </div>
                ) : (
                  <>
                    {/* STATE 1: PENDING_PREPARATION */}
                    {handover.status === 'PENDING_PREPARATION' && (
                      <div>
                        <button
                          type="button"
                          onClick={onStartInspection}
                          disabled={isSubmitting}
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#080c16',
                            fontWeight: 900,
                            fontSize: '12px',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 16px rgba(0, 242, 254, 0.4)',
                            transition: 'all 0.2s ease',
                            opacity: isSubmitting ? 0.7 : 1,
                          }}
                        >
                          <Play size={14} />
                          {isSubmitting ? 'ĐANG BẮT ĐẦU...' : 'BẮT ĐẦU KIỂM TRA XE'}
                        </button>
                        <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', marginTop: '6px' }}>
                          Nhấn để chuyển sang trạng thái kiểm tra và kích hoạt các điểm 3D.
                        </div>
                      </div>
                    )}

                    {/* STATE 2: INSPECTION_IN_PROGRESS */}
                    {handover.status === 'INSPECTION_IN_PROGRESS' && (
                      <div>
                        <button
                          type="button"
                          onClick={onMarkReady}
                          disabled={!allInspected || isSubmitting}
                          style={{
                            width: '100%',
                            padding: '11px',
                            background: allInspected
                              ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                              : 'rgba(30, 41, 59, 0.6)',
                            border: allInspected ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '10px',
                            color: allInspected ? '#052e16' : '#64748b',
                            fontWeight: 800,
                            fontSize: '11.5px',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            cursor: allInspected && !isSubmitting ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: allInspected ? '0 4px 16px rgba(16, 185, 129, 0.4)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Sparkles size={14} />
                          {isSubmitting ? 'ĐANG XÁC NHẬN...' : 'XÁC NHẬN XE SẴN SÀNG'}
                        </button>
                        {!allInspected && (
                          <div
                            style={{
                              fontSize: '10px',
                              color: '#f59e0b',
                              textAlign: 'center',
                              marginTop: '4px',
                            }}
                          >
                            * Cần kiểm tra đủ 8/8 điểm trước khi xác nhận sẵn sàng
                          </div>
                        )}
                      </div>
                    )}

                    {/* STATE 3: READY_FOR_HANDOVER (ONLY state where XÁC NHẬN GIAO XE exists!) */}
                    {handover.status === 'READY_FOR_HANDOVER' && (
                      <div>
                        <div
                          style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            textAlign: 'center',
                            marginBottom: '8px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#34d399',
                              fontWeight: 800,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              marginBottom: '3px',
                            }}
                          >
                            XE ĐÃ SẴN SÀNG BÀN GIAO
                          </div>
                          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                            Tất cả 8 bộ phận đã được kiểm định đầy đủ.
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={onConfirmHandover}
                          disabled={isSubmitting}
                          style={{
                            width: '100%',
                            padding: '12px 10px',
                            background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '11.5px',
                            letterSpacing: '0.03em',
                            textTransform: 'uppercase',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 16px rgba(168, 85, 247, 0.4)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Send size={14} />
                          {isSubmitting ? 'ĐANG XỬ LÝ...' : `XÁC NHẬN GIAO XE CHO ${handover.coOwnerName.toUpperCase()}`}
                        </button>
                      </div>
                    )}

                    {/* STATE 4: HANDED_OVER (NO handover button exists!) */}
                    {handover.status === 'HANDED_OVER' && (
                      <div
                        style={{
                          background: 'rgba(168, 85, 247, 0.15)',
                          border: '1px solid rgba(168, 85, 247, 0.5)',
                          borderRadius: '10px',
                          padding: '12px',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            color: '#c084fc',
                            fontSize: '12px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <CheckCheck size={14} />
                          ĐÃ BÀN GIAO XE
                        </div>
                        <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 700, marginBottom: '2px' }}>
                          Đã giao cho: {handover.coOwnerName}
                        </div>
                        {handover.staffHandedOverAt && (
                          <div style={{ color: '#94a3b8', fontSize: '10.5px', marginBottom: '6px' }}>
                            Thời gian: {formatDateTime(handover.staffHandedOverAt)}
                          </div>
                        )}
                        <div style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 600 }}>
                          CHỜ CHỦ XE XÁC NHẬN NHẬN XE
                        </div>
                      </div>
                    )}

                    {/* STATE 5: OWNER_CONFIRMED */}
                    {handover.status === 'OWNER_CONFIRMED' && (
                      <div
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.5)',
                          borderRadius: '10px',
                          padding: '12px',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            color: '#38bdf8',
                            fontSize: '12px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            marginBottom: '4px',
                          }}
                        >
                          CHỦ XE ĐÃ XÁC NHẬN NHẬN XE
                        </div>
                        <div style={{ color: '#ffffff', fontSize: '11.5px', fontWeight: 600 }}>
                          ĐANG HOÀN TẤT CHECK-IN...
                        </div>
                      </div>
                    )}

                    {/* STATE 6: COMPLETED */}
                    {handover.status === 'COMPLETED' && (
                      <div
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.5)',
                          borderRadius: '10px',
                          padding: '12px',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            color: '#34d399',
                            fontSize: '12.5px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <Sparkles size={14} />
                          BÀN GIAO & CHECK-IN HOÀN TẤT
                        </div>
                        <div style={{ color: '#ffffff', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>
                          Người nhận: {handover.coOwnerName}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {handover.staffHandedOverAt && (
                            <span>Bàn giao: {formatDateTime(handover.staffHandedOverAt)}</span>
                          )}
                          {handover.ownerReceivedAt && (
                            <span>Nhận xe: {formatDateTime(handover.ownerReceivedAt)}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Html>
        </Billboard>
      </group>
    </>
  );
};
