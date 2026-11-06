import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Car,
  Users,
  FileText,
  Clock,
  ShieldAlert,
  Search,
  ChevronDown,
  ChevronUp,
  History,
  Check,
} from 'lucide-react';
import { onboardingApi } from '../../services/onboardingApi';
import { VehicleRegistrationDraftResponse } from '../../types/onboarding';
import { resolveVehicleColorHex } from '../../config/vehicleColors';

interface StaffRegistrationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewed?: () => void;
}

type FilterTab = 'PENDING' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'ALL';
type DetailSectionTab = 'VEHICLE' | 'GROUP' | 'MEMBERS' | 'CONTRACT' | 'AUDIT';

/**
 * StaffRegistrationReviewModal
 * Redesigned per Sections 6, 7, 8, 9, 10, 11:
 * - Desktop width: max 1060px, height: max 86dvh, centered layout.
 * - Stacking: zIndex 99999999, rendered in document.body outside transformed canvases.
 * - Fixed header: "XÉT DUYỆT ĐĂNG KÝ XE", subtitle, refresh, close.
 * - Filter row: compact chips + search field.
 * - Essential summary shown by default with "XEM CHI TIẾT HỒ SƠ" toggle.
 * - Detailed tabs: THÔNG TIN XE, CẤU HÌNH NHÓM, THÀNH VIÊN & CỔ PHẦN, HỢP ĐỒNG, LỊCH SỬ THẨM ĐỊNH.
 * - Preserved approval workflows, note requirements, validation, and audit trail.
 */
export const StaffRegistrationReviewModal: React.FC<StaffRegistrationReviewModalProps> = ({
  isOpen,
  onClose,
  onReviewed,
}) => {
  const [applications, setApplications] = useState<VehicleRegistrationDraftResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('PENDING');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailSectionTab>('VEHICLE');
  const [reviewReason, setReviewReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Responsive state
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadApplications = async (tab: FilterTab = filterTab) => {
    setLoading(true);
    setError(null);
    try {
      const data = await onboardingApi.getStaffApplications(tab);
      setApplications(data);
      if (data.length > 0) {
        if (!selectedId || !data.some((a) => a.id === selectedId)) {
          setSelectedId(data[0].id);
        }
      } else {
        setSelectedId(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách hồ sơ đăng ký xe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActionSuccessMessage(null);
      loadApplications(filterTab);
    }
  }, [isOpen, filterTab]);

  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (app) =>
        (app.model || '').toLowerCase().includes(q) ||
        (app.plateNumber || '').toLowerCase().includes(q) ||
        (app.vin || '').toLowerCase().includes(q) ||
        (app.groupName || '').toLowerCase().includes(q) ||
        (app.creatorName || '').toLowerCase().includes(q) ||
        (app.creatorEmail || '').toLowerCase().includes(q)
    );
  }, [applications, searchTerm]);

  const selectedApp = useMemo(
    () => applications.find((a) => a.id === selectedId) || null,
    [applications, selectedId]
  );

  useEffect(() => {
    if (selectedApp) {
      setReviewReason(selectedApp.reviewReason || selectedApp.adminReviewNotes || '');
      setError(null);
    }
  }, [selectedApp?.id]);

  if (!isOpen) return null;

  const handleDecision = async (decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES') => {
    if (!selectedApp || actionLoading) return;
    setError(null);
    setActionSuccessMessage(null);

    if ((decision === 'REJECT' || decision === 'REQUEST_CHANGES') && !reviewReason.trim()) {
      setError(
        decision === 'REJECT'
          ? 'Vui lòng nhập lý do từ chối hồ sơ đăng ký xe.'
          : 'Vui lòng nhập nội dung yêu cầu người nộp hồ sơ chỉnh sửa / bổ sung.'
      );
      return;
    }

    setActionLoading(true);
    try {
      const updated = await onboardingApi.reviewApplication(selectedApp.id, {
        decision,
        reason: reviewReason.trim() || undefined,
      });
      setActionSuccessMessage(
        decision === 'APPROVE'
          ? `Đã phê duyệt hồ sơ! Xe ${updated.model} (${updated.plateNumber}) và nhóm "${updated.groupName}" đã được kích hoạt.`
          : decision === 'REQUEST_CHANGES'
          ? `Đã gửi yêu cầu bổ sung / chỉnh sửa cho hồ sơ ${updated.plateNumber}.`
          : `Đã từ chối hồ sơ đăng ký xe ${updated.plateNumber}.`
      );
      await loadApplications(filterTab);
      onReviewed?.();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi xử lý xét duyệt hồ sơ.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(245, 158, 11, 0.16)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.45)',
            }}
          >
            ⏳ Chờ duyệt
          </span>
        );
      case 'CHANGES_REQUESTED':
        return (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(59, 130, 246, 0.16)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.45)',
            }}
          >
            ⚠️ Yêu cầu bổ sung
          </span>
        );
      case 'APPROVED':
        return (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.16)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.45)',
            }}
          >
            ✓ Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.16)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.45)',
            }}
          >
            ✕ Đã từ chối
          </span>
        );
      default:
        return (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(148, 163, 184, 0.15)',
              color: '#94a3b8',
            }}
          >
            {status}
          </span>
        );
    }
  };

  const totalSharePct = selectedApp?.coOwners
    ? selectedApp.coOwners.reduce(
        (sum, o: any) => sum + (Number(o.sharePercentage ?? o.percentage) || 0),
        0
      )
    : 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999999,
        background: 'rgba(3, 10, 22, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        pointerEvents: 'auto',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1060px, 95vw)',
          height: 'min(760px, 88dvh)',
          background: 'linear-gradient(165deg, #0c1a2e 0%, #06111f 100%)',
          border: '1.2px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 28px rgba(0, 242, 254, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e2e8f0',
        }}
      >
        {/* 1. FIXED COMPACT HEADER (Section 7) */}
        <header
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
            background: 'rgba(12, 25, 44, 0.9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
                XÉT DUYỆT ĐĂNG KÝ XE
              </h2>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: 'rgba(0, 242, 254, 0.15)',
                  color: '#00f2fe',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                STAFF QUEUE
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Thẩm định hồ sơ phương tiện & thành lập nhóm đồng sở hữu xe điện
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => loadApplications(filterTab)}
              disabled={loading}
              title="Làm mới danh sách"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                color: '#00f2fe',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Đóng cửa sổ xét duyệt (Esc)"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#cbd5e1';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <X size={15} />
            </button>
          </div>
        </header>

        {/* 2. COMPACT FILTER ROW & SEARCH BAR (Section 7) */}
        <div
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
            background: 'rgba(8, 18, 32, 0.8)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'PENDING', label: 'Chờ duyệt' },
                { id: 'CHANGES_REQUESTED', label: 'Yêu cầu bổ sung' },
                { id: 'APPROVED', label: 'Đã phê duyệt' },
                { id: 'REJECTED', label: 'Đã từ chối' },
                { id: 'ALL', label: 'Tất cả' },
              ] as { id: FilterTab; label: string }[]
            ).map((tab) => {
              const active = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  style={{
                    padding: '4px 11px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: active ? 800 : 600,
                    background: active ? 'rgba(0, 242, 254, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                    border: active ? '1.2px solid #00f2fe' : '1px solid rgba(148, 163, 184, 0.2)',
                    color: active ? '#00f2fe' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{ position: 'relative', minWidth: '220px', flex: isMobile ? '1 1 100%' : 'none' }}>
            <Search
              size={13}
              style={{ position: 'absolute', left: '10px', top: '8px', color: '#64748b' }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm biển số, VIN, tên xe, người nộp..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '6px 10px 6px 28px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.28)',
                color: '#f8fafc',
                fontSize: '11.5px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* 3. MAIN WORKSPACE: COMPACT LIST (LEFT) + WORKSPACE (RIGHT) */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '310px minmax(0, 1fr)',
          }}
        >
          {/* A. COMPACT REGISTRATION LIST (Section 7) */}
          <div
            style={{
              borderRight: isMobile ? 'none' : '1px solid rgba(148, 163, 184, 0.16)',
              borderBottom: isMobile ? '1px solid rgba(148, 163, 184, 0.16)' : 'none',
              overflowY: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              background: 'rgba(6, 14, 26, 0.6)',
              maxHeight: isMobile ? '180px' : 'none',
            }}
          >
            {loading ? (
              <div style={{ padding: '28px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '11.5px' }}>
                Đang tải danh sách hồ sơ...
              </div>
            ) : filteredList.length === 0 ? (
              <div style={{ padding: '32px 12px', textAlign: 'center', color: '#64748b', fontSize: '11.5px' }}>
                Không có hồ sơ nào trong danh mục này.
              </div>
            ) : (
              filteredList.map((app) => {
                const isSelected = app.id === selectedId;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedId(app.id)}
                    style={{
                      padding: '9px 11px',
                      borderRadius: '10px',
                      background: isSelected
                        ? 'rgba(0, 242, 254, 0.12)'
                        : 'rgba(15, 29, 48, 0.65)',
                      border: isSelected
                        ? '1.4px solid #00f2fe'
                        : '1px solid rgba(148, 163, 184, 0.18)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                        {app.plateNumber || app.licensePlate || 'Chưa có biển số'}
                      </span>
                      {renderStatusBadge(app.status)}
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#00f2fe' }}>
                      {app.model || app.vehicleModel}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        Nhóm: {app.groupName}
                      </span>
                      <span>
                        {app.submittedAt
                          ? new Date(app.submittedAt).toLocaleDateString('vi-VN')
                          : new Date(app.updatedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* B. SELECTED REGISTRATION SUMMARY & WORKSPACE (Section 7 & 8) */}
          <div
            style={{
              overflowY: 'auto',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              minWidth: 0,
            }}
          >
            {actionSuccessMessage && (
              <div
                role="status"
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  color: '#34d399',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={15} />
                <span>{actionSuccessMessage}</span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  color: '#f87171',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldAlert size={15} />
                <span>{error}</span>
              </div>
            )}

            {!selectedApp ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Chọn một hồ sơ đăng ký xe ở danh sách bên trái để xem chi tiết và phê duyệt.
              </div>
            ) : (
              <>
                {/* 1. ESSENTIAL SUMMARY CARD (Section 7) */}
                <div
                  style={{
                    background: 'rgba(14, 28, 48, 0.85)',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    border: '1px solid rgba(0, 242, 254, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {renderStatusBadge(selectedApp.status)}
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Mã: <strong style={{ color: '#e2e8f0' }}>{selectedApp.id.slice(0, 10)}...</strong>
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#ffffff' }}>
                        {selectedApp.model}{' '}
                        <span style={{ color: '#00f2fe', marginLeft: '6px' }}>• {selectedApp.plateNumber}</span>
                      </h3>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8' }}>
                      <div>
                        Người nộp: <strong style={{ color: '#ffffff' }}>{selectedApp.creatorName}</strong>
                      </div>
                      {selectedApp.creatorEmail && <div>{selectedApp.creatorEmail}</div>}
                    </div>
                  </div>

                  {/* 6 Essential Summary Points (Section 7) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'rgba(6, 14, 26, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.12)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Tên nhóm</span>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>{selectedApp.groupName}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Thành viên</span>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                        {selectedApp.coOwners?.length || 0} thành viên
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Tỷ lệ sở hữu</span>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: Math.abs(totalSharePct - 100) < 0.01 ? '#34d399' : '#f87171',
                        }}
                      >
                        {totalSharePct}% / 100%
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Định giá xe</span>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>
                        {(selectedApp.vehicleValue || 0).toLocaleString()} đ
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Pin & Năm SX</span>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                        {selectedApp.batteryCapacityKwh} kWh • {selectedApp.manufactureYear || 2025}
                      </div>
                    </div>
                  </div>

                  {/* Clear Action: Toggle Details (Section 7 & 8) */}
                  <button
                    type="button"
                    onClick={() => setShowDetails((prev) => !prev)}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: showDetails ? 'rgba(0, 242, 254, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                      border: showDetails ? '1.2px solid #00f2fe' : '1px solid rgba(56, 189, 248, 0.3)',
                      color: showDetails ? '#00f2fe' : '#38bdf8',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{showDetails ? 'ẨN CHI TIẾT HỒ SƠ' : 'XEM CHI TIẾT HỒ SƠ'}</span>
                    {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                {/* 2. EXPANDABLE DETAIL VIEW WITH COMPACT TABS (Section 8) */}
                {showDetails && (
                  <div
                    style={{
                      background: 'rgba(12, 24, 42, 0.75)',
                      borderRadius: '14px',
                      padding: '14px',
                      border: '1px solid rgba(0, 242, 254, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Compact Section Tabs */}
                    <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(148, 163, 184, 0.15)', paddingBottom: '8px', flexWrap: 'wrap' }}>
                      {(
                        [
                          { id: 'VEHICLE', label: 'THÔNG TIN XE', icon: <Car size={13} /> },
                          { id: 'GROUP', label: 'CẤU HÌNH NHÓM', icon: <Users size={13} /> },
                          { id: 'MEMBERS', label: 'THÀNH VIÊN & CỔ PHẦN', icon: <Users size={13} /> },
                          { id: 'CONTRACT', label: 'HỢP ĐỒNG', icon: <FileText size={13} /> },
                          { id: 'AUDIT', label: 'LỊCH SỬ THẨM ĐỊNH', icon: <History size={13} /> },
                        ] as { id: DetailSectionTab; label: string; icon: React.ReactNode }[]
                      ).map((tab) => {
                        const active = activeDetailTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveDetailTab(tab.id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '7px',
                              fontSize: '10.5px',
                              fontWeight: active ? 800 : 600,
                              background: active ? 'rgba(0, 242, 254, 0.18)' : 'transparent',
                              border: active ? '1px solid #00f2fe' : '1px solid transparent',
                              color: active ? '#00f2fe' : '#94a3b8',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            {tab.icon}
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab 1: THÔNG TIN XE */}
                    {activeDetailTab === 'VEHICLE' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '11.5px' }}>
                        <div><span style={{ color: '#94a3b8' }}>Dòng xe:</span> <div style={{ fontWeight: 700, color: '#f8fafc' }}>{selectedApp.model}</div></div>
                        <div><span style={{ color: '#94a3b8' }}>Hãng sản xuất:</span> <div style={{ fontWeight: 700, color: '#f8fafc' }}>{selectedApp.manufacturer || 'EVShare BEV'}</div></div>
                        <div><span style={{ color: '#94a3b8' }}>Biển số:</span> <div style={{ fontWeight: 800, color: '#00f2fe' }}>{selectedApp.plateNumber}</div></div>
                        <div><span style={{ color: '#94a3b8' }}>Số khung (VIN):</span> <div style={{ fontWeight: 700, color: '#f8fafc', wordBreak: 'break-all' }}>{selectedApp.vin || 'N/A'}</div></div>
                        <div><span style={{ color: '#94a3b8' }}>Dung lượng pin:</span> <div style={{ fontWeight: 700, color: '#34d399' }}>{selectedApp.batteryCapacityKwh} kWh</div></div>
                        <div><span style={{ color: '#94a3b8' }}>Năm & Khu vực:</span> <div style={{ fontWeight: 700, color: '#f8fafc' }}>{selectedApp.manufactureYear || 2025} • {selectedApp.registrationCity || 'Hà Nội'}</div></div>
                        <div>
                          <span style={{ color: '#94a3b8' }}>Màu sơn ngoại thất:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: resolveVehicleColorHex(selectedApp.exteriorColor || 'Trắng ngọc trai'), border: '1px solid #cbd5e1' }} />
                            <span>{selectedApp.exteriorColor || 'Trắng ngọc trai'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: CẤU HÌNH NHÓM */}
                    {activeDetailTab === 'GROUP' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '11.5px' }}>
                        <div><span style={{ color: '#94a3b8' }}>Tên nhóm:</span> <div style={{ fontWeight: 800, color: '#38bdf8' }}>{selectedApp.groupName}</div></div>
                        <div><span style={{ color: '#94a3b8' }}>Quỹ bảo dưỡng/tháng:</span> <div style={{ fontWeight: 700, color: '#f8fafc' }}>{(selectedApp.monthlyFundContribution || 0).toLocaleString()} đ</div></div>
                        <div><span style={{ color: '#94a3b8' }}>Đặt liên tiếp tối đa:</span> <div style={{ fontWeight: 700, color: '#f8fafc' }}>{selectedApp.maxConsecutiveBookingDays || 7} ngày</div></div>
                        <div><span style={{ color: '#94a3b8' }}>Dự phòng bảo dưỡng:</span> <div style={{ fontWeight: 700, color: '#f8fafc' }}>{Math.round((selectedApp.maintenanceReserveRate || 0.15) * 100)}%</div></div>
                        <div><span style={{ color: '#94a3b8' }}>Phí nộp chậm:</span> <div style={{ fontWeight: 700, color: '#f8fafc' }}>{Math.round((selectedApp.latePaymentFeeRate || 0.05) * 100)}%</div></div>
                      </div>
                    )}

                    {/* Tab 3: THÀNH VIÊN & CỔ PHẦN */}
                    {activeDetailTab === 'MEMBERS' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(selectedApp.coOwners || []).map((owner: any, idx: number) => {
                          const pct = Number(owner.sharePercentage ?? owner.percentage ?? 0);
                          const contrib =
                            owner.contributionAmount ||
                            Math.round(((selectedApp.vehicleValue || 1200000000) * pct) / 100);
                          return (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 10px',
                                borderRadius: '7px',
                                background: idx === 0 ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(148, 163, 184, 0.15)',
                                fontSize: '11px',
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 800, color: '#ffffff' }}>#{idx + 1}. {owner.fullName || owner.name}</span>{' '}
                                <span style={{ color: '#94a3b8' }}>({owner.email})</span>
                                <span style={{ marginLeft: '6px', fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', background: idx === 0 ? 'rgba(0, 242, 254, 0.18)' : 'rgba(148, 163, 184, 0.16)', color: idx === 0 ? '#00f2fe' : '#cbd5e1', fontWeight: 700 }}>
                                  {idx === 0 || owner.role === 'REPRESENTATIVE' ? 'Đại diện' : 'Thành viên'}
                                </span>
                              </div>
                              <div style={{ fontWeight: 800, color: '#34d399' }}>
                                {pct}% — {(contrib / 1e6).toLocaleString()} triệu đ
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Tab 4: HỢP ĐỒNG */}
                    {activeDetailTab === 'CONTRACT' && (
                      <div>
                        {selectedApp.contractDraftMarkdown ? (
                          <pre
                            style={{
                              margin: 0,
                              fontSize: '11px',
                              color: '#cbd5e1',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              maxHeight: '140px',
                              overflowY: 'auto',
                              fontFamily: 'inherit',
                              lineHeight: 1.5,
                              background: 'rgba(6, 14, 26, 0.7)',
                              padding: '10px',
                              borderRadius: '8px',
                              border: '1px solid rgba(148, 163, 184, 0.18)',
                            }}
                          >
                            {selectedApp.contractDraftMarkdown}
                          </pre>
                        ) : (
                          <div style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Chưa có dự thảo hợp đồng đính kèm.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 5: LỊCH SỬ THẨM ĐỊNH */}
                    {activeDetailTab === 'AUDIT' && (
                      <div style={{ fontSize: '11.5px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>Trạng thái hiện tại: {renderStatusBadge(selectedApp.status)}</div>
                        <div>Ngày nộp: {new Date(selectedApp.submittedAt || selectedApp.updatedAt).toLocaleString('vi-VN')}</div>
                        {selectedApp.reviewedAt && (
                          <div>
                            Đã thẩm định bởi: <strong>{selectedApp.reviewerName || 'Nhân viên'}</strong> vào lúc{' '}
                            {new Date(selectedApp.reviewedAt).toLocaleString('vi-VN')}
                          </div>
                        )}
                        {(selectedApp.reviewReason || selectedApp.adminReviewNotes) && (
                          <div style={{ background: 'rgba(6, 14, 26, 0.7)', padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                            <span style={{ color: '#94a3b8' }}>Ghi chú thẩm định: </span>
                            <span>{selectedApp.reviewReason || selectedApp.adminReviewNotes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. STAFF DECISION & APPROVAL ACTIONS (Section 10) */}
                <div
                  style={{
                    background: 'rgba(12, 24, 42, 0.92)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    border: '1.2px solid rgba(0, 242, 254, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginTop: 'auto',
                  }}
                >
                  <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff' }}>
                    GHI CHÚ THẨM ĐỊNH CỦA NHÂN VIÊN
                  </label>

                  <textarea
                    rows={2}
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    disabled={selectedApp.status === 'APPROVED'}
                    placeholder="Nhập ghi chú thẩm định hoặc lý do từ chối / yêu cầu chỉnh sửa..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(6, 14, 26, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      color: '#f8fafc',
                      fontSize: '11.5px',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />

                  {selectedApp.status !== 'APPROVED' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleDecision('REJECT')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          color: '#f87171',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <XCircle size={14} />
                        <span>Từ chối hồ sơ</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleDecision('REQUEST_CHANGES')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.5)',
                          color: '#fbbf24',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <AlertTriangle size={14} />
                        <span>Yêu cầu bổ sung</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleDecision('APPROVE')}
                        style={{
                          padding: '7px 18px',
                          borderRadius: '8px',
                          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                        }}
                      >
                        <Check size={14} />
                        <span>{actionLoading ? 'Đang xử lý...' : 'Phê duyệt & Kích hoạt xe'}</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11.5px', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} />
                      <span>
                        Hồ sơ này đã được phê duyệt. Mã xe: {selectedApp.createdVehicleId} • Mã nhóm: {selectedApp.createdGroupId}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
