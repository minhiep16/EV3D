import React from 'react';
import { X, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { EV_COLORS, EV_PANEL_DIMENSIONS, EV_RADII, EV_SHADOWS, EV_ANIMATIONS } from '../../styles/designTokens';

export type PanelThemeRole = 'STAFF' | 'ADMIN' | 'CO_OWNER';

export interface StandardPanelShellProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  role?: PanelThemeRole;
  isCompactOverview?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  loadingText?: string;
  error?: string | null;
  onRetry?: () => void;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const StandardPanelShell: React.FC<StandardPanelShellProps> = ({
  title,
  subtitle,
  icon,
  badge,
  role = 'STAFF',
  isCompactOverview = false,
  onClose,
  onBack,
  isLoading = false,
  loadingText = 'Đang tải dữ liệu...',
  error = null,
  onRetry,
  headerActions,
  footer,
  children,
  className = '',
  style = {},
}) => {
  // Theme color resolution
  const accentColor =
    role === 'ADMIN'
      ? EV_COLORS.purple.primary
      : role === 'CO_OWNER'
      ? EV_COLORS.green.emerald
      : EV_COLORS.cyan.primary;

  const borderColor =
    role === 'ADMIN'
      ? EV_COLORS.purple.border
      : role === 'CO_OWNER'
      ? EV_COLORS.green.border
      : EV_COLORS.cyan.border;

  const boxShadow =
    role === 'ADMIN'
      ? EV_SHADOWS.panelAdmin
      : role === 'CO_OWNER'
      ? EV_SHADOWS.panelCoOwner
      : EV_SHADOWS.panelStandard;

  const panelDimensions = isCompactOverview
    ? EV_PANEL_DIMENSIONS.compactOverview
    : EV_PANEL_DIMENSIONS.standard;

  return (
    <aside
      role="region"
      aria-label={title}
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      className={`evshare-standard-panel ${isCompactOverview ? 'compact-overview' : ''} ${className}`}
      style={{
        position: 'fixed',
        top: panelDimensions.top,
        right: panelDimensions.right,
        width: panelDimensions.width,
        maxWidth: panelDimensions.maxWidth,
        maxHeight: panelDimensions.maxHeight,
        height: isCompactOverview ? 'auto' : undefined,
        bottom: !isCompactOverview && 'bottom' in panelDimensions ? panelDimensions.bottom : undefined,
        boxSizing: 'border-box',
        zIndex: 40,
        background: EV_COLORS.surface.panelBg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1.5px solid ${borderColor}`,
        borderRadius: EV_RADII.xxl,
        boxShadow: boxShadow,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pointerEvents: 'auto',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        animation: `staffPanelSlideIn ${EV_ANIMATIONS.durations.panelSlide}`,
        ...style,
      }}
    >
      {/* 1. Standard Header */}
      <header
        style={{
          padding: '12px 16px',
          background: 'rgba(11, 28, 54, 0.90)',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Quay lại"
              title="Quay lại danh sách"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: EV_COLORS.text.secondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: `all ${EV_ANIMATIONS.durations.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = EV_COLORS.text.pureWhite;
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = EV_COLORS.text.secondary;
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <ArrowLeft size={14} />
            </button>
          )}

          {icon && (
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: `rgba(${role === 'ADMIN' ? '168, 85, 247' : role === 'CO_OWNER' ? '16, 185, 129' : '0, 217, 255'}, 0.15)`,
                border: `1px solid ${accentColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: EV_COLORS.text.pureWhite,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </span>
              {badge}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: '10.5px',
                  color: EV_COLORS.text.secondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {headerActions}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng bảng"
              title="Đóng (Esc)"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: EV_COLORS.text.secondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: `all ${EV_ANIMATIONS.durations.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = EV_COLORS.text.pureWhite;
                e.currentTarget.style.background = EV_COLORS.red.bgSubtle;
                e.currentTarget.style.borderColor = EV_COLORS.red.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = EV_COLORS.text.secondary;
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Content Area with internal scrolling */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {isLoading ? (
          <div
            style={{
              padding: '40px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: EV_COLORS.text.secondary,
            }}
          >
            <Loader2
              size={28}
              style={{
                color: accentColor,
                animation: 'spin 1s linear infinite',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{loadingText}</span>
          </div>
        ) : error ? (
          <div
            role="alert"
            style={{
              padding: '24px 16px',
              borderRadius: EV_RADII.lg,
              background: EV_COLORS.red.bgSubtle,
              border: `1px solid ${EV_COLORS.red.border}`,
              color: EV_COLORS.red.bright,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'center',
            }}
          >
            <AlertTriangle size={24} />
            <div style={{ fontSize: '12px', fontWeight: 700 }}>{error}</div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: `1px solid ${EV_COLORS.red.border}`,
                  borderRadius: EV_RADII.sm,
                  padding: '6px 14px',
                  color: EV_COLORS.text.pureWhite,
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: `all ${EV_ANIMATIONS.durations.fast}`,
                }}
              >
                Thử lại
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </main>

      {/* 3. Footer actions (if provided) */}
      {footer && (
        <footer
          style={{
            padding: '12px 16px',
            background: 'rgba(7, 18, 34, 0.95)',
            borderTop: `1px solid rgba(255, 255, 255, 0.08)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          {footer}
        </footer>
      )}
    </aside>
  );
};
