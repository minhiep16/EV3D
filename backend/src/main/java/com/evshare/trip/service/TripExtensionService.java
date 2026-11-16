package com.evshare.trip.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.notification.service.NotificationService;
import com.evshare.trip.dto.TripExtensionCheckResponse;
import com.evshare.trip.dto.TripExtensionRequestResponse;
import com.evshare.trip.dto.TripResponse;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripExtensionRequest;
import com.evshare.trip.entity.TripExtensionStatus;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripExtensionRequestRepository;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.vehicle.entity.VehicleStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TripExtensionService {

    private static final Logger log = LoggerFactory.getLogger(TripExtensionService.class);

    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;
    private final TripExtensionRequestRepository extensionRequestRepository;
    private final NotificationService notificationService;

    public TripExtensionService(
            TripRepository tripRepository,
            BookingRepository bookingRepository,
            TripExtensionRequestRepository extensionRequestRepository,
            NotificationService notificationService) {
        this.tripRepository = tripRepository;
        this.bookingRepository = bookingRepository;
        this.extensionRequestRepository = extensionRequestRepository;
        this.notificationService = notificationService;
    }

    /**
     * Check extension eligibility and availability against subsequent bookings and maintenance.
     */
    @Transactional(readOnly = true)
    public TripExtensionCheckResponse checkAvailability(
            UUID tripId, Integer additionalMinutes, UUID currentUserId, Role currentUserRole) {

        if (additionalMinutes == null || additionalMinutes <= 0) {
            return TripExtensionCheckResponse.notEligible("Thời lượng gia hạn không hợp lệ.");
        }

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với mã: " + tripId));

        if (currentUserRole != Role.ADMIN && (trip.getUser() == null || !trip.getUser().getId().equals(currentUserId))) {
            throw new AccessDeniedException("Bạn không có quyền kiểm tra gia hạn chuyến đi này.");
        }

        if (trip.getStatus() != TripStatus.ACTIVE) {
            return TripExtensionCheckResponse.notEligible("Chỉ có thể gia hạn khi chuyến đi đang diễn ra.");
        }

        if (trip.getReturnRequestedAt() != null) {
            return TripExtensionCheckResponse.notEligible("Chuyến đi đã gửi yêu cầu trả xe, không thể gia hạn.");
        }

        Booking booking = trip.getBooking();
        if (booking == null) {
            return TripExtensionCheckResponse.notEligible("Không tìm thấy thông tin lịch đặt tương ứng với chuyến đi.");
        }

        Instant now = Instant.now();
        if (now.isAfter(booking.getEndTime())) {
            return TripExtensionCheckResponse.notEligible("Hạn trả xe ban đầu đã qua. Không thể gia hạn hồi tố.");
        }

        if (trip.getVehicle().getStatus() == VehicleStatus.MAINTENANCE) {
            return TripExtensionCheckResponse.notEligible("Phương tiện đang có lịch bảo dưỡng.");
        }

        Instant currentEndTime = booking.getEndTime();
        Instant proposedEndTime = currentEndTime.plus(Duration.ofMinutes(additionalMinutes));

        // Conflict check against confirmed/pending bookings
        List<Booking> conflicts = bookingRepository.findConflictingBookingsExcluding(
                trip.getVehicle().getId(),
                booking.getId(),
                currentEndTime,
                proposedEndTime,
                List.of(BookingStatus.CONFIRMED, BookingStatus.PENDING)
        );

        if (conflicts.isEmpty()) {
            return TripExtensionCheckResponse.directAvailable(additionalMinutes, currentEndTime, proposedEndTime);
        }

        // Conflict detected: evaluate feasibility for booking negotiation
        Booking firstConflict = conflicts.get(0);

        // Same user consecutive booking: directly eligible to extend
        if (firstConflict.getUser() != null && firstConflict.getUser().getId().equals(currentUserId)) {
            return TripExtensionCheckResponse.directAvailable(additionalMinutes, currentEndTime, proposedEndTime);
        }

        // Check if proposed extension leaves minimum viable remaining duration for affected owner (>= 15 mins)
        Instant minRemainingTime = proposedEndTime.plus(Duration.ofMinutes(15));
        if (firstConflict.getEndTime().isBefore(minRemainingTime)) {
            String ownerName = firstConflict.getUser() != null ? firstConflict.getUser().getFullName() : "đồng sở hữu";
            return TripExtensionCheckResponse.notEligible(
                    "Khung giờ còn lại của thành viên tiếp theo (" + ownerName + ") quá ngắn (< 15 phút), không thể nhường lịch."
            );
        }

        String affectedOwnerName = firstConflict.getUser() != null ? firstConflict.getUser().getFullName() : "Đồng sở hữu";
        return TripExtensionCheckResponse.conflictNegotiable(
                additionalMinutes,
                currentEndTime,
                proposedEndTime,
                firstConflict.getId(),
                firstConflict.getUser() != null ? firstConflict.getUser().getId() : null,
                affectedOwnerName,
                firstConflict.getStartTime(),
                firstConflict.getEndTime(),
                proposedEndTime
        );
    }

    /**
     * Direct extension execution when slot is confirmed free.
     */
    @Transactional
    public TripResponse extendTripDirect(
            UUID tripId, Integer additionalMinutes, Instant explicitEndTime, String reason,
            UUID currentUserId, Role currentUserRole) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với mã: " + tripId));

        if (currentUserRole != Role.ADMIN && (trip.getUser() == null || !trip.getUser().getId().equals(currentUserId))) {
            throw new AccessDeniedException("Bạn không có quyền gia hạn chuyến đi này.");
        }

        if (trip.getStatus() != TripStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ có thể gia hạn khi chuyến đi đang diễn ra.");
        }

        if (trip.getReturnRequestedAt() != null) {
            throw new IllegalStateException("Chuyến đi đã gửi yêu cầu trả xe, không thể gia hạn.");
        }

        Booking booking = trip.getBooking();
        if (booking == null) {
            throw new IllegalStateException("Chuyến đi không liên kết với lịch đặt xe hợp lệ.");
        }

        Instant currentEndTime = booking.getEndTime();
        Instant proposedEndTime;
        int effectiveMinutes;

        if (additionalMinutes != null && additionalMinutes > 0) {
            effectiveMinutes = additionalMinutes;
            proposedEndTime = currentEndTime.plus(Duration.ofMinutes(additionalMinutes));
        } else if (explicitEndTime != null && explicitEndTime.isAfter(currentEndTime)) {
            proposedEndTime = explicitEndTime;
            effectiveMinutes = (int) Duration.between(currentEndTime, explicitEndTime).toMinutes();
        } else {
            throw new IllegalArgumentException("Thời gian gia hạn mới phải sau hạn trả xe hiện tại.");
        }

        Instant now = Instant.now();
        if (now.isAfter(currentEndTime)) {
            throw new IllegalStateException("Hạn trả xe ban đầu đã qua. Không thể gia hạn hồi tố.");
        }

        // Revalidate conflict check within transaction
        List<Booking> conflicts = bookingRepository.findConflictingBookingsExcluding(
                trip.getVehicle().getId(),
                booking.getId(),
                currentEndTime,
                proposedEndTime,
                List.of(BookingStatus.CONFIRMED, BookingStatus.PENDING)
        );

        if (!conflicts.isEmpty()) {
            Booking firstConflict = conflicts.get(0);
            if (firstConflict.getUser() == null || !firstConflict.getUser().getId().equals(currentUserId)) {
                throw new IllegalStateException("Khung giờ gia hạn bị trùng với lịch đặt của thành viên khác. Vui lòng gửi yêu cầu nhường lịch.");
            }
        }

        booking.setEndTime(proposedEndTime);
        bookingRepository.save(booking);

        // Invalidate any pending negotiation requests for this trip
        invalidatePendingRequestsForTrip(tripId);

        // Notify staff
        notificationService.notifyStaffTripExtended(trip, effectiveMinutes, proposedEndTime);

        log.info("Trip {} successfully extended directly by {} mins to {} by user {}",
                tripId, effectiveMinutes, proposedEndTime, currentUserId);

        return TripResponse.fromEntity(trip);
    }

    /**
     * Submit a persistent booking negotiation request to the affected co-owner.
     */
    @Transactional
    public TripExtensionRequestResponse createNegotiationRequest(
            UUID tripId, Integer additionalMinutes, String reason,
            UUID currentUserId, Role currentUserRole) {

        if (additionalMinutes == null || additionalMinutes <= 0) {
            throw new IllegalArgumentException("Thời lượng gia hạn không hợp lệ.");
        }

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với mã: " + tripId));

        if (currentUserRole != Role.ADMIN && (trip.getUser() == null || !trip.getUser().getId().equals(currentUserId))) {
            throw new AccessDeniedException("Bạn không có quyền gửi yêu cầu nhường lịch cho chuyến đi này.");
        }

        if (trip.getStatus() != TripStatus.ACTIVE) {
            throw new IllegalStateException("Chỉ có thể gửi yêu cầu khi chuyến đi đang diễn ra.");
        }

        if (trip.getReturnRequestedAt() != null) {
            throw new IllegalStateException("Chuyến đi đã gửi yêu cầu trả xe.");
        }

        Booking booking = trip.getBooking();
        if (booking == null) {
            throw new IllegalStateException("Không tìm thấy thông tin lịch đặt của chuyến đi.");
        }

        Instant currentEndTime = booking.getEndTime();
        Instant proposedEndTime = currentEndTime.plus(Duration.ofMinutes(additionalMinutes));

        Instant now = Instant.now();
        if (now.isAfter(currentEndTime)) {
            throw new IllegalStateException("Hạn trả xe ban đầu đã qua.");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookingsExcluding(
                trip.getVehicle().getId(),
                booking.getId(),
                currentEndTime,
                proposedEndTime,
                List.of(BookingStatus.CONFIRMED, BookingStatus.PENDING)
        );

        if (conflicts.isEmpty()) {
            throw new IllegalStateException("Khung giờ gia hạn còn trống, bạn có thể gia hạn trực tiếp mà không cần gửi yêu cầu nhường lịch.");
        }

        Booking affectedBooking = conflicts.get(0);
        if (affectedBooking.getUser() == null || affectedBooking.getUser().getId().equals(currentUserId)) {
            throw new IllegalStateException("Lịch đặt tiếp theo thuộc sở hữu của bạn, có thể gia hạn trực tiếp.");
        }

        Instant minRemainingTime = proposedEndTime.plus(Duration.ofMinutes(15));
        if (affectedBooking.getEndTime().isBefore(minRemainingTime)) {
            throw new IllegalStateException("Khung giờ còn lại của thành viên tiếp theo quá ngắn (< 15 phút), không thể nhường lịch.");
        }

        // Cancel previous pending requests for this trip
        invalidatePendingRequestsForTrip(tripId);

        // Response deadline: min of (current booking end time) and (now + 15 mins)
        Instant responseDeadline = currentEndTime.isBefore(now.plus(Duration.ofMinutes(15)))
                ? currentEndTime
                : now.plus(Duration.ofMinutes(15));

        TripExtensionRequest request = new TripExtensionRequest(
                UUID.randomUUID(),
                trip,
                trip.getVehicle(),
                trip.getUser(),
                booking,
                currentEndTime,
                proposedEndTime,
                additionalMinutes,
                affectedBooking,
                affectedBooking.getUser(),
                proposedEndTime,
                reason,
                responseDeadline
        );

        TripExtensionRequest saved = extensionRequestRepository.save(request);

        // Persistent notification to affected co-owner
        notificationService.notifyCoOwnerExtensionRequested(saved);

        log.info("TripExtensionRequest {} created for Trip {} by user {} requesting {} mins from user {}",
                saved.getId(), tripId, currentUserId, additionalMinutes, affectedBooking.getUser().getId());

        TripExtensionRequestResponse res = TripExtensionRequestResponse.fromEntity(saved);
        res.setMessage("Đã gửi yêu cầu nhường lịch đến " + affectedBooking.getUser().getFullName());
        return res;
    }

    /**
     * Affected co-owner accepts the yield request.
     * Atomically extends requester's booking and shifts affected owner's start time.
     */
    @Transactional
    public TripExtensionRequestResponse acceptExtensionRequest(
            UUID requestId, UUID currentUserId, Role currentUserRole) {

        TripExtensionRequest request = extensionRequestRepository.findByIdWithDetails(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu nhường lịch với mã: " + requestId));

        if (currentUserRole != Role.ADMIN && (request.getAffectedOwner() == null || !request.getAffectedOwner().getId().equals(currentUserId))) {
            throw new AccessDeniedException("Bạn không phải là thành viên được yêu cầu nhường lịch.");
        }

        if (request.getStatus() != TripExtensionStatus.PENDING) {
            throw new IllegalStateException("Yêu cầu không còn ở trạng thái chờ phản hồi (Trạng thái hiện tại: " + request.getStatus() + ").");
        }

        Instant now = Instant.now();
        if (now.isAfter(request.getResponseDeadline()) || now.isAfter(request.getCurrentBooking().getEndTime())) {
            request.setStatus(TripExtensionStatus.EXPIRED);
            extensionRequestRepository.save(request);
            throw new IllegalStateException("Yêu cầu nhường lịch đã hết hạn phản hồi.");
        }

        Trip trip = request.getTrip();
        if (trip.getStatus() != TripStatus.ACTIVE || trip.getReturnRequestedAt() != null) {
            request.setStatus(TripExtensionStatus.CANCELLED);
            extensionRequestRepository.save(request);
            throw new IllegalStateException("Chuyến đi của người yêu cầu đã kết thúc hoặc đang yêu cầu trả xe.");
        }

        Booking currentBooking = request.getCurrentBooking();
        Booking affectedBooking = request.getAffectedBooking();

        if (currentBooking == null || currentBooking.getStatus() == BookingStatus.CANCELLED) {
            request.setStatus(TripExtensionStatus.CANCELLED);
            extensionRequestRepository.save(request);
            throw new IllegalStateException("Lịch đặt của người yêu cầu đã bị hủy, không thể chấp nhận gia hạn.");
        }

        if (affectedBooking == null || affectedBooking.getStatus() == BookingStatus.CANCELLED) {
            request.setStatus(TripExtensionStatus.CANCELLED);
            extensionRequestRepository.save(request);
            throw new IllegalStateException("Lịch đặt của bạn đã bị hủy, không thể thực hiện nhường lịch.");
        }

        // Atomic Revalidation: Ensure no newly conflicting bookings were created in the yield interval
        List<Booking> unexpectedConflicts = bookingRepository.findConflictingBookingsExcluding(
                request.getVehicle().getId(),
                currentBooking.getId(),
                request.getOriginalEndTime(),
                request.getProposedEndTime(),
                List.of(BookingStatus.CONFIRMED, BookingStatus.PENDING)
        );

        for (Booking c : unexpectedConflicts) {
            if (!c.getId().equals(affectedBooking.getId())) {
                throw new IllegalStateException("Không thể chấp nhận do phát sinh lịch đặt trùng khác.");
            }
        }

        // Apply schedule updates
        currentBooking.setEndTime(request.getProposedEndTime());
        affectedBooking.setStartTime(request.getProposedEndTime()); // Preserves original affectedBooking.getEndTime()

        bookingRepository.save(currentBooking);
        bookingRepository.save(affectedBooking);

        request.setStatus(TripExtensionStatus.APPROVED);
        TripExtensionRequest approved = extensionRequestRepository.save(request);

        // Notify requester and staff
        notificationService.notifyRequesterExtensionApproved(approved);
        notificationService.notifyStaffTripExtended(trip, approved.getAdditionalMinutes(), approved.getProposedEndTime());

        log.info("TripExtensionRequest {} APPROVED by user {}. CurrentBooking {} end extended to {}, AffectedBooking {} start shifted to {}",
                requestId, currentUserId, currentBooking.getId(), currentBooking.getEndTime(), affectedBooking.getId(), affectedBooking.getStartTime());

        TripExtensionRequestResponse res = TripExtensionRequestResponse.fromEntity(approved);
        res.setMessage("Bạn đã đồng ý nhường lịch thành công.");
        return res;
    }

    /**
     * Affected co-owner rejects the yield request.
     */
    @Transactional
    public TripExtensionRequestResponse rejectExtensionRequest(
            UUID requestId, UUID currentUserId, Role currentUserRole) {

        TripExtensionRequest request = extensionRequestRepository.findByIdWithDetails(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu nhường lịch với mã: " + requestId));

        if (currentUserRole != Role.ADMIN && (request.getAffectedOwner() == null || !request.getAffectedOwner().getId().equals(currentUserId))) {
            throw new AccessDeniedException("Bạn không có quyền từ chối yêu cầu này.");
        }

        if (request.getStatus() != TripExtensionStatus.PENDING) {
            throw new IllegalStateException("Yêu cầu không còn ở trạng thái chờ phản hồi.");
        }

        request.setStatus(TripExtensionStatus.REJECTED);
        TripExtensionRequest rejected = extensionRequestRepository.save(request);

        notificationService.notifyRequesterExtensionRejected(rejected);

        log.info("TripExtensionRequest {} REJECTED by user {}", requestId, currentUserId);

        TripExtensionRequestResponse res = TripExtensionRequestResponse.fromEntity(rejected);
        res.setMessage("Bạn đã từ chối yêu cầu nhường lịch.");
        return res;
    }

    /**
     * Requester cancels their pending yield request.
     */
    @Transactional
    public TripExtensionRequestResponse cancelExtensionRequest(
            UUID requestId, UUID currentUserId, Role currentUserRole) {

        TripExtensionRequest request = extensionRequestRepository.findByIdWithDetails(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu nhường lịch với mã: " + requestId));

        if (currentUserRole != Role.ADMIN && (request.getRequester() == null || !request.getRequester().getId().equals(currentUserId))) {
            throw new AccessDeniedException("Chỉ người tạo yêu cầu mới có quyền hủy yêu cầu này.");
        }

        if (request.getStatus() != TripExtensionStatus.PENDING) {
            throw new IllegalStateException("Yêu cầu không còn ở trạng thái chờ phản hồi.");
        }

        request.setStatus(TripExtensionStatus.CANCELLED);
        TripExtensionRequest cancelled = extensionRequestRepository.save(request);

        log.info("TripExtensionRequest {} CANCELLED by requester {}", requestId, currentUserId);

        TripExtensionRequestResponse res = TripExtensionRequestResponse.fromEntity(cancelled);
        res.setMessage("Đã hủy yêu cầu nhường lịch.");
        return res;
    }

    /**
     * Retrieve the currently active pending extension request for a trip (if any).
     */
    @Transactional
    public Optional<TripExtensionRequestResponse> getActiveRequestForTrip(
            UUID tripId, UUID currentUserId, Role currentUserRole) {

        Optional<TripExtensionRequest> opt = extensionRequestRepository.findFirstByTripIdAndStatusOrderByCreatedAtDesc(
                tripId, TripExtensionStatus.PENDING);

        if (opt.isEmpty()) {
            return Optional.empty();
        }

        TripExtensionRequest request = opt.get();
        Instant now = Instant.now();

        // Expire if deadline passed
        if (now.isAfter(request.getResponseDeadline()) || now.isAfter(request.getCurrentBooking().getEndTime())) {
            request.setStatus(TripExtensionStatus.EXPIRED);
            extensionRequestRepository.save(request);
            return Optional.empty();
        }

        return Optional.of(TripExtensionRequestResponse.fromEntity(request));
    }

    /**
     * Retrieve pending extension requests awaiting current user's decision.
     */
    @Transactional
    public List<TripExtensionRequestResponse> getPendingRequestsForUser(UUID userId) {
        Instant now = Instant.now();
        List<TripExtensionRequest> list = extensionRequestRepository.findByAffectedOwnerIdAndStatusOrderByCreatedAtDesc(
                userId, TripExtensionStatus.PENDING);

        return list.stream()
                .filter(r -> {
                    if (now.isAfter(r.getResponseDeadline()) || now.isAfter(r.getCurrentBooking().getEndTime())) {
                        r.setStatus(TripExtensionStatus.EXPIRED);
                        extensionRequestRepository.save(r);
                        return false;
                    }
                    return true;
                })
                .map(TripExtensionRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Retrieve specific request details by ID.
     */
    @Transactional(readOnly = true)
    public TripExtensionRequestResponse getRequestById(UUID requestId) {
        TripExtensionRequest request = extensionRequestRepository.findByIdWithDetails(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu nhường lịch với mã: " + requestId));
        return TripExtensionRequestResponse.fromEntity(request);
    }

    /**
     * Invalidate pending requests when trip return is requested or completed.
     */
    @Transactional
    public void invalidatePendingRequestsForTrip(UUID tripId) {
        List<TripExtensionRequest> requests = extensionRequestRepository.findByTripIdOrderByCreatedAtDesc(tripId);
        for (TripExtensionRequest r : requests) {
            if (r.getStatus() == TripExtensionStatus.PENDING) {
                r.setStatus(TripExtensionStatus.CANCELLED);
                extensionRequestRepository.save(r);
            }
        }
    }
}
