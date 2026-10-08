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
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { fetchVehicles } from '../../services/vehicleApi';
import { fetchVehicleCoOwnership } from '../../services/coOwnershipApi';
import { useExpenses, useExpenseSummary, useCostSharingSummary } from '../../hooks/useExpenses';
import { ExpenseCategory, EXPENSE_CATEGORY_METADATA, EXPENSE_STATUS_METADATA } from '../../types/expense';
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
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCostSharingModal, setShowCostSharingModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('ALL');
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

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

  const activeVehicleId = activeVehicle?.id || (vehicles[0]?.id ?? undefined);

  // Authoritative co-ownership group members for payer selection
  const { data: coOwnership } = useQuery({
    queryKey: ['co-ownership', activeVehicleId],
    queryFn: () => fetchVehicleCoOwnership(activeVehicleId!),
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
          width: '364px',
          background: 'linear-gradient(180deg, rgba(8, 24, 46, 0.90) 0%, rgba(4, 14, 28, 0.96) 100%)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '2px solid #00f2fe',
          borderRadius: '28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(0, 242, 254, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 0 20px rgba(0, 242, 254, 0.1)',
          padding: '26px',
          color: '#ffffff',
          fontFamily: "var(--font-family, 'Outfit', sans-serif)",
          zIndex: 30,
          pointerEvents: isFinanceDetailModalOpen ? 'none' : 'auto',
          opacity: isFinanceDetailModalOpen ? 0 : 1,
          visibility: isFinanceDetailModalOpen ? 'hidden' : 'visible',
          transition: 'opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: 'panelSlideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Header with Icon, Title, and Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'rgba(0, 242, 254, 0.14)',
                border: '1.8px solid #00f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 18px rgba(0, 242, 254, 0.35)',
                flexShrink: 0,
              }}
            >
              <Wallet size={24} color="#00f2fe" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Tài chính
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  margin: '3px 0 0 0',
                  fontWeight: 500,
                }}
              >
                Quản lý quỹ chung & chi phí
              </p>
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
              border: '1px solid rgba(255, 255, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
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

        {/* Item 1: Chi tháng này */}
        <div
          onClick={() => setShowHistoryModal(true)}
          style={{
            background: 'rgba(10, 30, 56, 0.75)',
            border: '1.2px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '20px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00f2fe';
            e.currentTarget.style.background = 'rgba(14, 38, 70, 0.88)';
            e.currentTarget.style.transform = 'translateX(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 242, 254, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.3)';
            e.currentTarget.style.background = 'rgba(10, 30, 56, 0.75)';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.25)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(0, 242, 254, 0.14)',
                border: '1.2px solid rgba(0, 242, 254, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BarChart3 size={18} color="#00f2fe" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                Chi tháng này
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                  marginTop: '1px',
                }}
              >
                {formattedMonthlyExpense}
              </div>
            </div>
          </div>
          <ChevronRight size={18} color="#38bdf8" />
        </div>

        {/* Item 2: Phần chi phí của bạn */}
        <div
          onClick={() => setShowCostSharingModal(true)}
          style={{
            background: 'rgba(10, 30, 56, 0.82)',
            border: '1.2px solid rgba(0, 242, 254, 0.4)',
            borderRadius: '20px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.28)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00f2fe';
            e.currentTarget.style.background = 'rgba(14, 40, 76, 0.92)';
            e.currentTarget.style.transform = 'translateX(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 242, 254, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
            e.currentTarget.style.background = 'rgba(10, 30, 56, 0.82)';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.28)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(0, 242, 254, 0.16)',
                  border: '1.2px solid rgba(0, 242, 254, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={18} color="#00f2fe" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Phần chi phí của bạn
                </div>
                <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700 }}>
                  Tỷ lệ: {costSharingSummary?.userOwnershipPercentage != null ? `${costSharingSummary.userOwnershipPercentage}%` : `${currentUserOwnershipPercentage}%`}
                </div>
              </div>
            </div>
            <ChevronRight size={17} color="#38bdf8" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '2px' }}>
            <div style={{ background: 'rgba(4, 16, 36, 0.60)', padding: '6px 10px', borderRadius: '10px', border: '1px solid rgba(0, 242, 254, 0.15)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Phải chịu</div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#f8fafc', marginTop: '1px' }}>
                {costSharingSummary?.userRequiredShare != null ? `${Number(costSharingSummary.userRequiredShare).toLocaleString('vi-VN')}đ` : '...'}
              </div>
            </div>
            <div style={{ background: 'rgba(4, 16, 36, 0.60)', padding: '6px 10px', borderRadius: '10px', border: '1px solid rgba(0, 242, 254, 0.15)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Chênh lệch</div>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 800,
                  marginTop: '1px',
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

        {/* Item 3: Trạng thái */}
        <div
          style={{
            background: 'rgba(10, 30, 56, 0.75)',
            border: '1.2px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '20px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.16)',
                border: '1.2px solid rgba(16, 185, 129, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={18} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                Trạng thái
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#10b981',
                  marginTop: '2px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 10px #10b981',
                  }}
                />
                <span>{fundStatus}</span>
              </div>
            </div>
          </div>
          <ChevronRight size={18} color="#38bdf8" />
        </div>

        {/* Primary Action Button: Mở bảng quỹ */}
        <button
          type="button"
          onClick={() => setShowLedgerModal(true)}
          style={{
            background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
            border: 'none',
            borderRadius: '18px',
            padding: '16px 22px',
            color: '#041628',
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '0.01em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(0, 242, 254, 0.45)',
            transition: 'all 0.2s ease',
            marginTop: '2px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 242, 254, 0.65)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 242, 254, 0.45)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ExternalLink size={18} color="#041628" />
            <span>Mở bảng quỹ</span>
          </div>
          <ChevronRight size={18} color="#041628" />
        </button>

        {/* Secondary Action Button: Phân bổ chi phí */}
        <button
          type="button"
          onClick={() => setShowCostSharingModal(true)}
          style={{
            background: 'rgba(10, 30, 56, 0.82)',
            border: '1.2px solid rgba(0, 242, 254, 0.40)',
            borderRadius: '18px',
            padding: '14px 22px',
            color: '#00f2fe',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00f2fe';
            e.currentTarget.style.background = 'rgba(14, 38, 70, 0.92)';
            e.currentTarget.style.transform = 'translateX(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 242, 254, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.40)';
            e.currentTarget.style.background = 'rgba(10, 30, 56, 0.82)';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18} color="#00f2fe" />
            <span>Phân bổ chi phí</span>
          </div>
          <ChevronRight size={18} color="#00f2fe" />
        </button>

        {/* Tertiary Action Button: Lịch sử chi phí */}
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          style={{
            background: 'rgba(10, 30, 56, 0.75)',
            border: '1.2px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '18px',
            padding: '14px 22px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00f2fe';
            e.currentTarget.style.background = 'rgba(14, 38, 70, 0.88)';
            e.currentTarget.style.transform = 'translateX(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 242, 254, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.3)';
            e.currentTarget.style.background = 'rgba(10, 30, 56, 0.75)';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} color="#00f2fe" />
            <span>Lịch sử chi phí</span>
          </div>
          <ChevronRight size={18} color="#00f2fe" />
        </button>
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
                  <h3 style={{ fontSize: '18px', fontWeight: 850, margin: 0, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
                    Bảng chi tiết quỹ chung
                  </h3>
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
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Tổng quỹ hiện tại
                </div>
                <div style={{ fontSize: '22px', fontWeight: 850, color: '#00f2fe', marginTop: '2px', letterSpacing: '-0.01em' }}>
                  25.000.000đ
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Phần của bạn ({currentUserOwnershipPercentage}%)
                </div>
                <div style={{ fontSize: '16px', fontWeight: 750, color: '#ffffff', marginTop: '2px' }}>
                  {((25000000 * currentUserOwnershipPercentage) / 100).toLocaleString('vi-VN')}đ
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
                  <Receipt size={22} color="#00f2fe" />
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
                      Lịch sử chi phí
                    </h2>
                    {/* Month Chip */}
                    <span
                      style={{
                        background: 'rgba(0, 242, 254, 0.12)',
                        border: '1px solid rgba(0, 242, 254, 0.30)',
                        color: '#00f2fe',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
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
                        color: '#94a3b8',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      {expenses.length} khoản chi
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
                    Theo dõi các khoản chi phí thực tế phát sinh của xe đồng sở hữu
                  </p>
                </div>
              </div>

              {/* Action Buttons: Thêm chi phí & Đóng */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '7px 14px',
                    color: '#041628',
                    fontSize: '12px',
                    fontWeight: 750,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(0, 242, 254, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 242, 254, 0.55)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 242, 254, 0.35)';
                  }}
                >
                  <Plus size={15} color="#041628" />
                  <span>Thêm chi phí</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  title="Đóng chi tiết lịch sử"
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
            </div>

            {/* B. Top Summary Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              {/* Tổng chi */}
              <div
                style={{
                  background: 'rgba(10, 28, 52, 0.55)',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  border: '1px solid rgba(251, 113, 133, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tổng chi
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#fb7185', letterSpacing: '-0.01em' }}>
                  {expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toLocaleString('vi-VN')}đ
                </div>
              </div>

              {/* Chi tháng này */}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Chi tháng này
                  </div>
                  {summary?.pendingCount != null && summary.pendingCount > 0 && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        background: 'rgba(245, 158, 11, 0.16)',
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        color: '#f59e0b',
                        padding: '1px 5px',
                        borderRadius: '9999px',
                      }}
                    >
                      ⏳ {summary.pendingCount} chờ duyệt
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#00f2fe', letterSpacing: '-0.01em' }}>
                  {formattedMonthlyExpense}
                </div>
              </div>

              {/* Số giao dịch */}
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
                  Khoản chi
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  {expenses.length}
                </div>
              </div>

              {/* Phương tiện */}
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
                  Phương tiện
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeVehicle?.name || 'EV01'}
                </div>
              </div>
            </div>

            {/* D. Segmented Filter Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '14px',
                background: 'rgba(6, 18, 34, 0.65)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 242, 254, 0.12)',
                width: 'fit-content',
                flexWrap: 'wrap',
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
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '11.5px',
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

            {/* C. Transaction Ledger List */}
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
              {isExpensesLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px', gap: '8px', color: '#94a3b8' }}>
                  <Loader2 size={20} className="animate-spin" color="#00f2fe" />
                  <span style={{ fontSize: '13px' }}>Đang tải lịch sử chi phí...</span>
                </div>
              ) : expenses.filter((e) => historyCategoryFilter === 'ALL' || e.category === historyCategoryFilter).length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px 16px',
                    background: 'rgba(10, 26, 48, 0.40)',
                    borderRadius: '16px',
                    border: '1px dashed rgba(0, 242, 254, 0.20)',
                  }}
                >
                  <FileText size={32} color="#64748b" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                    Chưa có chi phí nào được ghi nhận.
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 16px' }}>
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
                      dateDisplay = isToday ? `Hôm nay, ${hours}:${minutes}` : `${day}/${month}/${year}`;
                    } catch {
                      dateDisplay = exp.occurredAt;
                    }

                    const isExpanded = expandedExpenseId === exp.id;
                    return (
                      <div
                        key={exp.id}
                        style={{
                          background: isExpanded ? 'rgba(14, 38, 70, 0.85)' : 'rgba(10, 26, 48, 0.50)',
                          borderRadius: '16px',
                          padding: '13px 16px',
                          border: `1px solid ${isExpanded ? '#00f2fe' : 'rgba(0, 242, 254, 0.12)'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.2s ease',
                          boxShadow: isExpanded ? '0 0 16px rgba(0, 242, 254, 0.25)' : '0 4px 14px rgba(0, 0, 0, 0.25)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setExpandedExpenseId((current) => (current === exp.id ? null : exp.id));
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: meta.chipBg,
                                border: `1.2px solid ${meta.chipBorder}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: `0 0 12px ${meta.chipBorder}`,
                              }}
                            >
                              <CategoryIcon size={17} color={meta.accentColor} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
                                  {exp.description}
                                </span>
                                <span
                                  style={{
                                    background: meta.chipBg,
                                    border: `1px solid ${meta.chipBorder}`,
                                    color: meta.accentColor,
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '1px 7px',
                                    borderRadius: '9999px',
                                    letterSpacing: '0.02em',
                                  }}
                                >
                                  {exp.categoryLabel || meta.label}
                                </span>
                                {(() => {
                                  const statusMeta = EXPENSE_STATUS_METADATA[exp.status || 'APPROVED'] || EXPENSE_STATUS_METADATA.APPROVED;
                                  return (
                                    <span
                                      style={{
                                        background: statusMeta.bg,
                                        border: `1px solid ${statusMeta.border}`,
                                        color: statusMeta.color,
                                        fontSize: '9.5px',
                                        fontWeight: 750,
                                        padding: '1px 6px',
                                        borderRadius: '9999px',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {statusMeta.label}
                                    </span>
                                  );
                                })()}
                              </div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', fontWeight: 500 }}>
                                {dateDisplay} · Người trả: {exp.paidByUserName || 'Thành viên nhóm'}{exp.createdByUserName && exp.createdByUserName !== exp.paidByUserName ? ` (Khai bởi: ${exp.createdByUserName})` : ''}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontSize: '15px',
                                fontWeight: 800,
                                color: '#fb7185',
                                letterSpacing: '-0.01em',
                              }}
                            >
                              -{Number(exp.amount).toLocaleString('vi-VN')}đ
                            </div>
                            <button
                              type="button"
                              data-testid={`expense-share-btn-${exp.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedExpenseId((current) => (current === exp.id ? null : exp.id));
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10.5px',
                                fontWeight: 650,
                                color: '#00f2fe',
                                marginTop: '3px',
                                background: isExpanded ? 'rgba(0, 242, 254, 0.22)' : 'rgba(0, 242, 254, 0.10)',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                border: `1px solid ${isExpanded ? '#00f2fe' : 'rgba(0, 242, 254, 0.28)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <span>{isExpanded ? 'Thu gọn' : exp.status === 'PENDING_VERIFICATION' ? 'Xác minh' : 'Phân bổ'}</span>
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Expense Allocation Detail */}
                        {isExpanded && (
                          <div
                            data-testid={`expanded-expense-${exp.id}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              marginTop: '10px',
                              paddingTop: '8px',
                              borderTop: '1px solid rgba(0, 242, 254, 0.15)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <ExpenseItemShares
                              expenseId={exp.id}
                              expenseAmount={Number(exp.amount)}
                              expenseStatus={exp.status}
                              allocationPolicy={exp.allocationPolicy}
                              responsibleUserId={exp.responsibleUserId}
                              category={exp.category}
                              expense={exp}
                              description={exp.description}
                              evidenceNote={exp.evidenceNote}
                              sourceType={exp.sourceType}
                              relatedTripId={exp.relatedTripId}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

            {/* E. Footer Action Bar */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryModal(false);
                    setShowCostSharingModal(true);
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
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Users size={14} color="#00f2fe" />
                  <span>Phân bổ chi phí</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryModal(false);
                    setShowLedgerModal(true);
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
                    transition: 'all 0.2s ease',
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
                  <span>Xem đầy đủ sổ quỹ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
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
                  Đóng
                </button>
              </div>
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
