import React from 'react';
import { useWorldStore } from '../../store/worldStore';
import { Grid, Eye } from 'lucide-react';

export const SpatialOverviewButton: React.FC = () => {
  const selectedZone = useWorldStore((state) => state.selectedZone);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const clearSelection = useWorldStore((state) => state.clearSelection);

  // Show when a zone or vehicle is currently focused/selected
  if (!selectedZone && !selectedVehicleId) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '36px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        onClick={clearSelection}
        title="Quay lại góc nhìn toàn cảnh garage"
        style={{
          background: 'rgba(8, 12, 22, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.5)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.3)',
          borderRadius: '9999px',
          padding: '12px 24px',
          color: '#ffffff',
          fontFamily: 'var(--font-family)',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(14, 165, 233, 0.25)';
          e.currentTarget.style.borderColor = '#00f2fe';
          e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 242, 254, 0.6)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(8, 12, 22, 0.88)';
          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.3)';
          e.currentTarget.style.transform = 'none';
        }}
      >
        <Eye size={16} color="#00f2fe" />
        <span>QUAY LẠI TOÀN CẢNH GARAGE</span>
      </button>
    </div>
  );
};
