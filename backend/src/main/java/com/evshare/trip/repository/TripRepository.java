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

    List<Trip> findByUserIdAndStatus(UUID userId, TripStatus status);

    @Query("SELECT t FROM Trip t WHERE t.vehicle.id = :vehicleId AND t.status = 'ACTIVE'")
    Optional<Trip> findActiveTripByVehicleId(@Param("vehicleId") UUID vehicleId);
}
