package com.evshare.trip.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.handover.entity.HandoverStatus;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.handover.service.VehicleHandoverService;
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
import com.evshare.inspection.entity.InspectionOverallResult;
import com.evshare.inspection.entity.InspectionStatus;
import com.evshare.inspection.entity.InspectionType;
import com.evshare.inspection.entity.VehicleInspection;
import com.evshare.inspection.repository.VehicleInspectionRepository;
import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.ownership.entity.GroupMember;
import com.evshare.ownership.entity.GroupStatus;
import com.evshare.ownership.entity.GroupVehicle;
import com.evshare.ownership.entity.GroupVehicleStatus;
import com.evshare.ownership.entity.MemberStatus;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.GroupVehicleRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.dto.ConfirmTripReturnRequest;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import com.evshare.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.stream.Collectors;

@Service
public class TripService {

    /**
     * Time tolerance before booking.startTime during which CO_OWNER may begin trip.
     * Centralized configuration constant (Section 14).
     */
    public static final long START_WINDOW_EARLY_TOLERANCE_MINUTES = 30;

    // Standardized business error reason codes (Section 21)
    public static final String REASON_HANDOVER_NOT_COMPLETED = "HANDOVER_NOT_COMPLETED";
    public static final String MSG_HANDOVER_NOT_COMPLETED = "Nhân viên chưa xác nhận bàn giao xe cho lịch đặt hiện tại.";

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

    private static final Logger log = LoggerFactory.getLogger(TripService.class);

    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;
    private final VehicleHandoverRepository handoverRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleEnergyModelService energyModelService;
    private final VehicleBatteryHealthRepository batteryHealthRepository;
    private final ExpenseService expenseService;
    private final UserRepository userRepository;
    private final ChargingSessionRepository chargingSessionRepository;
    private final VehicleInspectionRepository inspectionRepository;

    @Autowired(required = false)
    private GroupMemberRepository memberRepository;

    @Autowired(required = false)
    private GroupVehicleRepository groupVehicleRepository;

    @Autowired(required = false)
    private com.evshare.notification.service.NotificationService notificationService;

    @Autowired(required = false)
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private TripExtensionService extensionService;

    @Autowired(required = false)
    private com.evshare.energy.service.VehicleEnergyInventoryService energyInventoryService;

    @Autowired(required = false)
    private com.evshare.booking.repository.BookingViolationRepository bookingViolationRepository;

    public TripService(
            TripRepository tripRepository,
            BookingRepository bookingRepository,
            VehicleHandoverRepository handoverRepository,
            VehicleRepository vehicleRepository,
            VehicleEnergyModelService energyModelService,
            VehicleBatteryHealthRepository batteryHealthRepository) {
        this(tripRepository, bookingRepository, handoverRepository, vehicleRepository, energyModelService,
                batteryHealthRepository, null, null, null, null);
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
            ChargingSessionRepository chargingSessionRepository,
            VehicleInspectionRepository inspectionRepository) {
        this.tripRepository = tripRepository;
        this.bookingRepository = bookingRepository;
        this.handoverRepository = handoverRepository;
        this.vehicleRepository = vehicleRepository;
        this.energyModelService = energyModelService != null ? energyModelService : new VehicleEnergyModelService();
        this.batteryHealthRepository = batteryHealthRepository;
        this.expenseService = expenseService;
        this.userRepository = userRepository;
        this.chargingSessionRepository = chargingSessionRepository;
        this.inspectionRepository = inspectionRepository;
    }

    /**
     * Retrieve all pending vehicle return requests (STEP 2: STAFF receives
     * vehicle).
     */
    @Transactional(readOnly = true)
    public List<TripResponse> getPendingReturnTrips() {
        List<Trip> trips = tripRepository.findPendingReturnTrips();
        return trips.stream().map(this::enrichTripResponse).toList();
    }

    /**
     * Compute trip start eligibility purely read-only without modifying database
     * state.
     * Section 11 & 23: GET eligibility must NEVER mutate data or create Trip.
     */
    @Transactional(readOnly = true)
    public TripStartEligibilityResponse checkStartEligibility(UUID bookingId, UUID currentUserId,
            Role currentUserRole) {
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
                    null);
        }

        // 2. Ownership validation: Must belong to current authenticated user
        if (booking.getUser() == null || !booking.getUser().getId().equals(currentUserId)) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_NOT_BOOKING_OWNER,
                    MSG_NOT_BOOKING_OWNER,
                    bookingId,
                    vehicleId,
                    null);
        }

        // 3. Booking status validation
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_BOOKING_EXPIRED,
                    MSG_BOOKING_EXPIRED,
                    bookingId,
                    vehicleId,
                    null);
        }

        // 4. VehicleHandover existence and status validation (Section 4 & 5)
        Optional<VehicleHandover> handoverOpt = handoverRepository.findByBookingId(bookingId);
        if (handoverOpt.isEmpty()) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_HANDOVER_NOT_COMPLETED,
                    MSG_HANDOVER_NOT_COMPLETED,
                    bookingId,
                    vehicleId,
                    null);
        }

        VehicleHandover handover = handoverOpt.get();
        String handoverStatusStr = handover.getStatus() != null ? handover.getStatus().name() : null;

        if (handover.getStatus() != HandoverStatus.COMPLETED &&
                handover.getStatus() != HandoverStatus.HANDED_OVER &&
                handover.getStatus() != HandoverStatus.OWNER_CONFIRMED) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_HANDOVER_NOT_COMPLETED,
                    MSG_HANDOVER_NOT_COMPLETED,
                    bookingId,
                    vehicleId,
                    handoverStatusStr);
        }

        // Must have explicit STAFF handover confirmation
        if (handover.getStaff() == null || handover.getStaffHandedOverAt() == null) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_HANDOVER_NOT_COMPLETED,
                    MSG_HANDOVER_NOT_COMPLETED,
                    bookingId,
                    vehicleId,
                    handoverStatusStr);
        }

        // Pre-handover inspection validation: if inspection is present, cannot be FAIL
        if (handover.getInspection() != null
                && handover.getInspection().getOverallResult() == InspectionOverallResult.FAIL) {
            return TripStartEligibilityResponse.notEligible(
                    "INSPECTION_FAILED",
                    "Xe không đạt kiểm tra kỹ thuật (FAIL). Không thể bắt đầu chuyến đi.",
                    bookingId,
                    vehicleId,
                    handoverStatusStr);
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
                    handoverStatusStr);
        }

        // Prevent CO_OWNER from confirming their own STAFF handover
        if (handover.getStaff() != null && handover.getStaff().getId().equals(currentUserId)) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_HANDOVER_DATA_INCONSISTENT,
                    "Chủ xe không thể tự xác nhận bàn giao của nhân viên",
                    bookingId,
                    vehicleId,
                    handoverStatusStr);
        }

        // Handover temporal consistency: staffHandedOverAt cannot predate booking start
        // by more than preparation window + buffer
        Instant prepWindowStart = booking.getStartTime()
                .minus(Duration.ofMinutes(VehicleHandoverService.PREPARATION_WINDOW_MINUTES + 15));
        if (handover.getStaffHandedOverAt() != null && handover.getStaffHandedOverAt().isBefore(prepWindowStart)) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_HANDOVER_DATA_INCONSISTENT,
                    "Dữ liệu bàn giao không khớp với thời gian lịch đặt (thời điểm bàn giao không hợp lệ).",
                    bookingId,
                    vehicleId,
                    handoverStatusStr);
        }

        // 6. Time window check (Section 14)
        Instant now = Instant.now();
        Instant earliestAllowedStart = booking.getStartTime()
                .minus(Duration.ofMinutes(START_WINDOW_EARLY_TOLERANCE_MINUTES));
        if (now.isBefore(earliestAllowedStart)) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_TOO_EARLY,
                    MSG_TOO_EARLY,
                    bookingId,
                    vehicleId,
                    handoverStatusStr);
        }

        if (now.isAfter(booking.getEndTime())) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_BOOKING_EXPIRED,
                    MSG_BOOKING_EXPIRED,
                    bookingId,
                    vehicleId,
                    handoverStatusStr);
        }

        // 7. Check if trip already exists for this booking (Section 9)
        Optional<Trip> existingTrip = tripRepository.findByBookingId(bookingId);
        if (existingTrip.isPresent() && existingTrip.get().getStatus() == TripStatus.ACTIVE) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_TRIP_ALREADY_ACTIVE,
                    MSG_TRIP_ALREADY_ACTIVE,
                    bookingId,
                    vehicleId,
                    handoverStatusStr);
        }

        // 8. Check if vehicle is already in use by another active trip or held in
        // custody by another booking (Section 10)
        Optional<Trip> activeVehicleTrip = tripRepository.findByVehicleIdAndStatus(booking.getVehicle().getId(),
                TripStatus.ACTIVE);
        if (activeVehicleTrip.isPresent() && !activeVehicleTrip.get().getBooking().getId().equals(bookingId)) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_VEHICLE_IN_USE,
                    MSG_VEHICLE_IN_USE,
                    bookingId,
                    vehicleId,
                    handoverStatusStr);
        }

        List<VehicleHandover> otherCustodyHandovers = handoverRepository
                .findCustodyHandoversForVehicle(booking.getVehicle().getId(), handover.getId());
        if (!otherCustodyHandovers.isEmpty()) {
            return TripStartEligibilityResponse.notEligible(
                    REASON_VEHICLE_IN_USE,
                    "Xe đang thuộc quyền sử dụng của thành viên khác chưa trả xe.",
                    bookingId,
                    vehicleId,
                    handoverStatusStr);
        }

        // Check if booking has no-show violation recorded or pending recovery
        if (bookingViolationRepository != null) {
            java.util.Optional<com.evshare.booking.entity.BookingViolation> violationOpt = bookingViolationRepository
                    .findByBookingId(bookingId);
            if (violationOpt.isPresent()) {
                com.evshare.booking.entity.BookingViolation v = violationOpt.get();
                if (v.getResolutionStatus() == com.evshare.booking.entity.BookingViolationStatus.RECORDED ||
                        v.getResolutionStatus() == com.evshare.booking.entity.BookingViolationStatus.RECOVERY_PENDING) {
                    return TripStartEligibilityResponse.notEligible(
                            "NO_SHOW_VIOLATION",
                            "Lịch đặt đã bị ghi nhận vi phạm No-Show (quá thời hạn xuất phát chuyến đi). Không thể bắt đầu chuyến đi.",
                            bookingId,
                            vehicleId,
                            handoverStatusStr);
                }
            }
        }

        // 9. Load authoritative vehicle telemetry
        Vehicle vehicle = vehicleRepository.findById(booking.getVehicle().getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy phương tiện với mã: " + booking.getVehicle().getId()));

        return TripStartEligibilityResponse.eligible(
                booking.getId(),
                vehicle.getId(),
                handover.getStatus() != null ? handover.getStatus().name() : HandoverStatus.COMPLETED.name(),
                vehicle.getCurrentBatteryLevel(),
                vehicle.getOdometer());
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
        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException(MSG_BOOKING_EXPIRED);
        }

        // Violation check: Block trip start if booking was marked as No-Show or pending recovery
        if (bookingViolationRepository != null) {
            java.util.Optional<com.evshare.booking.entity.BookingViolation> violationOpt = bookingViolationRepository.findByBookingId(bookingId);
            if (violationOpt.isPresent()) {
                com.evshare.booking.entity.BookingViolation v = violationOpt.get();
                if (v.getResolutionStatus() == com.evshare.booking.entity.BookingViolationStatus.RECORDED ||
                    v.getResolutionStatus() == com.evshare.booking.entity.BookingViolationStatus.RECOVERY_PENDING) {
                    throw new IllegalStateException("Lịch đặt đã bị ghi nhận vi phạm No-Show (quá thời hạn xuất phát chuyến đi). Không thể bắt đầu chuyến đi.");
                }
            }
        }

        // 5. Handover check (Section 4 & 5: Source of truth is VehicleHandover.status == COMPLETED)
        VehicleHandover handover = handoverRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalStateException(MSG_HANDOVER_NOT_COMPLETED));

        if (handover.getStatus() != HandoverStatus.COMPLETED &&
            handover.getStatus() != HandoverStatus.HANDED_OVER &&
            handover.getStatus() != HandoverStatus.OWNER_CONFIRMED) {
            throw new IllegalStateException(MSG_HANDOVER_NOT_COMPLETED);
        }

        // Must have explicit STAFF handover confirmation
        if (handover.getStaff() == null || handover.getStaffHandedOverAt() == null) {
            throw new IllegalStateException(MSG_HANDOVER_NOT_COMPLETED);
        }

        // Pre-handover inspection validation: if inspection is present, cannot be FAIL
        if (handover.getInspection() != null && handover.getInspection().getOverallResult() == InspectionOverallResult.FAIL) {
            throw new IllegalStateException("Xe không đạt kiểm tra kỹ thuật (FAIL). Không thể bắt đầu chuyến đi.");
        }

        // 6. Handover data consistency validation
        if (handover.getBooking() == null || !handover.getBooking().getId().equals(booking.getId()) ||
            handover.getVehicle() == null || !handover.getVehicle().getId().equals(booking.getVehicle().getId()) ||
            handover.getCoOwner() == null || !handover.getCoOwner().getId().equals(booking.getUser().getId())) {
            throw new IllegalStateException(MSG_HANDOVER_DATA_INCONSISTENT);
        }

        // Prevent CO_OWNER from confirming their own STAFF handover
        if (handover.getStaff() != null && handover.getStaff().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Chủ xe không thể tự xác nhận bàn giao của nhân viên");
        }

        // Handover temporal consistency: staffHandedOverAt cannot predate booking start by more than preparation window + buffer
        Instant prepWindowStart = booking.getStartTime().minus(Duration.ofMinutes(VehicleHandoverService.PREPARATION_WINDOW_MINUTES + 15));
        if (handover.getStaffHandedOverAt() != null && handover.getStaffHandedOverAt().isBefore(prepWindowStart)) {
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

        // 9. Prevent concurrent active trip or concurrent physical custody on the same vehicle (Section 10)
        boolean hasActiveTripOnVehicle = tripRepository.existsByVehicleIdAndStatus(booking.getVehicle().getId(), TripStatus.ACTIVE);
        if (hasActiveTripOnVehicle) {
            throw new IllegalStateException(MSG_VEHICLE_IN_USE);
        }

        List<VehicleHandover> otherCustodyHandovers = handoverRepository.findCustodyHandoversForVehicle(booking.getVehicle().getId(), handover.getId());
        if (!otherCustodyHandovers.isEmpty()) {
            throw new IllegalStateException("Xe đang thuộc quyền sử dụng của thành viên khác chưa trả xe.");
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

        // 11. Create Trip (Section 2 & 12) - Ensure cumulative ODO
        BigDecimal cumulativeStartOdo = vehicle.getOdometer();
        Optional<Trip> prevTripOpt = tripRepository.findFirstByVehicleIdAndStatusOrderByEndedAtDesc(vehicle.getId(), TripStatus.COMPLETED);
        if (prevTripOpt.isPresent() && prevTripOpt.get().getEndOdometer() != null) {
            BigDecimal lastEndOdo = prevTripOpt.get().getEndOdometer();
            if (cumulativeStartOdo == null || lastEndOdo.compareTo(cumulativeStartOdo) > 0) {
                cumulativeStartOdo = lastEndOdo;
                vehicle.setOdometer(lastEndOdo);
            }
        }
        if (cumulativeStartOdo == null) {
            cumulativeStartOdo = BigDecimal.ZERO;
            vehicle.setOdometer(BigDecimal.ZERO);
        }

        Trip trip = new Trip(
                UUID.randomUUID(),
                booking,
                vehicle,
                booking.getUser(),
                TripStatus.ACTIVE,
                now,
                cumulativeStartOdo,
                vehicle.getCurrentBatteryLevel()
        );

        // 12. Update vehicle operational status to IN_USE (Section 12 item 14)
        vehicle.setStatus(VehicleStatus.IN_USE);
        vehicleRepository.save(vehicle);

        Trip savedTrip = tripRepository.save(trip);

        if (notificationService != null) {
            try {
                notificationService.notifyTripStarted(savedTrip);
            } catch (Exception ex) {
                log.error("Failed to send trip start notification for trip {}: {}", savedTrip.getId(), ex.getMessage(), ex);
            }
        }

        return TripResponse.fromEntity(savedTrip);
    }

    private TripResponse enrichTripResponse(Trip trip) {
        return enrichTripResponse(trip, null);
    }

    private TripResponse enrichTripResponse(Trip trip, UUID currentUserId) {
        if (trip == null)
            return null;
        TripResponse res = TripResponse.fromEntity(trip);
        if (trip.getStatus() == TripStatus.COMPLETED) {
            if (expenseService != null) {
                expenseService.findByRelatedTripId(trip.getId())
                        .ifPresent(exp -> {
                            res.setVerifiedExpenseAmount(exp.getAmount());
                            if (exp.getStatus() != null) {
                                res.setExpenseStatus(exp.getStatus().name());
                            }
                            if (trip.getEnergyConsumedKwh() != null
                                    && trip.getEnergyConsumedKwh().compareTo(BigDecimal.ZERO) > 0
                                    && exp.getAmount() != null) {
                                res.setAppliedEnergyTariff(
                                        exp.getAmount().divide(trip.getEnergyConsumedKwh(), 2, RoundingMode.HALF_UP));
                            }
                        });
            }
            if (res.getAppliedEnergyTariff() == null && energyInventoryService != null && trip.getVehicle() != null) {
                try {
                    com.evshare.energy.entity.VehicleEnergyInventory inv = energyInventoryService
                            .getOrCreateInventory(trip.getVehicle());
                    res.setAppliedEnergyTariff(inv.getWeightedAverageCostPerKwh());
                } catch (Exception ignored) {
                }
            }
        }
        if (currentUserId != null && notificationRepository != null && trip.getId() != null) {
            boolean ack = notificationRepository.isTripCompletionAcknowledged(currentUserId, trip.getId());
            res.setIsAcknowledged(ack);
        }
        return res;
    }

    /**
     * Retrieve trip associated with a booking (Section 11).
     */
    @Transactional(readOnly = true)
    public Optional<TripResponse> getTripByBookingId(UUID bookingId, UUID currentUserId, Role currentUserRole) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch đặt với mã: " + bookingId));

        if (currentUserRole == Role.CO_OWNER
                && (booking.getUser() == null || !booking.getUser().getId().equals(currentUserId))) {
            throw new AccessDeniedException(MSG_NOT_BOOKING_OWNER);
        }

        return tripRepository.findByBookingId(bookingId).map(t -> enrichTripResponse(t, currentUserId));
    }

    /**
     * Retrieve active trip for a vehicle (for reload restoration & operations
     * monitoring).
     */
    @Transactional(readOnly = true)
    public Optional<TripResponse> getActiveTripForVehicle(UUID vehicleId) {
        return tripRepository.findByVehicleIdAndStatus(vehicleId, TripStatus.ACTIVE).map(this::enrichTripResponse);
    }

    /**
     * Extend an active or return-requested trip.
     */
    @Transactional
    public TripResponse extendTrip(UUID tripId, UUID currentUserId, Role currentUserRole,
            com.evshare.trip.dto.ExtendTripRequest request) {
        if (extensionService != null) {
            TripResponse direct = extensionService.extendTripDirect(
                    tripId, request.getAdditionalMinutes(), request.getNewEndTime(), request.getReason(), currentUserId,
                    currentUserRole);
            return enrichTripResponse(tripRepository.findById(tripId).orElse(null), currentUserId);
        }

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với mã: " + tripId));

        if (currentUserRole != Role.ADMIN
                && (trip.getUser() == null || !trip.getUser().getId().equals(currentUserId))) {
            throw new AccessDeniedException("Bạn không có quyền gia hạn chuyến đi này.");
        }

        if (trip.getStatus() != TripStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ có thể gia hạn khi chuyến đi đang diễn ra.");
        }

        Booking booking = trip.getBooking();
        if (booking == null) {
            throw new IllegalStateException("Chuyến đi không liên kết với lịch đặt xe hợp lệ.");
        }

        java.time.Instant proposedEndTime;
        if (request.getAdditionalMinutes() != null && request.getAdditionalMinutes() > 0) {
            proposedEndTime = booking.getEndTime().plus(java.time.Duration.ofMinutes(request.getAdditionalMinutes()));
        } else if (request.getNewEndTime() != null && request.getNewEndTime().isAfter(booking.getEndTime())) {
            proposedEndTime = request.getNewEndTime();
        } else {
            throw new IllegalArgumentException("Thời gian kết thúc mới phải sau thời gian kết thúc hiện tại.");
        }

        // Conflict check with other bookings
        List<Booking> conflicts = bookingRepository.findConflictingBookingsExcluding(
                trip.getVehicle().getId(),
                booking.getId(),
                booking.getEndTime(),
                proposedEndTime,
                List.of(BookingStatus.CONFIRMED, BookingStatus.PENDING));

        if (!conflicts.isEmpty()) {
            log.warn("Trip extension conflict for vehicle {} between {} and {}",
                    trip.getVehicle().getId(), booking.getEndTime(), proposedEndTime);
            throw new IllegalArgumentException("Không thể gia hạn vì ảnh hưởng đến lịch đặt của thành viên tiếp theo.");
        }

        booking.setEndTime(proposedEndTime);
        bookingRepository.save(booking);

        log.info("Trip {} (Booking {}) successfully extended to {} by user {}",
                tripId, booking.getId(), proposedEndTime, currentUserId);

        return enrichTripResponse(trip, currentUserId);
    }

    /**
     * Retrieve the latest completed trip for a vehicle.
     * For CO_OWNER: restricted to trips owned by the authenticated user on this
     * vehicle.
     * For STAFF/ADMIN: returns the vehicle's latest completed trip.
     */
    @Transactional(readOnly = true)
    public Optional<TripResponse> getLatestCompletedTripForVehicle(UUID vehicleId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            return Optional.empty();
        }
        Role role = principal.getUser().getRole();
        UUID userId = principal.getId();

        Optional<Trip> tripOpt;
        if (role == Role.CO_OWNER) {
            List<Trip> list = tripRepository.findLatestCompletedByUserAndVehicle(vehicleId, userId,
                    org.springframework.data.domain.PageRequest.of(0, 1));
            if (!list.isEmpty()) {
                tripOpt = Optional.of(list.get(0));
            } else if (hasUserAccessToVehicle(userId, vehicleId)) {
                tripOpt = tripRepository.findFirstByVehicleIdAndStatusOrderByEndedAtDesc(vehicleId,
                        TripStatus.COMPLETED);
            } else {
                tripOpt = Optional.empty();
            }
        } else {
            tripOpt = tripRepository.findFirstByVehicleIdAndStatusOrderByEndedAtDesc(vehicleId, TripStatus.COMPLETED);
        }
        return tripOpt.map(t -> enrichTripResponse(t, userId));
    }

    @Transactional(readOnly = true)
    public Optional<TripResponse> getTripById(UUID tripId, UUID currentUserId, Role currentUserRole) {
        Trip trip = tripRepository.findById(tripId).orElse(null);
        if (trip == null) {
            return Optional.empty();
        }
        if (currentUserRole == Role.CO_OWNER
                && (trip.getUser() == null || !trip.getUser().getId().equals(currentUserId))) {
            throw new AccessDeniedException("BẠN KHÔNG CÓ QUYỀN XEM CHUYẾN ĐI NÀY");
        }
        return Optional.of(enrichTripResponse(trip, currentUserId));
    }

    /**
     * Check if a co-owner has authorized access to a vehicle via active
     * co-ownership group or trip history.
     */
    public boolean hasUserAccessToVehicle(UUID userId, UUID vehicleId) {
        if (userId == null || vehicleId == null) {
            return false;
        }
        if (memberRepository != null) {
            List<GroupMember> activeMemberships = memberRepository.findByUserIdAndStatus(userId, MemberStatus.ACTIVE);
            for (GroupMember member : activeMemberships) {
                if (member.getRemovedAt() != null)
                    continue;
                CoOwnershipGroup group = member.getGroup();
                if (group != null && group.getStatus() == GroupStatus.ACTIVE) {
                    if (vehicleId.equals(group.getVehicleId())) {
                        return true;
                    }
                    if (groupVehicleRepository != null) {
                        List<GroupVehicle> gvs = groupVehicleRepository.findByGroupIdAndStatus(group.getId(),
                                GroupVehicleStatus.ACTIVE);
                        for (GroupVehicle gv : gvs) {
                            if (gv.getVehicle() != null && vehicleId.equals(gv.getVehicle().getId())) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return tripRepository.findByUserIdAndStatus(userId, TripStatus.ACTIVE).stream()
                .anyMatch(t -> t.getVehicle() != null && vehicleId.equals(t.getVehicle().getId()))
                || tripRepository.findByUserIdAndStatus(userId, TripStatus.COMPLETED).stream()
                        .anyMatch(t -> t.getVehicle() != null && vehicleId.equals(t.getVehicle().getId()));
    }

    /**
     * Acknowledge viewing completed trip details to dismiss the summary card from
     * vehicle overview.
     * Persists acknowledgement into notifications table (TRIP_RETURN_CONFIRMED /
     * COMPLETED_TRIP_VIEWED)
     * without modifying the authoritative Trip business status or financial
     * records.
     */
    @Transactional
    public TripResponse acknowledgeTripViewed(UUID tripId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác");
        }
        UUID userId = principal.getId();
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi: " + tripId));

        // Validate access: CO_OWNER must own the trip or have vehicle access
        if (principal.getUser().getRole() == Role.CO_OWNER) {
            boolean isTripDriver = trip.getUser() != null && trip.getUser().getId().equals(userId);
            UUID vehicleId = trip.getVehicle() != null ? trip.getVehicle().getId() : null;
            if (!isTripDriver && !hasUserAccessToVehicle(userId, vehicleId)) {
                throw new AccessDeniedException("Bạn không có quyền thao tác trên chuyến đi này.");
            }
        }

        if (notificationRepository != null) {
            List<com.evshare.notification.entity.Notification> existing = notificationRepository
                    .findTripCompletionNotifications(userId, tripId);

            Instant now = Instant.now();
            if (existing != null && !existing.isEmpty()) {
                for (com.evshare.notification.entity.Notification n : existing) {
                    if (n.getReadAt() == null) {
                        n.setReadAt(now);
                    }
                }
                notificationRepository.saveAll(existing);
            } else {
                User recipient = userRepository != null
                        ? userRepository.findById(userId).orElse(principal.getUser())
                        : principal.getUser();
                com.evshare.notification.entity.Notification ackNotif = new com.evshare.notification.entity.Notification(
                        UUID.randomUUID(),
                        recipient,
                        trip.getVehicle() != null ? trip.getVehicle().getId() : null,
                        null,
                        "TRIP",
                        tripId,
                        "COMPLETED_TRIP_VIEWED",
                        "ĐÃ XEM CHI TIẾT CHUYẾN ĐI",
                        "Đồng sở hữu đã xem chi tiết chuyến đi hoàn tất.",
                        "INFO");
                ackNotif.setReadAt(now);
                notificationRepository.save(ackNotif);
            }
            notificationRepository.flush();
        }

        TripResponse res = enrichTripResponse(trip, userId);
        if (res != null) {
            res.setIsAcknowledged(true);
        }
        return res;
    }

    /**
     * Retrieve chronological trip history for a vehicle.
     * Accessible by STAFF/ADMIN and CO_OWNER who has access to the vehicle.
     */
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsForVehicle(UUID vehicleId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new AccessDeniedException("YÊU CẦU ĐĂNG NHẬP");
        }
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phương tiện với mã: " + vehicleId));

        if (principal.getUser().getRole() == Role.CO_OWNER) {
            UUID userId = principal.getId();
            if (!hasUserAccessToVehicle(userId, vehicleId)) {
                throw new AccessDeniedException("Bạn không có quyền truy cập lịch sử của xe này.");
            }
        }

        List<Trip> trips = tripRepository.findByVehicleIdOrderByStartedAtDesc(vehicleId);
        return trips.stream().map(this::enrichTripResponse).collect(Collectors.toList());
    }

    /**
     * CO_OWNER requests vehicle return (Phase 10-12 & Section 7).
     * Validates: authenticated CO_OWNER, authorized active trip, correct vehicle,
     * trip not already completed, no duplicate return request.
     * Records return_requested_at without finalizing STAFF inspection.
     */
    @Transactional
    public TripResponse requestTripReturn(UUID tripId, UUID currentUserId, Role currentUserRole) {
        if (currentUserRole != Role.CO_OWNER) {
            throw new AccessDeniedException("Chỉ chủ xe của chuyến đi mới có quyền yêu cầu trả xe.");
        }

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với mã: " + tripId));

        if (trip.getUser() == null || !trip.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException(MSG_NOT_TRIP_OWNER);
        }

        if (trip.getStatus() == TripStatus.COMPLETED) {
            throw new IllegalStateException(MSG_TRIP_ALREADY_COMPLETED);
        }
        if (trip.getStatus() != TripStatus.ACTIVE) {
            throw new IllegalStateException(MSG_TRIP_NOT_ACTIVE);
        }

        if (trip.getReturnRequestedAt() != null) {
            throw new DuplicateResourceException("Yêu cầu trả xe đã được gửi và đang chờ nhân viên tiếp nhận.");
        }

        trip.setReturnRequestedAt(Instant.now());
        Trip savedTrip = tripRepository.save(trip);

        if (extensionService != null) {
            try {
                extensionService.invalidatePendingRequestsForTrip(tripId);
            } catch (Exception ex) {
                log.warn("Failed to invalidate pending extension requests on return request: {}", ex.getMessage());
            }
        }

        if (notificationService != null) {
            try {
                notificationService.notifyStaffReturnRequested(savedTrip);
            } catch (Exception ex) {
                log.error("Failed to send return request notification for trip {}: {}", savedTrip.getId(),
                        ex.getMessage(), ex);
            }
        }

        return enrichTripResponse(savedTrip);
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
     * Complete / check-out an active trip (Phase 12 & Phase 18 Realistic EV Energy
     * Model).
     * Atomic, concurrency-safe check-out workflow.
     * Transactionally updates Trip, Vehicle, and Booking.
     */
    @Transactional
    public TripResponse completeTrip(UUID tripId, UUID currentUserId, Role currentUserRole,
            BigDecimal requestedEndOdometer) {
        // 1. Role validation: Must be CO_OWNER (STAFF/ADMIN cannot execute normal
        // CO_OWNER checkout)
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
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy phương tiện với mã: " + vehicle.getId()));

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
            // Canonical demo distance: 35.00 km (as specified in realistic EV energy model
            // example)
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
                managedVehicle);

        int endBatteryInt = Math.max(0, Math.min(100, (int) Math.round(energyResult.getEndSocPercent().doubleValue())));

        // 8. Snapshot authoritative end telemetry to Trip
        trip.setStatus(TripStatus.COMPLETED);
        trip.setEndedAt(now);
        trip.setEndOdometer(endOdo);
        trip.setEndBatteryLevel(endBatteryInt);
        trip.setEndSocPercent(energyResult.getEndSocPercent());
        trip.setEnergyConsumedKwh(energyResult.getEnergyConsumedKwh());
        trip.setSocConsumedPercent(energyResult.getSocConsumedPercent());

        // 9. Update Vehicle telemetry while maintaining custody lock (VehicleStatus
        // remains IN_USE until staff return verification)
        managedVehicle.setStatus(VehicleStatus.IN_USE);
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

        // 11. Booking transition: Preserve original schedule & release unused booking interval
        Booking managedBooking = bookingRepository.findById(booking.getId())
                .orElse(booking);
        if (managedBooking.getOriginalStartTime() == null) {
            managedBooking.setOriginalStartTime(managedBooking.getStartTime());
        }
        if (managedBooking.getOriginalEndTime() == null) {
            managedBooking.setOriginalEndTime(managedBooking.getEndTime());
        }
        if (now.isBefore(managedBooking.getStartTime())) {
            managedBooking.setStartTime(now);
            managedBooking.setEndTime(now);
        } else if (managedBooking.getOriginalEndTime() != null && now.isBefore(managedBooking.getOriginalEndTime())) {
            managedBooking.setEndTime(now);
        }
        if (managedBooking.getStatus() == BookingStatus.CONFIRMED
                || managedBooking.getStatus() == BookingStatus.PENDING) {
            managedBooking.setStatus(BookingStatus.COMPLETED);
        }
        bookingRepository.save(managedBooking);

        // 12. Persist trip
        Trip savedTrip = tripRepository.save(trip);

        if (extensionService != null) {
            try {
                extensionService.invalidatePendingRequestsForTrip(tripId);
            } catch (Exception ex) {
                log.warn("Failed to invalidate pending extension requests on trip completion: {}", ex.getMessage());
            }
        }

        // Authoritatively create trip energy expense upon checkout if consumption > 0
        if (energyResult.getEnergyConsumedKwh() != null
                && energyResult.getEnergyConsumedKwh().compareTo(BigDecimal.ZERO) > 0) {
            if (expenseService != null) {
                try {
                    expenseService.createTripEnergyExpense(savedTrip, energyResult.getEnergyConsumedKwh(),
                            trip.getUser());
                } catch (Exception ex) {
                    log.error("Failed to generate trip energy expense upon checkout for trip {}: {}", savedTrip.getId(),
                            ex.getMessage(), ex);
                }
            }
        }

        if (notificationService != null) {
            try {
                BigDecimal verifiedDistance = BigDecimal.ZERO;
                if (savedTrip.getEndOdometer() != null && savedTrip.getStartOdometer() != null) {
                    verifiedDistance = savedTrip.getEndOdometer().subtract(savedTrip.getStartOdometer())
                            .max(BigDecimal.ZERO);
                }
                BigDecimal verifiedExpense = null;
                if (expenseService != null) {
                    var expOpt = expenseService.findByRelatedTripId(savedTrip.getId());
                    if (expOpt.isPresent()) {
                        verifiedExpense = expOpt.get().getAmount();
                    }
                }
                notificationService.notifyTripReturnConfirmed(savedTrip, verifiedDistance, verifiedExpense);
            } catch (Exception ex) {
                log.error("Failed to send return confirmation notification for trip {}: {}", savedTrip.getId(),
                        ex.getMessage(), ex);
            }
        }

        return enrichTripResponse(savedTrip);
    }

    /**
     * STAFF confirms vehicle return and verifies condition & energy usage (Phase 18
     * & 19).
     * Authoritatively creates verified trip energy expense.
     * Exclusively accessible by STAFF or ADMIN.
     */
    @Transactional
    public TripResponse confirmTripReturn(
            UUID tripId,
            ConfirmTripReturnRequest request,
            UUID staffUserId,
            Role staffUserRole) {
        if (staffUserRole != Role.STAFF && staffUserRole != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ nhân viên hoặc quản trị viên mới có quyền xác nhận trả xe.");
        }

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với mã: " + tripId));

        User staff = userRepository != null ? userRepository.findById(staffUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên: " + staffUserId)) : null;

        if (trip.getReturnVerifiedAt() != null) {
            // Idempotent: return existing confirmed trip without duplicating expenses or
            // mutations
            return enrichTripResponse(trip);
        }

        Vehicle vehicle = trip.getVehicle();
        if (vehicle == null) {
            throw new IllegalStateException("CHUYẾN ĐI THIẾU THÔNG TIN PHƯƠNG TIỆN");
        }

        // Section 9: Validate mandatory inspection values recorded by staff
        if (request == null || request.getEndBatteryLevel() == null || request.getEndOdometer() == null) {
            throw new IllegalArgumentException(
                    "Nhân viên phải ghi nhận đầy đủ mức pin kết thúc (SOC) và số km trên đồng hồ (odometer).");
        }
        if (request.getEndBatteryLevel() < 0 || request.getEndBatteryLevel() > 100) {
            throw new IllegalArgumentException("Mức pin kết thúc (SOC) phải nằm trong khoảng từ 0% đến 100%.");
        }
        if (trip.getStartOdometer() != null && request.getEndOdometer().compareTo(trip.getStartOdometer()) < 0) {
            throw new IllegalArgumentException("Số km kết thúc (" + request.getEndOdometer()
                    + " km) không thể nhỏ hơn số km bắt đầu (" + trip.getStartOdometer() + " km).");
        }

        // 1. Link & validate Return Inspection if provided or found
        if (request.getInspectionId() != null && inspectionRepository != null) {
            VehicleInspection inspection = inspectionRepository.findById(request.getInspectionId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy biên bản kiểm tra: " + request.getInspectionId()));
            if (!inspection.getVehicle().getId().equals(vehicle.getId())) {
                throw new IllegalArgumentException("Biên bản kiểm tra không thuộc về phương tiện này.");
            }
            if (inspection.getStatus() != InspectionStatus.COMPLETED) {
                throw new IllegalStateException("Biên bản kiểm tra chưa hoàn tất, không thể xác nhận trả xe.");
            }
            trip.setReturnInspection(inspection);
        } else if (inspectionRepository != null && trip.getReturnInspection() == null) {
            inspectionRepository.findLatestCompletedByVehicleIdAndType(vehicle.getId(), InspectionType.POST_TRIP)
                    .ifPresent(trip::setReturnInspection);
        }

        // 2. If trip was still ACTIVE, finalize it
        Instant now = Instant.now();
        if (trip.getStatus() == TripStatus.ACTIVE) {
            trip.setStatus(TripStatus.COMPLETED);
            trip.setEndedAt(now);
        } else if (trip.getEndedAt() == null) {
            trip.setEndedAt(now);
        }

        // Re-read managed vehicle to avoid optimistic locking
        Vehicle managedVehicle = vehicleRepository.findById(vehicle.getId()).orElse(vehicle);

        BigDecimal startOdo = trip.getStartOdometer() != null
                ? trip.getStartOdometer()
                : (managedVehicle.getOdometer() != null ? managedVehicle.getOdometer() : BigDecimal.ZERO);
        BigDecimal endOdo = request.getEndOdometer();
        BigDecimal distanceKm = endOdo.subtract(startOdo).max(BigDecimal.ZERO);

        BigDecimal startSoc = trip.getStartBatteryLevel() != null
                ? new BigDecimal(trip.getStartBatteryLevel())
                : (managedVehicle.getCurrentBatteryLevel() != null
                        ? new BigDecimal(managedVehicle.getCurrentBatteryLevel())
                        : new BigDecimal("100.00"));

        // Authoritative realistic EV energy model calculation
        TripEnergyCalculationResult energyResult = energyModelService.calculateTripConsumption(
                startOdo,
                endOdo,
                startSoc,
                managedVehicle);

        // Find intermediate charging energy delivered during trip
        BigDecimal intermediateKwh = BigDecimal.ZERO;
        if (chargingSessionRepository != null && trip.getStartedAt() != null) {
            Instant tripEnd = trip.getEndedAt() != null ? trip.getEndedAt() : now;
            List<com.evshare.charging.entity.ChargingSession> sessions = chargingSessionRepository
                    .findByVehicleIdOrderByCreatedAtDesc(managedVehicle.getId());
            for (var s : sessions) {
                if (s.getStartedAt() != null && !s.getStartedAt().isBefore(trip.getStartedAt())
                        && !s.getStartedAt().isAfter(tripEnd)) {
                    if (s.getEnergyDeliveredKwh() != null && s.getEnergyDeliveredKwh().compareTo(BigDecimal.ZERO) > 0) {
                        intermediateKwh = intermediateKwh.add(s.getEnergyDeliveredKwh());
                    }
                }
            }
        }

        // 3. Resolve ending battery SOC and consumed energy:
        // Distinguish instrument-measured reading vs unadjusted default reading
        int endBatteryInt;
        BigDecimal endSocPercent;
        BigDecimal socConsumedPercent;
        BigDecimal energyConsumedKwh;

        Integer staffEnteredSoc = request.getEndBatteryLevel();

        if (distanceKm.compareTo(BigDecimal.ZERO) > 0) {
            // Case A: Staff explicitly measured battery reading that reflects depletion (<
            // startSoc)
            if (staffEnteredSoc != null && staffEnteredSoc < startSoc.intValue()) {
                endBatteryInt = staffEnteredSoc;
                endSocPercent = new BigDecimal(endBatteryInt);
                socConsumedPercent = startSoc.subtract(endSocPercent).max(BigDecimal.ZERO);
                BigDecimal usableCap = energyResult.getUsableBatteryCapacityKwh();
                energyConsumedKwh = usableCap.compareTo(BigDecimal.ZERO) > 0
                        ? socConsumedPercent.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP).multiply(usableCap)
                        : energyResult.getEnergyConsumedKwh();
            }
            // Case B: Vehicle charged mid-trip and staff entered the recharged level
            else if (intermediateKwh.compareTo(BigDecimal.ZERO) > 0 && staffEnteredSoc != null) {
                endBatteryInt = staffEnteredSoc;
                endSocPercent = new BigDecimal(endBatteryInt);
                socConsumedPercent = BigDecimal.ZERO;
                energyConsumedKwh = BigDecimal.ZERO;
            }
            // Case C: Staff left unadjusted default/start battery (>= startSoc without
            // charging)
            // Authoritative realistic physical consumption model MUST be applied
            else {
                endBatteryInt = Math.max(0,
                        Math.min(100, (int) Math.round(energyResult.getEndSocPercent().doubleValue())));
                endSocPercent = energyResult.getEndSocPercent();
                socConsumedPercent = energyResult.getSocConsumedPercent();
                energyConsumedKwh = energyResult.getEnergyConsumedKwh();
            }
        } else {
            // No distance traveled
            endBatteryInt = staffEnteredSoc != null ? staffEnteredSoc : startSoc.intValue();
            endSocPercent = new BigDecimal(endBatteryInt);
            socConsumedPercent = BigDecimal.ZERO;
            energyConsumedKwh = BigDecimal.ZERO;
        }

        // Snapshot authoritative telemetry to Trip
        if (trip.getStartBatteryLevel() == null) {
            trip.setStartBatteryLevel(startSoc.intValue());
        }
        if (trip.getStartOdometer() == null) {
            trip.setStartOdometer(startOdo);
        }
        trip.setEndBatteryLevel(endBatteryInt);
        trip.setEndSocPercent(endSocPercent);
        trip.setEndOdometer(endOdo);
        trip.setEnergyConsumedKwh(energyConsumedKwh);
        trip.setSocConsumedPercent(socConsumedPercent);

        // Update Vehicle state and authoritative telemetry
        managedVehicle.setStatus(VehicleStatus.AVAILABLE);
        managedVehicle.setOdometer(endOdo);
        managedVehicle.setCurrentBatteryLevel(endBatteryInt);
        vehicleRepository.save(managedVehicle);

        // Update VehicleBatteryHealth estimated range
        if (batteryHealthRepository != null) {
            batteryHealthRepository.findByVehicleId(managedVehicle.getId()).ifPresent(health -> {
                if (energyResult.getEnergyConsumptionKwhPer100Km().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal estimatedKm = endSocPercent
                            .multiply(energyResult.getUsableBatteryCapacityKwh())
                            .divide(energyResult.getEnergyConsumptionKwhPer100Km(), 2, RoundingMode.HALF_UP);
                    health.setEstimatedRangeKm(estimatedKm);
                    batteryHealthRepository.save(health);
                }
            });
        }

        // 4. Complete linked booking & release remaining unused booking interval (Global Early Return Slot Release)
        Booking booking = trip.getBooking();
        if (booking != null) {
            Booking managedBooking = bookingRepository.findById(booking.getId()).orElse(booking);

            // Preserve original scheduled booking times for historical and audit purposes
            if (managedBooking.getOriginalStartTime() == null) {
                managedBooking.setOriginalStartTime(managedBooking.getStartTime());
            }
            if (managedBooking.getOriginalEndTime() == null) {
                managedBooking.setOriginalEndTime(managedBooking.getEndTime());
            }

            Instant actualReturnTime = trip.getEndedAt() != null ? trip.getEndedAt() : now;

            // Early Return Interval Release:
            if (actualReturnTime.isBefore(managedBooking.getStartTime())) {
                // If returned before the original booking start time, release the entire unused reservation interval
                managedBooking.setStartTime(actualReturnTime);
                managedBooking.setEndTime(actualReturnTime);
            } else if (managedBooking.getOriginalEndTime() != null && actualReturnTime.isBefore(managedBooking.getOriginalEndTime())) {
                // If returned during the booking period, release only the remaining unused interval
                managedBooking.setEndTime(actualReturnTime);
            }

            managedBooking.setStatus(BookingStatus.COMPLETED);
            bookingRepository.save(managedBooking);

            if (handoverRepository != null) {
                handoverRepository.findByBookingId(booking.getId()).ifPresent(h -> {
                    if (h.getStatus() != HandoverStatus.COMPLETED) {
                        h.setStatus(HandoverStatus.COMPLETED);
                        handoverRepository.save(h);
                    }
                });
            }
        }

        // 5. Reliable SOC / Energy verification (Section 3 & Scenario F)
        BigDecimal verifiedEnergyKwh = energyConsumedKwh.add(intermediateKwh);

        // 6. Automatic Expense Creation (Sections 4, 5, 7, 9)
        if (verifiedEnergyKwh != null && verifiedEnergyKwh.compareTo(BigDecimal.ZERO) > 0) {
            if (expenseService != null) {
                try {
                    expenseService.createTripEnergyExpense(trip, verifiedEnergyKwh, staff);
                } catch (Exception ex) {
                    log.error("Failed to generate trip energy expense for trip {}: {}", trip.getId(), ex.getMessage(),
                            ex);
                    String warnNote = "[Lỗi hạch toán chi phí: " + ex.getMessage() + "]";
                    trip.setReturnNote(trip.getReturnNote() != null ? trip.getReturnNote() + " " + warnNote : warnNote);
                }
            }
        } else {
            // Inconsistent/missing data: keep charging reconciliation pending (Scenario F)
            String pendingNote = "[Chờ đối soát dữ liệu điện]";
            String note = request != null && request.getConditionNote() != null
                    ? request.getConditionNote() + " " + pendingNote
                    : pendingNote;
            trip.setReturnNote(note);
        }

        // 7. Record staff return verification metadata
        trip.setReturnVerifiedBy(staff);
        trip.setReturnVerifiedAt(now);
        if (trip.getReturnNote() == null && request != null) {
            trip.setReturnNote(request.getConditionNote());
        }

        Trip savedTrip = tripRepository.save(trip);

        if (notificationService != null) {
            try {
                BigDecimal verifiedDistance = BigDecimal.ZERO;
                if (savedTrip.getEndOdometer() != null && savedTrip.getStartOdometer() != null) {
                    verifiedDistance = savedTrip.getEndOdometer().subtract(savedTrip.getStartOdometer())
                            .max(BigDecimal.ZERO);
                }
                BigDecimal verifiedExpense = null;
                if (expenseService != null) {
                    var expOpt = expenseService.findByRelatedTripId(savedTrip.getId());
                    if (expOpt.isPresent()) {
                        verifiedExpense = expOpt.get().getAmount();
                    }
                }
                notificationService.notifyTripReturnConfirmed(savedTrip, verifiedDistance, verifiedExpense);
            } catch (Exception ex) {
                log.error("Failed to send return confirmation notification for trip {}: {}", savedTrip.getId(),
                        ex.getMessage(), ex);
            }
        }

        return enrichTripResponse(savedTrip);
    }
}
