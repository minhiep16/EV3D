import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VehicleResponse, VehicleStatus } from '../../types/vehicle';
import { resolveVehicleCode } from '../three/vehicles/vehicleModelConfig';
import { resolveVehicleSlot } from '../../config/garageSlotConfig';
import { useWorldStore } from '../../store/worldStore';
import { useAuthStore } from '../../store/authStore';
import {
  fetchHandoverEligibility,
  fetchActiveVehicleHandovers,
  fetchBookingHandover,
  fetchHandoverHistory,
  createHandoverApi,
  startHandoverApi,
  markHandoverReadyApi,
  confirmHandoverApi,
} from '../../services/handoverApi';
import {
  VehicleHandoverData,
  HANDOVER_STATUS_CONFIG,
  HANDOVER_ELIGIBILITY_CONFIG,
} from '../../types/handover';
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
  InspectionOverallResult,
  INSPECTION_RESULT_CONFIG,
  INSPECTION_ITEM_CONDITION_CONFIG,
} from '../../types/inspection';
import { fetchVehicleDamages, recordVehicleDamage } from '../../services/damageApi';
import { getPartById, SEMANTIC_HITBOX_DEFINITIONS, PART_STATUS_CONFIG } from '../../data/vehicleParts';
import { DamageType, DamageSeverity } from '../../types/damage';
import { VehiclePartId } from '../../types/vehiclePart';
import {
  Battery,
  BatteryCharging,
  MapPin,
  Gauge,
  Calendar,
  Key,
  Wrench,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Shield,
  Thermometer,
  Disc,
  X,
  Layers,
  Save,
  Plus,
  ArrowLeft,
  Check,
  Play,
  Sparkles,
  Clock,
  UserCheck,
  XCircle,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

interface StaffVehicleDetailPanelProps {
  vehicle: VehicleResponse;
  onClose?: () => void;
}

type DetailTab = 'STATUS' | 'HANDOVER' | 'MAINTENANCE';

type PartOption = {
  id: VehiclePartId;
  label: string;
};

const QUICK_INSPECTION_PARTS: PartOption[] = [
  { id: 'DOOR_FL', label: 'Cửa trước trái' },
  { id: 'DOOR_FR', label: 'Cửa trước phải' },
  { id: 'DOOR_RL', label: 'Cửa sau trái' },
  { id: 'DOOR_RR', label: 'Cửa sau phải' },
  { id: 'BODY', label: 'Thân vỏ xe' },
  { id: 'BATTERY', label: 'Pin cao áp' },
  { id: 'WHEEL_FL', label: 'Bánh trước' },
  { id: 'HOOD', label: 'Nắp ca-pô' },
  { id: 'CHARGING_PORT', label: 'Cổng sạc' },
];

function formatBookingDate(isoString?: string): string {
  if (!isoString) return '--/--/----';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--/--/----';
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '--/--/----';
  }
}

function formatBookingTime(isoString?: string): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '--:--';
  }
}

function getStatusMeta(status?: VehicleStatus) {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'AVAILABLE':
      return { labelVi: 'Sẵn sàng', dotColor: '#10b981', color: '#34d399' };
    case 'CHARGING':
      return { labelVi: 'Đang sạc', dotColor: '#00f2fe', color: '#00f2fe' };
    case 'MAINTENANCE':
    case 'IN_SERVICE':
      return { labelVi: 'Bảo dưỡng', dotColor: '#f87171', color: '#f87171' };
    case 'RESERVED':
      return { labelVi: 'Bàn giao', dotColor: '#f59e0b', color: '#fbbf24' };
    case 'IN_USE':
      return { labelVi: 'Đang sử dụng', dotColor: '#a855f7', color: '#c084fc' };
    default:
      return { labelVi: status || 'Sẵn sàng', dotColor: '#94a3b8', color: '#cbd5e1' };
  }
}

export const StaffVehicleDetailPanel: React.FC<StaffVehicleDetailPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.role === 'STAFF';

  // WorldStore operational selectors & actions
  const enterVehicleHandoverMode = useWorldStore((state) => state.enterVehicleHandoverMode);
  const enterVehicleDamageMappingMode = useWorldStore((state) => state.enterVehicleDamageMappingMode);
  const enterVehicleDamageHistoryMode = useWorldStore((state) => state.enterVehicleDamageHistoryMode);
  const enterVehicleMaintenanceMode = useWorldStore((state) => state.enterVehicleMaintenanceMode);
  const enterVehicleInspectionMode = useWorldStore((state) => state.enterVehicleInspectionMode);
  const enterBatteryXrayMode = useWorldStore((state) => state.enterBatteryXrayMode);
  const enterChargingMode = useWorldStore((state) => state.enterChargingMode);
  const exitVehicleInspectionMode = useWorldStore((state) => state.exitVehicleInspectionMode);
  const clearVehiclePartSelection = useWorldStore((state) => state.clearVehiclePartSelection);
  const selectVehiclePart = useWorldStore((state) => state.selectVehiclePart);
  const returnToVehicleOverview = useWorldStore((state) => state.returnToVehicleOverview);

  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const selectedVehiclePartId = useWorldStore((state) => state.selectedVehiclePartId);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);
  const draftDamage = useWorldStore((state) => state.draftDamage);
  const setDraftDamage = useWorldStore((state) => state.setDraftDamage);
  const selectedDamageId = useWorldStore((state) => state.selectedDamageId);
  const selectDamageRecord = useWorldStore((state) => state.selectDamageRecord);

  // Local state for tabs and draft damage recording
  const [activeTab, setActiveTab] = useState<DetailTab>('STATUS');
  const [draftSeverity, setDraftSeverity] = useState<DamageSeverity>('MINOR');
  const [draftType, setDraftType] = useState<DamageType>('SCRATCH');
  const [draftNote, setDraftNote] = useState('');
  const [isSavingDamage, setIsSavingDamage] = useState(false);
  const [damageSaveError, setDamageSaveError] = useState<string | null>(null);

  const code = resolveVehicleCode(vehicle);
  const statusMeta = getStatusMeta(vehicle.status);
  const slot = resolveVehicleSlot(vehicle, user?.role);
  const battery = vehicle.currentBatteryLevel ?? 82;
  const isCharging = (vehicle.status || '').toUpperCase() === 'CHARGING';
  const estimatedRange = Math.round(battery * 4.3);
  const odoKm = vehicle.odometer ? vehicle.odometer.toLocaleString('vi-VN') : '12.560';

  // Selected part definition during inspection mode
  const selectedPart = useMemo(() => {
    return getPartById(selectedVehiclePartId);
  }, [selectedVehiclePartId]);

  // TanStack Query for Handover eligibility & damages
  const { data: eligibility, refetch: refetchEligibility } = useQuery({
    queryKey: ['handoverEligibility', vehicle.id],
    queryFn: () => fetchHandoverEligibility(vehicle.id),
    enabled: !!vehicle.id,
    staleTime: 5000,
  });

  const targetBookingId = eligibility?.bookingId;

  // Authoritative query for handover by booking
  const {
    data: bookingHandover,
    isError: isBookingHandoverError,
    error: bookingHandoverError,
    refetch: refetchBookingHandover,
  } = useQuery<VehicleHandoverData | null>({
    queryKey: ['handoverByBooking', targetBookingId],
    queryFn: () => (targetBookingId ? fetchBookingHandover(targetBookingId) : null),
    enabled: !!targetBookingId && vehicleHandoverMode,
    refetchInterval: vehicleHandoverMode ? 3000 : false,
  });

  const { data: damages = [], refetch: refetchDamages } = useQuery({
    queryKey: ['vehicleDamages', vehicle.id],
    queryFn: () => fetchVehicleDamages(vehicle.id),
    enabled: !!vehicle.id,
    staleTime: 5000,
  });

  // Handover selectors and active handovers query
  const selectedHandoverCheckpoint = useWorldStore((state) => state.selectedHandoverCheckpoint);
  const selectHandoverCheckpoint = useWorldStore((state) => state.selectHandoverCheckpoint);
  const clearHandoverCheckpointSelection = useWorldStore((state) => state.clearHandoverCheckpointSelection);

  const { data: activeHandovers = [], refetch: refetchActiveHandovers } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeVehicleHandovers', vehicle.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    enabled: !!vehicle.id,
    refetchInterval: vehicleHandoverMode ? 3000 : false,
  });

  // TanStack Query: Historical Completed Handovers (Immutable history for vehicle)
  const { data: handoverHistory = [], refetch: refetchHandoverHistory } = useQuery<VehicleHandoverData[]>({
    queryKey: ['handoverHistory', vehicle.id],
    queryFn: () => fetchHandoverHistory(vehicle.id),
    enabled: !!vehicle.id,
    staleTime: 5000,
  });

  // Derive target handover candidate strictly tied to current booking and active lifecycle
  const handover = useMemo(() => {
    // If no target booking or explicitly NO_BOOKING, there is no active handover candidate
    if (!targetBookingId || eligibility?.reason === 'NO_BOOKING') {
      return null;
    }
    // 1. Authoritative: Handover fetched directly for the current booking
    if (bookingHandover && bookingHandover.id) {
      return bookingHandover;
    }
    // 2. Active handover list for this vehicle matching targetBookingId with real ID
    if (activeHandovers && activeHandovers.length > 0 && targetBookingId) {
      const match = activeHandovers.find((h) => h.bookingId === targetBookingId && Boolean(h.id));
      if (match) return match;
    }
    // 3. Handover attached to authoritative eligibility response matching current booking
    if (eligibility?.handoverId && eligibility?.handover?.id && eligibility?.bookingId === targetBookingId) {
      return eligibility.handover;
    }
    return null;
  }, [bookingHandover, activeHandovers, targetBookingId, eligibility]);

  // TanStack Query: Latest Completed Vehicle Inspection (Authoritative for Handover)
  const {
    data: latestInspection,
    isLoading: isLatestInspectionLoading,
    isError: isLatestInspectionError,
    refetch: refetchLatestInspection,
  } = useQuery<VehicleInspectionResponse | null>({
    queryKey: ['latestCompletedInspection', vehicle.id],
    queryFn: () => fetchLatestCompletedInspection(vehicle.id),
    refetchInterval: 5000,
  });

  // TanStack Query: Active In-Progress Inspection for Vehicle (for KIỂM TRA BỘ PHẬN)
  const {
    data: activeInspection,
    isLoading: isActiveInspectionLoading,
    refetch: refetchActiveInspection,
  } = useQuery<VehicleInspectionResponse | null>({
    queryKey: ['activeVehicleInspection', vehicle.id],
    queryFn: () => fetchActiveInspection(vehicle.id),
    enabled: vehicleInspectionMode,
    refetchInterval: 3000,
  });

  // Business rule: Authoritative Inspection & Handover Readiness
  // Strictly require a fresh, unconsumed inspection for the upcoming handover cycle (Requirements 10 & 11)
  const isInspectionPassed = useMemo(() => {
    // 1. Authoritative: Backend eligibility explicitly confirms an unconsumed inspection is available and fresh
    if (
      eligibility?.inspectionAvailable &&
      eligibility?.inspectionFresh &&
      (eligibility?.inspectionResult === 'PASS' || eligibility?.inspectionResult === 'PASS_WITH_NOTES')
    ) {
      return true;
    }
    // 2. Authoritative: Latest completed inspection is fresh and PASS/PASS_WITH_NOTES, and not consumed by older handovers
    if (
      latestInspection &&
      latestInspection.status === 'COMPLETED' &&
      latestInspection.inspectionType === 'PRE_HANDOVER' &&
      (latestInspection.overallResult === 'PASS' || latestInspection.overallResult === 'PASS_WITH_NOTES')
    ) {
      const isConsumed = handoverHistory.some((h) => h.inspectionId === latestInspection.id);
      const isFresh = latestInspection.completedAt
        ? Date.now() - new Date(latestInspection.completedAt).getTime() < 24 * 3600 * 1000
        : true;
      if (!isConsumed && isFresh) {
        return true;
      }
    }
    return false;
  }, [eligibility, latestInspection, handoverHistory]);

  const isInspectionFailed = useMemo(() => {
    return Boolean(
      eligibility?.reason === 'INSPECTION_FAILED' ||
      eligibility?.inspectionResult === 'FAIL' ||
      latestInspection?.overallResult === 'FAIL'
    );
  }, [eligibility, latestInspection]);

  const isInspectionExpired = useMemo(() => {
    return Boolean(
      eligibility?.reason === 'INSPECTION_EXPIRED' ||
      (eligibility?.inspectionAvailable && !eligibility?.inspectionFresh)
    );
  }, [eligibility]);

  const isInspectionInProgress = useMemo(() => {
    return Boolean(
      activeInspection &&
      activeInspection.status === 'IN_PROGRESS' &&
      !isInspectionPassed
    );
  }, [activeInspection, isInspectionPassed]);

  const handoverBlockReason = useMemo(() => {
    if (vehicle.status === 'MAINTENANCE' || eligibility?.reason === 'VEHICLE_MAINTENANCE') {
      return 'Xe đang bảo dưỡng nên chưa thể bàn giao.';
    }
    if (vehicle.status === 'CHARGING' || eligibility?.reason === 'VEHICLE_CHARGING') {
      return 'Xe đang sạc nên chưa thể bàn giao.';
    }
    if (vehicle.status === 'IN_USE' || eligibility?.reason === 'VEHICLE_IN_USE') {
      return 'Xe đang được sử dụng nên chưa thể bàn giao.';
    }
    if (eligibility?.reason === 'TOO_EARLY') {
      return 'Chưa đến thời gian bàn giao xe (mở trước 2 tiếng).';
    }
    if (eligibility?.reason === 'BOOKING_EXPIRED') {
      return 'Lịch đặt xe đã hết hiệu lực.';
    }
    if (eligibility?.reason === 'NO_BOOKING') {
      return 'Không có lịch đặt xe phù hợp để bàn giao.';
    }
    return null;
  }, [vehicle.status, eligibility?.reason]);

  const isHandoverEligibleForReady = useMemo(() => {
    const hasHandoverCandidate = Boolean(handover || targetBookingId || eligibility?.bookingId);
    const isNotAlreadyDone = handover?.status !== 'HANDED_OVER' &&
      handover?.status !== 'OWNER_CONFIRMED' &&
      handover?.status !== 'COMPLETED';

    return Boolean(
      hasHandoverCandidate &&
      isNotAlreadyDone &&
      isInspectionPassed &&
      !isInspectionFailed &&
      !isInspectionExpired &&
      !handoverBlockReason
    );
  }, [handover, targetBookingId, eligibility?.bookingId, isInspectionPassed, isInspectionFailed, isInspectionExpired, handoverBlockReason]);

  // Local state for KIỂM TRA BỘ PHẬN (Vehicle Part Inspection)
  const [partCondition, setPartCondition] = useState<InspectionItemCondition>('GOOD');
  const [partNote, setPartNote] = useState<string>('');
  const [isSavingPart, setIsSavingPart] = useState(false);
  const [isCompletingInspection, setIsCompletingInspection] = useState(false);
  const [inspectionFeedback, setInspectionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Toggle for read-only inspection detail view in Handover
  const [isViewingInspectionDetail, setIsViewingInspectionDetail] = useState(false);

  // Synchronize part condition and note when a part is selected
  useEffect(() => {
    if (selectedPart && activeInspection?.items) {
      const existing = activeInspection.items.find(
        (i) => i.vehiclePartCode.toUpperCase() === selectedPart.id.toUpperCase()
      );
      if (existing) {
        setPartCondition(existing.conditionStatus);
        setPartNote(existing.note || '');
      } else {
        setPartCondition('GOOD');
        setPartNote('');
      }
    } else {
      setPartCondition('GOOD');
      setPartNote('');
    }
    setInspectionFeedback(null);
  }, [selectedPart?.id, activeInspection?.id]);

  const handleSavePartInspection = async () => {
    if (!selectedPart || isSavingPart) return;
    setIsSavingPart(true);
    setInspectionFeedback(null);
    try {
      let targetInspectionId = activeInspection?.id;
      if (!targetInspectionId) {
        const started = await startInspectionApi(vehicle.id, 'PRE_HANDOVER');
        targetInspectionId = started.id;
      }

      await submitInspectionItemApi(targetInspectionId, {
        vehiclePartCode: selectedPart.id,
        conditionStatus: partCondition,
        note: partNote.trim() ? partNote.trim() : undefined,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activeVehicleInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['latestCompletedInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
      ]);
      await refetchActiveInspection();
      setInspectionFeedback({
        type: 'success',
        text: `Đã lưu đánh giá cho ${selectedPart.nameVi}`,
      });
      setTimeout(() => setInspectionFeedback(null), 3000);
    } catch (err: any) {
      setInspectionFeedback({
        type: 'error',
        text: err.message || 'Không thể lưu đánh giá bộ phận.',
      });
    } finally {
      setIsSavingPart(false);
    }
  };

  const handleCompleteInspection = async () => {
    if (!activeInspection?.id || isCompletingInspection) return;
    setIsCompletingInspection(true);
    setInspectionFeedback(null);
    try {
      const completed = await completeInspectionApi(activeInspection.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activeVehicleInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['latestCompletedInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] }),
        targetBookingId ? queryClient.invalidateQueries({ queryKey: ['handoverByBooking', targetBookingId] }) : Promise.resolve(),
      ]);
      await Promise.all([
        refetchActiveInspection(),
        refetchLatestInspection(),
        refetchEligibility(),
        refetchActiveHandovers(),
        refetchBookingHandover(),
      ]);
      setInspectionFeedback({
        type: 'success',
        text: `Đã hoàn tất biên bản kiểm tra: Kết quả ${
          completed.overallResult === 'PASS'
            ? 'ĐẠT'
            : completed.overallResult === 'PASS_WITH_NOTES'
            ? 'ĐẠT CÓ LƯU Ý'
            : 'KHÔNG ĐẠT'
        }`,
      });
      setTimeout(() => setInspectionFeedback(null), 4000);
    } catch (err: any) {
      setInspectionFeedback({
        type: 'error',
        text: err.message || 'Không thể hoàn tất biên bản kiểm tra.',
      });
    } finally {
      setIsCompletingInspection(false);
    }
  };

  const handleStartNewInspection = async () => {
    setIsSavingPart(true);
    setInspectionFeedback(null);
    try {
      await startInspectionApi(vehicle.id, 'PRE_HANDOVER');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activeVehicleInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
      ]);
      await refetchActiveInspection();
      setInspectionFeedback({
        type: 'success',
        text: 'Đã khởi tạo phiên kiểm tra mới. Hãy chọn các bộ phận trên xe để đánh giá.',
      });
      setTimeout(() => setInspectionFeedback(null), 3000);
    } catch (err: any) {
      setInspectionFeedback({
        type: 'error',
        text: err.message || 'Không thể khởi tạo phiên kiểm tra.',
      });
    } finally {
      setIsSavingPart(false);
    }
  };

  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setActionErrorMsg(null);
  }, [vehicle.id, targetBookingId, vehicleHandoverMode]);

  // Controlled Proactive Preparation on Entry: If STAFF enters handover mode, targetBookingId is resolved,
  // inspection is passed, but no handover record exists yet in DB, proactively prepare it
  useEffect(() => {
    let isCancelled = false;
    if (
      vehicleHandoverMode &&
      targetBookingId &&
      !bookingHandover &&
      !isBookingHandoverError &&
      isInspectionPassed &&
      !isInspectionFailed &&
      !isInspectionExpired &&
      !handoverBlockReason
    ) {
      createHandoverApi(targetBookingId)
        .then((created) => {
          if (!isCancelled && created?.id) {
            queryClient.invalidateQueries({ queryKey: ['handoverByBooking', targetBookingId] });
            queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] });
          }
        })
        .catch(() => {
          // Handled gracefully on-demand by handleMarkHandoverReady
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [
    vehicleHandoverMode,
    targetBookingId,
    bookingHandover,
    isBookingHandoverError,
    isInspectionPassed,
    isInspectionFailed,
    isInspectionExpired,
    handoverBlockReason,
  ]);

  const handleStartHandoverWorkflow = async () => {
    const bookingId = targetBookingId || handover?.bookingId || eligibility?.bookingId;
    if (!bookingId) {
      setActionErrorMsg('Không tìm thấy mã đặt xe để bắt đầu.');
      return;
    }
    setIsSubmittingAction(true);
    setActionErrorMsg(null);
    try {
      const started = await createHandoverApi(bookingId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['handoverByBooking', bookingId] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', started?.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverHistory', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleRelevantBooking', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['booking', bookingId] }),
      ]);
      await Promise.all([refetchBookingHandover(), refetchActiveHandovers(), refetchEligibility(), refetchHandoverHistory()]);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể khởi tạo hồ sơ bàn giao xe.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleMarkHandoverReady = async () => {
    const bId = targetBookingId || handover?.bookingId || eligibility?.bookingId;
    if (!bId) {
      setActionErrorMsg('Không tìm thấy mã đặt xe để chuẩn bị bàn giao.');
      return;
    }

    setIsSubmittingAction(true);
    setActionErrorMsg(null);
    try {
      let currentHandoverId = handover?.id || bookingHandover?.id;

      // If no persisted handover record exists yet in DB, create one authoritatively
      if (!currentHandoverId) {
        const created = await createHandoverApi(bId);
        if (!created || !created.id) {
          throw new Error('Không thể khởi tạo hồ sơ bàn giao xe.');
        }
        currentHandoverId = created.id;
        await queryClient.invalidateQueries({ queryKey: ['handoverByBooking', bId] });
      }

      await markHandoverReadyApi(currentHandoverId);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['handoverByBooking', bId] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', currentHandoverId] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverHistory', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleRelevantBooking', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['latestCompletedInspection', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['booking', bId] }),
        queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] }),
      ]);
      await Promise.all([refetchBookingHandover(), refetchActiveHandovers(), refetchEligibility(), refetchHandoverHistory()]);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể xác nhận sẵn sàng bàn giao.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleConfirmStaffHandover = async () => {
    if (!handover?.id) return;
    setIsSubmittingAction(true);
    setActionErrorMsg(null);
    try {
      await confirmHandoverApi(handover.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['handoverByBooking', targetBookingId] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['activeVehicleHandover', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverHistory', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicleRelevantBooking', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['handoverEligibility', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle.id] }),
        queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] }),
      ]);
      await Promise.all([refetchBookingHandover(), refetchActiveHandovers(), refetchEligibility(), refetchHandoverHistory()]);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Không thể xác nhận giao xe.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handler for saving draft damage from right panel
  const handleSaveDraftDamage = async () => {
    if (!draftDamage) return;
    setIsSavingDamage(true);
    setDamageSaveError(null);
    try {
      await recordVehicleDamage(vehicle.id, {
        vehiclePartCode: draftDamage.partCode,
        damageType: draftType,
        severity: draftSeverity,
        note: draftNote,
        localPositionX: draftDamage.localPosition[0],
        localPositionY: draftDamage.localPosition[1],
        localPositionZ: draftDamage.localPosition[2],
      });
      await queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] });
      await refetchDamages();
      setDraftDamage(null);
      setDraftNote('');
    } catch (err: any) {
      setDamageSaveError(err.message || 'Không thể lưu hư hỏng.');
    } finally {
      setIsSavingDamage(false);
    }
  };

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
        width: 'clamp(320px, 26vw, 390px)',
        height: 'auto',
        maxHeight: 'calc(100dvh - 112px)',
        zIndex: 40,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8, 16, 28, 0.92)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(56, 189, 248, 0.28)',
        borderRadius: '16px',
        padding: '16px 14px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55), 0 0 20px rgba(0, 242, 254, 0.12)',
        color: '#f8fafc',
        boxSizing: 'border-box',
        overflowY: 'auto',
        userSelect: 'none',
      }}
    >
      {vehicleInspectionMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* ========================================================================= */}
          {/* 1. VEHICLE INSPECTION MODE CONTENT                                        */}
          {/* ========================================================================= */}
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid #00f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00f2fe',
                }}
              >
                <Wrench size={13} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                KIỂM TRA BỘ PHẬN 3D
              </span>
            </div>

            <button
              type="button"
              onClick={() => exitVehicleInspectionMode()}
              title="Thoát kiểm tra"
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
              }}
            >
              <X size={14} />
            </button>
          </div>

          {selectedPart ? (
            /* Selected Part Technical Details */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
                  {selectedPart.categoryVi}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  {selectedPart.nameVi}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
                  Mã bộ phận: {selectedPart.id}
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: PART_STATUS_CONFIG[selectedPart.status]?.bg || 'rgba(16, 185, 129, 0.15)',
                  border: `1px solid ${PART_STATUS_CONFIG[selectedPart.status]?.color || '#10b981'}44`,
                  color: PART_STATUS_CONFIG[selectedPart.status]?.color || '#34d399',
                  fontSize: '11px',
                  fontWeight: 700,
                  width: 'fit-content',
                }}
              >
                <CheckCircle2 size={12} />
                <span>{PART_STATUS_CONFIG[selectedPart.status]?.labelVi || 'Bình thường'}</span>
              </div>

              {/* Door Dynamic Articulation Status Note */}
              {selectedPart.id.startsWith('DOOR_') && (
                <div
                  style={{
                    background: 'rgba(0, 242, 254, 0.10)',
                    border: '1px solid rgba(0, 242, 254, 0.35)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '11px',
                    color: '#e0f2fe',
                    lineHeight: '1.4',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#00f2fe' }}>Khớp bản lề tự động: </span>
                  Cửa xe đang mở 65° hướng ra ngoài theo trục vật lý. Camera đã chuyển sang quan sát mặt ngoài của cửa.
                </div>
              )}

              {/* Part Description */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '11px',
                  color: '#cbd5e1',
                  lineHeight: '1.45',
                }}
              >
                {selectedPart.descriptionVi}
              </div>

              {/* Specifications List */}
              {selectedPart.specs && selectedPart.specs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Thông số kỹ thuật:
                  </div>
                  {selectedPart.specs.map((sp, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        background: 'rgba(15, 23, 42, 0.5)',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                    >
                      <span style={{ color: '#94a3b8' }}>{sp.label}</span>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>{sp.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Part Inspection Assessment Form */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
                    ĐÁNH GIÁ TÌNH TRẠNG BỘ PHẬN
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {activeInspection ? 'Phiên đang mở' : 'Tạo mới phiên'}
                  </span>
                </div>

                {/* Condition Selector Chips */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {(
                    [
                      { condition: 'GOOD', label: 'Tốt / Bình thường' },
                      { condition: 'SCRATCH', label: 'Trầy xước' },
                      { condition: 'DENT', label: 'Móp méo' },
                      { condition: 'CRACK', label: 'Nứt vỡ' },
                      { condition: 'OTHER_DAMAGE', label: 'Hư hỏng khác' },
                    ] as const
                  ).map((item) => {
                    const isSelected = partCondition === item.condition;
                    const conf = INSPECTION_ITEM_CONDITION_CONFIG[item.condition];
                    return (
                      <button
                        key={item.condition}
                        type="button"
                        onClick={() => setPartCondition(item.condition)}
                        style={{
                          background: isSelected ? conf.bg : 'rgba(15, 23, 42, 0.6)',
                          border: isSelected ? `1.5px solid ${conf.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: isSelected ? conf.color : '#cbd5e1',
                          fontSize: '10.5px',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: conf.color,
                          }}
                        />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Part Note Input */}
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                    Ghi chú chi tiết:
                  </div>
                  <input
                    type="text"
                    value={partNote}
                    onChange={(e) => setPartNote(e.target.value)}
                    placeholder="Ghi chú hiện trạng, chi tiết vết trầy..."
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      color: '#ffffff',
                      fontSize: '11px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Feedback message */}
                {inspectionFeedback && (
                  <div
                    style={{
                      background:
                        inspectionFeedback.type === 'success'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(239, 68, 68, 0.15)',
                      border:
                        inspectionFeedback.type === 'success'
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: inspectionFeedback.type === 'success' ? '#34d399' : '#f87171',
                      fontSize: '10.5px',
                      fontWeight: 600,
                    }}
                  >
                    {inspectionFeedback.text}
                  </div>
                )}

                {/* Save Part Assessment Button */}
                <button
                  type="button"
                  onClick={handleSavePartInspection}
                  disabled={isSavingPart}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#080c16',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: isSavingPart ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(0, 242, 254, 0.3)',
                  }}
                >
                  <Save size={13} />
                  <span>{isSavingPart ? 'ĐANG LƯU ĐÁNH GIÁ...' : 'LƯU ĐÁNH GIÁ BỘ PHẬN NÀY'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => enterVehicleDamageMappingMode(selectedPart.id)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.35) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.6)',
                    color: '#fbbf24',
                    borderRadius: '8px',
                    padding: '9px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.25)',
                  }}
                >
                  <AlertTriangle size={13} color="#f59e0b" />
                  <span>GHI NHẬN HƯ HỎNG BỘ PHẬN NÀY</span>
                </button>
                <button
                  type="button"
                  onClick={() => clearVehiclePartSelection()}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 242, 254, 0.2)',
                    border: '1px solid #00f2fe',
                    color: '#00f2fe',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Đóng bộ phận này
                </button>
                <button
                  type="button"
                  onClick={() => exitVehicleInspectionMode()}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Thoát kiểm tra xe
                </button>
              </div>
            </div>
          ) : (
            /* Inspection Overview & Guide */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Active / Latest Inspection Status Card */}
              {activeInspection ? (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(0, 242, 254, 0.35)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.04em' }}>
                      ĐỢT KIỂM TRA ĐANG TIẾN HÀNH
                    </span>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: '#34d399',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                      }}
                    >
                      ĐANG MỞ
                    </span>
                  </div>

                  <div style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
                    Bắt đầu: {new Date(activeInspection.startedAt).toLocaleTimeString('vi-VN')} • Đã đánh giá:{' '}
                    <strong style={{ color: '#00f2fe' }}>{activeInspection.items?.length || 0}</strong> bộ phận
                  </div>

                  {/* Inspected parts chips */}
                  {activeInspection.items && activeInspection.items.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '90px', overflowY: 'auto' }}>
                      {activeInspection.items.map((item) => {
                        const conf = INSPECTION_ITEM_CONDITION_CONFIG[item.conditionStatus];
                        return (
                          <span
                            key={item.id}
                            style={{
                              fontSize: '9.5px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: conf?.bg || 'rgba(15, 23, 42, 0.5)',
                              border: `1px solid ${conf?.border || 'rgba(255, 255, 255, 0.1)'}`,
                              color: conf?.color || '#cbd5e1',
                              fontWeight: 600,
                            }}
                          >
                            {getPartById(item.vehiclePartCode)?.nameVi || item.vehiclePartCode}: {conf?.labelVi || item.conditionStatus}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Complete Inspection Button */}
                  <button
                    type="button"
                    onClick={handleCompleteInspection}
                    disabled={isCompletingInspection || !activeInspection.items || activeInspection.items.length === 0}
                    style={{
                      width: '100%',
                      background:
                        activeInspection.items && activeInspection.items.length > 0
                          ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                          : 'rgba(30, 41, 59, 0.6)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      color: activeInspection.items && activeInspection.items.length > 0 ? '#052e16' : '#64748b',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor:
                        activeInspection.items && activeInspection.items.length > 0 && !isCompletingInspection
                          ? 'pointer'
                          : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow:
                        activeInspection.items && activeInspection.items.length > 0
                          ? '0 2px 10px rgba(16, 185, 129, 0.3)'
                          : 'none',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>{isCompletingInspection ? 'ĐANG HOÀN TẤT...' : 'HOÀN TẤT BIÊN BẢN KIỂM TRA'}</span>
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {latestInspection ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                          Biên bản kiểm tra gần nhất
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: INSPECTION_RESULT_CONFIG[latestInspection.overallResult || 'PASS']?.color,
                            background: INSPECTION_RESULT_CONFIG[latestInspection.overallResult || 'PASS']?.bg,
                            border: `1px solid ${INSPECTION_RESULT_CONFIG[latestInspection.overallResult || 'PASS']?.border}`,
                          }}
                        >
                          {INSPECTION_RESULT_CONFIG[latestInspection.overallResult || 'PASS']?.labelVi}
                        </span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#cbd5e1', marginTop: '4px' }}>
                        Thời gian: {new Date(latestInspection.completedAt || latestInspection.createdAt).toLocaleString('vi-VN')}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Số bộ phận: {latestInspection.totalInspectedCount} • Bất thường: {latestInspection.abnormalCount}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Xe chưa có biên bản kiểm tra được lưu. Bấm bên dưới để bắt đầu đợt kiểm tra mới.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleStartNewInspection}
                    disabled={isSavingPart}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      color: '#080c16',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: isSavingPart ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Plus size={13} />
                    <span>BẮT ĐẦU ĐỢT KIỂM TRA MỚI</span>
                  </button>
                </div>
              )}

              {/* Feedback alert */}
              {inspectionFeedback && (
                <div
                  style={{
                    background:
                      inspectionFeedback.type === 'success'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    border:
                      inspectionFeedback.type === 'success'
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: inspectionFeedback.type === 'success' ? '#34d399' : '#f87171',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {inspectionFeedback.text}
                </div>
              )}

              {/* Guide Note */}
              <div
                style={{
                  background: 'rgba(0, 242, 254, 0.08)',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '11px',
                  color: '#e2e8f0',
                  lineHeight: '1.45',
                }}
              >
                <div style={{ fontWeight: 800, color: '#00f2fe', marginBottom: '3px' }}>
                  HƯỚNG DẪN KIỂM TRA
                </div>
                Nhấp trực tiếp vào bộ phận trên mô hình 3D hoặc chọn danh mục bên dưới để đánh giá tình trạng kỹ thuật.
              </div>

              {/* Quick Part Selection Chips */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Bộ phận thường kiểm tra:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {QUICK_INSPECTION_PARTS.map((p) => {
                    const isPartActive = selectedVehiclePartId === p.id;
                    const evaluatedItem = activeInspection?.items?.find(
                      (i) => i.vehiclePartCode.toUpperCase() === p.id.toUpperCase()
                    );
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectVehiclePart(p.id)}
                        style={{
                          background: isPartActive
                            ? 'rgba(0, 242, 254, 0.22)'
                            : evaluatedItem
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(15, 23, 42, 0.8)',
                          border: isPartActive
                            ? '1px solid #00f2fe'
                            : evaluatedItem
                            ? '1px solid rgba(16, 185, 129, 0.4)'
                            : '1px solid rgba(56, 189, 248, 0.25)',
                          borderRadius: '6px',
                          padding: '6px',
                          color: isPartActive ? '#00f2fe' : evaluatedItem ? '#34d399' : '#f8fafc',
                          fontSize: '10.5px',
                          fontWeight: isPartActive ? 700 : 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span>{p.label}</span>
                        {evaluatedItem && <Check size={11} color="#34d399" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => exitVehicleInspectionMode()}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                Thoát chế độ kiểm tra
              </button>
            </div>
          )}
        </div>
      ) : vehicleDamageMappingMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* ========================================================================= */}
          {/* 2. MAINTENANCE & 3D DAMAGE MAPPING CONTENT                                */}
          {/* ========================================================================= */}
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f87171',
                }}
              >
                <AlertTriangle size={13} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                BẢO DƯỠNG & HƯ HỎNG 3D
              </span>
            </div>

            <button
              type="button"
              onClick={() => returnToVehicleOverview()}
              title="Thoát bảo dưỡng"
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
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Draft Damage Recording Form */}
          {draftDamage ? (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#f87171' }}>
                GHI NHẬN ĐIỂM HƯ HỎNG MỚI
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                Bộ phận: <span style={{ fontWeight: 700, color: '#ffffff' }}>{draftDamage.partCode}</span>
              </div>

              {/* Severity Buttons */}
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Mức độ:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                  {(['MINOR', 'MODERATE', 'SEVERE'] as DamageSeverity[]).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setDraftSeverity(sev)}
                      style={{
                        padding: '4px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        border: draftSeverity === sev ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: draftSeverity === sev ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                        color: draftSeverity === sev ? '#fca5a5' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {sev === 'MINOR' ? 'Nhẹ' : sev === 'MODERATE' ? 'Vừa' : 'Nặng'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Damage Type Buttons */}
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Loại hư hỏng:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {[
                    { id: 'SCRATCH', label: 'Trầy xước' },
                    { id: 'DENT', label: 'Móp méo' },
                    { id: 'CRACK', label: 'Nứt vỡ' },
                    { id: 'OTHER', label: 'Khác' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDraftType(t.id as DamageType)}
                      style={{
                        padding: '4px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        border: draftType === t.id ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: draftType === t.id ? 'rgba(0, 242, 254, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                        color: draftType === t.id ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note input */}
              <input
                type="text"
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Ghi chú chi tiết vị trí hư hỏng..."
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '11px',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />

              {damageSaveError && (
                <div style={{ fontSize: '10px', color: '#f87171' }}>{damageSaveError}</div>
              )}

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  disabled={isSavingDamage}
                  onClick={handleSaveDraftDamage}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(90deg, #ef4444, #f87171)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '6px',
                    padding: '7px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isSavingDamage ? 'Đang lưu...' : 'Lưu điểm này'}
                </button>
                <button
                  type="button"
                  onClick={() => setDraftDamage(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    borderRadius: '6px',
                    padding: '7px 12px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '11px',
                color: '#94a3b8',
                lineHeight: '1.4',
              }}
            >
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>Hướng dẫn: </span>
              Nhấp vào bất kỳ điểm nào trên bề mặt xe 3D để tạo cờ hư hỏng mới.
            </div>
          )}

          {/* Persisted Damages List */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Danh sách hư hỏng đã lưu ({damages.length}):
            </div>
            {damages.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
                Chưa có ghi nhận hư hỏng nào.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '160px', overflowY: 'auto' }}>
                {damages.map((dmg) => (
                  <div
                    key={dmg.id}
                    onClick={() => selectDamageRecord(selectedDamageId === dmg.id ? null : dmg.id)}
                    style={{
                      background: selectedDamageId === dmg.id ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                      border: selectedDamageId === dmg.id ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{dmg.vehiclePartCode}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>{dmg.note || dmg.damageType}</div>
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: dmg.severity === 'SEVERE' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                        color: dmg.severity === 'SEVERE' ? '#f87171' : '#fbbf24',
                      }}
                    >
                      {dmg.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => returnToVehicleOverview()}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            Thoát chế độ bảo dưỡng
          </button>
        </div>
      ) : vehicleHandoverMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* ========================================================================= */}
          {/* 3. VEHICLE HANDOVER MODE CONTENT (AUTHORITATIVE SINGLE PANEL)             */}
          {/* ========================================================================= */}
          {isViewingInspectionDetail ? (
            /* ----------------------------------------------------------------------- */
            /* 3A. READ-ONLY VEHICLE INSPECTION DETAIL VIEW                            */
            /* ----------------------------------------------------------------------- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Header with Back button and Close */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(0, 242, 254, 0.3)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsViewingInspectionDetail(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0, 242, 254, 0.12)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    color: '#00f2fe',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>QUAY LẠI BÀN GIAO</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsViewingInspectionDetail(false)}
                  title="Đóng chi tiết kiểm tra"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Inspection Summary Card */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                    BIÊN BẢN KIỂM TRA XE
                  </span>
                  {latestInspection?.overallResult && (
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: INSPECTION_RESULT_CONFIG[latestInspection.overallResult].color,
                        background: INSPECTION_RESULT_CONFIG[latestInspection.overallResult].bg,
                        border: `1px solid ${INSPECTION_RESULT_CONFIG[latestInspection.overallResult].border}`,
                      }}
                    >
                      {INSPECTION_RESULT_CONFIG[latestInspection.overallResult].labelVi}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Người kiểm tra:</span>
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>
                    {latestInspection?.inspectedByName || eligibility?.inspectorName || 'EVShare Staff'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Thời gian hoàn tất:</span>
                  <span style={{ fontWeight: 600, color: '#cbd5e1' }}>
                    {latestInspection?.completedAt
                      ? new Date(latestInspection.completedAt).toLocaleString('vi-VN')
                      : eligibility?.inspectionCompletedAt
                      ? new Date(eligibility.inspectionCompletedAt).toLocaleString('vi-VN')
                      : '--'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Số bộ phận đã đánh giá:</span>
                  <span style={{ fontWeight: 700, color: '#00f2fe' }}>
                    {latestInspection?.totalInspectedCount || latestInspection?.items?.length || 0} bộ phận
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Điểm bất thường:</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: (latestInspection?.abnormalCount || 0) > 0 ? '#fbbf24' : '#34d399',
                    }}
                  >
                    {latestInspection?.abnormalCount || 0} điểm
                  </span>
                </div>

                {latestInspection?.summaryNote && (
                  <div
                    style={{
                      marginTop: '4px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: '#cbd5e1',
                      fontSize: '10.5px',
                    }}
                  >
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Ghi chú tổng kết: </span>
                    {latestInspection.summaryNote}
                  </div>
                )}
              </div>

              {/* Inspected Parts List (Read-Only) */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Danh sách bộ phận đã kiểm tra:
                </div>
                {(!latestInspection?.items || latestInspection.items.length === 0) ? (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
                    Chưa có mục kiểm tra chi tiết.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '220px', overflowY: 'auto' }}>
                    {latestInspection.items.map((item) => {
                      const part = getPartById(item.vehiclePartCode);
                      const conf = INSPECTION_ITEM_CONDITION_CONFIG[item.conditionStatus];
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 10px',
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: `1px solid ${conf ? conf.border : 'rgba(255, 255, 255, 0.08)'}`,
                            borderRadius: '8px',
                            fontSize: '11px',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#ffffff', fontWeight: 700 }}>
                              {part?.nameVi || item.vehiclePartCode}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>
                              {part?.categoryVi || item.vehiclePartCode}
                              {item.note ? ` • ${item.note}` : ''}
                            </span>
                          </div>

                          <span
                            style={{
                              color: conf?.color || '#34d399',
                              background: conf?.bg || 'rgba(16, 185, 129, 0.12)',
                              border: `1px solid ${conf?.border || 'rgba(16, 185, 129, 0.3)'}`,
                              fontWeight: 700,
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {conf?.labelVi || item.conditionStatus}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Back to Handover button */}
              <button
                type="button"
                onClick={() => setIsViewingInspectionDetail(false)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                Quay lại quy trình bàn giao
              </button>
            </div>
          ) : (
            /* ----------------------------------------------------------------------- */
            /* 3B. HANDOVER OVERVIEW SUBVIEW                                           */
            /* ----------------------------------------------------------------------- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(0, 242, 254, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'rgba(0, 242, 254, 0.15)',
                      border: '1px solid #00f2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00f2fe',
                    }}
                  >
                    <Key size={13} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                    QUY TRÌNH BÀN GIAO XE
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => returnToVehicleOverview()}
                  title="Thoát bàn giao"
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
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* CASE C: NO ACTIVE / UPCOMING BOOKING REQUIRING HANDOVER */}
              {((!targetBookingId && (!handover || handover.status === 'COMPLETED')) || eligibility?.reason === 'NO_BOOKING' || handover?.status === 'COMPLETED') ? (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '10px',
                    padding: '24px 16px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
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
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
                      Hiện không có lượt đặt xe nào cần bàn giao.
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }}>
                      {vehicle.status === 'AVAILABLE'
                        ? 'Xe đang ở trạng thái sẵn sàng (AVAILABLE) nhưng chưa có lịch đặt mới sắp tới để chuẩn bị bàn giao.'
                        : 'Tất cả các lượt bàn giao trước đó đã hoàn tất hoặc xe chưa có lịch đặt mới.'}
                    </div>
                  </div>

                  {/* Historical Handover Summary Info if exists */}
                  {handoverHistory.length > 0 && (
                    <div
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginTop: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>Lịch sử bàn giao:</span>
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>{handoverHistory.length} lượt hoàn tất</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                        <span style={{ color: '#64748b' }}>Lần bàn giao gần nhất:</span>
                        <span style={{ color: '#cbd5e1' }}>
                          {handoverHistory[0]?.completedAt
                            ? new Date(handoverHistory[0].completedAt).toLocaleString('vi-VN')
                            : 'Đã lưu trữ'}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => returnToVehicleOverview()}
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      padding: '9px 16px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '8px',
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
                    <ArrowLeft size={13} />
                    <span>ĐÓNG QUY TRÌNH BÀN GIAO</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* CASE A & B: Handover & Recipient Summary Card */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '11px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Xe:</span>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>{code} — {vehicle.licensePlate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Người nhận:</span>
                      <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                        {handover?.coOwnerName || eligibility?.recipientName || 'Đồng sở hữu'}
                      </span>
                    </div>
                    {(handover?.bookingStartTime || eligibility?.bookingStartTime) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Khung giờ:</span>
                        <span style={{ fontWeight: 600, color: '#cbd5e1' }}>
                          {formatBookingDate(handover?.bookingStartTime || eligibility?.bookingStartTime)}{' '}
                          ({formatBookingTime(handover?.bookingStartTime || eligibility?.bookingStartTime)} - {formatBookingTime(handover?.bookingEndTime || eligibility?.bookingEndTime)})
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8' }}>Trạng thái:</span>
                      {handover ? (
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '10px',
                            color: HANDOVER_STATUS_CONFIG[handover.status || 'PENDING_PREPARATION'].color,
                            background: HANDOVER_STATUS_CONFIG[handover.status || 'PENDING_PREPARATION'].badgeBg,
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {HANDOVER_STATUS_CONFIG[handover.status || 'PENDING_PREPARATION'].labelVi}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '10px',
                            color: isHandoverEligibleForReady ? '#34d399' : '#f59e0b',
                            background: isHandoverEligibleForReady ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {isHandoverEligibleForReady ? 'ĐÃ KIỂM TRA TIỀN BÀN GIAO' : 'CHỜ CHUẨN BỊ'}
                        </span>
                      )}
                    </div>
                  </div>

              {/* Action Error Alert */}
              {actionErrorMsg && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#f87171',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {actionErrorMsg}
                </div>
              )}



              {/* ================================================================= */}
              {/* Inspection Status & Handover Eligibility Assessment               */}
              {/* ================================================================= */}
              {isInspectionPassed ? (
                /* Eligible / Passed Case: Inspection is completed and passed */
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="#34d399" />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>
                        KIỂM TRA XE ĐẠT YÊU CẦU
                      </span>
                    </div>
                    {(latestInspection?.overallResult || eligibility?.inspectionResult) && (
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: INSPECTION_RESULT_CONFIG[(latestInspection?.overallResult || eligibility?.inspectionResult) as keyof typeof INSPECTION_RESULT_CONFIG]?.color || '#34d399',
                          background: INSPECTION_RESULT_CONFIG[(latestInspection?.overallResult || eligibility?.inspectionResult) as keyof typeof INSPECTION_RESULT_CONFIG]?.bg || 'rgba(16, 185, 129, 0.2)',
                          border: `1px solid ${INSPECTION_RESULT_CONFIG[(latestInspection?.overallResult || eligibility?.inspectionResult) as keyof typeof INSPECTION_RESULT_CONFIG]?.border || 'rgba(16, 185, 129, 0.4)'}`,
                        }}
                      >
                        {INSPECTION_RESULT_CONFIG[(latestInspection?.overallResult || eligibility?.inspectionResult) as keyof typeof INSPECTION_RESULT_CONFIG]?.labelVi || 'ĐẠT TIÊU CHUẨN'}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px', color: '#cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Kiểm tra bởi:</span>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>
                        {latestInspection?.inspectedByName || eligibility?.inspectorName || 'EVShare Staff'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Thời gian:</span>
                      <span style={{ fontWeight: 600 }}>
                        {latestInspection?.completedAt
                          ? new Date(latestInspection.completedAt).toLocaleString('vi-VN')
                          : eligibility?.inspectionCompletedAt
                          ? new Date(eligibility.inspectionCompletedAt).toLocaleString('vi-VN')
                          : 'Hợp lệ'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Thống kê:</span>
                      <span>
                        <strong style={{ color: '#00f2fe' }}>
                          {latestInspection?.totalInspectedCount || eligibility?.inspectedPartsCount || 0}
                        </strong>{' '}
                        bộ phận •{' '}
                        <strong style={{ color: (latestInspection?.abnormalCount || 0) > 0 ? '#fbbf24' : '#34d399' }}>
                          {latestInspection?.abnormalCount || 0}
                        </strong>{' '}
                        bất thường
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Tham chiếu:</span>
                      <span style={{ color: '#cbd5e1' }}>
                        {code} {targetBookingId ? `• Đặt lịch #${targetBookingId.substring(0, 8).toUpperCase()}` : ''}
                      </span>
                    </div>
                  </div>

                  {handoverBlockReason && (
                    <div
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: '#fbbf24',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle size={13} />
                      <span>{handoverBlockReason}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsViewingInspectionDetail(true)}
                    style={{
                      marginTop: '4px',
                      background: 'rgba(0, 242, 254, 0.12)',
                      border: '1px solid rgba(0, 242, 254, 0.35)',
                      borderRadius: '6px',
                      padding: '7px',
                      color: '#00f2fe',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>XEM CHI TIẾT KIỂM TRA</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              ) : isInspectionFailed ? (
                /* Ineligible Case: Inspection Failed */
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171' }}>
                    <XCircle size={15} />
                    <span style={{ fontSize: '11.5px', fontWeight: 800 }}>KIỂM TRA XE KHÔNG ĐẠT</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.45' }}>
                    Xe có hư hỏng nghiêm trọng chưa đủ điều kiện an toàn để bàn giao. Vui lòng chuyển sang bảo dưỡng.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setIsViewingInspectionDetail(true)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        padding: '6px',
                        color: '#cbd5e1',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Xem chi tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => enterVehicleMaintenanceMode()}
                      style={{
                        background: 'rgba(239, 68, 68, 0.25)',
                        border: '1px solid #ef4444',
                        borderRadius: '6px',
                        padding: '6px',
                        color: '#fca5a5',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Chuyển bảo dưỡng
                    </button>
                  </div>
                </div>
              ) : isInspectionExpired ? (
                /* Ineligible Case: Inspection Expired */
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
                    <Clock size={15} />
                    <span style={{ fontSize: '11.5px', fontWeight: 800 }}>KẾT QUẢ KIỂM TRA ĐÃ QUÁ HẠN</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: '1.45' }}>
                    Kết quả kiểm tra xe đã quá hạn (tối đa 24 giờ). Vui lòng kiểm tra lại xe trước khi bàn giao.
                  </div>
                  <button
                    type="button"
                    onClick={() => enterVehicleInspectionMode()}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#080c16',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Shield size={13} />
                    <span>KIỂM TRA LẠI XE</span>
                  </button>
                </div>
              ) : isInspectionInProgress ? (
                /* Unfinished Inspection Case */
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
                    <Clock size={15} />
                    <span style={{ fontSize: '11.5px', fontWeight: 800 }}>KIỂM TRA XE CHƯA HOÀN TẤT</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: '1.45' }}>
                    Phiên kiểm tra đang được thực hiện dở dang. Vui lòng tiếp tục đánh giá và hoàn tất biên bản.
                  </div>
                  <button
                    type="button"
                    onClick={() => enterVehicleInspectionMode()}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
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
                    <Shield size={13} />
                    <span>TIẾP TỤC KIỂM TRA XE</span>
                  </button>
                </div>
              ) : isLatestInspectionError ? (
                /* Network / Server Error Case */
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171' }}>
                    <AlertTriangle size={15} />
                    <span style={{ fontSize: '11.5px', fontWeight: 800 }}>KHÔNG THỂ TẢI KẾT QUẢ KIỂM TRA XE</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.45' }}>
                    Có lỗi khi kết nối máy chủ để tải biên bản kiểm tra. Vui lòng thử tải lại.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      refetchLatestInspection();
                      refetchEligibility();
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      padding: '7px 12px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      alignSelf: 'flex-start',
                    }}
                  >
                    TẢI LẠI KẾT QUẢ
                  </button>
                </div>
              ) : (
                /* Ineligible Case: No Inspection Record */
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
                    <AlertTriangle size={15} />
                    <span style={{ fontSize: '11.5px', fontWeight: 800 }}>CHƯA CÓ KẾT QUẢ KIỂM TRA XE</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: '1.45' }}>
                    Xe chưa có kết quả kiểm tra hợp lệ để bàn giao. Vui lòng hoàn tất kiểm tra xe trước khi thực hiện bàn giao.
                  </div>
                  <button
                    type="button"
                    onClick={() => enterVehicleInspectionMode()}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#080c16',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Shield size={13} />
                    <span>KIỂM TRA XE NGAY</span>
                  </button>
                </div>
              )}

              {/* Handover Lifecycle Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                {/* 500 / Network Error State for Handover Query */}
                {isBookingHandoverError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      color: '#f87171',
                      marginBottom: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
                      <AlertTriangle size={14} />
                      <span>Không thể tải thông tin bàn giao.</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#cbd5e1' }}>
                      {(bookingHandoverError as any)?.message || 'Vui lòng kiểm tra lại kết nối máy chủ.'}
                    </div>
                    <button
                      type="button"
                      onClick={() => refetchBookingHandover()}
                      style={{
                        padding: '5px 10px',
                        background: 'rgba(239, 68, 68, 0.25)',
                        border: '1px solid #ef4444',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      THỬ LẠI
                    </button>
                  </div>
                )}

                {!handover ? (
                  <div>
                    {isHandoverEligibleForReady ? (
                      <button
                        type="button"
                        onClick={handleMarkHandoverReady}
                        disabled={isSubmittingAction}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#052e16',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          letterSpacing: '0.04em',
                          cursor: isSubmittingAction ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        <Sparkles size={14} />
                        <span>{isSubmittingAction ? 'ĐANG CHUẨN BỊ & XÁC NHẬN...' : 'XÁC NHẬN SẴN SÀNG BÀN GIAO'}</span>
                      </button>
                    ) : (
                      <>
                        <div
                          style={{
                            background: 'rgba(245, 158, 11, 0.12)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            borderRadius: '8px',
                            padding: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#f59e0b',
                            marginBottom: '8px',
                          }}
                        >
                          <AlertTriangle size={15} />
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>
                            {handoverBlockReason || 'Đang chuẩn bị hồ sơ bàn giao...'}
                          </span>
                        </div>

                        {targetBookingId && !handoverBlockReason ? (
                          <button
                            type="button"
                            onClick={handleStartHandoverWorkflow}
                            disabled={isSubmittingAction}
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#082f49',
                              fontWeight: 800,
                              fontSize: '11.5px',
                              letterSpacing: '0.04em',
                              cursor: isSubmittingAction ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)',
                            }}
                          >
                            <Sparkles size={14} />
                            <span>{isSubmittingAction ? 'ĐANG KHỞI TẠO...' : 'TẠO / CHUẨN BỊ HỒ SƠ BÀN GIAO'}</span>
                          </button>
                        ) : null}
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => returnToVehicleOverview()}
                      style={{
                        width: '100%',
                        marginTop: targetBookingId || isHandoverEligibleForReady ? '6px' : '0',
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#94a3b8',
                        fontWeight: 700,
                        fontSize: '11px',
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
                    <div style={{ fontSize: '9.5px', color: isHandoverEligibleForReady ? '#34d399' : '#94a3b8', textAlign: 'center', marginTop: '4px' }}>
                      {isHandoverEligibleForReady
                        ? 'Đã có kết quả kiểm tra đạt chuẩn. Xác nhận để chuẩn bị và chuyển sang trạng thái sẵn sàng bàn giao.'
                        : handoverBlockReason
                        ? handoverBlockReason
                        : 'Khởi tạo hồ sơ bàn giao xe cho lịch đặt hiện tại.'}
                    </div>
                  </div>
                ) : (handover.status === 'PENDING_PREPARATION' || handover.status === 'INSPECTION_IN_PROGRESS') ? (
                  <div>
                    {isHandoverEligibleForReady ? (
                      <button
                        type="button"
                        onClick={handleMarkHandoverReady}
                        disabled={isSubmittingAction}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#052e16',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          letterSpacing: '0.04em',
                          cursor: isSubmittingAction ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        <Sparkles size={14} />
                        <span>{isSubmittingAction ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN SẴN SÀNG BÀN GIAO'}</span>
                      </button>
                    ) : handoverBlockReason ? (
                      <div
                        style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          borderRadius: '8px',
                          padding: '10px',
                          color: '#fbbf24',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <AlertTriangle size={15} />
                        <span>{handoverBlockReason}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => enterVehicleInspectionMode()}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          borderRadius: '8px',
                          color: '#38bdf8',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          letterSpacing: '0.04em',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Shield size={14} />
                        <span>ĐI ĐẾN KIỂM TRA BỘ PHẬN</span>
                      </button>
                    )}
                    <div style={{ fontSize: '9.5px', color: isHandoverEligibleForReady ? '#34d399' : '#94a3b8', textAlign: 'center', marginTop: '4px' }}>
                      {isHandoverEligibleForReady
                        ? 'Đã có kết quả kiểm tra hợp lệ và hồ sơ bàn giao. Xác nhận để chuyển sang trạng thái sẵn sàng bàn giao.'
                        : handoverBlockReason
                        ? handoverBlockReason
                        : 'Xe chưa đủ điều kiện hoàn tất để sẵn sàng bàn giao. Vui lòng hoàn tất kiểm tra bộ phận đạt chuẩn.'}
                    </div>
                  </div>
                ) : null}

                {handover?.status === 'READY_FOR_HANDOVER' && (
                  <div>
                    <button
                      type="button"
                      onClick={handleConfirmStaffHandover}
                      disabled={isSubmittingAction}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#1a052e',
                        fontWeight: 800,
                        fontSize: '11.5px',
                        letterSpacing: '0.04em',
                        cursor: isSubmittingAction ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
                      }}
                    >
                      <UserCheck size={14} />
                      <span>{isSubmittingAction ? 'ĐANG BÀN GIAO...' : 'BÀN GIAO XE CHO ĐỒNG SỞ HỮU'}</span>
                    </button>
                    <div style={{ fontSize: '9.5px', color: '#c084fc', textAlign: 'center', marginTop: '4px' }}>
                      Xe đã sẵn sàng. Bàn giao quyền vận hành cho đồng sở hữu.
                    </div>
                  </div>
                )}

                {handover?.status === 'HANDED_OVER' && (
                  <div
                    style={{
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#c084fc',
                      fontSize: '11px',
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  >
                    XE ĐÃ ĐƯỢC BÀN GIAO — ĐANG CHỜ ĐỒNG SỞ HỮU XÁC NHẬN
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => returnToVehicleOverview()}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '2px',
                  }}
                >
                  Đóng quy trình bàn giao
                </button>
              </div>
            </>
          )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 4. DEFAULT VEHICLE DETAIL & OPERATIONAL TABS (REFERENCE DESIGN)          */}
          {/* ========================================================================= */}
          {/* Header: Title, Status Badge & Close Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.06em', color: '#f8fafc' }}>
              CHI TIẾT XE
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Live Status Pill */}
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: statusMeta.color,
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: statusMeta.dotColor,
                    boxShadow: `0 0 8px ${statusMeta.dotColor}`,
                  }}
                />
                {statusMeta.labelVi}
              </span>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  title="Đóng chi tiết xe"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Vehicle Summary Card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '14px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '42px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25), rgba(15, 23, 42, 0.9))',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Disc size={24} color="#00f2fe" />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                {code}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {code === 'EV01' ? 'VinFast VF8 Plus' : 'Stylized EV Prototype'}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#e2e8f0',
                  marginTop: '2px',
                  letterSpacing: '0.04em',
                }}
              >
                {vehicle.licensePlate || (code === 'EV01' ? '51K - 123.45' : '51K - 678.90')}
              </div>
            </div>
          </div>

          {/* Battery Level Progress Bar */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isCharging ? (
                  <BatteryCharging size={16} color="#00f2fe" />
                ) : (
                  <Battery size={16} color="#10b981" />
                )}
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                  {battery}%
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                ~ {estimatedRange} km
              </span>
            </div>

            {/* Cyan glowing progress bar track */}
            <div
              style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${battery}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00f2fe 0%, #38bdf8 100%)',
                  borderRadius: '9999px',
                  boxShadow: '0 0 10px rgba(0, 242, 254, 0.6)',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '8px',
                paddingTop: '6px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Hệ thống sạc & pin:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => enterChargingMode(vehicle?.id)}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    color: '#34d399',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.45)';
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                  }}
                >
                  <BatteryCharging size={11} color="#10b981" />
                  <span>SẠC XE</span>
                </button>

                <button
                  type="button"
                  onClick={() => enterBatteryXrayMode(vehicle?.id)}
                  style={{
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    color: '#38bdf8',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00f2fe';
                    e.currentTarget.style.background = 'rgba(0, 242, 254, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
                  }}
                >
                  <Zap size={11} color="#00f2fe" />
                  <span>X-RAY PIN</span>
                </button>
              </div>
            </div>
          </div>

          {/* Telemetry Specs Rows */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '7px',
              marginBottom: '12px',
              padding: '10px 12px',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '12px',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={12} color="#38bdf8" /> Vị trí hiện tại
              </span>
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                {slot?.name || 'Khu vực vận hành'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Gauge size={12} color="#38bdf8" /> Odo
              </span>
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>{odoKm} km</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={12} color="#38bdf8" /> Lần bảo dưỡng gần nhất
              </span>
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                10/08/2024 <span style={{ color: '#fbbf24', fontSize: '10px' }}>(Còn 1.440 km)</span>
              </span>
            </div>
          </div>

          {/* Segmented Tabs: TÌNH TRẠNG | BÀN GIAO | BẢO DƯỠNG */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '4px',
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '3px',
              borderRadius: '10px',
              marginBottom: '12px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
            }}
          >
            {(['STATUS', 'HANDOVER', 'MAINTENANCE'] as DetailTab[]).map((tab) => {
              const isActive = activeTab === tab;
              const label =
                tab === 'STATUS'
                  ? 'TÌNH TRẠNG'
                  : tab === 'HANDOVER'
                  ? 'BÀN GIAO'
                  : 'BẢO DƯỠNG';

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: isActive ? 'rgba(0, 242, 254, 0.22)' : 'transparent',
                    border: isActive ? '1px solid #00f2fe' : '1px solid transparent',
                    color: isActive ? '#00f2fe' : '#94a3b8',
                    borderRadius: '8px',
                    padding: '6px 4px',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'STATUS' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              {/* Card 1: Pin */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '9px 10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
                  <Battery size={12} color="#00f2fe" />
                  <span>Pin</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>{battery}%</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>~ {estimatedRange} km</div>
              </div>

              {/* Card 2: Tình trạng xe */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '9px 10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
                  <Shield size={12} color="#10b981" />
                  <span>Tình trạng</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>Tốt</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Không lỗi</div>
              </div>

              {/* Card 3: Lốp xe */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '9px 10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
                  <Disc size={12} color="#38bdf8" />
                  <span>Lốp xe</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>Bình thường</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Áp suất ổn định</div>
              </div>

              {/* Card 4: Nhiệt độ pin */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '9px 10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
                  <Thermometer size={12} color="#f59e0b" />
                  <span>Nhiệt độ</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>27°C</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Ngưỡng an toàn</div>
              </div>
            </div>
          )}

          {activeTab === 'HANDOVER' && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '11px',
                marginBottom: '14px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>Quy trình bàn giao</div>
              <div style={{ color: '#94a3b8', marginBottom: '8px' }}>
                {eligibility?.eligible
                  ? 'Xe đã sẵn sàng cho quy trình bàn giao cho đồng sở hữu.'
                  : eligibility?.reason || 'Chưa có lịch bàn giao ngay.'}
              </div>
              <button
                type="button"
                onClick={() => enterVehicleHandoverMode()}
                style={{
                  width: '100%',
                  background: 'rgba(0, 242, 254, 0.2)',
                  border: '1px solid #00f2fe',
                  color: '#00f2fe',
                  borderRadius: '8px',
                  padding: '7px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tiến hành bàn giao xe
              </button>
            </div>
          )}

          {activeTab === 'MAINTENANCE' && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '11px',
                marginBottom: '14px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>Hồ sơ hư hỏng & bảo dưỡng</div>
              <div style={{ color: '#94a3b8', marginBottom: '8px' }}>
                Đã ghi nhận: <span style={{ color: '#00f2fe', fontWeight: 700 }}>{damages.length}</span> vị trí hư hỏng
              </div>

              {/* Phase 15: Open dedicated Maintenance Management Panel */}
              <button
                type="button"
                onClick={() => enterVehicleMaintenanceMode()}
                style={{
                  width: '100%',
                  marginBottom: '8px',
                  background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
                }}
              >
                <Wrench size={13} />
                <span>QUẢN LÝ BẢO DƯỠNG XE</span>
              </button>

              <button
                type="button"
                onClick={() => enterVehicleDamageMappingMode()}
                style={{
                  width: '100%',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #f87171',
                  color: '#f87171',
                  borderRadius: '8px',
                  padding: '7px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Ghi nhận hư hỏng 3D
              </button>

              {/* Phase 14: Dedicated 3D Damage History */}
              <button
                type="button"
                onClick={() => enterVehicleDamageHistoryMode()}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid rgba(0, 242, 254, 0.4)',
                  color: '#00f2fe',
                  borderRadius: '8px',
                  padding: '7px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Lịch sử hư hỏng 3D
              </button>
            </div>
          )}

          {/* Primary Action Button: BÀN GIAO XE */}
          <button
            type="button"
            onClick={() => enterVehicleHandoverMode()}
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #00f2fe 0%, #38bdf8 100%)',
              color: '#08101c',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(0, 242, 254, 0.35)',
              transition: 'all 0.18s ease',
              marginBottom: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 242, 254, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 242, 254, 0.35)';
            }}
          >
            <Key size={16} />
            <span>BÀN GIAO XE</span>
            <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
          </button>

          {/* Secondary Actions Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={() => enterChargingMode(vehicle?.id)}
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.15) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#34d399',
                borderRadius: '10px',
                padding: '9px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.28)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.15) 100%)';
                e.currentTarget.style.color = '#34d399';
              }}
            >
              <BatteryCharging size={13} color="#10b981" />
              <span>SẠC XE</span>
            </button>

            <button
              type="button"
              onClick={() => enterBatteryXrayMode(vehicle?.id)}
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.22) 0%, rgba(14, 165, 233, 0.15) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.5)',
                color: '#38bdf8',
                borderRadius: '10px',
                padding: '9px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f2fe';
                e.currentTarget.style.background = 'rgba(0, 242, 254, 0.25)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.22) 0%, rgba(14, 165, 233, 0.15) 100%)';
                e.currentTarget.style.color = '#38bdf8';
              }}
            >
              <Zap size={13} color="#00f2fe" />
              <span>X-RAY PIN</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => enterVehicleMaintenanceMode()}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#f8fafc',
                borderRadius: '10px',
                padding: '9px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f2fe';
                e.currentTarget.style.background = 'rgba(0, 242, 254, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
              }}
            >
              <Wrench size={13} color="#00f2fe" />
              <span>BẢO DƯỠNG</span>
            </button>

            <button
              type="button"
              onClick={() => enterVehicleInspectionMode(vehicle?.id)}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#f8fafc',
                borderRadius: '10px',
                padding: '9px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f2fe';
                e.currentTarget.style.background = 'rgba(0, 242, 254, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
              }}
            >
              <Shield size={13} color="#00f2fe" />
              <span>KIỂM TRA BỘ PHẬN</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
