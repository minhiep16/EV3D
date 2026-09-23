import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { loginApi } from '../../services/authApi';
import { useAuthStore } from '../../store/authStore';
import { LogIn, AlertTriangle, UserPlus, Sparkles } from 'lucide-react';
import { HolographicPanelFrame3D } from '../three/HolographicPanelFrame3D';

interface SpatialLoginPanelProps {
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void;
}

export const SpatialLoginPanel: React.FC<SpatialLoginPanelProps> = ({
  onLoginSuccess,
  onSwitchToRegister,
}) => {
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('owner_a@evshare.com');
  const [password, setPassword] = useState('SecretPassword123!');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ cả email và mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await loginApi({ email: email.trim(), password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      // Trigger portal activation and camera transition
      onLoginSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      setLoading(false);
    }
  };

  return (
    <group position={[0, 1.5, 0]}>
      {/* 3D Holographic Border & Emitter Frame */}
      <HolographicPanelFrame3D width={3.0} height={3.6} color="#00f2fe" depth={-0.08} />

      <Html
        transform
        distanceFactor={6}
        position={[0, 0, 0]}
        style={{
          width: '420px',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            background: 'rgba(10, 15, 29, 0.88)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            color: '#f8fafc',
            fontFamily: 'var(--font-family)',
          }}
        >
          {/* Spatial Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px',
                background: 'rgba(56, 189, 248, 0.12)',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '10px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              <Sparkles size={13} />
              Xác thực Cổng Không Gian
            </div>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 40%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '6px',
              }}
            >
              EVShare 3D
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>
              Cổng truy cập Garage ảo đồng sở hữu xe điện
            </p>
          </div>

          {/* Spatial Error State */}
          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#fca5a5',
                fontSize: '13px',
                marginBottom: '20px',
                animation: 'pulseRed 2s infinite',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* World-space Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94a3b8',
                  marginBottom: '6px',
                }}
              >
                Địa chỉ Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@evshare.com"
                disabled={loading}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94a3b8',
                  marginBottom: '6px',
                }}
              >
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={loading}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Spatial Action Button with Hover & Loading Feedback */}
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setHoveredButton(true)}
              onMouseLeave={() => setHoveredButton(false)}
              style={{
                width: '100%',
                padding: '13px',
                background: hoveredButton
                  ? 'linear-gradient(135deg, #0284c7 0%, #00f2fe 100%)'
                  : 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
                color: '#ffffff',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: hoveredButton
                  ? '0 0 25px rgba(0, 242, 254, 0.6)'
                  : '0 0 15px rgba(14, 165, 233, 0.3)',
                transform: hoveredButton && !loading ? 'translateY(-2px)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: loading ? 0.8 : 1,
              }}
            >
              <LogIn size={16} />
              {loading ? 'ĐANG KÍCH HOẠT CỔNG...' : 'TRUY CẬP GARAGE'}
            </button>
          </form>

          {/* Switch to Register */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center',
              fontSize: '13px',
              color: '#94a3b8',
            }}
          >
            Chưa có tài khoản đồng sở hữu?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '2px 6px',
              }}
            >
              Đăng ký tài khoản
            </button>
          </div>
        </div>
      </Html>
    </group>
  );
};
