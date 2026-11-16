export type BookingViolationType =
  | 'NO_SHOW_UNCLAIMED'
  | 'NO_SHOW_CUSTODY_RETAINED'
  | 'OVERDUE_DEPARTURE'
  | 'OVERDUE_RETURN';

export type BookingViolationStatus =
  | 'RECORDED'
  | 'RECOVERY_PENDING'
  | 'RESOLVED'
  | 'EXCUSED';

export interface BookingViolationResponse {
  id: string;
  bookingId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  vehicleId: string;
  vehicleName?: string;
  vehiclePlate?: string;
  violationType: BookingViolationType;
  violationTypeLabelVi?: string;
  scheduledDepartureTime: string;
  violationTimestamp: string;
  gracePeriodMinutes: number;
  reason: string;
  resolutionStatus: BookingViolationStatus;
  resolutionStatusLabelVi?: string;
  resolvedAt?: string;
  resolvedByName?: string;
  resolutionNote?: string;
  createdAt: string;
}
