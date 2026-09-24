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
import com.evshare.handover.entity.VehicleInspection;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.handover.repository.VehicleInspectionRepository;
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
            List<VehicleHandover> handovers = handoverRepository.findActiveByCoOwnerAndVehicle(currentUserId, vehicleId);
            return handovers.stream().map(VehicleHandoverResponse::fromEntity).collect(Collectors.toList());
        }

        // For STAFF / ADMIN:
        // 1. Fetch persisted active handovers (never mutate on GET)
        List<VehicleHandover> persistedHandovers = handoverRepository.findActiveByVehicleId(vehicleId);
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
    public VehicleHandoverEligibilityResponse getHandoverEligibility(UUID vehicleId, UUID currentUserId, Role currentUserRole) {
        VehicleHandoverEligibilityResponse resp = new VehicleHandoverEligibilityResponse();
        resp.setVehicleId(vehicleId);
        resp.setVehicleCode("EV01");

        // 1. Resolve vehicle
        Vehicle vehicle = vehicleRepository != null ? vehicleRepository.findById(vehicleId).orElse(null) : null;
        if (vehicle != null) {
            resp.setVehicleName(vehicle.getName());
            resp.setVehicleCode("EV01");
        }

        // 2. Check VEHICLE_IN_USE
        boolean isVehicleInUse = (vehicle != null && vehicle.getStatus() == VehicleStatus.IN_USE) ||
                (tripRepository != null && tripRepository.existsByVehicleIdAndStatus(vehicleId, TripStatus.ACTIVE));
        if (isVehicleInUse) {
            resp.setReason(HandoverEligibilityReason.VEHICLE_IN_USE);
            resp.setMessage("XE ĐANG ĐƯỢC SỬ DỤNG");
            resp.setEligibleForInspection(false);
            return resp;
        }

        // 3. Check active persisted handover (already in progress or completed)
        List<VehicleHandover> persistedHandovers;
        if (currentUserRole == Role.CO_OWNER && currentUserId != null) {
            persistedHandovers = handoverRepository.findActiveByCoOwnerAndVehicle(currentUserId, vehicleId);
            if (persistedHandovers.isEmpty()) {
                persistedHandovers = handoverRepository.findActiveByVehicleId(vehicleId).stream()
                        .filter(ph -> (ph.getCoOwner() != null && currentUserId.equals(ph.getCoOwner().getId())) ||
                                      (ph.getBooking() != null && ph.getBooking().getUser() != null && currentUserId.equals(ph.getBooking().getUser().getId())))
                        .collect(Collectors.toList());
            }
        } else {
            persistedHandovers = handoverRepository.findActiveByVehicleId(vehicleId);
        }

        if (!persistedHandovers.isEmpty()) {
            VehicleHandover h = persistedHandovers.get(0);
            resp.setHandoverId(h.getId());
            resp.setHandoverStatus(h.getStatus() != null ? h.getStatus().name() : null);
            resp.setHandover(VehicleHandoverResponse.fromEntity(h));

            if (h.getBooking() != null) {
                resp.setBookingId(h.getBooking().getId());
                resp.setBookingStartTime(h.getBooking().getStartTime());
                resp.setBookingEndTime(h.getBooking().getEndTime());
                resp.setBookingPurpose(h.getBooking().getPurpose());
                if (h.getBooking().getUser() != null) {
                    resp.setRecipientName(h.getBooking().getUser().getFullName());
                    resp.setRecipientEmail(h.getBooking().getUser().getEmail());
                }
            }
            if (h.getCoOwner() != null && resp.getRecipientName() == null) {
                resp.setRecipientName(h.getCoOwner().getFullName());
                resp.setRecipientEmail(h.getCoOwner().getEmail());
            }

            if (h.getStatus() == HandoverStatus.HANDED_OVER ||
                h.getStatus() == HandoverStatus.OWNER_CONFIRMED ||
                h.getStatus() == HandoverStatus.COMPLETED) {
                resp.setReason(HandoverEligibilityReason.HANDED_OVER);
                resp.setMessage("XE ĐÃ ĐƯỢC BÀN GIAO");
                resp.setEligibleForInspection(false);
                return resp;
            }

            if (h.getBooking() != null && (h.getBooking().isExpired() || Instant.now().isAfter(h.getBooking().getEndTime()))) {
                resp.setReason(HandoverEligibilityReason.BOOKING_EXPIRED);
                resp.setMessage("LỊCH ĐẶT ĐÃ HẾT HIỆU LỰC");
                resp.setEligibleForInspection(false);
                return resp;
            }

            resp.setReason(HandoverEligibilityReason.READY_FOR_PREPARATION);
            resp.setMessage("SẴN SÀNG CHUẨN BỊ BÀN GIAO XE");
            resp.setEligibleForInspection(true);
            return resp;
        }

        // 4. No active persisted handover -> Evaluate Bookings
        List<Booking> allBookings = bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicleId);
        if (currentUserRole == Role.CO_OWNER && currentUserId != null) {
            List<Booking> myBookings = allBookings.stream()
                    .filter(b -> b.getUser() != null && currentUserId.equals(b.getUser().getId()))
                    .collect(Collectors.toList());
            if (!myBookings.isEmpty()) {
                allBookings = myBookings;
            }
        }
        if (allBookings.isEmpty()) {
            resp.setReason(HandoverEligibilityReason.NO_BOOKING);
            resp.setMessage("KHÔNG CÓ LỊCH BÀN GIAO");
            resp.setEligibleForInspection(false);
            return resp;
        }

        List<Booking> nonCancelledBookings = allBookings.stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .collect(Collectors.toList());

        if (nonCancelledBookings.isEmpty()) {
            resp.setReason(HandoverEligibilityReason.NO_BOOKING);
            resp.setMessage("KHÔNG CÓ LỊCH BÀN GIAO");
            resp.setEligibleForInspection(false);
            return resp;
        }

        Instant now = Instant.now();
        List<Booking> futureOrActiveBookings = nonCancelledBookings.stream()
                .filter(b -> b.getStatus() != BookingStatus.EXPIRED && b.getEndTime().isAfter(now) && !b.isExpired())
                .collect(Collectors.toList());

        if (futureOrActiveBookings.isEmpty()) {
            Booking lastBooking = nonCancelledBookings.get(nonCancelledBookings.size() - 1);
            resp.setBookingId(lastBooking.getId());
            resp.setBookingStartTime(lastBooking.getStartTime());
            resp.setBookingEndTime(lastBooking.getEndTime());
            resp.setBookingPurpose(lastBooking.getPurpose());
            if (lastBooking.getUser() != null) {
                resp.setRecipientName(lastBooking.getUser().getFullName());
                resp.setRecipientEmail(lastBooking.getUser().getEmail());
            }
            resp.setReason(HandoverEligibilityReason.BOOKING_EXPIRED);
            resp.setMessage("LỊCH ĐẶT ĐÃ HẾT HIỆU LỰC");
            resp.setEligibleForInspection(false);
            return resp;
        }

        // 5. Next valid booking
        Booking target = futureOrActiveBookings.get(0);
        resp.setBookingId(target.getId());
        resp.setBookingStartTime(target.getStartTime());
        resp.setBookingEndTime(target.getEndTime());
        resp.setBookingPurpose(target.getPurpose());
        if (target.getUser() != null) {
            resp.setRecipientName(target.getUser().getFullName());
            resp.setRecipientEmail(target.getUser().getEmail());
        }

        Instant prepWindowStart = target.getStartTime().minus(Duration.ofMinutes(PREPARATION_WINDOW_MINUTES));
        resp.setPreparationWindowStartTime(prepWindowStart);

        if (now.isBefore(prepWindowStart.minusSeconds(30))) {
            long secondsUntil = Duration.between(now, prepWindowStart).getSeconds();
            resp.setSecondsUntilPreparation(Math.max(0, secondsUntil));
            resp.setReason(HandoverEligibilityReason.TOO_EARLY);
            resp.setMessage("CHƯA ĐẾN THỜI GIAN CHUẨN BỊ XE");
            resp.setEligibleForInspection(false);
            return resp;
        }

        // Within preparation window up to end time
        resp.setReason(HandoverEligibilityReason.READY_FOR_PREPARATION);
        resp.setMessage("SẴN SÀNG CHUẨN BỊ BÀN GIAO XE");
        resp.setEligibleForInspection(true);

        VehicleHandover transientCandidate = new VehicleHandover(
                null,
                target,
                target.getVehicle() != null ? target.getVehicle() : vehicle,
                null,
                target.getUser(),
                HandoverStatus.PENDING_PREPARATION
        );
        resp.setHandover(VehicleHandoverResponse.fromEntity(transientCandidate));

        return resp;
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

    @Transactional
    public VehicleInspectionResponse recordInspection(UUID handoverId, VehicleInspectionRequest request, UUID staffId) {
        VehicleHandover handover = handoverRepository.findById(handoverId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bàn giao xe: " + handoverId));

        if (handover.getStatus() == HandoverStatus.READY_FOR_HANDOVER ||
            handover.getStatus() == HandoverStatus.HANDED_OVER ||
            handover.getStatus() == HandoverStatus.OWNER_CONFIRMED ||
            handover.getStatus() == HandoverStatus.COMPLETED) {
            throw new DuplicateResourceException("Hồ sơ kiểm tra đã khóa, không thể chỉnh sửa khi xe đã sẵn sàng hoặc đã bàn giao");
        }
        if (handover.getStatus() == HandoverStatus.CANCELLED) {
            throw new IllegalStateException("Hồ sơ bàn giao đã bị hủy");
        }

        Booking booking = handover.getBooking();
        if (booking != null && (booking.isExpired() || booking.getEndTime().isBefore(Instant.now()) || booking.getStatus() == BookingStatus.EXPIRED)) {
            throw new IllegalStateException("Lịch đặt xe đã hết thời gian (EXPIRED), không thể thực hiện kiểm tra xe");
        }

        String partCode = request.getVehiclePartCode().trim().toUpperCase();
        if (!REQUIRED_CHECKPOINTS.contains(partCode)) {
            throw new IllegalArgumentException("Mã bộ phận kiểm tra không hợp lệ: " + partCode);
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên"));

        handover.setStaff(staff);
        if (handover.getStatus() == HandoverStatus.PENDING_PREPARATION) {
            handover.setStatus(HandoverStatus.INSPECTION_IN_PROGRESS);
        }

        VehicleInspection inspection = inspectionRepository.findByHandoverIdAndVehiclePartCode(handoverId, partCode)
                .orElseGet(() -> {
                    VehicleInspection insp = new VehicleInspection();
                    insp.setId(UUID.randomUUID());
                    insp.setHandover(handover);
                    insp.setVehiclePartCode(partCode);
                    return insp;
                });

        inspection.setConditionStatus(request.getConditionStatus());
        inspection.setNote(request.getNote());
        inspection.setInspectedBy(staff);
        inspection.setInspectedAt(Instant.now());

        VehicleInspection saved = inspectionRepository.save(inspection);

        if (!handover.getInspections().contains(saved)) {
            handover.getInspections().add(saved);
        }
        handoverRepository.save(handover);

        return VehicleInspectionResponse.fromEntity(saved);
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

        if (handover.getStatus() != HandoverStatus.INSPECTION_IN_PROGRESS) {
            throw new IllegalStateException("Chỉ có thể chuyển sang sẵn sàng từ trạng thái đang kiểm tra xe");
        }

        Booking booking = handover.getBooking();
        if (booking == null || booking.getStatus() != BookingStatus.CONFIRMED || booking.isExpired() || booking.getEndTime().isBefore(Instant.now()) || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Lịch đặt xe đã hết thời gian (EXPIRED) hoặc không hợp lệ, không thể xác nhận sẵn sàng");
        }

        List<VehicleInspection> inspections = inspectionRepository.findByHandoverIdOrderByInspectedAtAsc(handoverId);
        Set<String> inspectedParts = new HashSet<>();
        for (VehicleInspection inspection : inspections) {
            inspectedParts.add(inspection.getVehiclePartCode().toUpperCase());
        }

        if (!inspectedParts.containsAll(REQUIRED_CHECKPOINTS)) {
            throw new IllegalArgumentException("Chưa hoàn thành kiểm tra tất cả " + REQUIRED_CHECKPOINTS.size() + " bộ phận bắt buộc trước khi bàn giao");
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên"));

        handover.setStaff(staff);
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
