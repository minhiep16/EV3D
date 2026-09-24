package com.evshare.trip.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.handover.entity.HandoverStatus;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.trip.dto.TripResponse;
import com.evshare.trip.dto.TripStartEligibilityResponse;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class TripService {

    /**
     * Time tolerance before booking.startTime during which CO_OWNER may begin trip.
     * Centralized configuration constant (Section 14).
     */
    public static final long START_WINDOW_EARLY_TOLERANCE_MINUTES = 30;

    // Standardized business error reason codes (Section 21)
    public static final String REASON_HANDOVER_NOT_COMPLETED = "HANDOVER_NOT_COMPLETED";
    public static final String MSG_HANDOVER_NOT_COMPLETED = "CHƯA HOÀN TẤT BÀN GIAO XE";

    public static final String REASON_TOO_EARLY = "TOO_EARLY";
    public static final String MSG_TOO_EARLY = "CHƯA ĐẾN THỜI GIAN SỬ DỤNG XE";

    public static final String REASON_BOOKING_EXPIRED = "BOOKING_EXPIRED";
    public static final String MSG_BOOKING_EXPIRED = "LỊCH ĐẶT KHÔNG CÒN HIỆU LỰC";

    public static final String REASON_NOT_BOOKING_OWNER = "NOT_BOOKING_OWNER";
    public static final String MSG_NOT_BOOKING_OWNER = "BẠN KHÔNG CÓ QUYỀN BẮT ĐẦU CHUYẾN ĐI NÀY";

    public static final String REASON_TRIP_ALREADY_ACTIVE = "TRIP_ALREADY_ACTIVE";
    public static final String MSG_TRIP_ALREADY_ACTIVE = "CHUYẾN ĐI ĐÃ ĐƯỢC BẮT ĐẦU";

    public static final String REASON_VEHICLE_IN_USE = "VEHICLE_IN_USE";
    public static final String MSG_VEHICLE_IN_USE = "XE ĐANG ĐƯỢC SỬ DỤNG";

    public static final String REASON_HANDOVER_DATA_INCONSISTENT = "HANDOVER_DATA_INCONSISTENT";
    public static final String MSG_HANDOVER_DATA_INCONSISTENT = "DỮ LIỆU BÀN GIAO KHÔNG HỢP LỆ";

    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;
    private final VehicleHandoverRepository handoverRepository;
    private final VehicleRepository vehicleRepository;

    public TripService(
            TripRepository tripRepository,
            BookingRepository bookingRepository,
            VehicleHandoverRepository handoverRepository,
            VehicleRepository vehicleRepository
    ) {
        this.tripRepository = tripRepository;
        this.bookingRepository = bookingRepository;
        this.handoverRepository = handoverRepository;
        this.vehicleRepository = vehicleRepository;
    }

    /**
     * Compute trip start eligibility purely read-only without modifying database state.
     * Section 11 & 23: GET eligibility must NEVER mutate data or create Trip.
     */
    @Transactional(readOnly = true)
    public TripStartEligibilityResponse checkStartEligibility(UUID bookingId, UUID currentUserId, Role currentUserRole) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch đặt với mã: " + bookingId));

        UUID vehicleId = booking.getVehicle() != null ? booking.getVehicle().getId() : null;

        // 1. Role validation: Must be CO_OWNER
        if (currentUserRole != Role.CO_OWNER) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_NOT_BOOKING_OWNER,
                    MSG_NOT_BOOKING_OWNER,
                    bookingId,
                    vehicleId,
                    null
            );
        }

        // 2. Ownership validation: Must belong to current authenticated user
        if (booking.getUser() == null || !booking.getUser().getId().equals(currentUserId)) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_NOT_BOOKING_OWNER,
                    MSG_NOT_BOOKING_OWNER,
                    bookingId,
                    vehicleId,
                    null
            );
        }

        // 3. Booking status validation
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_BOOKING_EXPIRED,
                    MSG_BOOKING_EXPIRED,
                    bookingId,
                    vehicleId,
                    null
            );
        }

        // 4. VehicleHandover existence and status validation (Section 4 & 5)
        Optional<VehicleHandover> handoverOpt = handoverRepository.findByBookingId(bookingId);
        if (handoverOpt.isEmpty()) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_HANDOVER_NOT_COMPLETED,
                    MSG_HANDOVER_NOT_COMPLETED,
                    bookingId,
                    vehicleId,
                    null
            );
        }

        VehicleHandover handover = handoverOpt.get();
        String handoverStatusStr = handover.getStatus() != null ? handover.getStatus().name() : null;

        if (handover.getStatus() != HandoverStatus.COMPLETED) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_HANDOVER_NOT_COMPLETED,
                    MSG_HANDOVER_NOT_COMPLETED,
                    bookingId,
                    vehicleId,
                    handoverStatusStr
            );
        }

        // 5. Handover identity chain integrity check (Section 1 & 4)
        if (handover.getBooking() == null || !handover.getBooking().getId().equals(booking.getId()) ||
            handover.getVehicle() == null || !handover.getVehicle().getId().equals(booking.getVehicle().getId()) ||
            handover.getCoOwner() == null || !handover.getCoOwner().getId().equals(booking.getUser().getId())) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_HANDOVER_DATA_INCONSISTENT,
                    MSG_HANDOVER_DATA_INCONSISTENT,
                    bookingId,
                    vehicleId,
                    handoverStatusStr
            );
        }

        // 6. Time window check (Section 14)
        Instant now = Instant.now();
        Instant earliestAllowedStart = booking.getStartTime().minus(Duration.ofMinutes(START_WINDOW_EARLY_TOLERANCE_MINUTES));
        if (now.isBefore(earliestAllowedStart)) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_TOO_EARLY,
                    MSG_TOO_EARLY,
                    bookingId,
                    vehicleId,
                    handoverStatusStr
            );
        }

        if (now.isAfter(booking.getEndTime())) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_BOOKING_EXPIRED,
                    MSG_BOOKING_EXPIRED,
                    bookingId,
                    vehicleId,
                    handoverStatusStr
            );
        }

        // 7. Check if trip already exists for this booking (Section 9)
        Optional<Trip> existingTrip = tripRepository.findByBookingId(bookingId);
        if (existingTrip.isPresent() && existingTrip.get().getStatus() == TripStatus.ACTIVE) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_TRIP_ALREADY_ACTIVE,
                    MSG_TRIP_ALREADY_ACTIVE,
                    bookingId,
                    vehicleId,
                    handoverStatusStr
            );
        }

        // 8. Check if vehicle is already in use by another active trip (Section 10)
        Optional<Trip> activeVehicleTrip = tripRepository.findByVehicleIdAndStatus(booking.getVehicle().getId(), TripStatus.ACTIVE);
        if (activeVehicleTrip.isPresent() && !activeVehicleTrip.get().getBooking().getId().equals(bookingId)) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_VEHICLE_IN_USE,
                    MSG_VEHICLE_IN_USE,
                    bookingId,
                    vehicleId,
                    handoverStatusStr
            );
        }

        // 9. Load authoritative vehicle telemetry
        Vehicle vehicle = vehicleRepository.findById(booking.getVehicle().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phương tiện với mã: " + booking.getVehicle().getId()));

        return TripStartEligibilityResponse.eligible(
                booking.getId(),
                vehicle.getId(),
                HandoverStatus.COMPLETED.name(),
                vehicle.getCurrentBatteryLevel(),
                vehicle.getOdometer()
        );
    }

    /**
     * Start Trip Transaction (Section 12).
     * Atomic, concurrency-safe start trip workflow.
     */
    @Transactional
    public TripResponse startTrip(UUID bookingId, UUID currentUserId, Role currentUserRole) {
        // 1. Role validation: Must be CO_OWNER (STAFF/ADMIN cannot start trip)
        if (currentUserRole != Role.CO_OWNER) {
            throw new AccessDeniedException(MSG_NOT_BOOKING_OWNER);
        }

        // 2. Load Booking
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch đặt với mã: " + bookingId));

        // 3. Ownership validation
        if (booking.getUser() == null || !booking.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException(MSG_NOT_BOOKING_OWNER);
        }

        // 4. Booking status validation
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException(MSG_BOOKING_EXPIRED);
        }

        // 5. Handover check (Section 4 & 5: Source of truth is VehicleHandover.status == COMPLETED)
        VehicleHandover handover = handoverRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalStateException(MSG_HANDOVER_NOT_COMPLETED));

        if (handover.getStatus() != HandoverStatus.COMPLETED) {
            throw new IllegalStateException(MSG_HANDOVER_NOT_COMPLETED);
        }

        // 6. Handover data consistency validation
        if (handover.getBooking() == null || !handover.getBooking().getId().equals(booking.getId()) ||
            handover.getVehicle() == null || !handover.getVehicle().getId().equals(booking.getVehicle().getId()) ||
            handover.getCoOwner() == null || !handover.getCoOwner().getId().equals(booking.getUser().getId())) {
            throw new IllegalStateException(MSG_HANDOVER_DATA_INCONSISTENT);
        }

        // 7. Time window validation (Section 14)
        Instant now = Instant.now();
        Instant earliestAllowedStart = booking.getStartTime().minus(Duration.ofMinutes(START_WINDOW_EARLY_TOLERANCE_MINUTES));
        if (now.isBefore(earliestAllowedStart)) {
            throw new IllegalStateException(MSG_TOO_EARLY);
        }
        if (now.isAfter(booking.getEndTime())) {
            throw new IllegalStateException(MSG_BOOKING_EXPIRED);
        }

        // 8. Prevent duplicate trip for booking (Section 9 & 13)
        Optional<Trip> existingTrip = tripRepository.findByBookingId(bookingId);
        if (existingTrip.isPresent()) {
            throw new DuplicateResourceException(MSG_TRIP_ALREADY_ACTIVE);
        }

        // 9. Prevent concurrent active trip on the same vehicle (Section 10)
        boolean hasActiveTripOnVehicle = tripRepository.existsByVehicleIdAndStatus(booking.getVehicle().getId(), TripStatus.ACTIVE);
        if (hasActiveTripOnVehicle) {
            throw new IllegalStateException(MSG_VEHICLE_IN_USE);
        }

        // 10. Re-read authoritative vehicle data for snapshots
        Vehicle vehicle = vehicleRepository.findById(booking.getVehicle().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phương tiện"));

        // 11. Create Trip (Section 2 & 12)
        Trip trip = new Trip(
                UUID.randomUUID(),
                booking,
                vehicle,
                booking.getUser(),
                TripStatus.ACTIVE,
                now,
                vehicle.getOdometer(),
                vehicle.getCurrentBatteryLevel()
        );

        // 12. Update vehicle operational status to IN_USE (Section 12 item 14)
        vehicle.setStatus(VehicleStatus.IN_USE);
        vehicleRepository.save(vehicle);

        Trip savedTrip = tripRepository.save(trip);
        return TripResponse.fromEntity(savedTrip);
    }

    /**
     * Retrieve trip associated with a booking (Section 11).
     */
    @Transactional(readOnly = true)
    public Optional<TripResponse> getTripByBookingId(UUID bookingId, UUID currentUserId, Role currentUserRole) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch đặt với mã: " + bookingId));

        if (currentUserRole == Role.CO_OWNER && (booking.getUser() == null || !booking.getUser().getId().equals(currentUserId))) {
            throw new AccessDeniedException(MSG_NOT_BOOKING_OWNER);
        }

        return tripRepository.findByBookingId(bookingId).map(TripResponse::fromEntity);
    }

    /**
     * Retrieve active trip for a vehicle (for reload restoration & operations monitoring).
     */
    @Transactional(readOnly = true)
    public Optional<TripResponse> getActiveTripForVehicle(UUID vehicleId) {
        return tripRepository.findByVehicleIdAndStatus(vehicleId, TripStatus.ACTIVE).map(TripResponse::fromEntity);
    }

    /**
     * Retrieve trip by trip ID (purely read-only query).
     * For CO_OWNER: trip.userId == authenticatedUser.id (Requirement 1 & 28).
     */
    @Transactional(readOnly = true)
    public Optional<TripResponse> getTripById(UUID tripId, UUID currentUserId, Role currentUserRole) {
        Trip trip = tripRepository.findById(tripId).orElse(null);
        if (trip == null) {
            return Optional.empty();
        }
        if (currentUserRole == Role.CO_OWNER && (trip.getUser() == null || !trip.getUser().getId().equals(currentUserId))) {
            throw new AccessDeniedException("BẠN KHÔNG CÓ QUYỀN XEM CHUYẾN ĐI NÀY");
        }
        return Optional.of(TripResponse.fromEntity(trip));
    }
}
