import React, { useState, useEffect } from 'react';
import { DiscoverableGroupResponse, CreateJoinRequestDto } from '../../types/onboarding';
import { onboardingApi } from '../../services/onboardingApi';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [groups, setGroups] = useState<DiscoverableGroupResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DiscoverableGroupResponse | null>(null);

  // Form fields for request
  const [proposedShare, setProposedShare] = useState<number>(20);
  const [proposedAmount, setProposedAmount] = useState<number>(200000000);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  const loadGroups = async (search?: string) => {
    setLoading(true);
    try {
      const data = await onboardingApi.getDiscoverableGroups(search);
      setGroups(data);
    } catch (err: any) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadGroups(searchTerm);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload: CreateJoinRequestDto = {
        proposedSharePercentage: proposedShare,
        proposedContributionAmount: proposedAmount,
        phoneNumber,
        drivingLicenseNumber: licenseNumber,
        message,
      };
      await onboardingApi.submitJoinRequest(selectedGroup.groupId, payload);
      alert('Đã gửi yêu cầu tham gia nhóm thành công! Đại diện nhóm sẽ phản hồi sớm nhất.');
      setSelectedGroup(null);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi gửi yêu cầu tham gia.');
    } finally {
      setSubmitting(false);
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
          maxWidth: '860px',
          maxHeight: '88vh',
          background: 'linear-gradient(135deg, rgba(13, 26, 48, 0.96), rgba(7, 15, 30, 0.98))',
          borderRadius: '18px',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 242, 254, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
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
            padding: '20px 28px',
            borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(2, 6, 23, 0.5)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#38bdf8' }}>
              THAM GIA NHÓM ĐỒNG SỞ HỮU CÓ SẴN
            </h2>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              Khám phá các nhóm đang mở nhận thành viên hoặc gửi yêu cầu gia nhập
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '24px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Search bar */}
        <div
          style={{
            padding: '16px 28px',
            background: 'rgba(15, 23, 42, 0.5)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên nhóm, thành phố hoặc dòng xe (VF8, VF9, Hà Nội...)"
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                background: 'rgba(2, 6, 23, 0.7)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00f2fe, #0284c7)',
                border: 'none',
                color: '#050914',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Content Area */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {selectedGroup ? (
            /* Selected Group Join Form */
            <form onSubmit={handleSubmitRequest}>
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                }}
              >
                ← Quay lại danh sách nhóm
              </button>

              <div
                style={{
                  background: 'rgba(2, 6, 23, 0.6)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                  padding: '20px',
                  marginBottom: '20px',
                }}
              >
                <h3 style={{ margin: '0 0 8px 0', color: '#00f2fe' }}>{selectedGroup.groupName}</h3>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                  <div>🚗 Dòng xe: <strong style={{ color: '#fff' }}>{selectedGroup.vehicleModel}</strong> ({selectedGroup.vehiclePlateNumber})</div>
                  <div>📍 Khu vực: <strong style={{ color: '#fff' }}>{selectedGroup.city || 'Toàn quốc'}</strong></div>
                  <div>👥 Thành viên hiện tại: <strong style={{ color: '#fff' }}>{selectedGroup.totalMembers} / {selectedGroup.maxMembers}</strong></div>
                  <div>👤 Đại diện nhóm: <strong style={{ color: '#fff' }}>{selectedGroup.representativeName}</strong></div>
                  {selectedGroup.description && <div style={{ marginTop: '6px' }}>📝 {selectedGroup.description}</div>}
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    fontSize: '13px',
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                    Tỷ lệ cổ phần đề xuất (%) *
                  </label>
                  <input
                    type="number"
                    value={proposedShare}
                    onChange={(e) => setProposedShare(Number(e.target.value))}
                    min={1}
                    max={100}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(2, 6, 23, 0.7)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                    Số tiền góp vốn dự kiến (VNĐ) *
                  </label>
                  <input
                    type="number"
                    value={proposedAmount}
                    onChange={(e) => setProposedAmount(Number(e.target.value))}
                    min={0}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(2, 6, 23, 0.7)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                    Số điện thoại liên hệ *
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(2, 6, 23, 0.7)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      color: '#fff',
                      outline: 'none',
                    }}
                    placeholder="0912345678"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                    Số giấy phép lái xe
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(2, 6, 23, 0.7)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      color: '#fff',
                      outline: 'none',
                    }}
                    placeholder="GPLX Hạng B1/B2"
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                    Lời nhắn gửi đại diện nhóm
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(2, 6, 23, 0.7)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      color: '#fff',
                      outline: 'none',
                      resize: 'none',
                    }}
                    placeholder="Giới thiệu kinh nghiệm lái xe và nhu cầu di chuyển của bạn..."
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedGroup(null)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #00f2fe, #0284c7)',
                    border: 'none',
                    color: '#050914',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)',
                  }}
                >
                  {submitting ? 'Đang gửi...' : '📤 Gửi yêu cầu gia nhập'}
                </button>
              </div>
            </form>
          ) : (
            /* Group List */
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Đang tải danh sách nhóm...
                </div>
              ) : groups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Không tìm thấy nhóm đồng sở hữu nào phù hợp.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {groups.map((group) => (
                    <div
                      key={group.groupId}
                      style={{
                        background: 'rgba(2, 6, 23, 0.65)',
                        border: '1px solid rgba(0, 242, 254, 0.2)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'transform 0.2s, border-color 0.2s',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '15px' }}>{group.groupName}</h4>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#10b981',
                              fontWeight: 600,
                            }}
                          >
                            Mở tuyển
                          </span>
                        </div>

                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', lineHeight: 1.5 }}>
                          <div>🚘 {group.vehicleModel} ({group.vehiclePlateNumber})</div>
                          <div>📍 {group.city || 'Toàn quốc'}</div>
                          <div>👥 Thành viên: {group.totalMembers}/{group.maxMembers}</div>
                          <div>💰 Cổ phần: {group.minSharePercentage}% - {group.maxSharePercentage}%</div>
                        </div>
                      </div>

                      <div style={{ marginTop: '16px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedGroup(group)}
                          style={{
                            width: '100%',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: 'rgba(0, 242, 254, 0.15)',
                            border: '1px solid rgba(0, 242, 254, 0.4)',
                            color: '#00f2fe',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Xem chi tiết & Gia nhập
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

