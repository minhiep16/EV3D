import { authenticatedFetch, safeParseResponse } from './api';
import {
  VehicleHandoverData,
  VehicleInspectionItem,
  VehicleInspectionSubmitRequest,
  VehicleHandoverEligibilityResponse,
} from '../types/handover';

export async function fetchHandoverEligibility(
  vehicleId: string
): Promise<VehicleHandoverEligibilityResponse> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/handover-eligibility`);
    return await safeParseResponse<VehicleHandoverEligibilityResponse>(res);
  } catch (err: any) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ kiểm tra điều kiện bàn giao xe.');
    }
    throw err;
  }
}

export async function fetchActiveVehicleHandover(
  vehicleId: string
): Promise<VehicleHandoverData | null> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/active-handover`);
    if (res.status === 404 || res.status === 204) {
      return null;
    }
    return await safeParseResponse<VehicleHandoverData>(res);
  } catch (err: any) {
    if (err.message && (err.message.includes('404') || err.message.includes('không tìm thấy') || err.message.includes('No active handover'))) {
      return null;
    }
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý bàn giao xe.');
    }
    throw err;
  }
}

export async function fetchActiveVehicleHandovers(
  vehicleId: string
): Promise<VehicleHandoverData[]> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/active-handovers`);
    if (res.status === 404 || res.status === 204) {
      return [];
    }
    return await safeParseResponse<VehicleHandoverData[]>(res);
  } catch (err: any) {
    if (err.message && (err.message.includes('404') || err.message.includes('không tìm thấy') || err.message.includes('No active handover'))) {
      return [];
    }
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý danh sách bàn giao xe.');
    }
    throw err;
  }
}

export async function fetchBookingHandover(
  bookingId: string
): Promise<VehicleHandoverData> {
  try {
    const res = await authenticatedFetch(`/api/bookings/${bookingId}/handover`);
    return await safeParseResponse<VehicleHandoverData>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ quản lý bàn giao xe.');
    }
    throw err;
  }
}

export async function startHandoverApi(
  bookingId: string
): Promise<VehicleHandoverData> {
  try {
    const res = await authenticatedFetch(`/api/bookings/${bookingId}/handover/start`, {
      method: 'POST',
    });
    return await safeParseResponse<VehicleHandoverData>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ khởi tạo bàn giao xe.');
    }
    throw err;
  }
}

export async function submitInspectionApi(
  handoverId: string,
  request: VehicleInspectionSubmitRequest
): Promise<VehicleInspectionItem> {
  try {
    const res = await authenticatedFetch(`/api/handovers/${handoverId}/inspections`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return await safeParseResponse<VehicleInspectionItem>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ lưu kiểm tra xe.');
    }
    throw err;
  }
}

export async function markHandoverReadyApi(
  handoverId: string
): Promise<VehicleHandoverData> {
  try {
    const res = await authenticatedFetch(`/api/handovers/${handoverId}/ready`, {
      method: 'POST',
    });
    return await safeParseResponse<VehicleHandoverData>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ xác nhận sẵn sàng bàn giao.');
    }
    throw err;
  }
}

export async function confirmHandoverApi(
  handoverId: string
): Promise<VehicleHandoverData> {
  try {
    const res = await authenticatedFetch(`/api/handovers/${handoverId}/handover`, {
      method: 'POST',
    });
    return await safeParseResponse<VehicleHandoverData>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ xác nhận giao xe.');
    }
    throw err;
  }
}

export async function acknowledgeConditionApi(
  handoverId: string
): Promise<VehicleHandoverData> {
  try {
    const res = await authenticatedFetch(`/api/handovers/${handoverId}/acknowledge-condition`, {
      method: 'POST',
    });
    return await safeParseResponse<VehicleHandoverData>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ xác nhận tình trạng xe.');
    }
    throw err;
  }
}

export async function confirmOwnerReceiptApi(
  handoverId: string
): Promise<VehicleHandoverData> {
  try {
    const res = await authenticatedFetch(`/api/handovers/${handoverId}/owner-confirm`, {
      method: 'POST',
    });
    return await safeParseResponse<VehicleHandoverData>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ xác nhận nhận xe.');
    }
    throw err;
  }
}

export async function completeHandoverApi(
  handoverId: string
): Promise<VehicleHandoverData> {
  try {
    const res = await authenticatedFetch(`/api/handovers/${handoverId}/complete`, {
      method: 'POST',
    });
    return await safeParseResponse<VehicleHandoverData>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ hoàn tất Check-in.');
    }
    throw err;
  }
}
