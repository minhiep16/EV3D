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

    @Query("SELECT h FROM VehicleHandover h WHERE h.vehicle.id = :vehicleId " +
           "AND h.status NOT IN (com.evshare.handover.entity.HandoverStatus.COMPLETED, com.evshare.handover.entity.HandoverStatus.CANCELLED) " +
           "AND (h.status IN (com.evshare.handover.entity.HandoverStatus.HANDED_OVER, com.evshare.handover.entity.HandoverStatus.OWNER_CONFIRMED) OR " +
           "     (h.booking.endTime > :cutoff AND h.booking.status NOT IN (com.evshare.booking.entity.BookingStatus.CANCELLED, com.evshare.booking.entity.BookingStatus.EXPIRED, com.evshare.booking.entity.BookingStatus.COMPLETED))) " +
           "ORDER BY CASE " +
           "  WHEN h.status = com.evshare.handover.entity.HandoverStatus.HANDED_OVER THEN 1 " +
           "  WHEN h.status = com.evshare.handover.entity.HandoverStatus.OWNER_CONFIRMED THEN 2 " +
           "  WHEN h.status = com.evshare.handover.entity.HandoverStatus.READY_FOR_HANDOVER THEN 3 " +
           "  WHEN h.status = com.evshare.handover.entity.HandoverStatus.INSPECTION_IN_PROGRESS THEN 4 " +
           "  ELSE 5 END, h.booking.startTime ASC")
    List<VehicleHandover> findActiveByVehicleId(@Param("vehicleId") UUID vehicleId, @Param("cutoff") java.time.Instant cutoff);

    default List<VehicleHandover> findActiveByVehicleId(UUID vehicleId) {
        return findActiveByVehicleId(vehicleId, java.time.Instant.now().minusSeconds(7200));
    }

    @Query("SELECT h FROM VehicleHandover h WHERE h.coOwner.id = :userId AND h.vehicle.id = :vehicleId " +
           "AND h.status NOT IN (com.evshare.handover.entity.HandoverStatus.COMPLETED, com.evshare.handover.entity.HandoverStatus.CANCELLED) " +
           "AND (h.status IN (com.evshare.handover.entity.HandoverStatus.HANDED_OVER, com.evshare.handover.entity.HandoverStatus.OWNER_CONFIRMED) OR " +
           "     (h.booking.endTime > :cutoff AND h.booking.status NOT IN (com.evshare.booking.entity.BookingStatus.CANCELLED, com.evshare.booking.entity.BookingStatus.EXPIRED, com.evshare.booking.entity.BookingStatus.COMPLETED))) " +
           "ORDER BY CASE " +
           "  WHEN h.status = com.evshare.handover.entity.HandoverStatus.HANDED_OVER THEN 1 " +
           "  WHEN h.status = com.evshare.handover.entity.HandoverStatus.OWNER_CONFIRMED THEN 2 " +
           "  WHEN h.status = com.evshare.handover.entity.HandoverStatus.READY_FOR_HANDOVER THEN 3 " +
           "  WHEN h.status = com.evshare.handover.entity.HandoverStatus.INSPECTION_IN_PROGRESS THEN 4 " +
           "  ELSE 5 END, h.booking.startTime ASC")
    List<VehicleHandover> findActiveByCoOwnerAndVehicle(@Param("userId") UUID userId, @Param("vehicleId") UUID vehicleId, @Param("cutoff") java.time.Instant cutoff);

    default List<VehicleHandover> findActiveByCoOwnerAndVehicle(UUID userId, UUID vehicleId) {
        return findActiveByCoOwnerAndVehicle(userId, vehicleId, java.time.Instant.now().minusSeconds(7200));
    }

    List<VehicleHandover> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    @Query("SELECT h.inspection.id FROM VehicleHandover h WHERE h.vehicle.id = :vehicleId AND h.inspection IS NOT NULL " +
           "AND (:excludeHandoverId IS NULL OR h.id <> :excludeHandoverId) " +
           "AND h.status IN (com.evshare.handover.entity.HandoverStatus.READY_FOR_HANDOVER, com.evshare.handover.entity.HandoverStatus.HANDED_OVER, com.evshare.handover.entity.HandoverStatus.OWNER_CONFIRMED, com.evshare.handover.entity.HandoverStatus.COMPLETED)")
    java.util.Set<UUID> findUsedInspectionIds(@Param("vehicleId") UUID vehicleId, @Param("excludeHandoverId") UUID excludeHandoverId);

    List<VehicleHandover> findByStatus(HandoverStatus status);

    @Query("SELECT h FROM VehicleHandover h WHERE h.vehicle.id = :vehicleId " +
           "AND h.status IN (com.evshare.handover.entity.HandoverStatus.HANDED_OVER, com.evshare.handover.entity.HandoverStatus.OWNER_CONFIRMED) " +
           "AND (:excludeHandoverId IS NULL OR h.id <> :excludeHandoverId)")
    List<VehicleHandover> findCustodyHandoversForVehicle(
            @Param("vehicleId") UUID vehicleId,
            @Param("excludeHandoverId") UUID excludeHandoverId
    );

    Optional<VehicleHandover> findFirstByVehicleIdAndStatusInOrderByStaffHandedOverAtDesc(
            UUID vehicleId,
            java.util.Collection<HandoverStatus> statuses
    );
}
