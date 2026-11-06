import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Mail,
  Send,
  X,
  FileText,
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Car,
  PieChart,
  User,
  Clock,
} from 'lucide-react';
import {
  GroupInvitationResponse,
  GroupJoinRequestResponse,
  InvitationContractReviewResponse,
} from '../../types/onboarding';
import { onboardingApi } from '../../services/onboardingApi';
import { useAuthStore } from '../../store/authStore';

interface MyInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type InvitationPanelTab = 'invitations' | 'requests';

export const MyInvitationsModal: React.FC<MyInvitationsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<InvitationPanelTab>('invitations');
  const [invitations, setInvitations] = useState<GroupInvitationResponse[]>([]);
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequestResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // In-Panel Drill-down Detail State
  const [selectedInvitation, setSelectedInvitation] = useState<GroupInvitationResponse | null>(null);

  // Dedicated Legal Contract Review State
  const [reviewingInvitation, setReviewingInvitation] = useState<GroupInvitationResponse | null>(null);
  const [contractData, setContractData] = useState<InvitationContractReviewResponse | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);

  // Electronic Consent & Signing State
  const [confirmAgreed, setConfirmAgreed] = useState(false);
  const [signerFullName, setSignerFullName] = useState(user?.fullName || '');
  const [signingLoading, setSigningLoading] = useState(false);
  const [signSuccessMessage, setSignSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.fullName) {
      setSignerFullName(user.fullName);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSelectedInvitation(null);
      setReviewingInvitation(null);
      setContractData(null);
      setConfirmAgreed(false);
      setSignSuccessMessage(null);
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invList, reqList] = await Promise.all([
        onboardingApi.getMyInvitations(),
        onboardingApi.getMyJoinRequests(),
      ]);
      setInvitations(invList || []);
      setJoinRequests(reqList || []);
    } catch (err) {
      console.error('Error loading invitations/requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Contract Review Modal for an invitation
  const handleOpenContractReview = async (inv: GroupInvitationResponse) => {
    const sharePct = Number(inv.proposedPercentage ?? inv.intendedSharePercentage ?? 0);
    if (sharePct <= 0) {
      alert('Cổ phần chưa hợp lệ (0%). Vui lòng liên hệ người mời để cập nhật trước khi ký hợp đồng.');
      return;
    }

    setReviewingInvitation(inv);
    setContractLoading(true);
    setContractError(null);
    setConfirmAgreed(false);
    setSignSuccessMessage(null);

    try {
      const res = await onboardingApi.getInvitationContract(inv.id);
      setContractData(res);
      if (res.signerFullName) {
        setSignerFullName(res.signerFullName);
      }
    } catch (err: any) {
      console.error('Failed to load invitation contract:', err);
      setContractError(
        err?.message || 'Không thể tải bản thảo hợp đồng đồng sở hữu. Vui lòng thử lại sau.'
      );
    } finally {
      setContractLoading(false);
    }
  };

  // Electronic Signing & Acceptance
  const handleSignAndAccept = async () => {
    if (!reviewingInvitation || !contractData) return;
    if (!confirmAgreed) {
      alert('Vui lòng đánh dấu xác nhận bạn đã đọc và đồng ý với nội dung hợp đồng.');
      return;
    }
    if (!signerFullName.trim() || signerFullName.trim().length < 2) {
      alert('Vui lòng nhập đầy đủ họ và tên hợp lệ để xác nhận chữ ký điện tử.');
      return;
    }

    setSigningLoading(true);
    try {
      await onboardingApi.signAndAcceptInvitation(reviewingInvitation.id, {
        contractVersionId: contractData.versionId,
        contentHash: contractData.contentHash,
        signerFullName: signerFullName.trim(),
        confirmReadAndAgreed: true,
      });

      setSignSuccessMessage('Ký xác nhận điện tử thành công! Bạn đã chính thức gia nhập nhóm đồng sở hữu.');
      onSuccess();
      loadData();

      setTimeout(() => {
        setReviewingInvitation(null);
        setContractData(null);
        setSelectedInvitation(null);
      }, 1600);
    } catch (err: any) {
      alert(err?.message || 'Ký xác nhận hợp đồng thất bại. Vui lòng thử lại.');
    } finally {
      setSigningLoading(false);
    }
  };

  // Decline Invitation
  const handleDecline = async (invitationId: string) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn từ chối lời mời tham gia nhóm này không?');
    if (!confirmed) return;

    setActionLoading(invitationId);
    try {
      await onboardingApi.respondToInvitation(invitationId, false);
      alert('Đã từ chối lời mời.');
      if (selectedInvitation?.id === invitationId) {
        setSelectedInvitation(null);
      }
      if (reviewingInvitation?.id === invitationId) {
        setReviewingInvitation(null);
      }
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi từ chối lời mời.');
    } finally {
      setActionLoading(null);
    }
  };

  // Keyboard Escape Handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (reviewingInvitation) {
          setReviewingInvitation(null);
        } else if (selectedInvitation) {
          setSelectedInvitation(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, reviewingInvitation, selectedInvitation]);

  if (!isOpen) return null;

  const pendingInvitationsCount = invitations.filter((i) => i.status === 'PENDING').length;
  const joinRequestsCount = joinRequests.length;

  return createPortal(
    <>
      {/* ================================================================= */}
      {/* 1. NON-BLOCKING FLOATING RIGHT-SIDE INVITATION PANEL              */}
      {/* Zero fullscreen backdrop: Car & showroom remain 100% interactive */}
      {/* ================================================================= */}
      {!reviewingInvitation && (
        <aside
          role="complementary"
          aria-label="Lời mời và yêu cầu"
          style={{
            position: 'fixed',
            top: '76px',
            right: '24px',
            bottom: '36px',
            width: 'clamp(380px, 28vw, 440px)',
            maxHeight: 'calc(100vh - 112px)',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '20px',
            border: '1.2px solid rgba(0, 201, 216, 0.4)',
            boxShadow: '0 16px 45px rgba(0, 180, 200, 0.16), 0 4px 16px rgba(0, 0, 0, 0.04)',
            zIndex: 90,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            pointerEvents: 'auto',
            color: '#1e293b',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            animation: 'slideInRight 0.22s ease-out',
          }}
        >
          {/* HEADER (COMPACT, NON-OVERLAPPING) */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(0, 201, 216, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(180deg, rgba(240, 249, 255, 0.92) 0%, rgba(255, 255, 255, 0.95) 100%)',
              flexShrink: 0,
            }}
          >
            {selectedInvitation ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedInvitation(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(0, 201, 216, 0.1)',
                    border: '1px solid rgba(0, 201, 216, 0.35)',
                    borderRadius: '7px',
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#009e9d',
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Danh sách</span>
                </button>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                  Chi tiết lời mời
                </span>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                    LỜI MỜI & YÊU CẦU
                  </h3>
                  {pendingInvitationsCount > 0 && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '1px 7px',
                        borderRadius: '9999px',
                        background: '#ef4444',
                        color: '#ffffff',
                      }}
                    >
                      {pendingInvitationsCount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Trung tâm kết nối đồng sở hữu xe
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1.2px solid rgba(148, 163, 184, 0.3)',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* TWO-TAB SELECTOR (SHOWN IN LIST VIEW) */}
          {!selectedInvitation && (
            <div
              style={{
                display: 'flex',
                padding: '0 16px',
                borderBottom: '1px solid rgba(0, 201, 216, 0.16)',
                background: '#ffffff',
                gap: '8px',
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTab('invitations');
                  setSelectedInvitation(null);
                }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: '10px 4px',
                  borderBottom: activeTab === 'invitations' ? '2.5px solid #00c9d8' : '2.5px solid transparent',
                  color: activeTab === 'invitations' ? '#009e9d' : '#64748b',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Mail size={14} />
                <span>Lời mời tham gia</span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: activeTab === 'invitations' ? 'rgba(0, 201, 216, 0.15)' : '#f1f5f9',
                    color: activeTab === 'invitations' ? '#009e9d' : '#64748b',
                  }}
                >
                  {pendingInvitationsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('requests');
                  setSelectedInvitation(null);
                }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: '10px 4px',
                  borderBottom: activeTab === 'requests' ? '2.5px solid #00c9d8' : '2.5px solid transparent',
                  color: activeTab === 'requests' ? '#009e9d' : '#64748b',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Send size={13} />
                <span>Yêu cầu đã gửi</span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: activeTab === 'requests' ? 'rgba(0, 201, 216, 0.15)' : '#f1f5f9',
                    color: activeTab === 'requests' ? '#009e9d' : '#64748b',
                  }}
                >
                  {joinRequestsCount}
                </span>
              </button>
            </div>
          )}

          {/* PANEL BODY CONTAINER */}
          <div
            style={{
              padding: '16px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px auto', color: '#00c9d8' }} />
                <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Đang kiểm tra lời mời...</div>
              </div>
            ) : selectedInvitation ? (
              /* ======================================================== */
              /* IN-PANEL DRILL-DOWN: INVITATION DETAIL VIEW              */
              /* ======================================================== */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Group & Vehicle Title Banner */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 201, 216, 0.08), rgba(240, 249, 255, 0.5))',
                    border: '1.2px solid rgba(0, 201, 216, 0.35)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#009e9d', textTransform: 'uppercase' }}>
                    NHÓM ĐỒNG SỞ HỮU
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {selectedInvitation.groupName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={13} color="#009e9d" />
                    <span>Người mời: <strong>{selectedInvitation.inviterName || 'Người đại diện'}</strong></span>
                  </div>
                </div>

                {/* Vehicle Specs Card */}
                {selectedInvitation.vehicleModel && (
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '9px',
                        background: 'rgba(0, 201, 216, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#009e9d',
                      }}
                    >
                      <Car size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        {selectedInvitation.vehicleModel}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Biển số: {selectedInvitation.vehiclePlateNumber || 'Đang cập nhật'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Proposed Share Card */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '1.2px solid rgba(0, 201, 216, 0.35)',
                    padding: '14px 16px',
                    boxShadow: '0 2px 8px rgba(0, 180, 200, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                      Tỷ lệ cổ phần đề xuất
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#009e9d' }}>
                      {Number(selectedInvitation.proposedPercentage ?? selectedInvitation.intendedSharePercentage ?? 0)}%
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    Quyền biểu quyết và chi phí định kỳ được phân bổ trực tiếp theo tỷ lệ này.
                  </div>
                </div>

                {/* Contract Status Notice */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#059669',
                    fontSize: '11.5px',
                    fontWeight: 700,
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>Hợp đồng điện tử đã niêm phong và sẵn sàng rà soát ký kết</span>
                </div>

                {/* Actions */}
                {selectedInvitation.status === 'PENDING' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenContractReview(selectedInvitation)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #00c9d8 0%, #009e9d 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(0, 201, 216, 0.3)',
                      }}
                    >
                      <FileText size={14} />
                      <span>XEM HỢP ĐỒNG & KÝ XÁC NHẬN</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading === selectedInvitation.id}
                      onClick={() => handleDecline(selectedInvitation.id)}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Từ chối lời mời này
                    </button>
                  </div>
                )}
              </div>
            ) : activeTab === 'invitations' ? (
              /* ======================================================== */
              /* TAB 1: INCOMING INVITATIONS LIST                         */
              /* ======================================================== */
              invitations.length === 0 ? (
                /* Compact Empty State */
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(0, 201, 216, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px auto',
                    }}
                  >
                    <Mail size={20} color="#009e9d" />
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
                    Bạn chưa có lời mời tham gia nào
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.45, maxWidth: '270px', margin: '0 auto' }}>
                    Khi có người đại diện mời bạn tham gia nhóm đồng sở hữu xe, lời mời sẽ hiển thị tại đây.
                  </div>
                </div>
              ) : (
                /* Compact Invitation Cards */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {invitations.map((inv) => {
                    const sharePct = Number(inv.proposedPercentage ?? inv.intendedSharePercentage ?? 0);
                    const isZeroPercent = sharePct <= 0;
                    const isPending = inv.status === 'PENDING';

                    return (
                      <div
                        key={inv.id}
                        onClick={() => setSelectedInvitation(inv)}
                        style={{
                          background: '#ffffff',
                          borderRadius: '14px',
                          border: isZeroPercent
                            ? '1.2px solid rgba(245, 158, 11, 0.45)'
                            : '1.2px solid rgba(0, 201, 216, 0.35)',
                          boxShadow: '0 2px 8px rgba(0, 180, 200, 0.06)',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 800,
                                color: '#0f172a',
                                fontSize: '13.5px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {inv.groupName}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                              Người mời: <strong>{inv.inviterName || 'Người đại diện'}</strong>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '9999px',
                              background:
                                inv.status === 'ACCEPTED'
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : inv.status === 'DECLINED'
                                  ? 'rgba(239, 68, 68, 0.12)'
                                  : 'rgba(0, 201, 216, 0.14)',
                              color:
                                inv.status === 'ACCEPTED'
                                  ? '#10b981'
                                  : inv.status === 'DECLINED'
                                  ? '#ef4444'
                                  : '#009e9d',
                              flexShrink: 0,
                            }}
                          >
                            {inv.status === 'ACCEPTED'
                              ? 'Đã chấp nhận'
                              : inv.status === 'DECLINED'
                              ? 'Đã từ chối'
                              : 'Chờ phản hồi'}
                          </span>
                        </div>

                        {/* Specs Pill */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '11px',
                          }}
                        >
                          <span style={{ color: '#475569' }}>
                            {inv.vehicleModel || 'Xe điện EVShare'}
                          </span>
                          <span style={{ fontWeight: 800, color: '#009e9d' }}>
                            Cổ phần: {sharePct}%
                          </span>
                        </div>

                        {/* Card Footer Actions */}
                        {isPending && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '2px',
                            }}
                          >
                            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                              {inv.expiresAt ? `Hạn: ${new Date(inv.expiresAt).toLocaleDateString('vi-VN')}` : ''}
                            </span>
                            <span
                              style={{
                                fontSize: '11.5px',
                                fontWeight: 800,
                                color: '#009e9d',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                            >
                              <span>Xem chi tiết & ký</span>
                              <ChevronRight size={13} />
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* ======================================================== */
              /* TAB 2: OUTGOING JOIN REQUESTS LIST                       */
              /* ======================================================== */
              joinRequests.length === 0 ? (
                /* Compact Empty State */
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(0, 201, 216, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px auto',
                    }}
                  >
                    <Send size={18} color="#009e9d" />
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
                    Bạn chưa gửi yêu cầu tham gia nào
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.45, maxWidth: '270px', margin: '0 auto' }}>
                    Bạn có thể khám phá và gửi yêu cầu gia nhập các nhóm đồng sở hữu từ màn hình chính.
                  </div>
                </div>
              ) : (
                /* Compact Join Request Cards */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {joinRequests.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '14px',
                        border: '1.2px solid rgba(0, 201, 216, 0.28)',
                        boxShadow: '0 2px 8px rgba(0, 180, 200, 0.05)',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                          {req.groupName}
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '9999px',
                            background:
                              req.status === 'APPROVED'
                                ? 'rgba(16, 185, 129, 0.12)'
                                : req.status === 'REJECTED'
                                ? 'rgba(239, 68, 68, 0.12)'
                                : 'rgba(245, 158, 11, 0.12)',
                            color:
                              req.status === 'APPROVED'
                                ? '#10b981'
                                : req.status === 'REJECTED'
                                ? '#ef4444'
                                : '#d97706',
                          }}
                        >
                          {req.status === 'APPROVED'
                            ? 'Đã duyệt'
                            : req.status === 'REJECTED'
                            ? 'Đã từ chối'
                            : 'Đang chờ duyệt'}
                        </span>
                      </div>

                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        Cổ phần đề xuất: <strong>{req.proposedSharePercentage}%</strong>
                      </div>

                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                        Gửi lúc: {req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : '--'}
                      </div>

                      {req.reviewerNotes && (
                        <div style={{ fontSize: '11px', color: '#009e9d', fontStyle: 'italic', marginTop: '2px' }}>
                          Ghi chú: "{req.reviewerNotes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </aside>
      )}

      {/* ================================================================= */}
      {/* 2. DEDICATED FOCUSED CONTRACT REVIEW & ELECTRONIC SIGNING MODAL   */}
      {/* Opened strictly when reviewing/signing a legally binding document  */}
      {/* ================================================================= */}
      {reviewingInvitation && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReviewingInvitation(null);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(12, 28, 48, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            pointerEvents: 'auto',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '820px',
              maxHeight: '90vh',
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              borderRadius: '24px',
              border: '1.5px solid rgba(0, 201, 216, 0.45)',
              boxShadow: '0 25px 60px rgba(0, 180, 200, 0.2), 0 4px 20px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              color: '#1e293b',
              pointerEvents: 'auto',
            }}
          >
            {/* Contract Top Bar */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid rgba(0, 201, 216, 0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.9), rgba(255, 255, 255, 0.98))',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setReviewingInvitation(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1.2px solid rgba(0, 201, 216, 0.35)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#009e9d',
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Quay lại</span>
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#009e9d" />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#009e9d', letterSpacing: '0.04em' }}>
                      XÁC THỰC PHÁP LÝ & KÝ ĐIỆN TỬ
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Rà soát Hợp đồng Đồng sở hữu
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReviewingInvitation(null)}
                aria-label="Đóng"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1.2px solid rgba(148, 163, 184, 0.3)',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Contract Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {contractLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                  <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#00c9d8' }} />
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Đang tải văn bản hợp đồng từ máy chủ bảo mật...</div>
                </div>
              ) : contractError ? (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1.2px solid rgba(239, 68, 68, 0.3)',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800 }}>Chưa thể ký xác nhận</h4>
                    <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.5 }}>{contractError}</p>
                    <button
                      type="button"
                      onClick={() => setReviewingInvitation(null)}
                      style={{
                        marginTop: '12px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Quay lại danh sách
                    </button>
                  </div>
                </div>
              ) : contractData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Summary Banner Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {/* Share Card */}
                    <div
                      style={{
                        background: 'rgba(0, 201, 216, 0.06)',
                        border: '1.2px solid rgba(0, 201, 216, 0.35)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                      }}
                    >
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#009e9d', textTransform: 'uppercase' }}>
                        CỔ PHẦN ĐỀ XUẤT
                      </span>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                        {contractData.proposedPercentage}%
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Ước tính: {(contractData.proposedContributionAmount / 1e6).toLocaleString()} triệu VNĐ
                      </div>
                    </div>

                    {/* Vehicle Identity */}
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1.2px solid rgba(148, 163, 184, 0.35)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                      }}
                    >
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                        PHƯƠNG TIỆN ĐỒNG SỞ HỮU
                      </span>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                        {contractData.vehicleModel || contractData.vehicleName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Biển số: <strong>{contractData.vehiclePlateNumber || 'Đang đăng ký'}</strong>
                      </div>
                    </div>

                    {/* Legal Immutability Hash */}
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1.2px solid rgba(148, 163, 184, 0.35)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                      }}
                    >
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                        BẢN GỐC NIÊM PHONG (SHA-256)
                      </span>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#009e9d', marginTop: '4px', fontFamily: 'monospace' }}>
                        {contractData.contentHash ? contractData.contentHash.substring(0, 18) + '...' : 'SECURED'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                        Phiên bản: <strong>{contractData.versionNumberFormatted || 'V1.0'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Contract Scrollable Viewer */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      border: '1.2px solid rgba(0, 201, 216, 0.3)',
                      boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.04)',
                      padding: '20px 24px',
                      maxHeight: '320px',
                      overflowY: 'auto',
                      fontSize: '13px',
                      lineHeight: '1.68',
                      color: '#334155',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    }}
                  >
                    {contractData.contentSnapshot}
                  </div>

                  {/* Electronic Consent Box */}
                  <div
                    style={{
                      background: 'rgba(240, 249, 255, 0.85)',
                      borderRadius: '16px',
                      border: '1.5px solid rgba(0, 201, 216, 0.45)',
                      padding: '16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <input
                        id="consent-checkbox"
                        type="checkbox"
                        checked={confirmAgreed}
                        onChange={(e) => setConfirmAgreed(e.target.checked)}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginTop: '2px',
                          cursor: 'pointer',
                          accentColor: '#00c9d8',
                        }}
                      />
                      <label
                        htmlFor="consent-checkbox"
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: '#0f172a',
                          cursor: 'pointer',
                          lineHeight: 1.45,
                        }}
                      >
                        Tôi đã đọc kỹ, hiểu rõ toàn bộ các điều khoản và cam kết tuân thủ quy chế đồng sở hữu phương tiện này.
                      </label>
                    </div>

                    {/* Signer Full Name Confirmation */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 240px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>
                          XÁC NHẬN CHỮ KÝ ĐIỆN TỬ (HỌ VÀ TÊN NGƯỜI KÝ)
                        </label>
                        <input
                          type="text"
                          value={signerFullName}
                          onChange={(e) => setSignerFullName(e.target.value)}
                          placeholder="Họ và tên người ký"
                          style={{
                            width: '100%',
                            padding: '9px 14px',
                            borderRadius: '9px',
                            background: '#ffffff',
                            border: '1.2px solid rgba(0, 201, 216, 0.4)',
                            fontSize: '13.5px',
                            fontWeight: 700,
                            color: '#0f172a',
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div style={{ fontSize: '11px', color: '#64748b', flex: '1 1 200px', lineHeight: 1.4 }}>
                        🔒 <strong>Bảo mật danh tính:</strong> Chữ ký điện tử được lưu vết kiểm toán (Audit Trail) cùng mã băm văn bản tại máy chủ EVShare 3D.
                      </div>
                    </div>

                    {signSuccessMessage && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#059669',
                          fontSize: '12.5px',
                          fontWeight: 700,
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>{signSuccessMessage}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setReviewingInvitation(null)}
                        style={{
                          padding: '9px 20px',
                          borderRadius: '10px',
                          background: '#ffffff',
                          border: '1.2px solid rgba(148, 163, 184, 0.4)',
                          color: '#475569',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Đóng
                      </button>

                      <button
                        type="button"
                        disabled={!confirmAgreed || !signerFullName.trim() || signingLoading}
                        onClick={handleSignAndAccept}
                        style={{
                          padding: '9px 24px',
                          borderRadius: '10px',
                          background:
                            confirmAgreed && signerFullName.trim()
                              ? 'linear-gradient(135deg, #00c9d8 0%, #009e9d 100%)'
                              : '#cbd5e1',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor:
                            confirmAgreed && signerFullName.trim() && !signingLoading
                              ? 'pointer'
                              : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow:
                            confirmAgreed && signerFullName.trim()
                              ? '0 4px 15px rgba(0, 201, 216, 0.35)'
                              : 'none',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        {signingLoading ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Đang xác nhận...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={15} />
                            <span>KÝ XÁC NHẬN & THAM GIA NHÓM</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};
