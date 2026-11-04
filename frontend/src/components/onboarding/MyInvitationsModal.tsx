import React, { useState, useEffect } from 'react';
import { GroupInvitationResponse, GroupJoinRequestResponse } from '../../types/onboarding';
import { onboardingApi } from '../../services/onboardingApi';

interface MyInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MyInvitationsModal: React.FC<MyInvitationsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'invitations' | 'requests'>('invitations');
  const [invitations, setInvitations] = useState<GroupInvitationResponse[]>([]);
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequestResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invList, reqList] = await Promise.all([
        onboardingApi.getMyInvitations(),
        onboardingApi.getMyJoinRequests(),
      ]);
      setInvitations(invList);
      setJoinRequests(reqList);
    } catch (err) {
      console.error('Error loading invitations/requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId: string, accept: boolean) => {
    setActionLoading(invitationId);
    try {
      await onboardingApi.respondToInvitation(invitationId, accept);
      alert(accept ? 'Đã chấp nhận lời mời tham gia nhóm!' : 'Đã từ chối lời mời.');
      onSuccess();
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra.');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 10, 25, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          background: 'linear-gradient(135deg, rgba(13, 26, 48, 0.96), rgba(7, 15, 30, 0.98))',
          borderRadius: '16px',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 242, 254, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e2e8f0',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(2, 6, 23, 0.5)',
          }}
        >
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => setActiveTab('invitations')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px 0',
                borderBottom: activeTab === 'invitations' ? '2px solid #00f2fe' : '2px solid transparent',
                color: activeTab === 'invitations' ? '#00f2fe' : '#94a3b8',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Lời mời tham gia ({invitations.filter((i) => i.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px 0',
                borderBottom: activeTab === 'requests' ? '2px solid #00f2fe' : '2px solid transparent',
                color: activeTab === 'requests' ? '#00f2fe' : '#94a3b8',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Yêu cầu đã gửi ({joinRequests.length})
            </button>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Đang tải dữ liệu...</div>
          ) : activeTab === 'invitations' ? (
            /* INVITATIONS */
            invitations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                Bạn chưa có lời mời tham gia nhóm nào.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      background: 'rgba(2, 6, 23, 0.6)',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 242, 254, 0.2)',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '15px' }}>
                        {inv.groupName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Người mời: {inv.inviterName} • Cổ phần dự kiến: {inv.intendedSharePercentage || 0}%
                      </div>
                      {inv.message && (
                        <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px', fontStyle: 'italic' }}>
                          "{inv.message}"
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                        Mã: <code>{inv.inviteCode}</code> • Hết hạn: {new Date(inv.expiresAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    <div>
                      {inv.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            disabled={actionLoading === inv.id}
                            onClick={() => handleRespond(inv.id, true)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              border: 'none',
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Đồng ý
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === inv.id}
                            onClick={() => handleRespond(inv.id, false)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#f87171',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: inv.status === 'ACCEPTED' ? '#10b981' : '#f87171',
                          }}
                        >
                          {inv.status === 'ACCEPTED' ? 'Đã chấp nhận' : 'Đã từ chối'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* JOIN REQUESTS */
            joinRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                Bạn chưa gửi yêu cầu tham gia nhóm nào.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {joinRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      background: 'rgba(2, 6, 23, 0.6)',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 242, 254, 0.2)',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '15px' }}>
                        {req.groupName}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          backgroundColor:
                            req.status === 'APPROVED'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : req.status === 'REJECTED'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                          color:
                            req.status === 'APPROVED'
                              ? '#10b981'
                              : req.status === 'REJECTED'
                              ? '#f87171'
                              : '#f59e0b',
                        }}
                      >
                        {req.status === 'APPROVED'
                          ? 'Đã duyệt'
                          : req.status === 'REJECTED'
                          ? 'Từ chối'
                          : 'Chờ duyệt'}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                      Đề xuất cổ phần: <strong>{req.proposedSharePercentage}%</strong> • Góp vốn:{' '}
                      <strong>{req.proposedContributionAmount?.toLocaleString('vi-VN')} đ</strong>
                    </div>

                    {req.reviewerNotes && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#e2e8f0',
                          marginTop: '6px',
                          padding: '6px 10px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '6px',
                        }}
                      >
                        Phản hồi từ đại diện: {req.reviewerNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

