import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Zap,
  BatteryCharging,
  BatteryMedium,
  Clock,
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
  position = [6.6, 1.55, 2.70],
  rotation = [0, 0, 0],
  onClose,
}) => {
  const user = useAuthStore((state) => state.user);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const selectedChargingStationId = useWorldStore((state) => state.selectedChargingStationId);
  const setSelectedChargingStation = useWorldStore((state) => state.setSelectedChargingStation);
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const enterChargingMode = useWorldStore((state) => state.enterChargingMode);
  const exitChargingMode = useWorldStore((state) => state.exitChargingMode);
  const vehicleChargingMode = useWorldStore((state) => state.vehicleChargingMode);

  // Authoritative TanStack Query: Charging Stations
  const { data: stations = [] } = useQuery<ChargingStationResponse[]>({
    queryKey: ['chargingStations'],
    queryFn: fetchChargingStations,
    staleTime: 60000,
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

  const vehicleCode = resolveVehicleCode(activeVehicle);

  // Query active charging session (polls every 3s only when actively charging)
  const { data: activeSession = null } = useQuery<ChargingSessionResponse | null>({
    queryKey: ['activeChargingSession', activeVehicle?.id],
    queryFn: () => (activeVehicle?.id ? fetchActiveChargingSession(activeVehicle.id) : Promise.resolve(null)),
    enabled: Boolean(activeVehicle?.id),
    staleTime: 3000,
    refetchInterval: (query) => {
      const session = query.state.data;
      const isChargingNow = session?.status === 'ACTIVE' || activeVehicle?.status === 'CHARGING' || vehicleChargingMode;
      return isChargingNow ? 3000 : false;
    },
  });

  const isCharging = activeVehicle?.status === 'CHARGING' || activeSession?.status === 'ACTIVE' || vehicleChargingMode;

  // Real vehicle battery metrics
  const currentSoc = activeVehicle?.currentBatteryLevel ?? 80;
  const totalCapacityKwh = activeVehicle?.usableBatteryCapacityKwh || activeVehicle?.batteryCapacity || 78.4;
  const availableKwh = Number(((currentSoc * totalCapacityKwh) / 100).toFixed(1));
  const estimatedRangeKm = Math.round((currentSoc / 100) * 420);

  // Effective Stations
  const effectiveStations = useMemo(() => {
    if (stations && stations.length > 0) return stations;
    return [
      {
        id: 'station-cs01-uuid',
        code: 'CS01',
        name: 'Trụ sạc Siêu tốc 01',
        status: 'AVAILABLE' as const,
        maxPowerKw: 150,
        connectorType: 'CCS2' as const,
        locationLabel: 'Khu vực Sạc Nhanh - Bay CS-01',
        posX: 3.5,
        posY: 0.14,
        posZ: 3.2,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'station-cs02-uuid',
        code: 'CS02',
        name: 'Trụ sạc Tiêu chuẩn 02',
        status: 'AVAILABLE' as const,
        maxPowerKw: 60,
        connectorType: 'CCS2' as const,
        locationLabel: 'Khu vực Sạc Nhanh - Bay CS-02',
        posX: 4.5,
        posY: 0.14,
        posZ: 3.2,
        createdAt: '',
        updatedAt: '',
      },
    ];
  }, [stations]);

  // Selected Station
  const selectedStation = useMemo(() => {
    if (selectedChargingStationId) {
      const match = effectiveStations.find(
        (s) => s.id === selectedChargingStationId || s.code === selectedChargingStationId
      );
      if (match) return match;
    }
    const available = effectiveStations.find((s) => s.status === 'AVAILABLE');
    return available || effectiveStations[0];
  }, [effectiveStations, selectedChargingStationId]);

  // Target SOC & Dynamic Estimated Duration
  const targetSoc = 90;
  const estimatedRemainingMinutes = useMemo(() => {
    if (activeSession?.estimatedRemainingMinutes != null) {
      return activeSession.estimatedRemainingMinutes;
    }
    const deltaPercent = Math.max(0, targetSoc - currentSoc);
    if (deltaPercent <= 0) return 0;
    const remainingKwh = (deltaPercent * totalCapacityKwh) / 100;
    const power = (isCharging && activeSession?.powerKw) || selectedStation?.maxPowerKw || 150;
    const effectivePower = power * 0.92;
    const hours = remainingKwh / effectivePower;
    return Math.max(1, Math.round(hours * 60));
  }, [activeSession?.estimatedRemainingMinutes, activeSession?.powerKw, targetSoc, currentSoc, totalCapacityKwh, selectedStation?.maxPowerKw, isCharging]);

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
      enterChargingMode(activeVehicle.id, selectedStation.id);
    }
  };

  const activePowerText = isCharging
    ? `${activeSession?.powerKw || selectedStation.maxPowerKw} kW DC`
    : '0 kW';

  return (
    <FeatureHologramPanel3D
      position={position}
      rotation={rotation}
      panelW={3.35}
      panelH={3.95}
      distanceFactor={3.25}
      contentWidth="min(420px, calc(100vw - 24px))"
      title="KHU VỰC SẠC"
      subtitle={`Quản lý sạc xe ${vehicleCode}`}
      icon={<Zap size={22} color="#00f2fe" />}
      statusBadge={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '10.5px',
            fontWeight: 800,
            color: isCharging ? '#00f2fe' : '#10b981',
            background: isCharging ? 'rgba(0, 242, 254, 0.16)' : 'rgba(16, 185, 129, 0.16)',
            border: `1px solid ${isCharging ? '#00f2fe' : '#10b981'}`,
            padding: '2px 7px',
            borderRadius: '9999px',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: isCharging ? '#00f2fe' : '#10b981',
              boxShadow: `0 0 6px ${isCharging ? '#00f2fe' : '#10b981'}`,
            }}
          />
          <span>{isCharging ? 'Đang sạc DC' : 'Sẵn sàng sạc'}</span>
        </div>
      }
      onClose={handleClose}
      testId="charging-3d-control-panel"
    >
      {/* 1. Unified Primary Battery Summary Card */}
      <div
        style={{
          background: 'rgba(10, 30, 56, 0.75)',
          border: '1.2px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '14px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: isCharging ? 'rgba(0, 242, 254, 0.16)' : 'rgba(16, 185, 129, 0.16)',
                border: `1.5px solid ${isCharging ? '#00f2fe' : '#10b981'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 0 10px ${isCharging ? 'rgba(0, 242, 254, 0.35)' : 'rgba(16, 185, 129, 0.3)'}`,
              }}
            >
              {isCharging ? (
                <BatteryCharging size={20} color="#00f2fe" />
              ) : (
                <BatteryMedium size={20} color="#10b981" />
              )}
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Dung lượng pin (SOC)
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1,
                  marginTop: '1px',
                }}
              >
                {currentSoc}%
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginLeft: '5px' }}>
                  (~{estimatedRangeKm} km)
                </span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>Công suất nạp</div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#00f2fe', marginTop: '1px' }}>
              {activePowerText}
            </div>
          </div>
        </div>

        {/* Integrated Progress Bar & Energy Metadata Row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              height: '6px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              border: '1px solid rgba(0, 242, 254, 0.25)',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, currentSoc))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981 0%, #00f2fe 100%)',
                borderRadius: '9999px',
                boxShadow: '0 0 8px rgba(0, 242, 254, 0.5)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px' }}>
            <span style={{ color: '#94a3b8' }}>Khả dụng / Danh định</span>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>
              {availableKwh} / {totalCapacityKwh} kWh
            </span>
          </div>
        </div>
      </div>

      {/* 2. Station Selection: Two Compact, Balanced Station Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Chọn trụ sạc tại Garage:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {effectiveStations.map((st) => {
            const isStSelected = selectedStation.id === st.id;
            const isAvail = st.status === 'AVAILABLE';

            return (
              <div
                key={st.id}
                onClick={() => {
                  if (isAvail) {
                    setSelectedChargingStation(st.id);
                  }
                }}
                style={{
                  background: isStSelected ? 'rgba(0, 242, 254, 0.16)' : 'rgba(10, 30, 56, 0.65)',
                  border: isStSelected ? '1.5px solid #00f2fe' : '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '12px',
                  padding: '8px 10px',
                  cursor: isAvail ? 'pointer' : 'not-allowed',
                  opacity: isAvail ? 1.0 : 0.6,
                  boxShadow: isStSelected ? '0 0 14px rgba(0, 242, 254, 0.25)' : 'none',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '4px',
                }}
              >
                {/* Header: Code & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isStSelected ? '#00f2fe' : (isAvail ? '#10b981' : '#f59e0b'),
                        boxShadow: `0 0 6px ${isStSelected ? '#00f2fe' : (isAvail ? '#10b981' : '#f59e0b')}`,
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff' }}>
                      {st.code}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 700,
                      color: isAvail ? '#10b981' : '#f59e0b',
                      background: isAvail ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      border: `1px solid ${isAvail ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                      padding: '1px 4px',
                      borderRadius: '4px',
                    }}
                  >
                    {isAvail ? 'Khả dụng' : 'Bận'}
                  </span>
                </div>

                {/* Power & Type */}
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    {st.maxPowerKw} kW
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '1px' }}>
                    {st.connectorType} · {st.maxPowerKw >= 100 ? 'Siêu tốc' : 'Tiêu chuẩn'}
                  </div>
                </div>

                {/* Selection State Indicator */}
                <div
                  style={{
                    paddingTop: '4px',
                    borderTop: isStSelected ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '9px',
                    fontWeight: isStSelected ? 800 : 500,
                    color: isStSelected ? '#00f2fe' : '#64748b',
                  }}
                >
                  {isStSelected ? '● ĐANG CHỌN' : 'Nhấn để chọn'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Session Estimation Info (Single Compact Information Row) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(10, 30, 56, 0.65)',
          borderRadius: '10px',
          padding: '7px 12px',
          border: '1px solid rgba(0, 242, 254, 0.2)',
          fontSize: '10.5px',
          color: '#cbd5e1',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Clock size={12} color="#00f2fe" />
          <span>Thời gian dự kiến (đến {targetSoc}%):</span>
        </span>
        <span style={{ color: '#00f2fe', fontWeight: 800 }}>
          {estimatedRemainingMinutes > 0 ? `~${estimatedRemainingMinutes} phút` : 'Đã đạt mục tiêu'}
        </span>
      </div>

      {/* 4. Primary Charging Action Button */}
      <button
        type="button"
        onClick={handleToggleCharging}
        style={{
          background: isCharging
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)',
          border: 'none',
          borderRadius: '12px',
          padding: '10px 16px',
          color: isCharging ? '#ffffff' : '#041628',
          fontSize: '12.5px',
          fontWeight: 900,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          cursor: 'pointer',
          boxShadow: isCharging
            ? '0 4px 16px rgba(239, 68, 68, 0.35)'
            : '0 4px 16px rgba(0, 242, 254, 0.35)',
          transition: 'all 0.18s ease',
          marginTop: '1px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Power size={15} color={isCharging ? '#ffffff' : '#041628'} />
          <span>
            {isCharging
              ? `DỪNG PHIÊN SẠC — ${selectedStation.code}`
              : `BẮT ĐẦU SẠC — ${selectedStation.code}`}
          </span>
        </div>
        <div style={{ fontSize: '9.5px', fontWeight: 600, opacity: 0.85 }}>
          {selectedStation.maxPowerKw} kW Max · {selectedStation.connectorType}
        </div>
      </button>
    </FeatureHologramPanel3D>
  );
};
