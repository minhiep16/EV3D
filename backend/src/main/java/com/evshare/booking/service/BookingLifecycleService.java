package com.evshare.booking.service;

import com.evshare.booking.dto.BookingViolationResponse;
import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.entity.BookingViolation;
import com.evshare.booking.entity.BookingViolationStatus;
import com.evshare.booking.entity.BookingViolationType;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.booking.repository.BookingViolationRepository;
import com.evshare.charging.entity.ChargingSessionStatus;
import com.evshare.charging.repository.ChargingSessionRepository;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.handover.entity.HandoverStatus;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.inspection.entity.InspectionOverallResult;
import com.evshare.maintenance.entity.MaintenanceStatus;
import com.evshare.maintenance.repository.MaintenanceRequestRepository;
import com.evshare.notification.service.NotificationService;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BookingLifecycleService {

    private static final Logger log = LoggerFactory.getLogger(BookingLifecycleService.class);

    public static final int DEFAULT_GRACE_PERIOD_MINUTES = 15;

    @Value("${app.booking.no-show-grace-period-minutes:15}")
    private int gracePeriodMinutes = DEFAULT_GRACE_PERIOD_MINUTES;

    private final BookingRepository bookingRepository;
    private final BookingViolationRepository violationRepository;
    private final VehicleHandoverRepository handoverRepository;
    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Autowired(required = false)
    private NotificationService notificationService;

    @Autowired(required = false)
    private MaintenanceRequestRepository maintenanceRepository;

    @Autowired(required = false)
    private ChargingSessionRepository chargingSessionRepository;

    @Autowired(required = false)
    private com.evshare.dispute.incident.BookingIncidentDetectionService incidentDetectionService;

    public BookingLifecycleService(
            BookingRepository bookingRepository,
            BookingViolationRepository violationRepository,
            VehicleHandoverRepository handoverRepository,
            TripRepository tripRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.violationRepository = violationRepository;
        this.handoverRepository = handoverRepository;
        this.tripRepository = tripRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    public int getGracePeriodMinutes() {
        return gracePeriodMinutes;
    }

    public void setGracePeriodMinutes(int gracePeriodMinutes) {
        this.gracePeriodMinutes = gracePeriodMinutes;
    }

    /**
     * Periodic scheduled runner:
     * 1. Detect and process no-show bookings past the grace period.
     * 2. Reconcile stale vehicle IN_USE statuses when no active trip exists.
     */
    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void runLifecycleMonitoring() {
        Instant now = Instant.now();
        evaluateNoShowBookings(now);
        evaluateOverdueTrips(now);
        reconcileStaleInUseVehicles();
    }

    /**
     * Scan candidate confirmed bookings whose start time plus grace period has
     * passed.
     */
    @Transactional
    public void evaluateNoShowBookings(Instant now) {
        Instant cutoffTime = now.minus(Duration.ofMinutes(gracePeriodMinutes));
        List<Booking> candidates = bookingRepository.findPotentialNoShowBookings(cutoffTime);

        for (Booking booking : candidates) {
            try {
                processSingleBookingEvaluation(booking, now);
            } catch (Exception ex) {
                log.error("Lỗi khi xử lý kiểm tra no-show cho lịch đặt {}: {}", booking.getId(), ex.getMessage(), ex);
            }
        }
    }

    /**
     * Evaluates a single booking for no-show eligibility and applies state
     * transitions.
     */
    @Transactional
    public void processSingleBookingEvaluation(Booking booking, Instant now) {
        if (booking == null || booking.getStatus() != BookingStatus.CONFIRMED) {
            return;
        }

        // Case C: Trip already started
        Optional<Trip> tripOpt = tripRepository.findByBookingId(booking.getId());
        if (tripOpt.isPresent()) {
            return;
        }

        // Violation already recorded for this booking
        if (violationRepository.existsByBookingId(booking.getId())) {
            return;
        }

        // Grace period check
        Instant scheduledStart = booking.getStartTime();
        Instant graceExpiry = scheduledStart.plus(Duration.ofMinutes(gracePeriodMinutes));
        if (now.isBefore(graceExpiry)) {
            // Still in grace period
            return;
        }

        // Obstacle Exemption Verification:
        // Do NOT penalize member if departure was blocked by staff delay, inspection
        // failure, maintenance, charging, or previous custody.
        Optional<VehicleHandover> handoverOpt = handoverRepository.findByBookingId(booking.getId());
        VehicleHandover handover = handoverOpt.orElse(null);

        if (isExemptDueToObstacles(booking, handover)) {
            log.info("Lịch đặt {} miễn trừ vi phạm no-show do có trở ngại vận hành từ phía nhân viên/xe/hệ thống.",
                    booking.getId());
            return;
        }

        // Determine CASE A vs CASE B
        boolean hasPhysicalCustody = handover != null && (handover.getStatus() == HandoverStatus.HANDED_OVER ||
                handover.getStatus() == HandoverStatus.OWNER_CONFIRMED);

        if (hasPhysicalCustody) {
            // CASE B: Vehicle physically handed over, but co-owner never started trip
            // within grace period
            handleCaseBCustodyRetained(booking, handover, now);
        } else {
            // CASE A: Vehicle NOT physically handed over (member did not show up to claim
            // vehicle)
            handleCaseAUnclaimed(booking, handover, now);
        }
    }

    /**
     * Checks if member departure was blocked by operational obstacles.
     */
    private boolean isExemptDueToObstacles(Booking booking, VehicleHandover handover) {
        Vehicle vehicle = booking.getVehicle();
        if (vehicle == null)
            return false;

        // 1. Staff handover preparation incomplete / delayed
        if (handover != null) {
            if (handover.getStatus() == HandoverStatus.PENDING_PREPARATION ||
                    handover.getStatus() == HandoverStatus.INSPECTION_IN_PROGRESS) {
                return true;
            }
            if (handover.getInspection() != null &&
                    handover.getInspection().getOverallResult() == InspectionOverallResult.FAIL) {
                return true;
            }
            // If handover was created but staff hasn't completed handover yet
            if (handover.getStatus() == HandoverStatus.READY_FOR_HANDOVER && handover.getStaffHandedOverAt() == null) {
                return true;
            }
        }

        // 2. Vehicle under active maintenance
        if (vehicle.getStatus() == VehicleStatus.MAINTENANCE) {
            return true;
        }
        if (maintenanceRepository != null) {
            boolean hasActiveMaintenance = maintenanceRepository.existsByVehicleIdAndStatus(vehicle.getId(),
                    MaintenanceStatus.IN_PROGRESS)
                    || maintenanceRepository.existsByVehicleIdAndStatus(vehicle.getId(), MaintenanceStatus.SCHEDULED);
            if (hasActiveMaintenance) {
                return true;
            }
        }

        // 3. Vehicle currently charging
        if (vehicle.getStatus() == VehicleStatus.CHARGING) {
            return true;
        }
        if (chargingSessionRepository != null) {
            boolean hasActiveCharging = chargingSessionRepository.existsByVehicleIdAndStatus(vehicle.getId(),
                    ChargingSessionStatus.ACTIVE);
            if (hasActiveCharging) {
                return true;
            }
        }

        // 4. Previous unresolved custody on this vehicle by another member
        UUID excludeHandoverId = handover != null ? handover.getId() : null;
        List<VehicleHandover> otherCustodies = handoverRepository.findCustodyHandoversForVehicle(vehicle.getId(),
                excludeHandoverId);
        if (!otherCustodies.isEmpty()) {
            return true;
        }

        // 5. Active trip or vehicle IN_USE / overdue custody by another member
        if (vehicle.getStatus() == VehicleStatus.IN_USE) {
            return true;
        }
        if (tripRepository != null) {
            Optional<Trip> activeTrip = tripRepository.findActiveTripByVehicleId(vehicle.getId());
            if (activeTrip.isPresent()) {
                Booking activeTripBooking = activeTrip.get().getBooking();
                if (activeTripBooking == null || !activeTripBooking.getId().equals(booking.getId())) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * CASE A: Vehicle NOT physically handed over.
     * Actions:
     * - Transition Booking to EXPIRED
     * - Cancel pending handover
     * - Release vehicle status to AVAILABLE (if RESERVED and not in custody)
     * - Record violation NO_SHOW_UNCLAIMED
     * - Notify member & staff
     */
    private void handleCaseAUnclaimed(Booking booking, VehicleHandover handover, Instant now) {
        log.warn("CASE A No-Show phát hiện: Lịch đặt {} (Xe: {}) không được nhận xe trong vòng {} phút.",
                booking.getId(), booking.getVehicle().getLicensePlate(), gracePeriodMinutes);

        // Update booking status
        booking.setStatus(BookingStatus.EXPIRED);
        bookingRepository.save(booking);

        // Cancel pending handover if exists
        if (handover != null && handover.getStatus() != HandoverStatus.COMPLETED) {
            handover.setStatus(HandoverStatus.CANCELLED);
            handoverRepository.save(handover);
        }

        // Release vehicle to AVAILABLE
        Vehicle vehicle = booking.getVehicle();
        if (vehicle != null) {
            reconcileVehicleStatus(vehicle.getId());
        }

        // Record Violation
        BookingViolation violation = new BookingViolation(
                UUID.randomUUID(),
                booking,
                booking.getUser(),
                vehicle,
                BookingViolationType.NO_SHOW_UNCLAIMED,
                booking.getStartTime(),
                now,
                gracePeriodMinutes,
                "Hết thời gian chờ " + gracePeriodMinutes
                        + " phút sau giờ bắt đầu đặt xe nhưng thành viên chưa đến nhận xe.",
                BookingViolationStatus.RECORDED);
        violationRepository.save(violation);

        // Notify member and staff
        dispatchNoShowNotifications(booking, violation, false);
    }

    /**
     * CASE B: Vehicle physically handed over, but trip never started within grace
     * period.
     * Actions:
     * - Record violation NO_SHOW_CUSTODY_RETAINED with resolutionStatus
     * RECOVERY_PENDING
     * - Maintain exclusive custody lock (RESERVED)
     * - Block late trip start
     * - Notify staff immediately for vehicle recovery
     */
    private void handleCaseBCustodyRetained(Booking booking, VehicleHandover handover, Instant now) {
        log.warn("CASE B No-Show phát hiện: Lịch đặt {} (Xe: {}) đã nhận bàn giao nhưng không xuất phát chuyến đi.",
                booking.getId(), booking.getVehicle().getLicensePlate());

        // Vehicle operational status remains RESERVED (custody lock)
        Vehicle vehicle = booking.getVehicle();
        if (vehicle != null && vehicle.getStatus() != VehicleStatus.RESERVED) {
            vehicle.setStatus(VehicleStatus.RESERVED);
            vehicleRepository.save(vehicle);
        }

        // Record Violation requiring recovery
        BookingViolation violation = new BookingViolation(
                UUID.randomUUID(),
                booking,
                booking.getUser(),
                vehicle,
                BookingViolationType.NO_SHOW_CUSTODY_RETAINED,
                booking.getStartTime(),
                now,
                gracePeriodMinutes,
                "Thành viên đã nhận bàn giao xe nhưng không xuất phát chuyến đi trong thời gian chờ (" +
                        gracePeriodMinutes + " phút). Phương tiện đang chờ nhân viên thu hồi vào bãi.",
                BookingViolationStatus.RECOVERY_PENDING);
        violationRepository.save(violation);

        // High priority notifications to Staff and Co-owner
        dispatchNoShowNotifications(booking, violation, true);
    }

    /**
     * Authorized staff action to recover vehicle after CASE B no-show.
     */
    @Transactional
    public BookingViolationResponse recoverVehicle(UUID violationIdOrHandoverId, UUID staffId, String recoveryNote) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin nhân viên"));

        if (staff.getRole() != Role.STAFF && staff.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ nhân viên hoặc quản trị viên mới có quyền xác nhận thu hồi xe");
        }

        // Find violation either by violation id or by looking up from handover id
        BookingViolation violation = violationRepository.findById(violationIdOrHandoverId).orElse(null);
        VehicleHandover handover = null;

        if (violation == null) {
            // Check if violationIdOrHandoverId is a handover id
            handover = handoverRepository.findById(violationIdOrHandoverId).orElse(null);
            if (handover != null && handover.getBooking() != null) {
                violation = violationRepository.findByBookingId(handover.getBooking().getId()).orElse(null);
            }
        } else if (violation.getBooking() != null) {
            handover = handoverRepository.findByBookingId(violation.getBooking().getId()).orElse(null);
        }

        if (violation == null && handover == null) {
            throw new ResourceNotFoundException("Không tìm thấy thông tin vi phạm hoặc hồ sơ bàn giao xe cần thu hồi");
        }

        Instant now = Instant.now();

        // Close handover
        if (handover != null && handover.getStatus() != HandoverStatus.COMPLETED) {
            handover.setStatus(HandoverStatus.COMPLETED);
            handoverRepository.save(handover);
        }

        // Resolve violation
        if (violation != null) {
            violation.setResolutionStatus(BookingViolationStatus.RESOLVED);
            violation.setResolvedAt(now);
            violation.setResolvedBy(staff);
            violation.setResolutionNote(recoveryNote != null && !recoveryNote.isBlank()
                    ? recoveryNote
                    : "Nhân viên " + staff.getFullName() + " đã thu hồi phương tiện về bãi an toàn.");
            violationRepository.save(violation);
        }

        // Expire booking if not already ended
        if (violation != null && violation.getBooking() != null) {
            Booking b = violation.getBooking();
            if (b.getStatus() == BookingStatus.CONFIRMED) {
                b.setStatus(BookingStatus.EXPIRED);
                bookingRepository.save(b);
            }
        }

        // Reconcile vehicle back to AVAILABLE
        Vehicle vehicle = null;
        if (violation != null && violation.getVehicle() != null) {
            vehicle = violation.getVehicle();
        } else if (handover != null && handover.getVehicle() != null) {
            vehicle = handover.getVehicle();
        }

        if (vehicle != null) {
            reconcileVehicleStatus(vehicle.getId());
        }

        log.info("Thu hồi phương tiện thành công: Xe {} đã được nhân viên {} thu hồi vào bãi.",
                vehicle != null ? vehicle.getLicensePlate() : "N/A", staff.getFullName());

        return violation != null ? BookingViolationResponse.fromEntity(violation) : null;
    }

    /**
     * Scans active trips that have exceeded their authoritative return deadline.
     * 1. Records an OVERDUE_RETURN violation (idempotent, prevents duplicate).
     * 2. Identifies affected subsequent bookings and preserves them.
     * 3. Dispatches notifications to: driver, affected booking owners, and staff.
     * 4. Triggers dispute incident detection with immutable evidence timeline.
     */
    @Transactional
    public void evaluateOverdueTrips(Instant now) {
        if (tripRepository == null)
            return;
        List<Trip> activeTrips = tripRepository.findAll().stream()
                .filter(t -> t.getStatus() == TripStatus.ACTIVE)
                .collect(Collectors.toList());

        for (Trip trip : activeTrips) {
            try {
                processSingleOverdueTrip(trip, now);
            } catch (Exception ex) {
                log.error("Lỗi khi kiểm tra chuyến đi quá hạn {}: {}", trip.getId(), ex.getMessage(), ex);
            }
        }
    }

    private void processSingleOverdueTrip(Trip trip, Instant now) {
        Booking booking = trip.getBooking();
        Vehicle vehicle = trip.getVehicle();
        if (booking == null || vehicle == null)
            return;

        Instant deadline = booking.getEndTime();
        if (deadline == null)
            return;

        // Authoritative deadline check with grace period
        Instant overdueThreshold = deadline.plus(Duration.ofMinutes(gracePeriodMinutes));
        if (!now.isAfter(overdueThreshold)) {
            return; // Still within scheduled window or grace period
        }

        // Idempotent: check if OVERDUE_RETURN violation already recorded for this
        // booking
        if (!violationRepository.existsByBookingIdAndViolationType(booking.getId(),
                BookingViolationType.OVERDUE_RETURN)) {
            long overdueMinutes = Duration.between(deadline, now).toMinutes();
            BookingViolation violation = new BookingViolation(
                    UUID.randomUUID(),
                    booking,
                    booking.getUser(),
                    vehicle,
                    BookingViolationType.OVERDUE_RETURN,
                    deadline,
                    now,
                    gracePeriodMinutes,
                    String.format(
                            "Phương tiện chưa được hoàn trả sau thời hạn kết thúc lịch đặt (%s), quá hạn %d phút.",
                            formatTime(deadline), overdueMinutes),
                    BookingViolationStatus.RECORDED);
            violationRepository.save(violation);
            log.warn("Ghi nhận vi phạm trả xe quá hạn (OVERDUE_RETURN) cho chuyến đi {} / lịch đặt {}",
                    trip.getId(), booking.getId());
        }

        // Identify affected subsequent bookings on this vehicle
        Instant lookahead = now.plus(Duration.ofHours(6));
        List<Booking> subsequentBookings = bookingRepository.findByVehicleIdAndStatusInOrderByStartTimeAsc(
                vehicle.getId(),
                List.of(BookingStatus.CONFIRMED)).stream()
                .filter(b -> b.getStartTime().isAfter(booking.getStartTime()) && b.getStartTime().isBefore(lookahead))
                .collect(Collectors.toList());

        // Notify current vehicle recipient (driver)
        if (notificationService != null && booking.getUser() != null) {
            try {
                long overdueMinutes = Duration.between(deadline, now).toMinutes();
                notificationService.notifyDriverTripOverdue(booking.getUser().getId(), vehicle.getId(), trip.getId(),
                        vehicle.getName() != null ? vehicle.getName() : vehicle.getLicensePlate(), overdueMinutes);
            } catch (Exception ex) {
                log.warn("Lỗi gửi thông báo trễ hạn cho tài xế: {}", ex.getMessage());
            }
        }

        // Notify affected subsequent booking owners & PRESERVE their bookings (do not
        // cancel!)
        for (Booking nextBooking : subsequentBookings) {
            if (notificationService != null && nextBooking.getUser() != null) {
                try {
                    notificationService.notifyAffectedBookingOwner(
                            nextBooking.getUser().getId(),
                            vehicle.getId(),
                            nextBooking.getId(),
                            vehicle.getName() != null ? vehicle.getName() : vehicle.getLicensePlate(),
                            nextBooking.getStartTime());
                } catch (Exception ex) {
                    log.warn("Lỗi gửi thông báo cho thành viên bị ảnh hưởng: {}", ex.getMessage());
                }
            }
        }

        // Notify authorized STAFF
        if (notificationService != null) {
            try {
                long overdueMinutes = Duration.between(deadline, now).toMinutes();
                notificationService.notifyStaffVehicleOverdue(
                        vehicle.getId(),
                        trip.getId(),
                        vehicle.getName() != null ? vehicle.getName() : vehicle.getLicensePlate(),
                        overdueMinutes,
                        subsequentBookings.size());
            } catch (Exception ex) {
                log.warn("Lỗi gửi thông báo trễ hạn cho nhân viên: {}", ex.getMessage());
            }
        }

        // Trigger dispute/incident detection service for this vehicle
        if (incidentDetectionService != null) {
            try {
                incidentDetectionService.evaluateIncidentsForVehicle(vehicle.getId(), now, true);
            } catch (Exception ex) {
                log.warn("Lỗi đồng bộ sự cố quá hạn vào hệ thống giải quyết tranh chấp: {}", ex.getMessage());
            }
        }
    }

    private String formatTime(Instant instant) {
        if (instant == null)
            return "N/A";
        return java.time.format.DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")
                .withZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh"))
                .format(instant);
    }

    /**
     * Authoritative operational status reconciliation for vehicles.
     * Ensures vehicle status accurately reflects active trips, custody,
     * maintenance, and availability.
     */
    @Transactional
    public void reconcileVehicleStatus(UUID vehicleId) {
        if (vehicleId == null)
            return;
        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);
        if (vehicle == null)
            return;

        VehicleStatus originalStatus = vehicle.getStatus();

        // 1. If active trip exists -> IN_USE
        boolean hasActiveTrip = tripRepository.existsByVehicleIdAndStatus(vehicleId, TripStatus.ACTIVE);
        if (hasActiveTrip) {
            if (originalStatus != VehicleStatus.IN_USE) {
                vehicle.setStatus(VehicleStatus.IN_USE);
                vehicleRepository.save(vehicle);
            }
            return;
        }

        // 2. If active maintenance -> MAINTENANCE
        if (maintenanceRepository != null) {
            boolean hasActiveMaintenance = maintenanceRepository.existsByVehicleIdAndStatus(vehicleId,
                    MaintenanceStatus.IN_PROGRESS);
            if (hasActiveMaintenance) {
                if (originalStatus != VehicleStatus.MAINTENANCE) {
                    vehicle.setStatus(VehicleStatus.MAINTENANCE);
                    vehicleRepository.save(vehicle);
                }
                return;
            }
        }

        // 3. If active charging -> CHARGING
        if (chargingSessionRepository != null) {
            boolean hasActiveCharging = chargingSessionRepository.existsByVehicleIdAndStatus(vehicleId,
                    ChargingSessionStatus.ACTIVE);
            if (hasActiveCharging) {
                if (originalStatus != VehicleStatus.CHARGING) {
                    vehicle.setStatus(VehicleStatus.CHARGING);
                    vehicleRepository.save(vehicle);
                }
                return;
            }
        }

        // 4. If pending recovery or active physical custody exists -> RESERVED
        List<BookingViolation> pendingRecoveries = violationRepository.findPendingRecoveryByVehicleId(vehicleId);
        List<VehicleHandover> activeCustodies = handoverRepository.findCustodyHandoversForVehicle(vehicleId, null);
        if (!pendingRecoveries.isEmpty() || !activeCustodies.isEmpty()) {
            if (originalStatus != VehicleStatus.RESERVED) {
                vehicle.setStatus(VehicleStatus.RESERVED);
                vehicleRepository.save(vehicle);
            }
            return;
        }

        // 5. If confirmed booking is ongoing right now -> RESERVED
        Instant now = Instant.now();
        List<Booking> currentBookings = bookingRepository.findBookingsByVehicleAndOccurredTime(vehicleId, now);
        if (!currentBookings.isEmpty()) {
            if (originalStatus != VehicleStatus.RESERVED) {
                vehicle.setStatus(VehicleStatus.RESERVED);
                vehicleRepository.save(vehicle);
            }
            return;
        }

        // 6. Otherwise vehicle is AVAILABLE
        if (originalStatus == VehicleStatus.IN_USE || originalStatus == VehicleStatus.RESERVED) {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            vehicleRepository.save(vehicle);
        }
    }

    /**
     * Periodically cleans up vehicles falsely stuck in IN_USE without an active
     * trip.
     */
    private void reconcileStaleInUseVehicles() {
        try {
            List<Vehicle> inUseVehicles = vehicleRepository.findByStatus(VehicleStatus.IN_USE);
            for (Vehicle v : inUseVehicles) {
                boolean hasActiveTrip = tripRepository.existsByVehicleIdAndStatus(v.getId(), TripStatus.ACTIVE);
                if (!hasActiveTrip) {
                    log.info(
                            "Phát hiện phương tiện {} có trạng thái IN_USE nhưng không có chuyến đi đang chạy. Tái đồng bộ trạng thái...",
                            v.getLicensePlate());
                    reconcileVehicleStatus(v.getId());
                }
            }
        } catch (Exception ex) {
            log.error("Lỗi khi kiểm tra phương tiện tồn đọng trạng thái IN_USE: {}", ex.getMessage());
        }
    }

    private void dispatchNoShowNotifications(Booking booking, BookingViolation violation, boolean isCustodyRetained) {
        if (notificationService == null || booking == null || booking.getUser() == null) {
            return;
        }

        UUID userId = booking.getUser().getId();
        UUID vehicleId = booking.getVehicle() != null ? booking.getVehicle().getId() : null;
        String plate = booking.getVehicle() != null ? booking.getVehicle().getLicensePlate() : "xe";

        try {
            if (isCustodyRetained) {
                // Member notification
                notificationService.sendNotification(
                        userId,
                        vehicleId,
                        null,
                        "BOOKING",
                        booking.getId(),
                        "BOOKING_NO_SHOW_CUSTODY_RETAINED",
                        "Vi phạm lịch đặt - Không xuất phát chuyến đi",
                        "Bạn đã nhận bàn giao xe " + plate
                                + " nhưng không xuất phát chuyến đi trong thời gian quy định (" +
                                gracePeriodMinutes + " phút). Nhân viên sẽ tiến hành thu hồi xe vào bãi.",
                        "HIGH");

                // Broadcast alert to staff
                List<User> staffMembers = userRepository.searchEligibleUsers(Role.STAFF, null, "");
                for (User staff : staffMembers) {
                    notificationService.sendNotification(
                            staff.getId(),
                            vehicleId,
                            null,
                            "BOOKING",
                            booking.getId(),
                            "STAFF_ALERT_VEHICLE_RECOVERY_REQUIRED",
                            "CẦN THU HỒI XE: " + plate + " (No-Show)",
                            "Chủ xe " + booking.getUser().getFullName()
                                    + " không xuất phát sau khi nhận bàn giao. Vui lòng kiểm tra và thu hồi xe vào bãi.",
                            "CRITICAL");
                }
            } else {
                // Member notification
                notificationService.sendNotification(
                        userId,
                        vehicleId,
                        null,
                        "BOOKING",
                        booking.getId(),
                        "BOOKING_NO_SHOW_UNCLAIMED",
                        "Lịch đặt xe đã hết hạn (No-Show)",
                        "Lịch đặt xe " + plate + " đã hết hạn do bạn không đến nhận xe trong thời gian chờ " +
                                gracePeriodMinutes + " phút. Xe đã được giải phóng cho thành viên khác.",
                        "MEDIUM");
            }
        } catch (Exception ex) {
            log.error("Lỗi khi gửi thông báo no-show cho booking {}: {}", booking.getId(), ex.getMessage());
        }
    }
}
