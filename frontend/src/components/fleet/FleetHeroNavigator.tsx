import React, { useMemo } from 'react';
import { VehicleResponse, VehicleStatus } from '../../types/vehicle';
import {
  resolveVehicleCode,
  resolveVehicleDisplayName,
  resolveVehicleSecondaryIdentifier,
  isMatchingVehicle,
} from '../three/vehicles/vehicleModelConfig';
import { useWorldStore } from '../../store/worldStore';
import { ChevronLeft, ChevronRight, BatteryCharging, Zap } from 'lucide-react';

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

/**
 * FleetHeroNavigator
 * Single authoritative selected vehicle information bar:
 * Format: EVShare Demo EV • EV01 · 51E-123.45 • 70% · Sẵn sàng
 * Positioned cleanly near top bar to prevent blocking 3D vehicle roof/silhouette.
 */
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

  const isRegistrationReviewModalOpen = useWorldStore((state) => state.isRegistrationReviewModalOpen);

  if (!visible || !selectedVehicle || vehicles.length === 0 || isRegistrationReviewModalOpen) return null;

  const code = resolveVehicleCode(selectedVehicle);
  const displayName = resolveVehicleDisplayName(selectedVehicle, code);
  const secondaryIdentifier = resolveVehicleSecondaryIdentifier(selectedVehicle, code);
  const statusMeta = getStatusMeta(selectedVehicle.status);
  const battery = selectedVehicle.currentBatteryLevel ?? 0;
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
      {/* Authoritative Selected Vehicle Information Bar (Section 7) */}
      <div
        style={{
          position: 'absolute',
          top: '84px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 8,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(7, 20, 38, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.2px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '9999px',
          padding: '6px 18px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(0, 242, 254, 0.15)',
          color: '#ffffff',
          fontSize: '12px',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s ease',
        }}
      >
        {/* 1. Vehicle Display Name */}
        <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 900, letterSpacing: '0.02em' }}>
          {displayName}
        </span>

        <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '12px' }}>•</span>

        {/* 2. Secondary Identifier: Code · Plate */}
        <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em' }}>
          {secondaryIdentifier}
        </span>

        <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '12px' }}>•</span>

        {/* 3. Real Persisted Battery % · Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00f2fe', fontWeight: 800 }}>
            {isCharging ? <BatteryCharging size={13} color="#00f2fe" /> : <Zap size={12} color="#00f2fe" />}
            <span style={{ fontSize: '12px' }}>{battery}%</span>
          </div>

          <span style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '11px' }}>·</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: statusMeta.dotColor,
                boxShadow: `0 0 8px ${statusMeta.dotColor}`,
              }}
            />
            <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}>
              {statusMeta.labelVi}
            </span>
          </div>
        </div>
      </div>

      {/* Left Circular Navigation Chevron Button (<) */}
      <button
        type="button"
        onClick={handlePrev}
        title="Xe trước đó"
        style={{
          position: 'absolute',
          top: '56%',
          left: '32%',
          transform: 'translate(-50%, -50%)',
          zIndex: 8,
          pointerEvents: 'auto',
          width: '44px',
          height: '44px',
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
        <ChevronLeft size={20} />
      </button>

      {/* Right Circular Navigation Chevron Button (>) */}
      <button
        type="button"
        onClick={handleNext}
        title="Xe tiếp theo"
        style={{
          position: 'absolute',
          top: '56%',
          left: '68%',
          transform: 'translate(-50%, -50%)',
          zIndex: 8,
          pointerEvents: 'auto',
          width: '44px',
          height: '44px',
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
        <ChevronRight size={20} />
      </button>
    </>
  );
};
