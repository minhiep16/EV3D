import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Coins,
  Zap,
  Users,
  Car,
  Search,
  Key,
  ChevronRight,
  Headphones,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { onboardingApi } from '../../services/onboardingApi';
import { OnboardingStatusResponse, VehicleRegistrationDraftResponse } from '../../types/onboarding';
import { OnboardingWorkspaceMode } from '../../scenes/OnboardingScene';
import { NewVehicleWizardModal } from './NewVehicleWizardModal';
import { JoinGroupModal } from './JoinGroupModal';
import { InviteCodeModal } from './InviteCodeModal';
import { MyInvitationsModal } from './MyInvitationsModal';

type OnboardingModal = 'NONE' | 'WIZARD' | 'JOIN_GROUP' | 'INVITE_CODE' | 'MY_INVITATIONS';

interface OnboardingOverlayProps {
  workspaceMode?: OnboardingWorkspaceMode;
  setWorkspaceMode?: (mode: OnboardingWorkspaceMode) => void;
  previewColor?: string;
  onColorChange?: (colorHex: string) => void;
  selectedModel?: string;
  onModelChange?: (modelName: string) => void;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
  workspaceMode,
  setWorkspaceMode,
  previewColor,
  onColorChange,
  selectedModel,
  onModelChange,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);
  const [drafts, setDrafts] = useState<VehicleRegistrationDraftResponse[]>([]);
  const [, setLoading] = useState(true);

  // Single authoritative workflow modal state
  const [activeModal, setActiveModal] = useState<OnboardingModal>('NONE');
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>(undefined);

  const setMode = (mode: OnboardingWorkspaceMode) => {
    if (setWorkspaceMode) {
      setWorkspaceMode(mode);
    }
    setActiveModal(mode === 'LANDING' ? 'NONE' : (mode as OnboardingModal));
  };

  const effectiveModal: OnboardingModal =
    workspaceMode && workspaceMode !== 'LANDING'
      ? (workspaceMode as OnboardingModal)
      : activeModal;

  const isInvitationsOpen = effectiveModal === 'MY_INVITATIONS';
  const isLanding =
    (!workspaceMode || workspaceMode === 'LANDING' || workspaceMode === 'MY_INVITATIONS') &&
    (effectiveModal === 'NONE' || effectiveModal === 'MY_INVITATIONS');

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

  const handleOpenWizard = (draftId?: string) => {
    setActiveDraftId(draftId);
    setMode('WIZARD');
  };

  const handleSuccess = () => {
    loadOnboardingData();
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
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#24374c',
        overflow: 'hidden',
      }}
    >
      {/* 1. TOP NAVIGATION BAR (LANDING MODE ONLY) */}
      {isLanding && (
        <header
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 40px',
            background: 'linear-gradient(180deg, rgba(234, 247, 255, 0.96) 0%, rgba(234, 247, 255, 0) 100%)',
          }}
        >
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00c9d8 0%, #009e9d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0, 201, 216, 0.35)',
                fontWeight: 900,
                color: '#ffffff',
                fontSize: '17px',
                letterSpacing: '0.5px',
              }}
            >
              EV
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.8px', color: '#1e293b' }}>
                EVSHARE <span style={{ color: '#009e9d' }}>3D</span>
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#60748c',
                  letterSpacing: '0.8px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                NỀN TẢNG ĐỒNG SỞ HỮU XE ĐIỆN THÔNG MINH
              </div>
            </div>
          </div>

          {/* User Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {status && status.vehicleCount > 0 && (
              <button
                onClick={() => navigate('/garage')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  background: 'rgba(0, 201, 216, 0.12)',
                  border: '1.2px solid #00c9d8',
                  color: '#009e9d',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
              >
                🚗 Vào Garage ({status.vehicleCount} xe)
              </button>
            )}

            {/* Invitations Pill */}
            <button
              onClick={() => setMode('MY_INVITATIONS')}
              style={{
                position: 'relative',
                padding: '7px 16px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(0, 201, 216, 0.35)',
                boxShadow: '0 2px 10px rgba(0, 180, 200, 0.08)',
                color: '#24374c',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s',
              }}
            >
              <span>📩 Lời mời & Yêu cầu</span>
              {status && status.pendingInvitationsCount > 0 ? (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 8px #ef4444',
                  }}
                />
              ) : (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ef4444',
                  }}
                />
              )}
            </button>

            {/* User Profile Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 14px 5px 6px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(0, 201, 216, 0.35)',
                boxShadow: '0 2px 10px rgba(0, 180, 200, 0.08)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}
              >
                {user?.fullName?.charAt(0) || 'N'}
              </div>
              <span style={{ fontSize: '12px', color: '#24374c', fontWeight: 600 }}>
                {user?.fullName || 'Nguyen Minh Hiep'}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '9999px',
                padding: '6px 14px',
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Đăng xuất
            </button>
          </div>
        </header>
      )}

      {/* 2. MAIN VIEWPORT AREA: LEFT WELCOME + RIGHT GLASS PANEL (LANDING ONLY) */}
      {isLanding && (
        <main
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 44px',
            pointerEvents: 'none',
            minHeight: 0,
          }}
        >
          {/* LEFT COLUMN: WELCOME & VALUE PROPOSITIONS */}
          <section
            style={{
              pointerEvents: 'auto',
              width: '390px',
              maxWidth: 'min(390px, 90vw)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(240, 248, 255, 0.58) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '1.5px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 10px 32px rgba(0, 180, 200, 0.08), 0 2px 10px rgba(0, 0, 0, 0.02)',
              padding: '28px 24px',
            }}
          >
            {/* Welcome Eyebrow Pill */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.96)',
                  border: '1.5px solid rgba(0, 201, 216, 0.55)',
                  boxShadow: '0 2px 10px rgba(0, 180, 200, 0.14)',
                  color: '#007d85',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                }}
              >
                <Sparkles size={12} color="#009e9d" />
                <span>Chào mừng đến với EVShare 3D</span>
              </div>
            </div>

            {/* Large Hero Heading */}
            <div>
              <h1
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '34px',
                  fontWeight: 900,
                  lineHeight: 1.18,
                  letterSpacing: '-0.5px',
                  color: '#0f172a',
                }}
              >
                Bắt đầu hành trình
                <br />
                <span style={{ color: '#008a90' }}>đồng sở hữu xe điện</span>
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  color: '#40566F',
                  lineHeight: 1.55,
                  fontWeight: 500,
                }}
              >
                Chia sẻ chi phí, quản lý minh bạch và cùng vận hành hiệu quả.
              </p>
            </div>

            {/* Four Value Proposition Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
              {/* Value 1: Tiết kiệm chi phí */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.96)',
                    border: '1.5px solid rgba(0, 201, 216, 0.45)',
                    boxShadow: '0 2px 8px rgba(0, 201, 216, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Coins size={17} color="#009e9d" />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                    Tiết kiệm chi phí
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 500, color: '#40566F', marginTop: '2px', lineHeight: 1.4 }}>
                    Chia sẻ chi phí sở hữu và vận hành
                  </div>
                </div>
              </div>

              {/* Value 2: Quản lý minh bạch */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.96)',
                    border: '1.5px solid rgba(0, 201, 216, 0.45)',
                    boxShadow: '0 2px 8px rgba(0, 201, 216, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={17} color="#009e9d" />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                    Quản lý minh bạch
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 500, color: '#40566F', marginTop: '2px', lineHeight: 1.4 }}>
                    Chi tiêu, lịch sử và quyền lợi rõ ràng
                  </div>
                </div>
              </div>

              {/* Value 3: Vận hành hiệu quả */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.96)',
                    border: '1.5px solid rgba(0, 201, 216, 0.45)',
                    boxShadow: '0 2px 8px rgba(0, 201, 216, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Zap size={17} color="#009e9d" />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                    Vận hành hiệu quả
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 500, color: '#40566F', marginTop: '2px', lineHeight: 1.4 }}>
                    Đặt xe, sạc, bảo dưỡng dễ dàng
                  </div>
                </div>
              </div>

              {/* Value 4: Cộng đồng chủ xe */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.96)',
                    border: '1.5px solid rgba(0, 201, 216, 0.45)',
                    boxShadow: '0 2px 8px rgba(0, 201, 216, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Users size={17} color="#009e9d" />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                    Cộng đồng chủ xe
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 500, color: '#40566F', marginTop: '2px', lineHeight: 1.4 }}>
                    Kết nối, hợp tác và cùng phát triển
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: PREMIUM TRANSLUCENT FROSTED GLASS PANEL */}
          {!isInvitationsOpen && (
            <section
              style={{
                pointerEvents: 'auto',
                width: '490px',
                maxWidth: 'min(490px, 92vw)',
                maxHeight: 'calc(100vh - 140px)',
                overflowY: 'auto',
                background: 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(255, 255, 255, 0.9)',
              borderRadius: '24px',
              boxShadow:
                '0 20px 50px rgba(0, 160, 190, 0.12), 0 4px 20px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Panel Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px' }}>🍃</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    color: '#009e9d',
                    textTransform: 'uppercase',
                  }}
                >
                  EVSHARE 3D ONBOARDING
                </span>
              </div>
              <h2
                style={{
                  margin: '0 0 6px 0',
                  fontSize: '24px',
                  fontWeight: 900,
                  letterSpacing: '-0.3px',
                  color: '#1e293b',
                }}
              >
                Bắt đầu đồng sở hữu
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#60748c', lineHeight: 1.5 }}>
                Chọn cách bắt đầu hành trình cùng EVShare 3D.
              </p>
            </div>

            {/* CARD 1: THÊM XE MỚI */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.88)',
                borderRadius: '16px',
                border: '1px solid rgba(0, 201, 216, 0.25)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 4px 16px rgba(0, 180, 200, 0.08)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '11px',
                    background: 'rgba(0, 201, 216, 0.12)',
                    border: '1px solid rgba(0, 201, 216, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#009e9d',
                    flexShrink: 0,
                    boxShadow: '0 2px 10px rgba(0, 201, 216, 0.15)',
                  }}
                >
                  <Car size={20} color="#009e9d" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                    Thêm xe mới
                  </div>
                  <div style={{ fontSize: '12px', color: '#60748c', marginTop: '2px', lineHeight: 1.4 }}>
                    Đăng ký xe và thành lập nhóm đồng sở hữu của bạn.
                  </div>
                </div>
              </div>

              {/* Draft Resume Indicator */}
              {drafts.length > 0 && (
                <div
                  onClick={() => handleOpenWizard(drafts[0].id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#b45309',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  <span>📝 Bản nháp: {drafts[0].plateNumber || 'Chưa đặt tên'}</span>
                  <span style={{ fontWeight: 700 }}>Tiếp tục →</span>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                onClick={() => handleOpenWizard()}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg, #00c9d8 0%, #009e9d 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 180, 190, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <span>+ Bắt đầu đăng ký xe</span>
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>

            {/* CARD 2: THAM GIA NHÓM CÓ SẴN */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.88)',
                borderRadius: '16px',
                border: '1px solid rgba(0, 201, 216, 0.25)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 4px 16px rgba(0, 180, 200, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '11px',
                    background: 'rgba(0, 201, 216, 0.12)',
                    border: '1px solid rgba(0, 201, 216, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#009e9d',
                    flexShrink: 0,
                    boxShadow: '0 2px 10px rgba(0, 201, 216, 0.15)',
                  }}
                >
                  <Users size={20} color="#009e9d" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                    Tham gia nhóm có sẵn
                  </div>
                  <div style={{ fontSize: '12px', color: '#60748c', marginTop: '2px', lineHeight: 1.4 }}>
                    Khám phá các nhóm đang tuyển thành viên hoặc nhập mã mời.
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => setMode('JOIN_GROUP')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1.5px solid #00c9d8',
                    color: '#009e9d',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(0, 201, 216, 0.12)',
                  }}
                >
                  <Search size={14} color="#009e9d" />
                  <span>Khám phá nhóm</span>
                </button>

                <button
                  onClick={() => setMode('INVITE_CODE')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(96, 116, 140, 0.35)',
                    color: '#24374c',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <Key size={14} color="#f59e0b" />
                  <span>Nhập mã mời</span>
                </button>
              </div>
            </div>
          </section>
          )}
        </main>
      )}

      {/* 3. CINEMATIC FOREGROUND LEAVES (BOTTOM-LEFT FRAMING - LANDING ONLY) */}
      {isLanding && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 5,
            opacity: 0.85,
          }}
        >
          <svg width="240" height="180" viewBox="0 0 240 180" fill="none">
            {/* Vibrant tropical leaf silhouettes for depth framing matching light showroom floor */}
            <path
              d="M-40 220C-10 160 30 110 80 80C60 110 40 150 10 210Z"
              fill="url(#leafGrad1)"
            />
            <path
              d="M-20 200C20 140 70 95 130 65C100 100 70 145 30 200Z"
              fill="url(#leafGrad2)"
            />
            <path
              d="M10 210C60 160 110 120 170 90C140 125 105 165 60 210Z"
              fill="url(#leafGrad1)"
            />
            <defs>
              <linearGradient id="leafGrad1" x1="0" y1="80" x2="100" y2="220" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10b981" stopOpacity="0.85" />
                <stop offset="1" stopColor="#047857" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="leafGrad2" x1="20" y1="65" x2="130" y2="200" gradientUnits="userSpaceOnUse">
                <stop stopColor="#34d399" stopOpacity="0.9" />
                <stop offset="1" stopColor="#059669" stopOpacity="0.95" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* 4. BOTTOM BRANDING & SUPPORT FOOTER (LANDING MODE ONLY) */}
      {isLanding && (
        <footer
          style={{
            pointerEvents: 'auto',
            padding: '14px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#60748c',
            background: 'linear-gradient(0deg, rgba(234, 247, 255, 0.96) 0%, rgba(234, 247, 255, 0) 100%)',
            zIndex: 10,
          }}
        >
          <div>EVShare 3D System v25.0 — Multi-Vehicle Co-Ownership Platform</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#60748c' }}>
              <Headphones size={13} color="#009e9d" />
              <span>Hỗ trợ: 1900-EVSHARE</span>
            </span>

            {/* Quick Demo Helper Pill matching reference image */}

          </div>
        </footer>
      )}

      {/* 5. MODALS COORDINATED WITH SINGLE AUTHORITATIVE STATE */}
      <NewVehicleWizardModal
        isOpen={effectiveModal === 'WIZARD'}
        onClose={() => setMode('LANDING')}
        onSuccess={handleSuccess}
        initialDraftId={activeDraftId}
        selectedColor={previewColor}
        onColorChange={onColorChange}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
      />

      <JoinGroupModal
        isOpen={effectiveModal === 'JOIN_GROUP'}
        onClose={() => setMode('LANDING')}
        onSuccess={handleSuccess}
        onOpenInviteCode={() => setMode('INVITE_CODE')}
        onOpenCreateVehicle={() => handleOpenWizard()}
      />

      <InviteCodeModal
        isOpen={effectiveModal === 'INVITE_CODE'}
        onClose={() => setMode('LANDING')}
        onSuccess={handleSuccess}
      />

      <MyInvitationsModal
        isOpen={effectiveModal === 'MY_INVITATIONS'}
        onClose={() => setMode('LANDING')}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
