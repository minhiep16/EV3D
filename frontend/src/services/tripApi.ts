import { authenticatedFetch, safeParseResponse } from './api';
import { TripData, TripStartEligibilityData, TripExtensionCheckData, TripExtensionRequestData } from '../types/trip';
import { isValidUuid } from '../utils/formatUtils';

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
  if (!vehicleId || !isValidUuid(vehicleId)) return null;
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
 * Retrieve latest completed trip for a vehicle (for completed-trip summary after return).
 */
export async function fetchLatestCompletedTripForVehicle(vehicleId: string): Promise<TripData | null> {
  if (!vehicleId || !isValidUuid(vehicleId)) return null;
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/latest-completed-trip`);
    if (res.status === 204 || res.status === 404) {
      return null;
    }
    return await safeParseResponse<TripData>(res);
  } catch (err: any) {
    if (err.message && (err.message.includes('404') || err.message.includes('204'))) {
      return null;
    }
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ lấy thông tin chuyến đi đã hoàn tất.');
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

/**
 * Retrieve chronological trip history for a vehicle.
 */
export async function fetchVehicleTrips(vehicleId: string): Promise<TripData[]> {
  if (!vehicleId || !isValidUuid(vehicleId)) return [];
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/trips`);
    if (res.status === 204 || res.status === 404) {
      return [];
    }
    const data = await safeParseResponse<TripData[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err.message && (err.message.includes('404') || err.message.includes('204'))) {
      return [];
    }
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ lấy lịch sử chuyến đi.');
    }
    throw err;
  }
}

/**
 * Extend an active trip (Section 3 & 6).
 * Supports both:
 * - (tripId, { additionalMinutes: 30, reason })
 * - legacy (tripId, newEndTime, reason)
 */
export async function extendTripApi(
  tripId: string,
  targetOrPayload: string | { additionalMinutes?: number; newEndTime?: string; reason?: string },
  legacyReason?: string
): Promise<TripData> {
  const payload = typeof targetOrPayload === 'string'
    ? { newEndTime: targetOrPayload, reason: legacyReason }
    : targetOrPayload;

  try {
    const res = await authenticatedFetch(`/api/trips/${tripId}/extend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<TripData>(res);
  } catch (err: any) {
    if (err.message) {
      throw new Error(err.message);
    }
    throw new Error('Không thể gia hạn chuyến đi. Vui lòng thử lại.');
  }
}

/**
 * Check trip extension availability & detect conflicts against subsequent bookings.
 */
export async function checkTripExtensionAvailabilityApi(
  tripId: string,
  additionalMinutes: number
): Promise<TripExtensionCheckData> {
  const res = await authenticatedFetch(`/api/trips/${tripId}/extend/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ additionalMinutes }),
  });
  return await safeParseResponse<TripExtensionCheckData>(res);
}

/**
 * Create and submit a booking negotiation / yield request to the subsequent owner.
 */
export async function createNegotiationRequestApi(
  tripId: string,
  additionalMinutes: number,
  reason?: string
): Promise<TripExtensionRequestData> {
  const res = await authenticatedFetch(`/api/trips/${tripId}/extend/negotiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ additionalMinutes, reason }),
  });
  return await safeParseResponse<TripExtensionRequestData>(res);
}

/**
 * Fetch the active pending extension request for a trip.
 */
export async function fetchActiveTripExtensionRequestApi(
  tripId: string
): Promise<TripExtensionRequestData | null> {
  try {
    const res = await authenticatedFetch(`/api/trips/${tripId}/extension-request/active`);
    if (res.status === 204 || res.status === 404) {
      return null;
    }
    return await safeParseResponse<TripExtensionRequestData>(res);
  } catch {
    return null;
  }
}

/**
 * Fetch pending extension requests where the current user is asked to yield their booking.
 */
export async function fetchPendingExtensionRequestsApi(): Promise<TripExtensionRequestData[]> {
  try {
    const res = await authenticatedFetch('/api/trips/extension-requests/pending');
    if (res.status === 204 || res.status === 404) {
      return [];
    }
    const data = await safeParseResponse<TripExtensionRequestData[]>(res);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch a specific extension request by ID.
 */
export async function fetchExtensionRequestByIdApi(
  requestId: string
): Promise<TripExtensionRequestData> {
  const res = await authenticatedFetch(`/api/trips/extension-requests/${requestId}`);
  return await safeParseResponse<TripExtensionRequestData>(res);
}

/**
 * Affected co-owner accepts the yield request.
 */
export async function acceptExtensionRequestApi(
  requestId: string
): Promise<TripExtensionRequestData> {
  const res = await authenticatedFetch(`/api/trips/extension-requests/${requestId}/accept`, {
    method: 'POST',
  });
  return await safeParseResponse<TripExtensionRequestData>(res);
}

/**
 * Affected co-owner rejects the yield request.
 */
export async function rejectExtensionRequestApi(
  requestId: string
): Promise<TripExtensionRequestData> {
  const res = await authenticatedFetch(`/api/trips/extension-requests/${requestId}/reject`, {
    method: 'POST',
  });
  return await safeParseResponse<TripExtensionRequestData>(res);
}

/**
 * Requester cancels their pending yield request.
 */
export async function cancelExtensionRequestApi(
  requestId: string
): Promise<TripExtensionRequestData> {
  const res = await authenticatedFetch(`/api/trips/extension-requests/${requestId}/cancel`, {
    method: 'POST',
  });
  return await safeParseResponse<TripExtensionRequestData>(res);
}

/**
 * Acknowledge viewing completed trip details to dismiss the summary card from vehicle overview.
 */
export async function acknowledgeTripViewedApi(tripId: string): Promise<TripData> {
  const res = await authenticatedFetch(`/api/trips/${tripId}/acknowledge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Không thể ghi nhận trạng thái đã xem chuyến đi (${res.status})`);
  }
  return await safeParseResponse<TripData>(res);
}



