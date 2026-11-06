import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  BatteryCharging,
  Clock,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
  Square,
  History,
  Activity,
  Plus,
} from 'lucide-react';
import { VehicleResponse } from '../../../types/vehicle';
import {
  ChargingSessionResponse,
  ChargingStationResponse,
} from '../../../types/charging';
import {
  fetchChargingStations,
  fetchActiveChargingSession,
  fetchVehicleChargingSessions,
  createChargingSession,
  completeChargingSession,
  cancelChargingSession,
  progressChargingSession,
} from '../../../services/chargingApi';
import { CHARGING_STATION_THEMES } from '../../../config/chargingVisualConfig';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import {
  resolveVehicleCode,
  resolveVehicleDisplayName,
} from '../vehicles/vehicleModelConfig';

export interface ChargingPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

type PanelTab = 'OPERATION' | 'HISTORY';

export const ChargingPanel: React.FC<ChargingPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const selectedChargingStationId = useWorldStore(
    (state) => state.selectedChargingStationId
  );
  const setSelectedChargingStation = useWorldStore(
    (state) => state.setSelectedChargingStation
  );
  const returnToVehicleOverview = useWorldStore(
    (state) => state.returnToVehicleOverview
  );

  const [activeTab, setActiveTab] = useState<PanelTab>('OPERATION');
  const [selectedStationId, setSelectedStationId] = useState<string>(
    selectedChargingStationId || ''
  );
  const [targetSoc, setTargetSoc] = useState<number>(90);
  const [actionError, setActionError] = useState<string | null>(null);

  const vehicleCode = resolveVehicleCode(vehicle);
  const vehicleDisplayName = resolveVehicleDisplayName(vehicle, vehicleCode);
  const currentSoc = vehicle.currentBatteryLevel ?? 80;

  // 1. Authoritative TanStack Query: Charging Stations in Garage
  const { data: stations = [] } = useQuery<ChargingStationResponse[]>({
    queryKey: ['chargingStations'],
    queryFn: fetchChargingStations,
    refetchInterval: 5000,
  });

  // Keep selectedStationId initialized to first available station
  useEffect(() => {
    if (!selectedStationId && stations.length > 0) {
      const available = stations.find((s) => s.status === 'AVAILABLE') || stations[0];
      setSelectedStationId(available.id);
      setSelectedChargingStation(available.id);
    }
  }, [stations, selectedStationId, setSelectedChargingStation]);

  // 2. Authoritative TanStack Query: Active Charging Session for Vehicle
  const {
    data: activeSession,
    refetch: refetchActiveSession,
  } = useQuery<ChargingSessionResponse | null>({
    queryKey: ['activeChargingSession', vehicle?.id],
    queryFn: () => (vehicle?.id ? fetchActiveChargingSession(vehicle.id) : Promise.resolve(null)),
    enabled: Boolean(vehicle?.id),
    refetchInterval: 3000,
  });

  // 3. Authoritative TanStack Query: Vehicle Charging History
  const {
    data: sessionHistory = [],
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery<ChargingSessionResponse[]>({
    queryKey: ['chargingSessions', vehicle?.id],
    queryFn: () => (vehicle?.id ? fetchVehicleChargingSessions(vehicle.id) : Promise.resolve([])),
    enabled: Boolean(vehicle?.id && activeTab === 'HISTORY'),
  });

  const invalidateAllChargingQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['activeChargingSession', vehicle.id] }),
      queryClient.invalidateQueries({ queryKey: ['chargingSessions', vehicle.id] }),
      queryClient.invalidateQueries({ queryKey: ['chargingStations'] }),
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle.id] }),
      queryClient.invalidateQueries({ queryKey: ['vehicleBatteryHealth', vehicle.id] }),
    ]);
  };

  // Auto-complete detector
  const prevSessionStatusRef = useRef<string | null>(null);
  useEffect(() => {
    const prevStatus = prevSessionStatusRef.current;
    const currentStatus = activeSession?.status;

    if (
      (prevStatus === 'ACTIVE' && currentStatus === 'COMPLETED') ||
      (currentStatus === 'ACTIVE' && (activeSession?.currentSocPercent ?? 0) >= (activeSession?.targetSocPercent ?? 100))
    ) {
      invalidateAllChargingQueries();
    }
    prevSessionStatusRef.current = currentStatus ?? null;
  }, [activeSession?.status, activeSession?.currentSocPercent, activeSession?.targetSocPercent]);

  // Start Charging Mutation
  const startMutation = useMutation({
    mutationFn: () =>
      createChargingSession(vehicle.id, {
        chargingStationId: selectedStationId || selectedStationObj?.id || 'station-cs01-uuid',
        targetSocPercent: targetSoc,
        startImmediately: true,
      }),
    onSuccess: async () => {
      setActionError(null);
      await invalidateAllChargingQueries();
      refetchActiveSession();
    },
    onError: (err: any) => {
      setActionError(err.message || 'Không thể bắt đầu phiên sạc.');
    },
  });

  // Complete / Stop Charging Mutation
  const completeMutation = useMutation({
    mutationFn: (sessionId: string) => completeChargingSession(sessionId),
    onSuccess: async () => {
      setActionError(null);
      await invalidateAllChargingQueries();
      refetchActiveSession();
      refetchHistory();
    },
    onError: (err: any) => {
      setActionError(err.message || 'Không thể kết thúc phiên sạc.');
    },
  });

  // Cancel Charging Mutation
  const cancelMutation = useMutation({
    mutationFn: (sessionId: string) => cancelChargingSession(sessionId),
    onSuccess: async () => {
      setActionError(null);
      await invalidateAllChargingQueries();
      refetchActiveSession();
      refetchHistory();
    },
    onError: (err: any) => {
      setActionError(err.message || 'Không thể hủy phiên sạc.');
    },
  });

  // Step Progress Simulation Mutation
  const progressMutation = useMutation({
    mutationFn: (newSoc: number) => {
      if (!activeSession) throw new Error('Không có phiên sạc hoạt động.');
      return progressChargingSession(activeSession.id, {
        newSocPercent: newSoc,
      });
    },
    onSuccess: async () => {
      setActionError(null);
      await invalidateAllChargingQueries();
      refetchActiveSession();
    },
    onError: (err: any) => {
      setActionError(err.message || 'Không thể cập nhật tiến trình sạc.');
    },
  });

  const isVehicleCharging = Boolean(activeSession && activeSession.status === 'ACTIVE');
  const sessionSoc = activeSession?.currentSocPercent ?? currentSoc;
  const sessionTarget = activeSession?.targetSocPercent ?? targetSoc;

  // Remaining time estimate calculation
  const estimatedRemainingMinutes = useMemo(() => {
    if (!isVehicleCharging || !activeSession) {
      const deltaPercent = Math.max(0, targetSoc - currentSoc);
      if (deltaPercent <= 0) return 0;
      const capacity = vehicle.usableBatteryCapacityKwh || vehicle.batteryCapacity || 78.4;
      const remainingKwh = (deltaPercent * capacity) / 100;
      const power = selectedStationId === 'station-cs02-uuid' || selectedStationId === 'CS02' ? 60 : 150;
      const effectivePower = power * 0.92;
      return Math.max(1, Math.round((remainingKwh / effectivePower) * 60));
    }
    if (activeSession.estimatedRemainingMinutes !== undefined && activeSession.estimatedRemainingMinutes !== null) {
      return activeSession.estimatedRemainingMinutes;
    }
    const power = activeSession.powerKw || 150;
    const capacity = vehicle.usableBatteryCapacityKwh || vehicle.batteryCapacity || 78.4;
    const deltaPercent = Math.max(0, sessionTarget - sessionSoc);
    const remainingKwh = (deltaPercent * capacity) / 100;
    if (remainingKwh <= 0) return 0;
    const effectivePower = power * 0.92;
    return Math.max(1, Math.round((remainingKwh / effectivePower) * 60));
  }, [isVehicleCharging, activeSession, sessionTarget, sessionSoc, targetSoc, currentSoc, vehicle.batteryCapacity, vehicle.usableBatteryCapacityKwh, selectedStationId]);

  const isVehicleMaintenance = vehicle.status === 'MAINTENANCE';
  const isVehicleInUse = vehicle.status === 'IN_USE';

  const effectiveStations = useMemo(() => {
    if (stations.length > 0) return stations;
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

  const selectedStationObj = useMemo(() => {
    const match = effectiveStations.find((s) => s.id === selectedStationId || s.code === selectedStationId);
    if (match) return match;
    const available = effectiveStations.find((s) => s.status === 'AVAILABLE');
    return available || effectiveStations[0];
  }, [effectiveStations, selectedStationId]);

  const canStartCharging =
    !isVehicleCharging &&
    !isVehicleMaintenance &&
    !isVehicleInUse &&
    selectedStationObj?.status === 'AVAILABLE' &&
    targetSoc > currentSoc;

  const totalCapacityKwh = vehicle.usableBatteryCapacityKwh || vehicle.batteryCapacity || 78.4;
  const availableKwh = Number(((currentSoc * totalCapacityKwh) / 100).toFixed(1));
  const estimatedRangeKm = Math.round((currentSoc / 100) * 420);
  const activePowerText = isVehicleCharging
    ? `${activeSession?.powerKw || selectedStationObj.maxPowerKw} kW DC`
    : '0 kW';

  return (
    <div
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '76px',
        right: '24px',
        width: 'min(440px, calc(100vw - 32px))',
        maxWidth: 'calc(100vw - 32px)',
        height: 'auto',
        maxHeight: 'calc(100vh - 96px)',
        zIndex: 40,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(8, 26, 48, 0.96) 0%, rgba(4, 14, 28, 0.98) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 242, 254, 0.48)',
        borderRadius: '20px',
        padding: '12px 16px 14px 16px',
        boxShadow:
          '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 242, 254, 0.22), inset 0 1.5px 1px rgba(255, 255, 255, 0.15)',
        color: '#f8fafc',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        fontFamily: "var(--font-family, 'Outfit', sans-serif)",
      }}
    >
      {/* =========================================================================
          PART A: COMPACT HEADER & TAB NAVIGATION (flex: 0 0 auto)
          ========================================================================= */}
      <div style={{ flex: '0 0 auto' }}>
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            marginBottom: '8px',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1.2px solid #00f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00f2fe',
                boxShadow: '0 0 10px rgba(0, 242, 254, 0.35)',
                flexShrink: 0,
              }}
            >
              <Zap size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2
                  style={{
                    fontSize: '15px',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.15,
                    margin: 0,
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                  }}
                >
                  KHU VỰC SẠC
                </h2>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: isVehicleCharging ? '#00f2fe' : '#10b981',
                    background: isVehicleCharging ? 'rgba(0, 242, 254, 0.16)' : 'rgba(16, 185, 129, 0.16)',
                    border: `1px solid ${isVehicleCharging ? '#00f2fe' : '#10b981'}`,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: isVehicleCharging ? '#00f2fe' : '#10b981',
                      boxShadow: `0 0 6px ${isVehicleCharging ? '#00f2fe' : '#10b981'}`,
                    }}
                  />
                  <span>{isVehicleCharging ? 'Đang sạc' : 'Khả dụng'}</span>
                </div>
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  color: '#94a3b8',
                  marginTop: '1px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {vehicleDisplayName} ({vehicleCode}{vehicle.licensePlate ? ` | ${vehicle.licensePlate}` : ''})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                else returnToVehicleOverview();
              }}
              title="Đóng bảng điều khiển sạc"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Compact Mode Tabs: OPERATION vs HISTORY */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            background: 'rgba(15, 23, 42, 0.75)',
            padding: '2px',
            borderRadius: '8px',
            marginBottom: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('OPERATION')}
            style={{
              background:
                activeTab === 'OPERATION'
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(14, 165, 233, 0.2) 100%)'
                  : 'transparent',
              border: activeTab === 'OPERATION' ? '1px solid #00f2fe' : '1px solid transparent',
              color: activeTab === 'OPERATION' ? '#ffffff' : '#94a3b8',
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '10.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <BatteryCharging size={12} color={activeTab === 'OPERATION' ? '#00f2fe' : '#94a3b8'} />
            <span>ĐIỀU KHIỂN SẠC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            style={{
              background:
                activeTab === 'HISTORY'
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(14, 165, 233, 0.2) 100%)'
                  : 'transparent',
              border: activeTab === 'HISTORY' ? '1px solid #00f2fe' : '1px solid transparent',
              color: activeTab === 'HISTORY' ? '#ffffff' : '#94a3b8',
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '10.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <History size={12} color={activeTab === 'HISTORY' ? '#00f2fe' : '#94a3b8'} />
            <span>LỊCH SỬ SẠC</span>
          </button>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '10.5px',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
            }}
          >
            <AlertTriangle size={12} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{actionError}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          PART B: MAIN SCROLLABLE CONTROLS BODY (flex: 1 1 auto, minHeight: 0)
          ========================================================================= */}
      <div
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '2px',
        }}
      >
        {activeTab === 'OPERATION' ? (
          <>
            {/* Case 1: Active Ongoing Session */}
            {isVehicleCharging && activeSession ? (
              <div
                style={{
                  background: 'rgba(10, 30, 56, 0.75)',
                  border: '1.2px solid rgba(0, 242, 254, 0.45)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#00f2fe',
                        boxShadow: '0 0 8px #00f2fe',
                      }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#00f2fe' }}>
                      ĐANG NẠP NĂNG LƯỢNG
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {activeSession.chargingStationCode}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '11px' }}>
                    <span style={{ color: '#cbd5e1' }}>Tiến độ:</span>
                    <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                      {sessionSoc}% <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>/ {sessionTarget}%</span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, (sessionSoc / sessionTarget) * 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #00f2fe 0%, #38bdf8 100%)',
                        boxShadow: '0 0 8px rgba(0, 242, 254, 0.6)',
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>

                {/* Telemetry Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '10px' }}>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px 8px', borderRadius: '6px' }}>
                    <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Gauge size={10} color="#38bdf8" /> Công suất
                    </div>
                    <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '11.5px', marginTop: '1px' }}>
                      {activeSession.powerKw || 150} kW
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px 8px', borderRadius: '6px' }}>
                    <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={10} color="#10b981" /> Điện năng
                    </div>
                    <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '11.5px', marginTop: '1px' }}>
                      {activeSession.energyDeliveredKwh != null ? `${activeSession.energyDeliveredKwh} kWh` : 'Đang tính'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px 8px', borderRadius: '6px' }}>
                    <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} color="#f59e0b" /> Còn lại
                    </div>
                    <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '11.5px', marginTop: '1px' }}>
                      {estimatedRemainingMinutes != null ? `~${estimatedRemainingMinutes} ph` : 'Đang sạc'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px 8px', borderRadius: '6px' }}>
                    <div style={{ color: '#94a3b8' }}>Trụ sạc</div>
                    <div style={{ fontWeight: 800, color: '#00f2fe', fontSize: '11px', marginTop: '1px' }}>
                      {activeSession.chargingStationName}
                    </div>
                  </div>
                </div>

                {/* DEV simulation helper */}
                {Boolean((import.meta as any)?.env?.DEV) && sessionSoc < sessionTarget && (
                  <button
                    type="button"
                    onClick={() => progressMutation.mutate(Math.min(sessionTarget, sessionSoc + 5))}
                    disabled={progressMutation.isPending}
                    style={{
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px dashed rgba(6, 182, 212, 0.4)',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      padding: '4px',
                      fontSize: '9.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={10} />
                    <span>[DEV] Mô phỏng nạp +5% pin</span>
                  </button>
                )}
              </div>
            ) : activeSession && activeSession.status === 'COMPLETED' ? (
              /* Case 2: Completed Session Banner */
              <div
                style={{
                  background: 'rgba(10, 30, 56, 0.75)',
                  border: '1.2px solid rgba(16, 185, 129, 0.5)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981' }}>
                    HOÀN TẤT SẠC PIN ({activeSession.currentSocPercent}%)
                  </span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  Đã nạp {activeSession.energyDeliveredKwh || 0} kWh tại trụ {activeSession.chargingStationCode}. Xe sẵn sàng khởi hành.
                </div>
              </div>
            ) : (
              /* Case 3: Configuration & Controls */
              <>
                {/* Warning banners if applicable */}
                {isVehicleMaintenance && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '10.5px',
                      color: '#fca5a5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertTriangle size={13} color="#ef4444" style={{ flexShrink: 0 }} />
                    <span>Xe đang bảo dưỡng nên chưa thể sạc lúc này.</span>
                  </div>
                )}

                {isVehicleInUse && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid #f59e0b',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '10.5px',
                      color: '#fcd34d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertTriangle size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <span>Xe đang được sử dụng trong chuyến đi.</span>
                  </div>
                )}

                {/* 1. Combined Battery Status Card */}
                <div
                  style={{
                    background: 'rgba(10, 30, 56, 0.75)',
                    border: '1.2px solid rgba(0, 242, 254, 0.35)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(0, 242, 254, 0.14)',
                          border: '1.2px solid #00f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <BatteryCharging size={18} color="#00f2fe" />
                      </div>
                      <div>
                        <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                          DUNG LƯỢNG PIN
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
                          {currentSoc}%
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8', marginLeft: '5px' }}>
                            (~{estimatedRangeKm} km)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>Công suất nạp</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#00f2fe' }}>
                        {activePowerText}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Available Energy */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
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

                {/* 2. Target SOC Controls (Compact 1-row + subtle slider) */}
                <div
                  style={{
                    background: 'rgba(10, 30, 56, 0.5)',
                    border: '1px solid rgba(56, 189, 248, 0.22)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>Mức pin mục tiêu:</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#00f2fe' }}>
                      {targetSoc}% <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>(~{Math.round((targetSoc / 100) * 420)} km)</span>
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
                    {[80, 90, 100].map((socVal) => (
                      <button
                        key={socVal}
                        type="button"
                        onClick={() => setTargetSoc(socVal)}
                        style={{
                          background:
                            targetSoc === socVal
                              ? 'rgba(0, 242, 254, 0.22)'
                              : 'rgba(255, 255, 255, 0.05)',
                          border: targetSoc === socVal ? '1.2px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: targetSoc === socVal ? '#ffffff' : '#94a3b8',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{socVal}%</span>
                        <span style={{ fontSize: '8.5px', fontWeight: 500, color: targetSoc === socVal ? '#38bdf8' : '#64748b' }}>
                          ({socVal === 80 ? 'Chuẩn' : socVal === 90 ? 'Tối ưu' : 'Đầy'})
                        </span>
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min={Math.min(99, Math.max(currentSoc + 1, 50))}
                    max={100}
                    value={targetSoc}
                    onChange={(e) => setTargetSoc(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#00f2fe', cursor: 'pointer', height: '4px', marginTop: '2px' }}
                  />
                </div>

                {/* 3. Charger Selection (Two Equal Compact Cards) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Chọn trụ sạc tại Garage:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {effectiveStations.map((st) => {
                      const isStSelected = selectedStationObj.id === st.id || selectedStationObj.code === st.code;
                      const isAvail = st.status === 'AVAILABLE';
                      const theme = CHARGING_STATION_THEMES[st.status] || CHARGING_STATION_THEMES.AVAILABLE;

                      return (
                        <div
                          key={st.id}
                          onClick={() => {
                            if (isAvail) {
                              setSelectedStationId(st.id);
                              setSelectedChargingStation(st.id);
                            }
                          }}
                          style={{
                            background: isStSelected ? 'rgba(0, 242, 254, 0.16)' : 'rgba(10, 30, 56, 0.65)',
                            border: isStSelected ? '1.5px solid #00f2fe' : '1px solid rgba(56, 189, 248, 0.22)',
                            borderRadius: '10px',
                            padding: '7px 9px',
                            cursor: isAvail ? 'pointer' : 'not-allowed',
                            opacity: isAvail ? 1.0 : 0.6,
                            boxShadow: isStSelected ? '0 0 12px rgba(0, 242, 254, 0.25)' : 'none',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '3px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: isStSelected ? '#00f2fe' : theme.primary,
                                  boxShadow: `0 0 5px ${isStSelected ? '#00f2fe' : theme.glow}`,
                                }}
                              />
                              <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#ffffff' }}>
                                {st.code}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '8.5px',
                                fontWeight: 700,
                                color: theme.primary,
                                background: theme.bg,
                                border: `1px solid ${theme.border}`,
                                padding: '1px 4px',
                                borderRadius: '3px',
                              }}
                            >
                              {theme.labelVi}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff' }}>
                              {st.maxPowerKw} kW
                            </span>
                            <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                              {st.connectorType}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: '8.5px',
                              fontWeight: isStSelected ? 800 : 500,
                              color: isStSelected ? '#00f2fe' : '#64748b',
                              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                              paddingTop: '2px',
                              marginTop: '1px',
                            }}
                          >
                            {isStSelected ? '● ĐANG CHỌN' : 'Nhấn chọn'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Session Estimation Info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(10, 30, 56, 0.65)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    border: '1px solid rgba(0, 242, 254, 0.2)',
                    fontSize: '10.5px',
                    color: '#cbd5e1',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={12} color="#00f2fe" />
                    <span>Dự kiến đến {targetSoc}%:</span>
                  </span>
                  <span style={{ color: '#00f2fe', fontWeight: 800 }}>
                    {estimatedRemainingMinutes != null && estimatedRemainingMinutes > 0
                      ? `~${estimatedRemainingMinutes} phút`
                      : currentSoc >= targetSoc
                      ? 'Đã đạt mục tiêu'
                      : 'Đang tính...'}
                  </span>
                </div>
              </>
            )}
          </>
        ) : (
          /* Tab Content: HISTORY */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {isLoadingHistory ? (
              <div style={{ textAlign: 'center', padding: '16px', color: '#38bdf8', fontSize: '11px' }}>
                Đang tải lịch sử sạc...
              </div>
            ) : sessionHistory.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '20px 10px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  fontSize: '11px',
                }}
              >
                Xe chưa có lịch sử sạc.
              </div>
            ) : (
              sessionHistory.map((sess) => (
                <div
                  key={sess.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(56, 189, 248, 0.15)',
                    borderRadius: '8px',
                    padding: '6px 9px',
                    fontSize: '10.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>
                      {sess.chargingStationName}
                    </span>
                    <span
                      style={{
                        fontSize: '8.5px',
                        fontWeight: 700,
                        color: sess.status === 'COMPLETED' ? '#10b981' : sess.status === 'ACTIVE' ? '#00f2fe' : '#94a3b8',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                      }}
                    >
                      {sess.status === 'COMPLETED' ? 'HOÀN TẤT' : sess.status === 'ACTIVE' ? 'ĐANG SẠC' : 'ĐÃ HỦY'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '9.5px' }}>
                    <span>
                      SOC: <strong style={{ color: '#38bdf8' }}>{sess.startSocPercent}%</strong> → <strong style={{ color: '#10b981' }}>{sess.currentSocPercent}%</strong>
                    </span>
                    <span>
                      Điện năng: <strong style={{ color: '#ffffff' }}>{sess.energyDeliveredKwh || 0} kWh</strong>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          PART C: PERSISTENT ACTION FOOTER (flex: 0 0 auto - NEVER CLIPPED)
          ========================================================================= */}
      <div
        style={{
          flex: '0 0 auto',
          paddingTop: '8px',
          marginTop: '6px',
          borderTop: '1px solid rgba(56, 189, 248, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {activeTab === 'OPERATION' ? (
          isVehicleCharging && activeSession ? (
            /* Action Buttons for ACTIVE session */
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => completeMutation.mutate(activeSession.id)}
                disabled={completeMutation.isPending}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '10px',
                  padding: '9px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle2 size={13} />
                <span>HOÀN TẤT SẠC</span>
              </button>

              <button
                type="button"
                onClick={() => cancelMutation.mutate(activeSession.id)}
                disabled={cancelMutation.isPending}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  borderRadius: '10px',
                  padding: '9px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <Square size={11} />
                <span>DỪNG SẠC</span>
              </button>
            </div>
          ) : activeSession && activeSession.status === 'COMPLETED' ? (
            /* Button for COMPLETED session */
            <button
              type="button"
              onClick={async () => {
                await invalidateAllChargingQueries();
                refetchActiveSession();
                refetchHistory();
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '9px 12px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle2 size={13} />
              <span>XÁC NHẬN & ĐÓNG PHIÊN SẠC</span>
            </button>
          ) : (
            /* Persistent Primary Start Charging CTA */
            <button
              type="button"
              onClick={() => startMutation.mutate()}
              disabled={!canStartCharging || startMutation.isPending}
              style={{
                width: '100%',
                background: canStartCharging
                  ? 'linear-gradient(135deg, #00f2fe 0%, #00c6ff 100%)'
                  : 'rgba(255, 255, 255, 0.08)',
                color: canStartCharging ? '#041628' : '#64748b',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 900,
                letterSpacing: '0.02em',
                cursor: canStartCharging ? 'pointer' : 'not-allowed',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                boxShadow: canStartCharging ? '0 6px 20px rgba(0, 242, 254, 0.35)' : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {startMutation.isPending ? (
                  <Activity size={15} className="animate-spin" />
                ) : (
                  <Zap size={15} />
                )}
                <span>BẮT ĐẦU SẠC — {selectedStationObj?.code || 'CS01'}</span>
              </div>
              <div style={{ fontSize: '9.5px', fontWeight: 600, opacity: 0.85 }}>
                {selectedStationObj?.maxPowerKw || 150} kW Max · {selectedStationObj?.connectorType || 'CCS2'}
              </div>
            </button>
          )
        ) : (
          /* History tab footer */
          <button
            type="button"
            onClick={() => refetchHistory()}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '7px',
              fontSize: '10.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <RotateCcw size={11} />
            <span>LÀM MỚI LỊCH SỬ SẠC</span>
          </button>
        )}
      </div>
    </div>
  );
};
