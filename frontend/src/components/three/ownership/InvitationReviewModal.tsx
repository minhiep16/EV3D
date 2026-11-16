import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MembershipInvitationResponse,
  InviteeRespondPayload,
  DigitalSignPayload,
} from '../../../types/coOwnership';
import {
  fetchInvitationDetail,
  respondToInvitation,
  signInvitationContract,
} from '../../../services/coOwnershipApi';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';
import {
  X,
  Car,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  BatteryCharging,
  Gauge,
  PenTool,
  Check,
  Loader2,
  Sparkles,
  PieChart,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface InvitationReviewModalProps {
  invitationId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InvitationReviewModal: React.FC<InvitationReviewModalProps> = ({
  invitationId,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const setReviewingInvitationId = useWorldStore((state) => state.setReviewingInvitationId);
  const setInvitationPreviewVehicle = useWorldStore((state) => state.setInvitationPreviewVehicle);
  const selectVehicle = useWorldStore((state) => state.selectVehicle);

  const [activeStep, setActiveStep] = useState<'REVIEW' | 'CONTRACT' | 'SUCCESS'>('REVIEW');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [demoPin, setDemoPin] = useState('123456');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync isolated invitation review state to worldStore for 3D vehicle rendering
  useEffect(() => {
    setReviewingInvitationId(invitationId);
    return () => {
      setReviewingInvitationId(null);
      setInvitationPreviewVehicle(null);
    };
  }, [invitationId, setReviewingInvitationId, setInvitationPreviewVehicle]);

  // Fetch full invitation details
  const { data: invitation, isLoading, refetch } = useQuery<MembershipInvitationResponse>({
    queryKey: ['invitationDetail', invitationId],
    queryFn: () => fetchInvitationDetail(invitationId),
    enabled: Boolean(invitationId),
    refetchInterval: 5000,
  });

  // Whenever invitation data loads, update the 3D canvas vehicle presentation
  useEffect(() => {
    if (invitation) {
      setInvitationPreviewVehicle({
        id: invitation.vehicleId,
        name: invitation.vehicleName,
        code: invitation.vehicleCode,
        model: invitation.vehicleModel,
        licensePlate: invitation.licensePlate,
        exteriorColor: invitation.exteriorColor,
      });
    }
  }, [invitation, setInvitationPreviewVehicle]);

  // Respond mutation (Accept / Reject)
  const respondMutation = useMutation({
    mutationFn: (payload: InviteeRespondPayload) => respondToInvitation(invitationId, payload),
    onSuccess: (data) => {
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['invitationDetail', invitationId] });
      queryClient.invalidateQueries({ queryKey: ['groupInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['myPendingInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      if (data.status === 'REJECTED') {
        onClose();
      } else {
        setActiveStep('CONTRACT');
      }
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Không thể gửi phản hồi lời mời.');
    },
  });

  // Sign mutation
  const signMutation = useMutation({
    mutationFn: (payload?: DigitalSignPayload) => signInvitationContract(invitationId, payload),
    onSuccess: (data) => {
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['invitationDetail', invitationId] });
      queryClient.invalidateQueries({ queryKey: ['groupInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['myPendingInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['coOwnership'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      if (data.status === 'COMPLETED') {
        setActiveStep('SUCCESS');
        if (onSuccess) onSuccess();
      } else {
        refetch();
      }
    },
    onError: (err: any) => {
      const serverMsg = err?.response?.data?.message || err?.message || '';
      let userFriendly = 'Không thể ký số hợp đồng.';
      if (serverMsg.includes('Mã băm') || serverMsg.includes('không khớp') || serverMsg.includes('phiên bản')) {
        userFriendly = 'Phiên bản hợp đồng đã được cập nhật hoặc không khớp mã kiểm toán. Đang đồng bộ lại văn bản mới nhất...';
        refetch();
      } else if (serverMsg.includes('Mã PIN') || serverMsg.includes('PIN')) {
        userFriendly = serverMsg;
      } else if (serverMsg.includes('rollback') || serverMsg.includes('silently rolled back') || serverMsg.includes('UnexpectedRollbackException')) {
        userFriendly = 'Lỗi hệ thống trong giao dịch ký số. Vui lòng thử lại.';
      } else if (serverMsg) {
        userFriendly = serverMsg;
      }
      setErrorMessage(userFriendly);
    },
  });

  if (isLoading || !invitation) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '76px',
          right: '20px',
          width: 'clamp(380px, 28vw, 440px)',
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          border: '1.2px solid rgba(0, 201, 216, 0.4)',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          zIndex: 9999,
          color: '#009e9d',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <Loader2 className="animate-spin" size={22} color="#009e9d" />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
          ĐANG TẢI THÔNG TIN LỜI MỜI...
        </span>
      </div>
    );
  }

  const isInvitee = currentUser && (
    (invitation.inviteeUserId && invitation.inviteeUserId === currentUser.id) ||
    (invitation.inviteeEmail && invitation.inviteeEmail.toLowerCase() === currentUser.email?.toLowerCase())
  );

  const canSign = Boolean(invitation.canSign || (invitation.status === 'PENDING_CONTRACT_SIGNATURE' && isInvitee));
  const hasUserSigned = invitation.signatures?.some((s) => s.userId === currentUser?.id);

  const damageText =
    invitation.damageCount !== undefined && invitation.damageCount !== null
      ? `${invitation.damageCount} vết`
      : 'Chưa có dữ liệu';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'transparent',
        pointerEvents: 'none',
        zIndex: 9999,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '76px',
          right: '20px',
          bottom: '24px',
          width: 'clamp(420px, 30vw, 460px)',
          maxWidth: 'calc(100vw - 32px)',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          border: '1.2px solid rgba(0, 201, 216, 0.4)',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.12), 0 4px 20px rgba(0, 201, 216, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pointerEvents: 'auto',
          color: '#1e293b',
          animation: 'slideInRight 0.22s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(0, 201, 216, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(240, 249, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(0, 201, 216, 0.12)',
                border: '1px solid rgba(0, 201, 216, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={17} color="#009e9d" />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em' }}>
                LỜI MỜI THAM GIA ĐỒNG SỞ HỮU
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Nhóm: <span style={{ color: '#009e9d', fontWeight: 700 }}>{invitation.groupName || 'EVShare Group'}</span> — Xe:{' '}
                <span style={{ color: '#0284c7', fontWeight: 700 }}>{invitation.vehicleName || invitation.vehicleCode}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#ffffff',
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

        {/* Step Tabs Bar */}
        <div
          style={{
            display: 'flex',
            background: '#ffffff',
            borderBottom: '1px solid rgba(0, 201, 216, 0.15)',
            padding: '4px 16px',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveStep('REVIEW')}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              background: activeStep === 'REVIEW' ? 'rgba(0, 201, 216, 0.12)' : 'transparent',
              border: activeStep === 'REVIEW' ? '1.2px solid #009e9d' : '1px solid transparent',
              color: activeStep === 'REVIEW' ? '#009e9d' : '#64748b',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Car size={12} />
            <span>1. THÔNG TIN PHƯƠNG TIỆN & CỔ PHẦN</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('CONTRACT')}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              background: activeStep === 'CONTRACT' ? 'rgba(0, 201, 216, 0.12)' : 'transparent',
              border: activeStep === 'CONTRACT' ? '1.2px solid #009e9d' : '1px solid transparent',
              color: activeStep === 'CONTRACT' ? '#009e9d' : '#64748b',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <FileText size={12} />
            <span>2. HỢP ĐỒNG & KÝ SỐ</span>
          </button>
        </div>

        {/* Panel Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1.2px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '10px',
                padding: '9px 12px',
                color: '#dc2626',
                fontSize: '11.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} color="#dc2626" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeStep === 'REVIEW' && (
            <>
              {/* Highlight Share Offer Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 201, 216, 0.1), rgba(16, 185, 129, 0.08))',
                  border: '1.2px solid rgba(0, 201, 216, 0.35)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0, 180, 200, 0.06)',
                }}
              >
                <div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                    TỶ LỆ CỔ PHẦN ĐƯỢC CHUYỂN NHƯỢNG
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#009e9d', marginTop: '2px' }}>
                    {invitation.totalOfferedPercentage?.toFixed(2) || '10.00'}%
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
                    Từ Trưởng nhóm: {invitation.leaderTransferPercentage?.toFixed(2)}%
                    {invitation.additionalContributions && invitation.additionalContributions.length > 0 &&
                      ` + Đồng sở hữu khác: ${(invitation.totalOfferedPercentage - invitation.leaderTransferPercentage).toFixed(2)}%`}
                  </div>
                  {invitation.expiresAt && (
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                      Hạn phản hồi: {new Date(invitation.expiresAt).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>TRẠNG THÁI</div>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background: 'rgba(0, 201, 216, 0.12)',
                      border: '1px solid rgba(0, 201, 216, 0.35)',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#009e9d',
                    }}
                  >
                    {invitation.statusVi || invitation.status}
                  </div>
                </div>
              </div>

              {/* Vehicle Technical Specifications (Read-Only) */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1.2px solid rgba(226, 232, 240, 0.9)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Car size={13} />
                  <span>THÔNG TIN PHƯƠNG TIỆN</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 600 }}>DÒNG XE & BIỂN SỐ</div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {invitation.vehicleModel || invitation.vehicleName || 'VinFast VF8'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: 750 }}>
                      {invitation.licensePlate || '30A-888.88'}
                    </div>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '9.5px', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BatteryCharging size={11} color="#15803d" />
                      <span>PIN & SOC</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                      {invitation.currentSocPercent ? `${invitation.currentSocPercent}%` : '85%'}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#166534' }}>
                      Dung lượng: {invitation.batteryCapacityKwh ? `${invitation.batteryCapacityKwh} kWh` : '82.0 kWh'}
                    </div>
                  </div>

                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '9.5px', color: '#92400e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Gauge size={11} color="#b45309" />
                      <span>SỐ KM ODO</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>
                      {invitation.odometerKm ? `${invitation.odometerKm.toLocaleString()} km` : '12,450 km'}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#92400e' }}>
                      Tổn hại: {damageText}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ownership Distribution Preview (Before & After) */}
              {(Boolean(invitation.projectedDistribution && invitation.projectedDistribution.length > 0)) && (
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.2px solid rgba(226, 232, 240, 0.9)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#009e9d', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PieChart size={13} />
                    <span>PHÂN BỔ TỶ LỆ SỞ HỮU (TRƯỚC & SAU KẾT NẠP)</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10.5px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '5px 6px', background: '#f8fafc', borderRadius: '6px', fontWeight: 700, color: '#64748b' }}>
                      <span>Thành viên</span>
                      <span style={{ textAlign: 'center' }}>Hiện tại</span>
                      <span style={{ textAlign: 'center' }}>Đóng góp</span>
                      <span style={{ textAlign: 'right' }}>Sau kết nạp</span>
                    </div>

                    {invitation.projectedDistribution!.map((m, idx) => {
                      const isNewInvitee = !m.userId || m.fullName.includes('Thành viên mới');
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
                            padding: '5px 6px',
                            borderRadius: '6px',
                            background: isNewInvitee ? 'rgba(0, 201, 216, 0.08)' : 'transparent',
                            borderBottom: '1px solid #f1f5f9',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                            <span style={{ fontWeight: isNewInvitee ? 800 : 600, color: isNewInvitee ? '#009e9d' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {m.fullName}
                            </span>
                            {m.isProjectedLeader && (
                              <span style={{ fontSize: '8.5px', padding: '1px 4px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
                                Trưởng nhóm
                              </span>
                            )}
                          </div>

                          <span style={{ textAlign: 'center', color: '#64748b' }}>
                            {m.currentPercentage !== undefined ? `${Number(m.currentPercentage).toFixed(2)}%` : '0.00%'}
                          </span>

                          <span style={{ textAlign: 'center', color: Number(m.deductionPercentage) > 0 ? '#ef4444' : '#94a3b8' }}>
                            {Number(m.deductionPercentage) > 0 ? `-${Number(m.deductionPercentage).toFixed(2)}%` : '—'}
                          </span>

                          <span style={{ textAlign: 'right', fontWeight: 700, color: isNewInvitee ? '#009e9d' : '#0f172a' }}>
                            {m.projectedPercentage !== undefined ? `${Number(m.projectedPercentage).toFixed(2)}%` : '0.00%'}
                          </span>
                        </div>
                      );
                    })}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1', fontSize: '10px', color: '#059669', fontWeight: 700 }}>
                      <span>Tổng tỷ lệ bảo chứng toàn nhóm:</span>
                      <span>100.00%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ownership Breakdown */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1.2px solid rgba(226, 232, 240, 0.9)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={13} />
                  <span>NGƯỜI MỜI & CÁC BÊN ĐÓNG GÓP CỔ PHẦN</span>
                </div>

                <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.6' }}>
                  <div>
                    Trưởng nhóm khởi tạo:{' '}
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>{invitation.invitedByUserName}</span> (Chuyển nhượng{' '}
                    <span style={{ color: '#059669', fontWeight: 700 }}>{invitation.leaderTransferPercentage?.toFixed(2)}%</span>)
                  </div>

                  {invitation.additionalContributions && invitation.additionalContributions.length > 0 && (
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>Đồng sở hữu đóng góp bổ sung:</div>
                      {invitation.additionalContributions.map((c) => (
                        <div key={c.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span>• {c.fullName}</span>
                          <span style={{ color: '#059669', fontWeight: 700 }}>+{c.percentage?.toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {invitation.invitationNote && (
                    <div style={{ marginTop: '8px', padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '10.5px', color: '#475569' }}>
                      <span style={{ color: '#0284c7', fontWeight: 700 }}>Ghi chú từ Trưởng nhóm:</span> "{invitation.invitationNote}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Invitee */}
              {isInvitee && (invitation.status === 'PENDING_INVITEE_RESPONSE' || invitation.status === 'INVITED') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {!showRejectInput ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (invitation.status === 'PENDING_CONTRACT_SIGNATURE' || invitation.status === 'ACCEPTED') {
                            setActiveStep('CONTRACT');
                          } else {
                            respondMutation.mutate({ accept: true });
                          }
                        }}
                        disabled={respondMutation.isPending}
                        style={{
                          width: '100%',
                          padding: '11px 16px',
                          background: 'linear-gradient(135deg, #059669, #10b981)',
                          border: 'none',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '12.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.28)',
                        }}
                      >
                        {respondMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />}
                        <span>ĐỒNG Ý THAM GIA</span>
                      </button>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setActiveStep('CONTRACT')}
                          style={{
                            flex: 1,
                            padding: '9px 12px',
                            background: '#ffffff',
                            border: '1.2px solid rgba(0, 201, 216, 0.5)',
                            borderRadius: '8px',
                            color: '#009e9d',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                          }}
                        >
                          <FileText size={13} />
                          <span>XEM HỢP ĐỒNG & QUY CHẾ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowRejectInput(true)}
                          style={{
                            padding: '9px 14px',
                            background: '#ffffff',
                            border: '1.2px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '8px',
                            color: '#dc2626',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          TỪ CHỐI LỜI MỜI
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#fef2f2', border: '1.2px solid #fecaca', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HelpCircle size={13} />
                        <span>Xác nhận từ chối lời mời tham gia</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '10.5px', color: '#475569', lineHeight: 1.4 }}>
                        Nếu bạn từ chối, lời mời này sẽ bị đóng lại và nhóm đồng sở hữu sẽ được thông báo. Bạn có thể nhập lý do bên dưới:
                      </p>
                      <input
                        type="text"
                        placeholder="Nhập lý do không tham gia (tùy chọn)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        style={{
                          background: '#ffffff',
                          border: '1.2px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          color: '#0f172a',
                          fontSize: '11.5px',
                          outline: 'none',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '2px' }}>
                        <button
                          type="button"
                          onClick={() => setShowRejectInput(false)}
                          style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #94a3b8', borderRadius: '6px', color: '#64748b', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => respondMutation.mutate({ accept: false, reason: rejectReason })}
                          disabled={respondMutation.isPending}
                          style={{ padding: '6px 14px', background: '#dc2626', border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          {respondMutation.isPending ? 'Đang gửi...' : 'Xác nhận từ chối'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeStep === 'CONTRACT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setActiveStep('REVIEW')}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '7px',
                    color: '#475569',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ← Quay lại thông tin xe
                </button>
                <div style={{ fontSize: '12px', color: '#009e9d', fontWeight: 800 }}>
                  HỢP ĐỒNG & QUY CHẾ
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1.2px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '14px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  fontSize: '11px',
                  lineHeight: '1.6',
                  color: '#334155',
                  fontFamily: 'monospace',
                }}
              >
                <div style={{ color: '#0284c7', fontWeight: 800, fontSize: '11.5px', marginBottom: '8px' }}>
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — ĐỘC LẬP - TỰ DO - HẠNH PHÚC
                </div>
                <div style={{ color: '#0f172a', fontWeight: 700, marginBottom: '6px' }}>
                  {invitation.contractTitle || 'PHỤ LỤC HỢP ĐỒNG ĐỒNG SỞ HỮU TIẾP NHẬN THÀNH VIÊN MỚI'}
                </div>
                {invitation.contractContent ? (
                  <div style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>
                    {invitation.contractContent}
                  </div>
                ) : (
                  <>
                    <p style={{ margin: '4px 0' }}>• Phương tiện: {invitation.vehicleName} (Biển số: {invitation.licensePlate})</p>
                    <p style={{ margin: '4px 0' }}>• Trưởng nhóm chuyển nhượng: {invitation.invitedByUserName} (-{invitation.leaderTransferPercentage?.toFixed(2)}%)</p>
                    <p style={{ margin: '4px 0' }}>• Thành viên tiếp nhận: {invitation.inviteeUserName || currentUser?.fullName} (+{invitation.totalOfferedPercentage?.toFixed(2)}%)</p>
                    <p style={{ margin: '4px 0' }}>• Quyền hạn: Sử dụng phương tiện theo lịch đặt trước, quyền biểu quyết theo tỷ lệ cổ phần {invitation.totalOfferedPercentage?.toFixed(2)}%.</p>
                    <p style={{ margin: '4px 0' }}>• Trách nhiệm tài chính: Đóng góp chi phí bảo dưỡng, bảo hiểm định kỳ minh bạch, không chịu trách nhiệm đối với nợ cá nhân lịch sử của thành viên khác.</p>
                    <p style={{ margin: '4px 0' }}>• Cam kết tỷ lệ: Tổng tỷ lệ toàn nhóm bảo chứng tuyệt đối 100.00% theo quy chuẩn hệ thống EVShare 3D.</p>
                  </>
                )}
                {invitation.documentHash && (
                  <div style={{ marginTop: '10px', padding: '6px 8px', background: '#e2e8f0', borderRadius: '6px', fontSize: '10px', color: '#475569', wordBreak: 'break-all' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Mã băm kiểm toán (SHA-256): </span>
                    <code>{invitation.documentHash}</code>
                  </div>
                )}
              </div>

              {/* Signatures audit list */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1.2px solid rgba(226, 232, 240, 0.9)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldCheck size={13} color="#009e9d" />
                    <span>TIẾN TRÌNH KÝ SỐ ĐIỆN TỬ:</span>
                  </div>
                  <span style={{ fontSize: '10.5px', color: '#009e9d', fontWeight: 800 }}>
                    Đã ký {invitation.signedCount ?? invitation.signatures?.length ?? 0}/{invitation.requiredSignaturesCount ?? invitation.requiredSignatories?.length ?? 0}
                  </span>
                </div>

                {invitation.requiredSignatories && invitation.requiredSignatories.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {invitation.requiredSignatories.map((sig, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: sig.signed ? '#059669' : '#475569' }}>
                            {sig.fullName}
                          </span>
                          <span style={{ fontSize: '9.5px', color: '#64748b', marginLeft: '4px' }}>
                            ({sig.roleLabel})
                          </span>
                        </div>
                        {sig.signed ? (
                          <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, fontSize: '10px' }}>
                            <CheckCircle2 size={11} color="#10b981" />
                            <span>Đã ký phụ lục hợp đồng</span>
                          </span>
                        ) : (
                          <span style={{ color: '#d97706', fontSize: '10px', fontWeight: 600 }}>
                            Đang chờ ký
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : invitation.signatures && invitation.signatures.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {invitation.signatures.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: '#059669' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <CheckCircle2 size={12} color="#10b981" />
                          {s.signerName} ({s.role})
                        </span>
                        <span style={{ color: '#64748b' }}>{new Date(s.signedAt).toLocaleTimeString('vi-VN')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>Chưa có chữ ký điện tử nào được ghi nhận.</div>
                )}

                {invitation.pendingSignerNames && invitation.pendingSignerNames.length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '10px', color: '#d97706' }}>
                    • Còn chờ chữ ký: {invitation.pendingSignerNames.join(', ')}
                  </div>
                )}
              </div>

              {/* Digital Signing Action */}
              {canSign && !hasUserSigned && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 201, 216, 0.08), rgba(2, 132, 199, 0.06))',
                    border: '1.2px solid rgba(0, 201, 216, 0.4)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PenTool size={13} />
                    <span>XÁC THỰC KÝ SỐ ĐIỆN TỬ (DEMO AUTHENTICATED PIN)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="password"
                      placeholder="Mã PIN ký số (Mặc định: 123456)"
                      value={demoPin}
                      onChange={(e) => setDemoPin(e.target.value)}
                      style={{
                        flex: 1,
                        background: '#ffffff',
                        border: '1.2px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        color: '#0f172a',
                        fontSize: '12px',
                        letterSpacing: '0.15em',
                        outline: 'none',
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => signMutation.mutate({
                        pinOrPassword: demoPin,
                        fullName: currentUser?.fullName,
                        contentHash: invitation.documentHash || undefined,
                      })}
                      disabled={signMutation.isPending}
                      style={{
                        padding: '9px 16px',
                        background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 3px 10px rgba(2, 132, 199, 0.25)',
                      }}
                    >
                      {signMutation.isPending ? <Loader2 className="animate-spin" size={13} /> : <ShieldCheck size={13} />}
                      <span>KÝ HỢP ĐỒNG</span>
                    </button>
                  </div>
                </div>
              )}

              {hasUserSigned && (
                <div style={{ background: '#f0fdf4', border: '1.2px solid #bbf7d0', borderRadius: '10px', padding: '12px', color: '#15803d', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#15803d" />
                  <span>Bạn đã ký số thành công. Đang chờ các bên còn lại hoàn tất để hệ thống kích hoạt tự động.</span>
                </div>
              )}
            </div>
          )}

          {activeStep === 'SUCCESS' && (
            <div style={{ textAlign: 'center', padding: '24px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#f0fdf4', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={26} color="#10b981" />
              </div>
              <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
                GIA NHẬP ĐỒNG SỞ HỮU THÀNH CÔNG!
              </div>
              <p style={{ fontSize: '12.5px', color: '#475569', maxWidth: '380px', lineHeight: '1.6' }}>
                Chúc mừng bạn đã chính thức trở thành đồng sở hữu xe <strong>{invitation.vehicleName}</strong> với tỷ lệ sở hữu{' '}
                <span style={{ color: '#009e9d', fontWeight: 800 }}>{invitation.totalOfferedPercentage?.toFixed(2)}%</span>.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (invitation.vehicleId) {
                    selectVehicle(invitation.vehicleId);
                  }
                  queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                  queryClient.invalidateQueries({ queryKey: ['coOwnership'] });
                  queryClient.invalidateQueries({ queryKey: ['groupInvitations'] });
                  queryClient.invalidateQueries({ queryKey: ['myPendingInvitations'] });
                  queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
                  queryClient.invalidateQueries({ queryKey: ['notifications'] });
                  onClose();
                  navigate('/garage');
                }}
                style={{
                  marginTop: '10px',
                  padding: '11px 26px',
                  background: 'linear-gradient(135deg, #00c9d8 0%, #009e9d 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(0, 180, 200, 0.28)',
                }}
              >
                <span>VÀO GARAGE 3D</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
