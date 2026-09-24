import React from 'react';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../../services/queryClient';
import { VehicleResponse } from '../../../types/vehicle';
import { fetchActiveTripForVehicle } from '../../../services/tripApi';
import { TripData } from '../../../types/trip';
import { TripRouteVisualizer3D } from './TripRouteVisualizer3D';
import { TripTelemetryPanel3D } from './TripTelemetryPanel3D';
import { SpatialDataLink } from '../SpatialDataLink';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { Billboard, Html } from '@react-three/drei';
import { Loader2, AlertTriangle, ShieldAlert, ArrowLeft, Car } from 'lucide-react';

interface TripVisualizationWorldProps {
  vehicle: VehicleResponse;
}

export const TripVisualizationWorld: React.FC<TripVisualizationWorldProps> = ({ vehicle }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = isAuthenticated && !!accessToken;

  const returnToVehicleOverview = useWorldStore((state) => state.returnToVehicleOverview);

  // TanStack Query: Authoritative fetch of ACTIVE trip for this vehicle
  const {
    data: activeTrip,
    isLoading,
    isError,
    refetch,
  } = useQuery<TripData | null>({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 4000,
  });

  // 1. Loading State in 3D Space
  if (isLoading && !activeTrip) {
    return (
      <group position={[0, 1.4, 0]}>
        <Billboard follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div
              style={{
                background: 'rgba(5, 14, 26, 0.94)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(0, 242, 254, 0.5)',
                borderRadius: '9999px',
                padding: '10px 22px',
                color: '#38bdf8',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 0 25px rgba(0, 242, 254, 0.35)',
                whiteSpace: 'nowrap',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              <Loader2 size={16} className="animate-spin" color="#00f2fe" />
              <span>ĐANG TẢI DỮ LIỆU CHUYẾN ĐI...</span>
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  // 2. Fetch Error State in 3D Space (Requirement 28: KHÔNG THỂ TẢI DỮ LIỆU CHUYẾN ĐI)
  if (isError) {
    return (
      <group position={[2.7, 1.45, 0]}>
        <Billboard follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
            <div
              style={{
                width: '300px',
                background: 'rgba(16, 8, 20, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '16px',
                padding: '20px',
                color: '#ffffff',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 25px rgba(239, 68, 68, 0.25)',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#f87171',
                  fontSize: '13px',
                  fontWeight: 800,
                  marginBottom: '8px',
                }}
              >
                <AlertTriangle size={18} />
                <span>KHÔNG THỂ TẢI DỮ LIỆU CHUYẾN ĐI</span>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Không thể kết nối đến máy chủ để lấy dữ liệu chuyến đi. Vui lòng thử lại sau.
              </p>
              <button
                type="button"
                onClick={returnToVehicleOverview}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '9px',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={13} />
                <span>QUAY LẠI XE</span>
              </button>
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  // 3. Precondition: ACTIVE Trip Required (Requirement 1 & 28: KHÔNG CÓ CHUYẾN ĐI ĐANG DIỄN RA)
  if (!activeTrip || activeTrip.status !== 'ACTIVE') {
    return (
      <group position={[2.7, 1.45, 0]}>
        <Billboard follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
            <div
              style={{
                width: '300px',
                background: 'rgba(6, 14, 26, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '16px',
                padding: '20px',
                color: '#ffffff',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#38bdf8',
                  fontSize: '13px',
                  fontWeight: 800,
                  marginBottom: '8px',
                }}
              >
                <Car size={18} />
                <span>KHÔNG CÓ CHUYẾN ĐI ĐANG DIỄN RA</span>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Xe {vehicle.name || 'EV01'} hiện không có chuyến đi nào đang trong trạng thái hoạt động.
              </p>
              <button
                type="button"
                onClick={returnToVehicleOverview}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '9px',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={13} />
                <span>QUAY LẠI XE</span>
              </button>
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  // 4. Owner Authorization Check (Requirement 1, 17 & 28: BẠN KHÔNG CÓ QUYỀN XEM CHUYẾN ĐI NÀY)
  const isOwner =
    (user?.id && activeTrip.userId === user.id) ||
    (user?.email && activeTrip.userEmail === user.email);
  const isOperationsRole = user?.role === 'STAFF' || user?.role === 'ADMIN';

  if (!isOwner && !isOperationsRole) {
    return (
      <group position={[2.7, 1.45, 0]}>
        <Billboard follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
            <div
              style={{
                width: '300px',
                background: 'rgba(18, 10, 24, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                borderRadius: '16px',
                padding: '20px',
                color: '#ffffff',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 25px rgba(245, 158, 11, 0.2)',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#fbbf24',
                  fontSize: '13px',
                  fontWeight: 800,
                  marginBottom: '8px',
                }}
              >
                <ShieldAlert size={18} />
                <span>BẠN KHÔNG CÓ QUYỀN XEM CHUYẾN ĐI NÀY</span>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Chuyến đi này thuộc về đồng sở hữu khác. Bạn chỉ có thể theo dõi trạng thái chung của xe.
              </p>
              <button
                type="button"
                onClick={returnToVehicleOverview}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '9px',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={13} />
                <span>QUAY LẠI XE</span>
              </button>
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  // 5. Active Pure 3D Trip Visualization Scene
  const panelPosition: [number, number, number] = [2.7, 1.45, 0];
  const vehicleAnchor: [number, number, number] = [0.4, 0.4, 1.2];

  return (
    <group>
      {/* Pure 3D Spline Route with Glowing Tubes, Interactive Nodes, and Progress Beacon */}
      <TripRouteVisualizer3D />

      {/* Spatial 3D Laser Connector linking Route/Vehicle to Telemetry Panel */}
      <SpatialDataLink
        start={vehicleAnchor}
        end={[panelPosition[0] - 0.4, panelPosition[1], panelPosition[2]]}
        color="#00f2fe"
        pulseSpeed={2.8}
      />

      {/* Holographic 3D Telemetry Panel on the Right */}
      <QueryClientProvider client={queryClient}>
        <TripTelemetryPanel3D
          vehicle={vehicle}
          trip={activeTrip}
          onBack={returnToVehicleOverview}
          panelPosition={panelPosition}
        />
      </QueryClientProvider>
    </group>
  );
};
