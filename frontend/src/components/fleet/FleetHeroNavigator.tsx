import React, { useMemo } from 'react';
import { VehicleResponse } from '../../types/vehicle';
import { isMatchingVehicle } from '../three/vehicles/vehicleModelConfig';
import { useWorldStore } from '../../store/worldStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FleetHeroNavigatorProps {
  vehicles: VehicleResponse[];
  selectedVehicle: VehicleResponse | null;
  onSelectVehicle: (vehicle: VehicleResponse) => void;
  visible?: boolean;
}

/**
 * FleetHeroNavigator
 * Hero vehicle navigation controls (left & right chevrons) to cycle through the fleet in 3D showroom.
 * The redundant top-center floating vehicle information banner has been completely removed,
 * preserving only the sleek circular navigation chevron controls.
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
