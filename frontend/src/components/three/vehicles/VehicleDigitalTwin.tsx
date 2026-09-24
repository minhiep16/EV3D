import React, { Suspense } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../../services/queryClient';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';
import { fetchVehicles } from '../../../services/vehicleApi';
import { VehicleResponse } from '../../../types/vehicle';
import { VehicleModel } from './VehicleModel';
import { VehicleStatusLabel } from './VehicleStatusLabel';
import { VehicleSelectionEffect } from './VehicleSelectionEffect';
import { VehicleInspectionGuide } from './VehicleInspectionGuide';
import { SpatialVehiclePartPanel } from './SpatialVehiclePartPanel';
import { SpatialDataLink } from '../SpatialDataLink';
import { HolographicPanelFrame3D } from '../HolographicPanelFrame3D';
import { VehicleCoOwnershipWorld } from '../ownership/VehicleCoOwnershipWorld';
import { VehicleBookingWorld } from '../booking/VehicleBookingWorld';
import { VehicleHandoverWorld } from '../handover/VehicleHandoverWorld';
import { CoOwnerReceiptWorld } from '../handover/CoOwnerReceiptWorld';
import { TripStartWorld } from '../trip/TripStartWorld';
import { TripVisualizationWorld } from '../trip/TripVisualizationWorld';
import { getPartById } from '../../../data/vehicleParts';
import { CoOwnerVehiclePanel } from './CoOwnerVehiclePanel';
import { StaffOperationsPanel } from './StaffOperationsPanel';
import { AdminVehicleMonitorPanel } from './AdminVehicleMonitorPanel';
import {
  Car,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export interface VehicleDigitalTwinProps {
  renderPanel?: (vehicle: VehicleResponse, onClose: () => void) => React.ReactNode;
}

export const VehicleDigitalTwin: React.FC<VehicleDigitalTwinProps> = ({ renderPanel }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const authReady = isAuthenticated && (!!accessToken || !!refreshToken);

  const selectedZone = useWorldStore((state) => state.selectedZone);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const hoveredVehicleId = useWorldStore((state) => state.hoveredVehicleId);
  const vehicleInspectionMode = useWorldStore(
    (state) => state.vehicleInspectionMode
  );
  const vehicleCoOwnershipMode = useWorldStore(
    (state) => state.vehicleCoOwnershipMode
  );
  const user = useAuthStore((state) => state.user);
  const vehicleBookingMode = useWorldStore((state) => state.vehicleBookingMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);
  const vehicleReceiptReviewMode = useWorldStore((state) => state.vehicleReceiptReviewMode);
  const vehicleTripStartMode = useWorldStore((state) => state.vehicleTripStartMode);
  const vehicleTripVisualizationMode = useWorldStore((state) => state.vehicleTripVisualizationMode);
  const selectedVehiclePartId = useWorldStore(
    (state) => state.selectedVehiclePartId
  );
  const selectVehicle = useWorldStore((state) => state.selectVehicle);
  const hoverVehicle = useWorldStore((state) => state.hoverVehicle);
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const vehicleMode = useWorldStore((state) => state.vehicleMode);
  const isVehicleSelected = useWorldStore((state) => state.isVehicleSelected);

  // TanStack Query: Fetch vehicles from Spring Boot API / MySQL
  // Enabled ONLY when authentication state is ready and token exists
  const { data: vehicles, isLoading, isError, error, refetch } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
    enabled: authReady,
    refetchInterval: authReady ? 6000 : false,
  });


  // 1. Loading State in 3D Space (also shown while auth is initializing)
  if (!authReady || isLoading) {
    return (
      <group position={[-8, 0.14, 4]}>
        <Html position={[0, 1.8, 0]} center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div
            style={{
              background: 'rgba(8, 12, 22, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '9999px',
              padding: '8px 18px',
              color: '#38bdf8',
              fontFamily: 'var(--font-family)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles size={14} color="#00f2fe" />
            <span>ĐANG TẢI DỮ LIỆU XE...</span>
          </div>
        </Html>
      </group>
    );
  }

  // 2. Error State in 3D Space
  if (isError) {
    return (
      <group position={[-8, 0.14, 4]}>
        <Html position={[0, 1.8, 0]} center distanceFactor={8.5} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
          <div
            style={{
              width: '280px',
              background: 'rgba(15, 10, 20, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '14px',
              padding: '16px',
              color: '#f8fafc',
              fontFamily: 'var(--font-family)',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(239, 68, 68, 0.25)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '6px',
              }}
            >
              <AlertTriangle size={15} />
              <span>KHÔNG THỂ TẢI DỮ LIỆU XE</span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px 0' }}>
              {(() => {
                const rawMsg = (error as Error)?.message || '';
                if (
                  rawMsg.includes('Authentication token') ||
                  rawMsg.includes('Unauthorized') ||
                  rawMsg.includes('token is missing') ||
                  rawMsg.includes('Phiên đăng nhập')
                ) {
                  return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                }
                if (rawMsg.includes('quyền truy cập') || rawMsg.includes('Forbidden')) {
                  return 'Bạn không có quyền truy cập dữ liệu xe.';
                }
                if (
                  rawMsg.includes('CORS') ||
                  rawMsg.includes('Unexpected token') ||
                  rawMsg.includes('JSON') ||
                  rawMsg.includes('Network') ||
                  rawMsg.includes('Failed to fetch') ||
                  rawMsg.includes('kết nối')
                ) {
                  return 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
                }
                return 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
              })()}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 16px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={12} />
              THỬ LẠI
            </button>
          </div>
        </Html>
      </group>
    );
  }

  // 3. Empty State in 3D Space (No vehicles found in database)
  if (!vehicles || vehicles.length === 0) {
    return (
      <group position={[-8, 0.14, 4]}>
        <Html position={[0, 1.8, 0]} center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div
            style={{
              background: 'rgba(8, 12, 22, 0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '9999px',
              padding: '8px 18px',
              color: '#94a3b8',
              fontFamily: 'var(--font-family)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            <Car size={14} />
            <span>CHƯA CÓ XE TRONG HỆ THỐNG</span>
          </div>
        </Html>
      </group>
    );
  }

  // Connected State: Use the primary vehicle from API
  const vehicle = vehicles[0];
  const displayCode = 'EV01';
  const role = user?.role || 'CO_OWNER';

  const isSelected =
    isVehicleSelected ||
    selectedZone === 'VEHICLE' ||
    selectedVehicleId === vehicle.id ||
    selectedVehicleId === displayCode ||
    selectedVehicleId === 'EV01';
  const isHovered = hoveredVehicleId === vehicle.id || hoveredVehicleId === displayCode;

  const selectedPart = getPartById(selectedVehiclePartId);

  const isBusinessModeActive =
    vehicleInspectionMode ||
    vehicleCoOwnershipMode ||
    vehicleBookingMode ||
    vehicleHandoverMode ||
    vehicleReceiptReviewMode ||
    vehicleTripStartMode ||
    vehicleTripVisualizationMode;

  // Section 2: EV01 click must set both selection and mode explicitly
  const handleVehicleSelect = (selectedVehicle: VehicleResponse) => {
    selectVehicle(selectedVehicle.id, role);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (isBusinessModeActive) return;
    e.stopPropagation();
    handleVehicleSelect(vehicle);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (isBusinessModeActive) return;
    e.stopPropagation();
    hoverVehicle(displayCode);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (isBusinessModeActive) return;
    e.stopPropagation();
    if (hoveredVehicleId === vehicle.id || hoveredVehicleId === displayCode) {
      hoverVehicle(null);
    }
    document.body.style.cursor = 'auto';
  };

  // Section 4: Panel Render Condition
  // CoOwnerVehiclePanel should render when:
  // role === "CO_OWNER" AND selectedVehicleId != null AND vehicleMode === "CO_OWNER_VEHICLE_OVERVIEW"
  const shouldRenderCoOwnerPanel =
    role === 'CO_OWNER' &&
    selectedVehicleId != null &&
    (vehicleMode === 'CO_OWNER_VEHICLE_OVERVIEW' ||
      vehicleMode === 'CO_OWNER_VEHICLE_INFO' ||
      vehicleMode === 'CO_OWNER_MY_BOOKINGS');

  const shouldRenderStaffPanel =
    role === 'STAFF' &&
    selectedVehicleId != null &&
    vehicleMode === 'STAFF_VEHICLE_OVERVIEW';

  const shouldRenderAdminPanel =
    role === 'ADMIN' &&
    selectedVehicleId != null &&
    vehicleMode === 'ADMIN_VEHICLE_OVERVIEW';

  const shouldRenderVehicleOverview =
    (shouldRenderCoOwnerPanel ||
      shouldRenderStaffPanel ||
      shouldRenderAdminPanel ||
      isSelected) &&
    !isBusinessModeActive;

  return (
    // Situated on the Vehicle Zone parking pad (center: x=-8, y=0.14, z=4)
    <group
      position={[-8, 0.14, 4]}
      rotation={[0, 0, 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* 1. Selection & Hover Underglow Halo */}
      <VehicleSelectionEffect isSelected={isSelected} isHovered={isHovered} />

      {/* 2. Real EV 3D GLB Model (dynamic path from backend) */}
      <Suspense fallback={null}>
        <VehicleModel
          isSelected={isSelected}
          isHovered={isHovered}
          modelUrl={vehicle.model3dUrl || '/models/ev-car.glb'}
          onSelectVehicle={() => handleVehicleSelect(vehicle)}
        />
      </Suspense>

      {/* 3. Floating 3D Status Pill Indicator (shown only before vehicle is selected) */}
      {!isSelected && !vehicleInspectionMode && !vehicleCoOwnershipMode && (
        <VehicleStatusLabel
          id={displayCode}
          name={vehicle.name}
          status={vehicle.status}
          batteryLevel={vehicle.currentBatteryLevel}
          isSelected={isSelected}
          isHovered={isHovered}
        />
      )}

      {/* 4. World-Space Spatial Vehicle Information Card with 3D Holographic Frame & Connector */}
      {shouldRenderVehicleOverview && (
        <>
          {/* Visible 3D Laser Connector linking EV01 to detailed panel */}
          <SpatialDataLink
            start={[0, 0.7, 0]}
            end={[2.6 - 0.45, 1.35, 0]}
            color={role === 'ADMIN' ? '#a855f7' : role === 'CO_OWNER' ? '#10b981' : '#00f2fe'}
          />

          <group position={[2.6, 1.35, 0]}>
            <Billboard follow={true}>
              <HolographicPanelFrame3D
                width={2.55}
                height={role === 'STAFF' ? 4.2 : 3.4}
                color={role === 'ADMIN' ? '#a855f7' : role === 'CO_OWNER' ? '#10b981' : '#00f2fe'}
              />
              <Html
                center
                distanceFactor={8.8}
                style={{ pointerEvents: 'auto', userSelect: 'none' }}
              >
                <QueryClientProvider client={queryClient}>
                  {renderPanel ? (
                    renderPanel(vehicle, () => clearSelection())
                  ) : role === 'ADMIN' ? (
                    <AdminVehicleMonitorPanel
                      vehicle={vehicle}
                      onClose={() => clearSelection()}
                    />
                  ) : role === 'STAFF' ? (
                    <StaffOperationsPanel
                      vehicle={vehicle}
                      onClose={() => clearSelection()}
                    />
                  ) : (
                    <CoOwnerVehiclePanel
                      vehicle={vehicle}
                      onClose={() => clearSelection()}
                    />
                  )}
                </QueryClientProvider>
              </Html>
            </Billboard>
          </group>
        </>
      )}

      {/* 5. Vehicle Inspection Mode: Floating Instruction Guide */}
      {vehicleInspectionMode && !selectedVehiclePartId && (
        <VehicleInspectionGuide />
      )}

      {/* 6. Vehicle Inspection Mode: Detailed Spatial Vehicle Part Panel */}
      {vehicleInspectionMode && selectedPart && (
        <SpatialVehiclePartPanel part={selectedPart} />
      )}

      {/* 7. Phase 07: Vehicle 3D Co-Ownership View */}
      {vehicleCoOwnershipMode && (
        <VehicleCoOwnershipWorld vehicle={vehicle} />
      )}

      {/* 8. Phase 08: Pure 3D Vehicle Booking View */}
      {vehicleBookingMode && (
        <VehicleBookingWorld vehicle={vehicle} />
      )}

      {/* 9a. Phase 09: Dedicated CO_OWNER Receipt Review View */}
      {vehicleReceiptReviewMode && (
        <CoOwnerReceiptWorld vehicle={vehicle} />
      )}

      {/* 9b. Phase 09: 3D Vehicle Handover & Check-in View (STAFF/ADMIN) */}
      {vehicleHandoverMode && (
        <VehicleHandoverWorld vehicle={vehicle} />
      )}

      {/* 10. Phase 10: Pure 3D Trip Start View */}
      {vehicleTripStartMode && (
        <TripStartWorld vehicle={vehicle} />
      )}

      {/* 11. Phase 11: Pure 3D Trip Visualization View */}
      {vehicleTripVisualizationMode && (
        <TripVisualizationWorld vehicle={vehicle} />
      )}
    </group>
  );
};
