import React from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LogOut,
  X,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useWorldStore } from '../../../store/worldStore';
import { getPartById, PART_STATUS_CONFIG } from '../../../data/vehicleParts';
import { VehiclePartId } from '../../../types/vehiclePart';

const QUICK_INSPECTION_PARTS: Array<{ id: VehiclePartId; label: string }> = [
  { id: 'DOOR_FL', label: 'Cửa trước trái' },
  { id: 'DOOR_FR', label: 'Cửa trước phải' },
  { id: 'DOOR_RL', label: 'Cửa sau trái' },
  { id: 'DOOR_RR', label: 'Cửa sau phải' },
  { id: 'HOOD', label: 'Nắp ca-pô' },
  { id: 'BODY', label: 'Thân vỏ xe' },
  { id: 'WHEEL_FL', label: 'Bánh trước trái' },
  { id: 'WHEEL_FR', label: 'Bánh trước phải' },
  { id: 'CHARGING_PORT', label: 'Cổng sạc' },
  { id: 'BATTERY', label: 'Pin cao áp' },
];

export const CoOwnerVehiclePartPanel: React.FC = () => {
  const selectedVehiclePartId = useWorldStore(
    (state) => state.selectedVehiclePartId
  );
  const selectedVehiclePartCode = useWorldStore(
    (state) => state.selectedVehiclePartCode
  );
  const vehicleInspectionMode = useWorldStore(
    (state) => state.vehicleInspectionMode
  );
  const vehicleDamageMappingMode = useWorldStore(
    (state) => state.vehicleDamageMappingMode
  );
  const selectVehiclePart = useWorldStore((state) => state.selectVehiclePart);
  const clearVehiclePartSelection = useWorldStore(
    (state) => state.clearVehiclePartSelection
  );
  const exitVehicleInspectionMode = useWorldStore(
    (state) => state.exitVehicleInspectionMode
  );
  const enterVehicleDamageMappingMode = useWorldStore(
    (state) => state.enterVehicleDamageMappingMode
  );

  const activePartCode = selectedVehiclePartCode || selectedVehiclePartId;
  const part = getPartById(activePartCode);

  // Authoritative mutually exclusive mode rules:
  // 1. Damage Mapping mode: completely unmounts to prevent duplicate background panel
  // 2. Part Inspection / Exploration mode: MUST BE ACTIVE (entered via "KHÁM PHÁ XE")
  // 3. Must have an active selected part and part definition
  if (vehicleDamageMappingMode || !vehicleInspectionMode || !activePartCode || !part) {
    return null;
  }

  const isInspection = Boolean(vehicleInspectionMode);
  const statusConfig =
    PART_STATUS_CONFIG[part.status] || PART_STATUS_CONFIG.NORMAL;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '88px',
        right: '20px',
        width: 'clamp(320px, 26vw, 390px)',
        height: 'auto',
        maxHeight: 'calc(100dvh - 112px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        zIndex: 20,
        background: 'rgba(8, 14, 26, 0.94)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${isInspection ? 'rgba(0, 242, 254, 0.6)' : 'rgba(0, 242, 254, 0.4)'}`,
        boxShadow: isInspection
          ? '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 36px rgba(0, 242, 254, 0.3)'
          : '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 32px rgba(0, 242, 254, 0.22)',
        borderRadius: '16px',
        color: '#ffffff',
        fontFamily: 'var(--font-family, sans-serif)',
        pointerEvents: 'auto',
        userSelect: 'none',
        animation: 'fadeIn 0.22s ease-out',
      }}
    >
      {/* ========================================================================= */}
      {/* 1. FIXED HEADER (MUTUALLY EXCLUSIVE BY MODE)                              */}
      {/* ========================================================================= */}
      <div
        style={{
          flexShrink: 0,
          padding: '16px 20px 12px 20px',
          position: 'relative',
          borderBottom: isInspection
            ? '1px solid rgba(0, 242, 254, 0.25)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={() => {
            clearVehiclePartSelection();
          }}
          title="Đóng chi tiết bộ phận (Quay lại xe)"
          style={{
            position: 'absolute',
            top: '14px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <X size={15} />
        </button>

        {/* Top Header Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '10px',
            fontWeight: 800,
            color: '#00f2fe',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}
        >
          <Wrench size={13} />
          <span>CHI TIẾT BỘ PHẬN XE</span>
        </div>

        {/* Part Name (Vietnamese) */}
        <h3
          style={{
            fontSize: '19px',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            margin: '0 0 8px 0',
            color: '#f8fafc',
            paddingRight: '32px',
            lineHeight: 1.25,
          }}
        >
          {part.nameVi}
        </h3>

        {/* Category & Status Pill Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '11.5px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Layers size={13} color="#38bdf8" />
            {part.categoryVi}
          </span>

          {/* Status Pill Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '9999px',
              color: isInspection ? '#00f2fe' : statusConfig.color,
              background: isInspection ? 'rgba(0, 242, 254, 0.15)' : statusConfig.bg,
              border: `1px solid ${isInspection ? '#00f2fe55' : `${statusConfig.color}44`}`,
            }}
          >
            {isInspection ? (
              <CheckCircle2 size={12} color="#00f2fe" />
            ) : part.status === 'NORMAL' ? (
              <CheckCircle2 size={12} />
            ) : (
              <AlertTriangle size={12} />
            )}
            <span>{isInspection ? 'Đang kiểm tra 3D' : statusConfig.labelVi}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SCROLLABLE MIDDLE CONTENT (MUTUALLY EXCLUSIVE BY MODE)                 */}
      {/* ========================================================================= */}
      <div
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          padding: '14px 20px',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 242, 254, 0.25) transparent',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Part Description Box */}
          <p
            style={{
              fontSize: '12px',
              color: '#cbd5e1',
              lineHeight: '1.5',
              margin: '0',
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              borderLeft: '3px solid #00f2fe',
            }}
          >
            {part.descriptionVi}
          </p>

          {/* Door Articulation Note if a door is being inspected */}
          {part.id.startsWith('DOOR_') && (
            <div
              style={{
                background: 'rgba(0, 242, 254, 0.10)',
                border: '1px solid rgba(0, 242, 254, 0.35)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '11.5px',
                color: '#e0f2fe',
                lineHeight: '1.45',
              }}
            >
              <span style={{ fontWeight: 700, color: '#00f2fe' }}>Khớp bản lề tự động: </span>
              Cửa xe đang mở 65° hướng ra ngoài theo trục vật lý. Camera đã chuyển sang quan sát mặt ngoài của cửa.
            </div>
          )}

          {/* Part Semantic Identifier */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'rgba(15, 23, 42, 0.65)',
              borderRadius: '8px',
              fontSize: '11.5px',
            }}
          >
            <span style={{ color: '#94a3b8' }}>Mã định danh bộ phận:</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '0.04em',
              }}
            >
              {part.id}
            </span>
          </div>

          {/* Technical Specifications */}
          {part.specs && part.specs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '2px',
                }}
              >
                Thông số kỹ thuật
              </div>
              {part.specs.map((spec, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    padding: '6px 10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '6px',
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>{spec.label}</span>
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{spec.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Inspection Checklist Card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '10px',
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                color: '#38bdf8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '8px',
              }}
            >
              Tiêu chuẩn kiểm tra an toàn kỹ thuật
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {[
                'Tình trạng kết cấu & khung chịu lực',
                'Bề mặt ngoại thất & lớp sơn phủ',
                'Độ khít bản lề & chốt khóa an toàn',
                'Cảm biến áp suất & kết nối tín hiệu',
                'Gioăng cao su & khả năng chống nước IP67',
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    color: '#cbd5e1',
                  }}
                >
                  <CheckCircle2 size={13} color="#34d399" style={{ flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Part Switcher Chips (Available in both modes) */}
        <div style={{ marginTop: '14px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '6px',
            }}
          >
            Chuyển nhanh bộ phận khác
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
            }}
          >
            {QUICK_INSPECTION_PARTS.map((p) => {
              const isActive = part.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectVehiclePart(p.id)}
                  style={{
                    background: isActive
                      ? 'rgba(0, 242, 254, 0.2)'
                      : 'rgba(15, 23, 42, 0.7)',
                    border: isActive
                      ? '1px solid #00f2fe'
                      : '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    color: isActive ? '#00f2fe' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#00f2fe';
                      e.currentTarget.style.color = '#f1f5f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor =
                        'rgba(56, 189, 248, 0.2)';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  <span>{p.label}</span>
                  {isActive && <ChevronRight size={12} color="#00f2fe" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FIXED FOOTER (MUTUALLY EXCLUSIVE ACTIONS BY MODE)                      */}
      {/* ========================================================================= */}
      <div
        style={{
          flexShrink: 0,
          background: 'rgba(8, 14, 26, 0.98)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 20px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Action: Record damage for this inspected part */}
        <button
          type="button"
          onClick={() => {
            enterVehicleDamageMappingMode(activePartCode);
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            padding: '10px 14px',
            borderRadius: '9px',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.28) 100%)',
            color: '#fbbf24',
            fontSize: '11.5px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.2)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.4) 100%)';
            e.currentTarget.style.borderColor = '#fbbf24';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.28) 100%)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)';
          }}
        >
          <AlertTriangle size={14} color="#f59e0b" />
          <span>GHI NHẬN HƯ HỎNG</span>
        </button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
          }}
        >
          {/* Action: Return to whole car view (clears part selection, stays in explore mode) */}
          <button
            type="button"
            onClick={() => clearVehiclePartSelection()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)';
              e.currentTarget.style.borderColor = '#38bdf8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
            }}
          >
            <RotateCcw size={13} />
            <span>QUAY LẠI XE</span>
          </button>

          {/* Action: Exit explore mode back to vehicle overview */}
          <button
            type="button"
            onClick={() => {
              clearVehiclePartSelection();
              exitVehicleInspectionMode();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: 'rgba(148, 163, 184, 0.08)',
              color: '#cbd5e1',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.18)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <LogOut size={13} />
            <span>THOÁT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
