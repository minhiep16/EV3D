import React from 'react';
import { VehicleResponse } from '../../../types/vehicle';
import { useWorldStore } from '../../../store/worldStore';
import {
  Calendar,
  Search,
  Wrench,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface CoOwnerQuickActionDockProps {
  vehicle: VehicleResponse;
}

export const CoOwnerQuickActionDock: React.FC<CoOwnerQuickActionDockProps> = ({ vehicle }) => {
  const enterVehicleBookingMode = useWorldStore((state) => state.enterVehicleBookingMode);
  const enterVehicleInspectionMode = useWorldStore((state) => state.enterVehicleInspectionMode);
  const enterVehicleMaintenanceMode = useWorldStore((state) => state.enterVehicleMaintenanceMode);
  const enterVehicleDamageHistoryMode = useWorldStore((state) => state.enterVehicleDamageHistoryMode);
  const enterBatteryXrayMode = useWorldStore((state) => state.enterBatteryXrayMode);

  const isMaintenance = vehicle.status === 'MAINTENANCE';

  return (
    <div
      data-ui-interactive="true"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: 'calc(50% - 110px)',
        transform: 'translateX(-50%)',
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
        gap: '22px',
        background: 'rgba(7, 20, 38, 0.90)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(34, 230, 255, 0.32)',
        borderRadius: '26px',
        padding: '10px 24px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(34, 230, 255, 0.18)',
        pointerEvents: 'auto',
      }}
    >
      {/* 1. ĐẶT LỊCH */}
      <button
        type="button"
        disabled={isMaintenance}
        onClick={() => {
          if (!isMaintenance) enterVehicleBookingMode(vehicle.id);
        }}
        title={isMaintenance ? 'Xe đang bảo dưỡng kỹ thuật' : 'Đặt lịch sử dụng xe'}
        style={dockItemButtonStyle(isMaintenance)}
      >
        <div style={dockIconCircleStyle(false, isMaintenance)}>
          <Calendar size={18} color={isMaintenance ? '#64748b' : '#22e6ff'} />
        </div>
        <span style={dockLabelStyle(isMaintenance)}>ĐẶT LỊCH</span>
      </button>

      {/* 2. KHÁM PHÁ */}
      <button
        type="button"
        onClick={() => enterVehicleInspectionMode(vehicle.id)}
        title="Khám phá chi tiết các bộ phận xe 3D"
        style={dockItemButtonStyle(false)}
      >
        <div style={dockIconCircleStyle(false, false)}>
          <Search size={18} color="#22e6ff" />
        </div>
        <span style={dockLabelStyle(false)}>KHÁM PHÁ</span>
      </button>

      {/* 3. BẢO DƯỠNG */}
      <button
        type="button"
        onClick={() => enterVehicleMaintenanceMode({ vehicleId: vehicle.id })}
        title="Lịch sử bảo dưỡng và phê duyệt đề xuất"
        style={dockItemButtonStyle(false)}
      >
        <div style={dockIconCircleStyle(false, false)}>
          <Wrench size={18} color="#22e6ff" />
        </div>
        <span style={dockLabelStyle(false)}>BẢO DƯỠNG</span>
      </button>

      {/* 4. HƯ HỎNG */}
      <button
        type="button"
        onClick={() => enterVehicleDamageHistoryMode(vehicle.id)}
        title="Lịch sử hư hỏng đã ghi nhận"
        style={dockItemButtonStyle(false)}
      >
        <div style={dockIconCircleStyle(false, false, '#ffb84d')}>
          <AlertTriangle size={18} color="#ffb84d" />
        </div>
        <span style={dockLabelStyle(false)}>HƯ HỎNG</span>
      </button>

      {/* 5. X-RAY PIN */}
      <button
        type="button"
        onClick={() => enterBatteryXrayMode(vehicle.id)}
        title="Xem cấu trúc và tình trạng pin 3D"
        style={dockItemButtonStyle(false)}
      >
        <div style={dockIconCircleStyle(false, false)}>
          <Zap size={18} color="#22e6ff" />
        </div>
        <span style={dockLabelStyle(false)}>X-RAY PIN</span>
      </button>
    </div>
  );
};

function dockItemButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'none',
    border: 'none',
    padding: '4px 6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'all 0.2s ease',
    pointerEvents: 'auto',
  };
}

function dockIconCircleStyle(highlight: boolean, disabled: boolean, customAccent?: string): React.CSSProperties {
  const accentColor = customAccent || '#22e6ff';
  return {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: highlight
      ? 'linear-gradient(135deg, #0284c7 0%, #22e6ff 100%)'
      : disabled
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(34, 230, 255, 0.12)',
    border: highlight
      ? `1.5px solid ${accentColor}`
      : disabled
      ? '1px solid rgba(255, 255, 255, 0.1)'
      : `1.5px solid ${customAccent ? 'rgba(255, 184, 77, 0.4)' : 'rgba(34, 230, 255, 0.35)'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: highlight
      ? '0 0 16px rgba(34, 230, 255, 0.5)'
      : customAccent
      ? '0 0 10px rgba(255, 184, 77, 0.2)'
      : '0 0 10px rgba(34, 230, 255, 0.15)',
    transition: 'all 0.2s ease',
  };
}

function dockLabelStyle(disabled: boolean): React.CSSProperties {
  return {
    fontSize: '11px',
    fontWeight: 700,
    color: disabled ? '#64748b' : '#f3faff',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  };
}
