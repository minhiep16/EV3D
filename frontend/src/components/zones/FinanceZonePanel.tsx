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
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { fetchVehicles } from '../../services/vehicleApi';
import { fetchVehicleCoOwnership } from '../../services/coOwnershipApi';
import { useExpenses, useExpenseSummary, useCostSharingSummary } from '../../hooks/useExpenses';
import { useFundSummary } from '../../hooks/useFund';
import {
  fetchMyPersonalPayments,
  submitPersonalPayment,
  fetchPersonalPayments,
} from '../../services/fundApi';
import { ExpenseCategory, ExpenseResponse } from '../../types/expense';
import { ExpenseShareResponse } from '../../types/expenseShare';
import { useExpenseShares } from '../../hooks/useExpenses';
import { AddExpenseModal } from './AddExpenseModal';
import { ExpenseVerificationSection } from './ExpenseVerificationSection';
import { VehicleResponse } from '../../types/vehicle';

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

  const activeVehicleId = activeVehicle?.id || '11111111-1111-1111-1111-111111111111';
  const activeVehicleName = activeVehicle?.name || 'EVShare Demo EV';

  // Co-ownership query to resolve members
  const { data: coOwnership } = useQuery({
    queryKey: ['co-ownership', activeVehicleId],
    queryFn: () => fetchVehicleCoOwnership(activeVehicleId),
    enabled: !!activeVehicleId,
  });

  const coOwners = useMemo(() => {
    return coOwnership?.members || [];
  }, [coOwnership]);

  // Expenses query
  const { data: expenses = [], isLoading: isExpensesLoading, isError: isExpensesError } = useExpenses(activeVehicleId);

  // Shared Fund query
  const { data: fundSummary } = useFundSummary(activeVehicleId);

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

  // KPI 3: QUỸ CHUNG
  const sharedFundBalance = fundSummary?.availableBalance ?? 7500000;

  // KPI 4: KHOẢN CHỜ THANH TOÁN (Authoritative pending liabilities)
  const pendingLiabilitiesTotal = useMemo(() => {
    // If expense has pending approval/vote status, or has unpaid member shares
    let total = 0;
    expenses.forEach((e) => {
      if (e.status === 'PENDING_APPROVAL' || e.status === 'PENDING_VERIFICATION' || e.status === 'PENDING_VOTE') {
        total += Number(e.amount || 0);
      } else {
        // Check if there is an unverified personal payment or unpaid share
        const hasPendingPay = myPayments.some((p) => p.expenseId === e.id && p.status === 'PAYMENT_SUBMITTED');
        const isSettled = myPayments.some((p) => p.expenseId === e.id && p.status === 'PAYMENT_VERIFIED');
        if (hasPendingPay || !isSettled) {
          total += Number(e.amount || 0);
        }
      }
    });
    return total > 0 ? total : 20000000;
  }, [expenses, myPayments]);

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
      style={{
        position: 'fixed',
        top: '76px',
        right: '24px',
        zIndex: 40,
        width: 'clamp(450px, 33vw, 620px)',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 96px)',
        height: 'calc(100vh - 96px)',
        background: 'linear-gradient(180deg, rgba(8, 26, 48, 0.94) 0%, rgba(4, 14, 28, 0.97) 100%)',
        backdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 242, 254, 0.48)',
        borderRadius: '24px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 242, 254, 0.22), inset 0 1.5px 1px rgba(255, 255, 255, 0.15), inset 0 0 24px rgba(0, 242, 254, 0.06)',
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
              LỊCH SỬ CHI PHÍ
            </h2>
            <div
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                marginTop: '2px',
                fontWeight: 500,
              }}
            >
              {activeVehicleName} • {filteredExpenses.length} khoản chi thực tế
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
        {/* Card 1: TỔNG CHI */}
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
              Tổng chi
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
            {formatVND(totalRecordedExpenses)}
          </div>
        </div>

        {/* Card 2: THÁNG NÀY */}
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
              Tháng này
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
            {formatVND(monthlyExpenseTotal)}
          </div>
        </div>

        {/* Card 3: QUỸ CHUNG */}
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1.2px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '10px 12px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={12} color="#38bdf8" />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Quỹ chung
            </span>
          </div>
          <div
            style={{
              fontSize: 'clamp(15px, 1.2vw, 17px)',
              fontWeight: 850,
              fontVariantNumeric: 'tabular-nums',
              color: '#38bdf8',
              marginTop: '4px',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {formatVND(sharedFundBalance)}
          </div>
        </div>

        {/* Card 4: KHOẢN CHỜ THANH TOÁN */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1.2px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '10px 12px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={12} color="#fbbf24" />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Chờ thanh toán
            </span>
          </div>
          <div
            style={{
              fontSize: 'clamp(15px, 1.2vw, 17px)',
              fontWeight: 850,
              fontVariantNumeric: 'tabular-nums',
              color: '#fbbf24',
              marginTop: '4px',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {formatVND(pendingLiabilitiesTotal)}
          </div>
        </div>
      </div>

      {/* 3. CATEGORY FILTER CHIPS (SINGLE-LINE HORIZONTAL SCROLL WITH ARROW CONTROLS) */}
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
          <div
            style={{
              padding: '40px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              color: '#38bdf8',
            }}
          >
            <Loader2 size={24} className="animate-spin" color="#00f2fe" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Đang tải danh sách chi phí...</span>
          </div>
        ) : isExpensesError ? (
          <div
            style={{
              padding: '30px 20px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '16px',
              textAlign: 'center',
              color: '#f87171',
              fontSize: '12.5px',
            }}
          >
            Không thể tải dữ liệu chi phí. Vui lòng kiểm tra kết nối máy chủ.
          </div>
        ) : filteredExpenses.length === 0 ? (
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

  const isSettled = verifiedPayment != null || expense.status === 'APPROVED' && myShare?.status === 'SETTLED';

  // Status badge resolution for collapsed row conforming strictly to business states
  const statusMeta = useMemo(() => {
    // 1. Check if all member shares in this expense are settled
    const allSharesSettled = shares.length > 0 && shares.every((s) => s.status === 'SETTLED');
    if (allSharesSettled) {
      return {
        label: 'ĐÃ QUYẾT TOÁN',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
      };
    }
    // 2. Check if current user's personal obligation is settled
    if (isSettled) {
      return {
        label: 'ĐÃ THANH TOÁN',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
      };
    }
    // 3. Check if current user submitted payment awaiting staff verification
    if (pendingPayment) {
      return {
        label: 'CHỜ XÁC MINH',
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
      };
    }
    // 4. Pending co-owner approval or voting
    if (expense.status === 'PENDING_APPROVAL' || expense.status === 'PENDING_VOTE') {
      return {
        label: 'CHỜ BIỂU QUYẾT',
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.12)',
        border: '1px solid rgba(168, 85, 247, 0.35)',
      };
    }
    // 5. Unpaid verified obligation for current member
    if (myShare && myShare.status === 'PENDING') {
      return {
        label: 'CHỜ THANH TOÁN',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
      };
    }
    // 6. Member shares exist and allocated to group
    if (shares.length > 0 || expense.status === 'APPROVED') {
      return {
        label: 'ĐÃ PHÂN BỔ',
        color: '#00f2fe',
        bg: 'rgba(0, 242, 254, 0.12)',
        border: '1px solid rgba(0, 242, 254, 0.35)',
      };
    }
    // 7. General unallocated expense
    return {
      label: 'CHƯA PHÂN BỔ',
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.12)',
      border: '1px solid rgba(148, 163, 184, 0.35)',
    };
  }, [isSettled, pendingPayment, expense.status, shares, myShare]);

  // Formula description resolution
  const formulaInfo = useMemo(() => {
    const policy = expense.allocationPolicy || 'USAGE_AND_CAPITAL';
    const firstShare = shares[0];
    const totalKm = firstShare?.totalKmSnapshot ?? 0;

    if (policy === 'USAGE_AND_CAPITAL') {
      if (Number(totalKm) === 0) {
        return {
          title: 'Tỷ lệ vốn nghịch chiều (Zero-km)',
          explanation:
            'Chưa phát sinh km sử dụng trong kỳ. Chi phí được phân bổ theo tỷ lệ vốn nghịch chiều theo quy định nhóm.',
        };
      }
      return {
        title: 'Theo km sử dụng và vốn',
        explanation:
          'Chi phí được phân bổ theo số km sử dụng và tỷ lệ vốn sở hữu của từng thành viên.',
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

            {/* Middle: Tổng chi phí thực tế */}
            <div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>
                Tổng chi phí thực tế
              </div>
              <div style={{ fontSize: '19px', fontWeight: 850, color: '#ffffff', marginTop: '2px' }}>
                {formatVND(expense.amount)}
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
                    * Giải thích phân bổ (Phase 19/24):
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

                  const isMemberSettled =
                    share.status === 'SETTLED' ||
                    (isCurrent && verifiedPayment != null) ||
                    (verifiedPaid >= allocatedAmount && allocatedAmount > 0);

                  const isMemberPending =
                    !isMemberSettled &&
                    ((isCurrent && pendingPayment != null) || (share.status === 'PENDING' && verifiedPaid > 0));

                  const outstandingAmount = isMemberSettled
                    ? 0
                    : Math.max(0, allocatedAmount - verifiedPaid);

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
                          {isMemberSettled ? (
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
                              Chờ thanh toán
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
              const myAllocated = Number(myShare?.shareAmount ?? (expense.status === 'APPROVED' ? expense.amount : 0));
              const myPaid = Number(myShare?.paidAmount ?? (isSettled ? myAllocated : 0));
              const outstandingToPay = isSettled ? 0 : Math.max(0, myAllocated - myPaid);

              if (isSettled || (myShare && myShare.status === 'SETTLED') || (outstandingToPay === 0 && myAllocated > 0)) {
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
                    <span>ĐÃ THANH TOÁN (DEMO)</span>
                  </div>
                );
              }
              if (pendingPayment) {
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
                      <Loader2 size={15} className="animate-spin" color="#041628" />
                    ) : (
                      <CreditCard size={15} color="#041628" />
                    )}
                    <span>
                      {quickPayLoading
                        ? 'Đang xử lý...'
                        : `Thanh toán ngay (${formatVND(outstandingToPay)})`}
                    </span>
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
            <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
              <ExpenseVerificationSection
                expenseId={expense.id}
                expenseStatus={expense.status}
                evidenceUrl={expense.evidenceUrl}
                evidenceNote={expense.evidenceNote}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default FinanceZonePanel;
