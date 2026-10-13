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

/**
 * End/Check-out an ACTIVE trip.
 * Exclusively called by authorized trip owner (CO_OWNER).
 * Idempotently and transactionally transitions Trip to COMPLETED and Vehicle to AVAILABLE.
 */
export async function completeTripApi(tripId: string, endOdometer?: number): Promise<TripData> {
  try {
    const res = await authenticatedFetch(`/api/trips/${tripId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: endOdometer !== undefined ? JSON.stringify({ endOdometer }) : undefined,
    });
    return await safeParseResponse<TripData>(res);
  } catch (err: any) {
    if (err.status === 403) {
      throw new Error(err.message || 'Bạn không có quyền kết thúc chuyến đi này.');
    }
    if (err.status === 409 || err.status === 400) {
      throw new Error(err.message || 'Chuyến đi đã được kết thúc hoặc không ở trạng thái hoạt động.');
    }
    if (err.status === 404) {
      throw new Error('Không có chuyến đi đang hoạt động.');
    }
    if (err instanceof TypeError || (err instanceof Error && err.message?.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý chuyến đi.');
    }
    if (err.message) {
      throw new Error(err.message);
    }
    throw new Error('Không thể hoàn tất trả xe. Vui lòng thử lại.');
  }
}

export interface ConfirmTripReturnPayload {
  endBatteryLevel?: number;
  endOdometer?: number;
  conditionNote?: string;
  damageObserved?: boolean;
  evidenceUrl?: string;
  inspectionId?: string;
}

/**
 * Retrieve all pending vehicle return requests (STEP 2: STAFF receives vehicle).
 * Exclusively accessible by STAFF or ADMIN.
 */
export async function fetchPendingReturnTrips(): Promise<TripData[]> {
  try {
    const res = await authenticatedFetch('/api/trips/pending-returns');
    if (res.status === 204 || res.status === 404) {
      return [];
    }
    return await safeParseResponse<TripData[]>(res);
  } catch (err: any) {
    if (err.message && (err.message.includes('404') || err.message.includes('204'))) {
      return [];
    }
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể tải danh sách xe chờ tiếp nhận.');
    }
    throw err;
  }
}

/**
 * STAFF confirms vehicle return and verifies condition & energy usage (Phase 18 & 19).
 * Authoritatively creates verified trip energy expense.
 * Exclusively accessible by STAFF or ADMIN.
 */
export async function confirmTripReturnApi(
  tripId: string,
  payload?: ConfirmTripReturnPayload
): Promise<TripData> {
  try {
    const res = await authenticatedFetch(`/api/trips/${tripId}/confirm-return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    return await safeParseResponse<TripData>(res);
  } catch (err: any) {
    if (err.status === 403) {
      throw new Error(err.message || 'Chỉ nhân viên hoặc quản trị viên mới có quyền xác nhận trả xe.');
    }
    if (err.status === 409 || err.status === 400) {
      throw new Error(err.message || 'Chuyến đi đã được xác nhận trả xe trước đó hoặc không hợp lệ.');
    }
    if (err.message) {
      throw new Error(err.message);
    }
    throw new Error('Không thể xác nhận trả xe. Vui lòng thử lại.');
  }
}

/**
 * CO_OWNER requests vehicle return (Phase 10-12 & Section 7).
 * Exclusively accessible by the authenticated CO_OWNER who owns the active trip.
 */
export async function requestTripReturnApi(tripId: string): Promise<TripData> {
  try {
    const res = await authenticatedFetch(`/api/trips/${tripId}/request-return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await safeParseResponse<TripData>(res);
  } catch (err: any) {
    if (err.status === 403) {
      throw new Error(err.message || 'Bạn không có quyền gửi yêu cầu trả xe cho chuyến đi này.');
    }
    if (err.status === 409 || err.status === 400) {
      throw new Error(err.message || 'Yêu cầu trả xe đã được gửi và đang chờ nhân viên tiếp nhận.');
    }
    if (err.message) {
      throw new Error(err.message);
    }
    throw new Error('Không thể gửi yêu cầu trả xe. Vui lòng thử lại.');
  }
}


