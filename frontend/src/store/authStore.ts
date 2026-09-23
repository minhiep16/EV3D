import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'CO_OWNER' | 'STAFF' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateAccessToken: (accessToken: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'evshare_auth_session';

const getInitialState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.accessToken && parsed.user) {
        return {
          user: parsed.user,
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken || null,
          isAuthenticated: true,
        };
      }
    }
  } catch (e) {
    console.error('Failed to restore auth session', e);
  }
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  };
};

export const useAuthStore = create<AuthState>((set) => {
  const initial = getInitialState();

  return {
    ...initial,

    setAuth: (user, accessToken, refreshToken) => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user, accessToken, refreshToken })
      );
      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
      });
    },

    updateAccessToken: (accessToken) => {
      set((state) => {
        const updated = {
          ...state,
          accessToken,
        };
        if (state.user) {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              user: state.user,
              accessToken,
              refreshToken: state.refreshToken,
            })
          );
        }
        return updated;
      });
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    },
  };
});
