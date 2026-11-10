import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import { fetchVehicleDamages } from '../../services/damageApi';
import {
  fetchVehicleMaintenance,
  createVehicleMaintenance,
  startMaintenance,
  completeMaintenance,
} from '../../services/maintenanceApi';
import {
  MaintenanceResponse,
  MaintenancePriority,
  MaintenanceType,
  MAINTENANCE_TYPE_CONFIG,
  MAINTENANCE_PRIORITY_CONFIG,
} from '../../types/maintenance';
import { SEMANTIC_PART_LABELS_VI, normalizeCanonicalPartCode } from '../../data/vehicleParts';
import { DamageType, DamageSeverity, DAMAGE_TYPE_LABELS } from '../../types/damage';
import { VehiclePartId } from '../../types/vehiclePart';
import { fetchActiveTripForVehicle, confirmTripReturnApi, fetchVehicleTrips } from '../../services/tripApi';
import { TripData } from '../../types/trip';
import { fetchVehicleChargingSessions } from '../../services/chargingApi';
import { ChargingSessionResponse } from '../../types/charging';
import { formatDateTime, formatDate, formatTime } from '../../utils/dateTimeUtils';
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
  Send,
  Wallet,
  ChevronRight,
  User,
} from 'lucide-react';

const VI_DAMAGE_TYPE_LABELS: Record<string, string> = {
  CRACK: 'NỨT',
  DENT: 'MÓP',
  SCRATCH: 'TRẦY',
  BROKEN: 'VỠ / HỎNG',
  PAINT_DAMAGE: 'HỎNG SƠN',
  GLASS_DAMAGE: 'RẠN KÍNH',
  TIRE_DAMAGE: 'HỎNG LỐP',
  OTHER: 'KHÁC',
};

const VI_SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SEVERE: { label: 'Nghiêm trọng', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  HIGH: { label: 'Nghiêm trọng', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  MODERATE: { label: 'Trung bình', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  MEDIUM: { label: 'Trung bình', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  MINOR: { label: 'Nhẹ', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  LOW: { label: 'Nhẹ', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
};

const VI_DAMAGE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Chưa xử lý', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  UNDER_MAINTENANCE: { label: 'Đang sửa chữa', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  RESOLVED: { label: 'Đã khắc phục', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
};

const VI_HANDOVER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING_PREPARATION: {
    label: 'Chờ chuẩn bị xe',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
  },
  INSPECTION_IN_PROGRESS: {
    label: 'Đang kiểm tra kỹ thuật',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.4)',
  },
  READY_FOR_HANDOVER: {
    label: 'Sẵn sàng bàn giao xe',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  HANDED_OVER: {
    label: 'Đã bàn giao (Chờ người nhận)',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.4)',
  },
  OWNER_CONFIRMED: {
    label: 'Đồng sở hữu đã nhận xe',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  COMPLETED: {
    label: 'Bàn giao hoàn tất',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
  },
};

const VI_ELIGIBILITY_REASON_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  READY_FOR_PREPARATION: {
    label: 'Sẵn sàng chuẩn bị bàn giao',
    color: '#38bdf8',
    desc: 'Đã đến khung thời gian chuẩn bị xe cho lịch đặt tiếp theo.',
  },
  READY: {
    label: 'Đủ điều kiện bàn giao xe',
    color: '#10b981',
    desc: 'Xe đã qua kiểm tra kỹ thuật đạt chuẩn và sẵn sàng giao chìa khóa.',
  },
  TOO_EARLY: {
    label: 'Chưa đến giờ chuẩn bị',
    color: '#f59e0b',
    desc: 'Chưa đến khung giờ chuẩn bị xe (30 phút trước giờ nhận).',
  },
  NO_BOOKING: {
    label: 'Không có lịch đặt cần xử lý',
    color: '#94a3b8',
    desc: 'Hiện tại chưa có lượt đặt nào cần chuẩn bị hoặc bàn giao.',
  },
  BOOKING_EXPIRED: {
    label: 'Lịch đặt đã hết hạn',
    color: '#f87171',
    desc: 'Lịch đặt xe đã quá giờ mà không được bàn giao.',
  },
  HANDED_OVER: {
    label: 'Đã bàn giao xe',
    color: '#10b981',
    desc: 'Nhân viên đã bàn giao xe thành công cho đồng sở hữu.',
  },
  VEHICLE_IN_USE: {
    label: 'Xe đang được sử dụng',
    color: '#a855f7',
    desc: 'Phương tiện đang trong hành trình của đồng sở hữu.',
  },
  VEHICLE_MAINTENANCE: {
    label: 'Xe đang bảo dưỡng',
    color: '#f87171',
    desc: 'Phương tiện đang thực hiện bảo dưỡng hoặc sửa chữa kỹ thuật.',
  },
  VEHICLE_CHARGING: {
    label: 'Xe đang sạc điện',
    color: '#00f2fe',
    desc: 'Phương tiện đang kết nối trạm sạc pin.',
  },
  NO_INSPECTION: {
    label: 'Chưa kiểm tra kỹ thuật',
    color: '#f59e0b',
    desc: 'Cần hoàn tất biên bản kiểm tra 3D trước khi giao xe.',
  },
  INSPECTION_EXPIRED: {
    label: 'Biên bản kiểm tra quá hạn',
    color: '#f87171',
    desc: 'Kết quả kiểm tra xe đã quá hạn 24 giờ. Cần kiểm tra lại.',
  },
  INSPECTION_FAILED: {
    label: 'Kiểm tra không đạt chuẩn',
    color: '#ef4444',
    desc: 'Phương tiện phát hiện lỗi kỹ thuật không đủ điều kiện vận hành an toàn.',
  },
};

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

export const INSPECTION_PART_OPTIONS: { id: VehiclePartId; label: string }[] = [
  { id: 'WHEEL_FL', label: 'Bánh trước trái' },
  { id: 'WHEEL_FR', label: 'Bánh trước phải' },
  { id: 'WHEEL_RL', label: 'Bánh sau trái' },
  { id: 'WHEEL_RR', label: 'Bánh sau phải' },
  { id: 'DOOR_FL', label: 'Cửa trước trái' },
  { id: 'DOOR_FR', label: 'Cửa trước phải' },
  { id: 'DOOR_RL', label: 'Cửa sau trái' },
  { id: 'DOOR_RR', label: 'Cửa sau phải' },
  { id: 'WINDSHIELD', label: 'Kính chắn gió' },
  { id: 'BATTERY', label: 'Bộ pin' },
  { id: 'CHARGING_PORT', label: 'Cổng sạc' },
  { id: 'HOOD', label: 'Nắp ca-pô' },
  { id: 'ROOF', label: 'Nóc xe' },
  { id: 'HEADLIGHTS', label: 'Đèn pha' },
  { id: 'TAILLIGHTS', label: 'Đèn hậu' },
  { id: 'BODY', label: 'Thân vỏ' },
  { id: 'DIFFUSER', label: 'Cản sau & Khuếch tán gió' },
];

export const MANDATORY_HANDOVER_CHECKPOINTS: { id: VehiclePartId; label: string }[] = [
  { id: 'BODY', label: 'Thân vỏ & Khung gầm' },
  { id: 'WHEEL_FL', label: 'Bánh trước trái' },
  { id: 'WHEEL_FR', label: 'Bánh trước phải' },
  { id: 'WHEEL_RL', label: 'Bánh sau trái' },
  { id: 'WHEEL_RR', label: 'Bánh sau phải' },
  { id: 'WINDSHIELD', label: 'Kính chắn gió' },
  { id: 'BATTERY', label: 'Bộ pin cao áp' },
  { id: 'CHARGING_PORT', label: 'Cổng sạc' },
];

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
  const openGaragePanel = useWorldStore((state) => state.openGaragePanel);
  const selectedVehiclePartId = useWorldStore((state) => state.selectedVehiclePartId);
  const selectVehiclePart = useWorldStore((state) => state.selectVehiclePart);
  const selectVehiclePartCode = useWorldStore((state) => state.selectVehiclePartCode);
  const clearVehiclePartSelection = useWorldStore((state) => state.clearVehiclePartSelection);
  const exitStaffInspection = useWorldStore((state) => state.exitStaffInspection);

  // Active sub-module view state synchronized with World Store & 3D floating controls
  const activeStaffOperationModule = useWorldStore((state) => state.activeStaffOperationModule);
  const setActiveStaffOperationModule = useWorldStore((state) => state.setActiveStaffOperationModule);
  const setPaymentVerificationModalOpen = useWorldStore((state) => state.setPaymentVerificationModalOpen);
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

  // Active Inspection Component Selection
  const [selectedPartKey, setSelectedPartKey] = useState<VehiclePartId>('DOOR_FL');

  // Compute inspection parts list ensuring selected part is always present
  const inspectionPartDropdownList = useMemo(() => {
    const list = [...INSPECTION_PART_OPTIONS];
    if (selectedPartKey && !list.some((p) => p.id === selectedPartKey)) {
      list.push({
        id: selectedPartKey,
        label: SEMANTIC_PART_LABELS_VI[selectedPartKey] || selectedPartKey,
      });
    }
    return list;
  }, [selectedPartKey]);

  // Synchronize 3D hotspot part selection with component condition assessment form
  useEffect(() => {
    if (selectedVehiclePartId && activeModule === 'INSPECTION_3D') {
      const canonical = (normalizeCanonicalPartCode(selectedVehiclePartId) || selectedVehiclePartId) as VehiclePartId;
      setSelectedPartKey(canonical);
    }
  }, [selectedVehiclePartId, activeModule]);

  // Fresh Vehicle Subscription (keeps local vehicle state in sync with cache mutations)
  const { data: cachedVehicles } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    enabled: false,
  });
  const currentVehicle = useMemo(() => {
    return cachedVehicles?.find((v) => v.id === vehicle.id) || vehicle;
  }, [cachedVehicles, vehicle]);

  // Derived Vehicle Identifiers
  const vehicleCode = useMemo(() => resolveVehicleCode(currentVehicle), [currentVehicle]);
  const displayName = useMemo(() => resolveVehicleDisplayName(currentVehicle, vehicleCode), [currentVehicle, vehicleCode]);
  const secondaryIdentifier = useMemo(
    () => resolveVehicleSecondaryIdentifier(currentVehicle, vehicleCode),
    [currentVehicle, vehicleCode]
  );

  // Operational Status Meta
  const statusMeta = useMemo(() => {
    switch (currentVehicle.status) {
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
        return { label: currentVehicle.status || 'SẴN SÀNG', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' };
    }
  }, [currentVehicle.status]);

  // ==========================================
  // REAL BACKEND DATA QUERIES
  // ==========================================

  // 1. Handover Eligibility & Active Handovers
  const [selectedHandoverIndex, setSelectedHandoverIndex] = useState(0);

  useEffect(() => {
    setSelectedHandoverIndex(0);
  }, [vehicle.id]);

  const {
    data: activeHandovers = [],
    isLoading: isLoadingHandovers,
    isError: isHandoversError,
    error: handoversError,
    refetch: refetchHandovers,
  } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeHandovers', vehicle.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    enabled: Boolean(vehicle.id) && (activeModule === 'HANDOVER' || activeModule === 'INSPECTION_3D'),
    staleTime: 0,
    refetchInterval: 4000,
  });

  const selectedBookingId = activeHandovers[selectedHandoverIndex]?.bookingId;

  const { data: eligibility, isLoading: loadingEligibility, refetch: refetchEligibility } = useQuery({
    queryKey: ['handoverEligibility', vehicle.id, selectedBookingId],
    queryFn: () => fetchHandoverEligibility(vehicle.id, selectedBookingId),
    enabled: Boolean(vehicle.id) && (activeModule === 'HANDOVER' || activeModule === 'INSPECTION_3D' || !activeModule),
    staleTime: 0,
    refetchInterval: 4000,
  });

  const currentHandover = useMemo(() => {
    if (activeHandovers && activeHandovers.length > 0) {
      const safeIdx = Math.max(0, Math.min(selectedHandoverIndex, activeHandovers.length - 1));
      return activeHandovers[safeIdx] || null;
    }
    // Fallback: If activeHandovers query returned empty but eligibility knows there is an active booking
    if (eligibility?.bookingId) {
      return {
        id: eligibility.handoverId || undefined,
        bookingId: eligibility.bookingId,
        bookingStartTime: eligibility.bookingStartTime,
        bookingEndTime: eligibility.bookingEndTime,
        bookingPurpose: eligibility.bookingPurpose,
        bookingStatus: 'CONFIRMED',
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        licensePlate: vehicle.licensePlate,
        coOwnerName: eligibility.recipientName,
        coOwnerEmail: eligibility.recipientEmail,
        status: (eligibility.handoverStatus as any) || 'PENDING_PREPARATION',
        inspectionStatus: eligibility.inspectionResult || 'PENDING',
      } as VehicleHandoverData;
    }
    return null;
  }, [activeHandovers, selectedHandoverIndex, eligibility, vehicle]);

  // 2. Active Trip & Return Requests
  const { data: activeTrip, refetch: refetchActiveTrip } = useQuery<TripData | null>({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    enabled: Boolean(vehicle.id) && (activeModule === 'RETURN' || vehicle.status === 'IN_USE'),
    staleTime: 30000,
  });

  // 3. Vehicle Damages & Maintenance Records
  const {
    data: damages = [],
    isLoading: isLoadingDamages,
    isError: isDamagesError,
    error: damagesError,
    refetch: refetchDamages,
  } = useQuery({
    queryKey: ['vehicleDamages', vehicle.id],
    queryFn: () => fetchVehicleDamages(vehicle.id),
    enabled: Boolean(vehicle.id),
    staleTime: 30000,
  });
  const unresolvedDamages = useMemo(
    () => damages.filter((d: any) => d.status !== 'RESOLVED' && d.status !== 'REPAIRED'),
    [damages]
  );
  const activeDamagesCount = unresolvedDamages.length;

  // 3b. Vehicle Maintenance Requests & Co-owner Proposals
  const {
    data: maintenanceList = [],
    isLoading: isLoadingMaintenance,
    refetch: refetchMaintenance,
  } = useQuery<MaintenanceResponse[]>({
    queryKey: ['vehicleMaintenance', vehicle.id],
    queryFn: () => fetchVehicleMaintenance(vehicle.id),
    enabled: Boolean(vehicle.id) && (activeModule === 'MAINTENANCE' || activeModule === 'HISTORY' || activeModule === 'INSPECTION_3D'),
    staleTime: 30000,
  });

  const getLinkedMaintenanceForDamage = useCallback(
    (damage: any) => {
      if (!damage) return undefined;
      return maintenanceList.find((m) => {
        const matchesDamageId =
          m.damageRecordIds?.includes(damage.id) ||
          m.damageRecords?.some((dr: any) => dr.id === damage.id) ||
          (damage.resolvedByMaintenanceRequestId && m.id === damage.resolvedByMaintenanceRequestId);
        return matchesDamageId && m.status !== 'CANCELLED' && m.status !== 'REJECTED';
      });
    },
    [maintenanceList]
  );

  const selectedComponentDamages = useMemo(() => {
    const targetCode = normalizeCanonicalPartCode(selectedPartKey);
    return unresolvedDamages.filter(
      (d: any) => normalizeCanonicalPartCode(d.vehiclePartCode || d.partCode) === targetCode
    );
  }, [unresolvedDamages, selectedPartKey]);

  // 4. Vehicle Inspections & Active Session Lifecycle Management
  const initializingSessionVehicleIdRef = useRef<string | null>(null);
  const [sessionInitError, setSessionInitError] = useState<string | null>(null);

  const {
    data: activeInspection,
    isLoading: isLoadingInspection,
    refetch: refetchInspection,
  } = useQuery<VehicleInspectionResponse | null>({
    queryKey: ['activeInspection', vehicle.id],
    queryFn: () => fetchActiveInspection(vehicle.id),
    enabled: Boolean(vehicle.id) && (activeModule === 'INSPECTION_3D' || activeModule === 'HANDOVER'),
    staleTime: 15000,
  });

  const {
    data: latestCompletedInspection,
    isLoading: isLoadingLatestCompleted,
    refetch: refetchLatestCompleted,
  } = useQuery<VehicleInspectionResponse | null>({
    queryKey: ['latestCompletedInspection', vehicle.id],
    queryFn: () => fetchLatestCompletedInspection(vehicle.id),
    enabled: Boolean(vehicle.id) && (activeModule === 'INSPECTION_3D' || activeModule === 'HANDOVER' || activeModule === 'HISTORY'),
    staleTime: 15000,
  });

  const REQUIRED_HANDOVER_PARTS = useMemo(
    () => ['BODY', 'WHEEL_FL', 'WHEEL_FR', 'WHEEL_RL', 'WHEEL_RR', 'WINDSHIELD', 'BATTERY', 'CHARGING_PORT'],
    []
  );

  const totalAvailablePartsCount = INSPECTION_PART_OPTIONS.length; // 17

  // Unique assessed component counts for active inspection session
  const uniqueAssessedCount = useMemo(() => {
    if (!activeInspection?.items) return 0;
    const set = new Set(
      activeInspection.items
        .map((i) => normalizeCanonicalPartCode(i.vehiclePartCode))
        .filter(Boolean)
    );
    return set.size;
  }, [activeInspection?.items]);

  const requiredAssessedCount = useMemo(() => {
    if (!activeInspection?.items) return 0;
    const set = new Set(
      activeInspection.items
        .map((i) => normalizeCanonicalPartCode(i.vehiclePartCode))
        .filter(Boolean)
    );
    return REQUIRED_HANDOVER_PARTS.filter((p) => set.has(p)).length;
  }, [activeInspection?.items, REQUIRED_HANDOVER_PARTS]);

  // Unique assessed component counts for latest completed inspection session
  const completedUniqueCount = useMemo(() => {
    if (!latestCompletedInspection?.items) return 0;
    const set = new Set(
      latestCompletedInspection.items
        .map((i) => normalizeCanonicalPartCode(i.vehiclePartCode))
        .filter(Boolean)
    );
    return set.size;
  }, [latestCompletedInspection?.items]);

  const completedRequiredCount = useMemo(() => {
    if (!latestCompletedInspection?.items) return 0;
    const set = new Set(
      latestCompletedInspection.items
        .map((i) => normalizeCanonicalPartCode(i.vehiclePartCode))
        .filter(Boolean)
    );
    return REQUIRED_HANDOVER_PARTS.filter((p) => set.has(p)).length;
  }, [latestCompletedInspection?.items, REQUIRED_HANDOVER_PARTS]);

  const initInspectionSession = useCallback(async () => {
    if (!vehicle.id) return;
    setSessionInitError(null);
    initializingSessionVehicleIdRef.current = vehicle.id;
    try {
      const res = await startInspectionApi(vehicle.id, 'PRE_HANDOVER');
      queryClient.setQueryData(['activeInspection', vehicle.id], res);
      refetchInspection();
    } catch (err: any) {
      setSessionInitError('Không thể bắt đầu phiên kiểm tra. Vui lòng thử lại.');
    } finally {
      initializingSessionVehicleIdRef.current = null;
    }
  }, [vehicle.id, queryClient, refetchInspection]);

  // Sync inspection mode; only auto-init session when NO active session and NO completed session exists
  useEffect(() => {
    if (activeModule === 'INSPECTION_3D') {
      if (!vehicleInspectionMode) {
        setVehicleInspectionMode(true);
      }
      if (
        !isLoadingInspection &&
        !isLoadingLatestCompleted &&
        !activeInspection &&
        !latestCompletedInspection &&
        initializingSessionVehicleIdRef.current !== vehicle.id &&
        !sessionInitError
      ) {
        initInspectionSession();
      }
    } else {
      setSessionInitError(null);
    }
  }, [
    activeModule,
    vehicleInspectionMode,
    setVehicleInspectionMode,
    isLoadingInspection,
    isLoadingLatestCompleted,
    activeInspection,
    latestCompletedInspection,
    vehicle.id,
    sessionInitError,
    initInspectionSession,
  ]);

  // 5. Charging Sessions
  const { data: chargingSessions = [], refetch: refetchCharging } = useQuery<ChargingSessionResponse[]>({
    queryKey: ['chargingSessions', vehicle.id],
    queryFn: () => fetchVehicleChargingSessions(vehicle.id),
    enabled: Boolean(vehicle.id) && (activeModule === 'BATTERY' || vehicle.status === 'CHARGING'),
    staleTime: 30000,
  });
  const currentChargingSession = chargingSessions.find((s) => s.status === 'CHARGING') || null;

  // 6. Handover History
  const { data: handoverHistory = [] } = useQuery<VehicleHandoverData[]>({
    queryKey: ['handoverHistory', vehicle.id],
    queryFn: () => fetchHandoverHistory(vehicle.id),
    enabled: Boolean(vehicle.id) && activeModule === 'HISTORY',
    staleTime: 10000,
  });

  // 7. Vehicle Trips (Completed & Active Trips)
  const { data: vehicleTrips = [], refetch: refetchTrips } = useQuery<TripData[]>({
    queryKey: ['vehicleTrips', vehicle.id],
    queryFn: () => fetchVehicleTrips(vehicle.id),
    enabled: Boolean(vehicle.id) && (activeModule === 'HISTORY' || activeModule === 'RETURN'),
    staleTime: 5000,
  });

  // Action status message
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const clearMessages = () => {
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
  };

  // 3-Step Handover Workflow state (1: Booking Details -> 2: 3D Inspection -> 3: Handover Confirmation)
  const [handoverWorkflowStep, setHandoverWorkflowStep] = useState<1 | 2 | 3>(1);

  const hasValidInspection = useMemo(() => {
    // Authoritative backend handover eligibility check
    if (eligibility && (eligibility.reason === 'READY' || eligibility.handoverAllowed)) {
      return true;
    }
    if (!latestCompletedInspection) return false;
    const completedAt = latestCompletedInspection.completedAt;
    const isFresh = completedAt ? (Date.now() - new Date(completedAt).getTime() < 24 * 3600 * 1000) : false;
    const isPass = latestCompletedInspection.overallResult !== 'FAIL';
    const hasAllRequired = completedRequiredCount >= 8;
    const hasNoSevereDamages = unresolvedDamages.every((d: any) => d.severity !== 'SEVERE');
    return isFresh && isPass && hasAllRequired && hasNoSevereDamages;
  }, [eligibility, latestCompletedInspection, completedRequiredCount, unresolvedDamages]);

  // ==========================================
  // OPERATIONAL ACTION HANDLERS
  // ==========================================

  // Handover actions
  const [isProcessingHandover, setIsProcessingHandover] = useState(false);
  const [handoverNote, setHandoverNote] = useState('Nhân viên vận hành đã xác nhận bàn giao đầy đủ chìa khóa và kiểm tra xe.');
  const [checklistItems, setChecklistItems] = useState({
    batteryOdo: true,
    documents: true,
    keysSafety: true,
  });

  const handleStartHandover = async () => {
    if (!currentHandover) return;
    const bookingId = currentHandover.bookingId;
    if (!bookingId) {
      setActionErrorMsg('Không tìm thấy mã lịch đặt tương ứng.');
      return;
    }
    setIsProcessingHandover(true);
    clearMessages();
    try {
      await startHandoverApi(bookingId);
      setActionSuccessMsg('Đã khởi tạo quy trình kiểm tra và bàn giao xe.');
      await Promise.all([
        refetchHandovers(),
        refetchEligibility(),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers'] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
      ]);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể bắt đầu kiểm tra và bàn giao xe.');
    } finally {
      setIsProcessingHandover(false);
    }
  };

  const handleMarkHandoverReady = async () => {
    if (!currentHandover) return;
    let handoverId = currentHandover.id;
    if (!handoverId && currentHandover.bookingId) {
      try {
        const startRes = await startHandoverApi(currentHandover.bookingId);
        handoverId = startRes.id;
      } catch (e) {
        // proceed to validation
      }
    }
    if (!handoverId) {
      setActionErrorMsg('Vui lòng khởi tạo quy trình trước khi xác nhận sẵn sàng.');
      return;
    }
    setIsProcessingHandover(true);
    clearMessages();
    try {
      await markHandoverReadyApi(handoverId);
      setActionSuccessMsg('Đã xác nhận xe sẵn sàng bàn giao cho người nhận.');
      await Promise.all([
        refetchHandovers(),
        refetchEligibility(),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers'] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
      ]);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể xác nhận sẵn sàng bàn giao.');
    } finally {
      setIsProcessingHandover(false);
    }
  };

  const handleConfirmHandover = async () => {
    if (!currentHandover) return;
    let handoverId = currentHandover.id;
    setIsProcessingHandover(true);
    clearMessages();
    try {
      // If handover record hasn't been created in DB yet, start it first
      if (!handoverId && currentHandover.bookingId) {
        const startRes = await startHandoverApi(currentHandover.bookingId);
        handoverId = startRes.id;
      }
      if (!handoverId) {
        setActionErrorMsg('Không tìm thấy mã hồ sơ bàn giao.');
        setIsProcessingHandover(false);
        return;
      }
      if (currentHandover.status === 'INSPECTION_IN_PROGRESS' || !currentHandover.status || currentHandover.status === 'PENDING_PREPARATION') {
        await markHandoverReadyApi(handoverId);
      }
      await confirmHandoverApi(handoverId);
      setActionSuccessMsg('Bàn giao xe thành công! Đang chờ đồng sở hữu xác nhận nhận xe trên ứng dụng.');
      await Promise.all([
        refetchHandovers(),
        refetchEligibility(),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers'] }),
        queryClient.invalidateQueries({ queryKey: ['activeHandover'] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility'] }),
        queryClient.invalidateQueries({ queryKey: ['booking-handover'] }),
        queryClient.invalidateQueries({ queryKey: ['booking-trip'] }),
        queryClient.invalidateQueries({ queryKey: ['trip-start-eligibility'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleBookings'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['handoverHistory'] }),
      ]);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể xác nhận hoàn tất bàn giao.');
    } finally {
      setIsProcessingHandover(false);
    }
  };

  // Return actions & ODOMETER-based return recording
  const [isConfirmingReturn, setIsConfirmingReturn] = useState(false);
  const [returnNote, setReturnNote] = useState('');
  const [returnEndOdometer, setReturnEndOdometer] = useState<string>('');
  const [returnEndBattery, setReturnEndBattery] = useState<string>('');
  const [returnFormError, setReturnFormError] = useState<string | null>(null);

  // Sync default return odometer & SOC with vehicle's current state when activeTrip is present
  useEffect(() => {
    if (activeTrip) {
      if (currentVehicle.odometer != null) {
        setReturnEndOdometer(String(currentVehicle.odometer));
      } else if (activeTrip.startOdometer != null) {
        setReturnEndOdometer(String(activeTrip.startOdometer));
      }
      if (currentVehicle.currentBatteryLevel != null) {
        setReturnEndBattery(String(currentVehicle.currentBatteryLevel));
      } else if (activeTrip.startBatteryLevel != null) {
        setReturnEndBattery(String(activeTrip.startBatteryLevel));
      }
    }
  }, [activeTrip?.id, currentVehicle.odometer, currentVehicle.currentBatteryLevel]);

  const handleConfirmReturn = async () => {
    if (!activeTrip) return;
    setReturnFormError(null);
    clearMessages();

    const startOdo = activeTrip.startOdometer != null ? Number(activeTrip.startOdometer) : 0;
    const endOdo = parseFloat(returnEndOdometer);
    if (isNaN(endOdo) || returnEndOdometer.trim() === '') {
      setReturnFormError('Vui lòng nhập số km trên đồng hồ (ODO) khi nhận lại xe.');
      return;
    }
    if (endOdo < 0) {
      setReturnFormError('Số km trên đồng hồ không thể là số âm.');
      return;
    }
    if (endOdo < startOdo) {
      setReturnFormError(
        `Số km khi nhận lại (${endOdo.toLocaleString('vi-VN')} km) không thể nhỏ hơn số km khi xuất phát (${startOdo.toLocaleString('vi-VN')} km).`
      );
      return;
    }

    const dist = endOdo - startOdo;
    const consumptionPer100 = vehicle.energyConsumptionKwhPer100Km ?? (vehicle.name?.includes('EV02') ? 16.5 : 17.5);
    const usableCapacity = vehicle.usableBatteryCapacityKwh ?? (vehicle.name?.includes('EV02') ? 60 : 65);
    const modeledEnergyKwh = (Math.max(0, dist) * consumptionPer100) / 100;
    const modeledSocConsumed = usableCapacity > 0 ? (modeledEnergyKwh / usableCapacity) * 100 : 0;
    const startSoc = activeTrip.startBatteryLevel ?? currentVehicle.currentBatteryLevel ?? 100;
    const modeledEndSoc = Math.max(0, Math.round(startSoc - modeledSocConsumed));

    let finalEndSoc: number;
    if (returnEndBattery.trim() !== '') {
      const parsedSoc = parseInt(returnEndBattery, 10);
      if (isNaN(parsedSoc) || parsedSoc < 0 || parsedSoc > 100) {
        setReturnFormError('Mức pin khi nhận lại phải nằm trong khoảng từ 0% đến 100%.');
        return;
      }
      if (dist > 0 && parsedSoc >= startSoc) {
        finalEndSoc = modeledEndSoc;
      } else {
        finalEndSoc = parsedSoc;
      }
    } else {
      finalEndSoc = dist > 0 ? modeledEndSoc : startSoc;
    }

    setIsConfirmingReturn(true);
    try {
      await confirmTripReturnApi(activeTrip.id, {
        endOdometer: endOdo,
        endBatteryLevel: finalEndSoc,
        conditionNote: returnNote.trim() || 'Nhân viên đã kiểm tra tình trạng xe và hoàn tất nhận xe.',
      });
      const distanceTraveled = Math.max(0, endOdo - startOdo);
      setActionSuccessMsg(
        `Đã hoàn tất thủ tục nhận xe! Quãng đường: ${distanceTraveled.toFixed(1)} km. Pin chốt: ${finalEndSoc}%.`
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activeTrip', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeTrip'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleTrips', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleExpenses', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['coOwnershipExpenses'] }),
        queryClient.invalidateQueries({ queryKey: ['groupExpenses'] }),
        queryClient.invalidateQueries({ queryKey: ['financeZoneSummary'] }),
        queryClient.invalidateQueries({ queryKey: ['expenseApprovals'] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleBookings', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['pendingReturnTrips'] }),
        queryClient.invalidateQueries({ queryKey: ['handoverHistory'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      await queryClient.refetchQueries({ queryKey: ['vehicles'] });
      refetchActiveTrip();
      refetchTrips();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể hoàn tất trả xe.');
    } finally {
      setIsConfirmingReturn(false);
    }
  };

  // Inspection actions
  const [partCondition, setPartCondition] = useState<InspectionItemCondition>('GOOD');
  const [partNote, setPartNote] = useState('');
  const [isSavingPart, setIsSavingPart] = useState(false);

  // Synchronize component condition and note with existing assessment in active session
  useEffect(() => {
    if (activeInspection?.items) {
      const existing = activeInspection.items.find(
        (i) => i.vehiclePartCode === selectedPartKey
      );
      if (existing) {
        setPartCondition(existing.conditionStatus);
        setPartNote(existing.note || '');
      } else {
        setPartCondition('GOOD');
        setPartNote('');
      }
    }
  }, [selectedPartKey, activeInspection]);

  const handleSavePartInspection = async () => {
    if (!user) {
      setActionErrorMsg('Vui lòng đăng nhập với tài khoản nhân viên vận hành.');
      return;
    }
    if (!vehicle?.id) {
      setActionErrorMsg('Không tìm thấy thông tin phương tiện.');
      return;
    }
    if (!activeInspection || activeInspection.status !== 'IN_PROGRESS') {
      setActionErrorMsg('Chưa có phiên kiểm tra đang hoạt động.');
      return;
    }
    if (!selectedPartKey) {
      setActionErrorMsg('Vui lòng chọn bộ phận cần kiểm tra.');
      return;
    }
    setIsSavingPart(true);
    clearMessages();
    try {
      const targetCode = (normalizeCanonicalPartCode(selectedPartKey) || selectedPartKey) as string;
      const resItem = await submitInspectionItemApi(activeInspection.id, {
        vehiclePartCode: targetCode,
        conditionStatus: partCondition,
        note: partNote.trim() || (partCondition === 'GOOD' ? 'Đạt tiêu chuẩn' : 'Có ghi nhận lưu ý'),
      });
      // Optimistically update TanStack query data so progress counter updates immediately
      queryClient.setQueryData<VehicleInspectionResponse | null>(
        ['activeInspection', vehicle.id],
        (old) => {
          if (!old) return old;
          const currentItems = old.items || [];
          const idx = currentItems.findIndex(
            (i) => normalizeCanonicalPartCode(i.vehiclePartCode) === targetCode
          );
          let nextItems;
          if (idx >= 0) {
            nextItems = [...currentItems];
            nextItems[idx] = {
              ...nextItems[idx],
              ...(resItem || {}),
              vehiclePartCode: targetCode,
              conditionStatus: partCondition,
              note: partNote.trim(),
            };
          } else {
            nextItems = [
              ...currentItems,
              {
                ...(resItem || {}),
                id: resItem?.id || `item-${Date.now()}`,
                vehiclePartCode: targetCode,
                conditionStatus: partCondition,
                note: partNote.trim(),
              },
            ];
          }
          return { ...old, items: nextItems };
        }
      );
      const partLabel = SEMANTIC_PART_LABELS_VI[selectedPartKey] || selectedPartKey;
      setActionSuccessMsg(
        `Đã lưu đánh giá: ${partLabel} (${partCondition === 'GOOD' ? 'TỐT' : partCondition === 'SCRATCH' ? 'TRẦY' : partCondition === 'DENT' ? 'MÓP' : 'NỨT'})`
      );
      refetchInspection();
      queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] });
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
    if (activeInspection && activeInspection.status === 'IN_PROGRESS') {
      const confirmed = window.confirm(
        'Phương tiện đang có phiên kiểm tra đang hoạt động. Bạn có chắc chắn muốn tạo phiên kiểm tra mới?'
      );
      if (!confirmed) return;
    }
    try {
      const res = await startInspectionApi(vehicle.id, 'PRE_HANDOVER');
      queryClient.setQueryData(['activeInspection', vehicle.id], res);
      queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] });
      refetchDamages();
      setActionSuccessMsg('Đã khởi tạo phiên kiểm tra mới.');
      refetchInspection();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể khởi tạo kiểm tra.');
    }
  };

  const handleCompleteInspection = async () => {
    if (!activeInspection) {
      setActionErrorMsg('Không có phiên kiểm tra để hoàn tất.');
      return;
    }
    if (!activeInspection.items || activeInspection.items.length === 0) {
      setActionErrorMsg('Cần kiểm tra ít nhất một bộ phận trước khi hoàn tất biên bản.');
      return;
    }
    clearMessages();
    try {
      const res = await completeInspectionApi(activeInspection.id, {
        summaryNote: 'Hoàn tất kiểm tra 3D tất cả các bộ phận kỹ thuật.',
      });
      const assessedCount = res?.uniqueAssessedComponents ?? uniqueAssessedCount;
      const reqCount = res?.assessedRequiredComponentCount ?? requiredAssessedCount;
      const defectCount = res?.abnormalCount || 0;
      const resultText =
        res?.overallResult === 'PASS'
          ? 'ĐẠT TIÊU CHUẨN (PASS)'
          : res?.overallResult === 'PASS_WITH_NOTES'
          ? 'ĐẠT (CÓ LƯU Ý)'
          : 'KHÔNG ĐẠT (FAIL)';

      setActionSuccessMsg(
        `Đã hoàn tất biên bản kiểm tra: ${assessedCount}/${totalAvailablePartsCount} bộ phận đã đánh giá (${reqCount}/8 bộ phận bắt buộc)${
          defectCount > 0 ? `, ${defectCount} khiếm khuyết được đồng bộ vào hồ sơ hư hỏng` : ''
        }. Kết quả: ${resultText}.`
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activeInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['latestCompletedInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers'] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
      ]);
      refetchInspection();
      refetchLatestCompleted();
      refetchDamages();
      refetchHandovers();
      refetchEligibility();

      // STRICT UI REQUIREMENT: REMAIN IN STANDALONE 3D INSPECTION SCREEN
      // Do NOT switch to 'HANDOVER', do NOT navigate to step 2 or 3, keep 3D model & hotspots visible
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể hoàn tất biên bản.');
    }
  };

  // Maintenance proposal draft state per damage record
  const [expandedDamageId, setExpandedDamageId] = useState<string | null>(null);
  const [proposalDesc, setProposalDesc] = useState<Record<string, string>>({});
  const [proposalCost, setProposalCost] = useState<Record<string, string>>({});
  const [proposalPriority, setProposalPriority] = useState<Record<string, MaintenancePriority>>({});
  const [isSubmittingProposal, setIsSubmittingProposal] = useState<string | null>(null);

  // Dedicated Proposal Creation Form State (Phase 24/25)
  const [showGeneralProposalForm, setShowGeneralProposalForm] = useState(false);
  const [generalProposalTitle, setGeneralProposalTitle] = useState('');
  const [generalProposalType, setGeneralProposalType] = useState<MaintenanceType>('REPAIR');
  const [generalProposalPriority, setGeneralProposalPriority] = useState<MaintenancePriority>('MEDIUM');
  const [generalProposalDesc, setGeneralProposalDesc] = useState('');
  const [generalProposalCost, setGeneralProposalCost] = useState('');
  const [generalSelectedDamageIds, setGeneralSelectedDamageIds] = useState<string[]>([]);
  const [isSubmittingGeneralProposal, setIsSubmittingGeneralProposal] = useState(false);

  const handleToggleDamageSelection = (damage: any) => {
    setGeneralSelectedDamageIds((prev) => {
      const exists = prev.includes(damage.id);
      const next = exists ? prev.filter((id) => id !== damage.id) : [...prev, damage.id];

      // If selecting first damage and title is empty, prefill
      if (!exists && (!generalProposalTitle || generalProposalTitle === '')) {
        const partKey = normalizeCanonicalPartCode(damage.vehiclePartCode || damage.partCode);
        const partLabel = SEMANTIC_PART_LABELS_VI[partKey as VehiclePartId] || partKey;
        const typeLabel = VI_DAMAGE_TYPE_LABELS[damage.damageType] || damage.damageType;
        setGeneralProposalTitle(`Đề xuất sửa chữa: ${partLabel} (${typeLabel})`);
        if (damage.severity === 'SEVERE' || damage.severity === 'HIGH') {
          setGeneralProposalPriority('CRITICAL');
        } else if (damage.severity === 'MODERATE') {
          setGeneralProposalPriority('HIGH');
        }
        if (!generalProposalDesc && (damage.note || damage.description)) {
          setGeneralProposalDesc(damage.note || damage.description);
        }
      }
      return next;
    });
  };

  const handleOpenProposalForDamage = (d: any) => {
    const partKey = normalizeCanonicalPartCode(d.vehiclePartCode || d.partCode);
    const partLabel = SEMANTIC_PART_LABELS_VI[partKey as VehiclePartId] || partKey;
    const typeLabel = VI_DAMAGE_TYPE_LABELS[d.damageType] || d.damageType;
    setGeneralSelectedDamageIds([d.id]);
    setGeneralProposalTitle(`Đề xuất sửa chữa: ${partLabel} (${typeLabel})`);
    setGeneralProposalType('REPAIR');
    setGeneralProposalPriority(
      d.severity === 'SEVERE' || d.severity === 'HIGH' ? 'CRITICAL' : d.severity === 'MODERATE' ? 'HIGH' : 'MEDIUM'
    );
    setGeneralProposalDesc(d.note || d.description || '');
    setGeneralProposalCost('');
    setShowGeneralProposalForm(true);
    setExpandedDamageId(null);
    clearMessages();
  };

  const handleGeneralProposalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearMessages();

    const title = generalProposalTitle.trim();
    if (!title) {
      setActionErrorMsg('Vui lòng nhập tiêu đề đề xuất bảo dưỡng.');
      return;
    }

    const desc = generalProposalDesc.trim();
    if (!desc) {
      setActionErrorMsg('Vui lòng nhập mô tả chi tiết phương án bảo dưỡng/sửa chữa.');
      return;
    }

    const costStr = generalProposalCost.trim().replace(/[^0-9.]/g, '');
    const costNum = parseFloat(costStr);
    if (isNaN(costNum) || costNum <= 0) {
      setActionErrorMsg('Vui lòng nhập chi phí dự toán hợp lệ (lớn hơn 0 VND).');
      return;
    }

    setIsSubmittingGeneralProposal(true);
    try {
      await createVehicleMaintenance(vehicle.id, {
        title,
        description: desc,
        estimatedCost: costNum,
        priority: generalProposalPriority,
        maintenanceType: generalProposalType,
        damageRecordIds: generalSelectedDamageIds.length > 0 ? generalSelectedDamageIds : undefined,
      });

      setActionSuccessMsg('Đã tạo đề xuất bảo dưỡng và gửi biểu quyết đến nhóm đồng sở hữu.');
      setShowGeneralProposalForm(false);
      setGeneralProposalTitle('');
      setGeneralProposalDesc('');
      setGeneralProposalCost('');
      setGeneralSelectedDamageIds([]);
      setGeneralProposalPriority('MEDIUM');
      setGeneralProposalType('REPAIR');

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['staffApprovedWork'] }),
        queryClient.invalidateQueries({ queryKey: ['vote-proposals'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      refetchMaintenance();
      refetchDamages();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể gửi đề xuất bảo dưỡng.');
    } finally {
      setIsSubmittingGeneralProposal(false);
    }
  };

  // Maintenance repair execution state
  const [isStartingRepair, setIsStartingRepair] = useState<string | null>(null);
  const [completingMaintId, setCompletingMaintId] = useState<string | null>(null);
  const [repairActualCost, setRepairActualCost] = useState<string>('');
  const [repairCompletionNote, setRepairCompletionNote] = useState<string>('');
  const [isCompletingRepair, setIsCompletingRepair] = useState(false);

  const handleSendRepairProposal = async (damage: any) => {
    const desc = (proposalDesc[damage.id] || '').trim();
    const costStr = (proposalCost[damage.id] || '').trim();
    const priority: MaintenancePriority =
      proposalPriority[damage.id] ||
      (damage.severity === 'SEVERE' || damage.severity === 'HIGH' ? 'CRITICAL' : 'MEDIUM');

    if (!desc) {
      setActionErrorMsg('Vui lòng nhập phương án sửa chữa chi tiết.');
      return;
    }

    const costNum = parseFloat(costStr.replace(/[^0-9.]/g, ''));
    if (isNaN(costNum) || costNum <= 0) {
      setActionErrorMsg('Vui lòng nhập chi phí dự kiến hợp lệ (lớn hơn 0 VND).');
      return;
    }

    setIsSubmittingProposal(damage.id);
    clearMessages();
    try {
      const partKey = normalizeCanonicalPartCode(damage.vehiclePartCode || damage.partCode);
      const partLabel = SEMANTIC_PART_LABELS_VI[partKey as VehiclePartId] || partKey;
      const typeLabel = VI_DAMAGE_TYPE_LABELS[damage.damageType] || damage.damageType;

      await createVehicleMaintenance(vehicle.id, {
        title: `Đề xuất sửa chữa: ${partLabel} (${typeLabel})`,
        description: desc,
        estimatedCost: costNum,
        priority: priority,
        maintenanceType: 'REPAIR',
        damageRecordIds: [damage.id],
      });

      setActionSuccessMsg('Đã tạo đề xuất sửa chữa và gửi đến nhóm đồng sở hữu.');
      setProposalDesc((prev) => ({ ...prev, [damage.id]: '' }));
      setProposalCost((prev) => ({ ...prev, [damage.id]: '' }));
      setExpandedDamageId(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] }),
      ]);
      refetchMaintenance();
      refetchDamages();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể gửi đề xuất sửa chữa.');
    } finally {
      setIsSubmittingProposal(null);
    }
  };

  const handleStartRepair = async (maintenanceId: string) => {
    setIsStartingRepair(maintenanceId);
    clearMessages();
    try {
      await startMaintenance(maintenanceId);
      setActionSuccessMsg('Đã bắt đầu thực hiện sửa chữa. Trạng thái xe chuyển sang BẢO DƯỠNG.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
      ]);
      refetchMaintenance();
      refetchDamages();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể bắt đầu sửa chữa.');
    } finally {
      setIsStartingRepair(null);
    }
  };

  const handleCompleteRepair = async (maintenanceId: string) => {
    const costNum = repairActualCost ? parseFloat(repairActualCost.replace(/[^0-9.]/g, '')) : undefined;
    setIsCompletingRepair(true);
    clearMessages();
    try {
      await completeMaintenance(maintenanceId, {
        completionNote: repairCompletionNote.trim() || 'Nghiệm thu hoàn tất đạt tiêu chuẩn kỹ thuật.',
        actualCost: costNum && costNum > 0 ? costNum : undefined,
        inspectionResult: 'PASSED',
      });
      setActionSuccessMsg('Đã hoàn tất sửa chữa và nghiệm thu! Hư hỏng đã được khắc phục (RESOLVED).');
      setCompletingMaintId(null);
      setRepairActualCost('');
      setRepairCompletionNote('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
      ]);
      refetchMaintenance();
      refetchDamages();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể hoàn tất sửa chữa.');
    } finally {
      setIsCompletingRepair(false);
    }
  };

  // ==========================================
  // UNIFIED HISTORY TIMELINE
  // ==========================================
  const unifiedHistory = useMemo(() => {
    type HistoryItem = {
      id: string;
      type: 'HANDOVER' | 'RETURN' | 'DAMAGE' | 'CHARGING' | 'TRIP';
      title: string;
      description: string;
      timestamp: string;
      badgeColor: string;
    };

    const items: HistoryItem[] = [];

    // Vehicle Trips (Chuyến đi & Hoàn tất trả xe)
    vehicleTrips.forEach((t) => {
      const isCompleted = t.status === 'COMPLETED';
      const odoStart = t.startOdometer != null ? `${Number(t.startOdometer).toLocaleString()} km` : '—';
      const odoEnd = t.endOdometer != null ? `${Number(t.endOdometer).toLocaleString()} km` : '—';
      const socStart = t.startBatteryLevel != null ? `${t.startBatteryLevel}%` : '—';
      const socEnd = t.endBatteryLevel != null ? `${t.endBatteryLevel}%` : '—';
      const distance =
        t.startOdometer != null && t.endOdometer != null && Number(t.endOdometer) >= Number(t.startOdometer)
          ? `${(Number(t.endOdometer) - Number(t.startOdometer)).toLocaleString()} km`
          : null;

      items.push({
        id: `trip-${t.id}`,
        type: 'TRIP',
        title: isCompleted ? 'Hoàn tất chuyến đi & Trả xe' : 'Chuyến đi đang diễn ra',
        description: `ODO: ${odoStart} ➔ ${odoEnd}${distance ? ` (Đi: ${distance})` : ''} • PIN: ${socStart} ➔ ${socEnd} • Lái xe: ${t.userName || 'Đồng sở hữu'}`,
        timestamp: t.endedAt || t.startedAt || t.createdAt || '',
        badgeColor: isCompleted ? '#10b981' : '#a855f7',
      });
    });

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
  }, [handoverHistory, damages, chargingSessions, vehicleTrips]);

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
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
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
            {currentVehicle.currentBatteryLevel != null ? `${currentVehicle.currentBatteryLevel}%` : 'Chưa ghi nhận'}
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, currentVehicle.currentBatteryLevel ?? 0))}%`,
                height: '100%',
                background: currentVehicle.currentBatteryLevel && currentVehicle.currentBatteryLevel > 20 ? '#00f2fe' : '#ef4444',
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
            {currentVehicle.odometer != null ? (
              <>
                {Number(currentVehicle.odometer).toLocaleString()} <span style={{ fontSize: '10px', color: '#94a3b8' }}>km</span>
              </>
            ) : (
              <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa ghi nhận ODO</span>
            )}
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '4px' }}>
            {currentVehicle.usableBatteryCapacityKwh || currentVehicle.batteryCapacity || 75} kWh dung lượng
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
                onClick={() => {
                  clearMessages();
                  setActiveModule('HANDOVER');
                  setHandoverWorkflowStep(hasValidInspection ? 3 : 1);
                  setVehicleInspectionMode(false);
                }}
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
                  <span style={{ fontSize: '9.5px', fontWeight: 700, color: (eligibility?.handoverAllowed || eligibility?.eligibleForInspection) ? '#34d399' : '#94a3b8' }}>
                    {eligibility?.handoverAllowed ? 'Đủ điều kiện' : (eligibility?.eligibleForInspection ? 'Chờ kiểm tra' : 'Chưa có lịch')}
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
                onClick={() => {
                  clearMessages();
                  setActiveModule('INSPECTION_3D');
                  setVehicleInspectionMode(true);
                }}
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

            {/* Quick Financial Verification Action Card */}
            <button
              type="button"
              onClick={() => setPaymentVerificationModalOpen(true)}
              style={{
                marginTop: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(2, 132, 199, 0.16) 100%)',
                border: '1.2px solid rgba(0, 242, 254, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                width: '100%',
                boxSizing: 'border-box',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f2fe';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(0, 242, 254, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00f2fe',
                  }}
                >
                  <Wallet size={16} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                    XÁC MINH THANH TOÁN ĐỒNG SỞ HỮU
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                    Đối soát nộp tiền chi phí cá nhân (Chế độ DEMO)
                  </div>
                </div>
              </div>
              <ChevronRight size={16} color="#00f2fe" />
            </button>
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
                2. MODULE: BẢO DƯỠNG & ĐỀ XUẤT SỬA CHỮA (PHASE 24/25)
                ---------------------------------------------------- */}
            {activeModule === 'MAINTENANCE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Header overview */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(15, 32, 60, 0.75)',
                    border: '1px solid rgba(0, 242, 254, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wrench size={14} color="#00f2fe" />
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff' }}>
                      HỒ SƠ HƯ HỎNG & ĐỀ XUẤT SỬA CHỮA
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: unresolvedDamages.length > 0 ? '#ef4444' : '#10b981',
                      background: unresolvedDamages.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: `1px solid ${unresolvedDamages.length > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                    }}
                  >
                    {unresolvedDamages.length} CHƯA XỬ LÝ
                  </span>
                </div>

                {/* Primary Action Button: + TẠO ĐỀ XUẤT BẢO DƯỠNG (Section 2) */}
                {!showGeneralProposalForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowGeneralProposalForm(true);
                      clearMessages();
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(245, 158, 11, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.35)';
                    }}
                  >
                    <Plus size={15} />
                    <span>+ TẠO ĐỀ XUẤT BẢO DƯỠNG</span>
                  </button>
                )}

                {/* Inline Proposal Form */}
                {showGeneralProposalForm && (
                  <form
                    onSubmit={handleGeneralProposalSubmit}
                    style={{
                      background: 'rgba(245, 158, 11, 0.06)',
                      border: '1.2px solid rgba(245, 158, 11, 0.45)',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '8px',
                        borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: '#f59e0b',
                          letterSpacing: '0.04em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Wrench size={14} />
                        <span>PHIẾU ĐỀ XUẤT BẢO DƯỠNG XE</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowGeneralProposalForm(false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Tiêu đề đề xuất */}
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 600 }}>
                        Tiêu đề đề xuất <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={generalProposalTitle}
                        onChange={(e) => setGeneralProposalTitle(e.target.value)}
                        placeholder="Ví dụ: Đề xuất sửa chữa hệ thống pin / Thay cản sau"
                        style={{
                          width: '100%',
                          marginTop: '4px',
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '7px 9px',
                          fontSize: '11.5px',
                          color: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        required
                      />
                    </div>

                    {/* Loại & Mức ưu tiên */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 600 }}>
                          Loại công việc
                        </label>
                        <select
                          value={generalProposalType}
                          onChange={(e) => setGeneralProposalType(e.target.value as MaintenanceType)}
                          style={{
                            width: '100%',
                            marginTop: '4px',
                            background: '#0f172a',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            padding: '7px 6px',
                            fontSize: '11px',
                            color: '#ffffff',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        >
                          {Object.entries(MAINTENANCE_TYPE_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key} style={{ background: '#0f172a' }}>
                              {cfg.labelVi}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 600 }}>
                          Mức ưu tiên
                        </label>
                        <select
                          value={generalProposalPriority}
                          onChange={(e) => setGeneralProposalPriority(e.target.value as MaintenancePriority)}
                          style={{
                            width: '100%',
                            marginTop: '4px',
                            background: '#0f172a',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            padding: '7px 6px',
                            fontSize: '11px',
                            color: '#ffffff',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        >
                          {Object.entries(MAINTENANCE_PRIORITY_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key} style={{ background: '#0f172a' }}>
                              {cfg.labelVi}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Chi phí dự toán */}
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 600 }}>
                        Chi phí dự toán (VND) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={generalProposalCost}
                        onChange={(e) => setGeneralProposalCost(e.target.value)}
                        placeholder="Ví dụ: 2000000"
                        style={{
                          width: '100%',
                          marginTop: '4px',
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '7px 9px',
                          fontSize: '11.5px',
                          color: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        required
                      />
                    </div>

                    {/* Mô tả chi tiết phương án */}
                    <div>
                      <label style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 600 }}>
                        Mô tả chi tiết phương án sửa chữa <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <textarea
                        value={generalProposalDesc}
                        onChange={(e) => setGeneralProposalDesc(e.target.value)}
                        rows={2}
                        placeholder="Phương án xử lý kỹ thuật, phụ tùng thay thế và lý do gửi biểu quyết..."
                        style={{
                          width: '100%',
                          marginTop: '4px',
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          fontSize: '11px',
                          color: '#ffffff',
                          outline: 'none',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                        }}
                        required
                      />
                    </div>

                    {/* Liên kết hồ sơ hư hỏng */}
                    {unresolvedDamages.length > 0 && (
                      <div>
                        <label
                          style={{
                            fontSize: '10.5px',
                            color: '#cbd5e1',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>Liên kết vết hư hại ({generalSelectedDamageIds.length} đã chọn):</span>
                        </label>
                        <div
                          style={{
                            marginTop: '4px',
                            maxHeight: '100px',
                            overflowY: 'auto',
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          {unresolvedDamages.map((dmg: any) => {
                            const isChecked = generalSelectedDamageIds.includes(dmg.id);
                            const partKey = normalizeCanonicalPartCode(dmg.vehiclePartCode || dmg.partCode);
                            const partLabel = SEMANTIC_PART_LABELS_VI[partKey as VehiclePartId] || partKey;
                            const typeLabel = VI_DAMAGE_TYPE_LABELS[dmg.damageType] || dmg.damageType;
                            return (
                              <label
                                key={dmg.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  background: isChecked ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                  cursor: 'pointer',
                                  fontSize: '10.5px',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleDamageSelection(dmg)}
                                />
                                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{partLabel}</span>
                                <span style={{ color: '#94a3b8' }}>({typeLabel})</span>
                                <span
                                  style={{
                                    marginLeft: 'auto',
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    color: dmg.severity === 'SEVERE' || dmg.severity === 'HIGH' ? '#f87171' : '#fbbf24',
                                  }}
                                >
                                  {dmg.severity}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="submit"
                        disabled={isSubmittingGeneralProposal}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          border: 'none',
                          borderRadius: '7px',
                          padding: '8px',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Send size={13} />
                        <span>{isSubmittingGeneralProposal ? 'ĐANG GỬI...' : 'GỬI ĐỀ XUẤT CHO NHÓM'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowGeneralProposalForm(false)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '7px',
                          padding: '8px 14px',
                          color: '#94a3b8',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        HỦY
                      </button>
                    </div>
                  </form>
                )}

                {/* Connection / API Error Card */}
                {isDamagesError && (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      color: '#fca5a5',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} color="#ef4444" />
                      <span>{(damagesError as any)?.message || 'Không thể tải danh sách hư hỏng từ máy chủ.'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => refetchDamages()}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.25)',
                        border: '1px solid #ef4444',
                        color: '#ffffff',
                        fontSize: '10.5px',
                        cursor: 'pointer',
                      }}
                    >
                      Thử lại
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {!isDamagesError && unresolvedDamages.length === 0 && (
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(15, 32, 60, 0.55)',
                      border: '1px dashed rgba(16, 185, 129, 0.3)',
                      textAlign: 'center',
                      color: '#cbd5e1',
                      fontSize: '11.5px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={24} color="#10b981" />
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>Phương tiện đạt chuẩn kỹ thuật tốt</span>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                      Không có khiếm khuyết hư hỏng nào chưa xử lý. Mọi bộ phận đều sẵn sàng vận hành.
                    </span>
                  </div>
                )}

                {/* Damage Cards List */}
                {unresolvedDamages.map((d: any) => {
                  const partKey = normalizeCanonicalPartCode(d.vehiclePartCode || d.partCode);
                  const partLabel = SEMANTIC_PART_LABELS_VI[partKey as VehiclePartId] || partKey;
                  const typeLabel = VI_DAMAGE_TYPE_LABELS[d.damageType] || d.damageType;
                  const sev = VI_SEVERITY_CONFIG[d.severity] || { label: d.severity, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
                  const stat = VI_DAMAGE_STATUS_CONFIG[d.status] || { label: d.status, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
                  const linkedMaint = getLinkedMaintenanceForDamage(d);
                  const isExpanded = expandedDamageId === d.id;

                  return (
                    <div
                      key={d.id}
                      style={{
                        background: 'rgba(15, 32, 60, 0.75)',
                        border: `1px solid ${
                          linkedMaint
                            ? linkedMaint.status === 'APPROVED'
                              ? '#10b981'
                              : linkedMaint.status === 'IN_PROGRESS'
                              ? '#00f2fe'
                              : 'rgba(245, 158, 11, 0.4)'
                            : 'rgba(255, 255, 255, 0.12)'
                        }`,
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      {/* Card Title & Badges */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{partLabel}</span>
                            <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>—</span>
                            <span style={{ color: '#f59e0b', fontWeight: 800 }}>{typeLabel}</span>
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                            Nguồn: <span style={{ color: '#38bdf8' }}>Kiểm tra kỹ thuật 3D</span> {d.createdAt ? `• ${formatDateTime(d.createdAt)}` : ''}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              color: sev.color,
                              background: sev.bg,
                              border: `1px solid ${sev.color}40`,
                            }}
                          >
                            {sev.label}
                          </span>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              color: stat.color,
                              background: stat.bg,
                              border: `1px solid ${stat.color}40`,
                            }}
                          >
                            {stat.label}
                          </span>
                        </div>
                      </div>

                      {/* Notes */}
                      <div
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: 'rgba(0, 0, 0, 0.25)',
                          borderLeft: '3px solid #38bdf8',
                          fontSize: '11px',
                          color: '#e2e8f0',
                          lineHeight: 1.4,
                        }}
                      >
                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>Ghi chú kiểm tra: </span>
                        {d.note || d.description || 'Ghi nhận khiếm khuyết từ phiên kiểm tra kỹ thuật 3D.'}
                      </div>

                      {/* LINKED MAINTENANCE PROPOSAL/STATUS */}
                      {linkedMaint ? (
                        <div
                          style={{
                            marginTop: '2px',
                            padding: '10px',
                            borderRadius: '8px',
                            background:
                              linkedMaint.status === 'APPROVED'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : linkedMaint.status === 'IN_PROGRESS'
                                ? 'rgba(0, 242, 254, 0.1)'
                                : 'rgba(245, 158, 11, 0.1)',
                            border: `1px solid ${
                              linkedMaint.status === 'APPROVED'
                                ? 'rgba(16, 185, 129, 0.3)'
                                : linkedMaint.status === 'IN_PROGRESS'
                                ? 'rgba(0, 242, 254, 0.3)'
                                : 'rgba(245, 158, 11, 0.3)'
                            }`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {linkedMaint.status === 'APPROVED' ? (
                                <CheckCircle2 size={13} color="#10b981" />
                              ) : linkedMaint.status === 'IN_PROGRESS' ? (
                                <Wrench size={13} color="#00f2fe" />
                              ) : (
                                <Clock size={13} color="#f59e0b" />
                              )}
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  color:
                                    linkedMaint.status === 'APPROVED'
                                      ? '#10b981'
                                      : linkedMaint.status === 'IN_PROGRESS'
                                      ? '#00f2fe'
                                      : '#f59e0b',
                                }}
                              >
                                {linkedMaint.status === 'PENDING_APPROVAL' && 'ĐÃ GỬI ĐỀ XUẤT (CHỜ BIỂU QUYẾT)'}
                                {linkedMaint.status === 'APPROVED' && 'ĐÃ THÔNG QUA (ĐƯỢC PHÉP SỬA CHỮA)'}
                                {linkedMaint.status === 'SCHEDULED' && 'ĐÃ LÊN LỊCH SỬA CHỮA'}
                                {linkedMaint.status === 'IN_PROGRESS' && 'ĐANG THỰC HIỆN SỬA CHỮA'}
                                {linkedMaint.status === 'COMPLETED' && 'ĐÃ HOÀN TẤT & NGHIỆM THU'}
                              </span>
                            </div>

                            {linkedMaint.status === 'PENDING_APPROVAL' && (
                              <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>
                                Tiến độ: {linkedMaint.approvedWeight || 0}% / 50%
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                            <span style={{ color: '#94a3b8' }}>Phương án: </span>
                            {linkedMaint.description || linkedMaint.title}
                          </div>

                          {/* ACTION: START REPAIR IF APPROVED */}
                          {(linkedMaint.status === 'APPROVED' || linkedMaint.status === 'SCHEDULED') && (
                            <button
                              type="button"
                              onClick={() => handleStartRepair(linkedMaint.id)}
                              disabled={isStartingRepair === linkedMaint.id}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                marginTop: '2px',
                              }}
                            >
                              <Wrench size={13} />
                              <span>{isStartingRepair === linkedMaint.id ? 'ĐANG KHỞI ĐỘNG...' : 'THỰC HIỆN SỬA CHỮA'}</span>
                            </button>
                          )}

                          {/* ACTION: COMPLETE REPAIR IF IN PROGRESS */}
                          {linkedMaint.status === 'IN_PROGRESS' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                              {completingMaintId === linkedMaint.id ? (
                                <div
                                  style={{
                                    padding: '8px',
                                    borderRadius: '6px',
                                    background: 'rgba(0, 0, 0, 0.35)',
                                    border: '1px solid rgba(0, 242, 254, 0.3)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                  }}
                                >
                                  <input
                                    type="text"
                                    placeholder="Chi phí thực tế (VND, ví dụ: 1200000)..."
                                    value={repairActualCost}
                                    onChange={(e) => setRepairActualCost(e.target.value)}
                                    style={{
                                      padding: '6px 8px',
                                      borderRadius: '6px',
                                      background: '#071426',
                                      color: '#ffffff',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      fontSize: '11px',
                                    }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Ghi chú nghiệm thu hoàn tất..."
                                    value={repairCompletionNote}
                                    onChange={(e) => setRepairCompletionNote(e.target.value)}
                                    style={{
                                      padding: '6px 8px',
                                      borderRadius: '6px',
                                      background: '#071426',
                                      color: '#ffffff',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      fontSize: '11px',
                                    }}
                                  />
                                  <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleCompleteRepair(linkedMaint.id)}
                                      disabled={isCompletingRepair}
                                      style={{
                                        flex: 1,
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        border: 'none',
                                        color: '#ffffff',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {isCompletingRepair ? 'ĐANG LƯU...' : 'XÁC NHẬN NGHIỆM THU'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCompletingMaintId(null)}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        color: '#cbd5e1',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setCompletingMaintId(linkedMaint.id)}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                  }}
                                >
                                  <CheckCircle2 size={13} />
                                  <span>HOÀN TẤT & NGHIỆM THU SỬA CHỮA</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* PREPARE REPAIR PROPOSAL FORM (If no proposal linked yet) */
                        <div style={{ marginTop: '2px' }}>
                          {isExpanded ? (
                            <div
                              style={{
                                padding: '10px',
                                borderRadius: '8px',
                                background: 'rgba(7, 20, 38, 0.8)',
                                border: '1px solid rgba(0, 242, 254, 0.25)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                              }}
                            >
                              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                                LẬP PHƯƠNG ÁN SỬA CHỮA CHO NHÓM ĐỒNG SỞ HỮU
                              </div>

                              <textarea
                                rows={2}
                                placeholder="Mô tả chi tiết phương án kỹ thuật, linh kiện cần thay thế..."
                                value={proposalDesc[d.id] || ''}
                                onChange={(e) => setProposalDesc((prev) => ({ ...prev, [d.id]: e.target.value }))}
                                style={{
                                  padding: '8px',
                                  borderRadius: '6px',
                                  background: '#0b1c36',
                                  color: '#ffffff',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  fontSize: '11px',
                                  resize: 'none',
                                  fontFamily: 'inherit',
                                }}
                              />

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                  <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>Chi phí dự kiến (VND) *</div>
                                  <input
                                    type="text"
                                    placeholder="Ví dụ: 1500000"
                                    value={proposalCost[d.id] || ''}
                                    onChange={(e) => setProposalCost((prev) => ({ ...prev, [d.id]: e.target.value }))}
                                    style={{
                                      width: '100%',
                                      padding: '6px 8px',
                                      borderRadius: '6px',
                                      background: '#0b1c36',
                                      color: '#ffffff',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      fontSize: '11px',
                                      boxSizing: 'border-box',
                                    }}
                                  />
                                </div>

                                <div>
                                  <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>Mức độ ưu tiên</div>
                                  <select
                                    value={
                                      proposalPriority[d.id] ||
                                      (d.severity === 'SEVERE' || d.severity === 'HIGH' ? 'CRITICAL' : 'MEDIUM')
                                    }
                                    onChange={(e) =>
                                      setProposalPriority((prev) => ({
                                        ...prev,
                                        [d.id]: e.target.value as MaintenancePriority,
                                      }))
                                    }
                                    style={{
                                      width: '100%',
                                      padding: '6px 8px',
                                      borderRadius: '6px',
                                      background: '#0b1c36',
                                      color: '#ffffff',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      fontSize: '11px',
                                      boxSizing: 'border-box',
                                    }}
                                  >
                                    <option value="CRITICAL">Khẩn cấp (CRITICAL)</option>
                                    <option value="HIGH">Nghiêm trọng (HIGH)</option>
                                    <option value="MEDIUM">Trung bình (MEDIUM)</option>
                                    <option value="LOW">Thấp (LOW)</option>
                                  </select>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleSendRepairProposal(d)}
                                  disabled={isSubmittingProposal === d.id}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                  }}
                                >
                                  <Send size={12} />
                                  <span>{isSubmittingProposal === d.id ? 'ĐANG GỬI...' : 'GỬI ĐỀ XUẤT CHO NHÓM'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpandedDamageId(null)}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#cbd5e1',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Đóng
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenProposalForDamage(d)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                color: '#fbbf24',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <Send size={12} />
                              <span>LẬP & GỬI ĐỀ XUẤT SỬA CHỮA CHO NHÓM</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ----------------------------------------------------
                3. MODULE: BÀN GIAO XE (QUY TRÌNH 3 BƯỚC THỐNG NHẤT)
                ---------------------------------------------------- */}
            {activeModule === 'HANDOVER' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* A. Queue tabs when multiple handovers/bookings exist */}
                {activeHandovers.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      overflowX: 'auto',
                      paddingBottom: '4px',
                    }}
                  >
                    {activeHandovers.map((h, idx) => (
                      <button
                        key={h.bookingId || idx}
                        type="button"
                        onClick={() => {
                          setSelectedHandoverIndex(idx);
                          clearMessages();
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background:
                            idx === selectedHandoverIndex
                              ? 'rgba(0, 242, 254, 0.2)'
                              : 'rgba(255, 255, 255, 0.06)',
                          border:
                            idx === selectedHandoverIndex
                              ? '1px solid #00f2fe'
                              : '1px solid rgba(255, 255, 255, 0.1)',
                          color: idx === selectedHandoverIndex ? '#00f2fe' : '#94a3b8',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Clock size={12} />
                        <span>
                          #{idx + 1}: {formatTime(h.bookingStartTime)} ({h.coOwnerName || 'Đồng sở hữu'})
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* B. Loading & Error States */}
                {isLoadingHandovers && (
                  <div
                    style={{
                      background: 'rgba(15, 32, 60, 0.65)',
                      borderRadius: '12px',
                      padding: '24px',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px', color: '#00f2fe' }} />
                    Đang tải dữ liệu hồ sơ bàn giao...
                  </div>
                )}

                {!isLoadingHandovers && isHandoversError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      padding: '14px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ color: '#f87171', fontSize: '12px', fontWeight: 700 }}>
                      Không thể tải thông tin hồ sơ bàn giao
                    </div>
                    <button
                      type="button"
                      onClick={() => refetchHandovers()}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Thử lại
                    </button>
                  </div>
                )}

                {/* C. Empty State: No active handover */}
                {!isLoadingHandovers && !isHandoversError && !currentHandover && (
                  <div
                    style={{
                      background: 'rgba(15, 32, 60, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '24px 16px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                      }}
                    >
                      <Calendar size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                        KHÔNG CÓ LỊCH BÀN GIAO HIỆN TẠI
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px', maxWidth: '320px', lineHeight: 1.4 }}>
                        {eligibility?.message || 'Phương tiện hiện không có lượt đặt xe nào cần chuẩn bị hoặc tất cả các lịch đã hoàn tất bàn giao.'}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '6px',
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#cbd5e1',
                        display: 'flex',
                        gap: '12px',
                      }}
                    >
                      <span>Trạng thái xe: <strong style={{ color: statusMeta.color }}>{statusMeta.label}</strong></span>
                      <span>Pin: <strong style={{ color: '#00f2fe' }}>{vehicle.currentBatteryLevel ?? 0}%</strong></span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        refetchHandovers();
                        refetchEligibility();
                      }}
                      style={{
                        marginTop: '6px',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#38bdf8',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <RefreshCw size={12} />
                      <span>Kiểm tra lại lịch đặt</span>
                    </button>
                  </div>
                )}

                {/* D. UNIFIED 3-STEP WORKFLOW PRESENTATION */}
                {!isLoadingHandovers && currentHandover && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* 3-STEP NAVIGATION PILL HEADER */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '6px',
                        background: 'rgba(8, 18, 36, 0.85)',
                        padding: '4px',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 242, 254, 0.25)',
                      }}
                    >
                      {/* Step 1 Tab */}
                      <button
                        type="button"
                        onClick={() => {
                          clearMessages();
                          setHandoverWorkflowStep(1);
                          setVehicleInspectionMode(false);
                        }}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '8px',
                          background:
                            handoverWorkflowStep === 1
                              ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.35) 0%, rgba(2, 132, 199, 0.45) 100%)'
                              : 'rgba(255, 255, 255, 0.04)',
                          border: handoverWorkflowStep === 1 ? '1.2px solid #00f2fe' : '1px solid transparent',
                          color: handoverWorkflowStep === 1 ? '#00f2fe' : '#cbd5e1',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <FileText size={12} />
                        <span>1. HỒ SƠ</span>
                      </button>

                      {/* Step 2 Tab */}
                      <button
                        type="button"
                        onClick={() => {
                          clearMessages();
                          setHandoverWorkflowStep(2);
                          setVehicleInspectionMode(false);
                        }}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '8px',
                          background:
                            handoverWorkflowStep === 2
                              ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.35) 0%, rgba(2, 132, 199, 0.45) 100%)'
                              : 'rgba(255, 255, 255, 0.04)',
                          border: handoverWorkflowStep === 2 ? '1.2px solid #00f2fe' : '1px solid transparent',
                          color: handoverWorkflowStep === 2 ? '#00f2fe' : hasValidInspection ? '#34d399' : '#cbd5e1',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Wrench size={12} />
                        <span>2. TÌNH TRẠNG XE {hasValidInspection ? '✓' : ''}</span>
                      </button>

                      {/* Step 3 Tab */}
                      <button
                        type="button"
                        onClick={() => {
                          clearMessages();
                          setHandoverWorkflowStep(3);
                          setVehicleInspectionMode(false);
                        }}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '8px',
                          background:
                            handoverWorkflowStep === 3
                              ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.35) 0%, rgba(2, 132, 199, 0.45) 100%)'
                              : 'rgba(255, 255, 255, 0.04)',
                          border: handoverWorkflowStep === 3 ? '1.2px solid #00f2fe' : '1px solid transparent',
                          color: handoverWorkflowStep === 3 ? '#00f2fe' : '#cbd5e1',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Key size={12} />
                        <span>3. BÀN GIAO</span>
                      </button>
                    </div>

                    {/* ========================================================
                        STEP 1: HỒ SƠ ĐẶT XE & TRẠNG THÁI KIỂM TRA
                        ======================================================== */}
                    {handoverWorkflowStep === 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Booking & Recipient Card */}
                        <div
                          style={{
                            background: 'rgba(15, 32, 60, 0.75)',
                            border: '1.5px solid rgba(0, 242, 254, 0.35)',
                            borderRadius: '14px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FileText size={14} color="#00f2fe" />
                              <span style={{ fontSize: '11px', fontWeight: 900, color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                THÔNG TIN LỊCH ĐẶT XE
                              </span>
                            </div>
                            {(() => {
                              const stConfig =
                                VI_HANDOVER_STATUS_CONFIG[currentHandover.status] || {
                                  label: currentHandover.status,
                                  color: '#38bdf8',
                                  bg: 'rgba(56, 189, 248, 0.15)',
                                  border: 'rgba(56, 189, 248, 0.4)',
                                };
                              return (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    padding: '3px 8px',
                                    borderRadius: '9999px',
                                    background: stConfig.bg,
                                    color: stConfig.color,
                                    border: `1px solid ${stConfig.border}`,
                                    letterSpacing: '0.03em',
                                  }}
                                >
                                  {stConfig.label}
                                </span>
                              );
                            })()}
                          </div>

                          {/* Recipient Details */}
                          <div
                            style={{
                              background: 'rgba(11, 28, 54, 0.8)',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: 'rgba(0, 242, 254, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#00f2fe',
                                  }}
                                >
                                  <User size={14} />
                                </div>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                                    {currentHandover.coOwnerName || eligibility?.recipientName || 'Đồng sở hữu'}
                                  </div>
                                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                                    {currentHandover.coOwnerEmail || eligibility?.recipientEmail || 'Thành viên nhóm đồng sở hữu'}
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '9.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                                  Mã lịch đặt
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
                                  #{(currentHandover.bookingId || '').slice(0, 8).toUpperCase()}
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                marginTop: '2px',
                                paddingTop: '6px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'grid',
                                gridTemplateColumns: '1.2fr 0.8fr',
                                gap: '8px',
                                fontSize: '11px',
                              }}
                            >
                              <div>
                                <span style={{ color: '#94a3b8' }}>Phương tiện: </span>
                                <strong style={{ color: '#ffffff' }}>{displayName || vehicle.name}</strong>
                              </div>
                              <div>
                                <span style={{ color: '#94a3b8' }}>Biển số: </span>
                                <strong style={{ color: '#00f2fe' }}>{vehicle.licensePlate}</strong>
                              </div>
                            </div>

                            <div
                              style={{
                                paddingTop: '6px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '8px',
                                fontSize: '11px',
                              }}
                            >
                              <div>
                                <span style={{ color: '#94a3b8' }}>Ngày nhận: </span>
                                <strong style={{ color: '#ffffff' }}>
                                  {formatDate(currentHandover.bookingStartTime)}
                                </strong>
                              </div>
                              <div>
                                <span style={{ color: '#94a3b8' }}>Khung giờ: </span>
                                <strong style={{ color: '#00f2fe' }}>
                                  {formatTime(currentHandover.bookingStartTime)} – {formatTime(currentHandover.bookingEndTime)}
                                </strong>
                              </div>
                            </div>

                            {currentHandover.bookingPurpose && (
                              <div style={{ fontSize: '10.5px', color: '#94a3b8', fontStyle: 'italic', paddingTop: '2px' }}>
                                Mục đích: &ldquo;{currentHandover.bookingPurpose}&rdquo;
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Pre-Handover Technical Status Card */}
                        <div
                          style={{
                            background: 'rgba(15, 32, 60, 0.75)',
                            borderRadius: '14px',
                            padding: '14px',
                            border: '1.5px solid rgba(56, 189, 248, 0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Wrench size={14} color="#38bdf8" />
                              <span style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                TÌNH TRẠNG KIỂM TRA XE
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                background: hasValidInspection ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: hasValidInspection ? '#10b981' : '#f59e0b',
                                border: hasValidInspection ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                              }}
                            >
                              {hasValidInspection ? 'ĐÃ CÓ BIÊN BẢN HỢP LỆ' : 'CẦN KIỂM TRA TRƯỚC BÀN GIAO'}
                            </span>
                          </div>

                          <div
                            style={{
                              background: 'rgba(11, 28, 54, 0.8)',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              fontSize: '11px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            {latestCompletedInspection ? (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: hasValidInspection ? '#34d399' : (latestCompletedInspection.overallResult === 'FAIL' ? '#ef4444' : '#f59e0b') }}>
                                {hasValidInspection ? (
                                  <CheckCircle2 size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                                ) : (
                                  <AlertTriangle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                                )}
                                <div>
                                  <div>
                                    Biên bản kiểm tra gần nhất:{' '}
                                    <strong>
                                      {latestCompletedInspection.overallResult === 'FAIL'
                                        ? `KHÔNG ĐẠT (FAIL) (${latestCompletedInspection.items?.length || 0}/8 bộ phận)`
                                        : (latestCompletedInspection.items?.length || 0) < 8
                                          ? `CHƯA ĐỦ BỘ PHẬN (${latestCompletedInspection.items?.length || 0}/8 bộ phận)`
                                          : `Đạt chuẩn (${latestCompletedInspection.items?.length || 8}/8 bộ phận)`}
                                    </strong>
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                    Hoàn tất lúc {formatTime(latestCompletedInspection.completedAt)} ngày {formatDate(latestCompletedInspection.completedAt)}
                                    {latestCompletedInspection.inspectedBy?.fullName && ` • Bởi: ${latestCompletedInspection.inspectedBy.fullName}`}
                                  </div>
                                  {latestCompletedInspection.overallResult === 'FAIL' && (
                                    <div style={{ fontSize: '10px', color: '#f87171', marginTop: '2px', fontWeight: 700 }}>
                                      {latestCompletedInspection.summaryNote || 'Xe phát hiện khiếm khuyết không đạt chuẩn. Không thể bàn giao.'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                                <AlertTriangle size={14} />
                                <span>Chưa có biên bản kiểm tra đạt chuẩn gần đây. Vui lòng tiến hành kiểm tra xe.</span>
                              </div>
                            )}

                            <div style={{ paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {unresolvedDamages.length === 0 ? (
                                <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={12} /> 0 khiếm khuyết/hư hại chưa xử lý
                                </span>
                              ) : (
                                <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <AlertTriangle size={12} /> {unresolvedDamages.length} khiếm khuyết/hư hại kỹ thuật đang theo dõi
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Step 1 Actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                            {hasValidInspection ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    clearMessages();
                                    setHandoverWorkflowStep(3);
                                    setVehicleInspectionMode(false);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '11px 16px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontSize: '12.5px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                                  }}
                                >
                                  <Key size={15} />
                                  <span>TIẾP TỤC BÀN GIAO XE (BƯỚC 3)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    clearMessages();
                                    setHandoverWorkflowStep(2);
                                    setVehicleInspectionMode(false);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    background: 'rgba(0, 242, 254, 0.12)',
                                    border: '1px solid rgba(0, 242, 254, 0.35)',
                                    color: '#00f2fe',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                  }}
                                >
                                  <Wrench size={13} />
                                  <span>XEM TÌNH TRẠNG XE (BƯỚC 2)</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  clearMessages();
                                  setHandoverWorkflowStep(2);
                                  setVehicleInspectionMode(false);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '11px 16px',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                  border: '1px solid rgba(56, 189, 248, 0.5)',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                                }}
                              >
                                <Wrench size={14} />
                                <span>XEM TÌNH TRẠNG XE (BƯỚC 2)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ========================================================
                        STEP 2: TÌNH TRẠNG KỸ THUẬT XE (READ-ONLY)
                        ======================================================== */}
                    {handoverWorkflowStep === 2 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Status Alert Banner */}
                        {hasValidInspection ? (
                          <div
                            style={{
                              background: 'rgba(16, 185, 129, 0.12)',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CheckCircle2 size={16} color="#34d399" />
                              <div>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>
                                  BIÊN BẢN KIỂM TRA HỢP LỆ
                                </div>
                                <div style={{ fontSize: '9.5px', color: '#cbd5e1', marginTop: '1px' }}>
                                  8/8 bộ phận kỹ thuật đạt chuẩn an toàn vận hành
                                </div>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 800,
                                color: '#34d399',
                                background: 'rgba(16, 185, 129, 0.2)',
                                padding: '3px 8px',
                                borderRadius: '9999px',
                              }}
                            >
                              ĐẠT CHUẨN
                            </span>
                          </div>
                        ) : (
                          <div
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <AlertTriangle size={16} color="#f87171" />
                              <div>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#f87171' }}>
                                  CHƯA ĐỦ ĐIỀU KIỆN BÀN GIAO
                                </div>
                                <div style={{ fontSize: '9.5px', color: '#cbd5e1', marginTop: '1px' }}>
                                  Xe chưa có biên bản kiểm tra hợp lệ cho lần bàn giao này.
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                clearMessages();
                                setActiveModule('INSPECTION_3D');
                                setVehicleInspectionMode(true);
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '7px',
                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                border: '1px solid rgba(56, 189, 248, 0.5)',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                              }}
                            >
                              <Wrench size={13} />
                              <span>ĐI ĐẾN KIỂM TRA XE 3D</span>
                            </button>
                          </div>
                        )}

                        {/* SECTION 1: TÌNH TRẠNG KỸ THUẬT XE (Overview KPIs) */}
                        <div
                          style={{
                            background: 'rgba(15, 32, 60, 0.75)',
                            border: '1.2px solid rgba(0, 242, 254, 0.32)',
                            borderRadius: '12px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.28)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <ShieldCheck size={14} color="#00f2fe" />
                              <span style={{ fontSize: '11px', fontWeight: 900, color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                TÌNH TRẠNG KỸ THUẬT XE
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                background: (eligibility?.isEligible || eligibility?.eligible) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: (eligibility?.isEligible || eligibility?.eligible) ? '#34d399' : '#f87171',
                                border: (eligibility?.isEligible || eligibility?.eligible) ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                              }}
                            >
                              {(eligibility?.isEligible || eligibility?.eligible) ? 'ĐỦ ĐIỀU KIỆN' : 'CHƯA ĐỦ ĐIỀU KIỆN'}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {/* Inspection Date */}
                            <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Ngày kiểm tra</div>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                                {latestCompletedInspection?.completedAt
                                  ? formatDateTime(latestCompletedInspection.completedAt)
                                  : activeInspection?.completedAt
                                  ? formatDateTime(activeInspection.completedAt)
                                  : 'Chưa có biên bản'}
                              </div>
                            </div>

                            {/* Inspection Result */}
                            <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Kết quả kiểm tra</div>
                              <div style={{ fontSize: '11px', fontWeight: 800, marginTop: '2px', color: hasValidInspection ? '#34d399' : latestCompletedInspection?.overallResult === 'FAIL' ? '#f87171' : '#f59e0b' }}>
                                {hasValidInspection
                                  ? 'ĐẠT TIÊU CHUẨN'
                                  : latestCompletedInspection?.overallResult === 'PASS_WITH_NOTES'
                                  ? 'ĐẠT (CÓ LƯU Ý)'
                                  : latestCompletedInspection?.overallResult === 'FAIL'
                                  ? 'KHÔNG ĐẠT'
                                  : 'CHƯA HOÀN TẤT'}
                              </div>
                            </div>

                            {/* Checkpoint Coverage */}
                            <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Độ bao phủ bộ phận</div>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                                <strong style={{ color: completedRequiredCount >= 8 ? '#34d399' : '#00f2fe' }}>
                                  {completedRequiredCount}
                                </strong>
                                /8 bộ phận bắt buộc
                                <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 400, marginLeft: '4px' }}>
                                  (Tổng: {completedUniqueCount}/{totalAvailablePartsCount})
                                </span>
                              </div>
                            </div>

                            {/* Battery Snapshot */}
                            <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Mức pin hiện tại</div>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                                {eligibility?.batteryLevelFormatted || (vehicle.batteryLevel != null ? `${vehicle.batteryLevel}%` : 'N/A')}
                              </div>
                            </div>

                            {/* Odometer */}
                            <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Chỉ số ODO</div>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                                {(eligibility?.odometer ?? vehicle.odometer ?? 0).toLocaleString('vi-VN')} km
                              </div>
                            </div>

                            {/* Unresolved Damages Count */}
                            <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Hư hỏng chưa khắc phục</div>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: unresolvedDamages.length > 0 ? '#fbbf24' : '#34d399', marginTop: '2px' }}>
                                {unresolvedDamages.length} lỗi ghi nhận
                              </div>
                            </div>
                          </div>

                          {/* Ineligible reason notice if present */}
                          {eligibility?.ineligibleReason && !eligibility?.isEligible && !eligibility?.eligible && (
                            <div
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '6px',
                                padding: '6px 9px',
                                fontSize: '10px',
                                color: '#f87171',
                              }}
                            >
                              <strong>Lý do chưa đủ điều kiện:</strong>{' '}
                              {VI_ELIGIBILITY_REASON_CONFIG[eligibility.ineligibleReason]?.desc ||
                                VI_ELIGIBILITY_REASON_CONFIG[eligibility.ineligibleReason]?.label ||
                                eligibility.ineligibleReason}
                            </div>
                          )}
                        </div>

                        {/* SECTION 2: DANH SÁCH BỘ PHẬN BẮT BUỘC (Persisted Component Conditions) */}
                        <div
                          style={{
                            background: 'rgba(15, 32, 60, 0.75)',
                            border: '1.2px solid rgba(0, 242, 254, 0.32)',
                            borderRadius: '12px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.28)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Sliders size={14} color="#00f2fe" />
                              <span style={{ fontSize: '11px', fontWeight: 900, color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                TIÊU CHUẨN BẮT BUỘC BÀN GIAO ({completedRequiredCount}/8)
                              </span>
                            </div>
                            <span style={{ fontSize: '9px', color: '#64748b' }}>
                              {latestCompletedInspection?.id ? `Biên bản #${latestCompletedInspection.id.slice(0, 6)}` : 'Đồng bộ từ biên bản'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {MANDATORY_HANDOVER_CHECKPOINTS.map((part) => {
                              const canonicalId = normalizeCanonicalPartCode(part.id);
                              const assessed = latestCompletedInspection?.items?.find(
                                (i) => normalizeCanonicalPartCode(i.vehiclePartCode) === canonicalId
                              );

                              let statusLabel = 'CHƯA KIỂM TRA';
                              let statusColor = '#94a3b8';
                              let statusBg = 'rgba(148, 163, 184, 0.12)';
                              let statusBorder = 'rgba(148, 163, 184, 0.3)';

                              if (assessed) {
                                switch (assessed.conditionStatus) {
                                  case 'GOOD':
                                    statusLabel = 'TỐT';
                                    statusColor = '#34d399';
                                    statusBg = 'rgba(16, 185, 129, 0.15)';
                                    statusBorder = 'rgba(16, 185, 129, 0.4)';
                                    break;
                                  case 'SCRATCH':
                                    statusLabel = 'TRẦY';
                                    statusColor = '#fbbf24';
                                    statusBg = 'rgba(245, 158, 11, 0.15)';
                                    statusBorder = 'rgba(245, 158, 11, 0.4)';
                                    break;
                                  case 'DENT':
                                    statusLabel = 'MÓP';
                                    statusColor = '#f97316';
                                    statusBg = 'rgba(249, 115, 22, 0.15)';
                                    statusBorder = 'rgba(249, 115, 22, 0.4)';
                                    break;
                                  case 'CRACK':
                                    statusLabel = 'NỨT';
                                    statusColor = '#f87171';
                                    statusBg = 'rgba(239, 68, 68, 0.15)';
                                    statusBorder = 'rgba(239, 68, 68, 0.4)';
                                    break;
                                  default:
                                    statusLabel = 'HƯ HỎNG';
                                    statusColor = '#f87171';
                                    statusBg = 'rgba(239, 68, 68, 0.15)';
                                    statusBorder = 'rgba(239, 68, 68, 0.4)';
                                    break;
                                }
                              }

                              const partDamage = unresolvedDamages.find(
                                (d: any) => normalizeCanonicalPartCode(d.vehiclePartCode || d.partCode) === canonicalId
                              );

                              return (
                                <div
                                  key={part.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '6px 9px',
                                    borderRadius: '7px',
                                    background: 'rgba(8, 14, 26, 0.6)',
                                    border: partDamage ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <span>{part.label}</span>
                                      {partDamage && (
                                        <span style={{ fontSize: '8.5px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '1px 4px', borderRadius: '3px' }}>
                                          ⚠️ {partDamage.severity}
                                        </span>
                                      )}
                                    </div>
                                    {assessed?.note && (
                                      <div style={{ fontSize: '9px', color: '#94a3b8', fontStyle: 'italic', marginTop: '1px' }}>
                                        {assessed.note}
                                      </div>
                                    )}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      fontWeight: 800,
                                      padding: '2px 7px',
                                      borderRadius: '4px',
                                      background: statusBg,
                                      color: statusColor,
                                      border: `1px solid ${statusBorder}`,
                                      letterSpacing: '0.02em',
                                    }}
                                  >
                                    {statusLabel}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Extra assessed parts if any */}
                          {latestCompletedInspection?.items && latestCompletedInspection.items.filter(
                            (i) => !MANDATORY_HANDOVER_CHECKPOINTS.some(
                              (m) => normalizeCanonicalPartCode(m.id) === normalizeCanonicalPartCode(i.vehiclePartCode)
                            )
                          ).length > 0 && (
                            <div style={{ marginTop: '6px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '6px' }}>
                              <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                                HẠNG MỤC ĐÁNH GIÁ MỞ RỘNG ({latestCompletedInspection.items.filter(
                                  (i) => !MANDATORY_HANDOVER_CHECKPOINTS.some(
                                    (m) => normalizeCanonicalPartCode(m.id) === normalizeCanonicalPartCode(i.vehiclePartCode)
                                  )
                                ).length})
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {latestCompletedInspection.items
                                  .filter(
                                    (i) => !MANDATORY_HANDOVER_CHECKPOINTS.some(
                                      (m) => normalizeCanonicalPartCode(m.id) === normalizeCanonicalPartCode(i.vehiclePartCode)
                                    )
                                  )
                                  .map((extraItem) => {
                                    const partName = SEMANTIC_PART_LABELS_VI[extraItem.vehiclePartCode as VehiclePartId] || extraItem.vehiclePartCode;
                                    return (
                                      <span
                                        key={extraItem.id || extraItem.vehiclePartCode}
                                        style={{
                                          fontSize: '8.5px',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          background: extraItem.conditionStatus === 'GOOD' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                          color: extraItem.conditionStatus === 'GOOD' ? '#34d399' : '#fbbf24',
                                          border: `1px solid ${extraItem.conditionStatus === 'GOOD' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                        }}
                                      >
                                        {partName}: {extraItem.conditionStatus === 'GOOD' ? 'TỐT' : extraItem.conditionStatus}
                                      </span>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* SECTION 3: HƯ HỎNG CHƯA KHẮC PHỤC (Unresolved Damages) */}
                        <div
                          style={{
                            background: 'rgba(15, 32, 60, 0.75)',
                            border: '1.2px solid rgba(0, 242, 254, 0.32)',
                            borderRadius: '12px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.28)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertTriangle size={14} color={unresolvedDamages.length > 0 ? '#fbbf24' : '#34d399'} />
                              <span style={{ fontSize: '11px', fontWeight: 900, color: unresolvedDamages.length > 0 ? '#fbbf24' : '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                HƯ HỎNG CHƯA KHẮC PHỤC ({unresolvedDamages.length})
                              </span>
                            </div>
                            <span style={{ fontSize: '9px', color: '#64748b' }}>Hồ sơ kỹ thuật</span>
                          </div>

                          {unresolvedDamages.length === 0 ? (
                            <div
                              style={{
                                padding: '12px',
                                textAlign: 'center',
                                borderRadius: '8px',
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                color: '#34d399',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <CheckCircle2 size={13} color="#34d399" />
                              <span>Không có hư hỏng chưa khắc phục được ghi nhận.</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {unresolvedDamages.map((dmg: any) => {
                                const canonical = normalizeCanonicalPartCode(dmg.vehiclePartCode || dmg.partCode);
                                const partName = SEMANTIC_PART_LABELS_VI[canonical as VehiclePartId] || dmg.vehiclePartCode || dmg.partCode || 'Bộ phận';
                                const typeLabel = VI_DAMAGE_TYPE_LABELS[dmg.damageType] || dmg.damageType || 'Khác';
                                const sevMeta = VI_SEVERITY_CONFIG[dmg.severity] || { label: dmg.severity || 'Nhẹ', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
                                const stMeta = VI_DAMAGE_STATUS_CONFIG[dmg.status] || { label: dmg.status || 'Chưa xử lý', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };

                                return (
                                  <div
                                    key={dmg.id}
                                    style={{
                                      padding: '7px 9px',
                                      borderRadius: '7px',
                                      background: 'rgba(8, 14, 26, 0.7)',
                                      borderLeft: `3px solid ${sevMeta.color}`,
                                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                      borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '3px',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>
                                        {partName}: <span style={{ color: sevMeta.color }}>{typeLabel}</span>
                                      </div>
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        <span
                                          style={{
                                            fontSize: '8.5px',
                                            fontWeight: 800,
                                            padding: '1px 5px',
                                            borderRadius: '3px',
                                            background: sevMeta.bg,
                                            color: sevMeta.color,
                                          }}
                                        >
                                          {sevMeta.label}
                                        </span>
                                        <span
                                          style={{
                                            fontSize: '8.5px',
                                            fontWeight: 700,
                                            padding: '1px 5px',
                                            borderRadius: '3px',
                                            background: stMeta.bg,
                                            color: stMeta.color,
                                          }}
                                        >
                                          {stMeta.label}
                                        </span>
                                      </div>
                                    </div>
                                    <div style={{ fontSize: '9.5px', color: '#cbd5e1' }}>
                                      {dmg.description || dmg.note || 'Không có mô tả chi tiết'}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>


                        {/* SECTION 4: STEP 2 BOTTOM ACTIONS */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '8px', marginTop: '2px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              clearMessages();
                              setHandoverWorkflowStep(1);
                              setVehicleInspectionMode(false);
                            }}
                            style={{
                              height: '38px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.18)',
                              color: '#cbd5e1',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <ChevronLeft size={13} />
                            <span>QUAY LẠI HỒ SƠ</span>
                          </button>

                          {hasValidInspection ? (
                            <button
                              type="button"
                              onClick={() => {
                                clearMessages();
                                setHandoverWorkflowStep(3);
                                setVehicleInspectionMode(false);
                              }}
                              style={{
                                height: '38px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                              }}
                            >
                              <span>TIẾP TỤC BÀN GIAO</span>
                              <ChevronRight size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                clearMessages();
                                setActiveModule('INSPECTION_3D');
                                setVehicleInspectionMode(true);
                              }}
                              style={{
                                height: '38px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                border: '1px solid rgba(56, 189, 248, 0.5)',
                                color: '#ffffff',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                              }}
                            >
                              <Wrench size={13} />
                              <span>ĐI ĐẾN KIỂM TRA XE 3D</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ========================================================
                        STEP 3: XÁC NHẬN BÀN GIAO XE (HANDOVER CONFIRMATION)
                        ======================================================== */}
                    {handoverWorkflowStep === 3 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Handover Summary & Validation Details */}
                        <div
                          style={{
                            background: 'rgba(15, 32, 60, 0.75)',
                            borderRadius: '14px',
                            padding: '14px',
                            border: '1.5px solid rgba(16, 185, 129, 0.35)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Key size={14} color="#10b981" />
                              <span style={{ fontSize: '11px', fontWeight: 900, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                XÁC NHẬN BÀN GIAO XE
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                background: hasValidInspection ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: hasValidInspection ? '#10b981' : '#f59e0b',
                                border: hasValidInspection ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                              }}
                            >
                              {hasValidInspection ? 'ĐẠT CHUẨN BÀN GIAO' : 'CHƯA ĐỦ ĐIỀU KIỆN'}
                            </span>
                          </div>

                          {/* Recipient & Schedule Snapshot */}
                          <div
                            style={{
                              background: 'rgba(11, 28, 54, 0.8)',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              fontSize: '11px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div>
                                <span style={{ color: '#94a3b8' }}>Người nhận: </span>
                                <strong style={{ color: '#ffffff' }}>{currentHandover.coOwnerName || eligibility?.recipientName || 'Đồng sở hữu'}</strong>
                              </div>
                              <div>
                                <span style={{ color: '#94a3b8' }}>Biển số: </span>
                                <strong style={{ color: '#00f2fe' }}>{vehicle.licensePlate}</strong>
                              </div>
                            </div>
                            <div>
                              <span style={{ color: '#94a3b8' }}>Thời gian: </span>
                              <strong style={{ color: '#00f2fe' }}>
                                {formatTime(currentHandover.bookingStartTime)} – {formatTime(currentHandover.bookingEndTime)} ({formatDate(currentHandover.bookingStartTime)})
                              </strong>
                            </div>
                          </div>

                          {/* Battery & Odometer Snapshot */}
                          <div
                            style={{
                              background: 'rgba(11, 28, 54, 0.8)',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '8px',
                              fontSize: '11px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Battery size={14} color={(vehicle.currentBatteryLevel ?? 0) >= 20 ? '#10b981' : '#f87171'} />
                              <span>
                                Pin snapshot: <strong style={{ color: (vehicle.currentBatteryLevel ?? 0) >= 20 ? '#34d399' : '#f87171' }}>{vehicle.currentBatteryLevel ?? 0}%</strong>
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Gauge size={14} color="#38bdf8" />
                              <span>
                                Odometer: <strong style={{ color: '#ffffff' }}>{(vehicle.odometer ?? 0).toLocaleString()} km</strong>
                              </span>
                            </div>
                          </div>

                          {/* Inspection Validity Snapshot */}
                          <div
                            style={{
                              background: 'rgba(11, 28, 54, 0.8)',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              fontSize: '11px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            {latestCompletedInspection ? (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: hasValidInspection ? '#34d399' : (latestCompletedInspection.overallResult === 'FAIL' ? '#ef4444' : '#f59e0b') }}>
                                {hasValidInspection ? (
                                  <CheckCircle2 size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                                ) : (
                                  <AlertTriangle size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                                )}
                                <div>
                                  <div>
                                    Biên bản kiểm tra kỹ thuật:{' '}
                                    <strong>
                                      {latestCompletedInspection.overallResult === 'FAIL'
                                        ? `KHÔNG ĐẠT (FAIL) (${latestCompletedInspection.items?.length || 0}/8 bộ phận)`
                                        : (latestCompletedInspection.items?.length || 0) < 8
                                          ? `CHƯA ĐỦ BỘ PHẬN (${latestCompletedInspection.items?.length || 0}/8 bộ phận)`
                                          : `ĐẠT CHUẨN (${latestCompletedInspection.items?.length || 8}/8 bộ phận)`}
                                    </strong>
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                    Lúc {formatTime(latestCompletedInspection.completedAt)} ngày {formatDate(latestCompletedInspection.completedAt)}
                                    {latestCompletedInspection.inspectedBy?.fullName && ` • Bởi: ${latestCompletedInspection.inspectedBy.fullName}`}
                                  </div>
                                  {latestCompletedInspection.overallResult === 'FAIL' && (
                                    <div style={{ fontSize: '10px', color: '#f87171', marginTop: '2px', fontWeight: 700 }}>
                                      {latestCompletedInspection.summaryNote || 'Xe phát hiện lỗi kỹ thuật không đạt chuẩn bàn giao.'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                                <AlertTriangle size={13} />
                                <span>Chưa có biên bản kiểm tra đạt chuẩn</span>
                              </div>
                            )}

                            <div style={{ paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                              {unresolvedDamages.length === 0 ? (
                                <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={12} /> 0 khiếm khuyết hư hại (Đạt chuẩn giao xe an toàn)
                                </span>
                              ) : (
                                <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <AlertTriangle size={12} /> {unresolvedDamages.length} khiếm khuyết được lưu ý trong biên bản bàn giao
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Required Checklist */}
                          <div
                            style={{
                              background: 'rgba(11, 28, 54, 0.8)',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              fontSize: '11px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#cbd5e1' }}>
                              <input
                                type="checkbox"
                                checked={checklistItems.batteryOdo}
                                onChange={(e) => setChecklistItems((p) => ({ ...p, batteryOdo: e.target.checked }))}
                                style={{ accentColor: '#00f2fe' }}
                              />
                              <span>Pin đủ điều kiện (&ge; 20%) và đồng hồ km đã ghi nhận snapshot</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#cbd5e1' }}>
                              <input
                                type="checkbox"
                                checked={checklistItems.documents}
                                onChange={(e) => setChecklistItems((p) => ({ ...p, documents: e.target.checked }))}
                                style={{ accentColor: '#00f2fe' }}
                              />
                              <span>Giấy tờ xe và thông tin người nhận đã đối chiếu chính xác</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#cbd5e1' }}>
                              <input
                                type="checkbox"
                                checked={checklistItems.keysSafety}
                                onChange={(e) => setChecklistItems((p) => ({ ...p, keysSafety: e.target.checked }))}
                                style={{ accentColor: '#00f2fe' }}
                              />
                              <span>Chìa khóa xe thực tế và thẻ từ đã sẵn sàng bàn giao</span>
                            </label>
                          </div>

                          {/* Handover Note */}
                          <div>
                            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '4px' }}>
                              Ghi chú biên bản bàn giao xe:
                            </div>
                            <input
                              type="text"
                              value={handoverNote}
                              onChange={(e) => setHandoverNote(e.target.value)}
                              placeholder="Ghi chú thêm về chìa khóa, phụ kiện hoặc tình trạng xe..."
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                background: '#0b1c36',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                fontSize: '11px',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>

                          {/* Handover Status Action */}
                          {currentHandover.status === 'HANDED_OVER' ? (
                            <div
                              style={{
                                background: 'rgba(168, 85, 247, 0.15)',
                                border: '1.5px solid rgba(168, 85, 247, 0.4)',
                                borderRadius: '10px',
                                padding: '12px',
                                textAlign: 'center',
                              }}
                            >
                              <div style={{ fontSize: '12px', fontWeight: 900, color: '#c084fc', textTransform: 'uppercase' }}>
                                XE ĐÃ BÀN GIAO — CHỜ ĐỒNG SỞ HỮU XÁC NHẬN TRÊN APP
                              </div>
                              <div style={{ fontSize: '11px', color: '#e9d5ff', marginTop: '4px', lineHeight: 1.4 }}>
                                Nhân viên đã hoàn tất giao xe. Đồng sở hữu cần nhấn &ldquo;Xác nhận nhận xe&rdquo; trên ứng dụng để bắt đầu hành trình.
                              </div>
                            </div>
                          ) : currentHandover.status === 'OWNER_CONFIRMED' || currentHandover.status === 'COMPLETED' ? (
                            <div
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                                borderRadius: '10px',
                                padding: '12px',
                                textAlign: 'center',
                              }}
                            >
                              <div style={{ fontSize: '12px', fontWeight: 900, color: '#34d399', textTransform: 'uppercase' }}>
                                {activeTrip?.status === 'ACTIVE' || currentHandover.tripStatus === 'ACTIVE'
                                  ? 'BÀN GIAO HOÀN TẤT — CHUYẾN ĐI ĐANG DIỄN RA'
                                  : 'BÀN GIAO HOÀN TẤT — ĐỒNG SỞ HỮU ĐÃ NHẬN XE'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#a7f3d0', marginTop: '4px', lineHeight: 1.4 }}>
                                {activeTrip?.status === 'ACTIVE' || currentHandover.tripStatus === 'ACTIVE'
                                  ? 'Phương tiện đang trong hành trình của đồng sở hữu. Chuyển sang module "Trả xe" khi khách quay lại.'
                                  : 'Đồng sở hữu đã tiếp nhận xe thành công. Đang chờ đồng sở hữu bắt đầu chuyến đi trên ứng dụng.'}
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={handleConfirmHandover}
                                disabled={isProcessingHandover || !hasValidInspection || !checklistItems.keysSafety || !checklistItems.documents}
                                style={{
                                  width: '100%',
                                  padding: '11px 16px',
                                  borderRadius: '8px',
                                  background:
                                    isProcessingHandover || !hasValidInspection || !checklistItems.keysSafety || !checklistItems.documents
                                      ? 'rgba(100, 116, 139, 0.3)'
                                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  border: 'none',
                                  color: '#ffffff',
                                  fontSize: '12.5px',
                                  fontWeight: 900,
                                  cursor:
                                    isProcessingHandover || !checklistItems.keysSafety || !checklistItems.documents
                                      ? 'not-allowed'
                                      : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                                }}
                              >
                                <Key size={15} />
                                <span>{isProcessingHandover ? 'ĐANG GIAO XE...' : 'XÁC NHẬN BÀN GIAO XE CHO ĐỒNG SỞ HỮU'}</span>
                              </button>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8', textAlign: 'center' }}>
                                Xác nhận trao chìa khóa thực tế cho {currentHandover.coOwnerName || 'đồng sở hữu'}.
                              </div>
                              {!hasValidInspection && (
                                <div style={{ fontSize: '10.5px', color: '#f87171', textAlign: 'center', fontWeight: 600 }}>
                                  Xe chưa có biên bản kiểm tra đạt chuẩn (FAIL hoặc chưa đủ 8 bộ phận). Vui lòng hoàn tất kiểm tra ở Bước 2 trước khi giao xe.
                                </div>
                              )}
                            </div>
                          )}

                          {/* Return to Inspection step button */}
                          <button
                            type="button"
                            onClick={() => {
                              clearMessages();
                              setHandoverWorkflowStep(2);
                              setVehicleInspectionMode(true);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#94a3b8',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <Wrench size={12} />
                            <span>QUAY LẠI BƯỚC KIỂM TRA 3D</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                4. MODULE: TRẢ XE (ODOMETER-BASED RETURN FORM)
                ---------------------------------------------------- */}
            {activeModule === 'RETURN' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {activeTrip ? (
                  <div
                    style={{
                      background: 'rgba(15, 32, 60, 0.75)',
                      border: '1px solid rgba(0, 242, 254, 0.35)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                      borderRadius: '14px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Header & Status Banner */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.04em' }}>
                        TIẾP NHẬN TRẢ XE & CHỐT ODOMETER
                      </span>
                      {activeTrip.returnRequestedAt ? (
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            color: '#fbbf24',
                            background: 'rgba(245, 158, 11, 0.2)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Clock size={11} color="#fbbf24" />
                          KHÁCH YÊU CẦU TRẢ XE
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            color: '#00f2fe',
                            background: 'rgba(0, 242, 254, 0.15)',
                            border: '1px solid rgba(0, 242, 254, 0.3)',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                          }}
                        >
                          ĐANG LĂN BÁNH
                        </span>
                      )}
                    </div>

                    {/* Active Trip & Handover Snapshot Information */}
                    <div
                      style={{
                        background: 'rgba(7, 20, 38, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '11px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                        <strong style={{ color: '#ffffff' }}>
                          {resolveVehicleDisplayName(vehicle)} ({vehicle.licensePlate || 'N/A'})
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Đồng sở hữu:</span>
                        <strong style={{ color: '#38bdf8' }}>
                          {activeTrip.userName || 'Đồng sở hữu'}
                        </strong>
                      </div>
                      {activeTrip.bookingId && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Mã lịch đặt (Ref):</span>
                          <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>
                            #{activeTrip.bookingId.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Thời điểm bàn giao:</span>
                        <span style={{ color: '#f8fafc' }}>
                          {formatDateTime(activeTrip.startedAt)}
                        </span>
                      </div>
                      {activeTrip.returnRequestedAt && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Thời điểm yêu cầu trả:</span>
                          <span style={{ color: '#fbbf24' }}>
                            {formatDateTime(activeTrip.returnRequestedAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Read-Only Start Snapshots */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div
                        style={{
                          background: 'rgba(7, 20, 38, 0.65)',
                          border: '1px solid rgba(0, 242, 254, 0.2)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                      >
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>ODO khi xuất phát:</span>
                        <strong style={{ fontSize: '13px', color: '#38bdf8' }}>
                          {activeTrip.startOdometer != null
                            ? `${Number(activeTrip.startOdometer).toLocaleString('vi-VN')} km`
                            : '-- km'}
                        </strong>
                      </div>
                      <div
                        style={{
                          background: 'rgba(7, 20, 38, 0.65)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                      >
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Pin khi xuất phát:</span>
                        <strong style={{ fontSize: '13px', color: '#34d399' }}>
                          {activeTrip.startBatteryLevel != null
                            ? `${activeTrip.startBatteryLevel}%`
                            : '--%'}
                        </strong>
                      </div>
                    </div>

                    {/* Mandatory Form Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* End Odometer Input */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label
                          htmlFor="return-end-odometer"
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#00f2fe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>ODO KHI NHẬN LẠI XE (KM) *</span>
                          {(() => {
                            const startOdoNum =
                              activeTrip.startOdometer != null
                                ? Number(activeTrip.startOdometer)
                                : 0;
                            const endOdoNum = parseFloat(returnEndOdometer);
                            if (!isNaN(endOdoNum) && endOdoNum >= startOdoNum) {
                              const dist = endOdoNum - startOdoNum;
                              return (
                                <span style={{ color: '#34d399', fontSize: '10.5px' }}>
                                  + {dist.toFixed(1)} km
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </label>
                        <input
                          id="return-end-odometer"
                          type="number"
                          step="0.1"
                          min={activeTrip.startOdometer != null ? Number(activeTrip.startOdometer) : 0}
                          placeholder={`Nhập số ODO thực tế (>= ${activeTrip.startOdometer ?? 0})`}
                          value={returnEndOdometer}
                          onChange={(e) => {
                            setReturnEndOdometer(e.target.value);
                            setReturnFormError(null);
                          }}
                          style={{
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: '#071426',
                            color: '#ffffff',
                            border: '1.2px solid rgba(0, 242, 254, 0.4)',
                            fontSize: '13px',
                            fontWeight: 700,
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* End Battery SOC Input */}
                      {(() => {
                        const startOdoNum = activeTrip.startOdometer != null ? Number(activeTrip.startOdometer) : 0;
                        const endOdoNum = parseFloat(returnEndOdometer);
                        const distNum = !isNaN(endOdoNum) && endOdoNum >= startOdoNum ? endOdoNum - startOdoNum : 0;
                        const consumptionPer100 = vehicle.energyConsumptionKwhPer100Km ?? (vehicle.name?.includes('EV02') ? 16.5 : 17.5);
                        const usableCapacity = vehicle.usableBatteryCapacityKwh ?? (vehicle.name?.includes('EV02') ? 60 : 65);
                        const modeledEnergyKwh = (distNum * consumptionPer100) / 100;
                        const modeledSocConsumed = usableCapacity > 0 ? (modeledEnergyKwh / usableCapacity) * 100 : 0;
                        const startSoc = activeTrip.startBatteryLevel ?? currentVehicle.currentBatteryLevel ?? 100;
                        const modeledEndSoc = Math.max(0, Math.round(startSoc - modeledSocConsumed));
                        const modeledCost = Math.round(modeledEnergyKwh * 3000);

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <label
                                htmlFor="return-end-battery"
                                style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}
                              >
                                PIN KHI NHẬN LẠI XE (%)
                              </label>
                              {distNum > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setReturnEndBattery(String(modeledEndSoc))}
                                  style={{
                                    background: 'rgba(0, 242, 254, 0.15)',
                                    border: '1px solid rgba(0, 242, 254, 0.4)',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: '#00f2fe',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Áp dụng mức pin tính toán theo quãng đường di chuyển thực tế"
                                >
                                  Áp dụng dự tính: ~{modeledEndSoc}%
                                </button>
                              )}
                            </div>
                            <input
                              id="return-end-battery"
                              type="number"
                              min="0"
                              max="100"
                              placeholder={`Mức pin 0 - 100% (Dự tính: ~${modeledEndSoc}%)`}
                              value={returnEndBattery}
                              onChange={(e) => {
                                setReturnEndBattery(e.target.value);
                                setReturnFormError(null);
                              }}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: '#071426',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                fontSize: '12px',
                                outline: 'none',
                              }}
                            />
                            {distNum > 0 && (
                              <div
                                style={{
                                  background: 'rgba(7, 20, 38, 0.65)',
                                  border: '1px solid rgba(0, 242, 254, 0.2)',
                                  borderRadius: '8px',
                                  padding: '6px 10px',
                                  fontSize: '10px',
                                  color: '#cbd5e1',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginTop: '2px',
                                }}
                              >
                                <span>Tiêu hao: <strong style={{ color: '#38bdf8' }}>{modeledEnergyKwh.toFixed(1)} kWh</strong> ({modeledSocConsumed.toFixed(1)}% pin)</span>
                                <span>Phí tạm tính: <strong style={{ color: '#34d399' }}>{modeledCost.toLocaleString('vi-VN')} đ</strong></span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Condition Note */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label
                          htmlFor="return-note"
                          style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}
                        >
                          GHI CHÚ TÌNH TRẠNG KHI NHẬN LẠI XE
                        </label>
                        <textarea
                          id="return-note"
                          placeholder="Ghi chú xác nhận tình trạng vỏ xe, nội thất hoặc lưu ý phát sinh..."
                          rows={2}
                          value={returnNote}
                          onChange={(e) => setReturnNote(e.target.value)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: '#071426',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            fontSize: '11px',
                            resize: 'none',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* Inline Form Validation Error */}
                    {returnFormError && (
                      <div
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          color: '#f87171',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <AlertTriangle size={14} color="#f87171" />
                        <span>{returnFormError}</span>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={handleConfirmReturn}
                      disabled={isConfirmingReturn}
                      style={{
                        padding: '11px 16px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: 900,
                        cursor: isConfirmingReturn ? 'not-allowed' : 'pointer',
                        opacity: isConfirmingReturn ? 0.6 : 1,
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      {isConfirmingReturn
                        ? 'ĐANG XỬ LÝ NHẬN XE...'
                        : 'XÁC NHẬN HOÀN TẤT NHẬN XE & CHỐT ODO'}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'rgba(15, 32, 60, 0.45)',
                      borderRadius: '12px',
                      padding: '20px 16px',
                      textAlign: 'center',
                      fontSize: '11.5px',
                      color: '#94a3b8',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <CheckCircle2 size={24} color="#64748b" />
                    <span>Phương tiện hiện không có chuyến đi đang hoạt động hoặc yêu cầu trả xe.</span>
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                5. MODULE: KIỂM TRA 3D (COMPACT REFINED UI)
                ---------------------------------------------------- */}
            {activeModule === 'INSPECTION_3D' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Session Initialization Error with Retry */}
                {sessionInitError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.45)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ color: '#f87171', fontSize: '10.5px', fontWeight: 600 }}>
                      {sessionInitError}
                    </div>
                    <button
                      type="button"
                      onClick={initInspectionSession}
                      style={{
                        padding: '4px 10px',
                        background: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      Thử lại
                    </button>
                  </div>
                )}

                {/* Session Loading Indicator */}
                {(isLoadingInspection || initializingSessionVehicleIdRef.current === vehicle.id) && !sessionInitError && (
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '10.5px',
                      color: '#38bdf8',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'pulse 1.5s infinite' }} />
                    <span>Đang kết nối phiên kiểm tra kỹ thuật...</span>
                  </div>
                )}

                {/* B. ACTIVE INSPECTION STATUS (Compact Single-Line) */}
                {activeInspection && activeInspection.status === 'IN_PROGRESS' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 11px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', letterSpacing: '0.04em' }}>
                        PHIÊN ĐANG HOẠT ĐỘNG
                      </span>
                      {activeInspection.id && (
                        <span style={{ fontSize: '9px', color: '#64748b' }}>
                          #{activeInspection.id.slice(0, 6)}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#cbd5e1' }}>
                      <strong style={{ color: '#00f2fe' }}>{uniqueAssessedCount}</strong>/{totalAvailablePartsCount} bộ phận{' '}
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>({requiredAssessedCount}/8 bắt buộc)</span>
                    </span>
                  </div>
                )}

                {/* COMPLETED INSPECTION VIEW (When no active session is in progress) */}
                {(!activeInspection || activeInspection.status !== 'IN_PROGRESS') && latestCompletedInspection && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      background: 'linear-gradient(135deg, rgba(15, 32, 60, 0.85) 0%, rgba(9, 21, 40, 0.95) 100%)',
                      border: '1.2px solid rgba(0, 242, 254, 0.35)',
                      borderRadius: '12px',
                      padding: '14px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} color="#10b981" />
                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          BIÊN BẢN KIỂM TRA ĐÃ HOÀN TẤT
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '5px',
                          background:
                            latestCompletedInspection.overallResult === 'PASS'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : latestCompletedInspection.overallResult === 'PASS_WITH_CONDITIONS'
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(239, 68, 68, 0.2)',
                          color:
                            latestCompletedInspection.overallResult === 'PASS'
                              ? '#34d399'
                              : latestCompletedInspection.overallResult === 'PASS_WITH_CONDITIONS'
                              ? '#fbbf24'
                              : '#f87171',
                          border: `1px solid ${
                            latestCompletedInspection.overallResult === 'PASS'
                              ? 'rgba(16, 185, 129, 0.4)'
                              : latestCompletedInspection.overallResult === 'PASS_WITH_CONDITIONS'
                              ? 'rgba(245, 158, 11, 0.4)'
                              : 'rgba(239, 68, 68, 0.4)'
                          }`,
                        }}
                      >
                        {latestCompletedInspection.overallResult === 'PASS'
                          ? 'ĐẠT TIÊU CHUẨN (PASS)'
                          : latestCompletedInspection.overallResult === 'PASS_WITH_CONDITIONS'
                          ? 'ĐẠT (CÓ LƯU Ý)'
                          : 'KHÔNG ĐẠT (FAIL)'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Tiêu chuẩn bắt buộc</div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: completedRequiredCount >= 8 ? '#34d399' : '#f87171', marginTop: '2px' }}>
                          {completedRequiredCount}/8 bộ phận
                        </div>
                      </div>
                      <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Tổng linh kiện đã khám</div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                          {completedUniqueCount}/{totalAvailablePartsCount} linh kiện
                        </div>
                      </div>
                      <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Hư hỏng chưa khắc phục</div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: unresolvedDamages.length > 0 ? '#fbbf24' : '#34d399', marginTop: '2px' }}>
                          {unresolvedDamages.length} lỗi
                        </div>
                      </div>
                      <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Thời điểm hoàn tất</div>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#cbd5e1', marginTop: '2px' }}>
                          {latestCompletedInspection.completedAt ? formatDateTime(latestCompletedInspection.completedAt) : 'Vừa xong'}
                        </div>
                      </div>
                    </div>

                    {/* Chips of inspected parts */}
                    {latestCompletedInspection.items && latestCompletedInspection.items.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                          Chi tiết các linh kiện đã kiểm định:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                          {latestCompletedInspection.items.map((item) => {
                            const isGood = item.conditionStatus === 'GOOD';
                            const condLabel = isGood ? 'TỐT' : item.conditionStatus === 'SCRATCH' ? 'TRẦY' : item.conditionStatus === 'DENT' ? 'MÓP' : 'NỨT';
                            const partName = SEMANTIC_PART_LABELS_VI[item.vehiclePartCode as VehiclePartId] || item.vehiclePartCode;
                            return (
                              <span
                                key={item.id || item.vehiclePartCode}
                                style={{
                                  fontSize: '9px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: isGood ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: isGood ? '#34d399' : '#f87171',
                                  border: `1px solid ${isGood ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                                }}
                              >
                                {partName}: {condLabel}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleStartNewInspection}
                      style={{
                        marginTop: '4px',
                        height: '38px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <RotateCcw size={13} color="#ffffff" />
                      <span>TẠO PHIÊN KIỂM TRA MỚI</span>
                    </button>
                  </div>
                )}

                {/* EMPTY STATE: No active session and no completed report */}
                {(!activeInspection || activeInspection.status !== 'IN_PROGRESS') && !latestCompletedInspection && !isLoadingInspection && (
                  <div
                    style={{
                      background: 'rgba(15, 32, 60, 0.75)',
                      border: '1.2px solid rgba(0, 242, 254, 0.32)',
                      borderRadius: '12px',
                      padding: '20px 16px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <Sliders size={28} color="#00f2fe" />
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                        Chưa có phiên kiểm tra đang hoạt động
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                        Khởi tạo phiên kiểm định 3D kỹ thuật để đánh giá tình trạng vỏ, lốp, pin và hệ thống xe.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartNewInspection}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={13} color="#ffffff" />
                      <span>BẮT ĐẦU KIỂM TRA 3D</span>
                    </button>
                  </div>
                )}

                {/* ACTIVE ASSESSMENT INTERFACE */}
                {activeInspection && activeInspection.status === 'IN_PROGRESS' && (
                  <>
                    {/* Existing Unresolved Damage Summary Indicator */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 11px',
                        borderRadius: '8px',
                        background: unresolvedDamages.length > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                        border: `1px solid ${unresolvedDamages.length > 0 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.25)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={12} color={unresolvedDamages.length > 0 ? '#f59e0b' : '#34d399'} />
                        <span style={{ fontSize: '10px', fontWeight: 800, color: unresolvedDamages.length > 0 ? '#fbbf24' : '#34d399', letterSpacing: '0.04em' }}>
                          HƯ HỎNG ĐÃ GHI NHẬN
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: unresolvedDamages.length > 0 ? '#fbbf24' : '#94a3b8' }}>
                        {unresolvedDamages.length} ghi nhận {unresolvedDamages.length > 0 ? 'chưa khắc phục' : ''}
                      </span>
                    </div>

                    {/* C-F. COMPONENT ASSESSMENT FORM */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        background: 'linear-gradient(135deg, rgba(15, 32, 60, 0.75) 0%, rgba(9, 21, 40, 0.85) 100%)',
                        border: '1.2px solid rgba(0, 242, 254, 0.32)',
                        borderRadius: '12px',
                        padding: '11px 12px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.28)',
                      }}
                    >
                      {/* C. Component Selection Dropdown */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label
                            htmlFor="inspection-part-select"
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              color: '#00f2fe',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <Sliders size={11} color="#00f2fe" />
                            CHỌN BỘ PHẬN KIỂM TRA
                          </label>
                          <span style={{ fontSize: '8.5px', color: '#64748b' }}>Hotspot 3D hoặc danh sách</span>
                        </div>
                        <select
                          id="inspection-part-select"
                          value={selectedPartKey}
                          onChange={(e) => {
                            const nextPart = e.target.value as VehiclePartId;
                            setSelectedPartKey(nextPart);
                            selectVehiclePart(nextPart);
                            selectVehiclePartCode(nextPart);
                          }}
                          disabled={activeInspection?.status !== 'IN_PROGRESS'}
                          style={{
                            width: '100%',
                            height: '36px',
                            padding: '0 10px',
                            borderRadius: '7px',
                            background: 'rgba(8, 14, 26, 0.85)',
                            border: '1px solid rgba(0, 242, 254, 0.35)',
                            color: '#ffffff',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {inspectionPartDropdownList.map((part) => {
                            const isAssessed = activeInspection?.items?.some((i) => i.vehiclePartCode === part.id);
                            const partUnresolvedCount = unresolvedDamages.filter(
                              (d: any) => normalizeCanonicalPartCode(d.vehiclePartCode || d.partCode) === normalizeCanonicalPartCode(part.id)
                            ).length;
                            return (
                              <option key={part.id} value={part.id} style={{ background: '#0a1628', color: '#ffffff' }}>
                                {part.label} {partUnresolvedCount > 0 ? `⚠️ (${partUnresolvedCount} lỗi)` : isAssessed ? '✓' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Existing Damage Alerts for Selected Component */}
                      {selectedComponentDamages.length > 0 && (
                        <div
                          style={{
                            background: 'rgba(245, 158, 11, 0.12)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            borderRadius: '8px',
                            padding: '7px 9px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9.5px', fontWeight: 800, color: '#fbbf24' }}>
                            <AlertTriangle size={11} color="#fbbf24" />
                            <span>HƯ HỎNG ĐÃ GHI NHẬN CHO BỘ PHẬN NÀY:</span>
                          </div>
                          {selectedComponentDamages.map((dmg: any) => {
                            const sevLabel = dmg.severity === 'SEVERE' ? 'Nghiêm trọng' : dmg.severity === 'MODERATE' ? 'Trung bình' : 'Mức độ thấp';
                            const typeLabel = DAMAGE_TYPE_LABELS[dmg.damageType as DamageType] || dmg.damageType || 'Khác';
                            return (
                              <div
                                key={dmg.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'baseline',
                                  justifyContent: 'space-between',
                                  fontSize: '10px',
                                  color: '#fef3c7',
                                  borderLeft: '2px solid #f59e0b',
                                  paddingLeft: '6px',
                                  margin: '2px 0',
                                }}
                              >
                                <div>
                                  <strong style={{ color: '#ffffff' }}>{typeLabel}</strong> — <span>{sevLabel}</span>
                                  {dmg.note && <div style={{ fontSize: '9px', color: '#cbd5e1', marginTop: '1px' }}>{dmg.note}</div>}
                                </div>
                                <span style={{ fontSize: '8.5px', color: '#94a3b8', flexShrink: 0, marginLeft: '6px' }}>
                                  {dmg.status || 'OPEN'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* D. Component Condition: 4 Horizontally Aligned Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            color: '#94a3b8',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          TÌNH TRẠNG KIỂM TRA HIỆN TẠI
                        </span>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '6px',
                          }}
                        >
                          {(
                            [
                              { id: 'GOOD', label: 'TỐT', color: '#10b981', border: '#10b981', bg: 'rgba(16, 185, 129, 0.25)' },
                              { id: 'SCRATCH', label: 'TRẦY', color: '#f59e0b', border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.25)' },
                              { id: 'DENT', label: 'MÓP', color: '#f97316', border: '#f97316', bg: 'rgba(249, 115, 22, 0.25)' },
                              { id: 'CRACK', label: 'NỨT', color: '#ef4444', border: '#ef4444', bg: 'rgba(239, 68, 68, 0.25)' },
                            ] as const
                          ).map((item) => {
                            const isSelected = partCondition === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setPartCondition(item.id)}
                                style={{
                                  height: '34px',
                                  padding: '0 4px',
                                  borderRadius: '7px',
                                  border: isSelected ? `1.5px solid ${item.border}` : '1px solid rgba(255, 255, 255, 0.12)',
                                  background: isSelected ? item.bg : 'rgba(8, 14, 26, 0.6)',
                                  color: isSelected ? item.color : '#94a3b8',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: isSelected ? `0 0 10px ${item.bg}` : 'none',
                                }}
                              >
                                <span>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* E. Assessment Notes Field */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label
                          htmlFor="part-note-input"
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            color: '#94a3b8',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          GHI CHÚ ĐÁNH GIÁ
                        </label>
                        <input
                          id="part-note-input"
                          type="text"
                          placeholder="Ghi chú chi tiết tình trạng..."
                          value={partNote}
                          onChange={(e) => setPartNote(e.target.value)}
                          style={{
                            width: '100%',
                            height: '36px',
                            padding: '0 10px',
                            borderRadius: '7px',
                            background: 'rgba(8, 14, 26, 0.85)',
                            border: '1px solid rgba(0, 242, 254, 0.28)',
                            color: '#ffffff',
                            fontSize: '11px',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* F. Save Assessment Button */}
                      <button
                        type="button"
                        disabled={isSavingPart}
                        onClick={handleSavePartInspection}
                        style={{
                          height: '38px',
                          borderRadius: '8px',
                          background: isSavingPart
                            ? 'rgba(100, 116, 139, 0.25)'
                            : 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          letterSpacing: '0.03em',
                          cursor: isSavingPart ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 3px 12px rgba(0, 242, 254, 0.22)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSavingPart ? (
                          <>
                            <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>ĐANG LƯU...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} color="#ffffff" />
                            <span>LƯU ĐÁNH GIÁ</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* G. SAVED ASSESSMENTS (Compact Chip List) */}
                    {activeInspection?.items && activeInspection.items.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px',
                          background: 'rgba(11, 28, 54, 0.5)',
                          borderRadius: '8px',
                          padding: '7px 9px',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
                            ĐÃ ĐÁNH GIÁ ({uniqueAssessedCount}/{totalAvailablePartsCount}) • Bắt buộc: {requiredAssessedCount}/8
                          </span>
                          <span style={{ fontSize: '8.5px', color: '#64748b' }}>Nhấp để chọn lại</span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            maxHeight: '74px',
                            overflowY: 'auto',
                          }}
                        >
                          {activeInspection.items.map((item) => {
                            const isGood = item.conditionStatus === 'GOOD';
                            const condLabel = isGood ? 'TỐT' : item.conditionStatus === 'SCRATCH' ? 'TRẦY' : item.conditionStatus === 'DENT' ? 'MÓP' : 'NỨT';
                            const isCurrent = selectedPartKey === item.vehiclePartCode;
                            const partName = SEMANTIC_PART_LABELS_VI[item.vehiclePartCode as VehiclePartId] || item.vehiclePartCode;
                            return (
                              <button
                                key={item.id || item.vehiclePartCode}
                                type="button"
                                onClick={() => {
                                  const partId = item.vehiclePartCode as VehiclePartId;
                                  setSelectedPartKey(partId);
                                  selectVehiclePart(partId);
                                  selectVehiclePartCode(partId);
                                }}
                                title={item.note || partName}
                                style={{
                                  fontSize: '8.5px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: isCurrent
                                    ? 'rgba(0, 242, 254, 0.22)'
                                    : isGood
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : 'rgba(239, 68, 68, 0.15)',
                                  color: isCurrent ? '#00f2fe' : isGood ? '#34d399' : '#f87171',
                                  border: isCurrent
                                    ? '1px solid #00f2fe'
                                    : `1px solid ${isGood ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  lineHeight: '1.3',
                                  transition: 'all 0.12s ease',
                                }}
                              >
                                <span>{partName}:</span>
                                <strong>{condLabel}</strong>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* H. FINAL ACTIONS */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                      <button
                        type="button"
                        onClick={handleStartNewInspection}
                        style={{
                          height: '36px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          color: '#cbd5e1',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        TẠO LẠI PHIÊN MỚI
                      </button>

                      <button
                        type="button"
                        onClick={handleCompleteInspection}
                        style={{
                          height: '36px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 3px 10px rgba(16, 185, 129, 0.22)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        HOÀN TẤT BIÊN BẢN
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                6. MODULE: LỊCH SỬ XE
                ---------------------------------------------------- */}
            {activeModule === 'HISTORY' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  Toàn bộ sự kiện vận hành gắn liền duy nhất với UUID: <code>{currentVehicle.id.slice(0, 8)}</code>
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
