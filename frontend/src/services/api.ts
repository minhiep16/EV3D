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

/**
 * Safely parse HTTP responses inspecting Content-Type:
 * - If application/json: parse JSON safely, catching any syntax errors.
 * - If non-JSON: inspect text to map CORS/infrastructure failures into controlled Vietnamese errors.
 * - Guarantees that raw syntax errors like "Unexpected token 'I'" never leak to the UI.
 */
export async function safeParseResponse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data?.message || '';
        if (response.status === 401) {
          throw new Error('Email hoặc mật khẩu không chính xác.');
        }
        if (response.status === 403) {
          throw new Error('Bạn không có quyền thực hiện thao tác này.');
        }
        if (response.status === 409) {
          if (errorMsg.includes('email') || errorMsg.includes('Email')) {
            throw new Error('Email này đã được đăng ký trong hệ thống.');
          }
          if (errorMsg.includes('license') || errorMsg.includes('biển số')) {
            throw new Error('Biển số xe đã tồn tại trong hệ thống.');
          }
          if (errorMsg.includes('vin') || errorMsg.includes('VIN')) {
            throw new Error('Số khung VIN đã tồn tại trong hệ thống.');
          }
          throw new Error('Dữ liệu đã tồn tại trong hệ thống.');
        }
        throw new Error(data?.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.');
      }
      return data as T;
    } catch (parseErr) {
      if (parseErr instanceof Error && !parseErr.message.includes('Unexpected token') && !parseErr.message.includes('JSON')) {
        throw parseErr;
      }
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  }

  // Non-JSON response (e.g. 403 plain-text "Invalid CORS request", HTML error page, etc.)
  const rawText = await response.text().catch(() => '');

  if (!response.ok) {
    if (rawText.includes('Invalid CORS request') || rawText.includes('CORS')) {
      throw new Error('Không thể kết nối đến máy chủ do lỗi cấu hình mạng.');
    }
    if (response.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (response.status === 403) {
      throw new Error('Bạn không có quyền truy cập dữ liệu.');
    }
    if (response.status >= 500) {
      throw new Error('Máy chủ đang gặp sự cố. Vui lòng thử lại sau.');
    }
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
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
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }

  if (!token) {
    useAuthStore.getState().logout();
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
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
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
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
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          }
          if (retried.status === 403) {
            throw new Error('Bạn không có quyền truy cập dữ liệu xe.');
          }
          return retried;
        } catch {
          isRefreshing = false;
          refreshSubscribers = [];
          useAuthStore.getState().logout();
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
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
                reject(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
              } else if (retried.status === 403) {
                reject(new Error('Bạn không có quyền truy cập dữ liệu xe.'));
              } else {
                resolve(retried);
              }
            } catch (err) {
              reject(err);
            }
          });
        });
      }
    } else {
      useAuthStore.getState().logout();
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }

  // Handle 403: Check if it is a CORS rejection or Forbidden
  if (response.status === 403) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.clone().text().catch(() => '');
      if (text.includes('Invalid CORS request') || text.includes('CORS')) {
        throw new Error('Không thể kết nối đến máy chủ do lỗi cấu hình mạng.');
      }
    }
    throw new Error('Bạn không có quyền truy cập dữ liệu xe.');
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
