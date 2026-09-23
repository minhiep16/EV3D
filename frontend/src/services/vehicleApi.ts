import { authenticatedFetch, safeParseResponse } from './api';
import { VehicleResponse, UpdateVehiclePayload } from '../types/vehicle';

export async function fetchVehicles(): Promise<VehicleResponse[]> {
  try {
    const res = await authenticatedFetch('/api/vehicles');
    return await safeParseResponse<VehicleResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ dữ liệu xe.');
    }
    throw err;
  }
}

export async function fetchVehicleById(id: string): Promise<VehicleResponse> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${id}`);
    return await safeParseResponse<VehicleResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ dữ liệu xe.');
    }
    throw err;
  }
}

export async function updateVehicle(
  id: string,
  payload: UpdateVehiclePayload
): Promise<VehicleResponse> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<VehicleResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ dữ liệu xe.');
    }
    throw err;
  }
}
