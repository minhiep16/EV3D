import { authenticatedFetch, safeParseResponse } from './api';
import { CreateDamagePayload, DamageRecordData } from '../types/damage';

/**
 * Fetch all damage records for a completed trip.
 */
export async function fetchTripDamages(tripId: string): Promise<DamageRecordData[]> {
  try {
    const res = await authenticatedFetch(`/api/trips/${tripId}/damages`);
    if (res.status === 204 || res.status === 404) {
      return [];
    }
    const data = await safeParseResponse<DamageRecordData[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return [];
    }
    if (err instanceof TypeError || (err instanceof Error && err.message?.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý hư hỏng.');
    }
    throw err;
  }
}

/**
 * Fetch all damage records for a vehicle (operational inspection view).
 */
export async function fetchVehicleDamages(vehicleId: string): Promise<DamageRecordData[]> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/damages`);
    if (res.status === 204 || res.status === 404) {
      return [];
    }
    const data = await safeParseResponse<DamageRecordData[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return [];
    }
    if (err instanceof TypeError || (err instanceof Error && err.message?.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý hư hỏng phương tiện.');
    }
    throw err;
  }
}

/**
 * STAFF creates a new damage record for a completed trip.
 */
export async function recordTripDamage(
  tripId: string,
  payload: CreateDamagePayload
): Promise<DamageRecordData> {
  try {
    const res = await authenticatedFetch(`/api/trips/${tripId}/damages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<DamageRecordData>(res);
  } catch (err: any) {
    if (err?.status === 403) {
      throw new Error('Bạn không có quyền ghi nhận hư hỏng phương tiện.');
    }
    if (err?.status === 409) {
      throw new Error(err.message || 'Chuyến đi chưa hoàn tất.');
    }
    if (err?.status === 400) {
      throw new Error(err.message || 'Vị trí hoặc dữ liệu hư hỏng không hợp lệ.');
    }
    if (err instanceof TypeError || (err instanceof Error && err.message?.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ.');
    }
    throw err;
  }
}

/**
 * STAFF creates a new damage record directly for vehicle (associates to latest completed trip).
 */
export async function recordVehicleDamage(
  vehicleId: string,
  payload: CreateDamagePayload
): Promise<DamageRecordData> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/damages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<DamageRecordData>(res);
  } catch (err: any) {
    if (err?.status === 403) {
      throw new Error('Bạn không có quyền ghi nhận hư hỏng phương tiện.');
    }
    if (err?.status === 409) {
      throw new Error(err.message || 'Phương tiện chưa có chuyến đi hoàn tất.');
    }
    if (err?.status === 400) {
      throw new Error(err.message || 'Vị trí hoặc dữ liệu hư hỏng không hợp lệ.');
    }
    if (err instanceof TypeError || (err instanceof Error && err.message?.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ.');
    }
    throw err;
  }
}
