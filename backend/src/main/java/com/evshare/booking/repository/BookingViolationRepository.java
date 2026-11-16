package com.evshare.booking.repository;

import com.evshare.booking.entity.BookingViolation;
import com.evshare.booking.entity.BookingViolationStatus;
import com.evshare.booking.entity.BookingViolationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingViolationRepository extends JpaRepository<BookingViolation, UUID> {

    boolean existsByBookingId(UUID bookingId);

    boolean existsByBookingIdAndViolationType(UUID bookingId, BookingViolationType violationType);

    boolean existsByBookingIdAndResolutionStatusIn(UUID bookingId, Collection<BookingViolationStatus> statuses);

    Optional<BookingViolation> findByBookingId(UUID bookingId);

    @Query("SELECT v FROM BookingViolation v JOIN FETCH v.booking JOIN FETCH v.vehicle JOIN FETCH v.user WHERE v.booking.id = :bookingId")
    Optional<BookingViolation> findByBookingIdWithDetails(@Param("bookingId") UUID bookingId);

    List<BookingViolation> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<BookingViolation> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    List<BookingViolation> findByResolutionStatusOrderByCreatedAtDesc(BookingViolationStatus status);

    List<BookingViolation> findAllByOrderByCreatedAtDesc();

    @Query("SELECT v FROM BookingViolation v WHERE v.vehicle.id = :vehicleId AND v.resolutionStatus = 'RECOVERY_PENDING'")
    List<BookingViolation> findPendingRecoveryByVehicleId(@Param("vehicleId") UUID vehicleId);

    List<BookingViolation> findByBookingIdIn(Collection<UUID> bookingIds);
}
