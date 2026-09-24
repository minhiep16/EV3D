import React from 'react';
import { Html, Billboard } from '@react-three/drei';
import { GroupMemberResponse } from '../../../types/coOwnership';
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
} from 'lucide-react';

interface HolographicOwnerDetailPanelProps {
  member: GroupMemberResponse;
  orbPosition: [number, number, number];
  groupName?: string;
  vehicleCode?: string;
  panelPosition?: [number, number, number];
  color?: string;
  renderLink?: boolean;
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
  panelPosition = [2.7, 1.45, 0.4],
  color = '#00f2fe',
  renderLink = true,
  onClose,
}) => {
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
          <HolographicPanelFrame3D width={2.4} height={3.35} color={color} />
          <Html
            center
            distanceFactor={8.8}
            style={{ pointerEvents: 'auto', userSelect: 'none' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
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
