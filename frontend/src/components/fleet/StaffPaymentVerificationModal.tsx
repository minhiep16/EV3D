import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
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

interface StaffPaymentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVehicleId?: string | null;
}

type TabType = 'PENDING' | 'VERIFIED' | 'REJECTED';

function formatVnd(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export const StaffPaymentVerificationModal: React.FC<StaffPaymentVerificationModalProps> = ({
  isOpen,
  onClose,
  initialVehicleId = null,
}) => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('PENDING');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Rejection dialog state
  const [rejectingItem, setRejectingItem] = useState<PersonalExpensePaymentResponse | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Evidence preview dialog state
  const [viewingEvidenceItem, setViewingEvidenceItem] = useState<PersonalExpensePaymentResponse | null>(null);

  // Sync initialVehicleId when opened
  useEffect(() => {
    if (isOpen) {
      if (initialVehicleId) {
        setSelectedVehicleId(initialVehicleId);
      }
      setFeedbackSuccess(null);
      setFeedbackError(null);
    }
  }, [isOpen, initialVehicleId]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewingEvidenceItem) {
          setViewingEvidenceItem(null);
        } else if (rejectingItem) {
          setRejectingItem(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, viewingEvidenceItem, rejectingItem, onClose]);

  // 1. Fetch Vehicles for filtering
  const { data: vehicles = [] } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
    enabled: isOpen,
    staleTime: 60000,
  });

  // 2. Fetch Pending Personal Payments (optionally filtered by vehicle)
  const {
    data: pendingPayments = [],
    isLoading: isPendingLoading,
    isError: isPendingError,
    error: pendingQueryError,
    refetch: refetchPending,
  } = useQuery<PersonalExpensePaymentResponse[]>({
    queryKey: ['pending-personal-payments', selectedVehicleId],
    queryFn: () => fetchPendingPersonalPayments(selectedVehicleId || undefined),
    enabled: isOpen,
    staleTime: 5000,
  });

  // 3. Fetch Staff Payment History (all statuses)
  const {
    data: paymentHistory = [],
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    error: historyQueryError,
    refetch: refetchHistory,
  } = useQuery<PersonalExpensePaymentResponse[]>({
    queryKey: ['staff-payment-history', selectedVehicleId],
    queryFn: () => fetchStaffPaymentHistory(selectedVehicleId || undefined),
    enabled: isOpen,
    staleTime: 10000,
  });

  // Filter verified and rejected items from history
  const verifiedPayments = useMemo(() => {
    return paymentHistory.filter((p) => p.status === 'PAYMENT_VERIFIED');
  }, [paymentHistory]);

  const rejectedPayments = useMemo(() => {
    return paymentHistory.filter((p) => p.status === 'PAYMENT_REJECTED');
  }, [paymentHistory]);

  // Compute displayed list based on active tab & search
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
          ? 'Đã xác nhận và đối soát thanh toán demo thành công! Nghĩa vụ đã được quyết toán.'
          : 'Đã từ chối xác minh thanh toán demo.'
      );
      // Invalidate relevant queries for sync
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
      note: 'Nhân viên đã kiểm tra và xác nhận đối soát hợp lệ (DEMO)',
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

  if (!isOpen) return null;

  const currentVehicleObj = vehicles.find((v) => v.id === selectedVehicleId);
  const isLoading = activeTab === 'PENDING' ? isPendingLoading : isHistoryLoading;
  const isError = activeTab === 'PENDING' ? isPendingError : isHistoryError;
  const currentErrorMsg =
    activeTab === 'PENDING'
      ? (pendingQueryError as any)?.message || 'Không thể tải danh sách chờ duyệt.'
      : (historyQueryError as any)?.message || 'Không thể tải lịch sử thanh toán.';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999999,
        background: 'rgba(2, 6, 23, 0.78)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          height: '840px',
          background: 'linear-gradient(180deg, rgba(8, 26, 48, 0.98) 0%, rgba(4, 14, 28, 0.99) 100%)',
          border: '1.5px solid rgba(0, 242, 254, 0.45)',
          borderRadius: '20px',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.85), 0 0 40px rgba(0, 242, 254, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* 1. MODAL HEADER                                                           */}
        {/* ========================================================================= */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(0, 242, 254, 0.25)',
            background: 'rgba(8, 20, 36, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25), rgba(2, 132, 199, 0.35))',
                border: '1.5px solid #00f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00f2fe',
                boxShadow: '0 0 16px rgba(0, 242, 254, 0.35)',
              }}
            >
              <Wallet size={22} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '17px',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                  }}
                >
                  XÁC MINH THANH TOÁN ĐỒNG SỞ HỮU
                </h2>
                <span
                  style={{
                    background: 'rgba(0, 242, 254, 0.15)',
                    border: '1px solid rgba(0, 242, 254, 0.4)',
                    color: '#00f2fe',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={11} />
                  <span>DEMO MODE</span>
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                Kiểm tra chứng từ và đối soát nghĩa vụ chi phí cá nhân do Đồng sở hữu nộp
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleRefresh}
              title="Làm mới danh sách"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={16} />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Đóng (ESC)"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CONTROLS BAR: TABS + VEHICLE FILTER + SEARCH                           */}
        {/* ========================================================================= */}
        <div
          style={{
            padding: '14px 24px',
            background: 'rgba(4, 16, 30, 0.75)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '3px',
              borderRadius: '12px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            {/* Tab 1: PENDING */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('PENDING');
                setFeedbackError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === 'PENDING' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                border: activeTab === 'PENDING' ? '1px solid #00f2fe' : '1px solid transparent',
                color: activeTab === 'PENDING' ? '#00f2fe' : '#94a3b8',
                borderRadius: '9px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Clock size={14} />
              <span>CHỜ XÁC MINH</span>
              {pendingPayments.length > 0 && (
                <span
                  style={{
                    background: '#f59e0b',
                    color: '#041628',
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '1px 7px',
                    borderRadius: '999px',
                    lineHeight: 1.2,
                  }}
                >
                  {pendingPayments.length}
                </span>
              )}
            </button>

            {/* Tab 2: VERIFIED */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('VERIFIED');
                setFeedbackError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === 'VERIFIED' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: activeTab === 'VERIFIED' ? '1px solid #10b981' : '1px solid transparent',
                color: activeTab === 'VERIFIED' ? '#34d399' : '#94a3b8',
                borderRadius: '9px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <CheckCircle2 size={14} />
              <span>ĐÃ XÁC MINH</span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.25)',
                  color: '#34d399',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '999px',
                }}
              >
                {verifiedPayments.length}
              </span>
            </button>

            {/* Tab 3: REJECTED */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('REJECTED');
                setFeedbackError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: activeTab === 'REJECTED' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                border: activeTab === 'REJECTED' ? '1px solid #ef4444' : '1px solid transparent',
                color: activeTab === 'REJECTED' ? '#f87171' : '#94a3b8',
                borderRadius: '9px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <XCircle size={14} />
              <span>ĐÃ TỪ CHỐI</span>
              <span
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '999px',
                }}
              >
                {rejectedPayments.length}
              </span>
            </button>
          </div>

          {/* Filters: Vehicle Dropdown + Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '280px', justifyContent: 'flex-end' }}>
            {/* Vehicle Selector */}
            <div style={{ position: 'relative', minWidth: '200px' }}>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="">TẤT CẢ PHƯƠNG TIỆN</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.licensePlate || 'Chưa biển'})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Tìm người nộp, mã GD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '10px',
                  padding: '8px 12px 8px 30px',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. ALERTS ROW                                                             */}
        {/* ========================================================================= */}
        {feedbackSuccess && (
          <div
            style={{
              padding: '10px 24px',
              background: 'rgba(16, 185, 129, 0.16)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <Check size={16} />
            <span>{feedbackSuccess}</span>
          </div>
        )}

        {feedbackError && (
          <div
            style={{
              padding: '10px 24px',
              background: 'rgba(239, 68, 68, 0.16)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={16} />
            <span>{feedbackError}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. MAIN CONTENT AREA (ONE SINGLE SCROLL CONTAINER)                        */}
        {/* ========================================================================= */}
        <div
          style={{
            flex: '1',
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxSizing: 'border-box',
          }}
        >
          {/* Loading Indicator */}
          {isLoading && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <RefreshCw size={24} className="animate-spin" color="#00f2fe" />
              <span>Đang tải danh sách thanh toán...</span>
            </div>
          )}

          {/* Error State */}
          {!isLoading && isError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                padding: '30px 20px',
                textAlign: 'center',
                color: '#f87171',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertTriangle size={28} />
              <div style={{ fontWeight: 800 }}>Không thể kết nối đến máy chủ</div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{currentErrorMsg}</div>
              <button
                type="button"
                onClick={handleRefresh}
                style={{
                  marginTop: '8px',
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid #ef4444',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && displayedPayments.length === 0 && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px dashed rgba(56, 189, 248, 0.25)',
                borderRadius: '14px',
                padding: '50px 20px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  marginBottom: '6px',
                }}
              >
                <Wallet size={24} />
              </div>
              <div style={{ fontWeight: 700, color: '#e2e8f0' }}>
                {activeTab === 'PENDING'
                  ? 'Hiện không có thanh toán nào chờ xác minh'
                  : activeTab === 'VERIFIED'
                  ? 'Chưa có giao dịch nào đã xác minh'
                  : 'Chưa có giao dịch nào bị từ chối'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                {selectedVehicleId
                  ? `Đang lọc theo xe ${currentVehicleObj?.name || selectedVehicleId}`
                  : 'Tất cả các phương tiện trong hệ thống'}
              </div>
            </div>
          )}

          {/* Payment Items Grid/List */}
          {!isLoading && !isError && displayedPayments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayedPayments.map((p) => {
                const isItemPending = p.status === 'PAYMENT_SUBMITTED';
                const isItemVerified = p.status === 'PAYMENT_VERIFIED';
                const isItemRejected = p.status === 'PAYMENT_REJECTED';

                return (
                  <div
                    key={p.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.88)',
                      border: isItemPending
                        ? '1.5px solid rgba(245, 158, 11, 0.45)'
                        : isItemVerified
                        ? '1px solid rgba(16, 185, 129, 0.35)'
                        : '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '14px',
                      padding: '16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: isItemPending
                        ? '0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(245, 158, 11, 0.1)'
                        : '0 4px 14px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Item Top Row: Vehicle Info & Amounts */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '16px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Left: Vehicle & Expense Info */}
                      <div style={{ flex: '1', minWidth: '260px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 800,
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Car size={16} color="#00f2fe" />
                            <span>{p.vehicleName || 'Xe điện EVShare'}</span>
                          </span>

                          {p.vehiclePlate && (
                            <span
                              style={{
                                background: 'rgba(0, 242, 254, 0.12)',
                                border: '1px solid rgba(0, 242, 254, 0.35)',
                                color: '#00f2fe',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                padding: '1px 7px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                              }}
                            >
                              {p.vehiclePlate}
                            </span>
                          )}

                          <span
                            style={{
                              background: 'rgba(56, 189, 248, 0.1)',
                              color: '#38bdf8',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            DEMO
                          </span>
                        </div>

                        {/* Expense Description */}
                        <div style={{ fontSize: '12.5px', color: '#cbd5e1', marginTop: '4px', fontWeight: 600 }}>
                          {p.expenseDescription || 'Khoản chi phí vận hành / bảo dưỡng'}
                        </div>

                        {/* Total Expense Summary */}
                        {p.totalExpenseAmount != null && p.totalExpenseAmount > 0 && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            Tổng chi phí khoản chi: <strong style={{ color: '#e2e8f0' }}>{formatVnd(p.totalExpenseAmount)}</strong>
                          </div>
                        )}
                      </div>

                      {/* Right: Payment Amount & Status */}
                      <div style={{ textAlign: 'right', minWidth: '180px' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                          SỐ TIỀN THANH TOÁN
                        </div>
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: 900,
                            color: isItemPending ? '#f59e0b' : isItemVerified ? '#34d399' : '#f87171',
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {formatVnd(p.amount)}
                        </div>

                        {/* Status Badge */}
                        <div style={{ marginTop: '4px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: isItemPending
                                ? 'rgba(245, 158, 11, 0.18)'
                                : isItemVerified
                                ? 'rgba(16, 185, 129, 0.18)'
                                : 'rgba(239, 68, 68, 0.18)',
                              border: isItemPending
                                ? '1px solid rgba(245, 158, 11, 0.5)'
                                : isItemVerified
                                ? '1px solid rgba(16, 185, 129, 0.5)'
                                : '1px solid rgba(239, 68, 68, 0.5)',
                              color: isItemPending ? '#fbbf24' : isItemVerified ? '#34d399' : '#f87171',
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '999px',
                            }}
                          >
                            {isItemPending && <Clock size={11} />}
                            {isItemVerified && <CheckCircle2 size={11} />}
                            {isItemRejected && <XCircle size={11} />}
                            <span>{p.statusLabel || (isItemPending ? 'CHỜ XÁC MINH' : isItemVerified ? 'ĐÃ XÁC MINH' : 'ĐÃ TỪ CHỐI')}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Card: Payer, Allocated Amount, Reference, Time */}
                    <div
                      style={{
                        background: 'rgba(4, 12, 24, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '11.5px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '8px 16px',
                      }}
                    >
                      <div>
                        <span style={{ color: '#94a3b8' }}>Đồng sở hữu nộp: </span>
                        <strong style={{ color: '#ffffff' }}>
                          <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {p.payerName}
                        </strong>
                      </div>

                      {p.allocatedAmount != null && (
                        <div>
                          <span style={{ color: '#94a3b8' }}>Nghĩa vụ phân bổ: </span>
                          <strong style={{ color: '#38bdf8' }}>{formatVnd(p.allocatedAmount)}</strong>
                        </div>
                      )}

                      <div>
                        <span style={{ color: '#94a3b8' }}>Mã tham chiếu: </span>
                        <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                          {p.paymentReference || p.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <span style={{ color: '#94a3b8' }}>Thời gian gửi: </span>
                        <span style={{ color: '#cbd5e1' }}>{formatDateTime(p.createdAt)}</span>
                      </div>

                      <div>
                        <span style={{ color: '#94a3b8' }}>Phương thức: </span>
                        <span style={{ color: '#00f2fe', fontWeight: 600 }}>
                          {p.paymentMethod || 'Chuyển khoản Demo'}
                        </span>
                      </div>

                      {p.verifiedByName && (
                        <div>
                          <span style={{ color: '#94a3b8' }}>Người đối soát: </span>
                          <span style={{ color: '#34d399', fontWeight: 600 }}>{p.verifiedByName}</span>
                          {p.verifiedAt && (
                            <span style={{ color: '#64748b', fontSize: '10px', marginLeft: '4px' }}>
                              ({formatDateTime(p.verifiedAt)})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Notes / Comments Row */}
                    {p.note && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#94a3b8',
                          background: 'rgba(2, 6, 23, 0.45)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          borderLeft: isItemRejected ? '3px solid #ef4444' : '3px solid #00f2fe',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: '#cbd5e1' }}>Ghi chú: </span>
                        <span>{p.note}</span>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Left Action: View Voucher / Evidence */}
                      <button
                        type="button"
                        onClick={() => setViewingEvidenceItem(p)}
                        style={{
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '7px 14px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Receipt size={14} />
                        <span>XEM CHỨNG TỪ</span>
                      </button>

                      {/* Right Actions for Pending Items: Approve / Reject */}
                      {isItemPending && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            disabled={verifyMutation.isPending}
                            onClick={() => handleOpenReject(p)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.45)',
                              color: '#f87171',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '7px 14px',
                              borderRadius: '8px',
                              cursor: verifyMutation.isPending ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              opacity: verifyMutation.isPending ? 0.6 : 1,
                            }}
                          >
                            <X size={14} />
                            <span>TỪ CHỐI</span>
                          </button>

                          <button
                            type="button"
                            disabled={verifyMutation.isPending}
                            onClick={() => handleApprove(p)}
                            style={{
                              background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                              border: 'none',
                              color: '#041628',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              padding: '8px 18px',
                              borderRadius: '8px',
                              cursor: verifyMutation.isPending ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 14px rgba(0, 242, 254, 0.3)',
                              opacity: verifyMutation.isPending ? 0.6 : 1,
                            }}
                          >
                            <Check size={14} />
                            <span>XÁC NHẬN THANH TOÁN</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 5. MODAL FOOTER                                                           */}
        {/* ========================================================================= */}
        <div
          style={{
            padding: '12px 24px',
            background: 'rgba(4, 14, 28, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            color: '#94a3b8',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#00f2fe" />
            <span>Hệ thống đối soát tài chính đồng sở hữu EVShare • Chế độ mô phỏng DEMO</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SUBMODAL: REJECT DIALOG                                                  */}
        {/* ========================================================================= */}
        {rejectingItem && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(2, 6, 23, 0.82)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '20px',
            }}
            onClick={() => setRejectingItem(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                background: 'linear-gradient(180deg, #0f172a 0%, #090e1a 100%)',
                border: '1.5px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f87171',
                  }}
                >
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                    TỪ CHỐI XÁC MINH THANH TOÁN
                  </h3>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Người nộp: {rejectingItem.payerName} • Số tiền: {formatVnd(rejectingItem.amount)}
                  </div>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#cbd5e1',
                    marginBottom: '6px',
                  }}
                >
                  Lý do từ chối (bắt buộc):
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    setRejectError(null);
                  }}
                  placeholder="Ví dụ: Số tiền không khớp nghĩa vụ, thiếu mã tham chiếu hợp lệ..."
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(2, 6, 23, 0.85)',
                    border: rejectError ? '1px solid #ef4444' : '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {rejectError && (
                  <div style={{ color: '#f87171', fontSize: '11px', marginTop: '4px' }}>
                    {rejectError}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  disabled={verifyMutation.isPending}
                  onClick={() => setRejectingItem(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  HỦY
                </button>

                <button
                  type="button"
                  disabled={verifyMutation.isPending}
                  onClick={handleConfirmReject}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: verifyMutation.isPending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                    opacity: verifyMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <XCircle size={14} />
                  <span>XÁC NHẬN TỪ CHỐI</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBMODAL: EVIDENCE / VOUCHER PREVIEW                                     */}
        {/* ========================================================================= */}
        {viewingEvidenceItem && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(2, 6, 23, 0.82)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '20px',
            }}
            onClick={() => setViewingEvidenceItem(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '520px',
                background: 'linear-gradient(180deg, #0b1e36 0%, #040e1c 100%)',
                border: '1.5px solid rgba(0, 242, 254, 0.5)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 242, 254, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(0, 242, 254, 0.15)',
                      border: '1px solid #00f2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00f2fe',
                    }}
                  >
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
                      CHỨNG TỪ THANH TOÁN ĐIỆN TỬ
                    </h3>
                    <div style={{ fontSize: '11px', color: '#00f2fe', fontWeight: 700 }}>
                      HỆ THỐNG MÔ PHỎNG DEMO
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingEvidenceItem(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Receipt Content Card */}
              <div
                style={{
                  background: 'rgba(2, 8, 18, 0.75)',
                  border: '1px dashed rgba(56, 189, 248, 0.35)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Mã giao dịch / Tham chiếu:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#00f2fe' }}>
                    {viewingEvidenceItem.paymentReference || viewingEvidenceItem.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Người nộp:</span>
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>{viewingEvidenceItem.payerName}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                    {viewingEvidenceItem.vehicleName || 'Xe điện'}{' '}
                    {viewingEvidenceItem.vehiclePlate ? `(${viewingEvidenceItem.vehiclePlate})` : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Khoản mục chi phí:</span>
                  <span style={{ fontWeight: 600, color: '#cbd5e1' }}>
                    {viewingEvidenceItem.expenseDescription || 'Chi phí điện cá nhân'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Thời gian khởi tạo:</span>
                  <span style={{ color: '#cbd5e1' }}>{formatDateTime(viewingEvidenceItem.createdAt)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Hình thức thanh toán:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                    {viewingEvidenceItem.paymentMethod || 'Chuyển khoản Demo'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 700 }}>Số tiền đã nộp:</span>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#34d399' }}>
                    {formatVnd(viewingEvidenceItem.amount)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Trạng thái xác thực:</span>
                  <span style={{ fontWeight: 800, color: '#f59e0b' }}>
                    {viewingEvidenceItem.statusLabel || viewingEvidenceItem.status}
                  </span>
                </div>
              </div>

              {/* Simulation Note */}
              <div
                style={{
                  background: 'rgba(0, 242, 254, 0.08)',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  color: '#94a3b8',
                  lineHeight: '1.4',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00f2fe', fontWeight: 700, marginBottom: '2px' }}>
                  <Sparkles size={12} />
                  <span>Lưu ý mô phỏng DEMO</span>
                </div>
                Đây là chứng từ điện tử nội bộ được tạo trong chế độ DEMO của nền tảng EVShare 3D.
                Không có giao dịch trừ tiền hoặc liên kết cổng ngân hàng thật sự.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setViewingEvidenceItem(null)}
                  style={{
                    background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                    border: 'none',
                    color: '#041628',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Đóng chứng từ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

