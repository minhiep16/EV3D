import { authenticatedFetch, safeParseResponse } from './api';
import {
  ChargingStationResponse,
  ChargingSessionResponse,
  CreateChargingSessionPayload,
  ProgressChargingSessionPayload,
} from '../types/charging';

/**
 * Fetch all available charging stations in the garage.
 */
export async function fetchChargingStations(): Promise<ChargingStationResponse[]> {
  try {
    const res = await authenticatedFetch('/api/charging-stations');
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Lỗi tải danh sách trụ sạc (${res.status})`);
    }
    const data = await safeParseResponse<ChargingStationResponse[]>(res);
    return data || [];
  } catch (err: any) {
    if (err instanceof TypeError || (err instanceof Error && err.message?.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý trạm sạc.');
    }
    throw err;
  }
}

/**
 * Fetch single charging station details by ID.
 */
export async function fetchChargingStationById(stationId: string): Promise<ChargingStationResponse> {
  const res = await authenticatedFetch(`/api/charging-stations/${stationId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Lỗi tải thông tin trụ sạc (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch active charging session for a vehicle if one exists.
 * Returns null if no active session (204/404).
 */
export async function fetchActiveChargingSession(vehicleId: string): Promise<ChargingSessionResponse | null> {
  if (!vehicleId) return null;

  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/charging-session/active`);
    if (res.status === 204 || res.status === 404) {
      return null;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Lỗi tải trạng thái phiên sạc (${res.status})`);
    }
    const data = await safeParseResponse<ChargingSessionResponse>(res);
    return data || null;
  } catch (err: any) {
    if (err?.message && (err.message.includes('204') || err.message.includes('404'))) {
      return null;
    }
    if (err instanceof TypeError || (err instanceof Error && err.message?.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý phiên sạc.');
    }
    throw err;
  }
}

/**
 * Fetch all charging sessions history for a vehicle.
 */
export async function fetchVehicleChargingSessions(vehicleId: string): Promise<ChargingSessionResponse[]> {
  if (!vehicleId) return [];

  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/charging-sessions`);
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Lỗi tải lịch sử sạc (${res.status})`);
    }
    const data = await safeParseResponse<ChargingSessionResponse[]>(res);
    return data || [];
  } catch (err: any) {
    if (err instanceof TypeError || (err instanceof Error && err.message?.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý phiên sạc.');
    }
    throw err;
  }
}

/**
 * Create a new charging session (and optionally start it immediately).
 */
export async function createChargingSession(
  vehicleId: string,
  payload: CreateChargingSessionPayload
): Promise<ChargingSessionResponse> {
  const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/charging-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Không thể tạo phiên sạc (${res.status})`);
  }

  return res.json();
}

/**
 * Explicitly start a PENDING charging session.
 */
export async function startChargingSession(sessionId: string): Promise<ChargingSessionResponse> {
  const res = await authenticatedFetch(`/api/charging-sessions/${sessionId}/start`, {
    method: 'POST',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Không thể bắt đầu phiên sạc (${res.status})`);
  }

  return res.json();
}

/**
 * Progress an ACTIVE charging session (for controlled demo increments).
 */
export async function progressChargingSession(
  sessionId: string,
  payload: ProgressChargingSessionPayload
): Promise<ChargingSessionResponse> {
  const res = await authenticatedFetch(`/api/charging-sessions/${sessionId}/progress`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Không thể cập nhật tiến độ sạc (${res.status})`);
  }

  return res.json();
}

/**
 * Complete / Stop an ACTIVE charging session.
 */
export async function completeChargingSession(sessionId: string): Promise<ChargingSessionResponse> {
  const res = await authenticatedFetch(`/api/charging-sessions/${sessionId}/complete`, {
    method: 'POST',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Không thể hoàn tất phiên sạc (${res.status})`);
  }

  return res.json();
}

/**
 * Cancel a PENDING or ACTIVE charging session.
 */
export async function cancelChargingSession(sessionId: string): Promise<ChargingSessionResponse> {
  const res = await authenticatedFetch(`/api/charging-sessions/${sessionId}/cancel`, {
    method: 'POST',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Không thể hủy phiên sạc (${res.status})`);
  }

  return res.json();
}
