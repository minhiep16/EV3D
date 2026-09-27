import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { Booking } from '../types/booking';
import { VehicleHandoverData } from '../types/handover';
import { TripStartEligibilityData } from '../types/trip';
import { fetchVehicleBookings } from '../services/bookingApi';
import { fetchBookingHandover } from '../services/handoverApi';
import { fetchTripStartEligibility } from '../services/tripApi';

/**
 * Resolves the relevant confirmed booking for an authenticated CO_OWNER on a vehicle.
 * Ensures stable identity matching without relying on unstable array indices.
 */
export function findRelevantCoOwnerBooking(
  bookings: Booking[],
  user: { id?: string; email?: string } | null,
  vehicleId: string
): Booking | null {
  if (!bookings || bookings.length === 0 || !user) return null;

  const now = Date.now();

  // Candidate must belong to authenticated CO_OWNER, EV01, and not be CANCELLED/COMPLETED
  const myConfirmed = bookings
    .filter((b) => {
      if (!b || b.status !== 'CONFIRMED') return false;
      if (b.vehicleId && b.vehicleId !== vehicleId) return false;
      const isMyBooking =
        (!!user.id && b.userId === user.id) ||
        (!!user.email && b.userEmail === user.email);
      return isMyBooking;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  if (myConfirmed.length === 0) return null;

  // Prefer booking that is currently active or upcoming today (end time >= now - 4 hours overtime tolerance)
  const currentOrUpcoming = myConfirmed.find((b) => {
    const end = new Date(b.endTime).getTime();
    return end >= now - 4 * 3600 * 1000;
  });

  return currentOrUpcoming || myConfirmed[0];
}

export interface CoOwnerTripPrerequisitesResult {
  candidateBooking: Booking | null;
  bookingHandover: VehicleHandoverData | null;
  completedHandover: VehicleHandoverData | null;
  tripEligibility: TripStartEligibilityData | null;
  isEligibleToStart: boolean;
  isLoading: boolean;
  isEligibilityError: boolean;
  eligibilityErrorMessage: string | null;
  refetchEligibility: () => void;
}

/**
 * Shared hook implementing the authoritative business identity chain:
 * Authenticated CO_OWNER -> own relevant Booking -> exact VehicleHandover -> handover.status === COMPLETED -> Trip start eligibility
 *
 * Used consistently by both CoOwnerVehiclePanel and TripStartWorld to avoid state drift.
 */
export function useCoOwnerTripPrerequisites(
  vehicleId: string,
  isTripActive: boolean = false
): CoOwnerTripPrerequisitesResult {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const authReady = isAuthenticated && !!accessToken && !!user;

  // 1. Fetch vehicle bookings (stable key shared with schedule)
  const { data: allBookings = [], isLoading: isBookingsLoading } = useQuery<Booking[]>({
    queryKey: ['vehicleBookings', vehicleId],
    queryFn: () => fetchVehicleBookings(vehicleId),
    enabled: authReady && !!vehicleId,
    refetchInterval: 8000,
  });

  // 2. Resolve stable candidate booking for authenticated CO_OWNER
  const candidateBooking = useMemo(() => {
    return findRelevantCoOwnerBooking(allBookings, user, vehicleId);
  }, [allBookings, user, vehicleId]);

  // 3. Fetch exact booking-specific handover (GET /api/bookings/{bookingId}/handover)
  // Replaces the unsafe dependency on /active-handovers
  const {
    data: bookingHandover = null,
    isLoading: isHandoverLoading,
  } = useQuery<VehicleHandoverData | null>({
    queryKey: ['bookingHandover', candidateBooking?.id],
    queryFn: () =>
      candidateBooking?.id ? fetchBookingHandover(candidateBooking.id) : Promise.resolve(null),
    enabled: authReady && !!candidateBooking?.id,
    refetchInterval: 4000,
  });

  // 4. Verify completed handover identity chain
  const completedHandover = useMemo(() => {
    if (!bookingHandover || !candidateBooking || !user) return null;
    const isCompleted =
      bookingHandover.status === 'COMPLETED' || bookingHandover.status === 'OWNER_CONFIRMED';
    const matchesBooking = bookingHandover.bookingId === candidateBooking.id;
    const matchesUser =
      (!user.id || bookingHandover.coOwnerId === user.id) ||
      (!user.email || bookingHandover.coOwnerEmail === user.email);

    if (isCompleted && matchesBooking && matchesUser) {
      return bookingHandover;
    }
    return null;
  }, [bookingHandover, candidateBooking, user]);

  // 5. Query trip start eligibility for stable bookingId (GET /api/bookings/{bookingId}/trip/start-eligibility)
  const {
    data: tripEligibility = null,
    isLoading: isEligibilityLoading,
    isError: isEligibilityError,
    error: eligibilityErrorObj,
    refetch: refetchEligibility,
  } = useQuery<TripStartEligibilityData | null>({
    queryKey: ['tripEligibility', candidateBooking?.id],
    queryFn: () =>
      candidateBooking?.id ? fetchTripStartEligibility(candidateBooking.id) : Promise.resolve(null),
    enabled: authReady && !!completedHandover && !!candidateBooking?.id && !isTripActive,
    refetchInterval: 4000,
  });

  const isEligibleToStart = !isTripActive && !!completedHandover && !!tripEligibility?.eligible;

  const eligibilityErrorMessage = useMemo(() => {
    if (isEligibilityError) {
      return (
        (eligibilityErrorObj as Error)?.message ||
        'Không thể kiểm tra điều kiện bắt đầu chuyến đi.'
      );
    }
    if (completedHandover && tripEligibility && !tripEligibility.eligible) {
      return tripEligibility.message || 'CHƯA ĐẾN THỜI GIAN SỬ DỤNG XE';
    }
    return null;
  }, [isEligibilityError, eligibilityErrorObj, completedHandover, tripEligibility]);

  return {
    candidateBooking,
    bookingHandover,
    completedHandover,
    tripEligibility,
    isEligibleToStart,
    isLoading:
      isBookingsLoading || isHandoverLoading || (isEligibilityLoading && !!completedHandover),
    isEligibilityError,
    eligibilityErrorMessage,
    refetchEligibility,
  };
}
