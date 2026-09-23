import { User, useAuthStore } from '../store/authStore';
import { safeParseResponse } from './api';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthApiResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export async function registerApi(payload: RegisterPayload): Promise<AuthApiResponse> {
  let res: Response;
  try {
    res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
  }

  return safeParseResponse<AuthApiResponse>(res);
}

export async function loginApi(payload: LoginPayload): Promise<AuthApiResponse> {
  let res: Response;
  try {
    res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
  }

  return safeParseResponse<AuthApiResponse>(res);
}

export async function refreshApi(refreshToken: string): Promise<AuthApiResponse> {
  let res: Response;
  try {
    res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    throw new Error('Không thể kết nối đến máy chủ để làm mới phiên đăng nhập.');
  }

  return safeParseResponse<AuthApiResponse>(res);
}

export async function logoutApi(): Promise<void> {
  const refreshToken = useAuthStore.getState().refreshToken;
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (e) {
    console.error('Logout error', e);
  } finally {
    useAuthStore.getState().logout();
  }
}

export async function fetchMeApi(): Promise<User> {
  const token = useAuthStore.getState().accessToken;
  if (!token) throw new Error('Phiên đăng nhập không tồn tại');

  let res: Response;
  try {
    res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Không thể kết nối đến máy chủ để lấy thông tin người dùng.');
  }

  return safeParseResponse<User>(res);
}
