package com.evshare.handover.repository;

import com.evshare.handover.entity.HandoverStatus;
import com.evshare.handover.entity.VehicleHandover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleHandoverRepository extends JpaRepository<VehicleHandover, UUID> {

    Optional<VehicleHandover> findByBookingId(UUID bookingId);

    @Query("SELECT h FROM VehicleHandover h WHERE h.vehicle.id = :vehicleId AND h.status NOT IN ('COMPLETED', 'CANCELLED') ORDER BY CASE WHEN h.status = 'HANDED_OVER' THEN 1 WHEN h.status = 'READY_FOR_HANDOVER' THEN 2 WHEN h.status = 'INSPECTION_IN_PROGRESS' THEN 3 ELSE 4 END, h.booking.startTime ASC")
    List<VehicleHandover> findActiveByVehicleId(@Param("vehicleId") UUID vehicleId);

    @Query("SELECT h FROM VehicleHandover h WHERE h.coOwner.id = :userId AND h.vehicle.id = :vehicleId AND h.status NOT IN ('COMPLETED', 'CANCELLED') ORDER BY CASE WHEN h.status = 'HANDED_OVER' THEN 1 WHEN h.status = 'READY_FOR_HANDOVER' THEN 2 WHEN h.status = 'INSPECTION_IN_PROGRESS' THEN 3 ELSE 4 END, h.booking.startTime ASC")
    List<VehicleHandover> findActiveByCoOwnerAndVehicle(@Param("userId") UUID userId, @Param("vehicleId") UUID vehicleId);

    List<VehicleHandover> findByStatus(HandoverStatus status);
}
