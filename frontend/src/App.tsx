import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { AuthScene } from './scenes/AuthScene';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { GarageErrorBoundary } from './components/common/GarageErrorBoundary';

const GarageScene = lazy(() =>
  import('./scenes/GarageScene').then((module) => ({ default: module.GarageScene }))
);
const OnboardingScene = lazy(() =>
  import('./scenes/OnboardingScene').then((module) => ({ default: module.OnboardingScene }))
);
const StatusScene = lazy(() =>
  import('./scenes/StatusScene').then((module) => ({ default: module.StatusScene }))
);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <Routes>
        {/* Public 3D Authentication Routes */}
        <Route path="/login" element={<AuthScene initialMode="login" />} />
        <Route path="/register" element={<AuthScene initialMode="register" />} />

        {/* Phase 00 Diagnostics */}
        <Route
          path="/status"
          element={
            <Suspense fallback={null}>
              <StatusScene />
            </Suspense>
          }
        />

        {/* Protected Garage Space (Phase 01 protected route) */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/garage"
            element={
              <GarageErrorBoundary>
                <Suspense
                  fallback={
                    <div
                      style={{
                        width: '100vw',
                        height: '100vh',
                        background: '#050811',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                        fontFamily: 'sans-serif',
                        fontSize: '13px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                      }}
                    >
                      ĐANG KHỞI TẠO KHÔNG GIAN 3D...
                    </div>
                  }
                >
                  <GarageScene />
                </Suspense>
              </GarageErrorBoundary>
            }
          />
          <Route
            path="/onboarding"
            element={
              <Suspense
                fallback={
                  <div
                    style={{
                      width: '100vw',
                      height: '100vh',
                      background: '#EAF7FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7',
                      fontFamily: 'sans-serif',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    ĐANG TẢI...
                  </div>
                }
              >
                <OnboardingScene />
              </Suspense>
            }
          />
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
