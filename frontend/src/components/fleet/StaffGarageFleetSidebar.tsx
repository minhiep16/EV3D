import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useWorldStore } from '../../store/worldStore';
import { fetchVehicles } from '../../services/vehicleApi';
import { VehicleResponse } from '../../types/vehicle';
import { resolveVehicleCode } from '../three/vehicles/vehicleModelConfig';
import { FleetVehicleListItem } from './FleetVehicleListItem';
import { Search, X, RefreshCw } from 'lucide-react';

export const StaffGarageFleetSidebar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'STAFF';
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = isAuthenticated && !!accessToken;

  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const selectVehicle = useWorldStore((state) => state.selectVehicle);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const isInspecting = vehicleInspectionMode || vehicleDamageMappingMode;

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Authoritative TanStack Query for vehicles (shares memory cache)
  const {
    data: vehicles = [],
    isLoading,
    isError,
  } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
    enabled: authReady,
    staleTime: 6000,
  });

  // Sort: EV01 first, EV02 second, then remaining fleet
  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => {
      const codeA = resolveVehicleCode(a);
      const codeB = resolveVehicleCode(b);
      if (codeA === 'EV01' && codeB !== 'EV01') return -1;
      if (codeA !== 'EV01' && codeB === 'EV01') return 1;
      return 0;
    });
  }, [vehicles]);

  // Filtered vehicles based on search query
  const filteredVehicles = useMemo(() => {
    if (!searchQuery.trim()) return sortedVehicles;
    const q = searchQuery.toLowerCase().trim();
    return sortedVehicles.filter((v) => {
      const code = resolveVehicleCode(v).toLowerCase();
      const name = (v.name || '').toLowerCase();
      const model = (v.model || '').toLowerCase();
      const plate = (v.licensePlate || '').toLowerCase();
      const status = (v.status || '').toLowerCase();

      return (
        code.includes(q) ||
        name.includes(q) ||
        model.includes(q) ||
        plate.includes(q) ||
        status.includes(q) ||
        (q.includes('sẵn') && status === 'available') ||
        (q.includes('sạc') && status === 'charging') ||
        (q.includes('bảo') && (status === 'maintenance' || status === 'in_service')) ||
        (q.includes('dụng') && status === 'in_use') ||
        (q.includes('giao') && status === 'reserved')
      );
    });
  }, [sortedVehicles, searchQuery]);

  const handleVehicleSelect = (vehicle: VehicleResponse) => {
    selectVehicle(vehicle.id, role);
  };

  // In inspection or damage mapping mode, collapse sidebar to give vehicle maximum viewport
  if (isInspecting) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '72px',
        left: '20px',
        width: '240px',
        maxHeight: 'calc(100vh - 96px)',
        zIndex: 10,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8, 16, 28, 0.90)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(56, 189, 248, 0.28)',
        borderRadius: '16px',
        padding: '14px 12px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45), 0 0 18px rgba(0, 242, 254, 0.12)',
        color: '#f8fafc',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
    >
      {/* Header: Title, Big Count & Search Icon Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#94a3b8',
              textTransform: 'uppercase',
            }}
          >
            ĐỘI XE
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#00f2fe',
              letterSpacing: '-0.02em',
              lineHeight: '1.2',
              marginTop: '1px',
            }}
          >
            {vehicles.length}{' '}
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>xe</span>
          </div>
        </div>

        {/* Circular Search Icon Toggle Button */}
        <button
          type="button"
          onClick={() => setSearchOpen((prev) => !prev)}
          title="Tìm kiếm xe"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: searchOpen ? 'rgba(0, 242, 254, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            border: searchOpen ? '1px solid #00f2fe' : '1px solid rgba(56, 189, 248, 0.25)',
            color: searchOpen ? '#00f2fe' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#00f2fe';
          }}
          onMouseLeave={(e) => {
            if (!searchOpen) {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
            }
          }}
        >
          <Search size={14} />
        </button>
      </div>

      {/* Expandable Search Input */}
      {searchOpen && (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã xe, tên, biển số..."
            autoFocus
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(0, 242, 254, 0.5)',
              borderRadius: '8px',
              padding: '6px 24px 6px 10px',
              fontSize: '11px',
              color: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '6px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* Scrollable Vehicle Items List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          paddingRight: '2px',
          maxHeight: 'calc(100vh - 220px)',
        }}
      >
        {isLoading ? (
          <div
            style={{
              padding: '24px 10px',
              textAlign: 'center',
              color: '#38bdf8',
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={16} className="animate-spin" />
            <span>Đang tải đội xe...</span>
          </div>
        ) : isError ? (
          <div
            style={{
              padding: '16px 8px',
              textAlign: 'center',
              color: '#f87171',
              fontSize: '11px',
            }}
          >
            Không thể tải đội xe.
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div
            style={{
              padding: '24px 8px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '11px',
            }}
          >
            {searchQuery ? 'Không tìm thấy xe.' : 'Chưa có xe vận hành.'}
          </div>
        ) : (
          filteredVehicles.map((vehicle, idx) => {
            const code = resolveVehicleCode(vehicle);
            const isSelected =
              selectedVehicleId === vehicle.id ||
              selectedVehicleId === code;

            return (
              <FleetVehicleListItem
                key={vehicle.id || code}
                vehicle={vehicle}
                index={idx}
                isSelected={isSelected}
                onSelect={handleVehicleSelect}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
