package com.evshare.trip.repository;

import com.evshare.trip.entity.TripExtensionRequest;
import com.evshare.trip.entity.TripExtensionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TripExtensionRequestRepository extends JpaRepository<TripExtensionRequest, UUID> {

    @Query("SELECT r FROM TripExtensionRequest r " +
           "JOIN FETCH r.requester " +
           "JOIN FETCH r.vehicle " +
           "JOIN FETCH r.trip " +
           "JOIN FETCH r.currentBooking " +
           "LEFT JOIN FETCH r.affectedOwner " +
           "LEFT JOIN FETCH r.affectedBooking " +
           "WHERE r.id = :id")
    Optional<TripExtensionRequest> findByIdWithDetails(@Param("id") UUID id);

    List<TripExtensionRequest> findByTripIdOrderByCreatedAtDesc(UUID tripId);

    List<TripExtensionRequest> findByVehicleIdAndStatus(UUID vehicleId, TripExtensionStatus status);

    Optional<TripExtensionRequest> findFirstByTripIdAndStatusOrderByCreatedAtDesc(UUID tripId, TripExtensionStatus status);

    List<TripExtensionRequest> findByAffectedOwnerIdAndStatusOrderByCreatedAtDesc(UUID affectedOwnerId, TripExtensionStatus status);

    List<TripExtensionRequest> findByRequesterIdAndStatusOrderByCreatedAtDesc(UUID requesterId, TripExtensionStatus status);

    List<TripExtensionRequest> findByCurrentBookingIdAndStatus(UUID currentBookingId, TripExtensionStatus status);

    List<TripExtensionRequest> findByAffectedBookingIdAndStatus(UUID affectedBookingId, TripExtensionStatus status);

    @Query("SELECT r FROM TripExtensionRequest r " +
           "WHERE r.status = 'PENDING' AND (r.responseDeadline < :now OR r.currentBooking.endTime < :now)")
    List<TripExtensionRequest> findExpiredPendingRequests(@Param("now") Instant now);
}
