import { authenticatedFetch, safeParseResponse } from './api';
import { BatteryHealthResponse } from '../types/battery';

/**
 * Fetch vehicle battery health technical state.
 * Returns null if no record exists yet (404/204).
 */
export async function fetchVehicleBatteryHealth(vehicleId: string): Promise<BatteryHealthResponse | null> {
  if (!vehicleId) return null;

  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/battery-health`);
    if (res.status === 204 || res.status === 404) {
      return null;
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || `Lỗi tải dữ liệu pin (${res.status})`);
    }
    const data = await safeParseResponse<BatteryHealthResponse>(res);
    return data || null;
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return null;
    }
    if (err instanceof TypeError || (err instanceof Error && err.message?.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý dữ liệu pin.');
    }
    throw err;
  }
}
