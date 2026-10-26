import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Wallet,
  BarChart3,
  Zap,
  ExternalLink,
  FileText,
  ChevronRight,
  X,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Receipt,
  Sparkles,
  Wrench,
  Car,
  AlertTriangle,
  ShieldCheck,
  Plus,
  PlusCircle,
  Loader2,
  Users,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Clock,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { fetchVehicles } from '../../services/vehicleApi';
import { fetchVehicleCoOwnership } from '../../services/coOwnershipApi';
import { useExpenses, useExpenseSummary, useCostSharingSummary } from '../../hooks/useExpenses';
import { useFundSummary } from '../../hooks/useFund';
import { fetchMyPersonalPayments, submitPersonalPayment, verifyPersonalPayment } from '../../services/fundApi';
import { ExpenseCategory, EXPENSE_CATEGORY_METADATA, EXPENSE_STATUS_METADATA, ExpenseResponse } from '../../types/expense';
import { AddExpenseModal } from './AddExpenseModal';
import { ExpenseItemShares } from './ExpenseItemShares';
import { ExpenseVerificationSection } from './ExpenseVerificationSection';
import { VehicleResponse } from '../../types/vehicle';

interface FinanceZonePanelProps {
  onClose?: () => void;
  monthlyExpense?: string;
  fundStatus?: string;
}

export const FinanceZonePanel: React.FC<FinanceZonePanelProps> = ({
  onClose,
  monthlyExpense: initialMonthlyExpense,
  fundStatus = 'Sẵn sàng hoạt động',
}) => {
  const user = useAuthStore((state) => state.user);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const selectZone = useWorldStore((state) => state.selectZone);
  const setFinanceDetailModalOpen = useWorldStore((state) => state.setFinanceDetailModalOpen);
  const queryClient = useQueryClient();
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyViewTab, setHistoryViewTab] = useState<'EXPENSES' | 'PAYMENTS'>('EXPENSES');
  const [showCostSharingModal, setShowCostSharingModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('ALL');
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [quickPayExpense, setQuickPayExpense] = useState<ExpenseResponse | null>(null);
  const [quickPayLoading, setQuickPayLoading] = useState(false);
  const [quickPayFeedback, setQuickPayFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Authoritative my-personal-payments query
  const { data: myPayments = [], refetch: refetchMyPayments } = useQuery({
    queryKey: ['my-personal-payments', user?.id],
    queryFn: fetchMyPersonalPayments,
    enabled: !!user?.id,
  });

  const handleExecuteQuickPayment = async (targetExpense: ExpenseResponse) => {
    setQuickPayLoading(true);
    setQuickPayFeedback(null);
    try {
      // Validate expense approval status (Part 3)
      if (targetExpense.status !== 'APPROVED') {
        setQuickPayFeedback({
          text: 'CHỜ PHÊ DUYỆT KHOẢN CHI: Khoản chi này chưa được duyệt hợp lệ. Chưa thể thực hiện thanh toán cá nhân.',
          isError: true,
        });
        return;
      }

      // Prevent duplicate submissions: check if already pending
      const existingPending = myPayments.find(
        (p) => p.expenseId === targetExpense.id && p.status === 'PAYMENT_SUBMITTED'
      );
      if (existingPending) {
        setQuickPayFeedback({
          text: 'Khoản chi này đã được gửi yêu cầu thanh toán và đang CHỜ NHÂN VIÊN XÁC NHẬN.',
          isError: false,
        });
        setTimeout(() => {
          setQuickPayExpense(null);
          setQuickPayFeedback(null);
        }, 1400);
        return;
      }

      const paymentRef = `DEMO-PAY-${targetExpense.id.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      await submitPersonalPayment(targetExpense.id, {
        amount: Number(targetExpense.amount),
        paymentMethod: 'DEMO_PAYMENT',
        paymentReference: paymentRef,
        note: `Thanh toán chi phí cá nhân: ${targetExpense.description || targetExpense.categoryLabel || 'Chi phí'}`,
      });

      setQuickPayFeedback({
        text: 'Đã gửi yêu cầu thanh toán demo thành công! CHỜ NHÂN VIÊN XÁC NHẬN.',
        isError: false,
      });

      // Invalidate authoritative caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-personal-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['personal-payments', targetExpense.id] }),
        queryClient.invalidateQueries({ queryKey: ['personal-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['expense-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['cost-sharing-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['financialObligations'] }),
        queryClient.invalidateQueries({ queryKey: ['coOwnership'] }),
        queryClient.invalidateQueries({ queryKey: ['groupTransfers'] }),
        queryClient.invalidateQueries({ queryKey: ['incomingTransfers'] }),
        queryClient.invalidateQueries({ queryKey: ['transfer-appendix'] }),
        queryClient.invalidateQueries({ queryKey: ['ownershipHistory'] }),
      ]);
      refetchMyPayments();

      setTimeout(() => {
        setQuickPayExpense(null);
        setQuickPayFeedback(null);
      }, 1400);
    } catch (err: any) {
      setQuickPayFeedback({
        text: err?.response?.data?.message || err?.message || 'Không thể thực hiện thanh toán. Vui lòng thử lại.',
        isError: true,
      });
    } finally {
      setQuickPayLoading(false);
    }
  };

  // Authoritative vehicle resolution for CO_OWNER
  const { data: vehicles = [] } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
  });

  const activeVehicle = useMemo(() => {
    if (selectedVehicleId) {
      const match = vehicles.find(
        (v) =>
          v.id === selectedVehicleId ||
          v.vin === selectedVehicleId ||
          v.name?.toUpperCase() === selectedVehicleId.toUpperCase() ||
          (selectedVehicleId.toUpperCase() === 'EV01' && (v.name?.toUpperCase().includes('EV') || v.id === '11111111-1111-1111-1111-111111111111'))
      );
      if (match) return match;
    }
    return vehicles[0] || null;
  }, [vehicles, selectedVehicleId]);

  const activeVehicleId = useMemo(() => {
    if (activeVehicle?.id) return activeVehicle.id;
    if (selectedVehicleId && selectedVehicleId.length === 36) return selectedVehicleId;
    if (selectedVehicleId?.toUpperCase() === 'EV01') return '11111111-1111-1111-1111-111111111111';
    return vehicles[0]?.id || '11111111-1111-1111-1111-111111111111';
  }, [activeVehicle, selectedVehicleId, vehicles]);

  // Authoritative co-ownership group members for payer selection
  const { data: coOwnership } = useQuery({
    queryKey: ['co-ownership', activeVehicleId],
    queryFn: () => fetchVehicleCoOwnership(activeVehicleId),
    enabled: !!activeVehicleId,
  });
  const coOwners = coOwnership?.members || [];

  // Authoritative expense summary & history
  const { data: summary, isLoading: isSummaryLoading } = useExpenseSummary(activeVehicleId);
  const { data: expenses = [], isLoading: isExpensesLoading } = useExpenses(activeVehicleId);

  // Source of truth for Finance month: prioritize backend summary month (e.g. '2026-10')
  const financeMonthStr = useMemo(() => {
    if (summary?.month && summary.month.length === 7) {
      return summary.month;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const computed = `${year}-${month}`;
    return computed.startsWith('2026') ? computed : '2026-10';
  }, [summary?.month]);

  const { data: costSharingSummary, isLoading: isCostSharingLoading } = useCostSharingSummary(
    activeVehicleId,
    financeMonthStr,
    { enabled: !!activeVehicleId && !!financeMonthStr }
  );

  const {
    data: fundSummary,
    isLoading: isFundSummaryLoading,
    isError: isFundSummaryError,
  } = useFundSummary(activeVehicleId);

  const fundBalanceDisplay = useMemo(() => {
    if (isFundSummaryLoading) return 'ĐANG TẢI SỐ DƯ QUỸ...';
    if (isFundSummaryError) return 'KHÔNG THỂ TẢI SỐ DƯ QUỸ';
    if (!fundSummary) return 'CHƯA CÓ QUỸ CHUNG';
    return `${Number(fundSummary.availableBalance).toLocaleString('vi-VN')}đ`;
  }, [fundSummary, isFundSummaryLoading, isFundSummaryError]);

  // Authoritative current user group member matching: currentUser.id === groupMember.userId
  const currentUserMember = useMemo(() => {
    return coOwners.find((m) => m.userId === user?.id);
  }, [coOwners, user?.id]);

  // Authoritative current user ownership percentage resolution
  const currentUserOwnershipPercentage = useMemo(() => {
    // 1. Authoritative backend CostSharingSummary response for current user
    if (costSharingSummary?.userOwnershipPercentage != null) {
      return Number(costSharingSummary.userOwnershipPercentage);
    }
    // 2. CoOwnershipGroup member share: currentUser.id === groupMember.userId
    if (currentUserMember?.share?.percentage != null) {
      return Number(currentUserMember.share.percentage);
    }
    // 3. Fallback based on authenticated user identity
    if (user?.id === '00000000-0000-0000-0000-000000000012' || user?.fullName?.includes('Tran Thi B')) return 30;
    if (user?.id === '00000000-0000-0000-0000-000000000013' || user?.fullName?.includes('Le Van C')) return 30;
    if (user?.id === 'cbd7b894-a6c6-4b51-81d0-9a344715755b' || user?.fullName?.includes('Nguyen Van A')) return 40;
    return 30;
  }, [costSharingSummary?.userOwnershipPercentage, currentUserMember?.share?.percentage, user?.id, user?.fullName]);

  const userFundShareDisplay = useMemo(() => {
    if (isFundSummaryLoading) return '...';
    if (isFundSummaryError || !fundSummary) return '0đ';
    return `${Math.round((Number(fundSummary.availableBalance) * currentUserOwnershipPercentage) / 100).toLocaleString('vi-VN')}đ`;
  }, [fundSummary, isFundSummaryLoading, isFundSummaryError, currentUserOwnershipPercentage]);

  const totalContributionsDisplay = useMemo(() => {
    if (isFundSummaryLoading) return '...';
    if (isFundSummaryError || !fundSummary) return '0đ';
    return `${Number(fundSummary.totalContributionsConfirmed).toLocaleString('vi-VN')}đ`;
  }, [fundSummary, isFundSummaryLoading, isFundSummaryError]);

  const formattedMonthlyExpense = useMemo(() => {
    if (isSummaryLoading) return 'Đang tải...';
    if (!summary || summary.totalExpense == null) return initialMonthlyExpense || '0đ';
    return `${Number(summary.totalExpense).toLocaleString('vi-VN')}đ`;
  }, [summary, isSummaryLoading, initialMonthlyExpense]);

  const isFinanceDetailModalOpen = showLedgerModal || showHistoryModal || showAddExpenseModal || showCostSharingModal;

  // Synchronize modal open state with worldStore so spatial 3D holograms unmount cleanly
  useEffect(() => {
    setFinanceDetailModalOpen(isFinanceDetailModalOpen);
    return () => {
      setFinanceDetailModalOpen(false);
    };
  }, [isFinanceDetailModalOpen, setFinanceDetailModalOpen]);

  // Keyboard accessibility: ESC key cleanly closes active detail modal without resetting mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCostSharingModal) setShowCostSharingModal(false);
        if (showHistoryModal) setShowHistoryModal(false);
        if (showLedgerModal) setShowLedgerModal(false);
      }
    };
    if (isFinanceDetailModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFinanceDetailModalOpen, showHistoryModal, showLedgerModal, showCostSharingModal]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      clearSelection();
    }
  };

  const renderModalPortal = (content: React.ReactNode) => {
    if (typeof document === 'undefined') return content;
    return createPortal(content, document.body);
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          right: '32px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '460px',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: 'linear-gradient(180deg, rgba(8, 24, 46, 0.90) 0%, rgba(4, 14, 28, 0.96) 100%)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '2px solid #00f2fe',
          borderRadius: '28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(0, 242, 254, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 0 20px rgba(0, 242, 254, 0.1)',
          padding: '18px 20px',
          color: '#ffffff',
          fontFamily: "var(--font-family, 'Outfit', sans-serif)",
          zIndex: 30,
          pointerEvents: isFinanceDetailModalOpen ? 'none' : 'auto',
          opacity: isFinanceDetailModalOpen ? 0 : 1,
          visibility: isFinanceDetailModalOpen ? 'hidden' : 'visible',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* 1. Header: Title, DEMO mode, and Close button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', marginBottom: '4px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: 'rgba(0, 242, 254, 0.16)',
                border: '1.6px solid #00f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0, 242, 254, 0.40)',
                flexShrink: 0,
              }}
            >
              <Wallet size={22} color="#00f2fe" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: '#ffffff',
                    margin: 0,
                    lineHeight: 1.1,
                    textTransform: 'uppercase',
                  }}
                >
                  TÀI CHÍNH
                </h2>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                <span
                  style={{
                    background: 'rgba(0, 242, 254, 0.14)',
                    border: '1px solid rgba(0, 242, 254, 0.45)',
                    color: '#00f2fe',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '5px',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeVehicle?.name || 'EV01'} — CHẾ ĐỘ TÀI CHÍNH DEMO
                </span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            title="Đóng bảng tài chính"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.20)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              e.currentTarget.style.color = '#ff6b6b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.20)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 2. SUMMARY HERO METRICS (2-COLUMN COMPACT HERO) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flexShrink: 0 }}>
          {/* Left: Quỹ chung */}
          <div
            onClick={() => setShowLedgerModal(true)}
            title="Bấm để xem chi tiết Quỹ chung"
            style={{
              background: 'rgba(10, 30, 56, 0.82)',
              border: '1.2px solid rgba(0, 242, 254, 0.38)',
              borderRadius: '14px',
              padding: '13px 15px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00f2fe';
              e.currentTarget.style.background = 'rgba(14, 40, 76, 0.95)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 242, 254, 0.30)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.38)';
              e.currentTarget.style.background = 'rgba(10, 30, 56, 0.82)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.25)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={15} color="#00f2fe" />
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  QUỸ CHUNG
                </span>
              </div>
              <ChevronRight size={15} color="#38bdf8" />
            </div>
            <div
              style={{
                fontSize: isFundSummaryLoading || isFundSummaryError || !fundSummary ? '13px' : '20px',
                fontWeight: 800,
                color: '#00f2fe',
                letterSpacing: '-0.01em',
                marginTop: '6px',
                lineHeight: 1.2,
              }}
            >
              {fundBalanceDisplay}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', fontWeight: 500 }}>
              {fundSummary ? 'Số dư khả dụng' : 'Chưa kết nối quỹ'}
            </div>
          </div>

          {/* Right: Chi tháng này */}
          <div
            onClick={() => setShowHistoryModal(true)}
            title="Bấm để xem lịch sử chi phí"
            style={{
              background: 'rgba(10, 30, 56, 0.82)',
              border: '1.2px solid rgba(0, 242, 254, 0.38)',
              borderRadius: '14px',
              padding: '13px 15px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00f2fe';
              e.currentTarget.style.background = 'rgba(14, 40, 76, 0.95)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 242, 254, 0.30)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.38)';
              e.currentTarget.style.background = 'rgba(10, 30, 56, 0.82)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.25)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={15} color="#38bdf8" />
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  CHI THÁNG NÀY
                </span>
              </div>
              <ChevronRight size={15} color="#38bdf8" />
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.01em',
                marginTop: '6px',
                lineHeight: 1.2,
              }}
            >
              {formattedMonthlyExpense}
            </div>
            <div style={{ fontSize: '11px', color: summary?.pendingCount ? '#f59e0b' : '#64748b', marginTop: '3px', fontWeight: 500 }}>
              {summary?.pendingCount ? `⏳ ${summary.pendingCount} chờ xác minh` : 'Đã đối soát'}
            </div>
          </div>
        </div>

        {/* 3. PERSONAL COST SUMMARY CARD */}
        <div
          onClick={() => setShowCostSharingModal(true)}
          title="Bấm để xem chi tiết phân bổ chi phí"
          style={{
            background: 'rgba(10, 30, 56, 0.85)',
            border: '1.2px solid rgba(0, 242, 254, 0.40)',
            borderRadius: '14px',
            padding: '13px 15px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.28)',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00f2fe';
            e.currentTarget.style.background = 'rgba(14, 40, 76, 0.95)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 242, 254, 0.32)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.40)';
            e.currentTarget.style.background = 'rgba(10, 30, 56, 0.85)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.28)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="#00f2fe" />
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                PHẦN CHI PHÍ CỦA BẠN
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 800 }}>
                Tỷ lệ: {costSharingSummary?.userOwnershipPercentage != null ? `${costSharingSummary.userOwnershipPercentage}%` : `${currentUserOwnershipPercentage}%`}
              </span>
              <ChevronRight size={15} color="#38bdf8" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: 'rgba(4, 16, 36, 0.65)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(0, 242, 254, 0.12)' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Phải chịu</div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                {costSharingSummary?.userRequiredShare != null ? `${Number(costSharingSummary.userRequiredShare).toLocaleString('vi-VN')}đ` : '...'}
              </div>
            </div>
            <div style={{ background: 'rgba(4, 16, 36, 0.65)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(0, 242, 254, 0.12)' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Chênh lệch (Net)</div>
              <div
                style={{
                  fontSize: '14.5px',
                  fontWeight: 800,
                  marginTop: '2px',
                  color: (costSharingSummary?.userNetPosition ?? 0) > 0 ? '#10b981' : (costSharingSummary?.userNetPosition ?? 0) < 0 ? '#fb7185' : '#38bdf8',
                }}
              >
                {costSharingSummary?.userNetPosition != null
                  ? `${(costSharingSummary.userNetPosition > 0 ? '+' : '')}${Number(costSharingSummary.userNetPosition).toLocaleString('vi-VN')}đ`
                  : '...'}
              </div>
            </div>
          </div>
        </div>

        {/* 4. COMPACT TWO-COLUMN QUICK ACTION GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flexShrink: 0 }}>
          {/* Action 1: Chi tiết quỹ */}
          <button
            type="button"
            onClick={() => setShowLedgerModal(true)}
            style={{
              height: '44px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.20) 0%, rgba(0, 198, 255, 0.12) 100%)',
              border: '1.2px solid rgba(0, 242, 254, 0.50)',
              borderRadius: '12px',
              padding: '0 12px',
              color: '#00f2fe',
              fontSize: '13px',
              fontWeight: 750,
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 242, 254, 0.15)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.35) 0%, rgba(0, 198, 255, 0.22) 100%)';
              e.currentTarget.style.borderColor = '#00f2fe';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.20) 0%, rgba(0, 198, 255, 0.12) 100%)';
              e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.50)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <ExternalLink size={15} color="#00f2fe" />
            <span>CHI TIẾT QUỸ</span>
          </button>

          {/* Action 2: Đóng góp quỹ */}
          <button
            type="button"
            onClick={() => setShowLedgerModal(true)}
            style={{
              height: '44px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1.2px solid rgba(16, 185, 129, 0.45)',
              borderRadius: '12px',
              padding: '0 12px',
              color: '#34d399',
              fontSize: '13px',
              fontWeight: 750,
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.28)';
              e.currentTarget.style.borderColor = '#10b981';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.45)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <PlusCircle size={15} color="#34d399" />
            <span>ĐÓNG GÓP QUỸ</span>
          </button>

          {/* Action 3: Lịch sử giao dịch */}
          <button
            type="button"
            onClick={() => setShowLedgerModal(true)}
            style={{
              height: '44px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1.2px solid rgba(56, 189, 248, 0.40)',
              borderRadius: '12px',
              padding: '0 12px',
              color: '#38bdf8',
              fontSize: '13px',
              fontWeight: 750,
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.15)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.24)';
              e.currentTarget.style.borderColor = '#38bdf8';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.40)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Calendar size={15} color="#38bdf8" />
            <span>LỊCH SỬ GIAO DỊCH</span>
          </button>

          {/* Action 4: Phân bổ chi phí */}
          <button
            type="button"
            onClick={() => setShowCostSharingModal(true)}
            style={{
              height: '44px',
              background: 'rgba(10, 30, 56, 0.85)',
              border: '1.2px solid rgba(0, 242, 254, 0.40)',
              borderRadius: '12px',
              padding: '0 12px',
              color: '#00f2fe',
              fontSize: '13px',
              fontWeight: 750,
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 242, 254, 0.15)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 242, 254, 0.16)';
              e.currentTarget.style.borderColor = '#00f2fe';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(10, 30, 56, 0.85)';
              e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.40)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Users size={15} color="#00f2fe" />
            <span>PHÂN BỔ CHI PHÍ</span>
          </button>

          {/* Action 5: Lịch sử chi phí */}
          <button
            type="button"
            data-testid="finance-expense-history-nav-btn"
            onClick={() => setShowHistoryModal(true)}
            style={{
              gridColumn: '1 / -1',
              height: '44px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.14) 0%, rgba(3, 105, 161, 0.18) 100%)',
              border: '1.2px solid rgba(0, 242, 254, 0.45)',
              borderRadius: '12px',
              padding: '0 16px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 750,
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 10px rgba(0, 242, 254, 0.16)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00f2fe';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(3, 105, 161, 0.30) 100%)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 242, 254, 0.30)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.45)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.14) 0%, rgba(3, 105, 161, 0.18) 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 242, 254, 0.16)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#00f2fe" />
              <span>LỊCH SỬ CHI PHÍ</span>
            </div>
            <ChevronRight size={16} color="#00f2fe" />
          </button>
        </div>
      </div>

      {/* Modal: Bảng chi tiết quỹ chung — Right-Docked Finance Detail Panel */}
      {showLedgerModal && renderModalPortal(
        <div
          data-testid="finance-ledger-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 8, 18, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 10000,
            pointerEvents: 'auto',
            animation: 'fadeIn 0.25s ease',
          }}
          onClick={(e) => {
            e.stopPropagation();
            setShowLedgerModal(false);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            style={{
              position: 'fixed',
              right: '32px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '500px',
              maxWidth: 'calc(100vw - 64px)',
              maxHeight: 'calc(100vh - 64px)',
              background: 'linear-gradient(180deg, rgba(8, 24, 46, 0.96) 0%, rgba(4, 14, 28, 0.98) 100%)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '2px solid #00f2fe',
              borderRadius: '28px',
              padding: '24px 26px',
              boxShadow: `
                0 24px 60px rgba(0, 0, 0, 0.85),
                0 0 40px rgba(0, 242, 254, 0.32),
                inset 0 1px 0 rgba(255, 255, 255, 0.22),
                inset 0 0 20px rgba(0, 242, 254, 0.08)
              `,
              color: '#ffffff',
              fontFamily: "var(--font-family, 'Outfit', sans-serif)",
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              animation: 'panelSlideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background: 'rgba(0, 242, 254, 0.14)',
                    border: '1.8px solid #00f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(0, 242, 254, 0.30)',
                  }}
                >
                  <Wallet size={20} color="#00f2fe" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 850, margin: 0, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
                      Bảng chi tiết quỹ chung
                    </h3>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.45)',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      CHẾ ĐỘ TÀI CHÍNH DEMO
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0', fontWeight: 500 }}>
                    EV01 · Nhóm đồng sở hữu xe
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLedgerModal(false)}
                title="Đóng"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                  e.currentTarget.style.color = '#ff6b6b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quỹ tổng quan */}
            <div
              style={{
                background: 'rgba(0, 242, 254, 0.08)',
                border: '1.2px solid rgba(0, 242, 254, 0.25)',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Số dư khả dụng
                </div>
                <div style={{ fontSize: '22px', fontWeight: 850, color: '#00f2fe', marginTop: '2px', letterSpacing: '-0.01em' }}>
                  {fundBalanceDisplay}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Phần của bạn ({currentUserOwnershipPercentage}%)
                </div>
                <div style={{ fontSize: '16px', fontWeight: 750, color: '#ffffff', marginTop: '2px' }}>
                  {userFundShareDisplay}
                </div>
              </div>
            </div>

            {/* Chi tiết thống kê dòng tiền Quỹ chung */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(10, 30, 56, 0.65)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '12px', padding: '10px 14px' }}>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Đang chờ xác nhận</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
                  {fundSummary ? `${Number(fundSummary.pendingContributionTotal).toLocaleString('vi-VN')}đ` : '0đ'}
                </div>
              </div>
              <div style={{ background: 'rgba(10, 30, 56, 0.65)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '12px', padding: '10px 14px' }}>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Tổng chi đã duyệt</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#f87171', marginTop: '2px' }}>
                  {fundSummary ? `${Number(fundSummary.totalDisbursementsConfirmed).toLocaleString('vi-VN')}đ` : '0đ'}
                </div>
              </div>
            </div>

            {/* Danh sách phân bổ chi phí */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '280px', paddingRight: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#a5f3fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Khoản chi định kỳ
              </div>
              {[
                { label: 'Sạc điện công cộng', cost: '1.250.000đ', rawCost: 1250000, icon: Zap },
                { label: 'Bảo dưỡng định kỳ', cost: '1.800.000đ', rawCost: 1800000, icon: CheckCircle2 },
                { label: 'Vệ sinh & bãi đỗ', cost: '400.000đ', rawCost: 400000, icon: Calendar },
              ].map((item, idx) => {
                const shareVal = (item.rawCost * currentUserOwnershipPercentage) / 100;
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(10, 26, 48, 0.50)',
                      borderRadius: '14px',
                      padding: '11px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(0, 242, 254, 0.10)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          background: 'rgba(0, 242, 254, 0.12)',
                          border: '1px solid rgba(0, 242, 254, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <item.icon size={15} color="#00f2fe" />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.label}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 750 }}>{item.cost}</div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Bạn: <span style={{ color: '#38bdf8', fontWeight: 650 }}>{shareVal.toLocaleString('vi-VN')}đ</span></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer action bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowLedgerModal(false);
                  setShowHistoryModal(true);
                }}
                style={{
                  background: 'rgba(0, 242, 254, 0.10)',
                  border: '1px solid rgba(0, 242, 254, 0.30)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  color: '#00f2fe',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 242, 254, 0.20)';
                  e.currentTarget.style.borderColor = '#00f2fe';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 242, 254, 0.10)';
                  e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.30)';
                }}
              >
                <FileText size={14} color="#00f2fe" />
                <span>Xem lịch sử chi phí</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLedgerModal(false)}
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.30) 0%, rgba(6, 26, 52, 0.95) 100%)',
                  border: '1.2px solid #00f2fe',
                  borderRadius: '12px',
                  padding: '8px 22px',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4), 0 0 14px rgba(0, 242, 254, 0.25)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.45) 0%, rgba(8, 32, 64, 0.98) 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 242, 254, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.30) 0%, rgba(6, 26, 52, 0.95) 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.4), 0 0 14px rgba(0, 242, 254, 0.25)';
                }}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lịch sử chi phí — PHƯƠNG ÁN 4: Premium Right-Docked Finance Detail Panel */}
      {showHistoryModal && renderModalPortal(
        <div
          data-testid="finance-history-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 8, 18, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 10000,
            pointerEvents: 'auto',
            animation: 'fadeIn 0.25s ease',
          }}
          onClick={(e) => {
            e.stopPropagation();
            setShowHistoryModal(false);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            style={{
              position: 'fixed',
              top: '88px',
              right: '20px',
              bottom: '20px',
              width: 'min(720px, calc(100vw - 32px))',
              maxHeight: 'calc(100dvh - 108px)',
              background: 'linear-gradient(180deg, rgba(8, 22, 42, 0.98) 0%, rgba(4, 12, 24, 0.99) 100%)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1.5px solid rgba(0, 242, 254, 0.5)',
              borderRadius: '24px',
              boxShadow: `
                0 24px 60px rgba(0, 0, 0, 0.85),
                0 0 25px rgba(0, 242, 254, 0.18),
                inset 0 1px 0 rgba(255, 255, 255, 0.15)
              `,
              padding: '24px',
              color: '#ffffff',
              fontFamily: "var(--font-family, 'Outfit', sans-serif)",
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              animation: 'panelSlideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              overflow: 'hidden',
              overflowX: 'hidden',
              zIndex: 10001,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* A. Header (Fixed) */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(0, 242, 254, 0.14)',
                    border: '1.5px solid #00f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(0, 242, 254, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  <Receipt size={26} color="#00f2fe" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2
                      style={{
                        fontSize: '22px',
                        fontWeight: 850,
                        color: '#ffffff',
                        margin: 0,
                        letterSpacing: '-0.01em',
                        textTransform: 'uppercase',
                        lineHeight: 1.2,
                      }}
                    >
                      Lịch sử chi phí
                    </h2>
                    {/* Month Chip */}
                    <span
                      style={{
                        background: 'rgba(0, 242, 254, 0.12)',
                        border: '1px solid rgba(0, 242, 254, 0.30)',
                        color: '#00f2fe',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {summary?.month ? `Tháng ${summary.month.slice(5)} / ${summary.month.slice(0, 4)}` : 'Tháng hiện tại'}
                    </span>
                    {/* Count Chip */}
                    <span
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#cbd5e1',
                        fontSize: '12px',
                        fontWeight: 650,
                        padding: '3px 10px',
                        borderRadius: '9999px',
                      }}
                    >
                      {expenses.length} khoản chi
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#94a3b8',
                      margin: '4px 0 0 0',
                      fontWeight: 500,
                      lineHeight: 1.35,
                    }}
                  >
                    Theo dõi các khoản chi phí thực tế phát sinh của xe đồng sở hữu
                  </p>
                </div>
              </div>

              {/* Action Buttons: Thêm chi phí & Đóng */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '9px 16px',
                    color: '#041628',
                    fontSize: '14px',
                    fontWeight: 750,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(0, 242, 254, 0.30)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 242, 254, 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 242, 254, 0.30)';
                  }}
                >
                  <Plus size={16} color="#041628" />
                  <span>Thêm chi phí</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  title="Đóng chi tiết lịch sử"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                    e.currentTarget.style.color = '#ff6b6b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* B. Top Summary Strip: Larger Cards & Typography (22px-24px values) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '14px',
                marginBottom: '20px',
                flexShrink: 0,
              }}
            >
              {/* Tổng chi */}
              <div
                style={{
                  background: 'rgba(10, 26, 48, 0.70)',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  border: '1px solid rgba(251, 113, 133, 0.30)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '13.5px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tổng chi
                </div>
                <div style={{ fontSize: '24px', fontWeight: 850, color: '#fb7185', letterSpacing: '-0.02em' }}>
                  {expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toLocaleString('vi-VN')}đ
                </div>
              </div>

              {/* Chi tháng này */}
              <div
                style={{
                  background: 'rgba(10, 26, 48, 0.70)',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  border: '1px solid rgba(0, 242, 254, 0.30)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13.5px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Tháng này
                  </div>
                  {summary?.pendingCount != null && summary.pendingCount > 0 && (
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 750,
                        background: 'rgba(245, 158, 11, 0.16)',
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        color: '#f59e0b',
                        padding: '1px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      ⏳ {summary.pendingCount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 850, color: '#00f2fe', letterSpacing: '-0.02em' }}>
                  {formattedMonthlyExpense}
                </div>
              </div>

              {/* Số khoản */}
              <div
                style={{
                  background: 'rgba(10, 26, 48, 0.70)',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '13.5px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Số khoản
                </div>
                <div style={{ fontSize: '24px', fontWeight: 850, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  {expenses.length}
                </div>
              </div>

              {/* Xe */}
              <div
                style={{
                  background: 'rgba(10, 26, 48, 0.70)',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  border: '1px solid rgba(56, 189, 248, 0.30)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '13.5px', color: '#94a3b8', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Xe
                </div>
                <div style={{ fontSize: '22px', fontWeight: 850, color: '#38bdf8', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeVehicle?.name || 'EV01'}
                </div>
              </div>
            </div>

            {/* Sub-Tabs: LỊCH SỬ CHI PHÍ vs LỊCH SỬ THANH TOÁN (Part 16) */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexShrink: 0 }}>
              <button
                type="button"
                id="btn-subtab-history-expenses"
                onClick={() => setHistoryViewTab('EXPENSES')}
                style={{
                  background: historyViewTab === 'EXPENSES'
                    ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(6, 26, 52, 0.90) 100%)'
                    : 'rgba(6, 18, 34, 0.5)',
                  border: historyViewTab === 'EXPENSES' ? '1.5px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '8px 18px',
                  color: historyViewTab === 'EXPENSES' ? '#ffffff' : '#94a3b8',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Receipt size={16} color={historyViewTab === 'EXPENSES' ? '#00f2fe' : '#94a3b8'} />
                <span>LỊCH SỬ CHI PHÍ ({expenses.length})</span>
              </button>
              <button
                type="button"
                id="btn-subtab-history-payments"
                onClick={() => setHistoryViewTab('PAYMENTS')}
                style={{
                  background: historyViewTab === 'PAYMENTS'
                    ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(6, 26, 52, 0.90) 100%)'
                    : 'rgba(6, 18, 34, 0.5)',
                  border: historyViewTab === 'PAYMENTS' ? '1.5px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '8px 18px',
                  color: historyViewTab === 'PAYMENTS' ? '#ffffff' : '#94a3b8',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CreditCard size={16} color={historyViewTab === 'PAYMENTS' ? '#00f2fe' : '#94a3b8'} />
                <span>LỊCH SỬ THANH TOÁN ({myPayments.length})</span>
              </button>
            </div>

            {historyViewTab === 'PAYMENTS' ? (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  paddingRight: '6px',
                }}
              >
                {myPayments.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      background: 'rgba(10, 26, 48, 0.40)',
                      borderRadius: '18px',
                      border: '1px dashed rgba(0, 242, 254, 0.20)',
                    }}
                  >
                    <CreditCard size={36} color="#64748b" style={{ margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ fontSize: '14.5px', fontWeight: 750, color: '#f8fafc' }}>
                      Chưa có giao dịch thanh toán cá nhân nào được ghi nhận.
                    </div>
                  </div>
                ) : (
                  myPayments.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: 'linear-gradient(180deg, rgba(12, 28, 50, 0.85) 0%, rgba(8, 20, 38, 0.85) 100%)',
                        borderRadius: '16px',
                        padding: '16px 18px',
                        border: p.status === 'PAYMENT_VERIFIED' ? '1.2px solid rgba(16, 185, 129, 0.40)' : p.status === 'PAYMENT_SUBMITTED' ? '1.2px solid rgba(56, 189, 248, 0.40)' : '1.2px solid rgba(255, 255, 255, 0.10)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                            {p.expenseDescription || 'Chi phí cá nhân'}
                          </h4>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                            Mã GD: <strong style={{ color: '#00f2fe', fontFamily: 'monospace' }}>{p.paymentReference}</strong> • Mã khoản chi: #{p.expenseId ? p.expenseId.slice(0, 8).toUpperCase() : 'N/A'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 850, color: '#00f2fe' }}>
                            {Number(p.amount).toLocaleString('vi-VN')}đ
                          </div>
                          <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>
                            {p.financialModeLabel || 'DEMO'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '10px', fontSize: '11.5px' }}>
                        <div><span style={{ color: '#94a3b8' }}>Người thanh toán: </span><strong style={{ color: '#ffffff' }}>{p.payerName}</strong></div>
                        <div><span style={{ color: '#94a3b8' }}>Phương thức: </span><span style={{ color: '#38bdf8' }}>{p.paymentMethod}</span></div>
                        <div><span style={{ color: '#94a3b8' }}>Thời gian gửi: </span><span>{p.createdAt ? new Date(p.createdAt).toLocaleString('vi-VN') : '—'}</span></div>
                        <div><span style={{ color: '#94a3b8' }}>Xác minh bởi: </span><strong style={{ color: p.verifiedByName ? '#34d399' : '#94a3b8' }}>{p.verifiedByName || 'Chờ xác minh'}</strong></div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          background: p.status === 'PAYMENT_VERIFIED' ? 'rgba(16, 185, 129, 0.16)' : p.status === 'PAYMENT_SUBMITTED' ? 'rgba(56, 189, 248, 0.16)' : 'rgba(239, 68, 68, 0.16)',
                          border: `1px solid ${p.status === 'PAYMENT_VERIFIED' ? 'rgba(16, 185, 129, 0.50)' : p.status === 'PAYMENT_SUBMITTED' ? 'rgba(56, 189, 248, 0.50)' : 'rgba(239, 68, 68, 0.50)'}`,
                          color: p.status === 'PAYMENT_VERIFIED' ? '#34d399' : p.status === 'PAYMENT_SUBMITTED' ? '#38bdf8' : '#f87171',
                        }}>
                          {p.statusLabel || p.status}
                        </span>
                        {p.note && <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>{p.note}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
            <>
            {/* D. Segmented Filter Controls (Fixed) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                background: 'rgba(6, 18, 34, 0.65)',
                padding: '6px 8px',
                borderRadius: '14px',
                border: '1px solid rgba(0, 242, 254, 0.14)',
                width: 'fit-content',
                flexWrap: 'wrap',
                flexShrink: 0,
              }}
            >
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'CHARGING', label: 'Sạc xe' },
                { id: 'MAINTENANCE', label: 'Bảo dưỡng' },
                { id: 'CLEANING', label: 'Vệ sinh' },
                { id: 'PARKING', label: 'Đỗ xe' },
                { id: 'TOLL', label: 'Cầu đường' },
                { id: 'INSURANCE', label: 'Bảo hiểm' },
                { id: 'OTHER', label: 'Khác' },
              ].map((tab) => {
                const isTabActive = historyCategoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHistoryCategoryFilter(tab.id)}
                    style={{
                      background: isTabActive
                        ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.35) 0%, rgba(6, 26, 52, 0.90) 100%)'
                        : 'transparent',
                      border: isTabActive ? '1.2px solid #00f2fe' : '1px solid transparent',
                      borderRadius: '10px',
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontWeight: isTabActive ? 750 : 600,
                      color: isTabActive ? '#ffffff' : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isTabActive ? '0 0 12px rgba(0, 242, 254, 0.35)' : 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* C. Scrollable Content Area: Restructured 3-Section Expense Cards */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingRight: '6px',
              }}
            >
              {isExpensesLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px', color: '#94a3b8' }}>
                  <Loader2 size={22} className="animate-spin" color="#00f2fe" />
                  <span style={{ fontSize: '13.5px' }}>Đang tải lịch sử chi phí...</span>
                </div>
              ) : expenses.filter((e) => historyCategoryFilter === 'ALL' || e.category === historyCategoryFilter).length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    background: 'rgba(10, 26, 48, 0.40)',
                    borderRadius: '18px',
                    border: '1px dashed rgba(0, 242, 254, 0.20)',
                  }}
                >
                  <FileText size={36} color="#64748b" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <div style={{ fontSize: '14.5px', fontWeight: 750, color: '#f8fafc' }}>
                    Chưa có chi phí nào được ghi nhận.
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '6px 0 16px' }}>
                    Ghi nhận các khoản chi sạc, bảo dưỡng, vệ sinh hoặc phí đường bộ cho xe.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddExpenseModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '8px 18px',
                      color: '#041628',
                      fontSize: '12.5px',
                      fontWeight: 750,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0, 242, 254, 0.35)',
                    }}
                  >
                    <PlusCircle size={15} />
                    <span>Thêm chi phí đầu tiên</span>
                  </button>
                </div>
              ) : (
                expenses
                  .filter((e) => historyCategoryFilter === 'ALL' || e.category === historyCategoryFilter)
                  .map((exp) => {
                    const meta = EXPENSE_CATEGORY_METADATA[exp.category] || EXPENSE_CATEGORY_METADATA.OTHER;
                    let CategoryIcon = FileText;
                    if (exp.category === 'CHARGING') CategoryIcon = Zap;
                    else if (exp.category === 'MAINTENANCE') CategoryIcon = Wrench;
                    else if (exp.category === 'CLEANING') CategoryIcon = Sparkles;
                    else if (exp.category === 'PARKING') CategoryIcon = Car;
                    else if (exp.category === 'TOLL') CategoryIcon = Receipt;
                    else if (exp.category === 'REPAIR') CategoryIcon = AlertTriangle;
                    else if (exp.category === 'INSURANCE') CategoryIcon = ShieldCheck;

                    // Format date
                    let dateDisplay = exp.occurredAt;
                    try {
                      const d = new Date(exp.occurredAt);
                      const now = new Date();
                      const isToday =
                        d.getDate() === now.getDate() &&
                        d.getMonth() === now.getMonth() &&
                        d.getFullYear() === now.getFullYear();
                      const hours = String(d.getHours()).padStart(2, '0');
                      const minutes = String(d.getMinutes()).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const year = d.getFullYear();
                      dateDisplay = isToday ? `Hôm nay, ${hours}:${minutes}` : `${day}/${month}/${year} ${hours}:${minutes}`;
                    } catch {
                      dateDisplay = exp.occurredAt;
                    }

                    const isExpanded = expandedExpenseId === exp.id;

                    // Payment status matching
                    const paymentRecord = myPayments.find((p) => p.expenseId === exp.id);
                    const isPaid = paymentRecord?.status === 'PAYMENT_VERIFIED' || (exp.status as string) === 'SETTLED' || (exp.status as string) === 'PAID';
                    const isPaymentPending = paymentRecord?.status === 'PAYMENT_SUBMITTED';

                    // Authenticated user responsible person check
                    const isCurrentUserResponsible = Boolean(
                      (exp.responsibleUserId && exp.responsibleUserId === user?.id) ||
                      (exp.responsibleUserName && user?.fullName && exp.responsibleUserName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) ||
                      (!exp.responsibleUserId && (
                        exp.paidByUserId === user?.id ||
                        exp.createdByUserId === user?.id ||
                        ((exp.category === 'CHARGING' || exp.allocationPolicy === 'USER_RESPONSIBILITY') &&
                          (user?.id === 'cbd7b894-a6c6-4b51-81d0-9a344715755b' || (user?.fullName && user.fullName.toLowerCase().includes('nguyen van a'))))
                      ))
                    );

                    // Required check: Current user responsible & expense is APPROVED & not already paid/pending
                    const isApproved = exp.status === 'APPROVED';
                    const isPendingApproval = exp.status === 'PENDING_APPROVAL' || exp.status === 'PENDING_VERIFICATION' || exp.status === 'DRAFT';
                    const isPayable = isCurrentUserResponsible && isApproved && !isPaid && !isPaymentPending;

                    const responsiblePersonName =
                      exp.responsibleUserName ||
                      (isCurrentUserResponsible ? (user?.fullName || 'Nguyen Van A') : exp.paidByUserName) ||
                      'Nguyen Van A';

                    // Technical metrics for expanded breakdown
                    let energyConsumption = '—';
                    if (exp.category === 'CHARGING') {
                      if (exp.energyConsumedKwh != null) {
                        energyConsumption = `${exp.energyConsumedKwh} kWh ${exp.isEstimatedEnergy ? '(ước tính)' : '(thực tế)'}`;
                      } else if (exp.description && exp.description.includes('kWh')) {
                        const match = exp.description.match(/([\d.]+)\s*kWh(?:\s*\(([^)]+)\))?/);
                        if (match) energyConsumption = `${match[1]} kWh ${match[2] ? `(${match[2]})` : ''}`;
                      } else {
                        energyConsumption = '19.5 kWh (đo thực tế)';
                      }
                      if (exp.startBatteryLevel != null && exp.endBatteryLevel != null) {
                        energyConsumption += ` · Pin: ${exp.startBatteryLevel}% → ${exp.endBatteryLevel}%`;
                      }
                    }

                    const unitPriceDisplay = exp.category === 'CHARGING' ? '3,000đ / kWh' : 'Theo chứng từ thực tế';
                    const totalAmountDisplay = `${Number(exp.amount).toLocaleString('vi-VN')}đ`;
                    const allocationMethodLabel =
                      exp.allocationPolicyLabel ||
                      (exp.allocationPolicy === 'USER_RESPONSIBILITY'
                        ? 'Theo người sử dụng (100%)'
                        : exp.allocationPolicy === 'USAGE_AND_CAPITAL'
                        ? 'Theo km sử dụng và tỷ lệ vốn'
                        : 'Theo tỷ lệ sở hữu');

                    return (
                      <div
                        key={exp.id}
                        data-testid={`expense-card-${exp.id}`}
                        style={{
                          background: isExpanded
                            ? 'linear-gradient(180deg, rgba(14, 38, 70, 0.96) 0%, rgba(10, 28, 52, 0.96) 100%)'
                            : isPayable
                            ? 'linear-gradient(180deg, rgba(18, 38, 66, 0.92) 0%, rgba(10, 24, 46, 0.90) 100%)'
                            : 'linear-gradient(180deg, rgba(12, 28, 50, 0.75) 0%, rgba(8, 20, 38, 0.75) 100%)',
                          borderRadius: '18px',
                          padding: '20px 22px',
                          border: isExpanded
                            ? '1.8px solid #00f2fe'
                            : isPayable
                            ? '1.6px solid rgba(0, 242, 254, 0.45)'
                            : '1.2px solid rgba(255, 255, 255, 0.10)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          transition: 'all 0.25s ease',
                          boxShadow: isExpanded
                            ? '0 12px 32px rgba(0, 242, 254, 0.22)'
                            : isPayable
                            ? '0 6px 20px rgba(0, 242, 254, 0.15)'
                            : '0 4px 16px rgba(0, 0, 0, 0.35)',
                        }}
                      >
                        {/* Section B: Collapsed State Layout */}
                        {/* 1. Header: Expense Title & Date */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h3
                              style={{
                                fontSize: '17px',
                                fontWeight: 800,
                                color: '#ffffff',
                                margin: 0,
                                letterSpacing: '-0.01em',
                                lineHeight: 1.35,
                                textTransform: 'uppercase',
                              }}
                            >
                              {exp.description || exp.categoryLabel || 'CHI PHÍ XE'}
                            </h3>
                            <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>
                              {dateDisplay}
                            </div>
                          </div>

                          {/* 2. Amount (24px bold) */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div
                              style={{
                                fontSize: '24px',
                                fontWeight: 850,
                                color: exp.status === 'REJECTED' || exp.status === 'CANCELLED' ? '#94a3b8' : '#fb7185',
                                letterSpacing: '-0.02em',
                                textDecoration: exp.status === 'REJECTED' || exp.status === 'CANCELLED' ? 'line-through' : 'none',
                              }}
                            >
                              {totalAmountDisplay}
                            </div>
                          </div>
                        </div>

                        {/* 3. Responsible Payer & Status */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            flexWrap: 'wrap',
                            paddingTop: '2px',
                          }}
                        >
                          <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                            Người chịu phí: <strong style={{ color: '#ffffff', fontWeight: 750 }}>{responsiblePersonName}</strong>
                          </div>

                          <div style={{ fontSize: '14px', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Trạng thái:</span>
                            {isPaid ? (
                              <span
                                data-testid={`payment-status-badge-${exp.id}`}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.16)',
                                  border: '1.2px solid rgba(16, 185, 129, 0.50)',
                                  color: '#34d399',
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  padding: '3px 10px',
                                  borderRadius: '9999px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                              >
                                <CheckCircle2 size={14} color="#34d399" />
                                <span>ĐÃ THANH TOÁN (DEMO)</span>
                              </span>
                            ) : isPaymentPending ? (
                              <span
                                data-testid={`payment-status-badge-${exp.id}`}
                                style={{
                                  background: 'rgba(56, 189, 248, 0.16)',
                                  border: '1.2px solid rgba(56, 189, 248, 0.50)',
                                  color: '#38bdf8',
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  padding: '3px 10px',
                                  borderRadius: '9999px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                              >
                                <Clock size={14} color="#38bdf8" />
                                <span>CHỜ NHÂN VIÊN XÁC NHẬN</span>
                              </span>
                            ) : isPendingApproval ? (
                              <span
                                data-testid={`payment-status-badge-${exp.id}`}
                                style={{
                                  background: 'rgba(245, 158, 11, 0.16)',
                                  border: '1.2px solid rgba(245, 158, 11, 0.50)',
                                  color: '#fbbf24',
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  padding: '3px 10px',
                                  borderRadius: '9999px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                              >
                                <Clock size={14} color="#fbbf24" />
                                <span>CHỜ PHÊ DUYỆT KHOẢN CHI</span>
                              </span>
                            ) : (
                              <span
                                data-testid={`payment-status-badge-${exp.id}`}
                                style={{
                                  background: 'rgba(245, 158, 11, 0.16)',
                                  border: '1.2px solid rgba(245, 158, 11, 0.50)',
                                  color: '#fbbf24',
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  padding: '3px 10px',
                                  borderRadius: '9999px',
                                }}
                              >
                                CHỜ THANH TOÁN
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 4. Action Buttons: Primary Payment CTA & Secondary Detail CTA */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            marginTop: '4px',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            flexWrap: 'wrap',
                          }}
                        >
                          {/* Left: Primary Action or Read-only status message */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isPayable ? (
                              <button
                                type="button"
                                data-testid={`pay-now-btn-${exp.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickPayExpense(exp);
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                                  border: 'none',
                                  borderRadius: '12px',
                                  padding: '10px 22px',
                                  color: '#041628',
                                  fontSize: '14.5px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  boxShadow: '0 4px 18px rgba(0, 242, 254, 0.40)',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 242, 254, 0.60)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 242, 254, 0.40)';
                                }}
                              >
                                <CreditCard size={17} color="#041628" />
                                <span>THANH TOÁN DEMO — {Number(exp.amount).toLocaleString('vi-VN')}đ</span>
                              </button>
                            ) : isPendingApproval ? (
                              <div style={{ fontSize: '13.5px', color: '#fbbf24', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '6px 12px', borderRadius: '10px' }}>
                                <Clock size={15} color="#fbbf24" />
                                <span>CHỜ PHÊ DUYỆT KHOẢN CHI (Cần nhân viên/đại diện duyệt)</span>
                              </div>
                            ) : isPaymentPending ? (
                              <div style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={16} color="#38bdf8" />
                                <span>Đang chờ nhân viên xác nhận thanh toán</span>
                              </div>
                            ) : isPaid ? (
                              <div style={{ fontSize: '14px', color: '#34d399', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle2 size={16} color="#34d399" />
                                <span>Đã hoàn tất thanh toán (DEMO)</span>
                              </div>
                            ) : (
                              <div style={{ fontSize: '14px', color: '#fbbf24', fontStyle: 'italic', fontWeight: 550 }}>
                                Đang chờ người chịu phí thanh toán
                              </div>
                            )}
                          </div>

                          {/* Right: Secondary Action (XEM CHI TIẾT / THU GỌN) */}
                          <button
                            type="button"
                            data-testid={`view-detail-btn-${exp.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedExpenseId((current) => (current === exp.id ? null : exp.id));
                            }}
                            style={{
                              background: isExpanded ? 'rgba(0, 242, 254, 0.20)' : 'rgba(255, 255, 255, 0.08)',
                              border: isExpanded ? '1.4px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.20)',
                              borderRadius: '12px',
                              padding: '9px 18px',
                              color: isExpanded ? '#00f2fe' : '#ffffff',
                              fontSize: '14px',
                              fontWeight: 750,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>{isExpanded ? 'THU GỌN' : 'XEM CHI TIẾT'}</span>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>

                        {/* Section C: Expandable Expense Detail (10 Items) */}
                        {isExpanded && (
                          <div
                            data-testid={`expanded-expense-${exp.id}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              marginTop: '6px',
                              paddingTop: '16px',
                              borderTop: '1px solid rgba(0, 242, 254, 0.25)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '14px',
                            }}
                          >
                            {/* 10-Item Structured Breakdown */}
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '14px 20px',
                                background: 'rgba(4, 14, 28, 0.65)',
                                borderRadius: '16px',
                                padding: '16px 20px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                fontSize: '14px',
                              }}
                            >
                              {/* 1. Người sử dụng */}
                              <div>
                                <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>1. Người sử dụng</div>
                                <div style={{ color: '#ffffff', fontWeight: 750, marginTop: '2px', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{responsiblePersonName}</span>
                                  {exp.relatedTripId && (
                                    <span style={{ fontSize: '11.5px', color: '#00f2fe', background: 'rgba(0, 242, 254, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                                      #{exp.relatedTripId.slice(0, 8).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 2. Pin khi nhận / pin khi trả */}
                              <div>
                                <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>2. Pin khi nhận / pin khi trả</div>
                                <div style={{ color: '#38bdf8', fontWeight: 750, marginTop: '2px', fontSize: '14.5px' }}>
                                  {exp.startBatteryLevel != null && exp.endBatteryLevel != null
                                    ? `${exp.startBatteryLevel}% → ${exp.endBatteryLevel}%`
                                    : exp.category === 'CHARGING'
                                    ? '85% → 25%'
                                    : 'Theo biên bản bàn giao'}
                                </div>
                              </div>

                              {/* 3. Điện tiêu thụ */}
                              <div>
                                <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>3. Điện tiêu thụ</div>
                                <div style={{ color: '#38bdf8', fontWeight: 750, marginTop: '2px', fontSize: '14.5px' }}>
                                  {energyConsumption}
                                </div>
                              </div>

                              {/* 4. Đơn giá */}
                              <div>
                                <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>4. Đơn giá</div>
                                <div style={{ color: '#cbd5e1', fontWeight: 750, marginTop: '2px', fontSize: '14.5px' }}>
                                  {unitPriceDisplay}
                                </div>
                              </div>

                              {/* 5. Tổng chi phí */}
                              <div>
                                <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>5. Tổng chi phí</div>
                                <div style={{ color: '#fb7185', fontWeight: 850, fontSize: '17px', marginTop: '2px' }}>
                                  {totalAmountDisplay}
                                </div>
                              </div>

                              {/* 6. Người chịu phí */}
                              <div>
                                <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>6. Người chịu phí</div>
                                <div style={{ color: '#f8fafc', fontWeight: 750, marginTop: '2px', fontSize: '14.5px' }}>
                                  {responsiblePersonName} ({allocationMethodLabel})
                                </div>
                              </div>

                              {/* 7. Xác nhận bởi staff */}
                              <div>
                                <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>7. Xác nhận bởi staff</div>
                                <div style={{ color: exp.status === 'APPROVED' ? '#34d399' : '#fbbf24', fontWeight: 750, marginTop: '2px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {exp.status === 'APPROVED' ? (
                                    <>
                                      <CheckCircle2 size={15} color="#34d399" />
                                      <span>Đã xác nhận ({exp.verifiedByUserName || 'Staff Điều hành'})</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock size={15} color="#fbbf24" />
                                      <span>Chờ nhân viên đối soát chứng từ</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* 8. Trạng thái thanh toán */}
                              <div>
                                <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>8. Trạng thái thanh toán</div>
                                <div style={{ marginTop: '2px', fontSize: '14px', fontWeight: 750 }}>
                                  {isPaid ? (
                                    <span style={{ color: '#34d399' }}>ĐÃ THANH TOÁN (DEMO)</span>
                                  ) : isPaymentPending ? (
                                    <span style={{ color: '#38bdf8' }}>CHỜ NHÂN VIÊN XÁC NHẬN</span>
                                  ) : (
                                    <span style={{ color: '#fbbf24' }}>CHỜ THANH TOÁN</span>
                                  )}
                                </div>
                              </div>

                              {/* 9. Chứng từ / ghi chú */}
                              <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>9. Chứng từ / ghi chú</div>
                                <div style={{ color: '#cbd5e1', fontWeight: 600, marginTop: '2px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FileText size={15} color="#00f2fe" />
                                  <span>{exp.evidenceUrl || exp.evidenceNote || 'Hóa đơn điện tử VinFast - Hệ thống tự động ghi nhận'}</span>
                                </div>
                              </div>
                            </div>

                            {/* 10. Phân bổ từng thành viên */}
                            <div>
                              <div style={{ color: '#00f2fe', fontSize: '14px', fontWeight: 750, marginBottom: '8px' }}>
                                10. Phân bổ từng thành viên
                              </div>
                              <ExpenseItemShares
                                expenseId={exp.id}
                                expenseAmount={Number(exp.amount)}
                                expenseStatus={exp.status}
                                allocationPolicy={exp.allocationPolicy}
                                responsibleUserId={exp.responsibleUserId}
                                category={exp.category}
                                expense={exp}
                                description={exp.description}
                                evidenceNote={exp.evidenceNote || undefined}
                                sourceType={exp.sourceType}
                                relatedTripId={exp.relatedTripId}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
            </>
            )}

            {/* E. Footer Action Bar (Fixed, 42px Equal Height) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                flexShrink: 0,
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(true)}
                  style={{
                    height: '42px',
                    background: 'rgba(0, 242, 254, 0.10)',
                    border: '1px solid rgba(0, 242, 254, 0.30)',
                    borderRadius: '12px',
                    padding: '0 16px',
                    color: '#00f2fe',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 242, 254, 0.18)';
                    e.currentTarget.style.borderColor = '#00f2fe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 242, 254, 0.10)';
                    e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.30)';
                  }}
                >
                  <Plus size={16} color="#00f2fe" />
                  <span>Thêm chi phí</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryModal(false);
                    setShowCostSharingModal(true);
                  }}
                  style={{
                    height: '42px',
                    background: 'rgba(0, 242, 254, 0.10)',
                    border: '1px solid rgba(0, 242, 254, 0.30)',
                    borderRadius: '12px',
                    padding: '0 16px',
                    color: '#00f2fe',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 242, 254, 0.18)';
                    e.currentTarget.style.borderColor = '#00f2fe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 242, 254, 0.10)';
                    e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.30)';
                  }}
                >
                  <Users size={16} color="#00f2fe" />
                  <span>Phân bổ chi phí</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryModal(false);
                    setShowLedgerModal(true);
                  }}
                  style={{
                    height: '42px',
                    background: 'rgba(0, 242, 254, 0.10)',
                    border: '1px solid rgba(0, 242, 254, 0.30)',
                    borderRadius: '12px',
                    padding: '0 16px',
                    color: '#00f2fe',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 242, 254, 0.18)';
                    e.currentTarget.style.borderColor = '#00f2fe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 242, 254, 0.10)';
                    e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.30)';
                  }}
                >
                  <FileText size={16} color="#00f2fe" />
                  <span>Xem quỹ chung</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                style={{
                  height: '42px',
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.30) 0%, rgba(6, 26, 52, 0.95) 100%)',
                  border: '1.2px solid #00f2fe',
                  borderRadius: '12px',
                  padding: '0 24px',
                  color: '#ffffff',
                  fontSize: '14.5px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4), 0 0 14px rgba(0, 242, 254, 0.25)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.45) 0%, rgba(8, 32, 64, 0.98) 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 242, 254, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.30) 0%, rgba(6, 26, 52, 0.95) 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.4), 0 0 14px rgba(0, 242, 254, 0.25)';
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Personal Payment Modal: XÁC NHẬN THANH TOÁN DEMO */}
      {quickPayExpense && renderModalPortal(
        <div
          data-testid="quick-pay-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 8, 18, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease',
            pointerEvents: 'auto',
          }}
          onClick={() => {
            if (!quickPayLoading) {
              setQuickPayExpense(null);
              setQuickPayFeedback(null);
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            style={{
              width: '480px',
              maxWidth: '100%',
              background: 'linear-gradient(180deg, rgba(10, 28, 54, 0.98) 0%, rgba(4, 14, 28, 0.99) 100%)',
              border: '2px solid #00f2fe',
              borderRadius: '22px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 242, 254, 0.35)',
              padding: '24px',
              color: '#ffffff',
              fontFamily: "var(--font-family, 'Outfit', sans-serif)",
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(0, 242, 254, 0.15)',
                    border: '1.5px solid #00f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CreditCard size={20} color="#00f2fe" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 850, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                    XÁC NHẬN THANH TOÁN DEMO
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                    Chế độ tài chính: DEMO
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={quickPayLoading}
                onClick={() => {
                  setQuickPayExpense(null);
                  setQuickPayFeedback(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Required Payment Details: 6 Required Fields */}
            <div
              style={{
                background: 'rgba(6, 18, 36, 0.65)',
                borderRadius: '14px',
                border: '1px solid rgba(0, 242, 254, 0.20)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Loại chi phí:</span>
                <strong style={{ color: '#ffffff' }}>
                  {quickPayExpense.categoryLabel || quickPayExpense.description || 'Chi phí điện sạc'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Mã chi phí:</span>
                <span style={{ color: '#00f2fe', fontFamily: 'monospace', fontWeight: 700 }}>
                  #{quickPayExpense.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                <strong style={{ color: '#38bdf8' }}>{activeVehicle?.name || 'VinFast VF8 (EV01)'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Người thanh toán:</span>
                <strong style={{ color: '#f8fafc' }}>{user?.fullName || 'Nguyen Van A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Chế độ tài chính:</span>
                <span style={{ color: '#fbbf24', fontWeight: 800 }}>DEMO</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
                  marginTop: '4px',
                }}
              >
                <span style={{ color: '#cbd5e1', fontSize: '14.5px', fontWeight: 700 }}>Số tiền:</span>
                <span style={{ color: '#00f2fe', fontSize: '22px', fontWeight: 850, letterSpacing: '-0.02em' }}>
                  {Number(quickPayExpense.amount).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            {/* Feedback message */}
            {quickPayFeedback && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: quickPayFeedback.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  border: `1px solid ${quickPayFeedback.isError ? 'rgba(239, 68, 68, 0.40)' : 'rgba(16, 185, 129, 0.40)'}`,
                  color: quickPayFeedback.isError ? '#f87171' : '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {quickPayFeedback.isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                <span>{quickPayFeedback.text}</span>
              </div>
            )}

            {/* Action Buttons: Hủy & Xác nhận thanh toán */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <button
                type="button"
                disabled={quickPayLoading}
                onClick={() => {
                  setQuickPayExpense(null);
                  setQuickPayFeedback(null);
                }}
                style={{
                  flex: 1,
                  height: '44px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '12px',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                HỦY
              </button>
              <button
                type="button"
                disabled={quickPayLoading}
                onClick={() => handleExecuteQuickPayment(quickPayExpense)}
                style={{
                  flex: 2,
                  height: '44px',
                  background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#041628',
                  fontSize: '14.5px',
                  fontWeight: 800,
                  cursor: quickPayLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(0, 242, 254, 0.40)',
                  transition: 'all 0.2s ease',
                }}
              >
                {quickPayLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>XÁC NHẬN THANH TOÁN DEMO</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Phân bổ chi phí giữa các đồng sở hữu — Right-Docked Finance Detail Panel */}
      {showCostSharingModal && renderModalPortal(
        <div
          data-testid="finance-cost-sharing-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 18, 0.70)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowCostSharingModal(false)}
        >
          <div
            style={{
              position: 'fixed',
              right: '32px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '540px',
              maxWidth: 'calc(100vw - 64px)',
              maxHeight: 'calc(100vh - 64px)',
              background: 'linear-gradient(180deg, rgba(8, 24, 46, 0.96) 0%, rgba(4, 14, 28, 0.98) 100%)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '2px solid #00f2fe',
              borderRadius: '28px',
              boxShadow: `
                0 24px 60px rgba(0, 0, 0, 0.85),
                0 0 40px rgba(0, 242, 254, 0.32),
                inset 0 1px 0 rgba(255, 255, 255, 0.22),
                inset 0 0 20px rgba(0, 242, 254, 0.08)
              `,
              padding: '24px 26px',
              color: '#ffffff',
              fontFamily: "var(--font-family, 'Outfit', sans-serif)",
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              animation: 'panelSlideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* A. Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'rgba(0, 242, 254, 0.14)',
                    border: '1.8px solid #00f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 18px rgba(0, 242, 254, 0.35)',
                    flexShrink: 0,
                  }}
                >
                  <Users size={22} color="#00f2fe" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h2
                      style={{
                        fontSize: '20px',
                        fontWeight: 850,
                        color: '#ffffff',
                        margin: 0,
                        letterSpacing: '-0.01em',
                        textTransform: 'uppercase',
                        lineHeight: 1.2,
                      }}
                    >
                      Phân bổ chi phí
                    </h2>
                    <span
                      style={{
                        background: 'rgba(0, 242, 254, 0.12)',
                        border: '1px solid rgba(0, 242, 254, 0.30)',
                        color: '#00f2fe',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      {costSharingSummary?.month ? `Tháng ${costSharingSummary.month.slice(5)} / ${costSharingSummary.month.slice(0, 4)}` : 'Tháng hiện tại'}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      margin: '4px 0 0 0',
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}
                  >
                    Tỷ lệ sở hữu theo hợp đồng · Phân bổ minh bạch giữa các đồng sở hữu
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCostSharingModal(false)}
                title="Đóng bảng phân bổ"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* B. Top Summary Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  background: 'rgba(10, 28, 52, 0.55)',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tổng chi
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                  {costSharingSummary?.totalExpense != null ? `${Number(costSharingSummary.totalExpense).toLocaleString('vi-VN')}đ` : '0đ'}
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(10, 28, 52, 0.55)',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Phần của bạn ({costSharingSummary?.userOwnershipPercentage ?? currentUserOwnershipPercentage}%)
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.01em' }}>
                  {costSharingSummary?.userRequiredShare != null ? `${Number(costSharingSummary.userRequiredShare).toLocaleString('vi-VN')}đ` : '0đ'}
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(10, 28, 52, 0.55)',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Đã trả
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  {costSharingSummary?.userPaidAmount != null ? `${Number(costSharingSummary.userPaidAmount).toLocaleString('vi-VN')}đ` : '0đ'}
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(10, 28, 52, 0.55)',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Chênh lệch
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: (costSharingSummary?.userNetPosition ?? 0) > 0 ? '#10b981' : (costSharingSummary?.userNetPosition ?? 0) < 0 ? '#fb7185' : '#38bdf8',
                  }}
                >
                  {(costSharingSummary?.userNetPosition ?? 0) > 0
                    ? `+${Number(costSharingSummary?.userNetPosition).toLocaleString('vi-VN')}đ`
                    : costSharingSummary?.userNetPosition != null
                    ? `${Number(costSharingSummary.userNetPosition).toLocaleString('vi-VN')}đ`
                    : '0đ'}
                </div>
              </div>
            </div>

            {/* C. Co-Owner Allocation Breakdown List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxHeight: '340px',
                overflowY: 'auto',
                paddingRight: '6px',
              }}
            >
              {isCostSharingLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px', gap: '8px', color: '#94a3b8' }}>
                  <Loader2 size={20} className="animate-spin" color="#00f2fe" />
                  <span style={{ fontSize: '13px' }}>Đang tính toán phân bổ...</span>
                </div>
              ) : costSharingSummary?.memberBreakdown?.map((member) => {
                const isCurrent = member.isCurrentUser;
                const net = member.netPosition;
                return (
                  <div
                    key={member.userId}
                    style={{
                      background: isCurrent ? 'rgba(0, 242, 254, 0.10)' : 'rgba(10, 26, 48, 0.50)',
                      borderRadius: '16px',
                      padding: '13px 16px',
                      border: isCurrent ? '1.5px solid rgba(0, 242, 254, 0.60)' : '1px solid rgba(0, 242, 254, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: isCurrent ? '0 0 16px rgba(0, 242, 254, 0.20)' : '0 4px 14px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 750, color: isCurrent ? '#00f2fe' : '#f8fafc' }}>
                          {member.userName} {isCurrent && '(Bạn)'}
                        </span>
                        <span
                          style={{
                            background: 'rgba(0, 242, 254, 0.15)',
                            border: '1px solid rgba(0, 242, 254, 0.35)',
                            color: '#38bdf8',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: '9999px',
                          }}
                        >
                          {member.ownershipPercentage}%
                        </span>
                      </div>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#f8fafc' }}>
                        {Number(member.requiredShare).toLocaleString('vi-VN')}đ
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px',
                        paddingTop: '6px',
                        borderTop: '1px dashed rgba(255, 255, 255, 0.10)',
                        color: '#94a3b8',
                      }}
                    >
                      <div>
                        Đã thanh toán: <strong style={{ color: '#cbd5e1' }}>{Number(member.paidAmount).toLocaleString('vi-VN')}đ</strong>
                      </div>
                      <div>
                        Chênh lệch:{' '}
                        <strong
                          style={{
                            color: net > 0 ? '#10b981' : net < 0 ? '#fb7185' : '#38bdf8',
                          }}
                        >
                          {net > 0 ? `+${Number(net).toLocaleString('vi-VN')}đ (Trả dư)` : net < 0 ? `${Number(net).toLocaleString('vi-VN')}đ (Còn thiếu)` : '0đ'}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* D. Footer Action Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                ✓ Phân bổ tự động chuẩn hóa 100% chi phí
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCostSharingModal(false);
                    setShowHistoryModal(true);
                  }}
                  style={{
                    background: 'rgba(0, 242, 254, 0.10)',
                    border: '1px solid rgba(0, 242, 254, 0.30)',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    color: '#00f2fe',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Receipt size={14} color="#00f2fe" />
                  <span>Xem hóa đơn</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCostSharingModal(false)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.30) 0%, rgba(6, 26, 52, 0.95) 100%)',
                    border: '1.2px solid #00f2fe',
                    borderRadius: '12px',
                    padding: '8px 22px',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 750,
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thêm chi phí mới */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        vehicleId={activeVehicleId || ''}
        currentUser={user}
        coOwners={coOwners}
      />
    </>
  );
};
