import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GarageErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GarageErrorBoundary] Root Garage scene crash caught:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(135deg, #070c18 0%, #0d1b2a 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f8fafc',
            fontFamily: 'var(--font-family, sans-serif)',
            padding: '24px',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          {/* Topbar Logo Branding */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '24px',
              fontWeight: 950,
            }}
          >
            <span style={{ color: '#22e6ff', textShadow: '0 0 16px rgba(34, 230, 255, 0.8)' }}>EV</span>
            <span style={{ color: '#ffffff' }}>EVShare</span>
          </div>

          <div
            style={{
              maxWidth: '460px',
              padding: '36px',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(239, 68, 68, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid rgba(239, 68, 68, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                marginBottom: '16px',
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px 0' }}>
              HỆ THỐNG GẶP SỰ CỐ HIỂN THỊ
            </h2>

            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              {this.state.error?.message || 'Đã xảy ra lỗi kết xuất giao diện. Bạn có thể tải lại trang để tiếp tục trải nghiệm.'}
            </p>

            <button
              type="button"
              onClick={this.handleReset}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #22e6ff 100%)',
                color: '#071426',
                border: 'none',
                borderRadius: '9999px',
                padding: '10px 24px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 16px rgba(34, 230, 255, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <RotateCcw size={15} />
              <span>TẢI LẠI TRANG</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
