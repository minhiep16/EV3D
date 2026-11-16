import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { onboardingApi } from '../../services/onboardingApi';
import { OnboardingStatusResponse, VehicleRegistrationDraftResponse } from '../../types/onboarding';
import { OnboardingWorkspaceMode } from '../../scenes/OnboardingScene';
import { NewVehicleWizardModal } from './NewVehicleWizardModal';
import { JoinGroupModal } from './JoinGroupModal';
import { InviteCodeModal } from './InviteCodeModal';
import { MyInvitationsModal } from './MyInvitationsModal';
import { StaffRegistrationReviewModal } from '../fleet/StaffRegistrationReviewModal';
import { NotificationBell } from '../common/NotificationBell';
import { useWorldStore } from '../../store/worldStore';

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
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();

  const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);
  const [drafts, setDrafts] = useState<VehicleRegistrationDraftResponse[]>([]);
  const [, setLoading] = useState(true);
  const [isEnteringGarage, setIsEnteringGarage] = useState(false);

  // Single authoritative workflow modal state
  const [activeModal, setActiveModal] = useState<OnboardingModal>('NONE');
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>(undefined);
  const [isStaffReviewOpen, setIsStaffReviewOpen] = useState<boolean>(false);

  // Safe draft deletion confirmation & feedback state
  const [draftPendingDelete, setDraftPendingDelete] =
    useState<VehicleRegistrationDraftResponse | null>(null);
  const [isDeletingDraft, setIsDeletingDraft] = useState<boolean>(false);
  const [hoveredDeleteDraftId, setHoveredDeleteDraftId] = useState<string | null>(
    null
  );
  const [draftFeedback, setDraftFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const isStaffOrAdmin = user?.role === 'STAFF' || user?.role === 'ADMIN';

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

  const reviewingInvitationId = useWorldStore((state) => state.reviewingInvitationId);
  const invitationPreviewVehicle = useWorldStore((state) => state.invitationPreviewVehicle);
  const selectVehicle = useWorldStore((state) => state.selectVehicle);
  const setInvitationPreviewVehicle = useWorldStore((state) => state.setInvitationPreviewVehicle);
  const setReviewingInvitationId = useWorldStore((state) => state.setReviewingInvitationId);
  const isReviewingInvitation = Boolean(reviewingInvitationId);

  const isInvitationsOpen = effectiveModal === 'MY_INVITATIONS';
  const isLanding =
    !isReviewingInvitation &&
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

      if (statusData.hasActiveGroup || (statusData.vehicleCount ?? 0) > 0) {
        if (statusData.joinedExteriorColor && onColorChange) {
          onColorChange(statusData.joinedExteriorColor);
        }
        if (statusData.joinedVehicleModel && onModelChange) {
          onModelChange(statusData.joinedVehicleModel);
        }
        if (statusData.joinedVehicleName || statusData.joinedVehicleModel) {
          setInvitationPreviewVehicle({
            id: statusData.joinedVehicleId,
            name: statusData.joinedVehicleName,
            code: 'EV01',
            model: statusData.joinedVehicleModel,
            licensePlate: statusData.joinedLicensePlate,
            exteriorColor: statusData.joinedExteriorColor,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load onboarding status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOnboardingData();
  }, []);

  // Real-time synchronization & conditional auto-detection while in onboarding
  useEffect(() => {
    if (status?.hasActiveGroup || (status?.vehicleCount ?? 0) > 0) return;

    const intervalId = window.setInterval(async () => {
      try {
        const nextStatus = await onboardingApi.getStatus();
        if (nextStatus.hasActiveGroup || (nextStatus.vehicleCount ?? 0) > 0) {
          setStatus(nextStatus);
          if (nextStatus.joinedExteriorColor && onColorChange) {
            onColorChange(nextStatus.joinedExteriorColor);
          }
          if (nextStatus.joinedVehicleModel && onModelChange) {
            onModelChange(nextStatus.joinedVehicleModel);
          }
          if (nextStatus.joinedVehicleName || nextStatus.joinedVehicleModel) {
            setInvitationPreviewVehicle({
              id: nextStatus.joinedVehicleId,
              name: nextStatus.joinedVehicleName,
              code: 'EV01',
              model: nextStatus.joinedVehicleModel,
              licensePlate: nextStatus.joinedLicensePlate,
              exteriorColor: nextStatus.joinedExteriorColor,
            });
          }
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          queryClient.invalidateQueries({ queryKey: ['coOwnership'] });
          queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
        }
      } catch {
        // Silently ignore transient network polling errors
      }
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [status?.hasActiveGroup, status?.vehicleCount, onColorChange, onModelChange, setInvitationPreviewVehicle, queryClient]);

  useEffect(() => {
    if (!draftFeedback) return;
    const timer = window.setTimeout(() => {
      setDraftFeedback(null);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [draftFeedback]);

  const handleConfirmDeleteDraft = async () => {
    if (!draftPendingDelete || isDeletingDraft) return;
    const targetDraft = draftPendingDelete;
    setIsDeletingDraft(true);
    setDraftFeedback(null);

    try {
      await onboardingApi.deleteDraft(targetDraft.id);
      setDrafts((prev) => prev.filter((item) => item.id !== targetDraft.id));
      if (activeDraftId === targetDraft.id) {
        setActiveDraftId(undefined);
      }
      setDraftPendingDelete(null);
      setDraftFeedback({
        type: 'success',
        message: 'Đã xóa bản nháp thành công.',
      });
      await loadOnboardingData();
    } catch (err: any) {
      const rawMessage = err?.message || '';
      const alreadyDeleted =
        err?.status === 404 ||
        rawMessage.includes('không tồn tại') ||
        rawMessage.includes('đã được xóa');

      if (alreadyDeleted) {
        // Case E: Draft was already deleted — handle gracefully without crashing
        setDrafts((prev) => prev.filter((item) => item.id !== targetDraft.id));
        if (activeDraftId === targetDraft.id) {
          setActiveDraftId(undefined);
        }
        setDraftPendingDelete(null);
        setDraftFeedback({
          type: 'success',
          message: 'Đã xóa bản nháp thành công.',
        });
        await loadOnboardingData();
      } else {
        setDraftPendingDelete(null);
        setDraftFeedback({
          type: 'error',
          message:
            rawMessage ||
            'Không thể xóa bản nháp lúc này. Vui lòng thử lại.',
        });
        await loadOnboardingData();
      }
    } finally {
      setIsDeletingDraft(false);
    }
  };

  const handleOpenWizard = (draftId?: string) => {
    setActiveDraftId(draftId);
    setMode('WIZARD');
  };

  const handleWizardSuccess = () => {
    loadOnboardingData();
  };

  const handleEnterGarage = async () => {
    setIsEnteringGarage(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['coOwnership'] }),
        queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] }),
      ]);
      const targetVehicleId = status?.joinedVehicleId || status?.activeVehicles?.[0]?.id;
      if (targetVehicleId) {
        selectVehicle(targetVehicleId);
      }
      setInvitationPreviewVehicle(null);
      setReviewingInvitationId(null);
      navigate('/garage');
    } catch {
      navigate('/garage');
    } finally {
      setIsEnteringGarage(false);
    }
  };

  const handleSuccess = async () => {
    try {
      const [statusData, draftsData] = await Promise.all([
        onboardingApi.getStatus(),
        onboardingApi.getMyDrafts(),
      ]);
      setStatus(statusData);
      setDrafts(draftsData);
      if (statusData.hasActiveGroup || statusData.vehicleCount > 0) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
          queryClient.invalidateQueries({ queryKey: ['coOwnership'] }),
          queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] }),
        ]);
        const targetVehicleId = statusData.joinedVehicleId || statusData.activeVehicles?.[0]?.id;
        if (targetVehicleId) {
          selectVehicle(targetVehicleId);
        }
        setInvitationPreviewVehicle(null);
        setReviewingInvitationId(null);
        setTimeout(() => {
          navigate('/garage');
        }, 800);
      }
    } catch {
      loadOnboardingData();
    }
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
            {isStaffOrAdmin && (
              <button
                onClick={() => setIsStaffReviewOpen(true)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1.2px solid #10b981',
                  color: '#047857',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
              >
                📋 Duyệt hồ sơ đăng ký xe (Admin / Staff)
              </button>
            )}

            {status && (status.hasActiveGroup || status.vehicleCount > 0) && (
              <button
                onClick={handleEnterGarage}
                disabled={isEnteringGarage}
                style={{
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, rgba(0, 201, 216, 0.18) 0%, rgba(0, 158, 157, 0.18) 100%)',
                  border: '1.2px solid #00c9d8',
                  color: '#009e9d',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: isEnteringGarage ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 10px rgba(0, 201, 216, 0.2)',
                  opacity: isEnteringGarage ? 0.8 : 1,
                }}
              >
                🚗 {isEnteringGarage ? 'Đang kết nối...' : `Vào Garage (${status.vehicleCount || 1} xe)`}
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

            {/* Real-time Notifications Bell */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <NotificationBell />
            </div>

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

      {/* 2b. DEDICATED INVITATION REVIEW STATE: LEFT VEHICLE IDENTITY PILL */}
      {isReviewingInvitation && (
        <aside
          role="complementary"
          aria-label="Thông tin phương tiện được mời"
          style={{
            position: 'fixed',
            top: '84px',
            left: '32px',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '20px',
            border: '1.2px solid rgba(0, 201, 216, 0.4)',
            boxShadow: '0 12px 36px rgba(0, 180, 200, 0.12), 0 2px 10px rgba(0, 0, 0, 0.03)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            zIndex: 40,
            pointerEvents: 'auto',
            animation: 'slideInLeft 0.22s ease-out',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(0, 201, 216, 0.12)',
              border: '1.2px solid rgba(0, 201, 216, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#009e9d',
              boxShadow: '0 2px 10px rgba(0, 201, 216, 0.15)',
              flexShrink: 0,
            }}
          >
            <Car size={22} />
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#009e9d',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              PHƯƠNG TIỆN ĐƯỢC MỜI
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 900,
                color: '#0f172a',
                marginTop: '1px',
                letterSpacing: '-0.01em',
              }}
            >
              {invitationPreviewVehicle?.name || invitationPreviewVehicle?.model || 'VinFast VF8 Plus'}
            </div>
            <div
              style={{
                fontSize: '11.5px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '2px',
              }}
            >
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  background: 'rgba(0, 201, 216, 0.14)',
                  color: '#009e9d',
                  fontWeight: 800,
                  fontSize: '10.5px',
                }}
              >
                {invitationPreviewVehicle?.code || 'EV01'}
              </span>
              <span>•</span>
              <span>
                Biển số: <strong style={{ color: '#0284c7' }}>{invitationPreviewVehicle?.licensePlate || '30A-888.88'}</strong>
              </span>
            </div>
          </div>
        </aside>
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
            status && (status.hasActiveGroup || status.vehicleCount > 0) ? (
              <section
                style={{
                  pointerEvents: 'auto',
                  width: '510px',
                  maxWidth: 'min(510px, 92vw)',
                  maxHeight: 'calc(100vh - 130px)',
                  overflowY: 'auto',
                  background: 'rgba(255, 255, 255, 0.78)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1.5px solid rgba(255, 255, 255, 0.95)',
                  borderRadius: '24px',
                  boxShadow:
                    '0 20px 50px rgba(0, 160, 190, 0.14), 0 4px 20px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                {/* 1. Header with Celebration Pill */}
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      color: '#047857',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                    }}
                  >
                    <CheckCircle2 size={13} color="#10b981" />
                    <span>KẾT NẠP THÀNH VIÊN HOÀN TẤT</span>
                  </div>
                  <h2
                    style={{
                      margin: '10px 0 6px 0',
                      fontSize: '26px',
                      fontWeight: 900,
                      letterSpacing: '-0.3px',
                      color: '#0f172a',
                    }}
                  >
                    CHÀO MỪNG THÀNH VIÊN MỚI!
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>
                    Hợp đồng đồng sở hữu phương tiện đã hoàn tất ký số giữa các thành viên. Bạn đã chính thức là đồng sở hữu hợp pháp của chiếc xe này.
                  </p>
                </div>

                {/* 2. Dedicated Vehicle & Co-Ownership Details Card */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    borderRadius: '18px',
                    border: '1.5px solid rgba(0, 201, 216, 0.35)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: '0 8px 24px rgba(0, 180, 200, 0.10)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#009e9d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {status.groupName || 'NHÓM ĐỒNG SỞ HỮU'}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                        {status.joinedVehicleName || status.activeVehicles?.[0]?.name || 'VinFast VF8 - ECO 2024'}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        background: 'rgba(0, 201, 216, 0.14)',
                        border: '1px solid rgba(0, 201, 216, 0.4)',
                        color: '#009e9d',
                        fontWeight: 800,
                        fontSize: '12px',
                      }}
                    >
                      {status.joinedVehicleModel || status.activeVehicles?.[0]?.model || 'VF8'}
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Biển số xe</div>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0284c7', marginTop: '3px' }}>
                        {status.joinedLicensePlate || status.activeVehicles?.[0]?.licensePlate || '30A-888.88'}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Tỷ lệ sở hữu</div>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#10b981', marginTop: '3px' }}>
                        {status.ownershipPercentage != null ? `${status.ownershipPercentage}%` : '25.00%'}
                      </div>
                    </div>
                  </div>

                  {/* Contract Status Banner */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.28)',
                    }}
                  >
                    <ShieldCheck size={18} color="#10b981" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857' }}>
                      {status.contractStatus || 'Hợp đồng đã có hiệu lực (Hoàn tất ký số)'}
                      {status.contractVersionNumber ? ` • Phụ lục v${status.contractVersionNumber}` : ''}
                    </div>
                  </div>
                </div>

                {/* 3. Operational Privileges Guide */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1e293b' }}>
                    Đặc quyền đồng sở hữu trong Garage 3D:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12.5px', color: '#475569' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0, 201, 216, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle2 size={12} color="#009e9d" />
                      </div>
                      <span>Đặt lịch di chuyển thông minh & phân bổ khung giờ công bằng</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12.5px', color: '#475569' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0, 201, 216, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle2 size={12} color="#009e9d" />
                      </div>
                      <span>Giám sát sạc pin 3D, tình trạng sức khỏe pin và trạm sạc</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12.5px', color: '#475569' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0, 201, 216, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle2 size={12} color="#009e9d" />
                      </div>
                      <span>Quản lý chi phí minh bạch, quỹ nhóm và biểu quyết dân chủ</span>
                    </div>
                  </div>
                </div>

                {/* 4. Primary Button: VÀO GARAGE 3D */}
                <button
                  onClick={handleEnterGarage}
                  disabled={isEnteringGarage}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(90deg, #00c9d8 0%, #009e9d 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '14px',
                    letterSpacing: '0.5px',
                    cursor: isEnteringGarage ? 'wait' : 'pointer',
                    boxShadow: '0 6px 22px rgba(0, 180, 190, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s',
                    opacity: isEnteringGarage ? 0.8 : 1,
                  }}
                >
                  <Car size={18} />
                  <span>{isEnteringGarage ? 'ĐANG KẾT NỐI GARAGE 3D...' : 'VÀO GARAGE 3D'}</span>
                  <ChevronRight size={18} strokeWidth={3} />
                </button>
              </section>
            ) : (
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

              {/* Draft Deletion Success / Error Feedback Banner */}
              {draftFeedback && (
                <div
                  role="status"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background:
                      draftFeedback.type === 'success'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(239, 68, 68, 0.10)',
                    border:
                      draftFeedback.type === 'success'
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(239, 68, 68, 0.38)',
                    color:
                      draftFeedback.type === 'success' ? '#047857' : '#b91c1c',
                    fontSize: '11.5px',
                    fontWeight: 700,
                  }}
                >
                  {draftFeedback.type === 'success' ? (
                    <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                  ) : (
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1 }}>{draftFeedback.message}</span>
                </div>
              )}

              {/* Draft & Submitted Applications Status Indicator */}
              {drafts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {drafts.map((d) => {
                    const isPending = d.status === 'SUBMITTED' || d.status === 'UNDER_REVIEW';
                    const isChangesRequested = d.status === 'CHANGES_REQUESTED';
                    const isRejected = d.status === 'REJECTED';
                    const isApproved = d.status === 'APPROVED';
                    const isDraft = !d.status || d.status === 'DRAFT';
                    const isDeleteHovered = hoveredDeleteDraftId === d.id;
                    const displayVehicleTitle =
                      d.model || d.name || 'Xe điện EVShare';

                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          if (isApproved) {
                            navigate('/garage');
                          } else if (!isPending) {
                            handleOpenWizard(d.id);
                          }
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          background: isPending
                            ? 'rgba(245, 158, 11, 0.12)'
                            : isChangesRequested
                            ? 'rgba(59, 130, 246, 0.1)'
                            : isRejected
                            ? 'rgba(239, 68, 68, 0.08)'
                            : isApproved
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(245, 158, 11, 0.1)',
                          border: isPending
                            ? '1.2px solid rgba(245, 158, 11, 0.45)'
                            : isChangesRequested
                            ? '1.2px solid rgba(59, 130, 246, 0.4)'
                            : isRejected
                            ? '1.2px solid rgba(239, 68, 68, 0.35)'
                            : isApproved
                            ? '1.2px solid rgba(16, 185, 129, 0.4)'
                            : '1px solid rgba(245, 158, 11, 0.35)',
                          color: isPending
                            ? '#b45309'
                            : isChangesRequested
                            ? '#1d4ed8'
                            : isRejected
                            ? '#b91c1c'
                            : isApproved
                            ? '#047857'
                            : '#b45309',
                          fontSize: '11.5px',
                          cursor: isPending ? 'default' : 'pointer',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              minWidth: 0,
                              flex: '1 1 180px',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 800,
                                wordBreak: 'break-word',
                                lineHeight: 1.35,
                              }}
                            >
                              {isPending
                                ? `⏳ Chờ Quản trị viên (ADMIN) xét duyệt: ${displayVehicleTitle} (${d.plateNumber})`
                                : isChangesRequested
                                ? `⚠️ Cần bổ sung hồ sơ: ${displayVehicleTitle} (${d.plateNumber})`
                                : isRejected
                                ? `✕ Hồ sơ bị từ chối: ${displayVehicleTitle} (${d.plateNumber})`
                                : isApproved
                                ? `✓ Đã phê duyệt: ${displayVehicleTitle} (${d.plateNumber})`
                                : `📝 Bản nháp: ${displayVehicleTitle}${
                                    d.plateNumber ? ` (${d.plateNumber})` : ''
                                  }`}
                            </span>
                            {d.groupName && (
                              <div style={{ fontSize: '10.5px', opacity: 0.9 }}>
                                Nhóm: <strong>{d.groupName}</strong>
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                flexShrink: 0,
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.65)',
                              }}
                            >
                              {isPending
                                ? 'Đang thẩm định'
                                : isChangesRequested
                                ? 'Chỉnh sửa →'
                                : isRejected
                                ? 'Chỉnh sửa & Gửi lại →'
                                : isApproved
                                ? 'Vào Garage →'
                                : 'Tiếp tục →'}
                            </span>

                            {isDraft && (
                              <button
                                type="button"
                                aria-label={`Xóa bản nháp ${displayVehicleTitle}`}
                                title="Xóa bản nháp này"
                                disabled={isDeletingDraft}
                                onMouseEnter={() => setHoveredDeleteDraftId(d.id)}
                                onMouseLeave={() =>
                                  setHoveredDeleteDraftId((prev) =>
                                    prev === d.id ? null : prev
                                  )
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDraftFeedback(null);
                                  setDraftPendingDelete(d);
                                }}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '7px',
                                  background: isDeleteHovered
                                    ? 'rgba(239, 68, 68, 0.16)'
                                    : 'rgba(255, 255, 255, 0.72)',
                                  border: isDeleteHovered
                                    ? '1px solid rgba(239, 68, 68, 0.5)'
                                    : '1px solid rgba(217, 119, 6, 0.28)',
                                  color: isDeleteHovered ? '#dc2626' : '#9a3412',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: isDeletingDraft
                                    ? 'not-allowed'
                                    : 'pointer',
                                  padding: 0,
                                  flexShrink: 0,
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Trash2 size={13.5} />
                              </button>
                            )}
                          </div>
                        </div>

                        {(isChangesRequested || isRejected) && (d.reviewReason || d.adminReviewNotes) && (
                          <div
                            style={{
                              fontSize: '10.5px',
                              marginTop: '2px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.75)',
                              fontWeight: 600,
                            }}
                          >
                            Ý kiến Quản trị viên: {d.reviewReason || d.adminReviewNotes}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
            )
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
        onSuccess={handleWizardSuccess}
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

      {isStaffOrAdmin && (
        <StaffRegistrationReviewModal
          isOpen={isStaffReviewOpen}
          onClose={() => setIsStaffReviewOpen(false)}
          onReviewed={loadOnboardingData}
        />
      )}

      {/* 6. COMPACT DRAFT DELETION CONFIRMATION DIALOG */}
      {draftPendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-draft-dialog-title"
          onClick={() => {
            if (!isDeletingDraft) setDraftPendingDelete(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(15, 23, 42, 0.42)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            pointerEvents: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '400px',
              background: '#ffffff',
              borderRadius: '20px',
              border: '1.5px solid rgba(0, 201, 216, 0.3)',
              boxShadow:
                '0 24px 60px rgba(15, 23, 42, 0.22), 0 4px 16px rgba(0, 180, 200, 0.12)',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              color: '#1e293b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.10)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={18} />
              </div>
              <div>
                <h3
                  id="delete-draft-dialog-title"
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  Xóa bản nháp đăng ký xe?
                </h3>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#009e9d',
                    marginTop: '2px',
                  }}
                >
                  {draftPendingDelete.model ||
                    draftPendingDelete.name ||
                    'Xe điện EVShare'}
                  {draftPendingDelete.plateNumber
                    ? ` (${draftPendingDelete.plateNumber})`
                    : ''}
                </div>
              </div>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: 1.55,
                color: '#475569',
              }}
            >
              Bạn có chắc chắn muốn xóa bản nháp này? Thông tin chưa gửi sẽ
              không thể khôi phục.
            </p>

            {draftPendingDelete.groupName && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(241, 245, 249, 0.85)',
                  border: '1px solid rgba(203, 213, 225, 0.7)',
                  fontSize: '12px',
                  color: '#334155',
                }}
              >
                Nhóm dự kiến: <strong>{draftPendingDelete.groupName}</strong>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '10px',
                marginTop: '4px',
              }}
            >
              <button
                type="button"
                disabled={isDeletingDraft}
                onClick={() => setDraftPendingDelete(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  background: '#f8fafc',
                  border: '1px solid rgba(148, 163, 184, 0.45)',
                  color: '#334155',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: isDeletingDraft ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={isDeletingDraft}
                onClick={handleConfirmDeleteDraft}
                style={{
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  background: isDeletingDraft
                    ? 'rgba(239, 68, 68, 0.65)'
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: isDeletingDraft ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                {isDeletingDraft ? 'Đang xóa...' : 'Xóa bản nháp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
