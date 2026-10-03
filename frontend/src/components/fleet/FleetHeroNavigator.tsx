import React, { useMemo } from 'react';
import { VehicleResponse, VehicleStatus } from '../../types/vehicle';
import { resolveVehicleCode, isMatchingVehicle } from '../three/vehicles/vehicleModelConfig';
import { ChevronLeft, ChevronRight, Battery, BatteryCharging } from 'lucide-react';

interface FleetHeroNavigatorProps {
  vehicles: VehicleResponse[];
  selectedVehicle: VehicleResponse | null;
  onSelectVehicle: (vehicle: VehicleResponse) => void;
  visible?: boolean;
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

export const FleetHeroNavigator: React.FC<FleetHeroNavigatorProps> = ({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  visible = true,
}) => {
  const currentIndex = useMemo(() => {
    if (!selectedVehicle || vehicles.length === 0) return 0;
    const idx = vehicles.findIndex((v) => isMatchingVehicle(v, selectedVehicle.id));
    return idx >= 0 ? idx : 0;
  }, [vehicles, selectedVehicle]);

  if (!visible || !selectedVehicle || vehicles.length === 0) return null;

  const code = resolveVehicleCode(selectedVehicle);
  const statusMeta = getStatusMeta(selectedVehicle.status);
  const battery = selectedVehicle.currentBatteryLevel ?? 82;
  const isCharging = (selectedVehicle.status || '').toUpperCase() === 'CHARGING';

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIdx = (currentIndex - 1 + vehicles.length) % vehicles.length;
    onSelectVehicle(vehicles[prevIdx]);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (currentIndex + 1) % vehicles.length;
    onSelectVehicle(vehicles[nextIdx]);
  };

  return (
    <>
      {/* Floating Status Pill Centered Above Hero Vehicle */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '49%',
          transform: 'translate(-50%, -50%)',
          zIndex: 8,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(8, 16, 28, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(0, 242, 254, 0.45)',
          borderRadius: '9999px',
          padding: '6px 18px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 16px rgba(0, 242, 254, 0.2)',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          userSelect: 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Vehicle Code Pill */}
        <span
          style={{
            background: 'rgba(0, 242, 254, 0.2)',
            border: '1px solid rgba(0, 242, 254, 0.6)',
            color: '#00f2fe',
            fontSize: '11px',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '6px',
            letterSpacing: '0.06em',
          }}
        >
          {code}
        </span>

        {/* Status Dot + Vietnamese Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: statusMeta.dotColor,
              boxShadow: `0 0 8px ${statusMeta.dotColor}`,
            }}
          />
          <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{statusMeta.labelVi}</span>
        </div>

        {/* Battery Level */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38bdf8' }}>
          {isCharging ? (
            <BatteryCharging size={14} color="#00f2fe" />
          ) : (
            <Battery
              size={14}
              color={battery >= 50 ? '#10b981' : battery >= 20 ? '#f59e0b' : '#ef4444'}
            />
          )}
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>{battery}%</span>
        </div>
      </div>

      {/* Left Circular Navigation Chevron Button (<) */}
      <button
        type="button"
        onClick={handlePrev}
        title="Xe trước đó"
        style={{
          position: 'absolute',
          top: '60%',
          left: '32%',
          transform: 'translate(-50%, -50%)',
          zIndex: 8,
          pointerEvents: 'auto',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'rgba(8, 16, 28, 0.82)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          color: '#00f2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 242, 254, 0.15)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 242, 254, 0.25)';
          e.currentTarget.style.borderColor = '#00f2fe';
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 242, 254, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(8, 16, 28, 0.82)';
          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.0)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 242, 254, 0.15)';
        }}
      >
        <ChevronLeft size={22} />
      </button>

      {/* Right Circular Navigation Chevron Button (>) */}
      <button
        type="button"
        onClick={handleNext}
        title="Xe tiếp theo"
        style={{
          position: 'absolute',
          top: '60%',
          left: '68%',
          transform: 'translate(-50%, -50%)',
          zIndex: 8,
          pointerEvents: 'auto',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'rgba(8, 16, 28, 0.82)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          color: '#00f2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 242, 254, 0.15)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 242, 254, 0.25)';
          e.currentTarget.style.borderColor = '#00f2fe';
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 242, 254, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(8, 16, 28, 0.82)';
          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.0)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 242, 254, 0.15)';
        }}
      >
        <ChevronRight size={22} />
      </button>
    </>
  );
};
