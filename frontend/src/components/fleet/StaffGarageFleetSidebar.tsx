import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useWorldStore } from '../../store/worldStore';
import { fetchVehicles } from '../../services/vehicleApi';
import { VehicleResponse } from '../../types/vehicle';
import { resolveVehicleCode, sortStaffFleetVehicles, isMatchingVehicle } from '../three/vehicles/vehicleModelConfig';
import { FleetVehicleListItem } from './FleetVehicleListItem';
import { fetchPendingReturnTrips } from '../../services/tripApi';
import { TripData } from '../../types/trip';
import { formatTime } from '../../utils/dateTimeUtils';
import { Search, X, RefreshCw, AlertCircle, ArrowRight, Clock } from 'lucide-react';

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

  // TanStack Query for Pending Vehicle Returns (STEP 2: STAFF receives vehicle)
  const { data: pendingReturns = [] } = useQuery<TripData[]>({
    queryKey: ['pendingReturns'],
    queryFn: fetchPendingReturnTrips,
    enabled: authReady,
    refetchInterval: 4000,
  });

  // Sort: EV01 first, EV02 second, then remaining fleet (Single Source of Truth)
  const sortedVehicles = useMemo(() => {
    return sortStaffFleetVehicles(vehicles);
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

      {/* Pending Return Requests Queue (STEP 2: STAFF receives vehicle) */}
      {pendingReturns.length > 0 && (
        <div
          style={{
            marginBottom: '10px',
            padding: '8px',
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontWeight: 800,
              color: '#00f2fe',
              letterSpacing: '0.04em',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertCircle size={13} color="#00f2fe" />
              <span>XE CHỜ TIẾP NHẬN</span>
            </div>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '999px',
                background: 'rgba(0, 242, 254, 0.25)',
                color: '#ffffff',
                fontWeight: 800,
              }}
            >
              {pendingReturns.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
            {pendingReturns.map((trip) => {
              const vCode = trip.vehicleCode || trip.vehicleName || 'EV01';
              const plate = trip.licensePlate || '51E-123.45';
              const userFullName = trip.userName || 'Đồng sở hữu';
              const bookingRef = trip.bookingId ? `#${trip.bookingId.substring(0, 8).toUpperCase()}` : '--';
              const tripRef = trip.id ? `#${trip.id.substring(0, 8).toUpperCase()}` : '--';
              const startTimeStr = formatTime(trip.startedAt);
              const reqTimeStr = formatTime(trip.returnRequestedAt);

              return (
                <div
                  key={trip.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#ffffff' }}>{vCode}</span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: '#fbbf24',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}
                    >
                      CHỜ NHẬN XE
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Biển số:</span>
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{plate}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Người đi:</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>{userFullName}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Lịch đặt:</span>
                    <span style={{ color: '#cbd5e1' }}>{bookingRef}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Chuyến đi:</span>
                    <span style={{ color: '#cbd5e1' }}>{tripRef}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Bắt đầu:</span>
                    <span style={{ color: '#e2e8f0' }}>{startTimeStr}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Yêu cầu trả:</span>
                    <span style={{ color: '#00f2fe', fontWeight: 600 }}>{reqTimeStr}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => selectVehicle(trip.vehicleId, role)}
                    style={{
                      marginTop: '4px',
                      width: '100%',
                      padding: '5px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.3), rgba(6, 182, 212, 0.4))',
                      border: '1px solid #00f2fe',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 8px rgba(0, 242, 254, 0.25)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.45), rgba(6, 182, 212, 0.6))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.3), rgba(6, 182, 212, 0.4))';
                    }}
                  >
                    <span>TIẾP NHẬN XE</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              );
            })}
          </div>
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
            const isSelected = isMatchingVehicle(vehicle, selectedVehicleId);

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
