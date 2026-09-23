import React from 'react';
import { Html } from '@react-three/drei';
import { VEHICLE_STATUS_LABELS, VehicleStatus } from '../../../store/worldStore';
import { BatteryCharging, Zap } from 'lucide-react';

interface VehicleStatusLabelProps {
  id: string;
  name: string;
  status: VehicleStatus;
  batteryLevel: number;
  isSelected: boolean;
  isHovered: boolean;
}

export const VehicleStatusLabel: React.FC<VehicleStatusLabelProps> = ({
  id,
  name,
  status,
  batteryLevel,
  isSelected,
  isHovered,
}) => {
  // When vehicle is selected, hide this compact summary strip completely
  if (isSelected) return null;

  const statusConfig = VEHICLE_STATUS_LABELS[status] || VEHICLE_STATUS_LABELS.AVAILABLE;

  return (
    <Html
      position={[0, 1.85, 0]}
      center
      distanceFactor={9.5}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <div
        style={{
          background: isSelected
            ? 'rgba(8, 12, 22, 0.95)'
            : isHovered
            ? 'rgba(10, 15, 29, 0.88)'
            : 'rgba(10, 15, 29, 0.72)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${isSelected ? '#00f2fe' : isHovered ? '#38bdf8' : 'rgba(56, 189, 248, 0.25)'}`,
          borderRadius: '9999px',
          padding: '5px 14px',
          color: '#ffffff',
          fontFamily: 'var(--font-family)',
          fontSize: '11px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: isSelected
            ? '0 0 25px rgba(0, 242, 254, 0.5), 0 10px 25px rgba(0, 0, 0, 0.7)'
            : isHovered
            ? '0 0 15px rgba(56, 189, 248, 0.35)'
            : 'none',
          transform: isSelected ? 'scale(1.05)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Status Dot */}
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: statusConfig.color,
            boxShadow: `0 0 8px ${statusConfig.color}`,
          }}
        />

        {/* Vehicle ID & Name */}
        <span style={{ color: '#f8fafc', letterSpacing: '0.04em' }}>{id}</span>
        <span style={{ color: '#64748b' }}>|</span>
        <span style={{ color: '#94a3b8', fontWeight: 600 }}>{name}</span>

        {/* Status Tag */}
        <span
          style={{
            background: statusConfig.bg,
            color: statusConfig.color,
            padding: '1px 7px',
            borderRadius: '9999px',
            fontSize: '10px',
            fontWeight: 700,
          }}
        >
          {statusConfig.label}
        </span>

        {/* Battery Level */}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            color: '#38bdf8',
            fontSize: '10px',
            fontWeight: 700,
            background: 'rgba(56, 189, 248, 0.12)',
            padding: '1px 6px',
            borderRadius: '9999px',
          }}
        >
          <Zap size={10} color="#00f2fe" />
          {batteryLevel}%
        </span>
      </div>
    </Html>
  );
};
