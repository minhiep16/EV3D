export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  vehicleId: string;
  userId: string;
  userName: string;
  userEmail: string;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  status: BookingStatus;
  purpose?: string;
  createdAt: string;
}

export interface CreateBookingRequest {
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  purpose?: string;
}
