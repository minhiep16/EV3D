package com.evshare.inspection.repository;

import com.evshare.inspection.entity.InspectionStatus;
import com.evshare.inspection.entity.VehicleInspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleInspectionRepository extends JpaRepository<VehicleInspection, UUID> {

    @Query("SELECT vi FROM VehicleInspection vi WHERE vi.vehicle.id = :vehicleId AND vi.status = 'COMPLETED' ORDER BY vi.completedAt DESC")
    List<VehicleInspection> findCompletedByVehicleIdOrderByCompletedAtDesc(@Param("vehicleId") UUID vehicleId);

    default Optional<VehicleInspection> findLatestCompletedByVehicleId(UUID vehicleId) {
        List<VehicleInspection> list = findCompletedByVehicleIdOrderByCompletedAtDesc(vehicleId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Query("SELECT vi FROM VehicleInspection vi WHERE vi.vehicle.id = :vehicleId AND vi.status = 'IN_PROGRESS' ORDER BY vi.startedAt DESC")
    List<VehicleInspection> findInProgressByVehicleIdOrderByStartedAtDesc(@Param("vehicleId") UUID vehicleId);

    default Optional<VehicleInspection> findActiveByVehicleId(UUID vehicleId) {
        List<VehicleInspection> list = findInProgressByVehicleIdOrderByStartedAtDesc(vehicleId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    List<VehicleInspection> findByVehicleIdOrderByStartedAtDesc(UUID vehicleId);
}
