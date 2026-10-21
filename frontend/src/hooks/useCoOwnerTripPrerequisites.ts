import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { Booking } from '../types/booking';
import { VehicleHandoverData } from '../types/handover';
import { TripData, TripStartEligibilityData } from '../types/trip';
import { fetchVehicleBookings } from '../services/bookingApi';
import { fetchBookingHandover } from '../services/handoverApi';
import { fetchBookingTrip, fetchTripStartEligibility } from '../services/tripApi';

/**
 * Resolves the relevant confirmed booking for an authenticated CO_OWNER on a vehicle.
 * Strictly scopes to current/upcoming non-completed bookings.
 * NEVER falls back to arbitrary array[0] or historical completed bookings.
 */
export function findRelevantCoOwnerBooking(
  bookings: Booking[],
  user: { id?: string; email?: string } | null,
  vehicleId: string
): Booking | null {
  if (!bookings || bookings.length === 0 || !user || !vehicleId) return null;

  const now = Date.now();

  // Candidate must belong to authenticated CO_OWNER, selected vehicle, and not be CANCELLED, COMPLETED, or EXPIRED
  const myValidBookings = bookings
    .filter((b) => {
      if (!b) return false;
      if (b.status === 'CANCELLED' || b.status === 'COMPLETED' || b.status === 'EXPIRED') return false;
      if (b.vehicleId && b.vehicleId !== vehicleId) return false;
      const isMyBooking =
        (!!user.id && b.userId === user.id) ||
        (!!user.email && b.userEmail === user.email);
      if (!isMyBooking) return false;

      // End time must not be in the past (overdue bookings cannot be used for trip start)
      const end = new Date(b.endTime).getTime();
      if (isNaN(end) || end <= now) return false;

      return true;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  if (myValidBookings.length === 0) return null;

  // 1. Current active booking window: startTime <= now <= endTime
  const ongoing = myValidBookings.find((b) => {
    const start = new Date(b.startTime).getTime();
    const end = new Date(b.endTime).getTime();
    return start <= now && end >= now;
  });
  if (ongoing) return ongoing;

  // 2. Earliest upcoming booking (startTime > now)
  const upcoming = myValidBookings.find((b) => {
    const start = new Date(b.startTime).getTime();
    return start > now;
  });
  if (upcoming) return upcoming;

  return null;
}

export interface CoOwnerTripPrerequisitesResult {
  candidateBooking: Booking | null;
  bookingHandover: VehicleHandoverData | null;
  completedHandover: VehicleHandoverData | null;
  bookingTrip: TripData | null;
  tripEligibility: TripStartEligibilityData | null;
  isEligibleToStart: boolean;
  isInspectionOnlyCompleted: boolean;
  isWaitingForStaff: boolean;
  isLoading: boolean;
  isEligibilityError: boolean;
  eligibilityErrorMessage: string | null;
  refetchEligibility: () => void;
}

/**
 * Shared hook implementing the authoritative business identity chain:
 * Authenticated CO_OWNER -> own relevant Booking -> exact VehicleHandover -> confirmed by STAFF -> Trip start eligibility
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

  // 1. Fetch vehicle bookings scoped to vehicle and authenticated user
  const { data: allBookings = [], isLoading: isBookingsLoading } = useQuery<Booking[]>({
    queryKey: ['vehicleBookings', vehicleId, user?.id],
    queryFn: () => fetchVehicleBookings(vehicleId),
    enabled: authReady && !!vehicleId,
    refetchInterval: 8000,
  });

  // 2. Resolve stable candidate booking for authenticated CO_OWNER
  const candidateBooking = useMemo(() => {
    return findRelevantCoOwnerBooking(allBookings, user, vehicleId);
  }, [allBookings, user, vehicleId]);

  // 3. Fetch exact booking-specific handover (GET /api/bookings/{bookingId}/handover)
  const {
    data: bookingHandover = null,
    isLoading: isHandoverLoading,
  } = useQuery<VehicleHandoverData | null>({
    queryKey: ['bookingHandover', user?.id, candidateBooking?.id],
    queryFn: () =>
      candidateBooking?.id ? fetchBookingHandover(candidateBooking.id) : Promise.resolve(null),
    enabled: authReady && !!candidateBooking?.id,
    refetchInterval: 4000,
  });

  // 4. Fetch trip for candidate booking to detect completed trips
  const { data: bookingTrip = null, isLoading: isBookingTripLoading } = useQuery<TripData | null>({
    queryKey: ['bookingTrip', user?.id, candidateBooking?.id],
    queryFn: () =>
      candidateBooking?.id ? fetchBookingTrip(candidateBooking.id) : Promise.resolve(null),
    enabled: authReady && !!candidateBooking?.id,
    refetchInterval: 4000,
  });

  // 5. Verify completed handover identity chain
  const completedHandover = useMemo(() => {
    if (!bookingHandover || !candidateBooking || !user) return null;
    const isConfirmedStatus =
      bookingHandover.status === 'HANDED_OVER' ||
      bookingHandover.status === 'OWNER_CONFIRMED' ||
      bookingHandover.status === 'COMPLETED';
    const matchesBooking = bookingHandover.bookingId === candidateBooking.id;
    const matchesVehicle = !bookingHandover.vehicleId || bookingHandover.vehicleId === vehicleId;
    const matchesUser =
      (!user.id || bookingHandover.coOwnerId === user.id) ||
      (!user.email || bookingHandover.coOwnerEmail === user.email);
    const notCancelled = bookingHandover.status !== 'CANCELLED';

    // Must have staff confirmation
    const hasStaffHandover = !!(
      bookingHandover.staffHandedOverAt ||
      bookingHandover.staffId ||
      bookingHandover.staffName ||
      bookingHandover.status === 'HANDED_OVER' ||
      bookingHandover.status === 'OWNER_CONFIRMED' ||
      bookingHandover.status === 'COMPLETED'
    );

    // Historical completed trip cannot restart
    const tripAlreadyCompleted = bookingTrip?.status === 'COMPLETED';

    if (
      isConfirmedStatus &&
      matchesBooking &&
      matchesVehicle &&
      matchesUser &&
      notCancelled &&
      hasStaffHandover &&
      !tripAlreadyCompleted
    ) {
      return bookingHandover;
    }
    return null;
  }, [bookingHandover, candidateBooking, user, vehicleId, bookingTrip]);

  // 6. Pre-handover inspection completed, but staff handover still pending
  const isInspectionOnlyCompleted = useMemo(() => {
    if (!bookingHandover || !candidateBooking) return false;
    const isInspectionReady =
      bookingHandover.status === 'READY_FOR_HANDOVER' ||
      (bookingHandover.allCheckpointsInspected &&
        bookingHandover.status !== 'HANDED_OVER' &&
        bookingHandover.status !== 'OWNER_CONFIRMED' &&
        bookingHandover.status !== 'COMPLETED');
    return isInspectionReady;
  }, [bookingHandover, candidateBooking]);

  const isWaitingForStaff = useMemo(() => {
    if (!candidateBooking) return false;
    if (completedHandover || isInspectionOnlyCompleted) return false;
    return true;
  }, [candidateBooking, completedHandover, isInspectionOnlyCompleted]);

  // 7. Query trip start eligibility for stable bookingId (GET /api/bookings/{bookingId}/trip/start-eligibility)
  const {
    data: tripEligibility = null,
    isLoading: isEligibilityLoading,
    isError: isEligibilityError,
    error: eligibilityErrorObj,
    refetch: refetchEligibility,
  } = useQuery<TripStartEligibilityData | null>({
    queryKey: ['tripEligibility', user?.id, candidateBooking?.id],
    queryFn: () =>
      candidateBooking?.id ? fetchTripStartEligibility(candidateBooking.id) : Promise.resolve(null),
    enabled: authReady && !!completedHandover && !!candidateBooking?.id && !isTripActive,
    refetchInterval: 4000,
  });

  const isEligibleToStart =
    !isTripActive &&
    !!completedHandover &&
    bookingTrip?.status !== 'COMPLETED' &&
    !!tripEligibility?.eligible;

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
    bookingTrip,
    tripEligibility,
    isEligibleToStart,
    isInspectionOnlyCompleted,
    isWaitingForStaff,
    isLoading:
      isBookingsLoading ||
      (!!candidateBooking && isHandoverLoading) ||
      (!!candidateBooking && isBookingTripLoading) ||
      (isEligibilityLoading && !!completedHandover),
    isEligibilityError,
    eligibilityErrorMessage,
    refetchEligibility,
  };
}
