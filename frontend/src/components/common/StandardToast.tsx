import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { EV_COLORS, EV_RADII, EV_ANIMATIONS } from '../../styles/designTokens';

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  severity: ToastSeverity;
  title?: string;
  message: string;
  durationMs?: number;
  timestamp: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private listeners: Set<ToastListener> = new Set();
  private toasts: ToastItem[] = [];
  private recentMessages: Map<string, number> = new Map();
  private readonly DEDUP_WINDOW_MS = 2500;
  private readonly MAX_TOASTS = 3;

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  public show(severity: ToastSeverity, message: string, title?: string, durationMs: number = 4000): string | null {
    if (!message || !message.trim()) return null;

    const trimmedMsg = message.trim();
    const now = Date.now();
    const lastSeen = this.recentMessages.get(trimmedMsg);

    // Prevent duplicate toast spamming within window
    if (lastSeen && now - lastSeen < this.DEDUP_WINDOW_MS) {
      return null;
    }
    this.recentMessages.set(trimmedMsg, now);

    // Clean old deduplication entries
    if (this.recentMessages.size > 20) {
      this.recentMessages.forEach((time, key) => {
        if (now - time > this.DEDUP_WINDOW_MS) {
          this.recentMessages.delete(key);
        }
      });
    }

    const id = `toast-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = {
      id,
      severity,
      title,
      message: trimmedMsg,
      durationMs,
      timestamp: now,
    };

    // Keep within MAX_TOASTS
    if (this.toasts.length >= this.MAX_TOASTS) {
      this.toasts = this.toasts.slice(1);
    }
    this.toasts.push(newToast);
    this.notify();

    // Auto-dismiss after duration
    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }

    return id;
  }

  public dismiss(id: string): void {
    const idx = this.toasts.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.toasts.splice(idx, 1);
      this.notify();
    }
  }

  public clearAll(): void {
    this.toasts = [];
    this.notify();
  }
}

export const toastManager = new ToastManager();

export const showToast = {
  success: (message: string, title?: string, durationMs?: number) =>
    toastManager.show('success', message, title, durationMs),
  error: (message: string, title?: string, durationMs: number = 5500) =>
    toastManager.show('error', message, title, durationMs),
  warning: (message: string, title?: string, durationMs: number = 4500) =>
    toastManager.show('warning', message, title, durationMs),
  info: (message: string, title?: string, durationMs?: number) =>
    toastManager.show('info', message, title, durationMs),
  dismiss: (id: string) => toastManager.dismiss(id),
};

const SEVERITY_CONFIG: Record<
  ToastSeverity,
  { icon: React.ReactNode; borderColor: string; glowColor: string; titleDefault: string }
> = {
  success: {
    icon: <CheckCircle2 size={16} color={EV_COLORS.green.bright} />,
    borderColor: EV_COLORS.green.border,
    glowColor: EV_COLORS.green.glow,
    titleDefault: 'Thành công',
  },
  error: {
    icon: <AlertCircle size={16} color={EV_COLORS.red.bright} />,
    borderColor: EV_COLORS.red.border,
    glowColor: EV_COLORS.red.glow,
    titleDefault: 'Có lỗi xảy ra',
  },
  warning: {
    icon: <AlertTriangle size={16} color={EV_COLORS.amber.bright} />,
    borderColor: EV_COLORS.amber.border,
    glowColor: EV_COLORS.amber.glow,
    titleDefault: 'Cảnh báo',
  },
  info: {
    icon: <Info size={16} color={EV_COLORS.cyan.bright} />,
    borderColor: EV_COLORS.cyan.border,
    glowColor: EV_COLORS.cyan.glow,
    titleDefault: 'Thông báo',
  },
};

/**
 * StandardToastContainer
 * Positioned in bottom-left corner so it NEVER covers:
 * - Top header & navigation controls
 * - Right operational panels (Staff / Admin / Co-Owner)
 * - Bottom centered carousels (Staff 7-function / Co-Owner 8-function)
 */
export const StandardToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Thông báo tương tác"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
        maxWidth: '380px',
        width: 'calc(100vw - 48px)',
      }}
    >
      <style>{`
        @keyframes toastSlideInUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      {toasts.map((toast) => {
        const config = SEVERITY_CONFIG[toast.severity];
        return (
          <div
            key={toast.id}
            role={toast.severity === 'error' ? 'alert' : 'status'}
            style={{
              pointerEvents: 'auto',
              background: 'rgba(8, 24, 44, 0.94)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1.2px solid ${config.borderColor}`,
              borderRadius: EV_RADII.lg,
              boxShadow: `0 12px 30px rgba(0, 0, 0, 0.65), 0 0 16px ${config.glowColor}`,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              animation: 'toastSlideInUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <div style={{ flexShrink: 0, marginTop: '2px' }}>{config.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: EV_COLORS.text.pureWhite,
                  letterSpacing: '0.02em',
                  marginBottom: '2px',
                }}
              >
                {toast.title || config.titleDefault}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: EV_COLORS.text.secondary,
                  lineHeight: 1.35,
                  wordBreak: 'break-word',
                }}
              >
                {toast.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => toastManager.dismiss(toast.id)}
              aria-label="Đóng thông báo"
              style={{
                background: 'transparent',
                border: 'none',
                color: EV_COLORS.text.muted,
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                flexShrink: 0,
                transition: `all ${EV_ANIMATIONS.durations.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = EV_COLORS.text.pureWhite;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = EV_COLORS.text.muted;
              }}
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
