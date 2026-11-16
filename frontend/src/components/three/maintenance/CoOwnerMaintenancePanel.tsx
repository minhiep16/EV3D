import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wrench,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  User,
  History,
  Vote,
} from 'lucide-react';
import { VehicleResponse } from '../../../types/vehicle';
import {
  MaintenanceResponse,
  MaintenanceStatus,
  MaintenanceType,
  MaintenancePriority,
  MAINTENANCE_STATUS_CONFIG,
  MAINTENANCE_TYPE_CONFIG,
  MAINTENANCE_PRIORITY_CONFIG,
} from '../../../types/maintenance';
import {
  fetchVehicleMaintenance,
} from '../../../services/maintenanceApi';
import { fetchVehicleDamages } from '../../../services/damageApi';
import { DamageRecordResponse, DAMAGE_TYPE_LABELS, DAMAGE_SEVERITY_CONFIG, DAMAGE_STATUS_CONFIG } from '../../../types/damage';
import { useWorldStore } from '../../../store/worldStore';
import { getPartById } from '../../../data/vehicleParts';

interface CoOwnerMaintenancePanelProps {
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

/**
 * Reusable visual timeline for repair and maintenance progression.
 * Stages: ĐỀ XUẤT ĐÃ GỬI -> CHỜ TẠO BIỂU QUYẾT -> ĐANG BIỂU QUYẾT -> ĐÃ PHÊ DUYỆT -> ĐÃ LÊN LỊCH -> ĐANG SỬA CHỮA -> HOÀN TẤT
 */
interface RepairTimelineProps {
  status: MaintenanceStatus;
}

const RepairTimeline: React.FC<RepairTimelineProps> = ({ status }) => {
  const steps = [
    { key: 'SUBMITTED', label: 'Đề xuất đã gửi' },
    { key: 'PENDING', label: 'Chờ tạo BQ' },
    { key: 'PENDING_APPROVAL', label: 'Đang biểu quyết' },
    { key: 'APPROVED', label: 'Đã phê duyệt' },
    { key: 'SCHEDULED', label: 'Đã lên lịch' },
    { key: 'IN_PROGRESS', label: 'Đang sửa chữa' },
    { key: 'COMPLETED', label: 'Hoàn tất' },
  ];

  const getStepIndex = (st: MaintenanceStatus) => {
    switch (st) {
      case 'PENDING':
        return 1;
      case 'PENDING_APPROVAL':
        return 2;
      case 'APPROVED':
        return 3;
      case 'SCHEDULED':
        return 4;
      case 'IN_PROGRESS':
        return 5;
      case 'COMPLETED':
        return 6;
      case 'REJECTED':
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  };

  const currentIdx = getStepIndex(status);

  return (
    <div
      style={{
        marginTop: '6px',
        marginBottom: '4px',
        background: 'rgba(0, 0, 0, 0.25)',
        padding: '8px 10px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div
        style={{
          fontSize: '9.5px',
          color: '#94a3b8',
          fontWeight: 700,
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Clock size={11} color="#38bdf8" />
        <span>TIẾN ĐỘ THỰC HIỆN:</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        {steps.map((s, idx) => {
          const isDone = currentIdx > idx;
          const isCurrent = currentIdx === idx;
          const isFailed = currentIdx === -1 && (idx === 2 || idx === 3);

          return (
            <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: isDone ? '#10b981' : isCurrent ? '#f59e0b' : isFailed ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
                  border: isCurrent ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  color: '#ffffff',
                  boxShadow: isCurrent ? '0 0 8px rgba(245, 158, 11, 0.6)' : 'none',
                }}
              >
                {isDone ? '✓' : isCurrent ? '•' : ''}
              </div>
              <span
                style={{
                  fontSize: '8px',
                  color: isDone ? '#34d399' : isCurrent ? '#fbbf24' : '#64748b',
                  fontWeight: isCurrent || isDone ? 700 : 500,
                  marginTop: '3px',
                  textAlign: 'center',
                  lineHeight: 1.1,
                  maxWidth: '44px',
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CoOwnerMaintenancePanel: React.FC<CoOwnerMaintenancePanelProps> = ({
  vehicle,
  onClose,
}) => {
  const returnToGarageOverview = useWorldStore((state) => state.returnToGarageOverview);
  const openGaragePanel = useWorldStore((state) => state.openGaragePanel);

  // Exactly three tabs: TỔNG QUAN | ĐANG LÀM | LỊCH SỬ
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'IN_PROGRESS' | 'HISTORY'>('OVERVIEW');

  // Authoritative TanStack Query: Fetch maintenance records for vehicle
  const vehicleId = vehicle?.id || 'EV01';
  const {
    data: maintenanceList = [],
    isLoading,
    isError,
    refetch: refetchMaintenance,
  } = useQuery<MaintenanceResponse[]>({
    queryKey: ['vehicleMaintenance', vehicleId],
    queryFn: () => (vehicle?.id ? fetchVehicleMaintenance(vehicle.id) : Promise.resolve([])),
    enabled: !!vehicle?.id,
    staleTime: 4000,
  });

  // Fetch Authoritative Vehicle Damage Records for linking
  const { data: vehicleDamages = [] } = useQuery<DamageRecordResponse[]>({
    queryKey: ['vehicleDamages', vehicleId],
    queryFn: () => (vehicle?.id ? fetchVehicleDamages(vehicle.id) : Promise.resolve([])),
    enabled: !!vehicle?.id,
    staleTime: 5000,
  });

  // Requirement: unresolved damages for dashboard counter (OPEN and UNDER_MAINTENANCE)
  const unresolvedDamages = useMemo(() => {
    return vehicleDamages.filter((d) => d.status !== 'RESOLVED');
  }, [vehicleDamages]);

  const preselectedDamageId = useWorldStore(
    (state) => state.maintenanceDraftPreselectedDamageId
  );
  const selectedMaintenanceId = useWorldStore(
    (state) => state.selectedMaintenanceId
  );

  // Auto-switch tab or redirect to Central Voting if maintenance request is selected
  useEffect(() => {
    if (selectedMaintenanceId && maintenanceList.length > 0) {
      const target = maintenanceList.find((m) => m.id === selectedMaintenanceId);
      if (target) {
        if (target.status === 'PENDING_APPROVAL' || target.status === 'PENDING') {
          if (target.relatedProposalId) {
            openGaragePanel('VOTING', { vehicleId: vehicle.id, proposalId: target.relatedProposalId });
          } else {
            setActiveTab('OVERVIEW');
          }
        } else if (target.status === 'COMPLETED' || target.status === 'REJECTED' || target.status === 'CANCELLED') {
          setActiveTab('HISTORY');
        } else {
          setActiveTab('IN_PROGRESS');
        }
      }
    }
  }, [selectedMaintenanceId, maintenanceList, openGaragePanel, vehicle.id]);

  // When a damage is preselected, route to Central Voting for proposal creation
  useEffect(() => {
    if (preselectedDamageId) {
      openGaragePanel('VOTING', { vehicleId: vehicle.id });
    }
  }, [preselectedDamageId, vehicle.id, openGaragePanel]);

  const activeWorkList = useMemo(() => {
    return maintenanceList.filter(
      (m) => m.status === 'IN_PROGRESS' || m.status === 'SCHEDULED' || m.status === 'APPROVED'
    );
  }, [maintenanceList]);

  const activeMaintenance = useMemo(() => {
    return (
      maintenanceList.find((m) => m.status === 'IN_PROGRESS') ||
      maintenanceList.find((m) => m.status === 'SCHEDULED') ||
      null
    );
  }, [maintenanceList]);

  const completedHistory = useMemo(() => {
    return maintenanceList
      .filter((m) => m.status === 'COMPLETED' || m.status === 'REJECTED' || m.status === 'CANCELLED')
      .sort((a, b) => new Date(b.completedAt || b.updatedAt || 0).getTime() - new Date(a.completedAt || a.updatedAt || 0).getTime());
  }, [maintenanceList]);

  // Periodic Maintenance Integration metrics
  const latestCompleted = useMemo(() => {
    return maintenanceList
      .filter((m) => m.status === 'COMPLETED')
      .sort((a, b) => new Date(b.completedAt || b.updatedAt || 0).getTime() - new Date(a.completedAt || a.updatedAt || 0).getTime())[0] || null;
  }, [maintenanceList]);

  const nextScheduled = useMemo(() => {
    return maintenanceList.find((m) => m.status === 'SCHEDULED' && m.scheduledAt) || null;
  }, [maintenanceList]);

  const isVehicleUnderMaintenance =
    vehicle?.status === 'MAINTENANCE' || activeMaintenance?.status === 'IN_PROGRESS';

  // =========================================================================
  // LEFT-MOUSE DRAG TO SCROLL (Phase 24 Maintenance Panel Interaction)
  // =========================================================================
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startScrollTopRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const hasDraggedRef = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const isInteractiveElement = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    return !!target.closest(
      'button, input, textarea, select, option, a, label, [role="button"], [contenteditable="true"]'
    );
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary left mouse button
    if (e.pointerType !== 'mouse' || e.button !== 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // Preserve native scrollbar dragging: if clicked within scrollbar width on right edge, ignore
    const rect = container.getBoundingClientRect();
    if (e.clientX >= rect.left + container.clientWidth) return;

    // Ignore clicks starting on interactive elements (inputs, buttons, select, links, labels)
    if (isInteractiveElement(e.target)) return;

    // Stop propagation to isolate panel interaction from Garage 3D OrbitControls
    e.stopPropagation();

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    hasDraggedRef.current = false;
    startYRef.current = e.clientY;
    startScrollTopRef.current = container.scrollTop;
    activePointerIdRef.current = e.pointerId;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    e.stopPropagation();

    const deltaY = e.clientY - startYRef.current;

    // Threshold of 5px before initiating drag-to-scroll mode
    if (!isDraggingRef.current) {
      if (Math.abs(deltaY) > 5) {
        isDraggingRef.current = true;
        hasDraggedRef.current = true;
        setIsDraggingState(true);
        try {
          container.setPointerCapture(e.pointerId);
        } catch {
          // Ignore if pointer capture is not available
        }
      }
    }

    if (isDraggingRef.current) {
      // Natural drag to scroll: moving cursor up (deltaY < 0) scrolls down (increases scrollTop)
      container.scrollTop = startScrollTopRef.current - deltaY;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    e.stopPropagation();

    const container = scrollContainerRef.current;
    if (container && activePointerIdRef.current !== null) {
      try {
        if (container.hasPointerCapture(activePointerIdRef.current)) {
          container.releasePointerCapture(activePointerIdRef.current);
        }
      } catch {
        // Ignore
      }
    }

    isPointerDownRef.current = false;
    activePointerIdRef.current = null;
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDraggingState(false);
    }

    // Delay reset so click capture can intercept any accidental click event
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    const container = scrollContainerRef.current;
    if (container && activePointerIdRef.current !== null) {
      try {
        if (container.hasPointerCapture(activePointerIdRef.current)) {
          container.releasePointerCapture(activePointerIdRef.current);
        }
      } catch {
        // Ignore
      }
    }

    isPointerDownRef.current = false;
    isDraggingRef.current = false;
    setIsDraggingState(false);
    activePointerIdRef.current = null;
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    // Suppress click event if a drag motion occurred
    if (hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
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
        top: '76px',
        right: '20px',
        bottom: '20px',
        width: 'clamp(440px, 28vw, 495px)',
        maxWidth: 'min(495px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 96px)',
        zIndex: 40,
        background: 'rgba(7, 20, 38, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(0, 242, 254, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(0, 242, 254, 0.16)',
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
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              padding: '0',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Quay lại xe"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '0.01em',
                lineHeight: 1.2,
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Wrench size={15} color="#34d399" />
              <span>QUẢN LÝ BẢO DƯỠNG XE</span>
            </div>
            <div style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 500, marginTop: '1px' }}>
              {vehicle?.licensePlate || vehicle?.plateNumber || vehicle?.name || 'EV01'} • Quy trình kỹ thuật & Chi phí
            </div>
          </div>
        </div>

        <div
          style={{
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '4px',
            padding: '0 8px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#34d399',
            letterSpacing: '0.04em',
          }}
        >
          CO-OWNER
        </div>
      </div>

      {/* 2. THREE-TAB NAVIGATION BAR */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          padding: '4px 8px',
          background: 'rgba(5, 10, 18, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          id="tab-maintenance-overview"
          onClick={() => setActiveTab('OVERVIEW')}
          style={{
            height: '36px',
            padding: '0 4px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: activeTab === 'OVERVIEW' ? 700 : 600,
            background: activeTab === 'OVERVIEW' ? 'rgba(34, 230, 255, 0.20)' : 'rgba(255, 255, 255, 0.04)',
            border: activeTab === 'OVERVIEW' ? '1.5px solid #22e6ff' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeTab === 'OVERVIEW' ? '#22e6ff' : '#94a3b8',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'OVERVIEW' ? '0 0 10px rgba(34, 230, 255, 0.3)' : 'none',
          }}
        >
          TỔNG QUAN
        </button>

        <button
          type="button"
          id="tab-maintenance-in-progress"
          onClick={() => setActiveTab('IN_PROGRESS')}
          style={{
            height: '36px',
            padding: '0 4px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: activeTab === 'IN_PROGRESS' ? 700 : 600,
            background: activeTab === 'IN_PROGRESS' ? 'rgba(16, 185, 129, 0.20)' : 'rgba(255, 255, 255, 0.04)',
            border: activeTab === 'IN_PROGRESS' ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeTab === 'IN_PROGRESS' ? '#34d399' : '#94a3b8',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'IN_PROGRESS' ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none',
          }}
        >
          ĐANG LÀM {activeWorkList.length > 0 ? `(${activeWorkList.length})` : ''}
        </button>

        <button
          type="button"
          id="tab-maintenance-history"
          onClick={() => setActiveTab('HISTORY')}
          style={{
            height: '36px',
            padding: '0 4px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: activeTab === 'HISTORY' ? 700 : 600,
            background: activeTab === 'HISTORY' ? 'rgba(168, 85, 247, 0.20)' : 'rgba(255, 255, 255, 0.04)',
            border: activeTab === 'HISTORY' ? '1.5px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeTab === 'HISTORY' ? '#c084fc' : '#94a3b8',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'HISTORY' ? '0 0 10px rgba(168, 85, 247, 0.3)' : 'none',
          }}
        >
          LỊCH SỬ {completedHistory.length > 0 ? `(${completedHistory.length})` : ''}
        </button>
      </div>

      {/* 3. SCROLLABLE TAB CONTENT BODY */}
      <div
        ref={scrollContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handlePointerCancel}
        onClickCapture={handleClickCapture}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          cursor: isDraggingState ? 'grabbing' : 'grab',
          userSelect: isDraggingState ? 'none' : 'auto',
        }}
      >
        {/* ========================================================================= */}
        {/* TAB 1: TỔNG QUAN (Section 27)                                             */}
        {/* ========================================================================= */}
        {activeTab === 'OVERVIEW' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Status Card: Sẵn sàng vận hành vs Đang bảo dưỡng */}
            <div
              style={{
                background: isVehicleUnderMaintenance
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.12) 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                border: `1.5px solid ${isVehicleUnderMaintenance ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.4)'}`,
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {isVehicleUnderMaintenance ? (
                <Wrench size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
              ) : (
                <ShieldCheck size={24} color="#10b981" style={{ flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: isVehicleUnderMaintenance ? '#fbbf24' : '#34d399' }}>
                  {isVehicleUnderMaintenance ? 'PHƯƠNG TIỆN ĐANG ĐƯỢC BẢO DƯỠNG' : 'PHƯƠNG TIỆN SẴN SÀNG VẬN HÀNH'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.35 }}>
                  {isVehicleUnderMaintenance
                    ? 'Chức năng đặt lịch tạm thời bị khóa cho đến khi kỹ thuật viên nghiệm thu hoàn tất.'
                    : 'Hệ thống vận hành an toàn. Không có lệnh bảo dưỡng khẩn cấp đang diễn ra.'}
                </div>
              </div>
            </div>

            {/* Periodic Maintenance Integration Block (Section 4) */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(34, 230, 255, 0.2)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} color="#22e6ff" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#22e6ff', letterSpacing: '0.04em' }}>
                    CHỈ SỐ BẢO DƯỠNG ĐỊNH KỲ
                  </span>
                </div>
                <span style={{ fontSize: '9.5px', color: '#94a3b8', fontFamily: 'monospace' }}>
                  CHU KỲ 10,000 KM
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '7px 9px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>Lần bảo dưỡng gần nhất:</span>
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                    {latestCompleted?.completedAt ? formatDateTime(latestCompleted.completedAt) : 'CHƯA CÓ DỮ LIỆU'}
                  </span>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '7px 9px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>Odo hiện tại:</span>
                  <span style={{ fontWeight: 800, color: '#22e6ff', fontFamily: 'monospace' }}>
                    {vehicle?.odometer ? `${Number(vehicle.odometer).toLocaleString('vi-VN')} km` : 'CHƯA CÓ DỮ LIỆU'}
                  </span>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '7px 9px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>Dự kiến lần tới:</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                    {nextScheduled?.scheduledAt
                      ? formatDateTime(nextScheduled.scheduledAt)
                      : vehicle?.odometer
                      ? `${(Math.floor(Number(vehicle.odometer) / 10000) + 1) * 10000} km`
                      : 'CHƯA CÓ DỮ LIỆU'}
                  </span>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '7px 9px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>Trạng thái bảo dưỡng:</span>
                  <span style={{ fontWeight: 700, color: isVehicleUnderMaintenance ? '#f59e0b' : '#10b981' }}>
                    {isVehicleUnderMaintenance ? 'ĐANG BẢO DƯỠNG' : 'BÌNH THƯỜNG'}
                  </span>
                </div>
              </div>
            </div>

            {/* Open Defects and Safety Warnings */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={13} color="#f59e0b" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em' }}>
                    HƯ HỎNG CHƯA XỬ LÝ
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: unresolvedDamages.length > 0 ? '#fbbf24' : '#10b981', fontWeight: 700 }}>
                  {unresolvedDamages.length} điểm ghi nhận
                </span>
              </div>

              {unresolvedDamages.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                  Không có hư hỏng nào chưa xử lý.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {unresolvedDamages.map((dmg) => {
                    const partName = getPartById(dmg.vehiclePartCode)?.nameVi || dmg.vehiclePartCode;
                    const typeLabel = (DAMAGE_TYPE_LABELS as Record<string, string>)[dmg.damageType] || dmg.damageType;
                    const sevCfg = DAMAGE_SEVERITY_CONFIG[dmg.severity];
                    const statCfg = DAMAGE_STATUS_CONFIG[dmg.status];
                    const linkedProposal = maintenanceList.find(
                      (m) => m.damageRecordIds?.includes(dmg.id) || m.id === dmg.resolvedByMaintenanceRequestId
                    );

                    return (
                      <div
                        key={dmg.id}
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '9px 11px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                            {partName}
                          </span>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: '#e2e8f0',
                              }}
                            >
                              {typeLabel}
                            </span>
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: sevCfg?.bg || 'rgba(245, 158, 11, 0.2)',
                                color: sevCfg?.color || '#fbbf24',
                                border: `1px solid ${sevCfg?.borderColor || '#f59e0b'}`,
                              }}
                            >
                              {sevCfg?.labelVi || dmg.severity}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                          <span style={{ color: '#94a3b8' }}>
                            Ngày ghi nhận: <strong style={{ color: '#cbd5e1' }}>{formatDateTime(dmg.createdAt)}</strong>
                          </span>
                          <span
                            style={{
                              fontWeight: 700,
                              color: statCfg?.color || '#f59e0b',
                            }}
                          >
                            {statCfg?.labelVi || dmg.status}
                          </span>
                        </div>

                        {/* Linked Proposal Info */}
                        {linkedProposal ? (
                          <div
                            style={{
                              marginTop: '2px',
                              padding: '4px 8px',
                              background: 'rgba(56, 189, 248, 0.08)',
                              borderRadius: '4px',
                              border: '1px solid rgba(56, 189, 248, 0.2)',
                              fontSize: '10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                              🔗 Đề xuất: {linkedProposal.title}
                            </span>
                            <span style={{ color: '#94a3b8' }}>
                              ({MAINTENANCE_STATUS_CONFIG[linkedProposal.status]?.labelVi || linkedProposal.status})
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '9.5px', color: '#64748b', fontStyle: 'italic' }}>
                            Chưa có đề xuất sửa chữa liên kết
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Central Voting Proposal Navigation Link */}
            <button
              type="button"
              id="btn-goto-voting-proposal"
              onClick={() => {
                openGaragePanel('VOTING', { vehicleId: vehicle.id });
              }}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                height: '38px',
                padding: '0 16px',
                color: '#38bdf8',
                fontSize: '12.5px',
                fontWeight: 700,
                letterSpacing: '0.01em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(56, 189, 248, 0.15)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)';
                e.currentTarget.style.borderColor = '#38bdf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
              }}
            >
              <Vote size={15} />
              <span>TẠO ĐỀ XUẤT TRONG HỆ THỐNG BIỂU QUYẾT</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ĐANG THỰC HIỆN                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'IN_PROGRESS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wrench size={13} color="#34d399" />
              <span>CÔNG VIỆC BẢO DƯỠNG ĐANG TIẾN HÀNH ({activeWorkList.length})</span>
            </div>

            {activeWorkList.length === 0 ? (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '28px 16px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldCheck size={24} color="#10b981" />
                <div style={{ color: '#f8fafc', fontWeight: 700 }}>Không có công việc bảo dưỡng nào đang tiến hành</div>
                <div style={{ color: '#64748b', maxWidth: '300px', lineHeight: 1.4 }}>
                  Khi một đề xuất được biểu quyết thông qua và kỹ thuật viên tiếp nhận, tiến độ sẽ hiển thị tại đây.
                </div>
              </div>
            ) : (
              activeWorkList.map((item) => {
                const typeCfg = MAINTENANCE_TYPE_CONFIG[item.maintenanceType];
                const statusCfg = MAINTENANCE_STATUS_CONFIG[item.status];
                const isItemInProgress = item.status === 'IN_PROGRESS';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: isItemInProgress
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: `1.5px solid ${isItemInProgress ? 'rgba(245, 158, 11, 0.45)' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: typeCfg?.bg || 'rgba(255,255,255,0.08)',
                          color: typeCfg?.color || '#ffffff',
                        }}
                      >
                        {typeCfg?.labelVi || item.maintenanceType}
                      </span>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '999px',
                          background: statusCfg?.bg || 'rgba(255,255,255,0.1)',
                          color: statusCfg?.color || '#ffffff',
                          border: `1px solid ${statusCfg?.border || '#475569'}`,
                        }}
                      >
                        {statusCfg?.labelVi || item.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                      {item.title}
                    </div>

                    {item.description && (
                      <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                        {item.description}
                      </div>
                    )}

                    {/* Stepped Progress Timeline */}
                    <RepairTimeline status={item.status} />

                    {/* Approved Budget */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', background: 'rgba(0, 0, 0, 0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>Ngân sách được duyệt:</span>
                      <span style={{ fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>
                        {(item.approvedBudget ?? item.estimatedCost) ? `${Number(item.approvedBudget ?? item.estimatedCost).toLocaleString('vi-VN')} VND` : 'Chưa định mức'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span>Kỹ thuật viên: <strong style={{ color: '#f8fafc' }}>{item.assignedStaffName || 'Đang phân công'}</strong></span>
                      {item.scheduledAt && <span>Lên lịch: {formatDateTime(item.scheduledAt)}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LỊCH SỬ (Section 30)                                               */}
        {/* ========================================================================= */}
        {activeTab === 'HISTORY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={13} color="#c084fc" />
              <span>LỊCH SỬ BẢO DƯỠNG ĐÃ KẾT THÚC ({completedHistory.length})</span>
            </div>

            {completedHistory.length === 0 ? (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '28px 16px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '11px',
                }}
              >
                Chưa có lịch sử bảo dưỡng nào kết thúc trong nhóm này.
              </div>
            ) : (
              completedHistory.map((item) => {
                const typeCfg = MAINTENANCE_TYPE_CONFIG[item.maintenanceType];
                const isCompleted = item.status === 'COMPLETED';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: '10px',
                      padding: '11px 13px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: typeCfg?.color || '#34d399',
                          background: typeCfg?.bg || 'transparent',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {typeCfg?.labelVi || item.maintenanceType}
                      </span>

                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: isCompleted ? '#34d399' : '#f87171',
                        }}
                      >
                        {isCompleted ? 'HOÀN TẤT THÀNH CÔNG' : 'BỊ TỪ CHỐI / ĐÃ HỦY'}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                      {item.title}
                    </div>

                    {item.description && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.35 }}>
                        {item.description}
                      </div>
                    )}

                    {item.completionNote && (
                      <div
                        style={{
                          marginTop: '3px',
                          padding: '5px 8px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '6px',
                          fontSize: '10.5px',
                          color: '#a7f3d0',
                          fontStyle: 'italic',
                        }}
                      >
                        {item.completionNote}
                      </div>
                    )}

                    {/* Linked damages resolved */}
                    {item.damageRecords && item.damageRecords.length > 0 && (
                      <div
                        style={{
                          marginTop: '3px',
                          padding: '4px 6px',
                          background: 'rgba(16, 185, 129, 0.08)',
                          borderRadius: '6px',
                          fontSize: '10px',
                          color: '#34d399',
                        }}
                      >
                        <span>✓ Hư hỏng đã xử lý: </span>
                        {item.damageRecords.map((d) => getPartById(d.vehiclePartCode)?.nameVi || d.vehiclePartCode).join(', ')}
                      </div>
                    )}

                    {/* Financial Summary: Approved Budget vs Actual Cost */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '6px',
                        fontSize: '10.5px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        marginTop: '2px',
                      }}
                    >
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '9.5px' }}>Dự toán duyệt:</span>
                        <span style={{ fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>
                          {(item.approvedBudget ?? item.estimatedCost) ? `${Number(item.approvedBudget ?? item.estimatedCost).toLocaleString('vi-VN')} VND` : '--'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '9.5px' }}>Chi phí thực tế:</span>
                        <span style={{ fontWeight: 700, color: item.actualCost ? '#34d399' : '#94a3b8', fontFamily: 'monospace' }}>
                          {item.actualCost ? `${Number(item.actualCost).toLocaleString('vi-VN')} VND` : 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>

                    {/* Voting Proposal Reference */}
                    {item.relatedProposalId && (
                      <div style={{ fontSize: '10px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                        <span>Đề xuất biểu quyết: </span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{item.relatedProposalId}</span>
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        color: '#64748b',
                        marginTop: '2px',
                        paddingTop: '4px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <span>Kỹ thuật viên: {item.assignedStaffName || item.createdByName || 'STAFF'}</span>
                      <span>Hoàn tất: {formatDateTime(item.completedAt || item.updatedAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 4. FOOTER ACTIONS */}
      <div
        style={{
          padding: '6px 12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.4)',
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
            height: '38px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '6px',
            padding: '0 12px',
            color: '#34d399',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={13} />
          QUAY LẠI XE
        </button>

        <button
          type="button"
          onClick={returnToGarageOverview}
          style={{
            height: '38px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            padding: '0 12px',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          TOÀN CẢNH GARAGE
        </button>
      </div>
    </div>
  );
};
