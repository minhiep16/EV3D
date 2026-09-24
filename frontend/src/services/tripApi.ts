import { authenticatedFetch, safeParseResponse } from './api';
import { TripData, TripStartEligibilityData } from '../types/trip';

/**
 * Fetch trip by booking ID (null if not started yet).
 */
export async function fetchBookingTrip(bookingId: string): Promise<TripData | null> {
  try {
    const res = await authenticatedFetch(`/api/bookings/${bookingId}/trip`);
    if (res.status === 204 || res.status === 404) {
      return null;
    }
    return await safeParseResponse<TripData>(res);
  } catch (err: any) {
    if (err.message && (err.message.includes('404') || err.message.includes('204'))) {
      return null;
    }
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý chuyến đi.');
    }
    throw err;
  }
}

/**
 * Fetch trip start eligibility for a booking.
 * Read-only backend validation (never mutates data).
 */
export async function fetchTripStartEligibility(bookingId: string): Promise<TripStartEligibilityData> {
  try {
    const res = await authenticatedFetch(`/api/bookings/${bookingId}/trip/start-eligibility`);
    return await safeParseResponse<TripStartEligibilityData>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kiểm tra điều kiện bắt đầu chuyến đi.');
    }
    throw err;
  }
}

/**
 * Start trip mutation for a booking.
 * Exclusively called by authorized CO_OWNER.
 */
export async function startTripApi(bookingId: string): Promise<TripData> {
  try {
    const res = await authenticatedFetch(`/api/bookings/${bookingId}/trip/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await safeParseResponse<TripData>(res);
  } catch (err: any) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể bắt đầu chuyến đi lúc này.');
    }
    throw err;
  }
}

/**
 * Retrieve active trip for a vehicle (for restoration & operations monitoring).
 */
export async function fetchActiveTripForVehicle(vehicleId: string): Promise<TripData | null> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/active-trip`);
    if (res.status === 204 || res.status === 404) {
      return null;
    }
    return await safeParseResponse<TripData>(res);
  } catch (err: any) {
    if (err.message && (err.message.includes('404') || err.message.includes('204'))) {
      return null;
    }
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý trạng thái chuyến đi.');
    }
    throw err;
  }
}

/**
 * Retrieve trip by trip ID (purely read-only query).
 */
export async function fetchTripById(tripId: string): Promise<TripData | null> {
  try {
    const res = await authenticatedFetch(`/api/trips/${tripId}`);
    if (res.status === 204 || res.status === 404) {
      return null;
    }
    return await safeParseResponse<TripData>(res);
  } catch (err: any) {
    if (err.message && (err.message.includes('404') || err.message.includes('204'))) {
      return null;
    }
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý chi tiết chuyến đi.');
    }
    throw err;
  }
}
