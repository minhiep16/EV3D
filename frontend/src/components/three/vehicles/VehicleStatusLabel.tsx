import React from 'react';
import { Html } from '@react-three/drei';
import { VEHICLE_STATUS_LABELS, VehicleStatus, useWorldStore } from '../../../store/worldStore';
import { isGarageZoneFocused } from '../../../config/garageZoneVisibility';
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
  const selectedZone = useWorldStore((state) => state.selectedZone);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const isVehicleSelected = useWorldStore((state) => state.isVehicleSelected);
  const vehicleBookingMode = useWorldStore((state) => state.vehicleBookingMode);
  const vehicleCoOwnershipMode = useWorldStore((state) => state.vehicleCoOwnershipMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);
  const vehicleReceiptReviewMode = useWorldStore((state) => state.vehicleReceiptReviewMode);
  const vehicleTripStartMode = useWorldStore((state) => state.vehicleTripStartMode);
  const vehicleTripVisualizationMode = useWorldStore((state) => state.vehicleTripVisualizationMode);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const isRegistrationReviewModalOpen = useWorldStore((state) => state.isRegistrationReviewModalOpen);

  // When review modal is active, vehicle is selected, or any zone is focused, hide this status pill completely
  if (
    isRegistrationReviewModalOpen ||
    isSelected ||
    isGarageZoneFocused({
      selectedZone,
      selectedVehicleId,
      isVehicleSelected,
      vehicleBookingMode,
      vehicleCoOwnershipMode,
      vehicleHandoverMode,
      vehicleReceiptReviewMode,
      vehicleTripStartMode,
      vehicleTripVisualizationMode,
      vehicleDamageMappingMode,
      vehicleInspectionMode,
    })
  ) {
    return null;
  }

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

        {/* Primary: Real vehicle name, Secondary: Code */}
        <span style={{ color: '#ffffff', fontWeight: 800 }}>{name}</span>
        <span style={{ color: '#64748b' }}>•</span>
        <span style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 700 }}>{id}</span>

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
