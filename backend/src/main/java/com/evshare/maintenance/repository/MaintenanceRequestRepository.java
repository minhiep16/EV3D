package com.evshare.maintenance.repository;

import com.evshare.maintenance.entity.MaintenanceRequest;
import com.evshare.maintenance.entity.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, UUID> {

    @Query("SELECT m FROM MaintenanceRequest m " +
           "LEFT JOIN FETCH m.damageRecords " +
           "LEFT JOIN FETCH m.createdBy " +
           "LEFT JOIN FETCH m.assignedStaff " +
           "WHERE m.vehicle.id = :vehicleId " +
           "ORDER BY m.createdAt DESC")
    List<MaintenanceRequest> findByVehicleIdOrderByCreatedAtDesc(@Param("vehicleId") UUID vehicleId);

    @Query("SELECT m FROM MaintenanceRequest m " +
           "LEFT JOIN FETCH m.damageRecords " +
           "LEFT JOIN FETCH m.createdBy " +
           "LEFT JOIN FETCH m.assignedStaff " +
           "WHERE m.id = :id")
    Optional<MaintenanceRequest> findByIdWithDetails(@Param("id") UUID id);

    boolean existsByVehicleIdAndStatus(UUID vehicleId, MaintenanceStatus status);

    List<MaintenanceRequest> findByVehicleIdAndStatus(UUID vehicleId, MaintenanceStatus status);
}
