import React from 'react';
import { Activity } from 'lucide-react';

interface HologramBarChartWidgetProps {
  title?: string;
  subtitle?: string;
  accentColor?: string;
}

export const HologramBarChartWidget: React.FC<HologramBarChartWidgetProps> = ({
  title = 'Phân bổ chi phí',
  subtitle = 'Minh bạch · Tự động · Theo thời gian thực',
  accentColor = '#00f2fe',
}) => {
  // Ascending telemetry distribution curve matching reference design
  const barHeights = [26, 34, 44, 38, 54, 66, 60, 74, 82, 90, 86, 95, 98, 100];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '200px',
        minWidth: '180px',
        padding: '8px 12px',
        // Translucent cybernetic glass gradient revealing showroom behind
        background: 'radial-gradient(120% 110% at 25% 20%, rgba(8, 44, 82, 0.52) 0%, rgba(3, 22, 48, 0.48) 55%, rgba(2, 14, 32, 0.60) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        // Swept aerodynamic rounded capsule contour (outer side deeper curve matching cylindrical arc)
        borderRadius: '14px 26px 22px 14px / 14px 28px 24px 14px',
        border: '1.5px solid rgba(0, 242, 254, 0.65)',
        boxShadow: `
          0 10px 28px rgba(0, 0, 0, 0.4),
          0 0 18px rgba(0, 242, 254, 0.22),
          inset 0 1.5px 1px rgba(255, 255, 255, 0.5),
          inset 0 0 16px rgba(0, 242, 254, 0.10)
        `,
        color: '#ffffff',
        fontFamily: "var(--font-family, 'Outfit', sans-serif)",
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        overflow: 'hidden',
      }}
    >
      {/* 1. Top Specular Curved Glass Rim */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '8%',
          right: '8%',
          height: '2px',
          borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          background: `linear-gradient(90deg, transparent, ${accentColor} 20%, #ffffff 60%, transparent)`,
          boxShadow: '0 0 10px rgba(0, 242, 254, 0.7)',
        }}
      />

      {/* 2. Background Holographic Coordinate Grid (Faint & Atmospheric) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 242, 254, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 242, 254, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '12px 12px',
          pointerEvents: 'none',
          opacity: 0.8,
        }}
      />

      {/* 3. Left Energy Docking Node (Visually anchors connector to Central Banner) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3.5px',
          height: '18px',
          borderRadius: '0 3px 3px 0',
          background: accentColor,
          boxShadow: '0 0 8px rgba(0, 242, 254, 0.7)',
        }}
      />

      {/* 4. Right Aerodynamic Outer Accent Pip */}
      <div
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '2.5px',
          height: '14px',
          borderRadius: '2px',
          background: 'rgba(0, 242, 254, 0.40)',
        }}
      />

      {/* 5. Vertical Telemetry Bar Chart Equalizer with Layered Depth Guidelines */}
      <div
        style={{
          position: 'relative',
          height: '42px',
          padding: '2px 2px 4px',
          zIndex: 1,
        }}
      >
        {/* Layer 3: Faint Horizontal Telemetry Guidelines */}
        <div
          style={{
            position: 'absolute',
            inset: '4px 2px 6px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <div style={{ width: '100%', borderTop: '1px dashed rgba(0, 242, 254, 0.15)' }} />
          <div style={{ width: '100%', borderTop: '1px dashed rgba(0, 242, 254, 0.10)' }} />
          <div style={{ width: '100%', borderTop: '1px dashed rgba(0, 242, 254, 0.15)' }} />
        </div>

        {/* Layer 4: Luminous Equalizer Bars */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: '100%',
            gap: '3.5px',
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
                background: `linear-gradient(180deg, #ffffff 0%, rgba(0, 242, 254, 0.9) 25%, rgba(2, 132, 199, 0.6) 80%, rgba(2, 132, 199, 0.25) 100%)`,
                borderRadius: '3px 3px 1px 1px',
                boxShadow: i >= 7 ? '0 0 6px rgba(0, 242, 254, 0.65)' : '0 0 2px rgba(0, 242, 254, 0.2)',
                position: 'relative',
                transition: 'height 0.3s ease',
              }}
            >
              {/* Glowing Cap Pip on active high-frequency bars */}
              {i >= 6 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-1px',
                    left: 0,
                    right: 0,
                    height: '1.5px',
                    borderRadius: '1.5px',
                    background: '#ffffff',
                    boxShadow: '0 0 4px #00f2fe',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. Title Row with Glowing Cyan Diamond Bullet */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <div
            style={{
              width: '5px',
              height: '5px',
              transform: 'rotate(45deg)',
              background: '#ffffff',
              boxShadow: '0 0 6px #00f2fe',
            }}
          />
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.03em',
              textShadow: '0 0 8px rgba(0, 242, 254, 0.5), 0 1px 4px rgba(0, 0, 0, 0.8)',
            }}
          >
            {title}
          </span>
        </div>

        {/* Live Activity Telemetry Badge (Subtle thin cyan glow) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            padding: '1.5px 6px',
            borderRadius: '9999px',
            background: 'rgba(0, 242, 254, 0.10)',
            border: '1px solid rgba(0, 242, 254, 0.30)',
            boxShadow: '0 0 6px rgba(0, 242, 254, 0.15)',
          }}
        >
          <Activity size={10} color={accentColor} />
          <span style={{ fontSize: '8px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.06em' }}>LIVE</span>
        </div>
      </div>

      {/* 7. Subtitle */}
      <div
        style={{
          fontSize: '8.5px',
          color: '#bae6fd',
          letterSpacing: '0.02em',
          fontWeight: 500,
          position: 'relative',
          zIndex: 1,
          opacity: 0.92,
          paddingLeft: '10px',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)',
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};

