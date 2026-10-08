package com.evshare.trip.repository;

import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TripRepository extends JpaRepository<Trip, UUID> {

    Optional<Trip> findByBookingId(UUID bookingId);

    Optional<Trip> findByVehicleIdAndStatus(UUID vehicleId, TripStatus status);

    boolean existsByVehicleIdAndStatus(UUID vehicleId, TripStatus status);

    boolean existsByBookingId(UUID bookingId);

    boolean existsByBooking_IdAndStatus(UUID bookingId, TripStatus status);

    boolean existsByBookingIdAndStatus(UUID bookingId, TripStatus status);

    List<Trip> findByUserIdAndStatus(UUID userId, TripStatus status);

    @Query("SELECT t FROM Trip t WHERE t.vehicle.id = :vehicleId AND t.status = 'ACTIVE'")
    Optional<Trip> findActiveTripByVehicleId(@Param("vehicleId") UUID vehicleId);

    Optional<Trip> findFirstByVehicleIdAndStatusOrderByEndedAtDesc(UUID vehicleId, TripStatus status);

    Optional<Trip> findFirstByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    @Query("SELECT t FROM Trip t WHERE t.vehicle.id = :vehicleId AND t.startedAt <= :time AND (t.endedAt IS NULL OR t.endedAt >= :time) ORDER BY t.startedAt DESC")
    List<Trip> findTripsByVehicleAndOccurredTime(@Param("vehicleId") UUID vehicleId, @Param("time") java.time.Instant time);

    @Query("SELECT t FROM Trip t WHERE t.vehicle.id = :vehicleId AND t.status = 'COMPLETED' AND ((t.startedAt >= :start AND t.startedAt < :end) OR (t.endedAt IS NOT NULL AND t.endedAt >= :start AND t.endedAt < :end)) ORDER BY t.startedAt ASC")
    List<Trip> findCompletedTripsByVehicleInPeriod(
            @Param("vehicleId") UUID vehicleId,
            @Param("start") java.time.Instant start,
            @Param("end") java.time.Instant end
    );
}
