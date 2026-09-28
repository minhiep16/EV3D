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
  // Purge legacy shared localStorage key so it never leaks across tabs
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted environments
  }

  try {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEY);
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
    }
  } catch (e) {
    console.error('Failed to restore auth session from sessionStorage', e);
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
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ user, accessToken, refreshToken })
          );
        }
      } catch (e) {
        console.error('Failed to persist auth session to sessionStorage', e);
      }
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
          try {
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                  user: state.user,
                  accessToken,
                  refreshToken: state.refreshToken,
                })
              );
            }
          } catch (e) {
            console.error('Failed to update accessToken in sessionStorage', e);
          }
        }
        return updated;
      });
    },

    logout: () => {
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(STORAGE_KEY);
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to remove auth session', e);
      }
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    },
  };
});
