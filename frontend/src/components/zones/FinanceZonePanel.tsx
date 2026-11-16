import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Wallet,
  Calendar,
  Users,
  Clock,
  Zap,
  Wrench,
  AlertTriangle,
  Sparkles,
  Car,
  Receipt,
  ShieldCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  CheckCircle2,
  X,
  Info,
  MoreHorizontal,
  Loader2,
  ExternalLink,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { fetchVehicles } from '../../services/vehicleApi';
import { fetchVehicleCoOwnership } from '../../services/coOwnershipApi';
import { useExpenses, useExpenseSummary, useCostSharingSummary } from '../../hooks/useExpenses';
import {
  fetchMyPersonalPayments,
  submitPersonalPayment,
  fetchPersonalPayments,
  verifyPersonalPayment,
} from '../../services/fundApi';
import { ExpenseCategory, ExpenseResponse } from '../../types/expense';
import { ExpenseShareResponse } from '../../types/expenseShare';
import { useExpenseShares } from '../../hooks/useExpenses';
import { EVCarLoader } from '../common/EVCarLoader';
import { AddExpenseModal } from './AddExpenseModal';
import { ExpenseVerificationSection } from './ExpenseVerificationSection';
import { VehicleResponse } from '../../types/vehicle';
import {
  resolveVehicleCode,
  resolveVehicleDisplayName,
} from '../three/vehicles/vehicleModelConfig';

export interface FinanceZonePanelProps {
  vehicle?: VehicleResponse | null;
  onClose?: () => void;
  monthlyExpense?: string;
  fundStatus?: string;
}

function formatVND(amount?: number | null): string {
  if (amount == null || isNaN(amount)) return '0đ';
  return `${Math.round(Number(amount)).toLocaleString('vi-VN')}đ`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

const CATEGORY_CHIPS = [
  { id: 'ALL', label: 'Tất cả', icon: null },
  { id: 'CHARGING', label: 'Sạc xe', icon: Zap },
  { id: 'MAINTENANCE', label: 'Bảo dưỡng', icon: Wrench },
  { id: 'REPAIR', label: 'Sửa chữa', icon: Wrench },
  { id: 'CLEANING', label: 'Vệ sinh', icon: Sparkles },
  { id: 'PARKING', label: 'Đỗ xe', icon: Car },
  { id: 'TOLL', label: 'Cầu đường', icon: Receipt },
  { id: 'INSURANCE', label: 'Bảo hiểm', icon: ShieldCheck },
  { id: 'OTHER', label: 'Khác', icon: MoreHorizontal },
];

function getCategoryIcon(cat: ExpenseCategory) {
  switch (cat) {
    case 'CHARGING':
      return <Zap size={16} color="#00f2fe" />;
    case 'MAINTENANCE':
    case 'REPAIR':
      return <Wrench size={16} color="#00f2fe" />;
    case 'INSURANCE':
      return <ShieldCheck size={16} color="#00f2fe" />;
    case 'CLEANING':
      return <Sparkles size={16} color="#00f2fe" />;
    case 'PARKING':
      return <Car size={16} color="#00f2fe" />;
    case 'TOLL':
      return <Receipt size={16} color="#00f2fe" />;
    default:
      return <FileText size={16} color="#00f2fe" />;
  }
}

function getCategoryBg(cat: ExpenseCategory) {
  switch (cat) {
    case 'CHARGING':
      return 'rgba(0, 242, 254, 0.15)';
    case 'MAINTENANCE':
    case 'REPAIR':
      return 'rgba(0, 242, 254, 0.15)';
    case 'INSURANCE':
      return 'rgba(0, 242, 254, 0.15)';
    default:
      return 'rgba(0, 242, 254, 0.12)';
  }
}

export const FinanceZonePanel: React.FC<FinanceZonePanelProps> = ({
  vehicle: propVehicle,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN';

  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const closeGaragePanel = useWorldStore((state) => state.closeGaragePanel);
  const clearSelection = useWorldStore((state) => state.clearSelection);

  // Fallback vehicle query if prop not passed
  const { data: vehicles = [] } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
  });

  const activeVehicle = useMemo(() => {
    if (propVehicle) return propVehicle;
    if (selectedVehicleId) {
      const match = vehicles.find(
        (v) =>
          v.id === selectedVehicleId ||
          v.vin === selectedVehicleId ||
          v.name?.toUpperCase() === selectedVehicleId.toUpperCase()
      );
      if (match) return match;
    }
    return vehicles[0] || null;
  }, [propVehicle, selectedVehicleId, vehicles]);

  const activeVehicleId = activeVehicle?.id || null;
  const activeVehicleName = activeVehicle
    ? `${resolveVehicleDisplayName(activeVehicle)} (${resolveVehicleCode(activeVehicle)})`
    : 'Chưa chọn phương tiện';

  // Co-ownership query to resolve members (reusing unified 'coOwnership' query cache)
  const { data: coOwnership } = useQuery({
    queryKey: ['coOwnership', activeVehicleId],
    queryFn: () => (activeVehicleId ? fetchVehicleCoOwnership(activeVehicleId) : Promise.resolve(null)),
    enabled: !!activeVehicleId,
    staleTime: 10000,
  });

  const coOwners = useMemo(() => {
    return coOwnership?.members || [];
  }, [coOwnership]);

  // Expenses query
  const {
    data: expenses = [],
    isLoading: isExpensesLoading,
    isError: isExpensesError,
    error: expensesError,
    refetch: refetchExpenses,
  } = useExpenses(activeVehicleId);

  // Authoritative Cost Sharing Summary for current user & selected vehicle
  const {
    data: costSharingSummary,
    isLoading: isCostSharingLoading,
    isError: isCostSharingError,
  } = useCostSharingSummary(
    activeVehicleId,
    undefined,
    { enabled: !!activeVehicleId && !!user?.id }
  );

  // Group-wide expense summary
  const {
    data: expenseSummary,
    isLoading: isExpenseSummaryLoading,
    isError: isExpenseSummaryError,
  } = useExpenseSummary(
    activeVehicleId,
    undefined
  );

  // Personal Payments query (my submissions)
  const { data: myPayments = [], refetch: refetchMyPayments } = useQuery({
    queryKey: ['my-personal-payments', user?.id],
    queryFn: fetchMyPersonalPayments,
    enabled: !!user?.id,
  });

  // State: Month selection
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      const d = e.occurredAt || e.createdAt;
      if (d && d.length >= 7) {
        set.add(d.substring(0, 7));
      }
    });
    const now = new Date();
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    set.add(curMonth);
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  // Set default month if available
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // State: Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filter Bar Horizontal Scroll State & Ref
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkFilterScroll = () => {
    const el = filterScrollRef.current;
    if (!el) return;
    const hasLeft = el.scrollLeft > 2;
    const hasRight = el.scrollWidth - el.clientWidth - el.scrollLeft > 2;
    setCanScrollLeft(hasLeft);
    setCanScrollRight(hasRight);
  };

  const handleScrollFilters = (direction: 'left' | 'right') => {
    const el = filterScrollRef.current;
    if (!el) return;
    const scrollAmount = 160;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Sync scroll indicator on mount, resize, and category change
  useEffect(() => {
    checkFilterScroll();
    const el = filterScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkFilterScroll, { passive: true });
    window.addEventListener('resize', checkFilterScroll);
    const timer = setTimeout(checkFilterScroll, 120);
    return () => {
      el.removeEventListener('scroll', checkFilterScroll);
      window.removeEventListener('resize', checkFilterScroll);
      clearTimeout(timer);
    };
  }, []);

  // When selectedCategory changes, auto-scroll it into view
  useEffect(() => {
    const el = filterScrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`[data-category-id="${selectedCategory}"]`) as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
    const timer = setTimeout(checkFilterScroll, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  // Tab State: 3 Authoritative Navigation Tabs (Section 8)
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'UNPAID' | 'PAID'>('HISTORY');

  // State: Expandable cards
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  // State: Quick payment loading & feedback
  const [quickPayLoadingId, setQuickPayLoadingId] = useState<string | null>(null);
  const [quickPayFeedback, setQuickPayFeedback] = useState<{
    expenseId: string;
    text: string;
    isError: boolean;
  } | null>(null);

  // State: Modals & Popovers
  const [showReceiptModal, setShowReceiptModal] = useState<ExpenseResponse | null>(null);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [infoTooltipExpenseId, setInfoTooltipExpenseId] = useState<string | null>(null);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Category filter
      if (selectedCategory !== 'ALL' && e.category !== selectedCategory) {
        return false;
      }
      // Month filter (if month selected, match YYYY-MM)
      if (selectedMonth && selectedMonth !== 'ALL') {
        const d = e.occurredAt || e.createdAt;
        if (d && !d.startsWith(selectedMonth)) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, selectedCategory, selectedMonth]);

  // Unpaid obligations for current user (Section 8 & 9)
  const unpaidObligations = useMemo(() => {
    return expenses.filter((e) => {
      if (e.currentUserPaymentStatus === 'NOT_INVOLVED') return false;

      const allocated = e.currentUserAllocatedAmount != null ? Number(e.currentUserAllocatedAmount) : null;
      const paid = e.currentUserPaidAmount != null ? Number(e.currentUserPaidAmount) : 0;
      const remaining = e.currentUserRemainingAmount != null
        ? Number(e.currentUserRemainingAmount)
        : (allocated != null ? Math.max(0, allocated - paid) : 0);

      if (e.isFullySettled || e.currentUserPaymentStatus === 'PAID') return false;

      const hasVerified = myPayments.some(
        (p) => p.expenseId === e.id && p.status === 'PAYMENT_VERIFIED'
      );
      if (hasVerified && remaining <= 0) return false;

      if (remaining > 0 || (allocated != null && allocated > paid)) return true;
      if (e.currentUserPaymentStatus === 'PENDING_VERIFICATION' || e.currentUserPaymentStatus === 'PENDING_PAYMENT') return true;

      const hasPendingPayment = myPayments.some(
        (p) => p.expenseId === e.id && p.status === 'PAYMENT_SUBMITTED'
      );
      if (hasPendingPayment) return true;

      return false;
    });
  }, [expenses, myPayments]);

  const unpaidExpensesForView = useMemo(() => {
    if (isStaff) {
      return expenses.filter((e) => !e.isFullySettled && e.settlementStatus !== 'SETTLED');
    }
    return unpaidObligations;
  }, [isStaff, expenses, unpaidObligations]);

  // Verified personal payments list (Section 8 & 9)
  const verifiedPaymentsList = useMemo(() => {
    return myPayments.filter((p) => p.status === 'PAYMENT_VERIFIED');
  }, [myPayments]);

  const headerTitle = useMemo(() => {
    switch (activeTab) {
      case 'UNPAID':
        return 'CẦN THANH TOÁN';
      case 'PAID':
        return 'ĐÃ THANH TOÁN';
      case 'HISTORY':
      default:
        return 'LỊCH SỬ CHI PHÍ';
    }
  }, [activeTab]);

  const headerSubtitle = useMemo(() => {
    switch (activeTab) {
      case 'UNPAID':
        return `${activeVehicleName} • ${unpaidExpensesForView.length} khoản cần thanh toán`;
      case 'PAID':
        return `${activeVehicleName} • ${verifiedPaymentsList.length} giao dịch đã xác minh`;
      case 'HISTORY':
      default:
        return `${activeVehicleName} • ${filteredExpenses.length} khoản chi thực tế`;
    }
  }, [activeTab, activeVehicleName, unpaidExpensesForView.length, verifiedPaymentsList.length, filteredExpenses.length]);

  // KPI 1: TỔNG CHI (All recorded approved/pending expenses)
  const totalRecordedExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses]);

  // KPI 2: THÁNG NÀY (Expenses in currently selected month)
  const monthlyExpenseTotal = useMemo(() => {
    const targetMonth = selectedMonth && selectedMonth !== 'ALL' ? selectedMonth : '2026-11';
    return expenses
      .filter((e) => (e.occurredAt || e.createdAt || '').startsWith(targetMonth))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses, selectedMonth]);

  // KPI 3: ĐÃ THANH TOÁN (Authoritative verified personal / group payment)
  const myPaidAmount = costSharingSummary?.userPaidAmount ?? 0;
  const groupPaidAmount = expenseSummary?.paidAmount ?? 0;
  const paidTotal = isStaff ? groupPaidAmount : myPaidAmount;
  const paidLabel = isStaff ? 'Đã thanh toán nhóm' : 'Đã thanh toán của tôi';

  // KPI 4: CẦN THANH TOÁN (Isolated personal obligation vs. group liabilities)
  const myPendingObligationTotal = useMemo(() => {
    if (!activeVehicleId || !user?.id) return 0;

    // 1. Authoritative Cost Sharing Summary
    if (costSharingSummary) {
      if (costSharingSummary.userOutstandingAmount != null) {
        return Math.max(0, costSharingSummary.userOutstandingAmount);
      }
      if (costSharingSummary.userNetPosition != null) {
        if (costSharingSummary.userNetPosition < 0) {
          return Math.abs(costSharingSummary.userNetPosition);
        }
        return 0;
      }
    }

    return 0;
  }, [activeVehicleId, user?.id, costSharingSummary]);

  const myPendingVerificationTotal = useMemo(() => {
    if (!activeVehicleId || !user?.id || !costSharingSummary) return 0;
    return Math.max(0, costSharingSummary.userPendingVerificationAmount ?? 0);
  }, [activeVehicleId, user?.id, costSharingSummary]);

  const groupPendingLiabilitiesTotal = useMemo(() => {
    if (!activeVehicleId) return 0;
    if (expenseSummary?.pendingAmount != null && expenseSummary.pendingAmount > 0) {
      return expenseSummary.pendingAmount;
    }
    return expenses
      .filter((e) => e.status === 'PENDING_APPROVAL' || e.status === 'PENDING_VERIFICATION' || e.status === 'PENDING_VOTE')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [activeVehicleId, expenseSummary, expenses]);

  const pendingLiabilitiesTotal = isStaff
    ? groupPendingLiabilitiesTotal
    : myPendingObligationTotal > 0
    ? myPendingObligationTotal
    : myPendingVerificationTotal > 0
    ? myPendingVerificationTotal
    : 0;

  const pendingLiabilitiesLabel = isStaff
    ? 'Cần thu toàn nhóm'
    : myPendingVerificationTotal > 0 && myPendingObligationTotal <= myPendingVerificationTotal
    ? 'Chờ nhân viên xác minh'
    : myPendingObligationTotal > 0
    ? 'Cần thanh toán của tôi'
    : 'Cần thanh toán của tôi';

  const pendingLiabilitiesColor = isStaff
    ? (groupPendingLiabilitiesTotal > 0 ? '#fbbf24' : '#10b981')
    : myPendingVerificationTotal > 0 && myPendingObligationTotal <= myPendingVerificationTotal
    ? '#38bdf8'
    : myPendingObligationTotal > 0
    ? '#fbbf24'
    : '#10b981';

  const parseFinanceError = (err: any) => {
    if (!err) {
      return {
        title: 'Không thể tải dữ liệu chi phí',
        desc: 'Đã xảy ra lỗi không xác định khi tải dữ liệu chi phí phương tiện.',
        badge: 'Lỗi',
        status: 0,
      };
    }
    const status = err?.status ?? err?.response?.status;
    const msg = String(err?.message || '');

    if (status === 401 || msg.includes('401') || msg.toLowerCase().includes('phiên đăng nhập')) {
      return {
        title: 'Phiên đăng nhập đã hết hạn',
        desc: 'Vui lòng đăng nhập lại để tiếp tục xem dữ liệu tài chính của phương tiện.',
        badge: '401 Unauthorized',
        status: 401,
      };
    }
    if (
      status === 403 ||
      msg.includes('403') ||
      msg.toLowerCase().includes('quyền truy cập') ||
      msg.toLowerCase().includes('access denied')
    ) {
      return {
        title: 'Không có quyền truy cập phương tiện',
        desc: 'Tài khoản của bạn không có quyền truy cập dữ liệu chi phí của phương tiện này hoặc chưa thuộc nhóm đồng sở hữu.',
        badge: '403 Forbidden',
        status: 403,
      };
    }
    if (status === 404 || msg.includes('404') || msg.toLowerCase().includes('không tìm thấy')) {
      return {
        title: 'Không tìm thấy dữ liệu phương tiện',
        desc: 'Phương tiện hoặc hồ sơ chi phí không tồn tại trong hệ thống.',
        badge: '404 Not Found',
        status: 404,
      };
    }
    if ((status && status >= 500) || msg.includes('500') || msg.toLowerCase().includes('máy chủ gặp sự cố')) {
      return {
        title: 'Máy chủ đang gặp sự cố',
        desc: `Hệ thống gặp sự cố trong quá trình tổng hợp dữ liệu chi phí (HTTP ${status || 500}). Vui lòng thử lại sau ít phút.`,
        badge: `HTTP ${status || 500}`,
        status: status || 500,
      };
    }
    return {
      title: 'Lỗi kết nối máy chủ',
      desc: msg || 'Không thể kết nối đến máy chủ danh sách chi phí. Vui lòng kiểm tra lại kết nối mạng.',
      badge: 'Network Error',
      status: 0,
    };
  };

  // Drag-to-scroll handler
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const scrollTopRef = useRef(0);
  const dragDistanceRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('a') ||
      target.closest('[role="button"]')
    ) {
      return;
    }
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    startYRef.current = e.pageY - (scrollRef.current?.offsetTop || 0);
    scrollTopRef.current = scrollRef.current?.scrollTop || 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    const y = e.pageY - scrollRef.current.offsetTop;
    const walk = y - startYRef.current;
    dragDistanceRef.current = Math.abs(walk);
    scrollRef.current.scrollTop = scrollTopRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Close panel handler
  const handleClosePanel = () => {
    if (onClose) {
      onClose();
    } else {
      closeGaragePanel('FINANCE');
      clearSelection();
    }
  };

  // Execute Quick Demo Payment
  const handleQuickPay = async (targetExpense: ExpenseResponse, amountToPay: number) => {
    setQuickPayLoadingId(targetExpense.id);
    setQuickPayFeedback(null);
    try {
      const paymentRef = `DEMO-PAY-${targetExpense.id.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      await submitPersonalPayment(targetExpense.id, {
        amount: amountToPay,
        paymentMethod: 'DEMO_PAYMENT',
        paymentReference: paymentRef,
        note: `Thanh toán chi phí cá nhân: ${targetExpense.description || targetExpense.categoryLabel || 'Chi phí'}`,
      });

      setQuickPayFeedback({
        expenseId: targetExpense.id,
        text: 'Đã gửi yêu cầu thanh toán demo! CHỜ NHÂN VIÊN XÁC NHẬN.',
        isError: false,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-personal-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['personal-payments', targetExpense.id] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['expense-shares', targetExpense.id] }),
        queryClient.invalidateQueries({ queryKey: ['expense-shares'] }),
        queryClient.invalidateQueries({ queryKey: ['cost-sharing-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['expense-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      refetchMyPayments();
    } catch (err: any) {
      setQuickPayFeedback({
        expenseId: targetExpense.id,
        text: err?.response?.data?.message || err?.message || 'Lỗi khi gửi thanh toán. Vui lòng thử lại.',
        isError: true,
      });
    } finally {
      setQuickPayLoadingId(null);
    }
  };

  return (
    <div
      data-ui-interactive="true"
      data-testid="finance-zone-panel"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '76px',
        right: '20px',
        bottom: '20px',
        zIndex: 40,
        width: 'clamp(440px, 28vw, 495px)',
        maxWidth: 'min(495px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 96px)',
        background: 'rgba(7, 20, 38, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 242, 254, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(0, 242, 254, 0.16)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#ffffff',
        pointerEvents: 'auto',
      }}
    >
      {/* 1. HEADER (STABLE NON-SCROLLING) */}
      <div
        style={{
          padding: '16px 20px 14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Document / Receipt badge with cyan glow */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(0, 242, 254, 0.12)',
              border: '1.5px solid #00f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 242, 254, 0.35)',
              flexShrink: 0,
            }}
          >
            <Receipt size={20} color="#00f2fe" />
          </div>

          <div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 900,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                textTransform: 'uppercase',
              }}
            >
              {headerTitle}
            </h2>
            <div
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                marginTop: '2px',
                fontWeight: 500,
              }}
            >
              {headerSubtitle}
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          {/* Month Dropdown Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsMonthDropdownOpen((prev) => !prev)}
              style={{
                background: 'rgba(10, 30, 56, 0.85)',
                border: '1px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '10px',
                padding: '6px 12px',
                color: '#f8fafc',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Calendar size={13} color="#00f2fe" />
              <span>
                {selectedMonth === 'ALL'
                  ? 'Tất cả các tháng'
                  : `Tháng ${selectedMonth.slice(5)} / ${selectedMonth.slice(0, 4)}`}
              </span>
              <ChevronDown size={13} color="#94a3b8" />
            </button>

            {/* Month Dropdown Menu */}
            {isMonthDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  width: '180px',
                  background: 'rgba(8, 20, 38, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '12px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8)',
                  zIndex: 100,
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth('ALL');
                    setIsMonthDropdownOpen(false);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: selectedMonth === 'ALL' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                    color: selectedMonth === 'ALL' ? '#00f2fe' : '#cbd5e1',
                    fontSize: '11.5px',
                    fontWeight: 650,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Tất cả các tháng
                </button>
                {availableMonths.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(m);
                      setIsMonthDropdownOpen(false);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: selectedMonth === m ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                      color: selectedMonth === m ? '#00f2fe' : '#cbd5e1',
                      fontSize: '11.5px',
                      fontWeight: 650,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Tháng {m.slice(5)} / {m.slice(0, 4)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleClosePanel}
            title="Đóng bảng chi phí"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. 4 FINANCIAL KPI CARDS (STABLE NON-SCROLLING, RESPONSIVE 2x2 OR 4 COLS) */}
      <div
        style={{
          padding: '12px 20px 8px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Card 1: TỔNG CHI PHÍ XE */}
        <div
          style={{
            background: 'rgba(251, 113, 133, 0.05)',
            border: '1.2px solid rgba(251, 113, 133, 0.25)',
            borderRadius: '12px',
            padding: '10px 12px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wallet size={12} color="#fb7185" />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Tổng chi phí xe
            </span>
          </div>
          <div
            style={{
              fontSize: 'clamp(15px, 1.2vw, 17px)',
              fontWeight: 850,
              fontVariantNumeric: 'tabular-nums',
              color: '#fb7185',
              marginTop: '4px',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isExpensesLoading ? (
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Đang tải...</span>
            ) : isExpensesError ? (
              <span style={{ fontSize: '14px', color: '#64748b' }}>—</span>
            ) : (
              formatVND(totalRecordedExpenses)
            )}
          </div>
        </div>

        {/* Card 2: CHI PHÍ THÁNG NÀY */}
        <div
          style={{
            background: 'rgba(0, 242, 254, 0.05)',
            border: '1.2px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '12px',
            padding: '10px 12px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={12} color="#00f2fe" />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Chi phí tháng này
            </span>
          </div>
          <div
            style={{
              fontSize: 'clamp(15px, 1.2vw, 17px)',
              fontWeight: 850,
              fontVariantNumeric: 'tabular-nums',
              color: '#00f2fe',
              marginTop: '4px',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isExpensesLoading ? (
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Đang tải...</span>
            ) : isExpensesError ? (
              <span style={{ fontSize: '14px', color: '#64748b' }}>—</span>
            ) : (
              formatVND(monthlyExpenseTotal)
            )}
          </div>
        </div>

        {/* Card 3: ĐÃ THANH TOÁN CỦA TÔI / ĐÃ THANH TOÁN NHÓM */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1.2px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '10px 12px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={12} color="#10b981" />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              {paidLabel}
            </span>
          </div>
          <div
            style={{
              fontSize: 'clamp(15px, 1.2vw, 17px)',
              fontWeight: 850,
              fontVariantNumeric: 'tabular-nums',
              color: '#10b981',
              marginTop: '4px',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isCostSharingLoading || isExpenseSummaryLoading ? (
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Đang tải...</span>
            ) : isCostSharingError ? (
              <span style={{ fontSize: '14px', color: '#64748b' }}>—</span>
            ) : (
              formatVND(paidTotal)
            )}
          </div>
        </div>

        {/* Card 4: CẦN THANH TOÁN CỦA TÔI / CẦN THU TOÀN NHÓM */}
        <div
          style={{
            background: `${pendingLiabilitiesColor}0d`,
            border: `1.2px solid ${pendingLiabilitiesColor}40`,
            borderRadius: '12px',
            padding: '10px 12px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={12} color={pendingLiabilitiesColor} />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              {pendingLiabilitiesLabel}
            </span>
          </div>
          <div
            style={{
              fontSize: 'clamp(15px, 1.2vw, 17px)',
              fontWeight: 850,
              fontVariantNumeric: 'tabular-nums',
              color: pendingLiabilitiesColor,
              marginTop: '4px',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isCostSharingLoading || isExpenseSummaryLoading ? (
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Đang tải...</span>
            ) : isCostSharingError ? (
              <span style={{ fontSize: '14px', color: '#64748b' }}>—</span>
            ) : (
              formatVND(pendingLiabilitiesTotal)
            )}
          </div>
        </div>
      </div>

      {/* 2.5. THREE HORIZONTAL NAVIGATION TABS (SECTION 8) */}
      <div
        style={{
          padding: '6px 20px 8px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Tab 1: LỊCH SỬ CHI PHÍ */}
        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          style={{
            background: activeTab === 'HISTORY'
              ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.22) 0%, rgba(2, 132, 199, 0.25) 100%)'
              : 'rgba(255, 255, 255, 0.04)',
            border: activeTab === 'HISTORY'
              ? '1.5px solid #00f2fe'
              : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '8px 10px',
            color: activeTab === 'HISTORY' ? '#00f2fe' : '#94a3b8',
            fontSize: '11px',
            fontWeight: activeTab === 'HISTORY' ? 850 : 650,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'HISTORY' ? '0 0 12px rgba(0, 242, 254, 0.25)' : 'none',
          }}
        >
          <Receipt size={13} color={activeTab === 'HISTORY' ? '#00f2fe' : '#94a3b8'} />
          <span>LỊCH SỬ CHI PHÍ</span>
          {filteredExpenses.length > 0 && (
            <span
              style={{
                fontSize: '9.5px',
                padding: '1px 5px',
                borderRadius: '9999px',
                background: activeTab === 'HISTORY' ? '#00f2fe' : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'HISTORY' ? '#041628' : '#cbd5e1',
                fontWeight: 800,
              }}
            >
              {filteredExpenses.length}
            </span>
          )}
        </button>

        {/* Tab 2: CẦN THANH TOÁN */}
        <button
          type="button"
          onClick={() => setActiveTab('UNPAID')}
          style={{
            background: activeTab === 'UNPAID'
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.25) 100%)'
              : 'rgba(255, 255, 255, 0.04)',
            border: activeTab === 'UNPAID'
              ? '1.5px solid #fbbf24'
              : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '8px 10px',
            color: activeTab === 'UNPAID' ? '#fbbf24' : '#94a3b8',
            fontSize: '11px',
            fontWeight: activeTab === 'UNPAID' ? 850 : 650,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'UNPAID' ? '0 0 12px rgba(245, 158, 11, 0.25)' : 'none',
          }}
        >
          <Clock size={13} color={activeTab === 'UNPAID' ? '#fbbf24' : '#94a3b8'} />
          <span>CẦN THANH TOÁN</span>
          {unpaidExpensesForView.length > 0 && (
            <span
              style={{
                fontSize: '9.5px',
                padding: '1px 5px',
                borderRadius: '9999px',
                background: activeTab === 'UNPAID' ? '#fbbf24' : 'rgba(245, 158, 11, 0.25)',
                color: activeTab === 'UNPAID' ? '#041628' : '#fbbf24',
                fontWeight: 800,
              }}
            >
              {unpaidExpensesForView.length}
            </span>
          )}
        </button>

        {/* Tab 3: ĐÃ THANH TOÁN */}
        <button
          type="button"
          onClick={() => setActiveTab('PAID')}
          style={{
            background: activeTab === 'PAID'
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.25) 100%)'
              : 'rgba(255, 255, 255, 0.04)',
            border: activeTab === 'PAID'
              ? '1.5px solid #10b981'
              : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '8px 10px',
            color: activeTab === 'PAID' ? '#10b981' : '#94a3b8',
            fontSize: '11px',
            fontWeight: activeTab === 'PAID' ? 850 : 650,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'PAID' ? '0 0 12px rgba(16, 185, 129, 0.25)' : 'none',
          }}
        >
          <ShieldCheck size={13} color={activeTab === 'PAID' ? '#10b981' : '#94a3b8'} />
          <span>ĐÃ THANH TOÁN</span>
          {verifiedPaymentsList.length > 0 && (
            <span
              style={{
                fontSize: '9.5px',
                padding: '1px 5px',
                borderRadius: '9999px',
                background: activeTab === 'PAID' ? '#10b981' : 'rgba(16, 185, 129, 0.25)',
                color: activeTab === 'PAID' ? '#041628' : '#34d399',
                fontWeight: 800,
              }}
            >
              {verifiedPaymentsList.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. CATEGORY FILTER CHIPS (ONLY SHOWN FOR LỊCH SỬ CHI PHÍ) */}
      {activeTab === 'HISTORY' && (
        <div
          style={{
            position: 'relative',
            padding: '4px 20px 8px 20px',
            flexShrink: 0,
            maxWidth: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxSizing: 'border-box',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Left Arrow Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScrollFilters('left')}
              title="Cuộn bộ lọc sang trái"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(0, 242, 254, 0.12)',
                border: '1.2px solid rgba(0, 242, 254, 0.40)',
                color: '#00f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 0 10px rgba(0, 242, 254, 0.25)',
                transition: 'all 0.15s ease',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 242, 254, 0.25)';
                e.currentTarget.style.borderColor = '#00f2fe';
                e.currentTarget.style.boxShadow = '0 0 14px rgba(0, 242, 254, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 242, 254, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.40)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 242, 254, 0.25)';
              }}
            >
              <ChevronLeft size={14} />
            </button>
          )}

          {/* Scrollable Filters Viewport */}
          <div
            ref={filterScrollRef}
            onScroll={checkFilterScroll}
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexWrap: 'nowrap',
              gap: '6px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              paddingBottom: '2px',
              scrollPadding: '0 6px',
            }}
          >
            {CATEGORY_CHIPS.map((chip) => {
              const isActive = selectedCategory === chip.id;
              const IconComp = chip.icon;
              return (
                <button
                  key={chip.id}
                  data-category-id={chip.id}
                  type="button"
                  onClick={() => handleSelectCategory(chip.id)}
                  style={{
                    background: isActive ? '#00f2fe' : 'rgba(255, 255, 255, 0.05)',
                    border: isActive ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.10)',
                    color: isActive ? '#04111d' : '#94a3b8',
                    borderRadius: '9999px',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: isActive ? 800 : 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 10px rgba(0, 242, 254, 0.35)' : 'none',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(0, 242, 254, 0.10)';
                      e.currentTarget.style.color = '#e2e8f0';
                      e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.30)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.10)';
                    }
                  }}
                >
                  {IconComp && <IconComp size={11} color={isActive ? '#04111d' : '#94a3b8'} />}
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScrollFilters('right')}
              title="Cuộn bộ lọc sang phải"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(0, 242, 254, 0.12)',
                border: '1.2px solid rgba(0, 242, 254, 0.40)',
                color: '#00f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 0 10px rgba(0, 242, 254, 0.25)',
                transition: 'all 0.15s ease',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 242, 254, 0.25)';
                e.currentTarget.style.borderColor = '#00f2fe';
                e.currentTarget.style.boxShadow = '0 0 14px rgba(0, 242, 254, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 242, 254, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.40)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 242, 254, 0.25)';
              }}
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* 4. SCROLLABLE EXPENSE LIST (DRAG-TO-SCROLL & WHEEL) */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '0 20px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          cursor: isDraggingRef.current ? 'grabbing' : 'default',
          userSelect: isDraggingRef.current ? 'none' : 'auto',
        }}
      >
        {isExpensesLoading ? (
          <EVCarLoader variant="panel" message="Đang tải danh sách chi phí..." minHeight="240px" />
        ) : !activeVehicleId ? (
          <div
            style={{
              padding: '40px 20px',
              background: 'rgba(10, 30, 56, 0.4)',
              border: '1px dashed rgba(0, 242, 254, 0.25)',
              borderRadius: '16px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={24} color="#f59e0b" />
            <span style={{ color: '#cbd5e1', fontWeight: 650 }}>Chưa chọn phương tiện hoặc chưa tham gia nhóm</span>
            <span style={{ fontSize: '12px', color: '#64748b', maxWidth: '340px', lineHeight: 1.5 }}>
              Tài khoản hiện tại chưa tham gia nhóm đồng sở hữu hoặc chưa có phương tiện nào được chọn.
            </span>
          </div>
        ) : isExpensesError ? (
          <div
            style={{
              padding: '24px 20px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="#f87171" />
              <span style={{ color: '#f87171', fontWeight: 700, fontSize: '13.5px' }}>
                {parseFinanceError(expensesError).title}
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  fontWeight: 600,
                }}
              >
                {parseFinanceError(expensesError).badge}
              </span>
            </div>
            <span style={{ fontSize: '12.5px', color: '#cbd5e1', maxWidth: '380px', lineHeight: 1.5 }}>
              {parseFinanceError(expensesError).desc}
            </span>
            <button
              type="button"
              onClick={() => refetchExpenses()}
              style={{
                marginTop: '4px',
                padding: '6px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
              }}
            >
              <RefreshCw size={12} />
              Thử lại
            </button>
          </div>
        ) : activeTab === 'HISTORY' ? (
          filteredExpenses.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                background: 'rgba(10, 30, 56, 0.4)',
                border: '1px dashed rgba(0, 242, 254, 0.2)',
                borderRadius: '16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '13px',
              }}
            >
              Chưa có khoản chi nào trong danh mục này.
            </div>
          ) : (
            filteredExpenses.map((exp) => (
              <ExpenseItemRow
                key={exp.id}
                expense={exp}
                isExpanded={expandedExpenseId === exp.id}
                onToggleExpand={() => {
                  if (dragDistanceRef.current > 5) return;
                  setExpandedExpenseId((prev) => (prev === exp.id ? null : exp.id));
                }}
                currentUser={user}
                isStaff={isStaff}
                myPayments={myPayments}
                quickPayLoading={quickPayLoadingId === exp.id}
                quickPayFeedback={quickPayFeedback?.expenseId === exp.id ? quickPayFeedback : null}
                onQuickPay={(amount) => handleQuickPay(exp, amount)}
                onShowReceipt={() => setShowReceiptModal(exp)}
                isInfoTooltipOpen={infoTooltipExpenseId === exp.id}
                onToggleInfoTooltip={() =>
                  setInfoTooltipExpenseId((prev) => (prev === exp.id ? null : exp.id))
                }
              />
            ))
          )
        ) : activeTab === 'UNPAID' ? (
          unpaidExpensesForView.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                background: 'rgba(10, 30, 56, 0.4)',
                border: '1px dashed rgba(16, 185, 129, 0.3)',
                borderRadius: '16px',
                textAlign: 'center',
                color: '#34d399',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={28} color="#10b981" />
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc' }}>
                Không có nghĩa vụ chi phí cần thanh toán
              </span>
              <span style={{ color: '#94a3b8', fontSize: '12px', maxWidth: '340px' }}>
                Tất cả các khoản chi phí phân bổ cho bạn đối với phương tiện này đã được thanh toán và quyết toán đầy đủ.
              </span>
            </div>
          ) : (
            unpaidExpensesForView.map((exp) => (
              <UnpaidObligationCard
                key={exp.id}
                expense={exp}
                myPayments={myPayments}
                quickPayLoading={quickPayLoadingId === exp.id}
                quickPayFeedback={quickPayFeedback?.expenseId === exp.id ? quickPayFeedback : null}
                onQuickPay={(amount) => handleQuickPay(exp, amount)}
                onShowReceipt={() => setShowReceiptModal(exp)}
              />
            ))
          )
        ) : (
          /* activeTab === 'PAID' */
          verifiedPaymentsList.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                background: 'rgba(10, 30, 56, 0.4)',
                border: '1px dashed rgba(0, 242, 254, 0.2)',
                borderRadius: '16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Receipt size={28} color="#64748b" />
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#cbd5e1' }}>
                Chưa có khoản thanh toán nào đã được xác minh
              </span>
              <span style={{ color: '#94a3b8', fontSize: '12px', maxWidth: '340px' }}>
                Các giao dịch sau khi được nhân viên xác minh sẽ hiển thị đầy đủ thông tin mã giao dịch và ngày duyệt tại đây.
              </span>
            </div>
          ) : (
            verifiedPaymentsList.map((payment) => (
              <VerifiedPaymentCard key={payment.id} payment={payment} />
            ))
          )
        )}
      </div>

      {/* 5. COMPACT ADMINISTRATIVE FOOTER (STAFF / ADMIN ONLY) */}
      {isStaff && (
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(6, 16, 32, 0.85)',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>
            Quản trị viên / Nhân viên
          </div>
          <button
            type="button"
            onClick={() => setShowAddExpenseModal(true)}
            style={{
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid rgba(0, 242, 254, 0.40)',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#00f2fe',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={13} color="#00f2fe" />
            <span>Thêm khoản chi</span>
          </button>
        </div>
      )}

      {/* 6. MODAL: XEM CHỨNG TỪ (IF CLICKED) */}
      {showReceiptModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowReceiptModal(null)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(8, 20, 38, 0.98) 0%, rgba(4, 11, 24, 0.99) 100%)',
              border: '1.5px solid rgba(0, 242, 254, 0.4)',
              borderRadius: '20px',
              padding: '24px',
              width: '460px',
              maxWidth: '95vw',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} color="#00f2fe" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                  CHỨNG TỪ CHI PHÍ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
              <div><strong>Khoản chi:</strong> {showReceiptModal.description || showReceiptModal.categoryLabel}</div>
              <div><strong>Số tiền:</strong> <span style={{ color: '#00f2fe', fontWeight: 800 }}>{formatVND(showReceiptModal.amount)}</span></div>
              <div><strong>Thời gian:</strong> {formatDate(showReceiptModal.occurredAt || showReceiptModal.createdAt)}</div>
              {showReceiptModal.evidenceNote && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Ghi chú chứng từ:</strong>
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px 12px', borderRadius: '8px', marginTop: '4px' }}>
                    {showReceiptModal.evidenceNote}
                  </div>
                </div>
              )}
              {showReceiptModal.evidenceUrl && (
                <div style={{ marginTop: '10px' }}>
                  <a
                    href={showReceiptModal.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#38bdf8',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 700,
                    }}
                  >
                    Mở tệp đính kèm hóa đơn <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowReceiptModal(null)}
              style={{
                background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 16px',
                color: '#041628',
                fontWeight: 800,
                fontSize: '12.5px',
                cursor: 'pointer',
                marginTop: '6px',
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL: THÊM CHI PHÍ MỚI (IF APPLICABLE) */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        vehicleId={activeVehicleId}
        currentUser={user}
        coOwners={coOwners}
      />
    </div>
  );
};

// ========================================================
// SUB-COMPONENT: EXPENSE ITEM ROW (COLLAPSED + EXPANDED)
// ========================================================
interface ExpenseItemRowProps {
  expense: ExpenseResponse;
  isExpanded: boolean;
  onToggleExpand: () => void;
  currentUser: any;
  isStaff: boolean;
  myPayments: any[];
  quickPayLoading: boolean;
  quickPayFeedback: { expenseId: string; text: string; isError: boolean } | null;
  onQuickPay: (amount: number) => void;
  onShowReceipt: () => void;
  isInfoTooltipOpen: boolean;
  onToggleInfoTooltip: () => void;
}

const ExpenseItemRow: React.FC<ExpenseItemRowProps> = ({
  expense,
  isExpanded,
  onToggleExpand,
  currentUser,
  isStaff,
  myPayments,
  quickPayLoading,
  quickPayFeedback,
  onQuickPay,
  onShowReceipt,
  isInfoTooltipOpen,
  onToggleInfoTooltip,
}) => {
  const [showCalculationDetails, setShowCalculationDetails] = useState<boolean>(false);

  // Query shares when expanded
  const { data: rawShares = [], isLoading: isSharesLoading } = useExpenseShares(
    expense.id,
    { enabled: isExpanded }
  );

  const shares: ExpenseShareResponse[] = useMemo(() => {
    if (Array.isArray(rawShares)) return rawShares;
    if (rawShares && typeof rawShares === 'object') {
      if (Array.isArray((rawShares as any).shares)) return (rawShares as any).shares;
      if (Array.isArray((rawShares as any).data)) return (rawShares as any).data;
      if (Array.isArray((rawShares as any).content)) return (rawShares as any).content;
    }
    return [];
  }, [rawShares]);

  // Determine current user's share
  const myShare = useMemo(() => {
    if (!currentUser?.id) return null;
    return shares.find(
      (s) =>
        s.userId === currentUser.id ||
        (currentUser.fullName && s.userName && s.userName.includes(currentUser.fullName))
    );
  }, [shares, currentUser]);

  // Payment status for this expense
  const pendingPayment = useMemo(() => {
    return myPayments.find((p) => p.expenseId === expense.id && p.status === 'PAYMENT_SUBMITTED');
  }, [myPayments, expense.id]);

  const verifiedPayment = useMemo(() => {
    return myPayments.find((p) => p.expenseId === expense.id && p.status === 'PAYMENT_VERIFIED');
  }, [myPayments, expense.id]);

  const isSettled = useMemo(() => {
    if (verifiedPayment != null) return true;
    if (myShare) {
      const paid = Number(myShare.paidAmount || 0);
      const allocated = Number(myShare.shareAmount || 0);
      if (allocated > 0 && paid >= allocated) return true;
      if (myShare.status === 'SETTLED' && paid > 0) return true;
    }
    if (expense.currentUserPaymentStatus === 'PAID') return true;
    if (expense.currentUserAllocatedAmount != null && expense.currentUserPaidAmount != null) {
      const a = Number(expense.currentUserAllocatedAmount);
      const p = Number(expense.currentUserPaidAmount);
      if (a > 0 && p >= a) return true;
    }
    return false;
  }, [
    verifiedPayment,
    myShare,
    expense.currentUserPaymentStatus,
    expense.currentUserAllocatedAmount,
    expense.currentUserPaidAmount,
  ]);

  // Status badge resolution for row conforming strictly to authoritative backend business states
  const statusMeta = useMemo(() => {
    // 1. Pending co-owner approval or voting
    if (
      expense.status === 'PENDING_APPROVAL' ||
      expense.status === 'PENDING_VOTE' ||
      expense.status === 'PENDING_VERIFICATION'
    ) {
      return {
        label: isStaff ? 'CHỜ DUYỆT' : 'CHỜ BIỂU QUYẾT',
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.12)',
        border: '1px solid rgba(168, 85, 247, 0.35)',
      };
    }

    // 2. Rejected
    if (expense.status === 'REJECTED') {
      return {
        label: 'TỪ CHỐI',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
      };
    }

    // 3. STAFF VIEW: Group-level settlement status
    if (isStaff) {
      if (expense.isFullySettled === true || expense.settlementStatus === 'SETTLED') {
        return {
          label: 'ĐÃ QUYẾT TOÁN CHI PHÍ',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
        };
      }
      if (expense.settlementStatus === 'PARTIALLY_SETTLED') {
        return {
          label: 'QUYẾT TOÁN MỘT PHẦN',
          color: '#38bdf8',
          bg: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
        };
      }
      if (shares.length > 0 || expense.status === 'APPROVED' || expense.settlementStatus === 'ALLOCATED') {
        return {
          label: 'ĐÃ PHÂN BỔ',
          color: '#00f2fe',
          bg: 'rgba(0, 242, 254, 0.12)',
          border: '1px solid rgba(0, 242, 254, 0.35)',
        };
      }
      return {
        label: 'CHƯA PHÂN BỔ',
        color: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.12)',
        border: '1px solid rgba(148, 163, 184, 0.35)',
      };
    }

    // 4. CO-OWNER VIEW: Strictly authoritative personal payment status
    const allocated =
      myShare?.shareAmount != null
        ? Number(myShare.shareAmount)
        : expense.currentUserAllocatedAmount != null
        ? Number(expense.currentUserAllocatedAmount)
        : null;

    const verifiedPaid =
      verifiedPayment != null
        ? (allocated ?? expense.amount)
        : myShare?.paidAmount != null
        ? Number(myShare.paidAmount)
        : expense.currentUserPaidAmount != null
        ? Number(expense.currentUserPaidAmount)
        : 0;

    const pendingAmount =
      pendingPayment != null
        ? Number(pendingPayment.amount) || (allocated ?? expense.amount)
        : myShare?.pendingVerificationAmount != null
        ? Number(myShare.pendingVerificationAmount)
        : expense.currentUserPendingAmount != null
        ? Number(expense.currentUserPendingAmount)
        : 0;

    const personalStatus = expense.currentUserPaymentStatus || myShare?.status;

    if (allocated === 0 || personalStatus === 'NOT_INVOLVED') {
      return {
        label: 'KHÔNG PHÁT SINH CHI PHÍ',
        color: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.12)',
        border: '1px solid rgba(148, 163, 184, 0.35)',
      };
    }

    if (isSettled || personalStatus === 'PAID' || (allocated != null && allocated > 0 && verifiedPaid >= allocated)) {
      return {
        label: 'ĐÃ THANH TOÁN',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
      };
    }

    if (pendingPayment != null || pendingAmount > 0 || personalStatus === 'PENDING_VERIFICATION') {
      return {
        label: 'CHỜ XÁC MINH',
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
      };
    }

    if (verifiedPaid > 0 && allocated != null && verifiedPaid < allocated) {
      return {
        label: 'THANH TOÁN MỘT PHẦN',
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
      };
    }

    if (allocated != null && allocated > 0 && verifiedPaid === 0 && pendingAmount === 0) {
      return {
        label: 'CHƯA THANH TOÁN',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
      };
    }

    if (allocated == null) {
      return {
        label: 'ĐANG KIỂM TRA THANH TOÁN',
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
      };
    }

    return {
      label: 'CHƯA PHÂN BỔ',
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.12)',
      border: '1px solid rgba(148, 163, 184, 0.35)',
    };
  }, [
    expense.status,
    expense.statusLabel,
    expense.isFullySettled,
    expense.settlementStatus,
    expense.currentUserPaymentStatus,
    expense.currentUserAllocatedAmount,
    expense.currentUserPaidAmount,
    expense.currentUserPendingAmount,
    expense.amount,
    isSettled,
    pendingPayment,
    verifiedPayment,
    myShare,
    shares.length,
    isStaff,
  ]);

  // Formula description resolution
  const formulaInfo = useMemo(() => {
    const policy = expense.allocationPolicy || 'USAGE_AND_CAPITAL';
    const firstShare = shares[0];
    const totalKm = firstShare?.totalKmSnapshot ?? 0;

    if (policy === 'USAGE_AND_CAPITAL') {
      if (Number(totalKm) === 0) {
        return {
          title: '50% theo sở hữu nghịch đảo + 50% theo km sử dụng (0 km: 100% sở hữu nghịch đảo)',
          explanation:
            'Chưa phát sinh km sử dụng trong kỳ (0 km). Chi phí được phân bổ 100% theo tỷ lệ sở hữu nghịch đảo (1 - tỷ lệ sở hữu).',
        };
      }
      return {
        title: '50% theo sở hữu nghịch đảo + 50% theo km sử dụng',
        explanation:
          'Chi phí được phân bổ 50% theo tỷ lệ sở hữu nghịch đảo (1 - tỷ lệ sở hữu) và 50% theo số km sử dụng thực tế trong kỳ.',
      };
    }
    if (policy === 'OWNERSHIP_RATIO') {
      return {
        title: 'Theo tỷ lệ sở hữu',
        explanation: 'Chi phí được phân bổ trực tiếp theo tỷ lệ vốn sở hữu của từng thành viên.',
      };
    }
    return {
      title: 'Theo người sử dụng',
      explanation: 'Chi phí thuộc trách nhiệm trực tiếp của người sử dụng xe (100%).',
    };
  }, [expense.allocationPolicy, shares]);

  return (
    <div
      style={{
        background: 'rgba(11, 26, 48, 0.70)',
        border: isExpanded ? '1.5px solid rgba(0, 242, 254, 0.50)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        overflow: isExpanded ? 'visible' : 'hidden',
        height: 'auto',
        maxHeight: 'none',
        flexShrink: 0,
        transition: 'border 0.2s ease, background 0.2s ease',
      }}
    >
      {/* COLLAPSED ROW (CLICK TO TOGGLE) */}
      <div
        onClick={onToggleExpand}
        style={{
          padding: '12px 14px',
          minHeight: '66px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          gap: '10px',
        }}
      >
        {/* Left: Category Icon + Title + Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: getCategoryBg(expense.category),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {getCategoryIcon(expense.category)}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: '#ffffff',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.3,
              }}
            >
              {expense.description || expense.categoryLabel || 'Khoản chi vận hành'}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                marginTop: '2px',
              }}
            >
              {formatDate(expense.occurredAt || expense.createdAt)}
            </div>
          </div>
        </div>

        {/* Right: Amount + Status Badge + Chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span
            style={{
              fontSize: '15.5px',
              fontWeight: 850,
              fontVariantNumeric: 'tabular-nums',
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            {formatVND(expense.amount)}
          </span>

          <span
            style={{
              background: statusMeta.bg,
              border: statusMeta.border,
              color: statusMeta.color,
              fontSize: '10.5px',
              fontWeight: 800,
              padding: '2.5px 7px',
              borderRadius: '9999px',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            {statusMeta.label}
          </span>

          {isExpanded ? (
            <ChevronUp size={15} color="#00f2fe" />
          ) : (
            <ChevronDown size={15} color="#94a3b8" />
          )}
        </div>
      </div>

      {/* EXPANDED DETAILS */}
      {isExpanded && (
        <div
          style={{
            borderTop: '1px solid rgba(0, 242, 254, 0.20)',
            padding: '16px',
            background: 'rgba(6, 16, 32, 0.65)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            height: 'auto',
            maxHeight: 'none',
            overflow: 'visible',
            flexShrink: 0,
          }}
        >
          {/* Top Info Grid (Thumbnail + Amount + Policy with Info Icon) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 1fr',
              gap: '14px',
              alignItems: 'center',
              background: 'rgba(10, 26, 48, 0.6)',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              flexShrink: 0,
            }}
          >
            {/* Left: Car / EV preview thumbnail */}
            <div
              style={{
                width: '120px',
                height: '68px',
                borderRadius: '8px',
                border: '1px solid rgba(0, 242, 254, 0.35)',
                background: 'linear-gradient(135deg, rgba(0, 180, 255, 0.2) 0%, rgba(4, 15, 30, 0.9) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '90%',
                  height: '70%',
                  background: 'radial-gradient(ellipse at center, rgba(0, 242, 254, 0.4) 0%, transparent 70%)',
                  position: 'absolute',
                }}
              />
              <Car size={32} color="#00f2fe" style={{ opacity: 0.9, zIndex: 1 }} />
            </div>

            {/* Middle: Tổng chi phí thực tế & Quyết toán nhóm */}
            <div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>
                Tổng chi phí thực tế
              </div>
              <div style={{ fontSize: '19px', fontWeight: 850, color: '#ffffff', marginTop: '2px' }}>
                {formatVND(expense.amount)}
              </div>
              <div style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>Quyết toán nhóm:</span>
                <span
                  style={{
                    color: expense.isFullySettled || expense.settlementStatus === 'SETTLED' ? '#34d399' : '#38bdf8',
                    fontWeight: 700,
                  }}
                >
                  {expense.isFullySettled || expense.settlementStatus === 'SETTLED'
                    ? 'Đã quyết toán chi phí'
                    : expense.settlementStatusLabel || 'Đã phân bổ'}
                </span>
              </div>
            </div>

            {/* Right: Công thức phân bổ + Info Icon */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>
                  Công thức phân bổ
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInfoTooltip();
                  }}
                  title="Xem giải thích công thức"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#00f2fe',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Info size={13} color="#00f2fe" />
                </button>
              </div>

              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                {formulaInfo.title}
              </div>

              {/* Info Tooltip Popover */}
              {isInfoTooltipOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '6px',
                    width: '260px',
                    background: 'rgba(8, 20, 38, 0.98)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid #00f2fe',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#e2e8f0',
                    fontSize: '11px',
                    lineHeight: 1.45,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
                    zIndex: 50,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ fontWeight: 800, color: '#00f2fe', marginBottom: '4px' }}>
                    * Giải thích phân bổ (50% Sở hữu nghịch đảo + 50% Km):
                  </div>
                  <div>{formulaInfo.explanation}</div>
                </div>
              )}
            </div>
          </div>

          {/* Member Allocation Table: "PHÂN BỔ CHO CÁC ĐỒNG SỞ HỮU" */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#cbd5e1',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Phân bổ cho các đồng sở hữu
            </div>

            {isSharesLoading ? (
              <div
                style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#38bdf8',
                  fontSize: '12px',
                }}
              >
                <Loader2 size={14} className="animate-spin" color="#00f2fe" />
                <span>Đang tải danh sách phân bổ...</span>
              </div>
            ) : shares.length === 0 ? (
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#94a3b8',
                }}
              >
                Chưa có dữ liệu phân bổ cụ thể cho khoản chi này.
              </div>
            ) : (
              <div
                style={{
                  borderRadius: '12px',
                  overflow: 'visible',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(10, 26, 48, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '8px',
                  height: 'auto',
                  maxHeight: 'none',
                  flexShrink: 0,
                }}
              >
                {/* Responsive Stacked Member Allocation Cards (Section 5 & 6) */}
                {shares.map((share, idx) => {
                  const isCurrent = Boolean(
                    currentUser?.id &&
                      (share.userId === currentUser.id ||
                        (currentUser.fullName && share.userName?.includes(currentUser.fullName)))
                  );

                  const allocatedAmount = Number(share.shareAmount || 0);
                  const verifiedPaid = Number(share.paidAmount || 0);
                  const pendingAmount = Number(
                    share.pendingVerificationAmount ||
                      (isCurrent && pendingPayment ? pendingPayment.amount : 0)
                  );
                  const remainingAmount =
                    share.remainingAmount != null
                      ? Number(share.remainingAmount)
                      : Math.max(0, allocatedAmount - verifiedPaid);

                  const isZeroObligation = allocatedAmount === 0 && remainingAmount === 0;

                  const isMemberSettled =
                    !isZeroObligation &&
                    ((verifiedPaid >= allocatedAmount && allocatedAmount > 0) ||
                      (isCurrent && verifiedPayment != null) ||
                      (share.status === 'SETTLED' && verifiedPaid > 0));

                  const isMemberPending =
                    !isZeroObligation &&
                    !isMemberSettled &&
                    (pendingAmount > 0 || (isCurrent && pendingPayment != null) || share.status === 'PENDING');

                  const outstandingAmount = isMemberSettled || isZeroObligation ? 0 : remainingAmount;

                  return (
                    <div
                      key={share.id || share.userId || idx}
                      style={{
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: isCurrent
                          ? 'radial-gradient(120% 100% at 50% 0%, rgba(0, 242, 254, 0.12) 0%, rgba(10, 28, 52, 0.75) 100%)'
                          : 'rgba(8, 22, 42, 0.65)',
                        border: isCurrent
                          ? '1.5px solid rgba(0, 242, 254, 0.65)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isCurrent ? '0 4px 16px rgba(0, 242, 254, 0.15)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        flexShrink: 0,
                      }}
                    >
                      {/* Row 1: Member Name + [Bạn] on Left, Status Badge on Right */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span
                            style={{
                              fontWeight: isCurrent ? 850 : 700,
                              color: isCurrent ? '#00f2fe' : '#ffffff',
                              fontSize: '13px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {share.userName || 'Thành viên'}
                          </span>
                          {isCurrent && (
                            <span
                              style={{
                                background: '#00f2fe',
                                color: '#041628',
                                fontSize: '9.5px',
                                fontWeight: 800,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                flexShrink: 0,
                              }}
                            >
                              Bạn
                            </span>
                          )}
                        </div>

                        <div>
                          {isZeroObligation ? (
                            <span
                              style={{
                                background: 'rgba(148, 163, 184, 0.16)',
                                border: '1px solid rgba(148, 163, 184, 0.45)',
                                color: '#94a3b8',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <CheckCircle2 size={11} color="#94a3b8" />
                              Không phát sinh chi phí
                            </span>
                          ) : isMemberSettled ? (
                            <span
                              style={{
                                background: 'rgba(16, 185, 129, 0.16)',
                                border: '1px solid rgba(16, 185, 129, 0.45)',
                                color: '#34d399',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <CheckCircle2 size={11} color="#34d399" />
                              Đã thanh toán
                            </span>
                          ) : isMemberPending ? (
                            <span
                              style={{
                                background: 'rgba(56, 189, 248, 0.16)',
                                border: '1px solid rgba(56, 189, 248, 0.45)',
                                color: '#38bdf8',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Clock size={11} color="#38bdf8" />
                              Chờ xác minh
                            </span>
                          ) : verifiedPaid > 0 && verifiedPaid < allocatedAmount ? (
                            <span
                              style={{
                                background: 'rgba(56, 189, 248, 0.16)',
                                border: '1px solid rgba(56, 189, 248, 0.45)',
                                color: '#38bdf8',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Clock size={11} color="#38bdf8" />
                              Thanh toán một phần
                            </span>
                          ) : (
                            <span
                              style={{
                                background: 'rgba(245, 158, 11, 0.16)',
                                border: '1px solid rgba(245, 158, 11, 0.45)',
                                color: '#fbbf24',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Clock size={11} color="#fbbf24" />
                              Chưa thanh toán
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Ownership % and Kilometers */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          color: '#94a3b8',
                        }}
                      >
                        <span>
                          Tỷ lệ sở hữu:{' '}
                          <strong style={{ color: '#cbd5e1' }}>
                            {share.ownershipPercentage != null ? `${share.ownershipPercentage}%` : '--'}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Km sử dụng:{' '}
                          <strong style={{ color: '#cbd5e1' }}>
                            {share.memberKmSnapshot != null ? `${share.memberKmSnapshot} km` : '0 km'}
                          </strong>
                        </span>
                      </div>

                      {/* Row 3: 3-column micro-grid: Allocated | Paid | Outstanding */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '6px',
                          background: 'rgba(4, 14, 28, 0.55)',
                          borderRadius: '8px',
                          padding: '7px 10px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                            Số tiền phân bổ
                          </div>
                          <div
                            style={{
                              fontSize: '12.5px',
                              fontWeight: 850,
                              color: '#ffffff',
                              fontVariantNumeric: 'tabular-nums',
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatVND(allocatedAmount)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                            Đã thanh toán
                          </div>
                          <div
                            style={{
                              fontSize: '12.5px',
                              fontWeight: 850,
                              color: verifiedPaid > 0 ? '#34d399' : '#64748b',
                              fontVariantNumeric: 'tabular-nums',
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatVND(verifiedPaid)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                            Còn lại
                          </div>
                          <div
                            style={{
                              fontSize: '12.5px',
                              fontWeight: 850,
                              color: outstandingAmount > 0 ? '#fbbf24' : '#34d399',
                              fontVariantNumeric: 'tabular-nums',
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatVND(outstandingAmount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION: CHI TIẾT CÁCH TÍNH (13 THÔNG SỐ CÔNG THỨC CHÍNH THỨC) */}
          <div
            style={{
              background: 'rgba(8, 22, 42, 0.75)',
              borderRadius: '12px',
              border: showCalculationDetails
                ? '1.5px solid rgba(0, 242, 254, 0.50)'
                : '1px solid rgba(255, 255, 255, 0.10)',
              overflow: 'hidden',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            <button
              type="button"
              onClick={() => setShowCalculationDetails((prev) => !prev)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: showCalculationDetails
                  ? 'rgba(0, 242, 254, 0.12)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={14} color="#00f2fe" />
                <span style={{ color: '#00f2fe' }}>CHI TIẾT CÁCH TÍNH</span>
                <span
                  style={{
                    fontSize: '10px',
                    color: '#94a3b8',
                    fontWeight: 600,
                    textTransform: 'none',
                    letterSpacing: 'normal',
                  }}
                >
                  (13 thông số công thức sở hữu nghịch đảo & km)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: '#38bdf8' }}>
                  {showCalculationDetails ? 'Thu gọn' : 'Xem chi tiết'}
                </span>
                {showCalculationDetails ? (
                  <ChevronUp size={14} color="#00f2fe" />
                ) : (
                  <ChevronDown size={14} color="#94a3b8" />
                )}
              </div>
            </button>

            {showCalculationDetails && (
              <div
                style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderTop: '1px solid rgba(0, 242, 254, 0.20)',
                  background: 'rgba(4, 14, 28, 0.85)',
                }}
              >
                {(() => {
                  const totalExp = Number(expense.amount || 0);
                  const firstShare = shares[0];
                  const totalKm = Number(firstShare?.totalKmSnapshot ?? shares.reduce((acc, s) => acc + Number(s.memberKmSnapshot || 0), 0));
                  const isZeroKm = totalKm <= 0;
                  const alpha = isZeroKm ? 1.0 : 0.5;
                  const beta = isZeroKm ? 0.0 : 0.5;

                  const totalInvWeight = shares.reduce((acc, s) => {
                    const pct = Number(s.ownershipPercentage || 0) / 100;
                    return acc + Math.max(0, 1 - pct);
                  }, 0);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Formula Header Card */}
                      <div
                        style={{
                          background: 'rgba(0, 242, 254, 0.06)',
                          border: '1px solid rgba(0, 242, 254, 0.25)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          fontSize: '11px',
                          lineHeight: 1.6,
                          color: '#cbd5e1',
                        }}
                      >
                        <div style={{ fontWeight: 800, color: '#00f2fe', marginBottom: '4px' }}>
                          CÔNG THỨC PHÂN BỔ CHÍNH THỨC (HỆ THỐNG TOÀN DIỆN):
                        </div>
                        <div>
                          • Trọng số sở hữu nghịch đảo: <code style={{ color: '#38bdf8' }}>inverseOwnershipWeight_i = 1 - ownershipShare_i</code>
                        </div>
                        <div>
                          • Chi phí theo vốn ({isZeroKm ? 'alpha = 1.0 (0 km)' : 'alpha = 0.5'}):{' '}
                          <code style={{ color: '#38bdf8' }}>
                            ownershipCost_i = totalExpense * alpha * (inverseOwnershipWeight_i / totalInverseOwnershipWeight)
                          </code>
                        </div>
                        <div>
                          • Chi phí theo km ({isZeroKm ? 'beta = 0.0' : 'beta = 0.5'}):{' '}
                          <code style={{ color: '#38bdf8' }}>
                            usageCost_i = totalExpense * beta * (distanceKm_i / totalDistanceKm)
                          </code>
                        </div>
                        <div>
                          • Phân bổ thành viên trước làm tròn: <code style={{ color: '#38bdf8' }}>allocatedCost_i = ownershipCost_i + usageCost_i</code>
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                          * Làm tròn tiền tệ: Thuật toán số dư lớn nhất (Largest-Remainder) đảm bảo tổng chi phí các thành viên luôn khớp chính xác 100% số tiền hóa đơn ({formatVND(totalExp)}).
                        </div>
                      </div>

                      {/* Global 4-parameter overview */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          fontSize: '10.5px',
                        }}
                      >
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '9.5px', textTransform: 'uppercase' }}>1. Tổng chi phí (T)</div>
                          <div style={{ color: '#ffffff', fontWeight: 800, marginTop: '2px' }}>{formatVND(totalExp)}</div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '9.5px', textTransform: 'uppercase' }}>2. Tỷ trọng vốn (α)</div>
                          <div style={{ color: '#38bdf8', fontWeight: 800, marginTop: '2px' }}>{(alpha * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '9.5px', textTransform: 'uppercase' }}>3. Tỷ trọng km (β)</div>
                          <div style={{ color: '#38bdf8', fontWeight: 800, marginTop: '2px' }}>{(beta * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '9.5px', textTransform: 'uppercase' }}>6. Tổng trọng số nghịch đảo (W)</div>
                          <div style={{ color: '#00f2fe', fontWeight: 800, marginTop: '2px' }}>{totalInvWeight.toFixed(4)}</div>
                        </div>
                      </div>

                      {/* Detailed 13-parameter breakdown cards for each co-owner */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {shares.map((sh, idx) => {
                          const isCurrent = Boolean(
                            currentUser?.id &&
                              (sh.userId === currentUser.id ||
                                (currentUser.fullName && sh.userName?.includes(currentUser.fullName)))
                          );
                          const ownPct = Number(sh.ownershipPercentage || 0);
                          const decOwn = ownPct / 100;
                          const invWeight = Math.max(0, 1 - decOwn);
                          const ownRatio = totalInvWeight > 0 ? invWeight / totalInvWeight : 0;
                          const ownCost = sh.ownershipCost != null ? Number(sh.ownershipCost) : totalExp * alpha * ownRatio;
                          const memberKm = Number(sh.memberKmSnapshot || 0);
                          const kmRatio = totalKm > 0 ? memberKm / totalKm : 0;
                          const useCost = sh.usageCost != null ? Number(sh.usageCost) : (totalKm > 0 ? totalExp * beta * kmRatio : 0);
                          const unroundedTotal = ownCost + useCost;
                          const finalCost = Number(sh.shareAmount || 0);
                          const roundingDiff = finalCost - Math.floor(unroundedTotal);

                          return (
                            <div
                              key={sh.id || sh.userId || idx}
                              style={{
                                background: isCurrent ? 'rgba(0, 242, 254, 0.08)' : 'rgba(8, 20, 38, 0.65)',
                                border: isCurrent ? '1.5px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.07)',
                                borderRadius: '10px',
                                padding: '10px 12px',
                                fontSize: '11px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <strong style={{ color: isCurrent ? '#00f2fe' : '#ffffff', fontSize: '12px' }}>
                                    {sh.userName || `Thành viên ${idx + 1}`}
                                  </strong>
                                  {isCurrent && (
                                    <span style={{ background: '#00f2fe', color: '#041628', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
                                      BẠN
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 850, color: '#ffffff' }}>
                                  13. Phân bổ thực tế: <span style={{ color: '#00f2fe' }}>{formatVND(finalCost)}</span>
                                  {roundingDiff > 0 && <span style={{ fontSize: '9.5px', color: '#fbbf24', marginLeft: '4px' }}>(+{roundingDiff}đ làm tròn)</span>}
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '10.5px' }}>
                                {/* Ownership breakdown */}
                                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                                  <div style={{ color: '#94a3b8', fontSize: '9.5px', fontWeight: 700, marginBottom: '2px' }}>PHẦN VỐN NGHỊCH ĐẢO</div>
                                  <div>4. Tỷ lệ sở hữu: <strong style={{ color: '#e2e8f0' }}>{ownPct}%</strong></div>
                                  <div>5. Trọng số nghịch đảo (1 - s): <strong style={{ color: '#38bdf8' }}>{invWeight.toFixed(4)}</strong></div>
                                  <div>7. Tỷ lệ phần vốn (w / W): <strong style={{ color: '#38bdf8' }}>{(ownRatio * 100).toFixed(2)}%</strong></div>
                                  <div>8. Chi phí vốn: <strong style={{ color: '#00f2fe' }}>{formatVND(ownCost)}</strong></div>
                                </div>

                                {/* Distance breakdown */}
                                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                                  <div style={{ color: '#94a3b8', fontSize: '9.5px', fontWeight: 700, marginBottom: '2px' }}>PHẦN QUÃNG ĐƯỜNG (KM)</div>
                                  <div>9. Km cá nhân: <strong style={{ color: '#e2e8f0' }}>{memberKm} km</strong></div>
                                  <div>10. Tổng km nhóm: <strong style={{ color: '#e2e8f0' }}>{totalKm} km</strong></div>
                                  <div>11. Tỷ lệ km (d / D): <strong style={{ color: '#38bdf8' }}>{(kmRatio * 100).toFixed(2)}%</strong></div>
                                  <div>12. Chi phí km: <strong style={{ color: '#00f2fe' }}>{formatVND(useCost)}</strong></div>
                                </div>

                                {/* Sum & Result */}
                                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                                  <div style={{ color: '#94a3b8', fontSize: '9.5px', fontWeight: 700, marginBottom: '2px' }}>TỔNG HỢP VÀ LÀM TRÒN</div>
                                  <div>Chi phí vốn: <strong style={{ color: '#cbd5e1' }}>{formatVND(ownCost)}</strong></div>
                                  <div>+ Chi phí km: <strong style={{ color: '#cbd5e1' }}>{formatVND(useCost)}</strong></div>
                                  <div>= Chưa làm tròn: <strong style={{ color: '#94a3b8' }}>{unroundedTotal.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}đ</strong></div>
                                  <div style={{ marginTop: '2px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '2px' }}>
                                    Số tiền chính thức: <strong style={{ color: '#10b981' }}>{formatVND(finalCost)}</strong>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Action Buttons Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              paddingTop: '6px',
              flexShrink: 0,
            }}
          >
            {/* Pay Button for Current User if amount > 0 and not settled */}
            {(() => {
              const myAllocated =
                myShare?.shareAmount != null
                  ? Number(myShare.shareAmount)
                  : expense.currentUserAllocatedAmount != null
                  ? Number(expense.currentUserAllocatedAmount)
                  : (shares.length > 0 ? 0 : 0);

              const myPaid =
                myShare?.paidAmount != null
                  ? Number(myShare.paidAmount)
                  : verifiedPayment
                  ? myAllocated
                  : expense.currentUserPaidAmount != null
                  ? Number(expense.currentUserPaidAmount)
                  : 0;

              const myPending =
                myShare?.pendingVerificationAmount != null
                  ? Number(myShare.pendingVerificationAmount)
                  : pendingPayment
                  ? (Number(pendingPayment.amount) || myAllocated)
                  : expense.currentUserPendingAmount != null
                  ? Number(expense.currentUserPendingAmount)
                  : 0;

              const outstandingToPay = isSettled || myAllocated === 0
                ? 0
                : myShare?.remainingAmount != null
                ? Number(myShare.remainingAmount)
                : expense.currentUserRemainingAmount != null
                ? Number(expense.currentUserRemainingAmount)
                : Math.max(0, myAllocated - myPaid);

              if (myAllocated === 0 || expense.currentUserPaymentStatus === 'NOT_INVOLVED') {
                return (
                  <div
                    style={{
                      background: 'rgba(148, 163, 184, 0.12)',
                      border: '1px solid rgba(148, 163, 184, 0.35)',
                      color: '#94a3b8',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={14} color="#94a3b8" />
                    <span>KHÔNG PHÁT SINH CHI PHÍ</span>
                  </div>
                );
              }

              if (isSettled) {
                return (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1.2px solid #10b981',
                      color: '#34d399',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={14} color="#34d399" />
                    <span>ĐÃ THANH TOÁN</span>
                  </div>
                );
              }
              if (pendingPayment || myPending > 0) {
                return (
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1.2px solid #38bdf8',
                      color: '#38bdf8',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={14} color="#38bdf8" />
                    <span>CHỜ NHÂN VIÊN XÁC MINH</span>
                  </div>
                );
              }
              if (outstandingToPay > 0) {
                return (
                  <button
                    type="button"
                    disabled={quickPayLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickPay(outstandingToPay);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px 18px',
                      color: '#041628',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: quickPayLoading ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(0, 242, 254, 0.35)',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {quickPayLoading ? (
                      <EVCarLoader variant="button" message="Đang xử lý..." />
                    ) : (
                      <>
                        <CreditCard size={15} color="#041628" />
                        <span>{`Thanh toán ngay (${formatVND(outstandingToPay)})`}</span>
                      </>
                    )}
                  </button>
                );
              }
              return null;
            })()}

            {/* View Receipt Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShowReceipt();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '9px 16px',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
            >
              <FileText size={14} color="#ffffff" />
              <span>Xem chứng từ</span>
            </button>

            {/* Quick Pay Feedback Notice */}
            {quickPayFeedback && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 650,
                  color: quickPayFeedback.isError ? '#f87171' : '#34d399',
                  flexShrink: 0,
                }}
              >
                {quickPayFeedback.text}
              </span>
            )}
          </div>

          {/* STAFF Verification Section (Only for STAFF accounts) */}
          {isStaff && (
            <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ExpenseVerificationSection
                expenseId={expense.id}
                expenseStatus={expense.status}
                evidenceUrl={expense.evidenceUrl}
                evidenceNote={expense.evidenceNote}
              />
              <StaffPersonalPaymentsVerification expenseId={expense.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ========================================================
// SUB-COMPONENT: STAFF PERSONAL PAYMENT VERIFICATION
// ========================================================
const StaffPersonalPaymentsVerification: React.FC<{
  expenseId: string;
}> = ({ expenseId }) => {
  const queryClient = useQueryClient();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ['personal-payments', expenseId],
    queryFn: () => fetchPersonalPayments(expenseId),
  });

  const pendingPayments = useMemo(() => {
    return Array.isArray(payments)
      ? payments.filter((p) => p.status === 'PAYMENT_SUBMITTED')
      : [];
  }, [payments]);

  if (isLoading || pendingPayments.length === 0) return null;

  const handleVerify = async (paymentId: string, confirmed: boolean) => {
    setVerifyingId(paymentId);
    setVerifyError(null);
    try {
      await verifyPersonalPayment(paymentId, {
        confirmed,
        note: confirmed
          ? 'Nhân viên xác nhận đã nhận đủ tiền thanh toán cá nhân'
          : 'Nhân viên từ chối xác nhận thanh toán',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['personal-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['expense-shares'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['cost-sharing-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['expense-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['my-personal-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      refetch();
    } catch (err: any) {
      setVerifyError(err?.message || 'Lỗi khi xác minh thanh toán cá nhân.');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '10px',
        padding: '10px 14px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 800,
          color: '#38bdf8',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <ShieldCheck size={14} color="#38bdf8" />
        <span>XÁC MINH THANH TOÁN CÁ NHÂN CHỜ DUYỆT ({pendingPayments.length})</span>
      </div>

      {verifyError && (
        <div style={{ fontSize: '11px', color: '#f87171', marginBottom: '6px' }}>
          {verifyError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {pendingPayments.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(4, 14, 28, 0.65)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '12px', color: '#f8fafc' }}>
              <div>
                <strong>{p.payerName}</strong>:{' '}
                <span style={{ color: '#00f2fe', fontWeight: 800 }}>
                  {formatVND(p.amount)}
                </span>
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                Phương thức: {p.paymentMethod || 'DEMO_QUICK_PAY'}{' '}
                {p.note ? `• ${p.note}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                disabled={verifyingId === p.id}
                onClick={() => handleVerify(p.id, true)}
                style={{
                  background: '#10b981',
                  color: '#041628',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: verifyingId === p.id ? 'not-allowed' : 'pointer',
                }}
              >
                {verifyingId === p.id ? 'Đang duyệt...' : 'Xác nhận'}
              </button>
              <button
                type="button"
                disabled={verifyingId === p.id}
                onClick={() => handleVerify(p.id, false)}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: verifyingId === p.id ? 'not-allowed' : 'pointer',
                }}
              >
                Từ chối
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========================================================
// SUB-COMPONENT: UNPAID OBLIGATION CARD (SECTION 8 & 9)
// ========================================================
interface UnpaidObligationCardProps {
  expense: ExpenseResponse;
  myPayments: any[];
  quickPayLoading: boolean;
  quickPayFeedback: { expenseId: string; text: string; isError: boolean } | null;
  onQuickPay: (amount: number) => void;
  onShowReceipt: () => void;
}

const UnpaidObligationCard: React.FC<UnpaidObligationCardProps> = ({
  expense,
  myPayments,
  quickPayLoading,
  quickPayFeedback,
  onQuickPay,
  onShowReceipt,
}) => {
  const pendingPayment = useMemo(() => {
    return myPayments.find(
      (p) => p.expenseId === expense.id && p.status === 'PAYMENT_SUBMITTED'
    );
  }, [myPayments, expense.id]);

  const allocated =
    expense.currentUserAllocatedAmount != null
      ? Number(expense.currentUserAllocatedAmount)
      : Number(expense.amount || 0);
  const paid = expense.currentUserPaidAmount != null ? Number(expense.currentUserPaidAmount) : 0;
  const remaining =
    expense.currentUserRemainingAmount != null
      ? Number(expense.currentUserRemainingAmount)
      : Math.max(0, allocated - paid);

  const isPendingVerification =
    !!pendingPayment ||
    (expense.currentUserPendingAmount != null && expense.currentUserPendingAmount > 0) ||
    expense.currentUserPaymentStatus === 'PENDING_VERIFICATION';

  return (
    <div
      style={{
        background: 'rgba(11, 26, 48, 0.75)',
        border: isPendingVerification
          ? '1.2px solid rgba(56, 189, 248, 0.40)'
          : '1.2px solid rgba(245, 158, 11, 0.40)',
        borderRadius: '16px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: getCategoryBg(expense.category),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {getCategoryIcon(expense.category)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 750,
                color: '#ffffff',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {expense.description || expense.categoryLabel || 'Khoản chi phí'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {formatDate(expense.occurredAt || expense.createdAt)} • Tổng: {formatVND(expense.amount)}
            </div>
          </div>
        </div>

        <span
          style={{
            background: isPendingVerification ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: isPendingVerification
              ? '1px solid rgba(56, 189, 248, 0.45)'
              : '1px solid rgba(245, 158, 11, 0.45)',
            color: isPendingVerification ? '#38bdf8' : '#fbbf24',
            fontSize: '10.5px',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '9999px',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
          }}
        >
          {isPendingVerification ? <Clock size={11} color="#38bdf8" /> : <AlertTriangle size={11} color="#fbbf24" />}
          <span>{isPendingVerification ? 'CHỜ XÁC MINH' : 'CHƯA THANH TOÁN'}</span>
        </span>
      </div>

      {/* Allocation & Remaining Obligation Micro-Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          background: 'rgba(4, 14, 28, 0.55)',
          borderRadius: '10px',
          padding: '8px 12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            Phân bổ cho bạn
          </div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
            {formatVND(allocated)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            Cần thanh toán
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 850,
              color: isPendingVerification ? '#38bdf8' : '#fbbf24',
              marginTop: '2px',
            }}
          >
            {formatVND(remaining)}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        {isPendingVerification ? (
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={13} color="#38bdf8" />
            <span>Đã gửi thanh toán demo! CHỜ NHÂN VIÊN XÁC NHẬN.</span>
          </div>
        ) : remaining > 0 ? (
          <button
            type="button"
            disabled={quickPayLoading}
            onClick={() => onQuickPay(remaining)}
            style={{
              background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              color: '#041628',
              fontSize: '12.5px',
              fontWeight: 850,
              cursor: quickPayLoading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(0, 242, 254, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            {quickPayLoading ? (
              <EVCarLoader variant="button" message="Đang xử lý..." />
            ) : (
              <>
                <CreditCard size={14} color="#041628" />
                <span>Thanh toán mô phỏng (DEMO) — {formatVND(remaining)}</span>
              </>
            )}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onShowReceipt}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            padding: '7px 12px',
            color: '#cbd5e1',
            fontSize: '11.5px',
            fontWeight: 650,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <FileText size={13} />
          <span>Chứng từ</span>
        </button>
      </div>

      {/* Quick Pay Feedback */}
      {quickPayFeedback && (
        <div
          style={{
            fontSize: '11px',
            fontWeight: 650,
            color: quickPayFeedback.isError ? '#f87171' : '#34d399',
            marginTop: '-4px',
          }}
        >
          {quickPayFeedback.text}
        </div>
      )}
    </div>
  );
};

// ========================================================
// SUB-COMPONENT: VERIFIED PAYMENT CARD (SECTION 8 & 9)
// ========================================================
interface VerifiedPaymentCardProps {
  payment: any;
}

const VerifiedPaymentCard: React.FC<VerifiedPaymentCardProps> = ({ payment }) => {
  return (
    <div
      style={{
        background: 'rgba(11, 26, 48, 0.75)',
        border: '1.2px solid rgba(16, 185, 129, 0.35)',
        borderRadius: '16px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={18} color="#10b981" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 750,
                color: '#ffffff',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {payment.expenseDescription || 'Thanh toán chi phí cá nhân'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Mã GD: <strong style={{ color: '#cbd5e1' }}>{payment.paymentReference || (payment.id ? payment.id.slice(0, 8).toUpperCase() : 'GD-DEMO')}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 850, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>
            {formatVND(payment.amount)}
          </div>
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              color: '#34d399',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <CheckCircle2 size={10} color="#34d399" />
            <span>ĐÃ XÁC MINH</span>
          </span>
        </div>
      </div>

      {/* Details Row: Payment Date, Verification Date, Verifier */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          background: 'rgba(4, 14, 28, 0.55)',
          borderRadius: '10px',
          padding: '8px 10px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            Phương thức
          </div>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {payment.paymentMethod || 'DEMO_PAYMENT'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            Ngày thanh toán
          </div>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>
            {formatDate(payment.createdAt)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            Ngày xác minh
          </div>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
            {payment.verifiedAt ? formatDate(payment.verifiedAt) : 'Đã xác minh'}
          </div>
        </div>
      </div>

      {payment.verifiedByName && (
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          Người xác minh: <strong style={{ color: '#cbd5e1' }}>{payment.verifiedByName}</strong>
        </div>
      )}
    </div>
  );
};

export default FinanceZonePanel;
