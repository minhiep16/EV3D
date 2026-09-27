import React, { useState } from 'react';
import { Html, Billboard } from '@react-three/drei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GroupMemberResponse } from '../../../types/coOwnership';
import { removeMemberFromGroup } from '../../../services/coOwnershipApi';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';
import { SpatialDataLink } from '../SpatialDataLink';
import {
  Users,
  PieChart,
  ShieldCheck,
  Calendar,
  Mail,
  X,
  Sparkles,
  Car,
  Award,
  UserMinus,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface HolographicOwnerDetailPanelProps {
  member: GroupMemberResponse;
  orbPosition: [number, number, number];
  groupName?: string;
  vehicleCode?: string;
  vehicleId?: string;
  panelPosition?: [number, number, number];
  color?: string;
  renderLink?: boolean;
  canManage?: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<
  GroupMemberResponse['status'],
  { label: string; color: string }
> = {
  ACTIVE: { label: 'Đang hoạt động', color: '#10b981' },
  PENDING: { label: 'Đang chờ duyệt', color: '#f59e0b' },
  INACTIVE: { label: 'Ngừng hoạt động', color: '#ef4444' },
  REMOVED: { label: 'Đã rời nhóm', color: '#6b7280' },
};

const ROLE_LABELS: Record<string, string> = {
  REPRESENTATIVE: 'Đại diện nhóm',
  ADMIN: 'Quản trị viên nhóm',
  MEMBER: 'Đồng sở hữu',
};

export const HolographicOwnerDetailPanel: React.FC<HolographicOwnerDetailPanelProps> = ({
  member,
  orbPosition,
  groupName = 'EVShare Demo Group',
  vehicleCode = 'EV01',
  vehicleId,
  panelPosition = [2.7, 1.45, 0.4],
  color = '#00f2fe',
  renderLink = true,
  canManage = false,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const removeMutation = useMutation({
    mutationFn: () => removeMemberFromGroup(member.groupId, member.id),
    onSuccess: () => {
      if (vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['coOwnership', vehicleId] });
      }
      queryClient.invalidateQueries({ queryKey: ['coOwnership'] });
      queryClient.invalidateQueries({ queryKey: ['coOwnershipGroup', member.groupId] });
      queryClient.invalidateQueries({ queryKey: ['groupMembers', member.groupId] });
      onClose();
    },
    onError: (err: any) => {
      setRemoveError(err?.message || 'Không thể xoá thành viên khỏi nhóm.');
    },
  });

  const percentage = member.share?.percentage ?? 0;
  const statusInfo = STATUS_LABELS[member.status] ?? {
    label: member.status,
    color: '#94a3b8',
  };

  const roleText = member.memberRole ? (ROLE_LABELS[member.memberRole] || 'Đồng sở hữu') : 'Đồng sở hữu';

  const formattedDate = member.joinedAt
    ? new Date(member.joinedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Chưa cập nhật';

  return (
    <>
      {/* 1. Spatial Laser Link connecting Selected Orb to Holographic Panel */}
      {renderLink && (
        <SpatialDataLink
          start={orbPosition}
          end={[panelPosition[0] - 0.4, panelPosition[1], panelPosition[2]]}
          color={color}
        />
      )}

      {/* 2. Holographic Panel positioned in 3D Space */}
      <group position={panelPosition}>
        <Billboard follow={true}>
          <HolographicPanelFrame3D width={2.4} height={canManage ? 3.90 : 3.35} color={color} />
          <Html
            center
            distanceFactor={8.8}
            style={{ pointerEvents: 'auto', userSelect: 'none' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: '320px',
                background: 'rgba(8, 12, 22, 0.94)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${color}`,
                boxShadow: `0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px ${color}35`,
                borderRadius: '16px',
                padding: '22px',
                color: '#ffffff',
                fontFamily: 'var(--font-family)',
                position: 'relative',
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                title="Đóng thông tin đồng sở hữu"
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                <X size={14} />
              </button>

              {/* Header Tag */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: color,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                <Users size={13} />
                THÔNG TIN ĐỒNG SỞ HỮU
              </div>

              {/* Member Full Name */}
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                  margin: '0 0 4px 0',
                  color: '#ffffff',
                }}
              >
                {member.fullName}
              </h3>

              {/* Email / User Identity */}
              <div
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '14px',
                }}
              >
                <Mail size={12} color="#94a3b8" />
                {member.email}
              </div>

              {/* Group & Vehicle Identity Bar */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  marginBottom: '14px',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Users size={12} color="#a855f7" />
                    Nhóm:
                  </span>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>{groupName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Car size={12} color="#00f2fe" />
                    Xe:
                  </span>
                  <span style={{ fontWeight: 800, color: '#00f2fe' }}>{vehicleCode}</span>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                {/* Ownership Percentage */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '10px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#94a3b8',
                      marginBottom: '4px',
                    }}
                  >
                    Tỷ lệ sở hữu
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <PieChart size={14} color={color} />
                    {percentage}%
                  </div>
                </div>

                {/* Member Role */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '10px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#94a3b8',
                      marginBottom: '4px',
                    }}
                  >
                    Vai trò
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Award size={13} color="#f59e0b" />
                    {roleText}
                  </div>
                </div>
              </div>

              {/* Additional Status Details */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '16px',
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
                      fontSize: '11px',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <ShieldCheck size={12} color="#94a3b8" />
                    Trạng thái thành viên
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: statusInfo.color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: statusInfo.color,
                        boxShadow: `0 0 6px ${statusInfo.color}`,
                      }}
                    />
                    {statusInfo.label}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Calendar size={12} color="#94a3b8" />
                    Ngày tham gia
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#f8fafc',
                    }}
                  >
                    {formattedDate}
                  </span>
                </div>
              </div>

              {/* Member Removal Controls (Only for Authorized Roles) */}
              {canManage && (
                <div style={{ marginBottom: '14px' }}>
                  {!showConfirmRemove ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowConfirmRemove(true);
                        setRemoveError(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.45)',
                        borderRadius: '8px',
                        color: '#fca5a5',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <UserMinus size={13} color="#ef4444" />
                      XOÁ KHỎI NHÓM
                    </button>
                  ) : (
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.6)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#fecaca',
                          fontWeight: 600,
                          marginBottom: '8px',
                          lineHeight: 1.35,
                        }}
                      >
                        Bạn có chắc muốn xoá thành viên này khỏi nhóm?
                      </div>

                      {removeError && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '5px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(239, 68, 68, 0.6)',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            color: '#f87171',
                            fontSize: '10.5px',
                            lineHeight: 1.3,
                            marginBottom: '8px',
                          }}
                        >
                          <AlertTriangle size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                          <span>{removeError}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowConfirmRemove(false);
                            setRemoveError(null);
                          }}
                          disabled={removeMutation.isPending}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          HUỶ
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate()}
                          disabled={removeMutation.isPending}
                          style={{
                            flex: 1.4,
                            padding: '6px 8px',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            cursor: removeMutation.isPending ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                          }}
                        >
                          {removeMutation.isPending ? (
                            <>
                              <Loader2 size={11} className="animate-spin" />
                              ĐANG XOÁ...
                            </>
                          ) : (
                            'XÁC NHẬN XOÁ'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Holographic Footer */}
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  color: '#64748b',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={11} color={color} />
                  {groupName}
                </span>
                <span style={{ letterSpacing: '0.04em' }}>ID: {member.id.substring(0, 8)}</span>
              </div>
            </div>
          </Html>
        </Billboard>
      </group>
    </>
  );
};
