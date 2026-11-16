package com.evshare.handover.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.damage.entity.DamageRecord;
import com.evshare.damage.entity.DamageSeverity;
import com.evshare.damage.entity.DamageStatus;
import com.evshare.damage.repository.DamageRecordRepository;
import com.evshare.handover.dto.VehicleHandoverResponse;
import com.evshare.handover.dto.VehicleInspectionRequest;
import com.evshare.handover.dto.VehicleInspectionResponse;
import com.evshare.handover.entity.HandoverStatus;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.inspection.entity.InspectionOverallResult;
import com.evshare.inspection.entity.InspectionStatus;
import com.evshare.inspection.entity.InspectionType;
import com.evshare.inspection.entity.VehicleInspection;
import com.evshare.inspection.entity.VehicleInspectionItem;
import com.evshare.inspection.repository.VehicleInspectionRepository;
import com.evshare.inspection.service.VehicleInspectionService;
import com.evshare.handover.dto.HandoverEligibilityReason;
import com.evshare.handover.dto.VehicleHandoverEligibilityResponse;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VehicleHandoverService {

    public static final long PREPARATION_WINDOW_MINUTES = 120; // 2 hours prior to booking start time

    public static final Set<String> REQUIRED_CHECKPOINTS = Set.of(
            "BODY",
            "WHEEL_FL",
            "WHEEL_FR",
            "WHEEL_RL",
            "WHEEL_RR",
            "WINDSHIELD",
            "BATTERY",
            "CHARGING_PORT");

    private final VehicleHandoverRepository handoverRepository;
    private final VehicleInspectionRepository inspectionRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final com.evshare.ownership.service.CoOwnershipService coOwnershipService;
    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private DamageRecordRepository damageRecordRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.notification.service.NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private VehicleInspectionService vehicleInspectionService;

    public VehicleHandoverService(
            VehicleHandoverRepository handoverRepository,
            VehicleInspectionRepository inspectionRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository) {
        this(handoverRepository, inspectionRepository, bookingRepository, userRepository, null, null, null);
    }

    public VehicleHandoverService(
            VehicleHandoverRepository handoverRepository,
            VehicleInspectionRepository inspectionRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository,
            com.evshare.ownership.service.CoOwnershipService coOwnershipService) {
        this(handoverRepository, inspectionRepository, bookingRepository, userRepository, coOwnershipService, null,
                null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public VehicleHandoverService(
            VehicleHandoverRepository handoverRepository,
            VehicleInspectionRepository inspectionRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository,
            com.evshare.ownership.service.CoOwnershipService coOwnershipService,
            VehicleRepository vehicleRepository,
            TripRepository tripRepository) {
        this.handoverRepository = handoverRepository;
        this.inspectionRepository = inspectionRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.coOwnershipService = coOwnershipService;
        this.vehicleRepository = vehicleRepository;
        this.tripRepository = tripRepository;
    }

    @org.springframework.beans.factory.annotation.Value("${app.handover.inspection-max-age-hours:24}")
    private long maxAgeHours = 24;

    public void setMaxAgeHours(long maxAgeHours) {
        this.maxAgeHours = maxAgeHours;
    }

    @Transactional(readOnly = true)
    public VehicleHandoverResponse getHandoverByBookingId(UUID bookingId, UUID currentUserId, Role currentUserRole) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch đặt với mã: " + bookingId));

        if (currentUserRole == Role.CO_OWNER && !booking.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập dữ liệu bàn giao của lịch đặt này");
        }

        Optional<VehicleHandover> handoverOpt = handoverRepository.findByBookingId(bookingId);
        if (handoverOpt.isEmpty()) {
            VehicleHandoverResponse pendingResp = new VehicleHandoverResponse();
            pendingResp.setBookingId(booking.getId());
            pendingResp.setBookingStartTime(booking.getStartTime());
            pendingResp.setBookingEndTime(booking.getEndTime());
            pendingResp.setBookingPurpose(booking.getPurpose());
            pendingResp.setBookingStatus(booking.getStatus() != null ? booking.getStatus().name() : "CONFIRMED");
            if (booking.getVehicle() != null) {
                pendingResp.setVehicleId(booking.getVehicle().getId());
                pendingResp.setVehicleName(booking.getVehicle().getName());
                pendingResp.setVehicleCode(booking.getVehicle().getName() != null ? booking.getVehicle().getName()
                        : booking.getVehicle().getLicensePlate());
                pendingResp.setLicensePlate(booking.getVehicle().getLicensePlate());
            }
            if (booking.getUser() != null) {
                pendingResp.setCoOwnerId(booking.getUser().getId());
                pendingResp.setCoOwnerName(booking.getUser().getFullName());
                pendingResp.setCoOwnerEmail(booking.getUser().getEmail());
            }
            pendingResp.setStatus(HandoverStatus.PENDING_PREPARATION);
            pendingResp.setInspectionStatus("PENDING");
            pendingResp.setStaffHandedOverAt(null);
            pendingResp.setConfirmedByStaffId(null);
            pendingResp.setConfirmedAt(null);
            pendingResp.setEligibilityMessage("Chưa có hồ sơ bàn giao cho lịch đặt xe này");
            return pendingResp;
        }

        VehicleHandover handover = handoverOpt.get();
        VehicleHandoverResponse resp = VehicleHandoverResponse.fromEntity(handover);
        if (handover.getStaff() != null && handover.getStaffHandedOverAt() != null) {
            resp.setConfirmedByStaffId(handover.getStaff().getId());
            resp.setConfirmedAt(handover.getStaffHandedOverAt());
        }
        if (tripRepository != null) {
            tripRepository.findByBookingId(bookingId).ifPresent(t -> {
                resp.setTripId(t.getId());
                resp.setTripStatus(t.getStatus() != null ? t.getStatus().name() : null);
            });
        }

        // Temporal reconciliation: check if the handover record is premature or for a
        // future booking before preparation window
        Instant now = Instant.now();
        Instant prepWindowStart = booking.getStartTime().minus(Duration.ofMinutes(PREPARATION_WINDOW_MINUTES));
        boolean isPrematureHandover = handover.getStaffHandedOverAt() != null &&
                handover.getStaffHandedOverAt().isBefore(prepWindowStart.minusSeconds(60));
        boolean isBeforePrepWindow = now.isBefore(prepWindowStart.minusSeconds(30));

        if (isPrematureHandover || isBeforePrepWindow) {
            if (isPrematureHandover) {
                resp.setEligibilityReason(HandoverEligibilityReason.TOO_EARLY);
                resp.setEligibilityMessage(
                        "Phát hiện thời gian bàn giao không hợp lệ với khung giờ đặt xe. Cần đối soát.");
                resp.setStatus(HandoverStatus.PENDING_PREPARATION);
                resp.setStaffHandedOverAt(null);
                resp.setConfirmedAt(null);
            } else if (resp.getStatus() == HandoverStatus.HANDED_OVER
                    || resp.getStatus() == HandoverStatus.OWNER_CONFIRMED
                    || resp.getStatus() == HandoverStatus.COMPLETED) {
                resp.setEligibilityReason(HandoverEligibilityReason.TOO_EARLY);
                resp.setEligibilityMessage("Chưa đến thời gian chuẩn bị xe (bắt đầu trước 2 giờ).");
                resp.setStatus(HandoverStatus.PENDING_PREPARATION);
                resp.setStaffHandedOverAt(null);
                resp.setConfirmedAt(null);
            }
        }
        return resp;
    }

    public UUID resolvePersistentVehicleId(String identifier) {
        if (identifier == null || identifier.isBlank())
            return null;
        try {
            return UUID.fromString(identifier.trim());
        } catch (IllegalArgumentException e) {
            String trimmed = identifier.trim();
            if (vehicleRepository != null) {
                Optional<Vehicle> v = vehicleRepository.findByLicensePlateIgnoreCase(trimmed);
                if (v.isPresent())
                    return v.get().getId();
                List<Vehicle> all = vehicleRepository.findAll();
                for (Vehicle veh : all) {
                    if (trimmed.equalsIgnoreCase(veh.getName()) ||
                            trimmed.equalsIgnoreCase(veh.getLicensePlate()) ||
                            trimmed.equalsIgnoreCase(veh.getModel()) ||
                            (veh.getVin() != null && trimmed.equalsIgnoreCase(veh.getVin()))) {
                        return veh.getId();
                    }
                }
                // Handle canonical vehicle codes e.g. EV01, EV02
                if ("EV01".equalsIgnoreCase(trimmed) || "EV-01".equalsIgnoreCase(trimmed)
                        || "EV 01".equalsIgnoreCase(trimmed)) {
                    for (Vehicle veh : all) {
                        if (veh.getId().toString().equals("11111111-1111-1111-1111-111111111111") ||
                                (veh.getVin() != null && veh.getVin().contains("DEMO000001"))) {
                            return veh.getId();
                        }
                    }
                    if (!all.isEmpty())
                        return all.get(0).getId();
                }
                if ("EV02".equalsIgnoreCase(trimmed) || "EV-02".equalsIgnoreCase(trimmed)
                        || "EV 02".equalsIgnoreCase(trimmed)) {
                    for (Vehicle veh : all) {
                        if (veh.getId().toString().equals("11111111-1111-1111-1111-111111111102") ||
                                (veh.getVin() != null
                                        && (veh.getVin().contains("000002") || veh.getVin().contains("EV02")))) {
                            return veh.getId();
                        }
                    }
                    if (all.size() > 1)
                        return all.get(1).getId();
                }
            }
            return null;
        }
    }

    public boolean isBookingExpired(Booking booking, Instant now) {
        if (booking == null)
            return false;
        if (booking.getStatus() == BookingStatus.EXPIRED)
            return true;
        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED)
            return false;

        if (booking.getEndTime() != null && now.isAfter(booking.getEndTime())) {
            // Protect active/overdue trips
            if (tripRepository != null
                    && tripRepository.existsByBooking_IdAndStatus(booking.getId(), TripStatus.ACTIVE)) {
                return false;
            }
            // Protect handovers already completed awaiting trip start or return
            if (handoverRepository != null) {
                Optional<VehicleHandover> hOpt = handoverRepository.findByBookingId(booking.getId());
                if (hOpt.isPresent()) {
                    HandoverStatus st = hOpt.get().getStatus();
                    if (st == HandoverStatus.HANDED_OVER || st == HandoverStatus.OWNER_CONFIRMED
                            || st == HandoverStatus.COMPLETED) {
                        return false;
                    }
                }
            }
            return true;
        }

        return false;
    }

    @Transactional
    public List<VehicleHandoverResponse> getActiveHandoversForVehicle(UUID vehicleId, UUID currentUserId,
            Role currentUserRole) {
        Instant now = Instant.now();
        Instant activeCutoff = now.minus(Duration.ofHours(2));

        if (currentUserRole == Role.CO_OWNER) {
            List<VehicleHandover> handovers = new ArrayList<>(
                    handoverRepository.findActiveByCoOwnerAndVehicle(currentUserId, vehicleId, activeCutoff));
            if (handovers.isEmpty()) {
                // Include confirmed/completed handover for current non-expired booking so owner
                // doesn't lose receipt status
                // but exclude if booking or trip is already completed (historical)
                List<Booking> userBookings = bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicleId).stream()
                        .filter(b -> b.getUser() != null && currentUserId.equals(b.getUser().getId())
                                && !isBookingExpired(b, now))
                        .filter(b -> b.getStatus() != BookingStatus.COMPLETED
                                && b.getStatus() != BookingStatus.CANCELLED && b.getStatus() != BookingStatus.EXPIRED)
                        .filter(b -> tripRepository == null
                                || !tripRepository.existsByBooking_IdAndStatus(b.getId(), TripStatus.COMPLETED))
                        .collect(Collectors.toList());
                for (Booking b : userBookings) {
                    handoverRepository.findByBookingId(b.getId()).ifPresent(h -> {
                        if (h.getStatus() == HandoverStatus.COMPLETED
                                || h.getStatus() == HandoverStatus.OWNER_CONFIRMED) {
                            handovers.add(h);
                        }
                    });
                }
            }
            List<VehicleHandover> activeOnly = handovers.stream()
                    .filter(h -> h.getBooking() != null
                            && !isBookingExpired(h.getBooking(), now)
                            && h.getBooking().getStatus() != BookingStatus.COMPLETED
                            && h.getBooking().getStatus() != BookingStatus.CANCELLED
                            && h.getBooking().getStatus() != BookingStatus.EXPIRED
                            && (currentUserId == null
                                    || (h.getCoOwner() != null && currentUserId.equals(h.getCoOwner().getId())))
                            && (tripRepository == null || !tripRepository
                                    .existsByBooking_IdAndStatus(h.getBooking().getId(), TripStatus.COMPLETED))
                            && !now.isBefore(h.getBooking().getStartTime()
                                    .minus(Duration.ofMinutes(PREPARATION_WINDOW_MINUTES)).minusSeconds(30))
                            && (h.getStaffHandedOverAt() == null || !h.getStaffHandedOverAt()
                                    .isBefore(h.getBooking().getStartTime()
                                            .minus(Duration.ofMinutes(PREPARATION_WINDOW_MINUTES)).minusSeconds(60))))
                    .collect(Collectors.toList());
            return activeOnly.stream().map(VehicleHandoverResponse::fromEntity).collect(Collectors.toList());
        }

        // ==========================================
        // FOR STAFF / ADMIN:
        // ==========================================
        Map<UUID, VehicleHandoverResponse> responseMap = new LinkedHashMap<>();

        // 1. Fetch persisted active handovers from DB (strictly excluding completed,
        // cancelled, already handed-over, and expired bookings)
        List<VehicleHandover> persistedHandovers;
        try {
            persistedHandovers = handoverRepository.findActiveByVehicleId(vehicleId, activeCutoff).stream()
                    .filter(h -> h.getBooking() != null
                            && h.getStatus() != HandoverStatus.COMPLETED
                            && h.getStatus() != HandoverStatus.CANCELLED
                            && h.getStatus() != HandoverStatus.HANDED_OVER
                            && h.getStatus() != HandoverStatus.OWNER_CONFIRMED
                            && !isBookingExpired(h.getBooking(), now)
                            && h.getBooking().getStatus() != BookingStatus.COMPLETED
                            && h.getBooking().getStatus() != BookingStatus.CANCELLED
                            && h.getBooking().getStatus() != BookingStatus.EXPIRED
                            && (h.getBooking().getEndTime() == null || now.isBefore(h.getBooking().getEndTime()))
                            && (tripRepository == null || (!tripRepository
                                    .existsByBooking_IdAndStatus(h.getBooking().getId(), TripStatus.ACTIVE)
                                    && !tripRepository.existsByBooking_IdAndStatus(h.getBooking().getId(),
                                            TripStatus.COMPLETED))))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            persistedHandovers = handoverRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId).stream()
                    .filter(h -> h.getStatus() != HandoverStatus.COMPLETED
                            && h.getStatus() != HandoverStatus.CANCELLED
                            && h.getStatus() != HandoverStatus.HANDED_OVER
                            && h.getStatus() != HandoverStatus.OWNER_CONFIRMED)
                    .filter(h -> h.getBooking() != null
                            && !isBookingExpired(h.getBooking(), now)
                            && h.getBooking().getStatus() != BookingStatus.COMPLETED
                            && h.getBooking().getStatus() != BookingStatus.CANCELLED
                            && h.getBooking().getStatus() != BookingStatus.EXPIRED
                            && (h.getBooking().getEndTime() == null || now.isBefore(h.getBooking().getEndTime()))
                            && (tripRepository == null || (!tripRepository
                                    .existsByBooking_IdAndStatus(h.getBooking().getId(), TripStatus.ACTIVE)
                                    && !tripRepository.existsByBooking_IdAndStatus(h.getBooking().getId(),
                                            TripStatus.COMPLETED))))
                    .collect(Collectors.toList());
        }

        for (VehicleHandover h : persistedHandovers) {
            VehicleHandoverResponse resp = VehicleHandoverResponse.fromEntity(h);
            evaluateHandoverResponseEligibility(resp, h.getBooking(), vehicleId, now);
            responseMap.put(h.getBooking().getId(), resp);
        }

        // 2. Fetch all upcoming confirmed & pending bookings for this vehicle
        List<Booking> allVehicleBookings = bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicleId);
        List<Booking> activeBookings = allVehicleBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING)
                .filter(b -> !isBookingExpired(b, now))
                .filter(b -> b.getEndTime() == null || now.isBefore(b.getEndTime()))
                .filter(b -> tripRepository == null
                        || (!tripRepository.existsByBooking_IdAndStatus(b.getId(), TripStatus.ACTIVE)
                                && !tripRepository.existsByBooking_IdAndStatus(b.getId(), TripStatus.COMPLETED)))
                .collect(Collectors.toList());

        for (Booking booking : activeBookings) {
            if (!responseMap.containsKey(booking.getId())) {
                Optional<VehicleHandover> existingOpt = handoverRepository.findByBookingId(booking.getId());
                if (existingOpt.isPresent()) {
                    VehicleHandover h = existingOpt.get();
                    if (h.getStatus() != HandoverStatus.CANCELLED
                            && h.getStatus() != HandoverStatus.COMPLETED
                            && h.getStatus() != HandoverStatus.HANDED_OVER
                            && h.getStatus() != HandoverStatus.OWNER_CONFIRMED) {
                        VehicleHandoverResponse resp = VehicleHandoverResponse.fromEntity(h);
                        evaluateHandoverResponseEligibility(resp, booking, vehicleId, now);
                        responseMap.put(booking.getId(), resp);
                    } else if (h.getStatus() == HandoverStatus.CANCELLED) {
                        // Previous handover attempt was cancelled, but the booking is still valid
                        // CONFIRMED/PENDING:
                        // Treat as pending preparation candidate so the booking remains visible and
                        // actionable in the queue
                        VehicleHandover transientCandidate = new VehicleHandover(
                                null,
                                booking,
                                booking.getVehicle(),
                                null,
                                booking.getUser(),
                                HandoverStatus.PENDING_PREPARATION);
                        VehicleHandoverResponse candidateResp = VehicleHandoverResponse.fromEntity(transientCandidate);
                        candidateResp.setId(null);
                        candidateResp.setBookingId(booking.getId());
                        candidateResp.setStatus(HandoverStatus.PENDING_PREPARATION);
                        evaluateHandoverResponseEligibility(candidateResp, booking, vehicleId, now);
                        responseMap.put(booking.getId(), candidateResp);
                    }
                } else {
                    VehicleHandover transientCandidate = new VehicleHandover(
                            null,
                            booking,
                            booking.getVehicle(),
                            null,
                            booking.getUser(),
                            HandoverStatus.PENDING_PREPARATION);
                    VehicleHandoverResponse candidateResp = VehicleHandoverResponse.fromEntity(transientCandidate);
                    candidateResp.setId(null);
                    candidateResp.setBookingId(booking.getId());
                    candidateResp.setStatus(HandoverStatus.PENDING_PREPARATION);
                    evaluateHandoverResponseEligibility(candidateResp, booking, vehicleId, now);
                    responseMap.put(booking.getId(), candidateResp);
                }
            }
        }

        List<VehicleHandoverResponse> responses = new ArrayList<>(responseMap.values());
        // Operational priority sorting:
        // Priority 1: Currently eligible for handover (handoverAllowed || READY)
        // Priority 2: Upcoming bookings approaching or within preparation window
        // Priority 3: Other confirmed future bookings (TOO_EARLY)
        // Secondary: Booking start time ascending
        responses.sort(Comparator
                .comparingInt((VehicleHandoverResponse r) -> determineOperationalPriority(r, now))
                .thenComparing(r -> r.getBookingStartTime() != null ? r.getBookingStartTime() : Instant.MAX));

        return responses;
    }

    private int determineOperationalPriority(VehicleHandoverResponse resp, Instant now) {
        if (resp == null)
            return 99;
        // Priority 1: Bookings currently eligible for handover
        if (resp.isHandoverAllowed() || resp.getEligibilityReason() == HandoverEligibilityReason.READY) {
            return 1;
        }
        // Priority 2: Upcoming bookings approaching or within preparation window
        if (resp.getBookingStartTime() != null) {
            Instant prepWindowStart = resp.getBookingStartTime().minus(Duration.ofMinutes(PREPARATION_WINDOW_MINUTES));
            if (!now.isBefore(prepWindowStart.minusSeconds(30))) {
                return 2;
            }
        }
        // Priority 3: Other confirmed future bookings
        return 3;
    }

    private void evaluateHandoverResponseEligibility(VehicleHandoverResponse resp, Booking booking, UUID vehicleId,
            Instant now) {
        if (resp == null || booking == null)
            return;

        resp.setBookingId(booking.getId());
        resp.setBookingStartTime(booking.getStartTime());
        resp.setBookingEndTime(booking.getEndTime());
        resp.setBookingPurpose(booking.getPurpose());
        if (booking.getUser() != null) {
            resp.setCoOwnerId(booking.getUser().getId());
            resp.setCoOwnerName(booking.getUser().getFullName());
            resp.setCoOwnerEmail(booking.getUser().getEmail());
        }
        if (booking.getVehicle() != null) {
            resp.setVehicleId(booking.getVehicle().getId());
            resp.setVehicleName(booking.getVehicle().getName());
            resp.setVehicleCode(booking.getVehicle().getName() != null ? booking.getVehicle().getName()
                    : booking.getVehicle().getLicensePlate());
            resp.setLicensePlate(booking.getVehicle().getLicensePlate());
        }

        if (isBookingExpired(booking, now)) {
            resp.setEligibilityReason(HandoverEligibilityReason.BOOKING_EXPIRED);
            resp.setEligibilityMessage("Lịch đặt xe đã hết thời gian (EXPIRED).");
            resp.setExpired(true);
            resp.setHandoverAllowed(false);
            return;
        }

        Instant prepWindowStart = booking.getStartTime().minus(Duration.ofMinutes(PREPARATION_WINDOW_MINUTES));
        if (now.isBefore(prepWindowStart.minusSeconds(30))) {
            resp.setEligibilityReason(HandoverEligibilityReason.TOO_EARLY);
            resp.setEligibilityMessage("Chưa đến thời gian chuẩn bị xe (bắt đầu trước 2 giờ).");
            resp.setHandoverAllowed(false);
            return;
        }

        if (resp.getStaffHandedOverAt() != null
                && resp.getStaffHandedOverAt().isBefore(prepWindowStart.minusSeconds(60))) {
            resp.setEligibilityReason(HandoverEligibilityReason.TOO_EARLY);
            resp.setEligibilityMessage(
                    "Phát hiện dữ liệu bàn giao không nhất quán với thời gian lịch đặt. Cần đối soát.");
            resp.setHandoverAllowed(false);
            return;
        }

        if (resp.getStatus() == HandoverStatus.HANDED_OVER ||
                resp.getStatus() == HandoverStatus.OWNER_CONFIRMED ||
                resp.getStatus() == HandoverStatus.COMPLETED) {
            resp.setEligibilityReason(HandoverEligibilityReason.HANDED_OVER);
            resp.setEligibilityMessage("XE ĐÃ ĐƯỢC BÀN GIAO");
            return;
        }

        // Section 5: Strict physical custody check across entire vehicle
        Optional<VehicleHandover> custodyOpt = getActiveCustodyHandover(vehicleId, resp.getId());
        if (custodyOpt.isPresent()) {
            VehicleHandover custodian = custodyOpt.get();
            String custodianName = custodian.getCoOwner() != null ? custodian.getCoOwner().getFullName()
                    : "thành viên trước";
            resp.setPreviousCustodyUnresolved(true);
            resp.setEligibilityReason(HandoverEligibilityReason.PREVIOUS_CUSTODY_UNRESOLVED);
            resp.setEligibilityMessage("Chờ thành viên trước trả xe: " + custodianName);
            resp.setHandoverAllowed(false);
            resp.setCurrentCustodianName(custodianName);
            if (custodian.getBooking() != null) {
                resp.setCurrentCustodianBookingId(custodian.getBooking().getId());
                resp.setCurrentCustodianExpectedReturnTime(custodian.getBooking().getEndTime());
                boolean overdue = custodian.getBooking().getEndTime() != null
                        && now.isAfter(custodian.getBooking().getEndTime());
                resp.setCurrentCustodianOverdue(overdue);
            }
            return;
        }

        Vehicle vehicle = vehicleRepository != null ? vehicleRepository.findById(vehicleId).orElse(null) : null;
        if (vehicle != null && vehicle.getStatus() == VehicleStatus.IN_USE) {
            resp.setPreviousCustodyUnresolved(true);
            resp.setEligibilityReason(HandoverEligibilityReason.VEHICLE_IN_USE);
            resp.setEligibilityMessage("Xe đang được sử dụng trong chuyến đi.");
            resp.setHandoverAllowed(false);
            return;
        }
        if (vehicle != null && vehicle.getStatus() == VehicleStatus.MAINTENANCE) {
            resp.setEligibilityReason(HandoverEligibilityReason.VEHICLE_MAINTENANCE);
            resp.setEligibilityMessage("Xe đang trong quá trình bảo dưỡng kỹ thuật.");
            resp.setHandoverAllowed(false);
            return;
        }
        if (vehicle != null && vehicle.getStatus() == VehicleStatus.CHARGING) {
            resp.setEligibilityReason(HandoverEligibilityReason.VEHICLE_CHARGING);
            resp.setEligibilityMessage("Xe đang trong quá trình sạc điện.");
            resp.setHandoverAllowed(false);
            return;
        }

        if (resp.getStatus() == HandoverStatus.READY_FOR_HANDOVER) {
            resp.setEligibilityReason(HandoverEligibilityReason.READY);
            resp.setEligibilityMessage("SẴN SÀNG BÀN GIAO XE");
            resp.setHandoverAllowed(true);
            return;
        }

        Optional<VehicleInspection> latestInsp = findLatestEligibleInspectionForHandover(vehicleId, resp.getId());
        if (latestInsp.isEmpty()) {
            resp.setEligibilityReason(HandoverEligibilityReason.NO_INSPECTION);
            resp.setEligibilityMessage("Chờ kiểm tra xe trước khi bàn giao.");
        } else {
            boolean fresh = latestInsp.get().getCompletedAt() != null &&
                    latestInsp.get().getCompletedAt().isAfter(now.minus(Duration.ofHours(maxAgeHours)));
            if (!fresh) {
                resp.setEligibilityReason(HandoverEligibilityReason.INSPECTION_EXPIRED);
                resp.setEligibilityMessage(
                        "Biên bản kiểm tra xe đã quá hạn (" + maxAgeHours + " giờ). Vui lòng kiểm tra lại.");
            } else if (latestInsp.get().getOverallResult() == InspectionOverallResult.FAIL) {
                resp.setEligibilityReason(HandoverEligibilityReason.INSPECTION_FAILED);
                resp.setEligibilityMessage("Kết quả kiểm tra không đạt chuẩn an toàn.");
            } else {
                resp.setEligibilityReason(HandoverEligibilityReason.READY_FOR_PREPARATION);
                resp.setEligibilityMessage("Chờ nhân viên chuẩn bị xe.");
            }
        }
    }

    @Transactional(readOnly = true)
    public Optional<VehicleHandoverResponse> getActiveHandoverForVehicle(UUID vehicleId, UUID currentUserId,
            Role currentUserRole) {
        // Physical custody source of truth: if an active custody handover exists,
        // return it authoritatively
        Optional<VehicleHandover> custodyOpt = getActiveCustodyHandover(vehicleId, null);
        if (custodyOpt.isPresent()) {
            return Optional.of(VehicleHandoverResponse.fromEntity(custodyOpt.get()));
        }
        List<VehicleHandoverResponse> handovers = getActiveHandoversForVehicle(vehicleId, currentUserId,
                currentUserRole);
        return handovers.stream().findFirst();
    }

    @Transactional(readOnly = true)
    public List<VehicleHandoverResponse> getHandoverHistory(UUID vehicleId) {
        return getHandoverHistory(vehicleId, null, null);
    }

    @Transactional(readOnly = true)
    public List<VehicleHandoverResponse> getHandoverHistory(UUID vehicleId, UUID currentUserId, Role currentUserRole) {
        if (currentUserRole == Role.CO_OWNER && coOwnershipService != null && currentUserId != null) {
            if (!coOwnershipService.isUserActiveMemberForVehicle(currentUserId, vehicleId)) {
                throw new AccessDeniedException("Bạn không có quyền truy cập lịch sử bàn giao của xe này");
            }
        }

        List<VehicleHandover> handovers = handoverRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
        List<VehicleHandoverResponse> responses = new ArrayList<>();
        for (VehicleHandover h : handovers) {
            VehicleHandoverResponse resp = VehicleHandoverResponse.fromEntity(h);
            if (tripRepository != null && h.getBooking() != null) {
                tripRepository.findByBookingId(h.getBooking().getId()).ifPresent(t -> {
                    resp.setTripId(t.getId());
                    resp.setTripStatus(t.getStatus() != null ? t.getStatus().name() : null);
                    resp.setTripEndedAt(t.getEndedAt());
                    resp.setReturnVerifiedAt(t.getReturnVerifiedAt());
                    if (t.getReturnVerifiedBy() != null) {
                        resp.setReturnVerifiedByStaffName(t.getReturnVerifiedBy().getFullName());
                    }
                    if (t.getReturnInspection() != null) {
                        resp.setReturnInspectionResult(
                                t.getReturnInspection().getOverallResult() != null
                                        ? t.getReturnInspection().getOverallResult().name()
                                        : (t.getReturnInspection().getStatus() != null
                                                ? t.getReturnInspection().getStatus().name()
                                                : null));
                    }
                });
            }
            responses.add(resp);
        }
        return responses;
    }

    public Optional<VehicleHandover> getActiveCustodyHandover(UUID vehicleId, UUID excludeHandoverId) {
        if (vehicleId == null) {
            return Optional.empty();
        }

        // 1. Direct check in VehicleHandover table for handovers in HANDED_OVER or
        // OWNER_CONFIRMED status
        List<VehicleHandover> custodyList = handoverRepository.findCustodyHandoversForVehicle(vehicleId,
                excludeHandoverId);
        if (!custodyList.isEmpty()) {
            return Optional.of(custodyList.get(0));
        }

        // 2. Check active trips on this vehicle
        if (tripRepository != null) {
            Optional<Trip> activeTripOpt = tripRepository.findActiveTripByVehicleId(vehicleId);
            if (activeTripOpt.isPresent() && activeTripOpt.get().getBooking() != null) {
                UUID tripBookingId = activeTripOpt.get().getBooking().getId();
                Optional<VehicleHandover> tripHandover = handoverRepository.findByBookingId(tripBookingId);
                if (tripHandover.isPresent()) {
                    if (excludeHandoverId == null || !tripHandover.get().getId().equals(excludeHandoverId)) {
                        return tripHandover;
                    }
                }
            }
        }

        return Optional.empty();
    }

    public Optional<VehicleInspection> findLatestApplicableInspectionForVehicle(UUID vehicleId) {
        if (inspectionRepository == null || vehicleId == null) {
            return Optional.empty();
        }
        List<VehicleInspection> completed = inspectionRepository
                .findCompletedByVehicleIdOrderByCompletedAtDesc(vehicleId);
        if (completed == null || completed.isEmpty()) {
            return Optional.empty();
        }
        return completed.stream()
                .filter(i -> i.getInspectionType() != InspectionType.POST_TRIP)
                .findFirst()
                .or(() -> completed.stream().findFirst());
    }

    public Optional<VehicleInspection> findLatestEligibleInspectionForHandover(UUID vehicleId, UUID currentHandoverId) {
        Optional<VehicleInspection> latestOpt = findLatestApplicableInspectionForVehicle(vehicleId);
        if (latestOpt.isEmpty()) {
            return Optional.empty();
        }

        VehicleInspection insp = latestOpt.get();

        // 1. Check vehicle operational status
        if (vehicleRepository != null) {
            Optional<Vehicle> vOpt = vehicleRepository.findById(vehicleId);
            if (vOpt.isPresent() && (vOpt.get().getStatus() == VehicleStatus.MAINTENANCE
                    || vOpt.get().getStatus() == VehicleStatus.CHARGING)) {
                return Optional.empty();
            }
        }

        // 2. Status must be COMPLETED
        if (insp.getStatus() != InspectionStatus.COMPLETED) {
            return Optional.empty();
        }

        // 3. Result must NOT be FAIL
        if (insp.getOverallResult() == null || insp.getOverallResult() == InspectionOverallResult.FAIL) {
            return Optional.empty();
        }

        Instant completedAt = insp.getCompletedAt();
        if (completedAt == null) {
            return Optional.empty();
        }

        // 4. Freshness window check: must be within maxAgeHours (24h)
        if (completedAt.isBefore(Instant.now().minus(Duration.ofHours(maxAgeHours)))) {
            return Optional.empty();
        }

        // 5. Invalidation check: Has a trip completed AFTER this inspection?
        if (tripRepository != null) {
            Optional<Trip> lastCompletedTrip = tripRepository.findFirstByVehicleIdAndStatusOrderByEndedAtDesc(vehicleId,
                    TripStatus.COMPLETED);
            if (lastCompletedTrip.isPresent() && lastCompletedTrip.get().getEndedAt() != null) {
                if (lastCompletedTrip.get().getEndedAt().isAfter(completedAt)) {
                    return Optional.empty();
                }
            }
        }

        // 6. Invalidation check: Are there any unresolved SEVERE damage records on the
        // vehicle?
        if (damageRecordRepository != null) {
            List<DamageRecord> unresolvedDamages = damageRecordRepository
                    .findByVehicleIdAndStatusNot(vehicleId, DamageStatus.RESOLVED);
            boolean hasSevere = unresolvedDamages.stream().anyMatch(d -> d.getSeverity() == DamageSeverity.SEVERE);
            if (hasSevere) {
                return Optional.empty();
            }
        }

        // 7. Checkpoints completeness: must cover all REQUIRED_CHECKPOINTS
        if (insp.getItems() == null || insp.getItems().isEmpty()) {
            return Optional.empty();
        }
        Set<String> coveredParts = insp.getItems().stream()
                .map(VehicleInspectionItem::getVehiclePartCode)
                .map(VehicleInspectionService::normalizeCanonicalPartCode)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        for (String reqPart : REQUIRED_CHECKPOINTS) {
            if (!coveredParts.contains(reqPart)) {
                return Optional.empty();
            }
        }

        // Inspection satisfies all criteria: authoritative REUSE approved
        return Optional.of(insp);
    }

    @Transactional(readOnly = true)
    public VehicleHandoverEligibilityResponse getHandoverEligibilityByHandoverId(UUID handoverId, UUID currentUserId,
            Role currentUserRole) {
        VehicleHandover handover = handoverRepository.findById(handoverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bàn giao xe: " + handoverId));
        VehicleHandoverEligibilityResponse resp = new VehicleHandoverEligibilityResponse();
        resp.setVehicleId(handover.getVehicle().getId());
        resp.setVehicleName(handover.getVehicle().getName());
        resp.setVehicleCode(handover.getVehicle().getName() != null ? handover.getVehicle().getName()
                : handover.getVehicle().getLicensePlate());
        return populateEligibilityForBooking(resp, handover.getBooking(), handover.getVehicle().getId());
    }

    @Transactional(readOnly = true)
    public VehicleHandoverEligibilityResponse getHandoverEligibility(UUID vehicleId, UUID currentUserId,
            Role currentUserRole) {
        VehicleHandoverEligibilityResponse resp = new VehicleHandoverEligibilityResponse();
        resp.setVehicleId(vehicleId);

        // 1. Resolve vehicle
        Vehicle vehicle = vehicleRepository != null ? vehicleRepository.findById(vehicleId).orElse(null) : null;
        if (vehicle != null) {
            resp.setVehicleName(vehicle.getName());
            resp.setVehicleCode(vehicle.getName() != null ? vehicle.getName() : vehicle.getLicensePlate());
        }

        Instant now = Instant.now();
        Instant activeCutoff = now.minus(Duration.ofHours(2));

        // 2. Resolve relevant upcoming/active booking for this vehicle first
        List<Booking> allBookings = bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicleId);
        if (currentUserRole == Role.CO_OWNER && currentUserId != null) {
            allBookings = allBookings.stream()
                    .filter(b -> b.getUser() != null && currentUserId.equals(b.getUser().getId()))
                    .collect(Collectors.toList());
        }

        List<Booking> candidates = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING)
                .filter(b -> !isBookingExpired(b, now))
                .filter(b -> b.getEndTime() == null || now.isBefore(b.getEndTime()))
                .filter(b -> tripRepository == null
                        || (!tripRepository.existsByBooking_IdAndStatus(b.getId(), TripStatus.ACTIVE)
                                && !tripRepository.existsByBooking_IdAndStatus(b.getId(), TripStatus.COMPLETED)))
                .filter(b -> {
                    Optional<VehicleHandover> existingH = handoverRepository.findByBookingId(b.getId());
                    if (existingH.isPresent()) {
                        HandoverStatus st = existingH.get().getStatus();
                        if (currentUserRole != Role.CO_OWNER) {
                            return st != HandoverStatus.COMPLETED
                                    && st != HandoverStatus.HANDED_OVER
                                    && st != HandoverStatus.OWNER_CONFIRMED;
                        }
                        return st != HandoverStatus.CANCELLED;
                    }
                    return true;
                })
                .collect(Collectors.toList());

        // CASE C: No upcoming or active booking requires handover
        if (candidates.isEmpty()) {
            boolean hadPastBookings = allBookings.stream().anyMatch(b -> isBookingExpired(b, now));
            if (hadPastBookings && allBookings.stream().allMatch(b -> isBookingExpired(b, now)
                    || b.getStatus() == BookingStatus.COMPLETED || b.getStatus() == BookingStatus.CANCELLED)) {
                resp.setReason(HandoverEligibilityReason.BOOKING_EXPIRED);
                resp.setMessage("LỊCH ĐẶT ĐÃ HẾT HIỆU LỰC");
                resp.setBookingId(null);
                resp.setHandoverId(null);
                resp.setHandoverStatus(null);
                resp.setHandover(null);
                resp.setHandoverAllowed(false);
                resp.setEligibleForInspection(false);
                return resp;
            }
            resp.setReason(HandoverEligibilityReason.NO_BOOKING);
            resp.setMessage("Hiện không có lịch đặt đủ điều kiện bàn giao.");
            resp.setBookingId(null);
            resp.setHandoverId(null);
            resp.setHandoverStatus(null);
            resp.setHandover(null);
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(false);
            return resp;
        }

        // 3. Nearest upcoming or active booking requiring handover
        Booking target = candidates.get(0);
        populateEligibilityForBooking(resp, target, vehicleId);

        // 4. Check vehicle operational status (preserves booking details!)
        if (vehicle != null && vehicle.getStatus() == VehicleStatus.MAINTENANCE) {
            resp.setReason(HandoverEligibilityReason.VEHICLE_MAINTENANCE);
            resp.setMessage("Xe đang trong quá trình bảo dưỡng kỹ thuật.");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(false);
            return resp;
        }

        if (vehicle != null && vehicle.getStatus() == VehicleStatus.CHARGING) {
            resp.setReason(HandoverEligibilityReason.VEHICLE_CHARGING);
            resp.setMessage("Xe đang trong quá trình sạc pin.");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(false);
            return resp;
        }

        // 5. Section 5: Strict physical custody check across entire vehicle
        Optional<VehicleHandover> custodyOpt = getActiveCustodyHandover(vehicleId, resp.getHandoverId());
        if (custodyOpt.isPresent()) {
            VehicleHandover custodian = custodyOpt.get();
            String custodianName = custodian.getCoOwner() != null ? custodian.getCoOwner().getFullName()
                    : "thành viên trước";
            resp.setPreviousCustodyUnresolved(true);
            resp.setReason(HandoverEligibilityReason.PREVIOUS_CUSTODY_UNRESOLVED);
            resp.setMessage("Xe chưa được trả bởi thành viên trước.");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(false);
            resp.setCurrentCustodianName(custodianName);
            if (custodian.getBooking() != null) {
                resp.setCurrentCustodianBookingId(custodian.getBooking().getId());
                resp.setCurrentCustodianExpectedReturnTime(custodian.getBooking().getEndTime());
                boolean overdue = custodian.getBooking().getEndTime() != null
                        && now.isAfter(custodian.getBooking().getEndTime());
                resp.setCurrentCustodianOverdue(overdue);
            }
            return resp;
        }

        boolean isVehicleUnavailable = (vehicle != null && vehicle.getStatus() == VehicleStatus.IN_USE) ||
                (tripRepository != null && tripRepository.existsByVehicleIdAndStatus(vehicleId, TripStatus.ACTIVE));
        if (isVehicleUnavailable) {
            resp.setPreviousCustodyUnresolved(true);
            resp.setReason(HandoverEligibilityReason.VEHICLE_IN_USE);
            resp.setMessage("Xe đang được sử dụng trong chuyến đi.");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(false);
            return resp;
        }

        return resp;
    }

    private VehicleHandoverEligibilityResponse populateEligibilityForBooking(
            VehicleHandoverEligibilityResponse resp,
            Booking target,
            UUID vehicleId) {
        resp.setBookingId(target.getId());
        resp.setBookingStartTime(target.getStartTime());
        resp.setBookingEndTime(target.getEndTime());
        resp.setBookingPurpose(target.getPurpose());
        if (target.getUser() != null) {
            resp.setRecipientName(target.getUser().getFullName());
            resp.setRecipientEmail(target.getUser().getEmail());
        }

        // Resolve existing handover if any
        Optional<VehicleHandover> bookingHandoverOpt = handoverRepository.findByBookingId(target.getId());
        VehicleHandover handover = bookingHandoverOpt.orElse(null);

        if (handover != null) {
            boolean identityMatches = handover.getBooking() != null
                    && handover.getBooking().getId().equals(target.getId())
                    && handover.getVehicle() != null && handover.getVehicle().getId().equals(vehicleId)
                    && (target.getUser() == null || handover.getCoOwner() == null
                            || handover.getCoOwner().getId().equals(target.getUser().getId()));
            if (identityMatches) {
                resp.setHandoverId(handover.getId());
                resp.setHandoverStatus(handover.getStatus() != null ? handover.getStatus().name() : null);
                resp.setHandover(VehicleHandoverResponse.fromEntity(handover));
            } else {
                handover = null;
                resp.setHandoverId(null);
                resp.setHandoverStatus(null);
                resp.setHandover(null);
            }
        } else {
            // Case A: Handover has not been created yet in DB
            resp.setHandoverId(null);
            resp.setHandoverStatus(null);
            resp.setHandover(null);
        }

        // Authoritative inspection evaluation: resolve matching unconsumed inspection
        // for this vehicle/handover context
        VehicleInspection targetInsp = (handover != null && handover.getInspection() != null)
                ? handover.getInspection()
                : findLatestApplicableInspectionForVehicle(vehicleId).orElse(null);

        populateInspectionDetails(resp, targetInsp);

        Instant now = Instant.now();
        if (isBookingExpired(target, now)) {
            resp.setReason(HandoverEligibilityReason.BOOKING_EXPIRED);
            resp.setMessage("LỊCH ĐẶT ĐÃ HẾT HIỆU LỰC");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(false);
            return resp;
        }

        Instant prepWindowStart = target.getStartTime().minus(Duration.ofMinutes(PREPARATION_WINDOW_MINUTES));
        resp.setPreparationWindowStartTime(prepWindowStart);

        // Time gate: if too early, preserve inspection result in response but keep
        // handover action strictly disabled
        if (now.isBefore(prepWindowStart.minusSeconds(30))) {
            long secondsUntil = Duration.between(now, prepWindowStart).getSeconds();
            resp.setSecondsUntilPreparation(Math.max(0, secondsUntil));
            resp.setReason(HandoverEligibilityReason.TOO_EARLY);
            resp.setMessage("CHƯA ĐẾN THỜI GIAN CHUẨN BỊ XE");
            resp.setEligibleForInspection(true);
            resp.setHandoverAllowed(false);
            return resp;
        }

        if (handover != null) {
            if (handover.getStaffHandedOverAt() != null
                    && handover.getStaffHandedOverAt().isBefore(prepWindowStart.minusSeconds(60))) {
                resp.setReason(HandoverEligibilityReason.TOO_EARLY);
                resp.setMessage("Phát hiện dữ liệu bàn giao không nhất quán với thời gian lịch đặt. Cần đối soát.");
                resp.setHandoverAllowed(false);
                resp.setEligibleForInspection(false);
                return resp;
            }

            if (handover.getStatus() == HandoverStatus.HANDED_OVER) {
                if (handover.getStaffHandedOverAt() != null) {
                    resp.setReason(HandoverEligibilityReason.HANDED_OVER);
                    resp.setMessage("XE ĐÃ ĐƯỢC BÀN GIAO — ĐANG CHỜ ĐỒNG SỞ HỮU XÁC NHẬN");
                    resp.setHandoverAllowed(false);
                    resp.setEligibleForInspection(false);
                    return resp;
                }
            }

            if (handover.getStatus() == HandoverStatus.OWNER_CONFIRMED
                    || handover.getStatus() == HandoverStatus.COMPLETED) {
                resp.setReason(HandoverEligibilityReason.HANDED_OVER);
                resp.setMessage("XE ĐÃ ĐƯỢC BÀN GIAO");
                resp.setHandoverAllowed(false);
                resp.setEligibleForInspection(false);
                return resp;
            }
        }

        // Section 5: Strict physical custody check across entire vehicle
        Optional<VehicleHandover> bookingCustodyOpt = getActiveCustodyHandover(vehicleId,
                handover != null ? handover.getId() : null);
        if (bookingCustodyOpt.isPresent()) {
            VehicleHandover custodian = bookingCustodyOpt.get();
            String custodianName = custodian.getCoOwner() != null ? custodian.getCoOwner().getFullName()
                    : "thành viên trước";
            resp.setPreviousCustodyUnresolved(true);
            resp.setReason(HandoverEligibilityReason.PREVIOUS_CUSTODY_UNRESOLVED);
            resp.setMessage("Xe chưa được trả bởi thành viên trước.");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(false);
            resp.setCurrentCustodianName(custodianName);
            if (custodian.getBooking() != null) {
                resp.setCurrentCustodianBookingId(custodian.getBooking().getId());
                resp.setCurrentCustodianExpectedReturnTime(custodian.getBooking().getEndTime());
                boolean overdue = custodian.getBooking().getEndTime() != null
                        && now.isAfter(custodian.getBooking().getEndTime());
                resp.setCurrentCustodianOverdue(overdue);
            }
            return resp;
        }

        if (handover != null && handover.getStatus() == HandoverStatus.READY_FOR_HANDOVER) {
            resp.setReason(HandoverEligibilityReason.READY);
            resp.setMessage("XE ĐÃ SẴN SÀNG ĐỂ BÀN GIAO");
            resp.setHandoverAllowed(true);
            resp.setEligibleForInspection(true);
            return resp;
        }

        evaluateInspectionReadiness(resp);
        return resp;
    }

    private void populateInspectionDetails(VehicleHandoverEligibilityResponse resp, VehicleInspection insp) {
        if (insp != null) {
            resp.setInspectionAvailable(true);
            resp.setInspectionId(insp.getId());
            resp.setInspectionResult(insp.getOverallResult() != null ? insp.getOverallResult().name() : "PASS");
            resp.setInspectionCompletedAt(insp.getCompletedAt());
            boolean fresh = insp.getCompletedAt() != null &&
                    insp.getCompletedAt().isAfter(Instant.now().minus(Duration.ofHours(maxAgeHours)));
            resp.setInspectionFresh(fresh);

            Set<String> uniqueParts = new HashSet<>();
            int totalRecords = 0;
            if (insp.getItems() != null) {
                totalRecords = insp.getItems().size();
                for (VehicleInspectionItem item : insp.getItems()) {
                    if (item.getVehiclePartCode() != null) {
                        uniqueParts.add(VehicleInspectionService.normalizeCanonicalPartCode(item.getVehiclePartCode()));
                    }
                }
            }
            resp.setTotalAssessmentRecords(totalRecords);
            resp.setUniqueAssessedComponents(uniqueParts.size());
            resp.setInspectedPartsCount(uniqueParts.size());
            resp.setRequiredComponentCount(REQUIRED_CHECKPOINTS.size());
            long reqCount = uniqueParts.stream().filter(REQUIRED_CHECKPOINTS::contains).count();
            resp.setAssessedRequiredComponentCount((int) reqCount);

            if (damageRecordRepository != null && resp.getVehicleId() != null) {
                List<DamageRecord> unres = damageRecordRepository.findByVehicleIdAndStatusNot(resp.getVehicleId(),
                        DamageStatus.RESOLVED);
                long severe = unres.stream().filter(d -> d.getSeverity() == DamageSeverity.SEVERE).count();
                resp.setUnresolvedCriticalDamageCount((int) severe);
            } else {
                resp.setUnresolvedCriticalDamageCount(0);
            }

            if (insp.getInspectedBy() != null) {
                resp.setInspectorName(insp.getInspectedBy().getFullName());
            }
        } else {
            resp.setInspectionAvailable(false);
            resp.setInspectionFresh(false);
            resp.setInspectionId(null);
            resp.setInspectionResult(null);
            resp.setInspectionCompletedAt(null);
            resp.setInspectedPartsCount(0);
            resp.setTotalAssessmentRecords(0);
            resp.setUniqueAssessedComponents(0);
            resp.setRequiredComponentCount(REQUIRED_CHECKPOINTS.size());
            resp.setAssessedRequiredComponentCount(0);
            resp.setUnresolvedCriticalDamageCount(0);
            resp.setInspectorName(null);
        }
    }

    private void evaluateInspectionReadiness(VehicleHandoverEligibilityResponse resp) {
        if (!resp.isInspectionAvailable()) {
            resp.setReason(HandoverEligibilityReason.NO_INSPECTION);
            resp.setMessage("Chưa có biên bản kiểm tra kỹ thuật hoàn tất hợp lệ.");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(true);
        } else if (!resp.isInspectionFresh()) {
            resp.setReason(HandoverEligibilityReason.INSPECTION_EXPIRED);
            resp.setMessage("Cần kiểm tra lại: Biên bản kiểm tra đã hết hạn (> " + maxAgeHours + " giờ).");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(true);
        } else if (resp.getInspectionCompletedAt() != null && tripRepository != null &&
                tripRepository
                        .findFirstByVehicleIdAndStatusOrderByEndedAtDesc(resp.getVehicleId(), TripStatus.COMPLETED)
                        .filter(t -> t.getEndedAt() != null && t.getEndedAt().isAfter(resp.getInspectionCompletedAt()))
                        .isPresent()) {
            resp.setReason(HandoverEligibilityReason.NO_INSPECTION);
            resp.setMessage("Cần kiểm tra lại: Xe đã hoàn thành chuyến đi sau lần kiểm tra gần nhất.");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(true);
        } else if (resp.getUnresolvedCriticalDamageCount() != null && resp.getUnresolvedCriticalDamageCount() > 0) {
            resp.setReason(HandoverEligibilityReason.INSPECTION_FAILED);
            resp.setMessage("Phát hiện " + resp.getUnresolvedCriticalDamageCount()
                    + " hư hỏng nghiêm trọng chưa xử lý. Không thể bàn giao xe.");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(true);
        } else if ("FAIL".equalsIgnoreCase(resp.getInspectionResult())) {
            resp.setReason(HandoverEligibilityReason.INSPECTION_FAILED);
            resp.setMessage("Kết quả kiểm tra xe KHÔNG ĐẠT (FAIL). Không thể bàn giao xe.");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(true);
        } else if (resp.getAssessedRequiredComponentCount() != null
                && resp.getAssessedRequiredComponentCount() < REQUIRED_CHECKPOINTS.size()) {
            int missing = REQUIRED_CHECKPOINTS.size() - resp.getAssessedRequiredComponentCount();
            resp.setReason(HandoverEligibilityReason.NO_INSPECTION);
            resp.setMessage("Chưa kiểm tra " + missing + "/" + REQUIRED_CHECKPOINTS.size()
                    + " bộ phận bắt buộc (Mới đạt " + resp.getAssessedRequiredComponentCount() + "/"
                    + REQUIRED_CHECKPOINTS.size() + " bộ phận).");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(true);
        } else {
            // Authoritative inspection is valid and PASS / PASS_WITH_NOTES with all
            // required parts checked and no unresolved severe damage
            resp.setReason(HandoverEligibilityReason.READY);
            resp.setMessage("Biên bản kiểm tra hợp lệ: SẴN SÀNG (" + resp.getAssessedRequiredComponentCount() + "/"
                    + REQUIRED_CHECKPOINTS.size() + " bộ phận bắt buộc)");
            resp.setHandoverAllowed(true);
            resp.setEligibleForInspection(true);
        }
    }

    @Transactional(readOnly = true)
    public VehicleHandoverEligibilityResponse getHandoverEligibilityByBookingId(UUID bookingId, UUID currentUserId,
            Role currentUserRole) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch đặt với mã: " + bookingId));

        if (currentUserRole == Role.CO_OWNER && currentUserId != null && booking.getUser() != null) {
            if (!booking.getUser().getId().equals(currentUserId)) {
                throw new AccessDeniedException("Bạn không có quyền truy cập điều kiện bàn giao của lịch đặt này");
            }
        }

        VehicleHandoverEligibilityResponse resp = new VehicleHandoverEligibilityResponse();
        UUID vehicleId = booking.getVehicle() != null ? booking.getVehicle().getId() : null;
        if (vehicleId != null) {
            resp.setVehicleId(vehicleId);
            resp.setVehicleName(booking.getVehicle().getName());
            resp.setVehicleCode(booking.getVehicle().getName() != null ? booking.getVehicle().getName()
                    : booking.getVehicle().getLicensePlate());
        }
        return populateEligibilityForBooking(resp, booking, vehicleId);
    }

    @Transactional
    public VehicleHandoverResponse createHandover(UUID bookingId, UUID staffId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch đặt với mã: " + bookingId));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Lịch đặt xe đã bị hủy, không thể tiến hành bàn giao");
        }

        if (booking.isExpired() || booking.getEndTime().isBefore(Instant.now())
                || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Lịch đặt xe đã hết thời gian (EXPIRED), không thể tạo hồ sơ bàn giao");
        }

        Instant now = Instant.now();
        Instant prepWindowStart = booking.getStartTime().minus(Duration.ofMinutes(PREPARATION_WINDOW_MINUTES));
        if (now.isBefore(prepWindowStart.minusSeconds(30))) {
            throw new IllegalStateException("Chưa đến thời gian chuẩn bị xe cho lịch đặt này (bắt đầu trước 2 giờ)");
        }

        // 1 booking -> 1 handover (enforce unique handover per booking)
        Optional<VehicleHandover> existingOpt = handoverRepository.findByBookingId(bookingId);
        if (existingOpt.isPresent()) {
            return VehicleHandoverResponse.fromEntity(existingOpt.get());
        }

        User staff = staffId != null ? userRepository.findById(staffId).orElse(null) : null;

        VehicleHandover handover = new VehicleHandover(
                UUID.randomUUID(),
                booking,
                booking.getVehicle(),
                staff,
                booking.getUser(),
                HandoverStatus.PENDING_PREPARATION);

        VehicleHandover saved = handoverRepository.save(handover);
        return VehicleHandoverResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleHandoverResponse startHandover(UUID bookingId, UUID staffId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch đặt với mã: " + bookingId));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Lịch đặt xe đã bị hủy, không thể tiến hành bàn giao");
        }

        if (booking.isExpired() || booking.getEndTime().isBefore(Instant.now())
                || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Lịch đặt xe đã hết thời gian (EXPIRED), không thể bắt đầu kiểm tra");
        }

        Instant now = Instant.now();
        Instant prepWindowStart = booking.getStartTime().minus(Duration.ofMinutes(PREPARATION_WINDOW_MINUTES));
        if (now.isBefore(prepWindowStart.minusSeconds(30))) {
            throw new IllegalStateException("Chưa đến thời gian chuẩn bị xe (TOO_EARLY)");
        }

        if (booking.getVehicle() != null && booking.getVehicle().getStatus() == VehicleStatus.IN_USE) {
            throw new IllegalStateException("Xe đang được sử dụng trong chuyến đi, không thể tiến hành bàn giao lại");
        }
        if (booking.getVehicle() != null && booking.getVehicle().getStatus() == VehicleStatus.CHARGING) {
            throw new IllegalStateException(
                    "Xe đang trong quá trình sạc pin, vui lòng ngắt sạc trước khi tiến hành bàn giao");
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên"));

        // Check if a handover already exists for this booking (Reuse existing or reject
        // if already handed over)
        Optional<VehicleHandover> existingOpt = handoverRepository.findByBookingId(bookingId);
        VehicleHandover handover;

        if (existingOpt.isPresent()) {
            handover = existingOpt.get();
            if (handover.getStatus() == HandoverStatus.HANDED_OVER ||
                    handover.getStatus() == HandoverStatus.OWNER_CONFIRMED ||
                    handover.getStatus() == HandoverStatus.COMPLETED) {
                throw new DuplicateResourceException("XE ĐÃ ĐƯỢC BÀN GIAO");
            }
            handover.setStaff(staff);
            if (handover.getStatus() == HandoverStatus.PENDING_PREPARATION) {
                handover.setStatus(HandoverStatus.INSPECTION_IN_PROGRESS);
            }
        } else {
            // Exactly ONE explicit creation point
            handover = new VehicleHandover(
                    UUID.randomUUID(),
                    booking,
                    booking.getVehicle(),
                    staff,
                    booking.getUser(),
                    HandoverStatus.INSPECTION_IN_PROGRESS);
        }

        VehicleHandover saved = handoverRepository.save(handover);
        return VehicleHandoverResponse.fromEntity(saved);
    }

    @Deprecated
    @Transactional
    public VehicleInspectionResponse recordInspection(UUID handoverId, VehicleInspectionRequest request, UUID staffId) {
        throw new UnsupportedOperationException(
                "Quy trình kiểm tra 8 điểm trực tiếp trên bàn giao đã được thay thế bằng kiểm tra bộ phận độc lập (/api/inspections)");
    }

    @Transactional
    public VehicleHandoverResponse markReadyForHandover(UUID handoverId, UUID staffId) {
        VehicleHandover handover = handoverRepository.findById(handoverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bàn giao xe: " + handoverId));

        if (handover.getStatus() == HandoverStatus.HANDED_OVER ||
                handover.getStatus() == HandoverStatus.OWNER_CONFIRMED ||
                handover.getStatus() == HandoverStatus.COMPLETED) {
            throw new DuplicateResourceException("KHÔNG THỂ BÀN GIAO LẠI XE ĐÃ ĐƯỢC BÀN GIAO");
        }

        if (handover.getStatus() == HandoverStatus.READY_FOR_HANDOVER) {
            return VehicleHandoverResponse.fromEntity(handover);
        }

        Booking booking = handover.getBooking();
        if (booking == null || booking.getStatus() != BookingStatus.CONFIRMED || booking.isExpired()
                || booking.getEndTime().isBefore(Instant.now()) || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException(
                    "Lịch đặt xe đã hết thời gian (EXPIRED) hoặc không hợp lệ, không thể xác nhận sẵn sàng");
        }

        Instant now = Instant.now();
        Instant prepWindowStart = booking.getStartTime().minus(Duration.ofMinutes(PREPARATION_WINDOW_MINUTES));
        if (now.isBefore(prepWindowStart.minusSeconds(30))) {
            throw new IllegalStateException("Chưa đến thời gian chuẩn bị xe cho lịch đặt này (TOO_EARLY)");
        }

        Vehicle vehicle = handover.getVehicle();
        if (vehicle != null && vehicle.getStatus() == VehicleStatus.MAINTENANCE) {
            throw new IllegalStateException("Xe đang trong quá trình bảo dưỡng, không thể xác nhận sẵn sàng bàn giao");
        }
        if (vehicle != null && vehicle.getStatus() == VehicleStatus.CHARGING) {
            throw new IllegalStateException("Xe đang trong quá trình sạc, không thể xác nhận sẵn sàng bàn giao");
        }

        // Authoritative Standalone Inspection Verification
        VehicleInspection latestInsp = null;
        if (handover.getInspection() != null) {
            latestInsp = handover.getInspection();
        } else if (vehicle != null) {
            latestInsp = findLatestEligibleInspectionForHandover(vehicle.getId(), handover.getId()).orElse(null);
        }

        if (latestInsp == null) {
            Optional<VehicleInspection> applicableOpt = findLatestApplicableInspectionForVehicle(
                    vehicle != null ? vehicle.getId() : null);
            if (applicableOpt.isEmpty()) {
                throw new IllegalStateException(
                        "Xe chưa có kết quả kiểm tra hợp lệ để bàn giao. Vui lòng thực hiện kiểm tra xe trước.");
            }
            VehicleInspection app = applicableOpt.get();
            if (app.getOverallResult() == InspectionOverallResult.FAIL) {
                throw new IllegalStateException("Kết quả kiểm tra xe KHÔNG ĐẠT (FAIL). Không thể bàn giao xe.");
            }
            Set<String> covered = app.getItems() != null ? app.getItems().stream()
                    .map(VehicleInspectionItem::getVehiclePartCode)
                    .map(VehicleInspectionService::normalizeCanonicalPartCode)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet()) : Collections.emptySet();
            long reqCovered = REQUIRED_CHECKPOINTS.stream().filter(covered::contains).count();
            if (reqCovered < REQUIRED_CHECKPOINTS.size()) {
                throw new IllegalStateException("Chưa hoàn tất kiểm tra đủ 8 bộ phận bắt buộc (Mới đạt " + reqCovered
                        + "/8 bộ phận). Không thể bàn giao xe.");
            }
            if (damageRecordRepository != null && vehicle != null) {
                boolean hasSevere = damageRecordRepository
                        .findByVehicleIdAndStatusNot(vehicle.getId(), DamageStatus.RESOLVED)
                        .stream().anyMatch(d -> d.getSeverity() == DamageSeverity.SEVERE);
                if (hasSevere) {
                    throw new IllegalStateException(
                            "Phát hiện hư hỏng nghiêm trọng chưa xử lý trên xe. Không thể bàn giao xe.");
                }
            }
            throw new IllegalStateException(
                    "Xe chưa có kết quả kiểm tra hợp lệ để bàn giao. Vui lòng thực hiện kiểm tra xe trước.");
        }

        if (latestInsp.getOverallResult() == InspectionOverallResult.FAIL) {
            throw new IllegalStateException("Kết quả kiểm tra xe KHÔNG ĐẠT (FAIL). Không thể bàn giao xe.");
        }

        Set<String> coveredReqParts = latestInsp.getItems() != null ? latestInsp.getItems().stream()
                .map(VehicleInspectionItem::getVehiclePartCode)
                .map(VehicleInspectionService::normalizeCanonicalPartCode)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()) : Collections.emptySet();
        long reqCount = REQUIRED_CHECKPOINTS.stream().filter(coveredReqParts::contains).count();
        if (reqCount < REQUIRED_CHECKPOINTS.size()) {
            throw new IllegalStateException("Chưa hoàn tất kiểm tra đủ 8 bộ phận bắt buộc (Mới đạt " + reqCount
                    + "/8 bộ phận). Không thể bàn giao xe.");
        }

        boolean fresh = latestInsp.getCompletedAt() != null &&
                latestInsp.getCompletedAt().isAfter(Instant.now().minus(Duration.ofHours(maxAgeHours)));
        if (!fresh) {
            throw new IllegalStateException("Kết quả kiểm tra xe đã quá hạn (" + maxAgeHours
                    + " giờ). Vui lòng kiểm tra lại xe trước khi bàn giao.");
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên"));

        handover.setStaff(staff);
        handover.setInspection(latestInsp);
        handover.setStatus(HandoverStatus.READY_FOR_HANDOVER);
        handover.setStaffPreparedAt(Instant.now());

        VehicleHandover saved = handoverRepository.save(handover);
        return VehicleHandoverResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleHandoverResponse confirmStaffHandover(UUID handoverId, UUID staffId) {
        VehicleHandover handover = handoverRepository.findById(handoverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bàn giao xe: " + handoverId));

        if (handover.getStatus() == HandoverStatus.HANDED_OVER ||
                handover.getStatus() == HandoverStatus.OWNER_CONFIRMED ||
                handover.getStatus() == HandoverStatus.COMPLETED) {
            return VehicleHandoverResponse.fromEntity(handover);
        }

        if (handover.getStatus() != HandoverStatus.READY_FOR_HANDOVER) {
            throw new IllegalStateException("Xe chưa được xác nhận sẵn sàng bàn giao");
        }

        // Section 5: Strict validation of recipient and booking binding
        Booking booking = handover.getBooking();
        if (booking == null) {
            throw new IllegalStateException("Hồ sơ bàn giao không gắn liền với lịch đặt hợp lệ");
        }

        Instant now = Instant.now();
        if (booking.isExpired() || booking.getEndTime().isBefore(now) || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Lịch đặt xe đã hết thời gian (EXPIRED), không thể bàn giao xe");
        }

        Instant prepWindowStart = booking.getStartTime().minus(Duration.ofMinutes(PREPARATION_WINDOW_MINUTES));
        if (now.isBefore(prepWindowStart.minusSeconds(30))) {
            throw new IllegalStateException("Chưa đến thời gian bàn giao xe (bắt đầu trước 2 giờ so với lịch đặt)");
        }

        if (!booking.getId().equals(handover.getBooking().getId())
                || !booking.getUser().getId().equals(handover.getCoOwner().getId())
                || !booking.getVehicle().getId().equals(handover.getVehicle().getId())) {
            throw new IllegalStateException("Dữ liệu người nhận hoặc xe không đồng nhất với lịch đặt");
        }

        // Do not allow CO_OWNER to confirm their own STAFF handover
        if (booking.getUser() != null && booking.getUser().getId().equals(staffId)) {
            throw new AccessDeniedException("Chủ xe không được tự xác nhận bàn giao cho lịch đặt của chính mình");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Lịch đặt đã bị hủy, không thể bàn giao xe");
        }

        // Section 5: Strict physical custody check across entire vehicle
        Optional<VehicleHandover> custodyOpt = getActiveCustodyHandover(handover.getVehicle().getId(),
                handover.getId());
        if (custodyOpt.isPresent()) {
            VehicleHandover custodian = custodyOpt.get();
            String custodianName = custodian.getCoOwner() != null ? custodian.getCoOwner().getFullName()
                    : "thành viên khác";
            throw new IllegalStateException("Phương tiện hiện đang trong sự quản lý của " + custodianName
                    + ". Chưa thể bàn giao cho đến khi xe được trả và xác minh.");
        }

        if (handover.getVehicle() != null && handover.getVehicle().getStatus() == VehicleStatus.IN_USE) {
            throw new IllegalStateException(
                    "Phương tiện hiện đang trong sự quản lý của thành viên khác. Chưa thể bàn giao cho đến khi xe được trả và xác minh.");
        }
        if (handover.getVehicle() != null && handover.getVehicle().getStatus() == VehicleStatus.CHARGING) {
            throw new IllegalStateException("Xe đang trong quá trình sạc pin, vui lòng ngắt sạc trước khi bàn giao xe");
        }

        // Strict technical validation of inspection state
        VehicleInspection latestInsp = handover.getInspection();
        if (latestInsp == null && handover.getVehicle() != null) {
            latestInsp = findLatestEligibleInspectionForHandover(handover.getVehicle().getId(), handover.getId())
                    .orElse(null);
            if (latestInsp != null) {
                handover.setInspection(latestInsp);
            }
        }
        if (latestInsp == null) {
            throw new IllegalStateException(
                    "Xe chưa có kết quả kiểm tra hợp lệ để bàn giao. Vui lòng thực hiện kiểm tra xe trước.");
        }
        if (latestInsp.getOverallResult() == InspectionOverallResult.FAIL) {
            throw new IllegalStateException("Kết quả kiểm tra xe KHÔNG ĐẠT (FAIL). Không thể bàn giao xe.");
        }
        Set<String> coveredReqParts = latestInsp.getItems() != null ? latestInsp.getItems().stream()
                .map(VehicleInspectionItem::getVehiclePartCode)
                .map(VehicleInspectionService::normalizeCanonicalPartCode)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()) : Collections.emptySet();
        long reqCount = REQUIRED_CHECKPOINTS.stream().filter(coveredReqParts::contains).count();
        if (reqCount < REQUIRED_CHECKPOINTS.size()) {
            throw new IllegalStateException(
                    "Chưa hoàn tất kiểm tra đủ " + REQUIRED_CHECKPOINTS.size() + " bộ phận bắt buộc (Mới đạt "
                            + reqCount + "/" + REQUIRED_CHECKPOINTS.size() + " bộ phận). Không thể bàn giao xe.");
        }
        boolean fresh = latestInsp.getCompletedAt() != null &&
                latestInsp.getCompletedAt().isAfter(Instant.now().minus(Duration.ofHours(maxAgeHours)));
        if (!fresh) {
            throw new IllegalStateException("Kết quả kiểm tra xe đã quá hạn (" + maxAgeHours
                    + " giờ). Vui lòng kiểm tra lại xe trước khi bàn giao.");
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên"));

        handover.setStaff(staff);
        handover.setStatus(HandoverStatus.HANDED_OVER);
        handover.setStaffHandedOverAt(Instant.now());

        // Atomically set vehicle operational status to RESERVED to lock custody
        // system-wide without prematurely marking it IN_USE
        if (handover.getVehicle() != null && vehicleRepository != null) {
            Vehicle managedVehicle = vehicleRepository.findById(handover.getVehicle().getId())
                    .orElse(handover.getVehicle());
            managedVehicle.setStatus(VehicleStatus.RESERVED);
            vehicleRepository.save(managedVehicle);
        }

        VehicleHandover saved = handoverRepository.save(handover);

        if (notificationService != null) {
            try {
                notificationService.notifyHandoverCompleted(saved);
            } catch (Exception ex) {
                // Non-blocking notification dispatch
            }
        }

        return VehicleHandoverResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleHandoverResponse acknowledgeCondition(UUID handoverId, UUID coOwnerId) {
        VehicleHandover handover = handoverRepository.findById(handoverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bàn giao xe: " + handoverId));

        if (handover.getStatus() != HandoverStatus.HANDED_OVER) {
            throw new IllegalStateException("Xe chưa được nhân viên bàn giao, chưa thể xác nhận tình trạng xe");
        }

        Booking booking = handover.getBooking();
        if (booking == null || !booking.getUser().getId().equals(coOwnerId)
                || !handover.getCoOwner().getId().equals(coOwnerId)) {
            throw new AccessDeniedException("Chỉ chủ xe của lịch đặt mới có quyền xác nhận xem tình trạng xe");
        }

        if (booking.isExpired() || booking.getEndTime().isBefore(Instant.now())
                || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Lịch đặt xe đã hết thời gian (EXPIRED), không thể xác nhận tình trạng xe");
        }

        if (handover.getOwnerConditionAcknowledgedAt() == null) {
            handover.setOwnerConditionAcknowledgedAt(Instant.now());
            handover = handoverRepository.save(handover);
        }
        return VehicleHandoverResponse.fromEntity(handover);
    }

    @Transactional
    public VehicleHandoverResponse confirmOwnerReceipt(UUID handoverId, UUID coOwnerId) {
        VehicleHandover handover = handoverRepository.findById(handoverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bàn giao xe: " + handoverId));

        // Idempotent safety: if already completed, return existing
        if (handover.getStatus() == HandoverStatus.COMPLETED
                || handover.getStatus() == HandoverStatus.OWNER_CONFIRMED) {
            return VehicleHandoverResponse.fromEntity(handover);
        }

        if (handover.getStatus() != HandoverStatus.HANDED_OVER) {
            throw new IllegalStateException("Nhân viên chưa bàn giao xe hoặc xe chưa sẵn sàng");
        }

        // Section 5 & 8: Verify recipient identity strictly matches booking owner
        Booking booking = handover.getBooking();
        if (booking == null || !booking.getUser().getId().equals(coOwnerId)
                || !handover.getCoOwner().getId().equals(coOwnerId)) {
            throw new AccessDeniedException("Chỉ chủ xe của lịch đặt mới có quyền xác nhận nhận xe");
        }

        if (booking.isExpired() || booking.getEndTime().isBefore(Instant.now())
                || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Lịch đặt xe đã hết thời gian (EXPIRED), không thể xác nhận nhận xe");
        }

        // Section 19: Verify recipient is active member of co-ownership group for this
        // vehicle
        if (coOwnershipService != null) {
            if (!coOwnershipService.isUserActiveMemberForVehicle(coOwnerId, handover.getVehicle().getId())) {
                throw new AccessDeniedException(
                        "Người nhận xe không còn là thành viên hoạt động của nhóm đồng sở hữu xe này");
            }
        }

        // Section 8: STAFF handover exists
        if (handover.getStaff() == null || handover.getStaffHandedOverAt() == null) {
            throw new IllegalStateException("Hồ sơ chưa có xác nhận bàn giao của nhân viên kỹ thuật");
        }

        // Section 8: Vehicle matches booking
        if (!handover.getVehicle().getId().equals(booking.getVehicle().getId())) {
            throw new IllegalStateException("Phương tiện bàn giao không khớp với phương tiện đã đặt");
        }

        // Section 7 & 8: Owner must have acknowledged vehicle condition
        if (handover.getOwnerConditionAcknowledgedAt() == null) {
            throw new IllegalStateException("Chủ xe cần xác nhận đã xem và đồng ý với tình trạng xe trước khi nhận xe");
        }

        handover.setStatus(HandoverStatus.OWNER_CONFIRMED);
        handover.setOwnerReceivedAt(Instant.now());

        VehicleHandover saved = handoverRepository.save(handover);
        return VehicleHandoverResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleHandoverResponse completeHandover(UUID handoverId) {
        VehicleHandover handover = handoverRepository.findById(handoverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bàn giao xe: " + handoverId));

        if (handover.getStatus() == HandoverStatus.COMPLETED) {
            return VehicleHandoverResponse.fromEntity(handover);
        }

        if (handover.getStatus() != HandoverStatus.OWNER_CONFIRMED
                && handover.getStatus() != HandoverStatus.HANDED_OVER) {
            throw new IllegalStateException("Không thể hoàn tất bàn giao từ trạng thái hiện tại");
        }

        handover.setStatus(HandoverStatus.COMPLETED);
        VehicleHandover saved = handoverRepository.save(handover);
        return VehicleHandoverResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleHandoverResponse recoverVehicle(UUID handoverId, UUID staffId, String recoveryNote) {
        VehicleHandover handover = handoverRepository.findById(handoverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bàn giao xe: " + handoverId));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin nhân viên"));

        handover.setStatus(HandoverStatus.COMPLETED);
        VehicleHandover saved = handoverRepository.save(handover);

        if (handover.getVehicle() != null && vehicleRepository != null) {
            Vehicle vehicle = vehicleRepository.findById(handover.getVehicle().getId()).orElse(handover.getVehicle());
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            vehicleRepository.save(vehicle);
        }

        return VehicleHandoverResponse.fromEntity(saved);
    }
}
