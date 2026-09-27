import { authenticatedFetch, safeParseResponse, ApiError } from './api';
import { Booking, CreateBookingRequest } from '../types/booking';

export async function fetchVehicleBookings(vehicleId: string): Promise<Booking[]> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/bookings`);
    return await safeParseResponse<Booking[]>(res);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.', err.data);
      }
      if (err.status === 403) {
        throw new ApiError(403, 'Bạn không có quyền xem lịch xe.', err.data);
      }
      if (err.status === 404) {
        throw new ApiError(404, 'Không tìm thấy dữ liệu lịch xe.', err.data);
      }
      if (err.status >= 500) {
        throw new ApiError(500, 'Máy chủ gặp lỗi khi tải lịch xe.', err.data);
      }
      if (err.status === 0) {
        throw new ApiError(0, 'Không thể kết nối đến máy chủ.', err.data);
      }
      throw err;
    }
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new ApiError(0, 'Không thể kết nối đến máy chủ.');
    }
    throw err;
  }
}

export async function createVehicleBooking(
  vehicleId: string,
  request: CreateBookingRequest
): Promise<Booking> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/bookings`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return await safeParseResponse<Booking>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new ApiError(0, 'Không thể kết nối đến máy chủ.');
    }
    throw err;
  }
}

export async function cancelBooking(bookingId: string): Promise<Booking> {
  try {
    const res = await authenticatedFetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
    });
    return await safeParseResponse<Booking>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new ApiError(0, 'Không thể kết nối đến máy chủ.');
    }
    throw err;
  }
}
