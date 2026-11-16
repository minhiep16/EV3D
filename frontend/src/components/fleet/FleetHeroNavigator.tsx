import React, { useMemo, useState, useEffect } from 'react';
import { VehicleResponse } from '../../types/vehicle';
import { isMatchingVehicle } from '../three/vehicles/vehicleModelConfig';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FleetHeroNavigatorProps {
  vehicles: VehicleResponse[];
  selectedVehicle: VehicleResponse | null;
  onSelectVehicle: (vehicle: VehicleResponse) => void;
  visible?: boolean;
  role?: string;
}

/**
 * FleetHeroNavigator
 * Hero vehicle navigation controls (left & right chevrons) to cycle through the fleet in 3D showroom.
 * Positioned symmetrically across the unobstructed 3D viewing region, dynamically adjusting when
 * the right operational details panel opens or closes.
 */
export const FleetHeroNavigator: React.FC<FleetHeroNavigatorProps> = ({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  visible = true,
  role: propRole,
}) => {
  const user = useAuthStore((state) => state.user);
  const currentRole = propRole || user?.role;
  const isOperationsRole = currentRole === 'STAFF' || currentRole === 'ADMIN';

  const currentIndex = useMemo(() => {
    if (!selectedVehicle || vehicles.length === 0) return 0;
    const idx = vehicles.findIndex((v) => isMatchingVehicle(v, selectedVehicle.id));
    return idx >= 0 ? idx : 0;
  }, [vehicles, selectedVehicle]);

  const isVehicleDetailOpen = useWorldStore((state) => state.isVehicleDetailOpen);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const vehicleDamageHistoryMode = useWorldStore((state) => state.vehicleDamageHistoryMode);
  const vehicleMaintenanceMode = useWorldStore((state) => state.vehicleMaintenanceMode);
  const vehicleBatteryXrayMode = useWorldStore((state) => state.vehicleBatteryXrayMode);
  const vehicleChargingMode = useWorldStore((state) => state.vehicleChargingMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);
  const activePrimaryPanel = useWorldStore((state) => state.activePrimaryPanel);
  const isRegistrationReviewModalOpen = useWorldStore((state) => state.isRegistrationReviewModalOpen);

  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );

  const isDesktop = viewportWidth >= 1024;

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isRightPanelOpen = useMemo(() => {
    if (activePrimaryPanel === 'NOTIFICATIONS') return false;
    return Boolean(
      activePrimaryPanel === 'AI_ASSISTANT' ||
      isVehicleDetailOpen ||
      vehicleInspectionMode ||
      vehicleDamageMappingMode ||
      vehicleDamageHistoryMode ||
      vehicleMaintenanceMode ||
      vehicleBatteryXrayMode ||
      vehicleChargingMode ||
      vehicleHandoverMode
    );
  }, [
    activePrimaryPanel,
    isVehicleDetailOpen,
    vehicleInspectionMode,
    vehicleDamageMappingMode,
    vehicleDamageHistoryMode,
    vehicleMaintenanceMode,
    vehicleBatteryXrayMode,
    vehicleChargingMode,
    vehicleHandoverMode,
  ]);

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

  const panelWidth = isRightPanelOpen && isDesktop
    ? isOperationsRole ? 460 : 380
    : 0;

  const sceneWidth = viewportWidth - panelWidth;

  // Active vehicle center on screen:
  // For STAFF/ADMIN, hero vehicle is centered at viewportWidth / 2.
  // For CO_OWNER with right panel open, vehicle shifts laterally into unobstructed sceneWidth / 2.
  const centerX = isOperationsRole
    ? viewportWidth / 2
    : isRightPanelOpen && isDesktop
      ? sceneWidth / 2
      : viewportWidth / 2;

  // Horizontal spacing from vehicle center:
  // left arrow: centerX - offset
  // right arrow: centerX + offset
  // offset ≈ min(320, sceneWidth * 0.26)
  // Constrained to ensure buttons never clip behind the side panel or overlap the vehicle model
  const maxClearanceToPanel = isRightPanelOpen && isDesktop
    ? (viewportWidth - panelWidth) - centerX - 36
    : 320;
  const targetOffset = isOperationsRole
    ? Math.min(320, sceneWidth * 0.26)
    : Math.min(380, sceneWidth * 0.26);
  const offset = Math.max(160, Math.min(targetOffset, maxClearanceToPanel));

  const leftArrowLeft = isDesktop ? `${centerX - offset}px` : '18px';
  const rightArrowLeft = isDesktop ? `${centerX + offset}px` : 'auto';
  const rightArrowRight = isDesktop ? 'auto' : '18px';

  return (
    <div
      aria-label="Điều hướng danh sách xe showroom"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 8,
      }}
    >
      {/* Left Circular Navigation Chevron Button (<) */}
      <button
        type="button"
        onClick={handlePrev}
        onPointerDown={(e) => e.stopPropagation()}
        title="Xe trước đó"
        aria-label="Xe trước đó"
        style={{
          position: 'fixed',
          top: '58%',
          left: leftArrowLeft,
          transform: isDesktop ? 'translate(-50%, -50%)' : 'translateY(-50%)',
          pointerEvents: 'auto',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(8, 16, 28, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          color: '#00f2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 242, 254, 0.15)',
          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s, border-color 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 242, 254, 0.25)';
          e.currentTarget.style.borderColor = '#00f2fe';
          e.currentTarget.style.transform = isDesktop ? 'translate(-50%, -50%) scale(1.08)' : 'translateY(-50%) scale(1.08)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 242, 254, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(8, 16, 28, 0.82)';
          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
          e.currentTarget.style.transform = isDesktop ? 'translate(-50%, -50%) scale(1.0)' : 'translateY(-50%) scale(1.0)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 242, 254, 0.15)';
        }}
      >
        <ChevronLeft size={20} />
      </button>

      {/* Right Circular Navigation Chevron Button (>) */}
      <button
        type="button"
        onClick={handleNext}
        onPointerDown={(e) => e.stopPropagation()}
        title="Xe tiếp theo"
        aria-label="Xe tiếp theo"
        style={{
          position: 'fixed',
          top: '58%',
          left: rightArrowLeft,
          right: rightArrowRight,
          transform: isDesktop ? 'translate(-50%, -50%)' : 'translateY(-50%)',
          pointerEvents: 'auto',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(8, 16, 28, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          color: '#00f2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 242, 254, 0.15)',
          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s, border-color 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 242, 254, 0.25)';
          e.currentTarget.style.borderColor = '#00f2fe';
          e.currentTarget.style.transform = isDesktop ? 'translate(-50%, -50%) scale(1.08)' : 'translateY(-50%) scale(1.08)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 242, 254, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(8, 16, 28, 0.82)';
          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
          e.currentTarget.style.transform = isDesktop ? 'translate(-50%, -50%) scale(1.0)' : 'translateY(-50%) scale(1.0)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 242, 254, 0.15)';
        }}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};
