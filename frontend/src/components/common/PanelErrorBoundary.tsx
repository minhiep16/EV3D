import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * PanelErrorBoundary - Error containment for business panel area.
 * Prevents errors inside right-side panels (like StaffVehicleDetailPanel)
 * from crashing the root React tree or destroying the 3D WebGL Canvas.
 */
export class PanelErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PanelErrorBoundary] Business panel encountered an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <aside
          role="complementary"
          aria-label="Panel Error State"
          style={{
            position: 'absolute',
            top: '72px',
            right: '20px',
            bottom: '20px',
            width: '360px',
            background: 'rgba(8, 14, 26, 0.94)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.15)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              marginBottom: '14px',
            }}
          >
            <AlertTriangle size={22} />
          </div>

          <h3
            style={{
              color: '#f8fafc',
              fontSize: '14px',
              fontWeight: 800,
              letterSpacing: '0.02em',
              marginBottom: '8px',
            }}
          >
            {this.props.fallbackTitle || 'Không thể hiển thị bảng điều khiển.'}
          </h3>

          <p
            style={{
              color: '#94a3b8',
              fontSize: '11px',
              lineHeight: '1.5',
              marginBottom: '18px',
              maxWidth: '280px',
            }}
          >
            {this.state.error?.message || 'Đã xảy ra sự cố trong quá trình kết xuất dữ liệu.'}
          </p>

          <button
            type="button"
            onClick={this.handleReset}
            style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#082f49',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
            }}
          >
            <RotateCcw size={13} />
            <span>THỬ LẠI</span>
          </button>
        </aside>
      );
    }

    return this.props.children;
  }
}
