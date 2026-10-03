import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench,
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Play,
  RotateCcw,
  Check,
  Eye,
  FileText,
  User,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { VehicleResponse } from '../../../types/vehicle';
import {
  MaintenanceResponse,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceType,
  CreateMaintenancePayload,
  MAINTENANCE_STATUS_CONFIG,
  MAINTENANCE_PRIORITY_CONFIG,
  MAINTENANCE_TYPE_CONFIG,
  MaintenanceApprovalResponse,
} from '../../../types/maintenance';
import {
  fetchVehicleMaintenance,
  fetchMaintenanceApproval,
  createVehicleMaintenance,
  scheduleMaintenance,
  startMaintenance,
  completeMaintenance,
  cancelMaintenance,
} from '../../../services/maintenanceApi';
import { fetchVehicleDamages } from '../../../services/damageApi';
import { DamageRecordResponse } from '../../../types/damage';
import { useWorldStore } from '../../../store/worldStore';
import { getPartById } from '../../../data/vehicleParts';

interface StaffMaintenanceItemCardProps {
  item: MaintenanceResponse;
  isSelected: boolean;
  isScheduling: boolean;
  isCompleting: boolean;
  scheduleDateTime: string;
  completionNote: string;
  selectedDamageId: string | null;
  onSelect: () => void;
  onFocusDamage: (damageId: string, partCode: string) => void;
  onOpenSchedule: () => void;
  onCloseSchedule: () => void;
  onScheduleDateTimeChange: (val: string) => void;
  onConfirmSchedule: () => void;
  onOpenComplete: () => void;
  onCloseComplete: () => void;
  onCompletionNoteChange: (val: string) => void;
  onConfirmComplete: () => void;
  onStart: () => void;
  onCancel: () => void;
  isSchedulePending: boolean;
  isStartPending: boolean;
  isCompletePending: boolean;
  isCancelPending: boolean;
}

const StaffMaintenanceItemCard: React.FC<StaffMaintenanceItemCardProps> = ({
  item,
  isSelected,
  isScheduling,
  isCompleting,
  scheduleDateTime,
  completionNote,
  selectedDamageId,
  onSelect,
  onFocusDamage,
  onOpenSchedule,
  onCloseSchedule,
  onScheduleDateTimeChange,
  onConfirmSchedule,
  onOpenComplete,
  onCloseComplete,
  onCompletionNoteChange,
  onConfirmComplete,
  onStart,
  onCancel,
  isSchedulePending,
  isStartPending,
  isCompletePending,
  isCancelPending,
}) => {
  // Authoritative Query: If proposal is PENDING_APPROVAL, APPROVED, or REJECTED, fetch approval voting details
  const isApprovalRelevant =
    item.status === 'PENDING_APPROVAL' ||
    item.status === 'APPROVED' ||
    item.status === 'REJECTED';

  const { data: approvalData } = useQuery<MaintenanceApprovalResponse>({
    queryKey: ['maintenanceApproval', item.id],
    queryFn: () => fetchMaintenanceApproval(item.id),
    enabled: isApprovalRelevant,
    refetchInterval: item.status === 'PENDING_APPROVAL' ? 3000 : undefined,
  });

  const statusCfg = MAINTENANCE_STATUS_CONFIG[item.status];
  const prioCfg = MAINTENANCE_PRIORITY_CONFIG[item.priority];
  const typeCfg = MAINTENANCE_TYPE_CONFIG[item.maintenanceType];

  const approveWeight = approvalData?.approveWeight ?? (item.approvedWeight != null ? Number(item.approvedWeight) : 0);
  const rejectWeight = approvalData?.rejectWeight ?? 0;
  const pendingWeight = approvalData?.pendingWeight ?? Math.max(0, 100 - approveWeight - rejectWeight);
  const threshold = approvalData?.requiredThreshold ?? 50.0;

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected
          ? 'rgba(245, 158, 11, 0.12)'
          : 'rgba(255, 255, 255, 0.03)',
        border: isSelected
          ? '1px solid #f59e0b'
          : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Top Row: Type & Priority & Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              background: typeCfg?.bg || 'rgba(255,255,255,0.1)',
              border: `1px solid ${typeCfg?.color || '#94a3b8'}`,
              color: typeCfg?.color || '#ffffff',
              fontSize: '9.5px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {typeCfg?.labelVi || item.maintenanceType}
          </span>

          <span
            style={{
              background: prioCfg?.bg || 'rgba(255,255,255,0.1)',
              color: prioCfg?.color || '#ffffff',
              fontSize: '9.5px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {prioCfg?.labelVi || item.priority}
          </span>
        </div>

        <span
          style={{
            background: statusCfg?.bg || 'rgba(255,255,255,0.1)',
            border: `1px solid ${statusCfg?.border || '#94a3b8'}`,
            color: statusCfg?.color || '#ffffff',
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '12px',
          }}
        >
          {statusCfg?.labelVi || item.status}
        </span>
      </div>

      {/* Title & Description */}
      <div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#f8fafc',
            lineHeight: 1.4,
          }}
        >
          {item.title}
        </div>
        {item.description && (
          <div
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              marginTop: '2px',
              lineHeight: 1.35,
            }}
          >
            {item.description}
          </div>
        )}
      </div>

      {/* Co-Owner Approval Progress Section (Requirements 12 & 14) */}
      {item.status === 'PENDING_APPROVAL' && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '8px',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24' }}>
              CHỜ ĐỒNG SỞ HỮU PHÊ DUYỆT
            </span>
            <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
              Cần &gt; {threshold}%
            </span>
          </div>

          <div
            style={{
              height: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            <div
              style={{
                width: `${approveWeight}%`,
                background: '#10b981',
                transition: 'width 0.3s ease',
              }}
              title={`Đồng ý: ${approveWeight}%`}
            />
            <div
              style={{
                width: `${rejectWeight}%`,
                background: '#ef4444',
                transition: 'width 0.3s ease',
              }}
              title={`Phản đối: ${rejectWeight}%`}
            />
            <div
              style={{
                width: `${pendingWeight}%`,
                background: 'rgba(255, 255, 255, 0.15)',
                transition: 'width 0.3s ease',
              }}
              title={`Chưa biểu quyết: ${pendingWeight}%`}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '9.5px',
            }}
          >
            <span style={{ color: '#34d399', fontWeight: 700 }}>{approveWeight}% đồng ý</span>
            <span style={{ color: '#f87171', fontWeight: 700 }}>{rejectWeight}% phản đối</span>
            <span style={{ color: '#94a3b8' }}>{pendingWeight}% chưa biểu quyết</span>
          </div>
        </div>
      )}

      {item.status === 'APPROVED' && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '6px',
            padding: '6px 8px',
            fontSize: '10.5px',
            color: '#34d399',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={12} />
            <span>ĐÃ ĐƯỢC ĐỒNG SỞ HỮU PHÊ DUYỆT ({approveWeight}%)</span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#a7f3d0' }}>
            {item.approvedAt && `Phê duyệt lúc: ${formatDateTime(item.approvedAt)} • `}
            Sẵn sàng để bắt đầu bảo dưỡng kỹ thuật.
          </div>
        </div>
      )}

      {item.status === 'REJECTED' && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '6px',
            padding: '6px 8px',
            fontSize: '10.5px',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <AlertCircle size={12} />
          <span>Yêu cầu đã bị từ chối bởi các đồng sở hữu ({rejectWeight}% phản đối).</span>
        </div>
      )}

      {/* Dates & Assigned Staff */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          fontSize: '10.5px',
          color: '#94a3b8',
        }}
      >
        {item.scheduledAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={12} color="#38bdf8" />
            <span>Dự kiến: {formatDateTime(item.scheduledAt)}</span>
          </div>
        )}
        {item.startedAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Play size={12} color="#f59e0b" />
            <span>Bắt đầu: {formatDateTime(item.startedAt)}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <User size={12} color="#94a3b8" />
          <span>Người tạo: {item.createdByName || 'STAFF'}</span>
        </div>
      </div>

      {/* Linked Damage Records */}
      {item.damageRecords && item.damageRecords.length > 0 && (
        <div
          style={{
            padding: '6px 8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#fbbf24',
              fontWeight: 700,
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <AlertTriangle size={11} />
            <span>Điểm hư hỏng liên quan ({item.damageRecords.length}):</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {item.damageRecords.map((dmg) => (
              <button
                key={dmg.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFocusDamage(dmg.id, dmg.vehiclePartCode);
                }}
                style={{
                  background:
                    selectedDamageId === dmg.id
                      ? 'rgba(0, 242, 254, 0.3)'
                      : 'rgba(255, 255, 255, 0.06)',
                  border:
                    selectedDamageId === dmg.id
                      ? '1px solid #00f2fe'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '9.5px',
                  color: selectedDamageId === dmg.id ? '#00f2fe' : '#e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title="Xem vị trí 3D trên xe"
              >
                <Eye size={10} />
                <span>{getPartById(dmg.vehiclePartCode)?.nameVi || dmg.vehiclePartCode}</span>
                {dmg.status && (
                  <span
                    style={{
                      fontSize: '8.5px',
                      color: dmg.status === 'RESOLVED' ? '#34d399' : '#fbbf24',
                    }}
                  >
                    ({dmg.status})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scheduling Sub-form */}
      {isScheduling && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: '6px',
            padding: '8px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>
            Chọn ngày giờ lên lịch:
          </label>
          <input
            type="datetime-local"
            value={scheduleDateTime}
            onChange={(e) => onScheduleDateTimeChange(e.target.value)}
            style={{
              width: '100%',
              background: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '4px',
              padding: '5px',
              fontSize: '11px',
              color: '#ffffff',
              colorScheme: 'dark',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onConfirmSchedule}
              disabled={isSchedulePending}
              style={{
                background: '#0284c7',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 10px',
                color: '#fff',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Xác nhận lịch
            </button>
            <button
              type="button"
              onClick={onCloseSchedule}
              style={{
                background: 'transparent',
                border: '1px solid #475569',
                borderRadius: '4px',
                padding: '5px 8px',
                color: '#94a3b8',
                fontSize: '10.5px',
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Completing Sub-form */}
      {isCompleting && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: '6px',
            padding: '8px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <label style={{ fontSize: '10px', color: '#34d399', fontWeight: 600 }}>
            Ghi chú hoàn tất bảo dưỡng:
          </label>
          <textarea
            rows={2}
            value={completionNote}
            onChange={(e) => onCompletionNoteChange(e.target.value)}
            placeholder="Ghi nhận kết quả xử lý, phụ tùng đã thay thế..."
            style={{
              width: '100%',
              background: '#0f172a',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '4px',
              padding: '5px',
              fontSize: '11px',
              color: '#ffffff',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onConfirmComplete}
              disabled={isCompletePending}
              style={{
                background: '#059669',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 10px',
                color: '#fff',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Xác nhận hoàn tất
            </button>
            <button
              type="button"
              onClick={onCloseComplete}
              style={{
                background: 'transparent',
                border: '1px solid #475569',
                borderRadius: '4px',
                padding: '5px 8px',
                color: '#94a3b8',
                fontSize: '10.5px',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Lifecycle Action Buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginTop: '4px',
          paddingTop: '6px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* PENDING_APPROVAL ACTIONS (Section 12 requirement: button DISABLED) */}
          {item.status === 'PENDING_APPROVAL' && (
            <>
              <button
                type="button"
                onClick={onOpenSchedule}
                style={{
                  flex: 1,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#38bdf8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <Calendar size={12} />
                <span>LÊN LỊCH</span>
              </button>

              <button
                type="button"
                disabled={true}
                title="Yêu cầu cần được các đồng sở hữu phê duyệt trước khi bắt đầu bảo dưỡng."
                style={{
                  flex: 1.5,
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#f59e0b',
                  cursor: 'not-allowed',
                  opacity: 0.55,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <Play size={12} />
                <span>BẮT ĐẦU BẢO DƯỠNG</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={isCancelPending}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10.5px',
                  color: '#f87171',
                  cursor: 'pointer',
                }}
                title="Hủy yêu cầu"
              >
                HỦY
              </button>
            </>
          )}

          {/* APPROVED ACTIONS (Section 12 requirement: button ENABLED) */}
          {item.status === 'APPROVED' && (
            <>
              <button
                type="button"
                onClick={onOpenSchedule}
                style={{
                  flex: 1,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#38bdf8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <Calendar size={12} />
                <span>LÊN LỊCH</span>
              </button>

              <button
                type="button"
                onClick={onStart}
                disabled={isStartPending}
                style={{
                  flex: 1.5,
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                }}
              >
                <Play size={12} />
                <span>BẮT ĐẦU BẢO DƯỠNG</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={isCancelPending}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10.5px',
                  color: '#f87171',
                  cursor: 'pointer',
                }}
                title="Hủy yêu cầu"
              >
                HỦY
              </button>
            </>
          )}

          {/* SCHEDULED ACTIONS */}
          {item.status === 'SCHEDULED' && (
            <>
              <button
                type="button"
                onClick={onStart}
                disabled={isStartPending}
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <Play size={12} />
                <span>BẮT ĐẦU BẢO DƯỠNG</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={isCancelPending}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10.5px',
                  color: '#f87171',
                  cursor: 'pointer',
                }}
                title="Hủy yêu cầu"
              >
                HỦY
              </button>
            </>
          )}

          {/* IN_PROGRESS ACTIONS */}
          {item.status === 'IN_PROGRESS' && (
            <button
              type="button"
              onClick={onOpenComplete}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 10px',
                fontSize: '11px',
                fontWeight: 800,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle2 size={13} />
              <span>HOÀN TẤT BẢO DƯỠNG</span>
            </button>
          )}

          {/* REJECTED ACTIONS */}
          {item.status === 'REJECTED' && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelPending}
              style={{
                width: '100%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '10.5px',
                color: '#f87171',
                cursor: 'pointer',
              }}
            >
              ĐÓNG / HỦY YÊU CẦU BỊ TỪ CHỐI
            </button>
          )}

          {/* LEGACY PENDING ACTIONS */}
          {item.status === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={onOpenSchedule}
                style={{
                  flex: 1,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#38bdf8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <Calendar size={12} />
                <span>LÊN LỊCH</span>
              </button>

              <button
                type="button"
                onClick={onStart}
                disabled={isStartPending}
                style={{
                  flex: 1.2,
                  background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <Play size={12} />
                <span>BẮT ĐẦU</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={isCancelPending}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10.5px',
                  color: '#f87171',
                  cursor: 'pointer',
                }}
                title="Hủy yêu cầu"
              >
                HỦY
              </button>
            </>
          )}
        </div>

        {item.status === 'PENDING_APPROVAL' && (
          <div
            style={{
              fontSize: '10px',
              color: '#f59e0b',
              fontStyle: 'italic',
              marginTop: '2px',
            }}
          >
            * Yêu cầu cần được các đồng sở hữu phê duyệt trước khi bắt đầu bảo dưỡng.
          </div>
        )}
      </div>
    </div>
  );
};

interface StaffMaintenancePanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '--/--/---- --:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--/--/---- --:--';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '--/--/---- --:--';
  }
}

export const StaffMaintenancePanel: React.FC<StaffMaintenancePanelProps> = ({
  vehicle,
  onClose,
}) => {
  const queryClient = useQueryClient();

  // Store actions and selections
  const selectDamageRecord = useWorldStore((state) => state.selectDamageRecord);
  const selectVehiclePartCode = useWorldStore((state) => state.selectVehiclePartCode);
  const selectedDamageId = useWorldStore((state) => state.selectedDamageId);
  const selectedMaintenanceId = useWorldStore((state) => state.selectedMaintenanceId);
  const selectMaintenanceRecord = useWorldStore((state) => state.selectMaintenanceRecord);
  const preselectedDamageId = useWorldStore(
    (state) => state.maintenanceDraftPreselectedDamageId
  );
  const preselectedPartCode = useWorldStore(
    (state) => state.maintenanceDraftPreselectedPartCode
  );
  const returnToGarageOverview = useWorldStore(
    (state) => state.returnToGarageOverview
  );

  // Local state for UI forms & dialogs
  const [showCreateForm, setShowCreateForm] = useState(!!preselectedDamageId);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form input state for Create Maintenance
  const [formTitle, setFormTitle] = useState(
    preselectedPartCode
      ? `Bảo dưỡng / sửa chữa ${getPartById(preselectedPartCode)?.nameVi || preselectedPartCode}`
      : ''
  );
  const [formType, setFormType] = useState<MaintenanceType>(
    preselectedDamageId ? 'REPAIR' : 'PREVENTIVE'
  );
  const [formPriority, setFormPriority] = useState<MaintenancePriority>('MEDIUM');
  const [formDescription, setFormDescription] = useState('');
  const [formScheduledAt, setFormScheduledAt] = useState('');
  const [formSelectedDamages, setFormSelectedDamages] = useState<string[]>(
    preselectedDamageId ? [preselectedDamageId] : []
  );

  // Fetch Authoritative Maintenance Records for this Vehicle (TanStack Query)
  const {
    data: maintenanceList = [],
    isLoading: isMaintenanceLoading,
    isError: isMaintenanceError,
    refetch: refetchMaintenance,
  } = useQuery<MaintenanceResponse[]>({
    queryKey: ['vehicleMaintenance', vehicle.id],
    queryFn: () => fetchVehicleMaintenance(vehicle.id),
    staleTime: 5000,
  });

  // Fetch Authoritative Damage Records for linking
  const { data: vehicleDamages = [] } = useQuery<DamageRecordResponse[]>({
    queryKey: ['vehicleDamages', vehicle.id],
    queryFn: () => fetchVehicleDamages(vehicle.id),
    staleTime: 5000,
  });

  // Clear messages helper
  const showToast = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      setSuccessMessage(text);
      setErrorMessage(null);
    } else {
      setErrorMessage(text);
      setSuccessMessage(null);
    }
    setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 4500);
  };

  // Helper to invalidate queries after mutations
  const handleQueryInvalidation = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance', vehicle.id] });
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle.id] });
    queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle.id] });
    queryClient.invalidateQueries({ queryKey: ['damageHistory', vehicle.id] });
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateMaintenancePayload) =>
      createVehicleMaintenance(vehicle.id, payload),
    onSuccess: (data) => {
      handleQueryInvalidation();
      setShowCreateForm(false);
      setFormTitle('');
      setFormDescription('');
      setFormScheduledAt('');
      setFormSelectedDamages([]);
      showToast('success', `Đã tạo yêu cầu bảo dưỡng "${data.title}" thành công.`);
    },
    onError: (err: any) => {
      showToast('error', err?.message || 'Không thể tạo yêu cầu bảo dưỡng.');
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      scheduleMaintenance(id, { scheduledAt }),
    onSuccess: () => {
      handleQueryInvalidation();
      setSchedulingId(null);
      setScheduleDateTime('');
      showToast('success', 'Đã lên lịch bảo dưỡng thành công.');
    },
    onError: (err: any) => {
      showToast('error', err?.message || 'Không thể lên lịch bảo dưỡng.');
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startMaintenance(id),
    onSuccess: () => {
      handleQueryInvalidation();
      showToast('success', 'Đã bắt đầu bảo dưỡng phương tiện. Trạng thái xe: ĐANG BẢO DƯỠNG.');
    },
    onError: (err: any) => {
      showToast('error', err?.message || 'Không thể bắt đầu bảo dưỡng xe.');
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      completeMaintenance(id, { completionNote: note }),
    onSuccess: () => {
      handleQueryInvalidation();
      setCompletingId(null);
      setCompletionNote('');
      showToast('success', 'Hoàn tất bảo dưỡng. Trạng thái phương tiện đã được cập nhật.');
    },
    onError: (err: any) => {
      showToast('error', err?.message || 'Không thể hoàn tất bảo dưỡng.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelMaintenance(id),
    onSuccess: () => {
      handleQueryInvalidation();
      showToast('success', 'Đã hủy yêu cầu bảo dưỡng.');
    },
    onError: (err: any) => {
      showToast('error', err?.message || 'Không thể hủy yêu cầu bảo dưỡng.');
    },
  });

  // Derived datasets
  const activeRequests = useMemo(() => {
    return maintenanceList.filter(
      (m) =>
        m.status === 'PENDING_APPROVAL' ||
        m.status === 'APPROVED' ||
        m.status === 'SCHEDULED' ||
        m.status === 'IN_PROGRESS' ||
        m.status === 'PENDING' ||
        m.status === 'REJECTED'
    );
  }, [maintenanceList]);

  const completedRequests = useMemo(() => {
    return maintenanceList
      .filter((m) => m.status === 'COMPLETED' || m.status === 'CANCELLED')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [maintenanceList]);

  const lastCompleted = useMemo(() => {
    return completedRequests.find((m) => m.status === 'COMPLETED') || null;
  }, [completedRequests]);

  // Focus damage location in 3D
  const handleFocusDamage = (damageId: string, partCode: string) => {
    selectDamageRecord(damageId);
    selectVehiclePartCode(partCode);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('error', 'Vui lòng nhập tiêu đề yêu cầu bảo dưỡng.');
      return;
    }
    createMutation.mutate({
      title: formTitle.trim(),
      maintenanceType: formType,
      priority: formPriority,
      description: formDescription.trim() || undefined,
      scheduledAt: formScheduledAt ? new Date(formScheduledAt).toISOString() : null,
      damageRecordIds: formSelectedDamages.length > 0 ? formSelectedDamages : undefined,
    });
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
        bottom: '20px',
        width: 'clamp(360px, 30vw, 440px)',
        zIndex: 40,
        background:
          'linear-gradient(180deg, rgba(11, 18, 33, 0.96) 0%, rgba(6, 11, 22, 0.98) 100%)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '16px',
        boxShadow:
          '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 35px rgba(245, 158, 11, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        color: '#ffffff',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Quay lại xe"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
              }}
            >
              <Wrench size={16} color="#f59e0b" />
              <span>BẢO DƯỠNG XE</span>
            </div>
            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
              {vehicle.plateNumber || vehicle.modelName || 'Xe EV'} — Điều phối kỹ thuật
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#f59e0b',
            letterSpacing: '0.04em',
          }}
        >
          OPERATIONS
        </div>
      </div>

      {/* 2. Operational Summary Bar */}
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          {/* Trạng thái xe */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              padding: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
              Trạng thái xe
            </div>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: vehicle.status === 'MAINTENANCE' ? '#f59e0b' : '#10b981',
              }}
            >
              {vehicle.status === 'MAINTENANCE'
                ? 'Đang bảo dưỡng'
                : vehicle.status === 'IN_USE'
                ? 'Đang sử dụng'
                : 'Sẵn sàng'}
            </div>
          </div>

          {/* Yêu cầu đang mở */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              padding: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
              Đang mở
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
              {activeRequests.length}
            </div>
          </div>

          {/* Lần gần nhất */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              padding: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
              Gần nhất
            </div>
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                color: '#e2e8f0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {lastCompleted ? formatDateTime(lastCompleted.completedAt) : 'Chưa có'}
            </div>
          </div>
        </div>

        {/* Primary Action Button: [ + TẠO YÊU CẦU BẢO DƯỠNG ] */}
        {!showCreateForm && (
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(true);
              setErrorMessage(null);
            }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
              border: 'none',
              borderRadius: '9px',
              padding: '9px 14px',
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
            }}
          >
            <Plus size={15} />
            <span>TẠO YÊU CẦU BẢO DƯỠNG</span>
          </button>
        )}
      </div>

      {/* Notifications / Error Banner */}
      {errorMessage && (
        <div
          style={{
            margin: '10px 18px 0',
            background: 'rgba(239, 68, 68, 0.18)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '11px',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, lineHeight: 1.4 }}>{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            margin: '10px 18px 0',
            background: 'rgba(16, 185, 129, 0.18)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '11px',
            color: '#6ee7b7',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, lineHeight: 1.4 }}>{successMessage}</div>
        </div>
      )}

      {/* Scrollable Content Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* 3. Inline Create Maintenance Form (Requirement 13) */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateSubmit}
            style={{
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '12px',
              padding: '14px',
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
                borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#f59e0b',
                  letterSpacing: '0.04em',
                }}
              >
                PHIẾU YÊU CẦU BẢO DƯỠNG
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Tiêu đề */}
            <div>
              <label style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 600 }}>
                Tiêu đề bảo dưỡng <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ví dụ: Kiểm tra định kỳ động cơ / Xử lý hư hỏng thân vỏ"
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
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as MaintenanceType)}
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
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as MaintenancePriority)}
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

            {/* Ngày giờ dự kiến */}
            <div>
              <label style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 600 }}>
                Thời gian dự kiến bắt đầu (Tùy chọn)
              </label>
              <input
                type="datetime-local"
                value={formScheduledAt}
                onChange={(e) => setFormScheduledAt(e.target.value)}
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
                  colorScheme: 'dark',
                }}
              />
            </div>

            {/* Mô tả chi tiết */}
            <div>
              <label style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 600 }}>
                Mô tả chi tiết hạng mục
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Ghi chú kỹ thuật, nguyên nhân hoặc yêu cầu phụ tùng..."
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
                }}
              />
            </div>

            {/* Liên kết Damage Records (Requirement 3 & 13) */}
            {vehicleDamages.length > 0 && (
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
                  <span>Liên kết vết hư hại ghi nhận ({formSelectedDamages.length} đã chọn)</span>
                </label>
                <div
                  style={{
                    marginTop: '4px',
                    maxHeight: '110px',
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
                  {vehicleDamages.map((dmg) => {
                    const isChecked = formSelectedDamages.includes(dmg.id);
                    const partName =
                      getPartById(dmg.vehiclePartCode)?.nameVi || dmg.vehiclePartCode;
                    return (
                      <label
                        key={dmg.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          background: isChecked ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                          cursor: 'pointer',
                          fontSize: '10.5px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormSelectedDamages((prev) => [...prev, dmg.id]);
                            } else {
                              setFormSelectedDamages((prev) =>
                                prev.filter((id) => id !== dmg.id)
                              );
                            }
                          }}
                        />
                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>{partName}</span>
                        <span style={{ color: '#94a3b8' }}>({dmg.damageType})</span>
                        <span
                          style={{
                            marginLeft: 'auto',
                            fontSize: '9.5px',
                            color: dmg.severity === 'CRITICAL' ? '#f87171' : '#fbbf24',
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

            {/* Form actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="submit"
                disabled={createMutation.isPending}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '8px',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <Check size={14} />
                <span>{createMutation.isPending ? 'Đang tạo...' : 'TẠO YÊU CẦU'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
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

        {/* 4. Active Requests Section */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#94a3b8',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>YÊU CẦU ĐANG XỬ LÝ ({activeRequests.length})</span>
          </div>

          {activeRequests.length === 0 ? (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#64748b',
              }}
            >
              Không có yêu cầu bảo dưỡng nào đang chờ hoặc đang tiến hành.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeRequests.map((item) => (
                <StaffMaintenanceItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedMaintenanceId === item.id}
                  isScheduling={schedulingId === item.id}
                  isCompleting={completingId === item.id}
                  scheduleDateTime={scheduleDateTime}
                  completionNote={completionNote}
                  selectedDamageId={selectedDamageId}
                  onSelect={() =>
                    selectMaintenanceRecord(selectedMaintenanceId === item.id ? null : item.id)
                  }
                  onFocusDamage={handleFocusDamage}
                  onOpenSchedule={() => {
                    setSchedulingId(item.id);
                    setScheduleDateTime('');
                  }}
                  onCloseSchedule={() => setSchedulingId(null)}
                  onScheduleDateTimeChange={setScheduleDateTime}
                  onConfirmSchedule={() => {
                    if (!scheduleDateTime) {
                      showToast('error', 'Vui lòng chọn thời gian.');
                      return;
                    }
                    scheduleMutation.mutate({
                      id: item.id,
                      scheduledAt: new Date(scheduleDateTime).toISOString(),
                    });
                  }}
                  onOpenComplete={() => {
                    setCompletingId(item.id);
                    setCompletionNote('');
                  }}
                  onCloseComplete={() => setCompletingId(null)}
                  onCompletionNoteChange={setCompletionNote}
                  onConfirmComplete={() => {
                    completeMutation.mutate({
                      id: item.id,
                      note: completionNote.trim() || undefined,
                    });
                  }}
                  onStart={() => startMutation.mutate(item.id)}
                  onCancel={() => cancelMutation.mutate(item.id)}
                  isSchedulePending={scheduleMutation.isPending}
                  isStartPending={startMutation.isPending}
                  isCompletePending={completeMutation.isPending}
                  isCancelPending={cancelMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* 5. Completed Maintenance History Section (Requirement 20) */}
        <div style={{ marginTop: '8px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#94a3b8',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>LỊCH SỬ HOÀN TẤT ({completedRequests.length})</span>
          </div>

          {completedRequests.length === 0 ? (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#64748b',
              }}
            >
              Xe chưa có lịch sử bảo dưỡng hoàn tất.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {completedRequests.map((item) => {
                const typeCfg = MAINTENANCE_TYPE_CONFIG[item.maintenanceType];
                const statusCfg = MAINTENANCE_STATUS_CONFIG[item.status];
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: typeCfg?.color || '#94a3b8',
                          background: typeCfg?.bg || 'transparent',
                          padding: '1px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        {typeCfg?.labelVi || item.maintenanceType}
                      </span>
                      <span
                        style={{
                          fontSize: '9.5px',
                          color: statusCfg?.color || '#94a3b8',
                          fontWeight: 600,
                        }}
                      >
                        {statusCfg?.labelVi || item.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#e2e8f0' }}>
                      {item.title}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        color: '#64748b',
                        marginTop: '2px',
                      }}
                    >
                      <span>Hoàn tất: {formatDateTime(item.completedAt || item.updatedAt)}</span>
                      <span>Bởi: {item.assignedStaffName || item.createdByName || 'STAFF'}</span>
                    </div>

                    {item.completionNote && (
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '4px 6px',
                          background: 'rgba(0, 0, 0, 0.25)',
                          borderRadius: '4px',
                          fontSize: '10px',
                          color: '#94a3b8',
                          fontStyle: 'italic',
                        }}
                      >
                        "{item.completionNote}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Footer Actions */}
      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.35)',
          display: 'flex',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.25) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '8px',
            padding: '9px 12px',
            color: '#fbbf24',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.03em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.35) 100%)';
            e.currentTarget.style.borderColor = '#fbbf24';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.25) 100%)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
          }}
        >
          <ArrowLeft size={13} />
          QUAY LẠI XE
        </button>

        <button
          type="button"
          onClick={returnToGarageOverview}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            padding: '9px 12px',
            color: '#94a3b8',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          QUAY LẠI TOÀN CẢNH GARAGE
        </button>
      </div>
    </div>
  );
};
