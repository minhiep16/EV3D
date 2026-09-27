import { HealthStatus } from '../types/health';
import { useAuthStore } from '../store/authStore';
import { refreshApi } from './authApi';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Safely parse HTTP responses inspecting Content-Type:
 * - If application/json: parse JSON safely, catching any syntax errors.
 * - If non-JSON: inspect text to map CORS/infrastructure failures into controlled Vietnamese errors.
 * - Guarantees that raw syntax errors like "Unexpected token 'I'" never leak to the UI.
 */
export async function safeParseResponse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    let data: any;
    try {
      data = await response.json();
    } catch {
      if (!response.ok) {
        throw new ApiError(response.status, `Lỗi máy chủ (${response.status})`);
      }
      throw new ApiError(0, 'Không thể kết nối đến máy chủ.');
    }

    if (!response.ok) {
      const errorMsg = data?.message || '';
      if (response.status === 401) {
        throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.', data);
      }
      if (response.status === 403) {
        throw new ApiError(403, errorMsg || 'Bạn không có quyền thực hiện thao tác này.', data);
      }
      if (response.status === 409) {
        if (errorMsg.includes('email') || errorMsg.includes('Email')) {
          throw new ApiError(409, 'Email này đã được đăng ký trong hệ thống.', data);
        }
        if (errorMsg.includes('license') || errorMsg.includes('biển số')) {
          throw new ApiError(409, 'Biển số xe đã tồn tại trong hệ thống.', data);
        }
        if (errorMsg.includes('vin') || errorMsg.includes('VIN')) {
          throw new ApiError(409, 'Số khung VIN đã tồn tại trong hệ thống.', data);
        }
        throw new ApiError(409, errorMsg || 'Dữ liệu đã tồn tại trong hệ thống.', data);
      }
      if (response.status >= 500) {
        throw new ApiError(response.status, errorMsg || 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.', data);
      }
      throw new ApiError(response.status, errorMsg || 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.', data);
    }
    return data as T;
  }

  // Non-JSON response (e.g. 403 plain-text "Invalid CORS request", HTML error page, etc.)
  const rawText = await response.text().catch(() => '');

  if (!response.ok) {
    if (rawText.includes('Invalid CORS request') || rawText.includes('CORS')) {
      throw new ApiError(0, 'Không thể kết nối đến máy chủ do lỗi cấu hình mạng.');
    }
    if (response.status === 401) {
      throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.');
    }
    if (response.status === 403) {
      throw new ApiError(403, 'Bạn không có quyền truy cập dữ liệu.');
    }
    if (response.status === 404) {
      throw new ApiError(404, 'Không tìm thấy dữ liệu yêu cầu.');
    }
    if (response.status >= 500) {
      throw new ApiError(response.status, 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.');
    }
    throw new ApiError(response.status, 'Không thể kết nối đến máy chủ.');
  }

  return rawText as unknown as T;
}

/**
 * Shared authenticated fetch wrapper:
 * 1. Attaches Authorization: Bearer <accessToken>
 * 2. On 401: seamlessly refreshes access token using refreshToken and retries
 * 3. Maps 401 and 403 status codes to friendly Vietnamese error messages
 * 4. Cleans up auth state and redirects to login on terminal refresh failure
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  let token = useAuthStore.getState().accessToken;
  const refreshToken = useAuthStore.getState().refreshToken;

  // Proactive check: if accessToken is missing but refreshToken is present, refresh before request
  if (!token && refreshToken) {
    try {
      const refreshed = await refreshApi(refreshToken);
      token = refreshed.accessToken;
      useAuthStore.getState().setAuth(refreshed.user, refreshed.accessToken, refreshed.refreshToken);
    } catch {
      useAuthStore.getState().logout();
      throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.');
    }
  }

  if (!token) {
    useAuthStore.getState().logout();
    throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.');
  }

  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(input, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Không thể kết nối đến máy chủ.');
  }

  // Handle 401: Token expired or invalid -> automatic refresh & retry
  if (response.status === 401) {
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshed = await refreshApi(refreshToken);
          useAuthStore.getState().setAuth(refreshed.user, refreshed.accessToken, refreshed.refreshToken);
          isRefreshing = false;
          onTokenRefreshed(refreshed.accessToken);

          // Retry original request with freshly acquired token
          headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
          const retried = await fetch(input, { ...init, headers });

          if (retried.status === 401) {
            useAuthStore.getState().logout();
            throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.');
          }
          if (retried.status === 403) {
            throw new ApiError(403, 'Bạn không có quyền truy cập dữ liệu.');
          }
          return retried;
        } catch (refreshErr) {
          isRefreshing = false;
          refreshSubscribers = [];
          useAuthStore.getState().logout();
          if (refreshErr instanceof ApiError) throw refreshErr;
          throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.');
        }
      } else {
        // Another request is already refreshing; queue this request
        return new Promise((resolve, reject) => {
          addRefreshSubscriber(async (newToken: string) => {
            try {
              headers.set('Authorization', `Bearer ${newToken}`);
              const retried = await fetch(input, { ...init, headers });
              if (retried.status === 401) {
                useAuthStore.getState().logout();
                reject(new ApiError(401, 'Phiên đăng nhập đã hết hạn.'));
              } else if (retried.status === 403) {
                reject(new ApiError(403, 'Bạn không có quyền truy cập dữ liệu.'));
              } else {
                resolve(retried);
              }
            } catch {
              reject(new ApiError(0, 'Không thể kết nối đến máy chủ.'));
            }
          });
        });
      }
    } else {
      useAuthStore.getState().logout();
      throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.');
    }
  }

  // Handle 403: Check if it is a CORS rejection or Forbidden
  if (response.status === 403) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.clone().text().catch(() => '');
      if (text.includes('Invalid CORS request') || text.includes('CORS')) {
        throw new ApiError(0, 'Không thể kết nối đến máy chủ do lỗi cấu hình mạng.');
      }
      throw new ApiError(403, 'Bạn không có quyền truy cập dữ liệu.');
    }
    return response;
  }

  return response;
}

export async function fetchHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch('/api/health');
    return await safeParseResponse<HealthStatus>(response);
  } catch (error) {
    return {
      status: 'DOWN',
      api: 'DOWN',
      database: 'DOWN',
      message: error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ',
    };
  }
}
