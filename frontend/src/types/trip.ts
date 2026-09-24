export type TripStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface TripData {
  id: string;
  bookingId: string;
  vehicleId: string;
  vehicleName: string;
  vehicleCode?: string;
  licensePlate?: string;
  userId: string;
  userName: string;
  userEmail?: string | null;
  status: TripStatus;
  startedAt: string;
  endedAt: string | null;
  startOdometer: number;
  endOdometer: number | null;
  startBatteryLevel: number;
  endBatteryLevel: number | null;
  bookingStartTime?: string;
  bookingEndTime?: string;
  bookingPurpose?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TripStartEligibilityData {
  eligible: boolean;
  reasonCode: string | null;
  message: string | null;
  bookingId: string | null;
  vehicleId: string | null;
  handoverStatus: string | null;
  currentBatteryLevel: number | null;
  currentOdometer: number | null;
}

export interface TripRouteNode {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  timeEstimate?: string;
  position: [number, number, number];
  type?: 'START' | 'CURRENT' | 'DESTINATION';
  statusLabel?: string;
  status?: string;
}
