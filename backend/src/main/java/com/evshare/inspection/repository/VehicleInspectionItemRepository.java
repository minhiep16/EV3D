package com.evshare.inspection.repository;

import com.evshare.inspection.entity.VehicleInspectionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleInspectionItemRepository extends JpaRepository<VehicleInspectionItem, UUID> {

    List<VehicleInspectionItem> findByInspectionIdOrderByCreatedAtAsc(UUID inspectionId);

    Optional<VehicleInspectionItem> findByInspectionIdAndVehiclePartCode(UUID inspectionId, String vehiclePartCode);
}
