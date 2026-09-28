package com.evshare.damage.service;

import com.evshare.booking.entity.Booking;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.damage.dto.CreateDamageRequest;
import com.evshare.damage.dto.DamageRecordResponse;
import com.evshare.damage.entity.DamageRecord;
import com.evshare.damage.repository.DamageRecordRepository;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehiclePartCode;
import com.evshare.vehicle.repository.VehicleRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class DamageService {

    public static final Set<String> VALID_SEMANTIC_PARTS = VehiclePartCode.VALID_CODES;

    private final DamageRecordRepository damageRecordRepository;
    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleHandoverRepository handoverRepository;
    private final UserRepository userRepository;

    public DamageService(DamageRecordRepository damageRecordRepository,
                         TripRepository tripRepository,
                         VehicleRepository vehicleRepository,
                         VehicleHandoverRepository handoverRepository,
                         UserRepository userRepository) {
        this.damageRecordRepository = damageRecordRepository;
        this.tripRepository = tripRepository;
        this.vehicleRepository = vehicleRepository;
        this.handoverRepository = handoverRepository;
        this.userRepository = userRepository;
    }

    /**
     * STAFF creates a precise 3D damage record linked to a completed trip.
     * Enforces strict business validations and authoritative data derivation.
     */
    @Transactional
    public DamageRecordResponse createDamage(UUID tripId, CreateDamageRequest request, UUID currentUserId, Role currentUserRole) {
        // 1. Role validation: STAFF only
        if (currentUserRole != Role.STAFF) {
            throw new AccessDeniedException("Chỉ nhân viên vận hành (STAFF) mới có quyền ghi nhận hư hỏng");
        }

        // 2. Trip existence and status validation
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với mã: " + tripId));

        if (trip.getStatus() != TripStatus.COMPLETED) {
            throw new IllegalStateException("Chuyến đi chưa hoàn tất. Chỉ có thể ghi nhận hư hỏng sau khi chuyến đi đã kết thúc.");
        }

        // 3. Semantic part validation
        String partCode = request.getVehiclePartCode() != null ? request.getVehiclePartCode().trim().toUpperCase() : "";
        if (!VehiclePartCode.isValid(partCode)) {
            throw new IllegalArgumentException("Mã bộ phận phương tiện không hợp lệ: " + request.getVehiclePartCode());
        }

        // 4. Coordinates validation
        validateCoordinates(request);

        // 5. Derive entities from authoritative trip
        Vehicle vehicle = trip.getVehicle();
        if (vehicle == null) {
            throw new IllegalStateException("Chuyến đi thiếu thông tin phương tiện");
        }

        Booking booking = trip.getBooking();
        if (booking == null) {
            throw new IllegalStateException("Chuyến đi thiếu thông tin lịch đặt");
        }

        VehicleHandover handover = handoverRepository.findByBookingId(booking.getId()).orElse(null);

        User author = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng tạo ghi nhận"));

        // 6. Build and persist DamageRecord
        DamageRecord record = new DamageRecord(
                UUID.randomUUID(),
                vehicle,
                trip,
                booking,
                handover,
                partCode,
                request.getDamageType(),
                request.getSeverity(),
                request.getNote(),
                request.getLocalPositionX(),
                request.getLocalPositionY(),
                request.getLocalPositionZ(),
                author
        );

        DamageRecord saved = damageRecordRepository.save(record);
        return DamageRecordResponse.fromEntity(saved);
    }

    /**
     * STAFF creates damage record directly for vehicle, attaching to its latest completed trip.
     */
    @Transactional
    public DamageRecordResponse createDamageForVehicle(UUID vehicleId, CreateDamageRequest request, UUID currentUserId, Role currentUserRole) {
        if (currentUserRole != Role.STAFF) {
            throw new AccessDeniedException("Chỉ nhân viên vận hành (STAFF) mới có quyền ghi nhận hư hỏng");
        }

        Trip recentCompletedTrip = tripRepository.findFirstByVehicleIdAndStatusOrderByEndedAtDesc(vehicleId, TripStatus.COMPLETED)
                .orElseThrow(() -> new IllegalStateException("Phương tiện chưa có chuyến đi nào hoàn tất để ghi nhận hư hỏng"));

        return createDamage(recentCompletedTrip.getId(), request, currentUserId, currentUserRole);
    }

    /**
     * Retrieve damage records for a trip.
     * STAFF & ADMIN can view any trip.
     * CO_OWNER can view damages belonging to their own completed trip.
     */
    @Transactional(readOnly = true)
    public List<DamageRecordResponse> getDamagesByTrip(UUID tripId, UUID currentUserId, Role currentUserRole) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với mã: " + tripId));

        if (currentUserRole == Role.CO_OWNER) {
            if (trip.getUser() == null || !trip.getUser().getId().equals(currentUserId)) {
                throw new AccessDeniedException("Bạn không có quyền xem thông tin hư hỏng của chuyến đi này");
            }
        }

        return damageRecordRepository.findByTripIdOrderByCreatedAtDesc(tripId)
                .stream()
                .map(DamageRecordResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieve damage records for a vehicle (operational overview / inspection history).
     */
    @Transactional(readOnly = true)
    public List<DamageRecordResponse> getDamagesByVehicle(UUID vehicleId) {
        if (!vehicleRepository.existsById(vehicleId)) {
            throw new ResourceNotFoundException("Không tìm thấy phương tiện với mã: " + vehicleId);
        }

        return damageRecordRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream()
                .map(DamageRecordResponse::fromEntity)
                .toList();
    }

    private void validateCoordinates(CreateDamageRequest request) {
        if (request.getLocalPositionX() == null || request.getLocalPositionY() == null || request.getLocalPositionZ() == null) {
            throw new IllegalArgumentException("Tọa độ 3D không được để trống");
        }
        double x = request.getLocalPositionX().doubleValue();
        double y = request.getLocalPositionY().doubleValue();
        double z = request.getLocalPositionZ().doubleValue();
        if (Double.isNaN(x) || Double.isInfinite(x) ||
            Double.isNaN(y) || Double.isInfinite(y) ||
            Double.isNaN(z) || Double.isInfinite(z)) {
            throw new IllegalArgumentException("Vị trí hư hỏng không hợp lệ. Tọa độ phải là số thực hữu hạn.");
        }
    }
}
