import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useWorldStore } from '../../store/worldStore';
import { fetchVehicles } from '../../services/vehicleApi';
import { VehicleResponse } from '../../types/vehicle';
import { resolveVehicleCode, sortStaffFleetVehicles, isMatchingVehicle } from '../three/vehicles/vehicleModelConfig';
import { FleetVehicleListItem } from './FleetVehicleListItem';
import { fetchPendingReturnTrips } from '../../services/tripApi';
import { TripData } from '../../types/trip';
import { Search, X, AlertCircle, FileCheck2, Car } from 'lucide-react';
import { onboardingApi } from '../../services/onboardingApi';
import { VehicleRegistrationDraftResponse } from '../../types/onboarding';

/**
 * StaffGarageFleetSidebar
 * Section 2 & 3: Collapsible Fleet Drawer
 * - Default State: Closed. Shows only a compact premium car icon near the left edge.
 * - On Click: Slides out clean fleet drawer without taking permanent space or shifting car.
 * - On Select: Updates selected vehicle by authoritative UUID and auto-closes drawer.
 * - Supports Escape key, outside click, and keyboard accessibility.
 */
export const StaffGarageFleetSidebar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'STAFF';
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = isAuthenticated && !!accessToken;

  const selectedVehicleId = useWorldStore((state) => state.selectedVehicleId);
  const selectVehicle = useWorldStore((state) => state.selectVehicle);
  const setVisibleVehicleLabelId = useWorldStore((state) => state.setVisibleVehicleLabelId);
  const vehicleInspectionMode = useWorldStore((state) => state.vehicleInspectionMode);
  const vehicleDamageMappingMode = useWorldStore((state) => state.vehicleDamageMappingMode);
  const isInspecting = vehicleInspectionMode || vehicleDamageMappingMode;
  const setRegistrationReviewModalOpen = useWorldStore((state) => state.setRegistrationReviewModalOpen);
  const isRegistrationReviewModalOpen = useWorldStore((state) => state.isRegistrationReviewModalOpen);

  // Default state: Closed (Section 2)
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);

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

  // TanStack Query for Pending Vehicle Returns
  const { data: pendingReturns = [] } = useQuery<TripData[]>({
    queryKey: ['pendingReturns'],
    queryFn: fetchPendingReturnTrips,
    enabled: authReady,
    refetchInterval: 4000,
  });

  // TanStack Query for Pending Vehicle Registration Applications
  const { data: pendingApplications = [] } = useQuery<VehicleRegistrationDraftResponse[]>({
    queryKey: ['staffPendingApplications'],
    queryFn: () => onboardingApi.getStaffApplications('PENDING'),
    enabled: authReady && (role === 'STAFF' || role === 'ADMIN'),
    refetchInterval: 6000,
  });

  // Sort vehicles: EV01, EV02, EV03... (Single Source of Truth)
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

  // Handle escape key and outside click to close drawer (Section 2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleVehicleSelect = (vehicle: VehicleResponse) => {
    selectVehicle(vehicle.id, role);
    // Section 2: Close drawer after selection
    setIsOpen(false);
  };

  // In inspection, damage mapping, or when review modal is active, hide fleet sidebar completely
  if (isInspecting || isRegistrationReviewModalOpen) {
    return null;
  }

  return (
    <>
      {/* 1. COMPACT PREMIUM FLEET ICON TRIGGER (Default Closed State - Section 2) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Mở danh sách đội xe"
          aria-label="Mở danh sách đội xe"
          style={{
            position: 'absolute',
            top: '76px',
            left: '20px',
            zIndex: 14,
            pointerEvents: 'auto',
            background: 'rgba(8, 16, 28, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.2px solid rgba(0, 242, 254, 0.45)',
            borderRadius: '9999px',
            padding: '7px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 16px rgba(0, 242, 254, 0.2)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00f2fe';
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(0, 0, 0, 0.45), 0 0 22px rgba(0, 242, 254, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.45)';
            e.currentTarget.style.transform = 'scale(1.0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 16px rgba(0, 242, 254, 0.2)';
          }}
        >
          <Car size={16} color="#00f2fe" />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
            ĐỘI XE
          </span>
          <span
            style={{
              background: 'rgba(0, 242, 254, 0.2)',
              color: '#00f2fe',
              fontSize: '10.5px',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '9999px',
              border: '1px solid rgba(0, 242, 254, 0.5)',
            }}
          >
            {vehicles.length}
          </span>
        </button>
      )}

      {/* 2. EXPANDED FLEET DRAWER (Slide In from Left - Section 2) */}
      {isOpen && (
        <aside
          ref={drawerRef}
          aria-label="Danh sách đội xe vận hành"
          style={{
            position: 'absolute',
            top: '76px',
            left: '20px',
            width: '280px',
            maxHeight: 'calc(100vh - 96px)',
            zIndex: 25,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(8, 16, 28, 0.94)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1.2px solid rgba(0, 242, 254, 0.4)',
            borderRadius: '18px',
            padding: '14px 12px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55), 0 0 24px rgba(0, 242, 254, 0.18)',
            color: '#f8fafc',
            boxSizing: 'border-box',
            userSelect: 'none',
            animation: 'fleetSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header: Title, Total Count & Controls */}
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
              <Car size={16} color="#00f2fe" />
              <div>
                <div
                  style={{
                    fontSize: '10.5px',
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
                    fontSize: '17px',
                    fontWeight: 800,
                    color: '#00f2fe',
                    lineHeight: '1.1',
                    marginTop: '1px',
                  }}
                >
                  {vehicles.length}{' '}
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>xe</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Search Toggle Button */}
              <button
                type="button"
                onClick={() => setSearchOpen((prev) => !prev)}
                title="Tìm kiếm xe"
                style={{
                  width: '30px',
                  height: '30px',
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
              >
                <Search size={13} />
              </button>

              {/* Close Drawer Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng bảng đội xe (Esc)"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <X size={14} />
              </button>
            </div>
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

          {/* Registration Review Queue Trigger Button */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setRegistrationReviewModalOpen(true);
            }}
            style={{
              marginBottom: '10px',
              padding: '8px 10px',
              borderRadius: '10px',
              background:
                pendingApplications.length > 0
                  ? 'rgba(245, 158, 11, 0.16)'
                  : 'rgba(0, 242, 254, 0.08)',
              border:
                pendingApplications.length > 0
                  ? '1.2px solid rgba(245, 158, 11, 0.55)'
                  : '1px solid rgba(0, 242, 254, 0.28)',
              color: pendingApplications.length > 0 ? '#fbbf24' : '#38bdf8',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              width: '100%',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileCheck2 size={14} />
              <span>DUYỆT HỒ SƠ ĐĂNG KÝ XE</span>
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '999px',
                background:
                  pendingApplications.length > 0
                    ? 'rgba(245, 158, 11, 0.3)'
                    : 'rgba(148, 163, 184, 0.2)',
                color: '#ffffff',
                fontWeight: 800,
              }}
            >
              {pendingApplications.length}
            </span>
          </button>

          {/* Pending Return Requests Alert (if any) */}
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
            </div>
          )}

          {/* Vehicle List Items (Scrollable) */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingRight: '2px',
            }}
          >
            {isLoading ? (
              <div style={{ padding: '24px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                Đang tải đội xe...
              </div>
            ) : isError ? (
              <div style={{ padding: '16px 8px', textAlign: 'center', color: '#f87171', fontSize: '11px' }}>
                Không thể tải đội xe.
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div style={{ padding: '24px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
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
        </aside>
      )}
    </>
  );
};
