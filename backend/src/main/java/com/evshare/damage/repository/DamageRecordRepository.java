package com.evshare.damage.repository;

import com.evshare.damage.entity.DamageRecord;
import com.evshare.damage.entity.DamageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DamageRecordRepository extends JpaRepository<DamageRecord, UUID> {

    List<DamageRecord> findByTripIdOrderByCreatedAtDesc(UUID tripId);

    List<DamageRecord> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    List<DamageRecord> findByBookingIdOrderByCreatedAtDesc(UUID bookingId);

    @Query("SELECT d FROM DamageRecord d WHERE d.vehicle.id = :vehicleId AND d.status <> :status ORDER BY d.createdAt DESC")
    List<DamageRecord> findByVehicleIdAndStatusNotOrderByCreatedAtDesc(
            @Param("vehicleId") UUID vehicleId,
            @Param("status") DamageStatus status
    );

    default List<DamageRecord> findByVehicleIdAndStatusNot(UUID vehicleId, DamageStatus status) {
        return findByVehicleIdAndStatusNotOrderByCreatedAtDesc(vehicleId, status);
    }

    @Query("SELECT d FROM DamageRecord d WHERE d.vehicle.id = :vehicleId AND d.vehiclePartCode = :partCode AND d.status <> :status")
    List<DamageRecord> findByVehicleIdAndVehiclePartCodeAndStatusNot(
            @Param("vehicleId") UUID vehicleId,
            @Param("partCode") String partCode,
            @Param("status") DamageStatus status
    );
}
