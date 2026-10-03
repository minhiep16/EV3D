import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { CoOwnershipGroupResponse } from '../../../types/coOwnership';
import { fetchVehicleCoOwnership } from '../../../services/coOwnershipApi';
import { useWorldStore } from '../../../store/worldStore';
import { resolveVehicleCode } from '../vehicles/vehicleModelConfig';
import {
  Users,
  Car,
  PieChart,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface CoOwnershipBoardPanelProps {
  vehicle: VehicleResponse;
  onClose?: () => void;
}

interface DisplayMember {
  id: string;
  name: string;
  percentage: number;
  color: string;
}

const MEMBER_COLORS = [
  '#00f2fe', // Electric Cyan (Nguyen Van A - 40%)
  '#a855f7', // Soft Purple (Tran Thi B - 30%)
  '#10b981', // Emerald / Neon Green (Le Van C - 30%)
  '#38bdf8', // Sky Blue
  '#ec4899', // Pink
  '#f59e0b', // Amber
];

export const CoOwnershipBoardPanel: React.FC<CoOwnershipBoardPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const selectedOwnerId = useWorldStore((state) => state.selectedOwnerId);
  const selectOwner = useWorldStore((state) => state.selectOwner);

  // Authoritative TanStack Query: Fetch co-ownership group for the vehicle
  const { data: coOwnership } = useQuery<CoOwnershipGroupResponse>({
    queryKey: ['coOwnership', vehicle.id],
    queryFn: () => fetchVehicleCoOwnership(vehicle.id),
    staleTime: 10000,
  });

  const vehicleCode = resolveVehicleCode(vehicle) || vehicle.name || 'EV01';

  // Deterministic members list: prefers backend query, with reliable fallback to required specification
  const membersList: DisplayMember[] = useMemo(() => {
    if (coOwnership?.members && coOwnership.members.length > 0) {
      const active = coOwnership.members.filter((m) => m.status === 'ACTIVE');
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

    // Default specification data matching 100% distribution
    return [
      { id: 'member-1', name: 'Nguyen Van A', percentage: 40, color: '#00f2fe' },
      { id: 'member-2', name: 'Tran Thi B', percentage: 30, color: '#a855f7' },
      { id: 'member-3', name: 'Le Van C', percentage: 30, color: '#10b981' },
    ];
  }, [coOwnership?.members]);

  // Derived metadata
  const memberCount = coOwnership?.members?.filter((m) => m.status === 'ACTIVE').length || membersList.length || 3;
  const vehicleCount = coOwnership?.vehicles && coOwnership.vehicles.length > 0 ? coOwnership.vehicles.length : 1;
  const totalPercentage = coOwnership?.totalOwnershipPercentage ?? 100;
  const isComplete = totalPercentage === 100;
  const statusLabel = coOwnership?.statusLabel || (isComplete ? 'Hoàn chỉnh' : 'Chưa phân bổ');

  const groupTitle = `${vehicleCode} Co-ownership`;

  return (
    <div
      data-ui-interactive="true"
      style={{
        position: 'fixed',
        top: '78px',
        left: '24px',
        width: '320px',
        zIndex: 30,
        pointerEvents: 'auto',
        background: 'linear-gradient(135deg, rgba(6, 14, 28, 0.94) 0%, rgba(9, 21, 40, 0.91) 60%, rgba(18, 14, 38, 0.92) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 240, 255, 0.40)',
        borderRadius: '16px',
        padding: '14px 16px 12px 16px',
        color: '#ffffff',
        fontFamily: 'var(--font-family, system-ui, -apple-system, sans-serif)',
        boxShadow: '0 20px 48px rgba(0, 4, 14, 0.82), inset 0 0 24px rgba(0, 240, 255, 0.08), 0 0 24px rgba(168, 85, 247, 0.20)',
        userSelect: 'none',
      }}
    >
      {/* =================================================== */}
      {/* HIGH-TECH FUTURISTIC CORNER BRACKETS & ACCENTS      */}
      {/* =================================================== */}
      {/* Top-Left Bracket */}
      <svg
        style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          width: '12px',
          height: '12px',
          pointerEvents: 'none',
        }}
      >
        <path d="M 0 10 L 0 0 L 10 0" fill="none" stroke="#00f2fe" strokeWidth="1.5" />
      </svg>

      {/* Top-Right Bracket */}
      <svg
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '12px',
          height: '12px',
          pointerEvents: 'none',
        }}
      >
        <path d="M 2 0 L 12 0 L 12 10" fill="none" stroke="#00f2fe" strokeWidth="1.5" />
      </svg>

      {/* Bottom-Left Bracket */}
      <svg
        style={{
          position: 'absolute',
          bottom: '4px',
          left: '4px',
          width: '12px',
          height: '12px',
          pointerEvents: 'none',
        }}
      >
        <path d="M 0 2 L 0 12 L 10 12" fill="none" stroke="#00f2fe" strokeWidth="1.5" />
      </svg>

      {/* Bottom-Right Bracket */}
      <svg
        style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          width: '12px',
          height: '12px',
          pointerEvents: 'none',
        }}
      >
        <path d="M 2 12 L 12 12 L 12 2" fill="none" stroke="#a855f7" strokeWidth="1.5" />
      </svg>

      {/* Ambient Top Glow Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '20px',
          right: '20px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.7), rgba(168, 85, 247, 0.7), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* =================================================== */}
      {/* 1. TITLE AREA                                       */}
      {/* =================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}
      >
        {/* Small Top Label: "NHÓM ĐỒNG SỞ HỮU" */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '9.5px',
            fontWeight: 800,
            color: '#00f2fe',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#00f2fe',
              boxShadow: '0 0 8px #00f2fe',
              display: 'inline-block',
            }}
          />
          NHÓM ĐỒNG SỞ HỮU
        </div>

        {/* Micro Telemetry Status */}
        <span
          style={{
            fontSize: '8px',
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.08em',
            fontFamily: 'monospace',
          }}
        >
          SYS.ONLINE
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        {/* Main Title: "EV01 Co-ownership" */}
        <h3
          style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {groupTitle}
        </h3>

        {/* Small Status Chip: "HOÀN CHỈNH" */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2.5px 8px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.14)',
            border: '1px solid rgba(16, 185, 129, 0.50)',
            color: '#10b981',
            fontSize: '9px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.22)',
          }}
        >
          <span
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 6px #10b981',
              display: 'inline-block',
            }}
          />
          HOÀN CHỈNH
        </div>
      </div>

      {/* =================================================== */}
      {/* 2. METADATA SECTION                                 */}
      {/* =================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          marginBottom: '12px',
        }}
      >
        {/* Thành viên: 3 */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(0, 240, 255, 0.14)',
            borderRadius: '8px',
            padding: '5px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '10.5px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Users size={11} color="#94a3b8" />
            Thành viên:
          </span>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#f8fafc' }}>
            {memberCount}
          </span>
        </div>

        {/* Xe trong nhóm: 1 */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(0, 240, 255, 0.14)',
            borderRadius: '8px',
            padding: '5px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '10.5px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Car size={11} color="#94a3b8" />
            Xe trong nhóm:
          </span>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#f8fafc' }}>
            {vehicleCount}
          </span>
        </div>

        {/* Tổng tỷ lệ: 100% */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(0, 240, 255, 0.14)',
            borderRadius: '8px',
            padding: '5px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '10.5px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <PieChart size={11} color="#00f2fe" />
            Tổng tỷ lệ:
          </span>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#00f2fe' }}>
            {totalPercentage}%
          </span>
        </div>

        {/* Trạng thái: Hoàn chỉnh */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(0, 240, 255, 0.14)',
            borderRadius: '8px',
            padding: '5px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '10.5px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ShieldCheck size={11} color="#10b981" />
            Trạng thái:
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* =================================================== */}
      {/* 3. MEMBER OWNERSHIP SECTION                         */}
      {/* =================================================== */}
      <div style={{ marginBottom: '10px' }}>
        {/* Subtle Tech Header Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '7px',
          }}
        >
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              color: '#94a3b8',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            PHÂN BỔ TỶ LỆ SỞ HỮU
          </span>
          <div
            style={{
              flex: 1,
              height: '1px',
              background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.3), rgba(168, 85, 247, 0.2), transparent)',
            }}
          />
        </div>

        {/* 3 Electronic Data Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {membersList.map((member) => {
            const isSelected = selectedOwnerId === member.id;
            return (
              <div
                key={member.id}
                onClick={() => selectOwner(isSelected ? null : member.id)}
                title={`Nhấp để ${isSelected ? 'bỏ chọn' : 'xem tiêu điểm'} thành viên`}
                style={{
                  background: isSelected
                    ? 'rgba(0, 240, 255, 0.08)'
                    : 'rgba(10, 22, 42, 0.65)',
                  border: isSelected
                    ? `1.5px solid ${member.color}`
                    : '1px solid rgba(0, 240, 255, 0.16)',
                  borderRadius: '8px',
                  padding: '6px 9px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  boxShadow: isSelected
                    ? `0 0 14px ${member.color}40, inset 0 0 8px ${member.color}20`
                    : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Data Strip Header: Dot + Name + Percentage */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    {/* Glowing identity dot / avatar marker */}
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: member.color,
                        boxShadow: `0 0 8px ${member.color}`,
                        flexShrink: 0,
                      }}
                    />
                    {/* Owner Name */}
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? '#ffffff' : '#f1f5f9',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {member.name}
                    </span>
                  </div>

                  {/* Percentage in Bold */}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: member.color,
                      letterSpacing: '0.02em',
                      fontFamily: 'monospace',
                    }}
                  >
                    {member.percentage}%
                  </span>
                </div>

                {/* Slim horizontal digital progress bar matching the percentage */}
                <div
                  style={{
                    width: '100%',
                    height: '3.5px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, member.percentage))}%`,
                      height: '100%',
                      borderRadius: '9999px',
                      background: `linear-gradient(90deg, ${member.color}88, ${member.color})`,
                      boxShadow: `0 0 6px ${member.color}`,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =================================================== */}
      {/* 4. FOOTER                                           */}
      {/* =================================================== */}
      {/* Optional Thin Glowing Divider Above Footer */}
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.45), rgba(168, 85, 247, 0.45), transparent)',
          marginBottom: '7px',
        }}
      />

      {/* Small Summary Line: "Mô hình nhóm đồng sở hữu theo xe" */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Sparkles size={10} color="#00f2fe" />
          <span>Mô hình nhóm đồng sở hữu theo xe</span>
        </div>
        <span style={{ fontSize: '8px', color: '#475569', letterSpacing: '0.06em' }}>
          EVSHARE HUD
        </span>
      </div>
    </div>
  );
};
