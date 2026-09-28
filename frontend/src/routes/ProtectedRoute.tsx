import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  // Authoritative Route Guard: Requires valid current-tab auth state
  const isSessionValid = Boolean(isAuthenticated && user != null && accessToken);

  if (!isSessionValid) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
