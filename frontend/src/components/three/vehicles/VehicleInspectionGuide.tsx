import React from 'react';
import { Html } from '@react-three/drei';
import { Wrench, LogOut, MousePointerClick } from 'lucide-react';
import { useWorldStore } from '../../../store/worldStore';
import { getPartById } from '../../../data/vehicleParts';

export const VehicleInspectionGuide: React.FC = () => {
  const hoveredVehiclePartId = useWorldStore(
    (state) => state.hoveredVehiclePartId
  );
  const exitVehicleInspectionMode = useWorldStore(
    (state) => state.exitVehicleInspectionMode
  );

  const hoveredPart = getPartById(hoveredVehiclePartId);

  return (
    <Html
      position={[0, 2.35, 0]}
      center
      distanceFactor={9.0}
      style={{ pointerEvents: 'auto', userSelect: 'none' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Main Instruction Pill */}
        <div
          style={{
            background: 'rgba(8, 12, 22, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            boxShadow:
              '0 8px 30px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 242, 254, 0.25)',
            borderRadius: '9999px',
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#f8fafc',
            fontFamily: 'var(--font-family)',
            fontSize: '12px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'rgba(0, 242, 254, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f2fe',
            }}
          >
            <Wrench size={13} />
          </div>

          <span>Chọn một bộ phận trên xe để kiểm tra</span>

          <span style={{ color: '#475569' }}>|</span>

          {/* Exit button */}
          <button
            type="button"
            onClick={() => exitVehicleInspectionMode()}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '9999px',
              padding: '3px 10px',
              color: '#cbd5e1',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <LogOut size={11} />
            THOÁT
          </button>
        </div>

        {/* Hovered Part Feedback */}
        {hoveredPart && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(12px)',
              border: '1px solid #38bdf8',
              borderRadius: '9999px',
              padding: '4px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#38bdf8',
              fontFamily: 'var(--font-family)',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5), 0 0 12px rgba(56, 189, 248, 0.3)',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <MousePointerClick size={12} />
            <span>Bộ phận: {hoveredPart.nameVi}</span>
          </div>
        )}
      </div>
    </Html>
  );
};
