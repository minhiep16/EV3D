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
    setVotingView('DETAIL');
  };

  const handleBackToList = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedProposalIdLocal(null);
    selectProposalRecord(null);
    setVotingView('LIST');
  };

  const handleOpenCreate = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPreviousView(votingView === 'DETAIL' ? 'DETAIL' : 'LIST');
    setFormError(null);
    setVotingView('CREATE');
  };

  const handleCancelCreate = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFormError(null);
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

  // INDEPENDENT CREATE PROPOSAL PANEL VIEW (820px responsive container mounted via React Portal)
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
          top: '76px',
          right: '24px',
          width: 'min(820px, calc(100vw - 48px))',
          maxHeight: 'calc(100dvh - 100px)',
          height: 'min(780px, calc(100dvh - 100px))',
          zIndex: 100,
          background:
            'linear-gradient(180deg, rgba(8, 22, 44, 0.98) 0%, rgba(3, 10, 22, 0.99) 100%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1.5px solid rgba(34, 230, 255, 0.45)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(34, 230, 255, 0.2)',
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
              top: '12px',
              left: '16px',
              right: '16px',
              zIndex: 100,
              padding: '10px 14px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11.5px',
              fontWeight: 600,
              background:
                toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 1. STICKY HEADER */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(34, 230, 255, 0.2)',
            background: 'rgba(15, 28, 52, 0.65)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background:
                  'linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(34, 230, 255, 0.2) 100%)',
                border: '1px solid rgba(34, 230, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Vote size={22} color="#22e6ff" />
            </div>
            <div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#38bdf8',
                  letterSpacing: '0.02em',
                }}
              >
                TẠO ĐỀ XUẤT BIỂU QUYẾT MỚI
              </div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                Xe: <b style={{ color: '#f1f5f9' }}>{vehicle.name}</b> ({vehicle.licensePlate}) — Nhóm đồng sở hữu
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng toàn bộ bảng biểu quyết"
            title="Đóng bảng biểu quyết"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            <X size={20} />
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
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {formError && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label style={formLabelStyle()}>Loại đề xuất *</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as VoteProposalType)}
                style={formInputStyle()}
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
                style={formInputStyle()}
                required
              />
            </div>

            <div>
              <label style={formLabelStyle()}>Mô tả chi tiết phương án</label>
              <textarea
                rows={4}
                placeholder="Nêu rõ lý do cần chi, hiện trạng xe, đơn vị cung cấp hoặc báo giá dự kiến..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                  }
                }}
                style={formInputStyle({
                  height: 'auto',
                  minHeight: '120px',
                  padding: '12px 14px',
                  lineHeight: '1.5',
                  resize: 'vertical',
                })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={formLabelStyle()}>Chi phí dự kiến (VNĐ) *</label>
                <input
                  type="text"
                  placeholder="4000000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  style={formInputStyle()}
                  required
                />
              </div>

              <div>
                <label style={formLabelStyle()}>Thời hạn biểu quyết</label>
                <select
                  value={formDays}
                  onChange={(e) => setFormDays(e.target.value)}
                  style={formInputStyle()}
                >
                  <option value="3">3 ngày (Khẩn cấp)</option>
                  <option value="5">5 ngày (Tiêu chuẩn mặc định)</option>
                  <option value="7">7 ngày (1 tuần)</option>
                  <option value="14">14 ngày (2 tuần)</option>
                </select>
              </div>
            </div>

            {/* Co-ownership voting governance info */}
            <div
              style={{
                padding: '14px 16px',
                background: 'rgba(34, 230, 255, 0.04)',
                border: '1px solid rgba(34, 230, 255, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldCheck size={16} />
                <span>QUY TRÌNH BIỂU QUYẾT & ỦY QUYỀN THỰC THI</span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                • Hệ thống tự động áp dụng quy tắc biểu quyết và túc số theo hợp đồng đồng sở hữu của nhóm.
                <br />
                • Khi đề xuất được phê duyệt, hệ thống sẽ cấp quyền cho nhân viên STAFF thực thi bảo dưỡng/sửa chữa và ghi nhận chi phí thực tế.
              </div>
            </div>
          </div>

          {/* 3. STICKY FOOTER WITH ACTIONS */}
          <div
            style={{
              flexShrink: 0,
              minHeight: '76px',
              padding: '16px 24px',
              borderTop: '1px solid rgba(34, 230, 255, 0.2)',
              background: 'rgba(10, 20, 38, 0.95)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '14px',
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
                borderRadius: '10px',
                padding: '12px 24px',
                fontSize: '13px',
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
                borderRadius: '10px',
                padding: '12px 28px',
                fontSize: '13px',
                fontWeight: 800,
                color: '#071426',
                cursor: createProposalMutation.isPending ? 'not-allowed' : 'pointer',
                boxShadow: createProposalMutation.isPending
                  ? 'none'
                  : '0 0 16px rgba(34, 230, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'opacity 0.2s, transform 0.1s',
                pointerEvents: 'auto',
              }}
            >
              {createProposalMutation.isPending ? (
                <>
                  <Clock size={16} />
                  <span>ĐANG TẠO...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>GỬI ĐỀ XUẤT BIỂU QUYẾT</span>
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
        width: selectedProposalId ? 'clamp(440px, 36vw, 520px)' : 'clamp(400px, 34vw, 500px)',
        maxHeight: 'calc(100vh - 108px)',
        zIndex: 40,
        background:
          'linear-gradient(180deg, rgba(7, 20, 38, 0.96) 0%, rgba(3, 10, 22, 0.98) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(34, 230, 255, 0.35)',
        borderRadius: '20px',
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
            top: '12px',
            left: '16px',
            right: '16px',
            zIndex: 100,
            padding: '10px 14px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11.5px',
            fontWeight: 600,
            background:
              toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(34, 230, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(34, 230, 255, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(34, 230, 255, 0.2) 100%)',
              border: '1px solid rgba(34, 230, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Vote size={20} color="#22e6ff" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#f3faff', letterSpacing: '0.02em' }}>
              HỆ THỐNG BIỂU QUYẾT
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {vehicle.name} ({vehicle.licensePlate})
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
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
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#071426',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 0 12px rgba(34, 230, 255, 0.35)',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 10,
              userSelect: 'none',
            }}
          >
            <Plus size={14} style={{ pointerEvents: 'none' }} />
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
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 10,
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.2)';
              (e.currentTarget as HTMLElement).style.color = '#f87171';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)';
              (e.currentTarget as HTMLElement).style.color = '#94a3b8';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <X size={18} style={{ pointerEvents: 'none' }} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* DETAIL VIEW MODE */}
        {votingView === 'DETAIL' && selectedProposal ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button
              type="button"
              onClick={handleBackToList}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '11.5px',
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
              <ArrowLeft size={14} />
              <span>Quay lại danh sách đề xuất</span>
            </button>

            {/* Proposal Detail Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(34, 230, 255, 0.25)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: VOTE_PROPOSAL_TYPE_CONFIG[selectedProposal.proposalType].color,
                      background: VOTE_PROPOSAL_TYPE_CONFIG[selectedProposal.proposalType].bg,
                      border: `1px solid ${VOTE_PROPOSAL_TYPE_CONFIG[selectedProposal.proposalType].borderColor}`,
                    }}
                  >
                    {selectedProposal.proposalTypeVietnamese}
                  </span>
                  <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                    ID: {selectedProposal.id}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                    {selectedProposal.title}
                  </div>
                </div>

                <span
                  style={{
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

              {selectedProposal.description && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#cbd5e1',
                    lineHeight: 1.5,
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {selectedProposal.description}
                </div>
              )}

              {/* Key Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={metaCardStyle()}>
                  <span style={metaLabelStyle()}>CHI PHÍ DỰ KIẾN</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
                    {formatVND(selectedProposal.estimatedAmount)}
                  </span>
                </div>

                <div style={metaCardStyle()}>
                  <span style={metaLabelStyle()}>NGÂN SÁCH ĐƯỢC DUYỆT</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>
                    {selectedProposal.status === 'APPROVED'
                      ? formatVND(selectedProposal.approvedBudget)
                      : 'Chờ biểu quyết'}
                  </span>
                </div>

                <div style={metaCardStyle()}>
                  <span style={metaLabelStyle()}>NGƯỜI ĐỀ XUẤT</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#f1f5f9' }}>
                    {selectedProposal.creatorName}
                  </span>
                </div>

                <div style={metaCardStyle()}>
                  <span style={metaLabelStyle()}>THỜI HẠN BIỂU QUYẾT</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#f59e0b' }}>
                    {formatDateTime(selectedProposal.votingEndsAt)}
                  </span>
                </div>
              </div>

              {/* Decision Rule & Quorum Details */}
              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(34, 230, 255, 0.04)',
                  border: '1px solid rgba(34, 230, 255, 0.15)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} />
                  <span>QUY TẮC BIỂU QUYẾT THỎA THUẬN</span>
                </div>
                {selectedProposal.decisionRule ? (
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                    Quy tắc: <b style={{ color: '#f1f5f9' }}>{selectedProposal.decisionRuleVietnamese}</b>
                    <br />
                    Túc số tối thiểu (Quorum): <b style={{ color: '#f1f5f9' }}>{selectedProposal.requiredQuorumPercentage}%</b> | Ngưỡng thông qua: <b style={{ color: '#f1f5f9' }}>{selectedProposal.requiredThresholdPercentage}%</b>
                  </div>
                ) : (
                  <div style={{ fontSize: '11.5px', color: '#f59e0b', fontWeight: 700, padding: '4px 0' }}>
                    CHƯA THIẾT LẬP QUY TẮC BIỂU QUYẾT
                  </div>
                )}
              </div>

              {/* Participation & Quorum Governance Card */}
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
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {/* Header row: Progress title and Quorum status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                      <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                        Tiến độ tham gia biểu quyết:
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isQuorumMet ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isQuorumMet ? '#10b981' : '#f59e0b',
                          border: `1px solid ${isQuorumMet ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                        }}
                      >
                        {isQuorumMet ? 'Đã đạt túc số tối thiểu' : 'Chưa đạt số phiếu tham gia tối thiểu'}
                      </span>
                    </div>

                    {/* Second row: Explicit Quorum text */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                      <span style={{ color: '#94a3b8' }}>
                        Đã tham gia: <b style={{ color: '#f1f5f9' }}>{participating}%</b> — Yêu cầu: <b style={{ color: '#38bdf8' }}>{requiredQuorum}%</b>
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                        Tổng cử tri: <b style={{ color: '#f1f5f9' }}>{totalEligible}%</b>
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '10px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '5px',
                        overflow: 'hidden',
                        display: 'flex',
                      }}
                    >
                      {/* Approve Segment */}
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
                      {/* Reject Segment */}
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
                      {/* Abstain Segment */}
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

                    {/* Detailed 4-Way Breakdown Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ color: '#cbd5e1' }}>Đồng ý: <b style={{ color: '#10b981' }}>{approveWeight}%</b> ({selectedProposal.approveCount} phiếu)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                        <span style={{ color: '#cbd5e1' }}>Không đồng ý: <b style={{ color: '#ef4444' }}>{rejectWeight}%</b> ({selectedProposal.rejectCount} phiếu)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
                        <span style={{ color: '#cbd5e1' }}>Phiếu trắng: <b style={{ color: '#f1f5f9' }}>{abstainWeight}%</b> ({selectedProposal.abstainCount} phiếu)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px dashed #64748b' }} />
                        <span style={{ color: '#64748b' }}>Chưa biểu quyết: <b style={{ color: '#94a3b8' }}>{notVotedWeight}%</b></span>
                      </div>
                    </div>

                    {/* Explanation of PHIẾU TRẮNG according to contract */}
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'rgba(148, 163, 184, 0.08)',
                        border: '1px solid rgba(148, 163, 184, 0.18)',
                        fontSize: '10.5px',
                        color: '#94a3b8',
                        lineHeight: 1.45,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                      }}
                    >
                      <Info size={13} style={{ flexShrink: 0, marginTop: '2px', color: '#94a3b8' }} />
                      <div>
                        <b style={{ color: '#f1f5f9' }}>Giải thích về Phiếu trắng:</b> Phiếu trắng thể hiện việc tham gia biểu quyết nhưng không đồng ý hoặc phản đối đề xuất. Phiếu trắng được tính vào túc số tham gia (Quorum) nhưng không được tính vào tỷ lệ đồng ý thông qua đề xuất (yêu cầu ngưỡng đồng ý tối thiểu {requiredThreshold}%).
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Eligible Voters List */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  DANH SÁCH THÀNH VIÊN VÀ BIỂU QUYẾT ({selectedProposal.eligibleVoters.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedProposal.eligibleVoters.map((voter) => {
                    const castVoteItem = selectedProposal.votes.find((v) => v.voterUserId === voter.userId);
                    return (
                      <div
                        key={voter.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={13} color="#94a3b8" />
                          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{voter.fullName}</span>
                          <span style={{ color: '#64748b' }}>({voter.votingWeight}%)</span>
                        </div>
                        {castVoteItem ? (
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: PROPOSAL_CHOICE_CONFIG[castVoteItem.choice].color,
                              background: PROPOSAL_CHOICE_CONFIG[castVoteItem.choice].bg,
                              border: `1px solid ${PROPOSAL_CHOICE_CONFIG[castVoteItem.choice].borderColor}`,
                            }}
                          >
                            {castVoteItem.choiceVietnamese}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '10.5px' }}>Chưa biểu quyết</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current User Action Area */}
              {selectedProposal.status === 'OPEN' && selectedProposal.isEligibleToVote && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(2, 132, 199, 0.08)',
                    border: '1.5px solid rgba(34, 230, 255, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8' }}>
                      BIỂU QUYẾT CỦA BẠN (Tỷ lệ: {selectedProposal.currentUserWeight}%)
                    </span>
                    {selectedProposal.currentUserVote && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: PROPOSAL_CHOICE_CONFIG[selectedProposal.currentUserVote].color,
                        }}
                      >
                        Hiện tại: {PROPOSAL_CHOICE_CONFIG[selectedProposal.currentUserVote].labelVi}
                      </span>
                    )}
                  </div>

                  {/* Choice Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setVoteChoice('APPROVE')}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '8px',
                        border:
                          voteChoice === 'APPROVE'
                            ? '1.5px solid #10b981'
                            : '1px solid rgba(16, 185, 129, 0.3)',
                        background:
                          voteChoice === 'APPROVE' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.08)',
                        color: '#10b981',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Check size={16} />
                      <span>ĐỒNG Ý</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVoteChoice('REJECT')}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '8px',
                        border:
                          voteChoice === 'REJECT'
                            ? '1.5px solid #ef4444'
                            : '1px solid rgba(239, 68, 68, 0.3)',
                        background:
                          voteChoice === 'REJECT' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.08)',
                        color: '#ef4444',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Ban size={16} />
                      <span>KHÔNG ĐỒNG Ý</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVoteChoice('ABSTAIN')}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '8px',
                        border:
                          voteChoice === 'ABSTAIN'
                            ? '1.5px solid #94a3b8'
                            : '1px solid rgba(148, 163, 184, 0.3)',
                        background:
                          voteChoice === 'ABSTAIN' ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.08)',
                        color: '#94a3b8',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Minus size={16} />
                      <span>PHIẾU TRẮNG</span>
                    </button>
                  </div>

                  {voteChoice === 'ABSTAIN' && (
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'rgba(148, 163, 184, 0.1)',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        fontSize: '11px',
                        color: '#cbd5e1',
                        lineHeight: 1.4,
                      }}
                    >
                      <b style={{ color: '#f1f5f9' }}>Lưu ý về Phiếu trắng:</b> Phiếu trắng thể hiện việc bạn tham gia biểu quyết nhưng không đồng ý hoặc phản đối đề xuất. Phiếu của bạn được tính vào túc số tham gia (Quorum) nhưng không làm tăng tỷ lệ đồng ý thông qua.
                    </div>
                  )}

                  {voteChoice && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Lý do hoặc ý kiến đóng góp (tùy chọn)..."
                        value={voteComment}
                        onChange={(e) => setVoteComment(e.target.value)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '7px 10px',
                          fontSize: '11.5px',
                          color: '#ffffff',
                          outline: 'none',
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
                          padding: '8px 12px',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          color: '#071426',
                          cursor: 'pointer',
                        }}
                      >
                        {castVoteMutation.isPending ? 'Đang gửi...' : 'XÁC NHẬN GỬI BIỂU QUYẾT'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Finalized Results Section */}
              {selectedProposal.status !== 'OPEN' && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
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
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: selectedProposal.status === 'APPROVED' ? '#10b981' : '#ef4444',
                    }}
                  >
                    KẾT QUẢ BIỂU QUYẾT: {selectedProposal.statusVietnamese.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    Thời điểm hoàn tất: {formatDateTime(selectedProposal.finalizedAt)}
                    <br />
                    Tình trạng thực hiện: <b>{selectedProposal.executionStatusVietnamese}</b>
                    {selectedProposal.status === 'APPROVED' && (
                      <div style={{ color: '#10b981', fontWeight: 600, marginTop: '4px' }}>
                        ✓ Nhân viên đã được ủy quyền thực hiện công việc với hạn mức ngân sách: {formatVND(selectedProposal.approvedBudget)}.
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
    marginBottom: '6px',
    letterSpacing: '0.02em',
  };
}

function formInputStyle(override?: React.CSSProperties): React.CSSProperties {
  return {
    width: '100%',
    height: '44px',
    background: '#091528',
    border: '1.5px solid rgba(34, 230, 255, 0.25)',
    borderRadius: '10px',
    padding: '0 14px',
    fontSize: '13px',
    color: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ...override,
  };
}
