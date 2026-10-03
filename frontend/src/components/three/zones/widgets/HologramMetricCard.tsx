import React from 'react';
import { Wallet } from 'lucide-react';

interface HologramMetricCardProps {
  title?: string;
  value?: string;
  subtitle?: string;
  accentCyan?: string;
}

/**
 * HologramMetricCard: Primary Center Card of the Hero Holographic System.
 * Displays large fund amount with wallet insignia and translucent cyan glass.
 */
export const HologramMetricCard: React.FC<HologramMetricCardProps> = ({
  title = 'QUỸ CHUNG',
  value = '25.000.000đ',
  subtitle = 'Tổng quỹ sở hữu & chi phí vận hành',
  accentCyan = '#00f2fe',
}) => {
  return (
    <div
      style={{
        position: 'relative',
        minWidth: '440px',
        padding: '26px 42px 24px',
        background: 'radial-gradient(130% 120% at 50% 0%, rgba(14, 116, 144, 0.35) 0%, rgba(6, 28, 56, 0.85) 45%, rgba(2, 12, 28, 0.94) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderRadius: '44px',
        border: `1.8px solid ${accentCyan}`,
        boxShadow: `
          0 25px 60px rgba(0, 0, 0, 0.75),
          0 0 35px rgba(0, 242, 254, 0.38),
          inset 0 1.5px 1px rgba(255, 255, 255, 0.45),
          inset 0 0 30px rgba(0, 242, 254, 0.16)
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
          left: '8%',
          right: '8%',
          height: '3px',
          borderRadius: '50% / 100%',
          background: `linear-gradient(90deg, transparent, #ffffff 30%, ${accentCyan} 70%, transparent)`,
          boxShadow: `0 0 20px ${accentCyan}, 0 0 35px ${accentCyan}`,
        }}
      />

      {/* 2. Soft Secondary Rim Arc Highlight */}
      <div
        style={{
          position: 'absolute',
          top: '3px',
          left: '18%',
          right: '18%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
          opacity: 0.8,
        }}
      />

      {/* 3. Subtle Holographic Matrix Coordinate Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 242, 254, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 242, 254, 0.045) 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px',
          pointerEvents: 'none',
          opacity: 0.9,
        }}
      />

      {/* 4. Left & Right Energy Docking Ports */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '4px',
          height: '32px',
          borderRadius: '0 4px 4px 0',
          background: accentCyan,
          boxShadow: `0 0 12px ${accentCyan}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '4px',
          height: '32px',
          borderRadius: '4px 0 0 4px',
          background: accentCyan,
          boxShadow: `0 0 12px ${accentCyan}`,
        }}
      />

      {/* 5. Header Pill: "QUỸ CHUNG" */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '4px 18px',
          borderRadius: '9999px',
          background: 'rgba(0, 242, 254, 0.12)',
          border: `1.2px solid rgba(0, 242, 254, 0.45)`,
          boxShadow: '0 0 14px rgba(0, 242, 254, 0.25)',
          marginBottom: '12px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: accentCyan,
            boxShadow: `0 0 8px ${accentCyan}`,
          }}
        />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.24em',
            color: '#e0f2fe',
            textTransform: 'uppercase',
            textShadow: '0 0 10px rgba(0, 242, 254, 0.6)',
          }}
        >
          {title}
        </span>
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: accentCyan,
            boxShadow: `0 0 8px ${accentCyan}`,
          }}
        />
      </div>

      {/* 6. Middle Hero Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '10px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.32) 0%, rgba(3, 105, 161, 0.5) 100%)',
            border: `1.8px solid ${accentCyan}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 0 22px rgba(0, 242, 254, 0.5), inset 0 0 12px rgba(0, 242, 254, 0.3)`,
          }}
        >
          <Wallet size={25} color="#ffffff" />
        </div>

        <div
          style={{
            fontSize: '46px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            textShadow: `0 0 28px rgba(0, 242, 254, 0.8), 0 2px 10px rgba(0, 0, 0, 0.95)`,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
      </div>

      {/* 7. Subtitle */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: '#bae6fd',
          letterSpacing: '0.04em',
          position: 'relative',
          zIndex: 1,
          opacity: 0.95,
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
          height: '3px',
          borderRadius: '50% / 100%',
          background: `linear-gradient(90deg, transparent, ${accentCyan} 50%, transparent)`,
          boxShadow: `0 0 14px ${accentCyan}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: `0 0 12px ${accentCyan}`,
        }}
      />
    </div>
  );
};

