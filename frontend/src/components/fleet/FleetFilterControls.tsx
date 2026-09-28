import React from 'react';

export type FleetFilterKey =
  | 'ALL'
  | 'AVAILABLE'
  | 'CHARGING'
  | 'MAINTENANCE'
  | 'RESERVED'
  | 'IN_USE';

interface FleetFilterOption {
  key: FleetFilterKey;
  labelVi: string;
}

const FILTER_OPTIONS: FleetFilterOption[] = [
  { key: 'ALL', labelVi: 'TẤT CẢ' },
  { key: 'AVAILABLE', labelVi: 'SẴN SÀNG' },
  { key: 'CHARGING', labelVi: 'ĐANG SẠC' },
  { key: 'MAINTENANCE', labelVi: 'BẢO DƯỠNG' },
  { key: 'RESERVED', labelVi: 'BÀN GIAO' },
  { key: 'IN_USE', labelVi: 'ĐANG SỬ DỤNG' },
];

interface FleetFilterControlsProps {
  activeFilter: FleetFilterKey;
  counts: Record<FleetFilterKey, number>;
  onFilterChange: (filter: FleetFilterKey) => void;
}

export const FleetFilterControls: React.FC<FleetFilterControlsProps> = ({
  activeFilter,
  counts,
  onFilterChange,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        padding: '2px 0 6px 0',
      }}
    >
      {FILTER_OPTIONS.map((opt) => {
        const isActive = activeFilter === opt.key;
        const count = counts[opt.key] ?? 0;

        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onFilterChange(opt.key)}
            style={{
              background: isActive
                ? 'rgba(0, 242, 254, 0.22)'
                : 'rgba(15, 23, 42, 0.65)',
              border: isActive
                ? '1px solid rgba(0, 242, 254, 0.75)'
                : '1px solid rgba(56, 189, 248, 0.18)',
              color: isActive ? '#00f2fe' : '#94a3b8',
              borderRadius: '9999px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: isActive ? 700 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              letterSpacing: '0.04em',
              transition: 'all 0.18s ease',
              boxShadow: isActive ? '0 0 10px rgba(0, 242, 254, 0.25)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.45)';
                e.currentTarget.style.color = '#e2e8f0';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.18)';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            <span>{opt.labelVi}</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '9999px',
                background: isActive
                  ? 'rgba(0, 242, 254, 0.35)'
                  : 'rgba(30, 41, 59, 0.8)',
                color: isActive ? '#ffffff' : '#64748b',
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
