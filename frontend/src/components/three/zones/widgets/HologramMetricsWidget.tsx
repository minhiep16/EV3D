import React from 'react';
import { Wallet } from 'lucide-react';

interface HologramMetricsWidgetProps {
  title?: string;
  amount?: string;
  subtitle?: string;
  accentColor?: string;
}

export const HologramMetricsWidget: React.FC<HologramMetricsWidgetProps> = ({
  title = 'QUỸ CHUNG',
  amount = '25.000.000đ',
  subtitle = 'Tổng quỹ sở hữu & chi phí vận hành',
  accentColor = '#00f2fe',
}) => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '300px',
        minWidth: '275px',
        padding: '9px 18px 8px',
        // Translucent holographic cyan-blue glass body revealing showroom silhouettes
        background: 'radial-gradient(120% 110% at 50% 15%, rgba(8, 48, 88, 0.58) 0%, rgba(4, 26, 54, 0.52) 55%, rgba(2, 15, 36, 0.65) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        // Curved visor canopy capsule (subtle cylindrical arch matching concept)
        borderRadius: '26px 26px 20px 20px / 30px 30px 20px 20px',
        border: '1.5px solid rgba(0, 242, 254, 0.75)',
        boxShadow: `
          0 12px 32px rgba(0, 0, 0, 0.45),
          0 0 22px rgba(0, 242, 254, 0.28),
          inset 0 1.5px 1px rgba(255, 255, 255, 0.55),
          inset 0 0 20px rgba(0, 242, 254, 0.12)
        `,
        textAlign: 'center',
        color: '#ffffff',
        fontFamily: "var(--font-family, 'Outfit', sans-serif)",
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* 1. Top Specular Curved Glass Crown Light Guide */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '6%',
          right: '6%',
          height: '2.5px',
          borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          background: `linear-gradient(90deg, transparent, #ffffff 35%, ${accentColor} 70%, transparent)`,
          boxShadow: '0 0 12px rgba(0, 242, 254, 0.8)',
        }}
      />

      {/* 2. Soft Secondary Rim Arc Highlight */}
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: '18%',
          right: '18%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
          opacity: 0.7,
        }}
      />

      {/* 3. Subtle Holographic Matrix Coordinate Grid (Faint & Decorative) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 242, 254, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 242, 254, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: '14px 14px',
          pointerEvents: 'none',
          opacity: 0.8,
        }}
      />

      {/* 4. Left & Right Energy Docking Ports */}
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
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3.5px',
          height: '18px',
          borderRadius: '3px 0 0 3px',
          background: accentColor,
          boxShadow: '0 0 8px rgba(0, 242, 254, 0.7)',
        }}
      />

      {/* 5. Header Pill: "QUỸ CHUNG" */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '2px 10px',
          borderRadius: '9999px',
          background: 'rgba(0, 242, 254, 0.14)',
          border: '1px solid rgba(0, 242, 254, 0.5)',
          boxShadow: '0 0 10px rgba(0, 242, 254, 0.2)',
          marginBottom: '4px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span
          style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: accentColor,
            boxShadow: `0 0 6px ${accentColor}`,
          }}
        />
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 800,
            letterSpacing: '0.18em',
            color: '#e0f2fe',
            textTransform: 'uppercase',
            textShadow: '0 0 8px rgba(0, 242, 254, 0.6)',
          }}
        >
          {title}
        </span>
        <span
          style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: accentColor,
            boxShadow: `0 0 6px ${accentColor}`,
          }}
        />
      </div>

      {/* 6. Middle Hero Row: Glowing Cyan Wallet Orb + Bold 25.000.000đ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '4px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Prominent Circular Glowing Wallet Icon Badge */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(0, 242, 254, 0.35) 0%, rgba(3, 105, 161, 0.45) 100%)',
            border: '1.5px solid rgba(0, 242, 254, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 14px rgba(0, 242, 254, 0.45), inset 0 0 8px rgba(0, 242, 254, 0.25)',
          }}
        >
          <Wallet size={16} color="#ffffff" />
        </div>

        {/* Luminous White-Cyan Amount */}
        <div
          style={{
            fontSize: '26px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            textShadow: '0 0 16px rgba(0, 242, 254, 0.6), 0 2px 8px rgba(0, 0, 0, 0.9)',
            lineHeight: 1,
          }}
        >
          {amount}
        </div>
      </div>

      {/* 7. Subtitle: "Tổng quỹ sở hữu & chi phí vận hành" */}
      <div
        style={{
          fontSize: '9.5px',
          fontWeight: 500,
          color: '#bae6fd',
          letterSpacing: '0.03em',
          position: 'relative',
          zIndex: 1,
          opacity: 0.95,
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
        }}
      >
        {subtitle}
      </div>

      {/* 8. Bottom Energy Conduit Dock */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '30%',
          right: '30%',
          height: '2.5px',
          borderRadius: '50% / 100%',
          background: `linear-gradient(90deg, transparent, ${accentColor} 50%, transparent)`,
          boxShadow: `0 0 12px ${accentColor}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: `0 0 10px ${accentColor}`,
        }}
      />
    </div>
  );
};


