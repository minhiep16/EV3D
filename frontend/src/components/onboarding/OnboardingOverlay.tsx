import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { onboardingApi } from '../../services/onboardingApi';
import { OnboardingStatusResponse, VehicleRegistrationDraftResponse } from '../../types/onboarding';
import { NewVehicleWizardModal } from './NewVehicleWizardModal';
import { JoinGroupModal } from './JoinGroupModal';
import { InviteCodeModal } from './InviteCodeModal';
import { MyInvitationsModal } from './MyInvitationsModal';

export const OnboardingOverlay: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);
  const [drafts, setDrafts] = useState<VehicleRegistrationDraftResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>(undefined);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [isInviteCodeOpen, setIsInviteCodeOpen] = useState(false);
  const [isMyInvitationsOpen, setIsMyInvitationsOpen] = useState(false);

  const loadOnboardingData = async () => {
    try {
      const [statusData, draftsData] = await Promise.all([
        onboardingApi.getStatus(),
        onboardingApi.getMyDrafts(),
      ]);
      setStatus(statusData);
      setDrafts(draftsData);
    } catch (err) {
      console.error('Failed to load onboarding status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOnboardingData();
  }, []);

  const handleOpenNewWizard = (draftId?: string) => {
    setActiveDraftId(draftId);
    setIsWizardOpen(true);
  };

  const handleSuccess = () => {
    loadOnboardingData();
    // If the user now has active vehicles, give option to go to garage
    setTimeout(() => {
      navigate('/garage');
    }, 1500);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        pointerEvents: 'none',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* TOP HEADER */}
      <header
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 36px',
          background: 'linear-gradient(180deg, rgba(5, 9, 20, 0.9) 0%, rgba(5, 9, 20, 0) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00f2fe, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0, 242, 254, 0.5)',
              fontWeight: 900,
              color: '#050914',
              fontSize: '18px',
            }}
          >
            EV
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '1px', color: '#fff' }}>
              EVSHARE <span style={{ color: '#00f2fe' }}>3D</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.5px' }}>
              NỀN TẢNG ĐỒNG SỞ HỮU XE ĐIỆN THÔNG MINH
            </div>
          </div>
        </div>

        {/* User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {status && status.vehicleCount > 0 && (
            <button
              onClick={() => navigate('/garage')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                background: 'rgba(0, 242, 254, 0.15)',
                border: '1px solid #00f2fe',
                color: '#00f2fe',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🚗 Vào Garage ({status.vehicleCount} xe)
            </button>
          )}

          <button
            onClick={() => setIsMyInvitationsOpen(true)}
            style={{
              position: 'relative',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📩 Lời mời & Yêu cầu
            {status && status.pendingInvitationsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                }}
              >
                {status.pendingInvitationsCount}
              </span>
            )}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              borderRadius: '24px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#0284c7',
                color: '#fff',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
              }}
            >
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 500 }}>
              {user?.fullName || 'Người dùng EVShare'}
            </span>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '8px 14px',
              color: '#f87171',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* CENTER HERO & CARDS */}
      <main
        style={{
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 40px',
          margin: 'auto 0',
        }}
      >
        {/* Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              margin: '0 0 10px 0',
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '1px',
              background: 'linear-gradient(135deg, #ffffff 30%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 25px rgba(56, 189, 248, 0.3)',
            }}
          >
            BẮT ĐẦU HÀNH TRÌNH ĐỒNG SỞ HỮU XE ĐIỆN
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '15px',
              color: '#94a3b8',
              maxWidth: '650px',
              lineHeight: 1.6,
            }}
          >
            Sở hữu và tối ưu hóa chi phí vận hành xe điện cùng cộng đồng EVShare 3D. Chọn một phương thức bắt đầu phù hợp với bạn:
          </p>
        </div>

        {/* DUAL PATH INTERACTIVE CARDS */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 420px))',
            gap: '28px',
            width: '100%',
            maxWidth: '900px',
            justifyContent: 'center',
          }}
        >
          {/* CARD A: THÊM XE MỚI */}
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(13, 26, 48, 0.88), rgba(7, 15, 30, 0.94))',
              borderRadius: '20px',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 242, 254, 0.15)',
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid #00f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginBottom: '20px',
                  color: '#00f2fe',
                }}
              >
                ⚡
              </div>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: 700, color: '#38bdf8' }}>
                THÊM XE MỚI
              </h2>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                Đăng ký một phương tiện mới, thiết lập nhóm đồng sở hữu của riêng bạn, mời các thành viên và tự động khởi tạo hợp đồng pháp lý điện tử.
              </p>

              {/* Draft badge if exists */}
              {drafts.length > 0 && (
                <div
                  onClick={() => handleOpenNewWizard(drafts[0].id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#fbbf24',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginBottom: '16px',
                  }}
                >
                  <span>📝 Bạn có bản nháp: {drafts[0].plateNumber || 'Chưa đặt tên'}</span>
                  <span style={{ fontWeight: 700 }}>Tiếp tục →</span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleOpenNewWizard()}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #00f2fe, #0284c7)',
                border: 'none',
                color: '#050914',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              + BẮT ĐẦU ĐĂNG KÝ XE
            </button>
          </div>

          {/* CARD B: THAM GIA NHÓM CÓ SẴN */}
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(13, 26, 48, 0.88), rgba(7, 15, 30, 0.94))',
              borderRadius: '20px',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.12)',
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid #38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginBottom: '20px',
                  color: '#38bdf8',
                }}
              >
                👥
              </div>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: 700, color: '#38bdf8' }}>
                THAM GIA NHÓM CÓ SẴN
              </h2>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                Tìm kiếm các nhóm đồng sở hữu xe điện đang mở nhận thành viên trong khu vực hoặc kích hoạt ngay nếu bạn đã có mã mời.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => setIsJoinGroupOpen(true)}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid rgba(0, 242, 254, 0.5)',
                  color: '#00f2fe',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                🔍 Khám phá các nhóm công khai
              </button>

              <button
                onClick={() => setIsInviteCodeOpen(true)}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#e2e8f0',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                🔑 Nhập mã mời đồng sở hữu
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        style={{
          pointerEvents: 'auto',
          padding: '16px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#64748b',
          background: 'linear-gradient(0deg, rgba(5, 9, 20, 0.9) 0%, rgba(5, 9, 20, 0) 100%)',
        }}
      >
        <div>EVShare 3D System v25.0 — Multi-Vehicle Co-Ownership Platform</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>Hỗ trợ: 1900-EVSHARE</span>
          <span>Bảo mật: 256-bit SSL</span>
        </div>
      </footer>

      {/* MODALS */}
      <NewVehicleWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleSuccess}
        initialDraftId={activeDraftId}
      />

      <JoinGroupModal
        isOpen={isJoinGroupOpen}
        onClose={() => setIsJoinGroupOpen(false)}
        onSuccess={handleSuccess}
      />

      <InviteCodeModal
        isOpen={isInviteCodeOpen}
        onClose={() => setIsInviteCodeOpen(false)}
        onSuccess={handleSuccess}
      />

      <MyInvitationsModal
        isOpen={isMyInvitationsOpen}
        onClose={() => setIsMyInvitationsOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

