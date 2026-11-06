import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Key, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { onboardingApi } from '../../services/onboardingApi';

interface InviteCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteCodeModal: React.FC<InviteCodeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setError(null);
    setLoading(true);
    try {
      await onboardingApi.redeemInviteCode({ inviteCode: inviteCode.trim() });
      alert('Nhập mã mời thành công! Bạn đã chính thức gia nhập nhóm đồng sở hữu.');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Mã mời không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 30, 50, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        pointerEvents: 'auto',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(255, 255, 255, 0.94)',
          borderRadius: '20px',
          border: '1.5px solid rgba(0, 201, 216, 0.45)',
          boxShadow: '0 20px 50px rgba(0, 180, 200, 0.16), 0 4px 16px rgba(0, 0, 0, 0.04)',
          padding: '28px 32px',
          color: '#24374c',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px' }}>🔑</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#009e9d', letterSpacing: '1px' }}>
                EVSHARE 3D CODE REDEMPTION
              </span>
            </div>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '19px', fontWeight: 900 }}>
              NHẬP MÃ MỜI ĐỒNG SỞ HỮU
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(241, 245, 249, 0.8)',
              border: 'none',
              color: '#60748c',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>

        <p style={{ fontSize: '12.5px', color: '#60748c', lineHeight: 1.5, marginBottom: '20px' }}>
          Nếu bạn đã nhận được mã mời tham gia nhóm từ người đại diện (qua email hoặc tin nhắn), hãy nhập mã vào ô dưới đây để kích hoạt tư cách thành viên.
        </p>

        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#dc2626',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={15} color="#dc2626" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              MÃ MỜI (8 - 14 KÝ TỰ)
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="VD: INV-VF8-9921"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1.5px solid rgba(0, 201, 216, 0.5)',
                color: '#009e9d',
                fontWeight: 800,
                fontSize: '17px',
                letterSpacing: '2px',
                textAlign: 'center',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(0, 201, 216, 0.1)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '9999px',
                background: 'rgba(241, 245, 249, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#60748c',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 24px',
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, #00c9d8 0%, #009e9d 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(0, 180, 200, 0.35)',
              }}
            >
              {loading ? 'Đang kích hoạt...' : 'Xác nhận mã mời'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
