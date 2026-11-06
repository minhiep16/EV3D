import React from 'react';
import { VehicleResponse } from '../../../types/vehicle';

interface StaffVehicleControlLayerProps {
  vehicle: VehicleResponse;
  heroAnchor: [number, number, number];
  visible?: boolean;
}

/**
 * StaffVehicleControlLayer
 * The floating 3D scanner / purple "KIỂM TRA 3D" button has been removed from the showroom platform.
 * 3D inspection workflows remain accessible from the right-side operational control center.
 */
export const StaffVehicleControlLayer: React.FC<StaffVehicleControlLayerProps> = () => {
  return null;
};
