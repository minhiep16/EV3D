import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { AuthScene } from './scenes/AuthScene';
import { GarageScene } from './scenes/GarageScene';
import { StatusScene } from './scenes/StatusScene';
import { ProtectedRoute } from './routes/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <Routes>
        {/* Public 3D Authentication Routes */}
        <Route path="/login" element={<AuthScene initialMode="login" />} />
        <Route path="/register" element={<AuthScene initialMode="register" />} />

        {/* Phase 00 Diagnostics */}
        <Route path="/status" element={<StatusScene />} />

        {/* Protected Garage Space (Phase 01 protected route) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/garage" element={<GarageScene />} />
        </Route>

        {/* Root Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
  );
};

export default App;
