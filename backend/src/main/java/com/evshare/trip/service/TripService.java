package com.evshare.trip.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.handover.entity.HandoverStatus;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.battery.repository.VehicleBatteryHealthRepository;
import com.evshare.trip.dto.TripEnergyCalculationResult;
import com.evshare.trip.dto.TripResponse;
import com.evshare.trip.dto.TripStartEligibilityResponse;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.charging.repository.ChargingSessionRepository;
import com.evshare.expense.service.ExpenseService;
import com.evshare.trip.dto.ConfirmTripReturnRequest;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
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

    public static final String REASON_NOT_TRIP_OWNER = "NOT_TRIP_OWNER";
    public static final String MSG_NOT_TRIP_OWNER = "BẠN KHÔNG CÓ QUYỀN KẾT THÚC CHUYẾN ĐI NÀY";

    public static final String REASON_TRIP_ALREADY_COMPLETED = "TRIP_ALREADY_COMPLETED";
    public static final String MSG_TRIP_ALREADY_COMPLETED = "CHUYẾN ĐI ĐÃ ĐƯỢC KẾT THÚC";

    public static final String REASON_TRIP_NOT_ACTIVE = "TRIP_NOT_ACTIVE";
    public static final String MSG_TRIP_NOT_ACTIVE = "KHÔNG CÓ CHUYẾN ĐI ĐANG HOẠT ĐỘNG";

    public static final String MSG_ONLY_CO_OWNER_CHECKOUT = "CHỈ CHỦ SỞ HỮU CHUYẾN ĐI MỚI CÓ QUYỀN TRẢ XE";

    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;
    private final VehicleHandoverRepository handoverRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleEnergyModelService energyModelService;
    private final VehicleBatteryHealthRepository batteryHealthRepository;
    private final ExpenseService expenseService;
    private final UserRepository userRepository;
    private final ChargingSessionRepository chargingSessionRepository;

    public TripService(
            TripRepository tripRepository,
            BookingRepository bookingRepository,
            VehicleHandoverRepository handoverRepository,
            VehicleRepository vehicleRepository,
            VehicleEnergyModelService energyModelService,
            VehicleBatteryHealthRepository batteryHealthRepository
    ) {
        this(tripRepository, bookingRepository, handoverRepository, vehicleRepository, energyModelService, batteryHealthRepository, null, null, null);
    }

    @Autowired
    public TripService(
            TripRepository tripRepository,
            BookingRepository bookingRepository,
            VehicleHandoverRepository handoverRepository,
            VehicleRepository vehicleRepository,
            VehicleEnergyModelService energyModelService,
            VehicleBatteryHealthRepository batteryHealthRepository,
            @org.springframework.context.annotation.Lazy ExpenseService expenseService,
            UserRepository userRepository,
            ChargingSessionRepository chargingSessionRepository
    ) {
        this.tripRepository = tripRepository;
        this.bookingRepository = bookingRepository;
        this.handoverRepository = handoverRepository;
        this.vehicleRepository = vehicleRepository;
        this.energyModelService = energyModelService != null ? energyModelService : new VehicleEnergyModelService();
        this.batteryHealthRepository = batteryHealthRepository;
        this.expenseService = expenseService;
        this.userRepository = userRepository;
        this.chargingSessionRepository = chargingSessionRepository;
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

        if (vehicle.getStatus() == VehicleStatus.CHARGING) {
            throw new IllegalStateException("Xe đang trong quá trình sạc pin, vui lòng ngắt sạc trước khi bắt đầu chuyến đi.");
        }
        if (vehicle.getStatus() == VehicleStatus.MAINTENANCE) {
            throw new IllegalStateException("Xe đang trong quá trình bảo dưỡng, không thể bắt đầu chuyến đi.");
        }

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

    /**
     * Complete / check-out an active trip (Phase 12).
     * Atomic, concurrency-safe check-out workflow.
     * Transactionally updates Trip, Vehicle, and Booking.
     */
    @Transactional
    public TripResponse completeTrip(UUID tripId, UUID currentUserId, Role currentUserRole) {
        return completeTrip(tripId, currentUserId, currentUserRole, null);
    }

    /**
     * Complete / check-out an active trip (Phase 12 & Phase 18 Realistic EV Energy Model).
     * Atomic, concurrency-safe check-out workflow.
     * Transactionally updates Trip, Vehicle, and Booking.
     */
    @Transactional
    public TripResponse completeTrip(UUID tripId, UUID currentUserId, Role currentUserRole, BigDecimal requestedEndOdometer) {
        // 1. Role validation: Must be CO_OWNER (STAFF/ADMIN cannot execute normal CO_OWNER checkout)
        if (currentUserRole != Role.CO_OWNER) {
            throw new AccessDeniedException(MSG_ONLY_CO_OWNER_CHECKOUT);
        }

        // 2. Load Trip
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với mã: " + tripId));

        // 3. Ownership validation: Trip must belong to the authenticated user
        if (trip.getUser() == null || !trip.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException(MSG_NOT_TRIP_OWNER);
        }

        // 4. Idempotency & Status validation: Must be ACTIVE
        if (trip.getStatus() == TripStatus.COMPLETED) {
            throw new IllegalStateException(MSG_TRIP_ALREADY_COMPLETED);
        }
        if (trip.getStatus() != TripStatus.ACTIVE) {
            throw new IllegalStateException(MSG_TRIP_NOT_ACTIVE);
        }

        // 5. Verify Vehicle and Booking relationship
        Vehicle vehicle = trip.getVehicle();
        if (vehicle == null) {
            throw new IllegalStateException("CHUYẾN ĐI THIẾU THÔNG TIN PHƯƠNG TIỆN");
        }
        Booking booking = trip.getBooking();
        if (booking == null) {
            throw new IllegalStateException("CHUYẾN ĐI THIẾU THÔNG TIN LỊCH ĐẶT");
        }

        // Re-read authoritative Vehicle entity to get fresh telemetry and specs
        Vehicle managedVehicle = vehicleRepository.findById(vehicle.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phương tiện với mã: " + vehicle.getId()));

        // 6. Time validation: Server clock is authoritative (Section 9)
        Instant now = Instant.now();
        if (trip.getStartedAt() != null && now.isBefore(trip.getStartedAt())) {
            now = trip.getStartedAt();
        }

        // 7. Resolve end odometer and calculate deterministic realistic EV consumption
        BigDecimal startOdo = trip.getStartOdometer() != null ? trip.getStartOdometer() : managedVehicle.getOdometer();
        BigDecimal endOdo;

        if (requestedEndOdometer != null && requestedEndOdometer.compareTo(startOdo) > 0) {
            endOdo = requestedEndOdometer;
        } else if (managedVehicle.getOdometer() != null && managedVehicle.getOdometer().compareTo(startOdo) > 0) {
            endOdo = managedVehicle.getOdometer();
        } else {
            // Canonical demo distance: 35.00 km (as specified in realistic EV energy model example)
            endOdo = startOdo.add(new BigDecimal("35.00"));
        }

        BigDecimal startSoc = trip.getStartBatteryLevel() != null
                ? new BigDecimal(trip.getStartBatteryLevel())
                : (managedVehicle.getCurrentBatteryLevel() != null
                    ? new BigDecimal(managedVehicle.getCurrentBatteryLevel())
                    : new BigDecimal("100.00"));

        TripEnergyCalculationResult energyResult = energyModelService.calculateTripConsumption(
                startOdo,
                endOdo,
                startSoc,
                managedVehicle
        );

        int endBatteryInt = Math.max(0, Math.min(100, (int) Math.round(energyResult.getEndSocPercent().doubleValue())));

        // 8. Snapshot authoritative end telemetry to Trip
        trip.setStatus(TripStatus.COMPLETED);
        trip.setEndedAt(now);
        trip.setEndOdometer(endOdo);
        trip.setEndBatteryLevel(endBatteryInt);
        trip.setEndSocPercent(energyResult.getEndSocPercent());
        trip.setEnergyConsumedKwh(energyResult.getEnergyConsumedKwh());
        trip.setSocConsumedPercent(energyResult.getSocConsumedPercent());

        // 9. Update Vehicle state and authoritative telemetry
        managedVehicle.setStatus(VehicleStatus.AVAILABLE);
        managedVehicle.setOdometer(endOdo);
        managedVehicle.setCurrentBatteryLevel(endBatteryInt);
        vehicleRepository.save(managedVehicle);

        // 10. Update VehicleBatteryHealth estimated range if entity exists
        if (batteryHealthRepository != null) {
            batteryHealthRepository.findByVehicleId(managedVehicle.getId()).ifPresent(health -> {
                if (energyResult.getEnergyConsumptionKwhPer100Km().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal estimatedKm = energyResult.getEndSocPercent()
                            .multiply(energyResult.getUsableBatteryCapacityKwh())
                            .divide(energyResult.getEnergyConsumptionKwhPer100Km(), 2, RoundingMode.HALF_UP);
                    health.setEstimatedRangeKm(estimatedKm);
                    batteryHealthRepository.save(health);
                }
            });
        }

        // 11. Booking transition: If currently CONFIRMED or PENDING, mark COMPLETED (Section 8)
        Booking managedBooking = bookingRepository.findById(booking.getId())
                .orElse(booking);
        if (managedBooking.getStatus() == BookingStatus.CONFIRMED || managedBooking.getStatus() == BookingStatus.PENDING) {
            managedBooking.setStatus(BookingStatus.COMPLETED);
            bookingRepository.save(managedBooking);
        }

        // 12. Persist trip
        Trip savedTrip = tripRepository.save(trip);
        return TripResponse.fromEntity(savedTrip);
    }

    /**
     * STAFF confirms vehicle return and verifies condition & energy usage (Phase 18 & 19).
     * Authoritatively creates verified trip energy expense.
     * Exclusively accessible by STAFF or ADMIN.
     */
    @Transactional
    public TripResponse confirmTripReturn(
            UUID tripId,
            ConfirmTripReturnRequest request,
            UUID staffUserId,
            Role staffUserRole
    ) {
        if (staffUserRole != Role.STAFF && staffUserRole != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ nhân viên hoặc quản trị viên mới có quyền xác nhận trả xe.");
        }

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với mã: " + tripId));

        User staff = userRepository != null ? userRepository.findById(staffUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên: " + staffUserId)) : null;

        if (trip.getReturnVerifiedAt() != null) {
            throw new IllegalStateException("Chuyến đi này đã được nhân viên xác nhận trả xe trước đó.");
        }

        Vehicle vehicle = trip.getVehicle();
        if (vehicle == null) {
            throw new IllegalStateException("CHUYẾN ĐI THIẾU THÔNG TIN PHƯƠNG TIỆN");
        }

        // 1. If trip was still ACTIVE, finalize it
        if (trip.getStatus() == TripStatus.ACTIVE) {
            trip.setStatus(TripStatus.COMPLETED);
            trip.setEndedAt(Instant.now());
        }

        // 2. Update ending telemetry if provided by staff inspection
        if (request != null && request.getEndBatteryLevel() != null) {
            trip.setEndBatteryLevel(request.getEndBatteryLevel());
            trip.setEndSocPercent(new BigDecimal(request.getEndBatteryLevel()));
        }
        if (request != null && request.getEndOdometer() != null) {
            trip.setEndOdometer(request.getEndOdometer());
        }

        // Re-read managed vehicle to avoid optimistic locking
        Vehicle managedVehicle = vehicleRepository.findById(vehicle.getId()).orElse(vehicle);
        if (trip.getEndBatteryLevel() != null) {
            managedVehicle.setCurrentBatteryLevel(trip.getEndBatteryLevel());
        }
        if (trip.getEndOdometer() != null) {
            managedVehicle.setOdometer(trip.getEndOdometer());
        }
        managedVehicle.setStatus(VehicleStatus.AVAILABLE);
        vehicleRepository.save(managedVehicle);

        // 3. Complete linked booking if needed
        Booking booking = trip.getBooking();
        if (booking != null) {
            Booking managedBooking = bookingRepository.findById(booking.getId()).orElse(booking);
            if (managedBooking.getStatus() == BookingStatus.CONFIRMED || managedBooking.getStatus() == BookingStatus.PENDING) {
                managedBooking.setStatus(BookingStatus.COMPLETED);
                bookingRepository.save(managedBooking);
            }
        }

        // 4. Reliable SOC / Energy verification (Section 3 & Scenario F)
        BigDecimal capacityKwh = managedVehicle.getUsableBatteryCapacityKwh() != null
                ? managedVehicle.getUsableBatteryCapacityKwh()
                : (managedVehicle.getGrossBatteryCapacityKwh() != null ? managedVehicle.getGrossBatteryCapacityKwh() : new BigDecimal("65.0"));

        BigDecimal verifiedEnergyKwh = null;
        boolean hasReliableData = trip.getStartBatteryLevel() != null
                && trip.getEndBatteryLevel() != null
                && trip.getStartOdometer() != null
                && trip.getEndOdometer() != null
                && trip.getEndOdometer().compareTo(trip.getStartOdometer()) >= 0;

        if (hasReliableData) {
            // Find intermediate charging energy delivered during trip
            BigDecimal intermediateKwh = BigDecimal.ZERO;
            if (chargingSessionRepository != null && trip.getStartedAt() != null) {
                Instant tripEnd = trip.getEndedAt() != null ? trip.getEndedAt() : Instant.now();
                List<com.evshare.charging.entity.ChargingSession> sessions = chargingSessionRepository.findByVehicleIdOrderByCreatedAtDesc(managedVehicle.getId());
                for (var s : sessions) {
                    if (s.getStartedAt() != null && !s.getStartedAt().isBefore(trip.getStartedAt()) && !s.getStartedAt().isAfter(tripEnd)) {
                        if (s.getEnergyDeliveredKwh() != null && s.getEnergyDeliveredKwh().compareTo(BigDecimal.ZERO) > 0) {
                            intermediateKwh = intermediateKwh.add(s.getEnergyDeliveredKwh());
                        }
                    }
                }
            }

            if (trip.getEnergyConsumedKwh() != null && trip.getEnergyConsumedKwh().compareTo(BigDecimal.ZERO) > 0) {
                verifiedEnergyKwh = trip.getEnergyConsumedKwh().add(intermediateKwh);
            } else {
                BigDecimal startSoc = new BigDecimal(trip.getStartBatteryLevel());
                BigDecimal endSoc = new BigDecimal(trip.getEndBatteryLevel());
                BigDecimal deltaSoc = startSoc.subtract(endSoc);
                if (deltaSoc.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal energyFromSoc = deltaSoc.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP).multiply(capacityKwh);
                    verifiedEnergyKwh = energyFromSoc.add(intermediateKwh);
                } else if (intermediateKwh.compareTo(BigDecimal.ZERO) > 0) {
                    verifiedEnergyKwh = intermediateKwh;
                }
            }
        }

        // 5. Automatic Expense Creation (Sections 4, 5, 7, 9)
        if (verifiedEnergyKwh != null && verifiedEnergyKwh.compareTo(BigDecimal.ZERO) > 0) {
            if (expenseService != null) {
                expenseService.createTripEnergyExpense(trip, verifiedEnergyKwh, staff);
            }
        } else {
            // Inconsistent/missing data: keep charging reconciliation pending (Scenario F)
            String pendingNote = "[Chờ đối soát dữ liệu điện]";
            String note = request != null && request.getConditionNote() != null ? request.getConditionNote() + " " + pendingNote : pendingNote;
            trip.setReturnNote(note);
        }

        // 6. Record staff return verification metadata
        trip.setReturnVerifiedBy(staff);
        trip.setReturnVerifiedAt(Instant.now());
        if (trip.getReturnNote() == null && request != null) {
            trip.setReturnNote(request.getConditionNote());
        }

        Trip savedTrip = tripRepository.save(trip);
        return TripResponse.fromEntity(savedTrip);
    }
}
