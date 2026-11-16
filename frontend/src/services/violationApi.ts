import { authenticatedFetch, safeParseResponse } from './api';
import { BookingViolationResponse } from '../types/violation';

export async function fetchMyViolations(): Promise<BookingViolationResponse[]> {
  try {
    const res = await authenticatedFetch('/api/violations/my-violations');
    if (res.status === 204 || res.status === 404) return [];
    return await safeParseResponse<BookingViolationResponse[]>(res);
  } catch (err) {
    return [];
  }
}

export async function fetchBookingViolation(bookingId: string): Promise<BookingViolationResponse | null> {
  try {
    const res = await authenticatedFetch(`/api/violations/booking/${bookingId}`);
    if (res.status === 204 || res.status === 404) return null;
    return await safeParseResponse<BookingViolationResponse>(res);
  } catch (err) {
    return null;
  }
}

export async function fetchPendingRecoveries(): Promise<BookingViolationResponse[]> {
  try {
    const res = await authenticatedFetch('/api/violations/pending-recovery');
    if (res.status === 204 || res.status === 404) return [];
    return await safeParseResponse<BookingViolationResponse[]>(res);
  } catch (err) {
    return [];
  }
}

export async function recoverVehicleViaViolationApi(
  targetId: string,
  note?: string
): Promise<BookingViolationResponse> {
  const res = await authenticatedFetch('/api/violations/recover-vehicle', {
    method: 'POST',
    body: JSON.stringify({ violationId: targetId, note }),
  });
  return await safeParseResponse<BookingViolationResponse>(res);
}
