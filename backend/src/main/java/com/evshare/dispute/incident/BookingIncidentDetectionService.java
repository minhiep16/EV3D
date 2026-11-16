package com.evshare.dispute.incident;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.dispute.entity.Dispute;
import com.evshare.dispute.entity.DisputeCategory;
import com.evshare.dispute.entity.DisputePriority;
import com.evshare.dispute.entity.DisputeStatus;
import com.evshare.dispute.repository.DisputeRepository;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.notification.entity.Notification;
import com.evshare.notification.repository.NotificationRepository;
import com.evshare.notification.service.NotificationService;
import com.evshare.security.UserPrincipal;
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
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Authoritative service for detecting booking-return conflicts, collecting
 * immutable evidence,
 * and preparing pre-filled dispute submissions.
 *
 * Adheres strictly to Phase 5.6 requirements:
 * - Server-side time evaluation with configurable grace period
 * - Non-accusatory evidence timeline separating driver actions from staff
 * verification
 * - Deduplicated notification dispatch
 * - Idempotent detection
 * - Strict object-level authorization & privacy preservation
 */
@Service
public class BookingIncidentDetectionService {

    private static final Logger log = LoggerFactory.getLogger(BookingIncidentDetectionService.class);

    private static final DateTimeFormatter TIME_FORMATTER_VI = DateTimeFormatter.ofPattern("HH:mm")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
    private static final DateTimeFormatter DATE_FORMATTER_VI = DateTimeFormatter.ofPattern("dd/MM/yyyy")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
    private static final DateTimeFormatter FULL_TIME_FORMATTER_VI = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final BookingRepository bookingRepository;
    private final TripRepository tripRepository;
    private final VehicleHandoverRepository handoverRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final DisputeRepository disputeRepository;
    private final NotificationRepository notificationRepository;

    @Autowired(required = false)
    private NotificationService notificationService;

    @Value("${dispute.booking-return.alert-grace-minutes:10}")
    private int alertGraceMinutes = 10;

    // Cache of active incidents keyed by impacted booking ID
    private final Map<UUID, BookingConflictIncidentDto> activeIncidentsCache = new ConcurrentHashMap<>();

    public BookingIncidentDetectionService(
            BookingRepository bookingRepository,
            TripRepository tripRepository,
            VehicleHandoverRepository handoverRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            DisputeRepository disputeRepository,
            NotificationRepository notificationRepository) {
        this.bookingRepository = bookingRepository;
        this.tripRepository = tripRepository;
        this.handoverRepository = handoverRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.disputeRepository = disputeRepository;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Periodic scheduled process running every 60 seconds with bounded, indexed
     * queries.
     * Prevents full-table scans by targeting only recently active bookings and
     * active vehicles.
     */
    @Scheduled(fixedDelayString = "${dispute.booking-return.check-interval-ms:60000}")
    @Transactional
    public void runPeriodicDetection() {
        try {
            Instant now = Instant.now();
            List<Vehicle> vehicles = vehicleRepository.findAll();
            for (Vehicle vehicle : vehicles) {
                if (vehicle == null || vehicle.getId() == null)
                    continue;
                evaluateIncidentsForVehicle(vehicle.getId(), now, true);
            }
        } catch (Exception ex) {
            log.error("Error executing periodic booking incident detection: {}", ex.getMessage(), ex);
        }
    }

    /**
     * Evaluate incidents for a specific vehicle with server-side time.
     * Idempotently detects potential conflicts and dispatches deduplicated alerts.
     */
    @Transactional
    public List<BookingConflictIncidentDto> evaluateIncidentsForVehicle(UUID vehicleId, Instant now,
            boolean dispatchAlerts) {
        List<BookingConflictIncidentDto> detected = new ArrayList<>();
        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);
        if (vehicle == null)
            return detected;

        // Bounded time window: check bookings ended within past 6 hours to lookahead 4
        // hours
        Instant windowStart = now.minus(Duration.ofHours(6));
        Instant windowEnd = now.plus(Duration.ofHours(6));

        List<Booking> bookings = bookingRepository.findByVehicleIdAndStatusInOrderByStartTimeAsc(
                vehicleId,
                List.of(BookingStatus.CONFIRMED, BookingStatus.COMPLETED)).stream()
                .filter(b -> b.getEndTime().isAfter(windowStart) && b.getStartTime().isBefore(windowEnd))
                .collect(Collectors.toList());

        if (bookings.size() < 2) {
            // Check active trip without subsequent booking or single booking
            return detected;
        }

        for (int i = 0; i < bookings.size() - 1; i++) {
            Booking prevBooking = bookings.get(i);
            Booking nextBooking = bookings.get(i + 1);

            // Cross-vehicle integrity: Both bookings must belong to the same vehicle
            if (!prevBooking.getVehicle().getId().equals(vehicleId) ||
                    !nextBooking.getVehicle().getId().equals(vehicleId)) {
                continue;
            }

            // Next booking must be CONFIRMED (not CANCELLED or EXPIRED)
            if (nextBooking.getStatus() != BookingStatus.CONFIRMED) {
                continue;
            }

            // Timing check: Next booking start time must be within 3 hours turnaround
            // buffer (adjacency)
            Duration gap = Duration.between(prevBooking.getEndTime(), nextBooking.getStartTime());
            long gapMinutes = gap.toMinutes();
            if (gapMinutes >= -180 && gapMinutes <= 180) {
                BookingConflictIncidentDto incident = evaluateBookingPair(vehicle, prevBooking, nextBooking, now,
                        dispatchAlerts);
                if (incident != null) {
                    detected.add(incident);
                    if (incident.state() != BookingIncidentState.CLEARED) {
                        activeIncidentsCache.put(nextBooking.getId(), incident);
                    } else {
                        activeIncidentsCache.remove(nextBooking.getId());
                    }
                }
            }
        }

        return detected;
    }

    /**
     * Inspect a specific booking pair and determine incident state, timeline
     * events, and prefilled dispute data.
     */
    private BookingConflictIncidentDto evaluateBookingPair(
            Vehicle vehicle,
            Booking prevBooking,
            Booking nextBooking,
            Instant now,
            boolean dispatchAlerts) {
        // Threshold check: Has current time passed prevBooking.endTime +
        // alertGraceMinutes?
        Instant thresholdTime = prevBooking.getEndTime().plus(Duration.ofMinutes(alertGraceMinutes));
        if (now.isBefore(thresholdTime)) {
            // Within permitted grace window, no incident
            return null;
        }

        // Retrieve operational trip & handover records for prevBooking
        Optional<Trip> prevTripOpt = tripRepository.findByBookingId(prevBooking.getId());
        Optional<VehicleHandover> handoverOpt = handoverRepository.findByBookingId(prevBooking.getId());

        Trip prevTrip = prevTripOpt.orElse(null);
        Instant returnRequestedAt = prevTrip != null ? prevTrip.getReturnRequestedAt() : null;
        Instant returnVerifiedAt = prevTrip != null ? prevTrip.getReturnVerifiedAt() : null;
        TripStatus tripStatus = prevTrip != null ? prevTrip.getStatus() : null;

        // If no trip was EVER created or started for prevBooking:
        // That previous booking was unconsummated/abandoned and never occupied the vehicle.
        if (prevTrip == null) {
            return null;
        }

        // If prevTrip is already COMPLETED:
        if (tripStatus == TripStatus.COMPLETED) {
            // Vehicle was verified returned or completed prior to next booking start
            if (returnVerifiedAt != null && returnVerifiedAt.isBefore(nextBooking.getStartTime())) {
                return null;
            }
            if (prevTrip.getEndedAt() != null && prevTrip.getEndedAt().isBefore(nextBooking.getStartTime())) {
                return null;
            }
            // If vehicle is available and has no active trip running, it's cleared
            boolean hasActiveTrip = tripRepository.existsByVehicleIdAndStatus(vehicle.getId(), TripStatus.ACTIVE);
            if (!hasActiveTrip && vehicle.getStatus() == VehicleStatus.AVAILABLE) {
                return null;
            }
        }

        // If vehicle is currently AVAILABLE and no active trip exists on the vehicle:
        boolean hasActiveTrip = tripRepository.existsByVehicleIdAndStatus(vehicle.getId(), TripStatus.ACTIVE);
        if (!hasActiveTrip && vehicle.getStatus() == VehicleStatus.AVAILABLE && tripStatus != TripStatus.ACTIVE) {
            return null;
        }

        // Has return already been verified before next booking start time?
        if (returnVerifiedAt != null) {
            // Vehicle was verified returned
            if (returnVerifiedAt.isBefore(nextBooking.getStartTime())) {
                // Fully cleared on time
                return null;
            }
        }

        // Check if vehicle has already been handed over to nextBooking
        Optional<VehicleHandover> nextHandoverOpt = handoverRepository.findByBookingId(nextBooking.getId());
        if (nextHandoverOpt.isPresent() && nextHandoverOpt.get().getOwnerReceivedAt() != null) {
            // Next co-owner already received vehicle, cleared
            return null;
        }

        // Determine incident state
        BookingIncidentState state;
        long delayMinutes = Duration.between(prevBooking.getEndTime(), now).toMinutes();

        if (returnVerifiedAt != null && returnVerifiedAt.isAfter(nextBooking.getStartTime())) {
            state = BookingIncidentState.CONFIRMED_IMPACT;
        } else if (returnRequestedAt != null && returnVerifiedAt == null) {
            // Driver requested return on time or late, awaiting staff receipt
            if (now.isAfter(nextBooking.getStartTime())) {
                state = BookingIncidentState.CONFIRMED_IMPACT;
            } else {
                state = BookingIncidentState.AWAITING_CONFIRMATION;
            }
        } else if (tripStatus == TripStatus.ACTIVE || tripStatus == null) {
            // Trip still active or unreturned
            if (now.isAfter(nextBooking.getStartTime())) {
                state = BookingIncidentState.CONFIRMED_IMPACT;
            } else {
                state = BookingIncidentState.POTENTIAL_CONFLICT;
            }
        } else {
            // Trip completed, but returnVerifiedAt wasn't recorded
            if (now.isAfter(nextBooking.getStartTime())) {
                state = BookingIncidentState.CONFIRMED_IMPACT;
            } else {
                state = BookingIncidentState.AWAITING_CONFIRMATION;
            }
        }

        // Build Chronological Evidence Timeline
        List<IncidentTimelineEvent> timeline = new ArrayList<>();
        timeline.add(IncidentTimelineEvent.system(
                prevBooking.getStartTime(),
                "PREVIOUS_BOOKING_START",
                "Lịch đặt xe trước bắt đầu theo kế hoạch",
                "BOOKING"));
        timeline.add(IncidentTimelineEvent.system(
                prevBooking.getEndTime(),
                "PREVIOUS_BOOKING_SCHEDULED_END",
                "Thời điểm kết thúc lịch đặt xe trước",
                "BOOKING"));
        timeline.add(IncidentTimelineEvent.system(
                thresholdTime,
                "ALERT_THRESHOLD_EXCEEDED",
                String.format("Vượt ngưỡng thời gian cho phép (%d phút sau giờ kết thúc lịch)", alertGraceMinutes),
                "SYSTEM_POLICY"));

        if (returnRequestedAt != null) {
            timeline.add(IncidentTimelineEvent.system(
                    returnRequestedAt,
                    "DRIVER_RETURN_REQUESTED",
                    "Thành viên lái xe gửi yêu cầu trả xe và chờ nhân viên tiếp nhận",
                    "TRIP"));
        } else if (tripStatus == TripStatus.ACTIVE) {
            timeline.add(IncidentTimelineEvent.system(
                    now,
                    "NO_RETURN_REQUEST_YET",
                    "Chưa ghi nhận yêu cầu trả xe từ tài xế tại thời điểm kiểm tra",
                    "TRIP"));
        }

        timeline.add(IncidentTimelineEvent.system(
                nextBooking.getStartTime(),
                "IMPACTED_BOOKING_SCHEDULED_START",
                "Thời điểm bắt đầu lịch đặt xe tiếp theo của bạn",
                "BOOKING"));

        if (returnVerifiedAt != null) {
            timeline.add(IncidentTimelineEvent.system(
                    returnVerifiedAt,
                    "STAFF_RETURN_VERIFIED",
                    "Nhân viên hoàn tất kiểm tra và xác nhận nhận xe",
                    "STAFF"));
        }

        // Sort chronological
        timeline.sort(Comparator.comparing(IncidentTimelineEvent::timestamp));

        // Format timeline text for dispute
        StringBuilder timelineTextBuilder = new StringBuilder();
        timelineTextBuilder.append("--- DỮ LIỆU ĐỐI CHIẾU HỆ THỐNG (TỰ ĐỘNG GHI NHẬN) ---\n");
        for (IncidentTimelineEvent ev : timeline) {
            timelineTextBuilder.append(String.format("- [%s] %s (%s)\n",
                    FULL_TIME_FORMATTER_VI.format(ev.timestamp()),
                    ev.description(),
                    ev.source()));
        }
        String objectiveTimelineText = timelineTextBuilder.toString();

        // Check if formal dispute already exists for nextBooking
        Optional<Dispute> existingDisputeOpt = disputeRepository.findByVehicleIdOrderByCreatedAtDesc(vehicle.getId())
                .stream()
                .filter(d -> nextBooking.getId().equals(d.getBookingId()))
                .findFirst();

        boolean hasFormalDispute = existingDisputeOpt.isPresent();
        UUID formalDisputeId = hasFormalDispute ? existingDisputeOpt.get().getId() : null;
        String formalDisputeReference = hasFormalDispute ? existingDisputeOpt.get().getReferenceCode() : null;

        // Build Pre-filled Dispute DTO
        String vehicleName = vehicle.getName() != null ? vehicle.getName() : "EV01";
        String vehiclePlate = vehicle.getLicensePlate() != null ? vehicle.getLicensePlate() : vehicleName;
        String suggestedTitle = String.format("Sự cố chậm trễ nhận xe %s - Ngày %s",
                vehiclePlate, DATE_FORMATTER_VI.format(nextBooking.getStartTime()));

        String systemEvidenceSummary = String.format(
                "Hệ thống phát hiện chậm trễ bàn giao phương tiện %s. Lịch trước kết thúc lúc %s, ngưỡng cảnh báo %d phút. "
                        +
                        "Tình trạng tài xế trả xe: %s. Tình trạng nhân viên nghiệm thu: %s. " +
                        "Lịch sử dụng tiếp theo (#%s) bắt đầu lúc %s bị ảnh hưởng.",
                vehiclePlate,
                TIME_FORMATTER_VI.format(prevBooking.getEndTime()),
                alertGraceMinutes,
                returnRequestedAt != null ? ("Đã yêu cầu lúc " + TIME_FORMATTER_VI.format(returnRequestedAt))
                        : "Chưa gửi yêu cầu",
                returnVerifiedAt != null ? ("Đã xác nhận lúc " + TIME_FORMATTER_VI.format(returnVerifiedAt))
                        : "Chưa xác nhận",
                nextBooking.getId().toString().substring(0, 8),
                TIME_FORMATTER_VI.format(nextBooking.getStartTime()));

        String suggestedDescription = String.format(
                "%s\n\n--- Ý KIẾN & MÔ TẢ CỦA THÀNH VIÊN BỊ ẢNH HƯỞNG ---\n" +
                        "Tôi bị ảnh hưởng do chưa thể nhận xe theo đúng lịch đã đặt (%s–%s). " +
                        "Kính đề nghị Ban quản lý và nhân viên hỗ trợ xác minh, giải quyết để đảm bảo quyền lợi sử dụng phương tiện.",
                objectiveTimelineText,
                TIME_FORMATTER_VI.format(nextBooking.getStartTime()),
                TIME_FORMATTER_VI.format(nextBooking.getEndTime()));

        List<UUID> respondentUserIds = new ArrayList<>();
        if (prevBooking.getUser() != null && !prevBooking.getUser().getId().equals(nextBooking.getUser().getId())) {
            respondentUserIds.add(prevBooking.getUser().getId());
        }

        String incidentRef = "INC-BKG-" + nextBooking.getId().toString().substring(0, 8).toUpperCase();

        PrefilledDisputeDto prefilled = new PrefilledDisputeDto(
                vehicle.getId(),
                vehicleName,
                vehiclePlate,
                DisputeCategory.BOOKING,
                DisputePriority.HIGH,
                suggestedTitle,
                suggestedDescription,
                systemEvidenceSummary,
                nextBooking.getId(),
                prevTrip != null ? prevTrip.getId() : null,
                handoverOpt.map(VehicleHandover::getId).orElse(null),
                respondentUserIds,
                incidentRef,
                now,
                objectiveTimelineText);

        String incidentId = "INC_" + nextBooking.getId();

        BookingConflictIncidentDto incident = new BookingConflictIncidentDto(
                incidentId,
                state,
                vehicle.getId(),
                vehicleName,
                vehiclePlate,
                prevBooking.getId(),
                prevBooking.getUser() != null ? prevBooking.getUser().getId() : null,
                prevBooking.getUser() != null ? prevBooking.getUser().getFullName() : "Thành viên sử dụng trước",
                prevBooking.getStartTime(),
                prevBooking.getEndTime(),
                nextBooking.getId(),
                nextBooking.getUser() != null ? nextBooking.getUser().getId() : null,
                nextBooking.getUser() != null ? nextBooking.getUser().getFullName() : "Thành viên bị ảnh hưởng",
                nextBooking.getStartTime(),
                nextBooking.getEndTime(),
                prevTrip != null ? prevTrip.getId() : null,
                tripStatus != null ? tripStatus.name() : "NO_TRIP",
                returnRequestedAt,
                returnVerifiedAt,
                handoverOpt.map(VehicleHandover::getStaffHandedOverAt).orElse(null),
                delayMinutes,
                now,
                timeline,
                prefilled,
                hasFormalDispute,
                formalDisputeId,
                formalDisputeReference);

        // Deduplicated Notification Dispatching
        if (dispatchAlerts && nextBooking.getUser() != null) {
            dispatchDeduplicatedIncidentNotification(incident, nextBooking.getUser(), vehicle);
        }

        return incident;
    }

    /**
     * Dispatch notification with strict deduplication per (user, booking,
     * eventType).
     */
    private void dispatchDeduplicatedIncidentNotification(
            BookingConflictIncidentDto incident,
            User impactedUser,
            Vehicle vehicle) {
        if (notificationRepository == null)
            return;

        // 1. Check if user already received BOOKING_CONFLICT_ALERT for this booking
        String eventType = "BOOKING_CONFLICT_ALERT";
        Optional<Notification> existingNotif = notificationRepository.findFirstByRecipientIdAndEventTypeAndEntityId(
                impactedUser.getId(),
                eventType,
                incident.impactedBookingId());

        if (existingNotif.isEmpty()) {
            String title = "NGUY CƠ CHẬM TRỄ NHẬN XE";
            String message = "Lượt đặt xe của bạn có thể bị ảnh hưởng. Hệ thống đã ghi nhận dữ liệu để đối chiếu.";

            Notification notification = new Notification(
                    UUID.randomUUID(),
                    impactedUser,
                    vehicle.getId(),
                    null,
                    "BOOKING",
                    incident.impactedBookingId(),
                    eventType,
                    title,
                    message,
                    "WARNING");
            notificationRepository.save(notification);
            log.info("Dispatched deduplicated booking conflict alert to member {} for booking {}",
                    impactedUser.getId(), incident.impactedBookingId());
        }

        // 2. Dispatch to STAFF users if not already notified
        List<User> staffUsers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.STAFF || u.getRole() == Role.ADMIN)
                .collect(Collectors.toList());

        String staffEventType = "STAFF_BOOKING_CONFLICT_ALERT";
        for (User staff : staffUsers) {
            Optional<Notification> existingStaffNotif = notificationRepository
                    .findFirstByRecipientIdAndEventTypeAndEntityId(
                            staff.getId(),
                            staffEventType,
                            incident.impactedBookingId());

            if (existingStaffNotif.isEmpty()) {
                String staffTitle = "CẢNH BÁO XUNG ĐỘT LỊCH ĐẶT XE";
                String staffMsg = String.format(
                        "Xe %s có nguy cơ bàn giao trễ cho lịch tiếp theo (#%s). Vui lòng hỗ trợ tiếp nhận & kiểm tra.",
                        incident.vehiclePlate(),
                        incident.impactedBookingId().toString().substring(0, 8));

                Notification staffNotif = new Notification(
                        UUID.randomUUID(),
                        staff,
                        vehicle.getId(),
                        null,
                        "BOOKING",
                        incident.impactedBookingId(),
                        staffEventType,
                        staffTitle,
                        staffMsg,
                        "ACTION_REQUIRED");
                notificationRepository.save(staffNotif);
            }
        }

        // 3. Dispatch to previous driver (responsible user) if not already notified
        if (incident.previousBookingUserId() != null) {
            String driverEventType = "DRIVER_OVERDUE_ALERT";
            Optional<Notification> existingDriverNotif = notificationRepository
                    .findFirstByRecipientIdAndEventTypeAndEntityId(
                            incident.previousBookingUserId(),
                            driverEventType,
                            incident.previousBookingId());

            if (existingDriverNotif.isEmpty()) {
                userRepository.findById(incident.previousBookingUserId()).ifPresent(driverUser -> {
                    String driverTitle = "CẢNH BÁO QUÁ HẠN TRẢ XE";
                    String driverMsg = String.format(
                            "Chuyến đi với xe %s của bạn đã quá hạn trả. Vui lòng di chuyển xe về bãi và thực hiện thủ tục trả xe sớm nhất để tránh làm gián đoạn lịch của thành viên tiếp theo.",
                            incident.vehiclePlate());

                    Notification driverNotif = new Notification(
                            UUID.randomUUID(),
                            driverUser,
                            vehicle.getId(),
                            null,
                            "BOOKING",
                            incident.previousBookingId(),
                            driverEventType,
                            driverTitle,
                            driverMsg,
                            "WARNING");
                    notificationRepository.save(driverNotif);
                });
            }
        }
    }

    /**
     * Retrieve active or past incident for a specific booking with access
     * authorization.
     */
    @Transactional(readOnly = true)
    public Optional<BookingConflictIncidentDto> getIncidentForBooking(UUID bookingId, UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để kiểm tra sự cố");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch đặt xe: " + bookingId));

        User currentUser = principal.getUser();
        boolean isStaffOrAdmin = currentUser.getRole() == Role.STAFF || currentUser.getRole() == Role.ADMIN;
        boolean isBookingOwner = booking.getUser() != null && booking.getUser().getId().equals(currentUser.getId());

        if (!isStaffOrAdmin && !isBookingOwner) {
            throw new AccessDeniedException("Bạn không có quyền truy cập thông tin sự cố của lịch đặt này.");
        }

        // Evaluate on-demand
        List<BookingConflictIncidentDto> incidents = evaluateIncidentsForVehicle(booking.getVehicle().getId(),
                Instant.now(), false);
        Optional<BookingConflictIncidentDto> match = incidents.stream()
                .filter(inc -> bookingId.equals(inc.impactedBookingId()))
                .findFirst();

        if (match.isEmpty()) {
            // Check cache
            BookingConflictIncidentDto cached = activeIncidentsCache.get(bookingId);
            if (cached != null) {
                // Revalidate cached incident against current operational reality
                boolean hasActiveTrip = tripRepository.existsByVehicleIdAndStatus(booking.getVehicle().getId(), TripStatus.ACTIVE);
                Vehicle v = vehicleRepository.findById(booking.getVehicle().getId()).orElse(null);
                if (!hasActiveTrip && v != null && v.getStatus() == VehicleStatus.AVAILABLE) {
                    activeIncidentsCache.remove(bookingId);
                    match = Optional.empty();
                } else {
                    match = Optional.of(cached);
                }
            }
        }

        // Privacy redaction for CO_OWNER: sanitize personal sensitive fields if caller
        // is co-owner
        return match.map(inc -> sanitizeIncidentForCaller(inc, currentUser));
    }

    /**
     * Retrieve prefilled dispute data for an impacted booking.
     */
    @Transactional(readOnly = true)
    public PrefilledDisputeDto getPrefilledDisputeForBooking(UUID bookingId, UserPrincipal principal) {
        BookingConflictIncidentDto incident = getIncidentForBooking(bookingId, principal)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy sự cố phát hiện tự động cho lịch đặt này."));
        return incident.prefilledDispute();
    }

    /**
     * Retrieve all active detected incidents for STAFF dashboard mediation.
     */
    @Transactional(readOnly = true)
    public List<BookingConflictIncidentDto> getActiveIncidentsForStaff(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        User user = principal.getUser();
        if (user.getRole() != Role.STAFF && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException(
                    "Chỉ nhân viên hoặc quản trị viên mới có quyền xem danh sách sự cố vận hành.");
        }

        List<BookingConflictIncidentDto> allActive = new ArrayList<>();
        List<Vehicle> vehicles = vehicleRepository.findAll();
        Instant now = Instant.now();

        for (Vehicle v : vehicles) {
            if (v != null && v.getId() != null) {
                List<BookingConflictIncidentDto> vehicleIncidents = evaluateIncidentsForVehicle(v.getId(), now, false);
                for (BookingConflictIncidentDto inc : vehicleIncidents) {
                    if (inc.state() != BookingIncidentState.CLEARED) {
                        allActive.add(inc);
                    }
                }
            }
        }

        allActive.sort(Comparator.comparing(BookingConflictIncidentDto::impactedBookingStartTime));
        return allActive;
    }

    /**
     * Privacy safeguard: Prevent exposing unrelated personal details of previous
     * driver to other co-owners.
     */
    private BookingConflictIncidentDto sanitizeIncidentForCaller(BookingConflictIncidentDto incident, User caller) {
        if (caller.getRole() == Role.STAFF || caller.getRole() == Role.ADMIN) {
            return incident; // Full operational visibility
        }

        // If caller is the previous driver, they already know their own identity
        if (incident.previousBookingUserId() != null && incident.previousBookingUserId().equals(caller.getId())) {
            return incident;
        }

        // For Member B (impacted co-owner): redact previous user's name to objective
        // title
        String sanitizedPreviousUser = "Thành viên sử dụng trước";
        return new BookingConflictIncidentDto(
                incident.incidentId(),
                incident.state(),
                incident.vehicleId(),
                incident.vehicleName(),
                incident.vehiclePlate(),
                incident.previousBookingId(),
                incident.previousBookingUserId(),
                sanitizedPreviousUser,
                incident.previousBookingStartTime(),
                incident.previousBookingEndTime(),
                incident.impactedBookingId(),
                incident.impactedBookingUserId(),
                incident.impactedBookingUserDisplay(),
                incident.impactedBookingStartTime(),
                incident.impactedBookingEndTime(),
                incident.previousTripId(),
                incident.previousTripStatus(),
                incident.returnRequestedAt(),
                incident.returnVerifiedAt(),
                incident.handoverStaffHandedOverAt(),
                incident.delayMinutes(),
                incident.detectedAt(),
                incident.timelineEvents(),
                incident.prefilledDispute(),
                incident.hasFormalDispute(),
                incident.formalDisputeId(),
                incident.formalDisputeReference());
    }
}
