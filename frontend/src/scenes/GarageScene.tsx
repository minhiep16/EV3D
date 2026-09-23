import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EVShareWorld } from '../components/three/EVShareWorld';
import { useAuthStore } from '../store/authStore';
import { useWorldStore } from '../store/worldStore';
import { logoutApi } from '../services/authApi';
import { LogOut, Warehouse, ArrowLeft } from 'lucide-react';

export const GarageScene: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const vehicleCoOwnershipMode = useWorldStore((state) => state.vehicleCoOwnershipMode);
  const exitVehicleCoOwnershipMode = useWorldStore((state) => state.exitVehicleCoOwnershipMode);

  const handleLogout = async () => {
    await logoutApi();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Pure 3D Virtual Garage World */}
      <EVShareWorld />

      {/* Screen-space Utility Control: Top-Left [ ← QUAY LẠI XE ] in Co-ownership Mode */}
      {vehicleCoOwnershipMode && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '24px',
            zIndex: 10,
            pointerEvents: 'auto',
          }}
        >
          <button
            type="button"
            onClick={exitVehicleCoOwnershipMode}
            title="Quay lại xe điện EV01"
            style={{
              background: 'rgba(10, 15, 29, 0.82)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              borderRadius: '9999px',
              padding: '7px 16px',
              color: '#f3e8ff',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6), 0 0 12px rgba(168, 85, 247, 0.25)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.22)';
              e.currentTarget.style.borderColor = '#c084fc';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.5)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(10, 15, 29, 0.82)';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.6), 0 0 12px rgba(168, 85, 247, 0.25)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <ArrowLeft size={14} color="#c084fc" />
            <span>QUAY LẠI XE</span>
          </button>
        </div>
      )}

      {/* Screen-space User / Profile / Logout Utility Control */}
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
