package com.evshare.booking.service;

import com.evshare.booking.dto.BookingResponse;
import com.evshare.booking.dto.CreateBookingRequest;
import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private static final List<BookingStatus> ACTIVE_STATUSES = List.of(BookingStatus.CONFIRMED, BookingStatus.PENDING);

    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final com.evshare.ownership.service.CoOwnershipService coOwnershipService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.notification.service.NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.trip.repository.TripRepository tripRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.handover.repository.VehicleHandoverRepository handoverRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.trip.repository.TripExtensionRequestRepository extensionRequestRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.maintenance.repository.MaintenanceRequestRepository maintenanceRequestRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.charging.repository.ChargingSessionRepository chargingSessionRepository;

    public BookingService(
            BookingRepository bookingRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository
    ) {
        this(bookingRepository, vehicleRepository, userRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public BookingService(
            BookingRepository bookingRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            com.evshare.ownership.service.CoOwnershipService coOwnershipService
    ) {
        this.bookingRepository = bookingRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.coOwnershipService = coOwnershipService;
    }

    @Transactional
    public List<BookingResponse> getBookingsByVehicle(UUID vehicleId) {
        if (!vehicleRepository.existsById(vehicleId)) {
            throw new ResourceNotFoundException("Xe không tồn tại trong hệ thống: " + vehicleId);
        }
        reconcileExpiredBookingsForVehicle(vehicleId);
        return bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicleId)
                .stream()
                .map(BookingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public boolean isBookingExpired(Booking booking, Instant now) {
        if (booking == null) return false;
        if (booking.getStatus() == BookingStatus.EXPIRED) return true;
        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) return false;

        if (booking.getEndTime() != null && now.isAfter(booking.getEndTime())) {
            // Protect active/overdue trips
            if (tripRepository != null && tripRepository.existsByBooking_IdAndStatus(booking.getId(), com.evshare.trip.entity.TripStatus.ACTIVE)) {
                return false;
            }
            // Protect handovers already completed awaiting trip start or return verification
            if (handoverRepository != null) {
                java.util.Optional<com.evshare.handover.entity.VehicleHandover> hOpt = handoverRepository.findByBookingId(booking.getId());
                if (hOpt.isPresent()) {
                    com.evshare.handover.entity.HandoverStatus st = hOpt.get().getStatus();
                    if (st == com.evshare.handover.entity.HandoverStatus.HANDED_OVER ||
                        st == com.evshare.handover.entity.HandoverStatus.OWNER_CONFIRMED ||
                        st == com.evshare.handover.entity.HandoverStatus.COMPLETED) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }

    public void reconcileExpiredBookingsForVehicle(UUID vehicleId) {
        if (vehicleId == null) return;
        Instant now = Instant.now();
        List<Booking> bookings = bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicleId);
        for (Booking b : bookings) {
            if ((b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING) && isBookingExpired(b, now)) {
                try {
                    b.setStatus(BookingStatus.EXPIRED);
                    bookingRepository.save(b);
                    log.info("Transitioned unconsummated booking {} for vehicle {} to EXPIRED status", b.getId(), vehicleId);
                    if (handoverRepository != null) {
                        handoverRepository.findByBookingId(b.getId()).ifPresent(h -> {
                            if (h.getStatus() == com.evshare.handover.entity.HandoverStatus.PENDING_PREPARATION ||
                                h.getStatus() == com.evshare.handover.entity.HandoverStatus.READY_FOR_HANDOVER) {
                                h.setStatus(com.evshare.handover.entity.HandoverStatus.CANCELLED);
                                handoverRepository.save(h);
                            }
                        });
                    }
                } catch (Exception ex) {
                    log.warn("Failed to reconcile expired booking {}: {}", b.getId(), ex.getMessage());
                }
            } else if (b.getStatus() == BookingStatus.COMPLETED && b.getEndTime() != null && b.getEndTime().isAfter(now)) {
                // Global Early Return Slot Release reconciliation:
                // Ensure completed bookings do not occupy future slots beyond their actual return
                try {
                    if (b.getOriginalEndTime() == null) {
                        b.setOriginalEndTime(b.getEndTime());
                    }
                    if (b.getOriginalStartTime() == null) {
                        b.setOriginalStartTime(b.getStartTime());
                    }
                    Instant effectiveEnd = now;
                    if (tripRepository != null) {
                        var tripOpt = tripRepository.findByBookingId(b.getId());
                        if (tripOpt.isPresent() && tripOpt.get().getEndedAt() != null) {
                            effectiveEnd = tripOpt.get().getEndedAt();
                        }
                    }
                    if (effectiveEnd.isBefore(b.getStartTime())) {
                        b.setStartTime(effectiveEnd);
                        b.setEndTime(effectiveEnd);
                    } else {
                        b.setEndTime(effectiveEnd);
                    }
                    bookingRepository.save(b);
                    log.info("Reconciled early return slot release for completed booking {}", b.getId());
                } catch (Exception ex) {
                    log.warn("Failed to reconcile early return for completed booking {}: {}", b.getId(), ex.getMessage());
                }
            }
        }
    }

    public BookingResponse createBooking(UUID vehicleId, UUID userId, CreateBookingRequest request) {
        // 1. Validate startTime < endTime
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new IllegalArgumentException("Thời gian bắt đầu và kết thúc không được để trống.");
        }
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
        }

        // 1b. Validate Minimum & Maximum Booking Duration Policy
        java.time.Duration duration = java.time.Duration.between(request.getStartTime(), request.getEndTime());
        if (duration.toMinutes() < 60) {
            throw new IllegalArgumentException("Thời gian đặt xe tối thiểu là 1 giờ.");
        }
        if (duration.toHours() > 72) {
            throw new IllegalArgumentException("Thời gian đặt xe tối đa không được vượt quá 72 giờ (3 ngày).");
        }

        // 2. Validate not in past (grace period of 120s for clock drift)
        if (request.getStartTime().isBefore(Instant.now().minusSeconds(120))) {
            throw new IllegalArgumentException("Không thể đặt xe trong quá khứ.");
        }

        // 3. Validate Vehicle & User existence
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại trong hệ thống: " + vehicleId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + userId));

        // 3b. Verify Active Co-Ownership Membership for CO_OWNER
        if (user.getRole() == com.evshare.user.entity.Role.CO_OWNER && coOwnershipService != null) {
            if (!coOwnershipService.isUserActiveMemberForVehicle(userId, vehicleId)) {
                throw new AccessDeniedException("Bạn không phải là thành viên hoạt động của nhóm đồng sở hữu xe này.");
            }
        }

        // 3c. Scheduled Maintenance Restrictions (Only blocks if requested interval conflicts with scheduled maintenance)
        if (maintenanceRequestRepository != null) {
            List<com.evshare.maintenance.entity.MaintenanceRequest> scheduled =
                    maintenanceRequestRepository.findByVehicleIdAndStatus(vehicleId, com.evshare.maintenance.entity.MaintenanceStatus.SCHEDULED);
            for (com.evshare.maintenance.entity.MaintenanceRequest m : scheduled) {
                Instant mStart = m.getScheduledAt();
                if (mStart != null && !request.getStartTime().isAfter(mStart) && request.getEndTime().isAfter(mStart)) {
                    throw new IllegalArgumentException("Xe đã có lịch bảo dưỡng kỹ thuật trong khung giờ này.");
                }
            }
        }

        // 3d. Active Charging Restrictions (Only blocks immediate start if vehicle is currently charging)
        if (chargingSessionRepository != null) {
            var activeCharging = chargingSessionRepository.findFirstByVehicleIdAndStatusOrderByStartedAtDesc(
                    vehicleId, com.evshare.charging.entity.ChargingSessionStatus.ACTIVE);
            if (activeCharging.isPresent()) {
                if (request.getStartTime().isBefore(Instant.now().plus(java.time.Duration.ofMinutes(15)))) {
                    throw new IllegalArgumentException("Xe đang trong trụ sạc điện. Vui lòng chọn thời gian sau khi hoàn tất sạc.");
                }
            }
        }

        // 4. Overlap & Conflict detection with other members' bookings on this vehicle
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                vehicleId,
                request.getStartTime(),
                request.getEndTime(),
                ACTIVE_STATUSES
        );

        if (!conflicts.isEmpty()) {
            log.warn("Booking conflict detected for vehicle {} between {} and {}", vehicleId, request.getStartTime(), request.getEndTime());
            throw new IllegalArgumentException("Khung giờ này đã được đặt. Vui lòng chọn thời gian khác.");
        }

        // 4b. Overlap with the same member's existing bookings
        List<Booking> userConflicts = bookingRepository.findConflictingUserBookings(
                userId,
                request.getStartTime(),
                request.getEndTime(),
                ACTIVE_STATUSES
        );
        if (!userConflicts.isEmpty()) {
            throw new IllegalArgumentException("Bạn đã có một lịch đặt xe khác trong khung giờ này.");
        }

        // 5. Persist booking
        Booking booking = new Booking(
                UUID.randomUUID(),
                vehicle,
                user,
                request.getStartTime(),
                request.getEndTime(),
                BookingStatus.CONFIRMED,
                request.getPurpose()
        );
        booking.setOriginalStartTime(request.getStartTime());
        booking.setOriginalEndTime(request.getEndTime());

        Booking saved = bookingRepository.save(booking);
        log.info("Booking created successfully with ID: {} for user: {} on vehicle: {}", saved.getId(), userId, vehicleId);

        if (notificationService != null) {
            try {
                notificationService.notifyBookingConfirmed(saved);
            } catch (Exception ex) {
                log.error("Failed to send booking notification for booking {}: {}", saved.getId(), ex.getMessage(), ex);
            }
        }

        return BookingResponse.fromEntity(saved);
    }

    public BookingResponse cancelBooking(UUID bookingId, UUID userId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch đặt xe không tồn tại: " + bookingId));

        if (!isAdmin && !booking.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Bạn không có quyền hủy lịch đặt này.");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Lịch đặt này đã được hủy trước đó.");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new IllegalArgumentException("Không thể hủy lịch đặt đã hoàn thành.");
        }

        // Verify no active or completed trip exists
        if (tripRepository != null) {
            boolean hasTrip = tripRepository.existsByBookingIdAndStatus(bookingId, com.evshare.trip.entity.TripStatus.ACTIVE)
                    || tripRepository.existsByBookingIdAndStatus(bookingId, com.evshare.trip.entity.TripStatus.COMPLETED);
            if (hasTrip) {
                throw new IllegalStateException("Không thể hủy lịch đặt khi chuyến đi đang diễn ra hoặc đã hoàn thành.");
            }
        }

        // Verify handover state
        Instant now = Instant.now();
        Instant prepWindowStart = booking.getStartTime() != null
                ? booking.getStartTime().minus(java.time.Duration.ofMinutes(120))
                : now;
        boolean isWithinOrPastHandoverWindow = !now.isBefore(prepWindowStart.minusSeconds(30));

        if (handoverRepository != null) {
            handoverRepository.findByBookingId(bookingId).ifPresent(handover -> {
                boolean isHandedOver = handover.getStatus() == com.evshare.handover.entity.HandoverStatus.HANDED_OVER ||
                                       handover.getStatus() == com.evshare.handover.entity.HandoverStatus.OWNER_CONFIRMED ||
                                       handover.getStatus() == com.evshare.handover.entity.HandoverStatus.COMPLETED;
                // Only block cancellation if the vehicle was legitimately handed over during or after the valid preparation window
                if (isHandedOver && isWithinOrPastHandoverWindow) {
                    throw new IllegalStateException("Không thể hủy lịch đặt khi xe đã được bàn giao.");
                }
                // If handover is premature (outside valid preparation window) or in progress/scheduled, cancel it
                handover.setStatus(com.evshare.handover.entity.HandoverStatus.CANCELLED);
                handoverRepository.save(handover);
                log.info("Handover {} for booking {} marked as CANCELLED during booking cancellation", handover.getId(), bookingId);
            });
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking updated = bookingRepository.save(booking);
        log.info("Booking {} cancelled by user {}", bookingId, userId);

        if (extensionRequestRepository != null) {
            try {
                List<com.evshare.trip.entity.TripExtensionRequest> reqsAsCurrent =
                        extensionRequestRepository.findByCurrentBookingIdAndStatus(bookingId, com.evshare.trip.entity.TripExtensionStatus.PENDING);
                for (com.evshare.trip.entity.TripExtensionRequest r : reqsAsCurrent) {
                    r.setStatus(com.evshare.trip.entity.TripExtensionStatus.CANCELLED);
                    extensionRequestRepository.save(r);
                }

                List<com.evshare.trip.entity.TripExtensionRequest> reqsAsAffected =
                        extensionRequestRepository.findByAffectedBookingIdAndStatus(bookingId, com.evshare.trip.entity.TripExtensionStatus.PENDING);
                for (com.evshare.trip.entity.TripExtensionRequest r : reqsAsAffected) {
                    r.setStatus(com.evshare.trip.entity.TripExtensionStatus.CANCELLED);
                    extensionRequestRepository.save(r);
                }
            } catch (Exception ex) {
                log.warn("Failed to invalidate pending extension requests for cancelled booking {}: {}", bookingId, ex.getMessage());
            }
        }

        if (notificationService != null) {
            try {
                notificationService.notifyBookingCancelled(updated);
            } catch (Exception ex) {
                log.warn("Failed to notify booking cancellation for {}: {}", bookingId, ex.getMessage());
            }
        }

        return BookingResponse.fromEntity(updated);
    }

    public BookingResponse extendBooking(UUID bookingId, UUID userId, com.evshare.booking.dto.ExtendBookingRequest request, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch đặt xe không tồn tại: " + bookingId));

        if (!isAdmin && !booking.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Bạn không có quyền gia hạn lịch đặt này.");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Không thể gia hạn lịch đặt đã bị hủy.");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new IllegalStateException("Không thể gia hạn lịch đặt đã hoàn thành.");
        }

        if (request.getNewEndTime() == null || !request.getNewEndTime().isAfter(booking.getEndTime())) {
            throw new IllegalArgumentException("Thời gian kết thúc mới phải sau thời gian kết thúc hiện tại.");
        }

        // Conflict check with other bookings
        List<Booking> conflicts = bookingRepository.findConflictingBookingsExcluding(
                booking.getVehicle().getId(),
                booking.getId(),
                booking.getEndTime(),
                request.getNewEndTime(),
                ACTIVE_STATUSES
        );

        if (!conflicts.isEmpty()) {
            log.warn("Booking extension conflict detected for vehicle {} between {} and {}",
                    booking.getVehicle().getId(), booking.getEndTime(), request.getNewEndTime());
            throw new IllegalArgumentException("Không thể gia hạn vì ảnh hưởng đến lịch đặt của thành viên tiếp theo.");
        }

        // Check if vehicle in maintenance
        if (booking.getVehicle().getStatus() == VehicleStatus.MAINTENANCE) {
            throw new IllegalStateException("Phương tiện đang trong lịch bảo dưỡng, không thể gia hạn thêm.");
        }

        booking.setEndTime(request.getNewEndTime());
        Booking saved = bookingRepository.save(booking);
        log.info("Booking {} successfully extended to {} by user {}", bookingId, request.getNewEndTime(), userId);

        return BookingResponse.fromEntity(saved);
    }
}
