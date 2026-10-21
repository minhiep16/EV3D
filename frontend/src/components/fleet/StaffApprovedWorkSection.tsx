import React, { useState } from 'react';
import { VehicleResponse } from '../../types/vehicle';
import { ApprovedWorkResponse, VOTE_PROPOSAL_TYPE_CONFIG } from '../../types/voting';
import {
  useStaffApprovedWork,
  useStartApprovedWork,
  useCompleteApprovedWork,
} from '../../hooks/useVoting';
import {
  Briefcase,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Check,
  X,
  FileText,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface StaffApprovedWorkSectionProps {
  vehicle: VehicleResponse;
  onRefreshParent?: () => void;
}

export const StaffApprovedWorkSection: React.FC<StaffApprovedWorkSectionProps> = ({
  vehicle,
  onRefreshParent,
}) => {
  const { data: approvedWorks = [], isLoading } = useStaffApprovedWork(vehicle.id);
  const startWorkMutation = useStartApprovedWork();
  const completeWorkMutation = useCompleteApprovedWork();

  const [completingProposalId, setCompletingProposalId] = useState<string | null>(null);
  const [actualCostInput, setActualCostInput] = useState('');
  const [completionNoteInput, setCompletionNoteInput] = useState('');
  const [evidenceUrlInput, setEvidenceUrlInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const formatVND = (num?: number | null) => {
    if (num == null) return '0 VNĐ';
    return `${Number(num).toLocaleString('vi-VN')} VNĐ`;
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '--:-- --/--/----';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '--:-- --/--/----';
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${time} ${day}/${month}/${year}`;
    } catch {
      return '--:-- --/--/----';
    }
  };

  const handleStartWork = (item: ApprovedWorkResponse) => {
    if (!item.canStartExecution) return;
    startWorkMutation.mutate(
      { proposalId: item.proposalId },
      {
        onSuccess: () => {
          showToast('success', `Đã bắt đầu thực hiện: ${item.title}`);
          onRefreshParent?.();
        },
        onError: (err: any) => {
          showToast('error', err?.message || 'Không thể bắt đầu thực hiện công việc.');
        },
      }
    );
  };

  const handleOpenComplete = (item: ApprovedWorkResponse) => {
    setCompletingProposalId(item.proposalId);
    setActualCostInput(item.approvedBudget.toString());
    setCompletionNoteInput('');
    setEvidenceUrlInput('');
    setErrorMessage(null);
  };

  const handleConfirmComplete = (item: ApprovedWorkResponse) => {
    const cost = parseFloat(actualCostInput.replace(/\D/g, ''));
    if (isNaN(cost) || cost <= 0) {
      setErrorMessage('Vui lòng nhập chi phí thực tế hợp lệ.');
      return;
    }

    if (cost > item.approvedBudget) {
      setErrorMessage(
        `Chi phí thực tế (${formatVND(cost)}) vượt quá ngân sách được phê duyệt (${formatVND(
          item.approvedBudget
        )}). Vui lòng điều chỉnh hoặc yêu cầu biểu quyết bổ sung.`
      );
      return;
    }

    completeWorkMutation.mutate(
      {
        proposalId: item.proposalId,
        payload: {
          actualCost: cost,
          completionNote: completionNoteInput.trim() || undefined,
          evidenceUrl: evidenceUrlInput.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setCompletingProposalId(null);
          showToast('success', 'Đã hoàn tất công việc & tự động ghi nhận chi phí!');
          onRefreshParent?.();
        },
        onError: (err: any) => {
          setErrorMessage(err?.message || 'Không thể hoàn tất công việc.');
        },
      }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Toast notifications */}
      {successMessage && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(16, 185, 129, 0.9)',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <CheckCircle2 size={14} />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.9)',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '6px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Briefcase size={14} />
          <span>CÔNG VIỆC ĐÃ ĐƯỢC PHÊ DUYỆT ({approvedWorks.length})</span>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '11px' }}>
          Đang tải danh sách công việc...
        </div>
      ) : approvedWorks.length === 0 ? (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          Chưa có công việc nào từ biểu quyết chung cần thực hiện.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {approvedWorks.map((item) => {
            const isCompleting = completingProposalId === item.proposalId;
            const isWaitingVote = item.votingStatus === 'OPEN';
            const isInProgress = item.workStatus === 'IN_PROGRESS';
            const isCompleted = item.workStatus === 'COMPLETED';

            return (
              <div
                key={item.proposalId}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: `1px solid ${
                    isCompleted
                      ? 'rgba(16, 185, 129, 0.3)'
                      : isInProgress
                      ? 'rgba(56, 189, 248, 0.4)'
                      : isWaitingVote
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'rgba(34, 230, 255, 0.35)'
                  }`,
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: VOTE_PROPOSAL_TYPE_CONFIG[item.proposalType]?.color || '#38bdf8',
                      background: VOTE_PROPOSAL_TYPE_CONFIG[item.proposalType]?.bg || 'rgba(56, 189, 248, 0.1)',
                      border: `1px solid ${VOTE_PROPOSAL_TYPE_CONFIG[item.proposalType]?.borderColor || 'rgba(56, 189, 248, 0.3)'}`,
                    }}
                  >
                    {item.proposalTypeVietnamese}
                  </span>

                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: isCompleted
                        ? '#10b981'
                        : isInProgress
                        ? '#38bdf8'
                        : isWaitingVote
                        ? '#f59e0b'
                        : '#34d399',
                      background: isCompleted
                        ? 'rgba(16, 185, 129, 0.15)'
                        : isInProgress
                        ? 'rgba(56, 189, 248, 0.15)'
                        : isWaitingVote
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(52, 211, 153, 0.15)',
                      border: `1px solid ${
                        isCompleted
                          ? 'rgba(16, 185, 129, 0.35)'
                          : isInProgress
                          ? 'rgba(56, 189, 248, 0.35)'
                          : isWaitingVote
                          ? 'rgba(245, 158, 11, 0.35)'
                          : 'rgba(52, 211, 153, 0.35)'
                      }`,
                    }}
                  >
                    {isWaitingVote ? 'ĐANG CHỜ BIỂU QUYẾT' : item.workStatusVietnamese}
                  </span>
                </div>

                {/* Title */}
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                  {item.title}
                </div>

                {/* Description if present */}
                {item.description && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                    {item.description}
                  </div>
                )}

                {/* Key metadata grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    padding: '8px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '6px',
                    fontSize: '10.5px',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b' }}>Ngân sách duyệt: </span>
                    <b style={{ color: '#10b981' }}>{formatVND(item.approvedBudget)}</b>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Mã ủy quyền: </span>
                    <b style={{ color: '#38bdf8' }}>{item.authorizationId.substring(0, 8)}...</b>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Ngày phê duyệt: </span>
                    <span style={{ color: '#cbd5e1' }}>{formatDateTime(item.approvedAt).split(' ')[1]}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Chi phí thực tế: </span>
                    <b style={{ color: '#f59e0b' }}>
                      {item.actualCost != null ? formatVND(item.actualCost) : '--'}
                    </b>
                  </div>
                </div>

                {/* Action button area */}
                {isWaitingVote && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <button
                      type="button"
                      disabled={true}
                      title="Đề xuất đang chờ biểu quyết, chưa có hiệu lực ủy quyền thực hiện."
                      style={{
                        flex: 1,
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '6px',
                        padding: '7px 10px',
                        color: '#f59e0b',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'not-allowed',
                        opacity: 0.55,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Play size={12} />
                      <span>BẮT ĐẦU THỰC HIỆN (CHỜ BIỂU QUYẾT)</span>
                    </button>
                  </div>
                )}

                {!isWaitingVote && !isInProgress && !isCompleted && (
                  <button
                    type="button"
                    onClick={() => handleStartWork(item)}
                    disabled={startWorkMutation.isPending}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #0284c7 0%, #22e6ff 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#071426',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '4px',
                    }}
                  >
                    <Play size={14} />
                    <span>BẮT ĐẦU THỰC HIỆN</span>
                  </button>
                )}

                {isInProgress && !isCompleting && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenComplete(item)}
                      style={{
                        flex: 1,
                        background: '#059669',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>HOÀN TẤT & GHI NHẬN CHI PHÍ</span>
                    </button>
                  </div>
                )}

                {/* Inline Complete Form */}
                {isCompleting && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '10px',
                      background: 'rgba(5, 150, 105, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981' }}>
                      XÁC NHẬN HOÀN TẤT & HÓA ĐƠN THỰC TẾ
                    </div>

                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                        Chi phí thực tế (VNĐ) - Tối đa: {formatVND(item.approvedBudget)} *
                      </label>
                      <input
                        type="text"
                        value={actualCostInput}
                        onChange={(e) => setActualCostInput(e.target.value)}
                        placeholder="Số tiền thực tế..."
                        style={{
                          width: '100%',
                          background: '#0f172a',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          fontSize: '11.5px',
                          color: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                        Ghi chú nghiệm thu / Phụ tùng đã thay
                      </label>
                      <input
                        type="text"
                        value={completionNoteInput}
                        onChange={(e) => setCompletionNoteInput(e.target.value)}
                        placeholder="Nội dung công việc hoàn thành..."
                        style={{
                          width: '100%',
                          background: '#0f172a',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          fontSize: '11px',
                          color: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleConfirmComplete(item)}
                        disabled={completeWorkMutation.isPending}
                        style={{
                          background: '#059669',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        {completeWorkMutation.isPending ? 'Đang lưu...' : 'Xác nhận hoàn tất'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setCompletingProposalId(null)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #475569',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '11px',
                          color: '#94a3b8',
                          cursor: 'pointer',
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '2px',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Đã hoàn tất lúc {formatDateTime(item.executionCompletedAt)} (Chi phí: {formatVND(item.actualCost)})</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
