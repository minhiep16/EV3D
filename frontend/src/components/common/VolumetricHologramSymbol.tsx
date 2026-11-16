import React from 'react';

export type HologramShapeType =
  | 'battery'
  | 'wrench'
  | 'key'
  | 'arrow'
  | 'magnifier'
  | 'clock'
  | 'wallet'
  | 'scale'
  | 'calendar'
  | 'ballot_box'
  | 'network'
  | 'contract';

export interface VolumetricHologramSymbolProps {
  shapeType: HologramShapeType;
  accentColor: string;
  glowColor: string;
  isFocused: boolean;
}

/**
 * Recognizable 3D Volumetric Objects for Holographic Operation Carousels
 * Matching authentic Three.js-style isometric perspective & holographic shaders:
 *
 * STAFF Functions:
 * 1. BATTERY: Volumetric 3D battery with terminals and glowing energy segments
 * 2. WRENCH: Volumetric open-ended wrench in amber/gold holographic materials
 * 3. MAGNIFIER: 3D magnifying glass with translucent optical lens & laser reticle
 * 4. KEY: 3D handover key
 * 5. ARROW: 3D return arrow
 * 6. CLOCK: 3D chrono clock disc
 * 7. WALLET: 3D digital wallet with chip
 * 8. SCALE: 3D balance scale with pans
 *
 * CO_OWNER Functions:
 * 9. CALENDAR: 3D volumetric flip calendar with binder rings & glowing day grid
 * 10. BALLOT_BOX: 3D volumetric voting ballot box with slot & checkmarked ballot
 * 11. NETWORK: 3D interconnected co-ownership member network with orbital links
 * 12. CONTRACT: 3D legal agreement document with wax seal & digital signature
 */
export const VolumetricHologramSymbol: React.FC<VolumetricHologramSymbolProps> = ({
  shapeType,
  accentColor,
  glowColor,
  isFocused,
}) => {
  const uid = `${shapeType}-${accentColor.replace('#', '')}`;

  return (
    <div
      style={{
        position: 'relative',
        width: isFocused ? '84px' : '70px',
        height: isFocused ? '84px' : '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Ground Projection Glow Aura */}
      <div
        style={{
          position: 'absolute',
          bottom: '2px',
          width: isFocused ? '60px' : '48px',
          height: '12px',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${accentColor}88 0%, ${accentColor}00 75%)`,
          filter: `drop-shadow(0 0 10px ${glowColor})`,
          transition: 'all 0.3s ease',
        }}
      />

      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        fill="none"
        style={{
          filter: isFocused
            ? `drop-shadow(0 0 18px ${accentColor}) drop-shadow(0 0 6px ${glowColor})`
            : `drop-shadow(0 0 10px ${accentColor}88)`,
          transition: 'all 0.3s ease',
        }}
      >
        <defs>
          <linearGradient id={`holo-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="40%" stopColor={glowColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.65" />
          </linearGradient>
          <radialGradient id={`holo-core-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Halo Core */}
        <circle cx="50" cy="50" r="38" fill={`url(#holo-core-${uid})`} />

        {/* Orbiting Holographic Rings */}
        <ellipse
          cx="50"
          cy="50"
          rx="44"
          ry="15"
          stroke={accentColor}
          strokeWidth="1.2"
          strokeDasharray="4 3"
          strokeOpacity={isFocused ? 0.9 : 0.45}
          transform="rotate(-20 50 50)"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="38"
          ry="12"
          stroke={glowColor}
          strokeWidth="0.8"
          strokeDasharray="2 4"
          strokeOpacity={isFocused ? 0.75 : 0.3}
          transform="rotate(35 50 50)"
        />

        {/* 1. BATTERY: Volumetric 3D Battery Geometry */}
        {shapeType === 'battery' && (
          <g>
            <path
              d="M44 17 L56 17 L54 22 L46 22 Z"
              fill="#FFFFFF"
              stroke="#00D9FF"
              strokeWidth="1"
            />
            <path
              d="M32 23 L62 23 L68 28 L68 76 L62 82 L32 82 L26 76 L26 28 Z"
              fill="rgba(8, 30, 60, 0.75)"
              stroke="#00D9FF"
              strokeWidth="1.6"
            />
            <path
              d="M26 28 L32 23 L62 23 L56 28 Z"
              fill="rgba(0, 217, 255, 0.35)"
              stroke="#38BDF8"
              strokeWidth="1"
            />
            <path
              d="M62 23 L68 28 L68 76 L62 82 Z"
              fill="rgba(0, 180, 216, 0.25)"
              stroke="#00D9FF"
              strokeWidth="1"
            />
            <rect x="32" y="68" width="28" height="8" rx="2" fill="#00D9FF" fillOpacity="0.9" stroke="#FFFFFF" strokeWidth="0.8" />
            <rect x="32" y="56" width="28" height="8" rx="2" fill="#00E5FF" fillOpacity="0.85" stroke="#FFFFFF" strokeWidth="0.8" />
            <rect x="32" y="44" width="28" height="8" rx="2" fill="#38BDF8" fillOpacity="0.8" stroke="#FFFFFF" strokeWidth="0.8" />
            <rect x="32" y="32" width="28" height="8" rx="2" fill="#7DD3FC" fillOpacity={isFocused ? 0.9 : 0.6} stroke="#FFFFFF" strokeWidth="0.8" />
            <line x1="30" y1="27" x2="30" y2="78" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
          </g>
        )}

        {/* 2. WRENCH: Volumetric Open-Ended Wrench */}
        {shapeType === 'wrench' && (
          <g transform="rotate(-30 50 50)">
            <path d="M45 28 L51 28 L51 72 L45 72 Z" fill="#78350F" opacity="0.8" />
            <path d="M47 26 L53 26 L53 74 L47 74 Z" fill={`url(#holo-grad-${uid})`} stroke="#FBBF24" strokeWidth="1.2" />
            <rect x="49" y="34" width="2" height="32" rx="1" fill="#F59E0B" />
            <path
              d="M37 20 C37 14, 43 8, 50 8 C57 8, 63 14, 63 20 C63 25, 59 29, 55 31 L55 24 L52 20 L48 20 L45 24 L45 31 C41 29, 37 25, 37 20 Z"
              fill={`url(#holo-grad-${uid})`}
              stroke="#FFFFFF"
              strokeWidth="1.4"
            />
            <path d="M40 18 C40 14, 45 11, 50 11 L50 15 L46 18 Z" fill="#FFFFFF" fillOpacity="0.5" />
            <circle cx="50" cy="78" r="9" fill={`url(#holo-grad-${uid})`} stroke="#FFFFFF" strokeWidth="1.4" />
            <circle cx="50" cy="78" r="4.5" fill="#071426" stroke="#FBBF24" strokeWidth="1.2" />
          </g>
        )}

        {/* 3. MAGNIFIER: Volumetric 3D Magnifying Glass */}
        {shapeType === 'magnifier' && (
          <g transform="rotate(-15 50 50)">
            <circle cx="68" cy="74" r="4.5" fill={accentColor} stroke="#FFFFFF" strokeWidth="1" />
            <path d="M54 58 L68 72 L65 75 L51 61 Z" fill="#7E22CE" stroke={glowColor} strokeWidth="1.2" />
            <line x1="53" y1="59" x2="66" y2="72" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" />
            <circle cx="42" cy="40" r="23" stroke="#A855F7" strokeWidth="4" />
            <circle cx="42" cy="40" r="22" stroke="#FFFFFF" strokeWidth="1" />
            <circle cx="42" cy="40" r="20" stroke={accentColor} strokeWidth="1.5" />
            <circle cx="42" cy="40" r="19" fill="rgba(168, 85, 247, 0.28)" />
            <path
              d="M29 30 C33 24, 42 22, 50 24 C45 28, 38 31, 33 38 C30 35, 29 32, 29 30 Z"
              fill="#FFFFFF"
              fillOpacity="0.65"
            />
            <circle cx="42" cy="40" r="11" stroke={glowColor} strokeWidth="1" strokeDasharray="3 2" />
            <line x1="42" y1="26" x2="42" y2="54" stroke="#00F2FE" strokeWidth="1.4" strokeOpacity={isFocused ? 0.9 : 0.6} />
            <line x1="28" y1="40" x2="56" y2="40" stroke="#00F2FE" strokeWidth="1.4" strokeOpacity={isFocused ? 0.9 : 0.6} />
            <circle cx="42" cy="40" r="2.5" fill="#00F2FE" />
          </g>
        )}

        {/* 4. KEY: 3D Handover Key */}
        {shapeType === 'key' && (
          <g>
            <circle cx="38" cy="38" r="16" fill="none" stroke={accentColor} strokeWidth="2.5" />
            <circle cx="38" cy="38" r="9" fill={`url(#holo-grad-${uid})`} />
            <path
              d="M50 46 L76 72 L72 76 L66 70 L62 74 L58 70 L48 56 Z"
              fill={`url(#holo-grad-${uid})`}
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
          </g>
        )}

        {/* 5. ARROW: 3D Return Arrow */}
        {shapeType === 'arrow' && (
          <g>
            <path
              d="M50 24 A 26 26 0 1 0 76 50"
              fill="none"
              stroke={`url(#holo-grad-${uid})`}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path d="M44 14 L54 24 L44 34 Z" fill="#FFFFFF" stroke={glowColor} strokeWidth="1" />
          </g>
        )}

        {/* 6. CLOCK: 3D Chrono Clock */}
        {shapeType === 'clock' && (
          <g>
            <circle cx="50" cy="50" r="26" fill={`url(#holo-core-${uid})`} stroke={`url(#holo-grad-${uid})`} strokeWidth="2.5" />
            <line x1="50" y1="28" x2="50" y2="33" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="72" y1="50" x2="67" y2="50" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="50" y1="72" x2="50" y2="67" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="28" y1="50" x2="33" y2="50" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="50" y1="50" x2="50" y2="36" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="50" x2="62" y2="50" stroke={glowColor} strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="50" r="3" fill="#FFFFFF" />
          </g>
        )}

        {/* 7. WALLET: 3D Digital Wallet */}
        {shapeType === 'wallet' && (
          <g>
            <rect x="26" y="32" width="48" height="36" rx="6" fill={`url(#holo-grad-${uid})`} stroke="#FFFFFF" strokeWidth="1.2" />
            <path d="M26 42 L74 42" stroke="#08182C" strokeWidth="2" />
            <circle cx="62" cy="50" r="4" fill="#FFFFFF" stroke={glowColor} strokeWidth="1" />
            <rect x="32" y="48" width="10" height="8" rx="2" fill="#00D9FF" fillOpacity="0.8" />
          </g>
        )}

        {/* 8. SCALE: 3D Balance Scale */}
        {shapeType === 'scale' && (
          <g>
            <line x1="50" y1="26" x2="50" y2="74" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="38" y1="74" x2="62" y2="74" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="28" y1="36" x2="72" y2="36" stroke={glowColor} strokeWidth="2.5" />
            <circle cx="50" cy="26" r="3" fill="#FFFFFF" />
            <line x1="28" y1="36" x2="22" y2="52" stroke={accentColor} strokeWidth="1" />
            <line x1="28" y1="36" x2="34" y2="52" stroke={accentColor} strokeWidth="1" />
            <path d="M20 52 Q28 60 36 52 Z" fill={`url(#holo-grad-${uid})`} stroke="#FFFFFF" strokeWidth="1" />
            <line x1="72" y1="36" x2="66" y2="52" stroke={accentColor} strokeWidth="1" />
            <line x1="72" y1="36" x2="78" y2="52" stroke={accentColor} strokeWidth="1" />
            <path d="M64 52 Q72 60 80 52 Z" fill={`url(#holo-grad-${uid})`} stroke="#FFFFFF" strokeWidth="1" />
          </g>
        )}

        {/* 9. CALENDAR: 3D Volumetric Calendar Desk Flip (CO_OWNER: Đặt lịch) */}
        {shapeType === 'calendar' && (
          <g>
            {/* Top Binder Rings */}
            <rect x="36" y="20" width="4" height="8" rx="2" fill="#FFFFFF" stroke={accentColor} strokeWidth="0.8" />
            <rect x="48" y="20" width="4" height="8" rx="2" fill="#FFFFFF" stroke={accentColor} strokeWidth="0.8" />
            <rect x="60" y="20" width="4" height="8" rx="2" fill="#FFFFFF" stroke={accentColor} strokeWidth="0.8" />

            {/* Calendar Main Card with 3D Depth */}
            <path
              d="M28 26 L72 26 L76 30 L76 76 L72 80 L28 80 L24 76 L24 30 Z"
              fill="rgba(8, 28, 54, 0.85)"
              stroke={accentColor}
              strokeWidth="1.5"
            />
            {/* Calendar Header Band */}
            <path
              d="M25 30 L75 30 L75 42 L25 42 Z"
              fill={`url(#holo-grad-${uid})`}
              stroke="#FFFFFF"
              strokeWidth="0.8"
            />
            {/* Top bevel facet */}
            <path d="M24 30 L28 26 L72 26 L76 30 Z" fill="rgba(255, 255, 255, 0.25)" />
            {/* Right side facet */}
            <path d="M72 26 L76 30 L76 76 L72 80 Z" fill="rgba(0, 217, 255, 0.2)" />

            {/* Calendar Grid Squares */}
            <rect x="31" y="48" width="6" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
            <rect x="41" y="48" width="6" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
            <rect x="51" y="48" width="6" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
            <rect x="61" y="48" width="6" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.8" />

            <rect x="31" y="57" width="6" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
            <rect x="41" y="57" width="6" height="5" rx="1" fill={accentColor} fillOpacity="0.95" stroke="#FFFFFF" strokeWidth="0.8" />
            <rect x="51" y="57" width="6" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
            <rect x="61" y="57" width="6" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.8" />

            <rect x="31" y="66" width="6" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
            <rect x="41" y="66" width="6" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
            <rect x="51" y="66" width="6" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
            <rect x="61" y="66" width="6" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.8" />

            {/* Glowing active booking pin indicator */}
            <circle cx="44" cy="59.5" r="1.5" fill="#FFFFFF" />
          </g>
        )}

        {/* 10. BALLOT_BOX: 3D Volumetric Ballot Box (CO_OWNER: Biểu quyết) */}
        {shapeType === 'ballot_box' && (
          <g>
            {/* 3D Ballot Box Front Body */}
            <path
              d="M26 44 L70 44 L70 78 L26 78 Z"
              fill="rgba(8, 26, 52, 0.85)"
              stroke={accentColor}
              strokeWidth="1.5"
            />
            {/* Top Slanted Lid Facet */}
            <path
              d="M26 44 L36 30 L80 30 L70 44 Z"
              fill={`url(#holo-grad-${uid})`}
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
            {/* Right 3D Depth Facet */}
            <path
              d="M70 44 L80 30 L80 64 L70 78 Z"
              fill="rgba(0, 150, 255, 0.3)"
              stroke={accentColor}
              strokeWidth="1.2"
            />

            {/* Top Ballot Slot */}
            <path
              d="M44 36 L62 36 L60 38 L42 38 Z"
              fill="#071426"
              stroke="#FFFFFF"
              strokeWidth="0.8"
            />

            {/* Paper Ballot Sliding into Slot */}
            <path
              d="M44 18 L62 18 L59 36 L41 36 Z"
              fill="#FFFFFF"
              stroke={glowColor}
              strokeWidth="1"
            />
            {/* Glowing Checkmark on Ballot */}
            <path
              d="M48 26 L51 29 L57 22"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Front Embellished Voting Emblem */}
            <circle cx="48" cy="60" r="10" fill="none" stroke={glowColor} strokeWidth="1.2" strokeDasharray="3 2" />
            <path
              d="M43 60 L47 64 L54 56"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* 11. NETWORK: 3D Interconnected Member Network (CO_OWNER: Nhóm sở hữu) */}
        {shapeType === 'network' && (
          <g>
            {/* Interconnecting Laser Links */}
            <line x1="50" y1="30" x2="30" y2="64" stroke={glowColor} strokeWidth="1.8" strokeDasharray="3 2" />
            <line x1="50" y1="30" x2="70" y2="64" stroke={glowColor} strokeWidth="1.8" strokeDasharray="3 2" />
            <line x1="30" y1="64" x2="70" y2="64" stroke={glowColor} strokeWidth="1.8" strokeDasharray="3 2" />

            <line x1="50" y1="50" x2="50" y2="30" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="50" y1="50" x2="30" y2="64" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="50" y1="50" x2="70" y2="64" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Center Master Node */}
            <circle cx="50" cy="50" r="11" fill={`url(#holo-grad-${uid})`} stroke="#FFFFFF" strokeWidth="1.8" />
            <circle cx="50" cy="50" r="5" fill="#071426" stroke="#10B981" strokeWidth="1.2" />

            {/* Satellite Member Node Top */}
            <circle cx="50" cy="28" r="8" fill="rgba(8, 28, 54, 0.9)" stroke={accentColor} strokeWidth="1.6" />
            <circle cx="50" cy="28" r="3.5" fill="#FFFFFF" />

            {/* Satellite Member Node Bottom-Left */}
            <circle cx="28" cy="66" r="8" fill="rgba(8, 28, 54, 0.9)" stroke={accentColor} strokeWidth="1.6" />
            <circle cx="28" cy="66" r="3.5" fill="#FFFFFF" />

            {/* Satellite Member Node Bottom-Right */}
            <circle cx="72" cy="66" r="8" fill="rgba(8, 28, 54, 0.9)" stroke={accentColor} strokeWidth="1.6" />
            <circle cx="72" cy="66" r="3.5" fill="#FFFFFF" />

            {/* Pulsing Outer Orbit Ring */}
            <circle cx="50" cy="50" r="31" fill="none" stroke={glowColor} strokeWidth="0.8" strokeDasharray="4 4" strokeOpacity="0.6" />
          </g>
        )}

        {/* 12. CONTRACT: 3D Document Parchment with Seal (CO_OWNER: Hợp đồng) */}
        {shapeType === 'contract' && (
          <g>
            {/* Document 3D Depth Shadow Sheet */}
            <path
              d="M32 20 L62 20 L72 30 L72 82 L32 82 Z"
              fill="rgba(4, 18, 36, 0.75)"
            />

            {/* Document Main Sheet */}
            <path
              d="M28 18 L58 18 L68 28 L68 78 L28 78 Z"
              fill="rgba(11, 32, 60, 0.92)"
              stroke={accentColor}
              strokeWidth="1.5"
            />
            {/* Top-Right Folded Corner */}
            <path
              d="M58 18 L68 28 L58 28 Z"
              fill={`url(#holo-grad-${uid})`}
              stroke="#FFFFFF"
              strokeWidth="1"
            />

            {/* Text / Clause Lines */}
            <line x1="34" y1="34" x2="52" y2="34" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="34" y1="42" x2="62" y2="42" stroke={glowColor} strokeWidth="1.4" strokeLinecap="round" />
            <line x1="34" y1="49" x2="62" y2="49" stroke={glowColor} strokeWidth="1.4" strokeLinecap="round" />
            <line x1="34" y1="56" x2="48" y2="56" stroke={glowColor} strokeWidth="1.4" strokeLinecap="round" />

            {/* Calligraphic Signature Stroke */}
            <path
              d="M34 68 Q40 62 45 68 T52 66"
              fill="none"
              stroke="#00D9FF"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Official Wax / Hologram Seal with Ribbon */}
            <circle cx="58" cy="67" r="6" fill={`url(#holo-grad-${uid})`} stroke="#FFFFFF" strokeWidth="1.2" />
            <path
              d="M56 71 L53 79 L57 77 L61 79 L58 71"
              fill={accentColor}
              stroke="#FFFFFF"
              strokeWidth="0.8"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
