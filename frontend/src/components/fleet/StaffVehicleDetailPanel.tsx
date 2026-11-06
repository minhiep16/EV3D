import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VehicleResponse, VehicleStatus } from '../../types/vehicle';
import {
  resolveVehicleCode,
  resolveVehicleDisplayName,
  resolveVehicleSecondaryIdentifier,
} from '../three/vehicles/vehicleModelConfig';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import {
  fetchHandoverEligibility,
  fetchActiveVehicleHandovers,
  fetchHandoverHistory,
  createHandoverApi,
  startHandoverApi,
  markHandoverReadyApi,
  confirmHandoverApi,
} from '../../services/handoverApi';
import { VehicleHandoverData } from '../../types/handover';
import {
  fetchLatestCompletedInspection,
  fetchActiveInspection,
  startInspectionApi,
  submitInspectionItemApi,
  completeInspectionApi,
} from '../../services/inspectionApi';
import {
  VehicleInspectionResponse,
  InspectionItemCondition,
} from '../../types/inspection';
import { fetchVehicleDamages, recordVehicleDamage } from '../../services/damageApi';
import { SEMANTIC_PART_LABELS_VI } from '../../data/vehicleParts';
import { DamageType, DamageSeverity } from '../../types/damage';
import { VehiclePartId } from '../../types/vehiclePart';
import { fetchActiveTripForVehicle, confirmTripReturnApi } from '../../services/tripApi';
import { TripData } from '../../types/trip';
import { fetchVehicleChargingSessions } from '../../services/chargingApi';
import { ChargingSessionResponse } from '../../types/charging';
import { formatDateTime } from '../../utils/dateTimeUtils';
import {
  Battery,
  Zap,
  Wrench,
  Key,
  RotateCcw,
  Layers,
  Clock,
  X,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  MapPin,
  Calendar,
  ShieldCheck,
  Check,
  Plus,
  RefreshCw,
  FileText,
  Sparkles,
  Info,
  Sliders,
} from 'lucide-react';

export interface StaffVehicleDetailPanelProps {
  vehicle: VehicleResponse;
  onClose?: () => void;
}

export type StaffOperationModule =
  | 'BATTERY'
  | 'MAINTENANCE'
  | 'HANDOVER'
  | 'RETURN'
  | 'INSPECTION_3D'
  | 'HISTORY';

export const StaffVehicleDetailPanel: React.FC<StaffVehicleDetailPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // Global World Store actions
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const setVehicleInspectionMode = useWorldStore((state) => state.setVehicleInspectionMode);
  const vehicleBatteryXrayMode = useWorldStore((state) => state.vehicleBatteryXrayMode);
  const toggleBatteryXray = useWorldStore((state) => state.toggleBatteryXray);
  const enterVehicleMaintenanceMode = useWorldStore((state) => state.enterVehicleMaintenanceMode);
  const openGaragePanel = useWorldStore((state) => state.openGaragePanel);
  const selectedVehiclePartId = useWorldStore((state) => state.selectedVehiclePartId);
  const selectVehiclePart = useWorldStore((state) => state.selectVehiclePart);
  const selectVehiclePartCode = useWorldStore((state) => state.selectVehiclePartCode);
  const clearVehiclePartSelection = useWorldStore((state) => state.clearVehiclePartSelection);
  const exitStaffInspection = useWorldStore((state) => state.exitStaffInspection);

  // Active sub-module view state synchronized with World Store & 3D floating controls
  const activeStaffOperationModule = useWorldStore((state) => state.activeStaffOperationModule);
  const setActiveStaffOperationModule = useWorldStore((state) => state.setActiveStaffOperationModule);
  const activeModule = activeStaffOperationModule;
  const setActiveModule = setActiveStaffOperationModule;

  // Responsive state
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync inspection mode when opening/closing KIEM TRA 3D module
  useEffect(() => {
    if (activeModule === 'INSPECTION_3D') {
      if (!vehicleInspectionMode) {
        setVehicleInspectionMode(true);
      }
    }
  }, [activeModule, vehicleInspectionMode, setVehicleInspectionMode]);

  // Synchronize 3D hotspot part selection with component condition assessment form
  useEffect(() => {
    if (selectedVehiclePartId && activeModule === 'INSPECTION_3D') {
      setSelectedPartKey(selectedVehiclePartId);
    }
  }, [selectedVehiclePartId, activeModule]);

  // Derived Vehicle Identifiers
  const vehicleCode = useMemo(() => resolveVehicleCode(vehicle), [vehicle]);
  const displayName = useMemo(() => resolveVehicleDisplayName(vehicle, vehicleCode), [vehicle, vehicleCode]);
  const secondaryIdentifier = useMemo(
    () => resolveVehicleSecondaryIdentifier(vehicle, vehicleCode),
    [vehicle, vehicleCode]
  );

  // Operational Status Meta
  const statusMeta = useMemo(() => {
    switch (vehicle.status) {
      case 'AVAILABLE':
        return { label: 'SẴN SÀNG', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' };
      case 'CHARGING':
        return { label: 'ĐANG SẠC', color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.15)', border: 'rgba(0, 242, 254, 0.4)' };
      case 'MAINTENANCE':
      case 'IN_SERVICE':
        return { label: 'BẢO DƯỠNG', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' };
      case 'RESERVED':
        return { label: 'BÀN GIAO', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' };
      case 'IN_USE':
        return { label: 'ĐANG SỬ DỤNG', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)' };
      default:
        return { label: vehicle.status || 'SẴN SÀNG', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' };
    }
  }, [vehicle.status]);

  // ==========================================
  // REAL BACKEND DATA QUERIES
  // ==========================================

  // 1. Handover Eligibility & Active Handovers
  const { data: eligibility, isLoading: loadingEligibility } = useQuery({
    queryKey: ['handoverEligibility', vehicle.id],
    queryFn: () => fetchHandoverEligibility(vehicle.id),
    enabled: Boolean(vehicle.id),
    staleTime: 5000,
  });

  const { data: activeHandovers = [], refetch: refetchHandovers } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeHandovers', vehicle.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    enabled: Boolean(vehicle.id),
    staleTime: 5000,
  });
  const currentHandover = activeHandovers[0] || null;

  // 2. Active Trip & Return Requests
  const { data: activeTrip, refetch: refetchActiveTrip } = useQuery<TripData | null>({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    enabled: Boolean(vehicle.id),
    staleTime: 4000,
  });

  // 3. Vehicle Damages & Maintenance Records
  const { data: damages = [], refetch: refetchDamages } = useQuery({
    queryKey: ['vehicleDamages', vehicle.id],
    queryFn: () => fetchVehicleDamages(vehicle.id),
    enabled: Boolean(vehicle.id),
    staleTime: 6000,
  });
  const activeDamagesCount = damages.filter((d: any) => d.status !== 'REPAIRED').length;

  // 4. Vehicle Inspections
  const { data: activeInspection, refetch: refetchInspection } = useQuery<VehicleInspectionResponse | null>({
    queryKey: ['activeInspection', vehicle.id],
    queryFn: () => fetchActiveInspection(vehicle.id),
    enabled: Boolean(vehicle.id),
    staleTime: 5000,
  });

  const { data: latestCompletedInspection } = useQuery<VehicleInspectionResponse | null>({
    queryKey: ['latestCompletedInspection', vehicle.id],
    queryFn: () => fetchLatestCompletedInspection(vehicle.id),
    enabled: Boolean(vehicle.id),
    staleTime: 10000,
  });

  // 5. Charging Sessions
  const { data: chargingSessions = [], refetch: refetchCharging } = useQuery<ChargingSessionResponse[]>({
    queryKey: ['chargingSessions', vehicle.id],
    queryFn: () => fetchVehicleChargingSessions(vehicle.id),
    enabled: Boolean(vehicle.id),
    staleTime: 6000,
  });
  const currentChargingSession = chargingSessions.find((s) => s.status === 'CHARGING') || null;

  // 6. Handover History
  const { data: handoverHistory = [] } = useQuery<VehicleHandoverData[]>({
    queryKey: ['handoverHistory', vehicle.id],
    queryFn: () => fetchHandoverHistory(vehicle.id),
    enabled: Boolean(vehicle.id) && activeModule === 'HISTORY',
    staleTime: 10000,
  });

  // Action status message
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const clearMessages = () => {
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
  };

  // ==========================================
  // OPERATIONAL ACTION HANDLERS
  // ==========================================

  // Handover actions
  const [isProcessingHandover, setIsProcessingHandover] = useState(false);
  const handleStartHandover = async () => {
    if (!currentHandover) return;
    setIsProcessingHandover(true);
    clearMessages();
    try {
      await startHandoverApi(currentHandover.id);
      setActionSuccessMsg('Đã chuyển trạng thái: Đang chuẩn bị bàn giao.');
      refetchHandovers();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể cập nhật bàn giao.');
    } finally {
      setIsProcessingHandover(false);
    }
  };

  const handleMarkHandoverReady = async () => {
    if (!currentHandover) return;
    setIsProcessingHandover(true);
    clearMessages();
    try {
      await markHandoverReadyApi(currentHandover.id);
      setActionSuccessMsg('Đã xác nhận xe sẵn sàng bàn giao cho người nhận.');
      refetchHandovers();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể xác nhận sẵn sàng.');
    } finally {
      setIsProcessingHandover(false);
    }
  };

  const handleConfirmHandover = async () => {
    if (!currentHandover) return;
    setIsProcessingHandover(true);
    clearMessages();
    try {
      await confirmHandoverApi(currentHandover.id, {
        batteryLevelSnapshot: vehicle.currentBatteryLevel,
        odometerSnapshot: vehicle.odometer,
        conditionNote: 'Nhân viên vận hành đã xác nhận bàn giao đầy đủ chìa khóa và kiểm tra xe.',
      });
      setActionSuccessMsg('Bàn giao xe thành công! Chuyến đi của đồng sở hữu bắt đầu.');
      refetchHandovers();
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể xác nhận hoàn tất bàn giao.');
    } finally {
      setIsProcessingHandover(false);
    }
  };

  // Return actions
  const [isConfirmingReturn, setIsConfirmingReturn] = useState(false);
  const [returnNote, setReturnNote] = useState('');
  const handleConfirmReturn = async () => {
    if (!activeTrip) return;
    setIsConfirmingReturn(true);
    clearMessages();
    try {
      await confirmTripReturnApi(activeTrip.id, {
        returnConditionNote: returnNote.trim() || 'Nhân viên đã kiểm tra tình trạng xe và hoàn tất nhận xe.',
      });
      setActionSuccessMsg('Đã hoàn tất thủ tục nhận xe và kết thúc chuyến đi!');
      refetchActiveTrip();
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể hoàn tất trả xe.');
    } finally {
      setIsConfirmingReturn(false);
    }
  };

  // Inspection actions
  const [selectedPartKey, setSelectedPartKey] = useState<VehiclePartId>('DOOR_FL');
  const [partCondition, setPartCondition] = useState<InspectionItemCondition>('GOOD');
  const [partNote, setPartNote] = useState('');
  const [isSavingPart, setIsSavingPart] = useState(false);

  // Synchronize inspection part selector with 3D hotspot clicks from the canvas
  useEffect(() => {
    if (selectedVehiclePartId) {
      setSelectedPartKey(selectedVehiclePartId as VehiclePartId);
    }
  }, [selectedVehiclePartId]);

  const handleSavePartInspection = async () => {
    if (!activeInspection) {
      setActionErrorMsg('Chưa có phiên kiểm tra đang hoạt động.');
      return;
    }
    setIsSavingPart(true);
    clearMessages();
    try {
      await submitInspectionItemApi(activeInspection.id, {
        partCode: selectedPartKey,
        condition: partCondition,
        note: partNote.trim() || (partCondition === 'GOOD' ? 'Đạt tiêu chuẩn' : 'Có ghi nhận lưu ý'),
      });
      setActionSuccessMsg(`Đã ghi nhận kiểm tra: ${SEMANTIC_PART_LABELS_VI[selectedPartKey] || selectedPartKey}`);
      setPartNote('');
      refetchInspection();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể lưu kiểm tra bộ phận.');
    } finally {
      setIsSavingPart(false);
    }
  };

  const handleClose = () => {
    if (activeModule === 'INSPECTION_3D') {
      if (partNote.trim().length > 0) {
        const confirmed = window.confirm(
          'Bạn có ghi chú đánh giá chưa lưu. Bạn có chắc chắn muốn đóng và thoát kiểm tra 3D?'
        );
        if (!confirmed) return;
      }
      setPartNote('');
      exitStaffInspection();
      if (onClose) onClose();
      return;
    }
    if (onClose) onClose();
  };

  const handleStartNewInspection = async () => {
    clearMessages();
    try {
      await startInspectionApi({
        vehicleId: vehicle.id,
        inspectionType: 'GENERAL',
        note: 'Phiên kiểm tra định kỳ 3D bởi Nhân viên vận hành.',
      });
      setActionSuccessMsg('Đã khởi tạo phiên kiểm tra mới.');
      refetchInspection();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể khởi tạo kiểm tra.');
    }
  };

  const handleCompleteInspection = async () => {
    if (!activeInspection) return;
    clearMessages();
    try {
      await completeInspectionApi(activeInspection.id, {
        overallResult: 'PASSED',
        summaryNote: 'Hoàn tất kiểm tra 3D tất cả các bộ phận kỹ thuật.',
      });
      setActionSuccessMsg('Đã hoàn tất và lưu biên bản kiểm tra kỹ thuật!');
      refetchInspection();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể hoàn tất biên bản.');
    }
  };

  // New damage record
  const [newDamagePart, setNewDamagePart] = useState<string>('BUMPER_F');
  const [newDamageType, setNewDamageType] = useState<DamageType>('SCRATCH');
  const [newDamageSeverity, setNewDamageSeverity] = useState<DamageSeverity>('LOW');
  const [newDamageDesc, setNewDamageDesc] = useState('');
  const [isRecordingDamage, setIsRecordingDamage] = useState(false);

  const handleRecordDamage = async () => {
    if (!newDamageDesc.trim()) {
      setActionErrorMsg('Vui lòng nhập mô tả chi tiết hư hỏng.');
      return;
    }
    setIsRecordingDamage(true);
    clearMessages();
    try {
      await recordVehicleDamage({
        vehicleId: vehicle.id,
        partCode: newDamagePart,
        damageType: newDamageType,
        severity: newDamageSeverity,
        description: newDamageDesc.trim(),
      });
      setActionSuccessMsg('Đã ghi nhận báo cáo hư hỏng thành công.');
      setNewDamageDesc('');
      refetchDamages();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể ghi nhận hư hỏng.');
    } finally {
      setIsRecordingDamage(false);
    }
  };

  // ==========================================
  // UNIFIED HISTORY TIMELINE
  // ==========================================
  const unifiedHistory = useMemo(() => {
    type HistoryItem = {
      id: string;
      type: 'HANDOVER' | 'RETURN' | 'DAMAGE' | 'CHARGING';
      title: string;
      description: string;
      timestamp: string;
      badgeColor: string;
    };

    const items: HistoryItem[] = [];

    // Handovers
    handoverHistory.forEach((h) => {
      items.push({
        id: `ho-${h.id}`,
        type: 'HANDOVER',
        title: 'Bàn giao xe',
        description: `Mã lịch: #${(h.bookingId || '').slice(0, 8)} • Trạng thái: ${h.status}`,
        timestamp: h.confirmedAt || h.createdAt || '',
        badgeColor: '#10b981',
      });
    });

    // Damages
    damages.forEach((d: any) => {
      items.push({
        id: `dmg-${d.id}`,
        type: 'DAMAGE',
        title: `Hư hỏng: ${SEMANTIC_PART_LABELS_VI[d.partCode as VehiclePartId] || d.partCode}`,
        description: `${d.damageType} (${d.severity}) — ${d.description || 'Không có mô tả'}`,
        timestamp: d.reportedAt || d.createdAt || '',
        badgeColor: '#f87171',
      });
    });

    // Charging
    chargingSessions.forEach((c) => {
      items.push({
        id: `chg-${c.id}`,
        type: 'CHARGING',
        title: 'Sạc pin điện',
        description: `Năng lượng: ${c.energyDeliveredKwh || 0} kWh • Trạng thái: ${c.status}`,
        timestamp: c.startTime || '',
        badgeColor: '#00f2fe',
      });
    });

    return items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [handoverHistory, damages, chargingSessions]);

  return (
    <aside
      aria-label="Trung tâm điều khiển vận hành xe"
      style={{
        position: 'fixed',
        top: isMobile ? '64px' : '76px',
        right: isMobile ? '8px' : '20px',
        bottom: isMobile ? '8px' : '20px',
        width: isMobile ? 'calc(100vw - 16px)' : '440px',
        maxWidth: '100%',
        zIndex: 40,
        background: 'rgba(7, 20, 38, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 242, 254, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 242, 254, 0.14)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pointerEvents: 'auto',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 1. HEADER (Unified Naming & Status) */}
      <header
        style={{
          padding: '14px 18px',
          background: 'rgba(11, 28, 54, 0.85)',
          borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '0.2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={displayName}
            >
              {displayName}
            </h2>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: statusMeta.bg,
                color: statusMeta.color,
                border: `1px solid ${statusMeta.border}`,
                letterSpacing: '0.04em',
              }}
            >
              {statusMeta.label}
            </span>
          </div>

          {/* Secondary Identifier: Code · Plate */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#38bdf8',
              marginTop: '3px',
              letterSpacing: '0.03em',
            }}
          >
            {secondaryIdentifier}
            {vehicle.brand && vehicle.model && (
              <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: '6px' }}>
                • {vehicle.brand} {vehicle.model}
              </span>
            )}
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng bảng điều khiển"
            title="Đóng bảng điều khiển"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <X size={16} />
          </button>
        )}
      </header>

      {/* Message Banners */}
      {actionSuccessMsg && (
        <div
          role="status"
          style={{
            margin: '8px 14px 0',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={13} />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div
          role="alert"
          style={{
            margin: '8px 14px 0',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={13} />
            <span>{actionErrorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionErrorMsg(null)}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* 2. SECONDARY SUMMARY STRIP */}
      <div
        style={{
          margin: '12px 14px 0',
          padding: '10px 14px',
          borderRadius: '14px',
          background: 'rgba(15, 32, 60, 0.65)',
          border: '1px solid rgba(0, 242, 254, 0.2)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        {/* Battery SOC */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
            <Zap size={12} color="#00f2fe" />
            <span>PIN (SOC)</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#00f2fe', marginTop: '2px' }}>
            {vehicle.currentBatteryLevel ?? 0}%
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, vehicle.currentBatteryLevel ?? 0))}%`,
                height: '100%',
                background: vehicle.currentBatteryLevel && vehicle.currentBatteryLevel > 20 ? '#00f2fe' : '#ef4444',
                boxShadow: '0 0 6px #00f2fe',
              }}
            />
          </div>
        </div>

        {/* Odometer */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
            <Gauge size={12} color="#38bdf8" />
            <span>ODOMETER</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
            {(vehicle.odometer ?? 0).toLocaleString()} <span style={{ fontSize: '10px', color: '#94a3b8' }}>km</span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '4px' }}>
            {vehicle.usableBatteryCapacityKwh || vehicle.batteryCapacity || 75} kWh dung lượng
          </div>
        </div>

        {/* Condition */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
            <ShieldCheck size={12} color="#10b981" />
            <span>TÌNH TRẠNG</span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: activeDamagesCount > 0 ? '#f59e0b' : '#10b981', marginTop: '3px' }}>
            {activeDamagesCount > 0 ? `${activeDamagesCount} ghi nhận` : 'Tốt / Đạt chuẩn'}
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>
            {latestCompletedInspection ? 'Đã kiểm tra' : 'Sẵn sàng'}
          </div>
        </div>
      </div>

      {/* 3. MAIN AREA: EITHER 6-MODULE HUB OR DEDICATED MODULE VIEW */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {activeModule === null ? (
          /* ====================================================
             DEFAULT: 6 COMPACT FUNCTIONAL MODULES (2-COLUMN GRID)
             ==================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                TRUNG TÂM TÁC VỤ VẬN HÀNH 3D
              </span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>6 chức năng chính</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '10px',
              }}
            >
              {/* 1. PIN & SẠC */}
              <button
                type="button"
                onClick={() => setActiveModule('BATTERY')}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 32, 60, 0.8) 0%, rgba(9, 21, 40, 0.9) 100%)',
                  border: '1.2px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00f2fe';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(0, 242, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={16} color="#00f2fe" />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#00f2fe' }}>
                    {vehicle.currentBatteryLevel ?? 0}%
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>PIN & SẠC</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    {vehicle.status === 'CHARGING' ? '⚡ Đang sạc điện' : 'Hologram pin & X-Ray'}
                  </div>
                </div>
              </button>

              {/* 2. BẢO DƯỠNG */}
              <button
                type="button"
                onClick={() => setActiveModule('MAINTENANCE')}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 32, 60, 0.8) 0%, rgba(9, 21, 40, 0.9) 100%)',
                  border: activeDamagesCount > 0 ? '1.2px solid rgba(248, 113, 113, 0.5)' : '1.2px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = activeDamagesCount > 0 ? '#f87171' : '#00f2fe';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = activeDamagesCount > 0 ? 'rgba(248, 113, 113, 0.5)' : 'rgba(0, 242, 254, 0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wrench size={16} color="#f59e0b" />
                  </div>
                  {activeDamagesCount > 0 && (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                      {activeDamagesCount} lỗi
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>BẢO DƯỠNG</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    {vehicle.status === 'MAINTENANCE' ? 'Đang sửa chữa' : 'Hồ sơ hỏng hóc & linh kiện'}
                  </div>
                </div>
              </button>

              {/* 3. BÀN GIAO XE */}
              <button
                type="button"
                onClick={() => setActiveModule('HANDOVER')}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 32, 60, 0.8) 0%, rgba(9, 21, 40, 0.9) 100%)',
                  border: '1.2px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00f2fe';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Key size={16} color="#10b981" />
                  </div>
                  <span style={{ fontSize: '9.5px', fontWeight: 700, color: eligibility?.isEligible ? '#34d399' : '#94a3b8' }}>
                    {eligibility?.isEligible ? 'Đủ điều kiện' : 'Chưa có lịch'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>BÀN GIAO XE</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    {currentHandover ? `Tiến độ: ${currentHandover.status}` : 'Kiểm tra & giao khóa'}
                  </div>
                </div>
              </button>

              {/* 4. TRẢ XE */}
              <button
                type="button"
                onClick={() => setActiveModule('RETURN')}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 32, 60, 0.8) 0%, rgba(9, 21, 40, 0.9) 100%)',
                  border: activeTrip?.returnRequestedAt ? '1.5px solid #00f2fe' : '1.2px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: activeTrip?.returnRequestedAt ? '0 0 16px rgba(0, 242, 254, 0.3)' : '0 4px 14px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00f2fe';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = activeTrip?.returnRequestedAt ? '#00f2fe' : 'rgba(0, 242, 254, 0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RotateCcw size={16} color="#38bdf8" />
                  </div>
                  {activeTrip?.returnRequestedAt && (
                    <span style={{ fontSize: '9px', fontWeight: 900, color: '#00f2fe', background: 'rgba(0, 242, 254, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                      YÊU CẦU (!)
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>TRẢ XE</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    {activeTrip ? 'Đang có chuyến đi' : 'Chưa có lượt trả'}
                  </div>
                </div>
              </button>

              {/* 5. KIỂM TRA 3D */}
              <button
                type="button"
                onClick={() => setActiveModule('INSPECTION_3D')}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 32, 60, 0.8) 0%, rgba(9, 21, 40, 0.9) 100%)',
                  border: '1.2px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00f2fe';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={16} color="#c084fc" />
                  </div>
                  <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#c084fc' }}>
                    Hotspots 3D
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>KIỂM TRA 3D</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Khảo sát bộ phận trực quan
                  </div>
                </div>
              </button>

              {/* 6. LỊCH SỬ XE */}
              <button
                type="button"
                onClick={() => setActiveModule('HISTORY')}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 32, 60, 0.8) 0%, rgba(9, 21, 40, 0.9) 100%)',
                  border: '1.2px solid rgba(0, 242, 254, 0.35)',
                  borderRadius: '14px',
                  padding: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00f2fe';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={16} color="#38bdf8" />
                  </div>
                  <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#94a3b8' }}>
                    {unifiedHistory.length} nhật ký
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>LỊCH SỬ XE</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Nhật ký giao/nhận & bảo dưỡng
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* ====================================================
             DEDICATED MODULE SUBVIEW WITH TOP BACK BAR
             ==================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Top Back Navigation Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveModule(null);
                  clearMessages();
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ChevronLeft size={13} />
                <span>QUAY LẠI TRUNG TÂM</span>
              </button>

              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff' }}>
                {activeModule === 'BATTERY' && 'PIN & SẠC ĐIỆN'}
                {activeModule === 'MAINTENANCE' && 'QUẢN LÝ BẢO DƯỠNG'}
                {activeModule === 'HANDOVER' && 'BÀN GIAO XE'}
                {activeModule === 'RETURN' && 'THỦ TỤC TRẢ XE'}
                {activeModule === 'INSPECTION_3D' && 'KIỂM TRA BỘ PHẬN 3D'}
                {activeModule === 'HISTORY' && 'NHẬT KÝ HOẠT ĐỘNG'}
              </span>
            </div>

            {/* ----------------------------------------------------
                1. MODULE: PIN & SẠC
                ---------------------------------------------------- */}
            {activeModule === 'BATTERY' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Holographic Battery Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(11, 28, 54, 0.7) 100%)',
                    border: '1.2px solid rgba(0, 242, 254, 0.4)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '80px',
                      borderRadius: '12px',
                      border: '2px solid #00f2fe',
                      padding: '4px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      boxShadow: '0 0 16px rgba(0, 242, 254, 0.25)',
                    }}
                  >
                    {/* Battery terminal pip */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-7px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '18px',
                        height: '6px',
                        background: '#00f2fe',
                        borderRadius: '3px 3px 0 0',
                      }}
                    />
                    <div
                      style={{
                        width: '100%',
                        height: `${Math.min(100, Math.max(5, vehicle.currentBatteryLevel ?? 0))}%`,
                        background: 'linear-gradient(180deg, #00f2fe 0%, #0284c7 100%)',
                        borderRadius: '6px',
                        transition: 'height 0.3s ease',
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                      TRẠNG THÁI NĂNG LƯỢNG
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
                      {vehicle.currentBatteryLevel ?? 0}%
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
                      Dung lượng danh định: <strong>{vehicle.grossBatteryCapacityKwh || vehicle.batteryCapacity || 75} kWh</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>
                      Dung lượng khả dụng: <strong>{vehicle.usableBatteryCapacityKwh || 65} kWh</strong>
                    </div>
                  </div>
                </div>

                {/* Session or Charging Status */}
                <div
                  style={{
                    background: 'rgba(15, 32, 60, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '11.5px',
                    color: '#e2e8f0',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>THÔNG SỐ SẠC</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Trạng thái cổng: </span>
                      <strong style={{ color: vehicle.status === 'CHARGING' ? '#00f2fe' : '#ffffff' }}>
                        {vehicle.status === 'CHARGING' ? 'ĐANG KẾT NỐI' : 'SẴN SÀNG'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Tiêu thụ định mức: </span>
                      <strong>{vehicle.energyConsumptionKwhPer100Km || 17.5} kWh/100km</strong>
                    </div>
                  </div>

                  {currentChargingSession && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div style={{ color: '#00f2fe', fontWeight: 700 }}>
                        Phiên sạc #{currentChargingSession.id.slice(0, 8)} đang diễn ra
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Đã sạc: {currentChargingSession.energyDeliveredKwh || 0} kWh
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => toggleBatteryXray(vehicle.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: vehicleBatteryXrayMode
                        ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                        : 'rgba(0, 242, 254, 0.15)',
                      border: '1.2px solid #00f2fe',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Layers size={14} color="#00f2fe" />
                    <span>{vehicleBatteryXrayMode ? 'TẮT X-RAY' : 'X-RAY PIN 3D'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openGaragePanel('CHARGING', { vehicleId: vehicle.id })}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                      border: 'none',
                      color: '#071426',
                      fontSize: '11.5px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Zap size={14} color="#071426" />
                    <span>QUẢN LÝ SẠC</span>
                  </button>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                2. MODULE: BẢO DƯỠNG
                ---------------------------------------------------- */}
            {activeModule === 'MAINTENANCE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    background: 'rgba(15, 32, 60, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                    HỒ SƠ HƯ HỎNG & BẢO DƯỠNG ({damages.length} GHI NHẬN)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {damages.length === 0 ? (
                      <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                        Không có hư hỏng nào chưa khắc phục trên xe.
                      </div>
                    ) : (
                      damages.map((d: any) => (
                        <div
                          key={d.id}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: 'rgba(0, 0, 0, 0.25)',
                            borderLeft: `3px solid ${d.severity === 'HIGH' ? '#f87171' : '#f59e0b'}`,
                            fontSize: '11px',
                          }}
                        >
                          <div style={{ fontWeight: 800, color: '#ffffff' }}>
                            {SEMANTIC_PART_LABELS_VI[d.partCode as VehiclePartId] || d.partCode} — {d.damageType}
                          </div>
                          <div style={{ color: '#cbd5e1', fontSize: '10.5px' }}>{d.description || 'Không có mô tả'}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Record Damage Form */}
                <div
                  style={{
                    background: 'rgba(15, 32, 60, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>GHI NHẬN HƯ HỎNG MỚI</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <select
                      value={newDamagePart}
                      onChange={(e) => setNewDamagePart(e.target.value)}
                      style={{ padding: '6px', borderRadius: '6px', background: '#0b1c36', color: '#ffffff', border: '1px solid #38bdf8', fontSize: '11px' }}
                    >
                      <option value="BUMPER_F">Cản trước</option>
                      <option value="BUMPER_R">Cản sau</option>
                      <option value="DOOR_FL">Cửa trước trái</option>
                      <option value="DOOR_FR">Cửa trước phải</option>
                      <option value="WHEEL_FL">Bánh xe trước trái</option>
                      <option value="WHEEL_FR">Bánh xe trước phải</option>
                      <option value="WINDSHIELD_F">Kính chắn gió</option>
                    </select>

                    <select
                      value={newDamageSeverity}
                      onChange={(e) => setNewDamageSeverity(e.target.value as DamageSeverity)}
                      style={{ padding: '6px', borderRadius: '6px', background: '#0b1c36', color: '#ffffff', border: '1px solid #38bdf8', fontSize: '11px' }}
                    >
                      <option value="LOW">Mức nhẹ (LOW)</option>
                      <option value="MEDIUM">Trung bình (MEDIUM)</option>
                      <option value="HIGH">Nghiêm trọng (HIGH)</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="Mô tả chi tiết vị trí hư hỏng..."
                    value={newDamageDesc}
                    onChange={(e) => setNewDamageDesc(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '8px', background: '#0b1c36', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '11.5px' }}
                  />

                  <button
                    type="button"
                    onClick={handleRecordDamage}
                    disabled={isRecordingDamage}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {isRecordingDamage ? 'ĐANG LƯU...' : 'LƯU BÁO CÁO HƯ HỎNG'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => enterVehicleMaintenanceMode({ vehicleId: vehicle.id })}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1.2px solid #f59e0b',
                    color: '#fbbf24',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  MỞ KHÔNG GIAN BẢO DƯỠNG XE 3D
                </button>
              </div>
            )}

            {/* ----------------------------------------------------
                3. MODULE: BÀN GIAO XE
                ---------------------------------------------------- */}
            {activeModule === 'HANDOVER' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    background: 'rgba(15, 32, 60, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
                    TIÊU CHUẨN ĐỦ ĐIỀU KIỆN BÀN GIAO
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '11.5px', color: eligibility?.isEligible ? '#34d399' : '#f87171' }}>
                    {eligibility?.isEligible
                      ? '✓ Xe đủ điều kiện kỹ thuật & có lịch đặt sẵn sàng để bàn giao.'
                      : `✗ ${eligibility?.reason || 'Chưa đủ điều kiện bàn giao xe.'}`}
                  </div>
                </div>

                {currentHandover ? (
                  <div
                    style={{
                      background: 'rgba(15, 32, 60, 0.65)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8' }}>HỒ SƠ BÀN GIAO</span>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981' }}>{currentHandover.status}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#ffffff' }}>
                      Mã lịch đặt: <strong>#{(currentHandover.bookingId || '').slice(0, 8)}</strong>
                    </div>

                    {/* Step-by-step buttons depending on status */}
                    {currentHandover.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={handleStartHandover}
                        disabled={isProcessingHandover}
                        style={{
                          padding: '9px 14px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        BẮT ĐẦU CHUẨN BỊ BÀN GIAO
                      </button>
                    )}

                    {currentHandover.status === 'PREPARING' && (
                      <button
                        type="button"
                        onClick={handleMarkHandoverReady}
                        disabled={isProcessingHandover}
                        style={{
                          padding: '9px 14px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                          border: 'none',
                          color: '#071426',
                          fontSize: '11.5px',
                          fontWeight: 900,
                          cursor: 'pointer',
                        }}
                      >
                        XÁC NHẬN XE ĐÃ SẴN SÀNG
                      </button>
                    )}

                    {currentHandover.status === 'READY' && (
                      <button
                        type="button"
                        onClick={handleConfirmHandover}
                        disabled={isProcessingHandover}
                        style={{
                          padding: '9px 14px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 900,
                          cursor: 'pointer',
                        }}
                      >
                        XÁC NHẬN GIAO XE CHO ĐỒNG SỞ HỮU
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
                    Không có hồ sơ bàn giao đang mở cho phương tiện này.
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                4. MODULE: TRẢ XE
                ---------------------------------------------------- */}
            {activeModule === 'RETURN' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {activeTrip ? (
                  <div
                    style={{
                      background: 'rgba(15, 32, 60, 0.65)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8' }}>CHUYẾN ĐI ĐANG DIỄN RA</span>
                      {activeTrip.returnRequestedAt && (
                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#00f2fe', background: 'rgba(0, 242, 254, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                          KHÁCH YÊU CẦU TRẢ XE
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: '#ffffff' }}>
                      Mã chuyến: <strong>#{(activeTrip.id || '').slice(0, 8)}</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', color: '#cbd5e1' }}>
                      <div>Pin hiện tại: <strong>{vehicle.currentBatteryLevel ?? 0}%</strong></div>
                      <div>Odometer: <strong>{(vehicle.odometer ?? 0).toLocaleString()} km</strong></div>
                    </div>

                    <textarea
                      placeholder="Ghi chú xác nhận tình trạng xe khi hoàn tất trả..."
                      rows={2}
                      value={returnNote}
                      onChange={(e) => setReturnNote(e.target.value)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: '#0b1c36',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        fontSize: '11px',
                        resize: 'none',
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleConfirmReturn}
                      disabled={isConfirmingReturn}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 900,
                        cursor: 'pointer',
                      }}
                    >
                      {isConfirmingReturn ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN HOÀN TẤT TRẢ XE'}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'rgba(15, 32, 60, 0.45)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '11.5px',
                      color: '#94a3b8',
                    }}
                  >
                    Phương tiện hiện không có chuyến đi đang hoạt động hoặc yêu cầu trả xe.
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                5. MODULE: KIỂM TRA 3D
                ---------------------------------------------------- */}
            {activeModule === 'INSPECTION_3D' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    background: 'rgba(15, 32, 60, 0.65)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    borderRadius: '12px',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase' }}>
                    CHẾ ĐỘ KHẢO SÁT BỘ PHẬN TRỰC QUAN 3D
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
                    Các điểm chạm (hotspot) đang hiển thị trực tiếp trên mô hình xe 3D. Nhấn vào điểm chạm hoặc chọn bộ phận dưới đây:
                  </div>
                </div>

                {/* Part selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>Chọn bộ phận kiểm tra:</label>
                    {selectedVehiclePartId && (
                      <button
                        type="button"
                        onClick={() => {
                          clearVehiclePartSelection();
                          selectVehiclePartCode(null);
                        }}
                        title="Quay lại góc nhìn trung tâm xe"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(0, 242, 254, 0.4)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          color: '#00f2fe',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <RotateCcw size={10} />
                        <span>QUAY LẠI TRUNG TÂM</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedPartKey}
                    onChange={(e) => {
                      const val = e.target.value as VehiclePartId;
                      setSelectedPartKey(val);
                      selectVehiclePart(val);
                      selectVehiclePartCode(val);
                    }}
                    style={{ padding: '8px', borderRadius: '8px', background: '#0b1c36', color: '#ffffff', border: '1px solid #38bdf8', fontSize: '11.5px' }}
                  >
                    <option value="DOOR_FL">Cửa trước trái</option>
                    <option value="DOOR_FR">Cửa trước phải</option>
                    <option value="DOOR_RL">Cửa sau trái</option>
                    <option value="DOOR_RR">Cửa sau phải</option>
                    <option value="WHEEL_FL">Bánh xe trước trái</option>
                    <option value="WHEEL_FR">Bánh xe trước phải</option>
                    <option value="WHEEL_RL">Bánh xe sau trái</option>
                    <option value="WHEEL_RR">Bánh xe sau phải</option>
                    <option value="BATTERY">Bộ pin cao áp</option>
                    <option value="CHARGING_PORT">Cổng sạc điện</option>
                    <option value="HEADLIGHT">Cụm đèn pha LED</option>
                    <option value="WINDSHIELD">Kính chắn gió</option>
                  </select>
                </div>

                {/* Condition radio */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  {(['GOOD', 'SCRATCH', 'DENT', 'CRACK'] as InspectionItemCondition[]).map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setPartCondition(cond)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '6px',
                        background: partCondition === cond ? '#0284c7' : 'rgba(255, 255, 255, 0.08)',
                        border: partCondition === cond ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontSize: '9.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {cond === 'GOOD' ? 'TỐT' : cond === 'SCRATCH' ? 'TRẦY' : cond === 'DENT' ? 'MÓP' : 'NỨT'}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Ghi chú đánh giá bộ phận..."
                  value={partNote}
                  onChange={(e) => setPartNote(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '8px', background: '#0b1c36', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '11px' }}
                />

                <button
                  type="button"
                  onClick={handleSavePartInspection}
                  disabled={isSavingPart}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {isSavingPart ? 'ĐANG LƯU...' : 'LƯU ĐÁNH GIÁ BỘ PHẬN'}
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleStartNewInspection}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#cbd5e1',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    TẠO PHIÊN MỚI
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteInspection}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    HOÀN TẤT BIÊN BẢN
                  </button>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                6. MODULE: LỊCH SỬ XE
                ---------------------------------------------------- */}
            {activeModule === 'HISTORY' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  Toàn bộ sự kiện vận hành gắn liền duy nhất với UUID: <code>{vehicle.id.slice(0, 8)}</code>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {unifiedHistory.length === 0 ? (
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
                      Chưa ghi nhận lịch sử nào cho xe này.
                    </div>
                  ) : (
                    unifiedHistory.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: 'rgba(15, 32, 60, 0.65)',
                          borderLeft: `3px solid ${item.badgeColor}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>{item.title}</span>
                          <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                            {item.timestamp ? formatDateTime(item.timestamp) : '—'}
                          </span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#cbd5e1' }}>{item.description}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </aside>
  );
};
