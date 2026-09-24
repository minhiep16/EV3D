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

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByVehicle(UUID vehicleId) {
        if (!vehicleRepository.existsById(vehicleId)) {
            throw new ResourceNotFoundException("Xe không tồn tại trong hệ thống: " + vehicleId);
        }
        return bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicleId)
                .stream()
                .map(BookingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public BookingResponse createBooking(UUID vehicleId, UUID userId, CreateBookingRequest request) {
        // 1. Validate startTime < endTime
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new IllegalArgumentException("Thời gian bắt đầu và kết thúc không được để trống.");
        }
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
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

        // 4. Overlap & Conflict detection
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

        Booking saved = bookingRepository.save(booking);
        log.info("Booking created successfully with ID: {} for user: {} on vehicle: {}", saved.getId(), userId, vehicleId);
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

        booking.setStatus(BookingStatus.CANCELLED);
        Booking updated = bookingRepository.save(booking);
        log.info("Booking {} cancelled by user {}", bookingId, userId);
        return BookingResponse.fromEntity(updated);
    }
}
