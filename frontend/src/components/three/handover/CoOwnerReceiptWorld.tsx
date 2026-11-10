import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import {
  HANDOVER_CHECKPOINTS,
  VehicleHandoverData,
  VehicleHandoverEligibilityResponse,
  getCheckpointByCode,
} from '../../../types/handover';
import { Booking } from '../../../types/booking';
import {
  fetchActiveVehicleHandovers,
  fetchBookingHandover,
  fetchHandoverEligibility,
} from '../../../services/handoverApi';
import { fetchVehicleBookings } from '../../../services/bookingApi';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';
import { HandoverHotspot3D } from './HandoverHotspot3D';

interface CoOwnerReceiptWorldProps {
  vehicle: VehicleResponse;
}

export const CoOwnerReceiptWorld: React.FC<CoOwnerReceiptWorldProps> = ({ vehicle }) => {
  const user = useAuthStore((state) => state.user);

  const selectedHandoverCheckpoint = useWorldStore(
    (state) => state.selectedHandoverCheckpoint
  );
  const selectHandoverCheckpoint = useWorldStore(
    (state) => state.selectHandoverCheckpoint
  );
  const clearHandoverCheckpointSelection = useWorldStore(
    (state) => state.clearHandoverCheckpointSelection
  );

  // TanStack Query: Handover Eligibility for vehicle
  const { data: eligibility } = useQuery<VehicleHandoverEligibilityResponse>({
    queryKey: ['handoverEligibility', vehicle.id],
    queryFn: () => fetchHandoverEligibility(vehicle.id),
    staleTime: 5000,
  });

  // TanStack Query: Bookings for vehicle to resolve authoritative bookingId
  const { data: allBookings = [] } = useQuery<Booking[]>({
    queryKey: ['vehicleBookings', vehicle.id],
    queryFn: () => fetchVehicleBookings(vehicle.id),
    staleTime: 10000,
  });

  // Resolve target booking ID authoritatively
  const targetBookingId = useMemo(() => {
    const now = new Date();
    const myBookings = allBookings.filter(
      (b) => b && b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && b.status !== 'EXPIRED' && (!user?.id || b.userId === user?.id)
    );
    if (myBookings.length > 0) {
      const activeOrUpcoming = myBookings.find((b) => b.endTime && new Date(b.endTime) >= now);
      if (activeOrUpcoming) return activeOrUpcoming.id;
    }
    if (eligibility?.bookingId) return eligibility.bookingId;
    return null;
  }, [eligibility?.bookingId, allBookings, user?.id]);

  // TanStack Query: Handover by booking
  const { data: bookingHandover } = useQuery<VehicleHandoverData | null>({
    queryKey: ['handoverByBooking', targetBookingId],
    queryFn: () => (targetBookingId ? fetchBookingHandover(targetBookingId) : null),
    enabled: !!targetBookingId,
    staleTime: 0,
  });

  // TanStack Query: Fetch active vehicle handovers
  const { data: activeHandovers = [] } = useQuery<VehicleHandoverData[]>({
    queryKey: ['activeVehicleHandovers', vehicle.id, user?.id],
    queryFn: () => fetchActiveVehicleHandovers(vehicle.id),
    staleTime: 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.length === 0) return 8000;
      const my = data.find(
        (h) => h && (!user?.id || h.coOwnerId === user?.id || h.coOwnerEmail === user?.email)
      );
      if (!my) return 8000;
      if (my.status === 'HANDED_OVER' || my.status === 'OWNER_CONFIRMED' || my.status === 'COMPLETED') {
        return false;
      }
      return 8000;
    },
  });

  // Resolve current CO_OWNER handover strictly from server state matching current booking
  const handover = useMemo(() => {
    if (!targetBookingId) return null;
    if (bookingHandover && bookingHandover.bookingId === targetBookingId) {
      return bookingHandover;
    }
    const list = Array.isArray(activeHandovers) ? activeHandovers : [];
    if (list.length > 0) {
      const myHandover = list.find(
        (h) =>
          h && h.bookingId === targetBookingId && (!user?.id || h.coOwnerId === user.id || h.coOwnerEmail === user.email)
      );
      if (myHandover) return myHandover;
    }
    if (eligibility?.handover && eligibility.bookingId === targetBookingId) {
      return eligibility.handover;
    }
    return null;
  }, [bookingHandover, activeHandovers, eligibility, targetBookingId, user?.id, user?.email]);

  // Session Isolation: Clear selected checkpoint on unmount
  useEffect(() => {
    return () => {
      clearHandoverCheckpointSelection();
    };
  }, [clearHandoverCheckpointSelection]);

  return (
    <group name="CoOwnerReceiptWorld">
      {/* 3D Inspection Hotspots on EV (Read-Only for CO_OWNER, clean indicator dots) */}
      {HANDOVER_CHECKPOINTS.map((checkpoint) => {
        const inspection = (handover?.inspections || []).find(
          (i) => i.vehiclePartCode === checkpoint.code
        );
        const isSelected = selectedHandoverCheckpoint === checkpoint.code;

        return (
          <HandoverHotspot3D
            key={checkpoint.code}
            checkpoint={checkpoint}
            inspection={inspection}
            isSelected={isSelected}
            onSelect={(code) => {
              if (selectedHandoverCheckpoint === code) {
                clearHandoverCheckpointSelection();
              } else {
                selectHandoverCheckpoint(code);
              }
            }}
            canInteract={true}
          />
        );
      })}
    </group>
  );
};
