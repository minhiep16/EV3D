package com.evshare.energy.repository;

import com.evshare.energy.entity.VehicleEnergyInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleEnergyInventoryRepository extends JpaRepository<VehicleEnergyInventory, UUID> {

    @Query("SELECT i FROM VehicleEnergyInventory i JOIN FETCH i.vehicle WHERE i.vehicle.id = :vehicleId")
    Optional<VehicleEnergyInventory> findByVehicleId(@Param("vehicleId") UUID vehicleId);

    boolean existsByVehicleId(UUID vehicleId);
}
