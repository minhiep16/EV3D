import React from 'react';
import { VehicleResponse } from '../../../types/vehicle';
import { useWorldStore } from '../../../store/worldStore';
import {
  Car,
  Zap,
  Gauge,
  Calendar,
  X,
  ArrowLeft,
  Search,
  CheckCircle,
  FileText,
} from 'lucide-react';

interface CoOwnerVehicleInfoPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

export const CoOwnerVehicleInfoPanel: React.FC<CoOwnerVehicleInfoPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const returnToVehicleOverview = useWorldStore((state) => state.returnToVehicleOverview);
  const setVehicleFeatureMode = useWorldStore((state) => state.setVehicleFeatureMode);

  const displayCode = 'EV01';
  const formattedOdometer = Number(vehicle.odometer ?? 12450).toLocaleString('vi-VN');
  const estimatedRangeKm = Math.round(((vehicle.currentBatteryLevel || 82) / 100) * 450);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        width: '340px',
        maxHeight: '86vh',
        overflowY: 'auto',
        background: 'rgba(8, 14, 24, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid #10b981',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(16, 185, 129, 0.22)',
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
        title="Đóng thông tin xe"
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

      {/* Header Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '10px',
          fontWeight: 700,
          color: '#34d399',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}
      >
        <FileText size={13} />
        HỒ SƠ KỸ THUẬT XE ĐIỆN
      </div>

      <h3
        style={{
          fontSize: '19px',
          fontWeight: 800,
          letterSpacing: '-0.01em',
          margin: '0 0 2px 0',
          color: '#ffffff',
        }}
      >
        {displayCode} — {vehicle.brand} {vehicle.model}
      </h3>

      <div
        style={{
          fontSize: '12px',
          color: '#34d399',
          fontWeight: 600,
          marginBottom: '14px',
        }}
      >
        {vehicle.name}
      </div>

      {/* Battery & Status highlight */}
      <div
        style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Dung lượng khả dụng</span>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={16} />
            {vehicle.currentBatteryLevel}% (~{estimatedRangeKm} km)
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Trạng thái</span>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
            {vehicle.status === 'AVAILABLE' ? 'Sẵn sàng' : vehicle.status}
          </div>
        </div>
      </div>

      {/* Technical Specifications Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '12px',
        }}
      >
        <div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Hãng xe</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc' }}>{vehicle.brand}</div>
        </div>
        <div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Mẫu xe</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc' }}>{vehicle.model}</div>
        </div>
        <div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Biển số xe</div>
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#34d399' }}>{vehicle.licensePlate}</div>
        </div>
        <div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Quãng đường đã chạy</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc' }}>{formattedOdometer} km</div>
        </div>
        <div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Dung lượng pin danh định</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc' }}>{vehicle.batteryCapacity} kWh</div>
        </div>
        <div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Năm sản xuất</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc' }}>{vehicle.year}</div>
        </div>
      </div>

      {/* Health status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: '#34d399',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '10px',
          padding: '10px',
          marginBottom: '16px',
        }}
      >
        <CheckCircle size={15} />
        <span>Hệ thống pin và dẫn động điện trong trạng thái tối ưu.</span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setVehicleFeatureMode('VEHICLE_EXPLORE')}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            border: 'none',
            borderRadius: '10px',
            padding: '10px',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
          }}
        >
          <Search size={14} />
          KHÁM PHÁ CÁC BỘ PHẬN XE (3D)
        </button>

        <button
          type="button"
          onClick={() => returnToVehicleOverview()}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '9px',
            color: '#cbd5e1',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <ArrowLeft size={13} />
          QUAY LẠI TỔNG QUAN XE
        </button>
      </div>
    </div>
  );
};
