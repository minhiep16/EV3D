import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useWorldStore } from '../../store/worldStore';

interface FinanceZonePanelProps {
  onClose?: () => void;
  monthlyExpense?: string;
  fundStatus?: string;
}

export const FinanceZonePanel: React.FC<FinanceZonePanelProps> = ({
  onClose,
  monthlyExpense = '3.450.000đ',
  fundStatus = 'Sẵn sàng hoạt động',
}) => {
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const selectZone = useWorldStore((state) => state.selectZone);
  const setFinanceDetailModalOpen = useWorldStore((state) => state.setFinanceDetailModalOpen);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');

  const isFinanceDetailModalOpen = showLedgerModal || showHistoryModal;

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
        if (showHistoryModal) setShowHistoryModal(false);
        if (showLedgerModal) setShowLedgerModal(false);
      }
    };
    if (isFinanceDetailModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFinanceDetailModalOpen, showHistoryModal, showLedgerModal]);

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
                {monthlyExpense}
              </div>
            </div>
          </div>
          <ChevronRight size={18} color="#38bdf8" />
        </div>

        {/* Item 2: Trạng thái */}
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

        {/* Secondary Action Button: Lịch sử chi phí */}
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          style={{
            background: 'rgba(10, 30, 56, 0.75)',
            border: '1.2px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '18px',
            padding: '15px 22px',
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
                  Phần của bạn (40%)
                </div>
                <div style={{ fontSize: '16px', fontWeight: 750, color: '#ffffff', marginTop: '2px' }}>
                  10.000.000đ
                </div>
              </div>
            </div>

            {/* Danh sách phân bổ chi phí */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '280px', paddingRight: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#a5f3fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Khoản chi định kỳ
              </div>
              {[
                { label: 'Sạc điện công cộng', cost: '1.250.000đ', share: '500.000đ', icon: Zap },
                { label: 'Bảo dưỡng định kỳ', cost: '1.800.000đ', share: '720.000đ', icon: CheckCircle2 },
                { label: 'Vệ sinh & bãi đỗ', cost: '400.000đ', share: '160.000đ', icon: Calendar },
              ].map((item, idx) => (
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
                    <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Bạn: {item.share}</div>
                  </div>
                </div>
              ))}
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
                      Tháng 9 / 2026
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
                      4 giao dịch
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
                    Theo dõi các khoản thu / chi trong quỹ đồng sở hữu
                  </p>
                </div>
              </div>

              {/* Close Button in top-right */}
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
                  3.450.000đ
                </div>
              </div>

              {/* Tổng thu */}
              <div
                style={{
                  background: 'rgba(10, 28, 52, 0.55)',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tổng thu
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#34d399', letterSpacing: '-0.01em' }}>
                  +5.000.000đ
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
                  Giao dịch
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  4
                </div>
              </div>

              {/* Số dư ảnh hưởng */}
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
                  Số dư ròng
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#00f2fe', letterSpacing: '-0.01em' }}>
                  +1.550.000đ
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
              }}
            >
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'EXPENSE', label: 'Chi phí' },
                { id: 'INCOME', label: 'Nạp quỹ' },
              ].map((tab) => {
                const isTabActive = historyFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHistoryFilter(tab.id as 'ALL' | 'EXPENSE' | 'INCOME')}
                    style={{
                      background: isTabActive
                        ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.35) 0%, rgba(6, 26, 52, 0.90) 100%)'
                        : 'transparent',
                      border: isTabActive ? '1.2px solid #00f2fe' : '1px solid transparent',
                      borderRadius: '8px',
                      padding: '5px 14px',
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
                gap: '12px',
                maxHeight: '340px',
                overflowY: 'auto',
                paddingRight: '6px',
              }}
            >
              {[
                {
                  group: 'HÔM NAY',
                  items: [
                    {
                      id: 'tx-1',
                      date: 'Hôm nay, 14:30',
                      title: 'Trạm sạc VinFast Landmark',
                      amount: '-185.000đ',
                      by: 'Nguyen Van A',
                      type: 'EXPENSE',
                      categoryLabel: 'Sạc điện',
                      icon: Zap,
                      iconColor: '#00f2fe',
                      iconBg: 'rgba(0, 242, 254, 0.14)',
                      iconBorder: 'rgba(0, 242, 254, 0.35)',
                      chipBg: 'rgba(0, 242, 254, 0.12)',
                      chipColor: '#00f2fe',
                      chipBorder: 'rgba(0, 242, 254, 0.30)',
                    },
                  ],
                },
                {
                  group: 'THÁNG 09/2026',
                  items: [
                    {
                      id: 'tx-2',
                      date: '28/09/2026',
                      title: 'Rửa xe & vệ sinh nội thất',
                      amount: '-120.000đ',
                      by: 'Tran Thi B',
                      type: 'EXPENSE',
                      categoryLabel: 'Vệ sinh',
                      icon: Sparkles,
                      iconColor: '#c084fc',
                      iconBg: 'rgba(168, 85, 247, 0.14)',
                      iconBorder: 'rgba(168, 85, 247, 0.35)',
                      chipBg: 'rgba(168, 85, 247, 0.12)',
                      chipColor: '#c084fc',
                      chipBorder: 'rgba(168, 85, 247, 0.30)',
                    },
                    {
                      id: 'tx-3',
                      date: '24/09/2026',
                      title: 'Bảo dưỡng định kỳ cấp 1',
                      amount: '-1.450.000đ',
                      by: 'Le Van C',
                      type: 'EXPENSE',
                      categoryLabel: 'Bảo dưỡng',
                      icon: Wrench,
                      iconColor: '#fb923c',
                      iconBg: 'rgba(249, 115, 22, 0.14)',
                      iconBorder: 'rgba(249, 115, 22, 0.35)',
                      chipBg: 'rgba(249, 115, 22, 0.12)',
                      chipColor: '#fb923c',
                      chipBorder: 'rgba(249, 115, 22, 0.30)',
                    },
                    {
                      id: 'tx-4',
                      date: '18/09/2026',
                      title: 'Nạp quỹ đồng sở hữu tháng 9',
                      amount: '+5.000.000đ',
                      by: 'Cả nhóm',
                      type: 'INCOME',
                      categoryLabel: 'Nạp quỹ',
                      icon: Wallet,
                      iconColor: '#34d399',
                      iconBg: 'rgba(16, 185, 129, 0.14)',
                      iconBorder: 'rgba(16, 185, 129, 0.35)',
                      chipBg: 'rgba(16, 185, 129, 0.12)',
                      chipColor: '#34d399',
                      chipBorder: 'rgba(16, 185, 129, 0.30)',
                    },
                  ],
                },
              ].map((section, sIdx) => {
                const visibleItems = section.items.filter((item) => {
                  if (historyFilter === 'ALL') return true;
                  return item.type === historyFilter;
                });
                if (visibleItems.length === 0) return null;

                return (
                  <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        padding: '2px 4px',
                      }}
                    >
                      {section.group}
                    </div>

                    {visibleItems.map((rec) => (
                      <div
                        key={rec.id}
                        style={{
                          background: 'rgba(10, 26, 48, 0.50)',
                          borderRadius: '16px',
                          padding: '13px 16px',
                          border: '1px solid rgba(0, 242, 254, 0.12)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(14, 36, 66, 0.75)';
                          e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                          e.currentTarget.style.transform = 'translateX(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(10, 26, 48, 0.50)';
                          e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.12)';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: rec.iconBg,
                              border: `1.2px solid ${rec.iconBorder}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: `0 0 12px ${rec.iconBorder}`,
                            }}
                          >
                            <rec.icon size={17} color={rec.iconColor} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
                                {rec.title}
                              </span>
                              <span
                                style={{
                                  background: rec.chipBg,
                                  border: `1px solid ${rec.chipBorder}`,
                                  color: rec.chipColor,
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '1px 7px',
                                  borderRadius: '9999px',
                                  letterSpacing: '0.02em',
                                }}
                              >
                                {rec.categoryLabel}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', fontWeight: 500 }}>
                              {rec.date} · {rec.by}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontSize: '15px',
                              fontWeight: 800,
                              color: rec.type === 'INCOME' ? '#34d399' : '#fb7185',
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {rec.amount}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                            {rec.type === 'INCOME' ? 'Cộng quỹ' : 'Trừ quỹ'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
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
      )}
    </>
  );
};
