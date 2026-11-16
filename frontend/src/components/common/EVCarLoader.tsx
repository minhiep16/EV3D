import React, { useMemo } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export interface EVCarLoaderProps {
  /**
   * Presentation variant:
   * - 'panel': Centered loading view for panels/drawers (replaces circular spinners in side panels)
   * - 'inline': Compact inline loader for sections or list placeholders
   * - 'button': Micro animated car for inside buttons during pending mutations
   * - 'fullscreen': Centered overlay with backdrop
   */
  variant?: 'panel' | 'inline' | 'button' | 'fullscreen';
  /**
   * Accessible text label / description displayed alongside or below the loader
   */
  message?: string;
  /**
   * Additional custom styling
   */
  style?: React.CSSProperties;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Optional error state: if set, stops animation and displays error with retry button
   */
  error?: Error | string | null;
  /**
   * Optional retry callback if error state is present
   */
  onRetry?: () => void;
  /**
   * Custom minHeight for panel or container
   */
  minHeight?: string | number;
}

/**
 * EVCarLoader
 * Unified 2D animated electric car loading indicator for EVShare 3D.
 * Replaces generic circular spinners across panels, dialogs, and action buttons.
 *
 * Performance-optimized:
 * - Pure 2D SVG & CSS hardware-accelerated transforms (translate3d, rotate).
 * - Zero Three.js canvas overhead; does not reload or affect 3D Garage models.
 * - Full accessibility with role="status", aria-live="polite", and prefers-reduced-motion support.
 */
export const EVCarLoader: React.FC<EVCarLoaderProps> = ({
  variant = 'panel',
  message = 'ĐANG TẢI DỮ LIỆU...',
  style,
  className = '',
  error = null,
  onRetry,
  minHeight,
}) => {
  const errorMessage = useMemo(() => {
    if (!error) return null;
    if (typeof error === 'string') return error;
    return error.message || 'Đã xảy ra lỗi khi tải dữ liệu';
  }, [error]);

  // If in error state, render accessible error banner with retry option instead of running animation
  if (errorMessage) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`ev-car-loader-error ${className}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: variant === 'button' ? '4px 8px' : '28px 20px',
          gap: '12px',
          color: '#fca5a5',
          textAlign: 'center',
          background: variant === 'button' ? 'transparent' : 'rgba(239, 68, 68, 0.08)',
          border: variant === 'button' ? 'none' : '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '14px',
          ...style,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={variant === 'button' ? 14 : 22} color="#f87171" />
          <span style={{ fontSize: variant === 'button' ? '11px' : '12.5px', fontWeight: 600 }}>
            {errorMessage}
          </span>
        </div>
        {onRetry && variant !== 'button' && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={13} />
            <span>Thử lại</span>
          </button>
        )}
      </div>
    );
  }

  // Visual dimensions by variant
  const dims = useMemo(() => {
    switch (variant) {
      case 'button':
        return { svgWidth: 26, svgHeight: 14, showRoad: false, showTrails: false, showText: false };
      case 'inline':
        return { svgWidth: 84, svgHeight: 38, showRoad: true, showTrails: true, showText: true };
      case 'fullscreen':
        return { svgWidth: 140, svgHeight: 56, showRoad: true, showTrails: true, showText: true };
      case 'panel':
      default:
        return { svgWidth: 120, svgHeight: 50, showRoad: true, showTrails: true, showText: true };
    }
  }, [variant]);

  // SVG Vehicle Artwork
  const carSvg = (
    <svg
      viewBox="0 0 120 48"
      width={dims.svgWidth}
      height={dims.svgHeight}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ev-car-svg"
      style={{
        overflow: 'visible',
        display: 'block',
        filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.35))',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Aerodynamic Body Gradient */}
        <linearGradient id="evBodyGrad" x1="10" y1="12" x2="116" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="60%" stopColor="#00f2fe" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* Cabin Glass Gradient */}
        <linearGradient id="evGlassGrad" x1="42" y1="14" x2="88" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#07192f" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.35" />
        </linearGradient>

        {/* Underbody Glow */}
        <linearGradient id="evUnderGlow" x1="20" y1="36" x2="95" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f2fe" stopOpacity="0" />
          <stop offset="50%" stopColor="#00f2fe" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
        </linearGradient>

        {/* Headlight Beam Cone */}
        <linearGradient id="evBeam" x1="114" y1="28" x2="132" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 1. MOTION SPEED TRAILS BEHIND CAR */}
      {dims.showTrails && (
        <g className="ev-motion-trails" opacity="0.75">
          <line x1="-12" y1="20" x2="6" y2="20" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" className="ev-trail-1" />
          <line x1="-18" y1="25" x2="3" y2="25" stroke="#00f2fe" strokeWidth="2.0" strokeLinecap="round" className="ev-trail-2" />
          <line x1="-10" y1="30" x2="5" y2="30" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" className="ev-trail-3" />
        </g>
      )}

      {/* 2. CHASSIS & SUSPENSION GROUP (Gentle Floating Oscillation) */}
      <g className="ev-car-chassis">
        {/* Headlight Forward Glow Beam */}
        <polygon points="114,26 132,23 132,33 114,30" fill="url(#evBeam)" opacity="0.65" />

        {/* Underbody Battery Glow Bar */}
        <rect x="26" y="34.5" width="66" height="2" rx="1" fill="url(#evUnderGlow)" />

        {/* Aerodynamic Fastback EV Silhouette */}
        <path
          d="M 102,34
             L 112,34
             C 115,34 116.5,32.5 116.5,30
             C 116.5,27 108,23.5 96,21.5
             L 76,13.5
             C 66,11.5 44,11.5 35,14.5
             C 23,18.5 14,23.5 9,27
             L 8,31.5
             C 8,33.5 10,34 14,34
             L 21,34
             A 10.5,10.5 0 0 1 42,34
             L 74,34
             A 10.5,10.5 0 0 1 95,34
             Z"
          fill="url(#evBodyGrad)"
          stroke="#00f2fe"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Aerodynamic Tinted Window Glass */}
        <path
          d="M 74,15.5
             L 92,21.5
             C 82,22 66,22.5 54,22.5
             L 37,22.5
             C 41,18.5 52,15.5 64,15.5
             Z"
          fill="url(#evGlassGrad)"
          stroke="rgba(0, 242, 254, 0.4)"
          strokeWidth="0.8"
        />

        {/* Window B-Pillar divider */}
        <line x1="62" y1="15.5" x2="62" y2="22.5" stroke="#07192f" strokeWidth="1.5" />

        {/* Sharp LED Headlight Accent */}
        <polygon points="112,27 116,28 114,30 110,29" fill="#ffffff" />

        {/* Slim Ruby Taillight Accent */}
        <rect x="7.5" y="27" width="3.5" height="3" rx="1" fill="#f43f5e" />

        {/* EV Aerodynamic Character Accent Line */}
        <path
          d="M 24,27 Q 60,26 98,28"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1.0"
          strokeLinecap="round"
        />

        {/* Door Flush Handle Accent */}
        <rect x="52" y="25" width="7" height="1.5" rx="0.75" fill="#07192f" opacity="0.6" />
        <rect x="70" y="25" width="7" height="1.5" rx="0.75" fill="#07192f" opacity="0.6" />
      </g>

      {/* 3. ROTATING ALLOY WHEELS (Pure CSS 360deg Rotation) */}
      {/* Rear Wheel (Center: 31.5, 34) */}
      <g className="ev-car-wheel ev-wheel-rear" style={{ transformOrigin: '31.5px 34px' }}>
        <circle cx="31.5" cy="34" r="8.5" fill="#071426" stroke="#38bdf8" strokeWidth="1.8" />
        <circle cx="31.5" cy="34" r="5" fill="#091b33" stroke="#00f2fe" strokeWidth="1.0" />
        {/* Alloy Spokes */}
        <line x1="31.5" y1="26.5" x2="31.5" y2="41.5" stroke="#00f2fe" strokeWidth="1.4" />
        <line x1="24" y1="34" x2="39" y2="34" stroke="#00f2fe" strokeWidth="1.4" />
        <line x1="26.2" y1="28.7" x2="36.8" y2="39.3" stroke="#38bdf8" strokeWidth="1.0" />
        <line x1="26.2" y1="39.3" x2="36.8" y2="28.7" stroke="#38bdf8" strokeWidth="1.0" />
        <circle cx="31.5" cy="34" r="2.2" fill="#00f2fe" />
      </g>

      {/* Front Wheel (Center: 84.5, 34) */}
      <g className="ev-car-wheel ev-wheel-front" style={{ transformOrigin: '84.5px 34px' }}>
        <circle cx="84.5" cy="34" r="8.5" fill="#071426" stroke="#38bdf8" strokeWidth="1.8" />
        <circle cx="84.5" cy="34" r="5" fill="#091b33" stroke="#00f2fe" strokeWidth="1.0" />
        {/* Alloy Spokes */}
        <line x1="84.5" y1="26.5" x2="84.5" y2="41.5" stroke="#00f2fe" strokeWidth="1.4" />
        <line x1="77" y1="34" x2="92" y2="34" stroke="#00f2fe" strokeWidth="1.4" />
        <line x1="79.2" y1="28.7" x2="89.8" y2="39.3" stroke="#38bdf8" strokeWidth="1.0" />
        <line x1="79.2" y1="39.3" x2="89.8" y2="28.7" stroke="#38bdf8" strokeWidth="1.0" />
        <circle cx="84.5" cy="34" r="2.2" fill="#00f2fe" />
      </g>

      {/* 4. ANIMATED HIGH-SPEED ROAD UNDERNEATH */}
      {dims.showRoad && (
        <g className="ev-road-track">
          {/* Base Road Bed */}
          <line x1="-15" y1="43.5" x2="135" y2="43.5" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1.5" />
          {/* Animated Neon Dashed Line */}
          <line
            x1="-15"
            y1="43.5"
            x2="135"
            y2="43.5"
            stroke="#00f2fe"
            strokeWidth="2.0"
            strokeDasharray="9 7"
            strokeLinecap="round"
            className="ev-road-dash"
          />
        </g>
      )}
    </svg>
  );

  // BUTTON VARIANT (Inline micro icon with stable width)
  if (variant === 'button') {
    return (
      <span
        role="status"
        aria-live="polite"
        className={`ev-car-loader-button ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          verticalAlign: 'middle',
          lineHeight: 1,
          ...style,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          {carSvg}
        </span>
        {message && <span>{message}</span>}
        <span className="sr-only" style={visuallyHiddenStyle}>
          {message}
        </span>
        <InlineKeyframes />
      </span>
    );
  }

  // INLINE VARIANT (For sections, cards, and list containers)
  if (variant === 'inline') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`ev-car-loader-inline ${className}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 14px',
          gap: '8px',
          color: '#38bdf8',
          width: '100%',
          boxSizing: 'border-box',
          ...style,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {carSvg}
        </div>
        {dims.showText && message && (
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#38bdf8',
              textAlign: 'center',
              textTransform: 'uppercase',
            }}
          >
            {message}
          </div>
        )}
        <InlineKeyframes />
      </div>
    );
  }

  // FULLSCREEN VARIANT (Centered backdrop overlay)
  if (variant === 'fullscreen') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`ev-car-loader-fullscreen ${className}`}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(4, 13, 26, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          pointerEvents: 'auto',
          ...style,
        }}
      >
        <div
          style={{
            background: 'rgba(8, 20, 38, 0.94)',
            border: '1.5px solid rgba(0, 242, 254, 0.4)',
            borderRadius: '24px',
            padding: '32px 40px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 242, 254, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          {carSvg}
          {message && (
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: '#00f2fe',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              {message}
            </div>
          )}
        </div>
        <InlineKeyframes />
      </div>
    );
  }

  // DEFAULT 'panel' VARIANT (Centered inside right-side Garage panels, modals, drawers)
  return (
    <div
      role="status"
      aria-live="polite"
      className={`ev-car-loader-panel ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        minHeight: minHeight ?? '220px',
        width: '100%',
        boxSizing: 'border-box',
        gap: '14px',
        pointerEvents: 'none',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {carSvg}
      </div>

      {message && (
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: '#38bdf8',
            textAlign: 'center',
            textTransform: 'uppercase',
            textShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
          }}
        >
          {message}
        </div>
      )}

      <InlineKeyframes />
    </div>
  );
};

/**
 * Isolated CSS Keyframe Declarations
 * Uses hardware-accelerated transform: translate3d and transform: rotate.
 * Zero layout thrashing, zero JS event loop blocking.
 * Disables all movement when prefers-reduced-motion is active.
 */
const InlineKeyframes: React.FC = () => (
  <style>{`
    @keyframes evWheelSpin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    @keyframes evChassisBob {
      0%, 100% {
        transform: translate3d(0, 0, 0);
      }
      50% {
        transform: translate3d(0, -1.2px, 0);
      }
    }

    @keyframes evRoadScroll {
      0% {
        stroke-dashoffset: 0;
      }
      100% {
        stroke-dashoffset: -32px;
      }
    }

    @keyframes evTrailPulse {
      0%, 100% {
        opacity: 0.25;
        transform: translate3d(-1px, 0, 0);
      }
      50% {
        opacity: 0.90;
        transform: translate3d(1px, 0, 0);
      }
    }

    /* Animation Classes */
    .ev-wheel-rear,
    .ev-wheel-front {
      animation: evWheelSpin 0.65s linear infinite;
    }

    .ev-car-chassis {
      animation: evChassisBob 1.2s ease-in-out infinite;
    }

    .ev-road-dash {
      animation: evRoadScroll 0.55s linear infinite;
    }

    .ev-trail-1 {
      animation: evTrailPulse 0.8s ease-in-out infinite;
    }

    .ev-trail-2 {
      animation: evTrailPulse 0.8s ease-in-out infinite 0.15s;
    }

    .ev-trail-3 {
      animation: evTrailPulse 0.8s ease-in-out infinite 0.3s;
    }

    /* Accessibility: Respect Reduced Motion Preference */
    @media (prefers-reduced-motion: reduce) {
      .ev-wheel-rear,
      .ev-wheel-front,
      .ev-car-chassis,
      .ev-road-dash,
      .ev-trail-1,
      .ev-trail-2,
      .ev-trail-3 {
        animation: none !important;
        transform: none !important;
      }
    }
  `}</style>
);

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

