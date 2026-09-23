import React from 'react';
import { Html } from '@react-three/drei';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LogOut,
  X,
  Layers,
  Info,
} from 'lucide-react';
import { VehiclePartConfig } from '../../../types/vehiclePart';
import { PART_STATUS_CONFIG } from '../../../data/vehicleParts';
import { useWorldStore } from '../../../store/worldStore';

interface SpatialVehiclePartPanelProps {
  part: VehiclePartConfig;
}

export const SpatialVehiclePartPanel: React.FC<SpatialVehiclePartPanelProps> = ({
  part,
}) => {
  const clearVehiclePartSelection = useWorldStore(
    (state) => state.clearVehiclePartSelection
  );
  const exitVehicleInspectionMode = useWorldStore(
    (state) => state.exitVehicleInspectionMode
  );

  const statusConfig =
    PART_STATUS_CONFIG[part.status] || PART_STATUS_CONFIG.NORMAL;

  return (
    <Html
      position={part.panelPosition}
      center
      distanceFactor={8.5}
      style={{ pointerEvents: 'auto', userSelect: 'none' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '330px',
          background: 'rgba(8, 12, 22, 0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid #00f2fe',
          boxShadow:
            '0 20px 50px rgba(0, 0, 0, 0.88), 0 0 32px rgba(0, 242, 254, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          color: '#ffffff',
          fontFamily: 'var(--font-family)',
          position: 'relative',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Close Button: Exits inspection back to standard vehicle view */}
        <button
          type="button"
          onClick={() => exitVehicleInspectionMode()}
          title="Thoát kiểm tra bộ phận"
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
            transition: 'background 0.2s',
          }}
        >
          <X size={14} />
        </button>

        {/* Top Header Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#00f2fe',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}
        >
          <Wrench size={13} />
          Chi Tiết Bộ Phận Xe
        </div>

        {/* Part Vietnamese Name */}
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            margin: '0 0 4px 0',
            color: '#f8fafc',
          }}
        >
          {part.nameVi}
        </h3>

        {/* Category & Status Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Layers size={12} color="#38bdf8" />
            {part.categoryVi}
          </span>

          {/* Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '9999px',
              color: statusConfig.color,
              background: statusConfig.bg,
              border: `1px solid ${statusConfig.color}44`,
            }}
          >
            {part.status === 'NORMAL' ? (
              <CheckCircle2 size={12} />
            ) : (
              <AlertTriangle size={12} />
            )}
            <span>{statusConfig.labelVi}</span>
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: '11px',
            color: '#cbd5e1',
            lineHeight: '1.45',
            margin: '0 0 14px 0',
            padding: '8px 10px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            borderLeft: '2px solid #00f2fe',
          }}
        >
          {part.descriptionVi}
        </p>

        {/* Part Code */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            background: 'rgba(15, 23, 42, 0.65)',
            borderRadius: '8px',
            marginBottom: '12px',
            fontSize: '11px',
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

        {/* Specifications List */}
        {part.specs && part.specs.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
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
                  padding: '4px 8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '6px',
                }}
              >
                <span style={{ color: '#94a3b8' }}>{spec.label}</span>
                <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          {/* Action 1: Return to full vehicle inspection */}
          <button
            type="button"
            onClick={() => clearVehiclePartSelection()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)';
              e.currentTarget.style.borderColor = '#38bdf8';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
            }}
          >
            <RotateCcw size={12} />
            QUAY LẠI TOÀN XE
          </button>

          {/* Action 2: Exit inspection mode back to vehicle card */}
          <button
            type="button"
            onClick={() => exitVehicleInspectionMode()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: 'rgba(148, 163, 184, 0.08)',
              color: '#cbd5e1',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.18)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <LogOut size={12} />
            THOÁT KIỂM TRA
          </button>
        </div>
      </div>
    </Html>
  );
};
