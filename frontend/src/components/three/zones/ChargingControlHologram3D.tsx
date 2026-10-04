import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Zap,
  BatteryCharging,
  BatteryMedium,
  Clock,
  ChevronRight,
  Power,
} from 'lucide-react';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { fetchChargingStations, fetchActiveChargingSession } from '../../../services/chargingApi';
import { fetchVehicles } from '../../../services/vehicleApi';
import { ChargingStationResponse, ChargingSessionResponse } from '../../../types/charging';
import { VehicleResponse } from '../../../types/vehicle';
import { resolveVehicleCode } from '../vehicles/vehicleModelConfig';
import { FeatureHologramPanel3D } from './common/FeatureHologramPanel3D';

interface ChargingControlHologram3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  onClose?: () => void;
}

/**
 * ChargingControlHologram3D:
 * Standardized 3D World-Space Holographic Interactive Console for CO_OWNER Charging Zone.
 * Displays live battery telemetry, smart charging stations, and charging session controls.
 */
export const ChargingControlHologram3D: React.FC<ChargingControlHologram3DProps> = ({
  position = [6.5, 1.5, 2.80],
  rotation = [0, -0.1745, 0],
  onClose,
}) => {
  const user = useAuthStore((state) => state.user);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const enterChargingMode = useWorldStore((state) => state.enterChargingMode);
  const exitChargingMode = useWorldStore((state) => state.exitChargingMode);
  const vehicleChargingMode = useWorldStore((state) => state.vehicleChargingMode);

  // Authoritative TanStack Query: Charging Stations
  const { data: stations = [] } = useQuery<ChargingStationResponse[]>({
    queryKey: ['chargingStations'],
    queryFn: fetchChargingStations,
    staleTime: 6000,
  });

  // Query vehicles to resolve active vehicle
  const { data: vehicles = [] } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
    staleTime: 6000,
  });

  // Derive target vehicle
  const activeVehicle = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return null;
    if (selectedVehicleId) {
      const match = vehicles.find((v) => {
        const code = resolveVehicleCode(v);
        return v.id === selectedVehicleId || code === selectedVehicleId;
      });
      if (match) return match;
    }
    return vehicles[0];
  }, [vehicles, selectedVehicleId]);

  // Query active charging session
  const { data: activeSession = null } = useQuery<ChargingSessionResponse | null>({
    queryKey: ['activeChargingSession', activeVehicle?.id],
    queryFn: () => (activeVehicle?.id ? fetchActiveChargingSession(activeVehicle.id) : Promise.resolve(null)),
    enabled: Boolean(activeVehicle?.id),
    refetchInterval: 3000,
  });

  const isCharging = activeVehicle?.status === 'CHARGING' || activeSession?.status === 'ACTIVE' || vehicleChargingMode;

  const batteryPercent = activeVehicle?.batteryLevel ?? 82;
  const estimatedRange = Math.round((batteryPercent / 100) * 420);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      clearSelection();
    }
  };

  const handleToggleCharging = () => {
    if (!activeVehicle?.id) return;
    if (isCharging) {
      exitChargingMode();
    } else {
      enterChargingMode(activeVehicle.id);
    }
  };

  return (
    <FeatureHologramPanel3D
      position={position}
      rotation={rotation}
      panelW={2.95}
      panelH={4.35}
      distanceFactor={3.25}
      contentWidth="340px"
      title="Khu vực sạc"
      subtitle="Quản lý trạm sạc & pin EV01"
      icon={<Zap size={28} color="#00f2fe" />}
      statusBadge={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 700,
            color: isCharging ? '#00f2fe' : '#10b981',
            background: isCharging ? 'rgba(0, 242, 254, 0.16)' : 'rgba(16, 185, 129, 0.16)',
            border: `1px solid ${isCharging ? '#00f2fe' : '#10b981'}`,
            padding: '2px 8px',
            borderRadius: '9999px',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isCharging ? '#00f2fe' : '#10b981',
              boxShadow: `0 0 8px ${isCharging ? '#00f2fe' : '#10b981'}`,
            }}
          />
          <span>{isCharging ? 'Đang sạc DC' : 'Sẵn sàng sạc'}</span>
        </div>
      }
      onClose={handleClose}
      testId="charging-3d-control-panel"
    >
      {/* 1. Main Battery State of Charge (SOC) Card */}
      <div
        style={{
          background: 'rgba(10, 30, 56, 0.85)',
          border: '1.4px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '20px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              background: isCharging ? 'rgba(0, 242, 254, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: `1.5px solid ${isCharging ? '#00f2fe' : '#10b981'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 16px ${isCharging ? 'rgba(0, 242, 254, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
            }}
          >
            {isCharging ? (
              <BatteryCharging size={26} color="#00f2fe" />
            ) : (
              <BatteryMedium size={26} color="#10b981" />
            )}
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
              Dung lượng pin EV01 (SOC)
            </div>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.01em',
                lineHeight: 1.15,
                marginTop: '2px',
              }}
            >
              {batteryPercent}%
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginLeft: '6px' }}>
                ({estimatedRange} km)
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Công suất</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#00f2fe' }}>
            {isCharging ? '92 kW DC' : '0 kW'}
          </div>
        </div>
      </div>

      {/* 2. Battery Capacity Progress Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
          <span style={{ color: '#94a3b8' }}>Dung lượng khả dụng</span>
          <span style={{ color: '#ffffff', fontWeight: 700 }}>64.2 kWh / 78.4 kWh</span>
        </div>
        <div
          style={{
            height: '9px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            border: '1px solid rgba(0, 242, 254, 0.25)',
          }}
        >
          <div
            style={{
              width: `${batteryPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00f2fe 0%, #38bdf8 100%)',
              borderRadius: '9999px',
              boxShadow: '0 0 10px rgba(0, 242, 254, 0.6)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* 3. Available Charging Stations List */}
      <div
        style={{
          background: 'rgba(6, 20, 40, 0.75)',
          border: '1.2px solid rgba(0, 242, 254, 0.25)',
          borderRadius: '18px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0' }}>
          Trụ sạc thông minh trong Showroom:
        </div>

        {/* Station 1 */}
        <div
          style={{
            background: 'rgba(10, 30, 56, 0.7)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '12px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#00f2fe',
                boxShadow: '0 0 8px #00f2fe',
              }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                Station A1 (Siêu tốc DC)
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>150 kW Max | CCS2 | Đang trống</div>
            </div>
          </div>
          <span
            style={{
              fontSize: '10px',
              color: '#00f2fe',
              fontWeight: 700,
              background: 'rgba(0, 242, 254, 0.15)',
              padding: '2px 7px',
              borderRadius: '9999px',
            }}
          >
            ƯU TIÊN
          </span>
        </div>

        {/* Station 2 */}
        <div
          style={{
            background: 'rgba(10, 30, 56, 0.7)',
            border: '1px solid rgba(0, 242, 254, 0.2)',
            borderRadius: '12px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                Station A2 (Tiêu chuẩn AC)
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>22 kW Max | Type 2 | Đang trống</div>
            </div>
          </div>
          <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>KHẢ DỤNG</span>
        </div>
      </div>

      {/* 4. Session Estimation Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(10, 30, 56, 0.65)',
          borderRadius: '14px',
          padding: '9px 14px',
          border: '1px solid rgba(0, 242, 254, 0.2)',
          fontSize: '11px',
          color: '#cbd5e1',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={13} color="#00f2fe" />
          <span>Thời gian sạc đầy:</span>
        </span>
        <span style={{ color: '#00f2fe', fontWeight: 700 }}>~28 phút (đến 80%)</span>
      </div>

      {/* 5. Primary Charging Control Action Button */}
      <button
        type="button"
        onClick={handleToggleCharging}
        style={{
          background: isCharging
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
          border: 'none',
          borderRadius: '16px',
          padding: '13px 18px',
          color: isCharging ? '#ffffff' : '#041628',
          fontSize: '14.5px',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: isCharging
            ? '0 6px 20px rgba(239, 68, 68, 0.4)'
            : '0 6px 20px rgba(0, 242, 254, 0.4)',
          transition: 'all 0.2s',
          marginTop: '2px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Power size={18} color={isCharging ? '#ffffff' : '#041628'} />
          <span>{isCharging ? 'Dừng phiên sạc DC' : 'Bắt đầu sạc nhanh DC (150kW)'}</span>
        </div>
        <ChevronRight size={18} color={isCharging ? '#ffffff' : '#041628'} />
      </button>
    </FeatureHologramPanel3D>
  );
};
