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
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VehicleHandoverService {

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

    public VehicleHandoverService(
            VehicleHandoverRepository handoverRepository,
            VehicleInspectionRepository inspectionRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository
    ) {
        this.handoverRepository = handoverRepository;
        this.inspectionRepository = inspectionRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
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
        List<VehicleHandoverResponse> responses = persistedHandovers.stream()
                .map(VehicleHandoverResponse::fromEntity)
                .collect(Collectors.toList());

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
        for (Booking booking : confirmedBookings) {
            if (booking.getEndTime().isAfter(cutoff) && !existingBookingIds.contains(booking.getId())) {
                if (handoverRepository.findByBookingId(booking.getId()).isEmpty()) {
                    VehicleHandover transientCandidate = new VehicleHandover(
                            null,
                            booking,
                            booking.getVehicle(),
                            null,
                            booking.getUser(),
                            HandoverStatus.PENDING_PREPARATION
                    );
                    responses.add(VehicleHandoverResponse.fromEntity(transientCandidate));
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

    @Transactional
    public VehicleHandoverResponse startHandover(UUID bookingId, UUID staffId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch đặt với mã: " + bookingId));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Lịch đặt xe đã bị hủy, không thể tiến hành bàn giao");
        }

        if (booking.getEndTime().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Lịch đặt xe đã kết thúc, không thể bắt đầu bàn giao xe");
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
        if (booking == null || booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Lịch đặt xe phải ở trạng thái đã xác nhận (CONFIRMED)");
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

        if (!booking.getId().equals(handover.getBooking().getId())
                || !booking.getUser().getId().equals(handover.getCoOwner().getId())
                || !booking.getVehicle().getId().equals(handover.getVehicle().getId())) {
            throw new IllegalStateException("Dữ liệu người nhận hoặc xe không đồng nhất với lịch đặt");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Lịch đặt đã bị hủy, không thể bàn giao xe");
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
