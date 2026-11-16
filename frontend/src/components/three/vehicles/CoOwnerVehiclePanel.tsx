import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { VehicleHandoverData } from '../../../types/handover';
import { Booking } from '../../../types/booking';
import { TripData } from '../../../types/trip';
import { DamageRecordData } from '../../../types/damage';
import {
  MaintenanceResponse,
  MaintenanceApprovalResponse,
  MAINTENANCE_TYPE_CONFIG,
  MAINTENANCE_PRIORITY_CONFIG,
} from '../../../types/maintenance';
import {
  resolveVehicleCode,
  resolveVehicleDisplayName,
  resolveVehicleSubtitle,
} from './vehicleModelConfig';
import { fetchActiveVehicleHandovers, fetchHandoverHistory } from '../../../services/handoverApi';
import { fetchVehicleBookings } from '../../../services/bookingApi';
import {
  fetchActiveTripForVehicle,
  requestTripReturnApi,
  fetchVehicleTrips,
  fetchLatestCompletedTripForVehicle,
  acknowledgeTripViewedApi,
} from '../../../services/tripApi';
import { fetchVehicleMaintenance, fetchMaintenanceApproval } from '../../../services/maintenanceApi';
import { fetchVehicleDamages } from '../../../services/damageApi';
import { fetchLatestCompletedInspection, fetchActiveInspection } from '../../../services/inspectionApi';
import { VehicleInspectionResponse } from '../../../types/inspection';
import {
  DAMAGE_TYPE_LABELS,
  DAMAGE_SEVERITY_CONFIG,
} from '../../../types/damage';
import { DEFAULT_EV_HOTSPOTS, resolveVehicleHotspots } from '../../../data/vehicleHotspotConfig';
import { SEMANTIC_PART_LABELS_VI } from '../../../data/vehicleParts';
import { normalizeHotspotPartCode } from './VehicleHotspotLayer';
import {
  normalizeComponentId,
  resolveUnmappedDamages,
  resolveSeverityColor,
  resolveSeverityLabelVi,
  getSeverityRank,
} from '../../../services/vehicleDamageMappingService';
import {
  fetchIncidentForBooking,
  fetchPrefilledDispute,
  fetchDisputesForVehicle,
} from '../../../services/disputeApi';
import {
  BookingConflictIncident,
  PrefilledDisputeData,
  DisputeResponse,
} from '../../../types/dispute';
import { fetchBookingViolation } from '../../../services/violationApi';
import { BookingViolationResponse } from '../../../types/violation';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore, VEHICLE_STATUS_LABELS } from '../../../store/worldStore';
import { useCoOwnerTripPrerequisites } from '../../../hooks/useCoOwnerTripPrerequisites';
import {
  Car,
  Zap,
  Calendar,
  Users,
  Search,
  Key,
  X,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Wrench,
  BatteryCharging,
  ShieldCheck,
  ChevronRight,
  Flag,
  Loader2,
  RotateCcw,
  History,
  ArrowLeft,
  FileText,
  Scale,
} from 'lucide-react';

function formatDate(isoString?: string): string {
  if (!isoString) return '--/--/----';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--/--/----';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '--/--/----';
  }
}

function formatTimeRange(startIso?: string, endIso?: string): string {
  if (!startIso || !endIso) return '--:-- - --:--';
  try {
    const dStart = new Date(startIso);
    const dEnd = new Date(endIso);
    const sh = String(dStart.getHours()).padStart(2, '0');
    const sm = String(dStart.getMinutes()).padStart(2, '0');
    const eh = String(dEnd.getHours()).padStart(2, '0');
    const em = String(dEnd.getMinutes()).padStart(2, '0');
    return `${sh}:${sm} - ${eh}:${em}`;
  } catch {
    return '--:-- - --:--';
  }
}

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '--:-- --/--/----';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:-- --/--/----';
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${time} ${day}/${month}/${year}`;
  } catch {
    return '--:-- --/--/----';
  }
}

function isTripOverdue(bookingEndTime?: string | null): boolean {
  if (!bookingEndTime) return false;
  try {
    const end = new Date(bookingEndTime).getTime();
    return !isNaN(end) && end < Date.now();
  } catch {
    return false;
  }
}

/**
 * Formats a duration in seconds into a human-readable string in Vietnamese.
 * Safely handles missing, negative, or invalid durations.
 */
function formatTripDuration(seconds?: number | null): string {
  if (seconds == null || isNaN(seconds) || seconds < 0) {
    return '0 phút';
  }
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
  }
  if (minutes > 0) {
    return `${minutes} phút`;
  }
  return 'Dưới 1 phút';
}

interface PendingApprovalMaintenanceNoticeProps {
  maintenance: MaintenanceResponse;
  onOpenMaintenance: () => void;
}

const PendingApprovalMaintenanceNotice: React.FC<PendingApprovalMaintenanceNoticeProps> = ({
  maintenance,
  onOpenMaintenance,
}) => {
  const { data: approvalData } = useQuery<MaintenanceApprovalResponse>({
    queryKey: ['maintenanceApproval', maintenance.id],
    queryFn: () => fetchMaintenanceApproval(maintenance.id),
    refetchInterval: 4000,
  });

  const typeCfg = MAINTENANCE_TYPE_CONFIG[maintenance.maintenanceType];
  const prioCfg = MAINTENANCE_PRIORITY_CONFIG[maintenance.priority];
  const approveWeight = approvalData?.approveWeight ?? 0;
  const threshold = approvalData?.requiredThreshold ?? 50.0;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(180, 83, 9, 0.15) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.55)',
        boxShadow: '0 0 16px rgba(245, 158, 11, 0.2)',
        borderRadius: '14px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#f59e0b',
              boxShadow: '0 0 10px #f59e0b',
            }}
          />
          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em' }}>
            YÊU CẦU BẢO DƯỠNG ĐANG CHỜ DUYỆT
          </span>
        </div>
      </div>

      <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
        {maintenance.title}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', fontSize: '9.5px' }}>
        <span
          style={{
            background: typeCfg?.bg || 'rgba(255, 255, 255, 0.1)',
            border: `1px solid ${typeCfg?.color || '#94a3b8'}`,
            color: typeCfg?.color || '#ffffff',
            padding: '1px 6px',
            borderRadius: '4px',
            fontWeight: 700,
          }}
        >
          {typeCfg?.labelVi || maintenance.maintenanceType}
        </span>
        <span
          style={{
            background: prioCfg?.bg || 'rgba(255, 255, 255, 0.1)',
            color: prioCfg?.color || '#ffffff',
            padding: '1px 6px',
            borderRadius: '4px',
            fontWeight: 700,
          }}
        >
          {prioCfg?.labelVi || maintenance.priority}
        </span>
      </div>

      {maintenance.description && (
        <div style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: '1.4' }}>
          <span style={{ color: '#94a3b8' }}>Lý do: </span>
          {maintenance.description}
        </div>
      )}

      {/* Approval progress */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: '8px',
          padding: '6px 8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>
            PHÊ DUYỆT: {approveWeight}%
          </span>
          <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>
            cần &gt; {threshold}%
          </span>
        </div>
        <div
          style={{
            height: '5px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, approveWeight)}%`,
              background: approveWeight > threshold ? '#10b981' : '#f59e0b',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenMaintenance}
        style={{
          width: '100%',
          marginTop: '2px',
          background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
          border: 'none',
          borderRadius: '8px',
          padding: '7px 10px',
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
        <Wrench size={13} />
        <span>XEM & BIỂU QUYẾT BẢO DƯỠNG</span>
      </button>
    </div>
  );
};

interface CoOwnerHandoverHistoryViewProps {
  vehicle: VehicleResponse;
  displayCode: string;
  handoverHistory: VehicleHandoverData[];
  vehicleTrips?: TripData[];
  isLoading: boolean;
  selectedHandover: VehicleHandoverData | null;
  onSelectHandover: (h: VehicleHandoverData | null) => void;
  onBack: () => void;
}

const CoOwnerHandoverHistoryView: React.FC<CoOwnerHandoverHistoryViewProps> = ({
  vehicle,
  displayCode,
  handoverHistory,
  vehicleTrips = [],
  isLoading,
  selectedHandover,
  onSelectHandover,
  onBack,
}) => {
  const selectedMatchedTrip = selectedHandover
    ? vehicleTrips.find(
      (t) => t.id === selectedHandover.tripId || (t.bookingId && t.bookingId === selectedHandover.bookingId)
    )
    : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Navigation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '32px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '5px 10px',
            color: '#38bdf8',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={13} />
          <span>QUAY LẠI</span>
        </button>

        <span
          style={{
            background: 'rgba(0, 242, 254, 0.15)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            borderRadius: '999px',
            padding: '2px 8px',
            fontSize: '9.5px',
            fontWeight: 800,
            color: '#00f2fe',
          }}
        >
          LỊCH SỬ BÀN GIAO & TRẢ XE
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
          LỊCH SỬ BÀN GIAO & TRẢ XE
        </h4>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          Phương tiện: <strong style={{ color: '#00f2fe' }}>{resolveVehicleDisplayName(vehicle, displayCode)}</strong> ({displayCode} • {vehicle.licensePlate || 'Chưa cập nhật'})
        </div>
      </div>

      {selectedHandover ? (
        /* DETAIL VIEW OF SINGLE HISTORICAL RECORD */
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1.5px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => onSelectHandover(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
                padding: '4px 8px',
                color: '#94a3b8',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowLeft size={11} />
              <span>DANH SÁCH LỊCH SỬ</span>
            </button>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '9.5px',
                fontWeight: 800,
              }}
            >
              {selectedHandover.status === 'HANDED_OVER'
                ? 'ĐÃ BÀN GIAO'
                : selectedHandover.status === 'COMPLETED'
                  ? 'HOÀN THÀNH'
                  : selectedHandover.status}
            </span>
          </div>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: '10px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Thời gian bàn giao:</span>
              <strong style={{ color: '#34d399' }}>
                {formatDateTime(selectedHandover.staffHandedOverAt || selectedHandover.createdAt)}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Nhân viên kỹ thuật:</span>
              <strong style={{ color: '#38bdf8' }}>
                {selectedHandover.staffName || 'EVShare Staff'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Người nhận xe:</span>
              <strong style={{ color: '#ffffff' }}>
                {selectedHandover.coOwnerName || 'Đồng sở hữu'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Mã lịch đặt:</span>
              <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>
                {selectedHandover.bookingId ? selectedHandover.bookingId.slice(0, 8) + '...' : '--'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Lịch đặt:</span>
              <span style={{ color: '#cbd5e1' }}>
                {formatDate(selectedHandover.bookingStartTime)} ({formatTimeRange(selectedHandover.bookingStartTime, selectedHandover.bookingEndTime)})
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Kiểm tra kỹ thuật:</span>
              <span style={{ color: selectedHandover.allCheckpointsInspected ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                {selectedHandover.allCheckpointsInspected
                  ? '8/8 ĐIỂM ĐẠT'
                  : `${selectedHandover.totalInspectedCount || 0}/8 điểm kiểm tra`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Trạng thái chuyến đi:</span>
              <span style={{ color: selectedHandover.tripStatus === 'COMPLETED' ? '#34d399' : '#38bdf8', fontWeight: 700 }}>
                {selectedHandover.tripStatus === 'COMPLETED'
                  ? 'ĐÃ HOÀN TẤT'
                  : (selectedHandover.tripStatus || 'CHƯA BẮT ĐẦU')}
              </span>
            </div>
            {selectedHandover.tripId && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Mã chuyến đi:</span>
                <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>
                  {selectedHandover.tripId.slice(0, 8)}...
                </span>
              </div>
            )}
            {selectedMatchedTrip && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Odometer bắt đầu:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                    {selectedMatchedTrip.startOdometer != null ? `${Number(selectedMatchedTrip.startOdometer).toLocaleString('vi-VN')} km` : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Odometer kết thúc:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                    {selectedMatchedTrip.endOdometer != null ? `${Number(selectedMatchedTrip.endOdometer).toLocaleString('vi-VN')} km` : '—'}
                  </span>
                </div>
                {selectedMatchedTrip.startOdometer != null && selectedMatchedTrip.endOdometer != null && Number(selectedMatchedTrip.endOdometer) >= Number(selectedMatchedTrip.startOdometer) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Quãng đường di chuyển:</span>
                    <strong style={{ color: '#00f2fe' }}>
                      {(Number(selectedMatchedTrip.endOdometer) - Number(selectedMatchedTrip.startOdometer)).toLocaleString('vi-VN')} km
                    </strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Mức pin (SOC):</span>
                  <strong style={{ color: '#34d399' }}>
                    {selectedMatchedTrip.startBatteryLevel != null ? `${selectedMatchedTrip.startBatteryLevel}%` : '—'} ➔ {selectedMatchedTrip.endBatteryLevel != null ? `${selectedMatchedTrip.endBatteryLevel}%` : '—'}
                  </strong>
                </div>
              </>
            )}
            {(selectedHandover.returnVerifiedAt || selectedHandover.tripEndedAt) && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Thời gian trả xe:</span>
                <strong style={{ color: '#34d399' }}>
                  {formatDateTime(selectedHandover.returnVerifiedAt || selectedHandover.tripEndedAt)}
                </strong>
              </div>
            )}
            {selectedHandover.returnVerifiedByStaffName && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Nhân viên tiếp nhận xe:</span>
                <strong style={{ color: '#38bdf8' }}>
                  {selectedHandover.returnVerifiedByStaffName}
                </strong>
              </div>
            )}
            {selectedHandover.returnInspectionResult && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Kiểm tra khi trả xe:</span>
                <span style={{ color: selectedHandover.returnInspectionResult === 'PASSED' || selectedHandover.returnInspectionResult === 'PASS' ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                  {selectedHandover.returnInspectionResult === 'PASSED' || selectedHandover.returnInspectionResult === 'PASS' ? 'ĐẠT TIÊU CHUẨN' : selectedHandover.returnInspectionResult}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Mã hồ sơ bàn giao:</span>
              <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '9.5px' }}>
                {selectedHandover.id ? selectedHandover.id.slice(0, 13) + '...' : '--'}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '8px 10px',
              background: 'rgba(2, 132, 199, 0.08)',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '10px',
              lineHeight: 1.4,
            }}
          >
            Hồ sơ bàn giao này là bản ghi lịch sử chỉ đọc (Read-only), gắn liền với lượt đặt xe trước đây và được lưu trữ cho mục đích kiểm toán.
          </div>
        </div>
      ) : (
        /* LIST VIEW OF ALL HISTORICAL RECORDS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '24px',
                color: '#38bdf8',
                fontSize: '11px',
              }}
            >
              <Loader2 size={16} className="animate-spin" />
              <span>Đang tải lịch sử bàn giao...</span>
            </div>
          ) : handoverHistory.length === 0 ? (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '11px',
              }}
            >
              Chưa có bản ghi bàn giao lịch sử nào cho xe này.
            </div>
          ) : (
            <>
              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                Tổng cộng <strong style={{ color: '#00f2fe' }}>{handoverHistory.length}</strong> bản ghi lịch sử bàn giao:
              </div>

              {handoverHistory.map((h) => {
                const handoverTimeStr = formatDateTime(h.staffHandedOverAt || h.createdAt);
                const isHandedOver = h.status === 'HANDED_OVER' || h.status === 'COMPLETED' || h.status === 'OWNER_CONFIRMED';
                return (
                  <div
                    key={h.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} color="#00f2fe" />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
                          {handoverTimeStr}
                        </span>
                      </div>
                      <span
                        style={{
                          background: isHandedOver ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: isHandedOver ? '#34d399' : '#fbbf24',
                          padding: '1px 6px',
                          borderRadius: '999px',
                          fontSize: '9.5px',
                          fontWeight: 800,
                        }}
                      >
                        {h.status === 'HANDED_OVER'
                          ? 'ĐÃ BÀN GIAO'
                          : h.status === 'COMPLETED'
                            ? 'HOÀN THÀNH'
                            : h.status === 'READY_FOR_HANDOVER'
                              ? 'SẴN SÀNG'
                              : h.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '10.5px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                        <strong style={{ color: '#00f2fe' }}>{displayCode} ({vehicle.licensePlate})</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Nhân viên:</span>
                        <strong style={{ color: '#ffffff' }}>{h.staffName || 'EVShare Staff'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Người nhận:</span>
                        <strong style={{ color: '#ffffff' }}>{h.coOwnerName || 'Đồng sở hữu'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Lịch đặt:</span>
                        <span style={{ color: '#94a3b8' }}>
                          {formatDate(h.bookingStartTime)} ({formatTimeRange(h.bookingStartTime, h.bookingEndTime)})
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Chuyến đi:</span>
                        <span style={{ color: h.tripStatus === 'COMPLETED' ? '#34d399' : '#38bdf8', fontWeight: 600 }}>
                          {h.tripStatus === 'COMPLETED' ? 'Đã hoàn tất' : (h.tripStatus || 'Chưa bắt đầu')}
                        </span>
                      </div>
                      {(() => {
                        const trip = vehicleTrips.find(
                          (t) => t.id === h.tripId || (t.bookingId && t.bookingId === h.bookingId)
                        );
                        if (!trip) return null;
                        const dist =
                          trip.startOdometer != null && trip.endOdometer != null && Number(trip.endOdometer) >= Number(trip.startOdometer)
                            ? Number(trip.endOdometer) - Number(trip.startOdometer)
                            : null;
                        return (
                          <>
                            {dist != null && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Quãng đường đã đi:</span>
                                <strong style={{ color: '#00f2fe' }}>{dist.toLocaleString('vi-VN')} km</strong>
                              </div>
                            )}
                            {trip.startOdometer != null && trip.endOdometer != null && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Số km (ODO):</span>
                                <span style={{ color: '#cbd5e1' }}>
                                  {Number(trip.startOdometer).toLocaleString('vi-VN')} ➔ {Number(trip.endOdometer).toLocaleString('vi-VN')} km
                                </span>
                              </div>
                            )}
                            {trip.startBatteryLevel != null && trip.endBatteryLevel != null && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Pin (SOC):</span>
                                <span style={{ color: '#34d399', fontWeight: 600 }}>
                                  {trip.startBatteryLevel}% ➔ {trip.endBatteryLevel}%
                                </span>
                              </div>
                            )}
                            {trip.energyConsumedKwh != null && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Điện tiêu thụ:</span>
                                <strong style={{ color: '#ffffff' }}>
                                  {Number(trip.energyConsumedKwh).toFixed(2)} kWh
                                </strong>
                              </div>
                            )}
                            {trip.appliedEnergyTariff != null && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Đơn giá điện áp dụng:</span>
                                <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                                  {Number(trip.appliedEnergyTariff).toLocaleString('vi-VN')} đ/kWh
                                </span>
                              </div>
                            )}
                            {(trip.verifiedExpenseAmount != null || (trip.energyConsumedKwh != null && trip.appliedEnergyTariff != null)) && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8' }}>Chi phí điện chuyến đi:</span>
                                <strong style={{ color: '#10b981' }}>
                                  {(trip.verifiedExpenseAmount != null
                                    ? Number(trip.verifiedExpenseAmount)
                                    : Math.round(Number(trip.energyConsumedKwh) * Number(trip.appliedEnergyTariff))
                                  ).toLocaleString('vi-VN')} đ
                                </strong>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      {(h.returnVerifiedAt || h.tripEndedAt) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Thời gian trả xe:</span>
                          <span style={{ color: '#34d399', fontWeight: 600 }}>
                            {formatDateTime(h.returnVerifiedAt || h.tripEndedAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectHandover(h)}
                      style={{
                        marginTop: '4px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: '#38bdf8',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                      }}
                    >
                      <FileText size={11} />
                      <span>XEM CHI TIẾT</span>
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

interface CoOwner3DExplorationViewProps {
  vehicle: VehicleResponse;
  displayCode: string;
  displayName: string;
  licensePlateLabel: string;
  unresolvedDamages: DamageRecordData[];
  unmappedDamages: DamageRecordData[];
  vehicleMaintenanceList: MaintenanceResponse[];
  latestCompletedInspection: VehicleInspectionResponse | null | undefined;
  activeInspection?: VehicleInspectionResponse | null;
  exploreHotspotsVisible: boolean;
  toggleExploreHotspotsVisible: () => void;
  onExitExploration: () => void;
  selectedVehiclePartId: string | null;
  onSelectPart: (partId: any) => void;
  onClearPartSelection: () => void;
}

const CoOwner3DExplorationView: React.FC<CoOwner3DExplorationViewProps> = ({
  vehicle,
  displayCode,
  displayName,
  licensePlateLabel,
  unresolvedDamages,
  unmappedDamages,
  vehicleMaintenanceList,
  latestCompletedInspection,
  activeInspection,
  exploreHotspotsVisible,
  toggleExploreHotspotsVisible,
  onExitExploration,
  selectedVehiclePartId,
  onSelectPart,
  onClearPartSelection,
}) => {
  const vehicleCode = (vehicle.vehicleCode || (vehicle.id?.toLowerCase().includes('ev02') ? 'EV02' : 'EV01')) as 'EV01' | 'EV02';

  const preliminaryFindings = useMemo(() => {
    if (!activeInspection?.items) return [];
    return activeInspection.items.filter(
      (item) => item.conditionStatus && item.conditionStatus !== 'GOOD'
    );
  }, [activeInspection?.items]);

  const affectedComponents = useMemo(() => {
    const map = new Map<string, { code: string; label: string; condition?: string; severity?: string; isPreliminary?: boolean }>();
    unresolvedDamages.forEach((d) => {
      const code = normalizeComponentId(d.vehiclePartCode || (d as any).partCode);
      if (code && !map.has(code)) {
        map.set(code, {
          code,
          label: SEMANTIC_PART_LABELS_VI[code as any] || code,
          severity: d.severity,
          isPreliminary: false,
        });
      }
    });
    preliminaryFindings.forEach((p) => {
      const code = normalizeComponentId(p.vehiclePartCode);
      if (code && !map.has(code)) {
        map.set(code, {
          code,
          label: SEMANTIC_PART_LABELS_VI[code as any] || code,
          condition: p.conditionStatus,
          isPreliminary: true,
        });
      }
    });
    return Array.from(map.values());
  }, [unresolvedDamages, preliminaryFindings]);

  const honestVehicleStatus = useMemo(() => {
    if (preliminaryFindings.length > 0) {
      return {
        label: 'CÓ KHIẾM KHUYẾT CHỜ XÁC NHẬN',
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.15)',
        border: 'rgba(251, 191, 36, 0.45)',
        desc: `${preliminaryFindings.length} khiếm khuyết được phát hiện trong phiên kiểm tra 3D đang hoạt động.`,
      };
    }
    if (unresolvedDamages.length > 0) {
      return {
        label: 'CÓ HƯ HỎNG CHƯA XỬ LÝ',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.45)',
        desc: `${unresolvedDamages.length} vết hư hại vật lý cần lập đề xuất bảo dưỡng / sửa chữa.`,
      };
    }
    if (latestCompletedInspection?.overallResult === 'PASS_WITH_NOTES') {
      return {
        label: 'ĐẠT (CÓ LƯU Ý)',
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.15)',
        border: 'rgba(251, 191, 36, 0.45)',
        desc: 'Phương tiện đạt chuẩn an toàn kèm một số lưu ý kỹ thuật từ nhân viên.',
      };
    }
    return {
      label: 'ĐẠT TIÊU CHUẨN KỸ THUẬT',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.45)',
      desc: 'Tất cả các bộ phận ngoại quan và kỹ thuật đạt trạng thái hoàn hảo.',
    };
  }, [preliminaryFindings, unresolvedDamages, latestCompletedInspection]);

  const activeVehicleHotspots = useMemo(() => {
    return resolveVehicleHotspots(vehicle, vehicleCode);
  }, [vehicle, vehicleCode]);

  // Find selected hotspot item
  const selectedHotspot = useMemo(() => {
    if (!selectedVehiclePartId) return null;
    const targetCode = normalizeHotspotPartCode(selectedVehiclePartId);
    return (
      activeVehicleHotspots.find(
        (h) => normalizeHotspotPartCode(h.id) === targetCode
      ) ||
      DEFAULT_EV_HOTSPOTS.find(
        (h) => normalizeHotspotPartCode(h.id) === targetCode
      ) ||
      null
    );
  }, [selectedVehiclePartId, activeVehicleHotspots]);

  const resolvedPartTitle = useMemo(() => {
    if (!selectedVehiclePartId) return '';
    return (
      selectedHotspot?.title ||
      SEMANTIC_PART_LABELS_VI[selectedVehiclePartId] ||
      (selectedVehiclePartId === 'DOOR_FR' ? 'Cửa trước bên phải' : selectedVehiclePartId)
    );
  }, [selectedVehiclePartId, selectedHotspot]);

  // Find all active damage records for selected part
  const selectedDamages = useMemo(() => {
    if (!selectedVehiclePartId) return [];
    const targetCode = normalizeComponentId(selectedVehiclePartId);
    return unresolvedDamages.filter(
      (d) => normalizeComponentId(d.vehiclePartCode) === targetCode
    );
  }, [selectedVehiclePartId, unresolvedDamages]);

  // Primary damage with highest severity rank
  const selectedDamage = useMemo(() => {
    if (selectedDamages.length === 0) return null;
    return [...selectedDamages].sort(
      (a, b) => getSeverityRank(b.severity) - getSeverityRank(a.severity)
    )[0];
  }, [selectedDamages]);

  // Find inspection item for selected part
  const selectedInspectionItem = useMemo(() => {
    if (!selectedVehiclePartId || !latestCompletedInspection?.items) return null;
    const targetCode = normalizeComponentId(selectedVehiclePartId);
    return (
      latestCompletedInspection.items.find(
        (i) => normalizeComponentId(i.vehiclePartCode) === targetCode
      ) || null
    );
  }, [selectedVehiclePartId, latestCompletedInspection]);

  // Find related maintenance request
  const relatedMaintenance = useMemo(() => {
    if (!selectedDamage && !selectedHotspot) return null;
    return (
      vehicleMaintenanceList.find((m) => {
        if (
          selectedDamage?.resolvedByMaintenanceRequestId &&
          m.id === selectedDamage.resolvedByMaintenanceRequestId
        ) {
          return true;
        }
        if (
          selectedHotspot?.title &&
          m.description &&
          m.description.toLowerCase().includes(selectedHotspot.title.toLowerCase())
        ) {
          return true;
        }
        return false;
      }) || null
    );
  }, [selectedDamage, selectedHotspot, vehicleMaintenanceList]);

  const severityCfg = selectedDamage?.severity
    ? DAMAGE_SEVERITY_CONFIG[selectedDamage.severity] ||
    (selectedDamage.severity as string === 'CRITICAL' ? DAMAGE_SEVERITY_CONFIG.CRITICAL : null)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 1. Header with Mode Title and Compact Hotspot / Exit Controls */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.16) 0%, rgba(8, 20, 36, 0.95) 100%)',
          border: '1.2px solid rgba(0, 242, 254, 0.45)',
          borderRadius: '16px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 0 20px rgba(0, 242, 254, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: 'rgba(0, 242, 254, 0.2)',
                border: '1px solid #00f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(0, 242, 254, 0.35)',
              }}
            >
              <Sparkles size={14} color="#00f2fe" />
            </div>
            <div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  lineHeight: 1.2,
                }}
              >
                KHÁM PHÁ XE 3D
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                {displayName} • {licensePlateLabel}
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0, 242, 254, 0.12)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              borderRadius: '6px',
              padding: '2px 7px',
              fontSize: '10px',
              fontWeight: 800,
              color: '#00f2fe',
            }}
          >
            {displayCode}
          </div>
        </div>

        {/* Compact Exploration Controls Relocated to Right-Side Panel */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
          <button
            type="button"
            onClick={toggleExploreHotspotsVisible}
            style={{
              flex: 1,
              background: exploreHotspotsVisible ? 'rgba(0, 242, 254, 0.16)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${exploreHotspotsVisible ? 'rgba(0, 242, 254, 0.5)' : 'rgba(255, 255, 255, 0.14)'}`,
              borderRadius: '8px',
              padding: '6px 10px',
              color: exploreHotspotsVisible ? '#00f2fe' : '#94a3b8',
              fontSize: '10.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            title={exploreHotspotsVisible ? 'Ẩn các điểm chạm 3D trên mô hình xe' : 'Hiện các điểm chạm 3D trên mô hình xe'}
          >
            {exploreHotspotsVisible ? <Eye size={12} color="#00f2fe" /> : <EyeOff size={12} color="#94a3b8" />}
            <span>{exploreHotspotsVisible ? 'ẨN ĐIỂM CHẠM' : 'HIỆN ĐIỂM CHẠM'}</span>
          </button>

          <button
            type="button"
            onClick={onExitExploration}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#f87171',
              fontSize: '10.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
            title="Thoát chế độ khám phá 3D và quay lại thông tin xe"
          >
            <RotateCcw size={11} color="#f87171" />
            <span>THOÁT</span>
          </button>
        </div>
      </div>

      {/* 2. Selected Component Detail Card OR Inspection Guidance Prompt */}
      {selectedVehiclePartId ? (
        selectedDamage ? (
          /* DAMAGED COMPONENT DETAIL (Section 5) */
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: `1.5px solid ${severityCfg?.color || '#ef4444'}`,
              borderRadius: '16px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: `0 0 20px ${(severityCfg?.color || '#ef4444')}33`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} color={severityCfg?.color || '#ef4444'} />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 900,
                    color: severityCfg?.color || '#ef4444',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  GHI NHẬN HƯ HỎNG / BẤT THƯỜNG
                </span>
              </div>
              <span
                style={{
                  background: severityCfg?.bg || 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${severityCfg?.borderColor || 'rgba(239, 68, 68, 0.6)'}`,
                  color: severityCfg?.color || '#f87171',
                  borderRadius: '999px',
                  padding: '2px 8px',
                  fontSize: '9.5px',
                  fontWeight: 800,
                }}
              >
                {severityCfg?.labelVi || selectedDamage.severity}
              </span>
            </div>

            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
                {resolvedPartTitle} ({selectedVehiclePartId})
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>
                Mã linh kiện: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{selectedVehiclePartId}</span>
              </div>
            </div>

            {/* Structured Damage Inspection Data */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Hiện trạng hư hỏng:</span>
                <strong style={{ color: '#fca5a5' }}>
                  {DAMAGE_TYPE_LABELS[selectedDamage.damageType] || selectedDamage.damageType}
                  {selectedInspectionItem?.conditionStatus ? ` (${selectedInspectionItem.conditionStatus})` : ''}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Mức độ rủi ro:</span>
                <span style={{ color: severityCfg?.color || '#fbbf24', fontWeight: 800 }}>
                  {severityCfg?.labelVi || selectedDamage.severity}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Ngày kiểm định:</span>
                <span style={{ color: '#ffffff' }}>
                  {formatDateTime(selectedDamage.createdAt || latestCompletedInspection?.completedAt)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Mã biên bản:</span>
                <span style={{ color: '#00f2fe', fontFamily: 'monospace' }}>
                  #{latestCompletedInspection?.id ? latestCompletedInspection.id.slice(0, 8) : selectedDamage.id.slice(0, 8)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Trạng thái xử lý:</span>
                <span
                  style={{
                    color: selectedDamage.status === 'UNDER_MAINTENANCE' ? '#fbbf24' : '#f87171',
                    fontWeight: 700,
                  }}
                >
                  {selectedDamage.status === 'UNDER_MAINTENANCE' ? 'ĐANG BẢO DƯỠNG' : 'CHƯA KHẮC PHỤC'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Đề xuất bảo dưỡng:</span>
                <span style={{ color: relatedMaintenance ? '#34d399' : '#cbd5e1', fontWeight: 600 }}>
                  {relatedMaintenance
                    ? `Đã lập yêu cầu #${relatedMaintenance.id.slice(0, 8)}`
                    : 'Chưa lập yêu cầu bảo dưỡng'}
                </span>
              </div>

              {(selectedDamage.note || selectedInspectionItem?.note) && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '5px', marginTop: '2px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '10px' }}>Ghi chú kỹ thuật: </span>
                  <span style={{ color: '#f1f5f9', fontSize: '10.5px' }}>
                    {selectedDamage.note || selectedInspectionItem?.note}
                  </span>
                </div>
              )}
            </div>

            {/* If multiple damage records exist for this component, list them all */}
            {selectedDamages.length > 1 && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#fca5a5' }}>
                  DANH SÁCH TẤT CẢ GHI NHẬN ({selectedDamages.length})
                </div>
                {selectedDamages.map((rec, rIdx) => (
                  <div
                    key={rec.id || rIdx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 6px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '6px',
                      fontSize: '10px',
                    }}
                  >
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                      #{rIdx + 1} {DAMAGE_TYPE_LABELS[rec.damageType] || rec.damageType}
                    </span>
                    <span
                      style={{
                        color: resolveSeverityColor(getSeverityRank(rec.severity)),
                        fontWeight: 800,
                      }}
                    >
                      {resolveSeverityLabelVi(rec.severity)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Read-Only Informational Notice */}
            <div
              style={{
                fontSize: '10px',
                color: '#94a3b8',
                lineHeight: 1.4,
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                padding: '6px 8px',
                borderLeft: '2px solid rgba(239, 68, 68, 0.6)',
              }}
            >
              Hồ sơ được trích xuất từ biên bản kiểm định kỹ thuật chính thức. Đồng sở hữu có thể theo dõi tiến độ sửa chữa tại mục Bảo dưỡng xe.
            </div>

            <button
              type="button"
              onClick={onClearPartSelection}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '7px 12px',
                color: '#cbd5e1',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              BỎ CHỌN BỘ PHẬN
            </button>
          </div>
        ) : (
          /* NORMAL COMPONENT DETAIL */
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.14) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1.2px solid rgba(0, 242, 254, 0.35)',
              borderRadius: '16px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} color="#10b981" />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#34d399',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  ĐẠT TIÊU CHUẨN KỸ THUẬT
                </span>
              </div>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  borderRadius: '999px',
                  padding: '2px 8px',
                  fontSize: '9.5px',
                  fontWeight: 800,
                }}
              >
                ỔN ĐỊNH
              </span>
            </div>

            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
                {selectedHotspot?.title || selectedVehiclePartId}
              </div>
              {selectedHotspot?.subtitle && (
                <div style={{ fontSize: '10.5px', color: '#38bdf8', marginTop: '1px' }}>
                  {selectedHotspot.subtitle}
                </div>
              )}
            </div>

            {selectedHotspot && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Chất liệu:</span>
                  <span style={{ color: '#ffffff', textAlign: 'right' }}>{selectedHotspot.material}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Chức năng:</span>
                  <span style={{ color: '#00f2fe', textAlign: 'right' }}>{selectedHotspot.function}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Đặc điểm:</span>
                  <span style={{ color: '#cbd5e1', textAlign: 'right' }}>{selectedHotspot.highlight}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClearPartSelection}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '7px 12px',
                color: '#cbd5e1',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              BỎ CHỌN BỘ PHẬN
            </button>
          </div>
        )
      ) : (
        /* NO PART SELECTED — COMPACT VEHICLE CONDITION SUMMARY (HONEST STATUS) */
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(8, 20, 36, 0.98) 100%)',
            border: `1.2px solid ${honestVehicleStatus.border}`,
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: `0 0 16px ${honestVehicleStatus.bg}`,
          }}
        >
          {/* Header & Dynamic Honest Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <ShieldCheck size={14} color={honestVehicleStatus.color} />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
                TỔNG QUAN TÌNH TRẠNG KỸ THUẬT
              </span>
            </div>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                color: honestVehicleStatus.color,
                background: honestVehicleStatus.bg,
                border: `1px solid ${honestVehicleStatus.border}`,
                padding: '2px 8px',
                borderRadius: '6px',
                letterSpacing: '0.02em',
              }}
            >
              {honestVehicleStatus.label}
            </span>
          </div>

          <div style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: 1.45 }}>
            {honestVehicleStatus.desc}
          </div>

          {/* Inspection Summary Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '6px',
            }}
          >
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '8px',
                padding: '7px 8px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>BIÊN BẢN CHÍNH THỨC</div>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color:
                    latestCompletedInspection?.overallResult === 'FAIL'
                      ? '#f87171'
                      : latestCompletedInspection?.overallResult === 'PASS_WITH_NOTES'
                        ? '#fbbf24'
                        : latestCompletedInspection?.overallResult === 'PASS'
                          ? '#34d399'
                          : '#94a3b8',
                }}
              >
                {latestCompletedInspection?.overallResult === 'FAIL'
                  ? 'KHÔNG ĐẠT'
                  : latestCompletedInspection?.overallResult === 'PASS_WITH_NOTES'
                    ? 'ĐẠT (LƯU Ý)'
                    : latestCompletedInspection?.overallResult === 'PASS'
                      ? 'ĐẠT CHUẨN'
                      : 'CHƯA CÓ'}
              </div>
              <div style={{ fontSize: '8.5px', color: '#64748b' }}>
                {latestCompletedInspection?.completedAt ? formatDate(latestCompletedInspection.completedAt) : '--/--/----'}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '8px',
                padding: '7px 8px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>KHIẾM KHUYẾT SƠ BỘ</div>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: preliminaryFindings.length > 0 ? '#fbbf24' : '#34d399',
                }}
              >
                {preliminaryFindings.length > 0 ? `${preliminaryFindings.length} vị trí` : '0 phát hiện'}
              </div>
              <div style={{ fontSize: '8.5px', color: '#64748b' }}>
                {preliminaryFindings.length > 0 ? 'Chờ xác nhận' : 'Đang kiểm tra'}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '8px',
                padding: '7px 8px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>HƯ HỎNG VẬT LÝ</div>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: unresolvedDamages.length > 0 ? '#f87171' : '#34d399',
                }}
              >
                {unresolvedDamages.length > 0 ? `${unresolvedDamages.length} vị trí` : '0 hư hỏng'}
              </div>
              <div style={{ fontSize: '8.5px', color: '#64748b' }}>
                {unresolvedDamages.length > 0 ? 'Cần bảo dưỡng' : 'Sạch hoàn toàn'}
              </div>
            </div>
          </div>

          {/* Compact Affected Components List */}
          {affectedComponents.length > 0 && (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>CÁC BỘ PHẬN CÓ GHI NHẬN ({affectedComponents.length}):</span>
                <span style={{ fontSize: '8.5px', color: '#94a3b8' }}>Chạm để định vị 3D</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {affectedComponents.map((comp) => {
                  const isPrem = comp.isPreliminary;
                  const chipColor = isPrem
                    ? comp.condition === 'CRACK' ? '#ef4444' : comp.condition === 'DENT' ? '#f97316' : '#facc15'
                    : comp.severity === 'SEVERE' || comp.severity === 'HIGH' ? '#ef4444' : '#f97316';
                  return (
                    <button
                      key={comp.code}
                      type="button"
                      onClick={() => onSelectPart(comp.code)}
                      style={{
                        background: `${chipColor}15`,
                        border: `1px solid ${chipColor}40`,
                        borderRadius: '6px',
                        padding: '3px 7px',
                        color: chipColor,
                        fontSize: '9.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${chipColor}30`;
                        e.currentTarget.style.borderColor = chipColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `${chipColor}15`;
                        e.currentTarget.style.borderColor = `${chipColor}40`;
                      }}
                    >
                      <span>{comp.label}</span>
                      <span style={{ fontSize: '8.5px', opacity: 0.8 }}>
                        ({isPrem ? (comp.condition || 'SƠ BỘ') : (comp.severity || 'HƯ HỎNG')})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Centralized Semantic Hotspot Color Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: '8px',
              fontSize: '9.5px',
              color: '#94a3b8',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00f2fe', boxShadow: '0 0 4px #00f2fe' }} />
              <span>Tốt</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#facc15', boxShadow: '0 0 4px #facc15' }} />
              <span>Trầy</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f97316', boxShadow: '0 0 4px #f97316' }} />
              <span>Móp</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 4px #ef4444' }} />
              <span>Nứt</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', border: '1.5px dashed #fbbf24' }} />
              <span>Chờ xác nhận</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Unmapped Damages Section (Section 6) */}
      {unmappedDamages.length > 0 && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '14px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={13} color="#fbbf24" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>
                HƯ HỎNG NGOÀI MÔ HÌNH 3D ({unmappedDamages.length})
              </span>
            </div>
            <span style={{ fontSize: '9.5px', color: '#fcd34d' }}>Chưa ánh xạ</span>
          </div>

          <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.35 }}>
            Các hư hỏng được ghi nhận trong biên bản kiểm tra nhưng nằm ngoài 10 điểm chạm ngoại quan mặc định:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {unmappedDamages.map((d) => {
              const sevCfg = DAMAGE_SEVERITY_CONFIG[d.severity];
              return (
                <div
                  key={d.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '10.5px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#ffffff' }}>{d.vehiclePartCode}</strong>
                    <span
                      style={{
                        background: sevCfg?.bg || 'rgba(239, 68, 68, 0.2)',
                        color: sevCfg?.color || '#f87171',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 800,
                      }}
                    >
                      {sevCfg?.labelVi || d.severity}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Hiện trạng: <strong style={{ color: '#fca5a5' }}>{DAMAGE_TYPE_LABELS[d.damageType] || d.damageType}</strong></span>
                    <span style={{ color: '#94a3b8' }}>{formatDateTime(d.createdAt)}</span>
                  </div>

                  {d.note && (
                    <div style={{ color: '#94a3b8', fontSize: '10px' }}>
                      Ghi chú: {d.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export interface CoOwnerVehiclePanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

export const CoOwnerVehiclePanel: React.FC<CoOwnerVehiclePanelProps> = ({
  vehicle,
  onClose,
}) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = isAuthenticated && !!accessToken;

  const setVehicleFeatureMode = useWorldStore((state) => state.setVehicleFeatureMode);
  const enterVehicleReceiptReviewMode = useWorldStore((state) => state.enterVehicleReceiptReviewMode);
  const enterVehicleTripVisualizationMode = useWorldStore((state) => state.enterVehicleTripVisualizationMode);
  const enterVehicleTripStartMode = useWorldStore((state) => state.enterVehicleTripStartMode);
  const enterVehicleDamageHistoryMode = useWorldStore((state) => state.enterVehicleDamageHistoryMode);
  const enterVehicleMaintenanceMode = useWorldStore((state) => state.enterVehicleMaintenanceMode);
  const enterBatteryXrayMode = useWorldStore((state) => state.enterBatteryXrayMode);
  const enterChargingMode = useWorldStore((state) => state.enterChargingMode);
  const openGaragePanel = useWorldStore((state) => state.openGaragePanel);
  const openDisputePanel = useWorldStore((state) => state.openDisputePanel);
  const openDisputePanelWithPrefill = useWorldStore((state) => state.openDisputePanelWithPrefill);
  const isExplorationMode = useWorldStore((state) => state.isExplorationMode);
  const exploreHotspotsVisible = useWorldStore((state) => state.exploreHotspotsVisible);
  const toggleExploreHotspotsVisible = useWorldStore((state) => state.toggleExploreHotspotsVisible);
  const exitCoOwnerExplorationMode = useWorldStore((state) => state.exitCoOwnerExplorationMode);
  const selectedVehiclePartId = useWorldStore((state) => state.selectedVehiclePartId);
  const selectVehiclePart = useWorldStore((state) => state.selectVehiclePart);
  const clearVehiclePartSelection = useWorldStore((state) => state.clearVehiclePartSelection);

  const queryClient = useQueryClient();
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [showHandoverHistory, setShowHandoverHistory] = useState(false);
  const [selectedHistoryHandover, setSelectedHistoryHandover] = useState<VehicleHandoverData | null>(null);

  const {
    data: handoverHistory = [],
    isLoading: isHistoryLoading,
  } = useQuery<VehicleHandoverData[]>({
    queryKey: ['vehicle-handover-history', vehicle.id],
    queryFn: () => fetchHandoverHistory(vehicle.id),
    enabled: authReady && !!vehicle.id,
    staleTime: 5000,
  });

  const { data: vehicleTrips = [] } = useQuery<TripData[]>({
    queryKey: ['vehicleTrips', vehicle.id],
    queryFn: () => fetchVehicleTrips(vehicle.id),
    enabled: authReady && !!vehicle.id,
    staleTime: 5000,
  });

  const handleRequestReturn = async () => {
    if (!activeTrip?.id || isSubmittingReturn) return;
    setIsSubmittingReturn(true);
    setReturnError(null);
    try {
      await requestTripReturnApi(activeTrip.id);
      setShowReturnConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['activeTrip', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicleBookings', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['activeVehicleHandovers', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['booking-handover'] });
      queryClient.invalidateQueries({ queryKey: ['booking-trip'] });
      queryClient.invalidateQueries({ queryKey: ['trip-start-eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-handover-history', vehicle.id] });
    } catch (err: any) {
      setReturnError(err.message || 'Không thể gửi yêu cầu trả xe. Vui lòng thử lại.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // TanStack Queries (authoritative server state)
  const { data: activeHandovers = [] } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeVehicleHandovers', vehicle.id, user?.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 4000,
  });

  const { data: allBookings = [] } = useQuery<Booking[]>({
    queryKey: ['vehicleBookings', vehicle.id, user?.id],
    queryFn: () => fetchVehicleBookings(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 8000,
  });

  const { data: activeTrip } = useQuery<TripData | null>({
    queryKey: ['activeTrip', vehicle.id],
    queryFn: () => fetchActiveTripForVehicle(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 3000,
  });

  // Local set of dismissed trip IDs for instant responsive UI and persistent per-user storage
  const [dismissedTripIds, setDismissedTripIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`evshare_dismissed_trips_${user?.id || 'guest'}`);
      if (stored) {
        return new Set<string>(JSON.parse(stored));
      }
    } catch {
      // Ignore storage read error
    }
    return new Set<string>();
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`evshare_dismissed_trips_${user?.id || 'guest'}`);
      if (stored) {
        setDismissedTripIds(new Set<string>(JSON.parse(stored)));
      } else {
        setDismissedTripIds(new Set<string>());
      }
    } catch {
      // Ignore
    }
  }, [user?.id]);

  const markTripDismissedLocally = useCallback((tripId: string) => {
    setDismissedTripIds((prev) => {
      const next = new Set(prev);
      next.add(tripId);
      try {
        localStorage.setItem(
          `evshare_dismissed_trips_${user?.id || 'guest'}`,
          JSON.stringify(Array.from(next))
        );
      } catch {
        // LocalStorage fallback
      }
      return next;
    });
  }, [user?.id]);

  const { data: latestCompletedTrip } = useQuery<TripData | null>({
    queryKey: ['latestCompletedTrip', vehicle.id, user?.id],
    queryFn: () => fetchLatestCompletedTripForVehicle(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 5000,
  });

  const dismissTripMutation = useMutation({
    mutationFn: (tripId: string) => acknowledgeTripViewedApi(tripId),
    onMutate: async (tripId: string) => {
      markTripDismissedLocally(tripId);
      await queryClient.cancelQueries({ queryKey: ['latestCompletedTrip', vehicle.id, user?.id] });
      const previousTrip = queryClient.getQueryData<TripData | null>(['latestCompletedTrip', vehicle.id, user?.id]);
      if (previousTrip) {
        queryClient.setQueryData(['latestCompletedTrip', vehicle.id, user?.id], {
          ...previousTrip,
          isAcknowledged: true,
          acknowledged: true,
        });
      }
      return { previousTrip };
    },
    onSuccess: (updatedTrip) => {
      if (updatedTrip?.id) {
        markTripDismissedLocally(updatedTrip.id);
        queryClient.setQueryData(['latestCompletedTrip', vehicle.id, user?.id], {
          ...updatedTrip,
          isAcknowledged: true,
          acknowledged: true,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onError: (err, tripId) => {
      console.warn('Trip acknowledgement API encountered an issue, preserving local user dismissal:', err);
    },
  });

  const { data: vehicleMaintenanceList = [] } = useQuery<MaintenanceResponse[]>({
    queryKey: ['vehicleMaintenance', vehicle.id],
    queryFn: () => fetchVehicleMaintenance(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 5000,
  });

  const { data: damages = [] } = useQuery<DamageRecordData[]>({
    queryKey: ['vehicleDamages', vehicle.id],
    queryFn: () => (vehicle?.id ? fetchVehicleDamages(vehicle.id) : Promise.resolve([])),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 6000,
  });

  const { data: latestCompletedInspection } = useQuery<VehicleInspectionResponse | null>({
    queryKey: ['latestCompletedInspection', vehicle.id],
    queryFn: () => (vehicle?.id ? fetchLatestCompletedInspection(vehicle.id) : Promise.resolve(null)),
    enabled: authReady && !!vehicle.id,
    staleTime: 5000,
  });

  const { data: activeInspection } = useQuery<VehicleInspectionResponse | null>({
    queryKey: ['activeInspection', vehicle.id],
    queryFn: () => (vehicle?.id ? fetchActiveInspection(vehicle.id) : Promise.resolve(null)),
    enabled: authReady && !!vehicle.id,
    staleTime: 5000,
  });

  const unresolvedDamages = useMemo(() => {
    return damages.filter((d) => d.status !== 'RESOLVED' && (d.status as string) !== 'REPAIRED');
  }, [damages]);

  const panelVehicleCode = (vehicle.vehicleCode || (vehicle.id?.toLowerCase().includes('ev02') ? 'EV02' : 'EV01')) as 'EV01' | 'EV02';

  const activeVehicleHotspots = useMemo(() => {
    return resolveVehicleHotspots(vehicle, panelVehicleCode);
  }, [vehicle, panelVehicleCode]);

  const unmappedDamages = useMemo(() => {
    return resolveUnmappedDamages(vehicle, unresolvedDamages);
  }, [vehicle, unresolvedDamages]);

  const resolvedDamages = useMemo(() => {
    return damages.filter((d) => d.status === 'RESOLVED' || (d.status as string) === 'REPAIRED');
  }, [damages]);

  const pendingApprovalMaintenance = useMemo(() => {
    return vehicleMaintenanceList.find((m) => m.status === 'PENDING_APPROVAL') || null;
  }, [vehicleMaintenanceList]);

  const isVehicleInUse = vehicle.status === 'IN_USE';
  const isTripActive = !!activeTrip && activeTrip.status === 'ACTIVE';
  const isInconsistentInUseState = isVehicleInUse && !isTripActive;
  const isMyActiveTrip = isTripActive && !!activeTrip && (
    (!!user?.id && activeTrip.userId === user.id) ||
    (!!user?.email && activeTrip.userEmail === user.email)
  );
  const isOtherUserActiveTrip = isTripActive && !isMyActiveTrip;
  const isOverdue = isTripActive && isTripOverdue(activeTrip.bookingEndTime);

  // Resolve upcoming booking (strictly future/current, never historical fallback)
  const upcomingBooking = useMemo(() => {
    const list = Array.isArray(allBookings) ? allBookings : [];
    if (list.length === 0) return null;
    const now = new Date();
    const myBookings = list.filter(
      (b) => b && b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && b.status !== 'EXPIRED' && (!user?.id || b.userId === user?.id)
    );
    if (myBookings.length > 0) {
      return myBookings.find((b) => b.endTime && new Date(b.endTime) >= now) || null;
    }
    return null;
  }, [allBookings, user?.id]);

  const {
    candidateBooking,
    bookingHandover,
    completedHandover,
    bookingTrip,
    tripEligibility,
    isEligibleToStart,
    isInspectionOnlyCompleted,
    isWaitingForStaff,
    isFutureBookingBeforeWindow,
    isLoading: isPrereqLoading,
    isEligibilityError,
    eligibilityErrorMessage,
    refetchEligibility,
  } = useCoOwnerTripPrerequisites(vehicle.id, isTripActive);

  const isAnotherUserInCustody = useMemo(() => {
    if (isMyActiveTrip) return false;
    if (completedHandover) return false;
    return Boolean(
      isOtherUserActiveTrip ||
      (isVehicleInUse && !isMyActiveTrip) ||
      (tripEligibility && !tripEligibility.eligible && (tripEligibility.reason === 'VEHICLE_IN_USE' || tripEligibility.message?.includes('thành viên khác')))
    );
  }, [isMyActiveTrip, completedHandover, isOtherUserActiveTrip, isVehicleInUse, tripEligibility]);

  // Handover check-in eligibility strictly bound to candidate booking & authoritative staff confirmation
  const isEligibleForCheckIn = useMemo(() => {
    if (isTripActive || isVehicleInUse || !candidateBooking || isFutureBookingBeforeWindow) return false;
    if (!bookingHandover) return false;
    return (
      bookingHandover.bookingId === candidateBooking.id &&
      bookingHandover.status === 'HANDED_OVER' &&
      !bookingHandover.ownerReceivedAt &&
      bookingHandover.status !== 'OWNER_CONFIRMED' &&
      bookingHandover.status !== 'COMPLETED' &&
      Boolean(bookingHandover.staffHandedOverAt) &&
      (!user?.id || bookingHandover.coOwnerId === user.id || bookingHandover.coOwnerEmail === user.email)
    );
  }, [bookingHandover, candidateBooking, user, isTripActive, isVehicleInUse, isFutureBookingBeforeWindow]);

  const isWaitingForStaffHandover = useMemo(() => {
    if (isTripActive || isVehicleInUse || !candidateBooking || isFutureBookingBeforeWindow) return false;
    if (!bookingHandover) return false;
    return (
      bookingHandover.bookingId === candidateBooking.id &&
      bookingHandover.status === 'READY_FOR_HANDOVER' &&
      !bookingHandover.staffHandedOverAt &&
      (!user?.id || bookingHandover.coOwnerId === user.id || bookingHandover.coOwnerEmail === user.email)
    );
  }, [bookingHandover, candidateBooking, user, isTripActive, isVehicleInUse, isFutureBookingBeforeWindow]);

  const displayCode = resolveVehicleCode(vehicle);
  const displayName = resolveVehicleDisplayName(vehicle, displayCode);
  const modelSubtitle = resolveVehicleSubtitle(vehicle, displayName);
  const licensePlateLabel = vehicle.licensePlate || 'Chưa cập nhật biển số';
  const statusConfig = isTripActive
    ? { label: 'Đang sử dụng', color: '#00f2fe' }
    : VEHICLE_STATUS_LABELS[vehicle.status] || {
      label: 'Sẵn sàng',
      color: '#10b981',
    };
  const hasBattery = vehicle.currentBatteryLevel != null;
  const estimatedRangeKm = hasBattery ? Math.round((vehicle.currentBatteryLevel! / 100) * 450) : null;

  // Derived active trip duration values preserving distinction: elapsed, remaining authorized, and total scheduled
  // 1. Elapsed trip duration (actual active trip duration since backend startedAt timestamp)
  const activeTripFormattedDuration = useMemo(() => {
    if (!activeTrip?.startedAt) return 'Đang cập nhật';
    try {
      const startMs = new Date(activeTrip.startedAt).getTime();
      if (isNaN(startMs)) return 'Đang cập nhật';
      if (activeTrip.durationSeconds != null && activeTrip.durationSeconds > 0) {
        return formatTripDuration(activeTrip.durationSeconds);
      }
      const endMs = activeTrip.endedAt ? new Date(activeTrip.endedAt).getTime() : Date.now();
      const elapsedSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
      return formatTripDuration(elapsedSec);
    } catch {
      return 'Đang cập nhật';
    }
  }, [activeTrip?.startedAt, activeTrip?.endedAt, activeTrip?.durationSeconds]);

  // 2. Remaining authorized trip duration (time left until authorized bookingEndTime)
  const remainingAuthorizedTripDuration = useMemo(() => {
    if (!activeTrip?.bookingEndTime) return null;
    try {
      const endLimitMs = new Date(activeTrip.bookingEndTime).getTime();
      if (isNaN(endLimitMs)) return null;
      const diffSec = Math.floor((endLimitMs - Date.now()) / 1000);
      if (diffSec <= 0) {
        const overdueSec = Math.abs(diffSec);
        return `Quá hạn ${formatTripDuration(overdueSec)}`;
      }
      return `Còn ${formatTripDuration(diffSec)}`;
    } catch {
      return null;
    }
  }, [activeTrip?.bookingEndTime]);

  // 3. Total scheduled trip duration (from bookingStartTime/startedAt to bookingEndTime)
  const totalScheduledTripDuration = useMemo(() => {
    const startIso = activeTrip?.bookingStartTime || activeTrip?.startedAt;
    const endIso = activeTrip?.bookingEndTime;
    if (!startIso || !endIso) return null;
    try {
      const startMs = new Date(startIso).getTime();
      const endMs = new Date(endIso).getTime();
      if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return null;
      const totalSec = Math.floor((endMs - startMs) / 1000);
      return formatTripDuration(totalSec);
    } catch {
      return null;
    }
  }, [activeTrip?.bookingStartTime, activeTrip?.startedAt, activeTrip?.bookingEndTime]);

  // 4. Overdue status without return request
  const isOverdueWithoutReturn = useMemo(() => {
    if (isMyActiveTrip && isOverdue && !activeTrip?.returnRequestedAt) return true;
    if (!isTripActive && candidateBooking?.endTime) {
      const end = new Date(candidateBooking.endTime).getTime();
      return !isNaN(end) && end < Date.now();
    }
    return false;
  }, [isMyActiveTrip, isOverdue, activeTrip?.returnRequestedAt, isTripActive, candidateBooking?.endTime]);

  // Phase 5.6: Dispute & Incident status integration
  const { data: vehicleDisputes = [] } = useQuery<DisputeResponse[]>({
    queryKey: ['vehicleDisputes', vehicle.id],
    queryFn: () => fetchDisputesForVehicle(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 6000,
  });

  const { data: bookingIncident } = useQuery<BookingConflictIncident | null>({
    queryKey: ['bookingIncident', candidateBooking?.id],
    queryFn: () => (candidateBooking?.id ? fetchIncidentForBooking(candidateBooking.id) : Promise.resolve(null)),
    enabled: authReady && !!candidateBooking?.id,
    refetchInterval: 5000,
  });

  const { data: bookingViolation } = useQuery<BookingViolationResponse | null>({
    queryKey: ['bookingViolation', candidateBooking?.id],
    queryFn: () => (candidateBooking?.id ? fetchBookingViolation(candidateBooking.id) : Promise.resolve(null)),
    enabled: authReady && !!candidateBooking?.id,
    refetchInterval: 5000,
  });

  const isPastGracePeriod = useMemo(() => {
    if (!candidateBooking?.startTime) return false;
    const startMs = new Date(candidateBooking.startTime).getTime();
    if (isNaN(startMs)) return false;
    return Date.now() > startMs + 15 * 60 * 1000;
  }, [candidateBooking?.startTime]);

  const isWithinGracePeriod = useMemo(() => {
    if (!candidateBooking?.startTime) return false;
    const startMs = new Date(candidateBooking.startTime).getTime();
    if (isNaN(startMs)) return false;
    const now = Date.now();
    return now >= startMs && now <= startMs + 15 * 60 * 1000;
  }, [candidateBooking?.startTime]);

  const graceMinutesRemaining = useMemo(() => {
    if (!candidateBooking?.startTime) return 0;
    const startMs = new Date(candidateBooking.startTime).getTime();
    if (isNaN(startMs)) return 0;
    const expiryMs = startMs + 15 * 60 * 1000;
    return Math.max(0, Math.ceil((expiryMs - Date.now()) / 60000));
  }, [candidateBooking?.startTime]);

  const existingDisputeForBooking = useMemo(() => {
    if (!candidateBooking?.id) return null;
    return vehicleDisputes.find((d) => d.bookingId === candidateBooking.id) || null;
  }, [vehicleDisputes, candidateBooking?.id]);

  const hasSubmittedDispute = Boolean(bookingIncident?.hasFormalDispute || existingDisputeForBooking);
  const formalDisputeId = existingDisputeForBooking?.id || bookingIncident?.formalDisputeId;

  const handleOpenDisputeForIncident = async () => {
    if (!candidateBooking) return;
    let prefill: PrefilledDisputeData | null = bookingIncident?.prefilledDispute || null;

    if (!prefill) {
      try {
        prefill = await fetchPrefilledDispute(candidateBooking.id);
      } catch {
        // Fallback: build authoritative prefill using current authoritative states
      }
    }

    if (!prefill) {
      const startStr = formatDateTime(candidateBooking.startTime);
      const endStr = formatDateTime(candidateBooking.endTime);
      const prevEndStr = activeTrip?.bookingEndTime ? formatDateTime(activeTrip.bookingEndTime) : 'Chưa xác định';
      const nowStr = formatDateTime(new Date().toISOString());

      const timelineText =
        `--- DỮ LIỆU ĐỐI CHIẾU HỆ THỐNG (TỰ ĐỘNG GHI NHẬN) ---\n` +
        `- [${prevEndStr}] Lịch trước kết thúc theo kế hoạch (BOOKING)\n` +
        `- [${startStr}] Lịch của bạn bắt đầu (BOOKING)\n` +
        `- [${nowStr}] Trạng thái tài xế trước: ${activeTrip?.returnRequestedAt ? `Đã yêu cầu trả lúc ${formatDateTime(activeTrip.returnRequestedAt)}` : 'Đang sử dụng (chưa gửi yêu cầu trả xe)'} (TRIP)\n` +
        `- [${nowStr}] Trạng thái nhân viên: Chưa tiếp nhận xe vào garage (STAFF)\n` +
        `- [${nowStr}] Thời điểm phát hiện sự cố: ${nowStr} (SYSTEM_POLICY)`;

      prefill = {
        vehicleId: vehicle.id,
        vehicleName: displayName,
        vehiclePlate: licensePlateLabel,
        category: 'BOOKING',
        priority: 'HIGH',
        suggestedTitle: 'Lượt đặt xe bị ảnh hưởng do chuyến đi trước chưa hoàn tất',
        suggestedDescription:
          `${timelineText}\n\n--- Ý KIẾN & MÔ TẢ CỦA THÀNH VIÊN BỊ ẢNH HƯỞNG ---\n` +
          `Tôi có lịch đặt xe ${displayName} từ ${startStr} đến ${endStr}, tuy nhiên đến giờ nhận xe phương tiện vẫn đang được thành viên trước sử dụng và chưa được bàn giao. Kính đề nghị Ban Quản trị và Nhân viên điều phối hỗ trợ giải quyết để đảm bảo quyền lợi sử dụng.`,
        systemEvidenceSummary: `Hệ thống phát hiện chậm trễ bàn giao phương tiện ${displayName} (${licensePlateLabel}). Lịch trước kết thúc lúc ${prevEndStr}, ảnh hưởng trực tiếp đến lịch đặt #${candidateBooking.id.substring(0, 8)} bắt đầu lúc ${startStr}.`,
        bookingId: candidateBooking.id,
        tripId: activeTrip?.id || null,
        handoverId: bookingHandover?.id || null,
        respondentUserIds: activeTrip?.userId ? [activeTrip.userId] : [],
        incidentReference: `INC-BKG-${candidateBooking.id.substring(0, 8).toUpperCase()}`,
        detectedAt: new Date().toISOString(),
        objectiveTimelineText: timelineText,
      };
    }

    openDisputePanelWithPrefill(vehicle.id, prefill);
  };

  return (
    <div
      data-ui-interactive="true"
      className="evshare-standard-panel compact-overview"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '76px',
        right: '20px',
        width: 'clamp(390px, 25vw, 445px)',
        maxWidth: 'min(445px, calc(100vw - 32px))',
        height: 'auto',
        maxHeight: 'min(78vh, calc(100vh - 128px))',
        overflow: 'hidden',
        background: 'rgba(7, 20, 38, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 242, 254, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(0, 242, 254, 0.16)',
        borderRadius: '18px',
        padding: 0,
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        zIndex: 40,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header Bar: TỔNG QUAN (Fixed, never scrolls) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
          flexShrink: 0,
          background: 'rgba(7, 20, 38, 0.98)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            <Car size={13} color="#00f2fe" />
          </div>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            TỔNG QUAN
          </span>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => {
            if (isExplorationMode) {
              exitCoOwnerExplorationMode();
            } else {
              onClose();
            }
          }}
          title={isExplorationMode ? "Thoát chế độ khám phá 3D" : "Quay lại toàn cảnh garage"}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Scrollable Content Body with Thin Dark-Themed Scrollbar */}
      <div
        className="co-owner-overview-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 217, 255, 0.35) rgba(7, 20, 38, 0.4)',
        }}
      >
        <style>{`
          .co-owner-overview-scroll::-webkit-scrollbar {
            width: 5px;
          }
          .co-owner-overview-scroll::-webkit-scrollbar-track {
            background: rgba(7, 20, 38, 0.4);
            border-radius: 9999px;
            margin: 4px 0;
          }
          .co-owner-overview-scroll::-webkit-scrollbar-thumb {
            background: rgba(0, 217, 255, 0.35);
            border-radius: 9999px;
          }
          .co-owner-overview-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 217, 255, 0.65);
          }
        `}</style>
        {isExplorationMode ? (
          <CoOwner3DExplorationView
            vehicle={vehicle}
            displayCode={displayCode}
            displayName={displayName}
            licensePlateLabel={licensePlateLabel}
            unresolvedDamages={unresolvedDamages}
            unmappedDamages={unmappedDamages}
            vehicleMaintenanceList={vehicleMaintenanceList}
            latestCompletedInspection={latestCompletedInspection}
            activeInspection={activeInspection}
            exploreHotspotsVisible={exploreHotspotsVisible}
            toggleExploreHotspotsVisible={toggleExploreHotspotsVisible}
            onExitExploration={exitCoOwnerExplorationMode}
            selectedVehiclePartId={selectedVehiclePartId}
            onSelectPart={selectVehiclePart}
            onClearPartSelection={clearVehiclePartSelection}
          />
        ) : showHandoverHistory ? (
          <CoOwnerHandoverHistoryView
            vehicle={vehicle}
            displayCode={displayCode}
            handoverHistory={handoverHistory}
            vehicleTrips={vehicleTrips}
            isLoading={isHistoryLoading}
            selectedHandover={selectedHistoryHandover}
            onSelectHandover={setSelectedHistoryHandover}
            onBack={() => {
              setShowHandoverHistory(false);
              setSelectedHistoryHandover(null);
            }}
          />
        ) : (
          <>
            {/* =================================================== */}
            {/* SECTION 1: PIN & TẦM HOẠT ĐỘNG                     */}
            {/* =================================================== */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(0, 242, 254, 0.22)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
                  <Zap size={13} color="#00f2fe" />
                  <span>PIN & TẦM HOẠT ĐỘNG</span>
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {vehicle.batteryCapacity || 87.7} kWh
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    {hasBattery ? `${vehicle.currentBatteryLevel}%` : 'Chưa ghi nhận'}
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Dung lượng</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#00f2fe' }}>
                  {estimatedRangeKm != null ? `~${estimatedRangeKm} km` : '—'}
                </div>
              </div>

              {/* Gradient Progress Bar */}
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
                    width: `${hasBattery ? Math.min(100, Math.max(0, vehicle.currentBatteryLevel!)) : 0}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #06b6d4 0%, #00f2fe 100%)',
                    borderRadius: '9999px',
                    boxShadow: '0 0 8px rgba(0, 242, 254, 0.6)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* DAMAGE WARNING: ONLY DISPLAYED WHEN UNRESOLVED DAMAGE EXISTS */}
            {unresolvedDamages.length > 0 && (
              <div
                onClick={() => {
                  enterVehicleDamageHistoryMode(vehicle.id);
                  openGaragePanel('DAMAGE', { vehicleId: vehicle.id });
                }}
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(180, 83, 9, 0.12) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  borderRadius: '12px',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Xem danh sách và chi tiết các hư hỏng chưa khắc phục"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <AlertTriangle size={14} color="#fbbf24" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>
                    {unresolvedDamages.length} hư hỏng chưa xử lý
                  </span>
                </div>
                <span style={{ fontSize: '10.5px', color: '#fcd34d', fontWeight: 700 }}>
                  Chi tiết →
                </span>
              </div>
            )}

            {/* =================================================== */}
            {/* SECTION 4: THÔNG TIN VẬN HÀNH / CHUYẾN ĐI / LỊCH ĐẶT */}
            {/* =================================================== */}
            {!isTripActive &&
              latestCompletedTrip &&
              !latestCompletedTrip.isAcknowledged &&
              !latestCompletedTrip.acknowledged &&
              !dismissedTripIds.has(latestCompletedTrip.id) && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(5, 150, 105, 0.22) 100%)',
                    border: '1.2px solid rgba(16, 185, 129, 0.45)',
                    boxShadow: '0 0 16px rgba(16, 185, 129, 0.15)',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="#34d399" />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>
                        CHUYẾN ĐI VỪA HOÀN TẤT
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: '#a7f3d0',
                          background: 'rgba(16, 185, 129, 0.25)',
                          padding: '1px 6px',
                          borderRadius: '6px',
                        }}
                      >
                        ĐÃ ĐỐI SOÁT
                      </span>
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (latestCompletedTrip?.id) {
                            dismissTripMutation.mutate(latestCompletedTrip.id);
                          }
                        }}
                        disabled={dismissTripMutation.isPending}
                        title="Đóng thông báo chuyến đi này"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#94a3b8';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#cbd5e1' }}>
                    <span>Quãng đường: <strong style={{ color: '#00f2fe' }}>{latestCompletedTrip.distanceTraveled != null ? `${latestCompletedTrip.distanceTraveled.toFixed(1)} km` : (latestCompletedTrip.endOdometer != null && latestCompletedTrip.startOdometer != null ? `${(Number(latestCompletedTrip.endOdometer) - Number(latestCompletedTrip.startOdometer)).toFixed(1)} km` : '-- km')}</strong></span>
                    <span>Thời điểm: <strong style={{ color: '#ffffff' }}>{formatDateTime(latestCompletedTrip.endedAt || latestCompletedTrip.returnVerifiedAt)}</strong></span>
                  </div>

                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (latestCompletedTrip?.id) {
                        dismissTripMutation.mutate(latestCompletedTrip.id);
                      }
                      enterVehicleTripVisualizationMode();
                    }}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      color: '#041325',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Compass size={13} color="#041325" />
                    <span>CHI TIẾT CHUYẾN ĐI</span>
                  </button>
                </div>
              )}
            {isMyActiveTrip && activeTrip ? (
              /* CASE A: CO_OWNER ACTIVE TRIP CARD (Section 4 & 5) */
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.22) 0%, rgba(8, 20, 36, 0.95) 100%)',
                  border: `1.5px solid ${activeTrip.returnRequestedAt ? '#f59e0b' : '#00f2fe'}`,
                  boxShadow: `0 0 20px ${activeTrip.returnRequestedAt ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 242, 254, 0.25)'}`,
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
                      {activeTrip.returnRequestedAt ? 'ĐANG CHỜ NHÂN VIÊN TIẾP NHẬN XE' : 'CHUYẾN ĐI ĐANG DIỄN RA'}
                    </span>
                    <span
                      style={{
                        background: activeTrip.returnRequestedAt ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 242, 254, 0.2)',
                        border: `1px solid ${activeTrip.returnRequestedAt ? '#f59e0b' : '#00f2fe'}`,
                        borderRadius: '9999px',
                        padding: '2px 8px',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        color: activeTrip.returnRequestedAt ? '#fbbf24' : '#00f2fe',
                      }}
                    >
                      {activeTrip.returnRequestedAt ? 'CHỜ TIẾP NHẬN' : 'ĐANG SỬ DỤNG'}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {activeTrip.vehicleCode || displayCode}
                  </span>
                </div>

                {showReturnConfirm ? (
                  /* SUBVIEW: RETURN REQUEST CONFIRMATION (Section 7) */
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '11px', fontWeight: 800 }}>
                      <AlertTriangle size={14} color="#fbbf24" />
                      <span>XÁC NHẬN YÊU CẦU TRẢ XE</span>
                    </div>

                    <div style={{ fontSize: '10.5px', display: 'flex', flexDirection: 'column', gap: '4px', color: '#cbd5e1' }}>
                      <div>Phương tiện: <strong style={{ color: '#ffffff' }}>{displayCode} ({vehicle.licensePlate || '51K-888.88'})</strong></div>
                      <div>Bắt đầu lúc: <strong style={{ color: '#ffffff' }}>{formatDateTime(activeTrip.startedAt)}</strong></div>
                      <div>Thời gian gửi yêu cầu: <strong style={{ color: '#00f2fe' }}>{formatDateTime(new Date().toISOString())}</strong></div>
                      <div>Trạng thái hiện tại: <strong style={{ color: '#34d399' }}>ĐANG SỬ DỤNG</strong></div>
                    </div>

                    {returnError && (
                      <div style={{ color: '#f87171', fontSize: '10px', fontWeight: 600 }}>
                        {returnError}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        disabled={isSubmittingReturn}
                        onClick={handleRequestReturn}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: isSubmittingReturn ? 'not-allowed' : 'pointer',
                          opacity: isSubmittingReturn ? 0.6 : 1,
                        }}
                      >
                        {isSubmittingReturn ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU TRẢ XE'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReturnConfirm(false)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          color: '#cbd5e1',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        HỦY
                      </button>
                    </div>
                  </div>
                ) : (
                  /* SUBVIEW: NORMAL ACTIVE TRIP MONITOR (Section 4 & 5) */
                  <>
                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: '#94a3b8' }}>Thời gian sử dụng:</span>
                        <strong style={{ color: '#ffffff' }}>{activeTripFormattedDuration}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: '#94a3b8' }}>Bắt đầu:</span>
                        <strong style={{ color: '#ffffff' }}>{formatDateTime(activeTrip.startedAt)}</strong>
                      </div>
                      {totalScheduledTripDuration && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: '#94a3b8' }}>Thời lượng đặt xe:</span>
                          <strong style={{ color: '#cbd5e1' }}>{totalScheduledTripDuration}</strong>
                        </div>
                      )}
                      {activeTrip.bookingEndTime && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: '#94a3b8' }}>Dự kiến kết thúc:</span>
                          <strong style={{ color: isOverdue ? '#f87171' : '#38bdf8' }}>
                            {formatDateTime(activeTrip.bookingEndTime)}
                            {remainingAuthorizedTripDuration && ` (${remainingAuthorizedTripDuration})`}
                          </strong>
                        </div>
                      )}
                      {activeTrip.startOdometer != null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: '#94a3b8' }}>Số km ban đầu:</span>
                          <strong style={{ color: '#ffffff' }}>{Number(activeTrip.startOdometer).toLocaleString('vi-VN')} km</strong>
                        </div>
                      )}
                    </div>

                    {/* Section 6: In-Trip Action Strip */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                      <button
                        type="button"
                        onClick={() => enterVehicleTripVisualizationMode()}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px',
                          color: '#041325',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                        }}
                      >
                        <Compass size={13} color="#041325" />
                        <span>CHI TIẾT CHUYẾN ĐI</span>
                      </button>

                      {!activeTrip.returnRequestedAt ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReturnError(null);
                            setShowReturnConfirm(true);
                          }}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                          }}
                        >
                          <Flag size={13} />
                          <span>YÊU CẦU TRẢ XE</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            padding: '8px',
                            color: '#94a3b8',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            cursor: 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                          }}
                        >
                          <CheckCircle2 size={12} color="#34d399" />
                          <span>ĐÃ GỬI YÊU CẦU</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : !candidateBooking || isFutureBookingBeforeWindow ? (
              /* STATE A: NO ACTIVE/NEAR-TERM BOOKING */
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(0, 242, 254, 0.18)',
                  borderRadius: '14px',
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', color: '#94a3b8' }}>
                  <Calendar size={13} color="#00f2fe" />
                  <span>
                    {isFutureBookingBeforeWindow
                      ? 'Lịch đặt đã lưu trong Lịch 3D'
                      : 'Chưa có lịch đặt sắp tới'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    openGaragePanel('BOOKING', { vehicleId: vehicle.id });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  {isFutureBookingBeforeWindow ? 'Xem Lịch 3D →' : 'Đặt lịch'}
                </button>
              </div>
            ) : isPrereqLoading ? (
              /* LOADING STATE */
              <div
                style={{
                  background: 'rgba(2, 132, 199, 0.08)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#38bdf8',
                  fontSize: '11.5px',
                  fontWeight: 700,
                }}
              >
                <Loader2 size={15} className="animate-spin" />
                <span>Đang kiểm tra điều kiện nhận xe...</span>
              </div>
            ) : isOverdueWithoutReturn ? (
              /* OVERDUE STATE */
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(8, 20, 36, 0.95) 100%)',
                  border: '1.5px solid rgba(239, 68, 68, 0.6)',
                  boxShadow: '0 0 16px rgba(239, 68, 68, 0.25)',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={15} color="#f87171" />
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f87171' }}>
                      CHUYẾN ĐI QUÁ HẠN CHƯA TRẢ XE
                    </span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
                  Chuyến đi đã vượt quá khung giờ đặt xe nhưng hệ thống chưa ghi nhận yêu cầu trả xe. Vui lòng gửi yêu cầu trả xe ngay để tránh phát sinh phụ phí.
                </p>
              </div>
            ) : completedHandover ? (
              /* STATE D: COMPLETED HANDOVER, READY TO START TRIP */
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(8, 20, 36, 0.95) 100%)',
                  border: '1.5px solid rgba(16, 185, 129, 0.55)',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.2)',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="#34d399" />
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399', letterSpacing: '0.03em' }}>
                      XE ĐÃ BÀN GIAO — SẴN SÀNG KHỞI HÀNH
                    </span>
                  </div>
                  <span
                    style={{
                      background: completedHandover.ownerReceivedAt || completedHandover.status === 'OWNER_CONFIRMED' || completedHandover.status === 'COMPLETED'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)',
                      border: completedHandover.ownerReceivedAt || completedHandover.status === 'OWNER_CONFIRMED' || completedHandover.status === 'COMPLETED'
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(245, 158, 11, 0.4)',
                      color: completedHandover.ownerReceivedAt || completedHandover.status === 'OWNER_CONFIRMED' || completedHandover.status === 'COMPLETED'
                        ? '#34d399'
                        : '#fbbf24',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '9.5px',
                      fontWeight: 800,
                    }}
                  >
                    {completedHandover.ownerReceivedAt || completedHandover.status === 'OWNER_CONFIRMED' || completedHandover.status === 'COMPLETED'
                      ? 'ĐÃ NHẬN XE'
                      : 'CHỜ XÁC NHẬN'}
                  </span>
                </div>

                {/* Complete Handover Details Snapshot */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    fontSize: '10.5px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Mã lịch đặt:</span>
                    <span style={{ color: '#ffffff', fontWeight: 700, fontFamily: 'monospace' }}>
                      #{candidateBooking.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Lịch đặt:</span>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>
                      {formatDate(candidateBooking.startTime)} ({formatTimeRange(candidateBooking.startTime, candidateBooking.endTime)})
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Thời điểm bàn giao:</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                      {formatDateTime(completedHandover.staffHandedOverAt || completedHandover.createdAt)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Nhân viên bàn giao:</span>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>
                      {completedHandover.staffName || 'Nhân viên kỹ thuật EVShare'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Người nhận xe:</span>
                    <span style={{ color: '#00f2fe', fontWeight: 700 }}>
                      {completedHandover.coOwnerName || user?.fullName || 'Đồng sở hữu'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Pin khi bàn giao (SOC):</span>
                    <span style={{ color: (completedHandover.startBatteryLevel ?? vehicle.currentBatteryLevel ?? 0) >= 20 ? '#34d399' : '#f87171', fontWeight: 800 }}>
                      {completedHandover.startBatteryLevel ?? vehicle.currentBatteryLevel ?? 0}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>ODO khi giao:</span>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>
                      {((completedHandover.startOdometer ?? vehicle.odometer ?? 0)).toLocaleString('vi-VN')} km
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>Kiểm tra kỹ thuật:</span>
                    <span style={{ color: '#34d399', fontWeight: 800, fontSize: '9.5px' }}>
                      {completedHandover.allCheckpointsInspected ? '8/8 ĐIỂM ĐẠT CHUẨN (PASS)' : (latestCompletedInspection?.overallResult === 'PASS' ? 'ĐẠT CHUẨN (PASS)' : 'ĐẠT TIÊU CHUẨN')}
                    </span>
                  </div>
                </div>

                {/* Action to view formal handover receipt */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHistoryHandover(completedHandover);
                    setShowHandoverHistory(true);
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 242, 254, 0.12)',
                    border: '1px solid rgba(0, 242, 254, 0.35)',
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#00f2fe',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <FileText size={13} />
                  <span>XEM BIÊN BẢN BÀN GIAO</span>
                </button>

                {/* Receipt Confirmation Reminder if pending */}
                {!completedHandover.ownerReceivedAt && completedHandover.status !== 'OWNER_CONFIRMED' && completedHandover.status !== 'COMPLETED' && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '10.5px', fontWeight: 700 }}>
                      <AlertTriangle size={13} />
                      <span>Vui lòng xác nhận nhận xe trên ứng dụng</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => enterVehicleReceiptReviewMode()}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '7px 10px',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      <Key size={12} />
                      <span>XÁC NHẬN NHẬN XE</span>
                    </button>
                  </div>
                )}

                {/* Grace Period & No-Show Violation Banner */}
                {(bookingViolation?.resolutionStatus === 'RECOVERY_PENDING' || (isPastGracePeriod && completedHandover && !isTripActive)) ? (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.25) 100%)',
                      border: '1.5px solid #ef4444',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '11px', fontWeight: 800 }}>
                      <AlertTriangle size={14} />
                      <span>VI PHẠM LỊCH ĐẶT — QUÁ GIỜ KHỞI HÀNH (NO-SHOW)</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: 1.4 }}>
                      Đã vượt quá thời gian chờ (15 phút). Phương tiện đang được nhân viên thu hồi vào bãi. Bạn không thể khởi hành chuyến đi này.
                    </div>
                  </div>
                ) : isWithinGracePeriod ? (
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#38bdf8',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    <Clock size={13} />
                    <span>Đã đến giờ khởi hành — Còn <strong>{graceMinutesRemaining} phút</strong> trong thời gian chờ xuất phát</span>
                  </div>
                ) : null}

                {tripEligibility && !tripEligibility.eligible && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      color: '#fbbf24',
                      fontSize: '10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <AlertTriangle size={12} />
                    <span>{eligibilityErrorMessage || tripEligibility.message || 'CHƯA ĐẾN THỜI GIAN SỬ DỤNG XE'}</span>
                  </div>
                )}
                <button
                  type="button"
                  disabled={
                    (tripEligibility ? !tripEligibility.eligible : false) ||
                    Boolean(bookingViolation && (bookingViolation.resolutionStatus === 'RECORDED' || bookingViolation.resolutionStatus === 'RECOVERY_PENDING')) ||
                    (isPastGracePeriod && !isTripActive)
                  }
                  onClick={() => enterVehicleTripStartMode()}
                  style={{
                    width: '100%',
                    marginTop: '2px',
                    background:
                      (tripEligibility && !tripEligibility.eligible) ||
                      Boolean(bookingViolation && (bookingViolation.resolutionStatus === 'RECORDED' || bookingViolation.resolutionStatus === 'RECOVERY_PENDING')) ||
                      (isPastGracePeriod && !isTripActive)
                        ? 'rgba(75, 85, 99, 0.4)'
                        : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    cursor:
                      (tripEligibility && !tripEligibility.eligible) ||
                      Boolean(bookingViolation && (bookingViolation.resolutionStatus === 'RECORDED' || bookingViolation.resolutionStatus === 'RECOVERY_PENDING')) ||
                      (isPastGracePeriod && !isTripActive)
                        ? 'not-allowed'
                        : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    boxShadow:
                      (tripEligibility && !tripEligibility.eligible) ||
                      Boolean(bookingViolation && (bookingViolation.resolutionStatus === 'RECORDED' || bookingViolation.resolutionStatus === 'RECOVERY_PENDING')) ||
                      (isPastGracePeriod && !isTripActive)
                        ? 'none'
                        : '0 4px 14px rgba(16, 185, 129, 0.4)',
                    opacity:
                      (tripEligibility && !tripEligibility.eligible) ||
                      Boolean(bookingViolation && (bookingViolation.resolutionStatus === 'RECORDED' || bookingViolation.resolutionStatus === 'RECOVERY_PENDING')) ||
                      (isPastGracePeriod && !isTripActive)
                        ? 0.6
                        : 1,
                  }}
                >
                  <Play size={14} fill="#ffffff" />
                  <span>BẮT ĐẦU CHUYẾN ĐI</span>
                </button>
              </div>
            ) : isInspectionOnlyCompleted ? (
              /* STATE C: STAFF INSPECTION COMPLETED, HANDOVER STILL PENDING */
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(8, 20, 36, 0.95) 100%)',
                  border: '1.5px solid rgba(245, 158, 11, 0.55)',
                  boxShadow: '0 0 16px rgba(245, 158, 11, 0.2)',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.03em' }}>
                      XE ĐÃ KIỂM TRA — CHỜ BÀN GIAO
                    </span>
                  </div>
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.25)',
                      color: '#fbbf24',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '9.5px',
                      fontWeight: 800,
                    }}
                  >
                    CHỜ XÁC NHẬN BÀN GIAO
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
                  Xe đã hoàn tất kiểm tra kỹ thuật đạt chuẩn. Đang chờ nhân viên kỹ thuật xác nhận bàn giao xe cho bạn.
                </p>
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '10.5px',
                    color: '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <div>Mã lịch đặt: <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{candidateBooking.id.slice(0, 8)}...</strong></div>
                  <div>Lịch đặt: <strong style={{ color: '#ffffff' }}>{formatDate(candidateBooking.startTime)} ({formatTimeRange(candidateBooking.startTime, candidateBooking.endTime)})</strong></div>
                  <div>Phương tiện: <strong style={{ color: '#00f2fe' }}>{displayName} ({licensePlateLabel})</strong></div>
                </div>
              </div>
            ) : isAnotherUserInCustody ? (
              /* STATE B-CUSTODY: WAITING FOR PREVIOUS CO-OWNER TO RETURN VEHICLE */
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(8, 20, 36, 0.95) 100%)',
                  border: '1.5px solid rgba(239, 68, 68, 0.45)',
                  boxShadow: '0 0 16px rgba(239, 68, 68, 0.18)',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#f87171" />
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f87171', letterSpacing: '0.03em' }}>
                      ĐANG CHỜ THÀNH VIÊN TRƯỚC TRẢ XE
                    </span>
                  </div>
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '9.5px',
                      fontWeight: 800,
                    }}
                  >
                    CHỜ TRẢ XE
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
                  Phương tiện hiện đang trong sự quản lý của thành viên trước. Nhân viên sẽ tiến hành kiểm tra và bàn giao xe cho bạn ngay khi xe được trả và xác minh hợp lệ.
                </p>
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '10.5px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Mã lịch đặt của bạn:</span>
                    <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{candidateBooking.id.slice(0, 8)}...</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Khung giờ đặt:</span>
                    <strong style={{ color: '#ffffff' }}>{formatDate(candidateBooking.startTime)} ({formatTimeRange(candidateBooking.startTime, candidateBooking.endTime)})</strong>
                  </div>
                  {activeTrip && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <span style={{ color: '#94a3b8' }}>Người đang giữ xe:</span>
                      <strong style={{ color: '#fbbf24' }}>{activeTrip.userName || 'Thành viên nhóm'}</strong>
                    </div>
                  )}
                  {activeTrip?.bookingEndTime && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Dự kiến trả xe:</span>
                      <strong style={{ color: isOverdue ? '#f87171' : '#38bdf8' }}>
                        {formatDateTime(activeTrip.bookingEndTime)} {isOverdue && '(QUÁ HẠN)'}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* STATE B: BOOKING CONFIRMED, WAITING FOR STAFF HANDOVER */
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12) 0%, rgba(8, 20, 36, 0.95) 100%)',
                  border: '1.5px solid rgba(2, 132, 199, 0.45)',
                  boxShadow: '0 0 16px rgba(2, 132, 199, 0.18)',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#38bdf8" />
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.03em' }}>
                      CHỜ NHÂN VIÊN BÀN GIAO XE
                    </span>
                  </div>
                  <span
                    style={{
                      background: 'rgba(2, 132, 199, 0.25)',
                      color: '#38bdf8',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '9.5px',
                      fontWeight: 800,
                    }}
                  >
                    CHỜ BÀN GIAO
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
                  Lịch đặt xe của bạn đã được xác nhận. Vui lòng chờ nhân viên kỹ thuật kiểm tra và xác nhận bàn giao xe.
                </p>
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '10.5px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Mã lịch đặt:</span>
                    <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{candidateBooking.id.slice(0, 8)}...</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Lịch đặt:</span>
                    <strong style={{ color: '#ffffff' }}>{formatDate(candidateBooking.startTime)} ({formatTimeRange(candidateBooking.startTime, candidateBooking.endTime)})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Phương tiện:</span>
                    <strong style={{ color: '#00f2fe' }}>{displayName} ({licensePlateLabel})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Người đặt xe:</span>
                    <strong style={{ color: '#ffffff' }}>{candidateBooking.userName || user?.fullName || 'Đồng sở hữu'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: NOTICES */}
            {pendingApprovalMaintenance && (
              <PendingApprovalMaintenanceNotice
                maintenance={pendingApprovalMaintenance}
                onOpenMaintenance={() => {
                  if (pendingApprovalMaintenance.relatedProposalId) {
                    openGaragePanel('VOTING', { vehicleId: vehicle.id, proposalId: pendingApprovalMaintenance.relatedProposalId });
                  } else {
                    openGaragePanel('VOTING', { vehicleId: vehicle.id });
                  }
                }}
              />
            )}

            {isOtherUserActiveTrip && activeTrip && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '14px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, color: '#fbbf24' }}>XE ĐANG ĐƯỢC SỬ DỤNG</span>
                  {isOverdue && (
                    <span style={{ fontSize: '9px', fontWeight: 800, background: 'rgba(239, 68, 68, 0.25)', color: '#f87171', padding: '1px 6px', borderRadius: '4px' }}>
                      QUÁ GIỜ
                    </span>
                  )}
                </div>
                <div style={{ color: '#cbd5e1' }}>Người dùng: <strong style={{ color: '#ffffff' }}>{activeTrip.userName || 'Thành viên nhóm'}</strong></div>
                <div style={{ color: '#94a3b8' }}>Dự kiến trả: <strong style={{ color: '#38bdf8' }}>{activeTrip.bookingEndTime ? formatDateTime(activeTrip.bookingEndTime) : 'Sau chuyến đi'}</strong></div>
              </div>
            )}

            {isEligibleForCheckIn && (
              <button
                type="button"
                onClick={() => enterVehicleReceiptReviewMode()}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  border: '1px solid #10b981',
                  borderRadius: '10px',
                  padding: '9px 14px',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
                }}
              >
                <Key size={14} />
                <span>NHẬN XE ĐỒNG SỞ HỮU</span>
              </button>
            )}

            {isWaitingForStaffHandover && !isEligibleForCheckIn && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '10px',
                  color: '#38bdf8',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Clock size={13} />
                <span>XE ĐÃ SẴN SÀNG — CHỜ NHÂN VIÊN GIAO XE</span>
              </div>
            )}

            {/* =================================================== */}
            {/* SECTION 5: THÔNG TIN CHI TIẾT & HỒ SƠ BÀN GIAO       */}
            {/* =================================================== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                LỊCH SỬ BÀN GIAO & TRẢ XE
              </div>
              <button
                type="button"
                onClick={() => setShowHandoverHistory(true)}
                style={{
                  width: '100%',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00f2fe';
                  e.currentTarget.style.color = '#00f2fe';
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                  e.currentTarget.style.color = '#38bdf8';
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
                }}
              >
                <History size={13} color="#00f2fe" />
                <span>LỊCH SỬ BÀN GIAO & TRẢ XE ({handoverHistory.length})</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function statusCardStyle(): React.CSSProperties {
  return {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  };
}

function statusCardLabelStyle(): React.CSSProperties {
  return {
    fontSize: '9.5px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.03em',
  };
}

function secondaryChipButtonStyle(): React.CSSProperties {
  return {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '7px 10px',
    color: '#f1f5f9',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  };
}
