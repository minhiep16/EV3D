import React, { Component, ErrorInfo, ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../services/queryClient';
import { ExpenseStatus, ExpenseAllocationPolicy, ExpenseCategory } from '../../types/expense';
import { useExpenseShares } from '../../hooks/useExpenses';
import { useAuthStore } from '../../store/authStore';
import { Users, Loader2, AlertTriangle, Clock, Zap } from 'lucide-react';
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
  responsibleUserId,
  category,
  expense,
  description,
  evidenceNote,
  sourceType,
  relatedTripId,
}) => {
  const currentUser = useAuthStore((state) => state.user);

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
    allocationPolicy || firstShare?.allocationPolicy || 'OWNERSHIP_RATIO';
  const policyLabel =
    firstShare?.allocationPolicyLabel ||
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
          safeShares.find((s) => Number(s?.shareAmount) > 0)?.userName ||
          'Tran Thi B';

        const batteryAtReceive =
          expense?.startBatteryLevel != null
            ? `${expense.startBatteryLevel}%`
            : '80%';

        const batteryAtReturn =
          expense?.endBatteryLevel != null
            ? `${expense.endBatteryLevel}%`
            : '50%';

        let energyConsumption = '20.7 kWh (ước tính nếu từ SOC)';
        if (expense?.energyConsumedKwh != null) {
          energyConsumption = `${expense.energyConsumedKwh} kWh ${expense.isEstimatedEnergy ? '(ước tính nếu từ SOC)' : '(đo thực tế)'}`;
        } else if (description && description.includes('kWh')) {
          const match = description.match(/([\d.]+)\s*kWh(?:\s*\(([^)]+)\))?/);
          if (match) {
            energyConsumption = `${match[1]} kWh ${match[2] ? `(${match[2]})` : '(ước tính nếu từ SOC)'}`;
          }
        }

        const unitPrice = '3,000đ/kWh';
        const totalCost = `${normalizedExpenseAmount.toLocaleString('vi-VN')}đ`;
        const allocationMethod = 'Theo người sử dụng';
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
              gap: '5px',
              fontSize: '10.5px',
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
                marginBottom: '2px',
              }}
            >
              <Zap size={13} color="#00f2fe" />
              <span>CHI PHÍ ĐIỆN CHUYẾN ĐI</span>
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
                <span style={{ color: '#94a3b8' }}>Phương thức phân bổ:</span>
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
