import React from 'react';
import { Activity } from 'lucide-react';

interface HologramBarChartProps {
  title?: string;
  subtitle?: string;
  accentCyan?: string;
}

/**
 * HologramBarChart: Right Card of the Hero Holographic System.
 * Displays financial allocation and telemetry trend equalizer.
 */
export const HologramBarChart: React.FC<HologramBarChartProps> = ({
  title = 'Phân bổ chi phí',
  subtitle = 'Minh bạch · Tự động · Theo thời gian thực',
  accentCyan = '#00f2fe',
}) => {
  const barHeights = [26, 34, 44, 38, 54, 66, 60, 74, 82, 90, 86, 95, 98, 100];

  return (
    <div
      style={{
        position: 'relative',
        minWidth: '320px',
        padding: '22px 26px 22px 28px',
        background: 'radial-gradient(130% 120% at 20% 0%, rgba(14, 116, 144, 0.35) 0%, rgba(6, 28, 56, 0.85) 45%, rgba(2, 12, 28, 0.94) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderRadius: '26px 40px 40px 26px',
        border: `1.8px solid ${accentCyan}`,
        boxShadow: `
          0 22px 55px rgba(0, 0, 0, 0.7),
          0 0 32px rgba(0, 242, 254, 0.32),
          inset 0 1.5px 1px rgba(255, 255, 255, 0.4),
          inset 0 0 25px rgba(0, 242, 254, 0.14)
        `,
        color: '#ffffff',
        fontFamily: "var(--font-family, 'Outfit', sans-serif)",
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflow: 'hidden',
      }}
    >
      {/* 1. Top Specular Curved Glass Rim */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '2.5px',
          borderRadius: '50% / 100%',
          background: `linear-gradient(90deg, transparent, ${accentCyan} 20%, #ffffff 60%, transparent)`,
          boxShadow: `0 0 16px ${accentCyan}`,
        }}
      />

      {/* 2. Background Holographic Coordinate Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 242, 254, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 242, 254, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '14px 14px',
          pointerEvents: 'none',
          opacity: 0.85,
        }}
      />

      {/* 3. Left Energy Docking Node */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '5px',
          height: '28px',
          borderRadius: '0 4px 4px 0',
          background: accentCyan,
          boxShadow: `0 0 14px ${accentCyan}`,
        }}
      />

      {/* 4. Right Aerodynamic Outer Accent Pip */}
      <div
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3px',
          height: '18px',
          borderRadius: '2px',
          background: 'rgba(0, 242, 254, 0.45)',
        }}
      />

      {/* 5. Header with Glowing Diamond, Title, and Live Activity Telemetry Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              transform: 'rotate(45deg)',
              background: '#ffffff',
              boxShadow: `0 0 10px ${accentCyan}, 0 0 16px ${accentCyan}`,
            }}
          />
          <span
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.04em',
              textShadow: '0 0 12px rgba(0, 242, 254, 0.65)',
            }}
          >
            {title}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '9999px',
            background: 'rgba(0, 242, 254, 0.12)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
          }}
        >
          <Activity size={12} color={accentCyan} />
          <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em' }}>LIVE</span>
        </div>
      </div>

      {/* 6. Vertical Telemetry Bar Chart Equalizer with Curved Pill Caps */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: '64px',
          gap: '5px',
          padding: '4px 2px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {barHeights.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              background: `linear-gradient(180deg, #ffffff 0%, ${accentCyan} 32%, rgba(2, 132, 199, 0.75) 100%)`,
              borderRadius: '4px 4px 1px 1px',
              boxShadow: i >= 7 ? `0 0 12px rgba(0, 242, 254, 0.9)` : '0 0 4px rgba(0, 242, 254, 0.35)',
              position: 'relative',
              transition: 'height 0.3s ease',
            }}
          >
            {i >= 6 && (
              <div
                style={{
                  position: 'absolute',
                  top: '-2px',
                  left: 0,
                  right: 0,
                  height: '2.5px',
                  borderRadius: '2px',
                  background: '#ffffff',
                  boxShadow: `0 0 8px ${accentCyan}`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 7. Subtitle */}
      <div
        style={{
          fontSize: '11px',
          color: '#bae6fd',
          letterSpacing: '0.03em',
          fontWeight: 500,
          position: 'relative',
          zIndex: 1,
          opacity: 0.92,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};

