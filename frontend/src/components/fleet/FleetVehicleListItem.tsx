import React from 'react';
import { VehicleResponse, VehicleStatus } from '../../types/vehicle';
import { resolveVehicleCode } from '../three/vehicles/vehicleModelConfig';

interface FleetVehicleListItemProps {
  vehicle: VehicleResponse;
  index: number;
  isSelected: boolean;
  onSelect: (vehicle: VehicleResponse) => void;
}

function getStatusMeta(status?: VehicleStatus) {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'AVAILABLE':
      return { labelVi: 'Sẵn sàng', dotColor: '#10b981' };
    case 'CHARGING':
      return { labelVi: 'Đang sạc', dotColor: '#00f2fe' };
    case 'MAINTENANCE':
    case 'IN_SERVICE':
      return { labelVi: 'Bảo dưỡng', dotColor: '#f87171' };
    case 'RESERVED':
      return { labelVi: 'Bàn giao', dotColor: '#f59e0b' };
    case 'IN_USE':
      return { labelVi: 'Đang sử dụng', dotColor: '#a855f7' };
    default:
      return { labelVi: status || 'Sẵn sàng', dotColor: '#94a3b8' };
  }
}

export const FleetVehicleListItem: React.FC<FleetVehicleListItemProps> = ({
  vehicle,
  index,
  isSelected,
  onSelect,
}) => {
  const code = resolveVehicleCode(vehicle);
  const statusMeta = getStatusMeta(vehicle.status);
  const indexStr = String(index + 1).padStart(2, '0');

  const accentColor =
    code === 'EV01' ? '#00f2fe' : code === 'EV02' ? '#f59e0b' : '#38bdf8';

  return (
    <div
      onClick={() => onSelect(vehicle)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 10px',
        borderRadius: '10px',
        cursor: 'pointer',
        background: isSelected
          ? 'linear-gradient(90deg, rgba(0, 242, 254, 0.22) 0%, rgba(13, 27, 42, 0.88) 100%)'
          : 'rgba(15, 23, 42, 0.65)',
        border: isSelected
          ? '1.5px solid rgba(0, 242, 254, 0.85)'
          : '1px solid rgba(56, 189, 248, 0.15)',
        boxShadow: isSelected
          ? '0 0 14px rgba(0, 242, 254, 0.28), inset 0 0 8px rgba(0, 242, 254, 0.12)'
          : 'none',
        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.45)';
          e.currentTarget.style.background = 'rgba(20, 32, 52, 0.85)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.15)';
          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.65)';
        }
      }}
    >
      {/* Index Number */}
      <span
        style={{
          fontSize: '12px',
          fontWeight: 800,
          color: isSelected ? '#00f2fe' : '#94a3b8',
          letterSpacing: '0.04em',
          width: '20px',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {indexStr}
      </span>

      {/* Mini Vehicle Preview Silhouette Chip */}
      <div
        style={{
          width: '36px',
          height: '24px',
          borderRadius: '5px',
          background: isSelected
            ? 'rgba(0, 242, 254, 0.18)'
            : 'rgba(255, 255, 255, 0.06)',
          border: `1px solid ${isSelected ? accentColor : 'rgba(255, 255, 255, 0.12)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox="0 0 36 20"
          width="28"
          height="16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 14C3.44772 14 3 13.5523 3 13V11.5C3 10.9477 3.44772 10.5 4 10.5L6.5 10.5L10 6.5C10.5 5.9 11.2 5.5 12 5.5H23C23.8 5.5 24.5 5.9 25 6.5L28.5 10.5L31 10.5C31.5523 10.5 32 10.9477 32 11.5V13C32 13.5523 31.5523 14 31 14H29.5C29.5 15.3807 28.3807 16.5 27 16.5C25.6193 16.5 24.5 15.3807 24.5 14H11.5C11.5 15.3807 10.3807 16.5 9 16.5C7.61929 16.5 6.5 15.3807 6.5 14H4Z"
            fill={accentColor}
            fillOpacity={isSelected ? 0.95 : 0.65}
          />
          <circle cx="9" cy="14" r="2.2" fill="#0f172a" stroke={accentColor} strokeWidth="1" />
          <circle cx="27" cy="14" r="2.2" fill="#0f172a" stroke={accentColor} strokeWidth="1" />
          <path
            d="M11.5 7.5H16.5V10.5H8L11.5 7.5Z"
            fill="#ffffff"
            fillOpacity="0.4"
          />
          <path
            d="M18 7.5H23L26.5 10.5H18V7.5Z"
            fill="#ffffff"
            fillOpacity="0.4"
          />
        </svg>
      </div>

      {/* Vehicle Info: Code & Status */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: isSelected ? '#ffffff' : '#e2e8f0',
              letterSpacing: '0.05em',
            }}
          >
            {code}
          </span>
        </div>

        {/* Status Dot & Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: statusMeta.dotColor,
              boxShadow: `0 0 6px ${statusMeta.dotColor}`,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '11px',
              color: isSelected ? '#e2e8f0' : '#94a3b8',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {statusMeta.labelVi}
          </span>
        </div>
      </div>
    </div>
  );
};
