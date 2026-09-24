import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { VehicleHandoverData, HANDOVER_STATUS_CONFIG } from '../../../types/handover';
import { CoOwnershipGroupResponse } from '../../../types/coOwnership';
import { fetchActiveVehicleHandovers } from '../../../services/handoverApi';
import { fetchVehicleCoOwnership } from '../../../services/coOwnershipApi';
import { fetchVehicles } from '../../../services/vehicleApi';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore, VEHICLE_STATUS_LABELS } from '../../../store/worldStore';
import {
  Car,
  Zap,
  Clock,
  X,
  Eye,
  Activity,
  Shield,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface AdminVehicleMonitorPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

export const AdminVehicleMonitorPanel: React.FC<AdminVehicleMonitorPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = isAuthenticated && !!accessToken;

  const enterVehicleHandoverMode = useWorldStore((state) => state.enterVehicleHandoverMode);

  // TanStack Query: Fetch all vehicles for fleet overview
  const { data: allVehicles = [] } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
    enabled: authReady,
    refetchInterval: 10000,
  });

  // TanStack Query: Fetch active handovers for audit
  const { data: activeHandovers = [] } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeVehicleHandovers', vehicle.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 5000,
  });

  // TanStack Query: Fetch co-ownership group for governance overview
  const { data: coOwnership } = useQuery<CoOwnershipGroupResponse>({
    queryKey: ['coOwnership', vehicle.id],
    queryFn: () => fetchVehicleCoOwnership(vehicle.id),
    enabled: authReady && !!vehicle.id,
    refetchInterval: 15000,
  });

  const displayCode = 'EV01';
  const statusConfig = VEHICLE_STATUS_LABELS[vehicle.status] || {
    label: vehicle.status,
    color: '#a855f7',
  };
  const formattedOdometer = Number(vehicle.odometer ?? 12450).toLocaleString('vi-VN');
  const estimatedRangeKm = Math.round(((vehicle.currentBatteryLevel || 82) / 100) * 450);

  const activeHandover = activeHandovers[0] || null;
  const handoverConfig = activeHandover?.status
    ? HANDOVER_STATUS_CONFIG[activeHandover.status]
    : null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: '340px',
        maxHeight: '86vh',
        overflowY: 'auto',
        background: 'rgba(18, 10, 32, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid #a855f7',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.25)',
        borderRadius: '16px',
        padding: '20px',
        color: '#ffffff',
        fontFamily: 'var(--font-family)',
        position: 'relative',
      }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        title="Đóng bảng quản trị"
        style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
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

      {/* Header Label */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '10px',
          fontWeight: 700,
          color: '#c084fc',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}
      >
        <Car size={13} />
        Bản Sao Số Xe Điện
      </div>

      {/* Mode Identity Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(124, 58, 237, 0.22)',
          border: '1px solid rgba(168, 85, 247, 0.45)',
          boxShadow: '0 0 12px rgba(168, 85, 247, 0.25)',
          borderRadius: '6px',
          padding: '3px 8px',
          fontSize: '9.5px',
          fontWeight: 800,
          letterSpacing: '0.07em',
          color: '#c084fc',
          textTransform: 'uppercase',
          marginBottom: '10px',
          width: 'fit-content',
        }}
      >
        <Eye size={11} color="#c084fc" />
        <span>CHẾ ĐỘ QUẢN TRỊ — ADMIN</span>
      </div>

      <h3
        style={{
          fontSize: '20px',
          fontWeight: 800,
          letterSpacing: '-0.01em',
          margin: '0 0 2px 0',
          color: '#ffffff',
        }}
      >
        {displayCode}
      </h3>

      <div
        style={{
          fontSize: '12px',
          color: '#c084fc',
          fontWeight: 600,
          marginBottom: '14px',
        }}
      >
        Giám Sát & Quản Trị Hệ Thống
      </div>

      {/* ======================================================== */}
      {/* MODULE 1: TỔNG QUAN HỆ THỐNG (Section 20 & 24)          */}
      {/* ======================================================== */}
      <div
        style={{
          background: 'rgba(124, 58, 237, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#c084fc',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          <Layers size={13} color="#c084fc" />
          <span>TỔNG QUAN HỆ THỐNG</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
          <div>
            <span style={{ color: '#94a3b8', fontSize: '10px' }}>ĐỘI XE HOẠT ĐỘNG</span>
            <div style={{ fontWeight: 700, color: '#f8fafc' }}>
              {allVehicles.length || 1} Xe trong garage
            </div>
          </div>
          <div>
            <span style={{ color: '#94a3b8', fontSize: '10px' }}>NHÓM ĐỒNG SỞ HỮU</span>
            <div style={{ fontWeight: 700, color: '#c084fc' }}>
              {coOwnership?.name ? '1 Nhóm hoạt động' : 'Đang tải...'}
            </div>
          </div>
        </div>

        {/* System Warnings / Empty State (Section 24) */}
        <div
          style={{
            marginTop: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '8px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '10.5px',
            color: '#34d399',
          }}
        >
          <CheckCircle size={13} />
          <span>KHÔNG CÓ CẢNH BÁO VẬN HÀNH</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODULE 2: GIÁM SÁT BÀN GIAO (Section 20)                 */}
      {/* ======================================================== */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#c084fc',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <Activity size={13} color="#c084fc" />
            <span>GIÁM SÁT BÀN GIAO</span>
          </div>
          <span
            style={{
              background: 'rgba(168, 85, 247, 0.2)',
              color: '#c084fc',
              fontSize: '9px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            AUDIT TRAIL
          </span>
        </div>

        {activeHandover ? (
          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Người nhận:</span>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>
                {activeHandover.coOwnerName || 'Nguyen Van A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Nhân viên phụ trách:</span>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>
                {activeHandover.staffName || 'EVShare Staff'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Trạng thái quy trình:</span>
              <span style={{ color: handoverConfig?.color || '#c084fc', fontWeight: 700 }}>
                {handoverConfig?.labelVi || activeHandover.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Kiểm tra bộ phận:</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                {activeHandover.inspections?.length ?? 8} / 8 Điểm đã ghi nhận
              </span>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '4px 0' }}>
            Chưa có tiến trình bàn giao nào cần giám sát.
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODULE 3: BẢO MẬT & PHÂN QUYỀN (Section 20)             */}
      {/* ======================================================== */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '10px 12px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Shield size={16} color="#c084fc" />
        <div style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
          <strong style={{ color: '#c084fc' }}>RBAC v2 Policy:</strong> Phân quyền nghiêm ngặt theo vai trò CO_OWNER, STAFF, ADMIN.
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODULE 4: PRIMARY CTA CONTAINER (Section 23)             */}
      {/* ======================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Primary CTA */}
        <button
          type="button"
          onClick={() => enterVehicleHandoverMode()}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
            border: 'none',
            borderRadius: '10px',
            padding: '11px',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 18px rgba(168, 85, 247, 0.35)',
            transition: 'all 0.2s ease',
          }}
        >
          <Eye size={15} />
          GIÁM SÁT BÀN GIAO
        </button>

        {/* Secondary CTA */}
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '8px',
            padding: '8px',
            color: '#c084fc',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Activity size={13} />
          GIÁM SÁT ĐỘI XE
        </button>
      </div>
    </div>
  );
};
