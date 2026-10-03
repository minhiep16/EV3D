import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Battery,
  BatteryCharging,
  Clock,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
  Play,
  Square,
  History,
  Activity,
  ChevronRight,
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
import { resolveVehicleCode } from '../vehicles/vehicleModelConfig';

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
  const currentSoc = vehicle.currentBatteryLevel ?? 80;

  // 1. Authoritative TanStack Query: Charging Stations in Garage
  const { data: stations = [], isLoading: isLoadingStations } = useQuery<
    ChargingStationResponse[]
  >({
    queryKey: ['chargingStations'],
    queryFn: fetchChargingStations,
    refetchInterval: 5000,
  });

  // Keep selectedStationId initialized to first available station
  React.useEffect(() => {
    if (!selectedStationId && stations.length > 0) {
      const available = stations.find((s) => s.status === 'AVAILABLE') || stations[0];
      setSelectedStationId(available.id);
      setSelectedChargingStation(available.id);
    }
  }, [stations, selectedStationId, setSelectedChargingStation]);

  // 2. Authoritative TanStack Query: Active Charging Session for Vehicle
  const {
    data: activeSession,
    isLoading: isLoadingSession,
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

  // Authoritative auto-complete detector: when active session reaches target or completes
  const prevSessionStatusRef = React.useRef<string | null>(null);
  React.useEffect(() => {
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
        chargingStationId: selectedStationId,
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

  // Remaining time estimate calculation using authoritative backend ETA or unified formula
  const estimatedRemainingMinutes = useMemo(() => {
    if (!isVehicleCharging || !activeSession) return null;
    if (activeSession.estimatedRemainingMinutes !== undefined && activeSession.estimatedRemainingMinutes !== null) {
      return activeSession.estimatedRemainingMinutes;
    }
    const power = activeSession.powerKw || 150;
    const capacity = vehicle.usableBatteryCapacityKwh || vehicle.batteryCapacity || 65;
    const deltaPercent = Math.max(0, sessionTarget - sessionSoc);
    const remainingKwh = (deltaPercent * capacity) / 100;
    if (remainingKwh <= 0) return 0;
    const effectivePower = power * 0.92;
    const hours = remainingKwh / effectivePower;
    return Math.max(1, Math.round(hours * 60));
  }, [isVehicleCharging, activeSession, sessionTarget, sessionSoc, vehicle.batteryCapacity, vehicle.usableBatteryCapacityKwh]);

  const isVehicleMaintenance = vehicle.status === 'MAINTENANCE';
  const isVehicleInUse = vehicle.status === 'IN_USE';

  const selectedStationObj = stations.find((s) => s.id === selectedStationId);

  const canStartCharging =
    !isVehicleCharging &&
    !isVehicleMaintenance &&
    !isVehicleInUse &&
    selectedStationObj?.status === 'AVAILABLE' &&
    targetSoc > currentSoc;

  return (
    <div
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '88px',
        right: '20px',
        width: 'clamp(330px, 26vw, 410px)',
        height: 'auto',
        maxHeight: 'calc(100dvh - 112px)',
        zIndex: 40,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8, 16, 28, 0.94)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '16px',
        padding: '16px 14px',
        boxShadow:
          '0 16px 40px rgba(0, 0, 0, 0.65), 0 0 24px rgba(0, 242, 254, 0.15)',
        color: '#f8fafc',
        boxSizing: 'border-box',
        overflowY: 'auto',
        userSelect: 'none',
        fontFamily: 'var(--font-family, sans-serif)',
      }}
    >
      {/* 1. Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '10px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.22)',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(15, 23, 42, 0.9))',
              border: '1px solid #00f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f2fe',
              boxShadow: '0 0 10px rgba(0, 242, 254, 0.3)',
            }}
          >
            <Zap size={15} />
          </div>
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '0.04em',
                lineHeight: 1.2,
              }}
            >
              SẠC XE ĐIỆN 3D
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              {vehicleCode} • {vehicle.licensePlate || 'Xe số hóa'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            else returnToVehicleOverview();
          }}
          title="Đóng bảng sạc xe"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* 2. Mode Tabs: OPERATION vs HISTORY */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.75)',
          padding: '3px',
          borderRadius: '10px',
          marginBottom: '12px',
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
            borderRadius: '8px',
            padding: '7px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <BatteryCharging size={13} color={activeTab === 'OPERATION' ? '#00f2fe' : '#94a3b8'} />
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
            borderRadius: '8px',
            padding: '7px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <History size={13} color={activeTab === 'HISTORY' ? '#00f2fe' : '#94a3b8'} />
          <span>LỊCH SỬ SẠC</span>
        </button>
      </div>

      {/* 3. Action Error Banner */}
      {actionError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '11px',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '10px',
          }}
        >
          <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
          <span>{actionError}</span>
        </div>
      )}

      {/* 4. Tab Content: OPERATION */}
      {activeTab === 'OPERATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* A. If ACTIVE CHARGING SESSION EXISTS */}
          {isVehicleCharging && activeSession ? (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid rgba(0, 242, 254, 0.5)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 0 16px rgba(0, 242, 254, 0.18)',
              }}
            >
              {/* Active Session Status Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '6px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#00f2fe',
                      boxShadow: '0 0 10px #00f2fe',
                    }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#00f2fe', letterSpacing: '0.04em' }}>
                    ĐANG NẠP NĂNG LƯỢNG
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {activeSession.chargingStationCode}
                </span>
              </div>

              {/* Glowing Dynamic SOC Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Tiến độ sạc:</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
                    {sessionSoc}% <span style={{ color: '#94a3b8', fontSize: '10px' }}>/ {sessionTarget}%</span>
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
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
                      boxShadow: '0 0 10px rgba(0, 242, 254, 0.7)',
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Telemetry Metric Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  fontSize: '11px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gauge size={11} color="#38bdf8" /> Công suất
                  </div>
                  <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '12px', marginTop: '2px' }}>
                    {activeSession.powerKw || 150} kW
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={11} color="#10b981" /> Điện năng nạp
                  </div>
                  <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '12px', marginTop: '2px' }}>
                    {activeSession.energyDeliveredKwh != null ? `${activeSession.energyDeliveredKwh} kWh` : 'Đang tính...'}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} color="#f59e0b" /> Thời gian còn lại
                  </div>
                  <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '12px', marginTop: '2px' }}>
                    {estimatedRemainingMinutes != null ? `~${estimatedRemainingMinutes} phút` : 'Đang sạc'}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '10px' }}>Trụ sạc kết nối</div>
                  <div style={{ fontWeight: 800, color: '#00f2fe', fontSize: '11px', marginTop: '2px' }}>
                    {activeSession.chargingStationName}
                  </div>
                </div>
              </div>

              {/* DEV-Only Simulation Helper (Section 13) */}
              {Boolean((import.meta as any)?.env?.DEV) && sessionSoc < sessionTarget && (
                <button
                  type="button"
                  onClick={() => progressMutation.mutate(Math.min(sessionTarget, sessionSoc + 5))}
                  disabled={progressMutation.isPending}
                  style={{
                    background: 'rgba(6, 182, 212, 0.12)',
                    border: '1px dashed rgba(6, 182, 212, 0.45)',
                    color: '#38bdf8',
                    borderRadius: '8px',
                    padding: '6px',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                  title="Chỉ hiển thị trong môi trường phát triển (DEV)"
                >
                  <Plus size={11} />
                  <span>[DEV] Mô phỏng nạp thêm +5% pin</span>
                </button>
              )}

              {/* Action Buttons: Complete & Cancel */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => completeMutation.mutate(activeSession.id)}
                  disabled={completeMutation.isPending}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '9px 10px',
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
                  <span>HOÀN TẤT SẠC</span>
                </button>

                <button
                  type="button"
                  onClick={() => cancelMutation.mutate(activeSession.id)}
                  disabled={cancelMutation.isPending}
                  style={{
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid #ef4444',
                    color: '#fca5a5',
                    borderRadius: '8px',
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
            </div>
          ) : activeSession && activeSession.status === 'COMPLETED' ? (
            /* COMPLETED CHARGING SESSION BANNER / SUMMARY */
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid rgba(16, 185, 129, 0.6)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.2)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '6px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#10b981', letterSpacing: '0.04em' }}>
                    HOÀN TẤT SẠC PIN
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {activeSession.chargingStationCode}
                </span>
              </div>

              {/* Progress 100% */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Mức pin hoàn thành:</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981' }}>
                    {activeSession.currentSocPercent}% <span style={{ color: '#94a3b8', fontSize: '10px' }}>/ {activeSession.targetSocPercent}%</span>
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                      boxShadow: '0 0 10px rgba(16, 185, 129, 0.7)',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  fontSize: '11px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={11} color="#10b981" /> Điện năng đã nạp
                  </div>
                  <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '12px', marginTop: '2px' }}>
                    {activeSession.energyDeliveredKwh != null ? `${activeSession.energyDeliveredKwh} kWh` : '0 kWh'}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} color="#10b981" /> Trạng thái
                  </div>
                  <div style={{ fontWeight: 800, color: '#10b981', fontSize: '11px', marginTop: '2px' }}>
                    Đã hoàn tất
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    gridColumn: 'span 2',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '10px' }}>Trụ sạc & Phương tiện</div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '11px', marginTop: '2px' }}>
                    Trụ sạc {activeSession.chargingStationName} đã được giải phóng (SẴN SÀNG). Xe sẵn sàng vận hành.
                  </div>
                </div>
              </div>

              {/* Dismiss / Start New button */}
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
                  borderRadius: '8px',
                  padding: '9px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  marginTop: '4px',
                }}
              >
                <CheckCircle2 size={13} />
                <span>XÁC NHẬN & ĐÓNG PHIÊN SẠC</span>
              </button>
            </div>
          ) : (
            /* B. NO ACTIVE SESSION: CONFIGURE & START CHARGING */
            <>
              {/* Vehicle Operational Warnings */}
              {isVehicleMaintenance && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    borderRadius: '10px',
                    padding: '10px',
                    fontSize: '11px',
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>Xe đang được bảo dưỡng nên chưa thể sạc pin lúc này.</span>
                </div>
              )}

              {isVehicleInUse && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid #f59e0b',
                    borderRadius: '10px',
                    padding: '10px',
                    fontSize: '11px',
                    color: '#fcd34d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <span>Xe đang được sử dụng trong chuyến đi nên chưa thể sạc.</span>
                </div>
              )}

              {/* Current Battery Level Indicator */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Battery size={15} color="#10b981" />
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Mức pin hiện tại:</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                    {currentSoc}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${currentSoc}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 100%)',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>

              {/* Target SOC Selector */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Mức pin mục tiêu:</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#00f2fe' }}>
                    {targetSoc}%
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                  {[80, 90, 100].map((socVal) => (
                    <button
                      key={socVal}
                      type="button"
                      onClick={() => setTargetSoc(socVal)}
                      style={{
                        background:
                          targetSoc === socVal
                            ? 'rgba(0, 242, 254, 0.25)'
                            : 'rgba(255, 255, 255, 0.05)',
                        border: targetSoc === socVal ? '1.5px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: targetSoc === socVal ? '#ffffff' : '#94a3b8',
                        borderRadius: '8px',
                        padding: '6px 4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {socVal}%
                      <div style={{ fontSize: '9px', fontWeight: 500, color: targetSoc === socVal ? '#38bdf8' : '#64748b' }}>
                        {socVal === 80 ? 'Chuẩn' : socVal === 90 ? 'Tối ưu' : 'Tối đa'}
                      </div>
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min={Math.min(99, Math.max(currentSoc + 1, 50))}
                  max={100}
                  value={targetSoc}
                  onChange={(e) => setTargetSoc(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#00f2fe', cursor: 'pointer' }}
                />
              </div>

              {/* Station Selection Cards */}
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '6px',
                  }}
                >
                  Chọn trụ sạc tại Garage:
                </div>

                {isLoadingStations ? (
                  <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
                    Đang tải danh sách trụ sạc...
                  </div>
                ) : stations.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#fbbf24', textAlign: 'center', padding: '12px' }}>
                    Hiện không có trụ sạc khả dụng.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stations.map((st) => {
                      const isStSelected = selectedStationId === st.id;
                      const theme = CHARGING_STATION_THEMES[st.status];
                      return (
                        <div
                          key={st.id}
                          onClick={() => {
                            if (st.status === 'AVAILABLE') {
                              setSelectedStationId(st.id);
                              setSelectedChargingStation(st.id);
                            }
                          }}
                          style={{
                            background: isStSelected ? 'rgba(0, 242, 254, 0.12)' : 'rgba(15, 23, 42, 0.75)',
                            border: isStSelected ? '1.5px solid #00f2fe' : `1px solid ${theme.border}`,
                            borderRadius: '10px',
                            padding: '8px 10px',
                            cursor: st.status === 'AVAILABLE' ? 'pointer' : 'not-allowed',
                            opacity: st.status === 'AVAILABLE' ? 1.0 : 0.65,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  background: theme.primary,
                                }}
                              />
                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>
                                {st.code} — {st.name}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                color: theme.primary,
                                background: theme.bg,
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {theme.labelVi}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '10px',
                              color: '#94a3b8',
                              marginTop: '4px',
                            }}
                          >
                            <span>Công suất: {st.maxPowerKw} kW • {st.connectorType}</span>
                            <span>{st.locationLabel || 'Garage'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Primary Action Button: BẮT ĐẦU SẠC */}
              <button
                type="button"
                onClick={() => startMutation.mutate()}
                disabled={!canStartCharging || startMutation.isPending}
                style={{
                  width: '100%',
                  background: canStartCharging
                    ? 'linear-gradient(90deg, #00f2fe 0%, #38bdf8 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: canStartCharging ? '#08101c' : '#64748b',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '11px',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  cursor: canStartCharging ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: canStartCharging ? '0 4px 16px rgba(0, 242, 254, 0.4)' : 'none',
                  transition: 'all 0.18s ease',
                  marginTop: '4px',
                }}
              >
                {startMutation.isPending ? (
                  <Activity size={14} className="animate-spin" />
                ) : (
                  <Play size={14} />
                )}
                <span>BẮT ĐẦU SẠC PIN</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* 5. Tab Content: HISTORY */}
      {activeTab === 'HISTORY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isLoadingHistory ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#38bdf8', fontSize: '11px' }}>
              Đang tải lịch sử sạc...
            </div>
          ) : sessionHistory.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 12px',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '10px',
                color: '#94a3b8',
                fontSize: '11px',
              }}
            >
              Xe chưa có lịch sử sạc.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
              {sessionHistory.map((sess) => (
                <div
                  key={sess.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(56, 189, 248, 0.15)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    fontSize: '11px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>
                      {sess.chargingStationName}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: sess.status === 'COMPLETED' ? '#10b981' : sess.status === 'ACTIVE' ? '#00f2fe' : '#94a3b8',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {sess.status === 'COMPLETED' ? 'HOÀN TẤT' : sess.status === 'ACTIVE' ? 'ĐANG SẠC' : 'ĐÃ HỦY'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '10px' }}>
                    <span>
                      SOC: <strong style={{ color: '#38bdf8' }}>{sess.startSocPercent}%</strong> → <strong style={{ color: '#10b981' }}>{sess.currentSocPercent}%</strong>
                    </span>
                    <span>
                      Điện năng: <strong style={{ color: '#ffffff' }}>{sess.energyDeliveredKwh || 0} kWh</strong>
                    </span>
                  </div>

                  {sess.startedAt && (
                    <div style={{ fontSize: '9px', color: '#64748b' }}>
                      {new Date(sess.startedAt).toLocaleString('vi-VN')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Bottom Navigation Controls */}
      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button
          type="button"
          onClick={() => returnToVehicleOverview()}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#cbd5e1',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <RotateCcw size={12} />
          <span>QUAY LẠI XE</span>
        </button>
      </div>
    </div>
  );
};
