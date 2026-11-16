import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VehicleResponse, VehicleStatus } from '../../types/vehicle';
import {
  resolveVehicleCode,
  resolveVehicleDisplayName,
  resolveVehicleSecondaryIdentifier,
} from '../three/vehicles/vehicleModelConfig';
import { STAFF_OPERATIONAL_MODULES, getStaffOperationalModule } from '../../config/staffOperationalConfig';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import { EVCarLoader } from '../common/EVCarLoader';
import {
  fetchHandoverEligibility,
  fetchActiveVehicleHandovers,
  fetchHandoverHistory,
  createHandoverApi,
  startHandoverApi,
  markHandoverReadyApi,
  confirmHandoverApi,
  recoverVehicleApi,
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
  VehicleInspectionItemResponse,
  InspectionItemCondition,
  resolveHotspotSemanticColor,
} from '../../types/inspection';
import { fetchVehicleDamages } from '../../services/damageApi';
import {
  fetchVehicleMaintenance,
  createVehicleMaintenance,
  startMaintenance,
  completeMaintenance,
  reconcileCompletedDamagesApi,
} from '../../services/maintenanceApi';
import {
  fetchStaffApprovedWork,
  acceptApprovedWork,
  startApprovedWork,
  completeApprovedWork,
} from '../../services/votingApi';
import { ApprovedWorkResponse, VOTE_PROPOSAL_TYPE_CONFIG } from '../../types/voting';
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
import { fetchVehicleChargingSessions, fetchChargingStations } from '../../services/chargingApi';
import { ChargingSessionResponse, ChargingStationResponse } from '../../types/charging';
import { formatDateTime, formatDate, formatTime } from '../../utils/dateTimeUtils';
import { StaffPaymentVerificationView } from './StaffPaymentVerificationView';
import { StaffDisputeDashboardView } from './StaffDisputeDashboardView';
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
  Eye,
  Sparkles,
  Info,
  Sliders,
  Send,
  Wallet,
  ChevronRight,
  User,
  Scale,
  Play,
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

export const getBookingReadinessMeta = (h: VehicleHandoverData, vehicleStatus?: string) => {
  const now = Date.now();
  const startTime = h.bookingStartTime ? new Date(h.bookingStartTime).getTime() : 0;
  const isWithinPrep = startTime > 0 && now >= startTime - 120 * 60 * 1000;

  // 0a. Cần thu hồi xe vào bãi (Red)
  if (h.eligibilityReason === 'RECOVERY_PENDING') {
    return {
      code: 'RECOVERY_PENDING',
      label: 'RECOVERY',
      labelVi: 'Cần thu hồi xe vào bãi',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.2)',
      border: 'rgba(239, 68, 68, 0.5)',
    };
  }

  // 0b. Vi phạm No-Show (Rose)
  if (h.eligibilityReason === 'NO_SHOW_VIOLATION' || h.isExpired) {
    return {
      code: 'NO_SHOW_VIOLATION',
      label: 'NO_SHOW',
      labelVi: 'Vi phạm No-Show',
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.4)',
    };
  }

  // 0c. Chờ thành viên trước trả xe (Red/Rose)
  if (
    h.eligibilityReason === 'PREVIOUS_CUSTODY_UNRESOLVED' ||
    h.previousCustodyUnresolved
  ) {
    return {
      code: 'WAITING_RETURN',
      label: 'WAITING_RETURN',
      labelVi: 'Chờ thành viên trước trả xe',
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.45)',
    };
  }

  // 0d. Đã bàn giao nhưng chưa xuất phát
  if (h.status === 'HANDED_OVER' || h.status === 'OWNER_CONFIRMED') {
    const isOverdue = startTime > 0 && now > startTime + 15 * 60 * 1000;
    if (isOverdue) {
      return {
        code: 'DEPARTURE_OVERDUE',
        label: 'OVERDUE',
        labelVi: 'Quá giờ khởi hành',
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.2)',
        border: 'rgba(249, 115, 22, 0.4)',
      };
    }
    return {
      code: 'AWAITING_DEPARTURE',
      label: 'HANDED_OVER',
      labelVi: 'Đã giao xe - Chờ xuất phát',
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.2)',
      border: 'rgba(168, 85, 247, 0.4)',
    };
  }

  const isVehicleUnavailable =
    h.eligibilityReason === 'VEHICLE_MAINTENANCE' ||
    h.eligibilityReason === 'VEHICLE_CHARGING' ||
    h.eligibilityReason === 'VEHICLE_IN_USE' ||
    vehicleStatus === 'MAINTENANCE' ||
    vehicleStatus === 'CHARGING' ||
    vehicleStatus === 'IN_USE';

  // 1. Chờ phương tiện (Amber/Orange)
  if (isVehicleUnavailable) {
    return {
      code: 'WAITING_VEHICLE',
      label: 'WAITING_VEHICLE',
      labelVi: 'Chờ phương tiện',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.4)',
    };
  }

  // 2. Sẵn sàng bàn giao (Green)
  if (h.isHandoverAllowed || h.eligibilityReason === 'READY' || h.status === 'READY_FOR_HANDOVER') {
    return {
      code: 'READY',
      label: 'READY',
      labelVi: 'Sẵn sàng bàn giao',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.4)',
    };
  }

  // 3. Chuẩn bị bàn giao (Cyan)
  if (isWithinPrep || h.eligibilityReason === 'READY_FOR_PREPARATION') {
    return {
      code: 'PREPARING',
      label: 'PREPARING',
      labelVi: 'Chuẩn bị bàn giao',
      color: '#00f2fe',
      bg: 'rgba(0, 242, 254, 0.15)',
      border: 'rgba(0, 242, 254, 0.4)',
    };
  }

  // 4. Sắp tới (Slate/Sky)
  return {
    code: 'UPCOMING',
    label: 'UPCOMING',
    labelVi: 'Sắp tới',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.4)',
  };
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
  const enterBatteryXrayMode = useWorldStore((state) => state.enterBatteryXrayMode);
  const exitBatteryXrayMode = useWorldStore((state) => state.exitBatteryXrayMode);
  const toggleBatteryXray = React.useCallback(() => {
    if (vehicleBatteryXrayMode) {
      exitBatteryXrayMode();
    } else {
      enterBatteryXrayMode(vehicle.id);
    }
  }, [vehicleBatteryXrayMode, exitBatteryXrayMode, enterBatteryXrayMode, vehicle.id]);
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
  const closeVehicleDetail = useWorldStore((state) => state.closeVehicleDetail);
  const closeStaffOperations = useWorldStore((state) => state.closeStaffOperations);

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
      case 'IN_SERVICE' as any:
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
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // 3-Step Handover Workflow state (1: Booking Details -> 2: 3D Inspection -> 3: Handover Confirmation)
  const [handoverWorkflowStep, setHandoverWorkflowStep] = useState<1 | 2 | 3>(1);

  // Action status message
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const clearMessages = () => {
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
  };

  // Dedicated Handover Success & Receipt State (Cross-Role Confirmation & Receipt Preservation)
  const [completedHandoverReceipt, setCompletedHandoverReceipt] = useState<VehicleHandoverData | null>(null);
  const [isHandoverSuccess, setIsHandoverSuccess] = useState(false);
  const [showStaffReceiptModal, setShowStaffReceiptModal] = useState(false);

  useEffect(() => {
    setSelectedBookingId(null);
    setIsHandoverSuccess(false);
    setCompletedHandoverReceipt(null);
    setHandoverWorkflowStep(1);
    clearMessages();
    setSelectedPartKey('DOOR_FL');
    setPartCondition(null);
    setPartNote('');
    setLastSavedSnapshot(null);
    setSessionInitError(null);
    setShowUnsavedChangesModal(false);
    setPendingNavigationAction(null);
    setShowRestartConfirmModal(false);
    setGeneralSelectedDamageIds([]);
    setSelectedPreliminaryDefectIds([]);
    setShowGeneralProposalForm(false);
    setExpandedDamageId(null);
    setExpandedHistoryId(null);
    setReturnEndOdometer('');
    setReturnEndBattery('');
    setReturnNote('');
    setReturnFormError(null);
    clearVehiclePartSelection();
  }, [vehicle.id, clearVehiclePartSelection]);

  // Reset temporary handover success state when switching away from HANDOVER module
  useEffect(() => {
    if (activeModule !== 'HANDOVER') {
      setIsHandoverSuccess(false);
      setCompletedHandoverReceipt(null);
    }
  }, [activeModule]);

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

  const validActiveHandovers = useMemo(() => {
    const now = Date.now();
    return (activeHandovers || []).filter((h) => {
      if (h.isExpired) return false;
      if (h.bookingStatus === 'EXPIRED' || h.bookingStatus === 'CANCELLED' || h.bookingStatus === 'COMPLETED') return false;
      if (h.eligibilityReason === 'BOOKING_EXPIRED') return false;
      if (h.status === 'HANDED_OVER' || h.status === 'OWNER_CONFIRMED' || h.status === 'COMPLETED' || h.status === 'CANCELLED') return false;
      if (h.tripStatus === 'ACTIVE' || h.tripStatus === 'COMPLETED') return false;
      if (h.bookingEndTime) {
        const end = new Date(h.bookingEndTime).getTime();
        if (!isNaN(end) && now > end) {
          return false;
        }
      }
      return true;
    });
  }, [activeHandovers]);

  // Separate booking visibility from execution eligibility:
  // Section A: Bookings currently within preparation/handover window (<= 120 mins) or marked ready
  const eligibleHandovers = useMemo(() => {
    const now = Date.now();
    return validActiveHandovers.filter((h) => {
      if (h.isHandoverAllowed || h.eligibilityReason === 'READY' || h.status === 'READY_FOR_HANDOVER') {
        return true;
      }
      if (h.eligibilityReason === 'READY_FOR_PREPARATION' || h.status === 'PREPARING' || h.status === 'INSPECTION_IN_PROGRESS') {
        return true;
      }
      if (h.bookingStartTime) {
        const start = new Date(h.bookingStartTime).getTime();
        if (!isNaN(start) && now >= start - 120 * 60 * 1000) {
          return true;
        }
      }
      return false;
    });
  }, [validActiveHandovers]);

  // Section B: Confirmed future bookings that are not yet within preparation window (TOO_EARLY)
  const upcomingHandovers = useMemo(() => {
    const now = Date.now();
    return validActiveHandovers.filter((h) => {
      if (h.isHandoverAllowed || h.eligibilityReason === 'READY' || h.status === 'READY_FOR_HANDOVER') {
        return false;
      }
      if (h.eligibilityReason === 'READY_FOR_PREPARATION' || h.status === 'PREPARING' || h.status === 'INSPECTION_IN_PROGRESS') {
        return false;
      }
      if (h.bookingStartTime) {
        const start = new Date(h.bookingStartTime).getTime();
        if (!isNaN(start) && now >= start - 120 * 60 * 1000) {
          return false;
        }
      }
      return true;
    });
  }, [validActiveHandovers]);

  // Synchronize selection: preserve valid manual selection or auto-select highest priority booking (eligible first, then upcoming)
  useEffect(() => {
    if (isHandoverSuccess) {
      // Keep completed handover snapshot and success screen visible until staff explicitly acknowledges
      return;
    }
    if (validActiveHandovers.length > 0) {
      const isSelectedValid = selectedBookingId && validActiveHandovers.some((h) => h.bookingId === selectedBookingId);
      if (!isSelectedValid) {
        const highestPriority = eligibleHandovers[0] || upcomingHandovers[0] || validActiveHandovers[0];
        setSelectedBookingId(highestPriority?.bookingId || null);
        setHandoverWorkflowStep(1);
        setActionErrorMsg(null);
      }
    } else {
      setSelectedBookingId(null);
    }
  }, [validActiveHandovers, eligibleHandovers, upcomingHandovers, selectedBookingId, isHandoverSuccess]);

  const effectiveSelectedBookingId = selectedBookingId || validActiveHandovers[0]?.bookingId || undefined;

  const { data: eligibility, isLoading: loadingEligibility, refetch: refetchEligibility } = useQuery({
    queryKey: ['handoverEligibility', vehicle.id, effectiveSelectedBookingId],
    queryFn: () => fetchHandoverEligibility(vehicle.id, effectiveSelectedBookingId),
    enabled: Boolean(vehicle.id) && (activeModule === 'HANDOVER' || activeModule === 'INSPECTION_3D' || !activeModule),
    staleTime: 0,
    refetchInterval: 4000,
  });

  // 2. Active Trip & Return Requests (Authoritative Trip Data)
  const { data: activeTrip, refetch: refetchActiveTrip } = useQuery<TripData | null>({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    enabled: Boolean(vehicle.id) && (activeModule === 'RETURN' || currentVehicle.status === 'IN_USE' || activeModule === 'HANDOVER' || activeModule === 'INSPECTION_3D' || !activeModule),
    staleTime: 15000,
  });

  const currentHandover = useMemo(() => {
    if (validActiveHandovers && validActiveHandovers.length > 0) {
      if (effectiveSelectedBookingId) {
        const found = validActiveHandovers.find((h) => h.bookingId === effectiveSelectedBookingId);
        if (found) return found;
      }
      return validActiveHandovers[0] || null;
    }
    // Fallback: If validActiveHandovers query returned empty but eligibility knows there is an active valid booking
    if (
      eligibility?.bookingId &&
      eligibility.reason !== 'BOOKING_EXPIRED' &&
      eligibility.reason !== 'NO_BOOKING'
    ) {
      if (eligibility.bookingEndTime) {
        const end = new Date(eligibility.bookingEndTime).getTime();
        const isHandedOver =
          eligibility.handoverStatus === 'HANDED_OVER' ||
          eligibility.handoverStatus === 'OWNER_CONFIRMED' ||
          eligibility.handoverStatus === 'COMPLETED';
        if (!isNaN(end) && Date.now() > end && !isHandedOver) {
          return null;
        }
      }
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
  }, [validActiveHandovers, effectiveSelectedBookingId, eligibility, vehicle]);

  // Handover temporal eligibility safeguard: staff cannot hand over vehicle weeks in advance
  const isHandoverTooEarly = useMemo(() => {
    if (eligibility?.reason === 'TOO_EARLY') return true;
    if (!currentHandover?.bookingStartTime) return false;
    const start = new Date(currentHandover.bookingStartTime).getTime();
    if (isNaN(start)) return false;
    return Date.now() < start - 120 * 60 * 1000;
  }, [eligibility, currentHandover]);

  // Operational status safeguard: vehicle in use, charging, under maintenance, or previous custody unresolved
  const isVehicleInUse = useMemo(() => {
    return (
      currentVehicle.status === 'IN_USE' ||
      activeTrip?.status === 'ACTIVE' ||
      eligibility?.reason === 'VEHICLE_IN_USE' ||
      eligibility?.reason === 'PREVIOUS_CUSTODY_UNRESOLVED' ||
      Boolean(eligibility?.previousCustodyUnresolved) ||
      Boolean(currentHandover?.previousCustodyUnresolved) ||
      currentHandover?.eligibilityReason === 'PREVIOUS_CUSTODY_UNRESOLVED'
    );
  }, [
    currentVehicle.status,
    activeTrip?.status,
    eligibility?.reason,
    eligibility?.previousCustodyUnresolved,
    currentHandover?.previousCustodyUnresolved,
    currentHandover?.eligibilityReason,
  ]);

  const hasPreviousCustodyUnresolved = useMemo(() => {
    return Boolean(
      eligibility?.previousCustodyUnresolved ||
      eligibility?.reason === 'PREVIOUS_CUSTODY_UNRESOLVED' ||
      currentHandover?.previousCustodyUnresolved ||
      currentHandover?.eligibilityReason === 'PREVIOUS_CUSTODY_UNRESOLVED' ||
      (currentVehicle.status === 'IN_USE' && activeTrip && activeTrip.bookingId !== effectiveSelectedBookingId)
    );
  }, [eligibility, currentHandover, currentVehicle.status, activeTrip, effectiveSelectedBookingId]);

  const custodianDetails = useMemo(() => {
    const name =
      eligibility?.currentCustodianName ||
      currentHandover?.currentCustodianName ||
      activeTrip?.userName ||
      'Thành viên trước';
    const bookingRef =
      eligibility?.currentCustodianBookingId ||
      currentHandover?.currentCustodianBookingId ||
      activeTrip?.bookingId;
    const returnTime =
      eligibility?.currentCustodianExpectedReturnTime ||
      currentHandover?.currentCustodianExpectedReturnTime ||
      activeTrip?.bookingEndTime;
    const isOverdue =
      eligibility?.currentCustodianOverdue ??
      currentHandover?.currentCustodianOverdue ??
      (returnTime ? Date.now() > new Date(returnTime).getTime() : false);
    return { name, bookingRef, returnTime, isOverdue };
  }, [eligibility, currentHandover, activeTrip]);

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

  // 3c. Staff Approved Maintenance Proposals from Voting
  const {
    data: approvedWorks = [],
    isLoading: isLoadingApprovedWorks,
    refetch: refetchApprovedWorks,
  } = useQuery<ApprovedWorkResponse[]>({
    queryKey: ['staffApprovedWork', vehicle.id],
    queryFn: () => fetchStaffApprovedWork(vehicle.id),
    enabled: Boolean(vehicle.id),
    staleTime: 5000,
  });

  // SECTION A: Đề xuất đã duyệt — Chờ tiếp nhận
  const sectionA_approvedWaiting = useMemo(() => {
    return approvedWorks.filter(
      (w) =>
        (w.votingStatus === 'APPROVED' || w.workStatus === 'PENDING_STAFF' || w.workStatus === 'NOT_STARTED') &&
        w.workStatus !== 'ACCEPTED' &&
        w.workStatus !== 'IN_PROGRESS' &&
        w.workStatus !== 'COMPLETED' &&
        w.workStatus !== 'CANCELLED'
    );
  }, [approvedWorks]);

  // SECTION C: Đang thực hiện (Đã tiếp nhận hoặc Đang bảo dưỡng)
  const sectionC_inProgress = useMemo(() => {
    return approvedWorks.filter(
      (w) => w.workStatus === 'ACCEPTED' || w.workStatus === 'IN_PROGRESS'
    );
  }, [approvedWorks]);

  // SECTION D: Lịch sử bảo dưỡng đã hoàn thành
  const sectionD_completedWorks = useMemo(() => {
    return approvedWorks.filter((w) => w.workStatus === 'COMPLETED');
  }, [approvedWorks]);

  const sectionD_resolvedDamages = useMemo(() => {
    return damages.filter((d: any) => d.status === 'RESOLVED' || d.status === 'REPAIRED');
  }, [damages]);

  const pendingApprovedWorks = useMemo(() => {
    return approvedWorks.filter(
      (w) =>
        (w.votingStatus === 'APPROVED' || w.workStatus === 'ACCEPTED' || w.workStatus === 'IN_PROGRESS') &&
        w.workStatus !== 'COMPLETED' &&
        w.workStatus !== 'CANCELLED'
    );
  }, [approvedWorks]);

  // Deduplicate damage records that are already covered by an approved or in-progress repair order
  const coveredDamageIds = useMemo(() => {
    const ids = new Set<string>();
    maintenanceList.forEach((m) => {
      const isApprovedOrActive =
        m.status === 'APPROVED' ||
        m.status === 'ACCEPTED' ||
        m.status === 'IN_PROGRESS' ||
        m.status === 'SCHEDULED';
      if (isApprovedOrActive) {
        m.damageRecordIds?.forEach((id) => ids.add(id));
        m.damageRecords?.forEach((dr) => ids.add(dr.id));
      }
    });
    return ids;
  }, [maintenanceList]);

  const uniqueUnassignedDamagesCount = useMemo(() => {
    return unresolvedDamages.filter((d: any) => !coveredDamageIds.has(d.id)).length;
  }, [unresolvedDamages, coveredDamageIds]);

  const totalMaintenancePendingCount =
    sectionA_approvedWaiting.length + uniqueUnassignedDamagesCount + sectionC_inProgress.length;

  // Tab counts for 3-Tab Maintenance Structure:
  // Tab 1 (CẦN XỬ LÝ) is defined after activeSessionDefects below.
  // Tab 2 (ĐỀ XUẤT & SỬA CHỮA): Đề xuất đã duyệt chờ tiếp nhận + Đang sửa chữa + Đề xuất trong vòng đời (Chờ biểu quyết, Không thông qua, Chờ xác minh)
  const tab2Count = useMemo(() => {
    const lifecycleProposals = maintenanceList.filter(
      (m) =>
        m.status === 'PENDING_APPROVAL' ||
        m.status === 'PENDING' ||
        m.status === 'REJECTED' ||
        m.status === 'SCHEDULED'
    ).length;
    return sectionA_approvedWaiting.length + sectionC_inProgress.length + lifecycleProposals;
  }, [sectionA_approvedWaiting.length, sectionC_inProgress.length, maintenanceList]);

  // Tab 3 (LỊCH SỬ BẢO DƯỠNG): Công việc đã nghiệm thu hoàn thành + Vết hư hỏng đã khắc phục
  const tab3Count = sectionD_completedWorks.length + sectionD_resolvedDamages.length;

  const KNOWN_3D_PARTS = useMemo(
    () =>
      new Set([
        'WHEEL_FL',
        'WHEEL_FR',
        'WHEEL_RL',
        'WHEEL_RR',
        'DOOR_FL',
        'DOOR_FR',
        'DOOR_RL',
        'DOOR_RR',
        'WINDSHIELD',
        'BATTERY',
        'CHARGING_PORT',
        'HOOD',
        'ROOF',
        'HEADLIGHTS',
        'TAILLIGHTS',
        'DIFFUSER',
        'BODY',
      ]),
    []
  );

  const mappedDamages = useMemo(() => {
    return unresolvedDamages.filter((d: any) => {
      const code = normalizeCanonicalPartCode(d.vehiclePartCode || d.partCode);
      return Boolean(code && KNOWN_3D_PARTS.has(code));
    });
  }, [unresolvedDamages, KNOWN_3D_PARTS]);

  const unmappedDamages = useMemo(() => {
    return unresolvedDamages.filter((d: any) => {
      const code = normalizeCanonicalPartCode(d.vehiclePartCode || d.partCode);
      return !code || !KNOWN_3D_PARTS.has(code);
    });
  }, [unresolvedDamages, KNOWN_3D_PARTS]);

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
    enabled: Boolean(vehicle.id) && (activeModule === 'INSPECTION_3D' || activeModule === 'HANDOVER' || activeModule === 'MAINTENANCE'),
    staleTime: 5000,
    refetchInterval: 5000,
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
    () => MANDATORY_HANDOVER_CHECKPOINTS.map((m) => m.id),
    []
  );

  const totalAvailablePartsCount = inspectionPartDropdownList.length;

  const isSessionActive = Boolean(activeInspection && activeInspection.status === 'IN_PROGRESS');

  // Distinct canonical assessed component codes in current active session
  const assessedPartCodes = useMemo(() => {
    if (!activeInspection?.items) return new Set<string>();
    return new Set(
      activeInspection.items
        .map((i) => normalizeCanonicalPartCode(i.vehiclePartCode))
        .filter((c): c is string => Boolean(c))
    );
  }, [activeInspection?.items]);

  // Unique assessed component counts for active inspection session
  const uniqueAssessedCount = assessedPartCodes.size;

  // Remaining unassessed mandatory checkpoints
  const missingRequiredParts = useMemo(() => {
    return MANDATORY_HANDOVER_CHECKPOINTS.filter(
      (chk) => !assessedPartCodes.has(normalizeCanonicalPartCode(chk.id) || chk.id)
    );
  }, [assessedPartCodes]);

  const requiredAssessedCount = MANDATORY_HANDOVER_CHECKPOINTS.length - missingRequiredParts.length;
  const isMandatoryComplete = isSessionActive && missingRequiredParts.length === 0 && uniqueAssessedCount > 0;

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

  // Evaluated items to display in Section D
  const displayEvaluatedItems = useMemo(() => {
    if (isSessionActive && activeInspection?.items) {
      return activeInspection.items;
    }
    if (latestCompletedInspection?.items) {
      return latestCompletedInspection.items;
    }
    return [];
  }, [isSessionActive, activeInspection?.items, latestCompletedInspection?.items]);

  const displayAssessedCount = isSessionActive ? uniqueAssessedCount : completedUniqueCount;

  const inspectionProgressPercent = useMemo(() => {
    if (totalAvailablePartsCount <= 0) return 0;
    const count = isSessionActive ? uniqueAssessedCount : completedUniqueCount;
    return Math.min(100, Math.round((count / totalAvailablePartsCount) * 100));
  }, [isSessionActive, uniqueAssessedCount, completedUniqueCount, totalAvailablePartsCount]);

  // Active inspection session defect findings (components with non-GOOD condition in current active session)
  const activeSessionDefects = useMemo(() => {
    if (!activeInspection?.items) return [];
    return activeInspection.items.filter(
      (item) => item.conditionStatus && item.conditionStatus !== 'GOOD'
    );
  }, [activeInspection?.items]);

  // Tab 1 (CẦN XỬ LÝ): Khiếm khuyết chờ xác nhận từ phiên 3D + Hồ sơ hư hỏng cần xử lý
  const tab1Count = activeSessionDefects.length + uniqueUnassignedDamagesCount;

  // Historical resolved damage records
  const resolvedDamages = useMemo(
    () => damages.filter((d: any) => d.status === 'RESOLVED' || d.status === 'REPAIRED'),
    [damages]
  );

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

  // Sync inspection mode with World Store (without silent background session creation)
  useEffect(() => {
    if (activeModule === 'INSPECTION_3D') {
      if (!vehicleInspectionMode) {
        setVehicleInspectionMode(true);
      }
    } else {
      setSessionInitError(null);
      if (vehicleInspectionMode) {
        setVehicleInspectionMode(false);
        clearVehiclePartSelection();
      }
    }
  }, [
    activeModule,
    vehicleInspectionMode,
    setVehicleInspectionMode,
    clearVehiclePartSelection,
  ]);

  // 5. Charging Sessions
  const { data: chargingSessions = [], refetch: refetchCharging } = useQuery<ChargingSessionResponse[]>({
    queryKey: ['chargingSessions', vehicle.id],
    queryFn: () => fetchVehicleChargingSessions(vehicle.id),
    enabled: Boolean(vehicle.id) && (activeModule === 'BATTERY' || vehicle.status === 'CHARGING'),
    staleTime: 30000,
  });
  const currentChargingSession = chargingSessions.find((s) => s.status === 'ACTIVE') || null;

  // Authoritative Showroom Charging Stations Query (CS01, CS02)
  const { data: chargingStations = [] } = useQuery<ChargingStationResponse[]>({
    queryKey: ['chargingStations'],
    queryFn: fetchChargingStations,
    staleTime: 30000,
  });

  const effectiveStations = useMemo(() => {
    if (chargingStations && chargingStations.length > 0) {
      return chargingStations;
    }
    return [
      { id: 'cs-01', code: 'CS01', name: 'Trạm sạc siêu nhanh 01', status: 'AVAILABLE', maxPowerKw: 150, connectorType: 'CCS2' },
      { id: 'cs-02', code: 'CS02', name: 'Trạm sạc nhanh 02', status: 'AVAILABLE', maxPowerKw: 60, connectorType: 'CCS2' },
    ] as ChargingStationResponse[];
  }, [chargingStations]);

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

  const hasValidInspection = useMemo(() => {
    const requiredThreshold = latestCompletedInspection?.requiredComponentCount ?? MANDATORY_HANDOVER_CHECKPOINTS.length;
    // Authoritative backend handover eligibility check
    if (eligibility && (eligibility.reason === 'READY' || eligibility.handoverAllowed)) {
      return true;
    }
    // If vehicle has 0 unresolved damages, technical condition is clean
    if (unresolvedDamages.length === 0 && completedRequiredCount >= requiredThreshold) {
      return true;
    }
    if (!latestCompletedInspection) return false;
    const completedAt = latestCompletedInspection.completedAt;
    const isFresh = completedAt ? (Date.now() - new Date(completedAt).getTime() < 24 * 3600 * 1000) : false;
    const isPass = latestCompletedInspection.overallResult !== 'FAIL';
    const hasAllRequired = completedRequiredCount >= requiredThreshold;
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

  const handleAcknowledgeSuccessAndReturn = () => {
    setIsHandoverSuccess(false);
    setCompletedHandoverReceipt(null);
    setHandoverWorkflowStep(1);
    clearMessages();
    const nextBooking = eligibleHandovers[0] || upcomingHandovers[0] || validActiveHandovers[0];
    setSelectedBookingId(nextBooking?.bookingId || null);
  };

  const handleStartHandover = async () => {
    if (!currentHandover) return;
    const bookingId = currentHandover.bookingId;
    if (!bookingId) {
      setActionErrorMsg('Không tìm thấy mã lịch đặt tương ứng.');
      return;
    }
    if (isVehicleInUse) {
      setActionErrorMsg('Xe đang được sử dụng. Có thể xem lịch đặt sắp tới. Chỉ được bàn giao sau khi xe được trả và xác minh hợp lệ.');
      return;
    }
    if (isHandoverTooEarly) {
      setActionErrorMsg('Chưa đến thời gian chuẩn bị và bàn giao xe (chỉ bàn giao trước tối đa 2 giờ so với lịch đặt).');
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
    if (isVehicleInUse) {
      setActionErrorMsg('Xe đang được sử dụng. Có thể xem lịch đặt sắp tới. Chỉ được bàn giao sau khi xe được trả và xác minh hợp lệ.');
      return;
    }
    if (isHandoverTooEarly) {
      setActionErrorMsg('Chưa đến thời gian chuẩn bị và bàn giao xe (chỉ bàn giao trước tối đa 2 giờ so với lịch đặt).');
      return;
    }
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
    if (isVehicleInUse) {
      if (hasPreviousCustodyUnresolved) {
        setActionErrorMsg(
          `Phương tiện hiện đang trong sự quản lý của ${custodianDetails.name}. Chưa thể bàn giao cho đến khi xe được trả và xác minh.`
        );
      } else {
        setActionErrorMsg('Xe đang được sử dụng. Có thể xem lịch đặt sắp tới. Chỉ được bàn giao sau khi xe được trả và xác minh hợp lệ.');
      }
      return;
    }
    if (isHandoverTooEarly) {
      setActionErrorMsg('Chưa đến thời gian bàn giao xe (chỉ bàn giao trước tối đa 2 giờ so với lịch đặt).');
      return;
    }
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
      const confirmedReceipt = await confirmHandoverApi(handoverId);

      // Persist authoritative handover snapshot for dedicated success view & formal receipt
      const receiptSnapshot: VehicleHandoverData = {
        ...currentHandover,
        ...(confirmedReceipt || {}),
        id: confirmedReceipt?.id || handoverId,
        bookingId: currentHandover.bookingId,
        bookingStartTime: currentHandover.bookingStartTime,
        bookingEndTime: currentHandover.bookingEndTime,
        vehicleId: vehicle.id,
        vehicleName: confirmedReceipt?.vehicleName || vehicle.name,
        vehicleCode: confirmedReceipt?.vehicleCode || vehicle.vehicleCode || 'EV01',
        licensePlate: confirmedReceipt?.licensePlate || vehicle.licensePlate,
        coOwnerName: confirmedReceipt?.coOwnerName || currentHandover.coOwnerName || eligibility?.recipientName || 'Đồng sở hữu',
        coOwnerEmail: confirmedReceipt?.coOwnerEmail || currentHandover.coOwnerEmail || eligibility?.recipientEmail,
        staffName: confirmedReceipt?.staffName || user?.fullName || 'Nhân viên EVShare',
        staffId: user?.id,
        status: 'HANDED_OVER',
        staffHandedOverAt: confirmedReceipt?.staffHandedOverAt || new Date().toISOString(),
        startBatteryLevel: confirmedReceipt?.startBatteryLevel ?? vehicle.currentBatteryLevel ?? 0,
        startOdometer: confirmedReceipt?.startOdometer ?? vehicle.odometer ?? 0,
        allCheckpointsInspected: confirmedReceipt?.allCheckpointsInspected ?? (completedRequiredCount >= 8),
        totalInspectedCount: confirmedReceipt?.totalInspectedCount ?? completedRequiredCount,
        requiredCheckpointsCount: 8,
        inspections: confirmedReceipt?.inspections || currentHandover.inspections || [],
      };

      setCompletedHandoverReceipt(receiptSnapshot);
      setIsHandoverSuccess(true);
      setActionSuccessMsg('BÀN GIAO XE THÀNH CÔNG! Biên bản bàn giao đã được ghi nhận vào hệ thống.');

      await Promise.all([
        refetchHandovers(),
        refetchEligibility(),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers'] }),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeHandover'] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers'] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility'] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['booking-handover'] }),
        queryClient.invalidateQueries({ queryKey: ['bookingHandover'] }),
        queryClient.invalidateQueries({ queryKey: ['booking-trip'] }),
        queryClient.invalidateQueries({ queryKey: ['trip-start-eligibility'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleBookings'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleBookings', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['bookings', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['handoverHistory'] }),
        queryClient.invalidateQueries({ queryKey: ['handoverHistory', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicle-handover-history', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể xác nhận hoàn tất bàn giao.');
    } finally {
      setIsProcessingHandover(false);
    }
  };

  const [isRecoveringVehicle, setIsRecoveringVehicle] = useState(false);

  const handleRecoverVehicle = async () => {
    if (!currentHandover) return;
    const handoverId = currentHandover.id;
    if (!handoverId) {
      setActionErrorMsg('Không tìm thấy mã hồ sơ bàn giao xe cần thu hồi.');
      return;
    }
    setIsRecoveringVehicle(true);
    clearMessages();
    try {
      await recoverVehicleApi(handoverId, 'Nhân viên đã xác nhận thu hồi xe vào bãi an toàn do hết hạn thời gian chờ khởi hành (No-Show).');
      setActionSuccessMsg('ĐÃ THU HỒI XE VÀO BÃI THÀNH CÔNG! Phương tiện đã được giải phóng về trạng thái SẴN SÀNG.');
      await Promise.all([
        refetchHandovers(),
        refetchEligibility(),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers'] }),
        queryClient.invalidateQueries({ queryKey: ['activeHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers'] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility'] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleBookings'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
      ]);
    } catch (err: any) {
      setActionErrorMsg(err?.message || 'Không thể thực hiện thu hồi xe.');
    } finally {
      setIsRecoveringVehicle(false);
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
        queryClient.invalidateQueries({ queryKey: ['latestCompletedTrip', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['latestCompletedTrip'] }),
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
        queryClient.invalidateQueries({ queryKey: ['bookings', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
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
  const [partCondition, setPartCondition] = useState<InspectionItemCondition | null>(null);
  const [partNote, setPartNote] = useState('');
  const [isSavingPart, setIsSavingPart] = useState(false);
  const [isRestartingInspection, setIsRestartingInspection] = useState(false);
  const [isCompletingInspection, setIsCompletingInspection] = useState(false);

  // Snapshot of last successfully persisted assessment
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<{
    vehicleId: string;
    partKey: string | null;
    condition: InspectionItemCondition | null;
    note: string;
  } | null>(null);

  // Modal dialog states for unsaved changes and session restart
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);
  const [showRestartConfirmModal, setShowRestartConfirmModal] = useState(false);

  // Synchronize component condition and note with existing assessment in active session or latest completed inspection
  useEffect(() => {
    if (!selectedPartKey) {
      setPartCondition(null);
      setPartNote('');
      setLastSavedSnapshot(null);
      return;
    }
    const canonicalKey = normalizeCanonicalPartCode(selectedPartKey);

    // 1. Check active inspection session first
    if (activeInspection?.items) {
      const existing = activeInspection.items.find(
        (i) => normalizeCanonicalPartCode(i.vehiclePartCode) === canonicalKey
      );
      if (existing) {
        setPartCondition(existing.conditionStatus);
        const savedNote = existing.note || '';
        setPartNote(savedNote);
        setLastSavedSnapshot({
          vehicleId: vehicle.id,
          partKey: selectedPartKey,
          condition: existing.conditionStatus,
          note: savedNote.trim(),
        });
        return;
      }
    }

    // 2. Fallback to latest completed inspection (persisted baseline)
    if (latestCompletedInspection?.items) {
      const hist = latestCompletedInspection.items.find(
        (i) => normalizeCanonicalPartCode(i.vehiclePartCode) === canonicalKey
      );
      if (hist) {
        setPartCondition(hist.conditionStatus);
        setPartNote(hist.note || '');
        setLastSavedSnapshot(null);
        return;
      }
    }

    // 3. Fallback to unresolved damages
    const dmg = unresolvedDamages.find(
      (d: any) => normalizeCanonicalPartCode(d.vehiclePartCode || d.partCode) === canonicalKey
    );
    if (dmg) {
      const cond = dmg.damageType === 'SCRATCH' ? 'SCRATCH' : dmg.damageType === 'DENT' ? 'DENT' : dmg.damageType === 'CRACK' ? 'CRACK' : 'OTHER_DAMAGE';
      setPartCondition(cond as InspectionItemCondition);
      setPartNote(dmg.note || dmg.description || '');
      setLastSavedSnapshot(null);
      return;
    }

    setPartCondition(null);
    setPartNote('');
    setLastSavedSnapshot(null);
  }, [selectedPartKey, activeInspection?.id, latestCompletedInspection?.id, unresolvedDamages, vehicle.id]);

  // Precision dirty-state comparison against persisted baseline
  const isFormDirty = useMemo(() => {
    if (activeModule !== 'INSPECTION_3D') return false;
    if (!activeInspection || activeInspection.status !== 'IN_PROGRESS') return false;
    if (!selectedPartKey) return false;

    // Persisted baseline from activeInspection items
    const canonicalKey = normalizeCanonicalPartCode(selectedPartKey);
    const existing = activeInspection.items?.find(
      (i) => normalizeCanonicalPartCode(i.vehiclePartCode) === canonicalKey
    );

    const baselineCondition = existing ? existing.conditionStatus : null;
    const baselineNote = (existing?.note || '').trim();

    // Check against lastSavedSnapshot if matching current vehicle & part
    const snapshotCondition = (lastSavedSnapshot?.partKey === selectedPartKey && lastSavedSnapshot.vehicleId === vehicle.id)
      ? lastSavedSnapshot.condition
      : baselineCondition;
    const snapshotNote = (lastSavedSnapshot?.partKey === selectedPartKey && lastSavedSnapshot.vehicleId === vehicle.id)
      ? lastSavedSnapshot.note
      : baselineNote;

    const currentNote = partNote.trim();
    const currentCondition = partCondition;

    // Both match snapshot / persisted baseline => NOT dirty
    if (currentCondition === snapshotCondition && currentNote === snapshotNote) {
      return false;
    }

    // Neither has any data => NOT dirty
    if (!snapshotCondition && !snapshotNote && !currentCondition && !currentNote) {
      return false;
    }

    return true;
  }, [activeModule, activeInspection, selectedPartKey, partCondition, partNote, lastSavedSnapshot, vehicle.id]);

  // Guard navigation actions with unsaved changes verification
  const performGuardedAction = useCallback((action: () => void) => {
    if (isFormDirty) {
      setPendingNavigationAction(() => action);
      setShowUnsavedChangesModal(true);
    } else {
      action();
    }
  }, [isFormDirty]);

  const handleDiscardUnsavedChanges = () => {
    setShowUnsavedChangesModal(false);
    // Revert form state to persisted values of current part
    if (selectedPartKey && activeInspection?.items) {
      const canonicalKey = normalizeCanonicalPartCode(selectedPartKey);
      const existing = activeInspection.items.find(
        (i) => normalizeCanonicalPartCode(i.vehiclePartCode) === canonicalKey
      );
      if (existing) {
        setPartCondition(existing.conditionStatus);
        setPartNote(existing.note || '');
      } else {
        setPartCondition(null);
        setPartNote('');
      }
    } else {
      setPartCondition(null);
      setPartNote('');
    }
    const action = pendingNavigationAction;
    setPendingNavigationAction(null);
    if (action) {
      action();
    }
  };

  const handleKeepEditing = () => {
    setShowUnsavedChangesModal(false);
    setPendingNavigationAction(null);
    if (selectedPartKey) {
      selectVehiclePart(selectedPartKey);
      selectVehiclePartCode(selectedPartKey);
    }
  };

  // Synchronize 3D hotspot part selection with component condition assessment form (guarded)
  useEffect(() => {
    if (selectedVehiclePartId && activeModule === 'INSPECTION_3D') {
      const canonical = (normalizeCanonicalPartCode(selectedVehiclePartId) || selectedVehiclePartId) as VehiclePartId;
      if (canonical !== selectedPartKey) {
        performGuardedAction(() => {
          setSelectedPartKey(canonical);
        });
      }
    }
  }, [selectedVehiclePartId, activeModule, selectedPartKey, performGuardedAction]);

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
    if (!partCondition) {
      setActionErrorMsg('Vui lòng chọn tình trạng đánh giá cho bộ phận (TỐT, TRẦY, MÓP, NỨT).');
      return;
    }
    setIsSavingPart(true);
    clearMessages();
    try {
      const targetCode = (normalizeCanonicalPartCode(selectedPartKey) || selectedPartKey) as string;
      const finalNote = partNote.trim() || (partCondition === 'GOOD' ? 'Đạt tiêu chuẩn' : 'Có ghi nhận lưu ý');
      const updatedInspection = await submitInspectionItemApi(activeInspection.id, {
        vehiclePartCode: targetCode,
        conditionStatus: partCondition,
        note: finalNote,
      });

      // Authoritatively update TanStack query data from backend response
      queryClient.setQueryData<VehicleInspectionResponse | null>(
        ['activeInspection', vehicle.id],
        updatedInspection
      );

      // Keep saved values in the form and update snapshot to immediately clear dirty state
      setPartNote(finalNote);
      setLastSavedSnapshot({
        vehicleId: vehicle.id,
        partKey: selectedPartKey,
        condition: partCondition,
        note: finalNote.trim(),
      });

      const partLabel = SEMANTIC_PART_LABELS_VI[selectedPartKey] || selectedPartKey;
      const condName = partCondition === 'GOOD' ? 'TỐT' : partCondition === 'SCRATCH' ? 'TRẦY' : partCondition === 'DENT' ? 'MÓP' : 'NỨT';
      setActionSuccessMsg(
        `Đã lưu đánh giá: ${partLabel} (${condName})`
      );
      await Promise.all([
        refetchInspection(),
        queryClient.invalidateQueries({ queryKey: ['activeInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] }),
      ]);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể lưu kiểm tra bộ phận.');
    } finally {
      setIsSavingPart(false);
    }
  };

  const executeActualClose = () => {
    if (activeModule === 'INSPECTION_3D') {
      clearVehiclePartSelection();
      setVehicleInspectionMode(false);
    }
    setActiveModule(null);
    closeVehicleDetail();
    useWorldStore.getState().setActiveStaffOperationModule(null);
    useWorldStore.getState().setStaffOperationsCarouselOpen(true);
    if (onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    if (activeModule === 'INSPECTION_3D') {
      performGuardedAction(() => executeActualClose());
    } else {
      executeActualClose();
    }
  };

  const executeStartNewInspection = async () => {
    setShowRestartConfirmModal(false);
    clearMessages();
    try {
      setIsRestartingInspection(true);
      const res = await startInspectionApi(vehicle.id, 'PRE_HANDOVER', true);
      queryClient.setQueryData(['activeInspection', vehicle.id], res);
      setSelectedPartKey(null);
      clearVehiclePartSelection();
      setPartCondition(null);
      setPartNote('');
      setLastSavedSnapshot(null);
      clearMessages();
      setActionSuccessMsg('Đã khởi tạo phiên kiểm tra mới thành công. Tất cả bộ phận ở trạng thái chưa kiểm tra.');
      await Promise.all([
        refetchInspection(),
        queryClient.invalidateQueries({ queryKey: ['activeInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
      ]);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể khởi tạo kiểm tra mới.');
    } finally {
      setIsRestartingInspection(false);
    }
  };

  const handleStartNewInspection = () => {
    if (isRestartingInspection) return;
    if (activeInspection && activeInspection.status === 'IN_PROGRESS') {
      performGuardedAction(() => {
        setShowRestartConfirmModal(true);
      });
    } else {
      executeStartNewInspection();
    }
  };

  const handleCompleteInspection = async () => {
    if (!activeInspection || activeInspection.status !== 'IN_PROGRESS') {
      setActionErrorMsg('Không có phiên kiểm tra đang hoạt động để hoàn tất.');
      return;
    }
    if (!activeInspection.items || activeInspection.items.length === 0) {
      setActionErrorMsg('Cần kiểm tra ít nhất một bộ phận trước khi hoàn tất biên bản.');
      return;
    }
    if (!isMandatoryComplete) {
      setActionErrorMsg(
        `Còn ${missingRequiredParts.length} bộ phận bắt buộc chưa được kiểm tra: ${missingRequiredParts.map((p) => p.label).join(', ')}`
      );
      return;
    }
    setIsCompletingInspection(true);
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
        `Đã hoàn tất biên bản kiểm tra: ${assessedCount}/${totalAvailablePartsCount} bộ phận đã đánh giá (${reqCount}/${MANDATORY_HANDOVER_CHECKPOINTS.length} bộ phận bắt buộc)${defectCount > 0 ? `, ${defectCount} khiếm khuyết được đồng bộ vào hồ sơ hư hỏng` : ''
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

      // AUTO-RESTORE CAMERA AND OVERVIEW STATE UPON SUCCESSFUL INSPECTION COMPLETION:
      // 1. Clear the focused inspection part in local state & global store
      setSelectedPartKey('DOOR_FL');
      setPartNote('');
      clearVehiclePartSelection();

      // 2. Exit inspection camera mode and return to vehicle operations overview hub
      // The right-side staff panel remains open (isVehicleDetailOpen = true) with the selected vehicle preserved.
      // In GarageCamera.tsx, resolveActiveCameraPresetKey switches to VEHICLE_WITH_RIGHT_PANEL,
      // smoothly gliding both camera.position and controls.target to STAFF_GARAGE_LAYOUT.camera.
      setVehicleInspectionMode(false);
      setActiveModule(null);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể hoàn tất biên bản.');
    } finally {
      setIsCompletingInspection(false);
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
  const [selectedPreliminaryDefectIds, setSelectedPreliminaryDefectIds] = useState<string[]>([]);
  const [isSubmittingGeneralProposal, setIsSubmittingGeneralProposal] = useState(false);

  const handleTogglePreliminaryDefect = (defect: VehicleInspectionItemResponse) => {
    setSelectedPreliminaryDefectIds((prev) => {
      const exists = prev.includes(defect.id);
      const next = exists ? prev.filter((id) => id !== defect.id) : [...prev, defect.id];

      if (next.length > 0) {
        const selectedItems = activeSessionDefects.filter((d) => next.includes(d.id));
        const parts = selectedItems.map((d) => {
          const key = normalizeCanonicalPartCode(d.vehiclePartCode);
          return SEMANTIC_PART_LABELS_VI[key as VehiclePartId] || d.vehiclePartCode;
        });
        setGeneralProposalTitle(`Đề xuất sửa chữa (${next.length} khiếm khuyết 3D): ${parts.join(', ')}`);
        const hasCrack = selectedItems.some((d) => d.conditionStatus === 'CRACK');
        const hasDent = selectedItems.some((d) => d.conditionStatus === 'DENT');
        setGeneralProposalPriority(hasCrack ? 'CRITICAL' : hasDent ? 'HIGH' : 'MEDIUM');

        const descriptions = selectedItems.map((d) => {
          const key = normalizeCanonicalPartCode(d.vehiclePartCode);
          const pLabel = SEMANTIC_PART_LABELS_VI[key as VehiclePartId] || d.vehiclePartCode;
          const cLabel = d.conditionStatus === 'CRACK' ? 'NỨT VỠ' : d.conditionStatus === 'DENT' ? 'MÓP MÉO' : 'TRẦY XƯỚC';
          return `• [${pLabel}] - ${cLabel}: ${d.note || 'Chưa có ghi chú'}`;
        });
        setGeneralProposalDesc(
          `Tổng hợp các khiếm khuyết kỹ thuật từ phiên kiểm tra 3D:\n${descriptions.join('\n')}\nPhương án xử lý: Sửa chữa và phục hồi tiêu chuẩn kỹ thuật an toàn.`
        );

        const matchedDmgIds = unresolvedDamages
          .filter((dmg: any) =>
            selectedItems.some(
              (s) =>
                normalizeCanonicalPartCode(s.vehiclePartCode) ===
                normalizeCanonicalPartCode(dmg.vehiclePartCode || dmg.partCode)
            )
          )
          .map((dmg: any) => dmg.id);
        setGeneralSelectedDamageIds(matchedDmgIds);
      }
      return next;
    });
  };

  const handleOpenProposalForDefect = (defect: VehicleInspectionItemResponse) => {
    const canonicalKey = normalizeCanonicalPartCode(defect.vehiclePartCode);
    const partLabel = SEMANTIC_PART_LABELS_VI[canonicalKey as VehiclePartId] || defect.vehiclePartCode;
    const condLabel =
      defect.conditionStatus === 'CRACK' ? 'NỨT VỠ' : defect.conditionStatus === 'DENT' ? 'MÓP MÉO' : 'TRẦY XƯỚC';

    const matchingDamage = unresolvedDamages.find(
      (d: any) => normalizeCanonicalPartCode(d.vehiclePartCode || d.partCode) === canonicalKey
    );
    if (matchingDamage) {
      setGeneralSelectedDamageIds([matchingDamage.id]);
    } else {
      setGeneralSelectedDamageIds([]);
    }
    setSelectedPreliminaryDefectIds([defect.id]);

    setGeneralProposalTitle(`Đề xuất sửa chữa khiếm khuyết: ${partLabel} (${condLabel})`);
    setGeneralProposalType('REPAIR');
    setGeneralProposalPriority(
      defect.conditionStatus === 'CRACK' ? 'CRITICAL' : defect.conditionStatus === 'DENT' ? 'HIGH' : 'MEDIUM'
    );
    setGeneralProposalDesc(
      `Bộ phận: ${partLabel} (${canonicalKey})\nTình trạng: ${condLabel} (Kiểm tra 3D)\nGhi chú kiểm tra: ${defect.note || 'Không có ghi chú chi tiết'
      }\nPhương án xử lý: Kiểm tra chuyên sâu, sửa chữa hoặc thay thế đạt tiêu chuẩn an toàn kỹ thuật.`
    );
    setGeneralProposalCost('');
    setShowGeneralProposalForm(true);
    clearMessages();
  };

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
        inspectionItemIds: selectedPreliminaryDefectIds.length > 0 ? selectedPreliminaryDefectIds : undefined,
      });

      setActionSuccessMsg('Đã tạo đề xuất bảo dưỡng và gửi biểu quyết đến nhóm đồng sở hữu.');
      setShowGeneralProposalForm(false);
      setGeneralProposalTitle('');
      setGeneralProposalDesc('');
      setGeneralProposalCost('');
      setGeneralSelectedDamageIds([]);
      setSelectedPreliminaryDefectIds([]);
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

  // 3-Tab horizontal layout state for Maintenance module
  const [maintenanceTab, setMaintenanceTab] = useState<'UNRESOLVED' | 'IN_PROGRESS' | 'HISTORY'>('UNRESOLVED');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Maintenance repair execution state
  const [isStartingRepair, setIsStartingRepair] = useState<string | null>(null);
  const [completingMaintId, setCompletingMaintId] = useState<string | null>(null);
  const [repairActualCost, setRepairActualCost] = useState<string>('');
  const [repairCompletionNote, setRepairCompletionNote] = useState<string>('');
  const [isCompletingRepair, setIsCompletingRepair] = useState(false);

  // Staff Approved Work Execution State (Phase 21/24)
  const [isAcceptingWorkId, setIsAcceptingWorkId] = useState<string | null>(null);
  const [isStartingWorkId, setIsStartingWorkId] = useState<string | null>(null);
  const [completingApprovedWorkId, setCompletingApprovedWorkId] = useState<string | null>(null);
  const [approvedWorkActualCost, setApprovedWorkActualCost] = useState<string>('');
  const [approvedWorkCompletionNote, setApprovedWorkCompletionNote] = useState<string>('');
  const [approvedWorkEvidenceUrl, setApprovedWorkEvidenceUrl] = useState<string>('');
  const [isCompletingApprovedWork, setIsCompletingApprovedWork] = useState(false);

  const handleAcceptApprovedWork = async (item: ApprovedWorkResponse) => {
    setIsAcceptingWorkId(item.proposalId);
    clearMessages();
    try {
      await acceptApprovedWork(item.proposalId);
      setActionSuccessMsg(`Đã tiếp nhận công việc "${item.title}". Trạng thái chuyển sang ĐÃ TIẾP NHẬN.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staffApprovedWork', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['staffApprovedWork'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vote-proposals'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      refetchApprovedWorks();
      refetchMaintenance();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể tiếp nhận công việc.');
    } finally {
      setIsAcceptingWorkId(null);
    }
  };

  const handleStartApprovedWork = async (item: ApprovedWorkResponse) => {
    setIsStartingWorkId(item.proposalId);
    clearMessages();
    try {
      await startApprovedWork(item.proposalId);
      setActionSuccessMsg(`Đã bắt đầu thực hiện: ${item.title}. Trạng thái xe chuyển sang BẢO DƯỠNG.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staffApprovedWork', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['staffApprovedWork'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vote-proposals'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      refetchApprovedWorks();
      refetchMaintenance();
      refetchDamages();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể bắt đầu thực hiện công việc.');
    } finally {
      setIsStartingWorkId(null);
    }
  };

  const handleCompleteApprovedWork = async (item: ApprovedWorkResponse) => {
    const costNum = parseFloat(approvedWorkActualCost.replace(/[^0-9.]/g, ''));
    if (isNaN(costNum) || costNum <= 0) {
      setActionErrorMsg('Vui lòng nhập chi phí thực tế hợp lệ (lớn hơn 0 VND).');
      return;
    }

    const budget = item.approvedBudget || item.estimatedAmount || 0;
    if (costNum > budget) {
      setActionErrorMsg(
        `Chi phí thực tế (${costNum.toLocaleString('vi-VN')} VND) vượt quá ngân sách đã được phê duyệt (${budget.toLocaleString('vi-VN')} VND). Nghiêm cấm ghi nhận chi phí vượt hạn mức mà không có biểu quyết bổ sung.`
      );
      return;
    }

    setIsCompletingApprovedWork(true);
    clearMessages();
    try {
      await completeApprovedWork(item.proposalId, {
        actualCost: costNum,
        completionNote: approvedWorkCompletionNote.trim() || 'Hoàn tất bảo dưỡng đạt chuẩn kỹ thuật.',
        evidenceUrl: approvedWorkEvidenceUrl.trim() || undefined,
      });
      try {
        await reconcileCompletedDamagesApi(vehicle.id);
      } catch (ignored) {
      }
      setActionSuccessMsg(`Đã hoàn tất công việc: ${item.title}. Chi phí ${costNum.toLocaleString('vi-VN')} VND đã được hạch toán.`);
      setCompletingApprovedWorkId(null);
      setApprovedWorkActualCost('');
      setApprovedWorkCompletionNote('');
      setApprovedWorkEvidenceUrl('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staffApprovedWork', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['staffApprovedWork'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['latestCompletedInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vote-proposals'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      refetchApprovedWorks();
      refetchMaintenance();
      refetchDamages();
      refetchInspection();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể hoàn tất công việc.');
    } finally {
      setIsCompletingApprovedWork(false);
    }
  };

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
      try {
        await reconcileCompletedDamagesApi(vehicle.id);
      } catch (ignored) {
      }
      setActionSuccessMsg('Đã hoàn tất sửa chữa và nghiệm thu! Hư hỏng đã được khắc phục (RESOLVED).');
      setCompletingMaintId(null);
      setRepairActualCost('');
      setRepairCompletionNote('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['latestCompletedInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['staffApprovedWork', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vote-proposals'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
      ]);
      refetchMaintenance();
      refetchDamages();
      refetchInspection();
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
        width: isMobile ? 'calc(100vw - 16px)' : 'clamp(440px, 28vw, 495px)',
        maxWidth: isMobile ? 'calc(100vw - 16px)' : 'min(495px, calc(100vw - 32px))',
        maxHeight: isMobile ? 'calc(100vh - 75px)' : 'calc(100vh - 96px)',
        boxSizing: 'border-box',
        zIndex: 40,
        background: 'rgba(7, 20, 38, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 242, 254, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(0, 242, 254, 0.16)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pointerEvents: 'auto',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        animation: 'staffPanelSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* 1. COMPACT OPERATIONAL HEADER (No duplicate vehicle identity; identity is anchored in 3D above the car) */}
      <header
        style={{
          padding: '12px 16px',
          background: 'rgba(11, 28, 54, 0.90)',
          borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={13} color="#00f2fe" />
          </div>
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {activeModule
              ? (getStaffOperationalModule(activeModule)?.label || 'TÁC VỤ VẬN HÀNH')
              : 'TÁC VỤ VẬN HÀNH'}
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng bảng điều khiển"
            title="Đóng bảng điều khiển"
            style={{
              width: '28px',
              height: '28px',
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
            <X size={15} />
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


      {/* 3. MAIN AREA: EITHER 6-MODULE HUB OR DEDICATED MODULE VIEW */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {activeModule !== null && (
          /* ====================================================
             DEDICATED MODULE SUBVIEW WITH TOP BACK BAR
             ==================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Top Back Navigation Bar (Hidden for MAINTENANCE as top-right X is the sole exit control) */}
            {activeModule !== 'MAINTENANCE' && (
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
                  onClick={handleClose}
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
                  {activeModule === 'HANDOVER' && 'BÀN GIAO XE'}
                  {activeModule === 'RETURN' && 'THỦ TỤC TRẢ XE'}
                  {activeModule === 'INSPECTION_3D' && 'KIỂM TRA BỘ PHẬN 3D'}
                  {activeModule === 'HISTORY' && 'NHẬT KÝ HOẠT ĐỘNG'}
                  {activeModule === 'PAYMENT' && 'XÁC MINH THANH TOÁN'}
                  {activeModule === 'DISPUTE' && 'HÒA GIẢI & TRANH CHẤP'}
                </span>
              </div>
            )}

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
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ color: '#00f2fe', fontWeight: 700 }}>
                          Phiên sạc #{currentChargingSession.id.slice(0, 8)} đang diễn ra
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                          Miễn phí sạc — Phục vụ vận hành
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Đã sạc: {currentChargingSession.energyDeliveredKwh || 0} kWh • Người nạp: {currentChargingSession.startedByUserName || 'Nhân viên vận hành'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Showroom Charging Stations (CS01 & CS02) - Contained Operational Layout */}
                <div
                  style={{
                    background: 'rgba(15, 32, 60, 0.65)',
                    border: '1px solid rgba(0, 242, 254, 0.25)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={14} color="#00f2fe" />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        TRẠM SẠC SHOWROOM
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>2 trạm vận hành</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {effectiveStations.map((station) => {
                      const isOccupied =
                        station.status === 'OCCUPIED' ||
                        (currentChargingSession && currentChargingSession.chargingStationCode === station.code);
                      const isAvailable = !isOccupied && station.status !== 'OUT_OF_SERVICE';
                      const isConnectedToThisVehicle =
                        currentChargingSession && currentChargingSession.chargingStationCode === station.code;

                      return (
                        <div
                          key={station.id || station.code}
                          style={{
                            background: isConnectedToThisVehicle
                              ? 'rgba(0, 242, 254, 0.12)'
                              : isOccupied
                                ? 'rgba(56, 189, 248, 0.08)'
                                : 'rgba(11, 23, 44, 0.7)',
                            border: isConnectedToThisVehicle
                              ? '1.2px solid #00f2fe'
                              : isOccupied
                                ? '1px solid rgba(56, 189, 248, 0.4)'
                                : '1px solid rgba(52, 211, 153, 0.3)',
                            borderRadius: '10px',
                            padding: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                              {station.code}
                            </span>
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '9999px',
                                background: isOccupied
                                  ? 'rgba(56, 189, 248, 0.2)'
                                  : isAvailable
                                    ? 'rgba(52, 211, 153, 0.2)'
                                    : 'rgba(239, 68, 68, 0.2)',
                                color: isOccupied
                                  ? '#38bdf8'
                                  : isAvailable
                                    ? '#34d399'
                                    : '#ef4444',
                              }}
                            >
                              {isOccupied ? 'ĐANG SẠC' : isAvailable ? 'SẴN SÀNG' : 'BẢO TRÌ'}
                            </span>
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                            Công suất: <strong style={{ color: '#f1f5f9' }}>{station.maxPowerKw || (station.code === 'CS01' ? 150 : 60)} kW</strong>
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                            Chuẩn: {station.connectorType || 'CCS2'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                      QUẢN LÝ BẢO DƯỠNG & SỬA CHỮA
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: totalMaintenancePendingCount > 0 ? '#ef4444' : '#10b981',
                      background: totalMaintenancePendingCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: `1px solid ${totalMaintenancePendingCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                    }}
                  >
                    {totalMaintenancePendingCount > 0 ? `${totalMaintenancePendingCount} CẦN XỬ LÝ` : '0 CHƯA XỬ LÝ'}
                  </span>
                </div>

                {/* 3 HORIZONTAL TABS */}
                <div
                  role="tablist"
                  aria-label="Phân hệ bảo dưỡng"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '6px',
                    background: 'rgba(11, 28, 54, 0.75)',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 242, 254, 0.25)',
                  }}
                >
                  {/* TAB 1 */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={maintenanceTab === 'UNRESOLVED'}
                    onClick={() => setMaintenanceTab('UNRESOLVED')}
                    style={{
                      background:
                        maintenanceTab === 'UNRESOLVED'
                          ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.22) 0%, rgba(2, 132, 199, 0.28) 100%)'
                          : 'transparent',
                      border:
                        maintenanceTab === 'UNRESOLVED'
                          ? '1px solid #00f2fe'
                          : '1px solid transparent',
                      borderRadius: '8px',
                      padding: '8px 4px',
                      color: maintenanceTab === 'UNRESOLVED' ? '#00f2fe' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      minHeight: '44px',
                      boxShadow:
                        maintenanceTab === 'UNRESOLVED'
                          ? '0 0 12px rgba(0, 242, 254, 0.25)'
                          : 'none',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        textAlign: 'center',
                        lineHeight: 1.25,
                        wordBreak: 'break-word',
                      }}
                    >
                      CẦN XỬ LÝ
                    </span>
                    {tab1Count > 0 && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 900,
                          background: '#ef4444',
                          color: '#ffffff',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          lineHeight: 1.1,
                        }}
                      >
                        {tab1Count}
                      </span>
                    )}
                  </button>

                  {/* TAB 2 */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={maintenanceTab === 'IN_PROGRESS'}
                    onClick={() => setMaintenanceTab('IN_PROGRESS')}
                    style={{
                      background:
                        maintenanceTab === 'IN_PROGRESS'
                          ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.22) 0%, rgba(2, 132, 199, 0.28) 100%)'
                          : 'transparent',
                      border:
                        maintenanceTab === 'IN_PROGRESS'
                          ? '1px solid #00f2fe'
                          : '1px solid transparent',
                      borderRadius: '8px',
                      padding: '8px 4px',
                      color: maintenanceTab === 'IN_PROGRESS' ? '#00f2fe' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      minHeight: '44px',
                      boxShadow:
                        maintenanceTab === 'IN_PROGRESS'
                          ? '0 0 12px rgba(0, 242, 254, 0.25)'
                          : 'none',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        textAlign: 'center',
                        lineHeight: 1.25,
                        wordBreak: 'break-word',
                      }}
                    >
                      ĐỀ XUẤT & SỬA CHỮA
                    </span>
                    {tab2Count > 0 && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 900,
                          background: '#0284c7',
                          color: '#ffffff',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          lineHeight: 1.1,
                        }}
                      >
                        {tab2Count}
                      </span>
                    )}
                  </button>

                  {/* TAB 3 */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={maintenanceTab === 'HISTORY'}
                    onClick={() => setMaintenanceTab('HISTORY')}
                    style={{
                      background:
                        maintenanceTab === 'HISTORY'
                          ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.22) 0%, rgba(2, 132, 199, 0.28) 100%)'
                          : 'transparent',
                      border:
                        maintenanceTab === 'HISTORY'
                          ? '1px solid #00f2fe'
                          : '1px solid transparent',
                      borderRadius: '8px',
                      padding: '8px 4px',
                      color: maintenanceTab === 'HISTORY' ? '#00f2fe' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      minHeight: '44px',
                      boxShadow:
                        maintenanceTab === 'HISTORY'
                          ? '0 0 12px rgba(0, 242, 254, 0.25)'
                          : 'none',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        textAlign: 'center',
                        lineHeight: 1.25,
                        wordBreak: 'break-word',
                      }}
                    >
                      LỊCH SỬ BẢO DƯỠNG
                    </span>
                    {tab3Count > 0 && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 900,
                          background: '#10b981',
                          color: '#ffffff',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          lineHeight: 1.1,
                        }}
                      >
                        {tab3Count}
                      </span>
                    )}
                  </button>
                </div>

                {/* ====================================================
                    TAB 1: HƯ HỎNG CHƯA XỬ LÝ (KÈM ĐỀ XUẤT CHỜ TIẾP NHẬN)
                    ==================================================== */}
                {maintenanceTab === 'UNRESOLVED' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* ====================================================
                        SECTION A: KHIẾM KHUYẾT CHỜ XÁC NHẬN (PHIÊN KIỂM TRA 3D)
                        ==================================================== */}
                    <div
                      style={{
                        background: 'rgba(10, 25, 47, 0.75)',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 242, 254, 0.3)',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingBottom: '8px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Eye size={13} color="#00f2fe" />
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.03em' }}>
                            KHIẾM KHUYẾT CHỜ XÁC NHẬN (PHIÊN KIỂM TRA 3D)
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            color: activeSessionDefects.length > 0 ? '#fbbf24' : '#10b981',
                            background: activeSessionDefects.length > 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            padding: '2px 7px',
                            borderRadius: '10px',
                            border: `1px solid ${activeSessionDefects.length > 0 ? 'rgba(251, 191, 36, 0.35)' : 'rgba(16, 185, 129, 0.3)'}`,
                          }}
                        >
                          {activeSessionDefects.length} KHIẾM KHUYẾT
                        </span>
                      </div>

                      {activeSessionDefects.length === 0 ? (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: 'rgba(15, 32, 60, 0.35)',
                            border: '1px dashed rgba(255, 255, 255, 0.1)',
                            textAlign: 'center',
                            color: '#94a3b8',
                            fontSize: '10.5px',
                          }}
                        >
                          {activeInspection && activeInspection.status === 'IN_PROGRESS'
                            ? 'Phiên kiểm tra 3D đang hoạt động chưa ghi nhận khiếm khuyết bất thường nào.'
                            : 'Không có khiếm khuyết sơ bộ nào chờ xác nhận từ phiên kiểm tra 3D.'}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {/* Multi-defect Batch Action Bar */}
                          {selectedPreliminaryDefectIds.length > 0 && (
                            <div
                              style={{
                                padding: '8px 10px',
                                borderRadius: '8px',
                                background: 'rgba(2, 132, 199, 0.18)',
                                border: '1px solid rgba(2, 132, 199, 0.45)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                              }}
                            >
                              <div style={{ fontSize: '11px', color: '#bae6fd', fontWeight: 600 }}>
                                Đã chọn <strong>{selectedPreliminaryDefectIds.length}</strong> khiếm khuyết 3D
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowGeneralProposalForm(true);
                                    clearMessages();
                                  }}
                                  style={{
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '5px 10px',
                                    color: '#ffffff',
                                    fontSize: '10.5px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Wrench size={11} />
                                  <span>GỬI ĐỀ XUẤT CHO MỤC ĐÃ CHỌN</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedPreliminaryDefectIds([])}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '5px 8px',
                                    color: '#cbd5e1',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Bỏ chọn
                                </button>
                              </div>
                            </div>
                          )}

                          {activeSessionDefects.map((defect) => {
                            const canonicalKey = normalizeCanonicalPartCode(defect.vehiclePartCode);
                            const partLabel = SEMANTIC_PART_LABELS_VI[canonicalKey as VehiclePartId] || defect.vehiclePartCode;
                            const isScratch = defect.conditionStatus === 'SCRATCH';
                            const isDent = defect.conditionStatus === 'DENT';
                            const isCrack = defect.conditionStatus === 'CRACK';
                            const condColor = isCrack ? '#ef4444' : isDent ? '#f97316' : '#facc15';
                            const condBg = isCrack ? 'rgba(239, 68, 68, 0.15)' : isDent ? 'rgba(249, 115, 22, 0.15)' : 'rgba(250, 204, 21, 0.15)';
                            const condLabelVi = isCrack ? 'NỨT VỠ (CRACK)' : isDent ? 'MÓP MÉO (DENT)' : 'TRẦY XƯỚC (SCRATCH)';
                            const isSelected = selectedPreliminaryDefectIds.includes(defect.id);

                            return (
                              <div
                                key={defect.id || defect.vehiclePartCode}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: '10px',
                                  background: 'rgba(15, 23, 42, 0.85)',
                                  border: `1px solid ${isSelected ? '#00f2fe' : `${condColor}40`}`,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px',
                                  boxShadow: isSelected ? '0 0 10px rgba(0, 242, 254, 0.25)' : 'none',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleTogglePreliminaryDefect(defect)}
                                      style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                                      title="Chọn để lập đề xuất gộp"
                                    />
                                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff' }}>
                                      {partLabel}
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                      ({canonicalKey})
                                    </span>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      fontWeight: 800,
                                      color: condColor,
                                      background: condBg,
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      border: `1px solid ${condColor}50`,
                                    }}
                                  >
                                    {condLabelVi}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    fontSize: '10.5px',
                                    color: '#cbd5e1',
                                    background: 'rgba(0, 0, 0, 0.25)',
                                    padding: '6px 8px',
                                    borderRadius: '6px',
                                    borderLeft: `2px solid ${condColor}`,
                                  }}
                                >
                                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>Ghi chú: </span>
                                  {defect.note || 'Không có ghi chú chi tiết.'}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                                  <span style={{ fontSize: '9.5px', color: '#64748b' }}>
                                    {defect.createdAt ? formatDateTime(defect.createdAt) : 'Phiên kiểm tra hiện tại'}
                                  </span>

                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const code = (canonicalKey || defect.vehiclePartCode) as VehiclePartId;
                                        setSelectedPartKey(code);
                                        selectVehiclePart(code);
                                        selectVehiclePartCode(code);
                                      }}
                                      style={{
                                        background: 'rgba(0, 242, 254, 0.12)',
                                        border: '1px solid rgba(0, 242, 254, 0.35)',
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        color: '#00f2fe',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      <Eye size={11} />
                                      <span>Xem trên 3D</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenProposalForDefect(defect)}
                                      style={{
                                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '4px 9px',
                                        color: '#ffffff',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                                      }}
                                    >
                                      <Wrench size={11} />
                                      <span>GỬI ĐỀ XUẤT SỬA CHỮA</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Danh sách hư hỏng vật lý cần xử lý */}
                    <div
                      style={{
                        background: 'rgba(10, 25, 47, 0.75)',
                        borderRadius: '12px',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingBottom: '8px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={13} color="#f59e0b" />
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.03em' }}>
                            DANH SÁCH HƯ HỎNG CẦN XỬ LÝ
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            color: unresolvedDamages.length > 0 ? '#ef4444' : '#10b981',
                            background: unresolvedDamages.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            padding: '2px 7px',
                            borderRadius: '10px',
                            border: `1px solid ${unresolvedDamages.length > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                          }}
                        >
                          {unresolvedDamages.length} HƯ HỎNG
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

                          {/* Thông tin phương tiện & Nhóm đồng sở hữu */}
                          <div
                            style={{
                              background: 'rgba(15, 23, 42, 0.75)',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '6px',
                              fontSize: '10.5px',
                            }}
                          >
                            <div>
                              <span style={{ color: '#94a3b8' }}>Phương tiện: </span>
                              <strong style={{ color: '#ffffff' }}>{vehicle.name} ({vehicle.licensePlate})</strong>
                            </div>
                            <div>
                              <span style={{ color: '#94a3b8' }}>Dòng xe: </span>
                              <span style={{ color: '#38bdf8' }}>{vehicle.brand} {vehicle.model}</span>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <span style={{ color: '#94a3b8' }}>Cơ chế biểu quyết: </span>
                              <span style={{ color: '#fbbf24', fontWeight: 600 }}>Nhóm đồng sở hữu (&gt; 50% số lượng thành viên &amp; cổ phần)</span>
                            </div>
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

                      {/* Unmapped Damage Subsection if any */}
                      {unmappedDamages.length > 0 && (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px dashed rgba(239, 68, 68, 0.4)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <AlertTriangle size={12} />
                            <span>HƯ HỎNG NGOÀI PHẠM VI 3D (CHƯA ĐỊNH VỊ 3D) — {unmappedDamages.length} MỤC</span>
                          </div>
                          {unmappedDamages.map((ud: any) => (
                            <div
                              key={ud.id}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                fontSize: '10px',
                                color: '#cbd5e1',
                              }}
                            >
                              <div style={{ fontWeight: 700, color: '#ffffff' }}>
                                Mã: #{ud.id.slice(0, 8)} • Bộ phận: <code>{ud.vehiclePartCode || 'N/A'}</code> ({ud.damageType})
                              </div>
                              <div>{ud.note || ud.description || 'Không có mô tả chi tiết'}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Section B Empty State */}
                      {!isDamagesError && unresolvedDamages.length === 0 && (
                        <div
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'rgba(15, 32, 60, 0.35)',
                            border: '1px dashed rgba(16, 185, 129, 0.25)',
                            textAlign: 'center',
                            color: '#94a3b8',
                            fontSize: '10.5px',
                          }}
                        >
                          Không có khiếm khuyết hư hỏng nào chưa xử lý từ kiểm tra 3D.
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
                              border: `1px solid ${linkedMaint
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
                                  border: `1px solid ${linkedMaint.status === 'APPROVED'
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
                                        {isSubmittingProposal === d.id ? (
                                          <EVCarLoader variant="button" message="ĐANG GỬI..." />
                                        ) : (
                                          <>
                                            <Send size={12} />
                                            <span>GỬI ĐỀ XUẤT CHO NHÓM</span>
                                          </>
                                        )}
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

                    {/* Empty state for Tab 1: CẦN XỬ LÝ */}
                    {activeSessionDefects.length === 0 && unresolvedDamages.length === 0 && (
                      <div
                        style={{
                          padding: '20px 16px',
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px dashed rgba(16, 185, 129, 0.35)',
                          textAlign: 'center',
                          color: '#cbd5e1',
                          fontSize: '11px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle2 size={24} color="#10b981" />
                        <span style={{ fontWeight: 700, color: '#ffffff' }}>Phương tiện đạt chuẩn kỹ thuật tốt</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                          Không có khiếm khuyết chờ xác nhận từ kiểm tra 3D và không có hư hỏng kỹ thuật chưa xử lý.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ====================================================
                    TAB 2: ĐỀ XUẤT & SỬA CHỮA
                    ==================================================== */}
                {maintenanceTab === 'IN_PROGRESS' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* SECTION A: ĐỀ XUẤT ĐÃ DUYỆT — CHỜ TIẾP NHẬN */}
                    {sectionA_approvedWaiting.length > 0 && (
                      <div
                        style={{
                          background: 'rgba(10, 25, 47, 0.75)',
                          borderRadius: '12px',
                          border: '1px solid rgba(0, 242, 254, 0.25)',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingBottom: '8px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={13} color="#00f2fe" />
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.03em' }}>
                              ĐỀ XUẤT ĐÃ DUYỆT — CHỜ TIẾP NHẬN
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              color: '#f59e0b',
                              background: 'rgba(245, 158, 11, 0.15)',
                              padding: '2px 7px',
                              borderRadius: '10px',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                            }}
                          >
                            {sectionA_approvedWaiting.length} CHỜ TIẾP NHẬN
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {sectionA_approvedWaiting.map((item) => {
                            const categoryLabel =
                              item.proposalTypeVietnamese ||
                              (item.proposalType === 'MAINTENANCE' ? 'BẢO DƯỠNG ĐỊNH KỲ' : 'SỬA CHỮA HƯ HỎNG');
                            const budgetNum = item.approvedBudget || item.estimatedAmount || 0;

                            return (
                              <div
                                key={item.proposalId}
                                style={{
                                  padding: '12px',
                                  borderRadius: '10px',
                                  background: 'rgba(15, 23, 42, 0.85)',
                                  border: '1px solid rgba(245, 158, 11, 0.4)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      fontWeight: 800,
                                      color: '#38bdf8',
                                      background: 'rgba(56, 189, 248, 0.15)',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid rgba(56, 189, 248, 0.3)',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.04em',
                                    }}
                                  >
                                    {categoryLabel}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      fontWeight: 800,
                                      color: '#f59e0b',
                                      background: 'rgba(245, 158, 11, 0.15)',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid rgba(245, 158, 11, 0.35)',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    CHỜ TIẾP NHẬN
                                  </span>
                                </div>

                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', marginBottom: '3px' }}>
                                    {item.title}
                                  </div>
                                  <div style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: '1.4' }}>
                                    {item.description}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '6px',
                                    background: 'rgba(0, 0, 0, 0.25)',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                  }}
                                >
                                  <div>
                                    <span style={{ color: '#94a3b8' }}>Phương tiện: </span>
                                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                                      {item.vehicleName || vehicle.name} ({item.vehicleLicensePlate || vehicle.licensePlate})
                                    </span>
                                  </div>
                                  <div>
                                    <span style={{ color: '#94a3b8' }}>Người đề xuất: </span>
                                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                                      {item.creatorName || 'Cổ đông'}
                                    </span>
                                  </div>
                                  <div>
                                    <span style={{ color: '#94a3b8' }}>Mã biểu quyết: </span>
                                    <span style={{ color: '#10b981', fontWeight: 700 }}>
                                      #{item.proposalId.slice(0, 8)} (ĐÃ PHÊ DUYỆT)
                                    </span>
                                  </div>
                                  <div>
                                    <span style={{ color: '#94a3b8' }}>Ngân sách duyệt: </span>
                                    <span style={{ color: '#fbbf24', fontWeight: 800 }}>
                                      {budgetNum.toLocaleString('vi-VN')} VND
                                    </span>
                                  </div>
                                  {item.approvedAt && (
                                    <div>
                                      <span style={{ color: '#94a3b8' }}>Thời gian duyệt: </span>
                                      <span style={{ color: '#cbd5e1' }}>{formatDateTime(item.approvedAt)}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span style={{ color: '#94a3b8' }}>Phụ trách: </span>
                                    <span style={{ color: '#cbd5e1' }}>
                                      {item.executedByStaffName || 'Chưa phân công'}
                                    </span>
                                  </div>
                                  {(item.damageRecordsCount ?? 0) > 0 && (
                                    <div style={{ gridColumn: 'span 2' }}>
                                      <span style={{ color: '#94a3b8' }}>Vết hư hại liên kết: </span>
                                      <span style={{ color: '#f87171', fontWeight: 600 }}>
                                        {item.damageRecordsCount} vết hư hại kỹ thuật
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAcceptApprovedWork(item)}
                                  disabled={isAcceptingWorkId === item.proposalId}
                                  style={{
                                    width: '100%',
                                    marginTop: '4px',
                                    padding: '8px 12px',
                                    borderRadius: '7px',
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    cursor: isAcceptingWorkId === item.proposalId ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    boxShadow: '0 3px 10px rgba(2, 132, 199, 0.3)',
                                  }}
                                >
                                  <Wrench size={13} />
                                  <span>
                                    {isAcceptingWorkId === item.proposalId
                                      ? 'ĐANG TIẾP NHẬN...'
                                      : 'TIẾP NHẬN CÔNG VIỆC'}
                                  </span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* SECTION B: TIẾN TRÌNH THỰC HIỆN BẢO DƯỠNG */}
                    <div
                      style={{
                        background: 'rgba(10, 25, 47, 0.75)',
                        borderRadius: '12px',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingBottom: '8px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Play size={13} color="#38bdf8" />
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.03em' }}>
                            TIẾN TRÌNH THỰC HIỆN BẢO DƯỠNG
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            color: sectionC_inProgress.length > 0 ? '#38bdf8' : '#94a3b8',
                            background: sectionC_inProgress.length > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            padding: '2px 7px',
                            borderRadius: '10px',
                            border: `1px solid ${sectionC_inProgress.length > 0 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                          }}
                        >
                          {sectionC_inProgress.length} ĐANG LÀM
                        </span>
                      </div>

                      {sectionC_inProgress.length === 0 ? (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: 'rgba(15, 32, 60, 0.35)',
                            border: '1px dashed rgba(255, 255, 255, 0.1)',
                            textAlign: 'center',
                            color: '#94a3b8',
                            fontSize: '10.5px',
                          }}
                        >
                          Không có công việc bảo dưỡng nào đang trong tiến trình thực hiện.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {sectionC_inProgress.map((item) => {
                            const isAccepted = item.workStatus === 'ACCEPTED';
                            const budgetNum = item.approvedBudget || item.estimatedAmount || 0;

                            return (
                              <div
                                key={item.proposalId}
                                style={{
                                  padding: '12px',
                                  borderRadius: '10px',
                                  background: 'rgba(15, 23, 42, 0.85)',
                                  border: `1px solid ${isAccepted ? 'rgba(0, 242, 254, 0.4)' : 'rgba(96, 165, 250, 0.4)'}`,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{item.title}</span>
                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      fontWeight: 800,
                                      color: isAccepted ? '#00f2fe' : '#60a5fa',
                                      background: isAccepted ? 'rgba(0, 242, 254, 0.15)' : 'rgba(96, 165, 250, 0.15)',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                    }}
                                  >
                                    {isAccepted ? 'ĐÃ TIẾP NHẬN' : 'ĐANG BẢO DƯỠNG'}
                                  </span>
                                </div>

                                <div style={{ fontSize: '10.5px', color: '#cbd5e1' }}>{item.description}</div>

                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                  Ngân sách phê duyệt: <strong style={{ color: '#fbbf24' }}>{budgetNum.toLocaleString('vi-VN')} VND</strong>
                                  {item.executedByStaffName && ` • Phụ trách: ${item.executedByStaffName}`}
                                </div>

                                {/* Action: Start if accepted */}
                                {isAccepted && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartApprovedWork(item)}
                                    disabled={isStartingWorkId === item.proposalId}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      borderRadius: '7px',
                                      background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
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
                                    <Play size={13} />
                                    <span>{isStartingWorkId === item.proposalId ? 'ĐANG KHỞI ĐỘNG...' : 'BẮT ĐẦU THỰC HIỆN'}</span>
                                  </button>
                                )}

                                {/* Action: Complete if IN_PROGRESS */}
                                {!isAccepted && (
                                  <div style={{ marginTop: '2px' }}>
                                    {completingApprovedWorkId === item.proposalId ? (
                                      <div
                                        style={{
                                          padding: '10px',
                                          borderRadius: '8px',
                                          background: 'rgba(0, 0, 0, 0.4)',
                                          border: '1px solid rgba(16, 185, 129, 0.35)',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '6px',
                                        }}
                                      >
                                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#34d399' }}>
                                          HOÀN THÀNH BẢO DƯỠNG & QUYẾT TOÁN
                                        </div>
                                        <input
                                          type="text"
                                          placeholder={`Chi phí thực tế (tối đa ${budgetNum.toLocaleString('vi-VN')} VND)...`}
                                          value={approvedWorkActualCost}
                                          onChange={(e) => setApprovedWorkActualCost(e.target.value)}
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
                                          value={approvedWorkCompletionNote}
                                          onChange={(e) => setApprovedWorkCompletionNote(e.target.value)}
                                          style={{
                                            padding: '6px 8px',
                                            borderRadius: '6px',
                                            background: '#071426',
                                            color: '#ffffff',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            fontSize: '11px',
                                          }}
                                        />
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                          <button
                                            type="button"
                                            onClick={() => handleCompleteApprovedWork(item)}
                                            disabled={isCompletingApprovedWork}
                                            style={{
                                              flex: 1,
                                              padding: '7px 10px',
                                              borderRadius: '6px',
                                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                              border: 'none',
                                              color: '#ffffff',
                                              fontSize: '11px',
                                              fontWeight: 800,
                                              cursor: 'pointer',
                                            }}
                                          >
                                            {isCompletingApprovedWork ? 'ĐANG LƯU...' : 'XÁC NHẬN HOÀN THÀNH BẢO DƯỠNG'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setCompletingApprovedWorkId(null)}
                                            style={{
                                              padding: '7px 10px',
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
                                        onClick={() => {
                                          setCompletingApprovedWorkId(item.proposalId);
                                          setApprovedWorkActualCost(String(budgetNum));
                                          setApprovedWorkCompletionNote('Đã hoàn thành bảo dưỡng kỹ thuật theo đúng phê duyệt.');
                                        }}
                                        style={{
                                          width: '100%',
                                          padding: '8px 12px',
                                          borderRadius: '7px',
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
                                        }}
                                      >
                                        <CheckCircle2 size={13} />
                                        <span>HOÀN THÀNH BẢO DƯỠNG</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* SECTION C: TIẾN TRÌNH & VÒNG ĐỜI ĐỀ XUẤT SỬA CHỮA */}
                    <div
                      style={{
                        background: 'rgba(10, 25, 47, 0.75)',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 242, 254, 0.25)',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingBottom: '8px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={13} color="#00f2fe" />
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.03em' }}>
                            TIẾN TRÌNH & VÒNG ĐỜI ĐỀ XUẤT SỬA CHỮA ({maintenanceList.length})
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.15)',
                            padding: '2px 7px',
                            borderRadius: '10px',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                          }}
                        >
                          NGƯỠNG PHÊ DUYỆT 50%
                        </span>
                      </div>

                      {maintenanceList.length === 0 ? (
                        <div
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'rgba(15, 32, 60, 0.35)',
                            border: '1px dashed rgba(255, 255, 255, 0.1)',
                            textAlign: 'center',
                            color: '#94a3b8',
                            fontSize: '10.5px',
                          }}
                        >
                          Chưa có đề xuất bảo dưỡng / sửa chữa nào được tạo cho phương tiện này.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {maintenanceList.map((m) => {
                            const isPendingApproval = m.status === 'PENDING_APPROVAL' || m.status === 'PENDING';
                            const isApproved = m.status === 'APPROVED' || m.status === 'ACCEPTED';
                            const isRejected = m.status === 'REJECTED';
                            const isInProgress = m.status === 'IN_PROGRESS';
                            const isScheduled = m.status === 'SCHEDULED';
                            const isCompleted = m.status === 'COMPLETED';

                            const statusLabelVi = isPendingApproval
                              ? 'Chờ biểu quyết'
                              : isApproved
                                ? 'Đã phê duyệt'
                                : isRejected
                                  ? 'Không được thông qua'
                                  : isInProgress
                                    ? 'Đang sửa chữa'
                                    : isScheduled
                                      ? 'Chờ xác minh'
                                      : isCompleted
                                        ? 'Đã hoàn thành'
                                        : m.status;

                            const statusColor = isPendingApproval
                              ? '#fbbf24'
                              : isApproved
                                ? '#10b981'
                                : isRejected
                                  ? '#ef4444'
                                  : isInProgress
                                    ? '#f59e0b'
                                    : isScheduled
                                      ? '#38bdf8'
                                      : isCompleted
                                        ? '#10b981'
                                        : '#94a3b8';

                            const statusBg = `${statusColor}20`;
                            const statusBorder = `${statusColor}50`;

                            const voteProgress = m.approvedWeight != null ? m.approvedWeight : 0;
                            const estimatedCostStr =
                              m.estimatedCost != null ? `${Number(m.estimatedCost).toLocaleString('vi-VN')} VND` : 'Chưa dự toán';
                            const actualCostStr =
                              isCompleted && m.completionNote
                                ? m.completionNote
                                : isCompleted
                                  ? 'Đã quyết toán'
                                  : 'Chưa phát sinh';

                            const linkedDamageCount = m.damageRecords?.length || m.damageRecordIds?.length || 0;

                            return (
                              <div
                                key={m.id}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: '10px',
                                  background: 'rgba(15, 23, 42, 0.85)',
                                  border: `1px solid ${statusBorder}`,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                  <div>
                                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff' }}>
                                      {m.title}
                                    </div>
                                    <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>
                                      Người tạo: <span style={{ color: '#f8fafc', fontWeight: 600 }}>{m.createdByName || 'Nhân viên kỹ thuật'}</span>
                                      {m.createdAt ? ` • ${formatDateTime(m.createdAt)}` : ''}
                                    </div>
                                  </div>

                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      fontWeight: 800,
                                      color: statusColor,
                                      background: statusBg,
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      border: `1px solid ${statusBorder}`,
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {statusLabelVi}
                                  </span>
                                </div>

                                {/* Financial & Voting Progress Meta */}
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '6px',
                                    background: 'rgba(0, 0, 0, 0.25)',
                                    padding: '6px 8px',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                  }}
                                >
                                  <div>
                                    <span style={{ color: '#94a3b8' }}>Dự toán: </span>
                                    <strong style={{ color: '#fbbf24' }}>{estimatedCostStr}</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: '#94a3b8' }}>Thực tế: </span>
                                    <span style={{ color: isCompleted ? '#34d399' : '#94a3b8' }}>{actualCostStr}</span>
                                  </div>
                                  <div style={{ gridColumn: 'span 2' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                      <span style={{ color: '#94a3b8' }}>Tiến độ biểu quyết:</span>
                                      <strong style={{ color: voteProgress >= 50 ? '#10b981' : '#fbbf24' }}>
                                        {voteProgress.toFixed(1)}% / 50.0% (Cần &gt; 50%)
                                      </strong>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                      <div
                                        style={{
                                          height: '100%',
                                          width: `${Math.min(100, (voteProgress / 50) * 100)}%`,
                                          background: voteProgress >= 50 ? '#10b981' : '#fbbf24',
                                          transition: 'width 0.3s ease',
                                        }}
                                      />
                                    </div>
                                  </div>
                                  {linkedDamageCount > 0 && (
                                    <div style={{ gridColumn: 'span 2', color: '#f87171', fontSize: '9.5px' }}>
                                      Vết hư hại liên kết: {linkedDamageCount} bộ phận ({m.damageRecords?.map((dr) => dr.vehiclePartCode).join(', ') || 'Chi tiết trong hồ sơ'})
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Empty state for Tab 2 */}
                    {sectionA_approvedWaiting.length === 0 &&
                      sectionC_inProgress.length === 0 &&
                      maintenanceList.length === 0 && (
                        <div
                          style={{
                            padding: '20px 16px',
                            borderRadius: '12px',
                            background: 'rgba(56, 189, 248, 0.08)',
                            border: '1px dashed rgba(56, 189, 248, 0.35)',
                            textAlign: 'center',
                            color: '#cbd5e1',
                            fontSize: '11px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <CheckCircle2 size={24} color="#38bdf8" />
                          <span style={{ fontWeight: 700, color: '#ffffff' }}>Không có đề xuất hoặc công việc sửa chữa đang tiến hành</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            Mọi đề xuất đã được giải quyết hoặc chưa phát sinh nhu cầu sửa chữa mới.
                          </span>
                        </div>
                      )}
                  </div>
                )}

                {/* ====================================================
                  TAB 3: LỊCH SỬ BẢO DƯỠNG (COMPACT & EXPANDABLE LIST)
                  ==================================================== */}
                {maintenanceTab === 'HISTORY' && (
                  <div
                    style={{
                      background: 'rgba(10, 25, 47, 0.75)',
                      borderRadius: '12px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '8px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} color="#10b981" />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', letterSpacing: '0.03em' }}>
                          LỊCH SỬ BẢO DƯỠNG & SỬA CHỮA
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: '#10b981',
                          background: 'rgba(16, 185, 129, 0.15)',
                          padding: '2px 7px',
                          borderRadius: '10px',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        {sectionD_completedWorks.length + sectionD_resolvedDamages.length} HOÀN TẤT
                      </span>
                    </div>

                    {sectionD_completedWorks.length === 0 && sectionD_resolvedDamages.length === 0 ? (
                      <div
                        style={{
                          padding: '20px 12px',
                          borderRadius: '8px',
                          background: 'rgba(15, 32, 60, 0.35)',
                          border: '1px dashed rgba(255, 255, 255, 0.1)',
                          textAlign: 'center',
                          color: '#94a3b8',
                          fontSize: '11px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Clock size={20} color="#10b981" />
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Chưa có lịch sử bảo dưỡng hoàn tất</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                          Các công việc bảo dưỡng và sửa chữa sau khi nghiệm thu sẽ được lưu trữ tại đây.
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {/* Completed Works (Compact & Expandable) */}
                        {sectionD_completedWorks.map((cw) => {
                          const isExpanded = expandedHistoryId === cw.proposalId;
                          const costStr =
                            cw.actualCost != null
                              ? `${Number(cw.actualCost).toLocaleString('vi-VN')} VND`
                              : (cw.approvedBudget != null
                                ? `${Number(cw.approvedBudget).toLocaleString('vi-VN')} VND (Duyệt)`
                                : null);

                          return (
                            <div
                              key={cw.proposalId}
                              onClick={() => setExpandedHistoryId(isExpanded ? null : cw.proposalId)}
                              style={{
                                borderRadius: '8px',
                                background: 'rgba(15, 23, 42, 0.75)',
                                border: isExpanded ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  padding: '9px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                }}
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {cw.title}
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{cw.executionCompletedAt ? formatDateTime(cw.executionCompletedAt) : (cw.approvedAt ? formatDateTime(cw.approvedAt) : 'Đã nghiệm thu')}</span>
                                    {costStr && <span>• Chi phí: <strong style={{ color: '#34d399' }}>{costStr}</strong></span>}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      fontWeight: 800,
                                      color: '#10b981',
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                    }}
                                  >
                                    ĐÃ HOÀN THÀNH
                                  </span>
                                  <ChevronRight
                                    size={14}
                                    color="#94a3b8"
                                    style={{
                                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                                      transition: 'transform 0.15s ease',
                                    }}
                                  />
                                </div>
                              </div>

                              {isExpanded && (
                                <div
                                  style={{
                                    padding: '10px 12px',
                                    background: 'rgba(0, 0, 0, 0.35)',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    fontSize: '10.5px',
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div style={{ color: '#cbd5e1', lineHeight: 1.4 }}>
                                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Mô tả phương án: </span>
                                    {cw.description || 'Không có mô tả chi tiết.'}
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '2px' }}>
                                    <div>
                                      <span style={{ color: '#94a3b8' }}>Mã đề xuất: </span>
                                      <span style={{ color: '#00f2fe', fontWeight: 700 }}>#{cw.proposalId.slice(0, 8)}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: '#94a3b8' }}>Ngân sách duyệt: </span>
                                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>{(cw.approvedBudget || 0).toLocaleString('vi-VN')} VND</span>
                                    </div>
                                    <div>
                                      <span style={{ color: '#94a3b8' }}>Nhân viên phụ trách: </span>
                                      <span style={{ color: '#ffffff', fontWeight: 600 }}>{cw.executedByStaffName || 'Nhân viên vận hành'}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: '#94a3b8' }}>Chi phí thực tế: </span>
                                      <span style={{ color: '#34d399', fontWeight: 800 }}>{(cw.actualCost || cw.approvedBudget || 0).toLocaleString('vi-VN')} VND</span>
                                    </div>
                                  </div>

                                  {cw.executionStartedAt && (
                                    <div style={{ color: '#94a3b8', fontSize: '10px' }}>
                                      Bắt đầu: {formatDateTime(cw.executionStartedAt)}
                                      {cw.executionCompletedAt && ` • Hoàn thành: ${formatDateTime(cw.executionCompletedAt)}`}
                                    </div>
                                  )}

                                  {cw.completionNote && (
                                    <div style={{ marginTop: '2px', padding: '6px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid #10b981', color: '#e2e8f0', fontSize: '10px' }}>
                                      <span style={{ color: '#10b981', fontWeight: 700 }}>Ghi chú nghiệm thu: </span>
                                      {cw.completionNote}
                                    </div>
                                  )}

                                  {cw.evidenceUrl && (
                                    <div style={{ marginTop: '2px' }}>
                                      <a
                                        href={cw.evidenceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: '#38bdf8', textDecoration: 'underline', fontSize: '10px' }}
                                      >
                                        Xem tài liệu / chứng cứ đính kèm
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Resolved Damages (Compact & Expandable) */}
                        {sectionD_resolvedDamages.map((rd: any) => {
                          const isExpanded = expandedHistoryId === rd.id;
                          const partKey = normalizeCanonicalPartCode(rd.vehiclePartCode || rd.partCode);
                          const partLabel = SEMANTIC_PART_LABELS_VI[partKey as VehiclePartId] || partKey;
                          const typeLabel = VI_DAMAGE_TYPE_LABELS[rd.damageType] || rd.damageType;

                          return (
                            <div
                              key={rd.id}
                              onClick={() => setExpandedHistoryId(isExpanded ? null : rd.id)}
                              style={{
                                borderRadius: '8px',
                                background: 'rgba(15, 23, 42, 0.75)',
                                border: isExpanded ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  padding: '9px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                }}
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {partLabel} ({typeLabel})
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                    {rd.resolvedAt ? formatDateTime(rd.resolvedAt) : (rd.updatedAt ? formatDateTime(rd.updatedAt) : 'Đã sửa chữa')}
                                    {rd.cost != null && <span> • Chi phí: <strong style={{ color: '#38bdf8' }}>{Number(rd.cost).toLocaleString('vi-VN')} VND</strong></span>}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      fontWeight: 800,
                                      color: '#38bdf8',
                                      background: 'rgba(56, 189, 248, 0.15)',
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      border: '1px solid rgba(56, 189, 248, 0.3)',
                                    }}
                                  >
                                    ĐÃ KHẮC PHỤC
                                  </span>
                                  <ChevronRight
                                    size={14}
                                    color="#94a3b8"
                                    style={{
                                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                                      transition: 'transform 0.15s ease',
                                    }}
                                  />
                                </div>
                              </div>

                              {isExpanded && (
                                <div
                                  style={{
                                    padding: '10px 12px',
                                    background: 'rgba(0, 0, 0, 0.35)',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    fontSize: '10.5px',
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div style={{ color: '#cbd5e1', lineHeight: 1.4 }}>
                                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Ghi chú kỹ thuật: </span>
                                    {rd.note || rd.description || 'Vết hư hại đã được khắc phục hoàn toàn theo kiểm định kỹ thuật.'}
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '2px' }}>
                                    <div>
                                      <span style={{ color: '#94a3b8' }}>Mức độ trước sửa: </span>
                                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>{rd.severity || 'MEDIUM'}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: '#94a3b8' }}>Vị trí kiểm tra: </span>
                                      <span style={{ color: '#ffffff', fontWeight: 600 }}>{partLabel}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                3. MODULE: BÀN GIAO XE (QUY TRÌNH 3 BƯỚC THỐNG NHẤT)
                ---------------------------------------------------- */}
            {activeModule === 'HANDOVER' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 1. Vehicle Status Warning Banners */}
                {hasPreviousCustodyUnresolved ? (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(30, 10, 15, 0.8) 100%)',
                      border: '1.5px solid rgba(239, 68, 68, 0.6)',
                      boxShadow: '0 0 16px rgba(239, 68, 68, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '11.5px',
                      color: '#fca5a5',
                      lineHeight: 1.4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 900, color: '#f87171', textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.04em' }}>
                          Xe chưa được trả bởi thành viên trước
                        </span>
                      </div>
                      {custodianDetails.isOverdue && (
                        <span style={{ fontSize: '9.5px', fontWeight: 800, background: '#ef4444', color: '#ffffff', padding: '2px 8px', borderRadius: '999px' }}>
                          QUÁ HẠN TRẢ XE
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '6px',
                        fontSize: '10.5px',
                      }}
                    >
                      <div>
                        <span style={{ color: '#94a3b8' }}>Người đang giữ xe: </span>
                        <strong style={{ color: '#ffffff' }}>{custodianDetails.name}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8' }}>Mã lịch đặt: </span>
                        <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                          {custodianDetails.bookingRef ? `#${custodianDetails.bookingRef.slice(0, 8).toUpperCase()}` : 'N/A'}
                        </strong>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: '#94a3b8' }}>Thời gian dự kiến trả: </span>
                        <strong style={{ color: custodianDetails.isOverdue ? '#f87171' : '#cbd5e1' }}>
                          {custodianDetails.returnTime ? formatDateTime(custodianDetails.returnTime) : 'Đang sử dụng'}
                        </strong>
                      </div>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#fca5a5' }}>
                      Phương tiện hiện đang trong sự quản lý của thành viên trước. Chỉ được bàn giao cho lịch đặt tiếp theo sau khi xe được trả và xác minh hợp lệ.
                    </div>
                  </div>
                ) : isVehicleInUse ? (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1.5px solid rgba(239, 68, 68, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '11.5px',
                      color: '#fca5a5',
                      fontWeight: 600,
                      lineHeight: 1.4,
                    }}
                  >
                    <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 800, color: '#f87171', textTransform: 'uppercase', fontSize: '11px', marginBottom: '2px' }}>
                        Phương tiện đang được sử dụng
                      </div>
                      <span>Xe đang được sử dụng. Có thể xem lịch đặt sắp tới. Chỉ được bàn giao sau khi xe được trả và xác minh hợp lệ.</span>
                    </div>
                  </div>
                ) : null}

                {currentVehicle.status === 'MAINTENANCE' && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1.5px solid rgba(245, 158, 11, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '11.5px',
                      color: '#fde68a',
                      fontWeight: 600,
                      lineHeight: 1.4,
                    }}
                  >
                    <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', fontSize: '11px', marginBottom: '2px' }}>
                        Phương tiện đang bảo dưỡng
                      </div>
                      <span>Xe đang trong quá trình bảo dưỡng kỹ thuật. Chỉ được bàn giao sau khi hoàn tất bảo dưỡng và kiểm định đạt chuẩn.</span>
                    </div>
                  </div>
                )}

                {currentVehicle.status === 'CHARGING' && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1.5px solid rgba(56, 189, 248, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '11.5px',
                      color: '#bae6fd',
                      fontWeight: 600,
                      lineHeight: 1.4,
                    }}
                  >
                    <Battery size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', fontSize: '11px', marginBottom: '2px' }}>
                        Phương tiện đang sạc điện
                      </div>
                      <span>Xe đang được nạp điện tại trạm. Đảm bảo mức pin &ge; 20% và rút cáp sạc an toàn trước khi tiến hành bàn giao.</span>
                    </div>
                  </div>
                )}

                {/* 2. Organized Booking Selector Queue */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {validActiveHandovers.length > 0 ? (
                    <>
                      {/* Informative banner when upcoming bookings exist but none are in immediate handover window */}
                      {eligibleHandovers.length === 0 && upcomingHandovers.length > 0 && (
                        <div
                          style={{
                            padding: '9px 12px',
                            borderRadius: '10px',
                            background: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '11px',
                            color: '#bae6fd',
                          }}
                        >
                          <Clock size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
                          <span>Chưa đến thời gian bàn giao. Quy trình kiểm tra &amp; giao xe mở trước 2 giờ.</span>
                        </div>
                      )}

                      {/* Section A: LỊCH CẦN BÀN GIAO (Currently eligible) */}
                      {eligibleHandovers.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0 2px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: '#10b981',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <CheckCircle2 size={12} color="#10b981" />
                              A. LỊCH CẦN BÀN GIAO ({eligibleHandovers.length})
                            </span>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                              Trong khung giờ chuẩn bị &amp; bàn giao
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              maxHeight: '180px',
                              overflowY: 'auto',
                              paddingRight: '2px',
                            }}
                          >
                            {eligibleHandovers.map((h, idx) => {
                              const isSelected = h.bookingId === effectiveSelectedBookingId;
                              const readiness = getBookingReadinessMeta(h, vehicle.status);
                              return (
                                <div
                                  key={h.bookingId || idx}
                                  onClick={() => {
                                    setSelectedBookingId(h.bookingId || null);
                                    clearMessages();
                                  }}
                                  style={{
                                    padding: '8px 10px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    background: isSelected
                                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(15, 32, 60, 0.85) 100%)'
                                      : 'rgba(15, 32, 60, 0.6)',
                                    border: isSelected
                                      ? '1.5px solid #10b981'
                                      : '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: isSelected ? '0 0 12px rgba(16, 185, 129, 0.25)' : 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {/* Top Row: Booker Name, Ref & Readiness Badge */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <User size={12} color={isSelected ? '#10b981' : '#94a3b8'} />
                                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                                        {h.coOwnerName || 'Đồng sở hữu'}
                                      </span>
                                      <span style={{ fontSize: '9.5px', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.06)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                        #{h.bookingId ? h.bookingId.slice(0, 8).toUpperCase() : 'N/A'}
                                      </span>
                                    </div>
                                    <span
                                      style={{
                                        fontSize: '9.5px',
                                        fontWeight: 700,
                                        padding: '2px 7px',
                                        borderRadius: '9999px',
                                        background: readiness.bg,
                                        color: readiness.color,
                                        border: `1px solid ${readiness.border}`,
                                      }}
                                    >
                                      {readiness.label} · {readiness.labelVi}
                                    </span>
                                  </div>

                                  {/* Bottom Row: Date, Time & Booking Status */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      fontSize: '10.5px',
                                      color: '#94a3b8',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={11} color="#38bdf8" />
                                        <span style={{ color: '#cbd5e1' }}>{formatDate(h.bookingStartTime)}</span>
                                      </span>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={11} color="#00f2fe" />
                                        <span style={{ color: isSelected ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                                          {formatTime(h.bookingStartTime)} - {formatTime(h.bookingEndTime)}
                                        </span>
                                      </span>
                                    </div>
                                    <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 600 }}>
                                      {h.bookingStatus || 'CONFIRMED'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Section B: LỊCH SẮP TỚI (Upcoming future bookings) */}
                      {upcomingHandovers.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: eligibleHandovers.length > 0 ? '4px' : '0' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0 2px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: '#38bdf8',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <Clock size={12} color="#38bdf8" />
                              B. LỊCH SẮP TỚI ({upcomingHandovers.length})
                            </span>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                              Lịch đặt tương lai đã xác nhận
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              maxHeight: '180px',
                              overflowY: 'auto',
                              paddingRight: '2px',
                            }}
                          >
                            {upcomingHandovers.map((h, idx) => {
                              const isSelected = h.bookingId === effectiveSelectedBookingId;
                              const readiness = getBookingReadinessMeta(h, vehicle.status);
                              return (
                                <div
                                  key={h.bookingId || idx}
                                  onClick={() => {
                                    setSelectedBookingId(h.bookingId || null);
                                    clearMessages();
                                  }}
                                  style={{
                                    padding: '8px 10px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    background: isSelected
                                      ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(15, 32, 60, 0.85) 100%)'
                                      : 'rgba(15, 32, 60, 0.6)',
                                    border: isSelected
                                      ? '1.5px solid #38bdf8'
                                      : '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {/* Top Row: Booker Name, Ref & Readiness Badge */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <User size={12} color={isSelected ? '#38bdf8' : '#94a3b8'} />
                                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                                        {h.coOwnerName || 'Đồng sở hữu'}
                                      </span>
                                      <span style={{ fontSize: '9.5px', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.06)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                        #{h.bookingId ? h.bookingId.slice(0, 8).toUpperCase() : 'N/A'}
                                      </span>
                                    </div>
                                    <span
                                      style={{
                                        fontSize: '9.5px',
                                        fontWeight: 700,
                                        padding: '2px 7px',
                                        borderRadius: '9999px',
                                        background: readiness.bg,
                                        color: readiness.color,
                                        border: `1px solid ${readiness.border}`,
                                      }}
                                    >
                                      {readiness.label} · {readiness.labelVi}
                                    </span>
                                  </div>

                                  {/* Bottom Row: Date, Time & Booking Status */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      fontSize: '10.5px',
                                      color: '#94a3b8',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={11} color="#38bdf8" />
                                        <span style={{ color: '#cbd5e1' }}>{formatDate(h.bookingStartTime)}</span>
                                      </span>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={11} color="#00f2fe" />
                                        <span style={{ color: isSelected ? '#38bdf8' : '#94a3b8', fontWeight: 600 }}>
                                          {formatTime(h.bookingStartTime)} - {formatTime(h.bookingEndTime)}
                                        </span>
                                      </span>
                                    </div>
                                    <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 600 }}>
                                      {h.bookingStatus || 'CONFIRMED'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Inline empty state inside the queue section - shell stays open */
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(15, 32, 60, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="#94a3b8" />
                        <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
                          Hiện không có lịch chờ bàn giao.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          refetchHandovers();
                          refetchEligibility();
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#38bdf8',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <RefreshCw size={11} />
                        <span>Kiểm tra lại</span>
                      </button>
                    </div>
                  )}
                </div>

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

                {/* 3. UNIFIED 3-STEP WORKFLOW PRESENTATION (ALWAYS DISPLAYED) */}
                {!isLoadingHandovers && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {isHandoverSuccess && completedHandoverReceipt ? (
                      /* ========================================================
                         DEDICATED STAFF HANDOVER SUCCESS SCREEN
                         ======================================================== */
                      <div
                        style={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(11, 28, 54, 0.95) 100%)',
                          border: '1.5px solid rgba(16, 185, 129, 0.55)',
                          borderRadius: '16px',
                          padding: '18px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(16, 185, 129, 0.25)',
                        }}
                      >
                        {/* Header Banner */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '52px',
                              height: '52px',
                              borderRadius: '50%',
                              background: 'rgba(16, 185, 129, 0.18)',
                              border: '2px solid #10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#34d399',
                              boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                            }}
                          >
                            <CheckCircle2 size={30} />
                          </div>
                          <div>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: '16px',
                                fontWeight: 900,
                                color: '#34d399',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                              }}
                            >
                              BÀN GIAO XE THÀNH CÔNG
                            </h3>
                            <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#cbd5e1' }}>
                              Biên bản bàn giao đã được ghi nhận vào hệ thống.
                            </p>
                          </div>

                          {/* Next State Operational Badge */}
                          <div
                            style={{
                              background: 'rgba(168, 85, 247, 0.2)',
                              border: '1px solid rgba(168, 85, 247, 0.5)',
                              borderRadius: '999px',
                              padding: '5px 14px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#c084fc',
                              fontSize: '11px',
                              fontWeight: 800,
                              letterSpacing: '0.02em',
                              marginTop: '2px',
                            }}
                          >
                            <Clock size={13} color="#c084fc" />
                            <span>Chờ đồng sở hữu bắt đầu chuyến đi</span>
                          </div>
                        </div>

                        {/* Persisted Handover Receipt Grid */}
                        <div
                          style={{
                            background: 'rgba(11, 28, 54, 0.85)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '7px',
                            fontSize: '11px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <span style={{ color: '#94a3b8' }}>Mã biên bản:</span>
                            <span style={{ color: '#00f2fe', fontWeight: 800, fontFamily: 'monospace' }}>
                              #{completedHandoverReceipt.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Mã lịch đặt:</span>
                            <span style={{ color: '#ffffff', fontWeight: 700, fontFamily: 'monospace' }}>
                              #{completedHandoverReceipt.bookingId.slice(0, 8).toUpperCase()}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                            <span style={{ color: '#ffffff', fontWeight: 700 }}>
                              {completedHandoverReceipt.vehicleName || vehicle.name} ({completedHandoverReceipt.vehicleCode || vehicle.vehicleCode || 'EV01'})
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Biển số xe:</span>
                            <span style={{ color: '#00f2fe', fontWeight: 800 }}>
                              {completedHandoverReceipt.licensePlate || vehicle.licensePlate}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Người nhận xe:</span>
                            <span style={{ color: '#ffffff', fontWeight: 800 }}>
                              {completedHandoverReceipt.coOwnerName || eligibility?.recipientName || 'Đồng sở hữu'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Nhân viên bàn giao:</span>
                            <span style={{ color: '#ffffff', fontWeight: 700 }}>
                              {completedHandoverReceipt.staffName || user?.fullName || 'Nhân viên EVShare'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Khung giờ đặt xe:</span>
                            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                              {formatDate(completedHandoverReceipt.bookingStartTime)} ({formatTime(completedHandoverReceipt.bookingStartTime)} – {formatTime(completedHandoverReceipt.bookingEndTime)})
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Thời điểm bàn giao:</span>
                            <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                              {formatDateTime(completedHandoverReceipt.staffHandedOverAt || new Date().toISOString())}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Pin khi bàn giao (SOC):</span>
                            <span style={{ color: (completedHandoverReceipt.startBatteryLevel ?? vehicle.currentBatteryLevel ?? 0) >= 20 ? '#34d399' : '#f87171', fontWeight: 800 }}>
                              {completedHandoverReceipt.startBatteryLevel ?? vehicle.currentBatteryLevel ?? 0}%
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Odometer khi giao:</span>
                            <span style={{ color: '#ffffff', fontWeight: 700 }}>
                              {((completedHandoverReceipt.startOdometer ?? vehicle.odometer ?? 0)).toLocaleString('vi-VN')} km
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#94a3b8' }}>Kiểm tra kỹ thuật:</span>
                            <span style={{ color: '#34d399', fontWeight: 800, fontSize: '10px' }}>
                              {completedHandoverReceipt.allCheckpointsInspected ? '8/8 ĐIỂM ĐẠT CHUẨN' : (latestCompletedInspection?.overallResult === 'PASS' ? 'ĐẠT TIÊU CHUẨN (PASS)' : 'ĐẠT (PASS)')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#94a3b8' }}>Ghi nhận hư hỏng:</span>
                            <span style={{ color: unresolvedDamages.length === 0 ? '#34d399' : '#fbbf24', fontWeight: 700, fontSize: '10px' }}>
                              {unresolvedDamages.length === 0 ? '0 khiếm khuyết (Đạt chuẩn an toàn)' : `${unresolvedDamages.length} khiếm khuyết được ghi nhận`}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setShowStaffReceiptModal(true)}
                            style={{
                              width: '100%',
                              padding: '11px',
                              borderRadius: '9px',
                              background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                              border: 'none',
                              color: '#080c16',
                              fontSize: '12px',
                              fontWeight: 900,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '7px',
                              boxShadow: '0 4px 16px rgba(0, 242, 254, 0.4)',
                            }}
                          >
                            <FileText size={15} />
                            <span>XEM BIÊN BẢN BÀN GIAO</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleAcknowledgeSuccessAndReturn}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '9px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.18)',
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
                            <RotateCcw size={13} />
                            <span>QUAY LẠI DANH SÁCH BÀN GIAO</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
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
                            {currentHandover ? (
                              /* Booking & Recipient Card */
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
                                    if (isHandoverTooEarly) {
                                      return (
                                        <span
                                          style={{
                                            fontSize: '10px',
                                            fontWeight: 800,
                                            padding: '3px 8px',
                                            borderRadius: '9999px',
                                            background: 'rgba(56, 189, 248, 0.15)',
                                            color: '#38bdf8',
                                            border: '1px solid rgba(56, 189, 248, 0.4)',
                                            letterSpacing: '0.03em',
                                          }}
                                        >
                                          ĐÃ XÁC NHẬN (SẮP DIỄN RA)
                                        </span>
                                      );
                                    }
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

                                {isHandoverTooEarly && (
                                  <div
                                    style={{
                                      padding: '8px 10px',
                                      borderRadius: '8px',
                                      background: 'rgba(245, 158, 11, 0.12)',
                                      border: '1px solid rgba(245, 158, 11, 0.35)',
                                      color: '#fbbf24',
                                      fontSize: '10.5px',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                    }}
                                  >
                                    <Clock size={13} />
                                    <span>Chưa đến thời gian bàn giao xe (chỉ bàn giao trước tối đa 2 giờ so với lịch đặt).</span>
                                  </div>
                                )}

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
                            ) : (
                              /* Informative fallback when no booking is selected / eligible */
                              <div
                                style={{
                                  background: 'rgba(15, 32, 60, 0.75)',
                                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                                  borderRadius: '14px',
                                  padding: '14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileText size={14} color="#94a3b8" />
                                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                      HỒ SƠ ĐẶT XE
                                    </span>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: '9999px',
                                      background: 'rgba(148, 163, 184, 0.15)',
                                      color: '#94a3b8',
                                      border: '1px solid rgba(148, 163, 184, 0.3)',
                                    }}
                                  >
                                    CHƯA CHỌN LỊCH
                                  </span>
                                </div>

                                <div
                                  style={{
                                    background: 'rgba(11, 28, 54, 0.8)',
                                    borderRadius: '10px',
                                    padding: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    fontSize: '11px',
                                    color: '#cbd5e1',
                                  }}
                                >
                                  <div style={{ fontWeight: 600, color: '#ffffff' }}>
                                    {isVehicleInUse
                                      ? 'Phương tiện hiện đang được sử dụng. Bạn vẫn có thể xem tình trạng kỹ thuật của xe ở Bước 2.'
                                      : 'Không có lịch đặt xe nào đang được chọn hoặc xe chưa có lịch chờ bàn giao.'}
                                  </div>
                                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                                    Chọn một lịch đặt trong danh sách ở trên (nếu có) hoặc xem hồ sơ kỹ thuật xe bên dưới.
                                  </div>
                                </div>
                              </div>
                            )}

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
                                          {(() => {
                                            const reqTotal = latestCompletedInspection.requiredComponentCount ?? REQUIRED_HANDOVER_PARTS.length;
                                            const reqCovered = latestCompletedInspection.assessedRequiredComponentCount ?? completedRequiredCount;
                                            if (latestCompletedInspection.overallResult === 'FAIL') {
                                              return `KHÔNG ĐẠT (FAIL) (${reqCovered}/${reqTotal} hạng mục bắt buộc)`;
                                            }
                                            if (reqCovered < reqTotal) {
                                              return `CHƯA ĐỦ BỘ PHẬN (${reqCovered}/${reqTotal} hạng mục bắt buộc)`;
                                            }
                                            return `Đạt chuẩn (${reqCovered}/${reqTotal} hạng mục bắt buộc)`;
                                          })()}
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
                                      disabled={!currentHandover || isVehicleInUse}
                                      style={{
                                        width: '100%',
                                        padding: '11px 16px',
                                        borderRadius: '8px',
                                        background:
                                          !currentHandover || isVehicleInUse
                                            ? 'rgba(100, 116, 139, 0.3)'
                                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        border: 'none',
                                        color: '#ffffff',
                                        fontSize: '12.5px',
                                        fontWeight: 900,
                                        cursor: !currentHandover || isVehicleInUse ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: !currentHandover || isVehicleInUse ? 'none' : '0 4px 16px rgba(16, 185, 129, 0.4)',
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
                                      {completedRequiredCount}/{latestCompletedInspection?.requiredComponentCount ?? REQUIRED_HANDOVER_PARTS.length} bộ phận bắt buộc đạt chuẩn an toàn vận hành
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
                                  <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Biên bản kiểm tra gần nhất</div>
                                  <div style={{ fontSize: '11px', fontWeight: 800, marginTop: '2px', color: (hasValidInspection && unresolvedDamages.length === 0) ? '#34d399' : latestCompletedInspection?.overallResult === 'FAIL' ? '#f87171' : '#f59e0b' }}>
                                    {latestCompletedInspection?.overallResult === 'PASS'
                                      ? 'ĐẠT TIÊU CHUẨN'
                                      : latestCompletedInspection?.overallResult === 'PASS_WITH_NOTES'
                                        ? 'ĐẠT (CÓ LƯU Ý)'
                                        : latestCompletedInspection?.overallResult === 'FAIL'
                                          ? (unresolvedDamages.length === 0 ? 'KHÔNG ĐẠT (LỊCH SỬ — ĐÃ SỬA CHỮA XONG)' : 'KHÔNG ĐẠT')
                                          : 'CHƯA HOÀN TẤT'}
                                  </div>
                                </div>

                                {/* Checkpoint Coverage */}
                                <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                  <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Độ bao phủ bộ phận</div>
                                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                                    <strong style={{ color: completedRequiredCount >= (latestCompletedInspection?.requiredComponentCount ?? REQUIRED_HANDOVER_PARTS.length) ? '#34d399' : '#00f2fe' }}>
                                      {completedRequiredCount}
                                    </strong>
                                    /{latestCompletedInspection?.requiredComponentCount ?? REQUIRED_HANDOVER_PARTS.length} bộ phận bắt buộc
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
                                    TIÊU CHUẨN BẮT BUỘC BÀN GIAO ({completedRequiredCount}/{latestCompletedInspection?.requiredComponentCount ?? REQUIRED_HANDOVER_PARTS.length})
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

                                  const partDamage = unresolvedDamages.find(
                                    (d: any) => normalizeCanonicalPartCode(d.vehiclePartCode || d.partCode) === canonicalId
                                  );

                                  const resolvedDamage = damages.find(
                                    (d: any) => (d.status === 'RESOLVED' || d.status === 'REPAIRED') &&
                                      normalizeCanonicalPartCode(d.vehiclePartCode || d.partCode) === canonicalId
                                  );

                                  let statusLabel = 'CHƯA KIỂM TRA';
                                  let statusColor = '#94a3b8';
                                  let statusBg = 'rgba(148, 163, 184, 0.12)';
                                  let statusBorder = 'rgba(148, 163, 184, 0.3)';

                                  if (partDamage) {
                                    // Authoritative active defect
                                    statusLabel = partDamage.severity === 'SEVERE' ? 'NỨT / HỎNG' : (partDamage.damageType ? VI_DAMAGE_TYPE_LABELS[partDamage.damageType] || 'HƯ HỎNG' : 'HƯ HỎNG');
                                    statusColor = '#f87171';
                                    statusBg = 'rgba(239, 68, 68, 0.15)';
                                    statusBorder = 'rgba(239, 68, 68, 0.4)';
                                  } else if (resolvedDamage) {
                                    // Previously defective but now resolved by completed maintenance
                                    statusLabel = 'ĐÃ SỬA CHỮA (TỐT)';
                                    statusColor = '#34d399';
                                    statusBg = 'rgba(16, 185, 129, 0.15)';
                                    statusBorder = 'rgba(16, 185, 129, 0.4)';
                                  } else if (assessed) {
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
                                        // Historical crack with no active unresolved damage means it was repaired or superseded
                                        statusLabel = 'ĐÃ KHẮC PHỤC (TỐT)';
                                        statusColor = '#34d399';
                                        statusBg = 'rgba(16, 185, 129, 0.15)';
                                        statusBorder = 'rgba(16, 185, 129, 0.4)';
                                        break;
                                      default:
                                        statusLabel = 'ĐÃ KIỂM TRA';
                                        statusColor = '#38bdf8';
                                        statusBg = 'rgba(56, 189, 248, 0.15)';
                                        statusBorder = 'rgba(56, 189, 248, 0.4)';
                                        break;
                                    }
                                  }
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
                                  disabled={!currentHandover || isVehicleInUse}
                                  style={{
                                    height: '38px',
                                    borderRadius: '8px',
                                    background:
                                      !currentHandover || isVehicleInUse
                                        ? 'rgba(100, 116, 139, 0.3)'
                                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontSize: '11.5px',
                                    fontWeight: 800,
                                    cursor: !currentHandover || isVehicleInUse ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    boxShadow: !currentHandover || isVehicleInUse ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.35)',
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
                            {!currentHandover ? (
                              <div
                                style={{
                                  background: 'rgba(15, 32, 60, 0.75)',
                                  borderRadius: '14px',
                                  padding: '24px 16px',
                                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '12px',
                                  textAlign: 'center',
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
                                  <Key size={22} />
                                </div>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                                    CHƯA CHỌN LỊCH BÀN GIAO
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', maxWidth: '340px', lineHeight: 1.4 }}>
                                    {isVehicleInUse
                                      ? 'Xe đang được sử dụng. Có thể xem lịch đặt sắp tới. Chỉ được bàn giao sau khi xe được trả và xác minh hợp lệ.'
                                      : 'Vui lòng chọn một lịch đặt xe trong danh sách ở Bước 1 để thực hiện quy trình bàn giao.'}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    clearMessages();
                                    setHandoverWorkflowStep(1);
                                  }}
                                  style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    background: 'rgba(0, 242, 254, 0.15)',
                                    border: '1px solid rgba(0, 242, 254, 0.35)',
                                    color: '#00f2fe',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Quay lại Bước 1 (Hồ sơ)
                                </button>
                              </div>
                            ) : (
                              /* Handover Summary & Validation Details */
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
                                            {(() => {
                                              const reqTotal = latestCompletedInspection.requiredComponentCount ?? REQUIRED_HANDOVER_PARTS.length;
                                              const reqCovered = latestCompletedInspection.assessedRequiredComponentCount ?? completedRequiredCount;
                                              if (latestCompletedInspection.overallResult === 'FAIL') {
                                                return `KHÔNG ĐẠT (FAIL) (${reqCovered}/${reqTotal} hạng mục bắt buộc)`;
                                              }
                                              if (reqCovered < reqTotal) {
                                                return `CHƯA ĐỦ BỘ PHẬN (${reqCovered}/${reqTotal} hạng mục bắt buộc)`;
                                              }
                                              return `ĐẠT CHUẨN (${reqCovered}/${reqTotal} hạng mục bắt buộc)`;
                                            })()}
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
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

                                    {(!activeTrip || activeTrip.status !== 'ACTIVE') && (
                                      <div>
                                        <button
                                          type="button"
                                          onClick={handleRecoverVehicle}
                                          disabled={isRecoveringVehicle}
                                          style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                            border: 'none',
                                            color: '#ffffff',
                                            fontSize: '11.5px',
                                            fontWeight: 800,
                                            cursor: isRecoveringVehicle ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                                          }}
                                        >
                                          <RotateCcw size={14} />
                                          <span>{isRecoveringVehicle ? 'ĐANG THU HỒI XE...' : 'XÁC NHẬN THU HỒI XE VÀO BÃI (NO-SHOW)'}</span>
                                        </button>
                                        <div style={{ fontSize: '10px', color: '#f87171', textAlign: 'center', marginTop: '4px' }}>
                                          Thu hồi xe về bãi nếu thành viên không xuất phát đúng thời gian quy định (No-Show).
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : currentHandover.status === 'OWNER_CONFIRMED' || currentHandover.status === 'COMPLETED' ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

                                    {(!activeTrip || activeTrip.status !== 'ACTIVE') && (
                                      <div>
                                        <button
                                          type="button"
                                          onClick={handleRecoverVehicle}
                                          disabled={isRecoveringVehicle}
                                          style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                            border: 'none',
                                            color: '#ffffff',
                                            fontSize: '11.5px',
                                            fontWeight: 800,
                                            cursor: isRecoveringVehicle ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                                          }}
                                        >
                                          <RotateCcw size={14} />
                                          <span>{isRecoveringVehicle ? 'ĐANG THU HỒI XE...' : 'XÁC NHẬN THU HỒI XE VÀO BÃI (NO-SHOW)'}</span>
                                        </button>
                                        <div style={{ fontSize: '10px', color: '#f87171', textAlign: 'center', marginTop: '4px' }}>
                                          Thu hồi xe về bãi nếu thành viên không xuất phát đúng thời gian quy định (No-Show).
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button
                                      type="button"
                                      onClick={handleConfirmHandover}
                                      disabled={isProcessingHandover || isVehicleInUse || isHandoverTooEarly || !hasValidInspection || !checklistItems.keysSafety || !checklistItems.documents}
                                      style={{
                                        width: '100%',
                                        padding: '11px 16px',
                                        borderRadius: '8px',
                                        background:
                                          isProcessingHandover || isVehicleInUse || isHandoverTooEarly || !hasValidInspection || !checklistItems.keysSafety || !checklistItems.documents
                                            ? 'rgba(100, 116, 139, 0.3)'
                                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        border: 'none',
                                        color: '#ffffff',
                                        fontSize: '12.5px',
                                        fontWeight: 900,
                                        cursor:
                                          isProcessingHandover || isVehicleInUse || isHandoverTooEarly || !checklistItems.keysSafety || !checklistItems.documents
                                            ? 'not-allowed'
                                            : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: isProcessingHandover || isVehicleInUse || isHandoverTooEarly ? 'none' : '0 4px 16px rgba(16, 185, 129, 0.4)',
                                      }}
                                    >
                                      {isProcessingHandover ? (
                                        <EVCarLoader variant="button" message="ĐANG GIAO XE..." />
                                      ) : (
                                        <>
                                          <Key size={15} />
                                          <span>XÁC NHẬN BÀN GIAO XE CHO ĐỒNG SỞ HỮU</span>
                                        </>
                                      )}
                                    </button>
                                    <div style={{ fontSize: '10.5px', color: '#94a3b8', textAlign: 'center' }}>
                                      Xác nhận trao chìa khóa thực tế cho {currentHandover.coOwnerName || 'đồng sở hữu'}.
                                    </div>
                                    {isVehicleInUse && (
                                      <div style={{ fontSize: '11px', color: '#f87171', textAlign: 'center', fontWeight: 700, background: 'rgba(239, 68, 68, 0.12)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <AlertTriangle size={13} color="#f87171" />
                                        <span>
                                          {hasPreviousCustodyUnresolved
                                            ? `Xe chưa được trả bởi thành viên trước (${custodianDetails.name}). Chỉ được bàn giao sau khi xe được trả và xác minh hợp lệ.`
                                            : 'Xe đang được sử dụng. Có thể xem lịch đặt sắp tới. Chỉ được bàn giao sau khi xe được trả và xác minh hợp lệ.'}
                                        </span>
                                      </div>
                                    )}
                                    {isHandoverTooEarly && (
                                      <div style={{ fontSize: '11px', color: '#f59e0b', textAlign: 'center', fontWeight: 700, background: 'rgba(245, 158, 11, 0.12)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <Clock size={13} />
                                        <span>Chưa đến thời gian bàn giao (mở trước 2 giờ)</span>
                                      </div>
                                    )}
                                    {!hasValidInspection && (
                                      <div style={{ fontSize: '10.5px', color: '#f87171', textAlign: 'center', fontWeight: 600 }}>
                                        Xe chưa có biên bản kiểm tra đạt chuẩn (FAIL hoặc chưa đủ {latestCompletedInspection?.requiredComponentCount ?? REQUIRED_HANDOVER_PARTS.length} bộ phận bắt buộc). Vui lòng hoàn tất kiểm tra ở Bước 2 trước khi giao xe.
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
                            )}
                          </div>
                        )}
                      </>
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
                      {isConfirmingReturn ? (
                        <EVCarLoader variant="button" message="ĐANG XỬ LÝ NHẬN XE..." />
                      ) : (
                        'XÁC NHẬN HOÀN TẤT NHẬN XE & CHỐT ODO'
                      )}
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

                {/* ========================================================
                    UNIFIED STAFF 3D INSPECTION PANEL (5 STREAMLINED SECTIONS)
                    Always rendered consistently across all vehicles.
                    ======================================================== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Section A: KIỂM TRA 3D */}
                    <div
                      style={{
                        background: 'rgba(15, 32, 60, 0.75)',
                        border: '1.2px solid rgba(0, 242, 254, 0.35)',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Eye size={13} color="#00f2fe" />
                          <span style={{ fontSize: '11px', fontWeight: 900, color: '#00f2fe', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            A. TIẾN ĐỘ KIỂM TRA 3D
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
                          {inspectionProgressPercent}%
                        </span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${inspectionProgressPercent}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #00f2fe 0%, #0284c7 100%)',
                            borderRadius: '999px',
                            transition: 'width 0.25s ease',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px' }}>
                        <span style={{ color: '#cbd5e1' }}>
                          Đã đánh giá: <strong style={{ color: '#00f2fe' }}>{displayAssessedCount}</strong>/{totalAvailablePartsCount} bộ phận
                        </span>
                        {isSessionActive ? (
                          <span style={{ color: isMandatoryComplete ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                            {requiredAssessedCount}/{MANDATORY_HANDOVER_CHECKPOINTS.length} bộ phận bắt buộc
                          </span>
                        ) : latestCompletedInspection ? (
                          <span style={{ color: completedRequiredCount >= MANDATORY_HANDOVER_CHECKPOINTS.length ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                            {completedRequiredCount}/{MANDATORY_HANDOVER_CHECKPOINTS.length} bắt buộc (lịch sử)
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontWeight: 700 }}>
                            0/{MANDATORY_HANDOVER_CHECKPOINTS.length} bộ phận bắt buộc
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Section B: TÌNH TRẠNG PHƯƠNG TIỆN */}
                    <div
                      style={{
                        background: 'rgba(15, 32, 60, 0.75)',
                        border: '1.2px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={13} color="#38bdf8" />
                          <span style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            B. TÌNH TRẠNG PHƯƠNG TIỆN
                          </span>
                        </div>
                        {/* Dynamic Operational Status Pill — Strictly Honest (Never unconditional PASS) */}
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: activeSessionDefects.length > 0
                              ? 'rgba(239, 68, 68, 0.2)'
                              : unresolvedDamages.length > 0
                              ? 'rgba(249, 115, 22, 0.2)'
                              : isSessionActive
                              ? isMandatoryComplete
                                ? 'rgba(0, 242, 254, 0.2)'
                                : 'rgba(56, 189, 248, 0.15)'
                              : latestCompletedInspection
                              ? latestCompletedInspection.overallResult === 'FAIL'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(148, 163, 184, 0.15)',
                            color: activeSessionDefects.length > 0
                              ? '#f87171'
                              : unresolvedDamages.length > 0
                              ? '#fb923c'
                              : isSessionActive
                              ? isMandatoryComplete
                                ? '#00f2fe'
                                : '#38bdf8'
                              : latestCompletedInspection
                              ? latestCompletedInspection.overallResult === 'FAIL'
                                ? '#f87171'
                                : '#34d399'
                              : '#94a3b8',
                            border: `1px solid ${
                              activeSessionDefects.length > 0
                                ? 'rgba(239, 68, 68, 0.5)'
                                : unresolvedDamages.length > 0
                                ? 'rgba(249, 115, 22, 0.5)'
                                : isSessionActive
                                ? isMandatoryComplete
                                  ? 'rgba(0, 242, 254, 0.5)'
                                  : 'rgba(56, 189, 248, 0.35)'
                                : latestCompletedInspection
                                ? latestCompletedInspection.overallResult === 'FAIL'
                                  ? 'rgba(239, 68, 68, 0.5)'
                                  : 'rgba(16, 185, 129, 0.4)'
                                : 'rgba(148, 163, 184, 0.3)'
                            }`,
                          }}
                        >
                          {activeSessionDefects.length > 0
                            ? 'CÓ KHIẾM KHUYẾT CHỜ XÁC NHẬN'
                            : unresolvedDamages.length > 0
                            ? 'CÓ HƯ HỎNG CHƯA XỬ LÝ'
                            : isSessionActive
                            ? isMandatoryComplete
                              ? 'ĐẠT TIÊU CHUẨN SƠ BỘ'
                              : 'ĐANG KIỂM TRA'
                            : latestCompletedInspection
                            ? latestCompletedInspection.overallResult === 'FAIL'
                              ? 'KHÔNG ĐẠT (FAIL)'
                              : 'ĐẠT TIÊU CHUẨN (PASS)'
                            : 'CHƯA CÓ DỮ LIỆU'}
                        </span>
                      </div>

                      {/* 3 Metric Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Khiếm khuyết sơ bộ</div>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: activeSessionDefects.length > 0 ? '#f87171' : '#34d399', marginTop: '2px' }}>
                            {activeSessionDefects.length}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Hư hỏng hồ sơ</div>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: unresolvedDamages.length > 0 ? '#fb923c' : '#34d399', marginTop: '2px' }}>
                            {unresolvedDamages.length}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(8, 14, 26, 0.7)', borderRadius: '8px', padding: '8px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Chưa kiểm tra</div>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: '#94a3b8', marginTop: '2px' }}>
                            {Math.max(0, totalAvailablePartsCount - displayAssessedCount)}
                          </div>
                        </div>
                      </div>

                      {!isSessionActive && latestCompletedInspection && (
                        <div style={{ fontSize: '9.5px', color: '#94a3b8', background: 'rgba(8, 14, 26, 0.5)', padding: '5px 8px', borderRadius: '6px', border: '1px dashed rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Biên bản gần nhất: {formatDateTime(latestCompletedInspection.inspectionDate || latestCompletedInspection.createdAt)}</span>
                          <span style={{ fontWeight: 700, color: latestCompletedInspection.overallResult === 'FAIL' ? '#f87171' : '#34d399' }}>
                            {latestCompletedInspection.overallResult === 'FAIL' ? 'KHÔNG ĐẠT (FAIL)' : 'ĐẠT (PASS)'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Section C: ĐÁNH GIÁ BỘ PHẬN */}
                    <div
                      style={{
                        background: 'rgba(15, 32, 60, 0.75)',
                        border: '1.2px solid rgba(0, 242, 254, 0.32)',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sliders size={13} color="#00f2fe" />
                          <span style={{ fontSize: '11px', fontWeight: 900, color: '#00f2fe', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            C. ĐÁNH GIÁ BỘ PHẬN
                          </span>
                        </div>
                        <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                          {partCondition ? `Đã chọn: ${partCondition === 'GOOD' ? 'TỐT' : partCondition === 'SCRATCH' ? 'TRẦY' : partCondition === 'DENT' ? 'MÓP' : 'NỨT'}` : '* Chọn tình trạng'}
                        </span>
                      </div>

                      {/* Component Selector */}
                      <select
                        id="inspection-part-select"
                        value={selectedPartKey || ''}
                        onChange={(e) => {
                          const nextPart = e.target.value as VehiclePartId;
                          if (nextPart !== selectedPartKey) {
                            performGuardedAction(() => {
                              setSelectedPartKey(nextPart);
                              selectVehiclePart(nextPart);
                              selectVehiclePartCode(nextPart);
                            });
                          }
                        }}
                        style={{
                          width: '100%',
                          height: '36px',
                          padding: '0 10px',
                          borderRadius: '8px',
                          background: 'rgba(8, 14, 26, 0.85)',
                          border: '1px solid rgba(0, 242, 254, 0.35)',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {inspectionPartDropdownList.map((p) => {
                          const canonicalId = normalizeCanonicalPartCode(p.id);
                          const sessionItem = activeInspection?.items?.find(
                            (i) => normalizeCanonicalPartCode(i.vehiclePartCode) === canonicalId
                          );
                          const completedItem = !isSessionActive
                            ? latestCompletedInspection?.items?.find(
                                (i) => normalizeCanonicalPartCode(i.vehiclePartCode) === canonicalId
                              )
                            : null;
                          const effectiveItem = sessionItem || completedItem;
                          const isAssessed = Boolean(effectiveItem);
                          const isDefect = effectiveItem && effectiveItem.conditionStatus !== 'GOOD';
                          return (
                            <option key={p.id} value={p.id} style={{ background: '#0a1628', color: '#ffffff' }}>
                              {p.label} {isDefect ? `[!] (${effectiveItem?.conditionStatus})` : isAssessed ? '[OK]' : ''}
                            </option>
                          );
                        })}
                      </select>

                      {/* 4-Button Condition Rating: TỐT / TRẦY / MÓP / NỨT */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        {[
                          { id: 'GOOD', label: 'TỐT', color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.22)', border: '#00f2fe' },
                          { id: 'SCRATCH', label: 'TRẦY', color: '#facc15', bg: 'rgba(250, 204, 21, 0.22)', border: '#facc15' },
                          { id: 'DENT', label: 'MÓP', color: '#f97316', bg: 'rgba(249, 115, 22, 0.22)', border: '#f97316' },
                          { id: 'CRACK', label: 'NỨT', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.22)', border: '#ef4444' },
                        ].map((item) => {
                          const isSelected = partCondition === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setPartCondition(item.id as InspectionItemCondition)}
                              style={{
                                height: '34px',
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
                                boxShadow: isSelected ? `0 0 10px ${item.border}55` : 'none',
                              }}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Assessment Note */}
                      <input
                        type="text"
                        placeholder="Ghi chú đánh giá bộ phận..."
                        value={partNote}
                        onChange={(e) => setPartNote(e.target.value)}
                        style={{
                          width: '100%',
                          height: '34px',
                          padding: '0 10px',
                          borderRadius: '7px',
                          background: 'rgba(8, 14, 26, 0.85)',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          color: '#ffffff',
                          fontSize: '11px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />

                      {/* Save Button */}
                      <button
                        type="button"
                        disabled={!isSessionActive || isSavingPart}
                        onClick={handleSavePartInspection}
                        style={{
                          height: '36px',
                          borderRadius: '8px',
                          background: (!isSessionActive || isSavingPart)
                            ? 'rgba(100, 116, 139, 0.25)'
                            : 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                          border: 'none',
                          color: (!isSessionActive || isSavingPart) ? '#94a3b8' : '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          cursor: (!isSessionActive || isSavingPart) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: isSessionActive ? '0 3px 12px rgba(0, 242, 254, 0.25)' : 'none',
                        }}
                      >
                        {isSavingPart ? (
                          <EVCarLoader variant="button" message="ĐANG LƯU..." />
                        ) : !isSessionActive ? (
                          <>
                            <CheckCircle2 size={13} color="#94a3b8" />
                            <span>BẮT ĐẦU PHIÊN ĐỂ LƯU ĐÁNH GIÁ</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} color="#ffffff" />
                            <span>LƯU ĐÁNH GIÁ</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Section D: DANH SÁCH ĐÃ KIỂM TRA */}
                    <div
                      style={{
                        background: 'rgba(15, 32, 60, 0.75)',
                        border: '1.2px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={13} color="#34d399" />
                          <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            D. DANH SÁCH ĐÃ KIỂM TRA ({displayAssessedCount}/{totalAvailablePartsCount})
                          </span>
                        </div>
                        <span style={{ fontSize: '9px', color: '#64748b' }}>Nhấp để chọn lại</span>
                      </div>

                      {displayEvaluatedItems && displayEvaluatedItems.length > 0 ? (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '5px',
                            maxHeight: '110px',
                            overflowY: 'auto',
                            paddingRight: '2px',
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(0, 242, 254, 0.3) rgba(8, 14, 26, 0.4)',
                          }}
                        >
                          {displayEvaluatedItems.map((item) => {
                            const isGood = item.conditionStatus === 'GOOD';
                            const condLabel = isGood ? 'TỐT' : item.conditionStatus === 'SCRATCH' ? 'TRẦY' : item.conditionStatus === 'DENT' ? 'MÓP' : 'NỨT';
                            const condColor = resolveHotspotSemanticColor(item.conditionStatus, true);
                            const isCurrent = selectedPartKey === item.vehiclePartCode;
                            const partName = SEMANTIC_PART_LABELS_VI[item.vehiclePartCode as VehiclePartId] || item.vehiclePartCode;

                            return (
                              <button
                                key={item.id || item.vehiclePartCode}
                                type="button"
                                onClick={() => {
                                  const partId = item.vehiclePartCode as VehiclePartId;
                                  if (partId !== selectedPartKey) {
                                    performGuardedAction(() => {
                                      setSelectedPartKey(partId);
                                      selectVehiclePart(partId);
                                      selectVehiclePartCode(partId);
                                    });
                                  }
                                }}
                                title={item.note || partName}
                                style={{
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  padding: '3px 7px',
                                  borderRadius: '5px',
                                  background: isCurrent ? `${condColor}33` : 'rgba(8, 14, 26, 0.7)',
                                  color: isCurrent ? '#ffffff' : condColor,
                                  border: isCurrent ? `1.2px solid ${condColor}` : `1px solid ${condColor}44`,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.12s ease',
                                }}
                              >
                                <span>{partName}:</span>
                                <strong style={{ color: condColor }}>{condLabel}</strong>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: '10.5px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '6px' }}>
                          Chưa có bộ phận nào được đánh giá.
                        </div>
                      )}
                    </div>

                    {/* Section E: WORKFLOW FOOTER */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {isSessionActive ? (
                        <>
                          {!isMandatoryComplete && (
                            <div
                              style={{
                                background: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '9.5px',
                                color: '#fbbf24',
                                fontWeight: 600,
                              }}
                            >
                              Còn {missingRequiredParts.length}/{MANDATORY_HANDOVER_CHECKPOINTS.length} bộ phận bắt buộc: {missingRequiredParts.map((p) => p.label).join(', ')}
                            </div>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button
                              type="button"
                              disabled={isRestartingInspection}
                              onClick={handleStartNewInspection}
                              style={{
                                height: '36px',
                                borderRadius: '8px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                color: isRestartingInspection ? '#64748b' : '#cbd5e1',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                cursor: isRestartingInspection ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                              }}
                            >
                              <RotateCcw size={12} />
                              <span>{isRestartingInspection ? 'ĐANG TẠO...' : 'TẠO LẠI PHIÊN'}</span>
                            </button>

                            <button
                              type="button"
                              disabled={!isMandatoryComplete || isCompletingInspection}
                              onClick={handleCompleteInspection}
                              style={{
                                height: '36px',
                                borderRadius: '8px',
                                background: !isMandatoryComplete || isCompletingInspection
                                  ? 'rgba(100, 116, 139, 0.25)'
                                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                color: !isMandatoryComplete || isCompletingInspection ? '#94a3b8' : '#ffffff',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                cursor: !isMandatoryComplete || isCompletingInspection ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                boxShadow: isMandatoryComplete ? '0 3px 10px rgba(16, 185, 129, 0.25)' : 'none',
                              }}
                            >
                              <CheckCircle2 size={13} />
                              <span>{isCompletingInspection ? 'ĐANG HOÀN TẤT...' : 'HOÀN TẤT BIÊN BẢN'}</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={isRestartingInspection}
                          onClick={handleStartNewInspection}
                          style={{
                            height: '38px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: isRestartingInspection ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 3px 12px rgba(0, 242, 254, 0.3)',
                          }}
                        >
                          <Play size={13} color="#ffffff" />
                          <span>{latestCompletedInspection ? 'TẠO PHIÊN KIỂM TRA MỚI' : 'BẮT ĐẦU KIỂM TRA 3D'}</span>
                        </button>
                      )}
                    </div>
                  </div>
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

            {/* ----------------------------------------------------
                7. MODULE: XÁC MINH THANH TOÁN
                ---------------------------------------------------- */}
            {activeModule === 'PAYMENT' && (
              <StaffPaymentVerificationView
                selectedVehicleId={vehicle.id}
                onClose={handleClose}
              />
            )}

            {/* ----------------------------------------------------
                8. MODULE: HÒA GIẢI & TRANH CHẤP
                ---------------------------------------------------- */}
            {activeModule === 'DISPUTE' && (
              <StaffDisputeDashboardView
                selectedVehicleId={vehicle.id}
                onClose={handleClose}
              />
            )}
          </div>
        )}
      </main>

      {/* ====================================================
          MODAL: THAY ĐỔI CHƯA ĐƯỢC LƯU (UNSAVED CHANGES)
          ==================================================== */}
      {showUnsavedChangesModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              background: 'linear-gradient(135deg, #0b1c36 0%, #071326 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.45)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6), 0 0 25px rgba(245, 158, 11, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} color="#fbbf24" />
              </div>
              <div>
                <h3 id="unsaved-modal-title" style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#fbbf24' }}>
                  Thay đổi chưa được lưu
                </h3>
                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  Xác nhận điều hướng kiểm tra 3D
                </span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
              Bạn có đánh giá chưa lưu. Bạn có muốn thoát mà không lưu thay đổi không?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleKeepEditing}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Tiếp tục kiểm tra
              </button>

              <button
                type="button"
                onClick={handleDiscardUnsavedChanges}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                Thoát không lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: TẠO LẠI PHIÊN KIỂM TRA MỚI (RESTART CONFIRM)
          ==================================================== */}
      {showRestartConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="restart-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              background: 'linear-gradient(135deg, #0b1c36 0%, #071326 100%)',
              border: '1.5px solid rgba(0, 242, 254, 0.45)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 242, 254, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <RotateCcw size={20} color="#00f2fe" />
              </div>
              <div>
                <h3 id="restart-modal-title" style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#00f2fe' }}>
                  Tạo lại phiên kiểm tra mới?
                </h3>
                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  Khởi tạo biên bản kiểm định kỹ thuật 3D
                </span>
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>• Toàn bộ tiến độ và đánh giá nháp chưa hoàn tất của phiên hiện tại sẽ bị hủy bỏ.</div>
              <div>• Các biên bản lịch sử đã hoàn tất và hồ sơ hư hỏng của xe vẫn được bảo toàn.</div>
              <div>• Phiên mới sẽ bắt đầu với 0 bộ phận đã kiểm tra.</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setShowRestartConfirmModal(false)}
                disabled={isRestartingInspection}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: isRestartingInspection ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={executeStartNewInspection}
                disabled={isRestartingInspection}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: isRestartingInspection ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 242, 254, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                {isRestartingInspection ? 'ĐANG TẠO...' : 'Xác nhận tạo lại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: BIÊN BẢN BÀN GIAO XE ĐIỆN CHÍNH THỨC (STAFF RECEIPT MODAL)
          ======================================================== */}
      {showStaffReceiptModal && completedHandoverReceipt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-receipt-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'linear-gradient(135deg, #0b1c36 0%, #071326 100%)',
              border: '1.5px solid rgba(0, 242, 254, 0.45)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              color: '#ffffff',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0, 242, 254, 0.25)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(0, 242, 254, 0.15)',
                    border: '1px solid rgba(0, 242, 254, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00f2fe',
                  }}
                >
                  <FileText size={20} />
                </div>
                <div>
                  <h3 id="staff-receipt-modal-title" style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#00f2fe', letterSpacing: '0.03em' }}>
                    BIÊN BẢN BÀN GIAO XE ĐIỆN
                  </h3>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Hệ thống quản lý và chia sẻ phương tiện EVShare 3D
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStaffReceiptModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Receipt Parties Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(15, 32, 60, 0.7)', borderRadius: '10px', padding: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '11px' }}>
                <div style={{ color: '#94a3b8', fontSize: '9.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>BÊN GIAO (EVSHARE)</div>
                <div style={{ fontWeight: 800, color: '#ffffff' }}>{completedHandoverReceipt.staffName || user?.fullName || 'Nhân viên EVShare'}</div>
                <div style={{ color: '#38bdf8', fontSize: '10px' }}>Nhân viên vận hành trạm</div>
              </div>
              <div style={{ background: 'rgba(15, 32, 60, 0.7)', borderRadius: '10px', padding: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '11px' }}>
                <div style={{ color: '#94a3b8', fontSize: '9.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>BÊN NHẬN (ĐỒNG SỞ HỮU)</div>
                <div style={{ fontWeight: 800, color: '#00f2fe' }}>{completedHandoverReceipt.coOwnerName || eligibility?.recipientName || 'Đồng sở hữu'}</div>
                <div style={{ color: '#94a3b8', fontSize: '10px' }}>{completedHandoverReceipt.coOwnerEmail || eligibility?.recipientEmail || 'Thành viên nhóm sở hữu'}</div>
              </div>
            </div>

            {/* Vehicle & Telemetry Snapshot */}
            <div style={{ background: 'rgba(15, 32, 60, 0.7)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '2px', textTransform: 'uppercase', fontSize: '10px' }}>THÔNG TIN PHƯƠNG TIỆN & CHỈ SỐ KỸ THUẬT</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                <span style={{ fontWeight: 700, color: '#ffffff' }}>{completedHandoverReceipt.vehicleName || vehicle.name} ({completedHandoverReceipt.vehicleCode || vehicle.vehicleCode || 'EV01'})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Biển số kiểm soát:</span>
                <span style={{ fontWeight: 800, color: '#00f2fe' }}>{completedHandoverReceipt.licensePlate || vehicle.licensePlate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Mức pin khi bàn giao (SOC):</span>
                <span style={{ fontWeight: 800, color: (completedHandoverReceipt.startBatteryLevel ?? vehicle.currentBatteryLevel ?? 0) >= 20 ? '#34d399' : '#f87171' }}>
                  {completedHandoverReceipt.startBatteryLevel ?? vehicle.currentBatteryLevel ?? 0}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Đồng hồ km (Odometer):</span>
                <span style={{ fontWeight: 700, color: '#ffffff' }}>
                  {((completedHandoverReceipt.startOdometer ?? vehicle.odometer ?? 0)).toLocaleString('vi-VN')} km
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Thời điểm giao xe:</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                  {formatDateTime(completedHandoverReceipt.staffHandedOverAt || new Date().toISOString())}
                </span>
              </div>
            </div>

            {/* Inspection Breakdown */}
            <div style={{ background: 'rgba(15, 32, 60, 0.7)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#10b981', textTransform: 'uppercase', fontSize: '10px' }}>
                  KẾT QUẢ KIỂM TRA 8 ĐIỂM KỸ THUẬT BẮT BUỘC
                </span>
                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '9.5px', fontWeight: 800 }}>
                  ĐẠT TIÊU CHUẨN (PASS)
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {MANDATORY_HANDOVER_CHECKPOINTS.map((part) => (
                  <div key={part.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: 'rgba(8, 14, 26, 0.6)', borderRadius: '6px', fontSize: '10px' }}>
                    <span style={{ color: '#cbd5e1' }}>{part.label}</span>
                    <span style={{ color: '#34d399', fontWeight: 800 }}>TỐT</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist & Signatures */}
            <div style={{ background: 'rgba(11, 28, 54, 0.8)', borderRadius: '10px', padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.45 }}>
              <div>• Đã bàn giao chìa khóa vật lý và thẻ từ phương tiện cho người nhận.</div>
              <div>• Người nhận đã kiểm tra đối chiếu tình trạng ngoại quan và nội thất.</div>
              <div>• Biên bản điện tử có giá trị pháp lý xác nhận trách nhiệm vận hành của bên nhận.</div>
            </div>

            {/* Modal Bottom Close Button */}
            <button
              type="button"
              onClick={() => setShowStaffReceiptModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                border: 'none',
                color: '#080c16',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ĐÓNG BIÊN BẢN
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
