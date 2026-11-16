/**
 * EVShare 3D — Unified Design System Tokens
 * Phase 4.1: Unified Design System & Frontend Stability
 * Single Source of Truth for Colors, Geometry, Shadows, Holograms, Panels, and Animations
 */

export const EV_COLORS = {
  // 1. Dark Navy Surfaces
  surface: {
    darkest: '#040B14',
    dark: '#071426',
    base: '#081C30',
    elevated: '#0B223D',
    panelBg: 'rgba(7, 20, 38, 0.94)',
    panelNavy96: 'rgba(8, 28, 48, 0.96)',
    cardBg: 'rgba(13, 27, 42, 0.90)',
    surfaceMuted: '#102A43',
    glassBg: 'rgba(8, 24, 44, 0.85)',
    glassSubtle: 'rgba(255, 255, 255, 0.04)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    glassBorderHover: 'rgba(255, 255, 255, 0.25)',
  },

  // 2. Cyan Primary Accents (Electric Vehicle / Telemetry / STAFF Default)
  cyan: {
    primary: '#00D9FF',
    bright: '#00F2FE',
    light: '#38BDF8',
    deep: '#0284C7',
    glow: 'rgba(0, 217, 255, 0.35)',
    border: 'rgba(0, 217, 255, 0.45)',
    bgSubtle: 'rgba(0, 217, 255, 0.12)',
  },

  // 3. Purple Management Accents (ADMIN / Governance / Supervision)
  purple: {
    primary: '#A855F7',
    bright: '#C084FC',
    deep: '#8B5CF6',
    glow: 'rgba(168, 85, 247, 0.35)',
    border: 'rgba(168, 85, 247, 0.50)',
    bgSubtle: 'rgba(168, 85, 247, 0.15)',
  },

  // 4. Green Operational States (Success / Available / CO_OWNER Default)
  green: {
    primary: '#10B981',
    emerald: '#10E6A3',
    bright: '#34D399',
    deep: '#059669',
    glow: 'rgba(16, 185, 129, 0.35)',
    border: 'rgba(16, 185, 129, 0.45)',
    bgSubtle: 'rgba(16, 185, 129, 0.15)',
  },

  // 5. Amber Warning States (Pending / In-Progress / Caution / Maintenance)
  amber: {
    primary: '#F59E0B',
    bright: '#FBBF24',
    deep: '#D97706',
    glow: 'rgba(245, 158, 11, 0.35)',
    border: 'rgba(245, 158, 11, 0.45)',
    bgSubtle: 'rgba(245, 158, 11, 0.15)',
  },

  // 6. Red Critical States (Dispute / Damage / Overdue / Reject / Danger)
  red: {
    primary: '#EF4444',
    bright: '#F87171',
    deep: '#DC2626',
    glow: 'rgba(239, 68, 68, 0.35)',
    border: 'rgba(239, 68, 68, 0.45)',
    bgSubtle: 'rgba(239, 68, 68, 0.15)',
  },

  // 7. Neutral Text Colors
  text: {
    pureWhite: '#FFFFFF',
    bright: '#F1F5F9',
    primary: '#E2E8F0',
    secondary: '#94A3B8',
    muted: '#64748B',
    dark: '#0F172A',
  },
} as const;

export const EV_RADII = {
  xs: '4px',
  sm: '8px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  xxl: '20px',
  full: '9999px',
} as const;

export const EV_SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
} as const;

export const EV_TYPOGRAPHY = {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontMono: "'JetBrains Mono', monospace",
  sizes: {
    badge: '9.5px',
    caption: '10.5px',
    bodySmall: '11.5px',
    body: '13px',
    subheading: '14px',
    title: '16px',
    heroTitle: '20px',
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
} as const;

export const EV_SHADOWS = {
  panelStandard: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(0, 217, 255, 0.16)',
  panelAdmin: '0 20px 50px rgba(0, 0, 0, 0.70), 0 0 25px rgba(168, 85, 247, 0.20)',
  panelCoOwner: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 25px rgba(16, 185, 129, 0.18)',
  glowCyan: '0 0 20px rgba(0, 217, 255, 0.35)',
  glowPurple: '0 0 20px rgba(168, 85, 247, 0.35)',
  glowGreen: '0 0 20px rgba(16, 185, 129, 0.35)',
  glowAmber: '0 0 20px rgba(245, 158, 11, 0.35)',
  glowRed: '0 0 20px rgba(239, 68, 68, 0.35)',
  buttonClick: '0 4px 14px rgba(0, 0, 0, 0.40)',
} as const;

export const EV_BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1440,
  ultrawide: 2560,
} as const;

export const EV_PANEL_DIMENSIONS = {
  // Standard Operational Panels (Staff, Admin, Co-Owner Functional Details)
  standard: {
    top: '76px',
    right: '20px',
    bottom: '20px',
    width: 'clamp(440px, 28vw, 495px)',
    maxWidth: 'min(495px, calc(100vw - 32px))',
    maxHeight: 'calc(100vh - 96px)',
  },
  // Compact Overview Panel specifically for CO_OWNER (preserves space for bottom operational carousel)
  compactOverview: {
    top: '76px',
    right: '20px',
    width: 'clamp(390px, 25vw, 445px)',
    maxWidth: 'min(445px, calc(100vw - 32px))',
    height: 'auto',
    maxHeight: 'min(78vh, calc(100vh - 128px))',
  },
  // Wide Management Panels (Admin User Management / Co-Ownership Inspector)
  wide: {
    top: '80px',
    right: '20px',
    width: 'clamp(460px, 34vw, 580px)',
    maxHeight: 'min(820px, calc(100dvh - 100px))',
  },
  // Tablet Viewport Adaptation (769px - 1024px)
  tablet: {
    top: '72px',
    right: '12px',
    bottom: '16px',
    width: 'clamp(380px, 45vw, 460px)',
    maxWidth: 'min(460px, calc(100vw - 24px))',
    maxHeight: 'calc(100dvh - 88px)',
  },
  // Mobile / Small Screen Adaptation (<= 768px)
  mobile: {
    top: '64px',
    left: '8px',
    right: '8px',
    bottom: '8px',
    width: 'auto',
    maxWidth: 'calc(100vw - 16px)',
    maxHeight: 'calc(100dvh - 72px)',
  },
} as const;

export const EV_ANIMATIONS = {
  durations: {
    fast: '0.15s ease',
    normal: '0.22s ease',
    panelSlide: '0.28s cubic-bezier(0.16, 1, 0.3, 1)',
    hologramEntrance: '0.35s cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

/**
 * Standard Member Identity Palette
 * Deterministically assigned across 3D holograms, charts, badges, and tables
 */
export const EV_MEMBER_PALETTE = [
  '#00D9FF', // Cyan
  '#A855F7', // Purple
  '#10E6A3', // Emerald
  '#FFBF36', // Amber
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#14B8A6', // Teal
  '#F97316', // Orange
] as const;

/**
 * Helper to compute stable member color based on member ID or unique key
 */
export function getStableMemberColorToken(
  memberKey: string | undefined | null,
  allKeys?: string[]
): string {
  if (!memberKey) return EV_MEMBER_PALETTE[0];
  if (allKeys && allKeys.length > 0) {
    const sorted = Array.from(new Set(allKeys.filter(Boolean))).sort();
    const idx = sorted.indexOf(memberKey);
    if (idx !== -1) {
      return EV_MEMBER_PALETTE[idx % EV_MEMBER_PALETTE.length];
    }
  }
  let hash = 0;
  for (let i = 0; i < memberKey.length; i++) {
    hash = memberKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EV_MEMBER_PALETTE[Math.abs(hash) % EV_MEMBER_PALETTE.length];
}

/**
 * Convenient flat token dictionary for quick backward-compatible access
 */
export const DESIGN_TOKENS = {
  darkNavy: EV_COLORS.surface.base,
  panelSurface: EV_COLORS.surface.surfaceMuted,
  cyan: EV_COLORS.cyan.primary,
  purple: EV_COLORS.purple.primary,
  emerald: EV_COLORS.green.emerald,
  amber: EV_COLORS.amber.bright,
  red: EV_COLORS.red.bright,
  primaryText: EV_COLORS.text.bright,
  secondaryText: EV_COLORS.text.secondary,
} as const;

