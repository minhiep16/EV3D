import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  Loader2,
  MessageSquare,
  Ban,
} from 'lucide-react';
import {
  useExpenseApprovals,
  useSubmitExpenseApproval,
  useCancelExpense,
} from '../../hooks/useExpenses';
import { ExpenseStatus, EXPENSE_STATUS_METADATA } from '../../types/expense';

interface ExpenseVerificationSectionProps {
  expenseId: string;
  expenseStatus: ExpenseStatus;
  evidenceUrl?: string | null;
  evidenceNote?: string | null;
  onUpdated?: () => void;
}

export const ExpenseVerificationSection: React.FC<ExpenseVerificationSectionProps> = ({
  expenseId,
  expenseStatus,
  evidenceUrl,
  evidenceNote,
  onUpdated,
}) => {
  const { data: approvalData, isLoading, error, refetch } = useExpenseApprovals(expenseId);
  const submitApprovalMutation = useSubmitExpenseApproval();
  const cancelExpenseMutation = useCancelExpense();

  const [comment, setComment] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    setActionError(null);
    try {
      await submitApprovalMutation.mutateAsync({
        expenseId,
        payload: {
          decision,
          comment: comment.trim() || undefined,
        },
      });
      setComment('');
      refetch();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setActionError(err?.message || 'Không thể gửi quyết định xác minh.');
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    try {
      await cancelExpenseMutation.mutateAsync(expenseId);
      refetch();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setActionError(err?.message || 'Không thể hủy khoản chi.');
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(6, 18, 36, 0.70)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 242, 254, 0.20)',
          color: '#38bdf8',
          fontSize: '11.5px',
          marginTop: '6px',
        }}
      >
        <Loader2 size={14} className="animate-spin" />
        <span>Đang tải tiến trình xác minh...</span>
      </div>
    );
  }

  if (error || !approvalData) {
    return (
      <div
        style={{
          padding: '8px 12px',
          background: 'rgba(239, 68, 68, 0.10)',
          borderRadius: '10px',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#fca5a5',
          fontSize: '11px',
          marginTop: '6px',
        }}
      >
        Không thể tải thông tin xác minh của khoản chi này.
      </div>
    );
  }

  const {
    approvalOwnershipPercentage = 0,
    rejectionOwnershipPercentage = 0,
    requiredThreshold = 50,
    canCurrentUserApprove,
    isCurrentUserCreator,
    currentUserDecision,
    memberDecisions = [],
    status,
  } = approvalData;

  const currentStatusMeta = EXPENSE_STATUS_METADATA[status] || EXPENSE_STATUS_METADATA.PENDING_VERIFICATION;
  const progressRatio = Math.min(100, Math.max(0, (approvalOwnershipPercentage / requiredThreshold) * 100));

  return (
    <div
      style={{
        marginTop: '8px',
        padding: '12px 14px',
        background: 'rgba(5, 16, 32, 0.88)',
        border: `1.2px solid ${
          status === 'APPROVED'
            ? 'rgba(16, 185, 129, 0.40)'
            : status === 'REJECTED'
            ? 'rgba(239, 68, 68, 0.40)'
            : 'rgba(245, 158, 11, 0.40)'
        }`,
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* 1. Header: Trạng thái & Tỷ lệ xác minh */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color={currentStatusMeta.color} />
          <span style={{ fontSize: '12px', fontWeight: 750, color: '#f8fafc', textTransform: 'uppercase' }}>
            Xác minh đồng sở hữu
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '9999px',
              background: currentStatusMeta.bg,
              color: currentStatusMeta.color,
              border: `1px solid ${currentStatusMeta.border}`,
            }}
          >
            {currentStatusMeta.label}
          </span>
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
          Cần: <strong style={{ color: '#00f2fe' }}>{requiredThreshold}%</strong> cổ phần
        </div>
      </div>

      {/* 2. Thanh tiến trình xác minh */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            marginBottom: '4px',
          }}
        >
          <span style={{ color: '#cbd5e1' }}>
            Đã xác nhận:{' '}
            <strong style={{ color: approvalOwnershipPercentage >= requiredThreshold ? '#10b981' : '#f59e0b' }}>
              {approvalOwnershipPercentage}%
            </strong>
          </span>
          {rejectionOwnershipPercentage > 0 && (
            <span style={{ color: '#ef4444' }}>
              Từ chối: <strong>{rejectionOwnershipPercentage}%</strong>
            </span>
          )}
        </div>

        <div
          style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          <div
            style={{
              width: `${progressRatio}%`,
              height: '100%',
              background:
                approvalOwnershipPercentage >= requiredThreshold
                  ? '#10b981'
                  : 'linear-gradient(90deg, #f59e0b, #00f2fe)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* 3. Bằng chứng / Chứng từ nếu có */}
      {(evidenceUrl || evidenceNote) && (
        <div
          style={{
            background: 'rgba(10, 26, 48, 0.70)',
            border: '1px solid rgba(0, 242, 254, 0.20)',
            borderRadius: '10px',
            padding: '8px 10px',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ color: '#00f2fe', fontWeight: 700, fontSize: '10.5px' }}>
            CHỨNG TỪ & BIÊN LAI:
          </div>
          {evidenceUrl && (
            <div style={{ color: '#f8fafc', wordBreak: 'break-all' }}>
              <span style={{ color: '#94a3b8' }}>Mã / Link:</span> {evidenceUrl}
            </div>
          )}
          {evidenceNote && (
            <div style={{ color: '#cbd5e1' }}>
              <span style={{ color: '#94a3b8' }}>Ghi chú:</span> {evidenceNote}
            </div>
          )}
        </div>
      )}

      {/* 4. Danh sách phản hồi từng thành viên */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
          Ý kiến thành viên:
        </div>

        {memberDecisions.map((m) => {
          const isApprove = m.decision === 'APPROVE';
          const isReject = m.decision === 'REJECT';

          return (
            <div
              key={m.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 650, color: '#f8fafc' }}>{m.fullName}</span>
                <span
                  style={{
                    background: 'rgba(0, 242, 254, 0.12)',
                    color: '#00f2fe',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                  }}
                >
                  {m.ownershipPercentage}%
                </span>
                {m.isCreator && (
                  <span
                    style={{
                      background: 'rgba(148, 163, 184, 0.15)',
                      color: '#94a3b8',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 600,
                    }}
                  >
                    Người tạo
                  </span>
                )}
              </div>

              <div>
                {m.isCreator ? (
                  <span style={{ color: '#64748b', fontSize: '10px' }}>Không tự xác nhận</span>
                ) : isApprove ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#10b981',
                      fontWeight: 700,
                      fontSize: '10.5px',
                    }}
                  >
                    <CheckCircle2 size={12} /> Đã xác nhận
                  </span>
                ) : isReject ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#ef4444',
                      fontWeight: 700,
                      fontSize: '10.5px',
                    }}
                  >
                    <XCircle size={12} /> Từ chối
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#94a3b8',
                      fontSize: '10px',
                    }}
                  >
                    <Clock size={11} /> Chưa phản hồi
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Thông báo lỗi action nếu có */}
      {actionError && (
        <div
          style={{
            padding: '6px 10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertTriangle size={13} />
          <span>{actionError}</span>
        </div>
      )}

      {/* 6. Form thao tác xác nhận / từ chối cho đồng sở hữu đủ điều kiện */}
      {canCurrentUserApprove && (
        <div
          style={{
            marginTop: '4px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '7px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#00f2fe', fontWeight: 700 }}>
            <UserCheck size={13} />
            <span>Phần xác minh của bạn ({currentUserDecision ? `Hiện tại: ${currentUserDecision === 'APPROVE' ? 'Đã duyệt' : 'Đã từ chối'}` : 'Chưa xác nhận'}):</span>
          </div>

          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ghi chú xác minh (VD: Đã kiểm tra hóa đơn)..."
            style={{
              width: '100%',
              background: 'rgba(6, 18, 34, 0.80)',
              border: '1px solid rgba(0, 242, 254, 0.30)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#ffffff',
              fontSize: '11px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleDecision('APPROVE')}
              disabled={submitApprovalMutation.isPending}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.40) 100%)',
                border: '1.2px solid #10b981',
                borderRadius: '10px',
                padding: '7px',
                color: '#6ee7b7',
                fontSize: '11.5px',
                fontWeight: 750,
                cursor: submitApprovalMutation.isPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              {submitApprovalMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCircle2 size={13} />
              )}
              <span>XÁC NHẬN (+{approvalData.memberDecisions.find(m => m.userId === approvalData.creatorUserId)?.ownershipPercentage ?? ''}%)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDecision('REJECT')}
              disabled={submitApprovalMutation.isPending}
              style={{
                flex: 1,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1.2px solid rgba(239, 68, 68, 0.45)',
                borderRadius: '10px',
                padding: '7px',
                color: '#fca5a5',
                fontSize: '11.5px',
                fontWeight: 750,
                cursor: submitApprovalMutation.isPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              {submitApprovalMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <XCircle size={13} />
              )}
              <span>TỪ CHỐI</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. Nút Hủy khoản chi cho người tạo khi còn PENDING */}
      {isCurrentUserCreator && status === 'PENDING_VERIFICATION' && (
        <div
          style={{
            marginTop: '2px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelExpenseMutation.isPending}
            style={{
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              padding: '4px 10px',
              color: '#f87171',
              fontSize: '10.5px',
              fontWeight: 600,
              cursor: cancelExpenseMutation.isPending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {cancelExpenseMutation.isPending ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Ban size={11} />
            )}
            <span>Hủy khoản chi này</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpenseVerificationSection;
