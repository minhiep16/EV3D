import { authenticatedFetch, safeParseResponse } from './api';
import { CoOwnershipGroupResponse } from '../types/coOwnership';

export async function fetchVehicleCoOwnership(vehicleId: string): Promise<CoOwnershipGroupResponse> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/co-ownership`);
    return await safeParseResponse<CoOwnershipGroupResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ dữ liệu đồng sở hữu.');
    }
    throw err;
  }
}
