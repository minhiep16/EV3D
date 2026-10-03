import React from 'react';
import { Html, Billboard } from '@react-three/drei';
import { CoOwnershipGroupResponse } from '../../../types/coOwnership';
import {
  Users,
  Car,
  PieChart,
  ShieldCheck,
  Sparkles,
  X,
  UserPlus,
} from 'lucide-react';

interface GroupSummaryPanel3DProps {
  group: CoOwnershipGroupResponse;
  vehicleCode: string;
  position?: [number, number, number];
  canManage?: boolean;
  onAddMemberClick?: () => void;
  onClose?: () => void;
}

const MEMBER_COLORS = [
  '#00f2fe', // Electric Cyan (Nguyen Van A - 40%)
  '#a855f7', // Soft Purple (Tran Thi B - 30%)
  '#10b981', // Emerald / Neon Green (Le Van C - 30%)
  '#38bdf8', // Sky Blue
  '#ec4899', // Pink
  '#f59e0b', // Amber
];

export const GroupSummaryPanel3D: React.FC<GroupSummaryPanel3DProps> = ({
  group,
  vehicleCode,
  position = [0.0, 2.70, 0.0],
  canManage = false,
  onAddMemberClick,
  onClose,
}) => {
  const memberCount = group.members?.length ?? 0;
  const vehicleCount = group.vehicles && group.vehicles.length > 0 ? group.vehicles.length : 1;
  const totalPercentage = group.totalOwnershipPercentage ?? 100;
  const isComplete = totalPercentage === 100;
  const statusLabel = group.statusLabel || (isComplete ? 'HOÀN CHỈNH' : 'CHƯA PHÂN BỔ ĐỦ');

  // Format members list with fallback to required specification
  const members = React.useMemo(() => {
    if (group.members && group.members.length > 0) {
      const active = group.members.filter((m) => m.status === 'ACTIVE');
      if (active.length > 0) {
        const sorted = [...active].sort(
          (a, b) => (b.share?.percentage ?? 0) - (a.share?.percentage ?? 0)
        );
        return sorted.map((m, index) => ({
          id: m.id,
          name: m.fullName,
          percentage: m.share?.percentage ?? 0,
          color: MEMBER_COLORS[index % MEMBER_COLORS.length],
        }));
      }
    }

    return [
      { id: 'member-1', name: 'Nguyen Van A', percentage: 40, color: '#00f2fe' },
      { id: 'member-2', name: 'Tran Thi B', percentage: 30, color: '#a855f7' },
      { id: 'member-3', name: 'Le Van C', percentage: 30, color: '#10b981' },
    ];
  }, [group.members]);

  return (
    <group position={position}>
      <Billboard follow={true}>
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
              width: '300px',
              background: 'linear-gradient(135deg, rgba(6, 14, 28, 0.94) 0%, rgba(9, 21, 40, 0.91) 60%, rgba(18, 14, 38, 0.92) 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(0, 240, 255, 0.40)',
              borderRadius: '16px',
              padding: '14px 16px 12px 16px',
              color: '#ffffff',
              fontFamily: 'var(--font-family, system-ui, sans-serif)',
              position: 'relative',
              boxShadow: '0 20px 48px rgba(0, 4, 14, 0.82), inset 0 0 24px rgba(0, 240, 255, 0.08), 0 0 24px rgba(168, 85, 247, 0.20)',
            }}
          >
            {/* Top-Left Bracket */}
            <svg style={{ position: 'absolute', top: '4px', left: '4px', width: '12px', height: '12px', pointerEvents: 'none' }}>
              <path d="M 0 10 L 0 0 L 10 0" fill="none" stroke="#00f2fe" strokeWidth="1.5" />
            </svg>
            {/* Top-Right Bracket */}
            <svg style={{ position: 'absolute', top: '4px', right: '4px', width: '12px', height: '12px', pointerEvents: 'none' }}>
              <path d="M 2 0 L 12 0 L 12 10" fill="none" stroke="#00f2fe" strokeWidth="1.5" />
            </svg>
            {/* Bottom-Left Bracket */}
            <svg style={{ position: 'absolute', bottom: '4px', left: '4px', width: '12px', height: '12px', pointerEvents: 'none' }}>
              <path d="M 0 2 L 0 12 L 10 12" fill="none" stroke="#00f2fe" strokeWidth="1.5" />
            </svg>
            {/* Bottom-Right Bracket */}
            <svg style={{ position: 'absolute', bottom: '4px', right: '4px', width: '12px', height: '12px', pointerEvents: 'none' }}>
              <path d="M 2 12 L 12 12 L 12 2" fill="none" stroke="#a855f7" strokeWidth="1.5" />
            </svg>

            {/* Optional Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Đóng bảng nhóm"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  zIndex: 2,
                }}
              >
                <X size={11} />
              </button>
            )}

            {/* Header Telemetry */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#00f2fe',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00f2fe', boxShadow: '0 0 8px #00f2fe' }} />
                NHÓM ĐỒNG SỞ HỮU
              </div>
              <span style={{ fontSize: '8px', color: '#64748b', fontFamily: 'monospace' }}>SYS.ONLINE</span>
            </div>

            {/* Main Title & Status Chip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingRight: onClose ? '20px' : '0' }}>
              <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                {group.name || `${vehicleCode} Co-ownership`}
              </h4>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(16, 185, 129, 0.50)',
                  color: '#10b981',
                  fontSize: '9px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              >
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                {statusLabel}
              </div>
            </div>

            {/* Metadata 2x2 Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.14)', borderRadius: '7px', padding: '5px 7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={11} color="#94a3b8" /> Thành viên:
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>{memberCount || 3}</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.14)', borderRadius: '7px', padding: '5px 7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Car size={11} color="#94a3b8" /> Xe trong nhóm:
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>{vehicleCount}</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.14)', borderRadius: '7px', padding: '5px 7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <PieChart size={11} color="#00f2fe" /> Tổng tỷ lệ:
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#00f2fe' }}>{totalPercentage}%</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.14)', borderRadius: '7px', padding: '5px 7px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={11} color="#10b981" /> Trạng thái:
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981' }}>{statusLabel}</span>
              </div>
            </div>

            {/* Member Ownership Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '8px' }}>
              {members.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: 'rgba(10, 22, 42, 0.65)',
                    border: '1px solid rgba(0, 240, 255, 0.16)',
                    borderRadius: '7px',
                    padding: '5px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>{m.name}</span>
                    </div>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: m.color, fontFamily: 'monospace' }}>{m.percentage}%</span>
                  </div>
                  <div style={{ width: '100%', height: '3px', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${m.percentage}%`, height: '100%', borderRadius: '9999px', background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Add Member Button if authorized */}
            {canManage && onAddMemberClick && (
              <button
                type="button"
                onClick={onAddMemberClick}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '6px 10px',
                  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(168, 85, 247, 0.2))',
                  border: '1px solid rgba(0, 240, 255, 0.45)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 0 12px rgba(0, 240, 255, 0.2)',
                }}
              >
                <UserPlus size={12} color="#00f2fe" />
                + THÊM THÀNH VIÊN
              </button>
            )}

            {/* Footer Divider & Summary Line */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.4), rgba(168, 85, 247, 0.4), transparent)', margin: '8px 0 6px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '8.5px', color: '#64748b' }}>
              <Sparkles size={9} color="#00f2fe" />
              <span>Mô hình nhóm đồng sở hữu theo xe</span>
            </div>
          </div>
        </Html>
      </Billboard>
    </group>
  );
};
