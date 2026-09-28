import React from 'react';
import { VehicleResponse, VehicleStatus } from '../../types/vehicle';
import { resolveVehicleCode } from '../three/vehicles/vehicleModelConfig';
import { resolveVehicleSlot } from '../../config/garageSlotConfig';
import { Battery, BatteryCharging, Zap, MapPin } from 'lucide-react';

interface FleetVehicleItemProps {
  vehicle: VehicleResponse;
  isSelected: boolean;
  role?: string;
  allVehicles?: VehicleResponse[];
  onSelect: (vehicle: VehicleResponse) => void;
}

interface StatusBadgeMeta {
  labelVi: string;
  color: string;
  bg: string;
  border: string;
}

function getStatusMeta(status?: VehicleStatus): StatusBadgeMeta {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'AVAILABLE':
      return {
        labelVi: 'Sẵn sàng',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.4)',
      };
    case 'CHARGING':
      return {
        labelVi: 'Đang sạc',
        color: '#00f2fe',
        bg: 'rgba(0, 242, 254, 0.15)',
        border: 'rgba(0, 242, 254, 0.4)',
      };
    case 'MAINTENANCE':
      return {
        labelVi: 'Bảo dưỡng',
        color: '#f87171',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
      };
    case 'RESERVED':
      return {
        labelVi: 'Bàn giao',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.4)',
      };
    case 'IN_USE':
      return {
        labelVi: 'Đang sử dụng',
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.15)',
        border: 'rgba(168, 85, 247, 0.4)',
      };
    default:
      return {
        labelVi: status || 'Hoạt động',
        color: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.15)',
        border: 'rgba(148, 163, 184, 0.3)',
      };
  }
}

export const FleetVehicleItem: React.FC<FleetVehicleItemProps> = ({
  vehicle,
  isSelected,
  role,
  allVehicles,
  onSelect,
}) => {
  const code = resolveVehicleCode(vehicle);
  const statusMeta = getStatusMeta(vehicle.status);
  const slot = resolveVehicleSlot(vehicle, role, allVehicles);
  const battery = vehicle.currentBatteryLevel ?? 0;
  const isCharging = (vehicle.status || '').toUpperCase() === 'CHARGING';

  const codeColor =
    code === 'EV01' ? '#00f2fe' : code === 'EV02' ? '#f59e0b' : '#38bdf8';

  return (
    <div
      onClick={() => onSelect(vehicle)}
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.22) 0%, rgba(13, 27, 42, 0.95) 100%)'
          : 'rgba(13, 27, 42, 0.78)',
        backdropFilter: 'blur(16px)',
        border: isSelected
          ? '1.5px solid rgba(0, 242, 254, 0.85)'
          : '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '12px',
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isSelected
          ? '0 6px 20px rgba(0, 0, 0, 0.35), 0 0 16px rgba(0, 242, 254, 0.28)'
          : '0 4px 14px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '7px',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.55)';
          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.9)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)';
          e.currentTarget.style.background = 'rgba(13, 27, 42, 0.78)';
          e.currentTarget.style.transform = 'none';
        }
      }}
    >
      {/* Top Row: Code Badge, Vehicle Name & Status Pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {/* Vehicle Code Pill */}
          <span
            style={{
              background: `rgba(${code === 'EV01' ? '0, 242, 254' : code === 'EV02' ? '245, 158, 11' : '56, 189, 248'}, 0.16)`,
              border: `1px solid ${codeColor}`,
              color: codeColor,
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              padding: '2px 7px',
              borderRadius: '6px',
              flexShrink: 0,
            }}
          >
            {code}
          </span>

          {/* Vehicle Name */}
          <span
            style={{
              color: isSelected ? '#ffffff' : '#e2e8f0',
              fontSize: '13px',
              fontWeight: isSelected ? 700 : 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={vehicle.name}
          >
            {vehicle.name || (code === 'EV01' ? 'Xe điện thực tế' : 'Xe thử nghiệm tương tác')}
          </span>
        </div>

        {/* Status Pill */}
        <span
          style={{
            background: statusMeta.bg,
            border: `1px solid ${statusMeta.border}`,
            color: statusMeta.color,
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.03em',
            padding: '2px 7px',
            borderRadius: '9999px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: statusMeta.color,
              boxShadow: `0 0 6px ${statusMeta.color}`,
            }}
          />
          {statusMeta.labelVi}
        </span>
      </div>

      {/* Bottom Row: Bay Location & Battery State */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#94a3b8',
          paddingTop: '2px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Assigned Garage Bay */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
          <MapPin size={11} color={slot.accentColor || '#38bdf8'} />
          <span
            style={{
              color: '#cbd5e1',
              fontSize: '11px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={slot.nameVi}
          >
            {slot.nameVi.split('—')[0].trim()}
          </span>
        </div>

        {/* Battery Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {isCharging ? (
            <BatteryCharging size={13} color="#00f2fe" />
          ) : (
            <Battery
              size={13}
              color={battery >= 50 ? '#10b981' : battery >= 20 ? '#f59e0b' : '#ef4444'}
            />
          )}
          <span
            style={{
              fontWeight: 700,
              color: isCharging ? '#00f2fe' : battery >= 50 ? '#34d399' : '#fbbf24',
              fontSize: '11px',
            }}
          >
            {battery}%
          </span>
        </div>
      </div>
    </div>
  );
};
