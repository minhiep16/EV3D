import React from 'react';
import { Eye, EyeOff, X, Sparkles } from 'lucide-react';
import { useWorldStore } from '../../../store/worldStore';

export const CoOwnerExplorationToolbar: React.FC = () => {
  const exploreHotspotsVisible = useWorldStore((state) => state.exploreHotspotsVisible);
  const toggleExploreHotspotsVisible = useWorldStore((state) => state.toggleExploreHotspotsVisible);
  const exitCoOwnerExplorationMode = useWorldStore((state) => state.exitCoOwnerExplorationMode);

  return (
    <div
      data-ui-interactive="true"
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: 'rgba(7, 20, 38, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(0, 242, 254, 0.45)',
        borderRadius: '9999px',
        padding: '7px 18px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55), 0 0 20px rgba(0, 242, 254, 0.2)',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      {/* Holographic Mode Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(0, 242, 254, 0.16)',
            border: '1px solid #00f2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(0, 242, 254, 0.4)',
          }}
        >
          <Sparkles size={13} color="#00f2fe" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: '#ffffff',
              textTransform: 'uppercase',
              lineHeight: 1.2,
            }}
          >
            KHÁM PHÁ XE 3D
          </span>
          <span
            style={{
              fontSize: '9.5px',
              color: '#94a3b8',
              letterSpacing: '0.01em',
              fontWeight: 500,
            }}
          >
            Chọn điểm sáng trên xe để tìm hiểu.
          </span>
        </div>
      </div>

      {/* Vertical Subtle Separator */}
      <div
        style={{
          width: '1px',
          height: '24px',
          background: 'rgba(255, 255, 255, 0.15)',
        }}
      />

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Toggle Hotspots Visibility */}
        <button
          type="button"
          onClick={() => toggleExploreHotspotsVisible()}
          title={exploreHotspotsVisible ? 'Ẩn các điểm chạm trên xe' : 'Hiện các điểm chạm trên xe'}
          style={{
            background: exploreHotspotsVisible ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.06)',
            border: `1px solid ${exploreHotspotsVisible ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 255, 255, 0.16)'}`,
            borderRadius: '9999px',
            padding: '5px 12px',
            color: exploreHotspotsVisible ? '#00f2fe' : '#cbd5e1',
            fontSize: '10.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 242, 254, 0.22)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = exploreHotspotsVisible ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.06)';
          }}
        >
          {exploreHotspotsVisible ? <EyeOff size={12} /> : <Eye size={12} />}
          <span>{exploreHotspotsVisible ? 'Ẩn điểm chạm' : 'Hiện điểm chạm'}</span>
        </button>

        {/* Exit Exploration Mode */}
        <button
          type="button"
          onClick={() => exitCoOwnerExplorationMode()}
          title="Thoát chế độ khám phá 3D và quay về garage"
          style={{
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            borderRadius: '9999px',
            padding: '5px 12px',
            color: '#fca5a5',
            fontSize: '10.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#fca5a5';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.14)';
          }}
        >
          <X size={12} />
          <span>Thoát khám phá</span>
        </button>
      </div>
    </div>
  );
};

