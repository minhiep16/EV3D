package com.evshare.booking.repository;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByVehicleIdOrderByStartTimeAsc(UUID vehicleId);

    List<Booking> findByVehicleIdAndStatusInOrderByStartTimeAsc(UUID vehicleId, Collection<BookingStatus> statuses);

    List<Booking> findByUserIdOrderByStartTimeDesc(UUID userId);

    @Query("SELECT b FROM Booking b WHERE b.vehicle.id = :vehicleId " +
           "AND b.status IN :activeStatuses " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(
            @Param("vehicleId") UUID vehicleId,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime,
            @Param("activeStatuses") Collection<BookingStatus> activeStatuses
    );
}
