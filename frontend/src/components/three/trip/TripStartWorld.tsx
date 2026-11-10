import React from 'react';
import { VehicleResponse } from '../../../types/vehicle';

interface TripStartWorldProps {
  vehicle: VehicleResponse;
}

/**
 * 3D Canvas representation during Trip Start mode.
 * The Trip Start form is rendered in screen space via CoOwnerTripStartPanel
 * in GarageScene to prevent obstructing the 3D vehicle in the showroom.
 */
export const TripStartWorld: React.FC<TripStartWorldProps> = () => {
  return null;
};
