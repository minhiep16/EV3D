package com.evshare.handover.repository;

import com.evshare.handover.entity.VehicleInspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleInspectionRepository extends JpaRepository<VehicleInspection, UUID> {

    List<VehicleInspection> findByHandoverIdOrderByInspectedAtAsc(UUID handoverId);

    Optional<VehicleInspection> findByHandoverIdAndVehiclePartCode(UUID handoverId, String vehiclePartCode);

    long countByHandoverId(UUID handoverId);
}
