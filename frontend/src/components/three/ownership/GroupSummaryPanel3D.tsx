import React from 'react';
import { Html, Billboard } from '@react-three/drei';
import { CoOwnershipGroupResponse } from '../../../types/coOwnership';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';
import {
  Users,
  Car,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
} from 'lucide-react';

interface GroupSummaryPanel3DProps {
  group: CoOwnershipGroupResponse;
  vehicleCode: string;
  position?: [number, number, number];
  onClose?: () => void;
}

export const GroupSummaryPanel3D: React.FC<GroupSummaryPanel3DProps> = ({
  group,
  vehicleCode,
  position = [-2.1, 2.50, 0.0],
  onClose,
}) => {
  const memberCount = group.members?.length ?? 0;
  const vehicleCount = group.vehicles && group.vehicles.length > 0 ? group.vehicles.length : 1;
  const totalPercentage = group.totalOwnershipPercentage ?? 0;
  const isComplete = totalPercentage === 100;
  const statusText = group.statusLabel || (isComplete ? 'HOÀN CHỈNH' : 'CHƯA PHÂN BỔ ĐỦ');
  const statusColor = isComplete ? '#10b981' : '#f59e0b';

  return (
    <group position={position}>
      <Billboard follow={true}>
        {/* Holographic Frame behind the Panel */}
        <HolographicPanelFrame3D width={2.25} height={1.95} color="#a855f7" depth={-0.05} />

        <Html
          center
          distanceFactor={8.8}
          style={{ pointerEvents: 'auto', userSelect: 'none' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '250px',
              background: 'rgba(8, 12, 24, 0.94)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 24px rgba(168, 85, 247, 0.25)',
              borderRadius: '14px',
              padding: '14px 16px',
              color: '#ffffff',
              fontFamily: 'var(--font-family, system-ui, sans-serif)',
              position: 'relative',
            }}
          >
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
                  transition: 'background 0.2s ease',
                }}
              >
                <X size={11} />
              </button>
            )}

            {/* Header Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '9.5px',
                fontWeight: 800,
                color: '#c084fc',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '3px',
              }}
            >
              <Users size={11} color="#c084fc" />
              NHÓM ĐỒNG SỞ HỮU
            </div>

            {/* Group Name */}
            <h4
              style={{
                fontSize: '14.5px',
                fontWeight: 800,
                margin: '0 0 10px 0',
                color: '#ffffff',
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
              }}
            >
              {group.name || `${vehicleCode} Co-ownership Group`}
            </h4>

            {/* Metrics List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '10px',
              }}
            >
              {/* Thành viên: 3 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '5px 8px',
                  borderRadius: '7px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Users size={12} color="#94a3b8" />
                  Thành viên:
                </span>
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{memberCount}</span>
              </div>

              {/* Xe trong nhóm: 1 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '5px 8px',
                  borderRadius: '7px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Car size={12} color="#94a3b8" />
                  Xe trong nhóm:
                </span>
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{vehicleCount}</span>
              </div>

              {/* Tổng tỷ lệ: 100% */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '5px 8px',
                  borderRadius: '7px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <PieChart size={12} color="#00f2fe" />
                  Tổng tỷ lệ:
                </span>
                <span style={{ fontWeight: 800, color: '#00f2fe' }}>{totalPercentage}%</span>
              </div>

              {/* Trạng thái: HOÀN CHỈNH */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '5px 8px',
                  borderRadius: '7px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={12} color="#94a3b8" />
                  Trạng thái:
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    background: `${statusColor}20`,
                    border: `1px solid ${statusColor}60`,
                    color: statusColor,
                    fontWeight: 800,
                    fontSize: '9.5px',
                    letterSpacing: '0.03em',
                  }}
                >
                  {isComplete ? (
                    <CheckCircle2 size={10} color={statusColor} />
                  ) : (
                    <AlertCircle size={10} color={statusColor} />
                  )}
                  {statusText}
                </span>
              </div>
            </div>

            {/* Total Ownership Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '5px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, totalPercentage)}%`,
                  height: '100%',
                  background: isComplete
                    ? 'linear-gradient(90deg, #059669, #10b981)'
                    : 'linear-gradient(90deg, #a855f7, #00f2fe)',
                  borderRadius: '9999px',
                  boxShadow: isComplete
                    ? '0 0 8px rgba(16, 185, 129, 0.6)'
                    : '0 0 8px rgba(0, 242, 254, 0.6)',
                }}
              />
            </div>

            {/* Subtle bottom note */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '8px',
                fontSize: '8.5px',
                color: '#64748b',
              }}
            >
              <Sparkles size={9} color="#a855f7" />
              Mô hình nhóm đồng sở hữu theo xe
            </div>
          </div>
        </Html>
      </Billboard>
    </group>
  );
};
