import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CoOwnershipGroupResponse,
  AvailableUserResponse,
  CreateInvitationPayload,
  ContributorShareContribution,
  InvitationPreviewResponse,
} from '../../../types/coOwnership';
import {
  searchAvailableUsers,
  fetchInvitationPermission,
  previewInvitation,
  createMembershipInvitation,
} from '../../../services/coOwnershipApi';
import { useAuthStore } from '../../../store/authStore';
import {
  UserPlus,
  Search,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  Users,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  Award,
  Sparkles,
} from 'lucide-react';

interface EnhancedAddMemberModalProps {
  coOwnership: CoOwnershipGroupResponse;
  vehicleId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EnhancedAddMemberModal: React.FC<EnhancedAddMemberModalProps> = ({
  coOwnership,
  vehicleId,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const [step, setStep] = useState<'SELECT_USER' | 'ALLOCATE_SHARES' | 'CONFIRM'>('SELECT_USER');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AvailableUserResponse | null>(null);
  const [leaderPercentage, setLeaderPercentage] = useState<number>(10.0);
  const [contributorShares, setContributorShares] = useState<Record<string, number>>({});
  const [invitationNote, setInvitationNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Permission query
  const { data: permission, isLoading: isLoadingPermission } = useQuery({
    queryKey: ['invitationPermission', coOwnership.id, vehicleId],
    queryFn: () => fetchInvitationPermission(coOwnership.id, vehicleId),
    enabled: Boolean(coOwnership.id),
  });

  // 2. Search users query
  const { data: rawAvailableUsers, isLoading: isSearchingUsers } = useQuery<AvailableUserResponse[]>({
    queryKey: ['availableUsers', coOwnership.id, searchTerm],
    queryFn: () => searchAvailableUsers(coOwnership.id, searchTerm),
    enabled: step === 'SELECT_USER' && Boolean(coOwnership.id),
  });

  const availableUsers = useMemo<AvailableUserResponse[]>(() => {
    if (!rawAvailableUsers) return [];
    if (Array.isArray(rawAvailableUsers)) return rawAvailableUsers;
    return [];
  }, [rawAvailableUsers]);

  // Active members in group (excluding current user / leader)
  const otherMembers = useMemo(() => {
    if (!coOwnership.members) return [];
    return coOwnership.members.filter(
      (m) => m.status === 'ACTIVE' && m.userId !== currentUser?.id
    );
  }, [coOwnership.members, currentUser?.id]);

  // Set default leader percentage based on max available
  useEffect(() => {
    if (permission?.leaderSharePercentage) {
      if (permission.leaderSharePercentage < 10.0) {
        setLeaderPercentage(permission.leaderSharePercentage);
      } else {
        setLeaderPercentage(10.0);
      }
    }
  }, [permission]);

  // Total calculated offered percentage
  const totalOfferedPercentage = useMemo(() => {
    const leaderPart = Number(leaderPercentage) || 0;
    const contributorsTotal = Object.values(contributorShares).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0
    );
    return parseFloat((leaderPart + contributorsTotal).toFixed(2));
  }, [leaderPercentage, contributorShares]);

  // Contributors list for preview / mutation
  const additionalContributionsList = useMemo<ContributorShareContribution[]>(() => {
    return otherMembers
      .filter((m) => (contributorShares[m.userId] || 0) > 0)
      .map((m) => ({
        userId: m.userId,
        fullName: m.fullName,
        email: m.email,
        percentage: Number(contributorShares[m.userId]),
      }));
  }, [otherMembers, contributorShares]);

  // Preview query
  const { data: previewData, isLoading: isLoadingPreview } = useQuery<InvitationPreviewResponse>({
    queryKey: [
      'invitationPreview',
      coOwnership.id,
      selectedUser?.id,
      leaderPercentage,
      additionalContributionsList,
    ],
    queryFn: () =>
      previewInvitation(coOwnership.id, {
        inviteeUserId: selectedUser?.id,
        inviteeEmail: selectedUser?.email,
        leaderTransferPercentage: Number(leaderPercentage),
        additionalContributions: additionalContributionsList,
      }),
    enabled: step === 'CONFIRM' && Boolean(selectedUser),
  });

  // Create Invitation Mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateInvitationPayload) => createMembershipInvitation(coOwnership.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coOwnership', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['groupInvitations', coOwnership.id] });
      queryClient.invalidateQueries({ queryKey: ['groupMembers', coOwnership.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMessage(err?.message || 'Không thể tạo lời mời thành viên.');
    },
  });

  const handleContributorShareChange = (userId: string, val: number, maxShare: number) => {
    const clamped = Math.max(0, Math.min(val, maxShare));
    setContributorShares((prev) => ({
      ...prev,
      [userId]: clamped,
    }));
  };

  const handleProceedToConfirmation = () => {
    if (!selectedUser) {
      setErrorMessage('Vui lòng chọn người dùng được mời.');
      return;
    }
    if (leaderPercentage < 10.0) {
      setErrorMessage('Trưởng nhóm bắt buộc chuyển nhượng tối thiểu 10.00% tỷ lệ sở hữu.');
      return;
    }
    if (permission && leaderPercentage > permission.leaderSharePercentage) {
      setErrorMessage(`Tỷ lệ chuyển nhượng vượt quá tỷ lệ sở hữu hiện tại (${permission.leaderSharePercentage}%).`);
      return;
    }
    setErrorMessage(null);
    setStep('CONFIRM');
  };

  const handleSendInvitation = () => {
    if (!selectedUser) return;
    createMutation.mutate({
      inviteeUserId: selectedUser.id,
      inviteeEmail: selectedUser.email,
      leaderTransferPercentage: Number(leaderPercentage),
      additionalContributions: additionalContributionsList,
      invitationNote: invitationNote.trim() || undefined,
    });
  };

  // If user is not leader
  if (!isLoadingPermission && permission && !permission.canInvite) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '14px',
            padding: '20px',
            color: '#ffffff',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '13px', fontWeight: 800, marginBottom: '10px' }}>
            <AlertCircle size={18} />
            <span>KHÔNG ĐỦ THẨM QUYỀN MỜI THÀNH VIÊN</span>
          </div>

          <p style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 16px 0' }}>
            {permission.message}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ĐÓNG
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        fontFamily: 'var(--font-family, system-ui, sans-serif)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '88vh',
          background: 'linear-gradient(180deg, rgba(8, 18, 36, 0.98), rgba(5, 12, 24, 0.98))',
          border: '1.2px solid rgba(34, 230, 255, 0.45)',
          borderRadius: '16px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(34, 230, 255, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#ffffff',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(34, 230, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.8)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(34, 230, 255, 0.15)',
                border: '1px solid #22e6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={16} color="#22e6ff" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                MỜI THÀNH VIÊN ĐỒNG SỞ HỮU MỚI
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                Quyền hạn Trưởng nhóm ({permission?.leaderSharePercentage?.toFixed(2)}% cổ phần)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Progression Bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(10, 20, 40, 0.85)',
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '8px',
              textAlign: 'center',
              fontSize: '10.5px',
              fontWeight: 700,
              color: step === 'SELECT_USER' ? '#22e6ff' : '#94a3b8',
              borderBottom: step === 'SELECT_USER' ? '2px solid #22e6ff' : 'none',
            }}
          >
            1. CHỌN THÀNH VIÊN
          </div>
          <div
            style={{
              flex: 1,
              padding: '8px',
              textAlign: 'center',
              fontSize: '10.5px',
              fontWeight: 700,
              color: step === 'ALLOCATE_SHARES' ? '#22e6ff' : '#94a3b8',
              borderBottom: step === 'ALLOCATE_SHARES' ? '2px solid #22e6ff' : 'none',
            }}
          >
            2. PHÂN BỔ CỔ PHẦN
          </div>
          <div
            style={{
              flex: 1,
              padding: '8px',
              textAlign: 'center',
              fontSize: '10.5px',
              fontWeight: 700,
              color: step === 'CONFIRM' ? '#22e6ff' : '#94a3b8',
              borderBottom: step === 'CONFIRM' ? '2px solid #22e6ff' : 'none',
            }}
          >
            3. XEM TRƯỚC & GỬI
          </div>
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fca5a5',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={14} color="#ef4444" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SELECT USER */}
          {step === 'SELECT_USER' && (
            <>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Tìm kiếm người dùng có vai trò CO_OWNER chưa tham gia nhóm:
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
              >
                <Search size={14} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Nhập tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    outline: 'none',
                    width: '100%',
                  }}
                />
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {isSearchingUsers ? (
                  <div style={{ textAlign: 'center', padding: '10px', fontSize: '11px', color: '#94a3b8' }}>
                    Đang tìm kiếm...
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '10px', fontSize: '11px', color: '#64748b' }}>
                    Không tìm thấy người dùng khả dụng.
                  </div>
                ) : (
                  availableUsers.map((u) => {
                    const isSelected = selectedUser?.id === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUser(u);
                          setErrorMessage(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: isSelected ? 'rgba(34, 230, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid #22e6ff' : '1px solid transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#f8fafc' }}>
                            {u.displayName}
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>{u.email}</div>
                        </div>
                        {isSelected && <CheckCircle2 size={16} color="#22e6ff" />}
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  disabled={!selectedUser}
                  onClick={() => setStep('ALLOCATE_SHARES')}
                  style={{
                    padding: '8px 16px',
                    background: selectedUser ? 'linear-gradient(135deg, #0284c7, #06b6d4)' : 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '8px',
                    color: selectedUser ? '#ffffff' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: selectedUser ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>TIẾP THEO: PHÂN BỔ CỔ PHẦN</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </>
          )}

          {/* STEP 2: ALLOCATE SHARES */}
          {step === 'ALLOCATE_SHARES' && (
            <>
              {/* Leader Transfer Section */}
              <div
                style={{
                  background: 'rgba(34, 230, 255, 0.08)',
                  border: '1px solid rgba(34, 230, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#22e6ff' }}>
                    1. CHUYỂN NHƯỢNG TỪ TRƯỞNG NHÓM (BẮT BUỘC)
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Hiện có: <span style={{ color: '#ffffff', fontWeight: 700 }}>{permission?.leaderSharePercentage?.toFixed(2)}%</span>
                  </div>
                </div>

                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                  Quy định EVShare: Trưởng nhóm bắt buộc chuyển nhượng tối thiểu 10.00% cổ phần cho thành viên mới.
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="10"
                    max={permission?.leaderSharePercentage || 100}
                    step="0.5"
                    value={leaderPercentage}
                    onChange={(e) => setLeaderPercentage(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid #22e6ff',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#22e6ff' }}>%</span>
                  <span style={{ fontSize: '10px', color: '#10b981' }}>
                    (Còn lại: {((permission?.leaderSharePercentage || 0) - leaderPercentage).toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Contributor Voluntary Section */}
              {otherMembers.length > 0 && (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#a855f7', marginBottom: '4px' }}>
                    2. ĐÓNG GÓP TỰ NGUYỆN TỪ ĐỒNG SỞ HỮU KHÁC (TÙY CHỌN)
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', marginBottom: '8px' }}>
                    Nếu có thành viên đóng góp, hệ thống sẽ yêu cầu thành viên đó phê duyệt trước khi gửi lời mời đến người nhận.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {otherMembers.map((m) => {
                      const mShare = m.share?.percentage || 0;
                      const contrib = contributorShares[m.userId] || 0;
                      return (
                        <div
                          key={m.userId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '6px',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff' }}>{m.fullName}</div>
                            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Sở hữu hiện tại: {mShare.toFixed(2)}%</div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              min="0"
                              max={mShare}
                              step="0.5"
                              value={contrib}
                              onChange={(e) =>
                                handleContributorShareChange(m.userId, parseFloat(e.target.value) || 0, mShare)
                              }
                              style={{
                                width: '70px',
                                background: 'rgba(0, 0, 0, 0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                color: '#ffffff',
                                fontSize: '11px',
                                outline: 'none',
                                textAlign: 'right',
                              }}
                            />
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Total Summary Strip */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>TỔNG CỔ PHẦN CẤP CHO THÀNH VIÊN MỚI:</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>
                    {totalOfferedPercentage.toFixed(2)}%
                  </div>
                </div>

                <div style={{ fontSize: '10px', color: '#6ee7b7', textAlign: 'right' }}>
                  Người nhận: {selectedUser?.displayName}
                </div>
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setStep('SELECT_USER')}
                  style={{
                    padding: '8px 14px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#94a3b8',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  QUAY LẠI
                </button>

                <button
                  type="button"
                  onClick={handleProceedToConfirmation}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>TIẾP THEO: XEM TRƯỚC</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </>
          )}

          {/* STEP 3: PREVIEW & CONFIRM */}
          {step === 'CONFIRM' && (
            <>
              {isLoadingPreview ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#22e6ff' }}>
                  <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '11px' }}>Đang tính toán phân bổ và bầu chọn Trưởng nhóm...</div>
                </div>
              ) : previewData ? (
                <>
                  {/* Projected Leader Notice */}
                  <div
                    style={{
                      background: previewData.leaderChanges
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(34, 230, 255, 0.12)',
                      border: previewData.leaderChanges ? '1.2px solid #f59e0b' : '1px solid #22e6ff',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Award size={20} color={previewData.leaderChanges ? '#f59e0b' : '#22e6ff'} />
                    <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                      <div>
                        Trưởng nhóm hiện tại: <span style={{ fontWeight: 700 }}>{previewData.currentLeaderName}</span>
                      </div>
                      <div style={{ color: previewData.leaderChanges ? '#fbbf24' : '#6ee7b7', fontWeight: 800 }}>
                        {previewData.leaderChanges
                          ? `DỰ KIẾN THAY ĐỔI: ${previewData.projectedLeaderName} sẽ trở thành Trưởng nhóm mới (sở hữu tỷ lệ cao nhất).`
                          : `Trưởng nhóm không đổi: ${previewData.currentLeaderName} tiếp tục giữ vai trò đại diện.`}
                      </div>
                    </div>
                  </div>

                  {/* Distribution Table */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', fontSize: '10.5px', fontWeight: 800, color: '#38bdf8' }}>
                      BẢNG DỰ PHÓNG CỔ PHẦN TOÀN NHÓM (TỔNG 100.00%)
                    </div>

                    <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                      {previewData.projectedDistribution.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 12px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            fontSize: '11px',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: item.isProjectedLeader ? 800 : 500, color: item.isProjectedLeader ? '#22e6ff' : '#ffffff' }}>
                              {item.fullName}
                            </span>
                            {item.isProjectedLeader && (
                              <span style={{ marginLeft: '6px', fontSize: '9px', background: 'rgba(34, 230, 255, 0.2)', padding: '2px 5px', borderRadius: '4px', color: '#22e6ff' }}>
                                Trưởng nhóm
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#94a3b8', fontSize: '10px' }}>
                              {item.currentPercentage.toFixed(2)}%
                            </span>
                            <ArrowRight size={10} color="#64748b" />
                            <span style={{ fontWeight: 800, color: item.projectedPercentage > 0 ? '#10b981' : '#64748b' }}>
                              {item.projectedPercentage.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Note input */}
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Lời nhắn gửi kèm (tùy chọn):</div>
                    <input
                      type="text"
                      placeholder="Chào mừng bạn đến với nhóm đồng sở hữu EVShare..."
                      value={invitationNote}
                      onChange={(e) => setInvitationNote(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: '#ffffff',
                        fontSize: '11px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </>
              ) : null}

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setStep('ALLOCATE_SHARES')}
                  style={{
                    padding: '8px 14px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#94a3b8',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  QUAY LẠI
                </button>

                <button
                  type="button"
                  disabled={createMutation.isPending}
                  onClick={handleSendInvitation}
                  style={{
                    padding: '8px 18px',
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {createMutation.isPending ? <Loader2 className="animate-spin" size={13} /> : <Sparkles size={13} />}
                  <span>{createMutation.isPending ? 'Đang gửi lời mời...' : 'XÁC NHẬN & GỬI LỜI MỜI'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
