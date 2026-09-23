import { authenticatedFetch, safeParseResponse } from './api';
import { Booking, CreateBookingRequest } from '../types/booking';

export async function fetchVehicleBookings(vehicleId: string): Promise<Booking[]> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/bookings`);
    return await safeParseResponse<Booking[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ lịch đặt xe.');
    }
    throw err;
  }
}

export async function createVehicleBooking(
  vehicleId: string,
  request: CreateBookingRequest
): Promise<Booking> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/bookings`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return await safeParseResponse<Booking>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ lịch đặt xe.');
    }
    throw err;
  }
}

export async function cancelBooking(bookingId: string): Promise<Booking> {
  try {
    const res = await authenticatedFetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
    });
    return await safeParseResponse<Booking>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ để hủy lịch.');
    }
    throw err;
  }
}
