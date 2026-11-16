import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Wallet,
  Car,
  User,
  Clock,
  Search,
  FileText,
  Sparkles,
  Check,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  ExternalLink,
  X,
  Eye,
} from 'lucide-react';
import {
  fetchPendingPersonalPayments,
  fetchStaffPaymentHistory,
  verifyPersonalPayment,
} from '../../services/fundApi';
import { fetchVehicles } from '../../services/vehicleApi';
import { PersonalExpensePaymentResponse } from '../../types/fund';
import { VehicleResponse } from '../../types/vehicle';
import { formatDateTime } from '../../utils/dateTimeUtils';

interface StaffPaymentVerificationViewProps {
  selectedVehicleId?: string | null;
  onClose?: () => void;
}

type TabType = 'PENDING' | 'VERIFIED' | 'REJECTED';

function formatVnd(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export const StaffPaymentVerificationView: React.FC<StaffPaymentVerificationViewProps> = ({
  selectedVehicleId: initialVehicleId = null,
  onClose,
}) => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('PENDING');
  const [filterVehicleId, setFilterVehicleId] = useState<string>(initialVehicleId || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Rejection dialog state
  const [rejectingItem, setRejectingItem] = useState<PersonalExpensePaymentResponse | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Evidence preview dialog state
  const [viewingEvidenceItem, setViewingEvidenceItem] = useState<PersonalExpensePaymentResponse | null>(null);

  useEffect(() => {
    if (initialVehicleId) {
      setFilterVehicleId(initialVehicleId);
    }
  }, [initialVehicleId]);

  // 1. Fetch Vehicles for filtering
  const { data: vehicles = [] } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
    staleTime: 60000,
  });

  // 2. Fetch Pending Personal Payments
  const {
    data: pendingPayments = [],
    isLoading: isPendingLoading,
    isError: isPendingError,
    error: pendingQueryError,
    refetch: refetchPending,
  } = useQuery<PersonalExpensePaymentResponse[]>({
    queryKey: ['pending-personal-payments', filterVehicleId],
    queryFn: () => fetchPendingPersonalPayments(filterVehicleId || undefined),
    staleTime: 5000,
  });

  // 3. Fetch Staff Payment History
  const {
    data: paymentHistory = [],
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    error: historyQueryError,
    refetch: refetchHistory,
  } = useQuery<PersonalExpensePaymentResponse[]>({
    queryKey: ['staff-payment-history', filterVehicleId],
    queryFn: () => fetchStaffPaymentHistory(filterVehicleId || undefined),
    staleTime: 10000,
  });

  const verifiedPayments = useMemo(() => {
    return paymentHistory.filter((p) => p.status === 'PAYMENT_VERIFIED');
  }, [paymentHistory]);

  const rejectedPayments = useMemo(() => {
    return paymentHistory.filter((p) => p.status === 'PAYMENT_REJECTED');
  }, [paymentHistory]);

  const displayedPayments = useMemo(() => {
    let list: PersonalExpensePaymentResponse[] = [];
    if (activeTab === 'PENDING') {
      list = pendingPayments;
    } else if (activeTab === 'VERIFIED') {
      list = verifiedPayments;
    } else if (activeTab === 'REJECTED') {
      list = rejectedPayments;
    }

    if (!searchQuery.trim()) {
      return list;
    }

    const q = searchQuery.toLowerCase().trim();
    return list.filter((p) => {
      const payer = (p.payerName || '').toLowerCase();
      const vehName = (p.vehicleName || '').toLowerCase();
      const vehPlate = (p.vehiclePlate || '').toLowerCase();
      const expDesc = (p.expenseDescription || '').toLowerCase();
      const ref = (p.paymentReference || '').toLowerCase();
      return (
        payer.includes(q) ||
        vehName.includes(q) ||
        vehPlate.includes(q) ||
        expDesc.includes(q) ||
        ref.includes(q)
      );
    });
  }, [activeTab, pendingPayments, verifiedPayments, rejectedPayments, searchQuery]);

  // Mutation for verifying or rejecting payment
  const verifyMutation = useMutation({
    mutationFn: ({ paymentId, confirmed, note }: { paymentId: string; confirmed: boolean; note?: string }) =>
      verifyPersonalPayment(paymentId, { confirmed, note }),
    onSuccess: async (_, variables) => {
      setFeedbackError(null);
      setFeedbackSuccess(
        variables.confirmed
          ? 'Đã xác nhận và đối soát thanh toán thành công! Nghĩa vụ đã được quyết toán.'
          : 'Đã từ chối xác minh thanh toán.'
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pending-personal-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-payment-history'] }),
        queryClient.invalidateQueries({ queryKey: ['my-personal-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['expense-shares'] }),
        queryClient.invalidateQueries({ queryKey: ['cost-sharing-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['expense-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['groupTransfers'] }),
        queryClient.invalidateQueries({ queryKey: ['incomingTransfers'] }),
        queryClient.invalidateQueries({ queryKey: ['coOwnership'] }),
        queryClient.invalidateQueries({ queryKey: ['financialObligations'] }),
        queryClient.invalidateQueries({ queryKey: ['transferPreview'] }),
      ]);
    },
    onError: (err: any) => {
      setFeedbackSuccess(null);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Thao tác xác minh thất bại. Vui lòng kiểm tra lại kết nối mạng.';
      setFeedbackError(msg);
    },
  });

  const handleApprove = (payment: PersonalExpensePaymentResponse) => {
    setFeedbackSuccess(null);
    setFeedbackError(null);
    verifyMutation.mutate({
      paymentId: payment.id,
      confirmed: true,
      note: 'Nhân viên đã kiểm tra và xác nhận đối soát hợp lệ',
    });
  };

  const handleOpenReject = (payment: PersonalExpensePaymentResponse) => {
    setRejectingItem(payment);
    setRejectReason('');
    setRejectError(null);
  };

  const handleConfirmReject = () => {
    if (!rejectingItem) return;
    if (!rejectReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối để thông báo cho Đồng sở hữu.');
      return;
    }
    setRejectError(null);
    verifyMutation.mutate(
      {
        paymentId: rejectingItem.id,
        confirmed: false,
        note: rejectReason.trim(),
      },
      {
        onSuccess: () => {
          setRejectingItem(null);
          setRejectReason('');
        },
      }
    );
  };

  const handleRefresh = () => {
    setFeedbackSuccess(null);
    setFeedbackError(null);
    refetchPending();
    refetchHistory();
  };

  const isLoading = activeTab === 'PENDING' ? isPendingLoading : isHistoryLoading;
  const isError = activeTab === 'PENDING' ? isPendingError : isHistoryError;
  const currentErrorMsg =
    activeTab === 'PENDING'
      ? (pendingQueryError as any)?.message || 'Không thể tải danh sách chờ duyệt.'
      : (historyQueryError as any)?.message || 'Không thể tải lịch sử thanh toán.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 1. Header Banner Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(11, 28, 54, 0.7) 100%)',
          border: '1.2px solid rgba(0, 242, 254, 0.4)',
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(0, 242, 254, 0.2)',
              border: '1.2px solid #00f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f2fe',
            }}
          >
            <Wallet size={18} />
          </div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>
              ĐỐI SOÁT & XÁC MINH CHI PHÍ
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Kiểm tra chứng từ & giải quyết nghĩa vụ đồng sở hữu
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          title="Làm mới dữ liệu"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* 2. Feedback Banners */}
      {feedbackSuccess && (
        <div
          role="status"
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={13} />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSuccess(null)}
            style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {feedbackError && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={13} />
            <span>{feedbackError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackError(null)}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* 3. Status Tabs (Chờ duyệt, Đã duyệt, Từ chối) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px',
          background: 'rgba(15, 23, 42, 0.75)',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('PENDING');
            setFeedbackError(null);
          }}
          style={{
            padding: '6px 4px',
            borderRadius: '8px',
            fontSize: '10.5px',
            fontWeight: 800,
            background: activeTab === 'PENDING' ? 'rgba(0, 242, 254, 0.25)' : 'transparent',
            border: activeTab === 'PENDING' ? '1px solid #00f2fe' : '1px solid transparent',
            color: activeTab === 'PENDING' ? '#00f2fe' : '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
        >
          <Clock size={11} />
          <span>CHỜ DUYỆT</span>
          {pendingPayments.length > 0 && (
            <span
              style={{
                background: '#f59e0b',
                color: '#041628',
                fontSize: '9px',
                fontWeight: 900,
                padding: '1px 5px',
                borderRadius: '999px',
              }}
            >
              {pendingPayments.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('VERIFIED');
            setFeedbackError(null);
          }}
          style={{
            padding: '6px 4px',
            borderRadius: '8px',
            fontSize: '10.5px',
            fontWeight: 800,
            background: activeTab === 'VERIFIED' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
            border: activeTab === 'VERIFIED' ? '1px solid #10b981' : '1px solid transparent',
            color: activeTab === 'VERIFIED' ? '#34d399' : '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
        >
          <CheckCircle2 size={11} />
          <span>ĐÃ DUYỆT</span>
          {verifiedPayments.length > 0 && (
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '9px',
                fontWeight: 900,
                padding: '1px 5px',
                borderRadius: '999px',
              }}
            >
              {verifiedPayments.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('REJECTED');
            setFeedbackError(null);
          }}
          style={{
            padding: '6px 4px',
            borderRadius: '8px',
            fontSize: '10.5px',
            fontWeight: 800,
            background: activeTab === 'REJECTED' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
            border: activeTab === 'REJECTED' ? '1px solid #ef4444' : '1px solid transparent',
            color: activeTab === 'REJECTED' ? '#f87171' : '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
        >
          <XCircle size={11} />
          <span>TỪ CHỐI</span>
          {rejectedPayments.length > 0 && (
            <span
              style={{
                background: 'rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '9px',
                fontWeight: 900,
                padding: '1px 5px',
                borderRadius: '999px',
              }}
            >
              {rejectedPayments.length}
            </span>
          )}
        </button>
      </div>

      {/* 4. Filter & Search Controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={13} color="#64748b" style={{ position: 'absolute', left: '9px', top: '9px' }} />
          <input
            type="text"
            placeholder="Tìm người nộp, xe, mã thanh toán..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 28px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#ffffff',
              fontSize: '11px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <select
          value={filterVehicleId}
          onChange={(e) => setFilterVehicleId(e.target.value)}
          style={{
            padding: '6px 8px',
            borderRadius: '8px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: '#38bdf8',
            fontSize: '11px',
            fontWeight: 600,
            outline: 'none',
            maxWidth: '130px',
          }}
        >
          <option value="">Tất cả xe</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.licensePlate || v.name || v.id}
            </option>
          ))}
        </select>
      </div>

      {/* 5. Payments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isLoading ? (
          <div style={{ padding: '30px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
            <RefreshCw size={18} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 8px' }} />
            <div>Đang tải danh sách thanh toán...</div>
          </div>
        ) : isError ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: '#f87171', fontSize: '11px' }}>
            <AlertCircle size={20} style={{ margin: '0 auto 6px' }} />
            <div>{currentErrorMsg}</div>
          </div>
        ) : displayedPayments.length === 0 ? (
          <div
            style={{
              padding: '32px 14px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '11px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '12px',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}
          >
            <Receipt size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <div>
              {activeTab === 'PENDING'
                ? 'Không có khoản thanh toán nào cần xác minh tại thời điểm này.'
                : activeTab === 'VERIFIED'
                ? 'Chưa có khoản thanh toán nào được duyệt.'
                : 'Không có khoản thanh toán nào bị từ chối.'}
            </div>
          </div>
        ) : (
          displayedPayments.map((p) => {
            const isPending = p.status === 'PAYMENT_PENDING' || activeTab === 'PENDING';
            const isVerified = p.status === 'PAYMENT_VERIFIED';
            const isRejected = p.status === 'PAYMENT_REJECTED';
            const isActionLoading = verifyMutation.isPending && (verifyMutation.variables as any)?.paymentId === p.id;

            return (
              <div
                key={p.id}
                style={{
                  background: 'rgba(11, 28, 54, 0.65)',
                  border: isPending
                    ? '1.2px solid rgba(245, 158, 11, 0.4)'
                    : isVerified
                    ? '1.2px solid rgba(16, 185, 129, 0.35)'
                    : '1.2px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Top Info Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                        flexShrink: 0,
                      }}
                    >
                      <User size={12} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff' }}>
                        {p.payerName || 'Đồng sở hữu'}
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                        {p.vehiclePlate ? `${p.vehiclePlate} • ` : ''}
                        {p.vehicleName || 'Xe điện'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#00f2fe' }}>
                      {formatVnd(p.amount)}
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>
                      {p.verifiedAt ? formatDateTime(p.verifiedAt) : p.createdAt ? formatDateTime(p.createdAt) : ''}
                    </div>
                  </div>
                </div>

                {/* Description & Reference */}
                <div
                  style={{
                    background: 'rgba(4, 16, 30, 0.5)',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    fontSize: '10.5px',
                    color: '#cbd5e1',
                    lineHeight: 1.4,
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#e2e8f0' }}>
                    {p.expenseDescription || 'Nghĩa vụ chi phí vận hành'}
                  </div>
                  {p.paymentReference && (
                    <div style={{ fontSize: '9px', color: '#38bdf8', marginTop: '2px', fontFamily: 'monospace' }}>
                      Mã tham chiếu: #{p.paymentReference}
                    </div>
                  )}
                  {p.note && (
                    <div style={{ fontSize: '9.5px', color: isRejected ? '#f87171' : '#34d399', marginTop: '3px' }}>
                      Ghi chú: {p.note}
                    </div>
                  )}
                </div>

                {/* Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: '2px' }}>
                  {p.evidenceUrl ? (
                    <button
                      type="button"
                      onClick={() => setViewingEvidenceItem(p)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Eye size={11} />
                      <span>Xem chứng từ</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '9px', color: '#64748b' }}>Không có hình ảnh</span>
                  )}

                  {isPending && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenReject(p)}
                        disabled={isActionLoading}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#f87171',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: isActionLoading ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <X size={11} />
                        <span>Từ chối</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(p)}
                        disabled={isActionLoading}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, #059669, #10b981)',
                          border: '1px solid #10b981',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 800,
                          cursor: isActionLoading ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <Check size={11} />
                        <span>{isActionLoading ? 'Đang duyệt...' : 'Phê duyệt'}</span>
                      </button>
                    </div>
                  )}

                  {isVerified && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        color: '#34d399',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <CheckCircle2 size={12} />
                      <span>ĐÃ QUYẾT TOÁN</span>
                    </span>
                  )}

                  {isRejected && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        color: '#f87171',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <XCircle size={12} />
                      <span>ĐÃ BÁC BỎ</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Rejection Dialog */}
      {rejectingItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 999999,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={() => setRejectingItem(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'rgba(11, 28, 54, 0.98)',
              border: '1.5px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                <AlertCircle size={18} />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                  XÁC NHẬN TỪ CHỐI THANH TOÁN
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
              Bạn đang từ chối khoản thanh toán <strong>{formatVnd(rejectingItem.amount)}</strong> của{' '}
              <strong>{rejectingItem.payerName}</strong>. Vui lòng nêu rõ lý do để người nộp bổ sung chứng từ.
            </div>

            <textarea
              rows={3}
              placeholder="Nhập lý do từ chối (ví dụ: Thiếu ảnh chụp ủy nhiệm chi, số tiền không khớp...)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'rgba(4, 16, 30, 0.75)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ffffff',
                fontSize: '11px',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none',
              }}
            />

            {rejectError && (
              <div style={{ fontSize: '10px', color: '#f87171' }}>{rejectError}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={verifyMutation.isPending}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: '#dc2626',
                  border: '1px solid #ef4444',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {verifyMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Evidence Preview Dialog */}
      {viewingEvidenceItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 999999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={() => setViewingEvidenceItem(null)}
        >
          <div
            style={{
              maxWidth: '500px',
              width: '100%',
              background: 'rgba(11, 28, 54, 0.98)',
              border: '1.5px solid rgba(0, 242, 254, 0.4)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>
                CHỨNG TỪ NỘP TIỀN #{viewingEvidenceItem.paymentReference || viewingEvidenceItem.id}
              </span>
              <button
                type="button"
                onClick={() => setViewingEvidenceItem(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#041628',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '360px',
              }}
            >
              <img
                src={viewingEvidenceItem.evidenceUrl}
                alt="Chứng từ chuyển khoản"
                style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8' }}>
              <span>Số tiền: <strong style={{ color: '#00f2fe' }}>{formatVnd(viewingEvidenceItem.amount)}</strong></span>
              <span>Người nộp: <strong style={{ color: '#ffffff' }}>{viewingEvidenceItem.payerName}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
