import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { VehicleResponse } from '../../../types/vehicle';

export type VotingView = 'LIST' | 'DETAIL' | 'CREATE';
import {
  VoteProposalResponse,
  VoteProposalStatus,
  VoteProposalType,
  ProposalVoteChoice,
  VOTE_PROPOSAL_TYPE_CONFIG,
  VOTE_PROPOSAL_STATUS_CONFIG,
  PROPOSAL_CHOICE_CONFIG,
} from '../../../types/voting';
import {
  useVoteProposals,
  useCreateVoteProposal,
  useCastVote,
  useFinalizeVoteProposal,
} from '../../../hooks/useVoting';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';
import {
  Vote,
  Plus,
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Users,
  ShieldCheck,
  Check,
  Ban,
  Minus,
  Sparkles,
  Info,
  DollarSign,
  Briefcase,
} from 'lucide-react';

interface CoOwnerVotingPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

export const CoOwnerVotingPanel: React.FC<CoOwnerVotingPanelProps> = ({ vehicle, onClose }) => {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentUserName = useAuthStore((state) => state.user?.fullName);

  const storeProposalId = useWorldStore((state) => state.selectedProposalId);
  const exitVehicleVotingMode = useWorldStore((state) => state.exitVehicleVotingMode);
  const closeVotingPanel = useWorldStore((state) => state.closeVotingPanel);
  const selectProposalRecord = useWorldStore((state) => state.selectProposalRecord);

  const [activeTab, setActiveTab] = useState<'OPEN' | 'APPROVED' | 'REJECTED' | 'ALL'>('OPEN');
  const [selectedProposalId, setSelectedProposalIdLocal] = useState<string | null>(storeProposalId || null);
  // Authoritative single source of truth for Voting navigation (LIST -> DETAIL -> CREATE)
  const [votingView, setVotingView] = useState<VotingView>(storeProposalId ? 'DETAIL' : 'LIST');
  const [previousView, setPreviousView] = useState<'LIST' | 'DETAIL'>('LIST');

  // Synchronize local selected proposal with authoritative store state
  useEffect(() => {
    if (storeProposalId) {
      setSelectedProposalIdLocal(storeProposalId);
      // Guard: do not preemptively reset if user is currently creating a proposal
      setVotingView((current) => (current === 'CREATE' ? 'CREATE' : 'DETAIL'));
    }
  }, [storeProposalId]);

  const handleSelectProposal = (id: string) => {
    setSelectedProposalIdLocal(id);
    selectProposalRecord(id);
    setIsDescriptionExpanded(false);
    setIsPolicyExpanded(false);
    setShowAbstainInfo(false);
    setIsMemberListExpanded(false);
    setIsTechDetailsExpanded(false);
    setVoteChoice(null);
    setVoteComment('');
    setVotingView('DETAIL');
  };

  const handleBackToList = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedProposalIdLocal(null);
    selectProposalRecord(null);
    setIsDescriptionExpanded(false);
    setIsPolicyExpanded(false);
    setShowAbstainInfo(false);
    setIsMemberListExpanded(false);
    setIsTechDetailsExpanded(false);
    setVoteChoice(null);
    setVoteComment('');
    setVotingView('LIST');
  };

  const handleOpenCreate = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPreviousView(votingView === 'DETAIL' ? 'DETAIL' : 'LIST');
    setFormError(null);
    setIsGovernanceExpanded(false);
    setVotingView('CREATE');
  };

  const handleCancelCreate = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFormError(null);
    setIsGovernanceExpanded(false);
    setVotingView(previousView);
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // 1. Reset all local temporary views
    setVotingView('LIST');
    setPreviousView('LIST');
    setSelectedProposalIdLocal(null);
    selectProposalRecord(null);
    setVoteChoice(null);
    setVoteComment('');
    setConfirmingVote(false);
    setFormError(null);
    setIsGovernanceExpanded(false);
    setIsDescriptionExpanded(false);
    setIsPolicyExpanded(false);
    setShowAbstainInfo(false);
    setIsMemberListExpanded(false);
    setIsTechDetailsExpanded(false);

    // 2. Authoritative global store exit
    closeVotingPanel();
    exitVehicleVotingMode();

    // 3. Trigger parent callback
    if (onClose) {
      onClose();
    }
  };

  // Keyboard Escape support to close entire Voting panel or cancel create view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (votingView === 'CREATE') {
          setVotingView(previousView);
          return;
        }
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [votingView, previousView, onClose]);

  // Form state
  const [formType, setFormType] = useState<VoteProposalType>('MAINTENANCE');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('4000000');
  const [formDays, setFormDays] = useState('5');
  const [formError, setFormError] = useState<string | null>(null);
  const [isGovernanceExpanded, setIsGovernanceExpanded] = useState(false);

  // Detail view state
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(false);
  const [showAbstainInfo, setShowAbstainInfo] = useState(false);
  const [isMemberListExpanded, setIsMemberListExpanded] = useState(false);
  const [isTechDetailsExpanded, setIsTechDetailsExpanded] = useState(false);

  // Voting state
  const [voteChoice, setVoteChoice] = useState<ProposalVoteChoice | null>(null);
  const [voteComment, setVoteComment] = useState('');
  const [confirmingVote, setConfirmingVote] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: proposals = [], isLoading } = useVoteProposals(vehicle.id);
  const createProposalMutation = useCreateVoteProposal();
  const castVoteMutation = useCastVote();
  const finalizeMutation = useFinalizeVoteProposal();

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const selectedProposal = useMemo(() => {
    if (!selectedProposalId) return null;
    return proposals.find((p) => p.id === selectedProposalId) || null;
  }, [proposals, selectedProposalId]);

  const filteredProposals = useMemo(() => {
    if (activeTab === 'ALL') return proposals;
    return proposals.filter((p) => p.status === activeTab);
  }, [proposals, activeTab]);

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (createProposalMutation.isPending) return;
    setFormError(null);

    const amountNum = parseFloat(formAmount.replace(/\D/g, ''));
    if (!formTitle.trim()) {
      setFormError('Vui lòng nhập tiêu đề đề xuất.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Chi phí dự kiến phải là số tiền hợp lệ (> 0 VNĐ).');
      return;
    }

    createProposalMutation.mutate(
      {
        vehicleId: vehicle.id,
        proposalType: formType,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        estimatedAmount: amountNum,
        votingDurationDays: parseInt(formDays, 10) || 5,
      },
      {
        onSuccess: (newProp) => {
          setFormTitle('');
          setFormDescription('');
          setFormAmount('4000000');
          setIsGovernanceExpanded(false);
          setSelectedProposalIdLocal(newProp.id);
          selectProposalRecord(newProp.id);
          setVotingView('DETAIL');
          showToast('success', 'ĐÃ TẠO ĐỀ XUẤT THÀNH CÔNG');
        },
        onError: (err: any) => {
          console.error('Lỗi khi gửi đề xuất:', err);
          setFormError('Không thể tạo đề xuất. Vui lòng thử lại.');
        },
      }
    );
  };

  const handleCastVote = () => {
    if (!selectedProposal || !voteChoice) return;

    castVoteMutation.mutate(
      {
        proposalId: selectedProposal.id,
        payload: {
          choice: voteChoice,
          comment: voteComment.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setConfirmingVote(false);
          setVoteChoice(null);
          setVoteComment('');
          showToast('success', 'Đã ghi nhận biểu quyết của bạn!');
        },
        onError: (err: any) => {
          showToast('error', err?.message || 'Không thể gửi biểu quyết.');
        },
      }
    );
  };

  const handleFinalize = (proposalId: string) => {
    finalizeMutation.mutate(proposalId, {
      onSuccess: () => {
        showToast('success', 'Đã cập nhật trạng thái biểu quyết!');
      },
      onError: (err: any) => {
        showToast('error', err?.message || 'Không thể cập nhật biểu quyết.');
      },
    });
  };

  const formatVND = (num?: number | null) => {
    if (num == null) return '0 VNĐ';
    return `${Number(num).toLocaleString('vi-VN')} VNĐ`;
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '--:-- --/--/----';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '--:-- --/--/----';
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${time} ${day}/${month}/${year}`;
    } catch {
      return '--:-- --/--/----';
    }
  };

  // INDEPENDENT CREATE PROPOSAL PANEL VIEW (Compact 560px container mounted via React Portal)
  if (votingView === 'CREATE') {
    const createModalContent = (
      <div
        id="create-proposal-window"
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          right: '24px',
          transform: 'translateY(-50%)',
          width: 'min(560px, calc(100vw - 32px))',
          maxWidth: '560px',
          maxHeight: 'min(560px, calc(100dvh - 100px))',
          height: 'auto',
          zIndex: 100,
          background:
            'linear-gradient(180deg, rgba(8, 22, 44, 0.98) 0%, rgba(3, 10, 22, 0.99) 100%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1.5px solid rgba(34, 230, 255, 0.45)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(34, 230, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          color: '#f8fafc',
          fontFamily: "'Inter', sans-serif",
          overflow: 'hidden',
          pointerEvents: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '16px',
              right: '16px',
              zIndex: 100,
              padding: '7px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              fontWeight: 600,
              background:
                toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 1. COMPACT STICKY HEADER (~56px) */}
        <div
          style={{
            flexShrink: 0,
            height: '56px',
            minHeight: '56px',
            maxHeight: '56px',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 18px',
            borderBottom: '1px solid rgba(34, 230, 255, 0.2)',
            background: 'rgba(15, 28, 52, 0.75)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background:
                  'linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(34, 230, 255, 0.2) 100%)',
                border: '1px solid rgba(34, 230, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Vote size={16} color="#22e6ff" />
            </div>
            <div>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 800,
                  color: '#38bdf8',
                  letterSpacing: '0.02em',
                  lineHeight: '1.2',
                }}
              >
                TẠO ĐỀ XUẤT MỚI
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px', lineHeight: '1.2' }}>
                EV01 — Nhóm đồng sở hữu
              </div>
            </div>
          </div>

          <button
            id="btn-close-create-proposal-window"
            type="button"
            onClick={handleClose}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Đóng toàn bộ bảng biểu quyết"
            title="Đóng bảng biểu quyết"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '5px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 2. FORM WITH SCROLLABLE BODY AND STICKY FOOTER */}
        <form
          onSubmit={handleCreateProposal}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* SCROLLABLE BODY */}
          <div
            onWheel={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '10px 18px',
              gap: '10px',
              boxSizing: 'border-box',
            }}
          >
            {formError && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label style={formLabelStyle()}>Loại đề xuất *</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as VoteProposalType)}
                style={formInputStyle({ height: '38px' })}
              >
                <option value="MAINTENANCE">Bảo dưỡng định kỳ</option>
                <option value="REPAIR">Sửa chữa hỏng hóc</option>
                <option value="ACCESSORY">Mua sắm phụ kiện</option>
                <option value="UPGRADE">Nâng cấp trang bị xe</option>
                <option value="OTHER_COMMON_EXPENSE">Chi phí chung khác</option>
              </select>
            </div>

            <div>
              <label style={formLabelStyle()}>Tiêu đề đề xuất *</label>
              <input
                type="text"
                placeholder="Ví dụ: Thay 4 lốp xe Michelin Primacy 4 / Lắp camera hành trình 4K..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={formInputStyle({ height: '38px' })}
                required
              />
            </div>

            <div>
              <label style={formLabelStyle()}>Mô tả chi tiết phương án</label>
              <textarea
                placeholder="Nêu rõ lý do cần chi, hiện trạng xe, đơn vị cung cấp hoặc báo giá dự kiến..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                  }
                }}
                style={formInputStyle({
                  height: '75px',
                  minHeight: '75px',
                  maxHeight: '75px',
                  padding: '6px 12px',
                  lineHeight: '1.35',
                  resize: 'none',
                })}
              />
            </div>

            {/* SIDE BY SIDE: Chi phí dự kiến | Thời hạn biểu quyết */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              <div>
                <label style={formLabelStyle()}>Chi phí dự kiến (VNĐ) *</label>
                <input
                  type="text"
                  placeholder="4000000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  style={formInputStyle({ height: '38px' })}
                  required
                />
              </div>

              <div>
                <label style={formLabelStyle()}>Thời hạn biểu quyết</label>
                <select
                  value={formDays}
                  onChange={(e) => setFormDays(e.target.value)}
                  style={formInputStyle({ height: '38px' })}
                >
                  <option value="3">3 ngày (Khẩn cấp)</option>
                  <option value="5">5 ngày (Tiêu chuẩn mặc định)</option>
                  <option value="7">7 ngày (1 tuần)</option>
                  <option value="14">14 ngày (2 tuần)</option>
                </select>
              </div>
            </div>

            {/* Collapsible Co-ownership voting governance info */}
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(34, 230, 255, 0.04)',
                border: '1px solid rgba(34, 230, 255, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <button
                type="button"
                onClick={() => setIsGovernanceExpanded((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '0',
                  cursor: 'pointer',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="#22e6ff" />
                  <span>QUY TRÌNH BIỂU QUYẾT & ỦY QUYỀN THỰC THI</span>
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    transform: isGovernanceExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    color: '#38bdf8',
                  }}
                />
              </button>
              {isGovernanceExpanded && (
                <div
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    lineHeight: 1.45,
                    marginTop: '6px',
                    paddingTop: '6px',
                    borderTop: '1px dashed rgba(34, 230, 255, 0.15)',
                  }}
                >
                  • Hệ thống tự động áp dụng quy tắc biểu quyết và túc số theo hợp đồng đồng sở hữu của nhóm.
                  <br />
                  • Khi đề xuất được phê duyệt, hệ thống sẽ cấp quyền cho nhân viên STAFF thực thi bảo dưỡng/sửa chữa và ghi nhận chi phí thực tế.
                </div>
              )}
            </div>
          </div>

          {/* 3. COMPACT STICKY FOOTER (~60px) WITH ACTIONS */}
          <div
            style={{
              flexShrink: 0,
              height: '60px',
              minHeight: '60px',
              maxHeight: '60px',
              boxSizing: 'border-box',
              padding: '0 18px',
              borderTop: '1px solid rgba(34, 230, 255, 0.2)',
              background: 'rgba(10, 20, 38, 0.95)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <button
              id="btn-cancel-create-proposal"
              type="button"
              onClick={handleCancelCreate}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={createProposalMutation.isPending}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '7px 16px',
                height: '36px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#94a3b8',
                cursor: createProposalMutation.isPending ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                pointerEvents: 'auto',
              }}
            >
              HỦY
            </button>

            <button
              id="btn-submit-create-proposal"
              type="submit"
              disabled={createProposalMutation.isPending}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                background: createProposalMutation.isPending
                  ? 'rgba(2, 132, 199, 0.4)'
                  : 'linear-gradient(135deg, #0284c7 0%, #22e6ff 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 18px',
                height: '36px',
                fontSize: '12px',
                fontWeight: 800,
                color: '#071426',
                cursor: createProposalMutation.isPending ? 'not-allowed' : 'pointer',
                boxShadow: createProposalMutation.isPending
                  ? 'none'
                  : '0 0 14px rgba(34, 230, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 0.2s, transform 0.1s',
                pointerEvents: 'auto',
              }}
            >
              {createProposalMutation.isPending ? (
                <>
                  <Clock size={14} />
                  <span>ĐANG GỬI...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>GỬI ĐỀ XUẤT</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );

    return typeof document !== 'undefined' ? createPortal(createModalContent, document.body) : createModalContent;
  }

  return (
    <div
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '84px',
        right: '24px',
        width: selectedProposalId ? 'min(580px, calc(100vw - 32px))' : 'clamp(400px, 34vw, 500px)',
        maxHeight: 'calc(100dvh - 120px)',
        zIndex: 40,
        background:
          'linear-gradient(180deg, rgba(7, 20, 38, 0.96) 0%, rgba(3, 10, 22, 0.98) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(34, 230, 255, 0.35)',
        borderRadius: '18px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(34, 230, 255, 0.16)',
        display: 'flex',
        flexDirection: 'column',
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '16px',
            right: '16px',
            zIndex: 100,
            padding: '8px 12px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            fontWeight: 600,
            background:
              toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header (~56px) */}
      <div
        style={{
          flexShrink: 0,
          height: '56px',
          minHeight: '56px',
          maxHeight: '56px',
          boxSizing: 'border-box',
          padding: '0 16px',
          borderBottom: '1px solid rgba(34, 230, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(34, 230, 255, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(34, 230, 255, 0.2) 100%)',
              border: '1px solid rgba(34, 230, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Vote size={17} color="#22e6ff" />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#f3faff', letterSpacing: '0.02em', lineHeight: '1.2' }}>
              HỆ THỐNG BIỂU QUYẾT
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.2', marginTop: '1px' }}>
              {votingView === 'DETAIL' ? `${vehicle.name || 'EV01'} — Chi tiết đề xuất` : `${vehicle.name} (${vehicle.licensePlate})`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'auto' }}>
          <button
            id="btn-open-create-proposal"
            type="button"
            onClick={handleOpenCreate}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Tạo đề xuất biểu quyết mới"
            title="Tạo đề xuất biểu quyết mới"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #22e6ff 100%)',
              border: 'none',
              borderRadius: '7px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#071426',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 0 10px rgba(34, 230, 255, 0.35)',
              pointerEvents: 'auto',
              userSelect: 'none',
            }}
          >
            <Plus size={13} style={{ pointerEvents: 'none' }} />
            <span style={{ pointerEvents: 'none' }}>TẠO ĐỀ XUẤT</span>
          </button>

          <button
            id="btn-close-voting-panel"
            type="button"
            onClick={handleClose}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Đóng bảng biểu quyết"
            title="Đóng bảng biểu quyết (Esc)"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '7px',
              padding: '5px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              userSelect: 'none',
            }}
          >
            <X size={16} style={{ pointerEvents: 'none' }} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        onWheel={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxSizing: 'border-box',
        }}
      >
        {/* DETAIL VIEW MODE */}
        {votingView === 'DETAIL' && selectedProposal ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={handleBackToList}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0',
                alignSelf: 'flex-start',
                pointerEvents: 'auto',
              }}
            >
              <ArrowLeft size={13} />
              <span>Quay lại danh sách đề xuất</span>
            </button>

            {/* Compact Proposal Detail Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(34, 230, 255, 0.22)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {/* Proposal Title, Type, Status & Proposer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: '5px',
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: VOTE_PROPOSAL_TYPE_CONFIG[selectedProposal.proposalType].color,
                        background: VOTE_PROPOSAL_TYPE_CONFIG[selectedProposal.proposalType].bg,
                        border: `1px solid ${VOTE_PROPOSAL_TYPE_CONFIG[selectedProposal.proposalType].borderColor}`,
                      }}
                    >
                      {selectedProposal.proposalTypeVietnamese}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                    {selectedProposal.title}
                  </div>
                  {/* Proposer name as compact secondary text below title */}
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Người đề xuất: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{selectedProposal.creatorName}</span>
                  </div>
                </div>

                <span
                  style={{
                    flexShrink: 0,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: VOTE_PROPOSAL_STATUS_CONFIG[selectedProposal.status]?.color || '#38bdf8',
                    background: VOTE_PROPOSAL_STATUS_CONFIG[selectedProposal.status]?.bg || 'rgba(56, 189, 248, 0.15)',
                    border: `1px solid ${VOTE_PROPOSAL_STATUS_CONFIG[selectedProposal.status]?.borderColor || 'rgba(56, 189, 248, 0.45)'}`,
                  }}
                >
                  {selectedProposal.statusVietnamese}
                </span>
              </div>

              {/* Description with max 3 visible lines & "Xem thêm" */}
              {selectedProposal.description && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: '#cbd5e1',
                      lineHeight: 1.45,
                      background: 'rgba(15, 23, 42, 0.5)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: isDescriptionExpanded ? 'block' : '-webkit-box',
                      WebkitLineClamp: isDescriptionExpanded ? undefined : 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {selectedProposal.description}
                  </div>
                  {selectedProposal.description.length > 90 && (
                    <button
                      type="button"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '0 2px',
                        alignSelf: 'flex-start',
                      }}
                    >
                      {isDescriptionExpanded ? 'Thu gọn' : 'Xem thêm...'}
                    </button>
                  )}
                </div>
              )}

              {/* Merged Information Cards (Chi phí dự kiến & Thời hạn biểu quyết, Approved Budget only if approved) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: selectedProposal.status === 'APPROVED' ? '1fr 1fr 1fr' : '1fr 1fr',
                  gap: '8px',
                }}
              >
                <div style={metaCardStyle()}>
                  <span style={metaLabelStyle()}>CHI PHÍ DỰ KIẾN</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#38bdf8' }}>
                    {formatVND(selectedProposal.estimatedAmount)}
                  </span>
                </div>

                <div style={metaCardStyle()}>
                  <span style={metaLabelStyle()}>THỜI HẠN BIỂU QUYẾT</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b' }}>
                    {formatDateTime(selectedProposal.votingEndsAt)}
                  </span>
                </div>

                {selectedProposal.status === 'APPROVED' && (
                  <div style={metaCardStyle()}>
                    <span style={metaLabelStyle()}>NGÂN SÁCH ĐƯỢC DUYỆT</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#10b981' }}>
                      {formatVND(selectedProposal.approvedBudget)}
                    </span>
                  </div>
                )}
              </div>

              {/* Compact Voting Policy (One line + expandable details) */}
              <div
                style={{
                  padding: '7px 10px',
                  background: 'rgba(34, 230, 255, 0.04)',
                  border: '1px solid rgba(34, 230, 255, 0.15)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={13} color="#22e6ff" />
                    <span>
                      Quorum: <b style={{ color: '#38bdf8' }}>{selectedProposal.requiredQuorumPercentage ?? 50}%</b> | Ngưỡng đồng ý: <b style={{ color: '#10b981' }}>{selectedProposal.requiredThresholdPercentage ?? 50}%</b>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPolicyExpanded(!isPolicyExpanded)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '10px',
                      fontWeight: 600,
                    }}
                    title="Xem chi tiết quy tắc biểu quyết"
                  >
                    <Info size={12} />
                    <span>{isPolicyExpanded ? 'Đóng' : 'Chi tiết'}</span>
                  </button>
                </div>
                {isPolicyExpanded && (
                  <div
                    style={{
                      fontSize: '10.5px',
                      color: '#94a3b8',
                      lineHeight: 1.4,
                      paddingTop: '4px',
                      borderTop: '1px dashed rgba(34, 230, 255, 0.15)',
                    }}
                  >
                    Cơ chế: <b style={{ color: '#f1f5f9' }}>{selectedProposal.decisionRuleVietnamese || 'Đa số theo tỷ lệ sở hữu'}</b>. Yêu cầu tối thiểu {selectedProposal.requiredQuorumPercentage ?? 50}% tổng tỷ lệ sở hữu tham gia biểu quyết để đạt túc số (Quorum). Tỷ lệ đồng ý phải đạt tối thiểu {selectedProposal.requiredThresholdPercentage ?? 50}% trên tổng số phiếu hợp lệ để đề xuất được thông qua.
                  </div>
                )}
              </div>

              {/* Compact Participation Chart & Breakdown */}
              {(() => {
                const totalEligible = selectedProposal.totalEligibleWeight || 100;
                const participating = selectedProposal.participatingWeight || 0;
                const requiredQuorum = selectedProposal.requiredQuorumPercentage || 50;
                const requiredThreshold = selectedProposal.requiredThresholdPercentage || 50;
                const approveWeight = selectedProposal.approveWeight || 0;
                const rejectWeight = selectedProposal.rejectWeight || 0;
                const abstainWeight = selectedProposal.abstainWeight || 0;
                const notVotedWeight = Math.max(0, Math.round((totalEligible - participating) * 100) / 100);
                const isQuorumMet = selectedProposal.quorumSatisfied;

                return (
                  <div
                    style={{
                      background: 'rgba(15, 28, 52, 0.55)',
                      border: '1px solid rgba(34, 230, 255, 0.18)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {/* Participation status header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span style={{ color: '#cbd5e1' }}>
                        Đã tham gia: <b style={{ color: '#f1f5f9' }}>{participating}%</b> / Yêu cầu: <b style={{ color: '#38bdf8' }}>{requiredQuorum}%</b>
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isQuorumMet ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isQuorumMet ? '#10b981' : '#f59e0b',
                          border: `1px solid ${isQuorumMet ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                        }}
                      >
                        {isQuorumMet ? 'Đạt túc số' : 'Chưa đạt túc số'}
                      </span>
                    </div>

                    {/* Single progress bar */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        display: 'flex',
                      }}
                    >
                      {approveWeight > 0 && (
                        <div
                          style={{
                            width: `${approveWeight}%`,
                            background: '#10b981',
                            transition: 'width 0.3s ease',
                          }}
                          title={`Đồng ý: ${approveWeight}%`}
                        />
                      )}
                      {rejectWeight > 0 && (
                        <div
                          style={{
                            width: `${rejectWeight}%`,
                            background: '#ef4444',
                            transition: 'width 0.3s ease',
                          }}
                          title={`Không đồng ý: ${rejectWeight}%`}
                        />
                      )}
                      {abstainWeight > 0 && (
                        <div
                          style={{
                            width: `${abstainWeight}%`,
                            background: '#94a3b8',
                            transition: 'width 0.3s ease',
                          }}
                          title={`Phiếu trắng: ${abstainWeight}%`}
                        />
                      )}
                    </div>

                    {/* Compact 4-way breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10.5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                        <span style={{ color: '#cbd5e1' }}>
                          Đồng ý: <b style={{ color: '#10b981' }}>{approveWeight}%</b>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                        <span style={{ color: '#cbd5e1' }}>
                          Không đồng ý: <b style={{ color: '#ef4444' }}>{rejectWeight}%</b>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', position: 'relative' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} />
                        <span style={{ color: '#cbd5e1' }}>
                          Phiếu trắng: <b style={{ color: '#f1f5f9' }}>{abstainWeight}%</b>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAbstainInfo(!showAbstainInfo)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '0',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Giải thích phiếu trắng"
                        >
                          <Info size={11} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', border: '1px dashed #64748b', flexShrink: 0 }} />
                        <span style={{ color: '#64748b' }}>
                          Chưa biểu quyết: <b style={{ color: '#94a3b8' }}>{notVotedWeight}%</b>
                        </span>
                      </div>
                    </div>

                    {/* Small popover/box for Abstention Info when toggled */}
                    {showAbstainInfo && (
                      <div
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: 'rgba(148, 163, 184, 0.1)',
                          border: '1px solid rgba(148, 163, 184, 0.25)',
                          fontSize: '10px',
                          color: '#cbd5e1',
                          lineHeight: 1.4,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                        }}
                      >
                        <Info size={12} color="#38bdf8" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <div>
                          Phiếu trắng thể hiện sự tham gia nhưng không đồng ý hoặc phản đối. Phiếu trắng được tính vào túc số tham gia (Quorum) nhưng không làm tăng tỷ lệ đồng ý thông qua đề xuất (ngưỡng yêu cầu {requiredThreshold}%).
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Collapsible Member List (Default collapsed) */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsMemberListExpanded(!isMemberListExpanded)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={13} color="#38bdf8" />
                    <span>THÀNH VIÊN & PHIẾU BIỂU QUYẾT ({selectedProposal.eligibleVoters.length})</span>
                  </div>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: isMemberListExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: '#38bdf8',
                    }}
                  />
                </button>

                {isMemberListExpanded && (
                  <div style={{ padding: '4px 10px 10px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {selectedProposal.eligibleVoters.map((voter) => {
                      const castVoteItem = selectedProposal.votes.find((v) => v.voterUserId === voter.userId);
                      return (
                        <div
                          key={voter.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            fontSize: '10.5px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{voter.fullName}</span>
                            <span style={{ color: '#64748b', fontSize: '10px' }}>({voter.votingWeight}%)</span>
                          </div>
                          {castVoteItem ? (
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '9.5px',
                                fontWeight: 700,
                                color: PROPOSAL_CHOICE_CONFIG[castVoteItem.choice].color,
                                background: PROPOSAL_CHOICE_CONFIG[castVoteItem.choice].bg,
                                border: `1px solid ${PROPOSAL_CHOICE_CONFIG[castVoteItem.choice].borderColor}`,
                              }}
                            >
                              {castVoteItem.choiceVietnamese}
                            </span>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '10px' }}>Chưa biểu quyết</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Expandable Technical Details (UUID, Timestamps, Method) */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsTechDetailsExpanded(!isTechDetailsExpanded)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  <span>THÔNG TIN KỸ THUẬT & HỢP ĐỒNG</span>
                  <ChevronDown
                    size={12}
                    style={{
                      transform: isTechDetailsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: '#64748b',
                    }}
                  />
                </button>

                {isTechDetailsExpanded && (
                  <div
                    style={{
                      padding: '6px 10px 8px 10px',
                      fontSize: '10px',
                      color: '#94a3b8',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div>
                      Mã UUID đề xuất: <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{selectedProposal.id}</span>
                    </div>
                    <div>
                      Thời gian tạo: <span style={{ color: '#cbd5e1' }}>{formatDateTime(selectedProposal.createdAt)}</span>
                    </div>
                    <div>
                      Hạn kết thúc: <span style={{ color: '#cbd5e1' }}>{formatDateTime(selectedProposal.votingEndsAt)}</span>
                    </div>
                    <div>
                      Cơ chế: <span style={{ color: '#cbd5e1' }}>Biểu quyết theo tỷ lệ sở hữu (Weighted Ownership)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Finalized Results Section (if proposal closed) */}
              {selectedProposal.status !== 'OPEN' && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background:
                      selectedProposal.status === 'APPROVED'
                        ? 'rgba(16, 185, 129, 0.08)'
                        : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${
                      selectedProposal.status === 'APPROVED'
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(239, 68, 68, 0.3)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: selectedProposal.status === 'APPROVED' ? '#10b981' : '#ef4444',
                    }}
                  >
                    KẾT QUẢ BIỂU QUYẾT: {selectedProposal.statusVietnamese.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    Thời điểm hoàn tất: {formatDateTime(selectedProposal.finalizedAt)}
                    <br />
                    Tình trạng thực hiện: <b>{selectedProposal.executionStatusVietnamese}</b>
                    {selectedProposal.status === 'APPROVED' && (
                      <div style={{ color: '#10b981', fontWeight: 600, marginTop: '3px' }}>
                        ✓ Nhân viên STAFF đã được ủy quyền thực hiện công việc với hạn mức ngân sách: {formatVND(selectedProposal.approvedBudget)}.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* PROPOSAL LIST MODE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Filter Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '4px',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {(['OPEN', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => {
                const labelVi =
                  tab === 'OPEN'
                    ? 'Đang biểu quyết'
                    : tab === 'APPROVED'
                    ? 'Đã duyệt'
                    : tab === 'REJECTED'
                    ? 'Đã từ chối'
                    : 'Tất cả';
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: isActive ? 'rgba(34, 230, 255, 0.2)' : 'transparent',
                      border: isActive ? '1px solid rgba(34, 230, 255, 0.4)' : 'none',
                      borderRadius: '6px',
                      padding: '6px 2px',
                      fontSize: '10.5px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {labelVi}
                  </button>
                );
              })}
            </div>

            {/* List of Proposals */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '12px' }}>
                Đang tải danh sách đề xuất...
              </div>
            ) : filteredProposals.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#64748b',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span>Không có đề xuất nào trong danh mục này.</span>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    background: 'rgba(34, 230, 255, 0.12)',
                    border: '1px solid rgba(34, 230, 255, 0.35)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    pointerEvents: 'auto',
                  }}
                >
                  <Plus size={13} />
                  <span>TẠO ĐỀ XUẤT MỚI</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredProposals.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectProposal(item.id)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(34, 230, 255, 0.4)';
                      e.currentTarget.style.background = 'rgba(34, 230, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: VOTE_PROPOSAL_TYPE_CONFIG[item.proposalType].color,
                          background: VOTE_PROPOSAL_TYPE_CONFIG[item.proposalType].bg,
                          border: `1px solid ${VOTE_PROPOSAL_TYPE_CONFIG[item.proposalType].borderColor}`,
                        }}
                      >
                        {item.proposalTypeVietnamese}
                      </span>

                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: VOTE_PROPOSAL_STATUS_CONFIG[item.status].color,
                          background: VOTE_PROPOSAL_STATUS_CONFIG[item.status].bg,
                          border: `1px solid ${VOTE_PROPOSAL_STATUS_CONFIG[item.status].borderColor}`,
                        }}
                      >
                        {item.statusVietnamese}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                      {item.title}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span style={{ color: '#94a3b8' }}>Dự kiến: <b style={{ color: '#38bdf8' }}>{formatVND(item.estimatedAmount)}</b></span>
                      <span style={{ color: '#f59e0b', fontSize: '10.5px' }}>
                        Hạn: {formatDateTime(item.votingEndsAt).split(' ')[1]}
                      </span>
                    </div>

                    {/* Participation bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${item.approveWeight}%`, background: '#10b981' }} />
                        <div style={{ width: `${item.rejectWeight}%`, background: '#ef4444' }} />
                        <div style={{ width: `${item.abstainWeight}%`, background: '#94a3b8' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                        <span>Đã tham gia: {item.participatingWeight}% — Yêu cầu: {item.requiredQuorumPercentage}%</span>
                        {item.currentUserVote ? (
                          <span style={{ color: PROPOSAL_CHOICE_CONFIG[item.currentUserVote].color, fontWeight: 700 }}>
                            Bạn: {PROPOSAL_CHOICE_CONFIG[item.currentUserVote].labelVi}
                          </span>
                        ) : (
                          <span>Chưa biểu quyết</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* STICKY VOTING FOOTER (Fixed within Voting Panel, flexShrink: 0) */}
      {votingView === 'DETAIL' && selectedProposal && (
        <div
          style={{
            flexShrink: 0,
            background: 'linear-gradient(180deg, rgba(8, 20, 38, 0.98) 0%, rgba(5, 14, 28, 0.99) 100%)',
            borderTop: '1.5px solid rgba(34, 230, 255, 0.28)',
            padding: '10px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxSizing: 'border-box',
            boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.5)',
          }}
        >
          {selectedProposal.status === 'OPEN' ? (
            selectedProposal.isEligibleToVote ? (
              <>
                {/* Header row in sticky footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
                      PHIẾU CỦA BẠN
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                      (Tỷ lệ biểu quyết: <b style={{ color: '#22e6ff' }}>{selectedProposal.currentUserWeight}%</b>)
                    </span>
                  </div>
                  {selectedProposal.currentUserVote ? (
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        color: PROPOSAL_CHOICE_CONFIG[selectedProposal.currentUserVote].color,
                        background: PROPOSAL_CHOICE_CONFIG[selectedProposal.currentUserVote].bg,
                        border: `1px solid ${PROPOSAL_CHOICE_CONFIG[selectedProposal.currentUserVote].borderColor}`,
                      }}
                    >
                      Đã chọn: {PROPOSAL_CHOICE_CONFIG[selectedProposal.currentUserVote].labelVi}
                    </span>
                  ) : (
                    <span style={{ fontSize: '10.5px', color: '#f59e0b', fontWeight: 600 }}>
                      Chưa biểu quyết
                    </span>
                  )}
                </div>

                {/* Voting Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setVoteChoice(voteChoice === 'APPROVE' ? null : 'APPROVE')}
                    style={{
                      padding: '7px 4px',
                      borderRadius: '6px',
                      border:
                        voteChoice === 'APPROVE'
                          ? '1.5px solid #10b981'
                          : '1px solid rgba(16, 185, 129, 0.35)',
                      background:
                        voteChoice === 'APPROVE'
                          ? 'rgba(16, 185, 129, 0.28)'
                          : selectedProposal.currentUserVote === 'APPROVE'
                          ? 'rgba(16, 185, 129, 0.14)'
                          : 'rgba(16, 185, 129, 0.08)',
                      color: '#10b981',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Check size={14} />
                    <span>ĐỒNG Ý</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVoteChoice(voteChoice === 'REJECT' ? null : 'REJECT')}
                    style={{
                      padding: '7px 4px',
                      borderRadius: '6px',
                      border:
                        voteChoice === 'REJECT'
                          ? '1.5px solid #ef4444'
                          : '1px solid rgba(239, 68, 68, 0.35)',
                      background:
                        voteChoice === 'REJECT'
                          ? 'rgba(239, 68, 68, 0.28)'
                          : selectedProposal.currentUserVote === 'REJECT'
                          ? 'rgba(239, 68, 68, 0.14)'
                          : 'rgba(239, 68, 68, 0.08)',
                      color: '#ef4444',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Ban size={14} />
                    <span>KHÔNG ĐỒNG Ý</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVoteChoice(voteChoice === 'ABSTAIN' ? null : 'ABSTAIN')}
                    style={{
                      padding: '7px 4px',
                      borderRadius: '6px',
                      border:
                        voteChoice === 'ABSTAIN'
                          ? '1.5px solid #94a3b8'
                          : '1px solid rgba(148, 163, 184, 0.35)',
                      background:
                        voteChoice === 'ABSTAIN'
                          ? 'rgba(148, 163, 184, 0.28)'
                          : selectedProposal.currentUserVote === 'ABSTAIN'
                          ? 'rgba(148, 163, 184, 0.14)'
                          : 'rgba(148, 163, 184, 0.08)',
                      color: '#cbd5e1',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Minus size={14} />
                    <span>PHIẾU TRẮNG</span>
                  </button>
                </div>

                {/* Confirm & Optional comment when choice selected */}
                {voteChoice && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                    <input
                      type="text"
                      placeholder={`Ý kiến đóng góp (${
                        voteChoice === 'APPROVE'
                          ? 'Đồng ý'
                          : voteChoice === 'REJECT'
                          ? 'Không đồng ý'
                          : 'Phiếu trắng'
                      })...`}
                      value={voteComment}
                      onChange={(e) => setVoteComment(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(34, 230, 255, 0.3)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        color: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCastVote}
                      disabled={castVoteMutation.isPending}
                      style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #22e6ff 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0 14px',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#071426',
                        cursor: castVoteMutation.isPending ? 'not-allowed' : 'pointer',
                        flexShrink: 0,
                        height: '31px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        boxShadow: '0 0 10px rgba(34, 230, 255, 0.3)',
                      }}
                    >
                      {castVoteMutation.isPending ? 'Đang gửi...' : selectedProposal.currentUserVote ? 'CẬP NHẬT' : 'GỬI PHIẾU'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '4px 0' }}>
                Bạn không nằm trong danh sách đồng sở hữu hợp lệ của đề xuất này.
              </div>
            )
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <span
                style={{
                  fontWeight: 800,
                  color: selectedProposal.status === 'APPROVED' ? '#10b981' : '#ef4444',
                }}
              >
                KẾT QUẢ: {selectedProposal.statusVietnamese.toUpperCase()}
              </span>
              <span style={{ color: '#cbd5e1' }}>
                Tình trạng: <b>{selectedProposal.executionStatusVietnamese}</b>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function metaCardStyle(): React.CSSProperties {
  return {
    padding: '8px 10px',
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };
}

function metaLabelStyle(): React.CSSProperties {
  return {
    fontSize: '9.5px',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.04em',
  };
}

function formLabelStyle(): React.CSSProperties {
  return {
    fontSize: '12px',
    fontWeight: 700,
    color: '#cbd5e1',
    display: 'block',
    marginBottom: '3px',
    letterSpacing: '0.01em',
  };
}

function formInputStyle(override?: React.CSSProperties): React.CSSProperties {
  return {
    width: '100%',
    height: '38px',
    background: '#091528',
    border: '1.5px solid rgba(34, 230, 255, 0.25)',
    borderRadius: '8px',
    padding: '0 12px',
    fontSize: '12px',
    color: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ...override,
  };
}
