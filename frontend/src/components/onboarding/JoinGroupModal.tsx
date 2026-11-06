import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Users,
  Car,
  MapPin,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  X,
  ArrowLeft,
  Key,
  CheckCircle2,
  Sparkles,
  Send,
} from 'lucide-react';
import { DiscoverableGroupResponse, CreateJoinRequestDto } from '../../types/onboarding';
import { onboardingApi } from '../../services/onboardingApi';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenInviteCode?: () => void;
  onOpenCreateVehicle?: () => void;
}

const CITY_FILTERS = ['Tất cả', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'];

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenInviteCode,
  onOpenCreateVehicle,
}) => {
  const [groups, setGroups] = useState<DiscoverableGroupResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Tất cả');
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DiscoverableGroupResponse | null>(null);

  // Form fields for join request
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
    setError(null);
    try {
      const data = await onboardingApi.getDiscoverableGroups(search);
      setGroups(data || []);
    } catch (err: any) {
      console.error('Failed to load discoverable groups:', err);
      setError(err?.message || 'Không thể tải danh sách nhóm đồng sở hữu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadGroups(searchTerm.trim() || undefined);
  };

  const handleSelectGroup = (group: DiscoverableGroupResponse) => {
    setSelectedGroup(group);
    const availableShare = group.availableSharePercentage || 25;
    setProposedShare(Math.min(25, availableShare));
    const vehicleVal = group.vehicleValue || 1200000000;
    setProposedAmount(Math.round((vehicleVal * Math.min(25, availableShare)) / 100));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    if (!phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại liên hệ.');
      return;
    }
    if (proposedShare <= 0 || proposedShare > (selectedGroup.availableSharePercentage || 100)) {
      setError(`Tỷ lệ cổ phần đề xuất không hợp lệ (Tối đa ${selectedGroup.availableSharePercentage}%).`);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload: CreateJoinRequestDto = {
        proposedSharePercentage: proposedShare,
        proposedContributionAmount: proposedAmount,
        phoneNumber: phoneNumber.trim(),
        drivingLicenseNumber: licenseNumber.trim(),
        message: message.trim(),
      };
      await onboardingApi.submitJoinRequest(selectedGroup.groupId, payload);
      alert('Đã gửi yêu cầu tham gia nhóm thành công! Đại diện nhóm sẽ xem xét và phản hồi.');
      setSelectedGroup(null);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi gửi yêu cầu tham gia.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter groups by city if selected
  const filteredGroups = groups.filter((g) => {
    if (selectedCity === 'Tất cả') return true;
    return g.registrationCity?.toLowerCase().includes(selectedCity.toLowerCase());
  });

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-discovery-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 900,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'transparent',
        pointerEvents: 'none',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* LEFT 42% REGION: 3D VEHICLE METADATA OVERLAY (3D SCENE UNDERNEATH IS INTERACTIVE) */}
      <div
        style={{
          flex: '1 1 auto',
          position: 'relative',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 32px',
        }}
      >
        {/* Top Floating Badge */}
        <div style={{ pointerEvents: 'auto', alignSelf: 'flex-start' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 16px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1.2px solid rgba(0, 201, 216, 0.45)',
              boxShadow: '0 4px 16px rgba(0, 180, 200, 0.15)',
            }}
          >
            <Sparkles size={14} color="#009e9d" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#009e9d', letterSpacing: '0.5px' }}>
              NHÓM ĐỒNG SỞ HỮU MỞ
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>•</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
              {selectedGroup ? selectedGroup.vehicleModel : 'Showroom Garage'}
            </span>
          </div>
        </div>

        {/* Bottom Floating Metadata Card */}
        <div style={{ pointerEvents: 'auto', alignSelf: 'flex-start' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(20px)',
              border: '1.2px solid rgba(0, 201, 216, 0.35)',
              borderRadius: '16px',
              padding: '14px 18px',
              boxShadow: '0 10px 25px rgba(0, 160, 190, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '270px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#009e9d', textTransform: 'uppercase' }}>
                {selectedGroup ? 'XE CỦA NHÓM ĐÃ CHỌN' : 'KHÁM PHÁ NHÓM CÓ SẴN'}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#009e9d',
                  background: 'rgba(0, 201, 216, 0.12)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {selectedGroup ? 'Đang ứng tuyển' : `${filteredGroups.length} nhóm`}
              </span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e293b' }}>
              {selectedGroup ? selectedGroup.groupName : 'Chọn một nhóm để xem chi tiết'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#60748c', display: 'flex', gap: '8px' }}>
              <span>Dòng xe: <strong>{selectedGroup ? selectedGroup.vehicleModel : 'EV SUV'}</strong></span>
              {selectedGroup?.registrationCity && (
                <>
                  <span>•</span>
                  <span>Khu vực: <strong>{selectedGroup.registrationCity}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT 58% REGION: FROSTED WHITE GLASS DISCOVERY WORKSPACE */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: 'clamp(540px, 58vw, 860px)',
          height: '100vh',
          maxHeight: '100vh',
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderLeft: '1.5px solid rgba(0, 201, 216, 0.45)',
          boxShadow: '-12px 0 45px rgba(0, 180, 200, 0.12), -2px 0 12px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
          color: '#24374c',
          overflow: 'hidden',
        }}
      >
        {/* WORKSPACE HEADER */}
        <div
          style={{
            flex: '0 0 auto',
            padding: '20px 32px 14px 32px',
            borderBottom: '1px solid rgba(0, 201, 216, 0.2)',
            background: 'rgba(240, 248, 255, 0.6)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px' }}>🌐</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#009e9d', letterSpacing: '1px' }}>
                  EVSHARE 3D DISCOVERY WORKSPACE
                </span>
              </div>
              <h1
                id="group-discovery-title"
                style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#1e293b' }}
              >
                KHÁM PHÁ NHÓM ĐỒNG SỞ HỮU
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#60748c' }}>
                Tìm nhóm xe điện phù hợp để bắt đầu hành trình đồng sở hữu minh bạch
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng workspace"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(0, 201, 216, 0.3)',
                color: '#60748c',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* SEARCH BAR & CITY FILTER PILLS */}
          {!selectedGroup && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '9999px',
                    background: '#ffffff',
                    border: '1.2px solid rgba(0, 201, 216, 0.4)',
                    boxShadow: '0 2px 8px rgba(0, 180, 200, 0.06)',
                  }}
                >
                  <Search size={15} color="#009e9d" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên nhóm, dòng xe, thành phố..."
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      fontSize: '13px',
                      color: '#1e293b',
                      background: 'transparent',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(90deg, #00c9d8 0%, #009e9d 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0, 180, 200, 0.25)',
                  }}
                >
                  Tìm kiếm
                </button>
              </form>

              {/* City filter chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
                <span style={{ fontSize: '11px', color: '#60748c', fontWeight: 600 }}>Khu vực:</span>
                {CITY_FILTERS.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background:
                        selectedCity === city ? '#009e9d' : 'rgba(255, 255, 255, 0.85)',
                      border:
                        selectedCity === city
                          ? '1px solid #009e9d'
                          : '1px solid rgba(148, 163, 184, 0.3)',
                      color: selectedCity === city ? '#ffffff' : '#475569',
                      fontSize: '11px',
                      fontWeight: selectedCity === city ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* WORKSPACE BODY */}
        <div
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            padding: '22px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#dc2626',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={15} color="#dc2626" />
              <span>{error}</span>
            </div>
          )}

          {/* VIEW A: INLINE JOIN REQUEST FORM FOR SELECTED GROUP */}
          {selectedGroup ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#009e9d',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={14} />
                <span>Quay lại danh sách nhóm</span>
              </button>

              {/* Group Overview Banner */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  border: '1.2px solid rgba(0, 201, 216, 0.35)',
                  boxShadow: '0 4px 16px rgba(0, 180, 200, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 800, color: '#1e293b' }}>
                      {selectedGroup.groupName}
                    </h3>
                    <div style={{ fontSize: '12.5px', color: '#60748c' }}>
                      Xe: <strong>{selectedGroup.vehicleModel}</strong> ({selectedGroup.plateNumber || 'Mới'})
                    </div>
                    <div style={{ fontSize: '12px', color: '#60748c', marginTop: '2px' }}>
                      Khu vực: {selectedGroup.registrationCity || 'Hà Nội'} • Đại diện: {selectedGroup.representativeName || 'Chủ xe'}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.12)',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    Còn trống {selectedGroup.availableSharePercentage}% cổ phần
                  </span>
                </div>
              </div>

              {/* Request Form */}
              <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Tỷ lệ cổ phần đề xuất (%) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={proposedShare}
                      onChange={(e) => {
                        const pct = Number(e.target.value);
                        setProposedShare(pct);
                        const vVal = selectedGroup.vehicleValue || 1200000000;
                        setProposedAmount(Math.round((vVal * pct) / 100));
                      }}
                      min="1"
                      max={selectedGroup.availableSharePercentage || 100}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: '#ffffff',
                        border: '1.2px solid rgba(0, 201, 216, 0.4)',
                        color: '#1e293b',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Số tiền góp vốn tương ứng (VNĐ)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${(proposedAmount / 1e6).toLocaleString()} triệu VNĐ`}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(241, 245, 249, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        color: '#1e293b',
                        fontSize: '13.5px',
                        fontWeight: 700,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Số điện thoại liên hệ <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="VD: 0901234567"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: '#ffffff',
                        border: '1.2px solid rgba(148, 163, 184, 0.4)',
                        color: '#1e293b',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                      Số giấy phép lái xe
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="VD: 012345678901"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: '#ffffff',
                        border: '1.2px solid rgba(148, 163, 184, 0.4)',
                        color: '#1e293b',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
                    Lời nhắn gửi người đại diện nhóm
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Giới thiệu bản thân, khu vực sinh sống, nhu cầu sử dụng xe..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1.2px solid rgba(148, 163, 184, 0.4)',
                      color: '#1e293b',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(90deg, #00c9d8 0%, #009e9d 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(0, 180, 200, 0.35)',
                    marginTop: '8px',
                  }}
                >
                  <Send size={15} />
                  <span>{submitting ? 'Đang gửi yêu cầu...' : 'GỬI YÊU CẦU GIA NHẬP NHÓM'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* VIEW B: DISCOVERABLE GROUPS CARDS LIST OR POLISHED EMPTY STATE */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#60748c' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Đang tìm kiếm các nhóm đồng sở hữu...</div>
                </div>
              ) : filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <div
                    key={group.groupId}
                    onClick={() => handleSelectGroup(group)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '16px 20px',
                      border: '1.2px solid rgba(0, 201, 216, 0.3)',
                      boxShadow: '0 2px 12px rgba(0, 180, 200, 0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00c9d8';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 201, 216, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                          {group.groupName}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            color: '#10b981',
                            background: 'rgba(16, 185, 129, 0.12)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          Đang tuyển
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#60748c', marginTop: '3px' }}>
                        Xe: <strong>{group.vehicleModel}</strong> • {group.registrationCity || 'Hà Nội'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#009e9d', fontWeight: 600, marginTop: '2px' }}>
                        Còn trống {group.availableSharePercentage}% cổ phần • Quỹ: {(group.monthlyFundContribution || 2000000).toLocaleString()} đ/tháng
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#009e9d', fontWeight: 700, fontSize: '12.5px' }}>
                      <span>Gia nhập</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                ))
              ) : (
                /* POLISHED TRUTHFUL EMPTY STATE */
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '36px 28px',
                    border: '1.2px solid rgba(0, 201, 216, 0.25)',
                    boxShadow: '0 4px 18px rgba(0, 180, 200, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '12px',
                    marginTop: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: 'rgba(0, 201, 216, 0.12)',
                      border: '1.5px solid rgba(0, 201, 216, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#009e9d',
                    }}
                  >
                    <Users size={28} />
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                      Không tìm thấy nhóm đồng sở hữu nào phù hợp
                    </h3>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#60748c', maxWidth: '380px', lineHeight: 1.5 }}>
                      Hiện tại chưa có nhóm nào đang mở tuyển thành viên tại khu vực này hoặc trùng khớp với từ khóa tìm kiếm của bạn.
                    </p>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      background: 'rgba(240, 248, 255, 0.7)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontSize: '11.5px',
                      color: '#475569',
                      textAlign: 'left',
                      lineHeight: 1.5,
                      marginTop: '4px',
                    }}
                  >
                    💡 <strong>Gợi ý:</strong> Bạn có thể mở rộng từ khóa tìm kiếm, nhập mã mời riêng từ người đại diện, hoặc đăng ký xe mới để tự thành lập nhóm của riêng mình.
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    {onOpenInviteCode && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenInviteCode();
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '9999px',
                          background: 'rgba(255, 255, 255, 0.95)',
                          border: '1.2px solid #00c9d8',
                          color: '#009e9d',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Key size={13} color="#f59e0b" />
                        <span>Nhập mã mời</span>
                      </button>
                    )}

                    {onOpenCreateVehicle && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCreateVehicle();
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '9999px',
                          background: 'linear-gradient(90deg, #00c9d8 0%, #009e9d 100%)',
                          border: 'none',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 10px rgba(0, 180, 200, 0.25)',
                        }}
                      >
                        <Car size={13} />
                        <span>+ Đăng ký xe mới</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
