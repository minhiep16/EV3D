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

    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId AND b.vehicle.id = :vehicleId ORDER BY b.startTime DESC")
    List<Booking> findByUserIdAndVehicleIdOrderByStartTimeDesc(@Param("userId") UUID userId, @Param("vehicleId") UUID vehicleId);

    long countByStatusIn(Collection<BookingStatus> statuses);

    @Query("SELECT b FROM Booking b WHERE b.vehicle.id = :vehicleId " +
           "AND b.status IN :activeStatuses " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(
            @Param("vehicleId") UUID vehicleId,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime,
            @Param("activeStatuses") Collection<BookingStatus> activeStatuses
    );

    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId " +
           "AND b.status IN :activeStatuses " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findConflictingUserBookings(
            @Param("userId") UUID userId,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime,
            @Param("activeStatuses") Collection<BookingStatus> activeStatuses
    );

    @Query("SELECT b FROM Booking b WHERE b.vehicle.id = :vehicleId " +
           "AND b.id <> :excludeBookingId " +
           "AND b.status IN :activeStatuses " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findConflictingBookingsExcluding(
            @Param("vehicleId") UUID vehicleId,
            @Param("excludeBookingId") UUID excludeBookingId,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime,
            @Param("activeStatuses") Collection<BookingStatus> activeStatuses
    );

    @Query("SELECT b FROM Booking b WHERE b.vehicle.id = :vehicleId " +
           "AND b.status = 'CONFIRMED' " +
           "AND b.startTime <= :time AND b.endTime >= :time ORDER BY b.startTime DESC")
    List<Booking> findBookingsByVehicleAndOccurredTime(
            @Param("vehicleId") UUID vehicleId,
            @Param("time") Instant time
    );

    @Query("SELECT b FROM Booking b JOIN FETCH b.vehicle JOIN FETCH b.user WHERE b.id = :id")
    java.util.Optional<Booking> findByIdWithVehicleAndUser(@Param("id") UUID id);

    @Query("SELECT b FROM Booking b JOIN FETCH b.vehicle JOIN FETCH b.user WHERE b.status = 'CONFIRMED' AND b.startTime <= :cutoffTime")
    List<Booking> findPotentialNoShowBookings(@Param("cutoffTime") Instant cutoffTime);
}
