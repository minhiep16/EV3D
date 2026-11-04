import React, { useState } from 'react';
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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 10, 25, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(135deg, rgba(13, 26, 48, 0.96), rgba(7, 15, 30, 0.98))',
          borderRadius: '16px',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 242, 254, 0.25)',
          padding: '24px',
          color: '#e2e8f0',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '18px' }}>NHẬP MÃ MỜI ĐỒNG SỞ HỮU</h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
          Nếu bạn đã nhận được mã mời tham gia nhóm từ người đại diện (qua email hoặc tin nhắn), hãy nhập mã vào ô dưới đây.
        </p>

        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              MÃ MỜI (8 - 12 KÝ TỰ)
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
                borderRadius: '8px',
                background: 'rgba(2, 6, 23, 0.8)',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                color: '#00f2fe',
                fontWeight: 700,
                fontSize: '16px',
                letterSpacing: '2px',
                textAlign: 'center',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00f2fe, #0284c7)',
                border: 'none',
                color: '#050914',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)',
              }}
            >
              {loading ? 'Đang kích hoạt...' : 'Xác nhận mã'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

