import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  User,
  History,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
  MessageSquare,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { VehicleResponse } from '../../../types/vehicle';
import {
  MaintenanceResponse,
  VoteDecision,
  MaintenanceApprovalResponse,
  MAINTENANCE_STATUS_CONFIG,
  MAINTENANCE_TYPE_CONFIG,
  MAINTENANCE_PRIORITY_CONFIG,
} from '../../../types/maintenance';
import {
  fetchVehicleMaintenance,
  fetchMaintenanceApproval,
  castMaintenanceVote,
} from '../../../services/maintenanceApi';
import { useWorldStore } from '../../../store/worldStore';
import { getPartById } from '../../../data/vehicleParts';

interface CoOwnerMaintenancePanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '--/--/---- --:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--/--/---- --:--';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '--/--/---- --:--';
  }
}

/**
 * Subcomponent for an individual Maintenance Proposal requiring Co-Owner approval & voting.
 * Isolated to safely maintain its own TanStack queries & mutations without violating hook rules.
 */
interface CoOwnerMaintenanceProposalCardProps {
  item: MaintenanceResponse;
  vehicleId: string;
}

const CoOwnerMaintenanceProposalCard: React.FC<CoOwnerMaintenanceProposalCardProps> = ({
  item,
  vehicleId,
}) => {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Authoritative TanStack Query: Fetch voting progress and current user voting rights
  const { data: approvalData, isLoading: isApprovalLoading } = useQuery<MaintenanceApprovalResponse>({
    queryKey: ['maintenanceApproval', item.id],
    queryFn: () => fetchMaintenanceApproval(item.id),
    refetchInterval: 3000,
  });

  const voteMutation = useMutation({
    mutationFn: (decision: VoteDecision) =>
      castMaintenanceVote(item.id, {
        decision,
        comment: comment.trim() || undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceApproval', item.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setFeedback({
        type: 'success',
        text: `Đã ghi nhận biểu quyết "${res.currentUserVote === 'APPROVE' ? 'ĐỒNG Ý' : 'KHÔNG ĐỒNG Ý'}".`,
      });
      setTimeout(() => setFeedback(null), 3500);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        text: err?.message || 'Không thể gửi biểu quyết.',
      });
      setTimeout(() => setFeedback(null), 4000);
    },
  });

  const typeCfg = MAINTENANCE_TYPE_CONFIG[item.maintenanceType];
  const prioCfg = MAINTENANCE_PRIORITY_CONFIG[item.priority];
  const statusCfg = MAINTENANCE_STATUS_CONFIG[item.status];

  const approveWeight = approvalData?.approveWeight ?? 0;
  const rejectWeight = approvalData?.rejectWeight ?? 0;
  const pendingWeight = approvalData?.pendingWeight ?? 100;
  const threshold = approvalData?.requiredThreshold ?? 50.0;
  const currentUserVote = approvalData?.currentUserVote ?? null;
  const canVote = approvalData?.canVote ?? false;
  const currentUserWeight = approvalData?.currentUserWeight ?? null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(217, 119, 6, 0.1) 100%)',
        border: '1.5px solid rgba(245, 158, 11, 0.55)',
        borderRadius: '12px',
        padding: '13px',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
        boxShadow: '0 4px 16px rgba(245, 158, 11, 0.12)',
      }}
    >
      {/* 1. Header: Status & Category */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#f59e0b',
              boxShadow: '0 0 10px #f59e0b',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em' }}>
            YÊU CẦU BẢO DƯỠNG
          </span>
        </div>
        <span
          style={{
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            color: '#fbbf24',
            fontSize: '9.5px',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: '10px',
          }}
        >
          {statusCfg?.labelVi || 'Chờ biểu quyết'}
        </span>
      </div>

      <div>
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', lineHeight: 1.35 }}>
          {item.title}
        </div>
      </div>

      {/* 2. Meta Tags: Loại & Ưu tiên */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '10.5px' }}>
        <span
          style={{
            background: typeCfg?.bg || 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${typeCfg?.color || '#94a3b8'}`,
            color: typeCfg?.color || '#ffffff',
            padding: '2px 7px',
            borderRadius: '4px',
            fontWeight: 700,
          }}
        >
          Loại: {typeCfg?.labelVi || item.maintenanceType}
        </span>
        <span
          style={{
            background: prioCfg?.bg || 'rgba(255, 255, 255, 0.08)',
            color: prioCfg?.color || '#ffffff',
            padding: '2px 7px',
            borderRadius: '4px',
            fontWeight: 700,
          }}
        >
          Ưu tiên: {prioCfg?.labelVi || item.priority}
        </span>
      </div>

      {/* 3. Reason / Description */}
      {item.description && (
        <div
          style={{
            fontSize: '11px',
            color: '#cbd5e1',
            lineHeight: 1.4,
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '7px 9px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>Lý do: </span>
          {item.description}
        </div>
      )}

      {/* 4. Linked Damage Records */}
      {item.damageRecords && item.damageRecords.length > 0 && (
        <div
          style={{
            padding: '7px 9px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '6px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: '10.5px',
              color: '#fbbf24',
              fontWeight: 700,
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <AlertTriangle size={12} />
            <span>Hư hỏng liên quan ({item.damageRecords.length}):</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {item.damageRecords.map((dmg) => (
              <div
                key={dmg.id}
                style={{
                  fontSize: '10.5px',
                  color: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ color: '#f59e0b' }}>•</span>
                <span style={{ fontWeight: 600 }}>
                  {getPartById(dmg.vehiclePartCode)?.nameVi || dmg.vehiclePartCode}
                </span>
                <span style={{ color: '#94a3b8' }}>— {dmg.damageType}</span>
                {dmg.status && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '9px',
                      color: dmg.status === 'RESOLVED' ? '#34d399' : '#fbbf24',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '1px 5px',
                      borderRadius: '3px',
                    }}
                  >
                    {dmg.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Creator & Scheduled Date */}
      <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div>Người tạo: <strong style={{ color: '#f1f5f9' }}>{item.createdByName || 'STAFF'}</strong> ({formatDateTime(item.createdAt)})</div>
        {item.scheduledAt && (
          <div style={{ color: '#38bdf8' }}>Lịch dự kiến: <strong>{formatDateTime(item.scheduledAt)}</strong></div>
        )}
      </div>

      {/* 6. Voting Progress */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '9px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#f8fafc' }}>
            TIẾN ĐỘ BIỂU QUYẾT
          </span>
          <span style={{ fontSize: '9.5px', color: '#fbbf24', fontWeight: 700 }}>
            Cần &gt; {threshold}% để thông qua
          </span>
        </div>

        {/* 3-color Progress Bar */}
        <div
          style={{
            height: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          <div
            style={{
              width: `${approveWeight}%`,
              background: '#10b981',
              transition: 'width 0.3s ease',
            }}
            title={`Đồng ý: ${approveWeight}%`}
          />
          <div
            style={{
              width: `${rejectWeight}%`,
              background: '#ef4444',
              transition: 'width 0.3s ease',
            }}
            title={`Phản đối: ${rejectWeight}%`}
          />
          <div
            style={{
              width: `${pendingWeight}%`,
              background: 'rgba(255, 255, 255, 0.15)',
              transition: 'width 0.3s ease',
            }}
            title={`Chưa biểu quyết: ${pendingWeight}%`}
          />
        </div>

        {/* Breakdown Text */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            marginTop: '2px',
          }}
        >
          <span style={{ color: '#34d399', fontWeight: 700 }}>{approveWeight}% đồng ý</span>
          <span style={{ color: '#f87171', fontWeight: 700 }}>{rejectWeight}% phản đối</span>
          <span style={{ color: '#94a3b8' }}>{pendingWeight}% chưa biểu quyết</span>
        </div>
      </div>

      {/* 7. Current User Vote Status */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '6px',
          padding: '6px 9px',
          fontSize: '10.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: '#94a3b8' }}>Lựa chọn của bạn:</span>
        <span
          style={{
            fontWeight: 800,
            color:
              currentUserVote === 'APPROVE'
                ? '#34d399'
                : currentUserVote === 'REJECT'
                ? '#f87171'
                : '#fbbf24',
          }}
        >
          {currentUserVote === 'APPROVE'
            ? 'Đồng ý'
            : currentUserVote === 'REJECT'
            ? 'Không đồng ý'
            : 'Chưa biểu quyết'}
          {currentUserWeight != null && ` (${currentUserWeight}% cổ phần)`}
        </span>
      </div>

      {/* 8. Optional Comment Input */}
      {canVote && item.status === 'PENDING_APPROVAL' && (
        <div>
          <label
            style={{
              fontSize: '10px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '3px',
            }}
          >
            <MessageSquare size={11} />
            <span>Ý kiến đóng góp (tùy chọn):</span>
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ví dụ: Đồng ý bảo dưỡng để đảm bảo an toàn..."
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '10.5px',
              color: '#ffffff',
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* 9. Feedback Notification */}
      {feedback && (
        <div
          style={{
            background:
              feedback.type === 'success'
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${
              feedback.type === 'success' ? '#10b981' : '#ef4444'
            }`,
            borderRadius: '6px',
            padding: '5px 8px',
            fontSize: '10.5px',
            color: feedback.type === 'success' ? '#6ee7b7' : '#fca5a5',
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* 10. Actions: [ ĐỒNG Ý BẢO DƯỠNG ] / [ KHÔNG ĐỒNG Ý ] */}
      {item.status === 'PENDING_APPROVAL' ? (
        canVote ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginTop: '2px',
            }}
          >
            <button
              type="button"
              disabled={voteMutation.isPending}
              onClick={() => voteMutation.mutate('APPROVE')}
              style={{
                background:
                  currentUserVote === 'APPROVE'
                    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                    : 'rgba(16, 185, 129, 0.18)',
                border:
                  currentUserVote === 'APPROVE'
                    ? '1.5px solid #34d399'
                    : '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                padding: '9px 10px',
                color: currentUserVote === 'APPROVE' ? '#ffffff' : '#34d399',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow:
                  currentUserVote === 'APPROVE'
                    ? '0 0 12px rgba(16, 185, 129, 0.4)'
                    : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <ThumbsUp size={13} />
              <span>ĐỒNG Ý BẢO DƯỠNG</span>
            </button>

            <button
              type="button"
              disabled={voteMutation.isPending}
              onClick={() => voteMutation.mutate('REJECT')}
              style={{
                background:
                  currentUserVote === 'REJECT'
                    ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                    : 'rgba(239, 68, 68, 0.15)',
                border:
                  currentUserVote === 'REJECT'
                    ? '1.5px solid #f87171'
                    : '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '9px 10px',
                color: currentUserVote === 'REJECT' ? '#ffffff' : '#f87171',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow:
                  currentUserVote === 'REJECT'
                    ? '0 0 12px rgba(239, 68, 68, 0.4)'
                    : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <ThumbsDown size={13} />
              <span>KHÔNG ĐỒNG Ý</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: '6px 8px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '6px',
              fontSize: '10px',
              color: '#94a3b8',
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            Chỉ thành viên đồng sở hữu tích cực có cổ phần của xe mới có quyền biểu quyết.
          </div>
        )
      ) : (
        <div
          style={{
            padding: '6px 8px',
            background:
              item.status === 'APPROVED'
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${
              item.status === 'APPROVED'
                ? 'rgba(16, 185, 129, 0.4)'
                : 'rgba(239, 68, 68, 0.4)'
            }`,
            borderRadius: '6px',
            fontSize: '10.5px',
            fontWeight: 700,
            color: item.status === 'APPROVED' ? '#34d399' : '#f87171',
            textAlign: 'center',
          }}
        >
          {item.status === 'APPROVED'
            ? '✓ Đã thông qua biểu quyết — Chờ kỹ thuật viên tiến hành bảo dưỡng.'
            : '✕ Biểu quyết đã kết thúc (Bị từ chối).'}
        </div>
      )}
    </div>
  );
};

export const CoOwnerMaintenancePanel: React.FC<CoOwnerMaintenancePanelProps> = ({
  vehicle,
  onClose,
}) => {
  const returnToGarageOverview = useWorldStore((state) => state.returnToGarageOverview);

  // Authoritative TanStack Query: Fetch maintenance records for co-owner's vehicle
  const {
    data: maintenanceList = [],
    isLoading,
    isError,
  } = useQuery<MaintenanceResponse[]>({
    queryKey: ['vehicleMaintenance', vehicle.id],
    queryFn: () => fetchVehicleMaintenance(vehicle.id),
    staleTime: 5000,
  });

  // Proposals pending approval (Requires co-owner voting)
  const pendingProposals = useMemo(() => {
    return maintenanceList.filter((m) => m.status === 'PENDING_APPROVAL');
  }, [maintenanceList]);

  // Approved proposals waiting for staff to start
  const approvedProposals = useMemo(() => {
    return maintenanceList.filter((m) => m.status === 'APPROVED');
  }, [maintenanceList]);

  // Current active maintenance work item (if any is IN_PROGRESS or SCHEDULED)
  const activeMaintenance = useMemo(() => {
    return (
      maintenanceList.find((m) => m.status === 'IN_PROGRESS') ||
      maintenanceList.find((m) => m.status === 'SCHEDULED') ||
      maintenanceList.find((m) => m.status === 'PENDING') ||
      null
    );
  }, [maintenanceList]);

  // Completed maintenance history sorted by completedAt / updatedAt descending
  const completedHistory = useMemo(() => {
    return maintenanceList
      .filter((m) => m.status === 'COMPLETED')
      .sort((a, b) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime());
  }, [maintenanceList]);

  const isVehicleUnderMaintenance =
    vehicle.status === 'MAINTENANCE' || activeMaintenance?.status === 'IN_PROGRESS';

  return (
    <div
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '88px',
        right: '20px',
        bottom: '20px',
        width: 'clamp(340px, 28vw, 420px)',
        zIndex: 20,
        background:
          'linear-gradient(180deg, rgba(8, 14, 24, 0.96) 0%, rgba(5, 10, 18, 0.98) 100%)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        boxShadow:
          '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 35px rgba(16, 185, 129, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        color: '#ffffff',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Quay lại xe"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
              }}
            >
              <Wrench size={16} color="#34d399" />
              <span>BẢO DƯỠNG & BIỂU QUYẾT</span>
            </div>
            <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
              {vehicle.plateNumber || vehicle.modelName || 'EV01'} — Thông tin kỹ thuật
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#34d399',
            letterSpacing: '0.04em',
          }}
        >
          CO-OWNER
        </div>
      </div>

      {/* Scrollable Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* 2. Active Proposals Pending Approval (Section 9 Requirement) */}
        {pendingProposals.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertTriangle size={13} color="#fbbf24" />
              <span>ĐỀ XUẤT ĐANG CHỜ PHÊ DUYỆT ({pendingProposals.length})</span>
            </div>
            {pendingProposals.map((item) => (
              <CoOwnerMaintenanceProposalCard
                key={item.id}
                item={item}
                vehicleId={vehicle.id}
              />
            ))}
          </div>
        )}

        {/* 3. Approved Proposals Waiting to Start */}
        {approvedProposals.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={13} color="#34d399" />
              <span>YÊU CẦU ĐÃ ĐƯỢC PHÊ DUYỆT ({approvedProposals.length})</span>
            </div>
            {approvedProposals.map((item) => (
              <CoOwnerMaintenanceProposalCard
                key={item.id}
                item={item}
                vehicleId={vehicle.id}
              />
            ))}
          </div>
        )}

        {/* 4. Active Maintenance In Progress or Scheduled */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isVehicleUnderMaintenance ? (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    background: '#f59e0b',
                    borderRadius: '50%',
                    width: '8px',
                    height: '8px',
                    boxShadow: '0 0 10px #f59e0b',
                  }}
                />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#fbbf24',
                    letterSpacing: '0.03em',
                  }}
                >
                  XE ĐANG ĐƯỢC BẢO DƯỠNG
                </span>
              </div>

              {activeMaintenance && (
                <>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                    {activeMaintenance.title}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      fontSize: '10.5px',
                      color: '#cbd5e1',
                    }}
                  >
                    <span
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      Loại: {MAINTENANCE_TYPE_CONFIG[activeMaintenance.maintenanceType]?.labelVi || activeMaintenance.maintenanceType}
                    </span>
                    {activeMaintenance.scheduledAt && (
                      <span
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        Dự kiến: {formatDateTime(activeMaintenance.scheduledAt)}
                      </span>
                    )}
                  </div>

                  {activeMaintenance.description && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        lineHeight: 1.4,
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '6px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {activeMaintenance.description}
                    </div>
                  )}
                </>
              )}

              <div style={{ fontSize: '10.5px', color: '#fca5a5', marginTop: '2px' }}>
                * Trong thời gian bảo dưỡng kỹ thuật, chức năng đặt lịch xe tạm thời bị khóa.
              </div>
            </div>
          ) : pendingProposals.length === 0 && approvedProposals.length === 0 ? (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <ShieldCheck size={20} color="#10b981" />
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#10b981' }}>
                  Phương tiện hoạt động bình thường
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  Không có yêu cầu bảo dưỡng cần biểu quyết hoặc bảo dưỡng đang diễn ra.
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 5. Completed Maintenance History List (Section 20 & 21) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <History size={13} color="#94a3b8" />
            <span>LỊCH SỬ BẢO DƯỠNG ĐÃ HOÀN TẤT ({completedHistory.length})</span>
          </div>

          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
              Đang tải dữ liệu bảo dưỡng...
            </div>
          ) : completedHistory.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={24} color="#10b981" />
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                Xe chưa có lịch sử bảo dưỡng hoàn tất.
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                Mọi lịch sử sửa chữa đã hoàn thành sẽ được lưu trữ và hiển thị tại đây.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {completedHistory.map((item) => {
                const typeCfg = MAINTENANCE_TYPE_CONFIG[item.maintenanceType];
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '10px',
                      padding: '11px 13px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: typeCfg?.color || '#34d399',
                          background: typeCfg?.bg || 'transparent',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {typeCfg?.labelVi || item.maintenanceType}
                      </span>

                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        {formatDateTime(item.completedAt || item.updatedAt)}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                      {item.title}
                    </div>

                    {item.description && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.35 }}>
                        {item.description}
                      </div>
                    )}

                    {item.completionNote && (
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '5px 8px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '6px',
                          fontSize: '10.5px',
                          color: '#a7f3d0',
                          fontStyle: 'italic',
                        }}
                      >
                        Kết quả xử lý: "{item.completionNote}"
                      </div>
                    )}

                    {/* Linked damages resolved */}
                    {item.damageRecords && item.damageRecords.length > 0 && (
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '5px 8px',
                          background: 'rgba(16, 185, 129, 0.08)',
                          borderRadius: '6px',
                          fontSize: '10px',
                          color: '#34d399',
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                          ✓ Hư hỏng đã khắc phục ({item.damageRecords.length}):
                        </div>
                        {item.damageRecords.map((d) => (
                          <div key={d.id} style={{ color: '#cbd5e1' }}>
                            • {getPartById(d.vehiclePartCode)?.nameVi || d.vehiclePartCode} ({d.damageType})
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        color: '#64748b',
                        marginTop: '2px',
                      }}
                    >
                      <span>Kỹ thuật viên: {item.assignedStaffName || item.createdByName || 'STAFF'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6. Footer Actions */}
      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.35)',
          display: 'flex',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '8px',
            padding: '9px 12px',
            color: '#34d399',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.03em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.35) 100%)';
            e.currentTarget.style.borderColor = '#34d399';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
          }}
        >
          <ArrowLeft size={13} />
          QUAY LẠI XE
        </button>

        <button
          type="button"
          onClick={returnToGarageOverview}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            padding: '9px 12px',
            color: '#94a3b8',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          QUAY LẠI TOÀN CẢNH GARAGE
        </button>
      </div>
    </div>
  );
};
