import { authenticatedFetch, safeParseResponse } from './api';
import {
  MaintenanceResponse,
  CreateMaintenancePayload,
  ScheduleMaintenancePayload,
  CompleteMaintenancePayload,
  MaintenanceApprovalResponse,
  CastMaintenanceVotePayload,
} from '../types/maintenance';

/**
 * Fetch all maintenance requests for a vehicle.
 */
export async function fetchVehicleMaintenance(vehicleId: string): Promise<MaintenanceResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/maintenance`);
    if (res.status === 204 || res.status === 404) {
      return [];
    }
    const data = await safeParseResponse<MaintenanceResponse[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return [];
    }
    if (err instanceof TypeError || (err instanceof Error && err.message?.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý bảo dưỡng.');
    }
    throw err;
  }
}

/**
 * Fetch a single maintenance request by ID.
 */
export async function fetchMaintenanceById(maintenanceId: string): Promise<MaintenanceResponse> {
  const res = await authenticatedFetch(`/api/maintenance/${maintenanceId}`);
  return safeParseResponse<MaintenanceResponse>(res);
}

/**
 * Fetch approval & voting state for a maintenance request.
 */
export async function fetchMaintenanceApproval(maintenanceId: string): Promise<MaintenanceApprovalResponse> {
  const res = await authenticatedFetch(`/api/maintenance/${maintenanceId}/approval`);
  return safeParseResponse<MaintenanceApprovalResponse>(res);
}

/**
 * Cast or update an approval vote on a maintenance request (CO_OWNER only).
 */
export async function castMaintenanceVote(
  maintenanceId: string,
  payload: CastMaintenanceVotePayload
): Promise<MaintenanceApprovalResponse> {
  const res = await authenticatedFetch(`/api/maintenance/${maintenanceId}/votes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return safeParseResponse<MaintenanceApprovalResponse>(res);
}

/**
 * Create a new maintenance request for a vehicle (STAFF / ADMIN).
 */
export async function createVehicleMaintenance(
  vehicleId: string,
  payload: CreateMaintenancePayload
): Promise<MaintenanceResponse> {
  const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/maintenance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return safeParseResponse<MaintenanceResponse>(res);
}

/**
 * Schedule a maintenance request.
 */
export async function scheduleMaintenance(
  maintenanceId: string,
  payload: ScheduleMaintenancePayload
): Promise<MaintenanceResponse> {
  const res = await authenticatedFetch(`/api/maintenance/${maintenanceId}/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return safeParseResponse<MaintenanceResponse>(res);
}

/**
 * Start maintenance work (sets status to IN_PROGRESS and vehicle to MAINTENANCE).
 */
export async function startMaintenance(maintenanceId: string): Promise<MaintenanceResponse> {
  const res = await authenticatedFetch(`/api/maintenance/${maintenanceId}/start`, {
    method: 'POST',
  });
  return safeParseResponse<MaintenanceResponse>(res);
}

/**
 * Complete maintenance work.
 */
export async function completeMaintenance(
  maintenanceId: string,
  payload?: CompleteMaintenancePayload
): Promise<MaintenanceResponse> {
  const res = await authenticatedFetch(`/api/maintenance/${maintenanceId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload || {}),
  });
  return safeParseResponse<MaintenanceResponse>(res);
}

/**
 * Cancel a maintenance request.
 */
export async function cancelMaintenance(maintenanceId: string): Promise<MaintenanceResponse> {
  const res = await authenticatedFetch(`/api/maintenance/${maintenanceId}/cancel`, {
    method: 'POST',
  });
  return safeParseResponse<MaintenanceResponse>(res);
}
