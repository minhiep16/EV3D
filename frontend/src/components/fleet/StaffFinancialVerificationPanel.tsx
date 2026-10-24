import React, { useState, useMemo } from 'react';
import { VehicleResponse } from '../../types/vehicle';
import {
  useFundSummary,
  useFundContributions,
  usePendingPersonalPayments,
  useVerifyContribution,
  useVerifyPersonalPayment,
} from '../../hooks/useFund';
import {
  FundContributionResponse,
  PersonalExpensePaymentResponse,
} from '../../types/fund';
import { formatDateTime } from '../../utils/dateTimeUtils';
import {
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Clock,
  User,
  Wallet,
  Car,
  FileText,
  BadgeAlert,
  Sparkles,
} from 'lucide-react';

interface StaffFinancialVerificationPanelProps {
  vehicle: VehicleResponse;
  onBack?: () => void;
  onClose?: () => void;
}

type VerificationTab = 'CONTRIBUTIONS' | 'PERSONAL_PAYMENTS';

function formatVnd(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export const StaffFinancialVerificationPanel: React.FC<StaffFinancialVerificationPanelProps> = ({
  vehicle,
  onBack,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<VerificationTab>('CONTRIBUTIONS');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // 1. Resolve Active Group and Fund for this Vehicle
  const {
    data: fundSummary,
    isLoading: isFundLoading,
    isError: isFundError,
    refetch: refetchFundSummary,
  } = useFundSummary(vehicle.id);

  const resolvedFundId = fundSummary?.fundId || fundSummary?.id;
  const resolvedGroupName = fundSummary?.groupName || 'Nhóm đồng sở hữu';

  // 2. Load Fund Contributions for this Fund
  const {
    data: contributions = [],
    isLoading: isContribLoading,
    isError: isContribError,
    refetch: refetchContributions,
  } = useFundContributions(resolvedFundId);

  // 3. Load Pending Personal Payments for this Vehicle
  const {
    data: pendingPersonalPayments = [],
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
    refetch: refetchPersonalPayments,
  } = usePendingPersonalPayments(vehicle.id);

  // Filter pending fund contributions (status === 'PENDING')
  const pendingContributions = useMemo(() => {
    return contributions.filter((c) => c.status === 'PENDING');
  }, [contributions]);

  // Mutations
  const verifyContributionMutation = useVerifyContribution(resolvedFundId, vehicle.id);
  const verifyPersonalPaymentMutation = useVerifyPersonalPayment(undefined, vehicle.id);

  // Handle Confirm / Reject Contribution
  const handleVerifyContribution = async (contribution: FundContributionResponse, confirmed: boolean) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await verifyContributionMutation.mutateAsync({
        contributionId: contribution.id,
        payload: {
          confirmed,
          note: confirmed
            ? 'Xác nhận đối soát đóng góp demo bởi Nhân viên vận hành'
            : 'Từ chối bởi Nhân viên vận hành',
        },
        fundId: resolvedFundId,
      });

      if (confirmed) {
        setActionSuccess(`Đã xác nhận đóng góp demo ${formatVnd(contribution.amount)} từ ${contribution.contributorName}.`);
      } else {
        setActionSuccess(`Đã từ chối yêu cầu đóng góp từ ${contribution.contributorName}.`);
      }
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Xử lý đóng góp thất bại. Vui lòng thử lại.');
    }
  };

  // Handle Confirm / Reject Personal Payment
  const handleVerifyPersonalPayment = async (payment: PersonalExpensePaymentResponse, confirmed: boolean) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await verifyPersonalPaymentMutation.mutateAsync({
        paymentId: payment.id,
        payload: {
          confirmed,
          note: confirmed
            ? 'Xác nhận thanh toán điện demo bởi Nhân viên vận hành'
            : 'Từ chối bởi Nhân viên vận hành',
        },
      });

      if (confirmed) {
        setActionSuccess(`Đã xác nhận thanh toán demo ${formatVnd(payment.amount)} từ ${payment.payerName}.`);
      } else {
        setActionSuccess(`Đã từ chối thanh toán từ ${payment.payerName}.`);
      }
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Xử lý thanh toán thất bại. Vui lòng thử lại.');
    }
  };

  const handleRetryAll = () => {
    setActionError(null);
    refetchFundSummary();
    refetchContributions();
    refetchPersonalPayments();
  };

  const isContributionsTabLoading = isFundLoading || isContribLoading;
  const isContributionsTabError = isFundError || isContribError;

  return (
    <div
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        color: '#f8fafc',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '10px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Quay lại"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <ArrowLeft size={15} />
            </button>
          )}

          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid #00f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f2fe',
            }}
          >
            <ShieldCheck size={16} />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.04em',
                lineHeight: 1.2,
              }}
            >
              DUYỆT GIAO DỊCH TÀI CHÍNH
            </h2>
            <div style={{ fontSize: '10.5px', color: '#38bdf8', marginTop: '2px' }}>
              {vehicle.name} • {resolvedGroupName}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Đóng bảng"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
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

      {/* Demo Financial Mode Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 242, 254, 0.08)',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00f2fe', fontWeight: 700 }}>
          <Sparkles size={13} />
          <span>CHẾ ĐỘ TÀI CHÍNH DEMO</span>
        </div>
        <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
          Số dư quỹ: <strong style={{ color: '#34d399' }}>{formatVnd(fundSummary?.availableBalance ?? 0)}</strong>
        </div>
      </div>

      {/* Tabs: ĐÓNG GÓP QUỸ | THANH TOÁN CÁ NHÂN */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}
      >
        {/* Tab 1: ĐÓNG GÓP QUỸ */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('CONTRIBUTIONS');
            setActionError(null);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: activeTab === 'CONTRIBUTIONS' ? 'rgba(0, 242, 254, 0.22)' : 'transparent',
            border: activeTab === 'CONTRIBUTIONS' ? '1px solid #00f2fe' : '1px solid transparent',
            color: activeTab === 'CONTRIBUTIONS' ? '#00f2fe' : '#94a3b8',
            borderRadius: '8px',
            padding: '7px 4px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Wallet size={13} />
          <span>ĐÓNG GÓP QUỸ</span>
          {pendingContributions.length > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '999px',
                lineHeight: 1.2,
              }}
            >
              {pendingContributions.length}
            </span>
          )}
        </button>

        {/* Tab 2: THANH TOÁN CÁ NHÂN */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('PERSONAL_PAYMENTS');
            setActionError(null);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: activeTab === 'PERSONAL_PAYMENTS' ? 'rgba(0, 242, 254, 0.22)' : 'transparent',
            border: activeTab === 'PERSONAL_PAYMENTS' ? '1px solid #00f2fe' : '1px solid transparent',
            color: activeTab === 'PERSONAL_PAYMENTS' ? '#00f2fe' : '#94a3b8',
            borderRadius: '8px',
            padding: '7px 4px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Car size={13} />
          <span>THANH TOÁN CÁ NHÂN</span>
          {pendingPersonalPayments.length > 0 && (
            <span
              style={{
                background: '#f59e0b',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '999px',
                lineHeight: 1.2,
              }}
            >
              {pendingPersonalPayments.length}
            </span>
          )}
        </button>
      </div>

      {/* Feedback Alerts */}
      {actionSuccess && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '11px',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Check size={14} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '11px',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertCircle size={14} />
          <span>{actionError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ĐÓNG GÓP QUỸ                                                       */}
      {/* ========================================================================= */}
      {activeTab === 'CONTRIBUTIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isContributionsTabLoading && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '10px',
                padding: '24px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <RefreshCw size={18} className="animate-spin" color="#00f2fe" />
              <span>Đang tải yêu cầu chờ xác nhận...</span>
            </div>
          )}

          {!isContributionsTabLoading && isContributionsTabError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '20px 16px',
                textAlign: 'center',
                color: '#f87171',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={20} />
              <span>Không thể tải danh sách giao dịch.</span>
              <button
                type="button"
                onClick={handleRetryAll}
                style={{
                  marginTop: '4px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Thử lại
              </button>
            </div>
          )}

          {!isContributionsTabLoading && !isContributionsTabError && pendingContributions.length === 0 && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '10px',
                padding: '28px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '12px',
              }}
            >
              <div style={{ color: '#64748b', marginBottom: '4px' }}>
                <Wallet size={24} style={{ margin: '0 auto 6px auto', display: 'block' }} />
              </div>
              Không có giao dịch đang chờ xác nhận.
            </div>
          )}

          {!isContributionsTabLoading && !isContributionsTabError && pendingContributions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingContributions.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                  }}
                >
                  {/* Item Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} color="#00f2fe" />
                        <span>{c.contributorName}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        Nhóm: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{c.groupName || resolvedGroupName}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>
                        {formatVnd(c.amount)}
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          color: '#fbbf24',
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '999px',
                          marginTop: '3px',
                        }}
                      >
                        <Clock size={10} />
                        <span>{c.statusLabel || 'CHỜ XÁC NHẬN'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div
                    style={{
                      background: 'rgba(2, 6, 23, 0.5)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>Thời gian tạo:</span>
                      <span style={{ color: '#cbd5e1' }}>{formatDateTime(c.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>Chế độ giao dịch:</span>
                      <span style={{ color: '#00f2fe', fontWeight: 700 }}>
                        {c.financialModeLabel || 'GIAO DỊCH DEMO'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>Mã tham chiếu:</span>
                      <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                        {c.paymentReference || c.id.substring(0, 8)}
                      </span>
                    </div>
                    {c.note && (
                      <div style={{ color: '#94a3b8', fontSize: '10.5px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '4px', marginTop: '2px' }}>
                        Ghi chú: <span style={{ color: '#e2e8f0' }}>{c.note}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginTop: '2px' }}>
                    <button
                      type="button"
                      disabled={verifyContributionMutation.isPending}
                      onClick={() => handleVerifyContribution(c, true)}
                      style={{
                        background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                        border: 'none',
                        color: '#041324',
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        cursor: verifyContributionMutation.isPending ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        opacity: verifyContributionMutation.isPending ? 0.6 : 1,
                        boxShadow: '0 4px 12px rgba(0, 242, 254, 0.25)',
                      }}
                    >
                      <Check size={14} />
                      <span>XÁC NHẬN ĐÓNG GÓP DEMO</span>
                    </button>

                    <button
                      type="button"
                      disabled={verifyContributionMutation.isPending}
                      onClick={() => handleVerifyContribution(c, false)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        fontWeight: 700,
                        fontSize: '11px',
                        padding: '8px 6px',
                        borderRadius: '8px',
                        cursor: verifyContributionMutation.isPending ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        opacity: verifyContributionMutation.isPending ? 0.6 : 1,
                      }}
                    >
                      <X size={14} />
                      <span>TỪ CHỐI</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: THANH TOÁN CÁ NHÂN                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'PERSONAL_PAYMENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isPaymentsLoading && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '10px',
                padding: '24px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <RefreshCw size={18} className="animate-spin" color="#00f2fe" />
              <span>Đang tải yêu cầu chờ xác nhận...</span>
            </div>
          )}

          {!isPaymentsLoading && isPaymentsError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '20px 16px',
                textAlign: 'center',
                color: '#f87171',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={20} />
              <span>Không thể tải danh sách giao dịch.</span>
              <button
                type="button"
                onClick={handleRetryAll}
                style={{
                  marginTop: '4px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Thử lại
              </button>
            </div>
          )}

          {!isPaymentsLoading && !isPaymentsError && pendingPersonalPayments.length === 0 && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '10px',
                padding: '28px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '12px',
              }}
            >
              <div style={{ color: '#64748b', marginBottom: '4px' }}>
                <Car size={24} style={{ margin: '0 auto 6px auto', display: 'block' }} />
              </div>
              Không có giao dịch đang chờ xác nhận.
            </div>
          )}

          {!isPaymentsLoading && !isPaymentsError && pendingPersonalPayments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingPersonalPayments.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                  }}
                >
                  {/* Item Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} color="#f59e0b" />
                        <span>{p.payerName}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        Xe: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{p.vehicleName || vehicle.name}</span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#cbd5e1', marginTop: '2px' }}>
                        {p.expenseDescription || 'Chi phí sạc điện cá nhân'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b' }}>
                        {formatVnd(p.amount)}
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          color: '#fbbf24',
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '999px',
                          marginTop: '3px',
                        }}
                      >
                        <Clock size={10} />
                        <span>{p.statusLabel || 'CHỜ XÁC NHẬN'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div
                    style={{
                      background: 'rgba(2, 6, 23, 0.5)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>Thời gian tạo:</span>
                      <span style={{ color: '#cbd5e1' }}>{formatDateTime(p.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>Chế độ giao dịch:</span>
                      <span style={{ color: '#00f2fe', fontWeight: 700 }}>
                        {p.financialModeLabel || 'DEMO'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>Mã tham chiếu:</span>
                      <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                        {p.paymentReference || p.id.substring(0, 8)}
                      </span>
                    </div>
                    {p.note && (
                      <div style={{ color: '#94a3b8', fontSize: '10.5px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '4px', marginTop: '2px' }}>
                        Ghi chú: <span style={{ color: '#e2e8f0' }}>{p.note}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginTop: '2px' }}>
                    <button
                      type="button"
                      disabled={verifyPersonalPaymentMutation.isPending}
                      onClick={() => handleVerifyPersonalPayment(p, true)}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        border: 'none',
                        color: '#041324',
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        cursor: verifyPersonalPaymentMutation.isPending ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        opacity: verifyPersonalPaymentMutation.isPending ? 0.6 : 1,
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                      }}
                    >
                      <Check size={14} />
                      <span>XÁC NHẬN THANH TOÁN DEMO</span>
                    </button>

                    <button
                      type="button"
                      disabled={verifyPersonalPaymentMutation.isPending}
                      onClick={() => handleVerifyPersonalPayment(p, false)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        fontWeight: 700,
                        fontSize: '11px',
                        padding: '8px 6px',
                        borderRadius: '8px',
                        cursor: verifyPersonalPaymentMutation.isPending ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        opacity: verifyPersonalPaymentMutation.isPending ? 0.6 : 1,
                      }}
                    >
                      <X size={14} />
                      <span>TỪ CHỐI</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
