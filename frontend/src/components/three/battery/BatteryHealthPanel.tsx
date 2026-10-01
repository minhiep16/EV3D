import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Zap,
  Battery,
  Shield,
  Activity,
  AlertTriangle,
  RotateCcw,
  Wrench,
  Thermometer,
  Gauge,
  Calendar,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';
import { fetchVehicleBatteryHealth } from '../../../services/batteryApi';
import { VehicleResponse } from '../../../types/vehicle';
import { BatteryHealthResponse } from '../../../types/battery';
import { BATTERY_STATUS_THEMES } from '../../../config/batteryVisualConfig';
import { useWorldStore } from '../../../store/worldStore';
import { useAuthStore } from '../../../store/authStore';
import { resolveVehicleCode } from '../vehicles/vehicleModelConfig';

export interface BatteryHealthPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

export const BatteryHealthPanel: React.FC<BatteryHealthPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const user = useAuthStore((state) => state.user);
  const isOperations = user?.role === 'STAFF' || user?.role === 'ADMIN';

  const enterVehicleMaintenanceMode = useWorldStore(
    (state) => state.enterVehicleMaintenanceMode
  );
  const returnToVehicleOverview = useWorldStore(
    (state) => state.returnToVehicleOverview
  );

  const vehicleCode = resolveVehicleCode(vehicle);

  // Authoritative TanStack Query for technical battery health
  const {
    data: batteryHealth,
    isLoading,
    isError,
    refetch,
  } = useQuery<BatteryHealthResponse | null>({
    queryKey: ['vehicleBatteryHealth', vehicle?.id],
    queryFn: () => fetchVehicleBatteryHealth(vehicle.id),
    enabled: Boolean(vehicle?.id),
    staleTime: 6000,
  });

  const status = batteryHealth?.batteryStatus || 'NORMAL';
  const theme = BATTERY_STATUS_THEMES[status] || BATTERY_STATUS_THEMES.NORMAL;

  const soc = batteryHealth?.stateOfChargePercent ?? vehicle.currentBatteryLevel ?? 0;
  const soh = batteryHealth?.stateOfHealthPercent ?? 95.0;

  const handleCreateMaintenance = () => {
    enterVehicleMaintenanceMode({ preselectedPartCode: 'BATTERY' });
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      returnToVehicleOverview();
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
        width: 'clamp(330px, 26vw, 410px)',
        height: 'auto',
        maxHeight: 'calc(100dvh - 112px)',
        zIndex: 25,
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
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25), rgba(15, 23, 42, 0.9))',
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
              TÌNH TRẠNG PIN 3D
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              {vehicleCode} • {vehicle.name || 'VinFast VF8'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          title="Đóng chế độ X-Ray"
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
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* 2. Loading State */}
      {isLoading && (
        <div
          style={{
            padding: '24px 12px',
            textAlign: 'center',
            color: '#38bdf8',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Activity size={18} className="animate-spin" />
          <span>Đang tải dữ liệu pin...</span>
        </div>
      )}

      {/* 3. Error / Empty State */}
      {!isLoading && (isError || !batteryHealth) && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#fbbf24',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            <AlertTriangle size={15} />
            <span>Chưa có dữ liệu sức khỏe pin.</span>
          </div>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px 0' }}>
            Thông số kỹ thuật của bộ pin đang được đồng bộ hoặc chưa hoàn tất kiểm định ban đầu.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              borderRadius: '6px',
              padding: '5px 12px',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <RefreshCw size={11} />
            Tải lại
          </button>
        </div>
      )}

      {/* 4. Main Technical Content (when data available or synthesized) */}
      {!isLoading && batteryHealth && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Status Overview Card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: `1px solid ${theme.badgeBorder}`,
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                TRẠNG THÁI CAO ÁP
              </span>
              <span
                style={{
                  background: theme.badgeBg,
                  border: `1px solid ${theme.badgeBorder}`,
                  color: theme.accentHex,
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
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
                    backgroundColor: theme.accentHex,
                    boxShadow: `0 0 6px ${theme.accentHex}`,
                  }}
                />
                {theme.labelVi}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
              {theme.descriptionVi}
            </div>
          </div>

          {/* Dual Visual Health Bars: SOC vs SOH */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Bar 1: State of Charge (SOC) */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Battery size={13} color="#00f2fe" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>
                    MỨC PIN HIỆN TẠI (SOC)
                  </span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#00f2fe' }}>
                  {soc}%
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, soc))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0284c7 0%, #00f2fe 100%)',
                    borderRadius: '9999px',
                    boxShadow: '0 0 10px rgba(0, 242, 254, 0.5)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '3px' }}>
                Dung lượng sạc khả dụng hiện tại để vận hành xe
              </div>
            </div>

            {/* Bar 2: State of Health (SOH) */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Shield size={13} color="#10b981" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>
                    SỨC KHỎE PIN DÀI HẠN (SOH)
                  </span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#10b981' }}>
                  {soh}%
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, soh))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                    borderRadius: '9999px',
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '3px' }}>
                Độ bảo toàn dung lượng tế bào pin so với tiêu chuẩn xuất xưởng
              </div>
            </div>
          </div>

          {/* Technical Telemetry Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            {/* Metric: Estimated Range */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.18)',
                borderRadius: '10px',
                padding: '9px 10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '10px', fontWeight: 700 }}>
                <Gauge size={12} color="#38bdf8" />
                <span>TẦM HOẠT ĐỘNG</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                ~{batteryHealth.estimatedRangeKm ?? 369} km
              </div>
            </div>

            {/* Metric: Voltage */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.18)',
                borderRadius: '10px',
                padding: '9px 10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '10px', fontWeight: 700 }}>
                <Zap size={12} color="#f59e0b" />
                <span>ĐIỆN ÁP CAO ÁP</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {batteryHealth.voltage ?? 400} V
              </div>
            </div>

            {/* Metric: Temperature */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.18)',
                borderRadius: '10px',
                padding: '9px 10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '10px', fontWeight: 700 }}>
                <Thermometer size={12} color="#10b981" />
                <span>NHIỆT ĐỘ CELL</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {batteryHealth.temperatureCelsius ?? 27} °C
              </div>
            </div>

            {/* Metric: Charge Cycles */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.18)',
                borderRadius: '10px',
                padding: '9px 10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '10px', fontWeight: 700 }}>
                <Activity size={12} color="#a855f7" />
                <span>CHU KỲ SẠC</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {batteryHealth.cycleCount ?? 318} chu kỳ
              </div>
            </div>

            {/* Metric: Pack Capacity */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.18)',
                borderRadius: '10px',
                padding: '9px 10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '10px', fontWeight: 700 }}>
                <Battery size={12} color="#38bdf8" />
                <span>DUNG LƯỢNG TỔNG</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {batteryHealth.capacityKwh ?? vehicle.grossBatteryCapacityKwh ?? vehicle.batteryCapacity ?? (vehicleCode === 'EV02' ? 65 : 69)} kWh
              </div>
            </div>

            {/* Metric: Usable Capacity */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.18)',
                borderRadius: '10px',
                padding: '9px 10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '10px', fontWeight: 700 }}>
                <CheckCircle2 size={12} color="#10b981" />
                <span>KHẢ DỤNG</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {batteryHealth.usableCapacityKwh ?? vehicle.usableBatteryCapacityKwh ?? (vehicleCode === 'EV02' ? 60 : 65)} kWh
              </div>
            </div>
          </div>

          {/* Last Inspection Date Stamp */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: '8px',
              fontSize: '10px',
              color: '#94a3b8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={11} />
              <span>Lần kiểm tra gần nhất:</span>
            </div>
            <span style={{ color: '#e2e8f0', fontWeight: 700 }}>
              {batteryHealth.lastInspectedAt
                ? new Date(batteryHealth.lastInspectedAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : 'Định kỳ hệ thống'}
            </span>
          </div>

          {/* Service Advisory / Maintenance Action */}
          {status === 'SERVICE_REQUIRED' && (
            <div
              style={{
                background: 'rgba(249, 115, 22, 0.12)',
                border: '1px solid rgba(249, 115, 22, 0.45)',
                borderRadius: '10px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fb923c', fontSize: '11px', fontWeight: 800 }}>
                <AlertTriangle size={14} />
                <span>Pin cần được kiểm tra/bảo dưỡng.</span>
              </div>
              <div style={{ fontSize: '10px', color: '#cbd5e1' }}>
                Hệ thống BMS phát hiện thông số suy hao hoặc điện áp cần can thiệp kỹ thuật bởi đội ngũ vận hành.
              </div>

              {isOperations && (
                <button
                  type="button"
                  onClick={handleCreateMaintenance}
                  style={{
                    background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
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
                    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                  }}
                >
                  <Wrench size={13} />
                  <span>TẠO YÊU CẦU BẢO DƯỠNG PIN</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Footer Navigation Control */}
      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(56, 189, 248, 0.15)' }}>
        <button
          type="button"
          onClick={handleClose}
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #0284c7 0%, #06b6d4 100%)',
            color: '#08101c',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0, 242, 254, 0.3)',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 242, 254, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 242, 254, 0.3)';
          }}
        >
          <RotateCcw size={14} />
          <span>QUAY LẠI XE</span>
        </button>
      </div>
    </div>
  );
};
