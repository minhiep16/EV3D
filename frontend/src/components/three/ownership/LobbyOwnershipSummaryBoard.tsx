import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { CoOwnershipGroupResponse } from '../../../types/coOwnership';
import { fetchVehicleCoOwnership } from '../../../services/coOwnershipApi';
import { resolveVehicleCode } from '../vehicles/vehicleModelConfig';
import { PieChart, ChevronDown } from 'lucide-react';

interface LobbyOwnershipSummaryBoardProps {
  vehicle?: VehicleResponse | null;
}

interface ShareRow {
  id: string;
  name: string;
  percentage: number;
  color: string;
}

const MEMBER_COLORS = [
  '#00f2fe', // Cyan / Electric Blue (Nguyen Van A - 40%)
  '#a855f7', // Soft Purple (Tran Thi B - 30%)
  '#10b981', // Neon / Emerald Green (Le Van C - 30%)
  '#38bdf8', // Sky Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
];

export const LobbyOwnershipSummaryBoard: React.FC<LobbyOwnershipSummaryBoardProps> = ({
  vehicle,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const vehicleId = vehicle?.id;
  const vehicleCode = resolveVehicleCode(vehicle) || vehicle?.name || 'EV01';

  // Authoritative TanStack Query: Reuses existing co-ownership data
  const { data: coOwnership } = useQuery<CoOwnershipGroupResponse>({
    queryKey: ['coOwnership', vehicleId],
    queryFn: () => (vehicleId ? fetchVehicleCoOwnership(vehicleId) : Promise.reject('No vehicleId')),
    enabled: Boolean(vehicleId),
    staleTime: 15000,
  });

  // Extract member rows from real co-ownership data with reliable fallback to specification
  const memberRows: ShareRow[] = useMemo(() => {
    if (coOwnership?.members && coOwnership.members.length > 0) {
      const active = coOwnership.members.filter((m) => m.status === 'ACTIVE');
      if (active.length > 0) {
        const sorted = [...active].sort(
          (a, b) => (b.share?.percentage ?? 0) - (a.share?.percentage ?? 0)
        );
        return sorted.map((member, index) => ({
          id: member.id,
          name: member.fullName,
          percentage: member.share?.percentage ?? 0,
          color: MEMBER_COLORS[index % MEMBER_COLORS.length],
        }));
      }
    }

    // Specification fallback (Nguyen Van A 40%, Tran Thi B 30%, Le Van C 30%)
    return [
      { id: 'm-1', name: 'Nguyen Van A', percentage: 40, color: '#00f2fe' },
      { id: 'm-2', name: 'Tran Thi B', percentage: 30, color: '#a855f7' },
      { id: 'm-3', name: 'Le Van C', percentage: 30, color: '#10b981' },
    ];
  }, [coOwnership?.members]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      <style>{`
        @media (max-width: 1440px) {
          .ownership-topbar-member-name {
            display: none !important;
          }
        }
        @media (max-width: 1180px) {
          .ownership-topbar-title {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Topbar Horizontal Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isHovered
            ? 'linear-gradient(135deg, rgba(8, 20, 40, 0.96) 0%, rgba(12, 28, 54, 0.96) 100%)'
            : 'rgba(7, 20, 38, 0.90)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: isHovered
            ? '1.5px solid rgba(34, 230, 255, 0.70)'
            : '1.5px solid rgba(34, 230, 255, 0.45)',
          boxShadow: isHovered
            ? '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 20px rgba(34, 230, 255, 0.28)'
            : '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 16px rgba(34, 230, 255, 0.16)',
          borderRadius: '9999px',
          padding: '6px 14px',
          height: '34px',
          boxSizing: 'border-box',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Icon & Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <PieChart size={13} color="#22e6ff" />
          <span
            className="ownership-topbar-title"
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#22e6ff',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            TỶ LỆ SỞ HỮU
          </span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: '#94a3b8',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '1px 5px',
              borderRadius: '4px',
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
            }}
          >
            {vehicleCode}
          </span>
        </div>

        {/* Divider dot */}
        <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '10px' }}>•</span>

        {/* Member percentages list */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          {memberRows.map((row, idx) => (
            <React.Fragment key={row.id}>
              {idx > 0 && (
                <span style={{ color: 'rgba(255, 255, 255, 0.18)', fontSize: '9px' }}>
                  |
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: row.color,
                    boxShadow: `0 0 6px ${row.color}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  className="ownership-topbar-member-name"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: row.color,
                    fontFamily: 'monospace',
                    letterSpacing: '0.02em',
                  }}
                >
                  {row.percentage}%
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Subtle expand indicator */}
        <ChevronDown
          size={11}
          color="#94a3b8"
          style={{
            transform: isHovered ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            marginLeft: '2px',
          }}
        />
      </div>

      {/* Expanded Hover Popover Card */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '260px',
            background: 'linear-gradient(135deg, rgba(6, 14, 28, 0.96) 0%, rgba(9, 21, 40, 0.96) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(34, 230, 255, 0.45)',
            borderRadius: '14px',
            padding: '12px 14px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75), 0 0 20px rgba(34, 230, 255, 0.20)',
            zIndex: 100,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '9px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '6px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '10px',
                fontWeight: 800,
                color: '#22e6ff',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <PieChart size={12} color="#22e6ff" />
              <span>PHÂN BỔ TỶ LỆ SỞ HỮU</span>
            </div>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: '#94a3b8',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              {vehicleCode}
            </span>
          </div>

          {/* Member Rows with Progress Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {memberRows.map((row) => (
              <div key={row.id} style={{ display: 'flex', flexDirection: 'column', gap: '3.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: row.color,
                        boxShadow: `0 0 6px ${row.color}`,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>
                      {row.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      color: row.color,
                      fontFamily: 'monospace',
                    }}
                  >
                    {row.percentage}%
                  </span>
                </div>

                {/* Thin progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: '3px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, row.percentage))}%`,
                      height: '100%',
                      borderRadius: '9999px',
                      background: row.color,
                      boxShadow: `0 0 6px ${row.color}`,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
