import React from 'react';
import { User } from 'lucide-react';

interface HologramDonutChartProps {
  percentage?: number;
  label?: string;
  accentCyan?: string;
  accentPurple?: string;
}

/**
 * HologramDonutChart: Left Card of the Hero Holographic System.
 * Displays holographic donut chart with 40% user ownership.
 */
export const HologramDonutChart: React.FC<HologramDonutChartProps> = ({
  percentage = 40,
  label = 'của bạn',
  accentCyan = '#00f2fe',
  accentPurple = '#a855f7',
}) => {
  const radius = 48;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius;
  const userDash = (percentage / 100) * circumference;
  const otherDash = circumference - userDash;

  return (
    <div
      style={{
        position: 'relative',
        minWidth: '310px',
        padding: '22px 28px 22px 26px',
        background: 'radial-gradient(130% 120% at 80% 0%, rgba(14, 116, 144, 0.35) 0%, rgba(6, 28, 56, 0.85) 45%, rgba(2, 12, 28, 0.94) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderRadius: '40px 26px 26px 40px',
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
        alignItems: 'center',
        gap: '20px',
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
          background: `linear-gradient(90deg, transparent, #ffffff 40%, ${accentCyan} 80%, transparent)`,
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

      {/* 3. Right Energy Docking Node */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '5px',
          height: '28px',
          borderRadius: '4px 0 0 4px',
          background: accentCyan,
          boxShadow: `0 0 14px ${accentCyan}`,
        }}
      />

      {/* 4. Left Aerodynamic Outer Accent Pip */}
      <div
        style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3px',
          height: '18px',
          borderRadius: '2px',
          background: 'rgba(0, 242, 254, 0.45)',
        }}
      />

      {/* 5. 3D Holographic Donut Chart Orb */}
      <div style={{ position: 'relative', width: '118px', height: '118px', flexShrink: 0 }}>
        <svg width="118" height="118" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
          {/* Subtle Outer Tick Orbit */}
          <circle
            cx="65"
            cy="65"
            r="63"
            fill="none"
            stroke="rgba(0, 242, 254, 0.28)"
            strokeWidth="1.2"
            strokeDasharray="3 5"
          />

          {/* Purple/Others Segment */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke={accentPurple}
            strokeWidth={strokeWidth}
            strokeDasharray={`${otherDash} ${userDash}`}
            strokeDashoffset={-userDash}
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.85))',
            }}
          />

          {/* Cyan/User Segment */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke={accentCyan}
            strokeWidth={strokeWidth}
            strokeDasharray={`${userDash} ${otherDash}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 14px rgba(0, 242, 254, 0.98))',
            }}
          />

          {/* Inner Cutout Ambient Ring */}
          <circle
            cx="65"
            cy="65"
            r="38"
            fill="none"
            stroke="rgba(0, 242, 254, 0.35)"
            strokeWidth="1.4"
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
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: `0 0 12px ${accentCyan}, 0 0 20px ${accentCyan}`,
            }}
          />
        </div>
      </div>

      {/* 6. Text Info Stack: "40% của bạn" */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '9999px',
            background: 'rgba(0, 242, 254, 0.15)',
            border: `1.2px solid rgba(0, 242, 254, 0.45)`,
            width: 'fit-content',
            marginBottom: '2px',
          }}
        >
          <User size={12} color={accentCyan} />
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#bae6fd', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Sở hữu
          </span>
        </div>

        <div
          style={{
            fontSize: '36px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            lineHeight: 1,
            textShadow: `0 0 22px rgba(0, 242, 254, 0.75), 0 2px 8px rgba(0, 0, 0, 0.85)`,
          }}
        >
          {percentage}%
        </div>

        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#bae6fd',
            letterSpacing: '0.04em',
            textShadow: '0 0 8px rgba(0, 242, 254, 0.4)',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

