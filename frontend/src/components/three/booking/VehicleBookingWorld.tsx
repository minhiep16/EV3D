import React, { useState } from 'react';
import { Html, Billboard } from '@react-three/drei';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import { fetchVehicleBookings, createVehicleBooking } from '../../../services/bookingApi';
import { SpatialDateSelector3D } from './SpatialDateSelector3D';
import { BookingTimeline3D } from './BookingTimeline3D';
import { HolographicBookingSummary } from './HolographicBookingSummary';
import { Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';

interface VehicleBookingWorldProps {
  vehicle: VehicleResponse;
}

export const VehicleBookingWorld: React.FC<VehicleBookingWorldProps> = ({ vehicle }) => {
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    // If past 20:00, default to tomorrow for immediate availability convenience
    if (d.getHours() >= 20) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  });

  const [startHour, setStartHour] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setStartHour(null);
    setEndHour(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSelectSlot = (hour: number) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (startHour === null) {
      setStartHour(hour);
      setEndHour(hour + 1);
      return;
    }

    if (hour < startHour) {
      setStartHour(hour);
      setEndHour(hour + 1);
      return;
    }

    if (hour === startHour) {
      setEndHour(hour + 1);
      return;
    }

    // Check intermediate slots for existing bookings
    let hasConflict = false;
    for (let h = startHour; h < hour; h++) {
      const slotStart = new Date(selectedDate);
      slotStart.setHours(h, 0, 0, 0);
      const slotEnd = new Date(selectedDate);
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
      setErrorMessage('Khung giờ này đã được đặt. Vui lòng chọn thời gian khác.');
      setStartHour(hour);
      setEndHour(hour + 1);
      return;
    }

    setEndHour(hour + 1);
  };

  const handleConfirmBooking = async () => {
    if (startHour === null || endHour === null) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const startTime = new Date(selectedDate);
      startTime.setHours(startHour, 0, 0, 0);

      const endTime = new Date(selectedDate);
      endTime.setHours(endHour, 0, 0, 0);

      await createVehicleBooking(vehicle.id, {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        purpose: 'Đặt lịch sử dụng xe điện EV01',
      });

      setSuccessMessage('ĐẶT XE THÀNH CÔNG');
      await queryClient.invalidateQueries({ queryKey: ['bookings', vehicle.id] });

      setTimeout(() => {
        setStartHour(null);
        setEndHour(null);
        setSuccessMessage(null);
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Khung giờ này đã được đặt. Vui lòng chọn thời gian khác.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSelection = () => {
    setStartHour(null);
    setEndHour(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // 1. Loading State in 3D Space
  if (isLoading) {
    return (
      <group position={[3.2, 1.5, 2.4]}>
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
      <group position={[3.2, 1.5, 2.4]}>
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
                {(error as Error)?.message || 'Vui lòng kiểm tra lại kết nối mạng.'}
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

  const hasSelection = startHour !== null && endHour !== null;

  return (
    <group>
      {/* 1. Spatial 3D Date Selector (positioned as cohesive cluster above timeline) */}
      <SpatialDateSelector3D
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        position={[3.2, 2.15, 2.4]}
      />

      {/* 2. Pure 3D Interactive Booking Timeline (centered in viewport beside EV01) */}
      <BookingTimeline3D
        selectedDate={selectedDate}
        bookings={bookings}
        startHour={startHour}
        endHour={endHour}
        onSelectSlot={handleSelectSlot}
        position={[3.2, 1.25, 2.4]}
      />

      {/* 3. Holographic Booking Summary Panel & Spatial Laser Link */}
      {hasSelection && (
        <HolographicBookingSummary
          vehicleName={vehicle.name || 'EV01 - VinFast VF e34'}
          selectedDate={selectedDate}
          startHour={startHour}
          endHour={endHour}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          successMessage={successMessage}
          onConfirm={handleConfirmBooking}
          onCancel={handleCancelSelection}
          timelinePosition={[4.8, 1.25, 2.4]}
          panelPosition={[7.3, 1.55, 0.8]}
        />
      )}
    </group>
  );
};
