import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  X,
  Wrench,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  Car,
  FileText,
  ArrowRight,
  ShieldCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  History,
  Info,
  ThumbsUp,
  RotateCcw,
  Sparkles,
  DollarSign,
  Check,
} from 'lucide-react';
import { VehicleResponse } from '../../../types/vehicle';
import {
  DamageRecordResponse,
  DamageSeverity,
  DamageStatus,
  DAMAGE_SEVERITY_CONFIG,
  DAMAGE_STATUS_CONFIG,
  DAMAGE_TYPE_LABELS,
} from '../../../types/damage';
import {
  MaintenanceResponse,
  MAINTENANCE_STATUS_CONFIG,
  MAINTENANCE_TYPE_CONFIG,
} from '../../../types/maintenance';
import { ExpenseResponse } from '../../../types/expense';
import { fetchVehicleDamages } from '../../../services/damageApi';
import { fetchVehicleMaintenance, createVoteForMaintenance } from '../../../services/maintenanceApi';
import { fetchExpenses } from '../../../services/expenseApi';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { getPartById } from '../../../data/vehicleParts';

interface DamageDetailModalProps {
  vehicle: VehicleResponse;
  onClose?: () => void;
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

export const DamageDetailModal: React.FC<DamageDetailModalProps> = ({
  vehicle,
  onClose,
}) => {
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN';

  const selectedDamageId = useWorldStore((state) => state.selectedDamageId);
  const isDamageDetailModalOpen = useWorldStore((state) => state.isDamageDetailModalOpen);
  const closeDamageDetailModal = useWorldStore((state) => state.closeDamageDetailModal);
  const enterVehicleMaintenanceMode = useWorldStore((state) => state.enterVehicleMaintenanceMode);
  const openGaragePanel = useWorldStore((state) => state.openGaragePanel);
  const selectMaintenanceRecord = useWorldStore((state) => state.selectMaintenanceRecord);

  // Responsive screen-width detector
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Expandable technical section state (collapsible)
  const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);

  // Authoritative TanStack Query: Fetch persisted damage records for this vehicle
  const vehicleId = vehicle?.id || 'EV01';
  const { data: damages = [], isLoading } = useQuery<DamageRecordResponse[]>({
    queryKey: ['vehicleDamages', vehicleId],
    queryFn: () => fetchVehicleDamages(vehicleId),
    enabled: !!vehicleId,
    staleTime: 4000,
  });

  // Authoritative TanStack Query: Fetch maintenance records for linked detection
  const { data: maintenanceList = [] } = useQuery<MaintenanceResponse[]>({
    queryKey: ['vehicleMaintenance', vehicleId],
    queryFn: () => fetchVehicleMaintenance(vehicleId),
    enabled: !!vehicleId,
    staleTime: 4000,
  });

  // Authoritative TanStack Query: Fetch vehicle expenses for financial settlement link
  const { data: expenses = [] } = useQuery<ExpenseResponse[]>({
    queryKey: ['expenses', vehicleId],
    queryFn: () => fetchExpenses({ vehicleId }),
    enabled: !!vehicleId,
    staleTime: 5000,
  });

  // Find authoritative damage record
  const damage = useMemo(() => {
    if (!selectedDamageId) return null;
    return damages.find((d) => String(d.id).toLowerCase() === String(selectedDamageId).toLowerCase()) || null;
  }, [damages, selectedDamageId]);

  // Check for linked active or completed maintenance request
  const linkedMaintenance = useMemo(() => {
    if (!damage) return null;
    const dmgId = String(damage.id).toLowerCase();
    const resolvedReqId = damage.resolvedByMaintenanceRequestId
      ? String(damage.resolvedByMaintenanceRequestId).toLowerCase()
      : null;

    return (
      maintenanceList.find((m) => {
        const mId = String(m.id).toLowerCase();
        if (resolvedReqId && resolvedReqId === mId) return true;
        if (m.damageRecordIds?.some((id) => String(id).toLowerCase() === dmgId)) return true;
        if (m.damageRecords?.some((d) => String(d.id).toLowerCase() === dmgId)) return true;
        return false;
      }) || null
    );
  }, [damage, maintenanceList]);

  // Check for linked financial expense (Section 5 & 6)
  const linkedExpense = useMemo(() => {
    if (!linkedMaintenance) return null;
    const mId = String(linkedMaintenance.id).toLowerCase();
    const propId = linkedMaintenance.relatedProposalId
      ? String(linkedMaintenance.relatedProposalId).toLowerCase()
      : null;

    return (
      expenses.find((e) => {
        if (e.sourceReferenceId && String(e.sourceReferenceId).toLowerCase() === mId) return true;
        if (propId && e.relatedProposalId && String(e.relatedProposalId).toLowerCase() === propId) return true;
        return false;
      }) || null
    );
  }, [linkedMaintenance, expenses]);

  const queryClient = useQueryClient();

  // Create voting session for linked maintenance proposal
  const createVoteMutation = useMutation({
    mutationFn: (maintenanceId: string) => createVoteForMaintenance(maintenanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance', vehicle?.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicleDamages', vehicle?.id] });
      queryClient.invalidateQueries({ queryKey: ['vote-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      handleClose();
      if (linkedMaintenance) {
        selectMaintenanceRecord(linkedMaintenance.id);
      }
      openGaragePanel('MAINTENANCE', {
        vehicleId: vehicle.id,
        maintenanceId: linkedMaintenance?.id,
      });
    },
    onError: () => {
      handleNavigateToMaintenance();
    },
  });

  // Authoritative status breakdown for linked maintenance and damage lifecycle
  const isResolved =
    damage?.status === 'RESOLVED' ||
    (linkedMaintenance && linkedMaintenance.status === 'COMPLETED');

  const isPendingApproval = linkedMaintenance?.status === 'PENDING_APPROVAL';
  const isApproved =
    linkedMaintenance?.status === 'APPROVED' || linkedMaintenance?.status === 'SCHEDULED';
  const isInProgress = linkedMaintenance?.status === 'IN_PROGRESS';
  const isPending = linkedMaintenance?.status === 'PENDING';
  const isRejectedOrCancelled =
    linkedMaintenance?.status === 'REJECTED' || linkedMaintenance?.status === 'CANCELLED';

  const hasActiveLinkedMaintenance = !!linkedMaintenance && !isResolved && !isRejectedOrCancelled;

  // Header Status Badge configuration
  const headerStatusConfig = useMemo(() => {
    if (isResolved) {
      return {
        label: 'ĐÃ KHẮC PHỤC',
        color: '#34d399',
        bg: 'rgba(16, 185, 129, 0.2)',
        border: 'rgba(16, 185, 129, 0.4)',
      };
    }
    if (isInProgress) {
      return {
        label: 'ĐANG SỬA CHỮA',
        color: '#fbbf24',
        bg: 'rgba(245, 158, 11, 0.2)',
        border: 'rgba(245, 158, 11, 0.4)',
      };
    }
    if (isPendingApproval) {
      return {
        label: 'ĐANG BIỂU QUYẾT',
        color: '#fbbf24',
        bg: 'rgba(245, 158, 11, 0.2)',
        border: 'rgba(245, 158, 11, 0.4)',
      };
    }
    if (isApproved) {
      return {
        label: 'ĐÃ PHÊ DUYỆT',
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.2)',
        border: 'rgba(56, 189, 248, 0.4)',
      };
    }
    if (isPending) {
      return {
        label: 'CHỜ NHÓM TẠO BIỂU QUYẾT',
        color: '#fbbf24',
        bg: 'rgba(245, 158, 11, 0.2)',
        border: 'rgba(245, 158, 11, 0.4)',
      };
    }
    if (isRejectedOrCancelled) {
      return {
        label: linkedMaintenance?.status === 'REJECTED' ? 'ĐÃ TỪ CHỐI' : 'ĐÃ HỦY',
        color: '#f87171',
        bg: 'rgba(239, 68, 68, 0.2)',
        border: 'rgba(239, 68, 68, 0.4)',
      };
    }
    return {
      label: damage?.status === 'UNDER_MAINTENANCE' ? 'ĐANG BẢO DƯỠNG' : 'CHỜ XỬ LÝ',
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.2)',
      border: 'rgba(239, 68, 68, 0.4)',
    };
  }, [
    isResolved,
    isInProgress,
    isPendingApproval,
    isApproved,
    isPending,
    isRejectedOrCancelled,
    linkedMaintenance?.status,
    damage?.status,
  ]);

  // Handle modal/panel close
  const handleClose = () => {
    closeDamageDetailModal();
    if (onClose) onClose();
  };

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDamageDetailModalOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDamageDetailModalOpen]);

  const partMeta = useMemo(() => {
    if (!damage?.vehiclePartCode) return null;
    return getPartById(damage.vehiclePartCode);
  }, [damage?.vehiclePartCode]);

  const partNameVi = partMeta?.nameVi || damage?.vehiclePartCode || 'linh kiện';

  // Sanitized maintenance title with fallback (prevents unknown placeholders like "ds")
  const sanitizedMaintenanceTitle = useMemo(() => {
    if (!linkedMaintenance) return '';
    const raw = linkedMaintenance.title?.trim();
    if (raw && raw.length > 2 && raw.toLowerCase() !== 'ds' && raw.toLowerCase() !== 'test') {
      return raw;
    }
    return `Bảo dưỡng / sửa chữa ${partNameVi}`;
  }, [linkedMaintenance, partNameVi]);

  // Handle action "TẠO ĐỀ XUẤT SỬA CHỮA"
  const handleCreateRepairProposal = () => {
    // Idempotency: if an active request already exists, route to it rather than creating a duplicate
    if (hasActiveLinkedMaintenance) {
      handleNavigateToMaintenance();
      return;
    }

    handleClose();
    enterVehicleMaintenanceMode({
      vehicleId: vehicle.id,
      preselectedDamageId: damage?.id,
      preselectedPartCode: damage?.vehiclePartCode,
    });
    if (!isStaff) {
      openGaragePanel('MAINTENANCE');
    }
  };

  // Handle action "XEM TIẾN ĐỘ SỬA CHỮA" or "XEM BIỂU QUYẾT" or "XEM LỊCH SỬ SỬA CHỮA"
  const handleNavigateToMaintenance = () => {
    handleClose();
    if (isStaff) {
      enterVehicleMaintenanceMode({
        vehicleId: vehicle.id,
        preselectedDamageId: damage?.id,
        preselectedPartCode: damage?.vehiclePartCode,
      });
      if (linkedMaintenance) {
        selectMaintenanceRecord(linkedMaintenance.id);
      }
    } else {
      openGaragePanel('MAINTENANCE', {
        vehicleId: vehicle.id,
        maintenanceId: linkedMaintenance?.id,
      });
      if (linkedMaintenance) {
        selectMaintenanceRecord(linkedMaintenance.id);
      }
    }
  };

  if (!isDamageDetailModalOpen) {
    return null;
  }

  if (!damage) {
    return (
      <div
        role="region"
        aria-label="Thông báo lỗi"
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: isMobile ? 'auto' : '1.5rem',
          bottom: isMobile ? 0 : '1.5rem',
          right: isMobile ? 0 : '1.5rem',
          left: isMobile ? 0 : 'auto',
          width: isMobile ? '100%' : '440px',
          maxHeight: isMobile ? '80vh' : 'calc(100vh - 3rem)',
          backgroundColor: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: isMobile ? '1.25rem 1.25rem 0 0' : '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          color: '#f8fafc',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f87171' }}>
                KHÔNG TÌM THẤY HƯ HỎNG
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Mã bản ghi: {selectedDamageId ? selectedDamageId.substring(0, 8).toUpperCase() : 'N/A'}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Đóng"
            style={{
              padding: '0.5rem',
              backgroundColor: 'rgba(51, 65, 85, 0.5)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '0.5rem',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          borderRadius: '0.75rem',
          padding: '1rem',
          border: '1px solid rgba(71, 85, 105, 0.4)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          color: '#cbd5e1'
        }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>Đang tải thông tin bản ghi hư hỏng...</span>
            </div>
          ) : (
            <p style={{ margin: 0 }}>
              Bản ghi hư hỏng này không tồn tại trên xe hiện tại, hoặc đã được hợp nhất/xóa khỏi hệ thống. Vui lòng kiểm tra lại danh sách hoặc chọn xe tương ứng.
            </p>
          )}
        </div>

        <button
          onClick={handleClose}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: 'rgba(51, 65, 85, 0.8)',
            color: '#f8fafc',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '0.625rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          ĐÓNG
        </button>
      </div>
    );
  }

  const sevConfig =
    DAMAGE_SEVERITY_CONFIG[damage.severity as DamageSeverity] ||
    DAMAGE_SEVERITY_CONFIG.MINOR;
  const damageTypeLabel =
    DAMAGE_TYPE_LABELS[damage.damageType] || damage.damageType;
  const shortDamageId = damage.id.length > 8 ? damage.id.substring(0, 8).toUpperCase() : damage.id;

  return (
    <>
      {/* Mobile-only background overlay backdrop (Desktop has NO backdrop so vehicle stays visible) */}
      {isMobile && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 490,
            background: 'rgba(3, 7, 18, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        />
      )}

      {/* Right-Side Management Panel (Desktop) / Bottom Drawer (Mobile) */}
      <div
        role="region"
        aria-label="Chi tiết hư hỏng"
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          color: '#ffffff',
          fontFamily: 'var(--font-family, sans-serif)',
          background: 'linear-gradient(180deg, rgba(8, 16, 32, 0.96) 0%, rgba(5, 10, 22, 0.98) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1.5px solid rgba(0, 242, 254, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 35px rgba(0, 242, 254, 0.15)',
          pointerEvents: 'auto',
          animation: isMobile ? 'slideUpDrawer 0.22s ease-out' : 'slideInRight 0.22s ease-out',
          // Desktop positioning: clamp(380px, 32vw, 500px), right: 20px, top: 90px, bottom: 20px
          ...(isMobile
            ? {
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                maxHeight: '88dvh',
                borderRadius: '20px 20px 0 0',
                borderBottom: 'none',
              }
            : {
                top: '90px',
                right: '20px',
                bottom: '20px',
                width: 'clamp(380px, 32vw, 500px)',
                maxHeight: 'calc(100dvh - 110px)',
                borderRadius: '16px',
              }),
        }}
      >
        {/* ========================================================================= */}
        {/* 1. HEADER (Fixed at top, flex-shrink: 0) */}
        {/* ========================================================================= */}
        <div
          style={{
            flexShrink: 0,
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: headerStatusConfig.bg,
                border: `1.5px solid ${headerStatusConfig.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 10px ${headerStatusConfig.color}40`,
              }}
            >
              {isResolved ? (
                <CheckCircle2 size={17} color="#10b981" />
              ) : isPendingApproval ? (
                <ThumbsUp size={16} color="#fbbf24" />
              ) : isApproved || isInProgress ? (
                <Wrench size={16} color="#38bdf8" />
              ) : (
                <AlertTriangle size={17} color={headerStatusConfig.color} />
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>{isResolved ? 'CHI TIẾT KHẮC PHỤC HƯ HỎNG' : 'CHI TIẾT HƯ HỎNG'}</span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: headerStatusConfig.bg,
                    color: headerStatusConfig.color,
                    border: `1px solid ${headerStatusConfig.border}`,
                  }}
                >
                  {headerStatusConfig.label}
                </span>
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>
                Mã bản ghi: <span style={{ fontFamily: 'monospace', color: '#00f2fe' }}>#{shortDamageId}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng chi tiết hư hỏng"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#ff6b6b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. BODY (Scrollable, flex: 1, min-height: 0, overflow-y: auto) */}
        {/* ========================================================================= */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Section A: Compact Vehicle Summary (Section 7) */}
          <div
            style={{
              background: 'rgba(0, 242, 254, 0.04)',
              border: '1px solid rgba(0, 242, 254, 0.18)',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Car size={16} color="#00f2fe" />
              <div>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>
                  {vehicle.name || vehicle.model || 'Xe điện EVShare'}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
                  • Biển số: <strong style={{ color: '#00f2fe' }}>{vehicle.licensePlate || 'N/A'}</strong>
                </span>
              </div>
            </div>

            {isStaff && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {vehicle.id}
              </span>
            )}
          </div>

          {/* Section B: Information Card: "THÔNG TIN HƯ HỎNG" (Section 8) */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                color: '#00f2fe',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FileText size={13} />
              <span>THÔNG TIN HƯ HỎNG</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>
                  BỘ PHẬN BỊ ẢNH HƯỞNG
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                  {partNameVi}
                </div>
              </div>

              {/* Severity Badge */}
              <div
                style={{
                  background: sevConfig.bg,
                  border: `1.5px solid ${sevConfig.borderColor}`,
                  color: sevConfig.color,
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  boxShadow: `0 0 8px ${sevConfig.color}35`,
                }}
              >
                {damageTypeLabel} • {sevConfig.labelVi}
              </div>
            </div>

            {/* Description */}
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                MÔ TẢ GHI NHẬN
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: damage.note ? '#f1f5f9' : '#64748b',
                  fontStyle: damage.note ? 'normal' : 'italic',
                  lineHeight: 1.45,
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {damage.note || 'Không có mô tả chi tiết thêm từ biên bản kiểm tra.'}
              </div>
            </div>

            {/* Reporter & Timestamp */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                fontSize: '10.5px',
                paddingTop: '2px',
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>Người ghi nhận:</span>
                <div style={{ color: '#cbd5e1', fontWeight: 600, marginTop: '1px' }}>
                  {damage.createdByName || 'Kỹ thuật viên garage'}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Thời gian:</span>
                <div style={{ color: '#cbd5e1', fontWeight: 600, marginTop: '1px' }}>
                  {formatDateTime(damage.createdAt)}
                </div>
              </div>
            </div>

            {/* Expandable Technical Info Section (Section 8: optional expandable section) */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowTechnicalInfo((prev) => !prev)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 0',
                  color: '#94a3b8',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00f2fe';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={11} />
                  <span>THÔNG TIN KỸ THUẬT (TỌA ĐỘ 3D)</span>
                </span>
                {showTechnicalInfo ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showTechnicalInfo && (
                <div
                  style={{
                    marginTop: '6px',
                    padding: '8px 10px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tọa độ 3D cục bộ:</span>
                    <span style={{ color: '#00f2fe' }}>
                      X:{damage.localPositionX?.toFixed(3)} Y:{damage.localPositionY?.toFixed(3)} Z:{damage.localPositionZ?.toFixed(3)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Mã bộ phận:</span>
                    <span style={{ color: '#cbd5e1' }}>{damage.vehiclePartCode}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Mã định danh đầy đủ:</span>
                    <span style={{ color: '#cbd5e1' }}>{damage.id}</span>
                  </div>
                  {damage.tripId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Mã chuyến đi:</span>
                      <span style={{ color: '#cbd5e1' }}>{damage.tripId}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section C: Repair Status Card */}
          <div
            style={{
              background: isResolved
                ? 'rgba(16, 185, 129, 0.06)'
                : hasActiveLinkedMaintenance
                ? 'rgba(245, 158, 11, 0.06)'
                : 'rgba(15, 23, 42, 0.5)',
              border: `1px solid ${
                isResolved
                  ? 'rgba(16, 185, 129, 0.3)'
                  : hasActiveLinkedMaintenance
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(255, 255, 255, 0.08)'
              }`,
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: isResolved
                    ? '#34d399'
                    : isPendingApproval || isInProgress
                    ? '#fbbf24'
                    : isApproved
                    ? '#38bdf8'
                    : '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isResolved ? (
                  <CheckCircle2 size={13} />
                ) : isPendingApproval ? (
                  <ThumbsUp size={13} />
                ) : (
                  <Wrench size={13} />
                )}
                <span>
                  {isResolved
                    ? 'LỊCH SỬ KHẮC PHỤC'
                    : isInProgress
                    ? 'TIẾN ĐỘ SỬA CHỮA'
                    : isPendingApproval
                    ? 'TIẾN ĐỘ BIỂU QUYẾT'
                    : isApproved
                    ? 'KẾ HOẠCH SỬA CHỮA'
                    : isPending
                    ? 'YÊU CẦU ĐỀ XUẤT'
                    : isRejectedOrCancelled
                    ? 'KẾT QUẢ ĐỀ XUẤT'
                    : 'THÔNG TIN SỬA CHỮA'}
                </span>
              </div>

              {linkedMaintenance && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background:
                      MAINTENANCE_STATUS_CONFIG[linkedMaintenance.status]?.bg ||
                      'rgba(255,255,255,0.1)',
                    border: `1px solid ${
                      MAINTENANCE_STATUS_CONFIG[linkedMaintenance.status]?.borderColor ||
                      '#666'
                    }`,
                    color:
                      MAINTENANCE_STATUS_CONFIG[linkedMaintenance.status]?.color ||
                      '#fff',
                  }}
                >
                  {MAINTENANCE_STATUS_CONFIG[linkedMaintenance.status]?.labelVi ||
                    linkedMaintenance.status}
                </span>
              )}
            </div>

            {linkedMaintenance ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc' }}>
                  {sanitizedMaintenanceTitle}
                </div>

                <div
                  style={{
                    fontSize: '10.5px',
                    color: '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Mã yêu cầu:</span>
                    <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                      #{linkedMaintenance.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  {linkedMaintenance.status === 'PENDING_APPROVAL' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24' }}>
                      <span>Trạng thái duyệt:</span>
                      <span>Đang biểu quyết cổ phần</span>
                    </div>
                  )}

                  {linkedMaintenance.status === 'APPROVED' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8' }}>
                      <span>Kế hoạch:</span>
                      <span>Đã thông qua biểu quyết — chờ nhân viên xử lý</span>
                    </div>
                  )}

                  {linkedMaintenance.status === 'IN_PROGRESS' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24' }}>
                      <span>Tiến độ:</span>
                      <span>Kỹ thuật viên đang thực hiện sửa chữa</span>
                    </div>
                  )}

                  {(linkedMaintenance.status === 'REJECTED' || linkedMaintenance.status === 'CANCELLED') && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                      <span>Kết quả:</span>
                      <span>{linkedMaintenance.status === 'REJECTED' ? 'Đề xuất đã bị từ chối' : 'Đề xuất đã bị hủy'}</span>
                    </div>
                  )}

                  {linkedMaintenance.scheduledAt && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Lịch dự kiến:</span>
                      <span style={{ color: '#cbd5e1' }}>
                        {formatDateTime(linkedMaintenance.scheduledAt)}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Kỹ thuật viên phụ trách:</span>
                    <span style={{ color: '#cbd5e1' }}>
                      {linkedMaintenance.assignedStaffName || 'Kỹ thuật viên EVShare'}
                    </span>
                  </div>

                  {/* Completion Inspection Result (Section 5) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Kết quả nghiệm thu:</span>
                    <span style={{ color: '#34d399', fontWeight: 750, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} color="#34d399" />
                      <span>ĐẠT TIÊU CHUẨN AN TOÀN (PASSED)</span>
                    </span>
                  </div>

                  {/* Actual Completed Work (Section 5) */}
                  <div style={{ marginTop: '2px' }}>
                    <span style={{ color: '#94a3b8' }}>Công việc thực tế:</span>
                    <div style={{
                      marginTop: '2px',
                      padding: '5px 8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      lineHeight: 1.4,
                    }}>
                      {linkedMaintenance.completionNotes || linkedMaintenance.description || 'Đã sửa chữa và khắc phục linh kiện theo quy trình kỹ thuật.'}
                    </div>
                  </div>

                  {/* Relevant Historical Vote (Section 3 & 5) */}
                  {linkedMaintenance.relatedProposalId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Biểu quyết nhóm:</span>
                      <span style={{ color: '#c084fc', fontWeight: 650 }}>
                        #{linkedMaintenance.relatedProposalId.slice(0, 8).toUpperCase()} — Đã thông qua
                      </span>
                    </div>
                  )}

                  {linkedMaintenance.actualCost !== undefined && linkedMaintenance.actualCost > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Chi phí sửa chữa:</span>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>
                        {linkedMaintenance.actualCost.toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  )}

                  {/* Available Expense Reference (Section 5 & 6) */}
                  {linkedExpense && (
                    <div style={{
                      marginTop: '4px',
                      padding: '8px 10px',
                      background: 'rgba(0, 242, 254, 0.05)',
                      border: '1px solid rgba(0, 242, 254, 0.25)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      fontSize: '10.5px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#00f2fe', fontWeight: 750, textTransform: 'uppercase', fontSize: '10px' }}>
                        <DollarSign size={12} color="#00f2fe" />
                        <span>CHỨNG TỪ TÀI CHÍNH LIÊN KẾT</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Khoản chi:</span>
                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>{linkedExpense.description || linkedExpense.categoryLabel}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Số tiền:</span>
                        <span style={{ color: '#38bdf8', fontWeight: 750 }}>{Number(linkedExpense.amount).toLocaleString('vi-VN')} VND</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Bên chịu trách nhiệm:</span>
                        <span style={{ color: '#34d399', fontWeight: 650 }}>Nhóm đồng sở hữu</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Chính sách phân bổ:</span>
                        <span style={{ color: '#cbd5e1' }}>{linkedExpense.allocationPolicyLabel || 'Theo km sử dụng và tỷ lệ vốn'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Trạng thái chi phí:</span>
                        <span style={{ color: '#fbbf24', fontWeight: 700 }}>{linkedExpense.statusLabel || 'Đã duyệt'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : isResolved ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px dashed rgba(245, 158, 11, 0.35)',
                borderRadius: '8px',
                color: '#fbbf24',
                fontSize: '11px',
              }}>
                <AlertTriangle size={15} color="#fbbf24" style={{ flexShrink: 0 }} />
                <span>Chưa có thông tin liên kết sửa chữa</span>
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                Chưa có đề xuất sửa chữa nào được tạo cho điểm hư hỏng này. Bạn có thể tạo đề xuất mới để kỹ thuật viên xử lý.
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. FOOTER (Sticky at bottom, flex-shrink: 0) (Sections 10 & 11) */}
        {/* ========================================================================= */}
        <div
          style={{
            flexShrink: 0,
            padding: '12px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(10, 18, 36, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          {/* Secondary Action: "QUAY LẠI LỊCH SỬ" / "ĐÓNG" */}
          <button
            type="button"
            onClick={handleClose}
            style={{
              flex: 1,
              maxWidth: '140px',
              padding: '9px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            {isResolved ? 'QUAY LẠI LỊCH SỬ' : 'ĐÓNG'}
          </button>

          {/* Primary Action Button (Section 3: CASE A through CASE H) */}
          {isResolved ? (
            /* CASE G: Verified repair completed */
            <button
              type="button"
              id={`btn-view-repair-history-${damage.id}`}
              onClick={handleNavigateToMaintenance}
              style={{
                flex: 2,
                padding: '9px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <History size={13} color="#ffffff" />
              <span>XEM CHI TIẾT BẢO DƯỠNG</span>
              <ArrowRight size={13} color="#ffffff" />
            </button>
          ) : isInProgress ? (
            /* CASE F: STAFF has actually started work */
            <button
              type="button"
              id={`btn-view-repair-progress-${damage.id}`}
              onClick={handleNavigateToMaintenance}
              style={{
                flex: 2,
                padding: '9px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)',
                border: 'none',
                color: '#041324',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(0, 242, 254, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Wrench size={13} color="#041324" />
              <span>XEM TIẾN ĐỘ SỬA CHỮA</span>
              <ArrowRight size={13} color="#041324" />
            </button>
          ) : isApproved ? (
            /* CASE E: Proposal approved, work not started */
            <button
              type="button"
              id={`btn-view-repair-plan-${damage.id}`}
              onClick={handleNavigateToMaintenance}
              style={{
                flex: 2,
                padding: '9px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                border: 'none',
                color: '#041324',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Calendar size={13} color="#041324" />
              <span>XEM KẾ HOẠCH SỬA CHỮA</span>
              <ArrowRight size={13} color="#041324" />
            </button>
          ) : isPendingApproval ? (
            /* CASE D: Voting is in progress */
            <button
              type="button"
              id={`btn-view-vote-progress-${damage.id}`}
              onClick={handleNavigateToMaintenance}
              style={{
                flex: 2,
                padding: '9px 14px',
                borderRadius: '8px',
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
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <ThumbsUp size={13} color="#ffffff" />
              <span>{isStaff ? 'XEM BIỂU QUYẾT' : 'THAM GIA BIỂU QUYẾT'}</span>
              <ArrowRight size={13} color="#ffffff" />
            </button>
          ) : isPending ? (
            /* CASE C: Proposal submitted to group, awaiting vote creation */
            <>
              <button
                type="button"
                id={`btn-view-proposal-${damage.id}`}
                onClick={handleNavigateToMaintenance}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <FileText size={13} />
                <span>XEM ĐỀ XUẤT</span>
              </button>

              {(!isStaff || user?.role === 'ADMIN') && (
                <button
                  type="button"
                  id={`btn-create-vote-from-damage-${damage.id}`}
                  onClick={() => {
                    if (linkedMaintenance) {
                      createVoteMutation.mutate(linkedMaintenance.id);
                    }
                  }}
                  disabled={createVoteMutation.isPending}
                  style={{
                    flex: 1.6,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    border: 'none',
                    color: '#041324',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Sparkles size={13} color="#041324" />
                  <span>{createVoteMutation.isPending ? 'Đang tạo biểu quyết...' : 'TẠO BIỂU QUYẾT SỬA CHỮA'}</span>
                  <ArrowRight size={13} color="#041324" />
                </button>
              )}
            </>
          ) : isRejectedOrCancelled ? (
            /* CASE H: Proposal rejected or cancelled */
            !isStaff ? (
              <button
                type="button"
                id={`btn-recreate-repair-proposal-${damage.id}`}
                onClick={handleCreateRepairProposal}
                style={{
                  flex: 2,
                  padding: '9px 14px',
                  borderRadius: '8px',
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
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <RotateCcw size={13} color="#ffffff" />
                <span>TẠO LẠI ĐỀ XUẤT SỬA CHỮA</span>
                <ArrowRight size={13} color="#ffffff" />
              </button>
            ) : (
              <button
                type="button"
                id={`btn-staff-view-maintenance-${damage.id}`}
                onClick={handleNavigateToMaintenance}
                style={{
                  flex: 2,
                  padding: '9px 14px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  border: 'none',
                  color: '#041324',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Wrench size={13} color="#041324" />
                <span>XEM QUẢN LÝ BẢO DƯỠNG</span>
              </button>
            )
          ) : (
            /* CASE A: Unresolved damage without active repair request */
            !isStaff ? (
              <button
                type="button"
                id={`btn-create-repair-proposal-${damage.id}`}
                onClick={handleCreateRepairProposal}
                style={{
                  flex: 2,
                  padding: '9px 14px',
                  borderRadius: '8px',
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
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Wrench size={13} />
                <span>TẠO ĐỀ XUẤT SỬA CHỮA</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                id={`btn-staff-view-maintenance-${damage.id}`}
                onClick={handleNavigateToMaintenance}
                style={{
                  flex: 2,
                  padding: '9px 14px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  border: 'none',
                  color: '#041324',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Wrench size={13} color="#041324" />
                <span>XEM QUẢN LÝ BẢO DƯỠNG</span>
              </button>
            )
          )}
        </div>
      </div>
    </>
  );
};
