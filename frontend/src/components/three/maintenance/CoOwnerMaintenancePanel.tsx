import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Car,
  History,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
  Plus,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Layers,
  FileText,
  DollarSign,
} from 'lucide-react';
import { VehicleResponse } from '../../../types/vehicle';
import {
  MaintenanceResponse,
  VoteDecision,
  MaintenanceApprovalResponse,
  MaintenanceType,
  MaintenancePriority,
  CreateMaintenancePayload,
  MAINTENANCE_STATUS_CONFIG,
  MAINTENANCE_TYPE_CONFIG,
  MAINTENANCE_PRIORITY_CONFIG,
} from '../../../types/maintenance';
import {
  fetchVehicleMaintenance,
  fetchMaintenanceApproval,
  castMaintenanceVote,
  createVehicleMaintenance,
  createVoteForMaintenance,
} from '../../../services/maintenanceApi';
import { fetchVehicleDamages } from '../../../services/damageApi';
import { DamageRecordResponse, DAMAGE_TYPE_LABELS, DAMAGE_SEVERITY_CONFIG } from '../../../types/damage';
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
 * Reusable visual timeline for repair and maintenance progression.
 * Stages: ĐỀ XUẤT ĐÃ GỬI -> CHỜ TẠO BIỂU QUYẾT -> ĐANG BIỂU QUYẾT -> ĐÃ PHÊ DUYỆT -> ĐÃ LÊN LỊCH -> ĐANG SỬA CHỮA -> HOÀN TẤT
 */
interface RepairTimelineProps {
  status: MaintenanceStatus;
}

const RepairTimeline: React.FC<RepairTimelineProps> = ({ status }) => {
  const steps = [
    { key: 'SUBMITTED', label: 'Đề xuất đã gửi' },
    { key: 'PENDING', label: 'Chờ tạo BQ' },
    { key: 'PENDING_APPROVAL', label: 'Đang biểu quyết' },
    { key: 'APPROVED', label: 'Đã phê duyệt' },
    { key: 'SCHEDULED', label: 'Đã lên lịch' },
    { key: 'IN_PROGRESS', label: 'Đang sửa chữa' },
    { key: 'COMPLETED', label: 'Hoàn tất' },
  ];

  const getStepIndex = (st: MaintenanceStatus) => {
    switch (st) {
      case 'PENDING':
        return 1;
      case 'PENDING_APPROVAL':
        return 2;
      case 'APPROVED':
        return 3;
      case 'SCHEDULED':
        return 4;
      case 'IN_PROGRESS':
        return 5;
      case 'COMPLETED':
        return 6;
      case 'REJECTED':
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  };

  const currentIdx = getStepIndex(status);

  return (
    <div
      style={{
        marginTop: '6px',
        marginBottom: '4px',
        background: 'rgba(0, 0, 0, 0.25)',
        padding: '8px 10px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div
        style={{
          fontSize: '9.5px',
          color: '#94a3b8',
          fontWeight: 700,
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Clock size={11} color="#38bdf8" />
        <span>TIẾN ĐỘ THỰC HIỆN:</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        {steps.map((s, idx) => {
          const isDone = currentIdx > idx;
          const isCurrent = currentIdx === idx;
          const isFailed = currentIdx === -1 && (idx === 2 || idx === 3);

          return (
            <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: isDone ? '#10b981' : isCurrent ? '#f59e0b' : isFailed ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
                  border: isCurrent ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  color: '#ffffff',
                  boxShadow: isCurrent ? '0 0 8px rgba(245, 158, 11, 0.6)' : 'none',
                }}
              >
                {isDone ? '✓' : isCurrent ? '•' : ''}
              </div>
              <span
                style={{
                  fontSize: '8px',
                  color: isDone ? '#34d399' : isCurrent ? '#fbbf24' : '#64748b',
                  fontWeight: isCurrent || isDone ? 700 : 500,
                  marginTop: '3px',
                  textAlign: 'center',
                  lineHeight: 1.1,
                  maxWidth: '44px',
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Subcomponent for an individual Maintenance Proposal requiring Co-Owner approval & voting.
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
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      const label =
        res.currentUserVote === 'APPROVE'
          ? 'ĐỒNG Ý'
          : res.currentUserVote === 'REJECT'
          ? 'KHÔNG ĐỒNG Ý'
          : 'PHIẾU TRẮNG';
      setFeedback({
        type: 'success',
        text: `Đã ghi nhận biểu quyết "${label}".`,
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

  // Action mutation to start voting session from PENDING proposal
  const createVoteMutation = useMutation({
    mutationFn: () => createVoteForMaintenance(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vote-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceApproval', item.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setFeedback({
        type: 'success',
        text: 'Đã tạo phiên biểu quyết thành công! Các thành viên có thể biểu quyết ngay.',
      });
      setTimeout(() => setFeedback(null), 3500);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        text: err?.message || 'Không thể tạo phiên biểu quyết.',
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
  const canVote = approvalData?.eligibleToVote ?? false;
  const currentUserWeight = approvalData?.currentUserWeight ?? null;

  const isPendingVoteCreation = item.status === 'PENDING';

  return (
    <div
      style={{
        background: isPendingVoteCreation
          ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(3, 105, 161, 0.08) 100%)'
          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(217, 119, 6, 0.1) 100%)',
        border: `1.5px solid ${isPendingVoteCreation ? 'rgba(56, 189, 248, 0.55)' : 'rgba(245, 158, 11, 0.55)'}`,
        borderRadius: '12px',
        padding: '13px',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
        boxShadow: isPendingVoteCreation
          ? '0 4px 16px rgba(56, 189, 248, 0.12)'
          : '0 4px 16px rgba(245, 158, 11, 0.12)',
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
              background: isPendingVoteCreation ? '#38bdf8' : '#f59e0b',
              boxShadow: isPendingVoteCreation ? '0 0 10px #38bdf8' : '0 0 10px #f59e0b',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: isPendingVoteCreation ? '#38bdf8' : '#fbbf24',
              letterSpacing: '0.04em',
            }}
          >
            {isPendingVoteCreation ? 'ĐỀ XUẤT SỬA CHỮA CỦA NHÓM' : 'ĐỀ XUẤT BẢO DƯỠNG'}
          </span>
        </div>
        <span
          style={{
            background: isPendingVoteCreation ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            border: `1px solid ${isPendingVoteCreation ? 'rgba(56, 189, 248, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`,
            color: isPendingVoteCreation ? '#38bdf8' : '#fbbf24',
            fontSize: '9.5px',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: '10px',
          }}
        >
          {isPendingVoteCreation ? 'CHỜ NHÓM TẠO BIỂU QUYẾT' : statusCfg?.labelVi || 'Chờ biểu quyết'}
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
            background: prioCfg?.badgeBg || 'rgba(255, 255, 255, 0.08)',
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
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>Chi tiết: </span>
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
            border: `1px solid ${isPendingVoteCreation ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
          }}
        >
          <div
            style={{
              fontSize: '10.5px',
              color: isPendingVoteCreation ? '#38bdf8' : '#fbbf24',
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
                  gap: '5px',
                }}
              >
                <span style={{ color: '#38bdf8' }}>•</span>
                <span>{getPartById(dmg.vehiclePartCode)?.nameVi || dmg.vehiclePartCode}</span>
                <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>({dmg.damageType})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Voting Progress Bar (for PENDING_APPROVAL) or Notice (for PENDING) */}
      {isPendingVoteCreation ? (
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '11px',
            color: '#bae6fd',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Info size={13} />
            <span>Đề xuất đã gửi vào nhóm sở hữu</span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
            Bất kỳ thành viên nào trong nhóm có thể khởi tạo phiên biểu quyết để bắt đầu thu thập ý kiến.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Tiến độ biểu quyết cổ phần:</span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>
              Ngưỡng thông qua: &gt; {threshold}%
            </span>
          </div>

          <div
            style={{
              height: '7px',
              background: 'rgba(255, 255, 255, 0.1)',
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

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px' }}>
            <span style={{ color: '#34d399', fontWeight: 700 }}>{approveWeight}% đồng ý</span>
            <span style={{ color: '#f87171', fontWeight: 700 }}>{rejectWeight}% phản đối</span>
            <span style={{ color: '#94a3b8' }}>{pendingWeight}% chưa biểu quyết</span>
          </div>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          style={{
            padding: '6px 9px',
            borderRadius: '6px',
            fontSize: '10.5px',
            fontWeight: 700,
            background:
              feedback.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: feedback.type === 'success' ? '#34d399' : '#f87171',
            textAlign: 'center',
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* 6. Action Buttons */}
      {isPendingVoteCreation ? (
        <button
          type="button"
          id={`btn-create-vote-${item.id}`}
          onClick={() => createVoteMutation.mutate()}
          disabled={createVoteMutation.isPending}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 12px',
            color: '#041324',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
            transition: 'all 0.15s ease',
          }}
        >
          <Sparkles size={14} color="#041324" />
          <span>{createVoteMutation.isPending ? 'Đang tạo biểu quyết...' : 'TẠO BIỂU QUYẾT SỬA CHỮA'}</span>
        </button>
      ) : item.status === 'PENDING_APPROVAL' ? (
        canVote ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span style={{ color: '#94a3b8' }}>
                Quyền biểu quyết của bạn: <strong style={{ color: '#22e6ff' }}>{currentUserWeight}%</strong>
              </span>
              {currentUserVote && (
                <span
                  style={{
                    color:
                      currentUserVote === 'APPROVE'
                        ? '#34d399'
                        : currentUserVote === 'REJECT'
                        ? '#f87171'
                        : '#94a3b8',
                    fontWeight: 700,
                  }}
                >
                  Đã chọn:{' '}
                  {currentUserVote === 'APPROVE'
                    ? 'ĐỒNG Ý'
                    : currentUserVote === 'REJECT'
                    ? 'KHÔNG ĐỒNG Ý'
                    : 'PHIẾU TRẮNG'}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                id={`btn-vote-approve-${item.id}`}
                onClick={() => voteMutation.mutate('APPROVE')}
                disabled={voteMutation.isPending}
                style={{
                  background:
                    currentUserVote === 'APPROVE'
                      ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                      : 'rgba(16, 185, 129, 0.15)',
                  border:
                    currentUserVote === 'APPROVE'
                      ? '1.5px solid #34d399'
                      : '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  padding: '8px 6px',
                  color: currentUserVote === 'APPROVE' ? '#ffffff' : '#34d399',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow:
                    currentUserVote === 'APPROVE'
                      ? '0 0 12px rgba(16, 185, 129, 0.4)'
                      : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <ThumbsUp size={12} />
                <span>ĐỒNG Ý</span>
              </button>

              <button
                type="button"
                id={`btn-vote-reject-${item.id}`}
                onClick={() => voteMutation.mutate('REJECT')}
                disabled={voteMutation.isPending}
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
                  padding: '8px 6px',
                  color: currentUserVote === 'REJECT' ? '#ffffff' : '#f87171',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow:
                    currentUserVote === 'REJECT'
                      ? '0 0 12px rgba(239, 68, 68, 0.4)'
                      : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <ThumbsDown size={12} />
                <span>PHẢN ĐỐI</span>
              </button>

              <button
                type="button"
                id={`btn-vote-abstain-${item.id}`}
                onClick={() => voteMutation.mutate('ABSTAIN')}
                disabled={voteMutation.isPending}
                style={{
                  background:
                    currentUserVote === 'ABSTAIN'
                      ? 'linear-gradient(135deg, #475569 0%, #64748b 100%)'
                      : 'rgba(148, 163, 184, 0.15)',
                  border:
                    currentUserVote === 'ABSTAIN'
                      ? '1.5px solid #94a3b8'
                      : '1px solid rgba(148, 163, 184, 0.4)',
                  borderRadius: '8px',
                  padding: '8px 6px',
                  color: currentUserVote === 'ABSTAIN' ? '#ffffff' : '#94a3b8',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow:
                    currentUserVote === 'ABSTAIN'
                      ? '0 0 12px rgba(148, 163, 184, 0.4)'
                      : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>PHIẾU TRẮNG</span>
              </button>
            </div>
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
            ? '✓ Đã thông qua biểu quyết — Kỹ thuật viên đang tiếp nhận xử lý.'
            : '✕ Biểu quyết đã kết thúc (Bị từ chối).'}
        </div>
      )}

      {/* 7. Repair Progress Stepped Timeline */}
      <RepairTimeline status={item.status} />
    </div>
  );
};

export const CoOwnerMaintenancePanel: React.FC<CoOwnerMaintenancePanelProps> = ({
  vehicle,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const returnToGarageOverview = useWorldStore((state) => state.returnToGarageOverview);

  // Tab State: TỔNG QUAN | ĐỀ XUẤT | ĐANG THỰC HIỆN | LỊCH SỬ (Phase 24 Requirement 26)
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROPOSALS' | 'IN_PROGRESS' | 'HISTORY'>('OVERVIEW');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for "TẠO ĐỀ XUẤT BẢO DƯỠNG"
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<MaintenanceType>('PREVENTIVE');
  const [formPriority, setFormPriority] = useState<MaintenancePriority>('MEDIUM');
  const [formDescription, setFormDescription] = useState('');
  const [formEstimatedCost, setFormEstimatedCost] = useState('');
  const [formSelectedDamages, setFormSelectedDamages] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Authoritative TanStack Query: Fetch maintenance records for vehicle
  const vehicleId = vehicle?.id || 'EV01';
  const {
    data: maintenanceList = [],
    isLoading,
    isError,
    refetch: refetchMaintenance,
  } = useQuery<MaintenanceResponse[]>({
    queryKey: ['vehicleMaintenance', vehicleId],
    queryFn: () => (vehicle?.id ? fetchVehicleMaintenance(vehicle.id) : Promise.resolve([])),
    enabled: !!vehicle?.id,
    staleTime: 4000,
  });

  // Fetch Authoritative Vehicle Damage Records for linking
  const { data: vehicleDamages = [] } = useQuery<DamageRecordResponse[]>({
    queryKey: ['vehicleDamages', vehicleId],
    queryFn: () => (vehicle?.id ? fetchVehicleDamages(vehicle.id) : Promise.resolve([])),
    enabled: !!vehicle?.id,
    staleTime: 5000,
  });

  // Requirement: unresolved damages for dashboard counter (OPEN and UNDER_MAINTENANCE)
  const unresolvedDamages = useMemo(() => {
    return vehicleDamages.filter((d) => d.status !== 'RESOLVED');
  }, [vehicleDamages]);

  const openDamages = useMemo(() => {
    return vehicleDamages.filter((d) => (d.status || 'OPEN') === 'OPEN');
  }, [vehicleDamages]);

  const preselectedDamageId = useWorldStore(
    (state) => state.maintenanceDraftPreselectedDamageId
  );
  const preselectedPartCode = useWorldStore(
    (state) => state.maintenanceDraftPreselectedPartCode
  );
  const selectedMaintenanceId = useWorldStore(
    (state) => state.selectedMaintenanceId
  );

  // Auto-switch tab to linked maintenance request when selectedMaintenanceId is set
  useEffect(() => {
    if (selectedMaintenanceId && maintenanceList.length > 0) {
      const target = maintenanceList.find((m) => m.id === selectedMaintenanceId);
      if (target) {
        if (target.status === 'PENDING_APPROVAL' || target.status === 'PENDING') {
          setActiveTab('PROPOSALS');
        } else if (target.status === 'COMPLETED' || target.status === 'REJECTED' || target.status === 'CANCELLED') {
          setActiveTab('HISTORY');
        } else {
          setActiveTab('IN_PROGRESS');
        }
      }
    }
  }, [selectedMaintenanceId, maintenanceList]);

  // Auto-open and prefill form when preselectedDamageId is present (Phase 24 Damage -> Repair)
  // Protected with ref to prevent background query refetches from overwriting user edits (Section 4)
  const lastPrefilledDamageRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (preselectedDamageId) {
      const matchedDmg = vehicleDamages.find((d) => d.id === preselectedDamageId);
      if (lastPrefilledDamageRef.current !== preselectedDamageId || (matchedDmg && !formTitle)) {
        lastPrefilledDamageRef.current = preselectedDamageId;
        setShowCreateModal(true);
        setActiveTab('PROPOSALS');
        setFormType('REPAIR');
        setFormSelectedDamages([preselectedDamageId]);
        const partName =
          getPartById(preselectedPartCode || matchedDmg?.vehiclePartCode || '')?.nameVi ||
          preselectedPartCode ||
          'Bộ phận';
        const typeLabel = matchedDmg?.damageType
          ? DAMAGE_TYPE_LABELS[matchedDmg.damageType] || matchedDmg.damageType
          : 'Hư hỏng';
        setFormTitle(`Sửa chữa hư hỏng: ${partName} (${typeLabel})`);
        if (matchedDmg?.severity) {
          setFormPriority(matchedDmg.severity === 'SEVERE' ? 'CRITICAL' : matchedDmg.severity === 'MODERATE' ? 'HIGH' : 'MEDIUM');
        }
        if (matchedDmg?.note) {
          setFormDescription(matchedDmg.note);
        }
      }
    }
  }, [preselectedDamageId, preselectedPartCode, vehicleDamages, formTitle]);

  const activeDamageRecord = useMemo(() => {
    if (formSelectedDamages.length > 0) {
      return vehicleDamages.find((d) => d.id === formSelectedDamages[0]) || null;
    }
    if (preselectedDamageId) {
      return vehicleDamages.find((d) => d.id === preselectedDamageId) || null;
    }
    return null;
  }, [formSelectedDamages, preselectedDamageId, vehicleDamages]);

  // Derived Categorizations
  const pendingProposals = useMemo(() => {
    return maintenanceList.filter((m) => m.status === 'PENDING_APPROVAL' || m.status === 'PENDING');
  }, [maintenanceList]);

  const activeWorkList = useMemo(() => {
    return maintenanceList.filter(
      (m) => m.status === 'IN_PROGRESS' || m.status === 'SCHEDULED' || m.status === 'APPROVED'
    );
  }, [maintenanceList]);

  const activeMaintenance = useMemo(() => {
    return (
      maintenanceList.find((m) => m.status === 'IN_PROGRESS') ||
      maintenanceList.find((m) => m.status === 'SCHEDULED') ||
      null
    );
  }, [maintenanceList]);

  const completedHistory = useMemo(() => {
    return maintenanceList
      .filter((m) => m.status === 'COMPLETED' || m.status === 'REJECTED' || m.status === 'CANCELLED')
      .sort((a, b) => new Date(b.completedAt || b.updatedAt || 0).getTime() - new Date(a.completedAt || a.updatedAt || 0).getTime());
  }, [maintenanceList]);

  // Section 4: Periodic Maintenance Integration metrics
  const latestCompleted = useMemo(() => {
    return maintenanceList
      .filter((m) => m.status === 'COMPLETED')
      .sort((a, b) => new Date(b.completedAt || b.updatedAt || 0).getTime() - new Date(a.completedAt || a.updatedAt || 0).getTime())[0] || null;
  }, [maintenanceList]);

  const nextScheduled = useMemo(() => {
    return maintenanceList.find((m) => m.status === 'SCHEDULED' && m.scheduledAt) || null;
  }, [maintenanceList]);

  const isVehicleUnderMaintenance =
    vehicle?.status === 'MAINTENANCE' || activeMaintenance?.status === 'IN_PROGRESS';

  // Create Maintenance Proposal Mutation
  const createProposalMutation = useMutation({
    mutationFn: (payload: CreateMaintenancePayload) => createVehicleMaintenance(vehicle.id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['damageHistory', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vote-proposals'] });
      setFormSuccess(`Đã gửi đề xuất sửa chữa "${data.title}" đến nhóm thành công.`);
      setFormError(null);
      setFormTitle('');
      setFormDescription('');
      setFormEstimatedCost('');
      setFormSelectedDamages([]);
      setTimeout(() => {
        setFormSuccess(null);
        setShowCreateModal(false);
        setActiveTab('PROPOSALS');
      }, 2000);
    },
    onError: (err: any) => {
      setFormError(err?.message || 'Không thể tạo đề xuất sửa chữa.');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Vui lòng nhập tiêu đề đề xuất sửa chữa.');
      return;
    }

    const costNum = parseFloat(formEstimatedCost);
    const estimatedCost = !isNaN(costNum) && costNum > 0 ? costNum : undefined;

    createProposalMutation.mutate({
      title: formTitle.trim(),
      maintenanceType: formType,
      priority: formPriority,
      description: formDescription.trim() || undefined,
      estimatedCost,
      damageRecordIds: formSelectedDamages.length > 0 ? formSelectedDamages : undefined,
    });
  };

  // =========================================================================
  // LEFT-MOUSE DRAG TO SCROLL (Phase 24 Maintenance Panel Interaction)
  // =========================================================================
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startScrollTopRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const hasDraggedRef = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const isInteractiveElement = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    return !!target.closest(
      'button, input, textarea, select, option, a, label, [role="button"], [contenteditable="true"]'
    );
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary left mouse button
    if (e.pointerType !== 'mouse' || e.button !== 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // Preserve native scrollbar dragging: if clicked within scrollbar width on right edge, ignore
    const rect = container.getBoundingClientRect();
    if (e.clientX >= rect.left + container.clientWidth) return;

    // Ignore clicks starting on interactive elements (inputs, buttons, select, links, labels)
    if (isInteractiveElement(e.target)) return;

    // Stop propagation to isolate panel interaction from Garage 3D OrbitControls
    e.stopPropagation();

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    hasDraggedRef.current = false;
    startYRef.current = e.clientY;
    startScrollTopRef.current = container.scrollTop;
    activePointerIdRef.current = e.pointerId;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    e.stopPropagation();

    const deltaY = e.clientY - startYRef.current;

    // Threshold of 5px before initiating drag-to-scroll mode
    if (!isDraggingRef.current) {
      if (Math.abs(deltaY) > 5) {
        isDraggingRef.current = true;
        hasDraggedRef.current = true;
        setIsDraggingState(true);
        try {
          container.setPointerCapture(e.pointerId);
        } catch {
          // Ignore if pointer capture is not available
        }
      }
    }

    if (isDraggingRef.current) {
      // Natural drag to scroll: moving cursor up (deltaY < 0) scrolls down (increases scrollTop)
      container.scrollTop = startScrollTopRef.current - deltaY;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    e.stopPropagation();

    const container = scrollContainerRef.current;
    if (container && activePointerIdRef.current !== null) {
      try {
        if (container.hasPointerCapture(activePointerIdRef.current)) {
          container.releasePointerCapture(activePointerIdRef.current);
        }
      } catch {
        // Ignore
      }
    }

    isPointerDownRef.current = false;
    activePointerIdRef.current = null;
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDraggingState(false);
    }

    // Delay reset so click capture can intercept any accidental click event
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    const container = scrollContainerRef.current;
    if (container && activePointerIdRef.current !== null) {
      try {
        if (container.hasPointerCapture(activePointerIdRef.current)) {
          container.releasePointerCapture(activePointerIdRef.current);
        }
      } catch {
        // Ignore
      }
    }

    isPointerDownRef.current = false;
    isDraggingRef.current = false;
    setIsDraggingState(false);
    activePointerIdRef.current = null;
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    // Suppress click event if a drag motion occurred
    if (hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

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
        maxHeight: 'calc(100dvh - 108px)',
        width: 'clamp(380px, 30vw, 470px)',
        zIndex: 40,
        background:
          'linear-gradient(180deg, rgba(8, 14, 24, 0.96) 0%, rgba(5, 10, 18, 0.98) 100%)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: '14px',
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
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              padding: '0',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Quay lại xe"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '0.01em',
                lineHeight: 1.2,
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Wrench size={15} color="#34d399" />
              <span>QUẢN LÝ BẢO DƯỠNG XE</span>
            </div>
            <div style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 500, marginTop: '1px' }}>
              {vehicle?.licensePlate || vehicle?.plateNumber || vehicle?.name || 'EV01'} • Quy trình kỹ thuật & Chi phí
            </div>
          </div>
        </div>

        <div
          style={{
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '4px',
            padding: '0 8px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#34d399',
            letterSpacing: '0.04em',
          }}
        >
          CO-OWNER
        </div>
      </div>

      {/* 2. FOUR-TAB NAVIGATION BAR (Section 26 Requirement) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
          padding: '4px 8px',
          background: 'rgba(5, 10, 18, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          id="tab-maintenance-overview"
          onClick={() => setActiveTab('OVERVIEW')}
          style={{
            height: '36px',
            padding: '0 2px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: activeTab === 'OVERVIEW' ? 700 : 600,
            background: activeTab === 'OVERVIEW' ? 'rgba(34, 230, 255, 0.20)' : 'rgba(255, 255, 255, 0.04)',
            border: activeTab === 'OVERVIEW' ? '1.5px solid #22e6ff' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeTab === 'OVERVIEW' ? '#22e6ff' : '#94a3b8',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'OVERVIEW' ? '0 0 10px rgba(34, 230, 255, 0.3)' : 'none',
          }}
        >
          TỔNG QUAN
        </button>

        <button
          type="button"
          id="tab-maintenance-proposals"
          onClick={() => setActiveTab('PROPOSALS')}
          style={{
            height: '36px',
            padding: '0 2px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: activeTab === 'PROPOSALS' ? 700 : 600,
            background: activeTab === 'PROPOSALS' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(255, 255, 255, 0.04)',
            border: activeTab === 'PROPOSALS' ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeTab === 'PROPOSALS' ? '#fbbf24' : '#94a3b8',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'PROPOSALS' ? '0 0 10px rgba(245, 158, 11, 0.3)' : 'none',
          }}
        >
          ĐỀ XUẤT {pendingProposals.length > 0 ? `(${pendingProposals.length})` : ''}
        </button>

        <button
          type="button"
          id="tab-maintenance-in-progress"
          onClick={() => setActiveTab('IN_PROGRESS')}
          style={{
            height: '36px',
            padding: '0 2px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: activeTab === 'IN_PROGRESS' ? 700 : 600,
            background: activeTab === 'IN_PROGRESS' ? 'rgba(16, 185, 129, 0.20)' : 'rgba(255, 255, 255, 0.04)',
            border: activeTab === 'IN_PROGRESS' ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeTab === 'IN_PROGRESS' ? '#34d399' : '#94a3b8',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'IN_PROGRESS' ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none',
          }}
        >
          ĐANG LÀM {activeWorkList.length > 0 ? `(${activeWorkList.length})` : ''}
        </button>

        <button
          type="button"
          id="tab-maintenance-history"
          onClick={() => setActiveTab('HISTORY')}
          style={{
            height: '36px',
            padding: '0 2px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: activeTab === 'HISTORY' ? 700 : 600,
            background: activeTab === 'HISTORY' ? 'rgba(168, 85, 247, 0.20)' : 'rgba(255, 255, 255, 0.04)',
            border: activeTab === 'HISTORY' ? '1.5px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeTab === 'HISTORY' ? '#c084fc' : '#94a3b8',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'HISTORY' ? '0 0 10px rgba(168, 85, 247, 0.3)' : 'none',
          }}
        >
          LỊCH SỬ {completedHistory.length > 0 ? `(${completedHistory.length})` : ''}
        </button>
      </div>

      {/* 3. SCROLLABLE TAB CONTENT BODY */}
      <div
        ref={scrollContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handlePointerCancel}
        onClickCapture={handleClickCapture}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          cursor: isDraggingState ? 'grabbing' : 'grab',
          userSelect: isDraggingState ? 'none' : 'auto',
        }}
      >
        {/* ========================================================================= */}
        {/* TAB 1: TỔNG QUAN (Section 27)                                             */}
        {/* ========================================================================= */}
        {activeTab === 'OVERVIEW' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Status Card: Sẵn sàng vận hành vs Đang bảo dưỡng */}
            <div
              style={{
                background: isVehicleUnderMaintenance
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.12) 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                border: `1.5px solid ${isVehicleUnderMaintenance ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.4)'}`,
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {isVehicleUnderMaintenance ? (
                <Wrench size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
              ) : (
                <ShieldCheck size={24} color="#10b981" style={{ flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: isVehicleUnderMaintenance ? '#fbbf24' : '#34d399' }}>
                  {isVehicleUnderMaintenance ? 'PHƯƠNG TIỆN ĐANG ĐƯỢC BẢO DƯỠNG' : 'PHƯƠNG TIỆN SẴN SÀNG VẬN HÀNH'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.35 }}>
                  {isVehicleUnderMaintenance
                    ? 'Chức năng đặt lịch tạm thời bị khóa cho đến khi kỹ thuật viên nghiệm thu hoàn tất.'
                    : 'Hệ thống vận hành an toàn. Không có lệnh bảo dưỡng khẩn cấp đang diễn ra.'}
                </div>
              </div>
            </div>

            {/* Periodic Maintenance Integration Block (Section 4) */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(34, 230, 255, 0.2)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} color="#22e6ff" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#22e6ff', letterSpacing: '0.04em' }}>
                    CHỈ SỐ BẢO DƯỠNG ĐỊNH KỲ
                  </span>
                </div>
                <span style={{ fontSize: '9.5px', color: '#94a3b8', fontFamily: 'monospace' }}>
                  CHU KỲ 10,000 KM
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '7px 9px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>Lần bảo dưỡng gần nhất:</span>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                    {latestCompleted?.completedAt ? formatDateTime(latestCompleted.completedAt) : 'CHƯA CÓ DỮ LIỆU'}
                  </span>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '7px 9px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>Odo hiện tại:</span>
                  <span style={{ fontWeight: 800, color: '#22e6ff', fontFamily: 'monospace' }}>
                    {vehicle?.odometer ? `${Number(vehicle.odometer).toLocaleString('vi-VN')} km` : 'CHƯA CÓ DỮ LIỆU'}
                  </span>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '7px 9px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>Dự kiến lần tới:</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                    {nextScheduled?.scheduledAt
                      ? formatDateTime(nextScheduled.scheduledAt)
                      : vehicle?.odometer
                      ? `${(Math.floor(Number(vehicle.odometer) / 10000) + 1) * 10000} km`
                      : 'CHƯA CÓ DỮ LIỆU'}
                  </span>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '7px 9px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>Trạng thái bảo dưỡng:</span>
                  <span style={{ fontWeight: 700, color: isVehicleUnderMaintenance ? '#f59e0b' : '#10b981' }}>
                    {isVehicleUnderMaintenance ? 'ĐANG BẢO DƯỠNG' : 'BÌNH THƯỜNG'}
                  </span>
                </div>
              </div>
            </div>

            {/* Open Defects and Safety Warnings */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={13} color="#f59e0b" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em' }}>
                    HƯ HỎNG CHƯA XỬ LÝ
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: unresolvedDamages.length > 0 ? '#fbbf24' : '#10b981', fontWeight: 700 }}>
                  {unresolvedDamages.length} điểm ghi nhận
                </span>
              </div>

              {unresolvedDamages.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                  Không có điểm hư hỏng nào chưa được xử lý.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {unresolvedDamages.slice(0, 3).map((dmg) => (
                    <div
                      key={dmg.id}
                      style={{
                        fontSize: '10.5px',
                        color: '#e2e8f0',
                        background: 'rgba(0, 0, 0, 0.25)',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>• {getPartById(dmg.vehiclePartCode)?.nameVi || dmg.vehiclePartCode}</span>
                      <span style={{ color: dmg.status === 'UNDER_MAINTENANCE' ? '#38bdf8' : dmg.severity === 'SEVERE' ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
                        {dmg.status === 'UNDER_MAINTENANCE' ? 'Đang sửa chữa' : dmg.severity === 'SEVERE' ? 'Nghiêm trọng' : 'Nhẹ'}
                      </span>
                    </div>
                  ))}
                  {unresolvedDamages.length > 3 && (
                    <div style={{ fontSize: '9.5px', color: '#64748b', textAlign: 'right' }}>
                      và {unresolvedDamages.length - 3} điểm khác...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Action Navigation */}
            <button
              type="button"
              id="btn-goto-create-proposal"
              onClick={() => {
                setActiveTab('PROPOSALS');
                setShowCreateModal(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                border: 'none',
                borderRadius: '6px',
                height: '38px',
                padding: '0 16px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.01em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <Plus size={15} />
              <span>TẠO ĐỀ XUẤT BẢO DƯỠNG MỚI</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ĐỀ XUẤT (Section 28)                                               */}
        {/* ========================================================================= */}
        {activeTab === 'PROPOSALS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Primary Action Button: TẠO ĐỀ XUẤT BẢO DƯỠNG */}
            {!showCreateModal && (
              <button
                type="button"
                id="btn-open-create-proposal-form"
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  height: '38px',
                  padding: '0 16px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={15} />
                <span>TẠO ĐỀ XUẤT SỬA CHỮA</span>
              </button>
            )}

            {/* Proposal Creation Form (Modal / Inline Form) */}
            {showCreateModal && (
              <form
                onSubmit={handleCreateSubmit}
                style={{
                  background: 'rgba(7, 20, 38, 0.98)',
                  border: '1.5px solid rgba(245, 158, 11, 0.55)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 10px 28px rgba(0, 0, 0, 0.65)',
                }}
              >
                {/* Form Title & Close Button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#fbbf24',
                    letterSpacing: '0.01em',
                    lineHeight: 1.25,
                  }}>
                    TẠO ĐỀ XUẤT SỬA CHỮA ĐẾN NHÓM
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>

                {formError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#fca5a5',
                    fontSize: '12px',
                    lineHeight: 1.35,
                    fontWeight: 600,
                  }}>
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#34d399',
                    fontSize: '12px',
                    lineHeight: 1.35,
                    fontWeight: 600,
                  }}>
                    {formSuccess}
                  </div>
                )}

                {/* BLOCK A — THÔNG TIN HƯ HỎNG */}
                {activeDamageRecord ? (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.22)',
                    borderRadius: '10px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}>
                    {/* Header Row: Title + Severity Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: '#f87171',
                      }}>
                        <AlertTriangle size={14} color="#f87171" />
                        <span>THÔNG TIN HƯ HỎNG</span>
                      </div>
                      <span style={{
                        height: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '0 6px',
                        borderRadius: '4px',
                        background: DAMAGE_SEVERITY_CONFIG[activeDamageRecord.severity]?.bg || 'rgba(239, 68, 68, 0.2)',
                        color: DAMAGE_SEVERITY_CONFIG[activeDamageRecord.severity]?.color || '#f87171',
                        border: `1px solid ${DAMAGE_SEVERITY_CONFIG[activeDamageRecord.severity]?.borderColor || '#ef4444'}`,
                      }}>
                        {DAMAGE_SEVERITY_CONFIG[activeDamageRecord.severity]?.label || activeDamageRecord.severity}
                      </span>
                    </div>

                    {/* 2-column compact grid (Rows 1 to 4) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: '13px', lineHeight: 1.25 }}>
                      {/* Row 1: Vehicle name | Plate number */}
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Tên xe</span>
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>{vehicle?.name || vehicle?.model || 'EVShare EV01'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Biển số</span>
                        <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>{vehicle?.licensePlate || vehicle?.plateNumber || '51E-123.45'}</span>
                      </div>

                      {/* Row 2: Affected part | Damage type */}
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Bộ phận</span>
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>{getPartById(activeDamageRecord.vehiclePartCode)?.nameVi || activeDamageRecord.vehiclePartCode}</span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Dạng hư hại</span>
                        <span style={{ color: '#fbbf24', fontWeight: 600 }}>{DAMAGE_TYPE_LABELS[activeDamageRecord.damageType] || activeDamageRecord.damageType}</span>
                      </div>

                      {/* Row 3: Severity | Reported time */}
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Mức độ</span>
                        <span style={{ color: DAMAGE_SEVERITY_CONFIG[activeDamageRecord.severity]?.color || '#f87171', fontWeight: 600 }}>
                          {DAMAGE_SEVERITY_CONFIG[activeDamageRecord.severity]?.label || activeDamageRecord.severity}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Thời gian ghi nhận</span>
                        <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{formatDateTime(activeDamageRecord.createdAt)}</span>
                      </div>

                      {/* Row 4: Short initial note (clamped to max 2 lines) */}
                      {activeDamageRecord.note && (
                        <div style={{ gridColumn: 'span 2', marginTop: '2px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Ghi chú ban đầu</span>
                          <div style={{
                            color: '#e2e8f0',
                            fontSize: '11.5px',
                            lineHeight: 1.35,
                            fontStyle: 'italic',
                            background: 'rgba(0, 0, 0, 0.25)',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            "{activeDamageRecord.note}"
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  openDamages.length > 0 && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#fbbf24',
                      }}>
                        <AlertTriangle size={14} color="#fbbf24" />
                        <span>CHỌN HƯ HỎNG LIÊN QUAN</span>
                      </div>
                      {/* Vehicle Identity */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}>
                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                          {vehicle?.name || vehicle?.model || 'EVShare EV01'}
                        </span>
                        <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>
                          {vehicle?.licensePlate || vehicle?.plateNumber || '51E-123.45'}
                        </span>
                      </div>
                      <div style={{ maxHeight: '90px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {openDamages.map((dmg) => (
                          <label key={dmg.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                              checked={formSelectedDamages.includes(dmg.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormSelectedDamages([...formSelectedDamages, dmg.id]);
                                } else {
                                  setFormSelectedDamages(formSelectedDamages.filter((id) => id !== dmg.id));
                                }
                              }}
                            />
                            <span>{getPartById(dmg.vehiclePartCode)?.nameVi || dmg.vehiclePartCode} ({DAMAGE_TYPE_LABELS[dmg.damageType] || dmg.damageType})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {/* BLOCK B — NỘI DUNG ĐỀ XUẤT SỬA CHỮA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#fbbf24',
                  }}>
                    <Wrench size={14} color="#fbbf24" />
                    <span>NỘI DUNG ĐỀ XUẤT SỬA CHỮA</span>
                  </div>

                  {/* Tiêu đề đề xuất */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '3px' }}>
                      Tiêu đề đề xuất <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="VD: Sửa chữa hư hỏng: Cửa sau trái..."
                      style={{
                        width: '100%',
                        height: '36px',
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        padding: '0 10px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#fbbf24';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                    />
                  </div>

                  {/* Phân loại & Ưu tiên */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '3px' }}>
                        Phân loại
                      </label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as MaintenanceType)}
                        style={{
                          width: '100%',
                          height: '36px',
                          background: '#071426',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px',
                          padding: '0 10px',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="REPAIR">Sửa chữa hỏng hóc</option>
                        <option value="PREVENTIVE">Bảo dưỡng định kỳ</option>
                        <option value="INSPECTION">Kiểm tra tổng quát</option>
                        <option value="BATTERY">Hệ thống pin</option>
                        <option value="TIRE">Lốp & Bánh xe</option>
                        <option value="BRAKE">Hệ thống phanh</option>
                        <option value="BODY">Thân vỏ & Cửa</option>
                        <option value="OTHER">Bảo dưỡng khác</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '3px' }}>
                        Ưu tiên
                      </label>
                      <select
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value as MaintenancePriority)}
                        style={{
                          width: '100%',
                          height: '36px',
                          background: '#071426',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px',
                          padding: '0 10px',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="LOW">Thấp</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HIGH">Cao</option>
                        <option value="CRITICAL">Khẩn cấp</option>
                      </select>
                    </div>
                  </div>

                  {/* Dự toán chi phí */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '3px' }}>
                      Dự toán chi phí (VND)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={formEstimatedCost}
                      onChange={(e) => setFormEstimatedCost(e.target.value)}
                      placeholder="VD: 1500000"
                      style={{
                        width: '100%',
                        height: '36px',
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        padding: '0 10px',
                        color: '#ffffff',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#fbbf24';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                    />
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', fontStyle: 'italic', marginTop: '1px', lineHeight: 1.25 }}>
                      Chế độ thử nghiệm – không giao dịch tiền thật
                    </div>
                  </div>

                  {/* Mô tả lý do / Phương án sửa chữa đề xuất */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '3px' }}>
                      Mô tả lý do / Phương án sửa chữa đề xuất
                    </label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Chi tiết về lý do và các hạng mục cần thực hiện..."
                      style={{
                        width: '100%',
                        height: '60px',
                        maxHeight: '72px',
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: '#ffffff',
                        fontSize: '13px',
                        lineHeight: 1.35,
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        transition: 'border-color 0.15s ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#fbbf24';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                    />
                  </div>
                </div>

                {/* Form Action Buttons: HỦY & GỬI ĐỀ XUẤT ĐẾN NHÓM */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      height: '38px',
                      minWidth: '85px',
                      padding: '0 14px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: '#cbd5e1',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.color = '#cbd5e1';
                    }}
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    disabled={createProposalMutation.isPending}
                    style={{
                      height: '38px',
                      padding: '0 16px',
                      background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(245, 158, 11, 0.35)';
                    }}
                  >
                    {createProposalMutation.isPending ? 'Đang gửi...' : 'GỬI ĐỀ XUẤT ĐẾN NHÓM'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Proposals Pending Approval */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="#fbbf24" />
                <span>ĐỀ XUẤT SỬA CHỮA CỦA NHÓM ({pendingProposals.length})</span>
              </div>

              {pendingProposals.length === 0 ? (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '24px 16px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '11px',
                  }}
                >
                  Hiện tại không có đề xuất bảo dưỡng nào đang chờ biểu quyết.
                </div>
              ) : (
                pendingProposals.map((item) => (
                  <CoOwnerMaintenanceProposalCard
                    key={item.id}
                    item={item}
                    vehicleId={vehicle.id}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ĐANG THỰC HIỆN (Section 29)                                        */}
        {/* ========================================================================= */}
        {activeTab === 'IN_PROGRESS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wrench size={13} color="#34d399" />
              <span>CÔNG VIỆC BẢO DƯỠNG ĐANG TIẾN HÀNH ({activeWorkList.length})</span>
            </div>

            {activeWorkList.length === 0 ? (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '28px 16px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldCheck size={24} color="#10b981" />
                <div style={{ color: '#f8fafc', fontWeight: 700 }}>Không có công việc bảo dưỡng nào đang tiến hành</div>
                <div style={{ color: '#64748b', maxWidth: '300px', lineHeight: 1.4 }}>
                  Khi một đề xuất được biểu quyết thông qua và kỹ thuật viên tiếp nhận, tiến độ sẽ hiển thị tại đây.
                </div>
              </div>
            ) : (
              activeWorkList.map((item) => {
                const typeCfg = MAINTENANCE_TYPE_CONFIG[item.maintenanceType];
                const statusCfg = MAINTENANCE_STATUS_CONFIG[item.status];
                const isItemInProgress = item.status === 'IN_PROGRESS';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: isItemInProgress
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: `1.5px solid ${isItemInProgress ? 'rgba(245, 158, 11, 0.45)' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: typeCfg?.bg || 'rgba(255,255,255,0.08)',
                          color: typeCfg?.color || '#ffffff',
                        }}
                      >
                        {typeCfg?.labelVi || item.maintenanceType}
                      </span>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '999px',
                          background: statusCfg?.bg || 'rgba(255,255,255,0.1)',
                          color: statusCfg?.color || '#ffffff',
                          border: `1px solid ${statusCfg?.border || '#475569'}`,
                        }}
                      >
                        {statusCfg?.labelVi || item.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                      {item.title}
                    </div>

                    {item.description && (
                      <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                        {item.description}
                      </div>
                    )}

                    {/* Stepped Progress Timeline */}
                    <RepairTimeline status={item.status} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span>Kỹ thuật viên: <strong style={{ color: '#f8fafc' }}>{item.assignedStaffName || 'Đang phân công'}</strong></span>
                      {item.scheduledAt && <span>Lên lịch: {formatDateTime(item.scheduledAt)}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LỊCH SỬ (Section 30)                                               */}
        {/* ========================================================================= */}
        {activeTab === 'HISTORY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={13} color="#c084fc" />
              <span>LỊCH SỬ BẢO DƯỠNG ĐÃ KẾT THÚC ({completedHistory.length})</span>
            </div>

            {completedHistory.length === 0 ? (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '28px 16px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '11px',
                }}
              >
                Chưa có lịch sử bảo dưỡng nào kết thúc trong nhóm này.
              </div>
            ) : (
              completedHistory.map((item) => {
                const typeCfg = MAINTENANCE_TYPE_CONFIG[item.maintenanceType];
                const isCompleted = item.status === 'COMPLETED';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: '10px',
                      padding: '11px 13px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: isCompleted ? '#34d399' : '#f87171',
                        }}
                      >
                        {isCompleted ? 'HOÀN TẤT THÀNH CÔNG' : 'BỊ TỪ CHỐI / ĐÃ HỦY'}
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
                          marginTop: '3px',
                          padding: '5px 8px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '6px',
                          fontSize: '10.5px',
                          color: '#a7f3d0',
                          fontStyle: 'italic',
                        }}
                      >
                        {item.completionNote}
                      </div>
                    )}

                    {/* Linked damages resolved */}
                    {item.damageRecords && item.damageRecords.length > 0 && (
                      <div
                        style={{
                          marginTop: '3px',
                          padding: '4px 6px',
                          background: 'rgba(16, 185, 129, 0.08)',
                          borderRadius: '6px',
                          fontSize: '10px',
                          color: '#34d399',
                        }}
                      >
                        <span>✓ Hư hỏng đã xử lý: </span>
                        {item.damageRecords.map((d) => getPartById(d.vehiclePartCode)?.nameVi || d.vehiclePartCode).join(', ')}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        color: '#64748b',
                        marginTop: '2px',
                        paddingTop: '4px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <span>Kỹ thuật viên: {item.assignedStaffName || item.createdByName || 'STAFF'}</span>
                      <span>Hoàn tất: {formatDateTime(item.completedAt || item.updatedAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 4. FOOTER ACTIONS */}
      <div
        style={{
          padding: '6px 12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.4)',
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
            height: '38px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '6px',
            padding: '0 12px',
            color: '#34d399',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={13} />
          QUAY LẠI XE
        </button>

        <button
          type="button"
          onClick={returnToGarageOverview}
          style={{
            height: '38px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            padding: '0 12px',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          TOÀN CẢNH GARAGE
        </button>
      </div>
    </div>
  );
};
