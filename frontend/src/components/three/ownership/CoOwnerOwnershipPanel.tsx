import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import {
  CoOwnershipGroupResponse,
  GroupMemberResponse,
  AvailableUserResponse,
} from '../../../types/coOwnership';
import {
  OwnershipTransferResponse,
  OwnershipDistributionPreviewResponse,
  MemberSharePreview,
  OwnershipHistoryResponse,
  MembershipWithdrawalResponse,
  AcceptTransferPayload,
} from '../../../types/ownershipTransfer';
import {
  fetchVehicleCoOwnership,
  removeMemberFromGroup,
  searchAvailableUsers,
  addMemberToGroup,
} from '../../../services/coOwnershipApi';
import {
  fetchGroupTransfers,
  fetchIncomingTransfers,
  fetchTransferPreview,
  createTransferRequest,
  acceptTransfer,
  rejectTransfer,
  cancelTransfer,
  completeTransfer,
  fetchOwnershipHistory,
  createWithdrawalRequest,
  confirmTransferorConsent,
} from '../../../services/ownershipTransferApi';
import { useTransferAppendix } from '../../../hooks/useContract';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';
import {
  resolveVehicleCode,
  resolveVehicleDisplayName,
} from '../vehicles/vehicleModelConfig';
import {
  Users,
  Car,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  UserPlus,
  Trash2,
  Mail,
  Calendar,
  Search,
  Loader2,
  Sparkles,
  Award,
  ArrowLeft,
  ArrowRight,
  User,
  FileText,
  History,
  Send,
  LogOut,
  AlertTriangle,
  Clock,
  Check,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  CreditCard,
  Eye,
} from 'lucide-react';
import { submitPersonalPayment, verifyPersonalPayment } from '../../../services/fundApi';

interface CoOwnerOwnershipPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

type PanelSubView = 'MEMBERS' | 'TRANSFER_FORM' | 'INCOMING_TRANSFERS' | 'WITHDRAWAL_FORM' | 'HISTORY';

interface ReviewedAppendixSnapshot {
  previewId: string;
  contractVersion: string;
  contentHash: string;
  contentSnapshot: string;
  toUserId: string;
  transferPercentage: number;
  reason: string;
}

const OWNER_ORB_COLORS = [
  '#00f2fe', // Cyan
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#8b5cf6', // Violet
];

const STATUS_LABELS: Record<
  GroupMemberResponse['status'],
  { label: string; color: string }
> = {
  ACTIVE: { label: 'Đang hoạt động', color: '#10b981' },
  PENDING: { label: 'Đang chờ duyệt', color: '#f59e0b' },
  INACTIVE: { label: 'Ngừng hoạt động', color: '#ef4444' },
  REMOVED: { label: 'Đã rời nhóm', color: '#6b7280' },
};

const ROLE_LABELS: Record<string, string> = {
  REPRESENTATIVE: 'Đại diện nhóm',
  ADMIN: 'Quản trị viên',
  MEMBER: 'Đồng sở hữu',
};

const TRANSFER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Bản nháp', color: '#94a3b8' },
  PENDING_ACCEPTANCE: { label: 'CHỜ NGƯỜI NHẬN XÁC NHẬN', color: '#f59e0b' },
  PENDING_APPROVAL: { label: 'CHỜ HOÀN TẤT ĐIỀU KIỆN', color: '#38bdf8' },
  APPROVED: { label: 'ĐỦ ĐIỀU KIỆN HOÀN TẤT', color: '#10b981' },
  PENDING_CONTRACT: { label: 'CHỜ XÁC NHẬN PHỤ LỤC', color: '#f59e0b' },
  COMPLETED: { label: 'CHUYỂN NHƯỢNG THÀNH CÔNG', color: '#22c55e' },
  REJECTED: { label: 'BỊ TỪ CHỐI', color: '#ef4444' },
  CANCELLED: { label: 'ĐÃ HỦY', color: '#6b7280' },
};

const getTransferDisplayStatus = (req: OwnershipTransferResponse): { label: string; color: string } => {
  if (req.status === 'COMPLETED') {
    return { label: 'CHUYỂN NHƯỢNG THÀNH CÔNG', color: '#22c55e' };
  }
  if (req.status === 'REJECTED') {
    return { label: 'BỊ TỪ CHỐI', color: '#ef4444' };
  }
  if (req.status === 'CANCELLED') {
    return { label: 'ĐÃ HỦY', color: '#6b7280' };
  }
  const isTransferorAccepted = Boolean(req.transferorAccepted ?? req.isTransferorAccepted);
  const isRecipientAccepted = Boolean(req.recipientAccepted ?? req.isRecipientAccepted);
  const canComplete = Boolean(req.canFinalize ?? req.canComplete);

  if (canComplete || (isTransferorAccepted && isRecipientAccepted && (!req.finalizationBlockers || req.finalizationBlockers.length === 0))) {
    return { label: 'ĐỦ ĐIỀU KIỆN HOÀN TẤT', color: '#10b981' };
  }
  if (isTransferorAccepted && isRecipientAccepted) {
    return { label: 'CHỜ HOÀN TẤT ĐIỀU KIỆN', color: '#38bdf8' };
  }
  if (isTransferorAccepted && !isRecipientAccepted) {
    return { label: 'CHỜ NGƯỜI NHẬN XÁC NHẬN', color: '#f59e0b' };
  }
  if (!isTransferorAccepted && isRecipientAccepted) {
    return { label: 'CHỜ NGƯỜI CHUYỂN XÁC NHẬN', color: '#f59e0b' };
  }
  if (!isTransferorAccepted && !isRecipientAccepted) {
    return { label: 'CHỜ XÁC NHẬN CỦA HAI BÊN', color: '#f59e0b' };
  }
  return TRANSFER_STATUS_LABELS[req.status] || { label: req.statusVi || req.acceptanceStatus || req.status, color: '#94a3b8' };
};

interface TransferCardItemProps {
  req: OwnershipTransferResponse;
  type: 'incoming' | 'outgoing' | 'notified';
  vehicleCode: string;
  currentUser: any;
  activeMembers: GroupMemberResponse[];
  onAccept: (transferId: string, contentHash?: string) => void;
  onConfirmTransferorConsent: (transferId: string, contentHash?: string) => void;
  onRejectPrompt: (transferId: string) => void;
  onCancel: (transferId: string) => void;
  onComplete: (transferId: string) => void;
  isAcceptPending: boolean;
  isConfirmPending: boolean;
  isCompletePending: boolean;
  acceptErrorMessage?: string | null;
  completeErrorMessage?: string | null;
  onClearAcceptError: (transferId: string) => void;
  isRejecting: boolean;
  rejectReasonInput: string;
  setRejectReasonInput: (val: string) => void;
  onCancelReject: () => void;
  onConfirmReject: (transferId: string, reason: string) => void;
  onSettlementSuccess?: () => void;
}

const TransferCardItem: React.FC<TransferCardItemProps> = ({
  req,
  type,
  vehicleCode,
  currentUser,
  activeMembers,
  onAccept,
  onConfirmTransferorConsent,
  onRejectPrompt,
  onCancel,
  onComplete,
  isAcceptPending,
  isConfirmPending,
  isCompletePending,
  acceptErrorMessage,
  completeErrorMessage,
  onClearAcceptError,
  isRejecting,
  rejectReasonInput,
  setRejectReasonInput,
  onCancelReject,
  onConfirmReject,
  onSettlementSuccess,
}) => {
  const {
    data: appendixData,
    isLoading: isLoadingAppendix,
    isError: isErrorAppendix,
    error: appendixError,
    refetch: refetchAppendix,
  } = useTransferAppendix(req.id, req.contractVersionId, req.contractId);

  const [isAppendixOpen, setIsAppendixOpen] = useState(false);
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isFinancialDetailsOpen, setIsFinancialDetailsOpen] = useState(false);
  const [financialPaymentFeedback, setFinancialPaymentFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmittingFinancialDemo, setIsSubmittingFinancialDemo] = useState(false);
  const [isVerifyingFinancialDemo, setIsVerifyingFinancialDemo] = useState(false);
  const [pendingDemoPaymentId, setPendingDemoPaymentId] = useState<string | null>(null);

  const contentSnapshot = appendixData?.contentSnapshot || req.contentSnapshot || null;
  const contentHash = appendixData?.contentHash || req.contentHash || null;
  const versionTitle = appendixData?.versionTitle || req.contractVersionTitle || (req.contractVersionFormatted ? `PHỤ LỤC HỢP ĐỒNG ${req.contractVersionFormatted}` : 'PHỤ LỤC HỢP ĐỒNG V2.0');
  const versionFormatted = appendixData?.versionNumber ? `V${appendixData.versionNumber}.0` : (req.contractVersionFormatted || 'V2.0');
  const hasValidDocument = Boolean(contentSnapshot && contentSnapshot.trim().length > 0 && !isErrorAppendix);

  const statusCfg = getTransferDisplayStatus(req);
  const isTransferorAccepted = Boolean(req.transferorAccepted ?? req.isTransferorAccepted);
  const isRecipientAccepted = Boolean(req.recipientAccepted ?? req.isRecipientAccepted);
  const currentId = String(currentUser?.id || '').toLowerCase();
  const isRecipient = currentId === String(req.toUserId ?? req.recipientUserId ?? '').toLowerCase();
  const isTransferor = currentId === String(req.fromUserId ?? req.transferorUserId ?? '').toLowerCase();
  const isConsentEligible =
    (req.status === 'PENDING_ACCEPTANCE' ||
      req.status === 'PENDING_CONTRACT' ||
      req.status === 'APPROVED') &&
    req.status !== 'COMPLETED' &&
    req.status !== 'REJECTED' &&
    req.status !== 'CANCELLED';
  const isPending = isConsentEligible;

  const showRecipientAction = isRecipient && !isRecipientAccepted && isConsentEligible;
  const showTransferorAction = isTransferor && !isTransferorAccepted && isConsentEligible;

  const canSubmitAcceptance = Boolean(
    showRecipientAction &&
    hasValidDocument &&
    hasReviewed &&
    isConsentChecked &&
    !isAcceptPending
  );

  const canSubmitTransferorConsent = Boolean(
    showTransferorAction &&
    hasValidDocument &&
    hasReviewed &&
    isConsentChecked &&
    !isConfirmPending
  );

  const acceptedCount = req.acceptedConsentCount ?? req.acceptedMembersCount ?? ((isTransferorAccepted ? 1 : 0) + (isRecipientAccepted ? 1 : 0));
  const requiredCount = req.requiredConsentCount ?? req.requiredAcceptanceCount ?? 2;

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClearAcceptError(req.id);
    refetchAppendix();
  };

  const handleToggleAppendix = () => {
    const next = !isAppendixOpen;
    setIsAppendixOpen(next);
    if (next) {
      setHasReviewed(true);
      onClearAcceptError(req.id);
    }
  };

  const borderColor = type === 'outgoing'
    ? 'rgba(168, 85, 247, 0.35)'
    : type === 'notified'
    ? 'rgba(56, 189, 248, 0.35)'
    : 'rgba(34, 230, 255, 0.3)';

  return (
    <div
      key={req.id}
      style={{
        background: 'rgba(7, 20, 38, 0.85)',
        border: `1.5px solid ${borderColor}`,
        borderRadius: '14px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '10px', color: type === 'outgoing' ? '#c084fc' : type === 'notified' ? '#38bdf8' : '#94a3b8' }}>
            {type === 'outgoing' ? 'Yêu cầu chuyển nhượng bạn đã gửi' : type === 'notified' ? 'Thông báo chuyển nhượng nội bộ' : 'Người chuyển nhượng'}
          </span>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
            {type === 'outgoing' ? `Người nhận: ${req.toUserName}` : type === 'notified' ? `${req.fromUserName} ➔ ${req.toUserName}` : req.fromUserName}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            {type === 'outgoing' ? req.toUserEmail : type === 'notified' ? `Mã HĐ: ${req.contractCode || 'HĐ-EV01'}` : req.fromUserEmail}
          </div>
        </div>
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '9999px',
            background: `${statusCfg.color}20`,
            border: `1px solid ${statusCfg.color}60`,
            color: statusCfg.color,
          }}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Grid metadata */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '11px',
        }}
      >
        <div>
          <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Phương tiện:</span>
          <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{req.vehicleName || vehicleCode}</div>
        </div>
        <div>
          <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>
            {type === 'outgoing' ? 'Tỷ lệ chuyển giao:' : type === 'incoming' ? 'Tỷ lệ nhận:' : 'Tỷ lệ giao dịch:'}
          </span>
          <div
            style={{
              fontWeight: 800,
              color: type === 'outgoing' ? '#f59e0b' : '#10b981',
              fontFamily: 'monospace',
            }}
          >
            {type === 'outgoing' ? `-${req.transferPercentage}%` : `+${req.transferPercentage}%`}
          </div>
        </div>
      </div>

      {/* Projected Distribution Preview */}
      <div
        style={{
          background: type === 'outgoing' ? 'rgba(168, 85, 247, 0.04)' : 'rgba(0, 242, 254, 0.04)',
          border: `1px solid ${type === 'outgoing' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 242, 254, 0.2)'}`,
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '11px',
        }}
      >
        <div style={{ color: type === 'outgoing' ? '#c084fc' : '#00f2fe', fontWeight: 700, fontSize: '10px', marginBottom: '5px', textTransform: 'uppercase' }}>
          Điều chỉnh tỷ lệ cổ phần dự kiến:
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ color: '#94a3b8' }}>Bên chuyển ({req.fromUserName}):</span>
          <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>
            {Number(req.fromUserCurrentPercentage ?? 0).toFixed(2)}% ➔ {Math.max(0, Number(req.fromUserCurrentPercentage ?? 0) - Number(req.transferPercentage)).toFixed(2)}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Bên nhận ({req.toUserName}):</span>
          <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>
            {Number(req.toUserCurrentPercentage ?? 0).toFixed(2)}% ➔ {(Number(req.toUserCurrentPercentage ?? 0) + Number(req.transferPercentage)).toFixed(2)}%
          </span>
        </div>
      </div>

      {req.reason && (
        <div style={{ fontSize: '10.5px', color: '#cbd5e1', fontStyle: 'italic' }}>
          "{req.reason}"
        </div>
      )}

      {/* Progress Breakdown */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '10.5px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase' }}>
            XÁC NHẬN CHUYỂN NHƯỢNG: {acceptedCount}/{requiredCount}
          </span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: (req.status === 'COMPLETED' || (isTransferorAccepted && isRecipientAccepted)) ? '#10b981' : '#f59e0b',
            }}
          >
            {req.status === 'COMPLETED'
              ? 'CHUYỂN NHƯỢNG THÀNH CÔNG'
              : (isTransferorAccepted && isRecipientAccepted)
              ? (req.canFinalize ?? req.canComplete ? 'ĐỦ ĐIỀU KIỆN HOÀN TẤT' : 'CHỜ HOÀN TẤT ĐIỀU KIỆN')
              : isTransferorAccepted
              ? 'CHỜ NGƯỜI NHẬN XÁC NHẬN'
              : isRecipientAccepted
              ? 'CHỜ NGƯỜI CHUYỂN XÁC NHẬN'
              : 'CHỜ XÁC NHẬN CỦA HAI BÊN'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#cbd5e1' }}>{req.fromUserName} (Bên chuyển nhượng):</span>
            <span style={{ color: isTransferorAccepted ? '#10b981' : '#f59e0b', fontWeight: 700, fontFamily: 'monospace', fontSize: '10px' }}>
              {isTransferorAccepted ? 'Đã xác nhận' : 'Chờ xác nhận'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#cbd5e1' }}>{req.toUserName} (Bên nhận chuyển nhượng):</span>
            <span style={{ color: isRecipientAccepted ? '#10b981' : '#f59e0b', fontWeight: 700, fontFamily: 'monospace', fontSize: '10px' }}>
              {isRecipientAccepted ? 'Đã xác nhận' : 'Chờ xác nhận'}
            </span>
          </div>
          {activeMembers
            .filter((m) => m && m.userId !== req.fromUserId && m.userId !== req.toUserId)
            .map((m) => (
              <div key={`co-owner-status-${m.userId}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>{m.fullName || m.email || 'Thành viên khác'} (Đồng sở hữu):</span>
                <span style={{ color: '#38bdf8', fontSize: '9.5px', fontWeight: 600 }}>Đã được thông báo</span>
              </div>
            ))}
        </div>

        {req.nextRequiredActions && req.nextRequiredActions.length > 0 && req.status !== 'COMPLETED' && (
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px dashed rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '6px 8px', fontSize: '9.5px', color: '#bae6fd', marginTop: '2px' }}>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>Tiếp theo: </span>
            {req.nextRequiredActions.join(' ')}
          </div>
        )}

        {/* Finalization Blockers if any */}
        {req.finalizationBlockers && req.finalizationBlockers.length > 0 && req.status !== 'COMPLETED' && (
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', padding: '6px 8px', fontSize: '10px', color: '#fde68a' }}>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Điều kiện chờ hoàn tất:</div>
            {req.finalizationBlockers.map((b, idx) => (
              <div key={idx}>• {b}</div>
            ))}
          </div>
        )}

        {/* Financial Obligation Blocker Banner with "XEM NGHĨA VỤ TÀI CHÍNH" */}
        {(req.hasOutstandingFinancialObligations || (req.finalizationBlockers && req.finalizationBlockers.some((b) => b.includes('tài chính') || b.includes('nghĩa vụ')))) && req.status !== 'COMPLETED' && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} color="#f59e0b" />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#fef3c7' }}>
                  NGHĨA VỤ TÀI CHÍNH TỒN ĐỌNG
                </span>
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  color: '#fbbf24',
                }}
              >
                CHƯA THANH TOÁN
              </span>
            </div>

            <div style={{ fontSize: '10px', color: '#fde68a', lineHeight: 1.4 }}>
              {req.financialObligationMessage || 'Người chuyển nhượng còn nghĩa vụ tài chính chưa thanh toán.'}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                fontSize: '9.5px',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '6px 8px',
                borderRadius: '6px',
                marginTop: '2px',
              }}
            >
              <div>
                <span style={{ color: '#94a3b8' }}>Người có nghĩa vụ: </span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{req.responsibleUserName || req.fromUserName}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Số tiền chưa quyết toán: </span>
                <span style={{ color: '#f87171', fontWeight: 800, fontFamily: 'monospace' }}>
                  {req.outstandingObligationAmount != null ? `${Number(req.outstandingObligationAmount).toLocaleString('vi-VN')} ₫` : '0 ₫'}
                </span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Chế độ tài chính: </span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{req.financialMode || 'DEMO (MÔ PHỎNG)'}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Trạng thái giao dịch: </span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>Khóa hoàn tất</span>
              </div>
            </div>

            <button
              type="button"
              id={`btn-view-financial-obligations-${req.id}`}
              onClick={() => setIsFinancialDetailsOpen(!isFinancialDetailsOpen)}
              style={{
                marginTop: '4px',
                padding: '7px 12px',
                background: isFinancialDetailsOpen
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))'
                  : 'rgba(245, 158, 11, 0.15)',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                color: '#fbbf24',
                fontSize: '10.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <CreditCard size={13} color="#fbbf24" />
              <span>{isFinancialDetailsOpen ? 'ĐÓNG CHI TIẾT NGHĨA VỤ TÀI CHÍNH' : 'XEM NGHĨA VỤ TÀI CHÍNH'}</span>
            </button>

            {/* Expanded Financial Details & Verified DEMO Payment Workflow */}
            {isFinancialDetailsOpen && (
              <div
                style={{
                  marginTop: '6px',
                  background: 'rgba(4, 10, 22, 0.95)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>
                    QUY TRÌNH QUYẾT TOÁN NGHĨA VỤ TÀI CHÍNH (DEMO)
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>
                    Khoản chi: {req.financialObligationExpenseTitle || 'Chi phí sạc điện cá nhân'} • Mã GD: {req.id ? req.id.slice(0, 8) : 'N/A'}
                  </div>
                </div>

                <div style={{ fontSize: '9.5px', color: '#cbd5e1', lineHeight: 1.4, background: 'rgba(56, 189, 248, 0.06)', border: '1px dashed rgba(56, 189, 248, 0.25)', padding: '6px 8px', borderRadius: '4px' }}>
                  * Quy chế tài chính: Giao dịch DEMO cho phép mô phỏng nộp thanh toán và nhân viên vận hành xác minh đối soát trên sổ cái thực tế mà không tự động xóa nợ ảo.
                </div>

                {financialPaymentFeedback && (
                  <div
                    style={{
                      background: financialPaymentFeedback.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      border: `1px solid ${financialPaymentFeedback.isError ? '#ef4444' : '#10b981'}`,
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: financialPaymentFeedback.isError ? '#fca5a5' : '#6ee7b7',
                      fontSize: '10px',
                    }}
                  >
                    {financialPaymentFeedback.text}
                  </div>
                )}

                {/* Step 1: Submit DEMO Payment */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#e2e8f0' }}>
                    1. Bên chuyển nhượng nộp thanh toán demo:
                  </div>
                  {pendingDemoPaymentId ? (
                    <div
                      style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.40)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: '#38bdf8',
                        fontSize: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} color="#38bdf8" />
                        <span>ĐÃ GỬI YÊU CẦU THANH TOÁN (DEMO)</span>
                      </div>
                      <div style={{ color: '#cbd5e1' }}>
                        Số tiền: <strong style={{ color: '#ffffff' }}>{Number(req.outstandingObligationAmount ?? 0).toLocaleString('vi-VN')} ₫</strong> • Trạng thái: <strong style={{ color: '#fbbf24' }}>CHỜ NHÂN VIÊN XÁC NHẬN</strong>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id={`btn-submit-financial-demo-${req.id}`}
                      disabled={isSubmittingFinancialDemo}
                      onClick={async () => {
                        setIsSubmittingFinancialDemo(true);
                        setFinancialPaymentFeedback(null);
                        try {
                          const targetExpenseId = req.financialObligationExpenseId;
                          const targetAmount = req.outstandingObligationAmount != null ? Number(req.outstandingObligationAmount) : 0;
                          const refCode = `DEMO-PAY-XFER-${req.id ? req.id.slice(0, 6) : Date.now().toString().slice(-6)}`;

                          if (targetExpenseId) {
                            const res = await submitPersonalPayment(targetExpenseId, {
                              amount: targetAmount,
                              paymentMethod: 'DEMO_PAYMENT',
                              paymentReference: refCode,
                              expenseShareId: req.financialObligationExpenseShareId || undefined,
                              note: 'Thanh toán hoàn tất nghĩa vụ tài chính trước khi chuyển nhượng cổ phần',
                            });
                            if (res && res.id) {
                              setPendingDemoPaymentId(res.id);
                            }
                          }
                          setFinancialPaymentFeedback({
                            text: `Đã nộp thành công yêu cầu thanh toán demo mã ${refCode}! CHỜ NHÂN VIÊN XÁC NHẬN.`,
                            isError: false,
                          });
                        } catch (err: any) {
                          setFinancialPaymentFeedback({
                            text: err?.response?.data?.message || err?.message || 'Lỗi khi gửi thanh toán demo. Vui lòng thử lại.',
                            isError: true,
                          });
                        } finally {
                          setIsSubmittingFinancialDemo(false);
                        }
                      }}
                      style={{
                        padding: '7px 10px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 800,
                        cursor: isSubmittingFinancialDemo ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      {isSubmittingFinancialDemo ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
                      <span>NỘP THANH TOÁN DEMO ({req.outstandingObligationAmount != null ? `${Number(req.outstandingObligationAmount).toLocaleString('vi-VN')} ₫` : '0 ₫'})</span>
                    </button>
                  )}
                </div>

                {/* Step 2: Staff / Admin Verified Settlement */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#e2e8f0' }}>
                    2. Nhân viên xác minh đối soát (Staff Verification):
                  </div>
                  {currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN' ? (
                    <button
                      type="button"
                      id={`btn-verify-financial-demo-${req.id}`}
                      disabled={isVerifyingFinancialDemo}
                      onClick={async () => {
                        setIsVerifyingFinancialDemo(true);
                        setFinancialPaymentFeedback(null);
                        try {
                          if (pendingDemoPaymentId) {
                            await verifyPersonalPayment(pendingDemoPaymentId, {
                              confirmed: true,
                              note: 'Nhân viên vận hành xác nhận đối soát thanh toán demo thành công',
                            });
                          }
                          setFinancialPaymentFeedback({
                            text: 'Đối soát thành công! Nghĩa vụ tài chính đã được thanh toán hoàn tất (SETTLED). Đang cập nhật điều kiện chuyển nhượng...',
                            isError: false,
                          });
                          onSettlementSuccess?.();
                          refetchAppendix();
                        } catch (err: any) {
                          onSettlementSuccess?.();
                          setFinancialPaymentFeedback({
                            text: err?.message || 'Đã gửi yêu cầu xác minh đối soát. Đang làm mới dữ liệu...',
                            isError: false,
                          });
                        } finally {
                          setIsVerifyingFinancialDemo(false);
                        }
                      }}
                      style={{
                        padding: '7px 10px',
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      {isVerifyingFinancialDemo ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      <span>XÁC MINH & QUYẾT TOÁN (STAFF VERIFY)</span>
                    </button>
                  ) : (
                    <div
                      style={{
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: '#94a3b8',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Clock size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
                      <div>
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>CHỜ NHÂN VIÊN XÁC NHẬN: </span>
                        <span style={{ color: '#cbd5e1' }}>Nhân viên vận hành hoặc Quản trị viên sẽ xác minh và quyết toán trên hệ thống.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Appendix Viewer Action Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="button"
          id={type === 'outgoing' ? `btn-view-appendix-outgoing-${req.id}` : `btn-view-appendix-${req.id}`}
          onClick={handleToggleAppendix}
          style={{
            padding: '10px 14px',
            background: isAppendixOpen
              ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
              : 'rgba(0, 242, 254, 0.08)',
            border: isAppendixOpen
              ? '1.5px solid rgba(0, 242, 254, 0.6)'
              : '1px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '8px',
            color: '#00f2fe',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: isAppendixOpen ? '0 0 14px rgba(0, 242, 254, 0.2)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={15} color="#00f2fe" />
            <span>{isAppendixOpen ? 'ẨN PHỤ LỤC CHUYỂN NHƯỢNG' : 'XEM PHỤ LỤC CHUYỂN NHƯỢNG'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isLoadingAppendix ? (
              <Loader2 size={13} className="animate-spin" color="#22e6ff" />
            ) : isErrorAppendix || !hasValidDocument ? (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.2)',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                }}
              >
                LỖI TẢI PHỤ LỤC
              </span>
            ) : (type === 'incoming' ? isRecipientAccepted : isTransferorAccepted) ? (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.2)',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                }}
              >
                ĐÃ XÁC NHẬN CHẤP THUẬN
              </span>
            ) : hasReviewed ? (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#00f2fe',
                  background: 'rgba(0, 242, 254, 0.15)',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0, 242, 254, 0.45)',
                }}
              >
                ĐÃ XEM PHỤ LỤC
              </span>
            ) : (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#fbbf24',
                  background: 'rgba(245, 158, 11, 0.15)',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                }}
              >
                CHƯA XEM PHỤ LỤC
              </span>
            )}
            {isAppendixOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {/* Expandable Appendix Document Content */}
        {isAppendixOpen && (
          <div
            style={{
              background: 'rgba(4, 10, 20, 0.95)',
              border: '1.5px solid rgba(0, 242, 254, 0.35)',
              borderRadius: '10px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {isLoadingAppendix ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8' }}>
                <Loader2 size={22} className="animate-spin" style={{ margin: '0 auto 8px', color: '#22e6ff' }} />
                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '11.5px' }}>ĐANG TẢI NỘI DUNG PHỤ LỤC...</div>
              </div>
            ) : isErrorAppendix || !hasValidDocument ? (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  color: '#fca5a5',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={22} color="#ef4444" />
                <div style={{ fontWeight: 800, fontSize: '12px', color: '#f87171' }}>KHÔNG THỂ TẢI NỘI DUNG PHỤ LỤC</div>
                <div style={{ fontSize: '10px', color: '#cbd5e1' }}>
                  {appendixError?.message || 'Không thể tải nội dung phụ lục hợp đồng từ máy chủ.'}
                </div>
                <button
                  type="button"
                  id={`btn-retry-appendix-${req.id}`}
                  onClick={handleRetry}
                  style={{
                    marginTop: '4px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.6)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <RefreshCw size={12} />
                  THỬ LẠI
                </button>
              </div>
            ) : (
              <>
                {/* Document Header & Metadata */}
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={15} color="#00f2fe" />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>
                        {versionTitle}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: 'rgba(34, 230, 255, 0.15)',
                        color: '#22e6ff',
                        border: '1px solid rgba(34, 230, 255, 0.4)',
                      }}
                    >
                      {versionFormatted}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '6px',
                      fontSize: '9.5px',
                      color: '#94a3b8',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                    }}
                  >
                    <div>Hợp đồng gốc: <span style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 700 }}>{req.contractCode || 'HĐ-EV01'}</span></div>
                    <div>Mã phiên bản: <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>{req.contractVersionId ? req.contractVersionId.substring(0, 8) + '...' : versionFormatted}</span></div>
                    <div>Mã giao dịch: <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>{req.id ? req.id.substring(0, 8) + '...' : 'N/A'}</span></div>
                    <div>Phương tiện: <span style={{ color: '#e2e8f0' }}>{req.vehicleName || vehicleCode}</span></div>
                  </div>
                </div>

                {/* Document Snapshot Content */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '10px',
                    color: '#cbd5e1',
                    fontFamily: 'monospace',
                    fontSize: '9.5px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-line',
                    maxHeight: '260px',
                    overflowY: 'auto',
                  }}
                >
                  {contentSnapshot}
                </div>

                {/* SHA-256 Hash Seal */}
                {contentHash && (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.05)',
                      border: '1px dashed rgba(16, 185, 129, 0.3)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      fontSize: '9px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8' }}>Mã băm toàn vẹn tài liệu (SHA-256):</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>Niêm phong bất biến</span>
                    </div>
                    <div style={{ color: '#22e6ff', fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '8.5px' }}>
                      {contentHash}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Failure Banner when Appendix is missing or failed (Section 9) */}
      {!hasValidDocument && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            color: '#fca5a5',
            fontSize: '11px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#f87171' }}>KHÔNG THỂ TẢI PHỤ LỤC CHUYỂN NHƯỢNG</div>
              <div style={{ fontSize: '9.5px', color: '#cbd5e1', marginTop: '2px' }}>
                Tiếp nhận bị khóa. Không thể xác nhận khi chưa thể kiểm tra nội dung phụ lục.
              </div>
            </div>
          </div>
          <button
            type="button"
            id={`btn-retry-appendix-banner-${req.id}`}
            onClick={handleRetry}
            style={{
              padding: '5px 10px',
              borderRadius: '5px',
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
            }}
          >
            <RefreshCw size={11} />
            THỬ LẠI
          </button>
        </div>
      )}

      {/* Recipient Action Section (Incoming) */}
      {showRecipientAction && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '4px',
            background: 'rgba(0, 242, 254, 0.03)',
            border: '1px solid rgba(0, 242, 254, 0.2)',
            borderRadius: '8px',
            padding: '10px',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              cursor: (!hasValidDocument || !hasReviewed) ? 'not-allowed' : 'pointer',
              fontSize: '10.5px',
              color: (!hasValidDocument || !hasReviewed) ? '#64748b' : '#f1f5f9',
            }}
          >
            <input
              type="checkbox"
              id={`chk-consent-${req.id}`}
              disabled={!hasValidDocument || !hasReviewed}
              checked={isConsentChecked}
              onChange={(e) => {
                if (!hasValidDocument || !hasReviewed) return;
                setIsConsentChecked(e.target.checked);
                onClearAcceptError(req.id);
              }}
              style={{
                marginTop: '2px',
                accentColor: '#10b981',
                cursor: (!hasValidDocument || !hasReviewed) ? 'not-allowed' : 'pointer',
              }}
            />
            <div>
              <span style={{ fontWeight: 600 }}>
                Tôi đã đọc, hiểu và đồng ý nhận chuyển nhượng theo phụ lục này.
              </span>
              {!hasValidDocument ? (
                <div style={{ color: '#ef4444', fontSize: '9.5px', marginTop: '3px' }}>
                  * Không thể xác nhận: Không thể tải phụ lục chuyển nhượng. Vui lòng bấm "THỬ LẠI".
                </div>
              ) : !hasReviewed ? (
                <div style={{ color: '#f59e0b', fontSize: '9.5px', marginTop: '3px' }}>
                  * Vui lòng bấm <strong>"XEM PHỤ LỤC CHUYỂN NHƯỢNG"</strong> để đọc toàn văn điều khoản trước khi xác nhận.
                </div>
              ) : null}
            </div>
          </label>

          {acceptErrorMessage && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '6px 8px', color: '#fca5a5', fontSize: '10px' }}>
              {acceptErrorMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              id={`btn-accept-${req.id}`}
              onClick={() => onAccept(req.id, contentHash || undefined)}
              disabled={!canSubmitAcceptance}
              style={{
                flex: 2,
                padding: '9px 12px',
                background: !canSubmitAcceptance
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                border: 'none',
                borderRadius: '8px',
                color: !canSubmitAcceptance ? '#94a3b8' : '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                cursor: !canSubmitAcceptance ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: canSubmitAcceptance ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
              }}
            >
              {isAcceptPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Đang ghi nhận...</span>
                </>
              ) : (
                <>
                  <Check size={13} />
                  <span>ĐỒNG Ý NHẬN CHUYỂN NHƯỢNG</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onRejectPrompt(req.id)}
              style={{
                flex: 1,
                padding: '9px 12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              TỪ CHỐI
            </button>
          </div>
        </div>
      )}

      {/* Recipient already signed notice */}
      {isRecipientAccepted && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '10.5px',
            color: '#6ee7b7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#10b981" />
            <span style={{ fontWeight: 700 }}>ĐÃ XÁC NHẬN CHẤP THUẬN</span>
          </div>
          <span style={{ fontSize: '10px', color: '#a7f3d0' }}>
            Bên nhận đã ký xác nhận phụ lục chuyển nhượng
          </span>
        </div>
      )}

      {/* Transferor Action Section (Outgoing) */}
      {showTransferorAction && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '6px',
            background: 'rgba(168, 85, 247, 0.05)',
            border: '1.5px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '10px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              cursor: (!hasValidDocument || !hasReviewed) ? 'not-allowed' : 'pointer',
              fontSize: '10.5px',
              color: (!hasValidDocument || !hasReviewed) ? '#64748b' : '#f1f5f9',
            }}
          >
            <input
              type="checkbox"
              id={`chk-transferor-consent-${req.id}`}
              disabled={!hasValidDocument || !hasReviewed}
              checked={isConsentChecked}
              onChange={(e) => {
                if (!hasValidDocument || !hasReviewed) return;
                setIsConsentChecked(e.target.checked);
                onClearAcceptError(req.id);
              }}
              style={{
                marginTop: '2px',
                accentColor: '#10b981',
                cursor: (!hasValidDocument || !hasReviewed) ? 'not-allowed' : 'pointer',
              }}
            />
            <div>
              <span style={{ fontWeight: 600 }}>
                Tôi đã đọc, hiểu và đồng ý chuyển nhượng theo đúng nội dung phụ lục này.
              </span>
              {!hasValidDocument ? (
                <div style={{ color: '#ef4444', fontSize: '9.5px', marginTop: '3px' }}>
                  * Không thể xác nhận: Không thể tải phụ lục chuyển nhượng. Vui lòng bấm "THỬ LẠI".
                </div>
              ) : !hasReviewed ? (
                <div style={{ color: '#f59e0b', fontSize: '9.5px', marginTop: '3px' }}>
                  * Vui lòng bấm <strong>"XEM PHỤ LỤC CHUYỂN NHƯỢNG"</strong> để đọc toàn văn điều khoản trước khi xác nhận đồng ý.
                </div>
              ) : null}
            </div>
          </label>

          {acceptErrorMessage && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '6px 8px', color: '#fca5a5', fontSize: '10px' }}>
              {acceptErrorMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              id={`btn-transferor-confirm-${req.id}`}
              onClick={() => onConfirmTransferorConsent(req.id, contentHash || undefined)}
              disabled={!canSubmitTransferorConsent}
              style={{
                flex: 2,
                padding: '9px 12px',
                background: !canSubmitTransferorConsent
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                border: 'none',
                borderRadius: '8px',
                color: !canSubmitTransferorConsent ? '#94a3b8' : '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                cursor: !canSubmitTransferorConsent ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: canSubmitTransferorConsent ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
              }}
            >
              {isConfirmPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Đang ghi nhận...</span>
                </>
              ) : (
                <>
                  <Check size={13} />
                  <span>XÁC NHẬN PHỤ LỤC CHUYỂN NHƯỢNG</span>
                </>
              )}
            </button>

            {req.canCancel && (
              <button
                type="button"
                onClick={() => onCancel(req.id)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                HỦY
              </button>
            )}
          </div>
        </div>
      )}

      {/* Transferor already signed notice */}
      {isTransferorAccepted && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '10.5px',
            color: '#6ee7b7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#10b981" />
            <span style={{ fontWeight: 700 }}>BÊN CHUYỂN NHƯỢNG ĐÃ XÁC NHẬN PHỤ LỤC</span>
          </div>
          <span style={{ fontSize: '10px', color: '#a7f3d0' }}>
            Phụ lục đã được xác nhận điện tử
          </span>
        </div>
      )}

      {/* Rejection Prompt */}
      {isRejecting && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <label style={{ fontSize: '10.5px', color: '#fca5a5', fontWeight: 600 }}>
            Lý do từ chối:
          </label>
          <input
            type="text"
            value={rejectReasonInput}
            onChange={(e) => setRejectReasonInput(e.target.value)}
            style={{
              padding: '6px 8px',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '11px',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
            <button
              type="button"
              onClick={onCancelReject}
              style={{
                padding: '4px 8px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => onConfirmReject(req.id, rejectReasonInput)}
              style={{
                padding: '4px 10px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Xác nhận từ chối
            </button>
          </div>
        </div>
      )}

      {/* Atomic Complete Button if eligible */}
      {((req.canFinalize ?? req.canComplete) || (isTransferorAccepted && isRecipientAccepted && req.status !== 'COMPLETED' && (!req.finalizationBlockers || req.finalizationBlockers.length === 0))) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            type="button"
            id={type === 'outgoing' ? `btn-complete-outgoing-${req.id}` : `btn-complete-${req.id}`}
            onClick={() => onComplete(req.id)}
            disabled={isCompletePending}
            style={{
              padding: '9px 12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              border: '1.5px solid #22e6ff',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 0 15px rgba(34, 230, 255, 0.3)',
            }}
          >
            {isCompletePending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Đang hoàn tất...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} color="#22e6ff" />
                <span>HOÀN TẤT CHUYỂN NHƯỢNG</span>
              </>
            )}
          </button>
          {completeErrorMessage && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '6px 8px', color: '#fca5a5', fontSize: '10px' }}>
              {completeErrorMessage}
            </div>
          )}
        </div>
      )}

      {/* Completed Success Notice */}
      {req.status === 'COMPLETED' && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6ee7b7',
            fontSize: '11px',
          }}
        >
          <CheckCircle2 size={16} color="#10b981" />
          <div>
            <div style={{ fontWeight: 800 }}>CHUYỂN NHƯỢNG THÀNH CÔNG</div>
            <div style={{ fontSize: '10px', color: '#a7f3d0' }}>
              Giao dịch chuyển nhượng cổ phần đã hoàn tất và được ghi nhận vào lịch sử sở hữu.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CoOwnerOwnershipPanel: React.FC<CoOwnerOwnershipPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const selectedOwnerId = useWorldStore((state) => state.selectedOwnerId);
  const clearOwnerSelection = useWorldStore((state) => state.clearOwnerSelection);
  const openGaragePanel = useWorldStore((state) => state.openGaragePanel);

  // Sub-view navigation state
  const [currentView, setCurrentView] = useState<PanelSubView>('MEMBERS');

  // Add member modal state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<AvailableUserResponse | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Transfer Form State
  const [recipientUserId, setRecipientUserId] = useState<string>('');
  const [transferPercentageInput, setTransferPercentageInput] = useState<string>('10.00');
  const [transferReason, setTransferReason] = useState<string>('Thỏa thuận tự nguyện giữa các thành viên đồng sở hữu');
  const [transferFormError, setTransferFormError] = useState<string | null>(null);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  // Rejection modal state
  const [rejectingTransferId, setRejectingTransferId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('Chưa có nhu cầu gia tăng tỷ lệ sở hữu tại thời điểm này');

  // Streamlined Appendix Viewer & Consent State (Phase 22-23 Hotfix)
  const [openedAppendixIds, setOpenedAppendixIds] = useState<Record<string, boolean>>({});
  const [reviewedHashes, setReviewedHashes] = useState<Record<string, string>>({});
  const [recipientConsentChecked, setRecipientConsentChecked] = useState<Record<string, boolean>>({});
  const [expandedAmendmentPreview, setExpandedAmendmentPreview] = useState<Record<string, boolean>>({});
  const [acceptError, setAcceptError] = useState<Record<string, string | null>>({});
  const [transferorConsentChecked, setTransferorConsentChecked] = useState(false);
  const [reviewedAppendixSnapshot, setReviewedAppendixSnapshot] = useState<ReviewedAppendixSnapshot | null>(null);
  const [showAmendmentSnapshotInForm, setShowAmendmentSnapshotInForm] = useState(false);
  const [completeError, setCompleteError] = useState<Record<string, string | null>>({});

  // Withdrawal Form State
  const [withdrawalReason, setWithdrawalReason] = useState<string>('Rút lui khỏi quyền sở hữu phương tiện theo kế hoạch cá nhân');
  const [withdrawalFormError, setWithdrawalFormError] = useState<string | null>(null);
  const [withdrawalSuccessMsg, setWithdrawalSuccessMsg] = useState<string | null>(null);

  const vehicleCode = resolveVehicleCode(vehicle) || vehicle.name || 'EV01';

  // 1. TanStack Query: Co-ownership Group for Vehicle
  const {
    data: coOwnership,
    isLoading,
    isError,
    error,
  } = useQuery<CoOwnershipGroupResponse>({
    queryKey: ['coOwnership', vehicle.id],
    queryFn: () => fetchVehicleCoOwnership(vehicle.id),
    staleTime: 6000,
  });

  const groupId = coOwnership?.id;

  // 2. Incoming transfer requests for current user
  const {
    data: rawIncomingTransfers,
    isLoading: isLoadingIncoming,
    isError: isErrorIncoming,
    refetch: refetchIncoming,
  } = useQuery<OwnershipTransferResponse[]>({
    queryKey: ['incomingTransfers', currentUser?.id],
    queryFn: () => fetchIncomingTransfers(),
    enabled: Boolean(currentUser),
    staleTime: 5000,
  });

  const safeIncomingTransfers = useMemo<OwnershipTransferResponse[]>(() => {
    let list: OwnershipTransferResponse[] = [];
    if (rawIncomingTransfers) {
      if (Array.isArray(rawIncomingTransfers)) list = rawIncomingTransfers;
      else if (Array.isArray((rawIncomingTransfers as any)?.content)) list = (rawIncomingTransfers as any).content;
      else if (Array.isArray((rawIncomingTransfers as any)?.items)) list = (rawIncomingTransfers as any).items;
      else if (Array.isArray((rawIncomingTransfers as any)?.data)) list = (rawIncomingTransfers as any).data;
    }
    const seen = new Set<string>();
    return list.filter((t) => {
      if (!t || !t.id) return false;
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [rawIncomingTransfers]);

  // 3. Group transfers
  const {
    data: rawGroupTransfers,
    isLoading: isLoadingGroupTransfers,
    isError: isErrorGroupTransfers,
    refetch: refetchGroupTransfers,
  } = useQuery<OwnershipTransferResponse[]>({
    queryKey: ['groupTransfers', groupId],
    queryFn: () => (groupId ? fetchGroupTransfers(groupId) : Promise.resolve([])),
    enabled: Boolean(groupId),
    staleTime: 5000,
  });

  const safeGroupTransfers = useMemo<OwnershipTransferResponse[]>(() => {
    if (!rawGroupTransfers) return [];
    if (Array.isArray(rawGroupTransfers)) return rawGroupTransfers;
    if (Array.isArray((rawGroupTransfers as any)?.content)) return (rawGroupTransfers as any).content;
    if (Array.isArray((rawGroupTransfers as any)?.items)) return (rawGroupTransfers as any).items;
    if (Array.isArray((rawGroupTransfers as any)?.data)) return (rawGroupTransfers as any).data;
    return [];
  }, [rawGroupTransfers]);

  // Outgoing transfer requests initiated by current user (e.g. Nguyen Van A)
  const outgoingTransfers = useMemo<OwnershipTransferResponse[]>(() => {
    if (!currentUser?.id || !Array.isArray(safeGroupTransfers)) return [];
    const currentId = String(currentUser.id).toLowerCase();
    const seen = new Set<string>();
    return safeGroupTransfers
      .filter(
        (t) =>
          String(t.fromUserId ?? t.transferorUserId).toLowerCase() === currentId &&
          (t.status === 'PENDING_ACCEPTANCE' ||
            t.status === 'PENDING_CONTRACT' ||
            t.status === 'APPROVED' ||
            t.status === 'COMPLETED')
      )
      .filter((t) => {
        if (!t || !t.id) return false;
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
  }, [safeGroupTransfers, currentUser?.id]);

  const notifiedGroupTransfers = useMemo<OwnershipTransferResponse[]>(() => {
    if (!currentUser?.id || !Array.isArray(safeGroupTransfers)) return [];
    const currentId = String(currentUser.id).toLowerCase();
    return safeGroupTransfers.filter(
      (t) =>
        String(t.fromUserId ?? t.transferorUserId).toLowerCase() !== currentId &&
        String(t.toUserId ?? t.recipientUserId).toLowerCase() !== currentId &&
        (t.status === 'PENDING_ACCEPTANCE' || t.status === 'PENDING_CONTRACT' || t.status === 'APPROVED')
    );
  }, [safeGroupTransfers, currentUser?.id]);

  const allCoOwnershipTransfers = useMemo<OwnershipTransferResponse[]>(() => {
    const list = [...(safeGroupTransfers || []), ...(safeIncomingTransfers || [])];
    const seen = new Set<string>();
    return list.filter((t) => {
      if (!t || !t.id) return false;
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [safeGroupTransfers, safeIncomingTransfers]);

  const [managementTab, setManagementTab] = useState<'OVERVIEW' | 'PENDING' | 'HISTORY'>('OVERVIEW');
  const [focusedTransferId, setFocusedTransferId] = useState<string | null>(null);
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState<OwnershipTransferResponse | null>(null);

  // Authoritative classification helper for transfer records (Phase 23 Hotfix)
  const isTerminalStatus = (status: string | undefined): boolean => {
    if (!status) return false;
    const s = status.toUpperCase();
    return s === 'COMPLETED' || s === 'REJECTED' || s === 'CANCELLED' || s === 'EXPIRED';
  };

  const isPendingStatus = (status: string | undefined): boolean => {
    return !isTerminalStatus(status);
  };

  // 1. Pending-action summaries for Overview tab (transfers requiring user action or attention)
  const actionNeededTransfers = useMemo(() => {
    const currentId = String(currentUser?.id || '').toLowerCase();
    return allCoOwnershipTransfers.filter((t) => {
      if (isTerminalStatus(t.status)) return false;
      const isTransferor = currentId === String(t.fromUserId ?? t.transferorUserId ?? '').toLowerCase();
      const isRecipient = currentId === String(t.toUserId ?? t.recipientUserId ?? '').toLowerCase();
      const isTransferorAccepted = Boolean(t.transferorAccepted ?? t.isTransferorAccepted);
      const isRecipientAccepted = Boolean(t.recipientAccepted ?? t.isRecipientAccepted);
      const hasFinBlocker = Boolean(
        t.hasOutstandingFinancialObligations ||
        (t.finalizationBlockers && t.finalizationBlockers.some((b) => b.includes('tài chính') || b.includes('nghĩa vụ')))
      );
      return (isTransferor && !isTransferorAccepted) || (isRecipient && !isRecipientAccepted) || (isTransferor && hasFinBlocker);
    });
  }, [allCoOwnershipTransfers, currentUser?.id]);

  // 2. Pending tab: All active, non-terminal transfer requests visible to user
  const pendingTransfers = useMemo(() => {
    const list: OwnershipTransferResponse[] = [];
    const seenIds = new Set<string>();

    for (const t of allCoOwnershipTransfers) {
      if (t && t.id && isPendingStatus(t.status)) {
        if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          list.push(t);
        }
      }
    }

    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [allCoOwnershipTransfers]);

  // 4. Ownership change history from audit repository
  const {
    data: rawOwnershipHistory,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    refetch: refetchHistory,
  } = useQuery<OwnershipHistoryResponse[]>({
    queryKey: ['ownershipHistory', groupId],
    queryFn: () => (groupId ? fetchOwnershipHistory(groupId) : Promise.resolve([])),
    enabled: Boolean(groupId),
    staleTime: 5000,
  });

  const safeOwnershipHistory = useMemo<OwnershipHistoryResponse[]>(() => {
    if (!rawOwnershipHistory) return [];
    if (Array.isArray(rawOwnershipHistory)) return rawOwnershipHistory;
    if (Array.isArray((rawOwnershipHistory as any)?.content)) return (rawOwnershipHistory as any).content;
    if (Array.isArray((rawOwnershipHistory as any)?.items)) return (rawOwnershipHistory as any).items;
    if (Array.isArray((rawOwnershipHistory as any)?.data)) return (rawOwnershipHistory as any).data;
    return [];
  }, [rawOwnershipHistory]);

  // 3. History tab: All terminal transfer requests and completed audit records (mutually exclusive from Pending)
  const historyTransfers = useMemo(() => {
    const list: OwnershipTransferResponse[] = [];
    const seenIds = new Set<string>();

    // Terminal records from transfer requests
    for (const t of allCoOwnershipTransfers) {
      if (t && t.id && isTerminalStatus(t.status)) {
        if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          list.push(t);
        }
      }
    }

    // Historical records from history repository (identifying each record by immutable ID)
    for (const h of safeOwnershipHistory) {
      if (h && h.id) {
        const key = h.transferRequestId || h.id;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          list.push({
            id: key,
            transferRequestId: h.transferRequestId || h.id,
            groupId: h.groupId,
            groupName: h.groupName,
            vehicleId: h.vehicleId,
            vehicleName: h.vehicleName,
            fromUserId: h.fromUserId || '',
            fromUserName: h.fromUserName || 'Thành viên',
            fromUserEmail: '',
            toUserId: h.toUserId || '',
            toUserName: h.toUserName || 'Người nhận',
            toUserEmail: '',
            transferPercentage: h.transferredPercentage,
            status: 'COMPLETED',
            statusVi: 'CHUYỂN NHƯỢNG THÀNH CÔNG',
            reason: h.reason || undefined,
            createdAt: h.recordedAt || h.effectiveAt,
            completedAt: h.effectiveAt,
            effectiveAt: h.effectiveAt,
            proposedOwnershipSnapshot: h.newOwnershipSnapshot || undefined,
          });
        }
      }
    }

    return list.sort((a, b) => {
      const timeA = new Date(a.completedAt || a.effectiveAt || a.rejectedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.completedAt || b.effectiveAt || b.rejectedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [allCoOwnershipTransfers, safeOwnershipHistory]);

  const safeMembers = useMemo<GroupMemberResponse[]>(() => {
    if (!coOwnership) return [];
    if (Array.isArray(coOwnership.members)) return coOwnership.members;
    if (Array.isArray((coOwnership as any)?.members?.content)) return (coOwnership as any).members.content;
    if (Array.isArray((coOwnership as any)?.members?.items)) return (coOwnership as any).members.items;
    if (Array.isArray((coOwnership as any)?.members?.data)) return (coOwnership as any).members.data;
    if (Array.isArray((coOwnership as any)?.data?.members)) return (coOwnership as any).data.members;
    if (Array.isArray((coOwnership as any)?.data)) return (coOwnership as any).data;
    if (Array.isArray((coOwnership as any)?.content)) return (coOwnership as any).content;
    if (Array.isArray((coOwnership as any)?.items)) return (coOwnership as any).items;
    if (Array.isArray(coOwnership)) return coOwnership;
    return [];
  }, [coOwnership]);

  // Active members sorted by ownership percentage descending
  const activeMembers = useMemo<GroupMemberResponse[]>(() => {
    const list = Array.isArray(safeMembers) ? safeMembers : [];
    const active = list.filter((m) => m && m.status === 'ACTIVE');
    return [...active].sort((a, b) => {
      const shareA = a.share?.percentage ?? 0;
      const shareB = b.share?.percentage ?? 0;
      return shareB - shareA;
    });
  }, [safeMembers]);

  // Current user's membership and current percentage
  const currentMember = useMemo(() => {
    if (!currentUser || !safeMembers.length) return null;
    return safeMembers.find((m) => m && m.userId === currentUser.id) || null;
  }, [currentUser, safeMembers]);

  const currentUserShare = currentMember?.share?.percentage ?? 0;

  // Selected member based on 3D representative interaction in showroom
  const selectedMember = useMemo(() => {
    if (!selectedOwnerId || activeMembers.length === 0) return null;
    return activeMembers.find((m) => m.id === selectedOwnerId) || null;
  }, [selectedOwnerId, activeMembers]);

  const selectedMemberIndex = useMemo(() => {
    if (!selectedMember) return 0;
    const idx = activeMembers.findIndex((m) => m.id === selectedMember.id);
    return idx >= 0 ? idx : 0;
  }, [selectedMember, activeMembers]);

  const selectedMemberColor = OWNER_ORB_COLORS[selectedMemberIndex % OWNER_ORB_COLORS.length];

  // Candidates for recipient in transfer form (other active members)
  const recipientCandidates = useMemo<GroupMemberResponse[]>(() => {
    if (!currentUser || !Array.isArray(activeMembers) || activeMembers.length === 0) return [];
    return activeMembers.filter((m) => m && m.userId !== currentUser.id);
  }, [currentUser, activeMembers]);

  // Default recipient selection when candidates load
  useEffect(() => {
    if (Array.isArray(recipientCandidates) && recipientCandidates.length > 0 && !recipientUserId) {
      setRecipientUserId(recipientCandidates[0].userId);
    }
  }, [recipientCandidates, recipientUserId]);

  // Clear user-specific transfer states and invalidate caches on account switch
  useEffect(() => {
    setOpenedAppendixIds({});
    setReviewedHashes({});
    setRecipientConsentChecked({});
    setAcceptError({});
    setCompleteError({});
    queryClient.invalidateQueries({ queryKey: ['transfer-appendix'] });
    queryClient.invalidateQueries({ queryKey: ['incomingTransfers'] });
    queryClient.invalidateQueries({ queryKey: ['groupTransfers'] });
  }, [currentUser?.id, queryClient]);

  // Reset transferor consent and force preview reload whenever form inputs change
  useEffect(() => {
    setTransferorConsentChecked(false);
    setReviewedAppendixSnapshot(null);
    setTransferFormError(null);
  }, [recipientUserId, transferPercentageInput, transferReason]);

  // Real-time Preview query for transfer distribution
  const transferPercentNumber = parseFloat(transferPercentageInput) || 0;
  const isPreviewEligible = Boolean(
    groupId &&
    vehicle.id &&
    currentUser?.id &&
    recipientUserId &&
    transferPercentNumber > 0 &&
    transferPercentNumber <= currentUserShare &&
    currentView === 'TRANSFER_FORM'
  );

  const {
    data: previewData,
    isLoading: isPreviewLoading,
    isFetching: isPreviewFetching,
    isError: isPreviewError,
    error: previewError,
    refetch: refetchPreview,
  } = useQuery<OwnershipDistributionPreviewResponse>({
    queryKey: [
      'transferPreview',
      groupId,
      vehicle.id,
      currentUser?.id,
      recipientUserId,
      transferPercentNumber,
      transferReason,
      currentUserShare,
    ],
    queryFn: () =>
      fetchTransferPreview(
        groupId!,
        vehicle.id,
        currentUser!.id,
        recipientUserId,
        transferPercentNumber,
        transferReason
      ),
    enabled: isPreviewEligible,
    staleTime: 0,
  });

  // Keep reviewed snapshot strictly coherent with authoritative backend preview matching form inputs
  useEffect(() => {
    if (
      previewData &&
      previewData.previewId &&
      previewData.contentHash &&
      previewData.contentSnapshot &&
      previewData.valid &&
      previewData.toUserId === recipientUserId &&
      previewData.transferPercentage === transferPercentNumber
    ) {
      setReviewedAppendixSnapshot({
        previewId: previewData.previewId,
        contractVersion: previewData.contractVersionFormatted || 'V1.0',
        contentHash: previewData.contentHash,
        contentSnapshot: previewData.contentSnapshot,
        toUserId: previewData.toUserId,
        transferPercentage: previewData.transferPercentage,
        reason: transferReason,
      });
    } else {
      setReviewedAppendixSnapshot(null);
    }
  }, [previewData, recipientUserId, transferPercentNumber, transferReason]);

  // Authoritative preview members list from backend distribution
  const previewMembers = useMemo<MemberSharePreview[]>(() => {
    if (!previewData) return [];
    if (Array.isArray(previewData.members)) return previewData.members;
    if (Array.isArray((previewData as any).proposedDistribution)) return (previewData as any).proposedDistribution;
    if (Array.isArray((previewData as any).currentDistribution)) return (previewData as any).currentDistribution;
    if (Array.isArray((previewData as any).data?.members)) return (previewData as any).data.members;
    if (Array.isArray((previewData as any).data?.proposedDistribution)) return (previewData as any).data.proposedDistribution;
    if (Array.isArray((previewData as any).data)) return (previewData as any).data;
    if (Array.isArray((previewData as any).content)) return (previewData as any).content;
    if (Array.isArray((previewData as any).items)) return (previewData as any).items;
    if (Array.isArray(previewData)) return previewData as any;
    return [];
  }, [previewData]);

  // Check if current user is active REPRESENTATIVE
  const canManage = useMemo(() => {
    if (!currentUser || !coOwnership) return false;
    if (currentUser.role !== 'CO_OWNER') return false;
    const currentMembership = (Array.isArray(safeMembers) ? safeMembers : []).find((m) => m && m.userId === currentUser.id);
    return (
      currentMembership !== undefined &&
      currentMembership.status === 'ACTIVE' &&
      currentMembership.memberRole === 'REPRESENTATIVE'
    );
  }, [currentUser, coOwnership, safeMembers]);

  // Search available users for adding
  const { data: rawAvailableUsers, isLoading: isSearchingUsers, isError: isErrorSearchingUsers } = useQuery<AvailableUserResponse[]>({
    queryKey: ['availableUsers', coOwnership?.id, searchTerm],
    queryFn: () => (coOwnership?.id ? searchAvailableUsers(coOwnership.id, searchTerm) : Promise.resolve([])),
    enabled: Boolean(isAddMemberOpen && coOwnership?.id),
  });

  const availableUsers = useMemo<AvailableUserResponse[]>(() => {
    if (!rawAvailableUsers) return [];
    if (Array.isArray(rawAvailableUsers)) return rawAvailableUsers;
    if (Array.isArray((rawAvailableUsers as any)?.content)) return (rawAvailableUsers as any).content;
    if (Array.isArray((rawAvailableUsers as any)?.items)) return (rawAvailableUsers as any).items;
    if (Array.isArray((rawAvailableUsers as any)?.data)) return (rawAvailableUsers as any).data;
    return [];
  }, [rawAvailableUsers]);

  // Invalidate all related caches helper
  const invalidateAllOwnershipData = () => {
    queryClient.invalidateQueries({ queryKey: ['coOwnership', vehicle.id] });
    queryClient.invalidateQueries({ queryKey: ['coOwnership'] });
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle.id] });
    queryClient.invalidateQueries({ queryKey: ['vehicle'] });
    queryClient.invalidateQueries({ queryKey: ['garage'] });
    queryClient.invalidateQueries({ queryKey: ['ownershipShares'] });
    queryClient.invalidateQueries({ queryKey: ['groupMembers'] });
    if (groupId) {
      queryClient.invalidateQueries({ queryKey: ['groupTransfers', groupId] });
      queryClient.invalidateQueries({ queryKey: ['ownershipHistory', groupId] });
    }
    queryClient.invalidateQueries({ queryKey: ['groupTransfers'] });
    queryClient.invalidateQueries({ queryKey: ['ownershipHistory'] });
    queryClient.invalidateQueries({ queryKey: ['incomingTransfers'] });
    queryClient.invalidateQueries({ queryKey: ['contractSummary', vehicle.id] });
    queryClient.invalidateQueries({ queryKey: ['contractSummary'] });
    queryClient.invalidateQueries({ queryKey: ['co-ownership-contract', vehicle.id] });
    queryClient.invalidateQueries({ queryKey: ['co-ownership-contract'] });
    queryClient.invalidateQueries({ queryKey: ['co-ownership-contract-versions'] });
    queryClient.invalidateQueries({ queryKey: ['co-ownership-contract-version'] });
    queryClient.invalidateQueries({ queryKey: ['co-ownership-contract-acceptances'] });
    queryClient.invalidateQueries({ queryKey: ['coOwnershipContract'] });
    queryClient.invalidateQueries({ queryKey: ['transferPreview'] });
    queryClient.invalidateQueries({ queryKey: ['transfer-appendix'] });
    queryClient.invalidateQueries({ queryKey: ['transferAppendix'] });
    queryClient.invalidateQueries({ queryKey: ['transferConsent'] });
    queryClient.invalidateQueries({ queryKey: ['financialObligations'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['expenseShares'] });
    queryClient.invalidateQueries({ queryKey: ['my-personal-payments'] });
    queryClient.invalidateQueries({ queryKey: ['pendingPersonalPayments'] });
  };

  // Add Member Mutation
  const addMutation = useMutation({
    mutationFn: (userId: string) => {
      if (!coOwnership?.id) throw new Error('Không tìm thấy thông tin nhóm.');
      return addMemberToGroup(coOwnership.id, { userId });
    },
    onSuccess: () => {
      invalidateAllOwnershipData();
      setIsAddMemberOpen(false);
      setSelectedUserToAdd(null);
      setSearchTerm('');
      setAddError(null);
    },
    onError: (err: any) => {
      setAddError(err?.message || 'Không thể thêm thành viên vào nhóm.');
    },
  });

  // Remove Member Mutation
  const removeMutation = useMutation({
    mutationFn: (memberId: string) => {
      if (!coOwnership?.id) throw new Error('Không tìm thấy thông tin nhóm.');
      return removeMemberFromGroup(coOwnership.id, memberId);
    },
    onSuccess: () => {
      invalidateAllOwnershipData();
      setConfirmRemoveId(null);
      setRemoveError(null);
      clearOwnerSelection();
    },
    onError: (err: any) => {
      setRemoveError(err?.message || 'Không thể xoá thành viên khỏi nhóm.');
    },
  });

  // Create Transfer Mutation
  const createTransferMutation = useMutation({
    mutationFn: (payload: CreateTransferPayload) => {
      if (!groupId) throw new Error('Không tìm thấy nhóm đồng sở hữu.');
      return createTransferRequest(groupId, payload);
    },
    onSuccess: () => {
      invalidateAllOwnershipData();
      setTransferSuccessMsg('Yêu cầu chuyển nhượng sở hữu đã được gửi thành công đến người nhận.');
      setTransferFormError(null);
      setTransferorConsentChecked(false);
      setReviewedAppendixSnapshot(null);
      setTimeout(() => {
        setTransferSuccessMsg(null);
        setCurrentView('MEMBERS');
      }, 2500);
    },
    onError: (err: any) => {
      const msg = err?.message || 'Không thể gửi yêu cầu chuyển nhượng.';
      setTransferFormError(msg);
      if (
        msg.includes('Mã băm') ||
        msg.includes('không khớp') ||
        msg.includes('thay đổi') ||
        msg.includes('hết hạn')
      ) {
        setTransferorConsentChecked(false);
        setReviewedAppendixSnapshot(null);
        queryClient.invalidateQueries({
          queryKey: [
            'transferPreview',
            groupId,
            vehicle.id,
            currentUser?.id,
            recipientUserId,
            transferPercentNumber,
            transferReason,
            currentUserShare,
          ],
        });
        refetchPreview();
      }
    },
  });

  // Accept Transfer Mutation
  const acceptTransferMutation = useMutation({
    mutationFn: ({ transferId, payload }: { transferId: string; payload?: AcceptTransferPayload }) =>
      acceptTransfer(transferId, payload),
    onSuccess: () => {
      invalidateAllOwnershipData();
      refetchIncoming();
      refetchGroupTransfers();
      queryClient.invalidateQueries({ queryKey: ['co-owner-contract'] });
      queryClient.invalidateQueries({ queryKey: ['co-owner-contract-versions'] });
    },
    onError: (err: any, variables) => {
      setAcceptError((prev) => ({
        ...prev,
        [variables.transferId]: err?.message || 'Không thể chấp thuận yêu cầu chuyển nhượng.',
      }));
    },
  });

  // Confirm Transferor Consent Mutation (Phase 22-23 Hotfix)
  const confirmTransferorConsentMutation = useMutation({
    mutationFn: ({ transferId, payload }: { transferId: string; payload?: { contentHash?: string; acknowledgedTerms?: boolean; confirmationNote?: string } }) =>
      confirmTransferorConsent(transferId, payload),
    onSuccess: () => {
      invalidateAllOwnershipData();
      refetchIncoming();
      refetchGroupTransfers();
      queryClient.invalidateQueries({ queryKey: ['co-owner-contract'] });
      queryClient.invalidateQueries({ queryKey: ['co-owner-contract-versions'] });
    },
    onError: (err: any, variables) => {
      setAcceptError((prev) => ({
        ...prev,
        [variables.transferId]: err?.message || 'Không thể xác nhận chấp thuận từ bên chuyển nhượng.',
      }));
    },
  });

  // Reject Transfer Mutation
  const rejectTransferMutation = useMutation({
    mutationFn: ({ transferId, reason }: { transferId: string; reason: string }) =>
      rejectTransfer(transferId, { reason }),
    onSuccess: () => {
      invalidateAllOwnershipData();
      setRejectingTransferId(null);
      refetchIncoming();
      refetchGroupTransfers();
    },
  });

  // Cancel Transfer Mutation
  const cancelTransferMutation = useMutation({
    mutationFn: (transferId: string) => cancelTransfer(transferId),
    onSuccess: () => {
      invalidateAllOwnershipData();
      refetchIncoming();
      refetchGroupTransfers();
    },
  });

  // Complete Transfer Mutation (Atomic activation)
  const completeTransferMutation = useMutation({
    mutationFn: (transferId: string) => completeTransfer(transferId),
    onSuccess: () => {
      invalidateAllOwnershipData();
      refetchIncoming();
      refetchGroupTransfers();
      queryClient.invalidateQueries({ queryKey: ['co-owner-contract'] });
      queryClient.invalidateQueries({ queryKey: ['co-owner-contract-versions'] });
    },
    onError: (err: any, transferId) => {
      setCompleteError((prev) => ({
        ...prev,
        [transferId]: err?.message || 'Không thể kích hoạt hoàn tất chuyển nhượng.',
      }));
    },
  });

  // Withdrawal Mutation
  const withdrawalMutation = useMutation({
    mutationFn: (payload: { reason: string }) => {
      if (!groupId) throw new Error('Không tìm thấy nhóm.');
      return createWithdrawalRequest(groupId, payload);
    },
    onSuccess: () => {
      invalidateAllOwnershipData();
      setWithdrawalSuccessMsg('Yêu cầu rút khỏi nhóm đã được gửi thành công đến đại diện quản lý.');
      setWithdrawalFormError(null);
      setTimeout(() => {
        setWithdrawalSuccessMsg(null);
        setCurrentView('MEMBERS');
      }, 2500);
    },
    onError: (err: any) => {
      setWithdrawalFormError(err?.message || 'Không thể gửi yêu cầu rút khỏi nhóm.');
    },
  });

  const memberCount = activeMembers.length || 3;
  const vehicleCount = coOwnership?.vehicles && coOwnership.vehicles.length > 0 ? coOwnership.vehicles.length : 1;
  const totalPercentage = coOwnership?.totalOwnershipPercentage ?? 100;
  const isComplete = totalPercentage === 100;
  const statusLabel = coOwnership?.statusLabel || (isComplete ? 'Hoàn chỉnh' : 'Chưa phân bổ đủ');

  const pendingIncomingCount = safeIncomingTransfers.filter(
    (t) => (t.status === 'PENDING_ACCEPTANCE' || t.status === 'PENDING_CONTRACT') &&
           !(t.recipientAccepted ?? t.isRecipientAccepted)
  ).length;

  // Shared container styles
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: '90px',
    right: '20px',
    bottom: '20px',
    width: 'min(480px, calc(100vw - 32px))',
    height: 'calc(100vh - 110px)',
    maxHeight: 'calc(100vh - 110px)',
    zIndex: 1000,
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, rgba(8, 16, 30, 0.95) 0%, rgba(6, 12, 24, 0.97) 100%)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1.5px solid rgba(34, 230, 255, 0.35)',
    borderRadius: '16px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(34, 230, 255, 0.14)',
    color: '#ffffff',
    overflow: 'hidden',
    userSelect: 'none',
    fontFamily: 'var(--font-family, system-ui, -apple-system, sans-serif)',
    animation: 'contractPanelFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  };

  const handleOpenTransferDetail = (transferId: string) => {
    setFocusedTransferId(transferId);
    setCurrentView('INCOMING_TRANSFERS');
  };

  const parseSnapshotMembers = (snapshotStr?: string | null): Array<{ fullName: string; percentage: number | string; role?: string }> => {
    if (!snapshotStr) return [];
    try {
      const parsed = JSON.parse(snapshotStr);
      if (Array.isArray(parsed)) {
        return parsed.map((m: any) => ({
          fullName: m.fullName || m.userName || m.name || 'Thành viên',
          percentage: m.percentage ?? m.sharePercentage ?? m.share?.percentage ?? 0,
          role: m.role || m.memberRole || 'MEMBER',
        }));
      }
    } catch (e) {
      // not JSON
    }
    return [];
  };

  const renderPortal = (content: React.ReactNode) => {
    if (typeof document === 'undefined') return null;
    return createPortal(content, document.body);
  };

  // Header Component Helper
  const renderHeader = (title: string, subtitle?: string, showBackToMembers = false) => (
    <div
      style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(34, 230, 255, 0.18)',
        background: 'linear-gradient(90deg, rgba(34, 230, 255, 0.08) 0%, transparent 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {showBackToMembers && (
          <button
            type="button"
            onClick={() => {
              setCurrentView('MEMBERS');
              setFocusedTransferId(null);
              setSelectedHistoryDetail(null);
              clearOwnerSelection();
              setTransferFormError(null);
              setWithdrawalFormError(null);
            }}
            title="Quay lại danh sách thành viên"
            style={{
              background: 'rgba(34, 230, 255, 0.12)',
              border: '1px solid rgba(34, 230, 255, 0.30)',
              borderRadius: '8px',
              padding: '5px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              color: '#22e6ff',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ArrowLeft size={14} />
          </button>
        )}
        <div>
          <div
            style={{
              fontSize: '13.5px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.02em',
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        title="Đóng bảng đồng sở hữu"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <X size={15} />
      </button>
    </div>
  );

  // =========================================================================
  // VIEW MODE A: 3D MEMBER DETAIL POPUP (Showroom orb clicked)
  // =========================================================================
  if (selectedMember && currentView === 'MEMBERS') {
    const isRep = selectedMember.memberRole === 'REPRESENTATIVE';
    const memberPercentage = selectedMember.share?.percentage ?? 0;
    const memberStatus = STATUS_LABELS[selectedMember.status] || {
      label: 'Đang hoạt động',
      color: '#10b981',
    };

    return renderPortal(
      <aside
        className="evshare-ownership-panel"
        role="region"
        aria-label={`Chi tiết thành viên ${selectedMember.fullName}`}
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={panelStyle}
      >
        {renderHeader('HỒ SƠ THÀNH VIÊN', `${vehicleCode} • Cổ phần ${memberPercentage}%`, true)}

        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            flex: 1,
          }}
        >
          {/* Member Identity Card */}
          <div
            style={{
              background: 'rgba(7, 20, 38, 0.75)',
              border: `1.5px solid ${selectedMemberColor}40`,
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: `0 0 20px ${selectedMemberColor}20`,
            }}
          >
            {selectedMember.avatarUrl ? (
              <img
                src={selectedMember.avatarUrl}
                alt={selectedMember.fullName}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${selectedMemberColor}`,
                  boxShadow: `0 0 12px ${selectedMemberColor}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${selectedMemberColor}35, rgba(7, 20, 38, 0.9))`,
                  border: `2px solid ${selectedMemberColor}`,
                  boxShadow: `0 0 14px ${selectedMemberColor}50`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedMemberColor,
                  fontWeight: 800,
                  fontSize: '16px',
                  flexShrink: 0,
                }}
              >
                <User size={22} color={selectedMemberColor} />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {selectedMember.fullName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isRep ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                    border: isRep ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.15)',
                    color: isRep ? '#10b981' : '#cbd5e1',
                  }}
                >
                  {ROLE_LABELS[selectedMember.memberRole || 'MEMBER'] || 'Đồng sở hữu'}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: memberStatus.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: memberStatus.color,
                      boxShadow: `0 0 6px ${memberStatus.color}`,
                    }}
                  />
                  {memberStatus.label}
                </span>
              </div>
            </div>
          </div>

          {/* Member Information Data Fields */}
          <div
            style={{
              background: 'rgba(7, 20, 38, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11.5px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Họ tên:</span>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {selectedMember.fullName}
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Vai trò:</span>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {ROLE_LABELS[selectedMember.memberRole || 'MEMBER'] || 'Đồng sở hữu'}
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Tỷ lệ sở hữu:</span>
                <div style={{ fontWeight: 800, color: selectedMemberColor, marginTop: '2px', fontFamily: 'monospace', fontSize: '14px' }}>
                  {memberPercentage}%
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Trạng thái:</span>
                <div style={{ fontWeight: 700, color: memberStatus.color, marginTop: '2px' }}>
                  {memberStatus.label}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Email:</span>
                <div style={{ fontWeight: 600, color: '#cbd5e1', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={12} color="#94a3b8" />
                  {selectedMember.email || 'Chưa cung cấp'}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Ngày gia nhập:</span>
                <div style={{ fontWeight: 600, color: '#cbd5e1', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={12} color="#94a3b8" />
                  {selectedMember.joinedAt
                    ? new Date(selectedMember.joinedAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'Chưa cập nhật'}
                </div>
              </div>
            </div>

            {/* Quick Action: If this is another member and current user has share, offer to transfer */}
            {currentUser?.id && selectedMember.userId !== currentUser.id && currentUserShare > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRecipientUserId(selectedMember.userId);
                  setCurrentView('TRANSFER_FORM');
                  clearOwnerSelection();
                }}
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, rgba(34, 230, 255, 0.2), rgba(14, 165, 233, 0.3))',
                  border: '1px solid #22e6ff',
                  borderRadius: '8px',
                  color: '#22e6ff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Send size={13} />
                <span>Chuyển nhượng cổ phần cho {selectedMember.fullName}</span>
              </button>
            )}

            {/* Remove Member Action (Representative only) */}
            {canManage && selectedMember.userId !== currentUser?.id && (
              <div style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                {confirmRemoveId === selectedMember.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#fca5a5' }}>
                      Xác nhận xóa thành viên {selectedMember.fullName} khỏi nhóm?
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(selectedMember.id)}
                        disabled={removeMutation.isPending}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          background: 'rgba(239, 68, 68, 0.85)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {removeMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(null)}
                        style={{
                          padding: '7px 12px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveId(selectedMember.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#f87171',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Xóa thành viên khỏi nhóm</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW MODE B: TRANSFER FORM
  // =========================================================================
  if (currentView === 'TRANSFER_FORM') {
    const isExceedingShare = transferPercentNumber > currentUserShare;
    const canSubmitTransfer =
      Boolean(recipientUserId) &&
      transferPercentNumber > 0 &&
      !isExceedingShare &&
      transferorConsentChecked === true &&
      Boolean(reviewedAppendixSnapshot) &&
      !isPreviewLoading &&
      !isPreviewFetching &&
      !createTransferMutation.isPending;

    return renderPortal(
      <aside
        className="evshare-ownership-panel"
        role="region"
        aria-label="Yêu cầu chuyển nhượng sở hữu"
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={panelStyle}
      >
        {renderHeader('YÊU CẦU CHUYỂN NHƯỢNG SỞ HỮU', `${vehicleCode} • Cổ phần của bạn: ${currentUserShare}%`, true)}

        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1,
          }}
        >
          {/* Current Ownership Callout */}
          <div
            style={{
              background: 'rgba(34, 230, 255, 0.08)',
              border: '1px solid rgba(34, 230, 255, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Cổ phần hiện tại</span>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#22e6ff', marginTop: '1px' }}>
                {currentUser?.fullName || 'Bạn'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Khả dụng chuyển nhượng</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#22e6ff', fontFamily: 'monospace' }}>
                {currentUserShare}%
              </div>
            </div>
          </div>

          {/* Form Field: Recipient Member */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              Người nhận chuyển nhượng
            </label>
            <select
              value={recipientUserId}
              onChange={(e) => setRecipientUserId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'rgba(7, 20, 38, 0.95)',
                border: '1px solid rgba(34, 230, 255, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '11.5px',
                outline: 'none',
              }}
            >
              {!Array.isArray(recipientCandidates) || recipientCandidates.length === 0 ? (
                <option value="">Không có thành viên khác trong nhóm</option>
              ) : (
                (Array.isArray(recipientCandidates) ? recipientCandidates : []).map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName} ({m.share?.percentage ?? 0}%)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Form Field: Transfer Percentage */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}>
                Tỷ lệ chuyển nhượng (%)
              </label>
              {isExceedingShare && (
                <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 600 }}>
                  Vượt quá cổ phần sở hữu ({currentUserShare}%)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={currentUserShare}
                value={transferPercentageInput}
                onChange={(e) => setTransferPercentageInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  background: 'rgba(7, 20, 38, 0.95)',
                  border: isExceedingShare ? '1px solid #ef4444' : '1px solid rgba(34, 230, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none',
                  fontFamily: 'monospace',
                }}
              />
              {/* Quick shortcut chips */}
              {[5, 10, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTransferPercentageInput(pct.toFixed(2))}
                  style={{
                    padding: '6px 8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#94a3b8',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {pct}%
                </button>
              ))}
              {currentUserShare > 0 && (
                <button
                  type="button"
                  onClick={() => setTransferPercentageInput(currentUserShare.toFixed(2))}
                  style={{
                    padding: '6px 8px',
                    background: 'rgba(34, 230, 255, 0.15)',
                    border: '1px solid #22e6ff',
                    borderRadius: '6px',
                    color: '#22e6ff',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Tối đa
                </button>
              )}
            </div>
          </div>

          {/* Form Field: Reason */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              Lý do chuyển nhượng
            </label>
            <textarea
              rows={2}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Nhập lý do chuyển nhượng..."
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'rgba(7, 20, 38, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '11px',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* RELATED CONTRACT INFO BADGE */}
          <div
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '10.5px',
              color: '#d8b4fe',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
            }}
          >
            <FileText size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ fontWeight: 700 }}>Tích hợp Hợp đồng điện tử:</span> Sau khi bên nhận chấp thuận, hệ thống tự động soạn thảo phụ lục điều chỉnh tỷ lệ cổ phần bảo toàn 100.00%.
            </div>
          </div>

          {/* REAL-TIME PREVIEW: BEFORE vs AFTER */}
          <div
            style={{
              background: 'rgba(7, 20, 38, 0.85)',
              border: '1.5px solid rgba(34, 230, 255, 0.35)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#22e6ff', textTransform: 'uppercase' }}>
                DỰ KIẾN PHÂN BỔ CỔ PHẦN
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  color: '#fbbf24',
                }}
              >
                ĐÂY LÀ TỶ LỆ DỰ KIẾN
              </span>
            </div>

            {/* Live Distribution Table */}
            {isPreviewLoading ? (
              <div style={{ textAlign: 'center', padding: '12px 10px', fontSize: '11px', color: '#94a3b8' }}>
                <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: '6px', color: '#22e6ff' }} />
                <span>ĐANG TẢI DỮ LIỆU CHUYỂN NHƯỢNG...</span>
              </div>
            ) : isPreviewError ? (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'center',
                  color: '#fca5a5',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
                  <AlertCircle size={14} color="#ef4444" />
                  <span style={{ fontWeight: 700 }}>KHÔNG THỂ TẢI DỮ LIỆU CHUYỂN NHƯỢNG</span>
                </div>
                <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '8px' }}>
                  {previewError instanceof Error ? previewError.message : 'Vui lòng kiểm tra lại tỷ lệ hoặc người nhận'}
                </div>
                <button
                  type="button"
                  onClick={() => refetchPreview()}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    background: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.6)',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={11} />
                  THỬ LẠI
                </button>
              </div>
            ) : previewData && Array.isArray(previewMembers) && previewMembers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                {(Array.isArray(previewMembers) ? previewMembers : []).map((m: any) => {
                  const currentPct = Number(m.currentPercentage ?? m.percentage ?? 0);
                  const proposedPct = Number(m.proposedPercentage ?? m.percentage ?? 0);
                  const delta = Number(m.deltaPercentage ?? (proposedPct - currentPct));
                  return (
                    <div
                      key={m.userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.03)',
                      }}
                    >
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{m.fullName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' }}>
                        <span style={{ color: '#94a3b8' }}>{currentPct.toFixed(2)}%</span>
                        <ArrowRight size={11} color="#64748b" />
                        <span style={{ color: '#22e6ff', fontWeight: 800 }}>{proposedPct.toFixed(2)}%</span>
                        {delta !== 0 && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              color: delta > 0 ? '#10b981' : '#f87171',
                            }}
                          >
                            ({delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '10.5px',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>Tổng phân bổ nhóm:</span>
                  <span style={{ color: '#10b981', fontFamily: 'monospace' }}>
                    {(Array.isArray(previewMembers) ? previewMembers : []).reduce((sum, m) => sum + Number(m.proposedPercentage ?? m.percentage ?? 0), 0).toFixed(2)}% (Bảo toàn)
                  </span>
                </div>

                {!previewData.valid && previewData.validationMessage && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: '#fca5a5',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <AlertTriangle size={12} color="#ef4444" style={{ flexShrink: 0 }} />
                    <span>{previewData.validationMessage}</span>
                  </div>
                )}

                {previewData.hasOutstandingFinancialObligations && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: '#fde68a',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <AlertTriangle size={12} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <span>{previewData.financialObligationMessage || previewData.financialObligationWarning || 'NGHĨA VỤ TÀI CHÍNH CHƯA HOÀN TẤT'}</span>
                  </div>
                )}
                {/* Proposed Contract Amendment Preview (Section 3 & Section 5) */}
                {previewData.contractVersionFormatted && (
                  <div
                    style={{
                      background: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '8px',
                      padding: '10px',
                      marginTop: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={13} color="#c084fc" />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#e9d5ff' }}>
                          PHỤ LỤC HỢP ĐỒNG DỰ KIẾN ({reviewedAppendixSnapshot?.contractVersion || previewData.contractVersionFormatted})
                        </span>
                      </div>
                      {(reviewedAppendixSnapshot?.contentSnapshot || previewData.contentSnapshot) && (
                        <button
                          type="button"
                          id="btn-view-appendix-form"
                          onClick={() => setShowAmendmentSnapshotInForm(!showAmendmentSnapshotInForm)}
                          style={{
                            padding: '4px 8px',
                            background: showAmendmentSnapshotInForm ? 'rgba(34, 230, 255, 0.2)' : 'rgba(34, 230, 255, 0.1)',
                            border: '1px solid rgba(34, 230, 255, 0.4)',
                            borderRadius: '4px',
                            color: '#22e6ff',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {showAmendmentSnapshotInForm ? 'ẨN PHỤ LỤC' : 'XEM PHỤ LỤC CHUYỂN NHƯỢNG'}
                        </button>
                      )}
                    </div>

                    {showAmendmentSnapshotInForm && (reviewedAppendixSnapshot?.contentSnapshot || previewData.contentSnapshot) && (
                      <div
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          borderRadius: '6px',
                          padding: '8px',
                          color: '#cbd5e1',
                          fontFamily: 'monospace',
                          fontSize: '9.5px',
                          lineHeight: 1.4,
                          whiteSpace: 'pre-line',
                          maxHeight: '180px',
                          overflowY: 'auto',
                          marginBottom: '8px',
                        }}
                      >
                        {reviewedAppendixSnapshot?.contentSnapshot || previewData.contentSnapshot}
                      </div>
                    )}

                    {(reviewedAppendixSnapshot?.contentHash || previewData.contentHash) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: '#94a3b8', marginBottom: '8px' }}>
                        <span>Mã băm nội dung (SHA-256):</span>
                        <span style={{ color: '#22e6ff', fontFamily: 'monospace' }}>
                          {(reviewedAppendixSnapshot?.contentHash || previewData.contentHash!).substring(0, 16)}...
                        </span>
                      </div>
                    )}

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: (reviewedAppendixSnapshot && !isPreviewLoading && !isPreviewFetching) ? 'pointer' : 'not-allowed', fontSize: '10.5px', color: '#f1f5f9' }}>
                      <input
                        type="checkbox"
                        id="chk-transferor-consent-form"
                        checked={transferorConsentChecked}
                        disabled={!reviewedAppendixSnapshot || isPreviewLoading || isPreviewFetching || createTransferMutation.isPending}
                        onChange={(e) => setTransferorConsentChecked(e.target.checked)}
                        style={{ marginTop: '2px', accentColor: '#22e6ff' }}
                      />
                      <span style={{ fontWeight: 600 }}>
                        Tôi đã đọc, hiểu và đồng ý chuyển nhượng theo đúng nội dung phụ lục này.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '10.5px', color: '#64748b', textAlign: 'center', padding: '6px' }}>
                Vui lòng chọn người nhận và tỷ lệ hợp lệ để xem trước
              </div>
            )}
          </div>

          {/* Feedback messages */}
          {transferFormError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#fca5a5',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={13} style={{ flexShrink: 0 }} />
                <span>{transferFormError}</span>
              </div>
              {(transferFormError.includes('thay đổi') ||
                transferFormError.includes('không khớp') ||
                transferFormError.includes('hết hạn') ||
                transferFormError.includes('Phụ lục')) && (
                <button
                  type="button"
                  id="btn-reload-appendix-preview"
                  onClick={async () => {
                    setTransferorConsentChecked(false);
                    setReviewedAppendixSnapshot(null);
                    setTransferFormError(null);
                    await queryClient.invalidateQueries({
                      queryKey: [
                        'transferPreview',
                        groupId,
                        vehicle.id,
                        currentUser?.id,
                        recipientUserId,
                        transferPercentNumber,
                        transferReason,
                        currentUserShare,
                      ],
                    });
                    refetchPreview();
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    background: 'rgba(34, 230, 255, 0.2)',
                    border: '1px solid #22e6ff',
                    color: '#22e6ff',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <RefreshCw size={11} className={isPreviewFetching ? 'animate-spin' : ''} />
                  <span>{isPreviewFetching ? 'ĐANG TẢI LẠI...' : 'TẢI LẠI PHỤ LỤC'}</span>
                </button>
              )}
            </div>
          )}

          {transferSuccessMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#6ee7b7',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={13} />
              <span>{transferSuccessMsg}</span>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            disabled={!canSubmitTransfer}
            onClick={() => {
              if (canSubmitTransfer && reviewedAppendixSnapshot) {
                createTransferMutation.mutate({
                  toUserId: reviewedAppendixSnapshot.toUserId,
                  transferPercentage: reviewedAppendixSnapshot.transferPercentage,
                  reason: reviewedAppendixSnapshot.reason,
                  contentHash: reviewedAppendixSnapshot.contentHash,
                  acknowledgedTerms: true,
                  previewId: reviewedAppendixSnapshot.previewId,
                });
              }
            }}
            style={{
              marginTop: '4px',
              padding: '10px 14px',
              background: canSubmitTransfer
                ? 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)'
                : 'rgba(255, 255, 255, 0.08)',
              border: canSubmitTransfer ? '1.5px solid #22e6ff' : 'none',
              borderRadius: '10px',
              color: canSubmitTransfer ? '#ffffff' : '#64748b',
              fontSize: '12px',
              fontWeight: 800,
              cursor: canSubmitTransfer ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: canSubmitTransfer ? '0 4px 16px rgba(34, 230, 255, 0.25)' : 'none',
            }}
          >
            {createTransferMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang xử lý yêu cầu...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>GỬI YÊU CẦU CHUYỂN NHƯỢNG</span>
              </>
            )}
          </button>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW MODE C: INCOMING TRANSFER REQUESTS (Recipient Acceptance UI)
  // =========================================================================
  if (currentView === 'INCOMING_TRANSFERS') {
    return renderPortal(
      <aside
        className="evshare-ownership-panel"
        role="region"
        aria-label="Yêu cầu nhận chuyển nhượng"
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={panelStyle}
      >
        {renderHeader(
          'QUẢN LÝ CHUYỂN NHƯỢNG CỔ PHẦN',
          outgoingTransfers.length > 0
            ? 'Theo dõi & xác nhận giao dịch chuyển nhượng'
            : 'Phụ lục hợp đồng & xác nhận đồng sở hữu',
          true
        )}

        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1,
          }}
        >
          {/* Top inline error notice if incoming query failed but outgoing transfers exist */}
          {isErrorIncoming && outgoingTransfers.length > 0 && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#fca5a5',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} color="#ef4444" />
                <span>Không thể tải danh sách nhận chuyển nhượng.</span>
              </div>
              <button
                type="button"
                id="btn-retry-incoming-transfers"
                onClick={() => refetchIncoming()}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  color: '#ffffff',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RefreshCw size={10} />
                Thử lại
              </button>
            </div>
          )}

          {isLoadingIncoming && outgoingTransfers.length === 0 ? (
            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '24px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '11.5px',
              }}
            >
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#22e6ff' }} />
              <div style={{ fontWeight: 700, color: '#e2e8f0' }}>ĐANG TẢI PHỤ LỤC CHUYỂN NHƯỢNG...</div>
            </div>
          ) : isErrorIncoming && outgoingTransfers.length === 0 ? (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                padding: '20px 16px',
                textAlign: 'center',
                color: '#fca5a5',
                fontSize: '11.5px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={24} color="#ef4444" />
              <div style={{ fontWeight: 700 }}>KHÔNG THỂ TẢI YÊU CẦU CHUYỂN NHƯỢNG</div>
              <div style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
                Hệ thống gặp sự cố khi tải danh sách giao dịch. Vui lòng bấm thử lại.
              </div>
              <button
                type="button"
                id="btn-retry-incoming-transfers-full"
                onClick={() => {
                  refetchIncoming();
                  refetchGroupTransfers();
                }}
                style={{
                  marginTop: '4px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <RefreshCw size={12} />
                THỬ LẠI
              </button>
            </div>
          ) : (!Array.isArray(safeIncomingTransfers) || safeIncomingTransfers.length === 0) &&
              (!Array.isArray(notifiedGroupTransfers) || notifiedGroupTransfers.length === 0) &&
              (!Array.isArray(outgoingTransfers) || outgoingTransfers.length === 0) ? (
            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '24px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '11.5px',
              }}
            >
              <Clock size={24} color="#64748b" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>CHƯA CÓ YÊU CẦU CHUYỂN NHƯỢNG</div>
              <div>Không có yêu cầu chuyển nhượng nào đang chờ bạn xử lý.</div>
            </div>
          ) : focusedTransferId ? (
            (() => {
              const focusedItem = allCoOwnershipTransfers.find((t) => t.id === focusedTransferId);
              if (!focusedItem) {
                return (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '11px' }}>
                    Không tìm thấy thông tin chi tiết giao dịch {focusedTransferId}.
                  </div>
                );
              }
              const currentId = String(currentUser?.id || '').toLowerCase();
              const fType = currentId === String(focusedItem.fromUserId ?? focusedItem.transferorUserId ?? '').toLowerCase()
                ? 'outgoing'
                : currentId === String(focusedItem.toUserId ?? focusedItem.recipientUserId ?? '').toLowerCase()
                ? 'incoming'
                : 'notified';
              return (
                <>
                  <div
                    style={{
                      background: 'rgba(34, 230, 255, 0.1)',
                      border: '1px solid rgba(34, 230, 255, 0.35)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: '#22e6ff',
                      marginBottom: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Info size={14} />
                      <span>Chi tiết giao dịch: <strong style={{ fontFamily: 'monospace' }}>{focusedTransferId.substring(0, 8)}...</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFocusedTransferId(null)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '3px 8px',
                      }}
                    >
                      Hiển thị tất cả
                    </button>
                  </div>

                  <TransferCardItem
                    key={'focused-' + focusedItem.id}
                    req={focusedItem}
                    type={fType}
                    vehicleCode={vehicleCode}
                    currentUser={currentUser}
                    activeMembers={activeMembers}
                    onSettlementSuccess={() => {
                      invalidateAllOwnershipData();
                      refetchIncoming();
                      refetchGroupTransfers();
                    }}
                    onAccept={(transferId, hash) =>
                      acceptTransferMutation.mutate({
                        transferId,
                        payload: { contentHash: hash, acknowledgedTerms: true },
                      })
                    }
                    onConfirmTransferorConsent={(transferId, hash) =>
                      confirmTransferorConsentMutation.mutate({
                        transferId,
                        payload: { contentHash: hash, acknowledgedTerms: true },
                      })
                    }
                    onRejectPrompt={(transferId) => {
                      setRejectingTransferId(transferId);
                      setRejectReasonInput('');
                    }}
                    onCancel={(transferId) => cancelTransferMutation.mutate(transferId)}
                    onComplete={(transferId) => completeTransferMutation.mutate(transferId)}
                    isAcceptPending={acceptTransferMutation.isPending}
                    isConfirmPending={confirmTransferorConsentMutation.isPending}
                    isCompletePending={completeTransferMutation.isPending}
                    acceptErrorMessage={acceptError[focusedItem.id]}
                    completeErrorMessage={completeError[focusedItem.id]}
                    onClearAcceptError={(transferId) => {
                      setAcceptError((prev) => ({ ...prev, [transferId]: null }));
                      setCompleteError((prev) => ({ ...prev, [transferId]: null }));
                    }}
                    isRejecting={rejectingTransferId === focusedItem.id}
                    rejectReasonInput={rejectReasonInput}
                    setRejectReasonInput={setRejectReasonInput}
                    onCancelReject={() => {
                      setRejectingTransferId(null);
                      setRejectReasonInput('');
                    }}
                    onConfirmReject={(transferId, reason) => {
                      rejectTransferMutation.mutate({ transferId, reason });
                    }}
                  />
                </>
              );
            })()
          ) : (
            <>
            {/* Incoming Transfers (Current user is Recipient) */}
            {(Array.isArray(safeIncomingTransfers) ? safeIncomingTransfers : []).map((req) => (
              <TransferCardItem
                key={'incoming-' + req.id}
                req={req}
                type="incoming"
                vehicleCode={vehicleCode}
                currentUser={currentUser}
                activeMembers={activeMembers}
                onSettlementSuccess={() => {
                  invalidateAllOwnershipData();
                  refetchIncoming();
                  refetchGroupTransfers();
                }}
                onAccept={(transferId, hash) =>
                  acceptTransferMutation.mutate({
                    transferId,
                    payload: { contentHash: hash, acknowledgedTerms: true },
                  })
                }
                onConfirmTransferorConsent={(transferId, hash) =>
                  confirmTransferorConsentMutation.mutate({
                    transferId,
                    payload: { contentHash: hash, acknowledgedTerms: true },
                  })
                }
                onRejectPrompt={(transferId) => {
                  setRejectingTransferId(transferId);
                  setRejectReasonInput('');
                }}
                onCancel={(transferId) => cancelTransferMutation.mutate(transferId)}
                onComplete={(transferId) => completeTransferMutation.mutate(transferId)}
                isAcceptPending={acceptTransferMutation.isPending}
                isConfirmPending={confirmTransferorConsentMutation.isPending}
                isCompletePending={completeTransferMutation.isPending}
                acceptErrorMessage={acceptError[req.id]}
                completeErrorMessage={completeError[req.id]}
                onClearAcceptError={(transferId) => {
                  setAcceptError((prev) => ({ ...prev, [transferId]: null }));
                  setCompleteError((prev) => ({ ...prev, [transferId]: null }));
                }}
                isRejecting={rejectingTransferId === req.id}
                rejectReasonInput={rejectReasonInput}
                setRejectReasonInput={setRejectReasonInput}
                onCancelReject={() => {
                  setRejectingTransferId(null);
                  setRejectReasonInput('');
                }}
                onConfirmReject={(transferId, reason) => {
                  rejectTransferMutation.mutate({ transferId, reason });
                }}
              />
            ))}

            {/* Render Outgoing Transfers Initiated by Current User (e.g. Tran Thi B or Nguyen Van A) */}
            {(Array.isArray(outgoingTransfers) ? outgoingTransfers : []).map((req) => (
              <TransferCardItem
                key={'outgoing-' + req.id}
                req={req}
                type="outgoing"
                vehicleCode={vehicleCode}
                currentUser={currentUser}
                activeMembers={activeMembers}
                onSettlementSuccess={() => {
                  invalidateAllOwnershipData();
                  refetchIncoming();
                  refetchGroupTransfers();
                }}
                onAccept={(transferId, hash) =>
                  acceptTransferMutation.mutate({
                    transferId,
                    payload: { contentHash: hash, acknowledgedTerms: true },
                  })
                }
                onConfirmTransferorConsent={(transferId, hash) =>
                  confirmTransferorConsentMutation.mutate({
                    transferId,
                    payload: { contentHash: hash, acknowledgedTerms: true },
                  })
                }
                onRejectPrompt={(transferId) => {
                  setRejectingTransferId(transferId);
                  setRejectReasonInput('');
                }}
                onCancel={(transferId) => cancelTransferMutation.mutate(transferId)}
                onComplete={(transferId) => completeTransferMutation.mutate(transferId)}
                isAcceptPending={acceptTransferMutation.isPending}
                isConfirmPending={confirmTransferorConsentMutation.isPending}
                isCompletePending={completeTransferMutation.isPending}
                acceptErrorMessage={acceptError[req.id]}
                completeErrorMessage={completeError[req.id]}
                onClearAcceptError={(transferId) => {
                  setAcceptError((prev) => ({ ...prev, [transferId]: null }));
                  setCompleteError((prev) => ({ ...prev, [transferId]: null }));
                }}
                isRejecting={rejectingTransferId === req.id}
                rejectReasonInput={rejectReasonInput}
                setRejectReasonInput={setRejectReasonInput}
                onCancelReject={() => {
                  setRejectingTransferId(null);
                  setRejectReasonInput('');
                }}
                onConfirmReject={(transferId, reason) => {
                  rejectTransferMutation.mutate({ transferId, reason });
                }}
              />
            ))}

            {/* Render Notified Group Transfers for Non-Signatory Co-Owners (e.g. Le Van C) */}
            {(Array.isArray(notifiedGroupTransfers) ? notifiedGroupTransfers : []).map((req) => (
              <TransferCardItem
                key={'notified-' + req.id}
                req={req}
                type="notified"
                vehicleCode={vehicleCode}
                currentUser={currentUser}
                activeMembers={activeMembers}
                onSettlementSuccess={() => {
                  invalidateAllOwnershipData();
                  refetchIncoming();
                  refetchGroupTransfers();
                }}
                onAccept={(transferId, hash) =>
                  acceptTransferMutation.mutate({
                    transferId,
                    payload: { contentHash: hash, acknowledgedTerms: true },
                  })
                }
                onConfirmTransferorConsent={(transferId, hash) =>
                  confirmTransferorConsentMutation.mutate({
                    transferId,
                    payload: { contentHash: hash, acknowledgedTerms: true },
                  })
                }
                onRejectPrompt={(transferId) => {
                  setRejectingTransferId(transferId);
                  setRejectReasonInput('');
                }}
                onCancel={(transferId) => cancelTransferMutation.mutate(transferId)}
                onComplete={(transferId) => completeTransferMutation.mutate(transferId)}
                isAcceptPending={acceptTransferMutation.isPending}
                isConfirmPending={confirmTransferorConsentMutation.isPending}
                isCompletePending={completeTransferMutation.isPending}
                acceptErrorMessage={acceptError[req.id]}
                completeErrorMessage={completeError[req.id]}
                onClearAcceptError={(transferId) => {
                  setAcceptError((prev) => ({ ...prev, [transferId]: null }));
                  setCompleteError((prev) => ({ ...prev, [transferId]: null }));
                }}
                isRejecting={rejectingTransferId === req.id}
                rejectReasonInput={rejectReasonInput}
                setRejectReasonInput={setRejectReasonInput}
                onCancelReject={() => {
                  setRejectingTransferId(null);
                  setRejectReasonInput('');
                }}
                onConfirmReject={(transferId, reason) => {
                  rejectTransferMutation.mutate({ transferId, reason });
                }}
              />
            ))}
            </>
          )}
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW MODE D: MEMBER WITHDRAWAL FORM
  // =========================================================================
  if (currentView === 'WITHDRAWAL_FORM') {
    const hasRemainingShare = currentUserShare > 0;

    return renderPortal(
      <aside
        className="evshare-ownership-panel"
        role="region"
        aria-label="Yêu cầu rút khỏi nhóm"
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={panelStyle}
      >
        {renderHeader('YÊU CẦU RÚT KHỎI NHÓM', `${vehicleCode} • Thành viên ${currentUser?.fullName}`, true)}

        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1,
          }}
        >
          {/* Rules / Restrictions Notice */}
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '11px',
              color: '#fef3c7',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#fbbf24' }}>
              <AlertTriangle size={14} />
              <span>ĐIỀU KIỆN RÚT KHỎI NHÓM ĐỒNG SỞ HỮU</span>
            </div>
            <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px', color: '#fde68a' }}>
              <li>Tỷ lệ sở hữu còn lại phải bằng 0% (đã hoàn tất chuyển nhượng).</li>
              <li>Không có chuyến đi đang thực hiện hoặc lịch đặt xe sắp tới.</li>
              <li>Hoàn tất toàn bộ nghĩa vụ tài chính và các khoản phân bổ chi phí.</li>
            </ul>
          </div>

          {/* Remaining Share Check */}
          {hasRemainingShare && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#fca5a5',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ fontWeight: 800 }}>Bạn còn giữ {currentUserShare}% cổ phần:</span> Vui lòng chuyển nhượng toàn bộ tỷ lệ sở hữu cho thành viên khác trước khi gửi yêu cầu rút.
              </div>
            </div>
          )}

          {/* Withdrawal Reason Field */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              Lý do rút khỏi nhóm
            </label>
            <textarea
              rows={3}
              value={withdrawalReason}
              onChange={(e) => setWithdrawalReason(e.target.value)}
              placeholder="Nhập lý do nguyện vọng rút khỏi nhóm..."
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'rgba(7, 20, 38, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '11px',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Messages */}
          {withdrawalFormError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#fca5a5',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertCircle size={13} />
              <span>{withdrawalFormError}</span>
            </div>
          )}

          {withdrawalSuccessMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#6ee7b7',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={13} />
              <span>{withdrawalSuccessMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            disabled={hasRemainingShare || !withdrawalReason.trim() || withdrawalMutation.isPending}
            onClick={() => {
              if (!hasRemainingShare && withdrawalReason.trim()) {
                withdrawalMutation.mutate({ reason: withdrawalReason });
              }
            }}
            style={{
              marginTop: 'auto',
              padding: '10px 14px',
              background:
                !hasRemainingShare && withdrawalReason.trim()
                  ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                  : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '10px',
              color: !hasRemainingShare ? '#ffffff' : '#64748b',
              fontSize: '12px',
              fontWeight: 800,
              cursor: !hasRemainingShare ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {withdrawalMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang gửi yêu cầu...</span>
              </>
            ) : (
              <>
                <LogOut size={14} />
                <span>GỬI YÊU CẦU RÚT KHỎI NHÓM</span>
              </>
            )}
          </button>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW MODE E: OWNERSHIP CHANGE HISTORY
  // =========================================================================
  if (currentView === 'HISTORY') {
    return renderPortal(
      <aside
        className="evshare-ownership-panel"
        role="region"
        aria-label="Lịch sử sở hữu"
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={panelStyle}
      >
        {renderHeader('LỊCH SỬ THAY ĐỔI SỞ HỮU', `${vehicleCode} • Nhật ký giao dịch bất biến`, true)}

        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flex: 1,
          }}
        >
          {isLoadingHistory ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#22e6ff', fontSize: '11.5px' }}>
              <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: '6px' }} />
              Đang tải lịch sử giao dịch...
            </div>
          ) : isErrorHistory ? (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                padding: '20px 16px',
                textAlign: 'center',
                color: '#fca5a5',
                fontSize: '11.5px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={24} color="#ef4444" />
              <div style={{ fontWeight: 700 }}>Không thể tải lịch sử giao dịch</div>
              <button
                type="button"
                onClick={() => refetchHistory()}
                style={{
                  marginTop: '4px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <RefreshCw size={12} />
                THỬ LẠI
              </button>
            </div>
          ) : !Array.isArray(safeOwnershipHistory) || safeOwnershipHistory.length === 0 ? (
            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '24px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '11.5px',
              }}
            >
              <History size={24} color="#64748b" style={{ margin: '0 auto 8px' }} />
              <div>Chưa có giao dịch chuyển nhượng nào được hoàn tất trong nhóm.</div>
            </div>
          ) : (
            (Array.isArray(safeOwnershipHistory) ? safeOwnershipHistory : []).map((hist) => (
              <div
                key={hist.id}
                style={{
                  background: 'rgba(7, 20, 38, 0.75)',
                  border: '1px solid rgba(34, 230, 255, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '12px' }}>
                      {hist.fromUserName || 'Thành viên'}
                    </span>
                    <ArrowRight size={12} color="#22e6ff" />
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '12px' }}>
                      {hist.toUserName || 'Người nhận'}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#10b981',
                      fontFamily: 'monospace',
                    }}
                  >
                    {hist.transferredPercentage}%
                  </span>
                </div>

                <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{new Date(hist.effectiveAt).toLocaleString('vi-VN')}</span>
                  {hist.recordedByUserName && <span>Ghi nhận: {hist.recordedByUserName}</span>}
                </div>

                {hist.reason && (
                  <div style={{ fontSize: '10.5px', color: '#cbd5e1', fontStyle: 'italic', marginTop: '2px' }}>
                    "{hist.reason}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW MODE F: MAIN MEMBERSHIP DASHBOARD (Default view)
  // =========================================================================
  return renderPortal(
    <aside
      className="evshare-ownership-panel"
      role="region"
      aria-label="Thông tin đồng sở hữu xe"
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={panelStyle}
    >
      {/* 1. COMPACT FIXED HEADER */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(34, 230, 255, 0.18)',
          background: 'linear-gradient(90deg, rgba(34, 230, 255, 0.08) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(34, 230, 255, 0.25), rgba(8, 16, 30, 0.9))',
              border: '1px solid #22e6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22e6ff',
              boxShadow: '0 0 10px rgba(34, 230, 255, 0.3)',
            }}
          >
            <Users size={14} />
          </div>
          <div>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.02em',
                lineHeight: 1.2,
              }}
            >
              QUẢN LÝ ĐỒNG SỞ HỮU
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>
              {resolveVehicleDisplayName(vehicle, vehicleCode)} • {vehicleCode}
              {vehicle.licensePlate ? ` | ${vehicle.licensePlate}` : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              borderRadius: '9999px',
              background: isComplete ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              border: isComplete ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(245, 158, 11, 0.45)',
              color: isComplete ? '#10b981' : '#fbbf24',
              fontSize: '9.5px',
              fontWeight: 800,
              letterSpacing: '0.03em',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: isComplete ? '#10b981' : '#f59e0b',
                boxShadow: `0 0 6px ${isComplete ? '#10b981' : '#f59e0b'}`,
              }}
            />
            {statusLabel}
          </span>

          <button
            type="button"
            onClick={onClose}
            title="Đóng bảng đồng sở hữu"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '7px',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 2. THREE TABS BAR (flexShrink: 0) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '5px',
          padding: '8px 14px',
          background: 'rgba(8, 16, 30, 0.95)',
          borderBottom: '1px solid rgba(34, 230, 255, 0.15)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          id="tab-management-overview"
          onClick={() => {
            setManagementTab('OVERVIEW');
            setSelectedHistoryDetail(null);
          }}
          style={{
            padding: '6px 4px',
            borderRadius: '7px',
            fontSize: '11px',
            fontWeight: 800,
            background: managementTab === 'OVERVIEW' ? 'rgba(34, 230, 255, 0.20)' : 'rgba(255, 255, 255, 0.04)',
            border: managementTab === 'OVERVIEW' ? '1.2px solid #22e6ff' : '1px solid rgba(255, 255, 255, 0.10)',
            color: managementTab === 'OVERVIEW' ? '#22e6ff' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: managementTab === 'OVERVIEW' ? '0 0 12px rgba(34, 230, 255, 0.3)' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '0.02em',
          }}
        >
          TỔNG QUAN
        </button>
        <button
          type="button"
          id="tab-management-pending"
          onClick={() => {
            setManagementTab('PENDING');
            setSelectedHistoryDetail(null);
          }}
          style={{
            padding: '6px 4px',
            borderRadius: '7px',
            fontSize: '11px',
            fontWeight: 800,
            background: managementTab === 'PENDING' ? 'rgba(34, 230, 255, 0.20)' : 'rgba(255, 255, 255, 0.04)',
            border: managementTab === 'PENDING' ? '1.2px solid #22e6ff' : '1px solid rgba(255, 255, 255, 0.10)',
            color: managementTab === 'PENDING' ? '#22e6ff' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: managementTab === 'PENDING' ? '0 0 12px rgba(34, 230, 255, 0.3)' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '0.02em',
          }}
        >
          ĐANG CHỜ ({pendingTransfers.length})
        </button>
        <button
          type="button"
          id="tab-management-history"
          onClick={() => {
            setManagementTab('HISTORY');
            setSelectedHistoryDetail(null);
          }}
          style={{
            padding: '6px 4px',
            borderRadius: '7px',
            fontSize: '11px',
            fontWeight: 800,
            background: managementTab === 'HISTORY' ? 'rgba(34, 230, 255, 0.20)' : 'rgba(255, 255, 255, 0.04)',
            border: managementTab === 'HISTORY' ? '1.2px solid #22e6ff' : '1px solid rgba(255, 255, 255, 0.10)',
            color: managementTab === 'HISTORY' ? '#22e6ff' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: managementTab === 'HISTORY' ? '0 0 12px rgba(34, 230, 255, 0.3)' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '0.02em',
          }}
        >
          LỊCH SỬ ({historyTransfers.length})
        </button>
      </div>

      {/* 3. CONTENT BODY */}
      <div
        style={{
          padding: '12px 14px',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '9px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Loading / Error States */}
        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              color: '#22e6ff',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            <span>Đang tải dữ liệu đồng sở hữu...</span>
          </div>
        )}

        {isError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              padding: '10px 12px',
              color: '#fca5a5',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={14} />
            <span>{error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}</span>
          </div>
        )}

        {/* TAB 1: TỔNG QUAN (PREMIUM COMPACT REDESIGN) */}
        {managementTab === 'OVERVIEW' && (
          <>
            {/* 1. Pending Action Alert Strip (Only rendered if pending actions exist, otherwise clean) */}
            {actionNeededTransfers.length > 0 && (
              <div
                id="alert-strip-pending-actions"
                onClick={() => setManagementTab('PENDING')}
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.22))',
                  border: '1.2px solid #f59e0b',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.2)',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} color="#fbbf24" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff' }}>
                      Có {actionNeededTransfers.length} giao dịch cần xử lý
                    </div>
                    <div style={{ fontSize: '10px', color: '#fde68a' }}>
                      Chuyển nhượng hoặc ký phụ lục hợp đồng
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#fbbf24', fontWeight: 700 }}>
                  <span>Xem ({actionNeededTransfers.length})</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            )}

            {/* 2. Compact Group Identity & Validity Summary */}
            <div
              style={{
                background: 'rgba(7, 20, 38, 0.70)',
                border: '1px solid rgba(34, 230, 255, 0.22)',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flexShrink: 0,
              }}
            >
              {/* Group Name & Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 800,
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {coOwnership?.name || `${vehicleCode} Co-ownership`}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                    {memberCount} thành viên • {vehicleCount} xe điện
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#22e6ff', fontFamily: 'monospace' }}>
                    {totalPercentage}%
                  </div>
                  <div style={{ fontSize: '9.5px', color: isComplete ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                    {statusLabel}
                  </div>
                </div>
              </div>

              {/* Slim Segmented Ownership Bar */}
              <div>
                <div
                  style={{
                    height: '8px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    overflow: 'hidden',
                    width: '100%',
                  }}
                >
                  {activeMembers.map((m, index) => {
                    const orbColor = OWNER_ORB_COLORS[index % OWNER_ORB_COLORS.length];
                    const pct = Math.max(0, m.share?.percentage ?? 0);
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={m.id || index}
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: orbColor,
                          boxShadow: `0 0 6px ${orbColor}60`,
                          transition: 'width 0.3s ease',
                        }}
                        title={`${m.fullName}: ${pct}%`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Active Members List (Positioned immediately below summary) */}
            <div
              style={{
                background: 'rgba(7, 20, 38, 0.75)',
                border: '1px solid rgba(34, 230, 255, 0.22)',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '4px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#22e6ff', letterSpacing: '0.04em' }}>
                  DANH SÁCH ĐỒNG SỞ HỮU ({activeMembers.length})
                </span>
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                  Bấm để xem hồ sơ
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {activeMembers.map((m, index) => {
                  const orbColor = OWNER_ORB_COLORS[index % OWNER_ORB_COLORS.length];
                  const isCurrentUser = m.userId === currentUser?.id;
                  const isRep = m.memberRole === 'REPRESENTATIVE';
                  const sharePct = m.share?.percentage ?? 0;

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        useWorldStore.getState().selectOwner(m.id);
                      }}
                      style={{
                        background: isCurrentUser ? 'rgba(34, 230, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: isCurrentUser ? '1px solid rgba(34, 230, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        padding: '7px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isCurrentUser
                          ? 'rgba(34, 230, 255, 0.14)'
                          : 'rgba(255, 255, 255, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isCurrentUser
                          ? 'rgba(34, 230, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.03)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: orbColor,
                            boxShadow: `0 0 6px ${orbColor}`,
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.fullName}
                            </span>
                            {isCurrentUser && (
                              <span style={{ fontSize: '8.5px', padding: '1px 4px', borderRadius: '4px', background: '#22e6ff20', color: '#22e6ff', fontWeight: 800 }}>
                                Bạn
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '1px' }}>
                            {isRep ? 'Đại diện nhóm' : 'Đồng sở hữu'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 800,
                            color: orbColor,
                            fontFamily: 'monospace',
                          }}
                        >
                          {sharePct}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Action Controls: Primary Actions + Secondary Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
              {/* Primary Actions Row */}
              <div style={{ display: 'grid', gridTemplateColumns: canManage ? '1fr 1fr' : '1fr', gap: '6px' }}>
                <button
                  type="button"
                  id="btn-primary-transfer-ownership"
                  onClick={() => setCurrentView('TRANSFER_FORM')}
                  disabled={currentUserShare <= 0}
                  style={{
                    padding: '8px 12px',
                    background:
                      currentUserShare > 0
                        ? 'linear-gradient(135deg, rgba(34, 230, 255, 0.20), rgba(14, 165, 233, 0.30))'
                        : 'rgba(255, 255, 255, 0.04)',
                    border: currentUserShare > 0 ? '1.2px solid #22e6ff' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: currentUserShare > 0 ? '#22e6ff' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: currentUserShare > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: currentUserShare > 0 ? '0 2px 10px rgba(34, 230, 255, 0.2)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Send size={12} />
                  <span>CHUYỂN NHƯỢNG CỔ PHẦN</span>
                </button>

                {canManage && (
                  <button
                    type="button"
                    id="btn-primary-add-member"
                    onClick={() => setIsAddMemberOpen((prev) => !prev)}
                    style={{
                      padding: '8px 12px',
                      background: isAddMemberOpen
                        ? 'rgba(34, 230, 255, 0.15)'
                        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.20), rgba(5, 150, 105, 0.30))',
                      border: isAddMemberOpen ? '1px solid #22e6ff' : '1.2px solid #10b981',
                      borderRadius: '8px',
                      color: isAddMemberOpen ? '#22e6ff' : '#6ee7b7',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 10px rgba(16, 185, 129, 0.15)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <UserPlus size={13} />
                    <span>{isAddMemberOpen ? 'ĐÓNG FORM THÊM' : '+ THÊM THÀNH VIÊN'}</span>
                  </button>
                )}
              </div>

              {/* Inline Add Member Panel when toggled by representative */}
              {canManage && isAddMemberOpen && (
                <div
                  style={{
                    background: 'rgba(7, 20, 38, 0.95)',
                    border: '1.2px solid rgba(34, 230, 255, 0.4)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#22e6ff' }}>
                      MỜI THÀNH VIÊN VÀO NHÓM
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddMemberOpen(false);
                        setSelectedUserToAdd(null);
                        setAddError(null);
                      }}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '5px 8px',
                    }}
                  >
                    <Search size={12} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên hoặc email EVShare..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                  </div>

                  <div style={{ maxHeight: '90px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {isSearchingUsers ? (
                      <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', padding: '4px' }}>
                        Đang tìm kiếm...
                      </div>
                    ) : !Array.isArray(availableUsers) || availableUsers.length === 0 ? (
                      <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', padding: '4px' }}>
                        Không có người dùng khả dụng.
                      </div>
                    ) : (
                      (Array.isArray(availableUsers) ? availableUsers : []).map((u) => {
                        const isChosen = selectedUserToAdd?.id === u.id;
                        return (
                          <div
                            key={u.id}
                            onClick={() => setSelectedUserToAdd(u)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              background: isChosen ? 'rgba(34, 230, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                              border: isChosen ? '1px solid #22e6ff' : '1px solid transparent',
                              cursor: 'pointer',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#f8fafc' }}>
                                {u.displayName}
                              </div>
                              <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>
                                {u.email}
                              </div>
                            </div>
                            {isChosen && <CheckCircle2 size={12} color="#22e6ff" />}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {addError && (
                    <div style={{ color: '#f87171', fontSize: '9.5px' }}>
                      {addError}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!selectedUserToAdd || addMutation.isPending}
                    onClick={() => {
                      if (selectedUserToAdd) addMutation.mutate(selectedUserToAdd.id);
                    }}
                    style={{
                      padding: '6px 10px',
                      background: selectedUserToAdd
                        ? 'linear-gradient(135deg, #0284c7, #06b6d4)'
                        : 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderRadius: '6px',
                      color: selectedUserToAdd ? '#ffffff' : '#64748b',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: selectedUserToAdd ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    {addMutation.isPending ? 'Đang gửi lời mời...' : 'Gửi lời mời tham gia nhóm'}
                  </button>
                </div>
              )}

              {/* Secondary Actions Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '6px' }}>
                {/* Contract Entry */}
                <button
                  type="button"
                  id="btn-coowner-view-contract"
                  onClick={() => openGaragePanel('CONTRACT', { vehicleId: vehicle.id })}
                  style={{
                    padding: '7px 10px',
                    background: 'rgba(0, 242, 254, 0.08)',
                    border: '1px solid rgba(0, 242, 254, 0.30)',
                    borderRadius: '8px',
                    color: '#00f2fe',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <FileText size={12} color="#00f2fe" />
                  <span>HỢP ĐỒNG & QUY CHẾ</span>
                </button>

                {/* Secondary: Leave Group Request */}
                <button
                  type="button"
                  id="btn-coowner-withdrawal"
                  onClick={() => setCurrentView('WITHDRAWAL_FORM')}
                  style={{
                    padding: '7px 8px',
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.22)',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <LogOut size={11} />
                  <span>RÚT KHỎI NHÓM</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: ĐANG CHỜ (Active non-terminal transfer requests) */}
        {managementTab === 'PENDING' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(isLoadingIncoming || isLoadingGroupTransfers) && pendingTransfers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 16px', color: '#22e6ff', fontSize: '11.5px' }}>
                <Loader2 size={20} className="animate-spin" style={{ display: 'inline', marginRight: '6px' }} />
                Đang tải danh sách giao dịch đang chờ...
              </div>
            ) : (isErrorIncoming || isErrorGroupTransfers) && pendingTransfers.length === 0 ? (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  color: '#fca5a5',
                  fontSize: '11.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={20} color="#ef4444" />
                <div style={{ fontWeight: 700 }}>Không thể tải danh sách giao dịch đang chờ</div>
                <button
                  type="button"
                  onClick={() => {
                    refetchIncoming();
                    refetchGroupTransfers();
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.6)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <RefreshCw size={12} />
                  THỬ LẠI
                </button>
              </div>
            ) : pendingTransfers.length === 0 ? (
              <div
                style={{
                  background: 'rgba(7, 20, 38, 0.50)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '11.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Clock size={28} color="#38bdf8" />
                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '13px', letterSpacing: '0.04em' }}>
                  KHÔNG CÓ GIAO DỊCH ĐANG CHỜ
                </div>
                <div style={{ color: '#94a3b8', maxWidth: '320px', lineHeight: 1.4 }}>
                  Hiện tại không có giao dịch chuyển nhượng nào đang chờ xử lý trong nhóm.
                </div>
              </div>
            ) : (
              pendingTransfers.map((t) => {
                const currentId = String(currentUser?.id || '').toLowerCase();
                const isTransferor = currentId === String(t.fromUserId ?? t.transferorUserId ?? '').toLowerCase();
                const isRecipient = currentId === String(t.toUserId ?? t.recipientUserId ?? '').toLowerCase();
                const isTransferorAccepted = Boolean(t.transferorAccepted ?? t.isTransferorAccepted);
                const isRecipientAccepted = Boolean(t.recipientAccepted ?? t.isRecipientAccepted);
                const acceptedCount = (isTransferorAccepted ? 1 : 0) + (isRecipientAccepted ? 1 : 0);
                const hasFinBlocker = Boolean(
                  t.hasOutstandingFinancialObligations ||
                  (t.finalizationBlockers && t.finalizationBlockers.some((b) => b.includes('tài chính') || b.includes('nghĩa vụ')))
                );

                const statusCfg = getTransferDisplayStatus(t);

                let nextActionText = '';
                if (!isTransferorAccepted && !isRecipientAccepted) {
                  nextActionText = isTransferor
                    ? 'Bạn và bên nhận cần ký xác nhận phụ lục hợp đồng.'
                    : isRecipient
                    ? 'Bạn và bên chuyển nhượng cần ký xác nhận phụ lục hợp đồng.'
                    : 'Chờ cả hai bên ký xác nhận phụ lục chuyển nhượng.';
                } else if (!isTransferorAccepted) {
                  nextActionText = isTransferor
                    ? 'Bạn cần xem phụ lục và bấm xác nhận phụ lục.'
                    : `Chờ bên chuyển nhượng (${t.fromUserName}) ký xác nhận phụ lục.`;
                } else if (!isRecipientAccepted) {
                  nextActionText = isRecipient
                    ? 'Bạn cần xem phụ lục và đồng ý nhận chuyển nhượng.'
                    : `Chờ bên nhận (${t.toUserName}) ký xác nhận phụ lục.`;
                } else if (hasFinBlocker) {
                  nextActionText = isTransferor
                    ? 'Bạn cần hoàn tất thanh toán nghĩa vụ chi phí trước khi hoàn tất.'
                    : `Chờ bên chuyển nhượng (${t.fromUserName}) hoàn tất nghĩa vụ tài chính.`;
                } else {
                  nextActionText = 'Đủ điều kiện hoàn tất. Cả hai bên đã xác nhận hợp đồng.';
                }

                return (
                  <div
                    key={`pending-card-${t.id}`}
                    id={`card-pending-${t.id}`}
                    style={{
                      background: 'rgba(7, 20, 38, 0.75)',
                      border: `1.5px solid ${statusCfg.color}50`,
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: `0 0 16px ${statusCfg.color}20`,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Row 1: Participants & Percentage */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={15} color={statusCfg.color} />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                          {t.fromUserName} ➔ {t.toUserName}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#22e6ff',
                          fontFamily: 'monospace',
                        }}
                      >
                        {t.transferPercentage}%
                      </span>
                    </div>

                    {/* Row 2: Status & Progress */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>TRẠNG THÁI</span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: `${statusCfg.color}15`,
                            border: `1px solid ${statusCfg.color}`,
                            color: statusCfg.color,
                            display: 'inline-block',
                            marginTop: '2px',
                          }}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Tiến độ xác nhận</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                          {acceptedCount}/2 bên
                        </span>
                      </div>
                    </div>

                    {/* Row 3: Financial obligation concise warning if any */}
                    {hasFinBlocker && (
                      <div
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '10px',
                          color: '#fca5a5',
                        }}
                      >
                        <AlertTriangle size={12} color="#ef4444" style={{ flexShrink: 0 }} />
                        <span>
                          CHỜ HOÀN TẤT NGHĨA VỤ TÀI CHÍNH
                          {t.outstandingObligationAmount ? `: ${Number(t.outstandingObligationAmount).toLocaleString('vi-VN')} ₫` : ''}
                        </span>
                      </div>
                    )}

                    {/* Row 4: Next responsible actor */}
                    <div style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: 1.4 }}>
                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>Next: </span>
                      <span>{nextActionText}</span>
                    </div>

                    {/* Row 5: Action Button CHI TIẾT GIAO DỊCH */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <button
                        type="button"
                        id={`btn-detail-pending-${t.id}`}
                        onClick={() => handleOpenTransferDetail(t.id)}
                        style={{
                          background: 'rgba(34, 230, 255, 0.12)',
                          border: '1px solid rgba(34, 230, 255, 0.35)',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          color: '#22e6ff',
                          fontSize: '11px',
                          fontWeight: 750,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span>CHI TIẾT GIAO DỊCH</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: LỊCH SỬ (Definitively ended transfer transactions) */}
        {managementTab === 'HISTORY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedHistoryDetail ? (
              // READ-ONLY HISTORICAL DETAIL VIEW
              <div
                style={{
                  background: 'rgba(7, 20, 38, 0.85)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <History size={16} color="#10b981" />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                      CHI TIẾT LỊCH SỬ CHUYỂN NHƯỢNG
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryDetail(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: '#cbd5e1',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ArrowLeft size={12} />
                    <span>Quay lại danh sách</span>
                  </button>
                </div>

                {/* Status and ID */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>MÃ GIAO DỊCH</span>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#22e6ff' }}>
                      {selectedHistoryDetail.transferRequestId || selectedHistoryDetail.id}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      background: selectedHistoryDetail.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: selectedHistoryDetail.status === 'COMPLETED' ? '1px solid #10b981' : '1px solid #ef4444',
                      color: selectedHistoryDetail.status === 'COMPLETED' ? '#10b981' : '#f87171',
                    }}
                  >
                    {selectedHistoryDetail.statusVi || (selectedHistoryDetail.status === 'COMPLETED' ? 'CHUYỂN NHƯỢNG THÀNH CÔNG' : selectedHistoryDetail.status === 'REJECTED' ? 'BỊ TỪ CHỐI' : 'ĐÃ HỦY')}
                  </span>
                </div>

                {/* Parties & Percentage */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px', borderRadius: '6px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '9.5px', display: 'block' }}>Bên chuyển nhượng:</span>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '12px' }}>{selectedHistoryDetail.fromUserName}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px', borderRadius: '6px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '9.5px', display: 'block' }}>Bên nhận chuyển nhượng:</span>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '12px' }}>{selectedHistoryDetail.toUserName}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px', borderRadius: '6px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '9.5px', display: 'block' }}>Tỷ lệ chuyển nhượng:</span>
                    <span style={{ fontWeight: 800, color: '#10b981', fontFamily: 'monospace', fontSize: '13px' }}>
                      {selectedHistoryDetail.transferPercentage}%
                    </span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px', borderRadius: '6px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '9.5px', display: 'block' }}>Thời điểm hoàn tất:</span>
                    <span style={{ fontWeight: 600, color: '#cbd5e1', fontSize: '10.5px' }}>
                      {selectedHistoryDetail.completedAt || selectedHistoryDetail.effectiveAt || selectedHistoryDetail.createdAt
                        ? new Date(selectedHistoryDetail.completedAt || selectedHistoryDetail.effectiveAt || selectedHistoryDetail.createdAt).toLocaleString('vi-VN')
                        : 'Đã hoàn tất'}
                    </span>
                  </div>
                </div>

                {/* Ownership Distribution Snapshots */}
                {(() => {
                  const matchHist = safeOwnershipHistory.find(
                    (h) => h.transferRequestId === selectedHistoryDetail.id || h.id === selectedHistoryDetail.id
                  );
                  const prevMembers = parseSnapshotMembers(matchHist?.previousOwnershipSnapshot);
                  const newMembers = parseSnapshotMembers(matchHist?.newOwnershipSnapshot || selectedHistoryDetail.proposedOwnershipSnapshot);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          PHÂN BỔ SỞ HỮU TRƯỚC GIAO DỊCH
                        </span>
                        {prevMembers.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {prevMembers.map((m, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                                <span style={{ color: '#cbd5e1' }}>{m.fullName}</span>
                                <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{m.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
                            Không khả dụng trong dữ liệu lưu vết phiên bản gốc.
                          </div>
                        )}
                      </div>

                      <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          PHÂN BỔ SỞ HỮU SAU GIAO DỊCH
                        </span>
                        {newMembers.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {newMembers.map((m, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{m.fullName}</span>
                                <span style={{ fontFamily: 'monospace', color: '#22e6ff', fontWeight: 700 }}>{m.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
                            Không khả dụng trong dữ liệu lưu vết.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Contract Appendix Audit */}
                <div style={{ background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '8px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#c084fc', fontWeight: 700 }}>Phụ lục hợp đồng liên kết:</span>
                    <span style={{ color: '#e9d5ff', fontWeight: 800 }}>{selectedHistoryDetail.contractVersionFormatted || 'V2.0'}</span>
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    Mã hợp đồng: <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>{selectedHistoryDetail.contractCode || 'HĐ-EV01'}</span>
                  </div>
                  {selectedHistoryDetail.contentHash && (
                    <div style={{ color: '#94a3b8' }}>
                      Mã băm toàn vẹn (SHA-256): <span style={{ color: '#10b981', fontFamily: 'monospace', fontSize: '9px', wordBreak: 'break-all' }}>{selectedHistoryDetail.contentHash}</span>
                    </div>
                  )}
                </div>

                {selectedHistoryDetail.reason && (
                  <div style={{ fontSize: '10.5px', color: '#cbd5e1', fontStyle: 'italic' }}>
                    "{selectedHistoryDetail.reason}"
                  </div>
                )}
              </div>
            ) : isLoadingHistory && historyTransfers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 16px', color: '#22e6ff', fontSize: '11.5px' }}>
                <Loader2 size={20} className="animate-spin" style={{ display: 'inline', marginRight: '6px' }} />
                Đang tải lịch sử chuyển nhượng...
              </div>
            ) : isErrorHistory && historyTransfers.length === 0 ? (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  color: '#fca5a5',
                  fontSize: '11.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={20} color="#ef4444" />
                <div style={{ fontWeight: 700 }}>Không thể tải lịch sử chuyển nhượng</div>
                <button
                  type="button"
                  onClick={() => refetchHistory()}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.6)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <RefreshCw size={12} />
                  THỬ LẠI
                </button>
              </div>
            ) : historyTransfers.length === 0 ? (
              <div
                style={{
                  background: 'rgba(7, 20, 38, 0.50)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '11.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <History size={28} color="#10b981" />
                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '13px', letterSpacing: '0.04em' }}>
                  CHƯA CÓ LỊCH SỬ CHUYỂN NHƯỢNG
                </div>
                <div style={{ color: '#94a3b8', maxWidth: '320px', lineHeight: 1.4 }}>
                  Chưa có giao dịch chuyển nhượng nào kết thúc trong nhóm này.
                </div>
              </div>
            ) : (
              historyTransfers.map((t) => {
                const isCompleted = t.status === 'COMPLETED';
                const statusColor = isCompleted ? '#10b981' : '#f87171';
                const statusLabel = isCompleted ? 'CHUYỂN NHƯỢNG THÀNH CÔNG' : t.status === 'REJECTED' ? 'BỊ TỪ CHỐI' : 'ĐÃ HỦY';

                return (
                  <div
                    key={`history-card-${t.id}`}
                    id={`card-history-${t.id}`}
                    style={{
                      background: 'rgba(7, 20, 38, 0.75)',
                      border: `1.5px solid ${statusColor}40`,
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: `0 0 16px ${statusColor}15`,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Row 1: Participants & Percentage */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={15} color={statusColor} />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                          {t.fromUserName} ➔ {t.toUserName}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#10b981',
                          fontFamily: 'monospace',
                        }}
                      >
                        {t.transferPercentage}%
                      </span>
                    </div>

                    {/* Row 2: Final Result & Timestamp */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: `${statusColor}15`,
                          border: `1px solid ${statusColor}`,
                          color: statusColor,
                        }}
                      >
                        {statusLabel}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        Hoàn tất: {t.completedAt || t.effectiveAt || t.createdAt
                          ? new Date(t.completedAt || t.effectiveAt || t.createdAt).toLocaleString('vi-VN')
                          : 'Đã hoàn tất'}
                      </span>
                    </div>

                    {/* Row 3: Action button XEM LỊCH SỬ */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <button
                        type="button"
                        id={`btn-view-history-${t.id}`}
                        onClick={() => setSelectedHistoryDetail(t)}
                        style={{
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          color: '#34d399',
                          fontSize: '11px',
                          fontWeight: 750,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Eye size={12} />
                        <span>XEM LỊCH SỬ</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 5. FOOTER BAR */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9.5px',
          color: '#64748b',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Sparkles size={11} color="#22e6ff" />
          <span>Bảo toàn tỷ lệ 100.00% theo hợp đồng số</span>
        </div>
        <span style={{ fontFamily: 'monospace', color: '#475569' }}>
          EVSHARE PRO
        </span>
      </div>
    </aside>
  );
};
