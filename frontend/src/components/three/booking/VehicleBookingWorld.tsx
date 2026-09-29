import React, { useMemo } from 'react';
import { Html, Billboard } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { fetchVehicleBookings } from '../../../services/bookingApi';
import { SpatialDateSelector3D } from './SpatialDateSelector3D';
import {
  BookingTimeline3D,
  computeBookingLayoutMetrics,
} from './BookingTimeline3D';
import { useWorldStore } from '../../../store/worldStore';
import { Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';

interface VehicleBookingWorldProps {
  vehicle: VehicleResponse;
}

export const VehicleBookingWorld: React.FC<VehicleBookingWorldProps> = ({ vehicle }) => {
  const { size, camera } = useThree();

  const bookingSelectedDate = useWorldStore((state) => state.bookingSelectedDate);
  const bookingStartHour = useWorldStore((state) => state.bookingStartHour);
  const bookingEndHour = useWorldStore((state) => state.bookingEndHour);
  const setBookingSelectedDate = useWorldStore((state) => state.setBookingSelectedDate);
  const setBookingSlot = useWorldStore((state) => state.setBookingSlot);

  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bookings', vehicle.id],
    queryFn: () => fetchVehicleBookings(vehicle.id),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 45,
  });

  // Calculate panel-safe 3D bounds at timeline depth using authoritative layout metrics
  const safeMetrics = useMemo(() => {
    return computeBookingLayoutMetrics(size.width, size.height, camera, 2.4);
  }, [size.width, size.height, camera]);

  const handleSelectDate = (date: Date) => {
    setBookingSelectedDate(date);
    setBookingSlot(null, null);
  };

  const handleSelectSlot = (hour: number) => {
    if (bookingStartHour === null) {
      setBookingSlot(hour, hour + 1);
      return;
    }

    if (hour < bookingStartHour) {
      setBookingSlot(hour, hour + 1);
      return;
    }

    if (hour === bookingStartHour) {
      setBookingSlot(hour, hour + 1);
      return;
    }

    // Check intermediate slots for existing bookings
    let hasConflict = false;
    for (let h = bookingStartHour; h < hour; h++) {
      const slotStart = new Date(bookingSelectedDate);
      slotStart.setHours(h, 0, 0, 0);
      const slotEnd = new Date(bookingSelectedDate);
      slotEnd.setHours(h + 1, 0, 0, 0);

      const isBooked = bookings.some((b) => {
        if (b.status === 'CANCELLED') return false;
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return bStart < slotEnd && bEnd > slotStart;
      });

      if (isBooked) {
        hasConflict = true;
        break;
      }
    }

    if (hasConflict) {
      setBookingSlot(hour, hour + 1);
      return;
    }

    setBookingSlot(bookingStartHour, hour + 1);
  };

  // 1. Loading State in 3D Space
  if (isLoading) {
    return (
      <group position={[safeMetrics.safeCenterX, 2.45, 0.6]}>
        <Billboard follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(8, 12, 22, 0.94)',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                borderRadius: '12px',
                padding: '12px 20px',
                color: '#ffffff',
                fontFamily: 'var(--font-family)',
                fontSize: '12px',
                fontWeight: 600,
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 242, 254, 0.25)',
              }}
            >
              <Sparkles size={14} color="#00f2fe" />
              <span>ĐANG TẢI LỊCH XE...</span>
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  // 2. Error State in 3D Space
  if (isError) {
    return (
      <group position={[safeMetrics.safeCenterX, 2.45, 0.6]}>
        <Billboard follow={true}>
          <Html center distanceFactor={8.5} style={{ pointerEvents: 'auto', userSelect: 'none' }}>
            <div
              style={{
                width: '280px',
                background: 'rgba(15, 10, 20, 0.94)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '14px',
                padding: '16px',
                color: '#f8fafc',
                fontFamily: 'var(--font-family)',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(239, 68, 68, 0.25)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#f87171',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                <AlertTriangle size={15} />
                <span>KHÔNG THỂ TẢI LỊCH XE</span>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                {(error as Error)?.message || 'Không thể kết nối đến máy chủ.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                style={{
                  padding: '6px 14px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={12} />
                THỬ LẠI
              </button>
            </div>
          </Html>
        </Billboard>
      </group>
    );
  }

  return (
    <group>
      {/* 1. Spatial 3D Date Selector (positioned as cohesive cluster above timeline in safe area) */}
      <SpatialDateSelector3D
        selectedDate={bookingSelectedDate}
        onSelectDate={handleSelectDate}
        position={[safeMetrics.safeCenterX, 3.25, 0.6]}
      />

      {/* 2. Pure 3D Interactive Booking Timeline (centered in panel-safe viewport beside EV01) */}
      <BookingTimeline3D
        selectedDate={bookingSelectedDate}
        bookings={bookings}
        startHour={bookingStartHour}
        endHour={bookingEndHour}
        onSelectSlot={handleSelectSlot}
        position={[safeMetrics.safeCenterX, 2.35, 0.6]}
        safeCenterX={safeMetrics.safeCenterX}
        usableSafeWidth={safeMetrics.usableSafeWidth}
        rightSafeX={safeMetrics.rightSafeX}
      />
    </group>
  );
};
