package com.evshare.handover.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.handover.dto.VehicleHandoverResponse;
import com.evshare.handover.dto.VehicleInspectionRequest;
import com.evshare.handover.dto.VehicleInspectionResponse;
import com.evshare.handover.entity.HandoverStatus;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.inspection.entity.InspectionOverallResult;
import com.evshare.inspection.entity.VehicleInspection;
import com.evshare.inspection.repository.VehicleInspectionRepository;
import com.evshare.handover.dto.HandoverEligibilityReason;
import com.evshare.handover.dto.VehicleHandoverEligibilityResponse;
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
            "CHARGING_PORT"
    );

    private final VehicleHandoverRepository handoverRepository;
    private final VehicleInspectionRepository inspectionRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final com.evshare.ownership.service.CoOwnershipService coOwnershipService;
    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;

    public VehicleHandoverService(
            VehicleHandoverRepository handoverRepository,
            VehicleInspectionRepository inspectionRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository
    ) {
        this(handoverRepository, inspectionRepository, bookingRepository, userRepository, null, null, null);
    }

    public VehicleHandoverService(
            VehicleHandoverRepository handoverRepository,
            VehicleInspectionRepository inspectionRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository,
            com.evshare.ownership.service.CoOwnershipService coOwnershipService
    ) {
        this(handoverRepository, inspectionRepository, bookingRepository, userRepository, coOwnershipService, null, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public VehicleHandoverService(
            VehicleHandoverRepository handoverRepository,
            VehicleInspectionRepository inspectionRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository,
            com.evshare.ownership.service.CoOwnershipService coOwnershipService,
            VehicleRepository vehicleRepository,
            TripRepository tripRepository
    ) {
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

        VehicleHandover handover = handoverRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có hồ sơ bàn giao cho lịch đặt xe này"));

        return VehicleHandoverResponse.fromEntity(handover);
    }

    @Transactional(readOnly = true)
    public List<VehicleHandoverResponse> getActiveHandoversForVehicle(UUID vehicleId, UUID currentUserId, Role currentUserRole) {
        if (currentUserRole == Role.CO_OWNER) {
            List<VehicleHandover> handovers = new ArrayList<>(handoverRepository.findActiveByCoOwnerAndVehicle(currentUserId, vehicleId));
            if (handovers.isEmpty()) {
                // Include confirmed/completed handover for current non-expired booking so owner doesn't lose receipt status
                // but exclude if booking or trip is already completed (historical)
                List<Booking> userBookings = bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicleId).stream()
                        .filter(b -> b.getUser() != null && currentUserId.equals(b.getUser().getId()) && !b.isExpired() && b.getEndTime().isAfter(Instant.now()))
                        .filter(b -> b.getStatus() != BookingStatus.COMPLETED && b.getStatus() != BookingStatus.CANCELLED)
                        .filter(b -> tripRepository == null || !tripRepository                                              .existsByBooking_IdAndStatus(b.getId(), TripStatus.COMPLETED))
                        .collect(Collectors.toList());
                for (Booking b : userBookings) {
                    handoverRepository.findByBookingId(b.getId()).ifPresent(h -> {
                        if (h.getStatus() == HandoverStatus.COMPLETED || h.getStatus() == HandoverStatus.OWNER_CONFIRMED) {
                            handovers.add(h);
                        }
                    });
                }
            }
            List<VehicleHandover> activeOnly = handovers.stream()
                    .filter(h -> h.getBooking() == null || (h.getBooking().getStatus() != BookingStatus.COMPLETED && (tripRepository == null || !tripRepository.existsByBooking_IdAndStatus(h.getBooking().getId(), TripStatus.COMPLETED))))
                    .collect(Collectors.toList());
            return activeOnly.stream().map(VehicleHandoverResponse::fromEntity).collect(Collectors.toList());
        }

        // For STAFF / ADMIN:
        // 1. Fetch persisted active handovers (never mutate on GET)
        List<VehicleHandover> persistedHandovers = handoverRepository.findActiveByVehicleId(vehicleId).stream()
                .filter(h -> h.getBooking() == null || (h.getBooking().getStatus() != BookingStatus.COMPLETED && (tripRepository == null || !tripRepository.existsByBooking_IdAndStatus(h.getBooking().getId(), TripStatus.COMPLETED))))
                .collect(Collectors.toList());
        List<VehicleHandoverResponse> responses = new ArrayList<>();
        for (VehicleHandover h : persistedHandovers) {
            VehicleHandoverResponse resp = VehicleHandoverResponse.fromEntity(h);
            if (h.getStatus() == HandoverStatus.HANDED_OVER ||
                h.getStatus() == HandoverStatus.OWNER_CONFIRMED ||
                h.getStatus() == HandoverStatus.COMPLETED) {
                resp.setEligibilityReason(HandoverEligibilityReason.HANDED_OVER);
                resp.setEligibilityMessage("XE ĐÃ ĐƯỢC BÀN GIAO");
            } else if (resp.isExpired()) {
                resp.setEligibilityReason(HandoverEligibilityReason.BOOKING_EXPIRED);
                resp.setEligibilityMessage("LỊCH ĐẶT ĐÃ HẾT HIỆU LỰC");
            } else {
                resp.setEligibilityReason(HandoverEligibilityReason.READY_FOR_PREPARATION);
                resp.setEligibilityMessage("SẴN SÀNG CHUẨN BỊ BÀN GIAO XE");
            }
            responses.add(resp);
        }

        // 2. Fetch confirmed upcoming bookings that do not yet have a handover record in DB
        // Expose them as transient candidate DTOs so STAFF can see the recipient and click [BẮT ĐẦU KIỂM TRA]
        // CRITICAL: NEVER call handoverRepository.save() on a GET request!
        Set<UUID> existingBookingIds = persistedHandovers.stream()
                .map(h -> h.getBooking().getId())
                .collect(Collectors.toSet());

        List<Booking> confirmedBookings = bookingRepository.findByVehicleIdAndStatusInOrderByStartTimeAsc(
                vehicleId,
                List.of(BookingStatus.CONFIRMED)
        );

        Instant cutoff = Instant.now().minusSeconds(7200);
        Instant now = Instant.now();
        for (Booking booking : confirmedBookings) {
            if (booking.getEndTime().isAfter(cutoff) && !existingBookingIds.contains(booking.getId())) {
                if (handoverRepository.findByBookingId(booking.getId()).isEmpty()) {
                    boolean isPast = booking.isExpired() || booking.getEndTime().isBefore(now);
                    VehicleHandover transientCandidate = new VehicleHandover(
                            null,
                            booking,
                            booking.getVehicle(),
                            null,
                            booking.getUser(),
                            HandoverStatus.PENDING_PREPARATION
                    );
                    VehicleHandoverResponse candidateResp = VehicleHandoverResponse.fromEntity(transientCandidate);
                    candidateResp.setId(null); // CRITICAL: Transient candidate does not have a persisted handover record in DB
                    if (isPast) {
                        candidateResp.setExpired(true);
                        candidateResp.setBookingStatus("EXPIRED");
                        candidateResp.setEligibilityReason(HandoverEligibilityReason.BOOKING_EXPIRED);
                        candidateResp.setEligibilityMessage("LỊCH ĐẶT ĐÃ HẾT HIỆU LỰC");
                    } else {
                        Instant prepWindowStart = booking.getStartTime().minus(Duration.ofMinutes(PREPARATION_WINDOW_MINUTES));
                        if (now.isBefore(prepWindowStart.minusSeconds(30))) {
                            candidateResp.setEligibilityReason(HandoverEligibilityReason.TOO_EARLY);
                            candidateResp.setEligibilityMessage("CHƯA ĐẾN THỜI GIAN CHUẨN BỊ XE");
                        } else {
                            candidateResp.setEligibilityReason(HandoverEligibilityReason.READY_FOR_PREPARATION);
                            candidateResp.setEligibilityMessage("SẴN SÀNG CHUẨN BỊ BÀN GIAO XE");
                        }
                    }
                    responses.add(candidateResp);
                }
            }
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public Optional<VehicleHandoverResponse> getActiveHandoverForVehicle(UUID vehicleId, UUID currentUserId, Role currentUserRole) {
        List<VehicleHandoverResponse> handovers = getActiveHandoversForVehicle(vehicleId, currentUserId, currentUserRole);
        return handovers.stream().findFirst();
    }

    @Transactional(readOnly = true)
    public List<VehicleHandoverResponse> getHandoverHistory(UUID vehicleId) {
        return handoverRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId).stream()
                .map(VehicleHandoverResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Optional<VehicleInspection> findLatestEligibleInspectionForHandover(UUID vehicleId, UUID currentHandoverId) {
        if (inspectionRepository == null) {
            return Optional.empty();
        }
        List<VehicleInspection> completed = inspectionRepository.findCompletedByVehicleIdAndTypeOrderByCompletedAtDesc(
                vehicleId,
                com.evshare.inspection.entity.InspectionType.PRE_HANDOVER
        );
        if (completed == null || completed.isEmpty()) {
            completed = inspectionRepository.findCompletedByVehicleIdOrderByCompletedAtDesc(vehicleId);
        }
        if (completed == null || completed.isEmpty()) {
            return Optional.empty();
        }

        java.util.Set<UUID> consumedInspectionIds = handoverRepository.findUsedInspectionIds(vehicleId, currentHandoverId);

        for (VehicleInspection insp : completed) {
            if (insp.getInspectionType() != null && insp.getInspectionType() != com.evshare.inspection.entity.InspectionType.PRE_HANDOVER) {
                continue;
            }
            if (consumedInspectionIds == null || !consumedInspectionIds.contains(insp.getId())) {
                return Optional.of(insp);
            }
        }
        return Optional.empty();
    }

    @Transactional(readOnly = true)
    public VehicleHandoverEligibilityResponse getHandoverEligibilityByHandoverId(UUID handoverId, UUID currentUserId, Role currentUserRole) {
        VehicleHandover handover = handoverRepository.findById(handoverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bàn giao xe: " + handoverId));
        VehicleHandoverEligibilityResponse resp = new VehicleHandoverEligibilityResponse();
        resp.setVehicleId(handover.getVehicle().getId());
        resp.setVehicleName(handover.getVehicle().getName());
        resp.setVehicleCode(handover.getVehicle().getName() != null ? handover.getVehicle().getName() : "EV01");
        return populateEligibilityForBooking(resp, handover.getBooking(), handover.getVehicle().getId());
    }

    @Transactional(readOnly = true)
    public VehicleHandoverEligibilityResponse getHandoverEligibility(UUID vehicleId, UUID currentUserId, Role currentUserRole) {
        VehicleHandoverEligibilityResponse resp = new VehicleHandoverEligibilityResponse();
        resp.setVehicleId(vehicleId);
        resp.setVehicleCode("EV01");

        // 1. Resolve vehicle
        Vehicle vehicle = vehicleRepository != null ? vehicleRepository.findById(vehicleId).orElse(null) : null;
        if (vehicle != null) {
            resp.setVehicleName(vehicle.getName());
            resp.setVehicleCode(vehicle.getName() != null ? vehicle.getName() : "EV01");
        }

        // 2. Check VEHICLE_MAINTENANCE or VEHICLE_CHARGING or VEHICLE_IN_USE
        if (vehicle != null && vehicle.getStatus() == VehicleStatus.MAINTENANCE) {
            resp.setReason(HandoverEligibilityReason.VEHICLE_MAINTENANCE);
            resp.setMessage("XE ĐANG TRONG QUÁ TRÌNH BẢO DƯỠNG");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(false);
            return resp;
        }

        if (vehicle != null && vehicle.getStatus() == VehicleStatus.CHARGING) {
            resp.setReason(HandoverEligibilityReason.VEHICLE_CHARGING);
            resp.setMessage("XE ĐANG TRONG QUÁ TRÌNH SẠC");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(false);
            return resp;
        }

        boolean isVehicleUnavailable = (vehicle != null && vehicle.getStatus() == VehicleStatus.IN_USE) ||
                (tripRepository != null && tripRepository.existsByVehicleIdAndStatus(vehicleId, TripStatus.ACTIVE));
        if (isVehicleUnavailable) {
            resp.setReason(HandoverEligibilityReason.VEHICLE_IN_USE);
            resp.setMessage("XE ĐANG ĐƯỢC SỬ DỤNG");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(false);
            return resp;
        }

        // 3. Resolve relevant upcoming/active booking for this vehicle
        // ONE BOOKING -> ONE HANDOVER.
        // A booking whose trip/handover is already COMPLETED or CANCELLED is historical and MUST NOT be selected.
        List<Booking> allBookings = bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicleId);
        if (currentUserRole == Role.CO_OWNER && currentUserId != null) {
            allBookings = allBookings.stream()
                    .filter(b -> b.getUser() != null && currentUserId.equals(b.getUser().getId()))
                    .collect(Collectors.toList());
        }

        Instant now = Instant.now();
        List<Booking> candidates = allBookings.stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .filter(b -> b.getStatus() != BookingStatus.EXPIRED)
                .filter(b -> !b.isExpired() && b.getEndTime().isAfter(now))
                .filter(b -> b.getStatus() != BookingStatus.COMPLETED)
                .filter(b -> tripRepository == null || !tripRepository.existsByBooking_IdAndStatus(b.getId(), TripStatus.COMPLETED))
                .filter(b -> {
                    Optional<VehicleHandover> existingH = handoverRepository.findByBookingId(b.getId());
                    if (existingH.isPresent()) {
                        HandoverStatus st = existingH.get().getStatus();
                        return st != HandoverStatus.COMPLETED && st != HandoverStatus.CANCELLED;
                    }
                    return true;
                })
                .collect(Collectors.toList());

        // CASE C: No upcoming or active booking requires handover
        if (candidates.isEmpty()) {
            resp.setReason(HandoverEligibilityReason.NO_BOOKING);
            resp.setMessage("Hiện không có lượt đặt xe nào cần bàn giao.");
            resp.setBookingId(null);
            resp.setHandoverId(null);
            resp.setHandoverStatus(null);
            resp.setHandover(null);
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(false);
            return resp;
        }

        // 4. Nearest upcoming or active booking requiring handover
        Booking target = candidates.get(0);
        return populateEligibilityForBooking(resp, target, vehicleId);
    }

    private VehicleHandoverEligibilityResponse populateEligibilityForBooking(
            VehicleHandoverEligibilityResponse resp,
            Booking target,
            UUID vehicleId
    ) {
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
            resp.setHandoverId(handover.getId());
            resp.setHandoverStatus(handover.getStatus() != null ? handover.getStatus().name() : null);
            resp.setHandover(VehicleHandoverResponse.fromEntity(handover));
        } else {
            // Case A: Handover has not been created yet in DB
            resp.setHandoverId(null);
            resp.setHandoverStatus(null);
            resp.setHandover(null);
        }

        // Authoritative inspection evaluation: resolve matching unconsumed inspection for this vehicle/handover context
        VehicleInspection targetInsp = (handover != null && handover.getInspection() != null)
                ? handover.getInspection()
                : findLatestEligibleInspectionForHandover(vehicleId, handover != null ? handover.getId() : null).orElse(null);

        populateInspectionDetails(resp, targetInsp);

        Instant now = Instant.now();
        Instant prepWindowStart = target.getStartTime().minus(Duration.ofMinutes(PREPARATION_WINDOW_MINUTES));
        resp.setPreparationWindowStartTime(prepWindowStart);

        // Time gate: if too early, preserve inspection result in response but keep handover action strictly disabled
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
            if (handover.getStatus() == HandoverStatus.READY_FOR_HANDOVER) {
                resp.setReason(HandoverEligibilityReason.READY);
                resp.setMessage("XE ĐÃ SẴN SÀNG ĐỂ BÀN GIAO");
                resp.setHandoverAllowed(true);
                resp.setEligibleForInspection(true);
                return resp;
            }

            if (handover.getStatus() == HandoverStatus.HANDED_OVER) {
                resp.setReason(HandoverEligibilityReason.HANDED_OVER);
                resp.setMessage("XE ĐÃ ĐƯỢC BÀN GIAO — ĐANG CHỜ ĐỒNG SỞ HỮU XÁC NHẬN");
                resp.setHandoverAllowed(false);
                resp.setEligibleForInspection(false);
                return resp;
            }

            if (handover.getStatus() == HandoverStatus.OWNER_CONFIRMED) {
                resp.setReason(HandoverEligibilityReason.HANDED_OVER);
                resp.setMessage("ĐỒNG SỞ HỮU ĐÃ NHẬN XE");
                resp.setHandoverAllowed(false);
                resp.setEligibleForInspection(false);
                return resp;
            }
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
            resp.setInspectedPartsCount(insp.getItems() != null ? insp.getItems().size() : 0);
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
            resp.setInspectorName(null);
        }
    }

    private void evaluateInspectionReadiness(VehicleHandoverEligibilityResponse resp) {
        if (!resp.isInspectionAvailable()) {
            boolean hasPersistedHandover = resp.getHandoverId() != null || (resp.getHandover() != null && resp.getHandover().getId() != null);
            if (hasPersistedHandover) {
                resp.setReason(HandoverEligibilityReason.NO_INSPECTION);
                resp.setMessage("Xe chưa có kết quả kiểm tra hợp lệ để bàn giao.");
            } else {
                resp.setReason(HandoverEligibilityReason.READY_FOR_PREPARATION);
                resp.setMessage("Chưa có hồ sơ bàn giao cho lượt đặt xe này.");
            }
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(true);
        } else if (!resp.isInspectionFresh()) {
            resp.setReason(HandoverEligibilityReason.INSPECTION_EXPIRED);
            resp.setMessage("Kết quả kiểm tra xe đã quá hạn (" + maxAgeHours + " giờ). Vui lòng kiểm tra lại xe trước khi bàn giao.");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(true);
        } else if ("FAIL".equalsIgnoreCase(resp.getInspectionResult())) {
            resp.setReason(HandoverEligibilityReason.INSPECTION_FAILED);
            resp.setMessage("Kết quả kiểm tra xe KHÔNG ĐẠT (FAIL). Không thể bàn giao xe.");
            resp.setHandoverAllowed(false);
            resp.setEligibleForInspection(true);
        } else {
            // Authoritative inspection is valid and PASS / PASS_WITH_NOTES
            resp.setReason(HandoverEligibilityReason.READY);
            resp.setMessage("SẴN SÀNG CHUẨN BỊ BÀN GIAO XE");
            resp.setHandoverAllowed(true);
            resp.setEligibleForInspection(true);
        }
    }

    @Transactional
    public VehicleHandoverResponse createHandover(UUID bookingId, UUID staffId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch đặt với mã: " + bookingId));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Lịch đặt xe đã bị hủy, không thể tiến hành bàn giao");
        }

        if (booking.isExpired() || booking.getEndTime().isBefore(Instant.now()) || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Lịch đặt xe đã hết thời gian (EXPIRED), không thể tạo hồ sơ bàn giao");
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
                HandoverStatus.PENDING_PREPARATION
        );

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

        if (booking.isExpired() || booking.getEndTime().isBefore(Instant.now()) || booking.getStatus() == BookingStatus.EXPIRED) {
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
            throw new IllegalStateException("Xe đang trong quá trình sạc pin, vui lòng ngắt sạc trước khi tiến hành bàn giao");
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên"));

        // Check if a handover already exists for this booking (Reuse existing or reject if already handed over)
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
                    HandoverStatus.INSPECTION_IN_PROGRESS
            );
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
        if (booking == null || booking.getStatus() != BookingStatus.CONFIRMED || booking.isExpired() || booking.getEndTime().isBefore(Instant.now()) || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Lịch đặt xe đã hết thời gian (EXPIRED) hoặc không hợp lệ, không thể xác nhận sẵn sàng");
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
            throw new IllegalStateException("Xe chưa có kết quả kiểm tra hợp lệ để bàn giao. Vui lòng thực hiện kiểm tra xe trước.");
        }

        if (latestInsp.getOverallResult() == InspectionOverallResult.FAIL) {
            throw new IllegalStateException("Kết quả kiểm tra xe KHÔNG ĐẠT (FAIL). Không thể bàn giao xe.");
        }

        boolean fresh = latestInsp.getCompletedAt() != null &&
                latestInsp.getCompletedAt().isAfter(Instant.now().minus(Duration.ofHours(maxAgeHours)));
        if (!fresh) {
            throw new IllegalStateException("Kết quả kiểm tra xe đã quá hạn (" + maxAgeHours + " giờ). Vui lòng kiểm tra lại xe trước khi bàn giao.");
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
            throw new DuplicateResourceException("XE ĐÃ ĐƯỢC BÀN GIAO");
        }

        if (handover.getStatus() != HandoverStatus.READY_FOR_HANDOVER) {
            throw new IllegalStateException("Xe chưa được xác nhận sẵn sàng bàn giao");
        }

        // Section 5: Strict validation of recipient and booking binding
        Booking booking = handover.getBooking();
        if (booking == null) {
            throw new IllegalStateException("Hồ sơ bàn giao không gắn liền với lịch đặt hợp lệ");
        }

        if (booking.isExpired() || booking.getEndTime().isBefore(Instant.now()) || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Lịch đặt xe đã hết thời gian (EXPIRED), không thể bàn giao xe");
        }

        if (!booking.getId().equals(handover.getBooking().getId())
                || !booking.getUser().getId().equals(handover.getCoOwner().getId())
                || !booking.getVehicle().getId().equals(handover.getVehicle().getId())) {
            throw new IllegalStateException("Dữ liệu người nhận hoặc xe không đồng nhất với lịch đặt");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Lịch đặt đã bị hủy, không thể bàn giao xe");
        }

        if (handover.getVehicle() != null && handover.getVehicle().getStatus() == VehicleStatus.IN_USE) {
            throw new IllegalStateException("Xe đang được sử dụng trong chuyến đi, không thể bàn giao xe lúc này");
        }
        if (handover.getVehicle() != null && handover.getVehicle().getStatus() == VehicleStatus.CHARGING) {
            throw new IllegalStateException("Xe đang trong quá trình sạc pin, vui lòng ngắt sạc trước khi bàn giao xe");
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên"));

        handover.setStaff(staff);
        handover.setStatus(HandoverStatus.HANDED_OVER);
        handover.setStaffHandedOverAt(Instant.now());

        VehicleHandover saved = handoverRepository.save(handover);
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
        if (booking == null || !booking.getUser().getId().equals(coOwnerId) || !handover.getCoOwner().getId().equals(coOwnerId)) {
            throw new AccessDeniedException("Chỉ chủ xe của lịch đặt mới có quyền xác nhận xem tình trạng xe");
        }

        if (booking.isExpired() || booking.getEndTime().isBefore(Instant.now()) || booking.getStatus() == BookingStatus.EXPIRED) {
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
        if (handover.getStatus() == HandoverStatus.COMPLETED || handover.getStatus() == HandoverStatus.OWNER_CONFIRMED) {
            return VehicleHandoverResponse.fromEntity(handover);
        }

        if (handover.getStatus() != HandoverStatus.HANDED_OVER) {
            throw new IllegalStateException("Nhân viên chưa bàn giao xe hoặc xe chưa sẵn sàng");
        }

        // Section 5 & 8: Verify recipient identity strictly matches booking owner
        Booking booking = handover.getBooking();
        if (booking == null || !booking.getUser().getId().equals(coOwnerId) || !handover.getCoOwner().getId().equals(coOwnerId)) {
            throw new AccessDeniedException("Chỉ chủ xe của lịch đặt mới có quyền xác nhận nhận xe");
        }

        if (booking.isExpired() || booking.getEndTime().isBefore(Instant.now()) || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Lịch đặt xe đã hết thời gian (EXPIRED), không thể xác nhận nhận xe");
        }

        // Section 19: Verify recipient is active member of co-ownership group for this vehicle
        if (coOwnershipService != null) {
            if (!coOwnershipService.isUserActiveMemberForVehicle(coOwnerId, handover.getVehicle().getId())) {
                throw new AccessDeniedException("Người nhận xe không còn là thành viên hoạt động của nhóm đồng sở hữu xe này");
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

        // Automatically complete check-in workflow upon owner receipt confirmation
        handover.setStatus(HandoverStatus.COMPLETED);

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

        if (handover.getStatus() != HandoverStatus.OWNER_CONFIRMED && handover.getStatus() != HandoverStatus.HANDED_OVER) {
            throw new IllegalStateException("Không thể hoàn tất bàn giao từ trạng thái hiện tại");
        }

        handover.setStatus(HandoverStatus.COMPLETED);
        VehicleHandover saved = handoverRepository.save(handover);
        return VehicleHandoverResponse.fromEntity(saved);
    }
}
