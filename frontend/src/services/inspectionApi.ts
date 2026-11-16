import { authenticatedFetch, safeParseResponse } from './api';
import {
  VehicleInspectionResponse,
  VehicleInspectionItemRequest,
  CompleteInspectionRequest,
  InspectionType,
} from '../types/inspection';
import { isValidUuid } from '../utils/formatUtils';

export async function fetchLatestCompletedInspection(
  vehicleId: string
): Promise<VehicleInspectionResponse | null> {
  if (!vehicleId || !isValidUuid(vehicleId)) return null;
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
  if (!vehicleId || !isValidUuid(vehicleId)) return null;
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
  type: InspectionType = 'PRE_HANDOVER',
  forceNew: boolean = false
): Promise<VehicleInspectionResponse> {
  const url = forceNew
    ? `/api/vehicles/${vehicleId}/inspections/start?type=${type}&forceNew=true`
    : `/api/vehicles/${vehicleId}/inspections/start?type=${type}`;
  const res = await authenticatedFetch(url, {
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

export interface ComparisonItem {
  vehiclePartCode: string;
  preCondition: string;
  postCondition: string;
  status: string; // UNCHANGED, NEW_DAMAGE, EXISTING_DAMAGE, WORSENED, REPAIRED
  preNote?: string;
  postNote?: string;
}

export interface InspectionComparisonResponse {
  preInspectionId: string;
  postInspectionId: string;
  vehicleId?: string;
  tripId?: string;
  preInspectedAt?: string;
  postInspectedAt?: string;
  preOverallResult?: string;
  postOverallResult?: string;
  totalNewDamages: number;
  cleanPass: boolean;
  items: ComparisonItem[];
}

export async function fetchInspectionComparison(
  preInspectionId: string,
  postInspectionId: string
): Promise<InspectionComparisonResponse> {
  const res = await authenticatedFetch(
    `/api/inspections/compare?preInspectionId=${preInspectionId}&postInspectionId=${postInspectionId}`
  );
  return await safeParseResponse<InspectionComparisonResponse>(res);
}

export async function fetchTripInspectionComparison(
  tripId: string
): Promise<InspectionComparisonResponse> {
  const res = await authenticatedFetch(`/api/trips/${tripId}/inspection-comparison`);
  return await safeParseResponse<InspectionComparisonResponse>(res);
}
