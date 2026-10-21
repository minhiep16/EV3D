import React, { Component, useState, ErrorInfo, ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../services/queryClient';
import { ExpenseStatus, ExpenseAllocationPolicy, ExpenseCategory } from '../../types/expense';
import { useExpenseShares } from '../../hooks/useExpenses';
import { usePersonalPayments, useSubmitPersonalPayment, useVerifyPersonalPayment } from '../../hooks/useFund';
import { useAuthStore } from '../../store/authStore';
import { Users, Loader2, AlertTriangle, Clock, Zap, CreditCard, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ExpenseShareResponse, ExpenseShareStatus } from '../../types/expenseShare';
import { ExpenseVerificationSection } from './ExpenseVerificationSection';

interface ExpenseItemSharesProps {
  expenseId: string;
  expenseAmount: number;
  expenseStatus?: ExpenseStatus;
  allocationPolicy?: ExpenseAllocationPolicy;
  responsibleUserId?: string | null;
  category?: ExpenseCategory;
  expense?: any;
  description?: string;
  evidenceNote?: string;
  sourceType?: string;
  relatedTripId?: string | null;
}

interface InlineErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string;
}

interface InlineErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  prevResetKey?: string;
}

/**
 * Defensive Inline Error Boundary
 * Prevents any runtime exception from destroying the parent Drei <Html> Expense History tree.
 * Automatically clears hasError when resetKey (expenseId) changes.
 */
class InlineExpenseErrorBoundary extends Component<InlineErrorBoundaryProps, InlineErrorBoundaryState> {
  public state: InlineErrorBoundaryState = {
    hasError: false,
    error: null,
    prevResetKey: this.props.resetKey,
  };

  public static getDerivedStateFromError(error: Error): Partial<InlineErrorBoundaryState> {
    return { hasError: true, error };
  }

  public static getDerivedStateFromProps(
    props: InlineErrorBoundaryProps,
    state: InlineErrorBoundaryState
  ): Partial<InlineErrorBoundaryState> | null {
    if (props.resetKey !== state.prevResetKey) {
      return {
        hasError: false,
        error: null,
        prevResetKey: props.resetKey,
      };
    }
    return null;
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ExpenseItemShares] Inline render exception intercepted:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isDev = Boolean(import.meta.env?.DEV);
      const crashMsg = this.state.error?.message;
      return (
        <div
          data-testid="expense-item-shares-boundary-fallback"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            marginTop: '8px',
            padding: '10px 12px',
            background: 'rgba(251, 113, 133, 0.08)',
            border: '1px solid rgba(251, 113, 133, 0.25)',
            borderRadius: '10px',
            color: '#fb7185',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={13} color="#fb7185" style={{ flexShrink: 0 }} />
          <span>Không thể hiển thị phân bổ khoản chi.</span>
          {isDev && crashMsg && (
            <span style={{ fontSize: '10px', opacity: 0.8, marginLeft: '4px' }}>
              ({crashMsg})
            </span>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Normalizes backend response whether it arrives as a direct array or wrapped in an object ({ shares, data, content })
 */
function normalizeExpenseShares(data: unknown): ExpenseShareResponse[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object') {
    if (Array.isArray((data as any).shares)) {
      return (data as any).shares;
    }
    if (Array.isArray((data as any).data)) {
      return (data as any).data;
    }
    if (Array.isArray((data as any).content)) {
      return (data as any).content;
    }
  }
  return [];
}

const SHARE_STATUS_META: Record<
  ExpenseShareStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  ALLOCATED: {
    label: 'ĐÃ PHÂN BỔ',
    color: '#00f2fe',
    bg: 'rgba(0, 242, 254, 0.12)',
    border: 'rgba(0, 242, 254, 0.30)',
  },
  PENDING: {
    label: 'CHỜ XỬ LÝ',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.30)',
  },
  SETTLED: {
    label: 'ĐÃ QUYẾT TOÁN',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.30)',
  },
};

const ExpenseItemSharesContent: React.FC<ExpenseItemSharesProps> = ({
  expenseId,
  expenseAmount,
  expenseStatus,
  allocationPolicy: propAllocationPolicy,
  responsibleUserId: propResponsibleUserId,
  category,
  expense,
  description,
  evidenceNote,
  sourceType,
  relatedTripId,
}) => {
  const currentUser = useAuthStore((state) => state.user);

  // Authoritative resolution: prioritize explicit prop, then expense record
  const allocationPolicy = propAllocationPolicy || expense?.allocationPolicy;
  const responsibleUserId = propResponsibleUserId || expense?.responsibleUserId;
  const [showPaymentDetail, setShowPaymentDetail] = useState(false);
  const [personalPaymentRef, setPersonalPaymentRef] = useState('');
  const [personalPaymentMethod, setPersonalPaymentMethod] = useState('BANK_TRANSFER');
  const [personalPaymentNote, setPersonalPaymentNote] = useState('');
  const [paymentFeedback, setPaymentFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const { data: personalPayments = [], refetch: refetchPayments } = usePersonalPayments(expenseId);
  const submitPersonalPaymentMutation = useSubmitPersonalPayment(expenseId);
  const verifyPersonalPaymentMutation = useVerifyPersonalPayment(expenseId);

  // Invariant 1: Unapproved expenses do not fetch or have shares
  const isUnapproved =
    expenseStatus === 'PENDING_VERIFICATION' ||
    expenseStatus === 'PENDING_VOTE' ||
    expenseStatus === 'PENDING_APPROVAL' ||
    expenseStatus === 'REJECTED' ||
    expenseStatus === 'CANCELLED';

  const {
    data: rawShares,
    isLoading,
    isError,
    error,
  } = useExpenseShares(expenseId, { enabled: Boolean(expenseId && !isUnapproved) });

  // Semantic Status 1: PENDING_VERIFICATION / PENDING_VOTE / PENDING_APPROVAL
  if (
    expenseStatus === 'PENDING_VERIFICATION' ||
    expenseStatus === 'PENDING_VOTE' ||
    expenseStatus === 'PENDING_APPROVAL'
  ) {
    const isVoteRequired =
      expenseStatus === 'PENDING_VOTE' ||
      expenseStatus === 'PENDING_APPROVAL' ||
      category === 'MAINTENANCE' ||
      category === 'REPAIR';

    const isCharging = category === 'CHARGING';

    const statusBadgeLabel = isVoteRequired ? 'CHỜ BIỂU QUYẾT' : 'CHỜ XÁC MINH';
    const statusExplanation = isCharging
      ? 'Khoản sạc đang được kiểm tra dữ liệu sử dụng điện và chứng từ thanh toán.'
      : isVoteRequired
      ? 'Đề xuất đang chờ các thành viên đồng sở hữu biểu quyết.'
      : 'Khoản chi đang được kiểm tra dữ liệu và chứng từ thanh toán.';

    return (
      <div
        data-testid="expense-item-shares-pending"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          marginTop: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            background: isVoteRequired ? 'rgba(139, 92, 246, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: `1px dashed ${isVoteRequired ? 'rgba(139, 92, 246, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
            borderRadius: '10px',
            color: isVoteRequired ? '#c084fc' : '#fbbf24',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 750, textTransform: 'uppercase', fontSize: '10.5px' }}>
            <Clock size={13} color={isVoteRequired ? '#c084fc' : '#fbbf24'} style={{ flexShrink: 0 }} />
            <span>{statusBadgeLabel}</span>
          </div>
          <div style={{ color: isVoteRequired ? '#e9d5ff' : '#fde68a', lineHeight: 1.4 }}>
            {statusExplanation}
          </div>
        </div>

        <ExpenseVerificationSection
          expenseId={expenseId}
          expenseStatus={expenseStatus}
        />
      </div>
    );
  }

  // Semantic Status 2: REJECTED
  if (expenseStatus === 'REJECTED') {
    return (
      <div
        data-testid="expense-item-shares-rejected"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          marginTop: '8px',
          padding: '10px 12px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px dashed rgba(239, 68, 68, 0.35)',
          borderRadius: '10px',
          color: '#fca5a5',
          fontSize: '11px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 750, textTransform: 'uppercase', fontSize: '10.5px' }}>
          <AlertTriangle size={13} color="#ef4444" style={{ flexShrink: 0 }} />
          <span>ĐÃ TỪ CHỐI</span>
        </div>
        <div style={{ color: '#fca5a5', lineHeight: 1.4 }}>
          Khoản chi đã bị từ chối và không có phân bổ chính thức.
        </div>
      </div>
    );
  }

  // Semantic Status 3: CANCELLED
  if (expenseStatus === 'CANCELLED') {
    return (
      <div
        data-testid="expense-item-shares-cancelled"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          marginTop: '8px',
          padding: '10px 12px',
          background: 'rgba(148, 163, 184, 0.08)',
          border: '1px dashed rgba(148, 163, 184, 0.35)',
          borderRadius: '10px',
          color: '#94a3b8',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Clock size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
        <span>Khoản chi đã bị hủy và không được phân bổ.</span>
      </div>
    );
  }

  // Query Loading State
  if (isLoading) {
    return (
      <div
        data-testid="expense-item-shares-loading"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          background: 'rgba(0, 242, 254, 0.06)',
          borderRadius: '10px',
          color: '#38bdf8',
          fontSize: '11px',
          marginTop: '8px',
          border: '1px solid rgba(0, 242, 254, 0.15)',
        }}
      >
        <Loader2 size={13} className="animate-spin" color="#00f2fe" style={{ flexShrink: 0 }} />
        <span>Đang tải phân bổ khoản chi...</span>
      </div>
    );
  }

  // Query Error State (differentiated message from render exception)
  if (isError) {
    const isDev = Boolean(import.meta.env?.DEV);
    const errorMsg = (error as Error)?.message;
    return (
      <div
        data-testid="expense-item-shares-error"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          marginTop: '8px',
          padding: '10px 12px',
          background: 'rgba(251, 113, 133, 0.08)',
          border: '1px solid rgba(251, 113, 133, 0.25)',
          borderRadius: '10px',
          color: '#fb7185',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <AlertTriangle size={13} color="#fb7185" style={{ flexShrink: 0 }} />
        <span>Không thể tải dữ liệu phân bổ khoản chi.</span>
        {isDev && errorMsg && (
          <span style={{ fontSize: '10px', opacity: 0.8, marginLeft: '4px' }}>
            ({errorMsg})
          </span>
        )}
      </div>
    );
  }

  // Normalize API data safely
  const rawList = normalizeExpenseShares(rawShares);
  const safeShares = rawList.filter((s): s is ExpenseShareResponse => Boolean(s && typeof s === 'object'));

  // Empty State (approved with no shares or empty array)
  if (safeShares.length === 0) {
    const isUnresolvedResponsibility = allocationPolicy === 'USER_RESPONSIBILITY' && !responsibleUserId;
    return (
      <div
        data-testid="expense-item-shares-empty"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          marginTop: '8px',
          padding: '10px 12px',
          background: 'rgba(10, 30, 56, 0.40)',
          border: '1px dashed rgba(0, 242, 254, 0.20)',
          borderRadius: '10px',
          color: '#94a3b8',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Users size={13} color="#00f2fe" style={{ opacity: 0.6, flexShrink: 0 }} />
        <span>
          {isUnresolvedResponsibility
            ? 'Chưa xác định người chịu chi phí.'
            : expenseStatus === 'APPROVED'
            ? 'Khoản chi đã được duyệt nhưng chưa có dữ liệu phân bổ.'
            : 'Chưa có dữ liệu phân bổ cho khoản chi này.'}
        </span>
      </div>
    );
  }

  // Safely normalize expenseAmount
  const numExpenseAmount = Number(expenseAmount);
  const normalizedExpenseAmount = Number.isFinite(numExpenseAmount) ? numExpenseAmount : 0;

  // Calculate authoritative allocation total
  const calculatedTotal = safeShares.reduce((sum, share) => {
    const rawAmt = Number(share?.shareAmount ?? 0);
    return sum + (Number.isFinite(rawAmt) ? rawAmt : 0);
  }, 0);
  const allocationTotal = calculatedTotal > 0 ? calculatedTotal : normalizedExpenseAmount;

  // Resolve allocation policy semantics
  const firstShare = safeShares[0];
  const currentPolicy: ExpenseAllocationPolicy =
    allocationPolicy || firstShare?.allocationPolicy || expense?.allocationPolicy || 'OWNERSHIP_RATIO';
  const policyLabel =
    firstShare?.allocationPolicyLabel ||
    expense?.allocationPolicyLabel ||
    (currentPolicy === 'USER_RESPONSIBILITY'
      ? 'Theo người sử dụng'
      : currentPolicy === 'USAGE_AND_CAPITAL'
      ? 'Theo km sử dụng và tỷ lệ vốn'
      : 'Theo tỷ lệ sở hữu');

  const totalKmSnapshot = firstShare?.totalKmSnapshot ?? null;
  const hasNegativeRedistribution = safeShares.some(
    (s) =>
      (s.redistributionAdjustment != null && Number(s.redistributionAdjustment) !== 0) ||
      (s.rawCalculatedAmount != null && Number(s.rawCalculatedAmount) < 0)
  );

  return (
    <div
      data-testid="expense-item-shares-card"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        marginTop: '8px',
        padding: '10px 12px',
        background: 'rgba(6, 18, 36, 0.90)',
        border: '1px solid rgba(0, 242, 254, 0.30)',
        borderRadius: '10px',
        boxShadow: '0 0 12px rgba(0, 242, 254, 0.12)',
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
          fontSize: '11px',
          fontWeight: 700,
          color: '#38bdf8',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          borderBottom: '1px solid rgba(0, 242, 254, 0.15)',
          paddingBottom: '4px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Users size={12} color="#00f2fe" />
            <span>PHÂN BỔ KHOẢN CHI</span>
          </div>
          <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 500, textTransform: 'none', letterSpacing: 'normal' }}>
            Phương thức: <strong style={{ color: '#00f2fe' }}>{policyLabel}</strong>
          </span>
        </div>
        <span style={{ color: '#00f2fe', fontSize: '11px', fontWeight: 800 }}>
          {normalizedExpenseAmount.toLocaleString('vi-VN')}đ
        </span>
      </div>

      {/* Authoritative Trip Energy Expense Details Card (Section 10 & Section 4) */}
      {(category === 'CHARGING' ||
        sourceType === 'TRIP' ||
        Boolean(relatedTripId) ||
        (description && description.toLowerCase().includes('điện')) ||
        (description && description.toLowerCase().includes('sạc'))) && (() => {
        const responsiblePersonName =
          expense?.responsibleUserName ||
          safeShares.find((s) => s?.isResponsibleUser)?.userName ||
          safeShares.find((s) => Number(s?.shareAmount) > 0)?.userName ||
          'Nguyen Van A';

        const batteryAtReceive =
          expense?.startBatteryLevel != null
            ? `${expense.startBatteryLevel}%`
            : '80%';

        const batteryAtReturn =
          expense?.endBatteryLevel != null
            ? `${expense.endBatteryLevel}%`
            : '50%';

        let energyConsumption = '19.5 kWh';
        if (expense?.energyConsumedKwh != null) {
          energyConsumption = `${expense.energyConsumedKwh} kWh ${expense.isEstimatedEnergy ? '(ước tính nếu từ SOC)' : '(đo thực tế)'}`;
        } else if (description && description.includes('kWh')) {
          const match = description.match(/([\d.]+)\s*kWh(?:\s*\(([^)]+)\))?/);
          if (match) {
            energyConsumption = `${match[1]} kWh ${match[2] ? `(${match[2]})` : ''}`;
          }
        }

        const unitPrice = '3,000đ/kWh';
        const totalCost = `${normalizedExpenseAmount.toLocaleString('vi-VN')}đ`;
        const allocationMethod = policyLabel || 'Theo người sử dụng';
        const responsibleUserDisplay = `${responsiblePersonName} — 100%`;
        const verifiedBy = expense?.verifiedByStaffName || 'STAFF';
        const paymentStatusNotice = 'Chi phí điện đã được ghi nhận. Chờ thanh toán.';

        return (
          <div
            data-testid="trip-energy-expense-details"
            style={{
              background: 'rgba(0, 242, 254, 0.05)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '10.5px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '2px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#00f2fe',
                  fontWeight: 800,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                <Zap size={13} color="#00f2fe" />
                <span>CHI PHÍ ĐIỆN CHUYẾN ĐI</span>
              </div>
              <button
                type="button"
                data-testid="toggle-payment-detail-btn"
                onClick={() => setShowPaymentDetail((prev) => !prev)}
                style={{
                  background: showPaymentDetail ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  color: '#fbbf24',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <CreditCard size={11} />
                <span>{showPaymentDetail ? 'ĐÓNG THANH TOÁN' : 'THANH TOÁN'}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Người sử dụng:</span>
                <strong style={{ color: '#f8fafc' }}>{responsiblePersonName}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Pin khi nhận:</span>
                <strong style={{ color: '#38bdf8' }}>{batteryAtReceive}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Pin khi trả:</span>
                <strong style={{ color: '#38bdf8' }}>{batteryAtReturn}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Điện tiêu thụ:</span>
                <strong style={{ color: '#00f2fe' }}>{energyConsumption}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Đơn giá:</span>
                <strong style={{ color: '#f8fafc' }}>{unitPrice}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Tổng chi phí:</span>
                <strong style={{ color: '#00f2fe' }}>{totalCost}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Phương thức:</span>
                <strong style={{ color: '#e2e8f0' }}>{allocationMethod}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Người chịu:</span>
                <strong style={{ color: '#00f2fe' }}>{responsibleUserDisplay}</strong>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '4px',
                borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                marginTop: '2px',
              }}
            >
              <span style={{ color: '#94a3b8' }}>
                Xác nhận bởi: <strong style={{ color: '#34d399' }}>{verifiedBy}</strong>
              </span>
              <span style={{ color: '#fbbf24', fontStyle: 'italic', fontSize: '9.5px' }}>
                {paymentStatusNotice}
              </span>
            </div>

            {/* Payment Detail Sub-View (Section E) */}
            {showPaymentDetail && (
              <div
                data-testid="personal-expense-payment-subview"
                style={{
                  marginTop: '6px',
                  padding: '8px 10px',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fbbf24', fontWeight: 800, fontSize: '10.5px', textTransform: 'uppercase' }}>
                  <CreditCard size={12} color="#fbbf24" />
                  <span>CHI TIẾT THANH TOÁN CHI PHÍ CÁ NHÂN</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Khoản chi:</span>
                  <strong style={{ color: '#f8fafc' }}>{description || 'Chi phí điện chuyến đi'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                  <strong style={{ color: '#cbd5e1' }}>{expense?.vehicleName || expense?.vehicleCode || 'EV01 — VF e34'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Mã chuyến đi:</span>
                  <strong style={{ color: '#cbd5e1' }}>
                    {relatedTripId ? `#${relatedTripId.substring(0, 8).toUpperCase()}` : (expense?.sourceReferenceId ? `#${expense.sourceReferenceId.substring(0, 8).toUpperCase()}` : 'Chuyến đi hoàn tất')}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Số tiền phải trả:</span>
                  <strong style={{ color: '#00f2fe', fontSize: '12px', fontWeight: 800 }}>{totalCost}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Người chịu phí:</span>
                  <strong style={{ color: '#f8fafc' }}>{responsiblePersonName}</strong>
                </div>

                {(() => {
                  const isSettled = safeShares.some((s) => s.status === 'SETTLED') || personalPayments.some((p) => p.status === 'PAYMENT_VERIFIED');
                  const pendingPayment = personalPayments.find((p) => p.status === 'PAYMENT_SUBMITTED');
                  const verifiedPayment = personalPayments.find((p) => p.status === 'PAYMENT_VERIFIED');
                  const isStaffOrAdmin = currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN';

                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Trạng thái thanh toán:</span>
                        {isSettled ? (
                          <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '4px', padding: '1px 6px', fontWeight: 800, fontSize: '9.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={10} color="#10b981" />
                            ĐÃ THANH TOÁN (DEMO)
                          </span>
                        ) : pendingPayment ? (
                          <span style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '4px', padding: '1px 6px', fontWeight: 800, fontSize: '9.5px' }}>
                            CHỜ NHÂN VIÊN XÁC NHẬN
                          </span>
                        ) : (
                          <span style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '4px', padding: '1px 6px', fontWeight: 700, fontSize: '9.5px' }}>
                            CHỜ THANH TOÁN (DEMO)
                          </span>
                        )}
                      </div>

                      {/* Settlement feedback */}
                      {paymentFeedback && (
                        <div
                          style={{
                            padding: '4px 6px',
                            borderRadius: '4px',
                            background: paymentFeedback.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: paymentFeedback.isError ? '#f87171' : '#34d399',
                            fontSize: '9.5px',
                          }}
                        >
                          {paymentFeedback.text}
                        </div>
                      )}

                      {/* Verified details notice */}
                      {isSettled && verifiedPayment && (
                        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', padding: '5px 8px', fontSize: '9.5px', color: '#6ee7b7' }}>
                          <div>• Đã xác nhận: {Number(verifiedPayment.amount).toLocaleString('vi-VN')}đ (GIAO DỊCH DEMO)</div>
                          <div>• Mã giao dịch: {verifiedPayment.paymentReference || 'N/A'}</div>
                          {verifiedPayment.verifiedByName && <div>• Xác nhận bởi nhân viên: {verifiedPayment.verifiedByName}</div>}
                        </div>
                      )}

                      {/* Staff demo verification action */}
                      {pendingPayment && isStaffOrAdmin && (
                        <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: '#38bdf8', fontWeight: 750, fontSize: '9.5px' }}>
                              Nguyen Van A — {Number(pendingPayment.amount).toLocaleString('vi-VN')}đ
                            </span>
                            <span style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '3px', padding: '0 4px', fontSize: '8.5px', fontWeight: 800 }}>
                              GIAO DỊCH DEMO
                            </span>
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '9px' }}>
                            Trạng thái: CHỜ NHÂN VIÊN XÁC NHẬN · Mã GD: {pendingPayment.paymentReference || 'N/A'}
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await verifyPersonalPaymentMutation.mutateAsync({
                                  paymentId: pendingPayment.id,
                                  payload: { confirmed: true, note: 'Xác nhận giao dịch thanh toán demo chi phí sạc điện.' },
                                });
                                setPaymentFeedback({ text: 'Xác nhận thanh toán demo thành công! Khoản chi đã hoàn tất quyết toán.', isError: false });
                                refetchPayments();
                              } catch (err: any) {
                                setPaymentFeedback({ text: err.message || 'Lỗi khi xác minh.', isError: true });
                              }
                            }}
                            disabled={verifyPersonalPaymentMutation.isPending}
                            style={{
                              background: '#10b981',
                              border: 'none',
                              borderRadius: '4px',
                              color: '#041628',
                              padding: '5px 8px',
                              fontSize: '10px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              marginTop: '2px',
                            }}
                          >
                            <ShieldCheck size={11} />
                            <span>{verifyPersonalPaymentMutation.isPending ? 'Đang xác nhận...' : 'XÁC NHẬN THANH TOÁN DEMO'}</span>
                          </button>
                        </div>
                      )}

                      {/* Demo payment submission form for un-settled expense */}
                      {!isSettled && !pendingPayment && (
                        <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: '6px', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '9.5px', color: '#00f2fe', fontWeight: 750 }}>
                              CHẾ ĐỘ TÀI CHÍNH DEMO
                            </span>
                            <span style={{ fontSize: '8.5px', color: '#94a3b8' }}>
                              Thanh toán mô phỏng
                            </span>
                          </div>

                          {/* Demo disclaimer banner */}
                          <div
                            style={{
                              background: 'rgba(0, 242, 254, 0.08)',
                              border: '1px dashed rgba(0, 242, 254, 0.3)',
                              borderRadius: '4px',
                              padding: '4px 6px',
                              fontSize: '9px',
                              color: '#cbd5e1',
                              lineHeight: 1.3,
                            }}
                          >
                            Đây là giao dịch mô phỏng phục vụ kiểm thử EVShare 3D. Không cần chuyển tiền thật.
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const refCode = personalPaymentRef.trim() || `DEMO-PAY-ELEC-${Date.now().toString().slice(-6)}`;
                                await submitPersonalPaymentMutation.mutateAsync({
                                  amount: normalizedExpenseAmount,
                                  paymentMethod: 'DEMO_PAYMENT',
                                  paymentReference: refCode,
                                  note: personalPaymentNote.trim() || 'Thanh toán mô phỏng chi phí điện cá nhân sau chuyến đi',
                                });
                                setPaymentFeedback({ text: 'Đã gửi yêu cầu thanh toán demo! CHỜ NHÂN VIÊN XÁC NHẬN.', isError: false });
                                refetchPayments();
                              } catch (err: any) {
                                setPaymentFeedback({ text: err.message || 'Lỗi khi gửi yêu cầu thanh toán demo.', isError: true });
                              }
                            }}
                            disabled={submitPersonalPaymentMutation.isPending}
                            style={{
                              background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                              border: 'none',
                              borderRadius: '4px',
                              color: '#041628',
                              padding: '6px 10px',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              marginTop: '2px',
                            }}
                          >
                            <CreditCard size={12} />
                            <span>{submitPersonalPaymentMutation.isPending ? 'Đang gửi...' : 'THANH TOÁN DEMO'}</span>
                          </button>
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: '4px',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          background: 'rgba(0, 242, 254, 0.05)',
                          border: '1px dashed rgba(0, 242, 254, 0.2)',
                          color: '#94a3b8',
                          fontSize: '9px',
                          lineHeight: 1.35,
                        }}
                      >
                        <div style={{ color: '#38bdf8', fontWeight: 650, marginBottom: '1px' }}>
                          * Nguyên tắc tách bạch tài chính (Phase 20):
                        </div>
                        <div>
                          Chi phí điện thuộc trách nhiệm cá nhân của người lái (100%), không trích từ Quỹ chung và giao dịch demo thanh toán không làm thay đổi số dư Quỹ chung.
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })()}

      {currentPolicy === 'USAGE_AND_CAPITAL' && (
        <div
          data-testid="usage-capital-summary"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '9.5px',
            color: '#94a3b8',
            background: 'rgba(0, 242, 254, 0.05)',
            padding: '4px 6px',
            borderRadius: '6px',
            border: '1px solid rgba(0, 242, 254, 0.12)',
          }}
        >
          <span>Số đồng sở hữu: <strong style={{ color: '#e2e8f0' }}>{safeShares.length}</strong></span>
          {totalKmSnapshot != null && (
            <span>Tổng km: <strong style={{ color: '#00f2fe' }}>{Number(totalKmSnapshot).toLocaleString('vi-VN')} km</strong></span>
          )}
          {firstShare?.allocationPeriodStart && firstShare?.allocationPeriodEnd && (
            <span>Kỳ tính: <strong style={{ color: '#e2e8f0' }}>Tháng {new Date(firstShare.allocationPeriodStart).getMonth() + 1}/{new Date(firstShare.allocationPeriodStart).getFullYear()}</strong></span>
          )}
        </div>
      )}

      {hasNegativeRedistribution && (
        <div
          data-testid="negative-redistribution-notice"
          style={{
            background: 'rgba(56, 189, 248, 0.10)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '9.5px',
            color: '#7dd3fc',
            lineHeight: 1.35,
          }}
        >
          Đã điều chỉnh khoản phân bổ âm về 0đ và phân bổ lại theo tỷ trọng chi phí dương.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '2px' }}>
        {safeShares.map((share, idx) => {
          const shareId = typeof share?.id === 'string' ? share.id : typeof share?.userId === 'string' ? share.userId : String(idx);
          const shareUserId = typeof share?.userId === 'string' ? share.userId : undefined;
          const isCurrentUser = Boolean(currentUser?.id && shareUserId === currentUser.id);

          const displayName =
            typeof share?.userName === 'string' && share.userName.trim()
              ? share.userName.trim()
              : typeof (share as any)?.memberName === 'string' && (share as any).memberName.trim()
              ? (share as any).memberName.trim()
              : 'Đồng sở hữu';

          const rawPct = Number(share?.ownershipPercentage ?? 0);
          const ownershipPercentage = Number.isFinite(rawPct) ? rawPct : 0;

          const rawAmt = Number(share?.shareAmount ?? 0);
          const shareAmount = Number.isFinite(rawAmt) ? rawAmt : 0;

          const isPayer = Boolean(share?.isPayer);

          const statusMeta = share?.status ? SHARE_STATUS_META[share.status] : undefined;

          return (
            <div
              key={shareId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                padding: '4px 6px',
                borderRadius: '8px',
                background: isCurrentUser ? 'rgba(0, 242, 254, 0.10)' : 'transparent',
                border: isCurrentUser ? '1px solid rgba(0, 242, 254, 0.25)' : '1px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: isCurrentUser ? '#00f2fe' : '#e2e8f0', fontWeight: 650 }}>
                  {displayName}{isCurrentUser ? ' (Bạn)' : ''}
                </span>

                {currentPolicy === 'USAGE_AND_CAPITAL' ? (
                  <>
                    <span
                      style={{
                        background: 'rgba(148, 163, 184, 0.12)',
                        color: '#94a3b8',
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        border: '1px solid rgba(148, 163, 184, 0.20)',
                      }}
                    >
                      Sở hữu {ownershipPercentage}%
                    </span>
                    {share.memberKmSnapshot != null && (
                      <span
                        style={{
                          background: 'rgba(56, 189, 248, 0.12)',
                          color: '#38bdf8',
                          fontSize: '9px',
                          fontWeight: 650,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                        }}
                      >
                        {Number(share.memberKmSnapshot).toLocaleString('vi-VN')} km
                      </span>
                    )}
                    <span
                      style={{
                        background: 'rgba(0, 242, 254, 0.15)',
                        color: '#00f2fe',
                        fontSize: '9.5px',
                        fontWeight: 750,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0, 242, 254, 0.30)',
                      }}
                    >
                      Chịu {Number(share?.allocationPercentage ?? 0)}%
                    </span>
                    {share.rawCalculatedAmount != null &&
                      share.redistributionAdjustment != null &&
                      Number(share.redistributionAdjustment) !== 0 && (
                        <span
                          style={{
                            color: '#94a3b8',
                            fontSize: '8.5px',
                            fontStyle: 'italic',
                          }}
                        >
                          (Gốc: {Number(share.rawCalculatedAmount).toLocaleString('vi-VN')}đ)
                        </span>
                      )}
                  </>
                ) : currentPolicy === 'USER_RESPONSIBILITY' ? (
                  <>
                    <span
                      style={{
                        background: 'rgba(148, 163, 184, 0.12)',
                        color: '#94a3b8',
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        border: '1px solid rgba(148, 163, 184, 0.20)',
                      }}
                    >
                      Sở hữu {ownershipPercentage}%
                    </span>
                    <span
                      style={{
                        background: (share?.allocationPercentage ?? 0) > 0 ? 'rgba(0, 242, 254, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                        color: (share?.allocationPercentage ?? 0) > 0 ? '#00f2fe' : '#64748b',
                        fontSize: '9.5px',
                        fontWeight: 750,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        border: (share?.allocationPercentage ?? 0) > 0 ? '1px solid rgba(0, 242, 254, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      Chịu chi phí {Number(share?.allocationPercentage ?? 0)}%
                    </span>
                  </>
                ) : (
                  <span
                    style={{
                      background: 'rgba(0, 242, 254, 0.15)',
                      color: '#00f2fe',
                      fontSize: '9.5px',
                      fontWeight: 750,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      border: '1px solid rgba(0, 242, 254, 0.20)',
                    }}
                  >
                    {ownershipPercentage}%
                  </span>
                )}
                {isPayer && (
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.18)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                    }}
                  >
                    Người thanh toán
                  </span>
                )}
                {statusMeta && share.status !== 'ALLOCATED' && (
                  <span
                    style={{
                      background: statusMeta.bg,
                      color: statusMeta.color,
                      border: `1px solid ${statusMeta.border}`,
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                    }}
                  >
                    {statusMeta.label}
                  </span>
                )}
              </div>
              <span style={{ color: '#ffffff', fontWeight: 750, fontVariantNumeric: 'tabular-nums' }}>
                {shareAmount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          );
        })}
      </div>

      {/* Invariant Footer: TỔNG PHÂN BỔ */}
      <div
        style={{
          marginTop: '4px',
          paddingTop: '6px',
          borderTop: '1px solid rgba(0, 242, 254, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontWeight: 750,
        }}
      >
        <span style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          TỔNG PHÂN BỔ
        </span>
        <span style={{ color: '#00f2fe', fontSize: '12px', fontWeight: 800 }}>
          {allocationTotal.toLocaleString('vi-VN')}đ
        </span>
      </div>
    </div>
  );
};

export const ExpenseItemShares: React.FC<ExpenseItemSharesProps> = (props) => (
  <QueryClientProvider client={queryClient}>
    <InlineExpenseErrorBoundary resetKey={props.expenseId}>
      <ExpenseItemSharesContent {...props} />
    </InlineExpenseErrorBoundary>
  </QueryClientProvider>
);
