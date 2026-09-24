import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { EVShareWorld } from '../components/three/EVShareWorld';
import { useAuthStore } from '../store/authStore';
import { useWorldStore } from '../store/worldStore';
import { logoutApi } from '../services/authApi';
import { LogOut, Warehouse, ArrowLeft, ShieldCheck, Eye, Sparkles, RotateCcw } from 'lucide-react';

export const GarageScene: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const resetExperienceState = useWorldStore((state) => state.resetExperienceState);
  const vehicleFeatureMode = useWorldStore((state) => state.vehicleFeatureMode);
  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const selectedZone = useWorldStore((state) => state.selectedZone);
  const clearSelection = useWorldStore((state) => state.clearSelection);
  const returnToVehicleOverview = useWorldStore((state) => state.returnToVehicleOverview);
  const vehicleCoOwnershipMode = useWorldStore((state) => state.vehicleCoOwnershipMode);
  const vehicleBookingMode = useWorldStore((state) => state.vehicleBookingMode);
  const vehicleHandoverMode = useWorldStore((state) => state.vehicleHandoverMode);
  const vehicleReceiptReviewMode = useWorldStore((state) => state.vehicleReceiptReviewMode);
  const vehicleTripStartMode = useWorldStore((state) => state.vehicleTripStartMode);
  const vehicleTripVisualizationMode = useWorldStore((state) => state.vehicleTripVisualizationMode);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);

  // Session Isolation: Whenever authenticated user changes, reset all transient experience states
  useEffect(() => {
    resetExperienceState();
  }, [user?.id, user?.role, resetExperienceState]);

  const showBackToVehicle =
    vehicleCoOwnershipMode ||
    vehicleBookingMode ||
    vehicleHandoverMode ||
    vehicleReceiptReviewMode ||
    vehicleTripStartMode ||
    vehicleTripVisualizationMode ||
    vehicleInspectionMode ||
    vehicleFeatureMode === 'CO_OWNER_VEHICLE_INFO' ||
    vehicleFeatureMode === 'CO_OWNER_MY_BOOKINGS';

  const showBackToGarageOverview =
    (!!selectedVehicleId || !!selectedZone) && !showBackToVehicle;

  const handleBackToVehicle = () => {
    returnToVehicleOverview();
  };

  const handleLogout = async () => {
    resetExperienceState();
    queryClient.clear();
    await logoutApi();
    navigate('/login', { replace: true });
  };

  const modeBadge = useMemo(() => {
    if (user?.role === 'STAFF') {
      return {
        label: 'CHẾ ĐỘ VẬN HÀNH — NHÂN VIÊN',
        icon: <ShieldCheck size={12} color="#00f2fe" />,
        bg: 'rgba(2, 132, 199, 0.2)',
        border: '1px solid rgba(0, 242, 254, 0.45)',
        color: '#00f2fe',
        shadow: '0 0 12px rgba(0, 242, 254, 0.25)',
      };
    }
    if (user?.role === 'ADMIN') {
      return {
        label: 'CHẾ ĐỘ QUẢN TRỊ — ADMIN',
        icon: <Eye size={12} color="#c084fc" />,
        bg: 'rgba(124, 58, 237, 0.2)',
        border: '1px solid rgba(168, 85, 247, 0.45)',
        color: '#c084fc',
        shadow: '0 0 12px rgba(168, 85, 247, 0.25)',
      };
    }
    return {
      label: 'CHẾ ĐỘ ĐỒNG SỞ HỮU',
      icon: <Sparkles size={12} color="#10b981" />,
      bg: 'rgba(5, 150, 105, 0.18)',
      border: '1px solid rgba(16, 185, 129, 0.45)',
      color: '#34d399',
      shadow: '0 0 12px rgba(16, 185, 129, 0.25)',
    };
  }, [user?.role]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Pure 3D Virtual Garage World */}
      <EVShareWorld />

      {/* Screen-space Utility Control: Top-Left [ ← QUAY LẠI XE ] in Co-ownership or Booking Mode */}
      {showBackToVehicle && (
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
            onClick={handleBackToVehicle}
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

      {/* Screen-space Utility Control: Top-Left [ QUAY LẠI TOÀN CẢNH GARAGE ] when Vehicle is selected */}
      {showBackToGarageOverview && (
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
            onClick={() => clearSelection()}
            title="Quay lại toàn cảnh garage"
            style={{
              background: 'rgba(10, 15, 29, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0, 242, 254, 0.5)',
              borderRadius: '9999px',
              padding: '7px 16px',
              color: '#00f2fe',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6), 0 0 12px rgba(0, 242, 254, 0.25)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 242, 254, 0.22)';
              e.currentTarget.style.borderColor = '#38bdf8';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 242, 254, 0.5)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(10, 15, 29, 0.85)';
              e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.5)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.6), 0 0 12px rgba(0, 242, 254, 0.25)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <RotateCcw size={13} color="#00f2fe" />
            <span>QUAY LẠI TOÀN CẢNH GARAGE</span>
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
        {/* Role Mode Identity Badge */}
        <div
          style={{
            background: modeBadge.bg,
            backdropFilter: 'blur(12px)',
            border: modeBadge.border,
            boxShadow: modeBadge.shadow,
            borderRadius: '9999px',
            padding: '6px 14px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: modeBadge.color,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
          }}
        >
          {modeBadge.icon}
          <span>{modeBadge.label}</span>
        </div>
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
