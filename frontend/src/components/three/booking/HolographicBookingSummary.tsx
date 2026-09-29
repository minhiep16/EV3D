import React from 'react';
import { VehicleResponse } from '../../../types/vehicle';
import { CoOwnerBookingPanel, CoOwnerBookingPanelProps } from './CoOwnerBookingPanel';

export interface HolographicBookingSummaryProps {
  vehicle?: VehicleResponse;
  vehicleName?: string;
  selectedDate?: Date;
  startHour?: number | null;
  endHour?: number | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  timelinePosition?: [number, number, number];
  panelPosition?: [number, number, number];
}

/**
 * Backwards-compatible alias for CoOwnerBookingPanel.
 * Pure screen-space fixed DOM overlay, eliminating Drei Html collapse.
 */
export const HolographicBookingSummary: React.FC<HolographicBookingSummaryProps> = (props) => {
  if (props.vehicle) {
    return <CoOwnerBookingPanel vehicle={props.vehicle} onClose={props.onClose} />;
  }
  return null;
};

export { CoOwnerBookingPanel };
