import React from 'react';
import { Billboard, Html } from '@react-three/drei';
import {
  VehicleHandoverData,
  HandoverCheckpoint,
  HANDOVER_STATUS_CONFIG,
  INSPECTION_CONDITION_CONFIG,
  getCheckpointByCode,
} from '../../../types/handover';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';
import { SpatialDataLink } from '../SpatialDataLink';
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
  UserCheck,
} from 'lucide-react';

interface CoOwnerReceiptPanel3DProps {
  handover: VehicleHandoverData;
  selectedCheckpoint: HandoverCheckpoint | null;
  onCloseCheckpoint?: () => void;
  onAcknowledgeCondition: () => Promise<void>;
  onConfirmReceipt: () => Promise<void>;
  isSubmitting: boolean;
  panelPosition?: [number, number, number];
}

export const CoOwnerReceiptPanel3D: React.FC<CoOwnerReceiptPanel3DProps> = ({
  handover,
  selectedCheckpoint,
  onCloseCheckpoint,
  onAcknowledgeCondition,
  onConfirmReceipt,
  isSubmitting,
  panelPosition = [2.7, 1.35, 0],
}) => {
  const statusConfig = HANDOVER_STATUS_CONFIG[handover.status];
  const isHandedOver = handover.status === 'HANDED_OVER';
  const isCompleted =
    handover.status === 'OWNER_CONFIRMED' || handover.status === 'COMPLETED';

  // Read-only inspection details for currently selected checkpoint
  const currentInspection = React.useMemo(() => {
    if (!selectedCheckpoint) return undefined;
    return handover.inspections.find(
      (i) => i.vehiclePartCode === selectedCheckpoint.code
    );
  }, [handover.inspections, selectedCheckpoint]);

  // Overall condition statistics
  const conditionStats = React.useMemo(() => {
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

  // Checkpoints that have warnings or damages
  const attentionItems = React.useMemo(() => {
    return handover.inspections.filter(
      (i) => i.conditionStatus === 'WARNING' || i.conditionStatus === 'DAMAGED'
    );
  }, [handover.inspections]);

  // Format booking date and time
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

  const isConditionAcknowledged =
    Boolean(handover.conditionAcknowledged) ||
    Boolean(handover.ownerConditionAcknowledgedAt);

  return (
    <>
      {/* 1. Spatial Laser Link if a checkpoint is selected */}
      {selectedCheckpoint && (
        <SpatialDataLink
          start={selectedCheckpoint.localPosition}
          end={[panelPosition[0] - 0.45, panelPosition[1], panelPosition[2]]}
          color="#38bdf8"
        />
      )}

      {/* 2. Holographic Panel on the right */}
      <group position={panelPosition}>
        <Billboard follow={true}>
          <HolographicPanelFrame3D width={2.75} height={4.2} color="#38bdf8" />
          <Html center distanceFactor={8.8} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                pointerEvents: 'auto',
                width: '350px',
                background: 'rgba(8, 12, 22, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                boxShadow:
                  '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.25)',
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
                    color: '#38bdf8',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  <Key size={14} />
                  BÀN GIAO & NHẬN XE ĐỒNG SỞ HỮU
                </div>

                {selectedCheckpoint && onCloseCheckpoint && (
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

              {/* Status Header Bar */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
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
                    Trạng thái nhận xe
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: statusConfig.color,
                      background: statusConfig.badgeBg,
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {statusConfig.labelVi}
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
                    Kiểm tra chuẩn bị
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#34d399',
                    }}
                  >
                    {handover.totalInspectedCount} / {handover.requiredCheckpointsCount} điểm
                  </div>
                </div>
              </div>

              {/* SECTION 8: XE ĐANG ĐƯỢC BÀN GIAO CHO BẠN */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '12px',
                  fontSize: '11.5px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
                    paddingBottom: '6px',
                    marginBottom: '8px',
                  }}
                >
                  <Car size={14} />
                  XE ĐANG ĐƯỢC BÀN GIAO CHO BẠN
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                    <span style={{ fontWeight: 800, color: '#fbbf24' }}>
                      {handover.vehicleCode || 'EV01'} ({handover.licensePlate})
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
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>
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

                  {handover.staffName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8' }}>KTV chuẩn bị:</span>
                      <span style={{ fontWeight: 600, color: '#cbd5e1' }}>
                        {handover.staffName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: READ-ONLY CHECKPOINT INSPECTION CARD (When hotspot clicked) */}
              {selectedCheckpoint ? (
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.65)',
                    border: `1.5px solid ${
                      currentInspection
                        ? currentInspection.conditionStatus === 'DAMAGED'
                          ? '#ef4444'
                          : currentInspection.conditionStatus === 'WARNING'
                          ? '#f59e0b'
                          : '#10b981'
                        : 'rgba(56, 189, 248, 0.35)'
                    }`,
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                      paddingBottom: '6px',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#38bdf8',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <FileText size={12} />
                      THÔNG TIN KIỂM TRA BÀN GIAO
                    </div>
                    <span
                      style={{
                        fontSize: '9.5px',
                        color: '#94a3b8',
                        background: 'rgba(15, 23, 42, 0.6)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      Chế độ xem
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    {selectedCheckpoint.nameVi}{' '}
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                      ({selectedCheckpoint.categoryVi})
                    </span>
                  </div>

                  {currentInspection ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Đánh giá của nhân viên:</span>
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
                        <span style={{ color: '#94a3b8' }}>Ghi chú:</span>
                        <div
                          style={{
                            background: 'rgba(15, 23, 42, 0.7)',
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
                        <span style={{ color: '#94a3b8' }}>Kiểm tra bởi:</span>
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                          {currentInspection.inspectedByName || handover.staffName || 'KTV EVShare'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Thời gian:</span>
                        <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                          {formatBookingDate(currentInspection.inspectedAt)} {formatBookingTime(currentInspection.inspectedAt)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic', padding: '6px 0' }}>
                      Chưa có kết quả kiểm tra cho bộ phận này từ nhân viên.
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px dashed rgba(56, 189, 248, 0.25)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    textAlign: 'center',
                    marginBottom: '12px',
                    color: '#94a3b8',
                    fontSize: '11px',
                  }}
                >
                  Nhấp vào các điểm hotspot 3D trên xe để xem chi tiết kết quả kiểm tra của nhân viên.
                </div>
              )}

              {/* SECTION 6: TÓM TẮT TÌNH TRẠNG XE */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    TÓM TẮT TÌNH TRẠNG XE
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                    {handover.totalInspectedCount} / {handover.requiredCheckpointsCount} điểm
                  </div>
                </div>

                {/* Stat badges */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '6px',
                    marginBottom: conditionStats.totalAttention > 0 ? '8px' : '0',
                  }}
                >
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '6px', padding: '4px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#34d399', fontWeight: 700 }}>TỐT</div>
                    <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 900 }}>{conditionStats.good}</div>
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '6px', padding: '4px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 700 }}>CẢNH BÁO</div>
                    <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 900 }}>{conditionStats.warning}</div>
                  </div>
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '4px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#f87171', fontWeight: 700 }}>HƯ HỎNG</div>
                    <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 900 }}>{conditionStats.damaged}</div>
                  </div>
                </div>

                {/* Prominent warning banner if WARNING or DAMAGED exists */}
                {conditionStats.totalAttention > 0 && (
                  <div>
                    <div
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#fbbf24',
                        fontSize: '11px',
                        fontWeight: 800,
                        marginBottom: '6px',
                      }}
                    >
                      <AlertTriangle size={13} />
                      <span>CÓ {conditionStats.totalAttention} ĐIỂM CẦN LƯU Ý KHI NHẬN XE</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {attentionItems.map((item) => {
                        const cp = getCheckpointByCode(item.vehiclePartCode);
                        const isDamaged = item.conditionStatus === 'DAMAGED';
                        return (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '10.5px',
                              background: 'rgba(15, 23, 42, 0.5)',
                              padding: '3px 6px',
                              borderRadius: '4px',
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
                                padding: '1px 5px',
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

              {/* SECTION 7 & 8: ACKNOWLEDGEMENT & RECEIPT WORKFLOW */}
              {isHandedOver ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {!isConditionAcknowledged ? (
                    <div>
                      <button
                        type="button"
                        onClick={onAcknowledgeCondition}
                        disabled={isSubmitting}
                        style={{
                          width: '100%',
                          padding: '11px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                          border: 'none',
                          borderRadius: '10px',
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
                        <ShieldCheck size={14} />
                        {isSubmitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐÃ XEM TÌNH TRẠNG XE'}
                      </button>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#94a3b8',
                          textAlign: 'center',
                          marginTop: '4px',
                        }}
                      >
                        * Vui lòng xem kỹ kết quả kiểm tra trước khi xác nhận nhận xe
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.45)',
                        borderRadius: '8px',
                        padding: '6px 10px',
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
                      <Check size={13} />
                      <span>
                        ĐÃ XÁC NHẬN TÌNH TRẠNG XE ({formatBookingTime(handover.ownerConditionAcknowledgedAt)})
                      </span>
                    </div>
                  )}

                  {/* Confirm Receipt Button - Enabled strictly when condition acknowledged */}
                  <button
                    type="button"
                    onClick={onConfirmReceipt}
                    disabled={!isConditionAcknowledged || isSubmitting}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: isConditionAcknowledged
                        ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                        : 'rgba(30, 41, 59, 0.5)',
                      border: isConditionAcknowledged ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
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
                    <CheckCircle2 size={15} />
                    {isSubmitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN NHẬN XE'}
                  </button>
                </div>
              ) : isCompleted ? (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid rgba(16, 185, 129, 0.6)',
                    borderRadius: '10px',
                    padding: '14px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      color: '#34d399',
                      fontSize: '14px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Sparkles size={16} />
                    CHECK-IN HOÀN TẤT
                  </div>
                  <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}>
                    XE ĐÃ ĐƯỢC BÀN GIAO THÀNH CÔNG
                  </div>
                </div>
              ) : handover.status === 'PENDING_PREPARATION' ? (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
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
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    NHÂN VIÊN ĐANG CHUẨN BỊ XE
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                    Xe đang chờ nhân viên kỹ thuật bắt đầu quy trình chuẩn bị và kiểm tra bàn giao.
                  </div>
                </div>
              ) : handover.status === 'INSPECTION_IN_PROGRESS' ? (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      color: '#fbbf24',
                      fontSize: '12px',
                      fontWeight: 800,
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    NHÂN VIÊN ĐANG KIỂM TRA XE
                  </div>
                  <div style={{ color: '#38bdf8', fontSize: '11.5px', fontWeight: 700, marginBottom: '2px' }}>
                    Tiến độ kiểm tra: {handover.totalInspectedCount} / {handover.requiredCheckpointsCount} điểm
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '10.5px' }}>
                    Vui lòng chờ nhân viên hoàn tất kiểm định 8 bộ phận của xe.
                  </div>
                </div>
              ) : handover.status === 'READY_FOR_HANDOVER' ? (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      color: '#34d399',
                      fontSize: '12px',
                      fontWeight: 800,
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    XE ĐÃ SẴN SÀNG BÀN GIAO
                  </div>
                  <div style={{ color: '#ffffff', fontSize: '11.5px', fontWeight: 600 }}>
                    ĐANG CHỜ NHÂN VIÊN XÁC NHẬN GIAO XE
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
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
                      marginBottom: '4px',
                    }}
                  >
                    XE CHƯA SẴN SÀNG BÀN GIAO
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                    Đang chờ nhân viên kỹ thuật hoàn thành kiểm tra và xác nhận bàn giao.
                  </div>
                </div>
              )}
            </div>
          </Html>
        </Billboard>
      </group>
    </>
  );
};
