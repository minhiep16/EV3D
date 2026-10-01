import { authenticatedFetch, safeParseResponse } from './api';
import {
  VehicleInspectionResponse,
  VehicleInspectionItemRequest,
  CompleteInspectionRequest,
  InspectionType,
} from '../types/inspection';

export async function fetchLatestCompletedInspection(
  vehicleId: string
): Promise<VehicleInspectionResponse | null> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/inspections/latest-completed`);
    if (res.status === 204 || res.status === 404) {
      return null;
    }
    return await safeParseResponse<VehicleInspectionResponse>(res);
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return null;
    }
    return null;
  }
}

export async function fetchActiveInspection(
  vehicleId: string
): Promise<VehicleInspectionResponse | null> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/inspections/active`);
    if (res.status === 204 || res.status === 404) {
      return null;
    }
    return await safeParseResponse<VehicleInspectionResponse>(res);
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return null;
    }
    return null;
  }
}

export async function startInspectionApi(
  vehicleId: string,
  type: InspectionType = 'PRE_HANDOVER'
): Promise<VehicleInspectionResponse> {
  const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/inspections/start?type=${type}`, {
    method: 'POST',
  });
  return await safeParseResponse<VehicleInspectionResponse>(res);
}

export async function fetchInspectionById(
  inspectionId: string
): Promise<VehicleInspectionResponse> {
  const res = await authenticatedFetch(`/api/inspections/${inspectionId}`);
  return await safeParseResponse<VehicleInspectionResponse>(res);
}

export async function submitInspectionItemApi(
  inspectionId: string,
  request: VehicleInspectionItemRequest
): Promise<VehicleInspectionResponse> {
  const res = await authenticatedFetch(`/api/inspections/${inspectionId}/items`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return await safeParseResponse<VehicleInspectionResponse>(res);
}

export async function completeInspectionApi(
  inspectionId: string,
  request?: CompleteInspectionRequest
): Promise<VehicleInspectionResponse> {
  const res = await authenticatedFetch(`/api/inspections/${inspectionId}/complete`, {
    method: 'POST',
    body: request ? JSON.stringify(request) : undefined,
  });
  return await safeParseResponse<VehicleInspectionResponse>(res);
}
