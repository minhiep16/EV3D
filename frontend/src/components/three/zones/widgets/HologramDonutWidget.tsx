import React from 'react';
import { User } from 'lucide-react';

interface HologramDonutWidgetProps {
  userPercentage?: number;
  userLabel?: string;
  accentCyan?: string;
  accentPurple?: string;
}

export const HologramDonutWidget: React.FC<HologramDonutWidgetProps> = ({
  userPercentage = 40,
  userLabel = 'của bạn',
  accentCyan = '#00f2fe',
  accentPurple = '#a855f7',
}) => {
  // SVG Donut calculation (compact scale)
  const radius = 32;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~201.06
  const userDash = (userPercentage / 100) * circumference;
  const otherDash = circumference - userDash;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '200px',
        minWidth: '180px',
        padding: '8px 12px',
        // Translucent cybernetic glass gradient revealing showroom behind
        background: 'radial-gradient(120% 110% at 75% 20%, rgba(8, 44, 82, 0.52) 0%, rgba(3, 22, 48, 0.48) 55%, rgba(2, 14, 32, 0.60) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        // Swept aerodynamic rounded capsule contour (outer side deeper curve matching cylindrical arc)
        borderRadius: '26px 14px 14px 22px / 28px 14px 14px 24px',
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
        alignItems: 'center',
        gap: '10px',
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
          background: `linear-gradient(90deg, transparent, #ffffff 40%, ${accentCyan} 80%, transparent)`,
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

      {/* 3. Right Energy Docking Node (Visually anchors connector to Central Banner) */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3.5px',
          height: '18px',
          borderRadius: '3px 0 0 3px',
          background: accentCyan,
          boxShadow: '0 0 8px rgba(0, 242, 254, 0.7)',
        }}
      />

      {/* 4. Left Aerodynamic Outer Accent Pip */}
      <div
        style={{
          position: 'absolute',
          left: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '2.5px',
          height: '14px',
          borderRadius: '2px',
          background: 'rgba(0, 242, 254, 0.40)',
        }}
      />

      {/* 5. 3D Holographic Donut Chart Orb (Compact Scale, Luminous Not Fluorescent) */}
      <div style={{ position: 'relative', width: '74px', height: '74px', flexShrink: 0 }}>
        <svg width="74" height="74" viewBox="0 0 86 86" style={{ transform: 'rotate(-90deg)' }}>
          {/* Subtle Outer Tick Orbit */}
          <circle
            cx="43"
            cy="43"
            r="41"
            fill="none"
            stroke="rgba(0, 242, 254, 0.22)"
            strokeWidth="1.0"
            strokeDasharray="2.5 4"
          />

          {/* Purple/Others Segment */}
          <circle
            cx="43"
            cy="43"
            r={radius}
            fill="none"
            stroke={accentPurple}
            strokeWidth={strokeWidth}
            strokeDasharray={`${otherDash} ${userDash}`}
            strokeDashoffset={-userDash}
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.65))',
            }}
          />

          {/* Cyan/User Segment */}
          <circle
            cx="43"
            cy="43"
            r={radius}
            fill="none"
            stroke={accentCyan}
            strokeWidth={strokeWidth}
            strokeDasharray={`${userDash} ${otherDash}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 7px rgba(0, 242, 254, 0.75))',
            }}
          />

          {/* Inner Cutout Ambient Ring */}
          <circle
            cx="43"
            cy="43"
            r="25"
            fill="none"
            stroke="rgba(0, 242, 254, 0.30)"
            strokeWidth="1.2"
          />
        </svg>

        {/* Center Indicator Glowing Orb */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 0 6px #00f2fe',
            }}
          />
        </div>
      </div>

      {/* 6. Text Info Stack: "40% của bạn" */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative', zIndex: 1 }}>
        {/* User Icon Pill Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '1.5px 7px',
            borderRadius: '9999px',
            background: 'rgba(0, 242, 254, 0.12)',
            border: '1px solid rgba(0, 242, 254, 0.40)',
            width: 'fit-content',
            marginBottom: '1px',
          }}
        >
          <User size={10} color={accentCyan} />
          <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#bae6fd', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Sở hữu
          </span>
        </div>

        {/* Bold 40% */}
        <div
          style={{
            fontSize: '24px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            lineHeight: 1,
            textShadow: '0 0 14px rgba(0, 242, 254, 0.6), 0 2px 6px rgba(0, 0, 0, 0.85)',
          }}
        >
          {userPercentage}%
        </div>

        {/* "của bạn" Subtitle */}
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#bae6fd',
            letterSpacing: '0.03em',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)',
          }}
        >
          {userLabel}
        </div>
      </div>
    </div>
  );
};

