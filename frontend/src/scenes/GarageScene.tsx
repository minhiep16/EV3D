import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EVShareWorld } from '../components/three/EVShareWorld';
import { SpatialOverviewButton } from '../components/three/SpatialOverviewButton';
import { useAuthStore } from '../store/authStore';
import { logoutApi } from '../services/authApi';
import { LogOut, Warehouse } from 'lucide-react';

export const GarageScene: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    await logoutApi();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Pure 3D Virtual Garage World */}
      <EVShareWorld />

      {/* Spatial Action: Return to Garage Overview */}
      <SpatialOverviewButton />

      {/* Non-intrusive Top Corner Status Bar */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            background: 'rgba(10, 15, 29, 0.78)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '9999px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Warehouse size={14} color="#38bdf8" />
          <span>{user?.fullName || 'Đồng sở hữu'}</span>
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '4px',
            }}
          >
            {user?.role === 'CO_OWNER'
              ? 'ĐỒNG SỞ HỮU'
              : user?.role === 'STAFF'
              ? 'NHÂN VIÊN'
              : user?.role === 'ADMIN'
              ? 'QUẢN TRỊ VIÊN'
              : user?.role || 'ĐỒNG SỞ HỮU'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          title="Đăng xuất khỏi Garage 3D"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '9999px',
            padding: '7px 14px',
            color: '#f87171',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
          }}
        >
          <LogOut size={13} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default GarageScene;
