import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchInvitationDetail,
  signInvitationContract,
  finalizeInvitation,
} from '../../../services/coOwnershipApi';
import {
  MembershipInvitationResponse,
  DigitalSignPayload,
} from '../../../types/coOwnership';
import { useAuthStore } from '../../../store/authStore';
import {
  ArrowLeft,
  X,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PenTool,
  Loader2,
  FileText,
  AlertTriangle,
  Sparkles,
  PieChart,
  Check,
} from 'lucide-react';

interface CoOwnerContractAmendmentViewProps {
  invitationId: string;
  vehicleName: string;
  vehicleCode: string;
  onBack: () => void;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CoOwnerContractAmendmentView: React.FC<CoOwnerContractAmendmentViewProps> = ({
  invitationId,
  vehicleName,
  vehicleCode,
  onBack,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const [demoPin, setDemoPin] = useState('123456');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch full invitation details
  const { data: invitation, isLoading, refetch } = useQuery<MembershipInvitationResponse>({
    queryKey: ['invitationDetail', invitationId],
    queryFn: () => fetchInvitationDetail(invitationId),
    enabled: Boolean(invitationId),
    refetchInterval: 4000,
  });

  // Digital sign mutation
  const signMutation = useMutation({
    mutationFn: (payload: DigitalSignPayload) => signInvitationContract(invitationId, payload),
    onSuccess: (data) => {
      setErrorMessage(null);
      setSuccessMessage('Ký phụ lục hợp đồng thành công!');
      queryClient.invalidateQueries({ queryKey: ['invitationDetail', invitationId] });
      queryClient.invalidateQueries({ queryKey: ['groupInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['myPendingInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['coOwnershipGroup'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Ký hợp đồng thất bại. Vui lòng kiểm tra lại mã PIN.');
    },
  });

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: () => finalizeInvitation(invitationId),
    onSuccess: (data) => {
      setErrorMessage(null);
      setSuccessMessage('Hoàn tất kết nạp thành viên thành công!');
      queryClient.invalidateQueries({ queryKey: ['invitationDetail', invitationId] });
      queryClient.invalidateQueries({ queryKey: ['groupInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['coOwnershipGroup'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Hoàn tất kết nạp thất bại.');
    },
  });

  if (isLoading || !invitation) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          color: '#38bdf8',
          gap: '12px',
          flex: 1,
        }}
      >
        <Loader2 className="animate-spin" size={28} />
        <span style={{ fontSize: '12px', fontWeight: 600 }}>Đang tải phụ lục hợp đồng...</span>
      </div>
    );
  }

  // Derive personal ownership impact
  const currentUserId = currentUser?.id;
  const myCurrentDistribution = invitation.currentDistribution?.find((d) => d.userId === currentUserId);
  const myProjectedDistribution = invitation.projectedDistribution?.find((d) => d.userId === currentUserId);

  const myCurrentShare = myCurrentDistribution ? Number(myCurrentDistribution.currentPercentage) : 0;
  const myDeduction = myCurrentDistribution ? Number(myCurrentDistribution.deductionPercentage) : 0;
  const myProjectedShare = myProjectedDistribution ? Number(myProjectedDistribution.projectedPercentage) : myCurrentShare;

  const isCurrentUserLeader = invitation.invitedByUserId === currentUserId;
  const isCurrentUserContributor = invitation.additionalContributions?.some((c) => c.userId === currentUserId);

  // Authoritative signers list from backend
  const requiredSignatories = invitation.requiredSignatories || [];
  const signedCount = invitation.signedCount ?? invitation.signatures?.length ?? 0;
  const totalRequired = invitation.requiredSignaturesCount ?? requiredSignatories.length;

  const canSign = Boolean(invitation.canSign);
  const hasCurrentUserSigned = Boolean(invitation.hasCurrentUserSigned);
  const canFinalize = Boolean(invitation.canFinalize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 1. TOP HEADER WITH BACK BUTTON */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(34, 230, 255, 0.2)',
          background: 'linear-gradient(90deg, rgba(34, 230, 255, 0.1) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onBack}
            title="Quay lại danh sách lời mời"
            style={{
              background: 'rgba(34, 230, 255, 0.12)',
              border: '1px solid rgba(34, 230, 255, 0.35)',
              borderRadius: '8px',
              padding: '6px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: '#22e6ff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ArrowLeft size={13} />
            <span>QUAY LẠI</span>
          </button>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>
              XÁC NHẬN PHỤ LỤC HỢP ĐỒNG
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
              {vehicleCode} • {invitation.groupName || 'Nhóm đồng sở hữu'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng bảng điều khiển"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* 2. SCROLLABLE CONTENT BODY */}
      <div
        style={{
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          flex: 1,
        }}
      >
        {/* Messages */}
        {errorMessage && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={14} flexShrink={0} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={14} flexShrink={0} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* SECTION 1: INCOMING MEMBER INFORMATION */}
        <div
          style={{
            background: 'rgba(15, 30, 55, 0.7)',
            border: '1.2px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '14px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '11px', fontWeight: 800 }}>
              <Users size={13} />
              <span>THÀNH VIÊN ĐƯỢC ĐỀ XUẤT KẾT NẠP</span>
            </div>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(0, 242, 254, 0.15)',
                color: '#22e6ff',
                border: '1px solid rgba(0, 242, 254, 0.3)',
              }}
            >
              {invitation.statusVi || invitation.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>Họ và tên:</span>
              <div style={{ color: '#ffffff', fontWeight: 700, marginTop: '1px' }}>
                {invitation.inviteeUserName || 'Thành viên mới'}
              </div>
            </div>

            <div>
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>Email liên hệ:</span>
              <div style={{ color: '#cbd5e1', fontWeight: 600, marginTop: '1px', wordBreak: 'break-all' }}>
                {invitation.inviteeEmail}
              </div>
            </div>

            <div>
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>Cổ phần tiếp nhận:</span>
              <div style={{ color: '#22e6ff', fontWeight: 800, fontSize: '13px', marginTop: '1px' }}>
                +{Number(invitation.totalOfferedPercentage || 0).toFixed(2)}%
              </div>
            </div>

            <div>
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>Người mời (Trưởng nhóm):</span>
              <div style={{ color: '#cbd5e1', fontWeight: 600, marginTop: '1px' }}>
                {invitation.invitedByUserName}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: PERSONAL IMPACT CARD */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(8, 25, 48, 0.8) 0%, rgba(13, 38, 70, 0.8) 100%)',
            border: '1.2px solid rgba(34, 230, 255, 0.35)',
            borderRadius: '14px',
            padding: '14px',
          }}
        >
          <div style={{ color: '#22e6ff', fontSize: '11px', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PieChart size={13} />
            <span>TÁC ĐỘNG ĐẾN CỔ PHẦN CỦA BẠN</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '8px 4px', borderRadius: '8px' }}>
              <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>Hiện tại</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                {myCurrentShare.toFixed(2)}%
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '8px 4px', borderRadius: '8px' }}>
              <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>Đóng góp</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: myDeduction > 0 ? '#f87171' : '#94a3b8',
                  marginTop: '2px',
                }}
              >
                {myDeduction > 0 ? `-${myDeduction.toFixed(2)}%` : '0.00%'}
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '8px 4px', borderRadius: '8px' }}>
              <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>Sau kết nạp</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                {myProjectedShare.toFixed(2)}%
              </div>
            </div>
          </div>

          {myDeduction > 0 ? (
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#cbd5e1', lineHeight: '1.4' }}>
              • Bạn đang đồng ý chuyển nhượng <strong>{myDeduction.toFixed(2)}%</strong> cổ phần cá nhân để kết nạp thành viên mới.
            </div>
          ) : (
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#94a3b8', lineHeight: '1.4' }}>
              • Cổ phần cá nhân của bạn không bị suy giảm trong đợt kết nạp thành viên này.
            </div>
          )}
        </div>

        {/* SECTION 3: GROUP OWNERSHIP BEFORE & AFTER */}
        {invitation.projectedDistribution && invitation.projectedDistribution.length > 0 && (
          <div
            style={{
              background: 'rgba(11, 22, 40, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#cbd5e1', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>CƠ CẤU TOÀN NHÓM TRƯỚC VÀ SAU KẾT NẠP</span>
              <span style={{ fontSize: '9.5px', color: '#10b981', fontWeight: 700 }}>BẢO TOÀN 100.00%</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {invitation.projectedDistribution.map((m, idx) => {
                const currentDist = invitation.currentDistribution?.find((c) => c.userId === m.userId);
                const curP = currentDist ? Number(currentDist.currentPercentage).toFixed(2) : '0.00';
                const projP = Number(m.projectedPercentage).toFixed(2);
                const isNewInvitee = m.userId === invitation.inviteeUserId || m.fullName.includes('(Thành viên mới)');
                const isMe = m.userId === currentUserId;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      background: isMe ? 'rgba(34, 230, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: isMe ? '1px solid rgba(34, 230, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                      fontSize: '10.5px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ color: isMe ? '#22e6ff' : isNewInvitee ? '#34d399' : '#ffffff', fontWeight: isMe ? 700 : 500 }}>
                        {m.fullName}
                      </span>
                      {m.isProjectedLeader && (
                        <span style={{ fontSize: '8px', background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>
                          ĐẠI DIỆN
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '10px' }}>{curP}%</span>
                      <span style={{ color: '#64748b', fontSize: '9px' }}>→</span>
                      <span style={{ color: isNewInvitee ? '#34d399' : '#ffffff', fontWeight: 700 }}>{projP}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: CONTRACT AMENDMENT READER */}
        <div
          style={{
            background: 'rgba(7, 16, 30, 0.9)',
            border: '1.2px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '12px',
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22e6ff', fontSize: '11px', fontWeight: 800 }}>
              <FileText size={13} />
              <span>VĂN BẢN PHỤ LỤC HỢP ĐỒNG SỐ</span>
            </div>
            {invitation.contractVersionNumber && (
              <span style={{ fontSize: '9.5px', color: '#94a3b8', fontFamily: 'monospace' }}>
                V{invitation.contractVersionNumber}.0
              </span>
            )}
          </div>

          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '10.5px',
              lineHeight: '1.6',
              color: '#cbd5e1',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
            }}
          >
            {invitation.contractContent || (
              <>
                PHỤ LỤC HỢP ĐỒNG ĐỒNG SỞ HỮU XE ĐIỆN{'\n\n'}
                • Phương tiện: {vehicleName} ({vehicleCode}){'\n'}
                • Đại diện chuyển nhượng: {invitation.invitedByUserName}{'\n'}
                • Thành viên tiếp nhận: {invitation.inviteeUserName || invitation.inviteeEmail} (+{Number(invitation.totalOfferedPercentage || 0).toFixed(2)}%){'\n'}
                • Cam kết bảo toàn tỷ lệ 100.00% toàn nhóm.
              </>
            )}
          </div>

          {invitation.documentHash && (
            <div style={{ marginTop: '8px', padding: '6px 8px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '6px', fontSize: '9px', color: '#94a3b8', wordBreak: 'break-all' }}>
              <span style={{ fontWeight: 700, color: '#22e6ff' }}>Mã băm kiểm toán SHA-256: </span>
              <code>{invitation.documentHash}</code>
            </div>
          )}
        </div>

        {/* SECTION 5: COMPLETE REQUIRED SIGNATORIES PROGRESS */}
        <div
          style={{
            background: 'rgba(15, 30, 55, 0.7)',
            border: '1.2px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '12px',
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '11px', fontWeight: 800 }}>
              <ShieldCheck size={14} color="#00f2fe" />
              <span>TIẾN ĐỘ CHỮ KÝ PHỤ LỤC HỢP ĐỒNG</span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: signedCount >= totalRequired ? '#34d399' : '#facc15',
              }}
            >
              Đã ký {signedCount}/{totalRequired}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {requiredSignatories.map((sig, idx) => {
              const isMe = sig.userId === currentUserId;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: sig.signed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                    border: sig.signed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '10.5px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ color: isMe ? '#22e6ff' : '#ffffff', fontWeight: 700 }}>
                        {sig.fullName} {isMe ? '(Bạn)' : ''}
                      </span>
                      {sig.contributionPercentage != null && sig.contributionPercentage > 0 && (
                        <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                          (-{Number(sig.contributionPercentage).toFixed(2)}%)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '1px' }}>
                      {sig.roleLabel}
                    </div>
                  </div>

                  <div>
                    {sig.signed ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: '#34d399',
                          fontWeight: 700,
                          fontSize: '10px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          padding: '3px 7px',
                          borderRadius: '5px',
                        }}
                      >
                        <CheckCircle2 size={11} />
                        <span>Đã ký phụ lục hợp đồng</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: '#facc15',
                          fontWeight: 600,
                          fontSize: '10px',
                          background: 'rgba(234, 179, 8, 0.15)',
                          padding: '3px 7px',
                          borderRadius: '5px',
                        }}
                      >
                        <Clock size={11} />
                        <span>Chờ ký</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {invitation.pendingSignerNames && invitation.pendingSignerNames.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '9.5px', color: '#facc15' }}>
              • Còn chờ chữ ký của: <strong>{invitation.pendingSignerNames.join(', ')}</strong>
            </div>
          )}
        </div>

        {/* SECTION 6: ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {/* A. If user can sign and hasn't signed */}
          {canSign && !hasCurrentUserSigned && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(2, 132, 199, 0.12) 100%)',
                border: '1.2px solid rgba(0, 242, 254, 0.4)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#22e6ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PenTool size={13} />
                <span>XÁC THỰC KÝ SỐ ĐIỆN TỬ PHỤ LỤC HỢP ĐỒNG</span>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Mã PIN xác thực số (DEMO mặc định: 123456):
                </label>
                <input
                  type="password"
                  value={demoPin}
                  onChange={(e) => setDemoPin(e.target.value)}
                  maxLength={10}
                  style={{
                    width: '100%',
                    background: 'rgba(7, 16, 30, 0.9)',
                    border: '1.2px solid rgba(0, 242, 254, 0.35)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  signMutation.mutate({
                    pinOrPassword: demoPin,
                    signatureMethod: 'DEMO_AUTHENTICATED_PIN',
                    contentHash: invitation.documentHash || undefined,
                  })
                }
                disabled={signMutation.isPending || !demoPin}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#071426',
                  fontSize: '12px',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(0, 242, 254, 0.35)',
                }}
              >
                {signMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <PenTool size={15} />}
                <span>KÝ PHỤ LỤC HỢP ĐỒNG</span>
              </button>
            </div>
          )}

          {/* B. If current user already signed */}
          {hasCurrentUserSigned && (
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '11px',
                color: '#34d399',
              }}
            >
              <CheckCircle2 size={16} flexShrink={0} style={{ marginTop: '1px' }} />
              <div>
                <div style={{ fontWeight: 800 }}>Bạn đã hoàn tất ký phụ lục hợp đồng</div>
                <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px', lineHeight: '1.4' }}>
                  Hệ thống sẽ tự động kích hoạt thành viên mới và cập nhật phân bổ sở hữu ngay khi tất cả các bên hoàn tất chữ ký.
                </div>
              </div>
            </div>
          )}

          {/* C. If invitation is ready for completion and user is leader */}
          {canFinalize && (
            <button
              type="button"
              onClick={() => finalizeMutation.mutate()}
              disabled={finalizeMutation.isPending}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
              }}
            >
              {finalizeMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />}
              <span>HOÀN TẤT KẾT NẠP THÀNH VIÊN</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
