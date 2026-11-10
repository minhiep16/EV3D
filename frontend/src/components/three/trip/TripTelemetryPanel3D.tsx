import React from 'react';
import { ActiveTripDetailPanel, ActiveTripDetailPanelProps } from './ActiveTripDetailPanel';
import { VehicleResponse } from '../../../types/vehicle';
import { TripData } from '../../../types/trip';

export type CheckoutStep = 'TELEMETRY' | 'PREPARE_CHECKOUT' | 'CONFIRM_CHECKOUT' | 'CHECKOUT_COMPLETED';

export interface TripTelemetryPanel3DProps {
  vehicle: VehicleResponse;
  trip?: TripData;
  onBack: () => void;
  onTripCompleted?: (completedTrip: TripData) => void;
  initialStep?: CheckoutStep;
  panelPosition?: [number, number, number];
}

/**
 * TripTelemetryPanel3D:
 * Backwards-compatibility wrapper for ActiveTripDetailPanel.
 * Renders the authoritative right-side panel without 3D floating billboard cards.
 */
export const TripTelemetryPanel3D: React.FC<TripTelemetryPanel3DProps> = ({
  vehicle,
  onBack,
}) => {
  return <ActiveTripDetailPanel vehicle={vehicle} onClose={onBack} />;
};

export { ActiveTripDetailPanel };
