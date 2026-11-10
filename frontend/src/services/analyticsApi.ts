import { authenticatedFetch, safeParseResponse } from './api';
import { VehicleAnalyticsResponse } from '../types/analytics';

export async function fetchVehicleAnalytics(
  vehicleId: string,
  from?: string,
  to?: string
): Promise<VehicleAnalyticsResponse> {
  try {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/analytics${queryString}`);
    return await safeParseResponse<VehicleAnalyticsResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ dữ liệu phân tích xe.');
    }
    throw err;
  }
}

