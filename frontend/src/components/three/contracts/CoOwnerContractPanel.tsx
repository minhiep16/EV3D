import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { VehicleResponse } from '../../../types/vehicle';
import {
  useContractSummary,
  useContractVersions,
  useContractVersionDetail,
  useCreateDraftVersion,
  useSubmitVersionForAcceptance,
  useAcceptContractVersion,
  useActivateContractVersion,
} from '../../../hooks/useContract';
import { useAuthStore } from '../../../store/authStore';
import { resolveVehicleCode } from '../vehicles/vehicleModelConfig';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  History,
  PlusCircle,
  Check,
  Info,
  Hash,
  Users,
  Car,
  Lock,
  ExternalLink,
  Loader2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface CoOwnerContractPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

type ContractTab = 'CURRENT' | 'HISTORY' | 'AMENDMENT';

export const CoOwnerContractPanel: React.FC<CoOwnerContractPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const vehicleCode = resolveVehicleCode(vehicle) || vehicle.name || 'EV01';

  const [activeTab, setActiveTab] = useState<ContractTab>('CURRENT');
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [selectedHistoryVersionId, setSelectedHistoryVersionId] = useState<string | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptCheckboxChecked, setAcceptCheckboxChecked] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Form state for creating draft amendment
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftSuccess, setDraftSuccess] = useState(false);

  // Authoritative queries
  const {
    data: contractSummary,
    isLoading: isContractLoading,
    isError: isContractError,
    error: contractError,
    refetch: refetchContract,
  } = useContractSummary(vehicle.id);

  const contractId = contractSummary?.id;

  const {
    data: rawVersions = [],
    isLoading: isVersionsLoading,
    isError: isVersionsError,
    error: versionsError,
    refetch: refetchVersions,
  } = useContractVersions(contractId);

  const safeVersions = useMemo(() => {
    if (Array.isArray(rawVersions)) return rawVersions;
    if (Array.isArray((rawVersions as any)?.content)) return (rawVersions as any).content;
    if (Array.isArray((rawVersions as any)?.items)) return (rawVersions as any).items;
    return [];
  }, [rawVersions]);

  // Authoritative in-scope alias to prevent ReferenceError: versions is not defined
  const versions = safeVersions;

  const activeVersionId = selectedHistoryVersionId || contractSummary?.currentVersionId || (safeVersions[0]?.id ?? null);

  const {
    data: currentVersionDetail,
    isLoading: isDetailLoading,
    isError: isDetailError,
    error: detailError,
    refetch: refetchDetail,
  } = useContractVersionDetail(contractId, activeVersionId);

  // Parse ownership snapshot
  const parsedOwnership = useMemo(() => {
    if (!currentVersionDetail?.ownershipSnapshot) return [];
    try {
      const parsed = JSON.parse(currentVersionDetail.ownershipSnapshot);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [currentVersionDetail?.ownershipSnapshot]);

  // Mutations
  const createDraftMutation = useCreateDraftVersion(contractId, vehicle.id);
  const submitVersionMutation = useSubmitVersionForAcceptance(contractId, vehicle.id);
  const acceptMutation = useAcceptContractVersion(contractId, vehicle.id);
  const activateMutation = useActivateContractVersion(contractId, vehicle.id);

  // Parse sections from content snapshot
  const parsedSections = useMemo(() => {
    const content = currentVersionDetail?.contentSnapshot || '';
    if (!content) return [];

    // Split content by numbering e.g. "1. ", "2. ", etc. or "Điều 1:", "Điều 2:"
    const rawLines = content.split('\n');
    const sections: { title: string; content: string }[] = [];
    let currentTitle = 'Mở đầu';
    let currentParagraphs: string[] = [];

    for (const line of rawLines) {
      const trimmed = line.trim();
      const match = trimmed.match(/^(\d+\.|\bĐiều\s+\d+:?)\s+(.*)/i);
      if (match) {
        if (currentParagraphs.length > 0 || currentTitle !== 'Mở đầu') {
          sections.push({
            title: currentTitle,
            content: currentParagraphs.join('\n').trim(),
          });
        }
        currentTitle = trimmed;
        currentParagraphs = [];
      } else if (trimmed) {
        currentParagraphs.push(trimmed);
      }
    }

    if (currentParagraphs.length > 0) {
      sections.push({
        title: currentTitle,
        content: currentParagraphs.join('\n').trim(),
      });
    }

    return sections;
  }, [currentVersionDetail?.contentSnapshot]);

  const handleOpenAcceptModal = () => {
    setAcceptCheckboxChecked(false);
    setAcceptError(null);
    setShowAcceptModal(true);
  };

  const handleConfirmAcceptance = async () => {
    if (!activeVersionId) return;
    if (!acceptCheckboxChecked) {
      setAcceptError('Vui lòng đánh dấu xác nhận đồng ý các điều khoản.');
      return;
    }

    try {
      setAcceptError(null);
      await acceptMutation.mutateAsync({
        versionId: activeVersionId,
        payload: {
          contentHash: currentVersionDetail?.contentHash,
          confirmationNote: 'Xác nhận điện tử qua giao diện Garage 3D EVShare',
        },
      });
      setShowAcceptModal(false);
    } catch (err: any) {
      setAcceptError(err?.message || 'Không thể ghi nhận xác nhận điện tử.');
    }
  };

  const handleActivateVersion = async () => {
    if (!activeVersionId) return;
    try {
      await activateMutation.mutateAsync(activeVersionId);
    } catch (err: any) {
      alert(err?.message || 'Không thể kích hoạt hợp đồng.');
    }
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) {
      setDraftError('Vui lòng nhập tiêu đề phiên bản sửa đổi.');
      return;
    }
    if (!draftContent.trim()) {
      setDraftError('Vui lòng nhập nội dung hợp đồng sửa đổi.');
      return;
    }

    try {
      setDraftError(null);
      await createDraftMutation.mutateAsync({
        title: draftTitle.trim(),
        contentSnapshot: draftContent.trim(),
      });
      setDraftSuccess(true);
      setDraftTitle('');
      setDraftContent('');
      setTimeout(() => {
        setDraftSuccess(false);
        setActiveTab('HISTORY');
      }, 1500);
    } catch (err: any) {
      setDraftError(err?.message || 'Không thể tạo bản dự thảo sửa đổi.');
    }
  };

  const renderModalPortal = (content: React.ReactNode) => {
    if (typeof document === 'undefined') return content;
    return createPortal(content, document.body);
  };

  if (typeof document === 'undefined') return null;

  return (
    <>
      {createPortal(
        <aside
          className="evshare-contract-panel"
          role="region"
          aria-label="Bảng quản lý hợp đồng đồng sở hữu"
          data-ui-interactive="true"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: '90px',
            right: '24px',
            bottom: '20px',
            width: 'min(500px, calc(100vw - 32px))',
            height: 'calc(100vh - 110px)',
            maxHeight: 'calc(100vh - 110px)',
            zIndex: 1000,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, rgba(8, 20, 38, 0.96) 0%, rgba(4, 12, 24, 0.98) 100%)',
            backdropFilter: 'blur(26px)',
            WebkitBackdropFilter: 'blur(26px)',
            border: '1.5px solid rgba(0, 242, 254, 0.40)',
            borderRadius: '22px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.82), 0 0 35px rgba(0, 242, 254, 0.20)',
            color: '#ffffff',
            overflow: 'hidden',
            userSelect: 'none',
            fontFamily: "var(--font-family, 'Outfit', sans-serif)",
            animation: 'contractPanelFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
        {/* =========================================================================
            HEADER: Title, Subtitle, and Close
            ========================================================================= */}
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid rgba(0, 242, 254, 0.20)',
            background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.12) 0%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(0, 242, 254, 0.16)',
                border: '1.5px solid #00f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 14px rgba(0, 242, 254, 0.35)',
                flexShrink: 0,
              }}
            >
              <FileText size={20} color="#00f2fe" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: '#ffffff',
                    margin: 0,
                    lineHeight: 1.1,
                    textTransform: 'uppercase',
                  }}
                >
                  HỢP ĐỒNG ĐỒNG SỞ HỮU
                </h2>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                <span
                  style={{
                    background: 'rgba(0, 242, 254, 0.14)',
                    border: '1px solid rgba(0, 242, 254, 0.45)',
                    color: '#00f2fe',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {vehicleCode} — QUY CHẾ VẬN HÀNH
                </span>
                <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                  {contractSummary?.contractCode || 'HD-EV01-2026'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Đóng bảng hợp đồng"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
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
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* =========================================================================
            NAVIGATION TABS (CURRENT, HISTORY, AMENDMENT)
            ========================================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(5, 14, 28, 0.65)',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('CURRENT');
              setSelectedHistoryVersionId(null);
            }}
            style={{
              padding: '10px 4px',
              fontSize: '11px',
              fontWeight: 750,
              letterSpacing: '0.02em',
              background: activeTab === 'CURRENT' ? 'rgba(0, 242, 254, 0.14)' : 'transparent',
              color: activeTab === 'CURRENT' ? '#00f2fe' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'CURRENT' ? '2px solid #00f2fe' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            HỢP ĐỒNG
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            style={{
              padding: '10px 4px',
              fontSize: '11px',
              fontWeight: 750,
              letterSpacing: '0.02em',
              background: activeTab === 'HISTORY' ? 'rgba(0, 242, 254, 0.14)' : 'transparent',
              color: activeTab === 'HISTORY' ? '#00f2fe' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'HISTORY' ? '2px solid #00f2fe' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            LỊCH SỬ ({safeVersions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AMENDMENT')}
            style={{
              padding: '10px 4px',
              fontSize: '11px',
              fontWeight: 750,
              letterSpacing: '0.02em',
              background: activeTab === 'AMENDMENT' ? 'rgba(0, 242, 254, 0.14)' : 'transparent',
              color: activeTab === 'AMENDMENT' ? '#00f2fe' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'AMENDMENT' ? '2px solid #00f2fe' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            TU CHỈNH
          </button>
        </div>

        {/* =========================================================================
            TAB CONTENT CONTAINER
            ========================================================================= */}
        <div
          style={{
            padding: '14px 16px',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Loading and Error states */}
          {isContractLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', color: '#00f2fe', gap: '8px', fontSize: '12px' }}>
              <Loader2 size={16} className="animate-spin" />
              <span>ĐANG TẢI HỢP ĐỒNG...</span>
            </div>
          )}

          {isContractError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '10px', padding: '12px 14px', color: '#fca5a5', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} color="#ef4444" />
                <span style={{ fontWeight: 700 }}>KHÔNG THỂ TẢI HỢP ĐỒNG</span>
              </div>
              <div style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
                {contractError instanceof Error ? contractError.message : 'Lỗi kết nối máy chủ'}
              </div>
              <button
                type="button"
                onClick={() => refetchContract()}
                style={{
                  alignSelf: 'flex-start',
                  padding: '4px 10px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCcw size={11} />
                <span>Thử lại</span>
              </button>
            </div>
          )}

          {!isContractLoading && !isContractError && !contractSummary && (
            <div style={{ padding: '36px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <FileText size={32} color="#64748b" />
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#94a3b8' }}>
                CHƯA CÓ HỢP ĐỒNG ĐỒNG SỞ HỮU
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '280px' }}>
                Phương tiện này chưa được khởi tạo quy chế hợp đồng đồng sở hữu số hóa.
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 1: CURRENT CONTRACT & 16 SECTIONS
              ===================================================================== */}
          {activeTab === 'CURRENT' && contractSummary && (
            <>
              {/* Top Hero Summary Card */}
              <div
                style={{
                  background: 'rgba(10, 26, 48, 0.80)',
                  border: '1.2px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#00f2fe" />
                    <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      TRẠNG THÁI HIỆN HÀNH
                    </span>
                  </div>
                  {(() => {
                    const verStatus = currentVersionDetail?.status || contractSummary.status;
                    const verStatusLabel = currentVersionDetail?.statusLabel || (verStatus === 'ACTIVE' ? 'ĐANG CÓ HIỆU LỰC' : 'CHỜ XÁC NHẬN');
                    const isActive = verStatus === 'ACTIVE';
                    return (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: isActive
                            ? 'rgba(16, 185, 129, 0.20)'
                            : 'rgba(245, 158, 11, 0.20)',
                          color: isActive ? '#34d399' : '#fbbf24',
                          border: `1px solid ${
                            isActive
                              ? 'rgba(16, 185, 129, 0.45)'
                              : 'rgba(245, 158, 11, 0.45)'
                          }`,
                        }}
                      >
                        {verStatusLabel}
                      </span>
                    );
                  })()}
                </div>

                {/* Base Contract vs Pending Appendix Notice */}
                {contractSummary.status === 'ACTIVE' && currentVersionDetail?.status === 'PENDING_ACCEPTANCE' && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '10px',
                      color: '#fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Info size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <span>
                      Hợp đồng gốc vẫn đang có hiệu lực. Bản phụ lục <strong>{currentVersionDetail.versionNumberFormatted}</strong> đang chờ hoàn tất xác nhận hai bên để kích hoạt chính thức.
                    </span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                  <div style={{ background: 'rgba(4, 14, 28, 0.65)', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Phiên bản</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#00f2fe', marginTop: '1px' }}>
                      {currentVersionDetail?.versionNumberFormatted || contractSummary.currentVersionFormatted}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(4, 14, 28, 0.65)', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Tiến độ xác nhận</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginTop: '1px' }}>
                      {currentVersionDetail?.consentPolicy === 'INTERNAL_OWNERSHIP_TRANSFER'
                        ? `${currentVersionDetail.currentAcceptanceCount ?? 0}/${currentVersionDetail.requiredAcceptanceCount || 2} bên`
                        : `${currentVersionDetail?.acceptanceResponses?.length ?? contractSummary.acceptedMembers}/${currentVersionDetail?.signatories?.length ?? contractSummary.totalMembers} thành viên`}
                    </div>
                  </div>
                </div>

                {/* Audit Content Hash Badge */}
                {currentVersionDetail?.contentHash && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '9.5px',
                      color: '#64748b',
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    <Hash size={11} color="#00f2fe" />
                    <span>Mã băm kiểm toán:</span>
                    <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                      {currentVersionDetail.contentHash.substring(0, 16)}...
                    </span>
                  </div>
                )}
              </div>

              {/* Ownership Distribution Card */}
              {parsedOwnership.length > 0 && (
                <div
                  style={{
                    background: 'rgba(8, 22, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      PHÂN CHIA TỶ LỆ ĐỒNG SỞ HỮU
                    </span>
                    <span style={{ fontSize: '10px', color: '#00f2fe', fontWeight: 700 }}>
                      {parsedOwnership.length} thành viên
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {parsedOwnership.map((member: any, idx: number) => (
                      <div
                        key={member.userId || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(4, 14, 28, 0.65)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={12} color="#00f2fe" />
                          <span style={{ fontWeight: 700, color: '#f8fafc' }}>{member.fullName}</span>
                          {member.role === 'REPRESENTATIVE' && (
                            <span
                              style={{
                                fontSize: '8.5px',
                                background: 'rgba(0, 242, 254, 0.18)',
                                border: '1px solid rgba(0, 242, 254, 0.35)',
                                color: '#00f2fe',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              Đại diện
                            </span>
                          )}
                        </div>
                        <span style={{ color: '#00f2fe', fontSize: '11px', fontWeight: 800 }}>
                          {member.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Co-Owners Acceptance Progress Card */}
              <div
                style={{
                  background: 'rgba(8, 22, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {currentVersionDetail?.consentPolicy === 'INTERNAL_OWNERSHIP_TRANSFER'
                      ? `XÁC NHẬN CHUYỂN NHƯỢNG: ${currentVersionDetail.currentAcceptanceCount ?? 0}/${currentVersionDetail.requiredAcceptanceCount || 2}`
                      : 'XÁC NHẬN CÁC ĐỒNG SỞ HỮU'}
                  </span>
                  <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700 }}>
                    {currentVersionDetail?.consentPolicyLabel || (currentVersionDetail?.consentPolicy === 'INTERNAL_OWNERSHIP_TRANSFER' ? 'Yêu cầu xác nhận của hai bên' : 'Yêu cầu 100% chấp thuận')}
                  </span>
                </div>

                {/* Acceptance Records / Signatories List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Array.isArray(currentVersionDetail?.signatories) && currentVersionDetail.signatories.length > 0 ? (
                    currentVersionDetail.signatories.map((sig) => {
                      const isNotified = sig.role === 'NOTIFIED_CO_OWNER';
                      return (
                        <div
                          key={sig.userId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: isNotified ? 'rgba(30, 41, 59, 0.45)' : 'rgba(4, 14, 28, 0.65)',
                            border: isNotified
                              ? '1px dashed rgba(148, 163, 184, 0.25)'
                              : sig.isConsented
                              ? '1px solid rgba(16, 185, 129, 0.35)'
                              : '1px solid rgba(245, 158, 11, 0.35)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '11px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isNotified ? (
                              <Info size={13} color="#94a3b8" />
                            ) : sig.isConsented ? (
                              <CheckCircle2 size={13} color="#10b981" />
                            ) : (
                              <Clock size={13} color="#f59e0b" />
                            )}
                            <span style={{ color: '#94a3b8', fontSize: '10px' }}>{sig.roleVi}:</span>
                            <span style={{ fontWeight: 700, color: '#f8fafc' }}>{sig.fullName}</span>
                            {sig.ownershipPercentage !== undefined && (
                              <span style={{ color: '#00f2fe', fontSize: '10px', fontWeight: 800 }}>({sig.ownershipPercentage}%)</span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: '9.5px',
                              color: isNotified ? '#94a3b8' : sig.isConsented ? '#34d399' : '#fbbf24',
                              fontWeight: 700,
                            }}
                          >
                            {sig.statusVi}
                          </span>
                        </div>
                      );
                    })
                  ) : Array.isArray(currentVersionDetail?.acceptances) && currentVersionDetail.acceptances.length > 0 ? (
                    currentVersionDetail.acceptances.map((acc) => (
                      <div
                        key={acc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(4, 14, 28, 0.65)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={13} color="#10b981" />
                          <span style={{ fontWeight: 700, color: '#f8fafc' }}>{acc.fullName}</span>
                          <span style={{ color: '#00f2fe', fontSize: '10px', fontWeight: 800 }}>({acc.ownershipPercentage}%)</span>
                        </div>
                        <span style={{ fontSize: '9.5px', color: '#34d399', fontWeight: 600 }}>
                          Đã xác nhận điện tử
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '11px', color: '#94a3b8', padding: '4px 0' }}>
                      Chưa có thành viên nào gửi xác nhận điện tử.
                    </div>
                  )}

                  {/* Additional Approval Status Section */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '10.5px',
                      marginTop: '2px',
                    }}
                  >
                    <span style={{ color: '#94a3b8' }}>Phê duyệt bổ sung:</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                      {currentVersionDetail?.additionalApprovalStatus || 'Không yêu cầu'}
                    </span>
                  </div>
                </div>

                {/* Primary Action Button (Sign or Activate) */}
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {contractSummary.canAccept && (
                    <button
                      type="button"
                      onClick={handleOpenAcceptModal}
                      style={{
                        width: '100%',
                        height: '38px',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(0, 242, 254, 0.28) 100%)',
                        border: '1.5px solid #10b981',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 800,
                        letterSpacing: '0.02em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.40)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.25)';
                      }}
                    >
                      <ShieldCheck size={15} color="#34d399" />
                      <span>XÁC NHẬN ĐỒNG Ý HỢP ĐỒNG</span>
                    </button>
                  )}

                  {contractSummary.isCurrentUserAccepted && (
                    <div
                      style={{
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        color: '#34d399',
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={13} color="#10b981" />
                      <span>Bạn đã hoàn thành ký xác nhận điện tử cho phiên bản này.</span>
                    </div>
                  )}

                  {contractSummary.canActivate && (
                    <button
                      type="button"
                      onClick={handleActivateVersion}
                      disabled={activateMutation.isPending}
                      style={{
                        width: '100%',
                        height: '38px',
                        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.30) 0%, rgba(3, 105, 161, 0.40) 100%)',
                        border: '1.5px solid #00f2fe',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 800,
                        letterSpacing: '0.02em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(0, 242, 254, 0.30)',
                      }}
                    >
                      {activateMutation.isPending ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Đang kích hoạt...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} color="#00f2fe" />
                          <span>KÍCH HOẠT HỢP ĐỒNG HIỆU LỰC</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* 16 Vietnamese Contract Clauses Outline / Reader */}
              <div
                style={{
                  background: 'rgba(8, 20, 38, 0.70)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    16 ĐIỀU KHOẢN QUY CHẾ VẬN HÀNH
                  </span>
                  <span style={{ fontSize: '10px', color: '#00f2fe', fontWeight: 700 }}>
                    {parsedSections.length} mục
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {isDetailLoading ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#00f2fe', fontSize: '11px' }}>
                      Đang tải điều khoản quy chế...
                    </div>
                  ) : parsedSections.length === 0 ? (
                    <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                      Chưa có nội dung điều khoản cho phiên bản này.
                    </div>
                  ) : (
                    parsedSections.map((sec, idx) => {
                    const isExpanded = expandedSection === idx;
                    return (
                      <div
                        key={`clause-${idx}`}
                        style={{
                          background: isExpanded ? 'rgba(0, 242, 254, 0.06)' : 'rgba(4, 14, 28, 0.55)',
                          border: `1px solid ${isExpanded ? 'rgba(0, 242, 254, 0.35)' : 'rgba(255, 255, 255, 0.05)'}`,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedSection(isExpanded ? null : idx)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: 'transparent',
                            border: 'none',
                            color: isExpanded ? '#00f2fe' : '#e2e8f0',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sec.title}
                          </span>
                          {isExpanded ? <ChevronUp size={14} color="#00f2fe" /> : <ChevronDown size={14} color="#94a3b8" />}
                        </button>
                        {isExpanded && (
                          <div
                            style={{
                              padding: '8px 12px 10px 12px',
                              fontSize: '11px',
                              lineHeight: 1.5,
                              color: '#cbd5e1',
                              borderTop: '1px solid rgba(0, 242, 254, 0.15)',
                              whiteSpace: 'pre-line',
                            }}
                          >
                            {sec.content}
                          </div>
                        )}
                      </div>
                    );
                  }))}
                </div>
              </div>
            </>
          )}

          {/* =====================================================================
              TAB 2: VERSION HISTORY
              ===================================================================== */}
          {activeTab === 'HISTORY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                LỊCH SỬ CÁC PHIÊN BẢN HỢP ĐỒNG
              </div>

              {isVersionsLoading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', color: '#00f2fe', gap: '8px', fontSize: '12px' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>ĐANG TẢI LỊCH SỬ PHIÊN BẢN...</span>
                </div>
              )}

              {isVersionsError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '10px', padding: '12px 14px', color: '#fca5a5', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} color="#ef4444" />
                    <span style={{ fontWeight: 700 }}>KHÔNG THỂ TẢI LỊCH SỬ PHIÊN BẢN</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
                    {versionsError instanceof Error ? versionsError.message : 'Lỗi kết nối máy chủ'}
                  </div>
                  <button
                    type="button"
                    onClick={() => refetchVersions()}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '4px 10px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <RotateCcw size={11} />
                    <span>Thử lại</span>
                  </button>
                </div>
              )}

              {!isVersionsLoading && !isVersionsError && safeVersions.length === 0 && (
                <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <History size={28} color="#64748b" />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
                    CHƯA CÓ LỊCH SỬ PHIÊN BẢN
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                    Chưa có phiên bản nào được ghi nhận cho hợp đồng này.
                  </div>
                </div>
              )}

              {!isVersionsLoading &&
                safeVersions.map((ver) => (
                  <div
                    key={ver.id}
                    style={{
                      background: 'rgba(8, 22, 42, 0.85)',
                      border: `1.2px solid ${
                        ver.status === 'ACTIVE'
                          ? 'rgba(16, 185, 129, 0.40)'
                          : 'rgba(255, 255, 255, 0.08)'
                      }`,
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#00f2fe' }}>
                          {ver.versionNumberFormatted}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 750,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background:
                              ver.status === 'ACTIVE'
                                ? 'rgba(16, 185, 129, 0.20)'
                                : ver.status === 'SUPERSEDED'
                                ? 'rgba(100, 116, 139, 0.20)'
                                : 'rgba(245, 158, 11, 0.20)',
                            color:
                              ver.status === 'ACTIVE'
                                ? '#34d399'
                                : ver.status === 'SUPERSEDED'
                                ? '#94a3b8'
                                : '#fbbf24',
                          }}
                        >
                          {ver.statusLabel}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHistoryVersionId(ver.id);
                          setActiveTab('CURRENT');
                        }}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(0, 242, 254, 0.12)',
                          border: '1px solid rgba(0, 242, 254, 0.35)',
                          borderRadius: '6px',
                          color: '#00f2fe',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Xem nội dung
                      </button>
                    </div>

                    <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>
                      {ver.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9.5px', color: '#94a3b8' }}>
                      <span>Tạo bởi: {ver.createdByName}</span>
                      <span>•</span>
                      <span>Xác nhận: {ver.acceptances?.length || 0} thành viên</span>
                    </div>

                    {ver.contentHash && (
                      <div style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace' }}>
                        Hash: {ver.contentHash.substring(0, 24)}...
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* =====================================================================
              TAB 3: DRAFT AMENDMENT PROPOSAL
              ===================================================================== */}
          {activeTab === 'AMENDMENT' && (
            currentUser?.role === 'STAFF' || !currentUser ? (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '14px',
                  padding: '24px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                  }}
                >
                  <Lock size={20} />
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase' }}>
                  QUYỀN TRUY CẬP BỊ HẠN CHẾ
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5, maxWidth: '320px' }}>
                  {currentUser?.role === 'STAFF'
                    ? 'Nhân viên vận hành (STAFF) không có quyền tạo hoặc sửa đổi hợp đồng đồng sở hữu. Chỉ các thành viên đồng sở hữu (CO_OWNER) hoặc Quản trị viên (ADMIN) mới có quyền đề xuất tu chỉnh.'
                    : 'Vui lòng đăng nhập bằng tài khoản đồng sở hữu để đề xuất tu chỉnh hợp đồng.'}
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateDraft} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  ĐỀ XUẤT TU CHỈNH HỢP ĐỒNG (BẢN MỚI)
                </div>

                {draftSuccess && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.45)', borderRadius: '8px', padding: '10px', color: '#34d399', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} />
                    <span>Đã tạo bản dự thảo tu chỉnh thành công!</span>
                  </div>
                )}

                {draftError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.45)', borderRadius: '8px', padding: '10px', color: '#fca5a5', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} />
                    <span>{draftError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700 }}>
                    Tiêu đề phiên bản sửa đổi:
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Tu chỉnh tỷ lệ Quorum và quy chế bảo dưỡng định kỳ"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    style={{
                      background: 'rgba(4, 14, 28, 0.85)',
                      border: '1px solid rgba(0, 242, 254, 0.35)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700 }}>
                    Nội dung điều khoản sửa đổi:
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Nhập toàn văn hoặc nội dung điều chỉnh quy chế vận hành..."
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    style={{
                      background: 'rgba(4, 14, 28, 0.85)',
                      border: '1px solid rgba(0, 242, 254, 0.35)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#ffffff',
                      fontSize: '11px',
                      lineHeight: 1.5,
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.10)', border: '1px solid rgba(245, 158, 11, 0.30)', borderRadius: '8px', padding: '8px 10px', fontSize: '10px', color: '#fbbf24', lineHeight: 1.4 }}>
                  ℹ️ Bản dự thảo tu chỉnh sau khi gửi sẽ được chuyển sang trạng thái <strong>Chờ các bên xác nhận</strong> và yêu cầu 100% đồng sở hữu ký xác nhận điện tử trước khi kích hoạt có hiệu lực.
                </div>

                <button
                  type="submit"
                  disabled={createDraftMutation.isPending}
                  style={{
                    height: '36px',
                    background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(3, 105, 161, 0.35) 100%)',
                    border: '1.2px solid #00f2fe',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '4px',
                  }}
                >
                  {createDraftMutation.isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Đang lưu dự thảo...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={14} color="#00f2fe" />
                      <span>LƯU DỰ THẢO PHIÊN BẢN MỚI</span>
                    </>
                  )}
                </button>
              </form>
            )
          )}
        </div>

        {/* =========================================================================
            FOOTER BAR: Status summary & Version info
            ========================================================================= */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(4, 12, 24, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#64748b',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={11} color="#00f2fe" />
            <span>Quy chế số hóa EVShare</span>
          </div>
          <span style={{ fontFamily: 'monospace', color: '#00f2fe' }}>
            {contractSummary?.contractCode || 'HD-EV01-2026'}
          </span>
        </div>
      </aside>,
      document.body
    )}

      {/* =========================================================================
          DEMO ELECTRONIC ACCEPTANCE MODAL
          ========================================================================= */}
      {showAcceptModal && renderModalPortal(
        <div
          data-testid="contract-accept-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 8, 18, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setShowAcceptModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '460px',
              maxWidth: '92vw',
              background: 'linear-gradient(180deg, rgba(8, 24, 48, 0.98) 0%, rgba(4, 14, 28, 0.99) 100%)',
              border: '2px solid #00f2fe',
              borderRadius: '20px',
              padding: '22px 24px',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.90), 0 0 40px rgba(0, 242, 254, 0.35)',
              color: '#ffffff',
              fontFamily: "var(--font-family, 'Outfit', sans-serif)",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#00f2fe" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                  XÁC NHẬN CHẤP THUẬN
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '14px' }}>
              Bạn đang thực hiện ký xác nhận chấp thuận cho <strong>{currentVersionDetail?.title || 'Hợp đồng đồng sở hữu'}</strong>.
              Hệ thống sẽ lưu trữ định danh tài khoản <strong>{currentUser?.fullName}</strong> cùng mốc thời gian máy chủ và mã băm toàn vẹn nội dung.
            </div>

            <div style={{ background: 'rgba(0, 242, 254, 0.08)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: '10px', padding: '10px 12px', marginBottom: '14px', fontSize: '11px', color: '#94a3b8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Phương tiện:</span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{vehicleCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Phiên bản hợp đồng:</span>
                <span style={{ color: '#00f2fe', fontWeight: 700 }}>{currentVersionDetail?.versionNumberFormatted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mã băm tài liệu:</span>
                <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>
                  {currentVersionDetail?.contentHash ? currentVersionDetail.contentHash.substring(0, 16) + '...' : 'N/A'}
                </span>
              </div>
            </div>

            {acceptError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.40)', borderRadius: '8px', padding: '8px 10px', color: '#fca5a5', fontSize: '11px', marginBottom: '12px' }}>
                {acceptError}
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#f1f5f9', marginBottom: '18px' }}>
              <input
                type="checkbox"
                checked={acceptCheckboxChecked}
                onChange={(e) => setAcceptCheckboxChecked(e.target.checked)}
                style={{ marginTop: '2px', accentColor: '#00f2fe' }}
              />
              <span>Tôi đã đọc, hiểu rõ và cam kết tuân thủ đầy đủ 16 điều khoản trong quy chế hợp đồng đồng sở hữu này.</span>
            </label>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                style={{
                  flex: 1,
                  height: '38px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmAcceptance}
                disabled={acceptMutation.isPending}
                style={{
                  flex: 2,
                  height: '38px',
                  background: 'linear-gradient(135deg, #10b981 0%, #00f2fe 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {acceptMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang ghi nhận...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} color="#ffffff" />
                    <span>ĐỒNG Ý VÀ XÁC NHẬN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
