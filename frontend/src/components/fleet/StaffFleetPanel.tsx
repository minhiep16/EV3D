import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useWorldStore } from '../../store/worldStore';
import { fetchVehicles } from '../../services/vehicleApi';
import { VehicleResponse, VehicleStatus } from '../../types/vehicle';
import { resolveVehicleCode } from '../three/vehicles/vehicleModelConfig';
import { FleetFilterControls, FleetFilterKey } from './FleetFilterControls';
import { FleetVehicleItem } from './FleetVehicleItem';
import {
  Car,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const StaffFleetPanel: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'STAFF';
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = isAuthenticated && !!accessToken;

  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const isVehicleSelected = useWorldStore((state) => state.isVehicleSelected);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const selectVehicle = useWorldStore((state) => state.selectVehicle);
  const clearSelection = useWorldStore((state) => state.clearSelection);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FleetFilterKey>('ALL');
  const [isManualCollapsed, setIsManualCollapsed] = useState<boolean | null>(null);

  // Authoritative TanStack Query for vehicles (shares cache with 3D scene)
  const {
    data: vehicles = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<VehicleResponse[]>({
    queryKey: ['vehicles', user?.role, user?.id],
    queryFn: fetchVehicles,
    enabled: authReady,
    staleTime: 6000,
  });

  // Responsive panel mode:
  // In vehicle focus or inspection, collapse to compact rail unless manually expanded by staff
  const isFocusedOrInspecting = Boolean(
    selectedVehicleId || isVehicleSelected || vehicleInspectionMode || vehicleDamageMappingMode
  );
  const isCollapsed = isManualCollapsed !== null ? isManualCollapsed : isFocusedOrInspecting;

  // Filter & Search Logic
  const filteredVehicles = useMemo(() => {
    let list = [...vehicles].sort((a, b) => {
      const codeA = resolveVehicleCode(a);
      const codeB = resolveVehicleCode(b);
      if (codeA === 'EV01' && codeB !== 'EV01') return -1;
      if (codeA !== 'EV01' && codeB === 'EV01') return 1;
      return 0;
    });

    // 1. Status Filter
    if (activeFilter !== 'ALL') {
      list = list.filter((v) => {
        const s = (v.status || '').toUpperCase();
        if (activeFilter === 'AVAILABLE') return s === 'AVAILABLE';
        if (activeFilter === 'CHARGING') return s === 'CHARGING';
        if (activeFilter === 'MAINTENANCE') return s === 'MAINTENANCE' || s === 'IN_SERVICE';
        if (activeFilter === 'RESERVED') return s === 'RESERVED';
        if (activeFilter === 'IN_USE') return s === 'IN_USE';
        return true;
      });
    }

    // 2. Text Search Filter (code, name, model, licensePlate, or status)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((v) => {
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
    }

    return list;
  }, [vehicles, activeFilter, searchQuery]);

  // Counts per filter category
  const filterCounts = useMemo(() => {
    const counts: Record<FleetFilterKey, number> = {
      ALL: vehicles.length,
      AVAILABLE: 0,
      CHARGING: 0,
      MAINTENANCE: 0,
      RESERVED: 0,
      IN_USE: 0,
    };

    vehicles.forEach((v) => {
      const s = (v.status || '').toUpperCase();
      if (s === 'AVAILABLE') counts.AVAILABLE++;
      else if (s === 'CHARGING') counts.CHARGING++;
      else if (s === 'MAINTENANCE' || s === 'IN_SERVICE') counts.MAINTENANCE++;
      else if (s === 'RESERVED') counts.RESERVED++;
      else if (s === 'IN_USE') counts.IN_USE++;
    });

    return counts;
  }, [vehicles]);

  const handleVehicleSelect = (vehicle: VehicleResponse) => {
    selectVehicle(vehicle.id, role);
  };

  // =========================================================================
  // Compact Rail Mode (Docked on left during Focus/Inspection)
  // =========================================================================
  if (isCollapsed) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '72px',
          left: '20px',
          zIndex: 10,
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(8, 16, 28, 0.88)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          padding: '10px 8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), 0 0 16px rgba(0, 242, 254, 0.15)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Expand Panel Toggle Button */}
        <button
          type="button"
          onClick={() => setIsManualCollapsed(false)}
          title="Mở rộng danh sách đội xe"
          style={{
            background: 'rgba(0, 242, 254, 0.15)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00f2fe',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 242, 254, 0.3)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 242, 254, 0.15)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <ChevronRight size={18} />
        </button>

        {/* Small Divider */}
        <div style={{ width: '24px', height: '1px', background: 'rgba(56, 189, 248, 0.2)', margin: '2px 0' }} />

        {/* Mini Vehicle Switcher Chips */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
          }}
        >
          {vehicles.map((v) => {
            const code = resolveVehicleCode(v);
            const isSelected =
              selectedVehicleId === v.id ||
              selectedVehicleId === code;

            const isEV01 = code === 'EV01';
            const isEV02 = code === 'EV02';
            const color = isEV01 ? '#00f2fe' : isEV02 ? '#f59e0b' : '#38bdf8';

            return (
              <button
                key={v.id || code}
                type="button"
                onClick={() => handleVehicleSelect(v)}
                title={`${v.name || code} — ${v.status}`}
                style={{
                  background: isSelected
                    ? `rgba(${isEV01 ? '0, 242, 254' : '245, 158, 11'}, 0.25)`
                    : 'rgba(15, 23, 42, 0.75)',
                  border: isSelected
                    ? `1.5px solid ${color}`
                    : '1px solid rgba(56, 189, 248, 0.2)',
                  boxShadow: isSelected ? `0 0 12px ${color}` : 'none',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSelected ? '#ffffff' : color,
                  fontWeight: 800,
                  fontSize: '11px',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                <span>{code.replace('EV', '')}</span>
                <span
                  style={{
                    position: 'absolute',
                    bottom: '3px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor:
                      v.status === 'AVAILABLE'
                        ? '#10b981'
                        : v.status === 'CHARGING'
                        ? '#00f2fe'
                        : v.status === 'MAINTENANCE'
                        ? '#ef4444'
                        : '#f59e0b',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // Expanded Fleet Panel (Overview or Staff Full Inspection Access)
  // =========================================================================
  return (
    <div
      style={{
        position: 'absolute',
        top: '72px',
        left: '20px',
        width: '320px',
        maxHeight: 'calc(100vh - 96px)',
        zIndex: 10,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8, 16, 28, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '16px',
        padding: '14px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 242, 254, 0.12)',
        color: '#f8fafc',
        boxSizing: 'border-box',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Header: Title, Total Badge & Collapse Toggle */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f2fe',
            }}
          >
            <Car size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.06em', color: '#f8fafc' }}>
              ĐỘI XE
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>
              Quản lý đội xe vận hành
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Total Vehicles Count Pill */}
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            {vehicles.length} xe
          </span>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={() => setIsManualCollapsed(true)}
            title="Thu nhỏ thanh quản lý xe"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Search Input Box */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <Search
          size={14}
          color="#64748b"
          style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo mã xe, tên xe, trạng thái..."
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '8px',
            padding: '7px 28px 7px 30px',
            fontSize: '11px',
            color: '#ffffff',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#00f2fe';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '8px',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <FleetFilterControls
        activeFilter={activeFilter}
        counts={filterCounts}
        onFilterChange={setActiveFilter}
      />

      {/* Scrollable Vehicle Cards List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          marginTop: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '2px',
          maxHeight: 'calc(100vh - 290px)',
        }}
      >
        {isLoading ? (
          <div
            style={{
              padding: '28px 12px',
              textAlign: 'center',
              color: '#38bdf8',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={18} className="animate-spin" />
            <span>Đang tải đội xe...</span>
          </div>
        ) : isError ? (
          <div
            style={{
              padding: '20px 12px',
              textAlign: 'center',
              color: '#f87171',
              fontSize: '11px',
            }}
          >
            Không thể tải danh sách xe vận hành.
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div
            style={{
              padding: '28px 12px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '12px',
            }}
          >
            {searchQuery || activeFilter !== 'ALL'
              ? 'Không tìm thấy xe phù hợp.'
              : 'Chưa có xe vận hành.'}
          </div>
        ) : (
          filteredVehicles.map((vehicle) => {
            const code = resolveVehicleCode(vehicle);
            const isSelected =
              selectedVehicleId === vehicle.id ||
              selectedVehicleId === code;

            return (
              <FleetVehicleItem
                key={vehicle.id || code}
                vehicle={vehicle}
                isSelected={isSelected}
                role={role}
                allVehicles={vehicles}
                onSelect={handleVehicleSelect}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
